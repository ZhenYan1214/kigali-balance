"""Rebuild every generated artefact of Kigali Balance in one command, and record what it measured.

    python scripts/rebuild.py            # contracts, simulator, AI, web data, diagrams
    python scripts/rebuild.py --full     # also the differential test (~1 min) and the PDFs (problem statement,
                                         # technical annex, and the two merged into the Devpost upload)
    python scripts/rebuild.py --quick    # skip the test suites (data and pages only)

Steps run in dependency order and stop at the first failure. The numbers each step measured
(test counts, events replayed, flags) go to reports/rebuild-latest.json, which
scripts/check_submission.py compares against the README and HANDOFF.
Nothing here sends a transaction or touches the network except the browser fetches of CDN code
that the web pages themselves make. Run from any directory.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SIM = ROOT / "simulator"
AI = ROOT / "ai"
PY = AI / ".venv" / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
EDGE = Path(r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")
CHROME = Path(r"C:/Program Files/Google/Chrome/Application/chrome.exe")


def tool(name: str) -> str:
    found = shutil.which(name) or shutil.which(f"{name}.cmd")
    if not found:
        raise SystemExit(f"required tool not found on PATH: {name}")
    return found


def run(args: list[str], cwd: Path = ROOT, timeout: int = 900) -> str:
    """Run a command, return its combined output, raise with the tail of the output on failure."""
    p = subprocess.run(args, cwd=cwd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=timeout)
    out = (p.stdout or "") + (p.stderr or "")
    if p.returncode != 0:
        tail = "\n".join(out.strip().splitlines()[-25:])
        raise RuntimeError(f"{' '.join(Path(a).name if i == 0 else a for i, a in enumerate(args))} failed ({p.returncode}):\n{tail}")
    return out


class Steps:
    def __init__(self) -> None:
        self.results: dict[str, dict] = {}

    def step(self, name: str, fn) -> None:
        t0 = time.time()
        print(f"-> {name} ...", flush=True)
        try:
            measured = fn() or {}
        except Exception as exc:  # noqa: BLE001 - report and stop
            self.results[name] = {"ok": False, "seconds": round(time.time() - t0, 1), "error": str(exc)}
            self.save()
            print(f"   FAILED\n{exc}")
            raise SystemExit(1)
        self.results[name] = {"ok": True, "seconds": round(time.time() - t0, 1), **measured}
        print(f"   ok ({self.results[name]['seconds']} s) {json.dumps(measured) if measured else ''}")

    def save(self) -> None:
        path = ROOT / "reports" / "rebuild-latest.json"
        path.parent.mkdir(exist_ok=True)
        path.write_text(json.dumps({"at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "steps": self.results}, indent=2), encoding="utf-8", newline="\n")


# ---------------------------------------------------------------------------- steps

def contracts_build() -> dict:
    run([tool("forge"), "build"])
    return {}


def contracts_test() -> dict:
    data = json.loads(_json_tail(run([tool("forge"), "test", "--summary", "--json"])))
    suites = {r["suite"]: r for r in data["results"]}
    failed = sum(r["failed"] for r in suites.values())
    if failed:
        raise RuntimeError(f"{failed} Foundry tests failed")
    inv_out = run([tool("forge"), "test", "--match-contract", "InvariantsTest", "-vv"])
    invariants = sorted(set(re.findall(r"\[PASS\] (invariant_\w+)", inv_out)))
    unit = sum(r["passed"] for name, r in suites.items() if name != "InvariantsTest")
    return {"unit_tests": unit, "invariants": len(invariants)}


def _json_tail(text: str) -> str:
    """forge may print compiler notes before the JSON document; keep the JSON."""
    return text[text.index("{"):]


def simulator_run() -> dict:
    run([tool("node"), "run.mjs"], cwd=SIM)
    events = sum(1 for _ in (SIM / "out" / "ledger_events.jsonl").open(encoding="utf-8"))
    return {"seed": 42, "ledger_events": events}


def simulator_test() -> dict:
    out = run([tool("npm"), "test"], cwd=SIM)
    # Node prints "# pass N" (TAP reporter) or "ℹ pass N" (spec reporter, the default on newer Node)
    passed = int(re.search(r"(?:#|ℹ) pass (\d+)", out).group(1))
    failed = int(re.search(r"(?:#|ℹ) fail (\d+)", out).group(1))
    if failed:
        raise RuntimeError(f"{failed} simulator tests failed")
    return {"simulator_tests": passed}


def differential() -> dict:
    out = run([tool("node"), "replay.mjs"], cwd=SIM, timeout=1800)
    m = re.search(r"Replayed (\d+) events", out)
    if "Differential test passed" not in out or not m:
        raise RuntimeError("differential test did not pass:\n" + "\n".join(out.splitlines()[-10:]))
    f = re.search(r"AI flags written to FlagRegistry: (\d+)", out)
    return {"replayed_events": int(m.group(1)), "ai_flags_on_chain": int(f.group(1)) if f else 0}


def ai_run() -> dict:
    flagged = {}
    for m in ("a", "b", "c"):
        run([str(PY), f"run_module_{m}.py"], cwd=AI)
        d = json.loads((AI / "out" / f"module_{m}" / "flags.json").read_text(encoding="utf-8"))
        flagged[m] = sum(1 for e in d["entities"] if e["flagged"])
    run([str(PY), "run_closure.py"], cwd=AI)
    closure = json.loads((AI / "out" / "closure" / "closure.json").read_text(encoding="utf-8"))["totals"]
    return {"flagged": flagged, "closure_no_record": closure["no_record"]}


def ai_test() -> dict:
    out = run([str(PY), "-m", "pytest", "-q"], cwd=AI)
    m = re.search(r"(\d+) passed", out)
    if not m or re.search(r"\d+ failed", out):
        raise RuntimeError("AI tests failed:\n" + "\n".join(out.splitlines()[-10:]))
    return {"ai_tests": int(m.group(1))}


def web_data() -> dict:
    run([tool("node"), "web/build_data.mjs"])
    # GS1 EPCIS 2.0 exports of the passport's example lots (reads the example list from sim.json)
    run([tool("node"), "simulator/epcis/export_epcis.mjs"])
    meta = json.loads((ROOT / "web" / "data" / "sim.json").read_text(encoding="utf-8"))["meta"]
    epcis = json.loads((ROOT / "web" / "data" / "epcis" / "index.json").read_text(encoding="utf-8"))
    return {"web_events": meta["events"], "epcis_examples": len(epcis["examples"])}


def diagrams() -> dict:
    run([str(PY), "docs/assets/make_diagrams.py"])
    return {}


def find_browser() -> Path | None:
    """Edge or Chrome on Windows, Chrome/Edge apps on macOS, or a Chromium-family binary on PATH.
    Set KB_BROWSER to override."""
    if os.environ.get("KB_BROWSER"):
        return Path(os.environ["KB_BROWSER"])
    fixed = [EDGE, CHROME,
             Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
             Path("/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge")]
    for p in fixed:
        if p.exists():
            return p
    for name in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "microsoft-edge", "msedge", "chrome"):
        if shutil.which(name):
            return Path(shutil.which(name))
    return None


def _print_pdf(html: Path, pdf: Path) -> int:
    """Print an HTML page to PDF with a headless Chromium-family browser; return the page count."""
    browser = find_browser()
    if not browser:
        raise RuntimeError("needs Microsoft Edge, Google Chrome or Chromium to print the PDF (or set KB_BROWSER)")
    profile = ROOT / "reports" / ".pdf-profile"
    before = pdf.stat().st_mtime if pdf.exists() else 0
    flags = ["--headless=new", "--disable-gpu", "--no-first-run", f"--user-data-dir={profile}",
             "--no-pdf-header-footer", f"--print-to-pdf={pdf}"]
    # Chromium refuses to run as root (a CI container) without --no-sandbox, and on recent Ubuntu
    # (GitHub-hosted runners) its sandbox cannot start because unprivileged user namespaces are
    # restricted. The page printed is our own static HTML.
    if (hasattr(os, "geteuid") and os.geteuid() == 0) or (sys.platform.startswith("linux") and os.environ.get("CI")):
        flags.append("--no-sandbox")
    p = subprocess.run([str(browser), *flags, html.as_uri()], capture_output=True, text=True, errors="replace", timeout=120)
    for _ in range(30):  # the browser may return before the file is flushed
        if pdf.exists() and pdf.stat().st_mtime > before:
            break
        time.sleep(1)
    if not pdf.exists() or pdf.stat().st_mtime <= before:
        # (before 2026-10-17 this case was not checked, and the committed PDF was silently counted)
        tail = " | ".join(((p.stderr or "") + (p.stdout or "")).strip().splitlines()[-4:])
        raise RuntimeError(f"the browser ({browser.name}) did not write {pdf.name}: exit {p.returncode}; {tail}")
    return len(re.findall(rb"/Type\s*/Page[^s]", pdf.read_bytes()))


PROPOSAL = ROOT / "docs" / "proposal"
STATEMENT_PDF = PROPOSAL / "Kigali_Balance_Problem_Statement.pdf"
ANNEX_PDF = PROPOSAL / "Kigali_Balance_Technical_Annex.pdf"
SUBMISSION_PDF = PROPOSAL / "Kigali_Balance_Submission.pdf"


def problem_statement_pdf() -> dict:
    pages = _print_pdf(PROPOSAL / "problem_statement.html", STATEMENT_PDF)
    if pages != 2:
        raise RuntimeError(f"problem statement PDF has {pages} pages, the limit is 2")
    return {"pdf_pages": pages}


def annex_pdf() -> dict:
    pages = _print_pdf(PROPOSAL / "technical_annex.html", ANNEX_PDF)
    return {"annex_pages": pages}


def submission_pdf() -> dict:
    """Devpost takes one file: the two-page problem statement followed by the technical annex."""
    out = run([str(PY), "-c", (
        "import sys, pypdf\n"
        "w = pypdf.PdfWriter()\n"
        "for f in sys.argv[2:]: w.append(f)\n"
        "w.write(sys.argv[1]); print(len(w.pages))"
    ), str(SUBMISSION_PDF), str(STATEMENT_PDF), str(ANNEX_PDF)])
    pages = int(out.strip().splitlines()[-1])
    size_mb = SUBMISSION_PDF.stat().st_size / 1e6
    if size_mb > 35:
        raise RuntimeError(f"submission PDF is {size_mb:.1f} MB; Devpost's upload limit is about 35 MB")
    return {"submission_pages": pages, "submission_mb": round(size_mb, 2)}


def impact_model() -> dict:
    run([str(PY), "analysis/impact/impact_model.py"])
    r = json.loads((ROOT / "analysis" / "impact" / "results.json").read_text(encoding="utf-8"))
    return {"impact_results": "analysis/impact/results.json", "impact_keys": sorted(r)[:6]}


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):  # cp950 consoles garble en dashes and CJK otherwise
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--quick", action="store_true", help="skip the test suites")
    ap.add_argument("--full", action="store_true", help="also run the differential test and print the PDF")
    args = ap.parse_args()
    if not PY.exists():
        raise SystemExit(f"Python venv missing: {PY} (see README, AI modules)")

    s = Steps()
    s.step("contracts: build", contracts_build)
    if not args.quick:
        s.step("contracts: unit tests and invariants", contracts_test)
    s.step("simulator: seed 42", simulator_run)
    if not args.quick:
        s.step("simulator: tests", simulator_test)
    s.step("AI: modules A, B, C and closure check", ai_run)
    if args.full:  # after the AI, so its flags can be written back to FlagRegistry on the replay chain
        s.step("differential test against the contracts, AI flags written on chain", differential)
    if not args.quick:
        s.step("AI: tests", ai_test)
    s.step("web: data bundle", web_data)
    s.step("analysis: climate impact model", impact_model)
    s.step("docs: diagrams", diagrams)
    if args.full:
        s.step("docs: problem statement PDF", problem_statement_pdf)
        s.step("docs: technical annex PDF", annex_pdf)
        s.step("docs: submission PDF (statement + annex)", submission_pdf)
    s.save()
    print("\nall steps passed -> reports/rebuild-latest.json")


if __name__ == "__main__":
    main()
