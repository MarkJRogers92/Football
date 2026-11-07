'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  await page.evaluate(()=>{document.querySelector('.tabs [data-tab="recruiting"]').click();window.scrollTo(0,0)});
  await page.waitForSelector('.recruit-workspace-card');
  const output=process.env.DYNASTY_TOOLS_SCREENSHOT_DIR;if(output)require('node:fs').mkdirSync(output,{recursive:true});
  if(output){await page.waitForFunction(()=>!document.querySelector('.hud-toast'));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`desk-${width}.png`)})}
  assert.equal(await page.locator('#recruitClassViews [data-recruit-class]').count(),7,'all focused views have direct access in one compact strip');
  const rows=await page.locator('#recruitClassViews [data-recruit-class]').evaluateAll(bs=>new Set(bs.map(b=>Math.round(b.getBoundingClientRect().top))).size);
  assert.equal(rows,1,'navigation stays on one row');
  for(const selector of ['#recruitMap','#staffRecruitShortlist','#classSummary','#recruitingHistory'])assert.equal(await page.locator(selector).isVisible(),false,`${selector} is outside the default desk`);
  assert.match(await page.locator('[data-rw-budget]').innerText(),/\d+\s*\/\s*\d+.*h left/,'shared evaluation hours remain visible on the desk');
  if(width===390){const first=await page.locator('.rw-main strong').first().boundingBox();assert.ok(first.y<600,`first prospect at y=${first.y} must remain above 600`)}
  await page.click('[data-rw-more]');const loaded=await page.locator('.recruit-workspace-card').count(),chosen=page.locator('.recruit-workspace-card').nth(40),id=await chosen.getAttribute('data-rwid');
  await chosen.click();if(width===390)await page.click('[data-rw-back]');
  const scroll=await page.locator('.rw-card-list').evaluate(e=>e.scrollTop),state=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
  for(const value of ['map','shortlist','summary','history']){
   await page.locator('[data-recruit-class=\"'+value+'\"]').click();
   assert.equal(await page.locator('#recruitWorkspace').isVisible(),false);
   if(output&&value!=='history'){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`${value}-${width}.png`)})}
   assert.equal(await page.locator({map:'#recruitMap',shortlist:'#staffRecruitShortlist',summary:'#classSummary',history:'#recruitingHistory'}[value]).isVisible(),true);
  }
  assert.match(await page.locator('#recruitingHistory').innerText(),/No signing-day scouting records yet/);
  assert.equal(await page.locator('#recruitingHistory .recruiting-history-class').count(),0,'new games do not invent historical classes');
  await page.click('[data-recruit-class="current"]');
  assert.equal(await page.locator('.recruit-workspace-card').count(),loaded);assert.equal(await page.locator('.recruit-workspace-card.active').getAttribute('data-rwid'),id);
  assert.ok(Math.abs(await page.locator('.rw-card-list').evaluate(e=>e.scrollTop)-scroll)<3,'tool navigation preserves list position');
  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),state,'view changes preserve calendar, targets and random state');
  await page.locator('[data-recruit-class=\"'+'map'+'\"]').click();await page.click('[data-rm-filter="5"]');
  const mark=page.locator('[data-rm-recruit]').first(),mapId=await mark.getAttribute('data-rm-recruit');
  const expectedName=await page.evaluate(id=>window.DynastyRecruitMap.model().recruits.find(x=>String(x.r.id)===id).r.name,mapId);
  await mark.dispatchEvent('click');await page.waitForSelector('#recruitDialog[open]');
  assert.equal(await page.locator('#recruitDialogName').innerText(),expectedName,'map marks open the canonical recruit profile');
  await page.evaluate(()=>document.querySelector('#recruitDialog').close());
  await page.locator('[data-recruit-class=\"'+'shortlist'+'\"]').click();
  const quick=page.locator('#staffRecruitShortlist [data-scout-action="quick"]:not([disabled])').first(),scoutId=await quick.getAttribute('data-scout-recruit'),spent=await page.evaluate(()=>window.__DL_TEST__.selected().scoutingWeek?.spent??0);
  await quick.click();await page.waitForFunction(id=>window.DynastyRecruitingWorkspaceIntel.forId(id).stage==='Film reviewed',scoutId);
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.selected().scoutingWeek.spent),spent+1,'shortlist scouting spends exactly one hour');
  assert.equal(await page.locator('#staffRecruitShortlist').isVisible(),true,'refresh stays in the shortlist view');
  const target=page.locator('#staffRecruitShortlist [data-shortlist-target]').first(),targetId=await target.getAttribute('data-shortlist-target');await target.click();
  await page.waitForFunction(id=>window.DynastyRecruitingWorkspaceIntel.forId(id).targeted,targetId);
  await page.locator('[data-recruit-class=\"'+'summary'+'\"]').click();assert.match(await page.locator('#classSummary').innerText(),/1 active target/);
  assert.equal(await page.locator('#classSummary .scouting-receipt-recap').count(),0,'history is not duplicated inside class summary');
  // Real render path with a controlled signing-day receipt; no engine/test-only hooks are added.
  const receipt=await page.evaluate(()=>{
   const t=window.__DL_TEST__.selected(),p=t.roster[0];
   const snap={version:1,schoolId:t.id,schoolName:t.name,recruitId:p.id,name:p.name,pos:p.pos,style:p.style,season:2027,week:8,stars:3,nationalRank:300,positionRank:20,currentRead:65,upsideRead:75,verdictScore:70,verdictLabel:'Boardable',conviction:'Medium',confidence:65,rangeWidth:8,stage:'QUICK_FILM',hoursSpent:1,interest:80};
   p.recruitingMemory={season:2027,schoolId:t.id,stars:3,scoutingReceipt:snap};
   document.querySelector('#userTeam').dispatchEvent(new Event('change',{bubbles:true}));return JSON.stringify(snap);
  });
  await page.locator('[data-recruit-class=\"'+'history'+'\"]').click();await page.waitForSelector('#recruitingHistory .recruiting-history-class');
  assert.equal(await page.locator('#recruitingHistory .recruiting-history-row').count(),1);
  if(output){await page.waitForFunction(()=>!document.querySelector('.hud-toast'));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`history-${width}.png`)})}
  assert.match(await page.locator('#recruitingHistory').innerText(),/Class of 2027/);assert.match(await page.locator('#recruitingHistory').innerText(),/1 pending|Awaiting evidence/);
  await page.locator('.recruiting-history-class > summary').click();
  await page.locator('[data-recruit-class=\"'+'map'+'\"]').click();assert.equal(await page.locator('[data-rm-filter="5"]').getAttribute('aria-pressed'),'true','map filter survives other tools and canonical refresh');
  await page.locator('[data-recruit-class=\"'+'history'+'\"]').click();assert.equal(await page.locator('.recruiting-history-class').evaluate(e=>e.open),false,'history disclosure state survives navigation');
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__DL_TEST__.selected().roster[0].recruitingMemory.scoutingReceipt)),receipt,'navigation leaves the signing receipt immutable');
  await page.click('[data-recruit-class="current"]');assert.match(await page.locator('[data-rw-budget]').innerText(),/\d+\s*\/\s*\d+.*h left/);
  const hours=await page.evaluate(()=>{const w=window.__DL_TEST__.selected().scoutingWeek;return{left:w.budget-w.spent,budget:w.budget}});
  assert.equal(await page.locator('[data-rw-budget]').innerText(),`${hours.left} / ${hours.budget}h left`,'compact hours stay in sync after scouting');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);
  await page.close();
 }}finally{await browser.close()}
 console.log('PASS focused recruiting tools, canonical map/shortlist actions, real receipt history, retained state and budget at desktop/phone sizes');
})().catch(e=>{console.error(e);process.exit(1)});
