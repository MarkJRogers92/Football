// Failure-path tests use a disposable IndexedDB factory, never the user's DB.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {IDBFactory, IDBObjectStore} = require('fake-indexeddb');
const {create, revisionOf} = require('../storage.js');
const player = i => ({id: `p${i}`, name: `Alumnus ${i}`, career: {passYds: i}, seasonHistory: [{year: 2027, team: 'Chicago Metropolitan', passYds: i}], awards: [{year: 2027, name: 'Award'}], draftResult: {year: 2028, round: 1, pick: i}});
const snapshot = (year = 2028) => ({version: '0.8.1', savedAt: '2026-09-03', userTeam: 'Chicago Metropolitan', universe: {year, week: 0, teams: [], records: {nationalCareer: {passYds: 999}}}});
function fixture(){const indexedDB=new IDBFactory();return {indexedDB, store:create({indexedDB})}}
async function open(indexedDB, version){return new Promise((res,rej)=>{const r=indexedDB.open('DynastyLabDB',version);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function transact(db,names,mode,work){return new Promise((res,rej)=>{const tx=db.transaction(names,mode);tx.oncomplete=res;tx.onabort=()=>rej(tx.error);work(tx)})}

 test('legacy DB upgrades without rewriting the save; next save atomically splits all history', async()=>{
  const {indexedDB,store}=fixture();const old=snapshot();old.universe.playerArchive=Array.from({length:257},(_,i)=>player(i));
  const db=await open(indexedDB,1);await transact(db,['saves'],'readwrite',tx=>tx.objectStore('saves').put(old,'main'));db.close();
  assert.deepEqual(await store.load(),old);
  const saved=await store.save(old,{expectedRevision:revisionOf(old),additions:old.universe.playerArchive});
  const current=await store.load();assert.equal(current.storageVersion,2);assert.equal('playerArchive' in current.universe,false);
  assert.deepEqual(current.universe.records,old.universe.records);
  assert.equal(saved.archiveRef.count,257);assert.equal(saved.archiveRef.chunks,3);
  assert.deepEqual(await store.readArchive(saved.archiveRef),old.universe.playerArchive);
 });
 test('weekly saves do not rewrite old careers; append writes only new chunks',async()=>{
  const {store}=fixture();const original=Array.from({length:260},(_,i)=>player(i));
  let state=await store.save(snapshot(),{additions:original});
  const put=IDBObjectStore.prototype.put;let writes=0;
  IDBObjectStore.prototype.put=function(...args){if(this.name==='archives')writes++;return put.apply(this,args)};
  try{
   state=await store.save(snapshot(),{expectedRevision:state.revision,archiveRef:state.archiveRef});assert.equal(writes,0);
   state=await store.save(snapshot(2029),{expectedRevision:state.revision,archiveRef:state.archiveRef,additions:[player(260)]});assert.equal(writes,1);
  }finally{IDBObjectStore.prototype.put=put}
  assert.deepEqual(await store.readArchive(state.archiveRef),[...original,player(260)]);
 });
 test('archive write failure rolls back both the replacement save and cleared archive',async()=>{
  const {store}=fixture();const state=await store.save(snapshot(),{additions:[player(1)]});const before=await store.load();
  const put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(...args){if(this.name==='archives')throw new DOMException('Disk full','QuotaExceededError');return put.apply(this,args)};
  try{await assert.rejects(store.save(snapshot(2040),{additions:[player(9)]}),/Disk full/)}finally{IDBObjectStore.prototype.put=put}
  assert.deepEqual(await store.load(),before);assert.deepEqual(await store.readArchive(state.archiveRef),[player(1)]);
 });
 test('a transaction abort after successful requests never reports success',async()=>{
  const {store}=fixture();const state=await store.save(snapshot(),{additions:[player(1)]});const before=await store.load();
  const put=IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put=function(...args){const req=put.apply(this,args);if(this.name==='saves')req.onsuccess=()=>this.transaction.abort();return req};
  try{await assert.rejects(store.save(snapshot(2040),{additions:[player(9)]}),/cancelled/)}finally{IDBObjectStore.prototype.put=put}
  assert.deepEqual(await store.load(),before);assert.deepEqual(await store.readArchive(state.archiveRef),[player(1)]);
 });
 test('stale tabs cannot overwrite newer saves',async()=>{
  const {store}=fixture();const stale=await store.save(snapshot(),{additions:[player(1)]});
  await store.save(snapshot(2029),{expectedRevision:stale.revision,archiveRef:stale.archiveRef,additions:[player(2)]});
  await assert.rejects(store.save(snapshot(2028),{expectedRevision:stale.revision,archiveRef:stale.archiveRef}),/Another tab/);
  assert.equal((await store.load()).universe.year,2029);
  assert.deepEqual(await store.readArchive(stale.archiveRef),[player(1)]);
 });
 test('replacing a dynasty never mixes archives, and an obsolete lazy reference fails closed',async()=>{
  const {store}=fixture();const old=await store.save(snapshot(),{additions:[player(1)]});
  const fresh=await store.save(snapshot(2035),{additions:[player(99)]});
  assert.deepEqual(await store.readArchive(fresh.archiveRef),[player(99)]);
  await assert.rejects(store.readArchive(old.archiveRef),/replaced/);
 });
 test('missing archive chunks cause an error rather than silently dropping alumni',async()=>{
  const {indexedDB,store}=fixture();const state=await store.save(snapshot(),{additions:[player(1)]});
  const db=await open(indexedDB,2);await transact(db,['archives'],'readwrite',tx=>tx.objectStore('archives').delete(0));db.close();
  await assert.rejects(store.readArchive(state.archiveRef),/missing or damaged/);
 });
 test('empty archives round-trip and unsupported storage versions are rejected',async()=>{
  const {indexedDB,store}=fixture();const state=await store.save(snapshot());assert.deepEqual(await store.readArchive(state.archiveRef),[]);
  const d=await store.load();d.storageVersion=3;const db=await open(indexedDB,2);await transact(db,['saves'],'readwrite',tx=>tx.objectStore('saves').put(d,'main'));db.close();
  await assert.rejects(store.load(),/newer game version/);
 });
 test('blocked upgrade rejects promptly and does not run later in the background',async()=>{
  const {indexedDB,store}=fixture();const db=await open(indexedDB,1);
  await assert.rejects(store.load(),/Close other Dynasty Lab tabs/);db.close();
  // Wait for the cancelled upgrade's abort before a fresh user retry.
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(await store.load(),undefined);
 });
