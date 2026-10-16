"""Tests for AI module C (recovery plausibility). Ground truth is read only to check results."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import pandas as pd
import pytest

from kigali_ai import module_c
from kigali_ai.module_c import PARAMS, _pair_residuals, run_module_c, tier_b_recoveries
from kigali_ai.observations import load_observations
from test_module_b import _code_tokens

AI_DIR = Path(__file__).resolve().parents[1]
SIM_DIR = AI_DIR.parent / "simulator"


@pytest.fixture(scope="module")
def sim_run(tmp_path_factory) -> Path:
    out = tmp_path_factory.mktemp("sim-c") / "seed-7"
    subprocess.run(["node", "run.mjs", "--seed", "7", "--out", str(out)], cwd=SIM_DIR, check=True, capture_output=True)
    return out


def test_module_code_never_touches_ground_truth():
    code = _code_tokens(Path(module_c.__file__))
    for word in ("ground_truth", "truth", "summary.json", "phantom", "colluding", "fraud", "adaptive", "smuggl"):
        assert word not in code, f"module_c.py code mentions {word!r}"
    assert re.findall(r"\b(open|read_text|read_bytes|read_csv|read_json)\b", code) == ["read_bytes"]


def test_only_tier_b_recoveries_are_considered(sim_run):
    obs = load_observations(sim_run)
    rec = tier_b_recoveries(obs)
    tiers = obs.equipment.set_index("id")["tier"]
    assert (rec["equipment"].map(tiers) == "B").all()
    assert ((rec["share"] > 0) & (rec["share"] <= 1.0 + 1e-9)).all(), "Tier B recovery can never exceed the model charge"


def test_one_heavy_company_cannot_make_honest_pairings_look_concentrated():
    """Baselines weigh companies equally: a company booking 90 recoveries with one co-signer must not
    make an ordinary company's ordinary co-signer look over-used."""
    rows = [("big", "colluder")] * 90
    for i in range(10):
        for j, cos in enumerate(["tb1", "tb2", "colluder"]):
            rows += [(f"s{i}", cos)] * (1 + (i + j) % 2)
    rec = pd.DataFrame(rows, columns=["service", "cosigner"])
    z, _ = _pair_residuals(rec, PARAMS)
    assert z.loc["big", "colluder"] > 6
    assert z.drop(index="big").max().max() < PARAMS["pair_z_floor"]


def test_every_entity_is_scored_with_reasons(sim_run):
    obs = load_observations(sim_run)
    a, b = run_module_c(obs), run_module_c(obs)
    assert a.to_dict() == b.to_dict()
    assert re.fullmatch(r"[0-9a-f]{64}", a.model_hash)
    services = set(obs.actors.loc[obs.actors["role"] == "SERVICE", "id"])
    assert services <= {e.actor for e in a.entities}
    for e in a.entities:
        if e.flagged:
            assert e.reasons


def test_naive_phantom_and_accomplice_are_flagged_honest_are_not(sim_run):
    report = run_module_c(load_observations(sim_run))
    truth = json.loads((sim_run / "ground_truth.json").read_text(encoding="utf-8"))  # test-side only
    naive = {s for s, p in truth["fraud"]["phantomProfiles"].items() if p == "naive"}
    accomplices = set(truth["fraud"]["colludingTakeBackPoints"])
    fraud = set(truth["fraud"]["phantomProfiles"]) | accomplices
    flagged = {e.actor for e in report.flagged()}
    assert naive | accomplices <= flagged
    assert not flagged - fraud, "an honest entity was flagged"


def test_params_keep_small_samples_out():
    assert PARAMS["pair_min_recoveries"] >= 5
    assert PARAMS["volume_min_count"] >= 5
