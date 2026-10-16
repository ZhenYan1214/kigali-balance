# Can an outsider check that a destroyed kilogram was credited only once? A public-record audit of ODS/HFC destruction credits

*Data accessed 2026-10-16. Dataset and rebuild script: [`research/registry-audit/`](../../research/registry-audit/). Every number below that comes from the dataset is printed by `python research/registry-audit/build_summary.py`. Sentences marked **[inference]** are judgements, not observations.*

## 1. Answer first

Until now Kigali Balance has said that outsiders cannot check whether the same kilogram of refrigerant was credited twice. That was an assumption. This audit turns it into a measured, narrower claim.

1. **Where two ledgers share a key, the public record can be checked, and it reconciles.** California's ARB publishes, for each ARB offset-credit issuance, the registry project ID, reporting period and quantity. ARB issues only after the registry retires the matching registry credits. Matching ARB's 291 ODS reporting periods against the ACR and CAR records, 270 are equal and 21 are lower on the ARB side. **None is higher.** This retire-before-issue rule is a working cross-ledger claim lock, and anyone can audit it.
2. **Between ACR, CAR and Verra there is no shared key.** No registry publishes, in a form another registry or an outsider can query, which certificate of destruction (CoD), which container and how many kilograms each credit draws on. CoD identifiers are public for 35 of 145 CAR projects (as a table, 2009–2014 only), for 30 of 54 ACR voluntary projects (as scanned PDFs or in file names) and for none of the 260 ARB/Washington compliance projects. **29.1 million of the 42.4 million destruction credits in the dataset (68.6%) come from projects with no public CoD identifier in any form.**
3. **The information that would make uniqueness checkable already exists on paper.** The two CoDs read in full name a container (an ISO tank number), a certificate ID and starting, ending and destroyed weights in kilograms. In both, about 11 t remained in the batch after the certified destruction. A destruction facility's own CoD numbers form a sequence: for one facility we see 32 numbers between 1205 and 1281 in public ACR file names, and the other 45 numbers in that range appear in no public record.
4. **The structure creates exposure.** Three U.S. incinerators or plasma units sit behind 75.7% of the destruction credits. ACR and CAR projects both have credited destruction windows at each of them in the same calendar month: 50 months at one facility, 14 and 13 at the others. Ten developer groups hold ODS/HFC projects in more than one registry. Two registries record a self-declared "registered elsewhere" flag; it is true for 1 of 281 ACR projects and 0 of 10 Verra projects.

None of this shows that any project was double counted. We found no evidence of double counting. The audit shows something else: across registries, only declarations and private documents stand between a destroyed kilogram and a second claim, and an outsider cannot inspect either.

## 2. Why this matters for the project

Kigali Balance's claim lock lets each destruction event be claimed by only one carbon registry. The weakest part of its case has been that the problem was hypothetical. Isometric's HFC/ODS protocol, for example, asks suppliers to declare that gas was not credited elsewhere (see the earlier review in `docs/proposal/06_第十三輪反思_更有野心.md`). This audit asks a concrete question: using only public records, could a journalist, a buyer or a second registry verify that a destroyed kilogram, container or CoD was credited once?

## 3. Method and sources

Collection used the public registry pages and the JSON those pages load. No login was used and no form was submitted. Three PDFs were downloaded and read with the user's approval: one ARB Offset Project Data Report and two CoDs. The ARB issuance spreadsheet was downloaded with approval. Personal names and contact details in documents are not reproduced.

| source | what was collected | URL | accessed |
|---|---|---|---|
| ACR (registry on ICE GreenTrace) | 1,009 project summaries. Detail records (site, crediting period, `hasAnotherCarbonProgram`, public document list) for the 204 ODS projects and 77 certified-reclaimed-HFC projects. 345 issuances from public holdings, 291 of them in scope. | https://greentrace.ice.com/acr/projects ; https://greentrace.ice.com/acr/credits | 2026-10-16 |
| Climate Action Reserve (APX) | 1,294 project rows, 145 of them ODS. Listing, issuance tab with serials and reporting periods, and document list for each ODS project. | https://thereserve2.apx.com/myModule/rpt/myrpt.asp?r=111 | 2026-10-16 |
| CAR "ODS Projects' Certificates of Destruction" report | 170 CoD rows: ID, facility, generator, dates, lb | https://thereserve2.apx.com/myModule/rpt/myrpt.asp?r=210 | 2026-10-16 |
| Verra (S&P Global registry) | All 5,331 VCS projects, filtered to VM0016 (8) and AM0001 HFC-23 (2). Issuances for both. Document list for project 5089. | https://registry.verra.org/verra/public/program/VCS | 2026-10-16 |
| California ARB | Offset credit issuance table (sheet updated 2026-10-14): 302 ODS issuance rows. Issuance-process text. | https://ww2.arb.ca.gov/our-work/programs/compliance-offset-program/arb-offset-credit-issuance | 2026-10-16 |
| Isometric | Protocol list and all 79 active projects | https://registry.isometric.com/protocols ; https://registry.isometric.com/projects | 2026-10-16 |
| Gold Standard | Public project API, keyword search (refrigerant, ozone, HFC, ODS, chiller) | https://public-api.goldstandard.org/projects | 2026-10-16 |
| UNFCCC CDM | Project 1947 (Yingpeng HFC-23): crediting period and CER blocks | https://cdm.unfccc.int/Projects/DB/DNV-CUK1215776483.62/view | 2026-10-16 |
| Documents read in full | OPDR of CAR1458; CoDs posted for ACR1231 and ACR1245 | https://thereserve2.apx.com/mymodule/reg/prjView.asp?id1=1458 ; https://greentrace.ice.com/acr/projects/registry/ACR_REGISTRY/project/P2423C9VPB24 ; https://greentrace.ice.com/acr/projects/registry/ACR_REGISTRY/project/P2323C9VPB26 | 2026-10-16 |

Scope. The audit covers ODS destruction under the ACR, CAR, ARB and Washington protocols, VM0016, and ACR's certified reclaimed HFC methodology (which credits reclaimed kilograms). It also covers two HFC-23 by-product projects under AM0001 at Verra. ACR's "Advanced Refrigeration Systems" (62 projects) and one gas-substitution project are excluded because they do not credit specific kilograms of gas.

Facility keys. Each destruction project was assigned a facility from its site location field, its description, or the CAR CoD report, in that order of preference for CAR. For ACR the description comes first, because in two records the site field and the description name different facilities (ACR0432, ACR0445). The key is a grouping label. **[inference]** "Heritage Thermal Services" and "Arcwood Environmental" at East Liverpool, Ohio are treated as one facility, because both descriptions give the same street address prefix ("1250 St…", ACR0755 and ACR1259).

## 4. Findings

### 4.1 What is on the public record

| registry | programme | scope | projects | with credits | credits issued (registry units) |
|---|---|---|---|---|---|
| ACR | ACR voluntary | destruction | 54 | 46 | 4,103,571 |
| ACR | ACR voluntary | reclamation | 77 | 67 | 32,434,104 |
| ACR | ARB compliance | destruction | 135 | 126 | 12,225,178 |
| ACR | WA Ecology compliance | destruction | 15 | 12 | 915,247 |
| CAR | ARB compliance | destruction | 96 | 91 | 8,604,786 |
| CAR | CAR voluntary | destruction | 35 | 35 | 10,475,311 |
| CAR | WA Ecology compliance | destruction | 14 | 11 | 1,213,469 |
| Verra | VCS (VM0016, AM0001) | destruction | 10 | 4 | 4,825,781 |
| **all** | | | **436** | **392** | **74,797,447** |

ARB's own table lists 302 ODS issuance rows for 247 ARB project IDs, totalling 26,877,896 ARB offset credits: 20,541,186 compliance and 6,336,710 early action, matching ARB's "Summary by Type" sheet. These are not added to the registry totals because they are the same tonnes (see 4.2). All 302 ARB ODS rows give the state as Ohio (189), Arkansas (110) or Texas (3).

Isometric lists "HFC and ODS Recovery and Destruction v1.0" as certified, but **0 of its 79 active projects** use it. Gold Standard's public project API returned no ODS or HFC destruction project for the keywords tried. Verra holds 8 VM0016 projects, of which 3 have issued credits, 342,244 VCUs in total; the 4th Verra project with credits is the HFC-23 project 439.

### 4.2 The one public cross-ledger link works: ARB ↔ registry

ARB's issuance page says ARB offset credits "may be issued after ARB receives confirmation that the OPR has retired" the corresponding registry offset credits. ARB's table carries the registry project ID for every issuance, so the two ledgers can be joined.

| registry | ARB type | result | periods | ARB credits |
|---|---|---|---|---|
| ACR | compliance | equal | 123 | 11,629,907 |
| ACR | compliance | ARB < registry | 1 | 306,517 |
| ACR | early action | equal | 3 | 287,542 |
| CAR | compliance | equal | 86 | 7,785,701 |
| CAR | compliance | ARB < registry | 5 | 819,061 |
| CAR | early action | equal | 57 + 1* | 4,321,481 + 163,884 |
| CAR | early action | ARB < registry | 14 + 1* | 1,461,527 + 102,276 |

\* ARB merged two CAR reporting periods into one.

**270 of 291 periods are equal, 21 have fewer ARB credits than registry credits, and 0 have more.** Where ARB is lower, the gap totals 1,236 credits in compliance projects (1 to 1,212 per period) and 126,858 in early-action projects. **[inference]** The early-action gaps fit registry credits that were not converted to ARB credits, for example because they had already been retired. The public record does not say.

This is what a cross-registry claim lock looks like when it works. There is one shared identifier (the registry project ID), a rule that the upstream unit is retired before the downstream unit is issued, and both sides published. It operates at the level of a project's reporting period, not kilograms or containers. It covers only ARB and its approved registries.

### 4.3 Between ACR, CAR and Verra there is no shared key

The full field-by-field table is `public_fields.csv` (34 rows, each with evidence and URL). In short:

| what an outsider can see | CAR voluntary (35) | ARB / WA compliance (110 CAR + 150 ACR) | ACR voluntary (54) | Verra (10) |
|---|---|---|---|---|
| destruction facility | yes | yes (OPDR PDF) | mostly | partial; not named for the 4 projects whose gas was shipped abroad |
| destruction dates and mass per event | yes (table, lb) | yes (OPDR PDF, lb) | when the CoD PDF is posted (kg) | not assessed (in reports, unread) |
| CoD identifier | yes (table), not unique | **no** | in 30 of 54 projects, as a scanned PDF or a file name | no standalone CoD in the one list read |
| container ID | no | no | on the 2 CoDs read, in 2 more file names | not assessed |
| chain of custody | generator name | yes (OPDR appendix) | not assessed | not assessed |
| "registered elsewhere" field | no | no | yes (`hasAnotherCarbonProgram`) | yes (`registeredOtherGhgProgram` plus signed representations) |
| link ID to another ledger | no | yes (ARB table) | no | no (CDM ID only where a project moved programmes) |

Earlier notes recorded that CAR certificates of destruction are private. That holds for the documents: none of the 821 public documents on CAR's 145 ODS projects is a CoD. It does not hold for the identifiers. CAR's public report r=210 lists 170 CoDs with ID, facility, generator, dates and pounds. That covers all 35 projects under CAR's own voluntary U.S. and Article 5 protocols (vintages 2009–2014) and **none** of the 110 projects under the ARB or Washington compliance protocols. The compliance projects' public OPDR gives the facility, each destruction event's dates and pounds, the gas composition and every party in the chain of custody. It does not give a CoD number or a container ID; we read one OPDR in full (CAR1458), and the others use the same ARB form **[inference]**.

The published CoD identifier is not a reliable key even inside CAR. In that report, 5 IDs appear twice, all within one project, on different dates with different weights. The field holds whatever the operator typed. Formats range from "Plas636" to "222154980111" to bills-of-lading numbers.

### 4.4 Kilogram- and container-level data exists, and shows why a CoD-level lock is not enough

The two ACR CoDs read in full (ACR1231 and ACR1245, both destroyed at REMONDIS Industrie Service GmbH, Bramsche, Germany) carry exactly the fields a kilogram-level ledger needs:

| project | certificate ID | container ("drum ID") | destruction window | starting batch | ending batch | destroyed | gas |
|---|---|---|---|---|---|---|---|
| ACR1231 | SA2025MWAN34-03 | SEGU 807543-2 | 2026-01-27 → 2026-02-16 | 29,560 kg | 11,120 kg | 18,440 kg | CFC-12 >99.90% |
| ACR1245 | SA2025MWAN34-04 | EURU 505294-3 | 2026-06-05 → 2026-06-18 | 22,840 kg | 10,820 kg | 12,020 kg | CFC-12 98.73% |

Two observations follow.

- **Each certified event left 11 t in the batch.** The CoD does not say whether the ending weight is container tare, an undestroyed heel, or material destroyed later under another certificate. **[inference]** If any of it can be destroyed later, a uniqueness check that locks "certificate X" or "container Y" is too coarse. The unit that must be locked is "kilograms from container Y in window Z", with a running remaining balance. That is the design Kigali Balance already uses (kilogram conservation per container).
- **Certificate IDs are sequential per facility and contract.** -03 and -04 are consecutive. A-Gas's own plasma-unit CoDs carry a four-digit sequence, visible in ACR file names as "Plas-1251" or "A-Gas 1274 COD". Between 1205 and 1281 we see 32 distinct numbers in ACR voluntary projects. The **45 other numbers in that range appear in no public record collected here.** **[inference]** They may belong to ARB or Washington compliance projects (whose OPDRs carry no CoD number), to destruction that earned no credit, or to CoDs not posted. An outsider cannot tell which, and that is the gap.

### 4.5 Structural overlap: same facilities, same developers, same months

Facility concentration (destruction projects only):

| facility (location-derived) | ACR projects | CAR projects | Verra projects | credits issued |
|---|---|---|---|---|
| A-Gas (formerly RemTec) plasma unit, Bowling Green OH | 81 | 69 | 0 | 12,720,744 |
| Clean Harbors, El Dorado AR | 31 | 42 | 0 | 10,728,192 |
| Heritage Thermal Services / Arcwood, East Liverpool OH | 68 | 32 | 0 | 8,632,675 |
| all others (10 keys, incl. Germany, France, Thailand, South Africa, Canada, Israel, on-site HFC-23) | 24 | 2 | 10 | 10,281,732 |

Same facility, same month, different registries. Public issuance records give credited destruction windows: CAR reporting periods, ARB periods for ACR's ARB projects, ACR vintage start dates, Verra monitoring periods. From these, we count months in which projects from both ACR and CAR had windows at the same facility: **50 months at Bowling Green, 14 at East Liverpool, 13 at El Dorado.** Counting programmes instead of registries gives 61, 16 and 15 months. **[inference]** This is ordinary: a facility destroys gas for whoever ships it. It is also why public data cannot separate the kilograms. Two ledgers draw on one furnace in one month, and the only document that splits the furnace's output between them (the CoD, with container and weight) is either not public or not linked.

Developers in more than one registry (counts of project records):

| developer group | ACR | CAR | Verra |
|---|---|---|---|
| A-Gas group (incl. Reclamation Technologies / RemTec) | 60 | 45 | 3 |
| Tradewater (LLC and International SRL) | 96 | 9 | 3 |
| Hudson Technologies | 41 | 2 | 0 |
| EOS Climate | 27 | 13 | 0 |
| Anew (Environmental / Carbon Development) | 23 | 0 | 1 |
| Diversified Pure Chem | 2 | 20 | 0 |
| ClimeCo | 1 | 19 | 0 |
| Environmental Credit Corp. | 2 | 5 | 0 |
| RapRec Refrigerants | 5 | 1 | 0 |
| Honeywell International | 0 | 1 | 1 |

Three cases show what can and cannot be checked. **These are illustrations of exposure, not findings of double counting.**

- **Date boundary that works (Verra 439 ↔ CDM 1947, HFC-23, Zhejiang).** Verra issued 4,483,537 VCUs for 2008-07-18 to 2009-04-19. The CDM crediting period starts 2009-04-20. One plant, one gas stream and a single-day boundary, so both public pages are enough to confirm the windows do not overlap. Aggregated refrigerant from many sources has no such single-plant boundary.
- **Same place, two registries, overlapping crediting periods (Verra 5089 and 5668 ↔ ACR0740, South Africa).** One developer group has VM0016 projects whose proponent city is Clayville/Olifantsfontein: 5089 issued 163,156 VCUs for 2024-05-16 to 2024-09-26, and 5668's crediting period runs from 2025-03-19. It also has an ACR international ODS project at an address in the same place (ACR0740: issuances with vintages starting 2025-12-08 and 2026-01-01). The Verra listing says only that destruction is "in South Africa"; that the site is the same is our **[inference]**. Crediting periods of 5668 and ACR0740 overlap. Issued windows do not yet. Nothing public lets an outsider confirm that a cylinder counted in one is absent from the other.
- **Facility not named in the listing (Verra 1752, gas from Ghana destroyed "in the United States").** Its monitoring windows (2018-09-11 to 2019-04-12) overlap 9 credited ACR windows of the same developer group at East Liverpool, which start between 2018-09-04 and 2019-04-01. The Verra listing does not name the facility; the monitoring report may (not read). Without the facility and container IDs, an outsider cannot even pose the uniqueness question.

Self-declaration. ACR's `hasAnotherCarbonProgram` is true for **1 of 281** ODS/reclaimed-HFC projects, and the record does not name the other programme. That project is ACR0799, "Tradewater International Honduras 1.0", destroyed at Saint-Vulbas, France, with 61,861 credits. Verra lists a project with the same name and country, VCS2596 "Tradewater International Honduras", also shipping gas to France. It has status *Withdrawn* and no issuance. **[inference]** The flag discloses a move from Verra to ACR before any Verra issuance, which is the flag doing its job. Verra's `registeredOtherGhgProgram` is false for all 10 of its projects, including the withdrawn one. CAR has no such field. Even when honest, a declaration is a promise, not a check. It says a project was elsewhere, not which kilograms.

## 5. What this means for Kigali Balance's claim lock

1. **Replace the hypothetical with the measured claim.** Suggested wording for judges: *"For 68.6% of the 42.4 million ODS/HFC destruction credits we found in ACR, CAR and Verra, no certificate-of-destruction identifier is public in any form. Where identifiers are public they come in three incompatible forms (a CAR table whose IDs are not unique, scanned PDFs at ACR, and file names), and no registry publishes which container and how many kilograms each credit draws on. Kilogram- or container-level uniqueness across registries therefore cannot be checked from public data."*
2. **Cite the positive precedent.** The ARB ↔ registry link shows that a shared ID plus retire-before-issue works and is auditable: 0 of 291 periods over-issued. Kigali Balance generalises it in two directions: from project-period to container and kilogram, and from one compliance programme to any registry.
3. **Lock the right unit.** The CoDs read show partial batches. The lock key should be (facility CoD number or container ID, kilograms, window) with a remaining balance per container, not "this certificate is claimed".
4. **Anchor at the facility.** Three facilities stand behind three quarters of the credits, and each already numbers its CoDs. A facility that writes each CoD number and container weight to the ledger at destruction time covers most of the volume with very few writers. The 45 unseen numbers in one facility's sequence are the concrete gap this closes.
5. **Do not overclaim.** We found no double counting and no evidence of it. The point is checkability. "Cannot be checked from public data" is supported; "is being double counted" is not.

## 6. Limitations

- **Coverage of documents.** Only 3 PDFs were read in full. CoD fields and the partial-batch pattern rest on 2 CoDs from one facility. The OPDR field list rests on 1 OPDR (the form is standard; that other OPDRs match is an inference). Verra monitoring and verification reports were not read, and they may contain CoDs and facility names. Verra's per-project pages were rate-limited, so the document list was read for project 5089 only.
- **ACR CoD identifiers** are taken from document titles except for the two CoDs read. Four ACR document lists were truncated at capture. Treating titles like "A-Gas 1274 COD" as the same series as "Plas-1251" is an inference.
- **Facility keys** come from free text. ARB rows carry only the state, so their facility comes from the registry record.
- **Windows.** ACR publishes only vintage start dates for voluntary issuances, so their windows are a single month. Month-level overlap overstates true simultaneity and is meant only as an exposure measure.
- **Units.** `credits_issued` mixes ACR ERTs, CAR CRTs/ROCs and Verra VCUs, each one tCO₂e. ARB credits are kept separate.
- **Moving targets.** Registries changed platform recently (ACR → ICE GreenTrace, Verra → S&P Global) and update often. Figures are as of 2026-10-16.
- **Not searched.** National programmes (e.g. Japan's J-Credit and Korea's offset scheme), ICVCM CCP labels, and voluntary retirements by buyers.

## 7. 中文摘要（給使用者）

**一句話：** 「外人無法檢查同一公斤是否被重複計入」這件事，現在有數據支撐了。結論要說得更精確：我們**沒有發現重複計算**，發現的是「**跨註冊處的公斤／鋼瓶唯一性，用公開資料檢查不了**」。

- **資料規模**（2026-10-16 讀取）：ACR 281 件、CAR 145 件、Verra 10 件，共 436 件 ODS／HFC 專案，註冊處單位合計 74,797,447。其中銷毀類 42,363,343。另有 ARB 的 302 筆 ODS 核發紀錄，共 26,877,896 ARBOC。ARBOC 和註冊處額度是同一批噸數，沒有重複相加。
- **唯一能檢查的跨帳本連結是 ARB↔註冊處，而且對得上：** 291 個核發期間中，270 個數量完全相等，21 個 ARB 較少，**0 個 ARB 較多**。這是「先註銷、後核發」機制在實務上運作的例子，也是 Kigali Balance 認領鎖可以引用的正面先例。
- **ACR、CAR、Verra 之間沒有共同鍵：** 銷毀額度中有 29,075,838（68.6%）來自 CoD 識別碼完全不公開的專案。CoD 識別碼公開的情況只有三種，格式互不相容：CAR 自願型 35 件有結構化表格（2009–2014，而且 ID 會重複）；ACR 自願型 54 件中有 30 件公開掃描 PDF 或檔名；ARB／華盛頓州合規型 260 件一個都沒有。
- **公斤級資料其實存在：** 讀了兩張德國 REMONDIS 的 CoD，上面有 ISO 罐號（SEGU 807543-2、EURU 505294-3）、證書號、起始／結束／銷毀重量。兩張在銷毀後都還剩約 11 公噸，公開資料沒說明這些剩餘量去了哪裡。所以認領鎖要鎖「鋼瓶＋公斤＋時段」並記錄餘額，不能只鎖「這張證書」。
- **結構性曝險：** 75.7% 的銷毀額度來自美國三座設施。同一設施、同一個月份內，同時有 ACR 和 CAR 專案的入帳銷毀時段：Bowling Green 50 個月，East Liverpool 14 個月，El Dorado 13 個月。另有 10 個開發商集團橫跨兩個以上註冊處。A-Gas 自家的 CoD 流水號在 1205–1281 之間有 45 個號碼查不到任何公開紀錄。以上一律寫成曝險，**不是指控**。
- **其他：** Isometric 的 HFC／ODS 協議已認證，但 79 個專案中**0 個**使用；Gold Standard 沒找到相關專案。ACR 的「已在他處註冊」旗標在 281 件中只有 1 件為真（ACR0799，宏都拉斯冷媒、在法國銷毀）。Verra 上有一件同名專案（VCS2596）狀態為「已撤回」、從未核發，〔推論〕應是誠實揭露了換註冊處。Verra 的旗標 10 件全為否。
- **主要限制：** 只完整讀了 3 份 PDF（1 份 OPDR、2 張 CoD），而且兩張 CoD 都來自同一座設施；Verra 的監測報告沒有讀；「Heritage＝Arcwood 為同一設施」、「1274 與 Plas-1251 屬同一流水號」都是推論。
