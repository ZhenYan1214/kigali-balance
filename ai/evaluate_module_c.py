"""Evaluate AI module C (recovery plausibility) against simulator ground truth.

Ground truth is read HERE only. Development used seeds 100-104; the reported numbers come from
fresh held-out seeds 41-60 (seeds 1-40 had been used to evaluate modules A and B; 1.0.0 of this module was evaluated on 41-60, see the report history), each scored at
12, 24 and 36 months of data.

Entities: the 40 service companies and every co-signer of Tier B recoveries (take-back points).
Labels:
  phantom naive     1-4 fake Tier B units a month, recovering ~the full model charge
  phantom adaptive  one fake unit in ~15 % of months, at an honest-looking recovery efficiency
  colluding         the take-back point that co-signs the fake units (it also has honest business)
  honest            everyone else

Usage: python evaluate_module_c.py [--seeds 61-80] [--months 12,24,36]
All results are on SIMULATED data.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.metrics import roc_auc_score

from evaluate_module_b import parse_seeds, sim_dir, simulate
from kigali_ai.module_c import MODEL_VERSION, PARAMS, model_hash, run_module_c
from kigali_ai.observations import load_observations

here = Path(__file__).resolve().parent


def truth_for(folder: Path) -> tuple[dict[str, str], list[dict]]:
    truth = json.loads((folder / "ground_truth.json").read_text(encoding="utf-8"))
    labels = {s: f"phantom {p}" for s, p in truth["fraud"]["phantomProfiles"].items()}
    labels.update({t: "colluding" for t in truth["fraud"]["colludingTakeBackPoints"]})
    units = pd.DataFrame(truth["fraud"]["phantomUnits"])
    volume = []
    for svc, prof in truth["fraud"]["phantomProfiles"].items():
        own = units[units["service"] == svc] if len(units) else units
        volume.append({"label": f"phantom {prof}", "fake_units": int(len(own)),
                       "fake_kg": float(own["grams"].sum() / 1000) if len(own) else 0.0})
    return labels, volume


def metrics(df: pd.DataFrame) -> dict:
    fraud = df["label"] != "honest"
    flagged = df["flagged"]
    tp, fp = int((flagged & fraud).sum()), int((flagged & ~fraud).sum())
    out = {
        "entities": int(len(df)), "flagged": int(flagged.sum()), "false_positives": fp,
        "precision": round(tp / (tp + fp), 3) if tp + fp else None,
        "recall": round(tp / int(fraud.sum()), 3),
        "fpr_service": round(float(flagged[(df["label"] == "honest") & (df["role"] == "SERVICE")].mean()), 3),
        "fpr_cosigner": round(float(flagged[(df["label"] == "honest") & (df["role"] == "CO-SIGNER")].mean()), 3),
    }
    for label in ("phantom naive", "phantom adaptive", "colluding"):
        out[f"flag_rate_{label}"] = round(float(flagged[df["label"] == label].mean()), 3)
        role = "CO-SIGNER" if label == "colluding" else "SERVICE"
        sub = df[(df["role"] == role) & df["label"].isin(["honest", label])]
        out[f"auc_{label}"] = round(float(roc_auc_score(sub["label"] == label, sub["score"])), 3)
    return out


def markdown(payload: dict, df: pd.DataFrame) -> str:
    res = pd.DataFrame(payload["results"])
    last = max(payload["months"])
    lines = [
        "# AI module C: evaluation on simulated data",
        "",
        f"Model `{payload['model_version']}` (hash `{payload['model_hash'][:12]}`), fresh held-out seeds "
        f"{payload['seeds'][0]}–{payload['seeds'][-1]}, {len(payload['seeds'])} runs, each scored at "
        f"{', '.join(str(m) for m in payload['months'])} months of data.",
        "",
        "> " + payload["note"],
        "",
        "Per run: 40 service companies (sizes differ 0.4–2.5x) and 3 take-back points that co-sign Tier B "
        "recoveries. Fraud: one naive phantom-unit company (1–4 fake units a month at ~the full model charge), one "
        "adaptive one (a fake unit in ~15 % of months at an honest-looking efficiency), and one colluding take-back "
        "point that co-signs both, besides its honest business.",
        "",
        "## Flags at the fixed threshold (score >= 0.6)",
        "",
        "| months | precision | recall | FPR services | FPR co-signers | naive flagged | adaptive flagged | colluding flagged | AUC naive | AUC adaptive | AUC colluding |",
        "|---|---|---|---|---|---|---|---|---|---|---|",
    ]
    for _, r in res.iterrows():
        lines.append(
            f"| {int(r['months'])} | {r['precision']} | {r['recall']} | {r['fpr_service']} | {r['fpr_cosigner']} | "
            f"{r['flag_rate_phantom naive']} | {r['flag_rate_phantom adaptive']} | {r['flag_rate_colluding']} | "
            f"{r['auc_phantom naive']} | {r['auc_phantom adaptive']} | {r['auc_colluding']} |"
        )
    sig = df[df["months"] == last]
    cols = [c for c in ("C1", "C2", "C3", "C4", "C5") if c in sig]
    lines += ["", f"## Which signal carried each profile at {last} months (mean signal score)", "",
              "| profile | role | " + " | ".join(cols) + " | total |", "|---|---|" + "---|" * (len(cols) + 1)]
    for (label, role), g in sig.groupby(["label", "role"]):
        vals = " | ".join(f"{g[c].mean():.2f}" if g[c].notna().any() else "–" for c in cols)
        lines.append(f"| {label} | {role} | {vals} | {g['score'].mean():.2f} |")
    lines += ["", "## Fake recoveries each phantom profile booked (ground truth, 36 months)", "",
              "| profile | mean fake units | mean kg | min kg | max kg |", "|---|---|---|---|---|"]
    for v in payload["fake_volume"]:
        lines.append(f"| {v['label']} | {v['units']:.1f} | {v['mean']:,.1f} | {v['min']:,.1f} | {v['max']:,.1f} |")
    hon = sig[sig["label"] == "honest"]
    lines += [
        "",
        f"Highest honest score at {last} months: services {hon[hon['role'] == 'SERVICE']['score'].max():.3f}, "
        f"co-signers {hon[hon['role'] == 'CO-SIGNER']['score'].max():.3f}.",
        "",
        "## Reading the results",
        "",
        "- The colluding take-back point is exposed by its counterpart: the fake units it co-signs come from one "
        "company far more often than other companies use it (C4). The owner co-signature required since H1 is what "
        "makes this pattern visible on the ledger.",
        "- The adaptive phantom company books about as many Tier B recoveries as a large honest company, at an "
        "honest efficiency, so none of its own signals stand out. The amount it can launder this way is small, and "
        "it still depends on the same co-signer, which is flagged whenever a naive partner uses it too.",
        "- **1.0.0 was evaluated first, on held-out seeds 41–60** (`module_c_v1.0_seeds41-60.md`): it flagged "
        "17.5 % of honest take-back points at 12 months because C4 judged companies with one or two recoveries "
        "against a near-zero baseline, contrary to the minimum that C3 already applied. 1.1.0 applies the same "
        "minimum, and since seeds 41–60 had then been looked at, **1.1.0 is reported on fresh seeds 61–80**.",
        "- **Known limitations found on seeds 61–80 (not fixed, to avoid tuning on test data).** C2 alone flagged "
        "three honest companies (0.3 % of honest company-runs): their equipment mix happened to include many small "
        "units, Tier A units are a crude size proxy, and the robust dispersion estimate (about 1.1) understates "
        "how much honest companies really differ. A C2-only flag should be treated as a watch list. At 12 months a "
        "company that just reached 8 recoveries made two honest take-back points look concentrated (C4).",
        "- Development seeds 100–104 were used to fix three design problems before this evaluation: baselines "
        "that one large fraudster could distort (now each company weighs equally), Poisson volume tests that "
        "ignored real differences between companies (now quasi-Poisson with a robust dispersion), and small "
        "companies flagged on a handful of recoveries (now at least 8 are needed).",
        "",
    ]
    return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--seeds", default="61-80")
    ap.add_argument("--months", default="12,24,36")
    ap.add_argument("--cache", default=str(here / ".cache" / "sim"))
    ap.add_argument("--report", default=str(here / "reports" / "module_c_evaluation"))
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
            report = run_module_c(load_observations(folder, cutoff))
            for e in report.entities:
                sig = {s.name.split("_")[0]: s.score for s in e.signals}
                rows.append({"seed": seed, "months": m, "actor": e.actor, "role": e.role,
                             "label": labels.get(e.actor, "honest"), "score": e.score, "flagged": e.flagged, **sig,
                             "top_reason": e.reasons[0] if e.reasons else ""})
        print(f"seed {seed} done")

    df = pd.DataFrame(rows)
    results = [{"months": int(m), **metrics(g)} for m, g in df.groupby("months")]
    vol = pd.DataFrame(volumes)
    fake = [{"label": lab, "units": float(g["fake_units"].mean()), "mean": float(g["fake_kg"].mean()),
             "min": float(g["fake_kg"].min()), "max": float(g["fake_kg"].max())} for lab, g in vol.groupby("label")]
    payload = {
        "note": "Simulated data only. Thresholds were fixed on development seeds before this evaluation; ground truth was used only to score.",
        "model_version": MODEL_VERSION, "model_hash": model_hash(), "params": PARAMS,
        "seeds": seeds, "months": months, "results": results, "fake_volume": fake,
    }
    path = Path(args.report)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.with_suffix(".json").write_text(json.dumps(payload, indent=2), encoding="utf-8", newline="\n")
    path.with_suffix(".md").write_text(markdown(payload, df), encoding="utf-8", newline="\n")
    df.to_csv(path.with_name(path.name + "_rows.csv"), index=False, lineterminator="\n")
    print(markdown(payload, df))


if __name__ == "__main__":
    main()
