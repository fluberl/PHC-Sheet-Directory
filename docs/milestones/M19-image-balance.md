# Milestone 19 — Desktop Image Balance

**Status:** Completed  
**Date:** 23 July 2026  
**Plugin release:** `1.0.9`  
**Package:** `dist/phc-cpd-directory-1.0.9-m19.zip`

## Why

After contained cards and hierarchy refinements, desktop course images still
felt edge-anchored inside their media columns (`justify-self: start` /
`end`). The columns and alternating layout were correct; only in-column
balance needed adjustment.

## Change

Above `@media (min-width: 40.0625rem)`:

```css
#phc-cpd-directory .phc-directory__card-media {
  justify-self: center;
}

#phc-cpd-directory .phc-directory__card-item:nth-child(even) .phc-directory__card-media {
  justify-self: center;
}
```

## Unchanged

- 320×320px image size and `object-fit: cover`
- Media column width and alternating left/right column placement
- Mobile stacking
- Card chrome, metadata hierarchy, discovery UI

## Verification

| Check | Result |
|-------|--------|
| Desktop media `justify-self: center` | Pass |
| 320px size retained | Pass |
| Mobile layout unchanged | Pass |
| `npm run verify` | Pass |

## Commit status

Prepared in the working tree; not committed until explicitly requested.
