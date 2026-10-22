import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { sankey as d3sankey, sankeyLinkHorizontal, sankeyLeft } from 'https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/+esm';
import {
  CLASS, RULES, MODULES, GAS_COLOR, roleLabel, kg, fmt, compact, el, svgEl, icon, status, checkMark, tooltip, chrome, loadSim,
  countUp, reveal, scrollSpy, reducedMotion,
} from './common.js';

chrome('dashboard');
const tip = tooltip();
const data = await loadSim();
const state = { gas: 'all', ai: 'all', allDest: false, virgin: false, drawn: false };
const pct = (a, b) => (b ? Math.round((100 * a) / b) : 0);
const byGas = (x) => state.gas === 'all' || x.gas === state.gas;
const sentence = (...parts) => parts.map((p) => (typeof p === 'string' ? document.createTextNode(p) : p));

// ------------------------------------------------------------------ filters and period
const gasFilter = document.getElementById('gas-filter');
for (const g of ['all', ...data.gases]) {
  gasFilter.append(el('button', {
    type: 'button',
    'aria-pressed': String(g === state.gas),
    onclick: (e) => {
      state.gas = g;
      for (const b of gasFilter.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      render();
    },
  }, g === 'all' ? null : el('i', { class: 'sw', style: { background: GAS_COLOR[g] ?? 'var(--muted)' } }), g === 'all' ? 'All gases' : g));
}
const period = `${data.meta.period[0]} → ${data.meta.period[1]}`;
document.getElementById('period').replaceChildren(
  el('span', {}, period), el('span', {}, `${fmt(data.meta.events)} ledger events`), el('span', {}, `${data.lots.length.toLocaleString('en-US')} lots`),
);
document.getElementById('period2').textContent = `${period} · 36 months`;

// ------------------------------------------------------------------ balance slip and key figures
function totals() {
  const f = data.flows[state.gas];
  const s = f.src;
  const recovered = s.recoveredA + s.recoveredB + s.recoveredC;
  const sinks = { charged: 0, destroyed: 0, stock: 0, loss: f.reclaimLoss };
  for (const x of Object.values(f.sink)) {
    sinks.charged += x.charged;
    sinks.destroyed += x.destroyedEligible + x.destroyedOther;
    sinks.stock += x.inStock;
    sinks.loss += x.handlingLoss;
  }
  return { f, s, recovered, entered: s.virgin + recovered, sinks };
}

function renderSlip() {
  const { s, recovered, entered, sinks } = totals();
  const unexplained = entered - (sinks.charged + sinks.destroyed + sinks.stock + sinks.loss);
  const row = (tag, label, grams, cls) => el('tr', { class: cls }, el('td', {}, tag), el('td', {}, label), el('td', { class: 'v' }, `${kg(grams, 0)} kg`));
  const disc = data.discrepancies.filter(byGas).length;
  document.getElementById('slip').replaceChildren(
    el('h2', {}, icon('balance', { size: 16 }), 'The books, in kilograms'),
    el('table', {}, el('tbody', {},
      row('IN', 'Minted against import quota documents', s.virgin),
      row('IN', 'Recovered from registered equipment', recovered),
      row('OUT', 'Charged into equipment', sinks.charged),
      row('OUT', 'Destroyed', sinks.destroyed),
      row('OUT', 'Still in cylinders', sinks.stock),
      row('OUT', 'Booked as handling or reclamation loss', sinks.loss),
      el('tr', { class: 'sum' }, el('td', {}, '='), el('td', {}, 'Unexplained'), el('td', { class: 'v' }, `${fmt(unexplained)} g`)),
    )),
    el('div', { class: 'verdict' }, unexplained === 0 ? icon('check', { size: 16 }) : icon('alert', { size: 16 }),
      el('span', {}, unexplained === 0
        ? `The ledger invariant holds. That is guaranteed by design, so the useful part is where the losses land: ${disc} weight discrepanc${disc === 1 ? 'y was' : 'ies were'} flagged on receipt.`
        : `${fmt(unexplained)} g do not balance.`)),
  );
}

function renderFigures() {
  const { s, recovered, f } = totals();
  const dest = data.destructions.filter(byGas);
  const eligible = dest.filter((d) => d.eligible);
  const claimed = eligible.filter((d) => d.claimedBy);
  const tco2e = eligible.reduce((a, d) => a + d.tCO2e, 0);
  const reclaimYield = f.reclaimIn ? (100 * s.reclaimed) / f.reclaimIn : 0;
  const fig = (ico, label, value, unit, note, format = (v) => kg(v, 0)) => {
    const v = el('span', {});
    countUp(v, value, format);
    return el('div', { class: 'figure' }, el('div', { class: 'k' }, icon(ico, { size: 16 }), label), el('div', { class: 'v num' }, v, el('small', {}, unit)), el('div', { class: 'n' }, note));
  };
  document.getElementById('figures').replaceChildren(
    fig('unit', 'Recovered from equipment', recovered, 'kg', `${pct(s.recoveredA, recovered)}% from registered Tier A units · ${kg(s.recoveredC, 0)} kg quarantined`),
    fig('flask', 'Reclaimed', s.reclaimed, 'kg', `${fmt(reclaimYield, 1)}% of input, never above input minus losses`),
    fig('flame', 'Destroyed, credit-eligible', eligible.reduce((a, d) => a + d.grams, 0), 'kg', `${fmt(tco2e, 0)} tCO₂e · ${claimed.length} of ${eligible.length} events claimed once`),
    fig('reject', 'Refused on chain', data.rejections.length, 'attempts', 'every gas · reverted by rules R1–R7', (v) => fmt(Math.round(v))),
  );
}

// ------------------------------------------------------------------ 01 sankey
const NODES = {
  virgin: CLASS.virgin.label, recoveredA: CLASS.recoveredA.label, recoveredB: CLASS.recoveredB.label, recoveredC: CLASS.recoveredC.label,
  reclamation: 'Reclamation', reclaimed: 'Reclaimed output',
  charged: 'Charged into equipment', destroyedEligible: 'Destroyed · credit-eligible', destroyedOther: 'Destroyed · not creditable',
  inStock: 'Still in cylinders', loss: 'Losses (handling, reclamation)',
};
const LINK_COLOR = { virgin: 'var(--c-virgin)', recoveredA: 'var(--c-recovered)', recoveredB: 'var(--c-recovered)', recoveredC: 'var(--c-quarantine)', reclaimed: 'var(--c-reclaimed)', reclamation: 'var(--c-reclaimed)', destroyedEligible: 'var(--c-recovered)' };

function sankeyData() {
  const f = data.flows[state.gas];
  const links = [];
  const add = (source, target, value, color) => { if (value > 0) links.push({ source, target, value, color }); };
  for (const k of ['virgin', 'recoveredA', 'recoveredB', 'recoveredC', 'reclaimed']) {
    const s = f.sink[k];
    if (!s || (k === 'virgin' && !state.virgin)) continue;
    add(k, 'charged', s.charged, k);
    add(k, 'destroyedEligible', s.destroyedEligible, k);
    add(k, 'destroyedOther', s.destroyedOther, k);
    add(k, 'reclamation', s.reclaimInput, k);
    add(k, 'inStock', s.inStock, k);
    add(k, 'loss', s.handlingLoss, k);
  }
  add('reclamation', 'reclaimed', f.src.reclaimed, 'reclaimed');
  add('reclamation', 'loss', f.reclaimLoss, 'reclaimed');
  for (const [who, g] of Object.entries(f.claims)) {
    const id = `claim:${who}`;
    NODES[id] = who === 'unclaimed' ? 'Not yet claimed' : `Claimed by ${who}`;
    add('destroyedEligible', id, g, 'destroyedEligible');
  }
  const used = new Set(links.flatMap((l) => [l.source, l.target]));
  return { nodes: [...used].map((id) => ({ id, name: NODES[id] })), links };
}

function renderSankey(animate = false) {
  const host = document.getElementById('sankey');
  const width = Math.max(host.clientWidth, 640);
  const height = 480;
  const margin = { top: 8, right: 200, bottom: 8, left: 2 };
  const { nodes, links } = sankeyData();
  const graph = d3sankey().nodeId((d) => d.id).nodeAlign(sankeyLeft).nodeWidth(8).nodePadding(18)
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])({ nodes: nodes.map((d) => ({ ...d })), links: links.map((d) => ({ ...d })) });
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Sankey diagram of kilograms by provenance class and fate' });
  const gLinks = svgEl('g', { fill: 'none' });
  const path = sankeyLinkHorizontal();
  const drawn = [];
  for (const l of graph.links) {
    const p = svgEl('path', { d: path(l), 'stroke-width': Math.max(1, l.width), tabindex: 0, 'aria-label': `${kg(l.value, 1)} kg from ${l.source.name} to ${l.target.name}` });
    p.style.stroke = LINK_COLOR[l.color] ?? 'var(--c-loss)';
    p.style.strokeOpacity = '0.34';
    p.style.transition = 'stroke-opacity .15s';
    const over = (e) => {
      for (const q of gLinks.children) q.style.strokeOpacity = q === p ? '0.75' : '0.14';
      tip.show(e, () => [el('strong', {}, `${kg(l.value, 1)} kg`), el('div', { class: 'muted' }, `${l.source.name} → ${l.target.name}`)]);
    };
    const out = () => { for (const q of gLinks.children) q.style.strokeOpacity = '0.34'; tip.hide(); };
    p.addEventListener('pointermove', over); p.addEventListener('pointerleave', out);
    p.addEventListener('focus', over); p.addEventListener('blur', out);
    gLinks.append(p);
    drawn.push([p, l.source.depth]);
  }
  svg.append(gLinks);
  const gNodes = svgEl('g');
  for (const n of graph.nodes) {
    const r = svgEl('rect', { x: n.x0, y: n.y0, width: n.x1 - n.x0, height: Math.max(1, n.y1 - n.y0) });
    r.style.fill = LINK_COLOR[n.id] ?? (n.id.startsWith('claim:') ? 'var(--c-recovered)' : 'var(--ink)');
    const tx = n.x1 + 9;
    const cy = (n.y0 + n.y1) / 2;
    const t = svgEl('text', { x: tx, y: cy, dy: '-0.2em', 'font-size': 12.5, 'font-weight': 500 });
    t.style.fill = 'var(--ink)';
    t.textContent = n.name;
    const v = svgEl('text', { x: tx, y: cy, dy: '1.05em', 'font-size': 11.5, class: 'val' });
    v.style.fill = 'var(--muted)';
    v.textContent = `${kg(n.value, 0)} kg`;
    for (const label of [t, v]) Object.assign(label.style, { paintOrder: 'stroke', stroke: 'var(--paper)', strokeWidth: '3px', strokeLinejoin: 'round' }); // stays legible over the flows
    gNodes.append(r, t, v);
  }
  svg.append(gNodes);
  if (host.clientWidth < 640) svg.style.width = `${width}px`;
  host.classList.toggle('scroll-x', host.clientWidth < 640);
  host.replaceChildren(svg);

  // the flow draws itself in the direction the gas moves, one column after another
  if (animate && !reducedMotion()) {
    for (const [p, depth] of drawn) {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = String(len);
      p.style.transition = `stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1) ${depth * 260}ms, stroke-opacity .15s`;
    }
    gNodes.style.opacity = '0';
    gNodes.style.transition = 'opacity .6s ease 200ms';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      for (const [p] of drawn) p.style.strokeDashoffset = '0';
      gNodes.style.opacity = '1';
    }));
  }

  document.getElementById('sankey-legend').replaceChildren(
    ...[...(state.virgin ? [['var(--c-virgin)', 'Virgin, quota-backed']] : []), ['var(--c-recovered)', 'Recovered from registered equipment'], ['var(--c-quarantine)', 'Recovered < 180 days after a charge (tier C: never reclaimed or credited)'], ['var(--c-reclaimed)', 'Reclaimed']]
      .map(([c, t]) => el('span', {}, el('i', { style: { background: c } }), t)),
  );
  document.getElementById('sankey-table').replaceChildren(el('table', { class: 'ledger' },
    el('thead', {}, el('tr', {}, el('th', {}, 'From'), el('th', {}, 'To'), el('th', { class: 'r' }, 'kg'))),
    el('tbody', {}, ...graph.links.map((l) => el('tr', {}, el('td', {}, l.source.name), el('td', {}, l.target.name), el('td', { class: 'r num' }, kg(l.value, 1))))),
  ));

  const { s, recovered } = totals();
  const f = data.flows[state.gas];
  const reclaimIn = Object.values(f.sink).reduce((a, x) => a + x.reclaimInput, 0);
  const destroyed = ['recoveredA', 'recoveredB', 'recoveredC'].reduce((a, k) => a + (f.sink[k]?.destroyedEligible ?? 0) + (f.sink[k]?.destroyedOther ?? 0), 0);
  document.getElementById('flows-finding').replaceChildren(...sentence(
    el('strong', {}, `${kg(recovered, 0)} kg`), ' came back out of registered equipment. ',
    el('strong', {}, `${pct(reclaimIn, recovered)}%`), ' went to reclamation and ',
    el('strong', {}, `${pct(destroyed, recovered)}%`), ` was destroyed; ${kg(s.recoveredC, 0)} kg was quarantined because it was recovered within 180 days of a charge.`,
  ));
}

const scope = document.getElementById('sankey-scope');
for (const [v, label] of [[false, 'Recovered kilograms'], [true, 'Include virgin supply']]) {
  scope.append(el('button', {
    type: 'button',
    'aria-pressed': String(v === state.virgin),
    onclick: (e) => {
      state.virgin = v;
      for (const b of scope.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      renderSankey(true);
    },
  }, label));
}
const tableBtn = document.getElementById('sankey-table-btn');
tableBtn.addEventListener('click', () => {
  const t = document.getElementById('sankey-table');
  t.hidden = !t.hidden;
  tableBtn.setAttribute('aria-expanded', String(!t.hidden));
  tableBtn.textContent = t.hidden ? 'Show as table' : 'Hide table';
});

// ------------------------------------------------------------------ 02 end-of-life closure
function renderClosure() {
  const c = data.closure;
  const units = c.units.filter(byGas);
  const by = (s) => units.filter((u) => u.status === s);
  const gap = by('no_record');
  const low = gap.reduce((a, u) => a + u.low, 0);
  const high = gap.reduce((a, u) => a + u.high, 0);
  const t = (k) => gap.reduce((a, u) => a + (u[k] / 1e6) * data.meta.gwp[u.gas], 0);
  const decided = Math.max(units.length - by('pending').length, 1);
  const top = [...gap].sort((a, b) => b.high - a.high).slice(0, 6);
  const fig = (ico, label, value, unit, note) => el('div', { class: 'figure' }, el('div', { class: 'k' }, icon(ico, { size: 16 }), label), el('div', { class: 'v num' }, value, el('small', {}, unit)), el('div', { class: 'n' }, note));
  document.getElementById('eol-finding').replaceChildren(...sentence(
    el('strong', {}, `${gap.length} of ${units.length}`), ' registered units that left service have no recovery on the ledger: an estimated ',
    el('strong', {}, `${kg(low, 0)}–${kg(high, 0)} kg`), ' of refrigerant probably vented. This is the largest emission the ledger can point at.',
  ));
  document.getElementById('closure').replaceChildren(
    el('div', { class: 'figures', style: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' } },
      fig('unit', 'Registered units removed', fmt(units.length), 'units', `${by('recovered').length} with a recovery on the ledger · ${by('pending').length} pending`),
      fig('alert', 'Removed with no recovery record', fmt(gap.length), 'units', `${pct(gap.length, decided)}% of decided removals`),
      fig('vent', 'Refrigerant unaccounted for', `${kg(low, 0)}–${kg(high, 0)}`, 'kg', `${fmt(t('low'), 0)}–${fmt(t('high'), 0)} tCO₂e`),
    ),
    el('div', { class: 'table-wrap', style: { marginTop: '22px' } }, el('table', { class: 'ledger' },
      el('thead', {}, el('tr', {}, el('th', {}, 'Unit'), el('th', {}, 'Type'), el('th', {}, 'Gas'), el('th', {}, 'Removed'), el('th', {}, 'Serviced by'), el('th', { class: 'r' }, 'Nameplate kg'), el('th', { class: 'r' }, 'Likely unaccounted kg'))),
      el('tbody', {}, ...top.map((u) => el('tr', {},
        el('td', { class: 'mono' }, u.id), el('td', {}, u.category.replaceAll('_', ' ')),
        el('td', {}, el('span', { class: 'tagline' }, el('i', { style: { background: GAS_COLOR[u.gas] } }), u.gas)),
        el('td', { class: 'num' }, u.removed), el('td', { class: 'mono' }, u.service),
        el('td', { class: 'r num' }, kg(u.nameplate, 1)), el('td', { class: 'r num' }, `${kg(u.low, 1)}–${kg(u.high, 1)}`),
      ))),
    )),
    el('p', { class: 'note' },
      `Largest six shown. ${c.companies.length ? `${c.companies.length} service compan${c.companies.length > 1 ? 'ies stand' : 'y stands'} out against the others.` : `No service company stands out against the others (${c.companiesAssessed} compared).`} `
      + 'The estimate is the nameplate charge times the IPCC 2006 range of charge still in a unit of that kind at end of life (Table 7.9). Units below the national registration threshold are invisible here until someone recovers them.'),
  );
}

// ------------------------------------------------------------------ 03 refusals
function renderRules() {
  const counts = d3.rollups(data.rejections, (v) => v.length, (r) => r.reason).sort((a, b) => b[1] - a[1]);
  const max = d3.max(counts, (d) => d[1]) ?? 1;
  const list = document.getElementById('refusals');
  list.replaceChildren(...counts.map(([reason, n]) => {
    const [rule, what] = RULES[reason] ?? ['?', reason];
    const bar = el('b', { style: { transform: 'scaleX(0)', transition: 'transform .8s cubic-bezier(.2,.7,.2,1)' } });
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.transform = `scaleX(${n / max})`; }));
    return el('li', {},
      el('span', { class: 'code' }, rule),
      el('span', { class: 'what' }, el('b', {}, reason), el('span', {}, what)),
      el('span', { class: 'bar', 'aria-hidden': 'true' }, bar),
      el('span', { class: 'n' }, String(n)),
    );
  }));
  const top = counts[0];
  document.getElementById('rules-finding').replaceChildren(...sentence(
    el('strong', {}, `${data.rejections.length} attempts`), ' reverted on chain. ',
    top ? `The most frequent: ${(RULES[top[0]] ?? [, top[0]])[1].toLowerCase()} (${top[1]}). ` : '',
    'Each one left the books exactly as they were.',
  ));
  const latest = [...data.rejections].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 7);
  document.getElementById('rejections').replaceChildren(
    el('thead', {}, el('tr', {}, el('th', {}, 'Date'), el('th', {}, 'Rule'), el('th', {}, 'Who tried'), el('th', {}, 'What'))),
    el('tbody', {}, ...latest.map((r) => el('tr', {},
      el('td', { class: 'num' }, r.t),
      el('td', {}, status('blocked', (RULES[r.reason] ?? ['?'])[0])),
      el('td', { class: 'mono' }, r.actor ?? ''),
      el('td', { class: 'ink2' }, describeRejection(r)),
    ))),
  );
}
function describeRejection(r) {
  const d = r.detail;
  switch (r.reason) {
    case 'RecoveryExceedsContent': return `Recover ${kg(d.grams)} kg from ${d.equipment}, more than is booked inside it`;
    case 'NotUnitOwner': return `Recover ${kg(d.grams)} kg from ${d.equipment} signed by ${d.consent}, not the unit's owner`;
    case 'CylinderInUse': return `Recover into ${d.cylinder}, which already holds an open lot`;
    case 'ReclaimExceedsInput': return `Claim ${kg(d.outGrams, 2)} kg reclaimed from ${kg(d.inGrams, 2)} kg input (max ${kg(d.maxOut, 2)} kg)`;
    case 'NotVerifier': return `Destroy ${kg(d.grams, 2)} kg with a certificate signed by ${d.verifier}`;
    case 'AlreadyClaimed': return `Claim destruction event #${d.eventId} a second time`;
    case 'TierNotAccepted': return `Claim event #${d.eventId}; its evidence tier is below this registry's policy`;
    case 'ServiceNotAuthorized': return `${d.actor} charges ${kg(d.grams, 2)} kg into ${d.equipment}, a unit it does not service`;
    case 'NotDesignated': return `${d.actor} claims event #${d.eventId}, designated to ${d.designated}`;
    default: return (RULES[r.reason] ?? [, r.reason])[1];
  }
}

// ------------------------------------------------------------------ 04 AI review
const aiFilter = document.getElementById('ai-filter');
for (const m of ['all', 'a', 'b', 'c']) {
  aiFilter.append(el('button', {
    type: 'button',
    'aria-pressed': String(m === state.ai),
    onclick: (e) => {
      state.ai = m;
      for (const b of aiFilter.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      renderQueue();
    },
  }, m === 'all' ? 'All modules' : MODULES[m].name));
}
function gauge(score, sev) {
  const filled = Math.round(score * 10);
  return el('span', { class: `gauge ${sev}`, title: `score ${score.toFixed(2)}`, 'aria-hidden': 'true' }, ...Array.from({ length: 10 }, (_, i) => el('b', { class: i < filled ? 'f' : null })));
}
function renderQueue() {
  const items = [];
  for (const m of ['a', 'b', 'c']) {
    if (state.ai !== 'all' && state.ai !== m) continue;
    for (const f of data.ai[m].flags) items.push({ ...f, m });
  }
  const rank = { high: 0, review: 1, none: 2 };
  items.sort((a, b) => rank[a.severity] - rank[b.severity] || b.score - a.score);
  document.getElementById('queue').replaceChildren(...items.map((f) => {
    const sev = f.severity === 'none' ? 'watch' : f.severity;
    const label = { high: 'High', review: 'Review', watch: 'Watch' }[sev];
    const mod = data.ai[f.m];
    return el('details', { class: `dossier ${sev}` },
      el('summary', {},
        el('span', { class: 'who' }, el('b', {}, f.actor), el('span', {}, roleLabel(f.role)), el('span', { class: 'tagline' }, `Module ${MODULES[f.m].short}`)),
        el('span', { class: 'side' }, status(sev, label), gauge(f.score, sev), el('span', { class: 'score' }, f.score.toFixed(2))),
        el('span', { class: 'why' }, f.reasons[0] ?? (sev === 'watch' ? 'Below the flag threshold; kept on a watch list.' : '')),
      ),
      el('div', { class: 'body' },
        f.reasons.length > 1 ? el('ul', {}, ...f.reasons.slice(1).map((r) => el('li', {}, r))) : null,
        el('div', {}, `Signals: ${f.signals.filter((s) => s.score > 0).map((s) => `${s.name} ${s.score.toFixed(2)}`).join(' · ') || 'none above zero'}`),
        el('div', { class: 'hash' }, `${mod.model} ${mod.version} · model ${mod.modelHash.slice(0, 12)} · input ${mod.inputSnapshot.slice(0, 12)}`),
        ['SERVICE', 'RECLAIMER', 'DISTRIBUTOR'].includes(f.role)
          ? el('p', { style: { marginTop: '8px' } }, el('a', { href: `passport.html?actor=${encodeURIComponent(f.actor)}` }, 'Trace the lots this company handled')) : null,
      ),
    );
  }));
  const flagged = ['a', 'b', 'c'].reduce((a, m) => a + data.ai[m].flags.filter((f) => f.severity !== 'none').length, 0);
  const assessed = ['a', 'b', 'c'].reduce((a, m) => a + data.ai[m].assessed, 0);
  document.getElementById('review-finding').replaceChildren(...sentence(
    el('strong', {}, `${flagged} parties`), ` out of ${assessed} assessments are legal on the ledger but implausible. Each comes with its reasons and the hash of the model that scored it. Nothing is sanctioned automatically.`,
  ));
  const parts = ['a', 'b', 'c'].map((m) => `${MODULES[m].name}: ${data.ai[m].flags.filter((f) => f.severity !== 'none').length} of ${data.ai[m].assessed}`);
  document.getElementById('ai-meta').textContent = `${parts.join(' · ')}. On held-out simulated runs, fraudsters who adapt are mostly missed, but adapting keeps them small; see the evaluation reports.`;
}

// ------------------------------------------------------------------ 05 destruction events and claims
function renderDestructions() {
  const rows = data.destructions.filter(byGas).sort((a, b) => b.t.localeCompare(a.t));
  const shown = state.allDest ? rows : rows.slice(0, 8);
  const eligible = rows.filter((d) => d.eligible);
  const blocked = rows.reduce((a, d) => a + d.blockedClaims.length, 0);
  document.getElementById('claims-finding').replaceChildren(...sentence(
    el('strong', {}, `${eligible.filter((d) => d.claimedBy).length} of ${eligible.length}`), ' credit-eligible destruction events were claimed, each by exactly one registry. ',
    el('strong', {}, `${blocked}`), ` other claim${blocked === 1 ? ' was' : 's were'} refused.`,
  ));
  document.getElementById('destructions').replaceChildren(
    el('thead', {}, el('tr', {},
      el('th', {}, 'Event'), el('th', {}, 'Date'), el('th', {}, 'Facility'), el('th', {}, 'Gas'), el('th', { class: 'r' }, 'kg'),
      el('th', { class: 'r' }, 'tCO₂e'), el('th', {}, 'Evidence'), el('th', {}, 'Verifier'), el('th', {}, 'Claim'))),
    el('tbody', {}, ...shown.map((d) => el('tr', {},
      el('td', { class: 'mono' }, `#${d.id}`),
      el('td', { class: 'num' }, d.t),
      el('td', { class: 'mono' }, d.facility),
      el('td', {}, el('span', { class: 'tagline' }, el('i', { style: { background: GAS_COLOR[d.gas] } }), d.gas)),
      el('td', { class: 'r num' }, kg(d.grams, 2)),
      el('td', { class: 'r num' }, d.eligible ? fmt(d.tCO2e, 1) : '–'),
      el('td', {}, d.eligible ? el('span', { class: 'tagline' }, `Tier ${d.tier}`) : el('span', { class: 'muted' }, 'Not creditable')),
      el('td', { class: 'mono' }, d.verifier),
      el('td', {}, d.claimedBy
        ? el('span', {}, el('span', { class: 'status ok' }, icon('stamp', { size: 15 }), d.claimedBy),
          d.blockedClaims.length ? el('div', { class: 'muted', style: { fontSize: '12px', marginTop: '3px' } }, `${d.blockedClaims.length} other claim${d.blockedClaims.length > 1 ? 's' : ''} refused`) : null)
        : d.eligible ? el('span', { class: 'muted' }, d.blockedClaims.length ? `unclaimed · ${d.blockedClaims.length} refused` : 'unclaimed') : el('span', { class: 'muted' }, '–')),
    ))),
  );
  const btn = document.getElementById('more-dest');
  btn.textContent = state.allDest ? 'Show fewer' : `Show all ${rows.length} events`;
  btn.hidden = rows.length <= 8;
}
document.getElementById('more-dest').addEventListener('click', () => { state.allDest = !state.allDest; renderDestructions(); });

// ------------------------------------------------------------------ 06 monthly trend
const SERIES = [
  ['recovered', 'Recovered', 'var(--c-recovered)'],
  ['reclaimed', 'Reclaimed', 'var(--c-reclaimed)'],
  ['destroyed', 'Destroyed', 'var(--ink-2)'],
];
function renderTrend() {
  const rows = data.monthly.map(({ m, byGas: g }) => {
    const pick = state.gas === 'all' ? Object.values(g) : [g[state.gas] ?? {}];
    const o = { m, date: new Date(`${m}-01T00:00:00Z`) };
    for (const [k] of SERIES) o[k] = pick.reduce((a, x) => a + (x[k] ?? 0), 0) / 1000;
    return o;
  });
  const host = document.getElementById('trend-chart');
  const width = Math.max(host.clientWidth, 480);
  const height = 270;
  const m = { top: 14, right: 96, bottom: 28, left: 46 };
  const x = d3.scaleUtc().domain(d3.extent(rows, (d) => d.date)).range([m.left, width - m.right]);
  const y = d3.scaleLinear().domain([0, d3.max(rows, (d) => Math.max(...SERIES.map(([k]) => d[k])))]).nice().range([height - m.bottom, m.top]);
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Monthly kilograms recovered, reclaimed and destroyed' });
  for (const t of y.ticks(4)) {
    const ln = svgEl('line', { x1: m.left, x2: width - m.right, y1: y(t), y2: y(t) });
    ln.style.stroke = t === 0 ? 'var(--ink)' : 'var(--rule)';
    const lb = svgEl('text', { x: m.left - 10, y: y(t), dy: '0.32em', 'text-anchor': 'end', 'font-size': 11, class: 'val' });
    lb.style.fill = 'var(--muted)';
    lb.textContent = compact(t);
    svg.append(ln, lb);
  }
  for (const t of x.ticks(width < 700 ? 4 : 8)) {
    const lb = svgEl('text', { x: x(t), y: height - 6, 'text-anchor': 'middle', 'font-size': 11, class: 'val' });
    lb.style.fill = 'var(--muted)';
    lb.textContent = d3.utcFormat('%b %Y')(t);
    svg.append(lb);
  }
  const yl = svgEl('text', { x: m.left - 10, y: m.top - 4, 'text-anchor': 'end', 'font-size': 11, class: 'val' });
  yl.style.fill = 'var(--muted)';
  yl.textContent = 'kg';
  svg.append(yl);
  const line = d3.line().x((d) => x(d.date)).curve(d3.curveLinear);
  const last = rows.at(-1);
  for (const [k, , color] of SERIES) {
    const p = svgEl('path', { d: line.y((d) => y(d[k]))(rows), fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    p.style.stroke = color;
    const end = svgEl('circle', { cx: x(last.date), cy: y(last[k]), r: 4, 'stroke-width': 2 });
    end.style.fill = color; end.style.stroke = 'var(--paper)';
    svg.append(p, end);
  }
  const ends = SERIES.map(([k, name]) => ({ k, name, y: y(last[k]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 15);
  for (const e of ends) {
    const t = svgEl('text', { x: width - m.right + 12, y: e.y, dy: '0.32em', 'font-size': 12 });
    t.style.fill = 'var(--ink-2)';
    t.textContent = e.name;
    svg.append(t);
  }
  const cross = svgEl('line', { y1: m.top, y2: height - m.bottom, visibility: 'hidden' });
  cross.style.stroke = 'var(--rule-strong)';
  const hit = svgEl('rect', { x: m.left, y: m.top, width: width - m.left - m.right, height: height - m.top - m.bottom, fill: 'transparent' });
  const bis = d3.bisector((d) => d.date).center;
  hit.addEventListener('pointermove', (e) => {
    const [px] = d3.pointer(e, svg);
    const d = rows[bis(rows, x.invert(px * (width / svg.getBoundingClientRect().width)))];
    cross.setAttribute('x1', x(d.date)); cross.setAttribute('x2', x(d.date)); cross.setAttribute('visibility', 'visible');
    tip.show(e, () => [el('div', { class: 'muted' }, d3.utcFormat('%B %Y')(d.date)),
      ...SERIES.map(([k, name, color]) => el('div', { class: 'row' }, el('span', { class: 'key', style: { background: color } }), el('strong', {}, `${fmt(d[k], 1)} kg`), el('span', {}, name)))]);
  });
  hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); tip.hide(); });
  svg.append(cross, hit);
  host.replaceChildren(svg);
  document.getElementById('trend-legend').replaceChildren(...SERIES.map(([, name, color]) => el('span', {}, el('i', { class: 'line', style: { background: color } }), name)));
}

// ------------------------------------------------------------------ 07 live chain
async function renderLive() {
  const box = document.getElementById('live');
  const pill = document.getElementById('live-pill');
  box.replaceChildren(el('p', { class: 'muted' }, 'Connecting to OP Sepolia through its public RPC…'));
  try {
    const { overview, actorName } = await import('./chain.js');
    const o = await overview();
    const t = o.totals;
    const ex = o.info.explorer;
    const evs = await Promise.all(o.events.map(async (e, i) => ({ i, e, facility: await actorName(e.facility), claimer: e.claimedBy === '0x0000000000000000000000000000000000000000' ? null : await actorName(e.claimedBy) })));
    pill.className = 'live-state on';
    pill.replaceChildren(el('i'), 'live · OP Sepolia');
    const balanced = Number(t.virginMinted) + Number(t.unknownDeclared) + Number(t.recovered) === Number(t.live) + Number(t.charged) + Number(t.destroyed) + Number(t.reclaimLoss) + Number(t.handlingLoss);
    const cell = (k, v, unit) => el('div', {}, el('dt', {}, k), el('dd', {}, v, unit ? el('small', {}, ` ${unit}`) : null));
    box.replaceChildren(
      el('dl', { class: 'readout' },
        cell('Lots on chain', String(o.lotCount)),
        cell('R-404A minted', kg(Number(t.virginMinted), 1), 'kg'),
        cell('R-404A recovered', kg(Number(t.recovered), 1), 'kg'),
        cell('AI flags on chain', String(o.flagCount)),
      ),
      el('div', { style: { marginTop: '14px' } },
        el('div', { class: 'event-line' }, balanced ? checkMark('Books balance on chain: minted + recovered = live + charged + destroyed + losses') : status('high', 'The on-chain books do not balance')),
        ...evs.map(({ i, e, facility, claimer }) => el('div', { class: 'event-line' },
          icon('flame', { size: 16 }), el('span', { class: 'mono' }, `Event #${i}`),
          el('span', {}, `${kg(Number(e.grams), 1)} kg R-404A · DRE ${(e.dreBps / 100).toFixed(2)}% · ${facility}`),
          claimer ? el('span', { class: 'status ok' }, icon('stamp', { size: 15 }), `claimed once, by ${claimer}`) : el('span', { class: 'muted' }, 'unclaimed'),
        )),
      ),
      el('div', { class: 'links' },
        el('a', { href: 'passport.html?source=chain&lot=6' }, icon('tag', { size: 15 }), 'Passport of the reclaimed lot on chain'),
        ...Object.entries(o.info.contracts).slice(0, 3).map(([n, a]) => el('a', { href: `${ex}/address/${a}#code`, target: '_blank', rel: 'noopener' }, n, icon('external', { size: 13 }))),
      ),
    );
  } catch (err) {
    pill.className = 'live-state';
    pill.replaceChildren(el('i'), 'offline');
    box.replaceChildren(el('p', { class: 'muted' }, `Could not reach OP Sepolia from this browser (${err.shortMessage ?? err.message}). The contract addresses are in the README.`));
  }
}

// ------------------------------------------------------------------ render
function render(animate = true) {
  renderSlip();
  renderFigures();
  renderSankey(animate);
  renderClosure();
  renderRules();
  renderQueue();
  renderDestructions();
  renderTrend();
}
render(true);
renderLive();
reveal();
scrollSpy();
let rt;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { renderSankey(false); renderTrend(); }, 150); });
