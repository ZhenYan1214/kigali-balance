import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';
import { MODULES, GAS_COLOR, roleLabel, kg, fmt, el, icon, status, chrome, loadSim } from './common.js';

chrome('passport');
const params = new URLSearchParams(location.search);
const state = { source: params.get('source') === 'chain' ? 'chain' : 'sim' };
const out = document.getElementById('out');

// Simulated examples come from the data bundle (chosen by web/build_data.mjs); the live ones are
// lots created by the demo deployment on OP Sepolia.
const CHAIN_EXAMPLES = [
  [6, 'Reclaimed lot, live'],
  [4, 'Tier A recovery, live'],
];
const COLOR = { VIRGIN: 'var(--c-virgin)', RECOVERED: 'var(--c-recovered)', RECLAIMED: 'var(--c-reclaimed)', C: 'var(--c-quarantine)', UNKNOWN: 'var(--c-loss)' };
const colorOf = (cls, tier) => (tier === 'C' ? COLOR.C : COLOR[cls] ?? 'var(--rule-strong)');
const clsName = (cls, tier) => (cls === 'RECOVERED' && tier === 'C' ? 'Recovered, tier C (quarantined)' : cls === 'VIRGIN' ? 'Virgin, quota-backed' : `${cls[0]}${cls.slice(1).toLowerCase()}${tier ? `, Tier ${tier}` : ''}`);
const lotNo = (id) => String(id).padStart(3, '0');
const href = (source, id) => `passport.html?${source === 'chain' ? 'source=chain&' : ''}lot=${id}`;
const link = (source, id, text) => el('a', { href: href(source, id) }, text ?? `Lot ${lotNo(id)}`);
const gasTag = (gas) => el('span', { class: 'tagline' }, el('i', { style: { background: GAS_COLOR[gas] ?? 'var(--muted)' } }), gas);
const clsTag = (cls, tier) => el('span', { class: 'tagline' }, el('i', { style: { background: colorOf(cls, tier) } }), clsName(cls, tier));

// ------------------------------------------------------------------ lookup form
const input = document.getElementById('lot-input');
const source = document.getElementById('source');
const hint = document.getElementById('lot-hint');
source.value = state.source;
source.addEventListener('change', () => { state.source = source.value; hint.textContent = ''; });
input.addEventListener('input', () => { hint.textContent = ''; });

const data = await loadSim();
document.getElementById('search').addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = input.value.trim();
  const id = Number(raw);
  if (!raw || !Number.isInteger(id) || id < 1) { hint.textContent = 'Enter a lot number, for example 42.'; input.focus(); return; }
  if (state.source === 'sim' && id > data.lots.length) { hint.textContent = `The simulated ledger has lots 1 to ${data.lots.length}.`; input.focus(); return; }
  location.search = `${state.source === 'chain' ? 'source=chain&' : ''}lot=${id}`;
});

// lots with a GS1 EPCIS 2.0 export (simulator/epcis/export_epcis.mjs); a missing index just hides the link
const epcisFiles = await fetch('data/epcis/index.json').then((r) => (r.ok ? r.json() : { examples: [] })).catch(() => ({ examples: [] }))
  .then((ix) => new Map(ix.examples.map((x) => [x.lot, x.file])));
const lots = new Map(data.lots.map((l) => [l.id, l]));
const flagsFor = (actor) => ['a', 'b', 'c'].flatMap((m) => data.ai[m].flags.filter((f) => f.actor === actor && f.severity !== 'none').map((f) => ({ ...f, m })));

const current = `${location.pathname.split('/').pop() || 'passport.html'}${location.search}`;
const example = (url, text) => el('a', { href: url, 'aria-current': url === current ? 'true' : null }, text);
document.getElementById('examples').append(
  el('span', {}, 'Examples:'),
  ...(data.examples ?? []).map(({ lot, label }) => example(href('sim', lot), label)),
  ...CHAIN_EXAMPLES.map(([id, label]) => example(href('chain', id), label)),
  ...(data.exampleActor ? [example(`passport.html?actor=${data.exampleActor}`, 'Lots of a flagged company')] : []),
);

// ------------------------------------------------------------------ summary card
function qrBox() {
  const qr = qrcode(0, 'M');
  qr.addData(location.href.split('#')[0]);
  qr.make();
  const box = el('div', { class: 'qr', role: 'img', 'aria-label': 'QR code linking to this passport' });
  box.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  return box;
}

function card({ id, grams, kicker, say, facts, verdict, extra }) {
  return el('article', { class: 'passport', 'aria-label': `Lot ${lotNo(id)}` },
    el('div', { class: 'main' },
      el('div', { class: 'kicker' }, ...kicker),
      el('h2', {}, `Lot ${lotNo(id)}`, el('small', {}, `${kg(grams, 2)} kg`)),
      el('p', { class: 'say' }, say),
      el('dl', { class: 'facts' }, ...facts.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))),
      extra ?? null,
    ),
    el('div', { class: 'side' }, verdict, qrBox(), el('p', { class: 'qr-cap' }, 'Scan to open this passport')),
  );
}

const block = (id, title, sub, ...children) => el('section', { class: 'pp-block', 'aria-labelledby': id },
  el('h2', { id }, title), sub ? el('p', { class: 'sub' }, sub) : null, ...children);

// ------------------------------------------------------------------ simulated lot
function simView(id) {
  const lot = lots.get(id);
  if (!lot) {
    out.replaceChildren(el('p', { class: 'empty' }, `There is no lot ${id} in the simulated ledger. Try a number from 1 to ${data.lots.length}, or one of the examples above.`));
    return;
  }
  const seen = new Set();
  const lineage = [];
  const walk = (l) => {
    if (!l || seen.has(l.id)) return;
    seen.add(l.id); lineage.push(l);
    if (l.parent) walk(lots.get(l.parent));
    for (const i of l.inputs ?? []) walk(lots.get(i));
  };
  walk(lot);
  const recoveries = lineage.filter((l) => l.cls === 'RECOVERED' && !l.parent);
  const reclaim = lineage.find((l) => l.reclaim);
  const root = (() => { let r = lot; while (r.parent) r = lots.get(r.parent); return r; })();
  const units = new Set(recoveries.map((r) => r.origin));

  let say;
  if (lot.cls === 'RECLAIMED') {
    say = `Reclaimed by ${reclaim.history[0].actor} on ${reclaim.t} from ${kg(reclaim.reclaim.inGrams, 2)} kg of gas recovered from ${units.size} registered unit${units.size > 1 ? 's' : ''}. The output was ${fmt(reclaim.reclaim.yieldPct, 1)}% of the input, at ${(reclaim.reclaim.purityBps / 100).toFixed(2)}% purity certified by an independent lab.`;
  } else if (lot.cls === 'RECOVERED' && lot.tier === 'C') {
    say = 'Recovered within 180 days of a charge on the ledger, so it could be virgin gas passed through a unit. It can be held, recharged or destroyed, but never reclaimed or credited.';
  } else if (lot.cls === 'RECOVERED') {
    const r = root.history.find((h) => h.kind === 'RECOVER');
    say = `Recovered by ${r.actor} on ${root.t} from ${root.origin}, a Tier ${root.tier} unit. The unit's registered owner, ${r.consent}, co-signed the recovery.`;
  } else {
    const q = data.quotas[root.origin];
    say = `Minted by ${root.history[0].actor} on ${root.t} against quota document ${root.origin}${q ? `, which allows ${kg(q.grams, 0)} kg` : ''}. Virgin gas can never enter reclamation.`;
  }
  const quarantined = lot.tier === 'C';
  const verdict = el('span', { class: `pill ${quarantined ? 'warn' : 'ok'}` },
    quarantined ? 'Not reclaimable' : lot.cls === 'VIRGIN' ? 'Quota-backed' : `Traced to ${units.size} unit${units.size > 1 ? 's' : ''}`);

  out.replaceChildren(
    card({
      id: lot.id,
      grams: lot.g0,
      kicker: [clsTag(lot.cls, lot.tier), gasTag(lot.gas)],
      say,
      facts: [
        ['Created', lot.t],
        ['Cylinder', el('span', { class: 'mono' }, lot.cyl)],
        ['Now', fateLine(lot)],
        ['Evidence', lot.tier ? `Tier ${lot.tier}` : 'Quota document'],
      ],
      verdict,
      extra: epcisFiles.has(lot.id)
        ? el('p', { class: 'links' }, el('a', { href: `data/epcis/${epcisFiles.get(lot.id)}`, download: '' }, icon('download', { size: 15 }), 'Download GS1 EPCIS 2.0 events'))
        : null,
    }),
    el('div', { class: 'pp-grid' },
      block('h-origin', 'Where the gas came from',
        `${lineage.length} lot${lineage.length > 1 ? 's' : ''}, back to ${units.size ? `${units.size} registered unit${units.size > 1 ? 's' : ''}` : 'a quota document'}`,
        tree([lineageItem(lot, 0)])),
      el('div', {},
        block('h-checks', 'What the ledger checked', 'Rules the contracts enforced when each record was written', checksList(lot, lineage, recoveries, reclaim)),
        aiNotes(lineage),
      ),
    ),
    timeline(lineage, lot),
  );
}

function fateLine(lot) {
  if (lot.consumedBy?.kind === 'destroy') {
    const d = data.destructions.find((x) => x.id === lot.consumedBy.event);
    return `Destroyed in event #${d.id}${d.claimedBy ? `, claimed once by ${d.claimedBy}` : d.eligible ? ', not yet claimed' : ', not creditable'}`;
  }
  if (lot.consumedBy?.kind === 'reclaim') return `Reclaimed into lot ${lotNo(lot.consumedBy.lot)}`;
  if (lot.status === 'IN_TRANSIT') return 'In transit';
  if (lot.grams > 0) return `${kg(lot.grams, 2)} kg held by ${lot.holder}`;
  if (lot.out.charged) return `Charged into equipment by ${lot.holder}`;
  return 'Closed';
}

// ------------------------------------------------------------------ lineage tree
function tree(items) { return el('ol', { class: 'tree' }, ...items); }
function item(color, edge, node, children) {
  return el('li', { class: edge ? 'has-edge' : null, style: { '--c': color } },
    edge ? el('p', { class: 'edge' }, edge) : null,
    node,
    children?.length ? tree(children) : null,
  );
}
const lotNode = (title, desc, detail) => el('div', { class: 'node' },
  el('div', { class: 't' }, el('i', { class: 'dot', 'aria-hidden': 'true' }), title, el('span', {}, desc)),
  el('div', { class: 'd' }, detail));
const unitNode = (title, desc, ...lines) => el('div', { class: 'node unit' },
  el('div', { class: 't' }, el('b', {}, title), desc ? el('span', {}, desc) : null),
  ...lines.filter(Boolean).map((t) => el('div', { class: 'd' }, t)));

function lineageItem(l, depth, edge) {
  const node = lotNode(depth ? link('sim', l.id) : el('b', {}, `Lot ${lotNo(l.id)}`), `${clsName(l.cls, l.tier)}, ${kg(l.g0, 2)} kg ${l.gas}`,
    `Created ${l.t} in cylinder ${l.cyl}; ${l.grams > 0 ? `held by ${l.holder}` : fateLine(l).toLowerCase()}`);
  const kids = [];
  if (l.parent) kids.push(lineageItem(lots.get(l.parent), depth + 1, 'Split from'));
  if (l.inputs) l.inputs.forEach((i, n) => kids.push(lineageItem(lots.get(i), depth + 1, n === 0 ? `Reclaimed from ${l.inputs.length} recovered lot${l.inputs.length > 1 ? 's' : ''}` : null)));
  if (l.cls === 'RECOVERED' && !l.parent) kids.push(equipmentItem(l));
  if (l.cls === 'VIRGIN' && !l.parent) {
    const q = data.quotas[l.origin];
    kids.push(item('var(--ink)', 'Minted against', unitNode(l.origin, 'Import quota document', q ? `${kg(q.grams, 0)} kg allowance, held by ${q.importer}` : null)));
  }
  return item(colorOf(l.cls, l.tier), edge, node, kids);
}
function equipmentItem(l) {
  const e = data.equipment[l.origin] ?? {};
  const rec = l.history.find((h) => h.kind === 'RECOVER');
  const perRecovery = e.tier === 'A' && e.nameplate ? Math.floor(e.nameplate * 1.05) : null;
  return item('var(--ink)', 'Recovered from', unitNode(l.origin, `Tier ${e.tier} · ${String(e.category ?? '').replaceAll('_', ' ')}`,
    e.tier === 'A'
      ? `On the national register: nameplate ${kg(e.nameplate, 1)} kg, installed ${e.installed}`
      : `Registered at decommissioning from a nameplate photo, model ${e.model ?? 'n/a'}`,
    `Owner ${e.owner}; recovery co-signed by ${rec?.consent}${rec?.decommission ? '; unit decommissioned' : ''}`,
    perRecovery ? `${kg(e.recoveredG, 1)} kg recovered so far. The unit can never hold more than one charge (${kg(perRecovery, 1)} kg with 5% tolerance); recoveries draw it down and only recorded top-ups (${kg(e.chargedG, 1)} kg) refill it.` : null,
  ));
}

// ------------------------------------------------------------------ checks, AI notes, custody record
function checksList(lot, lineage, recoveries, reclaim) {
  const items = [];
  const add = (rule, text) => items.push(el('li', {}, icon('check', { size: 16 }), el('span', { class: 'code' }, rule), el('span', {}, text)));
  const receives = lineage.flatMap((l) => l.history.filter((h) => h.kind === 'RECEIVE'));
  const virginRoot = lineage.find((l) => l.cls === 'VIRGIN' && !l.parent);
  if (virginRoot) add('R1', `Minted within the allowance of quota document ${virginRoot.origin}.`);
  if (receives.length) {
    const off = receives.filter((r) => r.discrepancy);
    add('R2', `${receives.length} transfer${receives.length > 1 ? 's' : ''} re-weighed by the receiver${off.length ? `; ${off.length} weight discrepancy flagged` : ', all within tolerance'}.`);
  }
  for (const r of recoveries) {
    const h = r.history.find((x) => x.kind === 'RECOVER');
    add('R3', `Lot ${lotNo(r.id)}: ${kg(r.g0, 2)} kg from ${r.origin}, co-signed by its owner (${h.consent}) and no more than was booked inside the unit.`);
  }
  const quarantined = lineage.filter((l) => l.tier === 'C');
  if (quarantined.length) add('R3', `${quarantined.length} lot${quarantined.length > 1 ? 's were' : ' was'} recovered within 180 days of a recorded charge and quarantined as tier C.`);
  else if (recoveries.length) add('R3', 'None of the recovered gas came from a unit charged on the ledger in the previous 180 days.');
  if (reclaim) {
    add('R4', `${kg(reclaim.reclaim.outGrams, 2)} kg out of ${kg(reclaim.reclaim.inGrams, 2)} kg in (${fmt(reclaim.reclaim.yieldPct, 1)}%); the contract rejects anything above 98%.`);
    add('R5', 'Every input was recovered gas from registered equipment. Virgin, unknown and tier C gas cannot be reclaimed.');
  }
  const cyls = new Set(lineage.map((l) => l.cyl));
  add('CYL', `${cyls.size} cylinder${cyls.size > 1 ? 's' : ''}, each holding one open lot at a time.`);
  if (lot.consumedBy?.kind === 'destroy') {
    const d = data.destructions.find((x) => x.id === lot.consumedBy.event);
    add('R6', `Destroyed by ${d.facility}: ${kg(d.grams, 2)} kg at ${(d.dreBps / 100).toFixed(2)}% DRE, certified by ${d.verifier}, who is independent of the facility.`);
    if (d.eligible) add('R7', d.claimedBy ? `Claimed once, by ${d.claimedBy}${d.blockedClaims.length ? `; ${d.blockedClaims.length} other claim${d.blockedClaims.length > 1 ? 's' : ''} refused` : ''}.` : 'Eligible for credit and not yet claimed by any registry.');
    else add('R7', 'Not eligible for credit: at least one input was not recovered from registered equipment, or was tier C.');
  }
  return el('ul', { class: 'checks' }, ...items);
}

function aiNotes(lineage) {
  const actors = new Set();
  for (const l of lineage) for (const h of l.history) { if (h.actor) actors.add(h.actor); if (h.consent) actors.add(h.consent); }
  const notes = [...actors].flatMap((a) => flagsFor(a).map((f) => ({ a, ...f })));
  const sec = block('h-ai', 'AI notes', `On the ${actors.size} parties in this chain of custody`);
  if (!notes.length) {
    sec.append(el('p', {}, status('ok', 'None of them is in the review queue.')));
    return sec;
  }
  for (const n of notes) {
    sec.append(el('div', { class: `alertbox ${n.severity === 'high' ? 'high' : ''}` },
      el('div', { class: 'h' }, el('b', {}, n.a), el('span', { class: 'muted' }, `${roleLabel(n.role)}, module ${MODULES[n.m].short}`), status(n.severity === 'high' ? 'high' : 'review', n.severity === 'high' ? 'High' : 'Review')),
      el('p', {}, n.reasons[0]),
      // the same hashes are written with the flag to FlagRegistry, so anyone can re-run the model on the same data
      el('p', { class: 'mono muted', style: { fontSize: '11.5px', overflowWrap: 'anywhere' } }, `${data.ai[n.m].version} · model ${data.ai[n.m].modelHash.slice(0, 12)}… · input ${data.ai[n.m].inputSnapshot.slice(0, 12)}…`),
    ));
  }
  sec.append(el('p', { class: 'note' }, 'A flag is a reason to look closer, not a finding. The ledger accepted every record here; the AI only says the pattern is unusual.'));
  return sec;
}

const KIND = {
  MINT: 'Minted', SPLIT: 'Split', SPLIT_FROM: 'Split off', SEND: 'Sent', RECEIVE: 'Received and re-weighed', CHARGE: 'Charged into equipment',
  RECOVER: 'Recovered', RECLAIM_INPUT: 'Fed into reclamation', RECLAIM: 'Reclaimed', DESTROY: 'Destroyed',
};
function timeline(lineage, lot) {
  const rows = lineage.flatMap((l) => l.history.map((h) => ({ ...h, lot: l.id }))).sort((a, b) => a.t.localeCompare(b.t) || a.lot - b.lot);
  const detail = (h) => {
    switch (h.kind) {
      case 'MINT': return `${kg(h.grams, 2)} kg against ${h.quota}`;
      case 'SPLIT': return `${kg(h.grams, 2)} kg split into lot ${lotNo(h.child)}`;
      case 'SPLIT_FROM': return `${kg(h.grams, 2)} kg from lot ${lotNo(h.parent)}`;
      case 'SEND': return `${kg(h.grams, 2)} kg to ${h.to}`;
      case 'RECEIVE': return `sent ${kg(h.sent, 2)} kg, weighed ${kg(h.weighed, 2)} kg${h.discrepancy ? ` · ${h.discrepancy.toLowerCase().replaceAll('_', ' ')}` : ''}`;
      case 'CHARGE': return `${kg(h.grams, 2)} kg into ${h.equipment}`;
      case 'RECOVER': return `${kg(h.grams, 2)} kg from ${h.equipment}, co-signed by ${h.consent}`;
      case 'RECLAIM_INPUT': return `${kg(h.grams, 2)} kg into lot ${lotNo(h.output)}`;
      case 'RECLAIM': return `${kg(h.outGrams, 2)} kg out of ${kg(h.inGrams, 2)} kg, purity ${(h.purityBps / 100).toFixed(2)}%`;
      case 'DESTROY': return `${kg(h.grams, 2)} kg in event #${h.event}, verified by ${h.verifier}`;
      default: return '';
    }
  };
  const shown = rows.length > 40 ? rows.slice(-40) : rows;
  return el('section', { class: 'pp-block pp-wide', 'aria-labelledby': 'h-custody' },
    el('h2', { id: 'h-custody' }, 'Chain of custody'),
    el('p', { class: 'sub' }, `${rows.length} signed records across ${lineage.length} lot${lineage.length > 1 ? 's' : ''}${rows.length > 40 ? ', latest 40 shown' : ''}`),
    el('div', { class: 'table-wrap' }, el('table', { class: 'ledger' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Date'), el('th', {}, 'Lot'), el('th', {}, 'Record'), el('th', {}, 'By'), el('th', {}, 'Detail'))),
      el('tbody', {}, ...shown.map((h) => el('tr', {},
        el('td', { class: 'num' }, h.t),
        el('td', { class: 'num' }, h.lot === lot.id ? el('b', {}, lotNo(h.lot)) : link('sim', h.lot, lotNo(h.lot))),
        el('td', {}, KIND[h.kind] ?? h.kind),
        el('td', { class: 'mono' }, h.actor ?? ''),
        el('td', { class: 'ink2' }, detail(h)),
      ))),
    )),
  );
}

// ------------------------------------------------------------------ one company's lots
function actorView(actor) {
  const mine = data.lots.filter((l) => l.history.some((h) => h.actor === actor || h.consent === actor));
  const flags = flagsFor(actor);
  out.replaceChildren(
    el('section', { class: 'pp-block' },
      el('h2', { class: 'mono' }, actor),
      el('p', { class: 'sub' }, `${roleLabel(data.actors[actor]?.role ?? '')} · ${mine.length} lots in its records`),
      ...(flags.length
        ? flags.map((f) => el('div', { class: `alertbox ${f.severity === 'high' ? 'high' : ''}` },
          el('div', { class: 'h' }, status(f.severity === 'high' ? 'high' : 'review', MODULES[f.m].name)),
          ...f.reasons.map((r) => el('p', {}, r))))
        : [el('p', {}, status('ok', 'Not in the AI review queue.'))]),
    ),
    el('section', { class: 'pp-block pp-wide' },
      el('div', { class: 'table-wrap' }, el('table', { class: 'ledger' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Lot'), el('th', {}, 'Created'), el('th', {}, 'Class'), el('th', {}, 'Gas'), el('th', { class: 'r' }, 'kg'), el('th', {}, 'Origin'), el('th', {}, 'Now'))),
        el('tbody', {}, ...mine.slice(0, 150).map((l) => el('tr', {},
          el('td', { class: 'num' }, link('sim', l.id, lotNo(l.id))),
          el('td', { class: 'num' }, l.t),
          el('td', {}, clsTag(l.cls, l.tier)),
          el('td', {}, gasTag(l.gas)),
          el('td', { class: 'r num' }, kg(l.g0, 2)),
          el('td', { class: 'mono' }, l.cls === 'RECLAIMED' && !l.parent ? 'reclamation' : l.origin),
          el('td', { class: 'ink2' }, fateLine(l)),
        ))),
      )),
      mine.length > 150 ? el('p', { class: 'note' }, `First 150 of ${mine.length} lots shown.`) : null,
    ),
  );
}

// ------------------------------------------------------------------ live chain lot
async function chainView(id) {
  const badge = document.querySelector('.crumb .badge');
  badge.className = 'badge live';
  badge.textContent = 'Live testnet data';
  badge.nextElementSibling.textContent = 'Read from the contracts on OP Sepolia';
  out.replaceChildren(el('p', { class: 'loading' }, el('span', { class: 'live-state wait' }, el('i'), `Reading lot ${lotNo(id)} from OP Sepolia…`)));
  try {
    const c = await import('./chain.js');
    const { info } = await c.chain();
    const ex = info.explorer;
    const l = await c.lot(id);
    if (!l.clsName || l.clsName === 'NONE') throw new Error(`lot ${id} does not exist on chain`);
    const holder = await c.actorName(l.holder);
    const node = async (x, depth, edge) => {
      const label = await c.labelOf(x.origin);
      const n = lotNode(depth ? link('chain', x.id) : el('b', {}, `Lot ${lotNo(x.id)}`), `${clsName(x.clsName, x.tierName)}, ${kg(Number(x.grams), 2)} kg ${x.gasName}`,
        `${x.statusName[0]}${x.statusName.slice(1).toLowerCase()}, held by ${await c.actorName(x.holder)}, created ${new Date(Number(x.createdAt) * 1000).toISOString().slice(0, 10)}`);
      const kids = [];
      if (Number(x.parent)) kids.push(await node(await c.lot(Number(x.parent)), depth + 1, 'Split from'));
      if (x.inputs) for (const [k, i] of x.inputs.entries()) kids.push(await node(await c.lot(i), depth + 1, k === 0 ? `Reclaimed from ${x.inputs.length} recovered lot${x.inputs.length > 1 ? 's' : ''}` : null));
      if (x.equipment) {
        const e = x.equipment;
        kids.push(item('var(--ink)', 'Recovered from', unitNode(label ?? x.origin, `Tier ${c.TIER[e.tier]}`,
          `Nameplate ${kg(Number(e.nameplateGrams), 1)} kg; ${kg(Number(e.chargedGrams), 1)} kg of recorded top-ups`,
          `Owner ${await c.actorName(e.owner)}, who co-signs every recovery; ${kg(Number(e.recoveredGrams), 1)} kg recovered of a ${kg(Number(x.cap), 1)} kg lifetime cap`)));
      }
      if (x.clsName === 'VIRGIN' && !Number(x.parent)) kids.push(item('var(--ink)', 'Minted against', unitNode(label ?? x.origin, 'Import quota document')));
      return item(colorOf(x.clsName, x.tierName), edge, n, kids);
    };
    const lineage = await node(l, 0);
    out.replaceChildren(
      card({
        id: l.id,
        grams: Number(l.grams),
        kicker: [clsTag(l.clsName, l.tierName), gasTag(l.gasName), el('span', { class: 'live-state on' }, el('i'), 'Live on OP Sepolia')],
        say: `Read just now from the KigaliLedger contract on OP Sepolia. Status: ${l.statusName.toLowerCase()}, held by ${holder}.`,
        facts: [
          ['Created', new Date(Number(l.createdAt) * 1000).toISOString().slice(0, 10)],
          ['Holder', holder],
          ['Status', `${l.statusName[0]}${l.statusName.slice(1).toLowerCase()}`],
          ['Source', 'Contract state'],
        ],
        verdict: el('span', { class: 'pill ok' }, 'Read from chain'),
        extra: el('p', { class: 'links' },
          el('a', { href: `${ex}/address/${info.contracts.KigaliLedger}#readContract`, target: '_blank', rel: 'noopener' }, 'Verify on Etherscan', icon('external', { size: 13 })),
          el('a', { href: `${ex}/address/${l.holder}`, target: '_blank', rel: 'noopener' }, 'Holder address', icon('external', { size: 13 })),
        ),
      }),
      el('div', { class: 'pp-grid' },
        block('h-origin', 'Where the gas came from', 'Every line read from contract state', tree([lineage])),
      ),
    );
  } catch (err) {
    out.replaceChildren(el('p', { class: 'empty' }, `Could not read lot ${id} from OP Sepolia: ${err.shortMessage ?? err.message}. Try lot 6 or 4, or switch to the simulated market.`));
  }
}

// ------------------------------------------------------------------ dispatch
const defaultLot = data.examples?.find((x) => /credited once/i.test(x.label))?.lot ?? data.examples?.[0]?.lot ?? 1;
if (params.get('actor')) actorView(params.get('actor'));
else if (params.get('lot')) {
  input.value = params.get('lot');
  if (state.source === 'chain') chainView(parseInt(params.get('lot'), 10));
  else simView(parseInt(params.get('lot'), 10));
} else simView(defaultLot);
