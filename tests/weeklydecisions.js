const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 e.universe.weeklyDecisions=[];return {e,u:e.universe,t:e.T('Chicago Metropolitan')};
}

test('the coach desk creates at most three persistent decisions from real state',async()=>{
 const {e,u,t}=await setup(1401),starters=e.importantStarters(t);
 Object.assign(starters[0],{health:72,wear:74,injuryWeeks:0,redshirtActive:false});
 const rs=t.roster.find(p=>p.id!==starters[0].id);Object.assign(rs,{redshirtUsed:false,redshirtActive:false,eligibilityUsed:0});rs.stats.games=3;
 const concern=t.roster.find(p=>p.id!==starters[0].id&&p.id!==rs.id);Object.assign(concern,{role:'Development',morale:18,redshirtActive:false});
 u.recruits.slice(0,2).forEach((r,i)=>Object.assign(r,{targeted:true,committed:null,visitWeek:null,stars:5-i}));
 const made=e.ensureWeeklyDecisions(t);
 assert.equal(made.length,3);assert.equal(new Set(made.map(d=>d.type)).size,3);
 assert.deepEqual(e.ensureWeeklyDecisions(t).map(d=>d.id),made.map(d=>d.id),'rendering again must not duplicate choices');
});

test('injury choices alter availability and resolve into the event ledger',async()=>{
 const {e,u,t}=await setup(1402),p=e.importantStarters(t)[0];Object.assign(p,{health:70,wear:76,injuryWeeks:0,redshirtActive:false});
 const d=e.ensureWeeklyDecisions(t).find(x=>x.type==='INJURED_STARTER');assert.ok(d);
 assert.equal(e.resolveWeeklyDecision(d.id,'sit'),true);assert.equal(e.weeklyPlayerPlan(p).role,'sit');
 assert.ok(u.events.some(x=>x.type==='WEEKLY_DECISION_RESOLVED'&&x.metadata.decisionId===d.id));
});

test('redshirt choices disclose and respect an existing no-redshirt promise',async()=>{
 const {e,u,t}=await setup(1403),p=t.roster.find(x=>!e.importantStarters(t).includes(x));
 Object.assign(p,{redshirtUsed:false,redshirtActive:false,eligibilityUsed:0,promises:[{id:'PR_test',type:'NO_REDSHIRT',status:'ACTIVE',schoolId:t.id,firstSeason:u.year}]});p.stats.games=4;
 const d=e.ensureWeeklyDecisions(t).find(x=>x.type==='REDSHIRT_DECISION');assert.ok(d.summary.includes('No Redshirt'));
 assert.equal(d.options.find(x=>x.id==='continue').recommended,true);e.resolveWeeklyDecision(d.id,'preserve');assert.equal(p.redshirtActive,true);
});

test('playing-time and recruiting resolutions reuse rotation, promises and visits',async()=>{
 const a=await setup(1404),p=a.t.roster.find(x=>!a.e.importantStarters(a.t).includes(x));Object.assign(p,{role:'Development',morale:15,redshirtActive:false});
 let d=a.e.ensureWeeklyDecisions(a.t).find(x=>x.type==='PLAYING_TIME_CONCERN');assert.ok(d);a.e.resolveWeeklyDecision(d.id,'promise');assert.ok(p.promises.some(q=>q.type==='EARLY_ROLE'&&q.status==='ACTIVE'));
 const b=await setup(1405),pair=b.u.recruits.slice(0,2);pair.forEach(r=>Object.assign(r,{targeted:true,committed:null,visitWeek:null}));
 d=b.e.ensureWeeklyDecisions(b.t).find(x=>x.type==='RECRUITING_PRIORITY');assert.ok(d);const chosen=pair[0];b.e.resolveWeeklyDecision(d.id,`prioritize_${chosen.id}`);assert.ok(chosen.visitWeek);
});

test('simulating the whole season delegates cards instead of stopping the calendar',async()=>{
 const {e,u,t}=await setup(1406),p=e.importantStarters(t)[0];Object.assign(p,{health:70,wear:75,injuryWeeks:0,redshirtActive:false});
 assert.ok(e.ensureWeeklyDecisions(t).length);e.simSeason();assert.equal(u.phase,'confReady');
 assert.ok(u.weeklyDecisions.some(d=>d.resolvedOptionId==='delegate'));
});
