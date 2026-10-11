(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.DynastyPlayerEvidenceModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const finite=x=>typeof x==='number'&&Number.isFinite(x),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const GROUPS=[
  {key:'QB',label:'Quarterbacks',positions:['QB'],metrics:[['Completion rate','passComp','passAtt','%'],['Passing yards / attempt','passYds','passAtt','yd'],['Rushing yards / carry','rushYds','rushAtt','yd']]},
  {key:'RB',label:'Running backs',positions:['RB'],metrics:[['Rushing yards / carry','rushYds','rushAtt','yd'],['Catch rate','receptions','targets','%']]},
  {key:'RECEIVER',label:'Receivers',positions:['WR','TE'],metrics:[['Catch rate','receptions','targets','%'],['Receiving yards / catch','recYds','receptions','yd']]},
  {key:'OL',label:'Offensive line',positions:['OT','OG','C'],metrics:[['Snaps / player-game','snaps','games','snaps'],['Sacks allowed / 100 snaps','sacksAllowed','snaps','per100']]},
  {key:'DEFENSE',label:'Defense',positions:['EDGE','DT','LB','CB','S'],metrics:[['Tackles / player-game','tackles','games','pergame'],['Sacks / player-game','sacks','games','pergame'],['Pass breakups / player-game','passBreakups','games','pergame']]},
  {key:'K',label:'Kickers',positions:['K'],metrics:[['Field-goal rate','fgMade','fgAtt','%']]},
  {key:'P',label:'Punters',positions:['P'],metrics:[['Punt yards / kick','puntYds','punts','yd']]}
 ];
 function validRange(r){return r&&typeof r==='object'&&finite(r.low)&&finite(r.high)&&finite(r.confidence)}
 function phaseKey(snapshot){if(!snapshot)return null;if(snapshot.phase==='MAJOR_REVISION'&&snapshot.source==='CAMP')return'Spring';if(snapshot.phase==='FIRST_FALL_CAMP')return'Fall';if(snapshot.phase==='SPRING_CAMP')return'Spring';if(snapshot.phase==='FALL_CAMP')return'Fall';return null}
 function scoutingMovement(history=[],campHistory=[]){
  const rows=Array.isArray(history)?history:[],camps=Array.isArray(campHistory)?campHistory:[];return rows.map((current,index)=>{
   const prior=index>0?rows[index-1]:null,domainChanges=[];let estimateDelta=null,confidenceDelta=null;
   if(current&&typeof current==='object'&&prior&&typeof prior==='object'){if(finite(current.currentEstimate)&&finite(prior.currentEstimate))estimateDelta=current.currentEstimate-prior.currentEstimate;if(finite(current.confidence)&&finite(prior.confidence))confidenceDelta=current.confidence-prior.confidence;for(const key of new Set([...Object.keys(prior.domains||{}),...Object.keys(current.domains||{})])){const a=prior.domains?.[key],b=current.domains?.[key];if(validRange(a)&&validRange(b))domainChanges.push({key,lowDelta:b.low-a.low,highDelta:b.high-a.high,confidenceDelta:b.confidence-a.confidence})}}
   const phase=phaseKey(current),camp=phase?camps.find(x=>x?.year===current.season&&String(x.phase||'').toLowerCase()===phase.toLowerCase()):null,observed=camp&&finite(camp.delta)?{phase:camp.phase,year:camp.year,delta:camp.delta}:null;
   return{season:current?.season??null,week:current?.week??null,phase:current?.phase??null,source:current?.source??null,estimateDelta,confidenceDelta,domainChanges,observedCamp:observed,checkpointAvailable:!!(current&&finite(current.currentEstimate))}
  })
 }
 function staffPerspectives(position,domains,coaches=[]){
  if(!Array.isArray(domains)||!Array.isArray(coaches))return[];
  const keys=new Set(['QB','SKILL','OL','FRONT','SECONDARY']),rows=[];
  for(const c of coaches){if(!c||typeof c.name!=='string'||typeof c.role!=='string')continue;const evaluation=finite(c.evaluation)?clamp(c.evaluation,20,99):50,expertise=keys.has(c.expertiseGroup)&&c.expertiseGroup===c.positionGroup;
   const opinionDomains={};for(const d of domains){if(!d||typeof d.key!=='string'||!validRange(d))continue;const center=(d.low+d.high)/2,baseSpread=Math.max(1,(d.high-d.low)/2),factor=(1.35-((evaluation-20)/79)*.55)*(expertise?.78:1),spread=Math.max(1,Math.ceil(baseSpread*factor)),low=clamp(Math.floor(center-spread),20,99),high=clamp(Math.ceil(center+spread),20,99);opinionDomains[d.key]={low,high,confidence:clamp(Math.round(d.confidence+(evaluation-50)*.16+(expertise?4:0)),20,96)}}
   rows.push({coachId:typeof c.id==='string'?c.id:null,name:c.name,role:c.role,expertise,domains:opinionDomains})
  }return rows
 }
 function movementSummary(current,prior){if(!current||!prior||!finite(current.low)||!finite(current.high)||!finite(prior.low)||!finite(prior.high))return null;return{lowDelta:current.low-prior.low,highDelta:current.high-prior.high,prior:{low:prior.low,high:prior.high},current:{low:current.low,high:current.high}}}
 function metricRows(pos){const group=GROUPS.find(g=>g.positions.includes(pos));return group?.metrics||[]}
 function groupedStats(players=[]){const source=Array.isArray(players)?players:[];return GROUPS.map(group=>{
   const active=source.filter(p=>group.positions.includes(p?.pos)&&finite(p?.stats?.games)&&p.stats.games>0),playerGames=active.reduce((n,p)=>n+p.stats.games,0),metrics=group.metrics.map(([label,numerator,denominator,format])=>{
    let n=0,d=0,known=0,playersWithMetric=0;for(const p of active){const s=p.stats||{},hasD=Object.prototype.hasOwnProperty.call(s,denominator)&&finite(s[denominator]),hasN=Object.prototype.hasOwnProperty.call(s,numerator)&&finite(s[numerator]);if(hasD){known++;const den=s[denominator];if(den>0){d+=den;n+=hasN?s[numerator]:0;playersWithMetric++}}}
    const rate=d>0?n/d:null,status=known===0?'missing':known<active.length?'partial':d===0?'zero':'available';return{label,numerator,denominator,format,n,d,rate,status,knownPlayers:known,playersWithMetric}
   });return{key:group.key,label:group.label,positions:group.positions,playerCount:active.length,playerGames,metrics}
  })
 }
 function sumFields(rows,numerator,denominator){let n=0,d=0,complete=0,partial=0;for(const r of rows){const s=r.stats||{},hasD=Object.prototype.hasOwnProperty.call(s,denominator)&&finite(s[denominator]),hasN=Object.prototype.hasOwnProperty.call(s,numerator)&&finite(s[numerator]),elided=r.zeroElided===true;if(hasD&&s[denominator]>0){d+=s[denominator];n+=hasN?s[numerator]:0;complete++}else if(hasD||elided)complete++;else partial++}return{n,d,rate:d?n/d:null,complete,partial}}
 function statTrend(p,{currentYear=null,currentTeam=null,gameArchive=[]}={}){
  const history=Array.isArray(p?.seasonHistory)?p.seasonHistory:[],isArchived=finite(p?.retiredYear),finalYear=isArchived?p.retiredYear:currentYear,team=(isArchived?(p?.lastTeam||p?.currentSchoolName):currentTeam)||p?.lastTeam||p?.currentSchoolName||null,matchingFinal=history.some(s=>Number(s?.year)===Number(finalYear)&&(!team||s.team===team)),current=p?.stats&&finite(p.stats.games)&&p.stats.games>0&&!matchingFinal?{year:finalYear??null,team,pos:p.pos,stats:p.stats,current:!isArchived,finalized:isArchived}:null,rows=[];const seen=new Set();
  if(current){const key=`${current.year}|${current.team||''}`;seen.add(key);rows.push(current)}for(const s of history){if(!s||!finite(s.games??s.stats?.games)||Number(s.games??s.stats?.games)<=0)continue;const row={...s,stats:s.stats||s,zeroElided:true,current:false,finalized:true},key=`${row.year}|${row.team||''}`;if(seen.has(key))continue;seen.add(key);rows.push(row)}rows.sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0)||String(a.team||'').localeCompare(String(b.team||'')));
  const lines=[],eligibleRecords=new Set();for(const game of Array.isArray(gameArchive)?gameArchive:[]){if(!game||!Array.isArray(game.playerStats?.home)||!Array.isArray(game.playerStats?.away))continue;for(const side of ['home','away']){const line=game.playerStats[side].find(x=>String(x.id)===String(p?.id));if(line&&line.pos===p?.pos){lines.push({id:game.id,season:game.season,week:game.week,schoolId:game[side]?.id,stats:line.stats||{},zeroElided:true});eligibleRecords.add(game.id)}}}lines.sort((a,b)=>(Number(a.season)||0)-(Number(b.season)||0)||(Number(a.week)||0)-(Number(b.week)||0)||String(a.id).localeCompare(String(b.id)));
  const metricDefs=metricRows(p?.pos),metricFor=(entries,def)=>sumFields(entries,def[1],def[2]),recent=lines.slice(-3),prior=lines.slice(-6,-3),recentMetrics=metricDefs.map(d=>({label:d[0],numerator:d[1],denominator:d[2],format:d[3],recent:metricFor(recent,d),prior:metricFor(prior,d)}));
  return{seasons:rows.map(r=>({year:r.year,team:r.team||null,pos:r.current?(r.pos||p?.pos):(typeof r.pos==='string'?r.pos:null),games:Number(r.games??r.stats?.games)||0,stats:{...(r.stats||{})},zeroElided:!!r.zeroElided,status:r.current?(r.finalized?'Recorded final season':'Current season to date'): 'Archived season'})),gameLines:lines.length,retainedGames:eligibleRecords.size,coverage:`Retained career game lines for ${p?.pos||'this position'} across all schools; missing or compacted player rows are unavailable, not zero participation.`,recentComparison:lines.length>=4?{recentCount:recent.length,priorCount:prior.length,metrics:recentMetrics}:null}
 }
 function breakoutEvent(p,context={},score=0,line=''){
  if(!p||p.id==null||!['FR','SO'].includes(p.year)||!finite(p.stats?.games)||p.stats.games<2||!finite(score)||score<4)return null;
  const season=Number(context.season);if(!Number.isFinite(season))return null;const storyId=`breakout:${season}:${String(p.id)}`;
  return{id:`EVT_PLAYER_BREAKOUT_${season}_${String(p.id)}`,season,week:Number.isFinite(context.week)?context.week:null,type:'PLAYER_BREAKOUT',importance:62,schoolIds:context.schoolId==null?[]:[context.schoolId],playerIds:[p.id],coachIds:[],recruitIds:[],gameIds:context.gameId?[context.gameId]:[],storyId,summary:`${p.name||'Player'} recorded an early-career production breakout at ${context.schoolName||'his school'}: ${line||`${p.stats.games} appearances`}.`,metadata:{storyId,storyType:'BREAKOUT',name:String(p.name||'Player'),position:String(p.pos||''),eligibility:p.year,games:p.stats.games,productionScore:Math.round(score*100)/100,statLine:String(line||'')}}
 }
 return{GROUPS,scoutingMovement,staffPerspectives,movementSummary,groupedStats,statTrend,breakoutEvent};
});
