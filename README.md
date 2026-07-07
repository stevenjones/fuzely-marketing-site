# Fuzely — Responsive Marketing Site (approved export)

Export/file-organization pass only. The approved responsive design is preserved exactly — no layout, styling, copy, or behavior changes.

## Files

- `index.html` — full page markup (desktop + mobile section variants)
- `styles.css` — global resets, keyframes, responsive breakpoint rules, nav/FAQ state classes, hover/focus states
- `config.js` — runtime config (app URL, beta endpoint, analytics flag); loaded **before** `script.js`
- `script.js` — all behavior: sticky header, mobile nav, FAQ accordions, both hero product-demo animation loops, plus the beta-form handler and the no-op `track()` hook
- `assets/fuzely-logo.svg` — Fuzely logomark (uses `currentColor`; also the favicon)
- `docs/` — maintainer docs: `deployment.md`, `beta-form.md`, `future-routes.md`
- `.gitignore` — OS/editor junk, plus `node_modules` if tooling is ever added

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

## Production foundation (no visual changes)

A foundation pass added **invisible** production plumbing on top of the approved
design — **no layout, styling, copy, section order, or animation changed** (verified
by pixel-for-pixel frozen-render diffs at desktop and mobile). What it added:

- **`config.js`** — one plain config object (`window.FUZELY_CONFIG`) so future URLs
  and the beta endpoint aren't hardcoded. Nothing here makes a network request.
- **Beta form, backend-ready but inert** — both copies (`#beta`, `#beta-m`) are now
  real `<form>`s with `name` attributes and `aria-label`s. On submit the handler
  validates name/email and, because `config.js` ships `betaEndpoint: null`, shows an
  **honest** "not connected yet" message — it never implies a successful signup.
  Set `betaEndpoint` to enable a real POST + genuine success state. See
  `docs/beta-form.md`.
- **No-op analytics** — `track()` fires at page load, primary CTA clicks, and beta
  submit, but does nothing until `FUZELY_CONFIG.analytics.enabled` is `true`.
- **Head hygiene** — SVG favicon + Open Graph/Twitter tags (no `og:image` yet).
- **Login** — intentionally **not** in the markup; destination is centralized as
  `FUZELY_CONFIG.appUrl`. Intended placement + enablement in `docs/future-routes.md`.
- **`prefers-reduced-motion`** — intentionally skipped (JS-driven hero loops; would
  risk animation drift). Recorded as a follow-up in `docs/future-routes.md`.

The `app.fuzely.ai` strings in the page are **decorative text inside product
mockups** — not navigation. Leave them untouched.

## QA checklist (run before every deploy)

Test at **desktop (≥840px)**, **tablet**, and **mobile (<840px)** widths:

- [ ] **Responsive switch** — desktop sections show above 840px, mobile variants
      below; no duplicate/overlapping content across the breakpoint.
- [ ] **Desktop hero loop** runs its five-state ~19.5s cycle smoothly.
- [ ] **Mobile hero loop** runs its ~17s cycle; hidden branch stays paused.
- [ ] **Mobile nav** — hamburger toggles the menu open/closed; menu links close it.
- [ ] **FAQ accordions** open/close (desktop + mobile); only one open at a time.
- [ ] **Anchor scrolling** works in both branches (`#how` desktop, `#how-m` mobile,
      etc.) with the sticky-header offset.
- [ ] **Beta form placeholder** — a valid submit shows the honest "aren't connected
      yet" message and **no** success state; the payload logs to the console.
- [ ] **Beta validation** — empty name / bad email shows an inline error + red
      border **only after** a submit attempt (no red borders on page load).
- [ ] **No console errors** on load or during interaction.

