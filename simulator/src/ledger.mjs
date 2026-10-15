// In-memory mirror of the on-chain rules (KigaliLedger, EquipmentRegistry, DestructionClaims).
// The simulator only records an event as "accepted" if the real contracts would accept it, and
// rejected attempts carry the same reason names as the Solidity custom errors.

const PERIOD_SECONDS = 30 * 24 * 3600; // EquipmentRegistry.MONTH
const TIER_RANK = { A: 1, B: 2, C: 3 };

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

  createLot(t, { gas, grams, cls, tier = null, holder, origin, parent = 0 }) {
    const id = this.nextLotId++;
    this.lots.set(id, { id, gas, grams, cls, tier, holder, origin, parent, status: 'ACTIVE', pendingTo: null, createdAt: t });
    return id;
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

  mintVirgin(t, importer, quotaId, grams) {
    t = this.tick(t);
    const q = this.quotas.get(quotaId);
    const data = { actor: importer, quotaId, grams };
    if (!q) return this.reject(t, 'MINT', data, 'UnknownQuota');
    if (q.importer !== importer) return this.reject(t, 'MINT', data, 'NotQuotaHolder');
    if (q.used + grams > q.allowed) return this.reject(t, 'MINT', data, 'QuotaExceeded');
    q.used += grams;
    const tot = this.totalsOf(q.gas);
    tot.virginMinted += grams;
    tot.live += grams;
    const lot = this.createLot(t, { gas: q.gas, grams, cls: 'VIRGIN', holder: importer, origin: quotaId });
    this.log(t, 'MINT', { ...data, gas: q.gas, lot });
    return lot;
  }

  // ------------------------------------------------------------------ R2 two-step transfers

  send(t, from, lotId, to, grams) {
    t = this.tick(t);
    const lot = this.lots.get(lotId);
    const data = { actor: from, to, lot: lotId, grams };
    if (!lot || lot.status !== 'ACTIVE') return this.reject(t, 'SEND', data, 'NotActive');
    if (lot.holder !== from) return this.reject(t, 'SEND', data, 'NotHolder');
    if (from === to) return this.reject(t, 'SEND', data, 'SelfTransfer');
    if (grams <= 0) return this.reject(t, 'SEND', data, 'ZeroAmount');
    if (grams > lot.grams) return this.reject(t, 'SEND', data, 'InsufficientGrams');
    let sentId = lotId;
    if (grams < lot.grams) {
      lot.grams -= grams;
      sentId = this.createLot(t, { gas: lot.gas, grams, cls: lot.cls, tier: lot.tier, holder: from, origin: lot.origin, parent: lotId });
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
    lot.status = lot.grams === 0 ? 'CONSUMED' : 'ACTIVE';
    this.log(t, 'RECEIVE', { ...data, sentGrams: sent, gas: lot.gas, ...(discrepancy ? { discrepancy } : {}) });
    return lotId;
  }

  // ------------------------------------------------------------------ equipment

  setModel(t, modelId, gas, chargeGrams) {
    t = this.tick(t);
    this.models.set(modelId, { gas, chargeGrams });
    this.log(t, 'MODEL', { modelId, gas, chargeGrams });
  }

  registerTierA(t, id, gas, nameplateGrams, installedAt, category) {
    t = this.tick(t);
    if (this.equipment.has(id)) return this.reject(t, 'REGISTER_EQUIPMENT', { equipment: id }, 'AlreadyRegistered');
    this.equipment.set(id, this._newUnit({ tier: 'A', gas, nameplateGrams, installedAt, category, registeredAt: t, registeredBy: 'registrar' }));
    this.log(t, 'REGISTER_EQUIPMENT', { equipment: id, tier: 'A', gas, nameplateGrams, installedAt: new Date(installedAt * 1000).toISOString() });
    return id;
  }

  registerTierB(t, service, id, modelId, category) {
    t = this.tick(t);
    const m = this.models.get(modelId);
    if (!m) return this.reject(t, 'REGISTER_EQUIPMENT', { actor: service, equipment: id }, 'UnknownModel');
    if (this.equipment.has(id)) return this.reject(t, 'REGISTER_EQUIPMENT', { actor: service, equipment: id }, 'AlreadyRegistered');
    this.equipment.set(id, this._newUnit({ tier: 'B', gas: m.gas, nameplateGrams: m.chargeGrams, installedAt: 0, category, registeredAt: t, registeredBy: service, modelId }));
    this.log(t, 'REGISTER_EQUIPMENT', { actor: service, equipment: id, tier: 'B', gas: m.gas, nameplateGrams: m.chargeGrams, modelId });
    return id;
  }

  _newUnit(u) {
    return { ...u, charged: 0, recovered: 0, status: 'ACTIVE', charges: [] };
  }

  recoveryCap(id) {
    const e = this.equipment.get(id);
    if (e.tier === 'A') return Math.floor((e.nameplateGrams * (10_000 + this.rules.tierAToleranceBps)) / 10_000);
    return e.nameplateGrams;
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
    e.charges.push({ at: t, grams });
    lot.grams -= grams;
    if (lot.grams === 0) lot.status = 'CONSUMED';
    const tot = this.totalsOf(lot.gas);
    tot.charged += grams;
    tot.live -= grams;
    this.log(t, 'CHARGE', { ...data, gas: lot.gas, cls: lot.cls });
    return true;
  }

  /** R3 + residence rule. Returns { inService, quarantined } lot ids (0 when absent) or null. */
  recover(t, service, eqId, grams, decommission) {
    t = this.tick(t);
    const e = this.equipment.get(eqId);
    const data = { actor: service, equipment: eqId, grams, decommission };
    if (!e) return this.reject(t, 'RECOVER', data, 'UnknownEquipment');
    if (e.status !== 'ACTIVE') return this.reject(t, 'RECOVER', data, 'NotActive');
    if (grams <= 0) return this.reject(t, 'RECOVER', data, 'ZeroAmount');
    const cap = this.recoveryCap(eqId);
    if (e.recovered + grams > cap) return this.reject(t, 'RECOVER', { ...data, cap }, 'RecoveryCapExceeded');
    if (e.tier === 'B') {
      const key = `${service}|${Math.floor(t / PERIOD_SECONDS)}`;
      const used = (this.tierBUsage.get(key) ?? 0) + grams;
      if (used > this.rules.tierBMonthlyCapGrams) return this.reject(t, 'RECOVER', data, 'TierBMonthlyCapExceeded');
      this.tierBUsage.set(key, used);
    }
    e.recovered += grams;
    if (decommission) e.status = 'DECOMMISSIONED';

    const quarantined = this._quarantinedGrams(t, e, grams);
    const inServiceGrams = grams - quarantined;
    const tot = this.totalsOf(e.gas);
    tot.recovered += grams;
    tot.live += grams;
    const inService = inServiceGrams > 0
      ? this.createLot(t, { gas: e.gas, grams: inServiceGrams, cls: 'RECOVERED', tier: e.tier, holder: service, origin: eqId })
      : 0;
    const q = quarantined > 0
      ? this.createLot(t, { gas: e.gas, grams: quarantined, cls: 'RECOVERED', tier: 'C', holder: service, origin: eqId })
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

  reclaim(t, reclaimer, inputs, outGrams, purityBps) {
    t = this.tick(t);
    const data = { actor: reclaimer, inputs, outGrams, purityBps };
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
    for (const lot of lots) lot.status = 'CONSUMED';
    const tot = this.totalsOf(gas);
    tot.live -= inGrams;
    tot.reclaimLoss += inGrams - outGrams;
    tot.live += outGrams;
    const out = this.createLot(t, { gas, grams: outGrams, cls: 'RECLAIMED', tier: worst, holder: reclaimer, origin: `reclaim:${inputs.join('+')}` });
    this.log(t, 'RECLAIM', { ...data, gas, inGrams, outputLot: out, tier: worst });
    return out;
  }

  // ------------------------------------------------------------------ R6 destruction, R7 claims

  destroy(t, facility, inputs, intakeGrams, dreBps) {
    t = this.tick(t);
    const data = { actor: facility, inputs, intakeGrams, dreBps };
    if (inputs.length === 0) return this.reject(t, 'DESTROY', data, 'EmptyInputs');
    if (dreBps < this.rules.minDreBps) return this.reject(t, 'DESTROY', data, 'DreTooLow');
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
    for (const lot of lots) lot.status = 'CONSUMED';
    const tot = this.totalsOf(gas);
    tot.live -= held;
    tot.destroyed += intakeGrams;
    tot.handlingLoss += held - intakeGrams;
    const eventId = this.destructionEvents.length;
    this.destructionEvents.push({ eventId, facility, gas, grams: intakeGrams, eligible, worstTier: eligible ? worst : null, claimedBy: null });
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
