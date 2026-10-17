#!/usr/bin/env node
// Export the provenance chain of Kigali Balance lots as GS1 EPCIS 2.0 JSON-LD documents.
//
//   node epcis/export_epcis.mjs                  # the example set -> ../web/data/epcis/
//   node epcis/export_epcis.mjs --lot 42 --lot 43 [--out dir] [--sim dir] [--stdout]
//
// Reads only the observation files (ledger_events.jsonl, equipment.csv, actors.csv; optionally the
// example list in web/data/sim.json). The simulator's ground truth is never read. Only accepted ledger
// events are exported: a rejected attempt did not happen, so it is not an EPCIS event.
// Output is deterministic: no wall-clock time; creationDate is the time of the last ledger event.
// Mapping and identifier choices: epcis/README.md. All data is simulated.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SIM_ROOT = resolve(here, '..');
export const REPO_ROOT = resolve(SIM_ROOT, '..');
export const DEFAULT_SIM_DIR = resolve(SIM_ROOT, 'out');
export const DEFAULT_OUT_DIR = resolve(REPO_ROOT, 'web/data/epcis');
export const SCHEMA_PATH = resolve(here, 'schema/epcis-json-schema.json');

// ------------------------------------------------------------------ identifiers and vocabulary

/** Project namespace: the project's own GitHub Pages origin, so the URIs are under a domain it controls. */
export const NS_BASE = 'https://zhenyan1214.github.io/kigali-balance/';
/** User-extension namespace (EPCIS 2.0 section 7.1.12 / JSON-LD prefix "kb"). */
export const KB = `${NS_BASE}ns/epcis#`;
export const EPCIS_CONTEXT = 'https://ref.gs1.org/standards/epcis/2.0.1/epcis-context.jsonld';
export const SCHEMA_VERSION = '2.0';

const id = (ledger) => {
  const base = `${NS_BASE}id/${ledger}/`;
  return {
    lot: (n) => `${base}lot/${n}`,
    cylinder: (c) => `${base}cylinder/${encodeURIComponent(c)}`,
    equipment: (e) => `${base}equipment/${encodeURIComponent(e)}`,
    party: (p) => `${base}party/${encodeURIComponent(p)}`,
    event: (seq, k = 0) => `${base}event/${seq}${k ? `.${k}` : ''}`,
    destruction: (n) => `${base}destruction/${n}`,
    claim: (n) => `${base}destruction/${n}/claim`,
    quota: (q) => `${base}quota/${encodeURIComponent(q)}`,
  };
};

/** Non-CBV terms, used only where CBV 2.0 has no fitting value (see README "Gaps"). */
export const KB_VOCAB = {
  bizStepReclaiming: `${KB}BizStep-reclaiming`,
  bizStepDesignating: `${KB}BizStep-designating_registry`,
  bizStepClaiming: `${KB}BizStep-claiming_destruction_credit`,
  bttCreditClaim: `${KB}BTT-destruction_credit_claim`,
  vtypeEquipment: `${KB}vtype-Equipment`,
  vtypeParty: `${KB}vtype-Party`,
};
const VTYPE_EPCCLASS = 'urn:epcglobal:epcis:vtype:EPCClass';

const kg = (grams) => grams / 1000; // integer grams -> kg; exact for display, no accumulated float error
const q = (classUri, grams) => ({ epcClass: classUri, quantity: kg(grams), uom: 'KGM' });

// ------------------------------------------------------------------ observation files

function csv(path) {
  if (!existsSync(path)) return [];
  const [head, ...rows] = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  const keys = head.split(',');
  return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) => [keys[i], v])));
}

export function loadObservations(simDir = DEFAULT_SIM_DIR) {
  const events = readFileSync(resolve(simDir, 'ledger_events.jsonl'), 'utf8')
    .split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l))
    .sort((a, b) => a.seq - b.seq);
  const actors = Object.fromEntries(csv(resolve(simDir, 'actors.csv')).map((a) => [a.id, a]));
  const equipment = Object.fromEntries(csv(resolve(simDir, 'equipment.csv')).map((e) => [e.id, e]));
  return { events, actors, equipment };
}

// ------------------------------------------------------------------ replay (lot state from accepted events)

/**
 * Rebuild every lot from the accepted events, recording what each event did to each lot so the export
 * can state quantities the events themselves do not carry (e.g. each reclaim input's grams).
 */
export function replay(events) {
  const lots = new Map();
  const touches = new Map(); // lot -> [seq] of accepted events that touch it
  const effects = new Map(); // seq -> per-event derived quantities
  const destroySeqByEvent = new Map();
  const claimsByEvent = new Map(); // destruction eventId -> [seq] (DESIGNATE, CLAIM)
  const touch = (lot, seq) => {
    if (!touches.has(lot)) touches.set(lot, []);
    const t = touches.get(lot);
    if (t.at(-1) !== seq) t.push(seq);
  };
  const create = (lotId, e, f) => {
    if (lots.has(lotId)) throw new Error(`seq ${e.seq}: lot ${lotId} created twice`);
    const lot = { id: lotId, createdSeq: e.seq, createdAt: e.t, g0: f.grams, grams: f.grams, status: 'ACTIVE', ...f };
    lots.set(lotId, lot);
    touch(lotId, e.seq);
    return lot;
  };
  const get = (lotId, e) => {
    const lot = lots.get(lotId);
    if (!lot) throw new Error(`seq ${e.seq} (${e.type}): unknown lot ${lotId}`);
    return lot;
  };

  for (const e of events) {
    if (e.status !== 'accepted') continue;
    switch (e.type) {
      case 'MINT':
        create(e.lot, e, { gas: e.gas, grams: e.grams, cls: 'VIRGIN', tier: null, holder: e.actor, cylinder: e.cylinder, parent: 0, inputs: null, origin: { kind: 'MINT', quota: e.quotaId } });
        break;
      case 'SEND': {
        const lot = get(e.lot, e);
        let sent = lot;
        if (e.sentLot !== e.lot) {
          const before = lot.grams;
          lot.grams -= e.grams;
          touch(lot.id, e.seq);
          sent = create(e.sentLot, e, { gas: lot.gas, grams: e.grams, cls: lot.cls, tier: lot.tier, holder: e.actor, cylinder: e.newCylinder, parent: lot.id, inputs: null, origin: lot.origin });
          effects.set(e.seq, { split: true, parentBefore: before });
        } else {
          effects.set(e.seq, { split: false });
        }
        if (sent.grams !== e.grams) throw new Error(`seq ${e.seq}: sent ${e.grams} g but lot ${sent.id} holds ${sent.grams} g`);
        sent.status = 'IN_TRANSIT';
        sent.pendingTo = e.to;
        touch(sent.id, e.seq);
        break;
      }
      case 'RECEIVE': {
        const lot = get(e.lot, e);
        const before = lot.grams;
        if (e.weighed < lot.grams) lot.grams = e.weighed; // underweight: the difference is handling loss
        lot.holder = e.actor;
        lot.status = lot.grams === 0 ? 'CLOSED' : 'ACTIVE';
        effects.set(e.seq, { before, after: lot.grams });
        touch(lot.id, e.seq);
        break;
      }
      case 'CHARGE': {
        const lot = get(e.lot, e);
        lot.grams -= e.grams;
        if (lot.grams < 0) throw new Error(`seq ${e.seq}: lot ${lot.id} negative`);
        if (lot.grams === 0) lot.status = 'CLOSED';
        touch(lot.id, e.seq);
        break;
      }
      case 'RECOVER': {
        const base = { gas: e.gas, cls: 'RECOVERED', holder: e.actor, cylinder: e.cylinder, parent: 0, inputs: null, origin: { kind: 'RECOVER', equipment: e.equipment, unitTier: e.tier } };
        if (e.inServiceLot) create(e.inServiceLot, e, { ...base, grams: e.inServiceGrams, tier: e.tier });
        if (e.quarantinedLot) create(e.quarantinedLot, e, { ...base, grams: e.quarantinedGrams, tier: 'C' });
        break;
      }
      case 'RECLAIM': {
        const inputs = e.inputs.map((n) => {
          const lot = get(n, e);
          const g = lot.grams;
          lot.grams = 0;
          lot.status = 'CLOSED';
          lot.consumedBy = { kind: 'RECLAIM', seq: e.seq, outputLot: e.outputLot };
          touch(n, e.seq);
          return { lot: n, grams: g };
        });
        const inGrams = inputs.reduce((s, x) => s + x.grams, 0);
        if (e.inGrams !== undefined && e.inGrams !== inGrams) throw new Error(`seq ${e.seq}: reclaim inGrams ${e.inGrams} != replayed ${inGrams}`);
        effects.set(e.seq, { inputs, inGrams });
        create(e.outputLot, e, { gas: e.gas, grams: e.outGrams, cls: 'RECLAIMED', tier: e.tier, holder: e.actor, cylinder: e.outputCylinder, parent: 0, inputs: [...e.inputs], origin: { kind: 'RECLAIM', purityBps: e.purityBps } });
        break;
      }
      case 'DESTROY': {
        const inputs = e.inputs.map((n) => {
          const lot = get(n, e);
          const g = lot.grams;
          lot.grams = 0;
          lot.status = 'CLOSED';
          lot.consumedBy = { kind: 'DESTROY', seq: e.seq, eventId: e.eventId };
          touch(n, e.seq);
          return { lot: n, grams: g };
        });
        const held = inputs.reduce((s, x) => s + x.grams, 0);
        if (e.held !== undefined && e.held !== held) throw new Error(`seq ${e.seq}: destroy held ${e.held} != replayed ${held}`);
        effects.set(e.seq, { inputs, held });
        destroySeqByEvent.set(e.eventId, e.seq);
        break;
      }
      case 'DESIGNATE':
      case 'CLAIM':
        if (!claimsByEvent.has(e.eventId)) claimsByEvent.set(e.eventId, []);
        claimsByEvent.get(e.eventId).push(e.seq);
        break;
      default:
        break; // QUOTA, MODEL, REGISTER_EQUIPMENT and any future type: master data or not lot-related
    }
  }
  return { lots, touches, effects, destroySeqByEvent, claimsByEvent };
}

/** The lot and every ancestor (split parent, reclaim inputs), back to a MINT or a RECOVER. Sorted ids. */
export function provenance(lotId, state) {
  const seen = new Set();
  const stack = [lotId];
  while (stack.length) {
    const n = stack.pop();
    if (seen.has(n)) continue;
    const lot = state.lots.get(n);
    if (!lot) throw new Error(`unknown lot ${n}`);
    seen.add(n);
    if (lot.parent) stack.push(lot.parent);
    if (lot.inputs) stack.push(...lot.inputs);
  }
  return [...seen].sort((a, b) => a - b);
}

// ------------------------------------------------------------------ event mapping

function partyRef(I, obs, who) {
  if (!who) return null;
  // a device key "scale:<operator>" signs for its operator (KigaliLedger.deviceOperator)
  const device = who.startsWith('scale:') ? who.slice('scale:'.length) : null;
  const role = obs.actors[device ?? who]?.role ?? null;
  return { 'kb:party': I.party(device ?? who), 'kb:role': role, ...(device ? { 'kb:device': I.party(who) } : {}) };
}

const common = (I, e, k = 0) => ({
  eventTime: new Date(e.t).toISOString(),
  eventTimeZoneOffset: '+00:00',
  eventID: I.event(e.seq, k),
});

const ledgerRef = (e) => ({ 'kb:ledgerSeq': e.seq, 'kb:ledgerEventType': e.type });

/** Map one accepted ledger event to zero or more EPCIS events (in a fixed order). */
function mapEvent(e, ctx) {
  const { I, obs, state, chain } = ctx;
  const fx = state.effects.get(e.seq);
  const lotOf = (n) => state.lots.get(n);
  const actor = { 'kb:actor': partyRef(I, obs, e.actor) };
  const out = [];
  switch (e.type) {
    case 'MINT': {
      out.push({
        type: 'ObjectEvent', ...common(I, e),
        quantityList: [q(I.lot(e.lot), e.grams)],
        action: 'ADD', bizStep: 'commissioning', disposition: 'active',
        ilmd: lotMaster(I, lotOf(e.lot)),
        ...ledgerRef(e), ...actor,
        'kb:quota': I.quota(e.quotaId),
      });
      break;
    }
    case 'SEND': {
      const sent = lotOf(e.sentLot);
      if (fx.split && chain.has(e.lot)) {
        out.push({
          type: 'TransformationEvent', ...common(I, e, 1),
          inputQuantityList: [q(I.lot(e.lot), e.grams)],
          outputQuantityList: [q(I.lot(e.sentLot), e.grams)],
          bizStep: 'repackaging',
          ilmd: lotMaster(I, sent),
          ...ledgerRef(e), ...actor,
          'kb:note': 'Part of the parent lot is decanted into a new cylinder and becomes a new lot (ledger split before a transfer).',
        });
      }
      if (chain.has(e.sentLot)) {
        out.push({
          type: 'ObjectEvent', ...common(I, e, fx.split ? 2 : 0),
          epcList: [I.cylinder(sent.cylinder)],
          quantityList: [q(I.lot(e.sentLot), e.grams)],
          action: 'OBSERVE', bizStep: 'shipping', disposition: 'in_transit',
          sourceList: [{ type: 'possessing_party', source: I.party(e.actor) }],
          destinationList: [{ type: 'possessing_party', destination: I.party(e.to) }],
          ...ledgerRef(e), ...actor,
        });
      }
      break;
    }
    case 'RECEIVE': {
      const lot = lotOf(e.lot);
      const loss = fx.before - fx.after;
      out.push({
        type: 'ObjectEvent', ...common(I, e),
        epcList: [I.cylinder(lot.cylinder)],
        quantityList: [q(I.lot(e.lot), e.weighed)],
        action: 'OBSERVE', bizStep: 'receiving', disposition: 'in_progress',
        sourceList: [{ type: 'possessing_party', source: I.party(lotSender(state, e)) }],
        destinationList: [{ type: 'possessing_party', destination: I.party(e.actor) }],
        sensorElementList: [{ sensorReport: [{ type: 'Mass', value: kg(e.weighed), uom: 'KGM' }] }],
        ...ledgerRef(e), ...actor,
        'kb:sentQuantityKg': kg(e.sentGrams),
        'kb:bookedQuantityKg': kg(fx.after),
        ...(loss > 0 ? { 'kb:handlingLossKg': kg(loss) } : {}),
        ...(e.discrepancy ? { 'kb:discrepancy': e.discrepancy } : {}),
      });
      break;
    }
    case 'CHARGE': {
      out.push({
        type: 'AggregationEvent', ...common(I, e),
        parentID: I.equipment(e.equipment),
        childQuantityList: [q(I.lot(e.lot), e.grams)],
        action: 'ADD', bizStep: 'installing',
        ...ledgerRef(e), ...actor,
        'kb:provenanceClass': e.cls ?? lotOf(e.lot).cls,
      });
      break;
    }
    case 'RECOVER': {
      const made = [];
      if (e.inServiceLot) made.push([e.inServiceLot, e.inServiceGrams]);
      if (e.quarantinedLot) made.push([e.quarantinedLot, e.quarantinedGrams]);
      out.push({
        type: 'AggregationEvent', ...common(I, e),
        parentID: I.equipment(e.equipment),
        childQuantityList: made.map(([n, g]) => q(I.lot(n), g)),
        action: 'DELETE', bizStep: 'removing',
        ...ledgerRef(e), ...actor,
        'kb:recoveredLots': made.map(([n]) => lotMaster(I, lotOf(n))),
        'kb:attestations': [{ 'kb:attests': 'ownerConsent', ...partyRef(I, obs, e.consentSigner) }],
        'kb:unitTier': e.tier,
        'kb:quarantinedQuantityKg': kg(e.quarantinedGrams ?? 0),
        'kb:decommission': Boolean(e.decommission),
      });
      if (e.decommission) {
        out.push({
          type: 'ObjectEvent', ...common(I, e, 1),
          epcList: [I.equipment(e.equipment)],
          action: 'DELETE', bizStep: 'decommissioning',
          ...ledgerRef(e), ...actor,
          'kb:note': 'The unit is retired with this recovery (EquipmentRegistry status DECOMMISSIONED).',
        });
      }
      break;
    }
    case 'RECLAIM': {
      out.push({
        type: 'TransformationEvent', ...common(I, e),
        inputQuantityList: fx.inputs.map((x) => q(I.lot(x.lot), x.grams)),
        outputQuantityList: [q(I.lot(e.outputLot), e.outGrams)],
        bizStep: KB_VOCAB.bizStepReclaiming, disposition: 'available',
        ilmd: lotMaster(I, lotOf(e.outputLot)),
        ...ledgerRef(e), ...actor,
        'kb:inputQuantityKg': kg(fx.inGrams),
        'kb:outputQuantityKg': kg(e.outGrams),
        'kb:reclaimLossKg': kg(fx.inGrams - e.outGrams),
        'kb:purityBps': e.purityBps,
        'kb:worstInputTier': e.tier,
      });
      break;
    }
    case 'DESTROY': {
      out.push({
        type: 'ObjectEvent', ...common(I, e),
        certificationInfo: I.destruction(e.eventId),
        quantityList: fx.inputs.map((x) => q(I.lot(x.lot), x.grams)),
        action: 'DELETE', bizStep: 'destroying', disposition: 'destroyed',
        sensorElementList: [{ sensorReport: [{ type: 'Mass', value: kg(e.intakeGrams), uom: 'KGM' }] }],
        ...ledgerRef(e), ...actor,
        'kb:destruction': {
          'kb:destructionEventId': e.eventId,
          'kb:certificate': I.destruction(e.eventId),
          'kb:intakeQuantityKg': kg(e.intakeGrams),
          'kb:heldQuantityKg': kg(fx.held),
          'kb:handlingLossKg': kg(fx.held - e.intakeGrams),
          'kb:dreBps': e.dreBps,
          'kb:creditEligible': Boolean(e.creditEligible),
          'kb:worstTier': e.worstTier ?? null,
        },
        'kb:attestations': [{ 'kb:attests': 'destructionCertificate', ...partyRef(I, obs, e.verifier) }],
      });
      break;
    }
    case 'DESIGNATE':
    case 'CLAIM': {
      const dSeq = state.destroySeqByEvent.get(e.eventId);
      const dLots = state.effects.get(dSeq).inputs;
      const isClaim = e.type === 'CLAIM';
      out.push({
        type: 'TransactionEvent', ...common(I, e),
        bizTransactionList: [
          { type: 'cert', bizTransaction: I.destruction(e.eventId) },
          ...(isClaim ? [{ type: KB_VOCAB.bttCreditClaim, bizTransaction: I.claim(e.eventId) }] : []),
        ],
        quantityList: dLots.map((x) => ({ epcClass: I.lot(x.lot) })),
        action: 'ADD',
        bizStep: isClaim ? KB_VOCAB.bizStepClaiming : KB_VOCAB.bizStepDesignating,
        ...ledgerRef(e), ...actor,
        'kb:destructionEventId': e.eventId,
        ...(isClaim
          ? { 'kb:claimLock': { 'kb:destructionEventId': e.eventId, 'kb:registry': partyRef(I, obs, e.actor), 'kb:claimedQuantityKg': kg(e.grams) } }
          : { 'kb:designatedRegistry': partyRef(I, obs, e.registry) }),
      });
      break;
    }
    default:
      break;
  }
  return out;
}

function lotSender(state, e) {
  // the SEND that put this lot in transit is the last SEND touching it before this RECEIVE
  const seqs = state.touches.get(e.lot);
  const i = seqs.indexOf(e.seq);
  return state.sendersBySeq.get(seqs[i - 1]);
}

/** Lot master data, used as ILMD on creating events and as EPCClass master data in the header. */
function lotMaster(I, lot) {
  const m = {
    'kb:lot': lot.id,
    'kb:gas': lot.gas,
    'kb:provenanceClass': lot.cls,
    'kb:tier': lot.tier ?? null,
    'kb:cylinder': I.cylinder(lot.cylinder),
    'kb:createdAtLedgerSeq': lot.createdSeq,
  };
  if (lot.parent) m['kb:parentLot'] = I.lot(lot.parent);
  if (lot.inputs) m['kb:inputLots'] = lot.inputs.map((n) => I.lot(n));
  if (lot.origin?.kind === 'MINT') m['kb:quota'] = I.quota(lot.origin.quota);
  if (lot.origin?.kind === 'RECOVER') m['kb:recoveredFrom'] = I.equipment(lot.origin.equipment);
  if (lot.origin?.kind === 'RECLAIM' && !lot.parent) m['kb:purityBps'] = lot.origin.purityBps;
  return m;
}

// ------------------------------------------------------------------ document

export function prepare(obs) {
  const state = replay(obs.events);
  state.sendersBySeq = new Map(obs.events.filter((e) => e.status === 'accepted' && e.type === 'SEND').map((e) => [e.seq, e.actor]));
  state.bySeq = new Map(obs.events.map((e) => [e.seq, e]));
  state.snapshot = obs.events.at(-1);
  return state;
}

/** One EPCISDocument for the provenance chain of `lotId`. */
export function exportLot(lotId, obs, state, { ledger = 'sim', label = null } = {}) {
  const I = id(ledger);
  const chainLots = provenance(lotId, state);
  const chain = new Set(chainLots);

  // every accepted event touching a chain lot, plus the designation/claim of its destruction events
  const seqs = new Set();
  for (const n of chainLots) for (const s of state.touches.get(n) ?? []) seqs.add(s);
  for (const s of [...seqs]) {
    const e = state.bySeq.get(s);
    if (e.type === 'DESTROY') for (const c of state.claimsByEvent.get(e.eventId) ?? []) seqs.add(c);
  }
  const ledgerEvents = [...seqs].sort((a, b) => a - b).map((s) => state.bySeq.get(s));
  const ctx = { I, obs, state, chain };
  const eventList = ledgerEvents.flatMap((e) => mapEvent(e, ctx));

  // master data for every lot, unit and party the events mention
  const lotsMentioned = new Set(chainLots);
  const units = new Set();
  const parties = new Set();
  for (const e of ledgerEvents) {
    for (const k of ['lot', 'sentLot', 'outputLot', 'inServiceLot', 'quarantinedLot']) if (e[k]) lotsMentioned.add(e[k]);
    if (e.type === 'DESTROY') for (const n of e.inputs) lotsMentioned.add(n);
    if (e.equipment) units.add(e.equipment);
    for (const k of ['actor', 'to', 'consentSigner', 'verifier', 'registry']) if (e[k]) parties.add(e[k].replace(/^scale:/, ''));
  }
  const sortedLots = [...lotsMentioned].sort((a, b) => a - b);
  const subject = state.lots.get(lotId);

  return {
    '@context': [EPCIS_CONTEXT, { kb: KB }],
    type: 'EPCISDocument',
    schemaVersion: SCHEMA_VERSION,
    creationDate: new Date(state.snapshot.t).toISOString(),
    epcisHeader: {
      epcisMasterData: {
        vocabularyList: [
          {
            type: VTYPE_EPCCLASS,
            vocabularyElementList: sortedLots.map((n) => ({ id: I.lot(n), attributes: attrs(lotMaster(I, state.lots.get(n))) })),
          },
          {
            type: KB_VOCAB.vtypeEquipment,
            vocabularyElementList: [...units].sort().map((u) => ({ id: I.equipment(u), attributes: attrs(equipmentMaster(I, obs.equipment[u], u)) })),
          },
          {
            type: KB_VOCAB.vtypeParty,
            vocabularyElementList: [...parties].sort().map((p) => ({ id: I.party(p), attributes: attrs({ 'kb:role': obs.actors[p]?.role ?? null, 'kb:country': obs.actors[p]?.country ?? null }) })),
          },
        ].filter((v) => v.vocabularyElementList.length),
      },
    },
    epcisBody: { eventList },
    'kb:export': {
      'kb:note': 'Simulated data. Exported from the Kigali Balance observation files; accepted ledger events only.',
      'kb:ledger': ledger,
      'kb:subjectLot': I.lot(lotId),
      ...(label ? { 'kb:label': label } : {}),
      'kb:subjectStatus': {
        'kb:provenanceClass': subject.cls,
        'kb:tier': subject.tier ?? null,
        'kb:remainingQuantityKg': kg(subject.grams),
        'kb:status': subject.status,
      },
      // lots whose whole on-ledger life is in eventList; the per-lot balance of these reconciles
      'kb:lotsWithFullHistory': chainLots.map((n) => I.lot(n)),
      'kb:remainingQuantityKg': chainLots.map((n) => ({ 'kb:lot': I.lot(n), 'kb:quantityKg': kg(state.lots.get(n).grams) })),
      'kb:snapshotLedgerSeq': state.snapshot.seq,
      'kb:ledgerEventsExported': ledgerEvents.length,
    },
  };
}

// master-data attribute ids are string values, not JSON-LD keys, so they are written as full IRIs
const attrs = (o) => Object.entries(o)
  .filter(([, v]) => v !== null && v !== undefined && v !== '')
  .map(([k, v]) => ({ id: k.replace(/^kb:/, KB), attribute: Array.isArray(v) ? v.join(' ') : v }));

function equipmentMaster(I, row, unit) {
  if (!row) return { 'kb:unit': unit };
  const num = (v) => (v === '' || v === undefined ? null : Number(v));
  return {
    'kb:tier': row.tier || null,
    'kb:gas': row.gas || null,
    'kb:category': row.category || null,
    'kb:nameplateKg': num(row.nameplate_g) === null ? null : kg(num(row.nameplate_g)),
    'kb:model': row.model_id || null,
    'kb:installedAt': row.installed_at || null,
    'kb:owner': row.owner ? I.party(row.owner) : null,
    'kb:serviceCompany': row.service_company ? I.party(row.service_company) : null,
  };
}

// ------------------------------------------------------------------ example selection (data-driven)

/**
 * The passport examples from web/data/sim.json (when that bundle exists and its lots exist in this
 * ledger), plus picks made from the ledger alone so the set never depends on hard-coded lot ids.
 */
export function selectExamples(obs, state, { simJson = resolve(REPO_ROOT, 'web/data/sim.json') } = {}) {
  const picks = [];
  const add = (lot, why) => {
    if (!lot || !state.lots.has(lot)) return;
    const seen = picks.find((p) => p.lot === lot);
    if (seen) seen.why += `; ${why}`;
    else picks.push({ lot, why });
  };
  if (simJson && existsSync(simJson)) {
    try {
      for (const ex of JSON.parse(readFileSync(simJson, 'utf8')).examples ?? []) add(ex.lot, 'dashboard passport example');
    } catch { /* a malformed bundle only loses the dashboard picks */ }
  }
  const acc = obs.events.filter((e) => e.status === 'accepted');
  const first = (xs) => (xs.length ? Math.min(...xs) : null);
  const claimed = new Set(acc.filter((e) => e.type === 'CLAIM').map((e) => e.eventId));
  const destroyedClaimedLots = new Set(acc.filter((e) => e.type === 'DESTROY' && claimed.has(e.eventId)).flatMap((e) => e.inputs));
  add(first(acc.filter((e) => e.type === 'RECLAIM' && e.tier === 'A').map((e) => e.outputLot)), 'reclaimed lot with its recovered inputs');
  add(first(acc.filter((e) => e.type === 'RECOVER' && destroyedClaimedLots.has(e.inServiceLot)).map((e) => e.inServiceLot)), 'recovered, destroyed and claimed');
  add(first(acc.filter((e) => e.type === 'RECOVER' && e.quarantinedLot).map((e) => e.quarantinedLot)), 'quarantined (Tier C) recovery');
  const charged = new Set(acc.filter((e) => e.type === 'CHARGE').map((e) => e.lot));
  const lotsArr = [...state.lots.values()];
  add(first(lotsArr.filter((l) => l.cls === 'VIRGIN' && l.parent && charged.has(l.id)).map((l) => l.id)), 'virgin gas from import to equipment');
  add(first(lotsArr.filter((l) => l.cls === 'RECLAIMED' && l.parent && charged.has(l.id)).map((l) => l.id)), 'reclaimed gas charged into equipment');
  return picks.sort((a, b) => a.lot - b.lot).map((p) => ({ ...p, label: describe(p.lot, state, acc) }));
}

/** A label made from what the data says about the lot (never from a stale bundle's label). */
export function describe(lotId, state, acc) {
  const lot = state.lots.get(lotId);
  const head = `${lot.cls === 'RECOVERED' ? `Recovered, Tier ${lot.tier}` : lot.cls === 'RECLAIMED' ? `Reclaimed, Tier ${lot.tier}` : lot.cls[0] + lot.cls.slice(1).toLowerCase()} ${lot.gas}`;
  const c = lot.consumedBy;
  let fate;
  if (c?.kind === 'RECLAIM') fate = `reclaimed into lot ${c.outputLot}`;
  else if (c?.kind === 'DESTROY') {
    const claim = acc.find((e) => e.type === 'CLAIM' && e.eventId === c.eventId);
    fate = `destroyed (event ${c.eventId})${claim ? `, claimed by ${claim.actor}` : ', not claimed'}`;
  } else {
    const units = new Set(acc.filter((e) => e.type === 'CHARGE' && e.lot === lotId).map((e) => e.equipment)).size;
    fate = units ? `charged into ${units} unit${units > 1 ? 's' : ''}` : 'in stock';
    if (lot.grams > 0 && units) fate += `, ${kg(lot.grams)} kg left`;
  }
  return `Lot ${lotId}: ${head}, ${fate}`;
}

// ------------------------------------------------------------------ files

export const serialize = (doc) => `${JSON.stringify(doc, null, 2)}\n`;
export const fileFor = (lot) => `lot-${lot}.jsonld`;

export function exportExamples({ simDir = DEFAULT_SIM_DIR, outDir = DEFAULT_OUT_DIR, lots = null, write = true, simJson } = {}) {
  const obs = loadObservations(simDir);
  const state = prepare(obs);
  const acc = obs.events.filter((e) => e.status === 'accepted');
  const picks = lots
    ? lots.map((lot) => ({ lot, why: 'requested', label: describe(lot, state, acc) }))
    : selectExamples(obs, state, simJson === undefined ? {} : { simJson });
  const docs = picks.map((p) => ({ ...p, file: fileFor(p.lot), doc: exportLot(p.lot, obs, state, { label: p.label }) }));
  if (write) {
    mkdirSync(outDir, { recursive: true });
    for (const f of readdirSync(outDir)) if (/^lot-\d+\.jsonld$/.test(f)) unlinkSync(resolve(outDir, f));
    for (const d of docs) writeFileSync(resolve(outDir, d.file), serialize(d.doc));
    const index = {
      note: 'Simulated data. GS1 EPCIS 2.0 JSON-LD exports of example lot provenance chains; see simulator/epcis/README.md.',
      schema: 'https://ref.gs1.org/standards/epcis/2.0.1/epcis-json-schema.json',
      context: EPCIS_CONTEXT,
      creationDate: new Date(state.snapshot.t).toISOString(),
      examples: docs.map((d) => ({ lot: d.lot, label: d.label, why: d.why, file: d.file, events: d.doc.epcisBody.eventList.length, lots: d.doc['kb:export']['kb:lotsWithFullHistory'].length })),
    };
    writeFileSync(resolve(outDir, 'index.json'), serialize(index));
  }
  return docs;
}

// ------------------------------------------------------------------ CLI

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
  const lots = args.flatMap((a, i) => (args[i - 1] === '--lot' ? [Number(a)] : []));
  if (lots.some((n) => !Number.isInteger(n) || n <= 0)) throw new Error('--lot expects a positive integer lot id');
  const simDir = opt('sim') ? resolve(opt('sim')) : DEFAULT_SIM_DIR;
  if (args.includes('--stdout')) {
    const docs = exportExamples({ simDir, lots: lots.length ? lots : null, write: false });
    process.stdout.write(docs.map((d) => serialize(d.doc)).join(''));
  } else {
    const outDir = opt('out') ? resolve(opt('out')) : DEFAULT_OUT_DIR;
    const docs = exportExamples({ simDir, outDir, lots: lots.length ? lots : null });
    for (const d of docs) console.log(`${d.file}: ${d.doc.epcisBody.eventList.length} EPCIS events, ${d.doc['kb:export']['kb:lotsWithFullHistory'].length} lots — ${d.label}`);
    console.log(`wrote ${docs.length} documents + index.json to ${outDir}`);
  }
}
