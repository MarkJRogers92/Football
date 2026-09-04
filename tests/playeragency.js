const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');u.week=3;u.weeklyDecisions=[];
 for(const p of t.roster){Object.assign(p,{health:100,wear:0,injuryWeeks:0,morale:90,staffTrust:70,role:'Rotation',redshirtUsed:true,redshirtActive:false,promises:[]});p.stats.games=3}
 for(const r of u.recruits)r.targeted=false;
 return{e,u,t};
}
function addAndResolve(e,u,d,choice){assert.ok(d);u.weeklyDecisions.push(d);assert.equal(e.resolveWeeklyDecision(d.id,choice),true)}

test('players initiate all five bounded conversation types from existing state',async()=>{
 let x=await setup(1501),p=x.t.roster[0];Object.assign(p,{morale:50,role:'Rotation'});p.stats.games=0;
 let d=x.e.playerAgencyDecision(x.t);assert.equal(d.type,'PLAYER_PLAYING_TIME_COMPLAINT');const before=p.morale;addAndResolve(x.e,x.u,d,'rotation');assert.ok(p.morale>before);

 x=await setup(1502);p=x.t.roster[0];Object.assign(p,{morale:15,role:'Rotation',promises:[{id:'old',type:'EARLY_ROLE',status:'BROKEN',schoolId:x.t.id,resolvedSeason:x.u.year,transferPenalty:30}]});
 d=x.e.playerAgencyDecision(x.t);assert.equal(d.type,'PLAYER_TRANSFER_CONCERN');const risk=x.e.transferRisk(p);addAndResolve(x.e,x.u,d,'reassure');assert.ok(x.e.transferRisk(p)<risk);

 x=await setup(1503);p=x.t.roster[0];Object.assign(p,{morale:60,redshirtUsed:false,redshirtActive:true,eligibilityUsed:0});p.stats.games=0;
 d=x.e.playerAgencyDecision(x.t);assert.equal(d.type,'PLAYER_REDSHIRT_DISCUSSION');addAndResolve(x.e,x.u,d,'continue');assert.equal(p.redshirtActive,false);

 x=await setup(1504);const ids=x.t.depthChart.RB,p2=x.t.roster.find(q=>q.id===ids[1]),top=x.t.roster.find(q=>q.id===ids[0]);Object.assign(p2,{morale:60,perceived:top.perceived,role:'Rotation'});p2.stats.games=0;
 d=x.e.playerAgencyDecision(x.t);assert.equal(d.type,'PLAYER_ROLE_REQUEST');addAndResolve(x.e,x.u,d,'grant');assert.equal(p2.role,'Starter mix');

 x=await setup(1505);p=x.t.roster[0];Object.assign(p,{pos:'DT',height:74,weight:240,power:88,speed:76,technique:78,versatility:82,morale:90,role:'Development'});
 d=x.e.playerAgencyDecision(x.t);assert.equal(d.type,'PLAYER_POSITION_CHANGE_REQUEST');const to=d.requestedPosition;addAndResolve(x.e,x.u,d,'approve');assert.equal(p.pos,to);assert.equal(p.requestedPositionChange.status,'APPROVED');
});

test('player interactions stay sparse, persist once and use the existing ledger',async()=>{
 const {e,u,t}=await setup(1506),p=t.roster[0];Object.assign(p,{morale:50,role:'Rotation'});p.stats.games=0;
 const made=e.ensureWeeklyDecisions(t),agency=made.find(d=>d.source==='PLAYER');assert.ok(agency);assert.deepEqual(e.ensureWeeklyDecisions(t).map(d=>d.id),made.map(d=>d.id));
 assert.equal(e.resolveWeeklyDecision(agency.id,'keep'),true);assert.ok(u.events.some(ev=>ev.metadata?.decisionSource==='PLAYER'));
 u.weeklyDecisions.push(...[0,1].map(i=>({...agency,id:`prior_${i}`,week:u.week-1-i,playerId:`other_${i}`,subjectId:`other_${i}`,resolved:true})));
 assert.equal(e.playerInteractionWindow(t),3);assert.equal(e.playerAgencyDecision(t),null,'rolling month cap prevents excess conversations');
 const saved=structuredClone(e.packUniverse(u));assert.equal(saved.weeklyDecisions.filter(d=>d.source==='PLAYER').length,3);
 delete saved.weeklyDecisions[0].source;e.universe=saved;e.normalizeUniverse();e.normalizeUniverse();
 assert.equal(e.universe.weeklyDecisions[0].source,'STAFF','old records migrate idempotently without a schema change');
});
