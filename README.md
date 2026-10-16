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
- `KigaliLedger` is a single 18.8 KB contract whose deployment needs more gas than Sepolia's per-transaction cap allows; the demo runs on OP Sepolia and splitting the ledger is on the roadmap.

## Repository

| Path | Contents |
|---|---|
| `src/` | Solidity contracts: `KigaliLedger`, `EquipmentRegistry`, `DestructionClaims`, `IdentityRegistry`, `Governance`, `FlagRegistry` |
| `test/` | 131 Foundry unit tests (including the demo scenario and attacks on every signature) plus 9 fuzzed invariants |
| `simulator/` | Deterministic simulator of an HFC economy with injected fraud, plus a differential test that replays every simulated event against the real contracts |
| `ai/` | Anomaly detection on observations only. Modules A (leakage gaps), B (mass balance) and C (recovery plausibility) are done, each evaluated on its own held-out simulated runs in `ai/reports/` |
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
.venv/Scripts/python run_module_c.py        # recovery-plausibility flags with reasons
.venv/Scripts/python -m pytest              # module tests, incl. no-ground-truth guards
.venv/Scripts/python evaluate_module_b.py   # precision/recall on held-out simulated runs
.venv/Scripts/python evaluate_module_a.py --seeds 21-40
.venv/Scripts/python evaluate_module_c.py --seeds 61-80
```

Requirements: Foundry ≥ 1.8, Node.js ≥ 20, Python 3.12 (for `ai/`).


## Testnet deployment (OP Sepolia)

`script/Deploy.s.sol` deploys the six contracts, sets up the 3-of-4 governance and roles, and runs the demo on chain: charge, Tier A recovery with the owner's co-signature, honest reclamation, and destruction with an independent verifier's certificate claimed by one registry. The four steps that must be rejected (overselling, inflated reclaimed output, mixing in virgin gas, claiming a destruction twice) are checked in local simulation and logged, because a reverting transaction would abort the broadcast.

```bash
cp .env.example .env    # fill in a TEST-ONLY deployer key, an OP Sepolia RPC URL and an Etherscan API key
forge script script/Deploy.s.sol --rpc-url op_sepolia --broadcast --verify
```

Deployed and verified on OP Sepolia on 2026-10-16 (142 transactions, none failed; all six contracts verified on Etherscan and Sourcify):

| Contract | Address |
|---|---|
| `KigaliLedger` | [0xC2b8904E911BA41d270Df95e734D53808c4FA73A](https://sepolia-optimism.etherscan.io/address/0xC2b8904E911BA41d270Df95e734D53808c4FA73A#code) |
| `EquipmentRegistry` | [0x9EBc2C426299debb81B1C5796CdEBDd8A281c324](https://sepolia-optimism.etherscan.io/address/0x9EBc2C426299debb81B1C5796CdEBDd8A281c324#code) |
| `DestructionClaims` | [0xcd1c1E9C0c35dfC5eB3548aca0B98802E1661083](https://sepolia-optimism.etherscan.io/address/0xcd1c1E9C0c35dfC5eB3548aca0B98802E1661083#code) |
| `IdentityRegistry` | [0x411544fCD057701A0C7Ce4297C75d77821Ad52af](https://sepolia-optimism.etherscan.io/address/0x411544fCD057701A0C7Ce4297C75d77821Ad52af#code) |
| `FlagRegistry` | [0xa04C3c47F32099072fa654a9F58259a63B50309B](https://sepolia-optimism.etherscan.io/address/0xa04C3c47F32099072fa654a9F58259a63B50309B#code) |
| `Governance` | [0xaFa2E28071382a0144dE63eFFE79b8E2B32dC935](https://sepolia-optimism.etherscan.io/address/0xaFa2E28071382a0144dE63eFFE79b8E2B32dC935#code) |

| Demo step on chain | Transaction |
|---|---|
| Mint 100 kg virgin (step 1) | [0x7643dfea…](https://sepolia-optimism.etherscan.io/tx/0x7643dfea7c78fca659416ff0d9db42889b644df3fafe9d60a2266f1d2ba0a3aa) |
| Tier A recovery with owner co-signature (step 4) | [0xa109ea9c…](https://sepolia-optimism.etherscan.io/tx/0xa109ea9c94b7e88e1c3f4466d43877f32df5a9aefcf8b88e2bb37db333a2a456) |
| Reclaim 7.6 kg from 8 kg, lab-certified (step 5) | [0xf4870165…](https://sepolia-optimism.etherscan.io/tx/0xf48701658f0dbb9f0b2ceac5bcfd0f295e86caa024adf0080e9822e08af10727) |
| Destruction with verifier certificate (step 6) | [0x516b3d5f…](https://sepolia-optimism.etherscan.io/tx/0x516b3d5ff534550984a2fb0e9a771441c35675886d608a46822bf4038b948ae9) |
| Claim by one registry (step 6) | [0xb1f6773a…](https://sepolia-optimism.etherscan.io/tx/0xb1f6773ac5f075c4785fc0504ad7b96dd90cc1be288837355c10be8da0eddc60) |

Addresses are written to `deployments/11155420.json`. All demo actor keys are derived from the one deployer key, so on the testnet one person holds all four governance seats: it shows the 3-of-4 mechanics, not real independence. All data is simulated.

**Why OP Sepolia and not Sepolia.** On Sepolia's current gas schedule, deploying `KigaliLedger` (18.8 KB) needs about 29.7M gas, above the 16.78M per-transaction cap (EIP-7825), so it cannot be deployed there as one contract. On OP Sepolia the same deployment needs about 4.1M gas. The script refuses to run on Sepolia. **Roadmap:** split the ledger (for example lot accounting, recovery and destruction) into contracts below about 10 KB each, which also suits a permissioned consortium chain such as Besu.

## License

MIT
