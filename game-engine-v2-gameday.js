(function(root,factory){
  const engine=(typeof module==='object'&&module.exports)?require('./game-engine-v2.js'):root.DynastyGameEngineV2;
  const adapter=(typeof module==='object'&&module.exports)?require('./game-engine-v2-adapter.js'):root.DynastyGameEngineV2Adapter;
  const decisions=(typeof module==='object'&&module.exports)?require('./game-engine-v2-decisions.js'):root.DynastyGameEngineV2Decisions;
  const api=factory(engine,adapter,decisions);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2GameDay=api;
})(typeof window==='object'?window:globalThis,function(engine,adapter,decisions){
'use strict';
if(!engine||!adapter||!decisions)throw new Error('Game Day runner requires Game Engine 2, adapter, and decision controller.');

const VERSION=2;
const POLICY_ID='adapter-v1';
const TEMPO_POLICY_ID='tempo-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
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
  for(const side of ['home','away'])if(!['normal','hurry','drain'].includes(session.tempo?.[side]))throw new Error(`Invalid ${side} tempo strategy.`);
  engine.validateState(session.state);return true
}
function createSession(options={}){
  const made=adapter.createShadowGame(options),homeFieldRating=clamp(finite(options.homeFieldRating,0),0,12),controlledSide=controlledSideFor(options,made);
  const session={
    version:VERSION,status:'pregame',gameId:String(options.gameId??made.state.gameId),seed:String(options.seed??made.state.seed),
    state:made.state,inputs:{home:made.homeInput,away:made.awayInput},homeFieldRating,controlledSide,
    tempo:{home:'normal',away:'normal'},tempoDecisionMade:{home:false,away:false},pendingStrategyDecision:null,
    names:{home:String(options.home?.name??made.homeInput.name??'Home'),away:String(options.away?.name??made.awayInput.name??'Away')}
  };
  validateSession(session);return session
}
function isControlled(session,side){return !session.controlledSide||session.controlledSide===side}
function tempoAdjustedClock(session,state,clock){
  const tempo=session.tempo?.[state.possession]||'normal',n=Number(clock)||1;
  if(state.period!==4)return n;
  if(tempo==='hurry')return clamp(Math.round(n*.55),4,45);
  if(tempo==='drain')return clamp(Math.round(n*1.35+3),1,45);
  return n
}
function playOutcome(session,state){
  const outcome=adapter.profileOutcome(state,session.inputs.home,session.inputs.away,session.homeFieldRating),start=state.events.length;
  outcome.clock=tempoAdjustedClock(session,state,outcome.clock);
  engine.applyScrimmage(state,outcome);adapter.annotateOutcomeEvent(state,start,outcome);return outcome
}
function executeAction(session,action,state){
  const normalized=normalizeFourth(action);
  if(normalized==='field_goal')engine.attemptFieldGoal(state);
  else if(normalized==='punt')engine.punt(state);
  else if(normalized==='go')playOutcome(session,state);
  else throw new Error(`Unknown Game Day action: ${action}`)
}
function stepSession(session,state){
  if(state.period>4){
    if(state.ot?.period>=3||(state.down===4&&state.fieldPosition>=55)){engine.step(state);return}
    playOutcome(session,state);return
  }
  if(state.down===4){
    if(isControlled(session,state.possession))throw new Error('Game Day runner attempted to step through an unresolved fourth-down decision.');
    executeAction(session,adapter.shadowDecision(state),state);return
  }
  playOutcome(session,state)
}
function hooks(session){return{
  policyId:POLICY_ID,
  defaultAction:state=>adapter.shadowDecision(state),
  executeAction:(action,state)=>executeAction(session,action,state),
  step:state=>stepSession(session,state)
}}
function eventState(state){return{
  period:state.period,clock:state.clock,elapsed:state.elapsed,possession:state.possession,fieldPosition:state.fieldPosition,
  down:state.down,distance:state.distance,score:{home:state.score.home,away:state.score.away},
  timeouts:{home:state.timeouts.home,away:state.timeouts.away},status:state.status,
  ot:state.ot?{period:state.ot.period,possession:state.ot.possession,possessions:state.ot.possessions}:null
}}
function tempoWindow(session){
  const state=session.state,side=state.possession;if(state.status!=='live'||state.period!==4||state.clock<=0||state.clock>300||state.down!==1||!side)return false;
  if(!isControlled(session,side)||session.tempoDecisionMade?.[side])return false;
  const margin=Math.abs((state.score?.home||0)-(state.score?.away||0));return margin<=16
}
function createTempoDecision(session){
  if(!tempoWindow(session))return null;
  if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,side=state.possession;if(!Number.isInteger(state.coachingDecisionCounter)||state.coachingDecisionCounter<0)state.coachingDecisionCounter=0;
  const min=Math.floor(state.clock/60),sec=String(state.clock%60).padStart(2,'0'),team=state[side]?.name||session.names[side],margin=(state.score[side]||0)-(state.score[side==='home'?'away':'home']||0);
  const situation=`Q4 ${min}:${sec} · ${team} ball · ${margin===0?'tie game':margin>0?`leading by ${margin}`:`trailing by ${Math.abs(margin)}`}`;
  const decision={
    id:`GD-${state.gameId}-${++state.coachingDecisionCounter}`,type:'late_game_tempo',policyId:TEMPO_POLICY_ID,team:side,teamId:state[side]?.id??null,
    contextKey:`tempo:${state.period}:${state.clock}:${side}:${state.fieldPosition}:${state.score.home}:${state.score.away}`,
    situation,context:{period:state.period,clock:state.clock,possession:side,fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts}},
    options:[{id:'hurry',label:'Hurry-up'},{id:'normal',label:'Normal tempo'},{id:'drain',label:'Drain clock'},{id:'delegate',label:'Delegate to staff'}],
    staffRecommendation:'normal',defaultOption:'normal',createdAfterEventSeq:state.events?.length||0
  };
  session.pendingStrategyDecision=decision;return clone(decision)
}
function appendStrategyReceipt(session,decision,selectedOption,resolvedAction){
  const state=session.state,event={
    seq:(state.events?.length||0)+1,type:'coaching_decision',decisionId:decision.id,decisionType:decision.type,policyId:decision.policyId,
    team:decision.team,selectedOption,resolvedAction,staffRecommendation:decision.staffRecommendation,situation:decision.situation,state:eventState(state)
  };state.events.push(event);return event
}
function currentDecision(session){
  if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,existing=decisions.pendingDecision(state);
  if(existing){if(isControlled(session,existing.team))return clone(existing);state.pendingCoachingDecision=null}
  if(state.status==='live'&&state.period<=4&&state.down===4&&state.possession&&isControlled(session,state.possession))return decisions.ensureDecision(state,hooks(session));
  return createTempoDecision(session)
}
function resolveTempo(session,optionId){
  const decision=session.pendingStrategyDecision;if(!decision)throw new Error('No tempo decision is pending.');
  const selected=String(optionId||'delegate');if(!decision.options.some(o=>o.id===selected))throw new Error(`Illegal tempo decision option: ${selected}`);
  const action=selected==='delegate'?decision.defaultOption:selected;if(!['normal','hurry','drain'].includes(action))throw new Error(`Unknown tempo action: ${action}`);
  session.pendingStrategyDecision=null;session.tempo[decision.team]=action;session.tempoDecisionMade[decision.team]=true;
  appendStrategyReceipt(session,decision,selected,action);engine.validateState(session.state);
  return{decision:clone(decision),selectedOption:selected,resolvedAction:action,state:session.state,session}
}
function advanceOne(session){
  validateSession(session);const state=session.state;
  if(state.status==='pregame')engine.startGame(state);
  if(state.status==='final'){session.status='final';session.summary=adapter.eventSummary(state);return{status:'final',decision:null,session}}
  const before=currentDecision(session);if(before){session.status='decision';return{status:'decision',decision:clone(before),session}}
  stepSession(session,state);
  if(state.status==='final'){session.status='final';session.summary=adapter.eventSummary(state);return{status:'final',decision:null,session}}
  const after=currentDecision(session);session.status=after?'decision':'live';return{status:session.status,decision:after?clone(after):null,session}
}
function advance(session,maxSteps=500){
  validateSession(session);let steps=0;
  while(session.state.status!=='final'){
    const out=advanceOne(session);if(out.status==='decision'||out.status==='final')return{...out,steps};
    if(++steps>maxSteps)throw new Error('Game Day runner step limit exceeded.');
  }
  session.status='final';session.summary=adapter.eventSummary(session.state);return{status:'final',decision:null,steps,session}
}
function resolve(session,optionId='delegate'){
  validateSession(session);let result;
  if(session.pendingStrategyDecision)result=resolveTempo(session,optionId);
  else result=decisions.resolveDecision(session.state,optionId,hooks(session));
  session.status=session.state.status==='final'?'final':'live';if(session.status==='final')session.summary=adapter.eventSummary(session.state);
  return{...result,session}
}
function simulate(session,chooser=()=> 'delegate',maxWindows=200){
  let windows=0;
  while(session.state.status!=='final'){
    const out=advance(session);if(out.status==='final')break;
    if(++windows>maxWindows)throw new Error('Game Day session decision safety limit exceeded.');
    resolve(session,chooser(clone(out.decision),session));
  }
  engine.validateGame(session.state);session.status='final';session.summary=adapter.eventSummary(session.state);return session
}
function snapshot(session){validateSession(session);return clone(session)}
function restore(value){const session=clone(value);validateSession(session);const pending=session.pendingStrategyDecision||decisions.pendingDecision(session.state);session.status=session.state.status==='final'?'final':(pending?'decision':session.state.status);return session}
function pendingDecision(session){validateSession(session);return session.pendingStrategyDecision?clone(session.pendingStrategyDecision):decisions.pendingDecision(session.state)}

return{VERSION,POLICY_ID,TEMPO_POLICY_ID,createSession,advanceOne,advance,resolve,simulate,snapshot,restore,pendingDecision,validateSession};
});
