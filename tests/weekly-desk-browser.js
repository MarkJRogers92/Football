'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('file://'+path.join(__dirname,'..','index.html'));
  await startNewDynasty(page,{beginSeason:false});
  assert.equal(await page.locator('#weeklyDeskFocus').count(),1,'a compact next-action summary is present');
  assert.match(await page.locator('#weeklyDeskFocus').innerText(),/Week 1 becomes available/);
  assert.equal(await page.locator('#weeklyDeskDetails').getAttribute('open'),null,'supporting details start folded');
  await page.evaluate(()=>{const t=window.__DL_TEST__.selected();for(const p of t.roster){p.health=70;p.wear=76;p.injuryWeeks=0;p.redshirtActive=false}});
  await page.click('#hubAdvance');
  await page.waitForFunction(()=>window.getDynastyGuidance().forecast.status==='blocked');
  assert.equal(await page.locator('#optionalWeeklyDecisions .decision-card').count(),1,'optional game planning lives with supporting preparation');
  assert.match(await page.locator('#optionalWeeklyDecisions').textContent(),/OPTIONAL PREPARATION/);
  assert.equal(await page.locator('#optionalWeeklyDecisions').isVisible(),false);
  const title=await page.evaluate(()=>window.DynastyNextAction.blockingItems(window.getDynastyGuidance())[0].title);
  assert.ok((await page.locator('#weeklyDeskFocus').innerText()).includes(title),'the actual required decision is named');
  await page.evaluate(()=>window.scrollTo(0,0));
  for(const selector of ['#weeklyDeskFocus','#hubAdvance']){
   const b=await page.locator(selector).boundingBox();
   assert.ok(b&&b.y>=0&&b.y+b.height<=844,`${selector} must fit in the first phone viewport: ${JSON.stringify(b)}`);
  }
  const before=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
  await page.click('#hubAdvance');
  await page.waitForSelector('.guidance-return-context');
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week),before.week,'reviewing a blocker never advances');
  assert.equal(await page.locator('.decision-card.guidance-focus-target').isVisible(),true,'the primary action opens the actual choice');
  await page.click('.guidance-return');
  await page.waitForFunction(()=>document.querySelector('#weeklyDeskDetails').open);
  assert.equal(await page.locator('#weeklyDeskDetails').getAttribute('open'),'','return opens the agenda disclosure');
  while(await page.evaluate(()=>window.DynastyNextAction.blockingItems(window.getDynastyGuidance()).length)){
   const id=await page.evaluate(()=>window.DynastyNextAction.blockingItems(window.getDynastyGuidance())[0].destination.decisionId);
   assert.ok(id,'this fixture only has weekly blockers');
   await page.locator(`[data-decision="${id}"]`).first().click();
  }
  assert.doesNotMatch(await page.locator('#weeklyDeskFocus').innerText(),/Decision required/);
  assert.equal(await page.locator('#hubAdvance').isDisabled(),false,'optional preparation does not block advancement');
  const optionalWeek=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);
  await page.locator('#optionalWeeklyDecisions .decision-option').first().click();
  await page.waitForFunction(()=>!document.querySelector('#optionalWeeklyDecisions .decision-card'));
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week),optionalWeek,'choosing optional preparation does not advance the week');
  const week=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);
  await page.click('#hubAdvance');
  await page.waitForFunction(w=>window.__DL_TEST__.preseasonDebug().week===w+1,week);
  const beforeViews=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
  await page.locator('#programDetails > summary').click();
  assert.equal(await page.locator('#teamMetrics').isVisible(),true);
  await page.locator('#programDetails > summary').click();
  await page.locator('#weeklyDeskDetails > summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#weeklyDeskDetails').getAttribute('open'),null,'disclosure supports keyboard toggling');
  await page.locator('[data-dash-view="stories"]').click();
  assert.equal(await page.locator('.command-center').isVisible(),false);
  await page.locator('[data-dash-view="week"]').click();
  assert.equal(await page.locator('#weeklyDeskFocus').isVisible(),true);
  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),beforeViews,'disclosures and dashboard views do not advance time or consume randomness');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal phone overflow');
  await page.evaluate(()=>window.scrollTo(0,0));
  const screenshotDir=process.env.DYNASTY_DESK_SCREENSHOT_DIR;
  if(screenshotDir){
   require('node:fs').mkdirSync(screenshotDir,{recursive:true});
   await page.waitForFunction(()=>!document.querySelector('.hud-splash')&&!document.querySelector('.hud-toast'),null,{timeout:10000});
   await page.screenshot({path:path.join(screenshotDir,'weekly-desk-phone.png'),fullPage:true});
  }
  await page.setViewportSize({width:1440,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal desktop overflow');
  for(const selector of ['#weeklyDeskFocus','#hubAdvance']){
   const b=await page.locator(selector).boundingBox();
   assert.ok(b&&b.y>=0&&b.y+b.height<=1000,`${selector} fits the first desktop viewport`);
  }
  if(screenshotDir)await page.screenshot({path:path.join(screenshotDir,'weekly-desk-desktop.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS weekly desk: truthful blocked/ready actions, phone first viewport, disclosures, navigation and real advancement');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
