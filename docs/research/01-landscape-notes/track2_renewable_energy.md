# Track 2：再生能源系統、能源屬性憑證（EAC）與能源交易：現況、痛點、既有方案與未滿足需求

> 研究日期：2026-10-14。來源以 2024–2026 年為主，較舊的事實另有標示（[舊]）。多數數據來自二手報導或倡議團體，可信度問題寫在各條目旁邊。筆記中英混寫，最終報告為繁體中文。

---

## 1. 能源屬性憑證（REC / GO / I-REC / T-REC）的已知問題，以及 Scope 2 改版、24/7 CFE、顆粒化憑證的現況

### Takeaway
年度比對加上未綁定（unbundled）憑證，讓企業的帳面減碳遠大於實際減碳。研究指出約三分之二的宣稱減量很可能不具額外性。GHG Protocol 原本要把逐時比對（hourly matching）和可輸送性（deliverability）改成強制，但公眾諮詢反對聲浪很大，終版延到 2028 年底。逐時憑證的基礎設施仍在試點或升級階段，現有的 GO/REC 登記系統大多只能月度或年度核發。

### Cited Findings
**憑證額外性與漂綠**
- Bjørn et al.（Nature Climate Change, 2022）分析 115 家設有科學基礎減量目標（SBT）的企業，期間 2015–2019 年。企業宣稱的溫室氣體減量為 30%，計入實際減緩效果後只剩約 10%。約三分之二的宣稱減量來自「很可能未帶來額外再生能源」的憑證。PPA 型憑證較可能帶來新增再生能源。[舊, 2022] — [Scientific American](https://www.scientificamerican.com/article/renewable-energy-credits-allow-companies-to-overstate-emissions-reductions/)；[TechXplore](https://techxplore.com/news/2022-06-cases-entities-renewable-energy-certificates.html)
- 同期有兩篇相關論文：DOI 10.1038/s41558-022-01379-5（"RECs threaten the integrity of corporate SBTs"）與 10.1038/s41558-022-01385-7（較短的配套文章）。 — [Scientific American](https://www.scientificamerican.com/article/renewable-energy-credits-allow-companies-to-overstate-emissions-reductions/)
- Princeton ZERO Lab 的研究（Joule, 2024 年 1 月）：在美國現行政策下，年度體積比對（volumetric）與年度排放比對（emissions matching）對長期系統排放的影響「為零或接近零」。逐時比對是唯一能穩定降低系統排放的策略，也會帶動乾淨穩定電源（clean firm）與長時儲能的需求。報導指出逐時採購成本每 MWh 最多高約 20 美元。 — [Princeton Andlinger Center](https://acee.princeton.edu/acee-news/andlinger-center-speaks-companies-are-betting-on-a-new-approach-to-cleaning-up-electricity-grids/)；[Utility Dive](https://utilitydive.com/news/google-meta-clean-energy-procurement-zero-lab-24-7-carbon-matching/693108)；[Princeton "Buyer beware"](https://environmenthalfcentury.princeton.edu/research/2024/buyer-beware-most-clean-power-purchasing-strategies-do-little-cut-emissions)
- RMI 的 "Clean Power by the Hour" 研究認為，逐時比對的短期減排效益取決於區域電網組成。 — [Utility Dive](https://utilitydive.com/news/google-meta-clean-energy-procurement-zero-lab-24-7-carbon-matching/693108)
- Princeton 後續論文（Latitude Media 報導）：電網越乾淨，年度再生能源承諾的氣候意義越小。在高比例再生能源電網中，只有 24/7 乾淨電力比對有顯著減排效果。 — [Latitude Media](https://www.latitudemedia.com/news/corporate-electricity-purchases-arent-driving-down-emissions-like-they-used-to)

**對立陣營：Emissions First（Meta、Amazon 等）**
- Meta、Amazon 等企業在 2022 年底成立 Emissions First Partnership，主張依時間與地點的邊際排放做「排放比對（carbon matching）」，不採逐時 CFE。NewClimate、Beyond Fossil Fuels 等團體批評這是「把抵換模式重新包裝」。 — [NewClimate briefing (Oct 2024)](https://newclimate.org/news/briefing-247-renewable-electricity-matching-is-a-far-more-credible-approach-for-the-ghg)；[Beyond Fossil Fuels](https://beyondfossilfuels.org/2024/10/10/24-7-renewable-electricity-matching/)
- WattTime（自身有 carbon matching 產品，屬利害關係人）分析 Meta 2023 年資料：Meta 以超過 15 GW 長期合約做到 100% 年度比對，market-based 排放接近零。WattTime 也主張，若強制 100% 逐時比對，價差可能把價格敏感的企業逼出自願市場。 — [WattTime case study](https://watttime.org/news-and-insights/case-study-carbon-accounting-approaches-and-an-analysis-of-metas-2023-data-center-electricity-consumption-and-clean-energy-procurement/)

**GO 重複計算與詐欺案例**
- 冰島：媒體揭露重複宣稱（double claiming）後，歐洲發證機構協會（AIB）在 2023 年 4 月暫停冰島 GO 出口，之後解除，但聲明問題「尚未解決」，並建議冰島發證機構 Landsnet 發證前先向生產者取得確認。 — [AIB 2023 press release](https://www.aib-net.org/sites/default/files/assets/news-events/press-releases/2023/AIB-2023-BD-08%20Press%20release.pdf)；[Landsvirkjun](https://www.landsvirkjun.com/news/aib-suspends-all-exports-of-icelandic-gos)
- 冰島能源監管機關（ROE）的調查發現：截至 2022 年，冰島高耗能用戶都沒有足夠 GO 支撐自己的「使用再生能源」宣稱，但多數仍在行銷中這樣宣稱。ROE 認為規則沒有定義、也沒有禁止 double claiming，因此不構成違規。 — [Orkustofnun 報告](https://orkustofnun.is/en/news/medfylgjandi-er-stoduskyrsla-raforkueftirlits-orkustofnunar)；[Industry Decarbonization](https://industrydecarbonization.com/news/how-iceland-sold-the-same-green-electricity-twice.html)（獨立電子報，需留意立場）
- 挪威：德國律所 Becker Büttner Held 在 2021 年替奧地利公用事業 Verbund 分析挪威 GO 的重複計算問題，文件經德國資訊公開請求釋出。[舊] — [Industry Decarbonization](https://industrydecarbonization.com/misc/go.html)

**GHG Protocol Scope 2 改版（截至 2026-10）**
- 第一輪公眾諮詢期間為 2025-10-20 至 2026-01-31（曾延長）。草案內容：大型組織的 market-based 方法須逐時比對，取代現行「盡可能接近」的寫法；低於門檻的組織豁免、可沿用年度比對；提供負載曲線（load profile）作為缺乏逐時資料時的替代；另有既有合約祖父條款（legacy clause）與分階段實施。 — [GHG Protocol 諮詢回饋摘要 PDF (2026-07-29)](https://ghgprotocol.org/sites/default/files/2026-07/S2-PublicConsultationSummaryofFeedback-2026.07.29.pdf)；[nzero](https://nzero.com/blog/key-themes-from-the-scope-2-consultation-what-stakeholder-feedback-revealed/)
- 諮詢結果（Argus，2026-07-29）：共 1,072 份回應，來自 56 國。
  - 逐時比對（909 人）：70% 低度或不支持，22% 支持，7% 中立。
  - 小型組織豁免（748 人）：76% 支持。
  - 可輸送性（875 人）：59% 反對，30% 支持。
  - 祖父條款（801 人）：約 90% 支持。
  - "Standard supply service"（522 人）：49% 支持。
  - 反對主要來自企業與產業團體，地區上以南北美、東亞與東南亞為主。
  - 部分回應者認為立即強制逐時或在地比對會超出現有資料基礎設施與企業會計團隊的能力，也可能讓企業退出 RE100 等自願採購。
  — [Argus Media](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2858486-ghg-protocol-faces-pushback-on-scope-2-reforms)；[GHG Protocol summary](https://ghgprotocol.org/sites/default/files/2026-07/S2-PublicConsultationSummaryofFeedback-2026.07.29.pdf)
- 企業端：只有 12% 的企業支持逐時比對，82% 低度或不支持（單一二手來源）。 — [STX Group / 彙整](https://stxgroup.com/blogs/ghg-protocol-scope-2-revision-stakeholders-call-for-greater-accuracy-but-not-at-any-cost/)；[OneStopESG](https://onestopesg.com/esg-resources/article/ghg-protocol-scope-2-revision)
- EnergyTag 的分析（立場支持改革）：
  - 回應中 54% 匿名，企業的匿名比例達 70%；具名者支持逐時比對的機率是匿名者的兩倍以上。
  - 反對者有 84% 要求維持 "may not shall"（自願而非強制）。
  - 立訊（Luxshare）以不同名稱或地點提交了 12 份反對意見。
  - 大型科技公司中只有 Google 具名支持。
  - EnergyTag 指出，已有超過 10 TWh 正在做逐時與在地會計，超過 70 國即將透過升級後的登記系統取得逐時憑證。
  - 下一輪公眾諮詢預計 2027 年 Q2，終版標準延到 2028 年底（原訂 2027 年 Q4），主因是要與 ISO 整合。
  — [EnergyTag "Under the Hood"](https://energytag.org/under-the-hood-ghgp/)
- Argus 也報導 GHG Protocol 與 ISO 合併標準：聯合企業標準諮詢預計 2027 年 Q2，2028 年底出版。 — [Argus Media](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2858486-ghg-protocol-faces-pushback-on-scope-2-reforms)

**24/7 CFE 實踐者**
- Google 2025 環境報告（涵蓋 2024 年）：全球逐時 CFE 從 64% 升到 66%，同期用電成長 27%。20 個有 Google 資料中心的電網區中，9 個達到 80% 以上。目標是 2030 年在同電網、同小時 100% CFE。 — [edie](https://www.edie.net/google-posts-strong-progress-with-24-7-carbon-free-energy-goal/)；[sustainabilityreports.com](https://www.sustainabilityreports.com/alphabet/2025/environmental-report)
- Google 2026 環境報告（涵蓋 2025 年）：2025 年簽下超過 12 GW 新乾淨能源合約，創歷年最高；資料中心用電增加 37%，營運排放年減 2%。我沒有找到 2025 年 CFE% 的具體數字。2026 年 5 月 Google 高層表示逐時目標「仍維持」。 — [Google blog 2026 report](https://blog.google/company-news/outreach-and-initiatives/sustainability/2026-environmental-report/)；[Bloomberg Tax](https://news.bloombergtax.com/environment-and-energy/google-executive-says-moonshot-clean-energy-goal-is-intact)；[S&P Global (2026-09-03)](https://www.spglobal.com/energy/en/technology-ai-research-insights/blogs/googles-search-for-power-sustainability-is-yielding-results-but-ai-slows-progress)
- Microsoft：2025 年以年度比對達成 100% 再生能源，簽約乾淨電力 40 GW、分布 26 國，其中 19 GW 已上線。不過 Bloomberg 報導 Microsoft 正在考慮延後或放棄 2030 年 100/100/0 逐時目標。2020–2024 年碳足跡增加 23.4%；GeekWire 報導 2026 年報告排放增加約 25%。 — [DatacenterDynamics](https://datacenterdynamics.com/en/news/microsoft-matches-100-of-2025-power-use-with-renewables-with-more-than-40gw-of-contracted-capacity/)；[GeekWire 2026](https://www.geekwire.com/2026/microsofts-carbon-emissions-climb-25-as-tech-giants-grapple-with-ais-energy-toll/)；[WebProNews（引述 Bloomberg）](https://www.webpronews.com/microsofts-ai-boom-tests-its-climate-ambitions-as-24-7-carbon-free-power-pledge-faces-delay/)
- UN 24/7 CFE Compact：2023 年 4 月有 116 個簽署者 [舊]。2024 年首次進度調查發給 150 多個簽署者，36 個回覆，合計回報促成 459 TWh 無碳電力。 — [SEforALL case study](https://www.seforall.org/system/files/2023-06/rm-case-study-carbon-free-energy-005_0.pdf)；[gocarbonfree247](https://gocarbonfree247.com/resources/for-the-first-time-since-its-launch-in-2021-the-si/)

**顆粒化憑證（Granular Certificates）基礎設施**
- EnergyTag 自稱維護全球唯一規範逐時 EAC 核發與使用的自願標準，並發布 Granular Certificate Scheme Standard，讓 scheme operator 可接受第三方稽核。 — [CARB comment (EnergyTag, 2025-03)](https://ww2.arb.ca.gov/system/files/webform/public_comments/21871/SB%20253%20and%20261%20Public%20Comment%203.19.25.docx)；[gocarbonfree247 case study](https://gocarbonfree247.com/case-studies/energytag)
- LevelTen Registry Acceleration Fund（2025 年 7 月）首批得主為 Evident、Grexel、Unicorn Systems、Xpansiv，這些登記系統合計涵蓋超過 2,000 TWh 憑證、70 多國、3.5 萬多個帳戶。CleanCounts 也獲資助，將在 MISO 區域導入 EnergyTag 標準。這些是「計畫導入」，不是已完成。 — [LevelTen](https://www.leveltenenergy.com/post/announcing-registry-acceleration-fund-award-recipients)；[NA Clean Energy](https://www.nacleanenergy.com/alternative-energies/cleancounts-selected-as-an-awardee-of-levelten-energy-s-registry-acceleration-fund)
- LevelTen 2025 GC Market Readiness Report（調查，LevelTen 是市場參與者）：使用綁定 EAC 的進階買家表示，最快 2026 年願意以逐時顆粒化憑證退役 71% 的 EAC 組合。 — [LevelTen](https://go.leveltenenergy.com/registry-acceleration-fund)
- Grexel（EEX 集團，營運 22 個歐洲國家的 GO 登記系統）與 Granular Energy 在 2025 年 7 月於愛爾蘭市場試點可選的逐時 GO，與月度 GO 並行。 — [EEX press release](https://www.eex.com/fileadmin/Global/News/EEX/EEX_Press_Release/2025/20250709_Grexel_EEX_PR_Granular_GOs.pdf)
- 2025 年 4 月，Future Energy Associates 釋出開源的 Granular Cert OS，協助 REC 登記系統轉為顆粒化憑證，由 Google 與 Quinbrook 資助。 — [IREI](https://irei.com/?p=622003)
- LF Energy 2026 年 3 月的提案文件（廠商 Clean Incentive 的 RegistryOS）指出，現有 EAC 登記系統只能月度或年度核發，沒有原生逐時能力。這是廠商說法。 — [LF Energy TAC](https://tac.lfenergy.org/meetings/2026/2026-03-10/LF%20Energy%20%20RegistryOS%20TAC%20Sandbox%20Proposal.pdf)
- 早期試點：Microsoft、Eneco、CertiQ、FlexiDAO 曾以 6 個月時間，在荷蘭 GO 系統旁平行核發、轉移、宣稱逐時憑證。[舊] — [Eneco](https://news.eneco.com/hourly-certification-of-renewable-electricity-a-step-closer/)

**歐盟綠氫（RFNBO）逐時相關性：另一個逐時憑證需求來源**
- 現行規定：2029-12-31 前須證明月度時間相關性，之後改為逐時。2026 年 7 月，歐盟執委會能源總司長 Celine Gauer 表示逐時相關性可能晚於原訂時程。修訂版預計 2026 年秋提出（已錯過 Q2 目標）。業界與成員國主張延到 2035 年；Capstone 預期延到 2032–2033 年，但未經證實。 — [Argus](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2852317-eu-plans-for-rfnbo-definition-review-slip-to-autumn)；[Capstone](https://capstonedc.com/?p=54410)；[Bellona](https://network.bellona.org/content/uploads/sites/6/2026/04/RFNBO.pdf)

### Inferences
- 逐時比對的爭議不在技術，而在成本、資料與誰付錢。反對方最常見的理由是「資料基礎設施不足」，例如沒有逐時電表資料、沒有逐時憑證、匯出困難，這正好是工具可以處理的缺口。
- 即使 GHG Protocol 終版延到 2028 年，Google、資料中心買家、歐盟綠氫和部分 PPA 合約已在要求逐時證明，市場會先於標準出現。一個「逐時比對證明與缺口分析」工具，在 2026–2028 年就有實際用途。
- GO 的 double claiming 問題（冰島、挪威）是「憑證與殘餘電力組合（residual mix）未對帳」造成的。黑客松可以把題目鎖在「跨登記系統的宣稱對帳（claim reconciliation）」，不需要做「上鏈發證」這種已被登記機構壟斷的業務。

### Gaps
- 無法讀取 GHG Protocol 諮詢摘要 PDF 原文（壓縮格式），數據取自 Argus 與 EnergyTag 的轉述。
- 找不到「已正式通過 EnergyTag 認證、上線逐時核發」的登記系統完整清單（2026）。
- 找不到 Google 2025 年 CFE% 的具體數字。
- 找不到 2025–2026 年全球 unbundled REC 與 GO 的價格數據；歐洲 GO 價格在 2023–2025 年的崩跌，本次未查證。

---

## 2. P2P 能源交易、微電網與區塊鏈能源專案：成果、失敗與原因

### Takeaway
區塊鏈 P2P 交易在技術上一再證明可行，但經濟上不划算：電價結構以固定費用為主、單一供應商法規、電網費用不可繞過、家戶之間的價差很小，加上流動性不足。少數存活的專案都轉型成 B2B 的憑證、追蹤或彈性平台軟體，例如 Powerledger TraceX、Energy Web 的 SAF 與 Bitcoin 登記，不再做家戶 P2P。

### Cited Findings
**Brooklyn Microgrid / LO3 Energy**
- LO3 Energy 在 Hurricane Sandy 後發起，包含兩個部分：實體微電網（停電時仍能維持供電）與 TransActive Grid（以區塊鏈讓鄰居互相交易）。2016 年完成首筆區塊鏈售電，常被引用的例子是 Park Slope 一位屋主賣電給鄰居，金額 13.65 美元。Siemens 從 2015 年起合作。[舊] — [Trellis](https://trellis.net/article/microgrid-grows-brooklyn-future-energy/)；[Smart Cities Dive](https://www.smartcitiesdive.com/news/siemens-invests-in-developer-of-local-blockchain-based-energy-trading/513951/)
- 2017 年 LO3 CEO 表示拖慢專案的是「監管環境」。DNV 的討論也提到法規與規模化的挑戰。[舊] — [Smart Cities Council](https://www.smartcitiescouncil.com/article/how-brooklyn-cusp-getting-community-owned-microgrid)；[DNV podcast](https://www.dnv.com/power-renewables/publications/podcasts/pc-the-brooklyn-microgrid.html)
- 2018 年 LO3 與 Direct Energy Business 在德州推出 B2B 交易網路 Exergy。之後的公司描述已變成「資料分析平台」或「顧問公司」，顯示業務轉向。 — [Smart Energy Decisions](https://smartenergydecisions.com/blog/keyword/lo3)；[startups.one.gob.es](https://startups.one.gob.es/companies/lo3_energy)

**Powerledger（澳洲）**
- RENeW Nexus 試驗（Fremantle，約 2018-12 至 2020-01）：
  - 技術上可行、消費者接受度高，但第一階段 18 戶中有 17 戶、第二階段 29 戶中有 11 戶，比照 Synergy A1 標準電價反而更貴。主因是電價中的固定費用；日用電低於 11.5 kWh 的家戶最吃虧。
  - 產消者與消費者比例 70:30，鄰里需求不足，第一階段只有 19.3% 的用電向鄰居購買。
  - 報告結論：真正的價值可能在 VPP 與電池（10–15 kWh 電池加 VPP，回收期短於 6 年），不在 P2P 交易本身。
  [舊, 2020] — [pv magazine Australia](https://www.pv-magazine-australia.com/2020/06/20/blockchain-p2p-solar-energy-trading-proves-feasible-and-popular-in-world-first-trial)；[EcoGeneration](https://www.ecogeneration.com.au/peer-to-peer-trading-requires-tweaks-to-pay-off-power-ledger/)；[RenewEconomy](https://reneweconomy.com.au/world-first-blockchain-solar-trading-trial-using-australian-tech-finds-p2p-feasible-66098/)
- 2024 年 9 月，Powerledger 宣布遷到 Solana 主網，同年 10 月 1 日開始退役自有區塊鏈，TraceX（REC 交易）與 Transactive 平台一併搬到 Solana。2025 年 2 月推出 TraceX 的 REC 遠期交易功能，以及 Wormhole NTT 跨鏈轉移 POWR。 — [The Defiant](https://thedefiant.io/news/press-releases/powerledger-expands-with-solana-bringing-its-sustainability-expertise-to-the-ecosystem)；[Bitcoin World](https://bitcoinworld.co.in/powerledger-completes-integration-with-solana-accelerating-the-pace-of-innovation-in-sustainability/)；[Newsfile](https://www.newsfilecorp.com/release/241647/Powerledger-Enables-Seamless-POWR-Token-Transfers-Between-Ethereum-and-Solana-with-Wormhole-NTT?lang=fr)
- POWR 代幣：最高供給 10 億，流通約 5.7 億。價格快照約 0.046 美元（日期未標），歷史高點約 2.01 美元，跌幅超過 97%。公開 DeFi 儀表板上看不到 Powerledger 有實質 TVL。分析者形容它比較像「用公鏈的能源市場 SaaS 公司」。 — [Coinbase](https://www.coinbase.com/zh/price/power-ledger)；[KuCoin](https://www.kucoin.com/ar/price/POWR)；[yellow.com](https://yellow.com/asset/powr)
- 營收來源為交易手續費、技術授權與導入顧問；據報導專案分布在澳洲、印度、日本、泰國、美國。 — [Dealroom](https://app.dealroom.co/companies/power_ledger)

**Energy Web Foundation**
- Green Proofs for Bitcoin（2023 年推出）：以 Clean Energy Score 與 Grid Impact Score 評估礦工用電，執行在 Energy Web X（Polkadot）上。PayPal 區塊鏈研究團隊曾提案用它作為「綠色礦工」認證層。 — [Mining Technology](https://www.mining-technology.com/news/first-ever-certification-sustainable-bitcoin-mining)；[Enlit](https://www.enlit.world/library/green-bitcoin-solution-launched-by-energy-web)；[FXStreet](https://www.fxstreet.com/cryptocurrencies/news/paypal-proposes-cryptoeconomic-rewards-for-sustainable-bitcoin-miners-202404230702)
- SAFc Registry（永續航空燃料憑證登記，合作方包括 RMI、EDF、Sustainable Aviation Buyers Alliance）由 Energy Web 軟體驅動，累計減量超過 50 萬公噸（LinkedIn 貼文，未標日期）。 — [LinkedIn](https://pt.linkedin.com/in/edhesse)
- Green Proofs 的定位是在供應鏈中登記與追蹤低碳產品，讓使用者可以獨立驗證生產者資格與每一步的業務邏輯，不只是把既有憑證代幣化。 — [Telekom MMS blog](https://blog.telekom-mms.com/?p=30182)
- EWT：Kraken 2026 年 7 月的說明指出 Energy Web 有 100 多個合作夥伴，包括 Shell。2025 年 7 月 EWT 約 1.65 美元、市值約 4,970 萬美元（舊數據）。 — [Kraken](https://www.kraken.com/en-us/learn/what-is-energy-web-token-ewt)；[TradingView](https://www.tradingview.com/ideas/ewt)

**WePower（立陶宛）**
- 2018 年 ICO 募得約 4,000 萬美元，參與者 22,933 人（另有報導稱 5,300 萬）。曾與 EnergyAustralia 試驗。PitchBook 現列為「Out of Business」，Bitfinex 在 2021-03-26 下架 WPR。沒有找到公開的檢討報告。 — [pv magazine](https://www.pv-magazine.com/?p=18952)；[SmartCompany](https://www.smartcompany.com.au/startupsmart/news-analysis/lithuanian-blockchain-startup-wepower-energy-australia-trial-53-million-ico/)；[PitchBook](https://pitchbook.com/profiles/company/85943-71)；[Bitfinex](https://support.bitfinex.com/hc/en-us/articles/360007497133-WePower-Delisted)

**Electron（英國）**
- 2024 年 3 月，Electricity North West 選 Electron 作為彈性服務招標與交易的核心平台，範圍從 onboarding 到調度與結算，Piclo Max 為第二個接入管道。Electron 曾主導政府資助的 Project TraDER 彈性交易所。 — [ENWL](https://news.enwl.co.uk/news/electricity-north-west-piclo-electron-announce-partnership-to-maximise-market-access-for-flexibility)；[GOV.UK](https://gov.uk/government/publications/flexibility-exchange-demonstration-competition-flex-winning-projects/flex-competition-winning-projects)
- 對照 Piclo（非區塊鏈）：截至 2025 年 4 月，超過 250 個彈性賣方登記超過 35 萬個資產，合計 30 GW 以上彈性容量；與 NESO 合作的 Local Constraint Market 延長到 2027 年 1 月，2025 年 Q1 到 Q2 市場價值成長 7 倍。 — [Piclo](https://www.piclo.energy/about)；[Piclo/NESO](https://www.piclo.energy/press-releases/piclo-and-neso-extend-the-local-constraint-market-to-january-2027)

**學術回顧：P2P 為何無法規模化**
- 全球 P2P 專案回顧（Energy Research & Social Science, 2022）：主要限制是缺乏允許同儕交易的法規、公眾認知不足、技術複雜、政府缺乏動機。[舊] — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S2214629622001591)
- Renewable & Sustainable Energy Reviews（2024，文獻加專家觀點）：法規障礙包括「單一供應商模式（single supplier model）」、資料共享問題、產消者權利義務未定義。 — [RSER 2024](https://www.sciencedirect.com/science/article/pii/S1364032124003988)
- 2024 年回顧（Zedan et al.）：關於實際導入與區塊鏈缺點（法規、法律障礙、低吞吐量、高交易費）的資訊很少。 — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S2772671124003589)
- 2025 年的智慧電網回顧分析 168 份文獻（含試點與法規案例），結論是 P2P 的實際導入仍然有限。 — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S2352467725004138)
- JPT（2025）：區塊鏈在能源業的採用比預期慢，受限於監管不確定、可擴展性與保守投資。 — [JPT](https://jpt.spe.org/twa/blockchain-in-energy-beyond-pilots-to-proof-successes-setbacks-and-the-road-ahead)

### Inferences
- 失敗模式一再重複：區塊鏈解決的是帳本信任，但 P2P 的瓶頸在電價結構、法規與電網費用。家戶每月省下的錢只有幾美元，扣掉電表與平台成本就沒了。黑客松提案應避開「家戶 P2P 賣電」這個題目。
- 存活下來的路線是 B2B 的「證明與追蹤」：SAF 憑證、綠色 Bitcoin、REC 交易平台、DSO 彈性市場結算。也就是說，價值在可驗證的屬性資料，不在電能本身。
- 代幣經濟大多失敗（WePower 下架，POWR 跌幅超過 97%）。評審可能會對「發新幣」提案打折扣，以「不發幣、上鏈只做存證與對帳」的設計較安全。
- RENeW Nexus 的結論「價值在 VPP 與電池」和第 3 節 VPP 的數據一致，AI 加彈性聚合比 P2P 更有商業基礎。

### Gaps
- 找不到 Brooklyn Microgrid 的最終狀態（是否關閉）與 LO3 的完整後續，例如 2020 年後的裁員或轉型；資料多停在 2018 年。
- 找不到 Grid Singularity、SunContract、sonnenCommunity 的 2024–2026 年營運數據。
- 找不到 Powerledger 2025 財報、實際交易量與活躍用戶數。
- 找不到 Energy Web 24/7 matching 產品與 EW-DOS 的 2025–2026 年使用量。

---

## 3. AI 與區塊鏈可能有用的電網挑戰：棄電、壅塞、彈性與 VPP、併網排隊

### Takeaway
各地棄電正在上升。中國官方數字約 6–9%，獨立估計更高；德國 2024 年約 3.5% 的再生能源被棄，2025 年再調度成本約 27 億歐元；CAISO 在 2024 年棄電 3.4 TWh。IEA 把棄電列為 2030 年發電展望下修的原因之一。分散式資源（DER）潛力很大，但 VPP 參與受限於資料存取、計畫上限與市場規則。美國併網排隊超過 2,000 GW，排隊中位數超過 4 年。

### Cited Findings
**IEA Renewables 2025（2025-10-07）**
- 2025–2030 年全球新增約 4.6 TW 再生能源，太陽能約佔 80%（約 3.6 TW）。2025 年太陽能新增接近 600 GW 創紀錄。
- 預測比前一版下修約 5%（少 248 GW），美國幾乎腰斬。
- 2030 年再生能源佔發電 43%。
- 容量下修加上棄電增加，2030 年發電預測少了近 850 TWh。棄電與負電價在中國、歐洲、部分拉丁美洲越來越頻繁。
— [IEA executive summary](https://www.iea.org/reports/renewables-2025/executive-summary)；[pv magazine](https://www.pv-magazine.com/2025/10/07/iea-lowers-2025-30-forecast-for-solar-growth/)；[Mercom](https://mercomindia.com/iea-forecasts-massive-4600-gw-growth-in-global-renewable-power-by-2030)

**中國**
- NEA 把再生能源利用率下限從 95% 放寬到 90%，等於棄電上限 10%。 — [pv magazine (2024-06)](https://www.pv-magazine.com/2024/06/04/chinese-pv-industry-brief-nea-moves-forward-with-curtailment-increase/)
- 2025 年上半年，光電棄電率 6.6%（去年同期 3.9%），風電 5.7%（去年同期 3%）。Bloomberg 報導的數字剛好對調，來源有衝突。西藏風電棄電 30.2%、光電 33.9%。 — [Power Technology](https://www.power-technology.com/news/china-renewable-energy-curtailment/)；[Bloomberg (2025-08)](https://www.bloomberg.com/news/articles/2025-08-05/china-s-record-renewables-buildout-is-wasting-power-as-grid-lags)
- 2026 年上半年 NEA 官方數字：光電 8.6%、風電 9.1%。GEM 與 CREA 以天氣校正估計，中國實際棄掉 26.1% 的風光發電，包含未申報的部分。官方與獨立估計差距極大。 — [GEM China brief July 2026](https://globalenergymonitor.org/sites/default/files/2026-07/GEM%20China%20Wind%20&%20Solar%20brief%20July%202026.pdf.pdf)；[Energy Connects (2026-04)](https://www.energyconnects.com/news/renewables/2026/april/china-s-wasting-too-much-renewable-power-as-curtailments-rise/)

**德國**
- 2024 年光電棄電 1,389 GWh，年增 97%，其中巴伐利亞佔 986 GWh（Bundesnetzagentur 數據）。 — [Strategic Energy Europe](https://strategicenergy.eu/solar-curtailment-germany/)
- 2024 年再生能源棄電 9.4 TWh，約佔再生發電 3.5%。 — [Modo Energy](https://modoenergy.com/research/en/de-germany-bess-batteries-grid-balancing-redispatch-explainer-july-2025)
- 2025 年再調度（redispatch）成本約 27 億歐元，見於電網法案草案說明。 — [Baker McKenzie (2026-03)](https://www.bakermckenzie.com/en/insight/publications/2026/03/germany-grid-package-draft)

**CAISO（加州）**
- 2024 年棄電 3.4 TWh，年增 29%。2025 年 1–5 月棄電 2,742 GWh，2025 年 3 月單月 919 GWh 創紀錄。但 GridStatus 分析指出，因儲能充電與負載成長，2025 年中午時段棄電反而下降。CAISO 自 2025-06-01 起停止發布月度棄電報告。 — [NewsData](https://www.newsdata.com/california_energy_markets/regional_roundup/analysis-caiso-curtailments-could-reach-record-again-in-2025/article_82daea66-4ec7-4026-8d84-4bc54dfbe105.html)；[GridStatus](https://blog.gridstatus.io/caiso-solar-storage-spring-2025/)；[CAISO](https://www.caiso.com/library/production-curtailments-data)

**澳洲：屋頂光電造成的最低系統負載（MSL）**
- AEMO 在 2021 年建立 MSL 框架。2024 年 8 月，AEMO 要求 Ausgrid 在 2025 年春季前建好「緊急棄電後備（emergency backstop）」能力。2025-12-10，NSW 修改配電執照，要求新裝或升級的屋頂光電必須可用 CSIP-AUS 遠端限制輸出，作為最後手段。 — [AEMO MSL](https://aemo.com.au/initiatives/major-programs/nem-distributed-energy-resources-der-program/managing-distributed-energy-resources-in-operations/managing-minimum-system-load)；[AER filing](https://www.aer.gov.au/system/files/2026-07/NSW%20Emergency%20Backstop%20Mechanism_Cost%20Pass%20Through%20Application_PUBLIC.pdf)

**巴西**
- 2025 年 9 月強制降載（curtailment）創歷史新高。 — [LinkedIn analysis](https://br.linkedin.com/in/lgso)（來源較弱）

**VPP 與 DER（美國）**
- Wood Mackenzie 2025：北美 VPP 容量 37.5 GW，年增 13.7%；部署數、承購方與計畫數各成長超過 33%（共 1,940 個部署、430 多個計畫）。住宅只佔 VPP 批發市場容量 10.2%。主要障礙是公用事業計畫上限、容量認定改革、市場規則，以及第三方資料存取（用於招募與市場結算）。美國 DER 總量約 397 GW，VPP 只用到一小部分。 — [Wood Mackenzie](https://www.woodmac.com/press-releases/virtual-power-plant-capacity-expands-13.7-year-over-year-to-reach-37.5-gw/)；[Renewable Energy World](https://www.renewableenergyworld.com/power-grid/us-virtual-power-plant-capacity-reaches-37-5gwh-over-last-year-says-wood-mackenzie/)
- SEPA：2025 年 35 州加 DC 共採取 106 項推動 VPP 的監管或公用事業行動；加州、德州、紐約、麻州合計約佔 37% 部署。 — [pv magazine USA (2026-02)](https://pv-magazine-usa.com/2026/02/02/states-and-utilities-took-106-actions-to-advance-vpps-in-2025-sepa-report/)

**併網排隊（美國，LBNL Queued Up）**
- 2024 年底：約 10,300 個專案，合計 1,400 GW 發電加約 890 GW 儲能。2000–2019 年提出申請的容量只有 13% 商轉，77% 撤案。2018–2024 年完工專案從申請到商轉的中位數超過 4 年（2000–2007 年不到 2 年）。 — [LBNL Queued Up 2025](https://emp.lbl.gov/publications/queued-2025-edition-characteristics)
- 2025 年底：排隊總量約 2,060 GW，較 2024 年下降約 10%；2023 年高峰接近 2,600 GW；2025 年撤案超過 750 GW。 — [LBNL Queued Up 2026](https://emp.lbl.gov/queued-2026-edition-characteristics-power-plants-seeking-transmission-interconnection-end-2025)

**棄電預測研究**
- 已有學術工作用機器學習預測棄電，例如 arXiv 2405.18526。 — [arXiv](https://arxiv.org/pdf/2405.18526)

### Inferences
- 「棄電時段」本身就是可以量化的訊號：在棄電或負電價時段用電的碳影響接近零，正好是逐時與邊際排放會計要捕捉的價值。工具可以把棄電預測、彈性負載排程（EV、儲能、熱泵、資料中心）和逐時憑證或排放證明串起來，讓用戶「證明自己吃掉的是本來會被棄掉的電」。
- VPP 的瓶頸是資料存取與結算，不是演算法。可驗證的 DER 量測與結算帳本（含 DSO 端）是區塊鏈較合理的用途，但要和 Piclo 這類非區塊鏈平台的規模（30 GW）比較。
- 中國官方與獨立估計的差距（約 9% 對 26%）顯示棄電資料不透明，「獨立、可驗證的棄電量測」本身就有需求。

### Gaps
- 沒有取得 2025 年 CAISO 全年棄電數字，也沒有 AEMO 2025–2026 年實際動用緊急後備的次數。
- 沒有取得台灣的棄電數據；台電是否公開棄光、棄風資料，本次未查到。
- 沒有取得 EV 智慧充電、家用電池聚合的具體市場數據。

---

## 4. 能源近用與 Global South：離網太陽能、PAYG、迷你電網、結果導向融資驗證、小型案場進入憑證市場

### Takeaway
離網太陽能產業在 2024 年經歷股權寒冬，新創投資年減 70%，只剩 4,800 萬美元，資金集中在少數大廠，正轉向應收帳款證券化與綠色債券。碳權與 RBF 是重要的收入補貼，但 MRV 與註冊成本動輒數十萬美元，小型業者負擔不起。數位 MRV（以 PAYG 遙測資料自動算減量）剛出現方法學。小型與分散式發電如何進入 I-REC 或 TIGR，我沒有找到可靠資料。

### Cited Findings
- GOGLA：2024 年新創投資年減 70%，只剩 4,800 萬美元，部分公司退出或面臨重整。2025 年在地貨幣投資佔比創新高，達 47.2%。 — [GOGLA "After the Dip"](https://gogla.org/reports/investment-data-report/after-the-dip-off-grid-solars-defining-moment/)
- 2025 年融資案例：d.light 在 2025 年 6 月發行 5,000 萬美元綠色債券，以數千筆 PAYGo 客戶應收帳款的 SPV 為擔保；Sun King 年中取得 2.86 億美元證券化債務。 — [ABC News/AP](https://abcnews.com/Technology/wireStory/africas-off-grid-solar-sector-courts-mainstream-investors-135252006)
- 2025 年上半年 PAYGo 銷售創紀錄，現金銷售降到 5 年低點。2012–2024 年產業累計募資約 36 億美元，其中贈款 4%、股權 42%、債務 55%。「Big 7」為 Bboxx、d.light、Engie、Lumos、M-KOPA、Sun King、Zola。 — [GOGLA](https://gogla.org/reports/investment-data-report/after-the-dip-off-grid-solars-defining-moment/)；[TechCrunch (2024)](https://techcrunch.com/2024/04/30/global-off-grid-solar-sector/)
- PAYG 是資本密集模式，售出後需要 12–36 個月才能回收資本。 — [World Bank "Funding the Sun"](https://documents1.worldbank.org/curated/en/447971581689878643/pdf/Funding-the-Sun-New-Paradigms-for-Financing-Off-Grid-Solar-Companies.pdf)
- 有研究指出 PAYGo 模式對最貧窮者存在「貧窮溢價」，2026 年 Nature 系列期刊也有文章呼籲 PAYG 演進時不要遺落最脆弱族群。 — [Energy for Growth Hub](https://energyforgrowth.org/article/off-grid-solars-poverty-premium/)；[Nature (2026)](https://www.nature.com/articles/s44458-026-00078-y)
- GOGLA 指出，離網太陽能業者從文件準備到註冊與商業化，要先投入「數十萬美元」才能開始賣碳權，是小型業者的主要障礙。 — [GOGLA VCM intro](https://gogla.org/blog/introduction-to-the-voluntary-carbon-market-for-off-grid-solar/)
- Global Carbon Council 的 EAP001 離網電氣化方法學：整合 PAYGo 資料、數位 MRV、自動化減量計算與短於一年的入帳週期（sub-annual crediting），並採下修基線，與 Article 6.4 對齊。 — [Global Carbon Council](https://globalcarboncouncil.com/?p=9103)
- 結果導向融資（RBF）已在能源近用領域試點、擴大與多元化，目標對象是約 6.75 億無電人口。例如瑞典資助的莫三比克 Clean Energy Fund（2025-03 文件）採用 RBF。 — [AFSIA](https://www.afsiasolar.com/?p=24288)；[Sweden Abroad ToR](https://swedenabroad.se/globalassets/ambassader/mocambique-maputo/documents/2025-monitoring-consultants-for-the-sol-project/appendix-1-terms-of-reference.pdf)
- 肯亞有平台以 IoT/M2M 擷取分散式氣候方案的即時資料，稽核後產生可追溯的碳權並記錄在數位帳本（GSMA）。 — [GSMA](https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-for-development/blog/harnessing-mobile-money-and-digital-solutions-for-kenyas-carbon-markets-ecosystem/)
- I-REC 與 TIGR 的規模：2022 年 I-REC 核發 1.99 億張，TIGR 核發 378 萬張；TIGR 是規模第二大的國際交易 REC。[舊] — [CCarbon](https://www.ccarbon.info/article/the-new-player-of-internationally-traded-recs-tradable-instruments-for-global-renewables-tigrs/)；[Reccessary](https://reccessary.com/en/reccpedia/tradable-instruments-for-global-renewable)

### Inferences
- 「RBF、碳權、I-REC 的驗證成本」是 Global South 分散式太陽能最明確的痛點。PAYG 業者手上已有逐台遙測資料，缺的是把資料轉成可稽核證據的低成本管線，供 RBF 撥款、碳權、I-REC 使用，並且防止同一度電被重複申報到三個系統。這是 AI 異常偵測加上鏈存證的合理場景。
- 防重複計算很重要：同一個太陽能家用系統（SHS）可能同時申請 RBF 補貼、碳權與 I-REC，目前缺乏跨系統的唯一資產 ID 與宣稱登記。

### Gaps
- 找不到 I-REC 小型與聚合（aggregation）的發證規則與門檻（I-REC Standard 有 small-scale 或 aggregated 條款，但本次未取得原文）。
- 找不到 Tradable Instruments 對小型太陽能的具體數據。
- 沒有取得 Bboxx、M-KOPA 2025 年碳權收入，或 RBF 驗證詐欺案例的具體數字。
- 沒有取得 IEA 或 SDG7 Tracking 2025–2026 年最新無電人口數（上方 6.75 億是 AFSIA 引用的數字，年份不明）。

---

## 5. Türkiye：YEK-G 與 EPİAŞ

### Takeaway
土耳其從 2021 年起採自願性雙軌：國家的 YEK-G 由 EPİAŞ 發證並經營組織化市場，國際 I-REC 則由 Foton Energy 擔任本地發證機構。YEK-G 以 1 MWh 為單位、效期 12 個月，依能源類型分別交易。我沒有找到 2025 年交易量與價格。

### Cited Findings
- 土耳其的 REC 採自願制，市場上交易的有國家 YEK-G 與國際 I-REC 兩種。YEK-G 在 2021 年導入，EPİAŞ 為發證機構並經營 Organize YEK-G Piyasası，主管機關為 EPDK（EMRA）。 — [Çakmak Avukatlık](https://cakmak.av.tr/en/renewable-energy-certificates)；[EPİAŞ](https://www.epias.com.tr/en/announcements/turkeys-green-power-certification-market-launches?paged=14)；[Norton Rose Fulbright (2020)](https://www.nortonrosefulbright.com/en/inside-turkey/blog/2020/11/turkey-introduces-guarantees-of-origin-regulation-for-renewables)
- 每 1 MWh 發一張電子憑證，效期為生產期結束後 12 個月，未在期限內註銷就由 EPİAŞ 收回。 — [Çakmak](https://cakmak.av.tr/en/article/renewable-energy-certificates)
- I-REC 是國際私有標準，YEK-G 是依土耳其電力市場法規、由 EPİAŞ 營運的國家系統；I-REC(E) 在土耳其的本地發證機構是 Foton Energy。 — [FFK Partner Hukuk (2026)](https://www.ffkpartnerhukuk.com.tr/yesil-sertifika-i-rec-hukuki-rehberi-2026-guncel-i-rec-nasil-alinir-yek-gden-farki-nedir/)
- TİM 的簡報資料：累計發行 45,360.75 GWh；2021–2023 年組織化市場累計成交 5,660.7 GWh。價格依水力、風力、地熱、生質、太陽能分別形成。 — [TİM YEK-G PDF](https://ftp.tim.org.tr/download/a9cb7cb20956425ea60f8211f4d7bdf7/2.4.%20Yenilebilir%20Enerji%20Kaynak%20Garanti%20Sistemi%20(YEK-G).pdf)
- 2026-01-01 起，YEK-G 市場的單位交易費為每 MWh 1.00 里拉。 — [NTV](https://www.ntv.com.tr/ntvpara/epdkdan-dogalgaz-elektrik-ets-ve-akaryakita-duzenleme-1700402)
- 時任能源部長 Dönmez 表示 YEK-G 採自願原則。[舊] — [Habertürk](https://www.haberturk.com/bakan-donmez-yek-g-gonulluluk-esasina-dayanacak-3110642-ekonomi)
- 2023 年的 ERRA 簡報說明 YEK-G 制度設計。[舊] — [ERRA](https://erranet.org/wp-content/uploads/2023/06/1_Sever_Guarantee-of-origin-in-TR-YEK-G_NGCOM_Jun2023.pdf)

### Inferences
- 土耳其和台灣的處境類似：出口導向製造業面臨 CBAM 與品牌商 RE100 壓力，國家憑證與 I-REC 並存。YEK-G 只發行約 45 TWh、成交僅約 5.7 TWh，顯示發行多、實際被企業使用的少。對土耳其主辦方而言，「YEK-G、I-REC、T-REC 的跨國可讀性與防重複宣稱」是很好的切入點。

### Gaps
- 找不到 YEK-G 2024–2025 年的發行量、成交量與加權平均價（需查 EPİAŞ Şeffaflık Platformu）。
- 找不到 YEK-G 是否被 RE100 或 CDP 完全認可、與 AIB/EECS 的互通狀態。
- 找不到土耳其的 P2P 或 VPP 法規試點資料。

---

## 6. 台灣與亞洲：T-REC、RE100 供應鏈壓力、綠電短缺、轉供與餘電、用電大戶條款、公民電廠、日本非化石證書、韓國 K-RE100

### Takeaway
台灣綠電市場的主要問題是供給不足加上大戶壟斷：自由市場綠電不到再生能源總量的一成，2025 年約 58 億度，主要被科技大廠買走；中小企業有錢也買不到。台電的「彈性分配」讓轉供量快速成長（2026 年 1–7 月已 56.4 億度），但「餘電」（發用電時間不匹配）造成雙重付費，政府正規劃電證分離與 15 分鐘結算的綠電電能市場。台積電 2024 年再生能源佔比只有 14.1%，國內來源不到四成。日本 FIT 非化石證書價格在底價，韓國被 RE100 評為最難採購的市場。

### Cited Findings
**台灣綠電供需**
- 《數位時代》2026-05-06 報導：
  - 2025 年自由綠電交易約 58 億度，不到台灣再生能源發電的 10%，其餘多走台電 FIT 躉購，自由市場綠電多被大型科技廠買走。
  - 經濟部估計 2030 年綠電需求 400 億度。
  - 一座 1 GW 資料中心以 60% 負載率計算，一年需約 70 億度，可以吃光全台自由綠電。
  - 截至 2026 年 2 月，再生能源售電業者有 122 家。
  - 經濟部長龔明鑫 2026 年 4 月在立法院表示，原訂 2025 年的 20% 綠電目標延到 2026 年底，甚至 2027 年。
  - 離岸風電 CPPA 需在併網前 3–4 年簽約、期限最長 20 年，買方需要國際信評，極少企業能買到。
  - 中小企業「有錢也買不到」。
  - 2026 年初，標檢局與台電放寬餘電認列與分時匹配。
  — [數位時代 BusinessNext](https://www.bnext.com.tw/article/90848/2026-green-power-shortage-crisis)
- KPMG 2026 年 3 月報告：資料中心買家提前 24–36 個月鎖定綠電，並從 RE100 轉向 24/7 CFE。 — [數位時代](https://www.bnext.com.tw/article/90848/2026-green-power-shortage-crisis)
- SEMICON Taiwan 2026 論壇上，RE100 代表表示台灣製造業綠電使用率僅 6%，綠電供給跟不上半導體需求；到 2028 年，AI 與半導體約佔總用電增幅的八成。 — [NOWnews](https://www.nownews.com/news/6872214)
- 台積電目標 2030 年 60%、2040 年 100% 再生能源。2024 年全球使用再生能源 36.1 億度，佔總用電 14.1%，其中國內來源不到四成，其餘從海外採購。離岸風電 3-1、3-2 期開發受阻，業者估計少了 200 萬瓩。 — [聯合報](https://udn.com/news/story/7240/9219326)；[IEK](https://ieknet.iek.org.tw/ieknews/news_open.aspx/news_more.aspx?actiontype=ieknews&indu_idno=1&nsl_id=5acb408ea15d47d7b26c40495fedfbc1)
- 中時 2026-10-03 獨家：台電評估對 5 MW 以上用電大戶（含半導體、AIDC）實施差別電價，可能高出約 25%，仍在評估中。 — [中時](https://www.chinatimes.com/realtimenews/20261003003276-260410)
- 曾有業者預測，台積電加入搶購後，綠電價格可能達每度 6 元。這是一年前的預測，時效需留意。台電 RE30 商品過去定價為每度 6.3 元，不含營業稅與轉供費。 — [聯合報](https://udn.com/news/story/7240/9219326)；[TechNews](https://technews.tw/2026/09/10/taipower-green-power-flexible-allocation-latest-revised-rules-changed/)

**轉供、彈性分配與餘電**
- 台電：2025 年綠電轉供約 58.5 億度，其中彈性分配約 17.6 億度。2026 年 1–7 月轉供已達 56.4 億度，彈性分配約 25.5 億度、佔約 45%，全年預估 125 億度。2026 年 9 月修正「綠電市場彈性分配試行計畫」，試行期延到 2028 年 9 月底，並放寬時間媒合限制、允許跨電號重新分配。參與者須付作業服務費，用於資訊系統與電量資料處理。 — [TechNews (2026-09-10)](https://technews.tw/2026/09/10/taipower-green-power-flexible-allocation-latest-revised-rules-changed/)
- 台電規劃試行「綠電電能市場」，把結算從月結或日結縮短到 15 分鐘，並讓儲能參與調節，最快明年上路，先在單一大集團試行。 — [自由時報](https://ec.ltn.com.tw/article/paper/1755030)；[TechNews](https://technews.tw/?p=1614206)
- 「監理沙盒」讓同一公司不同廠區彈性分配綠電，由台積電先試用。 — [關鍵評論網](https://www.thenewslens.com/article/193229)
- 餘電與電證分離（Reccessary 2026-05-12）：企業簽長期 CPPA 後，若用電下降或時間不匹配就會產生餘電。政府提案讓餘電無償回到電網、憑證歸開發商另行分配。學者擔心企業會為同一度電付兩次錢。台達電 2025 年達成 RE100，但仍須額外買憑證來補餘電的環境價值。 — [Reccessary](https://www.reccessary.com/zh-tw/news/new-unbundled-rec-system-challenge)
- Google 在台灣以多種方式採購綠電，以達成 24/7 CFE 目標。 — [DIGITIMES](https://www.digitimes.com.tw/tech/dt/n/shwnws.asp?id=767632)

**T-REC 制度與數據**
- 截至 2024 年 12 月，自 2017 年起累計核發超過 700 萬張（約 70 億度）；2022 年（111 年）核發 1,166,152 張。 — [T-REC 簡報（高雄市府）](https://orgws.kcg.gov.tw/001/KcgOrgUploadFiles/415/relfile/74528/270075/9fd24dac-f6b4-4810-b0b8-e6308b091734.pdf)
- 截至 2024 年 8 月：1,208 個案場、超過 544 萬張；風電約 323 萬張、太陽能約 190 萬張、其他約 30 萬張。新增案場多為 2 MW 以下的第三型太陽光電。 — [Reccessary T-REC market 2024](https://www.reccessary.com/zh-tw/news/t-rec-market-2024)
- 政府開放資料平台有「憑證發放統計」資料集（依年份與能源別，每季更新），可作為工具的資料來源。 — [data.gov.tw](https://data.gov.tw/dataset/162931)
- 新版《再生能源憑證實施辦法》在 114（2025）年 5 月 26 日發布、7 月 1 日施行：每累計 1,000 度發一張電子憑證，標檢局可視需要核發未滿 1,000 度的憑證；申請改為電子化，現場查核改由認可查驗機構執行。 — [6laws](https://6laws.net/6law/law3/再生能源憑證實施辦法.htm)；[台中市政府附件](https://www.dajia.taichung.gov.tw/media/1241313/再生能源憑證申請及管理作業程序修正總說明.pdf)
- 價格沒有官方統一價。標檢局平台競標底價曾在每張 1,000–5,000 元；綠色和平 2023 年問卷顯示 RE10x10 企業的得標價約每張 3,050–6,000 元。《天下 CSR》報導憑證競標降溫、多次無人得標。 — [耀智創新](https://www.auics.com.tw/esgblog/detail/t-rec)；[天下 CSR](https://csr.cw.com.tw/article/43529)；[遠見 ESG](https://esg.gvm.com.tw/article/58436)
- 經濟部官員曾表示，部分大型用電戶想把綠電留給自己，不願拿出來交易，造成國內憑證供不應求。 — [遠見 ESG](https://esg.gvm.com.tw/article/58436)

**用電大戶條款**
- 現行規定：契約容量 5,000 kW 以上的用戶，須以前一年平均契約容量的 10% 作為義務裝置容量，可用自建再生能源、購買綠電與憑證、設置儲能或繳代金履行。2021-01-01 上路，5 年內完成。 — [台電需量反應說明 PDF](https://dr.taipower.com.tw/media/ua2n0cd4/再生能源義務用戶儲能調整用電措施.pdf)；[TechNews](https://technews.tw/?p=1590079)
- 《能源管理法》修正在 2026-08-21 三讀（用電大戶 2.0）：只適用新設或增設用電的大戶，自用發電設備與儲能二擇一；未依規定設置、經限期改善仍未完成者，罰 15 萬至 75 萬元並可按次處罰。門檻與期限由子法另訂。行政院原草案估計影響 400 多家廠商。 — [中央社](https://cna.com.tw/news/aipl/202608210195.aspx)；[聯合報](https://udn.com/news/story/6656/9706117)；[自由時報](https://ec.ltn.com.tw/article/breakingnews/5529397)
- 綠色和平主張門檻比照能管法的 800 kW，並把綠電義務提高到總用電量的 20%。 — [Greenpeace Taiwan](https://www.greenpeace.org/taiwan/press/22068/)

**中小企業**
- 中經院推出「TRE100」倡議，沒有用電門檻，專為中小企業設計；RE100 會員門檻為年用電量 100 GWh（1 億度）以上。受訪中小企業表示多數綠電被台積電買走。RE100 自 2024 年起新增「電廠商轉 15 年內」的規定。 — [CSRone](https://csrone.com/news/9682)；[Reccessary RE100 Taiwan](https://www.reccessary.com/zh-tw/news/re-100-in-taiwan)

**公民電廠與屋頂光電**
- 截至 2025 年底，屋頂光電約 9.9 GW，佔太陽光電一半以上，但城市私有建築設置少。2025 年政府推出「小屋頂獎勵」與新建物強制設置光電草案。 — [公視新聞網](https://news.pts.org.tw/article/796877)
- 綠電合作社與社區合作社呼籲簡化申設流程。過去躉購費率草案對 20–100 kW 級距砍得最深，不利公民電廠規模化（較舊報導）。新北金山公民電廠案例遇到日照不足與土地租用問題。 — [公視](https://news.pts.org.tw/article/737975)；[公視（舊）](https://news.pts.org.tw/article/417258)；[INSIDE](https://www.inside.com.tw/article/20665-new-taipei-jinshan-civic-power-plant-will-start-next-year)
- 小型屋頂光電申請補助「像抽樂透」（較舊報導）。 — [公視](https://news.pts.org.tw/article/482634)

**日本非化石證書（NFC）**
- FY2025 第二輪：非 FIT 證書（含與不含再生標示）都以上限價每 kWh 1.30 日圓成交，量分別為 623.11 GWh（年增 73.9%）與 591.68 GWh。FIT 證書停在底價每 kWh 0.40 日圓、量 15,215.98 GWh，FIT 證書通常佔總量 95% 以上。FY2025 共四輪，從 2025 年 8 月到 2026 年 5 月。 — [Shulman Advisory](https://shulman-advisory.com/prices-hit-cap-in-second-fy2025-nfc-auction-as-non-fit-volumes-rise/)；[Japan Energy Hub](https://japanenergyhub.com/news/fy2025-nfc-auction-schedule)

**韓國 K-RE100**
- RE100 年報（2025 年 5 月發布）：前六名最難採購的市場都在亞洲，南韓最難；在韓營運的 RE100 企業只有 4%（另一份摘要為 5%）達到 100% 再生能源。主要障礙是成本高、供給有限、採購選項少。 — [Climate Group](https://www.theclimategroup.org/our-work/news/re100/world-leading-companies-accelerating-switch-renewables-asia)；[SolarQuarter](https://solarquarter.com/2025/05/28/global-giants-power-asias-renewable-energy-leap-finds-re100-report/)
- 2025 年 10 月的專家訪談：韓國太陽能 PPA 價格每 kWh 約 170–190 韓元，全球平均約 138–156 韓元；公部門 REC 需求與民間 RE100 需求互相競爭。 — [머니투데이](https://www.mt.co.kr/industry/2025/10/16/2025101615010229586)
- 2022 年資料：綠色溢價（green premium）多以每 kWh 10 韓元的底價成交，REC 交易量只有綠色溢價的 0.3%。[舊] — [위클리경향](https://weekly.khan.co.kr/article/202207151430511)

### Inferences
- 台灣的問題有三層：
  1. 供給量不足。這是物理與政策問題，工具解決不了。
  2. 分配不透明、大戶優先，中小企業無法聚合需求。
  3. 時間錯配造成餘電與重複付費。
  第 2、3 層是軟體可以處理的：中小企業需求聚合與撮合、逐時比對與餘電最佳化、跨憑證系統的宣稱證明。
- 台電正從月結走向 15 分鐘結算，台灣將出現大量「15 分鐘發用電匹配資料」，但目前只有大集團試行。一個讓中小企業看懂自己的逐時匹配率與餘電成本的工具，有政策上的順風。
- 中小企業的另一個需求是「向國際品牌證明」：T-REC 的國際認可、CBAM 與 Scope 2 申報需要可攜、可驗證的證據包。T-REC 開放資料、台電用電資料與企業採購紀錄的整合工具，目前缺乏公開解決方案。
- 日本 FIT 非化石證書的價格約每 kWh 0.4 日圓，等於約 4 美元/MWh，是典型「便宜、無額外性」的證書，可在報告中和 Bjørn 研究對照。

### Gaps
- 找不到 2025 年 T-REC 年度核發量與交易均價的官方數字（data.gov.tw 資料集可查，但本次未取得數值）。
- 找不到台電轉供費用的具體費率與 2026 年調整，也找不到小型案場申請 T-REC 的規費。
- 找不到台灣棄光與棄風數據、配電饋線容量不足造成屋頂光電無法併網的量化資料。
- 找不到 RE100 年報中台灣的具體障礙排名（PDF 未讀取）。

---

## 7. 具體的未滿足需求：新工具真正有用的地方（綜合證據）

### Takeaway
證據最強、競爭也相對少的缺口有五個：
1. 逐時發用電匹配資料的取得與證明。這是 Scope 2 諮詢反對的核心理由，也是資料中心與 RFNBO 的新需求。
2. 中小企業的綠電需求聚合與可攜證明（台灣、韓國、土耳其）。
3. 跨登記系統的宣稱對帳與防重複計算（冰島、挪威案例，以及 SHS 的 RBF、碳權、I-REC 三重申報）。
4. 小型與分散式發電的低成本 MRV 與憑證化。
5. 棄電時段的負載轉移與可驗證證明。

家戶 P2P 交易與發行能源代幣則有大量失敗前例，應避免。

### Cited Findings
- 資料基礎設施不足是反對逐時比對的主要理由：回應者認為立即強制逐時或在地比對會超出資料基礎設施與企業會計團隊能力。 — [Argus](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2858486-ghg-protocol-faces-pushback-on-scope-2-reforms)
- 現有 EAC 登記系統只能月度或年度核發，沒有原生逐時能力（廠商說法）；登記系統升級仍在進行中。 — [LF Energy](https://tac.lfenergy.org/meetings/2026/2026-03-10/LF%20Energy%20%20RegistryOS%20TAC%20Sandbox%20Proposal.pdf)；[LevelTen](https://www.leveltenenergy.com/post/announcing-registry-acceleration-fund-award-recipients)
- GHG Protocol 草案為缺乏逐時資料者提供負載曲線替代，並設豁免門檻，代表中小企業未來可能用「估計的逐時曲線」申報。這個工具空間是「讓 SME 從估計曲線升級為實測，並看懂差距」。 — [GHG Protocol summary](https://ghgprotocol.org/sites/default/files/2026-07/S2-PublicConsultationSummaryofFeedback-2026.07.29.pdf)；[EnergyTag](https://energytag.org/under-the-hood-ghgp/)
- 台灣中小企業有錢也買不到綠電；自由綠電不到一成，且由大廠主導。 — [數位時代](https://www.bnext.com.tw/article/90848/2026-green-power-shortage-crisis)；[CSRone](https://csrone.com/news/9682)
- 餘電與雙重付費，連台達電都要額外買憑證補缺口。 — [Reccessary](https://www.reccessary.com/zh-tw/news/new-unbundled-rec-system-challenge)
- 美國 VPP 的主要障礙是第三方資料存取（招募與結算）；住宅只佔 10.2%。 — [Wood Mackenzie](https://www.woodmac.com/press-releases/virtual-power-plant-capacity-expands-13.7-year-over-year-to-reach-37.5-gw/)
- 離網太陽能碳權的前期成本達數十萬美元，數位 MRV 方法學（GCC EAP001）剛出現。 — [GOGLA](https://gogla.org/blog/introduction-to-the-voluntary-carbon-market-for-off-grid-solar/)；[GCC](https://globalcarboncouncil.com/?p=9103)
- 宣稱對帳的缺口：冰島高耗能用戶宣稱使用再生能源，但手上沒有對應 GO，而且這不算違規。 — [Orkustofnun](https://orkustofnun.is/en/news/medfylgjandi-er-stoduskyrsla-raforkueftirlits-orkustofnunar)
- 棄電規模：中國獨立估計 26.1%；德國 2024 年 9.4 TWh；CAISO 2024 年 3.4 TWh。 — [GEM](https://globalenergymonitor.org/sites/default/files/2026-07/GEM%20China%20Wind%20&%20Solar%20brief%20July%202026.pdf.pdf)；[Modo](https://modoenergy.com/research/en/de-germany-bess-batteries-grid-balancing-redispatch-explainer-july-2025)；[NewsData](https://www.newsdata.com/california_energy_markets/regional_roundup/analysis-caiso-curtailments-could-reach-record-again-in-2025/article_82daea66-4ec7-4026-8d84-4bc54dfbe105.html)
- P2P 交易在現行電價下對多數家戶不划算（RENeW Nexus：第一階段 17/18 戶更貴）。 — [pv magazine Australia](https://www.pv-magazine-australia.com/2020/06/20/blockchain-p2p-solar-energy-trading-proves-feasible-and-popular-in-world-first-trial)

### Inferences（可轉為黑客松題目的方向，屬推論，非來源原話）
1. **SME 逐時綠電健檢與證據包**（台灣、土耳其、韓國）：匯入台電或 AMI 用電資料（15 分鐘）、CPPA 或轉供紀錄、T-REC 開放資料，以 AI 算出逐時 CFE%、餘電量與缺口，產出可攜、經雜湊上鏈存證的報告，供品牌商、CBAM、Scope 2 使用。也可以模擬「年度比對」和「逐時比對」的帳面差距。這是 Scope 2 反對者自己點出的資料缺口。
2. **SME 綠電需求聚合與撮合**：把多家中小企業的逐時負載曲線合成「虛擬大戶」，與中小型案場或公民電廠的發電曲線撮合，以 AI 最佳化匹配、降低餘電。這對應「中小企業買不到綠電」與「公民電廠難規模化」兩個問題。
3. **跨系統宣稱登記與防重複計算**（T-REC、YEK-G、I-REC、GO、碳權、RBF）：上鏈只放資產 ID、期間與宣稱的雜湊，不取代官方登記；AI 偵測同一資產、同一期間在多系統重複申報。這對應冰島、挪威 GO 案例與 SHS 三重申報風險。
4. **棄電感知的彈性負載與證明**：以 AI 預測棄電或負電價時段，排程 EV、儲能、冷凍、資料中心批次工作，並產生「吸收棄電」的逐時證明（可搭配邊際排放）。這對應中國、德國、CAISO、澳洲 MSL 的數據。
5. **分散式太陽能 dMRV 管線**（Global South）：PAYG 遙測加 AI 異常與詐欺偵測，輸出同時符合 RBF 撥款、GCC EAP001 碳權與 I-REC 聚合需求的資料包，並防止重複。這對應「數十萬美元前期成本」的障礙。
- 設計原則（從失敗案例歸納）：不發代幣；不做需要修法的家戶 P2P 售電；區塊鏈只用在多方互不信任的存證與對帳；AI 用在預測、匹配最佳化與異常偵測；資料來源優先用官方開放資料（data.gov.tw、EPİAŞ 透明平台、AEMO、CAISO）。

### Gaps
- 沒有找到「SME 逐時匹配工具」的市場現況調查。既有商業方案如 FlexiDAO、Granular Energy、ClearTrace 等本次未逐一查證功能與價格，其中前兩者的出處只有試點新聞稿。
- 沒有找到台灣 AMI 智慧電表覆蓋率，以及中小企業能否取得 15 分鐘用電資料的明確數據；這是方向 1、2 可行性的關鍵前提，建議另外查證（台電 AMI 布建進度、高壓用戶是否已全面有 15 分鐘資料）。
- 沒有找到 T-REC 是否已被 RE100 完全認可，或 T-REC 與 I-REC/GO 互通的最新官方說明。
