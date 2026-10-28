const assert=require('assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

// v0.12.26: the title trophy is a 96-frame turntable (12x8 sheet) rendered from the Meshy model.
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
    const el=document.querySelector('.title-trophy .trophy-turn'),reel=el?.querySelector('.trophy-reel'),sheet=el?.querySelector('.trophy-sheet');
    if(!el||!reel||!sheet)return null;
    const box=el.getBoundingClientRect(),cs=getComputedStyle(sheet);
    return {image:cs.backgroundImage,size:cs.backgroundSize,cols:getComputedStyle(sheet).animationName,rows:getComputedStyle(reel).animationName,
            width:Math.round(box.width),height:Math.round(box.height),
            sheetW:sheet.getBoundingClientRect().width/box.width,sheetH:sheet.getBoundingClientRect().height/box.height};
   });
   assert.ok(sprite,label+' title trophy exists');
   assert.match(sprite.image,/trophy-turn-v3\.webp/,label+' uses the turntable sheet');
   assert.equal(sprite.size,'100% 100%',label+' sheet fills the reel');
   assert.equal(Math.round(sprite.sheetW),12,label+' sheet holds 12 columns');
   assert.equal(Math.round(sprite.sheetH),8,label+' reel holds 8 rows');
   assert.match(sprite.cols,/title-trophy-cols/,label+' steps across columns');
   assert.match(sprite.rows,/title-trophy-rows/,label+' steps down rows');
   assert.ok(sprite.width>200&&sprite.height>300,label+' is drawn at a usable size');
   // every sampled step must land exactly on a frame, never between two
   for(let i=0;i<4;i++){
    await page.waitForTimeout(700);
    const off=await page.evaluate(()=>{
     const el=document.querySelector('.title-trophy .trophy-turn'),box=el.getBoundingClientRect();
     const m=t=>new DOMMatrix(getComputedStyle(t).transform);
     return {x:-m(el.querySelector('.trophy-sheet')).e/box.width,y:-m(el.querySelector('.trophy-reel')).f/box.height};
    });
    assert.ok(Math.abs(off.x-Math.round(off.x))<0.01&&Math.abs(off.y-Math.round(off.y))<0.01,label+' lands on a whole frame '+JSON.stringify(off));
   }
   assert.deepEqual(errors,[],label+' console');
   // reduced motion must stop the spin
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
   const still=await page.evaluate(()=>['.trophy-turn','.trophy-reel','.trophy-sheet'].map(s=>getComputedStyle(document.querySelector('.title-trophy '+s)).animationName));
   assert.deepEqual(still,['none','none','none'],label+' honours reduced motion');
   await page.close();
  }
  console.log('trophy turntable check passed (desktop + ipad)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
