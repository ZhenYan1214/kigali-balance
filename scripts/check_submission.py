"""Pre-submission checks: is everything a judge will see consistent, working and safe to publish?

    python scripts/check_submission.py             # offline checks
    python scripts/check_submission.py --online    # also fetch every external link in README.md

Run scripts/rebuild.py first: several checks compare the documents with the numbers it measured
(reports/rebuild-latest.json). Exit code 1 if any check FAILs; WARN items need a human look.
Reads only; never edits a file.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
results: list[tuple[str, str, str]] = []


def record(status: str, name: str, detail: str = "") -> None:
    results.append((status, name, detail))


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def tracked_files() -> list[str]:
    out = subprocess.run(["git", "ls-files", "-z"], cwd=ROOT, capture_output=True, check=True).stdout
    return [f for f in out.decode("utf-8").split("\0") if f]


# ---------------------------------------------------------------------------- secrets

SECRET_PATTERNS = [
    (r"(?i)PRIVATE_KEY\s*=\s*\"?0x[0-9a-f]{64}", "a private key assignment"),
    (r"(?i)(alchemy\.com|infura\.io|quiknode\.pro)/v\d/[A-Za-z0-9_-]{16,}", "an RPC URL with an API key"),
    (r"(?i)etherscan[^\n]{0,40}(apikey|api_key)\s*[=:]\s*\"?[A-Z0-9]{30,}", "an Etherscan API key"),
    (r"-----BEGIN (RSA |EC )?PRIVATE KEY-----", "a PEM private key"),
]


def check_secrets(files: list[str]) -> None:
    if ".env" in files:
        record("FAIL", "secrets: .env is tracked by git")
    hits = []
    for f in files:
        p = ROOT / f
        if p.suffix.lower() in {".png", ".pdf", ".jpg", ".svg"} or p.stat().st_size > 5_000_000:
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for pat, what in SECRET_PATTERNS:
            if re.search(pat, text):
                hits.append(f"{f}: {what}")
    record("FAIL" if hits else "PASS", "secrets: no keys in tracked files", "; ".join(hits))


def check_large_files(files: list[str]) -> None:
    big = [f"{f} ({(ROOT / f).stat().st_size / 1e6:.1f} MB)" for f in files if (ROOT / f).exists() and (ROOT / f).stat().st_size > 10_000_000]
    record("WARN" if big else "PASS", "repository: no file above 10 MB", ", ".join(big))


# ---------------------------------------------------------------------------- numbers

def check_numbers() -> None:
    path = ROOT / "reports" / "rebuild-latest.json"
    if not path.exists():
        record("WARN", "numbers: run scripts/rebuild.py first", "reports/rebuild-latest.json missing")
        return
    steps = json.loads(path.read_text(encoding="utf-8"))["steps"]
    m = {k: v for s in steps.values() for k, v in s.items() if k not in ("ok", "seconds")}
    readme, handoff = read("README.md"), read("HANDOFF.md")
    expect = []
    if "unit_tests" in m:
        expect += [("README badge", readme, f"tests-{m['unit_tests']}_unit_%2B_{m['invariants']}_invariants"),
                   ("README results", readme, f"{m['unit_tests']} passing"),
                   ("README invariants", readme, f"{m['invariants']} passing"),
                   ("HANDOFF tests", handoff, f"{m['unit_tests']} 個單元測試＋{m['invariants']} 條不變量")]
    if "replayed_events" in m:
        n = f"{m['replayed_events']:,}"
        expect += [("README differential", readme, f"{n} simulated events"), ("HANDOFF differential", handoff, f"{n} 筆全部一致")]
    for label, text, needle in expect:
        record("PASS" if needle in text else "FAIL", f"numbers: {label} says {needle!r}")
    if "ledger_events" in m and "web_events" in m:
        ok = m["ledger_events"] == m["web_events"]
        record("PASS" if ok else "FAIL", "web: dashboard data built from the current simulator run",
               f"simulator {m['ledger_events']} events, web data {m['web_events']}")


# ---------------------------------------------------------------------------- web data safety

GROUND_TRUTH_KEYS = ("leakRatePerYear", "eolCharge", "finalCharge", "offLedgerTopUpServices", "phantomTierBServices",
                     "colludingTakeBackPoints", "smuggledByDistributor", "reclaimerYieldCentre", "serviceLeakFactor")


def check_web() -> None:
    sim = read("web/data/sim.json")
    leaked = [k for k in GROUND_TRUTH_KEYS if f'"{k}"' in sim]
    record("FAIL" if leaked else "PASS", "web: no simulator ground truth in the dashboard data", ", ".join(leaked))
    chain = json.loads(read("web/data/chain.json"))
    dep = json.loads(read("deployments/11155420.json"))
    diff = [k for k, a in chain["contracts"].items() if dep.get(k) != a]
    record("FAIL" if diff else "PASS", "web: contract addresses match deployments/11155420.json", ", ".join(diff))
    if "alchemy" in json.dumps(chain).lower():
        record("FAIL", "web: chain.json must use a public RPC, not a keyed provider URL")


# ---------------------------------------------------------------------------- README links and deliverables

def check_readme_links(online: bool) -> None:
    readme = read("README.md")
    links = re.findall(r"\]\(([^)\s]+)\)|(?:src|href|srcset)=\"([^\"]+)\"", readme)
    targets = [a or b for a, b in links]
    missing, external = [], []
    for t in targets:
        if t.startswith(("http://", "https://")):
            external.append(t)
            continue
        if t.startswith("#") or t.startswith("mailto:"):
            continue
        rel = t.split("#")[0]
        if rel and not (ROOT / rel).exists():
            missing.append(t)
    record("FAIL" if missing else "PASS", f"README: {len(targets) - len(external)} local links resolve", ", ".join(missing))
    anchors = set(re.findall(r"\]\(#([^)]+)\)", readme))
    heads = {re.sub(r"[^a-z0-9 -]", "", h.strip().lower()).replace(" ", "-") for h in re.findall(r"^#+ (.+)$", readme, re.M)}
    bad = sorted(a for a in anchors if a not in heads)
    record("FAIL" if bad else "PASS", "README: in-page anchors point at real headings", ", ".join(bad))
    dep = json.loads(read("deployments/11155420.json"))
    absent = [k for k in ("KigaliLedger", "EquipmentRegistry", "DestructionClaims", "IdentityRegistry", "FlagRegistry", "Governance") if dep[k] not in readme]
    record("FAIL" if absent else "PASS", "README: lists every deployed contract address", ", ".join(absent))
    if online:
        broken = []
        for url in sorted(set(external)):
            try:
                req = urllib.request.Request(url, method="GET", headers={"User-Agent": "kigali-balance-link-check"})
                with urllib.request.urlopen(req, timeout=20) as r:
                    if r.status >= 400:
                        broken.append(f"{url} ({r.status})")
            except Exception as exc:  # noqa: BLE001
                code = getattr(exc, "code", None)
                if code not in (403, 429):  # many sites refuse scripts; a human checks those
                    broken.append(f"{url} ({code or type(exc).__name__})")
        record("WARN" if broken else "PASS", f"README: {len(set(external))} external links respond", "; ".join(broken))
    else:
        record("WARN", "README: external links not checked", "run with --online")


def check_deliverables() -> None:
    pdf = ROOT / "docs" / "proposal" / "Kigali_Balance_Problem_Statement.pdf"
    pages = len(re.findall(rb"/Type\s*/Page[^s]", pdf.read_bytes()))
    record("PASS" if pages == 2 else "FAIL", "deliverables: problem statement PDF is 2 pages", f"{pages} pages")
    html = read("docs/proposal/problem_statement.html")
    pdf_m, html_m = pdf.stat().st_mtime, (ROOT / "docs/proposal/problem_statement.html").stat().st_mtime
    record("PASS" if pdf_m >= html_m else "WARN", "deliverables: PDF is newer than its HTML source",
           "re-run scripts/rebuild.py --full" if pdf_m < html_m else "")
    for rel in ("README.md", "docs/proposal/problem_statement.html"):
        text = read(rel)
        cjk = re.findall(r"[一-鿿]{2,}", text)
        record("WARN" if cjk else "PASS", f"deliverables: {rel} is English only", ", ".join(cjk[:5]))
        todo = re.findall(r"\b(TODO|TBD|FIXME|lorem ipsum|XXX)\b", text, re.I)
        record("FAIL" if todo else "PASS", f"deliverables: {rel} has no placeholders", ", ".join(todo))
    if "only state hashes are anchored" in html:
        record("FAIL", "deliverables: problem statement still says only state hashes are anchored")


def check_git(files: list[str]) -> None:
    dirty = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, capture_output=True, text=True).stdout.strip()
    record("WARN" if dirty else "PASS", "git: working tree clean", f"{len(dirty.splitlines())} changed paths" if dirty else "")
    ahead = subprocess.run(["git", "status", "-sb"], cwd=ROOT, capture_output=True, text=True).stdout.splitlines()[0]
    record("WARN", "git: branch and remote", ahead.replace("## ", ""))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--online", action="store_true", help="also fetch external links")
    args = ap.parse_args()
    files = tracked_files()
    check_secrets(files)
    check_large_files(files)
    check_numbers()
    check_web()
    check_readme_links(args.online)
    check_deliverables()
    check_git(files)

    width = max(len(n) for _, n, _ in results)
    for status, name, detail in results:
        print(f"{status:<4}  {name:<{width}}  {detail}")
    fails = sum(1 for s, _, _ in results if s == "FAIL")
    warns = sum(1 for s, _, _ in results if s == "WARN")
    print(f"\n{len(results)} checks: {fails} FAIL, {warns} WARN")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
