'use strict';

// v0.28: the offseason stops carry their decision. Departures offers NIL deals to the players closest to leaving,
// signing releases commitments when the class is over the limit, and the portal stop pursues the best fits and plays
// out the portal's rounds when the coach moves on.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

async function advanceTo(page,re){
 for(let guard=0;guard<14&&!re.test(await page.locator('#hubAdvance').innerText());guard++){
  const label=await page.locator('#hubAdvance').innerText();await page.click('#hubAdvance');
  if(await page.locator('#offseasonStop [data-offseason-stop-go]').count())await page.click('#offseasonStop [data-offseason-stop-go]');
  await page.waitForFunction(old=>document.querySelector('#hubAdvance').textContent!==old,label,{timeout:60000});
 }
 assert.match(await page.locator('#hubAdvance').innerText(),re);
}

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:width<500?844:900}}),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));page.on('dialog',d=>d.accept());
   await page.goto(testPageURL());
   await startNewDynasty(page);
   await page.evaluate(()=>document.querySelector('#simSeason').click());
   await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().phase!=='regular',null,{timeout:180000});
   await advanceTo(page,/Process Departures/);

   // Departures: an NIL deal on the card lowers the player's risk and spends the budget.
   const risky=await page.evaluate(()=>window.__DL_TEST__.departuresRiskFixture());
   await page.click('#hubAdvance');
   const stop=page.locator('#offseasonStop');await stop.waitFor({state:'visible'});
   assert.match(await stop.locator('h3').innerText(),/close to leaving/);
   const id=String(risky[0].id),offer=stop.locator(`[data-stop-nil="${id}"]`);
   assert.equal(await offer.getAttribute('aria-pressed'),'false');
   const budget=await stop.locator('[data-stop-budget]').innerText();
   await offer.click();
   assert.equal(await stop.locator(`[data-stop-nil="${id}"]`).getAttribute('aria-pressed'),'true','the deal is shown as held');
   assert.notEqual(await stop.locator('[data-stop-budget]').innerText(),budget,'the budget is spent');
   assert.match(await stop.locator(`[data-stop-nil="${id}"]`).locator('xpath=..').innerText(),/with the deal/);
   assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.stopNil),id,'focus stays on the row');
   await stop.locator(`[data-stop-nil="${id}"]`).click();
   assert.equal(await stop.locator(`[data-stop-nil="${id}"]`).getAttribute('aria-pressed'),'false','a deal can be released on the card');
   assert.equal(await stop.locator('[data-stop-budget]').innerText(),budget,'the money comes back');
   await stop.locator(`[data-stop-nil="${id}"]`).click();
   await page.click('#offseasonStop [data-offseason-stop-go]');
   await page.waitForFunction(()=>/Enroll Signing Class/.test(document.querySelector('#hubAdvance').textContent),null,{timeout:60000});

   // Signing: release commitments until the class fits.
   const over=await page.evaluate(()=>window.__DL_TEST__.signingOverFixture(2));
   assert.equal(over.over,2);
   await page.click('#hubAdvance');await stop.waitFor({state:'visible'});
   assert.match(await stop.locator('h3').innerText(),/^Your class is 2 over the limit$/);
   await stop.locator('[data-stop-release]').first().click();
   assert.match(await stop.locator('h3').innerText(),/^Your class is 1 over the limit$/);
   await stop.locator('[data-stop-release]').first().click();
   assert.match(await stop.locator('h3').innerText(),/^Your class fits/);
   assert.equal(await stop.locator('[data-stop-release]').count(),0);
   await page.click('#offseasonStop [data-offseason-stop-go]');
   await page.waitForFunction(()=>/Resolve Transfer Portal/.test(document.querySelector('#hubAdvance').textContent),null,{timeout:60000});

   // Portal: pursue from the card; moving on plays out the rounds before the portal is resolved.
   await page.click('#hubAdvance');
   if(await stop.count()&&await stop.locator('[data-stop-att]').count()){
    const first=stop.locator('[data-stop-att][data-dir="up"]').first(),cid=await first.getAttribute('data-stop-att');
    await first.click();
    let st=await page.evaluate(()=>window.__DL_TEST__.portalStopState());
    assert.equal(st.status,'open','pursuing opens the portal rounds');
    assert.deepEqual(st.targets.map(x=>[x.candidateId,x.attention]),[[cid,1]]);
    assert.match(await stop.locator('h3').innerText(),/^You are pursuing 1 transfer$/);
    await stop.locator(`[data-stop-att="${cid}"][data-dir="up"]`).click();
    st=await page.evaluate(()=>window.__DL_TEST__.portalStopState());
    assert.equal(st.targets[0].attention,2);assert.equal(st.left,8);
    await page.click('#offseasonStop [data-offseason-stop-go]');
    await page.waitForFunction(()=>!/Resolve Transfer Portal/.test(document.querySelector('#hubAdvance').textContent),null,{timeout:60000});
    st=await page.evaluate(()=>window.__DL_TEST__.portalStopState());
    assert.equal(st.status,'resolved','the rounds were played out');
   }else console.log(`(width ${width}: no portal field to pursue; portal checks skipped)`);
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Offseason decide browser test passed');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
