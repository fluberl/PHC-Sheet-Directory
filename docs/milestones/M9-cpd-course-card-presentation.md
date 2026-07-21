# Milestone 9 — CPD Course Card Presentation

**Status:** Completed
**Date:** 21 July 2026
**Baseline:** `40e0348` (Milestone 9 commit)

## Purpose

Replace Milestone 8’s diagnostic id/title result list with accessible PHC CPD
course cards, projected from immutable CPD domain entities without leaking
PUBLIC transport structure into the generic engine.

## Baseline inherited from Milestone 8

See [Milestone 8 architecture](../architecture/milestone-8-cpd-integration.md).

Inherited and preserved:

- PUBLIC → transport validation → CPD mapper → nested CPD entities
- generic Catalog / Search / SearchResult via Record Accessors
- German PUBLIC headings confined to `map-public-row.js`
- host mount isolation (`#phc-cpd-directory`)

## Implemented scope

- CPD presentation projection (`presentation.js`)
- immutable render-safe card display models
- semantic CPD course-card list (`render-cards.js`)
- provider logo beside provider name; course title below
- course photo with short description (from `course.description`, else summary)
- desktop: alternating photo/description visual layout on successive cards
- mobile: no alternation — identical vertically stacked order for every card
- metadata section; registration link; QR code bottom-right when present
- public-facing search chrome with result status (`aria-live`)
- loading / empty catalog / no-results / error messaging
- scoped responsive CSS (metadata two columns on desktop, one on mobile)
- presentation omits provider type (still present in domain/mapper if supplied)
- CPD hours labelled as “CPD hours” (not “Recognition”)
- subdued PHC reference line (`Ref. PHC-CPD-…`)
- local demo media placeholders under `assets/demo/` for fixture image URLs

## Runtime flow

```text
PUBLIC JSON
  → transport validation
  → PHC PUBLIC mapper
  → immutable CPD domain entities
  → generic Catalog
  → generic SearchResult
  → CPD presentation projection
  → render-safe immutable card models
  → rendered CPD course cards
```

## Presentation-model boundary

Only `src/specializations/cpd/presentation.js` understands the full CPD domain
shape for cards. It:

- reads domain fields only (no German headings)
- omits empty optional values consistently
- validates http(s) URLs for links; allows http(s) or root-relative paths for media
- returns deeply frozen display models
- emits no HTML, CSS class names, or DOM nodes

Provider type is intentionally omitted from the display model even when the
domain entity still carries `provider.type` from the frozen PUBLIC contract.

## Rendering boundary

- Generic `render` / `states` provide lifecycle shell, search controls, and
  result-status messaging; they accept optional `copy` and `renderResults`.
- CPD-specific chrome strings live in `copy.js` and are injected by bootstrap.
- CPD card markup lives only in `render-cards.js`.
- Search focus and caret position are restored across snapshot remounts.
- Source content is inserted with `textContent` / safe `href` / `src` attributes only.
- DOM order for media is always photo then description; desktop alternation is
  visual only via CSS grid column placement (never `order`).

## Accessibility decisions

- Visible search label; `type="search"`
- Result count in a polite `aria-live` region
- Results in `section` → `ul` → `li` → `article`
- Provider logo uses empty `alt` when the provider name is adjacent text
- Course photo uses the course title as `alt`; QR uses a descriptive `alt`
- Course titles as `h3` under an `h2` results heading
- Metadata as `dl` with grouped `dt`/`dd` pairs
- ISO dates in `<time datetime>` when valid
- Descriptive link text; cards are not wholly clickable containers
- Focus outlines retained on interactive controls
- Mobile and assistive technologies share one reading order with the DOM

## Host-isolation guarantees

- Application mutates only `#phc-cpd-directory`
- CSS selectors are scoped under `#phc-cpd-directory`
- Demo host header and footer remain outside the mount root

## Architecture review

**Verdict: A — accept** (after one documentation correction)

Independent review confirmed:

- Catalog, Search, SearchResult, domain, and generic render modules do not
  import CPD specialization
- German PUBLIC headings remain confined to `map-public-row.js` under `src/`
- Presentation projection is the CPD→card seam; card DOM stays specialization-local
- Display models are deeply frozen; domain entities are not mutated
- Provider type is omitted from presentation
- Generic flat-directory path and default accessors remain intact
- Desktop visual alternation does not alter semantic DOM order

No code redesign was required for close-out.

## Verification summary

| Check | Result |
|-------|--------|
| `npm test` (generic + M8 + M9) | Pass |
| `npm run verify:architecture` | Pass |
| `npm run verify` | Pass |
| Runtime demo + headless DOM inspection | Pass |
| `git diff --check` | Clean |
| Architecture review | A — accept |

## Known limitations

- Interim typography/spacing only; not final PHC brand design
- UI chrome is English; course content may be German
- Demo media uses local SVG placeholders, not production CDN assets
- Provider type remains in the frozen PUBLIC contract/domain but is not shown

## Deliberately deferred

- Filters, sorting, pagination
- Course detail / provider pages
- Routing, favourites, registration/payment flows
- WordPress live embed / Google Sheets live acquisition
- Multilingual UI switching
- PUBLIC contract field removals (sheet editorial decision tracked separately)

## Relevant files

| Path | Role |
|------|------|
| `src/specializations/cpd/presentation.js` | Domain → card display model |
| `src/specializations/cpd/render-cards.js` | Card DOM |
| `src/specializations/cpd/copy.js` | CPD UI chrome strings |
| `assets/demo/*` | Local demo media placeholders for PUBLIC image URLs |
| `src/bootstrap.js` | Wires projector, copy, and render hook |
| `src/state/state.js` | Optional `projectResults` |
| `src/render/states.js` / `render.js` | Generic lifecycle shell |
| `assets/styles/phc-directory.css` | Scoped presentation |
| `tests/milestone-9-cpd-cards.test.mjs` | M9 tests |
| `scripts/verify-architecture.mjs` | Boundary checks |

## Final result

The directory presents searchable, accessible CPD course cards derived from the
Milestone 8 domain path, while the generic engine and PUBLIC mapper boundaries
remain intact.
