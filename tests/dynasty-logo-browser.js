'use strict';

// Catches missing/failed brand assets, clipped small-screen branding, and branding
// changes that accidentally break setup cancellation or mobile navigation.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {testPageURL}=require('./helpers/browser-url');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 const screenshots=process.env.DYNASTY_LOGO_SCREENSHOTS;
 if(screenshots)fs.mkdirSync(screenshots,{recursive:true});
 try{
  for(const [name,viewport] of [['desktop',{width:1440,height:900}],['phone',{width:390,height:844}],['small-phone',{width:320,height:740}]]){
   const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
   const checkLogo=async(selector)=>{
    assert.equal(await page.locator(selector).count(),1,`${name}: one logo at ${selector}`);
    await page.locator(selector).waitFor({state:'visible'});
    const image=await page.$eval(selector,async img=>{
     await img.decode();
     const box=img.getBoundingClientRect();
     return {loaded:img.naturalWidth>0,alt:img.alt,width:box.width,left:box.left,right:box.right};
    });
    assert.ok(image.loaded,`${name}: image loads at ${selector}`);
    assert.equal(image.alt,'Dynasty Lab',`${name}: accessible brand name`);
    assert.ok(image.width>50&&image.left>=0&&image.right<=viewport.width+1,`${name}: logo fits screen`);
   };
   const capture=async(label)=>{if(screenshots)await page.screenshot({path:path.join(screenshots,`${name}-${label}.png`),fullPage:true})};
   await page.goto(testPageURL());
   await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length===120,null,{timeout:60000});
   await checkLogo('#titleGameName img');
   assert.equal(await page.locator('#titleGameName').getAttribute('aria-label'),'Dynasty Lab');
   await capture('title');
   await page.click('#titleAbout');
   await checkLogo('.title-about-logo');
   await capture('about');
   await page.click('[data-title-about-back]');
   await page.click('#titleNew');
   await checkLogo('.setup-brand-logo');
   const layout=await page.evaluate(()=>{
    const logo=document.querySelector('.setup-brand-logo').getBoundingClientRect();
    const progress=document.querySelector('.setup-progress').getBoundingClientRect();
    const exit=document.querySelector('#setupExit').getBoundingClientRect();
    return {logoRight:logo.right,logoBottom:logo.bottom,progressTop:progress.top,exitLeft:exit.left};
   });
   assert.ok(layout.logoRight<=layout.exitLeft,`${name}: branding does not overlap Exit Setup`);
   if(viewport.width<=700)assert.ok(layout.logoBottom<=layout.progressTop,`${name}: progress has its own phone row`);
   await capture('setup');
   await page.click('#setupExit');
   assert.ok(await page.locator('#titleMainMenu').isVisible(),`${name}: setup returns to title`);
   await checkLogo('#titleGameName img');
   await startNewDynasty(page,{beginSeason:false});
   if(viewport.width<=860)await page.click('.client-nav-toggle');
   await checkLogo('.client-rail-logo');
   await capture('navigation');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}: no horizontal overflow`);
   assert.deepEqual(errors,[],`${name}: no console or page errors`);
   await page.close();
   console.log(`PASS ${name}: logo loads in title, About, setup and navigation; re-entry works`);
  }
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
