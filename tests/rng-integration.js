const{test}=require('node:test');
const assert=require('node:assert/strict');
const{loadEngine}=require('../tools/harness');

async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('new universes save a reported gameplay stream',async()=>{
 const e=await setup(950),saved=e.packUniverse(e.universe).rng;
 assert.equal(saved.version,1);assert.ok(Number.isInteger(saved.seed));assert.ok(saved.draws>1000);
 assert.deepEqual(e.universe.rng,saved);
});

test('a save resumes at the exact next gameplay draw',async()=>{
 const first=await setup(951),save=structuredClone(first.packUniverse(first.universe));
 const expected=Array.from({length:12},()=>first.gameplayRandom());
 const resumed=loadEngine({seed:999});resumed.setUserTeam('Chicago Metropolitan');await resumed.loadSchools();resumed.universe=save;resumed.normalizeUniverse();
 assert.deepEqual(Array.from({length:12},()=>resumed.gameplayRandom()),expected);
});

test('identity randomness does not consume the gameplay stream',async()=>{
 const e=await setup(952),before=e.syncGameplayRng().draws;
 e.portraitSeedFor();e.portraitSeedFor();
 assert.equal(e.syncGameplayRng().draws,before);
});

test('legacy saves receive a stable zero-draw stream before migration work',async()=>{
 const e=await setup(953),save=structuredClone(e.packUniverse(e.universe));delete save.rng;
 e.universe=save;e.normalizeUniverse();const first=e.syncGameplayRng();
 assert.equal(first.version,1);assert.equal(first.draws,0);
 e.universe=structuredClone(save);delete e.universe.rng;e.normalizeUniverse();
 assert.deepEqual(e.syncGameplayRng(),first);
});
