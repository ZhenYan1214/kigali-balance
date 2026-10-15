> 交件版排版請見 [Kigali_Balance_Problem_Statement.pdf](Kigali_Balance_Problem_Statement.pdf)（A4 共 2 頁，由 [problem_statement.html](problem_statement.html) 產生）。這份 Markdown 和 PDF 的內容相同，只是第 5、6、9 節在 PDF 中排得比較緊湊。

# Kigali Balance: Making Every Recovered, Reclaimed and Destroyed Kilogram of HFC Add Up

**IEEE ClimateChain Global Hackathon 2026 · Track 3: Sustainable Supply Chains (also Track 1: Carbon Markets & Emissions Transparency)**

## 1. The problem

HFC refrigerants are recorded in separate systems: customs quotas, technician logbooks, waste slips and carbon-credit registries. We found no system that checks whether the kilograms claimed as *recovered*, *reclaimed* or *destroyed* add up across borders and registries. This gap lets virgin or smuggled gas be sold as "reclaimed". It could also let the same destroyed kilogram be credited twice.

## 2. Why it matters

- **Super-pollutant.** One kilogram of R-404A, a common supermarket refrigerant, warms the planet as much as about 3.9 t of CO₂. Equipment "banks" hold an estimated 13–24 GtCO₂e and leak about 1.5 GtCO₂e per year [1]. Lifecycle management could avoid another 39 GtCO₂e by 2050 [2].
- **End of life is where the bank escapes.** Japan has one of the most comprehensive lifecycle laws. Even so, in 2024 it recovered only 43% of the HFC left in scrapped equipment; the other 6,878 t (12.6 MtCO₂e) was released. Operators reported 575 t of leakage, while the national inventory estimated 6,283 t [3].
- **Illegal trade is growing.** EU HFC seizures rose from about 250 t in 2023 to about 670 t in 2024. Documented fraud includes labelling virgin gas as reclaimed, exceeding quotas and using false invoices. Illegal gas has reached Italian supermarkets and state-railway supply chains [4]. Prices are up about tenfold, and EU supply will fall by another 50% in 2027 [4].

## 3. Why "reclaimed" and "destroyed" are the weak points

Both labels now carry money.

- **"Reclaimed" escapes scarcity.** Since 2025 the EU has banned servicing refrigeration with *virgin* gas of GWP ≥ 2,500, such as R-404A. Labelled reclaimed gas stays legal until 2030 [5], and HFCs reclaimed inside the EU fall outside the shrinking quota [6]. Relabelling virgin gas as "reclaimed" therefore turns a banned, quota-limited product into a legal one.
- **"Destroyed" now earns credits.** Verra VM0016 v2.0 (Dec 2025) [7], Isometric (May 2026) [8], ACR, and a Taiwanese draft methodology (Jul 2026) [9] all credit HFC destruction. This market has a history: under the CDM, 19 HFC-23 projects out of about 2,000 received over half of all credits issued [10]. Isometric requires chain of custody for every container [8], but each registry can only check its own records.

## 4. What exists, and the gap

| System | Covers | Missing |
|---|---|---|
| EU F-gas Portal + customs single window | Importer registration; quota at the border | Kilograms after first sale |
| Italy Banca Dati; France Trackdéchets | Technician interventions; recovered-waste slips | Not linked to each other or to supply. Italy still had the EU's largest seizures [4] |
| Türkiye FARAVET / EKOMVET | Quotas and imports; equipment and service records | Rules for waste F-gas are still a draft [11] |
| Japan RaMS | Electronic manifests from recovery to destruction | One country only; recovery stuck near 43% [3] |
| Recoolit; Verra / Isometric / ACR | Project tracking; credit issuance | No container-level uniqueness check across registries |

Every segment has an owner, but no one owns the seams between segments. That is where the most profitable fraud happens.

## 5. Who needs this

- **Compliant reclaimers and distributors**, who lose sales to cheap gas sold as "reclaimed".
- **Large buyers**, such as supermarkets and rail operators, who need proof that their gas is legitimate.
- **Registries, verifiers and credit buyers**, who need proof that each destroyed kilogram came from real equipment and was credited only once.
- **Regulators**, who need warning signals that cut across segments.

Technicians get no new paperwork: the system reuses records they already file.

## 6. Solution

Kigali Balance is a reconciliation layer. It ingests existing national and registry records rather than replacing them, and enforces one rule:

> **Every kilogram claimed as "reclaimed" or "destroyed" must trace back to a kilogram recovered from a real, registered piece of equipment.**

1. **Physical anchors.** Signed cylinder IDs; signed weighings at recovery, reclamation and destruction; signed lab composition certificates; equipment IDs from national registries.
2. **Conservation rules on a shared ledger.**
   - Every transfer balances: out equals in.
   - Kilograms recovered from a unit cannot exceed its registered charge.
   - Reclaimed output cannot exceed documented recovered input minus losses.
   - A party can only destroy what it holds.
   - Each destruction event is recorded once and can be claimed by only one registry before credits are issued, without exposing commercial data.
3. **AI that finds the implausible, not just the illegal.**
   - Mass-balance anomalies, such as reclamation yields or sales that outrun documented inflows.
   - Leakage gaps between expected and reported top-ups per unit, prompted by Japan's tenfold gap.
   - Recovery quantities or compositions that do not match a unit's type, age and service history.

   The AI flags cases for human review and never sanctions anyone automatically.

## 7. Why a shared ledger, and its limits

Inside one country with a strong regulator, a central database is enough; Japan's RaMS proves it. A shared ledger is justified only where **no single trusted operator spans all the parties**:
- cross-border trade between Türkiye and the EU,
- several independent carbon registries,
- competing reclaimers.

In those settings, conservation is enforced when each record is written instead of in an annual audit. Lying then requires collusion among independent counterparties.

The ledger has two honest limits:
- **It cannot see inside a cylinder.** Physical truth comes from weighing and lab sampling.
- **It cannot catch gas that never enters it.** Instead it makes legitimate gas *provable*, so buyers can demand provenance. It also stops illegal gas from being laundered into the legal market under a "reclaimed" label, which is that gas's most profitable exit.

## 8. Impact and alignment

- **How it cuts emissions.** Recovery rises only when someone pays for recovered kilograms, through credits, extended producer responsibility (EPR) schemes or a premium for reclaimed gas. Payment attracts fraud unless those kilograms are verifiable. *Illustration:* each percentage point of Japan's disposal recovery rate is worth about 120 t of HFC, or about 0.22 MtCO₂e per year [3].
- **Adoption without a new mandate.** Participants join to qualify for credits or a reclaimed-gas premium. A US rule requiring QR-code cylinder tracking was struck down in court and then withdrawn after industry pushback.
- **COP31 and Türkiye.** Super-pollutants, including HFCs, were named "a central pillar of implementation on the road to COP31" at a June 2026 event attended by the COP31 President [12]. Türkiye rebuilt its F-gas regime in October 2024 [13]. Kigali Balance links FARAVET, EKOMVET and end-of-life records, giving compliant Turkish suppliers provable provenance in trade with the EU.
- **Taiwan.** Taiwan's HFC regulation (Feb 2025) and its draft destruction-credit methodology (Jul 2026) [9] need exactly this evidence.

## 9. What we do not claim

- **We do not claim to be first to track cylinders.** Commercial tools, Japan's RaMS and a 2023 New Zealand blockchain project already do. Our contribution is cross-organisation conservation and cross-registry uniqueness.
- **We do not claim double-counting between destruction credits and national phase-down accounting has happened.** It is undocumented, so we treat it as a design safeguard.
- **We do not use real government data.** The demo uses simulated data only.

---

**References** · [1] EIA, *ODS and HFC Banks*, 2026 · [2] UNEP guide citing TEAP 2024, Jul 2026 · [3] Japan MOE, OEWG48 side-event deck, Jul 2026 · [4] EIA, *Fakes, Fraud and F-Gases*, Apr 2026 · [5] Reg. (EU) 2024/573 Art. 13 · [6] German Environment Agency (UBA), F-gas Regulation overview · [7] Verra VM0016 v2.0 · [8] Isometric HFC & ODS Destruction Protocol v1.0 · [9] Taiwan MOENV HFC Management Regulation, 2025-02-25; PTS News, 2026-07-22 · [10] Carbon Market Watch, HFC-23 background paper · [11] iklim.gov.tr, draft waste F-gas circular · [12] CCAC, Jun 2026 · [13] Resmî Gazete No. 32693, 2024-10-15

---
---

# 中文對照（供審閱，不交件）

# Kigali Balance：讓每一公斤被回收、再生、銷毀的 HFC 冷媒都對得起帳

**IEEE ClimateChain Global Hackathon 2026・賽道三：永續供應鏈（兼賽道一：碳市場與排放透明）**

## 1. 問題
HFC 冷媒的紀錄分散在各自獨立的系統：海關配額、技師維修紀錄、廢棄物轉移聯單、碳權註冊處。我們找不到任何系統，會跨國境、跨註冊處核對被宣稱為「已回收」「已再生」「已銷毀」的公斤數是否相符。這個縫隙讓原生或走私的冷媒能被當成「再生」冷媒賣出，也可能讓同一公斤被銷毀的冷媒被算兩次碳權。

## 2. 為什麼重要
- **超級污染物。** 1 公斤 R-404A（超市常用冷媒）的暖化效果約等於 3.9 噸 CO₂。設備中的冷媒庫存估計有 13–24 GtCO₂e，每年逸散約 1.5 GtCO₂e [1]。做好生命週期管理，到 2050 年可再避免 39 GtCO₂e [2]。
- **報廢階段是庫存逸散的出口。** 日本有全世界最完整的生命週期法規之一，2024 年報廢設備中殘留的 HFC 卻只回收了 43%，其餘 6,878 噸（12.6 MtCO₂e）全部逸散。業者申報的洩漏量是 575 噸，國家盤查估計則是 6,283 噸 [3]。
- **非法貿易正在成長。** 歐盟的 HFC 查扣量從 2023 年約 250 噸增加到 2024 年約 670 噸。已記錄的造假手法包括把原生冷媒標成再生、超額進口、使用假發票。非法冷媒已流入義大利的超市和國鐵供應鏈 [4]。價格上漲約十倍，2027 年歐盟的供應量還會再減 50% [4]。

## 3. 為什麼弱點在「再生」和「銷毀」
這兩個標籤現在都能換成錢。
- **「再生」能避開稀缺。** 歐盟從 2025 年起，禁止用 GWP ≥ 2,500 的**原生**冷媒（例如 R-404A）維修冷凍設備，但有標示的再生冷媒可以合法使用到 2030 年 [5]。在歐盟境內再生的 HFC 也不受逐年縮減的配額限制 [6]。所以只要把原生冷媒改標成「再生」，一個被禁止又受配額限制的產品就變成合法的了。
- **「銷毀」現在能換碳權。** Verra VM0016 v2.0（2025 年 12 月）[7]、Isometric（2026 年 5 月）[8]、ACR，以及台灣的方法學草案（2026 年 7 月）[9]，都替 HFC 銷毀核發碳權。這個市場有前科：在聯合國清潔發展機制（CDM）下，約 2,000 個專案中只有 19 個 HFC-23 專案，卻拿走了一半以上的碳權 [10]。Isometric 要求每個容器都要有完整的監管鏈 [8]，但每個註冊處都只能檢查自己的紀錄。

## 4. 現有系統與缺口
| 系統 | 涵蓋 | 缺少 |
|---|---|---|
| 歐盟 F-gas Portal＋海關單一窗口 | 進口商登錄；邊境配額檢查 | 第一次銷售之後的公斤數 |
| 義大利 Banca Dati；法國 Trackdéchets | 技師作業紀錄；回收廢冷媒的聯單 | 彼此不相連，也不連結供應端。義大利仍是歐盟查扣量最高的國家 [4] |
| 土耳其 FARAVET／EKOMVET | 配額與進口；設備與維修紀錄 | 廢 F-gas 的管理規則還是草案 [11] |
| 日本 RaMS | 從回收到銷毀的電子行程管理票 | 只限一個國家；回收率卡在約 43% [3] |
| Recoolit；Verra／Isometric／ACR | 專案追蹤；碳權核發 | 沒有跨註冊處的容器層級唯一性檢查 |

每一段都有人管，但段與段之間的縫隙沒有人管，而最賺錢的造假就發生在那裡。

## 5. 誰需要
- **守法的再生業者與經銷商**：生意被打著「再生」名義的便宜冷媒搶走。
- **大型買家**，例如超市和鐵路公司：需要證明自己買的冷媒是合法的。
- **註冊處、查證機構與碳權買家**：需要證明每一公斤被銷毀的冷媒都來自真實的設備，而且只被算過一次碳權。
- **主管機關**：需要跨段落的異常訊號。

技師不需要多填任何文件，系統重複使用他們原本就要申報的紀錄。

## 6. 解法
Kigali Balance 是一層對帳機制。它匯入各國和各註冊處既有的紀錄，不取代它們，並強制執行一條規則：

> **每一公斤被宣稱為「再生」或「銷毀」的冷媒，都必須追溯到從一台真實、已登錄的設備回收出來的一公斤。**

1. **實體錨點**：簽章過的鋼瓶 ID；回收、再生、銷毀時簽章過的秤重紀錄；實驗室簽章的成分報告；來自國家登錄系統的設備 ID。
2. **共享帳本上的守恆規則**：
   - 每筆轉移都要平衡：轉出等於收到。
   - 從一台設備回收的公斤數，不能超過它登記的充填量。
   - 再生產出量，不能超過有文件的回收進料量扣掉損耗。
   - 只能銷毀自己持有的量。
   - 每個銷毀事件只記錄一次，而且在核發碳權前只能被一個註冊處認領，不需揭露商業資料。
3. **AI 找出「不合理」，而不只是「違法」**：
   - 質量平衡異常，例如再生產率或銷售量超過有文件的進貨量。
   - 每台設備預期與申報的補充灌注量之間的洩漏落差，動機是日本相差十倍的數據。
   - 回收量或成分與設備的類型、年齡、維修紀錄不相符。

   AI 只標記案件交由人工複核，絕不自動處罰任何人。

## 7. 為什麼需要共享帳本，以及它的限制
在有強力主管機關的單一國家內，中央資料庫就夠了，日本 RaMS 就是證明。只有在**沒有一個各方都信任的單一營運者**時，共享帳本才有必要：
- 土耳其與歐盟之間的跨境貿易
- 多個彼此獨立的碳權註冊處
- 互相競爭的再生業者

在這些情境下，守恆在每筆紀錄寫入時就被強制執行，而不是等每年一次的稽核。要說謊，就必須讓多個彼此獨立的交易對手一起串通。

帳本有兩個要誠實說明的限制：
- **它看不到鋼瓶裡裝的是什麼。** 物理上的真實性來自秤重和實驗室檢驗。
- **它抓不到從沒進入帳本的冷媒。** 它改為讓合法冷媒**可以被證明**，買家因此能要求供應商出示來源。它也阻止非法冷媒打著「再生」名義洗進合法市場，而這正是非法冷媒最賺錢的出路。

## 8. 影響與對齊
- **如何減少排放**：只有當有人替回收的公斤付錢（碳權、生產者延伸責任 EPR、再生冷媒溢價），回收率才會提高；但除非這些公斤能被驗證，付錢就會引來造假。*示意：* 日本報廢回收率每提高 1 個百分點，約等於 120 噸 HFC，每年約 0.22 MtCO₂e [3]。
- **不需要新法規也能推廣**：業者為了取得碳權資格或再生冷媒溢價而主動加入。美國曾規定用 QR 碼追蹤鋼瓶，先被法院撤銷，之後在業界反彈下被正式撤回。
- **COP31 與土耳其**：2026 年 6 月一場有 COP31 主席出席的活動，把包括 HFC 在內的超級污染物定位為「通往 COP31 的核心實施支柱」[12]。土耳其在 2024 年 10 月重建了 F-gas 法規 [13]。Kigali Balance 把 FARAVET、EKOMVET 和報廢端的紀錄連起來，讓守法的土耳其供應商在與歐盟的貿易中能出示來源證明。
- **台灣**：台灣的 HFC 管理辦法（2025 年 2 月）和銷毀碳權方法學草案（2026 年 7 月）[9]，需要的正是這種證據。

## 9. 我們不宣稱的事
- **我們不宣稱是第一個追蹤鋼瓶的。** 商用工具、日本 RaMS、2023 年紐西蘭的區塊鏈計畫都已經在做。我們的貢獻是跨組織的守恆和跨註冊處的唯一性。
- **我們不宣稱銷毀碳權與國家削減會計之間的重複計算已經發生。** 這件事沒有文件化的案例，所以只把它當成設計上的防護。
- **我們不使用真實的政府資料。** Demo 全部使用模擬資料。
