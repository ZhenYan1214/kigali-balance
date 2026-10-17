import qrcode from 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/+esm';
import { MODULES, roleLabel, kg, fmt, el, status, checkMark, chrome, loadSim } from './common.js';

chrome('passport');
const params = new URLSearchParams(location.search);
const state = { source: params.get('source') === 'chain' ? 'chain' : 'sim' };
const out = document.getElementById('out');

// Simulated examples come from the data bundle (chosen by web/build_data.mjs); the live ones are
// lots created by the demo deployment on OP Sepolia.
const CHAIN_EXAMPLES = [
  ['chain', 6, 'Live on OP Sepolia: reclaimed lot'],
  ['chain', 4, 'Live on OP Sepolia: Tier A recovery'],
];
const COLOR = { VIRGIN: 'var(--c-virgin)', RECOVERED: 'var(--c-recovered)', RECLAIMED: 'var(--c-reclaimed)', C: 'var(--c-quarantine)', UNKNOWN: 'var(--c-loss)' };
const colorOf = (cls, tier) => (tier === 'C' ? COLOR.C : COLOR[cls] ?? 'var(--axis)');
const clsName = (cls, tier) => (cls === 'RECOVERED' && tier === 'C' ? 'Recovered · tier C (quarantined)' : cls === 'VIRGIN' ? 'Virgin · quota-backed' : `${cls[0]}${cls.slice(1).toLowerCase()}${tier ? ` · Tier ${tier}` : ''}`);
const link = (source, id, text) => el('a', { href: `passport.html?${source === 'chain' ? 'source=chain&' : ''}lot=${id}` }, text ?? `Lot #${id}`);

// ------------------------------------------------------------------ search form
const input = document.getElementById('lot-input');
const srcSeg = document.getElementById('source');
for (const [v, label] of [['sim', 'Simulated market'], ['chain', 'Live OP Sepolia']]) {
  srcSeg.append(el('button', {
    type: 'button', 'aria-pressed': String(v === state.source),
    onclick: (e) => { state.source = v; for (const b of srcSeg.children) b.setAttribute('aria-pressed', String(b === e.currentTarget)); },
  }, label));
}
document.getElementById('search').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = parseInt(input.value, 10);
  if (Number.isFinite(id)) location.search = `${state.source === 'chain' ? 'source=chain&' : ''}lot=${id}`;
});
const data = await loadSim();
document.getElementById('examples').append(
  el('span', { class: 'muted', style: { fontSize: '12.5px', alignSelf: 'center' } }, 'Try:'),
  ...(data.examples ?? []).map(({ lot, label }) => link('sim', lot, label)),
  ...CHAIN_EXAMPLES.map(([s, id, label]) => link(s, id, label)),
  ...(data.exampleActor ? [el('a', { href: `passport.html?actor=${data.exampleActor}` }, 'All lots of one flagged company')] : []),
);
const lots = new Map(data.lots.map((l) => [l.id, l]));
const flagsFor = (actor) => ['a', 'b', 'c'].flatMap((m) => data.ai[m].flags.filter((f) => f.actor === actor && f.severity !== 'none').map((f) => ({ ...f, m })));


// ------------------------------------------------------------------ simulated lot
function simView(id) {
  const lot = lots.get(id);
  if (!lot) { out.replaceChildren(el('div', { class: 'card section-gap' }, `No lot #${id} in the simulated ledger (1–${data.lots.length}).`)); return; }

  // collect the lineage once
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

  out.replaceChildren(
    verdictCard(lot, root, recoveries, reclaim),
    el('div', { class: 'grid cols-2 section-gap' },
      el('section', { class: 'card' }, el('div', { class: 'card-head' }, el('h2', {}, 'Where this gas came from')), el('div', { class: 'lineage' }, lineageNode(lot, 0))),
      el('div', { class: 'grid', style: { alignContent: 'start' } },
        el('section', { class: 'card' }, el('div', { class: 'card-head' }, el('h2', {}, 'What the ledger checked')), checksList(lot, lineage, recoveries, reclaim)),
        aiNotes(lineage),
      ),
    ),
    timelineCard(lineage, lot),
  );
}

function verdictCard(lot, root, recoveries, reclaim) {
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
    say = `Minted by ${root.holder === lot.holder ? root.history[0].actor : root.history[0].actor} on ${root.t} against quota document ${root.origin}${q ? ` (allowance ${kg(q.grams, 0)} kg)` : ''}. Virgin gas can never enter reclamation.`;
  }
  const fate = fateLine(lot);
  const url = location.href.split('#')[0];
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const qrBox = el('div', { class: 'qr' });
  qrBox.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
  qrBox.append(el('div', { style: { marginTop: '6px' } }, 'Scan to open this passport'));

  return el('section', { class: 'card section-gap verdict' },
    el('div', {},
      el('div', { class: 'cls' }, el('i', { style: { background: colorOf(lot.cls, lot.tier) } }), `${clsName(lot.cls, lot.tier)} · ${lot.gas}`),
      el('div', { class: 'big' }, `Lot #${lot.id} · ${kg(lot.g0, 2)} kg`),
      el('p', { class: 'say' }, say),
      el('div', { style: { marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' } },
        lot.tier === 'C' ? status('review', 'Not reclaimable, not creditable') : checkMark(lot.cls === 'VIRGIN' ? 'Backed by a quota document' : `Traces to ${new Set(recoveries.map((r) => r.origin)).size} registered unit(s)`),
        el('span', { class: 'chip' }, fate),
      ),
    ),
    qrBox,
  );
}

function fateLine(lot) {
  if (lot.consumedBy?.kind === 'destroy') {
    const d = data.destructions.find((x) => x.id === lot.consumedBy.event);
    return `Destroyed in event #${d.id}${d.claimedBy ? `, claimed once by ${d.claimedBy}` : d.eligible ? ', not yet claimed' : ', not creditable'}`;
  }
  if (lot.consumedBy?.kind === 'reclaim') return `Reclaimed into lot #${lot.consumedBy.lot}`;
  if (lot.status === 'IN_TRANSIT') return 'In transit';
  if (lot.grams > 0) return `${kg(lot.grams, 2)} kg in a cylinder held by ${lot.holder}`;
  if (lot.out.charged) return `Charged into equipment by ${lot.holder}`;
  return 'Closed';
}

function lineageNode(l, depth) {
  const n = el('div', { class: 'node', style: { '--c': colorOf(l.cls, l.tier) } },
    el('div', {}, depth ? link('sim', l.id, `Lot #${l.id}`) : el('span', { class: 't' }, `Lot #${l.id}`), el('span', { class: 'muted' }, `  ${clsName(l.cls, l.tier)} · ${kg(l.g0, 2)} kg ${l.gas}`)),
    el('div', { class: 'd' }, `created ${l.t} · cylinder ${l.cyl} · ${l.grams > 0 ? `held by ${l.holder}` : fateLine(l).toLowerCase()}`),
  );
  const kids = [];
  if (l.parent) kids.push(el('div', { class: 'edge' }, 'split from'), lineageNode(lots.get(l.parent), depth + 1));
  if (l.inputs) kids.push(el('div', { class: 'edge' }, `reclaimed from ${l.inputs.length} recovered lot${l.inputs.length > 1 ? 's' : ''}`), ...l.inputs.map((i) => lineageNode(lots.get(i), depth + 1)));
  if (l.cls === 'RECOVERED' && !l.parent) kids.push(el('div', { class: 'edge' }, 'recovered from'), equipmentNode(l));
  if (l.cls === 'VIRGIN' && !l.parent) {
    const q = data.quotas[l.origin];
    kids.push(el('div', { class: 'edge' }, 'minted against'), el('div', { class: 'node', style: { '--c': 'var(--axis)' } },
      el('div', { class: 't' }, l.origin), el('div', { class: 'd' }, `import quota document · ${q ? `${kg(q.grams, 0)} kg allowance · ${q.importer}` : ''}`)));
  }
  if (!kids.length) return n;
  return el('div', {}, n, el('div', { class: 'kids' }, ...kids));
}

function equipmentNode(l) {
  const e = data.equipment[l.origin] ?? {};
  const rec = l.history.find((h) => h.kind === 'RECOVER');
  const perRecovery = e.tier === 'A' && e.nameplate ? Math.floor(e.nameplate * 1.05) : null;
  const cap = perRecovery != null ? perRecovery + e.chargedG : null;
  return el('div', { class: 'node', style: { '--c': 'var(--axis)' } },
    el('div', {}, el('span', { class: 't mono' }, l.origin), el('span', { class: 'muted' }, `  Tier ${e.tier} · ${String(e.category ?? '').replaceAll('_', ' ')}`)),
    el('div', { class: 'd' }, e.tier === 'A'
      ? `national register record · nameplate ${kg(e.nameplate, 1)} kg · installed ${e.installed}`
      : `registered at decommissioning from a nameplate photo · model ${e.model ?? 'n/a'}`),
    el('div', { class: 'd' }, `owner ${e.owner} · recovery co-signed by ${rec?.consent}${rec?.decommission ? ' · decommissioned' : ''}`),
    cap ? el('div', { class: 'd' }, `recovered ${kg(e.recoveredG, 1)} kg · can never hold more than one charge (${kg(perRecovery, 1)} kg incl. 5%); recoveries draw it down, only recorded top-ups (${kg(e.chargedG, 1)} kg so far) refill it`) : null,
  );
}

function checksList(lot, lineage, recoveries, reclaim) {
  const items = [];
  const add = (rule, text) => items.push(el('li', {}, el('span', { class: 'rule' }, rule), el('span', {}, text)));
  const receives = lineage.flatMap((l) => l.history.filter((h) => h.kind === 'RECEIVE'));
  const virginRoot = lineage.find((l) => l.cls === 'VIRGIN' && !l.parent);
  if (virginRoot) add('R1', `Minted within the allowance of quota document ${virginRoot.origin}.`);
  if (receives.length) {
    const off = receives.filter((r) => r.discrepancy);
    add('R2', `${receives.length} transfer${receives.length > 1 ? 's' : ''} re-weighed by the receiver${off.length ? `; ${off.length} weight discrepancy flagged` : '; all within tolerance'}.`);
  }
  for (const r of recoveries) {
    const h = r.history.find((x) => x.kind === 'RECOVER');
    add('R3', `Lot #${r.id}: ${kg(r.g0, 2)} kg recovered from ${r.origin} with the owner's co-signature (${h.consent}), never more than was booked inside the unit.`);
  }
  const quarantined = lineage.filter((l) => l.tier === 'C');
  if (quarantined.length) add('R3', `${quarantined.length} lot(s) were recovered within 180 days of a recorded charge and quarantined as tier C.`);
  else if (recoveries.length) add('R3', 'No recovered gas came from a unit charged on the ledger in the previous 180 days.');
  if (reclaim) {
    const maxPct = 98;
    add('R4', `Output ${kg(reclaim.reclaim.outGrams, 2)} kg from ${kg(reclaim.reclaim.inGrams, 2)} kg input (${fmt(reclaim.reclaim.yieldPct, 1)}%); the contract rejects anything above ${maxPct}%.`);
    add('R5', `Every input was RECOVERED gas from registered equipment; virgin, unknown and tier C gas cannot enter reclamation.`);
  }
  const cyls = new Set(lineage.map((l) => l.cyl));
  add('M1', `${cyls.size} cylinder ID${cyls.size > 1 ? 's' : ''}, each holding one open lot at a time.`);
  if (lot.consumedBy?.kind === 'destroy') {
    const d = data.destructions.find((x) => x.id === lot.consumedBy.event);
    add('R6', `Destroyed by ${d.facility}; ${kg(d.grams, 2)} kg and DRE ${(d.dreBps / 100).toFixed(2)}% certified by ${d.verifier}, independent of the facility.`);
    if (d.eligible) add('R7', d.claimedBy ? `Claimed once, by ${d.claimedBy}${d.blockedClaims.length ? `; ${d.blockedClaims.length} other claim attempt(s) rejected` : ''}.` : 'Credit-eligible and not yet claimed by any registry.');
    else add('R7', 'Not credit-eligible: at least one input was not recovered from registered equipment, or was tier C.');
  }
  return el('ul', { class: 'checks' }, ...items);
}

function aiNotes(lineage) {
  const actors = new Set();
  for (const l of lineage) for (const h of l.history) { if (h.actor) actors.add(h.actor); if (h.consent) actors.add(h.consent); }
  const notes = [...actors].flatMap((a) => flagsFor(a).map((f) => ({ a, ...f })));
  const card = el('section', { class: 'card' }, el('div', { class: 'card-head' }, el('h2', {}, 'AI notes'), el('span', { class: 'sub' }, 'about parties in this chain of custody')));
  if (!notes.length) {
    card.append(el('p', { class: 'ink2', style: { fontSize: '13.5px' } }, `None of the ${actors.size} parties in this chain is in the AI review queue.`));
    return card;
  }
  for (const n of notes) {
    card.append(el('div', { class: 'caution' },
      el('div', {}, n.severity === 'high' ? status('high', 'Flagged for review') : status('review', 'Review'), el('span', { class: 'mono', style: { marginLeft: '8px' } }, n.a), el('span', { class: 'muted' }, ` · ${roleLabel(n.role)} · Module ${MODULES[n.m].short}`)),
      el('div', { class: 'ink2', style: { fontSize: '13px', marginTop: '6px' } }, n.reasons[0]),
    ));
  }
  card.append(el('p', { class: 'muted', style: { fontSize: '12px', marginTop: '10px' } }, 'A flag is a reason to look closer, not a finding. The ledger accepted every record above; the AI only says the pattern is unusual.'));
  return card;
}

const KIND = {
  MINT: 'Minted', SPLIT: 'Split', SPLIT_FROM: 'Split off', SEND: 'Sent', RECEIVE: 'Received and re-weighed', CHARGE: 'Charged into equipment',
  RECOVER: 'Recovered', RECLAIM_INPUT: 'Fed into reclamation', RECLAIM: 'Reclaimed', DESTROY: 'Destroyed',
};
function timelineCard(lineage, lot) {
  const rows = lineage.flatMap((l) => l.history.map((h) => ({ ...h, lot: l.id }))).sort((a, b) => a.t.localeCompare(b.t) || a.lot - b.lot);
  const detail = (h) => {
    switch (h.kind) {
      case 'MINT': return `${kg(h.grams, 2)} kg against ${h.quota}`;
      case 'SPLIT': return `${kg(h.grams, 2)} kg split into lot #${h.child}`;
      case 'SPLIT_FROM': return `${kg(h.grams, 2)} kg from lot #${h.parent}`;
      case 'SEND': return `${kg(h.grams, 2)} kg to ${h.to}`;
      case 'RECEIVE': return `sent ${kg(h.sent, 2)} kg, weighed ${kg(h.weighed, 2)} kg${h.discrepancy ? ` · ${h.discrepancy.toLowerCase().replaceAll('_', ' ')}` : ''}`;
      case 'CHARGE': return `${kg(h.grams, 2)} kg into ${h.equipment}`;
      case 'RECOVER': return `${kg(h.grams, 2)} kg from ${h.equipment}, co-signed by ${h.consent}`;
      case 'RECLAIM_INPUT': return `${kg(h.grams, 2)} kg into lot #${h.output}`;
      case 'RECLAIM': return `${kg(h.outGrams, 2)} kg out of ${kg(h.inGrams, 2)} kg · purity ${(h.purityBps / 100).toFixed(2)}%`;
      case 'DESTROY': return `${kg(h.grams, 2)} kg in event #${h.event} · verified by ${h.verifier}`;
      default: return '';
    }
  };
  const shown = rows.length > 40 ? rows.slice(-40) : rows;
  return el('section', { class: 'card section-gap' },
    el('div', { class: 'card-head' }, el('h2', {}, 'Chain of custody'), el('span', { class: 'sub' }, `${rows.length} signed records across ${lineage.length} lot${lineage.length > 1 ? 's' : ''}${rows.length > 40 ? ' · latest 40 shown' : ''}`)),
    el('div', { class: 'table-wrap' }, el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, 'Date'), el('th', {}, 'Lot'), el('th', {}, 'Record'), el('th', {}, 'By'), el('th', {}, 'Detail'))),
      el('tbody', {}, ...shown.map((h) => el('tr', {},
        el('td', { class: 'num' }, h.t),
        el('td', {}, h.lot === lot.id ? el('strong', {}, `#${h.lot}`) : link('sim', h.lot, `#${h.lot}`)),
        el('td', {}, KIND[h.kind] ?? h.kind),
        el('td', { class: 'mono' }, h.actor ?? ''),
        el('td', { class: 'ink2' }, detail(h)),
      ))),
    )),
  );
}

// ------------------------------------------------------------------ actor view
function actorView(actor) {
  const mine = data.lots.filter((l) => l.history.some((h) => h.actor === actor || h.consent === actor));
  const flags = flagsFor(actor);
  out.replaceChildren(
    el('section', { class: 'card section-gap' },
      el('div', { class: 'card-head' }, el('h2', {}, el('span', { class: 'mono' }, actor)), el('span', { class: 'sub' }, `${roleLabel(data.actors[actor]?.role ?? '')} · ${mine.length} lots in its records`)),
      ...(flags.length ? flags.map((f) => el('div', { class: 'caution' }, status(f.severity === 'high' ? 'high' : 'review', `Module ${MODULES[f.m].short}`), el('div', { class: 'ink2', style: { fontSize: '13px', marginTop: '6px' } }, ...f.reasons.map((r) => el('div', {}, `• ${r}`))))) : [el('p', { class: 'muted' }, 'Not in the AI review queue.')]),
    ),
    el('section', { class: 'card section-gap' },
      el('div', { class: 'table-wrap' }, el('table', {},
        el('thead', {}, el('tr', {}, el('th', {}, 'Lot'), el('th', {}, 'Created'), el('th', {}, 'Class'), el('th', {}, 'Gas'), el('th', { class: 'r' }, 'kg'), el('th', {}, 'Origin'), el('th', {}, 'Now'))),
        el('tbody', {}, ...mine.slice(0, 150).map((l) => el('tr', {},
          el('td', {}, link('sim', l.id, `#${l.id}`)),
          el('td', { class: 'num' }, l.t),
          el('td', {}, el('span', { class: 'chip' }, el('i', { style: { background: colorOf(l.cls, l.tier) } }), clsName(l.cls, l.tier))),
          el('td', {}, l.gas),
          el('td', { class: 'r num' }, kg(l.g0, 2)),
          el('td', { class: 'mono ink2' }, l.cls === 'RECLAIMED' && !l.parent ? 'reclamation' : l.origin),
          el('td', { class: 'ink2' }, fateLine(l)),
        ))),
      )),
      mine.length > 150 ? el('p', { class: 'muted', style: { marginTop: '8px' } }, `First 150 of ${mine.length} lots shown.`) : null,
    ),
  );
}

// ------------------------------------------------------------------ live chain lot
async function chainView(id) {
  out.replaceChildren(el('div', { class: 'card section-gap' }, el('p', { class: 'muted' }, `Reading lot #${id} from OP Sepolia…`)));
  try {
    const c = await import('./chain.js');
    const { info } = await c.chain();
    const ex = info.explorer;
    const l = await c.lot(id);
    if (!l.clsName || l.clsName === 'NONE') throw new Error(`lot #${id} does not exist on chain`);
    const holder = await c.actorName(l.holder);
    const node = async (x, depth) => {
      const label = await c.labelOf(x.origin);
      const box = el('div', { class: 'node', style: { '--c': colorOf(x.clsName, x.tierName) } },
        el('div', {}, depth ? link('chain', x.id) : el('span', { class: 't' }, `Lot #${x.id}`), el('span', { class: 'muted' }, `  ${clsName(x.clsName, x.tierName)} · ${kg(Number(x.grams), 2)} kg ${x.gasName}`)),
        el('div', { class: 'd' }, `${x.statusName.toLowerCase()} · held by ${await c.actorName(x.holder)} · created ${new Date(Number(x.createdAt) * 1000).toISOString().slice(0, 10)}`),
      );
      const kids = [];
      if (Number(x.parent)) kids.push(el('div', { class: 'edge' }, 'split from'), await node(await c.lot(Number(x.parent)), depth + 1));
      if (x.inputs) {
        kids.push(el('div', { class: 'edge' }, `reclaimed from ${x.inputs.length} recovered lot(s)`));
        for (const i of x.inputs) kids.push(await node(await c.lot(i), depth + 1));
      }
      if (x.equipment) {
        const e = x.equipment;
        kids.push(el('div', { class: 'edge' }, 'recovered from'), el('div', { class: 'node', style: { '--c': 'var(--axis)' } },
          el('div', { class: 't' }, label ?? x.origin),
          el('div', { class: 'd' }, `Tier ${c.TIER[e.tier]} · nameplate ${kg(Number(e.nameplateGrams), 1)} kg · ${kg(Number(e.chargedGrams), 1)} kg recorded top-ups`),
          el('div', { class: 'd' }, `owner ${await c.actorName(e.owner)} (co-signs every recovery) · recovered ${kg(Number(e.recoveredGrams), 1)} kg of a ${kg(Number(x.cap), 1)} kg cap`),
        ));
      }
      if (x.clsName === 'VIRGIN' && !Number(x.parent)) kids.push(el('div', { class: 'edge' }, 'minted against'), el('div', { class: 'node', style: { '--c': 'var(--axis)' } }, el('div', { class: 't' }, label ?? x.origin)));
      return kids.length ? el('div', {}, box, el('div', { class: 'kids' }, ...kids)) : box;
    };
    const url = location.href.split('#')[0];
    const qr = qrcode(0, 'M'); qr.addData(url); qr.make();
    const qrBox = el('div', { class: 'qr' }); qrBox.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 0, scalable: true });
    qrBox.append(el('div', { style: { marginTop: '6px' } }, 'Scan to open this passport'));
    out.replaceChildren(
      el('section', { class: 'card section-gap verdict' },
        el('div', {},
          el('div', { class: 'cls' }, el('i', { style: { background: colorOf(l.clsName, l.tierName) } }), `${clsName(l.clsName, l.tierName)} · ${l.gasName}`, el('span', { class: 'pill live', style: { marginLeft: '6px' } }, el('span', { class: 'dot' }), 'live · OP Sepolia')),
          el('div', { class: 'big' }, `Lot #${l.id} · ${kg(Number(l.grams), 2)} kg`),
          el('p', { class: 'say' }, `Read just now from the KigaliLedger contract on OP Sepolia. Status: ${l.statusName.toLowerCase()}, held by ${holder}.`),
          el('div', { style: { marginTop: '10px', display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '13.5px' } },
            el('a', { href: `${ex}/address/${info.contracts.KigaliLedger}#readContract`, target: '_blank', rel: 'noopener' }, 'Verify on Etherscan ↗'),
            el('a', { href: `${ex}/address/${l.holder}`, target: '_blank', rel: 'noopener' }, 'Holder address ↗'),
          ),
        ),
        qrBox,
      ),
      el('section', { class: 'card section-gap' }, el('div', { class: 'card-head' }, el('h2', {}, 'Where this gas came from'), el('span', { class: 'sub' }, 'every line read from chain state')), el('div', { class: 'lineage' }, await node(l, 0))),
    );
  } catch (err) {
    out.replaceChildren(el('div', { class: 'card section-gap' }, `Could not read lot #${id} from OP Sepolia: ${err.shortMessage ?? err.message}`));
  }
}

// ------------------------------------------------------------------ dispatch
if (params.get('actor')) actorView(params.get('actor'));
else if (params.get('lot')) {
  input.value = params.get('lot');
  if (state.source === 'chain') chainView(parseInt(params.get('lot'), 10));
  else simView(parseInt(params.get('lot'), 10));
} else simView(598);
