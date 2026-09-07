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
 function archiveTeamName(record,side){const x=record?.[side];return typeof x==='string'?x:(x?.name||'')}
 function archiveTeamId(record,side){const x=record?.[side];return Number(x?.id)||T(archiveTeamName(record,side))?.id||null}
 function archiveScore(record,side){const score=record?.score;if(Number.isFinite(Number(score?.[side])))return Number(score[side]);if(Array.isArray(score))return Number(score[side==='home'?0:1])||0;return 0}
 function performerImpact(line){const s=line?.stats||{};return (s.passYds||0)*.035+(s.passTD||0)*5-(s.int||0)*3+(s.rushYds||0)*.08+(s.rushTD||0)*5+(s.recYds||0)*.08+(s.recTD||0)*5+(s.tackles||0)*.8+(s.tfl||0)*1.6+(s.sacks||0)*3.5+(s.intDef||0)*4.5+(s.forcedFumbles||0)*3}
 function performerSummary(line){const s=line?.stats||{},parts=[];if(s.passYds)parts.push(`${s.passYds} pass yds`);if(s.passTD)parts.push(`${s.passTD} pass TD`);if(s.rushYds)parts.push(`${s.rushYds} rush yds`);if(s.rushTD)parts.push(`${s.rushTD} rush TD`);if(s.recYds)parts.push(`${s.recYds} rec yds`);if(s.recTD)parts.push(`${s.recTD} rec TD`);if(s.tackles)parts.push(`${s.tackles} tackles`);if(s.sacks)parts.push(`${s.sacks} sacks`);if(s.intDef)parts.push(`${s.intDef} INT`);return parts.slice(0,2).join(' · ')||'Contributed in the win/loss'}
 function latestShowcase(u){
  const records=(universe.gameArchive||[]).filter(r=>{const h=archiveTeamName(r,'home'),a=archiveTeamName(r,'away');return h===u.name||a===u.name}).slice().sort((a,b)=>(b.season||universe.year)-(a.season||universe.year)||(b.week||0)-(a.week||0));const r=records[0];if(!r)return null;
  const userSide=archiveTeamName(r,'home')===u.name?'home':'away',oppSide=userSide==='home'?'away':'home',oppName=archiveTeamName(r,oppSide),userScore=archiveScore(r,userSide),oppScore=archiveScore(r,oppSide),lines=(r.playerStats?.[userSide]||[]).slice().sort((a,b)=>performerImpact(b)-performerImpact(a)).slice(0,3);
  return{id:r.id||null,week:r.week??null,season:r.season??universe.year,result:userScore>oppScore?'W':'L',userScore,oppScore,opponent:oppName||'Opponent',opponentId:archiveTeamId(r,oppSide),location:userSide==='home'?'vs':'@',engine:r.engine||null,drives:(r.drives||[]).map(d=>({side:d.side,points:Number(d.points)||0})).slice(-18),performers:lines.map(x=>({id:x.id,name:x.name,pos:x.pos,summary:performerSummary(x)}))};
 }
 function seasonStorySnapshot(){
  if(!universe?.teams)return null;const t=selected?.();if(!t)return null;const stories=[],games=(t.schedule||[]).slice().sort((a,b)=>(a.week||0)-(b.week||0)),teamStreak=seasonPresentationModel.streak(games,t.name);
  if(/^W[3-9]\d*$/.test(teamStreak))stories.push({type:'team',tone:'good',kicker:'MOMENTUM',title:`${teamStreak} winning streak`,summary:`${t.name} has won ${teamStreak.slice(1)} straight games.`,tab:'season'});
  const standing=confStand(t.conference).findIndex(x=>x.id===t.id);if(standing===0&&t.cw+t.cl>=2)stories.push({type:'team',tone:'good',kicker:'CONFERENCE RACE',title:'First in the conference',summary:`${t.name} currently sits atop the ${t.conference} standings at ${t.cw}-${t.cl} in league play.`,tab:'season'});
  for(const s of (typeof v0102PlayerStories==='function'?v0102PlayerStories(t):[]).slice(0,2))stories.push({type:'player',tone:s.tone||'neutral',kicker:String(s.type||'PLAYER').replaceAll('_',' '),title:s.name,summary:s.summary,playerId:s.playerId,tab:'roster'});
  const dev=globalThis.DynastyLabDevelopmentTendencies?.summary?.(t)?.notable||[];for(const row of dev.slice(0,2)){const c=row.clue,p=row.p;if(!p||!c)continue;stories.push({type:'development',tone:c.tone||'neutral',kicker:'DEVELOPMENT',title:`${p.pos} ${p.name} · ${c.label}`,summary:c.summary,playerId:p.id,tab:'development'})}
  const battles=(universe.recruits||[]).filter(r=>r.targeted&&!r.committed).map(r=>{const s=recruitingBattleSystem.raceSummary(battleRows(r,5),t.id);return{r,s,window:recruitingBattleSystem.decisionWindow(r,universe,s)}}).filter(x=>x.s.rank&&x.s.rank<=2&&x.s.gap!=null&&x.s.gap>=-7).sort((a,b)=>b.r.interest-a.r.interest);for(const x of battles.slice(0,2)){stories.push({type:'recruiting',tone:x.s.rank===1?'good':'alert',kicker:'RECRUITING BATTLE',title:`${x.r.name} · ${x.s.label}`,summary:`You are #${x.s.rank}, ${x.s.gap===0?'even with':`${Math.abs(x.s.gap)} points behind`} ${x.s.leader||'the leader'} · ${x.window}.`,recruitId:x.r.id,tab:'recruiting'})}
  return{year:universe.year,week:universe.week,teamId:t.id,stories:stories.slice(0,6)};
 }
 function teamRead(t){const p=profiles(t);return{id:t.id,name:t.name,record:`${t.w}-${t.l}`,rank:rankText(t),conference:t.conference,offense:grade(p.offense),defense:grade(p.defense)}}
 function gameDaySnapshot(){
  if(!universe?.teams)return null;const u=selected?.();if(!u)return null;const last=latestShowcase(u),g=findUserGame?.();
  if(!g){if(!last)return null;const opp=T(last.opponent);if(!opp)return null;const isHome=last.location==='vs',homeTeam=isHome?u:opp;return{postgame:true,week:last.week,location:last.location,isHome,isRival:false,sameConference:u.conference===opp.conference,stakesTone:'postgame',user:teamRead(u),opponent:teamRead(opp),venue:[homeTeam.city,homeTeam.state].filter(Boolean).join(', '),stakes:'Postgame review',homeEdge:'Final result recorded',userOut:0,opponentOut:0,opponentPassMix:Math.round((OFF_SCHEMES[opp.offScheme]?.pass??.5)*100),activePlan:'Final',recommendedPlan:'Review',recommendation:'Review the result and key performers before advancing the week.',lastShowcase:last}}
  const opp=T(g.home===u.name?g.away:g.home);if(!opp)return null;
  const m=gameMatchup(u,opp),P=m.teamProfile||profiles(u),O=m.opponentProfile||profiles(opp),plan=teamGameplanFor(u,opp.name),tier=GAMEPLAN_TIERS[plan?.prep]||GAMEPLAN_TIERS.standard,rec=gameplanRecommendation(u,opp,m),recommended=GAMEPLAN_TIERS[rec?.id]||GAMEPLAN_TIERS.balance||tier;
  const isHome=g.home===u.name,homeTeam=isHome?u:opp,rival=rivalOf(u),isRival=rival?.name===opp.name,sameConference=u.conference===opp.conference;
  const stakes=isRival?`${u.rivalry?.trophy||'Rivalry game'} · ${rivalrySeriesText(u)}`:sameConference?`${u.conference} Conference game`:'Nonconference game';
  const passMix=Math.round((OFF_SCHEMES[opp.offScheme]?.pass??.5)*100);
  return{
   postgame:false,week:g.week??universe.week+1,location:isHome?'vs':'@',isHome,isRival,sameConference,stakesTone:isRival?'rivalry':sameConference?'conference':'standard',
   user:{id:u.id,name:u.name,record:`${u.w}-${u.l}`,rank:rankText(u),conference:u.conference,offense:grade(P.offense),defense:grade(P.defense)},
   opponent:{id:opp.id,name:opp.name,record:`${opp.w}-${opp.l}`,rank:rankText(opp),conference:opp.conference,offense:grade(O.offense),defense:grade(O.defense)},
   venue:[homeTeam.city,homeTeam.state].filter(Boolean).join(', '),stakes,
   homeEdge:isHome?`Home field +${homeFieldFor(u).toFixed(1)} pts`:`Road game · ${opp.name} receives home field`,
   userOut:(u.roster||[]).filter(p=>!gameAvailable(p)).length,opponentOut:(opp.roster||[]).filter(p=>!gameAvailable(p)).length,
   opponentPassMix:passMix,activePlan:tier?.label||'Standard',recommendedPlan:recommended?.label||tier?.label||'Standard',recommendation:rec?.reason||'Current staff recommendation.',lastShowcase:last
  };
 }
 globalThis.DynastyLabGameDayPresentation={snapshot:gameDaySnapshot,note:'Read-only Game Day presentation derived from the same current matchup, roster availability, staff recommendation, schedule, archived game results and home-field inputs used by the live game.'};
 globalThis.DynastyLabSeasonStories={snapshot:seasonStorySnapshot,note:'Factual season stories derived from current records, standings, existing Player Stories, observed development tendencies and live recruiting battle state. No hidden ratings or invented events are exposed.'};
 globalThis.DynastyLabSeasonPresentation={snapshot:()=>{if(!universe?.teams)return null;const u=selected?.();if(!u)return null;const games=(u.schedule||[]).slice().sort((a,b)=>(a.week||0)-(b.week||0)),played=games.filter(g=>g.played),nextGame=games.find(g=>!g.played)||null,latestGame=played.slice().sort((a,b)=>(b.week||0)-(a.week||0))[0]||null;const makeOpponent=g=>{if(!g)return null;const name=g.home===u.name?g.away:g.home,t=T(name);return{id:t?.id??null,name,record:t?`${t.w}-${t.l}`:'—',rank:rankText(t),conference:t?.conference??null,location:g.home===u.name?'vs':'@',week:g.week,venue:t&&g.home!==u.name?`${t.city}, ${t.state}`:`${u.city}, ${u.state}`}};const standing=confStand(u.conference).findIndex(t=>t.id===u.id);return seasonPresentationModel.summary({teamId:u.id,teamName:u.name,record:`${u.w}-${u.l}`,conferenceRecord:`${u.cw}-${u.cl}`,rank:rankText(u),conference:u.conference,conferencePlace:standing>=0?standing+1:null,year:universe.year,phase:universe.phase,week:universe.week,completed:played.length,remaining:games.length-played.length,streak:seasonPresentationModel.streak(games,u.name),latest:latestGame?{...seasonPresentationModel.gameResult(latestGame,u.name),opponentId:T(latestGame.home===u.name?latestGame.away:latestGame.home)?.id??null}:null,next:nextGame?makeOpponent(nextGame):null})},note:'Season presentation derives only from the public schedule, results, standings, team records and current phase.'};
}
