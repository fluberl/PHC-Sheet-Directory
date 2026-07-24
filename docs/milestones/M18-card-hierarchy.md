# Milestone 18 — Card Information Hierarchy

**Status:** Completed  
**Date:** 23 July 2026  
**Plugin release:** `1.0.8`  
**Package:** `dist/phc-cpd-directory-1.0.8-m18.zip`

## Why

Contained cards (M17) established each offering as an object. Inside the card,
metadata still read like a database dump, and the CTA sat in a quiet footer
rather than as a clear action.

Milestone 18 refines hierarchy only. A later refinement removed the residual
accent stripe and restyled the CTA / WB metric for quieter catalogue reading.

## Changes

### Accent
Removed entirely. The Edgewater border, radius, and soft shadow define the card.

### Two logical metadata columns
| Left (identity) | Right (delivery) |
|-----------------|------------------|
| Ort | Format |
| Kategorie | Durchführung |
| Auch gelistet unter | Art des Termins |
| Nächster Termin | WB-Stunden* metric |
| CTA (desktop, bottom-right of this column) | |

### CTA
Edgewater fill, bold white text, control radius. Desktop: bottom of left column,
right-aligned, minimal gap above. Mobile: after both metadata groups, centered.

### WB metric
Same grey label / body value typography as other metadata. Footnote remains in
the quiet footer: `PHC-WB-001` | `* Weiterbildungsstunden`.

### Footer
Quiet pair only:

- left: course id **exactly as supplied** by the sheet (no `Ref.` prefix)
- right: `* Weiterbildungsstunden` when hours are present

## Preservation

Search, filters, taxonomy, alternation, responsive breakpoints, M15 branding measure.

## Verification

| Check | Result |
|-------|--------|
| No accent strip; border/shadow kept | Pass |
| Identity / delivery column grouping | Pass |
| Edgewater CTA placement (desktop/mobile) | Pass |
| Normalized WB metric + footnote footer | Pass |
| `npm run verify` | Pass |
| `dist/phc-cpd-directory-1.0.8-m18.zip` only | Pass |

## Commit status

Prepared in the working tree; not committed until explicitly requested.
