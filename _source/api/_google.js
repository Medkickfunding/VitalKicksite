// Google Calendar access with a service account. No SDK: a signed JWT and two REST calls.
// Needs GOOGLE_SERVICE_ACCOUNT_KEY (the JSON key, raw or base64) and GOOGLE_CALENDAR_ID.
import crypto from 'node:crypto';

function config() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY, cal = process.env.GOOGLE_CALENDAR_ID;
  if (!raw || !cal) return null;
  try {
    const key = JSON.parse(raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8'));
    return key.client_email && key.private_key ? { key, cal } : null;
  } catch { return null; }
}

let cached = null;
async function token(key) {
  if (cached && cached.exp > Date.now() + 60e3) return cached.value;
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/calendar', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  if (!r.ok) throw new Error(`token ${r.status}`);
  const j = await r.json();
  cached = { value: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return cached.value;
}

async function api(c, path, body) {
  const r = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${await token(c.key)}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`calendar ${r.status}`);
  return r.json();
}

// Busy intervals as [{ start, end }] in ISO strings.
async function busy(c, timeMin, timeMax) {
  const j = await api(c, '/freeBusy', { timeMin, timeMax, items: [{ id: c.cal }] });
  const cal = j.calendars && j.calendars[c.cal];
  if (!cal || (cal.errors && cal.errors.length)) throw new Error('calendar not shared with service account');
  return cal.busy || [];
}

const insert = (c, event) => api(c, `/calendars/${encodeURIComponent(c.cal)}/events`, event);

export { config, busy, insert };
