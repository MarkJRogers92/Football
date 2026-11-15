'use strict';
// The Season in Review offers a season card: one PNG of the year, saved to the device. Desktop and phone.
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{loadEngine}=require('../tools/harness');
(async()=>{
 const e=loadEngine({seed:6464});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;e.simSeason();e.simConferenceChampionships();e.simBowls();e.simPlayoff();
 u.offseason=e.makeOffseasonState(u.year,'review');
 const save=JSON.parse(JSON.stringify({userTeam:'Chicago Metropolitan',universe:e.packUniverse(u)}));
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),anchor=html.lastIndexOf('loadSchools().then(');
 const patched=html.slice(0,anchor)+'window.__CARD_QA__={installSave,render};'+html.slice(anchor);
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const [label,viewport] of [['desktop',{width:1280,height:1000}],['phone',{width:390,height:844}]]){
   const page=await browser.newPage({viewport,acceptDownloads:true}),errors=[];
   page.on('pageerror',x=>errors.push(String(x)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.route('**/index.html',route=>route.fulfill({contentType:'text/html',body:patched}));
   await page.goto('file://'+path.join(__dirname,'..','index.html'));
   await page.waitForFunction(()=>window.__CARD_QA__&&document.querySelector('#titleTeam')?.options.length>0);
   await page.evaluate(save=>{window.__CARD_QA__.installSave(save);document.querySelector('#titleScreen').hidden=true;document.querySelector('#app').hidden=false;document.querySelector('.tabs button[data-tab="dashboard"]').click()},save);
   await page.locator('#seasonReview [data-season-card]').waitFor({state:'visible',timeout:15000});
   const [download]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.click('#seasonReview [data-season-card]')]);
   assert.match(download.suggestedFilename(),/^dynasty-lab-chicago-metropolitan-\d{4}\.png$/,`[${label}] a named PNG`);
   const file=await download.path(),bytes=fs.readFileSync(file);
   assert.deepEqual([...bytes.subarray(0,8)],[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a],`[${label}] it is a PNG`);
   assert.equal(bytes.readUInt32BE(16),1200);assert.equal(bytes.readUInt32BE(20),630);
   assert.ok(bytes.length>20000,`[${label}] something was drawn (${bytes.length} bytes)`);
   assert.match(await page.locator('#saveStatus').textContent(),/Season card saved/);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`[${label}] no horizontal overflow`);
   if(process.env.CARD_SHOT)fs.copyFileSync(file,path.join(process.env.CARD_SHOT,`season-card-${label}.png`));
   assert.deepEqual(errors,[],`[${label}] no console errors`);
   await page.close();console.log(`season card ${label}: ok`);
  }
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
