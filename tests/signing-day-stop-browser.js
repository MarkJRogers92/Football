'use strict';

// v0.24: signing day's contested decisions that involve the coach are announced one at a time in the signing stop,
// his own first, before the class enrolls. Announcing changes nothing about who signs where.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:width<500?844:900}}),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));page.on('dialog',d=>d.accept());
   await page.goto(testPageURL());
   await startNewDynasty(page,{staffRecruiting:true});
   await page.evaluate(()=>document.querySelector('#simSeason').click());
   await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().phase!=='regular',null,{timeout:180000});
   for(let guard=0;guard<12&&!/Enroll Signing Class/.test(await page.locator('#hubAdvance').innerText());guard++){
    const label=await page.locator('#hubAdvance').innerText();await page.click('#hubAdvance');
    if(await page.locator('#offseasonStop [data-offseason-stop-go]').count()){await page.click('#offseasonStop [data-offseason-stop-go]')}
    await page.waitForFunction(old=>document.querySelector('#hubAdvance').textContent!==old,label,{timeout:60000});
   }
   assert.match(await page.locator('#hubAdvance').innerText(),/Enroll Signing Class/);
   const size=await page.evaluate(()=>window.__DL_TEST__.signingDayFixture(3));
   const before=await page.evaluate(()=>window.__DL_TEST__.selected().name);
   await page.click('#hubAdvance');
   const stop=page.locator('#offseasonStop');await stop.waitFor({state:'visible'});
   assert.match(await stop.innerText(),/SIGNING DAY/);
   assert.match(await stop.locator('h3').innerText(),/^4 of your recruits are still deciding$/);
   assert.match(await page.locator('#hubAdvance').innerText(),/Enroll Signing Class/,'the class does not enroll while names are pending');
   await page.click('[data-offseason-sign="next"]');
   assert.equal(await stop.locator('.offseason-signing li').count(),1,'one name at a time');
   assert.match(await stop.locator('.offseason-signing li').first().innerText(),new RegExp(`stays with ${before}`),'the coach\'s own commitments come first');
   assert.match(await stop.locator('h3').innerText(),/^3 of your recruits are still deciding$/);
   await page.click('[data-offseason-sign="all"]');
   assert.equal(await stop.locator('.offseason-signing li').count(),4,'only decisions involving the coach are listed');
   assert.match(await stop.locator('h3').innerText(),/^Signing day: you kept or won 3 of 4$/);
   assert.equal(await stop.locator('[data-offseason-sign]').count(),0,'nothing left to announce');
   const left=await page.evaluate(()=>{const s=window.__DL_TEST__.offseasonStops();return s});
   assert.equal(left.open,'signing','the stop stays up with the results');
   assert.ok(size>=7,'the fixture includes programs other than the coach\'s');
   await page.click('#offseasonStop [data-offseason-stop-go]');
   await page.waitForFunction(()=>/Resolve Transfer Portal/.test(document.querySelector('#hubAdvance').textContent),null,{timeout:60000});
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Signing day stop browser test passed');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
