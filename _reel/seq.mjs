import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';
const [name, t0, t1, n] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5]];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport:{width:1920,height:1080} });
await p.goto('http://localhost:8123/index.html?clean'); await p.waitForFunction(()=>window.ready,null,{timeout:300000});
mkdirSync(`seqraw/${name}`, { recursive: true });
for (let i = 0; i < n; i++) { const t = t0 + (t1 - t0) * i / (n - 1); await p.evaluate(t => window.renderAt(t), t);
  for (let tr = 0; ; tr++) { try { await p.screenshot({ path: `seqraw/${name}/${String(i).padStart(3,'0')}.png`, timeout: 0 }); break; } catch (e) { if (tr > 3) throw e; } } }
await b.close(); console.log('DONE', name);
