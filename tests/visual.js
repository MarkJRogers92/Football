// Focused visual-identity smoke checks. These assert presentation surfaces only;
// the existing browser suite remains responsible for game behavior.
const { chromium } = require('playwright-core');
const path = require('path');

(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 let fail=0,pass=0;const out=[];const check=(name,ok,detail='')=>{ok?pass++:fail++;out.push(`  ${ok?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`)};
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000});
  await page.waitForSelector('#broadcastFeature .broadcast-feature-main');
  check(`[${label}] dashboard broadcast desk renders`,(await page.locator('#broadcastFeature').innerText()).length>30);
  await page.click('.tabs button[data-tab="gamelab"]');await page.waitForSelector('#nextGameCard .matchup-shell');
  check(`[${label}] Game Lab matchup card renders`,await page.locator('#nextGameCard .sports-mark').count()===2);
  await page.click('.tabs button[data-tab="roster"]');await page.click('#rosterBody .player-button');await page.waitForSelector('#playerDialog[open] .player-hero-rail');
  check(`[${label}] player profile becomes hero card`,await page.locator('#playerDialog .player-hero-rating').count()===3);
  check(`[${label}] player hero keeps portrait`,await page.locator('#playerDialogPortrait canvas').count()===1);
  if(label==='iphone'){const overflow=await page.$eval('#playerDialog',el=>el.scrollWidth-el.clientWidth);check(`[${label}] scouting profile has no horizontal overflow`,overflow<=1,`${overflow}px`)}
  await page.evaluate(()=>document.querySelector('#playerDialog').close());
  await page.click('.tabs button[data-tab="dashboard"]');await page.click('#simWeek');await page.waitForFunction(()=>/Week 1/.test(document.querySelector('#weekLine')?.textContent),{timeout:60000});await page.waitForSelector('#broadcastFeature .broadcast-matchup');
  check(`[${label}] dashboard promotes next matchup after sim`,/NEXT MATCHUP/.test(await page.locator('#broadcastFeature').innerText()));
  if(label==='iphone'){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check(`[${label}] visual layer has no horizontal overflow`,overflow<=1,`${overflow}px`)}
  check(`[${label}] visual layer throws no console errors`,errors.length===0,errors.slice(0,2).join(' | '));await page.close();
 }
 await browser.close();console.log(out.join('\n'));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
