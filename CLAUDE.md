# CLAUDE.md — VitalKick website

**Read `HANDOFF.md` first.** It has the current state, what is waiting on whom, and the next steps. This file is the rules.

## What this repository is

The public marketing website for VitalKick, a general wellness app that reads vital signs from a 60-second selfie video (rPPG). Static HTML, CSS and JavaScript, plus two small Vercel functions for booking calls into Google Calendar.

- Live: https://vitalkick.sireenai.com (Vercel project `vitalkick-website`, deploys `main` automatically)
- Also: https://vitalkick-website.vercel.app
- The app itself lives in a separate private repository, `Medkickfunding/vitalkick-app`. Its `CLAUDE.md`, `HANDOFF.md` and `docs/DECISIONS.md` are the source of truth for every clinical and regulatory rule. This site must never say anything the app is not allowed to say.

## The owner

Sadik Bizanti, MD, founder and CEO. A physician, not a coder. Plain language, and click-by-click steps for anything he has to do himself, usually in Safari on his iPhone. His standing instruction: *"If something in the spec is wrong, unclear, or a bad idea, say so instead of building it. I would much rather be interrupted than shipped something plausible and wrong."*

His messages are often dictated, so expect speech-to-text slips ("For Sale" means Vercel, "Paige" means page, "unprofessional" once meant professional, "binaries" meant biomarkers). Read for intent and confirm when a slip changes the meaning.

## How to change the site

Never edit the generated `.html` files in the root by hand. They are rebuilt from `_source/`.

1. Edit files in `_source/` (page bodies, `common.css`, `biomarkers.js`, `faq_data.py`, `solutions_data.py`, `api/`).
2. `python3 _source/build.py` rewrites every page in the root and copies the scripts into `assets/` and `api/`.
3. `python3 tools/check_copy.py` must report 0 violations.
4. Screenshot desktop and iPhone: see `.claude/skills/vitalkick-website/SKILL.md`.
5. Commit with conventional commits. Pushing `main` publishes to the live site within about a minute. For anything the owner has not approved, push a branch instead: Vercel builds a preview for every branch.

## Non-negotiable copy rules

Breaking one of these is a bug, however good the page looks.

1. **General wellness only** (app `docs/DECISIONS.md` D-001). No diagnosis, no disease claims, no medication instructions, no "FDA cleared", "clinically validated", "medical device", "diagnostic" or "medical grade", and none of these even in the negative ("not a medical device" is also banned). No billing words: Medicare, RPM, CCM, CPT, reimbursement.
2. **The banned-phrase list** in `tools/banned-phrases.json` is copied from the app's `packages/clinical/src/phrasing.ts`. Watch the traps: "you have" is banned, so "if you have questions" fails; "guideline" is banned in patient-facing text; "monitor your" is banned.
3. **Estimates look different.** Hemoglobin and HbA1c always carry the badge "Estimate — not a lab result", amber dashed styling, and no range labels.
4. **The same-day safety prompt** wording, approved by Dr. Bizanti: "These numbers are high enough that they are worth getting checked today." Thresholds: systolic ≥ 180 or diastolic ≥ 120; SpO2 < 90%; resting pulse < 40 or > 130.
5. **No disease-risk scores** (diabetes risk, stroke risk and the like). The owner asked for them once; they were left out because they are disease claims under D-001. They need his attorney's sign-off and a change to D-001 first.
6. **Never invent** a statistic, a quote, a customer, a source or an approval. Founder quotes in particular: the owner has never given one, so there is none on the site. Record a clinical sign-off only in his own words.
7. **Ranges and thresholds** on the site mirror the app's `packages/clinical/src/reference-ranges.json`, and every one names its published source.

## Vendors

- The rPPG engine is licensed and is **never named**. Say "our rPPG technology partner". The Validation page describes the primary engine's testing.
- Shen AI is the planned **fallback** engine (owner's decision, 2026-10-14). It stays unnamed. Do not copy Shen's numbers, claims, customer quotes or logos onto this site: they describe a different engine.
- When the vendor licence lands, its brand name joins the app's vendor denylist, and the app's leak test fails on that name in any `.js`, `.json`, `.ts` or `.yaml` file. Keep vendor names out of this repository entirely.

## Privacy

The site sets no cookies and runs no analytics. Adding analytics, a chat widget, a form service or anything else that collects data means updating `privacy-policy` first, and asking the owner. Anything that would handle health information needs a BAA: say so and stop.

## Writing

All prose for the owner, including chat replies, follows `.claude/skills/human-writing-rules/SKILL.md`: no em dashes, no filler vocabulary, specific numbers, short and long sentences mixed, and no closing pleasantries.
