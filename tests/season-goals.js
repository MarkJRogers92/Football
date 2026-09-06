const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed=951){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('season goals are contextual, persistent, and include a critical wins target',async()=>{
 const e=await setup(),t=e.T('Chicago Metropolitan'),g=e.ensureSeasonGoals(t);
 assert.equal(g.length,4);
 assert.equal(g[0].type,'wins');
 assert.equal(g[0].weight,'Critical');
 assert.equal(g[0].target,e.seasonExpectation(t));
 const same=e.ensureSeasonGoals(t);
 assert.equal(same,g,'goals are stable for the season');
 assert.ok(g.some(x=>x.type==='rivalry'));
 assert.ok(g.some(x=>['bluechips','classSize'].includes(x.type)));
});

test('season goals render into Program Lab HTML without throwing',async()=>{
 const e=await setup(953),t=e.T('Chicago Metropolitan');
 const html=e.seasonGoalsHTML(t);
 assert.match(html,/Critical/);
 assert.match(html,/Important/);
 assert.match(html,/Win at least/);
 assert.match(html,/Sign/);
 assert.match(html,/(On track|At risk|Complete|Failed)/);
});

test('completed important goals move the administration review',async()=>{
 const e=await setup(952),t=e.T('Chicago Metropolitan');
 const goals=e.ensureSeasonGoals(t),rival=goals.find(x=>x.type==='rivalry'),recruiting=goals.find(x=>x.id==='recruiting');
 t.w=e.seasonExpectation(t);t.l=12-t.w;t.adminConfidence=60;
 if(rival){t.rivalry.series.lastYear=e.universe.year;t.rivalry.series.lastResult='W'}
 for(let i=0;i<recruiting.target;i++){
  if(recruiting.type==='bluechips')e.universe.recruits[i].stars=4;
  e.universe.recruits[i].committed=t.name;
 }
 const evald=e.evaluateSeasonGoals(t,true);
 assert.ok(evald.adjustment>0);
 const review=e.adminSeasonReview(t);
 assert.equal(review.goalAdjustment,evald.adjustment);
 assert.ok(Array.isArray(review.goals));
});
