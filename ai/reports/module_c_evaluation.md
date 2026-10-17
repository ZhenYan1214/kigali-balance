# AI module C: evaluation on simulated data

Model `1.1.0` (hash `5afef55674c8`), fresh held-out seeds 161–180, 20 runs, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed on development seeds before this evaluation; ground truth was used only to score.

Per run: 40 service companies (sizes differ 0.4–2.5x) and 3 take-back points that co-sign Tier B recoveries. Fraud: one naive phantom-unit company (1–4 fake units a month at ~the full model charge), one adaptive one (a fake unit in ~15 % of months at an honest-looking efficiency), and one colluding take-back point that co-signs both, besides its honest business.

## Flags at the fixed threshold (score >= 0.6)

| months | precision | recall | FPR services | FPR co-signers | naive flagged | adaptive flagged | colluding flagged | AUC naive | AUC adaptive | AUC colluding |
|---|---|---|---|---|---|---|---|---|---|---|
| 12 | 1.0 | 0.683 | 0.0 | 0.0 | 1.0 | 0.05 | 1.0 | 1.0 | 0.593 | 1.0 |
| 24 | 0.936 | 0.733 | 0.004 | 0.0 | 1.0 | 0.2 | 1.0 | 1.0 | 0.742 | 1.0 |
| 36 | 0.979 | 0.783 | 0.001 | 0.0 | 1.0 | 0.35 | 1.0 | 1.0 | 0.845 | 1.0 |

## Which signal carried each profile at 36 months (mean signal score)

| profile | role | C1 | C2 | C3 | C4 | C5 | total |
|---|---|---|---|---|---|---|---|
| colluding | CO-SIGNER | – | – | – | 1.00 | 1.00 | 1.00 |
| honest | CO-SIGNER | – | – | – | 0.00 | 0.00 | 0.00 |
| honest | SERVICE | 0.00 | 0.00 | 0.00 | – | – | 0.00 |
| phantom adaptive | SERVICE | 0.00 | 0.39 | 0.06 | – | – | 0.41 |
| phantom naive | SERVICE | 1.00 | 1.00 | 1.00 | – | – | 1.00 |

## Fake recoveries each phantom profile booked (ground truth, 36 months)

| profile | mean fake units | mean kg | min kg | max kg |
|---|---|---|---|---|
| phantom adaptive | 5.8 | 4.2 | 1.8 | 8.1 |
| phantom naive | 87.5 | 136.4 | 116.4 | 156.9 |

Highest honest score at 36 months: services 0.795, co-signers 0.000.

## Reading the results

- **Re-evaluated in round 14 on a corrected simulator (model unchanged).** The earlier simulator refilled every unit once it was 15 % low, so equipment reached end of life nearly full, contradicting IPCC 2006 Table 7.9 (small units 0–80 % remaining). Since round 14 it follows the leak-check obligation: Tier A units (>= 5 tCO2e) are leak-checked and refilled, Tier B units mostly are not. An honest Tier B recovery therefore rarely comes close to the model charge, and the adaptive phantom company now books 20–70 % of the model charge to look honest. The seeds 61–80 report is archived (`module_c_v1.1_seeds61-80.md`); this report uses fresh seeds 161–180.
- The colluding take-back point is exposed by its counterpart: the fake units it co-signs come from one company far more often than other companies use it (C4). The owner co-signature required since H1 is what makes this pattern visible on the ledger.
- The adaptive phantom company books about as many Tier B recoveries as a large honest company, at an honest efficiency, so none of its own signals stand out. The amount it can launder this way is small, and it still depends on the same co-signer, which is flagged whenever a naive partner uses it too.
- **1.0.0 was evaluated first, on held-out seeds 41–60** (`module_c_v1.0_seeds41-60.md`): it flagged 17.5 % of honest take-back points at 12 months because C4 judged companies with one or two recoveries against a near-zero baseline, contrary to the minimum that C3 already applied. 1.1.0 applies the same minimum, and since seeds 41–60 had then been looked at, **1.1.0 is reported on fresh seeds 61–80**.
- **Known limitations found on seeds 61–80 (not fixed, to avoid tuning on test data).** C2 alone flagged three honest companies (0.3 % of honest company-runs): their equipment mix happened to include many small units, Tier A units are a crude size proxy, and the robust dispersion estimate (about 1.1) understates how much honest companies really differ. A C2-only flag should be treated as a watch list. At 12 months a company that just reached 8 recoveries made two honest take-back points look concentrated (C4).
- Development seeds 100–104 were used to fix three design problems before this evaluation: baselines that one large fraudster could distort (now each company weighs equally), Poisson volume tests that ignored real differences between companies (now quasi-Poisson with a robust dispersion), and small companies flagged on a handful of recoveries (now at least 8 are needed).
