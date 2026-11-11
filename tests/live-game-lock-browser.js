// A coached game is locked in: it records at the final whistle, advancing the week finishes the
// same game instead of simulating a different one, and an unfinished live game survives a reload.
const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startLiveGame}=require('./helpers/start-live-game');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
const goTab=async(page,id,group)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group});
const saved=page=>page.waitForFunction(()=>window.DynastySessionStatus?.read().state==='saved',null,{timeout:60000});
const debug=page=>page.evaluate(()=>window.__DL_TEST__.v2GameDayCommitDebug());
const lastArchive=page=>page.evaluate(()=>window.__DL_TEST__.v2GameDayLastArchiveDebug());
const live=page=>page.evaluate(()=>{const s=window.__DL_TEST__.v2GameDayPreviewState();return s?{status:s.status,score:s.state.score,events:s.state.events.length}:null});
async function startLive(page){
  const ready=await page.evaluate(()=>window.__DL_TEST__.v2PrepareDetailedGame());assert.equal(ready.ready,true,JSON.stringify(ready));
  await goTab(page,'gamelab','season');await page.waitForSelector('[data-v2-gameday-start]',{timeout:15000});
  await startLiveGame(page);await page.waitForSelector('.v2-gameday-scoreboard',{timeout:10000});
  // v0.19: a drive or defensive call can be waiting; delegating it is a recorded action too.
  for(let i=0;i<6;i++){if(await page.locator('[data-v2-gameday-next]').count())await page.click('[data-v2-gameday-next]');else if(await page.locator('[data-v2-gameday-choice="delegate"]').count())await page.click('[data-v2-gameday-choice="delegate"]')}
}
(async()=>{
  const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);

    // 1. Playing to the final whistle records the game; there is nothing left to forget.
    let before=await debug(page);await startLive(page);
    await page.click('[data-v2-gameday-delegate]');
    await page.waitForFunction(n=>window.__DL_TEST__.v2GameDayCommitDebug().archiveLength===n+1,before.archiveLength,{timeout:60000});
    let rec=await lastArchive(page),after=await debug(page);
    assert.equal(rec.gameDayVersion,2,'the coached game itself is the recorded game');
    assert.equal(after.userRecord,before.userRecord+1,'the record moves once');
    assert.equal(await page.evaluate(()=>window.__DL_TEST__.v2GameDaySaved()),null,'nothing live is left in the save');
    await goTab(page,'dashboard','home');const week=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);
    await page.evaluate(()=>document.querySelector('#hubAdvance').click());
    await page.waitForFunction(w=>window.__DL_TEST__.preseasonDebug().week>w,week,{timeout:60000});
    assert.equal((await debug(page)).userRecord,after.userRecord,'advancing after a recorded game does not play it again');

    // 2. Advancing mid-game finishes that same game with the staff instead of simulating a new one.
    before=await debug(page);await startLive(page);
    const partial=await live(page);assert.ok(partial&&partial.status!=='final','the game is live');
    await page.evaluate(()=>window.__DL_TEST__.v2GameDayForget());
    await goTab(page,'dashboard','home');await page.evaluate(()=>document.querySelector('#hubAdvance').click());
    await page.waitForFunction(n=>window.__DL_TEST__.v2GameDayCommitDebug().archiveLength>n,before.archiveLength,{timeout:60000});
    const kept=(await debug(page)).last;
    assert.equal(kept?.gameDayVersion,2,'advancing recorded the live game (rebuilt from the save), not a fresh simulation');
    assert.equal((await debug(page)).userRecord,before.userRecord+1,'the live game counted once');

    // 3. An unfinished live game survives a cold reload with the same score and plays.
    await startLive(page);const mid=await live(page);await saved(page);
    assert.ok((await page.evaluate(()=>window.__DL_TEST__.v2GameDaySaved()))?.actions.length>0,'live actions are in the save');
    await page.reload();await page.waitForSelector('#titleContinue');await page.click('#titleContinue');
    await page.waitForFunction(()=>!document.querySelector('#app')?.hidden,null,{timeout:60000});
    await goTab(page,'gamelab','season');await page.waitForSelector('.v2-gameday-scoreboard',{timeout:15000});
    assert.deepEqual(await live(page),mid,'the reloaded live game is the same game at the same play');

    assert.deepEqual(errors,[],`browser errors: ${errors.join('\n')}`);
    console.log('PASS live game lock: records at the final whistle, advancing finishes the same game, unfinished games survive reload');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
