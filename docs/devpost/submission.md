# Devpost submission text

Paste each section into the matching Devpost field. The form has no track field, so the track goes in the tagline and in the first line of the description.

---

## Project name

Kigali Balance

## Tagline (short description)

Track 3 (also Track 1) · A shared ledger that makes every recovered, reclaimed and destroyed kilogram of HFC refrigerant add up across reclaimers, borders and carbon registries.

---

## About the project

**Track 3: Sustainable Supply Chains (also Track 1: Carbon Markets & Emissions Transparency)**

### Inspiration

HFC refrigerants, being phased down under the Kigali Amendment, are super-pollutants. One kilogram of R-404A warms the planet as much as 3.9 tonnes of CO₂. Their kilograms are already recorded, but in separate systems: customs quotas, technician logs, reclaimer reports and carbon registries. Each system checks its own books. **No one checks the same kilogram between them**, and that seam pays:

- Reclaimed R-404A sold at 140% of the virgin price in the EU in early 2025, and virgin gas has been sold as "reclaimed".
- Destroyed HFCs earn carbon credits. Whether a kilogram was "not credited elsewhere" is a declaration, not a check.
- We audited 436 public destruction and reclamation projects at three carbon registries. None publishes which container, and how many kilograms, each of 42.4 million destruction credits draws on. Where two ledgers share a key (California's ARB and the registries), the records reconcile; between registries, kilogram-level uniqueness cannot be checked from outside.

> If virgin gas is labelled reclaimed, a carbon credit is paid for virgin gas. The "reclaimed" fraud and the crediting problem are one conservation problem.

### What it does

Kigali Balance enforces one rule on chain:

> **Every kilogram claimed as "reclaimed" or "destroyed" must trace back to a kilogram recovered from a real, registered piece of equipment.**

- **Lots with provenance classes that can never be swapped:** virgin, recovered, reclaimed, unknown. Reclamation accepts only recovered gas, and output can never exceed input minus losses.
- **Two independent signatures for each step that earns money.** A recovery needs the technician's signed scale reading and the unit owner's co-signature. A destruction needs a certificate from a verifier independent of the facility.
- **Booked content per unit.** A recovery can never exceed what the ledger says is inside the unit. Gas charged within the last 180 days is quarantined and can never be reclaimed or credited.
- **A claim lock.** Each destruction event can be claimed by one registry, once, without registries sharing databases.
- **AI for what is compliant but implausible.** Three modules flag leakage gaps, mass-balance anomalies and implausible recoveries, each with reasons a reviewer can read. They never sanction anyone.
- **A regulator dashboard and a provenance passport.** A buyer or registry scans a cylinder and sees where the gas came from, every check the ledger enforced, and any AI notes.

### How we built it

- **Contracts.** Six Solidity contracts (Foundry), with EIP-712 attestations verified on chain and a 3-of-4 governance multisig. Deployed and verified on OP Sepolia.
- **Simulator.** A deterministic three-year HFC market with nine kinds of injected fraud, including *adaptive* fraudsters who keep every number inside honest ranges. Leak rates follow IPCC 2006, maintenance follows EU leak-check rules, and the end-of-life recovery rate is calibrated to Japan's 2024 figure (43%).
- **Differential test.** All 7,219 simulated events are replayed against the real contracts. Every accept or reject decision, error, lot ID and gas total matches an independently written rule mirror.
- **AI.** Python modules that read only what a regulator could observe, never the simulator's ground truth. They were scored on held-out simulated runs never used for design. Every flag is written to an on-chain `FlagRegistry` with the model's hash and the hash of the exact data it scored, and only a regulator can close it.
- **Outside judges.** Every push is rebuilt from scratch on a clean Linux machine (GitHub Actions) and must reproduce every committed file byte for byte. A second job runs the Slither static analyser.
- **Real data.** A public-record audit of the ACR, CAR and Verra registries and the California ARB issuance table.

### Challenges we ran into

- **Our own fraud model fooled us twice.** A per-recovery cap could be bypassed by splitting one recovery into several. Our laundering-capacity model caught it, and we replaced the cap with booked content, which removes 88% of the room colluding parties have.
- **The simulator's honest equipment was too full at end of life.** IPCC data says small units are often nearly empty. We corrected the simulator and re-evaluated every AI module on fresh data. The scores held, and we reported them either way.
- **Honesty about adaptive fraud.** The AI catches every naive fraudster over three simulated years, with under 1% of honest companies flagged. It mostly misses fraudsters who adapt, but adapting mostly forces them to stay small: 4 kg of fake recoveries in three years instead of 136 kg. Yield-inflating reclaimers are the exception: adapting only halves their volume, which is why lab sampling stays in the loop.

### Accomplishments that we're proud of

- 143 unit tests and 10 fuzzed invariants. Thousands of forged recoveries in each fuzz campaign, none accepted.
- **We hired our own attackers.** Three outside reviewers (a security pre-audit, a forensic check of every number, an editor) attacked the submission. The security review found a High-severity hole: undocumented gas could be laundered into creditable gas after 180 days. We fixed it and two Medium findings, and turned every proof of concept into a regression test. The forensic review cut our climate estimate by about three quarters and corrected our audit headline. We publish the corrected numbers.
- A technical annex where each security claim names the test that proves it.
- A climate-impact model with its uncertainty and a sensitivity analysis, rather than one big number. It also says how a pilot would measure the assumption that matters most.
- A finding we did not expect: where two ledgers share a key (California ARB and the registries), the public record reconciles. Where they don't, outsiders cannot check.

### What we learned

A blockchain is only justified where **no single trusted operator spans all the parties**: several carbon registries, competing reclaimers, and gas shipped across borders for destruction. Inside one country, a regulator's database is enough. We say so in the README.

### What's next for Kigali Balance

1. Interviews with reclaimers, a registry and Türkiye's ozone unit, plus usability tests of the passport.
2. One real destruction project, from recovery to destruction to a single claim, with confidential amounts (commitments and range proofs).
3. A pilot designed to measure how much verifiability itself raises recovery.
4. A national pilot connected to Türkiye's quota and equipment registers, run by a consortium in which no one holds a majority.

---

## Built with

solidity, foundry, ethereum, optimism, eip-712, python, scikit-learn, shap, pandas, node.js, viem, javascript, html, github-actions, slither

## Try it out (links)

- GitHub: https://github.com/ZhenYan1214/kigali-balance
- Dashboard and provenance passport: https://zhenyan1214.github.io/kigali-balance/ (after GitHub Pages is enabled; until then, run locally per the README)
- Contracts on OP Sepolia: https://sepolia-optimism.etherscan.io/address/0xC2b8904E911BA41d270Df95e734D53808c4FA73A#code

## File upload

`docs/proposal/Kigali_Balance_Submission.pdf`: the two-page problem statement followed by the technical annex (about 12 pages, under 1 MB).

## Video

The YouTube link, recorded from `docs/video/video_script.md`.
