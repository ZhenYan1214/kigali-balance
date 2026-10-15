# AI module A: evaluation on simulated data

Model `1.1.0` (hash `631580034ad7`), held-out seeds 21–40, 20 runs of 40 service companies, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed on development seeds before this evaluation; ground truth was used only to score.

Per run: 3 naive off-ledger companies (record 20 % of top-ups, buy smuggled gas on invoices), 3 adaptive ones (record just enough that every unit's ledger leakage sits between its category's IPCC minimum and midpoint, pay cash for smuggled gas), 2 phantom-recovery companies (module C's target; they also buy gas off the ledger) and 32 honest companies whose real maintenance quality varies (0.7–1.15x leakage).

The module's prior (IPCC leak-rate bands per category) is the same public source the simulator draws leak rates from, so the leakage signal is tested against a population that matches its prior except for the honest maintenance spread. Real fleets will not match IPCC this closely.

## Flags at the fixed threshold (score >= 0.6)

| months | precision | FPR (honest) | naive flagged | adaptive flagged | phantom flagged | AUC naive | AUC adaptive | AUC phantom |
|---|---|---|---|---|---|---|---|---|
| 12 | 0.935 | 0.011 | 1.0 | 0.017 | 1.0 | 0.998 | 0.538 | 0.998 |
| 24 | 0.99 | 0.002 | 1.0 | 0.05 | 1.0 | 1.0 | 0.543 | 1.0 |
| 36 | 1.0 | 0.0 | 1.0 | 0.05 | 1.0 | 1.0 | 0.574 | 1.0 |

Precision counts a flag as correct when the company really buys or uses gas off the ledger (naive, adaptive or phantom). AUC is threshold-free, against honest companies.

## Which signal carried each profile at 36 months (mean signal score)

| profile | A1 purchases off ledger | A2 recorded leakage vs peers | A3 silent units | total |
|---|---|---|---|---|
| adaptive | 0.00 | 0.06 | 0.02 | 0.07 |
| honest | 0.00 | 0.00 | 0.00 | 0.00 |
| naive | 1.00 | 0.77 | 0.44 | 1.00 |
| phantom | 1.00 | 0.00 | 0.00 | 1.00 |

## Off-ledger top-ups each profile put into equipment (ground truth, 36 months)

| profile | mean kg | min kg | max kg |
|---|---|---|---|
| adaptive | 157.7 | 2.5 | 573.9 |
| naive | 380.9 | 10.7 | 950.2 |

Highest honest score at 36 months: 0.275.

## Version history and known limitations

- **1.0.0 was evaluated first, on held-out seeds 1–20** (`module_a_v1.0_seeds1-20.md`). It flagged 1.3 % of honest companies at 12 months and 0.3 % at 36 months: signal A2 compared recorded top-ups with the full expected leakage, but top-ups are lumpy (a unit is refilled only once it is ~15 % low). 1.1.0 subtracts that part. Because seeds 1–20 had then been looked at, **1.1.0 is reported on fresh seeds 21–40**.
- **Short windows are still noisy.** At 12 months about 1 % of honest companies are flagged, all by A2, all with only 20–35 kg of expected refills: too little volume to judge a company. Treat A2 flags before about two years of data as a watch list, not a review request. This was found on the test seeds and has not been fixed, to avoid tuning on them.
- **The adaptive profile is mostly missed** (AUC barely above 0.5). Each of its units looks plausible and it buys smuggled gas for cash, so only the company-level leakage distribution can betray it, and honest maintenance differences hide that. It still put about 40 % as much smuggled gas into equipment as a naive company. Catching it needs evidence the ledger cannot see: site inspections, leak checks or cylinder tracking at the smuggler's end.
- **A3 (silent units) rarely fires within three years**: only large commercial units leak enough, even at the IPCC minimum, to make a missing refill certain. It becomes useful with longer registry histories.
