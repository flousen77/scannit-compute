// Single server-side entry point for every email capture on the site. The
// Make.com endpoints used to sit in client JavaScript, which made them a
// public unauthenticated write path into the CRM, and the browser posted with
// mode:'no-cors' so it could never tell whether a signup actually saved.
const WEBHOOKS = {
  waitlist: process.env.MAKE_WAITLIST_WEBHOOK_URL,
  newsletter: process.env.MAKE_NEWSLETTER_WEBHOOK_URL,
};

const SOURCE_LABELS = {
  waitlist: 'Node Program Waitlist Modal',
  newsletter: 'Node Page Newsletter',
};

// Vercel resolves the visitor's country at the edge, so the country no longer
// costs a client-side round trip to ipapi.co with the visitor's IP attached.
function countryFrom(request) {
  return request.headers.get('x-vercel-ip-country') || 'Unknown';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: 'invalid request' }, { status: 400 });
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim() : '';
  const list = payload?.list === 'newsletter' ? 'newsletter' : 'waitlist';

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return Response.json({ error: 'invalid email' }, { status: 400 });
  }

  const webhook = WEBHOOKS[list];
  if (!webhook) {
    console.error(`Missing webhook env var for list "${list}"`);
    return Response.json({ error: 'signup unavailable' }, { status: 503 });
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        country: countryFrom(request),
        timestamp: new Date().toISOString(),
        source: SOURCE_LABELS[list],
      }),
    });

    if (!res.ok) {
      console.error(`Webhook for "${list}" responded ${res.status}`);
      return Response.json({ error: 'signup failed' }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Webhook request failed:', error);
    return Response.json({ error: 'signup failed' }, { status: 502 });
  }
}
