const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed=1601){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return{e,u:e.universe,t:e.T('Chicago Metropolitan')}}
const width=x=>x.high-x.low;

test('position-specific domains show uncertain ranges and recruiting exposure tightens them',async()=>{
 const {e,u,t}=await setup(),r=u.recruits.find(x=>x.pos==='QB');
 assert.equal(e.hasPlayerTraits(r),true,'new recruits carry persistent position traits');
 const arm=e.scoutingDefs(r).find(x=>x[0]==='arm');
 assert.equal(e.scoutingTruth(r,arm,true),Math.round(r.power*.7+r.technique*.3),'scouting evaluates the recruit traits that will survive signing');
 const packed=e.packUniverse(u).recruits.find(x=>x.id===r.id);
 assert.deepEqual(e.playerTraitFields(packed),e.playerTraitFields(r),'portable saves retain recruit identity');
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
 const identity=e.playerTraitFields(r);
 u.phase='complete';u.developmentState={year:u.year,springRun:true,fallRun:true,springReport:[],fallReport:[],battles:[]};e.runOffseason();
 const p=t.roster.find(x=>x.name===r.name);assert.ok(p);assert.deepEqual(e.playerTraitFields(p),identity,'the signed player keeps the exact traits that were scouted');assert.deepEqual(p.scoutingHistory.map(x=>x.phase),['FIRST_EVALUATION','SIGNING_DAY']);assert.equal(Object.keys(p.scoutingDomains).length,5);
});

test('legacy recruits remain loadable and are labeled honestly',async()=>{
 const {e,u,t}=await setup(1604),r=u.recruits.find(x=>x.pos==='RB');
 for(const key of Object.keys(e.playerTraitFields(r)))delete r[key];
 assert.equal(e.hasPlayerTraits(r),false);
 assert.doesNotThrow(()=>e.scoutingDomainView(r,t,true));
 assert.match(e.scoutingPanelHTML(r,t,true),/Legacy evaluation/);
});

test('scheme-fit recruits react to their actual traits and the offered scheme',async()=>{
 const {e,u,t}=await setup(1605),r=u.recruits.find(x=>x.pos==='RB');
 Object.assign(r,{priority:'Scheme Fit',speed:95,versatility:94,iq:91,power:42,technique:44,durability:46});
 t.offScheme='Option Motion';const optionFit=e.recruitSchemeFit(t,r),optionPriority=e.recruitSchemePriority(t,r);
 t.offScheme='Ground Pressure';const groundFit=e.recruitSchemeFit(t,r),groundPriority=e.recruitSchemePriority(t,r);
 assert.ok(optionFit>groundFit+35,`${optionFit} option fit vs ${groundFit} ground fit`);
 assert.ok(optionPriority>groundPriority,'the recruiting preference follows the same fit');
 const shown=e.recruitPitchBreakdown(t,r).find(x=>x[0]==='Scheme Fit priority');
 assert.equal(shown[1],groundPriority,'the visible pitch breakdown matches the recruiting engine');
});
