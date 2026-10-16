// Build the data bundle for the web dashboard and provenance passport.
//
//   node web/build_data.mjs [--sim simulator/out] [--ai ai/out]
//
// Reads only what a regulator could observe: the ledger events, the equipment register, the actor
// list and the AI modules' flags. The simulator's ground truth and summary are never read.
// All data is simulated.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const simDir = resolve(root, arg('sim', 'simulator/out'));
const aiDir = resolve(root, arg('ai', 'ai/out'));
const outDir = resolve(here, 'data');

const GWP = JSON.parse(readFileSync(resolve(root, 'simulator/params.json'), 'utf8')).gases ?? {};
const gwpOf = (gas) => GWP[gas]?.gwpAR4 ?? { 'R-404A': 3922, 'R-134a': 1430, 'R-410A': 2088 }[gas];

function csv(path) {
  const [head, ...rows] = readFileSync(path, 'utf8').trim().split(/\r?\n/);
  const keys = head.split(',');
  return rows.map((r) => Object.fromEntries(r.split(',').map((v, i) => [keys[i], v])));
}

const events = readFileSync(resolve(simDir, 'ledger_events.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const actors = Object.fromEntries(csv(resolve(simDir, 'actors.csv')).map((a) => [a.id, { role: a.role, country: a.country }]));
const equipmentCsv = Object.fromEntries(csv(resolve(simDir, 'equipment.csv')).map((e) => [e.id, e]));

// ------------------------------------------------------------------ replay lots from the observed events

const lots = new Map(); // id -> lot
const SINKS = ['charged', 'destroyedEligible', 'destroyedOther', 'reclaimInput', 'handlingLoss'];
const day = (t) => t.slice(0, 10);

function newLot(id, t, fields) {
  const lot = {
    id, t: day(t), gas: fields.gas, g0: fields.grams, grams: fields.grams, cls: fields.cls, tier: fields.tier ?? null,
    holder: fields.holder, origin: fields.origin, parent: fields.parent ?? 0, cyl: fields.cyl, inputs: fields.inputs ?? null,
    status: 'ACTIVE', out: Object.fromEntries(SINKS.map((s) => [s, 0])), history: [], consumedBy: null,
  };
  lots.set(id, lot);
  return lot;
}
const hist = (lot, t, kind, extra = {}) => lot.history.push({ t: day(t), kind, ...extra });

const equipment = new Map(); // id -> { charges, recoveries }
const eqState = (id) => {
  if (!equipment.has(id)) equipment.set(id, { charges: [], recoveries: [], chargedG: 0, recoveredG: 0 });
  return equipment.get(id);
};

const destructions = [];
const rejections = [];
const discrepancies = [];
const quotas = {};
const months = new Map();
const month = (t) => t.slice(0, 7);
const bump = (t, gas, key, g) => {
  const m = month(t);
  if (!months.has(m)) months.set(m, {});
  const row = months.get(m);
  row[gas] ??= { recovered: 0, reclaimed: 0, destroyed: 0, charged: 0, minted: 0 };
  row[gas][key] += g;
};

for (const e of events) {
  if (e.status !== 'accepted') {
    rejections.push({ seq: e.seq, t: day(e.t), type: e.type, reason: e.reason, actor: e.actor ?? null, detail: rejectionDetail(e) });
    continue;
  }
  switch (e.type) {
    case 'QUOTA':
      quotas[e.quotaId] = { importer: e.importer, gas: e.gas, grams: e.grams };
      break;
    case 'MINT': {
      const lot = newLot(e.lot, e.t, { gas: e.gas, grams: e.grams, cls: 'VIRGIN', holder: e.actor, origin: e.quotaId, cyl: e.cylinder });
      hist(lot, e.t, 'MINT', { actor: e.actor, grams: e.grams, quota: e.quotaId });
      bump(e.t, e.gas, 'minted', e.grams);
      break;
    }
    case 'SEND': {
      const lot = lots.get(e.lot);
      let sent = lot;
      if (e.sentLot !== e.lot) {
        lot.grams -= e.grams;
        hist(lot, e.t, 'SPLIT', { grams: e.grams, child: e.sentLot });
        sent = newLot(e.sentLot, e.t, { gas: lot.gas, grams: e.grams, cls: lot.cls, tier: lot.tier, holder: e.actor, origin: lot.origin, parent: lot.id, cyl: e.newCylinder });
        hist(sent, e.t, 'SPLIT_FROM', { parent: lot.id, grams: e.grams });
      }
      sent.status = 'IN_TRANSIT';
      hist(sent, e.t, 'SEND', { actor: e.actor, to: e.to, grams: sent.grams });
      break;
    }
    case 'RECEIVE': {
      const lot = lots.get(e.lot);
      if (e.weighed < lot.grams) {
        lot.out.handlingLoss += lot.grams - e.weighed;
        lot.grams = e.weighed;
      }
      lot.holder = e.actor;
      lot.status = lot.grams === 0 ? 'EMPTY' : 'ACTIVE';
      hist(lot, e.t, 'RECEIVE', { actor: e.actor, sent: e.sentGrams, weighed: e.weighed, discrepancy: e.discrepancy ?? null });
      if (e.discrepancy) discrepancies.push({ t: day(e.t), lot: e.lot, actor: e.actor, sent: e.sentGrams, weighed: e.weighed, kind: e.discrepancy, gas: lot.gas });
      break;
    }
    case 'CHARGE': {
      const lot = lots.get(e.lot);
      lot.grams -= e.grams;
      lot.out.charged += e.grams;
      if (lot.grams === 0) lot.status = 'EMPTY';
      hist(lot, e.t, 'CHARGE', { actor: e.actor, equipment: e.equipment, grams: e.grams });
      const q = eqState(e.equipment);
      q.charges.push({ t: day(e.t), grams: e.grams, lot: e.lot, by: e.actor });
      q.chargedG += e.grams;
      bump(e.t, lot.gas, 'charged', e.grams);
      break;
    }
    case 'RECOVER': {
      const base = { gas: e.gas, holder: e.actor, origin: e.equipment, cyl: e.cylinder };
      const made = [];
      if (e.inServiceLot) made.push(newLot(e.inServiceLot, e.t, { ...base, grams: e.inServiceGrams, cls: 'RECOVERED', tier: e.tier }));
      if (e.quarantinedLot) made.push(newLot(e.quarantinedLot, e.t, { ...base, grams: e.quarantinedGrams, cls: 'RECOVERED', tier: 'C' }));
      for (const lot of made) {
        hist(lot, e.t, 'RECOVER', { actor: e.actor, equipment: e.equipment, grams: lot.g0, consent: e.consentSigner, decommission: e.decommission, unitTier: e.tier });
      }
      const q = eqState(e.equipment);
      q.recoveries.push({ t: day(e.t), grams: e.grams, by: e.actor, consent: e.consentSigner, decommission: e.decommission, lots: made.map((l) => l.id), quarantined: e.quarantinedGrams });
      q.recoveredG += e.grams;
      bump(e.t, e.gas, 'recovered', e.grams);
      break;
    }
    case 'RECLAIM': {
      for (const id of e.inputs) {
        const lot = lots.get(id);
        lot.out.reclaimInput += lot.grams;
        hist(lot, e.t, 'RECLAIM_INPUT', { actor: e.actor, grams: lot.grams, output: e.outputLot });
        lot.grams = 0;
        lot.status = 'CONSUMED';
        lot.consumedBy = { kind: 'reclaim', lot: e.outputLot };
      }
      const out = newLot(e.outputLot, e.t, { gas: e.gas, grams: e.outGrams, cls: 'RECLAIMED', tier: e.tier, holder: e.actor, origin: `reclaim`, cyl: e.outputCylinder, inputs: e.inputs });
      out.reclaim = { inGrams: e.inGrams, outGrams: e.outGrams, purityBps: e.purityBps, yieldPct: +(100 * e.outGrams / e.inGrams).toFixed(1) };
      hist(out, e.t, 'RECLAIM', { actor: e.actor, inGrams: e.inGrams, outGrams: e.outGrams, purityBps: e.purityBps, inputs: e.inputs });
      bump(e.t, e.gas, 'reclaimed', e.outGrams);
      break;
    }
    case 'DESTROY': {
      for (const id of e.inputs) {
        const lot = lots.get(id);
        const sink = e.creditEligible ? 'destroyedEligible' : 'destroyedOther';
        // the intake weighing may be below what was held; the difference is handling loss, spread pro rata
        const share = Math.round((lot.grams * e.intakeGrams) / e.held);
        lot.out[sink] += share;
        lot.out.handlingLoss += lot.grams - share;
        hist(lot, e.t, 'DESTROY', { actor: e.actor, grams: lot.grams, event: e.eventId, verifier: e.verifier, dreBps: e.dreBps, eligible: e.creditEligible });
        lot.grams = 0;
        lot.status = 'CONSUMED';
        lot.consumedBy = { kind: 'destroy', event: e.eventId };
      }
      destructions[e.eventId] = {
        id: e.eventId, t: day(e.t), facility: e.actor, gas: e.gas, grams: e.intakeGrams, held: e.held, dreBps: e.dreBps,
        verifier: e.verifier, eligible: e.creditEligible, tier: e.worstTier ?? null, inputs: e.inputs,
        tCO2e: +((e.intakeGrams / 1e6) * gwpOf(e.gas)).toFixed(2), claimedBy: null, claimedAt: null, blockedClaims: [],
      };
      bump(e.t, e.gas, 'destroyed', e.intakeGrams);
      break;
    }
    case 'CLAIM': {
      const d = destructions[e.eventId];
      d.claimedBy = e.actor;
      d.claimedAt = day(e.t);
      break;
    }
    default:
      break;
  }
}
// blocked claims are attached to their destruction event
for (const r of rejections) {
  if (r.type === 'CLAIM' && destructions[r.detail.eventId]) destructions[r.detail.eventId].blockedClaims.push({ t: r.t, by: r.actor, reason: r.reason });
}

function rejectionDetail(e) {
  switch (e.type) {
    case 'RECOVER': return { equipment: e.equipment, grams: e.grams, consent: e.consentSigner, cylinder: e.cylinder };
    case 'RECLAIM': return { inputs: e.inputs, inGrams: e.inGrams ?? null, outGrams: e.outGrams, maxOut: e.maxOut ?? null };
    case 'DESTROY': return { inputs: e.inputs, grams: e.intakeGrams, verifier: e.verifier };
    case 'CLAIM': return { eventId: e.eventId };
    default: return {};
  }
}

// ------------------------------------------------------------------ class flows for the Sankey, per gas

const flowKey = (lot) => (lot.cls === 'VIRGIN' ? 'virgin' : lot.cls === 'RECLAIMED' ? 'reclaimed' : lot.tier === 'C' ? 'recoveredC' : lot.tier === 'A' ? 'recoveredA' : 'recoveredB');
function flows(gasFilter) {
  const src = { virgin: 0, recoveredA: 0, recoveredB: 0, recoveredC: 0, reclaimed: 0 };
  const sink = {};
  let reclaimLoss = 0;
  let reclaimIn = 0;
  for (const lot of lots.values()) {
    if (gasFilter && lot.gas !== gasFilter) continue;
    const k = flowKey(lot);
    if (!lot.parent) src[k] += lot.g0; // split-off children are not new mass
    sink[k] ??= { charged: 0, destroyedEligible: 0, destroyedOther: 0, reclaimInput: 0, handlingLoss: 0, inStock: 0 };
    for (const s of SINKS) sink[k][s] += lot.out[s];
    sink[k].inStock += lot.grams;
    if (lot.reclaim) {
      reclaimLoss += lot.reclaim.inGrams - lot.reclaim.outGrams;
      reclaimIn += lot.reclaim.inGrams;
    }
  }
  // conservation check: every class's sources equal its sinks
  for (const k of Object.keys(src)) {
    const out = Object.values(sink[k] ?? {}).reduce((a, b) => a + b, 0);
    if (out !== src[k]) throw new Error(`flow ${gasFilter ?? 'all'} ${k}: in ${src[k]} != out ${out}`);
  }
  const claims = {};
  for (const d of destructions) {
    if (!d || !d.eligible || (gasFilter && d.gas !== gasFilter)) continue;
    const who = d.claimedBy ?? 'unclaimed';
    claims[who] = (claims[who] ?? 0) + d.grams;
  }
  return { src, sink, reclaimIn, reclaimLoss, claims };
}

const gases = [...new Set(events.filter((e) => e.gas).map((e) => e.gas))].sort();
const flowsByGas = Object.fromEntries([['all', flows(null)], ...gases.map((g) => [g, flows(g)])]);

// ------------------------------------------------------------------ AI flags

const ai = {};
for (const m of ['a', 'b', 'c']) {
  const p = resolve(aiDir, `module_${m}`, 'flags.json');
  if (!existsSync(p)) throw new Error(`missing ${p}; run ai/run_module_${m}.py first`);
  const d = JSON.parse(readFileSync(p, 'utf8'));
  ai[m] = {
    model: d.model, version: d.model_version, modelHash: d.model_hash, inputSnapshot: d.input_snapshot, cutoff: d.cutoff,
    assessed: d.entities.length,
    flags: d.entities.filter((e) => e.flagged || e.score >= 0.3).map((e) => ({
      actor: e.actor, role: e.role, score: +e.score.toFixed(3), severity: e.severity, reasons: e.reasons,
      signals: e.signals.map((s) => ({ name: s.name, score: +s.score.toFixed(3), reason: s.reason })),
    })),
  };
}

// ------------------------------------------------------------------ equipment referenced by any lot

const eqOut = {};
for (const [id, q] of equipment) {
  if (!q.recoveries.length) continue;
  const row = equipmentCsv[id] ?? {};
  eqOut[id] = {
    tier: row.tier, gas: row.gas, category: row.category, nameplate: +row.nameplate_g || null, model: row.model_id || null,
    installed: row.installed_at || null, owner: row.owner || null, service: row.service_company || null,
    chargedG: q.chargedG, recoveredG: q.recoveredG, charges: q.charges.slice(-6), recoveries: q.recoveries,
  };
}

// ------------------------------------------------------------------ write

const monthly = [...months.entries()].sort().map(([m, byGas]) => ({ m, byGas }));
const span = [events[0].t.slice(0, 10), events.at(-1).t.slice(0, 10)];
const bundle = {
  meta: {
    note: 'Simulated data only. Built from observed ledger events, the equipment register, actors and AI flags; the simulator ground truth is never read.',
    source: 'simulator seed 42',
    period: span,
    events: events.length,
    gwp: Object.fromEntries(gases.map((g) => [g, gwpOf(g)])),
    built: new Date().toISOString().slice(0, 10),
  },
  gases,
  actors,
  quotas,
  flows: flowsByGas,
  monthly,
  rejections,
  discrepancies,
  destructions: destructions.filter(Boolean),
  ai,
  equipment: eqOut,
  lots: [...lots.values()].map(({ status, ...l }) => ({ ...l, status: l.grams > 0 ? status : status === 'IN_TRANSIT' ? status : 'CLOSED' })),
};
mkdirSync(outDir, { recursive: true });
const path = resolve(outDir, 'sim.json');
writeFileSync(path, JSON.stringify(bundle));
console.log(`wrote ${path}: ${(JSON.stringify(bundle).length / 1024).toFixed(0)} KB, ${bundle.lots.length} lots, ${bundle.rejections.length} rejections, ${bundle.destructions.length} destruction events`);
for (const [g, f] of Object.entries(flowsByGas)) console.log(` ${g}: sources ${JSON.stringify(f.src)}`);
