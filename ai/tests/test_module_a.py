"""Tests for AI module A (leakage gaps). Ground truth is read only to check results."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import pandas as pd
import pytest

from kigali_ai import module_a
from kigali_ai.module_a import LEAK_BANDS, PARAMS, run_module_a, unit_table
from kigali_ai.observations import load_observations
from test_module_b import _code_tokens

AI_DIR = Path(__file__).resolve().parents[1]
SIM_DIR = AI_DIR.parent / "simulator"


@pytest.fixture(scope="module")
def sim_run(tmp_path_factory) -> Path:
    out = tmp_path_factory.mktemp("sim-a") / "seed-7"
    subprocess.run(["node", "run.mjs", "--seed", "7", "--out", str(out)], cwd=SIM_DIR, check=True, capture_output=True)
    return out


def test_module_code_never_touches_ground_truth():
    code = _code_tokens(Path(module_a.__file__))
    for word in ("ground_truth", "truth", "summary.json", "leakRate", "offLedger", "fraud", "phantom", "smuggl", "adaptive"):
        assert word not in code, f"module_a.py code mentions {word!r}"
    assert re.findall(r"\b(open|read_text|read_bytes|read_csv|read_json)\b", code) == ["read_bytes"]


def test_leak_bands_are_ordered_fractions():
    for category, (lo, hi) in LEAK_BANDS.items():
        assert 0 < lo < hi < 1, category


def test_unit_exposure_respects_installation_removal_and_cutoff(sim_run):
    obs = load_observations(sim_run, "2025-09-30")
    units = unit_table(obs)
    span = (obs.cutoff - obs.events["t"].min()) / pd.Timedelta(days=365.25)
    assert (units["years"] > 0).all()
    assert (units["years"] <= span + 1e-9).all()
    removed = obs.equipment.set_index("id")["removed_at"].dropna()
    early = removed[pd.to_datetime(removed) < pd.Timestamp("2024-09-30")].index
    if len(early):
        assert (units.set_index("unit").loc[units["unit"].isin(early).values, "years"] < span).all()
    assert (units["expected_min_g"] <= units["expected_mid_g"]).all()


def test_every_service_company_is_scored_with_reasons(sim_run):
    obs = load_observations(sim_run)
    a, b = run_module_a(obs), run_module_a(obs)
    assert a.to_dict() == b.to_dict()
    assert re.fullmatch(r"[0-9a-f]{64}", a.model_hash)
    assert len(a.entities) == (obs.actors["role"] == "SERVICE").sum()
    for e in a.entities:
        assert {s.name for s in e.signals} == {"A1_purchases_off_ledger", "A2_recorded_leakage_vs_peers", "A3_silent_units"}
        if e.flagged:
            assert e.reasons


def test_naive_off_ledger_companies_are_flagged_and_honest_ones_are_not(sim_run):
    report = run_module_a(load_observations(sim_run))
    truth = json.loads((sim_run / "ground_truth.json").read_text(encoding="utf-8"))  # test-side only
    naive = {s for s, p in truth["fraud"]["offLedgerProfiles"].items() if p == "naive"}
    buys_off_ledger = set(truth["fraud"]["offLedgerProfiles"]) | set(truth["fraud"]["phantomTierBServices"])
    flagged = {e.actor for e in report.flagged()}
    assert naive <= flagged
    assert not flagged - buys_off_ledger, "an honest company was flagged"


def test_lumpy_refills_are_not_held_against_small_fleets():
    """1.1.0 fix: expected refills discount the share of the charge a unit may lose before a refill."""
    units = pd.DataFrame({
        "unit": ["u1"], "service": ["s"], "tier": ["A"], "category": ["standalone_commercial"],
        "nameplate_g": [2_000], "years": [1.0], "recorded_g": [0.0],
        "expected_min_g": [20.0], "expected_mid_g": [160.0],
    })
    sigs = module_a._leakage_signals(units, PARAMS)["s"]
    a2 = next(s for s in sigs if s.name.startswith("A2"))
    assert a2.score == 0.0  # 160 g expected loss < 15 % of 2 kg: no refill was due yet
