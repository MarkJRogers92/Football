const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
async function startNewDynasty(page){await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
    const fx=await page.evaluate(()=>window.__DL_TEST__.weeklyPersonnelForceFixture());assert.ok(fx,'fixture should create a starter-pressure decision');const before=await page.evaluate(()=>window.__DL_TEST__.weeklyPersonnelDepth('QB'));assert.equal(before[0],fx.starterId);
    await page.waitForFunction(id=>document.querySelector(`[data-decision="${id}"][data-choice="promote"]`),fx.id,{timeout:10000});const card=page.locator(`[data-decision="${fx.id}"]`).first().locator('xpath=ancestor::*[contains(@class,"decision-card")]');assert.match(await card.textContent(),/starter pressure/i);
    await page.click(`[data-decision="${fx.id}"][data-choice="promote"]`);await page.waitForFunction(id=>window.__DL_TEST__.weeklyPersonnelDebug()?.decision?.id===id&&window.__DL_TEST__.weeklyPersonnelDebug()?.decision?.resolved===true,fx.id,{timeout:10000});const after=await page.evaluate(()=>window.__DL_TEST__.weeklyPersonnelDepth('QB'));assert.equal(after[0],fx.challengerId,'promote choice should move challenger to top of QB depth order');
    assert.deepEqual(errors,[],`weekly personnel browser emitted errors: ${errors.join('\n')}`);console.log('PASS v0.10.2 personnel decision: controlled starter-pressure choice promotes challenger in real depth order')
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
