# Milestone 11 — Multiple Display Modes

**Status:** Completed
**Date:** 22 July 2026

## Why

Members ask different questions of the same CPD catalogue:

- What is coming up next?
- What is available by topic?
- What is the compact schedule?

Milestone 11 answers those questions with three presentation modes over one
filtered dataset. Discovery behaviour from Milestone 10 is unchanged.
Presentation stays independent of the PUBLIC datasource so Milestone 12 can
swap fixtures for live Google Sheets without rewriting view logic.

## Objective

- Offer Calendar Cards (default), Catalogue, and Chronological List
- Persist the selected mode across search, category, and clear-filter actions
- Never let view mode mutate the filtered result set
- Reuse editorial cards for card modes; add only a compact list renderer

## Architecture

```text
PUBLIC Sheet
  → Search
  → Category Filter
  → Filtered Dataset
  → Renderer
       ├─ Calendar Cards
       ├─ Catalogue
       └─ Chronological List
```

Only the renderer changes. Search, category filtering, taxonomy, Catalog, and
card projection remain upstream and identical.

Application State stores `viewMode` beside discovery criteria. Changing the
mode emits a new snapshot with the same `results`. Sorting for calendar and
chronological views happens at render time only.

## Display modes

### Calendar Cards (default)

- Purpose: upcoming CPD opportunities
- Sort: Next Start ascending (missing/invalid dates last, stable)
- Renderer: existing `createCpdCourseCardList` / editorial cards
- Alternating photo/text layout preserved via existing CSS

### Catalogue

- Purpose: discovery by topic / source order
- Sort: filtered dataset order (catalogue / search order)
- Renderer: identical editorial card list
- Visual differences from Calendar Cards: none — only ordering differs

### Chronological List

- Purpose: compact schedule scanning
- Sort: same Next Start ascending as Calendar Cards
- Renderer: `createCpdChronologicalList` table
- Columns: Date, Course (clickable), PHC-CPD Number, Category, CPD Credits
- Optional provider name under the course title

## Renderer strategy

| Concern | Owner |
|---------|--------|
| Mode ids / labels | `view-modes.js` |
| Date sort | `sort.js` |
| Card list | existing `render-cards.js` |
| Schedule table | `render-list.js` |
| Mode selection | `render-views.js` → `createCpdResultsView` |

No second editorial card component. No duplicated search, filter, or taxonomy
logic. Generic lifecycle shell accepts injectable `viewModeOptions` and does
not import CPD.

## Mobile behaviour

M10 responsive architecture retained:

- Desktop: Search | Category | View in one discovery row
- Mobile: stacked full-width controls
- No separate mobile implementation or redesign

## Accessibility

- Visible View label and native `<select>`
- Keyboard-accessible controls
- Focus restored for search, category, and view across remounts
- Schedule uses semantic table headings; course titles remain links
- Result status / empty messaging unchanged from M10

## Verification

| Check | Result |
|-------|--------|
| Search still works | Pass |
| Category filter still works | Pass |
| Switching modes preserves filters | Pass |
| Calendar Cards sorted by date | Pass |
| Catalogue unchanged (source order) | Pass |
| Chronological List correct | Pass |
| Mobile behaviour unchanged (stacked controls) | Pass |
| `npm test` / `npm run verify` | Pass |

## Tests

- `tests/milestone-11-display-modes.test.mjs`
- Existing M1–M10 suites retained

## Explicitly out of scope

Live Google Sheets transport, additional filters, favourites, new card design,
separate mobile chrome, persisting view mode to URL/storage.

## Outcome

The directory presents one filtered CPD set in three ways. Datasource and
discovery remain isolated from presentation, ready for the Sheets backend
milestone.

## Commit status

Not committed. Not pushed.
