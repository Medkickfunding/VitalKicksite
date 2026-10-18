// POST /api/book { start, name, phone, email, org, interest, note, website }
// Re-checks the calendar, then adds the call to Dr. Bizanti's Google Calendar.
import { config, busy, insert } from './_google.js';
import { candidateSlots, SLOT_MIN, TZ } from './_slots.js';

const INTERESTS = {
  practice: 'VitalKick for my patients',
  research: 'Research and clinical trials',
  wellness: 'Employee or member wellness',
};
const clean = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n) : '');

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const c = config();
  if (!c) return res.status(503).json({ configured: false });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true });        // honeypot: bots fill hidden fields

  const name = clean(b.name, 80), phone = clean(b.phone, 30), email = clean(b.email, 120);
  const org = clean(b.org, 120), note = clean(b.note, 600), interest = clean(b.interest, 20);
  const errors = [];
  if (name.length < 2) errors.push('name');
  const digits = phone.replace(/\D/g, '');
  if (phone && (digits.length < 7 || digits.length > 15)) errors.push('phone');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email');
  if (!phone && !email) errors.push('contact');
  if (!INTERESTS[interest]) errors.push('interest');
  const start = Date.parse(b.start);
  if (!candidateSlots().some(s => s.getTime() === start)) errors.push('start');
  if (errors.length) return res.status(400).json({ error: 'invalid', fields: errors });

  const startISO = new Date(start).toISOString(), endISO = new Date(start + SLOT_MIN * 60e3).toISOString();
  try {
    if ((await busy(c, startISO, endISO)).length) return res.status(409).json({ error: 'taken' });
    await insert(c, {
      summary: `VitalKick call: ${name} (${INTERESTS[interest]})`,
      description: [
        `Name: ${name}`, `Phone: ${phone || 'not given'}`, `Email: ${email || 'not given'}`,
        `Organisation: ${org || 'not given'}`, `Interested in: ${INTERESTS[interest]}`,
        note ? `Note: ${note}` : '', '', 'Booked on the VitalKick website.',
      ].filter(x => x !== null).join('\n'),
      start: { dateTime: startISO, timeZone: TZ },
      end: { dateTime: endISO, timeZone: TZ },
      reminders: { useDefault: true },
    });
    res.status(200).json({ ok: true, start: startISO, end: endISO });
  } catch (e) {
    console.error('book', e.message);
    res.status(502).json({ error: 'calendar unavailable' });
  }
}
