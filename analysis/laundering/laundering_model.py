"""Laundering capacity at decommissioning.

Question: how much virgin gas could a colluding technician and equipment owner book as "recovered"
when a registered unit is decommissioned, and how much does each defence layer remove?

Headroom of one unit = what the rules would accept from it minus what was really inside it.
This is a CAPACITY (every decommissioning padded to the limit), not an estimate of actual fraud.

Population: the simulator's equipment register (simulator/out/equipment.csv, seed 42), using only
tier, category, gas and nameplate charge. Nothing from ground_truth.json is read.
Per unit and per Monte Carlo draw we draw the true charge left at end of life from IPCC 2006
Guidelines Vol. 3 Ch. 7 Table 7.9 (p. 7.52), a leak rate from simulator/params.json (IPCC-sourced),
a lifetime from Table 7.9, and a service history (see `draw_units`).

Scenarios (all for one unit's end of life):
  0  no ledger            no unit register, no single claim per unit: no finite bound
  1  lifetime cap only    one recovery may take nameplate x 1.05 + every recorded top-up (Tier A),
                          model charge (Tier B)  [rule before 2026-10-16]
  2  per-recovery cap,    as deployed: each recovery <= one charge, but non-decommissioning
     as deployed          recoveries can be repeated without a charge in between, so the lifetime
                          cap is reached in several transactions -> same headroom as 1
  2' per-recovery cap,    one charge per unit at end of life (what a "booked content" rule would
     single recovery      enforce: recoveries since the last recorded charge <= one charge)
  3  2' + detector        Tier A: proposed signal (IPCC ceiling + expected remaining since the last
                          recorded top-up); Tier B: module C's near-full threshold (97 %)

Run:  ai/.venv/Scripts/python.exe analysis/laundering/laundering_model.py
"""

from __future__ import annotations

import csv
import json
from dataclasses import dataclass, field, replace
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
EQUIPMENT_CSV = ROOT / "simulator" / "out" / "equipment.csv"
PARAMS_JSON = ROOT / "simulator" / "params.json"

SEED = 42
DRAWS = 400

# IPCC 2006 GL Vol. 3 Ch. 7 Table 7.9 (p. 7.52), mapped to the simulator's categories.
#   remaining: "initial charge remaining" p at end of life (% of initial charge)
#   life:      lifetime d (years)
#   eff_max:   recovery efficiency upper bound (eta_rec,d); the table gives 0 < eta < max, the 0
#              "highlights that there is no recovery in some countries" (footnote 4). For a unit
#              that IS recovered we use the upper bound (most favourable to honest volume).
IPCC = {
    "standalone_commercial":   {"sub_application": "Stand-alone Commercial Applications",
                                "remaining": (0.0, 0.8), "life": (10, 15), "eff_max": 0.70},
    "medium_large_commercial": {"sub_application": "Medium & Large Commercial Refrigeration",
                                "remaining": (0.5, 1.0), "life": (7, 15), "eff_max": 0.70},
    "chiller":                 {"sub_application": "Chillers",
                                "remaining": (0.8, 1.0), "life": (15, 30), "eff_max": 0.95},
    "split_ac":                {"sub_application": "Residential and Commercial A/C, including Heat Pumps",
                                "remaining": (0.0, 0.8), "life": (10, 20), "eff_max": 0.80},
}
# Table 7.9 operation emission x (%/yr) for residential & commercial A/C is 1-10, which matches the
# simulator's split_ac range that params.json marks as unconfirmed.

TIER_A_TOLERANCE = 1.05        # EquipmentRegistry.toleranceBps = 500
TOP_UP_BELOW = 0.85            # params.json service.topUpWhenBelowFraction (assumption)
MODULE_C_NEAR_FULL = 0.97      # ai/kigali_ai/module_c.py PARAMS["near_full_share"]


@dataclass(frozen=True)
class Assumptions:
    remaining_dist: str = "uniform"     # uniform | skew_empty | skew_full | centred | nearly_full_sim
    sudden_share: float = 0.3           # share of units whose service did NOT stop before the end
    drift_sigma: float = 0.5            # log-sd of (final leak rate / documented leak rate)
    slack_k: float = 3.0                # detector: assume the unit leaked at least 1/k of its documented rate
    ledger_years: float = float("inf")  # how long the ledger has seen the unit's top-ups
    efficiency: str = "ipcc_max"        # ipcc_max | params (U(0.85, 0.98), simulator)
    tier_b_threshold: float = MODULE_C_NEAR_FULL
    detector_mode: str = "both"         # both | ceiling (IPCC ceiling only) | time (time since top-up only)
    detector_eff: bool = False          # also scale the Tier A threshold by the IPCC efficiency upper bound
    label: str = "main"


@dataclass
class Population:
    tier: np.ndarray
    category: np.ndarray
    gas: np.ndarray
    nameplate_kg: np.ndarray
    gwp: np.ndarray
    leak: dict = field(default_factory=dict)


def load_population() -> tuple[Population, dict]:
    params = json.loads(PARAMS_JSON.read_text(encoding="utf-8"))
    eq = pd.read_csv(EQUIPMENT_CSV)
    gwp = {g: v["gwpAR4"] for g, v in params["gases"].items()}
    leak = {c: tuple(v["leakRatePerYear"]) for c, v in params["fleet"]["categories"].items()}
    pop = Population(
        tier=eq["tier"].to_numpy(),
        category=eq["category"].to_numpy(),
        gas=eq["gas"].to_numpy(),
        nameplate_kg=eq["nameplate_g"].to_numpy() / 1000.0,
        gwp=eq["gas"].map(gwp).to_numpy().astype(float),
        leak=leak,
    )
    return pop, params


def _by_category(pop: Population, fn) -> np.ndarray:
    out = np.zeros(len(pop.category))
    for c in IPCC:
        out[pop.category == c] = fn(c)
    return out


def draw_remaining(rng, lo, hi, dist, shape):
    u = rng.random(shape)
    if dist == "uniform":
        return lo + (hi - lo) * u
    if dist == "skew_empty":   # triangular, mode at the low end of the IPCC range
        return lo + (hi - lo) * (1 - np.sqrt(1 - u))
    if dist == "skew_full":    # triangular, mode at the high end
        return lo + (hi - lo) * np.sqrt(u)
    if dist == "centred":      # Beta(2, 2) inside the range
        return lo + (hi - lo) * rng.beta(2, 2, shape)
    if dist == "nearly_full_sim":  # the simulator's honest units: topped up below 85 %, so 85-100 %
        return 0.85 + 0.15 * u     # ignores the IPCC range on purpose (it is the flattering case)
    raise ValueError(dist)


def draw_units(pop: Population, a: Assumptions, rng) -> dict:
    """One honest end of life per unit and draw. Arrays have shape (DRAWS, units).

    Service history (assumption, documented in the report):
      * the unit leaks at rate x (fraction of the initial charge per year) and is topped up to full
        whenever it falls below 85 % (params.json), so recorded top-ups add up to about x * N per
        year of routine service;
      * after the last top-up the unit lost (f0 - p) of its charge, where f0 ~ U(0.95, 1.0) is the
        fill after that top-up and p is the IPCC end-of-life remaining charge;
      * either service stopped and the gas leaked out gradually at the drifted rate x * m
        (m lognormal, sigma = drift_sigma), so the last top-up was (f0 - p) / (x m) years ago;
      * or ("sudden") routine service went on until the end and the rest was lost in a failure:
        the last top-up was a uniform time within one top-up interval, and never so long ago
        that a gradual leak alone would already explain the loss.
      A unit whose loss is too large to be explained gradually within its lifetime is "sudden".
    """
    n = len(pop.tier)
    shape = (DRAWS, n)
    N = np.broadcast_to(pop.nameplate_kg, shape)
    lo = _by_category(pop, lambda c: IPCC[c]["remaining"][0])
    hi = _by_category(pop, lambda c: IPCC[c]["remaining"][1])
    x_lo = _by_category(pop, lambda c: pop.leak[c][0])
    x_hi = _by_category(pop, lambda c: pop.leak[c][1])
    d_lo = _by_category(pop, lambda c: IPCC[c]["life"][0])
    d_hi = _by_category(pop, lambda c: IPCC[c]["life"][1])

    p = draw_remaining(rng, lo, hi, a.remaining_dist, shape)
    x = x_lo + (x_hi - x_lo) * rng.random(shape)
    d = d_lo + (d_hi - d_lo) * rng.random(shape)
    f0 = np.maximum(0.95 + 0.05 * rng.random(shape), p)
    m = np.exp(a.drift_sigma * rng.standard_normal(shape))
    loss = f0 - p

    gradual_dt = loss / (x * m)
    feasible = gradual_dt <= d
    gradual = feasible & (rng.random(shape) >= a.sudden_share)
    interval = np.minimum((1 - TOP_UP_BELOW) / x, d)
    sudden_dt = rng.random(shape) * np.minimum(interval, gradual_dt)
    dt = np.where(gradual, gradual_dt, sudden_dt)

    if a.efficiency == "ipcc_max":
        eff = np.broadcast_to(_by_category(pop, lambda c: IPCC[c]["eff_max"]), shape)
    else:
        eff = 0.85 + 0.13 * rng.random(shape)

    # top-ups the ledger saw: routine service between max(install, ledger start) and the last top-up
    window = np.minimum(d, a.ledger_years)
    covered = np.maximum(0.0, window - dt)
    is_a = np.broadcast_to(pop.tier == "A", shape)
    topups_kg = np.where(is_a, x * N * covered, 0.0)  # Tier B units have no ledger before scrapping
    seen = dt < window
    n_recorded = np.where(seen & is_a, 1 + np.floor(x * covered / (1 - TOP_UP_BELOW)), 0)

    eff_max = np.broadcast_to(_by_category(pop, lambda c: IPCC[c]["eff_max"]), shape)
    return dict(eff_max=eff_max, N=N, p=p, x=x, d=d, dt=dt, gradual=gradual, eff=eff, topups_kg=topups_kg,
                n_recorded=n_recorded, window=window, x_lo=x_lo, hi=hi, is_a=is_a)


def detector_threshold(u: dict, a: Assumptions, rng) -> np.ndarray:
    """Most a recovery may book (fraction of nameplate) before it is flagged for review.

    Tier A (proposed signal, needs only what the ledger records):
      expected = 1 - x_hat * dt_seen, with x_hat the unit's documented leak rate (recorded top-ups
      per year of service; small estimation noise) if it has >= 2 recorded top-ups, else the
      category's slowest IPCC rate; dt_seen = time since the last recorded top-up (or since the
      ledger started seeing the unit). The threshold assumes the unit may have leaked k times
      slower than documented, and never accepts more than the IPCC ceiling for its category:
          threshold = 1.05 * min(ipcc_max_remaining, max(0, 1 - x_hat * dt_seen / k))
    Tier B: module C's near-full rule as it stands (share of the model charge >= 0.97).
    """
    shape = u["p"].shape
    x_hat = np.where(u["n_recorded"] >= 2, u["x"] * np.exp(0.1 * rng.standard_normal(shape)), u["x_lo"])
    dt_seen = np.where(u["n_recorded"] >= 1, u["dt"], u["window"])
    expected = np.maximum(0.0, 1 - x_hat * dt_seen / a.slack_k)
    ceiling = u["hi"] if a.detector_mode in ("both", "ceiling") else 1.0
    if a.detector_mode == "ceiling":
        expected = np.ones(shape)
    thr_a = TIER_A_TOLERANCE * np.minimum(ceiling, expected)
    if a.detector_eff:
        thr_a = thr_a * u["eff_max"]
    return np.where(u["is_a"], thr_a, a.tier_b_threshold)


def run(pop: Population, a: Assumptions, seed: int = SEED) -> dict:
    rng = np.random.default_rng(seed)
    u = draw_units(pop, a, rng)
    N, p, is_a = u["N"], u["p"], u["is_a"]
    inside = p * N
    honest_rec = inside * u["eff"]
    per_recovery = np.where(is_a, TIER_A_TOLERANCE * N, N)
    lifetime_cap = per_recovery + u["topups_kg"]
    thr = detector_threshold(u, a, rng)

    accepted = {
        "s1_lifetime_cap": lifetime_cap,
        "s2_per_recovery_as_deployed": lifetime_cap,   # reachable by repeated partial recoveries
        "s2b_per_recovery_single": per_recovery,
        "s3_detector": np.minimum(per_recovery, thr * N),
    }
    headroom = {k: np.maximum(0.0, v - inside) for k, v in accepted.items()}
    split_txs = np.ceil(lifetime_cap / per_recovery)

    honest_flag = honest_rec > thr * N + 1e-9
    gwp = np.broadcast_to(pop.gwp, N.shape)

    def total(arr, mask=None):
        mask = np.ones(arr.shape[1], bool) if mask is None else mask
        kg = arr[:, mask].sum(axis=1)
        t = (arr[:, mask] * gwp[:, mask]).sum(axis=1) / 1000.0
        return kg, t

    hon_kg, hon_t = total(honest_rec)
    ins_kg, ins_t = total(inside)

    def stats(v):
        return {"mean": float(v.mean()), "p05": float(np.percentile(v, 5)), "p95": float(np.percentile(v, 95))}

    tier_a = pop.tier == "A"
    scen = {}
    for k, h in headroom.items():
        kg, t = total(h)
        kg_a, t_a = total(h, tier_a)
        kg_b, t_b = total(h, ~tier_a)
        scen[k] = {
            "kg": stats(kg), "tco2e": stats(t),
            "tier_a_tco2e": stats(t_a), "tier_b_tco2e": stats(t_b),
            "tier_a_kg": stats(kg_a), "tier_b_kg": stats(kg_b),
            "share_of_honest_recovered_tco2e": stats(t / hon_t),
            "share_of_honest_recovered_kg": stats(kg / hon_kg),
        }
    fpr_a = honest_flag[:, tier_a].mean(axis=1)
    fpr_b = honest_flag[:, ~tier_a].mean(axis=1)

    per_cat = []
    for c in IPCC:
        mask = pop.category == c
        for tier in ("A", "B"):
            mm = mask & (pop.tier == tier)
            if not mm.any():
                continue
            row = {"category": c, "tier": tier, "units": int(mm.sum()),
                   "nameplate_kg_mean": float(pop.nameplate_kg[mm].mean()),
                   "remaining_kg_mean": float(inside[:, mm].mean()),
                   "honest_recovered_kg_mean": float(honest_rec[:, mm].mean()),
                   "recorded_topups_kg_mean": float(u["topups_kg"][:, mm].mean()),
                   "gradual_share": float(u["gradual"][:, mm].mean()),
                   "split_transactions_median": float(np.median(split_txs[:, mm])),
                   "honest_flag_rate": float(honest_flag[:, mm].mean())}
            for k, h in headroom.items():
                row[f"{k}_kg_per_unit"] = float(h[:, mm].mean())
                row[f"{k}_tco2e_total"] = float((h[:, mm] * gwp[:, mm]).sum(axis=1).mean() / 1000.0)
            per_cat.append(row)

    return {
        "assumptions": a.__dict__ | {"ledger_years": None if np.isinf(a.ledger_years) else a.ledger_years},
        "honest": {"recovered_kg": stats(hon_kg), "recovered_tco2e": stats(hon_t),
                   "remaining_kg": stats(ins_kg), "remaining_tco2e": stats(ins_t)},
        "scenarios": scen,
        "detector": {"honest_flag_rate_tier_a": stats(fpr_a), "honest_flag_rate_tier_b": stats(fpr_b),
                     "units_flagged_tier_a_mean": float(honest_flag[:, tier_a].sum(axis=1).mean())},
        "split_transactions_tier_a": {"median": float(np.median(split_txs[:, tier_a])),
                                      "p95": float(np.percentile(split_txs[:, tier_a], 95)),
                                      "max": float(split_txs[:, tier_a].max())},
        "gradual_share_tier_a": float(u["gradual"][:, tier_a].mean()),
        "per_category": per_cat,
    }


SENSITIVITY = [
    # (group, label, overrides)
    ("remaining charge distribution", "uniform in IPCC range (main)", {}),
    ("remaining charge distribution", "skewed to empty (triangular)", {"remaining_dist": "skew_empty"}),
    ("remaining charge distribution", "centred (Beta 2,2)", {"remaining_dist": "centred"}),
    ("remaining charge distribution", "skewed to full (triangular)", {"remaining_dist": "skew_full"}),
    ("remaining charge distribution", "simulator: 85-100 % (outside IPCC)", {"remaining_dist": "nearly_full_sim"}),
    ("loss mechanism", "no sudden losses", {"sudden_share": 0.0}),
    ("loss mechanism", "60 % sudden", {"sudden_share": 0.6}),
    ("loss mechanism", "all sudden", {"sudden_share": 1.0}),
    ("leak-rate drift", "sigma 0.25", {"drift_sigma": 0.25}),
    ("leak-rate drift", "sigma 1.0", {"drift_sigma": 1.0}),
    ("detector slack k", "k = 2", {"slack_k": 2.0}),
    ("detector slack k", "k = 4", {"slack_k": 4.0}),
    ("detector slack k", "k = 6", {"slack_k": 6.0}),
    ("ledger history", "ledger 10 years old", {"ledger_years": 10.0}),
    ("ledger history", "ledger 3 years old (simulator)", {"ledger_years": 3.0}),
    ("recovery efficiency", "params: U(0.85, 0.98)", {"efficiency": "params"}),
    ("Tier B threshold", "IPCC ceiling 0.80 instead of 0.97", {"tier_b_threshold": 0.80}),
    ("detector design", "IPCC ceiling only", {"detector_mode": "ceiling"}),
    ("detector design", "time since last top-up only", {"detector_mode": "time"}),
    ("detector design", "threshold x IPCC efficiency bound", {"detector_eff": True}),
    ("detector design", "threshold x IPCC efficiency bound, params efficiency",
     {"detector_eff": True, "efficiency": "params"}),
    ("simulator world", "85-100 % remaining + params efficiency",
     {"remaining_dist": "nearly_full_sim", "efficiency": "params"}),
    ("simulator world", "same + ledger 3 years old",
     {"remaining_dist": "nearly_full_sim", "efficiency": "params", "ledger_years": 3.0}),
]


def sensitivity(pop: Population) -> list[dict]:
    rows = []
    for group, label, over in SENSITIVITY:
        res = run(pop, replace(Assumptions(), label=label, **over))
        row = {"group": group, "case": label,
               "honest_recovered_tco2e": res["honest"]["recovered_tco2e"]["mean"]}
        for k, s in res["scenarios"].items():
            row[f"{k}_tco2e"] = s["tco2e"]["mean"]
            row[f"{k}_share"] = s["share_of_honest_recovered_tco2e"]["mean"]
        row["fpr_tier_a"] = res["detector"]["honest_flag_rate_tier_a"]["mean"]
        row["fpr_tier_b"] = res["detector"]["honest_flag_rate_tier_b"]["mean"]
        rows.append(row)
    return rows


# ------------------------------------------------------------------------------------------- chart

THEMES = {
    "light": {"bg": "#fcfcfb", "text": "#0b0b0b", "muted": "#52514e", "grid": "#e4e3df",
              "a": "#2a78d6", "b": "#eb6834", "ref": "#52514e", "unbounded": "#b9b8b2"},
    "dark": {"bg": "#1a1a19", "text": "#f0efec", "muted": "#c3c2b7", "grid": "#33332f",
             "a": "#3987e5", "b": "#d95926", "ref": "#c3c2b7", "unbounded": "#5e5d58"},
}

ROWS = [
    ("s0", "0  No ledger", "paper claims, no unit register"),
    ("s1_lifetime_cap", "1  Lifetime cap only", "charge + recorded top-ups (before 16 Oct)"),
    ("s2_per_recovery_as_deployed", "2  + per-recovery cap only", "bypassed by splitting (code of 16 Oct, replaced)"),
    ("s2b_per_recovery_single", "2′ + booked content per unit", "implemented: recoveries draw it down, top-ups refill"),
    ("s3_detector", "3  + padding detector", "proposed Tier A signal; module C for Tier B"),
]


def _fmt_t(v: float) -> str:
    return f"{v/1000:.1f} kt" if v >= 10_000 else f"{v:,.0f} t"


def chart_svg(res: dict, theme: str) -> str:
    c = THEMES[theme]
    W, H = 820, 520
    left, right, top = 300, 24, 104
    row_h, bar_h = 54, 22
    plot_w = W - left - right
    sc = res["scenarios"]
    honest = res["honest"]["recovered_tco2e"]["mean"]
    vmax = sc["s1_lifetime_cap"]["tco2e"]["mean"] * 1.04
    xs = lambda v: left + plot_w * v / vmax
    tick = 50_000 if vmax > 200_000 else 10_000
    font = "font-family=\"Inter, 'Segoe UI', system-ui, -apple-system, sans-serif\""
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
         f'role="img" aria-labelledby="t d" {font}>',
         f'<title id="t">Laundering capacity at decommissioning, by defence layer</title>',
         f'<desc id="d">Virgin gas that could be booked as recovered if every one of the 1,856 registered '
         f'units were padded to the limit, in tonnes CO2e. Honest recovered volume is '
         f'{honest:,.0f} t. ' + "; ".join(
             f"{lab.strip()}: " + ("no bound" if k == "s0" else f"{sc[k]['tco2e']['mean']:,.0f} t")
             for k, lab, _ in ROWS) + '</desc>',
         f'<rect width="{W}" height="{H}" fill="{c["bg"]}"/>',
         f'<text x="24" y="36" font-size="19" font-weight="600" fill="{c["text"]}">'
         f'How much virgin gas could be booked as “recovered”?</text>',
         f'<text x="24" y="60" font-size="13" fill="{c["muted"]}">Capacity if all 1,856 registered units '
         f'(simulator register) were padded to the limit at end of life · t CO₂e (AR4 GWP)</text>',
         f'<text x="24" y="78" font-size="13" fill="{c["muted"]}">True remaining charge drawn from IPCC 2006 '
         f'Table 7.9 ranges · mean of {DRAWS} draws · one assumption set (see report for sensitivity)</text>']
    # legend
    lx = left
    for key, lab in (("a", "Tier A (national registry)"), ("b", "Tier B (registered at scrapping)")):
        s.append(f'<rect x="{lx}" y="{top-14}" width="12" height="12" rx="2" fill="{c[key]}"/>')
        s.append(f'<text x="{lx+18}" y="{top-4}" font-size="12" fill="{c["muted"]}">{lab}</text>')
        lx += 200
    plot_top = top + 30
    plot_bot = plot_top + row_h * len(ROWS)
    # grid
    v = 0
    while v <= vmax:
        x = xs(v)
        s.append(f'<line x1="{x:.1f}" y1="{plot_top}" x2="{x:.1f}" y2="{plot_bot}" stroke="{c["grid"]}" stroke-width="1"/>')
        s.append(f'<text x="{x:.1f}" y="{plot_bot+18}" font-size="11" fill="{c["muted"]}" text-anchor="middle">'
                 f'{v/1000:.0f}k</text>')
        v += tick
    s.append(f'<text x="{left+plot_w:.1f}" y="{plot_bot+34}" font-size="11" fill="{c["muted"]}" text-anchor="end">'
             f't CO₂e</text>')
    # honest reference line
    xh = xs(honest)
    s.append(f'<line x1="{xh:.1f}" y1="{plot_top-4}" x2="{xh:.1f}" y2="{plot_bot}" stroke="{c["ref"]}" stroke-width="1.5"/>')
    s.append(f'<text x="{xh:.1f}" y="{plot_top-10}" font-size="11.5" fill="{c["muted"]}" text-anchor="middle">'
             f'honest recovered volume {_fmt_t(honest)}</text>')
    for i, (k, lab, sub) in enumerate(ROWS):
        y = plot_top + i * row_h + (row_h - bar_h) / 2
        s.append(f'<text x="24" y="{y+10}" font-size="13.5" font-weight="600" fill="{c["text"]}">{lab}</text>')
        s.append(f'<text x="24" y="{y+27}" font-size="11.5" fill="{c["muted"]}">{sub}</text>')
        if k == "s0":
            x1 = left + plot_w
            s.append(f'<g><title>No ledger: no unit register and no one-claim-per-unit rule, so paper '
                     f'claims have no finite bound (phantom units, repeated claims).</title>'
                     f'<rect x="{left}" y="{y}" width="{plot_w-14}" height="{bar_h}" rx="4" fill="{c["unbounded"]}" opacity="0.55"/>'
                     f'<path d="M{x1-14},{y-4} L{x1+2},{y+bar_h/2} L{x1-14},{y+bar_h+4} Z" fill="{c["unbounded"]}"/>'
                     f'<text x="{left+10}" y="{y+15.5}" font-size="12.5" font-weight="600" fill="{c["text"]}">'
                     f'no finite bound</text></g>')
            continue
        ta = sc[k]["tier_a_tco2e"]["mean"]
        tb = sc[k]["tier_b_tco2e"]["mean"]
        tot = sc[k]["tco2e"]["mean"]
        share = sc[k]["share_of_honest_recovered_tco2e"]["mean"]
        lo, hi = sc[k]["tco2e"]["p05"], sc[k]["tco2e"]["p95"]
        wa, wb = xs(ta) - left, xs(tb) - left
        tip = (f"{lab.strip()}: {tot:,.0f} t CO2e (90 % of draws {lo:,.0f}–{hi:,.0f}); "
               f"Tier A {ta:,.0f} t, Tier B {tb:,.0f} t; {share:.0%} of honest recovered volume; "
               f"{sc[k]['kg']['mean']:,.0f} kg")
        s.append(f'<g><title>{tip}</title>')
        s.append(f'<rect x="{left}" y="{y}" width="{max(wa,0):.1f}" height="{bar_h}" rx="4" fill="{c["a"]}"/>')
        if wb > 0.5:
            s.append(f'<rect x="{left+wa+2:.1f}" y="{y}" width="{max(wb-2,1):.1f}" height="{bar_h}" rx="4" fill="{c["b"]}"/>')
        if wa + wb > plot_w * 0.6:  # long bar: label inside, at its end
            s.append(f'<text x="{left+wa+wb-10:.1f}" y="{y+15.5}" font-size="12.5" fill="#ffffff" text-anchor="end">'
                     f'<tspan font-weight="600">{_fmt_t(tot)}</tspan>  · {share:.0%} of honest recovery</text></g>')
        else:
            s.append(f'<text x="{left+wa+wb+8:.1f}" y="{y+15.5}" font-size="12.5" fill="{c["text"]}" '
                     f'stroke="{c["bg"]}" stroke-width="5" stroke-linejoin="round" paint-order="stroke">'
                     f'<tspan font-weight="600">{_fmt_t(tot)}</tspan>'
                     f'<tspan fill="{c["muted"]}">  · {share:.0%} of honest recovery</tspan></text></g>')
    fy = plot_bot + 62
    notes = [
        "Headroom = what the rules would accept minus what was really inside. Capacity, not an estimate of actual fraud.",
        "Scenario 2 (code of 16 Oct, since replaced by 2′): a recovery without decommissioning could be repeated with no recorded charge in between,",
        "so the lifetime cap is reached in several transactions. Off-ledger charges before recovery are invisible to all layers.",
    ]
    for j, line in enumerate(notes):
        s.append(f'<text x="24" y="{fy+16*j}" font-size="11.5" fill="{c["muted"]}">{line}</text>')
    s.append("</svg>")
    return "\n".join(s)


def main() -> None:
    pop, _ = load_population()
    main_res = run(pop, Assumptions())
    sens = sensitivity(pop)
    meta = {
        "inputs": {"equipment": str(EQUIPMENT_CSV.relative_to(ROOT)).replace("\\", "/"),
                   "params": str(PARAMS_JSON.relative_to(ROOT)).replace("\\", "/"),
                   "units": int(len(pop.tier)), "tier_a": int((pop.tier == "A").sum()),
                   "tier_b": int((pop.tier == "B").sum()), "seed": SEED, "draws": DRAWS},
        "ipcc_table_7_9": IPCC,
        "leak_rates_params": {k: list(v) for k, v in pop.leak.items()},
        "scenario_0": "no finite bound: without a unit register and a one-claim-per-unit rule, paper claims "
                      "can name nonexistent units or the same unit twice",
    }
    (OUT / "results.json").write_text(json.dumps({"meta": meta, "main": main_res, "sensitivity": sens}, indent=2),
                                      encoding="utf-8")
    with (OUT / "per_category.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(main_res["per_category"][0]))
        w.writeheader()
        w.writerows({k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()}
                    for r in main_res["per_category"])
    with (OUT / "sensitivity.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(sens[0]))
        w.writeheader()
        w.writerows({k: (round(v, 4) if isinstance(v, float) else v) for k, v in r.items()} for r in sens)
    for theme in THEMES:
        (OUT / f"chart-{theme}.svg").write_text(chart_svg(main_res, theme), encoding="utf-8")

    h = main_res["honest"]
    print(f"honest recovered: {h['recovered_kg']['mean']:,.0f} kg = {h['recovered_tco2e']['mean']:,.0f} tCO2e "
          f"(really inside {h['remaining_kg']['mean']:,.0f} kg)")
    for k, s in main_res["scenarios"].items():
        print(f"{k:32s} {s['kg']['mean']:>10,.0f} kg {s['tco2e']['mean']:>10,.0f} t "
              f"[{s['tco2e']['p05']:,.0f}-{s['tco2e']['p95']:,.0f}] "
              f"A {s['tier_a_tco2e']['mean']:,.0f} B {s['tier_b_tco2e']['mean']:,.0f} "
              f"{s['share_of_honest_recovered_tco2e']['mean']:.0%} of honest")
    print("detector FPR tier A", main_res["detector"], "split txs", main_res["split_transactions_tier_a"],
          "gradual share", round(main_res["gradual_share_tier_a"], 3))
    print(pd.DataFrame(sens).drop(columns=["group"]).round(3).to_string())


if __name__ == "__main__":
    main()
