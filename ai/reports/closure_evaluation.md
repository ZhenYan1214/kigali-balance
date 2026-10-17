# End-of-life closure check: evaluation on simulated data

Check `1.0.0`, seeds 181-190 (10 runs, 36 months each).

> Simulated data only. The check reads observations only; ground truth (what was really inside each unit at removal) is used here to score it.

## What it finds

- Registered (Tier A) units removed from service: 2308; recovery recorded for 1115, no recovery record for 1132, still pending 61.
- Every unit with no recovery record really left service holding gas in 1132 of 1132 cases.
- Unaccounted mass, all runs: estimated 28,122 to 45,808 kg; true 42,766 kg (truth inside the estimated range in 10 of 10 runs).
- Companies flagged for a high closure gap: 0 (the simulator vents at random, so none should stand out).

## Per run

| seed | closed | recovered | no record | pending | true kg | estimate kg | true / nameplate |
|---|---|---|---|---|---|---|---|
| 181 | 222 | 113 | 105 | 4 | 2,946 | 1,754–3,134 | 0.92 |
| 182 | 254 | 122 | 123 | 9 | 4,749 | 3,242–5,014 | 0.94 |
| 183 | 232 | 122 | 103 | 7 | 3,918 | 2,631–4,229 | 0.91 |
| 184 | 224 | 105 | 113 | 6 | 3,490 | 2,145–3,675 | 0.93 |
| 185 | 214 | 100 | 107 | 7 | 4,678 | 3,230–4,976 | 0.93 |
| 186 | 234 | 117 | 115 | 2 | 3,993 | 2,557–4,391 | 0.90 |
| 187 | 225 | 103 | 118 | 4 | 6,569 | 4,581–6,965 | 0.94 |
| 188 | 246 | 113 | 124 | 9 | 5,755 | 3,680–6,185 | 0.92 |
| 189 | 206 | 104 | 98 | 4 | 3,485 | 2,212–3,801 | 0.90 |
| 190 | 251 | 116 | 126 | 9 | 3,183 | 2,091–3,438 | 0.91 |

## Reading the results

- **The unit list is exact by construction in the simulator**: a removed unit with no recovery on the ledger is one whose gas was vented. In reality some units are removed already empty, or recovered by someone who never reported it; the list is a review queue, not a finding.
- **The mass estimate uses the IPCC 2006 Table 7.9 range of charge remaining at end of life** (standalone_commercial 0%–80%, medium_large_commercial 50%–100%, chiller 80%–100%, split_ac 0%–80%).
- **The simulator keeps units nearly full until removal** (honest services top up below 85 % of the nameplate; an assumption marked unverified), so the true unaccounted mass sits near the top of the IPCC range. That is a limitation of the simulator found in the twelfth review, not evidence that the upper bound is right in reality.
- **Units below the registration threshold (Tier B) are invisible** until someone recovers them, so their venting cannot be seen by this check.
