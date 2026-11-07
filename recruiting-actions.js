// Recruiting Desk (v0.15.0). Scouting hours tell you how good a prospect is; recruiting hours are how
// you win him. Each week the staff has a budget of hours, spent per recruit on calls, pitches,
// scholarship offers and visits. Targets nobody works start to cool, so the board is an allocation
// problem instead of a free list.
//
// The rules live in a pure factory (testable in Node). The browser branch below wires them into the
// engine through three small hooks app.js already exposes (recruitEffort, userMayCommit and the
// existing recruitPitch / advanceRecruiting / scheduleVisit functions) and adds the desk UI.
function makeRecruitingActionSystem(env){
 'use strict';
 const COSTS={call:2,pitch:3,offer:2,visit:5,inhome:8};
 const LABELS={call:'Call',pitch:'Pitch',offer:'Offer',visit:'Campus Visit',inhome:'In-Home Visit'};
 // Calibrated against full seasons: a board that is only called and offered when ripe lands about what
 // passive targeting used to, an idle board lands a little less, and a board worked with pitches and
 // in-homes on the winnable targets lands clearly more. Calls and pitches shrink inside a single week
 // so one recruit cannot soak up the whole budget.
 const CALL_INTEREST=[1,1,0,0],CALL_RELATIONSHIP=[2,1,1,0];
 const PITCH_BASE=4,PITCH_REPEAT_TOPIC=.35,PITCH_NEXT=.7,PITCH_OFF_PRIORITY=.4;
 const OFFER={interest:2,relationship:2,boost:3},INHOME={interest:5,relationship:4,boost:4,minInterest:45,minWeek:5};
 const WITHDRAW={interest:-6,relationship:-5};
 const GRACE_WEEKS=1,WARM_WEEKS=1;
 function universe(){return env.getUniverse()}
 const clamp=(v,a,b)=>env.clamp(v,a,b);

 // ---------- hours ----------
 function hoursBudgetFor(t){
  const rc=t?.staff?.RC||{},hc=t?.staff?.HC||{};
  return clamp(Math.round(12+(rc.recruiting||60)*.38+(hc.recruiting||60)*.10+(t?.resources??60)*.06),30,60);
 }
 // Pure read: a stale or missing week reads as unspent without writing anything.
 function weekInfo(t){
  const u=universe(),budget=hoursBudgetFor(t),old=t?.recruitingWeek;
  const spent=old&&old.year===u.year&&old.week===u.week?clamp(Math.round(old.spent||0),0,budget):0;
  return{year:u.year,week:u.week,budget,spent};
 }
 function ensureWeek(t){
  const cur=weekInfo(t),old=t.recruitingWeek;
  if(!old||old.year!==cur.year||old.week!==cur.week)t.recruitingWeek=cur;else Object.assign(old,cur);
  return t.recruitingWeek;
 }
 function hoursLeft(t){const w=weekInfo(t);return Math.max(0,w.budget-w.spent)}
 function isActive(){const u=universe();return u.phase==='regular'||(u.phase==='preseason'&&u.week===0)}

 // ---------- per-recruit records ----------
 function blank(){return{season:universe().year,offered:false,offerWeek:null,inHome:false,lastWorkedWeek:null,graceWeek:null,week:null,history:[]}}
 function record(r,t,create=true){
  const u=universe(),key=String(t.id),old=r?.recruitingActions?.[key];
  if(old&&old.season===u.year){old.history=Array.isArray(old.history)?old.history:[];return old}
  if(!create)return blank();
  r.recruitingActions??={};return(r.recruitingActions[key]=blank());
 }
 // Counters that only mean something inside one week.
 function weekState(rec){
  const wk=universe().week;
  if(!rec.week||rec.week.week!==wk)rec.week={week:wk,calls:0,pitches:{},pitchCount:0,hours:0};
  return rec.week;
 }
 function workedThisWeek(r,t){const rec=record(r,t,false);return rec.lastWorkedWeek===universe().week}

 // ---------- offers ----------
 function offerLimit(t){return Math.max(10,Math.round(env.scholarshipCapacity(t)*1.6))}
 function offersOut(recruits,t){
  const u=universe(),key=String(t.id);let n=0;
  for(const r of recruits||[]){const x=r?.recruitingActions?.[key];if(x&&x.season===u.year&&x.offered&&!r.committed)n++}
  return n;
 }
 function hasOffer(r,t){return!!record(r,t,false).offered}

 // ---------- pitching ----------
 function topicStrength(t,r,topic){
  switch(topic){
   case'Prestige':return t.prestige;
   case'NIL':return t.nil;
   case'Development':return t.development;
   case'Early Role':return clamp(Math.round((90-env.unitStrength(t,r.pos))*2.2),0,100);
   case'Coaching':return Math.round(((t.staff?.HC?.loyalty??60)+(t.staff?.RC?.recruiting??60))/2);
   case'Academics':return t.academics;
   case'Scheme Fit':return clamp(Math.round(env.schemeFit(t,r)),0,100);
   case'Winning':{const g=(t.w||0)+(t.l||0);return g?Math.round(t.w/g*100):Math.round((t.prestige||50)*.8)}
   case'Stay Close':return clamp(Math.round(100-env.distance(t,r)/12),0,100);
   case'Campus Life':return Math.round(((t.fan_support??60)+(t.facilities??60))/2);
  }
  return 50;
 }
 const pitchFit=(r,topic)=>topic===r.priority?1:PITCH_OFF_PRIORITY;
 const pitchFactor=strength=>clamp((strength-40)/35,-.6,1.4);
 function pitchDiminish(rec,topic){
  const wk=weekState(rec);let m=Math.pow(PITCH_NEXT,wk.pitchCount);if(wk.pitches[topic])m*=PITCH_REPEAT_TOPIC;return m;
 }
 function pitchLabel(delta){return delta>=6?'Strong':delta>=3?'Good':delta>=1?'Modest':delta===0?'Flat':'Risky'}
 function pitchProjection(r,t,topic){
  const rec=record(r,t,false),strength=topicStrength(t,r,topic),fit=pitchFit(r,topic);
  const wk=rec.week&&rec.week.week===universe().week?rec.week:{pitchCount:0,pitches:{}};
  let m=Math.pow(PITCH_NEXT,wk.pitchCount);if(wk.pitches[topic])m*=PITCH_REPEAT_TOPIC;
  const delta=Math.round(PITCH_BASE*fit*pitchFactor(strength)*m);
  return{topic,strength,fit,delta,label:pitchLabel(delta),priority:topic===r.priority};
 }
 function pitchOptions(r,t){
  return env.priorities.map(topic=>pitchProjection(r,t,topic)).sort((a,b)=>b.delta-a.delta||b.strength-a.strength);
 }

 // ---------- availability / perform ----------
 function availability(r,t,kind,opts={}){
  if(!COSTS[kind])return{ok:false,reason:'Unknown recruiting action.'};
  if(!r||!t)return{ok:false,reason:'No recruit selected.'};
  const u=universe();
  if(!isActive())return{ok:false,reason:'Recruiting hours are available during the season and the preseason.'};
  if(r.committed)return{ok:false,reason:`${r.name} has already committed${r.committed===t.name?' to you':' elsewhere'}.`};
  if(env.recruitBlocked&&env.recruitBlocked(t,r))return{ok:false,reason:`${r.name} will not consider ${t.name} again.`};
  const rec=record(r,t,false),cost=COSTS[kind],left=hoursLeft(t);
  if(kind==='offer'){
   if(rec.offered)return{ok:false,reason:'A scholarship offer is already out.'};
   const limit=offerLimit(t),out=offersOut(u.recruits,t);
   if(out>=limit)return{ok:false,reason:`You have ${out} of ${limit} offers out. Withdraw one first.`};
  }
  if(kind==='inhome'){
   if(!rec.offered)return{ok:false,reason:'Offer a scholarship before an in-home visit.'};
   if(rec.inHome)return{ok:false,reason:'The in-home visit is already done.'};
   if(u.week<INHOME.minWeek)return{ok:false,reason:`In-home visits open in week ${INHOME.minWeek}.`};
   if((r.interest||0)<INHOME.minInterest)return{ok:false,reason:`He has to be at ${INHOME.minInterest}% interest before the family opens the door.`};
  }
  if(kind==='visit'&&r.visitWeek)return{ok:false,reason:'A campus visit is already scheduled.'};
  if(kind==='pitch'&&opts.topic&&!env.priorities.includes(opts.topic))return{ok:false,reason:'Unknown pitch topic.'};
  if(cost>left)return{ok:false,reason:`Only ${left} recruiting hour${left===1?'':'s'} left this week; this costs ${cost}.`};
  return{ok:true,cost,left};
 }
 function pushHistory(rec,row){rec.history.push(row);if(rec.history.length>10)rec.history.splice(0,rec.history.length-10)}
 function perform(r,t,kind,opts={}){
  const check=availability(r,t,kind,opts);if(!check.ok)return check;
  const u=universe();
  env.ensureTargeted(r,t);
  const rec=record(r,t,true),wk=weekState(rec);
  let dI=0,dR=0,topic=null,note='';
  if(kind==='call'){
   const i=Math.min(wk.calls,CALL_INTEREST.length-1);dI=CALL_INTEREST[i];dR=CALL_RELATIONSHIP[i];wk.calls++;
   note=wk.calls>1?'Another call this week means less each time.':'';
  }else if(kind==='pitch'){
   topic=opts.topic&&env.priorities.includes(opts.topic)?opts.topic:pitchOptions(r,t)[0].topic;
   const proj=pitchProjection(r,t,topic);dI=proj.delta;dR=dI>0?Math.max(1,Math.round(2*proj.fit)):0;
   wk.pitchCount++;wk.pitches[topic]=(wk.pitches[topic]||0)+1;
   note=`${proj.label} pitch on ${topic}${proj.priority?' — it is what he cares about':''}.`;
  }else if(kind==='offer'){
   rec.offered=true;rec.offerWeek=u.week;dI=OFFER.interest;dR=OFFER.relationship;note='Scholarship offer is out.';
  }else if(kind==='inhome'){
   rec.inHome=true;dI=INHOME.interest;dR=INHOME.relationship;note='The family hosted your staff.';
  }else if(kind==='visit'){
   env.scheduleVisit(r);dR=2;note=`Visit set for week ${r.visitWeek}.`;
  }
  if(dI)r.interest=clamp(Math.round((r.interest||0)+dI),1,100);
  if(dR){r.relationship=clamp((r.relationship||0)+dR,0,100);if(dR>0&&env.growRecruiterRelationship)env.growRecruiterRelationship(r,t,dR)}
  const week=ensureWeek(t);week.spent+=check.cost;
  rec.lastWorkedWeek=u.week;wk.hours+=check.cost;
  pushHistory(rec,{week:u.week,kind,cost:check.cost,topic,dI,dR});
  return{ok:true,kind,label:LABELS[kind],cost:check.cost,remaining:hoursLeft(t),dI,dR,topic,note};
 }
 function withdrawOffer(r,t){
  if(!r||!t)return{ok:false,reason:'No recruit selected.'};
  if(r.committed)return{ok:false,reason:`${r.name} has already committed.`};
  const rec=record(r,t,false);if(!rec.offered)return{ok:false,reason:'There is no offer to withdraw.'};
  rec.offered=false;rec.offerWeek=null;rec.withdrawn=true;
  r.interest=clamp(Math.round((r.interest||0)+WITHDRAW.interest),1,100);r.relationship=clamp((r.relationship||0)+WITHDRAW.relationship,0,100);
  pushHistory(rec,{week:universe().week,kind:'withdraw',cost:0,topic:null,dI:WITHDRAW.interest,dR:WITHDRAW.relationship});
  return{ok:true,dI:WITHDRAW.interest,dR:WITHDRAW.relationship};
 }

 // ---------- what the engine asks ----------
 // How many weeks it has been since this recruit was last worked, as of `playedWeek`.
 function weeksSinceWorked(r,t,playedWeek,{stamp=false}={}){
  const rec=record(r,t,stamp);
  let last=rec.lastWorkedWeek;
  if(last==null){
   if(rec.graceWeek==null){if(!stamp)return 0;rec.graceWeek=playedWeek}
   last=rec.graceWeek;
  }
  return Math.max(0,playedWeek-last);
 }
 function effortFromSince(since){
  if(since<=GRACE_WEEKS-1)return{state:'worked',relScale:.75,bumpScale:.75,noiseScale:1,freeze:false,cool:0,relDecay:0};
  if(since<=GRACE_WEEKS-1+WARM_WEEKS)return{state:'warm',relScale:.4,bumpScale:.4,noiseScale:1,freeze:false,cool:0,relDecay:0};
  return{state:'cooling',relScale:0,bumpScale:0,noiseScale:.5,freeze:true,cool:1+Math.min(2,Math.floor((since-2)/2)),relDecay:1};
 }
 // Called inside the weekly pass, after the week counter has moved on, so the week just played is week-1.
 function effort(r,t){return effortFromSince(weeksSinceWorked(r,t,universe().week-1,{stamp:true}))}
 // The same question asked now: what happens to him if the week were played as it stands?
 function previewEffort(r,t){return effortFromSince(weeksSinceWorked(r,t,universe().week))}
 function mayCommit(r,t){return!!t&&hasOffer(r,t)}
 // Standing bonus to the pitch the program makes, so offers and visits compete against rival programs.
 function pitchBoost(r,t){
  const x=r?.recruitingActions?.[String(t?.id)];if(!x||x.season!==universe().year)return 0;
  return(x.offered?OFFER.boost:0)+(x.inHome?INHOME.boost:0);
 }

 // ---------- board status ----------
 function status(r,t){
  const rec=record(r,t,false),u=universe(),open=!r.committed;
  const worked=rec.lastWorkedWeek===u.week,pe=open&&r.targeted?previewEffort(r,t):null;
  return{
   offered:!!rec.offered,inHome:!!rec.inHome,worked,
   cooling:!!pe&&!worked&&pe.state==='cooling',
   warm:!!pe&&!worked&&pe.state==='warm',
   ready:open&&r.targeted&&!rec.offered&&(r.interest||0)>=68,
   history:rec.history.slice(-3).reverse()
  };
 }
 function workload(recruits,t){
  const targets=(recruits||[]).filter(r=>r?.targeted&&!r.committed);
  let worked=0,cooling=0,ready=0;
  for(const r of targets){const s=status(r,t);if(s.worked)worked++;if(s.cooling)cooling++;if(s.ready)ready++}
  return{targets:targets.length,worked,cooling,ready,offersOut:offersOut(recruits,t),offerLimit:offerLimit(t),left:hoursLeft(t),budget:hoursBudgetFor(t)};
 }

 // ---------- staff work ----------
 // What the staff does when told to work the board: warm everyone, hand out the offers that are ripe,
 // then spend what is left on the best-fitting pitches. It never books visits or in-homes; those are
 // yours to call. Fully deterministic, so it consumes no gameplay randomness.
 function staffPlan(recruits,t,{maxOffers=3,maxPitches=3}={}){
  const targets=(recruits||[]).filter(r=>r?.targeted&&!r.committed).sort((a,b)=>(a.nationalRank||1e9)-(b.nationalRank||1e9));
  const done={calls:0,pitches:0,offers:0,hours:0};
  const run=(r,kind,opts)=>{const out=perform(r,t,kind,opts);if(out.ok){done.hours+=out.cost;if(kind==='call')done.calls++;else if(kind==='pitch')done.pitches++;else if(kind==='offer')done.offers++}return out.ok};
  let n=0;
  for(const r of targets){if(n>=maxOffers)break;if(!hasOffer(r,t)&&(r.interest||0)>=60&&run(r,'offer'))n++}
  for(const r of targets)if(!workedThisWeek(r,t))run(r,'call');
  let p=0;
  for(const r of targets){
   if(p>=maxPitches)break;
   const best=pitchOptions(r,t)[0];
   if(best&&best.delta>=4&&run(r,'pitch',{topic:best.topic}))p++;
  }
  return done;
 }

 // ---------- automation ----------
 // "Staff handle recruiting": every week, before it plays, the staff spend whatever hours the coach
 // left unspent using the staff plan. The coach can still act first and the staff fill in around it.
 function isAuto(u){return!!u?.recruitingActions?.auto}
 function setAuto(u,on){
  if(!u)return false;
  u.recruitingActions??={version:1,year:u.year,week:u.week};
  u.recruitingActions.auto=!!on;return u.recruitingActions.auto;
 }

 // ---------- one-time migration ----------
 // A save from before the Recruiting Desk has targets that were committing on interest alone.
 // Treat those as already offered so nothing in flight changes under the player.
 function grandfather(u,t){
  // Without a controlled program there is nothing to grandfather yet; try again on the next load.
  if(!u||u.recruitingActions||!t)return false;
  u.recruitingActions={version:1,year:u.year,week:u.week,migrated:true};
  for(const r of u.recruits||[]){
   if(!r.targeted||r.committed)continue;
   const rec=record(r,t,true);rec.offered=true;rec.offerWeek=u.week;rec.grandfathered=true;
  }
  return true;
 }

 return{COSTS,LABELS,INHOME,OFFER,hoursBudgetFor,weekInfo,ensureWeek,hoursLeft,isActive,record,weekState,workedThisWeek,
  offerLimit,offersOut,hasOffer,topicStrength,pitchProjection,pitchOptions,availability,perform,withdrawOffer,
  effort,previewEffort,effortFromSince,weeksSinceWorked,mayCommit,pitchBoost,status,workload,staffPlan,isAuto,setAuto,grandfather};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRecruitingActionSystem};
}else{
 const recruitingActions=makeRecruitingActionSystem({
  getUniverse:()=>universe,clamp,priorities:PRIORITIES,
  scholarshipCapacity:t=>scholarshipCapacity(t),
  unitStrength:(t,pos)=>unitCached(t,pos),
  schemeFit:(t,r)=>recruitSchemeFit(t,r),
  distance:(t,r)=>recruitDistance(t,r),
  recruitBlocked:(t,r)=>recruitBlocked(t,r),
  growRecruiterRelationship:(r,t,gain)=>growRecruiterRelationship(r,t,gain),
  ensureTargeted:(r,t)=>{if(!r.targeted)r.targeted=true;firstRecruitEvaluation(r,t)},
  scheduleVisit:r=>scheduleVisitBeforeRecruitingActions(r)
 });
 globalThis.DynastyRecruitingActions=recruitingActions;
 // Null when the staff have recruiting, so the weekly reminder to spend hours stays quiet.
 globalThis.DynastyRecruitingWeek=t=>t&&!recruitingActions.isAuto(universe)?recruitingActions.weekInfo(t):null;

 // --- engine hooks ---
 recruitEffort=function(r,t){
  const e=recruitingActions.effort(r,t);
  if(e.state==='cooling')passCooled.push(r.id);
  return e;
 };
 userMayCommit=function(r,t){return recruitingActions.mayCommit(r,t)};
 let passCooled=[];
 const recruitPitchBeforeRecruitingActions=recruitPitch;
 recruitPitch=function(t,r){
  const base=recruitPitchBeforeRecruitingActions(t,r);
  if(!r.recruitingActions)return base;
  const boost=recruitingActions.pitchBoost(r,t);
  return boost?base+boost:base;
 };
 // A campus visit costs hours; cancelling one is free but gives nothing back.
 const scheduleVisitBeforeRecruitingActions=scheduleVisit;
 scheduleVisit=function(r){
  if(r.visitWeek)return scheduleVisitBeforeRecruitingActions(r);
  const t=selected(),res=recruitingActions.perform(r,t,'visit');
  setStatus(res.ok?`${res.label}: ${r.name}. ${res.note} ${res.remaining} recruiting hour${res.remaining===1?'':'s'} left.`:res.reason);
 };
 const advanceRecruitingBeforeRecruitingActions=advanceRecruiting;
 advanceRecruiting=function(){
  const t=selected(),playedWeek=universe.week-1;passCooled=[];
  const out=advanceRecruitingBeforeRecruitingActions();
  if(t){
   // The hours ledger still describes the week just played, because the counter has already moved on.
   const w=t.recruitingWeek&&t.recruitingWeek.year===universe.year&&t.recruitingWeek.week===playedWeek?t.recruitingWeek:null;
   t.recruitingLastWeek={year:universe.year,week:playedWeek,spent:w?w.spent:0,budget:recruitingActions.hoursBudgetFor(t),cooled:passCooled.slice(0,12),cooledCount:passCooled.length};
  }
  return out;
 };
 // Universes created from here on never need the migration; only saves that predate the desk do.
 const initUniverseBeforeRecruitingActions=initUniverse;
 initUniverse=function(...args){
  const out=initUniverseBeforeRecruitingActions(...args);
  if(universe)universe.recruitingActions??={version:1,year:universe.year,week:universe.week};
  return out;
 };
 const normalizeUniverseBeforeRecruitingActions=normalizeUniverse;
 normalizeUniverse=function(){
  const out=normalizeUniverseBeforeRecruitingActions();
  try{recruitingActions.grandfather(universe,selected())}catch{}
  return out;
 };
 // The staff work the board before a week plays when the coach has handed recruiting over, and
 // always when the whole season is being simulated (that already hands decisions to the staff).
 const simWeekBeforeRecruitingActions=simWeek;
 simWeek=function(skipDecisions=false){
  if(recruitingActions.isActive()){
   const t=selected(),skipping=skipDecisions===true;
   if(t&&(skipping||recruitingActions.isAuto(universe))&&guidanceActionEligibility(skipping?'simulate-season':'advance-week').allowed)recruitingActions.staffPlan(universe.recruits,t);
  }
  return simWeekBeforeRecruitingActions(skipDecisions);
 };
 // The opening preseason is its own step; hand it over too.
 const beginSeasonBeforeRecruitingActions=beginSeason;
 beginSeason=function(...args){
  const t=selected();
  if(t&&openingPreseason()&&recruitingActions.isActive()&&recruitingActions.isAuto(universe))recruitingActions.staffPlan(universe.recruits,t);
  return beginSeasonBeforeRecruitingActions(...args);
 };

 // --- desk UI ---
 const raEsc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const raRecruit=id=>(universe.recruits||[]).find(x=>String(x.id)===String(id))||null;
 const hoursText=n=>`${n} hour${n===1?'':'s'}`;
 function chipsHTML(r,t){
  const s=recruitingActions.status(r,t),out=[];
  if(s.offered)out.push('<span class="ra-chip ra-ok">Offer out</span>');
  if(s.inHome)out.push('<span class="ra-chip ra-ok">In-home done</span>');
  if(s.ready)out.push('<span class="ra-chip ra-hot">Ready to commit — needs an offer</span>');
  if(s.worked)out.push('<span class="ra-chip ra-ok">Worked this week</span>');
  else if(s.cooling)out.push('<span class="ra-chip ra-warn">Cooling — not worked</span>');
  else if(s.warm)out.push('<span class="ra-chip">Warm — work him this week</span>');
  return out.join('');
 }
 function deskHTML(id){
  if(!universe?.teams)return'';
  const r=raRecruit(id),t=selected();if(!r||!t)return'';
  const w=recruitingActions.weekInfo(t),left=recruitingActions.hoursLeft(t),A=kind=>recruitingActions.availability(r,t,kind);
  const btn=(kind,label)=>{const a=A(kind);return`<button type="button" data-ra-action="${kind}" data-ra-recruit="${raEsc(r.id)}" ${a.ok?'':`disabled title="${raEsc(a.reason)}"`}>${label} · ${recruitingActions.COSTS[kind]}h</button>`};
  const opts=recruitingActions.pitchOptions(r,t);
  const select=`<select data-ra-topic="${raEsc(r.id)}" aria-label="Pitch topic">${opts.map(o=>`<option value="${raEsc(o.topic)}">${raEsc(o.topic)}${o.priority?' (his priority)':''} — ${o.label}</option>`).join('')}</select>`;
  const rec=recruitingActions.record(r,t,false);
  const withdraw=rec.offered&&!r.committed?`<button type="button" class="ra-quiet" data-ra-action="withdraw" data-ra-recruit="${raEsc(r.id)}" title="Takes the offer back. He cools toward you.">Withdraw offer</button>`:'';
  const hist=recruitingActions.status(r,t).history.map(h=>`<span>W${h.week}: ${raEsc(h.kind==='withdraw'?'Offer withdrawn':recruitingActions.LABELS[h.kind]+(h.topic?' · '+h.topic:''))}${h.dI?` · ${h.dI>0?'+':''}${h.dI} interest`:''}</span>`).join('');
  return`<section class="recruiting-desk" data-recruiting-desk="${raEsc(r.id)}"><div class="ra-head"><div><span class="eyebrow">RECRUITING DESK</span><strong>${left} / ${w.budget} hours left this week</strong></div><div class="ra-chips">${chipsHTML(r,t)}</div></div><div class="ra-actions">${btn('call','Call')}<span class="ra-pitch">${select}${btn('pitch','Pitch')}</span>${btn('offer','Offer')}${btn('visit','Visit')}${btn('inhome','In-Home')}${withdraw}</div>${hist?`<div class="ra-history">${hist}</div>`:''}<small class="muted">Sell what he cares about, and only what you can back up: a weak topic costs you interest. He needs an offer before he can commit to you.</small><div class="ra-desk-staff">${staffControlsHTML(recruitingActions.workload(universe.recruits,t))}</div></section>`;
 }
 function announce(res,r){
  const t=selected();
  if(!res.ok){setStatus(res.reason);return}
  const d=[res.dI?`${res.dI>0?'+':''}${res.dI} interest`:'',res.dR?`${res.dR>0?'+':''}${res.dR} relationship`:''].filter(Boolean).join(', ');
  setStatus(`${res.label||'Offer withdrawn'}: ${r.name}.${d?` ${d}.`:''} ${res.note||''} ${hoursText(recruitingActions.hoursLeft(t))} left this week.`.replace(/\s+/g,' ').trim());
 }
 function bindDesk(root=document){
  root.querySelectorAll?.('[data-ra-action]').forEach(b=>{
   if(b.dataset.raBound)return;b.dataset.raBound='1';
   b.onclick=e=>{
    e.preventDefault();e.stopPropagation();
    const r=raRecruit(b.dataset.raRecruit),t=selected(),kind=b.dataset.raAction;if(!r||!t)return;
    const dialog=b.closest?.('#recruitDialog');
    let res;
    if(kind==='withdraw'){if(!confirm(`Withdraw the scholarship offer to ${r.name}? He will cool toward your program.`))return;res=recruitingActions.withdrawOffer(r,t)}
    else if(kind==='visit'){scheduleVisit(r);renderRecruiting();if(dialog){const d=$('#recruitDialog');if(d?.open)d.close();showRecruitProfile(r.id)}return}
    else{const topic=kind==='pitch'?b.parentElement?.querySelector('select')?.value:undefined;res=recruitingActions.perform(r,t,kind,{topic})}
    announce(res,r);
    renderRecruiting();
    if(dialog&&res.ok){const d=$('#recruitDialog');if(d?.open)d.close();showRecruitProfile(r.id)}
   };
  });
 }
 // Staff controls: a one-off "work the board now" and the standing hand-over.
 function staffControlsHTML(work){
  const auto=recruitingActions.isAuto(universe);
  return`<div class="ra-staff"><label class="ra-auto" title="Each week, before it plays, the staff spend any recruiting hours you left unused."><input type="checkbox" data-ra-auto ${auto?'checked':''}><span>Staff handle recruiting</span></label><button type="button" data-ra-staff ${work.left&&work.targets?'':'disabled'}>Work the board now</button></div>`;
 }
 function navHTML(){
  // The workspace paints once at page load, before any dynasty exists.
  if(!universe?.teams)return'';
  const t=selected();if(!t||!recruitingActions.isActive())return'';
  const work=recruitingActions.workload(universe.recruits,t),auto=recruitingActions.isAuto(universe);
  return`<div class="ra-nav"><span class="eyebrow">RECRUITING HOURS</span><strong>${work.left} / ${work.budget} left</strong><small>${work.targets} on the board · ${work.worked} worked · ${auto?'staff cover the rest':`${work.cooling} cooling`} · ${work.ready} ready for an offer · ${work.offersOut}/${work.offerLimit} offers out</small>${staffControlsHTML(work)}${auto?'<small>Each week the staff spend what you leave: calls for everyone, ripe offers, a few pitches. They never book visits or in-homes.</small>':''}</div>`;
 }
 globalThis.DynastyRecruitingDesk={html:deskHTML,nav:navHTML,bind:root=>{bindDesk(root);bindStaff(root)}};
 function stripHTML(t){
  const w=recruitingActions.weekInfo(t),work=recruitingActions.workload(universe.recruits,t),last=t.recruitingLastWeek;
  const lastWeek=last&&last.year===universe.year?`<small>Last week: ${last.spent} of ${last.budget} hours spent${last.cooledCount?` · ${last.cooledCount} target${last.cooledCount===1?'':'s'} cooled (${last.cooled.map(id=>raEsc(raRecruit(id)?.name||'')).filter(Boolean).slice(0,4).join(', ')}${last.cooledCount>4?'…':''})`:' · nobody cooled'}.</small>`:'';
  return`<div class="recruiting-hours-strip"><strong>Recruiting Hours</strong><span>${work.left} / ${w.budget} left this week</span><small>${work.targets} active target${work.targets===1?'':'s'} · ${work.worked} worked this week · ${work.cooling} cooling · ${work.ready} ready for an offer · ${work.offersOut}/${work.offerLimit} offers out</small><small>Call ${recruitingActions.COSTS.call} · Pitch ${recruitingActions.COSTS.pitch} · Offer ${recruitingActions.COSTS.offer} · Visit ${recruitingActions.COSTS.visit} · In-Home ${recruitingActions.COSTS.inhome} hours. Unused hours do not carry over. A target nobody works for two weeks starts to cool.</small>${lastWeek}${staffControlsHTML(work)}</div>`;
 }
 function staffWorkBoard(){
  const out=recruitingActions.staffPlan(universe.recruits,selected());
  setStatus(out.hours?`Staff worked the board: ${out.calls} call${out.calls===1?'':'s'}, ${out.pitches} pitch${out.pitches===1?'':'es'}, ${out.offers} offer${out.offers===1?'':'s'} (${hoursText(out.hours)}).`:'The staff had nothing to add this week.');
  renderRecruiting();
 }
 function toggleAuto(on){
  recruitingActions.setAuto(universe,on);
  setStatus(on?'Staff now handle recruiting. Each week they spend any hours you leave unused; you can still act first.':'Recruiting is back in your hands. Targets nobody works will cool.');
  renderRecruiting();
 }
 function bindStaff(root){
  root.querySelectorAll?.('[data-ra-staff]').forEach(b=>{if(b.dataset.raBound)return;b.dataset.raBound='1';b.onclick=e=>{e.preventDefault();staffWorkBoard()}});
  root.querySelectorAll?.('[data-ra-auto]').forEach(b=>{if(b.dataset.raBound)return;b.dataset.raBound='1';b.onchange=()=>toggleAuto(b.checked)});
 }
 // The summary card is hidden, so the strip gets its own host under the mode switch. Workspace mode
 // shows the same numbers in its sidebar, so the strip only appears in Table mode.
 function renderRecruitingHours(){
  if(!universe?.teams)return;
  const t=selected();if(!t||!recruitingActions.isActive()){$('#raStrip')?.remove();return}
  let host=$('#raStrip');
  if(!host){
   const anchor=$('#rwSwitch')||$('#recruiting > .section-head');if(!anchor)return;
   host=document.createElement('div');host.id='raStrip';anchor.after(host);
  }
  host.innerHTML=stripHTML(t);bindStaff(host);
 }
 extendRender('recruiting',renderRecruitingHours);
 const showRecruitProfileBeforeRecruitingActions=showRecruitProfile;
 showRecruitProfile=function(id){
  showRecruitProfileBeforeRecruitingActions(id);
  const body=$('#recruitDialogBody'),r=raRecruit(id);
  if(r&&body&&!body.querySelector?.('.recruiting-desk')&&!r.committed){body.insertAdjacentHTML?.('afterbegin',deskHTML(id));bindDesk(body)}
 };
}
