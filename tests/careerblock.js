const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const finishSeason=e=>{for(let i=0;i<12;i++)e.simWeek();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason()};

test('simWeek refuses to advance while a job offer is unresolved',async()=>{
 const e=await setup(2901),u=e.universe;
 finishSeason(e);
 e.closeTenure('let go');
 assert.ok(u.jobOffers.length>0,'there is something to choose');
 assert.equal(e.hasPendingCareerChoice(),true);
 const weekBefore=u.week,phaseBefore=u.phase;
 e.simWeek();
 assert.equal(u.week,weekBefore,'the week does not move');
 assert.equal(u.phase,phaseBefore);
 // Taking a post clears the block immediately, no further action needed.
 e.acceptPost(u.jobOffers[0].schoolId);
 assert.equal(e.hasPendingCareerChoice(),false);
 e.simWeek();
 assert.equal(u.week,weekBefore+1,'and the calendar moves again the instant it is resolved');
});

test('simSeason does not spin forever on a pending choice — it stops, once, cleanly',async()=>{
 const e=await setup(2902),u=e.universe;
 finishSeason(e);
 e.closeTenure('let go');
 const start=Date.now();
 e.simSeason();                              // must return promptly, not hang the process
 assert.ok(Date.now()-start<2000,'simSeason returns immediately rather than looping');
 assert.equal(u.phase,'regular','the season never advances past week 0');
 assert.equal(u.week,0);
 e.acceptPost(u.jobOffers[0].schoolId);
 e.simSeason();                              // now it should actually play the season
 assert.equal(u.phase,'confReady','with the choice made, a full season plays out normally');
});

test('the detailed single-game path is blocked the same way',async()=>{
 const e=await setup(2903),u=e.universe,me=e.T('Chicago Metropolitan');
 finishSeason(e);
 e.closeTenure('let go');
 const g=me.schedule.find(x=>!x.played);
 e.simulateUserDetailed();
 assert.equal(g.played,false,'no game is simulated while the choice is pending');
});

test('resolving the choice is the only thing that unblocks the calendar',async()=>{
 const e=await setup(2904),u=e.universe;
 finishSeason(e);
 assert.equal(e.hasPendingCareerChoice(),false,'a normal, unfired season has nothing to block on');
 e.closeTenure('let go');
 assert.equal(e.hasPendingCareerChoice(),true);
 for(let i=0;i<5;i++)e.simWeek();            // repeated attempts, still nothing moves
 assert.equal(u.week,0);
 assert.equal(u.jobOffers.length>0,true,'the offers are still there, untouched');
});
