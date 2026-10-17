"""Evaluate AI module A (leakage gaps) against simulator ground truth.

Ground truth is read HERE only. Development used seeds 100-104; the reported numbers come from
held-out seeds 1-20, each scored at 12, 24 and 36 months of data.

Entities: the 40 service companies. Labels:
  naive     records 20 % of top-ups, buys the smuggled gas on invoices
  adaptive  records just enough that each unit's ledger leakage is plausible (between the IPCC
            minimum and midpoint for its category) and pays cash for smuggled gas
  phantom   books fake Tier B recoveries (module C's target); it also buys gas off the ledger,
            so flagging it is a correct finding, reported separately
  honest    everyone else (with honest differences in maintenance quality: 0.7-1.15x leakage)

Usage: python evaluate_module_a.py [--seeds 1-20] [--months 12,24,36]
All results are on SIMULATED data.
"""

from __future__ import annotations
import sys

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.metrics import roc_auc_score

from evaluate_module_b import parse_seeds, sim_dir, simulate
from kigali_ai.module_a import LEAK_BANDS, MODEL_VERSION, PARAMS, model_hash, run_module_a
from kigali_ai.observations import load_observations

here = Path(__file__).resolve().parent


def truth_for(folder: Path) -> tuple[dict[str, str], list[dict]]:
    truth = json.loads((folder / "ground_truth.json").read_text(encoding="utf-8"))
    labels = {s: "phantom" for s in truth["fraud"]["phantomTierBServices"]}
    labels.update(truth["fraud"]["offLedgerProfiles"])
    volume = [{"label": prof, "off_ledger_kg": truth["offLedger"]["topUpsByService"].get(svc, 0) / 1000}
              for svc, prof in truth["fraud"]["offLedgerProfiles"].items()]
    return labels, volume


def metrics(df: pd.DataFrame) -> dict:
    off = df["label"].isin(["naive", "adaptive"])
    buys_off_ledger = off | (df["label"] == "phantom")
    flagged = df["flagged"]
    tp = int((flagged & buys_off_ledger).sum())
    fp = int((flagged & ~buys_off_ledger).sum())
    out = {
        "entities": int(len(df)), "flagged": int(flagged.sum()), "false_positives": fp,
        # a flag is correct when the company really puts gas into equipment or the market off the ledger
        "precision": round(tp / (tp + fp), 3) if tp + fp else None,
        "recall_off_ledger": round(float(flagged[off].mean()), 3),
        "false_positive_rate": round(float(flagged[df["label"] == "honest"].mean()), 3),
    }
    for label in ("naive", "adaptive", "phantom"):
        out[f"flag_rate_{label}"] = round(float(flagged[df["label"] == label].mean()), 3)
        sub = df[df["label"].isin(["honest", label])]
        out[f"auc_{label}"] = round(float(roc_auc_score(sub["label"] == label, sub["score"])), 3)
    return out


def markdown(payload: dict, df: pd.DataFrame) -> str:
    res = pd.DataFrame(payload["results"])
    last = max(payload["months"])
    lines = [
        "# AI module A: evaluation on simulated data",
        "",
        f"Model `{payload['model_version']}` (hash `{payload['model_hash'][:12]}`), held-out seeds "
        f"{payload['seeds'][0]}–{payload['seeds'][-1]}, {len(payload['seeds'])} runs of 40 service companies, each "
        f"scored at {', '.join(str(m) for m in payload['months'])} months of data.",
        "",
        "> " + payload["note"],
        "",
        "Per run: 3 naive off-ledger companies (record 20 % of top-ups, buy smuggled gas on invoices), 3 adaptive "
        "ones (record just enough that every unit's ledger leakage sits between its category's IPCC minimum and "
        "midpoint, pay cash for smuggled gas), 2 phantom-recovery companies (module C's target; they also buy gas "
        "off the ledger) and 32 honest companies whose real maintenance quality varies (0.7–1.15x leakage).",
        "",
        "The module's prior (IPCC leak-rate bands per category) is the same public source the simulator draws "
        "leak rates from, so the leakage signal is tested against a population that matches its prior except for "
        "the honest maintenance spread. Real fleets will not match IPCC this closely.",
        "",
        "## Flags at the fixed threshold (score >= 0.6)",
        "",
        "| months | precision | FPR (honest) | naive flagged | adaptive flagged | phantom flagged | AUC naive | AUC adaptive | AUC phantom |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for _, r in res.iterrows():
        lines.append(
            f"| {int(r["months"])} | {r["precision"]} | {r['false_positive_rate']} | {r['flag_rate_naive']} | "
            f"{r['flag_rate_adaptive']} | {r['flag_rate_phantom']} | {r['auc_naive']} | {r['auc_adaptive']} | {r['auc_phantom']} |"
        )
    lines += ["", "Precision counts a flag as correct when the company really buys or uses gas off the ledger "
              "(naive, adaptive or phantom). AUC is threshold-free, against honest companies.", ""]
    sig = df[df["months"] == last]
    lines += [f"## Which signal carried each profile at {last} months (mean signal score)", "",
              "| profile | A1 purchases off ledger | A2 recorded leakage vs peers | A3 silent units | total |", "|---|---|---|---|---|"]
    for label, g in sig.groupby("label"):
        lines.append(f"| {label} | {g['A1'].mean():.2f} | {g['A2'].mean():.2f} | {g['A3'].mean():.2f} | {g['score'].mean():.2f} |")
    lines += ["", "## Off-ledger top-ups each profile put into equipment (ground truth, 36 months)", "",
              "| profile | mean kg | min kg | max kg |", "|---|---|---|---|"]
    for v in payload["off_ledger_kg_over_36_months"]:
        lines.append(f"| {v['label']} | {v['mean']:,.1f} | {v['min']:,.1f} | {v['max']:,.1f} |")
    hon = sig[sig["label"] == "honest"]
    lines += ["", f"Highest honest score at {last} months: {hon['score'].max():.3f}.", ""]
    lines += [
        "## Version history and known limitations",
        "",
        "- **1.2.0 (round 14) follows a corrected simulator.** The earlier simulator refilled every unit once it was 15 % low, so equipment reached end of life nearly full, contradicting IPCC 2006 Table 7.9 (small units 0–80 % remaining). Since round 14 it follows the leak-check obligation: Tier A units (>= 5 tCO2e) are leak-checked and refilled, Tier B units mostly are not. A2 and A3 therefore judge Tier A units "
        "only. The 1.1.0 report on seeds 21–40 is archived (`module_a_v1.1_seeds21-40.md`); 1.2.0 was looked at on "
        "development seeds 100–104 only and is reported here on fresh seeds 121–140.",
        "- **Known limitation of 1.2.0, found on seeds 121–140 and not fixed (to avoid tuning on test data).** "
        "Every honest flag came from A2 alone. With one leak check a year, a unit found just above 85 % waits "
        "another year for its refill, so refills are lumpier than the 15 % allowance in A2 assumes and a small "
        "fleet can show almost no top-ups for a while. A physical fix (allow one check interval of mid-range "
        "leakage) is left for the next version, to be judged on another set of fresh seeds.",
        "- **1.0.0 was evaluated first, on held-out seeds 1–20** (`module_a_v1.0_seeds1-20.md`). It flagged 1.3 % of "
        "honest companies at 12 months and 0.3 % at 36 months: signal A2 compared recorded top-ups with the full "
        "expected leakage, but top-ups are lumpy (a unit is refilled only once it is ~15 % low). 1.1.0 subtracts "
        "that part. Because seeds 1–20 had then been looked at, **1.1.0 is reported on fresh seeds 21–40**.",
        "- **A2 alone produces the false positives.** Every honest company flagged so far was flagged by A2 "
        "only, and had a small or unusual fleet (little expected refill volume, or a mix the IPCC mid-range does "
        "not describe well). In the first run of 1.1.0 this was about 1 % of honest companies at 12 months and none "
        "at 36; after company sizes were made to differ (0.4–2.5x, added for module C) it is 0.2–0.6 % at every "
        "window. Treat an A2-only flag as a watch list, not a review request. Found on test seeds; not tuned away.",
        "- **The adaptive profile is mostly missed** (AUC barely above 0.5). Each of its units looks plausible and "
        "it buys smuggled gas for cash, so only the company-level leakage distribution can betray it, and honest "
        "maintenance differences hide that. It still put about 40 % as much smuggled gas into equipment as a naive "
        "company. Catching it needs evidence the ledger cannot see: site inspections, leak checks or cylinder "
        "tracking at the smuggler's end.",
        "- **A3 (silent units) rarely fires within three years**: only large commercial units leak enough, even at "
        "the IPCC minimum, to make a missing refill certain. It becomes useful with longer registry histories.",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):  # cp950 consoles garble en dashes and CJK otherwise
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--seeds", default="121-140")
    ap.add_argument("--months", default="12,24,36")
    ap.add_argument("--cache", default=str(here / ".cache" / "sim"))
    ap.add_argument("--report", default=str(here / "reports" / "module_a_evaluation"))
    args = ap.parse_args()

    seeds = parse_seeds(args.seeds)
    months = [int(m) for m in args.months.split(",")]
    start = pd.Timestamp(json.loads((sim_dir / "params.json").read_text(encoding="utf-8"))["simulation"]["startDate"])
    rows, volumes = [], []
    for seed in seeds:
        folder = simulate(seed, Path(args.cache))
        labels, volume = truth_for(folder)
        volumes.extend(volume)
        for m in months:
            cutoff = start + pd.DateOffset(months=m) - pd.Timedelta(seconds=1)
            report = run_module_a(load_observations(folder, cutoff))
            for e in report.entities:
                sig = {s.name.split("_")[0]: s.score for s in e.signals}
                rows.append({"seed": seed, "months": m, "actor": e.actor, "label": labels.get(e.actor, "honest"),
                             "score": e.score, "flagged": e.flagged, **sig,
                             "top_reason": e.reasons[0] if e.reasons else ""})
        print(f"seed {seed} done")

    df = pd.DataFrame(rows)
    results = [{"months": int(m), **metrics(g)} for m, g in df.groupby("months")]
    vol = pd.DataFrame(volumes).groupby("label")["off_ledger_kg"].agg(["mean", "min", "max"]).round(1)
    payload = {
        "note": "Simulated data only. Thresholds were fixed on development seeds before this evaluation; ground truth was used only to score.",
        "model_version": MODEL_VERSION, "model_hash": model_hash(), "params": PARAMS, "leak_bands": LEAK_BANDS,
        "seeds": seeds, "months": months, "results": results,
        "off_ledger_kg_over_36_months": [{"label": k, **v} for k, v in vol.to_dict("index").items()],
    }
    path = Path(args.report)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.with_suffix(".json").write_text(json.dumps(payload, indent=2), encoding="utf-8", newline="\n")
    path.with_suffix(".md").write_text(markdown(payload, df), encoding="utf-8", newline="\n")
    df.to_csv(path.with_name(path.name + "_rows.csv"), index=False, lineterminator="\n")
    print(markdown(payload, df))


if __name__ == "__main__":
    main()
