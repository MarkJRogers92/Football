const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
async function startNewDynasty(page){await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  try{
    await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);await page.waitForSelector('#v0102PlayerStories',{state:'visible',timeout:15000});
    let debug=await page.evaluate(()=>window.__DL_TEST__.weeklyPlayerStoriesDebug());assert.ok(debug.length>=3&&debug.length<=5,'dashboard should surface a bounded set of real player stories');assert.equal(new Set(debug.map(x=>String(x.playerId))).size,debug.length);
    const text=await page.locator('#v0102PlayerStories').textContent();assert.match(text,/PLAYERS TO WATCH/i);assert.match(text,/This week’s player stories/i);
    const fixture=await page.evaluate(()=>window.__DL_TEST__.weeklyPlayerStoriesForceFixture());assert.ok(fixture?.id);debug=await page.evaluate(()=>window.__DL_TEST__.weeklyPlayerStoriesDebug());const row=debug.find(x=>String(x.playerId)===String(fixture.id));assert.ok(row);assert.equal(row.type,'injury','forced injury should become the player’s highest-priority story');assert.equal(debug.filter(x=>String(x.playerId)===String(fixture.id)).length,1,'the same player must not occupy multiple story cards');
    const button=page.locator(`#v0102PlayerStories [data-player="${fixture.id}"]`).first();assert.ok(await button.count()>0,'story card should link to the real player profile');await button.click();await page.waitForSelector('#playerDialog[open]',{timeout:10000});await page.evaluate(()=>document.querySelector('#playerDialog')?.close());
    assert.deepEqual(errors,[],`Player Story browser emitted errors: ${errors.join('\n')}`);console.log(`PASS v0.10.2 Player Story dashboard: bounded factual cards, priority dedupe and real player link for ${fixture.name}`)
  }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
