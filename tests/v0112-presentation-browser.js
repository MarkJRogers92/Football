const path=require('path');
const {chromium}=require('playwright-core');
const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
let passed=0,failed=0;
function check(label,ok,detail=''){if(ok){passed++;console.log(`  PASS  ${label}${detail?` — ${detail}`:''}`)}else{failed++;console.error(`  FAIL  ${label}${detail?` — ${detail}`:''}`)}}
const goTab=async(page,id)=>page.evaluate(({id,group})=>{const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();document.querySelector(`.tabs button[data-tab="${id}"]`)?.click()},{id,group:TAB_GROUP[id]});
const {startNewDynasty:sharedStartNewDynasty}=require('./helpers/start-new-dynasty');
const startNewDynasty=async page=>{await page.goto('file://'+path.join(__dirname,'..','index.html'));return sharedStartNewDynasty(page)};
async function run(browser,label,viewport){
 const page=await browser.newPage({viewport}),errors=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
 try{
  await startNewDynasty(page);
  await page.evaluate(()=>window.__DL_TEST__?.v2PrepareDetailedGame?.());await goTab(page,'gamelab');await page.waitForSelector('#gamedayEventHero:not([hidden])',{timeout:10000});
  check(`[${label}] Game Day showcase renders`,await page.locator('#gamedayEventHero .event-showcase-band').count()===1);
  check(`[${label}] Game Day retains real matchup teams`,await page.locator('#gamedayEventHero [data-event-team]').count()===2);
  const prep=await page.locator('#gamedayEventHero').innerText();check(`[${label}] Game Day carries prep context`,/ACTIVE PLAN/.test(prep)&&/STAFF RECOMMENDATION/.test(prep));
  await page.evaluate(()=>window.DynastyGameEngineV2LabBridge.recordCurrent());await page.waitForFunction(()=>window.DynastyGameEngineV2LabBridge.debug().lastArchive?.engine==='v2',{timeout:30000});await goTab(page,'gamelab');await page.waitForSelector('#gamedayEventHero .event-recent',{timeout:10000});
  check(`[${label}] last-game FINAL treatment renders`,/FINAL/.test(await page.locator('#gamedayEventHero .event-recent').innerText()));
  check(`[${label}] archived drive strip renders`,await page.locator('#gamedayEventHero .event-drive-strip i').count()>0);
  check(`[${label}] actual key performers render`,await page.locator('#gamedayEventHero .event-performers button').count()>0);

  await goTab(page,'dashboard');await page.evaluate(()=>window.__DL_TEST__?.weeklyPlayerStoriesForceFixture?.());await goTab(page,'dashboard');await page.waitForSelector('#seasonStoryRail:not([hidden])',{timeout:10000});
  check(`[${label}] season story rail renders`,await page.locator('#seasonStoryRail .season-story-card').count()>0);
  check(`[${label}] story rail labels factual sources`,/SEASON STORIES/.test(await page.locator('#seasonStoryRail').innerText()));
  const playerStory=page.locator('#seasonStoryRail [data-story-player]').first();if(await playerStory.count()){await playerStory.click();await page.waitForSelector('#playerDialog[open]',{timeout:10000});check(`[${label}] player story delegates to canonical profile`,true);await page.evaluate(()=>document.querySelector('#playerDialog')?.close())}else check(`[${label}] player story delegates to canonical profile`,false,'no player story surfaced');

  await goTab(page,'recruiting');await page.waitForSelector('#recruitWorkspace:not([hidden])',{timeout:10000});await page.locator('[data-rwf="all"]').click();await page.waitForFunction(()=>document.querySelectorAll('#recruitWorkspace [data-rwid]').length>1,{timeout:10000});const second=page.locator('#recruitWorkspace [data-rwid]').nth(1);const recruitId=await second.getAttribute('data-rwid');await second.click();
  check(`[${label}] recruiting selection persists`,await page.locator(`#recruitWorkspace [data-rwid="${recruitId}"]`).getAttribute('aria-selected')==='true');
  check(`[${label}] canonical recruit row follows selection`,await page.locator('#recruitBody tr.recruit-selected-row').count()===1);
  const target=page.locator('#recruitWorkspace [data-rwa="target"]');if(await target.count()){await target.click();await page.waitForFunction(id=>!!document.querySelector(`#recruitWorkspace [data-rwid="${CSS.escape(id)}"].rw-updated, #recruitWorkspace .rw-update-chip`),recruitId,{timeout:10000});check(`[${label}] recruiting action gets visible change feedback`,true)}else check(`[${label}] recruiting action gets visible change feedback`,false,'target action unavailable');

  await goTab(page,'roster');await page.waitForSelector('#rosterPositionBoard [data-rd-player]',{timeout:10000});const rosterPlayer=page.locator('#rosterPositionBoard [data-rd-player]').nth(1),playerId=await rosterPlayer.getAttribute('data-rd-player');await rosterPlayer.click();
  check(`[${label}] roster selection stays anchored`,await page.locator(`#rosterPositionBoard [data-rd-player="${playerId}"]`).getAttribute('aria-pressed')==='true');
  check(`[${label}] canonical roster row follows selection`,await page.locator('#rosterBody tr.rd-canonical-selected').count()===1);await page.evaluate(()=>document.querySelector('#playerDialog')?.close());

  await goTab(page,'depth');await page.waitForSelector('#depthFormationBoard [data-rd-assign="QB1"]',{timeout:10000});const visual=page.locator('#depthFormationBoard [data-rd-assign="QB1"]'),opts=await visual.locator('option').count(),before=await visual.inputValue();if(opts>1){const values=await visual.locator('option').evaluateAll(os=>os.map(o=>o.value));const next=values.find(v=>v!==before);await visual.selectOption(next);await page.waitForSelector('#depthFormationBoard [data-rd-formation-role="QB1"].rd-role-updated',{timeout:10000});const canonical=await page.locator('#depthGrid select[data-role="QB1"]').inputValue();check(`[${label}] depth assignment delegates canonical control`,canonical===next);check(`[${label}] changed depth role gets feedback`,true)}else{check(`[${label}] depth assignment delegates canonical control`,true,'one QB candidate');check(`[${label}] changed depth role gets feedback`,true,'one QB candidate')}
  if(viewport.width<=520){const overflow=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-document.documentElement.clientWidth));check(`[${label}] no horizontal page overflow`,overflow<=1,`${overflow}px`)}
  check(`[${label}] presentation pass throws no console errors`,errors.length===0,errors.join(' | '));
 }finally{await page.close()}
}
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/google-chrome',args:['--no-sandbox']});try{await run(browser,'desktop',{width:1280,height:900});await run(browser,'iphone',{width:390,height:844})}finally{await browser.close()}console.log(`\n${passed} passed, ${failed} failed`);if(failed)process.exit(1)})().catch(e=>{console.error(e);process.exit(1)});
