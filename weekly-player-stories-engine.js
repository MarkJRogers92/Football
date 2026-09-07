(function(root,factory){
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DynastyPlayerStories=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION=1;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function productionScore(p={}){const s=p.stats||{},pos=p.pos;
    if(pos==='QB')return (s.passYds||0)/150+(s.passTD||0)*1.8+(s.rushYds||0)/120+(s.rushTD||0)*1.4-(s.int||0)*.45;
    if(pos==='RB')return (s.rushYds||0)/70+(s.recYds||0)/100+((s.rushTD||0)+(s.recTD||0))*1.8;
    if(['WR','TE'].includes(pos))return (s.recYds||0)/75+(s.recTD||0)*1.8+(s.receptions||0)/18;
    if(['EDGE','DT','LB','CB','S'].includes(pos))return (s.tackles||0)/10+(s.tfl||0)*.45+(s.sacks||0)*2+(s.intDef||0)*3+(s.forcedFumbles||0)*2;
    if(['OT','OG','C'].includes(pos))return (s.starts||0)*.6+Math.max(0,(s.snaps||0)/120-(s.sacksAllowed||0)*.8);
    return (s.games||0)*.2
  }
  function statLine(p={}){const s=p.stats||{};
    if(p.pos==='QB')return`${s.passYds||0} pass yd · ${s.passTD||0} TD · ${s.int||0} INT`;
    if(p.pos==='RB')return`${s.rushYds||0} rush yd · ${s.rushTD||0} rush TD`;
    if(['WR','TE'].includes(p.pos))return`${s.receptions||0} rec · ${s.recYds||0} yd · ${s.recTD||0} TD`;
    if(['EDGE','DT','LB','CB','S'].includes(p.pos))return`${s.tackles||0} tackles · ${s.sacks||0} sacks · ${s.intDef||0} INT`;
    return`${s.starts||0} starts · ${s.games||0} games`
  }
  function buildPlayerStories(players=[],context={}){
    const limit=clamp(Number(context.limit)||5,1,6),byId=new Map(players.map(p=>[String(p.id),p])),rows=[],used=new Set();
    const add=(p,type,priority,title,summary,tone='')=>{if(!p||used.has(String(p.id)))return;used.add(String(p.id));rows.push({playerId:p.id,name:p.name,pos:p.pos,type,priority,title,summary,tone})};
    for(const p of [...players].sort((a,b)=>(b.injuryWeeks||0)-(a.injuryWeeks||0)||(a.health??100)-(b.health??100)))if((p.injuryWeeks||0)>0)add(p,'injury',100,`${p.name} — availability watch`,`${p.injuryWeeks} week${p.injuryWeeks===1?'':'s'} listed out · ${p.health??100}% health.`,'bad');
    for(const p of [...players].sort((a,b)=>(b.transferRisk||0)-(a.transferRisk||0)||(a.morale??70)-(b.morale??70)))if((p.transferRisk||0)>=55||(p.morale??70)<=48)add(p,'locker_room',92,`${p.name} — locker room watch`,`Morale ${p.morale??70} · transfer risk ${Math.round(p.transferRisk||0)}. The role relationship needs attention.`,'warn');
    const c=context.challenge;if(c){const p=byId.get(String(c.challengerId));add(p,'role_battle',86,`${c.pos} room — pressure building`,`${c.challengerName} is pushing ${c.starterName}. Staff leans ${c.recommendation==='promote'?'toward a change':c.recommendation==='split'?'toward a larger rotation':'toward holding the order'}.`,'warn')}
    for(const p of players)if(p.promiseLabel)add(p,'promise',80,`${p.name} — promise watch`,`${p.promiseLabel} is still active. Current role: ${p.role||'Development'}.`,'');
    const breakouts=players.filter(p=>['FR','SO'].includes(p.year)&&(p.stats?.games||0)>=2).map(p=>({p,score:productionScore(p)})).filter(x=>x.score>=4).sort((a,b)=>b.score-a.score);
    for(const x of breakouts)add(x.p,'breakout',72,`${x.p.name} — young production`,`${statLine(x.p)}. The early-career production is becoming meaningful.`,'good');
    const risers=players.filter(p=>['FR','SO'].includes(p.year)&&Number(p.upside||0)>=Number(p.grade||0)+6).sort((a,b)=>(b.upside-b.grade)-(a.upside-a.grade)||b.grade-a.grade);
    for(const p of risers)add(p,'emerging',58,`${p.name} — development watch`,`${p.year} ${p.pos} · current staff grade ${Math.round(p.grade||0)} · upside estimate ${Math.round(p.upside||0)}.`,'');
    const cornerstones=[...players].filter(p=>!p.redshirtActive).sort((a,b)=>(b.grade||0)-(a.grade||0));for(const p of cornerstones)add(p,'cornerstone',30,`${p.name} — program cornerstone`,`${p.pos} · ${p.year} · staff grade ${Math.round(p.grade||0)} · ${p.role||'rotation role'}.`,'');
    return rows.sort((a,b)=>b.priority-a.priority||String(a.name).localeCompare(String(b.name))).slice(0,limit)
  }
  return{VERSION,productionScore,statLine,buildPlayerStories}
});
