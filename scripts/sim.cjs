const { chromium } = require('playwright');
const D='/tmp/claude-0/-home-claude/f4336d96-8558-5573-8a27-37d04b5c3790/scratchpad/';
(async()=>{const b=await chromium.launch();const errs=[];
for(const [n,vp] of [['simd',{width:1360,height:900}],['simm',{width:390,height:844}]]){
const p=await (await b.newContext({viewport:vp,colorScheme:'light'})).newPage();
p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/monopoly/dist/index.html');await p.waitForTimeout(800);
await p.click('button:has-text("Simulate")');await p.click('button:has-text("Play")');await p.waitForTimeout(6000);
await p.evaluate(()=>document.querySelector('#board').scrollIntoView());await p.waitForTimeout(800);
await p.screenshot({path:D+n+'.png',fullPage:false});
await p.evaluate(()=>window.scrollBy(0,700));await p.waitForTimeout(600);await p.screenshot({path:D+n+'2.png'});
if(n==='simd'){await p.evaluate(()=>document.querySelector('#test').scrollIntoView());await p.click('text=Run the held-out test');await p.waitForTimeout(5000);await p.evaluate(()=>window.scrollBy(0,250));await p.waitForTimeout(500);await p.screenshot({path:D+'test.png'});}
}
console.log(errs);await b.close()})();
