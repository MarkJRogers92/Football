const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../game-engine-v2.js');
const adapter=require('../game-engine-v2-adapter.js');
const gameday=require('../game-engine-v2-gameday.js');

const home={id:1,name:'Chicago Metropolitan'};
const away={id:2,name:'Great Lakes University'};
const homeProfile={overall:84,offense:87,defense:81};
const awayProfile={overall:76,offense:74,defense:78};
const options={gameId:'GD-RUN',seed:'gameday-runner',home,away,homeProfile,awayProfile,homeFieldRating:4.5,openingReceiver:'home'};

const normalized=events=>(events||[]).filter(e=>e.type!=='coaching_decision').map(e=>{const c=JSON.parse(JSON.stringify(e));delete c.seq;return c});
const finishDelegated=session=>gameday.simulate(session,()=> 'delegate');

test('all-delegated Game Day session reproduces the calibrated adapter result exactly',()=>{
  const baseline=adapter.simulateShadow(options),session=gameday.createSession(options);finishDelegated(session);
  assert.deepEqual(session.state.score,baseline.state.score);assert.deepEqual(session.state.rng,baseline.state.rng);
  assert.deepEqual(normalized(session.state.events),normalized(baseline.state.events));
  assert.deepEqual(session.summary,baseline.summary);assert.ok(session.state.events.some(e=>e.type==='coaching_decision'));
  engine.validateGame(session.state);
});

test('Game Day session pauses, serializes, restores, and resumes with the exact same future',()=>{
  const session=gameday.createSession({...options,gameId:'GD-RESUME',seed:'gameday-resume'}),first=gameday.advance(session);
  assert.equal(first.status,'decision');assert.equal(first.decision.type,'fourth_down');assert.equal(gameday.pendingDecision(session).id,first.decision.id);
  const saved=JSON.parse(JSON.stringify(gameday.snapshot(session))),a=gameday.restore(saved),b=gameday.restore(saved);
  assert.equal(a.status,'decision');assert.deepEqual(gameday.pendingDecision(a),gameday.pendingDecision(b));
  const choice=first.decision.options.some(o=>o.id==='field_goal')?'field_goal':'go';
  gameday.resolve(a,choice);gameday.resolve(b,choice);finishDelegated(a);finishDelegated(b);
  assert.deepEqual(a.state.events,b.state.events);assert.deepEqual(a.state.score,b.state.score);assert.deepEqual(a.state.rng,b.state.rng);engine.validateGame(a.state);
});

test('Game Day uses the calibrated adapter fourth-down policy for staff recommendations',()=>{
  const session=gameday.createSession({...options,gameId:'GD-POLICY',seed:'gameday-policy'});engine.startGame(session.state);
  Object.assign(session.state,{period:2,clock:430,possession:'home',fieldPosition:45,down:4,distance:2});
  const out=gameday.advance(session);assert.equal(out.status,'decision');assert.equal(out.decision.staffRecommendation,'go','adapter policy goes on 4th-and-2 near midfield');assert.equal(out.decision.policyId,gameday.POLICY_ID);
});

test('different Game Day fourth-down choices branch the calibrated future',()=>{
  const base=gameday.createSession({...options,gameId:'GD-BRANCH',seed:'gameday-branch'}),pending=gameday.advance(base);assert.equal(pending.status,'decision');
  const go=gameday.restore(gameday.snapshot(base)),punt=gameday.restore(gameday.snapshot(base));
  gameday.resolve(go,'go');gameday.resolve(punt,'punt');
  assert.notDeepEqual(go.state.events,punt.state.events);
  finishDelegated(go);finishDelegated(punt);engine.validateGame(go.state);engine.validateGame(punt.state);
  const goReceipt=go.state.events.find(e=>e.type==='coaching_decision'&&e.selectedOption==='go');const puntReceipt=punt.state.events.find(e=>e.type==='coaching_decision'&&e.selectedOption==='punt');
  assert.ok(goReceipt);assert.ok(puntReceipt);
});
