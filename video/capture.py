"""Capture the screenshots the demo video uses (high resolution, from the public site).

    python video/capture.py            # writes video/assets/*.png

Each capture uses its own browser profile: Chromium hands a second launch with the same profile to
the first process and exits, so captures would otherwise be lost.
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
# the public site by default; KB_SITE=http://localhost:8000 captures a local `python -m http.server -d web` instead
SITE = os.environ.get("KB_SITE", "https://zhenyan1214.github.io/kigali-balance")
SHOTS = {
    # name: (url, window height in CSS px); width is always 1920, device scale 2
    "passport": (f"{SITE}/passport.html?lot=42", 2300),
    "dashboard": (f"{SITE}/index.html", 3800),
    "actions": ("https://github.com/ZhenYan1214/kigali-balance/actions/workflows/verify.yml", 1300),
}


SLIDES = ["never", "gwp", "silos", "premium", "audit", "rule", "flow", "checks", "terminal", "redteam", "ai",
          "adaptive", "impact", "start", "end"]
for _s in SLIDES:
    SHOTS[f"slide-{_s}"] = ((HERE / "slides.html").as_uri() + f"?s={_s}", 1080)


def browser() -> str:
    for p in (r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe"):
        if Path(p).exists():
            return p
    for name in ("chromium", "chromium-browser", "google-chrome", "msedge"):
        if shutil.which(name):
            return shutil.which(name)
    raise SystemExit("needs Edge, Chrome or Chromium")


def capture(name: str, url: str, height: int) -> Path:
    out = ASSETS / f"{name}-2x.png"
    before = out.stat().st_mtime if out.exists() else 0
    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as profile:  # the browser may still hold cache files
        subprocess.run([browser(), "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={profile}",
                        "--force-device-scale-factor=2", "--virtual-time-budget=12000", f"--window-size=1920,{height}",
                        f"--screenshot={out}", url], capture_output=True, timeout=120)
        for _ in range(60):
            if out.exists() and out.stat().st_mtime > before and out.stat().st_size > 0:
                break
            time.sleep(0.5)
    if not out.exists() or out.stat().st_mtime <= before:
        raise SystemExit(f"no screenshot written for {name}")
    return out


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    names = sys.argv[1:] or list(SHOTS)
    for n in names:
        url, h = SHOTS[n]
        print("captured", capture(n, url, h))


if __name__ == "__main__":
    main()
