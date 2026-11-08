// Real Chromium, disposable profile, synthetic dynasty only.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
const {clickShellUtility}=require('./helpers/client-shell');
async function goTab(page,id,group){
 await page.locator(`#clientRail [data-client-tab="${id}"]`).click();
}
async function saveOrLoad(page,selector,pattern){
 await clickShellUtility(page,selector);
 await page.waitForFunction(src=>new RegExp(src).test(document.querySelector('#saveStatus')?.textContent||''),pattern,{timeout:30000});
}
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(testPageURL());await startNewDynasty(page);
  await goTab(page,'staff','program');
  assert.equal(await page.locator('[data-sa-medical]').inputValue(),'limited');
  await page.locator('[data-sa-medical]').selectOption('sit');
  await saveOrLoad(page,'#saveBrowser','^Saved');
  await page.locator('[data-sa-medical]').selectOption('limited');
  await saveOrLoad(page,'#loadBrowser','^Loaded');await goTab(page,'staff','program');
  assert.equal(await page.locator('[data-sa-medical]').inputValue(),'sit','the explicit browser save restores the medical instruction');
  const ready=await page.evaluate(()=>window.__DL_TEST__.v2PrepareDetailedGame());assert.equal(ready.ready,true);
  await goTab(page,'gamelab','season');await page.click('[data-v2-gameday-moments]');
  await page.waitForSelector('[data-v2-gameday-choice]',{timeout:10000});
  let saved=await page.evaluate(()=>window.__DL_TEST__.v2GameDaySaved());assert.equal(saved.mode,'moments');assert.deepEqual(saved.actions,['decision']);
  const choice=await page.locator('[data-v2-gameday-choice]').first().getAttribute('data-v2-gameday-choice');
  await page.locator('[data-v2-gameday-choice]').first().click();
  saved=await page.evaluate(()=>window.__DL_TEST__.v2GameDaySaved());assert.ok(saved,'the first choice pauses at another real decision');
  assert.deepEqual(saved.actions.slice(-2),[`choice:${choice}`,'decision']);assert.ok(await page.locator('[data-v2-gameday-choice]').count()>0);
  const before=await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewState());
  await saveOrLoad(page,'#saveBrowser','^Saved');
  await page.reload();await page.waitForSelector('#titleContinue');await page.click('#titleContinue');
  await page.waitForSelector('#app:not([hidden])',{timeout:30000});await goTab(page,'gamelab','season');
  await page.waitForSelector('[data-v2-gameday-choice]',{timeout:10000});
  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.v2GameDaySaved()),saved,'mode and explicit actions survive a real reload');
  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewState()),before,'the same game is reconstructed at the same decision');
  await page.click('[data-v2-gameday-delegate]');await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayLastArchiveDebug()?.gameDayVersion===2,{timeout:30000});
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.v2GameDaySaved()),null);assert.deepEqual(errors,[]);
  console.log('PASS engagement browser: medical instruction Save/Load; big-moments choice/automatic advance; exact paused-game reload; recorded final; no console/page errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
