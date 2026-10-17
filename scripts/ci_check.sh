#!/usr/bin/env bash
# Full reproduction on a fresh machine: set up the Python environment, install the simulator's
# dependency, rebuild everything (contracts, invariants, simulator, differential test, AI, web data,
# diagrams, climate model, PDFs), then run the submission checks and fail if any rebuilt file differs from the
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
npm ci --prefix simulator --silent

echo "== rebuild everything"
ai/.venv/bin/python scripts/rebuild.py --full

echo "== committed files reproduce byte for byte"
# The only rebuilt files allowed to differ are the PDFs: browsers embed their own version and timestamps.
git diff --stat -- . ':!docs/proposal/*.pdf'
if ! git diff --quiet -- . ':!docs/proposal/*.pdf'; then
  echo "FAIL: rebuilt files differ from the committed ones"; exit 1
fi
echo "every rebuilt file matches the commit (PDFs excluded)"

echo "== submission checks"
ai/.venv/bin/python scripts/check_submission.py
