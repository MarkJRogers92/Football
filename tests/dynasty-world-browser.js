'use strict';
// v0.32 in a real browser at desktop and phone width: the conference card on the Program page, the locker room on
// the Roster page (captains can be changed before Week 1), a locker-room flashpoint on This Week, and nonconference
// trades on the Season page. Nothing may overflow the page or log an error.
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require('playwright-core'),{chromiumPath}=require('./helpers/chromium-path'),{startNewDynasty}=require('./helpers/start-new-dynasty');

const open=(page,group,tab)=>page.evaluate(([group,tab])=>{
 const g=document.querySelector(`.tab-groups button[data-group="${group}"]`);if(g&&!g.classList.contains('active'))g.click();
 document.querySelector(`.tabs button[data-tab="${tab}"]`)?.click();
},[group,tab]);
const overflow=page=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
const shots=process.env.DW_SHOTS;

(async()=>{
 const browser=await chromium.launch({executablePath:chromiumPath(),args:['--no-sandbox']});
 try{
  for(const width of [1280,390]){
   const label=width>700?'desktop':'phone';
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:shots?2:1}),errors=[];
   page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await page.goto('file://'+path.join(__dirname,'..','index.html'));await startNewDynasty(page);

   // --- Program page: conference and realignment.
   await open(page,'program','program');
   await page.waitForSelector('#conferenceOutlook .fb-summary',{timeout:15000});
   const conf=await page.locator('#conferenceOutlook').textContent();
   assert.match(conf,/CONFERENCE & REALIGNMENT/,`[${label}] the conference card is on the Program page`);
   assert.match(conf,/Media rank[\s\S]*Payout[\s\S]*Your brand[\s\S]*Next window/);
   assert.equal(await page.locator('#conferenceOutlook [data-ra-status]').count(),1,`[${label}] a realignment outlook is stated`);
   assert.ok(await overflow(page)<=1,`[${label}] program page fits`);
   if(shots)await page.locator('#conferenceOutlook').screenshot({path:path.join(shots,`conference-${label}.png`)});

   // --- Roster page: the locker room, with four captains the coach can change before Week 1.
   await open(page,'program','roster');
   await page.waitForSelector('#lockerRoom .lr-captain',{timeout:15000});
   assert.equal(await page.locator('#lockerRoom .lr-captain').count(),4,`[${label}] four captains named`);
   const first=await page.locator('#lockerRoom .lr-captain [data-lr-captain]').first().getAttribute('data-lr-captain');
   await page.locator(`#lockerRoom .lr-captain [data-lr-captain="${first}"]`).click();
   assert.equal(await page.locator('#lockerRoom .lr-captain').count(),3,`[${label}] a captain can be removed`);
   await page.locator('#lockerRoom details.lr-pick [data-lr-captain]:not([disabled])').first().click();
   assert.equal(await page.locator('#lockerRoom .lr-captain').count(),4,`[${label}] and another named`);
   const lr=await page.evaluate(()=>window.__DL_TEST__.lockerRoom());
   assert.equal(lr.captains.length,4);
   assert.ok(await overflow(page)<=1,`[${label}] roster page fits`);
   if(shots)await page.locator('#lockerRoom').screenshot({path:path.join(shots,`locker-room-${label}.png`)});

   // --- This Week: a flashpoint waits for an answer.
   await open(page,'home','dashboard');
   await page.evaluate(()=>window.__DL_TEST__.lockerRoomFlashpointFixture());
   await page.waitForSelector('#lockerRoomFlashpoint [data-lr-respond]',{timeout:15000});
   assert.equal(await page.locator('#lockerRoomFlashpoint [data-lr-respond]').count(),3,`[${label}] three responses`);
   if(shots)await page.locator('#lockerRoomFlashpoint').screenshot({path:path.join(shots,`flashpoint-${label}.png`)});
   const before=(await page.evaluate(()=>window.__DL_TEST__.lockerRoom())).chemistry;
   await page.click('#lockerRoomFlashpoint [data-lr-respond="discipline"]');
   assert.equal(await page.locator('#lockerRoomFlashpoint').count(),0,`[${label}] the card closes once answered`);
   const after=await page.evaluate(()=>window.__DL_TEST__.lockerRoom());
   assert.equal(after.incident,null);assert.equal(after.chemistry,Math.min(99,before+5),`[${label}] discipline lifts chemistry`);

   // --- Season page: trade a nonconference date.
   await open(page,'season','season');
   await page.waitForSelector('#nonconSchedule .noncon-week',{timeout:15000});
   assert.equal(await page.locator('#nonconSchedule .noncon-week').count(),4,`[${label}] four nonconference weeks`);
   const nc=await page.evaluate(()=>window.__DL_TEST__.noncon());
   assert.equal(nc.left,2);assert.equal(nc.games[0].tradable,false,`[${label}] the opener is locked`);
   await page.locator('#nonconSchedule details.noncon-week summary').first().click();
   if(shots)await page.locator('#nonconSchedule').screenshot({path:path.join(shots,`noncon-${label}.png`)});
   const btn=page.locator('#nonconSchedule [data-nc-week]:not([disabled])').first(),target=await btn.getAttribute('data-nc-opp'),week=Number(await btn.getAttribute('data-nc-week'));
   await btn.click();
   const nc2=await page.evaluate(()=>window.__DL_TEST__.noncon());
   assert.equal(nc2.left,1,`[${label}] one trade used`);
   assert.equal(nc2.games.find(g=>g.week===week).opp,target,`[${label}] the new opponent is on the schedule`);
   assert.ok(await overflow(page)<=1,`[${label}] season page fits`);

   assert.deepEqual(errors,[],`[${label}] no console errors`);
   await page.close();
   console.log(`dynasty world ${label}: ok`);
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
