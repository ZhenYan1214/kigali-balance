# Demo video script (3:00)

**What the video has to do:** make a busy judge believe one cause-and-effect story in three minutes.
- Kilograms slip through the seams between systems.
- One shared rule closes the seam.
- Here is the evidence that it works.
- Here is what it cannot do.

**Method:**
- A journalist's structure: open on one concrete case, lot 42, then widen to the problem, the mechanism and the evidence, and return to the case.
- Every number on screen has a source in the repository.
- Narration is about 430 words, roughly 145 words a minute.

**Every claim is checked against:**
- `web/data/sim.json` (lot 42)
- `README.md`
- `docs/proposal/technical_annex.html`
- `ai/reports/`
- `analysis/impact/results.json`

**If the simulator is re-run and lot 42 changes,** take the new story lot from the first passport example labelled "Credited once, yet recovered by a flagged company". Then update this script.

---

## Script

| Time | Narration | On screen |
|---|---|---|
| 0:00–0:20 | One kilogram of R-404A warms the planet like 3.9 tonnes of CO₂, and when it is destroyed, someone is paid in carbon credits. This is lot 42: recovered from a small air conditioner, destroyed, and credited once. Every rule in our ledger accepted it. And the air conditioner never existed. This market is simulated; the gap is real. | Passport `passport.html?lot=42`. Zoom on "Destroyed in event #2, claimed once by registry-tw", then on the green check "Traces to 1 registered unit(s)". |
| 0:20–0:55 | Their kilograms are recorded in separate systems: customs quotas, technician logs, reclaimer reports and carbon registries. Each checks its own books. Nobody checks the same kilogram between them, and that seam pays. In the EU, reclaimed R-404A sold at 140% of the virgin price in early 2025, and virgin gas has been sold as reclaimed. We audited 436 destruction and reclamation projects at three carbon registries. Not one publishes which container, and how many kilograms, a credit draws on. | README "The problem" table. Then `docs/research/03-registry-audit.md`, section 1. |
| 0:55–1:35 | Kigali Balance enforces one rule. Every kilogram claimed as reclaimed or destroyed must trace back to a kilogram recovered from a real, registered unit. Each lot carries a provenance class that can never be swapped. A recovery needs two signatures: the technician's scale and the unit's owner. It can never exceed what is booked inside the unit. A destruction needs an independent verifier. And each destruction event can be claimed by one registry, once. | Kilogram-flow diagram (`docs/assets/kilogram-flow-light.svg`). Then the dashboard's "Rejected on chain" card and its breakdown by rule. |
| 1:35–2:05 | Does it hold? We replayed a three-year simulated market, 7,359 events with twelve kinds of injected fraud, against the real contracts. Every decision matched a separately written rule mirror. Fuzzing throws thousands of forged recoveries at it, and none gets through. Then we set AI red-team agents loose on it. The first found a real hole: undocumented gas could be laundered into credits. A second, given only the fixed code, found a way around our fix. Both are fixed and are now tests that run on every push. A human audit is still to come. | Terminal: `python scripts/rebuild.py --full` (speed up 8×), ending on "all steps passed". Then `test/RedTeam.t.sol` scrolling past, and the GitHub Actions page with the green "verify" run. |
| 2:05–2:35 | So how was lot 42 caught? Not by the rules, but by the trail they force. Faking a recovery needs a second signer, and co-signatures leave a pattern. Our AI flagged both the company that recovered lot 42 and the take-back point that co-signed for it. Over three simulated years, it caught every naive fraudster and flagged under one percent of honest companies. Fraudsters who adapt mostly slip through, but only by staying tiny: 4 kilograms in three years instead of 136. | Back to passport lot 42, scroll to "AI notes": the two "Flagged for review" cards. Then the AI results table from the README. |
| 2:35–3:00 | Kigali Balance claims no credits; it is an enabler. We don't claim a big number. Counting only destroyed gas, our model puts the effect in a Japan-sized market at about 0.06 million tonnes of CO₂e a year, and says how a pilot would measure it. We would start where trust between systems matters most: Türkiye's compliant reclaimers, as COP31 comes to Antalya. Every kilogram has to add up. | Tornado chart (`analysis/impact/chart-light.svg`). End card: logo, "Every kilogram has to add up.", repository URL. |

---

## Source for each claim

| Claim | Source |
|---|---|
| Lot 42: 0.48 kg R-410A, Tier B, destroyed in event #2, claimed once by registry-tw | `web/data/sim.json`; passport page |
| The unit never existed | The simulator's ground truth lists eq-9cbd64d3 as a phantom unit of service-04. Ground truth is never shown to the AI or the pages; we use it only to say so here. |
| 1 kg R-404A ≈ 3.9 t CO₂ | GWP 3,922 (AR4, as used by EU 2024/573) |
| Reclaimed R-404A at 140% of virgin, Q1 2025 | EU price monitoring; Cooling Post, April 2025 |
| 436 projects; no registry publishes container and kilograms per credit | `docs/research/03-registry-audit.md` §1 (corrected 2026-10-17: the earlier "68.6% publish no identifier" counted unassessed credits) |
| 7,359 events, twelve fraud types, all decisions match | `reports/rebuild-latest.json`; README "Results" |
| Thousands of forged recoveries per campaign, none succeeded | README: about 2,160 unconsented recoveries per deep campaign |
| Clean machine on every push; static analyser on every commit | `.github/workflows/verify.yml` |
| AI flagged service-04 and takeback-03 | Passport lot 42, "AI notes" |
| Every naive fraudster caught, under 1% of honest companies flagged | `ai/reports/module_{a,b,c}_evaluation.md` at 36 months: 0.5%, 0%, 0.1%. At 12 months module A catches 92% of naive fraudsters, which is why the narration says "over three years". |
| 4 kg vs 136 kg | `ai/reports/module_c_evaluation.md` |
| Around 0.06 Mt CO₂e a year in a market the size of Japan's, destroyed share only | `analysis/impact/results.json`, headline median 0.057 |
| An AI red-team pass found a way to launder undocumented gas into credits; a second found a way around the fix; both fixed; now tests (AI agents, not human auditors) | Annex B.3; `test/RedTeam.t.sol` (`test_F1_*`) |

## Automated build (2026-10-22)

The video is built automatically by `video/make_video.py`. It uses screenshots of the public site and the slides in `video/slides.html` (captured by `video/capture.py`), a neural voice and burned-in subtitles, and writes `video/build/kigali_balance_demo.mp4` plus an `.srt` caption file. The narration lives in `video/narration.json`, which is the source of truth; this table mirrors it. To use a human voice, put one recording per segment in `video/voice/` (see the README there) and run the script again.

## Recording notes (中文，給錄製的人)

- **錄影工具**：Windows 內建 `Win + Alt + R`（Xbox Game Bar）或 OBS。解析度 1920×1080，瀏覽器縮放 110%。
- **先開本機網站**：`python -m http.server 8000 --directory web`，再打開 `http://localhost:8000/passport.html?lot=42`。GitHub Pages 開好之後，改用公開網址錄影，評審就能自己點同一個網址。
- **旁白**：用自己的聲音、照稿念，語速放慢；英文不必完美，清楚最重要。每一段分開錄，最後再接起來。
- **字幕**：上傳 YouTube 後開自動字幕，再手動修正數字與專有名詞（R-410A、Kigali、take-back point）。
- **長度**：IEEE 頁寫 3 分鐘，Devpost 寫 3–5 分鐘。控制在 3:00–3:15，兩邊都符合。
- **終端機畫面**：`rebuild.py --full` 要跑 1–2 分鐘，影片中加速到大約 8 秒。
