# AI module A: evaluation on simulated data

Model `1.0.0` (hash `e0db6131b3d4`), held-out seeds 1–20, 20 runs of 40 service companies, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed on development seeds before this evaluation; ground truth was used only to score.

Per run: 3 naive off-ledger companies (record 20 % of top-ups, buy smuggled gas on invoices), 3 adaptive ones (record just enough that every unit's ledger leakage sits between its category's IPCC minimum and midpoint, pay cash for smuggled gas), 2 phantom-recovery companies (module C's target; they also buy gas off the ledger) and 32 honest companies whose real maintenance quality varies (0.7–1.15x leakage).

The module's prior (IPCC leak-rate bands per category) is the same public source the simulator draws leak rates from, so the leakage signal is tested against a population that matches its prior except for the honest maintenance spread. Real fleets will not match IPCC this closely.

## Flags at the fixed threshold (score >= 0.6)

| months | precision | FPR (honest) | naive flagged | adaptive flagged | phantom flagged | AUC naive | AUC adaptive | AUC phantom |
|---|---|---|---|---|---|---|---|---|
| 12.0 | 0.929 | 0.013 | 1.0 | 0.083 | 1.0 | 0.995 | 0.606 | 0.995 |
| 24.0 | 0.972 | 0.005 | 1.0 | 0.1 | 1.0 | 0.999 | 0.622 | 0.999 |
| 36.0 | 0.981 | 0.003 | 1.0 | 0.083 | 1.0 | 1.0 | 0.641 | 1.0 |

Precision counts a flag as correct when the company really buys or uses gas off the ledger (naive, adaptive or phantom). AUC is threshold-free, against honest companies.

## Which signal carried each profile at 36 months (mean signal score)

| profile | A1 purchases off ledger | A2 recorded leakage vs peers | A3 silent units | total |
|---|---|---|---|---|
| adaptive | 0.00 | 0.11 | 0.02 | 0.13 |
| honest | 0.00 | 0.01 | 0.00 | 0.01 |
| naive | 1.00 | 0.88 | 0.47 | 1.00 |
| phantom | 1.00 | 0.01 | 0.00 | 1.00 |

## Off-ledger top-ups each profile put into equipment (ground truth, 36 months)

| profile | mean kg | min kg | max kg |
|---|---|---|---|
| adaptive | 166.3 | 3.1 | 529.1 |
| naive | 387.8 | 54.1 | 911.2 |

Highest honest score at 36 months: 0.871.
