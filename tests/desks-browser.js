const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const path=require('path');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

// v0.15.1 desks in a real browser: staff assignments, the situational playbook, player arcs and class cards,
// the Portal Desk and the guided tour, at desktop and phone widths, with no console errors or page overflow.
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 const errors=[];let passed=0;
 const pass=name=>{passed++;console.log(`  PASS  ${name}`)};
 try{
  for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
   const page=await browser.newPage({viewport});
   page.on('pageerror',e=>errors.push(`${label}: ${e}`));
   page.on('console',m=>{if(m.type()==='error')errors.push(`${label} console: ${m.text()}`)});
   await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
   const T=fn=>page.evaluate(fn);
   const noOverflow=async where=>assert.equal(await T(()=>document.documentElement.scrollWidth>window.innerWidth+1),false,`${label}: ${where} overflows the page`);

   // Tour offer and the tour itself.
   await T(()=>window.__DL_TEST__.goToTab('dashboard'));
   assert.ok(await page.$('#tourOffer'),'the first season offers the tour');
   await page.click('[data-tour-start]');
   await page.waitForSelector('#tourLayer .tour-card');
   assert.match(await page.textContent('#tourTitle'),/This Week/);
   for(let i=0;i<6;i++)await page.click('[data-tour-next]');
   assert.match(await page.textContent('#tourTitle'),/Portal Desk/);
   await page.click('[data-tour-next]');
   assert.equal(await page.$('#tourLayer'),null,'Finish closes the tour');
   assert.equal((await T(()=>window.__DL_TEST__.tourState())).seen,true);
   await T(()=>window.__DL_TEST__.goToTab('dashboard'));
   assert.equal(await page.$('#tourOffer'),null,'a finished tour is not offered again');
   pass(`[${label}] guided tour opens, steps through every desk and closes`);

   // Staff assignments.
   await T(()=>window.__DL_TEST__.goToTab('staff'));
   await page.waitForSelector('#staffAssignments');
   await page.click('[data-sa-suggest]');
   const assigned=await page.$$eval('#staffAssignments [data-sa-region]',s=>s.filter(x=>x.value).length);
   assert.equal(assigned,5,'every coach gets a territory');
   await page.selectOption('#staffAssignments [data-sa-region="RC"]','');
   assert.equal(await page.$eval('#staffAssignments [data-sa-region="RC"]',s=>s.value),'');
   await noOverflow('staff assignments');
   pass(`[${label}] staff assignments: suggestion, clearing a territory`);

   // Situational playbook.
   await T(()=>window.__DL_TEST__.goToTab('gamelab'));
   await page.waitForSelector('#situationalPlaybook');
   await page.selectOption('#situationalPlaybook [data-pb="fourthDown"]','aggressive');
   assert.equal(await page.$eval('#situationalPlaybook [data-pb="fourthDown"]',s=>s.value),'aggressive');
   assert.equal(await T(()=>window.__DL_TEST__.selected().playbook.fourthDown),'aggressive');
   await noOverflow('playbook');
   pass(`[${label}] situational playbook saves a setting`);

   // Player arc and class cards (from recruiting memories written onto the roster).
   const pid=await T(()=>{const t=window.__DL_TEST__.selected();t.roster.slice(0,12).forEach((p,i)=>{p.recruitingMemory={season:2024+(i%3),stars:2+(i%4),schoolId:t.id,homeRegion:'Gulf',desk:i===0?{hours:12,topic:'Early Role',beat:'Rival U'}:undefined};p.seasonHistory=[{year:2026,starts:i%2?9:0,team:t.name,pos:p.pos}]});return t.roster[0].id});
   await T(()=>window.__DL_TEST__.goToTab('dashboard'));
   await page.evaluate(id=>window.__DL_TEST__.showPlayer(id),pid);
   await page.waitForSelector('.arc-story');
   assert.match(await page.textContent('.arc-story'),/You won him over Rival U with pitches on Early Role \(12 hours\)/);
   await page.keyboard.press('Escape');
   await T(()=>window.__DL_TEST__.goToTab('program'));
   await page.waitForSelector('#arcClasses .arc-class');
   assert.equal(await page.$$eval('#arcClasses .arc-class',x=>x.length),3);
   await noOverflow('class cards');
   pass(`[${label}] player arc on the profile and class report cards`);

   // Portal Desk.
   const targets=await T(()=>window.__DL_TEST__.portalDeskPrepare(2));
   assert.ok(targets.length>0,'the portal has players to chase');
   await page.waitForSelector('#portalDesk .pd-card');
   const before=await page.textContent('#portalDesk .pd-hours');
   await page.click('#portalDesk [data-pd-act="call"]:not([disabled])');
   await page.waitForSelector('#portalDesk .pd-hours');
   assert.notEqual(await page.textContent('#portalDesk .pd-hours'),before,'a call spends portal hours');
   assert.ok(await page.$$eval('#portalDesk .pd-field li',x=>x.length)>0,'each card shows his field with odds');
   await noOverflow('portal desk');
   pass(`[${label}] Portal Desk: hours, a call, the field and odds`);
   await page.close();
  }
  assert.deepEqual(errors,[],'no page or console errors');
  console.log(`\n${passed} passed, 0 failed`);
 }catch(e){console.error(e);console.error(errors);process.exitCode=1}
 finally{await browser.close()}
})();
