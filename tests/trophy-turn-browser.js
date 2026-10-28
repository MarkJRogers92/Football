const assert=require('assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

// v0.12.25: the title trophy is a 36-frame turntable rendered from the Meshy model.
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const [label,viewport] of [['desktop',{width:1280,height:900}],['ipad',{width:1024,height:768}]]){
   const page=await browser.newPage({viewport}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto('file://'+path.join(__dirname,'..','index.html'));
   await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
   const sprite=await page.evaluate(()=>{
    const el=document.querySelector('.title-trophy .trophy-turn');
    if(!el)return null;
    const cs=getComputedStyle(el);
    return {image:cs.backgroundImage,size:cs.backgroundSize,animation:cs.animationName,
            width:Math.round(el.getBoundingClientRect().width),height:Math.round(el.getBoundingClientRect().height)};
   });
   assert.ok(sprite,label+' title trophy exists');
   assert.match(sprite.image,/trophy-turn-v2\.webp/,label+' uses the turntable sheet');
   assert.equal(sprite.size,'3600% 100%',label+' sheet holds 36 frames');
   assert.match(sprite.animation,/title-trophy-turn/,label+' spins');
   assert.ok(sprite.width>200&&sprite.height>300,label+' is drawn at a usable size');
   assert.deepEqual(errors,[],label+' console');
   // reduced motion must stop the spin
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
   const still=await page.evaluate(()=>getComputedStyle(document.querySelector('.title-trophy .trophy-turn')).animationName);
   assert.equal(still,'none',label+' honours reduced motion');
   await page.close();
  }
  console.log('trophy turntable check passed (desktop + ipad)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
