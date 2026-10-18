# VitalKick website

Static site: plain HTML, CSS and JavaScript, no build step, plus two small server functions for booking calls.

- `index.html`: home page with the scroll-driven story and the biomarker explorer
- `research.html`: page for sponsors, CROs and health systems
- `biomarkers.html`: every reading with an icon card and a four-point detail panel
- `book.html`: book a 30-minute call with Dr. Bizanti; `thanks.html` is the confirmation page
- `api/`: `availability.js` and `book.js` read and write his Google Calendar (setup in `DEPLOY.md` Step 3)
- `technology.html`: how the scan works, step by step
- `solutions-*.html`: one page per audience (telehealth, check-ins, value-based care, senior living, employers)
- `validation.html`: validation summary
- `privacy-policy.html`: website privacy policy
- other `.html` files: placeholder pages linked from the footer
- `assets/`: reel video, scroll animation frames, logo, biomarker content (`assets/biomarkers.js`), biomarker icons (`assets/icons.js`)

## Deploy on Vercel and connect the domain

Step-by-step instructions are in [`DEPLOY.md`](DEPLOY.md). In short: a separate Vercel project, Root Directory `website`, framework preset **Other**, no build command.

## Editing copy

All health copy on this site must pass the banned-phrase list in
`vitalkick-app/packages/clinical/src/phrasing.ts` (no diagnosis words, no billing terms, no regulatory claims).
