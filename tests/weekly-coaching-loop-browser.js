const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={gamelab:'games'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains("active"))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
async function startNewDynasty(page){await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
    const ready=await page.evaluate(()=>window.__DL_TEST__.v2PrepareDetailedGame());assert.equal(ready.career,false);assert.equal(ready.ready,true,`weekly coaching fixture should be ready for Game Day: ${JSON.stringify(ready)}`);
    await goTab(page,'gamelab');await page.waitForSelector('#v0102WeeklyCoaching',{state:'visible',timeout:15000});
    const text=await page.locator('#v0102WeeklyCoaching').textContent();for(const phrase of ['V0.10.2 WEEKLY COACHING','Opponent scout','Preparation board','prep points used','Delegate to Staff','Staff Room','Offensive coordinator','Defensive coordinator','Split the Room'])assert.match(text,new RegExp(phrase,'i'));
    const before=await page.evaluate(()=>window.__DL_TEST__.weeklyCoachingDebug());assert.ok(before?.report);assert.ok(before?.staffRoom);assert.equal(before.prep,null);assert.deepEqual(before.profile.active,before.profile.base,'zero prep points must preserve the exact v0.10.1 kickoff profile');
    await page.click('[data-v0102-staff-plan="oc"]');const ocBacked=await page.evaluate(()=>window.__DL_TEST__.weeklyCoachingDebug());assert.equal(ocBacked.prep.source,'oc');assert.deepEqual(ocBacked.prep.focuses,ocBacked.staffRoom.oc.plan);assert.equal(ocBacked.prep.focuses.length,2);
    await page.click('[data-v0102-staff-plan="split"]');const chosen=await page.evaluate(()=>window.__DL_TEST__.weeklyCoachingDebug());assert.equal(chosen.prep.source,'split');assert.deepEqual(chosen.prep.focuses,chosen.staffRoom.split.plan);assert.notDeepEqual(chosen.profile.active,chosen.profile.base,'Staff Room plan must alter kickoff inputs');assert.match(await page.locator('#v0102WeeklyCoaching').textContent(),/2\/2 prep points used/i);
    await page.click('[data-v2-gameday-start]');assert.equal(await page.locator('[data-v0102-prep-delegate]').isDisabled(),true,'prep should lock while staged Game Day is active');assert.equal(await page.locator('[data-v0102-staff-plan="split"]').isDisabled(),true,'Staff Room plan buttons should lock while staged Game Day is active');await page.click('[data-v2-gameday-delegate]');
    await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayPreviewState()?.state?.status==='final',{timeout:120000});await page.click('[data-v2-gameday-record]');
    await page.waitForFunction(()=>window.__DL_TEST__.weeklyCoachingLastArchive()?.weeklyPrepVersion===2,{timeout:30000});const archived=await page.evaluate(()=>window.__DL_TEST__.weeklyCoachingLastArchive());const used=[archived.weeklyPrep?.home,archived.weeklyPrep?.away].find(Boolean);assert.ok(used,'permanent archive should retain the user weekly prep');assert.equal(used.source,'split');assert.deepEqual(used.focuses,chosen.staffRoom.split.plan);
    assert.deepEqual(errors,[],`weekly coaching browser emitted errors: ${errors.join('\n')}`);console.log(`PASS v0.10.2 weekly coaching browser: imperfect scout, Staff Room conflict/split, kickoff effect and permanent archive ${archived.id}`)
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
