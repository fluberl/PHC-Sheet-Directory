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
(`Nach Datum`, `Katalog`, `Chronologische Liste`) live in
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
npm run package:wordpress
```

`deploy:wordpress` copies CSS and builds
`assets/js/phc-cpd-directory.bundle.js` (esbuild IIFE) from the modular
`src/` tree. Nested ESM is **not** shipped inside the plugin package.
WordPress enqueues only that production bundle (plus CSS).

Package output:

`dist/phc-cpd-directory-1.0.2-m14.zip`

## Production defect — stale nested ESM (1.0.1 → 1.0.2)

### Defect

Milestone 13/14 initially shipped the full modular ESM tree under
`wordpress/phc-cpd-directory/assets/js/src/` and enqueued a thin entry module
that imported nested files at runtime. WordPress cache-busting (`?ver=`)
applied only to the entry script. Nested module URLs had no version query
string.

### Forensic evidence (live host)

Browser Network → `render-cards.js` Response on the production site still
contained the pre-M14 card renderer:

- `createMetaItem('Location', …)`
- `createMetaItem('Category', …)`
- `createMetaItem('Also listed under', …)`
- `createMetaItem('CPD hours', …)`
- `createMetaItem('Schedule type', …)`
- `time.textContent = card.delivery.nextStart`
- `'Course information and registration'`
- `'CPD courses'`

and did **not** contain `cpdDirectoryCopy` or `formatSwissDateLong`.

Plugin metadata showed **1.0.1**, and the M14 module *filenames* loaded, but
the **bodies** of nested modules were pre-M14. That combination is the
fingerprint of a stale or mixed nested-ESM deploy — not a failure of the
M14 source in git.

### Durable fix (plugin 1.0.2)

- Keep modular ESM under repository `src/` for development and tests
- Bundle the complete dependency graph into one production IIFE:
  `assets/js/phc-cpd-directory.bundle.js` (esbuild)
- Bundle input lives outside the plugin:
  `scripts/wordpress-bundle-entry.js`
- WordPress enqueues **only** that bundle (classic script; no `type="module"`)
- Nested plugin `assets/js/src/` is removed from the packaged plugin so it
  cannot be fetched at runtime
- Release bumped to **1.0.2** (plugin header, `VERSION`, readme Stable tag)

M13 host boundaries remain unchanged: shortcode, own assets, approved Google
Sheet only, render inside `#phc-cpd-directory`, no database writes, no admin
pages, no cron, no theme or other-plugin modification.

## Files and architectural areas changed

| Area | Key paths |
|------|-----------|
| Localization | `src/specializations/cpd/copy.js`, `view-modes.js`, `render-cards.js`, `render-list.js`, `src/render/states.js`, `src/errors/errors.js`, `src/data/source.js` |
| Swiss dates | `src/specializations/cpd/normalize.js` |
| Taxonomy | `src/specializations/cpd/taxonomy.js`, `presentation.js`, `examples/public/sample-public.json` |
| Multi-category | `src/domain/accessors.js`, `src/search/search.js`, `src/specializations/cpd/accessors.js` |
| Demo | `demo/index.html` (`lang="de-CH"`) |
| Verification | `scripts/verify-architecture.mjs`, `package.json`, `tests/milestone-14-localization.test.mjs`, M9–M12 test updates |
| WordPress (1.0.1) | initial mirrored modules (superseded) |
| WordPress (1.0.2) | `phc-cpd-directory.bundle.js`, enqueue-only bundle, `scripts/build-wordpress-bundle.mjs`, `scripts/package-wordpress-plugin.mjs` |

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
| Production bundle has no runtime imports | Pass (1.0.2) |
| Plugin ships no nested `assets/js/src/` | Pass (1.0.2) |

## Tests

- `tests/milestone-14-localization.test.mjs` — taxonomy labels, aliases,
  Swiss dates, German copy, multi-category filter, rendered chrome
- Existing M8–M13 suites retained (assertions updated for German copy and
  multi-category counts; M13 updated for production bundle enqueue)

## Explicitly out of scope

Architecture redesign, new display modes, datasource changes, MASTERDATA
access, WordPress PHP redesign beyond production enqueue, fuzzy search /
synonyms, dialect (Mundart) copy.

## Outcome

The CPD directory is production-ready for PHC Schweiz: members see a fully
German interface, Swiss-formatted dates, and the official coaching-domain
taxonomy, including courses listed under multiple categories — without
breaking the generic engine, live Sheets feed, or WordPress mount.

Release **1.0.2** makes that M14 UI durable on WordPress by eliminating
nested runtime ESM fetches.

## Significance of M14

Milestones 8–13 built a reusable directory engine and shipped it to WordPress.
Milestone 14 closes the product gap between that engine and the PHC Schweiz
site: localization, cultural date conventions, and the real taxonomy become
configuration and specialization concerns, while the generic core stays
intact for future directories.

The 1.0.2 production bundle closes the deployment gap discovered when the
live host continued to execute pre-M14 nested modules after 1.0.1 metadata
was installed.

## Commit status

M14 application work committed and pushed as `fc7b769`
(`feat: complete M14 localization and PHC taxonomy`).

Production bundle fix (1.0.2) is prepared in the working tree; package as
`dist/phc-cpd-directory-1.0.2-m14.zip` after `npm run deploy:wordpress` and
`npm run package:wordpress`.
