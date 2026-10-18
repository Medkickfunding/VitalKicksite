// Real-time 3D tissue block for the "How it works" section.
// Scroll progress arrives as window.__skinP (0..1). Labels for the 2D overlay go out as window.__skinLabels.
import * as THREE from './three.module.min.js';

const canvas = document.getElementById('skin3d');
const section = document.getElementById('light');
if (canvas && section) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { renderer = null; }
  if (renderer) {
    window.__skin3d = true;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 100);

    // studio environment for soft reflections
    const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x050808, side: THREE.BackSide })));
    const strip = (w, h, col, I, p) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(I), side: THREE.DoubleSide })); m.position.set(...p); m.lookAt(0, 0, 0); es.add(m); };
    strip(8, 2, 0xffffff, 2.4, [0, 10, 2]); strip(2, 10, 0x62e6cf, 3.5, [-9, 1, 3]); strip(2, 10, 0xffe2d6, 2.2, [9, 2, -2]); strip(6, 3, 0xffffff, 1.6, [0, 3, 10]);
    scene.environment = pm.fromScene(es, .02).texture;

    scene.add(new THREE.HemisphereLight(0xcfe9e4, 0x1a0c0a, .55));
    const key = new THREE.DirectionalLight(0xfff1e8, 1.7); key.position.set(-3, 6, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0x62e6cf, 2.2); rim.position.set(4, 2, -5); scene.add(rim);

    // ---------- procedural textures ----------
    const tex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pores = tex(512, 512, (g, w, h) => { g.fillStyle = '#808080'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { const x = rnd() * w, y = rnd() * h, r = .6 + rnd() * 2.2; g.fillStyle = `rgba(${rnd() < .5 ? 40 : 200},${rnd() < .5 ? 40 : 200},${rnd() < .5 ? 40 : 200},.18)`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } for (let i = 0; i < 60; i++) { g.strokeStyle = 'rgba(40,40,40,.22)'; g.lineWidth = .8; g.beginPath(); const x = rnd() * w, y = rnd() * h; g.moveTo(x, y); g.bezierCurveTo(x + rnd() * 80, y + rnd() * 20, x + rnd() * 120, y - rnd() * 20, x + 140, y + rnd() * 30); g.stroke(); } }, false);
    const epiMap = tex(512, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d9a48c'); gr.addColorStop(1, '#b97e68'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(150,90,70,${rnd() * .08})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 1); } });
    const derMap = tex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#c9837a'); gr.addColorStop(1, '#a15a55'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { const x = rnd() * w, y = rnd() * h; g.strokeStyle = `rgba(${rnd() < .5 ? 250 : 120},${rnd() < .5 ? 200 : 80},${rnd() < .5 ? 190 : 80},${.06 + rnd() * .08})`; g.lineWidth = .6 + rnd() * 1.6; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 40, y - 8 + rnd() * 16, x + 80, y - 8 + rnd() * 16, x + 120 + rnd() * 80, y - 6 + rnd() * 12); g.stroke(); } });
    const fatMap = tex(512, 512, (g, w, h) => { g.fillStyle = '#b8863f'; g.fillRect(0, 0, w, h); const pts = []; for (let i = 0; i < 90; i++) pts.push([rnd() * w, rnd() * h, 18 + rnd() * 26]); pts.forEach(([x, y, r]) => { const gr = g.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); gr.addColorStop(0, '#fbe6a6'); gr.addColorStop(.75, '#e8c375'); gr.addColorStop(1, 'rgba(176,120,50,.0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,90,40,.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r * .92, 0, 7); g.stroke(); }); });

    // ---------- tissue slabs ----------
    const W = 4.2, D = 2.6;
    const slab = (h, mat) => {
      const r = .08, s = new THREE.Shape(); const x0 = -W / 2, z0 = -D / 2;
      s.moveTo(x0 + r, z0); s.lineTo(x0 + W - r, z0); s.quadraticCurveTo(x0 + W, z0, x0 + W, z0 + r); s.lineTo(x0 + W, z0 + D - r); s.quadraticCurveTo(x0 + W, z0 + D, x0 + W - r, z0 + D); s.lineTo(x0 + r, z0 + D); s.quadraticCurveTo(x0, z0 + D, x0, z0 + D - r); s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
      const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 3, curveSegments: 6 });
      geo.rotateX(-Math.PI / 2);
      // planar UVs from world xz / y so textures run cleanly across cut faces
      const pos = geo.attributes.position, uv = geo.attributes.uv, n = geo.attributes.normal;
      for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), ny = Math.abs(n.getY(i)), nx = Math.abs(n.getX(i)); if (ny > .5) uv.setXY(i, x / W + .5, z / D + .5); else if (nx > .5) uv.setXY(i, z / D * .6 + .5, y / .9); else uv.setXY(i, x / W + .5, y / .9); }
      const m = new THREE.Mesh(geo, mat); return m;
    };
    const epiMat = new THREE.MeshPhysicalMaterial({ map: epiMap, bumpMap: pores, bumpScale: 1.2, roughness: .48, clearcoat: .35, clearcoatRoughness: .5, sheen: .8, sheenColor: new THREE.Color(0xffd0c0), sheenRoughness: .5, transparent: true, opacity: .9 });
    epiMat.color = new THREE.Color(0xe7c1ae);
    const derMat = new THREE.MeshPhysicalMaterial({ map: derMap, roughness: .55, clearcoat: .15, sheen: .5, sheenColor: new THREE.Color(0xff9a90), emissive: new THREE.Color(0x3a0b0b), emissiveIntensity: .25, transparent: true, opacity: .86 });
    const fatMat = new THREE.MeshPhysicalMaterial({ map: fatMap, roughness: .35, clearcoat: .6, clearcoatRoughness: .25, sheen: .4, sheenColor: new THREE.Color(0xfff0c0) });
    const H_EPI = .16, H_DER = .9, H_FAT = .8;
    const block = new THREE.Group(); scene.add(block);
    const epi = slab(H_EPI, epiMat), der = slab(H_DER, derMat), fat = slab(H_FAT, fatMat);
    block.add(epi, der, fat);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x62e6cf, transparent: true, opacity: 0 });
    [epi, der, fat].forEach(m => { const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), edgeMat); m.add(e); });

    const shTex = tex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.9, D * 2.2), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false })); shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
    const glowTex = tex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(98,230,207,.35)'); gr.addColorStop(1, 'rgba(98,230,207,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(W * 2.6, D * 2.8), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); glow.rotation.x = -Math.PI / 2; scene.add(glow);

    // ---------- vessels (live in the dermis) ----------
    const vessels = new THREE.Group(); der.add(vessels);
    const artMat = new THREE.MeshPhysicalMaterial({ color: 0xd11a2e, roughness: .25, clearcoat: 1, clearcoatRoughness: .15, emissive: new THREE.Color(0x7a0010), emissiveIntensity: .6, transparent: true, opacity: .96 });
    const venMat = new THREE.MeshPhysicalMaterial({ color: 0x7a2a6a, roughness: .3, clearcoat: 1, clearcoatRoughness: .2, emissive: new THREE.Color(0x2a0830), emissiveIntensity: .4 });
    const curves = [], loops = [];
    const zF = D / 2 + .155; // vessels show on the front cut face
    const art = new THREE.CatmullRomCurve3([...Array(9)].map((_, i) => new THREE.Vector3(-W / 2 + .02 + i * (W - .04) / 8, .18 + Math.sin(i * 1.3) * .03, zF - .12 - Math.cos(i) * .05)));
    const ven = new THREE.CatmullRomCurve3([...Array(9)].map((_, i) => new THREE.Vector3(-W / 2 + .02 + i * (W - .04) / 8, .3 + Math.cos(i * 1.1) * .03, zF - .5 - Math.sin(i) * .05)));
    vessels.add(new THREE.Mesh(new THREE.TubeGeometry(art, 120, .07, 12, false), artMat));
    vessels.add(new THREE.Mesh(new THREE.TubeGeometry(ven, 120, .085, 12, false), venMat));
    curves.push({ c: art, col: 0xff3344 }, { c: ven, col: 0xb04a9a });
    for (let i = 0; i < 9; i++) {
      for (const zz of [zF - .14, zF - .9, zF - 1.6]) {
        const x = -W / 2 + .3 + i * (W - .6) / 8 + (zz < 0 ? .12 : 0), top = H_DER - .1 - (i % 2) * .06;
        const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x - .1, .18, zz), new THREE.Vector3(x - .12, top * .6, zz + .02), new THREE.Vector3(x - .05, top, zz), new THREE.Vector3(x + .06, top, zz - .01), new THREE.Vector3(x + .12, top * .6, zz + .02), new THREE.Vector3(x + .1, .3, zz)]);
        const g = new THREE.TubeGeometry(c, 48, .03, 8, false); const ctr = new THREE.Vector3(x, top * .55, zz); g.translate(-ctr.x, -ctr.y, -ctr.z);
        const m = new THREE.Mesh(g, artMat); m.position.copy(ctr); vessels.add(m); loops.push(m);
        if (zz === zF - .14) curves.push({ c, col: 0xff5560 });
      }
    }
    // red cells flowing along the front vessels
    const rbcGeo = new THREE.SphereGeometry(.028, 10, 8); rbcGeo.scale(1, .45, 1);
    const RBC = 140, rbc = new THREE.InstancedMesh(rbcGeo, new THREE.MeshStandardMaterial({ color: 0xff4455, emissive: 0x900018, emissiveIntensity: .8, roughness: .3 }), RBC);
    vessels.add(rbc);
    const rbcPath = [...Array(RBC)].map((_, i) => ({ k: i % curves.length, o: (i * .618) % 1, sp: .06 + (i % 5) * .012 }));
    const dummy = new THREE.Object3D();

    // ---------- green light: photons in, some absorbed, some back to the camera ----------
    const PH = 26, phGeo = new THREE.BufferGeometry(); phGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(PH * 3), 3)); phGeo.setAttribute('alpha', new THREE.Float32BufferAttribute(new Float32Array(PH), 1));
    const phMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uS: { value: 30 } },
      vertexShader: 'attribute float alpha; varying float vA; uniform float uS; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = uS / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying float vA; void main(){ float d = length(gl_PointCoord - .5); if (d > .5) discard; gl_FragColor = vec4(vec3(.45,1.,.62) * (1. - d * 1.6) * vA * 1.6, vA); }' });
    const photons = new THREE.Points(phGeo, phMat); scene.add(photons);
    const rayMat = new THREE.LineBasicMaterial({ color: 0x5bff9e, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const rayGeo = new THREE.BufferGeometry(); rayGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(PH * 6 * 2), 3));
    const rays = new THREE.LineSegments(rayGeo, rayMat); scene.add(rays);
    const LIGHT = new THREE.Vector3(-3.2, 3.6, 1.4), CAMPT = new THREE.Vector3(3.4, 3.2, 2.2);
    const phData = [...Array(PH)].map((_, i) => ({ x: -1.6 + (i % 13) * .26, z: .25 + Math.floor(i / 13) * .5 - .2, absorbed: i % 3 === 1, o: (i * .37) % 1 }));

    // ---------- labels ----------
    const labelPts = [
      { t: 'EPIDERMIS', obj: epi, p: new THREE.Vector3(-W * .3, H_EPI * .5, D / 2) },
      { t: 'DERMIS · CAPILLARIES', obj: der, p: new THREE.Vector3(-W * .3, H_DER * .55, D / 2) },
      { t: 'SUBCUTANEOUS FAT', obj: fat, p: new THREE.Vector3(-W * .3, H_FAT * .5, D / 2) },
    ];

    const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), inv = (a, b, x) => clamp((x - a) / (b - a)), lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const beat = t => { const k = t % .85; return Math.exp(-k * 9) + .55 * Math.exp(-Math.max(0, k - .16) * 11) * (k > .16 ? 1 : 0); };
    const tmp = new THREE.Vector3();

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      if (canvas.width !== Math.round(w * renderer.getPixelRatio())) renderer.setSize(w, h, false);
      cam.aspect = w / h;
      // push the block to the right on desktop, up on phones
      if (w >= 860) cam.setViewOffset(w, h, -w * .2, 0, w, h); else cam.setViewOffset(w, h, 0, h * .2, w, h);
      cam.updateProjectionMatrix();
    }

    function render(time) {
      const t = time / 1000, p = clamp(window.__skinP || 0), narrow = canvas.clientWidth < 860;
      resize();
      // explode: thin cuts open between layers
      const ex = ease(inv(.18, .45, p)) * (1 - .55 * ease(inv(.85, 1, p)));
      fat.position.y = -H_FAT - .02 - ex * .55;
      shadow.position.y = fat.position.y - .05; glow.position.y = fat.position.y - .06; glow.material.opacity = .5 + .5 * beat(t);
      der.position.y = 0;
      epi.position.y = H_DER + .02 + ex * .6;
      edgeMat.opacity = .55 * ex;
      // camera: slow cinematic orbit plus a gentle float
      const ang = lerp(-.55, .35, ease(p)) + Math.sin(t * .25) * .04;
      const dist = lerp(narrow ? 23 : 14.2, narrow ? 21 : 12.6, ease(inv(.4, .75, p)));
      const el = lerp(.5, .32, ease(inv(.3, .8, p)));
      cam.position.set(Math.sin(ang) * dist * Math.cos(el), Math.sin(el) * dist + .3, Math.cos(ang) * dist * Math.cos(el));
      cam.lookAt(0, .35, 0);
      block.rotation.y = Math.sin(t * .2) * .03;
      // heartbeat
      const b = beat(t);
      loops.forEach((m, i) => { const s = 1 + .22 * b * (1 - (i % 3) * .2); m.scale.set(s, 1 + .04 * b, s); });
      artMat.emissiveIntensity = .55 + .9 * b;
      derMat.emissiveIntensity = .2 + .25 * b;
      // red cells
      rbcPath.forEach((r, i) => { const cv = curves[r.k].c; const u = (r.o + t * r.sp) % 1; cv.getPointAt(u, tmp); dummy.position.copy(tmp); dummy.rotation.set(t + i, i, 0); dummy.updateMatrix(); rbc.setMatrixAt(i, dummy.matrix); });
      rbc.instanceMatrix.needsUpdate = true;
      // photons
      const kp = inv(.3, .45, p), pa = phGeo.attributes.position.array, aa = phGeo.attributes.alpha.array, ra = rayGeo.attributes.position.array;
      const topY = epi.position.y + H_EPI;
      phData.forEach((d, i) => {
        const hit = new THREE.Vector3(d.x, H_DER * .72, d.z);
        der.localToWorld(hit.clone());
        const ph = (t * .45 + d.o) % 1; let x, y, z, a;
        if (ph < .55) { const k = ph / .55; x = lerp(LIGHT.x, hit.x, k); y = lerp(LIGHT.y, hit.y, k); z = lerp(LIGHT.z, hit.z, k); a = 1; }
        else if (d.absorbed) { x = hit.x; y = hit.y; z = hit.z; a = 1 - (ph - .55) / .45; }
        else { const k = (ph - .55) / .45; x = lerp(hit.x, CAMPT.x, k); y = lerp(hit.y, CAMPT.y, k); z = lerp(hit.z, CAMPT.z, k); a = 1 - k * .3; }
        pa[i * 3] = x; pa[i * 3 + 1] = y; pa[i * 3 + 2] = z; aa[i] = a * kp;
        const o = i * 12; ra.set([LIGHT.x, LIGHT.y, LIGHT.z, hit.x, hit.y, hit.z], o); ra.set(d.absorbed ? [hit.x, hit.y, hit.z, hit.x, hit.y, hit.z] : [hit.x, hit.y, hit.z, CAMPT.x, CAMPT.y, CAMPT.z], o + 6);
      });
      phGeo.attributes.position.needsUpdate = true; phGeo.attributes.alpha.needsUpdate = true; rayGeo.attributes.position.needsUpdate = true;
      rayMat.opacity = .28 * kp; phMat.uniforms.uS.value = (narrow ? 34 : 46) * renderer.getPixelRatio();
      renderer.render(scene, cam);
      // labels for the 2D overlay
      const w = canvas.clientWidth, h = canvas.clientHeight, la = inv(.3, .45, p) * (1 - inv(.62, .72, p));
      window.__skinLabels = labelPts.map(L => { tmp.copy(L.p); L.obj.localToWorld(tmp); tmp.project(cam); return { t: L.t, x: (tmp.x * .5 + .5) * w, y: (-tmp.y * .5 + .5) * h, a: la }; });
      window.__skinLight = (() => { tmp.copy(LIGHT); tmp.project(cam); const l = { x: (tmp.x * .5 + .5) * w, y: (-tmp.y * .5 + .5) * h }; tmp.copy(CAMPT); tmp.project(cam); return { light: l, cam: { x: (tmp.x * .5 + .5) * w, y: (-tmp.y * .5 + .5) * h }, a: kp }; })();
    }
    let on = false;
    const loop = now => { if (!on) return; render(now); requestAnimationFrame(loop); };
    new IntersectionObserver(es => es.forEach(e => { const was = on; on = e.isIntersecting; if (on && !was) requestAnimationFrame(loop); }), { rootMargin: '20% 0px' }).observe(section);
    window.__renderSkin3d = render;
  }
}
