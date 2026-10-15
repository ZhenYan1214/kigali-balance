"""Tests for AI module B. Ground truth is read here only to check results, never by the module."""

from __future__ import annotations

import ast
import json
import re
import subprocess
from pathlib import Path

import pandas as pd
import pytest

from kigali_ai import module_b
from kigali_ai.module_b import PARAMS, match_invoices, run_module_b
from kigali_ai.observations import FORBIDDEN_FILES, load_observations

AI_DIR = Path(__file__).resolve().parents[1]
SIM_DIR = AI_DIR.parent / "simulator"


@pytest.fixture(scope="module")
def sim_run(tmp_path_factory) -> Path:
    out = tmp_path_factory.mktemp("sim") / "seed-7"
    subprocess.run(["node", "run.mjs", "--seed", "7", "--out", str(out)], cwd=SIM_DIR, check=True, capture_output=True)
    return out


# ------------------------------------------------------------------ no access to the answers

def test_loader_refuses_ground_truth(sim_run):
    for name in FORBIDDEN_FILES:
        with pytest.raises(PermissionError):
            module_b_guard = load_observations.__globals__["_guard"]
            module_b_guard(sim_run / name)


def _code_tokens(path: Path) -> str:
    """Identifiers and string literals of a module, without docstrings and comments."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    docstrings = {
        id(node.body[0].value)
        for node in ast.walk(tree)
        if isinstance(node, (ast.Module, ast.FunctionDef, ast.ClassDef)) and node.body
        and isinstance(node.body[0], ast.Expr) and isinstance(node.body[0].value, ast.Constant)
    }
    parts = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            parts.append(node.id)
        elif isinstance(node, ast.Attribute):
            parts.append(node.attr)
        elif isinstance(node, ast.Constant) and isinstance(node.value, str) and id(node) not in docstrings:
            parts.append(node.value)
    return " ".join(parts)


def test_module_code_never_touches_ground_truth():
    code = _code_tokens(Path(module_b.__file__))
    for word in ("ground_truth", "truth", "summary.json", "phantom", "smuggl", "inflatedYield", "oversell", "fraud"):
        assert word not in code, f"module_b.py code mentions {word!r}"
    # the only file the module reads is its own source (to hash itself)
    assert re.findall(r"\b(open|read_text|read_bytes|read_csv|read_json)\b", code) == ["read_bytes"]


def test_observation_files_only(sim_run, monkeypatch):
    """Even if ground truth sits next to the observations, loading never reads it."""
    opened: list[str] = []
    original = Path.read_bytes

    def spy(self):
        opened.append(self.name)
        return original(self)

    monkeypatch.setattr(Path, "read_bytes", spy)
    load_observations(sim_run)
    assert not set(opened) & set(FORBIDDEN_FILES)


# ------------------------------------------------------------------ invoice reconciliation

def _frames(deliveries, invoices):
    d = pd.DataFrame(deliveries, columns=["distributor", "buyer", "gas", "date", "grams"])
    d["date"] = pd.to_datetime(d["date"])
    i = pd.DataFrame(invoices, columns=["invoice", "distributor", "buyer", "gas", "date", "grams"])
    i["date"] = pd.to_datetime(i["date"])
    return d, i


def test_consolidated_and_lagged_invoices_are_backed():
    d, i = _frames(
        [("D", "S", "R-404A", "2025-01-01", 10_000), ("D", "S", "R-404A", "2025-01-01", 5_000),
         ("D", "S", "R-404A", "2025-02-01", 8_000)],
        [("i1", "D", "S", "R-404A", "2025-01-09", 15_100),  # one invoice for two shipments, +0.7 %
         ("i2", "D", "S", "R-404A", "2025-01-27", 7_950)],  # billed 5 days before delivery
    )
    inv, dlv = match_invoices(d, i)
    assert inv["matched"].all()
    assert dlv["matched"].all()


def test_orphan_and_late_invoices_are_unbacked():
    d, i = _frames(
        [("D", "S", "R-404A", "2025-01-01", 10_000)],
        [("i1", "D", "S", "R-404A", "2025-01-02", 10_000),
         ("i2", "D", "S", "R-404A", "2025-01-03", 2_000),  # nothing left to back it
         ("i3", "D", "T", "R-404A", "2025-01-02", 3_000),  # buyer T received nothing
         ("i4", "D", "S", "R-134a", "2025-01-02", 1_000)],  # wrong gas
    )
    inv, _ = match_invoices(d, i)
    assert inv.set_index("invoice")["matched"].to_dict() == {"i1": True, "i2": False, "i3": False, "i4": False}


def test_padding_within_tolerance_is_not_an_unbacked_invoice():
    """The adaptive fraudster's trick: +4 % per invoice stays inside the 5 % tolerance (signal D1 is
    blind to it by design; only the aggregate D2 can see it)."""
    d, i = _frames([("D", "S", "R-404A", "2025-01-01", 10_000)], [("i1", "D", "S", "R-404A", "2025-01-02", 10_400)])
    inv, _ = match_invoices(d, i)
    assert bool(inv["matched"].iloc[0])
    assert inv["unbacked_g"].iloc[0] == pytest.approx(400)


# ------------------------------------------------------------------ end to end on one simulated run

def test_report_is_deterministic_and_auditable(sim_run):
    obs = load_observations(sim_run)
    a, b = run_module_b(obs), run_module_b(obs)
    assert a.to_dict() == b.to_dict()
    assert re.fullmatch(r"[0-9a-f]{64}", a.model_hash)
    assert re.fullmatch(r"[0-9a-f]{64}", a.input_snapshot)
    assert {e.role for e in a.entities} == {"DISTRIBUTOR", "RECLAIMER"}
    for e in a.entities:
        assert 0.0 <= e.score <= 1.0
        if e.flagged:
            assert e.reasons, "every flag must carry a human-readable reason"


def test_naive_fraud_is_flagged_and_honest_entities_are_not(sim_run):
    report = run_module_b(load_observations(sim_run))
    truth = json.loads((sim_run / "ground_truth.json").read_text(encoding="utf-8"))  # test-side only
    naive = {a for a, p in {**truth["fraud"]["oversellingProfiles"], **truth["fraud"]["inflatedYieldProfiles"]}.items()
             if p == "naive"}
    fraud = set(truth["fraud"]["oversellingProfiles"]) | set(truth["fraud"]["inflatedYieldProfiles"])
    flagged = {e.actor for e in report.flagged()}
    assert naive <= flagged
    assert not flagged - fraud, "an honest entity was flagged"


def test_cutoff_keeps_only_older_data_and_changes_the_snapshot(sim_run):
    full = load_observations(sim_run)
    early = load_observations(sim_run, "2024-09-30")
    assert early.events["t"].max() <= pd.Timestamp("2024-09-30")
    assert early.invoices["date"].max() <= pd.Timestamp("2024-09-30")
    assert early.snapshot_hash != full.snapshot_hash
    assert run_module_b(early).cutoff == "2024-09-30T00:00:00"


def test_params_are_documented_constants():
    assert PARAMS["flag_threshold"] > PARAMS["if_weight"], "the Isolation Forest alone must never flag an entity"
