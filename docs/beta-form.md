# Beta waitlist form — WIRED

**Status: WIRED.** The beta form submits to a real backend:

```
frontend form  ->  POST /api/beta-waitlist  ->  Supabase insert (+ Resend notify)
```

There are two identical copies in `index.html` (desktop `#beta`, mobile
`#beta-m`), each a real `<form data-beta-form novalidate>`. Both behave
identically; the client handler is in `script.js`, the server route is
`api/beta-waitlist.js`, and the endpoint is set in `config.js`
(`betaEndpoint: "/api/beta-waitlist"`).

## Client behavior (`script.js`)

1. Prevents the default submit; fires the no-op `track('beta_submit', …)` hook.
2. Validates **name** (required) and **email** (required + format). Invalid
   fields get a red border **only after a submit attempt** (never on load) plus
   an inline error message.
3. On valid input: disables the submit button (prevents duplicate rapid
   submits), shows "Submitting…", and POSTs JSON to `betaEndpoint` including a
   hidden honeypot field, `page_url` (`location.href`), and `user_agent`.
4. **Success** (`200 { ok: true }`): resets the form and shows a genuine success
   state — *"You're on the list — we'll be in touch."* (or *"You're already on
   the list…"* when the API reports a duplicate). Button re-enabled.
5. **Error** (non-2xx / `ok:false` / network): shows a helpful inline message and
   **re-enables** the button for retry. Never claims success.

If `betaEndpoint` is set back to `null`, the handler reverts to the honest
"not connected yet" placeholder (never a fake success).

## Server route (`api/beta-waitlist.js`)

Vercel Node serverless function. **Zero npm dependencies** — talks to Supabase's
REST (PostgREST) API and Resend's REST API via global `fetch`, so there is no
install step for the function.

Behavior:
- **POST only** (405 otherwise).
- **Honeypot:** if the hidden field is non-empty, returns `200 { ok: true }`
  **without inserting** (drops the bot silently).
- **Email normalization (required):** `email.trim().toLowerCase()` is computed
  **before** validation and used for **both** the insert and duplicate handling,
  so the DB's `UNIQUE(email)` constraint can't be bypassed by casing/whitespace.
- **Validation:** name + email required, email format checked → `400` with a
  clear message on failure.
- **Insert:** into `public.beta_waitlist_leads` using the **service-role key**
  (server-side only); captures `page_url` (from body) and `user_agent` (from the
  request header).
- **Duplicate email:** `UNIQUE` violation (HTTP 409 / Postgres `23505`) is a
  **soft success** → `200 { ok: true, duplicate: true }`, not an error.
- **Success is gated on the insert.** A non-duplicate insert failure returns
  `500` with a neutral message — it never claims success.
- **Resend notify (non-blocking):** after a successful insert, emails
  `BETA_NOTIFY_EMAIL` from `support@fuzely.ai` (verified `fuzely.ai` domain) with
  the lead details. If Resend fails, it is **logged** and the request **still
  returns success** — a failed notification never fails the request or causes a
  duplicate.
- Responses are clean JSON (`{ ok: true }` / `{ ok: false, error }`) — **no
  secrets, no stack traces**.

## Required environment variables (Vercel — names only, never commit values)

Set for **Production + Preview**:

| Name | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL (REST base). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — **server-side only**, never in client code. |
| `RESEND_API_KEY` | Resend API key for the notification email. |
| `BETA_NOTIFY_EMAIL` | Recipient of new-lead notifications (e.g. `support@fuzely.ai`). |

The client (`config.js`) knows only the same-origin path `/api/beta-waitlist` —
no secrets ever reach the browser.

## Table shape — `public.beta_waitlist_leads`

`id`, `created_at`, `name`, `email` **(UNIQUE)**, `company`, `website`, `role`,
`interest`, `notes`, `source`, `page_url`, `user_agent`, `status`. RLS enabled,
no public policies (only the service-role route writes).

## JSON payload (client → route)

```json
{
  "name": "string (required)",
  "email": "string (required, validated; normalized server-side)",
  "company": "string",
  "website": "string",
  "role": "string",
  "interest": "string",
  "notes": "string",
  "honeypot": "string (must be empty for a real user)",
  "page_url": "string (location.href)",
  "user_agent": "string (server prefers the request header)"
}
```

## How to test

**Production (after deploy, with the Vercel env vars set):**
- Submit the form on `https://www.fuzely.ai` with a real name + email → expect
  the genuine success message; confirm a row in `beta_waitlist_leads` and a
  notification email at `BETA_NOTIFY_EMAIL`.
- Submit the **same email** again → success message ("already on the list"), **no
  second row**.
- Submit with an empty name or bad email → inline error, no insert.
- Honeypot: via devtools, set the hidden `[data-hp]` input's value and submit →
  `200` success but **no row** inserted.
- Run both desktop (`#beta`) and mobile (`#beta-m`) — identical behavior.

**Local:** the static page can be opened directly, but `/api/beta-waitlist`
only runs under Vercel. Use `vercel dev` (with the same env vars in a local
`.env` that is **git-ignored**) to exercise the route locally, or test against a
Preview deployment.

## Notes

- To use the Supabase JS SDK instead of REST, add `@supabase/supabase-js` to a
  `package.json` and swap the insert call; Vercel will then install it for the
  function. The current zero-dep REST approach avoids that install step.
- `curl` example (do not paste real keys anywhere public):
  `curl -X POST https://www.fuzely.ai/api/beta-waitlist -H 'Content-Type: application/json' -d '{"name":"Test","email":"test@example.com"}'`
