// Unit tests of the rule mirror, written to match the Solidity tests case by case.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LedgerMirror } from '../src/ledger.mjs';

const rules = {
  transferToleranceBps: 100, minReclaimLossBps: 200, minReclaimPurityBps: 9950, minDreBps: 9999,
  tierAToleranceBps: 500, tierBMonthlyCapGrams: 50_000, minResidenceDays: 180,
};
const T0 = 1_790_000_000;
const DAY = 86_400;
const OLD = 1_600_000_000;

function setup() {
  const L = new LedgerMirror(rules);
  L.addOwner('own'); // operator of eqA
  L.addOwner('tb'); // take-back point owning scrapped Tier B units
  L.addVerifier('ver');
  L.registerQuota(T0, 'q', 'imp', 'R-404A', 100_000);
  L.registerTierA(T0, 'eqA', 'R-404A', 10_000, OLD, 'medium_large_commercial', 'own');
  L.setModel(T0, 'm', 'R-404A', 1_200);
  return L;
}
const move = (L, t, from, lot, to, g) => {
  const s = L.send(t, from, lot, to, g);
  L.receive(t, to, s, g);
  return s;
};
const lastReason = (L) => L.events[L.events.length - 1].reason;

test('R1 quota', () => {
  const L = setup();
  assert.ok(L.mintVirgin(T0, 'imp', 'q', 60_000));
  assert.equal(L.mintVirgin(T0, 'imp', 'q', 40_001), null);
  assert.equal(lastReason(L), 'QuotaExceeded');
});

test('R2 underweight receipt becomes handling loss', () => {
  const L = setup();
  const lot = L.mintVirgin(T0, 'imp', 'q', 10_000);
  const s = L.send(T0, 'imp', lot, 'dist', 10_000);
  L.receive(T0, 'dist', s, 9_500);
  assert.equal(L.lots.get(s).grams, 9_500);
  assert.equal(L.totalsOf('R-404A').handlingLoss, 500);
  assert.equal(L.events.at(-1).discrepancy, 'UNDERWEIGHT_ON_RECEIPT');
});

test('R3 cap: 10 kg nameplate + 5 % tolerance', () => {
  const L = setup();
  assert.equal(L.recover(T0, 'svc', 'eqA', 10_501, true), null);
  assert.equal(lastReason(L), 'RecoveryExceedsCharge');
  assert.ok(L.recover(T0, 'svc', 'eqA', 6_000, false));
  assert.equal(L.recover(T0, 'svc', 'eqA', 4_501, true), null);
  assert.equal(lastReason(L), 'RecoveryCapExceeded', 'the lifetime total still applies');
  assert.ok(L.recover(T0, 'svc', 'eqA', 4_500, true));
});

test('R3 per recovery: top-ups on a leaky unit never allow more than one charge at once', () => {
  const L = setup();
  const v = L.mintVirgin(T0, 'imp', 'q', 20_000);
  const s = move(L, T0, 'imp', v, 'svc', 20_000);
  L.charge(T0, 'svc', s, 'eqA', 20_000);
  assert.equal(L.recoveryCap('eqA'), 30_500);
  assert.equal(L.recover(T0 + 181 * DAY, 'svc', 'eqA', 10_501, false), null);
  assert.equal(lastReason(L), 'RecoveryExceedsCharge');
  assert.ok(L.recover(T0 + 181 * DAY, 'svc', 'eqA', 10_500, false));
});

test('R4 yield ceiling and R5 class rule', () => {
  const L = setup();
  const { inService } = L.recover(T0, 'svc', 'eqA', 8_000, true);
  const r = move(L, T0, 'svc', inService, 'rec', 8_000);
  assert.equal(L.reclaim(T0, 'rec', [r], 7_841, 9_960), null);
  assert.equal(lastReason(L), 'ReclaimExceedsInput');
  const v = move(L, T0, 'imp', L.mintVirgin(T0, 'imp', 'q', 5_000), 'rec', 5_000);
  assert.equal(L.reclaim(T0, 'rec', [r, v], 9_000, 9_960), null);
  assert.equal(lastReason(L), 'ClassNotReclaimable');
  assert.ok(L.reclaim(T0, 'rec', [r], 7_840, 9_960));
});

test('residence rule: only recent top-ups are quarantined', () => {
  const L = setup();
  const lot = move(L, T0, 'imp', L.mintVirgin(T0, 'imp', 'q', 500), 'svc', 500);
  L.charge(T0, 'svc', lot, 'eqA', 500);
  const res = L.recover(T0 + 60 * DAY, 'svc', 'eqA', 8_000, true);
  assert.equal(L.lots.get(res.inService).grams, 7_500);
  assert.equal(L.lots.get(res.inService).tier, 'A');
  assert.equal(L.lots.get(res.quarantined).grams, 500);
  assert.equal(L.lots.get(res.quarantined).tier, 'C');
});

test('charge-and-recover laundering is fully quarantined and cannot be reclaimed', () => {
  const L = setup();
  const lot = move(L, T0, 'imp', L.mintVirgin(T0, 'imp', 'q', 9_000), 'svc', 9_000);
  L.charge(T0, 'svc', lot, 'eqA', 9_000);
  const res = L.recover(T0 + DAY, 'svc', 'eqA', 9_000, true);
  assert.equal(res.inService, 0);
  const q = move(L, T0 + DAY, 'svc', res.quarantined, 'rec', 9_000);
  assert.equal(L.reclaim(T0 + DAY, 'rec', [q], 8_000, 9_990), null);
  assert.equal(lastReason(L), 'TierNotReclaimable');
});

test('Tier B monthly cap per service company', () => {
  const L = setup();
  for (let i = 0; i < 41; i++) L.registerTierB(T0, 'svc', `b${i}`, 'm', 'split_ac', 'tb');
  for (let i = 0; i < 41; i++) L.recover(T0, 'svc', `b${i}`, 1_200, true);
  // 41 x 1.2 kg = 49.2 kg fits under 50 kg; the next one does not
  L.registerTierB(T0, 'svc', 'b41', 'm', 'split_ac', 'tb');
  assert.equal(L.recover(T0, 'svc', 'b41', 1_200, true), null);
  assert.equal(lastReason(L), 'TierBMonthlyCapExceeded');
});

test('R6 eligibility and R7 single claim with registry tier policy', () => {
  const L = setup();
  const { inService } = L.recover(T0, 'svc', 'eqA', 5_000, true);
  const f = move(L, T0, 'svc', inService, 'fac', 5_000);
  const ev = L.destroy(T0, 'fac', [f], 5_000, 9_999, { verifier: 'ver' });
  assert.equal(L.destructionEvents[ev].eligible, true);
  assert.ok(L.claim(T0, 'registry-tw', 'B', ev));
  assert.equal(L.claim(T0, 'registry-intl', 'A', ev), null);
  assert.equal(lastReason(L), 'AlreadyClaimed');
});

test('ledger identity holds after a mixed sequence', () => {
  const L = setup();
  const v = move(L, T0, 'imp', L.mintVirgin(T0, 'imp', 'q', 20_000), 'svc', 20_000);
  L.charge(T0, 'svc', v, 'eqA', 3_000);
  const { inService } = L.recover(T0 + 200 * DAY, 'svc', 'eqA', 8_000, true);
  const r = move(L, T0 + 200 * DAY, 'svc', inService, 'rec', 8_000);
  L.reclaim(T0 + 200 * DAY, 'rec', [r], 7_000, 9_960);
  const t = L.totalsOf('R-404A');
  assert.equal(t.virginMinted + t.unknownDeclared + t.recovered, t.live + t.charged + t.destroyed + t.reclaimLoss + t.handlingLoss);
});

test('H1 recovery needs the unit owner as an independent co-signer', () => {
  const L = setup();
  assert.equal(L.recover(T0, 'svc', 'eqA', 4_000, false, { consentSigner: 'scale:svc' }), null);
  assert.equal(lastReason(L), 'NotUnitOwner');
  assert.equal(L.recover(T0, 'svc', 'eqA', 4_000, false, { consentSigner: 'tb' }), null); // an owner, but not of eqA
  assert.equal(lastReason(L), 'NotUnitOwner');
  assert.equal(L.equipment.get('eqA').recovered, 0, 'rejected attempts change nothing');
  L.addOwner('svc');
  assert.equal(L.registerTierB(T0, 'svc', 'b1', 'm', 'split_ac', 'svc'), null);
  assert.equal(lastReason(L), 'OwnerNotIndependent');
  assert.ok(L.recover(T0, 'svc', 'eqA', 4_000, false));
});

test('H4 destruction needs an independent verifier', () => {
  const L = setup();
  const { inService } = L.recover(T0, 'svc', 'eqA', 5_000, true);
  const f = move(L, T0, 'svc', inService, 'fac', 5_000);
  assert.equal(L.destroy(T0, 'fac', [f], 5_000, 9_999, { verifier: 'scale:fac' }), null);
  assert.equal(lastReason(L), 'NotVerifier');
  assert.equal(L.destroy(T0, 'fac', [f], 5_000, 9_999, { verifier: 'ver', certGrams: 4_000 }), null);
  assert.equal(lastReason(L), 'CertificateMismatch');
  assert.equal(L.lots.get(f).status, 'ACTIVE', 'rejected attempts change nothing');
  assert.notEqual(L.destroy(T0, 'fac', [f], 5_000, 9_999, { verifier: 'ver' }), null);
});

test('M8 cap includes ledger top-ups', () => {
  const L = setup();
  const { inService } = L.recover(T0, 'svc', 'eqA', 4_000, false);
  L.charge(T0, 'svc', inService, 'eqA', 4_000);
  assert.equal(L.recoveryCap('eqA'), 14_500);
  assert.ok(L.recover(T0 + 181 * DAY, 'svc', 'eqA', 9_000, true));
});

test('M1 one open lot per cylinder; split recoveries share theirs', () => {
  const L = setup();
  const v = L.mintVirgin(T0, 'imp', 'q', 1_000, 'cyl-x');
  assert.equal(L.mintVirgin(T0, 'imp', 'q', 1_000, 'cyl-x'), null);
  assert.equal(lastReason(L), 'CylinderInUse');
  const s1 = move(L, T0, 'imp', v, 'svc', 1_000);
  assert.equal(L.recover(T0, 'svc', 'eqA', 4_000, true, { cylinder: 'cyl-x' }), null);
  assert.equal(lastReason(L), 'CylinderInUse');
  L.charge(T0, 'svc', s1, 'eqA', 1_000); // empties the lot: the cylinder is free again
  const res = L.recover(T0 + 60 * DAY, 'svc', 'eqA', 8_000, true, { cylinder: 'cyl-x' });
  assert.ok(res.inService && res.quarantined);
  assert.equal(L.openLotsIn('cyl-x'), 2);
});
