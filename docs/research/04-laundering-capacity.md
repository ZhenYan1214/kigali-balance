# 04 · Laundering capacity at decommissioning

> **Update, 2026-10-16 (after this report):** the booked-content rule proposed in Section 7.1 has been implemented in `EquipmentRegistry` (error `RecoveryExceedsContent`), so the contracts now behave as scenario 2′ below. The OP Sepolia deployment still runs the earlier code until it is redeployed. The figures in this report were computed before the change and are not affected by it.

*How much virgin refrigerant could a colluding technician and equipment owner book as "recovered", and how much does each defence layer remove?*

Date: 2026-10-16 · Script: [`analysis/laundering/laundering_model.py`](../../analysis/laundering/laundering_model.py) · Results: [`results.json`](../../analysis/laundering/results.json), [`per_category.csv`](../../analysis/laundering/per_category.csv), [`sensitivity.csv`](../../analysis/laundering/sensitivity.csv)

Labels used below: **[source]** = checked against a cited document or our own code; **[assumption]** = a modelling choice we could not verify; **[inference]** = our reading of the results.

---

## 1. Headline

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../../analysis/laundering/chart-dark.svg">
  <img alt="Laundering capacity by defence layer" src="../../analysis/laundering/chart-light.svg">
</picture>

These figures are the capacity if all 1,856 registered units were padded to the limit at end of life. The honest recovered volume for the same units is **39.0 t of gas = 86.2 kt CO₂e**.

| Scenario | Virgin gas the rules would accept as "recovered" | kt CO₂e (AR4) | Share of honest recovered volume (CO₂e) |
|---|---:|---:|---:|
| 0 No ledger | no finite bound | n/a | n/a |
| 1 Lifetime cap only (rule before 2026-10-16) | 122.5 t | **323.5** (309–338) | 375 % |
| 2 + per-recovery cap, **as deployed** | 122.5 t | **323.5** (309–338) | 375 % |
| 2′ + per-recovery cap, one charge per unit | 13.7 t | **38.6** (36.5–40.7) | 45 % |
| 3 + padding detector (proposed) | 10.8 t | **30.0** (28.5–31.7) | 35 % |

Ranges are the 5th–95th percentiles over 400 Monte Carlo draws. They show draw-to-draw noise **for one fixed set of assumptions** and say nothing about whether the assumptions are right. Section 5 covers that.

**The four findings that matter:**

1. **The per-recovery cap added on 2026-10-16 can be bypassed as currently coded.** [source] `EquipmentRegistry.recordRecovery` lets a recovery with `decommission = false` be repeated, and it does not require a recorded charge between two recoveries. A colluding pair can therefore reach the old lifetime cap in a median of **2 transactions** (95th percentile 4, maximum 6), all on the same day. As deployed, scenario 2 removes nothing compared with scenario 1.
2. **If "one charge per unit" were actually enforced, it would be the strongest layer:** it removes **88 %** of the lifetime-cap headroom (323.5 → 38.6 kt CO₂e). The missing piece is small (Section 7.1).
3. **Even with every layer in place, a colluding pair could add about a third on top of honest recovery** (30.0 kt CO₂e, 35 %). The reason is physical: honest units often reach end of life far from full (IPCC: 0–80 % remaining for small units, 50–100 % for medium and large commercial). One full charge therefore leaves room to pad a unit that really holds much less.
4. **The proposed detector removes only 22 % of what is left (38.6 → 30.0).** Its false-positive rate is ~0 under the main assumptions, but that rate depends entirely on assumptions nobody has measured. Under the simulator's own "honest units are nearly full" assumption, the same detector flags **40 %** of honest Tier A units (Section 5).

---

## 2. Question and definitions

- **Actor.** A service company (technician) and the equipment owner collude. The owner co-signs the EIP-712 recovery consent, and the technician's own signing scale reports a weight. The recovery cylinder physically contains the booked weight: the true remaining gas plus virgin gas from stock or smuggling.
- **Headroom of a unit** = what the rules would accept from it at decommissioning − what was really inside it at end of life. This is the task's definition. It is a *lower* bound on the virgin gas needed: an honest recovery leaves some gas behind (recovery efficiency < 100 %), so filling the cylinder to the booked weight takes slightly more virgin gas than the headroom.
- **Capacity, not an estimate of fraud.** Every unit is assumed to be padded to the limit. Real collusion would touch only some units. The share figures stay meaningful because the same units are used on both sides of the ratio: "for every tonne honestly recovered, this much could be added".
- **Honest recovered volume** = Σ remaining × recovery efficiency over the same units.

---

## 3. Method

### 3.1 Population [source: simulator output, seed 42]
- **Source.** `simulator/out/equipment.csv`, 1,856 units. Only `tier`, `category`, `gas` and `nameplate_g` are used. `ground_truth.json` is not read.
- **Tier A units.** 952 units from the national registry (`registered_by = registrar`):
  - 120 medium & large commercial (R-404A, mean 186 kg);
  - 120 chillers (R-134a, mean 254 kg);
  - 377 stand-alone commercial (mean 4.1 kg);
  - 335 split ACs (2.4–3.0 kg).
- **Tier B units.** 904 units registered at scrapping: 725 split ACs and 179 stand-alone units.
  - In the simulator, some of these are phantom units booked by fraudulent companies. That does not matter here: only their model charges are used, and those come from the same model database.
- **One end of life per unit.** Each unit is decommissioned exactly once.

### 3.2 What was really inside: IPCC 2006 Table 7.9 [source]
IPCC 2006 Guidelines, Vol. 3, Ch. 7, Table 7.9, p. 7.52 ([PDF](https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/3_Volume3/V3_7_Ch7_ODS_Substitutes.pdf)). We read the table directly from the PDF.

| Simulator category | IPCC sub-application | Initial charge remaining *p* | Lifetime *d* (y) | Recovery efficiency (upper bound) | Leak rate *x* used (%/y, from `params.json`) |
|---|---|---|---|---|---|
| standalone_commercial | Stand-alone Commercial Applications | 0–80 % | 10–15 | < 70 % | 1–15 (= IPCC) |
| medium_large_commercial | Medium & Large Commercial Refrigeration | 50–100 % | 7–15 | < 70 % | 10–35 (= IPCC) |
| chiller | Chillers | 80–100 % | 15–30 | < 95 % | 2–15 (= IPCC) |
| split_ac | Residential and Commercial A/C, incl. Heat Pumps | 0–80 % | 10–20 | < 80 % | 1–10 (= IPCC) |

Notes:
- **Split AC leak rate.** `params.json` marks the split_ac leak rate (1–10 %/y) as unconfirmed. Table 7.9 gives exactly 1 ≤ x ≤ 10 for residential and commercial A/C, so the value can be marked verified. (We did not edit `params.json`; that is out of scope for this task.)
- **Lifetimes.** We use the Table 7.9 lifetimes. The simulator's lifetimes are marked unverified and differ: medium & large commercial is 10–20 y there, but 7–15 y in IPCC.
- **Recovery efficiency.** The table gives 0 < η < max. Its footnote 4 says the 0 "highlights that there is no recovery in some countries". For a unit that is recovered, we use the upper bound [assumption]. The simulator's 85–98 % (unverified) is tested as a sensitivity case.
- **Distribution of *p*.** The table gives ranges, not distributions. Main case: uniform within the range [assumption]. Sensitivity cases: triangular skewed to empty, Beta(2,2), triangular skewed to full, and the simulator's 85–100 %, which lies outside IPCC.

### 3.3 Service history, so the lifetime cap and the detector have something to see [assumption]
The model draws, per unit:
- a leak rate *x* (uniform in the range above);
- a lifetime *d*;
- a fill level *f₀* ~ U(0.95, 1.00) after the last top-up, raised to *p* if needed.

**Routine service.** The unit is topped up to full whenever it falls below 85 % (`params.json`, unverified). Recorded top-ups therefore add up to about *x* × nameplate per year of routine service.

**How the unit lost *f₀ − p* after its last top-up.** One of two ways:
- **Gradual.** Service stopped, and the gas leaked at a *drifted* rate *x·m*, with *m* lognormal, σ = 0.5. The last top-up was (f₀ − p)/(x·m) years before the end.
- **Sudden.** Service continued until a failure. The last top-up falls at a uniform time within one top-up interval.

Assignment:
- A unit whose loss cannot be explained gradually within its lifetime is always sudden.
- Otherwise, 30 % are sudden.
- This gives 53 % gradual among Tier A units.

**Ledger coverage.**
- Main case: the ledger has seen every top-up of the unit's life (a mature system).
- Sensitivity cases: ledgers 10 and 3 years old. The simulator runs for 3 years.
- Tier B units cannot have ledger charges, because they are registered only at scrapping.

### 3.4 Scenarios
All scenarios are evaluated at one unit's end of life. "N" is the nameplate charge (Tier A) or model charge (Tier B).

| # | What the rules accept | Code / source |
|---|---|---|
| 0 | No ledger and no unit register. Paper claims are bounded only by plausibility, and nothing stops a claim for a nonexistent unit or a second claim for the same unit. **We treat this as unbounded** and do not invent a number. | — |
| 1 | Tier A: 1.05 N + every recorded top-up. Tier B: N. | `recoveryCap`, before the per-recovery cap was added |
| 2 | Each recovery ≤ 1.05 N (Tier B: N), and the total ≤ the lifetime cap. Recoveries with `decommission = false` can be repeated, so the lifetime cap is reachable in ⌈cap / per-recovery⌉ transactions. | `EquipmentRegistry.sol` `recordRecovery`, `maxPerRecovery`, `recoveryCap` |
| 2′ | One charge per unit at end of life: 1.05 N (Tier B: N). This is what scenario 2 was meant to achieve. | proposed, Section 7.1 |
| 3 | 2′, and the colluder books just under the detector threshold. | Section 4 |

---

## 4. The padding detector (scenario 3)

### Tier A: a new signal, designed here
It uses only what the ledger records:
- **Expected remaining:** `1 − x̂ · Δt / k`, where
  - `x̂` is the unit's documented leak rate: recorded top-ups per year of service, with 10 % estimation noise. A unit with fewer than 2 recorded top-ups falls back to its category's slowest IPCC rate.
  - `Δt` is the time since the last recorded top-up, or since the ledger started seeing the unit.
  - `k = 3` is slack: the unit may have leaked up to three times slower than documented.
- **IPCC ceiling:** honest units of that category should not hold more than the Table 7.9 maximum (80 % for stand-alone and A/C, 100 % for the others).
- **Threshold:** `1.05 · N · min(ceiling, expected)`. A recovery above it is flagged for review.
- **Splitting does not help.** The threshold applies to the total recovered since the last recorded charge.

### Tier B: the existing module C
- We use the existing module C ([`ai/kigali_ai/module_c.py`](../../ai/kigali_ai/module_c.py)) unchanged.
- Its only rule that bears on padding a real unit is C1, which flags recoveries ≥ 97 % of the model charge (judged per company against its peers).
- An adaptive colluder pads to just under 97 %.
- C2 and C3 look at volume and co-signer concentration. They target phantom units, not padding of real units, so they remove nothing here.

### False positives on honest units (same IPCC draws)
| | Honest units flagged |
|---|---:|
| Tier A, main assumptions | 0.006 % (≈ 0.06 of 952 units per draw) |
| Tier B (module C, ≥ 97 %) | 0 % |

[inference] The false-positive rate is low because the threshold is loose. Honest units recover only remaining × efficiency, and k = 3 is generous. The loose threshold is also why the detector removes only 22 %. Tightening it is a direct trade-off against false positives, and where that trade-off sits depends on quantities nobody has measured (Section 5).

---

## 5. Sensitivity analysis

One assumption is changed at a time, in kt CO₂e (share of honest recovered volume in brackets). Full table: [`sensitivity.csv`](../../analysis/laundering/sensitivity.csv).

| Case | 1 / 2 as deployed | 2′ one charge | 3 detector | Detector false positives, Tier A |
|---|---:|---:|---:|---:|
| **Main** (uniform *p*, 30 % sudden, σ 0.5, k 3, full ledger history) | 323.5 (375 %) | 38.6 (45 %) | 30.0 (35 %) | 0.0 % |
| *p* skewed to empty | 326.1 (414 %) | 48.6 (62 %) | 37.4 (48 %) | 0.0 % |
| *p* centred, Beta(2,2) | 323.2 (375 %) | 38.7 (45 %) | 30.0 (35 %) | 0.0 % |
| *p* skewed to full | 320.8 (343 %) | 28.6 (31 %) | 22.6 (24 %) | 0.0 % |
| *p* = simulator's 85–100 % (outside IPCC) | 317.3 (313 %) | 17.4 (17 %) | 14.2 (14 %) | 0.0 % |
| No sudden losses | 317.1 | 38.6 | 27.9 (32 %) | 0.0 % |
| All losses sudden | 338.2 | 38.6 | 34.8 (40 %) | 0.0 % |
| Leak-rate drift σ 1.0 | 319.7 | 38.6 | 29.3 (34 %) | 0.3 % |
| Detector k = 2 | — | — | 26.5 (31 %) | 0.1 % |
| Detector k = 6 | — | — | 33.6 (39 %) | 0.0 % |
| Ledger 10 years old | 244.7 (284 %) | 38.6 | 30.1 | 0.0 % |
| Ledger 3 years old (as in the simulator) | 90.5 (105 %) | 38.6 | 31.6 | 0.0 % |
| Recovery efficiency 85–98 % (simulator) | 323.5 (325 %) | 38.6 (39 %) | 30.0 (30 %) | 0.0 % |
| Detector: IPCC ceiling only | — | — | 37.2 (43 %) | 0.0 % |
| Detector: time since top-up only | — | — | 30.9 (36 %) | 0.0 % |
| Detector threshold × IPCC efficiency bound | — | — | **8.7 (10 %)** | 0.1 % |
| …same, but true efficiency 85–98 % | — | — | 8.7 (9 %) | **17.4 %** |
| Simulator world: 85–100 % remaining + 85–98 % efficiency | 317.3 (267 %) | 17.4 (15 %) | 14.2 (12 %) | **40.1 %** |
| Tier B threshold 0.80 (IPCC ceiling) instead of 0.97 | — | — | 29.5 (34 %) | Tier B 0 % |

What the table shows [inference]:
- **The ranking of the layers is robust.** In every case:
  - 1 = 2 as deployed > 2′ > 3;
  - one charge per unit removes 85–95 % of the lifetime-cap headroom when the ledger has seen the units' whole life. The share is lower when the ledger is young and has recorded few top-ups: 84 % with 10 years of history, 57 % with 3;
  - the detector removes a further 10–30 % of what is left.
- **The lifetime cap's weakness grows as the system matures.** With a 3-year ledger (the simulator's horizon), top-ups have not yet piled up and scenario 1 is "only" 105 % of honest volume. With full history it is 375 %. The simulator's evaluation therefore under-states the old flaw.
- **The residual headroom (2′, 3) depends mostly on how empty honest units really are.** It ranges from 14 % (if honest units were nearly full, as the simulator assumes) to 48 % (if skewed to empty).
- **The detector's power and its false-positive rate depend on unmeasured quantities.**
  - Scaling the threshold by the IPCC efficiency bound cuts the headroom to 10 %, but flags 17 % of honest units if real technicians recover 85–98 %.
  - The IPCC ceiling flags 40 % of honest Tier A units if honest units are as full as the simulator assumes.
  - So no threshold can be calibrated responsibly without real per-unit recovery data, such as remaining charge at disposal by equipment type, for which Japan's recovery records are one possible source.
- **Lowering module C's near-full threshold to 0.80 barely matters** (−0.5 kt): Tier B units are small, so Tier B contributes only ~1.7 kt in every scenario. The large Tier B risk is phantom units, which module C was built for. That risk is outside this model.

---

## 6. What the rules cannot see

1. **Off-ledger charges before recovery.** A colluder can charge virgin gas into a nearly empty unit off the ledger, then recover it for real.
   - The gas really came out of the unit, so the scale, the owner's signature and even a physical inspection all agree.
   - The 180-day residence rule only quarantines gas charged **on** the ledger (`_quarantinedGrams`).
   - **The whole residual headroom of scenarios 2′ and 3 (38.6 / 30.0 kt CO₂e) can be realised this way, with no false paperwork at all.** Only statistical signals across many units can catch it.
2. **Detector inputs can be gamed.** A charge recorded on the ledger more than 180 days before decommissioning resets Δt and raises the threshold. This costs ledger-tracked gas, and that gas then itself becomes recoverable after the residence period. We did not quantify this.
3. **Off-ledger top-ups during the unit's life** lower the recorded top-ups. That shrinks the scenario 1 cap, but it also leaves the detector without a documented leak rate (it falls back to the category minimum, which is more lenient).
4. **Scenario 0 is not "zero defence" for paperwork alone.** A careful auditor with a unit register would also apply roughly "one charge per real unit". What the ledger adds over paper is:
   - binding each claim to a registered unit;
   - one decommissioning per unit;
   - an accountable co-signer;
   - an audit trail that statistical detectors can run on.

---

## 7. What this means for the design

### 7.1 Make "one charge per unit" real [inference; contract change not made here]
Track a **booked content** per unit:
- It starts at 1.05 N (Tier A) or N (Tier B).
- Each recovery subtracts from it.
- Each recorded charge adds to it, capped at 1.05 N.
- A recovery may not exceed the booked content.

Effects:
- Honest repair-then-recharge still works: a recovery, then a recorded charge, then a recovery again.
- Splitting no longer gains anything.
- Scenario 2 becomes scenario 2′: 323.5 → 38.6 kt CO₂e.

The cheapest alternative is to allow a recovery without decommissioning only if a charge has been recorded since the previous recovery.

The simulator's `paddedRecovery` probe books 1.2 charges in one transaction, so it cannot detect the split path. A probe that books two recoveries of one charge each would.

### 7.2 Say plainly what the cap can and cannot do
Even a perfect per-unit cap leaves room equal to about a third to a half of honest recovered volume. The cap bounds the damage per unit; it cannot tell padding from a fuller-than-average unit. Claims such as "the ledger prevents virgin gas from being booked as recovered" overstate this. Defensible wording: "the ledger bounds how much can be laundered per unit to one charge, and makes the rest statistically visible".

### 7.3 Detectors need calibration data, not more rules
- The useful direction is company-level, not per-unit: a company that pads many units to just under a threshold shifts its whole distribution of recovered / expected. This is the same idea as module C's C1, extended to Tier A.
- Calibrating any threshold needs real remaining-charge-at-disposal data by equipment type.
- Until such data exists, the detector should be presented as a review queue, not as a quantified guarantee.

### 7.4 Fix the simulator's honest-unit assumption before re-evaluating the AI
The simulator keeps honest units at 85–100 %. Under that world, an IPCC-based detector would flag 40 % of honest Tier A units. Under IPCC, the same detector flags almost none, and the colluder's room roughly doubles or triples (14 % → 35–48 %). An AI evaluated only in the simulator's world is evaluated in the easiest case.

---

## 8. Money

- **Comparison price.** The only price on file in this repository is Recoolit's reported sale price of about **US$75 per credit** (1 tCO₂e) ([Malay Mail/AFP, July 2025](https://malaymail.com/news/life/2025/07/11/in-indonesia-a-start-up-captures-air-conditioning-coolants-to-stop-global-warming/183487), cited in `docs/research/02-validation-notes/verify_fgas_ledger.md`). It is one company and one source.
- **What the headroom would be worth.** At that price, if every padded kilogram were destroyed and credited, the headroom would be:
  - about US$24 M for scenarios 1 and 2 as deployed;
  - US$2.9 M for scenario 2′;
  - US$2.3 M for scenario 3.
- **Why this is only an illustration.** Not all recovered gas is destroyed for credits, and the climate harm differs from the credit value: the destroyed virgin gas would not otherwise have leaked.
- **What we did not price.** We found no cited price for virgin or reclaimed HFC per kg. The incentive to launder virgin gas into the reclaimed market is therefore not priced.

---

## 9. Limitations

- **Population.** Simulated (seed 42), not real equipment. The mix of categories and charges follows `params.json`. Medium & large commercial units dominate the tCO₂e (R-404A, GWP 3,922): 26.2 of the 38.6 kt in scenario 2′.
- **Table 7.9 ranges.** They are 2006 inventory defaults, not measured distributions for any particular market. The footnote says lower values apply to developed countries and higher values to developing countries. We used one range for all.
- **Service and leak model.** The 85 % top-up rule, the gradual/sudden loss split, leak-rate drift and the fill after the last top-up are assumptions. The sensitivity cases bound their effect on the results, but they do not validate them.
- **Top-ups.** Modelled as continuous (*x* × N per year of service). The discrete 85 % rule changes each unit's total by at most 0.15 N.
- **Detector.** A design sketch evaluated on the same generative assumptions it was designed for. It is not part of `ai/kigali_ai` and has not been tested on the simulator's ledger.
- **Monte Carlo intervals.** The 5–95 % ranges only reflect draw-to-draw noise.
- **Not modelled.** Tier B phantom units, charge-and-wait-180-days laundering, and reclaim-yield inflation.

---

## 10. Reproduce

```bash
ai/.venv/Scripts/python.exe analysis/laundering/laundering_model.py
```

The script is deterministic (seed 42, 400 draws) and writes `results.json`, `per_category.csv`, `sensitivity.csv`, `chart-light.svg` and `chart-dark.svg` to `analysis/laundering/`.

---

## 繁體中文摘要

**問題**：技師和設備持有者串通，在設備報廢時，最多能把多少原生冷媒登記成「回收」？每一道防線能壓掉多少？

**方法**：
- **設備**：模擬器的設備登錄（種子 42，1,856 台）。
- **報廢時真實剩餘量**：依 IPCC 2006 表 7.9（第 7.52 頁，我親自讀過 PDF）的區間抽樣。
- **洩漏率**：用 `params.json` 的值。
- **補充紀錄**：依 85% 補充規則推算。
- **抽樣次數**：400 次。
- **洗白空間**的定義是「規則願意接受的量 − 設備裡真正有的量」。這是**容量上限**（假設每台都灌到頂），不是實際造假量的估計。

**結果**（主要假設下；同一批設備的誠實回收量是 86.2 千噸 CO₂e）：

| 情境 | 千噸 CO₂e | 相對誠實回收量 |
|---|---:|---:|
| ① 沒有帳本 | 沒有上限 | — |
| ② 舊規則：終身上限 | 323.5 | 375% |
| ③ 新的單次上限（**現行程式碼**） | 323.5 | 375% |
| ③′ 真正做到「每台報廢最多一次充填量」 | 38.6 | 45% |
| ④ 再加上異常偵測 | 30.0 | 35% |

**最重要的四點**：
1. **〔已查證〕10/16 加上的單次上限可以被繞過。**
   - 不報廢的部分回收可以重複做，中間也不需要有補充紀錄。
   - 串通的人中位數只要拆成 2 筆（最多 6 筆），當天就能用完舊的終身額度。
   - 所以現行程式碼和舊規則一樣寬鬆。
   - 修法很小：追蹤每台的「帳面存量」，回收時扣、補充時加，上限是銘牌量 ×1.05，回收不得超過帳面存量。我沒有改合約，只寫在報告第 7.1 節。
2. **「每台一次充填量」如果真的落實，是最有效的一道防線**：壓掉 88%。
3. **即使所有防線都到位，串通者仍能在誠實回收量之上再加約三分之一**，因為報廢設備本來就常常不滿。
   - 這部分還可以用「帳外先灌原生冷媒，再真的回收出來」實現，帳本完全看不到。
4. **異常偵測只再壓掉 22%。**
   - 主要假設下誤判率接近 0。但這完全取決於沒人量測過的參數。
   - 如果誠實設備真的像模擬器假設的那樣幾乎都是滿的，同一套偵測會誤判 40% 的誠實 A 級設備。

**敏感度**：
- 防線的排序在所有情境下都成立：②＝③ ＞ ③′ ＞ ④。
- 殘餘空間在 14%–48% 之間，取決於報廢時的剩餘量分布。
- 帳本只有 3 年歷史時（模擬器的長度），舊規則的漏洞看起來只有 105%。帳本越成熟，漏洞越大，模擬器因此低估了舊規則的問題。

**對設計的意義**：
- 修好單次上限（帳面存量規則）。
- 說法改成「每台的洗白量被限制在一次充填量內，其餘的變成可被統計偵測」，不要說「防止」。
- 偵測要做成公司層級，並且需要真實的報廢剩餘量資料來校準。
- 模擬器的誠實設備假設應改成依表 7.9。

**金額**：只有一個可引用的價格，就是 Recoolit 約 US$75／噸 CO₂e（單一來源）。照這個價格，④ 約 230 萬美元，② 和現行的 ③ 約 2,400 萬美元。這只是示意：前提是被灌水的公斤全部被銷毀並核發碳權。
