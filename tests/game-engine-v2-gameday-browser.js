const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains("active"))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
const {startNewDynasty:sharedStartNewDynasty}=require('./helpers/start-new-dynasty');
const startNewDynasty=page=>sharedStartNewDynasty(page);
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await goTab(page,'gamelab');
    await page.waitForSelector('#v2InteractiveGameDay [data-v2-gameday-start]',{timeout:15000});
    const before=await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewDigest());assert.ok(before,'preview integrity digest should be available');
    await page.click('[data-v2-gameday-start]');await page.waitForSelector('#v2InteractiveGameDay .v2-gameday-scoreboard',{timeout:10000});
    let state=await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewState());assert.ok(state);assert.ok(['live','decision'].includes(state.status));assert.ok(state.state.events.length>=3,'interactive preview should start the football event stream');
    for(let i=0;i<3;i++)if(await page.locator('[data-v2-gameday-next]').count())await page.click('[data-v2-gameday-next]');
    if(await page.locator('[data-v2-gameday-decision]').count())await page.click('[data-v2-gameday-decision]');
    await page.waitForSelector('#v2InteractiveGameDay .v2-gameday-decision',{timeout:15000});
    const decision=await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewState().state.pendingCoachingDecision);assert.equal(decision.type,'fourth_down');assert.ok(decision.options.some(o=>o.id==='delegate'));
    await page.click('[data-v2-gameday-choice="delegate"]');
    assert.equal(await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewDigest()),before,'resolving a coaching decision must not mutate the live dynasty');
    await page.click('[data-v2-gameday-delegate]');await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayPreviewState()?.state?.status==='final',{timeout:60000});
    state=await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewState());assert.equal(state.status,'final');assert.ok(state.state.events.some(e=>e.type==='coaching_decision'));assert.ok(state.state.events.length>50);
    assert.equal(await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewDigest()),before,'a staged final must leave schedule, records, stats and archive untouched');
    assert.match(await page.locator('#v2InteractiveGameDay').textContent(),/Final is staged until you make it official/);assert.equal(await page.locator('[data-v2-gameday-record]').count(),1,'staged final should expose the official-record button');
    assert.deepEqual(errors,[],`interactive Game Day preview emitted browser errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.1 interactive Game Day: live scoreboard, fourth-down decision UI, deterministic staged final, zero mutation before official record');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
