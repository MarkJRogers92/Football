// Focused visual-identity smoke checks. These assert presentation surfaces only;
// the existing browser suite remains responsible for game behavior.
const { chromium } = require('playwright-core');
const path = require('path');
// Tabs live inside groups since v0.9.26; selecting the group is part of navigating to a tab.
const TAB_GROUP={"dashboard": "program", "program": "program", "history": "program", "roster": "team", "depth": "team", "development": "team", "recruiting": "recruiting", "gamelab": "games", "season": "games", "stats": "games", "newsletter": "games", "staff": "staff", "offseason": "staff", "records": "staff"};
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains("active"))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});


const startNewDynasty=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 let fail=0,pass=0;const out=[];const check=(name,ok,detail='')=>{ok?pass++:fail++;out.push(`  ${ok?'PASS':'FAIL'}  ${name}${detail?' — '+detail:''}`)};
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  await page.waitForSelector('#broadcastFeature .broadcast-feature-main');
  await page.waitForSelector('#clientStatus [data-client-program]');
  check(`[${label}] dashboard broadcast desk renders`,(await page.locator('#broadcastFeature').innerText()).length>30);
  const shellProgram=await page.locator('#clientStatus [data-client-program]').innerText();
  const dashboardProgram=await page.locator('#teamName').innerText();
  check(`[${label}] premium shell carries selected program identity`,shellProgram.trim()===dashboardProgram.trim(),`${shellProgram} / ${dashboardProgram}`);
  check(`[${label}] Top 15 keeps one real logo per ranked team`,await page.locator('#top15 .team-logo').count()===15&&await page.locator('#top15 .sports-mark').count()===0);
  await goTab(page, 'gamelab');await page.waitForSelector('#nextGameCard .matchup-shell');
  await page.waitForFunction(()=>document.querySelectorAll('#nextGameCard .matchup-team .sports-mark.coverage-real-logo').length===2);
  check(`[${label}] Game Lab matchup card renders`,await page.locator('#nextGameCard .sports-mark').count()===2);
  check(`[${label}] Game Lab replaces both initials badges with real logos`,await page.locator('#nextGameCard .matchup-team .sports-mark.coverage-real-logo').count()===2);
  check(`[${label}] Game Lab presents ranks, records and matchup intelligence`,await page.locator('#nextGameCard .gameday-rank').count()===2&&await page.locator('#nextGameCard .gameday-intel>div').count()===3&&await page.locator('#nextGameCard .gameday-recommendation').count()===1);
  check(`[${label}] Game Lab carries real conference identity`,await page.locator('#nextGameCard .conference-crest').count()>=1);
  const markText=await page.locator('#nextGameCard .matchup-team .sports-mark').allTextContents();
  check(`[${label}] Game Lab no longer exposes CH/PH-style initials`,markText.every(x=>x.trim()===''),markText.join(' | '));
  if(label==='iphone'){const gameLabOverflow=await page.$eval('#nextGameCard',el=>el.scrollWidth-el.clientWidth);check(`[${label}] game-day card has no horizontal overflow`,gameLabOverflow<=1,`${gameLabOverflow}px`)}
  await goTab(page, 'season');await page.waitForSelector('#season .conference-banner');
  check(`[${label}] Season standings have the selected conference identity`,await page.locator('#season .conference-banner[data-conference-brand="Great Lakes"] .conference-crest').count()===1);
  await goTab(page, 'roster');await page.click('#rosterBody .player-button');await page.waitForSelector('#playerDialog[open] .player-hero-rail');
  check(`[${label}] player profile becomes hero card`,await page.locator('#playerDialog .player-hero-rating').count()===3);
  check(`[${label}] player hero keeps portrait`,await page.locator('#playerDialogPortrait canvas').count()===1);
  await page.waitForFunction(()=>document.querySelectorAll('#playerDialog .player-hero-team-mark .coverage-real-logo').length===1);
  check(`[${label}] player hero uses the real school logo`,await page.locator('#playerDialog .player-hero-team-mark .coverage-real-logo').count()===1);
  if(label==='iphone'){const overflow=await page.$eval('#playerDialog',el=>el.scrollWidth-el.clientWidth);check(`[${label}] scouting profile has no horizontal overflow`,overflow<=1,`${overflow}px`)}
  await page.evaluate(()=>document.querySelector('#playerDialog').close());
  await goTab(page, 'dashboard');
  for(let guard=0;guard<6&&await page.$eval('#simWeek',el=>el.disabled);guard++){
   const resolved=await page.evaluate(()=>{const button=[...document.querySelectorAll('[data-decision][data-choice]')].find(el=>!el.disabled&&el.offsetParent!==null);if(!button)return false;button.click();return true});
   if(!resolved)break;
   await page.waitForTimeout(80);
  }
  const visualSimReady=await page.$eval('#simWeek',el=>!el.disabled);
  check(`[${label}] visual weekly decision gate clears before sim`,visualSimReady);
  if(!visualSimReady)throw new Error(`[${label}] Sim Week remained disabled in visual regression after resolving visible weekly decisions`);
  await page.click('#simWeek');await page.waitForFunction(()=>/Week 1/.test(document.querySelector('#weekLine')?.textContent),{timeout:60000});await page.waitForSelector('#broadcastFeature .broadcast-matchup');
  await page.waitForFunction(()=>document.querySelectorAll('#broadcastFeature .sports-mark.coverage-real-logo').length>=2,undefined,{timeout:60000}).catch(async err=>{
   const state=await page.$eval('#broadcastFeature',el=>({logos:el.querySelectorAll('.sports-mark.coverage-real-logo').length,text:el.textContent.trim().slice(0,240)}));
   throw new Error(`[${label}] post-week matchup logos did not settle: ${JSON.stringify(state)} errors=${JSON.stringify(errors.slice(-3))} (${err.message})`);
  });
  check(`[${label}] dashboard promotes next matchup after sim`,/NEXT MATCHUP/.test(await page.locator('#broadcastFeature').innerText()));
  check(`[${label}] dashboard matchup uses real team logos`,await page.locator('#broadcastFeature .sports-mark.coverage-real-logo').count()>=2);
  if(label==='iphone'){const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check(`[${label}] visual layer has no horizontal overflow`,overflow<=1,`${overflow}px`)}
  check(`[${label}] visual layer throws no console errors`,errors.length===0,errors.slice(0,2).join(' | '));await page.close();
 }
 await browser.close();console.log(out.join('\n'));console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
