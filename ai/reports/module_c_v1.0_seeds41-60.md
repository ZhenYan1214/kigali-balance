# AI module C: evaluation on simulated data

Model `1.0.0` (hash `5ffdcd1703a4`), fresh held-out seeds 41–60, 20 runs, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed on development seeds before this evaluation; ground truth was used only to score.

Per run: 40 service companies (sizes differ 0.4–2.5x) and 3 take-back points that co-sign Tier B recoveries. Fraud: one naive phantom-unit company (1–4 fake units a month at ~the full model charge), one adaptive one (a fake unit in ~15 % of months at an honest-looking efficiency), and one colluding take-back point that co-signs both, besides its honest business.

## Flags at the fixed threshold (score >= 0.6)

| months | precision | recall | FPR services | FPR co-signers | naive flagged | adaptive flagged | colluding flagged | AUC naive | AUC adaptive | AUC colluding |
|---|---|---|---|---|---|---|---|---|---|---|
| 12 | 0.851 | 0.667 | 0.0 | 0.175 | 1.0 | 0.0 | 1.0 | 1.0 | 0.593 | 0.925 |
| 24 | 1.0 | 0.717 | 0.0 | 0.0 | 1.0 | 0.15 | 1.0 | 1.0 | 0.592 | 1.0 |
| 36 | 1.0 | 0.733 | 0.0 | 0.0 | 1.0 | 0.2 | 1.0 | 1.0 | 0.741 | 1.0 |

## Which signal carried each profile at 36 months (mean signal score)

| profile | role | C1 | C2 | C3 | C4 | C5 | total |
|---|---|---|---|---|---|---|---|
| colluding | CO-SIGNER | – | – | – | 1.00 | 1.00 | 1.00 |
| honest | CO-SIGNER | – | – | – | 0.01 | 0.00 | 0.01 |
| honest | SERVICE | 0.00 | 0.00 | 0.00 | – | – | 0.01 |
| phantom adaptive | SERVICE | 0.00 | 0.23 | 0.06 | – | – | 0.28 |
| phantom naive | SERVICE | 1.00 | 1.00 | 1.00 | – | – | 1.00 |

## Fake recoveries each phantom profile booked (ground truth, 36 months)

| profile | mean fake units | mean kg | min kg | max kg |
|---|---|---|---|---|
| phantom adaptive | 5.0 | 7.6 | 1.5 | 13.6 |
| phantom naive | 92.5 | 145.5 | 119.7 | 162.6 |

Highest honest score at 36 months: services 0.469, co-signers 0.285.

## Reading the results

- The colluding take-back point is exposed by its counterpart: the fake units it co-signs come from one company far more often than other companies use it (C4). The owner co-signature required since H1 is what makes this pattern visible on the ledger.
- The adaptive phantom company books about as many Tier B recoveries as a large honest company, at an honest efficiency, so none of its own signals stand out. The amount it can launder this way is small, and it still depends on the same co-signer, which is flagged whenever a naive partner uses it too.
- Development seeds 100–104 were used to fix three design problems before this evaluation: baselines that one large fraudster could distort (now each company weighs equally), Poisson volume tests that ignored real differences between companies (now quasi-Poisson with a robust dispersion), and small companies flagged on a handful of recoveries (now at least 8 are needed).
