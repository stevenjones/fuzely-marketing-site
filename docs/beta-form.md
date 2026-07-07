# Beta waitlist form — wiring guide

The beta application form is **prepared for a backend but intentionally inert**
until an endpoint is configured. There are two identical copies in `index.html`
(desktop `#beta`, mobile `#beta-m`), each wrapped in a real
`<form data-beta-form novalidate>`. Both behave identically; the handler lives in
`script.js`.

## Current behavior (no endpoint)

`config.js` ships with `betaEndpoint: null`. On submit, the handler:

1. Prevents the default submit.
2. Validates: **name** required, **email** required + basic format check.
   Invalid fields get a red border **only after a submit attempt** (never on
   page load), plus an inline error message.
3. Because `betaEndpoint` is null, it **does not show a success state**. It shows
   an honest, neutral message — *"Beta applications aren't connected yet — check
   back soon."* — and logs the collected payload to the console for dev
   verification. **Nothing is captured or sent.**
4. Fires the no-op `track('beta_submit', …)` hook (does nothing until analytics
   is enabled).

This is deliberate: we never imply a user joined the waitlist when nothing was
stored.

## Enabling real submissions

1. **Set the endpoint** in `config.js`:

   ```js
   window.FUZELY_CONFIG = {
     …,
     betaEndpoint: "https://your-endpoint.example.com/beta",
   };
   ```

2. With `betaEndpoint` set, a valid submit POSTs JSON to it and, on a `2xx`
   response, resets the form and shows a **genuine** success message
   (*"You're on the list…"*). A non-OK response / network failure shows an error
   and does **not** claim success.

No code change is needed to flip behavior — the handler already branches on
`betaEndpoint` being null vs. set.

## Payload shape (JSON POST body)

The handler sends the trimmed values of these named fields (identical across both
copies):

```json
{
  "name":     "string (required)",
  "email":    "string (required, validated)",
  "company":  "string",
  "website":  "string",
  "role":     "string",
  "interest": "string (from the Primary interest select)",
  "notes":    "string (optional)"
}
```

`Content-Type: application/json`. Fields are always present (empty string if the
user left them blank), except that submission is blocked unless `name` and
`email` are valid.

## Candidate backends

Any endpoint that accepts a JSON POST works. Options, cheapest-first:

- **Supabase insert** — a small Edge Function (or PostgREST endpoint) that
  inserts the payload into a `beta_applications` table. Add a server-side check
  and rate-limit; never expose a service-role key in `config.js`.
- **Resend notification** — a serverless function that emails the team the
  application (good for low volume; pair with storage if you want a record).
- **CRM / webhook** — HubSpot form endpoint, a Zapier/Make catch hook, or any
  marketing-CRM intake URL that accepts JSON.

Whatever you pick, the browser only knows a single POST URL — keep all secrets on
the server side of that URL.

## How to test

- **Placeholder (today):** load the page, submit the beta form with a valid name
  + email → expect the "not connected yet" message and a console log of the
  payload; **no** success state.
- **Validation:** submit with an empty name or a malformed email → expect an
  inline error and a red border on the offending field(s); confirm there is **no**
  red border before the first submit.
- **Wired:** set `betaEndpoint` to a test URL (e.g. a request-bin), submit, and
  confirm the POST body matches the shape above and the genuine success message
  appears only on a `2xx`.
- Run both the desktop (`#beta`) and mobile (`#beta-m`) copies — they must behave
  identically.
