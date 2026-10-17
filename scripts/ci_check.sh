#!/usr/bin/env bash
# Full reproduction on a fresh machine: set up the Python environment, install the simulator's
# dependency, rebuild everything (contracts, invariants, simulator, differential test, AI, web data,
# diagrams, PDF), then run the submission checks and fail if any rebuilt file differs from the
# committed one. Used by CI and by the Docker clean-room run in ci/Dockerfile.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== toolchain"
python3 --version; node --version; forge --version | head -1

echo "== python environment"
python3 -m venv ai/.venv
ai/.venv/bin/pip install --quiet --upgrade pip
ai/.venv/bin/pip install --quiet -r ai/requirements.lock.txt

echo "== simulator dependency"
(cd simulator && npm ci --silent)

echo "== rebuild everything"
ai/.venv/bin/python scripts/rebuild.py --full

echo "== committed files reproduce byte for byte"
# Generated files that legitimately change on every build: the build date in the web bundle and the
# browser-rendered PDF bytes. Everything else must be identical to what is committed.
git diff --stat -- . ':!web/data/sim.json' ':!docs/proposal/Kigali_Balance_Problem_Statement.pdf'
if ! git diff --quiet -- . ':!web/data/sim.json' ':!docs/proposal/Kigali_Balance_Problem_Statement.pdf'; then
  echo "FAIL: rebuilt files differ from the committed ones"; exit 1
fi
python3 - <<'PY'
import json, subprocess
old = json.loads(subprocess.run(["git", "show", "HEAD:web/data/sim.json"], capture_output=True, text=True, check=True).stdout)
new = json.load(open("web/data/sim.json", encoding="utf-8"))
old["meta"].pop("built", None); new["meta"].pop("built", None)
if old != new:
    raise SystemExit("FAIL: web/data/sim.json differs from the committed bundle beyond the build date")
print("web data bundle identical apart from the build date")
PY

echo "== submission checks"
ai/.venv/bin/python scripts/check_submission.py
