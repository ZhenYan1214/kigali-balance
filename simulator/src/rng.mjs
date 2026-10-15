// Deterministic pseudo-random numbers (mulberry32) so every run with the same seed is identical.

export class Rng {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  /** Uniform float in [0, 1). */
  next() {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  uniform(min, max) {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max] inclusive. */
  int(min, max) {
    return Math.floor(this.uniform(min, max + 1));
  }

  /** Normal draw (Box–Muller). */
  normal(mean = 0, sd = 1) {
    const u = 1 - this.next(); // (0, 1]
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  chance(p) {
    return this.next() < p;
  }

  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Pick a key from { key: weight } proportionally. */
  weighted(weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [k, w] of entries) {
      if ((r -= w) < 0) return k;
    }
    return entries[entries.length - 1][0];
  }

  /** Fisher–Yates shuffle (returns a new array). */
  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
