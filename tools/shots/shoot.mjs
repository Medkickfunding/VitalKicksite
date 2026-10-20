// Screenshot any page at desktop and iPhone size, and report sideways overflow and script errors.
//   cd tools && npm install && cd ..
//   python3 -m http.server 8123 &            (from the repository root)
//   node tools/shots/shoot.mjs index.html [out-dir]
// Uses the Chromium that Playwright finds, or PW_CHROMIUM=/path/to/chromium.
import { chromium, devices } from 'playwright-core';
const page = process.argv[2] || 'index.html', out = process.argv[3] || '/tmp';
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [tag, opt] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['iphone', devices['iPhone 13']]]) {
  const p = await b.newPage(opt);
  p.on('pageerror', e => console.log(tag, 'SCRIPT ERROR', e.message));
  await p.goto(`http://localhost:8123/${page}`); await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
  await p.waitForTimeout(1500);
  const H = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < H; y += 600) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(80); }
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/${page.replace('.html', '')}-${tag}.png`, fullPage: true });
  console.log(tag, 'sideways overflow px:', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
}
await b.close();
