import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { simulate } from '../src/simulate.mjs';
import { validate } from '../src/validate.mjs';
import { toCsv } from '../src/io.mjs';

const params = JSON.parse(readFileSync(new URL('../params.json', import.meta.url), 'utf8'));
const digest = (r) => createHash('sha256').update(JSON.stringify(r.observations)).digest('hex');

test('same seed gives identical observations; different seeds differ', () => {
  const a = simulate(params, { seed: 7, months: 12 });
  const b = simulate(params, { seed: 7, months: 12 });
  const c = simulate(params, { seed: 8, months: 12 });
  assert.equal(digest(a), digest(b));
  assert.notEqual(digest(a), digest(c));
});

test('self-checks pass on several seeds (mass balance, ledger identity, rule conformity)', () => {
  for (const seed of [1, 2, 3, 42, 99]) {
    const r = simulate(params, { seed });
    assert.doesNotThrow(() => validate(r), `seed ${seed}`);
  }
});

test('end-of-life recovery rate is calibrated to the Japan 2024 figure on average', () => {
  const rates = [];
  for (let seed = 1; seed <= 10; seed++) rates.push(validate(simulate(params, { seed })).calibration.overallEolMassRecoveryRate);
  const mean = rates.reduce((s, x) => s + x, 0) / rates.length;
  assert.ok(Math.abs(mean - params.endOfLife.targetMassRecoveryRate) < 0.05, `mean ${mean}`);
});

test('supply chain meets top-up demand (no hidden shortages)', () => {
  const r = simulate(params, { seed: 42 });
  for (const [gas, ph] of Object.entries(r.truth.physical)) {
    const share = ph.topUpsUnmet / (ph.topUpsTrue + ph.topUpsUnmet || 1);
    assert.ok(share < 0.01, `${gas} unmet share ${share}`);
  }
});

test('injected fraud actually happens and the on-chain rules block what they should', () => {
  const r = simulate(params, { seed: 42 });
  const ev = r.observations.events;
  assert.ok(r.truth.fraud.phantomUnits.length > 0, 'phantom recoveries occurred');
  assert.ok(Object.keys(r.truth.offLedger.topUpsByService).length > 0, 'off-ledger top-ups occurred');
  assert.ok(r.truth.offLedger.invoiceIds.length > 0, 'smuggled sales were invoiced');
  // every charge-and-recover attempt was fully quarantined as Tier C
  for (const a of r.truth.fraud.chargeAndRecoverUnits) {
    const rec = ev.find((e) => e.type === 'RECOVER' && e.status === 'accepted' && e.equipment === a.unit && e.grams === a.grams && !e.decommission);
    if (rec) assert.equal(rec.inServiceGrams, 0);
  }
  // over-yield reclaim attempts were rejected by R4
  assert.ok(ev.some((e) => e.type === 'RECLAIM' && e.reason === 'ReclaimExceedsInput'));
});

test('attacks on the second-party anchors happen and are all rejected for the right reason', () => {
  const r = simulate(params, { seed: 42 });
  const f = r.truth.fraud;
  const ev = r.observations.events;
  const reasonsOf = (type, pred) => ev.filter((e) => e.type === type && e.status === 'rejected' && pred(e)).map((e) => e.reason);
  assert.ok(f.unconsentedRecoveryAttempts.length > 0, 'unconsented recoveries attempted');
  assert.ok(f.unconsentedRecoveryAttempts.every((a) => !a.accepted));
  assert.ok(reasonsOf('RECOVER', (e) => e.consentSigner?.startsWith('scale:')).every((x) => x === 'NotUnitOwner'));
  assert.ok(f.selfCertifiedDestructionAttempts.length > 0, 'self-certified destructions attempted');
  assert.ok(f.selfCertifiedDestructionAttempts.every((a) => !a.accepted));
  assert.ok(reasonsOf('DESTROY', (e) => e.verifier?.startsWith('scale:')).every((x) => x === 'NotVerifier'));
  assert.ok(f.cylinderReuseAttempts.every((a) => !a.accepted));
  assert.ok(f.paddedRecoveryAttempts.length > 0, 'padded recoveries attempted');
  assert.ok(f.paddedRecoveryAttempts.every((a) => !a.accepted));
  assert.ok(reasonsOf('RECOVER', (e) => String(e.cylinder).startsWith('cyl-probe-')).every((x) => x === 'RecoveryExceedsContent'));
  // both phantom profiles are present: naive (~full model charge) and adaptive (honest-looking)
  assert.deepEqual(new Set(Object.values(f.phantomProfiles)), new Set(['naive', 'adaptive']));
  for (const u of f.phantomUnits) assert.ok(r.ledger.equipment.get(u.unit).owner === f.colludingTakeBackPoints[0]);
});

test('observations carry no ground-truth labels', () => {
  const r = simulate(params, { seed: 42 });
  const files = {
    actors: toCsv(r.observations.actors),
    equipment: toCsv(r.observations.equipment),
    invoices: toCsv(r.observations.invoices),
    events: r.observations.events.map((e) => JSON.stringify(e)).join('\n'),
  };
  for (const [name, text] of Object.entries(files)) {
    for (const word of ['phantom', 'fraud', 'smuggl', 'onLedger', 'offLedger', 'leakRate', 'truth']) {
      assert.ok(!text.includes(word), `${name} leaks "${word}"`);
    }
  }
  assert.deepEqual(Object.keys(r.observations.invoices[0]), ['invoice', 'date', 'distributor', 'buyer', 'gas', 'grams']);
  // fake units are indistinguishable by ID
  const phantomIds = new Set(r.truth.fraud.phantomUnits.map((p) => p.unit));
  for (const e of r.observations.equipment) assert.match(e.id, /^eq-[0-9a-f]{8}$/);
  assert.ok([...phantomIds].every((id) => /^eq-[0-9a-f]{8}$/.test(id)));
});

test('end-of-life remaining charge falls inside the IPCC 2006 Table 7.9 ranges', () => {
  // Remaining charge is not drawn from the table: it emerges from maintenance behaviour.
  // - medium/large commercial and chillers (all Tier A, leak-checked) must sit inside their ranges;
  // - unserviced Tier B small units must mostly sit inside 0-80 % (their split-AC leak band is an
  //   unconfirmed assumption, so not all of them);
  // - small units that are Tier A (>= 5 tCO2e) are leak-checked by law and expected to be fuller than
  //   the generic IPCC default: a stated modelling choice, not checked here.
  const inside = { large: [0, 0], smallB: [0, 0] };
  for (const seed of [1, 2, 3]) {
    const r = simulate(params, { seed });
    for (const u of Object.values(r.truth.units)) {
      if (u.eolCharge === undefined) continue;
      const [lo, hi] = params.fleet.categories[u.category].ipccEolRemaining;
      const x = u.eolCharge / u.nameplate;
      const ok = x >= lo - 1e-9 && x <= hi + 1e-9 ? 1 : 0;
      const key = ['medium_large_commercial', 'chiller'].includes(u.category) ? 'large' : u.tier === 'B' ? 'smallB' : null;
      if (key) { inside[key][0] += ok; inside[key][1] += 1; }
    }
  }
  assert.ok(inside.large[0] / inside.large[1] > 0.9, `large Tier A inside IPCC: ${inside.large[0]}/${inside.large[1]}`);
  assert.ok(inside.smallB[0] / inside.smallB[1] > 0.7, `small Tier B inside IPCC: ${inside.smallB[0]}/${inside.smallB[1]}`);
});
