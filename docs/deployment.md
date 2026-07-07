# Deployment

The Fuzely marketing site is a **static single page** — plain HTML, CSS, and JS
with **no build step, no bundler, and no framework**. Deploy by serving the repo
root as static files.

## Files that must ship together

```
index.html      # the page
styles.css      # global rules, keyframes, 840px breakpoint, state classes
config.js       # runtime config — loaded BEFORE script.js
script.js       # all behavior
assets/         # fuzely-logo.svg (favicon + future images)
```

`docs/` and `README.md` are for maintainers and do **not** need to be served.

## Any static host works

- **Netlify / Vercel / Cloudflare Pages:** point at the repo root, no build
  command, publish directory `/`.
- **GitHub Pages:** serve from the repo root (or `/docs` is *not* used here —
  keep the site at root).
- **S3 + CloudFront / any object store + CDN:** upload the files listed above,
  set `index.html` as the index document.
- **Plain Nginx/Apache:** drop the files in the web root.

No server-side runtime is required today. (A future beta endpoint is a separate
service — see `beta-form.md`.)

## Custom domain

Point `www.fuzely.ai` at the host. This site is **separate from the Fuzely app**
at `app.fuzely.ai` — keep them on distinct deployments so the marketing site can
never affect the product.

## Fonts — Google Fonts dependency (and the self-host option)

Fonts load from Google Fonts via `<link>` tags in `index.html`
(IBM Plex Sans + IBM Plex Mono). This is the standard production setup and needs
outbound access to `fonts.googleapis.com` / `fonts.gstatic.com` at page load.

To serve fully offline / remove the third-party dependency (as the export's
README notes), **self-host the woff2 files**:

1. Download the IBM Plex Sans (400/500/600/700) and IBM Plex Mono (400/500)
   woff2 files.
2. Add `@font-face` rules to `styles.css` pointing at local `assets/fonts/…`.
3. Remove the three Google Fonts `<link>` tags from `index.html`.

Do this without changing any `font-family` names so the approved typography is
preserved exactly.

## Favicon note

The favicon is the SVG logomark (`assets/fuzely-logo.svg`) via
`<link rel="icon" type="image/svg+xml">`. Modern browsers render it fine. For
legacy support you may later add a `favicon.ico` and an `apple-touch-icon` PNG
(link tags only) — this is a future asset-generation task, not required to ship.

## Pre-deploy QA

Run the QA checklist in the root `README.md` before every deploy (desktop +
mobile rendering, both hero loops, mobile nav, FAQ, beta-form placeholder
behavior, anchor scrolling, no console errors).
