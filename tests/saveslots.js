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
