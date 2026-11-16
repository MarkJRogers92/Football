'use strict';
// How long does a long dynasty take to import on a phone? (v0.37)
//
//   PHONE_SAVE=/path/save.json node tools/phone-import-measure.js   (a packed save, e.g. from SAVE_OUT=... tools/facilities-soak.js)
//
// Opens the built index.html at phone width (390 x 844) with Chromium's CPU throttled 4x (DevTools' "mid-tier mobile"
// preset), imports the save through the app's own file input, writes it to the IndexedDB slot and loads it back.
// Prints seconds for each step and the JS heap after loading. Also runs unthrottled at desktop width for comparison.
// CPU throttling approximates a phone's processor; it does not model a phone's memory limits or storage speed.
const path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright-core'),{chromiumPath}=require('../tests/helpers/chromium-path'),{startNewDynasty}=require('../tests/helpers/start-new-dynasty'),{clickShellUtility}=require('../tests/helpers/client-shell');
const SAVE=process.env.PHONE_SAVE,RATE=Number(process.env.CPU_RATE||4);
if(!SAVE||!fs.existsSync(SAVE)){console.log('Set PHONE_SAVE to a packed save file.');process.exit(1)}
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox','--js-flags=--max-old-space-size=6144']});
 const report={file:path.basename(SAVE),megabytes:+(fs.statSync(SAVE).size/1048576).toFixed(1),cpuRate:RATE};
 try{
  for(const [label,width,height,rate] of [['desktop',1280,900,1],['phone',390,844,RATE]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
   const status=(pattern,timeout=900000)=>page.waitForFunction(source=>new RegExp(source).test(document.querySelector('#saveStatus')?.textContent||''),pattern,{timeout,polling:250});
   await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
   const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate});
   const t={};let t0=Date.now();
   await page.locator('#importFile').setInputFiles(SAVE);await status('^Imported');t.import=+((Date.now()-t0)/1000).toFixed(1);
   t0=Date.now();await clickShellUtility(page,'#saveBrowser');await status('^Saved');t.save=+((Date.now()-t0)/1000).toFixed(1);
   t0=Date.now();await clickShellUtility(page,'#loadBrowser');await status('^Loaded');t.load=+((Date.now()-t0)/1000).toFixed(1);
   t.heapMB=await page.evaluate(()=>Math.round((performance.memory?.usedJSHeapSize||0)/1048576));
   t.errors=errors.length;report[label]=t;await page.close();
  }
  console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
