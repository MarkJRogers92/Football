function makeWorldHistoryPresentationModel(){
 'use strict';
 const escNum=v=>Number.isFinite(Number(v))?Number(v):0;
 function seasonForTeam(entry,teamName){
  if(!entry||entry.type!=='season'||!teamName)return null;
  const record=(entry.records||[]).find(r=>r.name===teamName)||null;
  const rank=(entry.top10||[]).findIndex(t=>t.name===teamName);
  const awards=(entry.awards||[]).filter(a=>a.team===teamName).map(a=>({name:a.name,playerName:a.playerName,pos:a.pos||''}));
  if(!record&&!awards.length&&entry.champion!==teamName)return null;
  return {year:escNum(entry.year),record:record?escNum(record.w)+'-'+escNum(record.l):'—',conferenceRecord:record?escNum(record.cw)+'-'+escNum(record.cl):'—',rank:rank>=0?rank+1:null,champion:entry.champion===teamName,awards};
 }
 function snapshot(raw={}){
  const tracked=raw.tracked||{};
  const seasons=(raw.history||[]).map(h=>seasonForTeam(h,raw.teamName)).filter(Boolean).sort((a,b)=>b.year-a.year);
  const titleYears=seasons.filter(s=>s.champion).map(s=>s.year);
  const awardRows=seasons.flatMap(s=>s.awards.map(a=>({...a,year:s.year}))).slice(0,8);
  return {
   teamId:escNum(raw.teamId)||null,
   teamName:raw.teamName||'Program',
   conference:raw.conference||'—',
   tracked:{wins:escNum(tracked.w),losses:escNum(tracked.l),seasons:escNum(tracked.seasons),conferenceTitles:escNum(tracked.confTitles),nationalTitles:escNum(tracked.natTitles)},
   titleYears,
   awardRows,
   seasons:seasons.slice(0,6)
  };
 }
 return {seasonForTeam,snapshot};
}
if(typeof module==='object'&&module.exports){module.exports={makeWorldHistoryPresentationModel};}
else{
 const worldHistoryPresentationModel=makeWorldHistoryPresentationModel();
 globalThis.DynastyLabWorldHistoryPresentation={snapshot:()=>{if(!universe?.teams)return null;const t=selected?.();if(!t)return null;return worldHistoryPresentationModel.snapshot({teamId:t.id,teamName:t.name,conference:t.conference,tracked:t.allTimeRecord||{},history:universe.history||[]})},note:'World/history presentation uses only archived season records, awards, championships and the existing tracked all-time record.'};
}
