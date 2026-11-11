(function(root,factory){
  const engine=(typeof module==='object'&&module.exports)?require('./game-engine-v2.js'):root.DynastyGameEngineV2;
  const rngApi=(typeof module==='object'&&module.exports)?require('./rng.js'):root.DynastyRng;
  const conditionsApi=(typeof module==='object'&&module.exports)?require('./game-conditions.js'):root.DynastyGameConditions;
  const api=factory(engine,rngApi,conditionsApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2Adapter=api;
})(typeof window==='object'?window:globalThis,function(GameEngineV2,DynastyRng,GameConditions){
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
  const side=()=>({points:0,plays:0,yards:0,turnovers:0,punts:0,fieldGoals:{made:0,attempted:0},touchdowns:0,possessions:0,penalties:0,penaltyYards:0});
  const out={home:side(),away:side(),totalPlays:0,totalPoints:state.score.home+state.score.away,overtime:state.period>4};
  out.home.points=state.score.home;out.away.points=state.score.away;
  for(const e of state.events||[]){
    if(e.type==='kickoff'&&e.receiver)out[e.receiver].possessions++;
    if(e.type==='possession_change'&&e.to)out[e.to].possessions++;
    if(e.type==='overtime_possession'&&e.possession)out[e.possession].possessions++;
    if(e.type==='penalty'&&(e.against==='home'||e.against==='away')){out[e.against].penalties++;out[e.against].penaltyYards+=Number(e.yards)||0;continue}
    const t=e.team;if(t!=='home'&&t!=='away')continue;
    if(e.type==='scrimmage'){out[t].plays++;out[t].yards+=Number(e.yards)||0;out.totalPlays++}
    else if(e.type==='interception'||e.type==='fumble'){out[t].turnovers++;out[t].plays++;out.totalPlays++;if(e.type==='fumble')out[t].yards+=Number(e.yards)||0}
    else if(e.type==='punt')out[t].punts++;
    else if(e.type==='field_goal'){out[t].fieldGoals.attempted++;if(e.made)out[t].fieldGoals.made++}
    else if(e.type==='touchdown')out[t].touchdowns++;
  }
  return out;
}
// A game plays by the v0.16 rules (penalties, returns, pressure and the stadium and weather) unless the caller
// passes rules:false. Callers that know the date pass year and week so the conditions match the calendar.
function rulesFor(options,home){
  if(options.rules===false)return null;
  if(options.rules&&typeof options.rules==='object')return options.rules;
  const conditions=options.conditions||(GameConditions?GameConditions.forGame({home:home||options.home||{},year:options.year,week:options.week,neutral:options.neutral,gameId:options.gameId}):null);
  return conditions?{version:GameEngineV2.RULES_VERSION,conditions}:{version:GameEngineV2.RULES_VERSION};
}
function createShadowGame(options={}){
  const {gameId,seed,home,away,homeProfile,awayProfile,openingReceiver}=options;
  const homeInput=profileTeam(home,homeProfile),awayInput=profileTeam(away,awayProfile);
  const state=GameEngineV2.createGame({gameId,seed,openingReceiver,home:homeInput,away:awayInput,rules:rulesFor(options,home)});
  return{state,homeInput,awayInput};
}
function legacyProfileOutcome(state,homeInput,awayInput,homeFieldRating=0){
  const rng=DynastyRng.create(state.rng),isHome=state.possession==='home',offense=isHome?homeInput:awayInput,defense=isHome?awayInput:homeInput;
  const venueEdge=isHome?homeFieldRating:-homeFieldRating,matchup=offense.offense-defense.defense+venueEdge,edge=matchup/18,roll=rng.next(),pass=rng.next()<.53;
  let outcome;
  if(pass){
    const intRate=clamp(.0145-matchup*.00014,.006,.032),fumbleRate=clamp(.005-matchup*.00003,.0025,.010),sackRate=clamp(.052-matchup*.00045,.030,.088);
    if(roll<intRate)outcome={turnover:'interception',kind:'pass',completed:false,yards:clamp(Math.round(8+rng.gauss()*9),-5,35),clock:rng.int(8,18)};
    else if(roll<intRate+fumbleRate)outcome={turnover:'fumble',kind:'pass',completed:false,sack:true,yards:-clamp(Math.round(6+rng.gauss()*2),2,12),clock:rng.int(22,38)};
    else if(roll<intRate+fumbleRate+sackRate)outcome={kind:'pass',completed:false,sack:true,yards:-clamp(Math.round(6+rng.gauss()*2),2,12),clock:rng.int(22,38)};
    else{
      const comp=clamp(.67+matchup*.0032,.50,.80),completed=rng.next()<comp;
      if(!completed)outcome={kind:'pass',completed:false,yards:0,clock:rng.int(6,12)};
      else{
        const redZoneFinish=state.fieldPosition>=80?2.6:state.fieldPosition>=65?.9:0;
        outcome={kind:'pass',completed:true,yards:clamp(Math.round(9.6+edge*1.15+redZoneFinish+rng.gauss()*7.2),-3,55),clock:rng.int(26,42)};
      }
    }
  }else{
    const fumbleRate=clamp(.015-matchup*.00008,.007,.026);
    if(roll<fumbleRate)outcome={turnover:'fumble',kind:'rush',yards:clamp(Math.round(3+rng.gauss()*6),-8,18),clock:rng.int(18,34)};
    else{
      const redZoneFinish=state.fieldPosition>=80?2.6:state.fieldPosition>=65?1.0:0;
      outcome={kind:'rush',yards:clamp(Math.round(4.3+edge*.7+redZoneFinish+rng.gauss()*4.8),-14,55),clock:rng.int(27,42)};
    }
  }
  finishRng(state,rng);return outcome;
  function finishRng(target,source){target.rng=source.snapshot()}
}

// ---- v0.16 play model ----
const clampTo=clamp;
// Applicable penalties for this snap with their per-snap odds, adjusted for team discipline and the crowd.
function penaltyOdds(state,offense,defense,hfr,isHome,outcome){
  const out=[],pass=outcome.kind==='pass'&&!outcome.sack&&!outcome.scramble,fp=state.fieldPosition;
  const offDiscipline=clamp(1+(70-offense.rating)/260,.85,1.22),defDiscipline=clamp(1+(70-defense.rating)/260,.85,1.22);
  for(const [kind,type] of Object.entries(GameEngineV2.PENALTY_TYPES)){
    if(type.pass&&!pass)continue;
    if(type.against==='offense'&&fp<4)continue;
    if(type.against==='defense'&&fp>97)continue;
    let w=type.weight*PENALTY_SCALE*(type.against==='offense'?offDiscipline:defDiscipline);
    if(kind==='false_start')w*=isHome?1-hfr/40:1+hfr/14;      // a loud stadium rattles the visiting line
    if(kind==='offside'||kind==='encroachment')w*=isHome?1+hfr/20:1;
    out.push([kind,w]);
  }
  return out;
}
const PENALTY_SCALE=1.62;
// Whether the team that was fouled takes the penalty or the play. Dead-ball fouls are always enforced.
function penaltyAccepted(state,type,spotYards,outcome){
  if(type.dead)return true;
  const yards=Number(outcome.yards)||0,distance=state.distance,conversion=yards>=distance;
  if(type.against==='offense'){
    // The defense takes a holding call that wipes out a good play and declines one that follows a stop or a sack.
    return !outcome.turnover&&(yards>=5||(state.down>=3&&conversion));
  }
  const gain=spotYards+(type.auto||spotYards>=distance?5:0),playValue=Math.max(0,yards)+(conversion?5:0);
  return !!outcome.turnover||gain>playValue;
}
// `call` is a coach's play call for this snap (v0.19): small shifts to how often a team throws and how the play
// tends to go. Every field is optional and a missing call changes nothing, including the order of random draws.
function profileOutcomeRules(state,homeInput,awayInput,homeFieldRating=0,call=null){
  const c=call||{},cPass=finite(c.passRate,0),cPassYards=finite(c.passYards,1),cRushYards=finite(c.rushYards,0),cInt=finite(c.intMult,1),cSack=finite(c.sackMult,1),cComp=finite(c.comp,0),cHurry=finite(c.hurry,0);
  const rng=DynastyRng.create(state.rng),isHome=state.possession==='home',offense=isHome?homeInput:awayInput,defense=isHome?awayInput:homeInput;
  const rules=state.rules,e=GameEngineV2.effectsOf(state),pressureOn=rules.pressure!==false;
  const venueEdge=isHome?homeFieldRating:-homeFieldRating,matchup=offense.offense-defense.defense+venueEdge,edge=matchup/18;
  const roll=rng.next(),pass=rng.next()<clamp(.53+e.passRate+cPass,call?.2:.35,call?.8:.62);
  let outcome;
  if(pass){
    const intRate=clamp(.0145-matchup*.00014,.006,.032)*e.interception*cInt,fumbleRate=clamp(.005-matchup*.00003,.0025,.010)*e.fumble,sackRate=clamp(.052-matchup*.00045,.030,.088)*cSack;
    const redZoneFinish=state.fieldPosition>=80?2.6:state.fieldPosition>=65?.9:0;
    if(roll<intRate)outcome={turnover:'interception',kind:'pass',completed:false,yards:clamp(Math.round(8+rng.gauss()*9),-5,35),clock:rng.int(8,18)};
    else if(roll<intRate+fumbleRate)outcome={turnover:'fumble',kind:'pass',completed:false,sack:true,pressure:true,yards:-clamp(Math.round(6+rng.gauss()*2),2,12),clock:rng.int(22,38)};
    else if(roll<intRate+fumbleRate+sackRate)outcome={kind:'pass',completed:false,sack:true,pressure:true,yards:-clamp(Math.round(6+rng.gauss()*2),2,12),clock:rng.int(22,38)};
    else{
      // Pressure that stops short of a sack: the quarterback is hurried, scrambles, or throws it away.
      const hurryRate=pressureOn?clamp(.205-matchup*.0022+cHurry,.05,.45):0,hurried=rng.next()<hurryRate,shape=rng.next();
      if(hurried&&shape<.17)outcome={kind:'rush',scramble:true,pressure:true,yards:clamp(Math.round(6.2+rng.gauss()*5.2),-4,32),clock:rng.int(26,40)};
      else if(hurried&&shape<.42)outcome={kind:'pass',completed:false,pressure:true,yards:0,clock:rng.int(6,12)};
      else{
        const comp=clamp((hurried?.595:.724)+matchup*.0032+e.passComp+cComp,.36,.86),completed=rng.next()<comp;
        if(!completed)outcome={kind:'pass',completed:false,yards:0,clock:rng.int(6,12)};
        else{
          const raw=(9.6+edge*1.15+redZoneFinish+rng.gauss()*7.2)*(hurried?.92:1.045)*e.passYards*cPassYards;
          outcome={kind:'pass',completed:true,yards:clamp(Math.round(raw),-3,55),clock:rng.int(26,42)};
        }
        if(hurried)outcome.pressure=true;
      }
    }
  }else{
    const fumbleRate=clamp(.015-matchup*.00008,.007,.026)*e.fumble;
    if(roll<fumbleRate)outcome={turnover:'fumble',kind:'rush',yards:clamp(Math.round(3+rng.gauss()*6),-8,18),clock:rng.int(18,34)};
    else{
      const redZoneFinish=state.fieldPosition>=80?2.6:state.fieldPosition>=65?1.0:0;
      outcome={kind:'rush',yards:clamp(Math.round((4.3+edge*.7+redZoneFinish+cRushYards+rng.gauss()*4.8)*e.rushYards),-14,55),clock:rng.int(27,42)};
    }
  }
  // Flags: one draw decides whether there is a foul at all, one picks it, one sizes a pass interference spot.
  if(rules.penalties!==false&&state.period<=4){
    const flag=rng.next(),pick=rng.next(),spotDraw=rng.gauss(),odds=penaltyOdds(state,offense,defense,homeFieldRating,isHome,outcome),total=odds.reduce((n,x)=>n+x[1],0);
    if(flag<total){
      let target=pick*total,kind=odds[odds.length-1][0];
      for(const [k,w] of odds){target-=w;if(target<=0){kind=k;break}}
      const type=GameEngineV2.PENALTY_TYPES[kind],spotYards=type.spot?clamp(Math.round(13+spotDraw*7),5,40):type.yards;
      if(penaltyAccepted(state,type,spotYards,outcome))outcome={penalty:{kind,yards:spotYards},clock:type.dead?4:outcome.clock};
    }
  }
  state.rng=rng.snapshot();return outcome;
}
// Games that carry rules use the v0.16 model; a game saved before it (no rules on the state) plays as it did.
function profileOutcome(state,homeInput,awayInput,homeFieldRating=0,call=null){
  return state&&state.rules?profileOutcomeRules(state,homeInput,awayInput,homeFieldRating,call):legacyProfileOutcome(state,homeInput,awayInput,homeFieldRating);
}
function annotateOutcomeEvent(state,startIndex,outcome){
  const events=state.events||[];
  for(let i=events.length-1;i>=startIndex;i--){
    const e=events[i];if(!['scrimmage','interception','fumble'].includes(e.type))continue;
    e.kind=outcome.kind||null;
    if(typeof outcome.completed==='boolean')e.completed=outcome.completed;
    if(outcome.sack)e.sack=true;
    if(outcome.pressure)e.pressure=true;
    if(outcome.scramble)e.scramble=true;
    e.attributionVersion=1;
    return e;
  }
  return null;
}
function shadowDecision(state){return GameEngineV2.defaultFourthDown(state,true)}
// Situational playbooks by side ({home, away}); a side without one plays the default policy.
function attachPlaybook(state,playbook){
  if(!playbook||typeof playbook!=='object')return state;
  const out={};for(const side of ['home','away']){const p=GameEngineV2.sanitizePlaybook(playbook[side]);if(p)out[side]=p}
  if(Object.keys(out).length)state.playbook=out;return state;
}
function simulateShadow(options={}){
  const {state,homeInput,awayInput}=createShadowGame(options),homeFieldRating=clamp(finite(options.homeFieldRating,0),0,12);
  attachPlaybook(state,options.playbook);GameEngineV2.startGame(state);
  let steps=0;while(state.status!=='final'){
    if(++steps>500)throw new Error('Shadow Game Engine 2 step limit exceeded.');
    if(state.period>4){
      if(state.ot?.period>=3||(state.down===4&&state.fieldPosition>=55)){GameEngineV2.step(state);continue}
      const outcome=profileOutcome(state,homeInput,awayInput,homeFieldRating),start=state.events.length;
      GameEngineV2.applyScrimmage(state,outcome);annotateOutcomeEvent(state,start,outcome);continue;
    }
    const decision=GameEngineV2.playbookFourthDown(state)||shadowDecision(state);
    if(decision==='field_goal')GameEngineV2.attemptFieldGoal(state);
    else if(decision==='punt')GameEngineV2.punt(state);
    else{
      const outcome=GameEngineV2.playbookClock(state,profileOutcome(state,homeInput,awayInput,homeFieldRating)),start=state.events.length;
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
return{attachPlaybook,profileTeam,eventSummary,createShadowGame,profileOutcome,annotateOutcomeEvent,shadowDecision,simulateShadow,aggregate};
});
