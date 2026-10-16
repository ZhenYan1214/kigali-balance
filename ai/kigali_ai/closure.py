"""End-of-life closure: registered units that left service with no recovery on the ledger.

This is a reconciliation, not a learned model. The national register (here `equipment.csv`) says
when a Tier A unit was removed from service; the ledger says whether anything was recovered from
it. A unit that left service with no recovery record most likely had its refrigerant vented, which
is the largest emission the problem statement describes (Japan, 2024: 57 % of the HFC left in
scrapped equipment was not recovered).

The ledger cannot see what was inside the unit, so the missing mass is an estimate: the nameplate
charge times the IPCC range for the charge still in a unit of that kind at end of life
(2006 IPCC Guidelines, Vol. 3, Ch. 7, Table 7.9, "initial charge remaining"). It is reported as a
range, never as a single number.

Units below the national registration threshold (Tier B, e.g. household air conditioners) only
appear on the ledger when they are recovered, so their venting is invisible here. That is a limit
of the data, stated in every report.

Signals per service company (for review, never a sanction):
  E1  closure gap   share of the company's closed units with no recovery record, against the
                    pooled share of all companies (binomial z), once it has closed enough units.
"""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import asdict, dataclass, field

import pandas as pd

from .observations import Observations

MODEL = "closure"
VERSION = "1.0.0"

# 2006 IPCC Guidelines, Vol. 3, Ch. 7, Table 7.9, "Initial charge remaining (p)", % of initial charge
IPCC_REMAINING = {
    "domestic_refrigeration": (0.0, 0.8),
    "standalone_commercial": (0.0, 0.8),
    "medium_large_commercial": (0.5, 1.0),
    "transport_refrigeration": (0.0, 0.5),
    "industrial_refrigeration": (0.5, 1.0),
    "chiller": (0.8, 1.0),
    "split_ac": (0.0, 0.8),  # "Residential and Commercial A/C, including Heat Pumps"
    "mobile_ac": (0.0, 0.5),
}
# GWP (IPCC AR4, as used by EU Regulation 2024/573)
GWP = {"R-404A": 3922, "R-134a": 1430, "R-410A": 2088}

PARAMS = {
    "recovery_window_days_before": 180,  # a recovery this long before removal still closes the unit
    "recovery_window_days_after": 60,  # paperwork may follow the removal
    "pending_days": 60,  # removed this recently: the recovery may not be filed yet
    "min_closed_units": 6,  # E1 is only computed for companies that closed at least this many units
    "z_review": 3.0,
    "z_high": 5.0,
}


@dataclass
class Unit:
    equipment: str
    service: str
    owner: str
    category: str
    gas: str
    removed_at: str
    nameplate_g: int
    status: str  # "recovered" | "no_record" | "pending"
    recovered_g: int
    missing_g_low: int
    missing_g_high: int


@dataclass
class Company:
    actor: str
    closed: int
    no_record: int
    share: float
    z: float
    score: float
    severity: str
    reasons: list[str] = field(default_factory=list)


@dataclass
class ClosureReport:
    model: str
    model_version: str
    model_hash: str
    input_snapshot: str
    cutoff: str | None
    params: dict
    units: list[Unit]
    companies: list[Company]
    totals: dict

    def to_dict(self) -> dict:
        return asdict(self)


def _model_hash() -> str:
    blob = json.dumps({"v": VERSION, "params": PARAMS, "ipcc": IPCC_REMAINING}, sort_keys=True)
    return hashlib.sha256(blob.encode()).hexdigest()


def closed_units(obs: Observations) -> pd.DataFrame:
    """Tier A units the register shows as removed on or before the cutoff."""
    eq = obs.equipment
    eq = eq[(eq["tier"] == "A") & eq["removed_at"].notna()].copy()
    eq["removed_at"] = pd.to_datetime(eq["removed_at"], utc=True).dt.tz_localize(None)
    end = obs.cutoff if obs.cutoff is not None else obs.events["t"].max()
    return eq[eq["removed_at"] <= end].reset_index(drop=True)


def run_closure(obs: Observations) -> ClosureReport:
    end = obs.cutoff if obs.cutoff is not None else obs.events["t"].max()
    units = closed_units(obs)
    ev = obs.events
    rec = ev[(ev["type"] == "RECOVER") & (ev["status"] == "accepted")][["equipment", "t", "grams"]]
    before = pd.Timedelta(days=PARAMS["recovery_window_days_before"])
    after = pd.Timedelta(days=PARAMS["recovery_window_days_after"])

    rows: list[Unit] = []
    for u in units.itertuples(index=False):
        r = rec[(rec["equipment"] == u.id) & (rec["t"] >= u.removed_at - before) & (rec["t"] <= u.removed_at + after)]
        lo, hi = IPCC_REMAINING.get(u.category, (0.0, 1.0))
        if len(r):
            status, missing = "recovered", (0, 0)
        elif end - u.removed_at < pd.Timedelta(days=PARAMS["pending_days"]):
            status, missing = "pending", (0, 0)
        else:
            status, missing = "no_record", (round(u.nameplate_g * lo), round(u.nameplate_g * hi))
        rows.append(Unit(u.id, u.service_company, u.owner, u.category, u.gas, u.removed_at.date().isoformat(),
                         int(u.nameplate_g), status, int(r["grams"].sum()), *missing))

    df = pd.DataFrame([asdict(x) for x in rows])
    companies: list[Company] = []
    if len(df):
        decided = df[df["status"] != "pending"]
        pooled = (decided["status"] == "no_record").mean() if len(decided) else 0.0
        for svc, g in decided.groupby("service"):
            n = len(g)
            k = int((g["status"] == "no_record").sum())
            share = k / n
            z = (k - n * pooled) / math.sqrt(n * pooled * (1 - pooled)) if 0 < pooled < 1 else 0.0
            score, severity, reasons = 0.0, "none", []
            if n >= PARAMS["min_closed_units"] and z >= PARAMS["z_review"]:
                score = min(1.0, 0.6 + 0.4 * (z - PARAMS["z_review"]) / (PARAMS["z_high"] - PARAMS["z_review"]))
                severity = "high" if z >= PARAMS["z_high"] else "review"
                reasons.append(f"{k} of the {n} registered units it serviced left service with no recovery on the ledger "
                               f"({share:.0%}; all companies {pooled:.0%}; binomial z {z:+.1f})")
            companies.append(Company(svc, n, k, round(share, 3), round(z, 2), round(score, 3), severity, reasons))
        companies.sort(key=lambda c: (-c.score, -c.z))

    def tco2e(sub: pd.DataFrame, col: str) -> float:
        return float(sum(r[col] / 1e6 * GWP.get(r["gas"], 0) for _, r in sub.iterrows()))

    missing = df[df["status"] == "no_record"] if len(df) else df
    totals = {
        "closed": int(len(df)),
        "recovered": int((df["status"] == "recovered").sum()) if len(df) else 0,
        "no_record": int(len(missing)),
        "pending": int((df["status"] == "pending").sum()) if len(df) else 0,
        "missing_kg_low": round(float(missing["missing_g_low"].sum()) / 1000, 1) if len(missing) else 0.0,
        "missing_kg_high": round(float(missing["missing_g_high"].sum()) / 1000, 1) if len(missing) else 0.0,
        "missing_tco2e_low": round(tco2e(missing, "missing_g_low"), 1) if len(missing) else 0.0,
        "missing_tco2e_high": round(tco2e(missing, "missing_g_high"), 1) if len(missing) else 0.0,
        "note": "Tier A (registered) units only; units below the registration threshold are invisible until recovered. "
                "Missing mass = nameplate x IPCC 2006 Table 7.9 range of charge remaining at end of life.",
    }
    return ClosureReport(MODEL, VERSION, _model_hash(), obs.snapshot_hash, None if obs.cutoff is None else str(obs.cutoff),
                         PARAMS, rows, companies, totals)
