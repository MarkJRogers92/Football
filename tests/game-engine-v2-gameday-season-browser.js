const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
async function startNewDynasty(page){await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);const soak=await page.evaluate(()=>window.__DL_TEST__.v2InteractiveSeasonSoakProbe());console.log('INTERACTIVE GAME DAY SEASON SOAK',JSON.stringify(soak));
    assert.equal(soak.ok,true,`Interactive Game Day season soak failed: ${JSON.stringify(soak)}`);assert.equal(soak.weeks,12);assert.equal(soak.recordDelta,12);assert.equal(soak.archiveDelta,12);assert.equal(new Set(soak.ids).size,12);assert.equal(soak.phase,'confReady');assert.ok(soak.driveCounts.every(n=>n>0));assert.ok(soak.decisionCounts.every(n=>n>0));assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
    console.log(`PASS v0.10.1 full Interactive Game Day season soak; drives=${soak.driveCounts.join(',')}; decisions=${soak.decisionCounts.join(',')}`)
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
