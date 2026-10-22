// Shared helpers for the dashboard and the provenance passport.
import { icon } from './icons.js';

export { icon };

export const CLASS = {
  virgin: { label: 'Virgin · quota-backed', color: 'var(--c-virgin)' },
  recoveredA: { label: 'Recovered · Tier A', color: 'var(--c-recovered)' },
  recoveredB: { label: 'Recovered · Tier B', color: 'var(--c-recovered)' },
  recoveredC: { label: 'Recovered < 180 days · tier C', color: 'var(--c-quarantine)' },
  reclaimed: { label: 'Reclaimed', color: 'var(--c-reclaimed)' },
};

export const RULES = {
  QuotaExceeded: ['R1', 'Minting beyond the quota document'],
  NotUnitOwner: ['R3', 'Recovery without the unit owner\'s co-signature'],
  OwnerNotIndependent: ['R3', 'Owner co-signature from the service company itself'],
  RecoveryExceedsContent: ['R3', 'Recovering more than the unit could still hold'],
  RecoveryCapExceeded: ['R3', 'Lifetime recovery above one charge plus top-ups'],
  TierBMonthlyCapExceeded: ['R3', 'Tier B recoveries above the monthly cap'],
  ServiceNotAuthorized: ['R3', 'Charging a unit the company does not service'],
  CylinderInUse: ['CYL', 'A second open lot in the same cylinder'],
  ReclaimExceedsInput: ['R4', 'Reclaimed output above input minus losses'],
  ClassNotReclaimable: ['R5', 'Virgin or unknown gas fed into reclamation'],
  TierNotReclaimable: ['R5', 'Quarantined (tier C) gas fed into reclamation'],
  NotVerifier: ['R6', 'Destruction without an independent verifier'],
  VerifierNotIndependent: ['R6', 'Destruction certified by the destroyer itself'],
  AlreadyClaimed: ['R7', 'A second registry claiming the same destruction'],
  TierNotAccepted: ['R7', 'Registry policy: evidence tier below what it accepts'],
  NotDesignated: ['R7', 'A registry claiming an event designated to another'],
};

export const MODULES = {
  a: { name: 'A · Leakage gap', short: 'A', q: 'Are recorded top-ups plausible for the fleet?' },
  b: { name: 'B · Mass balance', short: 'B', q: 'Do sales and yields match documented inflows?' },
  c: { name: 'C · Recovery plausibility', short: 'C', q: 'Do recoveries match the registered units?' },
};

const ROLE = {
  IMPORTER: 'Importer', DISTRIBUTOR: 'Distributor', SERVICE: 'Service company', RECLAIMER: 'Reclaimer',
  DESTRUCTION: 'Destruction facility', REGISTRY: 'Carbon registry', OWNER: 'Equipment owner', TAKEBACK: 'Take-back point',
  VERIFIER: 'Verifier', LAB: 'Lab', 'CO-SIGNER': 'Take-back point',
};
export const roleLabel = (r) => ROLE[r] ?? (r ? r[0] + r.slice(1).toLowerCase() : '');

export const kg = (g, digits) => {
  const v = g / 1000;
  const d = digits ?? (Math.abs(v) >= 100 ? 0 : 1);
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
export const compact = (n) => (Math.abs(n) >= 1000 ? `${(n / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K` : n.toLocaleString('en-US', { maximumFractionDigits: 0 }));
export const fmt = (n, d = 0) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Build a DOM node. Text is always set with textContent (labels are data, never markup). */
export function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'style' && typeof v === 'object') {
      for (const [prop, val] of Object.entries(v)) {
        if (prop.startsWith('--')) n.style.setProperty(prop, val);
        else n.style[prop] = val;
      }
    }
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return n;
}

export const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
  return n;
};

export function status(kind, text) {
  const ico = { high: 'alert', review: 'alert', ok: 'check', blocked: 'reject', watch: 'dot' }[kind] ?? 'dot';
  return el('span', { class: `status ${kind}` }, icon(ico, { size: 15 }), text);
}

export function checkMark(text) {
  return el('span', { class: 'status ok' }, icon('check', { size: 15 }), text);
}

export const GAS_COLOR = { 'R-404A': 'var(--g-404a)', 'R-134a': 'var(--g-134a)', 'R-410A': 'var(--g-410a)' };
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Count a number up once, keeping the final text exact (`format` turns the number into text). */
export function countUp(node, value, format, ms = 900) {
  if (reducedMotion() || !value) { node.textContent = format(value); return; }
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / ms);
    const e = 1 - (1 - p) ** 3;
    node.textContent = format(p < 1 ? value * e : value);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/** Fade sections in as they scroll into view (no-op when motion is reduced). */
export function reveal(selector = '.reveal') {
  const items = document.querySelectorAll(selector);
  if (reducedMotion() || !('IntersectionObserver' in window)) { items.forEach((n) => n.classList.add('in')); return; }
  document.documentElement.classList.add('js-reveal');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((n) => io.observe(n));
}

/** Highlight the table-of-contents entry of the section in view. */
export function scrollSpy(tocSelector = '.toc a') {
  const links = [...document.querySelectorAll(tocSelector)];
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((a) => a.classList.remove('on'));
      map.get(e.target.id)?.classList.add('on');
    }
  }, { rootMargin: '-35% 0px -60% 0px' });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
}

// ---------------------------------------------------------------- tooltip (one per page)
let tip;
export function tooltip() {
  if (!tip) {
    tip = el('div', { class: 'tooltip', role: 'status' });
    document.body.append(tip);
  }
  return {
    show(evt, build) {
      tip.replaceChildren(...build());
      tip.classList.add('on');
      this.move(evt);
    },
    move(evt) {
      const x = evt.clientX ?? evt.target.getBoundingClientRect().right;
      const y = evt.clientY ?? evt.target.getBoundingClientRect().top;
      const w = tip.offsetWidth;
      tip.style.left = `${Math.min(x + 14, window.innerWidth - w - 8)}px`;
      tip.style.top = `${y + 14}px`;
    },
    hide() { tip.classList.remove('on'); },
  };
}

// ---------------------------------------------------------------- page chrome
function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}

export function chrome(active) {
  const saved = (() => { try { return localStorage.getItem('kb-theme'); } catch { return null; } })();
  if (saved) document.documentElement.dataset.theme = saved;
  const toggle = el('button', { class: 'tool', type: 'button' });
  const paint = () => {
    const dark = isDark();
    toggle.replaceChildren(icon(dark ? 'sun' : 'moon', { size: 17 }));
    toggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    toggle.title = toggle.getAttribute('aria-label');
  };
  toggle.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('kb-theme', next); } catch { /* storage unavailable */ }
    paint();
    window.dispatchEvent(new Event('themechange'));
  });
  paint();

  const strip = el('div', { class: 'strip', role: 'note' }, el('div', { class: 'strip-inner' },
    el('span', {}, el('b', {}, 'Simulated data'), ' · seed 42 · no real company'),
    el('span', { class: 'hide-s' }, 'Contracts deployed and verified on ', el('b', {}, 'OP Sepolia')),
    el('span', { class: 'hide-s' }, 'IEEE ClimateChain 2026 · Track 3'),
  ));
  const nav = el('nav', { class: 'nav', 'aria-label': 'Pages' },
    el('a', { href: 'index.html', 'aria-current': active === 'dashboard' ? 'page' : null }, el('span', { class: 'full' }, 'Regulator dashboard'), el('span', { class: 'short' }, 'Dashboard')),
    el('a', { href: 'passport.html', 'aria-current': active === 'passport' ? 'page' : null }, el('span', { class: 'full' }, 'Provenance passport'), el('span', { class: 'short' }, 'Passport')),
  );
  const bar = el('header', { class: 'masthead' }, el('div', { class: 'masthead-inner' },
    el('a', { class: 'brand', href: 'index.html', 'aria-label': 'Kigali Balance, home' }, el('img', { src: 'assets/logo.svg', alt: '' }), el('b', {}, 'Kigali Balance')),
    nav,
    el('div', { class: 'spacer' }),
    el('a', { class: 'tool', href: 'https://github.com/ZhenYan1214/kigali-balance', title: 'Source code', 'aria-label': 'Source code on GitHub' }, icon('source', { size: 17 })),
    toggle,
  ));
  document.body.prepend(strip, bar);
  document.body.append(el('footer', { class: 'page-foot' },
    el('p', {}, 'Every number on these pages comes from a simulated market (seed 42) or from the demo contracts on the OP Sepolia testnet. The pages read only what a regulator could observe: ledger events, the equipment register and the AI flags. The simulator’s ground truth is used to evaluate the AI elsewhere and never appears here.'),
    el('p', {}, el('a', { href: 'https://github.com/ZhenYan1214/kigali-balance' }, 'Source, tests and reports'), ' · MIT licence'),
  ));
}

let bundle;
export async function loadSim() {
  bundle ??= fetch('data/sim.json').then((r) => {
    if (!r.ok) throw new Error(`data/sim.json: ${r.status}`);
    return r.json();
  });
  return bundle;
}

export const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
