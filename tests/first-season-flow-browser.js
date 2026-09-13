'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

const TAB_GROUP={gamelab:'games'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{
  const groupButton=document.querySelector(`.tab-groups button[data-group="${group}"]`);
  if(groupButton&&!groupButton.classList.contains('active'))groupButton.click();
  document.querySelector(`.tabs button[data-tab="${id}"]`)?.click();
},{id,group:TAB_GROUP[id]});

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(String(error)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));
    await startNewDynasty(page);

    await page.waitForSelector('#firstSeasonBriefing',{state:'visible',timeout:15000});
    const flow=await page.evaluate(()=>window.getFirstSeasonFlow?.());
    assert.ok(flow,'first-season flow should expose a read-only browser debug model');
    assert.equal(flow.mode,'explicit','opening regular-season week should use explicit guidance');
    assert.match(await page.locator('#firstSeasonBriefing').innerText(),/WEEK 1 BRIEFING/i);
    assert.equal(await page.locator('#coachingAgenda [data-guidance-group="required"]').count(),1);
    assert.equal(await page.locator('#coachingAgenda [data-guidance-group="recommended"]').count(),1);
    assert.equal(await page.locator('#coachingAgenda [data-guidance-group="optional"]').count(),1);
    assert.match(await page.locator('#coachingAgenda').innerText(),/Required/i);
    assert.match(await page.locator('#coachingAgenda').innerText(),/Recommended/i);
    assert.match(await page.locator('#coachingAgenda').innerText(),/Optional/i);

    await goTab(page,'gamelab');
    await page.waitForSelector('#firstSeasonPrepPath',{state:'visible',timeout:15000});
    const prepText=await page.locator('#firstSeasonPrepPath').innerText();
    for(const phrase of ['Review opponent','Resolve decisions','Set weekly prep','Review personnel','Game Day'])assert.match(prepText,new RegExp(phrase,'i'));
    assert.equal(await page.locator('#v0102WeeklyCoaching').count(),1,'existing weekly coaching UI remains authoritative');

    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(100);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(overflow<=1,`first-season flow overflows narrow layout by ${overflow}px`);
    assert.equal(await page.locator('#firstSeasonBriefing').count(),1);
    assert.equal(await page.locator('#firstSeasonPrepPath').isVisible(),true);
    assert.deepEqual(errors,[],`first-season flow emitted browser errors: ${errors.join('\n')}`);
    console.log('PASS first-season Week 1 briefing, grouped agenda, prep path and narrow layout');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
