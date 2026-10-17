# GS1 EPCIS 2.0 export

`export_epcis.mjs` turns the provenance chain of a lot into a GS1 EPCIS 2.0 JSON-LD `EPCISDocument`. It reads only the observation files: `out/ledger_events.jsonl`, `out/equipment.csv` and `out/actors.csv`, plus the passport example list in `web/data/sim.json` if that file exists. All data is simulated.

For a lot, it walks back through split parents and reclaim inputs to the MINT or RECOVER that created each ancestor. It then exports every **accepted** ledger event that touches a lot in that chain, and adds the DESIGNATE and CLAIM events of any destruction in the chain. A rejected attempt never happened, so it is not an EPCIS event. (EPCIS `errorDeclaration` is for retracting events that were captured, which is not the same thing.)

The documents validate against the official schema in `schema/` (EPCIS 2.0.1, draft-07; see `schema/README.md`).

## Run

```
npm ci --prefix simulator
node simulator/epcis/export_epcis.mjs                 # example set -> web/data/epcis/lot-<id>.jsonld + index.json
node simulator/epcis/export_epcis.mjs --lot 42 --lot 43
node simulator/epcis/export_epcis.mjs --lot 42 --stdout
cd simulator && npm test                              # includes test/epcis.test.mjs
```

The examples are picked from the data and never hard-coded. They are the dashboard's passport examples, plus the first lot of each of these kinds: a reclaimed lot with Tier A inputs, a recovered lot that was destroyed and claimed, a quarantined Tier C lot, virgin gas that was charged, and reclaimed gas that was charged.

The output is deterministic:
- events are ordered by ledger `seq`;
- there is no `recordTime`;
- `creationDate` is the time of the last ledger event (the snapshot);
- line endings are LF.

Run the exporter again after `web/build_data.mjs` whenever `simulator/out` changes.

## Mapping

Quantities are class-level: `quantityList` entries of the form `{epcClass: <lot>, quantity: kg, uom: "KGM"}`. The gas is measured by weight, not serialised.

| Ledger event | EPCIS event | action | bizStep (CBV 2.0) | disposition | Quantities |
|---|---|---|---|---|---|
| MINT | ObjectEvent | ADD | `commissioning` (new class-level id) | `active` | minted kg of the new lot. Lot master data goes in `ilmd` |
| SEND (whole lot) | ObjectEvent | OBSERVE | `shipping` | `in_transit` | sent kg. `epcList` = the cylinder. `sourceList` and `destinationList` use `possessing_party` |
| SEND (split first) | TransformationEvent, then the ObjectEvent above | — | `repackaging` | — | parent lot kg in = new lot kg out (decanted into a new cylinder). `ilmd` holds the new lot's data |
| RECEIVE | ObjectEvent | OBSERVE | `receiving` | `in_progress` | **weighed** kg, also given as `sensorElementList` Mass/KGM. `kb:sentQuantityKg` and `kb:bookedQuantityKg` record the ledger balance. Underweight goes to `kb:handlingLossKg` |
| CHARGE | AggregationEvent | ADD | `installing` | — | `parentID` = equipment. `childQuantityList` = kg charged from the lot |
| RECOVER | AggregationEvent | DELETE | `removing` | — | `parentID` = equipment. `childQuantityList` = the in-service lot and/or the quarantined (Tier C) lot |
| RECOVER with `decommission` | + ObjectEvent | DELETE | `decommissioning` | — | `epcList` = equipment. No quantity |
| RECLAIM | TransformationEvent | — | **`kb:BizStep-reclaiming`** (not in CBV) | `available` | `inputQuantityList` = each input lot's kg at reclaim time. `outputQuantityList` = reclaimed kg. `ilmd` holds the new lot's data and purity |
| DESTROY | ObjectEvent | DELETE | `destroying` | `destroyed` | kg held per input lot. `sensorElementList` Mass = certified intake. `certificationInfo` = destruction certificate URI |
| DESIGNATE | TransactionEvent | ADD | **`kb:BizStep-designating_registry`** | — | `bizTransactionList` `cert` = destruction certificate. Destroyed lots are listed by `epcClass` with no quantity |
| CLAIM | TransactionEvent | ADD | **`kb:BizStep-claiming_destruction_credit`** | — | `cert` + `kb:BTT-destruction_credit_claim`. The claimed kg goes in `kb:claimLock` |
| QUOTA, MODEL, REGISTER_EQUIPMENT | not events | | | | used as master data (quota URI in `ilmd`, equipment attributes in the header) |
| rejected attempts, unknown future types | not exported | | | | |

The test checks the mapping in both directions. It re-derives the balance of every lot in every exported chain (all lots in the ledger, not only the examples) from the EPCIS events alone, and compares the result with an independent replay of `ledger_events.jsonl`. Along the way it checks that:
- each transfer moves the whole lot;
- a split conserves mass;
- reclaim inputs equal the ledger `inGrams`, and output ≤ inputs × (1 − `minReclaimLossBps`) (2 %);
- a destruction empties its lots, and the certified intake is ≤ the held kg;
- a claim equals the certified intake.

## Identifiers

All identifiers are project URIs under `https://zhenyan1214.github.io/kigali-balance/id/sim/…`, a domain the project controls. `sim` separates the simulated ledger from a real deployment. These URIs are identifiers only: no resolver is implemented, so they return 404.

| Thing | Project URI | GS1 key in a real deployment, and why we do not fake it |
|---|---|---|
| Lot (class) | `…/lot/{n}` | A ledger lot is a provenance identity, not a manufacturer's batch. It is created on mint, recovery, reclaim or a split before transfer. An LGTIN (`urn:epc:class:lgtin:` / Digital Link `01/{GTIN}/10/{lot}`) needs the producer's GTIN and batch number. If a producer supplies them, they belong in `ilmd` beside the ledger lot, not in place of it. |
| Cylinder (instance) | `…/cylinder/{id}` | Refillable cylinders are the textbook use of the **GRAI** (AI 8003, with serial). We have no GS1 Company Prefix, so inventing GRAIs would be fake. |
| Equipment (instance) | `…/equipment/{id}` | **GIAI** (AI 8004), assigned by the equipment owner. |
| Party | `…/party/{id}` | **PGLN** (AI 417). |
| Event | `…/event/{seq}[.k]` | CBV 2.0 also defines a canonical event hash (`ni:///sha-256;…`). We did not implement it; our IDs are stable because they come from the ledger `seq`. |
| Destruction certificate / claim | `…/destruction/{eventId}[/claim]` | — |

## Extension namespace

`"@context": ["https://ref.gs1.org/standards/epcis/2.0.1/epcis-context.jsonld", {"kb": "https://zhenyan1214.github.io/kigali-balance/ns/epcis#"}]`.

Every Kigali-specific field is a `kb:` term: on events (allowed by EPCIS 2.0 user extensions), in `ilmd`, inside nested extension objects, and as a document-level `kb:export` block. The non-CBV bizStep and business-transaction-type values are full IRIs in the same namespace. With the official context, JSON-LD expansion keeps every `kb:` term and every CBV value (checked with jsonld.js 8.3.3).

Facts that live **only** in the extension, because EPCIS/CBV has no field for them:

- **Provenance class** (`kb:provenanceClass`: VIRGIN / RECOVERED / RECLAIMED / UNKNOWN) and **tier** (`kb:tier` A/B/C, `kb:unitTier`, `kb:worstInputTier`). These are the core of the Kigali rules. They appear in `ilmd` / `kb:recoveredLots` and in the EPCClass master data.
- **Who acted and who attested**: `kb:actor` and `kb:attestations` give the party, its role (SERVICE, EQUIPMENT_OWNER, VERIFIER, REGISTRY, …) and what it attests (`ownerConsent`, `destructionCertificate`). EPCIS says *where* something happened (readPoint/bizLocation), not *who signed it*.
- **Destruction**: DRE (`kb:dreBps`), intake vs held vs handling loss, credit eligibility, worst tier and destruction event id (`kb:destruction`).
- **Claim lock**: `kb:claimLock` (destruction event id, registry, claimed kg) and the registry designation (`kb:designatedRegistry`).
- **Reclaim purity** (`kb:purityBps`) and reclaim loss, quota id, quarantined kg, recovery-with-decommission.
- **Ledger cross-reference** (`kb:ledgerSeq`, `kb:ledgerEventType`) and the snapshot balances (`kb:export`).

## Gaps and things that did not map cleanly

- **No CBV bizStep for reclamation.** CBV 2.0 has nothing for "reprocess to a purity specification". `repackaging`, `commissioning` and `creating_class_instance` would all be wrong, so we use `kb:BizStep-reclaiming`. Disposition `available` ("returned to … the supply chain") is the closest CBV fit for the output.
- **No CBV bizStep or event type for registry designation or credit claims.** These are not supply-chain movements. We use TransactionEvents with project bizSteps and a project business-transaction type next to CBV `cert`. A second DESIGNATE (re-designation) is a second ADD event. EPCIS has no "replace" semantics for this, so the reader has to apply the ledger rule that the latest designation wins.
- **Recovery is modelled as `removing`.** We use an AggregationEvent DELETE from the equipment, the inverse of the `installing` used for charges, so that charges and recoveries per unit can be queried by the standard `parentID`. `collecting` would also fit, but it cannot name the equipment. AggregationEvents cannot carry `ilmd`, so lot data for recovered lots is in `kb:recoveredLots` and in the EPCClass master data.
- **Cylinders.** A cylinder appears in `epcList` only when it moves (shipping/receiving). The lot→cylinder binding is lot master data (`kb:cylinder`). A full model would add AggregationEvents (cylinder parent ↔ lot quantity) for every fill; we left them out to keep one ledger event close to one EPCIS event.
- **No locations.** The ledger has no sites, so there is no `readPoint`/`bizLocation` (SGLN). Parties go in source/destination lists (`possessing_party`; the ledger does not know legal title, so we do not use `owning_party`). `eventTimeZoneOffset` is `+00:00` because ledger time is UTC block time and the local offset is unknown.
- **Weights.** RECEIVE states the weighed kg. If that is above the sent kg (overweight), the ledger keeps the sent kg, which is stated in `kb:bookedQuantityKg`. The SEND observation field `newCylinder` is ignored when the whole lot moves, because the ledger keeps the lot in its old cylinder.
- **Header master data vs JSON-LD.** The official JSON Schema puts master data at `epcisHeader.epcisMasterData.vocabularyList`. The official 2.0.1 context defines `masterData` but not `epcisMasterData`, so a JSON-LD processor drops the header master data with a warning. This is a GS1 schema/context mismatch. The facts are duplicated on the events (`ilmd`, `kb:`), so nothing is lost in RDF. The non-standard vocabulary types `kb:vtype-Equipment` and `kb:vtype-Party` are project types.
- **Rejected attempts** (and the reasons the contracts gave) are not in the EPCIS export. They are on the dashboard.
