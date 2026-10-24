**Track 3: Sustainable Supply Chains (also Track 1: Carbon Markets & Emissions Transparency)**

Kigali Balance is a shared ledger for HFC refrigerant. It lets a carbon registry, a buyer of reclaimed gas or a regulator check that a kilogram sold as "reclaimed" or credited as "destroyed" was really recovered from a registered unit, and was credited only once.

## Try it in two minutes (no wallet, no install)

- **Live:** [regulator dashboard](https://zhenyan1214.github.io/kigali-balance/), a simulated three-year market whose books balance to the gram. "Refused by the contracts" shows what was blocked and why.
- **One lot:** [passport of lot 42](https://zhenyan1214.github.io/kigali-balance/passport.html?lot=42): recovered, destroyed, credited once, accepted by every rule. In the simulation its unit never existed; the AI flagged both companies that signed for it.
- **Video (3:14):** [VIDEO LINK]
- **On chain:** [six contracts, verified on OP Sepolia](https://sepolia-optimism.etherscan.io/address/0x9d1B18ae56946A835Ff6c705e9d4a9119BBe0e4b#code). Two transactions to read: [the designated registry claims destruction event 0](https://sepolia-optimism.etherscan.io/tx/0x1fffa78764819ad612f7caf6a888ada604707be6c813f7a53af301800e456201), and [a second registry tries the same event](https://sepolia-optimism.etherscan.io/tx/0x3ba6bc74cc2be7407712daa3e477d9ab431daa21b77bc5c23f9984f2b9fdf4e8) and is reverted with `AlreadyClaimed`.
- **Code:** [github.com/ZhenYan1214/kigali-balance](https://github.com/ZhenYan1214/kigali-balance). `forge test` runs 162 unit tests and 10 fuzzed invariants.
- All market data is simulated, and every testnet key is mine (see Limits).

## Inspiration

**The problem.** HFCs, which the Kigali Amendment phases down, are super-pollutants: one kilogram of R-404A warms the planet as much as 3.9 tonnes of CO₂ (GWP 3,922). Two things make a kilogram worth faking:

- Since 2025 the EU bans virgin high-GWP gas for servicing refrigeration, but reclaimed gas is exempt. In Q1 2025 reclaimed R-404A sold at 140% of the virgin price (EU price monitoring), and a reclaimer publicly warned of virgin gas sold as reclaimed. EU seizures of illegal HFCs rose from about 250 t in 2023 to about 670 t in 2024 (EIA, 2026).
- Destroyed refrigerant earns carbon credits. I audited 436 destruction and reclamation projects at ACR, Climate Action Reserve and Verra, behind 42.4 million destruction credits. Certificate-of-destruction identifiers are public for only 31% of them, and no registry publishes which container, and how many kilograms, a credit draws on.

**Why it isn't solved.** Quotas, technician logs, reclaimer reports and registry issuances are each checked inside their own system. Where two ledgers share a key (California's ARB and the registries), the public records match; between registries there is none, so "not credited elsewhere" rests on a declaration. I found no double counting. Nobody outside can check.

**Why I built it.** I started from a test, not a topic: a blockchain earns its place only when parties who don't trust each other share a conservation rule (one unit, one claim) and money rides on the record. Battery passports, CBAM tracing and recycled-content ledgers failed it, because regulation or existing tools already cover them. HFC refrigerant passed, and I found no Devpost or ETHGlobal project reconciling refrigerant kilograms.

## What it does

**One rule:** every kilogram claimed as reclaimed or destroyed must trace back to a kilogram recovered from a real, registered unit, and each destruction can be claimed once.

1. A unit is registered, and every charge books gas into it.
2. A technician's scale signs each recovery, and the unit's owner co-signs. A recovery can never exceed what is booked inside the unit; gas charged in the last 180 days is quarantined.
3. A reclaimer accepts only recovered lots. A lab certifies the output, which can never exceed the input minus losses.
4. A facility destroys lots with an independent verifier's certificate and names the registry that may claim the event.
5. That registry claims the event before issuing credits. Any second claim is refused.
6. Three AI modules flag what is allowed but implausible (leak gaps, mass-balance anomalies, implausible recoveries) with readable reasons. They never block anyone; a regulator decides.

![How a kilogram moves through the ledger, and the seven actions the contracts reject](https://zhenyan1214.github.io/kigali-balance/assets/diagrams/kilogram-flow.png)

So virgin gas can't become "reclaimed" (a lot's provenance class never changes), a fake recovery needs two colluding signers and stays under the unit's booked content, and no destruction is credited twice, without registries sharing databases.

**Users:** carbon registries (claim before issuing), buyers of reclaimed gas such as supermarkets (scan a cylinder's passport) and regulators (dashboard and AI review queue). Technicians and owners only sign.

**Guarantees:** no function, governance included, can edit or delete a lot, and nothing is upgradeable. A 3-of-4 multisig grants roles, binds scales and tunes parameters within hard-coded floors.

## How I built it

- **Contracts:** six Solidity contracts (Foundry) that verify EIP-712 signatures on chain, deployed on OP Sepolia on 2026-10-21.
- **Simulator and differential test:** a deterministic three-year market with twelve kinds of injected fraud. All 7,359 events are replayed against the real contracts, and every decision, error and gas total matches a separately written rule mirror.
- **AI:** Python (scikit-learn, SHAP) that reads only what a regulator could see.
- **CI:** every push rebuilds everything on a clean machine and must reproduce every committed file byte for byte. Lots export as GS1 EPCIS 2.0.

![Architecture: independent signers, the six contracts, who relies on them, and the off-chain AI](https://zhenyan1214.github.io/kigali-balance/assets/diagrams/architecture.png)

**Why a blockchain, and why OP:**

- No operator spans all the parties: several registries, competing reclaimers, gas shipped abroad for destruction. A central database would need an operator every registry trusts; inside one country, a regulator's database is enough.
- Anyone can recompute the books, and the passport reads live lots straight from the chain instead of trusting an operator's export.
- The contract checks every signature, so a forged scale reading is rejected by code.
- OP is a cost choice: a cylinder's full path costs under one US cent at OP Mainnet prices (2026-10-17). Any EVM chain could run it.

## Challenges: what I got wrong

- A per-recovery cap could be bypassed by splitting one recovery into several. My own laundering model caught it; capping by booked content removed 88% of the room colluders had.
- An AI-assisted red-team pass (AI agents, not human auditors) found a High-severity hole: undocumented gas could be laundered into creditable gas. A second pass got around my fix. Both are fixed and are now regression tests.
- The forensic pass cut my climate estimate by about three quarters and caught a wrong headline in my audit. I published the corrections.

## Results

- Over three simulated years, the AI catches every naive fraudster and flags under 1% of honest companies. Adaptive fraudsters mostly slip through, but only by staying small (4 kg of fake recoveries instead of 136 kg).
- Climate impact: Kigali Balance recovers no gas and claims no credits. For a Japan-sized market, my model puts the effect of verification at a median 0.06 MtCO₂e a year (5th–95th percentile 0.01–0.18), counting only destroyed gas and assuming verification raises recovery by 0–5 percentage points.

## Limits

- All market data is simulated, and the AI has only been scored on simulated runs.
- Every testnet key derives from my deployer key: I hold all four governance seats and every demo role. It shows the mechanism, not independence.
- No human audit and no user testing yet. AI flags are written on chain only in my local replay chain.

## What's next

1. Passport tests with a reclaimer, a registry analyst and Türkiye's ozone unit: can each answer "where did this kilogram come from?"
2. One real destruction project end to end, with confidential amounts.
3. A pilot that measures how much verifiability raises recovery, and a human audit before real money depends on the contracts.

## About me

I'm a first-year master's student in Taiwan and built this alone. The registry audit is the part I'd point to: the container numbers and weights needed to check a destroyed kilogram already exist on paper, just not shared. I'd like to hear from any reclaimer, registry or ozone unit willing to test the passport.
