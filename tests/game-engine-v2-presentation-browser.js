const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
  await page.click('.tab-groups button[data-group="games"]');await page.click('.tabs button[data-tab="gamelab"]');
  assert.equal(await page.locator('#v2ShadowLab').count(),0,'release Game Lab must hide the shadow preview');assert.equal(await page.locator('#v2RecordGate').count(),0,'release Game Lab must hide the dev record gate');
  await page.click('#simDetailedGame');await page.waitForSelector('#v2GameDayRecap:not([hidden])',{timeout:60000});
  const recap=page.locator('#v2GameDayRecap');assert.match(await recap.textContent(),/GAME DAY/);assert.match(await recap.textContent(),/FINAL/);assert.ok(await recap.locator('.v2-release-drive').count()>5,'recap should expose the variable drive chart');assert.ok(await recap.locator('.v2-release-leader').count()>=6,'recap should show real-player leaders');assert.ok(await recap.locator('.v2-release-scoring-row').count()>0,'recap should show scoring flow');
  const plays=page.locator('#detailedLog .playline');assert.ok(await plays.count()>10,'Game Lab should show durable play-by-play');const text=(await plays.allTextContents()).join('\n');assert.match(text,/(Q[1-4] \d+:\d{2}|OT\d+)/,'play-by-play should retain quarter/clock context');assert.match(text,/(1st|2nd|3rd|4th) & \d+ at (own|opp|50)/,'play-by-play should retain down and field-position context');
  const body=await page.locator('#gamelab').textContent();assert.doesNotMatch(body,/DEVELOPMENT PREVIEW|Shadow only|Run Shadow Preview|Record with V2 \(Dev\)/,'development plumbing must not be user-visible');assert.deepEqual(errors,[],`presentation emitted browser errors: ${errors.join('\n')}`);console.log('PASS v0.10 release Game Day presentation + durable clock/down/field archive');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
