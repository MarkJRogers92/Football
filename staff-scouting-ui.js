if(typeof module!=='object'||!module.exports){
 const staffScoutEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function staffScoutingPlayers(t){const seen=new Set(),all=[...(t?.roster||[]),...(universe.playerArchive||[]).filter(p=>p?.recruitingMemory?.scoutingReceipt?.schoolId===t?.id)];return all.filter(p=>p?.id&&!seen.has(p.id)&&seen.add(p.id))}
 function backfillScoutingReceiptCoach(p){
  const snap=p?.recruitingMemory?.scoutingReceipt;if(!snap||snap.recruiterCoachId)return snap;const id=p.primaryRecruiterCoachId||p.recruitingMemory?.primaryRecruiterCoachId||p.recruitingMemory?.recruiterCoachId;if(!id)return snap;snap.recruiterCoachId=id;const found=coachById(id)?.coach;snap.recruiterCoachName=found?.name||null;return snap;
 }
 function tagRecruitReceiptCoach(r,t){
  const snap=r?.recruitingMemory?.scoutingReceipt;if(!snap)return;const id=r.primaryRecruiterCoachId||r.recruitingMemory?.primaryRecruiterCoachId||r.recruitingMemory?.recruiterCoachId||t?.staff?.RC?.id;if(!id)return;snap.recruiterCoachId??=id;snap.recruiterCoachName??=coachById(id)?.coach?.name||null;
 }
 function tagControlledScoutingReceipts(){const t=selected();if(!t)return;for(const r of universe.recruits||[])if(r.committed===t.name)tagRecruitReceiptCoach(r,t);for(const p of staffScoutingPlayers(t))backfillScoutingReceiptCoach(p)}
 function staffRecordFor(c,t){return staffScoutingIdentity.summarizeCoach(c.id,staffScoutingPlayers(t),p=>globalThis.DynastyLabScoutingReceipts?.classifyPlayer?.(p))}
 function profileLine(c){const p=staffScoutingIdentity.profileForCoach(c);return `${p.primary.label} specialist · ${p.secondary.label} secondary`}
 function recordText(rec){if(!rec.settled)return `${rec.label} · no settled evaluations yet`;const pct=Math.round((rec.accuracy||0)*100);return `${rec.label} · ${pct}% on-track · ${rec.diamonds} diamond${rec.diamonds===1?'':'s'} · ${rec.busts} bust${rec.busts===1?'':'s'} · ${rec.settled} settled`}
 function appendStaffScoutingIdentity(t){
  tagControlledScoutingReceipts();const cards=[...($('#staffList')?.querySelectorAll?.('.coach-card')||[])],coaches=Object.values(t.staff||{});cards.forEach((card,i)=>{const c=coaches[i];if(!c||card.querySelector('.staff-scouting-identity'))return;const rec=staffRecordFor(c,t);card.insertAdjacentHTML('beforeend',`<div class="staff-scouting-identity"><span>${staffScoutEscape(profileLine(c))}</span><small>${staffScoutEscape(recordText(rec))}</small></div>`)});
  const list=$('#staffList');if(!list)return;document.querySelector('.staff-scouting-ledger')?.remove();const rows=coaches.map(c=>{const p=staffScoutingIdentity.profileForCoach(c),rec=staffRecordFor(c,t),groupRows=Object.entries(rec.groups).filter(([,x])=>x.settled).sort((a,b)=>b[1].settled-a[1].settled).slice(0,2).map(([k,x])=>`${staffScoutingIdentity.GROUPS.find(g=>g.key===k)?.label||k}: ${x.label}`).join(' · ');return `<div class="staff-scouting-ledger-row"><span><strong>${staffScoutEscape(c.name)}</strong><small>${staffScoutEscape(c.role)} · ${staffScoutEscape(p.primary.label)} specialty</small></span><b>${staffScoutEscape(recordText(rec))}</b>${groupRows?`<small>${staffScoutEscape(groupRows)}</small>`:''}</div>`}).join('');
  list.insertAdjacentHTML('afterend',`<div class="card staff-scouting-ledger"><div class="section-head"><div><div class="eyebrow">SCOUTING REPUTATION</div><h3>Staff Evaluation Ledger</h3></div><span class="muted">Reputation is earned from signing-day receipts versus later observed careers.</span></div>${rows}<div class="small muted">Position specialties improve how quickly manual evaluations tighten. They never reveal hidden ratings or guarantee a prospect is good.</div></div>`);
 }
 const commitRecruitBeforeStaffScoutingIdentity=commitRecruit;
 commitRecruit=function(r,name){const ok=commitRecruitBeforeStaffScoutingIdentity(r,name);if(ok){const t=T(name);if(t&&selected()?.id===t.id)tagRecruitReceiptCoach(r,t)}return ok};
 const renderStaffBeforeStaffScoutingIdentity=renderStaff;
 renderStaff=function(){renderStaffBeforeStaffScoutingIdentity();const t=selected();if(t)appendStaffScoutingIdentity(t)};
 const renderRecruitingBeforeStaffScoutingIdentity=renderRecruiting;
 renderRecruiting=function(){renderRecruitingBeforeStaffScoutingIdentity();tagControlledScoutingReceipts()};
 if(typeof TAB_RENDERERS==='object'){TAB_RENDERERS.staff=renderStaff;TAB_RENDERERS.recruiting=renderRecruiting}
 globalThis.DynastyLabStaffScouting={profile:c=>staffScoutingIdentity.profileForCoach(c),record:(c,t=selected())=>staffRecordFor(c,t),modifier:(t,r)=>staffScoutingIdentity.evaluationModifier(t,r)};
}
