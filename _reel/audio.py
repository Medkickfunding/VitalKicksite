import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import wave

SR = 48000
DUR = 60.0
N = int(SR * DUR)
rng = np.random.default_rng(12)
L = np.zeros(N); Rr = np.zeros(N)          # dry bus
RV = np.zeros(N)                           # reverb send (mono)
MUS = np.zeros((2, N))                     # music bus (ducked by sfx impacts)

def hz(n): return 440 * 2 ** ((n - 69) / 12)
def env_ad(n, a, d):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / d)
    return e
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def put(sig, t, gain=1.0, pan=0.0, rev=0.0, bus=None):
    i = int(t * SR)
    if i >= N: return
    sig = sig[: N - i] * gain
    if bus is None:
        L[i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
        Rr[i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414
    else:
        bus[0, i:i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
        bus[1, i:i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414
    if rev: RV[i:i + len(sig)] += sig * rev

def noise(n): return rng.standard_normal(n)

# ---------------- instruments ----------------
def kick(gain=1.0):
    n = int(.45 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7.5)
    s += lp(noise(n), 3000) * np.exp(-t * 120) * .25
    return np.tanh(s * 1.6) * gain
def clap():
    n = int(.35 * SR); t = np.arange(n) / SR
    e = np.exp(-t * 18) + .6 * np.exp(-((t - .012) * 300) ** 2) + .5 * np.exp(-((t - .024) * 300) ** 2)
    return bp(noise(n), 900, 5000) * e * .5
def hat(open_=False):
    n = int((.25 if open_ else .06) * SR); t = np.arange(n) / SR
    return hp(noise(n), 7000, 4) * np.exp(-t * (14 if open_ else 70)) * .35
def saw(f, n, det=0.0):
    t = np.arange(n) / SR
    ph = (t * f * (1 + det)) % 1.0
    return 2 * ph - 1
def pad(notes, dur, gain=.12, cutoff=1400):
    n = int(dur * SR); s = np.zeros(n)
    for m in notes:
        for d in (-.006, 0, .007):
            s += saw(hz(m), n, d)
    s = lp(s, cutoff, 2)
    t = np.arange(n) / SR
    e = np.minimum(t / .6, 1) * np.minimum((dur - t) / .5, 1)
    return s * np.clip(e, 0, 1) * gain / len(notes)
def pluck(m, dur=.5, gain=.25, bright=4000):
    n = int(dur * SR); t = np.arange(n) / SR
    f = hz(m)
    s = (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 9) + .25 * saw(f, n) * np.exp(-t * 20))
    return lp(s, bright) * np.exp(-t * 6) * gain
def sub(m, dur, gain=.35):
    n = int(dur * SR); t = np.arange(n) / SR
    e = np.minimum(t / .01, 1) * np.minimum((dur - t) / .03, 1)
    return np.sin(2 * np.pi * hz(m) * t) * np.clip(e, 0, 1) * gain

# ---------------- sfx ----------------
def impact(size=1.0):
    n = int(2.2 * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t * 14)) / SR) * np.exp(-t * 2.6)
    crack = lp(noise(n), 2500) * np.exp(-t * 22) * .6
    air = bp(noise(n), 200, 6000) * np.exp(-t * 5) * .15
    return np.tanh((boom * 1.2 + crack + air) * 1.3) * size
def slam():
    n = int(1.0 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * np.cumsum(55 + 140 * np.exp(-t * 30)) / SR) * np.exp(-t * 6)
    snap = bp(noise(n), 1500, 9000) * np.exp(-t * 45) * .7
    return np.tanh((body + snap) * 1.5)
def whoosh(dur=.6, up=True, lo=300, hi=6000):
    n = int(dur * SR); t = np.arange(n) / SR; x = noise(n); out = np.zeros(n)
    blk = 1024
    for i in range(0, n, blk):
        k = i / n if up else 1 - i / n
        fc = lo * (hi / lo) ** k
        seg = x[max(0, i - 2048):i + blk]
        y = bp(seg, max(fc * .6, 40), min(fc * 1.6, SR / 2 - 100))
        out[i:i + blk] = y[-len(out[i:i + blk]):]
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** (1.6 if up else 1.2)
    if up: e = e * np.clip(t / dur * 1.4, 0, 1)
    return out * e * .9
def riser(dur=1.5):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 200 * (8 ** (t / dur))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * .25 + saw(1, n) * 0
    w = whoosh(dur, True, 400, 9000)
    return (tone + w) * (t / dur) ** 2
def tick(f=3200, gain=.4):
    n = int(.05 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + hp(noise(n), 4000) * np.exp(-t * 500) * .5) * gain
def click():
    n = int(.04 * SR); t = np.arange(n) / SR
    c = hp(noise(n), 2000) * (np.exp(-t * 900) + .6 * np.exp(-((t - .018) * 1500) ** 2))
    return c * .6
def ping(m, gain=.3, dur=.9):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 3.01 * f * t) * np.exp(-t * 8)) * np.exp(-t * 5) * gain
def heartbeat(gain=1.0):
    n = int(.6 * SR); t = np.arange(n) / SR
    def thump(t0, a):
        tt = np.clip(t - t0, 0, None)
        return np.sin(2 * np.pi * np.cumsum(np.where(t >= t0, 48 + 30 * np.exp(-tt * 30), 0)) / SR) * np.exp(-tt * 14) * (t >= t0) * a
    return np.tanh((thump(0, 1) + thump(.18, .65)) * 1.6) * gain
def drop():
    n = int(.5 * SR); t = np.arange(n) / SR
    f = 500 + 1600 * (1 - np.exp(-t * 60))
    plip = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)
    return plip * .6
def glitch(dur=.1):
    n = int(dur * SR); t = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * (180 + 900 * rng.random()) * t)) * .3
    sq = np.round(sq * 4) / 4
    return (sq + hp(noise(n), 3000) * .3) * (rng.random(n // 400 + 1).repeat(400)[:n] > .35) * np.exp(-t * 10)
def scan_sweep(dur=1.7):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 900 - 500 * t / dur
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (.6 + .4 * np.sin(2 * np.pi * 14 * t))
    s += bp(noise(n), 2000, 5000) * .2
    return s * np.sin(np.pi * t / dur) * .22
def chime():
    n = int(1.4 * SR); t = np.arange(n) / SR
    a = np.sin(2 * np.pi * hz(88) * t) * np.exp(-t * 4)
    b = np.sin(2 * np.pi * hz(93) * t) * np.exp(-np.clip(t - .09, 0, None) * 4) * (t > .09)
    return (a + b) * .25
def metal_ring(f0=196, dur=4.0):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for r, a, d in [(1, 1, 1.2), (2.76, .6, .8), (5.40, .35, .5), (8.93, .2, .35), (13.3, .1, .25)]:
        s += np.sin(2 * np.pi * f0 * r * t + rng.random() * 6) * a * np.exp(-t / d / 1.6)
    return s * .18
def shimmer(dur=1.4, dens=60):
    n = int(dur * SR); s = np.zeros(n)
    for _ in range(int(dens * dur)):
        i = int(rng.random() * (n - 4000)); m = 84 + rng.integers(0, 4) * 3 + rng.integers(0, 3) * 12
        g = ping(m, .05, .08)
        s[i:i + len(g)] += g
    t = np.arange(n) / SR
    return s * (t / dur)
def swish(): return whoosh(.32, True, 1200, 9000) * .5

# ---------------- music ----------------
BEAT = .5
# progression (Dm9 - Bbmaj7 - Fmaj7 - C6/9), 2 bars each (4 s)
PROG = [[50, 53, 57, 60, 64], [46, 50, 53, 57, 62], [41, 45, 48, 52, 57], [48, 52, 55, 62, 64]]
ROOT = [38, 34, 41, 36]
def chord_at(t): return int((t // 4) % 4)

def music():
    # drone 0-9
    n = int(9.2 * SR); t = np.arange(n) / SR
    dr = (saw(hz(38), n) + saw(hz(38), n, .004) + .5 * saw(hz(45), n, -.003))
    dr = lp(dr, 400) * np.minimum(t / 1.5, 1) * .07
    dr *= np.clip((9.2 - t) / .3, 0, 1)
    put(dr, 0, 1, 0, .3, MUS)
    # tension pulse 3.5 - 9: 8th-note low synth
    for k in range(int((9.0 - 3.5) / .25)):
        tt = 3.5 + k * .25
        p = pluck(38 if k % 4 else 50, .24, .14, 600 + 120 * k)
        put(p, tt, 1, (-.3 if k % 2 else .3), .15, MUS)
        if k % 2 == 1: put(hat(), tt, .5, .4, 0, MUS)
    # main sections
    sections = [(9.0, 17.0, 'A'), (17.0, 27.0, 'B'), (27.0, 35.0, 'B'), (35.0, 42.0, 'C'), (42.0, 49.75, 'D')]
    for (a, b, kind) in sections:
        nb = int(round((b - a) / BEAT))
        for k in range(nb):
            tt = a + k * BEAT
            if kind == 'C' and k % 2: pass
            else: put(kick(.9 if kind != 'A' else .75), tt, 1, 0, 0, MUS)
            if kind in 'BD' and k % 2 == 1: put(clap(), tt, .8, .1, .25, MUS)
            put(hat(k % 2 == 1 and kind == 'D'), tt + .25, .55, .35, 0, MUS)
            if kind in 'BD': put(hat(), tt + .125, .25, -.35, 0, MUS); put(hat(), tt + .375, .25, -.35, 0, MUS)
        # pads + sub per chord (4s)
        tt = a
        while tt < b - 1e-6:
            ci = chord_at(tt); d = min(4.0, b - tt)
            put(pad(PROG[ci], d + .4, .2 if kind != 'C' else .16, 1100 if kind == 'A' else 1800), tt, 1, 0, .35, MUS)
            for k in range(int(d / BEAT)):
                put(sub(ROOT[ci], BEAT * .9, .3), tt + k * BEAT, 1, 0, 0, MUS)
            tt += 4.0
        # arps
        if kind in 'ABD':
            step = .25 if kind != 'D' else .125
            k = 0; tt = a
            while tt < b - 1e-6:
                ci = chord_at(tt); notes = PROG[ci]
                m = notes[(k * 2) % len(notes)] + (12 if kind != 'A' else 12)
                put(pluck(m, .35, .09 if kind == 'A' else .11, 2500 if kind == 'A' else 4500), tt, 1, np.sin(k * .7) * .6, .3, MUS)
                tt += step; k += 1
    # outro: big chord at 52.6
    put(pad([50, 57, 60, 64, 69], 7.4, .3, 2400), 52.6, 1, 0, .6, MUS)
    put(pad([38, 45], 7.4, .25, 500), 52.6, 1, 0, .2, MUS)
    for k, m in enumerate([74, 76, 81, 84, 81, 76]):
        put(pluck(m, 1.2, .1, 5000), 53.1 + k * .5, 1, (k % 2 - .5), .6, MUS)

music()

# ---------------- sfx timeline (mirrors main.js) ----------------
put(heartbeat(.9), .3, 1, 0, .2); put(heartbeat(.6), 1.0 - .02, .5, 0, .2)
for tt in (1.0, 1.5, 2.0, 2.5): put(slam(), tt, .55, 0, .25)
put(riser(.45), 2.6, .4, 0, .2); put(whoosh(.35, False, 300, 5000), 3.0, .5, 0, .2); put(swish(), 3.4, .7, 0, .2)
for i, tt in enumerate((4.0, 4.5, 5.0, 5.5)):
    put(slam(), tt, .5, 0, .2); put(glitch(.1), tt, .25, (-.5 if i % 2 else .5), 0); put(swish(), tt + .2, .35, .3, 0)
put(ping(62, .2, 2.0), 6.2, 1, -.2, .6); put(ping(69, .2, 2.0), 6.55, 1, .2, .6)
put(shimmer(1.4, 70), 7.3, .9, 0, .5); put(riser(1.4), 7.35, .35, 0, .3)
put(whoosh(.3, False, 500, 6000), 8.72, .6, 0, .2)
put(drop(), 9.32, 1, 0, .6); put(impact(.6), 9.32, 1, 0, .3)
for k in range(7): put(heartbeat(.55), 10.0 + k, 1, 0, .1)
put(shimmer(1.2, 40), 14.2, .7, 0, .5); put(ping(81, .18, 2.2), 15.3, 1, 0, .6)
put(riser(.75), 16.25, .7, 0, .3); put(impact(1.0), 17.0, .9, 0, .35)
for tt in (17.1, 17.3, 17.5): put(swish(), tt, .3, .2, 0)
put(tick(2400, .5), 17.45, 1, -.2, .1); put(tick(3600, .5), 17.6, 1, -.2, .1)
put(impact(.4), 18.5, .6, 0, .3); put(scan_sweep(1.7), 18.7, 1, 0, .3)
for i in range(3): put(tick(2800, .4), 19.2 + i * .25, 1, .5, .1)
for tt in (18.8, 19.15, 19.5): put(swish(), tt, .25, -.2, 0)
put(whoosh(.9, True, 200, 4000), 20.6, .6, 0, .2); put(impact(.5), 21.0, .7, 0, .3)
for k in range(26): put(tick(2000 + 40 * k, .18), 21.05 + k * .1, 1, .4, 0)
put(chime(), 23.6, 1, .3, .5)
for i in range(5): put(click(), 24.2 + i * .16, .9, .4, .05); put(ping(76 + [0, 3, 5, 7, 10][i], .06, .3), 24.2 + i * .16, 1, .4, .2)
for tt in (21.5, 21.8): put(swish(), tt, .3, -.3, 0)
put(riser(.8), 26.2, .7, 0, .3); put(impact(.9), 27.0, .9, 0, .35)
put(whoosh(1.6, True, 150, 3000), 27.75, .6, 0, .2)
for i in range(8): put(click(), 28.0 + i * .08 + .4, .7, (i / 7 - .5), .1)
put(impact(.45), 29.45, .7, 0, .35)
for i in range(8): put(tick(3000 + 200 * i, .25), 29.3 + i * .12, 1, (i / 7 - .5) * .8, .1)
for i in range(8): put(ping(79 + [0, 2, 4, 7, 9, 12, 14, 16][i], .07, .5), 30.1 + i * .3, 1, (i / 7 - .5), .3)
for tt in (29.6, 29.85, 30.1): put(swish(), tt, .25, -.4, 0)
put(whoosh(.9, False, 200, 4000), 32.7, .6, 0, .2); put(impact(.4), 33.5, .6, 0, .2)
put(whoosh(.7, True, 400, 3000), 33.4, .3, 0, 0)
put(click(), 34.4, 1.4, .1, .2); put(ping(86, .1, .5), 34.42, 1, .1, .3)
put(riser(.3), 34.7, .5, 0, .1); put(impact(.8), 35.0, .8, 0, .35)
scale = [62, 64, 67, 69, 72, 74, 76, 79]
for i in range(8): put(pluck(scale[i] + 12, .6, .16, 6000), 35.5 + i * .25, 1, (i / 7 - .5) * .8, .35); put(click(), 35.5 + i * .25, .5, (i / 7 - .5) * .8, 0)
put(impact(.35), 38.5, .6, 0, .3)
for i in range(3): put(ping([74, 78, 81][i], .14, 1.0), 38.55 + i * .15, 1, (i - 1) * .5, .4)
put(swish(), 38.9, .4, 0, 0); put(whoosh(.7, True, 300, 5000), 39.9, .5, .5, .2)
put(riser(.7), 41.3, .6, 0, .2); put(impact(.9), 42.0, .9, 0, .35)
# chart draw tone
n = int(2.3 * SR); tt_ = np.arange(n) / SR
put(np.sin(2 * np.pi * np.cumsum(500 + 500 * tt_ / 2.3) / SR) * .05 * np.sin(np.pi * tt_ / 2.3), 42.5, 1, 0, .3)
for tt in (43.25, 44.05): put(ping(81, .12, .6), tt, 1, .3, .3); put(click(), tt, .6, .3, 0)
n = int(1.7 * SR); tt_ = np.arange(n) / SR
put(np.sin(2 * np.pi * np.cumsum(900 - 400 * tt_ / 1.7) / SR) * .04 * np.sin(np.pi * tt_ / 1.7), 44.9, 1, .5, .3)
for i in range(3): put(ping([76, 79, 83][i], .12, .7), 45.7 + i * .3, 1, .5, .3)
for i in range(12): put(pluck(62 + [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26][i], .25, .07, 7000), 46.6 + i * .11, 1, (i / 11 - .5), .2)
put(impact(.35), 47.6, .6, 0, .3); put(swish(), 48.45, .4, 0, 0)
put(riser(1.25), 49.7, .8, 0, .4)
put(whoosh(1.5, True, 200, 3000), 51.05, .5, 0, .3); put(shimmer(1.5, 50), 51.1, .5, 0, .5)
n = int(.5 * SR); tt_ = np.arange(n) / SR
put(np.flip(lp(noise(n), 3000) * np.exp(-tt_ * 6)) * .5, 52.1, 1, 0, .5)  # reverse swell
put(impact(1.25), 52.6, 1, 0, .5); put(metal_ring(196, 4.5), 52.6, 1, -.2, .6); put(metal_ring(293.7, 4), 52.62, .7, .2, .6)
put(whoosh(.9, True, 800, 9000), 54.4, .4, 0, .3)
for i in range(14): put(tick(4200, .07), 55.6 + i * .05, 1, (i / 13 - .5), .1)

# ---------------- mix ----------------
# sidechain music under impacts (simple envelope from sfx low band)
sfx_env = np.abs(lp(L + Rr, 150))
k = int(.15 * SR); sfx_env = np.convolve(sfx_env, np.ones(k) / k, 'same')
duck = 1 - np.clip(sfx_env * 1.2, 0, .45)
mus = MUS * duck
# reverb IR
irn = int(2.6 * SR); it = np.arange(irn) / SR
ir = noise(irn) * np.exp(-it * 2.6); ir = lp(ir, 6000); ir /= np.sqrt(np.sum(ir ** 2))
RV += (mus[0] + mus[1]) * 0.0
rv = fftconvolve(RV, ir)[:N] * .35
irs = np.roll(ir, 37)
rvL = rv; rvR = fftconvolve(RV, irs)[:N] * .35
outL = L + mus[0] + rvL; outR = Rr + mus[1] + rvR
# gentle master EQ: trim sub rumble, add air
outL = hp(outL, 28); outR = hp(outR, 28)
# fade end
t = np.arange(N) / SR
fe = np.clip((60 - t) / 1.2, 0, 1); outL *= fe; outR *= fe
peak = max(np.max(np.abs(outL)), np.max(np.abs(outR)))
g = 1.4 / peak
outL = np.tanh(outL * g) * .89; outR = np.tanh(outR * g) * .89
st = np.stack([outL, outR], 1)
pcm = (st * 32767).astype(np.int16)
with wave.open('/home/user/reel/soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', peak)
