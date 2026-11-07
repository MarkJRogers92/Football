// Required weekly decisions open in the Decision Room: the people involved side by side, the staff
// pick, and every option. Choosing there resolves the same decision and never advances time.
const assert=require('node:assert/strict');
const path=require('path');
const {chromium}=require('playwright-core');
const {chromiumPath}=require('./helpers/chromium-path');
const {startNewDynasty}=require('./helpers/start-new-dynasty');
(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{for(const viewport of [{width:1280,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce'}),errors=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);
  // Required decisions do not appear every week: play weeks with the staff deciding until one does.
  const blocked=()=>page.evaluate(()=>window.DynastyNextAction.blockingItems(window.getDynastyGuidance()).length>0);
  for(let i=0;i<8&&!(await blocked());i++){const w=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);await page.evaluate(()=>document.querySelector('#simWeek').click());await page.waitForFunction(x=>window.__DL_TEST__.preseasonDebug().week>x,w,{timeout:60000})}
  assert.ok(await blocked(),'a required decision appeared within eight weeks');
  const id=await page.evaluate(()=>window.DynastyNextAction.blockingItems(window.getDynastyGuidance())[0].destination.decisionId),week=await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week);
  await page.click(`[data-decision-room="${id}"]`);await page.waitForSelector('#decisionRoom[open]');
  const people=await page.evaluate(i=>window.DynastyDecisionRoom.people(i),id);
  assert.ok(people.length>=1,'the people involved are shown');
  assert.equal(await page.locator('#decisionRoom .decision-room-person').count(),people.length);
  const options=await page.locator('#decisionRoom [data-room-choice]').count();assert.ok(options>=2,'every option is offered');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);assert.equal(overflow,false,'no horizontal overflow');
  await page.locator('#decisionRoom [data-room-choice]').first().click();
  await page.waitForFunction(()=>!document.querySelector('#decisionRoom[open]'));
  await page.waitForFunction(i=>!window.getDynastyGuidance().items.some(x=>x.destination?.decisionId===i),id);
  assert.equal(await page.evaluate(()=>window.__DL_TEST__.preseasonDebug().week),week,'deciding never advances time');
  assert.deepEqual(errors,[],errors.join('\n'));await page.close();
 }console.log('PASS decision room: people side by side, staff pick, options, resolves without advancing, desktop and phone')}
 finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
