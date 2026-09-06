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
async function openArchivedPlayByPlay(page,id,label){
  const link=page.locator(`#teamSchedule [data-game="${id}"]`).first();
  assert.equal(await link.count()>0,true,`${label} v2 game should remain linked from the season schedule`);
  await link.click();await page.waitForSelector('#gameDialog[open]',{timeout:10000});
  await page.locator('#gameTabs button').filter({hasText:/^Play-by-Play$/}).click();
  assert.ok(await page.locator('#gameDialogBody .playline').count()>10,`${label} v2 archive should retain durable play-by-play`);
  await page.evaluate(()=>document.querySelector('#gameDialog')?.close());
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
    const soak=await page.evaluate(()=>window.__DL_TEST__.v2DetailedSeasonSoakProbe());
    console.log('V2 FULL-SEASON SOAK',JSON.stringify(soak));
    assert.equal(soak.ok,true,`full-season Detailed Game v2 soak failed: ${JSON.stringify(soak)}`);
    assert.equal(soak.weeks,12,'all twelve regular-season user games should use the normal Detailed Game v2 handler');
    assert.equal(soak.recordDelta,12,'controlled team record should advance exactly twelve games');
    assert.equal(soak.v2Delta,12,'exactly twelve permanent controlled-program v2 archives should be added');
    assert.equal(new Set(soak.ids).size,12,'all twelve v2 games should have unique archive ids');
    assert.equal(soak.phase,'confReady','season should reach the conference championship gate after twelve games');
    assert.equal(soak.driveCounts.length,12,'drive-count evidence should exist for every v2 game');
    assert.ok(soak.driveCounts.every(n=>Number.isInteger(n)&&n>0),'every v2 game should contain recorded drives');
    assert.ok(soak.uniqueDriveCounts>1,`drive count must vary across the season; observed ${JSON.stringify(soak.driveCounts)}`);
    await goTab(page,'season');
    await openArchivedPlayByPlay(page,soak.ids[0],'first-week');
    await openArchivedPlayByPlay(page,soak.ids.at(-1),'twelfth-week');
    const audit=await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.cutoverDebug());
    assert.equal(audit.v2UserArchives,12,'cutover debug should report twelve controlled-program v2 archives');
    assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
    console.log(`PASS v0.10.2 full regular-season Detailed Game v2 soak; drive counts=${soak.driveCounts.join(',')}; unique=${soak.uniqueDriveCounts}`);
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
