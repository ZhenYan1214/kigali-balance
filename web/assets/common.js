// Shared helpers for the dashboard and the provenance passport.

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
  CylinderInUse: ['M1', 'A second open lot in the same cylinder'],
  ReclaimExceedsInput: ['R4', 'Reclaimed output above input minus losses'],
  ClassNotReclaimable: ['R5', 'Virgin or unknown gas fed into reclamation'],
  TierNotReclaimable: ['R5', 'Quarantined (tier C) gas fed into reclamation'],
  NotVerifier: ['R6', 'Destruction without an independent verifier'],
  VerifierNotIndependent: ['R6', 'Destruction certified by the destroyer itself'],
  AlreadyClaimed: ['R7', 'A second registry claiming the same destruction'],
  TierNotAccepted: ['R7', 'Registry policy: evidence tier below what it accepts'],
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
    else if (k === 'style' && typeof v === 'object') Object.assign(n.style, v);
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
  const ico = { high: '!', review: '!', ok: '✓', blocked: '×' }[kind] ?? '·';
  return el('span', { class: `status ${kind}` }, el('span', { class: 'ico', 'aria-hidden': 'true' }, ico), text);
}

export function checkMark(text) {
  const s = el('span', { class: 'check' });
  s.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="currentColor" opacity="0.15"/><path d="M4.5 8.2l2.2 2.2 4.8-4.9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  s.append(text);
  return s;
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
export function chrome(active) {
  const saved = (() => { try { return localStorage.getItem('kb-theme'); } catch { return null; } })();
  if (saved) document.documentElement.dataset.theme = saved;
  const toggle = el('button', {
    class: 'icon-btn', title: 'Switch light / dark', 'aria-label': 'Switch light or dark theme',
    onclick: () => {
      const dark = document.documentElement.dataset.theme
        ? document.documentElement.dataset.theme === 'dark'
        : matchMedia('(prefers-color-scheme: dark)').matches;
      const next = dark ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('kb-theme', next); } catch { /* storage unavailable */ }
      window.dispatchEvent(new Event('themechange'));
    },
  }, '◐');
  const nav = el('nav', { class: 'nav' },
    el('a', { href: 'index.html', 'aria-current': active === 'dashboard' ? 'page' : null }, el('span', { class: 'full' }, 'Regulator dashboard'), el('span', { class: 'short' }, 'Dashboard')),
    el('a', { href: 'passport.html', 'aria-current': active === 'passport' ? 'page' : null }, el('span', { class: 'full' }, 'Provenance passport'), el('span', { class: 'short' }, 'Passport')),
  );
  const bar = el('header', { class: 'topbar' }, el('div', { class: 'topbar-inner' },
    el('a', { class: 'brand', href: 'index.html' }, el('img', { src: 'assets/logo.svg', alt: '' }), el('span', {}, 'Kigali Balance')),
    nav,
    el('div', { class: 'spacer' }),
    el('span', { class: 'pill', title: 'Every number on these pages comes from simulated data' }, el('span', { class: 'dot' }), 'Simulated data'),
    el('a', { class: 'icon-btn gh', href: 'https://github.com/ZhenYan1214/kigali-balance', title: 'Source on GitHub', 'aria-label': 'Source on GitHub' }, '↗'),
    toggle,
  ));
  document.body.prepend(bar);
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
