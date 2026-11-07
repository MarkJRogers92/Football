'use strict';

// A real week, an optional recap, a management checkpoint, and a cold re-entry.
const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

async function saved(page){
 await page.waitForFunction(()=>window.DynastySessionStatus?.read().state==='saved',null,{timeout:60000});
 assert.equal(await page.locator('#dynastySessionSaveStatus').isVisible(),true,'actual persistence state is visible');
}
async function resolveChoices(page){
 for(let guard=0;guard<12;guard++){
  const choice=page.locator('#weeklyDecisions [data-decision][data-choice]').first();
  if(!await choice.count())return;
  await choice.click();
 }
 assert.equal(await page.locator('#weeklyDecisions [data-decision][data-choice]').count(),0,'real choices can be completed without a recap acknowledgement');
}

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'no-preference'}),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
   await page.goto('file://'+path.join(__dirname,'..','index.html'));
   await startNewDynasty(page,{beginSeason:false});await saved(page);
   assert.equal(await page.locator('#highlightsCard').count(),0,'no empty payoff panel before the first game');
   assert.equal(await page.locator('.tabs [data-tab="dashboard"]').innerText(),'This Week');
   assert.equal(await page.locator('.tabs [data-tab="gamelab"]').innerText(),'Game Day');
   const motion=await page.evaluate(()=>getComputedStyle(document.querySelector('.bi-chip.is-next')).animationName);
   assert.equal(motion,'none','next game remains clear without a recurring attention pulse');
   await page.click('#hubAdvance');await resolveChoices(page);
   await page.click('#hubAdvance');
   await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().week===1,null,{timeout:60000});
   await saved(page);await page.waitForSelector('#highlightsCard',{state:'visible'});
   // The recap paints on its existing 80ms queue after the persistence event.
   try{await page.waitForSelector('#highlightsCard [data-save-state="saved"]',{state:'visible'})}catch(error){
    console.error('Postgame save display',await page.evaluate(()=>({status:window.DynastySessionStatus?.read(),rhythm:window.DynastySeasonMoments?.weeklyRhythm(),display:document.querySelector('#highlightsCard .hl-save')?.outerHTML||null})));throw error;
   }
   assert.equal(await page.locator('.hud-splash').count(),0,'ordinary finals use the persistent recap rather than a full-screen interruption');
   const final=await page.evaluate(()=>window.DynastySeasonMoments.highlights());
   assert.ok(final?.gameId,'payoff comes from a recorded final');
   assert.ok((await page.locator('#highlightsCard').innerText()).includes(`${final.us}–${final.them}`));
   assert.equal(await page.locator('#highlightsCard').evaluate(node=>!!node.closest('#weeklyDeskDetails')),false,'recap is visible without opening the full briefing');
   assert.ok(await page.locator('#highlightsCard > .hl-payoff .hl-star').count()<=1,'one featured performer');
   if(await page.locator('#highlightsCard .hl-more').count())assert.equal(await page.locator('#highlightsCard .hl-more').evaluate(node=>node.open),false,'secondary highlights start collapsed');
   assert.match(await page.locator('#highlightsCard .hl-stop').innerText(),/Week complete|Game complete/);
   assert.equal(await page.locator('#highlightsCard [data-save-state="saved"]').count(),1,'stopping point uses the completed matching checkpoint');

   const unchanged=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
   await page.evaluate(()=>window.__DL_TEST__.prepareGuidanceReturn(new Date(Date.now()-20*60*1000).toISOString()));
   assert.match(await page.locator('#guidanceReturnSummary').innerText(),/Last result:|Current priority:/);
   assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),unchanged,'reading re-entry context never advances the world');

   // Changing screens starts at the screen header; a same-screen click preserves position.
   await page.evaluate(()=>window.scrollTo(0,500));
   const recruitNav=width>700?'#clientRail [data-client-tab="recruiting"]':'.client-mobile-nav [data-client-tab="recruiting"]';
   await page.click(recruitNav);
   await page.waitForFunction(()=>document.querySelector('#recruiting')?.classList.contains('active'));
   await page.waitForFunction(()=>window.scrollY<=1);
   await page.click('#autoTarget');await saved(page);
   const targets=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().targeted);assert.ok(targets>0,'management action updates the real board');
   const prospects=page.locator('#recruitWorkspace [data-rwid]');
   assert.ok(await prospects.count()>1,'the saved board has selectable prospects');
   await prospects.nth(1).click();
   const selection=await page.evaluate(()=>window.DynastyRecruitingWorkspaceView.read().selectedId);
   if(width<=700)await page.click('[data-rw-back]');
   await page.click('[data-rwm="table"]');
   await page.click('[data-recruit-class="rising"]');
   await page.reload();await page.waitForSelector('#titleContinue');await page.click('#titleContinue');
   await page.waitForFunction(()=>!document.querySelector('#app')?.hidden,null,{timeout:60000});
   assert.equal(await page.locator('#recruiting.active').count(),1,'safe workspace is restored on a cold return');
   assert.equal(await page.evaluate(()=>window.DynastyRecruitingClasses.current()),'rising','class view is retained');
   assert.deepEqual(await page.evaluate(()=>{const v=window.DynastyRecruitingWorkspaceView.read();return{mode:v.mode,selectedId:v.selectedId}}),{mode:'table',selectedId:selection},'mode and selected prospect survive a cold return');
   assert.equal(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().targeted),targets,'management checkpoint survives cold reload');
   await saved(page);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page-level horizontal overflow');
   assert.deepEqual(errors,[],'no console errors');
   await page.close();
  }
  console.log('PASS One More Saturday: real weekly payoff, quiet motion, actual management persistence, truthful saved state, safe re-entry, desktop and phone');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
