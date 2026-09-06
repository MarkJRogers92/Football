function makeScoutingActionSystem(env){
 'use strict';
 const COSTS={quick:1,full:3};
 const gainFor=kind=>kind==='full'?10:4;
 const phaseFor=kind=>kind==='full'?'FULL_EVALUATION':'QUICK_FILM';
 const labelFor=kind=>kind==='full'?'Full Evaluation':'Quick Film';
 function universe(){return env.getUniverse()}
 function scoutingBudgetFor(t){
  const rc=t?.staff?.RC||{},hc=t?.staff?.HC||{};
  return env.clamp(Math.round(5+(rc.evaluation||60)/18+(rc.recruiting||60)/32+(hc.evaluation||60)/55),8,14);
 }
 function ensureScoutingWeek(t){
  const u=universe(),budget=scoutingBudgetFor(t),old=t.scoutingWeek;
  if(!old||old.year!==u.year||old.week!==u.week)t.scoutingWeek={year:u.year,week:u.week,budget,spent:0};
  else{old.budget=budget;old.spent=env.clamp(Math.round(old.spent||0),0,budget)}
  return t.scoutingWeek;
 }
 function scoutingHoursLeft(t){const s=ensureScoutingWeek(t);return Math.max(0,s.budget-s.spent)}
 function recruitScoutingRecord(r,t){
  const u=universe();r.manualScouting??={};const key=String(t.id);let row=r.manualScouting[key];
  if(!row||row.season!==u.year)row=r.manualScouting[key]={season:u.year,quick:false,full:false,receipts:[]};
  row.receipts=Array.isArray(row.receipts)?row.receipts:[];return row;
 }
 function actionAvailability(r,t,kind){
  if(!COSTS[kind])return{ok:false,reason:'Unknown scouting action.'};
  if(!r||!t)return{ok:false,reason:'No recruit selected.'};
  if(universe().phase!=='regular')return{ok:false,reason:'Manual recruit evaluation is available during the regular recruiting season.'};
  if(r.committed&&r.committed!==t.name)return{ok:false,reason:`${r.name} is committed elsewhere.`};
  const rec=recruitScoutingRecord(r,t);
  if(kind==='quick'&&(rec.quick||rec.full))return{ok:false,reason:'Quick Film is already complete for this recruit.'};
  if(kind==='full'&&rec.full)return{ok:false,reason:'Full Evaluation is already complete for this recruit.'};
  const cost=COSTS[kind],left=scoutingHoursLeft(t);
  if(cost>left)return{ok:false,reason:`Only ${left} evaluation hour${left===1?'':'s'} remain this week.`};
  return{ok:true,cost,left,record:rec};
 }
 function width(rows){return rows.length?Math.round(env.avg(rows.map(x=>Math.max(0,(x.high||0)-(x.low||0))))*10)/10:0}
 function confidence(rows){return rows.length?Math.round(env.avg(rows.map(x=>x.confidence||0))):0}
 function performScoutingAction(r,t,kind){
  const check=actionAvailability(r,t,kind);if(!check.ok)return check;
  const before=env.scoutingDomainView(r,t,true),beforeConfidence=confidence(before),beforeWidth=width(before);
  if(!(r.scoutingHistory||[]).length)env.firstRecruitEvaluation(r,t);
  env.refreshScoutingIntel(r,t,gainFor(kind),phaseFor(kind),true);
  env.snapshotScouting(r,t,phaseFor(kind),'MANUAL_SCOUT',true);
  const after=env.scoutingDomainView(r,t,true),afterConfidence=confidence(after),afterWidth=width(after),week=ensureScoutingWeek(t),rec=check.record;
  week.spent+=check.cost;
  if(kind==='quick')rec.quick=true;else{rec.quick=true;rec.full=true}
  const receipt={season:universe().year,week:universe().week,kind,cost:check.cost,beforeConfidence,afterConfidence,beforeWidth,afterWidth};
  rec.receipts.push(receipt);if(rec.receipts.length>8)rec.receipts.splice(0,rec.receipts.length-8);
  return{ok:true,label:labelFor(kind),cost:check.cost,remaining:scoutingHoursLeft(t),receipt};
 }
 return{COSTS,scoutingBudgetFor,ensureScoutingWeek,scoutingHoursLeft,recruitScoutingRecord,actionAvailability,performScoutingAction};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeScoutingActionSystem};
}else{
 const recruitScoutingActions=makeScoutingActionSystem({
  getUniverse:()=>universe,clamp,avg,scoutingDomainView,firstRecruitEvaluation,refreshScoutingIntel,snapshotScouting
 });
 const scoutingBudgetFor=recruitScoutingActions.scoutingBudgetFor;
 const ensureScoutingWeek=recruitScoutingActions.ensureScoutingWeek;
 const scoutingHoursLeft=recruitScoutingActions.scoutingHoursLeft;
 const recruitScoutingRecord=recruitScoutingActions.recruitScoutingRecord;
 const scoutingActionAvailability=recruitScoutingActions.actionAvailability;
 const performRecruitScoutingAction=recruitScoutingActions.performScoutingAction;
 function scoutingActionButtonsHTML(r,t){
  const q=scoutingActionAvailability(r,t,'quick'),f=scoutingActionAvailability(r,t,'full'),rec=recruitScoutingRecord(r,t),title=x=>String(x.reason||'').replace(/"/g,'&quot;');
  return `<div class="scouting-actions"><button type="button" data-scout-action="quick" data-scout-recruit="${r.id}" ${q.ok?'':`disabled title="${title(q)}"`}>${rec.quick||rec.full?'Film Reviewed':'Quick Film · 1h'}</button><button type="button" data-scout-action="full" data-scout-recruit="${r.id}" ${f.ok?'':`disabled title="${title(f)}"`}>${rec.full?'Full Eval Complete':'Full Evaluation · 3h'}</button></div>`;
 }
 function bindScoutingActionButtons(){
  $$('[data-scout-action]').forEach(b=>b.onclick=()=>{
   const r=universe.recruits.find(x=>String(x.id)===String(b.dataset.scoutRecruit)),t=selected(),dialog=b.closest?.('#recruitDialog');
   const res=performRecruitScoutingAction(r,t,b.dataset.scoutAction);
   setStatus(res.ok?`${res.label}: ${r.name}. ${res.remaining} evaluation hour${res.remaining===1?'':'s'} left this week.`:res.reason);
   renderRecruiting();
   if(dialog&&res.ok){const d=$('#recruitDialog');if(d?.open)d.close();showRecruitProfile(r.id)}
  });
 }
 function renderScoutingActionUI(){
  const t=selected(),summary=$('#classSummary');if(!t||!summary)return;
  const week=ensureScoutingWeek(t),left=scoutingHoursLeft(t),strip=`<div class="scouting-budget-strip"><strong>Evaluation Hours</strong><span>${left} / ${week.budget} left this week</span><small>Quick Film costs 1 · Full Evaluation costs 3 · unused hours do not roll over</small></div>`;
  summary.insertAdjacentHTML?.('beforeend',strip);
  $$('[data-recruit]').forEach(link=>{
   const r=universe.recruits.find(x=>String(x.id)===String(link.dataset.recruit)),row=link.closest?.('tr'),cell=row?.querySelector?.('td[data-label="Scout"]');
   if(!r||!cell||cell.querySelector?.('.scouting-actions'))return;
   cell.insertAdjacentHTML?.('beforeend',scoutingActionButtonsHTML(r,t));
  });
  bindScoutingActionButtons();
 }
 const renderRecruitingBeforeScoutingActions=renderRecruiting;
 renderRecruiting=function(){renderRecruitingBeforeScoutingActions();renderScoutingActionUI()};
 const showRecruitProfileBeforeScoutingActions=showRecruitProfile;
 showRecruitProfile=function(id){
  showRecruitProfileBeforeScoutingActions(id);
  const r=universe.recruits.find(x=>String(x.id)===String(id)),t=selected(),body=$('#recruitDialogBody');
  if(r&&t&&body&&!body.querySelector?.('.scouting-profile-actions')){
   const week=ensureScoutingWeek(t);body.insertAdjacentHTML?.('afterbegin',`<div class="scouting-profile-actions"><div><strong>Evaluation room</strong><span>${scoutingHoursLeft(t)} of ${week.budget} hours left this week</span></div>${scoutingActionButtonsHTML(r,t)}</div>`);
   bindScoutingActionButtons();
  }
 };
}
