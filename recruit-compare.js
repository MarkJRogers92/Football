function makeRecruitCompareSystem(env){
 'use strict';
 const MAX=3;
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 function normalize(ids=[]){return [...new Set(ids.map(String))].slice(0,MAX)}
 function toggle(ids,id){
  const out=normalize(ids),key=String(id),at=out.indexOf(key);
  if(at>=0){out.splice(at,1);return{ok:true,ids:out,removed:true}}
  if(out.length>=MAX)return{ok:false,ids:out,reason:`Recruit Compare holds up to ${MAX} prospects.`};
  out.push(key);return{ok:true,ids:out,removed:false};
 }
 function summary(r,t){
  const v=env.staffVerdict(r,t),rec=env.scoutingRecord(r,t);
  return{id:String(r.id),name:r.name,pos:r.pos,verdict:v.label,score:v.score,conviction:v.conviction,confidence:v.confidence,strengths:v.strong||[],risk:v.risk||null,stage:rec.full?'Full evaluation':rec.quick?'Film reviewed':'Preliminary'};
 }
 // Scouted attribute ranges for one prospect, defensively parsed. The domain reader is
 // optional so the pure model still works when no scouting view is wired in.
 function domainRows(r,t){
  if(typeof env.domains!=='function')return[];
  const rows=env.domains(r,t);
  return (Array.isArray(rows)?rows:[]).filter(d=>d&&typeof d.key==='string'&&finite(d.low)&&finite(d.high));
 }
 // Compare the scouted ranges of the selected prospects. A prospect only outranks another on
 // an attribute when his low estimate is strictly above the other's high estimate; overlapping
 // ranges stay indeterminate rather than implying an ordering the staff has not established.
 function attributeComparison(recruits=[],t){
  const columns=(Array.isArray(recruits)?recruits:[]).filter(Boolean).map(r=>({id:String(r.id),name:r.name,pos:r.pos,domains:Object.fromEntries(domainRows(r,t).map(d=>[d.key,d]))}));
  const keys=[],seen=new Set();
  for(const c of columns)for(const k of Object.keys(c.domains))if(!seen.has(k)){seen.add(k);keys.push(k)}
  const rows=keys.map(key=>{
   const cells=columns.map(c=>{
    const d=c.domains[key];
    if(!d)return{available:false};
    const low=d.low,high=Math.max(low+1,d.high);
    return{available:true,low,high,confidence:finite(d.confidence)?d.confidence:null,midpoint:(low+high)/2,width:high-low,label:d.label||key};
   });
   const rated=cells.map((cell,index)=>({cell,index})).filter(x=>x.cell.available).sort((a,b)=>b.cell.midpoint-a.cell.midpoint||a.index-b.index);
   const leader=rated[0]||null,runnerUp=rated[1]||null;
   const decisive=!!(leader&&runnerUp&&leader.cell.low>runnerUp.cell.high);
   const status=!leader?'unscouted':!runnerUp?'single':decisive?'decisive':'overlap';
   return{key,label:(leader&&leader.cell.label)||key,cells,leaderIndex:leader?leader.index:null,runnerUpIndex:runnerUp?runnerUp.index:null,decisive,status};
  });
  const comparable=rows.filter(r=>r.status==='decisive'||r.status==='overlap');
  return{
   columns:columns.map(c=>({id:c.id,name:c.name,pos:c.pos})),
   rows,
   summary:{
    attributes:rows.length,
    comparable:comparable.length,
    decisive:comparable.filter(r=>r.decisive).length,
    overlapping:comparable.filter(r=>r.status==='overlap').length,
    single:rows.filter(r=>r.status==='single').length,
    unscouted:rows.filter(r=>r.status==='unscouted').length
   }
  };
 }
 return{MAX,normalize,toggle,summary,attributeComparison};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRecruitCompareSystem};
}else{
 const recruitCompareScoutingApi=makeScoutingActionSystem({getUniverse:()=>universe,clamp,avg,scoutingDomainView,firstRecruitEvaluation,refreshScoutingIntel,snapshotScouting,staffEval,staffBias:(r,t)=>scoutHash(r,'staff_verdict',String(t.id))*12,hasDetailedScouting:r=>!!(r?.scoutingDomains&&Object.keys(r.scoutingDomains).length)});
 const recruitCompareSystem=makeRecruitCompareSystem({staffVerdict:recruitCompareScoutingApi.staffVerdict,scoutingRecord:(r,t)=>recruitCompareScoutingApi.recruitScoutingRecord(r,t,false),domains:(r,t)=>scoutingDomainView(r,t,true)});
 let recruitCompareIds=[];
 function compareToggleHTML(r){const on=recruitCompareIds.includes(String(r.id));return `<button type="button" class="recruit-compare-toggle${on?' active':''}" data-compare-recruit="${r.id}">${on?'Compared':'Compare'}</button>`}
 function recruitCompareAttributeHTML(t){
  const recruits=recruitCompareIds.map(id=>universe.recruits.find(r=>String(r.id)===id)).filter(Boolean);if(recruits.length<2)return'';
  const cmp=recruitCompareSystem.attributeComparison(recruits,t),s=cmp.summary;
  if(!cmp.rows.length)return '<div class="recruit-compare-attrs"><div class="recruit-compare-attrs-head"><strong>Scouted attribute comparison</strong><small>No scouted ranges yet</small></div><div class="small muted">Run Quick Film or a Full Evaluation on these recruits to build comparable staff estimates.</div></div>';
  const head=cmp.columns.map(c=>`<th>${c.pos} ${c.name}</th>`).join(''),body=cmp.rows.map(row=>`<tr><th class="rc-attr">${row.label}</th>${row.cells.map((cell,i)=>{
   if(!cell.available)return '<td class="rc-none">—</td>';
   const lead=row.decisive&&i===row.leaderIndex?'rc-lead':row.status==='overlap'?'rc-overlap':'',conf=cell.confidence==null?'':` title="${cell.confidence}% confidence"`;
   return `<td class="${lead}"${conf}>${cell.low}–${cell.high}</td>`;
  }).join('')}</tr>`).join('');
  const note=s.comparable?`${s.decisive} of ${s.comparable} comparable attribute${s.comparable===1?'':'s'} separate the group`:'No comparable attributes yet';
  return `<div class="recruit-compare-attrs"><div class="recruit-compare-attrs-head"><strong>Scouted attribute comparison</strong><small>${note}</small></div><table class="recruit-compare-table"><thead><tr><th></th>${head}</tr></thead><tbody>${body}</tbody></table><div class="small muted">A row ranks only when the leader's low estimate clears every other recruit's high estimate; overlapping ranges are not a reliable ordering. Staff estimates only — hidden ability is never read.</div></div>`;
 }
 function recruitCompareTrayHTML(t){
  const recruits=recruitCompareIds.map(id=>universe.recruits.find(r=>String(r.id)===id)).filter(Boolean);if(!recruits.length)return'';
  return `<div class="recruit-compare-tray"><div class="recruit-compare-head"><div><strong>Recruit Compare</strong><small>Current staff information only</small></div><button type="button" data-compare-clear>Clear</button></div><div class="recruit-compare-grid">${recruits.map(r=>{const x=recruitCompareSystem.summary(r,t);return `<div class="recruit-compare-card"><button class="player-button" data-recruit="${r.id}">${r.pos} ${r.name}</button><div class="small muted">#${r.nationalRank} · ${'★'.repeat(r.stars)} · ${r.homeState} · ${r.priority}</div><div class="recruit-compare-verdict"><strong>${x.verdict}</strong><b>${x.score}</b></div><div class="small">${x.stage} · ${x.conviction} conviction · ${x.confidence}% confidence</div><div class="small muted">Best: ${x.strengths.join(', ')||'—'} · Risk: ${x.risk||'—'}</div><div class="small muted">Interest ${r.interest}% · ${recruitDistance(t,r)} mi</div></div>`}).join('')}</div>${recruitCompareAttributeHTML(t)}</div>`;
 }
 function bindRecruitCompare(){
  $$('[data-compare-recruit]').forEach(b=>b.onclick=()=>{const id=String(b.dataset.compareRecruit),dialog=b.closest?.('#recruitDialog'),result=recruitCompareSystem.toggle(recruitCompareIds,id);if(!result.ok){setStatus(result.reason);return}recruitCompareIds=result.ids;renderRecruiting();if(dialog){const d=$('#recruitDialog');if(d?.open)d.close();showRecruitProfile(id)}});
  $$('[data-compare-clear]').forEach(b=>b.onclick=()=>{recruitCompareIds=[];renderRecruiting()});
 }
 function augmentRecruitCompare(){
  const t=selected(),summary=$('#classSummary');if(!t||!summary)return;
  $$('[data-recruit]').forEach(link=>{const r=universe.recruits.find(x=>String(x.id)===String(link.dataset.recruit)),row=link.closest?.('tr'),cell=row?.querySelector?.('td[data-label="Scout"]');if(!r||!cell||cell.querySelector?.('.recruit-compare-toggle'))return;cell.insertAdjacentHTML?.('beforeend',compareToggleHTML(r))});
  summary.insertAdjacentHTML?.('beforeend',recruitCompareTrayHTML(t));bindRecruitCompare();attachRecruitLinks();
 }
 extendRender('recruiting',augmentRecruitCompare);
 const showRecruitProfileBeforeCompare=showRecruitProfile;
 showRecruitProfile=function(id){
  showRecruitProfileBeforeCompare(id);
  const r=universe.recruits.find(x=>String(x.id)===String(id)),host=$('#recruitDialogBody')?.querySelector?.('.scouting-profile-actions');
  if(r&&host&&!host.querySelector?.('.recruit-compare-toggle')){host.insertAdjacentHTML?.('beforeend',compareToggleHTML(r));bindRecruitCompare()}
 };
 if(globalThis.__DL_TEST__)globalThis.__DL_TEST__.recruitCompare={
  setIds(ids){recruitCompareIds=recruitCompareSystem.normalize(ids);return recruitCompareIds},
  trayHTML:t=>recruitCompareTrayHTML(t),
  attributeHTML:t=>recruitCompareAttributeHTML(t)
 };
}
