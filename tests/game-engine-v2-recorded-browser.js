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
    await page.waitForSelector('#v2RecordGate',{timeout:10000});
    assert.equal(await page.locator('[data-v2-record]').isEnabled(),true,'v2 record gate should be enabled for current scheduled game');
    const rollback=await page.evaluate(()=>window.__DL_TEST__.v2RollbackProbe('afterArchive'));
    assert.equal(rollback.ok,true,`rollback probe failed: ${rollback.message}\n${JSON.stringify({before:rollback.before,after:rollback.after})}`);
    await page.click('[data-v2-shadow-run]');
    await page.waitForFunction(()=>/Archive transaction dry run: PASS/.test(document.querySelector('#v2ShadowLab')?.textContent||''),{timeout:20000});
    const before=await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.debug());
    page.once('dialog',d=>d.accept());await page.click('[data-v2-record]');
    await page.waitForFunction(()=>window.DynastyGameEngineV2LabBridge.debug().lastArchive?.engine==='v2',{timeout:30000});
    const after=await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.debug());
    assert.equal(after.archiveLength,before.archiveLength+1,'one permanent archive record should be added');
    assert.equal(after.gameCounter,before.gameCounter+1,'game counter should advance once');
    assert.equal(after.team.w+after.team.l,before.team.w+before.team.l+1,'controlled team record should advance once');
    assert.equal(after.game.played,true,'scheduled game should be settled');
    assert.equal(after.game.gameId,after.lastArchive.id,'schedule should point to the v2 archive record');
    assert.equal(after.lastArchive.transactionVersion,1,'archive should carry v2 transaction version');
    assert.ok(after.lastArchive.playerLines>0,'archive should retain real-player stat deltas');
    assert.ok(after.lastArchive.drives>0,'archive should retain drive/play detail for Game Center');
    for(const side of ['home','away'])assert.equal(after.lastArchive.drivePoints[side]+after.lastArchive.scoreAdjustment[side],after.lastArchive.score[side],`${side} Watch Mode scoring should reconcile to the final`);
    assert.equal(after.lastDetailed.engine,'v2','last detailed game should identify v2');
    await goTab(page,'season');
    const link=page.locator(`#teamSchedule [data-game="${after.lastArchive.id}"]`).first();assert.equal(await link.count()>0,true,'recorded v2 game should be reopenable from schedule');await link.click();
    await page.waitForSelector('#gameDialog[open]',{timeout:10000});
    assert.match(await page.locator('#gameDialogMeta').innerText(),/FINAL/);
    await page.locator('#gameTabs button').filter({hasText:/^Box Score$/}).click();assert.ok((await page.locator('#gameDialogBody').innerText()).length>100,'v2 box score should render');
    await page.locator('#gameTabs button').filter({hasText:/^Play-by-Play$/}).click();const pbp=await page.locator('#gameDialogBody').innerText(),playlines=await page.locator('#gameDialogBody .playline').count();assert.ok(playlines>10&&/Archived generated play log/i.test(pbp),'v2 archived play-by-play should render durable generated lines');
    assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.1 recorded Game Engine 2 browser transaction + rollback gate');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
