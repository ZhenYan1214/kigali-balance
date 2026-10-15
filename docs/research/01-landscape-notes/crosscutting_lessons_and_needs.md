# Cross-cutting lessons: when blockchain (and AI) add value for climate action vs. hype, plus unmet needs

(Research date: 2026-10-14. Notes in English. About 16 search calls. Snippet-level evidence is marked; older (pre-2023) facts are flagged [OLDER].)

## 1. Systematic reviews and critiques: is blockchain the right tool? (frameworks, the oracle problem, energy use)

### Takeaway
Across peer-reviewed reviews, institutional reports and NGO critiques the consensus is the same. Blockchain can make records tamper-evident, help stop double counting and keep a shared audit trail among parties who don't trust each other. It cannot make real-world data true; this is the "oracle problem", or garbage in, garbage out. The academic literature still describes blockchain in carbon markets as "immature" or "in its infancy". The energy objection mostly no longer applies to proof-of-stake chains, but it does still apply to Bitcoin-style proof-of-work.

### Cited Findings
- **"Do you need a blockchain?" framework**: Wüst & Gervais, CVCBT 2018 (IEEE, pp. 45–54, doi:10.1109/CVCBT.2018.00011) [OLDER, but still the standard reference]. Its decision logic (from my own knowledge of the paper, not re-verified this session): you need state storage, multiple writers, writers who don't trust each other, no always-online trusted third party, and either public or private verifiability. If a trusted third party exists, use a database. — [Wüst & Gervais bib record](https://puma.ub.uni-stuttgart.de/bibtex/1d8fa99c6df50e1e371d7c2bc493945c7); critic David Gerard called it "pretty good" but said it "goes a bit far in claiming use cases" — [davidgerard.co.uk](https://davidgerard.co.uk/blockchain/2018/page/16)
- xkcd #2267 is a satirical "does my project need a blockchain" flowchart that answers no on every branch. Its point is that almost no practical project needs to give everyone in the world write access to a database. It's useful as a pitch-deck foil. — [explainxkcd 2267](https://explainxkcd.com/2267)
- **Oracle problem**: a recent bibliometric and systematic review in *Humanities & Social Sciences Communications* (Nature portfolio, 2026) on blockchain for ESG and anti-greenwashing calls the "Oracle Problem" the mistaken assumption that blockchain guarantees data truthfulness — [Nature HSSC s41599-026-07473-9](https://www.nature.com/articles/s41599-026-07473-9)
- A 2026 ScienceDirect paper ("From 'Lemon markets' to digital trust…") says a ledger can record what is entered but cannot, on its own, guarantee that the underlying real-world data are accurate — [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1059056026004648)
- Only 15% of 142 journal papers on real-world blockchain applications considered the role of oracles [OLDER, 2020] — [MDPI Information 11/11/509](https://www.mdpi.com/2078-2489/11/11/509)
- A 2023 systematic literature review in MDPI *Sustainability* concludes that blockchain is currently immature in carbon markets because of its own drawbacks and challenges — [MDPI Sustainability 15/11/8495](https://www.mdpi.com/2071-1050/15/11/8495)
- A literature review on blockchain for the carbon market (c. 2025) says adoption "remains in its infancy". It lists unresolved interoperability, scalability and cost-effectiveness questions, notes that a maliciously programmed contract could mint bogus credits or fail to retire them, and flags that data on public chains is visible to anyone (a privacy problem) — [Blockchain for the carbon market: a literature review (d-nb.info)](https://d-nb.info/1372967540/34) / [ResearchGate](https://www.researchgate.net/publication/392351775_Blockchain_for_the_carbon_market_a_literature_review)
- I saw Abiodun, Nwulu & Olukanmi (2024), "Application of blockchain technology in carbon trading market: a systematic review" (*IEEE Access*), only as a citation and did not read it.
- An academic critique argues that blockchain-driven financialisation may worsen the governance of voluntary carbon markets by creating new ways to profit from carbon as an asset — [Blocked chains of governance (ResearchGate)](https://www.researchgate.net/publication/363673427_Blocked_chains_of_governance_Using_blockchain_technology_for_carbon_offset_markets)
- An Edinburgh banking-law professor warns of a "double hazard": linking volatile tokens to volatile carbon certificates can destabilise both markets — [Euronews 2025-02-13](https://www.euronews.com/next/2025/02/13/could-a-carbon-credit-backed-digital-currency-help-us-fight-climate-change)
- **Energy use after the Merge**: the Ethereum Foundation estimated a cut of about 99.95%. A CCRI report commissioned by ConsenSys (not independent) claimed about 99.99%, from roughly 23 million MWh/yr to about 2,600 MWh/yr. Ethereum.org gives a CO2e drop of about 99.992%, from 11,016,000 t to 870 t. — [Decrypt](https://decrypt.co/109848/ethereum-energy-carbon-footprint-down-99-percent-merge); [ethereum.org](https://ethereum.org/en/energy-consumption/)
- **Gold Standard's position (a standard-setter)**: a token should carry the core attributes of a carbon credit, namely real, additional, permanent, robustly quantified, independently verified and uniquely claimed — [Gold Standard](https://goldstandard.org/news/blockchain-for-better-untangling-tokenisation-and-carbon-markets)
- Critics argue that offset verification rests on counterfactual baselines that can't be tested, so no ledger can prove that the alternative scenario would have happened — [Euronews 2025](https://www.euronews.com/next/2025/02/13/could-a-carbon-credit-backed-digital-currency-help-us-fight-climate-change)

### Inferences
- A project is "truly needed" only if it passes the Wüst–Gervais test: several writers who don't trust each other, no acceptable trusted operator, and a need for public auditability. Many climate ideas fail at step one because a registry such as Verra, a TSO or a regulator already acts as the trusted party. In those cases blockchain adds value only if the registry itself wants a shared, interoperable layer, as with CAD Trust.
- For any physical-world claim, the defensible design puts most of the engineering into the oracle and measurement layer: sensors, remote sensing, AI anomaly detection, attested devices and independent verifiers. The chain is a thin, cheap integrity layer on top.
- On proof-of-stake or permissioned ledgers the energy critique is now a weak objection. The stronger objections are governance, data quality and financialisation.

### Gaps
- I couldn't retrieve Carbon Market Watch's own publications on tokenisation; the search returned only third-party summaries.
- I found no Molly White–specific critique in this pass. She runs web3isgoinggreat.com, which logged the Everledger collapse — [W3IGG](https://www.web3isgoinggreat.com/?id=blockchain-based-diamond-tracking-firm-everledger-collapses).
- I didn't retrieve NIST IR 8202 (Blockchain Technology Overview, 2018), which also has a "do you need a blockchain" flowchart. That comes from my own knowledge and was not verified this session.
- I didn't fetch a Nature Climate Change, RSER or JCLP review directly.

## 2. Post-mortems: why TradeLens, Everledger, Nori, Flowcarbon, KlimaDAO/Toucan, Brooklyn Microgrid, Poseidon and others failed or stalled

### Takeaway
Almost none of these failed because the blockchain didn't work technically. They failed because of governance (one competitor running the platform), no network effect or ROI, underlying assets of poor integrity that tokenisation made liquid rather than better, demand collapse in the voluntary carbon market (VCM), regulatory and token-market risk, and "blockchain-washing", where transparency features existed but went unused.

### Cited Findings
- **TradeLens (Maersk + IBM; closure announced Nov 2022, offline Q1 2023)** [OLDER but canonical]: Maersk said the platform was viable but "had not reached the commercial viability necessary". By mid-2019, five of the six largest carriers were on it, covering more than half of global container volume, yet the network effect never reached critical mass. Rivals were deterred because Maersk, a direct competitor, ran it. Critics said data governance was centralised and opaque on private Hyperledger Fabric, and that on thin logistics margins the extra cost and complexity didn't deliver enough return compared with conventional technology. — [PierNext / Port of Barcelona](https://piernext.portdebarcelona.cat/en/technology/the-closure-of-tradelens/); [Seatrade Maritime](https://www.seatrade-maritime.com/maritime-technology/maersk-and-ibm-pull-the-plug-on-tradelens); [ABI Research](https://www.abiresearch.com/market-research/insight/7781608-ibm-and-maersks-tradelens-platform-discont?hsLang=en); [WiseChain substack](https://wisechainconsult.substack.com/p/8-why-did-tradelens-failed-and-and)
- **Everledger (diamond/ESG provenance)**: the second funding tranche failed to arrive in early 2023. Administrators were appointed in April 2023 (Wikipedia says June) and the UK entity went into liquidation. Unsecured creditors were owed about A$19.18M, per Wikipedia. Founder Leanne Kemp later said the company was "100% back in her hands" (JCK). — [Ledger Insights](https://www.ledgerinsights.com/everledger-bankruptcy-esg-blockchain-traceability/); [Startup Daily](https://www.startupdaily.net/topic/business/brisbane-blockchain-provenance-startup-everledger-placed-in-administration-after-funding-evaporates/); [Companies House](https://find-and-update.company-information.service.gov.uk/company/09536102); [JCK](https://www.jckonline.com/editorial-article/everledger-alive-working-signet/)
- **Nori (soil-carbon removal marketplace, blockchain-tracked; shut down Aug/Sep 2024)**: it raised $17.25M. The CEO cited "a stagnant Voluntary Carbon Market (VCM) and tough funding environment". AgTech Navigator blamed uncertainty over how to quantify and credit removals. Before closing it had directed $6.5M to farmers. Carbon Herald called it the second notable 2024 shutdown after Running Tide. — [GeekWire](https://www.geekwire.com/2024/nori-a-seattle-based-carbon-removal-marketplace-that-raised-17m-shuts-down-after-7-years/); [Carbon Herald](https://carbonherald.com/carbon-marketplace-nori-shuts-down/); [AgTech Navigator](https://www.agtechnavigator.com/Article/2024/12/18/what-went-wrong-for-carbon-marketplace-nori); [QCIntel](https://www.qcintel.com/carbon/article/us-cdr-marketplace-halts-operations-on-stagnant-market-28748.html)
- **Flowcarbon (co-founded by Adam Neumann; Goddess Nature Token)**: it raised about $70M, including from a16z, of which at least $38M came from GNT token sales. The token never launched, and the company refunded investors, reported around September 2024 via Forbes. Refunds required buyers to sign confidentiality agreements and waive claims. The company cited market conditions and regulatory challenges. — [Quartz](https://qz.com/adam-neumann-flowcarbon-refunds-carbon-credit-weowork-1851646629); [Cryptonews](https://cryptonews.com/news/adam-neumann-backed-flowcarbons-crypto-token-never-launched-company-repays-investors/)
- **Toucan / KlimaDAO (2021–22)** [OLDER, foundational]: CarbonPlan found 99.9% of tokenised BCT credits came from projects too old for CORSIA and about 85% would be ineligible under Article 6. About 28% (around 6M tonnes) came from "zombie" projects that sold few or no credits until Toucan bought them, such as a 2006 Chinese hydro project. Toucan blacklisted HFC-23 credits two days after tokenising them (Dec 2021). In May 2022 Verra banned tokenisation of retired credits and opened a consultation on "immobilisation". KlimaDAO commissioned an AlliedOffsets report but didn't publish it, then spent over $1M of treasury retiring its lowest-quality credits. — [CarbonPlan](https://carbonplan.org/research/toucan-crypto-offsets); [CarbonPlan reply to KlimaDAO](https://carbonplan.org/blog/klimadao-bct-response); [QCIntel](https://www.qcintel.com/carbon/article/zombie-carbon-projects-make-up-28-of-toucan-supply-analysis-5285.html); [TIME](https://time.com/6181907/crypto-carbon-credits/)
- Summary line from critics: tokenising a zombie credit improves its liquidity, not its quality — [Euronews 2025](https://www.euronews.com/next/2025/02/13/could-a-carbon-credit-backed-digital-currency-help-us-fight-climate-change)
- A 2024 Frontiers in Blockchain case study found KlimaDAO had strong early engagement, then struggled with market maturity and keeping participants — [Frontiers 2024](https://www.frontiersin.org/journals/blockchain/articles/10.3389/fbloc.2024.1474540/full)
- **Poseidon / Liverpool "carbon positive city"**: an investigation found no evidence that the blockchain deployed by Liverpool City Council used its transparency features. Poseidon later rebranded as Poseidon Impact. — [Liverpool Post](https://www.livpost.co.uk/liverpool-was-going-to-become-the/)
- **Veridium (IBM Blockchain, Indonesia forest carbon, 2018)** [OLDER]: a peer-reviewed case study looks at how blockchain shifted power dynamics among stakeholders, not commercial results — [Enterprise Times 2018](https://www.enterprisetimes.co.uk/2018/05/16/veridium-collaborates-with-ibm-blockchain-platform-on-carbon-credits/); [Frontiers 2022](https://www.frontiersin.org/journals/blockchain/articles/10.3389/fbloc.2022.957316/full)
- **Brooklyn Microgrid / LO3 Energy** [OLDER]: the pilot had fewer than 60 prosumers. It moved from Ethereum, where verification took 13–30 seconds, to a private chain called "Exergy". A low-quality aggregator says Shell acquired LO3 in 2021, while other profiles list it as active, so its status conflicts. — [arXiv 2106.05395](https://arxiv.org/pdf/2106.05395); [Power Technology](https://www.power-technology.com/features/featurethe-brooklyn-microgrid-blockchain-enabled-community-power-5783564/)
- **Fragmentation**: an industry figure observed that many carbon projects run their own incompatible tokens — [Euronews 2025](https://www.euronews.com/next/2025/02/13/could-a-carbon-credit-backed-digital-currency-help-us-fight-climate-change)

### Inferences
Common failure patterns, usable as a red-flag checklist:
1. **Governance captured by an incumbent** (TradeLens): competitors won't share data on a rival's platform. Neutral governance (foundation, consortium or public body) is a precondition.
2. **No network effect or ROI** (TradeLens, Brooklyn Microgrid): a pilot never reached a real user base, and a database would have been cheaper.
3. **Tokenising bad assets** (Toucan/KlimaDAO): liquidity amplified low integrity, and standard-setters such as Verra then shut the door.
4. **Dependence on VCM demand or crypto funding cycles** (Nori, Flowcarbon, Everledger): revenue was tied to a speculative or stagnant market.
5. **Regulatory and token-securities risk** (Flowcarbon).
6. **Blockchain-washing** (Poseidon): the transparency claim wasn't actually exercised.
7. **Unresolved measurement science** (Nori soil carbon): no ledger can fix uncertain quantification.

### Gaps
- I couldn't confirm the status of WePower; the search found no evidence of failure.
- IBM Food Trust: I found no sunset announcement. Third-party 2026 listings still show pricing from $2,000/month, so status is unclear rather than "failed".
- I didn't verify recent claims that KlimaDAO is moving to CCP-only credits or that Toucan v3 filters for CCP-labelled credits; they come from low-quality sources only.

## 3. Durable deployments and success cases: what made them work?

### Takeaway
Durable deployments share four traits. They are run by or with an incumbent standard-setter, registry, TSO or multilateral body rather than against it. They usually use permissioned or low-energy ledgers. They focus on integrity metadata, certificate tracking or book-and-claim rather than speculative tokens. And they solve a real coordination problem among many parties, such as double counting across registries or certificate chain-of-custody.

### Cited Findings
- **CAD Trust (Climate Action Data Trust)**: it grew out of the World Bank's Climate Warehouse and was launched in Dec 2022 by IETA, the World Bank and the Singapore Government. It is now an independent Singapore entity with a Council and Board. It is a decentralised metadata layer that links, aggregates and harmonises major carbon registry data to support Article 6 accounting and flag double-counting risk. Ledger Insights reports it runs on Chia; that is confirmed by Chia, a vendor, but World Bank and IETA pages don't name the chain. — [World Bank PPP](https://ppp.worldbank.org/node/7165); [World Bank blog](https://blogs.worldbank.org/en/climatechange/why-data-infrastructure-key-transparent-carbon-market); [Chia](https://chia.net/climate/); [ESG News](https://esgnews.com/?p=17064)
- **Energy Web SAFc Registry (Green Proofs)**: a non-profit book-and-claim registry for sustainable aviation fuel certificates, launched Q4 2023 with SABA, RMI and EDF. Independent node operators validate each certificate against predefined rules before it can be issued or transferred. The aviation page reports 22,629 t of neat SAF and 110,509 t CO2e abated issued (date unclear). About 50 companies were onboarded in year one, and buyers include Bank of America, BCG, JPMorgan Chase and Meta via SABA. — [Energy Web aviation](https://www.energyweb.org/aviation); [Energy Web one-year retrospective](https://medium.com/energy-web-insights/celebrating-one-year-of-the-safc-registry-a-look-back-and-forward-fd0ae489ecc2); [RMI](https://rmi.org/press-release/rmi-partners-with-energy-web-foundation-to-build-sustainable-aviation-fuel-certificate-registry/)
- **Hedera Guardian with Verra**: a five-year collaboration integrating open-source Guardian dMRV with Verra's Project Hub, aiming to digitise 20+ methodologies by end-2025. A 2026 Hashgraph post says the ARR methodology was "being finalized… for production use", so I couldn't confirm the 20+ target was met. — [Verra](https://verra.org/verra-and-hedera-to-accelerate-digital-transformation-of-carbon-markets/); [Hashgraph 2026](https://hashgraph.com/blog/hedera-guardian-2026-the-next-chapter/)
- **BIS Project Genesis (with HKMA)**: Genesis 1.0, now concluded, built two prototypes on a public and a permissioned chain with six private parties. They made a retail government green bond more efficient, cheaper and more transparent, and the public-chain version enabled direct issuer–investor settlement. Genesis 2.0 attached "mitigation outcome interests", futures on Paris-compliant credits, to tokenised green bonds. Its stated problem was that investors cannot verify issuers deliver promised green impact, and retail investors lack liquid secondary markets. — [BIS Genesis](https://www.bis.org/about/bisih/topics/green_finance/green_bonds.htm); [BIS Genesis 2.0](https://www.bis.org/publ/othp58.htm)
- **World Bank D-MRV (2022)** [OLDER]: in Chile's waste-to-energy pilot the DLT layer (IOTA) turned out simpler than expected. The report notes the blockchain layer that secures D-MRV data is largely the same whatever the data-collection method, and that the hard part is the enabling environment. — [World Bank D-MRV report](https://documents1.worldbank.org/curated/en/099605006272210909/pdf/IDU0ca02ce8009a2404bb70bb6d0233b54ffad5e.pdf)

### Inferences
- Success pattern: incumbent plus open infrastructure plus narrow integrity function. The winners are verification and registry-interoperability infrastructure, not marketplaces.
- Book-and-claim for hard-to-abate sectors (SAF, green steel, clean shipping fuel, 24/7 granular energy certificates) is a proven, non-speculative niche. It fits blockchain well because many parties need a shared, non-double-claimable certificate trail.

### Gaps
- I didn't research these this pass (other researchers may cover them): Elia/TenneT flex markets, Chainlink parametric insurance (Arbol and others), Singapore Project Guardian / Climate Impact X, Switzerland–Ghana and Japan JCM registries, Gitcoin climate rounds, Regen Ledger, Open Forest Protocol, and Plastic Bank. There are no cited facts on them in these notes.

## 4. AI for climate: credible opportunities vs. limitations (energy footprint, greenwashing, hallucination)

### Takeaway
Credible AI-for-climate work is mostly classic or specialised ML: forecasting, remote sensing, grid optimisation, and NLP classifiers such as ClimateBERT for disclosures. Most corporate claims that "AI will solve climate" lean on that older ML while justifying growth in energy-hungry generative AI. AI's own electricity demand is a real, growing cost (IEA: data centres heading to about 945 TWh by 2030). A climate-AI project therefore has to justify its compute and should be honest about which kind of AI it uses.

### Cited Findings
- Rolnick et al., "Tackling Climate Change with Machine Learning", *ACM Computing Surveys* 55(2), article 42, Feb 2022 [OLDER but foundational]. It maps problems from smart grids to disaster management where ML can fill gaps, for both mitigation and adaptation. — [MIT DSpace](https://dspace.mit.edu/handle/1721.1/146383); [arXiv 1906.05433](https://alphaxiv.org/abs/1906.05433)
- **IEA "Energy and AI" (Apr 2025)**: data centres used about 415 TWh in 2024, roughly 1.5% of global electricity, growing about 12%/yr since 2017. The US accounted for 45%, China 25% and Europe 15%. The IEA projects about 945 TWh by 2030, with AI-optimised data-centre demand more than quadrupling, and about 1,200 TWh by 2035 in its Base Case. In the US, data centres account for nearly half of demand growth to 2030. — [IEA executive summary](https://www.iea.org/reports/energy-and-ai/executive-summary); [IEA news](https://www.iea.org/news/ai-is-set-to-drive-surging-electricity-demand-from-data-centres-while-offering-the-potential-to-transform-how-the-energy-sector-works)
- **Beyond Fossil Fuels / Ketan Joshi report (Feb 2026)**: of 154 big-tech claims that AI helps the climate, most referred to traditional ML rather than generative AI, and only 26% cited published academic papers. The report calls the claims largely greenwashing. — [Euronews 2026-02-17](https://www.euronews.com/green/2026/02/17/ai-greenwashing-most-of-big-techs-ai-climate-promises-fall-flat-study-finds); [E&E News](https://www.eenews.net/articles/tech-companies-overstate-ais-climate-benefits-report-says); [eceee](https://www.eceee.org/all-news/news/claims-that-ai-can-help-fix-climate-dismissed-as-greenwashing/)
- Climate Action Against Disinformation report "Generating A(I) Crisis": Big Tech is breaking climate commitments to chase AI, and AI expansion is "a climate problem being sold as a climate solution" — [CAAD](https://caad.info/analysis/reports/generating-ai-crisis-big-tech-breaking-climate-commitments-to-chase-ai-hype/)
- **NLP for disclosures and greenwashing**:
  - ClimateBERT (2022) and ClimateBERT-NetZero detect net-zero and reduction targets — [arXiv 2310.08096](https://arxiv.org/pdf/2310.08096)
  - Bingler et al. (2023) fine-tuned ClimateBERT to flag climate "cheap talk" in MSCI World disclosures (cited in [arXiv 2510.01222](https://arxiv.org/pdf/2510.01222))
  - A 2023 paper quantifies greenwashing risk with a fine-tuned ClimateBERT — [arXiv 2311.01469](https://arxiv.org/abs/2311.01469)
  - A SwissText 2025 study of 150 DAX ESG reports (2020–23) found that high reporting positivity can coincide with weaker performance on hard-to-verify Scope 3 emissions — [ACL Anthology](https://aclanthology.org/2025.swisstext-1.3.pdf)
  - A 2025 NLP survey on greenwashing detection lists ClimateBERT, ClimateGPT-2, ClimateBUG-LM and EnvironmentalBERT and reviews the datasets — [arXiv 2502.07541](https://arxiv.org/pdf/2502.07541)
  - EmeraldMind (arXiv 2512.11506) uses a knowledge graph to ground LLM greenwashing detection — [arXiv](https://arxiv.org/pdf/2512.11506)
- **BIS Project Symbiosis (HKMA; Part 1 and Part 2 reports Oct 2025, ongoing)**: uses AI and big data to collect, interpret and calculate Scope 3 emissions in supply chains, with a "matching engine" that links suppliers to decarbonisation finance. It notes that over 95% of financial-sector emissions are Scope 3. — [BIS Symbiosis](https://www.bis.org/about/bisih/topics/cbdc/symbiosis.htm); [BIS Part 2 technical report](https://www.bis.org/publ/othp101.htm)

### Inferences
- AI is most defensible as the oracle-side quality layer: anomaly detection on MRV data, satellite or remote-sensing cross-checks, extracting and checking claims in reports, and Scope 3 estimation where data is missing. A ledger then anchors the AI output with provenance, including model version, input hashes and confidence.
- Hallucination risk means an LLM ESG tool should use retrieval with source citations, knowledge graphs or structured extraction, and keep a human in the loop. Putting an unverifiable LLM output on-chain makes garbage in, garbage out permanent.
- Projects should state their compute footprint and prefer small or specialised models.

### Gaps
- I found no study measuring LLM hallucination rates specifically in ESG or greenwashing classification.
- I didn't retrieve the latest Microsoft or Google sustainability report figures (2025–2026 emissions rises), or any IEA update to its 2025 projections in 2026.
- I couldn't fetch the details of the Patterns (Jan 2026) data-centre emissions study.

## 5. What institutions say they still need (UNFCCC/Article 6, World Bank, BIS, COP29–COP31)

### Takeaway
The institutions' stated needs are about plumbing: interoperable registries and Article 6 accounting (especially for LDCs and SIDS without their own registries), standardised digital MRV that redesigns workflows rather than digitising 20-year-old processes, Scope 3 and supply-chain data, adaptation indicators and tracking adaptation finance, forest-payment verification (TFFF), and digital capacity in developing countries. COP30 put "digital" explicitly on the agenda, and COP31 (Antalya, 9–20 Nov 2026) is about to start, focused on implementation, Pacific and SIDS finance, and energy transition.

### Cited Findings
- **Article 6 registries**: COP26 required the UNFCCC to build an international registry for parties without one. COP29 adopted a dual-layer registry system, with optional registry services from the Secretariat for countries lacking infrastructure. Civil society warned that a non-transactional registry would leave such countries dependent on VCM or third-party registries. — [Carbon Market Watch FAQ, Nov 2024](https://carbonmarketwatch.org/2024/11/06/faq-fixing-article-6-carbon-markets-at-cop29/); [Climate & Company COP29 debrief](https://climateandcompany.org/wp-content/uploads/2024/12/COP29-Comprehensive-Article-6-Debrief_ClimateCompany.pdf); [UNFCCC Article 6.2](https://unfccc.int/process-and-meetings/the-paris-agreement/article-6/article-62)
- The June 2026 SBI 64 documents identify emerging capacity gaps in carbon market mechanisms and Article 6 readiness. They also say Parties' capacity-building reports are "fragmented and not systematically organized". — [UNFCCC SBI 2026/5](https://unfccc.int/sites/default/files/resource/sbi2026_5_adv.pdf)
- Columbia CGEP (Sep 2025) proposes annual UNFCCC interoperability checks on registry connectivity and a mandated share of support for LDCs and SIDS, covering dual-layer registry operations — [Columbia CGEP](https://www.energypolicy.columbia.edu/wp-content/uploads/2025/09/Article-6-Commentary_CGEP_090225.pdf)
- **World Bank Carbon Markets Infrastructure Working Group (2024–25)**: five technical guidance notes, including one on standardising dMRV. The barriers it lists are lack of technical expertise, unclear rules on what standards permit, resistance to change and high implementation cost. It says stakeholders must "rethink current standards, roles, and sequences of actions – not simply digitize a system that was designed two decades ago." — [World Bank OKR](https://openknowledge.worldbank.org/entities/publication/397c4e52-445a-4cf4-89df-f2e61373a524); [SustainCERT](https://www.sustain-cert.com/news/driving-scalable-climate-action-sustaincert-helps-shape-the-world-bank-s-guidance-on-digital-mrv)
- **COP30 Belém (10–21 Nov 2025)**: the "Global Mutirão" cover decision and Belém Political Package had no fossil-fuel roadmap language, despite more than 80 countries pushing for one. Parties adopted 59 voluntary Global Goal on Adaptation indicators (water, food, health, ecosystems) and agreed to triple adaptation finance; sources disagree on whether the deadline is 2030 or 2035. The TFFF reportedly mobilised $6.7B with at least 63 endorsing countries (host-reported figures). Digital outcomes: the Green Digital Action Hub (from the COP29 Declaration on Green Digital Action, backed by 82 countries), an AI Climate Institute for developing-country AI skills, Brazil's Climate Digital Public Infrastructure concept (led by ITS Rio), a Technology Implementation Programme funded by GEF and GCF, and a Global Mutirão digital platform. — [ANBA](https://anba.com.br/en/cop30-key-outcomes-of-the-summit/); [HSF Kramer](https://www.hsfkramer.com/notes/latamlaw/2025-posts/cop30-brazil-turning-commitments-into-action-the-latin-american-perspective); [techUK roundup](https://www.techuk.org/resource/techuk-cop30-roundup-tech-and-digital-come-to-the-forefront-of-the-climate-agenda.html); [DPL News](https://dplnews.com/?p=296778); [IESE](https://blog.iese.edu/finance-and-nature/?p=232)
- **COP31**: Antalya, Türkiye, reported for 9–20 Nov 2026. Türkiye (president-designate Murat Kurum) hosts and leads the Action Agenda. Australia's Chris Bowen is "President of Negotiations" with exclusive authority over the formal talks. Planned: a Pacific pre-COP in Fiji and Tuvalu (Oct 2026), and an Action Agenda session on SIDS climate finance supporting the Pacific Resilience Facility. Secondary sources list themes of zero waste (a Türkiye priority), clean-energy transition, food security and climate finance. — [Australian PM release](https://www.pm.gov.au/media/cop-be-hosted-turkiye-australia-leading-negotiations); [DCCEEW statement](https://unfccc-cop.dcceew.gov.au/cop31-president-of-negotiations-statement); [NST Oct 2026](https://www.nst.com.my/amp/opinion/columnists/2026/10/1550866/who-holds-gavel-cop31s-unusual-australia-t%C3%BCrkiye-deal); [SJES](https://www.sjesjesuits.global/2026/04/29/cop-of-the-future/)
- **BIS**: Genesis named the green-bond impact-verification gap and the retail-liquidity gap, and Symbiosis named the Scope 3 data gap (see sections 3 and 4) — [BIS](https://www.bis.org/about/bisih/topics/green_finance/green_bonds.htm)

### Inferences
- Concrete, institution-validated needs a 2026 hackathon could address:
  1. Article 6 corresponding-adjustment and ITMO tracking, plus registry interoperability tooling for LDCs and SIDS.
  2. Monitoring and verification of results-based payments for the TFFF, which pays per hectare of standing forest.
  3. Data pipelines for the adaptation indicators and tracking of adaptation finance.
  4. Supply-chain Scope 3 data exchange, ideally private.
  5. dMRV workflow redesign, not digitisation.
  6. Zero waste and circularity traceability, a Türkiye COP31 theme.
  7. Pacific and SIDS resilience-finance transparency.
- All of these are timely around COP31 (Nov 2026).

### Gaps
- I didn't retrieve ICVCM, IOSCO, GFANZ, OECD, IMF or ITU digital-MRV statements directly, and no Climate Chain Coalition material either.
- I couldn't confirm whether the UNFCCC international registry was operational as of Oct 2026.
- The adaptation-finance tripling date (2030 vs. 2035) is unresolved because sources conflict.

## 6. Design principles for credible blockchain+AI climate tools, and the hackathon angle (overdone vs. fresher directions)

### Takeaway
Credible designs treat the chain as a thin, neutral integrity layer. They pair it with strong physical verification (sensors, remote sensing, AI cross-checks, accredited verifiers), work with registries and standard-setters, use permissioned or proof-of-stake chains, open standards and privacy-preserving disclosure, and avoid speculative tokens. Hackathon clichés repeat the failure modes in section 2. Fresher directions target the institutional needs in section 5.

### Cited Findings
- Tokenised credits must keep integrity attributes (real, additional, permanent, quantified, verified, uniquely claimed) — [Gold Standard](https://goldstandard.org/news/blockchain-for-better-untangling-tokenisation-and-carbon-markets)
- Verra's 2022 response: ban tokenisation of retired credits and explore "immobilisation". The design lesson is to bridge with registry consent and avoid double issuance. — [Euronews 2025](https://www.euronews.com/next/2025/02/13/could-a-carbon-credit-backed-digital-currency-help-us-fight-climate-change); [CarbonPlan](https://carbonplan.org/research/toucan-crypto-offsets)
- Neutral governance is a precondition, as the TradeLens lesson shows — [PierNext](https://piernext.portdebarcelona.cat/en/technology/the-closure-of-tradelens/)
- Public-chain transparency conflicts with commercial privacy — [Blockchain carbon literature review](https://d-nb.info/1372967540/34)
- Energy Web's design: independent operators validate certificates against machine-readable rules before issuance — [Energy Web](https://www.energyweb.org/aviation)
- World Bank: redesign MRV workflows rather than digitising legacy processes — [World Bank OKR](https://openknowledge.worldbank.org/entities/publication/397c4e52-445a-4cf4-89df-f2e61373a524)

### Inferences
(These are analytical judgements, not sourced findings.)

- **Design principles**:
  1. Pass the Wüst–Gervais test explicitly in the pitch.
  2. Engineer the oracle: multiple independent sources, AI anomaly detection, remote sensing, signed device attestation.
  3. Anchor to existing standards and registries (Verra, Gold Standard, ICVCM CCP labels, Article 6 rules) rather than building a parallel credit system.
  4. Use neutral or open governance.
  5. Use proof-of-stake or permissioned infrastructure and disclose the energy footprint.
  6. Use open data standards: W3C Verifiable Credentials and DIDs, GS1 EPCIS for supply chains, IEEE 2418 series. I didn't verify these individually this session; they come from my own knowledge.
  7. Use zero-knowledge or selective disclosure for supplier data.
  8. Don't make revenue depend on token appreciation.
  9. Record AI provenance (model, data hash, confidence) so AI outputs can be audited, not trusted blindly.
- **Clichéd or overdone hackathon ideas**, each mapped to a documented failure mode:
  - carbon-credit NFT or token marketplaces (Toucan/KlimaDAO, Flowcarbon)
  - "plant a tree, mint an NFT"
  - P2P solar trading tokens (Brooklyn Microgrid scale and regulatory limits)
  - generic "supply chain on blockchain" traceability (TradeLens, Everledger)
  - green-points or reward tokens with no verification
  - an "AI chatbot that gives carbon tips"
  - personal carbon-footprint apps with a coin
- **Fresher and more defensible 2026 directions**, each tied to a section 5 need:
  1. **Article 6 / ITMO "corresponding adjustment" checker**: an interoperability layer that cross-references national, international, CAD Trust-style and VCM registries to flag double claims.
  2. **AI plus satellite verification oracle for TFFF-style forest payments or ARR projects**: the chain records attested evidence bundles, not tokens.
  3. **AI greenwashing and claim-verification auditor for disclosures**: ClimateBERT-style or retrieval-grounded LLM, with a verifiable-credential audit trail of each claim and its source.
  4. **Privacy-preserving Scope 3 / product carbon footprint exchange** between suppliers and buyers using verifiable credentials or zero-knowledge proofs (Symbiosis-like problem).
  5. **Book-and-claim certificates** for hard-to-abate sectors (green steel, shipping fuel, low-carbon cement), following the Energy Web SAFc pattern.
  6. **Adaptation-finance and adaptation-indicator tracker** for SIDS and Pacific resilience funds (COP31 focus).
  7. **Parametric climate-insurance triggers** with transparent oracle data for vulnerable communities.
  8. **dMRV workflow redesign tools** for small project developers in LDCs.
  9. **Zero-waste and circularity material passports**, a Türkiye COP31 theme.

### Gaps
- I found no source that systematically catalogues hackathon clichés; the list above is an inference from the documented failures.
- I didn't verify the W3C VC/DID, GS1 EPCIS, IEEE 2418 or ZKP supply-chain standards individually this session.
