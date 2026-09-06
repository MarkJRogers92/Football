const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.9.50 commit 3, domain 4 (final domain): game simulation. Every remaining direct
// Math.random() call in gameplay code now draws through gameplayRandom() — penalties,
// pressure, completions, drops, fumbles, field goals, overtime coin flips, injuries and
// the opening-possession coin flip. Only uid() and portraitSeedFor() are deliberately
// left on the non-gameplay Web Crypto/Date path, per the packet.

test('a fast-sim game (score, box score, injuries) is reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:7701});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simWeek();
  const g=e.universe.gameArchive[0];
  outcomes.push(JSON.stringify({score:g.score,box:g.teamStats,injuries:g.injuries}));
 }
 assert.equal(outcomes[0],outcomes[1]);
});

test('a detailed, drive-by-drive game is reproducible from a fixed seed, including the play log',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:7702});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simulateUserDetailed();
  const g=e.universe.lastDetailedGame;
  outcomes.push(JSON.stringify({score:g.score,drives:g.drives,log:g.log}));
 }
 assert.equal(outcomes[0],outcomes[1]);
});

test('a full season of fast-sim games is reproducible from a fixed seed',async()=>{
 const outcomes=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:7703});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();
  outcomes.push(JSON.stringify(e.universe.gameArchive.map(g=>[g.id,g.score])));
 }
 assert.equal(outcomes[0],outcomes[1]);
});

test('a different seed produces a different game, so the stream is not stuck',async()=>{
 // loadEngine mutates shared globals (document/crypto shims), so two engines cannot be
 // alive at once — exercise and discard the first fully before creating the second.
 const box=async seed=>{
  const e=loadEngine({seed});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();e.simWeek();
  return JSON.stringify(e.universe.gameArchive[0].teamStats);
 };
 const a=await box(7704),b=await box(7705);
 assert.notEqual(a,b);
});

test('gameplayRandom draw count advances identically across two identical seasons',async()=>{
 const draws=[];
 for(let i=0;i<2;i++){
  const e=loadEngine({seed:7706});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
  e.simSeason();
  draws.push(e.universe.rng.draws);
 }
 assert.equal(draws[0],draws[1]);
 assert.ok(draws[0]>0);
});
