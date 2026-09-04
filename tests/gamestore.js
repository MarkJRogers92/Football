// v0.9.12: permanent box scores live in their own append-only chunks.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory,IDBObjectStore}=require('fake-indexeddb');
const {create,revisionOf}=require('../storage.js');
const {loadEngine}=require('../tools/harness');

const game=i=>({id:`G2027_${i}`,season:2027,week:(i%12)+1,label:'Regular season',
 home:{id:1,name:'Chicago Metropolitan',rank:5,record:'1-0'},away:{id:2,name:'Great Lakes University',rank:null,record:'0-1'},
 score:{home:20+i%7,away:17},teamStats:{home:{passYds:200,rushYds:120,turnovers:1},away:{passYds:180,rushYds:90,turnovers:2}},
 playerStats:{home:[],away:[]},injuries:[],drives:[],formerPlayers:[]});
const snapshot=(year=2028)=>({version:'0.9.12',savedAt:'2026-09-04',userTeam:'Chicago Metropolitan',
 universe:{year,week:0,teams:[],records:{nationalCareer:{passYds:999}}}});
const fixture=()=>{const indexedDB=new IDBFactory();return {indexedDB,store:create({indexedDB})}};

async function playedSeason(seed,weeks=12){
 const idb=new IDBFactory();
 const e=loadEngine({seed,indexedDB:idb});e.setUserTeam('Chicago Metropolitan');
 await e.loadSchools();e.initUniverse();
 for(let i=0;i<weeks;i++)e.simWeek();
 return {e,idb,store:create({indexedDB:idb})};
}

test('a save moves box scores out of the core row into their own chunks',async()=>{
 const {store}=fixture(),games=Array.from({length:300},(_,i)=>game(i));
 const saved=await store.save(snapshot(),{gameAdditions:games});
 assert.equal(saved.gameRef.count,300);assert.equal(saved.gameRef.chunks,3);
 const d=await store.load();
 assert.equal(d.storageVersion,3);
 assert.equal('gameArchive' in d.universe,false,'the core row must no longer carry box scores');
 assert.deepEqual(await store.readGames(saved.gameRef),games,'every game must come back intact');
});

test('an ordinary save appends only the games just played and never rewrites history',async()=>{
 const {store}=fixture(),original=Array.from({length:260},(_,i)=>game(i));
 let state=await store.save(snapshot(),{gameAdditions:original});
 const put=IDBObjectStore.prototype.put;let gameWrites=0;
 IDBObjectStore.prototype.put=function(...args){if(this.name==='games')gameWrites++;return put.apply(this,args)};
 try{
  state=await store.save(snapshot(2029),{expectedRevision:(await store.load()).revision,
   gameRef:state.gameRef,gameAdditions:[game(260),game(261)]});
 }finally{IDBObjectStore.prototype.put=put}
 assert.equal(gameWrites,1,'appending two games must write exactly one new chunk, not rewrite all three');
 assert.equal(state.gameRef.count,262);assert.equal(state.gameRef.chunks,4);
 const rows=await store.readGames(state.gameRef);
 assert.equal(rows.length,262);
 assert.deepEqual(rows.slice(0,260),original,'existing chunks must be untouched');
 assert.equal(new Set(rows.map(g=>g.id)).size,262,'no game may be duplicated');
});

test('missing or damaged game chunks fail loudly instead of dropping history',async()=>{
 const {indexedDB,store}=fixture();
 const state=await store.save(snapshot(),{gameAdditions:[game(1)]});
 const db=await new Promise(res=>{const r=indexedDB.open('DynastyLabDB',3);r.onsuccess=()=>res(r.result)});
 await new Promise(res=>{const tx=db.transaction(['games'],'readwrite');tx.oncomplete=res;tx.objectStore('games').delete(0)});
 db.close();
 await assert.rejects(store.readGames(state.gameRef),/missing or damaged/);
});

test('a game reference from a replaced dynasty is refused rather than mixing histories',async()=>{
 const {store}=fixture();
 const stale=await store.save(snapshot(),{gameAdditions:[game(1),game(2)]});
 await store.save(snapshot(2030),{expectedRevision:(await store.load()).revision,gameAdditions:[game(9)]});
 await assert.rejects(store.readGames(stale.gameRef),/replaced in another tab|does not match/);
 await assert.rejects(store.readGames({id:'nope',count:1,chunks:1}),/replaced in another tab/);
 await assert.rejects(store.readGames({id:'x',count:-1,chunks:0}),/Invalid game archive reference/);
});

test('a stale game reference cannot overwrite a newer save',async()=>{
 const {store}=fixture();
 const first=await store.save(snapshot(),{gameAdditions:[game(1)]});
 await store.save(snapshot(2030),{expectedRevision:(await store.load()).revision,gameRef:first.gameRef,gameAdditions:[game(2)]});
 await assert.rejects(store.save(snapshot(2031),{expectedRevision:first.revision,gameRef:first.gameRef,gameAdditions:[game(3)]}),
  /Another tab changed this browser save/);
});

test('a played season saves, defers, and hydrates every box score on demand',async()=>{
 const {e,store}=await playedSeason(1201);
 const played=e.universe.gameArchive.length;
 assert.ok(played>500,`expected a full week-by-week season, got ${played}`);
 await e.saveBrowser();
 const d=await store.load();
 assert.equal(d.gameRef.count,played);
 assert.equal('gameArchive' in d.universe,false);
 // Reload the way a returning player would: nothing resident until asked for.
 e.installSave(d,{revision:revisionOf(d),archiveRef:d.archiveRef,loaded:false,gameRef:d.gameRef,gamesLoaded:false});
 assert.equal(e.gamesAreDeferred(),true);
 assert.equal(e.universe.gameArchive.length,0,'a deferred dynasty holds no box scores until one is opened');
 await e.ensureGamesLoaded();
 assert.equal(e.universe.gameArchive.length,played,'every archived game must come back');
 assert.equal(new Set(e.universe.gameArchive.map(g=>g.id)).size,played);
});

test('games played while the archive is deferred are appended, not lost or duplicated',async()=>{
 const {e,store}=await playedSeason(1202);
 await e.saveBrowser();
 let d=await store.load();
 const before=d.gameRef.count;
 e.installSave(d,{revision:revisionOf(d),archiveRef:d.archiveRef,loaded:false,gameRef:d.gameRef,gamesLoaded:false});
 e.simConferenceChampionships();
 const fresh=e.universe.gameArchive.length;
 assert.ok(fresh>0,'the championship round should have produced games');
 await e.saveBrowser();
 d=await store.load();
 assert.equal(d.gameRef.count,before+fresh,'only the new games should have been added');
 const rows=await store.readGames(d.gameRef);
 assert.equal(new Set(rows.map(g=>g.id)).size,rows.length,'no game may be written twice');
 assert.equal(e.universe.gameArchive.length,0,'committed games must not also linger as pending rows');
});

test('an exported dynasty is complete even when its games were deferred',async()=>{
 const {e,store}=await playedSeason(1203);
 const ids=e.universe.gameArchive.map(g=>g.id).sort();
 await e.saveBrowser();
 const d=await store.load();
 e.installSave(d,{revision:revisionOf(d),archiveRef:d.archiveRef,loaded:false,gameRef:d.gameRef,gamesLoaded:false});
 assert.equal(e.gamesAreDeferred(),true);
 await e.exportSave();
 // exportSave hydrates both archives; the portable universe must be whole.
 const packed=e.packUniverse(e.universe);
 assert.deepEqual(packed.gameArchive.map(g=>g.id).sort(),ids,'a portable save must carry every box score');
});

test('an imported JSON dynasty keeps its games inline and still saves cleanly',async()=>{
 const {e,store}=await playedSeason(1204,3);
 const count=e.universe.gameArchive.length;
 const portable=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));
 e.installSave({version:'0.9.12',userTeam:'Chicago Metropolitan',universe:portable});
 assert.equal(e.gamesAreDeferred(),false,'an imported dynasty is fully resident');
 assert.equal(e.universe.gameArchive.length,count);
 await e.saveBrowser();
 const d=await store.load();
 assert.equal(d.gameRef.count,count,'importing then saving writes the whole history once');
 assert.equal('gameArchive' in d.universe,false);
});
