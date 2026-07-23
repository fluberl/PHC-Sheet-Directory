# Milestone 15 — Desktop Width, Deterministic UI Typography and Light PHC Branding

**Status:** Completed  
**Date:** 23 July 2026  
**Plugin release:** `1.0.4`  
**Package:** `dist/phc-cpd-directory-1.0.4-m15.zip`

## Why

Milestone 14 delivered German localization, Swiss dates, and the PHC taxonomy,
and 1.0.2/1.0.3 made that behaviour durable via a single production IIFE
bundle. On the live PHC Schweiz page the directory still looked visually
undersized (narrow left-aligned column inside a wider content area), and
discovery controls depended on host-font inheritance with neutral chrome that
did not read as PHC.

Milestone 15 is a presentation-only polish pass: align width with the site
content measure, lock UI typography to the PHC sans stack, and apply a light
native-control brand treatment — without changing discovery semantics or
replacing native selects.

## Objective

- Center the directory at `width: 100%` / `max-width: 1040px`
- Use an explicit `"Open Sans", Arial, sans-serif` stack for discovery UI
- Apply restrained PHC colours to native search/select controls
- Keep editorial serif typography for course content
- Keep view labels: `Nach Datum`, `Katalog`, `Chronologische Liste`
- Ship WordPress plugin **1.0.4** as a single production bundle ZIP

## Scope

| In scope | Out of scope |
|----------|--------------|
| Layout width / centering | Custom dropdown / select replacement |
| Discovery typography | Taxonomy or filter logic changes |
| Native control colouring | Architecture redesign |
| Plugin 1.0.4 packaging | Datasource or PHP host contract changes |

## Layout

```css
#phc-cpd-directory .phc-directory {
  width: 100%;
  max-width: 1040px;
  margin-inline: auto;
}
```

Existing mobile breakpoint behaviour is preserved (`max-width: none` under
`40rem` so the directory can use the full narrow viewport).

## Deterministic UI typography

Discovery no longer uses `font-family: inherit`. Tokens:

```css
--phc-ui-font: "Open Sans", Arial, sans-serif;
```

Applied to discovery labels, search input, category/view selects, option text
(where the browser allows), and the results-count line
(`.phc-directory__result-status`).

Editorial serif remains on status messages, results/cards, and related content
(`Georgia, 'Times New Roman', serif`).

## Light PHC branding (native controls)

| Token | Value | Use |
|-------|-------|-----|
| PHC Green | `#235853` | text, labels, control border |
| Tango Orange | `#e76827` | focus border / outline |
| Edgewater | `#b7dbd1` | control background |
| Grey | `#808080` | results-count text |

Controls keep native `<select>` / `<input type="search">` elements. Border
radius uses a subtle `--phc-control-radius: 0.25rem`. Placeholder text uses
PHC Green at reduced opacity.

## Preservation

- View mode ids and German labels unchanged
- Shortcode, mount root, Sheets datasource, single IIFE bundle unchanged
- No nested runtime ESM in the plugin package

## Verification

| Check | Result |
|-------|--------|
| `npm test` including M15 | Pass |
| `npm run verify:architecture` | Pass |
| Production CSS `max-width: 1040px` + centering | Pass |
| Explicit Open Sans stack | Pass |
| PHC colour tokens present | Pass |
| Editorial serif retained | Pass |
| Single JS bundle; no `assets/js/src` | Pass |
| `dist/phc-cpd-directory-1.0.4-m15.zip` only | Pass |

## Files

| Area | Paths |
|------|-------|
| Styles | `assets/styles/phc-directory.css` → plugin CSS sync |
| Docs | `docs/milestones/M15-branding-and-layout.md`, milestones README |
| Tests | `tests/milestone-15-branding.test.mjs` |
| Release | plugin `1.0.4`, package script `*-m15.zip` |

## Commit status

Prepared in the working tree; not committed until explicitly requested.
