# Milestone 12 — Live Google Sheets Integration

**Status:** Implemented (pending commit)
**Date:** 22 July 2026

## Why

Milestones 8–11 built a complete CPD directory on a static PUBLIC fixture.
Production must read the live PHC Public CPD Google Sheet so published courses
appear automatically without code changes.

## Objective

Replace the fixture datasource with the published Google Sheets CSV while
keeping search, filtering, display modes, and presentation unchanged.

## Architecture

```text
Published Google Sheets CSV
  → Data Source (fetchPublic)
  → transport validation
  → CPD mapper (skip unpublished / incomplete rows)
  → Catalog → Search → Category filter
  → Filtered dataset → Renderer (unchanged)
```

Presentation, search, taxonomy, and view modes remain datasource-independent.

## Datasource

- Default PUBLIC source: published Sheets CSV in
  `src/config/phc-public-cpd.js`
- Acquisition: `src/data/source.js` via existing `fetchPublic` seam
- CSV parsing: `src/data/parse-csv.js` (handles section-banner header rows)
- URL helper: `src/data/google-sheets.js` (leaves `/pub?output=csv` URLs intact)
- Optional last-good cache: `src/data/cache.js` (browser `localStorage`)
- Hosts may still override with `start({ publicSource })`

Production URL:

`https://docs.google.com/spreadsheets/d/e/2PACX-1vRBPgalMWq6fNZXfT-FhP-U-ais1GIT2Cx6gtUOX4eWlaaaZCioon8YoeNQDnxhtsCeQpDpO5PRoCWD/pub?gid=0&single=true&output=csv`

## Mapping

Existing PUBLIC → CPD mapper reused.

Additions / normalizations:

- Optional `Unterrichtssprache` → `course.languages`
- Optional `Veröffentlicht` / `Published` / `Freigegeben` publication flag
- German / multi-value next-start cells coerced to ISO when possible
- Bare domains and Google Drive file links normalized to usable URLs
- Missing optional fields (logo, image, QR, language, start date) tolerated

## Validation

- Unpublished rows are excluded before catalog creation
- Incomplete rows (missing id / title / provider) are skipped
- Invalid CPD hours become `null` instead of failing the load
- Unknown primary categories still display and remain non-filterable (M10)

## Error handling

- Friendly load failure message when the sheet cannot be fetched
- If a previous successful payload is cached, it is reused
- No blank page: lifecycle error state remains available

## Performance

- Sheet is fetched once per session start
- Rendering stays offline from network after acquisition
- Cache write on success for later fallback

## Verification

| Check | Result |
|-------|--------|
| Google Sheet CSV loads | Pass |
| Published rows appear | Pass |
| Unpublished rows hidden | Pass |
| Search / category / views unchanged | Pass |
| `npm test` / `npm run verify` | Pass |

## Tests

- `tests/milestone-12-google-sheets.test.mjs`
- Existing M1–M11 suites retained (fixture path still valid for unit tests)

## Explicitly out of scope

UI redesign, search/filter/view-mode changes, MASTERDATA access, write-back to
Sheets.

## Commit status

Not committed. Not pushed.
