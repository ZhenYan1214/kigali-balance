import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';
import { MODULES, GAS_COLOR, roleLabel, kg, fmt, el, icon, status, chrome, loadSim } from './common.js';

chrome('passport');
const params = new URLSearchParams(location.search);
const state = { source: params.get('source') === 'chain' ? 'chain' : 'sim' };
const out = document.getElementById('out');

// Simulated examples come from the data bundle (chosen by web/build_data.mjs); the live ones are
// lots created by the demo deployment on OP Sepolia.
const CHAIN_EXAMPLES = [
  [6, 'Live on OP Sepolia: reclaimed lot'],
  [4, 'Live on OP Sepolia: Tier A recovery'],
];
const COLOR = { VIRGIN: 'var(--c-virgin)', RECOVERED: 'var(--c-recovered)', RECLAIMED: 'var(--c-reclaimed)', C: 'var(--c-quarantine)', UNKNOWN: 'var(--c-loss)' };
const colorOf = (cls, tier) => (tier === 'C' ? COLOR.C : COLOR[cls] ?? 'var(--rule-strong)');
const clsName = (cls, tier) => (cls === 'RECOVERED' && tier === 'C' ? 'Recovered · tier C, quarantined' : cls === 'VIRGIN' ? 'Virgin · quota-backed' : `${cls[0]}${cls.slice(1).toLowerCase()}${tier ? ` · Tier ${tier}` : ''}`);
const stubWord = (cls, tier) => (tier === 'C' ? 'Quarantined' : cls.toLowerCase());
const lotNo = (id) => String(id).padStart(3, '0');
const href = (source, id) => `passport.html?${source === 'chain' ? 'source=chain&' : ''}lot=${id}`;
const link = (source, id, text) => el('a', { href: href(source, id) }, text ?? `Lot ${lotNo(id)}`);
const gasTag = (gas) => el('span', { class: 'tagline' }, el('i', { style: { background: GAS_COLOR[gas] ?? 'var(--muted)' } }), gas);

// ------------------------------------------------------------------ search form
const input = document.getElementById('lot-input');
const srcSeg = document.getElementById('source');
for (const [v, label] of [['sim', 'Simulated market'], ['chain', 'Live on OP Sepolia']]) {
  srcSeg.append(el('button', {
    type: 'button', 'aria-pressed': String(v === state.source),
    onclick: (e) => { state.source = v; for (const b of srcSeg.children) b.setAttribute('aria-pressed', String(b === e.currentTarget)); },
  }, label));
}
document.getElementById('trace-btn').prepend(icon('arrow', { size: 16 }));
document.getElementById('search').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = parseInt(input.value, 10);
  if (Number.isFinite(id)) location.search = `${state.source === 'chain' ? 'source=chain&' : ''}lot=${id}`;
});

const data = await loadSim();
// lots with a GS1 EPCIS 2.0 export (simulator/epcis/export_epcis.mjs); a missing index just hides the link
const epcisFiles = await fetch('data/epcis/index.json').then((r) => (r.ok ? r.json() : { examples: [] })).catch(() => ({ examples: [] }))
  .then((ix) => new Map(ix.examples.map((x) => [x.lot, x.file])));
const lots = new Map(data.lots.map((l) => [l.id, l]));
const flagsFor = (actor) => ['a', 'b', 'c'].flatMap((m) => data.ai[m].flags.filter((f) => f.actor === actor && f.severity !== 'none').map((f) => ({ ...f, m })));

const specimen = (url, ico, text) => el('a', { class: 'specimen', href: url }, icon(ico, { size: 15 }), text);
document.getElementById('examples').append(
  el('span', { class: 'lbl' }, 'Try'),
  ...(data.examples ?? []).map(({ lot, label }) => specimen(href('sim', lot), 'tag', label)),
  ...CHAIN_EXAMPLES.map(([id, label]) => specimen(href('chain', id), 'chain', label)),
  ...(data.exampleActor ? [specimen(`passport.html?actor=${data.exampleActor}`, 'review', 'All lots of one flagged company')] : []),
);

// ------------------------------------------------------------------ the tag
function qrBox() {
  const qr = qrcode(0, 'M');
  qr.addData(location.href.split('#')[0]);
  qr.make();
  const box = el('div', { class: 'qr', role: 'img', 'aria-label': 'QR code linking to this passport' });
  box.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  return box;
}

function tag({ band, word, kicker, id, grams, say, fields, stamp, extra }) {
  return el('article', { class: 'tagcard', style: { '--band': band }, 'aria-label': `Lot ${id}` },
    el('div', { class: 'stub', 'aria-hidden': 'true' }, el('span', {}, word)),
    el('div', { class: 'main' },
      el('div', { class: 'kicker' }, ...kicker),
      el('h2', { class: 'lotno' }, `Lot ${lotNo(id)}`, el('small', {}, `${kg(grams, 2)} kg`)),
      el('p', { class: 'say' }, say),
      el('dl', { class: 'fields' }, ...fields.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))),
      extra ?? null,
    ),
    el('div', { class: 'side' }, qrBox(), el('div', { class: 'scan' }, 'Scan to open', el('br'), 'this passport'), stamp),
  );
}

// ------------------------------------------------------------------ simulated lot
function simView(id) {
  const lot = lots.get(id);
  if (!lot) {
    out.replaceChildren(el('p', { class: 'alertbox', style: { marginTop: '28px' } }, `No lot ${id} in the simulated ledger (1–${data.lots.length}).`));
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
    say = `Reclaimed by ${reclaim.history[0].actor} on ${reclaim.t} from ${kg(reclaim.reclaim.inGrams, 2)} kg of gas recovered from ${units.size} registered unit${units.size > 1 ? 's' : ''}. Output was ${fmt(reclaim.reclaim.yieldPct, 1)}% of input at ${(reclaim.reclaim.purityBps / 100).toFixed(2)}% purity, certified by an independent lab.`;
  } else if (lot.cls === 'RECOVERED' && lot.tier === 'C') {
    say = 'Recovered within 180 days of a charge recorded on the ledger, so it could be virgin gas passed through a unit. It may be held, recharged or destroyed, but never reclaimed and never credited.';
  } else if (lot.cls === 'RECOVERED') {
    const r = root.history.find((h) => h.kind === 'RECOVER');
    say = `Recovered by ${r.actor} on ${root.t} from ${root.origin}, a Tier ${root.tier} unit. The recovery was co-signed by the unit's registered owner, ${r.consent}.`;
  } else {
    const q = data.quotas[root.origin];
    say = `Minted by ${root.history[0].actor} on ${root.t} against quota document ${root.origin}${q ? ` (allowance ${kg(q.grams, 0)} kg)` : ''}. Virgin gas can never enter reclamation.`;
  }
  const quarantined = lot.tier === 'C';
  const stamp = el('div', { class: `stampbox ${quarantined ? 'warn' : 'ok'}` }, icon(quarantined ? 'alert' : 'check', { size: 15 }),
    el('span', {}, quarantined ? 'Not reclaimable' : lot.cls === 'VIRGIN' ? 'Quota-backed' : `Traced to ${units.size} unit${units.size > 1 ? 's' : ''}`));

  out.replaceChildren(
    tag({
      band: colorOf(lot.cls, lot.tier),
      word: stubWord(lot.cls, lot.tier),
      id: lot.id,
      grams: lot.g0,
      kicker: [el('span', {}, 'Provenance passport'), gasTag(lot.gas), el('span', {}, clsName(lot.cls, lot.tier))],
      say,
      fields: [
        ['Created', lot.t],
        ['Cylinder', el('span', { class: 'mono' }, lot.cyl)],
        ['Now', fateLine(lot)],
        ['Evidence', lot.tier ? `Tier ${lot.tier}` : 'Quota document'],
      ],
      stamp,
      extra: epcisFiles.has(lot.id)
        ? el('p', { class: 'links' }, el('a', { href: `data/epcis/${epcisFiles.get(lot.id)}`, download: '' }, icon('download', { size: 15 }), 'GS1 EPCIS 2.0 export'))
        : null,
    }),
    el('div', { class: 'pp-grid' },
      el('section', { class: 'pp-block', 'aria-labelledby': 'h-origin' },
        el('h2', { id: 'h-origin' }, el('span', { class: 'no' }, '01'), 'Where this gas came from'),
        el('p', { class: 'sub' }, `${lineage.length} lot${lineage.length > 1 ? 's' : ''} back to ${units.size ? `${units.size} registered unit${units.size > 1 ? 's' : ''}` : 'a quota document'}`),
        pipe([lineageItem(lot, 0)]),
      ),
      el('div', {},
        el('section', { class: 'pp-block', 'aria-labelledby': 'h-checks' },
          el('h2', { id: 'h-checks' }, el('span', { class: 'no' }, '02'), 'What the ledger checked'),
          el('p', { class: 'sub' }, 'Each line is a rule the contracts enforced when the record was written'),
          checksList(lot, lineage, recoveries, reclaim),
        ),
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

// ------------------------------------------------------------------ lineage drawn as a pipe with fittings
let order = 0;
function pipe(items) { return el('ol', { class: 'pipe' }, ...items); }
function item(color, edge, fitting, children, i = order++) {
  return el('li', { style: { '--c': color, '--i': i } },
    edge ? el('p', { class: 'edge' }, edge) : null,
    fitting,
    children?.length ? pipe(children) : null,
  );
}
function lineageItem(l, depth, edge) {
  const i = order++; // parents light up before their children
  const fitting = el('div', { class: 'fitting' },
    el('div', { class: 't' }, depth ? link('sim', l.id) : el('b', {}, `Lot ${lotNo(l.id)}`), el('span', {}, `${clsName(l.cls, l.tier)} · ${kg(l.g0, 2)} kg ${l.gas}`)),
    el('div', { class: 'd' }, `created ${l.t} · cylinder ${l.cyl} · ${l.grams > 0 ? `held by ${l.holder}` : fateLine(l).toLowerCase()}`),
  );
  const kids = [];
  if (l.parent) kids.push(lineageItem(lots.get(l.parent), depth + 1, 'split from'));
  if (l.inputs) l.inputs.forEach((i, n) => kids.push(lineageItem(lots.get(i), depth + 1, n === 0 ? `reclaimed from ${l.inputs.length} recovered lot${l.inputs.length > 1 ? 's' : ''}` : null)));
  if (l.cls === 'RECOVERED' && !l.parent) kids.push(equipmentItem(l));
  if (l.cls === 'VIRGIN' && !l.parent) {
    const q = data.quotas[l.origin];
    kids.push(item('var(--ink)', 'minted against', el('div', { class: 'fitting unit' },
      el('div', { class: 't' }, icon('stamp', { size: 16 }), el('b', {}, l.origin)),
      el('div', { class: 'd' }, `import quota document${q ? ` · ${kg(q.grams, 0)} kg allowance · ${q.importer}` : ''}`))));
  }
  return item(colorOf(l.cls, l.tier), edge, fitting, kids, i);
}
function equipmentItem(l) {
  const e = data.equipment[l.origin] ?? {};
  const rec = l.history.find((h) => h.kind === 'RECOVER');
  const perRecovery = e.tier === 'A' && e.nameplate ? Math.floor(e.nameplate * 1.05) : null;
  return item('var(--ink)', 'recovered from', el('div', { class: 'fitting unit' },
    el('div', { class: 't' }, icon('unit', { size: 18 }), el('b', {}, l.origin), el('span', {}, `Tier ${e.tier} · ${String(e.category ?? '').replaceAll('_', ' ')}`)),
    el('div', { class: 'd' }, e.tier === 'A'
      ? `National register record · nameplate ${kg(e.nameplate, 1)} kg · installed ${e.installed}`
      : `Registered at decommissioning from a nameplate photo · model ${e.model ?? 'n/a'}`),
    el('div', { class: 'd' }, `Owner ${e.owner} · recovery co-signed by ${rec?.consent}${rec?.decommission ? ' · decommissioned' : ''}`),
    perRecovery ? el('div', { class: 'd' }, `Recovered ${kg(e.recoveredG, 1)} kg. It can never hold more than one charge (${kg(perRecovery, 1)} kg incl. 5%); recoveries draw it down and only recorded top-ups (${kg(e.chargedG, 1)} kg so far) refill it.`) : null,
  ));
}

// ------------------------------------------------------------------ checks, AI notes, custody record
function checksList(lot, lineage, recoveries, reclaim) {
  const items = [];
  const add = (rule, text) => items.push(el('li', { style: { '--i': items.length } }, icon('check', { size: 16 }), el('span', { class: 'code' }, rule), el('span', {}, text)));
  const receives = lineage.flatMap((l) => l.history.filter((h) => h.kind === 'RECEIVE'));
  const virginRoot = lineage.find((l) => l.cls === 'VIRGIN' && !l.parent);
  if (virginRoot) add('R1', `Minted within the allowance of quota document ${virginRoot.origin}.`);
  if (receives.length) {
    const off = receives.filter((r) => r.discrepancy);
    add('R2', `${receives.length} transfer${receives.length > 1 ? 's' : ''} re-weighed by the receiver${off.length ? `; ${off.length} weight discrepancy flagged` : '; all within tolerance'}.`);
  }
  for (const r of recoveries) {
    const h = r.history.find((x) => x.kind === 'RECOVER');
    add('R3', `Lot ${lotNo(r.id)}: ${kg(r.g0, 2)} kg recovered from ${r.origin} with the owner's co-signature (${h.consent}), never more than was booked inside the unit.`);
  }
  const quarantined = lineage.filter((l) => l.tier === 'C');
  if (quarantined.length) add('R3', `${quarantined.length} lot(s) were recovered within 180 days of a recorded charge and quarantined as tier C.`);
  else if (recoveries.length) add('R3', 'No recovered gas came from a unit charged on the ledger in the previous 180 days.');
  if (reclaim) {
    add('R4', `Output ${kg(reclaim.reclaim.outGrams, 2)} kg from ${kg(reclaim.reclaim.inGrams, 2)} kg input (${fmt(reclaim.reclaim.yieldPct, 1)}%); the contract rejects anything above 98%.`);
    add('R5', 'Every input was RECOVERED gas from registered equipment; virgin, unknown and tier C gas cannot enter reclamation.');
  }
  const cyls = new Set(lineage.map((l) => l.cyl));
  add('CYL', `${cyls.size} cylinder ID${cyls.size > 1 ? 's' : ''}, each holding one open lot at a time.`);
  if (lot.consumedBy?.kind === 'destroy') {
    const d = data.destructions.find((x) => x.id === lot.consumedBy.event);
    add('R6', `Destroyed by ${d.facility}; ${kg(d.grams, 2)} kg and DRE ${(d.dreBps / 100).toFixed(2)}% certified by ${d.verifier}, independent of the facility.`);
    if (d.eligible) add('R7', d.claimedBy ? `Claimed once, by ${d.claimedBy}${d.blockedClaims.length ? `; ${d.blockedClaims.length} other claim attempt(s) refused` : ''}.` : 'Credit-eligible and not yet claimed by any registry.');
    else add('R7', 'Not credit-eligible: at least one input was not recovered from registered equipment, or was tier C.');
  }
  return el('ul', { class: 'checks' }, ...items);
}

function aiNotes(lineage) {
  const actors = new Set();
  for (const l of lineage) for (const h of l.history) { if (h.actor) actors.add(h.actor); if (h.consent) actors.add(h.consent); }
  const notes = [...actors].flatMap((a) => flagsFor(a).map((f) => ({ a, ...f })));
  const block = el('section', { class: 'pp-block', style: { marginTop: '34px' }, 'aria-labelledby': 'h-ai' },
    el('h2', { id: 'h-ai' }, el('span', { class: 'no' }, '03'), 'AI notes'),
    el('p', { class: 'sub' }, `About the ${actors.size} parties in this chain of custody`));
  if (!notes.length) {
    block.append(el('p', { class: 'ink2' }, status('ok', 'None of them is in the AI review queue.')));
    return block;
  }
  for (const n of notes) {
    block.append(el('div', { class: `alertbox ${n.severity === 'high' ? 'high' : ''}` },
      el('div', { class: 'h' }, status(n.severity === 'high' ? 'high' : 'review', n.severity === 'high' ? 'Flagged for review' : 'Review'), el('b', {}, n.a), el('span', { class: 'muted' }, `${roleLabel(n.role)} · Module ${MODULES[n.m].short}`)),
      el('p', {}, n.reasons[0]),
      // the same hashes are written with the flag to FlagRegistry, so anyone can re-run the model on the same data
      el('p', { class: 'mono muted', style: { fontSize: '11.5px' } }, `${data.ai[n.m].version} · model ${data.ai[n.m].modelHash.slice(0, 12)}… · input ${data.ai[n.m].inputSnapshot.slice(0, 12)}…`),
    ));
  }
  block.append(el('p', { class: 'note' }, 'A flag is a reason to look closer, not a finding. The ledger accepted every record above; the AI only says the pattern is unusual.'));
  return block;
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
      case 'RECLAIM': return `${kg(h.outGrams, 2)} kg out of ${kg(h.inGrams, 2)} kg · purity ${(h.purityBps / 100).toFixed(2)}%`;
      case 'DESTROY': return `${kg(h.grams, 2)} kg in event #${h.event} · verified by ${h.verifier}`;
      default: return '';
    }
  };
  const ICON = { MINT: 'stamp', RECEIVE: 'scale', SEND: 'arrow', CHARGE: 'unit', RECOVER: 'unit', RECLAIM: 'flask', RECLAIM_INPUT: 'flask', DESTROY: 'flame', SPLIT: 'cylinder', SPLIT_FROM: 'cylinder' };
  const shown = rows.length > 40 ? rows.slice(-40) : rows;
  return el('section', { class: 'pp-block', style: { marginTop: '44px' }, 'aria-labelledby': 'h-custody' },
    el('h2', { id: 'h-custody' }, el('span', { class: 'no' }, '04'), 'Chain of custody'),
    el('p', { class: 'sub' }, `${rows.length} signed records across ${lineage.length} lot${lineage.length > 1 ? 's' : ''}${rows.length > 40 ? ' · latest 40 shown' : ''}`),
    el('div', { class: 'table-wrap' }, el('table', { class: 'ledger' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Date'), el('th', {}, 'Lot'), el('th', {}, 'Record'), el('th', {}, 'By'), el('th', {}, 'Detail'))),
      el('tbody', {}, ...shown.map((h) => el('tr', {},
        el('td', { class: 'num' }, h.t),
        el('td', { class: 'mono' }, h.lot === lot.id ? el('b', {}, lotNo(h.lot)) : link('sim', h.lot, lotNo(h.lot))),
        el('td', {}, el('span', { class: 'status watch', style: { color: 'var(--ink)' } }, icon(ICON[h.kind] ?? 'dot', { size: 15 }), KIND[h.kind] ?? h.kind)),
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
    el('section', { class: 'pp-block', style: { marginTop: '34px' } },
      el('h2', {}, el('span', { class: 'no' }, 'Company'), el('span', { class: 'mono' }, actor)),
      el('p', { class: 'sub' }, `${roleLabel(data.actors[actor]?.role ?? '')} · ${mine.length} lots in its records`),
      ...(flags.length
        ? flags.map((f) => el('div', { class: `alertbox ${f.severity === 'high' ? 'high' : ''}` },
          el('div', { class: 'h' }, status(f.severity === 'high' ? 'high' : 'review', `Module ${MODULES[f.m].short}`), el('span', { class: 'muted' }, MODULES[f.m].name)),
          ...f.reasons.map((r) => el('p', {}, r))))
        : [el('p', {}, status('ok', 'Not in the AI review queue.'))]),
    ),
    el('section', { class: 'pp-block', style: { marginTop: '34px' } },
      el('div', { class: 'table-wrap' }, el('table', { class: 'ledger' },
        el('thead', {}, el('tr', {}, el('th', {}, 'Lot'), el('th', {}, 'Created'), el('th', {}, 'Class'), el('th', {}, 'Gas'), el('th', { class: 'r' }, 'kg'), el('th', {}, 'Origin'), el('th', {}, 'Now'))),
        el('tbody', {}, ...mine.slice(0, 150).map((l) => el('tr', {},
          el('td', { class: 'mono' }, link('sim', l.id, lotNo(l.id))),
          el('td', { class: 'num' }, l.t),
          el('td', {}, el('span', { class: 'tagline' }, el('i', { style: { background: colorOf(l.cls, l.tier) } }), clsName(l.cls, l.tier))),
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
  out.replaceChildren(el('p', { class: 'live-state wait', style: { marginTop: '30px' } }, el('i'), `Reading lot ${lotNo(id)} from OP Sepolia…`));
  try {
    const c = await import('./chain.js');
    const { info } = await c.chain();
    const ex = info.explorer;
    const l = await c.lot(id);
    if (!l.clsName || l.clsName === 'NONE') throw new Error(`lot ${id} does not exist on chain`);
    const holder = await c.actorName(l.holder);
    const node = async (x, depth, edge) => {
      const i = order++;
      const label = await c.labelOf(x.origin);
      const fitting = el('div', { class: 'fitting' },
        el('div', { class: 't' }, depth ? link('chain', x.id) : el('b', {}, `Lot ${lotNo(x.id)}`), el('span', {}, `${clsName(x.clsName, x.tierName)} · ${kg(Number(x.grams), 2)} kg ${x.gasName}`)),
        el('div', { class: 'd' }, `${x.statusName.toLowerCase()} · held by ${await c.actorName(x.holder)} · created ${new Date(Number(x.createdAt) * 1000).toISOString().slice(0, 10)}`),
      );
      const kids = [];
      if (Number(x.parent)) kids.push(await node(await c.lot(Number(x.parent)), depth + 1, 'split from'));
      if (x.inputs) for (const [n, i] of x.inputs.entries()) kids.push(await node(await c.lot(i), depth + 1, n === 0 ? `reclaimed from ${x.inputs.length} recovered lot(s)` : null));
      if (x.equipment) {
        const e = x.equipment;
        kids.push(item('var(--ink)', 'recovered from', el('div', { class: 'fitting unit' },
          el('div', { class: 't' }, icon('unit', { size: 18 }), el('b', {}, label ?? x.origin)),
          el('div', { class: 'd' }, `Tier ${c.TIER[e.tier]} · nameplate ${kg(Number(e.nameplateGrams), 1)} kg · ${kg(Number(e.chargedGrams), 1)} kg recorded top-ups`),
          el('div', { class: 'd' }, `Owner ${await c.actorName(e.owner)} (co-signs every recovery) · recovered ${kg(Number(e.recoveredGrams), 1)} kg of a ${kg(Number(x.cap), 1)} kg lifetime cap`),
        )));
      }
      if (x.clsName === 'VIRGIN' && !Number(x.parent)) kids.push(item('var(--ink)', 'minted against', el('div', { class: 'fitting unit' }, el('div', { class: 't' }, icon('stamp', { size: 16 }), el('b', {}, label ?? x.origin)))));
      return item(colorOf(x.clsName, x.tierName), edge, fitting, kids, i);
    };
    const lineage = await node(l, 0);
    out.replaceChildren(
      tag({
        band: colorOf(l.clsName, l.tierName),
        word: stubWord(l.clsName, l.tierName),
        id: l.id,
        grams: Number(l.grams),
        kicker: [el('span', {}, 'Provenance passport'), gasTag(l.gasName), el('span', { class: 'live-state on' }, el('i'), 'live · OP Sepolia')],
        say: `Read just now from the KigaliLedger contract on OP Sepolia. Status: ${l.statusName.toLowerCase()}, held by ${holder}.`,
        fields: [
          ['Created', new Date(Number(l.createdAt) * 1000).toISOString().slice(0, 10)],
          ['Class', clsName(l.clsName, l.tierName)],
          ['Holder', holder],
          ['Source', 'Contract state'],
        ],
        stamp: el('div', { class: 'stampbox ok' }, icon('chain', { size: 15 }), el('span', {}, 'Read from chain')),
        extra: el('p', { class: 'links' },
          el('a', { href: `${ex}/address/${info.contracts.KigaliLedger}#readContract`, target: '_blank', rel: 'noopener' }, 'Verify on Etherscan', icon('external', { size: 13 })),
          el('a', { href: `${ex}/address/${l.holder}`, target: '_blank', rel: 'noopener' }, 'Holder address', icon('external', { size: 13 })),
        ),
      }),
      el('section', { class: 'pp-block', style: { marginTop: '34px' }, 'aria-labelledby': 'h-origin' },
        el('h2', { id: 'h-origin' }, el('span', { class: 'no' }, '01'), 'Where this gas came from'),
        el('p', { class: 'sub' }, 'Every line read from chain state'),
        pipe([lineage]),
      ),
    );
  } catch (err) {
    out.replaceChildren(el('div', { class: 'alertbox', style: { marginTop: '28px' } }, `Could not read lot ${id} from OP Sepolia: ${err.shortMessage ?? err.message}`));
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
