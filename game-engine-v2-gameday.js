(function(root,factory){
  const engine=(typeof module==='object'&&module.exports)?require('./game-engine-v2.js'):root.DynastyGameEngineV2;
  const adapter=(typeof module==='object'&&module.exports)?require('./game-engine-v2-adapter.js'):root.DynastyGameEngineV2Adapter;
  const decisions=(typeof module==='object'&&module.exports)?require('./game-engine-v2-decisions.js'):root.DynastyGameEngineV2Decisions;
  const rngApi=(typeof module==='object'&&module.exports)?require('./rng.js'):root.DynastyRng;
  const api=factory(engine,adapter,decisions,rngApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2GameDay=api;
})(typeof window==='object'?window:globalThis,function(engine,adapter,decisions,DynastyRng){
'use strict';
if(!engine||!adapter||!decisions||!DynastyRng)throw new Error('Game Day runner requires Game Engine 2, adapter, decision controller, and RNG.');

const VERSION=2;
const POLICY_ID='adapter-v1';
const TEMPO_POLICY_ID='tempo-v1';
const HALFTIME_POLICY_ID='halftime-v1';
const CONVERSION_POLICY_ID='conversion-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const other=side=>side==='home'?'away':'home';
const normalizeFourth=value=>String(value||'').toLowerCase()==='play'?'go':String(value||'').toLowerCase();

function controlledSideFor(options,made){
  if(options.controlledSide==='home'||options.controlledSide==='away')return options.controlledSide;
  if(options.controlledTeamId==null)return null;
  const id=String(options.controlledTeamId);
  if(String(made.homeInput.id)===id)return'home';if(String(made.awayInput.id)===id)return'away';
  throw new Error('Controlled team is not part of this Game Day matchup.');
}
function validateSession(session){
  if(!session||session.version!==VERSION)throw new Error('Invalid Game Day session version.');
  if(!session.state||session.state.engine!=='v2')throw new Error('Game Day session is missing v2 state.');
  if(!session.inputs?.home||!session.inputs?.away)throw new Error('Game Day session is missing calibrated team inputs.');
  if(session.controlledSide!==null&&session.controlledSide!=='home'&&session.controlledSide!=='away')throw new Error('Invalid Game Day controlled side.');
  for(const side of ['home','away']){
    if(!['normal','hurry','drain'].includes(session.tempo?.[side]))throw new Error(`Invalid ${side} tempo strategy.`);
    if(!['balanced','aggressive','ball_control'].includes(session.halftimeApproach?.[side]))throw new Error(`Invalid ${side} halftime approach.`);
  }
  if(session.pendingConversion&& !['home','away'].includes(session.pendingConversion.side))throw new Error('Invalid pending touchdown conversion.');
  engine.validateState(session.state);return true
}
function createSession(options={}){
  const made=adapter.createShadowGame(options),homeFieldRating=clamp(finite(options.homeFieldRating,0),0,12),controlledSide=controlledSideFor(options,made);
  const session={
    version:VERSION,status:'pregame',gameId:String(options.gameId??made.state.gameId),seed:String(options.seed??made.state.seed),
    state:made.state,inputs:{home:made.homeInput,away:made.awayInput},homeFieldRating,controlledSide,
    tempo:{home:'normal',away:'normal'},tempoDecisionMade:{home:false,away:false},
    halftimeApproach:{home:'balanced',away:'balanced'},halftimeDecisionMade:false,pendingConversion:null,pendingStrategyDecision:null,
    names:{home:String(options.home?.name??made.homeInput.name??'Home'),away:String(options.away?.name??made.awayInput.name??'Away')}
  };
  validateSession(session);return session
}
function isControlled(session,side){return !session.controlledSide||session.controlledSide===side}
function eventState(state){return{
  period:state.period,clock:state.clock,elapsed:state.elapsed,possession:state.possession,fieldPosition:state.fieldPosition,
  down:state.down,distance:state.distance,score:{home:state.score.home,away:state.score.away},
  timeouts:{home:state.timeouts.home,away:state.timeouts.away},status:state.status,
  ot:state.ot?{period:state.ot.period,possession:state.ot.possession,possessions:state.ot.possessions}:null
}}
function pushGameEvent(state,type,data={}){const e={seq:(state.events?.length||0)+1,type,...data,state:eventState(state)};state.events.push(e);return e}
function addGamePoints(state,side,points,type,data={}){state.score[side]+=points;return pushGameEvent(state,type,{team:side,points,...data})}
function kickoffGame(state,receiver,reason){state.pendingKickoff=null;state.possession=receiver;state.fieldPosition=25;state.down=1;state.distance=10;state.drive++;pushGameEvent(state,'kickoff',{receiver,reason,touchback:true})}
function finishRegulationGame(state){state.status='final';state.possession=null;state.fieldPosition=null;state.down=null;state.distance=null;pushGameEvent(state,'game_end',{reason:'regulation',winner:state.score.home>state.score.away?'home':'away'})}
function startRegulationOvertime(state){
  state.period=5;state.clock=0;state.ot={period:1,first:state.openingReceiver,possessions:0,possession:state.openingReceiver,startScore:{...state.score},pendingResult:null};
  state.possession=state.ot.first;state.fieldPosition=75;state.down=1;state.distance=10;pushGameEvent(state,'overtime_start',{overtime:1,first:state.ot.first})
}
function endRegulationAfterConversion(state){
  if(state.status!=='live'||state.period>4||state.clock>0)return false;pushGameEvent(state,'period_end',{period:state.period});
  if(state.period===4){if(state.score.home===state.score.away)startRegulationOvertime(state);else finishRegulationGame(state);return true}
  if(state.period===2){state.period=3;state.clock=900;state.timeouts={home:3,away:3};state.pendingKickoff=null;pushGameEvent(state,'halftime',{});kickoffGame(state,state.secondHalfReceiver,'second_half_kickoff');return true}
  const pending=state.pendingKickoff;state.period++;state.clock=900;pushGameEvent(state,'period_start',{period:state.period});if(pending)kickoffGame(state,pending.receiver,pending.reason);return true
}
function resolvePendingConversion(session,choice='extra_point'){
  const state=session.state,pending=session.pendingConversion;if(!pending)throw new Error('No touchdown conversion is pending.');const side=pending.side;
  const rng=DynastyRng.create(state.rng),roll=rng.next();state.rng=rng.snapshot();
  if(choice==='extra_point'){
    const made=roll<.965;if(made)addGamePoints(state,side,1,'extra_point',{made:true});else pushGameEvent(state,'extra_point',{team:side,points:0,made:false})
  }else if(choice==='two_point'){
    const made=roll<.47;if(made)addGamePoints(state,side,2,'two_point',{made:true});else pushGameEvent(state,'two_point',{team:side,points:0,made:false})
  }else throw new Error(`Unknown conversion choice: ${choice}`);
  session.pendingConversion=null;
  if(state.period<=4&&state.clock===0)state.pendingKickoff={receiver:other(side),reason:'post_touchdown'};else kickoffGame(state,other(side),'post_touchdown');
  endRegulationAfterConversion(state);engine.validateState(state);return state
}
function halftimeAdjustedOutcome(session,state,outcome){
  if(state.period<3)return outcome;const approach=session.halftimeApproach?.[state.possession]||'balanced';
  if(approach==='aggressive'){
    if(!outcome.turnover){if(outcome.kind==='pass'&&outcome.completed)outcome.yards=clamp((Number(outcome.yards)||0)+2,-14,55);else if(outcome.kind==='rush')outcome.yards=clamp((Number(outcome.yards)||0)+1,-14,55)}
    outcome.clock=clamp(Math.round((Number(outcome.clock)||1)*.90),1,45)
  }else if(approach==='ball_control'){
    if(!outcome.turnover&&(Number(outcome.yards)||0)>0)outcome.yards=Math.max(0,(Number(outcome.yards)||0)-1);
    outcome.clock=clamp(Math.round((Number(outcome.clock)||1)*1.10+1),1,45)
  }
  return outcome
}
function tempoAdjustedClock(session,state,clock){
  const tempo=session.tempo?.[state.possession]||'normal',n=Number(clock)||1;
  if(state.period!==4)return n;if(tempo==='hurry')return clamp(Math.round(n*.55),4,45);if(tempo==='drain')return clamp(Math.round(n*1.35+3),1,45);return n
}
function deferredTouchdown(session,state,outcome){
  const offense=state.possession,beforeField=state.fieldPosition,beforeDown=state.down,beforeDistance=state.distance,clock=clamp(Math.round(outcome.clock??30),1,45),used=clamp(clock,0,state.clock);
  state.clock-=used;state.elapsed+=used;state.play++;state.fieldPosition=100;
  pushGameEvent(state,'scrimmage',{team:offense,yards:100-beforeField,from:{fieldPosition:beforeField,down:beforeDown,distance:beforeDistance}});addGamePoints(state,offense,6,'touchdown',{});
  session.pendingConversion={side:offense,createdAfterEventSeq:state.events.length,period:state.period,clock:state.clock};engine.validateState(state);return state
}
function playOutcome(session,state){
  const outcome=adapter.profileOutcome(state,session.inputs.home,session.inputs.away,session.homeFieldRating),start=state.events.length,beforeField=state.fieldPosition;
  halftimeAdjustedOutcome(session,state,outcome);outcome.clock=tempoAdjustedClock(session,state,outcome.clock);
  const yards=clamp(Math.round(outcome.yards??0),-99,99),touchdown=state.period<=4&&!outcome.turnover&&beforeField+yards>=100;
  if(touchdown)deferredTouchdown(session,state,outcome);else engine.applyScrimmage(state,outcome);
  adapter.annotateOutcomeEvent(state,start,outcome);return outcome
}
function executeAction(session,action,state){
  const normalized=normalizeFourth(action);if(normalized==='field_goal')engine.attemptFieldGoal(state);else if(normalized==='punt')engine.punt(state);else if(normalized==='go')playOutcome(session,state);else throw new Error(`Unknown Game Day action: ${action}`)
}
function stepSession(session,state){
  if(session.pendingConversion){resolvePendingConversion(session,'extra_point');return}
  if(state.period>4){if(state.ot?.period>=3||(state.down===4&&state.fieldPosition>=55)){engine.step(state);return}playOutcome(session,state);return}
  if(state.down===4){if(isControlled(session,state.possession))throw new Error('Game Day runner attempted to step through an unresolved fourth-down decision.');executeAction(session,adapter.shadowDecision(state),state);return}
  playOutcome(session,state)
}
function hooks(session){return{policyId:POLICY_ID,defaultAction:state=>adapter.shadowDecision(state),executeAction:(action,state)=>executeAction(session,action,state),step:state=>stepSession(session,state)}}
function nextDecisionId(state){if(!Number.isInteger(state.coachingDecisionCounter)||state.coachingDecisionCounter<0)state.coachingDecisionCounter=0;return`GD-${state.gameId}-${++state.coachingDecisionCounter}`}
function conversionWindow(session){
  const state=session.state,p=session.pendingConversion;if(!p||state.status!=='live'||state.period!==4||state.clock>600||!isControlled(session,p.side))return false;
  const margin=(state.score[p.side]||0)-(state.score[other(p.side)]||0);return Math.abs(margin)<=8
}
function createConversionDecision(session){
  if(!conversionWindow(session))return null;if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,side=session.pendingConversion.side,team=state[side]?.name||session.names[side],mine=state.score[side],theirs=state.score[other(side)],min=Math.floor(state.clock/60),sec=String(state.clock%60).padStart(2,'0');
  const decision={id:nextDecisionId(state),type:'two_point_decision',policyId:CONVERSION_POLICY_ID,team:side,teamId:state[side]?.id??null,contextKey:`conversion:${state.period}:${state.clock}:${side}:${mine}:${theirs}`,situation:`Q4 ${min}:${sec} · TOUCHDOWN ${team} · ${mine}–${theirs}`,context:{period:state.period,clock:state.clock,possession:side,fieldPosition:100,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts}},options:[{id:'extra_point',label:'Kick PAT'},{id:'two_point',label:'Go for two'},{id:'delegate',label:'Delegate to staff'}],staffRecommendation:'extra_point',defaultOption:'extra_point',createdAfterEventSeq:state.events?.length||0};
  session.pendingStrategyDecision=decision;return clone(decision)
}
function halftimeWindow(session){
  const state=session.state;if(session.halftimeDecisionMade||state.status!=='live'||state.period!==3||state.clock!==900)return false;if(!(state.events||[]).slice(-5).some(e=>e.type==='halftime'))return false;const side=session.controlledSide||state.possession;return !!side&&isControlled(session,side)
}
function createHalftimeDecision(session){
  if(!halftimeWindow(session))return null;if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,side=session.controlledSide||state.possession,team=state[side]?.name||session.names[side],mine=state.score[side]||0,theirs=state.score[other(side)]||0;
  const decision={id:nextDecisionId(state),type:'halftime_adjustment',policyId:HALFTIME_POLICY_ID,team:side,teamId:state[side]?.id??null,contextKey:`halftime:${side}:${state.score.home}:${state.score.away}`,situation:`HALFTIME · ${team} ${mine===theirs?'tied':mine>theirs?`leads ${mine}–${theirs}`:`trails ${mine}–${theirs}`}`,context:{period:state.period,clock:state.clock,possession:state.possession,fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts}},options:[{id:'aggressive',label:'Open it up'},{id:'balanced',label:'Stay balanced'},{id:'ball_control',label:'Lean ball control'},{id:'delegate',label:'Delegate to staff'}],staffRecommendation:'balanced',defaultOption:'balanced',createdAfterEventSeq:state.events?.length||0};
  session.pendingStrategyDecision=decision;return clone(decision)
}
function tempoWindow(session){
  const state=session.state,side=state.possession;if(state.status!=='live'||state.period!==4||state.clock<=0||state.clock>300||state.down!==1||!side)return false;if(!isControlled(session,side)||session.tempoDecisionMade?.[side])return false;return Math.abs((state.score?.home||0)-(state.score?.away||0))<=16
}
function createTempoDecision(session){
  if(!tempoWindow(session))return null;if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,side=state.possession,min=Math.floor(state.clock/60),sec=String(state.clock%60).padStart(2,'0'),team=state[side]?.name||session.names[side],margin=(state.score[side]||0)-(state.score[other(side)]||0);
  const decision={id:nextDecisionId(state),type:'late_game_tempo',policyId:TEMPO_POLICY_ID,team:side,teamId:state[side]?.id??null,contextKey:`tempo:${state.period}:${state.clock}:${side}:${state.fieldPosition}:${state.score.home}:${state.score.away}`,situation:`Q4 ${min}:${sec} · ${team} ball · ${margin===0?'tie game':margin>0?`leading by ${margin}`:`trailing by ${Math.abs(margin)}`}`,context:{period:state.period,clock:state.clock,possession:side,fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts}},options:[{id:'hurry',label:'Hurry-up'},{id:'normal',label:'Normal tempo'},{id:'drain',label:'Drain clock'},{id:'delegate',label:'Delegate to staff'}],staffRecommendation:'normal',defaultOption:'normal',createdAfterEventSeq:state.events?.length||0};
  session.pendingStrategyDecision=decision;return clone(decision)
}
function appendStrategyReceipt(session,decision,selectedOption,resolvedAction){const state=session.state,event={seq:(state.events?.length||0)+1,type:'coaching_decision',decisionId:decision.id,decisionType:decision.type,policyId:decision.policyId,team:decision.team,selectedOption,resolvedAction,staffRecommendation:decision.staffRecommendation,situation:decision.situation,state:eventState(state)};state.events.push(event);return event}
function currentDecision(session){
  if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);const state=session.state;
  if(session.pendingConversion){const conversion=createConversionDecision(session);if(conversion)return conversion;resolvePendingConversion(session,'extra_point');if(state.status==='final')return null}
  const existing=decisions.pendingDecision(state);if(existing){if(isControlled(session,existing.team))return clone(existing);state.pendingCoachingDecision=null}
  if(state.status==='live'&&state.period<=4&&state.down===4&&state.possession&&isControlled(session,state.possession))return decisions.ensureDecision(state,hooks(session));
  return createHalftimeDecision(session)||createTempoDecision(session)
}
function resolveStrategy(session,optionId){
  const decision=session.pendingStrategyDecision;if(!decision)throw new Error('No strategy decision is pending.');const selected=String(optionId||'delegate');if(!decision.options.some(o=>o.id===selected))throw new Error(`Illegal ${decision.type} option: ${selected}`);const action=selected==='delegate'?decision.defaultOption:selected;session.pendingStrategyDecision=null;
  if(decision.type==='two_point_decision'){
    if(!['extra_point','two_point'].includes(action))throw new Error(`Unknown conversion action: ${action}`);appendStrategyReceipt(session,decision,selected,action);resolvePendingConversion(session,action)
  }else if(decision.type==='late_game_tempo'){
    if(!['normal','hurry','drain'].includes(action))throw new Error(`Unknown tempo action: ${action}`);session.tempo[decision.team]=action;session.tempoDecisionMade[decision.team]=true;appendStrategyReceipt(session,decision,selected,action)
  }else if(decision.type==='halftime_adjustment'){
    if(!['balanced','aggressive','ball_control'].includes(action))throw new Error(`Unknown halftime action: ${action}`);session.halftimeApproach[decision.team]=action;session.halftimeDecisionMade=true;appendStrategyReceipt(session,decision,selected,action)
  }else throw new Error(`Unknown strategy decision type: ${decision.type}`);
  engine.validateState(session.state);return{decision:clone(decision),selectedOption:selected,resolvedAction:action,state:session.state,session}
}
function finalResult(session){session.status='final';session.summary=adapter.eventSummary(session.state);return{status:'final',decision:null,session}}
function advanceOne(session){
  validateSession(session);const state=session.state;if(state.status==='pregame')engine.startGame(state);if(state.status==='final')return finalResult(session);
  const before=currentDecision(session);if(state.status==='final')return finalResult(session);if(before){session.status='decision';return{status:'decision',decision:clone(before),session}}
  stepSession(session,state);if(state.status==='final')return finalResult(session);
  const after=currentDecision(session);if(state.status==='final')return finalResult(session);session.status=after?'decision':'live';return{status:session.status,decision:after?clone(after):null,session}
}
function advance(session,maxSteps=500){
  validateSession(session);let steps=0;while(session.state.status!=='final'){const out=advanceOne(session);if(out.status==='decision'||out.status==='final')return{...out,steps};if(++steps>maxSteps)throw new Error('Game Day runner step limit exceeded.')}return finalResult(session)
}
function resolve(session,optionId='delegate'){
  validateSession(session);let result;if(session.pendingStrategyDecision)result=resolveStrategy(session,optionId);else result=decisions.resolveDecision(session.state,optionId,hooks(session));session.status=session.state.status==='final'?'final':'live';if(session.status==='final')session.summary=adapter.eventSummary(session.state);return{...result,session}
}
function simulate(session,chooser=()=> 'delegate',maxWindows=200){
  let windows=0;while(session.state.status!=='final'){const out=advance(session);if(out.status==='final')break;if(++windows>maxWindows)throw new Error('Game Day session decision safety limit exceeded.');resolve(session,chooser(clone(out.decision),session))}engine.validateGame(session.state);session.status='final';session.summary=adapter.eventSummary(session.state);return session
}
function snapshot(session){validateSession(session);return clone(session)}
function restore(value){const session=clone(value);validateSession(session);const pending=session.pendingStrategyDecision||decisions.pendingDecision(session.state);session.status=session.state.status==='final'?'final':(pending?'decision':session.state.status);return session}
function pendingDecision(session){validateSession(session);return session.pendingStrategyDecision?clone(session.pendingStrategyDecision):decisions.pendingDecision(session.state)}

return{VERSION,POLICY_ID,TEMPO_POLICY_ID,HALFTIME_POLICY_ID,CONVERSION_POLICY_ID,createSession,advanceOne,advance,resolve,simulate,snapshot,restore,pendingDecision,validateSession};
});
