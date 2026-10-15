import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function writeOutputs(dir, result, summary) {
  mkdirSync(dir, { recursive: true });
  const { observations, truth } = result;

  // what the system (and the AI) can see
  writeFileSync(join(dir, 'actors.csv'), toCsv(observations.actors));
  writeFileSync(join(dir, 'equipment.csv'), toCsv(observations.equipment));
  writeFileSync(join(dir, 'invoices.csv'), toCsv(observations.invoices));
  writeFileSync(join(dir, 'ledger_events.jsonl'), observations.events.map((e) => JSON.stringify(e)).join('\n') + '\n');

  // evaluation only — never an input to the AI modules
  writeFileSync(join(dir, 'ground_truth.json'), JSON.stringify(truth, null, 2));
  writeFileSync(join(dir, 'summary.json'), JSON.stringify(summary, null, 2));
}

export function toCsv(rows) {
  if (rows.length === 0) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}
