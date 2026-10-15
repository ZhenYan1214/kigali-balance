# Kigali Balance

**Making every recovered, reclaimed and destroyed kilogram of HFC refrigerant add up — across borders and carbon registries.**

IEEE ClimateChain Global Hackathon 2026 · Track 3: Sustainable Supply Chains (also Track 1: Carbon Markets & Emissions Transparency)

> Work in progress. All data in this repository is simulated; no real company or government data is used.

## The problem

HFC refrigerants are super-pollutants (1 kg of R-404A ≈ 3.9 t CO₂e). They are recorded in separate systems — customs quotas, technician logbooks, waste slips and carbon-credit registries — but no system checks that the kilograms claimed as *recovered*, *reclaimed* or *destroyed* add up across them. That gap lets virgin or smuggled gas be sold as "reclaimed", and it could let the same destroyed kilogram be credited twice.

See the two-page problem statement: [`docs/proposal/Kigali_Balance_Problem_Statement.pdf`](docs/proposal/Kigali_Balance_Problem_Statement.pdf).

## Core rule

> Every kilogram claimed as "reclaimed" or "destroyed" must trace back to a kilogram recovered from a real, registered piece of equipment.

| Layer | Role |
|---|---|
| Physical anchors | Signed cylinder IDs, signed scale readings, signed lab certificates (EIP-712, verified on-chain) |
| Shared ledger | Per-gas mass conservation, non-interchangeable provenance classes, one-registry-only claim lock for destruction events |
| AI | Flags what is compliant but implausible (leak gaps, mass-balance anomalies, implausible recoveries) for human review |

## Repository

| Path | Contents |
|---|---|
| `src/` | Solidity contracts: `KigaliLedger`, `EquipmentRegistry`, `DestructionClaims`, `IdentityRegistry`, `Governance`, `FlagRegistry` |
| `test/` | 108 Foundry unit tests (including the demo scenario) plus 7 fuzzed invariants |
| `simulator/` | Deterministic simulator of an HFC economy with injected fraud, plus a differential test that replays every simulated event against the real contracts |
| `ai/` | Anomaly-detection modules (in progress) |
| `docs/` | Proposal, plan, research and design notes |

## Quick start

```bash
git clone --recurse-submodules https://github.com/ZhenYan1214/kigali-balance.git
cd kigali-balance
forge test                          # contracts

cd simulator
node run.mjs && npm test            # simulated data + self-checks
npm install && node replay.mjs      # differential test against the contracts (needs `forge build`)
```

Requirements: Foundry ≥ 1.8, Node.js ≥ 20, Python 3.12 (for `ai/`).

## License

MIT
