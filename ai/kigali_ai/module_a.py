"""AI module A: leakage gaps.

Question: does the leakage a service company records on the ledger make physical sense for the
units it looks after? Motivation: Japan, 2024 - operators reported 575 t of leakage while the
national inventory estimated 6,283 t. Under-recorded top-ups mean gas went into equipment off the
ledger, i.e. smuggled gas.

  A1  purchases on invoices with no ledger delivery   (the company buys gas off the ledger)
  A2  recorded leakage far below its peers             (relative to IPCC mid-range expectations)
  A3  silent units                                     (zero recorded top-ups although even the
                                                        IPCC minimum leak rate forces at least one)

The prior knowledge is public: IPCC 2006 Guidelines Vol. 3 Ch. 7 leak-rate bands per equipment
category (via Climate Action Reserve 2018 and ACR 2023 reviews). The household split-AC band is an
assumption. Thresholds are fixed in PARAMS from physical reasoning, not tuned on ground truth.
Scores combine as a noisy-OR; a flag is a request for human review.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

from .module_b import EntityResult, ModuleBReport, Signal, match_invoices
from .observations import Observations

MODEL_NAME = "kigali-balance/module-a-leakage-gap"
MODEL_VERSION = "1.1.0"
# 1.0.0 -> 1.1.0: A2 compared recorded top-ups with the full mid-range leakage. Top-ups are lumpy
# (technicians refill only once a unit is ~15 % low), so small fleets in short windows looked
# under-recorded: 1.3 % of honest companies were flagged at 12 months on held-out seeds 1-20.
# A2 now subtracts the part of each unit's expected loss that need not have been refilled yet.
# 1.1.0 is evaluated on fresh seeds 21-40.

# annual leak rate (fraction of nameplate charge) per category
LEAK_BANDS = {
    "medium_large_commercial": (0.10, 0.35),  # IPCC 2006 Table 7.9 via CAR (2018)
    "standalone_commercial": (0.01, 0.15),  # IPCC 2006 Table 7.9 via ACR (2023)
    "chiller": (0.02, 0.15),  # IPCC 2006 Table 7.9 via CAR (2018)
    "split_ac": (0.01, 0.10),  # assumption: residential/commercial AC band not confirmed
}

PARAMS = {
    # A1: same invoice reconciliation as module B, seen from the buyer
    "match_window_days": 21,
    "match_weight_tolerance": 0.05,
    "grace_days": 21,
    "unbacked_share_full": 0.02,
    "unbacked_count_full": 3,
    # A2: robust z of log(recorded / IPCC mid-range expectation) across companies; counts from
    # z = -2, full strength at z = -4. Needs enough expected leakage to judge.
    "z_floor": 2.0,
    "z_span": 2.0,
    "min_expected_kg": 20.0,
    # a unit is refilled only after losing about this share of its charge, so up to this much of its
    # expected loss may legitimately not show up as a top-up yet
    "topup_trigger_share": 0.15,
    # A3: a unit must have been topped up at least once if even the IPCC minimum rate over its
    # observed life removes a quarter of its charge (well past the ~15 % at which technicians top
    # up, with room for units that leak less than the IPCC minimum). Set on development seeds: at
    # 30 % no unit qualified within a 3-year window and the signal never fired.
    "silent_min_loss_share": 0.25,
    "silent_share_full": 0.20,
    "silent_count_full": 2,
    "flag_threshold": 0.6,
    "high_threshold": 0.85,
}

YEAR = pd.Timedelta(days=365.25)


def model_hash() -> str:
    digest = hashlib.sha256(Path(__file__).read_bytes())
    digest.update(json.dumps({"params": PARAMS, "bands": LEAK_BANDS}, sort_keys=True).encode())
    return digest.hexdigest()


def _clip01(x: float) -> float:
    return float(min(1.0, max(0.0, x)))


def _kg(grams: float) -> str:
    return f"{grams / 1000:,.1f} kg"


# ---------------------------------------------------------------------------------- unit exposure

def unit_table(obs: Observations) -> pd.DataFrame:
    """One row per registered unit: who services it, how long it was observed in service, how much
    was recorded as topped up, and the IPCC expectations for that period."""
    ev = obs.events
    start = ev["t"].min()
    end = obs.cutoff if obs.cutoff is not None else ev["t"].max()
    eq = obs.equipment.copy()
    eq = eq[eq["category"].isin(LEAK_BANDS)]

    acc = ev[ev["status"] == "accepted"]
    charges = acc[acc["type"] == "CHARGE"].groupby("equipment")["grams"].sum()
    rec = acc[acc["type"] == "RECOVER"]
    decommissioned = rec[rec["decommission"] == True].groupby("equipment")["t"].min()  # noqa: E712

    installed = pd.to_datetime(eq["installed_at"], errors="coerce")
    registered = pd.to_datetime(eq["registered_at"], errors="coerce")
    removed = pd.to_datetime(eq["removed_at"], errors="coerce")
    removed = removed.fillna(eq["id"].map(decommissioned))
    # Tier A is known from installation; Tier B only from its registration
    seen_from = np.where(eq["tier"] == "A", installed, registered)
    seen_from = pd.to_datetime(pd.Series(seen_from, index=eq.index)).clip(lower=start)
    seen_to = removed.fillna(end).clip(upper=end)
    years = ((seen_to - seen_from) / YEAR).clip(lower=0)

    lo = eq["category"].map(lambda c: LEAK_BANDS[c][0])
    hi = eq["category"].map(lambda c: LEAK_BANDS[c][1])
    out = pd.DataFrame({
        "unit": eq["id"], "service": eq["service_company"], "tier": eq["tier"], "category": eq["category"],
        "nameplate_g": eq["nameplate_g"], "years": years,
        "recorded_g": eq["id"].map(charges).fillna(0.0),
        "expected_min_g": eq["nameplate_g"] * lo * years,
        "expected_mid_g": eq["nameplate_g"] * (lo + hi) / 2 * years,
    })
    return out[out["years"] > 0].reset_index(drop=True)


# ---------------------------------------------------------------------------------- signals

def _purchase_signals(obs: Observations, params: dict) -> dict[str, Signal]:
    role = obs.role_of()
    ev = obs.events
    sends = ev[(ev["type"] == "SEND") & (ev["status"] == "accepted")]
    sends = sends[sends["actor"].map(role).eq("DISTRIBUTOR") & sends["to"].map(role).eq("SERVICE")]
    deliveries = sends[["actor", "to", "gas", "t", "grams"]].rename(columns={"actor": "distributor", "to": "buyer", "t": "date"})
    inv, _ = match_invoices(deliveries.reset_index(drop=True), obs.invoices, params)
    end = obs.cutoff if obs.cutoff is not None else max(obs.invoices["date"].max(), ev["t"].max())
    inv = inv[inv["date"] <= end - pd.Timedelta(days=params["grace_days"])]

    out = {}
    for svc, g in inv.groupby("buyer"):
        bought = float(g["grams"].sum())
        unbacked = g[~g["matched"]]
        k = len(unbacked)
        share = float(unbacked["unbacked_g"].sum()) / bought if bought else 0.0
        s = _clip01(share / params["unbacked_share_full"]) * _clip01(k / params["unbacked_count_full"])
        reason = (
            f"{k} invoiced purchases ({_kg(unbacked['unbacked_g'].sum())}, {share:.1%} of what it bought) from "
            f"{unbacked['distributor'].nunique()} distributor(s) have no matching ledger delivery"
            if k else "every invoiced purchase matches a ledger delivery"
        )
        out[svc] = Signal("A1_purchases_off_ledger", s, reason,
                          {"unbacked_invoices": k, "unbacked_grams": int(unbacked["unbacked_g"].sum()), "unbacked_share": round(share, 4)})
    return out


def _leakage_signals(units: pd.DataFrame, params: dict) -> dict[str, list[Signal]]:
    units = units.assign(expected_topup_g=(units["expected_mid_g"] - params["topup_trigger_share"] * units["nameplate_g"]).clip(lower=0))
    comp = units.groupby("service").agg(recorded_g=("recorded_g", "sum"), expected_topup_g=("expected_topup_g", "sum"),
                                        units=("unit", "size"))
    judged = comp[comp["expected_topup_g"] >= params["min_expected_kg"] * 1000].copy()
    judged["log_ratio"] = np.log((judged["recorded_g"] + 1000) / (judged["expected_topup_g"] + 1000))
    med = judged["log_ratio"].median()
    mad = 1.4826 * (judged["log_ratio"] - med).abs().median() or 1e-9
    judged["z"] = (judged["log_ratio"] - med) / mad
    peer_ratio = float(np.exp(med))

    eligible = units[units["expected_min_g"] >= params["silent_min_loss_share"] * units["nameplate_g"]]
    silent = eligible[eligible["recorded_g"] == 0]

    out: dict[str, list[Signal]] = {}
    for svc, row in comp.iterrows():
        sigs = []
        if svc in judged.index:
            j = judged.loc[svc]
            ratio = j["recorded_g"] / j["expected_topup_g"]
            s2 = _clip01((-j["z"] - params["z_floor"]) / params["z_span"])
            reason2 = (
                f"its {int(j['units'])} units recorded {_kg(j['recorded_g'])} of top-ups where IPCC mid-range leakage "
                f"would call for about {_kg(j['expected_topup_g'])} (ratio {ratio:.2f}; peer median {peer_ratio:.2f}, robust z {j['z']:+.1f})"
            )
            sigs.append(Signal("A2_recorded_leakage_vs_peers", s2, reason2,
                               {"recorded_grams": int(j["recorded_g"]), "expected_topup_grams": int(j["expected_topup_g"]),
                                "ratio": round(float(ratio), 3), "robust_z": round(float(j["z"]), 2)}))
        else:
            sigs.append(Signal("A2_recorded_leakage_vs_peers", 0.0, "too little expected leakage to compare with peers"))
        own_eligible = eligible[eligible["service"] == svc]
        own_silent = silent[silent["service"] == svc]
        n, k = len(own_eligible), len(own_silent)
        share = k / n if n else 0.0
        s3 = _clip01(share / params["silent_share_full"]) * _clip01(k / params["silent_count_full"])
        if k:
            worst = own_silent.sort_values("expected_min_g", ascending=False).iloc[0]
            reason3 = (
                f"{k} of {n} units that must have been topped up at least once (even at the IPCC minimum rate) have no "
                f"recorded top-up; e.g. {worst['unit']} ({worst['category']}, {_kg(worst['nameplate_g'])} charge, "
                f"{worst['years']:.1f} years, minimum loss {_kg(worst['expected_min_g'])})"
            )
        else:
            reason3 = f"all {n} units that must have needed a top-up have one recorded"
        sigs.append(Signal("A3_silent_units", s3, reason3, {"eligible_units": n, "silent_units": k}))
        out[svc] = sigs
    return out


def run_module_a(obs: Observations, params: dict | None = None) -> ModuleBReport:
    """Score every service company. Returns the same report structure as module B."""
    params = {**PARAMS, **(params or {})}
    units = unit_table(obs)
    purchases = _purchase_signals(obs, params)
    leakage = _leakage_signals(units, params)
    services = obs.actors.loc[obs.actors["role"] == "SERVICE", "id"]
    entities = []
    for svc in services:
        sigs = [purchases.get(svc, Signal("A1_purchases_off_ledger", 0.0, "no invoiced purchases"))]
        sigs += leakage.get(svc, [])
        score = 1 - math.prod(1 - s.score for s in sigs)
        flagged = score >= params["flag_threshold"]
        severity = "high" if score >= params["high_threshold"] else "review" if flagged else "none"
        entities.append(EntityResult(svc, "SERVICE", round(score, 4), flagged, severity, sigs))
    entities.sort(key=lambda e: (-e.score, e.actor))
    return ModuleBReport(
        model=MODEL_NAME, model_version=MODEL_VERSION, model_hash=model_hash(), input_snapshot=obs.snapshot_hash,
        cutoff=obs.cutoff.isoformat() if obs.cutoff is not None else None, params={**params, "leak_bands": LEAK_BANDS},
        entities=entities,
    )
