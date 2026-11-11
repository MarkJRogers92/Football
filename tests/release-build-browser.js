'use strict';

// v0.23: the published game is the same file the tests drive, so the test hooks must not exist for a real player.
// Playwright sets navigator.webdriver; this test turns it off, then plays the first week as a player would.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>Object.defineProperty(Navigator.prototype,'webdriver',{get:()=>false}));
  await page.goto(testPageURL());await page.waitForSelector('#titleNew');
  await page.click('#titleNew');await page.click('[data-setup-quick]');
  await page.waitForFunction(()=>/What You Inherited/.test(document.querySelector('#setupStatus')?.textContent||'')&&!document.querySelector('#setupContinue').disabled,null,{timeout:60000});
  await page.click('#setupContinue');
  await page.waitForFunction(()=>/Accept the Contract/.test(document.querySelector('#setupStatus')?.textContent||''));
  await page.click('#setupContinue');
  await page.locator('#app').waitFor({state:'visible',timeout:120000});
  assert.equal(await page.evaluate(()=>typeof window.__DL_TEST__),'undefined','no test hooks for a player');
  await page.click('#hubAdvance');
  await page.waitForFunction(()=>/Week 1$/.test(document.querySelector('#weekLine')?.textContent||''),null,{timeout:30000});
  for(let i=0;i<4;i++){const choice=page.locator('#weeklyDecisions [data-decision][data-choice]').first();if(await choice.count())await choice.click()}
  await page.click('#hubAdvance');
  await page.waitForFunction(()=>/Week 2$/.test(document.querySelector('#weekLine')?.textContent||''),null,{timeout:60000});
  assert.deepEqual(errors,[]);
  console.log('Release build browser test passed (no test hooks; a player can start a dynasty and play a week)');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
