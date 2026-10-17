// GS1 EPCIS 2.0 export: every exported document must validate against the official JSON Schema, and
// the quantities it states must reconcile with an independent replay of the ledger events.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  SCHEMA_PATH, DEFAULT_OUT_DIR, KB_VOCAB, loadObservations, prepare, exportLot, exportExamples, serialize,
} from '../epcis/export_epcis.mjs';
import { simulate } from '../src/simulate.mjs';
import { toCsv } from '../src/io.mjs';

const params = JSON.parse(readFileSync(new URL('../params.json', import.meta.url), 'utf8'));
const MIN_RECLAIM_LOSS_BPS = params.rules.minReclaimLossBps;

// Pinned copy of https://ref.gs1.org/standards/epcis/2.0.1/epcis-json-schema.json (see epcis/schema/README.md)
const SCHEMA_SHA256 = '0f46ff694efffd8d8ce840a33dfde84228add11b516b8b258f3200740ae210af';
const schemaBytes = readFileSync(SCHEMA_PATH);
const schema = JSON.parse(schemaBytes.toString('utf8'));
// The official schema is draft-07, so the default Ajv class. strictRequired is off only because the
// schema lists required properties inside if/anyOf branches without redeclaring them (valid draft-07).
const ajv = new Ajv({ allErrors: true, strictRequired: false });
addFormats(ajv);
const validateEpcis = ajv.compile(schema);
const schemaErrors = () => ajv.errorsText(validateEpcis.errors, { separator: '\n' });

// Use whatever simulator/out contains; on a fresh checkout (out/ is not committed) simulate seed 42.
const simDir = (() => {
  const out = fileURLToPath(new URL('../out/', import.meta.url));
  if (existsSync(join(out, 'ledger_events.jsonl'))) return out;
  const dir = mkdtempSync(join(tmpdir(), 'kb-epcis-'));
  const { observations } = simulate(params);
  writeFileSync(join(dir, 'actors.csv'), toCsv(observations.actors));
  writeFileSync(join(dir, 'equipment.csv'), toCsv(observations.equipment));
  writeFileSync(join(dir, 'ledger_events.jsonl'), observations.events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  process.on('exit', () => rmSync(dir, { recursive: true, force: true }));
  return dir;
})();
const obs = loadObservations(simDir);
const state = prepare(obs);
const accepted = obs.events.filter((e) => e.status === 'accepted');
const bySeq = new Map(accepted.map((e) => [e.seq, e]));
const examples = exportExamples({ simDir, write: false });

// ------------------------------------------------------------------ independent ledger replay (grams per lot)

function ledgerBalances(events) {
  const g = new Map();
  for (const e of events) {
    if (e.status !== 'accepted') continue;
    if (e.type === 'MINT') g.set(e.lot, e.grams);
    if (e.type === 'SEND' && e.sentLot !== e.lot) { g.set(e.lot, g.get(e.lot) - e.grams); g.set(e.sentLot, e.grams); }
    if (e.type === 'RECEIVE') g.set(e.lot, Math.min(g.get(e.lot), e.weighed));
    if (e.type === 'CHARGE') g.set(e.lot, g.get(e.lot) - e.grams);
    if (e.type === 'RECOVER') {
      if (e.inServiceLot) g.set(e.inServiceLot, e.inServiceGrams);
      if (e.quarantinedLot) g.set(e.quarantinedLot, e.quarantinedGrams);
    }
    if (e.type === 'RECLAIM') { for (const n of e.inputs) g.set(n, 0); g.set(e.outputLot, e.outGrams); }
    if (e.type === 'DESTROY') for (const n of e.inputs) g.set(n, 0);
  }
  return g;
}
const ledgerFinal = ledgerBalances(obs.events);

const grams = (kg) => Math.round(kg * 1000);
const lotNo = (uri) => Number(uri.slice(uri.lastIndexOf('/') + 1));
const sum = (list) => list.reduce((s, x) => s + grams(x.quantity), 0);

/**
 * Re-derive every full-history lot's balance from the EPCIS events alone (the mapping in README.md),
 * and check each step against the ledger event it came from.
 */
function reconcile(doc) {
  const full = new Set(doc['kb:export']['kb:lotsWithFullHistory'].map(lotNo));
  const bal = new Map();
  const add = (n, d, where) => {
    if (!full.has(n)) return;
    if (!bal.has(n)) assert.ok(d > 0, `${where}: lot ${n} used before it was created`);
    const v = (bal.get(n) ?? 0) + d;
    assert.ok(v >= 0, `${where}: lot ${n} goes negative`);
    bal.set(n, v);
  };
  const checks = { reclaims: 0, splits: 0, destructions: 0, claims: 0 };
  for (const ev of doc.epcisBody.eventList) {
    const where = ev.eventID;
    const src = bySeq.get(ev['kb:ledgerSeq']);
    assert.ok(src, `${where}: no accepted ledger event ${ev['kb:ledgerSeq']}`);
    assert.equal(ev['kb:ledgerEventType'], src.type, where);
    assert.equal(ev.eventTime, src.t, where);
    switch (`${ev.type}/${ev.action ?? ''}/${ev.bizStep}`) {
      case 'ObjectEvent/ADD/commissioning':
        assert.equal(src.type, 'MINT');
        assert.equal(sum(ev.quantityList), src.grams, where);
        for (const x of ev.quantityList) add(lotNo(x.epcClass), grams(x.quantity), where);
        break;
      case 'AggregationEvent/DELETE/removing':
        assert.equal(src.type, 'RECOVER');
        assert.equal(sum(ev.childQuantityList), src.grams, `${where}: recovered lots must add up to the recovery`);
        for (const x of ev.childQuantityList) add(lotNo(x.epcClass), grams(x.quantity), where);
        break;
      case 'AggregationEvent/ADD/installing':
        assert.equal(src.type, 'CHARGE');
        assert.equal(sum(ev.childQuantityList), src.grams, where);
        for (const x of ev.childQuantityList) add(lotNo(x.epcClass), -grams(x.quantity), where);
        break;
      case 'ObjectEvent/OBSERVE/shipping':
        assert.equal(src.type, 'SEND');
        for (const x of ev.quantityList) if (full.has(lotNo(x.epcClass))) assert.equal(grams(x.quantity), bal.get(lotNo(x.epcClass)), `${where}: a transfer moves the whole lot`);
        break;
      case 'ObjectEvent/OBSERVE/receiving':
        assert.equal(src.type, 'RECEIVE');
        assert.equal(sum(ev.quantityList), src.weighed, where);
        for (const x of ev.quantityList) {
          const n = lotNo(x.epcClass);
          if (full.has(n)) bal.set(n, Math.min(bal.get(n), grams(x.quantity))); // underweight = handling loss
        }
        break;
      case 'ObjectEvent/DELETE/destroying':
        assert.equal(src.type, 'DESTROY');
        assert.equal(sum(ev.quantityList), src.held, where);
        assert.ok(grams(ev['kb:destruction']['kb:intakeQuantityKg']) <= sum(ev.quantityList), `${where}: certified intake above what was held`);
        assert.equal(ev.certificationInfo, ev['kb:destruction']['kb:certificate']);
        for (const x of ev.quantityList) add(lotNo(x.epcClass), -grams(x.quantity), where);
        for (const x of ev.quantityList) if (full.has(lotNo(x.epcClass))) assert.equal(bal.get(lotNo(x.epcClass)), 0, `${where}: destruction empties the lot`);
        checks.destructions++;
        break;
      case 'ObjectEvent/DELETE/decommissioning':
        assert.equal(src.type, 'RECOVER');
        assert.ok(src.decommission);
        break;
      case 'TransformationEvent//repackaging': {
        assert.equal(src.type, 'SEND');
        assert.equal(sum(ev.inputQuantityList), sum(ev.outputQuantityList), `${where}: a split conserves mass`);
        assert.equal(sum(ev.outputQuantityList), src.grams, where);
        for (const x of ev.inputQuantityList) add(lotNo(x.epcClass), -grams(x.quantity), where);
        for (const x of ev.outputQuantityList) add(lotNo(x.epcClass), grams(x.quantity), where);
        checks.splits++;
        break;
      }
      case `TransformationEvent//${KB_VOCAB.bizStepReclaiming}`: {
        assert.equal(src.type, 'RECLAIM');
        const inG = sum(ev.inputQuantityList);
        const outG = sum(ev.outputQuantityList);
        assert.equal(inG, src.inGrams, `${where}: reclaim inputs must equal the ledger's inGrams`);
        assert.equal(outG, src.outGrams, where);
        assert.deepEqual(ev.inputQuantityList.map((x) => lotNo(x.epcClass)), src.inputs, where);
        // R4: output <= inputs minus the minimum reclaim loss (2 %)
        assert.ok(outG <= Math.floor((inG * (10_000 - MIN_RECLAIM_LOSS_BPS)) / 10_000), `${where}: reclaim output ${outG} g exceeds inputs ${inG} g minus ${MIN_RECLAIM_LOSS_BPS / 100} %`);
        for (const x of ev.inputQuantityList) {
          const n = lotNo(x.epcClass);
          if (full.has(n)) assert.equal(grams(x.quantity), bal.get(n), `${where}: reclaim consumes the whole input lot`);
          add(n, -grams(x.quantity), where);
        }
        for (const x of ev.outputQuantityList) add(lotNo(x.epcClass), grams(x.quantity), where);
        checks.reclaims++;
        break;
      }
      case `TransactionEvent/ADD/${KB_VOCAB.bizStepDesignating}`:
        assert.equal(src.type, 'DESIGNATE');
        break;
      case `TransactionEvent/ADD/${KB_VOCAB.bizStepClaiming}`: {
        assert.equal(src.type, 'CLAIM');
        const d = accepted.find((e) => e.type === 'DESTROY' && e.eventId === src.eventId);
        assert.equal(grams(ev['kb:claimLock']['kb:claimedQuantityKg']), d.intakeGrams, `${where}: a claim covers exactly the certified intake`);
        assert.equal(ev['kb:claimLock']['kb:destructionEventId'], d.eventId);
        checks.claims++;
        break;
      }
      default:
        assert.fail(`${where}: unmapped combination ${ev.type}/${ev.action}/${ev.bizStep}`);
    }
  }
  // every full-history lot ends where the ledger says it does
  const stated = new Map(doc['kb:export']['kb:remainingQuantityKg'].map((r) => [lotNo(r['kb:lot']), grams(r['kb:quantityKg'])]));
  for (const n of full) {
    assert.equal(bal.get(n), ledgerFinal.get(n), `lot ${n}: EPCIS balance vs ledger replay`);
    assert.equal(stated.get(n), ledgerFinal.get(n), `lot ${n}: stated remaining vs ledger replay`);
  }
  return checks;
}

// ------------------------------------------------------------------ tests

test('the bundled schema is the official GS1 EPCIS 2.0.1 JSON Schema, unmodified', () => {
  assert.equal(createHash('sha256').update(schemaBytes).digest('hex'), SCHEMA_SHA256);
  assert.equal(schema.$schema, 'http://json-schema.org/draft-07/schema#');
  assert.equal(schema.$id, 'https://ref.gs1.org/standards/epcis/2.0.1/epcis-json-schema.json');
});

test('the validator is live: non-conformant documents are rejected', () => {
  const doc = structuredClone(examples[0].doc);
  assert.ok(validateEpcis(doc), schemaErrors());
  const mutations = [
    (d) => { d.epcisBody.eventList[0].provenanceClass = 'VIRGIN'; }, // extension field without a namespace
    (d) => { d.epcisBody.eventList[0].bizStep = 'reclaiming'; }, // bare word that is not a CBV term
    (d) => { d.epcisBody.eventList[0].eventTimeZoneOffset = 'UTC'; },
    (d) => { delete d.schemaVersion; },
    (d) => { const ev = d.epcisBody.eventList.find((e) => e.quantityList); ev.quantityList[0].uom = 'kg'; },
  ];
  for (const [i, m] of mutations.entries()) {
    const bad = structuredClone(doc);
    m(bad);
    assert.equal(validateEpcis(bad), false, `mutation ${i} should fail validation`);
  }
});

test('every example document validates against the official EPCIS JSON Schema', (t) => {
  assert.ok(examples.length >= 4, 'example set');
  const kinds = new Set();
  let events = 0;
  for (const ex of examples) {
    assert.ok(validateEpcis(ex.doc), `lot ${ex.lot}:\n${schemaErrors()}`);
    events += ex.doc.epcisBody.eventList.length;
    for (const ev of ex.doc.epcisBody.eventList) kinds.add(ev['kb:ledgerEventType']);
  }
  // the set covers the whole life cycle: import, transfer, charge, recovery, reclamation, destruction, claim
  for (const k of ['MINT', 'SEND', 'RECEIVE', 'CHARGE', 'RECOVER', 'RECLAIM', 'DESTROY', 'CLAIM']) assert.ok(kinds.has(k), `examples include ${k}`);
  // required examples: a reclaimed lot with its inputs, and a destroyed-and-claimed lot
  assert.ok(examples.some((ex) => ex.doc.epcisBody.eventList.some((e) => e['kb:ledgerEventType'] === 'RECLAIM') && ex.doc['kb:export']['kb:lotsWithFullHistory'].length > 1));
  assert.ok(examples.some((ex) => ex.doc.epcisBody.eventList.some((e) => e['kb:ledgerEventType'] === 'CLAIM')));
  t.diagnostic(`${examples.length} example documents, ${events} EPCIS events valid`);
});

test('every lot in the ledger exports to a schema-valid EPCIS document', (t) => {
  let docs = 0;
  let events = 0;
  for (const lot of state.lots.keys()) {
    const doc = exportLot(lot, obs, state);
    assert.ok(validateEpcis(doc), `lot ${lot}:\n${schemaErrors()}`);
    docs++;
    events += doc.epcisBody.eventList.length;
  }
  assert.ok(docs > 100);
  t.diagnostic(`${docs} documents, ${events} EPCIS events valid`);
});

test('exported quantities reconcile with the ledger (per lot, reclaim loss >= 2 %, splits, destruction, claims)', (t) => {
  const total = { reclaims: 0, splits: 0, destructions: 0, claims: 0 };
  for (const lot of state.lots.keys()) {
    const c = reconcile(exportLot(lot, obs, state));
    for (const k of Object.keys(total)) total[k] += c[k];
  }
  for (const ex of examples) reconcile(ex.doc);
  for (const k of Object.keys(total)) assert.ok(total[k] > 0, `some ${k} were checked`);
  t.diagnostic(`checked ${JSON.stringify(total)}`);
});

test('the export is deterministic, LF-only, and contains no rejected attempt', () => {
  const again = exportExamples({ simDir, write: false });
  assert.deepEqual(again.map((d) => serialize(d.doc)), examples.map((d) => serialize(d.doc)));
  const rejectedSeqs = new Set(obs.events.filter((e) => e.status !== 'accepted').map((e) => e.seq));
  const last = obs.events.at(-1).t;
  for (const ex of examples) {
    const text = serialize(ex.doc);
    assert.ok(!text.includes('\r'));
    assert.equal(ex.doc.creationDate, last, 'creationDate comes from the data');
    for (const ev of ex.doc.epcisBody.eventList) assert.ok(!rejectedSeqs.has(ev['kb:ledgerSeq']));
  }
});

test('the published files in web/data/epcis validate (when present)', (t) => {
  if (!existsSync(DEFAULT_OUT_DIR)) return t.skip('web/data/epcis not built');
  const files = readdirSync(DEFAULT_OUT_DIR).filter((f) => f.endsWith('.jsonld'));
  for (const f of files) {
    const text = readFileSync(join(DEFAULT_OUT_DIR, f), 'utf8');
    assert.ok(!text.includes('\r'), `${f} has CRLF`);
    assert.ok(validateEpcis(JSON.parse(text)), `${f}:\n${schemaErrors()}`);
  }
  const index = JSON.parse(readFileSync(join(DEFAULT_OUT_DIR, 'index.json'), 'utf8'));
  for (const ex of index.examples) assert.ok(files.includes(ex.file), `${ex.file} listed in index.json`);
  const stale = examples.filter((ex) => !files.includes(ex.file) || readFileSync(join(DEFAULT_OUT_DIR, ex.file), 'utf8') !== serialize(ex.doc));
  if (stale.length) t.diagnostic(`web/data/epcis is older than simulator/out (${stale.length} files differ): run node simulator/epcis/export_epcis.mjs`);
  t.diagnostic(`${files.length} published files valid`);
});
