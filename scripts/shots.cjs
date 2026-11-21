const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [name, vp, scheme] of [['desk-light',{width:1360,height:900},'light'],['desk-dark',{width:1360,height:900},'dark'],['mob-light',{width:390,height:844},'light'],['mob-dark',{width:390,height:844},'dark']]) {
    const ctx = await b.newContext({ viewport: vp, colorScheme: scheme, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(name+': '+e.message));
    p.on('console', m => m.type()==='error' && errs.push(name+' console: '+m.text()));
    await p.goto('file:///home/claude/monopoly/dist/index.html');
    await p.waitForTimeout(1500);
    // trigger reveals by scrolling
    const h = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < h; y += 500) { await p.evaluate(y => window.scrollTo(0, y), y); await p.waitForTimeout(150); }
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `/tmp/claude-0/-home-claude/f4336d96-8558-5573-8a27-37d04b5c3790/scratchpad/${name}.png`, fullPage: true });
    console.log(name, 'height', h, 'overflowX', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    await ctx.close();
  }
  console.log('errors', errs);
  await b.close();
})();
