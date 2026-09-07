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

const VERSION=1;
const POLICY_ID='adapter-v1';
const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

function validateSession(session){
  if(!session||session.version!==VERSION)throw new Error('Invalid Game Day session version.');
  if(!session.state||session.state.engine!=='v2')throw new Error('Game Day session is missing v2 state.');
  if(!session.inputs?.home||!session.inputs?.away)throw new Error('Game Day session is missing calibrated team inputs.');
  engine.validateState(session.state);return true
}
function createSession(options={}){
  const made=adapter.createShadowGame(options),homeFieldRating=clamp(finite(options.homeFieldRating,0),0,12);
  const session={
    version:VERSION,status:'pregame',gameId:String(options.gameId??made.state.gameId),seed:String(options.seed??made.state.seed),
    state:made.state,inputs:{home:made.homeInput,away:made.awayInput},homeFieldRating,
    names:{home:String(options.home?.name??made.homeInput.name??'Home'),away:String(options.away?.name??made.awayInput.name??'Away')}
  };
  validateSession(session);return session
}
function playOutcome(session,state){
  const outcome=adapter.profileOutcome(state,session.inputs.home,session.inputs.away,session.homeFieldRating),start=state.events.length;
  engine.applyScrimmage(state,outcome);adapter.annotateOutcomeEvent(state,start,outcome);return outcome
}
function executeAction(session,action,state){
  if(action==='field_goal')engine.attemptFieldGoal(state);
  else if(action==='punt')engine.punt(state);
  else if(action==='go')playOutcome(session,state);
  else throw new Error(`Unknown Game Day action: ${action}`)
}
function stepSession(session,state){
  if(state.period>4){
    if(state.ot?.period>=3||(state.down===4&&state.fieldPosition>=55)){engine.step(state);return}
    playOutcome(session,state);return
  }
  if(state.down===4)throw new Error('Game Day runner attempted to step through an unresolved fourth-down decision.');
  playOutcome(session,state)
}
function hooks(session){return{
  policyId:POLICY_ID,
  defaultAction:state=>adapter.shadowDecision(state),
  executeAction:(action,state)=>executeAction(session,action,state),
  step:state=>stepSession(session,state)
}}
function advanceOne(session){
  validateSession(session);const state=session.state;
  if(state.status==='pregame')engine.startGame(state);
  if(state.status==='final'){session.status='final';session.summary=adapter.eventSummary(state);return{status:'final',decision:null,session}}
  const before=decisions.ensureDecision(state,hooks(session));
  if(before){session.status='decision';return{status:'decision',decision:clone(before),session}}
  stepSession(session,state);
  if(state.status==='final'){session.status='final';session.summary=adapter.eventSummary(state);return{status:'final',decision:null,session}}
  const after=decisions.ensureDecision(state,hooks(session));
  session.status=after?'decision':'live';return{status:session.status,decision:after?clone(after):null,session}
}
function advance(session,maxSteps=500){
  validateSession(session);
  const out=decisions.advanceUntilDecision(session.state,maxSteps,hooks(session));
  session.status=out.status;
  if(out.status==='final')session.summary=adapter.eventSummary(session.state);
  return{status:out.status,decision:out.decision?clone(out.decision):null,steps:out.steps,session}
}
function resolve(session,optionId='delegate'){
  validateSession(session);
  const result=decisions.resolveDecision(session.state,optionId,hooks(session));
  session.status=session.state.status==='final'?'final':'live';
  if(session.status==='final')session.summary=adapter.eventSummary(session.state);
  return{...result,session}
}
function simulate(session,chooser=()=> 'delegate',maxWindows=200){
  let windows=0;
  while(session.state.status!=='final'){
    const out=advance(session);
    if(out.status==='final')break;
    if(++windows>maxWindows)throw new Error('Game Day session decision safety limit exceeded.');
    resolve(session,chooser(clone(out.decision),session));
  }
  engine.validateGame(session.state);session.status='final';session.summary=adapter.eventSummary(session.state);return session
}
function snapshot(session){validateSession(session);return clone(session)}
function restore(value){const session=clone(value);validateSession(session);session.status=session.state.status==='final'?'final':(decisions.pendingDecision(session.state)?'decision':session.state.status);return session}
function pendingDecision(session){validateSession(session);return decisions.pendingDecision(session.state)}

return{VERSION,POLICY_ID,createSession,advanceOne,advance,resolve,simulate,snapshot,restore,pendingDecision,validateSession};
});
