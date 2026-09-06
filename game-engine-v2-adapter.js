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
  const intRate=clamp(.0115-matchup*.00014,.005,.026);
  const fumbleRate=clamp(.009-matchup*.00006,.004,.018);
  let outcome;
  if(roll<intRate)outcome={turnover:'interception',yards:clamp(Math.round(8+rng.gauss()*9),-5,35),clock:rng.int(8,18)};
  else if(roll<intRate+fumbleRate)outcome={turnover:'fumble',yards:clamp(Math.round(3+rng.gauss()*6),-8,18),clock:rng.int(10,20)};
  else{
    const mean=pass?5.6:4.3,spread=pass?8.2:4.8,edgeWeight=pass?1:.7;
    const redZoneFinish=state.fieldPosition>=80?1.6:state.fieldPosition>=65?.6:0;
    outcome={yards:clamp(Math.round(mean+edge*edgeWeight+redZoneFinish+rng.gauss()*spread),-14,55),clock:pass?rng.int(12,38):rng.int(27,42),kind:pass?'pass':'rush'};
  }
  state.rng=rng.snapshot();return outcome;
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
    if(state.period>4){GameEngineV2.step(state);continue}
    const decision=shadowDecision(state);
    if(decision==='field_goal')GameEngineV2.attemptFieldGoal(state);
    else if(decision==='punt')GameEngineV2.punt(state);
    else GameEngineV2.applyScrimmage(state,profileOutcome(state,homeInput,awayInput,homeFieldRating));
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
return{profileTeam,eventSummary,createShadowGame,profileOutcome,shadowDecision,simulateShadow,aggregate};
});