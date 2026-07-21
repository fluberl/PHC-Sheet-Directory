# Milestone 10 — Discovery

**Status:** Completed
**Date:** 22 July 2026

## Why

Members often know the topic they are interested in before they know the
provider.

The PHC CPD Directory should therefore support discovery through the domains of
Personal Health Coaching rather than through provider names, organisational
structures or medical diagnoses.

This milestone shifts the directory from a presentation of available courses to
a discovery-oriented application.

The governing taxonomy principle (Knowledge document
`13_PHC CPD Taxonomy.md`) remains: classify courses by domains of Personal
Health Coaching and health promotion, not by medical diagnoses.

## Objective

Enable members to:

- search relevant CPD text fields
- select a primary coaching domain
- combine search and category filters with logical AND
- see matching courses immediately
- understand clear zero-result states

## Scope

- CPD-owned primary-category taxonomy representation
- Multi-field searchable text via generic Record Accessors
- Primary-category filtering via generic Search criteria + accessors
- Combined discovery in Application State
- Accessible search + category controls
- Expanded demo fixtures
- Tests, architecture verification, documentation

## Architecture

```text
PUBLIC → transport → CPD mapper → CPD entities
  → Catalog(cpdRecordAccessors)
  → searchCatalog({ text, categoryId }, accessors)
  → CPD card projection
  → render
```

Generic Search remains the discovery engine. It knows only:

- optional `getSearchableText(entry)`
- optional `getPrimaryCategoryId(entry)`
- criteria `{ text, categoryId }`

PHC taxonomy ids and labels live only in the CPD specialization.

## Taxonomy representation

Module: `src/specializations/cpd/taxonomy.js`

Stable ids (ordered):

- `lifestyle-medicine`
- `mental-health-wellbeing`
- `womens-health`
- `mens-health`
- `healthy-ageing`
- `prevention-health-promotion`
- `health-coaching-communication`
- `integrative-health`
- `professional-development`

Display labels are separate from ids. Unsupported primary-category values are
surfaced in presentation (`primaryCategorySupported: false`) and do not match
category filters.

Semantic mapping:

- primary category ← domain `classification.primaryCategory`
- secondary categories ← domain `classification.categories` (presented as
  `alsoListedUnder`)

## Search behaviour

Search is case-insensitive, trimmed, immediate, and Catalog-based.

Searchable fields (via CPD `getSearchableText`):

- course title
- provider name
- summary / description
- primary-category label
- secondary categories

Disease/topic terms such as diabetes, hypertension, menopause and falls
prevention remain searchable content without becoming top-level categories.

## Category filtering

Native labelled `<select>` with “All categories” plus taxonomy options.

Selecting a category filters by primary-category id only.

## Combined discovery

Search text and category id compose with logical AND in `searchCatalog` /
Application State. Clearing either constraint recalculates results. Result
count reflects the visible set.

## Accessibility

- Visible labels for search and category
- Keyboard-accessible native controls
- Result count / empty state via `role="status"` and `aria-live="polite"`
- Category/search focus restored across remounts
- Card DOM order remains photo then description

## Responsive behaviour

- Desktop: compact discovery control row
- Mobile: stacked full-width controls
- Milestone 9 card presentation unchanged

## Verification

| Check | Result |
|-------|--------|
| `npm test` | Pass (generic + M8 + M9 + M10) |
| `npm run verify:architecture` | Pass |
| `npm run verify` | Pass |

## Tests

- `tests/milestone-10-discovery.test.mjs`
- Existing M1–M9 suites retained (fixture assertions updated where counts/titles changed)

## Explicitly out of scope

Secondary-category controls, format/language/hours/date filters, sorting,
favourites, provider/detail pages, fuzzy search, synonyms, analytics, live
Sheets integration, card redesign.

## Outcome

The directory is discovery-oriented: members can search topics and select
primary coaching domains while the generic engine stays taxonomy-agnostic.

## Files changed

See implementation report / `git status`.

## Review status

Pending visual and architectural checkpoint review.

## Commit status

Committed and pushed with Milestone 10.
