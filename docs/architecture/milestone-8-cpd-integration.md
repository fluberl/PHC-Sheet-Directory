# Milestone 8 — CPD Domain Integration

**Status:** Completed
**Date:** 21 July 2026
**Commit:** `6d08524`

## Purpose

Introduce the PHC CPD domain specialization on top of the generic directory engine, without replacing the flat `{ id, title }` path.

## Architectural overview

```text
PUBLIC (CPD v1.0)
  → Data Source
  → transport validation (array of objects)
  → mapPublicRowToCpdCourse
  → createCpdCourse (nested immutable entity)
  → Catalog(cpdRecordAccessors)
  → searchCatalog(..., cpdRecordAccessors)
  → State snapshot { id, title }[]
  → Render
```

Catalog and Search remain generic. They read identity and title only through Record Accessors.

## Generic layer

| Module | Responsibility |
|--------|----------------|
| Data Source | Acquire PUBLIC JSON array only |
| Transport validation | Array of plain objects (CPD bootstrap path) |
| Schema + `validatePublicRows` | Flat `{ id, title }` structural validation |
| `transformRowsToEntries` | Flat rows → immutable `{ id, title }` entries |
| Record accessors | Generic `getId` / `getTitle` |
| Catalog | Immutable store; lookup by accessor id |
| Search | `searchCatalog(catalog, criteria, accessors?)` → SearchResult |
| SearchResult | `{ size, getAll() }` only |
| Application State | Lifecycle, Catalog, SearchResult, snapshot |
| Rendering | Snapshot only |

### Two intentional paths

**Generic flat-directory path** (still part of the reusable engine; covered by `tests/generic-engine.test.mjs`):

- `getDirectorySchema`, `validatePublicRows`, `transformRowsToEntries`
- flat `{ id, title }` domain entries
- default `flatRecordAccessors`
- legacy fixtures: `examples/legacy/flat-public/`

**PHC CPD application path** (bootstrap):

- `validateTransportRows`
- PHC PUBLIC-row mapper
- nested CPD entities
- `cpdRecordAccessors` (`course.id` / `course.title`)
- current fixture: `examples/public/sample-public.json`

## Specialization layer

| Module | Responsibility |
|--------|----------------|
| `map-public-row.js` | Only production module that knows German PUBLIC headings |
| `course.js` / `createCpdCourse` | Immutable nested CPD domain entity |
| `normalize.js` | Text trim, list parse, CPD hours |
| `cpdRecordAccessors` | Nested id/title for Catalog and Search |

Provider ID is intentionally absent from PUBLIC v1.0. Catalog identity is PUBLIC `PHC-CPD-ID` → domain `course.id` (no duplicated root `entity.id`).

## Architectural boundaries

- Catalog, Search, and Render must not import CPD specialization or German PUBLIC headings.
- CPD specialization must not be required by generic modules.
- German frozen PUBLIC headings under production `src/` are confined to `map-public-row.js` (enforced by `scripts/verify-architecture.mjs`).
- Domain constructor messages use English domain terminology only (`course.id`), not PUBLIC column names.

## Important invariants

- Website reads PUBLIC only (never MASTERDATA).
- SearchResult exposes only `size` and `getAll`.
- Accessors approach is the specialization seam; do not reintroduce root-level duplicated `id`/`title` on CPD entities.
- Empty title search returns all entries; source order is preserved.
- Milestone 8 does not add cards, filters, provider pages, detail pages, routing, pagination, or new CPD fields.

## Verification summary

| Check | Result |
|-------|--------|
| `npm test` (generic + CPD) | Pass |
| `npm run verify:architecture` | Pass |
| `npm run verify` | Pass |
| Runtime: flat path | Pass |
| Runtime: CPD PUBLIC → snapshot | Pass |
| `git diff --check` | Clean |
| Architecture review | Accept after small doc corrections only; no code redesign |

Commands:

```bash
npm test
npm run verify:architecture
npm run verify
```
