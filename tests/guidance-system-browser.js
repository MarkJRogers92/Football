const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');

async function startNewDynasty(page){
 await page.waitForSelector('#titleNew',{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
 await page.click('#titleNew');
 await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});
 await page.click('#titleStart');
 await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
}

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
 page.on('pageerror',error=>errors.push(String(error)));
 try{
  await page.goto('file://'+path.join(__dirname,'..','index.html'));
  await startNewDynasty(page);

  assert.match(await page.locator('#coachingAgenda').innerText(),/COACHING AGENDA/i);
  assert.match(await page.locator('#advanceForecast').innerText(),/Week 1 becomes available/i);
  assert.match(await page.locator('#advanceForecast').innerText(),/Ready to advance/i);
  assert.match(await page.locator('#currentPlan').innerText(),/Schemes|Team training/i);
  assert.equal(await page.locator('#weeklyHub').isVisible(),true,'the established briefing wire remains visible');

  await page.evaluate(()=>{window.__guidanceConfirmCount=0;window.confirm=()=>{window.__guidanceConfirmCount++;return true}});
  await page.evaluate(()=>{const t=window.__DL_TEST__.selected();for(const p of t.roster){p.health=70;p.wear=76;p.injuryWeeks=0;p.redshirtActive=false}});
  await page.click('#hubAdvance');
  await page.waitForFunction(()=>document.querySelector('#hubAdvance')?.dataset.openingPreseason==='false');
  assert.equal(await page.evaluate(()=>window.__guidanceConfirmCount),0,'Begin Season does not add a confirmation');

  await page.waitForFunction(()=>window.getDynastyGuidance?.().items.some(x=>x.meaning==='must_resolve'));
  assert.match(await page.locator('#coachingAgenda').innerText(),/Must resolve/i);
  assert.match(await page.locator('#advanceForecast').innerText(),/Decision required/i);
  assert.equal(await page.locator('#simWeek').isDisabled(),true,'the real blocker still disables ordinary advancement');
  const blockedWeek=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);
  const blockerId=await page.evaluate(()=>window.getDynastyGuidance().items.find(x=>x.meaning==='must_resolve').id);
  await page.evaluate(id=>window.openGuidanceItem(id),blockerId);
  await page.waitForSelector('.guidance-return-context');
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week),blockedWeek);
  await page.click('.guidance-return');
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week),blockedWeek);
  while(await page.evaluate(()=>window.getDynastyGuidance().items.some(x=>x.meaning==='must_resolve'))){
   const decisionId=await page.evaluate(()=>window.getDynastyGuidance().items.find(x=>x.meaning==='must_resolve').destination.decisionId);
   await page.locator(`[data-decision="${decisionId}"]`).first().click();
  }
  assert.match(await page.locator('#advanceForecast').innerText(),/Ready with cautions|Ready to advance/i);

  const weekBefore=await page.locator('#weekLine').innerText();
  const recruitingItem=await page.evaluate(()=>window.getDynastyGuidance().items.find(x=>x.category==='recruiting')?.id||null);
  assert.ok(recruitingItem,'an empty opening board should have a staff recommendation');

  await page.locator(`[data-guidance-defer="${recruitingItem}"]`).click();
  assert.equal(await page.evaluate(id=>window.getDynastyGuidance().items.some(x=>x.id===id),recruitingItem),false);
  assert.equal(await page.evaluate(id=>window.getDynastyGuidance().snoozed.some(x=>x.id===id),recruitingItem),true);
  assert.match(await page.locator('#coachingAgenda').innerText(),/Snoozed for now/i);
  assert.equal(await page.locator('#weekLine').innerText(),weekBefore,'snoozing does not advance time');
  await page.click('.guidance-snoozed > summary');
  await page.locator(`[data-guidance-restore="${recruitingItem}"]`).click();

  await page.evaluate(id=>window.openGuidanceItem(id),recruitingItem);
  await page.waitForSelector('#recruiting.active');
  await page.click('.guidance-return');
  await page.evaluate(id=>window.openGuidanceItem(id),recruitingItem);
  await page.waitForSelector('#recruiting.active');
  await page.click('.guidance-return');
  assert.equal(await page.locator(`[data-guidance-item="${recruitingItem}"]`).locator('xpath=ancestor::article').locator('.guidance-why').count(),1,
   'a familiar topic keeps its action visible and collapses repeated explanation');

  await page.evaluate(id=>window.openGuidanceItem(id),recruitingItem);
  await page.waitForSelector('#recruiting.active');
  assert.match(await page.locator('.guidance-return-context').innerText(),/From Coaching Agenda: Build a recruiting board/i);
  await page.click('#autoTarget');
  await page.click('.guidance-return');
  await page.waitForSelector('#dashboard.active');
  assert.doesNotMatch(await page.locator('#coachingAgenda').innerText(),/Build a recruiting board/i,'agenda recomputes after ordinary recruiting work');
  assert.equal(await page.locator('#weekLine').innerText(),weekBefore,'navigation and return do not advance time');

  const advanceText=await page.locator('#hubAdvance').innerText();
  assert.match(advanceText,/Next: Advance Week|Resolve required decision/i);
  if(/Resolve required decision/i.test(advanceText)){
   await page.locator('#weeklyDecisions .decision-option').first().click();
   await page.waitForFunction(()=>!/Resolve required decision/i.test(document.querySelector('#hubAdvance')?.textContent||''));
  }
  const numericWeek=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);
  await page.click('#hubAdvance');
  await page.waitForFunction(before=>window.__DL_TEST__.preseasonDebug().week===before+1,numericWeek);
  assert.equal(await page.evaluate(()=>window.__guidanceConfirmCount),0,'a routine valid week advances without a confirmation');

  const returnWeek=await page.locator('#weekLine').innerText();
  await page.evaluate(()=>window.__DL_TEST__.prepareGuidanceReturn(new Date(Date.now()-8*24*60*60*1000).toISOString()));
  assert.match(await page.locator('#guidanceReturnSummary').innerText(),/WELCOME BACK/i);
  assert.match(await page.locator('#guidanceReturnSummary').innerText(),/No simulation occurred while you were away/i);
  await page.click('[data-guidance-dismiss-return]');
  assert.equal(await page.locator('#guidanceReturnSummary').innerText(),'');
  assert.equal(await page.locator('#weekLine').innerText(),returnWeek,'welcome-back context and dismissal do not advance time');

  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(100);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=1,`narrow Command Center overflows by ${overflow}px`);
  assert.equal(await page.locator('#coachingAgenda').isVisible(),true);
  assert.equal(await page.locator('#advanceForecast').isVisible(),true);
  assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
  console.log('PASS guidance agenda, familiarity, snooze, welcome-back, navigation and narrow layout');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
