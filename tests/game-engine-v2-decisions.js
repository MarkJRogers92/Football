const {test}=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../game-engine-v2.js');
const decisions=require('../game-engine-v2-decisions.js');

const teams={home:{id:1,name:'Chicago Metropolitan',rating:82},away:{id:2,name:'Great Lakes University',rating:72}};
const make=(id,seed)=>engine.createGame({gameId:id,seed,...teams,openingReceiver:'home'});
const withoutDecisionEvents=events=>(events||[]).filter(e=>e.type!=='coaching_decision').map(e=>{const copy=JSON.parse(JSON.stringify(e));delete copy.seq;return copy});

function finishDelegated(state){return decisions.simulateWithDecisions(state,()=> 'delegate')}

test('decision runner pauses at a stable serializable fourth-down window',()=>{
  const g=make('DEC-PAUSE','decision-pause');
  const out=decisions.advanceUntilDecision(g);
  assert.equal(out.status,'decision');assert.equal(out.decision.type,'fourth_down');assert.equal(out.decision.context.down,4);
  assert.ok(out.decision.id.startsWith('GD-DEC-PAUSE-'));assert.equal(out.decision.defaultOption,out.decision.staffRecommendation);
  assert.ok(out.decision.options.some(o=>o.id==='go'));assert.ok(out.decision.options.some(o=>o.id==='punt'));assert.ok(out.decision.options.some(o=>o.id==='delegate'));
  const again=decisions.ensureDecision(g);assert.equal(again.id,out.decision.id,'rendering/re-reading must not create a second decision');
  const restored=engine.restore(JSON.parse(JSON.stringify(g)));
  assert.deepEqual(decisions.pendingDecision(restored),out.decision,'pending decision survives JSON serialization and core restore');
});

test('same seed plus same decisions resumes with the exact same future',()=>{
  const original=make('DEC-RESUME','decision-resume');const first=decisions.advanceUntilDecision(original);assert.equal(first.status,'decision');
  const a=engine.restore(JSON.parse(JSON.stringify(original))),b=engine.restore(JSON.parse(JSON.stringify(original)));
  const option=first.decision.options.some(o=>o.id==='field_goal')?'field_goal':'go';
  decisions.resolveDecision(a,option);decisions.resolveDecision(b,option);finishDelegated(a);finishDelegated(b);
  assert.deepEqual(a.score,b.score);assert.deepEqual(a.events,b.events);assert.deepEqual(a.rng,b.rng);engine.validateGame(a);engine.validateGame(b);
});

test('delegating every fourth down reproduces the calibrated core football result',()=>{
  const baseline=make('DEC-DELEGATE','decision-delegate'),interactive=make('DEC-DELEGATE','decision-delegate');
  engine.simulate(baseline);finishDelegated(interactive);
  assert.deepEqual(interactive.score,baseline.score,'delegation must preserve the calibrated final score');
  assert.deepEqual(interactive.rng,baseline.rng,'delegation must consume the exact same gameplay RNG');
  assert.deepEqual(withoutDecisionEvents(interactive.events),withoutDecisionEvents(baseline.events),'delegation must preserve the underlying football event stream');
  assert.ok(interactive.events.some(e=>e.type==='coaching_decision'),'interactive path records durable coaching receipts');
});

test('different fourth-down choices create different deterministic event streams',()=>{
  const base=make('DEC-BRANCH','decision-branch');const pending=decisions.advanceUntilDecision(base);assert.equal(pending.status,'decision');
  const goState=engine.restore(JSON.parse(JSON.stringify(base))),puntState=engine.restore(JSON.parse(JSON.stringify(base)));
  const go=decisions.resolveDecision(goState,'go'),punt=decisions.resolveDecision(puntState,'punt');
  assert.equal(go.resolvedAction,'go');assert.equal(punt.resolvedAction,'punt');
  assert.notDeepEqual(goState.events,puntState.events);
  assert.equal(goState.events.find(e=>e.type==='coaching_decision')?.selectedOption,'go');
  assert.equal(puntState.events.find(e=>e.type==='coaching_decision')?.selectedOption,'punt');
  finishDelegated(goState);finishDelegated(puntState);engine.validateGame(goState);engine.validateGame(puntState);
});

test('delegate resolves through the legacy recommendation and illegal choices cannot mutate the window',()=>{
  const g=make('DEC-LEGAL','decision-legal');engine.startGame(g);g.period=4;g.clock=420;g.possession='home';g.fieldPosition=70;g.down=4;g.distance=5;
  const d=decisions.ensureDecision(g);assert.equal(d.fieldGoalDistance,47);assert.equal(d.staffRecommendation,'field_goal');assert.ok(d.options.some(o=>o.id==='field_goal'));
  const before=JSON.stringify(g);assert.throws(()=>decisions.resolveDecision(g,'fake_call'),/Illegal coaching decision option/);assert.equal(JSON.stringify(g),before,'illegal choice must leave the pending decision unchanged');
  const result=decisions.resolveDecision(g,'delegate');assert.equal(result.selectedOption,'delegate');assert.equal(result.resolvedAction,'field_goal');
  const receipt=g.events.find(e=>e.type==='coaching_decision'&&e.decisionId===d.id);assert.ok(receipt);assert.equal(receipt.resolvedAction,'field_goal');assert.equal(receipt.staffRecommendation,'field_goal');
});
