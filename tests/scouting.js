const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed=1601){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return{e,u:e.universe,t:e.T('Chicago Metropolitan')}}
const width=x=>x.high-x.low;

test('position-specific domains show uncertain ranges and recruiting exposure tightens them',async()=>{
 const {e,u,t}=await setup(),r=u.recruits.find(x=>x.pos==='QB');
 const initial=e.scoutingDomainView(r,t,true);assert.deepEqual(initial.map(x=>x.label),['Arm Strength','Accuracy','Processing','Mobility','Upside']);
 assert.ok(initial.every(x=>x.low<x.high&&x.confidence<100));
 const before=initial.reduce((n,x)=>n+width(x),0);r.targeted=true;e.firstRecruitEvaluation(r,t);e.refreshScoutingIntel(r,t,8,'VISIT',true);
 const after=e.scoutingDomainView(r,t,true);assert.ok(after.reduce((n,x)=>n+width(x),0)<before);assert.equal(r.scoutingHistory.length,1);
 e.firstRecruitEvaluation(r,t);assert.equal(r.scoutingHistory.length,1,'the first evaluation checkpoint is not regenerated');
});

test('experience, camps and transfers improve knowledge without revealing exact truth',async()=>{
 const {e,u,t}=await setup(1602),fresh=t.roster.find(x=>x.pos==='WR'),known=t.roster.find(x=>x.pos==='WR'&&x!==fresh);
 Object.assign(fresh,{eligibilityUsed:0,scoutConfidence:42,stats:{...fresh.stats,games:0,starts:0,snaps:0},transferHistory:[]});delete fresh.scoutingDomains;
 Object.assign(known,{eligibilityUsed:3,scoutConfidence:42,stats:{...known.stats,games:12,starts:10,snaps:620},transferHistory:[{season:u.year-1}]});delete known.scoutingDomains;
 const uncertain=e.scoutingDomainView(fresh,t),experienced=e.scoutingDomainView(known,t);
 assert.ok(experienced.reduce((n,x)=>n+width(x),0)<uncertain.reduce((n,x)=>n+width(x),0));
 const before=uncertain.reduce((n,x)=>n+width(x),0);e.refreshScoutingIntel(fresh,t,12,'CAMP');const after=e.scoutingDomainView(fresh,t);
 assert.ok(after.reduce((n,x)=>n+width(x),0)<before);assert.ok(after.every(x=>x.high>x.low),'ranges never collapse to exact truth');
 assert.equal(e.snapshotScouting(fresh,t,'FIRST_FALL_CAMP','CAMP'),true);assert.equal(e.snapshotScouting(fresh,t,'FIRST_FALL_CAMP','CAMP'),false);
 const saved=structuredClone(e.packUniverse(u)),copy=saved.teams.find(x=>x.id===t.id).roster.find(x=>x.id===fresh.id);assert.equal(copy.scoutingHistory.length,1);assert.ok(copy.scoutingDomains.route);
 delete copy.scoutingHistory;delete copy.scoutingDomains;e.universe=saved;e.normalizeUniverse();e.normalizeUniverse();assert.deepEqual(copy.scoutingHistory,[],'old saves migrate additively and idempotently');
});

test('signing-day beliefs follow a recruit into his player history',async()=>{
 const {e,u,t}=await setup(1603),r=u.recruits.find(x=>!x.committed&&e.canTakeCommit(t.name));r.targeted=true;e.firstRecruitEvaluation(r,t);assert.equal(e.commitRecruit(r,t.name),true);
 u.phase='complete';u.developmentState={year:u.year,springRun:true,fallRun:true,springReport:[],fallReport:[],battles:[]};e.runOffseason();
 const p=t.roster.find(x=>x.name===r.name);assert.ok(p);assert.deepEqual(p.scoutingHistory.map(x=>x.phase),['FIRST_EVALUATION','SIGNING_DAY']);assert.equal(Object.keys(p.scoutingDomains).length,5);
});
