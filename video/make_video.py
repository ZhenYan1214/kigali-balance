"""Build the demo video: narration, camera moves over screenshots and slides, burned-in subtitles.

    python video/capture.py           # screenshots of the live site and the slides (video/assets/)
    python video/make_video.py        # -> video/build/kigali_balance_demo.mp4 (+ .srt for YouTube)

Narration comes from video/narration.json. Each sentence is synthesised with a Microsoft Edge neural
voice (the `edge-tts` package; the sentence text is sent to Microsoft's speech service) and cached in
video/build/tts/. To use a human voice instead, record one file per segment and save it as
video/voice/<segment id>.wav (or .mp3 / .m4a); that segment then uses the recording (denoised, sped up by
`recording_tempo`, levelled to -16 LUFS). Its subtitles start where each sentence's first word is heard
(local speech recognition with faster-whisper, if installed), or else at the pauses that keep the pace
most even.

Needs: ffmpeg on PATH (with libass and rubberband), Pillow, and edge-tts unless every segment has a
recording. Optional: faster-whisper and numpy, for subtitle timing on recordings.
"""
from __future__ import annotations

import asyncio
import difflib
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build"
TTS = BUILD / "tts"
VOICE = HERE / "voice"
ASSETS = HERE / "assets"
W, H, FPS = 1920, 1080, 30
RATE = 24000                 # audio sample rate
LEAD, TAIL = 0.5, 2.4        # silence before the first word / after the last
SENTENCE_GAP, SEGMENT_GAP = 0.2, 0.55
CROSSFADE = 0.45
# libass sizes SRT styles against a 384x288 script canvas, so margins and font size are in those units
SUB_STYLE = ("FontName=Segoe UI,FontSize=13,PrimaryColour=&H00FFFFFF,OutlineColour=&H26000000,"
             "BorderStyle=3,Outline=2,Shadow=0,MarginV=12,MarginL=24,MarginR=24")


def ffmpeg() -> str:
    exe = shutil.which("ffmpeg")
    if not exe:
        raise SystemExit("ffmpeg not found on PATH")
    return exe


def to_wav(src: Path, dst: Path, af: str = "") -> None:
    """Convert to mono 16-bit WAV, optionally through an ffmpeg audio filter chain."""
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(src), *(["-af", af] if af else []), "-ac", "1",
                    "-ar", str(RATE), "-sample_fmt", "s16", str(dst)], check=True)


def speech_threshold(wav: Path) -> float:
    """Level (dB) separating speech from room noise: 12 dB above the quietest tenth of 50 ms frames."""
    p = subprocess.run([ffmpeg(), "-hide_banner", "-i", str(wav), "-af", f"asetnsamples=n={RATE // 20},"
                        "astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level",
                        "-f", "null", "-"], capture_output=True, text=True, errors="replace")
    levels = sorted(float(x) for x in re.findall(r"RMS_level=(-?[\d.]+)\b", p.stderr))
    return min(-20.0, levels[len(levels) // 10] + 12) if levels else -38.0


def loudness(wav: Path) -> float:
    """Integrated loudness (LUFS) from ffmpeg's EBU R128 meter."""
    p = subprocess.run([ffmpeg(), "-hide_banner", "-i", str(wav), "-af", "ebur128", "-f", "null", "-"],
                       capture_output=True, text=True, errors="replace")
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", p.stderr)[-1])


def clean_recording(src: Path, dst: Path, tempo: float) -> None:
    """Phone recording -> narration: cut rumble and hiss, speed up without changing pitch, cut the
    silence at both ends (relative to this recording's own noise floor), then set loudness to -16 LUFS."""
    tmp, cut_tmp = dst.with_suffix(".clean.wav"), dst.with_suffix(".cut.wav")
    stretch = f",rubberband=tempo={tempo}:transients=smooth:formant=preserved" if tempo != 1 else ""
    to_wav(src, tmp, f"highpass=f=80,afftdn=nf=-30:nr=12{stretch}")
    cut = f"silenceremove=start_periods=1:start_threshold={speech_threshold(tmp):.0f}dB:start_silence=0.15"
    to_wav(tmp, cut_tmp, f"{cut},areverse,{cut},areverse")
    to_wav(cut_tmp, dst, f"volume={-16 - loudness(cut_tmp):.2f}dB,alimiter=limit=0.84:level=false")
    tmp.unlink()
    cut_tmp.unlink()


def pauses(wav: Path) -> list[tuple[float, float]]:
    """(where speech resumes less 0.1 s, pause length) for each pause >= 0.12 s below the speech
    threshold, from ffmpeg's silencedetect."""
    p = subprocess.run([ffmpeg(), "-hide_banner", "-i", str(wav), "-af",
                        f"silencedetect=noise={speech_threshold(wav):.0f}dB:d=0.12",
                        "-f", "null", "-"], capture_output=True, text=True, errors="replace")
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", p.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", p.stderr)]
    return [(max(a, b - 0.1), b - a) for a, b in zip(starts, ends)]


PAUSE_WEIGHT = 0.6  # how strongly a longer pause attracts a sentence break, against an even speaking pace


_ASR = None


def heard_words(wav: Path) -> list[tuple[str, float]] | None:
    """(word, start time) as recognised locally by faster-whisper; None when it is not installed."""
    global _ASR
    try:
        import numpy as np
        from faster_whisper import WhisperModel
    except ImportError:
        return None
    if _ASR is None:
        _ASR = WhisperModel("base.en", device="cpu", compute_type="int8")
    # decode with ffmpeg ourselves: faster-whisper's own decoder breaks with some PyAV versions
    pcm = subprocess.run([ffmpeg(), "-loglevel", "error", "-i", str(wav), "-ac", "1", "-ar", "16000", "-f", "f32le",
                          "-"], capture_output=True, check=True).stdout
    segs, _ = _ASR.transcribe(np.frombuffer(pcm, dtype=np.float32), language="en", word_timestamps=True)
    return [(w.word, w.start) for s in segs for w in s.words]


def heard_starts(wav: Path, sentences: list[dict]) -> list[float | None] | None:
    """When each sentence after the first starts, from speech recognition aligned to the script, so a
    misheard word does not matter; None for a sentence whose opening words could not be matched."""
    heard = heard_words(wav)
    if heard is None:
        return None
    norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())  # noqa: E731
    script = [(norm(w), i) for i, s in enumerate(sentences) for w in s["text"].split() if norm(w)]
    sm = difflib.SequenceMatcher(None, [w for w, _ in script], [norm(w) for w, _ in heard], autojunk=False)
    match = {a + k: b + k for a, b, n in sm.get_matching_blocks() for k in range(n)}
    starts: list[float | None] = []
    for i in range(1, len(sentences)):
        first = next(k for k, (_, si) in enumerate(script) if si == i)
        # the first word, or the second or third when recognition garbled the first (then step back to it)
        hit = next(((k - first, match[k]) for k in range(first, first + 3)
                    if k in match and script[k][1] == i), None)
        starts.append(heard[max(0, hit[1] - hit[0])][1] if hit else None)
    return starts


def sentence_spans(wav: Path, sentences: list[dict], dur: float) -> list[tuple[float, float]]:
    """Sentence start/end times in a human recording: where speech recognition hears each sentence begin
    (moved to the end of the pause just before it), and otherwise the pace-based breaks below."""
    paced = pace_breaks(wav, sentences, dur)
    heard = heard_starts(wav, sentences) or [None] * len(paced)
    gaps = pauses(wav)
    cuts = []
    for t, p in zip(heard, paced):
        if t is None:
            cuts.append(p)
            continue
        # Whisper tends to date a word after a pause from inside that pause, so take the longest pause
        # around the heard start and begin where speech resumes after it
        near = [(g, r) for r, g in gaps if t - 0.5 <= r <= t + 1.0]
        cuts.append(max(near)[1] if near else t - 0.1)
    bounds = [0.0, *cuts, dur]
    if any(b - a < 0.3 for a, b in zip(bounds, bounds[1:])):
        print(f"  {wav.name}: recognised starts out of order, timing subtitles by pace only")
        bounds = [0.0, *paced, dur]
    return list(zip(bounds[:-1], bounds[1:]))


def pace_breaks(wav: Path, sentences: list[dict], dur: float) -> list[float]:
    """Sentence breaks without speech recognition. Readers also pause inside sentences, so instead of
    snapping each break to the nearest pause, choose the set of breaks (dynamic programming over all pauses)
    that keeps the pace closest to even, measured in spoken characters, while favouring long pauses."""
    chars = [max(1, sum(ch.isalnum() for ch in s.get("say", s["text"]))) for s in sentences]
    sec_per_char = dur / sum(chars)
    acc, est = 0.0, []
    for c in chars[:-1]:  # word-proportional estimates stay available when pauses are missing
        acc += c * sec_per_char
        est.append((acc, 0.0))
    cands = sorted(p for p in pauses(wav) + est if 0.3 < p[0] < dur - 0.3)

    def pace(span: float, i: int) -> float:
        return math.log(max(span, 0.05) / (chars[i] * sec_per_char)) ** 2

    def pull(gap: float) -> float:
        return PAUSE_WEIGHT * min(gap, 1.0)

    # best[j]: cost of the sentences so far when the latest break is cands[j]; back[i][j] for the path
    best = [pace(t, 0) - pull(g) for t, g in cands]
    back: list[list[int]] = []
    for i in range(1, len(sentences) - 1):
        row, nxt = [], []
        for j, (t, g) in enumerate(cands):
            options = [(best[k] + pace(t - cands[k][0], i), k) for k in range(j) if cands[k][0] < t - 0.3]
            c, k = min(options, default=(math.inf, -1))
            nxt.append(c - pull(g))
            row.append(k)
        best = nxt
        back.append(row)
    if len(sentences) == 1:
        return []
    j = min(range(len(cands)), key=lambda j: best[j] + pace(dur - cands[j][0], len(sentences) - 1))
    cuts = [cands[j][0]]
    for row in reversed(back):
        j = row[j]
        cuts.append(cands[j][0])
    return cuts[::-1]


def wav_seconds(path: Path) -> float:
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


async def synthesise(text: str, voice: str, rate: str, out: Path) -> None:
    import edge_tts  # only needed when a segment has no human recording

    await edge_tts.Communicate(text, voice, rate=rate).save(str(out))


def sentence_audio(sentence: dict, voice: str, rate: str) -> Path:
    say = sentence.get("say", sentence["text"])
    key = hashlib.sha256(f"{voice}|{rate}|{say}".encode()).hexdigest()[:16]
    mp3, wav = TTS / f"{key}.mp3", TTS / f"{key}.wav"
    if not wav.exists():
        if not mp3.exists():
            asyncio.run(synthesise(say, voice, rate, mp3))
        to_wav(mp3, wav)
    return wav


def recording_for(seg_id: str) -> Path | None:
    for ext in (".wav", ".mp3", ".m4a"):
        p = VOICE / f"{seg_id}{ext}"
        if p.exists():
            return p
    return None


# ------------------------------------------------------------------ audio timeline

def build_audio(spec: dict) -> tuple[Path, list[dict], float]:
    """Concatenate narration into one WAV; return it, the per-sentence timeline and the total length."""
    pieces: list[tuple[str, object]] = [("silence", LEAD)]
    timeline: list[dict] = []
    t = LEAD
    for si, seg in enumerate(spec["segments"]):
        if si:
            pieces.append(("silence", SEGMENT_GAP))
            t += SEGMENT_GAP
        rec = recording_for(seg["id"])
        if rec:
            wav = BUILD / f"voice-{seg['id']}.wav"
            clean_recording(rec, wav, spec.get("recording_tempo", 1.0))
            dur = wav_seconds(wav)
            for s, (a, b) in zip(seg["sentences"], sentence_spans(wav, seg["sentences"], dur)):
                timeline.append({"seg": seg["id"], "text": s["text"], "start": t + a, "end": t + b})
            pieces.append(("file", wav))
            t += dur
        else:
            for k, s in enumerate(seg["sentences"]):
                if k:
                    pieces.append(("silence", SENTENCE_GAP))
                    t += SENTENCE_GAP
                wav = sentence_audio(s, spec["voice"], spec["rate"])
                d = wav_seconds(wav)
                timeline.append({"seg": seg["id"], "text": s["text"], "start": t, "end": t + d})
                pieces.append(("file", wav))
                t += d
    pieces.append(("silence", TAIL))
    total = t + TAIL

    out = BUILD / "narration.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        for kind, val in pieces:
            if kind == "silence":
                w.writeframes(b"\x00\x00" * int(RATE * val))
            else:
                with wave.open(str(val)) as r:
                    w.writeframes(r.readframes(r.getnframes()))
    return out, timeline, total


# ------------------------------------------------------------------ subtitles

def srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def split_cue(text: str, limit: int = 88) -> list[str]:
    """Split a long sentence near its middle at punctuation (else at a space)."""
    if len(text) <= limit:
        return [text]
    mid = len(text) // 2
    cuts = [m.end() for m in re.finditer(r"[,;:]\s", text)] or [m.start() + 1 for m in re.finditer(r"\s", text)]
    cut = min(cuts, key=lambda c: abs(c - mid))
    return split_cue(text[:cut].strip(), limit) + split_cue(text[cut:].strip(), limit)


def write_srt(timeline: list[dict], path: Path) -> None:
    cues, n = [], 0
    for item in timeline:
        parts = split_cue(item["text"])
        total = sum(len(p) for p in parts)
        t = item["start"]
        for p in parts:
            d = (item["end"] - item["start"]) * len(p) / total
            n += 1
            cues.append(f"{n}\n{srt_time(t)} --> {srt_time(t + d)}\n{p}\n")
            t += d
    path.write_text("\n".join(cues), encoding="utf-8", newline="\n")


# ------------------------------------------------------------------ pictures

def shot_list(spec: dict, timeline: list[dict], total: float) -> list[dict]:
    shots = []
    for seg in spec["segments"]:
        lines = [x for x in timeline if x["seg"] == seg["id"]]
        for sh in seg["shots"]:
            start = lines[sh["at"]]["start"] - (0.35 if sh["at"] else 0.5)
            shots.append({**sh, "start": max(0.0, start)})
    shots.sort(key=lambda s: s["start"])
    shots[0]["start"] = 0.0
    for a, b in zip(shots, shots[1:]):
        a["end"] = b["start"]
    shots[-1]["end"] = total
    return shots


def ease(p: float) -> float:
    p = min(1.0, max(0.0, p))
    return p * p * (3 - 2 * p)


def rect(r: list[float]) -> tuple[float, float, float, float]:
    x, y, w = r
    return x, y, x + w, y + w * 9 / 16


def frame_of(img: Image.Image, shot: dict, t: float) -> Image.Image:
    p = ease((t - shot["start"]) / max(1e-6, shot["end"] - shot["start"]))
    a, b = rect(shot["from"]), rect(shot["to"])
    box = tuple(a[i] + (b[i] - a[i]) * p for i in range(4))
    return img.transform((W, H), Image.Transform.EXTENT, box, resample=Image.Resampling.BILINEAR)


def render(shots: list[dict], total: float, audio: Path, srt: Path, out: Path) -> None:
    cache: dict[str, Image.Image] = {}

    def img(name: str) -> Image.Image:
        if name not in cache:
            cache[name] = Image.open(ASSETS / f"{name}-2x.png").convert("RGB")
        return cache[name]

    cmd = [ffmpeg(), "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", audio.name, "-vf", f"subtitles={srt.name}:force_style='{SUB_STYLE}'",
           "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest", out.name]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, cwd=BUILD)
    frames = int(total * FPS)
    k = 0
    for f in range(frames):
        t = f / FPS
        while k + 1 < len(shots) and t >= shots[k + 1]["start"]:
            k += 1
        cur = shots[k]
        frame = frame_of(img(cur["src"]), cur, t)
        if k and t - cur["start"] < CROSSFADE:  # dissolve from the previous shot
            prev = shots[k - 1]
            frame = Image.blend(frame_of(img(prev["src"]), prev, t), frame, (t - cur["start"]) / CROSSFADE)
        if f < 12:  # fade in from black
            frame = Image.blend(Image.new("RGB", (W, H)), frame, f / 12)
        if f > frames - 20:  # fade out
            frame = Image.blend(Image.new("RGB", (W, H)), frame, (frames - f) / 20)
        proc.stdin.write(frame.tobytes())
        if f % (FPS * 15) == 0:
            print(f"  {t:5.1f} s / {total:.1f} s", flush=True)
    proc.stdin.close()
    if proc.wait():
        raise SystemExit("ffmpeg failed")


SAY_HINTS = [  # how to read the words a speaker might stumble on
    ("R-404A", "“R four-oh-four A”"), ("R-410A", "“R four-ten A”"), ("CO₂e", "“C-O-two equivalent”"),
    ("CO₂", "“C-O-two”"), ("COP31", "“COP thirty-one”"), ("Türkiye", "“Tur-kee-yeh”"),
    ("0.06", "“zero point zero six”"), ("7,359", "“seven thousand three hundred fifty-nine”"),
    ("140%", "“a hundred and forty percent”"), ("HFC", "“H-F-C”"),
]


def write_reading_script(spec: dict) -> None:
    """video/voice/README.md: the full text to read aloud, regenerated from narration.json."""
    out = ["# Reading script for your own narration", "",
           "Generated from `../narration.json` by `make_video.py`; do not edit by hand.", "",
           "## How to record (中文說明)", "",
           "- 每一段錄成一個檔，檔名照下面的標題，例如 `1-case.m4a`（`.wav`、`.mp3` 也可以），放在這個資料夾。",
           "- **句與句之間停半秒左右**，影片會依停頓對齊字幕和換鏡頭。",
           "- 唸錯請重錄那一段：程式不會自動剪掉重唸的句子。開頭結尾的空白不用剪。",
           "- 手機錄音即可，安靜房間、離嘴約 20 公分，照自己的速度唸就好。",
           "- 錄好後執行 `python video/make_video.py`，有錄音的段落會換成你的聲音，其他段落保留 AI 配音。"
           "錄音會自動降噪、音量拉到 -16 LUFS，並依 `narration.json` 的 `recording_tempo` 加速（音高不變）。"
           "裝了 faster-whisper 的話，字幕會對齊每句第一個字被聽到的時間。", "",
           "## Pronunciation", ""]
    out += [f"- **{w}**: {s}" for w, s in SAY_HINTS]
    total_words = 0
    for seg in spec["segments"]:
        words = sum(len(s["text"].split()) for s in seg["sentences"])
        total_words += words
        out += ["", f"## `{seg['id']}.m4a`  ({words} words, about {words / 2.4:.0f} s)", ""]
        out += [f"{i}. {s['text']}" for i, s in enumerate(seg["sentences"], 1)]
    out += ["", f"Total: {total_words} words, about {total_words / 2.4 / 60:.1f} minutes at 145 words a minute.", "",
            "Recordings are personal data and are not committed: this folder only tracks this file.", ""]
    VOICE.mkdir(exist_ok=True)
    (VOICE / "README.md").write_text("\n".join(out), encoding="utf-8", newline="\n")


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    spec = json.loads((HERE / "narration.json").read_text(encoding="utf-8"))
    write_reading_script(spec)
    if "--script-only" in sys.argv:
        print(f"wrote {VOICE / 'README.md'}")
        return
    BUILD.mkdir(exist_ok=True)
    TTS.mkdir(exist_ok=True)
    audio, timeline, total = build_audio(spec)
    srt = BUILD / "kigali_balance_demo.srt"
    write_srt(timeline, srt)
    shots = shot_list(spec, timeline, total)
    print(f"narration {total:.1f} s, {len(timeline)} sentences, {len(shots)} shots")
    for seg in spec["segments"]:
        lines = [x for x in timeline if x["seg"] == seg["id"]]
        print(f"  {seg['id']:<12} {lines[0]['start']:6.1f}–{lines[-1]['end']:6.1f} s"
              + ("  (your recording)" if recording_for(seg["id"]) else ""))
    out = BUILD / "kigali_balance_demo.mp4"
    render(shots, total, audio, srt, out)
    print(f"wrote {out} ({out.stat().st_size / 1e6:.1f} MB) and {srt.name}")


if __name__ == "__main__":
    main()
