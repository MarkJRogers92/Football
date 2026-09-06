const test=require('node:test');
const assert=require('node:assert/strict');
const {makeScoutingActionSystem}=require('../scouting-actions');

function fixture(){
 const universe={year:2027,week:2,phase:'regular'};
 const api=makeScoutingActionSystem({
  getUniverse:()=>universe,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  avg:a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,
  scoutingDomainView:r=>r.domains.map(x=>({...x})),
  firstRecruitEvaluation:r=>{r.scoutingHistory??=[];r.scoutingHistory.push({phase:'FIRST_EVALUATION'})},
  refreshScoutingIntel:(r,t,gain)=>{r.domains=r.domains.map(x=>({low:x.low+1,high:x.high-1,confidence:Math.min(96,x.confidence+gain)}))},
  snapshotScouting:(r,t,phase)=>{r.scoutingHistory??=[];r.scoutingHistory.push({phase});return true}
 });
 return{universe,api};
}
const team=()=>({id:1,name:'Chicago Metropolitan',staff:{RC:{evaluation:78,recruiting:82},HC:{evaluation:70}}});
const recruit=()=>({id:'R1',name:'Test Recruit',domains:[{low:58,high:74,confidence:45},{low:60,high:78,confidence:42}]});

test('weekly scouting budget stays bounded',()=>{const {api}=fixture(),t=team();assert.ok(api.scoutingBudgetFor(t)>=8);assert.ok(api.scoutingBudgetFor(t)<=14)});

test('quick film costs one hour and tightens the read',()=>{const {api}=fixture(),t=team(),r=recruit(),before=api.scoutingHoursLeft(t),res=api.performScoutingAction(r,t,'quick');assert.equal(res.ok,true);assert.equal(api.scoutingHoursLeft(t),before-1);assert.equal(res.receipt.afterConfidence>res.receipt.beforeConfidence,true);assert.equal(res.receipt.afterWidth<res.receipt.beforeWidth,true);assert.equal(api.actionAvailability(r,t,'quick').ok,false)});

test('full evaluation costs three and supersedes quick film',()=>{const {api}=fixture(),t=team(),r=recruit(),before=api.scoutingHoursLeft(t),res=api.performScoutingAction(r,t,'full');assert.equal(res.ok,true);assert.equal(api.scoutingHoursLeft(t),before-3);assert.equal(api.recruitScoutingRecord(r,t).full,true);assert.equal(api.actionAvailability(r,t,'quick').ok,false)});

test('budget resets when the week advances',()=>{const {api,universe}=fixture(),t=team(),r=recruit();api.performScoutingAction(r,t,'full');assert.ok(api.scoutingHoursLeft(t)<api.scoutingBudgetFor(t));universe.week++;assert.equal(api.scoutingHoursLeft(t),api.scoutingBudgetFor(t))});

test('cannot manually scout a recruit committed elsewhere',()=>{const {api}=fixture(),t=team(),r={...recruit(),committed:'Wisconsin Commonwealth'};const res=api.performScoutingAction(r,t,'quick');assert.equal(res.ok,false);assert.match(res.reason,/committed elsewhere/i)});
