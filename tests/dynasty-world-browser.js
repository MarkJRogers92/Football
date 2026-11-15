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
   // --- Program page: the pro pipeline.
   await page.waitForSelector('#proPipeline .fb-summary',{timeout:15000});
   assert.match(await page.locator('#proPipeline').textContent(),/PRO PIPELINE[\s\S]*Active pros[\s\S]*Pro Bowlers[\s\S]*National rank/,`[${label}] the pro pipeline card is on the Program page`);
   const pro=await page.evaluate(()=>window.__DL_TEST__.proPipeline());
   assert.equal(pro.pros,0,`[${label}] no pros before the first draft`);
   if(shots)await page.locator('#proPipeline').screenshot({path:path.join(shots,`pro-pipeline-${label}.png`)});

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

   // --- Coaching rivals: the Program page card, and This Week names a nemesis before the next meeting.
   await open(page,'program','program');
   await page.waitForSelector('#coachRivals',{timeout:15000});
   assert.match(await page.locator('#coachRivals').textContent(),/COACHING RIVALS/,`[${label}] the coaching rivals card is on the Program page`);
   await page.waitForSelector('#trophyCase .tc-shelf',{timeout:15000});
   const tc=await page.locator('#trophyCase').textContent();
   assert.match(tc,/TROPHY CASE[\s\S]*National titles[\s\S]*Conference titles[\s\S]*Bowl wins/,`[${label}] the trophy case is on the Program page`);
   assert.ok(await page.locator('#trophyCase .tc-shelf').count()>=5,`[${label}] every shelf is shown, empty or not`);
   assert.ok(await overflow(page)<=1,`[${label}] trophy case fits`);
   if(shots)await page.locator('#trophyCase').screenshot({path:path.join(shots,`trophy-case-${label}.png`)});
   await page.waitForSelector('#traditions',{timeout:15000});
   assert.match(await page.locator('#traditions').textContent(),/TRADITIONS[\s\S]*10 straight home wins/,`[${label}] traditions are on the Program page`);
   await open(page,'home','dashboard');
   const nemesis=await page.evaluate(()=>window.__DL_TEST__.coachRivalsFixture());
   await page.waitForSelector('#coachRivalWeek',{timeout:15000});
   const h2h=await page.locator('#coachRivalWeek').innerText();
   assert.ok(h2h.includes(nemesis)&&/NEMESIS/.test(h2h)&&/0-3/.test(h2h),`[${label}] This Week names the nemesis: ${h2h}`);
   assert.equal((await page.evaluate(()=>window.__DL_TEST__.coachRivals())).nemesis,nemesis);
   assert.ok(await overflow(page)<=1,`[${label}] head-to-head card fits`);
   if(shots)await page.locator('#coachRivalWeek').screenshot({path:path.join(shots,`coach-rival-${label}.png`)});

   // --- Senior Day: the week before the last home game, This Week lists the seniors.
   const seniors=await page.evaluate(()=>window.__DL_TEST__.seniorDayFixture(true));
   assert.ok(seniors>0,`[${label}] the roster has seniors`);
   await page.waitForSelector('#seniorDay [data-senior]',{timeout:15000});
   assert.equal(await page.locator('#seniorDay [data-senior]').count(),seniors,`[${label}] every senior is named`);
   assert.match(await page.locator('#seniorDay').innerText(),/SENIOR DAY · WEEK \d+/);
   assert.ok(await overflow(page)<=1,`[${label}] Senior Day fits`);
   if(shots)await page.locator('#seniorDay').screenshot({path:path.join(shots,`senior-day-${label}.png`)});
   await page.evaluate(()=>window.__DL_TEST__.seniorDayFixture(false));
   await page.waitForSelector('#seniorDay',{state:'detached',timeout:15000});

   // --- Staff: a retired pro from the program applies for a coordinator job.
   const alum=await page.evaluate(()=>window.__DL_TEST__.alumniCoachFixture());
   assert.ok(alum,`[${label}] an alumni candidate is in the pool`);
   await open(page,'program','staff');
   await page.waitForSelector('[data-alumni-coach]',{timeout:15000});
   const alumCard=await page.locator('.candidate-card',{has:page.locator('[data-alumni-coach]')}).innerText();
   assert.ok(alumCard.includes(alum)&&/Former player/.test(alumCard)&&/pro seasons/.test(alumCard),`[${label}] the card shows his pro career: ${alumCard}`);
   assert.ok(await overflow(page)<=1,`[${label}] staff page fits`);
   if(shots)await page.locator('.candidate-card',{has:page.locator('[data-alumni-coach]')}).screenshot({path:path.join(shots,`alumni-coach-${label}.png`)});
   await open(page,'home','dashboard');

   // --- Records: the draft board says when a class of early entrants is thin.
   await page.evaluate(()=>{const dh={},y=2020;for(let k=0;k<4;k++)dh[y+k]=Array.from({length:k===3?2:12},(_,i)=>({year:y+k,playerId:`dc${k}_${i}`,playerName:'Early '+i,pos:'WR',school:'X',reason:'Declared early for draft',round:1,pick:i+1,status:'Drafted',label:'R1'}));window.__DL_TEST__.setDraftHistory?.(dh)});
   await open(page,'world','records');
   await page.waitForSelector('#draftClassNote',{timeout:15000});
   assert.match(await page.locator('#draftClassNote').textContent(),/2023 class: a thin one\. Only 2 underclassmen declared early, against 12 a class before it/,`[${label}] the draft board explains a thin class`);
   await open(page,'home','dashboard');

   // --- This Week: the board offers a bet before the first game.
   await open(page,'home','dashboard');
   await page.waitForSelector('#adminWager [data-wager]',{timeout:15000});
   assert.equal(await page.locator('#adminWager [data-wager]').count(),3,`[${label}] three promises on the table`);
   assert.ok(await overflow(page)<=1,`[${label}] the bet card fits`);
   if(shots)await page.locator('#adminWager').screenshot({path:path.join(shots,`admin-wager-${label}.png`)});
   await page.locator('#adminWager [data-wager]').first().click();
   await page.waitForSelector('#adminWager',{state:'detached',timeout:15000});
   assert.match(await page.locator('#saveStatus').textContent(),/Bet made with the board: Win at least \d+ games/);

   // --- History: your dynasty in one page (a fresh dynasty has one post and no completed season yet).
   await open(page,'world','history');
   await page.waitForSelector('#dynastyPage',{timeout:15000});
   assert.match(await page.locator('#dynastyPage').textContent(),/YOUR DYNASTY[\s\S]*Where you coached/,`[${label}] the dynasty page leads History`);
   assert.ok(await overflow(page)<=1,`[${label}] history page fits`);
   if(shots)await page.locator('#dynastyPage').screenshot({path:path.join(shots,`dynasty-page-${label}.png`)});
   await open(page,'home','dashboard');

   // --- This Week: a long home streak is named.
   const hs=await page.evaluate(()=>window.__DL_TEST__.homeStreakFixture(12));
   await page.waitForSelector('#homeStreak',{timeout:15000});
   const hsText=await page.locator('#homeStreak').innerText();
   assert.ok(/HOME STREAK/.test(hsText)&&/The Fortress/.test(hsText)&&/12 straight home wins/.test(hsText),`[${label}] the streak is named: ${hsText}`);
   assert.ok(hs.home||hsText.includes(hs.host),`[${label}] a road streak names the host`);
   await page.evaluate(()=>window.__DL_TEST__.homeStreakFixture(0));

   // --- This Week: a trap game before a big one.
   const trapOpp=await page.evaluate(()=>window.__DL_TEST__.trapGameFixture());
   await page.waitForSelector('#trapGame',{timeout:15000});
   const trapText=await page.locator('#trapGame').innerText();
   assert.ok(trapText.includes(trapOpp)&&/TRAP GAME/.test(trapText)&&/#4 /.test(trapText),`[${label}] the trap game is flagged: ${trapText}`);
   assert.ok(await overflow(page)<=1,`[${label}] trap game card fits`);

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

   const wire=page.locator('#weeklyHub .hub-item').filter({hasText:'You disciplined'});
   assert.equal(await wire.count(),1,`[${label}] the resolved flashpoint appears once in the Wire`);
   await page.locator('#weeklyDeskDetails > summary').click();
   await wire.click();assert.equal(await page.locator('#lockerRoom').isVisible(),true,`[${label}] its link opens the roster`);

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

   // The invitation's two controls use the real swap/decline paths.
   await open(page,'home','dashboard');
   const invitation=await page.evaluate(()=>window.__DL_TEST__.realignmentInviteFixture());
   await page.click('[data-ra-answer="decline"]');
   assert.equal((await page.evaluate(()=>window.__DL_TEST__.selected())).conference,invitation.from);
   assert.equal((await page.evaluate(()=>window.__DL_TEST__.realignment())).pending,null);
   await open(page,'program','program');
   assert.match(await page.locator('#conferenceOutlook').textContent(),/Declined invitations/);
   await open(page,'home','dashboard');
   const accepted=await page.evaluate(()=>window.__DL_TEST__.realignmentInviteFixture());
   await page.click('[data-ra-answer="accept"]');
   assert.equal((await page.evaluate(()=>window.__DL_TEST__.selected())).conference,accepted.to);
   assert.equal((await page.evaluate(()=>window.__DL_TEST__.realignment())).pending,null);
   assert.ok(await overflow(page)<=1,`[${label}] invitation response fits`);

   // Rookie chronology must not expose an eventual camp cut or future seasons.
   const rookieId=await page.evaluate(()=>{
    const t=window.__DL_TEST__.selected(),p=t.roster[0],year=window.DynastyCeremonySnapshot.read().year;
    p.draftResult={year,playerId:p.id,playerName:p.name,school:t.name,schoolId:t.id,pos:p.pos,status:'UDFA',pg:50,pc:55,label:'Undrafted Free Agent'};return p.id;
   });
   await open(page,'program','roster');
   if(await page.locator('#roster .table-wrap.rd-table-collapsed').count())await page.click('[data-rd-table-toggle]');
   await page.click(`#rosterBody [data-player="${rookieId}"]`);
   await page.waitForSelector('#playerDialog[open] .pro-career');
   const rookieText=await page.locator('#playerDialog .pro-career').innerText();
   assert.match(rookieText,/Awaiting pro debut/);assert.doesNotMatch(rookieText,/Never made a roster|Retired|Hall of Fame/);
   await page.evaluate(()=>document.querySelector('#playerDialog').close());

   // Presentation-only fixture; induction eligibility is checked by the adapter tests.
   await page.evaluate(()=>window.DynastyCeremonies.show({key:'2050:honor',kind:'honor',year:2050,team:{id:1,name:'Home',w:10,l:2},alumni:[{name:'Alex <One>',pos:'QB',proBowls:8,allPros:4,rings:1}]}));
   await page.waitForSelector('.ceremony.is-honor');
   assert.match(await page.locator('.ceremony.is-honor').textContent(),/Ring of Honor[\s\S]*Alex <One>/);
   assert.equal(await page.locator('.ceremony.is-honor .cer-confetti,.ceremony.is-honor .cer-turn').count(),0);
   assert.ok(await overflow(page)<=1,`[${label}] Ring of Honor fits`);
   if(shots)await page.screenshot({path:path.join(shots,`ring-of-honor-${label}.png`)});
   await page.keyboard.press('Enter');await page.waitForSelector('.ceremony.is-honor',{state:'detached'});

   assert.deepEqual(errors,[],`[${label}] no console errors`);
   await page.close();
   console.log(`dynasty world ${label}: ok`);
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
