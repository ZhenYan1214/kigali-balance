"""Run the end-of-life closure check on one simulator output folder and write its report.

Usage: python run_closure.py [--data ../simulator/out] [--out out/closure] [--cutoff 2025-09-30]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from kigali_ai.closure import run_closure
from kigali_ai.observations import load_observations

here = Path(__file__).resolve().parent


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--data", default=str(here.parent / "simulator" / "out"))
    ap.add_argument("--out", default=str(here / "out" / "closure"))
    ap.add_argument("--cutoff", default=None, help="only use data dated on or before this date")
    args = ap.parse_args()

    report = run_closure(load_observations(args.data, args.cutoff))
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "closure.json").write_text(json.dumps(report.to_dict(), indent=2, default=str), encoding="utf-8", newline="\n")

    t = report.totals
    print(f"{report.model} {report.model_version}  model {report.model_hash[:12]}  input {report.input_snapshot[:12]}")
    print(f"registered units removed from service: {t['closed']} (recovery recorded {t['recovered']}, "
          f"no recovery record {t['no_record']}, pending {t['pending']})")
    print(f"estimated refrigerant unaccounted for: {t['missing_kg_low']:,} to {t['missing_kg_high']:,} kg "
          f"({t['missing_tco2e_low']:,} to {t['missing_tco2e_high']:,} tCO2e)")
    for c in report.companies:
        if c.severity != "none":
            print(f"  {c.severity:>6} {c.actor}: " + "; ".join(c.reasons))
    print(f"-> {out}")


if __name__ == "__main__":
    main()
