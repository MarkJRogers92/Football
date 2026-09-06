const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.9.50 commit 3, domain 2: recruiting, signing day, portal and transfers now draw
// through gameplayRandom() instead of bare Math.random(). These tests pin that a fixed
// seed reproduces identical outcomes across two independent runs — the actual point of
// routing gameplay randomness through a saved stream.

test('recruiting interest/commit rolls are reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:5501});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  for(let w=0;w<8;w++)e.advanceRecruiting();
  outcomes.push(JSON.stringify(e.universe.recruits.map(r=>[r.id,r.interest,r.committed]).sort((a,b)=>a[0]-b[0])));
 }
 assert.equal(outcomes[0],outcomes[1]);
});

test('signing day flips are reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:5502});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  const sd=e.buildSigningDay();
  outcomes.push(JSON.stringify(sd));
 }
 assert.equal(outcomes[0],outcomes[1]);
});

test('portal entry, competition and resolution are reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:5503});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  e.offseasonReview();e.offseasonDepartures();
  const entrants=e.universe.transferPortal.map(x=>x.candidateId).sort();
  e.openPortalCycle();e.advancePortalRound();e.advancePortalRound();e.advancePortalRound();
  const decisions=e.universe.transferPortal.filter(x=>x.decision).map(x=>`${x.candidateId}:${x.decision.schoolId}`).sort();
  outcomes.push(JSON.stringify({entrants,decisions}));
 }
 assert.equal(outcomes[0],outcomes[1]);
 assert.ok(JSON.parse(outcomes[0]).entrants.length>0,'a real portal class exists to compare');
});

test('gameplayRandom draw count advances identically across two identical recruiting runs',async()=>{
 const draws=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:5504});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  for(let w=0;w<5;w++)e.advanceRecruiting();
  draws.push(e.universe.rng.draws);
 }
 assert.equal(draws[0],draws[1]);
 assert.ok(draws[0]>0,'recruiting actually drew from the stream');
});
