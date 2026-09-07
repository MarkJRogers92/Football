const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',gamelab:'games'};
const goTab=async(page,id)=>{await page.click(`.tab-groups button[data-group="${TAB_GROUP[id]}"]`);await page.click(`.tabs button[data-tab="${id}"]`)};
async function startNewDynasty(page){
  await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
  await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await goTab(page,'gamelab');
    await page.waitForSelector('#v2MatchupIntelligence',{state:'visible',timeout:15000});const pre=await page.evaluate(()=>window.__DL_TEST__.v2MatchupSummary());assert.equal(pre.matchup.visible,true);
    for(const phrase of ['GAME DAY INTELLIGENCE','Where the game tilts','Opponent identity','Staff recommendation','Your key players','Players to know'])assert.match(pre.matchup.text,new RegExp(phrase,'i'));
    assert.match(pre.matchup.text,/% pass/i);assert.match(pre.matchup.text,/Active plan/i);
    await page.waitForSelector('[data-v2-gameday-start]',{timeout:10000});await page.click('[data-v2-gameday-start]');await page.click('[data-v2-gameday-delegate]');
    await page.waitForFunction(()=>window.__DL_TEST__.v2GameDayPreviewState()?.state?.status==='final',{timeout:60000});await page.click('[data-v2-gameday-record]');
    await page.waitForFunction(()=>/POSTGAME PLAN RECEIPT/i.test(window.__DL_TEST__.v2MatchupSummary()?.receipt||''),{timeout:30000});const post=await page.evaluate(()=>window.__DL_TEST__.v2MatchupSummary());
    assert.match(post.receipt,/POSTGAME PLAN RECEIPT/i);assert.match(post.receipt,/Standard week/i);assert.match(post.receipt,/Baseline/i);assert.match(post.receipt,/does not claim the plan alone caused/i);
    assert.deepEqual(errors,[],`matchup intelligence browser emitted errors: ${errors.join('\n')}`);console.log('PASS v0.10.1 matchup intelligence: pregame edges/tendency/availability/plan recommendation and archived postgame plan receipt');
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
