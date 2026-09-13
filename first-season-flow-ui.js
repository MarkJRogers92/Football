// v0.12.4 — first-season coaching flow presentation. Read-only over authoritative gameplay systems.
(()=>{
'use strict';

const Flow=globalThis.DynastyFirstSeasonFlow;
if(!Flow)return;
let lastState=null;
let regrouping=false;
const esc=value=>typeof gameEscape==='function'?gameEscape(value):String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const target=(selector,root=document)=>root.querySelector(selector);
const copy=value=>value==null?value:JSON.parse(JSON.stringify(value));

function firstSeasonIndex(){
  const year=Number(universe?.year)||2027;
  return Math.max(0,year-2027)
}
function currentContext(){
  const team=typeof selected==='function'?selected():null;
  const game=typeof findUserGame==='function'?findUserGame():null;
  const opponent=team&&game&&typeof T==='function'?T(game.home===team.name?game.away:game.home):null;
  const model=typeof guidanceModel==='function'?guidanceModel():null;
  const mode=Flow.guidanceMode({seasonIndex:firstSeasonIndex(),week:Number(universe?.week)||0});
  const agenda=Flow.classifyAgenda(model?.items||[],mode);
  const report=team&&opponent&&typeof v0102WeeklyOpponentReport==='function'?v0102WeeklyOpponentReport(team,opponent):null;
  const prep=team&&opponent&&typeof v0102WeeklyPrepFor==='function'?v0102WeeklyPrepFor(team,opponent.name):null;
  const nextItem=(model?.leading||[])[0]||(model?.items||[])[0]||null;
  const next=nextItem?{id:nextItem.id,label:nextItem.title,destination:copy(nextItem.destination||{})}:{label:model?.forecast?.label||'Advance Week',destination:null};
  const briefing=Flow.buildBriefing({
    mode,
    week:Number(universe?.week)||0,
    opponent:opponent?.name||'',
    agenda,
    scout:report?.observations||[],
    texture:[],
    next
  });
  const personnelPending=(model?.items||[]).some(item=>item.category==='roster_management'&&['must_resolve','decision_due'].includes(item.meaning));
  const gamedayReady=Boolean(game)&&!(model?.forecast?.eligibility?.blockers||[]).length;
  const prepPath=Flow.buildPrepPath({
    hasGame:Boolean(game),
    opponentReviewed:Boolean(prep),
    requiredCount:agenda.required.length,
    prepSet:Boolean(prep),
    personnelPending,
    gamedayReady,
    gameStarted:Boolean(typeof v2InteractiveGameDay!=='undefined'&&v2InteractiveGameDay)
  });
  return{mode,team:team?.name||null,opponent:opponent?.name||null,briefing,agenda,prepPath,report:report?{observations:[...(report.observations||[])],confidence:report.confidence,confidenceLabel:report.confidenceLabel}:null,prep:prep?copy(prep):null,next}
}

function ensureBriefingHost(){
  let host=target('#firstSeasonBriefing');
  if(host)return host;
  const agenda=target('#coachingAgenda');if(!agenda)return null;
  host=document.createElement('section');host.id='firstSeasonBriefing';host.className='first-season-briefing';host.setAttribute('aria-label','Week opening briefing');
  agenda.insertAdjacentElement('beforebegin',host);
  return host
}
function renderBriefing(state){
  const host=ensureBriefingHost();if(!host)return;
  const briefing=state.briefing;
  const modeLabel=state.mode==='explicit'?'Guided':state.mode==='concise'?'Condensed':'Coach view';
  const bullets=(briefing.bullets||[]).map(item=>`<li class="first-season-briefing-item first-season-${esc(item.kind)}"><span aria-hidden="true"></span><p>${esc(item.text)}</p></li>`).join('');
  const next=briefing.next?.label?`<div class="first-season-next"><span>Next</span><strong>${esc(briefing.next.label)}</strong>${briefing.next.id?`<button type="button" data-first-season-next="${esc(briefing.next.id)}">Open</button>`:''}</div>`:'';
  host.innerHTML=`<div class="first-season-briefing-head"><div><div class="eyebrow">WEEK OPENING</div><h3>${esc(briefing.title)}</h3></div><span class="pill">${esc(modeLabel)}</span></div><p class="first-season-briefing-summary">${esc(briefing.summary)}</p>${bullets?`<ul>${bullets}</ul>`:''}${next}`;
  host.querySelector('[data-first-season-next]')?.addEventListener('click',event=>window.openGuidanceItem?.(event.currentTarget.dataset.firstSeasonNext))
}

function groupHeading(key,count){
  const meta={
    required:['Required','Must be resolved before the relevant boundary.'],
    recommended:['Recommended','Decisions and staff advice worth handling this week.'],
    optional:['Optional','Useful context that can safely wait.']
  }[key];
  return`<div class="guidance-flow-group-head"><div><strong>${meta[0]}</strong><small>${meta[1]}</small></div><span>${count}</span></div>`
}
function regroupAgenda(state){
  const host=target('#coachingAgenda');
  if(!host||regrouping||state.mode==='normal')return;
  regrouping=true;
  try{
    host.querySelectorAll('[data-guidance-group]').forEach(section=>section.remove());
    const articles=[...host.querySelectorAll('article.guidance-item')];
    const byId=new Map();
    for(const article of articles){const id=article.querySelector('[data-guidance-item]')?.dataset.guidanceItem;if(id)byId.set(String(id),article)}
    host.querySelectorAll(':scope > .guidance-list,:scope > .guidance-more').forEach(node=>node.remove());
    const snoozed=host.querySelector(':scope > .guidance-snoozed');
    for(const key of ['required','recommended','optional']){
      const items=state.agenda[key]||[],section=document.createElement('section');
      section.className=`guidance-flow-group guidance-flow-${key}`;section.dataset.guidanceGroup=key;
      section.innerHTML=groupHeading(key,items.length);
      const list=document.createElement('div');list.className='guidance-list guidance-flow-list';
      for(const item of items){const article=byId.get(String(item.id));if(article)list.append(article)}
      if(!list.children.length){const empty=document.createElement('p');empty.className='guidance-flow-empty';empty.textContent='None right now.';list.append(empty)}
      section.append(list);
      if(snoozed)host.insertBefore(section,snoozed);else host.append(section)
    }
    host.dataset.firstSeasonMode=state.mode;
  }finally{regrouping=false}
}

function ensurePrepPathHost(){
  let host=target('#firstSeasonPrepPath');if(host)return host;
  const coaching=target('#v0102WeeklyCoaching'),matchup=target('#v2MatchupIntelligence');
  const anchor=coaching||matchup;if(!anchor)return null;
  host=document.createElement('section');host.id='firstSeasonPrepPath';host.className='card first-season-prep-path';host.setAttribute('aria-label','Game week preparation path');
  anchor.insertAdjacentElement('beforebegin',host);return host
}
function stageTarget(key){
  if(key==='opponent'||key==='prep')return target('#v0102WeeklyCoaching');
  if(key==='decisions')return target('#weeklyDecisions');
  if(key==='personnel')return target('#weeklyDecisions')||target('#depth');
  if(key==='gameday')return target('#simDetailedGame')||target('[data-v2-gameday-start]');
  return null
}
function openStage(key){
  if(key==='decisions'){if(typeof goToTab==='function')goToTab('dashboard')}
  else if(key==='personnel'){if(typeof goToTab==='function')goToTab('dashboard')}
  else if(key==='opponent'||key==='prep'||key==='gameday'){if(typeof goToTab==='function')goToTab('gamelab')}
  requestAnimationFrame(()=>{const el=stageTarget(key);el?.scrollIntoView?.({behavior:'smooth',block:'center'});if(el){el.tabIndex=-1;el.focus?.({preventScroll:true})}})
}
function renderPrepPath(state){
  const host=ensurePrepPathHost();if(!host)return;
  if(!state.prepPath?.hasGame){host.hidden=true;return}
  host.hidden=false;
  const stages=state.prepPath.stages.map((stage,index)=>`<button type="button" class="first-season-stage first-season-stage-${esc(stage.status)}" data-flow-stage="${esc(stage.key)}"><span class="first-season-stage-index">${index+1}</span><span><strong>${esc(stage.label)}</strong><small>${esc(stage.status)}</small></span></button>`).join('');
  host.innerHTML=`<div class="section-head"><div><div class="eyebrow">GAME WEEK PATH</div><h3>${esc(state.opponent?`Prepare for ${state.opponent}`:'Prepare for Game Day')}</h3><div class="muted">A route through existing coaching tools—not a second set of decisions.</div></div></div><div class="first-season-stage-list">${stages}</div>`;
  host.querySelectorAll('[data-flow-stage]').forEach(button=>button.addEventListener('click',()=>openStage(button.dataset.flowStage)))
}

function renderFirstSeasonFlow({prep=true}={}){
  if(!universe)return null;
  const state=currentContext();lastState=state;
  renderBriefing(state);regroupAgenda(state);if(prep)renderPrepPath(state);
  return state
}

const guidanceBeforeFirstSeason=window.renderGuidanceSystem;
if(typeof guidanceBeforeFirstSeason==='function')window.renderGuidanceSystem=function renderGuidanceWithFirstSeasonFlow(){
  const out=guidanceBeforeFirstSeason();renderFirstSeasonFlow({prep:false});return out
};

if(typeof TAB_RENDERERS==='object'&&typeof TAB_RENDERERS.gamelab==='function'){
  const gameLabBeforeFirstSeason=TAB_RENDERERS.gamelab;
  TAB_RENDERERS.gamelab=()=>{gameLabBeforeFirstSeason();renderFirstSeasonFlow({prep:true})}
}

window.renderFirstSeasonFlow=renderFirstSeasonFlow;
window.getFirstSeasonFlow=()=>copy(lastState||currentContext());
if(globalThis.__DL_TEST__)globalThis.__DL_TEST__.firstSeasonFlow=()=>copy(lastState||currentContext());
})();
