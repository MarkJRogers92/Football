'use strict';
// Cohesion and fun pass: one navigation map, face chips, in-place number keys, Rival Watch, live Game Day
// win chance and ceremonies for real milestones. None of it may advance time or touch gameplay randomness.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const label=width>700?'desktop':'phone';
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);

   // One map: the page-tab groups are the sidebar sections, in the same order.
   const rail=await page.$$eval('.client-rail .client-nav-group',gs=>gs.map(g=>[...g.querySelectorAll('[data-client-tab]')].map(b=>b.dataset.clientTab)));
   for(const tabs of rail){
    await page.evaluate(t=>document.querySelector(`.tabs button[data-tab="${t}"]`).click(),tabs[0]);
    const visible=await page.$$eval('.tabs button',els=>els.filter(e=>!e.hidden).map(e=>e.dataset.tab));
    assert.deepEqual(visible,tabs,`[${label}] page tabs match the sidebar section ${tabs.join(',')}`);
   }
   await page.evaluate(()=>document.querySelector('.tabs button[data-tab="dashboard"]').click());
   assert.equal(await page.locator('.tabs').getAttribute('data-section'),'Home',`[${label}] tab strip names its section`);

   // Faces on decisions; one news channel; number keys in place.
   if(await page.locator('#weeklyDecisions .decision-card').count())assert.ok(await page.locator('#weeklyDecisions .face-chip canvas[data-portrait-painted="1"]').count()>0,`[${label}] decision cards show the players involved`);
   assert.equal(await page.locator('#saveStatus').isVisible(),false,`[${label}] status line is not a second news channel`);
   for(const tab of ['roster','recruiting','program']){
    await page.evaluate(t=>document.querySelector(`.tabs button[data-tab="${t}"]`).click(),tab);
    const legend=page.locator(`#${tab} > .section-head .bi-legend`);
    assert.equal(await legend.count(),1,`[${label}] ${tab} has one in-place key`);
    await legend.locator('summary').click();assert.ok((await legend.locator('dt').count())>=3,`[${label}] ${tab} key explains its numbers`);
   }

   // Rival Watch reflects the real rival and its head coach.
   await page.evaluate(()=>document.querySelector('.tabs button[data-tab="dashboard"]').click());
   const rival=await page.evaluate(()=>window.DynastyRivalSnapshot.read()?.rival);
   if(rival){
    await page.waitForSelector('#rivalWatch');
    const text=await page.locator('#rivalWatch').innerText();
    assert.ok(text.includes(rival.coach.name)&&text.includes(rival.team.name),`[${label}] Rival Watch names the real rival coach and school`);
    const arch=await page.evaluate(c=>window.DynastyRivalWatch.archetype(c).name,rival.coach);
    assert.ok(text.includes(arch),`[${label}] archetype comes from the coach's strongest rating`);
   }

   // Coach It Live: win chance renders and the dynasty does not change until the result is official.
   while(await page.locator('#weeklyDecisions [data-decision]').count())await page.locator('#weeklyDecisions [data-decision]').first().click();
   const before=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
   await page.locator('#broadcastFeature [data-coach-live]').click();
   await page.waitForSelector('#v2InteractiveGameDay .gm-panel .gm-graph',{timeout:20000});
   await page.click('[data-v2-gameday-decision]');
   await page.waitForSelector('#v2InteractiveGameDay .gm-panel');
   const pct=await page.locator('.gm-head strong').innerText();assert.match(pct,/^\d{1,2}%$|^100%$/,`[${label}] win chance shows a percentage`);
   if(await page.locator('.v2-gameday-decision').count())assert.match(await page.locator('.v2-gameday-decision').innerText(),/Win chance now \d+%/,`[${label}] decisions show the current win chance`);
   assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),before,`[${label}] live coaching changes nothing until made official`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`[${label}] no horizontal overflow`);
   assert.deepEqual(errors,[],`[${label}] no console errors`);
   await page.close();
  }

  // Ceremonies fire for exactly the real milestones that happen while playing, and never on load.
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  await page.evaluate(()=>{window.DynastyCeremonies.autoplay=true;window.__shown=[];new MutationObserver(()=>{const c=document.querySelector('.ceremony:not(.is-leaving)');if(c&&!c.dataset.seen){c.dataset.seen='1';window.__shown.push(c.dataset.ceremony);setTimeout(()=>c.querySelector('[data-ceremony-close]').click(),50)}}).observe(document.body,{childList:true})});
  await page.click('#programDetails > summary');await page.click('#simSeason');
  await page.waitForFunction(()=>!document.querySelector('#simConf').disabled,{timeout:90000});
  for(const id of ['#simConf','#simBowls','#simPlayoff']){
   await page.waitForFunction(s=>!document.querySelector(s).disabled,id,{timeout:60000});
   await page.evaluate(s=>document.querySelector(s).click(),id);await page.waitForTimeout(1500);
  }
  await page.waitForFunction(()=>document.querySelector('#simPlayoff').disabled,{timeout:60000});await page.waitForTimeout(1500);
  const milestones=await page.evaluate(()=>window.DynastyCeremonySnapshot.read().milestones.filter(m=>['conference','bowl','national','rivalry'].includes(m.kind)).map(m=>m.key).sort());
  const shown=await page.evaluate(()=>window.__shown.slice().sort());
  assert.deepEqual(shown,milestones,'a ceremony plays for each real postseason milestone and no others');
  await page.reload();await page.waitForSelector('#titleNew');
  assert.equal(await page.locator('.ceremony').count(),0,'loading never replays ceremonies');
  assert.deepEqual(errors,[],'no console errors through the postseason');
  console.log(`PASS cohesion and fun: one navigation map, faces, number keys, Rival Watch, live win chance, ceremonies (${shown.length} this run: ${shown.join(', ')||'none earned'})`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
