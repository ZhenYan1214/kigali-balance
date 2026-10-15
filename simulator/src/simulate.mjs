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
  const registries = p.actors.registries;

  const shuffledServices = rng.shuffle(services);
  const truth = {
    fraud: {
      offLedgerTopUpServices: shuffledServices.slice(0, p.fraud.offLedgerTopUps.serviceCompanies),
      phantomTierBServices: shuffledServices.slice(
        p.fraud.offLedgerTopUps.serviceCompanies,
        p.fraud.offLedgerTopUps.serviceCompanies + p.fraud.phantomTierB.serviceCompanies,
      ),
      oversellingDistributors: rng.shuffle(distributors).slice(0, p.fraud.distributorOverselling.distributors),
      inflatedYieldReclaimers: rng.shuffle(reclaimers).slice(0, p.fraud.inflatedYield.reclaimers),
      phantomUnits: [],
      chargeAndRecoverUnits: [],
    },
    units: {},
    physical: {},
    offLedger: { topUpsByService: {}, topUpsByUnit: {}, smuggledByGas: {}, invoiceIds: [] },
  };
  const isOffLedgerService = new Set(truth.fraud.offLedgerTopUpServices);
  const isPhantomService = new Set(truth.fraud.phantomTierBServices);
  const smugglingDistributor = truth.fraud.oversellingDistributors[0];
  const isInflatedReclaimer = new Set(truth.fraud.inflatedYieldReclaimers);

  const actors = [
    ...importers.map((id) => ({ id, role: 'IMPORTER', country: 'TR' })),
    ...distributors.map((id, i) => ({ id, role: 'DISTRIBUTOR', country: i % 2 ? 'TR' : 'EU' })),
    ...services.map((id, i) => ({ id, role: 'SERVICE', country: i % 3 === 0 ? 'EU' : 'TR' })),
    ...reclaimers.map((id, i) => ({ id, role: 'RECLAIMER', country: i === 0 ? 'EU' : 'TR' })),
    ...facilities.map((id) => ({ id, role: 'DESTRUCTION', country: 'TR' })),
    ...registries.map((r) => ({ id: r.id, role: 'REGISTRY', country: r.id.endsWith('tw') ? 'TW' : 'INTL' })),
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
        service: rng.pick(services),
        registered: false,
        active: true,
      };
      physOf(gas).initialInEquipment += unit.charge;
      truth.units[id] = { leakRatePerYear: Number(unit.leakRate.toFixed(4)), serviceCompany: unit.service };
      units.push(unit);
      if (tier === 'A') {
        ledger.registerTierA(t0, id, gas, nameplate, installedAt, category);
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
    for (const dist of rng.shuffle(distributors)) {
      if (bought >= grams) break;
      if (!distributorStock(t, dist, gas, want - bought)) continue;
      const moved = moveGrams(t, dist, svc, gas, Math.min(want - bought, heldGrams(dist, gas)), classPreference);
      if (moved > 0) invoices.push({ invoice: `inv-${String(invoices.length + 1).padStart(5, '0')}`, date: iso(t), distributor: dist, buyer: svc, gas, grams: moved });
      bought += moved;
    }
    return bought;
  };

  const smuggledSale = (t, svc, gas, grams) => {
    // off-ledger: smuggled gas sold by the overselling distributor; appears only on its invoices
    physOf(gas).smuggledIn += grams;
    truth.offLedger.smuggledByGas[gas] = (truth.offLedger.smuggledByGas[gas] ?? 0) + grams;
    const invoice = `inv-${String(invoices.length + 1).padStart(5, '0')}`;
    invoices.push({ invoice, date: iso(t), distributor: smugglingDistributor, buyer: svc, gas, grams });
    truth.offLedger.invoiceIds.push(invoice); // evaluation only: the invoice itself looks normal
  };

  const registerTierBIfNeeded = (t, svc, unit) => {
    if (unit.registered) return true;
    if (ledger.registerTierB(t, svc, unit.id, unit.modelId, unit.category)) {
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
      if (u.charge >= u.nameplate * p.service.topUpWhenBelowFraction) continue;
      const deficit = u.nameplate - u.charge;
      const svc = u.service;
      const offLedger = isOffLedgerService.has(svc) && !rng.chance(p.fraud.offLedgerTopUps.recordedShare);
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

    // 3) end of life
    for (const u of units) {
      if (!u.active || u.eolMonth !== m) continue;
      u.active = false;
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

    // 4) phantom Tier B recoveries: smuggled virgin gas presented as recovered from fake small units
    for (const svc of truth.fraud.phantomTierBServices) {
      const n = rng.int(p.fraud.phantomTierB.unitsPerMonth[0], p.fraud.phantomTierB.unitsPerMonth[1]);
      for (let k = 0; k < n; k++) {
        const model = rng.pick(models.filter((x) => x.category === 'split_ac'));
        const id = fakeSerial();
        if (!ledger.registerTierB(t, svc, id, model.id, model.category)) continue;
        const g = Math.round(model.grams * rng.uniform(p.fraud.phantomTierB.fractionOfModelCharge[0], p.fraud.phantomTierB.fractionOfModelCharge[1]));
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
        const inflated = isInflatedReclaimer.has(rec);
        if (inflated && rng.chance(p.fraud.inflatedYield.overCapAttemptsPerYear / 12)) {
          // occasional attempt above the 98 % ceiling: rejected by R4
          ledger.reclaim(t, rec, lots.map((l) => l.id), Math.round(inGrams * 1.05), 9_960);
        }
        const range = inflated ? p.fraud.inflatedYield.yield : p.reclaim.honestYield;
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
        const eventId = ledger.destroy(t + 2 * DAY, fac, batch.map((l) => l.id), held, p.destruction.dreBps);
        if (eventId === null) continue;
        const ev = ledger.destructionEvents[eventId];
        if (!ev.eligible) continue;
        // a registry claims it; the international registry only accepts Tier A
        const first = rng.pick(registries);
        const ok = ledger.claim(t + 3 * DAY, first.id, first.acceptsTier, eventId);
        const other = registries.find((r) => r.id !== first.id);
        if (!ok) ledger.claim(t + 3 * DAY, other.id, other.acceptsTier, eventId);
        else if (rng.chance(p.fraud.duplicateClaims.probabilityPerEligibleEvent)) {
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

  const equipment = [...ledger.equipment.entries()].map(([id, e]) => ({
    id, tier: e.tier, gas: e.gas, category: e.category, nameplate_g: e.nameplateGrams,
    installed_at: e.installedAt ? iso(e.installedAt) : '', registered_at: iso(e.registeredAt),
    registered_by: e.registeredBy, model_id: e.modelId ?? '',
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
