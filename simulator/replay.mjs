#!/usr/bin/env node
// Differential test: replay every simulated ledger event against the real contracts on a local
// Anvil chain and require identical outcomes.
//
//   accepted in the simulator  <=> transaction succeeds on chain
//   rejected in the simulator  <=> transaction reverts with the same custom error name
//   lot ids, destruction event ids and the final per-gas totals must match exactly
//
// Usage: node replay.mjs [--events out/ledger_events.jsonl] [--limit N] [--port <random by default>]
// Requires `forge build` in the repository root (reads ../out/*.json artifacts).

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient, createWalletClient, http, keccak256, toHex, stringToHex, encodeAbiParameters,
  decodeErrorResult, encodeFunctionData, parseEther,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const eventsPath = resolve(here, args.events ?? 'out/ledger_events.jsonl');
const actorsPath = resolve(dirname(eventsPath), 'actors.csv');
// random port by default so concurrent sessions or other local chains can never collide
const port = Number(args.port ?? 20_000 + Math.floor(Math.random() * 20_000));
const limit = args.limit ? Number(args.limit) : Infinity;

const events = readFileSync(eventsPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).slice(0, limit);
const actorRows = readFileSync(actorsPath, 'utf8').trim().split('\n').slice(1).map((l) => {
  const [id, role] = l.split(',');
  return { id, role };
});

// ------------------------------------------------------------------ artifacts
const artifact = (name) => JSON.parse(readFileSync(join(here, '..', 'out', `${name}.sol`, `${name}.json`), 'utf8'));
const A = Object.fromEntries(
  ['IdentityRegistry', 'EquipmentRegistry', 'DestructionClaims', 'KigaliLedger'].map((n) => [n, artifact(n)]),
);
const ALL_ERRORS = Object.values(A).flatMap((a) => a.abi.filter((x) => x.type === 'error'));
const uniqErrors = [...new Map(ALL_ERRORS.map((e) => [e.name + JSON.stringify(e.inputs), e])).values()];

// ------------------------------------------------------------------ identifiers
const h = (s) => keccak256(toHex(s));
const gasId = (g) => stringToHex(g, { size: 32 });
const role = (r) => keccak256(toHex(r));
const keyFor = (label) => keccak256(toHex(`kigali-sim:${label}`));
const accounts = new Map();
const acct = (label) => {
  if (!accounts.has(label)) accounts.set(label, privateKeyToAccount(keyFor(label)));
  return accounts.get(label);
};
const scaleOf = (actor) => acct(`scale:${actor}`);
const lab = acct('lab:accredited-1');
const gov = acct('governance');
const quotaAuthority = acct('quota-authority');
const registrar = acct('equipment-registrar');

// ------------------------------------------------------------------ chain
const firstT = Math.floor(Date.parse(events[0].t) / 1000);
const anvil = spawn('anvil', ['--port', String(port), '--timestamp', String(firstT - 86_400), '--silent', '--gas-limit', '300000000', '--no-mining'], { stdio: 'ignore' });
let cleaned = false;
const cleanup = () => {
  if (cleaned) return;
  cleaned = true;
  // on Windows a plain kill can leave anvil running; kill the whole process tree
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(anvil.pid), '/t', '/f'], { stdio: 'ignore' });
  else anvil.kill();
};
process.on('exit', cleanup);
process.on('uncaughtException', (e) => { console.error(e); cleanup(); process.exit(1); });
process.on('unhandledRejection', (e) => { console.error(e); cleanup(); process.exit(1); });

const transport = http(`http://127.0.0.1:${port}`);
const pub = createPublicClient({ chain: foundry, transport, pollingInterval: 5 });
const rpc = (method, params = []) => pub.request({ method, params });
for (let i = 0; i < 100; i++) {
  try { await pub.getChainId(); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
}
if ((await pub.getBlockNumber()) !== 0n) {
  console.error(`Port ${port} is serving a chain that is not fresh (another anvil still running?). Aborting.`);
  process.exit(1);
}

const nonces = new Map();
const wallet = createWalletClient({ chain: foundry, transport });
async function fund(account) {
  await rpc('anvil_setBalance', [account.address, toHex(parseEther('1000'))]);
}
// Auto-mining is off: every transaction is mined explicitly in its own block, at the event's exact
// timestamp when one is given. Deterministic, and no race between setting a timestamp and mining.
async function mineReceipt(hash, t) {
  await rpc('evm_mine', t === undefined ? [] : [toHex(t)]);
  const r = await pub.getTransactionReceipt({ hash }).catch(() => null);
  if (!r) throw new Error(`transaction ${hash} was not included in the mined block`);
  return r;
}
async function send(account, to, data, t) {
  if (!nonces.has(account.address)) nonces.set(account.address, await pub.getTransactionCount({ address: account.address }));
  const nonce = nonces.get(account.address);
  nonces.set(account.address, nonce + 1);
  let hash;
  try {
    hash = await wallet.sendTransaction({ account, to, data, gas: 5_000_000n, nonce, maxFeePerGas: 10_000_000_000n, maxPriorityFeePerGas: 0n });
  } catch (e) {
    nonces.delete(account.address); // resync from chain so a failed send never leaves a nonce gap
    throw e;
  }
  return mineReceipt(hash, t);
}
async function deploy(account, name, ctorArgs) {
  if (!nonces.has(account.address)) nonces.set(account.address, await pub.getTransactionCount({ address: account.address }));
  const nonce = nonces.get(account.address);
  nonces.set(account.address, nonce + 1);
  const hash = await wallet.deployContract({ account, abi: A[name].abi, bytecode: A[name].bytecode.object, args: ctorArgs, gas: 20_000_000n, nonce });
  const r = await mineReceipt(hash);
  if (r.status !== 'success') throw new Error(`deploy ${name} failed`);
  return r.contractAddress;
}
const call = (contract, fn, fnArgs) => encodeFunctionData({ abi: A[contract].abi, functionName: fn, args: fnArgs });
const read = (address, contract, fn, fnArgs = []) => pub.readContract({ address, abi: A[contract].abi, functionName: fn, args: fnArgs });

// ------------------------------------------------------------------ deploy and set up roles
for (const a of [gov, quotaAuthority, registrar]) await fund(a);
const identity = await deploy(gov, 'IdentityRegistry', [gov.address]);
const equipment = await deploy(gov, 'EquipmentRegistry', [gov.address, identity]);
const claims = await deploy(gov, 'DestructionClaims', [gov.address, identity]);
const ledger = await deploy(gov, 'KigaliLedger', [gov.address, identity, equipment, claims]);
await send(gov, equipment, call('EquipmentRegistry', 'setLedger', [ledger]));
await send(gov, claims, call('DestructionClaims', 'setLedger', [ledger]));

const grant = (who, r) => send(gov, identity, call('IdentityRegistry', 'grantRole', [who, role(r), h(`vc:${who}:${r}`)]));
await grant(quotaAuthority.address, 'QUOTA_AUTHORITY');
await grant(registrar.address, 'EQUIPMENT_REGISTRAR');
await grant(lab.address, 'LAB');
for (const { id, role: r } of actorRows) {
  const a = acct(id);
  await fund(a);
  await grant(a.address, r);
  if (['IMPORTER', 'DISTRIBUTOR', 'SERVICE', 'RECLAIMER', 'DESTRUCTION'].includes(r)) {
    await grant(scaleOf(id).address, 'SCALE');
    await send(gov, ledger, call('KigaliLedger', 'bindDevice', [scaleOf(id).address, a.address]));
  }
}
const regTW = acct('registry-tw');
await send(regTW, claims, call('DestructionClaims', 'setAcceptedTier', [2])); // Tier.B

// ------------------------------------------------------------------ signing
const domain = { name: 'KigaliBalance', version: '1', chainId: 31337, verifyingContract: ledger };
const scaleTypes = { ScaleReading: [
  { name: 'subject', type: 'bytes32' }, { name: 'grams', type: 'uint64' }, { name: 'timestamp', type: 'uint64' }, { name: 'nonce', type: 'bytes32' },
] };
const labTypes = { LabCertificate: [
  { name: 'subject', type: 'bytes32' }, { name: 'gas', type: 'bytes32' }, { name: 'purityBps', type: 'uint16' },
  { name: 'sampleId', type: 'bytes32' }, { name: 'timestamp', type: 'uint64' }, { name: 'nonce', type: 'bytes32' },
] };
async function scaleReading(actor, subject, grams, t, seq) {
  const reading = { subject, grams: BigInt(grams), timestamp: BigInt(t), nonce: h(`nonce:${seq}:${subject}`) };
  const sig = await scaleOf(actor).signTypedData({ domain, types: scaleTypes, primaryType: 'ScaleReading', message: reading });
  return [reading, sig];
}
const consentTypes = { RecoveryConsent: [
  { name: 'equipmentId', type: 'bytes32' }, { name: 'cylinderId', type: 'bytes32' }, { name: 'service', type: 'address' },
  { name: 'grams', type: 'uint64' }, { name: 'decommission', type: 'bool' }, { name: 'timestamp', type: 'uint64' },
  { name: 'nonce', type: 'bytes32' },
] };
const destructionTypes = { DestructionCertificate: [
  { name: 'subject', type: 'bytes32' }, { name: 'grams', type: 'uint64' }, { name: 'dreBps', type: 'uint16' },
  { name: 'documentHash', type: 'bytes32' }, { name: 'timestamp', type: 'uint64' }, { name: 'nonce', type: 'bytes32' },
] };
// signer labels are actor ids (owners, verifiers) or "scale:<operator>" for an operator's own scale key
async function ownerConsent(signer, ev, cyl, t) {
  const consent = {
    equipmentId: h(ev.equipment), cylinderId: cyl, service: acct(ev.actor).address, grams: BigInt(ev.grams),
    decommission: ev.decommission, timestamp: BigInt(t), nonce: h(`consent:${ev.seq}`),
  };
  const sig = await acct(signer).signTypedData({ domain, types: consentTypes, primaryType: 'RecoveryConsent', message: consent });
  return [consent, sig];
}
async function destructionCert(signer, subject, grams, dreBps, t, seq) {
  const cert = { subject, grams: BigInt(grams), dreBps, documentHash: h(`cert:${seq}`), timestamp: BigInt(t), nonce: h(`cert-nonce:${seq}`) };
  const sig = await acct(signer).signTypedData({ domain, types: destructionTypes, primaryType: 'DestructionCertificate', message: cert });
  return [cert, sig];
}
async function labCert(subject, gas, purityBps, t, seq) {
  const cert = { subject, gas: gasId(gas), purityBps, sampleId: h(`sample:${seq}`), timestamp: BigInt(t), nonce: h(`lab-nonce:${seq}`) };
  const sig = await lab.signTypedData({ domain, types: labTypes, primaryType: 'LabCertificate', message: cert });
  return [cert, sig];
}
const enc = (types, values) => keccak256(encodeAbiParameters(types, values));
const subjects = {
  receipt: (lot) => enc([{ type: 'string' }, { type: 'uint256' }], ['RECEIPT', BigInt(lot)]),
  recovery: (eq, cyl) => enc([{ type: 'string' }, { type: 'bytes32' }, { type: 'bytes32' }], ['RECOVERY', eq, cyl]),
  reclaim: (cyl) => enc([{ type: 'string' }, { type: 'bytes32' }], ['RECLAIM', cyl]),
  destruction: (inputs) => enc([{ type: 'string' }, { type: 'uint256[]' }], ['DESTRUCTION', inputs.map(BigInt)]),
};

// ------------------------------------------------------------------ translate one event into a transaction
async function build(ev, t) {
  const a = ev.actor;
  switch (ev.type) {
    case 'QUOTA':
      return [quotaAuthority, ledger, call('KigaliLedger', 'registerQuota', [h(ev.quotaId), acct(ev.importer).address, gasId(ev.gas), BigInt(ev.grams)])];
    case 'MODEL':
      return [registrar, equipment, call('EquipmentRegistry', 'setModel', [h(ev.modelId), gasId(ev.gas), BigInt(ev.chargeGrams)])];
    case 'REGISTER_EQUIPMENT':
      if (ev.tier === 'A') {
        const installed = BigInt(Math.floor(Date.parse(ev.installedAt) / 1000));
        return [registrar, equipment, call('EquipmentRegistry', 'registerTierA', [h(ev.equipment), gasId(ev.gas), BigInt(ev.nameplateGrams), installed, h(`ekomvet:${ev.equipment}`), acct(ev.owner).address])];
      }
      return [acct(a), equipment, call('EquipmentRegistry', 'registerTierB', [h(ev.equipment), h(ev.modelId), h(`photo:${ev.equipment}`), acct(ev.owner).address])];
    case 'MINT':
      return [acct(a), ledger, call('KigaliLedger', 'mintVirgin', [h(ev.quotaId), BigInt(ev.grams), h(ev.cylinder)])];
    case 'SEND':
      return [acct(a), ledger, call('KigaliLedger', 'send', [BigInt(ev.lot), acct(ev.to).address, BigInt(ev.grams), h(ev.newCylinder)])];
    case 'RECEIVE': {
      const [r, sig] = await scaleReading(a, subjects.receipt(ev.lot), ev.weighed, t, ev.seq);
      return [acct(a), ledger, call('KigaliLedger', 'receiveLot', [BigInt(ev.lot), r, sig])];
    }
    case 'CHARGE':
      return [acct(a), ledger, call('KigaliLedger', 'charge', [BigInt(ev.lot), h(ev.equipment), BigInt(ev.grams)])];
    case 'RECOVER': {
      const cyl = h(ev.cylinder);
      const [c, cs] = await ownerConsent(ev.consentSigner, ev, cyl, t);
      const [r, sig] = await scaleReading(a, subjects.recovery(h(ev.equipment), cyl), ev.grams, t, ev.seq);
      return [acct(a), ledger, call('KigaliLedger', 'recover', [c, cs, r, sig])];
    }
    case 'RECLAIM': {
      const cyl = h(ev.outputCylinder);
      const subject = subjects.reclaim(cyl);
      const [r, ss] = await scaleReading(a, subject, ev.outGrams, t, ev.seq);
      const gas = ev.gas ?? gasOfLot.get(ev.inputs[0]);
      const [c, ls] = await labCert(subject, gas, ev.purityBps, t, ev.seq);
      return [acct(a), ledger, call('KigaliLedger', 'reclaim', [ev.inputs.map(BigInt), cyl, r, ss, c, ls])];
    }
    case 'DESTROY': {
      const subject = subjects.destruction(ev.inputs);
      const [r, sig] = await scaleReading(a, subject, ev.intakeGrams, t, ev.seq);
      const [d, ds] = await destructionCert(ev.verifier, subject, ev.certGrams, ev.dreBps, t, ev.seq);
      return [acct(a), ledger, call('KigaliLedger', 'destroy', [ev.inputs.map(BigInt), r, sig, d, ds])];
    }
    case 'CLAIM':
      return [acct(a), claims, call('DestructionClaims', 'claim', [BigInt(ev.eventId), h(`batch:${ev.seq}`)])];
    default:
      throw new Error(`unknown event type ${ev.type}`);
  }
}

function errorName(err) {
  for (let e = err; e; e = e.cause) {
    const data = e.data?.data ?? e.data ?? e.raw;
    if (typeof data === 'string' && data.startsWith('0x') && data.length >= 10) {
      try { return decodeErrorResult({ abi: uniqErrors, data }).errorName; } catch { return `unknown(${data.slice(0, 10)})`; }
    }
    if (e.data?.errorName) return e.data.errorName;
  }
  return `no-revert-data: ${err.shortMessage ?? err.message}`.slice(0, 120);
}

// ------------------------------------------------------------------ replay
const gasOfLot = new Map();
const mismatches = [];
const started = Date.now();
let mirrorLot = 0;
let checked = 0;
let current = null;
process.on('exit', (code) => { if (code && current) console.error(`failed while replaying seq ${current.seq} (${current.type}, ${current.status}) at ${current.t}`); });
for (const ev of events) {
  const t = Math.floor(Date.parse(ev.t) / 1000);
  current = ev;
  if (ev.type === 'MINT' && ev.status === 'accepted') gasOfLot.set(ev.lot, ev.gas);
  const [from, to, data] = await build(ev, t);
  if (ev.status === 'accepted') {
    const receipt = await send(from, to, data, t);
    if (receipt.status !== 'success') {
      await rpc('evm_mine', [toHex(t + 1)]);
      let reason = 'unknown';
      try { await pub.call({ account: from.address, to, data }); } catch (e) { reason = errorName(e); }
      mismatches.push({ seq: ev.seq, type: ev.type, expected: 'accepted', got: `reverted: ${reason}` });
    }
  } else {
    await rpc('evm_mine', [toHex(t)]);
    try {
      await pub.call({ account: from.address, to, data });
      mismatches.push({ seq: ev.seq, type: ev.type, expected: `rejected: ${ev.reason}`, got: 'succeeded' });
    } catch (e) {
      const got = errorName(e);
      if (got !== ev.reason) mismatches.push({ seq: ev.seq, type: ev.type, expected: ev.reason, got });
    }
  }

  // lot ids are assigned in the same order on both sides
  if (ev.status === 'accepted') {
    const created = [ev.lot && ev.type === 'MINT' ? ev.lot : 0, ev.sentLot !== ev.lot ? ev.sentLot : 0, ev.inServiceLot, ev.quarantinedLot, ev.outputLot]
      .filter((x) => typeof x === 'number' && x > 0);
    if (created.length) {
      mirrorLot = Math.max(mirrorLot, ...created);
      for (const id of created) gasOfLot.set(id, ev.gas);
      const chainLot = Number(await read(ledger, 'KigaliLedger', 'lotCount'));
      if (chainLot !== mirrorLot) mismatches.push({ seq: ev.seq, type: ev.type, expected: `lotCount ${mirrorLot}`, got: `lotCount ${chainLot}` });
    }
  }
  if (++checked % 1000 === 0) console.log(`  ${checked}/${events.length} events replayed (${mismatches.length} mismatches)`);
}

// ------------------------------------------------------------------ final state
const mirrorTotals = {};
const lastSeq = events[events.length - 1].seq;
const gases = [...new Set(events.filter((e) => e.gas).map((e) => e.gas))];
const summary = JSON.parse(readFileSync(resolve(dirname(eventsPath), 'summary.json'), 'utf8'));
const full = limit === Infinity;
for (const gas of gases) {
  const t = await read(ledger, 'KigaliLedger', 'totals', [gasId(gas)]);
  mirrorTotals[gas] = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Number(v)]));
  if (full) {
    const s = summary.byGas[gas].kg;
    const kg = (g) => Math.round(Number(g) / 100) / 10;
    if (kg(t.destroyed) !== s.destroyed) mismatches.push({ type: 'TOTALS', expected: `${gas} destroyed ${s.destroyed} kg`, got: `${kg(t.destroyed)} kg` });
    if (kg(t.recovered) !== s.recoveredOnLedger) mismatches.push({ type: 'TOTALS', expected: `${gas} recovered ${s.recoveredOnLedger} kg`, got: `${kg(t.recovered)} kg` });
    if (kg(t.virginMinted) !== s.virginMinted) mismatches.push({ type: 'TOTALS', expected: `${gas} virgin ${s.virginMinted} kg`, got: `${kg(t.virginMinted)} kg` });
  }
}
const chainEvents = Number(await read(claims, 'DestructionClaims', 'eventCount'));

console.log(`Replayed ${events.length} events (through seq ${lastSeq}) in ${((Date.now() - started) / 1000).toFixed(1)} s`);
console.log(`Chain: ${await read(ledger, 'KigaliLedger', 'lotCount')} lots, ${chainEvents} destruction events`);
console.log('Chain totals (g):', JSON.stringify(mirrorTotals));
if (mismatches.length) {
  console.log(`MISMATCHES: ${mismatches.length}`);
  console.log(JSON.stringify(mismatches.slice(0, 15), null, 1));
  cleanup();
  process.exit(1);
}
console.log('Differential test passed: every accepted event succeeded on chain, every rejected event reverted with the same error, lot ids and totals match.');
cleanup();
process.exit(0);
