// GET /api/availability -> { slots: [ISO start, ...], minutes }
import { config, busy } from './_google.js';
import { candidateSlots, SLOT_MIN } from './_slots.js';

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  const c = config();
  if (!c) return res.status(503).json({ configured: false });
  try {
    const all = candidateSlots();
    if (!all.length) return res.status(200).json({ slots: [], minutes: SLOT_MIN });
    const end = new Date(all[all.length - 1].getTime() + SLOT_MIN * 60e3);
    const b = (await busy(c, all[0].toISOString(), end.toISOString())).map(x => [Date.parse(x.start), Date.parse(x.end)]);
    const free = all.filter(s => {
      const a = s.getTime(), z = a + SLOT_MIN * 60e3;
      return !b.some(([bs, be]) => a < be && z > bs);
    });
    res.status(200).json({ slots: free.map(s => s.toISOString()), minutes: SLOT_MIN });
  } catch (e) {
    console.error('availability', e.message);
    res.status(502).json({ error: 'calendar unavailable' });
  }
}
