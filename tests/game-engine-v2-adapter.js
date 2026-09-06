const {test}=require('node:test');
const assert=require('node:assert/strict');
const adapter=require('../game-engine-v2-adapter.js');
const engine=require('../game-engine-v2.js');
const home={id:1,name:'Chicago Metropolitan'},away={id:2,name:'Great Lakes University'};
const homeProfile={offense:88,defense:82,overall:85},awayProfile={offense:67,defense:71,overall:69};

test('adapter turns existing profile snapshots into bounded v2 team inputs without mutation',()=>{
 const original=JSON.stringify(homeProfile),t=adapter.profileTeam(home,homeProfile);
 assert.deepEqual(t,{id:1,name:'Chicago Metropolitan',rating:85,offense:88,defense:82});
 assert.equal(JSON.stringify(homeProfile),original);
 assert.equal(adapter.profileTeam({name:'Fallback'},{offense:120,defense:-5}).rating,50.5);
});

test('shadow simulation is deterministic and leaves live input objects untouched',()=>{
 const options={gameId:'shadow-1',seed:'shadow-seed',home,away,homeProfile,awayProfile};
 const before=JSON.stringify(options),a=adapter.simulateShadow(options),b=adapter.simulateShadow(options);
 assert.equal(JSON.stringify(options),before);assert.deepEqual(a.state.events,b.state.events);assert.deepEqual(a.summary,b.summary);
 engine.validateGame(a.state);
});

test('event-derived summary reconciles score, plays, yards and turnovers',()=>{
 const {state,summary}=adapter.simulateShadow({gameId:'shadow-2',seed:'metrics',home,away,homeProfile,awayProfile});
 assert.equal(summary.home.points,state.score.home);assert.equal(summary.away.points,state.score.away);
 const scrimmage=state.events.filter(e=>e.type==='scrimmage');
 assert.equal(summary.totalPlays,scrimmage.length);
 assert.equal(summary.home.plays+summary.away.plays,scrimmage.length);
 assert.equal(summary.home.yards+summary.away.yards,scrimmage.reduce((n,e)=>n+(e.yards||0),0));
 assert.equal(summary.home.turnovers,state.events.filter(e=>(e.type==='interception'||e.type==='fumble')&&e.team==='home').length);
 assert.equal(summary.away.turnovers,state.events.filter(e=>(e.type==='interception'||e.type==='fumble')&&e.team==='away').length);
});

test('separate offense and defense profiles materially change shadow outcomes',()=>{
 let strongYards=0,weakYards=0,strongPoints=0,weakPoints=0;
 for(let i=0;i<120;i++){
  const seed=`profile-sensitivity-${i}`;
  const strong=adapter.simulateShadow({gameId:`strong-${i}`,seed,home,away,homeProfile:{offense:95,defense:72,overall:84},awayProfile:{offense:72,defense:45,overall:59}});
  const weak=adapter.simulateShadow({gameId:`weak-${i}`,seed,home,away,homeProfile:{offense:45,defense:72,overall:59},awayProfile:{offense:72,defense:95,overall:84}});
  strongYards+=strong.summary.home.yards;weakYards+=weak.summary.home.yards;strongPoints+=strong.summary.home.points;weakPoints+=weak.summary.home.points;
 }
 assert.ok(strongYards>weakYards+3000,`expected offense/defense sensitivity in yards: ${strongYards} vs ${weakYards}`);
 assert.ok(strongPoints>weakPoints,`expected offense/defense sensitivity in points: ${strongPoints} vs ${weakPoints}`);
});

test('aggregate creates stable calibration metrics across a bounded seed set',()=>{
 const samples=[];for(let i=0;i<100;i++)samples.push(adapter.simulateShadow({gameId:`shadow-${i}`,seed:`shadow-audit-${i}`,home,away,homeProfile,awayProfile}));
 const a=adapter.aggregate(samples),b=adapter.aggregate(samples);
 assert.deepEqual(a,b);assert.equal(a.games,100);
 assert.ok(a.points>0&&a.points<120,`mean total points ${a.points}`);
 assert.ok(a.plays>60&&a.plays<220,`mean total plays ${a.plays}`);
 assert.ok(a.yards>100&&a.yards<1400,`mean total yards ${a.yards}`);
 assert.ok(a.turnovers>=0&&a.turnovers<10,`mean turnovers ${a.turnovers}`);
 assert.ok(a.overtime>=0&&a.overtime<=1);assert.ok(a.homeWins>=0&&a.homeWins<=1);
});