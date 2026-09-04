const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('the budget is finite and derived from the program',async()=>{
 const e=await setup(2301),u=e.universe,me=e.T('Chicago Metropolitan');
 const b=e.nilBudgetFor(me);
 assert.ok(b>=3&&b<=14,`a real budget (${b})`);
 assert.equal(e.nilRemaining(me),b,'nothing is spent at kickoff');
 const poor=u.teams.find(t=>t.nil<50)||u.teams[1];poor.nil=10;poor.resources=10;
 assert.ok(e.nilBudgetFor(poor)<b,'a program with no NIL and no resources has less to spend');
});

test('spending is bounded by the budget and refunded on release',async()=>{
 const e=await setup(2302),me=e.T('Chicago Metropolitan');
 const budget=e.nilBudgetFor(me);
 const targets=[...me.roster].sort((a,b)=>b.perceived-a.perceived);
 let spent=0,signed=[];
 for(const p of targets){
  const r=e.signNilDeal(me,p,false);
  if(!r.ok){assert.ok(r.reason.includes('Not enough NIL'),'the only refusal is affordability');break}
  spent+=r.cost;signed.push(p);
 }
 assert.equal(me.nilSpent,spent);
 assert.ok(spent<=budget,`never overspends (${spent} of ${budget})`);
 assert.ok(e.nilRemaining(me)<e.nilDealCost(targets[signed.length],false),'it stopped because the next deal was unaffordable');
 // Double-signing the same player is refused rather than charged twice.
 const dup=e.signNilDeal(me,signed[0],false);
 assert.equal(dup.ok,false);
 assert.equal(me.nilSpent,spent,'a refused deal costs nothing');
 const back=e.cancelNilDeal(me,signed[0]);
 assert.ok(back.ok);
 assert.equal(me.nilSpent,spent-back.refund,'releasing refunds exactly what it cost');
 assert.equal(signed[0].nilDeal,null);
});

test('a player deal is real retention pressure',async()=>{
 const e=await setup(2303),me=e.T('Chicago Metropolitan');
 const p=[...me.roster].sort((a,b)=>e.transferRisk(b)-e.transferRisk(a))[0];
 const before=e.transferRisk(p);
 const r=e.signNilDeal(me,p,false);
 assert.ok(r.ok);
 const after=e.transferRisk(p);
 assert.ok(after<before,`NIL lowers transfer risk (${before} -> ${after})`);
 assert.equal(before-after,Math.min(30,r.cost*6));
 e.cancelNilDeal(me,p);
 assert.equal(e.transferRisk(p),before,'and releasing it puts the risk back');
});

test('a recruit deal only helps the school that paid for it',async()=>{
 const e=await setup(2304),u=e.universe,me=e.T('Chicago Metropolitan');
 const r=u.recruits.find(x=>x.stars>=4&&!x.committed);
 const rival=u.teams.find(t=>t!==me&&t.conference===me.conference);
 const mineBefore=e.recruitPitch(me,r),theirsBefore=e.recruitPitch(rival,r);
 const res=e.signNilDeal(me,r,true);
 assert.ok(res.ok);
 assert.ok(e.recruitPitch(me,r)>mineBefore,'the paying school gets a better pitch');
 assert.equal(e.recruitPitch(rival,r),theirsBefore,'a rival gets nothing from it');
 assert.equal(e.recruitPitch(me,r)-mineBefore,res.cost*3);
});

test('a new season restores the budget and clears last year deals',async()=>{
 const e=await setup(2305),u=e.universe,me=e.T('Chicago Metropolitan');
 const p=me.roster[0];
 assert.ok(e.signNilDeal(me,p,false).ok);
 assert.ok(me.nilSpent>0);
 for(let i=0;i<12;i++)e.simWeek();
 e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason();
 assert.equal(me.nilSpent,0,'the budget resets with the new season');
 assert.equal(e.nilRemaining(me),e.nilBudgetFor(me));
 assert.equal(e.nilDealActive(p,me),null,'last season deal no longer applies');
});
