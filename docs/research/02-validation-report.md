# 撤回原三題，改押冷媒公斤守恆帳本

先講結論：前一份報告推薦的三個題目，經過反向驗證後，**沒有一題還能當主題**。電池護照信任層的四個核心論點，EU 2023/1542 的條文已經逐條處理掉，MOBI 也已經做出「SoH＋可驗證憑證＋區塊鏈」的 MVP。CBAM 多方傳遞鏈的「分配守恆」前提，和 CBAM 以設施期間平均值計算排放的方法互相衝突，而 CBAM Registry 預計 2027 年開放業者之間直接分享前驅物資料。再生料質量守恆帳本，Circularise 和 SAP GreenToken 幾年前就做過，ProPublica 揭露的問題出在分配規則，不是資料被竄改。三題各自還剩一條窄縫，但這些窄縫裡區塊鏈都不是非用不可。撞題方面，〔推論〕804 名報名者估計會交出 100 到 250 件作品，其中碳權驗證或交易平台約 30 到 60 件，P2P 售電或綠電憑證約 20 到 40 件，溯源、DPP 或回收約 15 到 35 件。F-gas 冷媒、Article 6、質量守恆、SAF、逐時匹配這幾個題目，在可查到的黑客松展示區裡**一件前例都沒有**。我們重新驗證了七個新候選題，結果和使用者的判讀一致。**主推薦是「HFC 冷媒跨境、跨註冊處的質量對帳帳本」**，理由是它的痛點有量化證據：日本 2024 年在設備報廢階段就逸散了 12.62 MtCO₂e，歐盟非法 HFC 查扣量一年增加約 2.7 倍。它也有一個實體守恆量：一公斤冷媒不會憑空多出來。現有系統各管一段，沒有人負責核對各段的公斤數是否相符。區塊鏈只在跨國、跨註冊處的情境才必要，單一國家內用資料庫就夠了，這一點要在簡報裡主動講清楚，而不是藏起來。**備案是「土耳其掩埋場甲烷多重宣稱對帳」**。這題和 COP31 主辦國的關聯最緊密，但它要解的雙重宣稱目前沒有任何文件化的案例，區塊鏈的必要性也只有部分成立，所以排在第二。

> 閱讀說明：附有來源連結的敘述屬於證據。標示〔推論〕的段落或句子，是根據證據所做的判斷、設計或估算。評分表、解法架構、Demo 情境、影響力推估都屬於推論。本報告取代前一份報告的選題建議，可以獨立閱讀。

## 一、反思與更正：原三題各自錯在哪裡，還剩什麼窄縫

### 電池護照信任層：要解決的問題，大多已經被法規條文處理掉

前一份報告推薦電池護照，有四個理由：OEM 可能倒閉導致資料遺失；EU 登錄系統只存識別碼；二手買家拿到的 SoH 是賣方自報；電池生命週期長且跨多個擁有者，所以區塊鏈「必要性最乾淨」。這四點逐一查證後幾乎都站不住。**SoH 本來就是護照的強制欄位**：Annex XIII 第 4 點把健康度、電池狀態（原始、再利用、再製造、廢棄）和使用數據列為限「正當利益者」存取的內容（[gesetze.legal Annex XIII](https://gesetze.legal/eu/vo_eu_2023_1542/anhang_xiii)）。**Art. 78(e) 規定，即使負責業者停業或退出歐盟，護照仍須持續可取得**；Art. 78(g) 要求確保資料的真實性、可靠性與完整性（[gesetze.legal Art. 78](https://gesetze.legal/eu/vo_eu_2023_1542/78)）。ESPR 另外要求由獨立的 DPP 服務商保存備份（[Glass for Europe](https://glassforeurope.com/wp-content/uploads/2025/07/GfE_Final_ECConsultation_DPPServiceProviders.pdf)）。電池被再利用或再製造時，Art. 77(7) 要求簽發一份**連結到原護照的新護照**（[gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77)），所以「換手後歷史紀錄斷掉」這個問題在法律上已經有解。Art. 14 則賦予合法購買者隨時讀取 BMS 中 SoH 參數的權利（[gesetze.legal Art. 14](https://gesetze.legal/eu/vo_eu_2023_1542/14)）。登錄系統只存識別碼，是去中心化 DPP 的刻意設計，不是漏洞。信任錨點也已經選定：業者必須以 eIDAS 合格電子印鑑完成驗證（[Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/)）。

市場端同樣已經有人在做。Aviloo 提供經 TÜV 認證的 SoH 證書，可用 QR 驗證（[Aviloo](https://aviloo.com/en/aviloo-certified)）；TÜV Rheinland 和 TWAICE 合資的 Battery Quick Check 也提供獨立於 OEM 的 SoH 報告（[TÜV Rheinland](https://www.tuv.com/press/en/press-releases/used-electric-cars-battery-quick-check-as-a-new-service-for-the-independent-evaluation-of-traction-batteries.html)）。最致命的是 MOBI：它已經有 Battery SOH Standard，用區塊鏈 ITN 當身分信任錨點，用 Citopia 可驗證憑證做點對點 SoH 分享，還做了所有權追蹤（[MOBI Battery Passport](https://dlt.mobi/battery-passport)；[MOBI Track-and-Trace](https://dlt.mobi/battery-trackandtrace/)）。這幾乎就是前一份報告提出的架構，只少了 AI 預言機。「SoH 不可信卡住二次利用」這個說法也誇大了。CEPS 列出的主要障礙是責任歸屬不明、再利用成本高、電池包難拆解（[CEPS](https://cdn.ceps.eu/2026/05/2026-05-ERCC-second-life-batteries-applications.pdf)）；2024 年中國新電芯價格跌到每 kWh 30 到 50 美元，二手電池很難提供有吸引力的折扣（[The Energyst](https://theenergyst.com/the-truth-behind-second-life-batteries-why-reuse-is-lagging-behind/)）。

〔推論〕還剩下的窄縫是「可重現、可爭議的多估算者 SoH 宣稱層」。現在 SoH 由負責業者寫一個數字，認證商給的是專有演算法的結果，第三方無法重跑，也無法比較不同模型的估計。另外，Art. 77(9) 規定的受限資料存取實施法案已經逾期（[Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/)），所以「正當利益者憑證」的流程還是空白。LMT 與電動自行車電池目前也沒找到 SoH 認證商。但這條窄縫裡，透明日誌或 eIDAS 合格時間戳都能做到大部分功能，區塊鏈的必要性降到中等。MOBI 2024 年 12 月發布的 SoH 標示與認證白皮書，可能已經處理了演算法驗證，這份文件沒有讀到全文，所以這條窄縫隨時可能被證明不存在。

### CBAM 多方傳遞鏈：前提和 CBAM 的計算方法衝突

前一份報告的核心論點是：「沒有機制能防止上游把同一批低碳鋼的排放屬性重複分配給多個下游客戶」。這個說法和 CBAM 本身的方法學衝突。CBAM 計算單一產品的嵌入排放，是把設施某一生產流程的歸屬排放，除以申報期間的產量（SEE = AttrEm / AL）（[European Commission](https://climate.ec.europa.eu/system/files/2023-01/2022122_p1b_en.pdf)）。結果是**同一期間的每一噸產品都適用同一個平均值，法律上不存在「把低碳部分分給特定客戶」的空間**。只要有一位熟悉 CBAM 的評審，這個漏洞就會被當場指出。所謂「分配重複」的爭議，實際上發生在自願性的綠鋼宣稱裡，例如 mass balance 與 XCarb 這類證書。這個領域的公民團體要的是取消這類宣稱或要求實體隔離（[SteelWatch 公開信](https://steelwatch.org/wp-content/uploads/2025/06/Final-_-CSO-open-letter-on-mass-balance-greenwashing-updated-20250609-new.pdf)），不是把帳記得更好。

「多層傳遞資料」這部分也已經商品化。CarbonChain、CBAMBOO、CoZero、SAP／PwC、TSC 都提供供應商資料徵集功能（[Coolset](https://www.coolset.com/academy/top-cbam-software-tools)）。Siemens 從 2021 年起就用分散式帳本加可驗證憑證做 PCF 交換（[Siemens](https://press.siemens.com/global/en/pressrelease/siemens-has-developed-ecosystem-based-approach-exchange-emission-data)）。最直接的打擊是官方指引：非歐盟業者可以在 CBAM Registry 上傳一次設施資料，經查證後供所有進口申報人使用，而且「**2027 年 CBAM Registry 將擴充為可與使用你產品作為前驅物的其他業者分享排放資料**」（[Guidance No. 2](https://trungtamwto.vn/download/24374/guidance-no.-2--quick-guide-for-non-eu-operators-on-cbam-implementation.pdf)）。另外，Omnibus 設下每年 50 噸的門檻，約九成進口商因此被排除在外（[EY](https://www.ey.com/en_gl/technical/tax-alerts/eu-adopts-cbam-omnibus-regulation)）；下游擴充提案也允許下游產品直接採用預設值（[Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2026/10/eus-cbam-downstream-extension-and-anti-circumvention-amendments-the-road-to-trilogue)）。黑客松端已經有 CarbonLot、C-PASS、CarbonCast 等 CBAM 作品（[glama.ai](https://glama.ai/mcp/servers/toi59fm59g)；[GitHub CarbonCast](https://github.com/soccz/CBAM)）。

〔推論〕還剩下的窄縫有兩條。第一條是「查證報告重用額度」：一份經查證的設施報告被多個申報人或下游前驅物使用者引用時，引用的總噸數不能超過該設施的實際產量，目的是防止把骯髒設施的產品掛在乾淨設施的報告下洗白。第二條是用 AI 協助台灣約 2,200 家年出口不到 50 噸、但仍須提供資料給貿易商的中小企業，彙整第二、三層的資料（[Reccessary](https://www.reccessary.com/zh-tw/news/MOENV-and-MOEA-CBAM-Section)）。不過第一條隨時可能由 CBAM Registry 自己補上，區塊鏈的必要性偏弱。

### 再生料質量守恆帳本：別人已經做過，而且病因出在規則

前一份報告提出「智慧合約強制投入 ≥ 產出 × 再生比例，並禁止自由分配」。這個模式早有先例。2022 年 Circularise 和 ISCC 找了 10 家大廠做試點，在公鏈上用智慧合約「儲存餘額、記錄交易、套用 mass balance 規則」，讓宣稱證明「幾乎不可能被重複使用」（[Circularise](https://www.circularise.com/press-releases/iscc-and-circularise-pilot-blockchain-technology/)）。SAP GreenToken 把 mass balance 物料代幣化（100 kg = 100 個代幣，綠色代幣與傳統代幣分開），支援 ISCC 與 REDcert（[SAP News](https://news.sap.com/2023/07/greentoken-traceability-transparency-plastics/?amp=1)）。TextileGenesis 依實際出貨量發行 Fibercoin（[Textile World](https://www.textileworld.com/textile-world/fiber-world/2020/11/lenzing-creates-unprecedented-supply-chain-traceability-incorporating-lenzing-e-branding-fabric-certificates-and-blockchain-enabled-traceability-platform-powered-by-textilegenesis/)）。前一份報告用來當動機的 ProPublica 發現，其實是 mass balance 在「自由分配」規則下照設計運作的結果，不是帳本被竄改（[ProPublica](https://www.propublica.org/article/epa-rejects-mass-balance-plastics-recycling-safer-choice)）。即使帳本完美守恆，只要規則允許自由分配，照樣會產生「30% 再生」但實際含量不到 0.1% 的杯子。修正方式是改規則。EU 在 2026 年 2 月通過化學回收 PET 的實施決定，採燃料排除法，並禁止跨設施、跨公司重新分配（[S&P Global](https://www.spglobal.com/energy/en/news-research/latest-news/chemicals/020926-eu-approves-targets-for-chemical-recycling-content-for-plastic-bottles)）。美國 EPA 的 Safer Choice 則要求依重量計算（[ProPublica](https://www.propublica.org/article/epa-rejects-mass-balance-plastics-recycling-safer-choice)）。真正有文件記載的資料完整性問題，是進口原生塑膠被標成再生料。歐盟委員會的對策是加強文件、分開海關代碼、稽核境外工廠、實驗室抽測（[Circular Online](https://www.circularonline.co.uk/news/eu-plans-tighter-checks-on-plastic-imports-to-support-recycling-industry/)）。這是預言機問題，智慧合約本身解決不了。在土耳其，國家押瓶制度 DOA 已於 2026-07-01 全國上線，附數位追蹤（[CNBC-e](https://www.cnbce.com/haberler/depozitosu-olan-ambalajlar-uygulamasi-1-temmuzda-basliyor-depozito-bilgi-yonetim-sistemi-dbys-nedir-h29643)），做寶特瓶帳本等於重複政府已有的基礎設施。

〔推論〕還剩下的窄縫是「產率合理性加實驗室證據閘門」：只有在地磅或海關的進料噸數、AI 的製程產率合理性檢查、抽樣檢驗結果三者一致時，才允許發行再生料額度，並可切換不同規則集來比較結果。但這條窄縫的價值在證據閘門與規則透明化，不在區塊鏈。評審很可能把它看成「Circularise 加一個異常偵測模型」。

### 三題犯了同一個錯：把「守恆」套到法規已經處理、或根本不適用的地方

| 原推薦 | 前報告的核心主張 | 反證 | 剩下的窄縫 | 判定 |
|---|---|---|---|---|
| 電池護照＋AI SoH | OEM 倒閉、只存 ID、SoH 不可信，所以區塊鏈必要性最高 | Annex XIII(4)、Art. 77(7)、78(e)(g)、Art. 14、eIDAS；Aviloo、TÜV/TWAICE；MOBI | 可重現的多估算者 SoH 宣稱與爭議層；Art. 77(9) 正當利益者憑證；LMT | 降為備選，區塊鏈必要性中等 |
| CBAM 傳遞鏈 | 防止同一批低碳鋼被重複分配 | SEE 是期間平均值；CBAM Registry 2027 年開放前驅物分享；至少 5 套 SaaS 與 Estainium | 查證報告重用的噸數上限；中小企業資料彙整 | 淘汰，前提錯誤 |
| 再生料守恆 | 智慧合約強制守恆、禁止自由分配 | Circularise＋ISCC、SAP GreenToken、TextileGenesis、EU UDB；ProPublica 案屬規則問題 | 產率合理性加實驗室證據閘門 | 淘汰，先例已有，病因不對 |

〔推論〕三題的共同錯誤是：「守恆約束＋多方互不信任」這個篩選原則本身沒錯，但前一份報告沒有先讀完法規條文和既有方案，就給區塊鏈必要性打了 4 到 5 分。CBAM 的「守恆量」是被法律平均掉的會計屬性，不是實體量。再生料的守恆已經有人在鏈上強制執行，而且真正的病灶在規則。電池的連續性與完整性，法規已經指定由 eIDAS 和服務商備份負責。下一個題目必須同時通過三道檢查：守恆的對象是**實體量**；造假發生在**分屬不同主管機關的段落之間的縫隙**；目前**沒有任何單一機構**負責把這些段落對起來。

## 二、撞題地圖：八百名報名者會做什麼，哪裡幾乎沒人

主辦方在 Devpost 頁面上列出了每個賽道的建議作品，內容幾乎和既有展示區最擁擠的主題一一對應。碳市場賽道列了「區塊鏈碳權驗證」「防止重複計算的智慧合約」「透明碳交易平台」；能源賽道列了「P2P 能源交易」「再生能源憑證追蹤」；供應鏈賽道列了「數位產品護照」「回收溯源」；數據賽道列了「IoT 環境監測」「氣候數據市集」（[ClimateChain Devpost](https://ieee-climatechain-hack.devpost.com/)）。作品展示區目前尚未公開（[ClimateChain gallery](https://ieee-climatechain-hack.devpost.com/project-gallery)），所以無法直接看到別隊在做什麼。研究者抽樣了約 199 筆 Devpost 專案（去重後約 120 件氣候相關作品），統計結果如下：碳權驗證、代幣化與交易平台約佔 18 到 20%，個人或中小企業碳足跡追蹤加代幣約佔 14%，再生能源與 P2P 售電約佔 15%，泛用供應鏈溯源與回收代幣各約佔 10%。光是「碳權 區塊鏈」一個關鍵字，Devpost 就回傳 279 筆結果（[Devpost search](https://devpost.com/software/search?query=carbon%20credit%20blockchain)）。「AI＋衛星（Sentinel-2）＋鏈上碳權」已經自成一個飽和的子類型，CanopyProof、Bluereach AI、Proof of Carbon 等作品都出現在同一頁搜尋結果裡（[CanopyProof](https://devpost.com/software/canopyproof-lwsvz4)）。

| 主題類別 | 〔推論〕ClimateChain 估計件數 | 依據 |
|---|---|---|
| 碳權驗證、登錄、MRV、交易市集（含「防重複計算」） | 約 30–60 件 | 樣本佔比約 20%，加上主辦方在題目說明中直接點名 |
| P2P 售電、綠電憑證、代幣化綠能激勵 | 約 20–40 件 | 樣本佔比約 15%，加上主辦方建議 |
| 溯源、DPP、回收追蹤或回收獎勵代幣 | 約 15–35 件 | 樣本中各約 10%，加上主辦方建議 |
| 碳足跡追蹤加代幣獎勵 | 約 15–30 件 | 樣本佔比約 14% |
| 總投件數 | 約 100–250 件 | 804 名報名者，每隊 2–5 人，扣除未交件 |

上表所有數字都是估計，不是實際計數。樣本只抓到每個查詢的第一頁，Devpost 隨後就限流了。

利基題目方面，研究者在 Devpost 抽樣、ETHGlobal 標題搜尋與網路搜尋中，**都沒有找到 CBAM 黑客松作品（Devpost 範圍內）、Article 6 相應調整、F-gas 冷媒監管鏈、再生料質量守恆、SAF 或海運燃料的 book-and-claim、逐時 24/7 匹配**（[ETHGlobal q=methane](https://ethglobal.com/showcase?q=methane)；[learntechnique F-gas](https://learntechnique.com/blog/f-gas-tracking-goes-mobile)）。CBAM 在其他平台倒是至少找到 3 件（[glama.ai CarbonLot](https://glama.ai/mcp/servers/toi59fm59g)）。電池護照找到約 1 件（[BPLIS](https://devpost.com/software/battery-passport-lifecycle-intelligence-system-bplis)），衛星甲烷找到 1 件（[PLUME](https://devpost.com/software/plume-earth-s-first-climate-bug-bounty-network)），掩埋與有機廢棄物甲烷有 1 件相鄰的 Hedera 得獎作品 Nodebility（[Hedera Origins](https://hedera.com/blog/these-are-the-winners-of-the-hello-future-origins-hackathon)）。押瓶系統在幾年內累積了 4 到 5 件（[RecyCan](https://ethglobal.com/showcase/recycan-9cfmh)）。「防止重複計算」本身是例外：市場上它算利基，但主辦方直接點名了，Claimcheck、Carbonyx 等作品也已經存在（[Claimcheck](https://devpost.com/software/claimcheck-spe2mn)），所以在 ClimateChain 應視為飽和題。

〔推論〕回頭看原本三題的撞題風險。電池護照落在主辦方建議的「DPP」框架裡，可能有數隊做泛用 DPP；評審團隊負責人本身就經營 DPP 公司，對這類作品的標準會特別高。再生料踩進「回收溯源」這個高撞題區。CBAM 的黑客松撞題風險低，但商用產品已經飽和。新的主推薦 F-gas 冷媒，是唯一同時做到「黑客松零前例」又「有實體守恆量」的題目。不過展示區沒找到前例，不代表全世界沒人想過。紐西蘭 CCCANZ 在 2023 年就有一個以區塊鏈為核心的 F-gas 協作計畫入圍業界獎項（[HVACR News](https://hvacrnews.com.au/news/blockchain-refrigerant-tracking-tool-in-line-for-award/)）。所以新穎性的主張只能限縮在「跨組織質量守恆與跨註冊處唯一性」，不能說成「第一個區塊鏈冷媒追蹤」。

另外要注意：獎項是全場排名，不是分賽道頒發（[ClimateChain Devpost](https://ieee-climatechain-hack.devpost.com/)）。在 Hedera、Chainlink 這類贊助型黑客松，氣候類冠軍的共同點是把鏈上邏輯綁在一個具體、可驗證的實體事件上，例如一次充電、一批沼氣、一張 REC（[Hedera Origins](https://hedera.com/blog/these-are-the-winners-of-the-hello-future-origins-hackathon)；[Chainlink Spring 2023](https://blog.chain.link/spring-2023-hackathon-winners)）。〔推論〕「一次經簽章秤重的冷媒回收」正好就是這種事件。

## 三、新候選題的反向驗證判決：七題中只有兩題過關

**F-gas 冷媒跨境質量對帳：通過，但範圍要縮窄。** 完整的生命週期帳本（從進口商一路到銷毀）不成立，因為每一段都已經有系統：EU F-gas Portal 加 CERTEX 管進口端的配額與許可，義大利 Banca Dati 管技師作業紀錄，法國 Trackdéchets 管回收廢冷媒的流向，日本 RaMS 甚至是法定的全生命週期系統，Recoolit 也已經用照片、GPS 和實驗室檢驗追蹤每一步。縮窄後還成立的版本是：**跨組織、跨註冊處的質量守恆與來源證明層**，專門讓兩種造假在結構上變得困難。第一種是原生或非法 HFC 被洗成「再生」或「回收」冷媒；第二種是同一公斤的銷毀量被重複計入碳權，或在沒有設備來源鏈的情況下取得碳權。區塊鏈只在跨境（例如土耳其到歐盟）、跨碳權註冊處、或競爭的再生業者之間才有必要。研究者的評估是：需求高、差異化中等、跨境與碳權完整性框架下的區塊鏈適配度中高（[EIA 經 refindustry](https://refindustry.com/news/eia-report-tracks-illegal-hfc-trade-into-eu-supply-chains/)；[Isometric](https://isometric.com/writing-articles/a-new-protocol-for-destroying-hydrofluorocarbons-and-ozone-depleting-substances)）。SF₆ 開關設備在土耳其同樣要登錄 EKOMVET（[ÇŞİDB](https://webdosya.csb.gov.tr/db/ozonturkiye/haberler/1.-florlu-sera-gazlarina-il-sk-n-yonetmel-k-20250627154853.pdf)），美國 EPA 的盤查可能低估 SF₆ 達 250%（[NOAA CPO](https://cpo.noaa.gov/?p=1663)），所以 SF₆ 適合當作第二種氣體併入本題，不必獨立成題。

**土耳其掩埋場廢棄物甲烷多重宣稱對帳：受傷但存活。** 有兩個攻擊點成立。第一，衛星看到的煙流不能拿來否定以計量方式核發的銷毀碳權，兩者計算的是不同的東西。第二，「觀測加模型融合」RMI 的 WasteMAP 已經做了（[RMI WasteMAP](https://rmi.org/introducing-wastemap-a-new-tool-to-track-and-reduce-waste-methane-emissions)）。存活下來的缺口是「場址—期間」層級的跨類別宣稱守恆，涵蓋自願碳權、新的 TR KDS Turkuaz 碳權、YEK-G／I-REC 電力屬性、市政零廢棄宣稱與國家盤查。雙重宣稱目前**沒有任何文件化案例**，YEK-G 與 I-REC 之間的重複核發也已經被土耳其的規則擋下（[Çakmak](https://cakmak.av.tr/en/article/renewable-energy-certificates)）。這題列為備案。

**甲烷警報問責追蹤器：作為區塊鏈題目基本上被否定。** IMEO 已經公布各國的回應率，IEA 與 IMEO 也發布了 MARS Response Blueprint，處理的正是同一套工作流程（[IEA](https://www.iea.org/reports/responding-to-satellite-notifications-from-the-methane-alert-and-response-system)）。前一份報告引用的「近九成沒有回應」是 2025 年的全球數字，IMEO 已經改用國家層級回應率，部分國家達到 100%（[CEOS IMEO slides](https://ceos.org/document_management/Working_Groups/WGClimate/Meetings/WGClimate%20GHG-TT-7/8.3_IrakulisLoitxate_IMEOEngagement_v1.pdf)）。區塊鏈在這題能提供的只是中立時間戳，用 OpenTimestamps 或單一雜湊錨點就夠了。〔推論〕這題適合當作備案裡的「證據時間軸」模組。

**UCO 與生質燃料原料造假：痛點最強，但區塊鏈多餘。** 歐盟委員會 2025 年審查德國的申訴後，認定認證稽核有「系統性弱點」，但無法確認造假（[European Commission](https://energy.ec.europa.eu/news/commission-concludes-examination-potential-chinese-biofuel-imports-fraud-2025-07-18_en)）。不過歐盟的 Union Database 本身就是為了防止重複宣稱而建的監管帳本（[EC UDB wiki](https://wikis.ec.europa.eu/display/UDBBIS/Union+Database+for+Biofuels+%28UDB%29+-+About)），再做一條鏈等於重複造輪子。這題和 COP31 的關聯也弱。

**震災廢棄物：在地共鳴強，但氣候量化太薄。** UNDP 估計土耳其 2023 年地震產生超過 1 億立方公尺的瓦礫，來自超過 31.3 萬棟損毀建築（[UNDP Türkiye](https://www.undp.org/turkiye/press-releases/undp-builds-two-model-facilities-process-and-recycle-earthquake-debris-turkiye)）。但減碳效益只有單一案例研究估計 27.5%（[MDPI Buildings](https://www.mdpi.com/2075-5309/14/4/948)）。區塊鏈的價值主要在石綿的監管鏈，政治上也敏感。

**SAF book-and-claim：缺口真實，但已經擁擠。** RSB、123Carbon、IATA 都在處理登錄處之間的互通（[SAF Investor](https://www.safinvestor.com/opinion/147370/123carbon/)），ICAO 也把登錄處之間的資料交換列為期望功能（[ICAO](https://www2023.icao.int/environmental-protection/Documents/EnvironmentalReports/2025/Envreport2025_52.pdf)）。黑客松端雖然沒有前例，但產業端已經有多個標準組織在推進。

**Bovaer 與畜牧 insetting：雙重宣稱結構說得通，但沒有找到任何文件化案例。** Elanco 自己承認甲烷減量的會計方式「有模糊之處」（[AgFunderNews](https://agfundernews.com/bovaer-is-creating-a-self-sustaining-carbon-inset-market-for-american-agriculture-says-elanco)），但找不到具名的受害者。

下表是〔推論〕性質的評分，每項 1 到 5 分。「撞題風險」與「既有方案覆蓋」兩欄已經反轉，**5 分代表撞題最少、缺口最大**，所以總分越高越好。原三題的縮窄版也列入比較。

| 題目 | 痛點證據強度 | 區塊鏈必要性 | AI 實質價值 | 撞題風險（5=最低） | COP31／主辦國／評審契合 | 既有方案覆蓋（5=缺口最大） | 總分 |
|---|---|---|---|---|---|---|---|
| **F-gas 冷媒跨境跨註冊處質量對帳** | 5 | 4 | 4 | 5 | 4 | 3 | **25** |
| **土耳其廢棄物甲烷多重宣稱對帳** | 3 | 3 | 4 | 4 | 5 | 3 | **22** |
| UCO／生質燃料原料驗證層 | 5 | 2 | 4 | 5 | 2 | 2 | 20 |
| 電池 SoH 可重現爭議層（原題縮窄） | 3 | 3 | 4 | 3 | 5 | 2 | 20 |
| 震災廢棄物與石綿監管鏈 | 3 | 2 | 2 | 5 | 3 | 4 | 19 |
| CBAM 查證報告重用額度（原題縮窄） | 3 | 2 | 3 | 4 | 4 | 2 | 18 |
| 甲烷警報問責追蹤器 | 3 | 1 | 3 | 4 | 4 | 2 | 17 |
| 再生料產率與證據閘門（原題縮窄） | 3 | 2 | 3 | 3 | 4 | 2 | 17 |
| Bovaer／畜牧 insetting | 2 | 3 | 2 | 5 | 2 | 3 | 17 |
| SAF book-and-claim | 3 | 3 | 2 | 5 | 2 | 1 | 16 |

甲烷題的「痛點證據強度」只給 3 分，原因要說明。超級排放源本身證據非常強，但這個工具要解決的「多重宣稱」目前只是一個前瞻性風險。F-gas 的「COP31 契合」給 4 分而不是 5 分，因為超級污染物是「通往 COP31 的實施支柱」，但沒有找到 COP31 正式議程中的 HFC 項目（[CCAC](https://www.ccacoalition.org/news/global-leaders-unite-london-accelerate-action-super-pollutants-ahead-cop31)）。〔推論〕這份評分和使用者的判讀一致。唯一需要補充的是：如果團隊把「主辦國共鳴」看得比「證據強度」更重，甲烷題和 F-gas 的差距會縮小。但甲烷題的區塊鏈論證有 CAD Trust 這個現成的對照組，F-gas 沒有，所以結論維持不變。

## 四、主推薦：HFC 冷媒跨境、跨註冊處質量對帳帳本

### 專案名稱與一句話問題

〔推論〕建議名稱是 **「Kigali Balance：跨境、跨註冊處的 HFC 冷媒公斤對帳帳本」**，備選名稱為「KiloTrace」或「冷媒公斤帳」。英文標語可用「HFC fraud lives in the gaps between registries. We make the kilograms add up across them.」。Devpost 表單沒有賽道選項（[Devpost forum](https://ieee-climatechain-hack.devpost.com/forum_topics/45102-session-1-recording-and-clarification-on-submission-window)），所以標題要直接寫「Track 3 Sustainable Supply Chains（兼 Track 1）」。主賽道選三，是因為核心是實體商品的監管鏈和「再生」這個永續宣稱；第二賽道選一，是因為銷毀碳權的重複計算正好對上賽道一的問題描述。

**一句話問題陳述**：每個國家都已經把 HFC 生命週期的「某一段」數位化，例如海關配額、技師日誌、廢冷媒聯單，但沒有人核對這些段落的公斤數是否相符。於是走私的原生冷媒被當成「再生」冷媒賣出，洩漏藏在沒有對帳的補充灌注裡，同一噸被銷毀的超級污染物也可能被兩個碳權註冊處各算一次。

### 背景與現況：一個只會漏、不會憑空增加的守恆量

HFC 冷媒是超級污染物。CCAC 指出，甲烷、黑碳、HFC 等超級污染物造成目前約一半的暖化（[CCAC](https://www.ccacoalition.org/news/global-leaders-unite-london-accelerate-action-super-pollutants-ahead-cop31)）。全球設備與庫存中的 ODS／HFC「庫存量（banks）」估計約 **13–24 GtCO₂e**（[EIA 2026](https://eia-international.org/wp-content/uploads/2026-EIA-Evaluating-Options-for-Sustainably-Financed-Action-on-ODS-and-HFC-Banks.pdf)）。TEAP 2024 估計，生命週期冷媒管理在 2025 到 2050 年間可額外避免 **39 GtCO₂e**（[refindustry 引 UNEP 指南](https://refindustry.com/news/unep-releases-guide-for-national-refrigerant-lifecycle-plans/)）。Project Drawdown 估計冷媒管理在 2020 到 2050 年間可避免 57.15 GtCO₂e，但淨成本約 6,230 億美元（[Drawdown](https://drawdown.org/solutions/refrigerant-management)）。〔推論〕回收與銷毀的成本高於轉售收入，代表這件事需要有人付錢，例如碳權、EPR 或再生冷媒溢價。一旦有人付錢，就會出現假造「回收公斤數」的誘因。

日本是最好的對照組，因為它是全世界管得最嚴的國家。日本從 2001 年起就有法定的生命週期制度，指定 JRECO 營運 RaMS，以電子方式處理行程管理票，每筆登錄收費 100 日圓（[JRECO RaMS](https://www.jreco.or.jp/data/rams_gaiyo2024.pdf)）。即便如此，2024 年報廢時設備中殘留的 12,011 噸 HFC 只回收了 5,188 噸（約 43%），**報廢階段逸散 6,878 噸，相當於 12.62 MtCO₂e**。更驚人的是：使用階段的盤查估計排放是 6,283 噸，業者自行申報的洩漏量卻只有 575 噸，**低報超過 10 倍**（[MOEJ OEWG48 簡報](https://www.jraia.or.jp/english/relations/file/260724_oewg48_sideevent_moej_presentation.pdf)）。日本 2024 年 HFC 排放約 27.6 MtCO₂e，比 2013 年高 25%，而 2030 年的目標是 8.93 Mt（[MOEJ](https://www.jraia.or.jp/english/relations/file/260724_oewg48_sideevent_moej_presentation.pdf)）。日本學者已經公開提議「冷媒碳權」與「整合式溯源資料管理」（[IIR](https://iifiir.org/en/news/japan-explores-policy-and-digital-tools-for-a-refrigerant-circular-economy)）。

歐洲的問題是非法貿易。EU 2024/573 從 2025-03-03 起要求海關透過 CERTEX 與 F-gas Portal 交換通關資料，在放行前檢查配額或授權（[fluorocarbons.org](https://www.fluorocarbons.org/illegal-hfcs/regulation/)）。但通報的查扣量從 2023 年約 250 噸增加到 2024 年約 670 噸，**約為 2.7 倍**；義大利 2024 年查扣近 500 噸，是查扣量最高的成員國。EIA 列出的造假手法包括：把原生高 GWP 冷媒標成再生、超額進口、偽造發票、逃漏增值稅、仿冒低 GWP 混合冷媒。自配額削減開始以來，HFC 價格上漲約十倍（[refindustry 引 EIA](https://refindustry.com/news/eia-report-tracks-illegal-hfc-trade-into-eu-supply-chains/)）。業界協會宣稱義大利市場**近半數冷媒是非法的**，但這是**產業協會的說法**，EIA 研究員本人也表示規模很難估計（[ACR Journal](https://www.acrjournal.uk/news/organised-crime-allegedly-supplies-illegal-refrigerants-to-major-itali)）。此外，查扣量上升有一部分反映的是執法力度增加。2027 年歐盟的供應量還會再減 50%（[ACR Journal](https://www.acrjournal.uk/news/organised-crime-allegedly-supplies-illegal-refrigerants-to-major-itali)），〔推論〕走私的價差誘因只會更大。

碳權端則是剛剛開張的新市場。Verra VM0016 v2.0 於 2025-12-12 生效，Verra 稱之為第一個針對特定來源 HFC 銷毀的碳權方法學，適用於包括 Article 5 國家在內的所有蒙特婁議定書締約方（[Verra](https://verra.org/verra-releases-revised-methodology-for-the-destruction-of-ozone-depleting-substances-and-hydrofluorocarbons/)）。Isometric 的 HFC 與 ODS 回收銷毀協議 v1.0 於 2026-05-14 通過認證，要求**每個容器都以校正過的秤秤重、做成分抽樣、從收件到銷毀全程監管鏈追蹤，並達到 99.99% 的破壞去除率**；第一家供應商是 Recoolit（[Isometric](https://isometric.com/writing-articles/a-new-protocol-for-destroying-hydrofluorocarbons-and-ozone-depleting-substances)）。ACR 也有國際 ODS 方法學（[ACR](https://acrcarbon.org/methodology/destruction-of-ozone-depleting-substances-from-international-sources/)）。台灣環境部則在 2026-07-22 審查了「廢棄含氟氣體回收與銷毀」的減量方法學草案（[公視](https://news.pts.org.tw/article/818802)）。這個市場有歷史包袱：CDM 時代，約 2,000 個專案中只有 19 個 HFC-23 專案，卻拿走了當時 4.75 億單位碳權中的一半以上，還出現為了賺碳權而刻意增產的反向誘因（[Carbon Market Watch](https://carbonmarketwatch.org/wp-content/uploads/2010/06/hfc-23_background-information_gaming-and-abuse-of-cdm.pdf)）。EIA 至今仍反對用碳交易支付銷毀，警告會造成「不當管理與會計」（[EIA 2024 簡報](https://eia-international.org/wp-content/uploads/EIA-Briefing_OEWG46_July-2024_Carbon-credits.pdf)）。

〔推論〕用一個數字說明造假誘因有多大。日本報廢逸散量的平均暖化潛勢約為 12.62 MtCO₂e ÷ 6,878 噸，約等於每公斤 1.8 噸 CO₂e。Recoolit 的碳權直售價約每單位 75 美元，付給技師的回收獎勵約每公斤 3 美元（[Malay Mail/AFP](https://malaymail.com/news/life/2025/07/11/in-indonesia-a-start-up-captures-air-conditioning-coolants-to-stop-global-warming/183487)）。如果套用日本的平均值，一公斤銷毀冷媒在碳權市場的價值約 135 美元，是技師獎勵的 40 倍以上。這個計算只是示意，實際氣體的 GWP 不同，算出來的數字也會不同。但它說明了一件事：只要能把一公斤原生或庫存冷媒偽裝成「從報廢設備回收」，報酬就非常可觀。

### 痛點與受害者：具名的使用者

受害者有名有姓。EIA 調查指出，非法 HFC 經由組織犯罪網絡流入義大利的製造業、超市與國鐵供應鏈，每年讓合法供應商損失數億歐元（[EIA](https://eia-international.org/news/we-expose-illegal-refrigerant-trade-in-europe-the-biggest-eco-crime-no-ones-heard-of/)）。義大利在 2026 年 1 月由環境部、海關與憲兵隊共同成立常設的 F-gas 圓桌會議（[refindustry](https://refindustry.com/news/eia-report-tracks-illegal-hfc-trade-into-eu-supply-chains/)），等於主管機關自己承認現行系統不夠。土耳其是 EIA 報告中點名的來源之一：非法 HFC 主要來自土耳其與中國，經保加利亞轉往希臘、德國、法國、義大利等地（[EIA](https://eia-international.org/report/more-chilling-than-ever/)）。保加利亞在 Kapitan Andreevo 邊境查獲 490 公斤裝在違規拋棄式鋼瓶裡的 R-134a／R-404A（[Cooling Post](https://coolingpost.com/world-news/bulgarians-seize-500kg-of-illegal-refrigerant)），也曾在一輛土耳其籍卡車上查獲 1,123.2 公斤（[Cooling Post](https://coolingpost.com/world-news/bulgarian-customs-seize-over-a-tonne-of-illegal-hfcs)）。〔推論〕從土耳其的角度看，最大的受害者是**持有 FARAVET 配額、守法的土耳其進口商與再生業者**。他們的貨物會因為整個來源國被懷疑而被額外盤查。這也是面對土耳其評審時應採用的敘事角度（見下方「評審質疑」）。

〔推論〕Demo 的主要使用者建議鎖定兩種。第一種是**國家臭氧單位或海關／市場監督人員**，例如土耳其環境部臭氧單位，或義大利圓桌會議成員。他們需要把配額支撐的進口量、經銷商銷售量和技師灌注量對起來。第二種是**銷毀碳權的查證機構、註冊處與企業買家**。他們需要證明每一公斤被銷毀的冷媒都來自報廢設備，而不是原生庫存，而且沒有在別的註冊處被算過。次要使用者是想替「可證明的再生冷媒」爭取溢價的再生業者。EU 對依 Art. 12 標示的再生冷媒提供維修禁令延後到 2030 年的豁免（[Castel](https://castel.it/wp-content/uploads/2024/03/2024_NEW_F_GAS_Regulation_Castel.pdf)），加州也有類似的再生冷媒豁免，要求依 AHRI 700 認證且純度達 99.5%（[A-Gas](https://www.agas.com/us/resources/penguin-certified-reclaimed-refrigerants/)）。這代表「再生」這個標籤有實際的經濟價值，也就有人想偽造它。技師**不應**當成主要使用者，因為他們承擔負擔卻得不到好處。美國 EPA 的 QR 鋼瓶追蹤規定就是在業界反對下被撤銷的。

### 既有系統：每一段都有人管，段與段之間沒人管

| 系統 | 做了什麼 | 缺了什麼 | 對本專案的意義 |
|---|---|---|---|
| EU F-gas Portal＋CERTEX | 登錄與許可、海關放行前檢查配額，自 2025-03-03 整合；2026 年 5 月起增加出口電子驗證（[Luxembourg customs](https://douanes.public.lu/content/dam/douanes/fr/prohibitions-restrictions/certex/certex-enforcement-fgas-regulation-eo-guidelines.pdf)；[Revenue.ie](https://www.revenue.ie/en/customs/businesses/electronic-systems/ais/ecustoms-notifications/2026/ecustoms-notification-05-2026.pdf)） | 只管到「首次投放市場」，下游經銷、灌注、回收、再生的公斤數不在範圍內；是否逐批扣減配額未確認 | 不要重做配額帳；把它當成「發行」時引用的錨點 |
| 義大利 Banca Dati F-gas | 自 2019-09-25 起，每次安裝、維修、檢漏、拆除都要在 30 天內上報（[CCIAA Firenze](https://www.fi.camcom.gov.it/sites/default/files/uploads/Registri_Albi_Certificazioni/Ambiente/Convegni_e_Seminari/Interventi_Fgas_FOCUS.pdf)） | 只管技師作業這一段；是否和經銷商銷售量交叉比對，沒有找到證據 | 義大利同時有 EU Portal 和強制電子資料庫，卻仍是查扣量最高的成員國；〔推論〕這說明再多一個數位孤島也沒用 |
| 法國 Trackdéchets（BSFF） | 自 2023-01-01 起，回收廢冷媒的追蹤聯單強制數位化，安裝商、運輸商、處理商都要登錄（[FFB](https://www.ffbatiment.fr/actualites-batiment/actualite-ba/suivi-des-dechets-dangereux-utiliser-trackdechets-est-desormais-obligatoire)） | 只管廢棄物流向，不連結配額支撐的供應量 | 匯入資料的來源之一 |
| 日本 RaMS／RaMS-ex | 法定資訊處理中心，負責灌注、回收紀錄與行程管理票的電子化（[JRECO](https://www.jreco.or.jp/data/rams_gaiyo2024.pdf)；[IIR](https://iifiir.org/en/news/japan-explores-policy-and-digital-tools-for-a-refrigerant-circular-economy)） | 單一國家、中央化；回收率卡在約 43%；申報洩漏與盤查估計相差 10 倍以上 | 證明「只記錄文書不會讓回收發生」；本專案補上的是異常偵測、價值訊號與跨國互通 |
| 土耳其 FARAVET／EKOMVET | FARAVET 管配額、進出口管制文件與年報；EKOMVET 管 5 tCO₂e 以上設備（以及 6 kg 以上 SF₆）的登錄與作業紀錄，只有持 MYK 證照的技師能登打（[ÇŞİDB](https://webdosya.csb.gov.tr/db/ozonturkiye/haberler/1.-florlu-sera-gazlarina-il-sk-n-yonetmel-k-20250627154853.pdf)；[ÇŞİDB 2026](https://webdosya.csb.gov.tr/v2/ozonturkiye/2026/02/stanbul_Servis_Y-netmelik_AON-20260213135940.pdf)） | 兩個系統彼此不相連，中間的經銷商銷售沒人管；廢 F-gas 管理通函還在草案階段（[iklim.gov.tr](https://iklim.gov.tr/db/turkce/icerikler/files/TASLAK%20ATIK%20FLORLU%20SERA%20GAZLARININ%20YONETIMINE%20ILISKIN%20GENELGE.pdf)） | 最適合的 Demo 場景：「把 FARAVET、EKOMVET 和報廢端連起來」，不是「從零開始數位化」 |
| 美國 EPA QR 鋼瓶追蹤 | 2021 年規定 2025 年起強制實施，2023 年被法院撤銷，2024 年正式移除（[Jones Day](https://www.jonesday.com/de/insights/2023/08/dc-circuit-vacates-part-of-the-epas-hfcs-phasedown-rule)；[HARDI](https://hardinet.org/posts/advocacy/epa-announces-plans-to-formally-withdraw-refillable-cylinder)） | 業界反彈，認為負擔太重 | 證明主管機關認為逐瓶追蹤值得強制；也提醒推廣必須靠拉力，不能只靠強制 |
| 商用鋼瓶追蹤（TrackAbout、Oxmaint、Beijer Ref、MSA、Refcom、A-Gas Gas-Trak） | 在單一公司內以序號、條碼或 RFID 追蹤鋼瓶（[Datacor](https://www.datacor.com/products/trackabout/refrigerants)；[MSA](https://emeablog.msasafety.com/article/refrigerant-tracking-and-compliance-software-an-overview-for-the-european-market-2/)） | 沒有跨組織的守恆約束 | 「追蹤每一支鋼瓶」本身不是差異化 |
| Recoolit（印尼） | App 追蹤每一步，照片、GPS 加馬來西亞實驗室檢驗；每公斤付技師約 3 美元；是 Isometric 第一家供應商（[Malay Mail](https://malaymail.com/news/life/2025/07/11/in-indonesia-a-start-up-captures-air-conditioning-coolants-to-stop-global-warming/183487)） | 單一營運者自己的系統，不處理跨註冊處的唯一性 | 「AI 看照片與檢驗報告」不是差異化 |
| Verra VM0016 v2.0、Isometric v1.0、ACR | 銷毀碳權方法學；Isometric 要求每個容器秤重、抽樣、全程監管鏈（[Verra](https://verra.org/methodologies/VM0016)；[Isometric](https://isometric.com/writing-articles/a-new-protocol-for-destroying-hydrofluorocarbons-and-ozone-depleting-substances)） | 各註冊處只管自己內部，彼此之間沒有容器層級的唯一性檢查 | Isometric 等於已經規定好了資料結構，本專案把它跨註冊處共享 |
| CCCANZ（紐西蘭）、ZHAW／Fair Recycling（巴西） | 2023 年以區塊鏈方法論做 F-gas 協作；以區塊鏈做 CFC 回收碳權的登錄與交易（[HVACR News](https://hvacrnews.com.au/news/blockchain-refrigerant-tracking-tool-in-line-for-award/)；[ZHAW](https://zhaw.ch/en/research/research-database/project-detailview/projektid/5084)） | 沒有公開技術細節，也不知道是否仍在運作 | 概念已有前例，新穎性只能主張「跨組織質量守恆＋跨註冊處唯一性」 |

〔推論〕把這張表從上往下讀，會看到一個規律：每個系統都由不同的主管機關或公司營運，各自守著一段。最值錢的造假，也就是把原生冷媒標成「再生」，剛好發生在段與段之間的縫隙。原因是再生冷媒的產出量，從來沒有被拿去和有文件的回收進料量核對。

### 我們的解法：實體錨點、區塊鏈、AI 各負責什麼

〔推論〕整體架構分三層，原則是「實體錨點負責讓資料接近真實，帳本負責讓各方的說法彼此一致，AI 負責找出一致但不合理的地方」。

**實體錨點層**負責把物理事件變成有簽章的資料。每支鋼瓶有一個簽章過的 QR 或 NFC 識別碼。在回收、再生廠進料與出料、銷毀廠收件這幾個關鍵監管交接點，都用帶裝置金鑰的校正秤秤重，秤重結果由秤直接簽章。成分檢驗報告由實驗室簽章，銷毀廠的破壞去除率證明由銷毀廠簽章。這些要求本來就是 Isometric 協議規定的內容（[Isometric](https://isometric.com/writing-articles/a-new-protocol-for-destroying-hydrofluorocarbons-and-ozone-depleting-substances)），所以是把既有規範要求的證據標準化，不是替使用者增加新負擔。技師與業者的身分，由 MYK 證照、F-gas 登錄號碼這類既有資格轉成可驗證憑證。原始文件放在鏈外，鏈上只存雜湊。

**帳本層**使用許可制聯盟鏈，例如 Hyperledger Fabric 或 Besu。節點由國家臭氧單位、碳權註冊處、產業公會、再生與銷毀業者營運。帳戶以「業者 × 氣體種類」為單位記錄公斤餘額，智慧合約強制執行五條規則。第一，**發行**時必須引用一份配額文件（FARAVET 或 F-gas Portal 文件的雜湊），或一筆有設備來源的回收事件，發行量不得超過所引用的額度。第二，**轉移**必須雙方共同簽署，賣方轉出量等於買方收到量。第三，**灌注與回收**要連結到設備識別碼，例如 EKOMVET 或 Banca Dati 的設備紀錄。第四，**再生產出**不得超過有文件的回收進料量扣除製程損耗。第五，**銷毀**只能銷毀自己持有的量；每筆銷毀事件會產生一個空值化標記（nullifier）＝ H(鋼瓶 ID, 秤重事件, 檢驗報告)，各碳權註冊處只要把這個標記貼上鏈，就能檢查同一個容器事件有沒有在別處被登記過，不需要交出自己的資料庫。這和 CAD Trust 串接各碳權註冊處的邏輯相同（[World Bank](https://ppp.worldbank.org/node/7165)）。各家的交易量屬於商業機密，所以只有主管機關能看到明細，公開層只顯示空值化標記和總量統計。

**AI 層**做三件和帳本緊密相關的事，輸出一律是「標記，交由人工複核」，不讓 AI 自動判定。第一件是**質量平衡異常偵測**：找出經銷商的銷售量超過配額支撐的進貨量（可利用模擬的帳外發票資料）、某台設備的累積補充灌注量超過銘牌充填量的某個比例（代表在漏），或再生業者的產率不合理。第二件是**申報洩漏與模型推估的落差**：依設備類型、年齡、充填量推估合理的洩漏量，再和申報值比較。日本 575 噸申報對 6,283 噸盤查估計的差距，就是這個模組的動機（[MOEJ](https://www.jraia.or.jp/english/relations/file/260724_oewg48_sideevent_moej_presentation.pdf)）。第三件是**檢驗報告一致性檢查**：比對成分結果和申報的氣體種類與來源。例如號稱「從報廢設備回收」的冷媒，純度卻像全新冷媒，就是一個值得複核的訊號，但這個判準本身需要再找文獻支持。物聯網洩漏預測只當作選配模組，因為日本已經在推連續洩漏監測，這部分不算新。

〔推論〕有兩件事不要做。一是不要宣稱「區塊鏈能驗證鋼瓶裡裝的是什麼」，它不能。二是不要把後量子簽章當成功能賣點。研究筆記找不到需要它的威脅模型，硬塞進去評審可能會覺得是在堆砌流行詞。比較好的做法是在威脅模型裡用一行說明「加密敏捷性與後量子遷移路徑」。

### 為什麼一定需要共享帳本：誠實的版本

〔推論〕在單一國家內，不需要區塊鏈。如果只有土耳其、只有義大利或只有日本，一個主管機關就能在一般資料庫裡做完全部的段落對帳。日本 RaMS 本身就是這種中央系統。所以團隊在簡報裡要主動講這句話：「在單一國家內，主管機關的資料庫是正確答案。」

需要共享帳本的情境只有三種，三種都符合「沒有一個各方都接受的第三方」這個判斷標準（[Wüst & Gervais](https://puma.ub.uni-stuttgart.de/bibtex/1d8fa99c6df50e1e371d7c2bc493945c7)）。第一種是**跨境**：歐盟買家或海關要確認一支來自土耳其的鋼瓶，是否真的能追溯到 FARAVET 配額支撐的進口，或有文件的回收。土耳其的資料庫管不到歐盟，歐盟的系統也管不到土耳其。第二種是**跨註冊處**：Verra、Isometric、ACR、台灣的自願減量機制，以及未來可能的 Article 6.4，彼此互不隸屬。CAD Trust 之所以存在，正是因為這個結構需要一層中立的共享狀態。第三種是**互相競爭的再生業者與經銷商**：沒有人願意讓競爭對手營運自己的帳。帳本在這裡的作用，是把守恆從「事後稽核」變成「寫入時的硬性約束」：只要轉出量和收到量對不上，交易就寫不進去。要說謊，必須讓多個彼此獨立的交易對手一起串通。〔推論〕這也能直接回應 TradeLens 的失敗教訓：競爭者不願把資料放在由某一家主導的平台上（[PierNext](https://piernext.portdebarcelona.cat/en/technology/the-closure-of-tradelens/)）。

### Demo 情境：5 個參與者、3 支鋼瓶、約 10 分鐘

| 步驟 | 參與者 | 動作 | 帳本規則或 AI 檢查 | 要展示的重點 |
|---|---|---|---|---|
| 1 | 土耳其進口商 | 依（模擬的）FARAVET 配額發行 100 kg R-404A，綁定已簽章的鋼瓶 ID | 發行時必須引用配額文件的雜湊，不得超過額度 | 不重做配額系統，只引用它 |
| 2 | 經銷商 A、B | A 轉 60 kg 給技師，接著試圖再賣 80 kg | 合約拒絕（守恆）；AI 標記經銷商 B 的帳外發票銷售量超過配額支撐的進貨量 | 規則擋下明顯的超賣，AI 抓出藏在帳外的超賣 |
| 3 | 技師、超市冷凍櫃 | 灌注設備，並在模擬的 3 年內多次補充灌注 | AI 標記累積補充量超過銘牌充填量 X% 的設備 | 呼應日本 575 噸申報對 6,283 噸估計的落差 |
| 4 | 回收技師 | 設備報廢，回收 8 kg 到回收鋼瓶，簽章秤重並附實驗室成分報告 | 回收事件連結到設備 ID，成為「有設備來源」的公斤 | 實體錨點：秤與實驗室的簽章 |
| 5 | 再生業者 | 試圖以「再生 R-404A」名義出售 20 kg，但有文件的回收進料只有 8 kg | 再生產出上限＝回收進料－損耗；多出的 12 kg 被標記為疑似原生冷媒洗白；歐盟買家掃碼查來源 | 本題的招牌畫面：洗白在縫隙中被抓到 |
| 6 | 銷毀廠（水泥窯）＋兩個模擬註冊處 | 銷毀 5 kg，產生銷毀代幣與空值化標記；另一家模擬註冊處（例如台灣自願減量機制）試圖登記同一事件 | 只有連結到設備來源回收與檢驗報告時才能產生銷毀代幣；第二次登記被拒 | 跨註冊處唯一性；Sankey 圖呈現各參與者的公斤平衡 |

〔推論〕截止時間是 2026-10-25 14:00 UTC（[Devpost](https://ieee-climatechain-hack.devpost.com/)），團隊只剩約 11 天。可行的範圍是：在測試網或本機 Besu／Fabric 上寫五條規則的合約、用 Python 對合成資料跑異常偵測、做一個 Sankey 儀表板。合成資料的參數可以依日本 MOEJ 的物質流數字設定，並且清楚標示為「模擬」。不要嘗試串接真實的 FARAVET 或 EKOMVET，那需要政府的存取權限。

### 對應賽道、法規、COP31 與台灣

賽道方面，主賽道是三（永續供應鏈），處理實體商品監管鏈與「再生」宣稱的查證；第二賽道是一（碳市場與排放透明），處理銷毀碳權的跨註冊處重複計算。法規掛鉤包括：EU 2024/573 第 7 條紀錄保存、第 11(4) 條回收再填充安排、第 12 條標示、第 23–24 條非法貿易條款（[fluorocarbons.org](https://www.fluorocarbons.org/illegal-hfcs/regulation/)；[dip.gov.cz](https://dip.gov.cz/dip/en/query/4/2024/573)）；土耳其 2024-10-15 發布的《含氟溫室氣體管理規則》（Resmî Gazete 第 32693 號）（[alomaliye](https://www.alomaliye.com/2024/10/15/florlu-sera-gazlarina-iliskin-yonetmelik/)）；土耳其在 2021-11-10 批准 Kigali 修正案（[Cooling Post](https://www.coolingpost.com/world-news/turkey-latest-to-ratify-kigali/)）。

COP31 於 2026-11-09 至 11-20 在安塔利亞舉行（[UNRIC](https://unric.org/de/unfccc-cop31-der-weg-nach-antalya/)）。2026 年 6 月倫敦氣候行動週的高階會議上，COP31 主席親自出席，會中把包括 HFC 在內的超級污染物定位為「通往 COP31 的核心實施支柱」（[CCAC](https://www.ccacoalition.org/news/global-leaders-unite-london-accelerate-action-super-pollutants-ahead-cop31)）。Global Cooling Pledge 在 COP30 成立了政府間冷卻委員會，2026-09-15 至 18 在新加坡舉行首屆大會（[Cool Coalition](https://coolcoalition.org/events/global-cooling-pledge-assembly-2026)）。但目前沒有找到 COP31 正式議程中的 HFC 項目，所以簡報應說「對齊超級污染物實施支柱」，不要說「對齊 COP31 議程項目」。〔推論〕本專案也呼應 COP31 的「實施型 COP」定位，因為它做的是把既有法規真正執行起來，而不是新增承諾。

台灣方面，環境部於 **2025-02-25** 發布《氫氟碳化物管理辦法》，定義使用者與供應者的「執行實績」，並規定 2026-01-01 起消費量不得超過基線的 100%；回收、回用、銷毀的量不計入消費量（[6laws](https://6laws.net/6law/law3/氫氟碳化物管理辦法.htm)；[理律](https://www.leeandli.com/TW/Newsletters/1724.htm)）。**2026-07-22** 環境部審查「廢棄含氟氣體回收與銷毀」減量方法學草案，讓這類專案可以進入自願減量機制取得額度。來源組成約七成是廢電子電器與資訊產品、兩成是車輛、一成是半導體製程；產業公會代表強調，**銷毀量必須被量化才算數**（[公視](https://news.pts.org.tw/article/818802)）。〔推論〕這對台灣團隊是最直接的切入點。台灣即將出現國內的 F-gas 銷毀額度，同一批銷毀量可能同時想登記台灣自願減量和 Verra 或 Isometric，而且必須證明氣體來自報廢設備，不是庫存。目前沒有找到台灣有鋼瓶層級的數位流向平台；2023 年環境部曾考察新加坡的冷媒流向管理制度（[NDC 出國報告](https://report.ndc.gov.tw/ReportFront/PageSystem/reportFileDownload/C11201321/001)）。

### 與評審背景的契合

〔推論〕以下不列評審姓名，只依專長分群說明。**資安與後量子密碼群**（四位）會看威脅模型，所以作品要附一頁威脅模型，涵蓋以下攻擊與對應緩解：校正秤被偽造（裝置金鑰與校正憑證）、鋼瓶 ID 被複製（同一 ID 同時出現在兩地會觸發異常）、檢驗報告被重播（報告雜湊綁定秤重事件）、Sybil 再生業者（以既有登錄號碼發行可驗證憑證）、多方串通（AI 檢查統計上不可能的平衡）、金鑰外洩（撤銷機制）。**IoT＋Hyperledger 冷鏈溯源專長的評審**和本題幾乎是完全重疊：超市與冷鏈的冷凍設備，正是冷媒洩漏的主要場景。**供應鏈威脅建模、數位孿生與 SSI 專長的評審**，會注意到設備數位孿生和技師證照憑證的設計。**評審團隊負責人**經營 DPP 公司，可以把專案延伸成「冷媒鋼瓶與設備護照」的方向，但 EU DPP 是否會涵蓋冷媒或 HVAC 設備還沒有查證，只能說是延伸方向。**能源與電池 AI 專長的評審**，可以從 SF₆ 開關設備的延伸和洩漏預測模型切入，也對上 COP31 的電氣化主軸。倫理場次強調的 responsible AI，要用「AI 只標記、由人複核」，以及「不把負擔丟給技師」來回應（[Devpost update](https://ieee-climatechain-hack.devpost.com/updates/46860-register-now-session-3-ethics-responsibility-good-practices-for-climate-innovation)）。

### 最難的評審質疑與誠實回答

**「垃圾進、垃圾出，鏈看不到鋼瓶裡裝的是什麼。」** 這是對的，而且要先承認。帳本不驗證物理，它做的是強迫每一個宣稱都和彼此獨立的交易對手一致：賣方轉出等於買方收到、再生產出不超過回收進料、銷毀量不超過持有量。結果是說謊需要多方串通。實體錨點用的是 Isometric 已經規定的秤重、抽樣與簽章檢驗報告。剩下的串通風險，由 AI 從統計上不可能的平衡去找。

**「EU F-gas Portal、日本 RaMS、義大利 Banca Dati、法國 Trackdéchets 都已經存在，主管機關自己建資料庫就好，為什麼要區塊鏈？」** 先部分承認：單一國家內，資料庫確實就夠了。接著拿義大利當例子：它同時有 EU Portal 和強制的電子作業資料庫，仍然是查扣量最高的國家（[refindustry](https://refindustry.com/news/eia-report-tracks-illegal-hfc-trade-into-eu-supply-chains/)）。至於原因是否就是「各段沒有對帳」，這是推論，沒有直接證據。本專案的位置在跨境與跨註冊處這一層，這一層沒有任何單一機關有管轄權。而且本專案的資料來源就是這些國家系統，不是要取代它們。

**「銷毀碳權是漂綠，HFC-23 的醜聞就是前車之鑑，你們是在製造更多問題。」** 先承認 HFC-23 的反向誘因歷史，以及 EIA 的反對立場。接著說明設計怎麼回應：只有具備設備來源鏈的公斤才能取得碳權（排除庫存與原生冷媒）、每公斤都有透明的稽核軌跡、跨註冊處唯一性檢查。這三點正好針對 EIA 擔心的「不當管理與會計」。碳權只是可選的資金來源之一。即使完全不碰抵換，這套帳本一樣可以用在再生冷媒的法規認證上。

**「美國 EPA 的 QR 鋼瓶追蹤，就是因為業界反彈才被撤銷的。」** 本專案的推廣靠拉力：只有想取得碳權資格或再生溢價的業者需要加入，資料也盡量從既有的國家系統匯入，不要求技師重複登打。

**「CCCANZ 和 ZHAW 早就做過區塊鏈冷媒，Recoolit 也已經在追蹤每一步。」** 同意，所以我們不主張「第一個區塊鏈冷媒追蹤」。我們沒有找到任何系統公開展示「跨組織質量守恆＋跨註冊處唯一性」這兩件事。另外，CCCANZ 的計畫是否還在運作，目前查不到。

**「經銷商不會願意公開自己的交易量。」** 〔推論〕所以設計成許可制鏈：明細只給主管機關看，對外只公開空值化標記和總量統計。零知識範圍證明可以當作進階選項，但不是本題的核心。

**「你們是在說土耳其是走私來源嗎？」**（面對土耳其評審最需要準備的一題）〔推論〕建議這樣框定：土耳其在 2024 年重建了 F-gas 制度，FARAVET 和 EKOMVET 都已經上線，是同類制度中數位化程度很高的國家。本工具讓**守法的土耳其出口商與再生業者能證明自己的貨物有配額或回收來源**，不必因為邊境查扣新聞而被整體懷疑。簡報引用 EIA 的路線資料時，要保持事實陳述、不用控訴語氣，並且同時列出中國與其他路線。

**「在 Kigali 的會計上，銷毀量會不會被算兩次？」** 要誠實說：目前文獻**沒有任何紀錄**顯示銷毀碳權和 Kigali 或國家淘汰會計之間有重複計算的案例。Kigali 計算的是消費量（生產＋進口－出口，銷毀量另行處理），兩者之間的交互作用屬於技術細節，需要對照臭氧秘書處的申報規則。所以本專案只把它當成**設計上的防護欄位**，在銷毀事件上標記「已用於何種宣稱」，不把它當成已證實的痛點來賣。

### 影響力推估的方法

〔推論〕IEEE 頁面要求附上減碳推估（[IEEE 頁面](https://cmte.ieee.org/turkiye-blockchain/hackatlon/)）。建議的公式是：年減量 ΔE ＝ Σ（回收率提升 ΔR × 報廢時殘存量 M × 氣體 GWP）× 歸因係數 α，另外把「非法冷媒被排擠出市場」列為不量化的上行情境。

日本的例子可以這樣算：報廢時殘存 12,011 噸，平均暖化潛勢約每公斤 1.8 噸 CO₂e（由 12.62 Mt ÷ 6,878 噸推得）（[MOEJ](https://www.jraia.or.jp/english/relations/file/260724_oewg48_sideevent_moej_presentation.pdf)）。回收率每提升 1 個百分點，約多回收 120 噸，相當於每年約 **0.22 MtCO₂e**。

計算時有四個假設必須寫清楚。第一，帳本本身不會讓回收發生，真正提高回收率的是碳權或溢價這類價值訊號，帳本的作用是讓價值訊號可信，所以歸因係數 α 要保守，建議用 10% 到 30% 做敏感度分析。第二，各國資料不同；土耳其沒有找到報廢回收率的數據，只能列為參數。第三，GWP 要依 EU 2024/573 附件或台灣辦法的官方數值，不要用日本的平均值套到單一氣體。第四，本專案自己的影響力宣稱，不能把已經拿去發碳權的同一批銷毀量再算一次，否則就犯了自己要防止的錯誤。

### 交件前要自己確認的事項

| 項目 | 為什麼重要 | 怎麼確認 |
|---|---|---|
| 土耳其是 Article 5 還是非 Article 5 國家，以及它的 HFC 削減時程 | 研究筆記沒有確認，講錯會被評審當場糾正 | UNEP 臭氧秘書處的締約方狀態清單 |
| FARAVET／EKOMVET 實際的資料欄位（鋼瓶序號、每次作業的公斤數） | 決定對帳要做到「逐瓶」還是「每家公司每期」 | 環境部臭氧單位的系統文件或簡報 |
| CERTEX 是否逐批扣減配額 | 影響「發行」規則該怎麼寫 | EU 執法指引原文 |
| 再生冷媒是否免配額，以及 Art. 12 標示的原文 | 洗白誘因有多大的論證基礎 | EUR-Lex 2024/573 |
| Demo 使用氣體的 GWP | 推估數字是否正確 | 2024/573 附件、台灣管理辦法 |
| Kigali 對銷毀量的申報方式 | 確認防護欄位的設計正確 | 臭氧秘書處的申報規則 |
| Devpost、ETHGlobal 手動搜尋「refrigerant」「HFC」「F-gas」 | 目前「零前例」的結論來自受限流影響的搜尋 | 直接到兩個網站搜尋 |
| CCCANZ 計畫的結果、ZHAW 計畫的細節 | 新穎性主張的邊界 | 兩個專案的官方頁面 |
| 台灣 2026-07 方法學草案的最終狀態 | 台灣掛鉤是否仍然成立 | 環境部公告 |
| EIA 2026 兩份 PDF 的原文數字；Refindustry 文中日期前後不一致 | 筆記中有幾個數字是經二手轉述 | 直接閱讀 EIA PDF |
| 義大利 Banca Dati 是否和銷售資料交叉比對 | 「義大利證明孤島無效」這個推論的強度 | 義大利環境部或圓桌會議的文件 |
| 主辦方對賽道、是否強制使用區塊鏈、提交時間的澄清 | 討論區的問題至今沒有回覆 | 持續追蹤 Devpost 討論區 |

## 五、備案：土耳其掩埋場甲烷多重宣稱對帳

〔推論〕建議名稱是 **「Tek Ton（一噸一宣稱）：土耳其掩埋場甲烷的跨類別宣稱守恆帳本」**，主賽道一，兼賽道四。**一句話問題陳述**：從 2026 年起，土耳其同一座掩埋場的甲烷，可能同時被宣稱為國際自願碳權、國內 Turkuaz 碳權、再生電力憑證、市政零廢棄成果和國家 NDC 減量，但沒有任何系統檢查這些宣稱加起來是否合理，也沒有人檢查它們和衛星觀測是否相符。

**背景與現況。** UCLA 與 Carbon Mapper 的 2025 年全球掩埋場甲烷排名中，**第 24 名是 Şile（3.8 t CH₄/h，İSTAÇ，伊斯坦堡市府子公司），第 25 名是 Menemen（3.6 t/h，İzmir 市府）**；Silivri 的 8.4 t/h 比所有前 25 名都高，被列為「不光彩提名」（[UCLA](https://law.ucla.edu/news/spotlight-top-25-methane-plumes-2025-landfills)；[Datawrapper 表](https://datawrapper.dwcdn.net/3PIy7/6/)）。Menemen 對應的是 Harmandalı 廢棄物處理場，簡報時建議寫成「İzmir Harmandalı（榜單列為 Menemen）」。Şile 應該就是 Kömürcüoda 掩埋場，但這是依行政區名稱推定，**沒有用座標核對**。Kömürcüoda 加 Odayeri 的 LFG 發電專案登錄在 Gold Standard（[carbonfootprint.com](https://www.carbonfootprint.com/gs_turkey_lfg_707.html)），Verra 也有「İzmir LFG Capture and Utilization Project」（[Verra](https://verra.org/projects_public_comm/zmir-landfill-gas-lfg-capture-and-utilization-project)）。YEK-G 的適用範圍包括掩埋場沼氣（[Çakmak](https://cakmak.av.tr/en/article/renewable-energy-certificates)）。《氣候法》第 7552 號建立了 TR ETS（2026–2027 試行）和發行 Turkuaz 碳權的 TR KDS 抵換機制（[EY Türkiye](https://www.ey.com/tr_tr/insights/climate-change-sustainability-services/iklim-kanunu)）。COP31 行動議程已於 2026-09-21 在聯合國大會發布，十大主題中第二項就是「零廢棄與甲烷減量」（[Daily Sabah](https://www.dailysabah.com/turkiye/turkiyes-cop31-action-agenda-sets-energy-waste-targets-for-2035/news)），草案階段甚至把廢棄物甲烷排在第一（[Climate Home News](https://www.climatechangenews.com/2026/02/13/turkiye-prioritises-cleaning-up-garbage-emissions-in-cop31-action-agenda/)）。土耳其零廢棄計畫的回收率從 2017 年的 13% 提升到 2025 年的 37.53%（[Alomaliye](https://www.alomaliye.com/2026/03/30/sifir-atik-hareketinde-yeni-bilanco-90-milyon-ton-atik-ekonomiye-kazandirildi/)），但 NDC 裡的廢棄物甲烷只寫了「將提高」，沒有數字目標（[UNEP LEAP](https://leap.unep.org/en/countries/tr/national-legislation/updated-first-nationally-determined-contribution-republic-turkiye)）。量測與申報之間的落差有實證：美國的空中量測平均是 GHGRP 申報值的 1.4 倍（[ASU](https://news.asu.edu/20240329-environment-and-sustainability-new-study-finds-previously-unreported-and-persistent)），四座美國東南部掩埋場的 TROPOMI 估計平均是申報值的 6 倍（[arXiv 2408.10957](https://arxiv.org/abs/2408.10957)），收集效率常用的 75% 預設值「並非來自測試數據」（[EREF](https://erefdn.org/wp-content/uploads/2025/03/Landfill-Gas-Collection-Efficiency-Executive-Summary.pdf)）。

**使用者。** 主要使用者是氣候變遷署（İklim Değişikliği Başkanlığı）：它同時是 TR KDS 註冊處的營運者和國家盤查的編製者，也包括核准專案轉入 TR KDS 的查證機構。次要使用者是 YEK-G 與 I-REC 的買家和 Scope 2 稽核者，以及想讓零廢棄宣稱更可信的市政單位。

**既有方案。** WasteMAP 已經整合申報、模型與觀測三種資料，並提供決策支援（[RMI](https://rmi.org/insight/waste-methane-assessment-platform)）。Hedera Guardian 已有 ACR、CAR 與 CDM ACM0001 的 LFG 碳權政策範本（[Guardian](https://guardian.hedera.com/guardian/demo-guide/carbon-offsets/landfill-gas-destruction-and-beneficial-use-projects-version-2.0)），但只處理單一註冊處的核發。CAD Trust 處理的是碳權註冊處之間的對接，是否涵蓋能源屬性憑證**尚未查證**。

**解法。** 〔推論〕每一類宣稱在「場址—期間」層級貼上一份承諾，內容是序號雜湊、場址、期間與屬性類型。屬性類型分為：被銷毀的 CH₄ tCO₂e、MWh、避免排放、盤查值。帳本用一張「屬性相容矩陣」決定哪些組合可以共存：甲烷銷毀屬性和電力 MWh 屬性本來就是兩種不同的屬性，可以共存；只有碳權方法學裡包含電網替代減量的那一部分，才和 YEK-G 衝突。同一屬性、同一場址、同一期間不得重複宣稱，除非前一筆已經註銷。AI 負責用一階衰減模型（以場址累積掩埋量推估）加上衛星煙流排放率，推算「隱含收集效率」並附上不確定區間，再標出和持續煙流不一致的「避免排放」宣稱。甲烷警報追蹤器併入成為「證據時間軸」模組：記錄公開偵測、業者聲明的雜湊、宣稱修復的日期，以及之後的衛星複查。複查結果要考慮偵測機率，用「N 次晴空過境未偵測到，偵測下限約 X」這類表述，不要用「已修復」這種二元狀態。

**政治中立的框定。** 〔推論〕İSTAÇ 與伊斯坦堡市府、İzmir 市府目前由在野黨執政，環境部屬中央政府。在 IEEE 土耳其主辦的比賽中，任何「點名揭發」的框定都有風險。建議的說法是「幫零廢棄計畫以可信的方式證明它的甲烷效益」，把工具定位成服務所有宣稱者的中立基礎設施，包括部會、市府和私人業者。Demo 時三個場址用同一套方法、同樣的語氣處理，不要只挑某一方。必要時可以提供匿名場址模式。

**Demo（全部假設情境都要標示為「假設」）。** 〔推論〕以「Şile／Kömürcüoda 2025」為例，分四步。第一步，匯入公開的 Carbon Mapper 煙流排放率（平均 3.8 t/h）。第二步，匯入 GS 專案的監測銷毀量與發電量；如果拿不到監測報告，就用模擬數字並標示。第三步，算出隱含產氣量、銷毀量與觀測洩漏量，得到附區間的隱含收集效率。第四步，帳本上同一場址期間有四筆宣稱：GS VER、YEK-G、一筆**假設的** TR KDS 申請、以及市府「每年避免約 7,000 噸」的公開說法（[Dünya](https://dunya.com/gundem/cop31-oncesi-silivride-metan-alarmi-uydu-84-tonsaat-olctu-haberi-842584)）。守恆規則會拒絕和尚未註銷的 GS 年份重疊的 TR KDS 核發。系統另外標記：市府的避免排放宣稱，和持續存在的煙流不一致，需要說明。要特別注意兩點：GS 專案的電力是否也發了 YEK-G 或 I-REC 目前**沒有確認**；GS 方法學是否包含電網替代減量也沒有確認。所以這整段雙重宣稱都只能當作假設情境展示。

**區塊鏈必要性與最難的質疑。** 〔推論〕區塊鏈的必要性只有部分成立。多個互不隸屬的註冊處（GS、Verra、TR KDS、EPİAŞ YEK-G、I-REC）加上市府，確實需要一份沒有單一擁有者的守恆檢查，這也是 CAD Trust 自己的存在理由。但氣候變遷署建一個中央資料庫，技術上也做得到，它只是約束不到外國註冊處。評審最可能問三題。第一題：「衛星看的是洩漏，碳權算的是銷毀，你在比較兩種不同的東西。」答：沒錯，所以系統從不拿煙流去否定銷毀碳權，只檢查盤查值和避免排放類的宣稱。第二題：「土耳其有真實的雙重宣稱案例嗎？」答：沒有，我們查過。YEK-G 也已經排除和 I-REC 重複核發。這是 2026 年 TR KDS 上路後的前瞻性風險，在市場開張前做檢查成本最低。第三題：「為什麼不用 WasteMAP 加一張 SQL 表？」答：WasteMAP 不追蹤宣稱；而且 CAD Trust 已經在處理碳權之間的對接，我們新增的只有能源屬性憑證、市政宣稱和盤查這三類宣稱。

**為什麼是備案而不是主推薦。** 〔推論〕這題的主辦國共鳴最高，但它要解決的痛點沒有任何案例，WasteMAP 和 CAD Trust 已經覆蓋了一大部分，政治風險也比較高。如果團隊的強項是遙測與衛星資料，或主辦方澄清賽道四不強制使用區塊鏈，可以考慮改走這題。

## 結論

這一輪驗證帶來的最大修正，在於「守恆」這個篩選原則要怎麼用：只有當守恆的對象是實體量、造假發生在不同主管機關的段落之間、而且沒有任何一方負責對帳時，區塊鏈才有不可替代的位置。前一份報告的三題都在第二或第三個條件上失敗，原因是法規早已規定了平均方法、連續性或備份機制，或者市場已經有人在鏈上強制執行了守恆。HFC 冷媒同時滿足三個條件，而且每個國家都已經把它的某一段數位化了，所以它的論證強度剛好來自其他系統的存在：日本有全套法定系統，回收率仍卡在 43%；義大利同時有兩套數位系統，仍是查扣量最高的國家。這組反例說明，再多一個孤島也沒有用，缺的是跨段落的公斤對帳。

對這場比賽來說，這也改變了作品的定位。在估計 30 到 60 件碳權平台之間，最能說服以資安學者為主的評審團的，不是更炫的代幣設計，而是主動說出「單一國家內，資料庫就夠了」，再精確指出哪一條國界、哪兩個註冊處之間，沒有任何人能當可信的第三方。敢承認自己的限制，在這裡本身就是差異化。
