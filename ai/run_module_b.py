"""Run AI module B on one simulator output folder and write its flags.

Usage: python run_module_b.py [--data ../simulator/out] [--out out/module_b] [--cutoff 2025-09-30]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from kigali_ai.module_b import run_module_b
from kigali_ai.observations import load_observations

here = Path(__file__).resolve().parent


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--data", default=str(here.parent / "simulator" / "out"))
    ap.add_argument("--out", default=str(here / "out" / "module_b"))
    ap.add_argument("--cutoff", default=None, help="only use data dated on or before this date")
    args = ap.parse_args()

    report = run_module_b(load_observations(args.data, args.cutoff))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "flags.json").write_text(json.dumps(report.to_dict(), indent=2, default=str), encoding="utf-8", newline="\n")
    report.to_frame().to_csv(out / "flags.csv", index=False, lineterminator="\n")

    print(f"{report.model} {report.model_version}  model {report.model_hash[:12]}  input {report.input_snapshot[:12]}")
    for e in report.entities:
        mark = {"high": "!!", "review": " !", "none": "  "}[e.severity]
        print(f"{mark} {e.score:5.2f}  {e.actor:<16} {e.role}")
        for r in e.reasons:
            print(f"           - {r}")
    print(f"{len(report.flagged())} of {len(report.entities)} entities flagged for human review -> {out}")


if __name__ == "__main__":
    main()
