const {test} = require('node:test');
const assert = require('node:assert/strict');
const {IDBFactory} = require('fake-indexeddb');
const {loadEngine} = require('../tools/harness.js');
const {create} = require('../storage.js');

 test('game save/load, lazy archive, export/import, old-save migration and offseason preserve history',async()=>{
  const indexedDB=new IDBFactory(), e=loadEngine({seed:424242,indexedDB});
  const store=create({indexedDB});
  await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason();
  const original=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));
  const expectedArchive=original.playerArchive;
  assert.ok(expectedArchive.length>128, "exercise more than one archive chunk");
  await e.saveBrowser();assert.match(e.$el('#saveStatus').textContent,/Saved/);
  const stored=await store.load();assert.equal(stored.universe.playerArchive,undefined);
  assert.equal(stored.archiveRef.count,expectedArchive.length);
  await e.loadBrowser();assert.match(e.$el('#saveStatus').textContent,/Loaded/);
  assert.equal(e.archiveIsDeferred(),true);assert.equal(e.universe.playerArchive.length,0);
  assert.throws(()=>e.packUniverse(e.universe),/Load archived careers/);
  // Saving before history is requested must not silently overwrite it with [].
  await e.saveBrowser();assert.match(e.$el('#saveStatus').textContent,/Saved/);
  assert.equal((await store.load()).archiveRef.count,expectedArchive.length);
  const rng=Math.random;Math.random=()=>{throw new Error('Unexpected gameplay RNG in persistence')};
  try{await e.saveBrowser();assert.match(e.$el('#saveStatus').textContent,/Saved/)}finally{Math.random=rng}
  await Promise.all([e.ensureArchiveLoaded(),e.ensureArchiveLoaded()]);
  assert.equal(e.archiveIsDeferred(),false);
  assert.deepEqual(e.packUniverse(e.universe).playerArchive,expectedArchive);
  assert.equal(e.findPlayer(expectedArchive[0].id).active,false);
  assert.deepEqual(e.universe.records,original.records);
  const game=e.universe.schedule[0][0];assert.ok(e.universe.teams.find(t=>t.name===game.home).schedule.includes(game));
  // Export must hydrate before creating the portable JSON file.
  await e.loadBrowser();assert.equal(e.archiveIsDeferred(),true);
  let exported;global.URL.createObjectURL=blob=>{exported=JSON.parse(blob.parts.join(''));return 'blob:test'};
  await e.exportSave();assert.match(e.$el('#saveStatus').textContent,/exported/);
  assert.deepEqual(exported.universe.playerArchive,expectedArchive);assert.equal(exported.storageVersion,undefined);
  assert.equal(exported.userTeam,'Chicago Metropolitan');
  global.FileReader=class {readAsText(file){this.result=file;queueMicrotask(()=>this.onload())}};
  for(const version of ['0.7','0.8','0.8.1']){
    const legacy=JSON.parse(JSON.stringify(exported));legacy.version=version;legacy.universe.version=version;
    await e.importSave(JSON.stringify(legacy));assert.match(e.$el('#saveStatus').textContent,/Imported/);
    assert.equal(e.universe.version,'0.8.1');assert.deepEqual(e.packUniverse(e.universe).playerArchive,expectedArchive);
  }
  const before=e.universe;
  await e.importSave('{bad json');assert.equal(e.universe,before);
  await e.importSave(JSON.stringify({universe:{teams:[]}}));assert.equal(e.universe,before);
  await e.importSave(JSON.stringify(stored));assert.equal(e.universe,before);
  // A structurally plausible but malformed player fails during normalization;
  // it must not replace the active game or poison the player indexes.
  const malformed=JSON.parse(JSON.stringify(exported));malformed.universe.teams[0].roster=[null];
  await e.importSave(JSON.stringify(malformed));assert.equal(e.universe,before);
  assert.equal(e.findPlayer(before.teams[0].roster[0].id).active,true);
  await e.saveBrowser();await e.loadBrowser();
  const oldCount=(await store.load()).archiveRef.count;
  // A new season can be simulated with the archive deferred; offseason loads
  // history before updating career records and appending the new departures.
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();
  assert.equal(e.archiveIsDeferred(),true);await e.runOffseason();
  assert.equal(e.universe.year,2029);assert.equal(e.archiveIsDeferred(),false);
  assert.ok(e.universe.playerArchive.length>oldCount);
  assert.deepEqual(e.packUniverse(e.universe).playerArchive.slice(0,oldCount),expectedArchive);
  const all=e.packUniverse(e.universe).playerArchive;
  await e.saveBrowser();await e.loadBrowser();await e.ensureArchiveLoaded();
  assert.deepEqual(e.packUniverse(e.universe).playerArchive,all);
  // New Universe + Save replaces the previous browser save without importing
  // its old alumni into a completely unrelated game.
  e.initUniverse();e.setUserTeam('Chicago Metropolitan');await e.saveBrowser();
  assert.equal((await store.load()).archiveRef.count,0);
 });
