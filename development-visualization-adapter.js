function makeDevelopmentVisualizationModel(){
 'use strict';
 const phaseRank=x=>String(x||'').toLowerCase()==='fall'?2:String(x||'').toLowerCase()==='spring'?1:0;
 const signed=n=>`${n>0?'+':''}${n}`;
 function history(player){
  return (player?.campHistory||[]).filter(x=>Number.isFinite(Number(x?.delta))).map(x=>({year:Number(x.year)||0,phase:String(x.phase||''),delta:Number(x.delta)||0,grade:x.grade||null,focus:x.focus||null,teamFocus:x.teamFocus||null,weightDelta:Number(x.weightDelta)||0,attr:{...(x.attr||{})}})).sort((a,b)=>a.year-b.year||phaseRank(a.phase)-phaseRank(b.phase));
 }
 function latestCycle(players=[]){
  const all=[];for(const p of players)for(const row of history(p))all.push({p,row});
  if(!all.length)return{year:null,phase:null,rows:[]};
  all.sort((a,b)=>b.row.year-a.row.year||phaseRank(b.row.phase)-phaseRank(a.row.phase));
  const year=all[0].row.year,phase=all[0].row.phase;
  return{year,phase,rows:all.filter(x=>x.row.year===year&&x.row.phase===phase).map(({p,row})=>({id:p.id,name:p.name,pos:p.pos,delta:row.delta,grade:row.grade,focus:row.focus,teamFocus:row.teamFocus,weightDelta:row.weightDelta,attr:{...row.attr}}))};
 }
 function groups(rows=[]){
  const map={};for(const x of rows){const g=map[x.pos]??={pos:x.pos,players:0,total:0,improved:0,stalled:0,declined:0};g.players++;g.total+=x.delta;if(x.delta>1)g.improved++;else if(x.delta<0)g.declined++;else g.stalled++}
  return Object.values(map).map(g=>({...g,average:Math.round(g.total/g.players*10)/10})).sort((a,b)=>b.average-a.average||a.pos.localeCompare(b.pos));
 }
 function team(players=[]){
  const cycle=latestCycle(players),rows=cycle.rows,average=rows.length?Math.round(rows.reduce((n,x)=>n+x.delta,0)/rows.length*10)/10:0;
  const risers=rows.filter(x=>x.delta>0).sort((a,b)=>b.delta-a.delta||a.name.localeCompare(b.name)).slice(0,6),stalled=rows.filter(x=>x.delta>=0&&x.delta<=1).sort((a,b)=>a.delta-b.delta||a.name.localeCompare(b.name)).slice(0,6),declined=rows.filter(x=>x.delta<0).sort((a,b)=>a.delta-b.delta||a.name.localeCompare(b.name)).slice(0,6);
  return{cycle,average,improved:rows.filter(x=>x.delta>0).length,stalled:stalled.length,declined:rows.filter(x=>x.delta<0).length,risers,stalledPlayers:stalled,declinedPlayers:declined,groups:groups(rows)};
 }
 function player(player,tendency=null){
  if(!player)return null;const rows=history(player);let cumulative=0;const series=rows.map(x=>{cumulative+=x.delta;return{label:`${x.year} ${x.phase}`,year:x.year,phase:x.phase,delta:x.delta,value:cumulative,grade:x.grade}}),latest=rows.at(-1)||null,total=rows.reduce((n,x)=>n+x.delta,0),attrs=latest?Object.entries(latest.attr||{}).filter(([,v])=>Number(v)!==0).map(([key,value])=>({key,value:Number(value)||0})).sort((a,b)=>Math.abs(b.value)-Math.abs(a.value)):[];
  return{id:player.id,name:player.name,pos:player.pos,currentRead:Number.isFinite(Number(player.perceived))?Math.round(Number(player.perceived)):null,confidence:Number.isFinite(Number(player.scoutConfidence))?Math.round(Number(player.scoutConfidence)):null,trainingFocus:player.trainingFocus||null,history:rows,series,totalDelta:total,latest,attributes:attrs,tendency:tendency||null,summary:rows.length?`${rows.length} observed camp result${rows.length===1?'':'s'} · ${signed(total)} cumulative camp movement`:'No observed camp results yet.'};
 }
 return{history,latestCycle,groups,team,player};
}

if(typeof module==='object'&&module.exports){module.exports={makeDevelopmentVisualizationModel};}
else{
 const developmentVisualizationModel=makeDevelopmentVisualizationModel();
 function developmentVisualizationPlayer(p){const tendency=(typeof developmentTendencySystem==='object'&&developmentTendencySystem?.clue)?developmentTendencySystem.clue(p):null;return developmentVisualizationModel.player(p,tendency)}
 globalThis.DynastyLabDevelopmentView={
  snapshot:()=>{const t=selected?.();if(!t)return null;const players=(t.roster||[]).map(p=>{const x=developmentVisualizationPlayer(p);return{id:x.id,name:x.name,pos:x.pos,currentRead:x.currentRead,confidence:x.confidence,historyCount:x.history.length,totalDelta:x.totalDelta,tendency:x.tendency}});return{team:{id:t.id,name:t.name,development:t.development},year:universe?.year,phase:universe?.phase,summary:developmentVisualizationModel.team(t.roster||[]),players};},
  player:id=>{const t=selected?.(),p=t?.roster?.find(x=>String(x.id)===String(id));return developmentVisualizationPlayer(p)},
  note:'Read-only observed development presentation. Hidden development curves, true talent and private growth state are not exposed.'
 };
}
