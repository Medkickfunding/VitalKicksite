import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// ---------- helpers ----------
const W = 1920, H = 1080, FPS = 60;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const E = {
  outExpo: t => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
  inExpo: t => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
  inOutExpo: t => t <= 0 ? 0 : t >= 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outCubic: t => 1 - Math.pow(1 - t, 3),
  inCubic: t => t * t * t,
  inOutCubic: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outQuint: t => 1 - Math.pow(1 - t, 5),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const MINT = '#62E6CF', INK = '#030506', OFF = '#E9F2F0', CORAL = '#FF5A4E', AMBER = '#F2B84B', BLUE = '#4C7DF0';
const gauss = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s));
function ecg(p) { const f = p - Math.floor(p); return 0.1 * gauss(f, .16, .03) - .14 * gauss(f, .29, .008) + 1 * gauss(f, .31, .009) - .3 * gauss(f, .33, .01) + .2 * gauss(f, .55, .05); }

const c2d = document.getElementById('c2d'), g = c2d.getContext('2d');
const hud = document.getElementById('hud'), h = hud.getContext('2d');
const glc = document.getElementById('gl');
const webEl = document.getElementById('web'), pageEl = document.getElementById('page');

function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function font(ctx, w, s, fam = 'Inter', style = '') { ctx.font = `${style} ${w} ${s}px ${fam}`; }
function text(ctx, s, x, y, o = {}) {
  ctx.save();
  font(ctx, o.w || 600, o.size || 40, o.fam || 'Inter', o.style || '');
  ctx.letterSpacing = (o.ls || 0) + 'px';
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  ctx.globalAlpha *= (o.alpha ?? 1);
  if (o.stroke) { ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.color || OFF; ctx.strokeText(s, x, y); }
  else { ctx.fillStyle = o.color || OFF; ctx.fillText(s, x, y); }
  ctx.restore();
}
// per-character staggered reveal
function stagger(ctx, s, x, y, t, t0, o = {}) {
  const d = o.d ?? 0.025, dur = o.dur ?? 0.45, size = o.size || 40;
  const baseA = ctx.globalAlpha;
  ctx.save(); font(ctx, o.w || 600, size, o.fam || 'Inter', o.style || ''); ctx.letterSpacing = (o.ls || 0) + 'px';
  const total = ctx.measureText(s).width;
  let sx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  ctx.textAlign = 'left'; ctx.fillStyle = o.color || OFF;
  for (let i = 0; i < s.length; i++) {
    const pre = ctx.measureText(s.slice(0, i)).width;
    const k = inv(t0 + i * d, t0 + i * d + dur, t), e = E.outCubic(k);
    if (k <= 0) continue;
    ctx.globalAlpha = baseA * (o.alpha ?? 1) * clamp(k * 2.2);
    const dy = (1 - e) * size * (o.rise ?? .6);
    if (o.blur && k < 1) ctx.filter = `blur(${(1 - e) * o.blur}px)`; else ctx.filter = 'none';
    ctx.fillText(s[i], sx + pre, y + dy);
  }
  ctx.restore();
}
// masked slide-up reveal for a whole line
function slideUp(ctx, s, x, y, t, t0, o = {}) {
  const k = E.outExpo(inv(t0, t0 + (o.dur || .55), t)); if (k <= 0) return;
  const size = o.size || 40;
  ctx.save(); ctx.beginPath(); ctx.rect(0, y - size * 1.05, W, size * 1.35); ctx.clip();
  text(ctx, s, x, y + (1 - k) * size * 1.2, o); ctx.restore();
}
function cover(ctx, img, zoom = 1, fx = .5, fy = .5, alpha = 1) {
  const s = Math.max(W / img.width, H / img.height) * zoom, w = img.width * s, hh = img.height * s;
  ctx.save(); ctx.globalAlpha = alpha; ctx.drawImage(img, (W - w) * fx, (H - hh) * fy, w, hh); ctx.restore();
}
function rr(ctx, x, y, w, hh, r) { ctx.beginPath(); ctx.roundRect(x, y, w, hh, r); }

// ---------- timeline ----------
const SC = [
  { t0: 0, t1: 9, n: '01', name: 'KINETIC TYPOGRAPHY', sub: 'PER-GLYPH TIMING · TEXT-TO-PARTICLE' },
  { t0: 9, t1: 17, n: '02', name: 'LIQUID & PHYSICS SIMULATION', sub: 'METABALL FLUID · REFRACTION · BALLISTIC SPLASH' },
  { t0: 17, t1: 27, n: '03', name: 'APP & UI ANIMATION', sub: 'PHOTOSCANNED HEAD · 3D DEVICE · LIVE UI' },
  { t0: 27, t1: 35, n: '04', name: '3D WEBSITE BREAKDOWN', sub: 'EXPLODED LAYERS · Z-DEPTH · CSS 3D' },
  { t0: 35, t1: 42, n: '05', name: 'ANIMATED ICONS', sub: 'STROKE DRAW-ON · LOOPING MICRO-MOTION' },
  { t0: 42, t1: 51, n: '06', name: 'DATA VISUALISATION', sub: 'TRENDS · RANGE BARS · RADIAL PROGRESS' },
  { t0: 51, t1: 60, n: '07', name: 'LOGO REVEAL', sub: 'LIQUID CHROME · HDR REFLECTIONS' },
];
const HITS = [1, 1.5, 2, 2.5, 4, 4.5, 5, 5.5, 9.3, 17, 27, 35, 42, 52.6]; // camera shake impulses

// ---------- assets ----------
const A = {};
const rnd = rng(7);

// ---------- three ----------
const R = new THREE.WebGLRenderer({ canvas: glc, antialias: true, alpha: true, preserveDrawingBuffer: true });
R.setPixelRatio(1); R.setSize(W, H, false);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.0;
R.outputColorSpace = THREE.SRGBColorSpace;
const pmrem = new THREE.PMREMGenerator(R);

function studioEnv(mintI = 4, warmI = 2.5) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), new THREE.MeshBasicMaterial({ color: 0x010202, side: THREE.BackSide })));
  const strip = (w, hh, col, I, p) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(I), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); s.add(m); };
  strip(7, 1.4, 0xffffff, 7, [0, 9, 1]);
  strip(1.2, 9, 0x62e6cf, mintI, [-8, 0, 3]);
  strip(1.2, 9, 0xffd7c8, warmI, [8, 1, -1]);
  strip(4, 2.5, 0xffffff, 2.2, [0, 2, 9]);
  strip(10, 0.3, 0xffffff, 3, [0, -3, -9]);
  return pmrem.fromScene(s, 0.015).texture;
}

// ---- liquid scene (S2) ----
const LQ = {};
function buildLiquid() {
  const sc = new THREE.Scene(); LQ.sc = sc;
  sc.environment = studioEnv();
  const cam = new THREE.PerspectiveCamera(32, W / H, .1, 100); LQ.cam = cam;
  // backdrop with bokeh, refracted through the liquid
  LQ.bgU = { uT: { value: 0 }, uMix: { value: 0 } };
  const bc = document.createElement('canvas'); bc.width = 2048; bc.height = 1152; const bx = bc.getContext('2d');
  bx.fillStyle = '#000'; bx.fillRect(0, 0, 2048, 1152);
  const vg = bx.createRadialGradient(1024, 576, 0, 1024, 576, 1100); vg.addColorStop(0, 'rgba(60,70,72,1)'); vg.addColorStop(1, 'rgba(0,0,0,1)'); bx.fillStyle = vg; bx.fillRect(0, 0, 2048, 1152);
  const br = rng(17);
  for (let i = 0; i < 42; i++) { const x = br() * 2048, y = br() * 1152, r = 18 + br() * 90, a = .15 + br() * .5;
    const gd = bx.createRadialGradient(x, y, r * .2, x, y, r); gd.addColorStop(0, `rgba(255,255,255,${a * .6})`); gd.addColorStop(.85, `rgba(255,255,255,${a})`); gd.addColorStop(1, 'rgba(255,255,255,0)');
    bx.fillStyle = gd; bx.beginPath(); bx.arc(x, y, r, 0, 7); bx.fill(); }
  // softbox streaks
  for (const [y, hh, a] of [[300, 26, .9], [880, 10, .5]]) { const lg = bx.createLinearGradient(0, 0, 2048, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, `rgba(255,255,255,${a})`); lg.addColorStop(1, 'rgba(255,255,255,0)'); bx.fillStyle = lg; bx.filter = 'blur(6px)'; bx.fillRect(0, y, 2048, hh); bx.filter = 'none'; }
  const bt = new THREE.CanvasTexture(bc); bt.colorSpace = THREE.SRGBColorSpace;
  LQ.bgMat = new THREE.MeshBasicMaterial({ map: bt, color: 0xffffff });
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(22, 12.4), LQ.bgMat); LQ.bg = bg;
  bg.position.z = -5; sc.add(bg);
  LQ.mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.5, ior: 1.4,
    attenuationColor: new THREE.Color(0xff2a3a), attenuationDistance: 0.9, clearcoat: 1, clearcoatRoughness: 0.03, specularIntensity: 1, envMapIntensity: 1.4 });
  const mc = new MarchingCubes(72, LQ.mat, true, false, 120000); mc.isolation = 80; mc.scale.setScalar(1.9); LQ.mc = mc; sc.add(mc);
  // soft floor glow
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(2, 4, 3); sc.add(key);
}
function beatPulse(t, t0 = 9, period = 1) { // lub-dub
  if (t < t0) return 0; const k = (t - t0) % period; return Math.exp(-k * 9) + .6 * Math.exp(-Math.max(0, k - .18) * 11) * (k > .18 ? 1 : 0);
}
function renderLiquid(t) {
  const u = t - 9, mc = LQ.mc; mc.reset();
  const pulse = beatPulse(t, 10.0, 1.0);
  const sub = 12;
  const cx = .5, cy = .47, cz = .5;
  const N = 7;
  for (let i = 0; i < N; i++) {
    const a = i * 2.39 + u * (.35 + i * .04), r = .07 + .03 * Math.sin(u * .8 + i);
    const s = (.36 + .05 * Math.sin(i * 3.1)) * (1 + .22 * pulse);
    mc.addBall(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a * 1.3) * r * .8, cz + Math.sin(a) * r, s * .8, sub);
  }
  // falling drop + splash physics
  const ti = 9.32;
  if (t < ti) { const k = inv(8.95, ti, t); mc.addBall(cx, lerp(.98, .58, k * k), cz, .07, sub); }
  else {
    const tau = t - ti, gy = -1.9;
    for (let j = 0; j < 6; j++) {
      const ang = j / 6 * Math.PI * 2 + .4, sp = .32 + .06 * (j % 3);
      const vx = Math.cos(ang) * sp * .55, vz = Math.sin(ang) * sp * .55, vy = .7 + .12 * (j % 2);
      let x = cx + vx * tau, y = .56 + vy * tau + .5 * gy * tau * tau, z = cz + vz * tau;
      const life = clamp(1 - tau / 0.85);
      if (life > 0) mc.addBall(x, Math.max(y, .2), z, .045 * life, sub);
    }
    // crown ring wobble
    const w = Math.exp(-tau * 3) * .1; if (w > .005) mc.addBall(cx, .6, cz, w, sub);
  }
  mc.update();
  // colour shift blood -> signal
  const m = E.inOutCubic(inv(14.2, 15.4, t));
  LQ.mat.attenuationColor.setRGB(lerp(1, .25, m), lerp(.12, .95, m), lerp(.16, .82, m));
  LQ.mat.attenuationDistance = lerp(.7, 1.2, m);
  LQ.bgMat.color.setRGB(lerp(1.0, .35, m), lerp(.3, .95, m), lerp(.26, .85, m)).multiplyScalar(.32); LQ.bg.position.x = -1.2 + u * .12; LQ.bg.position.y = .3 - u * .04;
  mc.rotation.y = u * .25; mc.rotation.x = .15 * Math.sin(u * .4);
  // camera dolly, then rush in
  const rush = E.inExpo(inv(16.25, 17, t));
  const z = lerp(4.6, 3.9, E.inOutSine(inv(9, 16.3, t))) - rush * 3.4;
  LQ.cam.position.set(lerp(-.55, -.2, inv(9, 17, t)) * (1 - rush), .05, z); LQ.cam.lookAt(-.55 * (1 - rush) + .0, 0, 0);
  mc.position.x = 0.0;
  R.setClearColor(0x000000, 1); R.render(LQ.sc, LQ.cam);
}

// ---- head scan (S3b) ----
const HD = {};
async function buildHead() {
  const sc = new THREE.Scene(); HD.sc = sc;
  sc.environment = studioEnv(2.5, 1.5); sc.environmentIntensity = .22;
  HD.cam = new THREE.PerspectiveCamera(28, W / H, .01, 100);
  const tl = new THREE.TextureLoader();
  const gltf = await new GLTFLoader().loadAsync('assets/LeePerrySmith.glb');
  const geo = gltf.scene.children[0].geometry; geo.computeBoundingBox();
  const bb = geo.boundingBox, sz = new THREE.Vector3(); bb.getSize(sz); const ctr = new THREE.Vector3(); bb.getCenter(ctr);
  geo.translate(-ctr.x, -ctr.y, -ctr.z); const s = 1.5 / sz.y; geo.scale(s, s, s); geo.computeBoundingBox();
  HD.bb = geo.boundingBox.clone();
  const map = tl.load('assets/Map-COL.jpg'); map.colorSpace = THREE.SRGBColorSpace; map.flipY = false;
  const nrm = tl.load('assets/Infinite-Level_02_Tangent_SmoothUV.jpg'); nrm.flipY = false;
  const spec = tl.load('assets/Map-SPEC.jpg'); spec.flipY = false;
  HD.scanU = { uScan: { value: 2 } };
  const mat = new THREE.MeshPhysicalMaterial({ map, normalMap: nrm, normalScale: new THREE.Vector2(.9, .9), roughness: .68, roughnessMap: spec, sheen: .15, sheenColor: new THREE.Color(0.9, .5, .45), sheenRoughness: .8, specularIntensity: .45 });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uScan = HD.scanU.uScan;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP; uniform float uScan;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
       float band=exp(-pow((vWP.y-uScan)*28.,2.));
       float done=step(uScan,vWP.y);
       vec2 gq=abs(fract(vWP.xy*vec2(26.,26.))-.5);
       float grid=smoothstep(.47,.5,max(gq.x,gq.y));
       totalEmissiveRadiance += vec3(.38,.9,.81)*(band*1.4 + done*grid*.45);`);
  };
  HD.mesh = new THREE.Mesh(geo, mat); sc.add(HD.mesh);
  // landmark points (subsampled vertices) on the scanned side
  const pos = geo.attributes.position, pts = [], pr = rng(3);
  for (let i = 0; i < pos.count; i += 1) { if (pr() < .035 && pos.getZ(i) > -0.05) pts.push(pos.getX(i), pos.getY(i), pos.getZ(i)); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  HD.ptsMat = new THREE.ShaderMaterial({ uniforms: HD.scanU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uScan; varying float vA; void main(){ vec4 w=modelMatrix*vec4(position,1.); vA=step(uScan,w.y)*(.35+.65*exp(-pow((w.y-uScan)*10.,2.))); gl_PointSize=3.2; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vec3(.45,1.,.9)*vA, vA); }` });
  HD.pts = new THREE.Points(pg, HD.ptsMat); HD.pts.position.z = .004; HD.mesh.add(HD.pts);
  const key = new THREE.SpotLight(0xfff1e6, 60, 0, .5, .8); key.position.set(2.2, 1.6, 3.2); sc.add(key);
  const rim1 = new THREE.SpotLight(0x62e6cf, 80, 0, .6, .9); rim1.position.set(-2.4, .8, -2.2); sc.add(rim1);
  const rim2 = new THREE.SpotLight(0x9ff5e6, 40, 0, .6, .9); rim2.position.set(2.6, .5, -2.5); sc.add(rim2);
  const fill = new THREE.PointLight(0x7aa0b0, 2, 0); fill.position.set(-2, -1, 2); sc.add(fill);
  const b = HD.bb;
  HD.anchors = [
    ['ROI 01 · FOREHEAD', new THREE.Vector3(0, b.min.y + (b.max.y - b.min.y) * .74, b.max.z - .17)],
    ['ROI 02 · LEFT CHEEK', new THREE.Vector3(-.21, b.min.y + (b.max.y - b.min.y) * .46, b.max.z - .3)],
    ['ROI 03 · RIGHT CHEEK', new THREE.Vector3(.21, b.min.y + (b.max.y - b.min.y) * .46, b.max.z - .3)],
  ];
}
function renderHead(t) {
  const u = t - 18.5;
  const b = HD.bb;
  HD.mesh.rotation.y = lerp(-.75, .32, E.inOutSine(inv(18.3, 21.2, t)));
  HD.mesh.rotation.x = .05;
  HD.scanU.uScan.value = lerp(b.max.y + .05, b.min.y + .1, E.inOutCubic(inv(18.7, 20.4, t)));
  HD.cam.position.set(-.5, .3, lerp(3.3, 2.95, E.outCubic(inv(18.5, 21, t))));
  HD.cam.lookAt(-.5, .22, 0);
  R.setClearColor(0x000000, 1); R.render(HD.sc, HD.cam);
}
function project(v3, obj, cam) { const v = v3.clone(); obj.localToWorld(v); v.project(cam); return [(v.x * .5 + .5) * W, (-v.y * .5 + .5) * H]; }

// ---- phone (S3c) ----
const PH = {};
function buildPhone() {
  const sc = new THREE.Scene(); PH.sc = sc;
  sc.environment = studioEnv(3, 2);
  PH.cam = new THREE.PerspectiveCamera(30, W / H, .01, 100);
  const grp = new THREE.Group(); PH.grp = grp; sc.add(grp);
  const body = new THREE.Mesh(new RoundedBoxGeometry(.78, 1.62, .085, 8, .11), new THREE.MeshPhysicalMaterial({ color: 0x9aa5a8, metalness: 1, roughness: .28, clearcoat: .6, clearcoatRoughness: .2 }));
  grp.add(body);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(.75, 1.59, .087, 8, .1), new THREE.MeshPhysicalMaterial({ color: 0x050505, roughness: .1, metalness: 0 }));
  grp.add(bezel);
  PH.cv = document.createElement('canvas'); PH.cv.width = 720; PH.cv.height = 1560; PH.cx = PH.cv.getContext('2d');
  PH.tex = new THREE.CanvasTexture(PH.cv); PH.tex.colorSpace = THREE.SRGBColorSpace; PH.tex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(.715, 1.55), new THREE.MeshBasicMaterial({ map: PH.tex, toneMapped: false, transparent: true }));
  screen.position.z = .0441; grp.add(screen); PH.screen = screen;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(.735, 1.57), new THREE.MeshStandardMaterial({ color: 0x000000, roughness: .04, metalness: 0, transparent: true, blending: THREE.AdditiveBlending, envMapIntensity: 1.2 }));
  glass.position.z = .0445; grp.add(glass);
  // side buttons
  const btnM = body.material;
  [[.395, .35, .18], [.395, .12, .1], [-.395, .3, .12]].forEach(([x, y, l]) => { const m = new THREE.Mesh(new RoundedBoxGeometry(.012, l, .03, 2, .005), btnM); m.position.set(x, y, 0); grp.add(m); });
  const l = new THREE.DirectionalLight(0xffffff, .6); l.position.set(-2, 3, 4); sc.add(l);
}

// screen UI
const VITALS = [
  { k: 'Heart rate', v: 72, unit: 'bpm', lo: 40, hi: 140, seg: [[40, 60, BLUE, 'Low'], [60, 100, MINT, 'Typical'], [100, 140, AMBER, 'High']], dec: 0 },
  { k: 'Heart rate variability', v: 48, unit: 'ms', lo: 0, hi: 100, seg: [[0, 20, AMBER, 'Low'], [20, 100, MINT, 'Typical']], dec: 0 },
  { k: 'Breathing rate', v: 14, unit: '/min', lo: 6, hi: 30, seg: [[6, 12, BLUE, 'Low'], [12, 20, MINT, 'Typical'], [20, 30, AMBER, 'High']], dec: 0 },
  { k: 'Blood pressure', v: 118, v2: 76, unit: 'mmHg', lo: 90, hi: 160, seg: [[90, 120, MINT, 'Normal'], [120, 130, AMBER, 'Elevated'], [130, 140, '#F08A4B', 'Stage 1'], [140, 160, CORAL, 'Stage 2']], dec: 0 },
  { k: 'Blood oxygen', v: 98, unit: '%', lo: 85, hi: 100, seg: [[85, 90, CORAL, 'Low'], [90, 95, AMBER, 'Below typical'], [95, 100, MINT, 'Typical']], dec: 0 },
];
function drawPhoneUI(u) { // u = seconds since 21.0
  const c = PH.cx, w = 720, hh = 1560;
  c.save(); c.clearRect(0, 0, w, hh);
  rr(c, 0, 0, w, hh, 74); c.clip();
  c.fillStyle = '#05090a'; c.fillRect(0, 0, w, hh);
  const scanEnd = 2.6;
  if (u < scanEnd + .5) {
    // camera feed
    const img = A.face; const s = Math.max(w / img.width, hh / img.height) * 1.02;
    c.globalAlpha = 1; c.drawImage(img, (w - img.width * s) / 2, (hh - img.height * s) / 2 + 40, img.width * s, img.height * s);
    c.fillStyle = 'rgba(2,10,10,.35)'; c.fillRect(0, 0, w, hh);
    const gr = c.createLinearGradient(0, hh * .55, 0, hh); gr.addColorStop(0, 'rgba(3,6,7,0)'); gr.addColorStop(1, 'rgba(3,6,7,.95)'); c.fillStyle = gr; c.fillRect(0, 0, w, hh);
    // face oval
    const fx = 372, fy = 520, rx = 205, ry = 270;
    c.save(); c.strokeStyle = MINT; c.lineWidth = 4; c.setLineDash([14, 12]); c.lineDashOffset = -u * 60;
    c.beginPath(); c.ellipse(fx, fy, rx, ry, 0, 0, Math.PI * 2); c.stroke(); c.restore();
    // landmark mesh
    const pr = rng(11);
    c.fillStyle = 'rgba(160,255,235,.9)';
    const pts = [];
    for (let i = 0; i < 70; i++) { const a = pr() * Math.PI * 2, r = Math.sqrt(pr()) * .8; pts.push([fx + Math.cos(a) * rx * r * .9 + Math.sin(u * 3 + i) * 1.5, fy + Math.sin(a) * ry * r * .9 + Math.cos(u * 2.5 + i) * 1.5]); }
    c.strokeStyle = 'rgba(98,230,207,.18)'; c.lineWidth = 1;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < 70) { c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[j]); c.stroke(); } }
    pts.forEach(p => { c.beginPath(); c.arc(p[0], p[1], 2.6, 0, 7); c.fill(); });
    // ROI boxes
    c.strokeStyle = 'rgba(98,230,207,.9)'; c.lineWidth = 2.5;
    [[fx - 70, fy - 210, 140, 60], [fx - 150, fy + 10, 80, 70], [fx + 70, fy + 10, 80, 70]].forEach(([x, y, a, b]) => { c.strokeRect(x, y, a, b); });
    // countdown ring
    const p = clamp(u / scanEnd), secs = Math.max(0, Math.ceil(60 * (1 - p)));
    c.lineWidth = 10; c.strokeStyle = 'rgba(255,255,255,.15)'; c.beginPath(); c.arc(w / 2, 1040, 92, 0, 7); c.stroke();
    c.strokeStyle = MINT; c.lineCap = 'round'; c.beginPath(); c.arc(w / 2, 1040, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); c.stroke();
    text(c, p < 1 ? String(secs) : '✓', w / 2, 1062, { w: 800, size: 64, align: 'center', color: OFF });
    text(c, p < 1 ? 'HOLD STILL · MEASURING' : 'SCAN COMPLETE', w / 2, 1190, { fam: 'Mono', w: 600, size: 22, ls: 3, align: 'center', color: p < 1 ? '#a9bbb7' : MINT });
    // PPG waveform
    c.save(); c.translate(0, 1290);
    text(c, 'PULSE SIGNAL', 56, 0, { fam: 'Mono', w: 600, size: 18, ls: 3, color: '#7f918d' });
    text(c, 'QUALITY 94%', w - 56, 0, { fam: 'Mono', w: 600, size: 18, ls: 3, align: 'right', color: MINT });
    c.beginPath(); c.strokeStyle = MINT; c.lineWidth = 4; c.lineJoin = 'round';
    for (let x = 56; x <= w - 56; x += 4) { const ph = (x - 56) / 150 + u * 1.25; const y = 120 - (Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2)), 3) * 60 + Math.max(0, Math.sin(ph * Math.PI * 2 - 1.8)) * 18); x === 56 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.stroke(); c.restore();
    const fl = Math.exp(-Math.max(0, u - scanEnd) * 6) * (u > scanEnd ? 1 : 0); if (fl > 0) { c.fillStyle = `rgba(98,230,207,${fl * .5})`; c.fillRect(0, 0, w, hh); }
  }
  const r0 = scanEnd + .35;
  if (u > r0) {
    const k = E.outExpo(inv(r0, r0 + .5, u));
    c.globalAlpha = k; c.fillStyle = '#05090a'; c.fillRect(0, 0, w, hh); c.globalAlpha = 1;
    text(c, 'TODAY · 09:41', 56, 190, { fam: 'Mono', w: 600, size: 20, ls: 3, color: '#7f918d', alpha: k });
    text(c, 'Your vitals', 56, 262, { w: 800, size: 56, ls: -1.5, color: OFF, alpha: k });
    const ROWS = [
      ['Pulse rate', 72, '', 'bpm', 'Typical'], ['Blood pressure', 118, 76, 'mmHg', 'Normal'], ['Oxygen saturation', 98, '', '%', 'Typical'],
      ['Breathing rate', 14, '', '/min', 'Typical'], ['HRV (RMSSD)', 42, '', 'ms', ''], ['HRV (SDNN)', 48, '', 'ms', ''],
      ['Pulse-respiration quotient', 4.1, '', '', ''], ['Stress level', 0, '', '', 'Low'], ['Sympathetic activity', 46, '', '%', ''], ['Parasympathetic activity', 54, '', '%', ''],
    ];
    const EST = [['Hemoglobin', 13.9, 'g/dL'], ['HbA1c', 5.4, '%']];
    text(c, '12 READINGS · ONE SCAN', w - 56, 262, { fam: 'Mono', w: 600, size: 18, ls: 2, align: 'right', color: MINT, alpha: k });
    const row = (i, y0) => { const t0 = r0 + .2 + i * .085, kk = E.outExpo(inv(t0, t0 + .5, u)); return [t0, kk, y0 + (1 - kk) * 50]; };
    ROWS.forEach((m, i) => {
      const [t0, kk, y] = row(i, 300 + i * 84); if (kk <= 0) return;
      c.globalAlpha = kk;
      rr(c, 40, y, w - 80, 74, 20); c.fillStyle = 'rgba(255,255,255,.05)'; c.fill();
      text(c, m[0], 68, y + (m[4] ? 33 : 46), { w: 600, size: 23, color: '#c9d6d3' });
      if (m[4]) text(c, '● ' + m[4], 68, y + 60, { w: 600, size: 17, color: MINT });
      const cnt = E.outCubic(inv(t0 + .05, t0 + .7, u));
      const dec = m[1] % 1 ? 1 : 0;
      const val = m[0] === 'Stress level' ? 'Low' : m[2] ? `${Math.round(m[1] * cnt)}/${Math.round(m[2] * cnt)}` : (m[1] * cnt).toFixed(dec);
      c.save(); font(c, 500, 19); const uw = m[3] ? c.measureText(m[3]).width + 8 : 0; c.restore();
      text(c, val, w - 68 - uw, y + 49, { w: 800, size: 36, ls: -1, align: 'right', color: OFF });
      if (m[3]) text(c, m[3], w - 68, y + 49, { w: 500, size: 19, align: 'right', color: '#7f918d' });
    });
    c.globalAlpha = 1;
    { const [, kk] = row(10, 0); text(c, 'ESTIMATES · NOT LAB RESULTS', 56, 1172, { fam: 'Mono', w: 600, size: 17, ls: 2, color: AMBER, alpha: kk }); }
    EST.forEach((m, i) => {
      const [t0, kk, y] = row(10 + i, 1192 + i * 84); if (kk <= 0) return;
      c.globalAlpha = kk;
      rr(c, 40, y, w - 80, 74, 20); c.save(); c.setLineDash([8, 7]); c.strokeStyle = 'rgba(242,184,75,.55)'; c.lineWidth = 2; c.stroke(); c.restore();
      text(c, m[0] + ' (est.)', 68, y + 33, { w: 600, size: 23, color: '#c9d6d3' });
      text(c, 'Estimate — not a lab result', 68, y + 60, { w: 500, size: 16, color: AMBER });
      const cnt = E.outCubic(inv(t0 + .05, t0 + .7, u));
      c.save(); font(c, 500, 19); const uw = c.measureText(m[2]).width + 8; c.restore();
      text(c, (m[1] * cnt).toFixed(1), w - 68 - uw, y + 49, { w: 800, size: 36, ls: -1, align: 'right', color: OFF });
      text(c, m[2], w - 68, y + 49, { w: 500, size: 19, align: 'right', color: '#7f918d' });
    });
    c.globalAlpha = 1;
    text(c, 'Wellness readings · not a diagnosis', w / 2, 1400, { w: 500, size: 20, align: 'center', color: '#5d6e6a', alpha: E.outCubic(inv(r0 + 1.4, r0 + 2, u)) });
  }
  // status bar + island
  text(c, '9:41', 80, 70, { w: 600, size: 28, color: OFF });
  rr(c, w / 2 - 95, 26, 190, 54, 27); c.fillStyle = '#000'; c.fill();
  c.restore();
  PH.tex.needsUpdate = true;
}
function renderPhone(t) {
  const u = t - 21;
  drawPhoneUI(u);
  const kin = E.outExpo(inv(21, 22.1, t));
  const g2 = PH.grp;
  g2.position.set(lerp(.62, .55, kin), lerp(-1.6, -.02, kin), 0);
  g2.rotation.set(lerp(.7, .06, kin) + .02 * Math.sin(u * 1.1), lerp(-1.1, -.32, kin) + .06 * Math.sin(u * .7), lerp(.25, .03, kin));
  // push into the screen at the end
  const push = E.inExpo(inv(26.2, 27, t));
  g2.rotation.y = lerp(g2.rotation.y, 0, E.inOutCubic(inv(25.8, 26.6, t)));
  g2.rotation.x = lerp(g2.rotation.x, 0, E.inOutCubic(inv(25.8, 26.6, t)));
  PH.cam.position.set(lerp(0, g2.position.x, push), lerp(0, g2.position.y, push), lerp(4.4, .9, push));
  PH.cam.lookAt(lerp(0, g2.position.x, push), lerp(0, g2.position.y, push), 0);
  R.setClearColor(0x000000, 1); R.render(PH.sc, PH.cam);
}

// ---- logo (S7) ----
const LG = {};
async function buildLogo() {
  const sc = new THREE.Scene(); LG.sc = sc;
  const hdr = await new RGBELoader().loadAsync('assets/moonless_golf_1k.hdr'); hdr.mapping = THREE.EquirectangularReflectionMapping;
  // blend real HDR with studio strips: render both into one env scene
  const es = new THREE.Scene(); es.background = hdr; es.backgroundIntensity = 1.6;
  const strip = (w, hh, col, I, p) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(I), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); es.add(m); };
  strip(.8, 12, 0xffffff, 14, [-6, 0, 5]); strip(.8, 12, 0x62e6cf, 8, [7, 0, 3]); strip(10, .6, 0xffffff, 8, [0, 8, 2]); strip(3, .3, 0xffffff, 10, [2, -2, 7]);
  sc.environment = pmrem.fromScene(es, 0.0).texture;
  LG.cam = new THREE.PerspectiveCamera(30, W / H, .01, 100);
  const pts = A.vmark.map(p => new THREE.Vector2(p[0], p[1]));
  const shape = new THREE.Shape(pts);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: .13, bevelEnabled: true, bevelThickness: .035, bevelSize: .022, bevelSegments: 6, curveSegments: 4 });
  geo.center();
  LG.mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.86, 1.0, .97), metalness: 1, roughness: .045, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.25 });
  LG.v = new THREE.Mesh(geo, LG.mat); sc.add(LG.v);
  LG.refl = new THREE.Mesh(geo, LG.mat); LG.refl.scale.y = -1; sc.add(LG.refl);
  const mcm = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(.8, 1, .95), metalness: 1, roughness: .06, envMapIntensity: 1.3 });
  LG.mc = new MarchingCubes(56, mcm, true, false, 80000); LG.mc.isolation = 80; LG.mc.scale.setScalar(1.3); sc.add(LG.mc);
}
function renderLogo(t) {
  const reveal = 52.6;
  const kV = E.outBack(inv(reveal, reveal + .9, t));
  const pre = t < reveal + .15;
  LG.mc.visible = pre;
  if (pre) {
    const mc = LG.mc; mc.reset();
    const k = E.inCubic(inv(51, reveal, t));
    for (let i = 0; i < 9; i++) {
      const a = i * 2.39 + t * 2.4 * (1 + k * 2), r = lerp(.36, .02, k);
      mc.addBall(.5 + Math.cos(a) * r, .5 + Math.sin(a * 1.7) * r * .6, .5 + Math.sin(a) * r * .8, lerp(.12, .5, k) * (t > reveal ? 1 - inv(reveal, reveal + .15, t) : 1) + .001, 12);
    }
    mc.update(); mc.rotation.y = t;
  }
  const s = .0001 + kV * .72;
  LG.v.scale.set(s, s, s);
  LG.v.visible = t > reveal - .02;
  LG.v.rotation.y = lerp(1.15, 0, E.outCubic(inv(reveal, reveal + 2.6, t))) + .05 * Math.sin((t - 55) * .8) * inv(55, 57, t);
  LG.v.rotation.x = lerp(-.3, 0, E.outCubic(inv(reveal, reveal + 2, t)));
  const vy = .5;
  LG.v.position.set(0, vy, 0);
  LG.refl.visible = LG.v.visible; LG.refl.scale.set(s, -s, s); LG.refl.rotation.copy(LG.v.rotation); LG.refl.rotation.x *= -1;
  LG.refl.position.set(0, vy - .66 * s - .03, 0);
  LG.sc.environmentRotation.y = lerp(-1.3, 1.2, E.inOutSine(inv(52, 58, t)));
  const zoom = lerp(4.0, 3.55, E.outCubic(inv(reveal, 59, t)));
  LG.cam.position.set(0, .3, zoom); LG.cam.lookAt(0, .18, 0);
  const fade = 1 - inv(59.1, 59.9, t);
  R.toneMappingExposure = fade;
  R.setClearColor(0x000000, 1); R.render(LG.sc, LG.cam);
  R.toneMappingExposure = 1;
}

// ---------- 2D scenes ----------
let shakeX = 0, shakeY = 0;
function shake(t) {
  shakeX = 0; shakeY = 0;
  for (const ti of HITS) { if (t >= ti && t < ti + .5) { const k = Math.exp(-(t - ti) * 14) * 9; shakeX += Math.sin((t - ti) * 90) * k; shakeY += Math.cos((t - ti) * 77) * k; } }
}

function S1(t) {
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  g.save(); g.translate(shakeX, shakeY);
  // ECG draw-on
  if (t < 3.05) {
    const k = E.outCubic(inv(0.05, 1.0, t)), fade = 1 - inv(1.0, 1.4, t) * .75 - inv(2.8, 3.05, t) * .25;
    g.save(); g.globalAlpha = fade; g.lineWidth = 3; g.lineJoin = 'round';
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(255,90,78,0)'); gr.addColorStop(.5, CORAL); gr.addColorStop(1, MINT); g.strokeStyle = gr;
    g.shadowColor = MINT; g.shadowBlur = 18;
    g.beginPath(); const xe = W * k;
    for (let x = 0; x <= xe; x += 3) { const y = 560 - ecg(x / W * 2.2 + .55) * 170; x === 0 ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
    const yh = 560 - ecg(xe / W * 2.2 + .55) * 170; g.fillStyle = '#fff'; g.beginPath(); g.arc(xe, yh, 6, 0, 7); g.fill();
    g.restore();
  }
  // slam words
  if (t >= 1 && t < 3.45) {
    const col = inv(3.0, 3.4, t), sy = 1 - E.inExpo(col);
    g.save(); g.translate(0, 540); g.scale(1, Math.max(sy, .004)); g.translate(0, -540);
    const words = [
      ['YOUR', 150, 390, 1.0, OFF, false], ['BODY', 0, 390, 1.5, OFF, false],
      ['SPEAKS', 150, 590, 2.0, OFF, true], ['EVERY SECOND.', 150, 790, 2.5, MINT, false]];
    font(g, 900, 200); g.letterSpacing = '-6px'; const yourW = g.measureText('YOUR ').width;
    words[1][1] = 150 + yourW;
    for (const [s, x, y, t0, colr, outline] of words) {
      if (t < t0) continue;
      const k = inv(t0, t0 + .32, t), e = E.outExpo(k);
      const sc = 1 + .5 * (1 - e);
      g.save(); g.translate(x, y); g.scale(sc, sc);
      for (let m = 3; m >= 0; m--) {
        const a = m === 0 ? 1 : (1 - e) * .25;
        text(g, s, -m * 14 * (1 - e), 0, { w: 900, size: 200, ls: -6, color: colr, alpha: a * clamp(k * 6), stroke: outline, lw: 3 });
      }
      g.restore();
    }
    if (col > 0) { g.fillStyle = MINT; g.globalAlpha = col; g.fillRect(0, 535, W, 10); }
    g.restore();
  }
  // line wipe into corridor
  if (t >= 3.4 && t < 7.3) {
    const op = E.inOutCubic(inv(3.4, 3.75, t));
    g.save(); g.beginPath(); g.rect(0, 540 - 540 * op, W, 1080 * op); g.clip();
    cover(g, A.corridor, lerp(1.06, 1.2, inv(3.4, 7.3, t)), .5, .55, 1);
    g.fillStyle = 'rgba(3,5,6,.62)'; g.fillRect(0, 0, W, H);
    g.restore();
    if (op < 1) { g.fillStyle = MINT; g.fillRect(0, 540 - 540 * op - 2, W, 4); g.fillRect(0, 540 + 540 * op - 2, W, 4); }
    g.save(); g.globalAlpha = 1 - inv(6.0, 6.25, t); stagger(g, 'But listening to it usually takes', 960, 330, t, 3.55, { fam: 'ISerif', style: 'italic', w: 400, size: 64, align: 'center', color: '#d5dfdd', d: .018, blur: 8 }); g.restore();
    const stamps = [['A CUFF.', 'BLOOD PRESSURE', 4.0], ['A CLIP.', 'OXYGEN', 4.5], ['WIRES.', 'HEART RHYTHM', 5.0], ['A WAITING ROOM.', 'EVERYTHING ELSE', 5.5]];
    for (let i = 0; i < stamps.length; i++) {
      const [s, cap, t0] = stamps[i], t1 = i < 3 ? stamps[i + 1][2] : 6.2;
      if (t < t0 || t >= t1) continue;
      const k = inv(t0, t0 + .18, t), e = E.outExpo(k), gl = t - t0 < .1;
      const sc = 1.25 - .25 * e;
      g.save(); g.translate(960, 640); g.scale(sc, sc);
      if (gl) { g.globalCompositeOperation = 'lighter'; text(g, s, -10, 0, { w: 900, size: 170, ls: -5, align: 'center', color: 'rgba(255,60,60,.6)' }); text(g, s, 10, 0, { w: 900, size: 170, ls: -5, align: 'center', color: 'rgba(60,255,230,.6)' }); g.globalCompositeOperation = 'source-over'; }
      text(g, s, 0, 0, { w: 900, size: 170, ls: -5, align: 'center', color: OFF });
      g.restore();
      // strike line
      const ks = E.outExpo(inv(t0 + .2, t0 + .42, t));
      if (ks > 0) { font(g, 900, 170); g.letterSpacing = '-5px'; const ww = g.measureText(s).width; g.fillStyle = CORAL; g.fillRect(960 - ww / 2 - 20, 585, (ww + 40) * ks, 12); }
      text(g, cap, 960, 740, { fam: 'Mono', w: 600, size: 22, ls: 6, align: 'center', color: '#8fa29e', alpha: E.outCubic(inv(t0 + .05, t0 + .3, t)) });
    }
    if (t > 6.2) {
      const out = 1 - inv(7.0, 7.3, t);
      g.save(); g.globalAlpha = out;
      stagger(g, 'So most days,', 960, 470, t, 6.2, { fam: 'ISerif', w: 400, size: 120, align: 'center', color: OFF, d: .03, blur: 10 });
      g.restore();
    }
  }
  // "no one is listening." -> particles -> orb -> drop
  if (t >= 6.5) {
    if (t < 7.3) stagger(g, 'no one is listening.', 960, 640, t, 6.55, { fam: 'ISerif', style: 'italic', w: 400, size: 130, align: 'center', color: MINT, d: .028, blur: 10 });
    else {
      if (t < 7.6) { g.fillStyle = 'rgba(3,5,6,1)'; }
      const P = A.textParticles;
      g.save(); g.globalCompositeOperation = 'lighter';
      const cx = 960, cy = 540;
      const fall = E.inCubic(inv(8.7, 9.0, t));
      for (const p of P) {
        const st = 7.3 + p.x0 / W * .55; const k1 = inv(st, st + .7, t);
        const k2 = E.inOutCubic(inv(7.9 + p.r * .3, 8.65, t));
        let x = p.x0 + p.vx * k1 * 60 + Math.sin(t * 3 + p.r * 9) * 6 * k1;
        let y = p.y0 - k1 * (40 + p.r * 120) + Math.cos(t * 2 + p.r * 7) * 6 * k1;
        x = lerp(x, cx, k2); y = lerp(y, cy, k2);
        y += fall * 700;
        const a = (1 - k1 * .4) * (1 - k2 * .7);
        g.fillStyle = `rgba(98,230,207,${a * .85})`; g.fillRect(x - 1.2, y - 1.2, 2.4, 2.4);
      }
      // orb
      const ko = inv(8.2, 8.7, t);
      if (ko > 0) {
        const oy = cy + fall * 700, r = 8 + 22 * E.outBack(ko);
        const gr = g.createRadialGradient(cx, oy, 0, cx, oy, r * 5); gr.addColorStop(0, 'rgba(220,255,248,1)'); gr.addColorStop(.18, 'rgba(98,230,207,.9)'); gr.addColorStop(1, 'rgba(98,230,207,0)');
        g.fillStyle = gr; g.save(); g.translate(cx, oy); g.scale(1, 1 + fall * 2.5); g.translate(-cx, -oy); g.beginPath(); g.arc(cx, oy, r * 5, 0, 7); g.fill(); g.restore();
      }
      g.restore();
    }
  }
  g.restore();
}

function S2overlay(t) {
  g.clearRect(0, 0, W, H);
  const L = (s, y, t0, t1, o = {}) => { if (t < t0 || t > t1 + .4) return; g.save(); g.globalAlpha = 1 - inv(t1, t1 + .35, t); stagger(g, s, 140, y, t, t0, { size: 56, w: 600, ls: -1, d: .016, blur: 6, ...o }); g.restore(); };
  L('Every heartbeat sends a pulse of blood', 850, 9.9, 12.2);
  L('just beneath the skin of your face.', 920, 10.2, 12.2, { color: '#9fb2ae' });
  L('It shifts the colour of your skin,', 850, 12.5, 14.6);
  L('a few thousandths at a time.', 920, 12.8, 14.6, { color: '#9fb2ae' });
  L('Too subtle for your eyes.', 850, 14.8, 16.4);
  L('Not for your camera.', 920, 15.3, 16.4, { color: MINT, fam: 'ISerif', style: 'italic', w: 400, size: 70 });
  // white flash into S3
  const f = inv(16.85, 17, t); if (f > 0) { g.fillStyle = `rgba(225,255,248,${f})`; g.fillRect(0, 0, W, H); }
}

function S3a(t) { // selfie 17-18.5
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  const z = lerp(1.0, 1.12, E.outCubic(inv(17, 18.6, t)));
  cover(g, A.selfie, z, .35, .2, 1);
  g.fillStyle = 'rgba(3,5,6,.25)'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(900, 0, W, 0); gr.addColorStop(0, 'rgba(3,5,6,0)'); gr.addColorStop(.5, 'rgba(3,5,6,.75)'); gr.addColorStop(1, 'rgba(3,5,6,.9)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // face bracket lock (face approx in image space -> screen)
  const img = A.selfie, s = Math.max(W / img.width, H / img.height) * z, ox = (W - img.width * s) * .35, oy = (H - img.height * s) * .2;
  const fx = ox + 668 * s, fy = oy + 205 * s, fr = 105 * s;
  const kb = E.outExpo(inv(17.45, 17.85, t));
  if (kb > 0) {
    const r = fr * lerp(2.2, 1, kb), L = 34;
    g.save(); g.strokeStyle = MINT; g.lineWidth = 4; g.globalAlpha = kb;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { g.beginPath(); g.moveTo(fx + a * r, fy + b * r - b * L); g.lineTo(fx + a * r, fy + b * r); g.lineTo(fx + a * r - a * L, fy + b * r); g.stroke(); });
    text(g, 'FACE LOCKED · 0.98', fx - r, fy - r - 18, { fam: 'Mono', w: 600, size: 18, ls: 3, color: MINT });
    g.restore();
  }
  slideUp(g, 'The sensor', 1080, 430, t, 17.1, { w: 900, size: 120, ls: -4 });
  slideUp(g, 'is already', 1080, 560, t, 17.3, { w: 900, size: 120, ls: -4 });
  slideUp(g, 'in your hand.', 1080, 690, t, 17.5, { w: 400, size: 132, fam: 'ISerif', style: 'italic', color: MINT });
}
function S3bOverlay(t) {
  g.clearRect(0, 0, W, H);
  { const bf = g.createLinearGradient(0, 760, 0, 1080); bf.addColorStop(0, 'rgba(0,0,0,0)'); bf.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = bf; g.fillRect(0, 760, W, 320); }
  const lines = [['60 seconds.', 18.8], ['Front camera.', 19.15], ['Nothing to wear.', 19.5]];
  lines.forEach(([s, t0], i) => slideUp(g, s, 140, 420 + i * 120, t, t0, { w: 900, size: 100, ls: -3, color: i === 2 ? MINT : OFF }));
  text(g, 'VIDEO IS PROCESSED ON THE PHONE AND NEVER UPLOADED', 140, 790, { fam: 'Mono', w: 600, size: 18, ls: 3, color: '#8fa29e', alpha: E.outCubic(inv(19.9, 20.4, t)) });
  // ROI callouts
  HD.anchors.forEach(([lab, v], i) => {
    const k = E.outExpo(inv(19.2 + i * .25, 19.7 + i * .25, t)); if (k <= 0) return;
    const [x, y] = project(v, HD.mesh, HD.cam);
    const tx = x + 230, ty = y - 70 + i * 55;
    g.save(); g.globalAlpha = k * (1 - inv(20.9, 21, t));
    g.strokeStyle = MINT; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(x + 9, y); g.lineTo(lerp(x + 9, tx, k), lerp(y, ty, k)); g.lineTo(lerp(x + 9, tx + 190, k), lerp(y, ty, k)); g.stroke();
    text(g, lab, tx + 4, ty - 10, { fam: 'Mono', w: 600, size: 16, ls: 2, color: MINT, alpha: inv(.5, 1, k) });
    g.restore();
  });
  const f = inv(20.85, 21, t); if (f > 0) { g.fillStyle = `rgba(3,5,6,${f})`; g.fillRect(0, 0, W, H); }
}
function S3cOverlay(t) {
  g.clearRect(0, 0, W, H);
  const out = 1 - inv(26, 26.4, t);
  g.save(); g.globalAlpha = out;
  slideUp(g, '12 readings.', 140, 430, t, 21.5, { w: 900, size: 110, ls: -4 });
  slideUp(g, 'One minute.', 140, 560, t, 21.8, { w: 400, size: 124, fam: 'ISerif', style: 'italic', color: MINT });
  const bullets = ['Pulse · Blood pressure · Oxygen · Breathing', 'HRV · Stress · Autonomic balance', 'Hemoglobin & HbA1c, marked as estimates'];
  bullets.forEach((s, i) => { const k = E.outCubic(inv(24.1 + i * .2, 24.6 + i * .2, t)); text(g, s, 140 + (1 - k) * 30, 670 + i * 50, { w: 500, size: 28, color: '#a9bbb7', alpha: k }); if (k > 0) { g.fillStyle = MINT; g.globalAlpha = k * out; g.fillRect(140 - 24, 661 + i * 50, 10, 10); g.globalAlpha = out; } });
  g.restore();
}

// ---- S4 website (DOM 3D) ----
let layers = [];
function S4(t) {
  webEl.style.display = 'block';
  const flat = 1920 / 1440;
  const k1 = E.inOutCubic(inv(27.7, 29.4, t));      // explode
  const k2 = E.inOutCubic(inv(32.7, 33.6, t));      // collapse
  const ex = k1 * (1 - k2);
  const cta = E.inOutCubic(inv(33.3, 34.3, t));
  const rx = 56 * ex, rz = (-36 + 7 * inv(29.4, 32.7, t)) * ex;
  const s0 = lerp(flat * lerp(1, 1.025, inv(27, 27.7, t)), .6, ex);
  const S = lerp(s0, 2.1, cta);
  const scroll = 60 * E.inOutCubic(inv(27, 27.8, t)) * (1 - ex);
  let tx = lerp(240, 330, ex), ty = lerp(740 * flat - 740 - scroll, 10, ex);
  tx = lerp(tx, 560 - 720 - (CTA.x - 720) * S, cta); ty = lerp(ty, 600 - 740 - (CTA.y - 740) * S, cta);
  pageEl.style.transform = `translate(${tx}px, ${ty}px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${S})`;
  layers.forEach((L, i) => {
    const d = E.outCubic(inv(28.0 + i * .08, 29.5 + i * .08, t)) * (1 - E.inOutCubic(inv(32.5 + (layers.length - i) * .04, 33.4, t)));
    L.el.style.transform = `translateZ(${d * i * 70}px)`;
    const tagK = E.outExpo(inv(29.3 + i * .12, 29.6 + i * .12, t)) * (1 - inv(32.4, 32.7, t));
    L.tag.style.opacity = tagK;
    L.tag.style.transform = `translateZ(2px) translateY(${(1 - tagK) * 10}px)`;
    const hl = Math.exp(-Math.pow((t - (30.1 + i * .3)) * 5, 2));
    L.ol.style.borderColor = `rgba(98,230,207,${(.35 * ex + .6 * hl) * (1 - k2)})`;
    L.ol.style.boxShadow = hl > .05 ? `0 0 ${30 * hl}px rgba(98,230,207,${.5 * hl})` : 'none';
  });
}
const CTA = { x: 370, y: 640 };
function scrollY0(t) { return 0; }
function S4overlay(t) {
  g.clearRect(0, 0, W, H);
  const out = 1 - inv(32.4, 32.8, t);
  g.save(); g.globalAlpha = out;
  slideUp(g, 'One link.', 120, 700, t, 29.6, { w: 900, size: 84, ls: -3 });
  slideUp(g, 'Any phone.', 120, 795, t, 29.85, { w: 900, size: 84, ls: -3 });
  slideUp(g, 'No hardware.', 120, 895, t, 30.1, { w: 400, size: 92, fam: 'ISerif', style: 'italic', color: MINT });
  g.restore();
  // cursor + click
  const btn = document.getElementById('cta').getBoundingClientRect();
  const bx = btn.left + btn.width * .55, by = btn.top + btn.height * .6;
  const kc = E.inOutCubic(inv(33.7, 34.35, t));
  if (t > 33.6) {
    const x = lerp(1500, bx, kc), y = lerp(1000, by, kc);
    const press = t > 34.4 && t < 34.55 ? .85 : 1;
    if (t > 34.4) { const kr = inv(34.4, 34.9, t); g.strokeStyle = `rgba(98,230,207,${1 - kr})`; g.lineWidth = 4; g.beginPath(); g.arc(bx, by, 20 + kr * 180, 0, 7); g.stroke(); }
    g.save(); g.translate(x, y); g.scale(1.6 * press, 1.6 * press);
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 30); g.lineTo(8, 23); g.lineTo(13, 34); g.lineTo(18, 32); g.lineTo(13, 21); g.lineTo(23, 21); g.closePath();
    g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke(); g.restore();
  }
  const f = inv(34.8, 35, t); if (f > 0) { g.fillStyle = `rgba(225,255,248,${f})`; g.fillRect(0, 0, W, H); }
}

// ---- S5 icons ----
const ICONS = ['Heart rate', 'Breathing', 'Blood oxygen', 'Blood pressure', 'HRV', 'Sleep', 'Nutrition', 'Activity'];
const FOCUS = [3, 5, 7];
function strokePath(ctx, k, fn) { // draw-on via dash
  ctx.save(); ctx.setLineDash([1400 * k, 1400]); fn(); ctx.restore();
}
function drawIcon(ctx, i, k, t) { // centered at 0,0, ~120px box
  ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = OFF;
  const tt = t;
  const D = (f) => strokePath(ctx, k, () => { ctx.beginPath(); f(); ctx.stroke(); });
  switch (i) {
    case 0: { const s = 1 + .08 * beatPulse(tt, 35, .85); ctx.save(); ctx.scale(s, s);
      D(() => { ctx.moveTo(0, 48); ctx.bezierCurveTo(-70, 0, -62, -58, -28, -58); ctx.bezierCurveTo(-10, -58, 0, -44, 0, -32); ctx.bezierCurveTo(0, -44, 10, -58, 28, -58); ctx.bezierCurveTo(62, -58, 70, 0, 0, 48); });
      ctx.lineWidth = 5; ctx.strokeStyle = MINT; D(() => { ctx.moveTo(-40, -8); ctx.lineTo(-16, -8); ctx.lineTo(-8, -26); ctx.lineTo(4, 14); ctx.lineTo(12, -8); ctx.lineTo(40, -8); }); ctx.restore(); break; }
    case 1: { const s = 1 + .07 * Math.sin(tt * 3.2); ctx.save();
      D(() => { ctx.moveTo(0, -60); ctx.lineTo(0, -10); ctx.moveTo(0, -18); ctx.lineTo(-14, -2); ctx.moveTo(0, -18); ctx.lineTo(14, -2); });
      ctx.scale(s, 1);
      D(() => { ctx.moveTo(-14, -36); ctx.bezierCurveTo(-40, -40, -62, 10, -56, 40); ctx.bezierCurveTo(-52, 58, -24, 56, -16, 40); ctx.lineTo(-14, -36); });
      D(() => { ctx.moveTo(14, -36); ctx.bezierCurveTo(40, -40, 62, 10, 56, 40); ctx.bezierCurveTo(52, 58, 24, 56, 16, 40); ctx.lineTo(14, -36); }); ctx.restore(); break; }
    case 2: { D(() => { ctx.moveTo(0, -62); ctx.bezierCurveTo(26, -26, 46, 0, 46, 22); ctx.arc(0, 22, 46, 0, Math.PI); ctx.bezierCurveTo(-46, 0, -26, -26, 0, -62); });
      const lvl = 30 - 40 * k; ctx.save(); ctx.beginPath(); ctx.arc(0, 22, 40, 0, Math.PI); ctx.lineTo(-40, lvl); ctx.closePath();
      ctx.beginPath(); ctx.moveTo(-40, 66); for (let x = -40; x <= 40; x += 4) ctx.lineTo(x, lvl + Math.sin(x * .12 + tt * 6) * 4); ctx.lineTo(40, 66); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(98,230,207,.85)'; ctx.beginPath(); ctx.arc(0, 22, 39, 0, Math.PI * 2); ctx.fill(); ctx.restore(); break; }
    case 3: { D(() => { ctx.arc(0, 18, 58, Math.PI, 0); });
      for (let j = 0; j <= 6; j++) { const a = Math.PI + j / 6 * Math.PI; ctx.globalAlpha = k; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 44, 18 + Math.sin(a) * 44); ctx.lineTo(Math.cos(a) * 36, 18 + Math.sin(a) * 36); ctx.stroke(); }
      ctx.globalAlpha = 1; const na = Math.PI + (0.3 + .25 * E.outBack(k) + .04 * Math.sin(tt * 5)) * Math.PI; ctx.strokeStyle = MINT; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(0, 18); ctx.lineTo(Math.cos(na) * 46 * k, 18 + Math.sin(na) * 46 * k); ctx.stroke(); ctx.fillStyle = MINT; ctx.beginPath(); ctx.arc(0, 18, 9, 0, 7); ctx.fill(); break; }
    case 4: { D(() => { let first = true; for (let x = -60; x <= 60; x += 3) { const ph = x * .09 + tt * 4; const y = Math.sin(ph) * 26 * (0.6 + .4 * Math.sin(x * .03 + tt)); first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; } });
      ctx.strokeStyle = MINT; ctx.lineWidth = 4; D(() => { ctx.moveTo(-60, 46); ctx.lineTo(60, 46); }); break; }
    case 5: { D(() => { ctx.arc(-4, 0, 50, -Math.PI * .35, Math.PI * 1.35); ctx.arc(14, -16, 40, Math.PI * 1.1, -Math.PI * .2, true); });
      ctx.fillStyle = MINT; [[40, -40, 5], [52, 4, 4], [28, -62, 3]].forEach(([x, y, r], j) => { const tw = .5 + .5 * Math.sin(tt * 5 + j * 2); ctx.globalAlpha = k * tw; ctx.beginPath(); ctx.arc(x, y, r + tw * 2, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1; break; }
    case 6: { D(() => { ctx.moveTo(0, -30); ctx.bezierCurveTo(-30, -48, -64, -24, -54, 16); ctx.bezierCurveTo(-46, 50, -20, 64, 0, 52); ctx.bezierCurveTo(20, 64, 46, 50, 54, 16); ctx.bezierCurveTo(64, -24, 30, -48, 0, -30); });
      const sw = Math.sin(tt * 3) * .15; ctx.save(); ctx.translate(2, -34); ctx.rotate(sw); ctx.strokeStyle = MINT;
      D(() => { ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -30, 34, -32); ctx.quadraticCurveTo(28, -6, 0, 0); }); ctx.restore(); break; }
    case 7: { const steps = [[-22, 30, -.2], [18, 0, .2], [-22, -30, -.2], [18, -60, .2]];
      steps.forEach(([x, y, r], j) => { const ph = ((tt * 2 - j * .5) % 2 + 2) % 2; const a = clamp(k * 4 - j) * (ph < 1.4 ? 1 : .25);
        ctx.save(); ctx.translate(x, y + 16); ctx.rotate(r); ctx.globalAlpha = a; ctx.fillStyle = j % 2 ? MINT : OFF;
        ctx.beginPath(); ctx.ellipse(0, 0, 11, 17, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, 24, 8, 7, 0, 0, 7); ctx.fill(); ctx.restore(); }); break; }
  }
}
function S5(t) {
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  // ambient glow
  const gr = g.createRadialGradient(960, 600, 50, 960, 600, 900); gr.addColorStop(0, 'rgba(98,230,207,.08)'); gr.addColorStop(1, 'rgba(98,230,207,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const head1 = 1 - inv(38.6, 38.9, t);
  g.save(); g.globalAlpha = head1; stagger(g, 'Then it tells you what to focus on.', 960, 200, t, 35.1, { w: 800, size: 64, ls: -2, align: 'center', d: .015, blur: 6 }); g.restore();
  if (t > 38.9) stagger(g, 'Two or three numbers. Not twenty.', 960, 200, t, 38.9, { w: 800, size: 64, ls: -2, align: 'center', d: .015, blur: 6 });
  const tw = 300, th = 300, gap = 36, cols = 4, x0 = 960 - (cols * tw + (cols - 1) * gap) / 2, y0 = 280;
  const focusK = E.outCubic(inv(38.5, 38.9, t));
  const exitK = E.inExpo(inv(41.3, 42, t));
  const avoK = E.outExpo(inv(40.0, 40.7, t));
  for (let i = 0; i < 8; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const t0 = 35.5 + i * .25, k = E.outBack(inv(t0, t0 + .45, t)), ka = inv(t0, t0 + .2, t);
    if (ka <= 0) continue;
    let x = x0 + c * (tw + gap) - 300 * avoK, y = y0 + r * (th + gap);
    const isF = FOCUS.includes(i);
    const dim = isF ? 1 : lerp(1, .22, focusK);
    g.save();
    g.translate(x + tw / 2, y + th / 2 + (1 - k) * 60); g.scale(lerp(.8, 1, k), lerp(.8, 1, k));
    // exit: everything shrinks to centre except focus tile 0? -> scale up heart? use focus[0]
    g.globalAlpha = ka * dim * (1 - exitK);
    // glass tile
    rr(g, -tw / 2, -th / 2, tw, th, 34);
    const tg = g.createLinearGradient(-tw / 2, -th / 2, tw / 2, th / 2); tg.addColorStop(0, 'rgba(255,255,255,.10)'); tg.addColorStop(1, 'rgba(255,255,255,.02)');
    g.fillStyle = tg; g.fill();
    g.lineWidth = isF && focusK > 0 ? 2 + focusK * 1.5 : 1.5; g.strokeStyle = isF && focusK > 0 ? `rgba(98,230,207,${.25 + .75 * focusK})` : 'rgba(255,255,255,.14)'; g.stroke();
    // specular sheen sweep
    const sw = ((t - t0) * 300) % 1200 - 300;
    g.save(); rr(g, -tw / 2, -th / 2, tw, th, 34); g.clip(); const sg = g.createLinearGradient(sw - 200, -150, sw, 150); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.5, 'rgba(255,255,255,.07)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sg; g.fillRect(-tw / 2, -th / 2, tw, th); g.restore();
    g.save(); g.translate(0, -24); drawIcon(g, i, E.outCubic(inv(t0 + .1, t0 + .8, t)), t); g.restore();
    text(g, ICONS[i], 0, 112, { w: 600, size: 24, align: 'center', color: '#b9c7c4' });
    if (isF && focusK > 0) { g.globalAlpha = focusK * (1 - exitK); rr(g, -tw / 2 + 20, -th / 2 + 20, 96, 32, 16); g.fillStyle = MINT; g.fill(); text(g, 'FOCUS', -tw / 2 + 68, -th / 2 + 42, { fam: 'Mono', w: 600, size: 15, ls: 2, align: 'center', color: '#031311' }); }
    g.restore();
  }
  // nutrition guidance panel with real photo
  if (avoK > 0) {
    const px = lerp(W + 40, 1335, avoK), py = 300, pw = 540, ph = 600;
    g.save(); g.globalAlpha = 1 - exitK;
    g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 60;
    rr(g, px, py, pw, ph, 30); g.fillStyle = '#0b1213'; g.fill(); g.shadowBlur = 0;
    g.save(); rr(g, px, py, pw, ph, 30); g.clip();
    const s = Math.max(pw / A.avocado.width, 430 / A.avocado.height) * lerp(1.15, 1.05, inv(40, 42, t));
    g.drawImage(A.avocado, px + (pw - A.avocado.width * s) / 2, py - 10, A.avocado.width * s, A.avocado.height * s);
    const og = g.createLinearGradient(0, py + 260, 0, py + 450); og.addColorStop(0, 'rgba(11,18,19,0)'); og.addColorStop(1, 'rgba(11,18,19,1)'); g.fillStyle = og; g.fillRect(px, py, pw, ph);
    g.restore();
    text(g, 'THIS WEEK', px + 36, py + 486, { fam: 'Mono', w: 600, size: 16, ls: 3, color: MINT });
    stagger(g, 'Meals, movement and sleep,', px + 36, py + 528, t, 40.25, { w: 700, size: 30, d: .01 });
    stagger(g, 'matched to your numbers.', px + 36, py + 566, t, 40.4, { w: 700, size: 30, d: .01, color: '#9fb2ae' });
    rr(g, px, py, pw, ph, 30); g.strokeStyle = 'rgba(98,230,207,.5)'; g.lineWidth = 1.5; g.stroke();
    g.restore();
  }
  const f = inv(41.85, 42, t); if (f > 0) { g.fillStyle = `rgba(3,5,6,${f})`; g.fillRect(0, 0, W, H); }
}

// ---- S6 data viz ----
const HR = (() => { const r = rng(21), a = []; for (let d = 0; d < 84; d++) { const base = 78 - 12 * (1 - Math.exp(-d / 35)) / (1 - Math.exp(-84 / 35)); a.push(base + (r() - .5) * 4.5 + Math.sin(d * .9) * 1.2); } return a; })();
const HRV = [34, 36, 35, 38, 40, 39, 42, 44, 43, 46, 47, 49];
function panel(x, y, w, hh, k) { g.save(); g.globalAlpha = k; rr(g, x, y, w, hh, 26); g.fillStyle = 'rgba(255,255,255,.035)'; g.fill(); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1.5; g.stroke(); g.restore(); }
function S6(t) {
  g.fillStyle = INK; g.fillRect(0, 0, W, H);
  const out = E.inExpo(inv(49.7, 50.8, t));
  g.save();
  // slow dolly
  const z = lerp(1.0, 1.035, inv(42, 49.7, t)) * lerp(1, .55, out);
  g.translate(960, 540); g.scale(z, z); g.translate(-960, -540);
  g.globalAlpha = 1 - out;
  // grid
  g.strokeStyle = 'rgba(255,255,255,.03)'; g.lineWidth = 1; for (let x = 0; x < W; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const h1 = 1 - inv(48.2, 48.45, t);
  g.save(); g.globalAlpha *= h1; stagger(g, 'And shows you what changed.', 120, 152, t, 42.1, { w: 800, size: 60, ls: -2, d: .014, blur: 6 }); g.restore();
  if (t > 48.45) stagger(g, 'Small changes. Visible progress.', 120, 152, t, 48.45, { w: 800, size: 60, ls: -2, d: .014, blur: 6, color: MINT });
  // main chart
  const kp = E.outCubic(inv(42.2, 42.7, t));
  const cx = 120, cy = 190, cw = 1060, ch = 520; panel(cx, cy, cw, ch, kp);
  text(g, 'RESTING HEART RATE · 12 WEEKS', cx + 40, cy + 56, { fam: 'Mono', w: 600, size: 18, ls: 3, color: '#8fa29e', alpha: kp });
  const kd = E.inOutCubic(inv(42.5, 44.8, t));
  const n = HR.length, gx = cx + 60, gy = cy + 110, gw = cw - 120, gh = ch - 180;
  const yv = v => gy + gh - (v - 55) / (90 - 55) * gh;
  // typical band 60-100 clipped at 90
  g.save(); g.globalAlpha = kp * .9; g.fillStyle = 'rgba(98,230,207,.06)'; g.fillRect(gx, yv(90), gw, yv(60) - yv(90));
  g.setLineDash([6, 8]); g.strokeStyle = 'rgba(98,230,207,.35)'; g.beginPath(); g.moveTo(gx, yv(60)); g.lineTo(gx + gw, yv(60)); g.stroke(); g.setLineDash([]);
  text(g, 'TYPICAL RANGE 60–100', gx + gw - 6, yv(60) - 12, { fam: 'Mono', w: 600, size: 14, ls: 2, align: 'right', color: 'rgba(98,230,207,.7)' });
  [60, 70, 80, 90].forEach(v => text(g, String(v), gx - 14, yv(v) + 5, { fam: 'Mono', w: 400, size: 14, align: 'right', color: '#5d6e6a' }));
  for (let wk = 0; wk <= 12; wk += 2) text(g, 'W' + wk, gx + wk / 12 * gw, gy + gh + 34, { fam: 'Mono', w: 400, size: 14, align: 'center', color: '#5d6e6a' });
  g.restore();
  const last = kd * (n - 1);
  if (kd > 0) {
    const pts = []; for (let i = 0; i <= Math.floor(last); i++) pts.push([gx + i / (n - 1) * gw, yv(HR[i])]);
    const fi = Math.floor(last), fr = last - fi; if (fi < n - 1) pts.push([gx + last / (n - 1) * gw, yv(lerp(HR[fi], HR[fi + 1], fr))]);
    // smoothed trend
    const ag = g.createLinearGradient(0, gy, 0, gy + gh); ag.addColorStop(0, 'rgba(98,230,207,.28)'); ag.addColorStop(1, 'rgba(98,230,207,0)');
    g.beginPath(); g.moveTo(pts[0][0], gy + gh); pts.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(pts[pts.length - 1][0], gy + gh); g.closePath(); g.fillStyle = ag; g.fill();
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.strokeStyle = MINT; g.lineWidth = 3.5; g.lineJoin = 'round'; g.shadowColor = MINT; g.shadowBlur = 14; g.stroke(); g.shadowBlur = 0;
    const hp = pts[pts.length - 1]; g.fillStyle = '#fff'; g.beginPath(); g.arc(hp[0], hp[1], 7, 0, 7); g.fill();
    const glow = g.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 40); glow.addColorStop(0, 'rgba(98,230,207,.6)'); glow.addColorStop(1, 'rgba(98,230,207,0)'); g.fillStyle = glow; g.beginPath(); g.arc(hp[0], hp[1], 40, 0, 7); g.fill();
    const cur = lerp(HR[0], HR[n - 1], kd);
    text(g, Math.round(cur) + '', cx + cw - 150, cy + 76, { w: 800, size: 64, ls: -2, align: 'right', color: OFF, alpha: kp });
    text(g, 'bpm', cx + cw - 140, cy + 76, { w: 500, size: 22, color: '#7f918d', alpha: kp });
    // annotations
    [[20, 'Started 30-min daily walks', 43.25], [52, 'Lights out before 11 pm', 44.05]].forEach(([d, s, t0]) => {
      const ka = E.outBack(inv(t0, t0 + .4, t)); if (ka <= 0) return;
      const x = gx + d / (n - 1) * gw, y = yv(HR[d]);
      g.save(); g.globalAlpha = clamp(ka); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y - 12); g.lineTo(x, y - 80); g.stroke();
      g.fillStyle = MINT; g.beginPath(); g.arc(x, y, 8 * ka, 0, 7); g.fill();
      font(g, 600, 18); const tw = g.measureText(s).width + 36; rr(g, x - 18, y - 124, tw, 40, 20); g.fillStyle = 'rgba(12,22,23,.95)'; g.fill(); g.strokeStyle = 'rgba(98,230,207,.5)'; g.stroke();
      text(g, s, x, y - 97, { w: 600, size: 18, color: OFF }); g.restore();
    });
  }
  // BP range bar
  const kb = E.outCubic(inv(44.4, 44.9, t)); const bx = 1240, by = 190, bw = 560, bh = 245; panel(bx, by, bw, bh, kb);
  if (kb > 0) {
    g.save(); g.globalAlpha = kb;
    text(g, 'SYSTOLIC BLOOD PRESSURE', bx + 36, by + 56, { fam: 'Mono', w: 600, size: 16, ls: 3, color: '#8fa29e' });
    const v = lerp(134, 118, E.inOutCubic(inv(44.9, 46.6, t)));
    text(g, Math.round(v) + '', bx + 36, by + 140, { w: 800, size: 72, ls: -2 }); text(g, 'mmHg avg', bx + 170, by + 140, { w: 500, size: 22, color: '#7f918d' });
    const segs = [[90, 120, MINT, 'Normal'], [120, 130, AMBER, 'Elevated'], [130, 140, '#F08A4B', 'Stage 1'], [140, 160, CORAL, 'Stage 2']];
    const rx = bx + 36, rw = bw - 72, ry = by + 180, lo = 90, hi = 160;
    segs.forEach(([a, b, col, lab]) => { const x = rx + (a - lo) / (hi - lo) * rw, w = (b - a) / (hi - lo) * rw; const on = v >= a && v < b; g.fillStyle = col; g.globalAlpha = kb * (on ? 1 : .45); rr(g, x + 2, ry, w - 4, 14, 7); g.fill(); g.globalAlpha = kb; text(g, lab, x + w / 2, ry + 46, { w: on ? 700 : 500, size: 16, align: 'center', color: on ? OFF : '#6f817d' }); });
    const mx = rx + (v - lo) / (hi - lo) * rw; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx, ry - 6); g.lineTo(mx - 10, ry - 22); g.lineTo(mx + 10, ry - 22); g.closePath(); g.fill();
    const seg = segs.find(s => v >= s[0] && v < s[1]); rr(g, bx + bw - 200, by + 100, 164, 40, 20); g.fillStyle = 'rgba(255,255,255,.06)'; g.fill(); text(g, '● ' + seg[3], bx + bw - 184, by + 127, { w: 700, size: 18, color: seg[2] });
    g.restore();
  }
  // rings
  const kr = E.outCubic(inv(45.4, 45.9, t)); const rx0 = 1240, ry0 = 460, rw0 = 560, rh0 = 250; panel(rx0, ry0, rw0, rh0, kr);
  if (kr > 0) {
    const rings = [['SLEEP', '7.4', 'h', 7.4 / 8], ['STEPS', '8,450', '', .845], ['MEALS LOGGED', '19', '/21', 19 / 21]];
    rings.forEach(([lab, val, u, p], i) => {
      const t0 = 45.7 + i * .3, k = E.outCubic(inv(t0, t0 + 1.1, t)), x = rx0 + 100 + i * 180, y = ry0 + 120;
      g.save(); g.globalAlpha = kr; g.lineWidth = 12; g.strokeStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(x, y, 62, 0, 7); g.stroke();
      g.strokeStyle = i === 1 ? OFF : MINT; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p * k); g.stroke();
      const num = i === 1 ? Math.round(8450 * k).toLocaleString('en-US') : i === 0 ? (7.4 * k).toFixed(1) : String(Math.round(19 * k));
      text(g, num, x, y + 10, { w: 800, size: i === 1 ? 26 : 32, align: 'center' }); text(g, lab, x, y + 100, { fam: 'Mono', w: 600, size: 13, ls: 2, align: 'center', color: '#8fa29e' });
      g.restore();
    });
  }
  // HRV bars
  const kh = E.outCubic(inv(46.4, 46.9, t)); const hx = 120, hy = 735, hw = 1680, hh2 = 185; panel(hx, hy, hw, hh2, kh);
  if (kh > 0) {
    g.save(); g.globalAlpha = kh; text(g, 'HRV · WEEKLY AVERAGE (ms)', hx + 40, hy + 50, { fam: 'Mono', w: 600, size: 16, ls: 3, color: '#8fa29e' });
    const bw2 = 90, gap = (hw - 480 - 12 * bw2) / 11;
    HRV.forEach((v, i) => { const t0 = 46.6 + i * .11, k = E.outBack(inv(t0, t0 + .45, t)); const bh = (v - 25) / 30 * 110 * k; const x = hx + 440 + i * (bw2 + gap);
      const bg = g.createLinearGradient(0, hy + 170 - bh, 0, hy + 170); bg.addColorStop(0, i === 11 ? MINT : 'rgba(98,230,207,.55)'); bg.addColorStop(1, 'rgba(98,230,207,.08)');
      g.fillStyle = bg; rr(g, x, hy + 170 - bh, bw2, Math.max(bh, 1), 8); g.fill(); if (k > .9) text(g, String(v), x + bw2 / 2, hy + 160 - bh, { fam: 'Mono', w: 600, size: 14, align: 'center', color: i === 11 ? MINT : '#8fa29e' }); });
    text(g, '+44%', hx + 40, hy + 140, { w: 800, size: 64, ls: -2, color: MINT, alpha: E.outCubic(inv(47.6, 48, t)) });
    g.restore();
  }
  g.restore();
  // particles converging (transition to logo)
  if (out > 0) {
    const r = rng(5); g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 900; i++) { const x0 = r() * W, y0 = r() * H, k = E.inCubic(clamp(out * 1.1 - r() * .1)); const x = lerp(x0, 960, k), y = lerp(y0, 500, k); g.fillStyle = `rgba(98,230,207,${.6 * (1 - k * .5)})`; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
    g.restore();
  }
  const f = inv(50.75, 51, t); if (f > 0) { g.fillStyle = `rgba(3,5,6,${f})`; g.fillRect(0, 0, W, H); }
}

function S7overlay(t) {
  g.clearRect(0, 0, W, H);
  // floor reflection fade
  const fg = g.createLinearGradient(0, 560, 0, 700); fg.addColorStop(0, 'rgba(0,0,0,.45)'); fg.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = fg; g.fillRect(0, 560, W, H - 560);
  const fade = 1 - inv(59.1, 59.9, t);
  g.save(); g.globalAlpha = fade;
  // wordmark wipe
  const kw = E.inOutCubic(inv(54.4, 55.3, t));
  if (kw > 0) {
    const wm = A.wordmarkMint, ww = 560, wh = ww * wm.height / wm.width, x = 960 - ww / 2, y = 690;
    g.save(); g.beginPath(); g.rect(x - 20, y - 20, (ww + 40) * kw, wh + 40); g.clip(); g.drawImage(wm, x, y + (1 - E.outCubic(kw)) * 20, ww, wh); g.restore();
    if (kw < 1) { g.fillStyle = '#e0fff8'; g.shadowColor = MINT; g.shadowBlur = 30; g.fillRect(x - 20 + (ww + 40) * kw - 2, y - 30, 4, wh + 60); g.shadowBlur = 0; }
  }
  stagger(g, 'YOUR FACE  ·  SIXTY SECONDS  ·  YOUR VITALS', 960, 900, t, 55.6, { fam: 'Mono', w: 600, size: 22, ls: 6, align: 'center', color: '#cfe9e3', d: .012 });
  text(g, 'GENERAL WELLNESS TOOL · NOT A MEDICAL DEVICE · NOT FOR DIAGNOSIS', 960, 1030, { fam: 'Mono', w: 400, size: 14, ls: 3, align: 'center', color: '#55625f', alpha: E.outCubic(inv(56.6, 57.2, t)) });
  g.restore();
  // reveal flash
  const fl = Math.exp(-Math.max(0, t - 52.6) * 7) * (t >= 52.55 ? 1 : 0) + inv(52.35, 52.6, t) * (t < 52.6 ? 1 : 0) * .8;
  if (fl > 0.01) { const rg = g.createRadialGradient(960, 420, 0, 960, 420, 1100); rg.addColorStop(0, `rgba(230,255,250,${fl})`); rg.addColorStop(1, `rgba(98,230,207,${fl * .2})`); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
  if (t > 59.9) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); }
}

// ---------- HUD ----------
const grain = [];
function makeGrain() {
  const r = rng(99);
  for (let k = 0; k < 6; k++) { const c = document.createElement('canvas'); c.width = 960; c.height = 540; const x = c.getContext('2d'); const id = x.createImageData(960, 540);
    for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } x.putImageData(id, 0, 0); grain.push(c); }
}
function tc(t) { const f = Math.floor(t * FPS + 1e-6), s = Math.floor(f / FPS), ff = f % FPS; return `00:00:${String(s).padStart(2, '0')}:${String(ff).padStart(2, '0')}`; }
function HUD(t) {
  h.clearRect(0, 0, W, H);
  const si = SC.findIndex(s => t >= s.t0 && t < s.t1), S = SC[Math.max(0, si)];
  const hudA = (1 - inv(57.6, 58.3, t)) * inv(0.2, .6, t);
  h.save(); h.globalAlpha = hudA;
  // corner marks
  h.strokeStyle = 'rgba(233,242,240,.35)'; h.lineWidth = 1.5; const m = 40, L = 22;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, a, b]) => { h.beginPath(); h.moveTo(x, y + b * L); h.lineTo(x, y); h.lineTo(x + a * L, y); h.stroke(); });
  text(h, 'VITALKICK', 72, 82, { fam: 'Mono', w: 600, size: 15, ls: 4, color: OFF });
  text(h, 'MOTION REEL — 2026', 72, 104, { fam: 'Mono', w: 400, size: 13, ls: 3, color: '#7f918d' });
  h.fillStyle = CORAL; h.globalAlpha = hudA * (Math.floor(t * 2) % 2 ? .35 : 1); h.beginPath(); h.arc(W - 278, 77, 5, 0, 7); h.fill(); h.globalAlpha = hudA;
  text(h, 'REC  ' + tc(t), W - 72, 82, { fam: 'Mono', w: 600, size: 15, ls: 2, align: 'right', color: OFF });
  text(h, '1920×1080 · 60 FPS', W - 72, 104, { fam: 'Mono', w: 400, size: 13, ls: 3, align: 'right', color: '#7f918d' });
  // progress segments
  const pw = 34, pg = 8, px = W - 72 - (7 * pw + 6 * pg), py = H - 76;
  SC.forEach((s, i) => { const p = clamp((t - s.t0) / (s.t1 - s.t0)); h.fillStyle = 'rgba(233,242,240,.18)'; h.fillRect(px + i * (pw + pg), py, pw, 3); h.fillStyle = MINT; h.fillRect(px + i * (pw + pg), py, pw * p, 3); });
  // skill label
  if (si >= 0) {
    const ki = E.outExpo(inv(S.t0 + .15, S.t0 + .7, t)), ko = E.inCubic(inv(S.t1 - .25, S.t1 - .02, t));
    const k = ki * (1 - ko);
    const x = 72, y = H - 72;
    h.save(); h.beginPath(); h.rect(x - 4, y - 110, 900 * k, 130); h.clip();
    text(h, S.n, x, y - 2, { fam: 'Grotesk', w: 700, size: 76, ls: -2, color: MINT, stroke: true, lw: 1.6 });
    h.fillStyle = MINT; h.fillRect(x + 108, y - 58, 2, 56);
    text(h, S.name, x + 128, y - 30, { fam: 'Mono', w: 600, size: 22, ls: 4, color: OFF });
    text(h, S.sub, x + 128, y - 4, { fam: 'Mono', w: 400, size: 14, ls: 3, color: '#a3b4b0' });
    h.restore();
    // label "chip" flash on entry
    const fl = Math.exp(-Math.max(0, t - S.t0 - .15) * 8) * (t > S.t0 + .15 ? 1 : 0);
    if (fl > .02) { h.fillStyle = `rgba(98,230,207,${fl * .5})`; h.fillRect(x - 4, y - 110, 900 * k, 2); }
  }
  h.restore();
  // vignette + grain
  const vg = h.createRadialGradient(960, 540, 420, 960, 540, 1250); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); h.fillStyle = vg; h.fillRect(0, 0, W, H);
  h.save(); h.globalCompositeOperation = 'overlay'; h.globalAlpha = .07; h.drawImage(grain[Math.floor(t * FPS) % grain.length], 0, 0, W, H); h.restore();
}

// ---------- master ----------
const CLEAN = location.search.includes('clean');
function renderAt(t) {
  shake(t);
  webEl.style.display = 'none';
  const gl3 = (t >= 9 && t < 17) || (t >= 18.5 && t < 27) || t >= 51;
  glc.style.visibility = gl3 ? 'visible' : 'hidden';
  if (t < 9) { g.clearRect(0, 0, W, H); S1(t); }
  else if (t < 17) { renderLiquid(t); if (CLEAN) g.clearRect(0, 0, W, H); else S2overlay(t); }
  else if (t < 18.5) { S3a(t); }
  else if (t < 21) { renderHead(t); if (CLEAN) { g.clearRect(0, 0, W, H); const bf = g.createLinearGradient(0, 760, 0, 1080); bf.addColorStop(0, 'rgba(0,0,0,0)'); bf.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = bf; g.fillRect(0, 760, W, 320); } else S3bOverlay(t); }
  else if (t < 27) { renderPhone(t); if (CLEAN) g.clearRect(0, 0, W, H); else S3cOverlay(t); }
  else if (t < 35) { g.clearRect(0, 0, W, H); S4(t); S4overlay(t); }
  else if (t < 42) { S5(t); }
  else if (t < 51) { S6(t); }
  else { renderLogo(t); S7overlay(t); }
  if (CLEAN) h.clearRect(0, 0, W, H); else HUD(t);
  return true;
}

async function init() {
  await Promise.all(['300 10px Inter', '400 10px Inter', '600 10px Inter', '800 10px Inter', '900 10px Inter', '700 10px Grotesk', '500 10px Grotesk', '400 10px Mono', '600 10px Mono', 'italic 400 10px ISerif', '400 10px ISerif'].map(f => document.fonts.load(f)));
  const [corridor, selfie, face, avocado, wordmark, vmark] = await Promise.all([loadImg('assets/corridor.jpg'), loadImg('assets/selfie.jpg'), loadImg('assets/face.jpg'), loadImg('assets/avocado.jpg'), loadImg('assets/wordmark.png'), fetch('assets/vmark.json').then(r => r.json())]);
  Object.assign(A, { corridor, selfie, face, avocado, wordmark, vmark });
  // mint-tinted wordmark
  const wm = document.createElement('canvas'); wm.width = wordmark.width; wm.height = wordmark.height; const wx = wm.getContext('2d'); wx.drawImage(wordmark, 0, 0); wx.globalCompositeOperation = 'source-in'; wx.fillStyle = MINT; wx.fillRect(0, 0, wm.width, wm.height); A.wordmarkMint = wm;
  // text particles
  const oc = document.createElement('canvas'); oc.width = W; oc.height = H; const ox = oc.getContext('2d');
  text(ox, 'no one is listening.', 960, 640, { fam: 'ISerif', style: 'italic', w: 400, size: 130, align: 'center', color: '#fff' });
  const id = ox.getImageData(0, 0, W, H).data, P = [], pr = rng(4);
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) if (id[(y * W + x) * 4 + 3] > 120) P.push({ x0: x, y0: y, vx: (pr() - .5) * 2, r: pr() });
  A.textParticles = P;
  makeGrain();
  document.querySelectorAll('.wl').forEach(el => {
    const tag = document.createElement('div'); tag.className = 'tag'; tag.textContent = el.dataset.tag; tag.style.left = el.dataset.tx + 'px'; tag.style.top = el.dataset.ty + 'px'; el.appendChild(tag);
    const box = el.querySelector('.box'); const ol = document.createElement('div'); ol.className = 'outline';
    ol.style.left = (box.offsetLeft - 8) + 'px'; ol.style.top = (box.offsetTop - 8) + 'px'; ol.style.width = (box.offsetWidth + 16) + 'px'; ol.style.height = (box.offsetHeight + 16) + 'px';
    if (el.id === 'bgL') { ol.style.left = '0px'; ol.style.top = '0px'; ol.style.width = '1440px'; ol.style.height = '1480px'; }
    el.appendChild(ol);
    layers.push({ el, tag, ol });
  });
  webEl.style.display='block'; pageEl.style.transform='none'; { const pr0=pageEl.getBoundingClientRect(), cr=document.getElementById('cta').getBoundingClientRect(); CTA.x=cr.left-pr0.left+cr.width/2; CTA.y=cr.top-pr0.top+cr.height/2; } webEl.style.display='none';
  buildLiquid(); await buildHead(); buildPhone(); await buildLogo();
  // warm up shader compiles
  for (const tt of [9.5, 19.5, 22, 53]) renderAt(tt);
  window.renderAt = renderAt; window.ready = true; console.log('CTA', JSON.stringify(CTA));
}
init().catch(e => { console.error('INIT', e.message, e.stack); });
