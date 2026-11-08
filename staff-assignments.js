// Staff assignments (v0.15.1). Every coach on your staff takes a recruiting territory, and the head coach,
// coordinators and strength coach each take a position group to develop. Hiring then matters week to week:
// a strong recruiter makes every contact in his territory count for more, a strong developer lifts his room
// at camp, and losing a coach leaves a specific hole (his territory and his room) until you reassign.
//
// Only the controlled program has assignments, so the rest of the league plays exactly as before, and no
// effect draws gameplay randomness. A save without assignments behaves as it always did.
function makeStaffAssignmentSystem(env){
 'use strict';
 const universe=()=>env.getUniverse(),clamp=env.clamp;
 const GROUPS={QB:{label:'Quarterbacks',pos:['QB'],side:'off'},RB:{label:'Running backs',pos:['RB'],side:'off'},REC:{label:'Receivers & tight ends',pos:['WR','TE'],side:'off'},OL:{label:'Offensive line',pos:['OT','OG','C'],side:'off'},
  DL:{label:'Defensive line',pos:['EDGE','DT'],side:'def'},LB:{label:'Linebackers',pos:['LB'],side:'def'},DB:{label:'Secondary',pos:['CB','S'],side:'def'},ST:{label:'Specialists',pos:['K','P'],side:'any'}};
 const SLOTS=['HC','OC','DC','RC','SC'];
 const SLOT_LABELS={HC:'Head Coach',OC:'Offensive Coordinator',DC:'Defensive Coordinator',RC:'Recruiting Coordinator',SC:'Strength & Performance'};
 // Who may develop what. The recruiting coordinator recruits only.
 const MAY_DEVELOP={HC:()=>true,SC:()=>true,OC:g=>GROUPS[g].side!=='def',DC:g=>GROUPS[g].side!=='off',RC:()=>false};
 // A new territory takes two weeks to learn before contacts there pay the bonus.
 const LEARN_WEEKS=2;
 const groupOf=pos=>Object.keys(GROUPS).find(g=>GROUPS[g].pos.includes(pos))||null;

 function state(t,create=true){
  if(!t)return null;
  if(!t.staffAssignments&&!create)return null;
  t.staffAssignments??={version:1,slots:{}};t.staffAssignments.slots??={};
  return t.staffAssignments;
 }
 function coachIn(t,slot){return t?.staff?.[slot]||null}
 // One row per staff slot: who holds it, what he is assigned, and whether the assignment is still his.
 function rows(t){
  const s=state(t,false),u=universe();
  return SLOTS.map(slot=>{
   const c=coachIn(t,slot),a=s?.slots?.[slot]||null,valid=!!(a&&c&&a.coachId===c.id);
   const learning=valid&&a.region&&a.regionSince&&a.regionSince.year===u.year&&u.week-a.regionSince.week<LEARN_WEEKS;
   return{slot,label:SLOT_LABELS[slot],coach:c,region:valid?a.region:null,group:valid?a.group:null,
    vacated:a&&!valid&&(a.region||a.group)?{name:a.coachName||'A coach',region:a.region,group:a.group}:null,learning:!!learning};
  });
 }
 function assign(t,slot,{region,group}={}){
  if(!t||!SLOTS.includes(slot))return{ok:false,reason:'Unknown staff slot.'};
  const c=coachIn(t,slot);if(!c)return{ok:false,reason:'That position on the staff is empty.'};
  if(region!==undefined&&region!==null&&!env.regions.includes(region))return{ok:false,reason:`Unknown region "${region}".`};
  if(group!==undefined&&group!==null){
   if(!GROUPS[group])return{ok:false,reason:`Unknown position group "${group}".`};
   if(!MAY_DEVELOP[slot](group))return{ok:false,reason:`The ${SLOT_LABELS[slot].toLowerCase()} cannot coach ${GROUPS[group].label.toLowerCase()}.`};
  }
  const s=state(t),others=rows(t).filter(r=>r.slot!==slot);
  if(region&&others.some(r=>r.region===region))return{ok:false,reason:`${region} already has a coach. Each territory gets one.`};
  if(group&&others.some(r=>r.group===group))return{ok:false,reason:`${GROUPS[group].label} already have a coach.`};
  const old=s.slots[slot],kept=old&&old.coachId===c.id?old:{};
  const next={coachId:c.id,coachName:c.name,region:kept.region??null,group:kept.group??null,regionSince:kept.regionSince??null};
  const u=universe();
  if(region!==undefined&&region!==next.region){next.region=region||null;next.regionSince=region?{year:u.year,week:u.week}:null}
  if(group!==undefined)next.group=group||null;
  s.slots[slot]=next;
  return{ok:true,row:rows(t).find(r=>r.slot===slot)};
 }

 // ---------- effects ----------
 // Interest added to a contact that already gained interest, for a recruit in the coach's territory:
 // (recruiting - 50) / 20, capped at 2 (a 70 recruiter adds 1, a 90 adds 2).
 function territoryCoach(r,t){
  if(!r?.homeRegion||!t)return null;
  const row=rows(t).find(x=>x.region===r.homeRegion);
  return row&&!row.learning?row:null;
 }
 function recruitBonus(r,t){
  const row=territoryCoach(r,t);if(!row)return 0;
  return clamp(((row.coach.recruiting||50)-50)/20,0,2);
 }
 // Added to the camp growth modifier for a player in the coach's room: (development - 50) / 200, capped at .2.
 function developBonus(p,t){
  const g=groupOf(p?.pos);if(!g)return null;
  const row=rows(t).find(x=>x.group===g);if(!row)return null;
  return{amount:clamp(((row.coach.development||50)-50)/200,0,.2),coach:row.coach,group:g,slot:row.slot};
 }

 // ---------- staff suggestion ----------
 // Territories where your board is (targets by region), best recruiter first; rooms by need (fewest
 // players against the designed depth, then weakest), best developer first. A starting point, not a rule.
 function suggest(t){
  const u=universe(),plan={};
  const board={};for(const r of u.recruits||[])if(r.targeted&&!r.committed&&r.homeRegion)board[r.homeRegion]=(board[r.homeRegion]||0)+1+(r.stars||0)*.25;
  const regions=env.regions.slice().sort((a,b)=>(board[b]||0)-(board[a]||0));
  const byRecruiting=SLOTS.filter(s=>coachIn(t,s)).sort((a,b)=>(coachIn(t,b).recruiting||0)-(coachIn(t,a).recruiting||0));
  byRecruiting.forEach((slot,i)=>{plan[slot]={region:regions[i]||null,group:null}});
  const need=g=>{const pos=GROUPS[g].pos,depth=(t.roster||[]).filter(p=>pos.includes(p.pos));const want=pos.reduce((n,x)=>n+(env.posCounts[x]||2),0);return(want-depth.length)*3+(70-(depth.length?depth.reduce((n,p)=>n+(p.perceived||0),0)/depth.length:50))/5};
  const groups=Object.keys(GROUPS).filter(g=>g!=='ST').sort((a,b)=>need(b)-need(a)),taken=new Set();
  for(const slot of SLOTS.filter(s=>s!=='RC'&&coachIn(t,s)).sort((a,b)=>(coachIn(t,b).development||0)-(coachIn(t,a).development||0))){
   const g=groups.find(x=>!taken.has(x)&&MAY_DEVELOP[slot](x));if(g){taken.add(g);plan[slot].group=g}
  }
  return plan;
 }
 function applySuggestion(t){
  const plan=suggest(t),s=state(t);
  // Clear first so a swap between two coaches is not refused as a duplicate.
  for(const slot of SLOTS){const c=coachIn(t,slot);if(c&&s.slots[slot]?.coachId===c.id){s.slots[slot].region=null;s.slots[slot].group=null}}
  for(const [slot,p] of Object.entries(plan))assign(t,slot,p);
  return rows(t);
 }
 function vacancies(t){return rows(t).filter(r=>r.vacated)}

 return{GROUPS,SLOTS,SLOT_LABELS,LEARN_WEEKS,MAY_DEVELOP,groupOf,state,rows,assign,recruitBonus,territoryCoach,developBonus,suggest,applySuggestion,vacancies};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeStaffAssignmentSystem};
}else{
 const staffAssignments=makeStaffAssignmentSystem({getUniverse:()=>universe,clamp,posCounts:POS_COUNTS,
  regions:['Atlantic','Great Lakes','Gulf','Heartland','Metro','Mountain','Northeast','Pacific','Southeastern','Southwest']});
 globalThis.DynastyStaffAssignments=staffAssignments;
 const saEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const isMine=t=>t&&t.name===$('#userTeam')?.value;

 // Camp growth: the assigned coach adds to the modifier for his room (controlled program only).
 const resolveDevelopmentCoachingBeforeAssignments=resolveDevelopmentCoaching;
 resolveDevelopmentCoaching=function(t,p){
  const out=resolveDevelopmentCoachingBeforeAssignments(t,p);
  if(!isMine(t))return out;
  const b=staffAssignments.developBonus(p,t);if(!b||!b.amount)return out;
  const modifier=Math.max(-.5,Math.min(.95,out.modifier+b.amount));
  return{...out,modifier:Math.round(modifier*1000)/1000,assignment:{coachName:b.coach.name,group:staffAssignments.GROUPS[b.group].label,support:Math.round(b.amount*1000)/1000},
   summary:`${out.summary} ${b.coach.name} is assigned to coach the ${staffAssignments.GROUPS[b.group].label.toLowerCase()}.`};
 };

 function rowHTML(t,row){
  const regionSel=`<select data-sa-region="${row.slot}" aria-label="${saEsc(row.label)} territory"><option value="">No territory</option>${['Atlantic','Great Lakes','Gulf','Heartland','Metro','Mountain','Northeast','Pacific','Southeastern','Southwest'].map(r=>`<option ${row.region===r?'selected':''}>${r}</option>`).join('')}</select>`;
  const groups=Object.entries(staffAssignments.GROUPS).filter(([g])=>staffAssignments.MAY_DEVELOP[row.slot](g));
  const groupSel=groups.length?`<select data-sa-group="${row.slot}" aria-label="${saEsc(row.label)} position group"><option value="">No position group</option>${groups.map(([g,x])=>`<option value="${g}" ${row.group===g?'selected':''}>${x.label}</option>`).join('')}</select>`:'<span class="small muted">Recruits only</span>';
  const c=row.coach;
  const effect=[row.region&&`${row.learning?'Learning the territory (2 weeks), then ':''}+${Math.min(2,Math.max(0,((c.recruiting||50)-50)/20)).toFixed(1)} interest per contact in ${row.region}`,row.group&&`+${Math.min(.2,Math.max(0,((c.development||50)-50)/200)).toFixed(2)} camp growth for the ${staffAssignments.GROUPS[row.group].label.toLowerCase()}`].filter(Boolean).join(' · ');
  return`<div class="sa-row"><div><strong>${saEsc(c?.name||'Vacant')}</strong><div class="small muted">${saEsc(row.label)} · Recruiting ${c?.recruiting??'—'} · Development ${c?.development??'—'}</div>
   ${row.vacated?`<div class="small sa-vacated">${saEsc(row.vacated.name)} left${row.vacated.region?` (${saEsc(row.vacated.region)})`:''}${row.vacated.group?` (${saEsc(staffAssignments.GROUPS[row.vacated.group]?.label||'')})`:''}. That assignment is open until you reassign it.</div>`:''}
   ${effect?`<div class="small">${saEsc(effect)}</div>`:''}</div><div class="sa-controls">${regionSel}${groupSel}</div></div>`;
 }
 function cardHTML(t){
  const rows=staffAssignments.rows(t);
  return`<div class="card staff-assignments" id="staffAssignments"><div class="section-head"><div><h3>Staff Assignments</h3><div class="small muted">Each coach takes one recruiting territory, and every coach but the recruiting coordinator takes a position group to develop. Each territory and room gets one coach.</div></div><button type="button" class="ghost" data-sa-suggest>Let the staff suggest</button></div>${rows.map(r=>rowHTML(t,r)).join('')}</div>`;
 }
 function bind(root,t){
  root.querySelectorAll?.('[data-sa-region]').forEach(s=>s.onchange=()=>{const r=staffAssignments.assign(t,s.dataset.saRegion,{region:s.value||null});setStatus(r.ok?(s.value?`${r.row.coach.name} now recruits the ${s.value}.`:'Territory cleared.'):r.reason);renderStaff()});
  root.querySelectorAll?.('[data-sa-group]').forEach(s=>s.onchange=()=>{const r=staffAssignments.assign(t,s.dataset.saGroup,{group:s.value||null});setStatus(r.ok?(s.value?`${r.row.coach.name} now coaches the ${staffAssignments.GROUPS[s.value].label.toLowerCase()}.`:'Position group cleared.'):r.reason);renderStaff()});
  root.querySelectorAll?.('[data-sa-suggest]').forEach(b=>b.onclick=e=>{e.preventDefault();staffAssignments.applySuggestion(t);setStatus('Staff assignments set from your board and your roster needs.');renderStaff()});
 }
 extendRender('staff',()=>{
  const t=selected(),host=$('#staffList');if(!t||!host)return;
  $('#staffAssignments')?.remove();
  host.closest?.('.two-col')?.insertAdjacentHTML?.('afterend',cardHTML(t));
  const card=$('#staffAssignments');if(card)bind(card,t);
 });
 // A reminder on This Week when a departure has left an assignment open.
 globalThis.DynastyStaffAssignmentNews=t=>staffAssignments.vacancies(t).map(r=>({type:'alert',tab:'staff',kicker:'STAFF',importance:52,
  main:`${r.vacated.name}'s assignment is open`,sub:`${[r.vacated.region,r.vacated.group&&staffAssignments.GROUPS[r.vacated.group]?.label].filter(Boolean).join(' and ')} ha${r.vacated.region&&r.vacated.group?'ve':'s'} no coach. Reassign it on Staff.`}));
}
