const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness.js');

// v0.15.1 — long dynasties. Events are the part of the core save that grows without limit, and a postseason stage
// used to copy the whole universe (archives included) three times a season, so it slowed every year.
const USER='Chicago Metropolitan';

function finishOffseason(e){
 const u=()=>e.universe;let guard=0;
 while(u().phase==='complete'&&guard++<40){
  if((u().jobOffers||[]).length){e.acceptPost(u().jobOffers[0].schoolId);continue}
  const ph=u().offseason?.phase;
  if(ph==='spring'){e.runSpringCamp();continue}
  if(ph==='fall'){e.runFallCamp();continue}
  if(!e.advanceOffseasonPhase())break;
 }
 if(u().phase==='preseason')e.beginSeason();
}

let rolled=null;
async function rolledDynasty(){
 if(rolled)return rolled;
 const e=loadEngine({seed:4711,fullRuntime:true});
 await e.loadSchools();e.setUserTeam(USER);e.initUniverse();
 for(let s=0;s<4;s++){
  if(e.universe.phase==='preseason')e.beginSeason();
  e.simSeason();e.simConferenceChampionships();e.simBowls();e.simPlayoff();e.runSpringCamp();e.runFallCamp();finishOffseason(e);
 }
 rolled=e;return e;
}

test('old career-ended stories leave the ledger unless the coach led that program',async()=>{
 const e=await rolledDynasty(),u=e.universe,cutoff=u.compactionManifest.at(-1).cutoff;
 const led=new Set([USER,...(u.careerHistory||[]).map(x=>x.school),u.tenure?.school].filter(Boolean));
 const ledIds=new Set(u.teams.filter(t=>led.has(t.name)).map(t=>t.id));
 const old=u.events.filter(x=>x.season<=cutoff&&x.type==='COLLEGE_CAREER_ENDED');
 assert.ok(old.every(x=>x.schoolIds.some(id=>ledIds.has(id))),'only programs the coach led keep old career-ended stories');
 assert.ok(u.events.some(x=>x.season>cutoff&&x.type==='COLLEGE_CAREER_ENDED'&&!x.schoolIds.some(id=>ledIds.has(id))),'recent seasons keep every program\'s stories');
 const m=u.compactionManifest.at(-1);
 assert.ok(m.eventsDropped>0,'the manifest records what was dropped');
});

test('old breakouts are slimmed, keeping everything a reader shows',async()=>{
 const e=await rolledDynasty(),u=e.universe,cutoff=u.compactionManifest.at(-1).cutoff;
 const old=u.events.filter(x=>x.season<=cutoff&&x.type==='PLAYER_BREAKOUT');
 assert.ok(old.length>0,'there are old breakouts to check');
 for(const x of old){
  assert.equal(x.slim,true);
  assert.equal(x.metadata.storyType,'BREAKOUT','the story surfaces still find it');
  assert.ok(x.storyId&&x.summary&&Array.isArray(x.gameIds)&&Array.isArray(x.playerIds)&&Array.isArray(x.schoolIds));
  assert.equal(x.metadata.statLine,undefined,'the stat line lives in the summary');
 }
 const fresh=u.events.filter(x=>x.season>cutoff&&x.type==='PLAYER_BREAKOUT');
 assert.ok(fresh.every(x=>!x.slim&&x.metadata.statLine),'recent breakouts keep their full detail');
});

test('compaction is idempotent, and a story recorded before it is never recorded again',async()=>{
 const e=await rolledDynasty(),u=e.universe;
 e.compactHistoryArchive();
 const n=u.events.length;
 assert.deepEqual(e.compactHistoryArchive(),{events:0,dropped:0,camps:0});
 assert.equal(u.events.length,n);
 const kept=u.events.find(x=>x.slim&&x.storyId);
 assert.equal(globalThis.__DL_TEST__.playerEvidenceStoryRecorded(kept.storyId),true,'the story index still sees slimmed stories');
});

test('a profile still shows a career that ended before the horizon, once',async()=>{
 const e=await rolledDynasty(),u=e.universe,cutoff=u.compactionManifest.at(-1).cutoff;
 const storyFor=new Set(u.events.filter(x=>x.type==='COLLEGE_CAREER_ENDED').flatMap(x=>x.playerIds.map(String)));
 const gone=u.playerArchive.find(p=>p.exitReason==='Eligibility exhausted'&&p.retiredYear<=cutoff&&!storyFor.has(String(p.id)));
 assert.ok(gone,'a player whose story was compacted away');
 const html=e.careerChronologyHTML(gone);
 assert.match(html,/COLLEGE CAREER ENDED/);
 assert.equal((html.match(/completed his college eligibility/g)||[]).length,1);
 const kept=u.playerArchive.find(p=>p.exitReason==='Eligibility exhausted'&&storyFor.has(String(p.id)));
 assert.equal((e.careerChronologyHTML(kept).match(/completed his college eligibility/g)||[]).length,1,'a stored story is not doubled');
});

test('old camp reports drop their zero deltas and keep their rows',async()=>{
 const e=await rolledDynasty(),u=e.universe,cutoff=u.year-e.EVENT_DETAIL_HORIZON;
 e.compactHistoryArchive();
 const years=Object.keys(u.campHistory).map(Number);
 const old=years.filter(y=>y<=cutoff),fresh=years.filter(y=>y>cutoff);
 assert.ok(old.length&&fresh.length);
 for(const y of old){
  const ds=u.campHistory[y];assert.equal(ds.slim,true);
  assert.ok(ds.springReport.length>0);
  for(const r of ds.springReport){assert.ok(r.id&&r.name);for(const v of Object.values(r.attr||{}))assert.notEqual(v,0)}
 }
 for(const y of fresh)assert.ok(!u.campHistory[y].slim);
});

test('a failed postseason stage rolls back the archives without copying them',async()=>{
 const e=loadEngine({seed:4712,fullRuntime:true});
 await e.loadSchools();e.setUserTeam(USER);e.initUniverse();
 if(e.universe.phase==='preseason')e.beginSeason();
 e.simSeason();
 const T=globalThis.__DL_TEST__;
 T.v2PostseasonPrepare('conference');
 const games=e.universe.gameArchive,players=e.universe.playerArchive,count=games.length;
 const before=T.v2PostseasonStateDigest();
 const error=console.error;console.error=()=>{};
 try{T.v2PostseasonInjectFault('afterArchive');e.simConferenceChampionships()}finally{console.error=error}
 assert.equal(T.v2PostseasonStateDigest(),before,'the whole dynasty is restored');
 assert.equal(e.universe.gameArchive,games,'the game archive is the same array, trimmed back');
 assert.equal(e.universe.playerArchive,players);
 assert.equal(games.length,count);
 e.simConferenceChampionships();
 assert.equal(e.universe.phase,'bowlReady','and the stage runs normally afterwards');
 assert.ok(e.universe.gameArchive.length>count);
});
