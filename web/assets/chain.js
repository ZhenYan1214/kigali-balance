// Read the deployed contracts on OP Sepolia straight from the browser (public RPC, read-only).
import { createPublicClient, http, parseAbi, keccak256, stringToBytes, hexToString } from 'https://cdn.jsdelivr.net/npm/viem@2.57.6/+esm';

const LOT = '(bytes32 gas,uint64 grams,uint8 cls,uint8 status,uint8 tier,address holder,address pendingTo,bytes32 cylinderId,bytes32 origin,uint256 parent,uint64 createdAt)';
const TOTALS = '(uint128 virginMinted,uint128 unknownDeclared,uint128 recovered,uint128 live,uint128 charged,uint128 destroyed,uint128 reclaimLoss,uint128 handlingLoss)';
const DEST = '(address facility,bytes32 gas,uint64 grams,uint64 destroyedAt,uint16 dreBps,bool creditEligible,uint8 worstTier,bytes32 certificateHash,address claimedBy,bytes32 creditBatchRef,uint64 claimedAt)';
const EQUIP = '(bytes32 gas,uint64 nameplateGrams,uint64 chargedGrams,uint64 recoveredGrams,uint64 installedAt,uint64 lastChargeAt,uint64 registeredAt,uint8 tier,uint8 status,bytes32 sourceRef,bytes32 modelId,address registeredBy,address owner)';

const ABI = {
  ledger: parseAbi([
    'function lotCount() view returns (uint256)',
    `function getLot(uint256) view returns (${LOT})`,
    'function reclaimInputs(uint256) view returns (uint256[])',
    `function totals(bytes32) view returns (${TOTALS})`,
  ]),
  claims: parseAbi([
    'function eventCount() view returns (uint256)',
    `function destructionEvent(uint256) view returns (${DEST})`,
  ]),
  equipment: parseAbi([`function equipment(bytes32) view returns (${EQUIP})`, 'function recoveryCap(bytes32) view returns (uint64)']),
  flags: parseAbi(['function flagCount() view returns (uint256)']),
};

export const CLS = ['NONE', 'VIRGIN', 'RECOVERED', 'RECLAIMED', 'UNKNOWN'];
export const STATUS = ['NONE', 'ACTIVE', 'IN_TRANSIT', 'CONSUMED'];
export const TIER = [null, 'A', 'B', 'C'];

let ctx;
export async function chain() {
  if (ctx) return ctx;
  const info = await fetch('data/chain.json').then((r) => r.json());
  const client = createPublicClient({
    chain: { id: info.chainId, name: 'OP Sepolia', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [info.rpc] } } },
    transport: http(info.rpc, { batch: true, retryCount: 2 }),
  });
  const labels = Object.fromEntries(Object.entries(info.labels).map(([s, name]) => [keccak256(stringToBytes(s)), name]));
  const actors = Object.fromEntries(Object.entries(info.actors).map(([a, n]) => [a.toLowerCase(), n]));
  ctx = { info, client, labels, actors };
  return ctx;
}

const read = async (address, abi, functionName, args = []) => (await chain()).client.readContract({ address, abi, functionName, args });

export const gasName = (b32) => {
  try { return hexToString(b32, { size: 32 }).replace(/\0+$/, ''); } catch { return b32; }
};
export const gasId = (name) => `0x${[...new TextEncoder().encode(name)].map((b) => b.toString(16).padStart(2, '0')).join('').padEnd(64, '0')}`;

export async function actorName(addr) {
  const { actors } = await chain();
  return actors[addr?.toLowerCase()] ?? `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
export async function labelOf(b32) {
  const { labels } = await chain();
  return labels[b32] ?? null;
}

export async function overview() {
  const { info } = await chain();
  const c = info.contracts;
  const [lotCount, totals, eventCount, flagCount] = await Promise.all([
    read(c.KigaliLedger, ABI.ledger, 'lotCount'),
    read(c.KigaliLedger, ABI.ledger, 'totals', [gasId('R-404A')]),
    read(c.DestructionClaims, ABI.claims, 'eventCount'),
    read(c.FlagRegistry, ABI.flags, 'flagCount'),
  ]);
  const events = await Promise.all([...Array(Number(eventCount)).keys()].map((i) => read(c.DestructionClaims, ABI.claims, 'destructionEvent', [BigInt(i)])));
  return { info, lotCount: Number(lotCount), totals, events, flagCount: Number(flagCount) };
}

export async function lot(id) {
  const { info } = await chain();
  const c = info.contracts;
  const l = await read(c.KigaliLedger, ABI.ledger, 'getLot', [BigInt(id)]);
  const out = { id: Number(id), ...l, clsName: CLS[l.cls], statusName: STATUS[l.status], tierName: TIER[l.tier], gasName: gasName(l.gas) };
  if (out.clsName === 'RECLAIMED') out.inputs = (await read(c.KigaliLedger, ABI.ledger, 'reclaimInputs', [BigInt(id)])).map(Number);
  if (out.clsName === 'RECOVERED') {
    out.equipment = await read(c.EquipmentRegistry, ABI.equipment, 'equipment', [l.origin]);
    out.cap = await read(c.EquipmentRegistry, ABI.equipment, 'recoveryCap', [l.origin]);
  }
  return out;
}
