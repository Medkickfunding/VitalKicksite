# Solutions pages. One template, five audiences. Wording must pass the banned-phrase list.

STEPS = [
    ('Talk', 'A 30-minute call about who you serve and what you want to learn. <a href="book.html">Book one here.</a>'),
    ('Scope', 'We agree the group, the length of the pilot and how success is measured, such as scans per week or how many people keep going.'),
    ('Agree', 'A short pilot agreement, plus a business associate agreement wherever we handle health information for a provider.'),
    ('Launch', 'People download the app, give their own consent, and scan. We review the results with you at the checkpoints we set together.'),
]

GUARD = [
    ('Wellness, not treatment', 'VitalKick supports conversations with clinicians. It never decides care, and never tells anyone to alter a medicine.'),
    ('Consent from each person', 'Every participant agrees in the app to what is shared and with whom, and can withdraw in one tap.'),
    ('Video stays on the phone', 'Only the computed numbers are stored. No face images or face geometry, ever.'),
    ('Never sold', 'We never sell identifiable health data, and never profit from anything biometric.'),
]

SOL = {
 'solutions-telehealth': dict(
    label='Telehealth', title='Telehealth', h1='Vital signs at the start of <em>every virtual visit.</em>',
    desc='A 60-second camera scan before or during a video visit gives the clinician the numbers an in-person visit takes at the door.',
    lede='A video visit usually starts without the numbers a nurse takes at the door. With VitalKick, the patient scans for 60 seconds from the same phone they join on, and the readings are there when the visit begins.',
    fits=[('Before the visit', 'The patient scans while waiting to be seen. With their consent, the readings arrive with the appointment.'),
          ('During follow-ups', 'A quick rescan mid-visit, for example after sitting quietly for a few minutes.'),
          ('Between visits', 'Readings collected at home since the last appointment show the trend, not just one moment.')],
    readings=['Pulse rate', 'Blood pressure', 'Oxygen saturation', 'Breathing rate'],
    note='Camera readings support the conversation. The clinician decides when to confirm a number with their own instruments.'),
 'solutions-checkins': dict(
    label='Between-visit check-ins', title='Between-visit check-ins', h1='See the weeks <em>between appointments.</em>',
    desc='Daily or weekly 60-second scans and simple trends between appointments, with a same-day prompt that is always on.',
    lede='Most of a person\'s health happens between appointments, where nobody sees it. A one-minute scan at home, a few times a week, turns those weeks into a trend the person and their care team can both read.',
    fits=[('Simple routine', 'One scan in the morning, at the same time each day. Gentle reminders, no equipment to set up.'),
          ('Trends people understand', 'Each reading sits on a colour range with a written label, and the app points to the two or three numbers worth attention.'),
          ('Habits next to numbers', 'People log medicines, meals and exercise, so changes in their readings have context.'),
          ('Same-day prompt', 'If one reading crosses an urgent level, the app suggests getting checked that day. It cannot be switched off.')],
    readings=['Blood pressure', 'Pulse rate', 'Heart rate variability', 'Stress level'],
    note='VitalKick is a general wellness product. It does not replace scheduled care.'),
 'solutions-value-based-care': dict(
    label='Value-based care', title='Value-based care', h1='Regular readings across <em>a whole panel.</em>',
    desc='Frequent home readings across every enrolled member, with transparent flags your own clinicians set.',
    lede='Programs built on keeping people well need to hear from them more than once or twice a year. VitalKick gives every enrolled member a one-minute check they can do at home on their own phone, and gives the care team a view of who is scanning and how readings are moving.',
    fits=[('Reach the whole panel', 'Nothing to ship, fit or return. Anyone with a smartphone can take part on day one.'),
          ('Flags you can read', 'Your clinicians set the thresholds. A flag says exactly why it fired, for example "top number 152, above the 140 your team set, third scan in a row". No opaque scores.'),
          ('Engagement you can see', 'Scans per member per week and who has gone quiet, so outreach goes where it is needed.'),
          ('Organisation dashboard', 'In development. Pilots today run on the app with reports agreed at the start.')],
    readings=['Blood pressure', 'Pulse rate', 'Oxygen saturation', 'Heart rate variability'],
    note='Care decisions stay with your clinicians. VitalKick supports clinical work; it does not do it.'),
 'solutions-senior-living': dict(
    label='Senior living', title='Senior living', h1='A one-minute check, <em>nothing to strap on.</em>',
    desc='Quick, frequent vital-sign checks for older adults at home or in a community, with no cuffs, clips or wearables.',
    lede='Cuffs, finger clips and wearables get lost, go uncharged or are hard to put on. VitalKick needs only a phone or tablet camera and a minute of sitting still, so checks can happen often, at home or in a community.',
    fits=[('Easy for anyone', 'Large text, plain words, and every reading labelled in writing as well as in colour.'),
          ('Help is welcome', 'A carer, family member or staff member can hold the phone. A stand works too.'),
          ('Family in the loop', 'With the person\'s consent, trends can be shared with family or with their clinician.'),
          ('Same-day prompt', 'An urgent reading brings a calm prompt to get checked that day, every time.')],
    readings=['Pulse rate', 'Blood pressure', 'Oxygen saturation', 'Breathing rate'],
    note='VitalKick is not an emergency service. In an emergency, call 911.'),
 'solutions-employers': dict(
    label='Employers & wellness', title='Employers & wellness', h1='A one-minute check <em>people actually repeat.</em>',
    desc='A private, one-minute wellness check for teams and members, with group-level reports only.',
    lede='Most wellness programs ask people to fill in forms once a year. VitalKick gives them something more interesting: their own vital signs in a minute, from their own phone, as often as they like, with habits that move the numbers.',
    fits=[('Private by design', 'Each person\'s readings belong to them. Employers see participation and de-identified group trends, never an individual\'s readings.'),
          ('Stress and recovery', 'Heart rate variability and stress level show how sleep, workload and rest show up in the body.'),
          ('Habits that stick', 'Short, specific suggestions for movement, sleep and food, tied to the person\'s own numbers.'),
          ('Group reports', 'Any group smaller than 20 people is never shown, so nobody can be singled out.')],
    readings=['Heart rate variability', 'Stress level', 'Blood pressure', 'Pulse rate'],
    note='Readings are never used for decisions about employment, pay or insurance.'),
}


def page(key, NAV, FOOT):
    s = SOL[key]
    fits = ''.join(f'<div class="tk-card"><span class="n">{i:02d}</span><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(s['fits'], 1))
    chips = ''.join(f'<a class="chip" href="biomarkers.html">{r}</a>' for r in s['readings'])
    steps = ''.join(f'<div class="tk-card"><span class="n">STEP {i}</span><h3>{t}</h3><p>{d}</p></div>' for i, (t, d) in enumerate(STEPS, 1))
    guard = ''.join(f'<div class="tk-card"><h3>{t}</h3><p>{d}</p></div>' for t, d in GUARD)
    others = ''.join(f'<a class="chip" href="{k}.html">{v["label"]}</a>' for k, v in SOL.items() if k != key) + '<a class="chip" href="research.html">Research &amp; trials</a>'
    body = f'''<style>
.sl-hero {{ padding-block: clamp(110px, 12vw, 150px) 30px }} .sl-hero .wrap {{ display: grid; gap: 20px }} .sl-hero .wrap > * {{ max-width: 860px }}
.tk-sec {{ padding-block: clamp(44px, 6vw, 80px); border-top: 1px solid var(--line) }}
.tk-cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 16px; margin-top: 26px }}
.tk-card {{ border: 1px solid var(--line); border-radius: 20px; padding: 22px; background: linear-gradient(160deg, color-mix(in srgb, var(--mint) 6%, var(--panel)), var(--panel) 60%); display: grid; gap: 10px; align-content: start }}
.tk-card .n {{ font: 600 12px var(--mono); color: var(--mint); letter-spacing: .12em }} .tk-card h3 {{ font-size: 19px; margin: 0 }} .tk-card p {{ margin: 0; color: var(--muted); font-size: 15px }} .tk-card a {{ color: var(--mint) }}
.chips {{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px }}
.chip {{ font: 600 14px var(--body); color: var(--text); text-decoration: none; border: 1px solid color-mix(in srgb, var(--mint) 35%, transparent); border-radius: 999px; padding: 10px 16px; min-height: 44px; display: inline-flex; align-items: center }}
.chip:hover {{ border-color: var(--mint) }}
.note {{ margin-top: 22px; border-left: 3px solid var(--amber); padding: 4px 0 4px 16px; color: var(--muted); max-width: 760px }}
</style>
{NAV}
<header class="sl-hero"><div class="wrap">
  <a class="crumb" href="index.html">← VITALKICK</a><span class="k-label">Solutions · {s["label"]}</span>
  <h1>{s["h1"]}</h1><p class="lede">{s["lede"]}</p>
  <div class="btns"><a class="btn primary" href="book.html">Book a call</a><a class="btn ghost" href="research.html#contact">Plan a pilot</a></div>
</div></header>
<section class="tk-sec"><div class="wrap"><span class="k-label">Where it fits</span><h2 style="margin-top:12px">How VitalKick <em>works here.</em></h2><div class="tk-cards">{fits}</div></div></section>
<section class="tk-sec"><div class="wrap"><span class="k-label">The readings that matter most</span><h2 style="margin-top:12px">Twelve readings, <em>these four first.</em></h2><p class="lede" style="max-width:720px">Every scan gives all twelve. For this setting, these are the ones people look at first.</p><div class="chips">{chips}</div><p class="note">{s["note"]}</p></div></section>
<section class="tk-sec"><div class="wrap"><span class="k-label">How a pilot runs</span><h2 style="margin-top:12px">From first call <em>to launch.</em></h2><div class="tk-cards">{steps}</div></div></section>
<section class="tk-sec"><div class="wrap"><span class="k-label">Guardrails</span><h2 style="margin-top:12px">What we always do, <em>and never do.</em></h2><div class="tk-cards">{guard}</div></div></section>
<section class="tk-sec"><div class="wrap"><div class="shortv" style="max-width:960px"><h2>Talk it through with the founder.</h2><p style="margin:0">30 minutes with Sadik Bizanti, MD, about your setting and what a pilot would look like.</p><div class="btns"><a class="btn primary" href="book.html">Book a call</a><a class="btn ghost" href="technology.html">How the technology works</a></div></div>
<p class="k-label" style="margin-top:40px">Other solutions</p><div class="chips">{others}</div></div></section>
{FOOT}'''
    return (f'{s["title"]} · VitalKick', s['desc'], body)
