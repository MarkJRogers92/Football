function makeSeasonPresentationModel(){
 'use strict';
 function gameResult(game,userName){if(!game?.played)return null;const isHome=game.home===userName,userScore=isHome?game.score?.[1]:game.score?.[0],oppScore=isHome?game.score?.[0]:game.score?.[1];return{result:game.winner===userName?'W':'L',userScore:Number(userScore)||0,oppScore:Number(oppScore)||0,opponent:isHome?game.away:game.home,location:isHome?'vs':'@',week:game.week,detailed:!!game.detailed}}
 function streak(schedule=[],userName){const played=schedule.filter(g=>g.played).slice().sort((a,b)=>(b.week||0)-(a.week||0));if(!played.length)return'—';const first=gameResult(played[0],userName)?.result;if(!first)return'—';let n=0;for(const g of played){if(gameResult(g,userName)?.result!==first)break;n++}return`${first}${n}`}
 function summary(raw={}){return{teamId:Number(raw.teamId)||null,teamName:raw.teamName??'Program',record:raw.record??'0-0',conferenceRecord:raw.conferenceRecord??'0-0',rank:raw.rank??'NR',conference:raw.conference??'—',conferencePlace:Number(raw.conferencePlace)||null,year:Number(raw.year)||null,phase:raw.phase??'—',week:Number(raw.week)||0,completed:Number(raw.completed)||0,remaining:Number(raw.remaining)||0,streak:raw.streak??'—',latest:raw.latest?{...raw.latest}:null,next:raw.next?{...raw.next}:null}}
 return{gameResult,streak,summary};
}

if(typeof module==='object'&&module.exports){module.exports={makeSeasonPresentationModel};}
else{
 const seasonPresentationModel=makeSeasonPresentationModel();
 function rankText(t){return t?.rank<=25?`#${t.rank}`:'NR'}
 function gameDaySnapshot(){
  if(!universe?.teams)return null;
  const u=selected?.(),g=findUserGame?.();if(!u||!g)return null;
  const opp=T(g.home===u.name?g.away:g.home);if(!opp)return null;
  const m=gameMatchup(u,opp),P=m.teamProfile||profiles(u),O=m.opponentProfile||profiles(opp),plan=teamGameplanFor(u,opp.name),tier=GAMEPLAN_TIERS[plan?.prep]||GAMEPLAN_TIERS.standard,rec=gameplanRecommendation(u,opp,m),recommended=GAMEPLAN_TIERS[rec?.id]||GAMEPLAN_TIERS.balance||tier;
  const isHome=g.home===u.name,homeTeam=isHome?u:opp,rival=rivalOf(u),isRival=rival?.name===opp.name,sameConference=u.conference===opp.conference;
  const stakes=isRival?`${u.rivalry?.trophy||'Rivalry game'} · ${rivalrySeriesText(u)}`:sameConference?`${u.conference} Conference game`:'Nonconference game';
  const passMix=Math.round((OFF_SCHEMES[opp.offScheme]?.pass??.5)*100);
  return{
   week:g.week??universe.week+1,location:isHome?'vs':'@',isHome,
   user:{id:u.id,name:u.name,record:`${u.w}-${u.l}`,rank:rankText(u),conference:u.conference,offense:grade(P.offense),defense:grade(P.defense)},
   opponent:{id:opp.id,name:opp.name,record:`${opp.w}-${opp.l}`,rank:rankText(opp),conference:opp.conference,offense:grade(O.offense),defense:grade(O.defense)},
   venue:[homeTeam.city,homeTeam.state].filter(Boolean).join(', '),stakes,
   homeEdge:isHome?`Home field +${homeFieldFor(u).toFixed(1)} pts`:`Road game · ${opp.name} receives home field`,
   userOut:(u.roster||[]).filter(p=>!gameAvailable(p)).length,opponentOut:(opp.roster||[]).filter(p=>!gameAvailable(p)).length,
   opponentPassMix:passMix,activePlan:tier?.label||'Standard',recommendedPlan:recommended?.label||tier?.label||'Standard',recommendation:rec?.reason||'Current staff recommendation.'
  };
 }
 globalThis.DynastyLabGameDayPresentation={snapshot:gameDaySnapshot,note:'Read-only Game Day presentation derived from the same current matchup, roster availability, staff recommendation, schedule and home-field inputs used by the live game.'};
 globalThis.DynastyLabSeasonPresentation={snapshot:()=>{if(!universe?.teams)return null;const u=selected?.();if(!u)return null;const games=(u.schedule||[]).slice().sort((a,b)=>(a.week||0)-(b.week||0)),played=games.filter(g=>g.played),nextGame=games.find(g=>!g.played)||null,latestGame=played.slice().sort((a,b)=>(b.week||0)-(a.week||0))[0]||null;const makeOpponent=g=>{if(!g)return null;const name=g.home===u.name?g.away:g.home,t=T(name);return{id:t?.id??null,name,record:t?`${t.w}-${t.l}`:'—',rank:rankText(t),conference:t?.conference??null,location:g.home===u.name?'vs':'@',week:g.week,venue:t&&g.home!==u.name?`${t.city}, ${t.state}`:`${u.city}, ${u.state}`}};const standing=confStand(u.conference).findIndex(t=>t.id===u.id);return seasonPresentationModel.summary({teamId:u.id,teamName:u.name,record:`${u.w}-${u.l}`,conferenceRecord:`${u.cw}-${u.cl}`,rank:rankText(u),conference:u.conference,conferencePlace:standing>=0?standing+1:null,year:universe.year,phase:universe.phase,week:universe.week,completed:played.length,remaining:games.length-played.length,streak:seasonPresentationModel.streak(games,u.name),latest:latestGame?{...seasonPresentationModel.gameResult(latestGame,u.name),opponentId:T(latestGame.home===u.name?latestGame.away:latestGame.home)?.id??null}:null,next:nextGame?makeOpponent(nextGame):null})},note:'Season presentation derives only from the public schedule, results, standings, team records and current phase.'};
}
