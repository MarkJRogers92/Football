const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
const goTab=async(page,id)=>{await page.click(`.tab-groups button[data-group="${TAB_GROUP[id]}"]`);await page.click(`.tabs button[data-tab="${id}"]`)};
async function startNewDynasty(page){
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.waitForSelector('#titleNew',{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
  await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');
  await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1280,height:900}});page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
    await startNewDynasty(page);await goTab(page,'gamelab');
    assert.equal(await page.locator('#v2RecordGate').count(),0,'obsolete development record gate should be removed after cutover');
    const rollback=await page.evaluate(()=>window.__DL_TEST__.v2RollbackProbe('afterArchive'));
    assert.equal(rollback.ok,true,`rollback protection regressed: ${rollback.message}`);
    const before=await page.evaluate(()=>({record:window.DynastyGameEngineV2LabBridge.debug(),cutover:window.DynastyGameEngineV2LabBridge.cutoverDebug()}));
    await page.click('#simDetailedGame');
    await page.waitForFunction(()=>window.DynastyGameEngineV2LabBridge.debug().lastArchive?.engine==='v2',{timeout:30000});
    const after=await page.evaluate(()=>({record:window.DynastyGameEngineV2LabBridge.debug(),cutover:window.DynastyGameEngineV2LabBridge.cutoverDebug()}));
    assert.equal(after.record.archiveLength,before.record.archiveLength+1,'normal Detailed Game should add exactly one archive record');
    assert.equal(after.record.team.w+after.record.team.l,before.record.team.w+before.record.team.l+1,'normal Detailed Game should advance the controlled team record exactly once');
    assert.equal(after.record.game.played,true,'normal Detailed Game should settle the scheduled game');
    assert.equal(after.record.lastArchive.engine,'v2','normal Detailed Game should persist Game Engine 2 identity');
    assert.equal(after.record.lastArchive.transactionVersion,1,'normal Detailed Game should persist transaction version');
    assert.ok(after.record.lastArchive.playerLines>0,'normal Detailed Game should persist real-player stat lines');
    assert.ok(after.record.lastArchive.drives>0,'normal Detailed Game should persist drives');
    assert.equal(after.cutover.v2UserArchives,before.cutover.v2UserArchives+1,'normal Detailed Game should add one controlled-program v2 archive');
    assert.equal(after.record.lastDetailed.engine,'v2','normal Detailed Game should identify v2 for Watch/Game Center flow');
    await goTab(page,'season');const link=page.locator(`#teamSchedule [data-game="${after.record.lastArchive.id}"]`).first();assert.equal(await link.count()>0,true,'normal Detailed Game result should reopen from schedule');await link.click();
    await page.waitForSelector('#gameDialog[open]',{timeout:10000});await page.locator('#gameTabs button').filter({hasText:/^Play-by-Play$/}).click();assert.ok(await page.locator('#gameDialogBody .playline').count()>10,'cutover archive should retain durable play-by-play');
    await page.close();

    const quick=await browser.newPage({viewport:{width:1280,height:900}});quick.on('console',m=>{if(m.type()==='error')errors.push(m.text())});quick.on('pageerror',e=>errors.push(String(e)));
    await startNewDynasty(quick);const quickBefore=await quick.evaluate(()=>window.DynastyGameEngineV2LabBridge.cutoverDebug());
    await quick.click('#simSeason');await quick.waitForFunction(()=>window.DynastyGameEngineV2LabBridge.cutoverDebug().phase!=='regular',{timeout:60000});
    const quickAfter=await quick.evaluate(()=>window.DynastyGameEngineV2LabBridge.cutoverDebug());
    assert.equal(quickAfter.userRecord-quickBefore.userRecord,12,'Sim Regular Season should still process twelve user games');
    assert.equal(quickAfter.v2UserArchives-quickBefore.v2UserArchives,0,'quick/season simulation should remain on the legacy engine');
    assert.equal(quickAfter.phase,'confReady','legacy regular-season sim should reach conference championship gate');
    await quick.close();
    assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.2 normal Detailed Game cutover to v2 + legacy quick simulation isolation');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
