const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../game-engine-v2.js');
const teams={home:{id:1,name:'Chicago Metropolitan',rating:82},away:{id:2,name:'Great Lakes University',rating:72}};

test('initial state is compact, valid and kickoff establishes football state',()=>{
 const g=engine.createGame({gameId:'G1',seed:'alpha',...teams,openingReceiver:'home'});
 assert.equal(g.status,'pregame');assert.equal(g.events.length,0);engine.startGame(g);
 assert.equal(g.status,'live');assert.equal(g.period,1);assert.equal(g.clock,900);assert.equal(g.possession,'home');assert.equal(g.fieldPosition,25);assert.equal(g.down,1);assert.equal(g.distance,10);
 assert.deepEqual(g.events.map(e=>e.type),['game_start','kickoff']);engine.validateState(g);
});

test('downs, first downs, touchdowns and turnover on downs transition correctly',()=>{
 const g=engine.createGame({gameId:'G2',seed:'beta',...teams,openingReceiver:'home'});engine.startGame(g);
 engine.applyScrimmage(g,{yards:4,clock:20});assert.equal(g.down,2);assert.equal(g.distance,6);assert.equal(g.fieldPosition,29);
 engine.applyScrimmage(g,{yards:8,clock:20});assert.equal(g.down,1);assert.equal(g.distance,10);assert.equal(g.fieldPosition,37);
 g.fieldPosition=94;g.down=1;g.distance=6;engine.applyScrimmage(g,{yards:8,clock:10});assert.ok(g.score.home>=6);assert.equal(g.possession,'away');assert.equal(g.fieldPosition,25);
 const h=engine.createGame({gameId:'G3',seed:'gamma',...teams,openingReceiver:'home'});engine.startGame(h);h.down=4;h.distance=4;h.fieldPosition=40;engine.applyScrimmage(h,{yards:2,clock:8});assert.equal(h.possession,'away');assert.equal(h.fieldPosition,58);assert.equal(h.down,1);
});

test('quarter and halftime transitions preserve possession rules and reset halftime timeouts',()=>{
 const g=engine.createGame({gameId:'G4',seed:'delta',...teams,openingReceiver:'home'});engine.startGame(g);g.clock=5;engine.applyScrimmage(g,{yards:1,clock:5});assert.equal(g.period,2);assert.equal(g.clock,900);
 g.timeouts.home=1;g.timeouts.away=0;g.clock=3;engine.applyScrimmage(g,{yards:0,clock:3});assert.equal(g.period,3);assert.equal(g.clock,900);assert.deepEqual(g.timeouts,{home:3,away:3});assert.equal(g.possession,'away');assert.equal(g.fieldPosition,25);
});

test('same seed creates identical full games and different seed changes the event stream',()=>{
 const run=seed=>{const g=engine.createGame({gameId:'DET',seed,...teams});engine.simulate(g);return g};
 const a=run('same-seed'),b=run('same-seed'),c=run('other-seed');
 assert.deepEqual(a.events,b.events);assert.deepEqual(a.score,b.score);assert.notDeepEqual(a.events,c.events);engine.validateGame(a);engine.validateGame(c);
});

test('serialized mid-game state resumes with the exact same future',()=>{
 const a=engine.createGame({gameId:'RESUME',seed:'resume-seed',...teams});engine.startGame(a);for(let i=0;i<35;i++)engine.step(a);
 const resumed=engine.restore(JSON.parse(JSON.stringify(a))),baseline=engine.restore(JSON.parse(JSON.stringify(a)));
 engine.simulate(resumed);engine.simulate(baseline);assert.deepEqual(resumed.events,baseline.events);assert.deepEqual(resumed.score,baseline.score);engine.validateGame(resumed);
});

test('a score at 0:00 does not create a phantom kickoff before halftime',()=>{
 const g=engine.createGame({gameId:'HALF-SCORE',seed:'half-score',...teams,openingReceiver:'home'});engine.startGame(g);
 g.period=2;g.clock=1;g.fieldPosition=99;g.down=1;g.distance=1;
 const beforeKickoffs=g.events.filter(e=>e.type==='kickoff').length;
 engine.applyScrimmage(g,{yards:1,clock:1});
 assert.equal(g.period,3);assert.equal(g.possession,'away');assert.equal(g.fieldPosition,25);
 const kickoffs=g.events.filter(e=>e.type==='kickoff');
 assert.equal(kickoffs.length,beforeKickoffs+1,'only the second-half kickoff is recorded after a 0:00 score');
 assert.equal(kickoffs.at(-1).reason,'second_half_kickoff');
});

test('a tied regulation game enters college overtime and resolves without a tie',()=>{
 const g=engine.createGame({gameId:'OT',seed:'overtime-seed',...teams,openingReceiver:'home'});engine.startGame(g);
 g.period=4;g.clock=1;g.score={home:21,away:21};
 g.events.push({seq:g.events.length+1,type:'test_score_seed',team:'home',points:21,state:{...g.events.at(-1).state,score:{home:21,away:21}}});
 g.events.push({seq:g.events.length+1,type:'test_score_seed',team:'away',points:21,state:{...g.events.at(-1).state,score:{home:21,away:21}}});
 engine.applyScrimmage(g,{yards:0,clock:1});assert.equal(g.period,5);assert.ok(g.events.some(e=>e.type==='overtime_start'));
 engine.simulate(g);assert.equal(g.status,'final');assert.notEqual(g.score.home,g.score.away);assert.ok(g.events.some(e=>e.type==='game_end'));engine.validateGame(g);
});

test('100 seeded games finish untied with score/event and state invariants intact',()=>{
 for(let i=0;i<100;i++){
  const g=engine.createGame({gameId:`AUD-${i}`,seed:`audit-${i}`,...teams});engine.simulate(g);engine.validateGame(g);
  assert.equal(g.status,'final');assert.notEqual(g.score.home,g.score.away);assert.ok(g.events.length<1200);
  const totals=engine.scoringTotals(g);assert.deepEqual(totals,g.score);
 }
});