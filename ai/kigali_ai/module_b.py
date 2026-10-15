"""AI module B: mass-balance anomalies.

Question: do a distributor's sales and a reclaimer's output add up with what the ledger shows
went in? Hard limits are already enforced by the contracts (no one can ship more than they hold,
reclaimed output <= 98 % of recovered input). This module looks for what is compliant on chain
but implausible:

  D1  invoices with no matching ledger shipment   (gas sold off the ledger, i.e. smuggled)
  D2  invoiced volume above shipped volume         (the same, in aggregate)
  R1  attempts to exceed the reclamation ceiling   (rejected on chain, but they show intent)
  R2  reclamation yield high relative to peers     (virgin gas blended into "reclaimed" output)
  IF  unusual monthly patterns (Isolation Forest, explained with SHAP), a secondary signal that
      can raise a score but never flag an entity on its own

Every threshold is fixed in PARAMS from the noise one should expect in honest paperwork, not
tuned on ground truth. Scores combine as a noisy-OR; a flag is a request for human review.
"""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import asdict, dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from .observations import Observations

MODEL_NAME = "kigali-balance/module-b-mass-balance"
MODEL_VERSION = "1.0.0"

PARAMS = {
    # D1/D2: invoice-to-shipment matching. Honest invoices are dated a few days before or after
    # the shipment and their weights are estimates, so a match allows +/-21 days and 5 %.
    "match_window_days": 21,
    "match_weight_tolerance": 0.05,
    # data within this many days of the cutoff is too fresh to judge (its partner may come later)
    "grace_days": 21,
    # D1 reaches full strength at 2 % of invoiced volume AND 3 unmatched invoices: a single
    # orphan invoice can be a clerical error
    "unbacked_share_full": 0.02,
    "unbacked_count_full": 3,
    # D2: aggregate excess above 1 % starts to count, full strength at 3 %
    "aggregate_excess_floor": 0.01,
    "aggregate_excess_span": 0.02,
    # R2: needs at least 10 batches; counts once the reclaimer's mean yield sits above 75 % of
    # its peers' batches, full strength at 95 %
    "min_batches": 10,
    "yield_pct_floor": 0.75,
    "yield_pct_span": 0.20,
    # IF: share of an entity's active months in its role's most anomalous 10 %
    "if_trees": 200,
    "if_top_share": 0.10,
    "if_share_span": 0.40,
    "if_weight": 0.5,  # caps the IF signal strictly below the flag threshold
    "if_seed": 0,
    "flag_threshold": 0.6,
    "high_threshold": 0.85,
}


@dataclass
class Signal:
    name: str
    score: float
    reason: str
    evidence: dict = field(default_factory=dict)


@dataclass
class EntityResult:
    actor: str
    role: str
    score: float
    flagged: bool
    severity: str
    signals: list[Signal]

    @property
    def reasons(self) -> list[str]:
        return [s.reason for s in sorted(self.signals, key=lambda s: -s.score) if s.score >= 0.2]


@dataclass
class ModuleBReport:
    model: str
    model_version: str
    model_hash: str
    input_snapshot: str
    cutoff: str | None
    params: dict
    entities: list[EntityResult]

    def flagged(self) -> list[EntityResult]:
        return [e for e in self.entities if e.flagged]

    def to_dict(self) -> dict:
        out = {k: v for k, v in asdict(self).items() if k != "entities"}
        out["entities"] = [
            {**{k: v for k, v in asdict(e).items() if k != "signals"}, "reasons": e.reasons,
             "signals": [asdict(s) for s in e.signals]}
            for e in self.entities
        ]
        return out

    def to_frame(self) -> pd.DataFrame:
        return pd.DataFrame(
            [{"actor": e.actor, "role": e.role, "score": round(e.score, 3), "flagged": e.flagged,
              "severity": e.severity, "reasons": " | ".join(e.reasons)} for e in self.entities]
        )


def model_hash() -> str:
    """Hash of this module's source and parameters, recorded on chain with every flag."""
    digest = hashlib.sha256(Path(__file__).read_bytes())
    digest.update(json.dumps(PARAMS, sort_keys=True).encode())
    return digest.hexdigest()


def _clip01(x: float) -> float:
    return float(min(1.0, max(0.0, x)))


def _kg(grams: float) -> str:
    return f"{grams / 1000:,.1f} kg"


# ---------------------------------------------------------------------------------- distributors

def _deliveries(obs: Observations) -> pd.DataFrame:
    """Ledger shipments (accepted sends) from distributors to service companies."""
    role = obs.role_of()
    ev = obs.events
    sends = ev[(ev["type"] == "SEND") & (ev["status"] == "accepted")]
    sends = sends[sends["actor"].map(role).eq("DISTRIBUTOR") & sends["to"].map(role).eq("SERVICE")]
    return (
        sends[["actor", "to", "gas", "t", "grams"]]
        .rename(columns={"actor": "distributor", "to": "buyer", "t": "date"})
        .reset_index(drop=True)
    )


def match_invoices(deliveries: pd.DataFrame, invoices: pd.DataFrame, params: dict = PARAMS):
    """Gram-flow reconciliation of invoices against ledger shipments.

    For each distributor, buyer and gas, an invoice consumes grams from shipments dated within
    +/- `match_window_days`, oldest first. One invoice may cover several shipments and one shipment
    may be billed on several invoices, as in real accounting. Grams an invoice cannot find are
    "unbacked"; an invoice is unbacked when more than `match_weight_tolerance` of it is.
    Returns copies of both frames with `unbacked_g` / `matched` and `billed_g` columns.
    """
    window = pd.Timedelta(days=params["match_window_days"])
    tol = params["match_weight_tolerance"]
    inv = invoices.sort_values(["date", "invoice"]).copy()
    dlv = deliveries.sort_values("date").copy()
    inv["unbacked_g"] = inv["grams"].astype(float)
    dlv["billed_g"] = 0.0
    remaining = dlv["grams"].astype(float).to_dict()
    dlv_groups = {k: g.index.to_list() for k, g in dlv.groupby(["distributor", "buyer", "gas"])}
    for idx, row in inv.iterrows():
        need = float(row["grams"])
        for j in dlv_groups.get((row["distributor"], row["buyer"], row["gas"]), []):
            if need <= 0:
                break
            if remaining[j] <= 0 or abs(row["date"] - dlv.at[j, "date"]) > window:
                continue
            take = min(need, remaining[j])
            remaining[j] -= take
            need -= take
            dlv.at[j, "billed_g"] += take
        inv.at[idx, "unbacked_g"] = need
    inv["matched"] = inv["unbacked_g"] <= tol * inv["grams"]
    dlv["matched"] = dlv["billed_g"] >= (1 - tol) * dlv["grams"]
    return inv, dlv


def _distributor_signals(obs: Observations, params: dict) -> dict[str, list[Signal]]:
    deliveries = _deliveries(obs)
    invoices = obs.invoices
    end = obs.cutoff if obs.cutoff is not None else max(invoices["date"].max(), obs.events["t"].max())
    judged_until = end - pd.Timedelta(days=params["grace_days"])
    inv, dlv = match_invoices(deliveries, invoices, params)
    inv = inv[inv["date"] <= judged_until]
    dlv = dlv[dlv["date"] <= judged_until]

    out: dict[str, list[Signal]] = {}
    distributors = obs.actors.loc[obs.actors["role"] == "DISTRIBUTOR", "id"]
    for d in distributors:
        di = inv[inv["distributor"] == d]
        dd = dlv[dlv["distributor"] == d]
        invoiced = float(di["grams"].sum())
        delivered = float(dd["grams"].sum())
        unbacked = di[~di["matched"]]
        k = len(unbacked)
        unbacked_g = float(unbacked["unbacked_g"].sum())
        share = unbacked_g / invoiced if invoiced else 0.0
        s1 = _clip01(share / params["unbacked_share_full"]) * _clip01(k / params["unbacked_count_full"])
        if k:
            by_gas = unbacked.groupby("gas")["unbacked_g"].sum().sort_values(ascending=False)
            reason1 = (
                f"{k} invoices to {unbacked['buyer'].nunique()} buyers bill {_kg(unbacked_g)} "
                f"({share:.1%} of invoiced volume) that no ledger shipment within +/-{params['match_window_days']} days "
                f"can account for; largest: {by_gas.index[0]} {_kg(by_gas.iloc[0])}"
            )
        else:
            reason1 = "every invoice is backed by ledger shipments"
        excess = (invoiced - delivered) / delivered if delivered else 0.0
        s2 = _clip01((excess - params["aggregate_excess_floor"]) / params["aggregate_excess_span"])
        reason2 = f"invoiced {_kg(invoiced)} against {_kg(delivered)} shipped on the ledger ({excess:+.1%})"
        out[d] = [
            Signal("D1_unbacked_invoices", s1, reason1,
                   {"unbacked_invoices": k, "unbacked_grams": int(unbacked_g), "unbacked_share": round(share, 4)}),
            Signal("D2_invoiced_vs_shipped", s2, reason2,
                   {"invoiced_grams": int(invoiced), "shipped_grams": int(delivered), "excess_share": round(excess, 4)}),
        ]
    return out


# ---------------------------------------------------------------------------------- reclaimers

def _reclaim_batches(obs: Observations) -> pd.DataFrame:
    ev = obs.events
    rec = ev[(ev["type"] == "RECLAIM") & (ev["status"] == "accepted")].copy()
    rec["yield"] = rec["outGrams"] / rec["inGrams"]
    return rec


def _reclaimer_signals(obs: Observations, params: dict) -> dict[str, list[Signal]]:
    ev = obs.events
    batches = _reclaim_batches(obs)
    rejected = ev[(ev["type"] == "RECLAIM") & (ev["status"] == "rejected") & (ev["reason"] == "ReclaimExceedsInput")]
    out: dict[str, list[Signal]] = {}
    reclaimers = obs.actors.loc[obs.actors["role"] == "RECLAIMER", "id"]
    for r in reclaimers:
        k = int((rejected["actor"] == r).sum())
        s1 = 1 - 0.5 ** k
        reason1 = (
            f"{k} reclamation attempts were rejected for claiming more output than the 98 % ceiling allows"
            if k else "no attempt to exceed the reclamation ceiling"
        )
        own = batches.loc[batches["actor"] == r, "yield"]
        peers = batches.loc[batches["actor"] != r, "yield"]
        if len(own) >= params["min_batches"] and len(peers) >= params["min_batches"]:
            mean = float(own.mean())
            pct = float((peers < mean).mean())
            s2 = _clip01((pct - params["yield_pct_floor"]) / params["yield_pct_span"])
            reason2 = (
                f"mean reclamation yield {mean:.1%} over {len(own)} batches is above {pct:.0%} of peer batches "
                f"(peer median {peers.median():.1%})"
            )
            evidence2 = {"batches": int(len(own)), "mean_yield": round(mean, 4), "peer_percentile": round(pct, 3),
                         "peer_median_yield": round(float(peers.median()), 4)}
        else:
            s2, reason2, evidence2 = 0.0, f"too few batches to compare yields ({len(own)})", {"batches": int(len(own))}
        out[r] = [
            Signal("R1_ceiling_attempts", s1, reason1, {"rejected_attempts": k}),
            Signal("R2_yield_vs_peers", s2, reason2, evidence2),
        ]
    return out


# ---------------------------------------------------------------------------------- isolation forest

def _monthly_features(obs: Observations, params: dict) -> dict[str, pd.DataFrame]:
    """Entity-month feature tables per role (only months with activity)."""
    inv, dlv = match_invoices(_deliveries(obs), obs.invoices, params)
    inv["month"] = inv["date"].dt.to_period("M")
    dlv["month"] = dlv["date"].dt.to_period("M")
    inv["unbacked_g"] = np.where(inv["matched"], 0.0, inv["unbacked_g"])
    gi = inv.groupby(["distributor", "month"]).agg(invoiced_g=("grams", "sum"), unbacked_g=("unbacked_g", "sum"),
                                                   n_buyers=("buyer", "nunique"))
    hhi = inv.groupby(["distributor", "month"]).apply(
        lambda g: float(((g.groupby("buyer")["grams"].sum() / g["grams"].sum()) ** 2).sum()), include_groups=False
    ).rename("buyer_hhi")
    gd = dlv.groupby(["distributor", "month"]).agg(shipped_g=("grams", "sum"))
    dist = pd.concat([gi, hhi, gd], axis=1).fillna(0.0)
    dist["log_invoice_to_shipped"] = np.log((dist["invoiced_g"] + 1000) / (dist["shipped_g"] + 1000))
    dist = dist[["invoiced_g", "shipped_g", "log_invoice_to_shipped", "unbacked_g", "n_buyers", "buyer_hhi"]]

    batches = _reclaim_batches(obs)
    batches["month"] = batches["t"].dt.to_period("M")
    ev = obs.events
    rej = ev[(ev["type"] == "RECLAIM") & (ev["status"] == "rejected") & (ev["reason"] == "ReclaimExceedsInput")].copy()
    rej["month"] = rej["t"].dt.to_period("M")
    rec = batches.groupby(["actor", "month"]).agg(batches=("yield", "size"), input_g=("inGrams", "sum"),
                                                  mean_yield=("yield", "mean"), max_yield=("yield", "max"))
    rec = rec.join(rej.groupby(["actor", "month"]).size().rename("ceiling_attempts"), how="outer").fillna(0.0)
    return {"DISTRIBUTOR": dist, "RECLAIMER": rec}


def _isolation_signals(obs: Observations, params: dict) -> dict[str, Signal]:
    out: dict[str, Signal] = {}
    for role, table in _monthly_features(obs, params).items():
        if len(table) < 20:
            continue
        model = IsolationForest(n_estimators=params["if_trees"], random_state=params["if_seed"])
        model.fit(table.values)
        anomaly = -model.score_samples(table.values)  # higher = more anomalous
        cut = np.quantile(anomaly, 1 - params["if_top_share"])
        scored = table.assign(anomaly=anomaly, top=anomaly >= cut)
        explain = _shap_explainer(model)
        medians = table.median()
        for actor, g in scored.groupby(level=0):
            share = float(g["top"].mean())
            s = params["if_weight"] * _clip01((share - params["if_top_share"]) / params["if_share_span"])
            worst = g["anomaly"].idxmax()
            feature, value = _top_feature(explain, table, worst, medians)
            reason = (
                f"{share:.0%} of its active months are among the most unusual 10 % for {role.lower()}s; "
                f"most unusual month {worst[1]}, driven by {feature} = {value:,.3g} (role median {medians[feature]:,.3g})"
            )
            out[actor] = Signal("IF_monthly_pattern", s, reason,
                                {"share_of_months_in_top_decile": round(share, 3), "months": int(len(g)),
                                 "top_feature": feature})
    return out


def _shap_explainer(model):
    try:
        import shap  # noqa: PLC0415  (optional at import time; heavy)

        return shap.TreeExplainer(model)
    except Exception:  # pragma: no cover - fall back to a robust deviation ranking
        return None


def _top_feature(explainer, table: pd.DataFrame, row_key, medians: pd.Series) -> tuple[str, float]:
    row = table.loc[[row_key]]
    if explainer is not None:
        contrib = np.asarray(explainer.shap_values(row.values))[0]
        # IsolationForest SHAP explains the path-length score: negative = pushes toward "anomalous"
        idx = int(np.argmin(contrib))
    else:
        scale = (table - medians).abs().median().replace(0, 1.0)
        idx = int(((row.iloc[0] - medians).abs() / scale).argmax())
    feature = table.columns[idx]
    return feature, float(row.iloc[0, idx])


# ---------------------------------------------------------------------------------- combine

def run_module_b(obs: Observations, params: dict | None = None, use_isolation_forest: bool = True) -> ModuleBReport:
    params = {**PARAMS, **(params or {})}
    role = obs.role_of()
    signals: dict[str, list[Signal]] = {}
    for table in (_distributor_signals(obs, params), _reclaimer_signals(obs, params)):
        for actor, sigs in table.items():
            signals.setdefault(actor, []).extend(sigs)
    if use_isolation_forest:
        for actor, sig in _isolation_signals(obs, params).items():
            if actor in signals:
                signals[actor].append(sig)

    entities = []
    for actor, sigs in signals.items():
        score = 1 - math.prod(1 - s.score for s in sigs)
        flagged = score >= params["flag_threshold"]
        severity = "high" if score >= params["high_threshold"] else "review" if flagged else "none"
        entities.append(EntityResult(actor, role[actor], round(score, 4), flagged, severity, sigs))
    entities.sort(key=lambda e: (-e.score, e.actor))
    return ModuleBReport(
        model=MODEL_NAME, model_version=MODEL_VERSION, model_hash=model_hash(), input_snapshot=obs.snapshot_hash,
        cutoff=obs.cutoff.isoformat() if obs.cutoff is not None else None, params=params, entities=entities,
    )
