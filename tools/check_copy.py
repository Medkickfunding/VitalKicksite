"""Check every page's visible text, and the biomarker content, against the app's banned-phrase list.

Run from the repository root:  python3 tools/check_copy.py
Exit code 1 means a violation. The one allowed exception is the estimate badge text
"Estimate — not a lab result", which CLAUDE.md rule 3 requires.
"""
import glob, html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
phrases = json.load(open(os.path.join(ROOT, 'tools', 'banned-phrases.json')))['phrases']
pats = [(p, re.compile(r'\b' + re.escape(p), re.I)) for p in phrases]
neg = re.compile(r"\b(?:does\s?n[o']t|do\s?n[o']t|is\s?n[o']t|not)\s+(?:mean|indicate|suggest)[^.]*\b(?:diabet|hypertens|anemi|anaemi|apnea|apnoea|arrhythmi|disease)", re.I)
ALLOWED = {'Estimate — not a lab result', 'Estimates (not lab results)', '(not lab results)'}

def texts(path):
    s = open(path, encoding='utf-8').read()
    if path.endswith('.js'):
        return [(m.group(1) if m.group(1) is not None else m.group(2)) for m in re.finditer(r"'((?:[^'\\]|\\.)*)'|`([^`]*)`", s)]
    out = []
    for sc in re.findall(r'<script[^>]*>([\s\S]*?)</script>', s):   # strings rendered by page scripts
        out += [(m.group(1) if m.group(1) is not None else m.group(2)) for m in re.finditer(r"'((?:[^'\\]|\\.)*)'|`([^`]*)`", sc)]
    s = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', s)
    s = html.unescape(re.sub(r'<[^>]+>', '\n', s))
    return out + [l.strip() for l in s.split('\n') if l.strip()]

bad = 0
for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))) + [os.path.join(ROOT, 'assets', 'biomarkers.js')]:
    for t in texts(f):
        t2 = t
        for a in ALLOWED: t2 = t2.replace(a, '')
        hits = [p for p, r in pats if r.search(t2)] + (['condition-in-the-negative'] if neg.search(t2) else [])
        if hits:
            bad += 1; print(os.path.basename(f), '|', hits, '|', t.strip()[:140])
print(f'{bad} violation(s), {len(phrases)} phrases checked')
sys.exit(1 if bad else 0)
