(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2Transaction=api;
})(typeof window==='object'?window:globalThis,function(){
'use strict';

const VERSION=1;
const STAT_KEYS=new Set([
  'games','starts','snaps','passAtt','passComp','passYds','passTD','int','sacksTaken',
  'rushAtt','rushYds','rushTD','fumbles','targets','receptions','recYds','recTD','drops','yac',
  'tackles','tfl','sacks','pressures','intDef','passBreakups','forcedFumbles',
  'sacksAllowed','pressuresAllowed','penalties','fgMade','fgAtt','punts','puntYds'
]);
const BOX_KEYS=[
  'pts','plays','firstDowns','passAtt','passComp','passYds','passTD','int','sacksTaken',
  'rushAtt','rushYds','rushTD','fumblesLost','turnovers','recYds','recTD','fgMade','fgAtt','punts','puntYds'
];
const clone=value=>JSON.parse(JSON.stringify(value));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const sideName=side=>side==='home'?'home':'away';

function normalizeBox(stats={},points=0){
  const box={};
  for(const key of BOX_KEYS)box[key]=key==='pts'?finite(points):finite(stats[key]);
  return box;
}
function normalizeIdentity(team={},fallback='Team'){
  return {id:team.id??null,name:String(team.name||fallback),rank:team.rank??null,record:team.record??null};
}
function mergePlayerDeltas(lines=[],starterIds=[],roster=[]){
  const byId=new Map();
  const rosterById=new Map((roster||[]).map(p=>[String(p.id),p]));
  for(const row of lines||[]){
    const id=String(row.id);
    const source=rosterById.get(id)||row;
    const stats={};
    for(const [key,value] of Object.entries(row.stats||{})){
      if(!STAT_KEYS.has(key))throw new Error(`Unknown v2 player stat key: ${key}`);
      const n=finite(value);
      if(n)stats[key]=n;
    }
    stats.games=(stats.games||0)+1;
    byId.set(id,{id:source.id??row.id,name:String(source.name||row.name||'Player'),pos:String(source.pos||row.pos||''),stats});
  }
  for(const rawId of starterIds||[]){
    const id=String(rawId),source=rosterById.get(id);
    if(!source)throw new Error(`Starter ${rawId} is not on the supplied roster.`);
    let row=byId.get(id);
    if(!row){row={id:source.id,name:String(source.name||'Player'),pos:String(source.pos||''),stats:{games:1}};byId.set(id,row)}
    row.stats.starts=(row.stats.starts||0)+1;
  }
  return [...byId.values()];
}
function scoreAdjustment(score,box){
  return finite(score)-((finite(box.passTD)+finite(box.rushTD))*7+finite(box.fgMade)*3);
}
function buildCandidate({state,attribution,homeTeam,awayTeam,starterIds={},meta={},conference=false,homeOpponentOverall=0,awayOpponentOverall=0}={}){
  if(!state||state.engine!=='v2'||state.status!=='final')throw new Error('Transactional v2 candidate requires a final Game Engine 2 state.');
  if(!attribution?.reconciliation?.ok)throw new Error('Transactional v2 candidate requires reconciled player attribution.');
  const hp=finite(state.score?.home),ap=finite(state.score?.away);
  if(hp===ap)throw new Error('Transactional v2 candidate cannot end tied.');
  const home=normalizeIdentity(homeTeam||state.home,'Home');
  const away=normalizeIdentity(awayTeam||state.away,'Away');
  const box={home:normalizeBox(attribution.teamStats?.home,hp),away:normalizeBox(attribution.teamStats?.away,ap)};
  const playerStats={
    home:mergePlayerDeltas(attribution.playerStats?.home,starterIds.home,homeTeam?.roster),
    away:mergePlayerDeltas(attribution.playerStats?.away,starterIds.away,awayTeam?.roster)
  };
  const candidate={
    transactionVersion:VERSION,
    engine:'v2',seed:String(state.seed||''),
    season:meta.season??null,week:meta.week??null,phase:meta.phase||'regular',label:meta.label||'Regular season',venue:meta.venue||`${home.name}`,
    home,away,hp,ap,winner:hp>ap?home.name:away.name,
    conference:!!conference,
    opponentOverall:{home:finite(homeOpponentOverall),away:finite(awayOpponentOverall)},
    box,playerStats,detailed:true,drives:[],eventCount:Array.isArray(state.events)?state.events.length:0
  };
  candidate.scoreAdjustment={home:scoreAdjustment(hp,box.home),away:scoreAdjustment(ap,box.away)};
  return candidate;
}
function validateCandidate(candidate,{homeRoster=[],awayRoster=[]}={}){
  const errors=[];
  if(!candidate||candidate.engine!=='v2')errors.push('candidate engine is not v2');
  if(candidate?.hp===candidate?.ap)errors.push('candidate is tied');
  if(!candidate?.home?.name||!candidate?.away?.name)errors.push('team identity missing');
  if(candidate?.winner!==candidate?.home?.name&&candidate?.winner!==candidate?.away?.name)errors.push('winner does not match a team');
  if(candidate?.winner===(candidate?.hp>candidate?.ap?candidate?.away?.name:candidate?.home?.name))errors.push('winner does not match score');
  for(const side of ['home','away']){
    const box=candidate?.box?.[side]||{};
    for(const key of BOX_KEYS)if(!Number.isFinite(Number(box[key])))errors.push(`${side} box missing ${key}`);
    const score=side==='home'?candidate?.hp:candidate?.ap;
    if(Number(box.pts)!==Number(score))errors.push(`${side} box points do not match score`);
    if(Number(box.turnovers)!==Number(box.int)+Number(box.fumblesLost))errors.push(`${side} turnover components do not reconcile`);
    if(Number(box.plays)!==Number(box.passAtt)+Number(box.rushAtt))errors.push(`${side} plays do not reconcile`);
    const roster=side==='home'?homeRoster:awayRoster,rosterIds=new Set((roster||[]).map(p=>String(p.id))),seen=new Set();
    for(const row of candidate?.playerStats?.[side]||[]){
      const id=String(row.id);
      if(seen.has(id))errors.push(`${side} duplicate player ${id}`);seen.add(id);
      if(!rosterIds.has(id))errors.push(`${side} unknown player ${id}`);
      for(const [key,value] of Object.entries(row.stats||{})){
        if(!STAT_KEYS.has(key))errors.push(`${side} unknown stat ${key}`);
        if(!Number.isFinite(Number(value)))errors.push(`${side} non-finite stat ${key} for ${id}`);
      }
    }
    const adjustment=candidate?.scoreAdjustment?.[side];
    if(!Number.isFinite(Number(adjustment)))errors.push(`${side} score adjustment is not finite`);
  }
  return {ok:errors.length===0,errors};
}
function applyPlayerDeltas(team,lines){
  const players=new Map((team.roster||[]).map(p=>[String(p.id),p]));
  for(const row of lines||[]){
    const p=players.get(String(row.id));
    if(!p)throw new Error(`${team.name||'Team'} does not contain player ${row.id}.`);
    p.stats??={};
    for(const [key,value] of Object.entries(row.stats||{})){
      if(!STAT_KEYS.has(key))throw new Error(`Unknown v2 player stat key: ${key}`);
      p.stats[key]=finite(p.stats[key])+finite(value);
    }
  }
}
function applyToClone(candidate,homeTeam,awayTeam){
  const validation=validateCandidate(candidate,{homeRoster:homeTeam?.roster,awayRoster:awayTeam?.roster});
  if(!validation.ok)throw new Error(`Invalid v2 transaction candidate: ${validation.errors.join('; ')}`);
  const win=candidate.hp>candidate.ap?homeTeam:awayTeam,lose=win===homeTeam?awayTeam:homeTeam;
  win.w=finite(win.w)+1;lose.l=finite(lose.l)+1;
  if(candidate.conference){win.cw=finite(win.cw)+1;lose.cl=finite(lose.cl)+1}
  homeTeam.pf=finite(homeTeam.pf)+candidate.hp;homeTeam.pa=finite(homeTeam.pa)+candidate.ap;
  awayTeam.pf=finite(awayTeam.pf)+candidate.ap;awayTeam.pa=finite(awayTeam.pa)+candidate.hp;
  homeTeam.sos=finite(homeTeam.sos)+finite(candidate.opponentOverall?.home);
  awayTeam.sos=finite(awayTeam.sos)+finite(candidate.opponentOverall?.away);
  applyPlayerDeltas(homeTeam,candidate.playerStats.home);
  applyPlayerDeltas(awayTeam,candidate.playerStats.away);
  return {winner:win.name,home:homeTeam,away:awayTeam};
}
function archiveTeamSnapshot(team,candidateIdentity,gameplan=null){
  return {id:team?.id??candidateIdentity?.id??null,name:String(team?.name||candidateIdentity?.name||'Team'),rank:team?.rank??candidateIdentity?.rank??null,record:`${finite(team?.w)}-${finite(team?.l)}`,gameplan:gameplan?clone(gameplan):null};
}
function buildArchiveCandidate(candidate,{homeBefore,awayBefore,homeGameplan=null,awayGameplan=null,id=null}={}){
  const record={
    id:id||`V2_DRY_${candidate.season??'S'}_${candidate.week??'W'}`,
    season:candidate.season,week:candidate.week,phase:candidate.phase,label:candidate.label,venue:candidate.venue,
    home:archiveTeamSnapshot(homeBefore,candidate.home,homeGameplan),
    away:archiveTeamSnapshot(awayBefore,candidate.away,awayGameplan),
    final:true,score:{home:candidate.hp,away:candidate.ap},
    teamStats:clone(candidate.box),playerStats:clone(candidate.playerStats),injuries:[],drives:clone(candidate.drives||[]),detailed:true,
    scoreAdjustment:clone(candidate.scoreAdjustment),formerPlayers:[],engine:'v2',transactionVersion:VERSION,eventCount:candidate.eventCount
  };
  return record;
}
function validateArchiveCandidate(record,{homeRoster=[],awayRoster=[]}={}){
  const candidate={
    engine:'v2',hp:record?.score?.home,ap:record?.score?.away,winner:(record?.score?.home>record?.score?.away?record?.home?.name:record?.away?.name),
    home:record?.home,away:record?.away,box:record?.teamStats,playerStats:record?.playerStats,scoreAdjustment:record?.scoreAdjustment
  };
  const base=validateCandidate(candidate,{homeRoster,awayRoster}),errors=[...base.errors];
  if(record?.final!==true)errors.push('archive candidate is not final');
  if(record?.detailed!==true)errors.push('archive candidate is not detailed');
  if(!Array.isArray(record?.injuries)||!Array.isArray(record?.drives))errors.push('archive arrays missing');
  return {ok:errors.length===0,errors};
}
function dryRunTransaction({candidate,homeTeam,awayTeam,homeGameplan=null,awayGameplan=null}={}){
  if(!homeTeam||!awayTeam)throw new Error('V2 dry run requires both teams.');
  const original=JSON.stringify({home:homeTeam,away:awayTeam});
  const homeBefore=clone(homeTeam),awayBefore=clone(awayTeam),homeClone=clone(homeTeam),awayClone=clone(awayTeam);
  const candidateCheck=validateCandidate(candidate,{homeRoster:homeClone.roster,awayRoster:awayClone.roster});
  if(!candidateCheck.ok)throw new Error(`V2 candidate dry-run validation failed: ${candidateCheck.errors.join('; ')}`);
  const applied=applyToClone(candidate,homeClone,awayClone);
  const archive=buildArchiveCandidate(candidate,{homeBefore,awayBefore,homeGameplan,awayGameplan});
  const archiveCheck=validateArchiveCandidate(archive,{homeRoster:homeClone.roster,awayRoster:awayClone.roster});
  if(!archiveCheck.ok)throw new Error(`V2 archive dry-run validation failed: ${archiveCheck.errors.join('; ')}`);
  if(JSON.stringify({home:homeTeam,away:awayTeam})!==original)throw new Error('V2 transaction dry run mutated source teams.');
  const expectedHomeW=finite(homeBefore.w)+(candidate.winner===homeBefore.name?1:0),expectedHomeL=finite(homeBefore.l)+(candidate.winner===homeBefore.name?0:1);
  const expectedAwayW=finite(awayBefore.w)+(candidate.winner===awayBefore.name?1:0),expectedAwayL=finite(awayBefore.l)+(candidate.winner===awayBefore.name?0:1);
  if(homeClone.w!==expectedHomeW||homeClone.l!==expectedHomeL||awayClone.w!==expectedAwayW||awayClone.l!==expectedAwayL)throw new Error('V2 dry-run record mutation is inconsistent with winner.');
  return {ok:true,candidate:clone(candidate),archive,applied:{winner:applied.winner,homeRecord:`${homeClone.w}-${homeClone.l}`,awayRecord:`${awayClone.w}-${awayClone.l}`},homeClone,awayClone};
}

return {VERSION,STAT_KEYS:[...STAT_KEYS],BOX_KEYS:[...BOX_KEYS],normalizeBox,buildCandidate,validateCandidate,applyToClone,buildArchiveCandidate,validateArchiveCandidate,dryRunTransaction,scoreAdjustment};
});
