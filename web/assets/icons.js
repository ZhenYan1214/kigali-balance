// A small icon set drawn for this domain: 24 px grid, 1.6 px stroke, currentColor.
// Each entry is the inner SVG markup; `icon(name)` returns an element ready to append.

const P = {
  cylinder: '<path d="M10 5.5V3.5h4v2"/><path d="M12 3.5V2"/><rect x="7" y="5.5" width="10" height="16" rx="3.5"/><path d="M7 13h10"/>',
  unit: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9.5" cy="12" r="3.6"/><path d="M9.5 8.4v7.2M5.9 12h7.2"/><path d="M16 9h2.5M16 12h2.5M16 15h2.5"/>',
  scale: '<path d="M4 20.5h16"/><path d="M6 20.5 7.5 12h9l1.5 8.5"/><rect x="5" y="9" width="14" height="3" rx="1"/><path d="M9 9V6.5h6V9"/>',
  flask: '<path d="M9 3h6"/><path d="M10 3v6.2L5.2 17.6A1.6 1.6 0 0 0 6.6 20h10.8a1.6 1.6 0 0 0 1.4-2.4L14 9.2V3"/><path d="M7.8 14h8.4"/>',
  flame: '<path d="M12 21a6 6 0 0 0 6-6c0-4.2-3.4-6.4-4.6-10-1.9 2-2.4 4.3-2.1 6.2C10 10.4 9.4 9.3 9.2 8 7.4 9.6 6 11.9 6 15a6 6 0 0 0 6 6Z"/><path d="M12 21a2.6 2.6 0 0 0 2.6-2.6c0-1.8-1.5-2.6-2.6-4.2-1.1 1.6-2.6 2.4-2.6 4.2A2.6 2.6 0 0 0 12 21Z"/>',
  stamp: '<path d="M9.2 13.5V9.8a2.8 2.8 0 1 1 5.6 0v3.7"/><path d="M5 13.5h14v3.5H5z"/><path d="M6.5 20.5h11"/>',
  reject: '<path d="M12 3 19 5.8v5.7c0 4.4-2.9 7.6-7 9.5-4.1-1.9-7-5.1-7-9.5V5.8Z"/><path d="m9.5 9.5 5 5M14.5 9.5l-5 5"/>',
  review: '<circle cx="10.5" cy="10.5" r="6"/><path d="m20 20-5.2-5.2"/><path d="M10.5 7.8v3M10.5 13.1v.1"/>',
  chain: '<path d="M10 14a4.2 4.2 0 0 0 6 .2l3-3a4.2 4.2 0 0 0-6-6l-1.6 1.6"/><path d="M14 10a4.2 4.2 0 0 0-6-.2l-3 3a4.2 4.2 0 0 0 6 6l1.6-1.6"/>',
  balance: '<path d="M12 4v16M7.5 20h9"/><path d="M5 7.5h14"/><path d="M5 7.5 2.5 13a2.6 2.6 0 0 0 5 0Z"/><path d="M19 7.5 16.5 13a2.6 2.6 0 0 0 5 0Z"/>',
  check: '<path d="m5 12.6 4.4 4.4L19 7.5"/>',
  alert: '<path d="M12 4 21 19.5H3Z"/><path d="M12 10v4.2M12 16.8v.1"/>',
  dot: '<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10Z"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  source: '<path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.2 5.5l-2.4 13"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 19.5h15"/>',
  tag: '<path d="M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8a1.4 1.4 0 0 1 0 2l-7 7a1.4 1.4 0 0 1-2 0Z"/><circle cx="8" cy="8" r="1.5"/>',
  arrow: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
  vent: '<path d="M4 9c2.5-2 5-2 7.5 0s5 2 8.5 0"/><path d="M4 14c2.5-2 5-2 7.5 0s5 2 8.5 0"/><path d="M4 19c2.5-2 5-2 7.5 0s5 2 8.5 0" opacity=".45"/>',
  trend: '<path d="M3.5 19.5h17"/><path d="m4.5 15.5 4.5-5 3.5 3 6.5-7.5"/>',
};

export function icon(name, { size = 18, title } = {}) {
  const ns = 'http://www.w3.org/2000/svg';
  const s = document.createElementNS(ns, 'svg');
  s.setAttribute('viewBox', '0 0 24 24');
  s.setAttribute('width', size);
  s.setAttribute('height', size);
  s.setAttribute('fill', 'none');
  s.setAttribute('stroke', 'currentColor');
  s.setAttribute('stroke-width', '1.6');
  s.setAttribute('stroke-linecap', 'round');
  s.setAttribute('stroke-linejoin', 'round');
  s.setAttribute('class', `ico ico-${name}`);
  if (title) {
    s.setAttribute('role', 'img');
    s.setAttribute('aria-label', title);
  } else {
    s.setAttribute('aria-hidden', 'true');
  }
  s.innerHTML = P[name] ?? '';
  return s;
}
