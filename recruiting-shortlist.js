function makeStaffShortlistSystem(env){
 'use strict';
 const LIMIT=8;
 const num=v=>Number.isFinite(Number(v))?Number(v):0;
 function positionNeeds(team,recruits=[]){
  return Object.entries(env.posCounts||{}).map(([pos,target])=>{
   const returning=(team.roster||[]).filter(p=>p.pos===pos&&env.eligibilityBase(p)<3).length;
   const committed=recruits.filter(r=>r.pos===pos&&r.committed===team.name).length;
   const targeted=recruits.filter(r=>r.pos===pos&&r.targeted&&!r.committed).length;
   const gap=Math.max(0,Math.round(target)-returning-committed);
   const urgency=Math.max(0,gap*18-targeted*4);
   return{pos,target:Math.round(target),returning,committed,targeted,gap,urgency};
  }).sort((a,b)=>b.urgency-a.urgency||b.gap-a.gap||a.pos.localeCompare(b.pos));
 }
 function shortlist(team,recruits=[],limit=LIMIT){
  const needs=Object.fromEntries(positionNeeds(team,recruits).map(x=>[x.pos,x]));
  return recruits.filter(r=>!r.committed).map(r=>{
   const need=needs[r.pos]||{gap:0,urgency:0};
   const verdict=env.staffVerdict(r,team),interest=num(r.interest),pipeline=num(env.pipelineStrength(team,r.homeRegion)),distance=num(env.distance(team,r));
   const proximity=Math.max(0,20-Math.min(20,distance/100));
   const score=verdict.score*.55+need.urgency*.65+interest*.12+pipeline*.06+num(r.stars)*1.6+proximity*.15;
   const reason=[need.gap?`${need.gap} projected ${r.pos} opening${need.gap===1?'':'s'}`:'depth is covered',`${verdict.label} staff grade`,interest>=65?`${Math.round(interest)}% interest`:distance<=250?`${Math.round(distance)} miles away`:null].filter(Boolean).join(' · ');
   return{r,score,need,verdict,reason};
  }).sort((a,b)=>b.score-a.score||(a.r.nationalRank||9999)-(b.r.nationalRank||9999)).slice(0,Math.max(1,Math.min(12,limit)));
 }
 return{LIMIT,positionNeeds,shortlist};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeStaffShortlistSystem};
}else{
 const staffShortlistSystem=makeStaffShortlistSystem({
  posCounts:POS_COUNTS,eligibilityBase,staffVerdict:recruitStaffVerdict,pipelineStrength,distance:recruitDistance
 });
 function staffShortlistHTML(t){
  const needs=staffShortlistSystem.positionNeeds(t,universe.recruits),rows=staffShortlistSystem.shortlist(t,universe.recruits),urgent=needs.filter(x=>x.gap>0).slice(0,6);
  return `<div class="section-head"><div><div class="eyebrow">STAFF ROOM</div><h3>Roster Outlook & Staff Shortlist</h3><div class="muted">Recommendations use projected openings and your current scouting information — never hidden ratings.</div></div></div><div class="roster-need-strip">${urgent.map(x=>`<div class="roster-need${x.gap>=3?' urgent':''}"><strong>${x.pos}</strong><span>${x.gap} need${x.gap===1?'':'s'}</span><small>${x.returning} returning · ${x.committed} committed</small></div>`).join('')||'<span class="muted">No obvious positional shortage after projected departures.</span>'}</div><div class="staff-shortlist-grid">${rows.map((x,i)=>{const r=x.r,rec=recruitScoutingRecord(r,t,false);return `<article class="staff-shortlist-card${r.targeted?' targeted':''}"><div class="staff-shortlist-rank">${i+1}</div><div><button class="player-button" data-recruit="${r.id}">${r.pos} ${r.name}</button><div class="small muted">#${r.nationalRank} · ${'★'.repeat(r.stars)} · ${r.homeCity}, ${r.homeState}</div></div><div class="staff-shortlist-verdict"><strong>${x.verdict.label}</strong><span>${x.verdict.score} · ${x.verdict.conviction}</span></div><div class="small muted staff-shortlist-reason">${x.reason}</div><div class="staff-shortlist-actions"><button type="button" data-shortlist-target="${r.id}">${r.targeted?'On Board':'Add to Board'}</button>${scoutingActionButtonsHTML(r,t)}</div><div class="small muted">${rec.full?'Full evaluation complete':rec.quick?'Film reviewed':'Preliminary evaluation'} · ${x.verdict.confidence}% confidence</div></article>`}).join('')}</div>`;
 }
 function bindStaffShortlist(){
  $$('[data-shortlist-target]').forEach(b=>b.onclick=()=>{const r=universe.recruits.find(x=>String(x.id)===String(b.dataset.shortlistTarget));if(!r)return;r.targeted=!r.targeted;if(r.targeted)firstRecruitEvaluation(r,selected());setStatus(`${r.name} ${r.targeted?'added to':'removed from'} the recruiting board.`);renderRecruiting()});
  bindScoutingActionButtons();attachRecruitLinks();
 }
 function renderStaffShortlist(){
  const t=selected(),summary=$('#classSummary');if(!t||!summary)return;
  let host=$('#staffRecruitShortlist');
  if(!host){summary.insertAdjacentHTML?.('afterend','<div class="card" id="staffRecruitShortlist"></div>');host=$('#staffRecruitShortlist')}
  if(!host)return;host.innerHTML=staffShortlistHTML(t);bindStaffShortlist();
 }
 const renderRecruitingBeforeStaffShortlist=renderRecruiting;
 renderRecruiting=function(){renderRecruitingBeforeStaffShortlist();renderStaffShortlist()};
}
