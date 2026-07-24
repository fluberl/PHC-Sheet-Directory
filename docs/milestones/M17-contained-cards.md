# Milestone 17 — Contained PHC Cards

**Status:** Completed  
**Date:** 23 July 2026  
**Plugin release:** `1.0.6`  
**Package:** `dist/phc-cpd-directory-1.0.6-m17.zip`

## Why

Milestones 15–16 established measure, branding, and desktop media composition.
Course entries still read as open list sections separated by hairlines, and
metadata zig-zagged across two columns. Members needed each CPD offering to
feel like one self-contained object without a directory redesign.

## Objective

- Wrap each course in a contained white card (Edgewater border, soft lift shadow)
- Keep M16 alternating media composition inside the card
- Add a restrained PHC Green accent strip on the media-adjacent card edge
- Replace two-column metadata zig-zag with a single vertical reading flow
- Change presentation only — no search, filter, taxonomy, or renderer changes

## Card container

```css
#phc-cpd-directory .phc-directory__card {
  background: #fff;
  border: 1px solid var(--phc-edgewater);
  border-radius: 0.5rem;
  box-shadow:
    0 1px 2px rgba(35, 88, 83, 0.06),
    0 6px 18px rgba(35, 88, 83, 0.08);
  padding: 1.5rem 1.6rem 1.65rem;
}
```

Card list gap is `2rem`. Legacy `border-top` separators are removed.

## PHC accent

A `::before` strip (`0.2rem`, PHC Green) sits on the media-adjacent outer edge:

- odd (image-left) cards → left edge
- even (image-right) cards → right edge

On mobile stacks, the accent stays on the left for a consistent reading edge.

## Metadata reading flow

`.phc-directory__card-meta` is a column flex stack (`flex-direction: column`),
not a two-column grid. Each term sits directly above its value:

```text
Ort
Basel

Kategorie
…
```

DOM structure (`dl` / grouped `dt`+`dd` items) is unchanged; only CSS flow
changes.

## Preservation

- M16 alternation, `justify-self`, 320px desktop images
- M15 1040px width, Open Sans UI, discovery colours
- Editorial serif on results/cards
- Search, filters, taxonomy, rendering modules

## Verification

| Check | Result |
|-------|--------|
| Contained card chrome | Pass |
| Accent strip left/right | Pass |
| Single-flow metadata | Pass |
| M15/M16 presentation intact | Pass |
| `npm run verify` | Pass |
| `dist/phc-cpd-directory-1.0.6-m17.zip` only | Pass |

## Commit status

Prepared in the working tree; not committed until explicitly requested.
