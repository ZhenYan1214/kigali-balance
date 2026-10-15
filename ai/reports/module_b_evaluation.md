# AI module B: evaluation on simulated data

Model `1.0.0` (hash `9182a8434b40`), held-out seeds 1–20, 20 runs, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed before this evaluation; ground truth was used only to score.

Per run there are 5 distributors and 4 reclaimers. Fraud: one naive and one adaptive overselling distributor; one naive and one adaptive yield-inflating reclaimer. The adaptive distributor pads legitimate invoices inside the 5 % weight tolerance and keeps the total under 2 % of its sales; the adaptive reclaimer shifts its plant's yield up by 3 points and never touches the 98 % ceiling.

## Flags at the fixed threshold (score >= 0.6)

| months | variant | precision | recall | FPR | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |
|---|---|---|---|---|---|---|---|---|
| 12 | rules only | 1.0 | 0.475 | 0.0 | 1.0 | 0.0 | 0.9 | 0.0 |
| 12 | rules+IF | 1.0 | 0.487 | 0.0 | 1.0 | 0.0 | 0.95 | 0.0 |
| 24 | rules only | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 24 | rules+IF | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 36 | rules only | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 36 | rules+IF | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |

## Ranking quality (ROC-AUC against honest entities of the same role, threshold-free)

| months | variant | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |
|---|---|---|---|---|---|
| 12 | rules only | 1.0 | 0.6 | 1.0 | 0.55 |
| 12 | rules+IF | 1.0 | 0.841 | 1.0 | 0.517 |
| 24 | rules only | 1.0 | 0.75 | 1.0 | 0.55 |
| 24 | rules+IF | 1.0 | 0.871 | 1.0 | 0.564 |
| 36 | rules only | 1.0 | 0.8 | 1.0 | 0.5 |
| 36 | rules+IF | 1.0 | 0.876 | 1.0 | 0.423 |

## How much fraudulent volume each profile moved (ground truth, full 36 months)

Distributors: smuggled gas sold. Reclaimers: reclaimed output above what the plant's honest efficiency would have produced (virgin gas sold as reclaimed).

| role | profile | mean kg | min kg | max kg |
|---|---|---|---|---|
| DISTRIBUTOR | adaptive | 19.4 | 9.3 | 27.3 |
| DISTRIBUTOR | naive | 1,419.4 | 847.3 | 2,145.6 |
| RECLAIMER | adaptive | 14.1 | 2.9 | 40.0 |
| RECLAIMER | naive | 27.6 | 5.8 | 56.9 |

## Score distribution at 36 months

| variant | role | label | n | mean | min | max |
|---|---|---|---|---|---|---|
| rules only | DISTRIBUTOR | adaptive | 20 | 0.008 | 0.000 | 0.036 |
| rules only | DISTRIBUTOR | honest | 60 | 0.000 | 0.000 | 0.000 |
| rules only | DISTRIBUTOR | naive | 20 | 1.000 | 1.000 | 1.000 |
| rules only | RECLAIMER | adaptive | 20 | 0.000 | 0.000 | 0.000 |
| rules only | RECLAIMER | honest | 40 | 0.000 | 0.000 | 0.000 |
| rules only | RECLAIMER | naive | 20 | 0.998 | 0.990 | 1.000 |
| rules+IF | DISTRIBUTOR | adaptive | 20 | 0.037 | 0.000 | 0.085 |
| rules+IF | DISTRIBUTOR | honest | 60 | 0.004 | 0.000 | 0.078 |
| rules+IF | DISTRIBUTOR | naive | 20 | 1.000 | 1.000 | 1.000 |
| rules+IF | RECLAIMER | adaptive | 20 | 0.001 | 0.000 | 0.026 |
| rules+IF | RECLAIMER | honest | 40 | 0.009 | 0.000 | 0.090 |
| rules+IF | RECLAIMER | naive | 20 | 0.998 | 0.992 | 1.000 |
