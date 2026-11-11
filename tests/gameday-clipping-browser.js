'use strict';

// v0.17.2: the postgame Game Day panel was 1938px of content inside an 1154px box with overflow hidden, so the home
// team and its score were simply not on screen. Nothing on Game Day may hide content that way, before or after a game.
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
const {startLiveGame}=require('./helpers/start-live-game');

const clipped=page=>page.evaluate(()=>[...document.querySelectorAll('#gamelab *')]
 .filter(el=>el.offsetParent&&el.scrollWidth>el.clientWidth+8&&!['auto','scroll','visible'].includes(getComputedStyle(el).overflowX))
 .map(el=>`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} ${el.scrollWidth}/${el.clientWidth}`));

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1440,1280,390]){
   const page=await browser.newPage({viewport:{width,height:width<500?844:900}}),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   await page.goto(testPageURL());
   await startNewDynasty(page);
   assert.match(await page.locator('#weekLine').innerText(),/Week 1$/,'the header names the week being prepared');
   await page.evaluate(()=>window.__DL_TEST__.goToTab('gamelab'));
   assert.deepEqual(await clipped(page),[],`pregame Game Day hides content at ${width}px`);
   assert.equal(await page.locator('#gamelab').evaluate(node=>/Drive detail unavailable/.test(node.textContent)),false,'no apology for a game that was never coached');
   await startLiveGame(page);
   await page.click('[data-v2-gameday-delegate]');
   await page.waitForFunction(()=>window.__DL_TEST__.preseasonDebug().played>0,null,{timeout:60000});
   await page.locator('#v2GameDayRecap .v2-release-score').waitFor({state:'visible'});
   assert.deepEqual(await clipped(page),[],`postgame Game Day hides content at ${width}px`);
   const home=page.locator('#v2GameDayRecap .v2-release-team.home b'),box=await home.boundingBox();
   assert.ok(box&&box.x>=0&&box.x+box.width<=width,`the home score is on screen at ${width}px`);
   assert.equal(await page.locator('#detailedBox').evaluate(node=>node.closest('.card').hidden),true,'one final per screen: the Quick Box steps aside for the recap');
   if(await page.locator('.v2-release-scoring-row').count())assert.ok(await page.locator('.v2-release-scoring-row small').count()>0,'scoring flow names the scoring play');
   assert.deepEqual(errors,[]);
   await page.close();
  }
  console.log('Game Day clipping browser test passed');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
