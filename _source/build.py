import os, re
# Builds every page of the site from the files in this folder.
#   python3 _source/build.py                  -> writes the pages to the repository root (what Vercel serves)
#   VK_ARTIFACT=/some/dir python3 _source/build.py  -> also writes the claude.ai artifact preview variant there
# The home page is index.body.html. index.body.calm.html is the calmer redesign waiting for approval.
import shutil
SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get('VK_OUT', os.path.dirname(SRC))
ART = os.environ.get('VK_ARTIFACT')
HOME = os.environ.get('VK_HOME', 'index.body.html')
css = open(f'{SRC}/common.css').read()
fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;600&display=swap">'
PHONE, PHONE_HREF = '(305) 753-4452', 'tel:+13057534452'

FOOT = f'''<footer class="sfoot">
  <div class="wrap">
    <div class="cols">
      <div class="brandcol"><a class="brand" href="index.html" aria-label="VitalKick home"></a><p>Vital signs from a 60-second selfie, processed on the phone.</p><a class="tel" href="{PHONE_HREF}">{PHONE}</a></div>
      <div><h4>Product</h4><ul><li><a href="index.html#scan">The 60-second scan</a></li><li><a href="technology.html">How it works</a></li><li><a href="biomarkers.html">Biomarkers</a></li><li><a href="validation.html">Validation</a></li><li><a href="index.html#edge">Privacy &amp; security</a></li></ul></div>
      <div><h4>Solutions</h4><ul><li><a href="solutions-telehealth.html">Telehealth</a></li><li><a href="solutions-checkins.html">Between-visit check-ins</a></li><li><a href="solutions-value-based-care.html">Value-based care</a></li><li><a href="solutions-senior-living.html">Senior living</a></li><li><a href="solutions-employers.html">Employers &amp; wellness</a></li><li><a href="research.html">Research &amp; trials</a></li></ul></div>
      <div><h4>Company</h4><ul><li><a href="about.html">About</a></li><li><a href="book.html">Book a call</a></li><li><a href="contact.html">Contact</a></li><li><a href="careers.html">Careers</a></li><li><a href="press.html">Press</a></li></ul></div>
      <div><h4>Resources</h4><ul><li><a href="faq.html">FAQ</a></li><li><a href="blog.html">Blog</a></li><li><a href="help.html">Help center</a></li></ul></div>
      <div><h4>Legal</h4><ul><li><a href="privacy-policy.html">Privacy policy</a></li><li><a href="terms.html">Terms of use</a></li><li><a href="accessibility.html">Accessibility</a></li></ul></div>
    </div>
    <div class="bottom"><span>© 2026 VitalKick. All rights reserved.</span><span>VitalKick is a general wellness product. Readings support your own wellness and do not replace care from your clinician.</span></div>
  </div>
</footer>'''

NAV = '''<nav class="nav" aria-label="Main"><div class="wrap"><a class="brand" href="index.html" aria-label="VitalKick home"></a><ul><li><a href="technology.html">How it works</a></li><li><a href="biomarkers.html">Biomarkers</a></li><li><a href="validation.html">Validation</a></li><li><a href="research.html">For research</a></li><li><a href="contact.html">Contact</a></li></ul><a class="btn primary" href="book.html">Book a call</a></div></nav>'''

def head(title, desc):
    return f'<title>{title}</title>\n<meta name="description" content="{desc}">\n<meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:image" content="assets/poster.jpg">\n<link rel="icon" href="assets/icon.png">\n{fonts}\n<style>\n{css}\n</style>\n'
def full(title, desc, body):
    return f'<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n{head(title, desc)}</head>\n<body>\n{body}\n</body>\n</html>\n'

def simple(title, inner):
    return f'{NAV}\n<main class="page"><div class="wrap">{inner}</div></main>\n{FOOT}'


import sys; sys.path.insert(0, SRC); import faq_data, solutions_data
UPDATED = 'October 9, 2026'
def legal(label, h1, lede, src):
    raw = open(src).read()
    m = re.search(r'<!--SHORT-->([\s\S]*?)<!--/SHORT-->', raw)
    short, body = (m.group(1), raw.replace(m.group(0), '')) if m else ('', raw)
    toc, n = [], [0]
    def num(mt):
        n[0] += 1; t = mt.group(1); sid = re.sub(r'[^a-z0-9]+', '-', re.sub('<[^>]+>', '', t).lower()).strip('-')
        toc.append(f'<a href="#{sid}"><span>{n[0]:02d}</span>{t}</a>')
        return f'<h2 id="{sid}"><span class="n">{n[0]:02d}</span>{t}</h2>'
    body = re.sub(r'<h2>(.*?)</h2>', num, body)
    sv = f'<div class="shortv"><h2>The short version</h2>{short}</div>' if short else ''
    spy = """<script>(() => { const L = [...document.querySelectorAll('.toc a')]; const H = L.map(a => document.querySelector(a.getAttribute('href')));
addEventListener('scroll', () => { let k = 0; H.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) k = i; }); L.forEach((a, i) => a.classList.toggle('on', i === k)); }, { passive: true }); })();</script>"""
    return f"""{NAV}
<main class="legal"><div class="wrap">
<div class="head"><a class="crumb" href="index.html">← VITALKICK</a><span class="k-label">{label}</span><h1>{h1}</h1><p class="lede">{lede}</p>
<div class="meta"><span>Effective {UPDATED}</span><span>Last updated {UPDATED}</span></div></div>
<div class="cols"><nav class="toc" aria-label="On this page"><b>On this page</b>{''.join(toc)}</nav>
<article>{sv}{body}</article></div>
</div></main>
{spy}
{FOOT}"""

STUBS = {
 'about': ('About', 'Who we are and why VitalKick exists.'),
 'careers': ('Careers', 'Open roles at VitalKick.'),
 'press': ('Press', 'News and media resources.'),
 'blog': ('Blog', 'Notes on camera-based vital signs and everyday wellness.'),
 'help': ('Help center', 'Getting the best scan, and answers for app users.'),
}

os.makedirs(OUT, exist_ok=True)
if ART: os.makedirs(ART, exist_ok=True)
out = {}
ib = open(f'{SRC}/{HOME}').read().replace('<!--FOOTER-->', FOOT).replace('<!--FAQ-->', faq_data.home_section())
out['index'] = ('VitalKick', 'Your vitals from a 60-second selfie. 12 readings from the front camera, processed on your phone.', ib)
rb = re.sub(r'<footer class="foot">[\s\S]*?</footer>', FOOT, open(f'{SRC}/research.body.html').read())
out['research'] = ('VitalKick for Research', 'Find consenting participants who match your pilot or clinical trial target population.', rb)
out['validation'] = ('VitalKick Validation', 'How the rPPG engine inside VitalKick was tested: populations, reference devices and real-world pilots.', simple('Validation', open(f'{SRC}/validation.inner.html').read()))
out['contact'] = ('Contact VitalKick', 'Call VitalKick or request a pilot.', simple('Contact', f'''<a class="crumb" href="index.html">← VITALKICK</a><span class="k-label">Contact</span><h1>Talk to <em>VitalKick.</em></h1><p class="lede">Book a call, or call or text for pilots, partnerships and press.</p><p><a class="tel" href="{PHONE_HREF}" style="font-size:clamp(32px,5vw,52px)">{PHONE}</a></p><div class="btns"><a class="btn primary" href="book.html">Book a call</a><a class="btn ghost" href="research.html#contact">Request a pilot</a></div>'''))
out['biomarkers'] = ('Biomarkers · VitalKick', 'Every reading from the 60-second VitalKick scan, explained in plain language.', f"{NAV}\n{open(f'{SRC}/biomarkers.body.html').read()}\n{FOOT}")
out['book'] = ('Book a call · VitalKick', 'Book a 30-minute call with Sadik Bizanti, MD, founder of VitalKick.', f"{NAV}\n{open(f'{SRC}/book.body.html').read()}\n{FOOT}")
out['thanks'] = ('See you soon · VitalKick', 'Your call with VitalKick is booked.', f"{NAV}\n{open(f'{SRC}/thanks.body.html').read()}\n{FOOT}")
out['privacy-policy'] = ('Privacy policy · VitalKick', 'What VitalKick collects, what it never collects, and the choices you control.', legal('Privacy policy', 'Privacy <em>policy</em>', 'How VitalKick handles information on this website and in the app. The camera video never leaves your phone, and your health data is never sold.', f'{SRC}/privacy.inner.html'))
out['terms'] = ('Terms of use · VitalKick', 'The terms for using the VitalKick website and app.', legal('Terms of use', 'Terms of <em>use</em>', 'The agreement between you and VitalKick for this website and the app, in plain language where the law allows.', f'{SRC}/terms.inner.html'))
out['accessibility'] = ('Accessibility · VitalKick', 'How VitalKick works for people of every ability, and how to tell us about a barrier.', legal('Accessibility', 'Accessibility <em>statement</em>', 'VitalKick is built for people of every age and ability. Here is what we have done, what still falls short, and how to reach us.', f'{SRC}/accessibility.inner.html'))
out['technology'] = ('How it works · VitalKick', 'How VitalKick turns a 60-second selfie video into vital signs, on the phone.', f"{NAV}\n{open(f'{SRC}/technology.body.html').read()}\n{FOOT}")
for k in solutions_data.SOL: out[k] = solutions_data.page(k, NAV, FOOT)
out['faq'] = ('FAQ · VitalKick', 'Answers about the 60-second scan, your readings, privacy, and working with VitalKick.', f"{NAV}\n{faq_data.full_page()}\n{FOOT}")
for k, (t, d) in STUBS.items():
    out[k] = (f'{t} · VitalKick', d, simple(t, f'<a class="crumb" href="index.html">← VITALKICK</a><span class="k-label">{t}</span><h1>{t}</h1><p class="lede">{d}</p><p>This page is being written. In the meantime, call <a class="tel" href="{PHONE_HREF}" style="font-size:inherit">{PHONE}</a>.</p><div class="btns"><a class="btn ghost" href="index.html">Back to the home page</a></div>'))
for k, (t, d, body) in out.items():
    html = full(t, d, body)
    open(f'{OUT}/{k}.html', 'w').write(html)
    if ART:
        open(f'{ART}/{k}.html', 'w').write(head(t, d) + body if k == 'index' else html)
# scripts and booking functions are edited here and copied next to the pages
for f in ('biomarkers.js', 'icons.js', 'skin3d.js'):
    shutil.copy(f'{SRC}/{f}', f'{OUT}/assets/{f}')
os.makedirs(f'{OUT}/api', exist_ok=True)
for f in os.listdir(f'{SRC}/api'):
    shutil.copy(f'{SRC}/api/{f}', f'{OUT}/api/{f}')
print('built', len(out), 'pages')
