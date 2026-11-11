'use strict';

// v0.21: an automated accessibility check (axe-core) on the title screen and all fifteen game screens, at desktop
// and phone width. It fails on anything axe rates serious or critical: unnamed controls, invalid ARIA, unreadable
// contrast, regions a keyboard cannot reach. It is not a substitute for a pass with a screen reader.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

const axeSource=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
const SCREENS=['dashboard','newsletter','program','roster','depth','development','staff','offseason','recruiting','gamelab','season','stats','history','records','legacy'];
const check=page=>page.evaluate(async()=>{
 const result=await window.axe.run(document,{resultTypes:['violations']});
 return result.violations.filter(v=>v.impact==='serious'||v.impact==='critical').map(v=>`${v.impact} ${v.id} x${v.nodes.length}: ${v.nodes[0].target.join(' ')}`);
});

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:900}});
   await page.goto(testPageURL());await page.waitForSelector('#titleNew');await page.evaluate(axeSource);
   assert.deepEqual(await check(page),[],`title screen at ${width}px`);
   await startNewDynasty(page);await page.evaluate(axeSource);
   for(const screen of SCREENS){
    await page.evaluate(id=>window.__DL_TEST__.goToTab(id),screen);await page.waitForTimeout(150);
    assert.deepEqual(await check(page),[],`${screen} at ${width}px`);
   }
   await page.close();
  }
  console.log(`Accessibility browser test passed (${SCREENS.length+1} screens at two widths, no serious or critical findings)`);
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
