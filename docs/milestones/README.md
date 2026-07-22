# PHC Directory Engine — Milestones

Index of implementation milestones documenting the evolution of the PHC
Directory Engine.

Long-lived architectural decisions are recorded as Architecture Decision
Records (ADR) under [`docs/adr/`](../adr/).

Milestone documents live under [`docs/milestones/`](./).

---

## Current Stage

**Milestone 13 — WordPress Page Integration** *(implemented, pending commit)*

Self-contained WordPress plugin shortcode mounts the unchanged Milestone 12
directory into `#phc-cpd-directory` with conditional asset loading.

---

## Milestone Table

| Milestone | Status | Description | Document |
|-----------|--------|-------------|----------|
| M1 | Completed | Host Contract and Bootstrap | — |
| M2 | Completed | Application State and Error Handling | — |
| M3 | Completed | PUBLIC Data Acquisition | — |
| M4 | Completed | Schema Contract and Validation | — |
| M5 | Completed | Domain Model and Transformation | — |
| M6 | Completed | Generic Catalog | — |
| M7 | Completed | Generic Search | — |
| M8 | Completed | CPD domain specialization while preserving the generic engine | [M8-cpd-integration.md](./M8-cpd-integration.md) |
| M9 | Completed | Editorial CPD course presentation | [M9-cpd-course-card-presentation.md](./M9-cpd-course-card-presentation.md) |
| M10 | Completed | Discovery through taxonomy, search and category filtering | [M10-discovery.md](./M10-discovery.md) |
| M11 | Completed | Multiple display modes over one filtered dataset | [M11-multiple-display-modes.md](./M11-multiple-display-modes.md) |
| M12 | Completed | Live Google Sheets PUBLIC datasource | [M12-google-sheets-integration.md](./M12-google-sheets-integration.md) |
| M13 | Implemented (pending commit) | WordPress plugin shortcode host integration | [M13-wordpress-integration.md](./M13-wordpress-integration.md) |

---

Milestones 1–7 predate the formal milestone documentation.

Their implementation history can be reconstructed from the Git commit history,
but no retrospective milestone documents have been created.
