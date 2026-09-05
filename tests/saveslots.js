const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const Storage=require('../storage.js');

// v0.9.49 commit 1: slot-aware storage. The hazard this exists to stop is concrete —
// before slots, chunk keys were bare indexes and a fresh save called clear() on the whole
// archives store, so saving a second dynasty would have destroyed the first one's history.
const snapshot=(name,year,extra={})=>({
 version:'0.9.49',userTeam:name,
 universe:{year,week:1,teams:[{id:1,name}],playerArchive:[],gameArchive:[],...extra},
});
const rows=(prefix,n)=>Array.from({length:n},(_,i)=>({id:`${prefix}-${i}`,name:`${prefix} ${i}`}));

function freshDb(){
 const indexedDB=new IDBFactory();
 return slot=>Storage.create({indexedDB,name:'SlotTest',slot});
}

test('a slot round-trips its own dynasty', async()=>{
 const db=freshDb(),a=db('alpha');
 const res=await a.save(snapshot('Chicago Metropolitan',2027),{additions:rows('career',300),gameAdditions:rows('game',200)});
 assert.ok(res.revision,'a revision is issued');
 assert.equal(res.archiveRef.count,300);
 assert.equal(res.gameRef.count,200);
 const loaded=await a.load();
 assert.equal(loaded.userTeam,'Chicago Metropolitan');
 assert.equal(loaded.universe.year,2027);
 assert.equal((await a.readArchive(loaded.archiveRef)).length,300);
 assert.equal((await a.readGames(loaded.gameRef)).length,200);
});

test('slots never read or overwrite another slot\'s archives',async()=>{
 const db=freshDb(),a=db('alpha'),b=db('beta');
 const aSaved=await a.save(snapshot('Chicago Metropolitan',2030),{additions:rows('alpha',400),gameAdditions:rows('alphaGame',150)});
 // Saving a brand-new dynasty in another slot is exactly the case that used to wipe the
 // first slot: no archiveRef means "replace", which was a store-wide clear().
 await b.save(snapshot('Great Lakes University',2027),{additions:rows('beta',50),gameAdditions:rows('betaGame',20)});
 const aLoaded=await a.load();
 assert.equal(aLoaded.userTeam,'Chicago Metropolitan','the first slot still holds its own dynasty');
 assert.equal(aLoaded.universe.year,2030);
 const aArchive=await a.readArchive(aLoaded.archiveRef);
 assert.equal(aArchive.length,400,'the first slot kept every archived career');
 assert.ok(aArchive.every(r=>r.id.startsWith('alpha-')),'and none of them came from the other slot');
 const aGames=await a.readGames(aLoaded.gameRef);
 assert.equal(aGames.length,150);
 assert.ok(aGames.every(r=>r.id.startsWith('alphaGame-')));
 const bLoaded=await b.load();
 assert.equal(bLoaded.userTeam,'Great Lakes University');
 assert.equal((await b.readArchive(bLoaded.archiveRef)).length,50);
 assert.notEqual(aSaved.revision,bLoaded.revision,'the two slots have independent revisions');
});

test('appending to one slot leaves the other untouched',async()=>{
 const db=freshDb(),a=db('alpha'),b=db('beta');
 await a.save(snapshot('A',2027),{additions:rows('a',200)});
 await b.save(snapshot('B',2027),{additions:rows('b',200)});
 let aState=await a.load();
 // Three appends into alpha; beta must not grow, shrink or change.
 for(let i=0;i<3;i++){
  const res=await a.save(snapshot('A',2028+i),{expectedRevision:aState.revision,archiveRef:aState.archiveRef,additions:rows(`a${i}`,100)});
  aState={revision:res.revision,archiveRef:res.archiveRef};
 }
 const bLoaded=await b.load();
 assert.equal((await b.readArchive(bLoaded.archiveRef)).length,200,'beta is unchanged by alpha appends');
 assert.equal(bLoaded.universe.year,2027);
 const finalA=await a.load();
 assert.equal((await a.readArchive(finalA.archiveRef)).length,500,'alpha grew by exactly what was appended');
});

test('a stale revision is refused, and the last complete revision survives the refusal',async()=>{
 const db=freshDb(),a=db('alpha');
 const first=await a.save(snapshot('A',2027),{additions:rows('a',120)});
 await a.save(snapshot('A',2028),{expectedRevision:first.revision,archiveRef:first.archiveRef,additions:[]});
 // Another tab already moved the save on; this write must be rejected rather than clobber it.
 await assert.rejects(
  ()=>a.save(snapshot('A',9999),{expectedRevision:first.revision,archiveRef:first.archiveRef}),
  /another tab/i);
 const loaded=await a.load();
 assert.equal(loaded.universe.year,2028,'the good revision is still what loads');
 assert.equal((await a.readArchive(loaded.archiveRef)).length,120,'and its archive is intact');
});

test('a legacy single-slot database is adopted as the default slot, chunks and all',async()=>{
 const indexedDB=new IDBFactory();
 // Build a v3 database by hand: bare numeric chunk keys, save row keyed 'main'.
 await new Promise((resolve,reject)=>{
  const req=indexedDB.open('LegacyDb',3);
  req.onupgradeneeded=()=>{
   const db=req.result;
   db.createObjectStore('saves');db.createObjectStore('archives');db.createObjectStore('games');
  };
  req.onerror=()=>reject(req.error);
  req.onsuccess=()=>{
   const db=req.result,tx=db.transaction(['saves','archives','games'],'readwrite');
   tx.objectStore('archives').put(rows('old',128),0);
   tx.objectStore('archives').put(rows('old2',72),1);
   tx.objectStore('games').put(rows('oldGame',60),0);
   tx.objectStore('saves').put({
    version:'0.9.44',userTeam:'Legacy Program',universe:{year:2031,week:5,teams:[]},
    storageVersion:3,revision:'legacy-rev',
    archiveRef:{id:'old-archive',count:200,chunks:2},
    gameRef:{id:'old-games',count:60,chunks:1},
   },'main');
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>reject(tx.error);
  };
 });
 const main=Storage.create({indexedDB,name:'LegacyDb'});
 const loaded=await main.load();
 assert.equal(loaded.userTeam,'Legacy Program','the existing dynasty is still there after the upgrade');
 assert.equal(loaded.universe.year,2031);
 const archive=await main.readArchive(loaded.archiveRef);
 assert.equal(archive.length,200,'its archived careers survived the key migration');
 assert.equal(archive[0].id,'old-0','in their original order');
 assert.equal((await main.readGames(loaded.gameRef)).length,60,'and so did its games');
});

test('a slot name that could collide with the key scheme is refused outright',async()=>{
 const indexedDB=new IDBFactory();
 // ':' and ';' bound the per-slot key range, so a name containing either could let one
 // slot address another's rows.
 for(const bad of ['a:b','a;b','',null,7])
  assert.throws(()=>Storage.create({indexedDB,name:'X',slot:bad}),/Invalid save slot/,`accepted ${JSON.stringify(bad)}`);
 // Omitting it entirely is not an error: that is how existing callers get the default slot.
 assert.doesNotThrow(()=>Storage.create({indexedDB,name:'X'}));
 assert.doesNotThrow(()=>Storage.create({indexedDB,name:'X',slot:'dynasty-2'}));
});

// --- commit 3: safe autosave orchestration ----------------------------------

const {loadEngine}=require('../tools/harness');
async function engine(seed){
 const e=loadEngine({seed,indexedDB:new IDBFactory()});
 e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 return e;
}

test('a checkpoint is refused while the player is mid-decision',async()=>{
 const e=await engine(4901);
 assert.equal(e.autosaveBlocked(),null,'a settled dynasty can be checkpointed');
 // A pending job offer means the player owes an answer; capturing now would checkpoint a
 // state they are still resolving.
 e.universe.jobOffers=[{schoolId:e.universe.teams[1].id,name:'Somewhere'}];
 assert.match(String(e.autosaveBlocked()),/career decision/);
 assert.equal(await e.runAutosave(),false,'and the write does not happen');
 e.universe.jobOffers=[];
 assert.equal(e.autosaveBlocked(),null);
});

test('only known checkpoint kinds are accepted',async()=>{
 const e=await engine(4902);
 for(const kind of e.AUTOSAVE_KINDS)assert.doesNotThrow(()=>e.autosaveAfter(kind),kind);
 // A typo must fail loudly rather than silently never checkpointing.
 assert.throws(()=>e.autosaveAfter('halfway'),/Unknown autosave checkpoint/);
});

test('an autosave writes a loadable dynasty and records what it checkpointed',async()=>{
 const e=await engine(4903);
 await e.saveBrowser();                       // establish the slot
 e.simWeek();
 e.autosaveAfter('week');
 assert.equal(await e.runAutosave(),true,'the checkpoint was written');
 assert.equal(e.universe.lastCheckpoint.kind,'week');
 assert.equal(e.universe.lastCheckpoint.week,e.universe.week);
 const week=e.universe.week;
 await e.loadBrowser();
 assert.equal(e.universe.week,week,'the checkpoint reloads at the week it captured');
});

test('a checkpoint never captures a half-advanced week',async()=>{
 const e=await engine(4904);
 await e.saveBrowser();
 // Drive several weeks, checkpointing after each, then confirm what landed is a whole week.
 for(let i=0;i<3;i++){e.simWeek();e.autosaveAfter('week');await e.runAutosave()}
 const expected=e.universe.week;
 await e.loadBrowser();
 assert.equal(e.universe.week,expected);
 assert.equal(Number.isInteger(e.universe.week),true);
 // Every game in a completed week has a result; a torn write would leave some unplayed.
 for(let w=0;w<e.universe.week;w++)
  for(const g of e.universe.schedule[w]||[])
   assert.equal(g.played,true,`week ${w+1} game ${g.away} at ${g.home} was captured unplayed`);
});

test('a failed autosave reports itself and leaves the dynasty playable',async()=>{
 const e=await engine(4905);
 await e.saveBrowser();
 const year=e.universe.year;
 // Simulate a storage failure at write time.
 const real=e.universe.playerArchive;
 Object.defineProperty(e.universe,'playerArchive',{get(){throw new Error('disk on fire')},configurable:true});
 e.autosaveAfter('week');
 assert.equal(await e.runAutosave(),false,'the failure is reported, not thrown');
 Object.defineProperty(e.universe,'playerArchive',{value:real,writable:true,configurable:true});
 // Play continues: the in-memory dynasty is untouched and a later save still works.
 assert.equal(e.universe.year,year);
 e.simWeek();
 assert.equal(await e.saveBrowser(),undefined);
 const week=e.universe.week;
 await e.loadBrowser();
 assert.equal(e.universe.week,week,'a later manual save still lands');
});

// --- commit 4: tiered game-detail compaction --------------------------------

function rollSeasons(e,n){
 for(let s=0;s<n;s++){
  const before=e.universe.year;
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  for(let i=0;i<20&&e.universe.year===before;i++){
   if(e.hasPendingCareerChoice()){const o=(e.universe.jobOffers||[])[0];if(o)e.acceptPost(o.schoolId)}
   const ph=e.normalizeOffseasonState().phase;
   if(ph==='spring')e.runSpringCamp();else if(ph==='fall')e.runFallCamp();
   e.runOffseason();
  }
  if(e.universe.year===before)throw new Error(`season did not advance past ${before}`);
 }
}

test('compaction never touches a game a player would go back and read',async()=>{
 const e=await engine(4906);
 rollSeasons(e,5);
 const user=e.T('Chicago Metropolitan')?.name;
 e.compactGameArchive();
 for(const g of e.universe.gameArchive){
  if(!g.compacted)continue;
  assert.equal(g.label==='Regular season'||!g.label,true,`compacted a ${g.label}`);
  assert.notEqual(g.home.name,user,'compacted a controlled-team game');
  assert.notEqual(g.away.name,user,'compacted a controlled-team game');
  assert.equal((g.drives||[]).length,0,'compacted a game that carries drive detail');
  assert.ok((g.season??0)<=e.universe.year-e.GAME_DETAIL_HORIZON,'compacted a game inside the horizon');
 }
});

test('a compacted game keeps its score, team box, injuries and leaders',async()=>{
 const e=await engine(4907);
 rollSeasons(e,5);
 const target=e.universe.gameArchive.find(g=>!e.gameIsProtected(g,e.T('Chicago Metropolitan')?.name)&&(g.season??0)<=e.universe.year-e.GAME_DETAIL_HORIZON);
 assert.ok(target,'a compactable game exists');
 const before={id:target.id,score:JSON.stringify(target.score),team:JSON.stringify(target.teamStats),
  injuries:JSON.stringify(target.injuries||[]),lines:target.playerStats.home.length+target.playerStats.away.length};
 e.compactGameArchive();
 assert.ok(target.compacted,'it was compacted');
 assert.equal(target.id,before.id,'the id never changes, so no link breaks');
 assert.equal(JSON.stringify(target.score),before.score);
 assert.equal(JSON.stringify(target.teamStats),before.team,'the team box is permanent');
 assert.equal(JSON.stringify(target.injuries||[]),before.injuries,'injuries are permanent');
 const kept=[...target.playerStats.home,...target.playerStats.away];
 assert.ok(kept.length<before.lines,'the long tail is gone');
 assert.ok(kept.length>0,'but leaders remain');
 // Everyone kept must have earned it: a score, a turnover, or a yardage lead.
 for(const p of kept){
  const st=p.stats||{};
  const scored=st.passTD||st.rushTD||st.recTD||st.int||st.fgMade;
  const leads=['passYds','rushYds','recYds'].some(k=>(st[k]||0)>0);
  assert.ok(scored||leads,`${p.name} was kept with nothing to show for it`);
 }
});

test('a compacted game still opens to Summary and Box Score, and says it was compacted',async()=>{
 const e=await engine(4908);
 rollSeasons(e,5);
 e.compactGameArchive();
 const g=e.universe.gameArchive.find(x=>x.compacted);
 assert.ok(g,'something was compacted');
 const box=e.gameBoxHTML(g);
 assert.match(box,/Team statistics/,'the box score still renders');
 assert.match(box,/compacted/i,'and discloses it, so a short list does not read as a quiet night');
 assert.doesNotThrow(()=>e.gameSummaryHTML(g));
});

test('compaction is idempotent and recorded in a bounded manifest',async()=>{
 const e=await engine(4909);
 rollSeasons(e,5);
 const first=e.compactGameArchive();
 assert.ok(first.games>0,'the first pass did work');
 const second=e.compactGameArchive();
 assert.equal(second.games,0,'a second pass finds nothing left to do');
 assert.equal(e.universe.compactionManifest.length,1,'and records nothing new');
 const m=e.universe.compactionManifest[0];
 assert.equal(m.games,first.games);
 assert.equal(m.dropped,first.dropped);
});

test('compaction measurably shrinks the archive without losing a single game',async()=>{
 const e=await engine(4910);
 rollSeasons(e,5);
 const size=o=>Buffer.byteLength(JSON.stringify(o));
 const ids=e.universe.gameArchive.map(g=>g.id);
 const before=size(e.universe.gameArchive);
 e.compactGameArchive();
 const after=size(e.universe.gameArchive);
 assert.deepEqual(e.universe.gameArchive.map(g=>g.id),ids,'every game is still present, in order');
 assert.ok(after<before*0.85,`expected a real saving, got ${(100*(before-after)/before).toFixed(1)}%`);
});
