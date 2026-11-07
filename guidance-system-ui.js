/* Dynasty Guidance presentation. The model and all simulation gates remain in app.js. */
(()=>{
 'use strict';
 let agendaContext=null;
 const esc=value=>typeof gameEscape==='function'?gameEscape(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const meaningLabel={must_resolve:'Must resolve',decision_due:'Decision due',staff_recommendation:'Staff recommendation',monitoring:'Monitor'};
 const statusLabel={blocked:'Decision required',caution:'Ready with cautions',ready:'Ready to advance'};
 const target=(selector,root=document)=>root.querySelector(selector);
 const agendaButton=id=>[...document.querySelectorAll('[data-guidance-item]')].find(button=>button.dataset.guidanceItem===String(id));
 const currentModel=()=>typeof guidanceModel==='function'?guidanceModel():null;
 const familiarityOf=item=>Math.max(0,Number(item?.familiarity)||0);
 const isKnown=item=>familiarityOf(item)>=2;
 const callGuidance=(name,id)=>{
  if(name==='guidanceMarkFamiliar'&&typeof guidanceMarkFamiliar==='function')return guidanceMarkFamiliar(id);
  if(name==='guidanceDeferItem'&&typeof guidanceDeferItem==='function')return guidanceDeferItem(id);
  if(name==='guidanceRestoreItem'&&typeof guidanceRestoreItem==='function')return guidanceRestoreItem(id);
  return null;
 };

 function explanationHTML(item){
  const content=`<p>${esc(item.cause)}</p><p class="guidance-consequence"><strong>If you wait:</strong> ${esc(item.consequence)}</p>`;
  return isKnown(item)?`<details class="guidance-why"><summary>Why this matters</summary><div>${content}</div></details>`:content;
 }
 function itemHTML(item){
  const boundary=item.boundary?`<span class="guidance-boundary">${esc(item.boundary)}</span>`:'';
  const entity=item.affectedEntity?.label?`<span class="guidance-entity">${esc(item.affectedEntity.label)}</span>`:'';
  const action=item.meaning==='must_resolve'||item.meaning==='decision_due'?'Review decision':item.category==='staffing'?'Open Staff':item.category==='recruiting'||item.category==='roster_management'?'Open Recruiting':'Open item';
  const defer=['staff_recommendation','monitoring'].includes(item.meaning)?`<button type="button" class="guidance-text-action" data-guidance-defer="${esc(item.id)}">Snooze for now</button>`:'';
  return `<article class="guidance-item guidance-${esc(item.meaning)}${item.deferred?' guidance-deferred':''}${item.destination?.focus==='weekly-decision'?' guidance-linked':''}"><div class="guidance-item-top"><span class="guidance-meaning">${esc(meaningLabel[item.meaning]||'Guidance')}</span>${boundary}</div><h3>${esc(item.title)}</h3>${entity}${explanationHTML(item)}<div class="guidance-actions"><button type="button" class="guidance-open" data-guidance-item="${esc(item.id)}">${esc(action)} <span aria-hidden="true">›</span></button>${defer}</div></article>`;
 }
 function snoozedHTML(items){
  if(!items.length)return '';
  return `<details class="guidance-snoozed"><summary>Snoozed for now <span>${items.length}</span></summary><p class="muted small">These are out of the active agenda only. Restoring one does not advance time.</p><div class="guidance-snoozed-list">${items.map(item=>`<div><span><strong>${esc(item.title)}</strong><small>${esc(meaningLabel[item.meaning]||'Guidance')} · ${esc(item.affectedEntity?.label||'Program')}</small></span><button type="button" data-guidance-restore="${esc(item.id)}">Restore</button></div>`).join('')}</div></details>`;
 }
 function renderDeskFocus(model){
  const host=target('#weeklyDeskFocus'),f=model.forecast;if(!host||!f)return;
  const blockers=window.DynastyNextAction?.blockingItems(model)||[],next=blockers[0];
  const label=f.key==='none'?'No advance available':statusLabel[f.status]||'Next boundary';
  const title=next?.title||f.title||f.label;
  const detail=next?`${blockers.length} required decision${blockers.length===1?'':'s'} before the next advance. ${f.title}.`:f.status==='caution'?'You can advance with the current plan. Review open choices in the full briefing if you want to change it.':f.key==='begin-season'?'Opens your first matchup without simulating a game.':f.key==='none'?'Review your program for the next available action.':'Your current plan is ready. The full briefing explains what happens next.';
  host.dataset.status=f.status;
  host.innerHTML=`<span class="weekly-desk-status">${esc(label)}</span><h3>${esc(title)}</h3><p>${esc(detail)}</p>`;
 }
 // Setup reminders stay visible on the weekly desk instead of only inside the full briefing.
 // They are optional: Set up opens the place to act, Later snoozes until the calendar moves.
 function renderSetupNudges(model){
  const focus=target('#weeklyDeskFocus');if(!focus)return;let host=target('#weeklySetupNudges');
  if(!host){host=document.createElement('section');host.id='weeklySetupNudges';host.className='weekly-setup-nudges';host.setAttribute('aria-label','Program setup');focus.insertAdjacentElement('afterend',host)}
  const items=(model.items||[]).filter(x=>!x.deferred&&x.meaning==='staff_recommendation'&&['recruiting','development'].includes(x.category)).slice(0,3);
  host.hidden=!items.length;if(!items.length){host.innerHTML='';return}
  host.innerHTML=`<span class="weekly-setup-label">Worth doing this week</span>${items.map(x=>`<div class="weekly-setup-row" data-setup-category="${esc(x.category)}"><span class="weekly-setup-icon" aria-hidden="true">${x.category==='recruiting'?'◎':'↗'}</span><div><strong>${esc(x.title)}</strong><small>${esc(x.cause)}</small></div><button type="button" class="weekly-setup-go" data-setup-open="${esc(x.id)}">${x.category==='recruiting'?'Recruit':'Develop'}</button><button type="button" class="guidance-text-action" data-setup-later="${esc(x.id)}">Later</button></div>`).join('')}`;
  host.querySelectorAll('[data-setup-open]').forEach(b=>b.addEventListener('click',()=>openGuidanceItem(b.dataset.setupOpen)));
  host.querySelectorAll('[data-setup-later]').forEach(b=>b.addEventListener('click',()=>{callGuidance('guidanceDeferItem',b.dataset.setupLater);renderGuidanceSystem()}));
 }
 function revealDetails(el){if(el?.closest('#dashboard'))window.DynastyDashboardViews?.show('week');for(let parent=el?.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true}
 function renderAgenda(model){
  const host=target('#coachingAgenda');if(!host)return;
  const visible=model.visible||model,leading=visible.leading||model.leading||[],remaining=visible.remaining||model.remaining||[],snoozed=model.snoozed||[];
  const required=(model.items||[]).filter(x=>x.meaning==='must_resolve').length,blockers=model.forecast?.eligibility?.blockers?.length||0,deferred=Math.max(0,required-blockers);
  const quiet=model.quiet?'<p class="guidance-quiet">No required decisions remain. Optional staff recommendations can stay unchanged, or you can advance now.</p>':'';
  const heading=blockers?`${blockers} required before you advance`:deferred?`${deferred} required after this boundary`:model.quiet?'Clear to advance':'What deserves your attention';
  const pill=blockers?`<span class="pill guidance-blocker">${blockers} blocking</span>`:deferred?'<span class="pill guidance-ready">Current advance ready</span>':model.quiet?'<span class="pill guidance-ready">No required decisions</span>':'<span class="pill">Staff view</span>';
  host.innerHTML=`<div class="guidance-head"><div><div class="eyebrow">COACHING AGENDA</div><h3>${heading}</h3></div>${pill}</div>${quiet}${leading.length?`<div class="guidance-list">${leading.map(itemHTML).join('')}</div>`:''}${remaining.length?`<details class="guidance-more"><summary>More to consider <span>${remaining.length}</span></summary><div class="guidance-list">${remaining.map(itemHTML).join('')}</div></details>`:''}${snoozedHTML(snoozed)}`;
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
 function summaryCounts(summary){
  const counts=summary?.counts;
  if(counts&&typeof counts==='object')return Object.entries(counts).filter(([,value])=>Number.isFinite(Number(value))).map(([label,value])=>`${label.charAt(0).toUpperCase()+label.slice(1)}: ${value}`);
  return [['Required',summary?.required],['Due',summary?.due],['In view',summary?.visibleCount??summary?.visible]].filter(([,value])=>Number.isFinite(Number(value))).map(([label,value])=>`${label}: ${value}`);
 }
 // A separate quiet status line leaves the existing news/action channel intact.
 function renderSessionStatus(){
  const status=window.DynastySessionStatus?.read?.();if(!status)return;
  let host=target('#dynastySessionSaveStatus');
  if(!host){
   const topbar=target('#app .topbar');if(!topbar?.insertAdjacentElement)return;
   host=document.createElement('div');host.id='dynastySessionSaveStatus';host.className='dynasty-session-status';
   const text=document.createElement('span');text.dataset.sessionSaveMessage='';text.setAttribute('role','status');text.setAttribute('aria-live','polite');text.setAttribute('aria-atomic','true');
   const retry=document.createElement('button');retry.type='button';retry.textContent='Retry Save';retry.dataset.sessionSaveRetry='';retry.addEventListener('click',()=>{if(typeof saveBrowser==='function')saveBrowser()});
   host.append(text,retry);topbar.insertAdjacentElement('afterend',host);
  }
  host.dataset.state=status.state;
  const text=host.querySelector('[data-session-save-message]');if(text&&text.textContent!==status.message)text.textContent=status.message;
  const retry=host.querySelector('[data-session-save-retry]');if(retry)retry.hidden=status.state!=='failed';
 }
 function syncSessionView(){
  if(!universe)return;
  const programId=selected()?.id,previous=sessionViewRestoredFor;
  if(previous?.target===universe&&previous.slot===activeSaveSlot&&previous.programId===programId)return;
  sessionViewRestoredFor={target:universe,slot:activeSaveSlot,programId};
  if(restoreSessionViewContext())return;
  // Unmatched worlds and programs begin at a neutral view, never an old person's
  // dialog, an advancement button, or the other program's recruiting filters.
  window.DynastyDashboardViews?.show?.('week');window.DynastyRecruitingClasses?.show?.('current');
  window.DynastyLabRecruitingFilters?.reset?.();
  window.DynastyRecruitingWorkspaceView?.restore?.({mode:'workspace',filter:'all',selectedId:'',shown:30});
  for(const [id,value] of [['positionFilter','ALL'],['statsScope','national']]){const control=target('#'+id);if(control)control.value=value}
  if(previous)goToTab('dashboard');
 }
 const rememberViewAfterEvent=()=>{
  if(sessionViewRestoring)return;
  const targetUniverse=universe,slot=activeSaveSlot;
  const remember=()=>{if(universe===targetUniverse&&slot===activeSaveSlot)rememberSessionViewContext()};
  if(typeof queueMicrotask==='function')queueMicrotask(remember);else setTimeout(remember,0);
 };
 document.addEventListener('click',event=>{
  if(event.target?.closest?.('.tabs button,.tab-groups button,[data-client-tab],[data-dash-view],[data-recruit-class],[data-recruit-view],[data-recruit-filter-reset],[data-rwid],[data-rwm],[data-rwf]'))rememberViewAfterEvent();
 });
 document.addEventListener('change',event=>{
  if(SESSION_VIEW_SELECTS.includes(event.target?.id)||event.target?.matches?.('[data-recruit-filter]'))rememberViewAfterEvent();
 });
 document.addEventListener('input',event=>{if(event.target?.id==='rwSearch')rememberViewAfterEvent()});
 window.addEventListener?.('pagehide',rememberSessionViewContext);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')rememberSessionViewContext()});
 window.addEventListener?.('dynasty:save-status',renderSessionStatus);
 function renderReturnSummary(){
  const host=target('#guidanceReturnSummary');if(!host)return;
  const summary=typeof guidanceReturnSummary==='function'?guidanceReturnSummary():null;
  if(!summary){host.innerHTML='';return}
  if(typeof summary==='string'){host.innerHTML=`<div class="guidance-welcome"><div><div class="eyebrow">WELCOME BACK</div><p>${esc(summary)}</p><small>No simulation occurred while you were away.</small></div><button type="button" data-guidance-dismiss-return>Dismiss</button></div>`;return}
  const boundary=summary.boundary?.title||summary.boundary?.label||summary.boundary||summary.forecast?.title||summary.title||'Current coaching boundary';
  const counts=summaryCounts(summary);
  const context=summary.currentLabel?`${summary.currentLabel} · Next: ${boundary}`:boundary;
  const result=summary.lastResult;
  const resultLine=result?`<p class="guidance-welcome-result"><strong>Last result:</strong> ${esc(result.outcome)} ${esc(result.userPts)}–${esc(result.oppPts)} vs ${esc(result.opponent)} <span>· ${esc(result.label)}</span></p>`:summary.resultUnavailable?'<p class="guidance-welcome-result">Postseason result details are available in History.</p>':'';
  const priority=summary.priority?.title?`<p class="guidance-welcome-priority"><strong>Current priority:</strong> ${esc(summary.priority.title)}</p>`:'';
  const choice=summary.pendingChoice?.title?`<p class="guidance-welcome-choice"><strong>${summary.pendingChoice.meaning==='must_resolve'?'Required choice':'Open choice'}:</strong> ${esc(summary.pendingChoice.title)}</p>`:'<p class="guidance-welcome-choice">No pending coaching choice.</p>';
  host.innerHTML=`<div class="guidance-welcome"><div><div class="eyebrow">WELCOME BACK</div><strong>${esc(context)}</strong>${resultLine}${priority}${choice}${counts.length?`<span class="guidance-welcome-counts">${counts.map(esc).join(' · ')}</span>`:''}<small>No simulation occurred while you were away.</small></div><button type="button" data-guidance-dismiss-return>Dismiss</button></div>`;
 }
 function focusDestination(item){
  const destination=item.destination||{},focus=destination.focus;
  if(['scholarship-summary','recruiting-board'].includes(focus))window.DynastyRecruitingClasses?.show(focus==='scholarship-summary'?'summary':'current');
  let el=null;
  if(focus==='weekly-decision'&&destination.decisionId){
   el=[...document.querySelectorAll('[data-decision]')].find(button=>button.dataset.decision===String(destination.decisionId))?.closest('.decision-card')||target('#weeklyDecisions');
  }else if(focus==='career-post')el=target('#careerPost');
  else if(focus==='coach-opening')el=target('#coachMarket');
  else if(focus==='training-focus')el=target('#teamTrainingFocus')?.closest('section,.card,div')||target('#teamTrainingFocus');
  else if(focus==='featured-plans')el=target('.development-plan-board')||target('#development');
  else if(focus==='scholarship-summary')el=target('#classSummary');
  else if(focus==='recruiting-board'){const workspace=target('#recruitWorkspace');if(workspace&&!workspace.hidden){target('[data-rwm="workspace"]')?.click();el=workspace}else el=target('#recruitBody')||target('#classSummary')}
  if(el){revealDetails(el);el.classList.add('guidance-focus-target');el.tabIndex=-1;el.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>el?.focus?.({preventScroll:true}),250);return true}
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
  requestAnimationFrame(()=>{const host=target('#coachingAgenda');revealDetails(host);host?.scrollIntoView({behavior:'smooth',block:'start'});const opener=agendaContext?.itemId?agendaButton(agendaContext.itemId):null;opener?.focus?.({preventScroll:true});agendaContext=null;});
 }
 function openGuidanceItem(id){
  const model=currentModel(),item=model?.items?.find(x=>x.id===id);if(!item){if(typeof setStatus==='function')setStatus('That agenda item is no longer active.');renderGuidanceSystem();return}
  callGuidance('guidanceMarkFamiliar',item.id);
  if(item.destination?.focus==='weekly-decision'&&item.destination.decisionId&&window.DynastyDecisionRoom?.open(item.destination.decisionId))return;
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
 function bindAgenda(){
  const host=target('#coachingAgenda');if(!host)return;
  host.querySelectorAll('[data-guidance-item]').forEach(button=>button.addEventListener('click',()=>openGuidanceItem(button.dataset.guidanceItem)));
  host.querySelectorAll('[data-guidance-defer]').forEach(button=>button.addEventListener('click',()=>{callGuidance('guidanceDeferItem',button.dataset.guidanceDefer);renderGuidanceSystem()}));
  host.querySelectorAll('[data-guidance-restore]').forEach(button=>button.addEventListener('click',()=>{callGuidance('guidanceRestoreItem',button.dataset.guidanceRestore);renderGuidanceSystem()}));
 }
 function bindReturnSummary(){target('#guidanceReturnSummary')?.querySelector('[data-guidance-dismiss-return]')?.addEventListener('click',()=>{if(typeof dismissGuidanceReturnSummary==='function')dismissGuidanceReturnSummary();renderGuidanceSystem()})}
 function renderGuidanceSystem(){syncSessionView();renderSessionStatus();const model=currentModel();if(!model)return;renderDeskFocus(model);renderSetupNudges(model);renderReturnSummary();renderAgenda(model);renderForecast(model);renderPlan(model);bindAgenda();bindReturnSummary()}
 window.renderGuidanceSystem=renderGuidanceSystem;
 window.getDynastyGuidance=currentModel;
 window.openGuidanceItem=openGuidanceItem;
 window.returnToCoachingAgenda=returnToAgenda;
})();
