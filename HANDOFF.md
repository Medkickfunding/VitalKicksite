# HANDOFF — VitalKick website

Written 2026-10-20 by the Claude session that built this site, for the Claude account taking over. Read this, then `CLAUDE.md` (rules), then `.claude/skills/vitalkick-website/SKILL.md` (how to work).

## Start here

Paste this to the new Claude Code session, with this repository attached:

> You are taking over the VitalKick website. Read HANDOFF.md, CLAUDE.md and .claude/skills/vitalkick-website/SKILL.md, then tell me in plain words what is live, what is waiting on me, and what you will do next. Do not change anything until I answer.

## What is live

- **https://vitalkick.sireenai.com** (and https://vitalkick-website.vercel.app), served by the Vercel project `vitalkick-website`, which deploys this repository's `main` branch automatically.
- 22 pages: home, How it works (`technology`), Biomarkers, Validation, For research (with a cohort builder on simulated data), five Solutions pages, Book a call, Thank you, FAQ, Contact, Privacy policy, Terms of use, Accessibility, and placeholders for About, Careers, Press, Blog and Help.
- The home page on `main` is the original cinematic version: pinned scroll scenes, the 60-second reel, a three.js skin cross-section, a face-mesh scene, a history timeline and a chrome logo finale. On 2026-10-20 two fixes went live: the biomarker explorer now steps one reading per scroll on desktop, and the history heading no longer runs off the right edge.

## Waiting on the owner

| Item | State | What is needed |
| --- | --- | --- |
| Calm home page | Built on branch `calm-home` (and in `_source/index.body.calm.html`). Normal scrolling, a still hero with an example scan card, a "For pharma, CROs and research teams" section, the film only on request, the chrome logo at about a third of its old size | He asked for "elegant and elite for a pharmaceutical company, less dramatic". He has not said approve yet. On approval: merge `calm-home` into `main` |
| Domain | vitalkick.com is **not his** (German owner since 2002, united-domains). He chose `vitalkick.sireenai.com` instead, and it works | If he wants a .com: buy one he can own (for example getvitalkick.com) in Vercel, or make an offer on vitalkick.com through a broker with legal advice |
| Google Calendar booking | Code is built and tested against a mocked Google API. Not connected | His Google account steps in `DEPLOY.md` Step 3, then two Vercel environment variables |
| Legal pages | Privacy policy, Terms, Accessibility written from the app's decisions | Attorney review before the app launches. Also needs the company's legal name, state, mailing address and an email address; none exist on the site yet |
| Biomarker copy | All text cites a published source | His clinical sign-off, recorded in his own words |
| Employers page promise | Says employers see group trends only, never one person's readings, and groups under 20 are hidden | He has not formally decided this for employers. Confirm |
| Value-based care page | Says the organisation dashboard is "in development" | True today; update when the dashboard ships |
| Disease-risk scores | He chose to include them; they were left out | Disease claims under D-001. Need attorney sign-off and a D-001 change first |

## Decisions already made (do not reopen without him)

- Scan length is 60 seconds everywhere.
- Contact is his cell, (305) 753-4452. No email address yet.
- No Team page. The founder section names him; there is no founder quote, because he has never given one.
- The rPPG engine is never named ("our rPPG technology partner"). Shen AI is the planned fallback engine, also unnamed, and its numbers and claims are not used.
- Footer layout modelled on shen.ai with placeholder pages.
- His LinkedIn headshot is used on the booking pages with a face-scan overlay (`assets/bizanti-scan.webp`, `assets/bizanti-avatar.png`).

## Where everything lives

| Thing | Location |
| --- | --- |
| This website, source of truth | `Medkickfunding/VitalKicksite` (public). `main` = live, `calm-home` = calm redesign |
| Older copy of the website | `Medkickfunding/vitalkick-app` branch `website`, folder `website/`, pull request #1. Kept in sync until 2026-10-20. Decide with the owner whether to close that PR now that this repository is the live source |
| Another older copy | `med-kick/design-team` branch `vitalkick-website`. Can be deleted once he agrees |
| The app | `Medkickfunding/vitalkick-app` (private). Its `HANDOFF.md` covers the app |
| Reel source | `_reel/` here: `index.html` + `main.js` (three.js scene, 1920 × 1080 at 60 fps), `audio.py` (synthesized soundtrack, `soundtrack.wav`), `render.mjs` (renders a frame range to MP4 through ffmpeg), `seq.mjs` (renders the PNG sequences the home page scrubs through). The 42 MB web render is in `_reel/renders/` |
| Not in any repository | The 1080p60 master (165 MB, over GitHub's 100 MB limit) and the investor deck (private). Re-render the master with `_reel/render.mjs`; get the deck from his Google Drive |

To re-render the reel: `cd _reel && npm install`, serve `_reel` on port 8123, run `node render.mjs <first-frame> <last-frame> part.mp4` in chunks (3600 frames is 60 seconds), join the parts and add `soundtrack.wav` with ffmpeg.

## Skills and instructions that came across

- `CLAUDE.md`: rules for this repository, loaded automatically.
- `.claude/skills/vitalkick-website/`: the working method for this site.
- `.claude/skills/vitalkick-clinical-safety/`: copied from the app repository. Its file paths refer to the app (`packages/clinical/...`, `docs/...`).
- `.claude/skills/human-writing-rules/`: his writing rules. They apply to every reply, not only to site copy.
- The app repository has its own commands (`/vk-audit`, `/vk-demo`, `/vk-explain`, `/vk-next`, `/vk-review`) that load when that repository is attached.

## What did not transfer

- **The claude.ai preview artifact** `claude.ai/artifact/37vTFaxUU6fDbS4S4pqVwV` belongs to the previous account. A new account can view it but not update it. Publish a new artifact if previews are wanted.
- **Connections.** The new account needs GitHub connected with access to `Medkickfunding/VitalKicksite` (and `vitalkick-app` for app work), plus Google Drive and Google Calendar if those are used. The Vercel login is his; Claude has never had it.
- **This conversation.** Everything that matters from it is in this file.

## Security notes

- A "Dashboard Access" document in his Google Drive held plaintext passwords for the MediTrack dashboards. He was told to rotate them. Never copy it anywhere.
- No secrets live in this repository. The Google key belongs only in Vercel environment variables.

## Later, not started

- MediTrack nurse and admin dashboard rebuild (deferred by him). Open questions: where the current code lives, which functions each dashboard needs, and hosting with a BAA.
- Email inbox for the company, then switch the pilot form from text message to email and update the privacy policy.
