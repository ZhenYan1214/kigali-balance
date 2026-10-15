# New Candidate Problem Areas for a Blockchain + AI Climate Project (IEEE ClimateChain 2026 / COP31)

Scope note: 16 search/fetch calls. Candidates 1 (F-gas) and 2 (waste methane) were researched in depth. Candidates 3–7 got lighter checks. Anything not verified with a source is in Inferences or Gaps. Date context: 2026-10-14.

## Q1. HFC refrigerant / F-gas lifecycle and illegal trade: is it a strong candidate?

### Takeaway
Yes. This is the strongest underexplored candidate found. It has a large quantified impact, named victims, live 2024–2026 regulation in both the EU (2024/573) and Türkiye (Oct 2024 regulation, FARAVET quota system, EKOMVET operator registry), and a real multi-party distrust problem: importers, distributors, technicians, operators, reclaimers, destroyers, customs and credit buyers. Current tracking tools are centralized vendor software, and the search found no ledger-based or DPP-style refrigerant tracking. The weak point is that the search did not confirm the commonly quoted "20–30% of the EU market is illegal" figure. Use EIA's 2026 Italy findings and the 2024 seizure trend instead.

### Cited Findings
**Impact**
- Project Drawdown puts "refrigerant management" (leak control plus end-of-life recovery and destruction) at about 57.15 GtCO2e avoided over 2020–2050. The figure assumes all avoidable leaks are prevented. Drawdown estimates a net lifetime cost of about US$623B, because recovery and destruction costs exceed resale revenue. This is a market-failure signal: the activity needs a payment mechanism such as credits or EPR. — [Project Drawdown](https://drawdown.org/solutions/refrigerant-management)
- An older Drawdown scenario gave 89.7 Gt, assuming 87% containment. The two figures come from different model versions, so cite the current 57 Gt. — [Tennent Brown summary](https://tennentbrown.co.nz/news/1-refrigerants)
- Yale Carbon Containment Lab estimates that lifecycle refrigerant management could mitigate about 91 GtCO2e by 2100. It says commercial refrigeration can leak up to 25% per year, and very little refrigerant is recovered at end of life, especially from residential and small commercial equipment. — [Yale CCL comments on AIM Act Subsection H](https://carboncontainmentlab.yale.edu/documents/carbon-containment-lab-comments-subsection(h)-final.pdf)
- Drawdown's separate "alternative refrigerants" solution is 42.7–48.8 Gt. Do not add it to the 57 Gt, because the two overlap. — [Drawdown](https://drawdown.org/solutions/alternative-refrigerants)

**Pain / named victims (illegal trade)**
- EIA's report *Fakes, Fraud and F-Gases* (April 2026), based on a 2025 investigation in Italy, says illegal HFCs reach Italy through organised crime networks. It says they enter manufacturing, supermarket and state railway supply chains, and cost legitimate suppliers hundreds of millions of euros a year. Industry associations claim nearly half the refrigerant on the Italian market is illegal. EIA itself says estimating the scale is difficult. — [EIA report PDF](https://eia-international.org/wp-content/uploads/2026-EIA-Fakes-Frauds-and-F-Gases-SPREADS.pdf); [EIA news](https://eia-international.org/news/we-expose-illegal-refrigerant-trade-in-europe-the-biggest-eco-crime-no-ones-heard-of/)
- Reported smuggling routes run through weaker-enforcement states such as Bulgaria and Romania, and from Albania into Greece (arrests of a criminal organisation). In Poland, customs at the Belarus border found modified LPG cylinders holding R-404A and R-134a. EU seizures nearly tripled between 2023 and 2024. Globally, more than 320 illegal-trade cases in 18 countries (over 751 t of controlled substances) have been reported under the Montreal Protocol's voluntary system since April 2025. — [Refindustry summary of EIA briefing](https://refindustry.com/news/eia-reports-refrigerant-smuggling-cases-ahead-of-montreal-protocol-meeting/). Note: Refindustry's dates are internally inconsistent, so check against the EIA PDF before quoting.
- EIA's 2019 *Doors Wide Open* found that customs could not tell whether a given HFC shipment was within quota. — [EIA 2019](https://eia-international.org/wp-content/uploads/EIA-report-Doors-Wide-Open-print-version.pdf)

**Regulatory hook: EU**
- Regulation (EU) 2024/573 entered into force on 11 Mar 2024. Articles 23–24 cover trade control and illegal trade. From 3 Mar 2025, customs must share clearance data with the F-gas Portal through the EU Single Window (CERTEX). Customs must check quota or authorisation before releasing an import, and must confiscate unlawful goods. — [fluorocarbons.org](https://www.fluorocarbons.org/illegal-hfcs/regulation/); [fluorocarbons.org round-up](https://www.fluorocarbons.org/news/illegal-trade-round-up-5/)
- Operators of equipment holding 5 tCO2e or more must keep records for at least 5 years. The records cover the equipment, refrigerant type, charge, and servicing, including which company and technician did the work. — [MSA overview](https://emeablog.msasafety.com/article/refrigerant-tracking-and-compliance-software-an-overview-for-the-european-market-2/)
- Containers must come with evidence of a binding return-for-refill arrangement (Art. 11(4)). Illegal bulk imports typically use non-refillable cylinders. — [Luxembourg customs CERTEX guidance](https://douanes.public.lu/content/dam/douanes/fr/prohibitions-restrictions/certex/certex-enforcement-fgas-regulation-eo-guidelines.pdf); [fluorocarbons.org](https://www.fluorocarbons.org/?p=14384)

**Regulatory hook: Türkiye**
- Türkiye's *Florlu Sera Gazlarına İlişkin Yönetmelik* was published in Resmî Gazete No. 32693 on 15 Oct 2024. It covers labelling, data collection, leak checks, placing on the market, import/export, quota allocation, and recovery, recycling, reclamation and destruction. HFC import phase-down runs from 2024 to 2045. — [alomaliye (Resmî Gazete summary)](https://www.alomaliye.com/2024/10/15/florlu-sera-gazlarina-iliskin-yonetmelik/); [erdem-erdem law firm](https://www.erdem-erdem.av.tr/bilgi-bankasi/florlu-sera-gazlarina-iliskin-yonetmelik)
- HFC import quotas run through the ministry's FARAVET system: applications close 31 May and quotas are announced by 30 Sept. A quota circular (2025/1) also exists. Operators of equipment with 5 tCO2e or more, and SF6 switchgear with 6 kg or more, must register in EKOMVET. ODS imports were banned from 1 Jan 2025. — [ÇŞİDB Ozon Türkiye regulation deck](https://webdosya.csb.gov.tr/db/ozonturkiye/haberler/1.-florlu-sera-gazlarina-il-sk-n-yonetmel-k-20250627154853.pdf); [2026 National Ozone Unit deck](https://webdosya.csb.gov.tr/v2/ozonturkiye/2026/02/ulusal_ozon_birimi_calismalari_VP-20260213150241.pdf)
- The Turkish ministry held an F-gas customs training in Feb 2026 that used EU F-gas Portal / CERTEX material. This suggests active interest in customs-side enforcement. — [Customs training deck](https://webdosya.csb.gov.tr/v2/ozonturkiye/2026/02/2026_02_03_Customs-training_F-gases_TR_JM-1-20260213144508.pdf)

**Credits for recovery and destruction (a second market with double-claim risk)**
- Recoolit (Indonesia, since 2021) pays technicians about IDR 50,000 (about $3) per kg of recovered refrigerant. It destroys the gas in a government-approved cement kiln or incinerator and sells credits directly at about $75 per tonne. It uses a Yale Carbon Containment Lab methodology rather than a major registry. Canisters are sampled and tested at the only qualified lab in the region, in Malaysia. — [Malay Mail / AFP, Jul 2025](https://malaymail.com/news/life/2025/07/11/in-indonesia-a-start-up-captures-air-conditioning-coolants-to-stop-global-warming/183487)
- A US developer and a Chilean facility have shipped ODS to France for destruction, aiming for ICVCM-labelled credits. — [Carbon Pulse, Feb 2024 (paywalled)](https://carbon-pulse.com/256372/)
- HFCs are ineligible under the major registry ODS protocols, and Yale CCL has proposed revising Verra VM0016. — [Yale CCL white paper](https://carboncontainmentlab.yale.edu/documents/yale-cc-lab-hfc-methodology-white-paper-may-2023-draft.pdf)
- History of over-crediting: HFC-23 CDM projects. CDM Watch (2010) found that 19 projects accounted for about half of credits issued. A later RFF study found both over- and under-crediting. — [Carbon Market Watch 2010](https://carbonmarketwatch.org/wp-content/uploads/2010/06/hfc-23_press-release_gaming-and-abuse-of-cdm1.pdf); [Carbon Pulse on RFF](https://carbon-pulse.com/?p=14329)

**Existing solutions and gaps**
- Commercial tools are centralized: MSA Parasense (Refrigerant Bank and Bottles), Refcom cylinder check-in/out, A-Gas Gas-Trak barcode scanning. The search found no blockchain-based refrigerant cylinder tracking or F-gas DPP, and no regulator ledger pilots. The only blockchain paper found covers refrigerated shipping containers, not refrigerant. — [MSA](https://emeablog.msasafety.com/article/refrigerant-tracking-and-compliance-software-an-overview-for-the-european-market-2/); [Cooling Post](https://www.coolingpost.com/uk-news/new-software-can-track-any-cylinder/); [ACM paper](https://doi.org/10.1145/3532640.3532653)

### Inferences
- **Why a ledger is justified (conservation structure).** A kilogram of HFC is a conserved quantity. The kg imported under a quota should equal the kg charged into equipment plus the kg in stock, minus leaks, recovered kg and destroyed kg. Many mutually distrustful parties each hold a piece of this balance: importer (quota), distributor, technician (charge and recover logs), operator (EKOMVET/F-gas records), reclaimer, destruction facility (kiln), credit buyer, and customs. A shared ledger with per-cylinder tokens that are minted against quota, transferred between parties, and burned at destruction directly prevents three problems: (a) cylinders that never had quota (illegal entry); (b) the same destroyed kg being claimed as a credit twice, or credited and also resold; (c) the "same cylinder ID reused" fraud pattern. This fits the "double-claim / multi-party distrust" criterion better than most energy-trading ideas.
- **The AI role is concrete:**
  - Mass-balance anomaly detection on technician and operator records, for example a site that tops up again and again (a leak at up to 25% per year) or a distributor whose sales exceed its quota-backed inflow.
  - Leak-rate prediction from IoT pressure, temperature and compressor data in supermarket racks. Supermarkets are named EIA victims, and the data ties to judges' interest in IoT and battery/energy AI.
  - Cylinder or label image verification (counterfeit cylinders, illegal non-refillable ones).
  - Gas-composition (lab result) consistency checks before credits are minted.
- **Judge fit:** PQC signatures on cylinder or IoT attestations (long-lived equipment records; the 2045 phase-down horizon). It also fits DPP: an F-gas "equipment passport" linked to the EU ESPR/DPP direction (an inference; the search found no explicit F-gas DPP plan). IoT traceability fits too.
- **Türkiye angle:** Türkiye sits next to documented smuggling corridors (Bulgaria, Romania, Greece via Albania) and runs FARAVET and EKOMVET as separate silos. A demo that links quota (FARAVET), equipment (EKOMVET) and customs data on a permissioned ledger, aimed at the Kigali phase-down, is locally credible. Whether Türkiye itself is a transit route was not established.
- **Novelty:** high. The search found no hackathon or ledger projects in this space.

### Gaps
- No primary source was found for "20–30% of the EU HFC market is illegal." The search found only the Italian industry claim of nearly 50% and the statement that seizures tripled. Absolute EU 2024 seizure tonnage was not found.
- Türkiye's own illegal-trade data and its possible role as a transit route were not found.
- Whether an EU DPP will cover refrigerants or HVAC equipment was not verified.
- Recoolit's credit volumes and any independent integrity rating were not found. Calyx Global has an ODS integrity piece (Dec 2025) that was not read.

## Q2. Waste-sector methane (COP31 Zero Waste flagship): is there a ledger + AI gap?

### Takeaway
This candidate aligns best with COP31. Waste methane was ranked first in Türkiye's draft action agenda and is the second theme of the final 10-theme agenda. There is hard evidence of a measured-versus-modelled gap, and two Turkish landfills are named in the 2025 global top-25 satellite super-emitters. The ledger justification is moderate. It is strongest when framed as reconciling modelled inventories with satellite observations and paying verified diversion or capture results (results-based finance and credits, without double counting between city, operator and NDC). Hackathon teams do tackle "waste" often, but usually as recycling apps. Landfill-methane MRV is much rarer.

### Cited Findings
- Türkiye's draft COP31 action agenda (Feb 2026) listed 14 priorities, with "rapid reduction of waste-derived methane" ranked first. It calls for measurable zero-waste results before 2030, stronger MRV systems, organic diversion, better landfill gas capture, and clean-up of super-emitters. CATF's Kait Siegel called for better waste emissions data, monitoring, satellite remote sensing and funding. Türkiye imports large volumes of EU waste, and significant volumes are landfilled or burned in the open. — [Climate Home News, 13 Feb 2026](https://www.climatechangenews.com/2026/02/13/turkiye-prioritises-cleaning-up-garbage-emissions-in-cop31-action-agenda/)
- The final Action Agenda was launched at UNGA on 21 Sept 2026 with 10 themes. "Zero Waste and Methane Reduction" is the second. — [Daily Sabah](https://www.dailysabah.com/turkiye/turkiyes-cop31-action-agenda-sets-energy-waste-targets-for-2035/news); [Eco-Business](https://www.eco-business.com/news/at-a-turkish-waste-plant-cop31s-case-for-climate-action-goes-beyond-fossil-fuels/)
- Türkiye has 94 sanitary landfill and sorting facilities. Some waste-to-energy projects are approaching the end of their renewable support (YEKDEM) periods. The Zero Waste Forum (Istanbul, June 2026) drew more than 120 ministers from 183 countries. — [Eco-Business](https://www.eco-business.com/news/at-a-turkish-waste-plant-cop31s-case-for-climate-action-goes-beyond-fossil-fuels/)
- The waste sector accounts for about 20% of anthropogenic methane. Landfill super-emitters emit more than 6.1 Mt of CH4 per year. Operators usually model emissions from assumed waste quantities, decay rates and collection efficiency, and satellites can refine those estimates. In the UCLA/Carbon Mapper 2025 top-25 ranking, Şile (İSTAÇ, Istanbul Metropolitan Municipality) is 24th at 3.8 t/hr and Menemen/Harmandalı (İzmir Metropolitan Municipality) is 25th at 3.6 t/hr. CATF recommends putting satellite data into LDAR, MMRV and inventories, and funding verified mitigation. — [CATF, May 2026](https://www.catf.us/2026/05/satellites-super-emitters-smarter-waste-policy/); [UCLA Emmett STOP Methane](https://law.ucla.edu/academics/centers/emmett-institute-climate-change-environment/announcing-ucla-emmett-institutes-stop-methane-project/spotlight-top-25-plumes-25-landfills)
- Carbon Mapper flew over more than 250 US landfills and found plumes at over half. It found that 60% of point sources persisted for months or years, and suggested that current models underreport. EPA's listed causes include poor cover maintenance, insufficient well vacuum, and drought cracks. — [Waste Dive](https://www.wastedive.com/news/carbon-mapper-landfill-study-point-source-methane-plumes/711737/)
- LOW-Methane (launched at COP29) aims to cut at least 1 Mt CH4 per year from waste before 2030 and unlock up to $10B across up to 40 jurisdictions. Its data strategy combines satellites, ground inventories and models; it is not a formal verification system. The COP29 Declaration on Reducing Methane from Organic Waste was signed by more than 30 countries covering about 50% of organic-waste methane. — [RMI](https://rmi.org/cop29-brings-historic-commitments-to-reduce-methane-from-organic-waste); [CCAC](https://www.ccacoalition.org/news/lowering-organic-waste-methane-initiative-supports-global-methane-pledge-cop29-declaration-reducing-methane-organic-waste); [WRI](https://www.wri.org/news/statement-more-30-countries-commit-tackle-methane-organic-waste)
- A COP30 initiative backed by Global Methane Hub targets a 30% cut in organic-waste methane by 2030 across 25 cities. It includes integrating waste workers into the circular economy. — [Climate Home News](https://www.climatechangenews.com/2026/02/13/turkiye-prioritises-cleaning-up-garbage-emissions-in-cop31-action-agenda/)

### Inferences
- **Ledger justification:** The parties are municipality, landfill operator (for example İSTAÇ), gas-to-energy operator, the YEKDEM / renewable certificate registry (YEK-G), the national inventory, and credit or results-based finance funders. The same tonne of captured methane can be claimed (a) as a landfill-gas credit, (b) as renewable electricity through YEK-G or I-REC, (c) towards the municipal zero-waste target, and (d) in the NDC. That is a genuine double-claim structure. Organic diversion upstream, from households and markets to compost, adds another claimant layer. A ledger that issues one "verified avoided-tCH4" attestation, split into explicitly labelled claim types, is defensible.
- **AI role:**
  - Fuse satellite plume data (Carbon Mapper, EMIT, Tanager) with first-order-decay model outputs to flag sites where reported capture is not plausible.
  - Use computer vision on waste-composition images to estimate the organic fraction.
  - Forecast landfill gas flow.
- **Weaknesses:** Satellite plume detection is intermittent. A hackathon demo would rely on public Carbon Mapper data plus simulated site data. The ledger is less essential than in the F-gas case, because a regulator-run database could do most of it. Waste is a popular hackathon theme, so differentiation must come from methane MRV and claim reconciliation, not from recycling rewards.
- **Novelty:** medium-high for the methane-MRV framing, low for generic "zero waste" apps.

### Gaps
- No Türkiye-specific landfill gas capture statistics or Sıfır Atık program data were retrieved.
- Whether the Turkish super-emitter sites are reported in Türkiye's national inventory was not found.
- The final Action Agenda's numeric waste targets were not found (Daily Sabah headline mentions 2035 targets; not fetched).
- No existing digital MRV vendors for landfill gas (for example dMRV platforms) were checked.

## Q3. Other candidates (3–7): verify or reject

### Takeaway
- **Biofuel/UCO certification fraud** (an added candidate): strong evidence of a pain point and a live EU database. It overlaps with existing EU infrastructure (the Union Database) and is less COP31-aligned.
- **SAF book-and-claim:** gap is real but crowded (several registries, plus IATA working on interoperability). Weak novelty.
- **Post-earthquake debris:** large numbers and strong local relevance to Türkiye. The ledger justification is weak, and the climate quantification is thin.
- **SF6 switchgear:** credible underreporting evidence, and it rides on the same Türkiye EKOMVET registry, so treat it as an extension of candidate 1 rather than a standalone.
- **Bovaer and agricultural insetting:** a plausible double-claim structure, but the search found no documented double-counting case.
- **Green hydrogen / RFNBO, rice methane, cement, cold chain:** not verified in this pass.

### Cited Findings
**Biofuel / UCO fraud (added candidate)**
- In July 2025 the European Commission concluded its review of Germany's 2023 complaint about Chinese "advanced" biodiesel. It found "systemic weaknesses in the way certification audits have been conducted," but could not confirm fraud. A working group is revising implementing rules, planned for early 2026. The Commission considers mandatory use of the Union Database (UDB) by all operators to be the precondition for success. — [European Commission, 18 Jul 2025](https://energy.ec.europa.eu/news/commission-concludes-examination-potential-chinese-biofuel-imports-fraud-2025-07-18_en)
- ISCC carried out unannounced audits in China and withdrew or suspended 7 certificates. A USDA report alleged that virgin palm oil from Indonesia was relabelled as UCO via China; Neste disputes this. — [Biofuels Digest](https://biofuelsdigest.com/iscc-continues-to-monitor-chinese-uco-for-potential-fraud/); [Fastmarkets](https://fastmarkets.com/insights/neste-challenges-usdas-uco-fraud-claims)

**SAF book-and-claim**
- IATA and GHG Protocol logic accept a Scope 1 claim (airline) and a Scope 3 claim (corporate buyer) on the same SAF. The registry must prevent double claims within the same scope. RSB's registry does not track the airline's further allocation of Scope 3 to passengers. 123Carbon and IATA are partnering on registry interoperability. — [IATA SAF accounting policy](https://www.iata.org/contentassets/5499da2b3b7d46b3b13be4dad54a9689/saf-accounting-policy-paper_20230905_final.pdf); [A4A Nov 2024](https://airlines.org/wp-content/uploads/2024/12/A4A-Views-on-SAF-Accounting-Book-and-Claim-Rev-November-2024-Clean.pdf); [SAF Investor / 123Carbon](https://www.safinvestor.com/opinion/147370/123carbon/)
- The Aviation Environment Federation (Aug 2025) warns that Scope 1 plus Scope 3 claims may overstate savings. It also notes that international-flight reductions sit outside NDCs yet can appear in corporate Scope 3. — [AEF](https://www.aef.org.uk/?p=17931)
- ICAO's 2025 environmental report lists registry-to-registry data exchange as a desired feature. — [ICAO Env Report 2025](https://www2023.icao.int/environmental-protection/Documents/EnvironmentalReports/2025/Envreport2025_52.pdf)

**Post-disaster debris (Türkiye, Feb 2023)**
- UNDP (Aug 2024) estimates more than 100 million m³ of debris (about 200 Mt) from more than 313,000 ruined buildings. Two model processing facilities in Hatay and Kahramanmaraş are funded by Japan (JPY 700M). Debris still sat at 86 temporary storage sites. — [UNDP Türkiye](https://www.undp.org/turkiye/press-releases/undp-builds-two-model-facilities-process-and-recycle-earthquake-debris-turkiye)
- There are asbestos concerns because pre-2010 buildings predate Türkiye's asbestos ban. — [Teyit](https://en.teyit.org/in-depth/in-the-first-year-following-the-february-6-earthquakes-ii-emerging-challenges-from-the-debris)
- A case study modelled using 35% recycled concrete waste (1,519.89 t) in a building. It found a 27.5% cut in carbon and a 9.13% cut in material cost. — [MDPI Buildings 14(4):948](https://www.mdpi.com/2075-5309/14/4/948)

**SF6 in switchgear**
- Atmospheric measurements suggest the US EPA inventory underestimates SF6 by up to 250%, pointing to underreporting by the electric power and manufacturing industries. — [NOAA CPO](https://cpo.noaa.gov/?p=1663)
- China's SF6 emissions rose from 2.6 to 5.1 Gg per year between 2011 and 2021. Western regions with heavy power transmission contribute significantly. — [Nature Communications 2024](https://link.springer.com/10.1038/s41467-024-46084-3)
- A German inverse-modelling study (Dec 2025) found an unaccounted industrial SF6 source in southern Germany. Switchgear accounts for about 10.6% of Germany's reported 2022 SF6 emissions. — [PMC article](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12706706/)
- A vendor (Eaton) claims lifecycle leaks of up to 15%; this is biased. — [Electricity Forum](https://electricityforum.com/news/sf6-europe)
- Türkiye requires switchgear with 6 kg or more of SF6 to register in EKOMVET. — [ÇŞİDB deck](https://webdosya.csb.gov.tr/db/ozonturkiye/haberler/1.-florlu-sera-gazlarina-il-sk-n-yonetmel-k-20250627154853.pdf)

**Bovaer / livestock insetting**
- Elanco describes consortia of Scope 3 beneficiaries splitting the cost of Bovaer. It admits "ambiguity" about how methane reductions will be accounted for, which slows adoption. A Brazil pilot explores carbon credits as an alternative funding source. — [AgFunderNews](https://agfundernews.com/bovaer-is-creating-a-self-sustaining-carbon-inset-market-for-american-agriculture-says-elanco)
- SBTi Corporate Net-Zero Standard V2.0 (June 2026) creates structured ways to share Scope 3 reductions across the value chain. This description is from dsm-firmenich, a vendor. — [dsm-firmenich](https://www.dsm-firmenich.com/en/businesses/taste-texture-health/news-events/articles/dairy/sbtis-net-zero-standard-new-opportunities-for-dairy-and-beef-companies.html)

### Inferences
- **UCO/biofuel:** This is a textbook conserved-quantity, multi-party-distrust problem (collector → aggregator → trader → refinery → fuel supplier → compliance claim). AI has a role in mass-balance and trade-flow anomaly detection, for example UCO exports exceeding plausible cooking-oil consumption. However, the EU's own UDB already acts as the shared ledger, so a hackathon project would have to position itself as a UDB-compatible verification and anomaly layer. Novelty is medium. COP31 fit is weak; it fits sustainable supply chains.
- **SAF/maritime:** Several registries already exist (RSB, 123Carbon, IATA, Energy Web per the brief). The remaining gap is cross-registry interoperability and claim-labelling, which is crowded and standards-driven. FuelEU Maritime pooling was not checked. Recommendation: deprioritize.
- **Debris:** The climate impact is mostly embodied-carbon avoidance through recycled aggregate. The 27.5% figure is a single case study, so the climate quantification is weak. Ledger value lies in hazardous-material (asbestos) chain of custody and "recycled content" claims for reconstruction. Strong emotional and local relevance for a Türkiye jury, but weaker on criterion (a). It could work as a sub-module of a construction-materials DPP. Novelty is high.
- **SF6:** Best treated as a second gas in the F-gas ledger (same EKOMVET registry, same leak-detection AI). This strengthens candidate 1's "electrification / grid" link to COP31.
- **Bovaer:** The double-claim structure is plausible: farm credit vs. processor inset vs. retailer Scope 3. However, no documented case was found, so the "named victim" criterion is unmet. Medium-weak.

### Gaps
- Green hydrogen / RFNBO (EU Delegated Acts, CertifHy, Türkiye Hydrogen Strategy): not researched in this pass. No claims made.
- Rice methane, AWD credits and soil-carbon MRV double claims: not researched.
- Cement clinker-substitution claims, cold-chain food loss, cooling-as-a-service: not researched.
- FuelEU Maritime pooling registry gaps: not researched.
- Whether earlier IEEE or other blockchain hackathons have done F-gas or landfill-methane projects: no systematic check was possible. The novelty ratings are judgement calls based on the absence of any ledger or hackathon projects in these searches.

### Overall ranking (inference, for the report writer)
1. **F-gas / refrigerant lifecycle ledger** (HFC + SF6), with AI leak and mass-balance anomaly detection, IoT supermarket racks, PQC-signed cylinder attestations, and an equipment DPP. Strongest on every criterion; Türkiye and EU regulatory hooks are current (2024–2026).
2. **Waste-methane MRV and claim reconciliation**, combining satellite and model fusion with single attestations for LFG capture and organic diversion across credit, YEK-G and municipal target claims. Best COP31 fit; moderate ledger necessity.
3. **UCO / biofuel feedstock fraud verification layer** (UDB-compatible). Strong pain; existing EU database limits novelty.
4. **Post-earthquake debris and asbestos chain of custody plus recycled-content DPP.** High local resonance; weak climate quantification.
5. Reject or deprioritize: SAF book-and-claim (crowded), Bovaer insetting (no documented case).
