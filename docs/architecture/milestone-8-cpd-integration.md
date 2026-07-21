# PHC Directory Engine — Architecture (Milestone 8)

## Generic layer

| Module | Responsibility |
|--------|----------------|
| Data Source | Acquire PUBLIC JSON array only |
| Transport validation | Array of plain objects (CPD bootstrap path) |
| Schema + `validatePublicRows` | Flat `{ id, title }` structural validation (generic path) |
| `transformRowsToEntries` | Flat rows → immutable `{ id, title }` entries |
| Record accessors | Generic `getId` / `getTitle` for Catalog & Search |
| Catalog | Immutable store; lookup by accessor id |
| Search | Pure `searchCatalog(catalog, criteria, accessors?)` → SearchResult |
| SearchResult | `{ size, getAll() }` only |
| Application State | Lifecycle, Catalog, SearchResult, snapshot |
| Rendering | Snapshot only (lifecycle + diagnostics + `{ id, title }[]`) |

## Two intentional paths

### Generic flat-directory path

These remain available for reusable flat directories and are covered by
`tests/generic-engine.test.mjs`:

- `getDirectorySchema`
- `validatePublicRows`
- `transformRowsToEntries`
- flat `{ id, title }` domain entries
- default Catalog / Search accessors (`flatRecordAccessors`)

Legacy flat fixtures live under `examples/legacy/flat-public/` so they are
not confused with the current PHC CPD PUBLIC v1.0 contract.

The generic flat path is **not obsolete**. It remains part of the reusable
engine.

### PHC CPD application path

The PHC CPD bootstrap uses:

- transport-level array/object validation (`validateTransportRows`)
- PHC PUBLIC-row mapper (`mapPublicRowToCpdCourse`)
- immutable nested CPD entities (`createCpdCourse`)
- CPD record accessors (`course.id` / `course.title`)

Current PUBLIC fixture: `examples/public/sample-public.json`.

## PHC CPD specialization layer

| Module | Responsibility |
|--------|----------------|
| `map-public-row.js` | **Only** production module that knows German PUBLIC headings |
| `course.js` / `createCpdCourse` | Immutable nested CPD domain entity |
| `normalize.js` | Text trim, list parse, CPD hours |
| `cpdRecordAccessors` | `course.id` / `course.title` for generic Catalog/Search |

### Frozen PUBLIC v1.0

Website reads **PUBLIC only**. Not MasterData, not ID registers, not editorial columns.

Provider ID is **intentionally absent** from PUBLIC v1.0.

Identifier for Catalog: PUBLIC `PHC-CPD-ID` maps to domain `course.id` (no duplicated root `entity.id`).

### Boundaries

- Generic Catalog / Search / Render must not import CPD mapper headings for logic.
- CPD specialization must not be required by generic modules.
- Engine remains reusable for future directory types via accessors + specialization mappers.
