---
name: vitalkick-clinical-safety
description: Clinical safety and regulatory rules for the VitalKick health app. Use whenever writing or reviewing code that computes a health metric, renders a health value to a user, writes user-facing health copy, stores or transmits patient data, or touches billing, RPM, or FDA positioning. Also use when reviewing a diff before commit.
---

# VitalKick clinical safety

Apply these on every change that touches health data or health copy. A violation is a bug, regardless of whether tests pass.

## 1. The seven hard rules

1. **Raw video never leaves the device.** The rPPG SDK runs on-device. Frames are never uploaded, written to disk unencrypted, or logged. Only computed numeric results persist.
2. **No diagnosis, ever.** Banned in any user-facing string: "you have <condition>", "diagnosed", "diabetic", "hypertensive", "anemic", "lab result", and any instruction to start, stop, or change a medication or dose. Allowed: where a number sits relative to a published range, plus "discuss this with your clinician".
3. **Estimates are visually distinct from measurements.** `hemoglobin_est`, `hba1c_est`, `cholesterol_total_est` render with the estimate card treatment and an "Estimate — not a lab result" badge, driven by the `isEstimate` flag on the metric registry.
4. **Safety escalation always fires.** Systolic ≥180 or diastolic ≥120; SpO2 <90%; resting HR <40 or >130. Single reading, no `sustained_scans` gate, cannot be dismissed permanently, never behind a paywall or an onboarding step.
5. **All PHI access is audit-logged** by a Postgres trigger, not by application code.
6. **Clinical thresholds live in JSON with a `source` field.** Never `if (systolic > 130)` in a component. If the source is unclear, do not invent it — leave `// CLINICAL-REVIEW:` and add a row to `docs/CLINICAL-REVIEW-QUEUE.md`.
7. **Rules decide, an LLM only rephrases.** Deterministic rules in `packages/clinical/rules/` decide what is significant. An LLM may only reword pre-approved text, validated against the banned-phrase list before display. It never sees raw metric values and never generates a claim.

## 2. Regulatory positioning (see `docs/DECISIONS.md` D-001)

VitalKick is a **general wellness product**. Not a medical device, not FDA-cleared, not a billing tool. Staying inside FDA's General Wellness policy — low-risk, general wellness intent, no disease claims — is what lets this ship. Treat it as a design constraint.

Banned everywhere — app, marketing site, exports, README, commit messages:
- "FDA approved", "FDA cleared", "FDA registered", "medical device", "prescription"
- "clinically validated", "diagnostic", "medical grade"
- Any reference to Medicare, RPM, CCM, CPT codes, or billing in user-facing copy

**No billing logic belongs in this app.** No CPT codes, no days-with-data counters, no clinical time tracking. If a task seems to call for it, stop and ask.

Every metric value carries its source, and readings from different sources are always visually distinguishable on screen. A camera reading and a wearable reading must never look identical.

## 3. Demo safety

The `/demo` route uses a **separate Supabase project** containing only synthetic patients. It cannot reach real patient data. Never make this a feature flag — a flag gets flipped by accident; a different database does not. No demo copy may present a synthetic patient as a real one.

## 4. Review checklist

Before saying a change is done:

- [ ] Any new user-facing health string passed through the banned-phrase check
- [ ] Any new threshold is in JSON with a `source`, and queued for clinical review
- [ ] Any new metric has `isEstimate` AND `polarity` set correctly
- [ ] Every range bar shows the zone in words and the target in numbers — colour is never the only signal
- [ ] No education content or tip renders without a named reviewer, a patient-facing source, and reading level ≤ 8
- [ ] No frame, image, or raw signal is logged, persisted, or transmitted
- [ ] Any new PHI table has RLS and an audit trigger
- [ ] Any new metric value carries its `source`, and the UI shows which source it came from
- [ ] Any new PHI write path checks `has_consent()` at the database, not in the UI
- [ ] Nothing writes a camera frame, face landmark, face template, or embedding to disk, logs, analytics, or a crash report
- [ ] Any research export goes through `packages/deidentify` and nothing else
- [ ] Any provider-dashboard query goes through `can_access_patient()` — never reimplemented inline
- [ ] No flag, badge, or ranking is shown whose reasoning cannot be displayed to the clinician
- [ ] No staff time tracking of any kind — deferred by decision (D-007)
- [ ] `pnpm typecheck && pnpm test && pnpm lint` all pass
- [ ] Accessibility: no meaning conveyed by color alone; touch targets ≥44pt

## 5. When to stop and ask

Stop and ask rather than proceeding when:
- A clinical threshold or health recommendation is needed and no source is available
- A change would put a health claim in front of a user that no rule authorized
- A dependency would receive PHI and has no BAA
- The spec asks for something that conflicts with a rule above
