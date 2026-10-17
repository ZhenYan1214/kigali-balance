# AI module A: evaluation on simulated data

Model `1.2.0` (hash `8e7415ff6cff`), held-out seeds 121–140, 20 runs of 40 service companies, each scored at 12, 24, 36 months of data.

> Simulated data only. Thresholds were fixed on development seeds before this evaluation; ground truth was used only to score.

Per run: 3 naive off-ledger companies (record 20 % of top-ups, buy smuggled gas on invoices), 3 adaptive ones (record just enough that every unit's ledger leakage sits between its category's IPCC minimum and midpoint, pay cash for smuggled gas), 2 phantom-recovery companies (module C's target; they also buy gas off the ledger) and 32 honest companies whose real maintenance quality varies (0.7–1.15x leakage).

The module's prior (IPCC leak-rate bands per category) is the same public source the simulator draws leak rates from, so the leakage signal is tested against a population that matches its prior except for the honest maintenance spread. Real fleets will not match IPCC this closely.

## Flags at the fixed threshold (score >= 0.6)

| months | precision | FPR (honest) | naive flagged | adaptive flagged | phantom flagged | AUC naive | AUC adaptive | AUC phantom |
|---|---|---|---|---|---|---|---|---|
| 12 | 0.988 | 0.002 | 0.917 | 0.033 | 0.625 | 0.982 | 0.561 | 0.935 |
| 24 | 0.988 | 0.002 | 1.0 | 0.0 | 0.575 | 0.999 | 0.532 | 0.996 |
| 36 | 0.967 | 0.005 | 1.0 | 0.05 | 0.625 | 0.998 | 0.573 | 0.995 |

Precision counts a flag as correct when the company really buys or uses gas off the ledger (naive, adaptive or phantom). AUC is threshold-free, against honest companies.

## Which signal carried each profile at 36 months (mean signal score)

| profile | A1 purchases off ledger | A2 recorded leakage vs peers | A3 silent units | total |
|---|---|---|---|---|
| adaptive | 0.00 | 0.06 | 0.03 | 0.09 |
| honest | 0.00 | 0.01 | 0.00 | 0.01 |
| naive | 1.00 | 0.80 | 0.53 | 1.00 |
| phantom | 0.74 | 0.00 | 0.00 | 0.74 |

## Off-ledger top-ups each profile put into equipment (ground truth, 36 months)

| profile | mean kg | min kg | max kg |
|---|---|---|---|
| adaptive | 128.0 | 0.0 | 573.2 |
| naive | 400.7 | 3.3 | 1,134.3 |

Highest honest score at 36 months: 1.000.

## Version history and known limitations

- **1.2.0 (round 14) follows a corrected simulator.** The earlier simulator refilled every unit once it was 15 % low, so equipment reached end of life nearly full, contradicting IPCC 2006 Table 7.9 (small units 0–80 % remaining). Since round 14 it follows the leak-check obligation: Tier A units (>= 5 tCO2e) are leak-checked and refilled, Tier B units mostly are not. A2 and A3 therefore judge Tier A units only. The 1.1.0 report on seeds 21–40 is archived (`module_a_v1.1_seeds21-40.md`); 1.2.0 was looked at on development seeds 100–104 only and is reported here on fresh seeds 121–140.
- **Known limitation of 1.2.0, found on seeds 121–140 and not fixed (to avoid tuning on test data).** Every honest flag came from A2 alone. With one leak check a year, a unit found just above 85 % waits another year for its refill, so refills are lumpier than the 15 % allowance in A2 assumes and a small fleet can show almost no top-ups for a while. A physical fix (allow one check interval of mid-range leakage) is left for the next version, to be judged on another set of fresh seeds.
- **1.0.0 was evaluated first, on held-out seeds 1–20** (`module_a_v1.0_seeds1-20.md`). It flagged 1.3 % of honest companies at 12 months and 0.3 % at 36 months: signal A2 compared recorded top-ups with the full expected leakage, but top-ups are lumpy (a unit is refilled only once it is ~15 % low). 1.1.0 subtracts that part. Because seeds 1–20 had then been looked at, **1.1.0 is reported on fresh seeds 21–40**.
- **A2 alone produces the false positives.** Every honest company flagged so far was flagged by A2 only, and had a small or unusual fleet (little expected refill volume, or a mix the IPCC mid-range does not describe well). In the first run of 1.1.0 this was about 1 % of honest companies at 12 months and none at 36; after company sizes were made to differ (0.4–2.5x, added for module C) it is 0.2–0.6 % at every window. Treat an A2-only flag as a watch list, not a review request. Found on test seeds; not tuned away.
- **The adaptive profile is mostly missed** (AUC barely above 0.5). Each of its units looks plausible and it buys smuggled gas for cash, so only the company-level leakage distribution can betray it, and honest maintenance differences hide that. It still put about 40 % as much smuggled gas into equipment as a naive company. Catching it needs evidence the ledger cannot see: site inspections, leak checks or cylinder tracking at the smuggler's end.
- **A3 (silent units) rarely fires within three years**: only large commercial units leak enough, even at the IPCC minimum, to make a missing refill certain. It becomes useful with longer registry histories.
