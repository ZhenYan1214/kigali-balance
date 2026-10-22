# Your own narration (optional)

The video uses a synthetic voice until you put recordings here. One file per segment, named exactly:

| File | Lines (from `../narration.json`) |
|---|---|
| `1-case.m4a` | "This is lot 42 …" to "… The gap it exposes is real." |
| `2-problem.m4a` | "HFC refrigerants are super-pollutants." to "… a credit draws on." |
| `3-rule.m4a` | "Kigali Balance enforces one rule." to "… claimed by one registry, once." |
| `4-evidence.m4a` | "Does it hold?" to "… run on every push." |
| `5-ai.m4a` | "So how was lot 42 caught?" to "… instead of 136." |
| `6-impact.m4a` | "Kigali Balance claims no credits …" to "Every kilogram has to add up." |

`.wav` or `.mp3` also work.

How to record:
- Use a phone's voice recorder in a quiet room, about 20 cm from the mouth.
- Read slowly; a pause between sentences is fine.
- Trim the silence at the start and end.

Then run:

```bash
python video/make_video.py
```

Segments with a recording use it; the others keep the synthetic voice. Subtitles follow the words in each sentence. Recordings are personal data and are not committed: this folder only tracks this README.
