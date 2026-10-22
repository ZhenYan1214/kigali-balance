"""Build the demo video: narration, camera moves over screenshots and slides, burned-in subtitles.

    python video/capture.py           # screenshots of the live site and the slides (video/assets/)
    python video/make_video.py        # -> video/build/kigali_balance_demo.mp4 (+ .srt for YouTube)

Narration comes from video/narration.json. Each sentence is synthesised with a Microsoft Edge neural
voice (the `edge-tts` package; the sentence text is sent to Microsoft's speech service) and cached in
video/build/tts/. To use a human voice instead, record one file per segment and save it as
video/voice/<segment id>.wav (or .mp3 / .m4a); that segment then uses the recording, and its subtitles
are timed in proportion to the words in each sentence.

Needs: ffmpeg on PATH (with libass), Pillow, and edge-tts unless every segment has a recording.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
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


def to_wav(src: Path, dst: Path) -> None:
    subprocess.run([ffmpeg(), "-y", "-loglevel", "error", "-i", str(src), "-ac", "1", "-ar", str(RATE),
                    "-sample_fmt", "s16", str(dst)], check=True)


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
            to_wav(rec, wav)
            dur = wav_seconds(wav)
            words = [max(1, len(s["text"].split())) for s in seg["sentences"]]
            acc = t
            for s, n in zip(seg["sentences"], words):
                d = dur * n / sum(words)
                timeline.append({"seg": seg["id"], "text": s["text"], "start": acc, "end": acc + d})
                acc += d
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


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    spec = json.loads((HERE / "narration.json").read_text(encoding="utf-8"))
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
