// Booking hours, shared by both functions. Change them here.
// Times are Eastern (America/New_York). Weekdays only.
const TZ = 'America/New_York';
const HOURS = { start: 9, end: 17 };   // first slot 9:00, last slot ends 17:00
const SLOT_MIN = 30;
const DAYS_AHEAD = 14;
const LEAD_HOURS = 4;                  // earliest bookable slot is this far from now

function offsetMin(date) {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(date).find(p => p.type === 'timeZoneName').value; // "GMT-4"
  const m = s.match(/GMT([+-])(\d+)(?::(\d+))?/);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : 0;
}
function etParts(date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short' })
    .formatToParts(date).map(x => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, wd: p.weekday };
}

// Every candidate slot start (UTC Date) in the booking window, before checking the calendar.
function candidateSlots(now = new Date()) {
  const out = [], earliest = now.getTime() + LEAD_HOURS * 3600e3;
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = etParts(new Date(now.getTime() + i * 86400e3));
    if (day.wd === 'Sat' || day.wd === 'Sun') continue;
    const noon = new Date(Date.UTC(day.y, day.m - 1, day.d, 16));
    const off = offsetMin(noon);
    for (let t = HOURS.start * 60; t + SLOT_MIN <= HOURS.end * 60; t += SLOT_MIN) {
      const ms = Date.UTC(day.y, day.m - 1, day.d, 0, t) - off * 60e3;
      if (ms >= earliest && !out.some(s => s.getTime() === ms)) out.push(new Date(ms));
    }
  }
  return out;
}

export { TZ, SLOT_MIN, DAYS_AHEAD, candidateSlots };
