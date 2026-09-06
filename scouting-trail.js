function makeScoutingTrailSystem(){
 'use strict';
 const num=v=>Number.isFinite(Number(v))?Number(v):0;
 function actionLabel(kind){return kind==='full'?'Full Evaluation':kind==='quick'?'Quick Film':'Evaluation'}
 function rows(record={}){
  return (Array.isArray(record.receipts)?record.receipts:[]).map((x,index)=>{
   const beforeConfidence=num(x.beforeConfidence),afterConfidence=num(x.afterConfidence),beforeWidth=num(x.beforeWidth),afterWidth=num(x.afterWidth),beforeVerdict=x.beforeVerdict||'—',afterVerdict=x.afterVerdict||beforeVerdict;
   return{index,season:x.season??null,week:x.week??null,kind:x.kind||'evaluation',label:actionLabel(x.kind),cost:num(x.cost),beforeConfidence,afterConfidence,confidenceGain:afterConfidence-beforeConfidence,beforeWidth,afterWidth,rangeTightening:Math.round((beforeWidth-afterWidth)*10)/10,beforeVerdict,afterVerdict,verdictChanged:beforeVerdict!==afterVerdict};
  });
 }
 function summary(record={}){
  const list=rows(record);if(!list.length)return{actions:0,hours:0,confidenceGain:0,rangeTightening:0,verdictChanges:0,lastVerdict:null};
  const first=list[0],last=list.at(-1);
  return{actions:list.length,hours:list.reduce((n,x)=>n+x.cost,0),confidenceGain:last.afterConfidence-first.beforeConfidence,rangeTightening:Math.round((first.beforeWidth-last.afterWidth)*10)/10,verdictChanges:list.filter(x=>x.verdictChanged).length,lastVerdict:last.afterVerdict};
 }
 return{actionLabel,rows,summary};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeScoutingTrailSystem};
}else{
 const scoutingTrailSystem=makeScoutingTrailSystem();
 const scoutingTrailEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function scoutingTrailHTML(r,t){
  const rec=recruitScoutingRecord(r,t,false),rows=scoutingTrailSystem.rows(rec),summary=scoutingTrailSystem.summary(rec);
  if(!rows.length)return `<div class="scouting-trail-card"><div class="scouting-trail-head"><div><span class="eyebrow">EVALUATION TRAIL</span><strong>No manual evaluation yet</strong></div></div><p class="small muted">Quick Film and Full Evaluation receipts will appear here so you can see exactly what your staff learned for the hours spent.</p></div>`;
  const signed=n=>n>0?`+${n}`:String(n),tight=n=>n>0?`${n} tighter`:n<0?`${Math.abs(n)} wider`:'unchanged';
  return `<div class="scouting-trail-card"><div class="scouting-trail-head"><div><span class="eyebrow">EVALUATION TRAIL</span><strong>${summary.actions} action${summary.actions===1?'':'s'} · ${summary.hours} hour${summary.hours===1?'':'s'} spent</strong></div><span>${signed(summary.confidenceGain)} confidence · ${tight(summary.rangeTightening)}</span></div><div class="scouting-trail-list">${rows.map(x=>`<div class="scouting-trail-row"><div><strong>${scoutingTrailEscape(x.label)}</strong><small>${x.week==null?'':`Week ${x.week} · `}${x.cost}h</small></div><div><b>${scoutingTrailEscape(x.beforeVerdict)}${x.verdictChanged?` → ${scoutingTrailEscape(x.afterVerdict)}`:''}</b><small>Confidence ${x.beforeConfidence}% → ${x.afterConfidence}% (${signed(x.confidenceGain)}) · avg range ${x.beforeWidth} → ${x.afterWidth} (${tight(x.rangeTightening)})</small></div></div>`).join('')}</div><small class="scouting-trail-note">This is a receipt of changes to the staff report, not a reveal of hidden true talent.</small></div>`;
 }
 const showRecruitProfileBeforeScoutingTrail=showRecruitProfile;
 showRecruitProfile=function(id){
  showRecruitProfileBeforeScoutingTrail(id);
  const r=universe.recruits.find(x=>String(x.id)===String(id)),t=selected(),body=$('#recruitDialogBody');if(!r||!t||!body||body.querySelector?.('.scouting-trail-card'))return;
  const verdict=body.querySelector?.('.staff-verdict-card'),html=scoutingTrailHTML(r,t);if(verdict)verdict.insertAdjacentHTML?.('afterend',html);else body.insertAdjacentHTML?.('afterbegin',html);
 };
 globalThis.DynastyLabScoutingTrail={rows:(r,t)=>scoutingTrailSystem.rows(recruitScoutingRecord(r,t,false)),summary:(r,t)=>scoutingTrailSystem.summary(recruitScoutingRecord(r,t,false))};
}
