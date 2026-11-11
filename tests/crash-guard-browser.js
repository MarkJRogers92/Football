'use strict';

// v0.18: a broken render used to leave a frozen screen and nothing else. The crash screen must appear for a real
// error, stay quiet for noise, record the problem on the device, and leave the dynasty exactly as it was.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const context=await browser.newContext({viewport:{width,height:width<500?844:900}});
   await context.grantPermissions(['clipboard-read','clipboard-write']).catch(()=>{});
   const page=await context.newPage();
   await page.goto(testPageURL());
   await startNewDynasty(page,{beginSeason:false});
   assert.equal(await page.locator('#crashGuard').count(),0,'a healthy start shows no crash screen');
   assert.deepEqual(await page.evaluate(()=>window.DynastyCrashGuard.log()),[],'a healthy start records nothing');
   const before=await page.evaluate(()=>JSON.stringify(window.__DL_TEST__.preseasonDebug()));

   // Noise is ignored.
   await page.evaluate(()=>{window.dispatchEvent(new ErrorEvent('error',{message:'ResizeObserver loop completed with undelivered notifications.'}));window.dispatchEvent(new ErrorEvent('error',{message:'Script error.'}))});
   assert.equal(await page.locator('#crashGuard').count(),0,'layout chatter and cross-origin noise do not raise the crash screen');

   // A real error raises it once.
   await page.evaluate(()=>setTimeout(()=>{throw new Error('crash guard test failure')},0));
   await page.locator('#crashGuard').waitFor({state:'visible'});
   await page.evaluate(()=>{setTimeout(()=>Promise.reject(new Error('second failure')),0)});await page.waitForTimeout(250);
   assert.equal(await page.locator('#crashGuard').count(),1,'one crash screen, however many errors follow');
   assert.match(await page.locator('#crashGuardText').innerText(),/last saved checkpoint is not affected/);
   const box=await page.locator('#crashGuard').boundingBox();
   assert.ok(box.x>=0&&box.x+box.width<=width,'the crash screen fits the window');
   for(const b of await page.locator('#crashGuard button').all())assert.ok((await b.boundingBox()).height>=44,'crash screen buttons are full-size touch targets');
   const log=await page.evaluate(()=>window.DynastyCrashGuard.log());
   assert.equal(log.length,2);assert.equal(log[0].message,'crash guard test failure');assert.match(log[0].version,/^v\d+\.\d+\.\d+$/);
   assert.equal(await page.evaluate(()=>JSON.stringify(window.__DL_TEST__.preseasonDebug())),before,'recording an error never changes the dynasty');

   await page.getByRole('button',{name:'Copy details'}).click();
   await page.waitForFunction(()=>/copied|Select and copy/.test(document.querySelector('#crashGuard [role=status]').textContent));
   const report=await page.evaluate(()=>window.DynastyCrashGuard.report());
   assert.match(report,/Dynasty Lab problem report/);assert.match(report,/crash guard test failure/);assert.match(report,/Version: v\d/);

   await page.getByRole('button',{name:'Keep playing'}).click();
   assert.equal(await page.locator('#crashGuard').count(),0,'the player can dismiss it and carry on');
   await context.close();
  }
  console.log('Crash guard browser test passed');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
