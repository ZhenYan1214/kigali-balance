// Monthly simulation of an HFC refrigerant economy.
//
// Two worlds are kept strictly apart:
//   * physical truth  — true leak rates, gas in each unit, off-ledger top-ups, smuggled gas,
//                       venting, fraud labels. Written only to ground_truth.json.
//   * observations    — ledger events (accepted and rejected) and distributor invoices.
//                       This is the ONLY data the AI modules may use.

import { Rng } from './rng.mjs';
import { LedgerMirror } from './ledger.mjs';

const DAY = 24 * 3600;
const KG = 1000;

export function simulate(params, overrides = {}) {
  const p = structuredClone(params);
  Object.assign(p.simulation, overrides);
  const rng = new Rng(p.simulation.seed);
  // a separate stream for probe attacks, so adding them leaves every other draw unchanged
  const probe = new Rng((p.simulation.seed ^ 0x9e3779b9) >>> 0);
  const ledger = new LedgerMirror(p.rules);
  const start = Math.floor(Date.parse(p.simulation.startDate + 'T00:00:00Z') / 1000);
  const monthT = (m) => start + Math.round(m * 30.4375 * DAY);

  // ------------------------------------------------------------------ actors
  const ids = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);
  const importers = ids('importer', p.actors.importers);
  const distributors = ids('distributor', p.actors.distributors);
  const services = ids('service', p.actors.serviceCompanies);
  const reclaimers = ids('reclaimer', p.actors.reclaimers);
  const facilities = ids('facility', p.actors.destructionFacilities);
  const owners = ids('owner', p.actors.equipmentOwners);
  const takeBacks = ids('takeback', p.actors.takeBackPoints);
  const verifiers = ids('verifier', p.actors.verifiers);
  const registries = p.actors.registries;
  for (const o of [...owners, ...takeBacks]) ledger.addOwner(o);
  for (const v of verifiers) ledger.addVerifier(v);
  for (const s of services) ledger.addService(s);

  const shuffledServices = rng.shuffle(services);
  const colludingTakeBacks = rng.shuffle(takeBacks).slice(0, p.fraud.phantomTierB.colludingTakeBackPoints);
  const truth = {
    fraud: {
      offLedgerTopUpServices: shuffledServices.slice(0, p.fraud.offLedgerTopUps.serviceCompanies),
      phantomTierBServices: shuffledServices.slice(
        p.fraud.offLedgerTopUps.serviceCompanies,
        p.fraud.offLedgerTopUps.serviceCompanies + p.fraud.phantomTierB.serviceCompanies,
      ),
      oversellingDistributors: rng.shuffle(distributors).slice(0, p.fraud.distributorOverselling.distributors),
      inflatedYieldReclaimers: rng.shuffle(reclaimers).slice(0, p.fraud.inflatedYield.reclaimers),
      colludingTakeBackPoints: colludingTakeBacks,
      oversellingProfiles: {}, // distributor => 'naive' | 'adaptive'
      inflatedYieldProfiles: {}, // reclaimer => 'naive' | 'adaptive'
      phantomProfiles: {}, // service => 'naive' | 'adaptive'
      phantomUnits: [],
      chargeAndRecoverUnits: [],
      unconsentedRecoveryAttempts: [],
      cylinderReuseAttempts: [],
      paddedRecoveryAttempts: [],
      competitorChargeAttempts: [],
      rogueRegistryClaimAttempts: [],
      selfCertifiedDestructionAttempts: [],
    },
    units: {},
    physical: {},
    offLedger: { topUpsByService: {}, topUpsByUnit: {}, smuggledByGas: {}, smuggledByDistributor: {}, cashPurchasesByService: {}, invoiceIds: [], paddedInvoices: [] },
    reclaimerYieldCentre: {}, // honest plant efficiency (evaluation only)
  };
  const isOffLedgerService = new Set(truth.fraud.offLedgerTopUpServices);
  truth.fraud.offLedgerProfiles = Object.fromEntries(truth.fraud.offLedgerTopUpServices.map(
    (s, i) => [s, i < p.fraud.offLedgerTopUps.serviceCompanies - p.fraud.offLedgerTopUps.adaptive ? 'naive' : 'adaptive'],
  ));
  const serviceSize = Object.fromEntries(services.map(
    (s) => [s, rng.uniform(p.service.companySizeWeight[0], p.service.companySizeWeight[1])],
  ));
  truth.serviceLeakFactor = Object.fromEntries(services.map(
    (s) => [s, Number(rng.uniform(p.service.companyLeakFactor[0], p.service.companyLeakFactor[1]).toFixed(4))],
  ));
  const isPhantomService = new Set(truth.fraud.phantomTierBServices);
  truth.fraud.oversellingDistributors.forEach((d, i) => { truth.fraud.oversellingProfiles[d] = i === 0 ? 'naive' : 'adaptive'; });
  truth.fraud.inflatedYieldReclaimers.forEach((r, i) => { truth.fraud.inflatedYieldProfiles[r] = i === 0 ? 'naive' : 'adaptive'; });
  const [naiveSmuggler, adaptiveSmuggler] = truth.fraud.oversellingDistributors;
  for (const rec of reclaimers) {
    truth.reclaimerYieldCentre[rec] = Number(rng.uniform(p.reclaim.honestYieldCentre[0], p.reclaim.honestYieldCentre[1]).toFixed(4));
  }
  const ledgerSalesByDistributor = {};
  const smugglingCustomers = new Set([...truth.fraud.offLedgerTopUpServices, ...truth.fraud.phantomTierBServices]);
  truth.fraud.phantomTierBServices.forEach((svc, i) => { truth.fraud.phantomProfiles[svc] = i === 0 ? 'naive' : 'adaptive'; });

  const actors = [
    ...importers.map((id) => ({ id, role: 'IMPORTER', country: 'TR' })),
    ...distributors.map((id, i) => ({ id, role: 'DISTRIBUTOR', country: i % 2 ? 'TR' : 'EU' })),
    ...services.map((id, i) => ({ id, role: 'SERVICE', country: i % 3 === 0 ? 'EU' : 'TR' })),
    ...reclaimers.map((id, i) => ({ id, role: 'RECLAIMER', country: i === 0 ? 'EU' : 'TR' })),
    ...facilities.map((id) => ({ id, role: 'DESTRUCTION', country: 'TR' })),
    ...registries.map((r) => ({ id: r.id, role: 'REGISTRY', country: r.id.endsWith('tw') ? 'TW' : 'INTL' })),
    ...owners.map((id, i) => ({ id, role: 'EQUIPMENT_OWNER', country: i % 3 === 0 ? 'EU' : 'TR' })),
    ...takeBacks.map((id) => ({ id, role: 'EQUIPMENT_OWNER', country: 'TR' })),
    ...verifiers.map((id, i) => ({ id, role: 'VERIFIER', country: i === 0 ? 'EU' : 'TR' })),
  ];

  // physical pools per gas (grams)
  const phys = {};
  const physOf = (gas) => (phys[gas] ??= { initialInEquipment: 0, leaked: 0, vented: 0, smuggledIn: 0, topUpsTrue: 0, topUpsOnLedger: 0, topUpsUnmet: 0, eolRemaining: 0, eolRecovered: 0 });
  const invoices = [];

  // ------------------------------------------------------------------ Tier B model catalogue
  const t0 = monthT(0);
  const models = [];
  const addModel = (category, gas, kg) => {
    const id = `model-${category}-${gas}-${kg.toFixed(1)}kg`;
    if (!models.find((m) => m.id === id)) {
      models.push({ id, category, gas, grams: Math.round(kg * KG) });
      ledger.setModel(t0, id, gas, Math.round(kg * KG));
    }
    return id;
  };

  // ------------------------------------------------------------------ fleet
  // every unit, real or fake, gets a random serial from the same space (no ordering that leaks labels)
  const usedSerials = new Set();
  const newSerial = () => {
    let s;
    do s = `eq-${Math.floor(rng.next() * 0xffffffff).toString(16).padStart(8, "0")}`; while (usedSerials.has(s));
    usedSerials.add(s);
    return s;
  };
  const tierFor = (gas, grams) => ((grams / KG) * p.gases[gas].gwpAR4) / 1000 >= p.registry.tierAThresholdTco2e ? 'A' : 'B';
  const units = [];
  const catEntries = Object.entries(p.fleet.categories);
  for (const [category, c] of catEntries) {
    const n = Math.round(p.fleet.units * c.share);
    for (let i = 0; i < n; i++) {
      const gas = rng.weighted(c.gases);
      let kg = rng.uniform(c.chargeKg[0], c.chargeKg[1]);
      const lifetimeMonths = Math.round(rng.uniform(c.lifetimeYears[0], c.lifetimeYears[1]) * 12);
      const ageMonths = rng.int(1, lifetimeMonths - 1);
      const installedAt = monthT(-ageMonths);
      let tier = tierFor(gas, kg * KG);
      let modelId = null;
      if (tier === 'B') {
        kg = Math.round(kg * 10) / 10 || 0.2; // nameplates come from a model catalogue
        modelId = addModel(category, gas, kg);
        tier = tierFor(gas, kg * KG);
      }
      const nameplate = Math.round(kg * KG);
      const id = newSerial();
      const unit = {
        id, category, gas, nameplate, tier, modelId, installedAt,
        eolMonth: lifetimeMonths - ageMonths, // month index when it is scrapped
        leakRate: rng.uniform(c.leakRatePerYear[0], c.leakRatePerYear[1]),
        charge: Math.round(nameplate * rng.uniform(p.fleet.initialChargeFraction[0], p.fleet.initialChargeFraction[1])),
        service: rng.weighted(serviceSize),
        leakBand: c.leakRatePerYear,
        // Tier A: the operator in the national registry; Tier B: the take-back point at scrapping
        owner: tier === 'A' ? rng.pick(owners) : rng.pick(takeBacks),
        registered: false,
        active: true,
      };
      unit.leakRate *= truth.serviceLeakFactor[unit.service];
      // Maintenance follows the leak-check obligation (params.service._maintenanceReadme):
      // Tier A is checked on a fixed schedule; Tier B is only refilled when it stops cooling, so it
      // starts the simulation having leaked since installation.
      const tco2e = ((nameplate / KG) * p.gases[gas].gwpAR4) / 1000;
      if (tier === 'A') {
        unit.checkMonths = p.service.leakCheckMonthsByTco2e.find(([below]) => tco2e < below)[1];
        unit.nextCheck = rng.int(0, unit.checkMonths - 1);
      } else {
        unit.charge = Math.round(nameplate * Math.max(0, 1 - (unit.leakRate * ageMonths) / 12));
      }
      physOf(gas).initialInEquipment += unit.charge;
      truth.units[id] = { leakRatePerYear: Number(unit.leakRate.toFixed(4)), serviceCompany: unit.service, category, nameplate, tier };
      units.push(unit);
      if (tier === 'A') {
        ledger.registerTierA(t0, id, gas, nameplate, installedAt, category, unit.owner, unit.service);
        unit.registered = true;
      }
    }
  }

  // ------------------------------------------------------------------ quotas (one per importer per gas per year)
  const annualDemand = {};
  for (const u of units) annualDemand[u.gas] = (annualDemand[u.gas] ?? 0) + u.nameplate * u.leakRate;
  // quotas are issued at the start of each year inside the monthly loop (time only moves forward)
  const issueQuotas = (t, y) => {
    for (const [gas, demand] of Object.entries(annualDemand)) {
      for (const imp of importers) {
        ledger.registerQuota(t, `quota-${imp}-${gas}-Y${y + 1}`, imp, gas, Math.round((demand * 1.3) / importers.length));
      }
    }
  };

  // ------------------------------------------------------------------ supply chain helpers
  const heldGrams = (actor, gas, filter = () => true) =>
    ledger.activeLotsOf(actor, (l) => l.gas === gas && filter(l)).reduce((s, l) => s + l.grams, 0);

  const moveGrams = (t, from, to, gas, grams, prefer) => {
    // send `grams` from `from` to `to`, drawing lots in preference order; receiver re-weighs exactly
    let remaining = grams;
    const lots = ledger.activeLotsOf(from, (l) => l.gas === gas).sort((a, b) => prefer(a) - prefer(b));
    for (const lot of lots) {
      if (remaining <= 0) break;
      const g = Math.min(remaining, lot.grams);
      const sent = ledger.send(t, from, lot.id, to, g);
      if (sent) {
        ledger.receive(t, to, sent, g);
        remaining -= g;
      }
    }
    return grams - remaining;
  };

  // order sizes scale with each gas market (a 100 kg minimum would exceed a small R-410A quota)
  const importerBatch = (gas) => Math.max(10 * KG, Math.min(100 * KG, Math.round(annualDemand[gas] * 0.05)));
  const distributorBatch = (gas) => Math.max(5 * KG, Math.min(200 * KG, Math.round(annualDemand[gas] * 0.03)));

  // importers know their remaining quota and never ask for more than that
  const importerStock = (t, imp, gas, grams) => {
    if (heldGrams(imp, gas) >= grams) return true;
    const y = Math.floor((t - start) / (365.25 * DAY));
    const quotaId = `quota-${imp}-${gas}-Y${y + 1}`;
    const q = ledger.quotas.get(quotaId);
    const remaining = q ? q.allowed - q.used : 0;
    if (remaining <= 0) return heldGrams(imp, gas) > 0;
    const amount = Math.min(remaining, Math.max(grams - heldGrams(imp, gas), importerBatch(gas)));
    ledger.mintVirgin(t, imp, quotaId, amount);
    return heldGrams(imp, gas) > 0;
  };

  const distributorStock = (t, dist, gas, grams) => {
    if (heldGrams(dist, gas) >= grams) return true;
    for (const imp of rng.shuffle(importers)) {
      const need = Math.max(grams - heldGrams(dist, gas), distributorBatch(gas));
      if (need <= 0 || heldGrams(dist, gas) >= grams) break;
      if (importerStock(t, imp, gas, need)) moveGrams(t, imp, dist, gas, Math.min(need, heldGrams(imp, gas)), () => 0);
    }
    return heldGrams(dist, gas) > 0;
  };

  // service companies prefer reclaimed gas (EU servicing ban on virgin GWP >= 2500), then virgin
  const classPreference = (lot) => ({ RECLAIMED: 0, VIRGIN: 1, RECOVERED: 2, UNKNOWN: 3 })[lot.cls] ?? 9;

  const buyForService = (t, svc, gas, grams) => {
    const want = Math.max(grams, Math.min(p.service.purchaseBatchKg * KG, distributorBatch(gas)));
    let bought = 0;
    let order = rng.shuffle(distributors);
    if (adaptiveSmuggler && smugglingCustomers.has(svc)) order = [adaptiveSmuggler, ...order.filter((d) => d !== adaptiveSmuggler)];
    for (const dist of order) {
      if (bought >= grams) break;
      if (!distributorStock(t, dist, gas, want - bought)) continue;
      const moved = moveGrams(t, dist, svc, gas, Math.min(want - bought, heldGrams(dist, gas)), classPreference);
      if (moved > 0) {
        ledgerSalesByDistributor[dist] = (ledgerSalesByDistributor[dist] ?? 0) + moved;
        issueInvoice(t, dist, svc, gas, moved);
      }
      bought += moved;
    }
    return bought;
  };

  // Honest paperwork is noisy: weights are estimated/rounded and invoices are dated a few days
  // before or after the shipment. The same noise applies to fraudulent invoices.
  // Smuggled gas the adaptive distributor has delivered and bills on the buyer's next legitimate
  // invoice, padding it by at most the per-invoice share: `${buyer}|${gas}` => grams.
  const pendingPadding = {};
  const issueInvoice = (t, dist, buyer, gas, grams) => {
    const noise = p.observationNoise;
    const key = `${buyer}|${gas}`;
    const padding = dist === adaptiveSmuggler
      ? Math.min(pendingPadding[key] ?? 0, Math.floor(grams * p.fraud.distributorOverselling.adaptivePadMaxPerInvoice))
      : 0;
    if (padding > 0) pendingPadding[key] -= padding;
    const lag = rng.int(noise.invoiceLagDays[0], noise.invoiceLagDays[1]) * DAY;
    const billed = Math.max(1, Math.round(((grams + padding) * (1 + rng.normal(0, noise.invoiceWeightSd))) / 10) * 10);
    const invoice = `inv-${String(invoices.length + 1).padStart(5, '0')}`;
    invoices.push({ invoice, date: iso(t + lag), distributor: dist, buyer, gas, grams: billed });
    if (padding > 0) truth.offLedger.paddedInvoices.push({ invoice, distributor: dist, grams: padding });
    return invoice;
  };

  const smuggledSale = (t, svc, gas, grams) => {
    if (truth.fraud.offLedgerProfiles[svc] === 'adaptive') {
      // bought for cash from a smuggler outside the system: no invoice anywhere
      physOf(gas).smuggledIn += grams;
      truth.offLedger.smuggledByGas[gas] = (truth.offLedger.smuggledByGas[gas] ?? 0) + grams;
      truth.offLedger.cashPurchasesByService[svc] = (truth.offLedger.cashPurchasesByService[svc] ?? 0) + grams;
      return;
    }
    // off-ledger: smuggled gas sold by an overselling distributor; appears only on its invoices.
    // The adaptive distributor only takes a sale while its total stays under a small share of its
    // ledger sales and what it still has to bill fits on one ordinary invoice; it bills it by padding
    // the buyer's next legitimate invoice. Everything else goes to the naive distributor.
    physOf(gas).smuggledIn += grams;
    truth.offLedger.smuggledByGas[gas] = (truth.offLedger.smuggledByGas[gas] ?? 0) + grams;
    const byDist = truth.offLedger.smuggledByDistributor;
    let dist = naiveSmuggler;
    if (adaptiveSmuggler) {
      const cfg = p.fraud.distributorOverselling;
      const room = cfg.adaptiveMaxExcessShare * (ledgerSalesByDistributor[adaptiveSmuggler] ?? 0);
      const key = `${svc}|${gas}`;
      const fits = (pendingPadding[key] ?? 0) + grams <= cfg.adaptivePadMaxPerInvoice * distributorBatch(gas);
      if ((byDist[adaptiveSmuggler] ?? 0) + grams <= room && fits) {
        byDist[adaptiveSmuggler] = (byDist[adaptiveSmuggler] ?? 0) + grams;
        pendingPadding[key] = (pendingPadding[key] ?? 0) + grams;
        return;
      }
    }
    byDist[dist] = (byDist[dist] ?? 0) + grams;
    const invoice = issueInvoice(t, dist, svc, gas, grams);
    truth.offLedger.invoiceIds.push(invoice); // evaluation only: the invoice itself looks normal
  };

  const registerTierBIfNeeded = (t, svc, unit) => {
    if (unit.registered) return true;
    if (ledger.registerTierB(t, svc, unit.id, unit.modelId, unit.category, unit.owner)) {
      unit.registered = true;
      return true;
    }
    return false;
  };

  const chargeOnLedger = (t, svc, unit, grams) => {
    if (heldGrams(svc, unit.gas) < grams) buyForService(t, svc, unit.gas, grams);
    let remaining = grams;
    const lots = ledger.activeLotsOf(svc, (l) => l.gas === unit.gas).sort((a, b) => classPreference(a) - classPreference(b));
    for (const lot of lots) {
      if (remaining <= 0) break;
      const g = Math.min(remaining, lot.grams);
      if (ledger.charge(t, svc, lot.id, unit.id, g)) remaining -= g;
    }
    return grams - remaining;
  };

  const iso = (t) => new Date(t * 1000).toISOString().slice(0, 10);

  // Share of a unit's top-ups an off-ledger service company records on the ledger. The adaptive
  // ones record just enough that the unit's ledger leakage looks like a plausible rate between
  // its category's minimum and midpoint (drawn once per unit).
  const recordShare = (u) => {
    if (truth.fraud.offLedgerProfiles[u.service] !== 'adaptive') return p.fraud.offLedgerTopUps.recordedShare;
    if (u.adaptiveShare === undefined) {
      const [lo, hi] = u.leakBand;
      u.adaptiveShare = Math.min(1, rng.uniform(lo, (lo + hi) / 2) / u.leakRate);
    }
    return u.adaptiveShare;
  };

  // ------------------------------------------------------------------ monthly loop
  // fake units get ordinary-looking serials drawn from the same space as real ones
  const fakeSerial = newSerial;
  for (let m = 0; m < p.simulation.months; m++) {
    const t = monthT(m) + DAY; // first day of month, after quotas/registrations
    if (m % 12 === 0) issueQuotas(monthT(m), m / 12);

    // 1) leakage and top-ups
    for (const u of units) {
      if (!u.active) continue;
      const leak = Math.min(u.charge, Math.round((u.nameplate * u.leakRate) / 12));
      u.charge -= leak;
      physOf(u.gas).leaked += leak;
      if (u.tier === 'A') {
        // periodic leak check: a refill only happens when a scheduled check finds the unit low
        if (m < u.nextCheck) continue;
        u.nextCheck = m + u.checkMonths;
        if (u.charge >= u.nameplate * p.service.topUpWhenBelowFraction) continue;
      } else if (!(u.charge < u.nameplate * p.service.tierBRepairBelowFraction && rng.chance(p.service.tierBRepairChancePerMonth))) {
        continue; // no leak-check obligation: refilled only after it stops cooling and someone calls for repair
      }
      const deficit = u.nameplate - u.charge;
      const svc = u.service;
      const offLedger = isOffLedgerService.has(svc) && !rng.chance(recordShare(u));
      if (offLedger) {
        smuggledSale(t, svc, u.gas, deficit);
        physOf(u.gas).topUpsTrue += deficit;
        truth.offLedger.topUpsByService[svc] = (truth.offLedger.topUpsByService[svc] ?? 0) + deficit;
        truth.offLedger.topUpsByUnit[u.id] = (truth.offLedger.topUpsByUnit[u.id] ?? 0) + deficit;
        u.charge += deficit;
      } else {
        registerTierBIfNeeded(t, svc, u);
        const charged = chargeOnLedger(t, svc, u, deficit);
        physOf(u.gas).topUpsOnLedger += charged;
        physOf(u.gas).topUpsTrue += charged;
        physOf(u.gas).topUpsUnmet += deficit - charged; // supply shortfall: must stay ~0
        u.charge += charged;
      }
    }

    // 2) charge-and-recover laundering attempts (caught by the residence rule)
    if (rng.chance(p.fraud.chargeAndRecover.attemptsPerYear / 12)) {
      const target = rng.pick(units.filter((u) => u.active && u.registered && u.tier === 'A' && u.eolMonth > m + 1));
      if (target) {
        const svc = target.service;
        // virgin gas is charged into the unit and taken straight back out the next day
        const amount = Math.round(target.nameplate * 0.2);
        const charged = chargeOnLedger(t, svc, target, amount);
        target.charge += charged;
        const take = charged;
        const res = take > 0 ? ledger.recover(t + DAY, svc, target.id, take, false) : null;
        if (res) target.charge -= take;
        truth.fraud.chargeAndRecoverUnits.push({ unit: target.id, service: svc, grams: take, month: m });
      }
    }

    // 2b) unconsented recovery: smuggled gas booked as recovered from someone else's unit, with the
    //     consent signed by the service company's own scale key (rejected: NotUnitOwner)
    if (rng.chance(p.fraud.unconsentedRecovery.attemptsPerYear / 12)) {
      const svc = rng.pick(truth.fraud.offLedgerTopUpServices);
      const target = rng.pick(units.filter((u) => u.active && u.registered && u.tier === 'A' && u.service !== svc));
      if (target) {
        const grams = Math.round(target.nameplate * 0.3);
        const res = ledger.recover(t, svc, target.id, grams, false, { consentSigner: `scale:${svc}` });
        truth.fraud.unconsentedRecoveryAttempts.push({ unit: target.id, service: svc, grams, month: m, accepted: Boolean(res) });
      }
    }

    // 2b') competitor charge: a service company charges its own gas into a unit it does not service,
    //      which would quarantine the rightful company's next recovery (rejected: ServiceNotAuthorized)
    if (probe.chance(p.fraud.competitorCharge.attemptsPerYear / 12)) {
      const target = probe.pick(units.filter((u) => u.active && u.registered && u.tier === 'A'));
      const rivals = target ? services.filter((s) => s !== target.service && ledger.activeLotsOf(s, (l) => l.gas === target.gas).length) : [];
      if (rivals.length) {
        const rival = probe.pick(rivals);
        const lot = ledger.activeLotsOf(rival, (l) => l.gas === target.gas)[0];
        const grams = Math.min(lot.grams, Math.round(target.nameplate * 0.2));
        const res = ledger.charge(t, rival, lot.id, target.id, grams);
        truth.fraud.competitorChargeAttempts.push({ unit: target.id, service: rival, grams, month: m, accepted: Boolean(res) });
      }
    }

    // 2c) padded recovery: a service company and a colluding owner book more than one charge from a
    //     leaky unit in a single recovery. The lifetime cap (charge + top-ups) would allow it; the
    //     booked-content rule rejects it (RecoveryExceedsContent).
    if (probe.chance(p.fraud.paddedRecovery.attemptsPerYear / 12)) {
      const candidates = units.filter((u) => {
        if (!u.active || !u.registered || u.tier !== 'A') return false;
        const e = ledger.equipment.get(u.id);
        return e && ledger.recoveryCap(u.id) - e.recovered > ledger.maxPerRecovery(u.id) * 1.2;
      });
      if (candidates.length) {
        const target = probe.pick(candidates);
        const grams = Math.round(ledger.maxPerRecovery(target.id) * 1.2);
        const n = truth.fraud.paddedRecoveryAttempts.length + 1;
        const res = ledger.recover(t, target.service, target.id, grams, false, { cylinder: `cyl-probe-${n}` });
        truth.fraud.paddedRecoveryAttempts.push({ unit: target.id, service: target.service, grams, month: m, accepted: Boolean(res), kind: 'oversized' });
      }
    }

    // 2d) split padding: on a unit already partly recovered without a recorded recharge, book another
    //     full charge. One charge per recovery and the lifetime cap would both allow it; the
    //     booked-content rule rejects it (RecoveryExceedsContent).
    if (probe.chance(p.fraud.paddedRecovery.attemptsPerYear / 12)) {
      const candidates = units.filter((u) => {
        if (!u.active || !u.registered || u.tier !== 'A') return false;
        const e = ledger.equipment.get(u.id);
        if (!e || e.status !== 'ACTIVE') return false;
        const full = ledger.maxPerRecovery(u.id);
        return ledger.bookedContent(u.id) < full && ledger.recoveryCap(u.id) - e.recovered >= full;
      });
      if (candidates.length) {
        const target = probe.pick(candidates);
        const grams = ledger.maxPerRecovery(target.id);
        const n = truth.fraud.paddedRecoveryAttempts.length + 1;
        const res = ledger.recover(t, target.service, target.id, grams, false, { cylinder: `cyl-probe-${n}` });
        truth.fraud.paddedRecoveryAttempts.push({ unit: target.id, service: target.service, grams, month: m, accepted: Boolean(res), kind: 'split' });
      }
    }

    // 3) end of life
    for (const u of units) {
      if (!u.active || u.eolMonth !== m) continue;
      u.active = false;
      u.removedAt = t;
      truth.units[u.id].eolCharge = u.charge; // evaluation only: what was really inside at removal
      const svc = u.service;
      physOf(u.gas).eolRemaining += u.charge;
      const meanEff = (p.endOfLife.recoveryEfficiency[0] + p.endOfLife.recoveryEfficiency[1]) / 2;
      const recovers = rng.chance(Math.min(1, p.endOfLife.targetMassRecoveryRate / meanEff));
      let recovered = 0;
      if (recovers && u.charge > 0 && registerTierBIfNeeded(t, svc, u)) {
        const g = Math.round(u.charge * rng.uniform(p.endOfLife.recoveryEfficiency[0], p.endOfLife.recoveryEfficiency[1]));
        if (g > 0 && ledger.recover(t, svc, u.id, g, true)) recovered = g;
      }
      physOf(u.gas).eolRecovered += recovered;
      physOf(u.gas).vented += u.charge - recovered;
      u.charge = 0;
    }

    // 4) phantom Tier B recoveries: smuggled virgin gas presented as recovered from fake small units.
    //    A colluding take-back point co-signs as the owner; the adaptive company mimics honest
    //    recovery efficiency instead of booking the full model charge.
    for (const svc of truth.fraud.phantomTierBServices) {
      const n = truth.fraud.phantomProfiles[svc] === 'adaptive'
        ? Number(rng.chance(p.fraud.phantomTierB.adaptiveUnitChancePerMonth))
        : rng.int(p.fraud.phantomTierB.unitsPerMonth[0], p.fraud.phantomTierB.unitsPerMonth[1]);
      const range = truth.fraud.phantomProfiles[svc] === 'adaptive'
        ? p.fraud.phantomTierB.adaptiveFractionOfModelCharge
        : p.fraud.phantomTierB.fractionOfModelCharge;
      for (let k = 0; k < n; k++) {
        const model = rng.pick(models.filter((x) => x.category === 'split_ac'));
        const id = fakeSerial();
        const accomplice = rng.pick(colludingTakeBacks);
        if (!ledger.registerTierB(t, svc, id, model.id, model.category, accomplice)) continue;
        const g = Math.round(model.grams * rng.uniform(range[0], range[1]));
        // occasionally try to book it into a cylinder that still backs an open lot (rejected: CylinderInUse)
        const openLot = ledger.activeLotsOf(svc)[0];
        if (openLot && rng.chance(p.fraud.cylinderReuse.attemptsPerYear / 12 / p.fraud.phantomTierB.unitsPerMonth[1])) {
          const res = ledger.recover(t, svc, id, g, true, { cylinder: openLot.cylinder });
          truth.fraud.cylinderReuseAttempts.push({ unit: id, service: svc, cylinder: openLot.cylinder, month: m, accepted: Boolean(res) });
          if (res) continue;
        }
        if (ledger.recover(t, svc, id, g, true)) {
          smuggledSale(t, svc, model.gas, g); // the "recovered" gas is really smuggled virgin
          truth.fraud.phantomUnits.push({ unit: id, service: svc, grams: g, month: m });
        }
      }
    }

    // 5) route recovered gas: in-service tiers to reclaimers/facilities, Tier C to destruction
    for (const svc of services) {
      for (const lot of ledger.activeLotsOf(svc, (l) => l.cls === 'RECOVERED')) {
        const toReclaimer = lot.tier !== 'C' && rng.chance(p.endOfLife.recoveredToReclaimShare);
        const dest = toReclaimer ? rng.pick(reclaimers) : rng.pick(facilities);
        const sent = ledger.send(t, svc, lot.id, dest, lot.grams);
        if (sent) ledger.receive(t, dest, sent, ledger.lots.get(sent).grams);
      }
    }

    // 6) reclamation, then reclaimed gas goes back to distributors
    for (const rec of reclaimers) {
      const byGas = groupBy(ledger.activeLotsOf(rec, (l) => l.cls === 'RECOVERED' && l.tier !== 'C'), (l) => l.gas);
      for (const [gas, lots] of Object.entries(byGas)) {
        const inGrams = lots.reduce((s, l) => s + l.grams, 0);
        const profile = truth.fraud.inflatedYieldProfiles[rec];
        if (profile === 'naive' && rng.chance(p.fraud.inflatedYield.overCapAttemptsPerYear / 12)) {
          // occasional attempt above the 98 % ceiling: rejected by R4
          ledger.reclaim(t, rec, lots.map((l) => l.id), Math.round(inGrams * 1.05), 9_960);
        }
        const centre = truth.reclaimerYieldCentre[rec];
        const honest = [centre - p.reclaim.honestYieldHalfWidth, centre + p.reclaim.honestYieldHalfWidth];
        // the adaptive fraudster keeps its plant's honest spread and shifts the centre up
        const uplift = profile === 'adaptive' ? p.fraud.inflatedYield.adaptiveUplift : 0;
        const range = profile === 'naive' ? p.fraud.inflatedYield.yield
          : [honest[0] + uplift, Math.min(honest[1] + uplift, 0.975)];
        const out = Math.round(inGrams * rng.uniform(range[0], range[1]));
        const purity = rng.int(p.reclaim.purityBps[0], p.reclaim.purityBps[1]);
        const outLot = ledger.reclaim(t, rec, lots.map((l) => l.id), out, purity);
        if (outLot) {
          const dist = rng.pick(distributors);
          const sent = ledger.send(t + DAY, rec, outLot, dist, out);
          if (sent) ledger.receive(t + DAY, dist, sent, out);
        }
      }
    }

    // 7) destruction in batches that keep credit eligibility (Tier A, Tier B, everything else)
    for (const fac of facilities) {
      const lots = ledger.activeLotsOf(fac);
      const batches = groupBy(lots, (l) => {
        const k = l.cls === 'RECOVERED' && l.tier !== 'C' ? `tier${l.tier}` : 'ineligible';
        return `${l.gas}|${k}`;
      });
      for (const batch of Object.values(batches)) {
        const held = batch.reduce((s, l) => s + l.grams, 0);
        const inputs = batch.map((l) => l.id);
        if (rng.chance(p.fraud.selfCertifiedDestruction.attemptsPerYear / 12 / facilities.length)) {
          // the facility signs its own certificate with its scale key (rejected: NotVerifier)
          const res = ledger.destroy(t + 2 * DAY, fac, inputs, held, p.destruction.dreBps, { verifier: `scale:${fac}` });
          truth.fraud.selfCertifiedDestructionAttempts.push({ facility: fac, grams: held, month: m, accepted: res !== null });
          if (res !== null) continue;
        }
        const eventId = ledger.destroy(t + 2 * DAY, fac, inputs, held, p.destruction.dreBps, { verifier: rng.pick(verifiers) });
        if (eventId === null) continue;
        const ev = ledger.destructionEvents[eventId];
        if (!ev.eligible) continue;
        // the facility designates a registry, which claims it; the international registry only
        // accepts Tier A, so on a refusal the facility re-designates the other one
        const first = rng.pick(registries);
        const other = registries.find((r) => r.id !== first.id);
        ledger.designate(t + 3 * DAY, fac, eventId, first.id);
        if (probe.chance(p.fraud.rogueRegistryClaim.probabilityPerEligibleEvent)) {
          // a registry key tries to claim an event designated to another (rejected: NotDesignated)
          const res = ledger.claim(t + 3 * DAY, other.id, other.acceptsTier, eventId);
          truth.fraud.rogueRegistryClaimAttempts.push({ eventId, registry: other.id, month: m, accepted: Boolean(res) });
        }
        let ok = ledger.claim(t + 3 * DAY, first.id, first.acceptsTier, eventId);
        if (!ok) {
          ledger.designate(t + 3 * DAY, fac, eventId, other.id);
          ok = ledger.claim(t + 3 * DAY, other.id, other.acceptsTier, eventId);
        } else if (rng.chance(p.fraud.duplicateClaims.probabilityPerEligibleEvent)) {
          ledger.claim(t + 4 * DAY, other.id, other.acceptsTier, eventId); // rejected: AlreadyClaimed
        }
      }
    }
  }

  // ------------------------------------------------------------------ outputs
  const end = monthT(p.simulation.months);
  for (const u of units) {
    if (u.active) truth.units[u.id].finalCharge = u.charge;
  }
  const inEquipmentEnd = {};
  for (const u of units) if (u.active) inEquipmentEnd[u.gas] = (inEquipmentEnd[u.gas] ?? 0) + u.charge;
  // charge-and-recover gas is physically charged and recovered: already in unit.charge / ledger
  for (const [gas, ph] of Object.entries(phys)) {
    ph.inEquipmentEnd = inEquipmentEnd[gas] ?? 0;
  }
  truth.physical = phys;

  // the national registry (e.g. EKOMVET) records which company services each unit; a unit first
  // registered at decommissioning is serviced by the company that registered it
  const serviceOf = new Map(units.map((u) => [u.id, u.service]));
  const removedAt = new Map(units.filter((u) => u.removedAt).map((u) => [u.id, u.removedAt]));
  const equipment = [...ledger.equipment.entries()].map(([id, e]) => ({
    id, tier: e.tier, gas: e.gas, category: e.category, nameplate_g: e.nameplateGrams,
    installed_at: e.installedAt ? iso(e.installedAt) : '', registered_at: iso(e.registeredAt),
    registered_by: e.registeredBy, model_id: e.modelId ?? '', owner: e.owner,
    service_company: serviceOf.get(id) ?? e.registeredBy,
    // Tier A removals are reported to the national registry; Tier B units are registered at scrapping
    removed_at: e.tier === 'A' && removedAt.has(id) ? iso(removedAt.get(id)) : '',
  }));

  return {
    params: p,
    ledger,
    observations: { actors, equipment, events: ledger.events, invoices },
    truth,
    period: { start: iso(start), end: iso(end) },
  };
}

function groupBy(arr, keyFn) {
  const out = {};
  for (const x of arr) (out[keyFn(x)] ??= []).push(x);
  return out;
}
