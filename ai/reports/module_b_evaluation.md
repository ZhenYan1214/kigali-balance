# AI module B: evaluation on simulated data

Model `1.0.0` (hash `9182a8434b40`), held-out seeds 141–160, 20 runs, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed before this evaluation; ground truth was used only to score.

Per run there are 5 distributors and 4 reclaimers. Fraud: one naive and one adaptive overselling distributor; one naive and one adaptive yield-inflating reclaimer. The adaptive distributor pads legitimate invoices inside the 5 % weight tolerance and keeps the total under 2 % of its sales; the adaptive reclaimer shifts its plant's yield up by 3 points and never touches the 98 % ceiling.

> Round 14: re-evaluated on a corrected simulator with the model unchanged. The earlier simulator refilled every unit once it was 15 % low, so equipment reached end of life nearly full, contradicting IPCC 2006 Table 7.9 (small units 0–80 % remaining). Since round 14 it follows the leak-check obligation: Tier A units (>= 5 tCO2e) are leak-checked and refilled, Tier B units mostly are not. The seeds 1–20 report is archived (`module_b_v1_seeds1-20.md`); this report uses fresh seeds 141–160.

## Flags at the fixed threshold (score >= 0.6)

| months | variant | precision | recall | FPR | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |
|---|---|---|---|---|---|---|---|---|
| 12 | rules only | 1.0 | 0.487 | 0.0 | 1.0 | 0.0 | 0.95 | 0.0 |
| 12 | rules+IF | 1.0 | 0.487 | 0.0 | 1.0 | 0.0 | 0.95 | 0.0 |
| 24 | rules only | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 24 | rules+IF | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 36 | rules only | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |
| 36 | rules+IF | 1.0 | 0.5 | 0.0 | 1.0 | 0.0 | 1.0 | 0.0 |

## Ranking quality (ROC-AUC against honest entities of the same role, threshold-free)

| months | variant | distributor naive | distributor adaptive | reclaimer naive | reclaimer adaptive |
|---|---|---|---|---|---|
| 12 | rules only | 1.0 | 0.525 | 0.999 | 0.512 |
| 12 | rules+IF | 1.0 | 0.763 | 0.999 | 0.566 |
| 24 | rules only | 1.0 | 0.65 | 1.0 | 0.512 |
| 24 | rules+IF | 1.0 | 0.772 | 1.0 | 0.475 |
| 36 | rules only | 1.0 | 0.75 | 1.0 | 0.512 |
| 36 | rules+IF | 1.0 | 0.817 | 1.0 | 0.389 |

## How much fraudulent volume each profile moved (ground truth, full 36 months)

Distributors: smuggled gas sold. Reclaimers: reclaimed output above what the plant's honest efficiency would have produced (virgin gas sold as reclaimed).

| role | profile | mean kg | min kg | max kg |
|---|---|---|---|---|
| DISTRIBUTOR | adaptive | 15.1 | 8.3 | 20.0 |
| DISTRIBUTOR | naive | 1,130.8 | 640.4 | 1,541.3 |
| RECLAIMER | adaptive | 13.9 | 0.8 | 34.1 |
| RECLAIMER | naive | 28.2 | 3.5 | 90.8 |

## Score distribution at 36 months

| variant | role | label | n | mean | min | max |
|---|---|---|---|---|---|---|
| rules only | DISTRIBUTOR | adaptive | 20 | 0.005 | 0.000 | 0.039 |
| rules only | DISTRIBUTOR | honest | 60 | 0.000 | 0.000 | 0.000 |
| rules only | DISTRIBUTOR | naive | 20 | 1.000 | 1.000 | 1.000 |
| rules only | RECLAIMER | adaptive | 20 | 0.006 | 0.000 | 0.121 |
| rules only | RECLAIMER | honest | 40 | 0.013 | 0.000 | 0.500 |
| rules only | RECLAIMER | naive | 20 | 0.989 | 0.909 | 1.000 |
| rules+IF | DISTRIBUTOR | adaptive | 20 | 0.024 | 0.000 | 0.083 |
| rules+IF | DISTRIBUTOR | honest | 60 | 0.002 | 0.000 | 0.064 |
| rules+IF | DISTRIBUTOR | naive | 20 | 1.000 | 1.000 | 1.000 |
| rules+IF | RECLAIMER | adaptive | 20 | 0.011 | 0.000 | 0.121 |
| rules+IF | RECLAIMER | honest | 40 | 0.028 | 0.000 | 0.512 |
| rules+IF | RECLAIMER | naive | 20 | 0.990 | 0.923 | 1.000 |
