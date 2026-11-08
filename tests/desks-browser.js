const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
const path=require('path');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

const waitForSaved=page=>page.waitForFunction(()=>window.DynastySessionStatus?.read().state==='saved',null,{timeout:60000});
async function reopenAfterSave(page){
 await waitForSaved(page);
 await page.reload();
 await page.click('#titleContinue:enabled');
 await page.waitForFunction(()=>!document.querySelector('#app').hidden,null,{timeout:60000});
}

// Management desks in a real browser: staff assignments, the situational playbook, player arcs and class cards,
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
   await waitForSaved(page);
   await page.click('[data-sa-suggest]');
   await reopenAfterSave(page);
   await T(()=>window.__DL_TEST__.goToTab('staff'));
   const assigned=await page.$$eval('#staffAssignments [data-sa-region]',s=>s.filter(x=>x.value).length);
   assert.equal(assigned,5,'every coach gets a territory');
   await page.selectOption('#staffAssignments [data-sa-region="RC"]','');
   await reopenAfterSave(page);
   await T(()=>window.__DL_TEST__.goToTab('staff'));
   assert.equal(await page.$eval('#staffAssignments [data-sa-region="RC"]',s=>s.value),'');
   await noOverflow('staff assignments');
   pass(`[${label}] staff assignments: suggestion, clearing a territory`);

   // Situational playbook.
   await T(()=>window.__DL_TEST__.goToTab('gamelab'));
   await page.waitForSelector('#situationalPlaybook');
   await page.selectOption('#situationalPlaybook [data-pb="fourthDown"]','aggressive');
   await reopenAfterSave(page);
   await T(()=>window.__DL_TEST__.goToTab('gamelab'));
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

   // Begin with an empty board so the shortlist has to find a genuine roster vacancy.
   await T(()=>window.__DL_TEST__.portalDeskPrepare(0));
   const prospects=page.locator('.pd-shortlist .pd-prospect');
   assert.ok(await prospects.count()>=2,'staff offer alternatives for the same vacancy');
   if(label==='desktop'){
    assert.equal(await prospects.nth(0).evaluate(el=>el.offsetTop),await prospects.nth(1).evaluate(el=>el.offsetTop));
   }else{
    const row=page.locator('#portalBoard tr').first(),expand=row.locator('[data-portal-expand]');
    assert.ok(await row.locator('[data-label="Attention"]').isHidden());
    await expand.click();
    assert.ok(await row.locator('[data-label="Attention"]').isVisible());
    await expand.click();
    assert.equal(await expand.getAttribute('aria-expanded'),'false');
   }
   await page.locator('[data-pd-pursue]:enabled').first().click();
   await page.locator('[data-pd-delegate]').click();
   assert.ok(await page.locator('[data-pd-auto]').isChecked());
   await waitForSaved(page);
   const before=await page.textContent('.pd-hours');
   if(label==='iphone'){
    const target=page.locator('.pd-target').first();
    assert.ok(await target.locator('.pd-actions').isHidden());
    assert.ok((await target.boundingBox()).height<120,'a collapsed target takes one compact row');
    await target.locator('[data-pd-expand]').click();
    assert.ok(await target.locator('.pd-actions').isVisible());
   }
   await page.locator('[data-pd-act="call"]:enabled:visible').first().click();
   const remaining=await page.textContent('.pd-hours');
   assert.notEqual(remaining,before);
   await reopenAfterSave(page);
   await T(()=>window.__DL_TEST__.goToTab('offseason'));
   assert.equal(await page.textContent('.pd-hours'),remaining,'the same slot retains the call without advancing');
   assert.ok(await page.locator('[data-pd-auto]').isChecked());
   assert.ok(await page.locator('[data-pd-pursue]:disabled').count()>=2,'pursued candidates remain targeted');
   await noOverflow('portal desk');
   pass(`[${label}] portal scouting, delegation and hours survive Continue`);
   await page.close();
  }
  assert.deepEqual(errors,[],'no page or console errors');
  console.log(`\n${passed} passed, 0 failed`);
 }catch(e){console.error(e);console.error(errors);process.exitCode=1}
 finally{await browser.close()}
})();
