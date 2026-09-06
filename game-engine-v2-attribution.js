(function(root,factory){
  const rngApi=(typeof module==='object'&&module.exports)?require('./rng.js'):root.DynastyRng;
  const api=factory(rngApi);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2Attribution=api;
})(typeof window==='object'?window:globalThis,function(DynastyRng){
'use strict';
if(!DynastyRng)throw new Error('Game Engine 2 attribution requires DynastyRng.');

const VERSION=1;
const other=side=>side==='home'?'away':'home';
const statKeys=[
  'games','starts','snaps','passAtt','passComp','passYds','passTD','int','sacksTaken',
  'rushAtt','rushYds','rushTD','fumbles','targets','receptions','recYds','recTD','drops','yac',
  'tackles','tfl','sacks','pressures','intDef','passBreakups','forcedFumbles',
  'sacksAllowed','pressuresAllowed','penalties','fgMade','fgAtt','punts','puntYds'
];

function blankStats(){
  const out={};
  for(const k of statKeys)out[k]=0;
  return out;
}
function blankTeam(points=0){
  return {
    points,plays:0,firstDowns:0,
    passAtt:0,passComp:0,passYds:0,passTD:0,int:0,sacksTaken:0,
    rushAtt:0,rushYds:0,rushTD:0,fumblesLost:0,turnovers:0,
    recYds:0,recTD:0,fgMade:0,fgAtt:0,punts:0,puntYds:0
  };
}
function playerRef(p){
  if(!p)return null;
  const base=Number(p.trueNow)||70;
  return {
    id:p.id,name:String(p.name||'Player'),pos:String(p.pos||''),
    speed:Number(p.speed)||base,power:Number(p.power)||base,technique:Number(p.technique)||base,
    iq:Number(p.iq)||base,composure:Number(p.composure)||base,trueNow:base
  };
}
function normalizeList(list){
  return (list||[])
    .map(x=>({player:playerRef(x.player||x.p||x),weight:Math.max(.001,Number(x.weight)||1)}))
    .filter(x=>x.player&&x.player.id!=null);
}
function normalizeContext(ctx={}){
  return {
    qb:playerRef(ctx.qb),
    rushers:normalizeList(ctx.rushers),
    receivers:normalizeList(ctx.receivers),
    defenders:normalizeList(ctx.defenders),
    offensiveLine:normalizeList(ctx.offensiveLine),
    kicker:playerRef(ctx.kicker),
    punter:playerRef(ctx.punter),
    teamName:String(ctx.teamName||'Team')
  };
}
function ensureLine(lines,p){
  if(!p)return null;
  let line=lines.get(p.id);
  if(!line){
    line={id:p.id,name:p.name,pos:p.pos,stats:blankStats()};
    lines.set(p.id,line);
  }
  return line;
}
function weightedPick(list,rng,kind='base'){
  const filtered=(list||[]).filter(x=>x?.player);
  if(!filtered.length)return null;
  const skill=p=>{
    if(kind==='rush')return p.technique*.45+p.speed*.35+p.power*.20;
    if(kind==='takeaway')return p.iq*.40+p.technique*.35+p.speed*.25;
    if(kind==='tackle')return p.iq*.50+p.technique*.50;
    if(kind==='coverage')return p.technique*.50+p.speed*.30+p.iq*.20;
    if(kind==='receive')return p.technique*.45+p.speed*.30+p.iq*.15+p.composure*.10;
    if(kind==='carry')return p.speed*.35+p.power*.35+p.iq*.15+p.composure*.15;
    if(kind==='protect')return Math.max(10,110-p.technique);
    return 100;
  };
  const weights=filtered.map(x=>Math.max(.001,x.weight*Math.max(1,skill(x.player))));
  const total=weights.reduce((a,b)=>a+b,0);
  let roll=rng.next()*total;
  for(let i=0;i<filtered.length;i++){
    roll-=weights[i];
    if(roll<=0)return filtered[i].player;
  }
  return filtered.at(-1).player;
}
function addTackle(result,defSide,evt,rng,{sack=false}={}){
  const ctx=result.contexts[defSide];
  const p=weightedPick(ctx.defenders,rng,sack?'rush':'tackle');
  if(!p)return null;
  const line=ensureLine(result.lines[defSide],p);
  line.stats.tackles++;
  if(sack){
    line.stats.sacks++;
    line.stats.tfl++;
    line.stats.pressures++;
  }else if((Number(evt.yards)||0)<0){
    line.stats.tfl++;
  }
  return p;
}
function addProtectionBlame(result,offSide,rng){
  const p=weightedPick(result.contexts[offSide].offensiveLine,rng,'protect');
  if(!p)return;
  const line=ensureLine(result.lines[offSide],p);
  line.stats.sacksAllowed++;
  line.stats.pressuresAllowed++;
}
function addSnapToLine(result,offSide){
  for(const x of result.contexts[offSide].offensiveLine){
    ensureLine(result.lines[offSide],x.player).stats.snaps++;
  }
}
function eventIsSnap(e){
  return e.type==='scrimmage'||e.type==='interception'||e.type==='fumble';
}
function completedPass(result,side,def,e,rng,team,qb,q,target){
  const yards=Number(e.yards)||0;
  team.passComp++;
  team.passYds+=yards;
  team.recYds+=yards;
  q.stats.passComp++;
  q.stats.passYds+=yards;
  const r=ensureLine(result.lines[side],target);
  r.stats.receptions++;
  r.stats.recYds+=yards;
  r.stats.yac+=Math.max(0,Math.round(yards*.34));
  result.lastPlay[side]={type:'pass',qb,receiver:target};
  if(e.state?.fieldPosition<100)addTackle(result,def,e,rng);
}
function incompletePass(result,side,def,e,rng,qb,target){
  result.lastPlay[side]={type:'pass',qb,receiver:target};
  if(rng.next()<.10)ensureLine(result.lines[side],target).stats.drops++;
  if(rng.next()<.32){
    const p=weightedPick(result.contexts[def].defenders,rng,'coverage');
    if(p)ensureLine(result.lines[def],p).stats.passBreakups++;
  }
}
function attributeScrimmage(result,e,rng,side,def,team,ctx){
  const yards=Number(e.yards)||0;
  const kind=e.kind==='pass'?'pass':'rush';
  const from=e.from||{};
  if(Number.isFinite(from.distance)&&yards>=from.distance&&e.state?.fieldPosition<100)team.firstDowns++;

  if(kind==='pass'){
    const qb=ctx.qb||weightedPick(ctx.rushers,rng,'carry');
    if(!qb)throw new Error(`${side} has no quarterback attribution candidate.`);
    const q=ensureLine(result.lines[side],qb);

    if(e.sack){
      q.stats.sacksTaken++;
      q.stats.rushAtt++;
      q.stats.rushYds+=yards;
      team.sacksTaken++;
      team.rushAtt++;
      team.rushYds+=yards;
      addTackle(result,def,e,rng,{sack:true});
      addProtectionBlame(result,side,rng);
      result.lastPlay[side]={type:'sack',rusher:qb,qb};
      return;
    }

    team.passAtt++;
    q.stats.passAtt++;
    const target=weightedPick(ctx.receivers,rng,'receive');
    if(!target)throw new Error(`${side} has no receiving attribution candidate.`);
    ensureLine(result.lines[side],target).stats.targets++;

    if(e.completed)completedPass(result,side,def,e,rng,team,qb,q,target);
    else incompletePass(result,side,def,e,rng,qb,target);
    return;
  }

  const runner=weightedPick(ctx.rushers,rng,'carry')||ctx.qb;
  if(!runner)throw new Error(`${side} has no rushing attribution candidate.`);
  const r=ensureLine(result.lines[side],runner);
  r.stats.rushAtt++;
  r.stats.rushYds+=yards;
  team.rushAtt++;
  team.rushYds+=yards;
  result.lastPlay[side]={type:'rush',rusher:runner};
  if(e.state?.fieldPosition<100)addTackle(result,def,e,rng);
}
function attributeInterception(result,e,rng,side,def,team,ctx){
  const qb=ctx.qb||weightedPick(ctx.rushers,rng,'carry');
  if(!qb)throw new Error(`${side} has no quarterback attribution candidate.`);
  const q=ensureLine(result.lines[side],qb);
  q.stats.passAtt++;
  q.stats.int++;
  team.passAtt++;
  team.int++;
  team.turnovers++;

  const target=weightedPick(ctx.receivers,rng,'receive');
  if(!target)throw new Error(`${side} has no receiving attribution candidate.`);
  ensureLine(result.lines[side],target).stats.targets++;

  const dbs=result.contexts[def].defenders.filter(x=>['CB','S','LB'].includes(x.player.pos));
  const thief=weightedPick(dbs,rng,'takeaway')||weightedPick(result.contexts[def].defenders,rng,'takeaway');
  if(thief)ensureLine(result.lines[def],thief).stats.intDef++;
  result.lastPlay[side]={type:'interception',qb,receiver:target};
}
function attributeFumble(result,e,rng,side,def,team,ctx){
  const yards=Number(e.yards)||0;
  const isPass=e.kind==='pass';
  const runner=isPass?(ctx.qb||weightedPick(ctx.rushers,rng,'carry')):(weightedPick(ctx.rushers,rng,'carry')||ctx.qb);
  if(!runner)throw new Error(`${side} has no fumble attribution candidate.`);
  const r=ensureLine(result.lines[side],runner);
  r.stats.fumbles++;
  r.stats.rushAtt++;
  r.stats.rushYds+=yards;
  team.rushAtt++;
  team.rushYds+=yards;
  team.fumblesLost++;
  team.turnovers++;
  if(isPass&&e.sack){
    r.stats.sacksTaken++;
    team.sacksTaken++;
    addProtectionBlame(result,side,rng);
  }
  const tackler=addTackle(result,def,e,rng,{sack:!!e.sack});
  if(tackler)ensureLine(result.lines[def],tackler).stats.forcedFumbles++;
  result.lastPlay[side]={type:'fumble',rusher:runner,qb:isPass?runner:null};
}
function attributeTouchdown(result,side,team){
  const last=result.lastPlay[side];
  if(last?.type==='pass'&&last.receiver){
    ensureLine(result.lines[side],last.qb).stats.passTD++;
    ensureLine(result.lines[side],last.receiver).stats.recTD++;
    team.passTD++;
    team.recTD++;
    return;
  }
  if(last?.rusher){
    ensureLine(result.lines[side],last.rusher).stats.rushTD++;
    team.rushTD++;
  }
}
function attributeGame(state,contexts={}){
  if(!state||state.engine!=='v2'||!Array.isArray(state.events)){
    throw new Error('Attribution requires a Game Engine 2 state.');
  }
  const result={
    version:VERSION,
    stateSeed:String(state.seed||state.gameId||'v2'),
    contexts:{home:normalizeContext(contexts.home),away:normalizeContext(contexts.away)},
    teamStats:{home:blankTeam(state.score?.home||0),away:blankTeam(state.score?.away||0)},
    lines:{home:new Map(),away:new Map()},
    lastPlay:{home:null,away:null}
  };
  const rng=DynastyRng.create(`${result.stateSeed}:attribution:v${VERSION}`);

  for(const side of ['home','away']){
    const c=result.contexts[side];
    for(const p of [c.qb,c.kicker,c.punter])if(p)ensureLine(result.lines[side],p);
    for(const list of [c.rushers,c.receivers,c.defenders,c.offensiveLine]){
      for(const x of list)ensureLine(result.lines[side],x.player);
    }
  }

  for(const e of state.events){
    const side=e.team;
    if(side!=='home'&&side!=='away')continue;
    const def=other(side);
    const team=result.teamStats[side];
    const ctx=result.contexts[side];

    if(eventIsSnap(e)){
      team.plays++;
      addSnapToLine(result,side);
    }

    if(e.type==='scrimmage'){
      attributeScrimmage(result,e,rng,side,def,team,ctx);
    }else if(e.type==='interception'){
      attributeInterception(result,e,rng,side,def,team,ctx);
    }else if(e.type==='fumble'){
      attributeFumble(result,e,rng,side,def,team,ctx);
    }else if(e.type==='touchdown'){
      attributeTouchdown(result,side,team);
    }else if(e.type==='field_goal'){
      team.fgAtt++;
      if(e.made)team.fgMade++;
      if(ctx.kicker){
        const k=ensureLine(result.lines[side],ctx.kicker);
        k.stats.fgAtt++;
        if(e.made)k.stats.fgMade++;
      }
    }else if(e.type==='punt'){
      team.punts++;
      team.puntYds+=Number(e.net)||0;
      if(ctx.punter){
        const p=ensureLine(result.lines[side],ctx.punter);
        p.stats.punts++;
        p.stats.puntYds+=Number(e.net)||0;
      }
    }
  }

  result.playerStats={
    home:[...result.lines.home.values()].filter(x=>statKeys.some(k=>x.stats[k])),
    away:[...result.lines.away.values()].filter(x=>statKeys.some(k=>x.stats[k]))
  };
  result.reconciliation=reconcile(result);
  if(!result.reconciliation.ok){
    throw new Error(`V2 player attribution reconciliation failed: ${result.reconciliation.errors.join('; ')}`);
  }
  delete result.lines;
  delete result.lastPlay;
  return result;
}
function sum(lines,key){
  return (lines||[]).reduce((n,x)=>n+(Number(x.stats?.[key])||0),0);
}
function reconcile(result){
  const errors=[];
  for(const side of ['home','away']){
    const t=result.teamStats[side];
    const p=result.playerStats?.[side]||[];
    const opp=result.playerStats?.[other(side)]||[];
    const checks=[
      ['passAtt',sum(p,'passAtt'),t.passAtt],
      ['passComp',sum(p,'passComp'),t.passComp],
      ['passYds',sum(p,'passYds'),t.passYds],
      ['passTD',sum(p,'passTD'),t.passTD],
      ['int',sum(p,'int'),t.int],
      ['sacksTaken',sum(p,'sacksTaken'),t.sacksTaken],
      ['rushAtt',sum(p,'rushAtt'),t.rushAtt],
      ['rushYds',sum(p,'rushYds'),t.rushYds],
      ['rushTD',sum(p,'rushTD'),t.rushTD],
      ['receptions',sum(p,'receptions'),t.passComp],
      ['recYds',sum(p,'recYds'),t.passYds],
      ['recTD',sum(p,'recTD'),t.passTD],
      ['targets',sum(p,'targets'),t.passAtt],
      ['fgMade',sum(p,'fgMade'),t.fgMade],
      ['fgAtt',sum(p,'fgAtt'),t.fgAtt],
      ['punts',sum(p,'punts'),t.punts],
      ['puntYds',sum(p,'puntYds'),t.puntYds],
      ['defINT',sum(opp,'intDef'),t.int],
      ['defSacks',sum(opp,'sacks'),t.sacksTaken],
      ['defFF',sum(opp,'forcedFumbles'),t.fumblesLost]
    ];
    for(const [label,a,b] of checks){
      if(a!==b)errors.push(`${side} ${label} ${a} != ${b}`);
    }
    if(t.passComp>t.passAtt)errors.push(`${side} completions exceed attempts`);
    if(t.turnovers!==t.int+t.fumblesLost)errors.push(`${side} turnover components do not reconcile`);
    if(t.plays!==t.passAtt+t.rushAtt)errors.push(`${side} plays ${t.plays} != passAtt+rushAtt ${t.passAtt+t.rushAtt}`);
    const eventYards=result.eventSummary?.[side]?.yards;
    if(Number.isFinite(eventYards)&&t.passYds+t.rushYds!==eventYards){
      errors.push(`${side} attributed yards ${t.passYds+t.rushYds} != event yards ${eventYards}`);
    }
  }
  return {ok:errors.length===0,errors};
}
function attachEventSummary(result,summary){
  result.eventSummary=summary;
  result.reconciliation=reconcile(result);
  if(!result.reconciliation.ok){
    throw new Error(`V2 player attribution/event reconciliation failed: ${result.reconciliation.errors.join('; ')}`);
  }
  return result;
}
function leaders(result,side){
  const rows=result?.playerStats?.[side]||[];
  const pick=(score,filter=()=>true)=>rows.filter(filter).slice().sort((a,b)=>score(b)-score(a))[0]||null;
  return {
    passer:pick(x=>x.stats.passYds,x=>x.stats.passAtt),
    rusher:pick(x=>x.stats.rushYds,x=>x.stats.rushAtt),
    receiver:pick(x=>x.stats.recYds,x=>x.stats.targets),
    defender:pick(x=>x.stats.tackles+x.stats.sacks*5+x.stats.intDef*6,x=>x.stats.tackles||x.stats.sacks||x.stats.intDef),
    kicker:pick(x=>x.stats.fgMade,x=>x.stats.fgAtt)
  };
}

return {VERSION,blankStats,blankTeam,normalizeContext,attributeGame,reconcile,attachEventSummary,leaders};
});
