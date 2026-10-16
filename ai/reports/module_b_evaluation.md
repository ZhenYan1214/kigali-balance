# AI module B: evaluation on simulated data

Model `1.0.0` (hash `9182a8434b40`), held-out seeds 1–20, 20 runs, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed before this evaluation; ground truth was used only to score.

Per run there are 5 distributors and 4 reclaimers. Fraud: one naive and one adaptive overselling distributor; one naive and one adaptive yield-inflating reclaimer. The adaptive distributor pads legitimate invoices inside the 5 % weight tolerance and keeps the total under 2 % of its sales; the adaptive reclaimer shifts its plant's yield up by 3 points and never touches the 98 % ceiling.

## Flags at the fixed threshold (score >= 0.6)

| months | variant | precision | recall | FPR | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |
|---|---|---|---|---|---|---|---|---|
| 12 | rules only | 1.0 | 0.45 | 0.0 | 1.0 | 0.0 | 0.8 | 0.0 |
| 12 | rules+IF | 1.0 | 0.45 | 0.0 | 1.0 | 0.0 | 0.8 | 0.0 |
| 24 | rules only | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 24 | rules+IF | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 36 | rules only | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 36 | rules+IF | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |

## Ranking quality (ROC-AUC against honest entities of the same role, threshold-free)

| months | variant | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |
|---|---|---|---|---|---|
| 12 | rules only | 1.0 | 0.591 | 0.923 | 0.539 |
| 12 | rules+IF | 1.0 | 0.819 | 0.941 | 0.389 |
| 24 | rules only | 1.0 | 0.632 | 1.0 | 0.575 |
| 24 | rules+IF | 1.0 | 0.836 | 1.0 | 0.53 |
| 36 | rules only | 1.0 | 0.633 | 1.0 | 0.575 |
| 36 | rules+IF | 1.0 | 0.839 | 1.0 | 0.539 |

## How much fraudulent volume each profile moved (ground truth, full 36 months)

Distributors: smuggled gas sold. Reclaimers: reclaimed output above what the plant's honest efficiency would have produced (virgin gas sold as reclaimed).

| role | profile | mean kg | min kg | max kg |
|---|---|---|---|---|
| DISTRIBUTOR | adaptive | 19.4 | 8.7 | 29.8 |
| DISTRIBUTOR | naive | 1,269.6 | 672.6 | 2,330.7 |
| RECLAIMER | adaptive | 17.2 | 1.2 | 36.5 |
| RECLAIMER | naive | 34.1 | 3.8 | 71.0 |

## Score distribution at 36 months

| variant | role | label | n | mean | min | max |
|---|---|---|---|---|---|---|
| rules only | DISTRIBUTOR | adaptive | 20 | 0.005 | 0.000 | 0.043 |
| rules only | DISTRIBUTOR | honest | 60 | 0.000 | 0.000 | 0.007 |
| rules only | DISTRIBUTOR | naive | 20 | 1.000 | 1.000 | 1.000 |
| rules only | RECLAIMER | adaptive | 20 | 0.026 | 0.000 | 0.279 |
| rules only | RECLAIMER | honest | 40 | 0.000 | 0.000 | 0.000 |
| rules only | RECLAIMER | naive | 20 | 0.995 | 0.953 | 1.000 |
| rules+IF | DISTRIBUTOR | adaptive | 20 | 0.029 | 0.000 | 0.103 |
| rules+IF | DISTRIBUTOR | honest | 60 | 0.004 | 0.000 | 0.049 |
| rules+IF | DISTRIBUTOR | naive | 20 | 1.000 | 1.000 | 1.000 |
| rules+IF | RECLAIMER | adaptive | 20 | 0.031 | 0.000 | 0.279 |
| rules+IF | RECLAIMER | honest | 40 | 0.009 | 0.000 | 0.067 |
| rules+IF | RECLAIMER | naive | 20 | 0.995 | 0.957 | 1.000 |
