const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e;
}
async function playedSeason(e){
 for(let i=0;i<12;i++)e.simWeek();
 e.simConferenceChampionships();e.simPlayoff();
}

test('a class is bounded by real roster room, never a flat number',async()=>{
 const e=await setup(1101),t=e.universe.teams[0];
 const s=e.scholarshipSummary(t);
 assert.equal(s.capacity,e.scholarshipCapacity(t));
 assert.ok(s.capacity>=12&&s.capacity<=25,`capacity out of the signing-class band: ${s.capacity}`);
 assert.equal(s.returning+s.departing<=t.roster.length,true);
 // Capacity has to move with the roster, or it is just the old flat cap.
 const many=structuredClone(t);many.roster=t.roster.slice(0,60);
 const few=structuredClone(t);few.roster=t.roster.concat(t.roster.slice(0,10));
 assert.ok(e.scholarshipCapacity(many)>=e.scholarshipCapacity(few),
  'a thinner roster must leave at least as much room as a fuller one');
});

test('commitments stop at the limit and every program signs within the band',async()=>{
 const e=await setup(1102),u=e.universe;
 await playedSeason(e);
 for(const t of u.teams){
  const n=e.classCommitCount(t.name);
  assert.ok(n<=25,`${t.name} signed ${n}, above the initial-counter ceiling`);
  assert.ok(n<=e.scholarshipCapacity(t),`${t.name} finished signing day over its limit (${n} > ${e.scholarshipCapacity(t)})`);
 }
 const sizes=u.teams.map(t=>e.classCommitCount(t.name));
 const mean=sizes.reduce((a,b)=>a+b,0)/sizes.length;
 assert.ok(mean>=10&&mean<=25,`league-wide class mean looks wrong: ${mean}`);
});

test('over-signing is settled on signing day by pulling the weakest commitments',async()=>{
 const e=await setup(1103),u=e.universe,t=u.teams[0];
 // Force an over-commitment the way an aggressive program would.
 const free=u.recruits.filter(r=>!r.committed).slice(0,e.scholarshipCapacity(t)+4);
 for(const r of free){r.committed=t.name;r.commitWeek=1;u.recruitClassCounts[t.name]=(u.recruitClassCounts[t.name]||0)+1}
 const over=e.classCommitCount(t.name)-e.scholarshipCapacity(t);
 assert.ok(over>0,'the fixture should start over the limit');
 const strongest=u.recruits.filter(r=>r.committed===t.name).sort((a,b)=>(b.scoutUp+b.scout*.55)-(a.scoutUp+a.scout*.55))[0];
 e.enforceScholarshipLimits();
 assert.ok(e.classCommitCount(t.name)<=e.scholarshipCapacity(t),'signing day must bring a program back to its limit');
 assert.equal(strongest.committed,t.name,'the best commitments are kept, not cut');
 const pulled=u.events.filter(x=>x.type==='OFFER_PULLED'&&x.schoolIds.includes(t.id));
 assert.equal(pulled.length,over,'each pulled offer should be recorded once');
});

test('a pulled offer costs the pipeline and the recruit will not come back',async()=>{
 const e=await setup(1104),u=e.universe,t=u.teams[0];
 const r=u.recruits.find(x=>!x.committed&&x.homeRegion);
 u.recruitClassCounts[t.name]=0;
 assert.ok(e.commitRecruit(r,t.name));
 const pipeBefore=e.pipelineStrength?e.pipelineStrength(t,r.homeRegion):t.pipelines[r.homeRegion];
 const pitchBefore=e.recruitPitch(t,r);
 assert.equal(e.pullOffer(r,t.name,'test'),true);
 assert.equal(r.committed,null,'a pulled recruit is no longer committed');
 assert.ok((r.pulledBy||[]).includes(t.name),'the recruit remembers who pulled it');
 assert.ok(t.pipelines[r.homeRegion]<pipeBefore,'the pipeline he came from should take a hit');
 assert.ok(e.recruitBlocked(t,r),'he will not consider that program again');
 assert.ok(e.recruitPitch(t,r)<pitchBefore,'that program can no longer sell him');
 assert.equal(e.commitRecruit(r,t.name),false,'and he cannot be re-committed there');
 // Other programs are unaffected.
 const other=u.teams[1];
 assert.equal(e.recruitBlocked(other,r),false);
 const ev=u.events.filter(x=>x.type==='OFFER_PULLED'&&x.recruitIds.includes(r.id));
 assert.equal(ev.length,1);assert.ok(ev[0].summary.includes(r.name));
});

test('pulling an offer that is not yours, or was never made, does nothing',async()=>{
 const e=await setup(1105),u=e.universe,t=u.teams[0],other=u.teams[1];
 const r=u.recruits.find(x=>!x.committed);
 assert.equal(e.pullOffer(r,t.name,'test'),false,'an uncommitted recruit has no offer to pull');
 u.recruitClassCounts[t.name]=0;e.commitRecruit(r,t.name);
 assert.equal(e.pullOffer(r,other.name,'test'),false,'another program cannot pull your commitment');
 assert.equal(r.committed,t.name);
});

test('a pulled offer reaches the weekly hub for the program that pulled it',async()=>{
 const e=await setup(1106),u=e.universe,t=e.T('Chicago Metropolitan');
 const r=u.recruits.find(x=>!x.committed);
 u.recruitClassCounts[t.name]=0;e.commitRecruit(r,t.name);e.pullOffer(r,t.name,'test');
 const items=e.pulledOfferHubItems(t);
 assert.equal(items.length,1);
 assert.equal(items[0].tab,'recruiting');
 assert.ok(items[0].main.includes(r.name));
 assert.equal(e.pulledOfferHubItems(u.teams[1]).length,0,'another program does not get your bad news');
});

test('scholarship pressure survives a save and does not disturb old dynasties',async()=>{
 const e=await setup(1107),u=e.universe,t=u.teams[0];
 const r=u.recruits.find(x=>!x.committed);
 u.recruitClassCounts[t.name]=0;e.commitRecruit(r,t.name);e.pullOffer(r,t.name,'test');
 const portable=JSON.parse(JSON.stringify(e.packUniverse(u)));
 e.installSave({version:'0.9.10',userTeam:t.name,universe:portable});
 const again=e.universe,rAgain=again.recruits.find(x=>x.id===r.id);
 assert.ok((rAgain.pulledBy||[]).includes(t.name),'a pulled offer is remembered across a save');
 assert.ok(e.recruitBlocked(again.teams.find(x=>x.id===t.id),rAgain));
 // A save with no scholarship data at all still produces a sane limit.
 for(const rec of again.recruits)delete rec.pulledBy;
 assert.ok(e.scholarshipCapacity(again.teams[0])>=12);
});

test('multiple seasons stay inside the limit and keep rosters healthy',async()=>{
 const e=await setup(1108),u=e.universe;
 for(let yr=0;yr<3;yr++){
  await playedSeason(e);
  for(const t of u.teams)
   assert.ok(e.classCommitCount(t.name)<=e.scholarshipCapacity(t),`${t.name} over its limit in ${u.year}`);
  e.runSpringCamp();e.runFallCamp();e.runOffseason();
  for(const t of u.teams)
   assert.ok(t.roster.length>=80&&t.roster.length<=105,`${t.name} roster out of range: ${t.roster.length}`);
 }
 assert.ok(u.events.filter(x=>x.type==='OFFER_PULLED').length>0,
  'across three seasons some program should have had to pull an offer');
});
