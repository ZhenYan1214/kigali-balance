# Adversarial verification: "EU battery passport lifecycle trust layer + AI SoH oracle" (IEEE ClimateChain 2026)

Research date: 2026-10-14. Method: web search + fetch. EUR-Lex did not render through the fetch tool, so the regulation text comes from the German mirror gesetze.legal (Art. 14, 77, 78, Annex XIII), translated by the fetch model. Check exact wording against EUR-Lex CELEX 32023R1542 before quoting it in a submission.

## Q1. What does Regulation (EU) 2023/1542 already require, and does it remove the need for blockchain?

### Takeaway
The regulation already covers most of the claimed pain points on paper:
- Who must have a passport and from when: EV, LMT and industrial >2 kWh batteries, from 18 Feb 2027.
- SoH is a mandatory restricted-tier field.
- Repurposed or remanufactured batteries get a new passport linked to the original.
- The passport must stay available after the operator ceases to exist.
- Data must be authentic, reliable and have integrity.
- Buyers have a legal read-access right to the BMS SoH parameters (Art. 14).
- Registry participants must authenticate with eIDAS qualified seals.

The "OEM bankruptcy" and "the registry only stores IDs" arguments therefore mostly fail as stated. What the regulation does not specify is how a SoH number gets computed, by whom, or how a third party can reproduce or contest it. The implementing act on who may read restricted data (including SoH) is overdue.

### Cited Findings
**Scope and date (Art. 77(1))**
- From 18 Feb 2027, every LMT battery, every industrial battery >2 kWh and every EV battery placed on the market or put into service needs an electronic "battery passport". — [gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77)
- The date is unchanged. Omnibus VIII (simplification) only postpones removability rules for some products by 18 months (Council position, 24 June). Neither the Commission proposal nor the Council position changes the passport. — [Battery-Tech Network, 11 Oct 2026](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/); [projetcelsius FAQ](https://projetcelsius.com/en/faq/dpp-espr-affichage-env/l-echeance-du-18-fevrier-2027-peut-elle-etre-reportee/)
- Industry is still lobbying for delay or phasing. EUROBAT asked for a "stop-the-clock" until 2030 (Sept 2025) and proposed a phased rollout in its July 2026 omnibus amendments. These are position papers, not law. — [EUROBAT position 2025](https://eurobat.org/wp-content/uploads/2025/09/EUROBAT-battery-passport-omnibus-position-paper-.pdf); [EUROBAT amendments 06.07.2026](https://eurobat.org/wp-content/uploads/2026/08/EUROBATs-Proposed-Amendments-to-the-Environmental-Omnibus-06.07.2026.pdf)

**Access tiers (Art. 77(2) and Annex XIII)**
- Annex XIII(1) is public. It includes rated capacity, voltages, original power capability, **expected lifetime in cycles**, the capacity exhaustion threshold (EV), the calendar-life warranty period, round-trip efficiency (initial and at 50% cycle life), internal resistance and the C-rate. — [gesetze.legal Annex XIII](https://gesetze.legal/eu/vo_eu_2023_1542/anhang_xiii)
- Annex XIII(4) is for persons with a legitimate interest only. It includes:
  - (a) performance and durability values at placing on the market and on status change;
  - (b) **state of health** (per Art. 14 / Annex VII);
  - (c) **battery status** (original / repurposed / re-used / remanufactured / waste);
  - (d) **usage data**: charge/discharge cycles, negative events such as accidents, operating conditions including temperature, and state of charge.
  — [gesetze.legal Annex XIII](https://gesetze.legal/eu/vo_eu_2023_1542/anhang_xiii)
- **Implication:** SoH and usage history are already mandatory dynamic passport content. The proposed "SoH field" is not new. It is restricted, so second-life buyers have to qualify as "legitimate interest".

**Responsibility and multi-owner lifecycle (Art. 77(4), (7), (8))**
- Art. 77(4): the operator placing the battery on the market must keep the information "accurate, complete and up to date". It may authorise others in writing. — [gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77)
- Art. 77(7): for a prepared-for-reuse, repurposed or remanufactured battery, responsibility moves to the operator that places it back on the market. That operator issues a **new passport linked to the original passport(s)**. — [gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77)
- Arianee calls this linkage a "genealogy of passports". — [Arianee](https://www.arianee.com/en/blog/who-is-responsible-for-the-battery-passport)
- Once a battery becomes waste, responsibility moves to the producer / PRO (Art. 57(1)) or to the waste manager (Art. 57(8)). — [gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77)
- Art. 77(8): the passport "ceases to exist" (is deleted) once the battery has been recycled. — [gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77)
- Commission FAQ, Sept 2026, as reported:
  - The passport is issued by whoever finishes the battery (usually where the BMS is fitted).
  - A simple repair does not need a new passport.
  - Pre-2027 batteries remanufactured after Feb 2027 do need one.
  - Dynamic data must be updated at least on status change, not as a live feed.
  — [Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/)
- **Implication:** ordinary owner-to-owner resale of a used EV does not create a passport update obligation. Only status changes (repurpose, remanufacture, waste) do.

**Technical design (Art. 78)**
Art. 78 has eight points (a)–(h): [gesetze.legal Art. 78](https://gesetze.legal/eu/vo_eu_2023_1542/78)
- (a) interoperability with ESPR DPPs;
- (b) free access according to access rights;
- (c) data stored by the responsible operator or its authorised agents;
- (d) agents may not sell or re-use the data;
- **(e) the passport must remain available even if the responsible economic operator ceases to exist or stops activity in the Union;**
- (f) entry and modification restricted by access rights;
- **(g) authenticity, reliability and integrity of data must be ensured;**
- (h) high security and privacy, and fraud prevention.

**Backup copy (ESPR side)**
- Under ESPR 2024/1781, when the economic operator hosts the DPP itself, a DPP service provider must hold the mandatory backup copy. Commission consultation texts describe that provider as an "independent third party" (Art. 2(32)). A certification scheme for providers is under assessment. — [Glass for Europe consultation response](https://glassforeurope.com/wp-content/uploads/2025/07/GfE_Final_ECConsultation_DPPServiceProviders.pdf); [AIOTI response](https://aioti.eu/wp-content/uploads/AIOTI-Response-Digital-product-passport-%E2%80%93-rules-for-service-providers-submitted.pdf)
- I could not verify the exact ESPR article number for the backup rule. See Gaps.

**Registry and trust anchor**
- The Registry and helpdesk opened 20 July 2026.
- Operators must verify themselves with an eIDAS qualified electronic seal or attestation, valid up to 3 years. A lapsed verification blocks updates and transfers.
- The passport identifier is uploaded to the ESPR Art. 13 registry (Art. 77(10)).
— [Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/); [gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77)

**Restricted-access implementing act (Art. 77(9)) is overdue**
- It was due 18 Aug 2026 and was not adopted. A feedback draft is expected Oct/Nov 2026. The Commission DPP page lists Q4 2026. — [Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/); [EUROBAT access-rights feedback 27.05.2026](https://eurobat.org/wp-content/uploads/2026/08/Final-EUROBAT-Battery-Passport-access-rights-feedback-27.05.2026-1.pdf); [Arianee data access levels](https://www.arianee.com/en/blog/battery-passport-data-access-levels)
- Article quote: "Companies are building access control against rules that do not yet exist." — [Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/)
- EUROBAT wants legitimate-interest applicants to show documentary evidence that they work in repair, repurposing, remanufacturing or recycling of the specific model, with a standardised request procedure and ex-ante approval by the passport holder or a verification body. — [EUROBAT feedback via search summary](https://eurobat.org/wp-content/uploads/2026/08/Final-EUROBAT-Battery-Passport-access-rights-feedback-27.05.2026-1.pdf)

**Art. 14 (SoH data access right)**
Since 18 Aug 2024, the BMS of stationary BESS, LMT and EV batteries must hold current data on the parameters for determining SoH and expected lifetime (Annex VII). — [gesetze.legal Art. 14](https://gesetze.legal/eu/vo_eu_2023_1542/14)
- **Who gets access:** any natural or legal person who lawfully purchased the battery, or a third party acting on their behalf. Read-only, at any time, non-discriminatory, with manufacturer IP preserved.
- **Purposes:** making the battery available to aggregators; assessing residual value and remaining life; facilitating reuse, repurposing or remanufacturing.
- **BMS software reset:** the BMS must have a reset function for repurposers. The OEM is not liable after new software is loaded.

**SoH only where there is a BMS**
- SoH requirements apply only where a battery has a BMS. This matters for cheap LMT / e-bike packs. — [Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/)

### Inferences
- **"OEM goes bankrupt, data lost" is legally pre-empted** by Art. 78(e) plus the ESPR backup copy held by an independent service provider. A pitch that leads with this will be shot down by any judge who knows the regulation. You can still argue that a legal requirement is not a technical guarantee: what happens if the service provider also fails, or the battery leaves the EU? That is a weaker, second-order argument.
- **"The EU registry only stores identifiers" is true but beside the point.** The data is meant to be decentralised at operators and their providers. The registry is an index, not a data store.
- **"Need blockchain for authenticity" is weak** because Art. 78(g) mandates integrity and the EU picked eIDAS qualified seals as the trust anchor. Any hackathon design should *use* eIDAS/VC signatures, not compete with them.
- **The real legal gap: nothing specifies how a SoH value is computed, who computes it, or how a third party can reproduce or contest it.** Annex VII parameters are inputs, and the SoH result is whatever the responsible operator writes. The Art. 77(9) access act is also still missing.
- **Owner-to-owner resale is not a passport event.** A private seller's SoH claim at resale is outside the regulatory flow. That is where Aviloo and TÜV operate (see Q2).

### Gaps
- Exact ESPR article and wording of the "backup copy" rule. Search snippets cite consultation documents, not the Official Journal text.
- Exact Annex VII parameter list for EV vs LMT vs BESS. Not fetched.
- Whether the Sept 2026 Commission FAQ / August 2026 data-point guidance makes SoH "mandatory at 18 Feb 2027" or "conditional". Secondary sources give conflicting counts (46 vs 51 mandatory EV data points; 54 for LMT) and conflicting dates (15 vs 21 Aug 2026).

## Q2. Existing SoH certification and analytics products: what do they cover?

### Takeaway
Independent, OEM-agnostic, QR-verifiable SoH certificates for used EVs are a mature commercial category in Europe:
- Aviloo (TÜV-certified, ~3-minute FLASH test);
- Battery Quick Check (TÜV Rheinland + TWAICE JV);
- Generational (UK);
- Circunomics (B2B second-life marketplace with SoH digital twins).

The "AI SoH estimation with a verifiable link" part is not novel for passenger EVs. Weaker coverage seems to exist for LMT/e-bike packs, for cross-owner continuity of SoH history, and for *reproducibility*: certificates are proprietary-algorithm outputs that a buyer must trust.

### Cited Findings
**Aviloo**
- Certificate confirms traction-battery SoH using Aviloo's own algorithm on real vehicle data, benchmarked against similar EVs. Also checks BMS function, sensor accuracy and pack/cell voltages. Newer version adds cell-level heatmaps. — [Aviloo Certified](https://aviloo.com/en/aviloo-certified)
- FLASH test takes ~3 minutes. Aviloo claims methods are "TÜV and CARA certified".
- Results are stored and verifiable by QR code. A "PREVIEW" version targets online listings. — [Aviloo Certified](https://aviloo.com/en/aviloo-certified)
- Aviloo 2024 survey across 6 European countries (vendor data): a certificate raises buyer willingness to pay by ~£469–£938, increases odds of sale by 36%, and 75% of respondents expect one. — [NFDA UK](https://nfda-uk.co.uk/aviloo-battery-certificate-the-new-industry-standard/) (via search summary)

**Battery Quick Check (TÜV Rheinland + TWAICE)**
- Joint venture issuing a TÜV-certified SoH report independent of OEM algorithms, read via OBD in ~60 minutes by garage staff. Targets dealers, leasing firms, insurers and fleets. — [TÜV Rheinland press release](https://www.tuv.com/press/en/press-releases/used-electric-cars-battery-quick-check-as-a-new-service-for-the-independent-evaluation-of-traction-batteries.html); [TWAICE newsroom](https://www.twaice.com/newsroom/tuv-rheinland-certified-battery-test-for-battery-electric-vehicles-creates-trust-on-the-used-car-market)
- TÜV Rheinland executive: the SoH shown by vehicle BMSs "does not provide a reliable indication" of actual condition. Supports the claim that seller- or OEM-reported SoH is not trusted. — [TÜV Rheinland](https://www.tuv.com/press/en/press-releases/used-electric-cars-battery-quick-check-as-a-new-service-for-the-independent-evaluation-of-traction-batteries.html)
- Hella Gutmann joined in 2022 for cross-manufacturer evaluation. — [TWAICE](https://twaice.com/newsroom/new-partner-for-battery-quick-check-hella-gutmann)

**Generational (UK)**
- Certified used EVs sold ~7.3 days faster (43.1 vs 50.4 days, six-month window). Vendor data. — [Broker News](https://brokernews.co.uk/used-evs-sell-over-a-week-faster-with-battery-health-certification/)

**Circunomics (Mainz)**
- B2B marketplace for used packs, modules and cells, plus first- and second-life analytics: BMS integration, SoH and remaining-cycle prediction, AI/physics digital twin per battery. — [electrive](https://www.electrive.com/2025/01/15/circunomics-receives-millions-in-financing/); [Frost & Sullivan write-up](https://dev.frost.com/wp-content/uploads/2023/08/Circunomics-Award-Writeup.pdf)
- Claims 97–98% accuracy (vendor / analyst figure, not audited). Raised €8M (Jan 2025). Opened a Detroit office (Mar 2025). Planned an in-house test lab. — [Frost & Sullivan](https://dev.frost.com/wp-content/uploads/2023/08/Circunomics-Award-Writeup.pdf); [chargedevs](https://chargedevs.com/newswire/circunomics-raises-e8-million-for-its-battery-lifecycle-management-solution); [electrive Detroit](https://www.electrive.com/2025/03/04/circunomics-opens-us-office-in-detroit/)
- No public information on how buyers can audit a listed SoH. — [search summary of sources above]

**Electra Commercial Vehicles battery passport service**
- Assesses and grades a battery's future potential so second-life buyers can judge fit. — [chargedevs](https://chargedevs.com/newswire/battery-passport-monitors-battery-usage-to-facilitate-second-life-applications-and-recycling/)

**Kia + Dukosi pilot**
- Per-cell monitoring data feeds a digital passport. SoH updates automatically after maintenance. Data sharing ran through a TNO-developed pilot environment. — [Fleet News](https://www.fleetnews.co.uk/news/kia-trials-ev-battery-health-monitoring); [InsideEVs DE](https://insideevs.de/news/775219/kia-testet-batteriepass-technik-zellebene/)

**Arianee (LMT / e-bikes)**
- Markets an "open DPP infrastructure" battery passport offering, including for e-bikes and scooters. Vendor material counts 54 mandatory LMT data points. — [Arianee e-bikes/scooters](https://www.arianee.com/en/solutions/batteries/e-bikes-scooters); [Arianee responsibility blog](https://www.arianee.com/en/blog/who-is-responsible-for-the-battery-passport)

### Inferences
- **For passenger-EV resale, the claimed pain ("buyers only get seller-reported SoH") is already addressed** by paid independent certificates with QR verification. A hackathon demo of "AI estimates SoH, QR shows result" duplicates Aviloo and Battery Quick Check.
- **What these products do not visibly offer** (from the sources found):
  - a vendor-neutral, reproducible record (algorithm/model version + input-data hash) that a *different* party can re-run;
  - a chain of SoH observations across owners and across different certifiers;
  - dispute handling when two certifiers disagree.
  Their trust model is "trust the TÜV-accredited vendor", which works well commercially. The pitch must explain why that is insufficient.
- **LMT / e-bike packs look less served by SoH certifiers.** No used-e-bike SoH certificate product showed up. This is a weak signal from limited search, not proof of absence.

### Gaps
- No verified information collected on Moba, Accure, Volytica, Elysia (Fischer), Spherics, Recurrent (US), Cling Systems, BeePlanet, Betteries, DEKRA or TÜV SÜD battery checks; the searches did not surface them. Do not cite them without checking. From memory and unverified:
  - Recurrent issues US used-EV range/SoH reports.
  - Cling Systems is a Swedish B2B used-battery marketplace.
  - Betteries and BeePlanet are second-life repurposers.
  - Accure, TWAICE, Volytica and Elysia are battery analytics SaaS.
- No independent (non-vendor) study quantifying the price effect of SoH certificates in Europe was found.

## Q3. Existing blockchain / VC battery passport projects: has "SoH anchored with VC + multiple owners" already been done?

### Takeaway
Yes, at least at pilot / MVP level. MOBI has:
- a Battery SOH Standard;
- an SOH labeling and certification white paper (Dec 2024);
- a Global Battery Passport Web3 MVP using its blockchain Integrated Trust Network (ITN) as the identity trust anchor, Citopia verifiable credentials for peer-to-peer SOH sharing, and ownership track-and-trace.

That is essentially the proposed architecture, minus the explainable-AI oracle. Further pilots exist from Busan (government), the EU BASE project (Fraunhofer IEG, blockchain), FPT+Knobs, Everledger+Ford (Everledger collapsed in 2023), a Cardano Catalyst proposal, and academic prototypes (BlockBaRT, composable NFTs). Circulor (Volvo EX90) promises 15 years of SoH updates in a passport.

### Cited Findings
**MOBI**
- Battery SOH Standard developed with ~20 organisations including BMW, Ford and GM. Treats 80% of initial capacity as end of (first) life. — [Power & Beyond / PCIM](https://www.power-and-beyond.com/first-standard-supporting-mobi-battery-initiative-a-56e8ea85399d7b592c88bffa03514658)
- ITN can serve as the blockchain-based identity trust anchor, and the Citopia marketplace enables VCs for peer-to-peer SOH data sharing. — [MOBI Battery Passport](https://dlt.mobi/battery-passport)
- Track-and-trace pilot used Citopia Self-Sovereign Digital Twins and VCs to simulate interactions among manufacturers, suppliers and consumers, explicitly for SOH/SOC tracking, second life and recall. — [MOBI Battery Track-and-Trace](https://dlt.mobi/battery-trackandtrace/)
- First Web3 Global Battery Passport MVP demonstrated ITN cross-validation of battery identity and data. — [MOBI GBP MVP](https://dlt.mobi/gbp-mvp/)
- 2024 milestones: VCs, selective disclosure, track and trace of asset ownership, secure data exchange. "Battery SOH Labeling and Certification White Paper" released Dec 2024. — [MOBI 2024 milestones](https://dlt.mobi/2024-milestones/)
- These are MOBI's own announcements and mostly simulations, not independently verified deployments.

**Spherity**
- Digital battery passport in use at Berlin transit operator BVG (2026). Purpose: condition, origin, maintenance planning and the second life of bus batteries (10–15 years, then stationary storage). Spherity is known as a VC/SSI company, but the article did not confirm VC use. — [battery-news.de](https://battery-news.de/en/2026/04/10/digital-battery-passports-in-public-transportation-bvg-launches-project-with-technology-provider-spherity/)

**Circulor / Volvo**
- EX90 passport (2024): raw-material origins, recycled content, CO2. Circulor CEO said it will include up-to-date SoH "for 15 years" at ~$10/car. — [chargedevs](https://chargedevs.com/newswire/volvo-issues-ev-battery-passport-3-years-ahead-of-eu-requirements/); [TechRadar](https://www.techradar.com/vehicle-tech/hybrid-electric-vehicles/volvos-new-ev-has-the-worlds-first-battery-passport-heres-why-thats-a-big-deal)

**Everledger**
- Ran a battery passport pilot with Ford. Australian entity entered voluntary administration (April 2023); UK arm reported in liquidation or wind-down. — [chargedevs](https://chargedevs.com/newswire/everledger-and-ford-introduce-battery-passport-pilot/); [Ledger Insights](https://www.ledgerinsights.com/everledger-bankruptcy-esg-blockchain-traceability/)
- **Useful irony for the pitch:** a blockchain passport vendor itself went bust.

**Other projects and research**
- Busan, South Korea: selected for a national blockchain public-sector project to build a blockchain battery passport platform, with pilots on charging & safety, performance inspection and lifecycle management. — [Busan press release](https://www.busan.go.kr/eng/ai-translated-press-releases/1692403)
- EU BASE project (Fraunhofer IEG) uses blockchain as a tool for the digital battery passport. — [electrive](https://www.electrive.com/2024/12/11/eu-project-to-establish-digital-battery-passport/); [Industrial Production](https://www.industrial-production.de/sustainability/eu-project--base--develops-battery-passport-only-a-transparent-battery-is-a-green-battery.htm)
- FPT Industrial + Knobs: blockchain-enabled battery passport applicable to all FPT packs. — [IVECO BeyondLab](https://beyondlab.ivecogroup.com/success-stories/fpt-and-knobs-unlocking-battery-traceability-through-blockchain)
- Cardano Catalyst F13 proposal "UNBOX smart battery passports" with zero-knowledge tech. — [Lido Nation](https://lidonation.com/en/proposals/unbox-smart-battery-passports-connecting-the-largest-industrial-battery-manufacturer-in-the-world-to-cardano-using-zero-knowledge-tech-for-secure-and--f13)
- Academic:
  - BlockBaRT: public blockchain plus SSI-style selective disclosure. — [CSIR](https://researchspace.csir.co.za/bitstreams/719cbea5-d5f7-4236-bd7a-60763b82f7a1/download)
  - Composable NFTs for EV battery passports. — [Khalifa Univ.](https://khazna.ku.ac.ae/en/publications/using-composable-nfts-and-blockchain-for-the-creation-of-ev-batte/)
  - IFAC 2024 paper ranking DLTs for an automotive battery passport: Hedera > IOTA > EOS. — [UNIMORE](https://iris.unimore.it/handle/11380/1360566)
  - IEEE Access 2024 on battery passports for second-life batteries. — [DOAJ](https://doaj.org/article/26a2a5fa89da4c7dbda951d224138258)

### Inferences
- **"Blockchain battery passport" and "VC-based SoH sharing with ownership tracking" are already done** (MOBI MVP/pilots, Busan, BASE, FPT/Knobs, academia). A generic version will read as derivative to IEEE judges.
- **The proposal's remaining distinctive element is the AI-oracle reproducibility piece:** model version + input hash + CI anchored so anyone can re-verify. MOBI has a SoH *standard* and *labeling* white paper, but nothing found shows anyone anchoring re-runnable, explainable SoH computations with uncertainty and comparing multiple estimators.

### Gaps
- Catena-X / Cofinity-X battery pass, IOTA, Energy Web, Minespider, CIRPASS, Siemens/Infineon pilots: not surfaced by searches, so no status verified.
- Whether MOBI's SOH Labeling & Certification White Paper (Dec 2024) already specifies algorithm attestation or reproducibility. Not fetched. This is the single most important document to read before committing.

## Q4. Is second-life really blocked by lack of trusted SoH data? (quantify)

### Takeaway
Trusted SoH is a real but **not the dominant** barrier for second life. Peer-reviewed and policy sources rank costs, liability, pack design and the collapse in new-cell prices ($30–50/kWh in China, 2024) at least as high. For **used-EV resale**, battery-health anxiety is the top consumer barrier, but independent certificates exist and measured degradation is small (~93–95% SoH). Evidence that a lack of trustworthy SoH alone strands batteries is thin.

### Cited Findings
**Second-life barriers**
- CEPS (May 2026, Moreschi & Rizos) main challenges: regulatory uncertainty about responsibility after end of life, high repurposing costs, underdeveloped supply chains, hard-to-disassemble packs. Calls for clearer liability and **harmonised SoH/SoC approaches**. — [CEPS PDF](https://cdn.ceps.eu/2026/05/2026-05-ERCC-second-life-batteries-applications.pdf); [EU Circular Economy Platform](https://circulareconomy.europa.eu/platform/fr/node/9880)
- 2023 review: pricing of second-life batteries is "a critical factor" but challenging. Main barriers are uncertain repurposing costs, unreliable market alignment and lack of financial justification. — [arXiv 2308.06786](https://arxiv.org/pdf/2308.06786)
- *Carbon Neutrality* (2023) review: missing first- and second-life degradation data seriously hurts RUL and SoH prediction. — [DOAJ](https://doaj.org/article/aa6aad5e1e074ce5b66c5f76c2d491e9)
- SoH estimation for second-life batteries carries many uncertainties: missing history, non-uniform degradation, chemistry variation, OEM charging protocols. Full capacity tests are most reliable but too slow for scale, and rapid tests are sensitive to temperature and SoC. — [UM review](https://knova.um.edu.my/research_publications_2021_2025/5764); [arXiv 2512.01294](https://arxiv.org/pdf/2512.01294)
- **Industry commentary:** new cell prices in China fell to $30–50/kWh in 2024, making it hard for second-life products to offer an attractive discount. Buyers prefer new batteries with warranties. There is no standardised testing or grading process. — [The Energyst](https://theenergyst.com/the-truth-behind-second-life-batteries-why-reuse-is-lagging-behind/)
- SAE 2026-26-0193: lack of harmonised testing, grading and certification standards is a core challenge. Proposes unified diagnostics and digital battery passports. — [SAE Mobilus](https://saemobilus.sae.org/papers/analysis-second-life-electric-vehicle-batteries-value-maximizing-repurposing-resale-ways-achieve-optimal-performance-standardization-challenges-testing-certification-2026-26-0193)
- Ellen MacArthur Foundation WCEF2026 session: second-life batteries in emerging markets often move through informal channels without adequate safety infrastructure. — [EMF event hub](https://eventhub.ellenmacarthurfoundation.org/WCEF2026_accelerator_session-Second_charge_unlocking_EV_battery_value)
- Southampton study: data on second-life prices is "too scant" for reliable quantitative conclusions. — [Soton eprints](https://eprints.soton.ac.uk/422358/1/EV2ndlife_manuscript.pdf)
- IDTechEx (dated, 2020–2030): retired EV batteries retain 70–80% capacity. Forecasts >275 GWh/yr second-life capacity by 2030. — [OEM Off-Highway](https://www.oemoffhighway.com/electronics/power-systems/batteries-capacitors/news/21082085/idtechex-giving-a-secondlife-to-retired-electric-vehicles)

**Used-EV resale**
- AXA UK: battery-health concern is the primary barrier to used EVs. 62% of those who would not buy cite it. — [AXA report](https://www.axa.co.uk/globalassets/new-website/newsroom/reports-and-publications/green-transport/axa-sparking-change-the-case-for-delivering-ev-battery-health-certificates.pdf/)
- Electrifying.com / The AA survey of >13,000 UK drivers: only 3% felt confident buying a used EV, and 38% said an independently verified battery-health certificate would increase confidence. Testing of >8,000 EVs found average SoH >95%. Groups lobby the UK government to mandate SoH certificates for dealer-sold used EVs (Aug 2026). — [Renewable Energy Magazine](https://www.renewableenergymagazine.com/electric_hybrid_vehicles/drivers-deserve-to-know-the-health-of-20260825)
- Arval analysis of 8,000 EVs sold in 2023–24: average battery health ~93%. — [search summary, Autovista24/Broker News](https://autovista24.autovistagroup.com/news/the-automotive-update-all-electric-ford-puma-battery-health-certificates-used-car-markets/)

### Inferences
- **The pain is real at the *perception / information* level** (3% confidence, 62% cite battery fears). The market answer is centralised certificates, possibly mandated (UK lobbying, Italian press on SoH certificates). It is not ledgers.
- **For second life the binding constraints are economics and liability.** Better SoH trust is necessary but not sufficient, and the pitch must not overclaim that it "unlocks" second life.
- No source quantifies a "trust discount" (price haircut caused by unverifiable SoH) for second-life packs. Calling it "X% discount" in a pitch would be fabrication unless a source is found.

### Gaps
- McKinsey, Fraunhofer and JRC quantitative estimates on stranded or second-life volumes in Europe were not retrieved.
- No quantified price penalty for unverified SoH in B2B second-life trading.
- CEPS full text not parsed (PDF extraction failed locally).

## Q5. Hackathon saturation, final verdict, and the sharpened narrow gap

### Takeaway
**Saturation:** web search did not index any Devpost / ETHGlobal / DoraHacks battery-passport projects. Devpost's own search returned HTTP 429, so saturation could not be measured directly. Given the volume of corporate, government and academic blockchain battery passport pilots, a generic "battery passport on blockchain" is clichéd for a blockchain + climate hackathon regardless of the Devpost count.

**Verdict:** the idea as proposed is **partly killed**:
- OEM-bankruptcy persistence: pre-empted (Art. 78(e) + ESPR backup copy).
- SoH as a passport field: pre-empted (Annex XIII 4(b)).
- Linked repurposing passports: pre-empted (Art. 77(7)).
- Authenticity: pre-empted (Art. 78(g) + eIDAS seals).
- Independent SoH certificates: done (Aviloo, TÜV/TWAICE).
- VC + blockchain + SoH + ownership: done (MOBI).

**A defensible narrow gap remains:** *reproducible, contestable, multi-party SoH attestations* layered on top of the EU passport (not replacing it), with an Art. 14 / Art. 77(9) "legitimate-interest" credential flow.

### Cited Findings
- No hackathon platform results found for "battery passport". The `site:devpost.com` query returned zero Devpost pages, and the Devpost search page returned HTTP 429. — [search attempt, not a source]
- The EU system is deliberately decentralised, and user authentication for restricted data is "unsettled". The Art. 77(9) access act is overdue (draft expected Oct/Nov 2026). — [Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/)
- BMS-reported SoH is called unreliable by TÜV Rheinland. Independent certifiers use proprietary algorithms. — [TÜV Rheinland](https://www.tuv.com/press/en/press-releases/used-electric-cars-battery-quick-check-as-a-new-service-for-the-independent-evaluation-of-traction-batteries.html); [Aviloo](https://aviloo.com/en/aviloo-certified)
- CEPS calls for harmonised SoH approaches. — [CEPS](https://cdn.ceps.eu/2026/05/2026-05-ERCC-second-life-batteries-applications.pdf)
- Passport deleted after recycling (Art. 77(8)). Status changes, not resale, trigger updates. — [gesetze.legal Art. 77](https://gesetze.legal/eu/vo_eu_2023_1542/77); [Battery-Tech Network](https://battery-tech.net/the-eu-battery-passport-belongs-to-whoever-finishes-the-battery-four-months-before-it-becomes-mandatory/)
- Second-life batteries in emerging markets flow through informal channels. — [EMF](https://eventhub.ellenmacarthurfoundation.org/WCEF2026_accelerator_session-Second_charge_unlocking_EV_battery_value)

### Inferences (verdict and how to sharpen)

**What fails (drop from the pitch)**
- "OEM bankruptcy loses the data". Contradicted by Art. 78(e) plus the ESPR backup copy.
- "The registry only stores IDs, so we need a ledger". This is by design (decentralised DPP).
- "Nobody records SoH". Annex XIII(4)(b) and Art. 14 already require it.
- "Ownership-transfer VCs on chain" as a headline. MOBI already did it, and resale is not a passport event.
- "Second-life is blocked by SoH trust". Overclaim: economics and liability dominate.

**What survives: the narrow, real gaps**
1. **SoH reproducibility and dispute layer.** Today the responsible operator writes one SoH number, and certifiers produce proprietary numbers. Nothing lets a repurposer, insurer or authority re-run the computation or compare estimators.
   - Anchor (model hash, version, input-data Merkle root, method, CI) as a signed claim.
   - Let several independent estimators post their claims.
   - Show divergence and confidence.
   - The ledger's job is a neutral, append-only, cross-organisation timestamp for *competing* claims that no single passport host controls. That is a better blockchain justification than "storage".
2. **Art. 14 + Art. 77(9) legitimate-interest credentials.** The access act is not adopted. EUROBAT proposes documentary proof plus ex-ante approval. A demo of VC-based "I am an authorised repurposer for model X" credentials, with privacy-preserving, auditable access logs for restricted Annex XIII(4) data, is timely. It must use eIDAS-compatible VCs, not invent a new PKI.
3. **History continuity across the passport "genealogy" and beyond EU borders.**
   - Pre-2027 batteries remanufactured after 2027 need a passport, but they have no recorded first-life history.
   - Batteries exported to non-EU second-life markets (Türkiye, Africa, Southeast Asia, Taiwan) leave the EU registry's reach.
   - The passport is deleted at recycling, removing data useful for recycled-content audits.
   - A hash-anchored, portable SoH history is plausibly useful here. Treat this as an argument, not evidenced demand.
4. **LMT / e-bike niche.** No used-e-bike SoH certifier was found. Cheap packs may lack a BMS (then no SoH duty). Volume is large, but per-unit value is low, so cost per anchor matters. Batching via Merkle roots on an L2 or Hedera/IOTA-like ledger is a plausible design.

**Recommended reframing**
- From "battery passport on blockchain" to **"Verifiable SoH Claims: a reproducible, multi-estimator SoH attestation and dispute layer that plugs into EU battery passports (Art. 14 / Annex XIII(4)) for second-life buyers"**.
- Demo:
  1. A simulated BMS signs Annex VII parameter snapshots.
  2. Two different SoH models (e.g., a physics-informed one and a GBM/NN) produce SoH ± CI with SHAP-style explanations.
  3. Both claims are anchored.
  4. A buyer verifier re-runs model X on the committed inputs and gets the same number, while seeing the disagreement with model Y.
  5. A legitimate-interest VC gates the raw data, and a public view shows only the claim hashes and the CI.

**Expected judge objections to pre-empt**
- "Why not a transparency log (Sigstore Rekor / Certificate Transparency style) or eIDAS qualified timestamps?" Honest answer: a public ledger is one option. Justify it by multi-jurisdiction neutrality (non-EU second-life buyers) and by having no single host who could rewrite competing claims. Admit that a permissioned log could also work.
- "Isn't BMS data signing already OEM-controlled?" Yes. Device-key provisioning by the OEM is the root of trust, so the AI layer cannot fix garbage-in. State this limitation openly.

### Gaps
- True hackathon saturation count (Devpost blocked with 429; ETHGlobal/DoraHacks not indexed). Recommend a manual search on devpost.com, ethglobal.com/showcase and dorahacks.io for "battery passport", "battery health", "EV battery".
- Whether MOBI's Dec 2024 SOH Labeling & Certification white paper already covers algorithm attestation. If yes, gap 1 narrows significantly.
- Türkiye and Taiwan second-life / battery-passport regulations: not researched in this pass.
