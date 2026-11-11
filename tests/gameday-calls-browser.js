'use strict';

// v0.19: a coached game is a call for every drive and the big defensive downs, on a screen that is only the game.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
const {startLiveGame}=require('./helpers/start-live-game');

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const [width,height] of [[1280,800],[390,844]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(testPageURL());
   await startNewDynasty(page);
   await page.evaluate(()=>window.__DL_TEST__.goToTab('gamelab'));
   // The way in sits directly under the matchup.
   const order=await page.evaluate(()=>{const hero=document.querySelector('#gamedayEventHero'),live=document.querySelector('#v2InteractiveGameDay'),prep=document.querySelector('#v2MatchupIntelligence');return{afterHero:hero.nextElementSibling===live,beforePrep:!!(live.compareDocumentPosition(prep)&Node.DOCUMENT_POSITION_FOLLOWING)}});
   assert.deepEqual(order,{afterHero:true,beforePrep:true},'Coach It Live comes before the page of preparation');
   await startLiveGame(page);
   await page.locator('#v2InteractiveGameDay .v2-live-field').waitFor({state:'visible'});
   // The game takes the screen.
   assert.equal(await page.evaluate(()=>[...document.querySelector('#gamelab').children].filter(el=>el.id!=='v2InteractiveGameDay'&&el.offsetParent).length),0,'only the live game is on screen');
   assert.match(await page.locator('.v2-live-field').getAttribute('aria-label'),/ball, .*yards from the end zone/);

   const types={},nav=await page.locator('.client-mobile-nav').isVisible().catch(()=>false),limit=height-(nav?72:0);
   let decisions=0,sawConsequence=false,checkedPrep=false;
   for(let guard=0;guard<600;guard++){
    if(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().played)>0)break;
    const card=page.locator('.v2-gameday-decision');
    if(await card.count()){
     const type=await card.getAttribute('data-decision-type');types[type]=(types[type]||0)+1;
     if(type==='drive_call'&&types[type]===2){
      assert.deepEqual(await card.locator('[data-v2-gameday-choice]').evaluateAll(nodes=>nodes.map(n=>n.dataset.v2GamedayChoice)),['balanced','ground','quick','shots','delegate']);
      assert.equal(await card.locator('.v2-gameday-call small').count(),4,'each call says what it trades');
      await card.scrollIntoViewIfNeeded();
      const box=await card.boundingBox(),score=await page.locator('.v2-gameday-scoreboard').boundingBox();
      assert.ok(box.y+box.height<=limit+1,`the whole decision is on screen at ${width}px (bottom ${Math.round(box.y+box.height)} of ${limit})`);
      assert.ok(score.y>=0||width<500,'the scoreboard stays on screen with the decision on desktop');
      for(const b of await card.locator('[data-v2-gameday-choice]').all())assert.ok((await b.boundingBox()).height>=44,'calls are full-size touch targets');
      if(!checkedPrep){checkedPrep=true;
       await page.click('[data-v2-gameday-prep]');assert.ok(await page.locator('#v2MatchupIntelligence').isVisible(),'scouting and prep come back on request');
       await page.click('[data-v2-gameday-prep]');assert.equal(await page.locator('#v2MatchupIntelligence').isVisible(),false)}
     }
     const pick=type==='drive_call'?['ground','shots','quick','balanced'][decisions%4]:type==='defense_call'?['pressure','coverage','run_stop','base'][decisions%4]:'delegate';
     await card.locator(`[data-v2-gameday-choice="${pick}"]`).click();decisions++;
     if(!sawConsequence&&await page.locator('.v2-gameday-consequence').count()){sawConsequence=true;assert.match(await page.locator('.v2-gameday-consequence').innerText(),/Your call: .+Next play: /s)}
     continue;
    }
    const advance=page.locator('[data-v2-gameday-decision]:visible');
    if(await advance.count())await advance.click();else await page.waitForTimeout(100);
   }
   assert.ok(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().played)>0,'the coached game finished and was recorded');
   assert.ok(types.drive_call>=6,`several drives were called: ${JSON.stringify(types)}`);
   assert.ok(decisions>=10&&decisions<=30,`a coached game is 10 to 30 decisions, saw ${decisions}`);
   assert.ok(sawConsequence,'a call is followed by what it led to');
   assert.equal(await page.locator('#gamelab').evaluate(node=>node.classList.contains('v2-live')),false,'the rest of Game Day returns at the final');
   assert.ok(await page.locator('#v2GameDayRecap .v2-release-score').isVisible(),'the recap follows the final');
   assert.match(await page.locator('#detailedLog').innerText(),/coach (chooses|delegates)/,'the calls are in the archived play-by-play');
   assert.deepEqual(errors,[]);
   console.log(`${width}px: ${decisions} decisions ${JSON.stringify(types)}`);
   await page.close();
  }
  console.log('Game Day calls browser test passed');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
