'use strict';

// v0.20: programs have nicknames, a new coach starts with the staff recruiting and the administration behind him,
// and the offseason stops once before each stage that holds a decision.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));page.on('dialog',d=>d.accept());
  await page.goto(testPageURL());
  await startNewDynasty(page,{beginSeason:false,staffRecruiting:true});

  // Identity.
  const team=await page.evaluate(()=>({id:window.__DL_TEST__.selected().id,name:window.__DL_TEST__.selected().name,nick:window.DynastyMascots.nickname(window.__DL_TEST__.selected())}));
  assert.ok(team.nick,'the program has a nickname');
  assert.equal(await page.locator('#dashboard .program-masthead .eyebrow').first().innerText(),`THE ${team.nick.toUpperCase()}`);
  assert.equal(await page.locator('#teamName').innerText(),team.name,'the program name itself is unchanged');

  // A new coach is backed, and the staff recruit until he takes over.
  assert.ok(await page.evaluate(()=>window.__DL_TEST__.selected().adminConfidence)>=60,'the administration backs the coach it just hired');
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().targeted),0,'nothing is done before the season is opened');
  await page.click('#hubAdvance');await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().phase==='regular');
  assert.ok(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().targeted)>=8,'the staff build a board when the season opens');
  await page.evaluate(()=>window.__DL_TEST__.goToTab('gamelab'));
  assert.ok((await page.locator('#gamedayEventHero .event-team-nick').allInnerTexts()).some(text=>text.toUpperCase()===team.nick.toUpperCase()),'Game Day shows the nickname');
  await page.evaluate(()=>window.__DL_TEST__.goToTab('dashboard'));

  // The offseason.
  await page.evaluate(()=>document.querySelector('#simSeason').click());
  await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().phase!=='regular',null,{timeout:180000});
  const stops=[];let pressed=0;
  for(let guard=0;guard<40;guard++){
   const label=await page.locator('#hubAdvance').innerText();
   if(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().phase)==='regular')break;
   const stage=(label.match(/Departures|Signing|Portal/)||[])[0];
   const expected=stage?await page.evaluate(p=>!!window.__DL_TEST__.offseasonStopFacts(p).facts,{Departures:'departures',Signing:'signing',Portal:'portal'}[stage]):false;
   await page.click('#hubAdvance');pressed++;
   if(expected){
    await page.locator('#offseasonStop').waitFor({state:'visible'});
    assert.equal(await page.locator('#hubAdvance').innerText(),label,'the stage is not processed while the stop is showing');
    const text=await page.locator('#offseasonStop').innerText();stops.push(stage);
    assert.match(text,/BEFORE YOU MOVE ON/);assert.equal(await page.locator('#offseasonStop button').count(),2,'one way to act and one way to move on');
    if(stage==='Portal'){
     await page.locator('#offseasonStop [data-offseason-stop-act]').click();
     assert.ok(await page.locator('#offseason').evaluate(node=>node.classList.contains('active')),'"Work the portal" opens the Offseason screen');
     await page.evaluate(()=>window.__DL_TEST__.goToTab('dashboard'));
     assert.ok(await page.locator('#offseasonStop').isVisible(),'the stop is still there on return');
    }
    await page.locator('#offseasonStop [data-offseason-stop-go]').click();
    await page.waitForFunction(old=>document.querySelector('#hubAdvance').textContent!==old,label,{timeout:60000});
    // v0.26: resolving the portal opens portal day when moves touch the coach's program. It is a different card,
    // announced and passed here; the portal stop itself is still shown only once.
    if(stage==='Portal'&&await page.locator('#offseasonStop').count()){
     assert.match(await page.locator('#offseasonStop').innerText(),/PORTAL DAY/,'only portal day may follow the portal stop');stops.push('Portal day');
     if(await page.locator('[data-offseason-portal="all"]').count())await page.click('[data-offseason-portal="all"]');
     const day=await page.locator('#hubAdvance').innerText();
     await page.locator('#offseasonStop [data-offseason-stop-go]').click();
     await page.waitForFunction(old=>document.querySelector('#hubAdvance').textContent!==old||window.__DL_TEST__.preseasonDebug().phase==='regular',day,{timeout:60000});
    }
    assert.equal(await page.locator('#offseasonStop').count(),0,'a stop is shown once');
   }else await page.waitForFunction(old=>document.querySelector('#hubAdvance').textContent!==old||window.__DL_TEST__.preseasonDebug().phase==='regular',label,{timeout:60000});
  }
  assert.ok(stops.includes('Portal'),`the portal stage stopped (saw ${stops.join(', ')||'none'})`);
  assert.ok(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().phase)==='regular'||/Week 1|Begin|Advance/.test(await page.locator('#hubAdvance').innerText()),'the offseason completes');
  assert.deepEqual(errors,[]);
  console.log(`World identity browser test passed (${team.name} ${team.nick}; stops: ${stops.join(', ')}; ${pressed} presses)`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
