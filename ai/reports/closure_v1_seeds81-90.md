# End-of-life closure check: evaluation on simulated data

Check `1.0.0`, seeds 81-90 (10 runs, 36 months each).

> Simulated data only. The check reads observations only; ground truth (what was really inside each unit at removal) is used here to score it.

## What it finds

- Registered (Tier A) units removed from service: 2425; recovery recorded for 1133, no recovery record for 1233, still pending 59.
- Every unit with no recovery record really left service holding gas in 1233 of 1233 cases.
- Unaccounted mass, all runs: estimated 30,382 to 48,991 kg; true 46,266 kg (truth inside the estimated range in 10 of 10 runs).
- Companies flagged for a high closure gap: 0 (the simulator vents at random, so none should stand out).

## Per run

| seed | closed | recovered | no record | pending | true kg | estimate kg | true / nameplate |
|---|---|---|---|---|---|---|---|
| 81 | 261 | 123 | 131 | 7 | 5,376 | 3,606–5,782 | 0.92 |
| 82 | 242 | 112 | 128 | 2 | 4,162 | 2,748–4,468 | 0.92 |
| 83 | 244 | 106 | 128 | 10 | 6,044 | 3,965–6,350 | 0.94 |
| 84 | 224 | 110 | 111 | 3 | 4,016 | 2,728–4,227 | 0.94 |
| 85 | 252 | 126 | 122 | 4 | 4,950 | 3,411–5,260 | 0.93 |
| 86 | 259 | 108 | 141 | 10 | 5,675 | 3,386–5,983 | 0.94 |
| 87 | 230 | 96 | 129 | 5 | 4,065 | 2,694–4,285 | 0.93 |
| 88 | 256 | 121 | 128 | 7 | 4,401 | 3,061–4,651 | 0.93 |
| 89 | 228 | 116 | 105 | 7 | 3,640 | 2,424–3,832 | 0.94 |
| 90 | 229 | 115 | 110 | 4 | 3,936 | 2,359–4,152 | 0.94 |

## Reading the results

- **The unit list is exact by construction in the simulator**: a removed unit with no recovery on the ledger is one whose gas was vented. In reality some units are removed already empty, or recovered by someone who never reported it; the list is a review queue, not a finding.
- **The mass estimate uses the IPCC 2006 Table 7.9 range of charge remaining at end of life** (standalone_commercial 0%–80%, medium_large_commercial 50%–100%, chiller 80%–100%, split_ac 0%–80%).
- **The simulator keeps units nearly full until removal** (honest services top up below 85 % of the nameplate; an assumption marked unverified), so the true unaccounted mass sits near the top of the IPCC range. That is a limitation of the simulator found in the twelfth review, not evidence that the upper bound is right in reality.
- **Units below the registration threshold (Tier B) are invisible** until someone recovers them, so their venting cannot be seen by this check.
