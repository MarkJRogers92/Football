const assert=require('assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');

// v0.12.27: the title trophy is a 192-frame turntable (12x16 sheet), crossfaded frame to frame by title-trophy.js.
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const [label,viewport] of [['desktop',{width:1280,height:900}],['ipad',{width:1024,height:768}]]){
   const page=await browser.newPage({viewport}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto('file://'+path.join(__dirname,'..','index.html'));
   await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
   const read=()=>page.evaluate(()=>{
    const turn=document.querySelector('.title-trophy .trophy-turn'),layers=turn?.querySelectorAll('.trophy-frame')||[];
    if(!turn||layers.length!==2)return null;
    const box=turn.getBoundingClientRect(),cs=getComputedStyle(layers[0]);
    const frame=el=>{const [x,y]=getComputedStyle(el).backgroundPosition.split(' ').map(parseFloat);return {col:x/100*11,row:y/100*15}};
    return {image:cs.backgroundImage,size:cs.backgroundSize,width:Math.round(box.width),height:Math.round(box.height),
            base:frame(layers[0]),next:frame(layers[1]),fade:Number(getComputedStyle(layers[1]).opacity)};
   });
   const first=await read();
   assert.ok(first,label+' title trophy exists');
   assert.match(first.image,/trophy-turn-v4\.webp/,label+' uses the turntable sheet');
   assert.equal(first.size,'1200% 1600%',label+' sheet holds 12x16 frames');
   assert.ok(first.width>200&&first.height>300,label+' is drawn at a usable size');
   const index=f=>Math.round(f.row)*12+Math.round(f.col);
   let seen=new Set(),fades=new Set();
   for(let i=0;i<6;i++){
    await page.waitForTimeout(250);
    const s=await read();
    for(const f of [s.base,s.next])assert.ok(Math.abs(f.col-Math.round(f.col))<0.01&&Math.abs(f.row-Math.round(f.row))<0.01,label+' layers sit on whole frames '+JSON.stringify(f));
    assert.equal(index(s.next),(index(s.base)+1)%192,label+' fades into the following frame');
    assert.ok(s.fade>=0&&s.fade<=1,label+' crossfade stays in range');
    seen.add(index(s.base));fades.add(s.fade.toFixed(2));
   }
   assert.ok(seen.size>=2,label+' turns over time');
   assert.ok(fades.size>=3,label+' crossfades between frames instead of stepping');
   assert.deepEqual(errors,[],label+' console');
   // reduced motion must stop the spin
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.reload();
   await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});
   await page.waitForTimeout(600);
   const still=await page.evaluate(()=>{const t=document.querySelector('.title-trophy .trophy-turn'),[a,b]=t.querySelectorAll('.trophy-frame');
    return {float:getComputedStyle(t).animationName,pos:getComputedStyle(a).backgroundPosition,fade:getComputedStyle(b).opacity}});
   assert.deepEqual(still,{float:'none',pos:'0% 0%',fade:'0'},label+' honours reduced motion');
   await page.close();
  }
  console.log('trophy turntable check passed (desktop + ipad)');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
