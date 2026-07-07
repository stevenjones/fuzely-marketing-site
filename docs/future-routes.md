# Future routes & enablement (recommendations — nothing built yet)

This file records intended future work so it isn't re-derived later. **None of it
is implemented.** It also documents deliberate placeholders from the production
foundation pass.

## Login (app.fuzely.ai) — config ready, no markup

- There is **no login link in the page today**, by decision. The `app.fuzely.ai`
  strings that appear in the page are **decorative text inside product mockups**
  — leave them untouched; they are not navigation.
- The future login destination is already centralized as
  `FUZELY_CONFIG.appUrl` (`config.js`) = `https://app.fuzely.ai`.

**Intended placement when enabled:**
- **Desktop header, right side** — a "Log in" link next to the "Join the Beta"
  CTA (in the `.dt-only` header, before/alongside the primary CTA button).
- **Mobile menu** — a "Log in" item inside the slide-down `.menu-panel`
  (`.mb-only`), consistent with the existing mobile nav links.

**Enablement steps:**
1. Add the anchor(s) with `href` read from `FUZELY_CONFIG.appUrl` (either hardcode
   the same URL or, if you prefer a single source, set the `href` from JS on load).
2. Match the existing header/menu link styling exactly (reuse the inline-style
   patterns already in those regions) so the visual language is unchanged.
3. Keep it a plain link to the app — no auth logic lives in this static site.

Until then, the only header CTA remains "Join the Beta" → `#beta` / `#beta-m`.

## Pricing page

- **Recommendation:** a second static page (`pricing.html`) in the same repo,
  same no-build approach and shared `styles.css`. Link it from the header/footer
  once pricing is public. Keep beta framing consistent ("free during beta") until
  paid tiers actually exist — do not publish speculative prices.
- Reserve `FUZELY_CONFIG.pricingUrl` for the link target.

## Payment / checkout flow

- **Recommendation:** start with **Stripe Payment Links** (no code — a hosted
  checkout URL you can drop behind a CTA), then graduate to embedded Stripe
  Checkout / Elements when you need in-page flows or subscriptions.
- Reserve `FUZELY_CONFIG.checkoutUrl` for the link target. Do **not** add fake
  pricing or a fake checkout while the product is in free beta.

## Docs / tutorials / help hub

- **Recommendation:** a separate docs surface (e.g. a static docs generator or a
  hosted help tool) under `docs.fuzely.ai` or `/docs` on the app domain — not
  mixed into this marketing repo's `/docs` (which is maintainer notes).
- Reserve `FUZELY_CONFIG.docsUrl` for the link target.

## Analytics

- `track(event, props)` in `script.js` is a **no-op** until
  `FUZELY_CONFIG.analytics.enabled` is `true`. It already fires at the seams:
  page load (`page_view`), primary CTA clicks (`cta_click`), and beta submit
  (`beta_submit`).
- **Enablement:** flip `analytics.enabled` to `true` in `config.js` and implement
  the provider forward inside `track()` (e.g. Plausible/PostHog/GA). No markup
  change needed.

## Social share image (Open Graph)

- `index.html` has Open Graph + Twitter tags but **no `og:image`** yet — an SVG
  logo does not render reliably as a social preview.
- **Follow-up:** add a real 1200×630 PNG share image to `assets/` and an
  `<meta property="og:image">` (+ `twitter:card` = `summary_large_image`).

## prefers-reduced-motion (explicit follow-up — intentionally skipped)

- Reduced-motion support was **out of scope** for the foundation pass and was
  **not added**, because the two hero loops are JS-driven (`setInterval`) and a
  naive `@media (prefers-reduced-motion)` rule would not stop them — it risked
  animation drift, which the pass forbade.
- **Recommended approach when tackled:** in `script.js`, gate the hero loops on
  `window.matchMedia('(prefers-reduced-motion: reduce)').matches` — render the
  final/rest state and skip the interval — and pause the CSS keyframe animations
  (`livepulse`, `shimmer`, etc.) via a reduced-motion media block in `styles.css`.
  Verify both loops still land on a sensible static frame with zero layout shift.
