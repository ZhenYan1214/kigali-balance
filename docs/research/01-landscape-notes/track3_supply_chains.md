# Track 3：永續供應鏈、產品溯源與循環經濟 — 現況、痛點、既有方案與未滿足需求

> 研究日期：2026-10-14。來源多為 2024–2026；較舊資料已標註。很多數據來自顧問公司或廠商部落格（secondary），已逐條註明；最終報告引用前最好再對照歐盟公報（EUR-Lex）或主管機關原文。

---

## Q1. 法規如何推升需求，實際卡在哪裡（DPP/ESPR、電池護照、EUDR、CBAM、CSRD/CSDDD/Omnibus、Green Claims、UFLPA、德國 LkSG）

### Takeaway
2026 年是法規從「紙上」進入「執行」的轉折年：CBAM 確定期（2026/1/1 起）、DPP 中央登錄系統（2026/7/20 上線）、EUDR（2026/12/30 適用）、電池護照（2027/2/18 強制，沒有延期）都已經有硬日期。相對地，CSRD/CSDDD 範圍被 Omnibus 大幅縮小，Green Claims Directive 停擺，德國 LkSG 也在弱化。所以需求重心正在轉移：「企業層級的永續報告」變弱，「產品層級、可驗證、可交換的數據」（PCF、產地座標、材料組成、嵌入排放）變得更重要。共同痛點都在上游供應商資料取得與驗證，而這些供應商多半是中小企業、小農或非歐盟廠商。

### Cited Findings

**EU ESPR / 數位產品護照（DPP）**
- 第一份 ESPR 工作計畫（COM(2025) 187）於 2025-04-16 通過，列出優先產品群：鋼鐵（授權法案預計 2026）、紡織、輪胎、鋁（2027）、家具（2028）、床墊（2029），再加上可修復性、可回收性等橫向措施 — [Digiproductpass work plan 摘要](https://www.digiproductpass.com/espr-work-plan-2025-2030)；[GS1 support](https://support.gs1.org/support/solutions/articles/43000758747-which-sectors-does-the-espr-s-digital-product-passport-target-first-)
- 截至 2026 年 8 月，ESPR 底下的產品群授權法案還沒有任何一項通過。鋼鐵的公眾諮詢於 2026-08-12 結束；紡織則連草案都還沒有 — [dpp-tool.com（secondary）](https://dpp-tool.com/en/blog/espr-delegated-acts/)；[Renoon](https://www.renoon.com/blog/delegated-acts-for-digital-product-passport-explainer-and-current-status)
- 歐盟 DPP Registry 於 2026-07-20 上線，附測試環境。業者透過網頁或 API 登錄唯一產品識別碼與 metadata。法源是 Implementing Regulation (EU) 2026/1778（2026-07-16）。除電池外，目前還沒有任何產品被強制要求 DPP — [EU Transition Pathways](https://transition-pathways.europa.eu/retail/news/digital-product-passport-registry-now-live)；[LexisNexis 2026-07-21](https://www.lexisnexis.co.uk/legal/news/commission-launches-digital-product-passport-registry-under-ecodesign-regulation)；[EUR-Lex 2026/1778](https://eur-lex.europa.eu/eli/reg_impl/2026/1778/oj)
- CEN-CENELEC JTC 24 於 2026-05-27 發布第一批 DPP 標準：EN 18216（資料交換協定）、EN 18219（唯一識別碼）、EN 18220（資料載體）、EN 18221（儲存／存檔／持久性）、EN 18222（API）。「存取權限」與「資料認證與完整性」兩項（prEN 18239、prEN 18246）仍是草案。另有來源說 Implementing Decision (EU) 2026/1736 引用了 6 項標準，數量說法不一致 — [CDX 標準說明](https://public.cdxsystem.com/en/web/cdx/w/first-european-standards-for-the-digital-product-passport-published)；[CDX registry 文](https://public.cdxsystem.com/web/cdx/w/eu-digital-product-passport-technical-framework-takes-shape-with-registry-launch)
  - → 黑客松相關：資料「認證與完整性（authentication & integrity）」標準還沒定案，這正是密碼學／區塊鏈可以切入的空白。

**EU 電池法規／電池護照**
- 2027-02-18 起，EV 電池、LMT（輕型交通工具）電池與 >2kWh 工業電池都必須帶有電池護照（QR code 連到電子紀錄）。第 77(1) 條不論 77(9) 存取權限實施法案是否通過都會適用 — [Minespider blog](https://www.minespider.com/blog/eu-battery-passport-what-the-february-2027-deadline-means-after-the-commissions-may-2026-implementation-update)；[battery-tech.net](https://battery-tech.net/why-the-eu-is-about-to-miss-its-own-battery-passport-deadline-while-industrys-stays-fixed/)
- 第 77(9) 條存取權限實施法案錯過 2026-08-18 期限，執委會將它排到 2026 Q4，離護照上路只剩很短的時間 — [eudigitalproductpassport.org](https://eudigitalproductpassport.org/updates/battery-passport-access-rights-implementing-act-delay)
- Omnibus IV（Regulation (EU) 2025/1561）只把電池供應鏈盡職調查延到 2027-08-18，沒有延後護照 — [infodpp.eu](https://infodpp.eu/en/blog/battery-due-diligence-delay-2025-1561/)
- 2026-03 GBA／CEPS／RECHARGE 圓桌報告指出，電池碳足跡方法學授權法案還卡在「電力如何建模」的政治決定 — [GBA EU roundtable report (2026-03-10)](https://www.globalbattery.org/media/publications/eu-roundtable-event-report-final.pdf)
- Battery Pass 聯盟由 Systemiq 領導、11 個夥伴組成，負責內容與技術標準。GBA Battery Passport 是另一套方案，2026 年做 operational trials，預計 2027 初全面推出 — [Wikipedia: Battery passport](https://en.wikipedia.org/wiki/Battery_passport)；[GBA 2026 pilots](https://www.globalbattery.org/2026-battery-passport-pilots/)
- 多數 OEM 目前還在用試算表、供應商問卷和人工驗證，難以規模化 — [Sibros](https://www.sibros.tech/post/navigating-the-eu-battery-passport-what-oems-need-to-know-before-2027)

**EUDR（歐盟零毀林法）**
- 時程：2024-10 第一次延期到 2025-12；2025-12-23 公告 Regulation (EU) 2025/2650，大中型業者延到 2026-12-30，小微業者延到 2027-06-30。2026-05-04 執委會簡化審查排除再延期；2026-07 EUDR 資訊系統重新開放；2026-09-17 修訂產品清單（牛皮革、部分硫化橡膠製品移出範圍）；即溶咖啡、棕櫚油衍生物等 2027-12-30 才納入 — [Coolset 時程追蹤（vendor）](https://www.coolset.com/academy/eudr-delay-2025-explained)；[EY Tax News 2026-01](https://taxnews.ey.com/news/2026-0237-eu-deforestation-regulation-application-postponed-to-30-december-2026)
- 2025/2650 的簡化：低風險國家的小微初級生產者只需一次性「簡化聲明」，並可用郵寄地址代替地理座標；下游業者和非進口貿易商不必再提交 DDS，只需保留並傳遞參考號 — [Coolset](https://www.coolset.com/academy/eudr-delay-2025-explained)；[Osapiens](https://osapiens.com/en/resources/blogs/2026/eudr-timeline-update-new-2026-deadline-obligations-and-next-steps-for-companies)
- 地理座標規則：≤4 公頃的地塊用單點座標，>4 公頃要提供多邊形（polygon）— [OriginsNext](https://www.originsnext.com/news/eudr-2026-readiness-guide)
- 國家風險分級（2025-05-22 首版）：低／標準／高風險的查核比例分別是 1%／3%／9%。高風險國家只有白俄羅斯、北韓、緬甸、俄羅斯 — [European Rubber Journal](https://www.european-rubber-journal.com/article/2097547/european-commission-publishes-country-benchmarking-for-eudr)；[ATIBT](https://www.atibt.org/en/news/13641/eudr-commission-publishes-first-country-benchmarking-list)。另有來源稱 benchmarking act 被否決、目前所有國家都是標準風險，兩方說法衝突，需要查證 — [Coolset](https://www.coolset.com/academy/eudr-delay-2025-explained)
- 延期原因之一是 TRACES 資訊系統尚未準備好處理預期的 DDS 數量 — [Coolset](https://www.coolset.com/academy/eudr-delay-2025-explained)；[Council doc ST-14329-2025](https://data.consilium.europa.eu/doc/document/ST-14329-2025-INIT/en/pdf)

**CBAM（碳邊境調整機制）**
- 2026-01-01 進入確定期。門檻是每位進口商每年累計 >50 公噸 CBAM 貨物（電力、氫氣不適用此門檻）。2026 年進口對應的憑證自 2027-02-01 開賣，首份年度申報期限為 2027-09-30 — [Tanso](https://www.tanso.de/en/blog/cbam-faq-fragen-und-antworten-zur-cbam-verordnung-ab-2026)；[DEHSt（德國主管機關）](https://www.dehst.de/EN/Topics/CBAM/CBAM-definitive-regime-2026/cbam-definitive-regime-2026_node.html)
- 沒有經驗證的實際排放數據時用預設值（default values），並有加價（mark-up）：2026 年 ×1.10、2027 年 ×1.20、2028 年起 ×1.30。預設值已由 IR 2026/1740 修正並追溯適用 — [cbamguide.com（secondary）](https://cbamguide.com/compliance/default-values/)；[bindler.co](https://bindler.co/guides/cbam-definitive-period-timeline/)
- 使用實際值必須經第三方驗證（首年要現場稽核），而進口商完全依賴非歐盟設施營運者提供數據。對效率高的鋼廠來說，預設值可能明顯高於實際排放 — [crediblesg](https://www.crediblesg.com/blogs/leveraging-ai-and-circular-practices-in-cbam-supplier-assessment/)；[co2-iq](https://co2-iq.com/en/eu-cbam-default-values-emissions)

**CSRD/CSDDD 與 Omnibus I**
- Omnibus I 指令（Directive (EU) 2026/470）於 2026-03-18 生效。CSRD 範圍縮到員工 >1,000 且營收 >4.5 億歐元；CSDDD 縮到員工 >5,000 且營收 >15 億歐元，適用延到 2029-07；罰款上限為全球營收 3% — [Covington 2026-02](https://www.cov.com/en/news-and-insights/insights/2026/02/eu-csddd-csrd-omnibus-published-in-official-journal-transposition-delegated-acts-and-guidelines-are-next)；[Greenberg Traurig](https://www.gtlaw.com/en/insights/2025/12/eu-omnibus-package-trilogue-agreement-on-eu-csrd-and-csddd)；[De Brauw](https://www.debrauw.com/articles/omnibus-now-final-agreement-reached-on-directive-amending-csrd-and-csddd)

**Green Claims Directive／ECGT**
- 執委會在 2025-06-20 宣布打算撤回 Green Claims Directive 提案，但各方說法不一：有人說已撤回，也有人說從未正式撤回，歐洲議會 Legislative Train 列為 blocked。無論如何，Empowering Consumers Directive (EU) 2024/825 才是實際生效的規則：沒有證據就禁止「eco-friendly」「carbon neutral」這類泛用宣稱，2026-09-27 起經各國國內法適用 — [DNV](https://www.dnv.com/supplychain/thought-leadership/green-claims-directive-withdrawn-but-the-mission-remains/)；[ESG News](https://esgnews.com/eu-commission-confirms-green-claims-directive-not-withdrawn/)；[greencalculus](https://greencalculus.com/standards/eu-green-claims-directive/)

**UFLPA（美國維吾爾強迫勞動預防法）— 太陽能多晶矽**
- CBP 2022-06 指引要求太陽能進口商提供完整供應鏈文件，列出所有參與實體，並附流程圖標示每種材料的原產地。同時從新疆和非新疆採購多晶矽的工廠，被扣留的風險較高 — [Bradley 2023（較舊）](https://www.bradley.com/insights/publications/2023/09/the-uyghur-forced-labor-prevention-act-uflpa-a-year-into-enforcement-what-has-the-solar-industry-lea)
- 2025-01-14 DHS 新增 37 家實體到 UFLPA Entity List，總數達 144 家，是單次最大擴充，其中包括多晶矽、金屬矽、石英上游廠商與 JA Solar 子公司 — [Green Worldwide](https://www.greenworldwide.com/dhs-adds-37-new-companies-to-uflpa-entity-list/)；[PV Tech](https://pv-tech.org/ja-solar-subsidiary-among-additions-to-us-uflpa-entity-list)
- 2026 年仍有扣留案例：TOYO 在 2026 年 SEC 文件中揭露其太陽能電池與模組出貨被 CBP 扣留 — [SEC 424B5 TOYO](https://www.sec.gov/Archives/edgar/data/0001985273/000121390026071836/ea0295734-424b5_toyo.htm)
- 2022 年 CBP 扣留約 2GW 模組、約 7 億美元；2024 上半年扣留超過 10 億美元的產品。有分析稱 CBP 主要靠自動化分析進口交易數據與交叉比對公司登記資料，找出下層供應商的曝險，而不是靠客戶自己的盡職調查 — [Sayari "UFLPA at three years"（2026-05）](https://sayari.com/wp-content/uploads/2026/05/Sayari_uflpa-at-three-years_Blog.pdf)
- Maxeon 2025 年就扣留案提起訴訟，主張其多晶矽來自 Hemlock（美）與 Wacker（德）— [Renewable Energy World](https://www.renewableenergyworld.com/policy-regulation/a-theory-emerges-explaining-maxeons-ongoing-problems-with-customs/)

**德國供應鏈法 LkSG**
- 2025-09-03 內閣通過修法草案，取消向 BAFA 提交年度報告的義務（追溯自 2023-01-01），罰款只限重大違規；盡職調查義務本身保留。BAFA 自 2025-11-07 起關閉線上報告表單。2026-01-16 國會開始辯論，搜尋時尚未確認三讀通過 — [KPMG Law](https://kpmg-law.de/en/supply-chain-act-reporting-obligation-no-longer-applies-sanctions-reduced/)；[Taylor Wessing 2026-01](https://www.taylorwessing.com/en/insights-and-events/insights/2026/01/lksg)；[Rödl & Partner](https://www.roedl.com/en/insights/whats-new-german-supply-chain-act-legal-update-on-lksg-and-csddd/)

### Inferences
- 「報告型」法規（CSRD/CSDDD/LkSG）正在退潮，「市場准入型」法規（EUDR、CBAM、電池護照、DPP、UFLPA 扣貨）則有硬日期，而且在邊境或海關執行，罰則是貨物不能進入市場。黑客松作品若定位在「幫助產品過海關或進入市場的可驗證數據」，比定位在「ESG 報告」更站得住。
- DPP 的技術框架（識別碼、資料載體、API）已有標準，但「資料認證與完整性」「存取權限」還沒定（prEN 18246、電池 77(9) 也遲到）。這是可驗證憑證（Verifiable Credentials）、簽章、零知識證明可以示範價值的明確缺口。
- CBAM 預設值逐年加價（10%→30%），等於直接給「經驗證的實際排放數據」一個金錢價值，可以量化成作品的商業論述。

### Gaps
- EUDR 國家風險分級目前的狀態（是否被否決、多少國家屬低風險）有衝突，需要查執委會原文。
- 找不到 TRACES 已提交的 DDS 數量官方統計。
- LkSG 修法是否已在 2026 年三讀通過，未確認。
- Green Claims Directive 2026 年是否有新進展，未確認。

---

## Q2. Scope 3 數據問題與 PCF 交換基礎設施（CDP、PACT、Catena-X、Estainium/SINE、Manufacture-X）

### Takeaway
上游 Scope 3 平均是企業直接營運排放的 26 倍（CDP/BCG 2024），但企業量測與設定目標的比例遠低於 Scope 1/2。PCF 交換的「格式」已收斂到 PACT 規格（Catena-X 也對齊）：5,000+ 家企業採用、48+ 套合規軟體。真正的瓶頸在中小供應商接入的成本與能力，以及數據可信度。Catena-X 在 2026 年才快速成長，政府還要補貼中小企業接入。

### Cited Findings
- CDP 與 BCG 2024-06 報告《Scope 3 Upstream: Big Challenges, Simple Remedies》：上游 Scope 3 平均是直接營運排放的 26 倍；企業量測 Scope 1/2 的可能性是供應鏈排放的 2 倍，設定目標的可能性是 2.4 倍；只有 15% 的揭露企業設有上游 Scope 3 目標 — [supplier.io 摘要（secondary）](https://supplier.io/resources/blog/urgent-call-to-address-scope-3-ghg-emissions-in-new-cdp-supply-chain-report)。另有引用 CDP 2023 Supply Chain Report 給出 11.4 倍，年份與口徑不同 — [CO2 AI](https://co2ai.com/insights/cpg-scope-3-emissions-suppliers-why-your-carbon-data-determines-your-contracts)
- GHG Protocol 把「初級數據（primary data，來自供應商特定活動）」和「次級數據（產業平均）」區分開來。CDP 在供應商未提供數據時，採用混合方法以產業平均補缺 — [GHG Protocol Scope 3 FAQ (2022)](https://ghgprotocol.org/sites/default/files/2022-12/Scope%203%20Detailed%20FAQ.pdf)；[CDP Scope 3 primary data 指南](https://cdn.cdp.net/cdp-production/comfy/cms/files/files/000/008/036/original/Scope_3_-_implementing_primary_data_and_supplier_engagement_strategies.pdf)
- 學術研究（CDP 數據）：供應商參與度越高的企業，Scope 3 揭露品質分數越高 — [Li, Business Strategy and the Environment (Wiley)](https://onlinelibrary.wiley.com/doi/full/10.1002/bse.71453)
- WBCSD PACT 官方頁面：5,000+ 家企業、48+ 套 PACT conformant 軟體、計算出 4+ 百萬筆 PCF — [WBCSD PACT](https://wbcsd.org/actions/partnership-for-carbon-transparency-pact)
- PACT Methodology v3.0 於 2025-04-30 發布（v2 撤回）；Technical Specifications v3.0.3（2025-11）定義資料模型與 HTTP REST API — [greencalculus（secondary）](https://greencalculus.com/standards/wbcsd-pathfinder-framework/)
- Catena-X PCF Rulebook v4（2025-09）與 WBCSD Pathfinder／PACT 對齊，資料模型依循 PACT 技術規格 — [Catena-X PCF Rulebook v4](https://catena-x.net/wp-content/uploads/2025/10/Catena-X-Product-Carbon-Footprint-Rulebook_v4-with-line-numbers.pdf)；[PACT 收錄 Catena-X rulebook](https://www.carbon-transparency.org/resources/catena-x-product-carbon-footprint-rulebook)
- Catena-X 的「active participants」（實際透過生態系交換數據的 OEM 與供應商）從 2025-12 的 182 家成長到 2026-09 的 1,069 家；協會會員 195 家。大型 OEM（Ford、BMW、VW、Mercedes）已大量交換數據，但許多中小企業因初期投入成本仍在觀望 — [Automotive Logistics](https://www.automotivelogistics.media/supply-chain/more-thannbsp1000-oems-and-suppliers-now-exchanging-data-through-catena-x-network/2746686)
- 德國經濟部 Data Space Accelerator 補貼中小企業接入 Catena-X，每個 use case 補助 €15,000，最高 €30,000，2026 年底截止（總額說法為 €23M，各來源數字略有差異）— [Cofinity-X blog](https://www.cofinity-x.com/blog/data-space-accelerator-helps-smes-join-catena-x-with-up-to-eu30-000)
- Cofinity-X（Catena-X 首家營運商）沒有公開固定價格，依集團營收計價；接入技術是 EDC（Eclipse Dataspace Components）connector — [Cofinity-X price info](https://www.cofinity-x.com/price-info)；[Cofinity-X onboarding](https://www.cofinity-x.com/blog/new-to-catena-x-well-help-you-get-connected)
- 具體 PCF 案例：Ford 與 Flex 在 CES 2024 啟動第一條 Catena-X 初級 Scope 3 CO₂ 數據鏈，2025 Hannover Messe 擴展到 Flex 的二階供應商 Micron — [Automotive Logistics](https://www.automotivelogistics.media/supply-chain/more-thannbsp1000-oems-and-suppliers-now-exchanging-data-through-catena-x-network/2746686)
- BASF 透過 PACIFIC 平台在 Catena-X 上交換 PCF，並參與 PACT、Catena-X、ESTAINIUM 等協會（AWS 廠商案例，屬自述）— [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/pacific-enables-multi-tenant-sovereign-product-carbon-footprint-exchange-on-the-catena-x-data-space-using-aws/)

### Inferences
- 交換「格式」已經不是問題（PACT v3 + Catena-X + EN 18216 系列）。新工具不應再造一套資料標準，而應該做「PACT 相容」的層，解決兩件事：(1) 中小企業低成本產出第一份 PCF；(2) 讓接收方可以驗證 PCF 的計算依據與初級數據比例（primary data share）。
- PACT 規格本身靠的是「傳遞數字＋自我聲明的驗證狀態」。數據可信度主要靠第三方 assurance，可以用可驗證憑證或簽章，把「誰算的、用哪些係數、哪些是初級數據」綁到 PCF 上。

### Gaps
- 找不到 PACT 網路上實際「跨公司交換」的 PCF 筆數（4M 是「計算」筆數）。
- 找不到 Estainium、SINE Foundation、Manufacture-X 2025–2026 的具體採用數字。
- 找不到「Scope 3 占企業總排放 75%+」的 CDP 原始出處；可用 26 倍這個數字替代。

---

## Q3. 產品綠色宣稱與漂綠的證據（EU 2020 調查、Higg Index、再生塑膠、mass balance、塑膠信用）

### Takeaway
官方調查顯示一半以上的綠色宣稱模糊或無法證實，而且產業工具本身（Higg MSI、mass balance、plastic credits）也受到監管機構或研究挑戰。問題的核心通常不是「資料被竄改」，而是「宣稱和物理事實脫鉤」（例如一律套用平均值、會計上的分配）。

### Cited Findings
- 歐盟執委會 2020 年研究：53.3% 的環境宣稱模糊、誤導或沒有根據，40% 無法證實 — [EC Green claims 頁](https://environment.ec.europa.eu/topics/circular-economy/green-claims_en)；[EEAS](https://www.eeas.europa.eu/node/427665)
- 2020-11 CPC 網絡掃查 344 項宣稱：42% 被主管機關合理懷疑為虛假或欺騙，57.5% 的業者沒有提供足夠資訊供判斷 — [EBF green claims PDF](https://www.ebf.eu/wp-content/uploads/2023/01/Green_claims.pdf)
- 2022 年挪威消費者局認定 Norrøna 用 Higg MSI 宣稱有機棉 T 恤環境衝擊較低屬誤導且違法，並警告 H&M；SAC 因此暫停 Higg 消費者端透明計畫。之後 H&M 與 Decathlon 向荷蘭 ACM 承諾改善，並分別捐款 €400,000／€500,000（屬 2022 較舊事件）— [Business of Fashion](https://www.businessoffashion.com/articles/sustainability/hm-norrona-norway-sustainability-environmental-marketing-higg)；[Just Style](https://www.just-style.com/news/hm-group-decathlon-in-new-green-claims-commitment-to-avoid-misleading-consumers/)；[Apparel Resources](https://apparelresources.com/business-news/sustainability/sac-hm-norrona-pause-use-higg-index/)
- Mass balance 爭議：ProPublica 調查發現，標示 20–30% 再生料的產品實際含量不到 1%。美國 EPA（2024）把 mass balance 排除在 Safer Choice 計畫之外 — [ProPublica](https://www.propublica.org/article/epa-rejects-mass-balance-plastics-recycling-safer-choice)
- 「free allocation（自由分配）」讓企業可以把再生料額度隨意分配給任一產品，被批評極易漂綠。2025-11 美國化學理事會（ACC）起訴科羅拉多州衛生部，因為後者在包裝 EPR 計畫中建議不採用 free allocation — [Packaging Dive](https://www.packagingdive.com/news/colorado-mass-balance-lawsuit-epr-plans/817477/)；[NRDC](https://www.nrdc.org/bio/renee-sharp/plastics-industrys-latest-deception-mass-balance)
- 2025-05 Mondelez 收到股東提案，要求證實 Triscuit 包裝的再生料宣稱 — [Grist](https://grist.org/accountability/recycled-packaging-triscuit-mondelez-mass-balance-chemical-recycling/)
- 2026-01-27 歐洲聯合調查報導：靠 mass balance 認證、標示「最高 100% 再生」的食品包裝 — [Food Packaging Forum](https://foodpackagingforum.org/news/investigation-criticizes-consumer-and-retail-brands-marketing-fossil-plastics-as-green-plastics)
- 學術回顧：化學回收的再生分子和原生分子無法區分，再生含量的量化遠比機械回收困難 — [ScienceDirect review 2025](https://www.sciencedirect.com/science/article/pii/S0921344925003040)
- 塑膠信用（plastic credits）：Eunomia 為 Fauna & Flora 所做的研究指出 additionality（額外性）問題，很多專案在發行信用之前早已運作；「plastic neutral」宣稱可能誤導消費者。Verra、PCX、Plastic Bank 遊說聯合國塑膠公約納入塑膠信用 — [Fauna & Flora/Eunomia 2024](https://fauna-flora.org/wp-content/uploads/2024/11/fauna-flora-exploring-plastic-credits-report-v4.pdf)；[Trellis](https://trellis.net/article/plastic-credits-rising-criticism/)；[Eunomia white paper 2024-04](https://trashhero.org/wp-content/uploads/2024/05/2024APR22_Eunomia-Plastic-Credits-White-Paper.pdf)

### Inferences
- 漂綠多半是「方法論漏洞」（平均值、自由分配、無額外性），不是「資料庫被竄改」。區塊鏈的不可竄改性只能解決後者。作品若要對漂綠有說服力，必須把「宣稱→計算方法→初級證據」整條鏈公開且可驗證，並在規則層（例如禁止 free allocation、要求初級數據比例）做限制。
- ECGT 自 2026-09-27 適用，「carbon neutral」這類泛用宣稱必須有證據，品牌對「可稽核的宣稱證據包」會有立即需求。

### Gaps
- 找不到針對 Plastic Bank 本身的獨立調查報導。
- 找不到 2025 年針對「化學回收再生料宣稱」的正式詐欺執法案。
- 塑膠廢棄物出口（Basel 塑膠修正案後）的最新數據沒有搜到。

---

## Q4. 既有區塊鏈／溯源專案：成功、失敗、限制

### Takeaway
失敗的原因幾乎都不是技術：TradeLens 敗在競爭對手不願把數據放進對手主導的平台，加上定價過高；Everledger 敗在融資斷鏈。存活下來的專案大多收斂成「窄場景＋標準（GS1/EPCIS、PACT）＋願意分享的夥伴」，而且坦承「物理→數位」連結（oracle problem）仍是最大弱點。學術文獻也指出 oracle problem 很少被認真處理。

### Cited Findings
- **TradeLens（Maersk+IBM，Hyperledger Fabric，2018 年上線）**：2022-11 宣布關閉，2023 Q1 前下線；Maersk 稱未達商業可行性。競爭航商拒絕在 Maersk 共同擁有的平台上分享營運數據；巴塞隆納港專家指出客戶要溯源，但不願付 TradeLens 提出的高額附加費，依可見度分級的節點設計也讓數據治理變得模糊 — [PierNext (Port de Barcelona)](https://piernext.portdebarcelona.cat/en/technology/the-closure-of-tradelens)；[GetTransport](https://blog.gettransport.com/ibm-and-maersk-shut-down-tradelens-end-of-the-blockchain-shipping-venture/)
- **IBM Food Trust**：Walmart 芒果溯源從約 7 天縮短到 2.2 秒（benchmark，有人質疑代表性）— [LF Decentralized Trust Walmart case](https://www.lfdecentralizedtrust.org/case-studies/walmart-case-study)。2025 年學術章節列出的限制包括整合成本、利害關係人不願揭露資訊、可擴展性 — [ScienceDirect chapter 2025](https://www.sciencedirect.com/science/chapter/bookseries/abs/pii/S0065245825001391)。採 GS1 標準，資料上傳者決定誰可以看 — [Supply Chain Dive (2018，舊)](https://www.supplychaindive.com/news/IBM-Food-Trust-SaaS-available-Carrefour/539065)
- **Everledger**（鑽石、電池溯源）：既有投資人未履行第二輪注資，公司進入自願管理（voluntary administration），Crunchbase 列為已關閉 — [Startup Daily](https://www.startupdaily.net/topic/business/brisbane-blockchain-provenance-startup-everledger-placed-in-administration-after-funding-evaporates/)；[Ledger Insights](https://www.ledgerinsights.com/everledger-bankruptcy-esg-blockchain-traceability/)
- **Circulor（Volvo/Polestar）**：2020 年 Volvo Tech Fund 投資，宣稱 XC40 Recharge 鈷 100% 可追溯，之後擴大到 8 種礦物（皆屬公司自述，沒有獨立稽核；2020 年資料較舊）。Circulor 自己也承認原物料在加工過程中會轉化，很難可靠地標記 — [Volvo Cars press release](https://www.volvocars.com/intl/media/press-releases/694015D900D5CAE4/)；[EU Circular Economy Platform good practice](https://circulareconomy.europa.eu/platform/en/good-practices/volvo-cars-ev-battery-materials-traceability)；[Trellis](https://trellis.net/article/startup-helping-volvo-trace-ev-battery-materials/)
- **GBA 電池護照試點的關鍵數據**：試點可能只追蹤到約 1–2% 的電池實體質量，卻收集到總電池碳足跡的 50–95%。也就是說，「按質量溯源」和「按排放數據溯源」的覆蓋程度差非常多 — [GBA Battery Passport pilot master](https://www.globalbattery.org/media/pilot/documents/gba-bp-pilot-master.pdf)
- **OpenSC（WWF/BCG 共同創立）**：主打驗證棕櫚果是否來自合法、零毀林的種植園 — [OpenSC](https://opensc.org/)；[Wikipedia](https://en.wikipedia.org/wiki/OpenSC_(company))
- **OriginTrail**：定位在 EV 電池 DPP 與知識圖譜（DKG），近期重新定位成「verifiable AI」，但沒有找到可量化的 2025 部署成果 — [OriginTrail](https://origintrail.io/)；[EV Report（宣傳性質）](https://theevreport.com/origintrail-revolutionizes-sustainability-in-electric-vehicle-batteries)
- **VeChain**：競爭者比較站指其治理較中心化（非一手來源，請斟酌）— [OTHub deepdive](https://deepdive.othub.io/foundation/competitors/blockchain-and-supply-chain-solutions)
- **學術**：系統性回顧（70 篇，篩自 1,944 筆紀錄）指出前三大障礙是財務限制、利害關係人缺乏協作、抗拒改變與負面觀感 — [Emerald chapter](https://www.emerald.com/books/edited-volume/16997/chapter/93993598/Exploring-Blockchain-Adoption-Barriers-A)。PRISMA 回顧（53 篇，2022）指出主要挑戰是交易成本高、利害關係人之間缺乏信任 — [IGI Global](https://www.igi-global.com/article/a-systematic-review-of-the-adoption-of-blockchain-for-supply-chain-processes/297625)。2024 年論文指出，區塊鏈和真實世界的互動要靠 oracle，評估區塊鏈對永續的效果必須先處理 oracle problem，但文獻很少討論 — [Publinova: Overcoming the blockchain oracle problem](https://publinova.nl/nl/product/overcoming-the-blockchain-oracle-problem-in-the-traceability-of-non-fungible-products)。2026 年章節：政策關注度上升，但企業採用區塊鏈的情況仍然有限 — [ScienceDirect chapter](https://www.sciencedirect.com/science/chapter/bookseries/abs/pii/S0065245825001391)
- OpenEPCIS（GS1 EPCIS 開源社群）發表文章，直言區塊鏈溯源「理論上迷人，實務上行不通」— [OpenEPCIS PDF](https://openepcis.io/blog/blockchain-traceability.pdf)
- 新研究方向：OreProof 用零知識證明做關鍵礦物供應鏈「有限揭露的可驗證來源」— [arXiv 2609.00340](https://arxiv.org/pdf/2609.00340)

### Inferences
- 給黑客松的「失敗清單」：(1) 單一競爭者主導的治理（TradeLens）；(2) 對參與者的定價高於他們得到的價值；(3) 為了「上鏈」而上鏈，沒有解決物理到數位的連結；(4) 依賴創投資金卻沒有法規驅動的付費方（Everledger）。2026 年最大的不同是 DPP、電池護照、CBAM、EUDR 讓「付費方」出現了（進口商、品牌必須合規）。
- 中立治理加上選擇性揭露（ZK 或 VC）可以直接回應「競爭者不願分享數據」的問題：證明「符合條件」而不揭露供應商名單或配方。

### Gaps
- IBM Food Trust 在 2024–2026 是否仍營運、是否已轉手，找不到可靠資料。
- 沒有搜到 Provenance、TextileGenesis、Minespider、RCS Global／Re|Source、Kezzler、Morpheus.Network、farmer connect、Agrotrace、Trace4Value、Hedera 系溯源的 2025–2026 成果或失敗數據。
- VeChain 與 Walmart China 的合作現況沒有搜到。
- Everledger 進入管理程序的確切日期（約 2022 年底到 2023 年）未逐字確認。

---

## Q5. 物理與數位的連結技術：同位素、DNA 標記、衛星監測、AI 文件驗證

### Takeaway
真正能「抓到造假」的是測試產品本身的鑑識技術（同位素、DNA 標記）和不需要供應商配合的遙測或交易數據分析。它們和帳本是互補關係：帳本記錄宣稱，鑑識技術抽查並驗證宣稱。美國 CBP 已把同位素檢測用於 UFLPA 執法，抽測結果一再顯示宣稱和事實落差很大。

### Cited Findings
- Oritain 與 CBP 簽有獨家合約（sole-source），檢測棉製品是否和新疆等高風險地區一致。Oritain 2021 年對 1,000 件服飾的研究顯示，約 16% 的美國樣本和新疆棉一致（自報數據）。這個方法檢測產品本身，不需要供應商配合 — [Oritain/TDS filing on regulations.gov](https://downloads.regulations.gov/DHS-2022-0001-0169/attachment_1.pdf)
- Reuters 透過 FOIA 取得 CBP 檢測結果：其中一批 86 件服飾有 13 件（約 15%）和新疆棉一致。2025 年 CBP 官員 Eric Choy 在眾議院聽證會表示會擴大同位素檢測 — [WWD/Sourcing Journal](https://wwd.com/sourcing-journal/industry-news/uflpa-hearing-forced-labor-enforcement-isotopic-testing-oritain-de-minimis-1238827687/)
- Bloomberg 2025-11 檢測 42 件輸美服飾，90% 帶有新疆棉特徵 — [Fashion Law Journal](https://fashionlawjournal.com/xinjiang-cotton-de-minimis-shipments-and-the-uflpa-entity-list-why-shein-still-isnt-there/)
- Applied DNA Sciences 與 Stratum Reservoir 的 CertainT 報告：2023-02 到 2024-03 測試樣本中 19% 顯示新疆來源 — [Just Style](https://www.just-style.com/news/xinjiang-cotton-widespread-despite-us-uflpa-legislation/)
- Haelixa DNA 標記：2025-11 用於 New Focus Textiles 的工業後與消費後棉廢料，以 PCR 在認證實驗室驗證「再生棉」宣稱；Soorty 2025-08 擴大用於 Second Life 再生棉；C&A 用於有機棉 — [Haelixa](https://haelixa.com/news/recycled-cotton-verification-with-dna-technology/)；[WWD/Soorty](https://wwd.com/sourcing-journal/sj-denim/soorty-haelixa-dna-tracers-second-life-recycled-cotton-1238854331/)；[Just Style C&A](https://www.just-style.com/news/c7a-haelixa-cotton-traceability/)
- 哥倫比亞咖啡生產者聯合會擁有約 180 萬筆咖啡地塊的地理參照資料庫，以及近 50 萬戶咖啡家庭的社經資料，因此在 EUDR 上領先非洲和亞洲部分地區 — [Mongabay 2026-03](https://news.mongabay.com/2026/03/colombias-coffee-industry-well-placed-but-wary-as-eu-deforestation-rule-looms/)

### Inferences
- 好的架構是「鑑識抽樣＋衛星或遙測＋帳本記錄＋AI 交叉比對」。帳本不負責「證明真實」，而是讓宣稱可被追責：誰在什麼時間簽了什麼宣稱，日後抽測不合就能追到簽署者。
- CBP 靠交易數據與公司登記交叉比對抓到下層曝險（見 Q1 Sayari）。AI 實體解析（entity resolution）和文件比對是可以和帳本搭配的「數位端 oracle」。

### Gaps
- 衛星毀林監測（Global Forest Watch、Satelligence、Starling）與 EUDR 的整合數據、準確率、誤報率，本次沒有搜到。
- AI 文件驗證（發票、驗證報告、CBAM 排放報告）的實際準確率或案例，沒有搜到可靠來源。

---

## Q6. 循環經濟：電子廢棄物、電池二次利用、紡織回收、EPR 數據

### Takeaway
回收率數字很低，而且多數物料流向沒有紀錄：全球電子廢棄物只有 22.3% 有紀錄地被妥善回收，衣物纖維對纖維回收不到 1%。EU 正在用 EPR（紡織 2028）與「分類收集後即為廢棄物」的定義堵住假二手出口。EPR 與再生料比例揭露都需要「物料流向」數據，這和 DPP 直接相連。

### Cited Findings
- 2024 全球電子廢棄物監測（UNITAR/ITU，2022 年數據）：2022 年產生 6,200 萬噸（比 2010 年多 82%，人均 7.8 kg），只有 22.3% 有紀錄地正式回收，未回收的資源價值 620 億美元。預估 2030 年達 8,200 萬噸，回收率降到 20%；產生量的成長速度約是正式回收的 5 倍。歐洲人均 17.6 kg，回收率 42.8% 最高 — [UNITAR press release](https://unitar.org/index.php/about/news-stories/press/global-e-waste-monitor-2024-electronic-waste-rising-five-times-faster-documented-e-waste-recycling)；[ITU](https://www.itu.int/en/ITU-D/Environment/Pages/Publications/The-Global-E-Waste-Monitor-2024.aspx)
- 紡織：Ellen MacArthur Foundation 指出，用來製造衣物的材料不到 1% 被回收成新衣物（研究年份約 2015–2017，較舊）；Textile Exchange 表示全球纖維市場中來自再生紡織品的仍不到 1% — [recovery-worldwide](https://www.recovery-worldwide.com/en/artikel/the-limitations-of-textile-recycling_3411757.html)；[Innovation Forum agenda](https://innovationforum.co.uk/conferences/sustainable-apparel-and-textiles-conference/agenda/day-2/t2t-recycling/)
- EU 廢棄物框架指令（WFD）紡織修訂：2025-09-09 歐洲議會通過，2025-10-16 生效。所有分類收集的紡織品一律視為廢棄物，以防止「可再用品」名義的非法出口。成員國須在 2027-06-17 前轉化為國內法，2028-04-17 前建立紡織與鞋類 EPR — [Beveridge & Diamond](https://www.bdlaw.com/publications/eu-targets-textile-waste-with-waste-framework-directive-amendments/)；[CMS](https://cms.law/en/esp/legal-updates/eu-parliament-approves-new-measures-on-textile-waste-what-manufacturers-retailers-and-e-commerce-sellers-need-to-know)
- 電池護照須揭露化學組成、原料來源、碳足跡、耐用度、效能、回收與拆解指引；電池生命週期（含二次利用）追蹤是設計重點 — [Reccessary 2026-09-07](https://www.reccessary.com/zh-tw/news/Taiwan-Digital-Product-Passport)；[dlt.mobi battery track & trace](https://dlt.mobi/battery-trackandtrace/)
- 台灣《資源循環推動法》（2026-06 三讀）第 22 條參考歐盟 DPP，環境部未來可以指定物品揭露再生料比例、材質流向與再利用方式 — [Reccessary 2026-09-07](https://www.reccessary.com/zh-tw/news/Taiwan-Digital-Product-Passport)

### Inferences
- 「再生料比例」會同時被 ESPR、台灣資源循環推動法、EPR 費率、ECGT 綠色宣稱要求。一個能證明再生料來源（回收商出貨→再生料廠→品牌）的質量守恆帳本（拒絕 free allocation）有明確的法規需求。
- 電池二次利用需要的是「同一顆電池換手後，健康狀態（SoH）與歷史紀錄可信地延續」。這是 DPP 結合簽章紀錄的典型場景。

### Gaps
- Basel 公約塑膠修正案、電子廢棄物非正式回收（informal recycling）的 2024–2026 最新流向數據沒有搜到。
- 電池二次利用市場規模與追蹤失敗案例沒有搜到可靠來源。

---

## Q7. 台灣／亞洲：電子與半導體 Scope 3 壓力、中小企業碳盤查與碳足跡、CBAM（螺絲扣件）、電池護照、台灣 DPP

### Takeaway
台灣處在 Apple 等品牌 Scope 3 要求和歐盟 CBAM／電池護照的交會點：扣件業約 2,600 家受影響、多數是中小企業。螺帽碳排有 95% 來自原料和運輸，所以問題在上游鋼材數據，不在工廠內部。官方碳足跡標籤只有約 600–900 件，量能遠遠不夠。環境部的台灣 DPP 試行規模還小（29 家企業、2 萬筆），業者擔心的是「數據被抄襲」和「收到假數據」。這正是信任基礎設施的切入點。

### Cited Findings
- **Apple 供應鏈**：Apple 目標 2030 年供應鏈與產品生命週期碳中和，要求供應商用 100% 再生電力生產 Apple 產品。台灣企業在 Apple 供應商中占比特別高；TSMC 承諾 2030 前全面使用再生能源，2022 年和 Ørsted 簽下 20 年離岸風電購電合約；ASE 也加入供應商清潔能源計畫。2018 年 Apple 推動台灣修法，開放企業購買再生能源憑證（資料偏 2020–2022，較舊）— [Apple Supplier Clean Energy 2021 update](https://www.apple.com/environment/pdf/Apple_Supplier_Clean_Energy_Program_Update_2021.pdf)；[Al Jazeera 2020](https://www.aljazeera.com/amp/economy/2020/8/12/is-apple-green-not-until-its-taiwanese-suppliers-cut-emissions)；[Quartz](https://qz.com/1897345/apple-is-overhauling-the-renewable-energy-market-in-taiwan)；[ASE](https://www.aseglobal.com/press-room/ase-technology-holding-joins-apples-supplier-clean-energy-program-2)
- **扣件業與 CBAM**：2023 年台灣扣件出口超過 47.7 億美元，約 25% 銷往歐盟；出口量全球第 2、出口值全球第 3。上游線材、電鍍廠的排放數據必須由供應商提供（工研院何明豐，2024-09-12；文中「年度申報 5/31」是 Omnibus 之前的規則，現行首次申報期限是 2027-09-30）— [海基會兩岸經貿網](https://www.seftb.org/cp-4-2372-391e3-1.html)
- 台灣約 2,600 家業者受 CBAM 影響，以金屬加工中小企業為主，鋼材與扣件中小型加工業者首當其衝（2026-04 報導）。50 公噸豁免門檻是以歐盟進口商為單位計算，所以台廠即使出口量小，仍可能被要求提供數據 — [康林轉載報導](https://www.kanglin.com.tw/news/%E6%AD%90%E7%9B%9Fcbam%E4%B8%8A%E8%B7%AF-%E5%BD%B1%E9%9F%BF%E7%B4%842600%E5%AE%B6%E4%BC%81%E6%A5%AD-%E9%8B%BC%E6%9D%90%E3%80%81%E6%89%A3%E4%BB%B6%E4%B8%AD%E5%B0%8F%E5%9E%8B%E5%8A%A0%E5%B7%A5%E6%A5%AD/)；[CSRone](https://csrone.com/news/9005)
- 螺絲業者表示：工廠用油、用電只占螺帽碳排的 5%，95% 來自原料和運輸 — [公視《我們的島》](https://ourisland.pts.org.tw/content/10445)
- 經濟部 2023-11 公布金屬製品業碳盤查指引，並舉辦試填工作坊，協助業者申報 CBAM — [中央社](https://www.cna.com.tw/news/afe/202311130065.aspx)
- 台版 CBAM：環境部優先推動水泥與鋼鐵，水泥 6 項產品已列管，預計 2026 上半年完成法規後試申報（2025 年報導）— [中小企業減碳服務站](https://www.sme.gov.tw/caas/article-caas-3009-18379)
- **中小企業碳盤查困境**：業者引述經濟部數據，150 萬家以上中小企業中，約 19 萬家因供應鏈或外銷需求必須做碳盤查（屬引述，非官方原始統計）。台大風險社會與政策研究中心「2025 企業永續揭露準備度調查」（對象為營收 1 億元以上企業）發現，供應鏈碳盤查與減量目標甚至出現退步。綠色和平 2022 年調查：7 成中小製造業不了解碳盤查方式與查驗規範，近 6 成認為政府輔導不足。商研院 2025 年培育超過 2,000 名會計師、記帳士擔任碳健檢服務人員 — [數位時代 bnext](https://www.bnext.com.tw/article/80226/carbon-footprint-verification-tw)；[經濟日報](https://money.udn.com/money/story/5635/9089325)；[數位時代 綠色和平調查](https://www.bnext.com.tw/article/69224/greenpeace-carbon-pricing)
- **台灣碳足跡標籤**：環境部 2025-03-19 發布「自願性產品碳足跡核定標示及管理辦法」，核定效期縮為 2 年，誇大減碳最高罰 100 萬 — [環境部新聞](https://enews.moenv.gov.tw/Page/3B3C62C78849F32F/40e3476c-622a-4d1b-acf9-014e40bd312f)；[Reccessary](https://www.reccessary.com/zh-tw/news/new-carbon-footprint-label-2)。2025-03 有效碳足跡標籤 636 件 — [旺得富](https://wantrich.chinatimes.com/news/20250320900577-420501)。產品碳足跡資訊網首頁統計：碳標籤 921 件、PCR 209 件、業者 246 家、碳係數 1,164 項（沒有標註日期）— [產品碳足跡資訊網](https://cfp-calculate.tw/cfpc/Carbon/WebPage/OrganizationApplyList.aspx)；係數開放資料 — [data.gov.tw](https://data.gov.tw/dataset/28176)
- **台灣 DPP 試行**（Reccessary 2026-09-07）：試行約 4 年，涵蓋電池、紡織品、電腦及網路設備、循環材料 4 大類，29 家企業參與，累積超過 2 萬筆產品資訊。環境部已完成 DPP 開源模組，並和歐洲 DPP 服務商做過跨境互通測試。目前以自願導入為主，預計 2027-02 起討論制度、03 月預告通案原則。台灣電池協會秘書長呂學隆指出，電動自行車與無人機電池模組是台灣在歐洲的重要產品，中小企業需要方向與指引。紡織業拓展會指出，紡織供應鏈長，要從化纖一路追溯到回收，中小企業缺乏數位化能力和人力。業者擔心方案或數據被抄襲、收到假數據；環境部提出第三方認證和揭露控管作為因應 — [Reccessary](https://www.reccessary.com/zh-tw/news/Taiwan-Digital-Product-Passport)

### Inferences
- 台灣場景的三個具體痛點：(1) 扣件／金屬加工中小企業需要「產品層級嵌入排放」，但 95% 的排放在上游鋼材，必須取得中鋼等上游可信的分配數據並向下傳遞；(2) 電子與半導體供應鏈面對 Apple 等品牌和 Catena-X/PACT 的 PCF 交換要求，需要和 PACT 相容的輸出；(3) 電池模組廠（e-bike、無人機）2027-02 前要交出電池護照數據。
- 環境部 DPP 試行點出的「怕抄襲、怕假數據」正對應選擇性揭露（ZK/VC）加上簽章溯源。可以把作品定位為「和台灣 DPP 開源模組、EU EN 18216/18219 相容的信任層」。

### Gaps
- 岡山扣件聚落的具體家數、中小企業比例、CBAM 實際成本，沒有找到 2025–2026 一手數據。
- 台版 CBAM 鋼鐵產品列管名單是否已公布，未確認。
- 台灣碳費（2026 年首次收費）對供應鏈數據需求的影響，本次沒有查。
- Apple 2025–2026 最新供應商清潔能源進度、台灣綠電供給缺口的最新數據，沒有搜到。
- 中鋼是否提供客戶產品層級碳排（含 CBAM 格式）數據，沒有查到。

---

## Q8. 具體未滿足需求：新工具在哪裡有真正用處

### Takeaway
證據指向四個缺口：(1) 小農與生產者組織沒有能力、也沒有誘因產出 EUDR 地理座標；(2) 中小企業產不出經驗證的 PCF 或 CBAM 嵌入排放，只能被迫用加價的預設值；(3) DPP 資料的「認證、完整性、存取權限」標準和實施法案還沒到位；(4) 供應商自報數據缺乏可信度，競爭者也不願揭露。新工具應該是「低成本產出加上可驗證加上選擇性揭露」的信任層，並和既有標準（PACT、EPCIS、EN 18216 系列、TRACES）相容，而不是另起一條封閉的鏈。

### Cited Findings
- **EUDR 小農**：Ghana 等可可依賴國的地理座標成本主要落在小農身上，而且小農遵循了也看不到溢價 — [Wiley Env. Policy & Governance](https://onlinelibrary.wiley.com/doi/full/10.1002/eet.70150)。18 份訪談研究指出負擔不成比例、市場排除與整併壓力 — [Braun, BSE (Wiley)](https://onlinelibrary.wiley.com/doi/full/10.1002/bse.71586)。不合規可可會流向標準較低的市場，而不是退出貿易 — [Preprints](https://www.preprints.org/frontend/manuscript/aa593349d784ffd284c5fa27b0716d49/download_pub)。全球 1,250 萬座咖啡農場中 85% 是小農 — [Coolx](https://coolx.earth/en/blog/eudr-and-coffee-a-practical-guide-for-exporters-and-importers)。生產者組織光是收集地理座標就要 €5,000–15,000；執委會 2026-05 簡化方案預估中小企業合規成本總計降 75%（產業來源）— [eProd Solutions](https://www.eprod-solutions.com/articles/is-eudr-cocoa-compliance-priced-for-the-african-market)。高可可價格讓合規合作社更難收到豆子 — [Mongabay 2024-12](https://news.mongabay.com/2024/12/uncertainty-amid-eudr-delay-poses-challenges-for-cocoa-companies-farmers/)
- **中小企業 PCF／CBAM**：Catena-X 中小企業因初期成本觀望，政府要補貼 €15k–30k 才能推動接入 — [Automotive Logistics](https://www.automotivelogistics.media/supply-chain/more-thannbsp1000-oems-and-suppliers-now-exchanging-data-through-catena-x-network/2746686)；[Cofinity-X](https://www.cofinity-x.com/blog/data-space-accelerator-helps-smes-join-catena-x-with-up-to-eu30-000)。CBAM 預設值加價 10%→30%，要用實際值必須經第三方驗證並現場稽核 — [cbamguide](https://cbamguide.com/compliance/default-values/)；[crediblesg](https://www.crediblesg.com/blogs/leveraging-ai-and-circular-practices-in-cbam-supplier-assessment/)。台灣中小企業在第一步碳盤查就卡關、沒有案例可以參考 — [經濟日報](https://money.udn.com/money/story/5635/9089325)
- **DPP 互通與信任**：認證與完整性（prEN 18246）、存取權限（prEN 18239）仍是草案 — [CDX](https://public.cdxsystem.com/web/cdx/w/eu-digital-product-passport-technical-framework-takes-shape-with-registry-launch)；電池 77(9) 存取權限實施法案延遲 — [eudigitalproductpassport.org](https://eudigitalproductpassport.org/updates/battery-passport-access-rights-implementing-act-delay)；OEM 仍靠試算表和問卷 — [Sibros](https://www.sibros.tech/post/navigating-the-eu-battery-passport-what-oems-need-to-know-before-2027)
- **供應商數據可信度與競爭者揭露**：TradeLens 敗在競爭者不願分享 — [PierNext](https://piernext.portdebarcelona.cat/en/technology/the-closure-of-tradelens)；台灣 DPP 業者怕抄襲、怕假數據 — [Reccessary](https://www.reccessary.com/zh-tw/news/Taiwan-Digital-Product-Passport)；同位素抽測一再顯示宣稱和實際有 15–90% 落差（依樣本而異）— [WWD](https://wwd.com/sourcing-journal/industry-news/uflpa-hearing-forced-labor-enforcement-isotopic-testing-oritain-de-minimis-1238827687/)；[Fashion Law Journal](https://fashionlawjournal.com/xinjiang-cotton-de-minimis-shipments-and-the-uflpa-entity-list-why-shein-still-isnt-there/)
- **既有成功的反例**：哥倫比亞咖啡聯合會的地理參照資料庫，顯示由產業組織集中維護的地塊登錄可以讓整國小農領先 — [Mongabay 2026-03](https://news.mongabay.com/2026/03/colombias-coffee-industry-well-placed-but-wary-as-eu-deforestation-rule-looms/)

### Inferences（可轉化為黑客松題目的需求假說）
1. **EUDR「合作社層級地塊護照」**：手機 GPS 或多邊形採集（≤4ha 只需單點），以衛星毀林圖層自動比對 2020-12-31 基準，產出可簽章的地塊憑證，經合作社彙整後輸出 TRACES DDS 所需欄位。選擇性揭露讓買家只看到「合規」，看不到農民個資。這是模仿哥倫比亞模式、但服務資源不足的產區。
2. **中小企業「可驗證 PCF/CBAM 嵌入排放」產生器**：用 AI 從電費單、原料發票、上游鋼材證書抽取活動數據，套用公開係數（例如台灣碳足跡係數庫、CBAM 預設值）計算，輸出 PACT v3 JSON 和 CBAM 通訊格式，並把初級數據比例與計算證據做雜湊上鏈或簽成 VC。量化賣點是「避免 10–30% 預設值加價」。台灣扣件業是現成場景（95% 排放在上游原料）。
3. **DPP／電池護照「信任層」**：在 EN 18216/18219 和台灣 DPP 開源模組之上，提供資料簽章、版本鏈、分級存取（呼應 prEN 18239/18246 的空白），以及「同一顆電池在二次利用換手後的歷史延續」。
4. **反漂綠「宣稱證據包」**：配合 ECGT（2026-09-27 適用），把每一條綠色宣稱連結到方法、初級證據、第三方抽測（同位素或 DNA），並禁止 free allocation 型的 mass balance 分配。
- 共同設計原則（從失敗案例反推）：中立治理、不要求競爭者共享原始數據（ZK/VC）、相容既有標準、對中小企業近乎零成本、付費方是有法規義務的進口商或品牌。

### Gaps
- 沒有找到中小企業「完成一份經驗證 PCF」的實際成本或時間的可靠統計（台灣或國際）。
- 沒有找到 EUDR 小農實際被排除出供應鏈的量化數據（例如被剔除的農戶數）。
- 衛星毀林監測用於 EUDR 的誤報率與爭議處理機制沒有查到。
