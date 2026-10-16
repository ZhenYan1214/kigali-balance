"""AI module C: recovery plausibility.

Question: are the recoveries booked from small Tier B units (household ACs, small cabinets, no
national record) plausible? A fake unit registered at scrapping is the cheapest way to turn
smuggled gas into "recovered" gas. Since every recovery needs the unit owner's co-signature
(rule H1), a fake unit also needs an accomplice who signs as its owner, typically a take-back
point. Collusion leaves a trace in who signs for whom.

Service companies:
  C1  near-full recoveries       share of Tier B recoveries returning >= 97 % of the model charge,
                                 against peers (end-of-life units are rarely full and recovery
                                 is never perfect)
  C2  Tier B recovery volume     Tier B recoveries against what the company's size in the national
                                 registry predicts (its Tier A units, which fake units cannot
                                 inflate), as a Poisson excess
  C3  co-signer concentration    Tier B recoveries concentrated on one take-back point beyond
                                 what that point's market share explains
Take-back points:
  C4  counterpart concentration  consents concentrated on a few service companies
  C5  near-full share            share of the recoveries it co-signed that were near-full

Thresholds are fixed in PARAMS before evaluation. Scores combine as a noisy-OR; a flag is a
request for human review.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from .module_b import EntityResult, ModuleBReport, Signal
from .observations import Observations

MODEL_NAME = "kigali-balance/module-c-recovery-plausibility"
MODEL_VERSION = "1.1.0"
# 1.0.0 -> 1.1.0: C4 picked a take-back point's most over-represented company without the minimum of
# recoveries that C3 applies, so a company with one or two recoveries and a near-zero baseline gave
# z of 18-45: 17.5 % of honest take-back points were flagged at 12 months on held-out seeds 41-60.
# C4 now only judges companies with enough Tier B recoveries. 1.1.0 is evaluated on fresh seeds 61-80.

PARAMS = {
    "near_full_share": 0.97,
    # binomial z against the leave-one-out peer rate; counts from z = 2, full at z = 4, and needs
    # at least 3 near-full recoveries
    "near_full_z_floor": 2.0,
    "near_full_z_span": 2.0,
    "near_full_min_count": 3,
    # Poisson z of Tier B recoveries over the count predicted from the company's Tier A units, at
    # the typical rate (mean of the middle 80 % of companies, so fraudsters cannot inflate it)
    "volume_z_floor": 2.0,
    "volume_z_span": 2.0,
    "volume_trim": 0.10,
    # a handful of recoveries at a small company is chance across 40 companies: full weight from 8
    "volume_min_count": 8,
    # co-signer baselines weight each company equally (only companies with this many recoveries),
    # so one company booking many fake units cannot distort every other pairing
    "pair_baseline_min_recoveries": 3,
    # standardised residual of the busiest co-signer pairing; small samples concentrate by chance,
    # so counts from z = 3, full at z = 6, and needs 8 recoveries
    "pair_z_floor": 3.0,
    "pair_z_span": 3.0,
    "pair_min_recoveries": 8,
    "flag_threshold": 0.6,
    "high_threshold": 0.85,
}


def model_hash() -> str:
    digest = hashlib.sha256(Path(__file__).read_bytes())
    digest.update(json.dumps(PARAMS, sort_keys=True).encode())
    return digest.hexdigest()


def _clip01(x: float) -> float:
    return float(min(1.0, max(0.0, x)))


def tier_b_recoveries(obs: Observations) -> pd.DataFrame:
    """Accepted recoveries from Tier B units, with the share of the model charge each returned."""
    ev = obs.events
    rec = ev[(ev["type"] == "RECOVER") & (ev["status"] == "accepted")]
    eq = obs.equipment.set_index("id")
    rec = rec[rec["equipment"].map(eq["tier"]).eq("B")].copy()
    rec["nameplate_g"] = rec["equipment"].map(eq["nameplate_g"])
    rec["share"] = rec["grams"] / rec["nameplate_g"]
    rec = rec.rename(columns={"actor": "service", "consentSigner": "cosigner"})
    return rec[["service", "cosigner", "equipment", "grams", "nameplate_g", "share", "t"]].reset_index(drop=True)


def _binomial_z(k: int, n: int, p: float) -> float:
    p = min(max(p, 1e-3), 1 - 1e-3)
    return (k - n * p) / math.sqrt(n * p * (1 - p)) if n else 0.0


def _pair_residuals(rec: pd.DataFrame, params: dict) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Binomial z of each (service, co-signer) count: how much more often this company used this
    co-signer than a typical company does. The baseline share of each co-signer is the mean of its
    share among the other companies (each company weighted equally)."""
    table = pd.crosstab(rec["service"], rec["cosigner"])
    shares = table.div(table.sum(axis=1), axis=0)
    big = table.sum(axis=1) >= params["pair_baseline_min_recoveries"]
    z = pd.DataFrame(0.0, index=table.index, columns=table.columns)
    for svc in table.index:
        others = shares[big & (shares.index != svc)]
        if others.empty:
            continue
        n = table.loc[svc].sum()
        for cos in table.columns:
            z.loc[svc, cos] = _binomial_z(int(table.loc[svc, cos]), int(n), float(others[cos].mean()))
    return z, table


def _service_signals(obs: Observations, rec: pd.DataFrame, params: dict) -> dict[str, list[Signal]]:
    services = obs.actors.loc[obs.actors["role"] == "SERVICE", "id"]
    eq = obs.equipment
    tier_a = eq[eq["tier"] == "A"].groupby("service_company").size()
    n_b = rec.groupby("service").size()
    near = rec["share"] >= params["near_full_share"]
    k_near = rec[near].groupby("service").size()

    sizes = pd.DataFrame({"b": n_b, "a": tier_a}).reindex(services).fillna(0)
    rates = (sizes["b"] / sizes["a"].clip(lower=1)).sort_values()
    trim = int(len(rates) * params["volume_trim"])
    middle = rates.iloc[trim:len(rates) - trim].index
    typical_rate = float(sizes.loc[middle, "b"].sum() / sizes.loc[middle, "a"].clip(lower=1).sum())
    expected_b = sizes["a"].clip(lower=1) * typical_rate
    # quasi-Poisson: companies differ more than a Poisson count allows (equipment mix, size), so
    # the variance is scaled by a dispersion estimated robustly (median of Pearson terms / 0.455,
    # the median of a chi-square with one degree of freedom), which fraudsters cannot inflate
    pearson = (sizes["b"] - expected_b) ** 2 / expected_b.clip(lower=0.5)
    dispersion = max(1.0, float(pearson.median()) / 0.455)
    vol_z = (sizes["b"] - expected_b - 0.5) / np.sqrt(dispersion * expected_b.clip(lower=0.5))

    pair_z, pair_n = _pair_residuals(rec, params) if len(rec) else (pd.DataFrame(), pd.DataFrame())

    # peer near-full rate: mean over other companies with enough recoveries, each weighted equally
    near_rate = (k_near.reindex(n_b.index).fillna(0) / n_b)[n_b >= params["pair_baseline_min_recoveries"]]
    out: dict[str, list[Signal]] = {}
    for svc in services:
        n, k = int(n_b.get(svc, 0)), int(k_near.get(svc, 0))
        p0 = float(near_rate.drop(svc, errors="ignore").mean()) if len(near_rate.drop(svc, errors="ignore")) else 0.0
        z1 = _binomial_z(k, n, p0)
        s1 = _clip01((z1 - params["near_full_z_floor"]) / params["near_full_z_span"]) * _clip01(k / params["near_full_min_count"])
        reason1 = (
            f"{k} of its {n} Tier B recoveries returned >= {params['near_full_share']:.0%} of the model charge "
            f"(peers {p0:.0%}; binomial z {z1:+.1f})" if n else "no Tier B recoveries"
        )
        z2 = float(vol_z[svc])
        s2 = _clip01((z2 - params["volume_z_floor"]) / params["volume_z_span"]) * _clip01(n / params["volume_min_count"])
        reason2 = (
            f"{n} Tier B recoveries where its {int(sizes.loc[svc, 'a'])} registered Tier A units predict about "
            f"{expected_b[svc]:.1f} at the typical rate (quasi-Poisson z {z2:+.1f}, dispersion {dispersion:.1f})"
        )
        if svc in pair_z.index and n >= params["pair_min_recoveries"]:
            top = pair_z.loc[svc].idxmax()
            z3 = float(pair_z.loc[svc, top])
            share = pair_n.loc[svc, top] / n
            s3 = _clip01((z3 - params["pair_z_floor"]) / params["pair_z_span"])
            reason3 = (f"{share:.0%} of its Tier B recoveries ({pair_n.loc[svc, top]} of {n}) were co-signed by {top}, "
                       f"far more than other companies use that co-signer (binomial z {z3:+.1f})")
            ev3 = {"top_cosigner": top, "share": round(float(share), 3), "residual_z": round(z3, 2)}
        else:
            s3, reason3, ev3 = 0.0, f"too few Tier B recoveries to judge its co-signers ({n})", {}
        out[svc] = [
            Signal("C1_near_full_recoveries", s1, reason1, {"tier_b_recoveries": n, "near_full": k, "binomial_z": round(z1, 2)}),
            Signal("C2_tier_b_volume", s2, reason2, {"tier_b_recoveries": n, "tier_a_units": int(sizes.loc[svc, "a"]),
                                                    "expected": round(float(expected_b[svc]), 2), "poisson_z": round(z2, 2)}),
            Signal("C3_cosigner_concentration", s3, reason3, ev3),
        ]
    return out


def _cosigner_signals(rec: pd.DataFrame, params: dict) -> dict[str, list[Signal]]:
    if rec.empty:
        return {}
    pair_z, pair_n = _pair_residuals(rec, params)
    near = rec["share"] >= params["near_full_share"]
    rate_by_cos = near.groupby(rec["cosigner"]).mean()
    out: dict[str, list[Signal]] = {}
    judged = pair_n.sum(axis=1) >= params["pair_min_recoveries"]  # same rule as C3
    for cos in pair_z.columns:
        n = int(pair_n[cos].sum())
        candidates = pair_z.loc[judged, cos]
        top = candidates.idxmax() if len(candidates) else pair_z[cos].idxmax()
        z4 = float(pair_z.loc[top, cos])
        s4 = _clip01((z4 - params["pair_z_floor"]) / params["pair_z_span"]) if len(candidates) and n >= params["pair_min_recoveries"] else 0.0
        reason4 = (f"{pair_n.loc[top, cos]} of the {n} Tier B recoveries it co-signed came from {top}, which uses this "
                   f"co-signer far more than other companies do (binomial z {z4:+.1f})")
        k = int(near[rec["cosigner"] == cos].sum())
        others = rate_by_cos.drop(cos)
        p0 = float(others.mean()) if len(others) else 0.0
        z5 = _binomial_z(k, n, p0)
        s5 = _clip01((z5 - params["near_full_z_floor"]) / params["near_full_z_span"]) * _clip01(k / params["near_full_min_count"])
        reason5 = f"{k} of the {n} recoveries it co-signed were near-full (other co-signers {p0:.0%}; binomial z {z5:+.1f})"
        out[cos] = [
            Signal("C4_counterpart_concentration", s4, reason4, {"top_service": top, "residual_z": round(z4, 2), "cosigned": n}),
            Signal("C5_near_full_cosigned", s5, reason5, {"near_full": k, "cosigned": n, "binomial_z": round(z5, 2)}),
        ]
    return out


def run_module_c(obs: Observations, params: dict | None = None) -> ModuleBReport:
    """Score every service company and every co-signer of Tier B recoveries."""
    params = {**PARAMS, **(params or {})}
    rec = tier_b_recoveries(obs)
    role = obs.role_of()
    entities = []
    for actor, sigs in {**_service_signals(obs, rec, params), **_cosigner_signals(rec, params)}.items():
        score = 1 - math.prod(1 - s.score for s in sigs)
        flagged = score >= params["flag_threshold"]
        severity = "high" if score >= params["high_threshold"] else "review" if flagged else "none"
        kind = "SERVICE" if role.get(actor) == "SERVICE" else "CO-SIGNER"
        entities.append(EntityResult(actor, kind, round(score, 4), flagged, severity, sigs))
    entities.sort(key=lambda e: (-e.score, e.actor))
    return ModuleBReport(
        model=MODEL_NAME, model_version=MODEL_VERSION, model_hash=model_hash(), input_snapshot=obs.snapshot_hash,
        cutoff=obs.cutoff.isoformat() if obs.cutoff is not None else None, params=params, entities=entities,
    )
