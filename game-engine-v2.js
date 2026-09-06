(function(root,factory){
  const rngApi=(typeof module==='object'&&module.exports)?require('./rng.js'):root.DynastyRng;
  const api=factory(rngApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2=api;
})(typeof window==='object'?window:globalThis,function(DynastyRng){
'use strict';
if(!DynastyRng)throw new Error('Game Engine 2 requires DynastyRng.');

const ENGINE_VERSION=1;
const REGULATION_QUARTERS=4;
const QUARTER_SECONDS=15*60;
const KICKOFF_SPOT=25;
const TOUCHBACK_SPOT=25;
const OT_START=75; // offense-relative: opponent 25
const OT_TWO_POINT_SPOT=97; // opponent 3
const MAX_EVENTS=1200;

const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const other=side=>side==='home'?'away':'home';
const cloneTeam=t=>({id:t?.id??null,name:String(t?.name??'Team'),rating:clamp(Number(t?.rating??70),1,100)});
const scoreCopy=s=>({home:s.home,away:s.away});
const timeoutsCopy=t=>({home:t.home,away:t.away});
const lineDistance=field=>Math.max(1,Math.min(10,100-field));

function createGame(options={}){
  const home=cloneTeam(options.home),away=cloneTeam(options.away);
  const gameId=String(options.gameId??`v2-${home.id??home.name}-${away.id??away.name}`);
  const seed=options.seed??gameId;
  const rng=DynastyRng.create(seed);
  const openingReceiver=options.openingReceiver==='away'||options.openingReceiver==='home'
    ? options.openingReceiver
    : (rng.next()<.5?'home':'away');
  const state={
    engine:'v2',engineVersion:ENGINE_VERSION,gameId,seed:String(seed),status:'pregame',
    period:1,clock:QUARTER_SECONDS,elapsed:0,possession:null,fieldPosition:null,down:null,distance:null,
    score:{home:0,away:0},timeouts:{home:3,away:3},home,away,openingReceiver,
    secondHalfReceiver:other(openingReceiver),pendingKickoff:null,drive:0,play:0,ot:null,events:[],rng:rng.snapshot()
  };
  validateState(state);
  return state;
}

function rngFor(state){return DynastyRng.create(state.rng)}
function finishRng(state,rng){state.rng=rng.snapshot()}
function snapshot(state){return JSON.parse(JSON.stringify(state))}
function restore(value){const state=JSON.parse(JSON.stringify(value));validateState(state);return state}

function eventState(state){return{
  period:state.period,clock:state.clock,elapsed:state.elapsed,possession:state.possession,
  fieldPosition:state.fieldPosition,down:state.down,distance:state.distance,
  score:scoreCopy(state.score),timeouts:timeoutsCopy(state.timeouts),status:state.status,
  ot:state.ot?{period:state.ot.period,possession:state.ot.possession,possessions:state.ot.possessions}:null
}}
function pushEvent(state,type,data={}){
  if(state.events.length>=MAX_EVENTS)throw new Error('Game Engine 2 event safety limit exceeded.');
  const evt={seq:state.events.length+1,type,...data,state:eventState(state)};
  state.events.push(evt);return evt;
}
function addPoints(state,side,points,type,data={}){
  state.score[side]+=points;
  return pushEvent(state,type,{team:side,points,...data});
}

function startGame(state){
  requireStatus(state,'pregame');state.status='live';
  pushEvent(state,'game_start',{openingReceiver:state.openingReceiver});
  kickoffTo(state,state.openingReceiver,'opening_kickoff');
  validateState(state);return state;
}
function kickoffTo(state,receiver,reason='kickoff'){
  state.pendingKickoff=null;state.possession=receiver;state.fieldPosition=KICKOFF_SPOT;state.down=1;state.distance=10;state.drive++;
  pushEvent(state,'kickoff',{receiver,reason,touchback:true});
}
function kickoffAfterScore(state,receiver,reason){
  if(state.period<=4&&state.clock===0){state.pendingKickoff={receiver,reason};return}
  kickoffTo(state,receiver,reason);
}
function setPossession(state,side,fieldPosition,reason){
  state.possession=side;state.fieldPosition=clamp(Math.round(fieldPosition),1,99);state.down=1;state.distance=lineDistance(state.fieldPosition);state.drive++;
  pushEvent(state,'possession_change',{to:side,reason});
}

function consumeClock(state,seconds){
  if(state.status!=='live'||state.period>4)return;
  const used=clamp(Math.round(seconds),0,state.clock);state.clock-=used;state.elapsed+=used;
}
function endRegulationPeriodIfNeeded(state){
  if(state.status!=='live'||state.period>4||state.clock>0)return false;
  pushEvent(state,'period_end',{period:state.period});
  if(state.period===4){
    if(state.score.home===state.score.away)startOvertime(state);
    else finishGame(state,'regulation');
    return true;
  }
  if(state.period===2){
    state.period=3;state.clock=QUARTER_SECONDS;state.timeouts={home:3,away:3};state.pendingKickoff=null;
    pushEvent(state,'halftime',{});kickoffTo(state,state.secondHalfReceiver,'second_half_kickoff');
    return true;
  }
  const pending=state.pendingKickoff;state.period++;state.clock=QUARTER_SECONDS;pushEvent(state,'period_start',{period:state.period});
  if(pending)kickoffTo(state,pending.receiver,pending.reason);return true;
}

function applyScrimmage(state,outcome={}){
  requireStatus(state,'live');
  if(state.period>4)return applyOvertimeSnap(state,outcome);
  if(!state.possession)throw new Error('Cannot run a play without possession.');
  const offense=state.possession,defense=other(offense),beforeField=state.fieldPosition,beforeDown=state.down,beforeDistance=state.distance;
  const clock=clamp(Math.round(outcome.clock??30),1,45);consumeClock(state,clock);
  if(outcome.turnover){
    const yards=clamp(Math.round(outcome.yards??0),-99,99);const spot=clamp(beforeField+yards,1,99);
    state.play++;
    pushEvent(state,outcome.turnover==='fumble'?'fumble':'interception',{team:offense,yards,from:{fieldPosition:beforeField,down:beforeDown,distance:beforeDistance}});
    setPossession(state,defense,100-spot,outcome.turnover);
    endRegulationPeriodIfNeeded(state);validateState(state);return state;
  }
  const yards=clamp(Math.round(outcome.yards??0),-99,99);const nextField=beforeField+yards;state.play++;
  if(nextField>=100){
    state.fieldPosition=100;pushEvent(state,'scrimmage',{team:offense,yards:100-beforeField,from:{fieldPosition:beforeField,down:beforeDown,distance:beforeDistance}});
    touchdown(state,offense);endRegulationPeriodIfNeeded(state);validateState(state);return state;
  }
  if(nextField<=0){
    state.fieldPosition=0;pushEvent(state,'scrimmage',{team:offense,yards:-beforeField,from:{fieldPosition:beforeField,down:beforeDown,distance:beforeDistance}});
    addPoints(state,defense,2,'safety',{against:offense});
    kickoffAfterScore(state,defense,'safety_kick');endRegulationPeriodIfNeeded(state);validateState(state);return state;
  }
  state.fieldPosition=nextField;
  if(yards>=beforeDistance){state.down=1;state.distance=lineDistance(state.fieldPosition)}
  else if(beforeDown===4){
    pushEvent(state,'scrimmage',{team:offense,yards,from:{fieldPosition:beforeField,down:beforeDown,distance:beforeDistance}});
    setPossession(state,defense,100-state.fieldPosition,'turnover_on_downs');endRegulationPeriodIfNeeded(state);validateState(state);return state;
  }else{state.down=beforeDown+1;state.distance=Math.max(1,beforeDistance-yards)}
  pushEvent(state,'scrimmage',{team:offense,yards,from:{fieldPosition:beforeField,down:beforeDown,distance:beforeDistance}});
  endRegulationPeriodIfNeeded(state);validateState(state);return state;
}

function touchdown(state,side){
  addPoints(state,side,6,'touchdown',{});
  const rng=rngFor(state);const made=rng.next()<.965;finishRng(state,rng);
  if(made)addPoints(state,side,1,'extra_point',{made:true});else pushEvent(state,'extra_point',{team:side,points:0,made:false});
  kickoffAfterScore(state,other(side),'post_touchdown');
}
function attemptFieldGoal(state){
  requireStatus(state,'live');if(state.period>4)throw new Error('Use overtime resolution for overtime field goals.');
  const side=state.possession;if(!side)throw new Error('No possession for field goal.');
  const distance=Math.round(100-state.fieldPosition+17),rng=rngFor(state);
  const probability=clamp(.97-Math.max(0,distance-30)*.018,.18,.97),made=rng.next()<probability;finishRng(state,rng);
  consumeClock(state,5);
  if(made){addPoints(state,side,3,'field_goal',{distance,made:true});kickoffAfterScore(state,other(side),'post_field_goal')}
  else{pushEvent(state,'field_goal',{team:side,points:0,distance,made:false});setPossession(state,other(side),Math.max(20,100-state.fieldPosition),'missed_field_goal')}
  endRegulationPeriodIfNeeded(state);validateState(state);return made;
}
function punt(state){
  requireStatus(state,'live');if(state.period>4)throw new Error('Punts are not used in overtime.');
  const side=state.possession,rng=rngFor(state),net=clamp(Math.round(40+rng.gauss()*5),28,52);finishRng(state,rng);consumeClock(state,7);
  const landing=state.fieldPosition+net;pushEvent(state,'punt',{team:side,net,touchback:landing>=100});
  setPossession(state,other(side),landing>=100?TOUCHBACK_SPOT:100-landing,'punt');endRegulationPeriodIfNeeded(state);validateState(state);return state;
}

function generateOutcome(state){
  const rng=rngFor(state),off=state[state.possession]?.rating??70,def=state[other(state.possession)]?.rating??70;
  const roll=rng.next(),pass=rng.next()<.53,edge=(off-def)/18;
  let outcome;
  if(roll<.018)outcome={turnover:'interception',yards:clamp(Math.round(8+rng.gauss()*9),-5,35),clock:rng.int(4,12)};
  else if(roll<.032)outcome={turnover:'fumble',yards:clamp(Math.round(3+rng.gauss()*6),-8,18),clock:rng.int(5,14)};
  else{
    const mean=pass?5.6:4.3,spread=pass?8.2:4.8;
    outcome={yards:clamp(Math.round(mean+edge+rng.gauss()*spread),-14,55),clock:pass?rng.int(5,34):rng.int(22,40),kind:pass?'pass':'rush'};
  }
  finishRng(state,rng);return outcome;
}
function chooseFourthDown(state){
  if(state.down!==4)return 'play';
  if(state.fieldPosition>=58&&state.distance>2)return 'field_goal';
  if(state.fieldPosition<60&&state.distance>1)return 'punt';
  return 'play';
}
function step(state){
  requireStatus(state,'live');
  if(state.period>4)return stepOvertime(state);
  const decision=chooseFourthDown(state);
  if(decision==='field_goal')attemptFieldGoal(state);else if(decision==='punt')punt(state);else applyScrimmage(state,generateOutcome(state));
  return state;
}
function simulate(state,maxSteps=500){
  if(state.status==='pregame')startGame(state);
  let n=0;while(state.status!=='final'){if(++n>maxSteps)throw new Error('Game Engine 2 simulation step limit exceeded.');step(state)}
  validateGame(state);return state;
}

function startOvertime(state){
  state.period=5;state.clock=0;state.ot={period:1,first:state.openingReceiver,possessions:0,possession:state.openingReceiver,startScore:scoreCopy(state.score),pendingResult:null};
  state.possession=state.ot.first;state.fieldPosition=OT_START;state.down=1;state.distance=10;
  pushEvent(state,'overtime_start',{overtime:1,first:state.ot.first});
}
function applyOvertimeSnap(state,outcome={}){
  if(!state.ot)throw new Error('Overtime state missing.');
  const offense=state.possession,beforeField=state.fieldPosition,beforeDown=state.down,beforeDistance=state.distance;
  if(state.ot.period>=3)return resolveTwoPointShootout(state,outcome);
  if(outcome.turnover){
    pushEvent(state,outcome.turnover==='fumble'?'fumble':'interception',{team:offense,yards:outcome.yards??0,ot:true});
    endOvertimePossession(state);return state;
  }
  const yards=clamp(Math.round(outcome.yards??0),-99,99),next=beforeField+yards;state.play++;
  if(next>=100){state.fieldPosition=100;pushEvent(state,'scrimmage',{team:offense,yards:100-beforeField,ot:true});addPoints(state,offense,6,'touchdown',{ot:true});
    if(state.ot.period===1)addPoints(state,offense,1,'extra_point',{ot:true,made:true});
    else resolveOvertimeTwoPointTry(state,offense);
    endOvertimePossession(state);return state;}
  if(next<=0){pushEvent(state,'scrimmage',{team:offense,yards:-beforeField,ot:true});addPoints(state,other(offense),2,'safety',{ot:true,against:offense});endOvertimePossession(state);return state;}
  state.fieldPosition=next;
  if(yards>=beforeDistance){state.down=1;state.distance=lineDistance(state.fieldPosition)}
  else if(beforeDown===4){pushEvent(state,'scrimmage',{team:offense,yards,ot:true});endOvertimePossession(state);return state}
  else{state.down=beforeDown+1;state.distance=Math.max(1,beforeDistance-yards)}
  pushEvent(state,'scrimmage',{team:offense,yards,ot:true});return state;
}
function overtimeFieldGoal(state){
  const side=state.possession,rng=rngFor(state),distance=Math.round(100-state.fieldPosition+17),prob=clamp(.97-Math.max(0,distance-30)*.018,.18,.97),made=rng.next()<prob;finishRng(state,rng);
  if(made)addPoints(state,side,3,'field_goal',{ot:true,distance,made:true});else pushEvent(state,'field_goal',{team:side,points:0,ot:true,distance,made:false});
  endOvertimePossession(state);return made;
}
function resolveOvertimeTwoPointTry(state,side){
  const rng=rngFor(state),made=rng.next()<.47;finishRng(state,rng);
  if(made)addPoints(state,side,2,'two_point',{ot:true,made:true});else pushEvent(state,'two_point',{team:side,points:0,ot:true,made:false});return made;
}
function resolveTwoPointShootout(state,outcome={}){
  const side=state.possession;let made;
  if(typeof outcome.made==='boolean')made=outcome.made;else{const rng=rngFor(state);made=rng.next()<.47;finishRng(state,rng)}
  if(made)addPoints(state,side,2,'two_point',{ot:true,shootout:true,made:true});else pushEvent(state,'two_point',{team:side,points:0,ot:true,shootout:true,made:false});
  endOvertimePossession(state);return state;
}
function endOvertimePossession(state){
  const ot=state.ot;ot.possessions++;
  if(ot.possessions%2===1){
    state.possession=other(ot.first);state.fieldPosition=ot.period>=3?OT_TWO_POINT_SPOT:OT_START;state.down=1;state.distance=ot.period>=3?3:10;
    pushEvent(state,'overtime_possession',{overtime:ot.period,possession:state.possession});return;
  }
  if(state.score.home!==state.score.away){finishGame(state,'overtime');return}
  ot.period++;ot.first=other(ot.first);ot.possession=ot.first;
  state.possession=ot.first;state.fieldPosition=ot.period>=3?OT_TWO_POINT_SPOT:OT_START;state.down=1;state.distance=ot.period>=3?3:10;
  pushEvent(state,'overtime_period',{overtime:ot.period,first:ot.first});
}
function stepOvertime(state){
  if(state.ot.period>=3){resolveTwoPointShootout(state);return state}
  if(state.down===4&&state.fieldPosition>=55){overtimeFieldGoal(state);return state}
  applyOvertimeSnap(state,generateOutcome(state));return state;
}

function finishGame(state,reason){state.status='final';state.possession=null;state.fieldPosition=null;state.down=null;state.distance=null;pushEvent(state,'game_end',{reason,winner:state.score.home>state.score.away?'home':'away'});return state}
function requireStatus(state,status){if(state.status!==status)throw new Error(`Game must be ${status}; found ${state.status}.`)}
function scoringTotals(state){
  const totals={home:0,away:0};for(const e of state.events){if(e.team&&(e.points||0)>0)totals[e.team]+=e.points}return totals;
}
function validateState(state){
  if(!state||state.engine!=='v2'||state.engineVersion!==ENGINE_VERSION)throw new Error('Invalid Game Engine 2 state.');
  if(!Number.isInteger(state.period)||state.period<1)throw new Error('Invalid game period.');
  if(!Number.isInteger(state.clock)||state.clock<0||state.clock>QUARTER_SECONDS)throw new Error('Invalid game clock.');
  if(!Number.isInteger(state.elapsed)||state.elapsed<0||state.elapsed>REGULATION_QUARTERS*QUARTER_SECONDS)throw new Error('Invalid elapsed clock.');
  for(const side of ['home','away']){
    if(!Number.isInteger(state.score[side])||state.score[side]<0)throw new Error('Invalid score.');
    if(!Number.isInteger(state.timeouts[side])||state.timeouts[side]<0||state.timeouts[side]>3)throw new Error('Invalid timeout count.');
  }
  if(state.status==='live'){
    if(state.possession!=='home'&&state.possession!=='away')throw new Error('Live game requires possession.');
    if(!Number.isInteger(state.fieldPosition)||state.fieldPosition<0||state.fieldPosition>100)throw new Error('Field position out of bounds.');
    if(!Number.isInteger(state.down)||state.down<1||state.down>4)throw new Error('Down out of bounds.');
    if(!Number.isInteger(state.distance)||state.distance<1||state.distance>99)throw new Error('Distance out of bounds.');
  }
  DynastyRng.create(state.rng);
  if(!Array.isArray(state.events)||state.events.length>MAX_EVENTS)throw new Error('Invalid event log.');
  return true;
}
function validateGame(state){
  validateState(state);const totals=scoringTotals(state);
  if(totals.home!==state.score.home||totals.away!==state.score.away)throw new Error(`Score/event mismatch: ${totals.away}-${totals.home} vs ${state.score.away}-${state.score.home}.`);
  if(state.status==='final'&&state.score.home===state.score.away)throw new Error('Final game cannot be tied.');
  let prevElapsed=-1,prevSeq=0;
  for(const e of state.events){if(e.seq!==prevSeq+1)throw new Error('Event sequence gap.');prevSeq=e.seq;if(e.state.elapsed<prevElapsed)throw new Error('Elapsed game time moved backward.');prevElapsed=e.state.elapsed;}
  return true;
}

return{ENGINE_VERSION,QUARTER_SECONDS,createGame,startGame,step,simulate,applyScrimmage,attemptFieldGoal,punt,snapshot,restore,scoringTotals,validateState,validateGame,generateOutcome};
});