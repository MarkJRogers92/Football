'use strict';
// Brand identity v2: the display font loads offline, the visuals draw real game state, menus share one
// language, nothing overflows, and none of it advances time or consumes gameplay randomness.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const width of [1440,390]){
  const label=width>700?'desktop':'phone';
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  const before=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());

  assert.ok(await page.evaluate(()=>document.documentElement.classList.contains('bi-brand')),`[${label}] brand layer mounted`);
  assert.ok(await page.evaluate(async()=>{await document.fonts.load('800 20px "Barlow Condensed"');return document.fonts.check('800 20px "Barlow Condensed"')}),`[${label}] bundled display font loads from local assets`);
  assert.match(await page.evaluate(()=>getComputedStyle(document.querySelector('#hubTitle')).fontFamily),/Barlow Condensed/,`[${label}] headlines use the display face`);

  // Dashboard: helmet and a strip with every scheduled game, matching the canonical schedule.
  await page.waitForSelector('#dashboard .bi-strip .bi-chip');
  const team=await page.evaluate(()=>window.DynastyBrandSnapshot.team());
  assert.equal(await page.locator('#dashboard .bi-strip .bi-chip').count(),team.schedule.length,`[${label}] one chip per scheduled game`);
  assert.equal(await page.locator('#dashboard .bi-chip.is-next').count(),1,`[${label}] exactly one next game`);
  const canonical=await page.evaluate(()=>{const t=window.__DL_TEST__.selected();return t.schedule.length});
  assert.equal(team.schedule.length,canonical,`[${label}] snapshot mirrors the real schedule`);
  assert.equal(await page.locator('#dashboard .masthead-identity > .bi-helmet--hero').getAttribute('data-team'),String(team.id),`[${label}] hero helmet belongs to the controlled program`);
  const hub=await page.locator('#hubAdvance').boundingBox();
  assert.ok(hub&&hub.y+hub.height<=900,`[${label}] the primary action stays in the first viewport: ${JSON.stringify(hub)}`);

  // One menu language: the active in-page view is brass in every switcher.
  const brass=await page.evaluate(()=>getComputedStyle(document.querySelector('.dash-views button.active')).backgroundImage);
  assert.match(brass,/gradient/,`[${label}] active dashboard view uses the brass track`);

  // Program Lab: radar values equal the canonical attributes.
  await page.evaluate(()=>document.querySelector('.tabs [data-tab="program"]').click());
  await page.waitForSelector('#programAttributes .bi-radar');
  const aria=await page.locator('#programAttributes .bi-radar').getAttribute('aria-label');
  for(const a of team.attributes)assert.ok(aria.includes(`${a.label} ${a.value}`),`[${label}] radar carries ${a.label} ${a.value}`);
  assert.match(await page.locator('#programAttributes .bi-gauge').getAttribute('aria-label'),new RegExp(`: ${team.confidence} of 100`),`[${label}] gauge shows real confidence`);
  assert.equal(await page.locator('#programAttributes .program-attr').count(),6,`[${label}] canonical tiles remain in the document`);

  // Roster: faces painted and estimate bars drawn from the staff ranges.
  await page.evaluate(()=>document.querySelector('.tabs [data-tab="roster"]').click());
  await page.waitForSelector('#rosterPositionBoard .rd-face canvas[data-portrait-painted="1"]');
  assert.ok(await page.locator('#rosterPositionBoard .rd-estimate').count()>0,`[${label}] estimate range bars render`);

  // Stats: empty defensive board reads as empty instead of eight zero rows.
  await page.evaluate(()=>document.querySelector('.tabs [data-tab="stats"]').click());
  assert.match(await page.locator('#defensiveLeaders').innerText(),/No defensive statistics yet/,`[${label}] zero-stat leaders are not listed`);

  // Recruiting: active class view is brass as well.
  await page.evaluate(()=>document.querySelector('.tabs [data-tab="recruiting"]').click());
  await page.waitForSelector('#recruitClassViews [aria-pressed="true"]');
  assert.match(await page.evaluate(()=>getComputedStyle(document.querySelector('#recruitClassViews [aria-pressed="true"]')).backgroundImage),/gradient/,`[${label}] active recruiting view uses the brass track`);

  for(const tab of ['dashboard','program','roster','stats','recruiting','season']){
   await page.evaluate(t=>document.querySelector(`.tabs [data-tab="${t}"]`).click(),tab);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`[${label}] no horizontal overflow on ${tab}`);
  }
  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),before,`[${label}] visuals never advance time or draw randomness`);
  assert.deepEqual(errors,[],`[${label}] no console errors`);
  await page.close();
 }
 console.log('PASS brand identity: offline display font, real-data helmets/strip/radar/gauge/roster ranges, unified menus, no overflow, no state change');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
