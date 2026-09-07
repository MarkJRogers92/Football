const {chromium}=require('playwright-core');
const path=require('path');
const goTab=(page,id,group='games')=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group});
const start=async page=>{await page.waitForSelector('#titleNew',{timeout:30000});await page.waitForFunction(()=>document.querySelector('#titleTeam')?.options.length>0,{timeout:60000});await page.click('#titleNew');await page.waitForSelector('#titleStart',{state:'visible',timeout:10000});await page.click('#titleStart');await page.waitForFunction(()=>document.querySelector('#userTeam')?.options.length>0,{timeout:60000})};
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});let pass=0,fail=0;
 for(const [label,viewport] of [['desktop',{width:1280,height:900}],['iphone',{width:390,height:844}]]){
  const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));const check=(name,ok,detail='')=>{ok?pass++:fail++;console.log(`${ok?'PASS':'FAIL'} [${label}] ${name}${detail?` — ${detail}`:''}`)};
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await start(page);
  const ready=await page.evaluate(()=>window.__DL_TEST__?.v2PrepareDetailedGame?.());check('canonical weekly setup resolves a real Game Day matchup',!!ready?.ready,JSON.stringify(ready));
  await goTab(page,'gamelab');await page.waitForSelector('#gamedayEventHero:not([hidden])',{timeout:15000});const event=(await page.locator('#gamedayEventHero').innerText()).toLowerCase();
  check('game day event hero is visible',await page.locator('#gamedayEventHero').isVisible());
  check('both real school identities are presented',await page.locator('#gamedayEventHero [data-event-team]').count()===2);
  check('both team logos use the existing atlas',await page.locator('#gamedayEventHero .event-team-logo[data-team-id]').count()===2);
  check('real week and stakes context are visible',event.includes('game day')&&event.includes('week')&&(event.includes('conference game')||event.includes('nonconference game')||event.includes('rivalry')));
  check('real plan context is visible',event.includes('active plan')&&event.includes('staff recommendation'));
  check('availability and opponent tendency are visible',event.includes('availability')&&event.includes('opponent tendency'));
  check('canonical matchup intelligence remains available',await page.locator('#v2MatchupIntelligence').count()===1&&await page.locator('#v2MatchupIntelligence').isVisible());
  await goTab(page,'season');await page.waitForSelector('#seasonPulse',{timeout:10000});const pulse=(await page.locator('#seasonPulse').innerText()).toLowerCase();
  check('season pulse is visible',await page.locator('#seasonPulse').isVisible());
  check('record rank and conference context are promoted',pulse.includes('conference')&&pulse.includes('streak')&&pulse.includes('played'));
  check('next real scheduled opponent is promoted',pulse.includes('next')&&await page.locator('#seasonPulse [data-season-opponent]').count()===1);
  check('season progress is derived and visible',pulse.includes('regular-season progress'));
  check('canonical conference standings remain available',await page.locator('#confStandings').count()===1&&await page.locator('#confStandings .rankrow').count()>0);
  check('canonical team schedule remains available',await page.locator('#teamSchedule .resultrow').count()>0);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);check('no page-level horizontal overflow',overflow<=1,`${overflow}px`);
  check('no console errors',errors.length===0,errors.slice(0,5).join(' | '));await page.close();
 }
 await browser.close();console.log(`\n${pass} passed, ${fail} failed`);process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
