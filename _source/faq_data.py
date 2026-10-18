# FAQ content, used by faq.html (all of it) and the home page (the HOME picks).
# Health wording must pass the banned-phrase list in vitalkick-app/packages/clinical/src/phrasing.ts.

PHONE_LINK = '<a href="tel:+13057534452">(305) 753-4452</a>'

FAQ = [
  ('scan', 'The scan', [
    ('How can a selfie video read my vital signs?',
     '<p>Each heartbeat pushes a little more blood into the skin of your face. That changes the colour of your skin by an amount too small for your eyes to see, but a phone camera can pick it up.</p>'
     '<p>During the 60-second scan, the rPPG engine follows those changes across your forehead and cheeks and turns them into a pulse wave. Your readings are worked out from that wave. rPPG stands for remote photoplethysmography: measuring blood flow with light, without touching you.</p>'),
    ('Which readings does one scan give me?',
     '<p>Twelve numbers from one scan:</p><ul><li>Pulse rate, blood pressure (top and bottom numbers), oxygen saturation and breathing rate</li>'
     '<li>Heart rate variability, stress level, pulse-respiration quotient, and the balance between the "alert" and "rest" sides of your nervous system (two numbers)</li>'
     '<li>Estimates of hemoglobin and HbA1c, clearly labelled as estimates</li></ul>'
     '<p>The <a href="biomarkers.html">Biomarkers page</a> explains each one in plain language.</p>'),
    ('Why does the scan take a full minute?',
     '<p>Pulse rate is ready after about 20 seconds, but heart rate variability needs about 50 seconds of heartbeats before the number means anything. A one-minute scan gives every reading enough data.</p>'),
    ('How do I get the best reading?',
     '<ul><li>Sit down and rest for 5 minutes first.</li><li>Face a window or a lamp so the light is even on your face. Avoid strong light behind you.</li>'
     '<li>Hold the phone at eye level, or rest it on something steady.</li><li>Keep still and do not talk during the scan.</li>'
     '<li>Move hair, hats or glasses away from your forehead and cheeks.</li><li>Scan at about the same time each day so your trend compares like with like.</li></ul>'),
    ('Does it work for every skin tone?',
     '<p>Our technology partner tested the engine on people with Fitzpatrick skin types II to VI, a body mass index from 19 to 48, women and men, and a range of ethnicities and health conditions. The <a href="validation.html">Validation page</a> has the details.</p>'),
    ('What phone do I need?',
     '<p>VitalKick is built for iPhone and Android phones with a working front camera. There is nothing to wear and nothing extra to buy.</p>'),
  ]),
  ('results', 'Your results and your health', [
    ('How accurate are the readings?',
     '<p>The engine was compared against established reference devices: a chest strap for pulse and heart rate variability, a pulse oximeter, an arm blood pressure cuff, a respiration belt, and blood draws for the two estimates. The <a href="validation.html">Validation page</a> lists them.</p>'
     '<p>Any single reading can be thrown off by poor light, movement or talking. Your trend over days and weeks tells you more than one scan. If a number matters for a decision, check it with a home cuff or with your clinician.</p>'),
    ('Does VitalKick replace my doctor or nurse?',
     '<p>No. VitalKick is a general wellness product. It helps you see where your numbers sit against published ranges, follow them over time, and pick up healthier habits. It does not replace care from your clinician. Bring your trends to your next visit; they make a good conversation starter.</p>'),
    ('What happens if a reading is very high or very low?',
     '<p>If one reading crosses an urgent level, VitalKick shows a calm message before anything else: "These numbers are high enough that they are worth getting checked today." It appears when:</p>'
     '<ul><li>the top blood pressure number is 180 or more, or the bottom number is 120 or more</li><li>oxygen saturation is below 90%</li><li>resting pulse is below 40 or above 130</li></ul>'
     '<p>This message cannot be turned off. If you feel chest pain, trouble breathing or think it is an emergency, call 911.</p>'),
    ('Why are hemoglobin and HbA1c marked as estimates?',
     '<p>They are worked out from the blood-flow signal, not measured from a blood sample. VitalKick shows them on a different card with an amber "Estimate" badge and no range labels. Only a blood test can confirm them. If an estimate trends up or looks different from usual, ask your clinician whether a test makes sense.</p>'),
    ('Will VitalKick tell me what to do about my medicines?',
     '<p>No. VitalKick never tells anyone to begin, end or alter a medicine or a dose. You can log your medicines in the app to see them next to your trends, and any decision about them stays between you and your clinician.</p>'),
  ]),
  ('privacy', 'Privacy and your data', [
    ('Is my face video uploaded or saved?',
     '<p>No. The video is processed on your phone while you scan, and the frames are discarded when the scan ends. VitalKick never uploads it, never saves it, and never stores face images or face geometry. Only the computed numbers are kept.</p>'),
    ('Who can see my readings?',
     '<p>You can. Nobody else sees them unless you join a program run by your clinician, employer or a study, and agree to share with them in the app. Every time anyone opens your health data, it is recorded in an access log you can view.</p>'
     '<p>We never sell identifiable health data, and we never sell, lease or profit from anything biometric.</p>'),
    ('Do you use my data for research?',
     '<p>Only if you say yes. Research is a separate, optional consent, and the app works fully without it. If you agree, your data is stripped of anything that identifies you and only ever used in groups of at least 20 people. You can withdraw in one tap, and future research use stops within 24 hours.</p>'),
    ('Can I download or delete my data?',
     '<p>Yes. In the app\'s settings you can export everything, delete everything, and see who accessed your data and when. The <a href="privacy-policy.html">Privacy policy</a> explains your rights in full.</p>'),
  ]),
  ('orgs', 'For organisations', [
    ('Can we run a pilot or a study with VitalKick?',
     '<p>Yes. VitalKick works with sponsors, CROs, health systems, employers and senior living groups. The <a href="research.html">For research page</a> shows how we find consenting participants who match your target population, with a cohort builder you can try. Or <a href="book.html">book a call</a> to talk it through.</p>'),
    ('How do you find people who match our study?',
     '<p>You set the criteria, such as age, region and scan-based ranges. We search only people who opted in to research contact, averaging their repeated scans so one odd reading never decides anything. Before anyone consents, you see only de-identified counts, with groups under 20 suppressed. Your site then confirms every criterion with its own instruments.</p>'),
    ('Do you sign a business associate agreement?',
     '<p>Yes. Where VitalKick handles patient information on behalf of a provider or health plan, we sign a business associate agreement and follow HIPAA\'s rules for that data.</p>'),
  ]),
  ('contact', 'Booking and contact', [
    ('How do I talk to the founder?',
     f'<p><a href="book.html">Book a 30-minute call</a> with Sadik Bizanti, MD. Pick a time and it goes straight into his calendar. You can also call or text {PHONE_LINK}.</p>'),
    ('How do I reach VitalKick?',
     f'<p>Call or text {PHONE_LINK}. For pilots, the <a href="research.html#contact">pilot request form</a> sends your details by text message.</p>'),
  ]),
]

# Questions shown on the home page, as (group id, question index).
HOME = [('scan', 0), ('scan', 3), ('results', 1), ('results', 3), ('privacy', 0), ('orgs', 0)]


def qa(q, a, i):
    return (f'<div class="qa"><h3><button type="button" aria-expanded="false" aria-controls="qa{i}" id="qb{i}">'
            f'<span>{q}</span><span class="pm" aria-hidden="true"></span></button></h3>'
            f'<div class="ans" id="qa{i}" role="region" aria-labelledby="qb{i}"><div><div class="in">{a}</div></div></div></div>')


# One open answer at a time: opening a question closes the one before it.
SCRIPT = '''<script>
document.querySelectorAll('[data-faq]').forEach(root => {
  const items = [...root.querySelectorAll('.qa')];
  const set = (el, open) => { el.classList.toggle('open', open); el.querySelector('button').setAttribute('aria-expanded', open); el.querySelector('.ans').inert = !open; };
  items.forEach(el => { set(el, false); el.querySelector('button').addEventListener('click', () => {
    const open = !el.classList.contains('open');
    items.forEach(o => set(o, o === el && open));
  }); });
  if (root.dataset.faq === 'first' && items[0]) set(items[0], true);
});
</script>'''


def full_page():
    cats = ''.join(f'<a href="#{g}">{t}</a>' for g, t, _ in FAQ)
    groups, i = [], 0
    for n, (g, t, qs) in enumerate(FAQ, 1):
        rows = []
        for q, a in qs:
            i += 1; rows.append(qa(q, a, i))
        groups.append(f'<section class="faq-group" id="{g}" style="padding:0"><h2><span class="n">{n:02d}</span>{t}</h2>{"".join(rows)}</section>')
    return f'''<main class="legal"><div class="wrap">
<div class="head"><a class="crumb" href="index.html">← VITALKICK</a><span class="k-label">FAQ</span>
<h1>Questions, <em>answered.</em></h1>
<p class="lede">How the scan works, what your numbers mean, what happens to your data, and how organisations work with us. Tap a question to open it.</p>
<div class="faq-cats">{cats}</div></div>
<div data-faq="first" style="max-width:900px">{"".join(groups)}</div>
<div class="shortv" style="max-width:900px;margin-top:48px"><h2>Still have a question?</h2><p style="margin:0">Call or text {PHONE_LINK}, or book a call with the founder.</p><div class="btns"><a class="btn primary" href="book.html">Book a call</a><a class="btn ghost" href="tel:+13057534452">Call (305) 753-4452</a></div></div>
</div></main>
{SCRIPT}'''


def home_section():
    look = {g: qs for g, _, qs in FAQ}
    rows = ''.join(qa(*look[g][k], f'h{n}') for n, (g, k) in enumerate(HOME))
    return f'''<section id="faq">
  <div class="wrap">
    <div class="sec-head"><span class="k-label">FAQ</span><h2>Questions, <em>answered.</em></h2><p class="lede">The ones we hear most. Tap a question to open it.</p></div>
    <div data-faq="" style="display:grid;gap:12px;max-width:900px">{rows}</div>
    <div class="btns" style="margin-top:28px"><a class="btn ghost" href="faq.html">See all questions →</a><a class="btn primary" href="book.html">Book a call</a></div>
  </div>
</section>
{SCRIPT}'''
