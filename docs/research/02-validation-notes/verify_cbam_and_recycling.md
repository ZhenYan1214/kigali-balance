# Adversarial verification: Idea A (CBAM multi-tier embedded-emissions relay) and Idea H (recycled-content mass-balance conservation ledger)

Research date: 2026-10-14. Scope: try to kill both ideas (existing products, blockchain-unnecessary arguments, pain-not-real evidence), then state the narrowest remaining gap. Roughly 25 searches/fetches; several vendor and adoption facts could only be found in 2021-2023 sources, which is flagged where it applies.

---

## A1. Existing CBAM/PCF tools: does anyone already do the multi-tier relay and allocation conservation?

### Takeaway
The relay part (passing supplier and precursor embedded-emissions data downstream) is already well covered. Commercial CBAM SaaS does it, Siemens SiGREEN/Estainium (DLT plus verifiable credentials) does it, PACT and Catena-X provide the PCF exchange standards, and most importantly the EU CBAM Registry itself reportedly adds operator-to-operator precursor data sharing in 2027. I found no tool that publicly advertises cross-customer volume conservation (sum of tonnes claimed at actual values <= tonnes produced under one verified report). That narrow piece is the only unclaimed space, and it is not confirmed absent.

### Cited Findings
- CarbonChain says engaging precursor suppliers is "the biggest CBAM challenge". Its platform "streamlines supplier engagement and provides an audit trail", and it focuses on iron, steel, aluminium and fertilisers — [CarbonChain](https://www.carbonchain.com/cbam/signup); [cbamguide review](https://cbamguide.com/software/carbonchain/)
- CBAMBOO starts every precursor from default values and lets importers invite suppliers to replace them with actual data. CoZero logs primary-data requests so importers can show they tried. SAP/PwC Carbon Border Manager runs guided supplier requests with built-in validation. The Sustainability Cloud (TSC NetZero) gives non-EU exporters a supplier portal for precursor embedded emissions, with ERP/SCADA/IIoT/sub-meter integrations. Coolset's CBAM module was "coming soon" — [Coolset: top CBAM tools](https://www.coolset.com/academy/top-cbam-software-tools); [CoZero](https://cozero.io/solutions/cbam); [SAP/PwC](https://www.sap.com/turkey/products/scm/partners/pwc-solutions-gmbh-carbon-border-manager-check-your-value-chains-cbam-module.html); [TSC CBAM Exporter](https://www.thesustainabilitycloud.com/products/cbam-exporter/)
  - Note: TSC NetZero's meter/SCADA ingestion already covers part of Idea A's "AI extracts from meter data" pitch.
- Siemens Estainium (announced 2021) is an open cross-industry PCF exchange network. It uses distributed ledger technology to issue and exchange Verifiable Credentials, with "no centralized storage" and full data sovereignty. Founding members include Merck, NTT Data, Weidmüller, TÜV SÜD and Faber-Castell. Customers verify supplier values through a "Verifiable Proof" against the credential on the IDUnion blockchain. Requesting, aggregating and sharing PCF data in SiGREEN is free as a basic feature — [Siemens press release 2021](https://press.siemens.com/global/en/pressrelease/siemens-has-developed-ecosystem-based-approach-exchange-emission-data); [Siemens PDF](https://assets.new.siemens.com/siemens/assets/api/uuid:771556df-3959-4d53-a660-94f88305d8e2/HQDIPR202111226347EN.pdf); [SiGREEN brochure](https://assets.new.siemens.com/siemens/assets/api/uuid:01f95953-c470-404d-9f21-b32944374f8d/06-hohlweck-sigreen.pdf)
- Together for Sustainability (chemical industry) members planned to test SiGREEN data exchange under the TfS PCF guideline. Siemens also offers a SiGREEN X-Dev API for third-party software — [Siemens DE press](https://press.siemens.com/global/de/pressemitteilung/siemens-entwickelt-oekosystembasierten-ansatz-fuer-den-austausch-von); [Siemens Xcelerator API](https://xcelerator.siemens.com/global/en/all-offerings/apis/s/sigreenx-dev-api.html)
- PACT conformance requires passing interoperability tests with two or more third-party solutions. WBCSD runs monthly Connectathons and keeps a PACT Online Catalog — [SINE/PACT conformance deck](https://pidx.org/wp-content/uploads/2024/11/PACT-Conformance-Testing-Process-Overview-Prasad-Tilloo-Technical-Project-Manager-SINE-Foundation.pptx.pdf)
- Catena-X maintains the PCF exchange standard CX-0136 and the PCF Rulebook v4, which is cradle-to-gate. Exchange is currently an aggregated PCF value: "A breakdown is not possible due to our concept of data sovereignty." TÜV SÜD announced in February 2026 that it is one of the first Catena-X PCF verifiers/certifiers — [Catena-X PCF Q&A](https://catena-x.net/wp-content/uploads/2025/04/QA-PCF-Pitch-Session.pdf); [Tanso](https://www.tanso.de/blog/catena-x-launch); [TÜV SÜD JP](https://www.tuvsud.com/ja-jp/press-and-media/2026/february/tuv-sud-jp-catena-x-verifier-and-certifier)
- Strongest kill. Commission-derived guidance for non-EU operators says operators can register in the CBAM Registry, upload data per installation once, and after verification make it available to every importing declarant, with the declarant seeing only a summary. It also says "in 2027, the CBAM Registry will be extended so that you can also share emissions data with other operators who use your goods as precursors for their own CBAM goods." — [Guidance No. 2, quick guide for non-EU operators (via trungtamwto.vn)](https://trungtamwto.vn/download/24374/guidance-no.-2--quick-guide-for-non-eu-operators-on-cbam-implementation.pdf); [Naturvårdsverket on the "CBAM Registry for non-EU" portal](https://www.naturvardsverket.se/vagledning-och-stod/cbam/deklarera-i-cbam-registret/)
- Ecovolt365, a company and not a hackathon entry, already pitches blockchain + IoT energy data + stablecoin settlement for CBAM — [LinkedIn post (company claim)](https://sg.linkedin.com/in/murali-dandu)

### Inferences
- "Relay embedded-emissions data downstream through tiers" is not differentiated. It is a commodity feature in at least 5 SaaS products, has a blockchain/VC incumbent (Estainium/SiGREEN), and has an official EU channel coming (the registry precursor-sharing extension). A judge who knows CBAM will ask "why not the CBAM Registry?"
- Estainium already shows that the "blockchain + verifiable PCF credentials" thesis has been tried by a major industrial player. I found no evidence of large post-2023 adoption, which itself suggests weak market pull for DLT-based PCF exchange. Treat this as absence of evidence, not proof.
- No vendor I found publicly claims cross-customer volume conservation. The design norms (Catena-X aggregated values, registry summaries) focus on confidentiality, not on reconciling tonnes across buyers.

### Gaps
- No 2024-2026 source on SiGREEN/Estainium membership, transaction volumes or PACT conformance. Siemens' current SiGREEN page should be checked directly.
- I could not find the Commission's own primary text on the 2027 precursor-sharing extension, only the guidance document. I also could not confirm whether the registry reconciles tonnage across multiple declarants who use the same operator report.
- Carbonfact, Sphera, Normative, Sustamize, Vaayu, Ecolyst, Climatiq, iPoint and Circularise-for-PCF were not individually checked. They are mostly PCF calculators or ESG platforms, and none is known to do cross-buyer volume conservation.

---

## A2. Does CBAM's own verification already prevent "double allocation"? Is double allocation of low-carbon steel a documented problem?

### Takeaway
Under CBAM's methodology, a good's specific embedded emissions (SEE) are the installation's attributed emissions for a production process divided by tonnes produced in the reporting period. That gives one average per good per period, so there is no legal way to "allocate" the low-carbon share to chosen customers. The double-allocation problem in Idea A's framing therefore mostly does not exist inside CBAM; it lives in voluntary green-steel claims (mass balance and certificates). There, it is documented as a credibility and greenwashing controversy, not as a proven fraud case. CBAM's accredited verification (mandatory from 2026 declarations) plus registry-based sharing covers most of the remaining integrity need.

### Cited Findings
- Commission formula: for a simple good, SEE_g = AttrEm_g / AL_g, where AL_g is the tonnes of good g produced in the reporting period. Complex goods recursively add sum(M_i x SEE_i) for precursors — [European Commission CBAM slides](https://climate.ec.europa.eu/system/files/2023-01/2022122_p1b_en.pdf); [Commission non-EU guidance 2023](https://taxation-customs.ec.europa.eu/system/files/2023-11/CBAM%20Guidance_non-EU%20231121%20for%20web_0.pdf). One secondary source says the methodology now sits in Implementing Regulation (EU) 2025/2547 — [Naturvårdsverket](https://www.naturvardsverket.se/vagledning-och-stod/cbam/deklarera-i-cbam-registret/)
- Article 8 of Regulation 2023/956 requires declared embedded emissions to be verified by an accredited verifier under Annex VI and Implementing Regulation 2025/2546. Verifiers check the accuracy of data communicated by third-country installations. If precursors are declared at actual values, they need their own verification, otherwise the product falls back to defaults — [The Trade Hub: CBAM verification](https://www.thetradehub.eu/en/guides/cbam/verification); [TSC verifier guide](https://www.thesustainabilitycloud.com/blog/eu-cbam-verifiers-complete-guide-and-checklist-for-indian-exporters-2026-ready/)
- The Commission published CBAM verification/accreditation guidance on 24 Aug 2026. A Commission state-of-play on 10 July 2026 showed 24 accreditation bodies willing to accredit and 11 accepting applications. Verifiers can produce reports via the registry from January 2027 for 2026 imports. The first declaration is due 30 Sept 2027 — [ChemRadar](https://www.chemradar.com/en/service/detail/fxluutmsuyv4); [GreenSutra](https://greensutra.in/?p=238458); [Sluicebox](https://www.sluicebox.ai/news/cbam-verification-arrives-2027) (secondary sources; dates vary between them)
- Default-value mark-up: 10% (2026), 20% (2027), 30% (2028 onward) for steel, aluminium and cement, about 1% for fertilisers, attributed to Implementing Regulation (EU) 2025/2621. Worked example: Indian HR steel at 4.28 → 4.71 → 5.14 → 5.56 tCO2e/t — [Eurometal](https://eurometal.net/eu-commission-finalizes-cbam-benchmarks-default-values-ahead-of-january-2026-launch/); [GreenSutra](https://greensutra.in/?p=237208); [OPIS](https://www.opis.com/resources/energy-market-news-from-opis/provisional-cbam-calculation-values-pass-committee-vote/). This confirms Idea A's motivation numbers.
- XCarb green steel certificates are aggregated, DNV-verified CO2 savings from blast-furnace projects, sold as Scope 3 reductions (book-and-claim, not physical). Some XCarb-labelled products use a mass-balance approach — [ArcelorMittal XCarb certificates](https://corporate.arcelormittal.com/climate-action/xcarb/xcarb-green-steel-certificates)
- A civil-society open letter (June 2025; Sandbag, SteelWatch and 30+ CSOs) opposes mass-balance accounting in steel standards (JISF/Nippon Steel proposals). It warns of arbitrary baselines, "virtual" reductions and a "risk of double-counting", and asks for physical traceability — [SteelWatch open letter PDF](https://steelwatch.org/wp-content/uploads/2025/06/Final-_-CSO-open-letter-on-mass-balance-greenwashing-updated-20250609-new.pdf); [Sandbag](https://sandbag.be/cso-open-letter-on-mass-balance-greenwashing-20250605-1); [Lead the Charge](https://leadthecharge.org/resources/mass-balance-or-mass-deception/); [ECOS Nov 2025: "Trade low carbon steel, not credits"](https://ecostandard.org/wp-content/uploads/2025/11/Trade-low-carbon-steel-not-credits-November-2025.pdf)
- No source found that alleges a specific case of the same XCarb/green-steel tonne being sold twice — (search result summary; absence of evidence)
- The CBAM Omnibus (Regulation (EU) 2025/2083, in force 20 Oct 2025) set a 50 t/year per-declarant threshold. It reportedly excludes about 90% of importers while keeping about 99% of embedded emissions in scope — [EY](https://www.ey.com/en_gl/technical/tax-alerts/eu-adopts-cbam-omnibus-regulation); [Mondaq](https://www.mondaq.com/unitedstates/international-trade-investment/1686642/key-omnibus-simplifications-to-cbam-now-final)
- The downstream extension proposal (17 Dec 2025) adds about 180 steel- and aluminium-intensive downstream goods (Parliament mandate: 457; Council: about 200; trilogue as of Oct 2026). It adds anti-circumvention rules and pre-consumer scrap, and allows downstream products to be declared at default values — [Mayer Brown, 7 Oct 2026](https://www.mayerbrown.com/en/insights/publications/2026/10/eus-cbam-downstream-extension-and-anti-circumvention-amendments-the-road-to-trilogue); [Reed Smith](https://www.reedsmith.com/our-insights/blogs/trade-compliance-resource-hub/4874/commission-proposes-expansion-of-eu-cbam-to-downstream-goods-and-addresses-potential-cbam-abusive-practices/); [Eurometal](https://eurometal.net/eu-moves-to-strengthen-cbam-with-downstream-coverage-and-anti-circumvention-rules/)

### Inferences
- Pitching "a mill cannot allocate the same low-carbon output to more customers than it produced" as a CBAM feature is legally confused. CBAM gives no per-customer allocation of low-carbon share, because every tonne in the period gets the production-process average. Judges with CBAM knowledge would catch this. Allocation conservation only makes sense for:
  1. Voluntary or market claims (mass-balance green steel, XCarb-type certificates, Scope 3 claims). This is the arena the CSO letter attacks, but the critics want these claims abolished or physically segregated, not better bookkept.
  2. Volume reconciliation of actual-value reports: making sure the tonnes for which a verified installation report is reused across many declarants, or downstream precursor users, do not exceed what that installation produced. This guards against laundering goods from a dirtier installation under a clean installation's verified report (an anti-circumvention concern the EU is legislating on).
- Mandatory accredited verification plus the official registry largely solve the "is this number trustworthy" problem at tier 1. What remains is tiers 2+ (fastener maker → wire rod → mill) and the cross-declarant tonnage cap. The registry's 2027 precursor sharing may cover tier 2+ as well.
- The downstream extension allowing defaults for downstream products may reduce how much the multi-tier actual-value chain matters for the new goods.

### Gaps
- I could not confirm from the final legal text (2025/2547) whether SEE must be one value per aggregated goods category per installation per period, or whether sub-period or batch differentiation is allowed. This is critical; the team should read Annex of 2025/2547 directly.
- I found no evidence on whether the CBAM Registry enforces tonnage caps on a shared operator report.

---

## A3. Taiwan and Türkiye specifics

### Takeaway
Both governments are active, but mostly with information, training and audit-subsidy support rather than shared data infrastructure. Taiwan's figure of about 2,600 affected firms is confirmed. About 2,200 of them export under 50 t/yr, so they are below the Omnibus threshold, yet they still have to pass emissions data to traders and importers. Turkish steel is mostly EAF/scrap-based and lower-carbon. The sector complains that default values don't reflect this, which is a real reason to want actual values.

### Cited Findings
- Taiwan's Ministry of Environment (MOENV) and Ministry of Economic Affairs (MOEA) launched a dual-zone "CBAM服務平台" (rule updates, consultation, coaching window). About 2,600 Taiwanese firms are affected, mostly steel SMEs, with payments starting 2027. About 2,200 export under 50 t/year but still have to give emissions information to traders/declarants. Firms can choose default or actual values, and only actual values let them offset Taiwan's carbon fee against CBAM. MOENV planned an EU carbon-fee-deduction outcome by June/July 2026 and a joint coaching task force with MOEA — [Reccessary](https://www.reccessary.com/zh-tw/news/MOENV-and-MOEA-CBAM-Section)
- MOEA's Industrial Development Administration (IDA) runs training with industry associations, carbon-inventory and diagnosis coaching, and energy-saving equipment subsidies. It uses a "以大帶小" model (large core suppliers bring along SMEs) and holds seminars to teach firms to calculate product carbon content themselves — [CIO Taiwan interview](https://www.cio.com.tw/interview-the-director-of-the-industrial-development-agency-of-the-ministry-of-economic-affairs/) (older interview; may be dated)
- Taiwanese wire-rod maker Yieh Hsing cited EU CBAM carbon-reduction requirements when raising wire-rod prices in February 2024. Taiwan fastener exports were about US$4.6 bn in 2023 — [Fastener World](https://www.fastener-world.com/en/article/2209.html); [Yieh](https://www.yieh.com/en/NewsItem/146322)
- Türkiye: the steel exporters' association TÇÜD held a CBAM conference at TİM (Dec 2024). The Aegean Ferrous and Non-Ferrous Metals Exporters Association said in April 2026 that CBAM default values fail to reflect Türkiye's low-carbon production structure. A Feb 2026 IPC–Mercator brief found limited CBAM impact on Türkiye because of its large recycled-steel (EAF) share. Türkiye's pilot ETS design (announced 3 Sep 2026) covers 2026-27 for power, cement, iron and steel, aluminium and fertiliser, with reporting only in 2026 and 100% free allocation — [CIB/TÇÜD](https://cib.org.tr/en/activities-conferences-the-eu-carbon-border-adjustment-mechanism-and-green-transformation-in-the-turkish-steel-industry-conference.html); [SteelOrbis](https://www.steelorbis.com/steel-news/latest-news/turkish-steel-sector-cbam-default-values-fail-to-reflect-low-carbon-production-1445161.htm); [IPC Sabancı brief](https://ipc.sabanciuniv.edu/Content/Images/CKeditorImages/20260204-13022277.pdf); [Life Climate](https://www.life-climate.com/en/blog/cbam-scope-expansion-impact-exporters-turkiye)
- A J-PAL project runs capacity-building with Turkish SMEs on emissions reductions — [J-PAL](https://www.povertyactionlab.org/node/8036673)

### Inferences
- Taiwan's pain is real and concrete: the 2,200 sub-50 t SMEs, the carbon-fee offset that only works with actual values, and the fastener chain. But the government's "以大帶小" approach means core firms (for example China Steel) push data down the chain bilaterally. A hackathon tool would compete with that plus commercial SaaS plus the EU registry.
- Türkiye has a strong "actual values beat defaults" incentive because it uses EAF/scrap steel. That makes the default mark-up argument persuasive there. But the IPC brief undercuts urgency ("limited effects, could even benefit").

### Gaps
- No official URL or feature list found for Taiwan's CBAM服務平台, the MOENV carbon-footprint calculation platform, or ITRI (工研院) tools. No specific TİM/İTO CBAM calculator found.
- The outcome of Taiwan–EU carbon-fee deduction talks (targeted for mid-2026) was not found.

---

## A4. Verdict on Idea A and sharpened gap

### Takeaway
As pitched, Idea A is mostly killed. The relay is commoditised (SaaS, Estainium, PACT/Catena-X, EU registry 2027), and the "double allocation of low-carbon output" premise conflicts with CBAM's average-SEE methodology. The surviving gap is narrow: (1) a tonnage-conservation check on reuse of a verified installation report across many declarants and downstream precursor users (anti-laundering/circumvention), plus (2) AI-assisted assembly of tier-2/3 SME data into the EU communication template for sub-50 t Taiwanese SMEs who still have to supply data.

### Cited Findings
- (see A1-A3)

### Inferences
- Sharpened gap statement: "Verified-report reuse ledger": each verified operator report becomes a capped quantity (t produced x SEE) that downstream declarants and precursor users draw down. The contract rejects draws beyond production, and the draw-down tracks CN code and period. This is the CBAM-legit form of "allocation conservation". It must be framed as complementing the CBAM Registry (which shares data but may not cap volume), with the honest caveat that the registry could add this.
- Weaknesses that remain: the EU can do this centrally (no need for blockchain once the registry exists); the trust anchor is the accredited verifier, not the chain; few judges will accept that mills want a public or consortium ledger of their output volumes.

### Gaps
- Whether the CBAM Registry already caps or reconciles volumes (decisive for the gap's survival).

---

## H1. Existing recycled-content mass-balance ledgers: do they already enforce conservation on a shared ledger?

### Takeaway
Yes, several. Circularise ran an ISCC PLUS pilot (2022) with 10 majors in which smart contracts "store balances, record transactions and apply mass balance rules" on a public chain, to make reuse of a sustainability claim "virtually impossible". SAP GreenToken tokenises mass-balance material (1 token = fixed mass; green vs. conventional tokens) with blockchain chain of custody and ISCC/REDcert support. TextileGenesis issues Fibercoins proportional to physical fibre shipments. The EU's own Union Database for biofuels is a regulator-run ledger built specifically to stop double claiming in mass-balance chains. Conservation enforcement on a shared ledger is solved prior art.

### Cited Findings
- Circularise–ISCC pilot (announced 13 Sep 2022): Asahi Kasei, Borealis, Neste, Trinseo, Shell, Arcelik, Philips DA, EVBox, Marubeni and Itochu. It ran on a public blockchain where smart contracts store balances, record transactions and apply mass-balance rules ("Every transaction is fully traceable"), making reuse of claim proofs "virtually impossible". ISCC "excited to have tested" it, with no formal adoption stated — [Circularise press release](https://www.circularise.com/press-releases/iscc-and-circularise-pilot-blockchain-technology/); [Neste](https://neste.com/news/iscc-and-circularise-pilot-blockchain-technology-with-10-companies-including-neste-to-complement-mass-balance-certification)
- Circularise clients include Asahi Kasei, Covestro, Domo, Marubeni, Mitsubishi Chemical, Neste, Philips DA and Porsche. It uses "Smart Questioning" based on zero-knowledge proofs and raised €11M (led by Brightlands, with Asahi Kasei and Neste) — [Ledger Insights](https://www.ledgerinsights.com/?p=25792). Circularise also runs webinars on ISCC mass-balance updates — [Circularise webinar](https://www.circularise.com/zh/webinars/streamlining-iscc-compliance-massbalance-updates)
- SAP Green Token: mass-balance management using tokenisation plus blockchain chain of custody (e.g. 100 kg = 100 tokens; green tokens = circular, red/none = conventional). Tokens move between wallets as material is sold. Part of the SAP Sustainability portfolio since Sep 2022. Supports ISCC, RSPO, REDcert and EUDR, with a 7-organisation pilot. Pilots include Mitsubishi Chemical Europe and DIC Corporation — [SAP News](https://news.sap.com/2023/07/greentoken-traceability-transparency-plastics/?amp=1); [SAP Green Token white paper](https://www.sap.com/documents/2023/06/ca44c9c2-7c7e-0010-bca6-c68f7e60039b.html); [The Recycler (DIC + SAP)](https://therecycler.com/?p=413235)
- TextileGenesis/Lenzing (Nov 2020): Fibercoin tokens issued "in direct proportion to the physical shipments" of TENCEL/ECOVERO fibres, GS1-based, linked to physical verification of fabric samples — [Textile World](https://www.textileworld.com/textile-world/fiber-world/2020/11/lenzing-creates-unprecedented-supply-chain-traceability-incorporating-lenzing-e-branding-fabric-certificates-and-blockchain-enabled-traceability-platform-powered-by-textilegenesis/)
- Other blockchain recycled-plastic traceability: Finboot + Plastic Energy + SABIC + Intraplas; Plastic Bank (tokens to collectors, blockchain transactions); Veolia (blockchain + RFID per batch); Japan BLUE Plastics (Asahi Kasei, IBM Japan); Project TRACKCYCLE (Recycling Technologies, TotalEnergies, Circulor; Innovate UK) — [Plastics Technology](https://ptonline.com/news/using-blockchain-to-track-and-verify-recycling); [K-Online](https://www.k-online.com/en/media_news/k-mag/plastics-in-practice/packaging/blockchain-traceability-recyclates); [J4CE](https://j4ce.env.go.jp/en/member/053); [NS Packaging](https://www.nspackaging.com/?p=128465)
- The EU Union Database for biofuels (UDB) was built to cover the full chain from feedstock collection to EU supply. It aims at "double-claiming fraud… when companies sell the same sustainability information more than once". All biofuels consumed in the EU must be registered regardless of origin — [EC UDB wiki](https://wikis.ec.europa.eu/display/UDBBIS/Union+Database+for+Biofuels+%28UDB%29+-+About); [Advanced Biofuels USA](https://advancedbiofuelsusa.info/a-new-era-for-biofuels-traceability-in-europe). Even with the UDB, Germany's UFOP blamed double counting of waste-based biodiesel/HVO for record-low blending (3.9% in Nov 2024) and called for full-chain UDB registration and on-site inspections — [UFOP](https://ufop.de/english/news/biodiesel-admixture-reaches-all-time-low)
- ISCC PLUS already requires site-specific certification, chain-of-custody and mass-balance controls, with a voluntary "Fuel-use excluded" add-on (002) — [Net Zero Compare](https://netzerocompare.com/policies/iscc-plus-certification); [SABIC ISCC PLUS certificate 2025](https://sabic.com/en/Images/ISCC_PLUS_certificate_SABIC%20Petrochemicals_2025_tcm1010-47156.pdf)

### Inferences
- "A smart contract enforces input ≥ output x ratio" is a well-trodden pattern. Circularise, SAP and Finboot already do it commercially, and the EU runs a regulator ledger for the biofuel analogue. The UDB/UFOP case shows a ledger does not end fraud at the origin, where waste is declared.
- Not checked individually: RecyClass, REDcert², Eastman, SABIC TRUCIRCLE, rePurpose, Empower, Topl, Haelixa. Haelixa (DNA markers) and isotope testing are physical-verification approaches that complement ledgers.

### Gaps
- Current (2025-26) production status of the Circularise ISCC credit system and SAP GreenToken customer count not found.
- ISCC PLUS 2025/2026 rule text (credit transfer between sites, free attribution limits) not retrieved.

---

## H2. Is the remaining problem a POLICY choice (allocation rules) rather than data integrity?

### Takeaway
Largely yes. ProPublica's "20-30% recycled with <1% actual content" is not a ledger-integrity failure. It is mass balance working as designed under free-attribution rules. The fix is a rule choice (fuel-exempt vs. free allocation, no re-attribution between sites, measured-by-weight), which the EU made by regulation in Feb 2026 and the US EPA made for Safer Choice in 2024. The documented data-integrity pain is different: physical mislabelling of virgin plastic as recycled in imports, which the EU attacks with documentation, customs codes, plant audits and lab testing. A ledger cannot detect that by itself.

### Cited Findings
- ProPublica: mass balance lets plastics be advertised as 20% or 30% recycled even if they physically contain under 1%, a "number shuffle, done only on paper". The EPA's updated Safer Choice standard (8 Aug 2024) requires ≥15% PCR measured by weight, effectively excluding mass balance. ExxonMobil internal documents cited in California's lawsuit: process yields <0.1% recycled content, cups marketed as 30% — [ProPublica](https://www.propublica.org/article/epa-rejects-mass-balance-plastics-recycling-safer-choice); [ProPublica on Exxon](https://www.propublica.org/article/exxonmobil-plastics-recycling-pyrolysis-lawsuit-california); [Grist on Mondelez/Triscuit](https://grist.org/accountability/recycled-packaging-triscuit-mondelez-mass-balance-chemical-recycling/)
- EU SUPD implementing decision on chemically recycled PET content: approved by the TAC committee on 6 Feb 2026. It uses a fuel-use-exempt approach, with free allocation allowed for remaining tonnage under conditions, and keeps the ban on re-attribution between facilities and companies. It adds "calculation points". The Commission intends it as a model for packaging, automotive and textiles. Zero Waste Europe opposes the fuel-exempt mass balance. Recycled PET imports count only from 21 Nov 2027 — [Recycling Magazine](https://www.recycling-magazine.com/2025/07/14/eu-commission-sets-out-chemical-recycling-mass-balance-accounting-approach/); [S&P Global](https://www.spglobal.com/energy/en/news-research/latest-news/chemicals/020926-eu-approves-targets-for-chemical-recycling-content-for-plastic-bottles); [renewable-carbon.eu](https://renewable-carbon.eu/news/?p=173953); [Packaging Insights](https://www.packaginginsights.com/news/eu-supd-chemical-recycling-pet.html)
- Physical fraud: the Commission says cheap virgin plastic is "being mislabelled as recycled". It plans stricter documentation for recycled-plastic imports (H1 2026 legal proposal), separate customs codes for recycled vs. virgin, EU audits of recycling plants including outside the EU, support for labs testing whether shipments are genuine, and an import surveillance task force in 2026. Plastics Recyclers Europe says imports "often come with fraudulent claims due to the lack of transparency in the origin of materials" and warned of "imminent collapse" in Aug 2025 — [Circular Online](https://www.circularonline.co.uk/news/eu-plans-tighter-checks-on-plastic-imports-to-support-recycling-industry/); [PlasticsToday](https://www.plasticstoday.com/legislation-regulations/europe-s-plastics-recycling-industry-faces-imminent-collapse-); [IOM3](https://www.iom3.org/resource/import-controls-needed-to-stem-crisis-in-eu-plastics-recycling.html)
- Only PRE and the Commission assert the scale of mislabelling; I found no independent quantification — (search summary)

### Inferences
- Idea H's headline motivation (ProPublica) argues against a mass-balance ledger. A perfectly conserved ledger under free-attribution rules still produces "30% recycled" cups with <0.1% physical content. If the team pitches conservation as the fix for ProPublica's finding, informed judges will object.
- The real, current, documented pain is physical-origin fraud on imported recyclate (virgin passed as PCR). The EU is building audits, customs codes and lab testing for it. The integrity gap is the oracle problem (proving the input was really post-consumer waste), which a smart contract cannot solve. AI anomaly detection on weighbridge/invoice data plus lab results (isotope/DNA/spectroscopy) is the defensible part of Idea H.
- A configurable allocation-rule engine (EU SUPD fuel-exempt with calculation points vs. ISCC free attribution vs. EPA by-weight), showing the same physical flows yielding different claimable percentages, would be honest and educational. Its value is transparency, not something blockchain uniquely enables.

### Gaps
- Final Official Journal publication and application date of the SUPD implementing decision not confirmed.
- Whether the Commission's H1 2026 import-documentation proposal was actually tabled was not verified.

---

## H3. Türkiye zero-waste specifics

### Takeaway
Türkiye has real, documented traceability pain. It is the largest destination for EU plastic waste (record imports in 2025), there is a history of imported waste being dumped or burned instead of recycled, and an estimated 500,000 informal waste pickers collect most recyclables with no legal recognition. A national deposit return system (DOA) launched on 1 July 2026, run by TÜÇA on Emlak Katılım and Darphane infrastructure, not TÜGEM. A state digital tracking system therefore already exists for beverage containers.

### Cited Findings
- EU plastic waste exports to Türkiye rose 19% in 2025 to a record ~503,000 t, per a Greenpeace Türkiye report. TurkStat reportedly shows ~699,000 t of total plastic-waste imports in 2025. The figures conflict, partly because of scope (EU-only vs. all origins) — [bianet](https://bianet.org/haber/turkey-s-plastic-waste-imports-from-eu-countries-hit-record-high-in-2025-320400)
- The government says only clean, recyclable plastic waste is allowed and that rejected loads are returned — [İletişim Başkanlığı statement](https://www.iletisim.gov.tr/english/haberler/detay/statement-on-guardians-news-article-titled-turkiye-said-it-would-become-a-zero-waste-nation). Journalists and NGOs document burning and dumping. The 2020 BBC GPS-tagged bags ended up dumped in Adana — [Stockholm Univ. Institute for Turkish Studies](https://www.su.se/english/divisions/institute-for-turkish-studies/about-the-institute/european-waste-trade-with-turkey-roadmap-to-sustainability-or-a-false-promise); [Duvar English](https://www.duvarenglish.com/uk-recyclables-exported-to-turkey-burned-dumped-instead-news-57514). Türkiye banned mixed plastic waste imports from early 2021 — [The Recycler](https://therecycler.com/posts/turkey-bans-the-import-of-plastic-waste/)
- About 500,000 informal waste pickers are estimated to collect about 80% of recyclables, with no official data. They are excluded from environmental legislation. Sokak Atık Toplayıcıları Derneği lobbies for professional recognition. The 2022 formalisation drive reportedly made life harder for them, with raids and detentions of refugee workers — [Duvar English](https://www.duvarenglish.com/undervalued-and-unrecognized-turkish-waste-pickers-at-mercy-of-formal-recycling-sector-news-56700); [Waste & Recycling Mag, Aug 2026](https://wasterecyclingmag.ca/policy-regulation/turkeys-plan-to-recycle-more-has-made-life-hard-for-its-informal-waste-pickers)
- DOA (Depozitosu Olan Ambalajlar) launched nationwide on 1 July 2026 across 81 provinces. It pays 1 TL per plastic, glass or aluminium container, uses return machines (DİM) and a mobile app with digital tracking, and an e-wallet via Türkiye Emlak Katılım Bankası. Sellers register in DBYS (dbys.gov.tr, run by Darphane). Day one saw long queues and machines not yet installed — [CNBC-e](https://www.cnbce.com/haberler/depozitosu-olan-ambalajlar-uygulamasi-1-temmuzda-basliyor-depozito-bilgi-yonetim-sistemi-dbys-nedir-h29643); [Milliyet](https://www.milliyet.com.tr/galeri/depozito-iade-ucreti-ne-kadar-nasil-alinir-doa-depozitosu-olan-ambalajlar-uygulamasi-ile-ucret-iadesi-alma-7615481); [DBYS legal notice](https://dbys.gov.tr/yasal-uyarilar-kvkk)

### Inferences
- "Token rewards for waste pickers" is crowded (see H5) and politically sensitive, given formalisation raids and refugee workers. Wallets or KYC could expose vulnerable people.
- DOA already provides state-run digital tracking for beverage containers, so a hackathon ledger for PET bottles in Türkiye duplicates government infrastructure.
- The more defensible Türkiye angle: imported-scrap-to-recyclate conversion yield. Imported tonnes (customs) → sorted → pellets out → claims sold downstream, with AI anomaly flags where output claims exceed plausible yield. This is the gap between "clean recyclable imports" (government claim) and dumping (NGO evidence).

### Gaps
- No source tying informal pickers to recycled-content fraud.
- COP31 "Zero Waste flagship" framing not verified in this research.
- Sıfır Atık Bilgi Sistemi (zero-waste information system) data quality was not researched.

---

## H4. Verdict on Idea H and sharpened gap

### Takeaway
As pitched, Idea H is mostly killed. Ledger-enforced mass-balance conservation exists (Circularise+ISCC, SAP GreenToken, TextileGenesis, EU UDB analogue). The headline harm (ProPublica) comes from allocation policy, not data integrity, and the EU fixed the rules by regulation in Feb 2026. The surviving gap is the physical-truth oracle: linking ledger credits to evidence that the input really was post-consumer waste (weighbridge, yield plausibility, lab test results). That is exactly where the EU is now investing (lab checks, audits of non-EU plants, customs codes).

### Inferences
- Sharpened gap statement: "Yield-plausibility + lab-evidence gate": recyclate credits can be minted only when (a) inbound waste tonnage from weighbridge/customs records, (b) a process-yield model (AI flags outputs above physically plausible yield for that polymer and process), and (c) a sampled lab result (spectroscopy/isotope/marker) all agree. Run it under a selectable rule set (EU SUPD fuel-exempt / ISCC free attribution / by-weight). Blockchain's role is minor: cross-company no-double-claim, which incumbents already provide. The value is in the evidence gate and the rule comparison.
- Honest risk: judges may see this as Circularise/SAP GreenToken plus an anomaly model.

---

## H5 / A5. How many hackathon projects did similar things?

### Takeaway
I could not get a reliable count; search engines index Devpost, ETHGlobal and DoraHacks poorly. CBAM + blockchain hackathon entries are few but exist (at least 3 found in 2025-26). Recycling + blockchain/token hackathon entries are very common; likely dozens across platforms, mostly "token rewards for recycling" or "QR trace plastic". Few I found do mass-balance conservation specifically.

### Cited Findings
- CBAM-related: CarbonLot (MCP Hackathon 2026, Manufacturing & Industry 4.0 track) checks supplier verified data, falls back to EU defaults and drafts declarations — [glama.ai](https://glama.ai/mcp/servers/toi59fm59g). C-PASS won the "Go Digital" category at a GIIA Hackathon, a CBAM compliance digital solution — [BHFF](https://www.bhfuturesfoundation.org/news/2026/4/3/bhff-scholars-driving-green-innovation-from-hackathon-idea-to-industry-solution). CarbonCast (GitHub; Hana Financial youth programme) pairs AI estimation with blockchain tracking for CBAM — [GitHub soccz/CBAM](https://github.com/soccz/CBAM). An article titled "Carbon Meets Code: Reinventing CBAM Through Blockchain" — [IMPRI](https://www.impriindia.com/?p=63675)
- Recycling: "Plastic Trace" (Flow Forte Hacks: QR + smart contracts + token rewards to collectors + city audit data) — [HackQuest](https://hackquest.io/en/projects/Forte-Hacks-by-Flow-Build-with-Disney-Dune-and-Dapper-Plastic-Trace). "Token-based rewards for recycling" (Solidity/React) — [HackQuest](https://hackquest.io/projects/Token-based-rewards-for-recycling)

### Inferences
- Estimate (low confidence): recycling-token/traceability hackathon projects number in the dozens to 100+ across Devpost, ETHGlobal, DoraHacks, HackQuest and Hedera events since 2018. CBAM-specific blockchain projects are probably under 20. Mass-balance conservation contracts are rarer still, but enterprise prior art (Circularise, SAP) makes novelty claims weak.
- Differentiation for A should avoid "CBAM + blockchain + AI declaration drafting", which CarbonLot and CarbonCast already cover. Differentiation for H should avoid "tokens for pickers" and "QR trace".

### Gaps
- Systematic counts would require direct Devpost/ETHGlobal/DoraHacks searches, which these tools could not do; no Hedera-specific recycling or CBAM project was found in search results.
