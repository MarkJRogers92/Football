function makeRecruitCompareSystem(env){
 'use strict';
 const MAX=3;
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
 return{MAX,normalize,toggle,summary};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRecruitCompareSystem};
}else{
 const recruitCompareScoutingApi=makeScoutingActionSystem({getUniverse:()=>universe,clamp,avg,scoutingDomainView,firstRecruitEvaluation,refreshScoutingIntel,snapshotScouting,staffEval,staffBias:(r,t)=>scoutHash(r,'staff_verdict',String(t.id))*12});
 const recruitCompareSystem=makeRecruitCompareSystem({staffVerdict:recruitCompareScoutingApi.staffVerdict,scoutingRecord:recruitCompareScoutingApi.recruitScoutingRecord});
 let recruitCompareIds=[];
 function compareToggleHTML(r){const on=recruitCompareIds.includes(String(r.id));return `<button type="button" class="recruit-compare-toggle${on?' active':''}" data-compare-recruit="${r.id}">${on?'Compared':'Compare'}</button>`}
 function recruitCompareTrayHTML(t){
  const recruits=recruitCompareIds.map(id=>universe.recruits.find(r=>String(r.id)===id)).filter(Boolean);if(!recruits.length)return'';
  return `<div class="recruit-compare-tray"><div class="recruit-compare-head"><div><strong>Recruit Compare</strong><small>Current staff information only</small></div><button type="button" data-compare-clear>Clear</button></div><div class="recruit-compare-grid">${recruits.map(r=>{const x=recruitCompareSystem.summary(r,t);return `<div class="recruit-compare-card"><button class="player-button" data-recruit="${r.id}">${r.pos} ${r.name}</button><div class="small muted">#${r.nationalRank} · ${'★'.repeat(r.stars)} · ${r.homeState} · ${r.priority}</div><div class="recruit-compare-verdict"><strong>${x.verdict}</strong><b>${x.score}</b></div><div class="small">${x.stage} · ${x.conviction} conviction · ${x.confidence}% confidence</div><div class="small muted">Best: ${x.strengths.join(', ')||'—'} · Risk: ${x.risk||'—'}</div><div class="small muted">Interest ${r.interest}% · ${recruitDistance(t,r)} mi</div></div>`}).join('')}</div></div>`;
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
 const renderRecruitingBeforeCompare=renderRecruiting;
 renderRecruiting=function(){renderRecruitingBeforeCompare();augmentRecruitCompare()};
 const showRecruitProfileBeforeCompare=showRecruitProfile;
 showRecruitProfile=function(id){
  showRecruitProfileBeforeCompare(id);
  const r=universe.recruits.find(x=>String(x.id)===String(id)),host=$('#recruitDialogBody')?.querySelector?.('.scouting-profile-actions');
  if(r&&host&&!host.querySelector?.('.recruit-compare-toggle')){host.insertAdjacentHTML?.('beforeend',compareToggleHTML(r));bindRecruitCompare()}
 };
}
