const {testPageURL}=require('./helpers/browser-url');
// Synthetic, disposable browser profile: no user saves or remote service is used.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');
const root=path.join(__dirname,'..'),fixture=path.join(root,'.correctness-browser.html');
(async()=>{
 const source=fs.readFileSync(path.join(root,'index.html'),'utf8'),at=source.lastIndexOf('loadSchools().then(');assert.ok(at>0);
 // The engine stays private in production; expose it only in this temporary test page.
 const hook="globalThis.correctnessTest={get universe(){return universe},set universe(v){universe=v},selected,importantStarters,ensureWeeklyDecisions,delegateWeeklyDecisions,weeklyDecisionReceipts,resolveWeeklyDecision,render,normalizeUniverse,packUniverse,simWeek};\n";
 fs.writeFileSync(fixture,source.slice(0,at)+hook+source.slice(at));
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto(testPageURL(path.basename(fixture)));await startNewDynasty(page);
  if(!await page.locator('#weeklyDeskDetails').evaluate(el=>el.open))await page.click('#weeklyDeskDetails > summary');
  const before=await page.evaluate(()=>({text:document.querySelector('#firstSeasonBriefing').innerText,bullets:document.querySelectorAll('#firstSeasonBriefing li').length}));assert.ok(before.bullets<=3);assert.equal(await page.locator('#firstSeasonBriefing [data-player]').count(),2,'the first briefing introduces two real profile links');
  const chosen=await page.evaluate(()=>{
   const e=correctnessTest,u=e.universe,t=e.selected(),p=e.importantStarters(t)[0];Object.assign(p,{health:70,wear:76,injuryWeeks:0,redshirtActive:false});u.weeklyDecisions=[];
   const d=e.ensureWeeklyDecisions(t).find(d=>d.type==='INJURED_STARTER');u.weeklyDecisions=[d];
   const ok=e.delegateWeeklyDecisions(t);e.render();return {ok,id:d.id,name:p.name,option:d.resolvedOptionId,role:p.weeklyAvailability?.role,receipts:e.weeklyDecisionReceipts(t)};
  });assert.equal(chosen.ok,true);assert.equal(chosen.option,'limited');assert.equal(chosen.role,'limited');assert.ok(chosen.receipts.some(r=>r.decisionId===chosen.id));
  let text=await page.locator('#firstSeasonBriefing').innerText();assert.match(text,/Staff:/);assert.ok(chosen.receipts.some(r=>r.text.includes(chosen.name)&&/Limited role/.test(r.text)),'the medical action has a factual receipt');assert.ok(text.includes(chosen.receipts[0].text),'the compact briefing displays the latest recorded staff action');assert.ok(await page.locator('#firstSeasonBriefing li').count()<=3);
  const restored=await page.evaluate(id=>{
   const e=correctnessTest;e.universe=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));e.normalizeUniverse();e.delegateWeeklyDecisions(e.selected());e.render();
   return e.universe.events.filter(v=>v.type==='WEEKLY_DECISION_RESOLVED'&&v.metadata.decisionId===id).length;
  },chosen.id);assert.equal(restored,1);assert.match(await page.locator('#firstSeasonBriefing').innerText(),/Staff:/);
  // The real starter-challenge control still resolves through the interactive path.
  const fx=await page.evaluate(()=>{correctnessTest.universe.weeklyDecisions=[];return window.__DL_TEST__.weeklyPersonnelForceFixture()});assert.ok(fx);
  await page.click(`[data-decision="${fx.id}"][data-choice="promote"]`);assert.equal((await page.evaluate(()=>window.__DL_TEST__.weeklyPersonnelDepth('QB')))[0],fx.challengerId);
  assert.deepEqual(errors,[]);console.log('PASS correctness browser: compact ordinary/exception briefings, factual staff receipt, save restoration, one event, and manual personnel choice');
 }finally{await browser.close();fs.rmSync(fixture,{force:true})}
})().catch(e=>{fs.rmSync(fixture,{force:true});console.error(e);process.exitCode=1});
