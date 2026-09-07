(function(root,factory){
  const engine=(typeof module==='object'&&module.exports)?require('./game-engine-v2.js'):root.DynastyGameEngineV2;
  const api=factory(engine);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2Decisions=api;
})(typeof window==='object'?window:globalThis,function(engine){
'use strict';
if(!engine)throw new Error('Game Day decisions require Game Engine 2.');

const VERSION=1;
const clone=value=>JSON.parse(JSON.stringify(value));
const scoreCopy=state=>({home:Number(state.score?.home)||0,away:Number(state.score?.away)||0});
const timeoutsCopy=state=>({home:Number(state.timeouts?.home)||0,away:Number(state.timeouts?.away)||0});

function ensureMeta(state){
  if(!state||state.engine!=='v2')throw new Error('Game Day decisions require a Game Engine 2 state.');
  if(!Number.isInteger(state.coachingDecisionCounter)||state.coachingDecisionCounter<0)state.coachingDecisionCounter=0;
  if(!Object.prototype.hasOwnProperty.call(state,'pendingCoachingDecision'))state.pendingCoachingDecision=null;
  state.coachingDecisionVersion=VERSION;
  return state;
}
function fieldGoalDistance(state){return Math.round(100-state.fieldPosition+17)}
function normalizeAction(value){const action=String(value||'').toLowerCase();return action==='play'?'go':action}
function oldFourthDownPolicy(state){
  if(state.down!==4)return null;
  if(state.fieldPosition>=58&&state.distance>2)return 'field_goal';
  if(state.fieldPosition<60&&state.distance>1)return 'punt';
  return 'go';
}
function policyAction(state,hooks={}){
  const raw=typeof hooks.defaultAction==='function'?hooks.defaultAction(state):oldFourthDownPolicy(state);
  const action=normalizeAction(raw);if(!['go','punt','field_goal'].includes(action))throw new Error(`Invalid fourth-down default action: ${raw}`);return action
}
function contextKey(state){return[
  state.period,state.clock,state.possession,state.fieldPosition,state.down,state.distance,
  state.score?.home??0,state.score?.away??0,state.timeouts?.home??0,state.timeouts?.away??0
].join(':')}
function decisionSituation(state){
  const offense=state[state.possession]?.name||state.possession;
  const spot=state.fieldPosition>=50?`OPP ${100-state.fieldPosition}`:`OWN ${state.fieldPosition}`;
  const q=state.period<=4?`Q${state.period}`:'OT';
  const min=Math.floor((state.clock||0)/60),sec=String((state.clock||0)%60).padStart(2,'0');
  return`${q} ${min}:${sec} · ${offense} · 4th & ${state.distance} · ${spot}`
}
function optionList(state){
  const fg=fieldGoalDistance(state),options=[
    {id:'go',label:'Go for it'},
    {id:'punt',label:'Punt'}
  ];
  if(fg<=67)options.push({id:'field_goal',label:`Try ${fg}-yard field goal`});
  options.push({id:'delegate',label:'Delegate to staff'});
  return options
}
function isFourthDownWindow(state){return state.status==='live'&&state.period<=4&&state.down===4&&!!state.possession}
function ensureDecision(state,hooks={}){
  ensureMeta(state);engine.validateState(state);
  if(!isFourthDownWindow(state)){state.pendingCoachingDecision=null;return null}
  const key=contextKey(state),policyId=String(hooks.policyId||'core-v1'),existing=state.pendingCoachingDecision;
  if(existing?.type==='fourth_down'&&existing.contextKey===key&&existing.policyId===policyId)return clone(existing);
  const recommendation=policyAction(state,hooks),options=optionList(state);
  if(!options.some(o=>o.id===recommendation))throw new Error(`Default fourth-down action is not legal in this window: ${recommendation}`);
  const id=`GD-${state.gameId}-${++state.coachingDecisionCounter}`;
  const decision={
    id,type:'fourth_down',policyId,team:state.possession,teamId:state[state.possession]?.id??null,
    contextKey:key,situation:decisionSituation(state),
    context:{period:state.period,clock:state.clock,possession:state.possession,fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,score:scoreCopy(state),timeouts:timeoutsCopy(state)},
    fieldGoalDistance:fieldGoalDistance(state),options,staffRecommendation:recommendation,defaultOption:recommendation,
    createdAfterEventSeq:state.events?.length||0
  };
  state.pendingCoachingDecision=decision;return clone(decision)
}
function eventState(state){return{
  period:state.period,clock:state.clock,elapsed:state.elapsed,possession:state.possession,
  fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,
  score:scoreCopy(state),timeouts:timeoutsCopy(state),status:state.status,
  ot:state.ot?{period:state.ot.period,possession:state.ot.possession,possessions:state.ot.possessions}:null
}}
function appendDecisionEvent(state,decision,selectedOption,resolvedAction){
  const event={
    seq:(state.events?.length||0)+1,type:'coaching_decision',decisionId:decision.id,decisionType:decision.type,
    policyId:decision.policyId,team:decision.team,selectedOption,resolvedAction,staffRecommendation:decision.staffRecommendation,
    situation:decision.situation,state:eventState(state)
  };
  state.events.push(event);return event
}
function executeDefaultAction(state,action){
  if(action==='field_goal')engine.attemptFieldGoal(state);
  else if(action==='punt')engine.punt(state);
  else if(action==='go')engine.applyScrimmage(state,engine.generateOutcome(state));
  else throw new Error(`Unknown coaching decision action: ${action}`)
}
function resolveDecision(state,optionId='delegate',hooks={}){
  const decision=ensureDecision(state,hooks);if(!decision)throw new Error('No coaching decision is pending.');
  const selected=String(optionId||'delegate');
  if(!decision.options.some(o=>o.id===selected))throw new Error(`Illegal coaching decision option: ${selected}`);
  const action=selected==='delegate'?decision.defaultOption:selected;
  state.pendingCoachingDecision=null;
  appendDecisionEvent(state,decision,selected,action);
  if(typeof hooks.executeAction==='function')hooks.executeAction(action,state,decision);
  else executeDefaultAction(state,action);
  engine.validateState(state);
  return{decision,selectedOption:selected,resolvedAction:action,state}
}
function advanceUntilDecision(state,maxSteps=500,hooks={}){
  ensureMeta(state);
  if(state.status==='pregame')engine.startGame(state);
  let steps=0;
  while(state.status!=='final'){
    if(++steps>maxSteps)throw new Error('Game Day decision runner step limit exceeded.');
    const decision=ensureDecision(state,hooks);if(decision)return{status:'decision',decision,steps:steps-1,state};
    if(typeof hooks.step==='function')hooks.step(state);else engine.step(state);
  }
  state.pendingCoachingDecision=null;engine.validateGame(state);return{status:'final',decision:null,steps,state}
}
function simulateWithDecisions(state,chooser=()=> 'delegate',maxWindows=200,hooks={}){
  let windows=0;
  while(state.status!=='final'){
    const out=advanceUntilDecision(state,500,hooks);
    if(out.status==='final')break;
    if(++windows>maxWindows)throw new Error('Game Day decision window safety limit exceeded.');
    resolveDecision(state,chooser(clone(out.decision),state),hooks);
  }
  engine.validateGame(state);return state
}
function pendingDecision(state){ensureMeta(state);return state.pendingCoachingDecision?clone(state.pendingCoachingDecision):null}

return{VERSION,ensureDecision,pendingDecision,resolveDecision,advanceUntilDecision,simulateWithDecisions,oldFourthDownPolicy};
});
