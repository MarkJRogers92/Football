const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains("active"))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
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
    assert.equal(await page.locator('#v2RecordGate').count(),0,'temporary development record gate should stay removed after Detailed Game cutover');
    const soak=await page.evaluate(()=>window.__DL_TEST__.v2RecordedSoakProbe(6));
    assert.equal(soak.ok,true,`six-week v2 soak failed: ${JSON.stringify(soak)}`);
    assert.equal(soak.weeks,6);assert.equal(soak.endWeek-soak.startWeek,6,'universe week should advance once per recorded v2 game');
    assert.equal(soak.recordDelta,6,'controlled team record should advance six games');assert.equal(soak.v2Delta,6,'six permanent user v2 archives should be added');
    assert.equal(new Set(soak.ids).size,6,'every recorded v2 game should have a unique archive id');assert.equal(soak.durable,true,'all six v2 archives should retain player and play-by-play detail');
    assert.equal(soak.lastDetailed.engine,'v2','the latest detailed game should remain the most recent v2 result');
    const lastId=soak.ids.at(-1);await goTab(page,'season');const link=page.locator(`#teamSchedule [data-game="${lastId}"]`).first();assert.equal(await link.count()>0,true,'last soak game should remain linked from the season schedule');await link.click();
    await page.waitForSelector('#gameDialog[open]',{timeout:10000});await page.locator('#gameTabs button').filter({hasText:/^Play-by-Play$/}).click();
    assert.ok(await page.locator('#gameDialogBody .playline').count()>10,'multiweek v2 archive should retain durable play-by-play after later weeks');
    assert.deepEqual(errors,[],`browser emitted errors: ${errors.join('\n')}`);
    console.log('PASS v0.10.2 six-week recorded Game Engine 2 soak after Detailed Game cutover');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
