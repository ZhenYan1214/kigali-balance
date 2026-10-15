"""Loading the observation files: the only data an AI module may read.

The simulator writes two worlds into the same folder. `ground_truth.json` and `summary.json`
describe what really happened and are for evaluation only; this loader refuses to open them.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

OBSERVATION_FILES = ("actors.csv", "equipment.csv", "invoices.csv", "ledger_events.jsonl")
FORBIDDEN_FILES = ("ground_truth.json", "summary.json")


@dataclass(frozen=True)
class Observations:
    actors: pd.DataFrame
    equipment: pd.DataFrame
    invoices: pd.DataFrame
    events: pd.DataFrame
    snapshot_hash: str  # sha256 over the observation files, recorded with every flag
    cutoff: pd.Timestamp | None  # only data dated on or before this instant was kept

    def role_of(self) -> dict[str, str]:
        return dict(zip(self.actors["id"], self.actors["role"]))


def _guard(path: Path) -> None:
    if path.name in FORBIDDEN_FILES:
        raise PermissionError(f"{path.name} is evaluation-only data and must never be read by a module")


def load_observations(folder: str | Path, cutoff: str | pd.Timestamp | None = None) -> Observations:
    """Load the observation files from `folder`, optionally keeping only data up to `cutoff`."""
    folder = Path(folder)
    digest = hashlib.sha256()
    for name in OBSERVATION_FILES:
        path = folder / name
        _guard(path)
        digest.update(name.encode())
        digest.update(path.read_bytes())

    actors = pd.read_csv(folder / "actors.csv")
    equipment = pd.read_csv(folder / "equipment.csv")
    invoices = pd.read_csv(folder / "invoices.csv", parse_dates=["date"])
    events = pd.read_json(folder / "ledger_events.jsonl", lines=True, convert_dates=False)
    events["t"] = pd.to_datetime(events["t"], utc=True).dt.tz_localize(None)

    cut = None
    if cutoff is not None:
        cut = pd.Timestamp(cutoff)
        invoices = invoices[invoices["date"] <= cut].reset_index(drop=True)
        events = events[events["t"] <= cut].reset_index(drop=True)
        digest.update(f"cutoff:{cut.isoformat()}".encode())

    return Observations(actors, equipment, invoices, events, digest.hexdigest(), cut)
