---
name: vitalkick-website
description: How to change, check, preview and publish the VitalKick marketing website in this repository. Use for any edit to a page, the home page, biomarker content, the FAQ, solutions pages, legal pages, booking, styling, or deployment and domain questions about vitalkick.sireenai.com.
---

# VitalKick website: change, check, publish

## Layout

| Path | What it is |
| --- | --- |
| `_source/` | Everything you edit. `build.py` turns it into the pages |
| `_source/index.body.html` | Home page now live: the original cinematic scroll version |
| `_source/index.body.calm.html` | Calmer home page waiting for owner approval (branch `calm-home`) |
| `_source/*.body.html`, `*.inner.html` | Other page bodies. `*.inner.html` pages use the legal layout (contents list, numbered sections) |
| `_source/faq_data.py` | All FAQ questions; `HOME` picks the six shown on the home page |
| `_source/solutions_data.py` | The five Solutions pages from one template |
| `_source/biomarkers.js` | Biomarker content for the explorer and the Biomarkers page (`VK_MARKERS`, `VK_MORE`) |
| `_source/api/` | Vercel functions for Google Calendar booking |
| root `*.html`, `assets/`, `api/` | Generated and served. Do not hand-edit the HTML |
| `tools/` | `check_copy.py`, `banned-phrases.json`, `shots/shoot.mjs` |
| `_reel/` | Source of the 60-second motion reel (three.js scene, synthesized soundtrack, render scripts) |

## Every change, in order

1. Edit `_source/`.
2. Build: `python3 _source/build.py`. To build the calm home page instead: `VK_HOME=index.body.calm.html python3 _source/build.py`.
3. Copy check: `python3 tools/check_copy.py`. Must print `0 violation(s)`.
4. Look at it:
   ```
   (cd tools && npm install)              # once
   python3 -m http.server 8123 &          # from the repository root
   node tools/shots/shoot.mjs index.html /tmp
   ```
   Read both screenshots. Sideways overflow must be 0 on desktop (1440 px) and iPhone (390 px). The owner reviews on a 1371 × 904 laptop and an iPhone, so check those sizes for layout changes.
5. Commit (conventional commits) and push.
   - `main` = live. Vercel publishes it to vitalkick.sireenai.com within about a minute.
   - Any other branch = Vercel preview. The owner finds it in Vercel → `vitalkick-website` → Deployments. Use a branch for anything he has not approved.
6. Tell the owner what changed in plain words, and what to tap to see it.

## Gotchas learned the hard way

- `html { scroll-behavior: smooth }` is global. In screenshot scripts, add `html{scroll-behavior:auto!important}` or scroll positions will be wrong.
- A wide flex track inside a CSS grid stretches the column and pushes headings off screen. Give such grids `grid-template-columns: minmax(0, 1fr)`.
- A 16:9 video set to "cover" on an upright phone is about four times wider than the screen and crops any text inside it. On narrow screens fit the width.
- Inline `<script>` strings are rendered text too. `check_copy.py` scans them.
- The booking page calls `/api/availability`. Without the two Google variables in Vercel it falls back to "Send request by text", which is expected.
- Vercel ignores `_source`, `_reel`, `tools`, `.claude` and the Markdown files through `.vercelignore`. Keep it that way.

## Claude.ai preview artifact (optional)

Pages can also be shown as a claude.ai artifact. Build the artifact variant with `VK_ARTIFACT=/path/to/dir python3 _source/build.py`, then publish `index.html` from that folder with the other pages and the changed assets as `files`. The artifact made by the previous Claude account (`claude.ai/artifact/37vTFaxUU6fDbS4S4pqVwV`) belongs to that account and cannot be edited from a new one. Publish a new one, and say so to the owner.

## Domains

- `vitalkick.sireenai.com` is attached to the Vercel project. sireenai.com's DNS is run by Vercel, so subdomains need no DNS steps.
- `vitalkick.com` is **not** the owner's: registered since 2002 at united-domains GmbH by an owner in Germany (public WHOIS, checked 2026-10-20). Do not tell him to change DNS for it.
- To add a domain he does own: Vercel → `vitalkick-website` → Settings → Domains → Add, then copy the records Vercel shows into his DNS provider. Never delete MX or TXT records.

## Google Calendar booking

Setup steps are in `DEPLOY.md` Step 3. In short: a Google Cloud service account with the Calendar API enabled; the owner shares his calendar with it ("Make changes to events"); Vercel environment variables `GOOGLE_SERVICE_ACCOUNT_KEY` (the JSON key) and `GOOGLE_CALENDAR_ID`; redeploy. Booking rules (weekdays 9 to 5 Eastern, 30 minutes, 4 hours to 14 days ahead) are at the top of `_source/api/_slots.js` and repeated in `_source/book.body.html`; change both together.
