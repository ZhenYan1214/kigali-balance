#!/usr/bin/env node
// Usage: node run.mjs [--seed 42] [--months 36] [--out out]
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulate } from './src/simulate.mjs';
import { validate, summarize } from './src/validate.mjs';
import { writeOutputs } from './src/io.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const params = JSON.parse(readFileSync(join(here, 'params.json'), 'utf8'));
const overrides = {};
if (args.seed) overrides.seed = Number(args.seed);
if (args.months) overrides.months = Number(args.months);
const outDir = resolve(here, args.out ?? 'out');

const started = Date.now();
const result = simulate(params, overrides);
const validation = validate(result); // throws if any self-check fails
const summary = summarize(result, validation);
writeOutputs(outDir, result, summary);

console.log(`Simulated ${summary.period.start} → ${summary.period.end} (seed ${summary.seed}) in ${Date.now() - started} ms`);
console.log(`Events: ${result.observations.events.length} · registered units: ${summary.registeredEquipment} · invoices: ${result.observations.invoices.length}`);
console.log('Self-checks: physical balance, ledger identity, rule conformity — OK');
console.log('Calibration:', JSON.stringify(summary.calibration));
console.log('Rejected attempts:', JSON.stringify(summary.rejectedByReason));
console.log(`Destruction events: ${summary.destruction.events} (eligible ${summary.destruction.creditEligible}, claimed ${summary.destruction.claimed}, ${summary.destruction.claimedTco2e} tCO2e)`);
console.log(`Outputs written to ${outDir}`);
