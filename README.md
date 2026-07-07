# Fuzely — Responsive Marketing Site (approved export)

Export/file-organization pass only. The approved responsive design is preserved exactly — no layout, styling, copy, or behavior changes.

## Files

- `index.html` — full page markup (desktop + mobile section variants)
- `styles.css` — global resets, keyframes, responsive breakpoint rules, nav/FAQ state classes, hover/focus states
- `script.js` — all behavior: sticky header, mobile nav, FAQ accordions, and both hero product-demo animation loops
- `assets/fuzely-logo.svg` — Fuzely logomark (uses `currentColor`)

## How responsiveness works

One page, one URL. Desktop and mobile section variants both live in `index.html`;
CSS media queries at the **840px** breakpoint show one and hide the other
(`.dt-only` / `.mb-only` in `styles.css`). No JavaScript is involved in the switch.

Mobile sections use `-m`-suffixed anchor ids (`#how-m`, `#beta-m`, …) so in-page
navigation works in both modes without duplicate ids.

## Notes on fidelity choices

- **Inline styles are kept inline** in the markup. This guarantees pixel-exact
  fidelity with the approved prototype (per the export instructions). Global
  rules, animations, and interactive states live in `styles.css`.
- **SVG icons/illustrations are kept inline** because their fill/stroke colors
  vary per instance; extracting them to files would change appearance.
  `assets/fuzely-logo.svg` is provided for reuse elsewhere (favicons, emails, etc).
- **Fonts** load from Google Fonts (IBM Plex Sans + IBM Plex Mono) via `<link>`
  tags in `index.html` — standard production setup. Self-host the woff2 files
  if you need fully offline serving.

## Hero animations

- Desktop: five-state loop (type → click Generate → analyze checklist → concepts → select → launch-ready), ~19.5s cycle.
- Mobile: same story in the vertical tap-driven treatment, ~17s cycle.

Both are driven by `script.js` against `data-anim` / `data-stage` / `data-ref`
attributes in the markup and pause automatically while their branch is hidden.
