const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.9.50 commit 3, domain 3: offseason development (camps, physical growth), coaching
// hires/carousel and early-declaration decisions now draw through gameplayRandom(). These
// pin that a fixed seed reproduces identical outcomes across two independent runs.

test('spring/fall development and physical growth are reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:6601});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  e.runSpringCamp();e.runFallCamp();
  outcomes.push(JSON.stringify(e.universe.teams.map(t=>t.roster.map(p=>[p.id,p.trueNow,p.height,p.weight]))));
 }
 assert.equal(outcomes[0],outcomes[1]);
});

test('coaching carousel (fire/retire/promote/move) is reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:6602});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  e.runSpringCamp();e.runFallCamp();e.runOffseason();
  outcomes.push(JSON.stringify(e.universe.movementLog));
 }
 assert.equal(outcomes[0],outcomes[1]);
 assert.ok(JSON.parse(outcomes[0]).length>0,'a real carousel happened to compare');
});

test('coach hire acceptance and destination scoring are reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:6603});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  e.runSpringCamp();e.runFallCamp();e.runOffseason();
  outcomes.push(JSON.stringify(e.universe.teams.map(t=>[t.name,t.staff.HC.id,t.staff.OC.id,t.staff.DC.id])));
 }
 assert.equal(outcomes[0],outcomes[1]);
});

test('gameplayRandom draw count advances identically across two identical offseasons',async()=>{
 const draws=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:6604});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  e.runSpringCamp();e.runFallCamp();e.runOffseason();
  draws.push(e.universe.rng.draws);
 }
 assert.equal(draws[0],draws[1]);
});
