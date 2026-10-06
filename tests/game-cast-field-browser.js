const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
const TAB_GROUP={gamelab:'games',season:'games'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
const state=page=>page.evaluate(()=>document.querySelector('[data-gcf-host]').__gcf.state);
(async()=>{
  const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
    await page.evaluate(()=>{window.__DL_TEST__.v2PrepareDetailedGame();document.querySelector('#userTeam').dispatchEvent(new Event('change',{bubbles:true}))});
    await goTab(page,'gamelab');
    const rollback=await page.evaluate(()=>window.__DL_TEST__.v2RollbackProbe('afterArchive'));
    assert.equal(rollback.ok,true,`rollback probe: ${rollback.message}`);
    assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.playLogKeys()),[],'a rolled-back game leaves no play log behind');
    await page.click('#simDetailedGame');
    await page.waitForFunction(()=>window.DynastyGameEngineV2LabBridge.debug().lastArchive?.engine==='v2',{timeout:30000});
    const game=await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.debug().lastArchive);
    assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.playLogKeys()),[game.id],'the recorded game saved its play log');
    await goTab(page,'season');await page.locator(`#teamSchedule [data-game="${game.id}"]`).first().click();await page.waitForSelector('#gameDialog[open]');
    await page.locator('#gameTabs button').filter({hasText:/^Game Cast$/}).click();
    await page.waitForSelector('[data-gcf-canvas]',{timeout:10000});
    const layout=await page.evaluate(()=>{const host=document.querySelector('[data-gcf-host]'),c=host.querySelector('canvas').getBoundingClientRect(),h=host.getBoundingClientRect();
      return{viewport:innerWidth,host:{left:h.left,right:h.right,scroll:host.scrollWidth,client:host.clientWidth},canvas:{left:c.left,right:c.right,height:c.height},buttons:[...host.querySelectorAll('.gcf-controls button,.gcf-controls select')].map(b=>{const r=b.getBoundingClientRect();return{left:r.left,right:r.right,height:r.height}})}});
    assert.ok(layout.host.left>=-1&&layout.host.right<=layout.viewport+1,`replay fits a phone: ${JSON.stringify(layout)}`);
    assert.ok(layout.host.scroll<=layout.host.client+2,'replay does not overflow horizontally');
    assert.ok(layout.canvas.right<=layout.viewport+1&&layout.canvas.height>=200,'the 3D field is full width and tall enough to read');
    for(const b of layout.buttons){assert.ok(b.right<=layout.viewport+1,'controls stay on screen');assert.ok(b.height>=30,'controls stay tappable')}
    assert.match(await page.locator('[data-gc-mode]').textContent(),/Full 3D replay/);
    // Play and pause.
    await page.click('[data-gcf-toggle]');await page.waitForTimeout(1500);
    let s=await state(page);assert.equal(s.playing,true,'Play starts the replay');assert.ok(s.step>0||s.ms>0,'the replay advances');
    await page.click('[data-gcf-toggle]');const paused=await state(page);await page.waitForTimeout(400);
    s=await state(page);assert.equal(s.playing,false,'Pause stops it');assert.equal(s.step,paused.step);assert.equal(s.ms,paused.ms);
    // Drive navigation.
    await page.click('[data-gcf-next]');const d1=(await state(page)).drive;await page.click('[data-gcf-next]');const d2=(await state(page)).drive;
    assert.equal(d2,d1+1,'Next drive moves one drive forward');
    await page.click('[data-gcf-prev]');assert.equal((await state(page)).drive,d1,'Previous drive moves back');
    // Key plays: the whole game, ending on the recorded score, inside 30 seconds.
    await page.click('[data-gcf-restart]');await page.selectOption('[data-gcf-speed]','key');
    const t0=Date.now();await page.click('[data-gcf-toggle]');
    await page.waitForFunction(()=>{const s=document.querySelector('[data-gcf-host]').__gcf.state;return!s.playing&&s.step===s.steps-1},{timeout:40000});
    const took=Date.now()-t0;assert.ok(took<30000,`key plays took ${took}ms`);
    const end=await page.evaluate(()=>{const c=document.querySelector('[data-gcf-host]').__gcf,bug=Object.fromEntries([...document.querySelectorAll('[data-gcf-score]')].map(e=>[e.dataset.gcfScore,Number(e.textContent)]));return{state:c.state.score,final:c.timeline.final,bug}});
    const recorded=await page.evaluate(id=>{const t=[...document.querySelectorAll('#teamSchedule [data-game]')].find(x=>x.dataset.game===id);return t?t.textContent:''},game.id);
    assert.deepEqual(end.state,end.final,'key plays ends on the final score');assert.deepEqual(end.bug,end.final,'the scorebug shows the final score');
    assert.ok(recorded.includes(String(Math.max(end.final.home,end.final.away)))&&recorded.includes(String(Math.min(end.final.home,end.final.away))),`final matches the schedule result: ${recorded} vs ${JSON.stringify(end.final)}`);
    // Switching tabs stops the replay.
    await page.click('[data-gcf-restart]');await page.selectOption('[data-gcf-speed]','1');await page.click('[data-gcf-toggle]');
    await page.evaluate(()=>{window.__gcfRef=document.querySelector('[data-gcf-host]').__gcf});
    await page.locator('#gameTabs button').filter({hasText:/^Box Score$/}).click();await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>window.__gcfRef.state.playing),false,'leaving the Game Cast tab stops the replay');
    assert.deepEqual(errors,[],`browser errors: ${errors.join('\n')}`);
    console.log(`PASS Game Cast 3D replay at 390px: play/pause, drive navigation, key plays in ${took}ms, tab-switch pause, rollback leaves no play log`);
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
