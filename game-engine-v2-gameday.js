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
const DRIVE_POLICY_ID='drive-v1';
const DEFENSE_POLICY_ID='defense-v1';
// v0.19: what a head coach asks for, not the play itself. Each call trades something: running it protects the ball
// and the clock but gives up explosive plays; taking shots gains yards per completion and gives up sacks and
// interceptions. None is better on average, so the right one depends on the score, the clock and the weather.
const DRIVE_CALLS={
  balanced:null,
  ground:{passRate:-.15,rushYards:.2,clock:1.08},
  quick:{passRate:.07,comp:.05,passYards:.85,sackMult:.65,intMult:.88},
  shots:{passRate:.09,comp:-.05,passYards:1.17,sackMult:1.2,intMult:1.3,clock:.94}
};
const DRIVE_LABELS={balanced:'Stay balanced',ground:'Run the ball',quick:'Quick passes',shots:'Take shots'};
// The defensive call covers one snap. Pressure gets home more often and gives up more when it does not; coverage
// takes away the deep ball and concedes the run; loading the box stops the run and leaves the secondary alone.
const DEFENSE_CALLS={
  base:null,
  pressure:{sackMult:1.6,hurry:.09,comp:-.02,passYards:1.15,rushYards:.5},
  coverage:{sackMult:.6,hurry:-.06,comp:.02,passYards:.8,intMult:1.25,rushYards:.8},
  run_stop:{passRate:-.04,rushYards:-1.5,passYards:1.12,comp:.02}
};
const DEFENSE_LABELS={base:'Play it straight',pressure:'Bring pressure',coverage:'Drop into coverage',run_stop:'Load the box'};
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
    if(!['normal','hurry','drain','staff'].includes(session.tempo?.[side]))throw new Error(`Invalid ${side} tempo strategy.`);
    if(!['balanced','aggressive','ball_control'].includes(session.halftimeApproach?.[side]))throw new Error(`Invalid ${side} halftime approach.`);
  }
  if(session.pendingConversion&& !['home','away'].includes(session.pendingConversion.side))throw new Error('Invalid pending touchdown conversion.');
  engine.validateState(session.state);return true
}
// The staff's call follows the program's situational playbook when it has one (v0.15.1), else the default policy.
function staffFourthDown(state){return engine.playbookFourthDown(state)||adapter.shadowDecision(state)}
function staffConversion(session){const p=session.pendingConversion;return p&&engine.playbookTwoPoint(session.state,p.side)?'two_point':'extra_point'}
function createSession(options={}){
  const made=adapter.createShadowGame(options);adapter.attachPlaybook(made.state,options.playbook);const homeFieldRating=clamp(finite(options.homeFieldRating,0),0,12),controlledSide=controlledSideFor(options,made);
  const session={
    version:VERSION,status:'pregame',gameId:String(options.gameId??made.state.gameId),seed:String(options.seed??made.state.seed),
    state:made.state,inputs:{home:made.homeInput,away:made.awayInput},homeFieldRating,controlledSide,
    tempo:{home:'normal',away:'normal'},tempoDecisionMade:{home:false,away:false},
    // Drive and defensive calls are on only for a fully coached game (options.calls); null means the session never asks.
    driveCall:options.calls===true&&controlledSide?{home:'balanced',away:'balanced'}:null,driveAsked:null,defenseCall:null,defenseAsked:null,
    halftimeApproach:{home:'balanced',away:'balanced'},halftimeDecisionMade:false,pendingConversion:null,pendingStrategyDecision:null,
    names:{home:String(options.home?.name??made.homeInput.name??'Home'),away:String(options.away?.name??made.awayInput.name??'Away')},
    skipRoutine:options.skipRoutine===true
  };
  validateSession(session);return session
}
// A fourth down no coach would agonise over: punting from your own side on 4th and 4 or more, or kicking a short
// field goal, with the game not close and late. Sessions created with skipRoutine take the staff call on these
// without stopping; short yardage, no-man's land, long kicks and tight or trailing fourth quarters still stop.
function routineFourthDown(session,state){
  if(!session.skipRoutine||state.down!==4||state.period>4)return false;
  const side=state.possession,margin=(state.score?.[side]||0)-(state.score?.[other(side)]||0),lateClose=state.period===4&&(margin<0||(state.clock<=480&&Math.abs(margin)<=8));
  if(lateClose||state.distance<4)return false;
  const action=staffFourthDown(state),fg=Math.round(100-state.fieldPosition+17);
  if(action==='punt')return state.fieldPosition<=50;
  if(action==='field_goal')return fg<=40;
  return false
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
// Kickoffs belong to the engine so a game with the v0.16 rules gets returns here too; without rules this is the original touchback.
function kickoffGame(state,receiver,reason){engine.kickoffTo(state,receiver,reason)}
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
// The calls in force for this snap: the offense's call for the drive and, if one was made for this exact snap, the
// defense's. Sessions saved before v0.19 carry neither and play as they did.
function snapCall(session,state){
  const side=state.possession,offense=DRIVE_CALLS[session.driveCall?.[side]]||null,d=session.defenseCall;
  const defense=d&&d.side===other(side)&&d.at===state.events.length?DEFENSE_CALLS[d.call]||null:null;
  if(!offense&&!defense)return null;
  const out={passRate:0,passYards:1,rushYards:0,intMult:1,sackMult:1,comp:0,hurry:0,clock:1};
  for(const c of [offense,defense])if(c){out.passRate+=c.passRate||0;out.rushYards+=c.rushYards||0;out.comp+=c.comp||0;out.hurry+=c.hurry||0;out.passYards*=c.passYards??1;out.intMult*=c.intMult??1;out.sackMult*=c.sackMult??1;out.clock*=c.clock??1}
  return out
}
function playOutcome(session,state){
  const start=state.events.length,beforeField=state.fieldPosition,side=state.possession,call=snapCall(session,state);
  let outcome=adapter.profileOutcome(state,session.inputs.home,session.inputs.away,session.homeFieldRating,call);
  if(call&&call.clock!==1&&!outcome.penalty)outcome.clock=clamp(Math.round((Number(outcome.clock)||1)*call.clock),1,45);
  session.defenseCall=null;
  halftimeAdjustedOutcome(session,state,outcome);
  if(!session.tempoDecisionMade[side]||session.tempo[side]==='staff')outcome=engine.playbookClock(state,outcome);
  else outcome.clock=tempoAdjustedClock(session,state,outcome.clock);
  const yards=clamp(Math.round(outcome.yards??0),-99,99),touchdown=state.period<=4&&!outcome.turnover&&!outcome.penalty&&beforeField+yards>=100;
  if(touchdown)deferredTouchdown(session,state,outcome);else engine.applyScrimmage(state,outcome);
  adapter.annotateOutcomeEvent(state,start,outcome);return outcome
}
function executeAction(session,action,state){
  const normalized=normalizeFourth(action);if(normalized==='field_goal')engine.attemptFieldGoal(state);else if(normalized==='punt')engine.punt(state);else if(normalized==='go')playOutcome(session,state);else throw new Error(`Unknown Game Day action: ${action}`)
}
function stepSession(session,state){
  if(session.pendingConversion){resolvePendingConversion(session,staffConversion(session));return}
  if(state.period>4){if(state.ot?.period>=3||(state.down===4&&state.fieldPosition>=55)){engine.step(state);return}playOutcome(session,state);return}
  if(state.down===4){if(isControlled(session,state.possession)&&!routineFourthDown(session,state))throw new Error('Game Day runner attempted to step through an unresolved fourth-down decision.');executeAction(session,staffFourthDown(state),state);return}
  playOutcome(session,state)
}
function hooks(session){return{policyId:POLICY_ID,defaultAction:state=>staffFourthDown(state),executeAction:(action,state)=>executeAction(session,action,state),step:state=>stepSession(session,state)}}
function nextDecisionId(state){if(!Number.isInteger(state.coachingDecisionCounter)||state.coachingDecisionCounter<0)state.coachingDecisionCounter=0;return`GD-${state.gameId}-${++state.coachingDecisionCounter}`}
function conversionWindow(session){
  const state=session.state,p=session.pendingConversion;if(!p||state.status!=='live'||state.period!==4||state.clock>600||!isControlled(session,p.side))return false;
  const margin=(state.score[p.side]||0)-(state.score[other(p.side)]||0);return Math.abs(margin)<=8
}
function createConversionDecision(session){
  if(!conversionWindow(session))return null;if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,side=session.pendingConversion.side,team=state[side]?.name||session.names[side],mine=state.score[side],theirs=state.score[other(side)],min=Math.floor(state.clock/60),sec=String(state.clock%60).padStart(2,'0');
  const decision={id:nextDecisionId(state),type:'two_point_decision',policyId:CONVERSION_POLICY_ID,team:side,teamId:state[side]?.id??null,contextKey:`conversion:${state.period}:${state.clock}:${side}:${mine}:${theirs}`,situation:`Q4 ${min}:${sec} · TOUCHDOWN ${team} · ${mine}–${theirs}`,context:{period:state.period,clock:state.clock,possession:side,fieldPosition:100,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts}},options:[{id:'extra_point',label:'Kick PAT'},{id:'two_point',label:'Go for two'},{id:'delegate',label:'Delegate to staff'}],staffRecommendation:staffConversion(session),defaultOption:staffConversion(session),createdAfterEventSeq:state.events?.length||0};
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
  const staffTempo=engine.playbookTempo(state);
  const decision={id:nextDecisionId(state),type:'late_game_tempo',policyId:TEMPO_POLICY_ID,team:side,teamId:state[side]?.id??null,contextKey:`tempo:${state.period}:${state.clock}:${side}:${state.fieldPosition}:${state.score.home}:${state.score.away}`,situation:`Q4 ${min}:${sec} · ${team} ball · ${margin===0?'tie game':margin>0?`leading by ${margin}`:`trailing by ${Math.abs(margin)}`}`,context:{period:state.period,clock:state.clock,possession:side,fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts}},options:[{id:'hurry',label:'Hurry-up'},{id:'normal',label:'Normal tempo'},{id:'drain',label:'Drain clock'},{id:'delegate',label:'Delegate to staff'}],staffRecommendation:staffTempo,defaultOption:staffTempo,createdAfterEventSeq:state.events?.length||0};
  session.pendingStrategyDecision=decision;return clone(decision)
}
// A drive is a kickoff received or a change of possession; counting them names the drive being played.
function driveNumber(state){let n=0;for(const e of state.events||[])if(e.type==='kickoff'||e.type==='possession_change')n++;return n}
function marginFor(state,side){return(state.score?.[side]||0)-(state.score?.[other(side)]||0)}
function clockText(state){return`Q${state.period} ${Math.floor(state.clock/60)}:${String(state.clock%60).padStart(2,'0')}`}
function spotText(state){return state.fieldPosition>=50?`opp ${100-state.fieldPosition}`:`own ${state.fieldPosition}`}
function scoreText(margin){return margin===0?'tie game':margin>0?`leading by ${margin}`:`trailing by ${Math.abs(margin)}`}
// Sessions created without calls (Coach big moments, the lab, simulated games) never stop for these.
function driveWindow(session){
  const state=session.state,side=state.possession;
  if(!session.controlledSide||!session.driveCall||state.status!=='live'||state.period>4||side!==session.controlledSide||state.down!==1||session.pendingConversion)return false;
  const drive=driveNumber(state);if(session.driveAsked===drive)return false;
  // Under 40 seconds in a half there is no drive to plan.
  if((state.period===2||state.period===4)&&state.clock<40){session.driveAsked=drive;return false}
  return true
}
function staffDriveCall(session,state,side){
  const margin=marginFor(state,side),effects=engine.effectsOf(state),edge=(session.inputs[side]?.offense||70)-(session.inputs[other(side)]?.defense||70);
  if(state.period===4&&margin>0&&state.clock<=480)return{call:'ground',why:'protect the lead and the clock'};
  if((state.period===4&&margin<0&&state.clock<=300)||(state.period>=3&&margin<=-14))return{call:'shots',why:'points are needed quickly'};
  if(effects.wind>=18||effects.precip>=2)return{call:'ground',why:'the weather makes throwing a risk'};
  if(edge<=-6)return{call:'quick',why:'their front is the better unit, so get the ball out'};
  return{call:'balanced',why:'no reason to tip the hand'}
}
function createDriveDecision(session){
  if(!driveWindow(session))return null;if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,side=state.possession,team=state[side]?.name||session.names[side],staff=staffDriveCall(session,state,side),current=session.driveCall[side]||'balanced';
  const decision={id:nextDecisionId(state),type:'drive_call',policyId:DRIVE_POLICY_ID,team:side,teamId:state[side]?.id??null,contextKey:`drive:${driveNumber(state)}:${side}`,situation:`${clockText(state)} · ${team} ball at ${spotText(state)} · ${scoreText(marginFor(state,side))}`,prompt:'Call for this drive',reason:staff.why,lastCall:current,context:{period:state.period,clock:state.clock,possession:side,fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts},drive:driveNumber(state)},options:[...Object.keys(DRIVE_CALLS).map(id=>({id,label:DRIVE_LABELS[id]})),{id:'delegate',label:'Delegate to staff'}],staffRecommendation:staff.call,defaultOption:staff.call,createdAfterEventSeq:state.events?.length||0};
  session.pendingStrategyDecision=decision;return clone(decision)
}
// Third downs that decide something: inside the 30, a one-score fourth quarter, or the two-minute drill before the half.
function defenseWindow(session){
  const state=session.state,offense=state.possession,side=session.controlledSide;
  if(!side||!session.driveCall||state.status!=='live'||state.period>4||!offense||offense===side||state.down!==3||session.pendingConversion)return false;
  if(session.defenseAsked===state.events.length)return false;
  const close=Math.abs(marginFor(state,side))<=8;
  return state.fieldPosition>=70||(state.period===4&&close)||(state.period===2&&state.clock<=120&&state.fieldPosition>=50)
}
function staffDefenseCall(session,state,side){
  const edge=(session.inputs[side]?.defense||70)-(session.inputs[other(side)]?.offense||70);
  if(state.distance<=2)return{call:'run_stop',why:'short yardage, expect the run'};
  if(state.distance>=8)return{call:'coverage',why:'they have to throw past the sticks'};
  if(edge>=4)return{call:'pressure',why:'our front can get home'};
  return{call:'base',why:'no clear tell from the offense'}
}
function createDefenseDecision(session){
  if(!defenseWindow(session))return null;if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);
  const state=session.state,side=session.controlledSide,offense=state.possession,team=state[offense]?.name||session.names[offense],staff=staffDefenseCall(session,state,side);
  const decision={id:nextDecisionId(state),type:'defense_call',policyId:DEFENSE_POLICY_ID,team:side,teamId:state[side]?.id??null,contextKey:`defense:${state.events.length}:${side}`,situation:`${clockText(state)} · ${team} · 3rd & ${state.distance} at ${spotText(state)} · ${scoreText(marginFor(state,side))}`,prompt:'Defensive call',reason:staff.why,context:{period:state.period,clock:state.clock,possession:offense,fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,score:{...state.score},timeouts:{...state.timeouts}},options:[...Object.keys(DEFENSE_CALLS).map(id=>({id,label:DEFENSE_LABELS[id]})),{id:'delegate',label:'Delegate to staff'}],staffRecommendation:staff.call,defaultOption:staff.call,createdAfterEventSeq:state.events?.length||0};
  session.pendingStrategyDecision=decision;return clone(decision)
}
function appendStrategyReceipt(session,decision,selectedOption,resolvedAction){const state=session.state,event={seq:(state.events?.length||0)+1,type:'coaching_decision',decisionId:decision.id,decisionType:decision.type,policyId:decision.policyId,team:decision.team,selectedOption,resolvedAction,staffRecommendation:decision.staffRecommendation,situation:decision.situation,state:eventState(state)};state.events.push(event);return event}
function currentDecision(session){
  if(session.pendingStrategyDecision)return clone(session.pendingStrategyDecision);const state=session.state;
  if(session.pendingConversion){const conversion=createConversionDecision(session);if(conversion)return conversion;resolvePendingConversion(session,staffConversion(session));if(state.status==='final')return null}
  const existing=decisions.pendingDecision(state);if(existing){if(isControlled(session,existing.team))return clone(existing);state.pendingCoachingDecision=null}
  if(state.status==='live'&&state.period<=4&&state.down===4&&state.possession&&isControlled(session,state.possession)&&!routineFourthDown(session,state))return decisions.ensureDecision(state,hooks(session));
  return createHalftimeDecision(session)||createTempoDecision(session)||createDriveDecision(session)||createDefenseDecision(session)
}
function resolveStrategy(session,optionId){
  const decision=session.pendingStrategyDecision;if(!decision)throw new Error('No strategy decision is pending.');const selected=String(optionId||'delegate');if(!decision.options.some(o=>o.id===selected))throw new Error(`Illegal ${decision.type} option: ${selected}`);const action=selected==='delegate'?decision.defaultOption:selected;session.pendingStrategyDecision=null;
  if(decision.type==='two_point_decision'){
    if(!['extra_point','two_point'].includes(action))throw new Error(`Unknown conversion action: ${action}`);appendStrategyReceipt(session,decision,selected,action);resolvePendingConversion(session,action)
  }else if(decision.type==='late_game_tempo'){
    if(!['normal','hurry','drain'].includes(action))throw new Error(`Unknown tempo action: ${action}`);session.tempo[decision.team]=selected==='delegate'?'staff':action;session.tempoDecisionMade[decision.team]=true;appendStrategyReceipt(session,decision,selected,action)
  }else if(decision.type==='halftime_adjustment'){
    if(!['balanced','aggressive','ball_control'].includes(action))throw new Error(`Unknown halftime action: ${action}`);session.halftimeApproach[decision.team]=action;session.halftimeDecisionMade=true;appendStrategyReceipt(session,decision,selected,action)
  }else if(decision.type==='drive_call'){
    if(!(action in DRIVE_CALLS))throw new Error(`Unknown drive call: ${action}`);session.driveCall[decision.team]=action;session.driveAsked=decision.context.drive;appendStrategyReceipt(session,decision,selected,action)
  }else if(decision.type==='defense_call'){
    if(!(action in DEFENSE_CALLS))throw new Error(`Unknown defensive call: ${action}`);appendStrategyReceipt(session,decision,selected,action);const at=session.state.events.length;session.defenseCall={side:decision.team,call:action,at};session.defenseAsked=at
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

return{VERSION,POLICY_ID,TEMPO_POLICY_ID,HALFTIME_POLICY_ID,CONVERSION_POLICY_ID,DRIVE_POLICY_ID,DEFENSE_POLICY_ID,DRIVE_CALLS,DEFENSE_CALLS,DRIVE_LABELS,DEFENSE_LABELS,createSession,advanceOne,advance,resolve,simulate,snapshot,restore,pendingDecision,validateSession};
});
