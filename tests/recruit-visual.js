// Focused recruiting presentation checks. Mechanics remain covered by the existing suite.
const { chromium } = require('playwright-core');
const path = require('path');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 let fail=0,pass=0;const out=[];const check=(name,ok,detail='')=>{ok?pass++:fail++;out.push(`  ${ok?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`)};
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
  await page.click('.tabs button[data-tab="recruiting"]');await page.waitForSelector('#recruitBody tr');await page.waitForSelector('#signingClassFeature .signing-class-board');
  check(`[${label}] signing-class board renders`,/SIGNING CLASS/.test(await page.locator('#signingClassFeature').innerText()));
  check(`[${label}] signing-class meter renders`,await page.locator('#signingClassFeature .signing-meter').count()===1);
  // Presentation is DOM-driven. Mark one rendered row committed to verify the card path without altering game state.
  await page.evaluate(()=>{const row=document.querySelector('#recruitBody tr');const interest=row?.querySelector('[data-label="Interest"]');if(interest)interest.textContent='COMMITTED'});
  await page.waitForSelector('#signingClassFeature .signing-card');
  check(`[${label}] committed recruit becomes signing card`,await page.locator('#signingClassFeature .signing-card').count()>=1);
  await page.click('#signingClassFeature .signing-card');await page.waitForSelector('#recruitDialog[open] .recruit-hero-rail');
  check(`[${label}] recruit profile gets hero rail`,await page.locator('#recruitDialog .recruit-hero-rail > *').count()===4);
  check(`[${label}] recruit hero has identity graphic`,await page.locator('#recruitDialog .recruit-hero-avatar').count()===1);
  if(label==='iphone'){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check(`[${label}] recruiting visuals have no horizontal overflow`,overflow<=1,`${overflow}px`)}
  check(`[${label}] recruiting visuals throw no console errors`,errors.length===0,errors.slice(0,2).join(' | '));await page.close();
 }
 await browser.close();console.log(out.join('\n'));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
