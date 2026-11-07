function makeWorldHistoryPresentationModel(){
 'use strict';
 const escNum=v=>Number.isFinite(Number(v))?Number(v):0;
 const number=v=>v==null||v===''||typeof v==='boolean'||!Number.isFinite(Number(v))?null:Number(v);
 const sameId=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
 const year=v=>Number.isInteger(number(v))&&number(v)>0?number(v):null;
 const matches=(row,id,name)=>row?.schoolId!=null&&id!=null?sameId(row.schoolId,id):row?.name===name;
 const recordText=(row,w,l)=>number(row?.[w])!=null&&number(row?.[l])!=null?number(row[w])+'-'+number(row[l]):'—';
 function seasonForTeam(entry,teamName,teamId=null){
  if(!entry||entry.type!=='season'||!teamName)return null;
  const record=(entry.records||[]).find(r=>matches(r,teamId,teamName))||null;
  const archivedName=record?.name||teamName;
  const rank=(entry.top10||[]).findIndex(t=>matches(t,teamId,archivedName));
  const awards=(entry.awards||[]).filter(a=>a.schoolId!=null&&teamId!=null?sameId(a.schoolId,teamId):a.team===archivedName).map(a=>({name:a.name,playerName:a.playerName,pos:a.pos||'',...(a.playerId!=null?{playerId:a.playerId}:{})}));
  const champion=entry.championId!=null&&teamId!=null?sameId(entry.championId,teamId):entry.champion===archivedName;
  if(!record&&!awards.length&&!champion)return null;
  return {year:escNum(entry.year),record:recordText(record,'w','l'),conferenceRecord:recordText(record,'cw','cl'),rank:rank>=0?rank+1:null,champion,awards};
 }
 function playerSeasons(p,raw,signingYear=0){
  const seen=new Set();
  return (p.seasonHistory||[]).filter(s=>{
   const y=year(s?.year),id=s?.schoolId??s?.teamId;
   if(!y||y<signingYear||(year(raw.year)&&y>raw.year)||seen.has(y))return false;
   if(id!=null?!sameId(id,raw.teamId):s.team!==raw.teamName)return false;
   seen.add(y);return true;
  }).map(s=>({year:Number(s.year),games:escNum(s.games??s.stats?.games),starts:escNum(s.starts??s.stats?.starts),rating:number(s.rating)})).sort((a,b)=>a.year-b.year).slice(-3);
 }
 function people(raw){
  const seen=new Set(),classes=new Map(),recurringPlayers=[];
  for(const entry of raw.players||[]){
   const p=entry?.p;
   if(p?.id==null||seen.has(String(p.id)))continue;
   seen.add(String(p.id));
   const identity={id:p.id,name:p.name||'Unnamed player',pos:p.pos||'',status:entry.status||'archived',schoolId:entry.schoolId??null,schoolName:entry.schoolName||''};
   const seasons=playerSeasons(p,raw);
   if(entry.status==='active'&&sameId(entry.schoolId,raw.teamId)&&seasons.length>=2)recurringPlayers.push({...identity,seasons});
   const memory=p.recruitingMemory,receipt=memory?.scoutingReceipt,signingYear=year(memory?.season??receipt?.season);
   if(!signingYear||(year(raw.year)&&signingYear>raw.year)||!sameId(memory?.schoolId??receipt?.schoolId,raw.teamId))continue;
   if(receipt?.schoolId!=null&&!sameId(receipt.schoolId,raw.teamId))continue;
   if(receipt?.season!=null&&year(receipt.season)!==signingYear)continue;
   if(!classes.has(signingYear))classes.set(signingYear,[]);
   classes.get(signingYear).push({...identity,stars:number(receipt?.stars??memory?.stars),signingRead:number(receipt?.currentRead),seasons:playerSeasons(p,raw,signingYear)});
  }
  const order=(a,b)=>b.seasons.length-a.seasons.length||b.seasons.reduce((n,s)=>n+s.games,0)-a.seasons.reduce((n,s)=>n+s.games,0)||a.name.localeCompare(b.name)||String(a.id).localeCompare(String(b.id));
  return{classes:[...classes].sort((a,b)=>b[0]-a[0]).slice(0,4).map(([year,players])=>({year,retained:players.length,players:players.sort(order).slice(0,3)})),recurringPlayers:recurringPlayers.sort(order).slice(0,4)};
 }
 function rivalry(raw){
  const rival=raw.rival;if(rival?.id==null)return null;
  const seen=new Set(),meetings=[];
  const sideMatches=(side,id,name)=>side?.id!=null?sameId(side.id,id):side?.name===name;
  for(const g of raw.games||[]){
   const y=year(g?.season);
   if(g?.id==null||seen.has(String(g.id))||!g.final||!y||(year(raw.year)&&y>raw.year))continue;
   if(y===year(raw.year)&&raw.phase==='regular'&&number(g.week)>escNum(raw.week))continue;
   const home=sideMatches(g.home,raw.teamId,raw.teamName)&&sideMatches(g.away,rival.id,rival.name),away=sideMatches(g.away,raw.teamId,raw.teamName)&&sideMatches(g.home,rival.id,rival.name);
   if(!home&&!away)continue;
   const us=number(g.score?.[home?'home':'away']),them=number(g.score?.[home?'away':'home']);
   if(us==null||them==null||us<0||them<0)continue;
   seen.add(String(g.id));
   meetings.push({id:g.id,year:y,week:number(g.week),label:g.label||'Recorded game',venue:g.venue==='Neutral site'?'neutral':home?'home':'away',us,them,result:us===them?'T':us>them?'W':'L'});
  }
  const series=raw.rivalry?.series;
  return{teamId:rival.id,teamName:rival.name||'Rival',trophy:raw.rivalry?.trophy||null,series:series&&number(series.w)!=null&&number(series.l)!=null?{wins:number(series.w),losses:number(series.l)}:null,meetings:meetings.sort((a,b)=>b.year-a.year||(b.week||0)-(a.week||0)).slice(0,6)};
 }
 function snapshot(raw={}){
  const tracked=raw.tracked||{};
  const seasons=(raw.history||[]).filter(h=>year(h?.year)&&(!year(raw.year)||h.year<=raw.year)).map(h=>seasonForTeam(h,raw.teamName,raw.teamId)).filter(Boolean).sort((a,b)=>b.year-a.year);
  const titleYears=seasons.filter(s=>s.champion).map(s=>s.year);
  const awardRows=seasons.flatMap(s=>s.awards.map(a=>({...a,year:s.year}))).slice(0,8);
  return {
   teamId:escNum(raw.teamId)||null,
   teamName:raw.teamName||'Program',
   conference:raw.conference||'—',
   tracked:{wins:escNum(tracked.w),losses:escNum(tracked.l),seasons:escNum(tracked.seasons),conferenceTitles:escNum(tracked.confTitles),nationalTitles:escNum(tracked.natTitles)},
   titleYears,
   awardRows,
   seasons:seasons.slice(0,6),
   ...people(raw),
   rivalry:rivalry(raw),
   archives:{playersDeferred:!!raw.playersDeferred,gamesDeferred:!!raw.gamesDeferred}
  };
 }
 return {seasonForTeam,snapshot};
}
if(typeof module==='object'&&module.exports){module.exports={makeWorldHistoryPresentationModel};}
else{
 const worldHistoryPresentationModel=makeWorldHistoryPresentationModel();
 globalThis.DynastyLabWorldHistoryPresentation={snapshot:()=>{
  if(!universe?.teams)return null;const t=selected?.();if(!t)return null;
  const players=[];
  for(const team of universe.teams)for(const p of team.roster||[])if(team.id===t.id||String(p.recruitingMemory?.schoolId??p.recruitingMemory?.scoutingReceipt?.schoolId)===String(t.id))players.push({p,schoolId:team.id,schoolName:team.name,status:'active'});
  for(const entry of universe.transferPortal||[])if(entry.p)players.push({p:entry.p,schoolName:'Transfer portal',status:'portal'});
  for(const p of universe.playerArchive||[])if(String(p.recruitingMemory?.schoolId??p.recruitingMemory?.scoutingReceipt?.schoolId)===String(t.id))players.push({p,schoolName:p.lastTeam||'',status:'archived'});
  return worldHistoryPresentationModel.snapshot({teamId:t.id,teamName:t.name,conference:t.conference,year:universe.year,week:universe.week,phase:universe.phase,tracked:t.allTimeRecord||{},history:universe.history||[],players,rival:universe.teams.find(team=>String(team.id)===String(t.rivalry?.rivalId))||null,rivalry:t.rivalry,games:universe.gameArchive||[],playersDeferred:typeof archiveIsDeferred==='function'&&archiveIsDeferred(),gamesDeferred:typeof gamesAreDeferred==='function'&&gamesAreDeferred()});
 },note:'Read-only recorded seasons, signing receipts, player season histories, rivalry box scores and tracked program totals. Deferred archives are not loaded by this view.'};
}
