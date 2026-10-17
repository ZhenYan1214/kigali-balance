"""Evaluate AI module B against simulator ground truth.

Ground truth is read HERE only, after the module has produced its scores from observations.
Seeds 100-104 were used while developing the module (to look at signal ranges); the reported
numbers come from held-out seeds 1-20, which were never inspected before this evaluation.

Each seed is evaluated at 12, 24 and 36 months of data, with and without the Isolation Forest
signal. Entities: every distributor and reclaimer. Labels: honest, naive fraud, adaptive fraud.

Usage: python evaluate_module_b.py [--seeds 1-20] [--months 12,24,36]
All results are on SIMULATED data and say nothing yet about real-world performance.
"""

from __future__ import annotations
import sys

import argparse
import json
import subprocess
from pathlib import Path

import pandas as pd
from sklearn.metrics import roc_auc_score

from kigali_ai.module_b import MODEL_VERSION, PARAMS, model_hash, run_module_b
from kigali_ai.observations import load_observations

here = Path(__file__).resolve().parent
sim_dir = here.parent / "simulator"


def parse_seeds(text: str) -> list[int]:
    out = []
    for part in text.split(","):
        a, _, b = part.partition("-")
        out.extend(range(int(a), int(b or a) + 1))
    return out


def simulate(seed: int, cache: Path) -> Path:
    out = (cache / f"seed-{seed}").resolve()  # the simulator runs in its own folder
    subprocess.run(["node", "run.mjs", "--seed", str(seed), "--out", str(out)], cwd=sim_dir, check=True,
                   capture_output=True)
    return out


def labels_from_truth(folder: Path) -> tuple[dict[str, str], list[dict]]:
    """Evaluation only: each fraudulent actor's profile, and how much fraudulent volume it moved."""
    truth = json.loads((folder / "ground_truth.json").read_text(encoding="utf-8"))
    labels = {**truth["fraud"]["oversellingProfiles"], **truth["fraud"]["inflatedYieldProfiles"]}
    volume = []
    for dist, profile in truth["fraud"]["oversellingProfiles"].items():
        volume.append({"role": "DISTRIBUTOR", "label": profile,
                       "fraud_kg": truth["offLedger"]["smuggledByDistributor"].get(dist, 0) / 1000})
    # reclaimed output above what the plant's honest efficiency would have produced
    events = pd.read_json(folder / "ledger_events.jsonl", lines=True, convert_dates=False)
    rec = events[(events["type"] == "RECLAIM") & (events["status"] == "accepted")]
    for r, profile in truth["fraud"]["inflatedYieldProfiles"].items():
        own = rec[rec["actor"] == r]
        extra = float((own["outGrams"] - own["inGrams"] * truth["reclaimerYieldCentre"][r]).sum())
        volume.append({"role": "RECLAIMER", "label": profile, "fraud_kg": extra / 1000})
    return labels, volume


def metrics(df: pd.DataFrame) -> dict:
    pos = df["label"] != "honest"
    tp = int((df["flagged"] & pos).sum())
    fp = int((df["flagged"] & ~pos).sum())
    fn = int((~df["flagged"] & pos).sum())
    tn = int((~df["flagged"] & ~pos).sum())
    out = {
        "entities": int(len(df)), "tp": tp, "fp": fp, "fn": fn, "tn": tn,
        "precision": round(tp / (tp + fp), 3) if tp + fp else None,
        "recall": round(tp / (tp + fn), 3) if tp + fn else None,
        "false_positive_rate": round(fp / (fp + tn), 3) if fp + tn else None,
    }
    for (role, label), g in df[pos].groupby(["role", "label"]):
        out[f"recall_{role.lower()}_{label}"] = round(float(g["flagged"].mean()), 3)
    for role, g in df[~pos].groupby("role"):
        out[f"fpr_{role.lower()}"] = round(float(g["flagged"].mean()), 3)
    # threshold-free: how well the score ranks each fraud profile above honest entities of the same role
    for role, g in df.groupby("role"):
        for label in ("naive", "adaptive"):
            sub = g[g["label"].isin(["honest", label])]
            if sub["label"].nunique() == 2:
                out[f"auc_{role.lower()}_{label}"] = round(float(roc_auc_score(sub["label"] == label, sub["score"])), 3)
    return out


def markdown(payload: dict, df: pd.DataFrame) -> str:
    res = pd.DataFrame(payload["results"])
    last = max(payload["months"])
    lines = [
        "# AI module B: evaluation on simulated data",
        "",
        f"Model `{payload['model_version']}` (hash `{payload['model_hash'][:12]}`), held-out seeds "
        f"{payload['seeds'][0]}–{payload['seeds'][-1]}, {len(payload['seeds'])} runs, each scored at "
        f"{', '.join(str(m) for m in payload['months'])} months of data.",
        "",
        "> " + payload["note"],
        "",
        "Per run there are 5 distributors and 4 reclaimers. Fraud: one naive and one adaptive overselling "
        "distributor; one naive and one adaptive yield-inflating reclaimer. The adaptive distributor pads "
        "legitimate invoices inside the 5 % weight tolerance and keeps the total under 2 % of its sales; the "
        "adaptive reclaimer shifts its plant's yield up by 3 points and never touches the 98 % ceiling.",
        "",
        "> Round 14: re-evaluated on a corrected simulator with the model unchanged. The earlier simulator refilled every unit once it was 15 % low, so equipment reached end of life nearly full, contradicting IPCC 2006 Table 7.9 (small units 0–80 % remaining). Since round 14 it follows the leak-check obligation: Tier A units (>= 5 tCO2e) are leak-checked and refilled, Tier B units mostly are not. The seeds 1–20 "
        "report is archived (`module_b_v1_seeds1-20.md`); this report uses fresh seeds 141–160.",
        "",
        "## Flags at the fixed threshold (score >= 0.6)",
        "",
        "| months | variant | precision | recall | FPR | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for _, r in res.iterrows():
        lines.append(
            f"| {r['months']} | {r['variant']} | {r['precision']} | {r['recall']} | {r['false_positive_rate']} | "
            f"{r['recall_distributor_naive']} | {r['recall_distributor_adaptive']} | {r['recall_reclaimer_naive']} | "
            f"{r['recall_reclaimer_adaptive']} |"
        )
    lines += [
        "",
        "## Ranking quality (ROC-AUC against honest entities of the same role, threshold-free)",
        "",
        "| months | variant | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |",
        "|---|---|---|---|---|---|",
    ]
    for _, r in res.iterrows():
        lines.append(
            f"| {r['months']} | {r['variant']} | {r.get('auc_distributor_naive')} | {r.get('auc_distributor_adaptive')} | "
            f"{r.get('auc_reclaimer_naive')} | {r.get('auc_reclaimer_adaptive')} |"
        )
    lines += [
        "",
        "## How much fraudulent volume each profile moved (ground truth, full 36 months)",
        "",
        "Distributors: smuggled gas sold. Reclaimers: reclaimed output above what the plant's honest "
        "efficiency would have produced (virgin gas sold as reclaimed).",
        "",
        "| role | profile | mean kg | min kg | max kg |",
        "|---|---|---|---|---|",
    ]
    for v in payload["fraud_volume_kg_over_36_months"]:
        lines.append(f"| {v['role']} | {v['label']} | {v['mean']:,.1f} | {v['min']:,.1f} | {v['max']:,.1f} |")
    dist = df[df["months"] == last].groupby(["variant", "role", "label"])["score"].describe()[["count", "mean", "min", "max"]]
    lines += ["", f"## Score distribution at {last} months", "", "| variant | role | label | n | mean | min | max |", "|---|---|---|---|---|---|---|"]
    for (variant, role, label), r in dist.iterrows():
        lines.append(f"| {variant} | {role} | {label} | {int(r['count'])} | {r['mean']:.3f} | {r['min']:.3f} | {r['max']:.3f} |")
    return "\n".join(lines) + "\n"


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):  # cp950 consoles garble en dashes and CJK otherwise
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--seeds", default="141-160")
    ap.add_argument("--months", default="12,24,36")
    ap.add_argument("--cache", default=str(here / ".cache" / "sim"))
    ap.add_argument("--report", default=str(here / "reports" / "module_b_evaluation"))
    args = ap.parse_args()

    seeds = parse_seeds(args.seeds)
    months = [int(m) for m in args.months.split(",")]
    sim_params = json.loads((sim_dir / "params.json").read_text(encoding="utf-8"))
    start = pd.Timestamp(sim_params["simulation"]["startDate"])
    cache = Path(args.cache)

    rows, volumes = [], []
    for seed in seeds:
        folder = simulate(seed, cache)
        labels, volume = labels_from_truth(folder)
        volumes.extend({"seed": seed, **v} for v in volume)
        for m in months:
            cutoff = start + pd.DateOffset(months=m) - pd.Timedelta(seconds=1)
            obs = load_observations(folder, cutoff)
            for variant, use_if in (("rules+IF", True), ("rules only", False)):
                report = run_module_b(obs, use_isolation_forest=use_if)
                for e in report.entities:
                    rows.append({"seed": seed, "months": m, "variant": variant, "actor": e.actor, "role": e.role,
                                 "label": labels.get(e.actor, "honest"), "score": e.score, "flagged": e.flagged,
                                 "top_reason": e.reasons[0] if e.reasons else ""})
        print(f"seed {seed} done")

    df = pd.DataFrame(rows)
    results = []
    for (m, variant), g in df.groupby(["months", "variant"]):
        results.append({"months": int(m), "variant": variant, **metrics(g)})

    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    vol = pd.DataFrame(volumes).groupby(["role", "label"])["fraud_kg"].agg(["mean", "min", "max"]).round(1)
    payload = {
        "note": "Simulated data only. Thresholds were fixed before this evaluation; ground truth was used only to score.",
        "model_version": MODEL_VERSION, "model_hash": model_hash(), "params": PARAMS,
        "seeds": seeds, "months": months, "results": results,
        "fraud_volume_kg_over_36_months": [{"role": r, "label": l, **v} for (r, l), v in vol.to_dict("index").items()],
    }
    report_path.with_suffix(".json").write_text(json.dumps(payload, indent=2), encoding="utf-8", newline="\n")
    report_path.with_suffix(".md").write_text(markdown(payload, df), encoding="utf-8", newline="\n")
    df.to_csv(report_path.with_name(report_path.name + "_rows.csv"), index=False, lineterminator="\n")

    print(markdown(payload, df))


if __name__ == "__main__":
    main()
