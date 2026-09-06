function makeStaffShortlistSystem(env){
 'use strict';
 const LIMIT=8,MAX_VERDICT_SCORE=99;
 const num=v=>Number.isFinite(Number(v))?Number(v):0;
 const rankRows=(a,b)=>b.score-a.score||(a.r.nationalRank||9999)-(b.r.nationalRank||9999);
 const boundedLimit=limit=>Math.max(1,Math.min(12,limit));
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
 function cheapCandidate(team,r,need){
  const interest=num(r.interest),pipeline=num(env.pipelineStrength(team,r.homeRegion)),distance=num(env.distance(team,r));
  const proximity=Math.max(0,20-Math.min(20,distance/100));
  const base=need.urgency*.65+interest*.12+pipeline*.06+num(r.stars)*1.6+proximity*.15;
  // Staff Verdict is clamped to 99 by the scouting system. This upper bound lets us
  // stop before evaluating prospects who cannot mathematically reach the current cut.
  return{r,need,interest,pipeline,distance,proximity,base,upperBound:base+MAX_VERDICT_SCORE*.55};
 }
 function resolveCandidate(team,c){
  const verdict=env.staffVerdict(c.r,team),score=verdict.score*.55+c.base;
  const reason=[c.need.gap?`${c.need.gap} projected ${c.r.pos} opening${c.need.gap===1?'':'s'}`:'depth is covered',`${verdict.label} staff grade`,c.interest>=65?`${Math.round(c.interest)}% interest`:c.distance<=250?`${Math.round(c.distance)} miles away`:null].filter(Boolean).join(' · ');
  return{r:c.r,score,need:c.need,verdict,reason};
 }
 function candidatesFor(team,recruits,needs){
  return recruits.filter(r=>!r.committed).map(r=>cheapCandidate(team,r,needs[r.pos]||{gap:0,urgency:0}));
 }
 function shortlistExhaustive(team,recruits=[],limit=LIMIT){
  const needs=Object.fromEntries(positionNeeds(team,recruits).map(x=>[x.pos,x])),take=boundedLimit(limit);
  return candidatesFor(team,recruits,needs).map(c=>resolveCandidate(team,c)).sort(rankRows).slice(0,take);
 }
 function shortlist(team,recruits=[],limit=LIMIT){
  const needs=Object.fromEntries(positionNeeds(team,recruits).map(x=>[x.pos,x])),take=boundedLimit(limit);
  const candidates=candidatesFor(team,recruits,needs).sort((a,b)=>b.upperBound-a.upperBound||(a.r.nationalRank||9999)-(b.r.nationalRank||9999));
  const resolved=[];
  for(const c of candidates){
   if(resolved.length>=take){
    resolved.sort(rankRows);
    const cutoff=resolved[take-1];
    // Strictly-less is intentional. At equality the prospect could tie the cut score
    // and win the existing national-rank tiebreak, so that candidate still gets graded.
    if(c.upperBound<cutoff.score)break;
   }
   resolved.push(resolveCandidate(team,c));
  }
  return resolved.sort(rankRows).slice(0,take);
 }
 return{LIMIT,MAX_VERDICT_SCORE,positionNeeds,shortlist,shortlistExhaustive};
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
