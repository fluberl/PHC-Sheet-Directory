# Milestone 14 — Localization, Swiss Dates and PHC Taxonomy

**Status:** Completed
**Date:** 22 July 2026
**Commit:** `fc7b769`

## Why

Milestone 13 delivered the CPD directory as a live WordPress plugin on the
PHC Schweiz website. The architecture was complete, but the product still
presented English chrome, ISO dates, and a temporary English taxonomy.

Milestone 14 does not change that architecture. It turns the technical
prototype into a production-ready PHC Schweiz application: German (de-CH) UI,
Swiss date display, the official PHC category taxonomy, and correct
multi-category discovery.

## Objective

- Localize every visible UI string to Swiss German (de-CH)
- Format all dates with Swiss conventions via `Intl.DateTimeFormat`
- Replace temporary category labels with the PHC taxonomy
- Allow courses to belong to multiple PHC categories and filter accordingly
- Keep the generic directory engine taxonomy-agnostic
- Redeploy WordPress plugin assets from the updated `src/`

## Scope

- CPD-owned German localization resources
- Swiss long and short date formatters
- PHC taxonomy display labels (stable ids unchanged)
- Multi-category filtering through generic Search accessors
- Fixture and test updates
- WordPress asset sync
- Architecture verification and documentation

## Architecture

```text
PUBLIC → transport → CPD mapper → CPD entities
  → Catalog(cpdRecordAccessors)
  → searchCatalog({ text, categoryId }, accessors)
       └─ getCategoryIds (primary + secondary) preferred
       └─ getPrimaryCategoryId fallback
  → CPD card / schedule projection (de-CH copy + Swiss dates)
  → render
```

Generic Search remains the discovery engine. It knows only accessor hooks and
criteria `{ text, categoryId }`. PHC labels, German copy, and Swiss formatting
live in the CPD specialization (and injectable copy for the lifecycle shell).

## German localization (de-CH)

Specialization copy: `src/specializations/cpd/copy.js`

Discovery chrome, result counts, empty/error states, card meta labels, CTAs,
aria text, and schedule column headings are German. View mode labels
(`Kalenderkarten`, `Katalog`, `Chronologische Liste`) live in
`view-modes.js`.

Generic lifecycle defaults and user-facing load/error messages are also
German so no English chrome remains on the production path.

Some professional taxonomy terms intentionally remain English (for example
*Lifestyle Medicine*), matching the PHC Schweiz taxonomy.

## Swiss date formatting

Helpers in `src/specializations/cpd/normalize.js`:

- `formatSwissDateLong` → e.g. `17. August 2026` (cards / spacious UI)
- `formatSwissDateShort` → e.g. `17.08.2026` (chronological list)

Both use `Intl.DateTimeFormat('de-CH')`. Machine-readable ISO
`YYYY-MM-DD` remains on `<time datetime>` when available. Raw ISO or
`YYYY.MM.DD` is never shown as the visible label.

## PHC taxonomy

Module: `src/specializations/cpd/taxonomy.js`

Stable ids (unchanged from M10):

- `lifestyle-medicine`
- `mental-health-wellbeing`
- `womens-health`
- `mens-health`
- `healthy-ageing`
- `prevention-health-promotion`
- `health-coaching-communication`
- `integrative-health`
- `professional-development`

Display labels (PHC Schweiz):

| id | Label |
|----|--------|
| `lifestyle-medicine` | Lifestyle Medicine |
| `mental-health-wellbeing` | Mentale Gesundheit & Wohlbefinden |
| `womens-health` | Frauengesundheit |
| `mens-health` | Männergesundheit |
| `healthy-ageing` | Gesund altern |
| `prevention-health-promotion` | Prävention & Gesundheitsförderung |
| `health-coaching-communication` | Health Coaching & Kommunikation |
| `integrative-health` | Integrative Gesundheit |
| `professional-development` | Berufliche Entwicklung |

Legacy English labels resolve as aliases so existing sheet rows continue to
map. Presentation projects secondary categories through the same resolver so
`alsoListedUnder` shows canonical labels.

## Multiple category assignments

Domain model already carried:

- primary ← `classification.primaryCategory`
- secondary ← `classification.categories`

Milestone 14 makes filtering multi-aware:

- CPD `getCategoryIds` collects all supported taxonomy ids (primary +
  secondary)
- Generic `searchCatalog` prefers `getCategoryIds` when present, otherwise
  falls back to `getPrimaryCategoryId`
- Selecting one category shows every course assigned to that category

Search text and category still compose with logical AND.

## Preservation of the generic engine

- No PHC taxonomy ids or labels hard-coded in generic modules
- Search remains accessor-driven
- Lifecycle shell still receives injectable copy / category / view options
- WordPress shortcode, mount contract, and Sheets datasource unchanged
- Demo host continues to call bare `start()` against `#phc-cpd-directory`

## WordPress asset deployment

After application changes:

```bash
npm run deploy:wordpress
```

Copies `assets/styles/phc-directory.css` and `src/` into
`wordpress/phc-cpd-directory/assets/`. Milestone 14 included a full sync so
the live plugin tree matches localization, dates, taxonomy, and multi-category
behaviour. Plugin PHP and shortcode remain unchanged.

## Files and architectural areas changed

| Area | Key paths |
|------|-----------|
| Localization | `src/specializations/cpd/copy.js`, `view-modes.js`, `render-cards.js`, `render-list.js`, `src/render/states.js`, `src/errors/errors.js`, `src/data/source.js` |
| Swiss dates | `src/specializations/cpd/normalize.js` |
| Taxonomy | `src/specializations/cpd/taxonomy.js`, `presentation.js`, `examples/public/sample-public.json` |
| Multi-category | `src/domain/accessors.js`, `src/search/search.js`, `src/specializations/cpd/accessors.js` |
| Demo | `demo/index.html` (`lang="de-CH"`) |
| Verification | `scripts/verify-architecture.mjs`, `package.json`, `tests/milestone-14-localization.test.mjs`, M9–M12 test updates |
| WordPress | mirrored modules under `wordpress/phc-cpd-directory/assets/js/src/` |

## Verification

| Check | Result |
|-------|--------|
| German localization complete | Pass |
| Swiss date display (long + short) | Pass |
| PHC taxonomy labels | Pass |
| Multi-category filtering | Pass |
| Search still works | Pass |
| WordPress plugin unchanged in contract | Pass |
| Demo page still functions | Pass |
| `npm test` (generic + M8–M14) | Pass |
| `npm run verify:architecture` | Pass |
| `npm run verify` | Pass |
| `git diff --check` | Pass |

## Tests

- `tests/milestone-14-localization.test.mjs` — taxonomy labels, aliases,
  Swiss dates, German copy, multi-category filter, rendered chrome
- Existing M8–M13 suites retained (assertions updated for German copy and
  multi-category counts)

## Explicitly out of scope

Architecture redesign, new display modes, datasource changes, MASTERDATA
access, WordPress PHP redesign, fuzzy search / synonyms, dialect (Mundart)
copy.

## Outcome

The CPD directory is production-ready for PHC Schweiz: members see a fully
German interface, Swiss-formatted dates, and the official coaching-domain
taxonomy, including courses listed under multiple categories — without
breaking the generic engine, live Sheets feed, or WordPress mount.

## Significance of M14

Milestones 8–13 built a reusable directory engine and shipped it to WordPress.
Milestone 14 closes the product gap between that engine and the PHC Schweiz
site: localization, cultural date conventions, and the real taxonomy become
configuration and specialization concerns, while the generic core stays
intact for future directories.

## Commit status

Committed and pushed as `fc7b769`
(`feat: complete M14 localization and PHC taxonomy`).
