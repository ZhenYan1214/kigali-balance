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

# On GitHub Actions, failures are also reported as annotations: those can be read through the
# public API without signing in, unlike the job log.
annotate() { [ -n "${GITHUB_ACTIONS:-}" ] && echo "::error title=$1::$(printf '%s' "$2" | tr '\n' '|' | cut -c1-900)"; return 0; }

echo "== rebuild everything"
if ! out=$(ai/.venv/bin/python scripts/rebuild.py --full 2>&1); then
  echo "$out"; annotate "rebuild failed" "$(echo "$out" | tail -12)"; exit 1
fi
echo "$out"

echo "== committed files reproduce byte for byte"
# The only rebuilt files allowed to differ are the PDFs: browsers embed their own version and timestamps.
git diff --stat -- . ':!docs/proposal/*.pdf'
if ! git diff --quiet -- . ':!docs/proposal/*.pdf'; then
  annotate "rebuilt files differ" "$(git diff --stat -- . ':!docs/proposal/*.pdf' | tail -15)"
  echo "FAIL: rebuilt files differ from the committed ones"; exit 1
fi
echo "every rebuilt file matches the commit (PDFs excluded)"

echo "== submission checks"
if ! out=$(ai/.venv/bin/python scripts/check_submission.py 2>&1); then
  echo "$out"; annotate "submission checks failed" "$(echo "$out" | grep -E '^FAIL' | head -10)"; exit 1
fi
echo "$out"
