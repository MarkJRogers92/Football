const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const finishSeason=e=>{for(let i=0;i<12;i++)e.simWeek();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason()};

test('a closed tenure becomes a career line and opens a job market',async()=>{
 const e=await setup(2401),u=e.universe,me=e.T('Chicago Metropolitan');
 finishSeason(e);
 assert.equal((u.careerHistory||[]).length,0,'a surviving tenure is not archived');
 const closed=e.closeTenure('let go');
 assert.ok(closed);
 assert.equal(closed.school,'Chicago Metropolitan');
 assert.equal(closed.reason,'let go');
 assert.equal(closed.seasons,1);
 assert.equal(u.careerHistory.length,1);
 assert.ok(u.jobOffers.length>0&&u.jobOffers.length<=3,'a real, bounded set of offers');
 for(const o of u.jobOffers)assert.notEqual(o.name,'Chicago Metropolitan','the school that let you go is not on the board');
 assert.equal(e.closeTenure('again'),null,'closing twice is a no-op');
});

test('the job market reads the resume, and a bad one costs you',async()=>{
 const e=await setup(2402),u=e.universe;
 const top=e.hiringCeiling();
 u.careerHistory=[{school:'X',prestige:90,startYear:2020,endYear:2024,seasons:4,w:40,l:8,reason:'let go'}];
 const good=e.hiringCeiling();
 u.careerHistory=[{school:'X',prestige:90,startYear:2020,endYear:2024,seasons:4,w:8,l:40,reason:'let go'}];
 const bad=e.hiringCeiling();
 assert.ok(good>bad,`winning raises the ceiling (${good} vs ${bad})`);
 assert.ok(bad>=18&&good<=96,'the ceiling stays inside its bounds');
 u.tenure=null;
 assert.ok(e.hiringMarket().every(o=>o.prestige<=e.hiringCeiling()),'nothing above the ceiling is offered');
});

test('taking a post starts a fresh tenure and carries the career forward',async()=>{
 const e=await setup(2403),u=e.universe;
 finishSeason(e);
 const first=e.careerTotals();
 e.closeTenure('let go');
 const offer=u.jobOffers[0];
 assert.equal(e.acceptPost(-999).ok,false,'an unoffered job is refused');
 const r=e.acceptPost(offer.schoolId);
 assert.ok(r.ok);
 assert.equal(u.jobOffers.length,0,'the board clears once you take one');
 assert.equal(u.tenure.school,offer.name);
 assert.equal(u.tenure.seasons.length,0,'the new post starts at zero');
 assert.equal(u.tenure.closed,false);
 const after=e.careerTotals();
 assert.equal(after.w,first.w,'the career record carries across posts');
 assert.equal(after.l,first.l);
 assert.equal(after.posts,2);
 assert.ok(u.events.some(x=>x.type==='TENURE_STARTED'),'the move is on the ledger');
 const t=e.T(offer.name);
 assert.ok(t.adminConfidence>=15,'the new employer starts you with its own patience');
});

test('a closed tenure stops accruing seasons until a post is taken',async()=>{
 const e=await setup(2404),u=e.universe,me=e.T('Chicago Metropolitan');
 finishSeason(e);
 e.closeTenure('let go');
 const before=u.careerHistory[0].seasons;
 // Another season passes without the player choosing: nothing should be recorded against the old job.
 assert.equal(e.reviewControlledProgram(me),null,'no review is recorded while the board is open');
 assert.equal(u.careerHistory[0].seasons,before);
 assert.equal(u.careerHistory.length,1,'and no second career line appears');
});

test('the wire makes an open job market impossible to miss',async()=>{
 const e=await setup(2405),u=e.universe,me=e.T('Chicago Metropolitan');
 // There is no tenure to close until a season has been reviewed, and closing nothing is a no-op.
 assert.equal(e.closeTenure('let go'),null,'no tenure exists before the first season closes');
 finishSeason(e);
 assert.equal(e.careerHubItems(me).length,0,'nothing while you are employed');
 e.closeTenure('let go');
 e.buildWeeklyHub(me.rank);
 const tile=(u.weeklyHub||[]).filter(x=>x.kicker==='CAREER');
 assert.equal(tile.length,1);
 assert.equal(tile[0].importance,95);
 assert.equal(u.weeklyHub[0],tile[0],'it outranks everything else on the wire');
});
