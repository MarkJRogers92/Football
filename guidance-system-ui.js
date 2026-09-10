/* Dynasty Guidance M1 presentation. The model and all simulation gates remain in app.js. */
(()=>{
 'use strict';
 let agendaContext=null;
 const esc=value=>typeof gameEscape==='function'?gameEscape(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const meaningLabel={must_resolve:'Must resolve',decision_due:'Decision due',staff_recommendation:'Staff recommendation',monitoring:'Monitor'};
 const statusLabel={blocked:'Decision required',caution:'Ready with cautions',ready:'Ready to advance'};
 const target=(selector,root=document)=>root.querySelector(selector);
 const agendaButton=id=>[...document.querySelectorAll('[data-guidance-item]')].find(button=>button.dataset.guidanceItem===String(id));
 const currentModel=()=>typeof guidanceModel==='function'?guidanceModel():null;

 function itemHTML(item){
  const boundary=item.boundary?`<span class="guidance-boundary">${esc(item.boundary)}</span>`:'';
  const entity=item.affectedEntity?.label?`<span class="guidance-entity">${esc(item.affectedEntity.label)}</span>`:'';
  const action=item.meaning==='must_resolve'||item.meaning==='decision_due'?'Review decision':item.category==='staffing'?'Open Staff':item.category==='recruiting'||item.category==='roster_management'?'Open Recruiting':'Open item';
  return `<article class="guidance-item guidance-${esc(item.meaning)}"><div class="guidance-item-top"><span class="guidance-meaning">${esc(meaningLabel[item.meaning]||'Guidance')}</span>${boundary}</div><h3>${esc(item.title)}</h3><p>${esc(item.cause)}</p>${entity}<p class="guidance-consequence"><strong>If you wait:</strong> ${esc(item.consequence)}</p><button type="button" class="guidance-open" data-guidance-item="${esc(item.id)}">${esc(action)} <span aria-hidden="true">›</span></button></article>`;
 }
 function renderAgenda(model){
  const host=target('#coachingAgenda');if(!host)return;
  const leading=model.leading||[],remaining=model.remaining||[];
  const required=(model.items||[]).filter(x=>x.meaning==='must_resolve').length,blockers=model.forecast?.eligibility?.blockers?.length||0,deferred=Math.max(0,required-blockers);
  const quiet=model.quiet?'<p class="guidance-quiet">No required decisions remain. Optional staff recommendations can stay unchanged, or you can advance now.</p>':'';
  const heading=blockers?`${blockers} required before you advance`:deferred?`${deferred} required after this boundary`:model.quiet?'Clear to advance':'What deserves your attention';
  const pill=blockers?`<span class="pill guidance-blocker">${blockers} blocking</span>`:deferred?'<span class="pill guidance-ready">Current advance ready</span>':model.quiet?'<span class="pill guidance-ready">No required decisions</span>':'<span class="pill">Staff view</span>';
  host.innerHTML=`<div class="guidance-head"><div><div class="eyebrow">COACHING AGENDA</div><h3>${heading}</h3></div>${pill}</div>${quiet}${leading.length?`<div class="guidance-list">${leading.map(itemHTML).join('')}</div>`:''}${remaining.length?`<details class="guidance-more"><summary>More to consider <span>${remaining.length}</span></summary><div class="guidance-list">${remaining.map(itemHTML).join('')}</div></details>`:''}`;
 }
 function renderForecast(model){
  const host=target('#advanceForecast'),f=model.forecast;if(!host||!f)return;
  const cautions=(model.items||[]).filter(x=>(f.cautions||[]).includes(x.id));
  const blockers=f.eligibility?.blockers||[];
  host.innerHTML=`<div class="forecast-head"><div><div class="eyebrow">ADVANCE FORECAST</div><h3>${esc(f.title||f.label||'Next boundary')}</h3></div><span class="pill forecast-${esc(f.status)}">${esc(statusLabel[f.status]||f.status||'Ready')}</span></div><p class="forecast-label">${esc(f.label||'Advance')}</p><ul>${(f.processes||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${blockers.length?`<div class="forecast-note"><strong>Blocked by:</strong> ${blockers.map(x=>esc(x.message||x.label||'a required decision')).join(' ')}</div>`:''}${cautions.length?`<div class="forecast-note"><strong>Before you go:</strong> ${cautions.map(x=>esc(x.title)).join(' · ')}</div>`:''}`;
 }
 function renderPlan(model){
  const host=target('#currentPlan');if(!host)return;
  host.innerHTML=`<div class="current-plan-head"><div class="eyebrow">CURRENT PLAN</div><span class="muted small">Active settings and commitments</span></div><div class="current-plan-grid">${(model.plan||[]).map(x=>`<div class="current-plan-item"><span>${esc(x.label)}</span><strong>${esc(x.value)}</strong><small>${esc(x.note)}</small></div>`).join('')}</div>`;
 }
 function focusDestination(item){
  const destination=item.destination||{},focus=destination.focus;
  let el=null;
  if(focus==='weekly-decision'&&destination.decisionId){
   el=[...document.querySelectorAll('[data-decision]')].find(button=>button.dataset.decision===String(destination.decisionId))?.closest('.decision-card')||target('#weeklyDecisions');
  }else if(focus==='career-post')el=target('#careerPost');
  else if(focus==='coach-opening')el=target('#coachMarket');
  else if(focus==='scholarship-summary')el=target('#classSummary');
  else if(focus==='recruiting-board')el=target('#recruitBody')||target('#classSummary');
  if(el){el.classList.add('guidance-focus-target');el.tabIndex=-1;el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el?.focus?.({preventScroll:true}),250);return true}
  return false;
 }
 function addReturnControl(item){
  const panel=target('.tab.active');if(!panel)return;
  target('.guidance-return-context',panel)?.remove();
  const context=document.createElement('div');context.className='guidance-return-context';
  const label=document.createElement('span');label.textContent=`From Coaching Agenda: ${item.title}`;
  const button=document.createElement('button');button.type='button';button.className='guidance-return';button.textContent='← Return to Coaching Agenda';button.addEventListener('click',returnToAgenda);
  context.append(label,button);panel.prepend(context);
 }
 function returnToAgenda(){
  document.querySelectorAll('.guidance-return-context').forEach(context=>context.remove());
  if(typeof goToTab==='function')goToTab('dashboard');
  requestAnimationFrame(()=>{const host=target('#coachingAgenda');host?.scrollIntoView({behavior:'smooth',block:'start'});const opener=agendaContext?.itemId?agendaButton(agendaContext.itemId):null;opener?.focus?.({preventScroll:true});agendaContext=null;});
 }
 function openGuidanceItem(id){
  const model=currentModel(),item=model?.items?.find(x=>x.id===id);if(!item){if(typeof setStatus==='function')setStatus('That agenda item is no longer active.');renderGuidanceSystem();return}
  agendaContext={itemId:item.id};
  const destination=item.destination||{};
  if(destination.tab&&typeof goToTab==='function')goToTab(destination.tab);
  requestAnimationFrame(()=>{
   const focused=focusDestination(item);
   if(!focused&&destination.playerId&&typeof showPlayerProfile==='function'&&typeof findPlayer==='function'&&findPlayer(destination.playerId))showPlayerProfile(destination.playerId);
   else if(!focused&&destination.recruitId&&typeof showRecruitProfile==='function'&&universe?.recruits?.some(r=>String(r.id)===String(destination.recruitId)))showRecruitProfile(destination.recruitId);
   addReturnControl(item);
   if(!focused&&!destination.playerId&&!destination.recruitId&&typeof setStatus==='function')setStatus('That destination is unavailable in this dynasty.');
  });
 }
 function bindAgenda(){target('#coachingAgenda')?.querySelectorAll('[data-guidance-item]').forEach(button=>button.addEventListener('click',()=>openGuidanceItem(button.dataset.guidanceItem)))}
 function renderGuidanceSystem(){const model=currentModel();if(!model)return;renderAgenda(model);renderForecast(model);renderPlan(model);bindAgenda()}
 window.renderGuidanceSystem=renderGuidanceSystem;
 window.getDynastyGuidance=currentModel;
 window.openGuidanceItem=openGuidanceItem;
 window.returnToCoachingAgenda=returnToAgenda;
})();
