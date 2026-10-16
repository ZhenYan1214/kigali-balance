"""Tests for the end-of-life closure check. Ground truth is read only to check results."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import pandas as pd
import pytest

from kigali_ai import closure
from kigali_ai.closure import IPCC_REMAINING, PARAMS, closed_units, run_closure
from kigali_ai.observations import load_observations
from test_module_b import _code_tokens

AI_DIR = Path(__file__).resolve().parents[1]
SIM_DIR = AI_DIR.parent / "simulator"


@pytest.fixture(scope="module")
def sim_run(tmp_path_factory) -> Path:
    out = tmp_path_factory.mktemp("sim-closure") / "seed-7"
    subprocess.run(["node", "run.mjs", "--seed", "7", "--out", str(out)], cwd=SIM_DIR, check=True, capture_output=True)
    return out


def test_code_never_touches_ground_truth():
    code = _code_tokens(Path(closure.__file__))
    for word in ("ground_truth", "truth", "summary.json", "fraud", "eolCharge", "vented"):
        assert word not in code, f"closure.py code mentions {word!r}"
    assert re.findall(r"\b(open|read_text|read_bytes|read_csv|read_json)\b", code) == []


def test_only_registered_tier_a_units_removed_before_the_end(sim_run):
    obs = load_observations(sim_run, "2025-09-30")
    units = closed_units(obs)
    assert (units["tier"] == "A").all()
    assert (units["removed_at"] <= pd.Timestamp("2025-09-30")).all()


def test_each_unit_is_classified_from_the_ledger(sim_run):
    obs = load_observations(sim_run)
    report = run_closure(obs)
    ev = obs.events
    recovered = set(ev[(ev["type"] == "RECOVER") & (ev["status"] == "accepted")]["equipment"])
    for u in report.units:
        if u.status == "recovered":
            assert u.equipment in recovered and u.recovered_g > 0
        if u.status == "no_record":
            assert u.recovered_g == 0
            lo, hi = IPCC_REMAINING[u.category]
            assert (u.missing_g_low, u.missing_g_high) == (round(u.nameplate_g * lo), round(u.nameplate_g * hi))
        if u.status == "pending":
            assert u.missing_g_low == u.missing_g_high == 0


def test_no_record_units_really_held_gas(sim_run):
    """Scored against ground truth: a unit flagged as closing without recovery left service holding gas."""
    report = run_closure(load_observations(sim_run))
    truth = json.loads((sim_run / "ground_truth.json").read_text(encoding="utf-8"))["units"]
    gap = [u for u in report.units if u.status == "no_record"]
    assert gap, "the simulator vents part of the scrapped units"
    assert all(truth[u.equipment]["eolCharge"] > 0 for u in gap)


def test_recent_removals_are_pending_not_flagged(sim_run):
    obs = load_observations(sim_run)
    report = run_closure(obs)
    end = obs.events["t"].max()
    for u in report.units:
        if u.status == "pending":
            assert end - pd.Timestamp(u.removed_at) < pd.Timedelta(days=PARAMS["pending_days"] + 1)


def test_totals_match_units(sim_run):
    report = run_closure(load_observations(sim_run))
    gap = [u for u in report.units if u.status == "no_record"]
    assert report.totals["no_record"] == len(gap)
    assert report.totals["missing_kg_low"] == round(sum(u.missing_g_low for u in gap) / 1000, 1)
    assert report.totals["missing_kg_low"] <= report.totals["missing_kg_high"]
