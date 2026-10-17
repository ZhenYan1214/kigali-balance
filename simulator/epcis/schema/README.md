# Official GS1 EPCIS 2.0 artifacts (unmodified copies, used as data only)

| File | Source URL | Version | SHA-256 | Accessed |
|---|---|---|---|---|
| `epcis-json-schema.json` | https://ref.gs1.org/standards/epcis/2.0.1/epcis-json-schema.json | EPCIS 2.0.1 (`$id` …/2.0.1/epcis-json-schema.json, JSON Schema draft-07) | `0f46ff694efffd8d8ce840a33dfde84228add11b516b8b258f3200740ae210af` | 2026-10-17 |
| `epcis-context.jsonld` | https://ref.gs1.org/standards/epcis/2.0.1/epcis-context.jsonld | EPCIS 2.0.1 JSON-LD context | `5056c65f991425b1d3a35e35edf4f7d0c7ff56cf688c2912b930f93494713737` | 2026-10-17 |

Notes:

- `https://ref.gs1.org/standards/epcis/epcis-json-schema.json` and the `/2.0.0/` path return the same bytes as `/2.0.1/` (checked on 2026-10-17).
- The development copy in the GS1 GitHub repository (https://github.com/gs1/EPCIS, `master` at commit `6f71468231838e424bb5dfa836e006e8dc69615c`, 2026-09-04, file `EPCIS-JSON-Schema.json`) differs: it has `$id` `https://gs1.github.io/EPCIS/EPCIS-JSON-Schema.json` and its definitions are reorganised (about 1,700 changed lines in a plain diff). We validate against the published ref.gs1.org schema, not the development branch.
- The 2.0.0 context differs from 2.0.1 only in the `gs1:` prefix (`https://gs1.org/voc/` vs `https://ref.gs1.org/voc/`).
- `simulator/test/epcis.test.mjs` checks the schema's SHA-256, so an accidental edit fails the tests.
