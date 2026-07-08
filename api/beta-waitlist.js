// Vercel serverless function (Node) — beta waitlist intake.
//
//   frontend form  ->  POST /api/beta-waitlist  ->  Supabase insert (+ Resend notify)
//
// Secrets come from process.env ONLY (never hardcoded, never logged, never
// returned): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
// BETA_NOTIFY_EMAIL. Zero npm deps — uses the Supabase REST (PostgREST) API and
// the Resend REST API via global fetch (Node 18+), so Vercel needs no install
// step for this function.

module.exports = async function handler(req, res) {
  // POST only.
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const NOTIFY_EMAIL = process.env.BETA_NOTIFY_EMAIL;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('[beta-waitlist] missing Supabase env configuration');
    return res.status(500).json({ ok: false, error: 'Server is not configured. Please try again later.' });
  }

  // Parse JSON body (Vercel usually pre-parses; guard for string/empty).
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  // Honeypot: a real user never fills the hidden field. If present, silently
  // drop the bot and return SUCCESS without inserting (don't tip off the bot).
  if (typeof body.honeypot === 'string' && body.honeypot.trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const str = function (v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; };

  // Normalize email server-side BEFORE validation AND before insert — the DB
  // UNIQUE constraint compares exact bytes, so we must always store the
  // normalized form or "Steve@x.com" and "steve@x.com" become two rows.
  const email = str(body.email, 320).toLowerCase();
  const name = str(body.name, 200);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name) return res.status(400).json({ ok: false, error: 'Name is required.' });
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'A valid email is required.' });

  const row = {
    name: name,
    email: email,
    company: str(body.company, 200),
    website: str(body.website, 400),
    role: str(body.role, 200),
    interest: str(body.interest, 200),
    notes: str(body.notes, 2000),
    source: 'marketing_site',
    page_url: str(body.page_url, 500),
    user_agent: str(req.headers['user-agent'], 500),  // from the request, server-side
    status: 'new',
  };

  // --- Insert via Supabase PostgREST with the service-role key (server-only) ---
  let insertRes;
  try {
    insertRes = await fetch(SUPABASE_URL.replace(/\/+$/, '') + '/rest/v1/beta_waitlist_leads', {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(row),
    });
  } catch (err) {
    console.error('[beta-waitlist] supabase network error:', err && err.message);
    return res.status(500).json({ ok: false, error: 'Could not save right now. Please try again.' });
  }

  if (!insertRes.ok) {
    let detail = '';
    try { detail = await insertRes.text(); } catch (e) { /* ignore */ }
    // Duplicate email (UNIQUE violation, Postgres 23505 / HTTP 409) -> SOFT
    // SUCCESS. They're already on the list; that's not an error.
    if (insertRes.status === 409 || /23505|duplicate key|already exists/i.test(detail)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }
    console.error('[beta-waitlist] supabase insert failed:', insertRes.status, String(detail).slice(0, 300));
    return res.status(500).json({ ok: false, error: 'Could not save right now. Please try again.' });
  }

  // --- Insert succeeded. Notify via Resend — NON-BLOCKING: a failed
  //     notification must never fail the request or cause a re-submit. ---
  if (RESEND_API_KEY && NOTIFY_EMAIL) {
    try {
      const mailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Fuzely Beta <support@fuzely.ai>',   // verified fuzely.ai domain
          to: [NOTIFY_EMAIL],
          subject: 'New beta application: ' + name,
          text: [
            'Name: ' + name,
            'Email: ' + email,
            'Company: ' + row.company,
            'Website: ' + row.website,
            'Role: ' + row.role,
            'Interest: ' + row.interest,
            'Notes: ' + row.notes,
            'Page: ' + row.page_url,
          ].join('\n'),
        }),
      });
      if (!mailRes.ok) console.error('[beta-waitlist] resend notify non-ok:', mailRes.status);
    } catch (err) {
      console.error('[beta-waitlist] resend notify error:', err && err.message);
    }
  }

  return res.status(200).json({ ok: true });
};
