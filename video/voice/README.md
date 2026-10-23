# Reading script for your own narration

Generated from `../narration.json` by `make_video.py`; do not edit by hand.

## How to record (中文說明)

- 每一段錄成一個檔，檔名照下面的標題，例如 `1-case.m4a`（`.wav`、`.mp3` 也可以），放在這個資料夾。
- **句與句之間停半秒左右**，影片會依停頓對齊字幕和換鏡頭。
- 唸錯不用整段重錄：停一下，從那一句重唸即可。開頭結尾的空白不用剪。
- 手機錄音即可，安靜房間、離嘴約 20 公分，語速比平常說話慢一點。
- 錄好後執行 `python video/make_video.py`，有錄音的段落會換成你的聲音，其他段落保留 AI 配音。

## Pronunciation

- **R-404A**: “R four-oh-four A”
- **R-410A**: “R four-ten A”
- **CO₂e**: “C-O-two equivalent”
- **CO₂**: “C-O-two”
- **COP31**: “COP thirty-one”
- **Türkiye**: “Tur-kee-yeh”
- **0.06**: “zero point zero six”
- **7,359**: “seven thousand three hundred fifty-nine”
- **140%**: “a hundred and forty percent”
- **HFC**: “H-F-C”

## `1-case.m4a`  (58 words, about 24 s)

1. One kilogram of R-404A warms the planet like 3.9 tonnes of CO₂, and when it is destroyed, someone is paid in carbon credits.
2. This is lot 42: recovered from a small air conditioner, destroyed, and credited once.
3. Every rule in our ledger accepted it.
4. And the air conditioner never existed.
5. This market is simulated; the gap is real.

## `2-problem.m4a`  (79 words, about 33 s)

1. Their kilograms are recorded in separate systems: customs quotas, technician logs, reclaimer reports and carbon registries.
2. Each checks its own books.
3. Nobody checks the same kilogram between them, and that seam pays.
4. In the EU, reclaimed R-404A sold at 140% of the virgin price in early 2025, and virgin gas has been sold as reclaimed.
5. We audited 436 destruction and reclamation projects at three carbon registries.
6. Not one publishes which container, and how many kilograms, a credit draws on.

## `3-rule.m4a`  (74 words, about 31 s)

1. Kigali Balance enforces one rule.
2. Every kilogram claimed as reclaimed or destroyed must trace back to a kilogram recovered from a real, registered unit.
3. Each lot carries a provenance class that can never be swapped.
4. A recovery needs two signatures: the technician's scale and the unit's owner.
5. It can never exceed what is booked inside the unit.
6. A destruction needs an independent verifier.
7. And each destruction event can be claimed by one registry, once.

## `4-evidence.m4a`  (95 words, about 40 s)

1. Does it hold?
2. We replayed a three-year simulated market, 7,359 events with twelve kinds of injected fraud, against the real contracts.
3. Every decision matched a separately written rule mirror.
4. Fuzzing throws thousands of forged recoveries at it, and none gets through.
5. Then we set AI red-team agents loose on it.
6. The first found a real hole: undocumented gas could be laundered into credits.
7. A second, given only the fixed code, found a way around our fix.
8. Both are fixed and are now tests that run on every push. A human audit is still to come.

## `5-ai.m4a`  (82 words, about 34 s)

1. So how was lot 42 caught?
2. Not by the rules, but by the trail they force.
3. Faking a recovery needs a second signer, and co-signatures leave a pattern.
4. Our AI flagged both the company that recovered lot 42 and the take-back point that co-signed for it.
5. Over three simulated years, it caught every naive fraudster and flagged under one percent of honest companies.
6. Fraudsters who adapt mostly slip through, but only by staying tiny: 4 kilograms in three years instead of 136.

## `6-impact.m4a`  (68 words, about 28 s)

1. Kigali Balance claims no credits; it is an enabler.
2. We don't claim a big number.
3. Counting only destroyed gas, our model puts the effect in a Japan-sized market at about 0.06 million tonnes of CO₂e a year, and says how a pilot would measure it.
4. We would start where trust between systems matters most: Türkiye's compliant reclaimers, as COP31 comes to Antalya.
5. Every kilogram has to add up.

Total: 456 words, about 3.2 minutes at 145 words a minute.

Recordings are personal data and are not committed: this folder only tracks this file.
