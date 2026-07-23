# Milestone 16 — Desktop Card Composition

**Status:** Completed  
**Date:** 23 July 2026  
**Plugin release:** `1.0.5`  
**Package:** `dist/phc-cpd-directory-1.0.5-m16.zip`

## Why

Milestone 15 locked the directory to a centered 1040px measure and branded
discovery controls. On desktop, even (image-right) cards still left-aligned
the photo inside the right media column, so images appeared to float toward
the centre. Square course images were also slightly undersized relative to
the wider layout.

Milestone 16 is a desktop-only card composition pass.

## Objective

- Keep alternating image-left / image-right composition
- Flush image-left photos to the left of their media column
- Flush image-right photos to the right of their media column
- Enlarge desktop square course images to **320×320px**
- Leave tablet/mobile stacking unchanged
- Preserve M15 width, typography, branding, and all discovery behaviour

## Desktop rules

Breakpoint: `@media (min-width: 40.0625rem)` — complementary to the existing
mobile stack at `max-width: 40rem`.

```css
#phc-cpd-directory .phc-directory__card-media {
  justify-self: start;
}

#phc-cpd-directory .phc-directory__card-item:nth-child(even) .phc-directory__card-media {
  justify-self: end;
}

#phc-cpd-directory .phc-directory__card-photo,
#phc-cpd-directory .phc-directory__card-photo-placeholder {
  width: 320px;
  max-width: 320px;
  height: 320px;
}
```

Alternation continues to use grid column placement only (never `order`).
Course photos keep `object-fit: cover`; QR codes keep `object-fit: contain`.

## Image size choice

**320px** square — top of the 300–320px target range. At 1040px with a two-
column media row and `1.25rem` gap, each column has ~510px; 320px leaves
comfortable room for description text without compression.

Below the desktop breakpoint, photos remain `max-width: 18rem` with
`width: 100%` as before.

## Preservation

- 1040px centered directory
- M15 PHC discovery colours and Open Sans UI stack
- Editorial serif on results/cards
- Metadata layout, filtering, taxonomy, Swiss dates
- Native selects; single production IIFE bundle

## Verification

| Check | Result |
|-------|--------|
| Image-left `justify-self: start` (desktop) | Pass |
| Image-right `justify-self: end` (desktop) | Pass |
| Desktop photo 320×320px | Pass |
| Mobile stack unchanged | Pass |
| M15 width / typography / branding intact | Pass |
| `npm run verify` | Pass |
| `dist/phc-cpd-directory-1.0.5-m16.zip` only | Pass |

## Files

| Area | Paths |
|------|-------|
| Styles | `assets/styles/phc-directory.css` |
| Tests | `tests/milestone-16-card-composition.test.mjs` |
| Docs | this file; milestones README |
| Release | plugin `1.0.5`, package `*-m16.zip` |

## Commit status

Prepared in the working tree; not committed until explicitly requested.
