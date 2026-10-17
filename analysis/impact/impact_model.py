"""Climate impact of Kigali Balance: assumptions propagated, not a forecast.

Kigali Balance is an enabler. It recovers no gas and claims no credits. Its possible effect runs
through two pathways (docs/proposal/02_計畫書.md section 8), which must NOT be added because they
can cover the same gas:

  Pathway 1, more recovery:      dE1 = M x dr x GWP x alpha x phi
      M      refrigerant left in equipment scrapped per year, in a market the size of Japan's
             (MOEJ 2024: recovered + emitted). Japan is a unit conversion, not the target market:
             in Japan recovery is mandated and tracked already, so alpha is about 0 there.
      dr     increase in the disposal recovery rate                       [assumption]
      GWP    average GWP of the gas that escapes at disposal (MOEJ: 12.62 Mt / 6,878 t)
      alpha  share of dr attributable to recovery being verifiable        [assumption]
      phi    permanence: share of the extra recovered gas whose avoided emission is permanent.
             Headline: destroyed share only (MOEJ: destroyed / (destroyed + reclaimed)), because
             under a binding quota reclaimed gas adds to supply rather than displacing virgin gas
             (Carbon Containment Lab 2024). Upper variant: phi = 1 (full displacement).
  Pathway 2, blocking virgin gas sold as "reclaimed", per tonne blocked:
                                 dE2 = 1 t x GWP x beta
      beta   share of a blocked tonne that would eventually have been emitted [assumption]

Every input, its source URL and a `verified` flag are in params.json next to this file.
Monte Carlo: 100,000 draws, fixed seed. It propagates two assumed distributions; it does not
reduce them. Sensitivity: one-at-a-time tornado plus Spearman rank correlations.

Run:  ai/.venv/Scripts/python.exe analysis/impact/impact_model.py
"""

from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np

OUT = Path(__file__).resolve().parent
PARAMS_JSON = OUT / "params.json"

SEED = 20261017
DRAWS = 100_000
PCTS = (5, 50, 95)


# ------------------------------------------------------------------------------------------ inputs

def load() -> dict:
    return json.loads(PARAMS_JSON.read_text(encoding="utf-8"))


def derive(p: dict) -> dict:
    d = p["data"]
    rec = d["japan_recovered_at_disposal_t"]["value"]
    emi = d["japan_emitted_at_disposal_t"]["value"]
    emi_mt = d["japan_emitted_at_disposal_mtco2e"]["value"]
    rem = d["japan_remaining_at_disposal_t"]["value"]
    rem_mt = d["japan_remaining_at_disposal_mtco2e"]["value"]
    use = d["japan_emitted_during_use_t"]["value"]
    des = d["japan_destroyed_t"]["value"]
    recl = d["japan_reclaimed_t"]["value"]
    M = rec + emi
    return {
        "M_t": M,
        "M_t_slide_total": rem,
        "M_discrepancy_t": M - rem,
        "gwp_emitted_mix": emi_mt * 1e6 / emi,
        "gwp_remaining_mix": rem_mt * 1e6 / rem,
        "gwp_recovered_mix": (rem_mt - emi_mt) * 1e6 / rec,
        "recovery_rate_2024": rec / M,
        "recovery_rate_2024_slide_total": rec / rem,
        "permanence_destroyed_share": des / (des + recl),
        "permanence_full_displacement": 1.0,
        "beta_disposal_only": emi / M,
        "beta_flow": (use + emi) / (use + emi + rec),
        "tonnes_per_pp": M / 100.0,
    }


def tri_ppf(q: float, a: float, c: float, b: float) -> float:
    """Exact quantile of a triangular(min a, mode c, max b) distribution."""
    fc = (c - a) / (b - a)
    if q <= fc:
        return a + math.sqrt(q * (b - a) * (c - a))
    return b - math.sqrt((1 - q) * (b - a) * (b - c))


def tri(spec: dict) -> tuple[float, float, float]:
    assert spec["dist"] == "triangular"
    return spec["min"], spec["mode"], spec["max"]


# --------------------------------------------------------------------------------------- utilities

def r(x: float, n: int = 4) -> float:
    """Round to n significant digits so the JSON is stable and readable."""
    if x == 0 or not math.isfinite(x):
        return float(x)
    return float(f"{x:.{n}g}")


def summary(v: np.ndarray, n: int = 4) -> dict:
    out = {f"p{q}": r(float(np.percentile(v, q)), n) for q in PCTS}
    out["mean"] = r(float(v.mean()), n)
    return out


def ranks(v: np.ndarray) -> np.ndarray:
    o = np.empty(len(v))
    o[np.argsort(v, kind="stable")] = np.arange(len(v))
    return o


def spearman(x: np.ndarray, y: np.ndarray) -> float:
    return float(np.corrcoef(ranks(x), ranks(y))[0, 1])


# -------------------------------------------------------------------------------------- pathway 1

def e1_mt(M, dr_pp, gwp, alpha, phi):
    """Avoided emissions, MtCO2e/yr. M in t, dr in percentage points, gwp in tCO2e per t."""
    return M * (dr_pp / 100.0) * gwp * alpha * phi / 1e6


def pathway1(p: dict, dv: dict, rng) -> dict:
    A = p["assumptions"]
    dr = rng.triangular(*tri(A["delta_r_pp"]), DRAWS)
    al = rng.triangular(*tri(A["alpha"]), DRAWS)
    M, gwp = dv["M_t"], dv["gwp_emitted_mix"]
    phi_c, phi_u = dv["permanence_destroyed_share"], dv["permanence_full_displacement"]
    e_c = e1_mt(M, dr, gwp, al, phi_c)
    e_u = e1_mt(M, dr, gwp, al, phi_u)

    rho = {"delta_r_pp": spearman(dr, e_c), "alpha": spearman(al, e_c)}
    s2 = sum(v * v for v in rho.values())
    rank_corr = {k: {"spearman": r(v, 3), "share_of_rho_squared": r(v * v / s2, 3)} for k, v in rho.items()}

    # the proposal's three scenarios (no permanence factor), compared with the upper variant
    scen = []
    for name, d_pp, a in (("conservative", 1, 0.5), ("medium", 3, 0.5), ("optimistic", 5, 0.7)):
        val = e1_mt(M, d_pp, gwp, a, 1.0)
        scen.append({"scenario": name, "delta_r_pp": d_pp, "alpha": a, "mtco2e_per_yr": r(val, 3),
                     "share_of_upper_variant_draws_below": r(float((e_u < val).mean()), 3)})

    g = p["data"]["global_decommissioned_t_per_yr"]
    return {
        "role_of_japan": p["_japan_role"],
        "formula": "dE1 [MtCO2e/yr] = M [t] x dr/100 x GWP [tCO2e/t] x alpha x phi / 1e6",
        "fixed_inputs": {"M_t": dv["M_t"], "gwp_tco2e_per_t": r(dv["gwp_emitted_mix"], 5),
                         "phi_headline_destroyed_share": r(phi_c, 4), "phi_upper_full_displacement": phi_u},
        "headline_destroyed_share_only_mtco2e_per_yr": summary(e_c, 3),
        "upper_full_displacement_mtco2e_per_yr": summary(e_u, 3),
        "headline_share_of_draws_below_0p05_mt": r(float((e_c < 0.05).mean()), 3),
        "attributable_increase_pp": summary(dr * al, 3),
        "unit_conversion": {
            "japan_sized_market_t_per_attributable_pp": r(dv["tonnes_per_pp"], 4),
            "japan_sized_market_mtco2e_per_attributable_pp_headline": r(e1_mt(M, 1.0, gwp, 1.0, phi_c), 4),
            "japan_sized_market_mtco2e_per_attributable_pp_upper": r(e1_mt(M, 1.0, gwp, 1.0, phi_u), 4),
            "global_t_per_attributable_pp": [g["low"] / 100, g["high"] / 100],
            "global_note": g["note"],
            "global_vs_japan_ratio": [r(g["low"] / M, 3), r(g["high"] / M, 3)],
        },
        "rank_correlation_headline": rank_corr,
        "proposal_scenarios_recomputed": scen,
        "_draws": {"dr": dr, "al": al},
    }


def tornado(p: dict, dv: dict) -> list[dict]:
    """Headline variant; one input at a time, the others at their median or documented central value."""
    A = p["assumptions"]
    dr_t, al_t = tri(A["delta_r_pp"]), tri(A["alpha"])
    med = {"M": dv["M_t"], "dr": tri_ppf(0.5, *dr_t), "gwp": dv["gwp_emitted_mix"], "al": tri_ppf(0.5, *al_t),
           "phi": dv["permanence_destroyed_share"]}
    f = lambda x: e1_mt(x["M"], x["dr"], x["gwp"], x["al"], x["phi"])
    base = f(med)
    rows_in = [
        ("dr", "Δr  recovery-rate increase", "assumption · triangular 0 / 1 / 5 pp · p5 to p95",
         tri_ppf(0.05, *dr_t), tri_ppf(0.95, *dr_t), "pp"),
        ("al", "α  share attributable to verifiability", "assumption · triangular 0 / 0.3 / 0.8 · p5 to p95",
         tri_ppf(0.05, *al_t), tri_ppf(0.95, *al_t), ""),
        ("phi", "φ  permanence of extra recovery", "accounting choice · destroyed share to full displacement",
         dv["permanence_destroyed_share"], dv["permanence_full_displacement"], ""),
        ("gwp", "GWP of the extra recovered gas", "MOEJ 2024 · recovered mix to escaped mix",
         dv["gwp_recovered_mix"], dv["gwp_emitted_mix"], "t/t"),
        ("M", "M  gas left in scrapped equipment", "MOEJ 2024 · slide total to recovered + emitted",
         dv["M_t_slide_total"], dv["M_t"], "t"),
    ]
    rows = []
    for key, label, sub, lo, hi, unit in rows_in:
        lo_in, hi_in = dict(med), dict(med)
        lo_in[key], hi_in[key] = lo, hi
        e_lo, e_hi = f(lo_in), f(hi_in)
        rows.append({"input": key, "label": label, "range_basis": sub, "unit": unit,
                     "input_low": r(lo, 6), "input_high": r(hi, 6), "input_median": r(med[key], 6),
                     "mtco2e_low": r(e_lo, 3), "mtco2e_high": r(e_hi, 3), "swing_mtco2e": r(e_hi - e_lo, 3),
                     "swing_vs_base": r((e_hi - e_lo) / base, 3)})
    rows.sort(key=lambda x: -x["swing_mtco2e"])
    return [{"variant": "headline (destroyed share only)", "base_all_at_median_mtco2e": r(base, 3)}] + rows


# -------------------------------------------------------------------------------------- pathway 2

def pathway2(p: dict, dv: dict, rng) -> dict:
    beta = rng.triangular(*tri(p["assumptions"]["beta"]), DRAWS)
    gases = {g: v["value"] for g, v in p["data"]["gwp_ar4"].items()}
    gases["Japan disposal mix"] = dv["gwp_emitted_mix"]
    per_t = {}
    for g, gwp in gases.items():
        per_t[g] = {"gwp": r(gwp, 4), "tco2e_per_tonne_blocked": summary(gwp * beta, 3),
                    "at_beta_disposal_only": r(gwp * dv["beta_disposal_only"], 3),
                    "at_beta_flow": r(gwp * dv["beta_flow"], 3)}
    return {
        "formula": "dE2 [tCO2e per t blocked] = GWP x beta",
        "beta": summary(beta, 3),
        "beta_anchors": {"disposal_only": r(dv["beta_disposal_only"], 3), "flow": r(dv["beta_flow"], 3)},
        "per_tonne": per_t,
        "caveats": [
            "gross, not net: the servicing demand the blocked tonne would have met is most likely met instead by legal "
            "quota gas or genuine reclaimed gas (or another illegal tonne); the net effect is only the part of the "
            "blocked tonne that does not get replaced",
            "a lifetime figure with no timing: the emission would happen over years of leaks and at disposal",
            "no total: no source gives the tonnage the ledger would block",
        ],
    }


# ---------------------------------------------------------------------------------------- pilot

def pilot(p: dict) -> dict:
    """Units per arm to detect a difference in the share of scrapped units with a recovery.

    Two-proportion normal approximation, two-sided 5 %, power 80 %. The outcome must be measured
    the same way in every arm, independently of the ledger and of paper records (e.g. physical
    audit of a random sample of scrapped units). Clustering by technician or site raises n by the
    design effect 1 + (m - 1) x ICC.
    """
    q = p["pilot"]
    p0 = q["baseline_unit_recovery_share"]["value"]
    z = q["z_alpha_two_sided_5pct"] + q["z_power_80pct"]
    ce = q["cluster_example"]
    de = 1 + (ce["units_per_cluster"] - 1) * ce["icc"]
    rows = []
    for d in q["detectable_differences_pp"]:
        p1 = p0 + d / 100.0
        n = z * z * (p0 * (1 - p0) + p1 * (1 - p1)) / (d / 100.0) ** 2
        rows.append({"difference_pp": d, "units_per_arm_unclustered": int(math.ceil(n)),
                     "units_per_arm_cluster_example": int(math.ceil(n * de))})
    return {"baseline_share": p0, "test": "two proportions, two-sided 5 %, power 80 %",
            "outcome_measurement": "independent of the arm: physical audit of a random sample of scrapped units",
            "cluster_example": {"units_per_cluster": ce["units_per_cluster"], "icc": ce["icc"],
                                "design_effect": r(de, 3), "kind": ce["kind"]},
            "rows": rows}


# ------------------------------------------------------------------------------------------ chart

THEMES = {
    "light": {"bg": "#fcfcfb", "text": "#0b0b0b", "muted": "#52514e", "grid": "#e4e3df",
              "a": "#2a78d6", "b": "#eb6834", "ref": "#52514e", "band": "#b9b8b2"},
    "dark": {"bg": "#1a1a19", "text": "#f0efec", "muted": "#c3c2b7", "grid": "#33332f",
             "a": "#3987e5", "b": "#d95926", "ref": "#c3c2b7", "band": "#5e5d58"},
}


def _fmt_in(v: float, unit: str) -> str:
    if unit == "pp":
        return f"{v:.1f} pp"
    if unit == "t":
        return f"{v:,.0f} t"
    if unit == "t/t":
        return f"{v:,.0f}"
    return f"{v:.2f}"


def chart_svg(p1: dict, torn: list[dict], theme: str) -> str:
    c = THEMES[theme]
    base = torn[0]["base_all_at_median_mtco2e"]
    rows = torn[1:]
    bands = [("Headline: destroyed share only", "Monte Carlo, permanence 0.44 · p5 to p95, p50 tick",
              p1["headline_destroyed_share_only_mtco2e_per_yr"]),
             ("Upper: reclaimed gas displaces virgin", "Monte Carlo, permanence 1 · p5 to p95, p50 tick",
              p1["upper_full_displacement_mtco2e_per_yr"])]
    W, left, right, top = 820, 300, 40, 112
    row_h, bar_h = 54, 22
    plot_w = W - left - right
    vmax = 0.2
    while vmax < max(max(b[2]["p95"] for b in bands), max(x["mtco2e_high"] for x in rows)) * 1.1:
        vmax += 0.05
    xs = lambda v: left + plot_w * v / vmax
    plot_top = top + 34
    n_rows = len(rows) + len(bands)
    plot_bot = plot_top + row_h * n_rows
    H = plot_bot + 120
    font = "font-family=\"Inter, 'Segoe UI', system-ui, -apple-system, sans-serif\""
    desc = (f"Tornado chart of Pathway 1 for a market the size of Japan's, avoided emissions attributable to "
            f"verifiable recovery in MtCO2e per year. Headline (destroyed share only) with every input at its median: "
            f"{base:.3f}. " + "; ".join(f"{lab}: p5 {b['p5']:.3f}, p50 {b['p50']:.3f}, p95 {b['p95']:.3f}"
                                         for lab, _, b in bands) + ". " + "; ".join(
                f"{x['label']}: {x['mtco2e_low']:.3f} to {x['mtco2e_high']:.3f}" for x in rows) + ".")
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" '
         f'role="img" aria-labelledby="t d" {font}>',
         '<title id="t">Pathway 1 sensitivity: which assumption drives the estimate</title>',
         f'<desc id="d">{desc}</desc>',
         f'<rect width="{W}" height="{H}" fill="{c["bg"]}"/>',
         f'<text x="24" y="36" font-size="19" font-weight="600" fill="{c["text"]}">'
         f'Two assumptions and one accounting choice set the answer</text>',
         f'<text x="24" y="60" font-size="13" fill="{c["muted"]}">Pathway 1 for a market the size of Japan’s '
         f'(MOEJ 2024 flows used as a unit conversion) · Mt CO₂e per year (AR4 GWP)</text>',
         f'<text x="24" y="78" font-size="13" fill="{c["muted"]}">Not an estimate for Japan, where α ≈ 0 · '
         f'each bar moves one input, others at their median · not a forecast</text>']
    lx = left
    for key, lab in (("a", "input at its low value"), ("b", "input at its high value")):
        s.append(f'<rect x="{lx}" y="{top-14}" width="12" height="12" rx="2" fill="{c[key]}"/>')
        s.append(f'<text x="{lx+18}" y="{top-4}" font-size="12" fill="{c["muted"]}">{lab}</text>')
        lx += 180
    v, tick = 0.0, 0.05
    while v <= vmax + 1e-9:
        x = xs(v)
        s.append(f'<line x1="{x:.1f}" y1="{plot_top}" x2="{x:.1f}" y2="{plot_bot}" stroke="{c["grid"]}" stroke-width="1"/>')
        s.append(f'<text x="{x:.1f}" y="{plot_bot+18}" font-size="11" fill="{c["muted"]}" text-anchor="middle">{v:.2f}</text>')
        v = round(v + tick, 10)
    s.append(f'<text x="{left+plot_w:.1f}" y="{plot_bot+34}" font-size="11" fill="{c["muted"]}" text-anchor="end">'
             f'Mt CO₂e / yr</text>')
    xb = xs(base)
    s.append(f'<line x1="{xb:.1f}" y1="{plot_top-6}" x2="{xb:.1f}" y2="{plot_bot}" stroke="{c["ref"]}" stroke-width="1.5"/>')
    s.append(f'<text x="{xb:.1f}" y="{plot_top-12}" font-size="11.5" fill="{c["muted"]}" text-anchor="middle">'
             f'headline, all inputs at median {base:.3f}</text>')

    def halo(x, y, txt, anchor, fill=None, weight=None):
        w = f' font-weight="{weight}"' if weight else ""
        return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="12" fill="{fill or c["text"]}" text-anchor="{anchor}"{w} '
                f'stroke="{c["bg"]}" stroke-width="5" stroke-linejoin="round" paint-order="stroke">{txt}</text>')

    for i, (lab, sub, mc) in enumerate(bands):
        y = plot_top + i * row_h + (row_h - bar_h) / 2
        x5, x50, x95 = xs(mc["p5"]), xs(mc["p50"]), xs(mc["p95"])
        s.append(f'<text x="24" y="{y+10}" font-size="13.5" font-weight="600" fill="{c["text"]}">{lab}</text>')
        s.append(f'<text x="24" y="{y+27}" font-size="11.5" fill="{c["muted"]}">{sub}</text>')
        s.append(f'<g><title>{lab} ({DRAWS:,} draws over Δr and α): p5 {mc["p5"]:.3f}, p50 {mc["p50"]:.3f}, '
                 f'p95 {mc["p95"]:.3f} Mt CO2e/yr; mean {mc["mean"]:.3f}</title>'
                 f'<rect x="{x5:.1f}" y="{y+4}" width="{x95-x5:.1f}" height="{bar_h-8}" rx="4" fill="{c["band"]}"/>'
                 f'<rect x="{x50-1.5:.1f}" y="{y-2}" width="3" height="{bar_h+4}" rx="1" fill="{c["text"]}"/></g>')
        s.append(halo(x50 - 7, y + 15.5, f"p50 {mc['p50']:.2f}", "end", c["text"], "600"))
        s.append(halo(x95 + 8, y + 15.5, f"p95 {mc['p95']:.2f}", "start", c["muted"]))
    yl = plot_top + len(bands) * row_h
    s.append(f'<line x1="24" y1="{yl:.1f}" x2="{W-right}" y2="{yl:.1f}" stroke="{c["grid"]}" stroke-width="1"/>')

    for i, x in enumerate(rows, start=len(bands)):
        y = plot_top + i * row_h + (row_h - bar_h) / 2
        s.append(f'<text x="24" y="{y+10}" font-size="13.5" font-weight="600" fill="{c["text"]}">{x["label"]}</text>')
        s.append(f'<text x="24" y="{y+27}" font-size="11.5" fill="{c["muted"]}">{x["range_basis"]}</text>')
        xl, xh = xs(x["mtco2e_low"]), xs(x["mtco2e_high"])
        lo_txt, hi_txt = _fmt_in(x["input_low"], x["unit"]), _fmt_in(x["input_high"], x["unit"])
        tip = (f"{x['label']}: {lo_txt} gives {x['mtco2e_low']:.3f}, {hi_txt} gives {x['mtco2e_high']:.3f} Mt CO2e/yr "
               f"(swing {x['swing_mtco2e']:.3f}, {x['swing_vs_base']:.0%} of the headline all-median value)")
        s.append(f'<g><title>{tip}</title>')
        wl, wh = xb - xl, xh - xb
        if wl > 0.5:
            s.append(f'<rect x="{xl:.1f}" y="{y}" width="{max(wl-1,1):.1f}" height="{bar_h}" rx="4" fill="{c["a"]}"/>')
        if wh > 0.5:
            s.append(f'<rect x="{xb+1:.1f}" y="{y}" width="{max(wh-1,1):.1f}" height="{bar_h}" rx="4" fill="{c["b"]}"/>')
        if wl <= 0.5 and wh <= 0.5:
            s.append(f'<rect x="{xb-2:.1f}" y="{y}" width="4" height="{bar_h}" rx="1" fill="{c["muted"]}"/>')
        s.append("</g>")
        if x["swing_vs_base"] < 0.1:
            s.append(halo(xh + 10, y + 15.5, f"{x['mtco2e_low']:.3f}–{x['mtco2e_high']:.3f} · input {lo_txt} to {hi_txt}",
                          "start", c["muted"]))
        else:
            if wl > 0.5:
                s.append(halo(xl - 8, y + 15.5, f"{lo_txt} → {x['mtco2e_low']:.2f}", "end"))
            else:
                s.append(halo(xb - 8, y + 15.5, f"{lo_txt} (headline)", "end", c["muted"]))
            s.append(halo(xh + 8, y + 15.5, f"{hi_txt} → {x['mtco2e_high']:.2f}", "start"))
    fy = plot_bot + 58
    rc = p1["rank_correlation_headline"]
    notes = [
        f"Δr and α are assumed triangular distributions; the Monte Carlo propagates them, it does not reduce them. "
        f"Rank correlation: Δr {rc['delta_r_pp']['spearman']:.2f}, α {rc['alpha']['spearman']:.2f}.",
        "GWP and M move only within the narrow ranges the MOEJ slide supports. A pilot would measure Δr × α directly. "
        "Pathways 1 and 2 must not be added.",
        "Sources: MOEJ, OEWG48 side-event deck, Jul 2026; JRAIA decks 2012–2025; Carbon Containment Lab, Jun 2024; EIA, May 2026.",
    ]
    for j, line in enumerate(notes):
        s.append(f'<text x="24" y="{fy+16*j}" font-size="11.5" fill="{c["muted"]}">{line}</text>')
    s.append("</svg>")
    return "\n".join(s) + "\n"


# ------------------------------------------------------------------------------------------- main

def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    p = load()
    dv = derive(p)
    rng = np.random.default_rng(SEED)
    p1 = pathway1(p, dv, rng)
    p1.pop("_draws")
    torn = tornado(p, dv)
    p2 = pathway2(p, dv, rng)
    pil = pilot(p)

    ranked = torn[1:]
    results = {
        "meta": {"seed": SEED, "draws": DRAWS, "params": "analysis/impact/params.json",
                 "status": "consequences of stated assumptions; not a forecast; the two pathways must not be added; "
                           "the Monte Carlo propagates two assumed distributions and does not reduce them"},
        "derived_inputs": {k: (r(v, 5) if isinstance(v, float) else v) for k, v in dv.items()},
        "pathway1_japan_sized_market": p1,
        "pathway1_tornado": torn,
        "dominant_inputs": {
            "ranking_by_swing": [x["input"] for x in ranked],
            "note": "Δr and α (both assumptions) and the permanence accounting choice φ dominate. GWP and M move the "
                    "result only within the narrow ranges the MOEJ slide itself supports; that says nothing about "
                    "whether the slide is right.",
        },
        "pathway2_per_tonne_blocked": p2,
        "pilot_size": pil,
    }
    (OUT / "results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n",
                                      encoding="utf-8", newline="\n")
    for theme in THEMES:
        (OUT / f"chart-{theme}.svg").write_text(chart_svg(p1, torn, theme), encoding="utf-8", newline="\n")

    print(f"M = {dv['M_t']:,} t (slide total {dv['M_t_slide_total']:,} t); GWP escaped mix {dv['gwp_emitted_mix']:,.1f}; "
          f"recovery 2024 {dv['recovery_rate_2024']:.1%}; 1 pp = {dv['tonnes_per_pp']:.0f} t; "
          f"permanence (destroyed share) {dv['permanence_destroyed_share']:.3f}")
    for k in ("headline_destroyed_share_only_mtco2e_per_yr", "upper_full_displacement_mtco2e_per_yr"):
        m = p1[k]
        print(f"{k}: p5 {m['p5']}  p50 {m['p50']}  p95 {m['p95']}  mean {m['mean']}")
    print(f"  attributable increase (pp): {p1['attributable_increase_pp']}")
    print(f"  unit conversion: {p1['unit_conversion']}")
    print(f"  rank correlation: {p1['rank_correlation_headline']}")
    print(f"  proposal scenarios: {p1['proposal_scenarios_recomputed']}")
    print(f"Tornado (headline base {torn[0]['base_all_at_median_mtco2e']}):")
    for x in ranked:
        print(f"  {x['input']:4s} {x['input_low']:>10} .. {x['input_high']:<10} -> {x['mtco2e_low']} .. {x['mtco2e_high']} "
              f"swing {x['swing_mtco2e']} ({x['swing_vs_base']:.0%})")
    print(f"Pathway 2 beta {p2['beta']} anchors {p2['beta_anchors']}")
    for g, v in p2["per_tonne"].items():
        t = v["tco2e_per_tonne_blocked"]
        print(f"  {g:20s} GWP {v['gwp']:>7}  tCO2e per t blocked: p5 {t['p5']}  p50 {t['p50']}  p95 {t['p95']}")
    print(f"Pilot: {pil['rows']} design effect {pil['cluster_example']['design_effect']}")


if __name__ == "__main__":
    main()
