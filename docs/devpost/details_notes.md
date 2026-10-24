# Details 初稿的對照與檢查（只給自己看，不貼進 Devpost）

依 `C:\Users\User\Desktop\Circle_arc\_private\docs\DETAILS_GUIDE.md` 製作，2026-10-24。要貼的文字在 [`details_draft.md`](details_draft.md)。

## 1. 素材清單（每項都有出處）

| 素材 | 內容 | 出處 |
|---|---|---|
| 問題證據 | 1 kg R-404A ≈ 3.9 t CO₂（GWP 3,922，AR4，歐盟 2024/573 採用） | `docs/video/video_script.md` 數字表；`02_計畫書.md` |
| 問題證據 | 2025 Q1 再生 R-404A 是原生價 140% | Öko-Recherche／CITEPA 歐盟價格監測 Q4/2025；Cooling Post 2025-04-04（technical annex 參考文獻） |
| 問題證據 | 再生業者公開警告原生冒充再生 | 問題陳述 [7] |
| 問題證據 | 歐盟查獲非法 HFC：2023 約 250 t → 2024 約 670 t | EIA《Fakes, Fraud and F-Gases》2026-04 |
| 問題證據 | 稽核 436 個專案、4,240 萬銷毀碳權、CoD 編號只公開 31%、沒找到重複計算 | `docs/research/03-registry-audit.md`（可用 `build_summary.py` 重算） |
| 評分標準原文 | 見第 2 節 | Devpost 首頁（2026-10-24 用瀏覽器讀） |
| 可點的證據 | Dashboard、lot 42 passport、合約頁、claim tx 0x1fffa787…（已用 `cast` 確認是 `claim(uint256,bytes32)`、status 成功） | 均實際查過 |
| 可點的證據 | 被拒絕的第二次認領 tx | **還沒送**（見第 4 節） |
| 可點的證據 | 162 個單元測試、10 條不變量 | 數過 `test/` 裡的函式 |
| 真的壞掉、真的修好 | 拆單繞過單次上限（88%）、AI 紅隊 High 漏洞與繞過修正、鑑識把氣候推估砍到約四分之一、稽核 68.6% 標題錯誤 | HANDOFF 第十二～十六輪；`03-registry-audit.md` 更正段 |
| 限制 | 資料全模擬；測試網所有金鑰都由部署金鑰衍生（4 個治理席位都在你手上）；沒有真人稽核、沒有使用者測試；AI 旗標只在本機鏈上寫入 | `deployments/11155420.json` 的 note；HANDOFF 8.6 |
| 系統保證 | 沒有任何函式（含治理）能改或刪批次；合約不可升級；治理只能授權角色、綁秤、在下限內調參數 | 讀過 `src/KigaliLedger.sol`、grep 過 upgrade／delegatecall |
| 為什麼用區塊鏈 | 沒有單一營運者橫跨各註冊處；境內用主管機關資料庫就夠（README 有寫）；每個鋼瓶全程 < 1 美分 | README；technical annex A.8 |
| **動機** | **需要你本人提供** | — |
| **關於我** | **需要你本人提供** | — |
| 下一步的時程、獎金用途 | **需要你決定** | 現有的下一步沒有週數 |

## 2. 評分對照

Devpost 的五項（原文，不分權重）：

| 評分項（原文） | 回答的段落 | 可點的證據 |
|---|---|---|
| Climate Impact: "How effectively the solution addresses a real climate or environmental challenge…" | Inspiration、Results 的氣候推估 | 問題陳述 PDF、registry audit |
| Innovation & Creativity: "Is the idea fresh, innovative, and exciting?…" | What it does（一條規則＋認領鎖）、Why a blockchain | 合約、lot 42 passport |
| Technical Execution: "Does the project function as intend?…" | How I built it、Try it 的兩筆交易 | 驗證過的合約、claim tx、被拒絕的 tx、CI |
| Practical Usefulness: "How practical and scalable is the solution?…" | Users、Why OP（成本）、What's next | Dashboard、EPCIS 匯出 |
| Presentation & Communication: "Is the demo clear… 1) the climate problem 2) how the solution works 3) the potential real-world environmental impact" | 開頭一句、Try it、影片 | 影片 3:14 |

Devpost 對描述的要求原文："Explain the problem, your solution, **target users, how it can scale and how easily it can be adopted**." 舊版沒有寫使用者、擴展、採用，新版放在 Users、Why OP、EPCIS。

IEEE 頁面的權重（氣候影響 30%、技術創新 30%、可行性、資料安全、使用者體驗、擴展性各 10%）：**資料安全**由 Guarantees、紅隊段落和 Limits 回答；**使用者體驗**只有「沒有使用者測試」的誠實說明，這是已知的弱項。

## 3. 第 8 節檢查結果

- 內容：一句話講得出誰、什麼問題、怎麼解決 ✅；問題段有數字和來源，沒有「想像一個」 ✅；解法有一條規則、6 個步驟、對應痛點 ✅；區塊鏈理由是文字 ✅；成功和失敗路徑都有鏈上證據 ⏳（要先送被拒絕的 tx）；有做錯的事和限制 ✅；**動機、關於我 ⏳ 等你**；下一步的週數 ⏳
- 誠實：AI 紅隊寫明是 AI ✅；模擬和推估的前提寫在同一句 ✅；數字和影片、README、PDF 一致 ✅；沒有把沒做完的寫成做完 ✅（AI 旗標上鏈、資料匯入都寫為未完成）
- 格式：圖片 0 張 ✅；目前 1,142 字，加上你的兩段約 1,200 ✅；全文用 I ✅；AI 感的詞掃過 ✅
- 交件時：貼上後用無痕視窗開公開頁面，點每個連結

## 4. 狀態（2026-10-24）

1. ✅ 被拒絕的第二次認領已送出：tx 0x3ba6bc74…，Etherscan 顯示「Fail with 'AlreadyClaimed (by=0x3498…7FAd)'」。
2. ⏳ YouTube 連結填進 `[VIDEO LINK]`（`submission.md` 有兩處）。
3. ✅ 動機依 HANDOFF 第 3 節的實際選題過程撰寫（三條件測試、撤回三個題目、撞題搜尋）；關於我只寫查得到的事（碩一、一個人做、registry audit）。使用者決定：不寫週數、不寫獎金用途。
4. ✅ 已取代 `submission.md` 的 About the project。舊版的兩個問題（沒揭露四席同一人、把本機驗證的拒絕放在鏈上連結旁）已改正；附件 PDF 也補上揭露。
5. 字數 1,227，比上限多 2%，剩下的都是數字或揭露，不再刪。
