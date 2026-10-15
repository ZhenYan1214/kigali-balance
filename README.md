# Kigali Balance

**Making every recovered, reclaimed and destroyed kilogram of HFC refrigerant add up — across borders and carbon registries.**

IEEE ClimateChain Global Hackathon 2026 · Track 3: Sustainable Supply Chains (also Track 1: Carbon Markets & Emissions Transparency)

> Work in progress. All data in this repository is simulated; no real company or government data is used.

## The problem

HFC refrigerants are super-pollutants (1 kg of R-404A ≈ 3.9 t CO₂e). They are recorded in separate systems: customs quotas, technician logbooks, reclaimer reports and carbon-credit registries. Each now checks its own records. US reclaimers report input and output, Isometric reconciles each container, and Japan issues electronic manifests. But no one checks the same kilogram *between* these systems. That seam lets virgin or smuggled gas be sold as "reclaimed", which carries a price premium, a quota exemption in the EU and carbon credits. It also leaves cross-registry uniqueness of destruction credits to a supplier declaration.

A shared ledger is only justified where no single trusted operator spans all the parties: several independent carbon registries, competing reclaimers, and recovered gas shipped across borders for destruction. Inside one country, a regulator's database is enough.

See the two-page problem statement: [`docs/proposal/Kigali_Balance_Problem_Statement.pdf`](docs/proposal/Kigali_Balance_Problem_Statement.pdf).

## Core rule

> Every kilogram claimed as "reclaimed" or "destroyed" must trace back to a kilogram recovered from a real, registered piece of equipment.

| Layer | Role |
|---|---|
| Physical anchors | Signed scale readings bound to cylinder IDs (one open lot per cylinder), recoveries co-signed by the unit's owner, lab and destruction certificates signed by independent parties (EIP-712, verified on-chain) |
| Shared ledger | Per-gas mass conservation, non-interchangeable provenance classes, recovery caps that count recorded top-ups, a 180-day quarantine against charge-and-recover laundering, one-registry-only claim lock for destruction events |
| AI | Flags what is compliant but implausible (leak gaps, mass-balance anomalies, implausible recoveries) for human review |

## Honest limits

- The ledger cannot see inside a cylinder; physical truth comes from weighing and lab sampling.
- It cannot catch gas that never enters it; it makes legitimate gas provable instead.
- It is not confidential by default: consortium members can see lot quantities. A production version would store commitments instead of grams.

## Repository

| Path | Contents |
|---|---|
| `src/` | Solidity contracts: `KigaliLedger`, `EquipmentRegistry`, `DestructionClaims`, `IdentityRegistry`, `Governance`, `FlagRegistry` |
| `test/` | 131 Foundry unit tests (including the demo scenario and attacks on every signature) plus 9 fuzzed invariants |
| `simulator/` | Deterministic simulator of an HFC economy with injected fraud, plus a differential test that replays every simulated event against the real contracts |
| `ai/` | Anomaly detection on observations only. Modules A (leakage gaps) and B (mass balance) are done, each with an evaluation on held-out simulated runs in `ai/reports/`; module C is in progress |
| `docs/` | Proposal, plan, research and design notes |

## Quick start

```bash
git clone --recurse-submodules https://github.com/ZhenYan1214/kigali-balance.git
cd kigali-balance
forge test                          # contracts

cd simulator
node run.mjs && npm test            # simulated data + self-checks
npm install && node replay.mjs      # differential test against the contracts (needs `forge build`)

cd ../ai
python -m venv .venv && .venv/Scripts/pip install -r requirements.lock.txt   # macOS/Linux: .venv/bin/pip
.venv/Scripts/python run_module_a.py        # leakage-gap flags with reasons for ../simulator/out
.venv/Scripts/python run_module_b.py        # mass-balance flags with reasons
.venv/Scripts/python -m pytest              # module tests, incl. no-ground-truth guards
.venv/Scripts/python evaluate_module_b.py   # precision/recall on held-out simulated runs
.venv/Scripts/python evaluate_module_a.py --seeds 21-40
```

Requirements: Foundry ≥ 1.8, Node.js ≥ 20, Python 3.12 (for `ai/`).

## License

MIT
