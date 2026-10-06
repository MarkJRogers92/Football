const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
const TAB_GROUP={gamelab:'games',season:'games'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
const state=page=>page.evaluate(()=>document.querySelector('[data-gcf-host]').__gcf.state);
const activeTab=page=>page.evaluate(()=>document.querySelector('#gameTabs button.active')?.dataset.gameTab);
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
    // Watch My Next Game plays the game and opens the 3D replay on the Watch tab, already rolling.
    await page.click('#watchDetailedGame');
    await page.waitForSelector('#gameDialog[open] [data-gcf-canvas]',{timeout:30000});
    assert.equal(await activeTab(page),'Watch','Watch My Next Game opens the Watch tab');
    const game=await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.debug().lastArchive);
    assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.playLogKeys()),[game.id],'the recorded game saved its play log');
    await page.waitForFunction(()=>document.querySelector('[data-gcf-host]').__gcf.state.playing,{timeout:3000});
    const layout=await page.evaluate(()=>{const host=document.querySelector('[data-gcf-host]'),c=host.querySelector('canvas').getBoundingClientRect(),h=host.getBoundingClientRect(),t=host.querySelector('[data-gcf-toggle]').getBoundingClientRect();
      return{viewport:innerWidth,viewH:innerHeight,host:{left:h.left,right:h.right,scroll:host.scrollWidth,client:host.clientWidth},canvas:{right:c.right,height:c.height,bottom:c.bottom},toggleBottom:t.bottom,buttons:[...host.querySelectorAll('.gcf-controls button,.gcf-controls select')].map(b=>{const r=b.getBoundingClientRect();return{left:r.left,right:r.right,height:r.height}})}});
    assert.ok(layout.host.left>=-1&&layout.host.right<=layout.viewport+1,`replay fits a phone: ${JSON.stringify(layout)}`);
    assert.ok(layout.host.scroll<=layout.host.client+2,'replay does not overflow horizontally');
    assert.ok(layout.canvas.right<=layout.viewport+1&&layout.canvas.height>=200,'the 3D field is full width and tall enough to read');
    assert.ok(layout.toggleBottom>layout.canvas.bottom,'the controls sit directly under the field');
    for(const b of layout.buttons){assert.ok(b.right<=layout.viewport+1,'controls stay on screen');assert.ok(b.height>=30,'controls stay tappable')}
    // Pause, then step one play forward and back.
    await page.click('[data-gcf-toggle]');let s=await state(page);assert.equal(s.playing,false,'Pause stops the replay');
    await page.click('[data-gcf-next]');const atDrive=await state(page);
    await page.click('[data-gcf-fwd]');assert.equal((await state(page)).playing,true,'Next play runs one play');
    await page.waitForFunction(()=>!document.querySelector('[data-gcf-host]').__gcf.state.playing,{timeout:6000});
    s=await state(page);assert.equal(s.step,atDrive.step,'Next play stops at the end of that play');
    await page.click('[data-gcf-fwd]');await page.waitForFunction(()=>!document.querySelector('[data-gcf-host]').__gcf.state.playing,{timeout:6000});
    const after2=await state(page);assert.ok(after2.step>atDrive.step,'a second Next play moves on');
    await page.click('[data-gcf-back]');assert.ok((await state(page)).step<=after2.step&&(await state(page)).ms===0,'Previous play rewinds to the snap');
    // Drive navigation: buttons, the drive picker, and the keyboard.
    await page.click('[data-gcf-next]');const d1=(await state(page)).drive;await page.click('[data-gcf-next]');assert.equal((await state(page)).drive,d1+1,'Next drive moves one drive forward');
    await page.click('[data-gcf-prev]');assert.equal((await state(page)).drive,d1,'Previous drive moves back');
    await page.selectOption('[data-gcf-drive-pick]','4');assert.equal((await state(page)).drive,4,'the drive picker jumps to a drive');
    await page.focus('[data-gcf-host]');await page.keyboard.press('Shift+ArrowRight');assert.equal((await state(page)).drive,5,'Shift+→ moves to the next drive');
    await page.keyboard.press('Space');assert.equal((await state(page)).playing,true,'Space plays');await page.keyboard.press('Space');assert.equal((await state(page)).playing,false,'Space pauses');
    // Key plays: the whole game, ending on the recorded score, inside 30 seconds.
    await page.click('[data-gcf-restart]');await page.selectOption('[data-gcf-speed]','key');
    const t0=Date.now();await page.click('[data-gcf-toggle]');
    await page.waitForFunction(()=>{const s=document.querySelector('[data-gcf-host]').__gcf.state;return!s.playing&&s.step===s.steps-1},{timeout:40000});
    const took=Date.now()-t0;assert.ok(took<30000,`key plays took ${took}ms`);
    const end=await page.evaluate(()=>{const c=document.querySelector('[data-gcf-host]').__gcf,bug=Object.fromEntries([...document.querySelectorAll('[data-gcf-score]')].map(e=>[e.dataset.gcfScore,Number(e.textContent)]));return{state:c.state.score,final:c.timeline.final,bug}});
    assert.deepEqual(end.state,end.final,'key plays ends on the final score');assert.deepEqual(end.bug,end.final,'the scorebug shows the final score');
    // Switching tabs stops the replay; Game Cast links back to it.
    await page.click('[data-gcf-toggle]');await page.evaluate(()=>{window.__gcfRef=document.querySelector('[data-gcf-host]').__gcf});
    await page.locator('#gameTabs button').filter({hasText:/^Game Cast$/}).click();await page.waitForTimeout(300);
    assert.equal(await page.evaluate(()=>window.__gcfRef.state.playing),false,'leaving the Watch tab stops the replay');
    await page.click('.gc-watch-cta [data-game-tab="Watch"]');await page.waitForSelector('[data-gcf-canvas]');
    assert.equal(await activeTab(page),'Watch','Game Cast links to the 3D replay');
    // The Game Lab result card offers the replay too.
    await page.click('#gameDialog button:has-text("Close"), #closeGame').catch(()=>page.evaluate(()=>document.querySelector('#gameDialog').close()));
    await page.evaluate(()=>{const d=document.querySelector('#gameDialog');if(d.open)d.close()});
    await goTab(page,'gamelab');
    const replayButtons=await page.locator(`[data-game="${game.id}"][data-game-tab="Watch"]`).count();
    assert.ok(replayButtons>0,'Game Lab shows a Watch Replay button for the game');
    assert.deepEqual(errors,[],`browser errors: ${errors.join('\n')}`);
    console.log(`PASS Game Cast 3D replay at 390px: Watch opens it, play/pause, play stepping, drive picker and keys, key plays in ${took}ms, tab-switch pause, rollback leaves no play log`);
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
