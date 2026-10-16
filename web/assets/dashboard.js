import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { sankey as d3sankey, sankeyLinkHorizontal, sankeyLeft } from 'https://cdn.jsdelivr.net/npm/d3-sankey@0.12.3/+esm';
import { CLASS, RULES, MODULES, roleLabel, kg, fmt, compact, el, svgEl, status, checkMark, tooltip, chrome, loadSim } from './common.js';

chrome('dashboard');
const tip = tooltip();
const data = await loadSim();
const state = { gas: 'all', ai: 'all', allDest: false, virgin: false };

// ------------------------------------------------------------------ filters
const gasFilter = document.getElementById('gas-filter');
for (const g of ['all', ...data.gases]) {
  gasFilter.append(el('button', {
    'aria-pressed': String(g === state.gas),
    onclick: (e) => {
      state.gas = g;
      for (const b of gasFilter.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      render();
    },
  }, g === 'all' ? 'All gases' : g));
}
document.getElementById('period').textContent = `${data.meta.period[0]} to ${data.meta.period[1]} · ${fmt(data.meta.events)} ledger events`;

// ------------------------------------------------------------------ tiles
function tiles() {
  const f = data.flows[state.gas];
  const s = f.src;
  const recovered = s.recoveredA + s.recoveredB + s.recoveredC;
  const entered = s.virgin + recovered;
  const sinks = { charged: 0, destroyed: 0, stock: 0, loss: f.reclaimLoss };
  for (const k of Object.keys(f.sink)) {
    const x = f.sink[k];
    sinks.charged += x.charged;
    sinks.destroyed += x.destroyedEligible + x.destroyedOther;
    sinks.stock += x.inStock;
    sinks.loss += x.handlingLoss;
  }
  // reclaimed output re-enters as its own class; its inputs were already counted as recovered
  const unexplained = entered - (sinks.charged + sinks.destroyed + sinks.stock + sinks.loss);
  const dest = data.destructions.filter((d) => state.gas === 'all' || d.gas === state.gas);
  const eligible = dest.filter((d) => d.eligible);
  const claimed = eligible.filter((d) => d.claimedBy);
  const t = eligible.reduce((a, d) => a + d.tCO2e, 0);
  const reclaimYield = f.reclaimIn ? (100 * s.reclaimed) / f.reclaimIn : 0;

  const box = document.getElementById('tiles');
  box.replaceChildren(
    el('div', { class: 'card tile hero' },
      el('div', { class: 'label' }, 'Kilograms that entered the ledger'),
      el('div', { class: 'value' }, kg(entered, 0), el('small', {}, 'kg')),
      el('div', { class: 'foot' }, `${kg(s.virgin, 0)} kg minted against quota documents + ${kg(recovered, 0)} kg recovered from registered equipment`),
      el('div', { style: { marginTop: '8px' } }, unexplained === 0
        ? checkMark('Ledger invariant holds: every gram in is charged, destroyed, in stock or booked as a loss')
        : status('high', `${fmt(unexplained)} g unexplained`)),
      el('div', { class: 'foot' }, `By design, not a finding. What matters is where losses land: ${kg(sinks.loss, 0)} kg of losses, ${data.discrepancies.filter((d) => state.gas === 'all' || d.gas === state.gas).length} weight discrepancies flagged on receipt.`),
    ),
    tile('Recovered from equipment', kg(recovered, 0), 'kg', `${Math.round((100 * s.recoveredA) / Math.max(recovered, 1))}% Tier A · ${kg(s.recoveredC, 0)} kg quarantined (tier C)`),
    tile('Reclaimed', kg(s.reclaimed, 0), 'kg', `${fmt(reclaimYield, 1)}% of recovered input; never above input minus losses`),
    tile('Destroyed, credit-eligible', kg(eligible.reduce((a, d) => a + d.grams, 0), 0), 'kg', `${fmt(t, 0)} tCO₂e · ${claimed.length} of ${eligible.length} events claimed, each once`),
    tile('Rejected on chain', fmt(data.rejections.length), 'attempts', 'all gases · reverted by rules R1–R7'),
  );
}
const tile = (label, value, unit, foot) => el('div', { class: 'card tile' },
  el('div', { class: 'label' }, label), el('div', { class: 'value' }, value, el('small', {}, unit)), el('div', { class: 'foot' }, foot));

// ------------------------------------------------------------------ sankey
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
  const nodes = [...used].map((id) => ({ id, name: NODES[id] }));
  return { nodes, links };
}

function renderSankey() {
  const host = document.getElementById('sankey');
  const width = Math.max(host.clientWidth, 640);
  const height = 470;
  const margin = { top: 6, right: 190, bottom: 6, left: 4 };
  const { nodes, links } = sankeyData();
  const layout = d3sankey().nodeId((d) => d.id).nodeAlign(sankeyLeft).nodeWidth(12).nodePadding(16)
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);
  const graph = layout({ nodes: nodes.map((d) => ({ ...d })), links: links.map((d) => ({ ...d })) });
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Sankey diagram of kilograms by provenance class and fate' });

  const gLinks = svgEl('g', { fill: 'none' });
  const path = sankeyLinkHorizontal();
  for (const l of graph.links) {
    const p = svgEl('path', { d: path(l), 'stroke-width': Math.max(1, l.width), tabindex: 0 });
    p.style.stroke = LINK_COLOR[l.color] ?? 'var(--c-loss)';
    p.style.strokeOpacity = '0.38';
    p.style.transition = 'stroke-opacity .1s';
    const over = (e) => {
      p.style.strokeOpacity = '0.7';
      tip.show(e, () => [el('strong', {}, `${kg(l.value, 1)} kg`), el('div', {}, `${l.source.name} → ${l.target.name}`)]);
    };
    const out = () => { p.style.strokeOpacity = '0.38'; tip.hide(); };
    p.addEventListener('pointermove', over); p.addEventListener('pointerleave', out);
    p.addEventListener('focus', over); p.addEventListener('blur', out);
    gLinks.append(p);
  }
  svg.append(gLinks);

  const gNodes = svgEl('g');
  for (const n of graph.nodes) {
    const r = svgEl('rect', { x: n.x0, y: n.y0, width: n.x1 - n.x0, height: Math.max(1, n.y1 - n.y0), rx: 2 });
    r.style.fill = LINK_COLOR[n.id] ?? (n.id.startsWith('claim:') ? 'var(--c-recovered)' : 'var(--ink-2)');
    gNodes.append(r);
    const right = n.x0 > width / 2 || n.sourceLinks.length === 0;
    const tx = right ? n.x1 + 8 : n.x1 + 8;
    const t = svgEl('text', { x: tx, y: (n.y0 + n.y1) / 2, dy: '-0.15em', 'font-size': 12.5, 'font-weight': 600 });
    t.style.fill = 'var(--ink)';
    t.textContent = n.name;
    const v = svgEl('text', { x: tx, y: (n.y0 + n.y1) / 2, dy: '1.05em', 'font-size': 12 });
    v.style.fill = 'var(--muted)';
    v.textContent = `${kg(n.value, 0)} kg`;
    gNodes.append(t, v);
  }
  svg.append(gNodes);
  if (host.clientWidth < 640) svg.style.width = `${width}px`;
  host.classList.toggle('scroll-x', host.clientWidth < 640);
  host.replaceChildren(svg);

  // legend + table twin
  document.getElementById('sankey-legend').replaceChildren(
    ...[...(state.virgin ? [['var(--c-virgin)', 'Virgin, quota-backed']] : []), ['var(--c-recovered)', 'Recovered from registered equipment'], ['var(--c-quarantine)', 'Recovered < 180 days after a charge (tier C: never reclaimable or creditable)'], ['var(--c-reclaimed)', 'Reclaimed']]
      .map(([c, t]) => el('span', {}, el('i', { style: { background: c } }), t)),
  );
  const table = el('table', {},
    el('thead', {}, el('tr', {}, el('th', {}, 'From'), el('th', {}, 'To'), el('th', { class: 'r' }, 'kg'))),
    el('tbody', {}, ...graph.links.map((l) => el('tr', {}, el('td', {}, l.source.name), el('td', {}, l.target.name), el('td', { class: 'r num' }, kg(l.value, 1))))),
  );
  document.getElementById('sankey-table').replaceChildren(table);
}
const scope = document.getElementById('sankey-scope');
for (const [v, label] of [[false, 'Recovered kilograms'], [true, 'Include virgin supply']]) {
  scope.append(el('button', {
    'aria-pressed': String(v === state.virgin),
    onclick: (e) => {
      state.virgin = v;
      for (const b of scope.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      renderSankey();
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

// ------------------------------------------------------------------ rejections by rule
function renderRules() {
  const counts = d3.rollups(data.rejections, (v) => v.length, (r) => r.reason).sort((a, b) => b[1] - a[1]);
  const host = document.getElementById('rules');
  const width = Math.max(host.clientWidth, 320);
  const row = 34;
  const labelW = Math.min(250, width * 0.55);
  const height = counts.length * row + 4;
  const x = d3.scaleLinear().domain([0, d3.max(counts, (d) => d[1])]).range([0, width - labelW - 40]);
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Rejected attempts by rule' });
  counts.forEach(([reason, n], i) => {
    const [rule, what] = RULES[reason] ?? ['?', reason];
    const y = i * row;
    const g = svgEl('g', { tabindex: 0 });
    const hit = svgEl('rect', { x: 0, y, width, height: row, fill: 'transparent' });
    const a = svgEl('text', { x: 0, y: y + 14, 'font-size': 12, 'font-weight': 700 });
    a.style.fill = 'var(--ink)';
    a.textContent = `${rule}  ${reason}`;
    const b = svgEl('text', { x: 0, y: y + 28, 'font-size': 11.5 });
    b.style.fill = 'var(--muted)';
    b.textContent = what.length > 40 ? `${what.slice(0, 39)}…` : what;
    const w = Math.max(3, x(n));
    const bar = svgEl('path', { d: roundedBar(labelW, y + 8, w, 18) });
    bar.style.fill = 'var(--accent)';
    const v = svgEl('text', { x: labelW + w + 6, y: y + 21, 'font-size': 12.5, 'font-weight': 600 });
    v.style.fill = 'var(--ink)';
    v.textContent = n;
    g.append(hit, a, b, bar, v);
    const over = (e) => { bar.style.opacity = '0.8'; tip.show(e, () => [el('strong', {}, `${n} attempts`), el('div', {}, `${rule} · ${what}`)]); };
    const out = () => { bar.style.opacity = '1'; tip.hide(); };
    g.addEventListener('pointermove', over); g.addEventListener('pointerleave', out);
    g.addEventListener('focus', over); g.addEventListener('blur', out);
    svg.append(g);
  });
  host.replaceChildren(svg);

  const latest = [...data.rejections].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 6);
  document.getElementById('rejections').replaceChildren(
    el('thead', {}, el('tr', {}, el('th', {}, 'Date'), el('th', {}, 'Rule'), el('th', {}, 'Who tried'), el('th', {}, 'What'))),
    el('tbody', {}, ...latest.map((r) => el('tr', {},
      el('td', { class: 'num' }, r.t),
      el('td', {}, status('blocked', (RULES[r.reason] ?? ['?'])[0])),
      el('td', {}, el('span', { class: 'mono' }, r.actor ?? '')),
      el('td', { class: 'ink2' }, describeRejection(r)),
    ))),
  );
}
const roundedBar = (x, y, w, h) => {
  const r = Math.min(4, w / 2);
  return `M${x},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} H${x} Z`;
};
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
    default: return (RULES[r.reason] ?? [, r.reason])[1];
  }
}

// ------------------------------------------------------------------ AI queue
const aiFilter = document.getElementById('ai-filter');
for (const m of ['all', 'a', 'b', 'c']) {
  aiFilter.append(el('button', {
    'aria-pressed': String(m === state.ai),
    onclick: (e) => {
      state.ai = m;
      for (const b of aiFilter.children) b.setAttribute('aria-pressed', String(b === e.currentTarget));
      renderQueue();
    },
  }, m === 'all' ? 'All modules' : MODULES[m].name));
}
function renderQueue() {
  const items = [];
  for (const m of ['a', 'b', 'c']) {
    if (state.ai !== 'all' && state.ai !== m) continue;
    for (const f of data.ai[m].flags) items.push({ ...f, m });
  }
  const rank = { high: 0, review: 1, none: 2 };
  items.sort((a, b) => rank[a.severity] - rank[b.severity] || b.score - a.score);
  const q = document.getElementById('queue');
  q.replaceChildren(...items.map((f) => {
    const sev = f.severity === 'high' ? status('high', 'High') : f.severity === 'review' ? status('review', 'Review') : el('span', { class: 'status' }, el('span', { class: 'ico', style: { background: 'var(--axis)' } }, '·'), 'Watch');
    const meterColor = f.severity === 'high' ? 'var(--critical)' : f.severity === 'review' ? 'var(--warning)' : 'var(--axis)';
    const mod = data.ai[f.m];
    return el('details', { class: 'qitem' },
      el('summary', {},
        sev,
        el('span', {}, el('span', { class: 'who mono' }, f.actor), el('span', { class: 'muted' }, `  ${roleLabel(f.role)}`)),
        el('span', { style: { display: 'inline-flex', gap: '10px', alignItems: 'center' } },
          el('span', { class: 'chip' }, `Module ${MODULES[f.m].short}`),
          el('span', { class: 'meter', title: `score ${f.score}` }, el('b', { style: { width: `${Math.round(f.score * 100)}%`, background: meterColor } })),
          el('span', { class: 'num', style: { fontSize: '13px', fontWeight: 600, width: '34px', textAlign: 'right' } }, f.score.toFixed(2)),
        ),
        el('span', { class: 'why' }, f.reasons[0] ?? (f.severity === 'none' ? 'Below the flag threshold; kept on a watch list.' : '')),
      ),
      el('ul', {}, ...f.reasons.slice(1).map((r) => el('li', {}, r))),
      el('div', { class: 'meta' },
        el('div', {}, `Signals: ${f.signals.filter((s) => s.score > 0).map((s) => `${s.name} ${s.score.toFixed(2)}`).join(' · ') || 'none above zero'}`),
        el('div', {}, `${mod.model} ${mod.version} · model ${mod.modelHash.slice(0, 12)} · input ${mod.inputSnapshot.slice(0, 12)}`),
        ['SERVICE', 'RECLAIMER', 'DISTRIBUTOR'].includes(f.role)
          ? el('a', { href: `passport.html?actor=${encodeURIComponent(f.actor)}` }, 'Trace the lots this company handled →') : null,
      ),
    );
  }));
  const parts = ['a', 'b', 'c'].map((m) => `${MODULES[m].short}: ${data.ai[m].flags.filter((f) => f.severity !== 'none').length} of ${data.ai[m].assessed}`);
  document.getElementById('ai-meta').textContent = `Flagged for review (of entities assessed): ${parts.join(' · ')}. On held-out simulated runs, fraudsters who adapt are mostly missed, but adapting keeps them small. See the evaluation reports.`;
}

// ------------------------------------------------------------------ destruction events
function renderDestructions() {
  const rows = data.destructions.filter((d) => state.gas === 'all' || d.gas === state.gas).sort((a, b) => b.t.localeCompare(a.t));
  const shown = state.allDest ? rows : rows.slice(0, 8);
  document.getElementById('destructions').replaceChildren(
    el('thead', {}, el('tr', {},
      el('th', {}, 'Event'), el('th', {}, 'Date'), el('th', {}, 'Facility'), el('th', {}, 'Gas'), el('th', { class: 'r' }, 'kg'),
      el('th', { class: 'r' }, 'tCO₂e'), el('th', {}, 'Evidence'), el('th', {}, 'Verifier'), el('th', {}, 'Claim'))),
    el('tbody', {}, ...shown.map((d) => el('tr', {},
      el('td', { class: 'mono' }, `#${d.id}`),
      el('td', { class: 'num' }, d.t),
      el('td', { class: 'mono' }, d.facility),
      el('td', {}, d.gas),
      el('td', { class: 'r num' }, kg(d.grams, 2)),
      el('td', { class: 'r num' }, d.eligible ? fmt(d.tCO2e, 1) : '–'),
      el('td', {}, d.eligible ? el('span', { class: 'chip' }, `Tier ${d.tier}`) : el('span', { class: 'chip' }, 'Not creditable')),
      el('td', { class: 'mono ink2' }, d.verifier),
      el('td', {}, d.claimedBy
        ? el('span', {}, status('ok', d.claimedBy), d.blockedClaims.length ? el('div', { class: 'muted', style: { fontSize: '12px' } }, `${d.blockedClaims.length} other claim${d.blockedClaims.length > 1 ? 's' : ''} blocked`) : null)
        : d.eligible ? el('span', { class: 'muted' }, d.blockedClaims.length ? `unclaimed · ${d.blockedClaims.length} blocked` : 'unclaimed') : el('span', { class: 'muted' }, '–')),
    ))),
  );
  const btn = document.getElementById('more-dest');
  btn.textContent = state.allDest ? 'Show fewer' : `Show all ${rows.length} events`;
  btn.hidden = rows.length <= 8;
}
document.getElementById('more-dest').addEventListener('click', () => { state.allDest = !state.allDest; renderDestructions(); });

// ------------------------------------------------------------------ monthly trend
const SERIES = [
  ['recovered', 'Recovered', 'var(--c-recovered)'],
  ['reclaimed', 'Reclaimed', 'var(--c-reclaimed)'],
  ['destroyed', 'Destroyed', 'var(--ink-2)'],
];
function renderTrend() {
  const rows = data.monthly.map(({ m, byGas }) => {
    const pick = state.gas === 'all' ? Object.values(byGas) : [byGas[state.gas] ?? {}];
    const o = { m, date: new Date(`${m}-01T00:00:00Z`) };
    for (const [k] of SERIES) o[k] = pick.reduce((a, g) => a + (g[k] ?? 0), 0) / 1000;
    return o;
  });
  const host = document.getElementById('trend');
  const width = Math.max(host.clientWidth, 480);
  const height = 260;
  const m = { top: 12, right: 92, bottom: 26, left: 44 };
  const x = d3.scaleUtc().domain(d3.extent(rows, (d) => d.date)).range([m.left, width - m.right]);
  const y = d3.scaleLinear().domain([0, d3.max(rows, (d) => Math.max(...SERIES.map(([k]) => d[k])))]).nice().range([height - m.bottom, m.top]);
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Monthly kilograms recovered, reclaimed and destroyed' });
  for (const t of y.ticks(4)) {
    const ln = svgEl('line', { x1: m.left, x2: width - m.right, y1: y(t), y2: y(t) });
    ln.style.stroke = t === 0 ? 'var(--axis)' : 'var(--grid)';
    const lb = svgEl('text', { x: m.left - 8, y: y(t), dy: '0.32em', 'text-anchor': 'end', 'font-size': 11.5, class: 'num' });
    lb.style.fill = 'var(--muted)';
    lb.textContent = compact(t);
    svg.append(ln, lb);
  }
  for (const t of x.ticks(width < 700 ? 4 : 8)) {
    const lb = svgEl('text', { x: x(t), y: height - 6, 'text-anchor': 'middle', 'font-size': 11.5 });
    lb.style.fill = 'var(--muted)';
    lb.textContent = d3.utcFormat('%b %Y')(t);
    svg.append(lb);
  }
  const yl = svgEl('text', { x: m.left - 8, y: m.top - 2, 'text-anchor': 'end', 'font-size': 11 });
  yl.style.fill = 'var(--muted)';
  yl.textContent = 'kg';
  svg.append(yl);
  const line = d3.line().x((d) => x(d.date)).curve(d3.curveLinear);
  const last = rows.at(-1);
  for (const [k, name, color] of SERIES) {
    const p = svgEl('path', { d: line.y((d) => y(d[k]))(rows), fill: 'none', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    p.style.stroke = color;
    const end = svgEl('circle', { cx: x(last.date), cy: y(last[k]), r: 4, 'stroke-width': 2 });
    end.style.fill = color; end.style.stroke = 'var(--surface)';
    svg.append(p, end);
  }
  // end labels with leader spacing
  const ends = SERIES.map(([k, name]) => ({ k, name, y: y(last[k]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 15);
  for (const e of ends) {
    const t = svgEl('text', { x: width - m.right + 10, y: e.y, dy: '0.32em', 'font-size': 12 });
    t.style.fill = 'var(--ink-2)';
    t.textContent = e.name;
    svg.append(t);
  }
  // crosshair
  const cross = svgEl('line', { y1: m.top, y2: height - m.bottom, visibility: 'hidden' });
  cross.style.stroke = 'var(--axis)';
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

// ------------------------------------------------------------------ live chain panel
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
    pill.replaceChildren(el('span', { class: 'dot' }), 'live · OP Sepolia');
    box.replaceChildren(
      el('div', { class: 'grid cols-2' },
        el('dl', { class: 'kv' },
          el('dt', {}, 'Lots on chain'), el('dd', { class: 'num' }, String(o.lotCount)),
          el('dt', {}, 'R-404A minted'), el('dd', { class: 'num' }, `${kg(Number(t.virginMinted), 1)} kg`),
          el('dt', {}, 'R-404A recovered'), el('dd', { class: 'num' }, `${kg(Number(t.recovered), 1)} kg`),
          el('dt', {}, 'R-404A charged'), el('dd', { class: 'num' }, `${kg(Number(t.charged), 1)} kg`),
          el('dt', {}, 'R-404A destroyed'), el('dd', { class: 'num' }, `${kg(Number(t.destroyed), 1)} kg`),
          el('dt', {}, 'Still live'), el('dd', { class: 'num' }, `${kg(Number(t.live), 1)} kg`),
          el('dt', {}, 'Balance'), el('dd', {}, Number(t.virginMinted) + Number(t.unknownDeclared) + Number(t.recovered) === Number(t.live) + Number(t.charged) + Number(t.destroyed) + Number(t.reclaimLoss) + Number(t.handlingLoss)
            ? checkMark('minted + recovered = live + charged + destroyed + losses') : status('high', 'does not balance')),
          el('dt', {}, 'AI flags on chain'), el('dd', {}, o.flagCount ? String(o.flagCount) : el('span', { class: 'muted' }, '0 (write-back from the AI is the next step)')),
        ),
        el('div', {},
          ...evs.map(({ i, e, facility, claimer }) => el('div', { class: 'note', style: { marginBottom: '10px' } },
            el('div', {}, el('strong', {}, `Destruction event #${i}`), ` · ${kg(Number(e.grams), 1)} kg ${'R-404A'} · DRE ${(e.dreBps / 100).toFixed(2)}% · ${facility}`),
            el('div', { style: { marginTop: '4px' } }, claimer ? status('ok', `claimed once, by ${claimer}`) : 'unclaimed'),
          )),
          el('div', { style: { display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '13.5px' } },
            el('a', { href: 'passport.html?source=chain&lot=6' }, 'Passport of the reclaimed lot on chain →'),
            ...Object.entries(o.info.contracts).slice(0, 3).map(([n, a]) => el('a', { href: `${ex}/address/${a}#code`, target: '_blank', rel: 'noopener' }, `${n} ↗`)),
          ),
        ),
      ),
    );
  } catch (err) {
    pill.replaceChildren(el('span', { class: 'dot' }), 'offline');
    box.replaceChildren(el('p', { class: 'muted' }, `Could not reach OP Sepolia from this browser (${err.shortMessage ?? err.message}). The contract addresses are in the README.`));
  }
}

// ------------------------------------------------------------------ end-of-life closure
function renderClosure() {
  const c = data.closure;
  const units = c.units.filter((u) => state.gas === 'all' || u.gas === state.gas);
  const by = (s) => units.filter((u) => u.status === s);
  const gap = by('no_record');
  const low = gap.reduce((a, u) => a + u.low, 0);
  const high = gap.reduce((a, u) => a + u.high, 0);
  const t = (k) => gap.reduce((a, u) => a + (u[k] / 1e6) * data.meta.gwp[u.gas], 0);
  const decided = Math.max(units.length - by('pending').length, 1);
  const top = [...gap].sort((a, b) => b.high - a.high).slice(0, 6);
  document.getElementById('closure').replaceChildren(
    el('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' } },
      tile('Registered units removed', fmt(units.length), 'units', `${by('recovered').length} with a recovery on the ledger · ${by('pending').length} pending`),
      tile('Removed with no recovery record', fmt(gap.length), 'units', `${Math.round((100 * gap.length) / decided)}% of decided removals`),
      tile('Refrigerant unaccounted for', `${kg(low, 0)}–${kg(high, 0)}`, 'kg', `${fmt(t('low'), 0)}–${fmt(t('high'), 0)} tCO₂e, probably vented`),
    ),
    el('div', { class: 'table-wrap', style: { marginTop: '12px' } }, el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, 'Unit'), el('th', {}, 'Type'), el('th', {}, 'Gas'), el('th', {}, 'Removed'), el('th', {}, 'Serviced by'), el('th', { class: 'r' }, 'Nameplate kg'), el('th', { class: 'r' }, 'Likely unaccounted kg'))),
      el('tbody', {}, ...top.map((u) => el('tr', {},
        el('td', { class: 'mono' }, u.id), el('td', {}, u.category.replaceAll('_', ' ')), el('td', {}, u.gas), el('td', { class: 'num' }, u.removed),
        el('td', { class: 'mono' }, u.service), el('td', { class: 'r num' }, kg(u.nameplate, 1)), el('td', { class: 'r num' }, `${kg(u.low, 1)}–${kg(u.high, 1)}`),
      ))),
    )),
    el('p', { class: 'muted', style: { fontSize: '12.5px', marginTop: '10px' } },
      `Largest six shown. ${c.companies.length ? `${c.companies.length} service compan${c.companies.length > 1 ? 'ies stand' : 'y stands'} out against the others.` : `No service company stands out against the others (${c.companiesAssessed} compared).`} `
      + 'The estimate is the nameplate charge times the IPCC 2006 range of charge still in a unit of that kind at end of life (Table 7.9). Units below the national registration threshold are invisible here until someone recovers them.'),
  );
}

// ------------------------------------------------------------------ render
function render() {
  tiles();
  renderSankey();
  renderClosure();
  renderRules();
  renderQueue();
  renderDestructions();
  renderTrend();
}
render();
renderLive();
let rt;
window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { renderSankey(); renderRules(); renderTrend(); }, 150); });
