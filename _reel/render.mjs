import { chromium } from 'playwright-core';
import { spawn } from 'child_process';
const [a, b, out] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const p = await br.newPage({ viewport:{width:1920,height:1080} });
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8123/index.html'); await p.waitForFunction(()=>window.ready,null,{timeout:300000});
const ff = spawn('ffmpeg', ['-y','-loglevel','error','-f','image2pipe','-framerate','60','-c:v','png','-i','-','-c:v','libx264','-preset','medium','-crf','13','-pix_fmt','yuv420p','-r','60',out], { stdio:['pipe','inherit','inherit'] });
const T0 = Date.now();
for (let f = a; f < b; f++) {
  await p.evaluate(t => window.renderAt(t), f / 60);
  let buf; for (let tr = 0; ; tr++) { try { buf = await p.screenshot({ type:'png', timeout: 0 }); break; } catch (e) { if (tr > 3) throw e; } }
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if ((f - a) % 60 === 0) console.log(out, f, ((Date.now() - T0) / (f - a + 1)).toFixed(0) + 'ms/f');
}
ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close(); console.log('DONE', out);
