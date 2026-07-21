# ADR-0001: PHC Directory Engine — Version 1.0 Architecture

- **Status:** Accepted
- **Date:** 2026-07-21
- **Product context:** PHC Schweiz Continuing Professional Development (CPD) Directory is the first production implementation of a reusable PHC Directory Engine.

## Context

PHC Schweiz needs embeddable directories on its WordPress site. The upstream data pipeline is already designed, implemented, and acceptance-tested:

```text
Google Form → Response Sheet → MASTERDATA → Editorial Review → PUBLIC → Directory → WordPress
```

The frontend must read only from PUBLIC. WordPress/Thrive provide page chrome. The page hosts a single mount element; the application owns everything inside it.

The long-term goal is one engine powering multiple directories (CPD, Members, Providers, Events) without rewriting the core. Version 1.0 must therefore be the smallest architecture that is still clean, extensible, and maintainable — not a speculative platform.

## Decision

We adopt the Version 1.0 architecture below as the institutional baseline for implementation.

### Fixed constraints

1. **Runtime:** vanilla HTML, CSS, and modern JavaScript only.
2. **Tooling:** no build tooling, bundlers, or development dependencies until a demonstrated need exists.
3. **Data source:** PUBLIC is the only frontend data source. The application must never access MASTERDATA.
4. **Trust:** all PUBLIC data is untrusted input and must be validated and rendered safely.
5. **DOM boundary:** the application may modify only the DOM subtree rooted at `#phc-cpd-directory` (or the configured mount root for a future specialization). Nothing outside that subtree may be changed unless explicitly decided later.
6. **Host ownership:** WordPress/Thrive own header, footer, navigation, and overall page layout.
7. **Product shape:** build a generic PHC Directory Engine; CPD is the first specialization, not a one-off app.
8. **Simplicity:** prefer clear responsibilities over clever abstractions; defer non-essential blocks.

### Engine versus specialization

| Engine (stable core) | Specialization (per directory type) |
|----------------------|-------------------------------------|
| Lifecycle, fetch pattern, trust boundary, catalog, state, search, filtering, interaction, rendering shell | Field schema, PUBLIC→domain mapping, domain vocabulary, presentation content, copy |

A second directory should plug in primarily by providing a new specialization and schema — not by changing the core engine.

### Version 1.0 building blocks

Each block has one responsibility.

1. **Host Contract** — Defines the mount-root boundary with WordPress.
2. **Configuration** — Declares this directory instance (PUBLIC reference, mount root, locale/copy, selected specialization).
3. **Bootstrap** — Wires blocks and starts the application once.
4. **Data Source** — Acquires the raw PUBLIC payload only.
5. **Validation & Trust Boundary** — Enforces shape/safety rules on untrusted input; rejects or neutralizes unsafe values.
6. **Schema** — Formal contract between engine and specialization. Version 1.0 schema describes only:
   - field identity
   - field type
   - searchable
   - filterable
   - visible
   - optional vs required  
   It is not a sophisticated schema engine.
7. **Domain Model** — Defines canonical directory records and invariants, independent of sheets and UI.
8. **Transformation** — Maps validated raw rows to domain records using the specialization and schema.
9. **Catalog** — Holds the loaded domain records for the session, separate from UI state.
10. **Search** — Text search over schema-declared searchable fields.
11. **Filtering** — Facet/criteria filtering over schema-declared filterable fields.
12. **Application State** — Owns mutable session state: lifecycle (loading / ready / empty / error), query, filters, selection (e.g. list vs detail), and derived visible results.
13. **Interaction** — Translates user intent inside the mount root into state commands.
14. **Rendering** — Projects state and records into the mount root using semantic, accessible, responsive markup; escapes/safely outputs untrusted content.
15. **Directory Specialization** — CPD (first) supplies schema, mapping, vocabulary, and presentation knowledge without leaking into the engine core.
16. **Error Handling** — Normalizes failures into application-visible outcomes consistent with graceful degradation.

### Explicitly deferred (not Version 1.0 blocks)

These remain valid architecture, but are deliberately postponed:

- Sorting as a separate block (simple default order is acceptable initially)
- Query Composition as a separate block (filter then search may be composed inside state updates)
- Presentation / View Rules as a separate block (live with specialization + rendering until a second directory needs divergence)
- Formal Observability beyond disciplined error handling and diagnostics
- Multi-specialization registries, URL deep-linking, advanced retry/stale-data policies

### Out of scope for the frontend

- Google Form, Response Sheet, MASTERDATA, and editorial workflow
- Any write-back to Sheets
- Frameworks, unless a clearly identified problem cannot reasonably be solved with vanilla technologies

### Information flow

```text
PUBLIC → Data Source → Validation → Transformation → Catalog
                                      ↑
                               Schema + Specialization + Domain Model

Catalog → (Filtering + Search via State) → Application State → Rendering → Mount root
                ↑                                ↑
           Interaction ←——————————————— user events inside mount root

Failures → Error Handling → Application State → Rendering
```

Configuration and Bootstrap compose the system. The Host Contract constrains Rendering and Interaction to the mount subtree.

## Reasoning

- **PUBLIC-only and trust boundary** protect editorial integrity and security: the website never becomes an alternate admin surface, and sheet content cannot execute as code through the UI.
- **Schema in Version 1.0** keeps CPD field knowledge out of the engine from day one, while remaining a thin contract rather than a framework. This makes a second specialization significantly easier without over-engineering.
- **Catalog vs Application State** prevents UI interactions from mutating or conflating the loaded dataset with the current view.
- **Specialization seam with only CPD implemented** delivers a real product now while preserving the reusable-engine goal.
- **Deferring sorting, query-composition, presentation, and observability blocks** reduces Version 1.0 complexity without forcing a redesign later, provided the seams above remain intact.
- **Vanilla runtime and postponed tooling** match the WordPress embed context and the preference for long-lived, readable code.

## Consequences

- Implementation must follow these responsibilities and constraints; new architectural decisions require further ADRs.
- CPD ships as the first specialization of the Directory Engine, not as a standalone throwaway app.
- Repository documentation (including the README) should later be updated to reflect CPD-first reality; this ADR is the architectural source of truth until then.
- Contributors joining later should treat deferred blocks as intentional absences, not omissions to “fix” prematurely.

## References

- PHC Governance CPD Proposal v1.0
- PHC Google Form Specification v1.0
- Engineering principles agreed for this repository (simplicity, separation of concerns, namespaced UI, accessibility, responsive design, graceful degradation, ask before uncertain architectural changes)
