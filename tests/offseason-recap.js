const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){
 const e=loadEngine({seed});await e.loadSchools();e.initUniverse();const u=e.universe,t=u.teams[0];e.setUserTeam(t.name);
 for(const team of u.teams){team.w=10;team.l=2;team.adminConfidence=95;}
 u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'review');return {e,u,t};
}
function balanced(m){assert.equal(m.current,m.start-m.eligibility-m.earlyDraft-m.portalOut+m.signees+m.portalIn+m.walkOns-m.cuts);assert.equal(m.unexplained,0);}
test('the running receipt balances each real phase and survives reload without replay',async()=>{
 const {e,u,t}=await setup(9501),start=t.roster.length;
 e.offseasonReview();let m=e.offseasonRecapModel?.(t);assert.ok(m,'review begins a factual receipt');assert.equal(m.start,start);balanced(m);
 const once=JSON.stringify(u.offseason.reports.roster);e.offseasonReview();assert.equal(JSON.stringify(u.offseason.reports.roster),once);
 e.offseasonDepartures();m=e.offseasonRecapModel(t);assert.ok(m.eligibility>0);balanced(m);
 e.offseasonEnrollment();for(const team of u.teams)balanced(e.offseasonRecapModel(team));e.offseasonPortal();for(const team of u.teams)balanced(e.offseasonRecapModel(team));
 const before=JSON.stringify(e.offseasonRecapModel(t));
 e.installSave(JSON.parse(JSON.stringify({userTeam:t.name,universe:e.packUniverse(u)})));
 assert.equal(JSON.stringify(e.offseasonRecapModel(e.universe.teams[0])),before);
});
test('manual portal placement is accounted exactly once at both schools',async()=>{
 const {e,u,t}=await setup(9502),dest=u.teams[1],p=t.roster[0];
 e.offseasonReview();
 const entry={p,from:t.name,fromSchoolId:t.id,reason:'FRESH_START'};
 assert.equal(e.placeTransfer(entry,dest),dest);balanced(e.offseasonRecapModel(t));balanced(e.offseasonRecapModel(dest));
 assert.equal(e.offseasonRecapModel(t).portalOut,1);assert.equal(e.offseasonRecapModel(dest).portalIn,1);
 assert.equal(e.placeTransfer(entry,dest),null);assert.equal(e.offseasonRecapModel(dest).portalIn,1);
});
test('opening the new season retains walk-ons, cuts and the completed receipt',async()=>{
 const {e,u,t}=await setup(9503);
 t.roster=t.roster.slice(0,3);e.offseasonReview();e.offseasonDepartures();e.offseasonEnrollment();e.offseasonPortal();
 e.runSpringCamp();e.runFallCamp();const year=u.year;assert.equal(e.offseasonPreseason(),true);
 const m=e.offseasonRecapModel(t);assert.ok(m,'last receipt remains available in the new season');assert.equal(m.year,year);assert.equal(m.complete,true);assert.ok(m.walkOns>0);assert.equal(m.current,85);balanced(m);
 const frozen=JSON.stringify(m);t.roster.pop();assert.equal(JSON.stringify(e.offseasonRecapModel(t)),frozen,'completed receipt does not drift with the next season');
 e.installSave(JSON.parse(JSON.stringify({userTeam:t.name,universe:e.packUniverse(u)})));
 assert.equal(JSON.stringify(e.offseasonRecapModel(e.universe.teams[0])),frozen);
});
test('an over-cap opening roster records actual cuts without losing the balance',async()=>{
 const {e,u,t}=await setup(9506);
 while(t.roster.length<107)t.roster.push({...t.roster[0],id:'extra-'+t.roster.length});
 e.offseasonReview();u.offseason.completed.push('spring','fall');e.offseasonPreseason();
 const m=e.offseasonRecapModel(t);assert.equal(m.start,107);assert.equal(m.cuts,2);assert.equal(m.current,105);balanced(m);
});
test('camp recap uses observed evaluations and never borrows another schools results',async()=>{
 const {e,u,t}=await setup(9507);e.offseasonReview();const p=t.roster[0],other=u.teams[1].roster[0];
 u.developmentState={year:u.year,springReport:[{id:p.id,name:p.name,pos:p.pos,perceivedDelta:2,overallDelta:90},{id:other.id,name:'Other School',perceivedDelta:50}],fallReport:[{id:p.id,name:p.name,pos:p.pos,perceivedDelta:1}],battles:[]};
 const m=e.offseasonRecapModel(t);assert.deepEqual(m.risers,[{id:p.id,name:p.name,pos:p.pos,delta:3}]);
});
test('an in-season transfer does not rewrite the prior offseason receipt',async()=>{
 const {e,u,t}=await setup(9508);e.offseasonReview();const before=JSON.stringify(u.offseason.reports.roster);
 u.phase='regular';e.placeTransfer({p:t.roster[0],from:t.name,fromSchoolId:t.id,reason:'FRESH_START'},u.teams[1]);
 assert.equal(JSON.stringify(u.offseason.reports.roster),before);
});

test('legacy progressed offseasons do not invent a starting roster',async()=>{
 const {e,u,t}=await setup(9504);u.offseason=e.makeOffseasonState(u.year,'spring',['review','departures','signing','portal']);
 assert.equal(e.offseasonRecapModel?.(t)??null,null);
});
test('recap queries are read-only and report untracked roster edits honestly',async()=>{
 const {e,u,t}=await setup(9505);e.offseasonReview();t.roster.pop();const before=JSON.stringify(u),rng=JSON.stringify(u.rng);
 const m=e.offseasonRecapModel?.(t);assert.ok(m);assert.equal(m.unexplained,-1);assert.equal(JSON.stringify(u),before);assert.equal(JSON.stringify(u.rng),rng);
});
