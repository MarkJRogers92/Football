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
