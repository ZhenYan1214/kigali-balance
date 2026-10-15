# 讓「同一噸不被宣稱兩次」：ClimateChain 黑客松全景與選題

IEEE ClimateChain Global Hackathon 2026 是 IEEE Blockchain Türkiye 第一次辦的黑客松。總獎金只有 3,000 美元，評審卻以學術背景為主，其中資安與密碼學專家最多。真正看得出評審在意什麼的，是 IEEE 官方頁面上的加權標準：「資料安全」佔 10%，交件要包含「安全與資料完整性評估」和「減碳量推估」。Devpost 頁面則只列了五項不加權的標準，兩套規則彼此矛盾，主辦方至今沒有出面澄清。四個賽道的研究結果指向同一個結論。站得住腳的題目不是碳權交易市集，不是家戶 P2P 售電，也不是發代幣的綠色積分，這三類都有大量失敗前例。站得住腳的題目要同時滿足三個條件：第一，有**法規硬日期創造出必須付費的使用者**，例如 CBAM、EU 電池護照、EUDR、EU 2024/825 綠色宣稱指令；第二，**多個互不信任的參與者**要共同維護同一份狀態；第三，存在**物理守恆約束**，也就是同一噸 CO₂、同一度電、同一公斤再生料不能被宣稱兩次。符合這三個條件，區塊鏈才不是裝飾。AI 的位置則在「預言機（oracle）端」，負責把真實世界的資料變可信：異常偵測、文件抽取、電池健康度估計、衛星交叉比對。本報告提出 12 個候選題目並逐一評分。最推薦三題：**電池護照生命週期信任層搭配 AI 健康度預言機**、**CBAM／產品嵌入排放的多方傳遞鏈**、**再生料質量守恆帳本**。三題都直接對上評審的研究專長，也對上 COP31 主辦國土耳其的產業壓力，台灣同樣有現成的受害者與使用者。

> 閱讀說明：附有來源連結的敘述屬於證據。標示〔推論〕的段落或句子，是根據證據所做的分析判斷。第四節候選題目中的「解法設計」與「評審契合度」都是推論，「痛點證據」則一律附來源。

## 一、首屆賽事、雙重規則、偏重資安的評審：比賽全貌

### 主辦方是土耳其的 IEEE 志工小組，這是他們第一次辦黑客松

比賽全名是「IEEE ClimateChain Global Hackathon: AI and BLOCKCHAIN Innovate Today for a Sustainable Tomorrow」，線上舉行，總獎金 **3,000 美元**（第一名 1,500、第二名 1,000、第三名 500）。另外最多可提名 **5 位具 IEEE 會員身分的得獎者晉升 Senior Member**。贊助方只有 IEEE Blockchain Committee 與 IEEE Chapters，沒有任何區塊鏈公鏈贊助，因此不存在指定使用哪條鏈的壓力（[Devpost](https://ieee-climatechain-hack.devpost.com/)）。截至 2026-10-14 已有 **804 人報名**，作品展示區尚未公開（[Devpost participants](https://ieee-climatechain-hack.devpost.com/participants)）。官方目標是用區塊鏈與 AI「support the goals of UN COP 31」，打造「trustworthy, decentralized, and scalable climate solutions aligned with international sustainability frameworks」（[Devpost](https://ieee-climatechain-hack.devpost.com/)）。

主辦單位是 IEEE Blockchain Türkiye Group，合作單位包括 IEEE Blockchain Technical Group、IEEE Orange County Section 與 EMBS 分會、IEEE Türkiye Section、**伊斯坦堡商會（Istanbul Chamber of Commerce, İTO）**，以及土耳其 AI 生態系協會（[Devpost](https://ieee-climatechain-hack.devpost.com/)）。這個小組過去辦的是高峰會和研討會，這是它**第一次辦黑客松**（[IEEE Blockchain Türkiye](https://cmte.ieee.org/turkiye-blockchain)）。醫學工程學會 EMBS 會出現在氣候黑客松裡，是因為評審 Gora Datta 擔任 IEEE OC EMBS 分會主席（[IEEE OC EMBS](https://r6.ieee.org/ocs/welcome-to-ieee-orange-county-section-embs-chapter-website)）。〔推論〕首屆賽事沒有歷屆得獎作品可以參考，規則也粗糙，評審很可能憑直覺對照評分標準打分。結構清楚、逐項回應每一條標準的作品，會比內容同樣好但組織鬆散的作品佔優勢。

### 十二位評審分成四群，資安與密碼學背景的人數最多

| 群組 | 評審 | 公開研究與經歷（證據） | 〔推論〕可能看重 |
|---|---|---|---|
| 資安／後量子密碼 | Şeref Sağıroğlu（主席，Gazi 大學） | AI、資安、隱私保護、智慧電網安全架構（[OpenAlex](https://openalex.org/A5005659872)）；主講 Session 2「AI 與資安在氣候韌性中的角色」（[Devpost update](https://ieee-climatechain-hack.devpost.com/updates/46300-tomorrow-session-2-ai-and-cybersecurity-issues-for-climate-change)） | 威脅模型、資料完整性、隱私 |
| | Sedat Akleylek（Tartu 大學） | 後量子密碼、IoT 安全（[UT profile](https://sisu.ut.ee/akleylek)） | 密碼學設計是否正確、加密敏捷性 |
| | Kübra Seyhan（OMU） | 格密碼 PAKE、V2X 與衛星通訊的輕量後量子認證（[OpenAlex](https://openalex.org/A5083363038)） | 裝置認證、輕量簽章 |
| | Mubashar Iqbal（Tartu 大學） | 區塊鏈安全風險框架、數位孿生農食供應鏈威脅建模、去中心化 Agentic AI 安全（[OpenAlex](https://openalex.org/A5065245210)） | 供應鏈威脅模型、SSI 身分 |
| 能源／智慧電網 | Ahmet Soran | 「Blockchain-Based Energy Applications: The DSO Perspective」、VPP 之間以 DeFi 進行 P2P 交易、電力系統偽資料注入偵測（[OpenAlex](https://openalex.org/A5049381037)） | P2P 題目會被拿來和他自己的論文比較 |
| | Saadin Oyucu | 鋰電池 SoC 與容量的可解釋集成估計、再生能源預測（[OpenAlex](https://openalex.org/A5060134461)） | 電池 AI、可解釋性 |
| 供應鏈溯源／DPP | Güven Fidan（團隊負責人） | MindMons（Agentic AI、合規自動化、ZK）CEO；**數位產品護照公司 Beyond Bar Code 共同創辦人**；NetZero TEKMER 氣候科技育成中心總經理（[Fidan CV](https://khazar.org/uploads/centers/ETAI/CV/GFidan%20CV%20.docx)） | DPP、碳足跡、EU 法規契合、新創落地 |
| | Elvan Duman | Hyperledger Fabric 結合 IoT 的冷鏈溯源（[OpenAlex](https://openalex.org/A5061935802)） | IoT 到帳本的溯源 |
| 醫療／標準／矽谷工程 | Gora Datta | IEEE Blockchain TC 創始副主席、IEEE-SA P3228 工作組主席、HL7 Fellow（[IEEE R10](https://www.ieeer10.org/wp-content/uploads/2024/03/Gora-Datta-2024-BCTC-@-IEEE-R10-Mtg.pdf)） | 標準對齊（IEEE 3218 等） |
| | Pradyumna Kodgi | Oracle 產品經理、EMBS OC 副主席（[Devpost](https://ieee-climatechain-hack.devpost.com/)） | 產品化、實用性 |
| | Revanth Reddy Airre | Hippocratic AI 主任工程師、IEEE 矽谷區塊鏈小組主席（[vTools](https://events.vtools.ieee.org/m/520440)）；主講 Session 3「倫理、責任與良好實踐」（[Devpost update](https://ieee-climatechain-hack.devpost.com/updates/46860-register-now-session-3-ethics-responsibility-good-practices-for-climate-innovation)） | 負責任 AI、可量測影響 |
| | Venkatesh Mohanram | 僅知為 SMIEEE、IEEE Blockchain Orange County 成員 | 未知 |

有一點要先說明：Duman、Soran、Oyucu 三人的身分，是用姓名加上土耳其大學或研究主題比對 OpenAlex 得出的，並沒有官方簡介可以確認，屬於可信但**未經驗證**的對應。

〔推論〕這個評審組合有三個實際影響。第一，四位資安與密碼學評審會檢查威脅模型。感測器偽造、預言機操縱、Sybil 身分、重複計算、金鑰外洩這幾類攻擊，作品要附上對應的緩解措施，例如裝置簽章、Merkle 證明、DID／可驗證憑證、零知識證明。如果再提到後量子簽章（ML-DSA）或加密敏捷性，Akleylek 和 Seyhan 很可能會注意到。第二，Fidan 本身經營 DPP 公司和氣候科技育成中心，是影響力最大的評審，賽道三的產品護照題目和他的業務重疊。第三，賽道二有兩位領域專家，一般水準的 P2P 交易 demo 會被拿去和 Soran 已發表的論文比較；電池相關題目則同時對上 Oyucu 和 Fidan 的專長。

### COP31 在安塔利亞：「執行型 COP」、零廢棄、電氣化，以及 CBAM 對土耳其的壓力

COP31 於 **2026-11-09 至 11-20 在土耳其安塔利亞**舉行。土耳其環境部長 Murat Kurum 擔任 COP31 主席，澳洲的 Chris Bowen 擔任「談判主席」，會前另有太平洋 pre-COP，行動議程也包含小島嶼國家（SIDS）氣候融資議題（[Australian PM](https://www.pm.gov.au/media/cop-be-hosted-turkiye-australia-leading-negotiations)）。土耳其主導行動議程，旗艦主題是**電氣化**（熱泵、電動車），另外也提到甲烷、健康、脆弱國家調適與海洋（[Climate Home News](https://climatechangenews.com/2026/09/11/turkiye-says-it-has-final-decision-at-cop31-despite-australia-running-negotiations)）。土耳其把這屆定位為「Implementation COP」，招牌倡議是**零廢棄（Zero Waste）**，由零廢棄基金會主席、COP31 高階氣候倡議者 Samed Ağırbaş 領軍，範圍涵蓋食物浪費、再利用與回收、循環經濟政策，以及廢棄物甲烷；行動議程的其他主軸還有綠色工業化與潔淨能源轉型（[QNB](https://www.qnb.com.tr/surdurulebilirlik/surdurulebilirlik-blog/surdurulebilirlik-bloglari/antalya-puts-three-strategies-ten-actions-on-the-table-for-cop31)；[SETA](https://www.setav.org/en/assessing-the-zero-waste-forum-and-the-cop31-process)）。

土耳其國內的壓力更具體。2025 年 7 月通過首部《氣候法》（第 7552 號），以此為法源建立國家 ETS：**2026–2027 試行期 100% 免費核配，涵蓋範圍就是 CBAM 產業**，納管門檻為年排放超過 5 萬噸 CO₂（[Legal500](https://www.legal500.com/doing-business-in/the-emissions-trading-system-under-turkish-law/)；[iklim.gov.tr](https://iklim.gov.tr/en/draft-regulation-on-the-emissions-trading-system-of-turkiye-released-announcement-26)）。子法已在 2026-08-27 公布（[ICAP](https://icapcarbonaction.com/en/node/1236)），但 Carbon Market Watch 批評草案力道太弱（[CMW](https://carbonmarketwatch.org/wp-content/uploads/2026/05/Turkish-ETS_final-version.pdf)）。同一時間，土耳其出口到歐盟的鋼鐵、水泥、鋁、肥料、電力、氫，從 2026 年起都要開始承擔 CBAM 碳成本（[Legal500](https://www.legal500.com/doing-business-in/the-emissions-trading-system-under-turkish-law/)）。〔推論〕這說明了為什麼土耳其的 IEEE 小組會找伊斯坦堡商會合作，並把比賽和 COP31 綁在一起。能幫出口商通過 CBAM、TR-ETS 與 DPP 要求的題目，最可能引起主辦方共鳴。台灣團隊不需要用土耳其資料，只要把解法設計成全球通用，再放一個「土耳其鋼鐵出口商」或「太平洋 SIDS」的使用情境即可。

IEEE 也有現成標準可以引用：**IEEE 3218-2022**（區塊鏈碳交易應用）（[StandICT](https://standict.eu/standards-repository/standard-using-blockchain-carbon-trading-applications)）、P3225（低碳區評估）（[IEEE SA](https://standards.ieee.org/ieee/3225/10961)）、P3234（區塊鏈碳交易工作組）（[IEEE SA](https://standards.ieee.org/ieee/3234/11668/)），以及 P2418.5（能源領域區塊鏈）（[IEEE P2418.5](https://sagroups.ieee.org/2418-5)）。〔推論〕Datta 長期參與標準制定，在作品裡放一段「標準對齊」說明，把資料欄位對應到這些標準，成本很低，又能顯示團隊有做功課。

### Devpost 與 IEEE 頁面各有一套評分標準和交件清單

| 項目 | Devpost（實際提交平台） | IEEE Blockchain Türkiye 官方頁面 |
|---|---|---|
| 評分標準 | 五項、不加權：Climate Impact、Innovation & Creativity、Technical Execution、Practical Usefulness、Presentation（[Devpost rules](https://ieee-climatechain-hack.devpost.com/rules)） | 氣候影響 30%、技術創新 30%、可行性 10%、**資料安全 10%**、使用者體驗 10%、可擴展性 10%；另列一組 70/20/10 的分配（技術與區塊鏈實作／氣候影響／可擴展性）（[IEEE 頁面](https://cmte.ieee.org/turkiye-blockchain/hackatlon/)） |
| 影片 | 3–5 分鐘 | 3 分鐘 |
| 交件 | 賽道對應說明、專案描述（問題、解法、目標使用者、可擴展性、導入難易度）、公開 GitHub repo 與文件、可運作原型或 PoC | 另外要求**架構圖與技術規格**、**安全與資料完整性評估**、兩頁問題與解法摘要、**氣候影響評估與減碳推估**、導入策略與擴展路線圖、使用者測試結果（若有） |
| 時程 | 截止 **2026-10-25 22:00 GMT+8**（= 14:00 UTC） | 截止 10-25 23:59 UTC；評審期 10-26 至 11-06；得獎者於 COP31 期間公布（頁面寫 11-10 至 11-21，與 COP31 實際的 11-09 至 11-20 不一致） |

### 規則矛盾與注意事項

Devpost 規則頁有一句「Dont submit before official start time which 8 AM PT on October 25」，和 Devpost 側欄的截止時間（台北時間 10-25 22:00，約等於太平洋時間當天 07:00）互相衝突（[Devpost rules](https://ieee-climatechain-hack.devpost.com/rules)）。Devpost 討論區有參賽者提出三個問題，到 2026-10-14 都還沒有主辦方回覆：哪一個提交時間才算數；氣候數據賽道（賽道四）是否一定要有區塊鏈元件；提交表單沒有賽道選項，卻要求上傳檔案（上限 35 MB）（[Devpost forum](https://ieee-climatechain-hack.devpost.com/forum_topics/45102-session-1-recording-and-clarification-on-submission-window)）。原訂 10-05 的培訓課程取消了（[Devpost update](https://ieee-climatechain-hack.devpost.com/updates/46814-climatechain-hackathon-submissions-open-tomorrow-get-ready-to-submit)）。參賽資格寫有「國家限制」，但沒有列出是哪些國家。

〔推論〕實務上有四點建議。一，以台北時間 10-25 22:00 作為硬截止，並提早數小時提交。二，表單沒有賽道選項，所以要在標題、標語和描述開頭明確寫出賽道。三，那個 35 MB 的檔案上傳欄位，正好可以放一份 PDF，把 IEEE 頁面要求但 Devpost 沒列的交件項目補齊：架構圖、安全與完整性評估、減碳推估、路線圖。這樣兩套標準都照顧到。四，即使是賽道四也要放入實質的鏈上元件。比賽名稱、贊助單位、評審背景都指向區塊鏈，沒有鏈上元件的作品在「Innovation… applying blockchain」這一項很難拿分。所有培訓課程反覆出現同一組關鍵字：trust、data integrity、security、privacy、responsible AI、measurable impact（[Devpost update](https://ieee-climatechain-hack.devpost.com/updates/46860-register-now-session-3-ethics-responsibility-good-practices-for-climate-innovation)）。主辦方要的是「AI＋區塊鏈＋可信資料＋安全論述」，不是代幣投機。

## 二、跨領域教訓：只有在多方互不信任且需要守恆時，區塊鏈才真正有用

### 區塊鏈能保證紀錄不被竄改，但保證不了資料是真的

學界與機構文獻的共識很一致。區塊鏈能讓紀錄防竄改、防止重複計算，並在互不信任的多方之間維持共同稽核軌跡，但它**無法讓真實世界的資料變成真的**，這就是「預言機問題（oracle problem）」。2026 年一篇 Nature 系列期刊的系統性回顧，把「以為區塊鏈能保證資料真實」明確列為錯誤假設（[Nature HSSC](https://www.nature.com/articles/s41599-026-07473-9)）。另一份 2026 年的研究指出，帳本只能記錄被輸入的內容（[ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1059056026004648)）。2023 年 MDPI 的系統性回顧則認為區塊鏈在碳市場的應用「仍不成熟」（[MDPI Sustainability](https://www.mdpi.com/2071-1050/15/11/8495)）。判斷是否需要區塊鏈的標準框架，是 Wüst 與 Gervais 在 IEEE CVCBT 2018 提出的決策流程：必須有共享狀態、多個寫入者、寫入者彼此不信任、沒有可接受的常駐可信第三方；只要存在可信第三方，就應該用一般資料庫（[Wüst & Gervais](https://puma.ub.uni-stuttgart.de/bibtex/1d8fa99c6df50e1e371d7c2bc493945c7)）。能耗這個反對理由在權益證明（PoS）鏈上已經不太成立，以太坊合併後能耗約下降 99.95%（[Decrypt](https://decrypt.co/109848/ethereum-energy-carbon-footprint-down-99-percent-merge)）。現在比較有力的質疑集中在治理、資料品質與金融化。

〔推論〕許多氣候題目在第一步就過不了這個測試，因為 Verra、輸電業者、主管機關這類單位本身就是可信第三方。設計上比較站得住的做法，是把大部分工程投入放在預言機與量測層（感測器、遙測、AI 異常偵測、裝置認證、獨立查證者），鏈只當作一層薄而便宜的完整性層。

### 失敗案例很少是技術失敗，問題出在治理、需求與資產品質

TradeLens（Maersk＋IBM）在 2023 年下線。當時全球前六大航商已有五家加入，但競爭對手不願把資料放在由 Maersk 主導的平台，客戶也不願支付高額附加費（[PierNext](https://piernext.portdebarcelona.cat/en/technology/the-closure-of-tradelens/)）。Everledger 因第二輪資金沒有到位而進入管理程序（[Ledger Insights](https://www.ledgerinsights.com/everledger-bankruptcy-esg-blockchain-traceability/)）。Nori 募了 1,725 萬美元，在 2024 年關閉，執行長把原因歸於自願碳市場停滯（[GeekWire](https://www.geekwire.com/2024/nori-a-seattle-based-carbon-removal-marketplace-that-raised-17m-shuts-down-after-7-years/)）。Flowcarbon 募得約 7,000 萬美元，其中至少 3,800 萬來自代幣預售，結果代幣始終沒有發行，最後退款給投資人（[Quartz](https://qz.com/adam-neumann-flowcarbon-refunds-carbon-credit-weowork-1851646629)）。最經典的是 Toucan／KlimaDAO：CarbonPlan 發現 BCT 池中 **99.9% 的碳權來自舊到不符 CORSIA 資格的專案**，約 28% 來自「殭屍專案」（[CarbonPlan](https://carbonplan.org/research/toucan-crypto-offsets)）。2022 年 Verra 禁止把已註銷的碳權代幣化（[QCIntel](https://qcintel.com/carbon/article/verra-bans-credit-tokenisation-sending-toucan-bct-to-new-low-6182.html)）。批評者的結論是：把殭屍碳權代幣化，提升的是流動性，不是品質（[Euronews](https://www.euronews.com/next/2025/02/13/could-a-carbon-credit-backed-digital-currency-help-us-fight-climate-change)）。利物浦的 Poseidon 案則是「區塊鏈洗白」：調查找不到任何證據顯示它的透明功能真的被使用過（[Liverpool Post](https://www.livpost.co.uk/liverpool-was-going-to-become-the/)）。

〔推論〕這些案例歸納出七個紅旗：治理被單一業者掌控、沒有網路效應或投資報酬、把劣質資產代幣化、收入依賴投機市場、代幣涉及證券法風險、透明只是宣傳口號、量測科學本身還沒解決。

### 能長期運作的系統，都是和既有權威合作，只做一件窄而明確的完整性工作

CAD Trust 由世界銀行、IETA 與新加坡政府共同發起，是一層去中心化的詮釋資料（metadata）層，用來串接各碳權登錄處，並標示重複計算風險（[World Bank](https://ppp.worldbank.org/node/7165)）。Energy Web 的 SAFc 登錄處採 book-and-claim 機制，每張憑證在核發或轉移前，都要由獨立節點依預先定義的規則驗證；目前已核發 22,629 噸純 SAF、對應 110,509 噸 CO₂e 減量，第一年約有 50 家企業加入（[Energy Web](https://www.energyweb.org/aviation)）。Hedera Guardian 和 Verra 合作，把 dMRV 方法學數位化（[Verra](https://verra.org/verra-and-hedera-to-accelerate-digital-transformation-of-carbon-markets/)）。Gold Standard 在 2026 年 3 月核發了首批完全數位化、可在 Guardian 上公開追溯的爐具碳權（[Gold Standard](https://goldstandard.org/news/first-fully-digital-cookstove-carbon-credits-issued-publicly-traceable-on-hedera-guardian)）。世界銀行在智利的 D-MRV 試點發現，區塊鏈層比預期簡單，真正困難的是制度環境（[World Bank D-MRV](https://documents1.worldbank.org/curated/en/099605006272210909/pdf/IDU0ca02ce8009a2404bb70bb6d0233b54ffad5e.pdf)）。世界銀行的碳市場基礎設施工作組也提醒，應該重新思考標準、角色與流程，「而不是把一套 20 年前設計的系統數位化」（[World Bank OKR](https://openknowledge.worldbank.org/entities/publication/397c4e52-445a-4cf4-89df-f2e61373a524)）。

### AI 要放在預言機端，也要交代它自己的耗電

國際能源署（IEA）估計資料中心 2024 年用電約 415 TWh，2030 年將達約 945 TWh（[IEA](https://www.iea.org/reports/energy-and-ai/executive-summary)）。2026 年一份報告檢視大型科技公司提出的 154 項「AI 有助氣候」說法，發現多數指的是傳統機器學習而非生成式 AI，只有 26% 引用了學術論文（[Euronews](https://www.euronews.com/green/2026/02/17/ai-greenwashing-most-of-big-techs-ai-climate-promises-fall-flat-study-finds)）。可信的 AI 應用多半是專門化模型，例如偵測企業揭露中「空話」的 ClimateBERT（[arXiv](https://arxiv.org/abs/2311.01469)），或 BIS Project Symbiosis 用 AI 補齊 Scope 3 資料；BIS 指出，金融業 95% 以上的排放屬於 Scope 3（[BIS](https://www.bis.org/about/bisih/topics/cbdc/symbiosis.htm)）。〔推論〕AI 最站得住的角色，是預言機端的品質層：異常偵測、文件抽取與比對、遙測交叉驗證、缺值估計。鏈上應該記錄 AI 輸出的來源資訊，包括模型版本、輸入雜湊與信心區間。把無法驗證的 LLM 輸出寫上鏈，只會讓錯誤資料永久保存。

### 已經被做爛的題目，以及它們對應的失敗前例

| 爛題 | 對應的失敗前例 |
|---|---|
| 碳權 NFT／代幣交易市集 | Toucan／KlimaDAO、Flowcarbon（[CarbonPlan](https://carbonplan.org/research/toucan-crypto-offsets)） |
| 家戶 P2P 太陽能售電代幣 | RENeW Nexus 第一階段 18 戶中有 17 戶比一般電價更貴（[pv magazine](https://www.pv-magazine-australia.com/2020/06/20/blockchain-p2p-solar-energy-trading-proves-feasible-and-popular-in-world-first-trial)）；WePower 已停業（[PitchBook](https://pitchbook.com/profiles/company/85943-71)） |
| 泛用「供應鏈上鏈」溯源 | TradeLens、Everledger |
| 種樹發 NFT、沒有查證的綠色積分代幣 | 無額外性、無 MRV |
| 給碳排小建議的 AI 聊天機器人、個人碳足跡 App 加上代幣 | 沒有付費方，也沒有守恆約束 |
| 用代幣獎勵佈建環境感測器 | PlanetWatch 已被併購並停止運作（[The Block](https://theblock.co/post/292971/solana-depin-ambient-funding-token-acquires-planetwatch)）；2025 年整個 DePIN 產業鏈上營收約 7,200 萬美元，市值約 100 億美元（[Decrypt](https://decrypt.co/356349/depin-tokens-lag-revenues-rise-fundamentals)） |

近年同類黑客松的得獎作品走的都是同一條路線：真實資料進來 → 對齊公認方法學的鏈上憑證 → 使用者用 QR code 驗證，AI 負責驗證或預測。例如 Hedera Origins 永續賽道的冠軍 GreenTrace（溫室氣體追蹤＋GRI 報告），以及季軍 Veritas（產品宣稱上鏈，用 QR 驗證）（[Hedera](https://hedera.com/blog/these-are-the-winners-of-the-hello-future-origins-hackathon/)）。〔推論〕報名人數有 804 人，泛用碳權市集和 P2P 太陽能交易幾乎一定會大量撞題。要做出差異，靠的是縮小到「有法規掛鉤的窄場景」。

## 三、四個賽道的現況、痛點與缺口

### 賽道一（碳市場）：不到 16% 的碳權代表真實減量，改革到 2026 年仍未補上資料可驗證性的缺口

最強的量化證據來自 Probst 等人 2024 年發表在 *Nature Communications* 的綜合研究。研究涵蓋 2,346 個專案、近 10 億噸碳權，估計**不到 16% 代表真實減量**。分項來看，爐具類 11%、避免毀林 25%，風電與改良森林經營則沒有統計上顯著的減量（[TUM](https://tum.de/en/news-and-events/all-news/press-releases/details/carbon-crediting-is-substantially-overestimated)）。爐具碳權平均超額核發 9.2 到 10.6 倍，主因是使用率假設和 fNRB 參數被設定得過度樂觀；唯一接近真實的是 Gold Standard 的實際計量方法學（[UC Berkeley](https://news.berkeley.edu/2024/01/23/as-carbon-offsets-cookstove-emission-credits-are-greatly-overestimated)）。醜聞也一再出現。辛巴威 Kariba REDD+ 被 Verra 認定超額核發 **15,220,520 單位**，其中 **10,321,531 單位已經註銷，卻仍然「有效」**，買家的抵換宣稱不會被撤銷（[Reddmonitor](https://reddmonitor.substack.com/p/152-million-fake-carbon-credits-were)）。C-Quest Capital 前執行長被控竄改爐具數據、騙取逾 1 億美元投資（[CarbonCredits.com](https://carboncredits.com/former-c-quest-capital-ceo-accused-of-100m-carbon-credit-fraud-scheme)）。Article 6.4 的首批碳權在 2026 年發給緬甸爐具計畫，同年 10 月有 130 個公民團體要求暫停（[Down To Earth](https://www.downtoearth.org.in/climate-change/130-civil-society-groups-urge-un-to-suspend-first-carbon-credits-issued-under-paris-agreement)）。加州森林抵換的緩衝池已有近 40% 因火災損失（[CarbonPlan](https://carbonplan.org/blog/offset-fires-2025)）。

市場本身也在萎縮並轉型。2024 年自願碳市場價值約 5.35 億美元，年減 25%（[Forest Trends](https://www.forest-trends.org/pressroom/benchmark-report-finds-the-voluntary-carbon-market-in-transition-demand-holding-steady-as-turnover-stabilizes/)）。專案開發商的詢價只有 **6% 轉為成交**（[Ecosystem Marketplace](https://www.ecosystemmarketplace.com/publications/market-insights-brief-vcm-demand-outlook-january-2026/)）。MSCI 評過的 4,000 多個專案中，不到 10% 落在 AAA–A 級（[MSCI](https://www.msci.com/research-and-insights/paper/2025-state-of-integrity-in-the-global-carbon-credit-market)）。對照之下，合規碳定價在 2025 年的收入超過 1,070 億美元，覆蓋全球約 29% 的排放（[World Bank](https://www.worldbank.org/en/news/press-release/2026/05/19/direct-carbon-pricing-covers-nearly-one-third-of-global-emissions)），規模比自願市場大兩個數量級。CORSIA 第一階段的合格單位，在 42 份授權函（LoA）支撐下只有約 7,200 萬，與需求仍差約 1.5 億單位（[CAPA/IATA](https://centreforaviation.com/news/iata-corsia-eeu-supply-growing-but-falling-well-short-of-units-needed-by-2028-1373032)）。迦納轉移給瑞士的 11,733 個 ITMO，要等到 2026 年底的 BTR2 才報告相應調整（[UNFCCC Ghana Q&A](https://unfccc.int/sites/default/files/resource/FMCP3_Ghana_Q&A.pdf)）。評級機構彼此也不一致：同一個亞馬遜專案，Sylvera 給 Tier 1、Calyx 給 D、BeZero 給 C（[Trellis](https://trellis.net/article/top-carbon-credit-rating-agencies-are-often-inconsistent-and-inaccurate-watchdog-claims)）。Pachama 在 2025 年被 Carbon Direct 收購（[TechCrunch](https://techcrunch.com/2025/11/10/consolidation-begins-to-hit-the-carbon-credit-market/)）。

法規端的變化，是揭露義務收縮，但宣稱與邊境管制變嚴。EU 2024/825 指令自 2026-09-27 起，禁止僅憑抵換就宣稱產品「碳中和」（[EUR-Lex](https://eur-lex.europa.eu/eli/dir/2024/825/oj)）。KLM 被荷蘭法院判定「Fly Responsibly」廣告違法，19 項聲明中有 15 項構成誤導（[Clyde & Co](https://www.clydeco.com/en/insights/2024/03/first-ever-greenwashing-judgment-against-an-airlin)）。CBAM 自 2026 年起進入確定期：沒有經查證實際數據的產品要套用預設值，而且**預設值逐年加成，2026 年加 10%、2027 年加 20%、2028 年起加 30%**；首次申報期限是 2027-09-30（[Reed Smith](https://www.reedsmith.com/our-insights/blogs/viewpoints/102lr9t/what-you-need-to-know-as-cbam-simplification-comes-into-effect/)）。義大利的鋼材再軋業者直接說預設值「unworkable」（[Eurometal](https://eurometal.net/italian-rerollers-and-buyers-call-cbam-values-unworkable-actual-emissions-verification-a-priority-in-2026/)）。

台灣的情況是：碳費一般費率每噸 300 元，但 403 廠取得 50 元或 100 元的優惠費率（[工商時報](https://www.ctee.com.tw/news/20260416701788-431401)）。碳費遠低於碳權價格，結果碳交所國內平台開張約一年半，**只成交 5 筆、共 69 噸**；自願減量專案有 40 案登錄，至今**一張法定額度都還沒核發**（[聯合報](https://ubrand.udn.com/ubrand/story/124263/9500260)）。〔推論〕台灣碳市場真正的壓力不在國內碳費，而在 CBAM 與品牌商的供應鏈要求。賽道一最有價值的缺口有四個：可撤銷的「宣稱—註銷」連結、Article 6 授權與相應調整狀態的透明化、中小企業的可信嵌入排放資料，以及用量測取代假設的 dMRV。

### 賽道二（再生能源）：憑證讓企業的帳面減碳約為實際的三倍，P2P 交易的瓶頸在電價結構而不是帳本

Bjørn 等人 2022 年發表在 *Nature Climate Change* 的研究分析了 115 家設有 SBT 的企業：宣稱減量 30%，實際約只有 10%，其中約三分之二的宣稱減量來自「很可能不具額外性」的憑證（[Scientific American](https://www.scientificamerican.com/article/renewable-energy-credits-allow-companies-to-overstate-emissions-reductions/)）。Princeton ZERO Lab 的研究發現，年度比對對系統排放幾乎沒有影響，只有逐時比對能穩定降低排放（[Princeton](https://acee.princeton.edu/acee-news/andlinger-center-speaks-companies-are-betting-on-a-new-approach-to-cleaning-up-electricity-grids/)）。GHG Protocol 的 Scope 2 改版草案原本要強制大型組織逐時比對，但 1,072 份諮詢回應中，**70% 低度支持或不支持**。反對者最常見的理由是資料基礎設施與會計團隊能力跟不上，終版因此延到 2028 年底（[Argus](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2858486-ghg-protocol-faces-pushback-on-scope-2-reforms)；[EnergyTag](https://energytag.org/under-the-hood-ghgp/)）。另一方面，Google 2024 年的逐時無碳電力比例已達 66%（[edie](https://www.edie.net/google-posts-strong-progress-with-24-7-carbon-free-energy-goal/)），而現有的 EAC 登錄系統大多只能月度或年度核發（[LF Energy](https://tac.lfenergy.org/meetings/2026/2026-03-10/LF%20Energy%20%20RegistryOS%20TAC%20Sandbox%20Proposal.pdf)）。重複宣稱也有實例：冰島媒體揭露重複宣稱後，AIB 暫停了冰島的 GO 出口（[AIB](https://www.aib-net.org/sites/default/files/assets/news-events/press-releases/2023/AIB-2023-BD-08%20Press%20release.pdf)）。冰島主管機關調查發現，高耗能用戶手上沒有足夠的 GO 支撐「使用再生能源」的宣稱，但因為規則沒有禁止重複宣稱，所以不算違規（[Orkustofnun](https://orkustofnun.is/en/news/medfylgjandi-er-stoduskyrsla-raforkueftirlits-orkustofnunar)）。

P2P 交易的失敗原因很清楚。Brooklyn Microgrid 的試點只有不到 60 位產消者（[arXiv](https://arxiv.org/pdf/2106.05395)）。Powerledger 已退役自有鏈、遷到 Solana，POWR 代幣從高點跌了超過 97%（[The Defiant](https://thedefiant.io/news/press-releases/powerledger-expands-with-solana-bringing-its-sustainability-expertise-to-the-ecosystem)；[Coinbase](https://www.coinbase.com/zh/price/power-ledger)）。對照組是不用區塊鏈的 Piclo：已登記超過 35 萬個資產、30 GW 以上的彈性容量（[Piclo](https://www.piclo.energy/about)）。電網的真實難題則是棄電與壅塞。中國 2026 年上半年官方公布的棄電率是光電 8.6%、風電 9.1%，獨立機構以天氣校正估計卻高達 **26.1%**（[GEM](https://globalenergymonitor.org/sites/default/files/2026-07/GEM%20China%20Wind%20&%20Solar%20brief%20July%202026.pdf.pdf)）。德國 2024 年棄電 9.4 TWh（[Modo](https://modoenergy.com/research/en/de-germany-bess-batteries-grid-balancing-redispatch-explainer-july-2025)），2025 年再調度成本約 27 億歐元（[Baker McKenzie](https://www.bakermckenzie.com/en/insight/publications/2026/03/germany-grid-package-draft)）。北美 VPP 容量為 37.5 GW，主要障礙是第三方資料存取與結算（[Wood Mackenzie](https://www.woodmac.com/press-releases/virtual-power-plant-capacity-expands-13.7-year-over-year-to-reach-37.5-gw/)）。南方國家的離網太陽能產業，2024 年新創投資年減 70%，只剩 4,800 萬美元（[GOGLA](https://gogla.org/reports/investment-data-report/after-the-dip-off-grid-solars-defining-moment/)）；業者要先投入「數十萬美元」才能開始賣碳權（[GOGLA](https://gogla.org/blog/introduction-to-the-voluntary-carbon-market-for-off-grid-solar/)）。

台灣的痛點相當尖銳。2025 年自由市場綠電交易約 58 億度，不到再生能源發電量的一成，而且多被科技大廠買走，中小企業「有錢也買不到」（[數位時代](https://www.bnext.com.tw/article/90848/2026-green-power-shortage-crisis)）。RE100 代表在 SEMICON Taiwan 表示，台灣製造業的綠電使用率只有 6%（[NOWnews](https://www.nownews.com/news/6872214)）。台積電 2024 年再生能源佔比 14.1%（[聯合報](https://udn.com/news/story/7240/9219326)）。長約綠電若發用電時間不匹配會產生「餘電」，導致企業為同一度電付兩次錢，連已達成 RE100 的台達電都得另外補買憑證（[Reccessary](https://www.reccessary.com/zh-tw/news/new-unbundled-rec-system-challenge)）。台電正規劃把結算從月結縮短到 15 分鐘（[自由時報](https://ec.ltn.com.tw/article/paper/1755030)）。土耳其的國家憑證 YEK-G 累計發行 45,360.75 GWh，組織化市場卻只成交 5,660.7 GWh（[TİM](https://ftp.tim.org.tr/download/a9cb7cb20956425ea60f8211f4d7bdf7/2.4.%20Yenilebilir%20Enerji%20Kaynak%20Garanti%20Sistemi%20(YEK-G).pdf)）。〔推論〕賽道二值得做的是「證明」而不是「交易」：逐時比對證明、跨憑證系統的宣稱對帳、棄電吸收證明，以及分散式太陽能的低成本 MRV。

### 賽道三（永續供應鏈）：2026 年起，法規讓「付費方」第一次真正出現

和十年前那波區塊鏈溯源熱潮相比，最大的差別是現在有了**市場准入型法規的硬日期**。CBAM 已在 2026-01-01 進入確定期；EU DPP 中央登錄系統於 2026-07-20 上線（[EU Transition Pathways](https://transition-pathways.europa.eu/retail/news/digital-product-passport-registry-now-live)）；EUDR 自 2026-12-30 起適用於大中型業者（[EY](https://taxnews.ey.com/news/2026-0237-eu-deforestation-regulation-application-postponed-to-30-december-2026)）；**電池護照自 2027-02-18 起強制，沒有延期**，適用 EV 電池、LMT 電池與 2 kWh 以上的工業電池（[Minespider](https://www.minespider.com/blog/eu-battery-passport-what-the-february-2027-deadline-means-after-the-commissions-may-2026-implementation-update)）。標準層面還有明顯缺口：CEN-CENELEC 在 2026-05-27 發布了 DPP 的識別碼、資料載體、API 等標準，但**「資料認證與完整性」（prEN 18246）和「存取權限」（prEN 18239）兩項仍是草案**（[CDX](https://public.cdxsystem.com/web/cdx/w/eu-digital-product-passport-technical-framework-takes-shape-with-registry-launch)）。電池護照的存取權限實施法案也錯過了 2026-08-18 的期限（[eudigitalproductpassport.org](https://eudigitalproductpassport.org/updates/battery-passport-access-rights-implementing-act-delay)）。多數 OEM 目前仍靠試算表與供應商問卷處理（[Sibros](https://www.sibros.tech/post/navigating-the-eu-battery-passport-what-oems-need-to-know-before-2027)）。反過來，報告型法規正在退潮：Omnibus I 把 CSRD 適用範圍縮到員工超過 1,000 人且營收超過 4.5 億歐元的企業（[Covington](https://www.cov.com/en/news-and-insights/insights/2026/02/eu-csddd-csrd-omnibus-published-in-official-journal-transposition-delegated-acts-and-guidelines-are-next)）。

資料缺口集中在上游。CDP 與 BCG 指出，上游 Scope 3 平均是直接營運排放的 26 倍（[supplier.io](https://supplier.io/resources/blog/urgent-call-to-address-scope-3-ghg-emissions-in-new-cdp-supply-chain-report)）。PCF 交換格式已經收斂到 PACT 規格，採用企業超過 5,000 家（[WBCSD](https://wbcsd.org/actions/partnership-for-carbon-transparency-pact)）。Catena-X 實際交換資料的參與者從 182 家成長到 1,069 家，但許多中小企業仍因前期成本而觀望（[Automotive Logistics](https://www.automotivelogistics.media/supply-chain/more-thannbsp1000-oems-and-suppliers-now-exchanging-data-through-catena-x-network/2746686)），德國政府甚至要補貼每個 use case 1.5 萬到 3 萬歐元（[Cofinity-X](https://www.cofinity-x.com/blog/data-space-accelerator-helps-smes-join-catena-x-with-up-to-eu30-000)）。漂綠問題多半出在方法論漏洞，而不是資料被竄改。歐盟 2020 年的調查發現 53.3% 的環境宣稱模糊或沒有根據（[EC](https://environment.ec.europa.eu/topics/circular-economy/green-claims_en)）。ProPublica 發現，以 mass balance 方式標示含 20–30% 再生料的產品，實際含量不到 1%，美國 EPA 也已把 mass balance 排除在 Safer Choice 計畫之外（[ProPublica](https://www.propublica.org/article/epa-rejects-mass-balance-plastics-recycling-safer-choice)）。真正能抓到造假的是鑑識抽測：Reuters 透過資訊公開取得的 CBP 檢測結果顯示，86 件服飾中有 13 件與新疆棉特徵一致（[WWD](https://wwd.com/sourcing-journal/industry-news/uflpa-hearing-forced-labor-enforcement-isotopic-testing-oritain-de-minimis-1238827687/)）。GBA 電池護照試點透露一個關鍵數字：只追蹤約 1–2% 的電池實體質量，就能收集到 50–95% 的碳足跡資料（[GBA](https://www.globalbattery.org/media/pilot/documents/gba-bp-pilot-master.pdf)）。

循環經濟的數字普遍偏低。2022 年全球電子廢棄物 6,200 萬噸，只有 22.3% 有正式回收紀錄（[UNITAR](https://unitar.org/index.php/about/news-stories/press/global-e-waste-monitor-2024-electronic-waste-rising-five-times-faster-documented-e-waste-recycling)）。歐盟要求成員國在 2028-04 前建立紡織品 EPR（[Beveridge & Diamond](https://www.bdlaw.com/publications/eu-targets-textile-waste-with-waste-framework-directive-amendments/)）。台灣同時面對多重壓力：約 2,600 家業者受 CBAM 影響，以金屬加工中小企業為主（[CSRone](https://csrone.com/news/9005)）；螺絲業者表示，螺帽碳排有 **95% 來自原料與運輸**，工廠自己的用油用電只佔 5%（[公視《我們的島》](https://ourisland.pts.org.tw/content/10445)）；2026 年 6 月三讀通過的《資源循環推動法》第 22 條參考歐盟 DPP，授權環境部指定物品揭露再生料比例與材質流向。環境部的台灣 DPP 試行計畫目前有 29 家企業、累計超過 2 萬筆產品資訊，參與業者最擔心的是**方案或資料被抄襲，以及收到假資料**（[Reccessary](https://www.reccessary.com/zh-tw/news/Taiwan-Digital-Product-Passport)）。〔推論〕這正是選擇性揭露（ZK／VC）加上簽章溯源最能派上用場的地方。賽道三的作品應定位成「與 PACT、EN 18216 系列、台灣 DPP 開源模組相容的信任層」，不要另外做一條封閉的鏈。

### 賽道四（氣候數據）：瓶頸已從「偵測得到」轉向「有人負責」

IEA 估計能源業甲烷排放每年超過 1.2 億噸，比各國向 UNFCCC 申報的數字高約 80%（[IEA](https://www.iea.org/news/methane-data-and-transparency-continue-to-improve-but-emissions-remain-far-too-high)）。UNEP 的甲烷警報系統（MARS）已發出 3,500 多則警報，回應率一年內從 1% 升到 12%，但**仍有近九成沒有回應**（[IISD](https://sdg.iisd.org/news/un-report-calls-for-scaling-action-on-methane-through-data-driven-solutions/)）。美國收到 138 則警報，**一則都沒有回應**（[Irish Examiner](https://www.irishexaminer.com/world/arid-41904757.html)）。孟買一個衛星畫面中就有 7 座掩埋場冒出 9 道甲烷煙流，將近一年後再觀測，多數仍在排放（[Carbon Mapper](https://carbonmapper.org/articles/mumbai-waste-sites)）。獨立監測能力也很脆弱：MethaneSAT 在 2025 年 6 月失聯，原訂 5 年的任務只撐了約 15 個月（[Wikipedia](https://en.wikipedia.org/wiki/MethaneSAT)）。2025 年美國陸續下架或降級多項氣候資料：climate.gov 被導向 noaa.gov，十億美元級災害資料庫停止更新，NSIDC 的冰雪產品降為基本支援（[Eos](https://eos.org/?p=237300)；[NSIDC](https://nsidc.org/data/user-resources/data-announcements/user-notice-level-service-update-data-products)）。Harvard LIL 隨即保存了 31.1 萬個以上資料集、約 17.9 TB，並**附上數位簽章供驗證**（[Harvard LIL](https://lil.law.harvard.edu/blog/2025/02/06/announcing-data-gov-archive)）。

全球南方則是基本觀測都不足。查德只有 1 個地面站符合 GBON 標準，需求是 33 個（[SOFF Chad](https://mptf.undp.org/sites/default/files/documents/2025-03/soff_chad_prodoc_wfp_redacted.pdf)）。小島嶼國家的早期預警覆蓋率只有 43%（[WMO](https://wmo.int/news/media-centre/early-warning-systems-reach-new-heights-critical-gaps-jeopardize-global-progress)）。太平洋地區平均每兩年就失去一組長期氣候資料（[NIWA](https://niwa.co.nz/pacific/pasifika-panui/issue-3-march-2026/sustainable-observation-networks)）。全球有 36% 的國家、近 10 億人沒有政府空品監測（[CCAC/OpenAQ](https://www.ccacoalition.org/resources/open-air-quality-data-global-landscape)）。低價感測器最大的誤差來源是相對濕度（[PMC](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11900072/)）。參數型保險的核心弱點是基差風險，也就是賠付與實際損失對不上（[arXiv](https://ar5iv.labs.arxiv.org/html/2111.08601)）；撒哈拉以南非洲只有 3% 的小農有農業保險（[CPI Lab](https://www.climatefinancelab.org/wp-content/uploads/2019/01/Blockchain_instrument-overview.pdf)）。AI 氣象模型 GenCast 在 1,320 個評估目標中有 97.2% 勝過 ECMWF 的系集預報（[DeepMind](https://deepmind.google/discover/blog/gencast-predicts-weather-and-the-risks-of-extreme-conditions-with-sota-accuracy/)），但這類模型普遍低估破紀錄的極端事件（[Anadolu](https://aa.com.tr/en/europe/ai-weather-models-struggle-to-predict-extreme-events-swiss-study/3923211)），而且仍然需要觀測資料來初始化。WeatherXM 的資料被 meteoblue 採用時，要先按品質分數過濾（[meteoblue](https://business.meteoblue.com/changelog/weatherxm-station-quality-filtering)）。

在土耳其，伊斯坦堡水庫蓄水率在 2025 年 10 月跌破 25%（[Daily Sabah](https://www.dailysabah.com/turkiye/istanbul/istanbuls-dam-levels-fall-below-25-amid-ongoing-water-shortage)），2025 年上半年發生 3,044 起火災（[NTV](https://www.ntv.com.tr/turkiye/galeri-izmirin-cigerleri-yandi-daglar-siyaha-burundu,UNHhnp0cEU6tcKtD1GN2Dg)）。台灣有民生公共物聯網的一萬多個微型感測器（[行政院](https://www.ey.gov.tw/Page/9277F759E41CCD91/cc905518-12e7-476d-b83b-fd2ddc1712d5)），以及 g0v Disfactory 這類公民科技成果：3,215 則公民回報促成了 859 件正式檢舉（[CET](https://www.cet-taiwan.org/node/4071)）。2025 年馬太鞍溪堰塞湖已被監看兩個月，仍因豪雨提前溢流，造成光復鄉 19 人死亡、5 人失蹤（[鏡週刊](https://www.mirrormedia.mg/story/20250924edi040)；[總統府](https://www.president.gov.tw/File/Doc/3e4af3fb-e64d-42e0-bb9d-951ca80e25b4)）。〔推論〕賽道四最站得住的區塊鏈用途有三種：裝置簽章加上校正紀錄上鏈、公共資料集公證、可稽核的自動觸發。單靠代幣獎勵佈建感測器的模式，過去紀錄很差。

## 四、十二個候選題目：從真實痛點反推解法

篩選標準有四條：第一，痛點要有量化證據；第二，要有法規、採購或資金流創造出的付費方；第三，要通過 Wüst–Gervais 測試，至少要有一個「多方共享狀態加守恆約束」的理由；第四，AI 要負責預言機端的具體工作。以下每題的「解法」「質疑與回應」「評審契合」都屬於〔推論〕，「痛點證據」則引用第三節的資料。

### A. CBAM／產品嵌入排放的多方傳遞鏈（賽道一＋三）

**問題與使用者**：非歐盟的中小型金屬加工廠，例如台灣的扣件廠或土耳其的鋼鋁出口商，必須提供經查證的產品嵌入排放，否則它們的歐盟進口商只能套用逐年加成 10%→20%→30% 的預設值（[Reed Smith](https://www.reedsmith.com/our-insights/blogs/viewpoints/102lr9t/what-you-need-to-know-as-cbam-simplification-comes-into-effect/)）。螺帽碳排有 95% 來自上游原料與運輸（[公視](https://ourisland.pts.org.tw/content/10445)），所以扣件廠的數字取決於上游鋼廠願不願意、能不能提供可信的分配數據。台灣約有 2,600 家業者受影響（[CSRone](https://csrone.com/news/9005)），義大利買家則直說預設值「unworkable」（[Eurometal](https://eurometal.net/italian-rerollers-and-buyers-call-cbam-values-unworkable-actual-emissions-verification-a-priority-in-2026/)）。

**現有解法為何不夠**：PACT 與 Catena-X 解決了交換「格式」的問題，但中小企業接入成本高，連德國都要靠補貼推動（[Cofinity-X](https://www.cofinity-x.com/blog/data-space-accelerator-helps-smes-join-catena-x-with-up-to-eu30-000)）。PACT 傳遞的是數字加上自我聲明的驗證狀態，沒有機制防止上游把同一批低碳鋼的排放屬性重複分配給多個下游客戶。

**解法**：AI 從電費單、燃料發票、生產紀錄、上游鋼材證書中抽取活動數據，套用公開係數計算設施級與產品級排放，並標出異常，例如單位產品用電量偏離同業分布。區塊鏈記錄每一批上游材料的「排放屬性額度」被分配給哪些下游批次，由智慧合約強制**分配總量不得超過該批次的實際產量**，也就是守恆約束。對外輸出 PACT v3 JSON 和 CBAM 通訊範本，並把初級數據比例與證據雜湊簽成可驗證憑證。競爭對手之間只透過零知識範圍證明揭露「碳強度低於某閾值」，配方與供應商名單不公開。

**為何需要區塊鏈**：鋼廠、加工廠、貿易商、歐盟進口商、查證機構分屬不同國家，彼此互不信任，鏈上也沒有一個各方都接受的常駐營運者。真正需要共享的是「這批鋼的屬性額度還剩多少」這個狀態。只用簽章或 VC 可以證明「誰說了什麼」，卻防不了重複分配。這是本題通過 Wüst–Gervais 測試的關鍵。如果整條供應鏈只有一家主導廠商，用資料庫就夠了，這一點要誠實說明。

**掛鉤**：CBAM 確定期（首次申報 2027-09-30）、土耳其 TR-ETS 試行期涵蓋 CBAM 產業、台版 CBAM、COP31 綠色工業化主軸、伊斯坦堡商會的會員產業、IEEE 3218。

**質疑與回應**：質疑一是「查證機構已經在做這件事」。回應：查證機構查的是單一設施，跨廠的分配守恆不在他們的範圍內；本工具的定位是產出查證機構可以直接使用的證據包。質疑二是「上游鋼廠不會配合」。回應：預設值加成讓實際數據有了直接的金錢價值，下游買家會施壓。

**評審契合**：Fidan（合規自動化、ZK）、Iqbal（供應鏈威脅模型）、資安群（ZK 選擇性揭露），而且直接對上伊斯坦堡商會。

### B. 碳權「宣稱—註銷」綁定與事後召回登記（賽道一）

**問題與使用者**：使用者是購買碳權的企業、消費者保護機關，以及漂綠訴訟中的原告與被告。Kariba 案中有 1,032 萬單位已註銷、事後被認定超額的碳權仍然「有效」，買家的宣稱不會被撤銷，事後糾正機制幾乎不存在（[Reddmonitor](https://reddmonitor.substack.com/p/152-million-fake-carbon-credits-were)）。EU 2024/825 自 2026-09-27 起禁止僅憑抵換宣稱碳中和（[EUR-Lex](https://eur-lex.europa.eu/eli/dir/2024/825/oj)），KLM 也已被判漂綠（[Clyde & Co](https://www.clydeco.com/en/insights/2024/03/first-ever-greenwashing-judgment-against-an-airlin)）。

**現有解法為何不夠**：登錄處只記錄註銷，不記錄「這次註銷支撐了哪一句行銷宣稱」。評級機構之間彼此不一致，又有付費牆（[Trellis](https://trellis.net/article/top-carbon-credit-rating-agencies-are-often-inconsistent-and-inaccurate-watchdog-claims)）。CAD Trust 處理的是登錄處之間的詮釋資料，不處理下游的企業宣稱。

**解法**：企業把每一句對外宣稱（廣告、ESG 報告、產品標籤）連同對應的註銷序號登記上鏈。AI 持續監控 Verra／Gold Standard 的狀態變更、ICVCM CCP 標籤、評級變動、同儕審查研究（例如 Probst 的類別折扣係數）與新聞爭議。一旦某專案被判超額，就自動標記所有受影響的宣稱，並通知宣稱者與公眾。

**為何需要區塊鏈**：宣稱者、多個登錄處、評級機構、NGO 監督者之間沒有一個大家都接受的中立營運者，而且「宣稱曾經存在、何時被標記」本身就是法律證據，需要公開、防事後刪改。強度中高。如果登錄處願意自己開放 API 並增加宣稱欄位，鏈的必要性就會下降。

**掛鉤**：EU 2024/825、SBTi V2 對碳權用途的限制、IEEE 3218。**質疑**：企業為什麼要自願登記？回應：在 2024/825 的規範下，可稽核的宣稱證據包就是企業的法律防線。**評審契合**：中等，資安群與 Datta 會重視稽核軌跡，但沒有評審直接研究碳權。

### C. Article 6 授權與相應調整的追蹤帳本（賽道一）

**問題與使用者**：使用者是航空公司（CORSIA）、新加坡與日本的合規買家、小國主管機關，以及台灣碳費制度中「5% 國外額度」的使用者（[Reccessary](https://www.reccessary.com/zh-tw/news/what-is-Taiwan-Carbon-Solution-Exchange-tcx)）。CORSIA 第一階段缺口約 1.5 億單位，瓶頸在授權函（[CAPA/IATA](https://centreforaviation.com/news/iata-corsia-eeu-supply-growing-but-falling-well-short-of-units-needed-by-2028-1373032)）。迦納的 ITMO 轉移完成一年多後才做相應調整（[UNFCCC](https://unfccc.int/sites/default/files/resource/FMCP3_Ghana_Q&A.pdf)）。日本的 JCM 目標是 2030 年累計 1 億噸，到 2026-06 只取得約 0.8 百萬噸（[Climate Action Tracker](https://climateactiontracker.org/documents/1424/CAT_2026-06_Assessment_Article6_Japan.pdf)）。

**現有解法為何不夠**：COP29 通過了雙層登錄系統，但公民團體警告，沒有交易功能的國際登錄處會讓小國只能依賴第三方（[Carbon Market Watch](https://carbonmarketwatch.org/2024/11/06/faq-fixing-article-6-carbon-markets-at-cop29/)）。CAD Trust 已經是一層去中心化詮釋資料層（[World Bank](https://ppp.worldbank.org/node/7165)），因此本題的差異化空間有限。

**解法**：每個單位都有一條狀態機：已授權、已首次轉移、已做相應調整、被哪個制度使用（CORSIA、新加坡、日本、台灣、K-ETS）。AI 解析授權函、BTR 與各國公告，自動比對不一致之處，例如某單位已被 CORSIA 使用，但東道國的 BTR 沒有對應的調整。

**為何需要區塊鏈**：參與者是主權國家，本質上沒有可信第三方，是 12 題中最符合 Wüst–Gervais 測試的一題。但既有的 CAD Trust 和 UNFCCC 登錄處已經佔據這個位置，作品必須定位為「疊在 CAD Trust 之上的跨制度使用與 AI 一致性檢查」，不能重做登錄處。

**掛鉤**：COP31 的執行議程、SIDS 能力建構。**質疑**：國家不會把資料寫到你的鏈上。回應：從公開文件抽取資料即可運作，不需要寫入權限。**評審契合**：中等，題目偏政策，沒有評審專精此領域。

### D. 逐時綠電匹配證明與跨憑證系統防重複宣稱（賽道二）

**問題與使用者**：使用者是台灣、土耳其、韓國的出口型中小企業，以及要向品牌商證明綠電使用的供應商。台灣自由綠電不到一成，中小企業買不到（[數位時代](https://www.bnext.com.tw/article/90848/2026-green-power-shortage-crisis)）；餘電造成重複付費（[Reccessary](https://www.reccessary.com/zh-tw/news/new-unbundled-rec-system-challenge)）；Scope 2 諮詢的反對者自己就點出「資料基礎設施不足」（[Argus](https://www.argusmedia.com/en/news-and-insights/latest-market-news/2858486-ghg-protocol-faces-pushback-on-scope-2-reforms)）；冰島則有重複宣稱卻不算違規的先例（[Orkustofnun](https://orkustofnun.is/en/news/medfylgjandi-er-stoduskyrsla-raforkueftirlits-orkustofnunar)）。

**現有解法為何不夠**：逐時憑證登錄系統還在升級或試點階段（[LevelTen](https://www.leveltenenergy.com/post/announcing-registry-acceleration-fund-award-recipients)）。T-REC、YEK-G、I-REC、GO 之間沒有跨系統的宣稱對帳機制。

**解法**：AI 讀取 15 分鐘電表資料、轉供紀錄與 T-REC 開放資料，計算逐時 CFE 比例、餘電量，以及「年度比對與逐時比對」的帳面差距，再用負載預測給出採購建議。鏈上只放資產 ID、期間與宣稱的雜湊，並用規則檢查同一資產、同一時段是否在多個系統重複宣稱。

**為何需要區塊鏈**：強度中等。核發憑證是各國登錄機構的獨佔業務，不能也不該搬上鏈。鏈的價值只在跨國、跨登錄處的「宣稱層」對帳。如果某國只有單一登錄處，資料庫就夠了。逐時健檢本身則完全不需要區塊鏈。

**掛鉤**：GHG Protocol Scope 2 改版、RE100、台電 15 分鐘結算、COP31 電氣化主軸。**質疑**：登錄處自己升級後，這個工具就沒用了。回應：跨登錄處的對帳不會因任何單一登錄處升級而消失。**評審契合**：Soran 的 DSO 觀點、Oyucu 的預測專長。

### E. 棄電吸收的可驗證證明（賽道二）

**問題與使用者**：使用者是電網營運者、可調度負載（資料中心批次運算、冷凍倉儲、電動車車隊、儲能），以及想要證明「高品質減碳」的買家。中國官方與獨立估計的棄電率分別約 9% 與 26.1%，差距本身就說明資料不透明（[GEM](https://globalenergymonitor.org/sites/default/files/2026-07/GEM%20China%20Wind%20&%20Solar%20brief%20July%202026.pdf.pdf)）；德國 2024 年棄電 9.4 TWh（[Modo](https://modoenergy.com/research/en/de-germany-bess-batteries-grid-balancing-redispatch-explainer-july-2025)）；CAISO 2024 年棄電 3.4 TWh（[NewsData](https://www.newsdata.com/california_energy_markets/regional_roundup/analysis-caiso-curtailments-could-reach-record-again-in-2025/article_82daea66-4ec7-4026-8d84-4bc54dfbe105.html)）。

**解法**：AI 預測棄電與負電價時段，排程可調度負載移入這些時段。電網端的棄電訊號、電表的實際用電量、邊際排放係數三方簽章後錨定上鏈，產生「吸收了本來會被棄掉的電」的逐時證明，可搭配逐時憑證使用。

**為何需要區塊鏈**：坦白說偏弱。電網營運者本身就是可信第三方，簽章資料庫就能完成大部分工作。鏈的價值只在於證明要被多個買家與查證者重複引用、而且必須防止同一筆吸收量被重複出售。本題的主要價值在 AI。**掛鉤**：COP31 潔淨能源轉型、IEA 對棄電的警告（[IEA](https://www.iea.org/reports/renewables-2025/executive-summary)）。**質疑**：邊際排放的計算方法有爭議，Emissions First 與 24/7 CFE 兩派仍在爭論（[NewClimate](https://newclimate.org/news/briefing-247-renewable-electricity-matching-is-a-far-more-credible-approach-for-the-ghg)），需要並列兩種會計方式。**評審契合**：Soran、Oyucu、Sağıroğlu（智慧電網安全）。

### F. 分散式太陽能 dMRV 與「補貼／碳權／I-REC」三重申報防重（賽道二＋一）

**問題與使用者**：使用者是撒哈拉以南非洲與南亞的 PAYG 太陽能業者、結果導向融資（RBF）的出資方，以及碳權買家。2024 年離網太陽能新創投資年減 70%（[GOGLA](https://gogla.org/reports/investment-data-report/after-the-dip-off-grid-solars-defining-moment/)），進入碳權市場要先投入數十萬美元（[GOGLA](https://gogla.org/blog/introduction-to-the-voluntary-carbon-market-for-off-grid-solar/)）。同一套家用太陽能系統可能同時申請 RBF 補貼、碳權與 I-REC，目前卻沒有跨系統的唯一資產 ID。

**現有解法為何不夠**：Global Carbon Council 的 EAP001 方法學才剛把 PAYGo 資料納入數位 MRV（[GCC](https://globalcarboncouncil.com/?p=9103)），而 RBF 與 I-REC 各自維護自己的資料。

**解法**：PAYG 遙測資料由裝置簽章。AI 偵測異常與詐欺，例如發電曲線不符合當地日照、同一裝置被重複註冊。系統一次產出三份資料包，分別符合 RBF 撥款、EAP001 碳權與 I-REC 聚合的格式。鏈上維護每一台裝置、每一段期間的「環境屬性已被哪個系統領取」狀態。

**為何需要區塊鏈**：強度中高。三套制度由不同機構營運、互不隸屬，防止同一度電被三方重複領取，需要一份共享狀態。**掛鉤**：COP31 的 SIDS 與脆弱國家融資議題、Article 6.4。**質疑**：小業者付不起。回應：自動化的目的正是把「數十萬美元」的前期成本攤平。**評審契合**：中等，Iqbal 的 SSI 研究與 Seyhan 的輕量認證可用在裝置身分。

### G. 電池護照生命週期信任層搭配 AI 健康度預言機（賽道三，可兼賽道二）

**問題與使用者**：使用者是電動自行車、無人機與工業儲能的電池模組廠，二次利用的整合商，回收商，以及二手電池的買家。EU 電池護照自 2027-02-18 強制，不會延期（[Minespider](https://www.minespider.com/blog/eu-battery-passport-what-the-february-2027-deadline-means-after-the-commissions-may-2026-implementation-update)）；存取權限實施法案已經延遲（[eudigitalproductpassport.org](https://eudigitalproductpassport.org/updates/battery-passport-access-rights-implementing-act-delay)）；DPP 的「認證與完整性」標準仍是草案（[CDX](https://public.cdxsystem.com/web/cdx/w/eu-digital-product-passport-technical-framework-takes-shape-with-registry-launch)）；OEM 仍靠試算表作業（[Sibros](https://www.sibros.tech/post/navigating-the-eu-battery-passport-what-oems-need-to-know-before-2027)）。台灣電池協會指出，電動自行車與無人機電池模組是台灣在歐洲的重要產品，中小企業需要指引（[Reccessary](https://www.reccessary.com/zh-tw/news/Taiwan-Digital-Product-Passport)）。

**現有解法為何不夠**：Battery Pass 聯盟與 GBA 定義的是「要放哪些內容」（[GBA](https://www.globalbattery.org/2026-battery-passport-pilots/)），沒有處理「電池換手之後，健康度與歷史紀錄如何可信地延續」。二次利用買家拿到的健康度（SoH）數字，通常是賣方自己報的。Circulor 也承認，原物料在加工過程中會轉化，很難可靠地標記（[Trellis](https://trellis.net/article/startup-helping-volvo-trace-ev-battery-materials/)）。

**解法**：BMS 用裝置金鑰簽署充放電與溫度摘要。AI 用可解釋的集成模型估計 SoH 與剩餘壽命，並輸出信心區間。每次估算都把模型版本、輸入雜湊、信心區間錨定上鏈，讓買家能重新驗算。所有權轉移（OEM → 車主 → 二次利用 → 回收）以可驗證憑證記錄。分級存取的設計呼應 prEN 18239 的空白：公眾看得到碳足跡與回收資訊，維修業者看得到拆解資料，競爭者看不到配方。此外利用 GBA 試點發現的「1–2% 質量涵蓋 50–95% 碳足跡」，只對高碳貢獻的材料做深度溯源。

**為何需要區塊鏈**：強度高。一顆電池的生命週期超過 10 年，期間要經過多個互不隸屬的擁有者；原廠可能倒閉，也可能有誘因美化數據；EU 的中央登錄系統只登錄識別碼與詮釋資料（[LexisNexis](https://www.lexisnexis.co.uk/legal/news/commission-launches-digital-product-passport-registry-under-ecodesign-regulation)），不保存每次換手的健康紀錄。這正是「沒有長期可信第三方、多寫入者、需要公開驗證」的情境。

**掛鉤**：EU 電池法規 2023/1542、ESPR、台灣《資源循環推動法》第 22 條、台灣 DPP 試行計畫、COP31 電氣化旗艦主題（電動車與熱泵）。**質疑一**：BMS 資料也能造假。回應：裝置金鑰做硬體簽章，AI 交叉檢查物理一致性（溫度、電壓與容量衰退曲線），並以抽樣實測作為最後防線。**質疑二**：OEM 不想公開。回應：選擇性揭露只對法規要求的欄位公開。**評審契合**：12 題中最高。Oyucu 研究鋰電池 SoC 與容量的可解釋估計，Fidan 經營 DPP 公司，Seyhan 與 Akleylek 研究輕量後量子裝置認證，Iqbal 研究數位孿生威脅模型。

### H. 再生料質量守恆帳本，拒絕「自由分配」（賽道三，零廢棄）

**問題與使用者**：使用者是要證明再生料比例的品牌商、EPR 主管機關、回收商與再生料廠。ProPublica 發現，以 mass balance 標示 20–30% 再生料的產品，實際含量不到 1%（[ProPublica](https://www.propublica.org/article/epa-rejects-mass-balance-plastics-recycling-safer-choice)）；「自由分配」讓企業可以把再生料額度隨意配給任一產品，美國化學理事會甚至為此起訴科羅拉多州（[Packaging Dive](https://www.packagingdive.com/news/colorado-mass-balance-lawsuit-epr-plans/817477/)）；歐洲調查報導點名了標示「最高 100% 再生」的食品包裝（[Food Packaging Forum](https://foodpackagingforum.org/news/investigation-criticizes-consumer-and-retail-brands-marketing-fossil-plastics-as-green-plastics)）。電子廢棄物只有 22.3% 有正式回收紀錄（[UNITAR](https://unitar.org/index.php/about/news-stories/press/global-e-waste-monitor-2024-electronic-waste-rising-five-times-faster-documented-e-waste-recycling)），紡織品 EPR 也即將上路（[Beveridge & Diamond](https://www.bdlaw.com/publications/eu-targets-textile-waste-with-waste-framework-directive-amendments/)）。

**現有解法為何不夠**：認證機構的 mass balance 規則本身就允許自由分配。化學回收的再生分子與原生分子在物理上無法區分（[ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0921344925003040)），單靠帳本無法驗證再生料是否真的進了某個產品。

**解法**：回收商出貨、再生料廠投料與產出、品牌商使用，每一段都是一筆鏈上帳目。智慧合約強制**投入≥產出×再生比例**，並禁止跨產品線的自由分配。AI 比對地磅、發票、出貨影像與產能，找出異常的質量流。宣稱再連結到 DNA 標記或同位素抽測結果，例如 Haelixa 已用於再生棉的驗證（[Haelixa](https://haelixa.com/news/recycled-cotton-verification-with-dna-technology/)），讓抽測不合格的批次可以追溯到簽署者。

**為何需要區塊鏈**：強度高。回收商、再生料廠、品牌商分屬不同公司，彼此有利益衝突；守恆約束需要一份共享狀態，才能防止同一噸再生料被多個品牌重複宣稱。**掛鉤**：COP31 零廢棄旗艦（土耳其主席國的招牌倡議）、EU 2024/825、ESPR 再生料揭露、台灣《資源循環推動法》第 22 條。**質疑**：認證機構已經做過稽核。回應：稽核是一年一次的抽查，帳本是連續的守恆檢查，兩者互補。**評審契合**：Fidan（循環經濟育成）、Duman（IoT 溯源）、Iqbal，同時呼應主辦國的招牌議題。

### I. EUDR 合作社層級的地塊護照，結合選擇性揭露（賽道三＋四）

**問題與使用者**：使用者是咖啡、可可、棕櫚油產區的小農合作社，以及歐盟進口商。光是收集地理座標，一個生產者組織就要花 5,000 到 15,000 歐元（[eProd](https://www.eprod-solutions.com/articles/is-eudr-cocoa-compliance-priced-for-the-african-market)）；遵循成本主要落在小農身上，而且小農看不到溢價（[Wiley](https://onlinelibrary.wiley.com/doi/full/10.1002/eet.70150)）。哥倫比亞咖啡生產者聯合會掌握約 180 萬筆地塊的地理參照資料，因此在 EUDR 上領先（[Mongabay](https://news.mongabay.com/2026/03/colombias-coffee-industry-well-placed-but-wary-as-eu-deforestation-rule-looms/)）。

**解法**：農民用手機記錄地塊座標，4 公頃以下只需單點。AI 自動比對 2020-12-31 基準日之後的衛星毀林圖層，並檢查產量是否合理，例如交貨量超過地塊最大可能產量時發出警示，以防止從未合規地塊「洗豆」。地塊憑證由合作社簽發，買家只看得到「合規」，看不到農民個資。

**為何需要區塊鏈**：強度中等。核心價值是「地塊產量守恆」，防止同一塊地被用來掩護超過它產能的貨量，但這件事一個由合作社聯盟維護的資料庫也做得到。只有在多個出口商、合作社、買家互不信任時，鏈才有必要。**掛鉤**：EUDR（2026-12-30）、COP31 糧食安全主軸。**質疑**：衛星誤報怎麼處理？回應：設計申訴流程，並由人工複核。**評審契合**：中等，Iqbal 研究農食供應鏈威脅建模。

### J. 甲烷警報問責帳本：警報→回應→修復→衛星複查（賽道四＋一）

**問題與使用者**：使用者是主管機關、投資人、公民團體，以及有意證明自己已修復洩漏的業者。MARS 的警報近九成沒有回應（[IISD](https://sdg.iisd.org/news/un-report-calls-for-scaling-action-on-methane-through-data-driven-solutions/)）；美國 138 則警報零回應（[Irish Examiner](https://www.irishexaminer.com/world/arid-41904757.html)）；孟買掩埋場將近一年後仍在排放（[Carbon Mapper](https://carbonmapper.org/articles/mumbai-waste-sites)）。

**現有解法為何不夠**：UNEP IMEO 已經公布各國的回應率（[UNEP](https://methanedata.unep.org/story-MARS-snapshot)），但沒有公開「每一則警報的處理軌跡」，也沒有整合 Carbon Mapper、Climate TRACE 等多個來源的複查結果。

**解法**：系統擷取公開的偵測資料並打上時間戳；業者提交修復證據，例如工單與照片；AI 在後續的衛星影像中自動複查煙流是否持續，計算「宣稱已修復但仍在排放」的比例。

**為何需要區塊鏈**：坦白說中等偏弱。UNEP 自己就能經營這套資料庫。鏈的價值在於**來源多元、而且不能被任何一方（包括政治壓力下的政府）靜默改寫**；2025 年美國資料下架事件說明這種風險確實存在。**掛鉤**：COP31 甲烷與零廢棄主軸（廢棄物甲烷）、Global Methane Pledge。**質疑**：業者不會配合。回應：衛星複查不需要業者配合，「不回應」本身就是會被公開記錄的資料。**評審契合**：高，AI 加衛星加完整性，正好是 Sağıroğlu 的「AI＋資安＋氣候韌性」主題。

### K. 氣候資料公證與多保管人鏡像（賽道四）

**問題與使用者**：使用者是研究者、保險業、美國各州政府與法院。2025 年美國下架或降級多項氣候資料（[Eos](https://eos.org/research-and-developments/noaa-datasets-will-soon-disappear)），使用者需要證明自己手上的副本和原始資料完全相同。

**現有解法為何不夠**：Harvard LIL 已經用數位簽章保存了 31.1 萬個資料集（[Harvard LIL](https://lil.law.harvard.edu/blog/2025/02/06/announcing-data-gov-archive)），但多保管人之間的交叉公證、以及「靜默修改」的偵測仍然缺乏。

**解法**：多個保管機構對同一資料集定期計算雜湊並簽章，錨定到公鏈上取得時間戳。AI 偵測版本之間的語意差異，例如某個欄位被悄悄移除，或某段時間的數值被修正。

**為何需要區塊鏈**：誠實說不是必要的。Certificate Transparency 那種透明日誌加上多方簽章，就能達到九成效果。區塊鏈只是提供「去中心化時間戳」的一種實作。另外 AI 的角色偏輔助。**評審契合**：資安群會欣賞完整性設計，但差異化有限。

### L. 校正溯源的社區感測網，搭配參數型保險與預警觸發（賽道四）

**問題與使用者**：使用者是缺乏監測的國家（全球 36% 的國家、近 10 億人沒有政府空品監測（[OpenAQ](https://www.ccacoalition.org/resources/open-air-quality-data-global-landscape)））、面臨基差風險的小農（[Columbia SIPA](https://www.sipa.columbia.edu/sipa-education/capstone-workshops/when-does-index-insurance-provide-good-coverage)），以及複合型災害下游的居民（馬太鞍溪的案例）。決策者不採用 IoT 資料，原因是「缺乏足夠的可信度保證」（[UPC LoRaTRUST](https://dsg.ac.upc.edu/bibcite/reference/648)）。

**解法**：感測器以裝置簽章輸出讀數。每台感測器與哪一個參考站共址校正、用了哪個濕度修正模型與版本，都錨定上鏈。AI 為每台感測器產生品質分數，並結合衛星資料做降尺度。參數型保險或預警的觸發計算全部公開，並設置互補風險池來處理「農民損失慘重卻拿不到賠付」的下方基差風險。

**為何需要區塊鏈**：強度中等。單一政府網路（例如台灣民生公共物聯網）用資料庫就夠了；只有在跨國、跨機構，以及保險觸發涉及賠付爭議時，鏈的中立性才有價值。**掛鉤**：COP30 通過的 59 項調適指標（[ANBA](https://anba.com.br/en/cop30-key-outcomes-of-the-summit/)）、SIDS 早期預警、損失與損害基金。**評審契合**：Seyhan 與 Akleylek 的輕量裝置認證、Duman 的 IoT 背景。台灣的 LASS 與民生公共物聯網可以作為現成的驗證場域。

## 五、評分比較：電池護照、CBAM 傳遞鏈、再生料守恆三題最站得住

下表是〔推論〕性質的評分，1 到 5 分，不計時間與技術難度。「區塊鏈必要性」以 Wüst–Gervais 測試，以及是否存在守恆約束為準。「差異化」同時考慮既有方案的覆蓋程度，以及 804 人中撞題的可能性。

| 題目 | 需求真實度 | 區塊鏈必要性 | AI 價值 | 評審／COP31 契合 | 差異化 | 總分 |
|---|---|---|---|---|---|---|
| **G 電池護照信任層＋AI SoH** | 5 | 5 | 5 | 5 | 4 | **24** |
| **A CBAM 嵌入排放傳遞鏈** | 5 | 4 | 4 | 5 | 4 | **22** |
| **H 再生料質量守恆帳本** | 4 | 5 | 3 | 5 | 4 | **21** |
| J 甲烷警報問責帳本 | 4 | 3 | 5 | 5 | 3 | 20 |
| F 分散式太陽能三重申報防重 | 4 | 4 | 4 | 3 | 4 | 19 |
| B 宣稱—註銷綁定與召回 | 4 | 4 | 3 | 3 | 4 | 18 |
| C Article 6 追蹤帳本 | 4 | 5 | 3 | 4 | 2 | 18 |
| L 校正溯源感測網＋參數觸發 | 4 | 3 | 4 | 4 | 3 | 18 |
| D 逐時綠電與跨憑證防重 | 4 | 3 | 4 | 3 | 3 | 17 |
| I EUDR 地塊護照 | 4 | 3 | 4 | 3 | 3 | 17 |
| E 棄電吸收證明 | 3 | 2 | 4 | 3 | 4 | 16 |
| K 氣候資料公證 | 3 | 2 | 2 | 3 | 3 | 13 |

**第一推薦：G 電池護照生命週期信任層搭配 AI 健康度預言機。** 它是唯一同時拿到四個 5 分的題目，理由有四點。第一，有不延期的硬日期，2027-02-18 起強制，標準與實施法案卻還有空白（prEN 18246、77(9)），所以付費方存在，技術缺口也被官方明確標出。第二，十年以上、跨多個擁有者的生命週期，是區塊鏈必要性最乾淨的例子：沒有任何一方能當長期可信第三方。第三，AI 的角色具體而且可以驗證：用可解釋模型估計 SoH，模型的來源資訊上鏈，買家能重新驗算。這不是把 AI 硬塞進來。第四，評審契合度最高，Oyucu、Fidan、Seyhan、Akleylek、Iqbal 的研究或業務都直接相關，也對上 COP31 的電氣化旗艦。台灣的電動自行車與無人機電池模組廠就是現成的使用者。

**第二推薦：A CBAM／產品嵌入排放多方傳遞鏈。** 它的需求證據最有「金錢感」：預設值加成 10%→30%，等於直接替經查證的實際數據標上價格。台灣有 2,600 家受影響業者，土耳其 TR-ETS 試行期就涵蓋 CBAM 產業，伊斯坦堡商會的會員正是受害者。區塊鏈的必要性來自「上游排放屬性的分配守恆」，這是 PACT 規格沒有解決的空白。要誠實面對的弱點是：如果供應鏈只有兩層，簽章 VC 可能就夠了，所以展示時應該做三層以上的分配情境（鋼廠→線材廠→扣件廠→歐盟進口商）。

**第三推薦：H 再生料質量守恆帳本。** 它直接回應 COP31 主席國的招牌議題「零廢棄」，而且漂綠的證據（再生料實際含量不到 1%、自由分配爭議）是方法論漏洞，正好是智慧合約可以用規則封住的地方。區塊鏈必要性很高。AI 的價值相對較弱，所以必須把「質量流異常偵測」和「鑑識抽測結果的連結」做紮實，否則會被質疑 AI 只是點綴。

**替代方案**：如果團隊一定要做賽道四，**J 甲烷警報問責帳本**是首選。它的 AI 價值最高，COP31 契合度也高，但必須誠實說明「UNEP 自己也能做」，並把論點放在多來源與防政治性改寫上。

三個推薦題目有共同的弱點，也有共同的補強方式。〔推論〕三題都屬於「產品層級的可驗證資料」，都依賴同一套工程模式：裝置或文件端的簽章、AI 預言機、守恆約束智慧合約、選擇性揭露，以及 PACT／EN 18216 相容輸出。交件時應附上四份文件，補齊 IEEE 頁面隱性要求、Devpost 沒列的部分：一頁威脅模型（感測器偽造、預言機操縱、Sybil、重複分配、金鑰外洩，以及後量子遷移路徑）；減碳推估，例如「每 1,000 噸扣件改用實際值所避免的預設值成本與對應排放」，或「延長 1 MWh 電池二次壽命所避免的新電池製造排放」，並寫明假設；標準對齊表（IEEE 3218、EN 18216 系列、PACT v3）；以及 AI 能耗說明。

## 結論

這次研究最重要的轉變是篩選邏輯：從「哪裡有氣候問題」改成「哪裡有一個守恆量被多方爭奪，而且法規讓說謊有代價」。四個賽道表面上各自不同，但值得做的缺口都長得一樣：同一噸碳權被註銷後仍然有效、同一度綠電被多個系統宣稱、同一批低碳鋼可能被多個客戶分走、同一公斤再生料被自由分配給任一產品、同一則甲烷警報被靜默忽略。區塊鏈在氣候領域的歷史失敗，幾乎都是因為它被拿來創造流動性或代幣價值；它的價值其實是守住這些守恆約束。2026 年和 2018 年那波熱潮的差別，在於 CBAM、電池護照、EUDR、EU 2024/825 讓「付費方」第一次以法律義務的形式出現。

對這場比賽來說，還有一個少被注意的優勢：評審名單中資安與密碼學學者佔了三分之一。多數參賽者會把力氣花在儀表板和代幣設計上，認真寫威脅模型、做裝置簽章、把 AI 模型來源資訊上鏈的團隊會很少。這份差距不需要更多技術難度，只需要把「為什麼資料可信」這件事講清楚，而這正是評審最在意、也是整個氣候科技產業至今最缺的東西。
