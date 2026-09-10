const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains("active"))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
const {startNewDynasty:sharedStartNewDynasty}=require('./helpers/start-new-dynasty');
const startNewDynasty=page=>sharedStartNewDynasty(page);
async function resolveWeeklyDecisions(page){
  await goTab(page,'dashboard');
  for(let guard=0;guard<6;guard++){
    const blocked=await page.evaluate(()=>{
      const sim=document.querySelector('#simWeek');
      return !!sim?.disabled;
    });
    if(!blocked)return true;
    const resolved=await page.evaluate(()=>{
      const button=[...document.querySelectorAll('[data-decision][data-choice]')]
        .find(el=>!el.disabled&&el.offsetParent!==null);
      if(!button)return false;
      button.click();
      return true;
    });
    if(!resolved)break;
    await page.waitForTimeout(80);
  }
  return page.evaluate(()=>!document.querySelector('#simWeek')?.disabled);
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
    assert.equal(await resolveWeeklyDecisions(page),true,'weekly Coach’s Desk decisions should clear through their canonical UI before recording');
    await goTab(page,'gamelab');
    assert.equal(await page.locator('#v2RecordGate').count(),0,'temporary development record button should be absent after Detailed Game cutover');
    assert.equal(await page.locator('[data-v2-shadow-run]').count(),0,'release UI should not expose the retired shadow-preview control');
    const rollback=await page.evaluate(()=>window.__DL_TEST__.v2RollbackProbe('afterArchive'));
    assert.equal(rollback.ok,true,`rollback probe failed: ${rollback.message}\n${JSON.stringify({before:rollback.before,after:rollback.after})}`);
    assert.equal(await resolveWeeklyDecisions(page),true,'rollback probe should not leave a weekly decision gate unresolved');
    await goTab(page,'gamelab');
    const before=await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.debug());
    await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.recordCurrent());
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
    await goTab(page,'gamelab');
    assert.equal((await page.locator('#clientRail [data-client-tab="gamelab"]').innerText()).trim(),'Game Lab','season navigation should name the workspace it actually opens');
    const heroBox=page.locator(`#gamedayEventHero [data-game="${after.lastArchive.id}"][data-game-tab="Box Score"]`);await heroBox.waitFor({state:'visible'});
    assert.equal((await heroBox.innerText()).trim(),'View Box Score','postgame hero should promote the box score');
    const order=await page.evaluate(()=>{const hero=document.querySelector('#gamedayEventHero'),quick=document.querySelector('#detailedBox')?.closest('.two-col'),receipt=document.querySelector('#v2PlanReceipt');return{heroBeforeQuick:!!(hero.compareDocumentPosition(quick)&Node.DOCUMENT_POSITION_FOLLOWING),quickBeforeReceipt:!!(quick.compareDocumentPosition(receipt)&Node.DOCUMENT_POSITION_FOLLOWING)}});
    assert.deepEqual(order,{heroBeforeQuick:true,quickBeforeReceipt:true},'Quick Box should sit directly after the postgame hero and ahead of postgame analysis');
    await heroBox.click();await page.waitForSelector('#gameDialog[open]',{timeout:10000});
    assert.equal(await page.locator('#gameTabs [data-game-tab="Box Score"]').getAttribute('aria-pressed'),'true','View Box Score should open the Box Score tab directly');
    assert.equal(await page.locator('[data-game-box-team]').count(),1,'box score should provide a player-team filter');
    assert.equal(await page.locator('[data-game-box-category]').count(),1,'box score should provide a category filter');
    const rushingYards=await page.locator('[data-game-stat-team="away"] [data-game-stat-category="rushing"] tbody td:nth-child(4)').allTextContents();
    assert.deepEqual(rushingYards.map(Number),rushingYards.map(Number).slice().sort((a,b)=>b-a),'rushing rows should default to yardage-leader order');
    await page.locator('[data-game-box-team]').selectOption('home');await page.locator('[data-game-box-category]').selectOption('receiving');
    assert.equal(await page.locator('[data-game-stat-team="away"]').isHidden(),true,'team filter should hide the other team');
    assert.equal(await page.locator('[data-game-stat-team="home"] [data-game-stat-category]:visible').count(),1,'category filter should leave one player-stat group visible');
    const receiving=page.locator('[data-game-stat-team="home"] [data-game-stat-category="receiving"]'),yds=receiving.getByRole('button',{name:'Yds',exact:true});await yds.click();
    const ascending=(await receiving.locator('tbody td:nth-child(5)').allTextContents()).map(Number);assert.deepEqual(ascending,ascending.slice().sort((a,b)=>a-b),'clicking the active yardage header should reverse it to ascending order');
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();
    const fullCenter=page.locator(`#gamedayEventHero [data-game="${after.lastArchive.id}"][data-game-tab="Summary"]`);await fullCenter.click();await page.waitForSelector('#gameDialog[open]',{timeout:10000});
    assert.equal(await page.locator('#gameTabs [data-game-tab="Summary"]').getAttribute('aria-pressed'),'true','Full Game Center should retain the Summary entry point');
    await page.getByRole('button',{name:'Close Game Center',exact:true}).click();
    await goTab(page,'season');
    const link=page.locator(`#teamSchedule [data-game="${after.lastArchive.id}"]`).first();assert.equal(await link.count()>0,true,'recorded v2 game should be reopenable from schedule');await link.click();
    await page.waitForSelector('#gameDialog[open]',{timeout:10000});
    assert.match(await page.locator('#gameDialogMeta').innerText(),/FINAL/);
    await page.locator('#gameTabs button').filter({hasText:/^Box Score$/}).click();assert.ok((await page.locator('#gameDialogBody').innerText()).length>100,'v2 box score should render');
    await page.locator('#gameTabs button').filter({hasText:/^Play-by-Play$/}).click();const pbp=await page.locator('#gameDialogBody').innerText(),playlines=await page.locator('#gameDialogBody .playline').count();assert.ok(playlines>10&&/Archived generated play log/i.test(pbp),'v2 archived play-by-play should render durable generated lines');
    assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.2 recorded Game Engine 2 browser transaction + rollback API gate');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
