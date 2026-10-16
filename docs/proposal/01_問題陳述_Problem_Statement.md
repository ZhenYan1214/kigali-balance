> 交件版排版請見 [Kigali_Balance_Problem_Statement.pdf](Kigali_Balance_Problem_Statement.pdf)（A4 共 2 頁，由 [problem_statement.html](problem_statement.html) 產生）。這份 Markdown 和 PDF 的內容相同，只是第 5、6、7、9 節在 PDF 中排得比較緊湊。
>
> **2026-10-16 修訂（第十二、十三輪反思）**：回收上限改為「帳面內容量」（從一次充填量開始，回收扣除、補充補回，上限一次充填量），分次灌水也擋得住；「獨立各方」改為「可追責的第二簽章者」；AI 新增「退役無回收紀錄」；公開測試網的保密說明。理由見 [05_第十二輪反思_概念層級的漏洞.md](05_第十二輪反思_概念層級的漏洞.md)。
>
> **2026-10-15 改版（第十輪反思）**：跨境情境改成「為銷毀而進口」（歐盟 2024/573 第 22(2) 條規定進口一律視為原生氣體，所以原本「土耳其再生冷媒賣到歐盟」的敘事不成立）；既有系統表補上美國 EPA、歐盟第 26 條申報、UNEP iPIC、Isometric 的單一註冊處對帳；拿掉「稀缺」改用有出處的價格溢價；加入 ACR 再生碳權；統一為 2030-01-01；隱私改為如實描述；實體錨點改成反映新的合約設計（回收需設備持有者共同簽章、銷毀證明由獨立查證者簽署、鋼瓶唯一性、回收上限計入補充量）。理由見 [03_第十輪反思_評審視角.md](03_第十輪反思_評審視角.md)。

# Kigali Balance: Making Every Recovered, Reclaimed and Destroyed Kilogram of HFC Add Up

**IEEE ClimateChain Global Hackathon 2026 · Track 3: Sustainable Supply Chains (also Track 1: Carbon Markets & Emissions Transparency)**

## 1. The problem

HFC refrigerants are recorded in separate systems: customs quotas, technician logbooks, reclaimer reports and carbon-credit registries. Each now checks its own records. US reclaimers report input and output, Isometric reconciles mass container by container, and Japan issues electronic manifests. But no one checks the same kilogram *between* these systems. That seam lets virgin or smuggled gas be sold as "reclaimed". It also lets a kilogram earn a credit in one registry with nothing but a declaration to stop the same claim elsewhere.

## 2. Why it matters

- **Super-pollutant.** One kilogram of R-404A, a common supermarket refrigerant, warms the planet as much as about 3.9 t of CO₂. Equipment "banks" hold an estimated 13–24 GtCO₂e and leak about 1.5 GtCO₂e per year [1]. Lifecycle management could avoid another 39 GtCO₂e by 2050 [2].
- **End of life is where the bank escapes.** Japan has one of the most comprehensive lifecycle laws. Even so, in 2024 it recovered only 43% of the HFC left in scrapped equipment; the other 6,878 t (12.6 MtCO₂e) was released. Operators reported 575 t of leakage, while the national inventory estimated 6,283 t [3].
- **Illegal trade is growing.** EU HFC seizures rose from about 250 t in 2023 to about 670 t in 2024. The fraud documented includes labelling virgin gas as reclaimed, exceeding quotas and using false invoices, and illegal gas has reached Italian supermarket and state-railway supply chains [4].

## 3. Why "reclaimed" and "destroyed" are the weak points

- **"Reclaimed" sells at a premium.** Since 2025 the EU has banned servicing refrigeration with *virgin* gas of GWP ≥ 2,500, such as R-404A. Gas reclaimed in an EU facility and labelled as such is exempt from that ban until 1 January 2030 and from the shrinking quota. Imported gas counts as virgin [5]. In Q1 2025 reclaimed R-404A cost 140% of the virgin price [6], and an EU reclaimer warned that untreated virgin R-404A was being sold as reclaimed [7]. In the US, since 2026 gas with more than 15% virgin content may not be sold as reclaimed. From 2029, supermarket systems, refrigerated transport and ice makers must be serviced with reclaimed gas [8].
- **Both labels earn credits.** ACR has issued about 9 million credits for certified reclaimed HFCs. A 2024 technical note estimates that 2022 issuance was about twice the quota allowances left unused that year [9]. Verra VM0016 v2.0 (Dec 2025) [10], Isometric (May 2026) [11] and a Taiwanese draft methodology (Jul 2026) [12] now credit HFC destruction. Under the CDM, 19 HFC-23 projects out of about 2,000 received over half of all credits issued [13]. If virgin gas is labelled reclaimed, a credit is paid for virgin gas. The "reclaimed" fraud and the crediting problem are one conservation problem.

## 4. What exists, and the gap

| System | Covers | Missing |
|---|---|---|
| US EPA (40 CFR 82.164, 84.33, 84.112) | Reclaimer input and output per gas; annual audit by an independent accountant; electronic certificate per container; 15% virgin cap | US only; not linked to credit registries |
| EU F-gas Portal + customs; Art. 26 reports | Quota at the border; annual reclaimed and destroyed quantities; imports for destruction name the destroyer | Reclaimers do not report recovered input; no published cross-check |
| Italy Banca Dati; France Trackdéchets | Technician interventions; recovered-waste slips | Not linked to each other or to supply. Italy still had the EU's largest seizures [4] |
| Türkiye FARAVET / EKOMVET | Quotas, per-shipment control documents; 21,456 equipment records with service history | Not linked to EU systems; waste F-gas rules still a draft [14] |
| Japan RaMS | Electronic manifests from recovery to destruction | One country only; recovery stuck near 43% [3] |
| UNEP iPIC (112 countries incl. Türkiye) | Pre-shipment check that traders are licensed | No kilograms after delivery; no recovered / reclaimed / destroyed split [15] |
| Isometric; Verra; ACR | Chain of custody and mass reconciliation per container, inside one registry | "Not credited elsewhere" is a supplier declaration, not a check [11] |

Each system reconciles its own kilograms. No one reconciles a reclaimer's output against recovery recorded elsewhere, or a destruction event against every registry that might credit it.

## 5. Who needs this

- **Compliant reclaimers and distributors**, who lose sales to cheap gas sold as "reclaimed".
- **Large buyers**, such as supermarkets and rail operators, who need proof that their gas is legitimate.
- **Registries, verifiers and credit buyers**, who need proof that each credited kilogram came from real equipment and was credited only once.
- **Regulators**, who need warning signals that cut across segments.

Technicians do not re-enter data they already file; their scale signs the weight.

## 6. Solution

Kigali Balance is a reconciliation layer. It ingests existing national and registry records rather than replacing them, and enforces one rule:

> **Every kilogram claimed as "reclaimed" or "destroyed" must trace back to a kilogram recovered from a real, registered piece of equipment.**

1. **Physical anchors from second parties.** Signed weighings at recovery, receipt, reclamation and destruction, each bound to a cylinder ID that can hold only one open lot. Each recovery is co-signed by the unit's registered owner. Lab certificates and destruction certificates (DRE ≥ 99.99%) are signed by parties independent of the operator. Equipment IDs come from national registries.
2. **Conservation rules on a shared ledger.**
   - (a) A receiver re-weighs every transfer, and mass cannot appear in transit.
   - (b) A unit yields only what is booked inside it: one registered charge, drawn down by every recovery and refilled only by recorded top-ups.
   - (c) Reclaimed output cannot exceed documented recovered input minus losses.
   - (d) A party can only destroy what it holds.
   - (e) Each destruction event can be claimed by only one registry, without registries sharing their databases.
   - (f) Gas charged into a unit in the last 180 days is quarantined and can never be reclaimed or credited, so virgin gas cannot be laundered by charging it into a unit and recovering it the next day.
3. **AI that finds the implausible, not just the illegal.**
   - (a) Mass-balance anomalies, such as reclamation yields or sales that outrun documented inflows.
   - (b) Leakage gaps between expected and reported top-ups per unit, prompted by Japan's tenfold gap.
   - (c) Recoveries that do not match a unit's type, age and service history.
   - (d) Registered units that leave service with no recovery on the ledger, the clearest sign of venting.

   The AI flags cases for human review and never sanctions anyone automatically.

## 7. Why a shared ledger, and its limits

Inside one country with a strong regulator, a central database is enough; Japan's RaMS and the US reporting rules prove it. A shared ledger is justified only where **no single trusted operator spans all the parties**:
- several independent carbon registries,
- competing reclaimers,
- recovered gas shipped across borders for destruction, the one import the EU exempts from quota [5].

There, conservation is enforced when each record is written instead of in an annual audit. Lying requires a second, accountable signer to collude, such as a technician and the unit's owner, or a destroyer and its verifier, and collusion leaves patterns the AI looks for.

The ledger has three honest limits:
- **It cannot see inside a cylinder.** Physical truth comes from weighing and lab sampling.
- **It cannot catch gas that never enters it.** Instead it makes legitimate gas *provable* and closes the "reclaimed" label, illegal gas's most profitable exit.
- **It is not confidential by default.** Consortium members can see lot quantities, and the public testnet demo shows them to everyone. A production version would store commitments instead of grams.

## 8. Impact and alignment

- **How it cuts emissions.** Recovery rises only when someone pays for recovered kilograms, through credits, extended producer responsibility schemes or the reclaimed-gas premium. Payment attracts fraud unless those kilograms are verifiable. *Illustration:* each percentage point of Japan's disposal recovery rate is worth about 120 t of HFC, or about 0.22 MtCO₂e per year [3].
- **Adoption without a new mandate.** Participants join to qualify for credits or the reclaimed-gas premium. A US rule requiring QR-code cylinder tracking was struck down in court and then withdrawn after industry pushback.
- **COP31 and Türkiye.** Super-pollutants, including HFCs, were named "a central pillar of implementation on the road to COP31" at a June 2026 event attended by the COP31 President [16]. Türkiye rebuilt its F-gas regime in October 2024 [14]. Linking FARAVET quota documents, EKOMVET service records and end-of-life recovery lets compliant Turkish suppliers prove their gas is quota-backed. It also lets gas recovered in Türkiye and destroyed in the EU be credited once.
- **Taiwan.** Taiwan's HFC regulation (Feb 2025) and its draft destruction-credit methodology (Jul 2026) [12] need exactly this evidence.

## 9. What we do not claim

- **We are not the first to track cylinders.** Commercial tools, Japan's RaMS and a 2023 New Zealand blockchain project already do. Our contribution is conservation across organisations and uniqueness across registries.
- **No HFC destruction credit has yet been shown to be double-issued**, so cross-registry uniqueness is a safeguard for a market that is only now opening.
- **The demo uses simulated data only.**

---

**References** · [1] EIA, *ODS and HFC Banks*, 2026 · [2] UNEP guide citing TEAP 2024, Jul 2026 · [3] Japan MOE, OEWG48 side-event deck, Jul 2026 · [4] EIA, *Fakes, Fraud and F-Gases*, Apr 2026 · [5] Reg. (EU) 2024/573 Arts. 12(7), 13, 16(2), 22(2), 26; German Environment Agency, F-gas FAQ 5.3 · [6] Öko-Recherche / CITEPA, EU refrigerant price monitoring Q4/2025 · [7] Cooling Post, 4 Apr 2025 (PROZON) · [8] 40 CFR 82.164, 84.33, 84.112 (US EPA ER&R rule, 2024) · [9] Carbon Containment Lab, *Technical Note on Refrigerant Reclamation*, Jun 2024 · [10] Verra VM0016 v2.0 · [11] Isometric HFC & ODS Recovery and Destruction Protocol v1.0 · [12] Taiwan MOENV HFC Management Regulation, 2025-02-25; PTS News, 2026-07-22 · [13] Carbon Market Watch, HFC-23 background paper · [14] Resmî Gazete No. 32693, 2024-10-15; Türkiye MoEUCC briefing, Dec 2025 · [15] UNEP OzonAction, iPIC report 2024 · [16] CCAC, Jun 2026

**Source links (not in the PDF)**: [5] [UBA FAQ 5.3](https://www.umweltbundesamt.de/themen/klima-energie/fluorierte-treibhausgase-fckw/rechtliche-regelungen/haeufig-gestellte-fragen-zur-f-gas-verordnung/abschnitt-5-import-phase-down-quotensystem) · [6] [Price monitoring Q4/2025](https://www.nvkl.nl/wp-content/uploads/2026/03/Excerpt-Price-monitoring-Q4-2025.pdf) · [7] [Cooling Post](https://www.coolingpost.com/world-news/virgin-r404a-refrigerant-being-sold-as-reclaimed/) · [8] [eCFR §84.112](https://www.law.cornell.edu/cfr/text/40/84.112), [§82.164](https://www.law.cornell.edu/cfr/text/40/82.164), [§84.33](https://www.law.cornell.edu/cfr/text/40/84.33) · [9] [CCL technical note](https://carboncontainmentlab.org/documents/for-upload_technical-note-on-hfc-reclamation.pdf) · [11] [Isometric protocol](https://registry.isometric.com/protocol/hfc-ods-destruction/1.0) · [14] [MoEUCC briefing](https://webdosya.csb.gov.tr/v2/ozonturkiye/2025/12/Ankara_Y-netmelik_GBA-20251231165232.pdf) · [15] [iPIC report 2024](https://refindustry.com/upload/IPIC%20report%202024.pdf)

---
---

# 中文對照（供審閱，不交件）

# Kigali Balance：讓每一公斤被回收、再生、銷毀的 HFC 冷媒都對得起帳

**IEEE ClimateChain Global Hackathon 2026・賽道三：永續供應鏈（兼賽道一：碳市場與排放透明）**

## 1. 問題
HFC 冷媒的紀錄分散在各自獨立的系統：海關配額、技師維修紀錄、再生業者申報、碳權註冊處。每個系統現在都會核對自己的紀錄：美國的再生業者要申報進料和產出，Isometric 逐個容器做質量對帳，日本有電子行程管理票。但沒有人在這些系統**之間**核對同一公斤。這個縫隙讓原生或走私冷媒能被當成「再生」賣出，也讓一公斤在某個註冊處拿到碳權後，只靠一紙聲明擋住同一份宣稱在別處再算一次。

## 2. 為什麼重要
- **超級污染物。** 1 公斤 R-404A（超市常用冷媒）的暖化效果約等於 3.9 噸 CO₂。設備中的冷媒庫存估計有 13–24 GtCO₂e，每年逸散約 1.5 GtCO₂e [1]。做好生命週期管理，到 2050 年可再避免 39 GtCO₂e [2]。
- **報廢階段是庫存逸散的出口。** 日本有最完整的生命週期法規之一，2024 年報廢設備中殘留的 HFC 卻只回收了 43%，其餘 6,878 噸（12.6 MtCO₂e）全部逸散。業者申報的洩漏量是 575 噸，國家盤查估計則是 6,283 噸 [3]。
- **非法貿易正在成長。** 歐盟的 HFC 查扣量從 2023 年約 250 噸增加到 2024 年約 670 噸。已記錄的造假手法包括把原生冷媒標成再生、超額進口、使用假發票，非法冷媒也已流入義大利超市和國鐵的供應鏈 [4]。

## 3. 為什麼弱點在「再生」和「銷毀」
- **「再生」能賣出溢價。** 歐盟從 2025 年起禁止用 GWP ≥ 2,500 的**原生**冷媒（例如 R-404A）維修冷凍設備。在歐盟境內再生並依規定標示的冷媒，可以豁免這項禁令到 2030 年 1 月 1 日，也不受逐年縮減的配額限制；進口的冷媒則一律視為原生 [5]。2025 年第一季，再生 R-404A 的價格是原生的 140% [6]；一家歐盟再生業者公開警告，市面上有未經處理的原生 R-404A 冒充再生品販售 [7]。美國從 2026 年起，原生成分超過 15% 的冷媒不得以再生名義販售；2029 年起，超市系統、冷藏運輸、製冰機必須用再生冷媒維修 [8]。
- **兩個標籤都能換碳權。** ACR 已為「認證再生 HFC」核發約 900 萬單位碳權；一份 2024 年的技術說明估計，2022 年份的核發量約為當年未使用配額的兩倍 [9]。Verra VM0016 v2.0（2025 年 12 月）[10]、Isometric（2026 年 5 月）[11]、台灣的方法學草案（2026 年 7 月）[12] 現在都替 HFC 銷毀核發碳權。在 CDM 下，約 2,000 個專案中只有 19 個 HFC-23 專案，卻拿走一半以上的碳權 [13]。如果原生冷媒被標成再生，碳權就付給了原生冷媒。「再生」造假和碳權問題，是同一個守恆問題。

## 4. 現有系統與缺口
| 系統 | 涵蓋 | 缺少 |
|---|---|---|
| 美國 EPA（40 CFR 82.164、84.33、84.112） | 再生業者逐冷媒申報進料與產出；獨立會計師年度稽核；每個容器的電子證明；15% 原生上限 | 只限美國；不連結碳權註冊處 |
| 歐盟 F-gas Portal＋海關；第 26 條申報 | 邊境配額檢查；每年的再生量與銷毀量；為銷毀而進口時要指名銷毀業者 | 再生業者不申報回收進料量；沒有公開的交叉核對 |
| 義大利 Banca Dati；法國 Trackdéchets | 技師作業紀錄；回收廢冷媒的聯單 | 彼此不相連，也不連結供應端。義大利仍是歐盟查扣量最高的國家 [4] |
| 土耳其 FARAVET／EKOMVET | 配額與每批管制文件；21,456 筆設備登記與維修紀錄 | 不連結歐盟系統；廢 F-gas 規則仍是草案 [14] |
| 日本 RaMS | 從回收到銷毀的電子行程管理票 | 只限一個國家；回收率卡在約 43% [3] |
| UNEP iPIC（112 國，含土耳其） | 出貨前確認貿易商持有許可 | 交貨後沒有公斤數；不區分回收、再生、銷毀 [15] |
| Isometric；Verra；ACR | 單一註冊處內，逐容器的監管鏈與質量對帳 | 「未在他處入帳」只是供應商聲明，不是檢查 [11] |

每個系統都在對自己的公斤數，但沒有人拿再生業者的產出去對別處記錄的回收量，也沒有人拿一筆銷毀事件去對所有可能核發碳權的註冊處。

## 5. 誰需要
- **守法的再生業者與經銷商**：生意被打著「再生」名義的便宜冷媒搶走。
- **大型買家**，例如超市和鐵路公司：需要證明自己買的冷媒是合法的。
- **註冊處、查證機構與碳權買家**：需要證明每一公斤拿到碳權的冷媒都來自真實的設備，而且只被算過一次。
- **主管機關**：需要跨段落的異常訊號。

技師不必重複填寫已經申報過的資料，重量由他們的秤自動簽章。

## 6. 解法
Kigali Balance 是一層對帳機制。它匯入各國和各註冊處既有的紀錄，不取代它們，並強制執行一條規則：

> **每一公斤被宣稱為「再生」或「銷毀」的冷媒，都必須追溯到從一台真實、已登錄的設備回收出來的一公斤。**

1. **來自第二方的實體錨點**：回收、收貨、再生、銷毀時都有簽章秤重，每一筆都綁定一個鋼瓶 ID，每支鋼瓶同時只能有一個未結批次。每次回收都要由設備的登錄持有者共同簽章。實驗室成分報告和銷毀證明（破壞去除率 ≥ 99.99%）由獨立於業者的一方簽署。設備 ID 來自國家登錄系統。
2. **共享帳本上的守恆規則**：
   - (a) 每筆轉移都由收方重新秤重，運送途中不可能多出質量。
   - (b) 一台設備只能回收「帳面上還在裡面」的量：起始為一次登記充填量，每次回收扣除，只有帳本記錄的補充能補回，而且不會超過一次充填量。
   - (c) 再生產出量，不能超過有文件的回收進料量扣掉損耗。
   - (d) 只能銷毀自己持有的量。
   - (e) 每個銷毀事件只能被一個註冊處認領，各註冊處不需要分享自己的資料庫。
   - (f) 最近 180 天內灌進設備的冷媒會被隔離，永遠不能再生、不能申請碳權，所以無法用「把原生冷媒灌進設備、隔天再回收」的方式洗白。
3. **AI 找出「不合理」，而不只是「違法」**：
   - (a) 質量平衡異常，例如再生產率或銷售量超過有文件的進貨量。
   - (b) 每台設備預期與申報的補充灌注量之間的洩漏落差，動機是日本相差十倍的數據。
   - (c) 回收量和設備的類型、年齡、維修紀錄不相符。
   - (d) 已登錄的設備退役時，帳本上沒有任何回收紀錄，這是排放最明顯的跡象。

   AI 只標記案件交由人工複核，絕不自動處罰任何人。

## 7. 為什麼需要共享帳本，以及它的限制
在有強力主管機關的單一國家內，中央資料庫就夠了，日本 RaMS 和美國的申報規定就是證明。只有在**沒有一個各方都信任的單一營運者**時，共享帳本才有必要：
- 多個彼此獨立的碳權註冊處
- 互相競爭的再生業者
- 跨境運送去銷毀的回收冷媒，這是歐盟唯一豁免配額的進口 [5]

在這些情境下，守恆在每筆紀錄寫入時就被強制執行，而不是等每年一次的稽核。要說謊，必須讓一個可追責的第二簽章者一起串通，例如技師和設備持有者，或銷毀廠和它的查證者；而且串通會留下 AI 會去找的模式。

帳本有三個要誠實說明的限制：
- **它看不到鋼瓶裡裝的是什麼。** 物理上的真實性來自秤重和實驗室檢驗。
- **它抓不到從沒進入帳本的冷媒。** 它改為讓合法冷媒**可以被證明**，並堵住非法冷媒最賺錢的出路：「再生」標籤。
- **它預設不保密。** 聯盟成員看得到批次數量，公開測試網上的示範則人人都看得到。正式版本要在鏈上存承諾值，而不是公克數。

## 8. 影響與對齊
- **如何減少排放**：只有當有人替回收的公斤付錢（碳權、生產者延伸責任、再生冷媒溢價），回收率才會提高；但除非這些公斤能被驗證，付錢就會引來造假。*示意：* 日本報廢回收率每提高 1 個百分點，約等於 120 噸 HFC，每年約 0.22 MtCO₂e [3]。
- **不需要新法規也能推廣**：業者為了取得碳權資格或再生冷媒溢價而主動加入。美國曾規定用 QR 碼追蹤鋼瓶，先被法院撤銷，之後在業界反彈下正式撤回。
- **COP31 與土耳其**：2026 年 6 月一場有 COP31 主席出席的活動，把包括 HFC 在內的超級污染物定位為「通往 COP31 的核心實施支柱」[16]。土耳其在 2024 年 10 月重建了 F-gas 法規 [14]。把 FARAVET 配額文件、EKOMVET 維修紀錄和報廢回收連起來，守法的土耳其供應商就能證明自己的冷媒有配額支撐，在土耳其回收、運到歐盟銷毀的冷媒也只會被算一次碳權。
- **台灣**：台灣的 HFC 管理辦法（2025 年 2 月）和銷毀碳權方法學草案（2026 年 7 月）[12]，需要的正是這種證據。

## 9. 我們不宣稱的事
- **我們不是第一個追蹤鋼瓶的。** 商用工具、日本 RaMS、2023 年紐西蘭的區塊鏈計畫都已經在做。我們的貢獻是跨組織的守恆和跨註冊處的唯一性。
- **目前還沒有任何 HFC 銷毀碳權被證實重複核發**，所以跨註冊處唯一性是替一個剛開張的市場預先設下的防護。
- **Demo 全部使用模擬資料。**
