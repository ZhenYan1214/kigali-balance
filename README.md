<div align="center">

<img src="docs/assets/logo.svg" width="112" alt="Kigali Balance logo">

# Kigali Balance

**Every kilogram has to add up.**<br>
Gas sold as "reclaimed" and gas credited as "destroyed" must both trace back to a recovery from real, registered equipment, co-signed by its owner. A shared ledger checks this across reclaimers, borders and carbon registries: the gap the HFC phase-down under the Kigali Amendment leaves open.

[![Track 3](https://img.shields.io/badge/IEEE_ClimateChain_2026-Track_3%3A_Supply_Chains-0f766e)](https://ieee-climatechain-hack.devpost.com/)
[![Contracts](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)](src/)
[![Tests](https://img.shields.io/badge/tests-162_unit_%2B_10_invariants-1a7f37)](test/)
[![verify](https://github.com/ZhenYan1214/kigali-balance/actions/workflows/verify.yml/badge.svg)](https://github.com/ZhenYan1214/kigali-balance/actions/workflows/verify.yml)
[![OP Sepolia](https://img.shields.io/badge/OP_Sepolia-deployed_%26_verified-ff0420?logo=optimism&logoColor=white)](#live-on-op-sepolia)
[![Data](https://img.shields.io/badge/data-simulated-9a6700)](#honest-limits)
[![License](https://img.shields.io/badge/license-MIT-59636e)](#license)

**See it in 60 seconds:** ① [the dashboard](https://zhenyan1214.github.io/kigali-balance/): the books balance to the gram, and what the rules refused · ② [the passport of lot 42](https://zhenyan1214.github.io/kigali-balance/passport.html?lot=42): a credited lot whose recovery the AI flags · ③ [a claim on chain](https://sepolia-optimism.etherscan.io/tx/0x1fffa78764819ad612f7caf6a888ada604707be6c813f7a53af301800e456201): one registry claiming one destruction event on OP Sepolia, and [a second registry refused](https://sepolia-optimism.etherscan.io/tx/0x3ba6bc74cc2be7407712daa3e477d9ab431daa21b77bc5c23f9984f2b9fdf4e8) with `AlreadyClaimed`

[Problem](#the-problem) · [Gap](#what-already-exists) · [Solution](#the-solution) · [Architecture](#architecture) · [Results](#results) · [Dashboard](#dashboard-and-provenance-passport) · [Live demo](#live-on-op-sepolia) · [Quick start](#quick-start) · [Limits](#honest-limits)

</div>

---

## The problem

HFC refrigerants are super-pollutants: one kilogram of R-404A warms the planet as much as about **3.9 t of CO₂**. Their kilograms are recorded in separate systems: customs quotas, technician logbooks, reclaimer reports and carbon-credit registries. Each system now checks its own records. **No one checks the same kilogram between them.**

That seam is where fraud pays.

| Weak point | What goes wrong | Evidence |
|---|---|---|
| The **"reclaimed"** label | Gas reclaimed in the EU is exempt from its servicing ban until 2030 and sold at a premium (reclaimed R-404A cost 140% of virgin in Q1 2025). Virgin R-404A has been sold as reclaimed. | EU price monitoring; Cooling Post, Apr 2025 |
| **Carbon credits** | Reclaimed and destroyed HFCs earn credits. Whether a kilogram was "not credited elsewhere" is a supplier declaration, not a check. | ACR; Isometric protocol v1.0 |
| **End of life** | Japan recovered only 43% of the HFC in scrapped equipment in 2024; 6,878 t (12.6 MtCO₂e) was released. | Japan MOE, 2026 |
| **Illegal trade** | EU seizures rose from about 250 t (2023) to about 670 t (2024), including virgin gas labelled as reclaimed. | EIA, Apr 2026 |

> **If virgin gas is labelled reclaimed, a carbon credit is paid for virgin gas.** The "reclaimed" fraud and the crediting problem are one conservation problem.

Full argument and sources: the two-page [problem statement (PDF)](docs/proposal/Kigali_Balance_Problem_Statement.pdf). Architecture, security assessment, climate-impact model and roadmap: the [technical annex (PDF)](docs/proposal/Kigali_Balance_Technical_Annex.pdf).

## What already exists

Each of these reconciles its own kilograms well. None reconciles a reclaimer's output against recovery recorded elsewhere, or a destruction event against every registry that might credit it.

| System | What it reconciles | What it cannot see |
|---|---|---|
| US EPA (40 CFR 82, 84) | Reclaimer input and output per gas; annual independent audit | US only; not linked to credit registries |
| EU F-gas Portal, customs, Art. 26 reports | Quota at the border; annual reclaimed and destroyed totals | Reclaimers do not report recovered input |
| Japan RaMS | Electronic manifests from recovery to destruction | One country; recovery still near 43% |
| Türkiye FARAVET / EKOMVET | Quotas, shipment documents, 21,456 equipment records | Not linked to EU systems |
| Isometric, Verra, ACR | Chain of custody per container, inside one registry | Uniqueness across registries is a declaration |

**We checked this against real public records** ([audit](docs/research/03-registry-audit.md), [data](research/registry-audit/)). The audit covers 436 ODS/HFC destruction and reclamation projects at ACR, CAR and Verra, plus California's ARB issuance table, all accessed 2026-10-16:

- **Where two ledgers share a key, the public record can be checked, and it reconciles.** ARB issues credits only after the registry retires the matching registry credits. For 291 ARB reporting periods, 270 match the registry exactly, 21 are lower on the ARB side, and none are higher. This is a working cross-ledger claim lock, but it operates per project period, not per kilogram.
- **Between ACR, CAR and Verra there is no shared key at the kilogram level.** No registry publishes which container and how many kilograms each of the 42.4 million destruction credits draws on. Certificate-of-destruction identifiers are public for 31% of them, in three incompatible forms; 58% have none (mostly California and Washington compliance credits, which do reconcile per reporting period); 11% we did not assess. Almost all are ODS destruction credits: HFC destruction crediting is only now opening.
- **The exposure is structural.** Three U.S. destruction facilities sit behind 75.7% of the destruction credits. ACR and CAR projects both have credited destruction windows at the same facility in the same month (50 months at one facility). We found **no evidence of double counting**; the point is that an outsider cannot check.

A shared ledger is only justified where **no single trusted operator spans all the parties**: several independent carbon registries, competing reclaimers, and recovered gas shipped across borders for destruction. Inside one country, a regulator's database is enough.

## The solution

> **Every kilogram claimed as "reclaimed" or "destroyed" must trace back to a kilogram recovered from a real, registered piece of equipment.**

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/kilogram-flow-dark.svg">
  <img src="docs/assets/kilogram-flow-light.svg" alt="Life of a kilogram: virgin lot, charged into equipment, recovered with the owner's co-signature, then reclaimed or destroyed and claimed by one registry; the contracts reject seven kinds of violation." width="100%">
</picture>

| Layer | What it does |
|---|---|
| **Physical anchors** | Signed scale readings bound to one cylinder ID; each recovery co-signed by the unit's owner; lab and destruction certificates signed by parties independent of the operator. All EIP-712, verified on chain. |
| **Conservation rules** | Per-gas mass conservation, provenance classes that cannot be swapped, a booked content per unit that every recovery draws down and only recorded top-ups refill, a 180-day quarantine against charge-and-recover laundering, and a claim lock so one registry credits each destruction event. |
| **AI** | Flags what is compliant but implausible, with reasons a reviewer can read. It never sanctions anyone. |

### What changes compared with single-system reconciliation

| | Today | With Kigali Balance |
|---|---|---|
| Reclaimed output vs. recovered input | Reported per reclaimer and audited yearly, inside one country | Checked on every reclamation, against recoveries signed by other parties |
| Destruction credits | Each registry checks its own projects; "not credited elsewhere" is declared | Each destruction event can be claimed once, without registries sharing databases |
| A recovery | Recorded in one national system | Scale reading **and** the unit owner's co-signature; never more than is booked inside the unit (one charge, drawn down by recoveries, refilled only by recorded top-ups) |
| To fake a kilogram | An operator's records only need to agree with themselves | A second, accountable signer must collude, and collusion leaves patterns the AI looks for (module C) |

## Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/architecture-dark.svg">
  <img src="docs/assets/architecture-light.svg" alt="Architecture: independent signers send EIP-712 attestations to KigaliLedger; Governance, IdentityRegistry, EquipmentRegistry, DestructionClaims and FlagRegistry surround it; carbon registries, reclaimers, buyers and regulators rely on it; three AI modules read ledger events and invoices off chain." width="100%">
</picture>

| Contract | Role |
|---|---|
| [`KigaliLedger`](src/KigaliLedger.sol) | Lots and provenance classes; enforces the conservation rules (annex A.4); verifies every attestation |
| [`EquipmentRegistry`](src/EquipmentRegistry.sol) | Tier A (registry-backed) and Tier B (photo plus model database) units, their owners and booked content |
| [`DestructionClaims`](src/DestructionClaims.sol) | Claim lock: each credit-eligible destruction event can be claimed by one registry, once |
| [`IdentityRegistry`](src/IdentityRegistry.sol) | Roles and operator-bound device keys |
| [`Governance`](src/Governance.sol) | 3-of-4 multisig that grants roles |
| [`FlagRegistry`](src/FlagRegistry.sol) | AI flags with model and input hashes; only a regulator can close one. The differential test writes every AI flag here and reads it back |

## Results

All results are on simulated data and measure our own fraud generator: naive fraud is detectable by construction, and adaptive fraudsters keep every number inside honest ranges. How to read the AI scores (fraud prevalence, sample sizes, what is built in) is in [annex A.6](docs/proposal/Kigali_Balance_Technical_Annex.pdf).

**Contracts**

| Check | Result |
|---|---|
| Foundry unit tests | 162 passing, including the demo scenario, attacks on every signature, and a regression test for each fixed finding of two AI-assisted red-team passes (AI agents given the code and told to break it; each found a High-severity laundering path, the second a way around our fix of the first; both fixed). No human audit yet |
| Fuzzed invariants (256 runs × 128 steps, `FOUNDRY_PROFILE=deep`) | 10 passing; about 2,160 unconsented recoveries, 1,700 self-certified destructions and 3,300 recoveries above what the unit could still hold (including padding split over several recoveries) attempted per campaign, none succeeded |
| Differential test | 7,359 simulated events (twelve kinds of injected fraud) replayed against the compiled contracts: every accept/reject decision, reason, lot ID and gas total matches the simulator's separately written rule mirror. The AI's flags are then written to `FlagRegistry` and read back |
| Static analysis | Slither, 102 detectors: 0 High, 0 Medium ([triage](docs/security/static-analysis.md)); rerun on every push |

**AI modules** (20 held-out simulated runs per module, never used for design; 36 months; threshold fixed in advance; precision and "honest flagged" are per company)

| Module | Question | Precision | Honest flagged | Naive fraud caught | Adaptive fraud caught | Fraud volume over 3 years, adaptive vs naive |
|---|---|---|---|---|---|---|
| [A · Leakage gap](ai/reports/module_a_evaluation.md) | Are a company's top-ups plausible for its registered units? | 0.97 | 0.5% | 100% | 5% | 128 vs 401 kg off-ledger |
| [B · Mass balance](ai/reports/module_b_evaluation.md) | Do sales and yields match inflows? | 1.00 | 0% | 100% | 0% | distributors 15 vs 1,131 kg; reclaimers 14 vs 28 kg |
| [C · Recovery plausibility](ai/reports/module_c_evaluation.md) | Do a company's Tier B recoveries look real? | 0.98 | 0.1% | 100% (and every colluding co-signer) | 35% | 4 vs 136 kg of fake recoveries |

**End-of-life closure** ([report](ai/reports/closure_evaluation.md)): registered units the national register shows as removed, with no recovery on the ledger, the clearest sign of venting. Over 10 fresh simulated runs it listed 1,132 such units and estimated 28–46 t of refrigerant unaccounted for, from the IPCC 2006 range of charge left at end of life; the true amount (43 t) fell inside the range in every run, though near its top, because the simulator keeps small leak-checked units fuller than IPCC typical values.

**How much can still be laundered** ([analysis](docs/research/04-laundering-capacity.md)): if a technician and an owner padded every registered unit to the limit, with the charge really left in each unit drawn from the IPCC 2006 Table 7.9 ranges, the rules would accept:

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="analysis/laundering/chart-dark.svg">
  <img src="analysis/laundering/chart-light.svg" alt="Laundering capacity by defence layer: a lifetime cap of one charge plus top-ups allows 323.5 kt CO2e; the booked-content rule allows 38.6 kt CO2e; a padding detector sketch would leave 30.0 kt CO2e." width="100%">
</picture>

| Rule | Virgin gas the rules would accept as recovered | vs honest recovered volume |
|---|---:|---:|
| Lifetime cap only (one charge + every recorded top-up) | 323.5 kt CO₂e | 375% |
| Booked content (implemented) | 38.6 kt CO₂e | 45% |
| + a padding detector (design sketch, not calibrated) | 30.0 kt CO₂e | 35% |

Against a plain lifetime cap, the booked-content rule removes 88% of the room (57% on a ledger only three years old; the model uses the simulator's October 16 population). The rest cannot be closed by rules: many honest units reach end of life far from full, so padding one up to a full charge looks like an ordinary recovery. That is why the ledger bounds laundering per unit and leaves the rest to statistics and inspection.

The honest reading: **the AI mostly misses fraudsters who adapt, but adapting mostly forces them to stay small.** Reclaimers who inflate yield are the exception: adapting only halves their volume. Catching adaptive fraud needs evidence the ledger cannot see, such as site inspections and lab sampling. Module B's Isolation Forest changes no flags; it only re-ranks, better for distributors and worse for reclaimers. Each report states how it was evaluated, including the versions that failed first.

### Climate impact (a model, not a forecast)

Kigali Balance recovers no gas and claims no credits; it makes paid-for recovery checkable. A conservative estimate: for a market the size of Japan's (used only as a unit conversion: Japan itself mandates and tracks recovery), the effect attributable to verification is a median **0.06 MtCO₂e a year** (5th–95th percentile 0.01–0.18), counting only recovered gas that is then destroyed; reclaimed gas under a binding quota adds supply rather than displacing virgin gas. Each tonne of fake "reclaimed" R-404A kept off the market avoids up to about 2,900 tCO₂e over its life (gross: legal gas may fill the demand). Two assumptions dominate, and only a pilot with physical audits can measure them; the [model](analysis/impact/) says which ones, and how large that pilot must be.

## Dashboard and provenance passport

A static web app in [`web/`](web/) with two views:

- **Regulator dashboard** shows where every kilogram went, as a Sankey of provenance classes. The books balance to the gram. It also shows attempts the contracts rejected (by rule), the AI review queue with readable reasons, destruction events with their single registry claim, and a live panel that reads the OP Sepolia deployment from the browser.
- **Provenance passport** is what a buyer or registry sees when they scan a cylinder. It traces any lot back through reclamation and splits to the registered units it was recovered from. It lists the owner's co-signature, the recovery cap, the yield, each check the ledger enforced, and AI notes about parties in the chain. A QR code links to the page. It works on simulated lots and on live lots read from OP Sepolia. Each example lot also downloads as a GS1 EPCIS 2.0 document; every lot's chain exports to EPCIS and is validated against GS1's official schema in the simulator tests ([`simulator/epcis/`](simulator/epcis/)).

```bash
python -m http.server 8000 --directory web    # then open http://localhost:8000
```

<table>
<tr>
<td width="50%"><img src="docs/assets/dashboard.png" alt="Regulator dashboard: kilograms that entered the ledger, a Sankey of recovered kilograms by class and fate, attempts rejected by rule, and the AI review queue."></td>
<td width="50%"><img src="docs/assets/passport.png" alt="Provenance passport for lot 42: a Tier B recovery traced to its unit, the checks the ledger enforced, and AI notes that flag the recovering company and its co-signer for review."></td>
</tr>
<tr>
<td><sub>Regulator dashboard: the books balance to the gram; what the rules rejected; what the AI sent for review.</sub></td>
<td><sub>Provenance passport: this destruction was credited once, yet the AI flags the company that recovered it, a case for a human reviewer.</sub></td>
</tr>
</table>

The pages read only what a regulator could observe: ledger events, the equipment register and the AI flags. The simulator's ground truth never reaches them. To rebuild the data after re-running the simulator or the AI modules, run `node web/build_data.mjs`.

## Live on OP Sepolia

The six contracts of the current code (booked content, both rounds of red-team fixes, registry designation) are deployed and verified, and the demo has run on chain: 143 transactions, none failed (2026-10-21). An earlier build from 2026-10-16 is superseded.

| Contract | Address |
|---|---|
| `KigaliLedger` | [`0x9d1B18ae…Be0e4b`](https://sepolia-optimism.etherscan.io/address/0x9d1B18ae56946A835Ff6c705e9d4a9119BBe0e4b#code) |
| `EquipmentRegistry` | [`0xd8bDd620…82d0BF`](https://sepolia-optimism.etherscan.io/address/0xd8bDd620F01b61F6611f616d1733F4539382d0BF#code) |
| `DestructionClaims` | [`0xBE80B3Cc…fE8825`](https://sepolia-optimism.etherscan.io/address/0xBE80B3Cc9300B06a15323A6b865a81CBA5fE8825#code) |
| `IdentityRegistry` | [`0xcEc0b705…9dEC32`](https://sepolia-optimism.etherscan.io/address/0xcEc0b705984f1Ae8EA7aaBdB2128f8E7D89dEC32#code) |
| `FlagRegistry` | [`0x6BF143e2…BACaaE`](https://sepolia-optimism.etherscan.io/address/0x6BF143e2c8089Aeb98a6360EE815F416E7BACaaE#code) |
| `Governance` | [`0x7323e8d7…49D21F`](https://sepolia-optimism.etherscan.io/address/0x7323e8d73E79FbaD5b5A7d2F057d95Dd3549D21F#code) |

<details>
<summary><b>Demo transactions</b></summary>

| Step | Transaction |
|---|---|
| 1 · Mint 100 kg virgin R-404A against a quota document | [`0x036bd3ac…`](https://sepolia-optimism.etherscan.io/tx/0x036bd3acc085487b8e37291f17a17afce629fb0600de901f4ce4b8cb45dfb64b) |
| 4 · Tier A recovery with the owner's co-signature | [`0x11a5adcb…`](https://sepolia-optimism.etherscan.io/tx/0x11a5adcbccbee0ecd321ced400118d4a0f6a7f898fd08e96cfec389572fddfb1) |
| 5 · Reclaim 7.6 kg from 8 kg, lab-certified | [`0xdf07f763…`](https://sepolia-optimism.etherscan.io/tx/0xdf07f7635029ae8e9bbc24ba476aa8714847b3e5bda567e96a146c457cebeca6) |
| 6 · Destruction with an independent verifier's certificate | [`0x81fefac9…`](https://sepolia-optimism.etherscan.io/tx/0x81fefac96ede492308bceaf2ecbe4cbdbc7f13342e1bcd9f41ed830d7248c724) |
| 6 · The facility designates the registry that may claim | [`0x0505d505…`](https://sepolia-optimism.etherscan.io/tx/0x0505d5056137051a7ce22d1a2ea682fcdcc4af1372285893d275541b23f43885) |
| 6 · Claimed by that registry | [`0x1fffa787…`](https://sepolia-optimism.etherscan.io/tx/0x1fffa78764819ad612f7caf6a888ada604707be6c813f7a53af301800e456201) |
| 6 · A second registry claims the same event: **reverted**, `AlreadyClaimed` (2026-10-24, [`script/refused_claim_op_sepolia.sh`](script/refused_claim_op_sepolia.sh)) | [`0x3ba6bc74…`](https://sepolia-optimism.etherscan.io/tx/0x3ba6bc74cc2be7407712daa3e477d9ab431daa21b77bc5c23f9984f2b9fdf4e8) |

The four steps that must be rejected (overselling, inflated reclaimed output, virgin gas in reclamation, a second claim) are checked in local simulation before broadcasting, because a reverting transaction would abort the run. They are covered by the unit and differential tests, and the second claim was afterwards also sent on purpose, so one refusal is visible on chain.

</details>

<details>
<summary><b>Why OP Sepolia and not Sepolia</b></summary>

On Sepolia's current gas schedule, deploying `KigaliLedger` (19.1 KB) needs about 30M gas, above the 16.78M per-transaction cap (EIP-7825). On OP Sepolia the same deployment needs about 4.1M gas. The deploy script refuses to run on Sepolia. Splitting the ledger into contracts below about 10 KB is on the roadmap.

</details>

All demo actor keys are derived from one deployer key, so on the testnet one person holds all four governance seats. The deployment shows the 3-of-4 mechanics, not real independence.

## Quick start

Requirements: Foundry ≥ 1.8, Node.js ≥ 20, Python 3.12, and Edge, Chrome or Chromium for the PDF step. Every push is also rebuilt from scratch on a clean GitHub-hosted Linux machine by the [verify workflow](.github/workflows/verify.yml), which fails if any committed file does not reproduce byte for byte (the browser-rendered PDF excepted).

```bash
# 1. get the code (the submodule holds forge-std; cloned without it? run: git submodule update --init)
git clone --recurse-submodules https://github.com/ZhenYan1214/kigali-balance.git
cd kigali-balance

# 2. the AI environment and the simulator's one dependency
python -m venv ai/.venv
ai/.venv/Scripts/pip install -r ai/requirements.lock.txt     # macOS/Linux: ai/.venv/bin/pip
npm ci --prefix simulator

# 3. rebuild everything and check it (the first forge build takes about a minute: via_ir)
python scripts/rebuild.py --full      # contracts + invariants, simulator, differential test, AI, web data, diagrams, PDF
python scripts/check_submission.py    # numbers consistent across documents, links, no secrets, PDF still 2 pages
```

`forge test` prints 163 tests: the 162 unit tests plus the invariant suite, which runs all 10 invariants as one test. A rebuild rewrites generated files in place; all of them come out byte-identical to the commit except the PDFs. `HANDOFF.md` is the maintainers' working notes (in Chinese); everything a judge needs is in this README and [docs/](docs/README.md).

<details>
<summary><b>Simulator and differential test</b></summary>

```bash
cd simulator
node run.mjs && npm test                    # simulated HFC economy with injected fraud, plus self-checks
npm install && node replay.mjs              # replay every event against the contracts (needs forge build)
```

</details>

<details>
<summary><b>AI modules</b></summary>

```bash
cd ai
python -m venv .venv && .venv/Scripts/pip install -r requirements.lock.txt   # macOS/Linux: .venv/bin/pip
.venv/Scripts/python run_module_a.py        # leakage-gap flags with reasons
.venv/Scripts/python run_module_b.py        # mass-balance flags with reasons
.venv/Scripts/python run_module_c.py        # recovery-plausibility flags with reasons
.venv/Scripts/python -m pytest              # module tests, incl. guards against reading ground truth
.venv/Scripts/python evaluate_module_a.py          # held-out seeds 121-140
.venv/Scripts/python evaluate_module_b.py          # held-out seeds 141-160
.venv/Scripts/python evaluate_module_c.py          # held-out seeds 161-180
```

</details>

<details>
<summary><b>Deploy to OP Sepolia</b></summary>

```bash
cp .env.example .env    # a TEST-ONLY deployer key, an OP Sepolia RPC URL and an Etherscan API key
bash script/check_env.sh                  # checks .env without printing any secret
bash script/rehearse_op_sepolia.sh        # full rehearsal on a local fork; sends nothing
forge script script/Deploy.s.sol --rpc-url op_sepolia --broadcast --verify
```

Addresses are written to `deployments/11155420.json`.

</details>

## Honest limits

- **It cannot see inside a cylinder.** Physical truth comes from weighing and lab sampling.
- **It cannot catch gas that never enters it.** It makes legitimate gas provable instead, which closes the "reclaimed" label, illegal gas's most profitable exit.
- **It is not confidential by default.** Consortium members can see lot quantities. A production version would store commitments instead of grams.
- **Collusion is bounded and made visible, not prevented.** A technician and an owner can still book a unit as fuller than it was, up to one charge. In our model of every registered unit padded to that limit, the room left equals about 45% of honest recovered volume ([analysis](docs/research/04-laundering-capacity.md)). A destroyer and its verifier can still lie together. Gas charged off the ledger and then genuinely recovered needs no false signature at all.
- **We are not the first to track cylinders.** Commercial tools, Japan's RaMS and a 2023 New Zealand blockchain project already do. Our contribution is conservation across organisations and uniqueness across registries.
- **No HFC destruction credit has yet been shown to be double-issued**, and our audit of public records found no evidence of it. What it found is that most credits cannot be checked from outside. Cross-registry uniqueness is a safeguard for a market that is only now opening.
- **All market data is simulated.** No real company's or government's ledger data is used; the registry audit uses public registry records.
- **The claim lock prevents double issuance between registries that use it.** It does not address double claiming against a host country's NDC or Montreal Protocol accounting.

## Roadmap

- Split `KigaliLedger` into contracts below about 10 KB, so it fits Sepolia and a permissioned consortium chain (Hyperledger Besu, QBFT).
- Commitments instead of plain grams for lot-level confidentiality.
- Write AI flags to `FlagRegistry` on the public deployment (done on the local replay chain).
- Import existing records (GS1 EPCIS 2.0; the export side is built and schema-validated) instead of asking technicians to re-enter data.

## Repository

| Path | Contents |
|---|---|
| [`src/`](src/) | Solidity contracts |
| [`test/`](test/) | Foundry unit tests and fuzzed invariants |
| [`script/`](script/) | OP Sepolia deployment and on-chain demo |
| [`simulator/`](simulator/) | Deterministic HFC-economy simulator with injected fraud, and the differential test |
| [`ai/`](ai/) | Anomaly detection on observations only, with evaluation reports |
| [`web/`](web/) | Regulator dashboard and provenance passport (static; live reads from OP Sepolia) |
| [`scripts/`](scripts/) | One-command rebuild (`rebuild.py`) and pre-submission checks (`check_submission.py`) |
| [`research/registry-audit/`](research/registry-audit/) | Public-record audit of ODS/HFC destruction credits: dataset with a source URL per row, and a rebuild script |
| [`analysis/laundering/`](analysis/laundering/) | Model of how much gas a colluding technician and owner could book as recovered, per defence layer |
| [`docs/`](docs/) | Problem statement, research reports, design notes ([index](docs/README.md)) |

## License

MIT

<sub>IEEE ClimateChain Global Hackathon 2026 · Track 3: Sustainable Supply Chains (also Track 1: Carbon Markets & Emissions Transparency)</sub>
