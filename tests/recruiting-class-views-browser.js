'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const width of [1280,390]){
  const output=process.env.DYNASTY_CLASS_SCREENSHOT_DIR;if(output)require('node:fs').mkdirSync(output,{recursive:true});
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  await page.evaluate(()=>document.querySelector('.tabs [data-tab="recruiting"]').click());await page.waitForSelector('.recruit-workspace-card');
  assert.equal(await page.locator('[data-recruit-class="current"]').count(),1,'current and rising classes have peer navigation');
  assert.match(await page.locator('[data-recruit-class="current"]').innerText(),/2027/);assert.match(await page.locator('[data-recruit-class="rising"]').innerText(),/2028/);
  assert.equal(await page.locator('#risingClass').isVisible(),false);
  await page.evaluate(()=>window.DynastyLabRecruitingFilters.setState({pos:'QB'}));
  await page.waitForFunction(()=>document.querySelector('.recruit-workspace-card .rw-main small')?.textContent.startsWith('QB'));
  const selected=await page.locator('.recruit-workspace-card.active').getAttribute('data-rwid'),before=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug());
  await page.click('[data-recruit-class="rising"]');assert.equal(await page.locator('#risingClass').isVisible(),true);assert.equal(await page.locator('#recruitWorkspace').isVisible(),false);
  await page.click('[data-recruit-class="current"]');
  assert.equal(await page.locator('[data-recruit-filter="pos"]').inputValue(),'QB');assert.equal(await page.locator('.recruit-workspace-card.active').getAttribute('data-rwid'),selected);
  assert.deepEqual(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug()),before,'class navigation does not advance time or RNG');
  await page.click('[data-recruit-class="rising"]');await page.selectOption('[data-rising-pos]','WR');
  const watched=await page.locator('[data-rising-watch]').first().getAttribute('data-rising-watch');await page.locator('[data-rising-watch]').first().click();
  await page.waitForSelector('.rising-row.is-watched');const startHours=Number((await page.locator('.rising-hours').innerText()).match(/^\d+/)[0]);
  await page.locator('.rising-extra [data-scout-action="quick"]').first().click();await page.waitForFunction(()=>/Film reviewed/.test(document.querySelector('.rising-verdict').textContent));
  assert.equal(Number((await page.locator('.rising-hours').innerText()).match(/^\d+/)[0]),startHours-1,'rising scouts spend the shared budget once');
  await page.check('[data-rising-only]');
  if(output){await page.waitForFunction(()=>!document.querySelector('.hud-toast'));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`rising-${width}.png`)})}
  await page.click('[data-recruit-class="outlook"]');await page.waitForFunction(()=>document.querySelector('[data-outlook-pos="WR"] [data-outlook-watched]')?.textContent==='1');
  assert.equal(await page.locator('[data-outlook-pos="WR"] [data-outlook-watched]').innerText(),'1');
  if(output){await page.waitForFunction(()=>!document.querySelector('.hud-toast'));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`outlook-${width}.png`)})}
  await page.click('[data-recruit-class="rising"]');assert.equal(await page.locator('[data-rising-pos]').inputValue(),'WR');assert.equal(await page.locator('[data-rising-only]').isChecked(),true);assert.equal(await page.locator('[data-rising-watch]').first().getAttribute('data-rising-watch'),watched);
  await page.click('[data-recruit-class="outlook"]');await page.click('[data-need-current="QB"]');
  await page.waitForSelector('.recruit-workspace-card');assert.equal(await page.locator('[data-recruit-filter="pos"]').inputValue(),'QB');assert.equal(await page.locator('.recruit-workspace-list').isVisible(),true);
  await page.click('[data-recruit-class="outlook"]');await page.click('[data-need-rising="QB"]');
  assert.equal(await page.locator('[data-rising-pos]').inputValue(),'QB');assert.equal(await page.locator('[data-rising-only]').isChecked(),false);
  const boardItem=await page.evaluate(()=>window.getDynastyGuidance().items.find(x=>x.destination?.focus==='recruiting-board')?.id);
  assert.ok(boardItem,'empty current board should have recruiting guidance');
  await page.evaluate(id=>window.openGuidanceItem(id),boardItem);await page.waitForSelector('.guidance-return-context');
  assert.equal(await page.locator('#recruitWorkspace').isVisible(),true,'current-board guidance reveals the correct class view');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
 console.log('PASS class views, preserved filters/selection, watch/scout budget, outlook and position shortcuts at desktop/phone sizes');
})().catch(e=>{console.error(e);process.exit(1)});
