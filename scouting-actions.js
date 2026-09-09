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
 function evaluationWorkload(recruits=[],t){
  const active=(recruits||[]).filter(r=>r?.targeted&&!r.committed);let untouched=0,film=0,full=0;
  for(const r of active){const rec=recruitScoutingRecord(r,t,false);if(rec.full)full++;else if(rec.quick)film++;else untouched++}
  const remaining=scoutingHoursLeft(t);
  return{targets:active.length,untouched,film,full,remaining,quickCapacity:Math.min(untouched,remaining),fullCapacity:Math.min(untouched+film,Math.floor(remaining/COSTS.full))};
 }
 function blankScoutingRecord(){return{season:universe().year,quick:false,full:false,receipts:[]}}
 function recruitScoutingRecord(r,t,create=true){
  const u=universe(),key=String(t.id),existing=r?.manualScouting?.[key];
  if(existing&&existing.season===u.year){existing.receipts=Array.isArray(existing.receipts)?existing.receipts:[];return existing}
  if(!create)return blankScoutingRecord();
  r.manualScouting??={};const row=r.manualScouting[key]={season:u.year,quick:false,full:false,receipts:[]};return row;
 }
 function actionAvailability(r,t,kind){
  if(!COSTS[kind])return{ok:false,reason:'Unknown scouting action.'};
  if(!r||!t)return{ok:false,reason:'No recruit selected.'};
  const u=universe(),activeRecruiting=u.phase==='regular'||(u.phase==='preseason'&&u.week===0);
  if(!activeRecruiting)return{ok:false,reason:'Manual recruit evaluation is available during an active recruiting period.'};
  if(r.committed&&r.committed!==t.name)return{ok:false,reason:`${r.name} is committed elsewhere.`};
  const rec=recruitScoutingRecord(r,t,false);
  if(kind==='quick'&&(rec.quick||rec.full))return{ok:false,reason:'Quick Film is already complete for this recruit.'};
  if(kind==='full'&&rec.full)return{ok:false,reason:'Full Evaluation is already complete for this recruit.'};
  const cost=COSTS[kind],left=scoutingHoursLeft(t);
  if(cost>left)return{ok:false,reason:`Only ${left} evaluation hour${left===1?'':'s'} remain this week.`};
  return{ok:true,cost,left};
 }
 function width(rows){return rows.length?Math.round(env.avg(rows.map(x=>Math.max(0,(x.high||0)-(x.low||0))))*10)/10:0}
 function confidence(rows){return rows.length?Math.round(env.avg(rows.map(x=>x.confidence||0))):0}
 function midpoint(x){return ((x.low||0)+(x.high||0))/2}
 function hasDetailedScouting(r){return env.hasDetailedScouting?env.hasDetailedScouting(r):!!(r?.scoutingDomains||(Array.isArray(r?.domains)&&r.domains.length))}
 function preliminaryRows(r){
  const current=Number.isFinite(r?.scout)?r.scout:Number.isFinite(r?.perceived)?r.perceived:60,upside=Number.isFinite(r?.scoutUp)?r.scoutUp:Number.isFinite(r?.perceivedUpside)?r.perceivedUpside:Math.max(current,68),conf=env.clamp(Math.round(r?.scoutConfidence??38),20,75),margin=env.clamp(Math.round((100-conf)/6),5,14);
  return[
   {key:'current',label:'Current ability',low:env.clamp(current-margin,20,99),high:env.clamp(current+margin,20,99),confidence:conf},
   {key:'upside',label:'Upside',low:env.clamp(upside-margin,20,99),high:env.clamp(upside+margin,20,99),confidence:Math.max(20,conf-4)}
  ];
 }
 function verdictRows(r,t){return hasDetailedScouting(r)?env.scoutingDomainView(r,t,true):preliminaryRows(r)}
 function verdictLabel(score){return score>=88?'Priority take':score>=82?'Take':score>=76?'Strong target':score>=70?'Boardable':score>=64?'Developmental':'Pass'}
 function staffVerdict(r,t){
  const rows=verdictRows(r,t),rec=recruitScoutingRecord(r,t,false),up=rows.find(x=>x.key==='upside')||rows.at(-1),current=rows.filter(x=>x!==up),currentRead=current.length?env.avg(current.map(midpoint)):midpoint(up),upside=midpoint(up),conf=confidence(rows),spread=width(rows),staff=env.staffEval?env.staffEval(t):65,bias=env.staffBias?env.staffBias(r,t):0,uncertainty=(100-conf)/100;
  const score=env.clamp(Math.round(currentRead*.64+upside*.24+staff*.12+bias*uncertainty),20,99),sorted=current.slice().sort((a,b)=>midpoint(b)-midpoint(a)),strong=sorted.slice(0,2).map(x=>x.label),risk=current.slice().sort((a,b)=>((b.high-b.low)-(a.high-a.low))||midpoint(a)-midpoint(b))[0];
  const conviction=rec.full&&conf>=70?'High':(rec.quick||rec.full)&&conf>=52?'Medium':rec.quick||rec.full?'Low':'Preliminary';
  const label=verdictLabel(score),summary=`${label}. ${strong.length?`Best current reads: ${strong.join(' and ')}.`:''} ${risk?`Biggest uncertainty: ${risk.label}.`:''}`.trim();
  return{score,label,conviction,confidence:conf,spread,strong,risk:risk?.label||null,summary,detailed:hasDetailedScouting(r)};
 }
 function performScoutingAction(r,t,kind){
  const check=actionAvailability(r,t,kind);if(!check.ok)return check;
  if(!(r.scoutingHistory||[]).length)env.firstRecruitEvaluation(r,t);
  const before=env.scoutingDomainView(r,t,true),beforeConfidence=confidence(before),beforeWidth=width(before),beforeVerdict=staffVerdict(r,t);
  env.refreshScoutingIntel(r,t,gainFor(kind),phaseFor(kind),true);
  env.snapshotScouting(r,t,phaseFor(kind),'MANUAL_SCOUT',true);
  const after=env.scoutingDomainView(r,t,true),afterConfidence=confidence(after),afterWidth=width(after),week=ensureScoutingWeek(t),rec=recruitScoutingRecord(r,t,true);
  week.spent+=check.cost;
  if(kind==='quick')rec.quick=true;else{rec.quick=true;rec.full=true}
  const afterVerdict=staffVerdict(r,t),receipt={season:universe().year,week:universe().week,kind,cost:check.cost,beforeConfidence,afterConfidence,beforeWidth,afterWidth,beforeVerdict:beforeVerdict.label,afterVerdict:afterVerdict.label};
  rec.receipts.push(receipt);if(rec.receipts.length>8)rec.receipts.splice(0,rec.receipts.length-8);
  return{ok:true,label:labelFor(kind),cost:check.cost,remaining:scoutingHoursLeft(t),receipt,verdict:afterVerdict};
 }
 return{COSTS,scoutingBudgetFor,ensureScoutingWeek,scoutingHoursLeft,evaluationWorkload,recruitScoutingRecord,actionAvailability,staffVerdict,performScoutingAction};
}

// Shared with later browser-only recruiting extensions in the same app closure.
// `var` is intentional: block-scoped declarations in this branch are invisible
// to sibling extension blocks when the standalone page runs in strict mode.
var recruitScoutingRecord,recruitStaffVerdict,scoutingActionButtonsHTML,bindScoutingActionButtons;
if(typeof module==='object'&&module.exports){
 module.exports={makeScoutingActionSystem};
}else{
 const recruitScoutingActions=makeScoutingActionSystem({
  getUniverse:()=>universe,clamp,avg,scoutingDomainView,firstRecruitEvaluation,refreshScoutingIntel,snapshotScouting,staffEval,staffBias:(r,t)=>scoutHash(r,'staff_verdict',String(t.id))*12,hasDetailedScouting:r=>!!(r?.scoutingDomains&&Object.keys(r.scoutingDomains).length)
 });
 const scoutingBudgetFor=recruitScoutingActions.scoutingBudgetFor;
 const ensureScoutingWeek=recruitScoutingActions.ensureScoutingWeek;
 const scoutingHoursLeft=recruitScoutingActions.scoutingHoursLeft;
 recruitScoutingRecord=recruitScoutingActions.recruitScoutingRecord;
 const scoutingActionAvailability=recruitScoutingActions.actionAvailability;
 recruitStaffVerdict=recruitScoutingActions.staffVerdict;
 const performRecruitScoutingAction=recruitScoutingActions.performScoutingAction;
 function scoutingVerdictHTML(r,t,compact=false){
  const v=recruitStaffVerdict(r,t),rec=recruitScoutingRecord(r,t,false),tag=rec.full?'FULL EVAL':rec.quick?'FILM REVIEW':'PRELIMINARY';
  if(compact)return `<div class="staff-verdict-compact"><strong>${v.label}</strong><span>${v.conviction} conviction · ${v.confidence}% confidence</span></div>`;
  return `<div class="staff-verdict-card"><div class="staff-verdict-head"><div><span class="eyebrow">STAFF VERDICT · ${tag}</span><strong>${v.label}</strong></div><b>${v.score}</b></div><p>${v.summary}</p><div class="small muted">${v.conviction} conviction · ${v.confidence}% report confidence · average range width ${v.spread}. This is a staff opinion, not hidden truth.</div></div>`;
 }
 scoutingActionButtonsHTML=function(r,t){
  const q=scoutingActionAvailability(r,t,'quick'),f=scoutingActionAvailability(r,t,'full'),rec=recruitScoutingRecord(r,t,false),title=x=>String(x.reason||'').replace(/"/g,'&quot;');
  return `<div class="scouting-actions"><button type="button" data-scout-action="quick" data-scout-recruit="${r.id}" ${q.ok?'':`disabled title="${title(q)}"`}>${rec.quick||rec.full?'Film Reviewed':'Quick Film · 1h'}</button><button type="button" data-scout-action="full" data-scout-recruit="${r.id}" ${f.ok?'':`disabled title="${title(f)}"`}>${rec.full?'Full Eval Complete':'Full Evaluation · 3h'}</button></div>`;
 };
 bindScoutingActionButtons=function(){
  $$('[data-scout-action]').forEach(b=>b.onclick=()=>{
   const r=universe.recruits.find(x=>String(x.id)===String(b.dataset.scoutRecruit)),t=selected(),dialog=b.closest?.('#recruitDialog');
   const res=performRecruitScoutingAction(r,t,b.dataset.scoutAction);
   setStatus(res.ok?`${res.label}: ${r.name}. Staff verdict: ${res.verdict.label}. ${res.remaining} evaluation hour${res.remaining===1?'':'s'} left this week.`:res.reason);
   renderRecruiting();
   if(dialog&&res.ok){const d=$('#recruitDialog');if(d?.open)d.close();showRecruitProfile(r.id)}
  });
 };
 function renderScoutingActionUI(){
  const t=selected(),summary=$('#classSummary');if(!t||!summary)return;
  const week=ensureScoutingWeek(t),left=scoutingHoursLeft(t),work=recruitScoutingActions.evaluationWorkload(universe.recruits,t),strip=`<div class="scouting-budget-strip"><strong>Evaluation Hours</strong><span>${left} / ${week.budget} left this week</span><small>${work.targets} active target${work.targets===1?'':'s'} · ${work.untouched} untouched · ${work.film} film-reviewed · ${work.full} fully evaluated</small><small>Remaining hours can cover ${work.quickCapacity} new Quick Film${work.quickCapacity===1?'':'s'} or ${work.fullCapacity} Full Evaluation${work.fullCapacity===1?'':'s'}. Quick Film costs 1 · Full Evaluation costs 3 · unused hours do not roll over.</small></div>`;
  summary.insertAdjacentHTML?.('beforeend',strip);
  $$('[data-recruit]').forEach(link=>{
   const r=universe.recruits.find(x=>String(x.id)===String(link.dataset.recruit)),row=link.closest?.('tr'),cell=row?.querySelector?.('td[data-label="Scout"]');
   if(!r||!cell||cell.querySelector?.('.scouting-actions'))return;
   cell.insertAdjacentHTML?.('beforeend',scoutingVerdictHTML(r,t,true)+scoutingActionButtonsHTML(r,t));
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
   const week=ensureScoutingWeek(t);body.insertAdjacentHTML?.('afterbegin',`<div class="scouting-profile-actions"><div><strong>Evaluation room</strong><span>${scoutingHoursLeft(t)} of ${week.budget} hours left this week</span></div>${scoutingActionButtonsHTML(r,t)}</div>${scoutingVerdictHTML(r,t,false)}`);
   bindScoutingActionButtons();
  }
 };
}
