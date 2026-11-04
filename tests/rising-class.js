const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.13.0: multi-year recruiting. Next year's top prospects exist now; watching one carries a
// relationship head start across the class rollover.
async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 return e;
}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const eliteShare=pool=>pool.filter(r=>r.stars>=4).length/pool.length;

test('a new universe already has a rising class of the best prospects of a full class',async()=>{
 const e=await setup(9901),u=e.universe;
 assert.equal(u.risingClass.length,e.RISING_CLASS_SIZE);
 assert.equal(new Set(u.risingClass.map(r=>r.id)).size,u.risingClass.length,'ids are unique');
 const current=new Set(u.recruits.map(r=>r.id));
 assert.ok(u.risingClass.every(r=>!current.has(r.id)),'no prospect is in both classes');
 assert.ok(u.risingClass.every(r=>r.rising===true&&r.watch===false&&!r.committed));
 assert.ok(mean(u.risingClass.map(r=>r.trueNow))>mean(u.recruits.map(r=>r.trueNow))+5,'the rising class is the top of a class, not a random slice');
});

test('the watchlist toggles and is capped',async()=>{
 const e=await setup(9902),u=e.universe;
 const ids=u.risingClass.slice(0,e.WATCHLIST_LIMIT+3).map(r=>r.id);
 for(const id of ids.slice(0,e.WATCHLIST_LIMIT))assert.deepEqual(e.toggleRisingWatch(id),{ok:true,watching:true});
 assert.deepEqual(e.toggleRisingWatch(ids[e.WATCHLIST_LIMIT]),{ok:false,reason:'limit'},'the sixteenth watch is refused');
 assert.deepEqual(e.toggleRisingWatch(ids[0]),{ok:true,watching:false},'unwatching frees a slot');
 assert.deepEqual(e.toggleRisingWatch(ids[e.WATCHLIST_LIMIT]),{ok:true,watching:true});
 assert.deepEqual(e.toggleRisingWatch('nobody'),{ok:false,reason:'not-found'});
 assert.equal(u.risingClass.filter(r=>r.watch).length,e.WATCHLIST_LIMIT);
});

test('rolling the class promotes the rising prospects and gives watched ones a head start',async()=>{
 const e=await setup(9903),u=e.universe;
 const rising=u.risingClass.slice(),watched=rising.slice(0,4),plain=rising[10];
 for(const r of watched)e.toggleRisingWatch(r.id);
 const before=Object.fromEntries(watched.map(r=>[r.id,{rel:r.relationship,int:r.interest}]));
 const oldIds=new Set(u.recruits.map(r=>r.id)),oldRising=new Set(rising.map(r=>r.id));
 e.rollRecruitClass();
 assert.equal(u.recruits.length,2800,'the class is the usual size');
 const byId=new Map(u.recruits.map(r=>[r.id,r]));
 assert.ok(rising.every(r=>byId.has(r.id)),'every rising prospect is in the new class');
 assert.ok(u.recruits.every(r=>!oldIds.has(r.id)||oldRising.has(r.id)),'nothing else carries over from the old class');
 for(const w of watched){
  const r=byId.get(w.id);
  assert.equal(r.targeted,true,`${w.name} arrives on the board`);
  assert.equal(r.watchedHeadStart,true);
  assert.equal(r.relationship,Math.min(100,before[w.id].rel+12),'relationship head start');
  assert.equal(r.interest,Math.min(100,before[w.id].int+8),'interest head start');
 }
 assert.equal(byId.get(plain.id).targeted,false,'an unwatched prospect is not targeted');
 assert.equal(u.recruits.filter(r=>r.targeted).length,4,'only the watched prospects are targeted');
 assert.ok(u.recruits.every(r=>r.watch===undefined),'the watch flag does not leak into the live class');
 assert.deepEqual(u.lastRisingCarry,{year:u.year,carried:4});
 const ranks=u.recruits.map(r=>r.nationalRank).sort((a,b)=>a-b);
 assert.equal(ranks[0],1);assert.equal(ranks.at(-1),2800);assert.equal(new Set(ranks).size,2800,'national ranks are reassigned over the whole class');
 assert.equal(u.risingClass.length,e.RISING_CLASS_SIZE,'a fresh rising class follows');
 assert.ok(u.risingClass.every(r=>!byId.has(r.id)),'the new rising class is different prospects');
});

test('rolling the class does not inflate talent',async()=>{
 const e=await setup(9904),u=e.universe;
 const rolled=[],fresh=[];
 for(let i=0;i<4;i++){e.rollRecruitClass();rolled.push(u.recruits.slice());fresh.push(e.generateRecruitPool(2800))}
 const m=a=>mean(a.map(p=>mean(p.map(r=>r.trueNow)))),el=a=>mean(a.map(eliteShare));
 assert.ok(Math.abs(m(rolled)-m(fresh))<1,`mean trueNow ${m(rolled).toFixed(2)} vs ${m(fresh).toFixed(2)}`);
 assert.ok(el(rolled)/el(fresh)>.85&&el(rolled)/el(fresh)<1.15,`4-5 star share ${el(rolled).toFixed(3)} vs ${el(fresh).toFixed(3)}`);
});

test('a full offseason carries a watched prospect onto the next board',async()=>{
 const e=await setup(9905),u=e.universe;
 const pick=u.risingClass[5];e.toggleRisingWatch(pick.id);
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason();
 assert.equal(u.year,2028);
 const r=u.recruits.find(x=>x.id===pick.id);
 assert.ok(r,'the watched prospect is in the new class');
 assert.equal(r.targeted,true);assert.equal(r.watchedHeadStart,true);
 assert.equal(u.risingClass.length,e.RISING_CLASS_SIZE);
});

// --- v0.14.0: scouting and early commitments make the rising class contested -------------------

// Mirrors what the offseason does before it calls applyEarlyCommitments().
function rollAndPursue(e){
 const u=e.universe;
 e.rollRecruitClass();u.recruitClassCounts={};u.teams.forEach(t=>{t.commits=[]});
 return e.applyEarlyCommitments();
}

test('scouting a watched rising prospect works and its completion carries across the rollover',async()=>{
 const e=loadEngine({seed:9911,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const u=e.universe,t=u.teams.find(x=>x.name==='Chicago Metropolitan');
 const prospect=u.risingClass[3];e.toggleRisingWatch(prospect.id);
 assert.equal(e.findRecruitAnyClass(prospect.id),prospect,'the lookup finds a rising prospect');
 assert.ok(e.findRecruitAnyClass(u.recruits[0].id),'and a current-class recruit');
 assert.equal(e.findRecruitAnyClass('nobody'),null);
 const before=e.scoutingHoursInfo(t);
 // Mark film as reviewed the way performScoutingAction records it.
 const rec=e.recruitScoutingRecord(prospect,t,true);rec.quick=true;
 assert.equal(e.recruitScoutingRecord(prospect,t,false).quick,true);
 e.rollRecruitClass();
 const promoted=u.recruits.find(r=>r.id===prospect.id);
 assert.equal(e.recruitScoutingRecord(promoted,t,false).quick,true,'Film Reviewed survives the season change');
 assert.ok(before.budget>=8&&before.left<=before.budget);
});

test('early commitments: only rising prospects, only to rivals, within the pool, counts consistent',async()=>{
 const e=await setup(9912),u=e.universe,user='Chicago Metropolitan';
 for(const r of u.risingClass.slice(0,6))e.toggleRisingWatch(r.id);
 const log=rollAndPursue(e);
 const early=u.recruits.filter(r=>r.earlyCommit);
 assert.equal(log.total,early.length);
 assert.ok(early.length>0&&early.length<=e.EARLY_COMMIT_POOL,`some, never more than the pool (${early.length})`);
 assert.ok(early.every(r=>r.fromRisingClass&&r.committed&&r.committed!==user&&r.commitWeek===0),'rising prospects commit to rivals at week 0');
 assert.ok(early.every(r=>r.nationalRank<=u.recruits.filter(x=>x.fromRisingClass).length),'drawn from the rising class');
 const top=new Set(u.recruits.filter(r=>r.fromRisingClass).sort((a,b)=>a.nationalRank-b.nationalRank).slice(0,e.EARLY_COMMIT_POOL).map(r=>r.id));
 assert.ok(early.every(r=>top.has(r.id)),'only the top of the class is eligible');
 assert.ok(early.every(r=>r.stars>=3),'only 3-star and better lock early');
 assert.ok(u.recruits.filter(r=>!r.fromRisingClass).every(r=>!r.committed),'the rest of the class is untouched');
 for(const t of u.teams){
  const n=u.recruits.filter(r=>r.committed===t.name).length;
  assert.equal(e.classCommitCount(t.name),n,`${t.name} class count matches its commits`);
  assert.equal(t.commits.length,n);
  assert.ok(n<=e.scholarshipCapacity(t)+3,`${t.name} stays within its scholarship room`);
 }
 assert.equal(log.watched,6);assert.equal(log.kept+log.lost.length,log.watched);
 assert.ok(log.lost.every(x=>u.recruits.find(r=>r.id===x.id).committed===x.to&&x.to!==user));
 assert.deepEqual(u.earlyCommitLog,log);
});

test('watching a prospect protects him from an early commitment',async()=>{
 const e=await setup(9913),u=e.universe;
 let watchedEarly=0,watchedN=0,openEarly=0,openN=0;
 for(let cycle=0;cycle<36;cycle++){
  const top=u.risingClass.slice().sort((a,b)=>a.nationalRank-b.nationalRank).slice(0,15),watching=cycle%2===0;
  if(watching)for(const r of top)e.toggleRisingWatch(r.id);
  const ids=new Set(top.map(r=>r.id));
  rollAndPursue(e);
  for(const r of u.recruits)if(ids.has(r.id)){
   if(watching){watchedN++;if(r.earlyCommit)watchedEarly++}else{openN++;if(r.earlyCommit)openEarly++}
  }
 }
 const watched=watchedEarly/watchedN,open=openEarly/openN;
 assert.ok(open>.12,`unwatched top prospects are often locked early (${(open*100).toFixed(0)}%)`);
 assert.ok(watched<open*.7,`watched ones are protected: ${(watched*100).toFixed(0)}% vs ${(open*100).toFixed(0)}% locked early`);
 assert.ok(watched>0,'protection is not absolute: a watched prospect can still be lost');
});

test('early commitments do not distort the class or the season that follows',async()=>{
 const e=await setup(9914),u=e.universe;
 for(let i=0;i<3;i++){
  const before=u.recruits.length;
  const log=rollAndPursue(e);
  assert.equal(u.recruits.length,2800);assert.ok(log.total<60,`a modest number lock early (${log.total})`);
 }
 // A real offseason still reaches the next season and the class fills normally.
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason();
 const sizes=u.teams.map(t=>u.recruits.filter(r=>r.committed===t.name).length);
 assert.equal(u.year,2028);assert.ok(Math.max(...sizes)<=28&&Math.min(...sizes)>=0);
 assert.ok(u.earlyCommitLog&&u.earlyCommitLog.year===2028,'the offseason ran the early-commit step');
});
