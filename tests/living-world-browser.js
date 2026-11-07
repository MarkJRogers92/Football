const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const width of [1280,390]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  await page.waitForSelector('#weeklyWorldBriefing .lw-cast');
  const before=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
  assert.ok(await page.locator('.lw-brief > li').count()<=3);
  const advance=await page.locator('#hubAdvance').boundingBox();assert.ok(advance&&advance.y+advance.height<=900);
  await page.locator('.lw-cast > summary').click();
  const follow=page.locator('#weeklyWorldBriefing [data-lw-follow]').first(),key=await follow.getAttribute('data-lw-follow');
  await follow.click();
  await page.waitForFunction(k=>document.querySelector(`[data-lw-follow="${k}"]`)?.getAttribute('aria-pressed')==='true',key);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.lwFollow),key,'follow retains keyboard focus');
  assert.ok(await page.evaluate(()=>!!JSON.parse(localStorage.getItem('dynastyLabFollowing')).worlds));
  await page.locator(`#weeklyWorldBriefing [data-lw-open="${key}"]`).click();
  await page.waitForSelector('#playerDialog[open],#coachDialog[open]');
  await page.waitForSelector('.lw-profile-follow [aria-pressed="true"]');
  if(key.startsWith('player:'))assert.equal(await page.locator('#playerDialog').getAttribute('data-player-identity'),key.slice(7),'profile enhancement belongs to the opened player');
  await page.locator('.lw-profile-follow [aria-pressed="true"]').click();
  await page.waitForSelector('.lw-profile-follow [aria-pressed="false"]');
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset.lwFollow),key,'profile follow retains keyboard focus');
  await page.evaluate(()=>{document.querySelector('#playerDialog[open],#coachDialog[open]')?.close()});
  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),before,'following never advances time or RNG');
  assert.equal(await page.locator('#weeklyDeskDetails').getAttribute('open'),null,'detailed coverage starts optional');
  await page.locator('#weeklyDeskDetails > summary').click();
  if(await page.locator('#rivalWatch').count())assert.equal(await page.locator('#rivalWatch').isVisible(),true);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow');
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
 console.log('PASS living world: compact briefing, optional coverage, follow controls, canonical profiles, focus, read-only state');
})().catch(e=>{console.error(e);process.exit(1)});
