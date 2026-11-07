'use strict';
// Sound, storylines, legacy, highlights, Rivalry Week and the yearbook, played through real weeks.
// None of it may advance time, draw gameplay randomness or write into the dynasty save.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');
const simWeek=async page=>{for(let i=0;i<12;i++){const before=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);const moved=await page.evaluate(()=>{const b=document.querySelector('#simWeek');if(b&&!b.disabled){b.click();return true}document.querySelector('#weeklyDecisions [data-decision]')?.click();return false});await page.waitForTimeout(moved?600:200);if(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week)>before)return}};
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const width of [1280,390]){
  const label=width>700?'desktop':'phone';
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);

  // Sound: silent by default under automation, every cue renders when enabled, a win plays the sting.
  assert.equal(await page.locator('#soundToggle').count(),1,`[${label}] sound toggle in the top bar`);
  const cues=await page.evaluate(()=>{window.DynastySound.enableForTests(true);return window.DynastySound.cues.map(c=>[c,window.DynastySound.play(c)])});
  assert.ok(cues.every(([,ok])=>ok),`[${label}] every cue synthesizes: ${JSON.stringify(cues)}`);
  await page.evaluate(()=>{window.DynastySound.log.length=0});
  for(let w=0;w<3;w++)await simWeek(page);
  const log=await page.evaluate(()=>window.DynastySound.log.slice());
  const finals=await page.evaluate(()=>(window.__DL_TEST__.selected().schedule||[]).filter(g=>g.played).map(g=>g.winner===window.__DL_TEST__.selected().name?'winSting':'lossTone'));
  assert.ok(finals.every(c=>log.includes(c)),`[${label}] week finals play their result cue: ${log.join(',')}`);

  const before=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
  // Highlights: the last game with box-score performers that are the user's own players.
  await page.locator('#weeklyDeskDetails > summary').click();
  await page.waitForSelector('#highlightsCard');
  const h=await page.evaluate(()=>window.DynastySeasonMoments.highlights());
  assert.match(await page.locator('#highlightsCard').innerText(),new RegExp(`${h.us}–${h.them}`),`[${label}] highlights show the real final score`);
  const roster=await page.evaluate(()=>window.__DL_TEST__.selected().roster.map(p=>p.id));
  assert.ok(h.performers.length>0&&h.performers.every(p=>roster.includes(p.id)),`[${label}] performers come from your box score`);

  // Storylines: every shown arc carries the evidence behind it.
  await page.locator('[data-dash-view="stories"]').click();
  const snap=await page.evaluate(()=>{const s=window.DynastyStorylineSnapshot.read(),S=window.DynastyStorylines;return{mine:S.select(s.team,{limit:4}).length,league:S.select(s.league,{limit:4,minScore:64,maxPerType:1}).length,race:s.race.length}});
  if(snap.mine||snap.league||snap.race){await page.waitForSelector('#storylinesCard');assert.equal(await page.locator('#storylinesCard').isVisible(),true,`[${label}] storylines live in Players & goals`)}
  assert.equal(await page.locator('#storylinesCard .sl-card').count(),snap.mine+snap.league,`[${label}] one card per selected storyline`);
  await page.locator('[data-dash-view="week"]').click();

  // Legacy: first win unlocked, page renders, a challenge can be taken.
  await page.evaluate(()=>document.querySelector('.tabs [data-tab="legacy"]').click());
  await page.waitForSelector('#legacyBoard .lg-ach');
  const won=await page.evaluate(()=>window.__DL_TEST__.selected().w);
  assert.equal(await page.locator('.lg-ach.is-unlocked').filter({hasText:'First Win'}).count(),won>0?1:0,`[${label}] First Win matches the real record`);
  if(await page.locator('[data-legacy-accept]').count()){await page.locator('[data-legacy-accept]').first().click();await page.waitForSelector('.lg-ch .lg-bar')}
  assert.ok(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('dynastyLabLegacy')||'null')?.achievements),`[${label}] legacy lives outside the save`);

  // Yearbook opens with the real record and closes.
  await page.evaluate(()=>window.DynastySeasonMomentsUI.openYearbook());
  const t=await page.evaluate(()=>{const x=window.__DL_TEST__.selected();return`${x.w}-${x.l}`});
  assert.match(await page.locator('.yearbook .yb-facts').innerText(),new RegExp(t),`[${label}] yearbook prints the real record`);
  await page.click('[data-yb-close]');assert.equal(await page.locator('.yearbook').count(),0);

  // Rivalry Week ribbon appears exactly when the next game is the rival.
  await page.evaluate(()=>document.querySelector('.tabs [data-tab="dashboard"]').click());await page.waitForTimeout(300);
  const rw=await page.evaluate(()=>window.DynastySeasonMoments.rivalryWeek());
  assert.equal(await page.locator('.rvw-week-ribbon').count(),rw?1:0,`[${label}] Rivalry Week ribbon follows the schedule`);

  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),before,`[${label}] these features never advance time or draw randomness`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`[${label}] no horizontal overflow`);
  assert.deepEqual(errors,[],`[${label}] no console errors`);
  await page.close();
 }
 console.log('PASS season features: synthesized sound on real results, storylines with evidence, legacy outside the save, highlights, Rivalry Week, yearbook');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
