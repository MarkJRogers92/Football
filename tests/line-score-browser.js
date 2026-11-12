'use strict';
// v0.26: Game Engine 2 games record the period of every scoring drive, so the recap shows a real score by quarter.
// The line score must add up to the final score and match the scoring summary.
const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const page=await browser.newPage({viewport:{width,height:width<500?844:900}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
   const ready=await page.evaluate(()=>window.__DL_TEST__.v2PrepareDetailedGame());assert.equal(ready.ready,true,JSON.stringify(ready));
   await page.evaluate(()=>document.querySelector('.tabs button[data-tab="gamelab"]')?.click());
   await page.click('#simDetailedGame');await page.waitForSelector('#v2GameDayRecap:not([hidden])',{timeout:60000});
   const recap=page.locator('#v2GameDayRecap'),table=recap.locator('table.line-score');
   assert.equal(await table.count(),1,'the recap shows a line score');
   const data=await page.evaluate(()=>{
    const t=document.querySelector('#v2GameDayRecap table.line-score'),rows=[...t.querySelectorAll('tbody tr')].map(r=>[...r.querySelectorAll('td')].map(td=>Number(td.textContent)));
    const finals=[...document.querySelectorAll('#v2GameDayRecap .v2-release-team b')].map(b=>Number(b.textContent));
    const labels=[...document.querySelectorAll('#v2GameDayRecap .v2-release-scoring-row span')].map(s=>s.textContent);
    return{rows,finals,labels,cols:t.querySelectorAll('thead th').length};
   });
   assert.ok(data.cols>=6,'team, four quarters and a total');
   data.rows.forEach((r,i)=>{const total=r.at(-1),sum=r.slice(0,-1).reduce((n,v)=>n+v,0);assert.equal(sum,total,'quarters add up to the total');assert.equal(total,data.finals[i],'total matches the final score')});
   assert.ok(data.labels.length>0&&data.labels.every(l=>/^(Q[1-4]|\d?OT)$/.test(l)),`each scoring row names its quarter: ${data.labels.join(',')}`);
   assert.deepEqual(errors,[]);await page.close();
  }
  console.log('Line score browser test passed');
 }finally{await browser.close()}
})().catch(err=>{console.error(err);process.exit(1)});
