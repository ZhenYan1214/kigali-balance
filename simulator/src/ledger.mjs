// In-memory mirror of the on-chain rules (KigaliLedger, EquipmentRegistry, DestructionClaims).
// The simulator only records an event as "accepted" if the real contracts would accept it, and
// rejected attempts carry the same reason names as the Solidity custom errors. Checks run in the
// same order as on chain, and nothing is mutated before every check has passed.

const PERIOD_SECONDS = 30 * 24 * 3600; // EquipmentRegistry.MONTH
const TIER_RANK = { A: 1, B: 2, C: 3 };

/** A signer label like "scale:service-03" is a scale key bound to that operator (KigaliLedger.deviceOperator). */
const deviceOperator = (signer) => (signer.startsWith('scale:') ? signer.slice('scale:'.length) : null);

export class LedgerMirror {
  constructor(rules) {
    this.rules = rules;
    this.residenceSeconds = rules.minResidenceDays * 24 * 3600;
    this.lots = new Map();
    this.nextLotId = 1;
    this.quotas = new Map();
    this.equipment = new Map();
    this.models = new Map();
    this.tierBUsage = new Map();
    this.destructionEvents = [];
    this.totals = new Map();
    this.events = [];
    this.seq = 0;
    this.now = 0;
    this.owners = new Set(); // accounts holding EQUIPMENT_OWNER
    this.verifiers = new Set(); // accounts holding VERIFIER
    this.cylinders = new Map(); // cylinderId => open (ACTIVE or IN_TRANSIT) lots
    this.nextCylinder = 1;
  }

  // ------------------------------------------------------------------ roles (granted by governance; no events)

  addOwner(id) {
    this.owners.add(id);
  }

  addVerifier(id) {
    this.verifiers.add(id);
  }

  // ------------------------------------------------------------------ bookkeeping

  /** Block-like clock: time never goes backwards and consecutive operations are >= 60 s apart. */
  tick(t) {
    this.now = Math.max(this.now + 60, t);
    return this.now;
  }

  totalsOf(gas) {
    if (!this.totals.has(gas)) {
      this.totals.set(gas, {
        virginMinted: 0, unknownDeclared: 0, recovered: 0, live: 0,
        charged: 0, destroyed: 0, reclaimLoss: 0, handlingLoss: 0,
      });
    }
    return this.totals.get(gas);
  }

  log(t, type, data, status = 'accepted', reason = undefined) {
    const ev = { seq: ++this.seq, t: new Date(t * 1000).toISOString(), type, status, ...data };
    if (reason) ev.reason = reason;
    this.events.push(ev);
    return ev;
  }

  reject(t, type, data, reason) {
    this.log(t, type, data, 'rejected', reason);
    return null;
  }

  /** A fresh physical cylinder ID. */
  newCylinder() {
    return `cyl-${String(this.nextCylinder++).padStart(6, '0')}`;
  }

  openLotsIn(cylinder) {
    return this.cylinders.get(cylinder) ?? 0;
  }

  createLot(t, { gas, grams, cls, tier = null, holder, origin, parent = 0, cylinder }) {
    const id = this.nextLotId++;
    this.lots.set(id, { id, gas, grams, cls, tier, holder, origin, parent, cylinder, status: 'ACTIVE', pendingTo: null, createdAt: t });
    this.cylinders.set(cylinder, this.openLotsIn(cylinder) + 1);
    return id;
  }

  /** The lot leaves circulation (emptied, reclaimed or destroyed) and frees its cylinder. */
  closeLot(lot) {
    lot.status = 'CONSUMED';
    this.cylinders.set(lot.cylinder, this.openLotsIn(lot.cylinder) - 1);
  }

  activeLotsOf(holder, filter = () => true) {
    const out = [];
    for (const lot of this.lots.values()) {
      if (lot.status === 'ACTIVE' && lot.holder === holder && lot.grams > 0 && filter(lot)) out.push(lot);
    }
    return out;
  }

  // ------------------------------------------------------------------ R1 quota-backed supply

  registerQuota(t, quotaId, importer, gas, grams) {
    t = this.tick(t);
    this.quotas.set(quotaId, { importer, gas, allowed: grams, used: 0 });
    this.log(t, 'QUOTA', { quotaId, importer, gas, grams });
  }

  mintVirgin(t, importer, quotaId, grams, cylinder = this.newCylinder()) {
    t = this.tick(t);
    const q = this.quotas.get(quotaId);
    const data = { actor: importer, quotaId, grams, cylinder };
    if (!q) return this.reject(t, 'MINT', data, 'UnknownQuota');
    if (q.importer !== importer) return this.reject(t, 'MINT', data, 'NotQuotaHolder');
    if (q.used + grams > q.allowed) return this.reject(t, 'MINT', data, 'QuotaExceeded');
    if (this.openLotsIn(cylinder) > 0) return this.reject(t, 'MINT', data, 'CylinderInUse');
    q.used += grams;
    const tot = this.totalsOf(q.gas);
    tot.virginMinted += grams;
    tot.live += grams;
    const lot = this.createLot(t, { gas: q.gas, grams, cls: 'VIRGIN', holder: importer, origin: quotaId, cylinder });
    this.log(t, 'MINT', { ...data, gas: q.gas, lot });
    return lot;
  }

  // ------------------------------------------------------------------ R2 two-step transfers

  send(t, from, lotId, to, grams, newCylinder = this.newCylinder()) {
    t = this.tick(t);
    const lot = this.lots.get(lotId);
    const data = { actor: from, to, lot: lotId, grams, newCylinder };
    if (!lot || lot.status !== 'ACTIVE') return this.reject(t, 'SEND', data, 'NotActive');
    if (lot.holder !== from) return this.reject(t, 'SEND', data, 'NotHolder');
    if (from === to) return this.reject(t, 'SEND', data, 'SelfTransfer');
    if (grams <= 0) return this.reject(t, 'SEND', data, 'ZeroAmount');
    if (grams > lot.grams) return this.reject(t, 'SEND', data, 'InsufficientGrams');
    const split = grams < lot.grams;
    if (split && this.openLotsIn(newCylinder) > 0) return this.reject(t, 'SEND', data, 'CylinderInUse');
    let sentId = lotId;
    if (split) {
      lot.grams -= grams;
      sentId = this.createLot(t, { gas: lot.gas, grams, cls: lot.cls, tier: lot.tier, holder: from, origin: lot.origin, parent: lotId, cylinder: newCylinder });
    }
    const s = this.lots.get(sentId);
    s.status = 'IN_TRANSIT';
    s.pendingTo = to;
    this.log(t, 'SEND', { ...data, sentLot: sentId, gas: s.gas, cls: s.cls, tier: s.tier });
    return sentId;
  }

  receive(t, to, lotId, weighed) {
    t = this.tick(t);
    const lot = this.lots.get(lotId);
    const data = { actor: to, lot: lotId, weighed };
    if (!lot || lot.status !== 'IN_TRANSIT' || lot.pendingTo !== to) return this.reject(t, 'RECEIVE', data, 'NotPendingRecipient');
    const sent = lot.grams;
    const tolerance = Math.floor((sent * this.rules.transferToleranceBps) / 10_000);
    let discrepancy = null;
    if (weighed < sent) {
      const loss = sent - weighed;
      lot.grams = weighed;
      const tot = this.totalsOf(lot.gas);
      tot.handlingLoss += loss;
      tot.live -= loss;
      if (loss > tolerance) discrepancy = 'UNDERWEIGHT_ON_RECEIPT';
    } else if (weighed - sent > tolerance) {
      discrepancy = 'OVERWEIGHT_ON_RECEIPT';
    }
    lot.holder = to;
    lot.pendingTo = null;
    if (lot.grams === 0) this.closeLot(lot);
    else lot.status = 'ACTIVE';
    this.log(t, 'RECEIVE', { ...data, sentGrams: sent, gas: lot.gas, ...(discrepancy ? { discrepancy } : {}) });
    return lotId;
  }

  // ------------------------------------------------------------------ equipment

  setModel(t, modelId, gas, chargeGrams) {
    t = this.tick(t);
    this.models.set(modelId, { gas, chargeGrams });
    this.log(t, 'MODEL', { modelId, gas, chargeGrams });
  }

  registerTierA(t, id, gas, nameplateGrams, installedAt, category, owner) {
    t = this.tick(t);
    const data = { equipment: id, tier: 'A', gas, nameplateGrams, installedAt: new Date(installedAt * 1000).toISOString(), owner };
    if (nameplateGrams <= 0) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'ZeroAmount');
    if (installedAt > t) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'InstalledInFuture');
    if (!this.owners.has(owner)) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'NotEquipmentOwner');
    if (this.equipment.has(id)) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'AlreadyRegistered');
    this.equipment.set(id, this._newUnit({ tier: 'A', gas, nameplateGrams, installedAt, category, registeredAt: t, registeredBy: 'registrar', owner }));
    this.log(t, 'REGISTER_EQUIPMENT', data);
    return id;
  }

  registerTierB(t, service, id, modelId, category, owner) {
    t = this.tick(t);
    const m = this.models.get(modelId);
    const data = { actor: service, equipment: id, tier: 'B', modelId, owner };
    if (!m) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'UnknownModel');
    if (!this.owners.has(owner)) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'NotEquipmentOwner');
    if (owner === service) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'OwnerNotIndependent');
    if (this.equipment.has(id)) return this.reject(t, 'REGISTER_EQUIPMENT', data, 'AlreadyRegistered');
    this.equipment.set(id, this._newUnit({ tier: 'B', gas: m.gas, nameplateGrams: m.chargeGrams, installedAt: 0, category, registeredAt: t, registeredBy: service, modelId, owner }));
    this.log(t, 'REGISTER_EQUIPMENT', { ...data, gas: m.gas, nameplateGrams: m.chargeGrams });
    return id;
  }

  _newUnit(u) {
    return { ...u, charged: 0, recovered: 0, drawn: 0, status: 'ACTIVE', charges: [] };
  }

  /** What the unit can physically hold: one nameplate charge (Tier A with tolerance). */
  maxPerRecovery(id) {
    const e = this.equipment.get(id);
    return e.tier === 'A' ? Math.floor((e.nameplateGrams * (10_000 + this.rules.tierAToleranceBps)) / 10_000) : e.nameplateGrams;
  }

  /** What can still be recovered now: one charge, minus recoveries, plus recorded top-ups, capped at one charge. */
  bookedContent(id) {
    const full = this.maxPerRecovery(id);
    return Math.max(0, full - this.equipment.get(id).drawn);
  }

  /** Lifetime cap: one charge plus every top-up charged through the ledger (coarser second check). */
  recoveryCap(id) {
    return this.maxPerRecovery(id) + this.equipment.get(id).charged;
  }

  charge(t, service, lotId, eqId, grams) {
    t = this.tick(t);
    const lot = this.lots.get(lotId);
    const e = this.equipment.get(eqId);
    const data = { actor: service, lot: lotId, equipment: eqId, grams };
    if (!lot || lot.status !== 'ACTIVE') return this.reject(t, 'CHARGE', data, 'NotActive');
    if (lot.holder !== service) return this.reject(t, 'CHARGE', data, 'NotHolder');
    if (grams <= 0 || grams > lot.grams) return this.reject(t, 'CHARGE', data, 'InsufficientGrams');
    if (!e) return this.reject(t, 'CHARGE', data, 'UnknownEquipment');
    if (e.status !== 'ACTIVE') return this.reject(t, 'CHARGE', data, 'NotActive');
    if (e.gas !== lot.gas) return this.reject(t, 'CHARGE', data, 'GasMismatch');
    e.charged += grams;
    e.drawn = Math.max(0, e.drawn - grams);
    e.charges.push({ at: t, grams });
    lot.grams -= grams;
    if (lot.grams === 0) this.closeLot(lot);
    const tot = this.totalsOf(lot.gas);
    tot.charged += grams;
    tot.live -= grams;
    this.log(t, 'CHARGE', { ...data, gas: lot.gas, cls: lot.cls });
    return true;
  }

  /**
   * R3 + residence rule + owner consent + cylinder uniqueness.
   * `consentSigner` defaults to the unit's registered owner (an honest recovery).
   * Returns { inService, quarantined } lot ids (0 when absent) or null.
   */
  recover(t, service, eqId, grams, decommission, { consentSigner, cylinder = this.newCylinder() } = {}) {
    t = this.tick(t);
    const e = this.equipment.get(eqId);
    const signer = consentSigner ?? e?.owner ?? 'nobody';
    const data = { actor: service, equipment: eqId, grams, decommission, cylinder, consentSigner: signer };
    // EquipmentRegistry.recordRecovery
    if (!e) return this.reject(t, 'RECOVER', data, 'UnknownEquipment');
    if (e.status !== 'ACTIVE') return this.reject(t, 'RECOVER', data, 'NotActive');
    if (grams <= 0) return this.reject(t, 'RECOVER', data, 'ZeroAmount');
    const content = this.bookedContent(eqId);
    if (grams > content) return this.reject(t, 'RECOVER', { ...data, bookedContent: content }, 'RecoveryExceedsContent');
    const cap = this.recoveryCap(eqId);
    if (e.recovered + grams > cap) return this.reject(t, 'RECOVER', { ...data, cap }, 'RecoveryCapExceeded');
    const periodKey = `${service}|${Math.floor(t / PERIOD_SECONDS)}`;
    const tierBUsed = (this.tierBUsage.get(periodKey) ?? 0) + grams;
    if (e.tier === 'B' && tierBUsed > this.rules.tierBMonthlyCapGrams) return this.reject(t, 'RECOVER', data, 'TierBMonthlyCapExceeded');
    // KigaliLedger._verifyConsent
    if (signer !== e.owner || !this.owners.has(signer)) return this.reject(t, 'RECOVER', data, 'NotUnitOwner');
    if (signer === service || deviceOperator(signer) === service) return this.reject(t, 'RECOVER', data, 'OwnerNotIndependent');

    const quarantined = this._quarantinedGrams(t, e, grams);
    const inServiceGrams = grams - quarantined;
    // KigaliLedger._createRaw: the first lot needs an empty cylinder; a quarantined second part joins it
    if (this.openLotsIn(cylinder) > 0) return this.reject(t, 'RECOVER', data, 'CylinderInUse');

    if (e.tier === 'B') this.tierBUsage.set(periodKey, tierBUsed);
    e.recovered += grams;
    e.drawn += grams;
    if (decommission) e.status = 'DECOMMISSIONED';
    const tot = this.totalsOf(e.gas);
    tot.recovered += grams;
    tot.live += grams;
    const inService = inServiceGrams > 0
      ? this.createLot(t, { gas: e.gas, grams: inServiceGrams, cls: 'RECOVERED', tier: e.tier, holder: service, origin: eqId, cylinder })
      : 0;
    const q = quarantined > 0
      ? this.createLot(t, { gas: e.gas, grams: quarantined, cls: 'RECOVERED', tier: 'C', holder: service, origin: eqId, cylinder })
      : 0;
    this.log(t, 'RECOVER', { ...data, gas: e.gas, tier: e.tier, inServiceLot: inService, inServiceGrams, quarantinedLot: q, quarantinedGrams: quarantined });
    return { inService, quarantined: q };
  }

  _quarantinedGrams(t, e, grams) {
    if (e.installedAt !== 0 && t - e.installedAt < this.residenceSeconds) return grams;
    let recent = 0;
    for (let i = e.charges.length; i > 0; i--) {
      if (t - e.charges[i - 1].at >= this.residenceSeconds) break;
      recent += e.charges[i - 1].grams;
    }
    return Math.min(recent, grams);
  }

  // ------------------------------------------------------------------ R4 + R5 reclamation

  reclaim(t, reclaimer, inputs, outGrams, purityBps, outputCylinder = this.newCylinder()) {
    t = this.tick(t);
    const data = { actor: reclaimer, inputs, outGrams, purityBps, outputCylinder };
    if (inputs.length === 0) return this.reject(t, 'RECLAIM', data, 'EmptyInputs');
    if (new Set(inputs).size !== inputs.length) return this.reject(t, 'RECLAIM', data, 'DuplicateInput');
    const lots = inputs.map((id) => this.lots.get(id));
    const gas = lots[0]?.gas;
    let inGrams = 0;
    let worst = 'A';
    for (const lot of lots) {
      if (!lot || lot.status !== 'ACTIVE') return this.reject(t, 'RECLAIM', data, 'NotActive');
      if (lot.holder !== reclaimer) return this.reject(t, 'RECLAIM', data, 'NotHolder');
      if (lot.cls !== 'RECOVERED') return this.reject(t, 'RECLAIM', data, 'ClassNotReclaimable');
      if (lot.tier === 'C') return this.reject(t, 'RECLAIM', data, 'TierNotReclaimable');
      if (lot.gas !== gas) return this.reject(t, 'RECLAIM', data, 'GasMismatch');
      inGrams += lot.grams;
      if (TIER_RANK[lot.tier] > TIER_RANK[worst]) worst = lot.tier;
    }
    const maxOut = Math.floor((inGrams * (10_000 - this.rules.minReclaimLossBps)) / 10_000);
    if (outGrams <= 0) return this.reject(t, 'RECLAIM', data, 'ZeroAmount');
    if (outGrams > maxOut) return this.reject(t, 'RECLAIM', { ...data, inGrams, maxOut }, 'ReclaimExceedsInput');
    if (purityBps < this.rules.minReclaimPurityBps) return this.reject(t, 'RECLAIM', data, 'PurityTooLow');
    // the inputs are emptied first, so the output may go into one of their cylinders
    const freed = lots.filter((l) => l.cylinder === outputCylinder).length;
    if (this.openLotsIn(outputCylinder) - freed > 0) return this.reject(t, 'RECLAIM', data, 'CylinderInUse');
    for (const lot of lots) this.closeLot(lot);
    const tot = this.totalsOf(gas);
    tot.live -= inGrams;
    tot.reclaimLoss += inGrams - outGrams;
    tot.live += outGrams;
    const out = this.createLot(t, { gas, grams: outGrams, cls: 'RECLAIMED', tier: worst, holder: reclaimer, origin: `reclaim:${inputs.join('+')}`, cylinder: outputCylinder });
    this.log(t, 'RECLAIM', { ...data, gas, inGrams, outputLot: out, tier: worst });
    return out;
  }

  // ------------------------------------------------------------------ R6 destruction, R7 claims

  /** `verifier` signs the destruction certificate; `certGrams` defaults to the intake weighing. */
  destroy(t, facility, inputs, intakeGrams, dreBps, { verifier, certGrams = intakeGrams } = {}) {
    t = this.tick(t);
    const data = { actor: facility, inputs, intakeGrams, dreBps, verifier, certGrams };
    if (inputs.length === 0) return this.reject(t, 'DESTROY', data, 'EmptyInputs');
    if (certGrams !== intakeGrams) return this.reject(t, 'DESTROY', data, 'CertificateMismatch');
    if (dreBps < this.rules.minDreBps) return this.reject(t, 'DESTROY', data, 'DreTooLow');
    if (!this.verifiers.has(verifier)) return this.reject(t, 'DESTROY', data, 'NotVerifier');
    if (verifier === facility || deviceOperator(verifier) === facility) return this.reject(t, 'DESTROY', data, 'VerifierNotIndependent');
    if (new Set(inputs).size !== inputs.length) return this.reject(t, 'DESTROY', data, 'DuplicateInput');
    const lots = inputs.map((id) => this.lots.get(id));
    const gas = lots[0]?.gas;
    let held = 0;
    let eligible = true;
    let worst = 'A';
    for (const lot of lots) {
      if (!lot || lot.status !== 'ACTIVE') return this.reject(t, 'DESTROY', data, 'NotActive');
      if (lot.holder !== facility) return this.reject(t, 'DESTROY', data, 'NotHolder');
      if (lot.gas !== gas) return this.reject(t, 'DESTROY', data, 'GasMismatch');
      held += lot.grams;
      if (lot.cls !== 'RECOVERED' || lot.tier === 'C') eligible = false;
      if (lot.tier && TIER_RANK[lot.tier] > TIER_RANK[worst]) worst = lot.tier;
    }
    if (intakeGrams <= 0) return this.reject(t, 'DESTROY', data, 'ZeroAmount');
    if (intakeGrams > held) return this.reject(t, 'DESTROY', { ...data, held }, 'DestroyExceedsHeld');
    for (const lot of lots) this.closeLot(lot);
    const tot = this.totalsOf(gas);
    tot.live -= held;
    tot.destroyed += intakeGrams;
    tot.handlingLoss += held - intakeGrams;
    const eventId = this.destructionEvents.length;
    this.destructionEvents.push({ eventId, facility, gas, grams: intakeGrams, eligible, worstTier: eligible ? worst : null, claimedBy: null, verifier });
    this.log(t, 'DESTROY', { ...data, gas, held, eventId, creditEligible: eligible, worstTier: eligible ? worst : null });
    return eventId;
  }

  claim(t, registry, acceptsTier, eventId) {
    t = this.tick(t);
    const ev = this.destructionEvents[eventId];
    const data = { actor: registry, eventId };
    if (!ev) return this.reject(t, 'CLAIM', data, 'UnknownEvent');
    if (!ev.eligible) return this.reject(t, 'CLAIM', data, 'NotCreditEligible');
    if (ev.claimedBy) return this.reject(t, 'CLAIM', { ...data, claimedBy: ev.claimedBy }, 'AlreadyClaimed');
    if (TIER_RANK[ev.worstTier] > TIER_RANK[acceptsTier]) return this.reject(t, 'CLAIM', data, 'TierNotAccepted');
    ev.claimedBy = registry;
    this.log(t, 'CLAIM', { ...data, gas: ev.gas, grams: ev.grams });
    return true;
  }
}
