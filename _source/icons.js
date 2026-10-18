// Line icons for each reading, drawn on a 64x64 grid inside a HUD ring.
(() => {
  const P = {
    pulse: '<path d="M32 46c-9-6-15-11-15-18a8 8 0 0 1 15-4 8 8 0 0 1 15 4c0 7-6 12-15 18z"/><path class="acc" d="M14 31h8l3-6 4 12 3-9 2 3h16"/>',
    bp: '<path d="M16 40a16 16 0 0 1 32 0"/><path d="M19 33l3 1M24 27l2 2M32 24v3M40 27l-2 2M45 33l-3 1"/><path class="acc" d="M32 40l7-10"/><circle class="accf" cx="32" cy="40" r="2.6"/>',
    spo2: '<path d="M32 15c6 8 12 14 12 21a12 12 0 0 1-24 0c0-7 6-13 12-21z"/><circle class="acc" cx="28" cy="37" r="3"/><circle class="acc" cx="36" cy="37" r="3"/><path class="acc" d="M31 37h2"/>',
    breath: '<path d="M32 16v14M32 24l-5 5M32 24l5 5"/><path d="M27 24c-6-1-10 7-10 15 0 4 3 6 6 5l4-2c1-6 1-12 0-18z"/><path d="M37 24c6-1 10 7 10 15 0 4-3 6-6 5l-4-2c-1-6-1-12 0-18z"/><path class="acc" d="M12 48h40"/>',
    hrv: '<path d="M12 34h5l2-8 3 14 2-6h5l2-9 3 15 2-6h8l2-7 3 12 2-5h2"/><path class="acc" d="M19 46h10M33 46h7M44 46h6"/>',
    stress: '<path d="M18 46V40M25 46V35M32 46V30M39 46V25M46 46V20"/><path class="acc" d="M15 22c5-3 9 3 14 0s9-3 14 0 6 2 6 2"/>',
    prq: '<path d="M22 38c-5-3-8-6-8-10a4.5 4.5 0 0 1 8-2.5 4.5 4.5 0 0 1 8 2.5c0 4-3 7-8 10z"/><path d="M38 34c4-6 8-6 12 0s8 6 8 0" transform="translate(-4 0)"/><path class="acc" d="M29 44h6M32 41v6"/><text class="t" x="32" y="22" text-anchor="middle">4:1</text>',
    ans: '<circle cx="32" cy="32" r="13"/><path class="accf" d="M32 19a6.5 6.5 0 0 1 0 13 6.5 6.5 0 0 0 0 13 13 13 0 0 1 0-26z"/><circle cx="32" cy="25.5" r="1.8"/><circle class="accf" cx="32" cy="38.5" r="1.8" style="fill:var(--ink)"/>',
    hb: '<ellipse cx="25" cy="30" rx="10" ry="8"/><ellipse class="acc" cx="25" cy="30" rx="4.5" ry="3.2"/><ellipse cx="40" cy="38" rx="9" ry="7"/><ellipse class="acc" cx="40" cy="38" rx="4" ry="2.8"/>',
    a1c: '<path d="M32 18l11 6.5v13L32 44l-11-6.5v-13z"/><path d="M43 24.5l6-3.5M21 24.5l-6-3.5M32 44v6"/><circle class="accf" cx="49" cy="21" r="2"/><circle class="accf" cx="15" cy="21" r="2"/><circle class="accf" cx="32" cy="50" r="2"/><path class="acc" d="M27 31h10M27 36h7"/>',
  };
  window.vkIcon = (key, size = 56, cls = '') => `<svg class="vk-ico ${cls}" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <circle class="ring" cx="32" cy="32" r="30"/><circle class="ring2" cx="32" cy="32" r="26.5"/>
    <g class="glyph">${P[key] || ''}</g></svg>`;
})();
