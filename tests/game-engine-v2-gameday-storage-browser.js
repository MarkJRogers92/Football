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
const waitStatus=(page,pattern)=>page.waitForFunction(src=>new RegExp(src).test(document.querySelector('#saveStatus')?.textContent||''),pattern,{timeout:30000});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await goTab(page,'gamelab');
    await page.click('[data-v2-gameday-start]');await page.waitForSelector('.v2-gameday-scoreboard',{timeout:10000});
    await page.click('[data-v2-gameday-delegate]');await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayPreviewState()?.state?.status==='final',{timeout:60000});
    await page.click('[data-v2-gameday-record]');await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayLastArchiveDebug()?.gameDayVersion===2,{timeout:30000});
    const archive=await page.evaluate(()=>window.__DL_TEST__.v2GameDayLastArchiveDebug());assert.ok(archive.id);assert.ok(archive.coachingDecisions.length>0);assert.equal(archive.playByPlayHasCoachDecision,true);
    await page.click('#saveBrowser');await waitStatus(page,'^Saved');
    const stored=await page.evaluate(id=>new Promise((resolve,reject)=>{
      const req=indexedDB.open('DynastyLabDB');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction(['saves','games'],'readonly');let main,games=[];const a=tx.objectStore('saves').get('main');a.onsuccess=()=>{main=a.result};const b=tx.objectStore('games').getAll();b.onsuccess=()=>{games=b.result.flat()};tx.oncomplete=()=>{db.close();resolve({coreHasGames:'gameArchive' in main.universe,ref:main.gameRef,game:games.find(g=>g.id===id)||null})};tx.onabort=()=>{db.close();reject(tx.error)}};
    }),archive.id);
    assert.equal(stored.coreHasGames,false,'browser save should keep permanent games in the separate game store');assert.ok(stored.ref?.count>0);assert.ok(stored.game,'Interactive Game Day archive should be stored in IndexedDB game chunks');
    assert.equal(stored.game.engine,'v2');assert.equal(stored.game.gameDayVersion,2);assert.ok(stored.game.coachingDecisions?.length>0);assert.ok((stored.game.drives||[]).flatMap(d=>d.playByPlay||[]).some(line=>/coach|decision/i.test(String(line))));
    await page.click('#loadBrowser');await waitStatus(page,'^Loaded');await goTab(page,'season');
    const link=page.locator(`[data-game="${archive.id}"]:visible`).first();assert.ok(await link.count()>0,'saved Interactive Game Day should remain linked after browser Load');await link.click();await page.waitForSelector('#gameDialog[open]',{timeout:10000});
    await page.locator('#gameTabs button').filter({hasText:/^Play-by-Play$/}).click();assert.match(await page.locator('#gameDialogBody').textContent(),/coach/i,'loaded Game Center should retain coaching-decision play-by-play');
    assert.deepEqual(errors,[],`Game Day IndexedDB regression emitted errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.1 Interactive Game Day survives separate IndexedDB storage and browser Save/Load');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
