const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed=9531){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();e.universe.phase='complete';e.universe.offseason=e.makeOffseasonState(e.universe.year,'spring',['review','departures','signing','portal']);return{e,u:e.universe,t:e.T('Chicago Metropolitan')}}

test('development delta captures compact, exact changes',()=>{
 const e=loadEngine({seed:9532}),before={trueNow:70,perceived:68,perceivedUpside:80,speed:75,power:65,technique:70,iq:69,composure:72,durability:71,versatility:66,height:72,weight:210,familiarity:80,scoutConfidence:50,health:90,wear:12},after={...before,trueNow:73,perceived:72,power:67,technique:71,weight:217,familiarity:91,scoutConfidence:61};
 const d=e.developmentDelta(before,after);
 assert.equal(d.overallDelta,3);assert.equal(d.perceivedDelta,4);assert.equal(d.attr.power,2);assert.equal(d.attr.technique,1);assert.equal(d.weightDelta,7);assert.equal(d.familiarityDelta,11);assert.equal(d.confidenceDelta,11);
 assert.deepEqual(Object.keys(d.attr),['speed','power','technique','iq','composure','durability','versatility']);
});

test('spring and fall produce distinct detailed reports that survive packing',async()=>{
 const {e,u,t}=await setup(),rosterCount=t.roster.length;
 e.runSpringCamp();
 const spring=structuredClone(u.developmentState.springReport);
 assert.equal(spring.length,rosterCount);assert.ok(spring.every(x=>x.phase==='SPRING'&&x.attr&&Number.isFinite(x.overallDelta)&&x.delta===x.overallDelta));
 assert.ok(spring.every(x=>!('before' in x)&&!('after' in x)&&!('player' in x)),'reports store deltas, not duplicated players');
 assert.ok(t.roster.every(p=>p.campHistory.some(h=>h.year===u.year&&h.phase==='Spring')));
 e.runFallCamp();
 const fall=u.developmentState.fallReport;
 assert.equal(fall.length,rosterCount);assert.ok(fall.every(x=>x.phase==='FALL'&&x.grade));assert.deepEqual(u.developmentState.springReport,spring);
 const packed=e.packUniverse(u);assert.equal(packed.developmentState.springReport.length,rosterCount);assert.equal(packed.developmentState.fallReport.length,rosterCount);
});

test('development summaries reconcile to report entries',async()=>{
 const {e,u}=await setup(9533);e.runSpringCamp();const report=u.developmentState.springReport,summary=e.developmentTeamSummary(report),groups=e.developmentGroupSummary(report);
 assert.equal(summary.players,report.length);assert.equal(summary.improved,report.filter(x=>x.overallDelta>0).length);assert.equal(groups.reduce((n,g)=>n+g.players,0),report.length);
 for(const group of groups){const rows=report.filter(x=>x.pos===group.pos);assert.equal(group.totalOverall,rows.reduce((n,x)=>n+x.overallDelta,0));assert.equal(group.improved,rows.filter(x=>x.overallDelta>0).length)}
});
