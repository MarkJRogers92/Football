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

test('controlled Game Day never asks the user to make the opponent fourth-down decision',()=>{
  const session=gameday.createSession({...options,gameId:'GD-OWNERSHIP',seed:'gameday-ownership',controlledTeamId:home.id});engine.startGame(session.state);
  Object.assign(session.state,{period:2,clock:500,possession:'away',fieldPosition:42,down:4,distance:6});
  const auto=gameday.advanceOne(session);assert.notEqual(auto.status,'decision');
  assert.equal(session.state.events.filter(e=>e.type==='coaching_decision'&&e.team==='away').length,0);
  Object.assign(session.state,{period:2,clock:430,possession:'home',fieldPosition:45,down:4,distance:2});
  const mine=gameday.advanceOne(session);assert.equal(mine.status,'decision');assert.equal(mine.decision.type,'fourth_down');assert.equal(mine.decision.team,'home');
});

test('late-game tempo is a serializable user decision and changes clock behavior without extra RNG',()=>{
  const base=gameday.createSession({...options,gameId:'GD-TEMPO',seed:'gameday-tempo',controlledTeamId:home.id});engine.startGame(base.state);
  Object.assign(base.state,{period:4,clock:240,possession:'home',fieldPosition:35,down:1,distance:10,score:{home:20,away:24}});
  const pending=gameday.advanceOne(base);assert.equal(pending.status,'decision');assert.equal(pending.decision.type,'late_game_tempo');assert.equal(pending.decision.staffRecommendation,'normal');
  assert.deepEqual(pending.decision.options.map(o=>o.id),['hurry','normal','drain','delegate']);
  const saved=JSON.parse(JSON.stringify(gameday.snapshot(base))),hurry=gameday.restore(saved),drain=gameday.restore(saved);
  gameday.resolve(hurry,'hurry');gameday.resolve(drain,'drain');assert.equal(hurry.tempo.home,'hurry');assert.equal(drain.tempo.home,'drain');
  const rngBefore=JSON.parse(JSON.stringify(hurry.state.rng));assert.deepEqual(drain.state.rng,rngBefore);
  gameday.advanceOne(hurry);gameday.advanceOne(drain);
  assert.ok(hurry.state.clock>drain.state.clock,'hurry-up should consume less clock than drain-clock on the same deterministic snap');
  assert.deepEqual(hurry.state.rng,drain.state.rng,'tempo changes clock management without drawing extra random numbers');
  assert.ok(hurry.state.events.some(e=>e.type==='coaching_decision'&&e.decisionType==='late_game_tempo'&&e.resolvedAction==='hurry'));
});

test('halftime adjustment pauses at the real halftime transition and branches second-half clock behavior deterministically',()=>{
  const base=gameday.createSession({...options,gameId:'GD-HALF',seed:'gameday-half',controlledTeamId:home.id});let out;
  for(let i=0;i<200;i++){
    out=gameday.advance(base);
    if(out.status==='final')assert.fail('game ended before halftime decision');
    if(out.status==='decision'&&out.decision.type==='halftime_adjustment')break;
    if(out.status==='decision')gameday.resolve(base,'delegate');
  }
  assert.equal(out.status,'decision');assert.equal(out.decision.type,'halftime_adjustment');assert.equal(out.decision.team,'home');assert.equal(out.decision.staffRecommendation,'balanced');
  assert.deepEqual(out.decision.options.map(o=>o.id),['aggressive','balanced','ball_control','delegate']);
  const saved=JSON.parse(JSON.stringify(gameday.snapshot(base))),aggressive=gameday.restore(saved),control=gameday.restore(saved);
  gameday.resolve(aggressive,'aggressive');gameday.resolve(control,'ball_control');
  assert.equal(aggressive.halftimeApproach.home,'aggressive');assert.equal(control.halftimeApproach.home,'ball_control');
  Object.assign(aggressive.state,{period:3,clock:850,possession:'home',fieldPosition:35,down:1,distance:10});
  Object.assign(control.state,{period:3,clock:850,possession:'home',fieldPosition:35,down:1,distance:10});
  const rngBefore=JSON.parse(JSON.stringify(aggressive.state.rng));assert.deepEqual(control.state.rng,rngBefore);
  gameday.advanceOne(aggressive);gameday.advanceOne(control);
  assert.ok(aggressive.state.clock>control.state.clock,'aggressive halftime approach should use less clock than ball control on the same deterministic snap');
  assert.deepEqual(aggressive.state.rng,control.state.rng,'halftime approach changes the deterministic outcome transform without extra RNG draws');
  assert.ok(aggressive.state.events.some(e=>e.type==='coaching_decision'&&e.decisionType==='halftime_adjustment'&&e.resolvedAction==='aggressive'));
});

test('meaningful late-game touchdown pauses before conversion and PAT/two-point choices consume the same single RNG draw',()=>{
  const base=gameday.createSession({...options,gameId:'GD-2PT',seed:'gameday-two-point',controlledTeamId:home.id});engine.startGame(base.state);
  Object.assign(base.state,{period:4,clock:120,possession:'home',fieldPosition:100,down:1,distance:1,score:{home:26,away:28}});base.pendingConversion={side:'home',createdAfterEventSeq:base.state.events.length,period:4,clock:120};base.tempoDecisionMade.home=true;base.halftimeDecisionMade=true;
  const pending=gameday.advanceOne(base);assert.equal(pending.status,'decision');assert.equal(pending.decision.type,'two_point_decision');assert.equal(pending.decision.staffRecommendation,'extra_point');assert.deepEqual(pending.decision.options.map(o=>o.id),['extra_point','two_point','delegate']);
  const saved=JSON.parse(JSON.stringify(gameday.snapshot(base))),pat=gameday.restore(saved),two=gameday.restore(saved),rngBefore=JSON.parse(JSON.stringify(base.state.rng));
  gameday.resolve(pat,'extra_point');gameday.resolve(two,'two_point');
  assert.equal(pat.pendingConversion,null);assert.equal(two.pendingConversion,null);assert.deepEqual(pat.state.rng,two.state.rng);assert.notDeepEqual(pat.state.rng,rngBefore,'conversion should consume exactly one deterministic RNG draw');
  assert.ok(pat.state.events.some(e=>e.type==='extra_point'));assert.ok(two.state.events.some(e=>e.type==='two_point'));assert.ok(two.state.events.some(e=>e.type==='coaching_decision'&&e.decisionType==='two_point_decision'&&e.resolvedAction==='two_point'));
  assert.ok(pat.state.events.some(e=>e.type==='kickoff'));assert.ok(two.state.events.some(e=>e.type==='kickoff'));engine.validateState(pat.state);engine.validateState(two.state);
});

test('routine fourth downs are played with the staff call without stopping the game',()=>{
  let stopsAll=0,stopsRoutine=0;
  for(let i=0;i<20;i++){
    const o={...options,gameId:`GD-ROUTINE-${i}`,seed:`gameday-routine-${i}`,controlledTeamId:1};
    const baseline=adapter.simulateShadow(o),all=gameday.createSession(o),skip=gameday.createSession({...o,skipRoutine:true});
    finishDelegated(all);finishDelegated(skip);
    // Delegating every call gives the same game either way: the staff make the routine calls too.
    assert.deepEqual(skip.state.score,baseline.state.score);assert.deepEqual(normalized(skip.state.events),normalized(baseline.state.events));
    const fourth=s=>s.state.events.filter(e=>e.type==='coaching_decision'&&e.decisionType==='fourth_down');
    stopsAll+=fourth(all).length;stopsRoutine+=fourth(skip).length;
    for(const e of fourth(skip)){
      const st=e.state,margin=st.score[e.team]-st.score[e.team==='home'?'away':'home'],late=st.period===4&&(margin<0||(st.clock<=480&&Math.abs(margin)<=8));
      const routinePunt=e.resolvedAction==='punt'&&st.distance>=4&&st.fieldPosition<=50&&!late;
      assert.ok(!routinePunt,`stopped for a routine punt: ${e.situation}`);
    }
  }
  assert.ok(stopsRoutine<stopsAll*.6,`routine calls no longer stop the game (${stopsRoutine} of ${stopsAll})`);
  assert.ok(stopsRoutine>0,'real dilemmas still stop it');
});

// v0.19: a call for each drive and a defensive call on the third downs that decide something.
test('a coached game asks for a call at the start of each of the coach\'s drives, and only his',()=>{
  const session=gameday.createSession({...options,gameId:'GD-DRIVE',seed:'gameday-drive',controlledTeamId:home.id,calls:true});
  const seen=[];
  gameday.simulate(session,decision=>{seen.push(decision);return decision.type==='drive_call'?'ground':'delegate'});
  const drives=seen.filter(d=>d.type==='drive_call');
  assert.ok(drives.length>=6,`a full game has several drives to call, saw ${drives.length}`);
  assert.ok(seen.every(d=>d.team==='home'),'every decision belongs to the coached side');
  assert.deepEqual(drives[0].options.map(o=>o.id),['balanced','ground','quick','shots','delegate']);
  assert.ok(drives.every(d=>d.context.down===1&&d.context.possession==='home'),'a drive call comes on first down with the ball');
  assert.equal(new Set(drives.map(d=>d.context.drive)).size,drives.length,'one call per drive');
  assert.ok(seen.length<=30,`a coached game stays a manageable number of decisions, saw ${seen.length}`);
  engine.validateGame(session.state);
});

test('a session without calls (Coach big moments, the lab, simulated games) never stops for them',()=>{
  const session=gameday.createSession({...options,gameId:'GD-BIG',seed:'gameday-drive',controlledTeamId:home.id,calls:false});
  const types=new Set();gameday.simulate(session,decision=>{types.add(decision.type);return'delegate'});
  assert.ok(!types.has('drive_call')&&!types.has('defense_call'));
});

test('a drive call changes how the offense plays without drawing extra random numbers',()=>{
  const base=gameday.createSession({...options,gameId:'GD-CALL',seed:'gameday-call',controlledTeamId:home.id,calls:true});
  let first=gameday.advance(base);while(first.decision.type!=='drive_call'){gameday.resolve(base,'delegate');first=gameday.advance(base)}
  const saved=JSON.parse(JSON.stringify(gameday.snapshot(base)));
  const tally=call=>{const s=gameday.restore(saved);gameday.resolve(s,call);const from=s.state.events.length;let rng=null;
    for(let i=0;i<4;i++){const out=gameday.advanceOne(s);if(i===0)rng=JSON.stringify(s.state.rng);if(out.status!=='live')break}
    return{rng,passes:s.state.events.slice(from).filter(e=>e.kind==='pass').length,call:s.driveCall.home}};
  const ground=tally('ground'),shots=tally('shots');
  assert.equal(ground.call,'ground');assert.equal(shots.call,'shots');
  assert.equal(ground.rng,shots.rng,'the call moves thresholds, not the number of draws');
  let groundPasses=0,shotPasses=0;
  for(let i=0;i<60;i++){
    for(const [call,add] of [['ground',n=>groundPasses+=n],['shots',n=>shotPasses+=n]]){
      const s=gameday.createSession({...options,gameId:`GD-MIX-${i}`,seed:`gameday-mix-${i}`,controlledTeamId:home.id,calls:true});
      gameday.simulate(s,d=>d.type==='drive_call'?call:d.type==='defense_call'?'base':'delegate');
      add(s.state.events.filter(e=>e.team==='home'&&e.kind==='pass').length);
    }
  }
  assert.ok(shotPasses>groundPasses*1.25,`taking shots throws far more than running it (${shotPasses} vs ${groundPasses})`);
});

test('a defensive call covers one snap and only key third downs',()=>{
  const session=gameday.createSession({...options,gameId:'GD-DEF',seed:'gameday-def',controlledTeamId:home.id,calls:true});engine.startGame(session.state);
  session.driveAsked=-1;
  Object.assign(session.state,{period:2,clock:500,possession:'away',fieldPosition:40,down:3,distance:6});
  assert.notEqual(gameday.advanceOne(session).decision?.type,'defense_call','an ordinary third down at midfield is played, not asked');
  for(const pending of [gameday.pendingDecision(session)])if(pending)gameday.resolve(session,'delegate');
  Object.assign(session.state,{period:2,clock:400,possession:'away',fieldPosition:78,down:3,distance:9});
  const asked=gameday.advanceOne(session);
  assert.equal(asked.status,'decision');assert.equal(asked.decision.type,'defense_call');assert.equal(asked.decision.team,'home');
  assert.equal(asked.decision.staffRecommendation,'coverage','third and long: the staff drop into coverage');
  assert.deepEqual(asked.decision.options.map(o=>o.id),['base','pressure','coverage','run_stop','delegate']);
  gameday.resolve(session,'pressure');
  assert.equal(session.defenseCall.call,'pressure');
  gameday.advanceOne(session);
  assert.equal(session.defenseCall,null,'the call is spent on the snap it was made for');
});

test('a live game saved before v0.19 resumes and plays without the new calls',()=>{
  const session=gameday.createSession({...options,gameId:'GD-OLD',seed:'gameday-old',controlledTeamId:home.id,calls:true});
  const old=JSON.parse(JSON.stringify(gameday.snapshot(session)));
  for(const key of ['driveCall','driveAsked','defenseCall','defenseAsked'])delete old[key];
  const resumed=gameday.restore(old),types=new Set();
  gameday.simulate(resumed,decision=>{types.add(decision.type);return'delegate'});
  assert.ok(!types.has('drive_call')&&!types.has('defense_call'));engine.validateGame(resumed.state);
});
