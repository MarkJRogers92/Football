(function(root,factory){
  const engine=(typeof module==='object'&&module.exports)?require('./game-engine-v2.js'):root.DynastyGameEngineV2;
  const rngApi=(typeof module==='object'&&module.exports)?require('./rng.js'):root.DynastyRng;
  const api=factory(engine,rngApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2Adapter=api;
})(typeof window==='object'?window:globalThis,function(GameEngineV2,DynastyRng){
'use strict';
if(!GameEngineV2||!DynastyRng)throw new Error('Game Engine 2 adapter requires engine and RNG.');
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
function profileTeam(team,profile={}){
  const offense=clamp(finite(profile.offense,finite(profile.overall,70)),1,100);
  const defense=clamp(finite(profile.defense,finite(profile.overall,70)),1,100);
  const rating=clamp(finite(profile.overall,(offense+defense)/2),1,100);
  return{id:team?.id??null,name:String(team?.name??'Team'),rating,offense,defense};
}
function eventSummary(state){
  const side=()=>({points:0,plays:0,yards:0,turnovers:0,punts:0,fieldGoals:{made:0,attempted:0},touchdowns:0,possessions:0});
  const out={home:side(),away:side(),totalPlays:0,totalPoints:state.score.home+state.score.away,overtime:state.period>4};
  out.home.points=state.score.home;out.away.points=state.score.away;
  for(const e of state.events||[]){
    if(e.type==='kickoff'&&e.receiver)out[e.receiver].possessions++;
    if(e.type==='possession_change'&&e.to)out[e.to].possessions++;
    if(e.type==='overtime_possession'&&e.possession)out[e.possession].possessions++;
    const t=e.team;if(t!=='home'&&t!=='away')continue;
    if(e.type==='scrimmage'){out[t].plays++;out[t].yards+=Number(e.yards)||0;out.totalPlays++}
    else if(e.type==='interception'||e.type==='fumble'){out[t].turnovers++;out[t].plays++;out.totalPlays++;if(e.type==='fumble')out[t].yards+=Number(e.yards)||0}
    else if(e.type==='punt')out[t].punts++;
    else if(e.type==='field_goal'){out[t].fieldGoals.attempted++;if(e.made)out[t].fieldGoals.made++}
    else if(e.type==='touchdown')out[t].touchdowns++;
  }
  return out;
}
function createShadowGame({gameId,seed,home,away,homeProfile,awayProfile,openingReceiver}={}){
  const homeInput=profileTeam(home,homeProfile),awayInput=profileTeam(away,awayProfile);
  const state=GameEngineV2.createGame({gameId,seed,openingReceiver,home:homeInput,away:awayInput});
  return{state,homeInput,awayInput};
}
function profileOutcome(state,homeInput,awayInput,homeFieldRating=0){
  const rng=DynastyRng.create(state.rng),isHome=state.possession==='home',offense=isHome?homeInput:awayInput,defense=isHome?awayInput:homeInput;
  const venueEdge=isHome?homeFieldRating:-homeFieldRating,matchup=offense.offense-defense.defense+venueEdge,edge=matchup/18,roll=rng.next(),pass=rng.next()<.53;
  let outcome;
  if(pass){
    const intRate=clamp(.0115-matchup*.00014,.005,.026),fumbleRate=clamp(.004-matchup*.00003,.002,.008),sackRate=clamp(.060-matchup*.00045,.035,.095);
    if(roll<intRate)outcome={turnover:'interception',kind:'pass',completed:false,yards:clamp(Math.round(8+rng.gauss()*9),-5,35),clock:rng.int(8,18)};
    else if(roll<intRate+fumbleRate)outcome={turnover:'fumble',kind:'pass',completed:false,sack:true,yards:-clamp(Math.round(6+rng.gauss()*2),2,12),clock:rng.int(22,38)};
    else if(roll<intRate+fumbleRate+sackRate)outcome={kind:'pass',completed:false,sack:true,yards:-clamp(Math.round(6+rng.gauss()*2),2,12),clock:rng.int(22,38)};
    else{
      const comp=clamp(.64+matchup*.0032,.48,.79),completed=rng.next()<comp;
      if(!completed)outcome={kind:'pass',completed:false,yards:0,clock:rng.int(6,12)};
      else{
        const redZoneFinish=state.fieldPosition>=80?1.25:state.fieldPosition>=65?.45:0;
        outcome={kind:'pass',completed:true,yards:clamp(Math.round(9.6+edge*1.15+redZoneFinish+rng.gauss()*7.2),-3,55),clock:rng.int(26,42)};
      }
    }
  }else{
    const fumbleRate=clamp(.012-matchup*.00008,.006,.022);
    if(roll<fumbleRate)outcome={turnover:'fumble',kind:'rush',yards:clamp(Math.round(3+rng.gauss()*6),-8,18),clock:rng.int(18,34)};
    else{
      const redZoneFinish=state.fieldPosition>=80?1.6:state.fieldPosition>=65?.6:0;
      outcome={kind:'rush',yards:clamp(Math.round(4.3+edge*.7+redZoneFinish+rng.gauss()*4.8),-14,55),clock:rng.int(27,42)};
    }
  }
  finishRng(state,rng);return outcome;
  function finishRng(target,source){target.rng=source.snapshot()}
}
function annotateOutcomeEvent(state,startIndex,outcome){
  const events=state.events||[];
  for(let i=events.length-1;i>=startIndex;i--){
    const e=events[i];if(!['scrimmage','interception','fumble'].includes(e.type))continue;
    e.kind=outcome.kind||null;
    if(typeof outcome.completed==='boolean')e.completed=outcome.completed;
    if(outcome.sack)e.sack=true;
    e.attributionVersion=1;
    return e;
  }
  return null;
}
function shadowDecision(state){
  if(state.down!==4)return'play';
  if(state.fieldPosition>=58&&state.distance>2)return'field_goal';
  if(state.fieldPosition<60&&state.distance>1)return'punt';
  return'play';
}
function simulateShadow(options={}){
  const {state,homeInput,awayInput}=createShadowGame(options),homeFieldRating=clamp(finite(options.homeFieldRating,0),0,12);GameEngineV2.startGame(state);
  let steps=0;while(state.status!=='final'){
    if(++steps>500)throw new Error('Shadow Game Engine 2 step limit exceeded.');
    if(state.period>4){
      if(state.ot?.period>=3||(state.down===4&&state.fieldPosition>=55)){GameEngineV2.step(state);continue}
      const outcome=profileOutcome(state,homeInput,awayInput,homeFieldRating),start=state.events.length;
      GameEngineV2.applyScrimmage(state,outcome);annotateOutcomeEvent(state,start,outcome);continue;
    }
    const decision=shadowDecision(state);
    if(decision==='field_goal')GameEngineV2.attemptFieldGoal(state);
    else if(decision==='punt')GameEngineV2.punt(state);
    else{
      const outcome=profileOutcome(state,homeInput,awayInput,homeFieldRating),start=state.events.length;
      GameEngineV2.applyScrimmage(state,outcome);annotateOutcomeEvent(state,start,outcome);
    }
  }
  GameEngineV2.validateGame(state);return{state,summary:eventSummary(state),inputs:{home:homeInput,away:awayInput},homeFieldRating};
}
function aggregate(samples){
  if(!Array.isArray(samples)||!samples.length)throw new Error('Shadow calibration needs at least one sample.');
  const result={games:samples.length,points:0,plays:0,yards:0,turnovers:0,overtime:0,homeWins:0};
  for(const sample of samples){const s=sample.summary||eventSummary(sample.state||sample);result.points+=s.totalPoints;result.plays+=s.totalPlays;result.yards+=s.home.yards+s.away.yards;result.turnovers+=s.home.turnovers+s.away.turnovers;result.overtime+=s.overtime?1:0;const st=sample.state||sample;if(st.score.home>st.score.away)result.homeWins++}
  for(const k of ['points','plays','yards','turnovers','overtime','homeWins'])result[k]/=result.games;
  return result;
}
return{profileTeam,eventSummary,createShadowGame,profileOutcome,annotateOutcomeEvent,shadowDecision,simulateShadow,aggregate};
});
