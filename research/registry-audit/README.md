# Registry audit dataset (ODS / HFC destruction credits)

Public records of carbon-credit projects that destroy ozone-depleting substances (ODS) or HFCs, or reclaim HFCs, collected on 2026-10-16 from ACR, the Climate Action Reserve (CAR), Verra, the California ARB issuance table, Isometric, Gold Standard and one CDM page. The findings are written up in [`docs/research/03-registry-audit.md`](../../docs/research/03-registry-audit.md).

Rebuild the summary tables:

```bash
python research/registry-audit/build_summary.py
```

It uses the standard library only and writes `summary.md`. Every row in every CSV carries a `source_url` and an `accessed` date.

## Files

| file | rows | one row is |
|---|---|---|
| `projects.csv` | 436 | a project record in one registry (ACR 281, CAR 145, Verra 10) |
| `issuances.csv` | 789 | an issuance or reporting period in one ledger (CAR 190, ACR 291, ARB 302, Verra 5, CDM 1 crediting period) |
| `cod_identifiers.csv` | 230 | a certificate-of-destruction identifier that is publicly visible (CAR CoD report 170; ACR document titles 58; ACR CoDs read in full 2) |
| `public_fields.csv` | 34 | one field for one registry/programme: is it public, and the evidence |
| `summary.md` | n/a | output of `build_summary.py` |

Key columns:

- `facility_key` is a location-derived name for the destruction facility. `facility_basis` says where it came from: the site location field, the project description, the CAR CoD report, or an inference. Treat it as a grouping key, not a legal name.
- `credits_issued` is in each registry's own units. For CAR it is the sum of the issuance rows; for ACR it is the registry's `issuedCredits`; for Verra it is the length of each serial range. ARB credits are kept in `issuances.csv` only (`ledger=ARB`), because ARB issues them after the registry retires the matching registry credits.
- `other_program_flag` holds the registry's own self-declaration field, where one exists.
- `cod_ids_public` is `yes` (CAR structured report), `CoD document(s) public` (ACR PDF posted), `no`, or `not assessed`.

## How the data was collected

Everything came from public pages or the JSON those pages load in a browser. Nothing required a login and no form was submitted.

- ACR (ICE GreenTrace): `POST /api/greentraceservice/v1/project/registry/ACR_REGISTRY/project-summaries/results` lists all 1,009 projects. `GET .../project/{key}` gives site, crediting period, the `hasAnotherCarbonProgram` flag and the public document list. `POST /api/greentraceservice/v1/credit/registry/ACR_REGISTRY/holding-summaries/results` gives issuances. Scope is the 204 ODS projects plus the 77 certified-reclaimed-HFC projects. The 62 "Advanced Refrigeration Systems" projects and 1 gas-substitution project are out of scope. The API rate-limits scripted clients, so the details were read through the page itself.
- CAR (APX): public report `myrpt.asp?r=111` (1,294 projects, 145 ODS). For each ODS project: `prjView.asp`, `TabProjectEmissions.asp` and `TabDocuments.asp`. Plus the public report `myrpt.asp?r=210` ("ODS Projects' Certificates of Destruction").
- Verra (S&P Global registry): the project search and issuance search APIs behind `registry.verra.org/verra/public/program/VCS`, filtered to VM0016 and AM0001. The project document list was read for project 5089 only, because the detail endpoint rate-limited.
- ARB: `nc-arboc_issuance.xlsx`, updated 2026-10-14 and downloaded with the user's approval, sheet "ARB Offset Credit Issuance", rows with Project Type = ODS. Only derived rows are stored here, not the file.
- Isometric registry projects page; Gold Standard public project API (keyword search); UNFCCC CDM project 1947 page.
- Three PDFs were read in full, with the user's approval: the OPDR of CAR1458 and the CoDs posted for ACR1231 and ACR1245. Personal names and contact details in them are not reproduced.

## Known gaps

- The CoD numbers shown for ACR come from document titles, except for the 2 CoDs read in full. Four ACR document lists were truncated at capture, so a few titles may be missing.
- Verra document lists and the contents of monitoring and verification reports were not read, apart from the titles for project 5089.
- `facility_key` is derived from free text. In two ACR records (ACR0432, ACR0445) the site field and the description name different facilities; the description wins.
