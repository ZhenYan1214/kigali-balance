"""Evaluate the end-of-life closure check on simulated runs.

  python evaluate_closure.py [--seeds 181-190]

The check is a reconciliation with no tuned threshold for its unit list, so there is nothing to
overfit; the question is whether its estimate of the unaccounted mass is honest. Ground truth
(what was really inside each unit at removal) is read here only, never by the check.
"""

from __future__ import annotations
import sys

import argparse
import json
from pathlib import Path

import pandas as pd

from evaluate_module_b import parse_seeds, simulate
from kigali_ai.closure import IPCC_REMAINING, VERSION, run_closure
from kigali_ai.observations import load_observations

here = Path(__file__).resolve().parent


def evaluate(seed: int, cache: Path) -> dict:
    folder = simulate(seed, cache)
    report = run_closure(load_observations(folder))
    truth = json.loads((folder / "ground_truth.json").read_text(encoding="utf-8"))["units"]
    units = pd.DataFrame([u.__dict__ for u in report.units])
    units["true_g"] = units["equipment"].map(lambda i: truth.get(i, {}).get("eolCharge"))
    gap = units[units["status"] == "no_record"]
    return {
        "seed": seed,
        "closed": int(len(units)),
        "recovered": int((units["status"] == "recovered").sum()),
        "no_record": int(len(gap)),
        "pending": int((units["status"] == "pending").sum()),
        "no_record_truly_held_gas": int((gap["true_g"] > 0).sum()),
        "true_kg": round(float(gap["true_g"].sum()) / 1000, 1),
        "est_low_kg": round(float(gap["missing_g_low"].sum()) / 1000, 1),
        "est_high_kg": round(float(gap["missing_g_high"].sum()) / 1000, 1),
        "true_share_of_nameplate": round(float(gap["true_g"].sum() / max(gap["nameplate_g"].sum(), 1)), 3),
        "companies_flagged": sum(c.severity != "none" for c in report.companies),
    }


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):  # cp950 consoles garble en dashes and CJK otherwise
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--seeds", default="181-190")
    ap.add_argument("--cache", default=str(here / ".cache" / "sim"))
    ap.add_argument("--out", default=str(here / "reports"))
    args = ap.parse_args()
    rows = [evaluate(s, Path(args.cache)) for s in parse_seeds(args.seeds)]
    df = pd.DataFrame(rows)
    df["truth_within_range"] = (df["true_kg"] >= df["est_low_kg"]) & (df["true_kg"] <= df["est_high_kg"])
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    df.to_csv(out / "closure_evaluation_rows.csv", index=False, lineterminator="\n")
    s = df.sum(numeric_only=True)
    lines = [
        "# End-of-life closure check: evaluation on simulated data",
        "",
        f"Check `{VERSION}`, seeds {args.seeds} ({len(df)} runs, 36 months each).",
        "",
        "> Simulated data only. The check reads observations only; ground truth (what was really inside each unit at removal) is used here to score it.",
        "",
        "## What it finds",
        "",
        f"- Registered (Tier A) units removed from service: {int(s.closed)}; recovery recorded for {int(s.recovered)}, "
        f"no recovery record for {int(s.no_record)}, still pending {int(s.pending)}.",
        f"- Every unit with no recovery record really left service holding gas in {int(s.no_record_truly_held_gas)} of {int(s.no_record)} cases.",
        f"- Unaccounted mass, all runs: estimated {s.est_low_kg:,.0f} to {s.est_high_kg:,.0f} kg; true {s.true_kg:,.0f} kg "
        f"(truth inside the estimated range in {int(df.truth_within_range.sum())} of {len(df)} runs).",
        f"- Companies flagged for a high closure gap: {int(s.companies_flagged)} (the simulator vents at random, so none should stand out).",
        "",
        "## Per run",
        "",
        "| seed | closed | recovered | no record | pending | true kg | estimate kg | true / nameplate |",
        "|---|---|---|---|---|---|---|---|",
        *[f"| {r.seed} | {r.closed} | {r.recovered} | {r.no_record} | {r.pending} | {r.true_kg:,.0f} | {r.est_low_kg:,.0f}–{r.est_high_kg:,.0f} | {r.true_share_of_nameplate:.2f} |"
          for r in df.itertuples()],
        "",
        "## Reading the results",
        "",
        "- **The unit list is exact by construction in the simulator**: a removed unit with no recovery on the ledger is one whose gas was vented. "
        "In reality some units are removed already empty, or recovered by someone who never reported it; the list is a review queue, not a finding.",
        "- **The mass estimate uses the IPCC 2006 Table 7.9 range of charge remaining at end of life** "
        f"({', '.join(f'{k} {lo:.0%}–{hi:.0%}' for k, (lo, hi) in IPCC_REMAINING.items() if k in ('standalone_commercial', 'medium_large_commercial', 'split_ac', 'chiller'))}).",
        "- **The simulator keeps units nearly full until removal** (honest services top up below 85 % of the nameplate; an assumption marked unverified), "
        "so the true unaccounted mass sits near the top of the IPCC range. That is a limitation of the simulator found in the twelfth review, not evidence that the upper bound is right in reality.",
        "- **Units below the registration threshold (Tier B) are invisible** until someone recovers them, so their venting cannot be seen by this check.",
    ]
    (out / "closure_evaluation.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
