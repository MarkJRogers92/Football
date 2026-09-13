'use strict';

const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

const TAB_GROUP={dashboard:'program',gamelab:'games'};
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

    const defer=page.locator('#coachingAgenda [data-guidance-defer]').first();
    assert.ok(await defer.count(),'opening agenda should include at least one deferable recommendation');
    await defer.click();
    await page.waitForFunction(()=>document.querySelectorAll('#coachingAgenda [data-guidance-group]').length===3,{timeout:5000});
    assert.equal(await page.locator('#coachingAgenda .guidance-snoozed').count(),1,'snoozing still uses the existing Guidance state');
    await page.locator('#coachingAgenda .guidance-snoozed > summary').click();
    const restore=page.locator('#coachingAgenda [data-guidance-restore]').first();
    assert.ok(await restore.count(),'snoozed recommendation remains restorable');
    await restore.click();
    await page.waitForFunction(()=>document.querySelectorAll('#coachingAgenda [data-guidance-group]').length===3,{timeout:5000});

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

    await page.setViewportSize({width:1280,height:900});
    const prepForGame=await page.evaluate(()=>window.__DL_TEST__.v2PrepareDetailedGame());
    assert.equal(prepForGame.career,false,'fresh dynasty should not have a career choice blocking the first Detailed Game');
    assert.equal(prepForGame.ready,true,'test helper should clear real weekly blockers before testing optional prep');
    await page.evaluate(()=>{
      const selector=document.querySelector('#userTeam');
      if(!selector)throw new Error('Program selector unavailable for first-season flow refresh.');
      selector.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await goTab(page,'gamelab');
    let readyFlow=await page.evaluate(()=>window.getFirstSeasonFlow());
    let statuses=Object.fromEntries(readyFlow.prepPath.stages.map(stage=>[stage.key,stage.status]));
    assert.equal(statuses.gameday,'current','Game Day mirrors authoritative eligibility when required decisions are clear');
    assert.equal(statuses.prep,'optional','weekly preparation is recommended rather than a fake gate');

    await page.evaluate(()=>window.__DL_TEST__.weeklyCoachingSet(['pass_protection']));
    await goTab(page,'gamelab');
    readyFlow=await page.evaluate(()=>window.getFirstSeasonFlow());
    statuses=Object.fromEntries(readyFlow.prepPath.stages.map(stage=>[stage.key,stage.status]));
    assert.equal(statuses.opponent,'done','choosing a real prep plan marks opponent review complete');
    assert.equal(statuses.prep,'done','the preparation path updates after using the real weekly coaching system');
    assert.equal(statuses.gameday,'current','using prep must not replace the real Game Day gate');

    const beforeGame=await page.evaluate(()=>{
      const debug=window.DynastyGameEngineV2LabBridge.debug();
      return{team:debug.team,game:debug.game,week:window.__DL_TEST__.preseasonDebug().week};
    });
    assert.ok(beforeGame.game,'opening week should have a scheduled user game');
    assert.equal(await page.locator('#simDetailedGame').isEnabled(),true,'real Detailed Game control should be enabled');
    await page.click('#simDetailedGame');
    await page.waitForFunction(()=>window.DynastyGameEngineV2LabBridge.debug().lastArchive?.engine==='v2',{timeout:30000});
    const afterGame=await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.debug());
    const userSide=beforeGame.game.home===beforeGame.team.name?'home':'away',otherSide=userSide==='home'?'away':'home';
    const mine=afterGame.lastArchive.score[userSide],theirs=afterGame.lastArchive.score[otherSide];
    const verb=mine>theirs?'Won':mine<theirs?'Lost':'Tied';
    const opponent=beforeGame.game[userSide==='home'?'away':'home'];
    const expectedResult=`${verb} ${mine}–${theirs} vs ${opponent}`;

    await goTab(page,'dashboard');
    const weekBeforeAdvance=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);
    await page.click('#hubAdvance');
    await page.waitForFunction(before=>window.__DL_TEST__.preseasonDebug().week===before+1,weekBeforeAdvance,{timeout:15000});
    await page.waitForSelector('#firstSeasonBriefing',{state:'visible',timeout:10000});
    const nextFlow=await page.evaluate(()=>window.getFirstSeasonFlow());
    assert.equal(nextFlow.mode,'explicit','Week 2 should still use explicit first-season guidance');
    assert.ok(nextFlow.carryForward,'next week should expose the prior recorded game as carry-forward context');
    assert.equal(nextFlow.carryForward.result,expectedResult,'carry-forward score should come from the permanent game archive');
    assert.ok(nextFlow.carryForward.headline,'recorded Game Engine v2 feedback should produce a factual postgame headline');
    const briefingText=await page.locator('#firstSeasonBriefing').innerText();
    assert.ok(briefingText.includes(expectedResult),'next-week briefing should show the actual prior result');
    assert.ok(briefingText.includes(nextFlow.carryForward.headline),'next-week briefing should show existing game-plan feedback evidence');

    const soak=await page.evaluate(()=>window.__DL_TEST__.v2RecordedSoakProbe(1));
    assert.equal(soak.ok,true,'existing v2 soak helper should carry the dynasty into Week 3');
    await goTab(page,'dashboard');
    await page.waitForFunction(()=>window.getFirstSeasonFlow?.().mode==='concise',{timeout:10000});
    const conciseFlow=await page.evaluate(()=>window.getFirstSeasonFlow());
    assert.equal(conciseFlow.mode,'concise','Week 3 should switch to concise first-season guidance');
    assert.equal(await page.locator('#coachingAgenda').getAttribute('data-first-season-mode'),'concise');
    assert.match(await page.locator('#firstSeasonBriefing').innerText(),/Condensed/i);
    const nonRequired=page.locator('#coachingAgenda .guidance-flow-recommended article.guidance-item, #coachingAgenda .guidance-flow-optional article.guidance-item').first();
    assert.ok(await nonRequired.count(),'Week 3 should retain at least one non-required guidance item for fade verification');
    const explanation=nonRequired.locator(':scope > p, :scope > .guidance-why').first();
    assert.ok(await explanation.count(),'non-required guidance item should retain explanatory markup for accessibility/state continuity');
    assert.equal(await explanation.evaluate(el=>getComputedStyle(el).display),'none','concise mode should visually collapse familiar non-required explanation copy');

    assert.deepEqual(errors,[],`first-season flow emitted browser errors: ${errors.join('\n')}`);
    console.log('PASS first-season briefing, grouping repair, optional prep path, carry-forward, concise fade and narrow layout');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
