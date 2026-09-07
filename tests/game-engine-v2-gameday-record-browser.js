const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
const goTab=async(page,id)=>{await page.click(`.tab-groups button[data-group="${TAB_GROUP[id]}"]`);await page.click(`.tabs button[data-tab="${id}"]`)};
async function startNewDynasty(page){
  await page.waitForSelector('#titleNew',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
  await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');
  await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await goTab(page,'gamelab');
    await page.waitForSelector('[data-v2-gameday-start]',{timeout:15000});
    const before=await page.evaluate(()=>window.__DL_TEST__.v2GameDayCommitDebug());
    await page.click('[data-v2-gameday-start]');await page.waitForSelector('.v2-gameday-scoreboard',{timeout:10000});
    await page.click('[data-v2-gameday-delegate]');await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayPreviewState()?.state?.status==='final',{timeout:60000});
    const staged=await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewState());assert.equal(staged.status,'final');assert.ok(staged.state.events.some(e=>e.type==='coaching_decision'),'staged game should contain coaching decisions');
    assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.v2GameDayCommitDebug()),before,'staged final must not alter permanent dynasty state');

    const injected=await page.evaluate(()=>{try{window.__DL_TEST__.v2GameDayCommitCurrent('afterArchive');return'NO_ERROR'}catch(err){return String(err.message||err)}});
    assert.match(injected,/Injected Interactive Game Day rollback fault after archive write/);
    assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.v2GameDayCommitDebug()),before,'injected archive fault must restore records, schedule, archive and latest game exactly');
    assert.equal((await page.evaluate(()=>window.__DL_TEST__.v2GameDayPreviewState()))?.status,'final','failed commit must leave the staged final available to retry');

    await page.click('[data-v2-gameday-record]');
    await page.waitForFunction(n=>window.__DL_TEST__.v2GameDayCommitDebug().archiveLength===n+1,before.archiveLength,{timeout:30000});
    const after=await page.evaluate(()=>window.__DL_TEST__.v2GameDayCommitDebug()),archive=await page.evaluate(()=>window.__DL_TEST__.v2GameDayLastArchiveDebug());
    assert.equal(after.userRecord,before.userRecord+1,'official Game Day result should advance the controlled team record once');
    assert.equal(after.archiveLength,before.archiveLength+1,'official Game Day result should create exactly one permanent archive');
    assert.equal(after.last.engine,'v2');assert.equal(after.last.gameDayVersion,2);
    assert.equal(archive.engine,'v2');assert.equal(archive.transactionVersion,1);assert.equal(archive.gameDayVersion,2);assert.equal(archive.coachingDecisionVersion,1);
    assert.ok(archive.coachingDecisions.length>0,'archive should retain compact coaching decision receipts');assert.ok(archive.drives>0);assert.ok(archive.playerLines>0);assert.ok(archive.playByPlayLines>10);assert.equal(archive.playByPlayHasCoachDecision,true,'archived play-by-play should retain coaching decisions');

    await goTab(page,'season');const link=page.locator(`[data-game="${archive.id}"]:visible`).first();assert.equal(await link.count()>0,true,'recorded Game Day should remain linked from the schedule');await link.click();
    await page.waitForSelector('#gameDialog[open]',{timeout:10000});await page.locator('#gameTabs button').filter({hasText:/^Play-by-Play$/}).click();
    const pbp=await page.locator('#gameDialogBody').textContent();assert.match(pbp,/coach/i,'Game Center play-by-play should visibly include the coaching decision');
    assert.deepEqual(errors,[],`Interactive Game Day commit browser emitted errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.1 Interactive Game Day permanent commit: injected archive rollback exact, official transaction durable, Game Day v2 coaching decisions archived');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
