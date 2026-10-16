// Write web/data/chain.json: deployed addresses plus the PUBLIC addresses of the demo actors, so the
// web pages can label them. The demo actor keys are derived from the deployer key exactly as in
// script/Deploy.s.sol; the key is read from .env locally and never written anywhere.
//
//   node web/build_chain.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const require = createRequire(resolve(root, 'simulator/package.json'));
const { keccak256, encodeAbiParameters } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const env = readFileSync(resolve(root, '.env'), 'utf8');
const pk = BigInt(env.match(/^DEPLOYER_PRIVATE_KEY=\s*"?(0x[0-9a-fA-F]{64})/m)[1]);
const derive = (label) => {
  const h = BigInt(keccak256(encodeAbiParameters([{ type: 'uint256' }, { type: 'string' }, { type: 'string' }], [pk, 'kigali-balance-demo', label])));
  const k = (h % (N - 1n)) + 1n;
  return privateKeyToAccount(`0x${k.toString(16).padStart(64, '0')}`).address;
};
const LABELS = process.argv.slice(2);
const dep = JSON.parse(readFileSync(resolve(root, 'deployments/11155420.json'), 'utf8'));
const names = {
  'quota-authority': 'Quota authority', 'equipment-registrar': 'Equipment registrar', regulator: 'Regulator', 'ai-oracle': 'AI oracle',
  importer: 'Importer', distributor: 'Distributor', 'service-company': 'Service company', reclaimer: 'Reclaimer',
  'destruction-facility': 'Destruction facility', 'registry-taiwan': 'Carbon registry (Taiwan, simulated)',
  'registry-international': 'Carbon registry (international, simulated)', 'owner-supermarket': 'Equipment owner (supermarket)',
  'destruction-verifier': 'Destruction verifier', lab: 'Accredited lab',
  ...Object.fromEntries(LABELS.map((l) => [l, l])),
};
const actors = {};
for (const [label, name] of Object.entries(names)) actors[derive(label)] = name;
actors[dep.deployer] = 'Deployer';
const out = {
  chainId: dep.chainId, rpc: 'https://sepolia.optimism.io', explorer: 'https://sepolia-optimism.etherscan.io',
  contracts: Object.fromEntries(['KigaliLedger', 'EquipmentRegistry', 'DestructionClaims', 'IdentityRegistry', 'FlagRegistry', 'Governance'].map((k) => [k, dep[k]])),
  actors,
  labels: {
    'demo/quota/TR/2026/importer/R-404A': 'Import quota document (simulated, Türkiye 2026)',
    'demo/EKOMVET/supermarket-freezer': 'Supermarket freezer (Tier A, simulated EKOMVET record)',
    'demo/EKOMVET/cold-room': 'Cold room (Tier A, simulated EKOMVET record)',
    'demo/EKOMVET/display-case': 'Display case (Tier A, simulated EKOMVET record)',
  },
  note: dep.note,
};
// sanity: derived addresses must match the ones the deploy script recorded
for (const [label, key] of [['importer', 'importer'], ['distributor', 'distributor'], ['service-company', 'serviceCompany'], ['registry-taiwan', 'registryTaiwan']]) {
  if (derive(label) !== dep[key]) throw new Error(`derivation mismatch for ${label}`);
}
writeFileSync(resolve(here, 'data/chain.json'), JSON.stringify(out, null, 2));
console.log(`wrote web/data/chain.json with ${Object.keys(actors).length} labelled addresses`);
