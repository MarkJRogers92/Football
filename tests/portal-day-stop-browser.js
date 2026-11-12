'use strict';

// v0.26: the portal outcomes that touch the coach's program are kept when the portal is resolved and announced one at
// a time in a stop before spring practice, players leaving first and arrivals last. Announcing changes nothing.
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
   // Press Next through the offseason until the portal is resolved, passing each stop the way a player would.
   for(let guard=0;guard<16&&!(await page.evaluate(()=>window.__DL_TEST__.portalDay()?.year!=null&&!window.__DL_TEST__.portalDay().collecting));guard++){
    if(await page.locator('#offseasonStop [data-offseason-sign="all"]').count())await page.click('#offseasonStop [data-offseason-sign="all"]');
    if(await page.locator('#offseasonStop [data-offseason-stop-go]').count()){await page.click('#offseasonStop [data-offseason-stop-go]');await page.waitForTimeout(300);continue}
    await page.click('#hubAdvance');await page.waitForTimeout(300);
   }
   const day=await page.evaluate(()=>({day:window.__DL_TEST__.portalDay(),me:window.__DL_TEST__.selected().name,stops:window.__DL_TEST__.offseasonStops()}));
   assert.ok(day.day,'resolving the portal keeps a portal day');
   const order={out:0,returned:1,left:2,in:3};
   for(const [i,x] of day.day.board.entries()){
    assert.ok(order[x.kind]!=null,`known kind ${x.kind}`);
    assert.ok(x.kind==='in'?x.to===day.me:x.from===day.me,'every entry involves the coach\'s program');
    if(i)assert.ok(order[day.day.board[i-1].kind]<=order[x.kind],'players leaving first, arrivals last');
   }
   if(day.day.board.length)assert.equal(day.stops.open,'spring','the portal day opens straight after the portal is resolved');
   console.log(`  ${width}px: ${day.day.board.length} real portal decision(s) for the coach`);
   // A fixed board to check the announcing itself.
   await page.evaluate(()=>window.__DL_TEST__.portalDayFixture());
   await page.click('#hubAdvance');
   const stop=page.locator('#offseasonStop');await stop.waitFor({state:'visible'});
   assert.match(await stop.innerText(),/PORTAL DAY/);
   assert.match(await stop.locator('h3').innerText(),/^3 portal decisions involve your program$/);
   await page.click('[data-offseason-portal="next"]');
   assert.equal(await stop.locator('.offseason-signing li').count(),1,'one move at a time');
   assert.match(await stop.locator('.offseason-signing li').first().innerText(),/leaves for/);
   await page.click('[data-offseason-portal="all"]');
   assert.equal(await stop.locator('.offseason-signing li').count(),3);
   assert.match(await stop.locator('.offseason-signing li').last().innerText(),/joins from/);
   assert.match(await stop.locator('h3').innerText(),/^Portal day: 1 joined, 1 left$/);
   assert.equal(await stop.locator('[data-offseason-portal]').count(),0,'nothing left to announce');
   assert.equal(await stop.locator('img.dl-art-stop').count(),1,'the stop has its art');
   await page.click('#offseasonStop [data-offseason-stop-go]');
   await page.waitForFunction(()=>!document.querySelector('#offseasonStop'),null,{timeout:60000});
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Portal day stop browser test passed');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
