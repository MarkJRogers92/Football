'use strict';
// A live game that cannot be recorded must never be started: with a Coach's Desk decision pending, both live-start
// buttons are disabled and refuse to open a session; resolving the decision lets the same game be played and recorded.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/Resolve the Coach/.test(m.text()))errors.push(m.text())});
 try{
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  const fx=await page.evaluate(()=>{window.__DL_TEST__.selected();return window.__DL_TEST__.weeklyPersonnelForceFixture()});assert.ok(fx,'a pending starter-pressure decision exists');
  await page.evaluate(()=>window.__DL_TEST__.goToTab('gamelab'));
  await page.waitForSelector('[data-v2-gameday-start]');
  assert.equal(await page.locator('[data-v2-gameday-start]').isDisabled(),true,'Coach It Live is disabled while a decision is pending');
  assert.equal(await page.locator('[data-v2-gameday-moments]').isDisabled(),true,'Coach big moments is disabled too');
  await page.evaluate(()=>document.querySelector('[data-v2-gameday-start]').onclick());
  await page.evaluate(()=>document.querySelector('[data-v2-gameday-moments]').onclick());
  assert.equal(await page.evaluate(()=>!!window.DynastyGameEngineV2LabBridge.interactive.getSession()),false,'forced clicks still open no session');
  await page.evaluate(()=>window.__DL_TEST__.goToTab('dashboard'));
  for(let i=0;i<10;i++){const c=page.locator('#weeklyDecisions [data-decision][data-choice]:visible').first();if(!await c.count())break;await c.click();await page.waitForTimeout(150)}
  await page.evaluate(()=>window.__DL_TEST__.goToTab('gamelab'));
  await page.waitForFunction(()=>!document.querySelector('[data-v2-gameday-start]')?.disabled,null,{timeout:10000});
  await page.click('[data-v2-gameday-start]');await page.waitForSelector('[data-v2-gameday-delegate]');
  await page.click('[data-v2-gameday-delegate]');
  await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayCommitDebug().last?.engine==='v2'||document.querySelector('[data-v2-gameday-record]'),null,{timeout:30000});
  if(await page.locator('[data-v2-gameday-record]:visible').count())await page.click('[data-v2-gameday-record]');
  await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayCommitDebug().last?.engine==='v2',null,{timeout:30000});
  assert.deepEqual(errors,[],`unexpected errors: ${errors.join('\n')}`);
  console.log('PASS live start guard: pending decision blocks the game, resolving it lets the game record');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
