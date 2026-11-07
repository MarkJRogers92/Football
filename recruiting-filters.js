function makeRecruitingFilterSystem(env){
 'use strict';
 env=env||{};
 const verdictLabels=['Priority take','Take','Strong target','Boardable','Developmental','Pass'];
 function stageOf(r,t){
  if(env.stageOf)return env.stageOf(r,t);
  const rec=env.recordOf?env.recordOf(r,t):null;
  return rec?.full?'FULL_EVALUATION':rec?.quick?'QUICK_FILM':'PRELIMINARY';
 }
 function normalize(state={}){
  const pos=state.pos&&state.pos!=='ALL'?String(state.pos):'ALL';
  const stage=['PRELIMINARY','QUICK_FILM','FULL_EVALUATION'].includes(state.stage)?state.stage:'ALL';
  const verdict=verdictLabels.includes(state.verdict)?state.verdict:'ALL';
  // v0.12.30: home state and a name/school/city search narrow the whole pool before the
  // 220-row display cap, so a prospect outside the top 220 is reachable.
  const homeState=state.state&&state.state!=='ALL'?String(state.state):'ALL';
  const query=String(state.query||'').trim().toLowerCase().slice(0,40);
  return{pos,stage,verdict,state:homeState,query,targetedOnly:!!state.targetedOnly};
 }
 function apply(list=[],state={},team=null){
  const s=normalize(state);
  let out=list.filter(r=>(s.pos==='ALL'||r.pos===s.pos)&&(s.state==='ALL'||r.homeState===s.state)&&(!s.targetedOnly||!!r.targeted)&&(s.stage==='ALL'||stageOf(r,team)===s.stage));
  if(s.query)out=out.filter(r=>[r.name,r.highSchool,r.homeCity].some(v=>String(v||'').toLowerCase().includes(s.query)));
  if(s.verdict!=='ALL'&&env.verdictOf)out=out.filter(r=>env.verdictOf(r,team)?.label===s.verdict);
  return out;
 }
 return{verdictLabels,normalize,stageOf,apply};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRecruitingFilterSystem};
}else{
 const recruitingFilterSystem=makeRecruitingFilterSystem({
  recordOf:(r,t)=>recruitScoutingRecord(r,t,false),
  verdictOf:(r,t)=>recruitStaffVerdict(r,t)
 });
 const RECRUIT_FILTERS_CLEAR={pos:'ALL',stage:'ALL',verdict:'ALL',state:'ALL',query:'',targetedOnly:false};
 let recruitBoardFilters={...RECRUIT_FILTERS_CLEAR},recruitFilterMatchCount=0;
 const sortRecruitsBeforeRecruitingFilters=sortRecruits;
 sortRecruits=function(list){
  const t=selected(),filtered=recruitingFilterSystem.apply(list,recruitBoardFilters,t);
  recruitFilterMatchCount=filtered.length;
  return sortRecruitsBeforeRecruitingFilters(filtered);
 };
 const filterEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function filterOptions(values,current){return values.map(([value,label])=>`<option value="${filterEscape(value)}" ${value===current?'selected':''}>${filterEscape(label)}</option>`).join('')}
 function recruitingTargetCount(){return Array.isArray(universe?.recruits)?universe.recruits.filter(r=>r.targeted).length:0}
 function recruitingBoardViewHTML(){
  const s=recruitingFilterSystem.normalize(recruitBoardFilters),count=recruitingTargetCount();
  const note=s.targetedOnly?(count?`Your board has ${count} targeted recruit${count===1?'':'s'}. Use the filters below to narrow it further.`:'Your board is empty. Target a recruit from All Recruits and they will appear here automatically.'):'Browse the full recruiting pool, then add prospects to My Board as you identify priorities.';
  return `<div class="recruiting-board-view" data-recruiting-board-view><div class="recruiting-board-tabs" role="group" aria-label="Recruiting board view"><button type="button" data-recruit-view="all" class="${s.targetedOnly?'':'active'}" aria-pressed="${s.targetedOnly?'false':'true'}">All Recruits</button><button type="button" data-recruit-view="board" class="${s.targetedOnly?'active':''}" aria-pressed="${s.targetedOnly?'true':'false'}">My Board <span class="recruiting-board-count">${count}</span></button></div><div class="recruiting-board-note">${note}</div></div>`;
 }
 // The board lists at most 220 rows but filters, search and sorting run over the whole pool;
 // say so, and say how much of the pool is still open (after signing day, whoever is left
 // is unsigned). The Workspace reads data-total and data-matching for its own counts.
 function recruitingPoolSummary(){
  const rs=Array.isArray(universe?.recruits)?universe.recruits:[];if(!rs.length)return '';
  const n=v=>v.toLocaleString('en-US'),committed=rs.filter(r=>r.committed).length,open=rs.length-committed,afterSigning=universe.recruitCycle?.year===universe.year;
  return `<span class="recruiting-pool-summary" data-recruit-pool data-total="${rs.length}" data-matching="${recruitFilterMatchCount}" title="Filters, search and sorting cover the whole pool; the table shows the first 220 matches.">Pool ${n(rs.length)} · ${n(committed)} committed · ${n(open)} ${afterSigning?'unsigned':'uncommitted'}</span>`;
 }
 function recruitStateOptions(){
  const set=new Set((Array.isArray(universe?.recruits)?universe.recruits:[]).map(r=>r.homeState).filter(Boolean));
  return[['ALL','All states'],...[...set].sort().map(v=>[v,v])];
 }
 function recruitingFilterHTML(){
  const s=recruitingFilterSystem.normalize(recruitBoardFilters),displayed=Math.min(220,recruitFilterMatchCount),positions=[['ALL','All positions'],...POS.map(p=>[p,p])],stages=[['ALL','All evaluation stages'],['PRELIMINARY','Preliminary'],['QUICK_FILM','Film reviewed'],['FULL_EVALUATION','Full evaluation']],verdicts=[['ALL','All staff verdicts'],...recruitingFilterSystem.verdictLabels.map(v=>[v,v])];
  const clear=s.pos==='ALL'&&s.stage==='ALL'&&s.verdict==='ALL'&&s.state==='ALL'&&!s.query&&!s.targetedOnly;
  return `<div class="recruiting-filter-strip" data-recruiting-filters><label>Position<select data-recruit-filter="pos">${filterOptions(positions,s.pos)}</select></label><label>State<select data-recruit-filter="state">${filterOptions(recruitStateOptions(),s.state)}</select></label><label>Evaluation<select data-recruit-filter="stage">${filterOptions(stages,s.stage)}</select></label><label>Staff Verdict<select data-recruit-filter="verdict">${filterOptions(verdicts,s.verdict)}</select></label><label class="rf-search">Search<input type="search" data-recruit-filter="query" value="${filterEscape(s.query)}" placeholder="Name, school or city" maxlength="40" autocomplete="off"></label><label class="recruiting-filter-toggle"><input type="checkbox" data-recruit-filter="targetedOnly" ${s.targetedOnly?'checked':''}> Targeted only</label><button type="button" data-recruit-filter-reset ${clear?'disabled':''}>Reset</button><div class="recruiting-filter-meta"><span class="recruiting-filter-count"><strong>${displayed}</strong> shown · ${recruitFilterMatchCount} matching</span>${recruitingPoolSummary()}</div></div>`;
 }
 function bindRecruitingFilters(){
  $$('[data-recruit-view]').forEach(el=>el.onclick=()=>{
   recruitBoardFilters={...recruitBoardFilters,targetedOnly:el.dataset.recruitView==='board'};
   renderRecruiting();
  });
  $$('[data-recruit-filter]').forEach(el=>el.onchange=()=>{
   const key=el.dataset.recruitFilter;
   recruitBoardFilters={...recruitBoardFilters,[key]:key==='targetedOnly'?!!el.checked:el.value};
   renderRecruiting();
  });
  const reset=$('[data-recruit-filter-reset]');if(reset)reset.onclick=()=>{recruitBoardFilters={...RECRUIT_FILTERS_CLEAR};renderRecruiting()};
 }
 function renderRecruitingFilters(){
  const root=$('#recruiting'),table=root?.querySelector?.('.table-wrap');if(!root||!table)return;
  const focusKey=document.activeElement?.dataset?.recruitFilter,caret=focusKey==='query'?document.activeElement.selectionStart:null;
  root.querySelector?.('[data-recruiting-board-view]')?.remove();
  root.querySelector?.('[data-recruiting-filters]')?.remove();
  table.insertAdjacentHTML?.('beforebegin',`${recruitingBoardViewHTML()}${recruitingFilterHTML()}`);
  bindRecruitingFilters();
  if(focusKey){const control=[...root.querySelectorAll('[data-recruit-filter]')].find(el=>el.dataset.recruitFilter===focusKey);control?.focus({preventScroll:true});if(caret!=null)control?.setSelectionRange(caret,caret)}
 }
 extendRender('recruiting',renderRecruitingFilters);
 globalThis.DynastyLabRecruitingFilters={
  getState:()=>({...recruitBoardFilters}),
  setState:s=>{recruitBoardFilters=recruitingFilterSystem.normalize({...recruitBoardFilters,...s});renderRecruiting()},
  showAll:()=>{recruitBoardFilters={...recruitBoardFilters,targetedOnly:false};renderRecruiting()},
  showBoard:()=>{recruitBoardFilters={...recruitBoardFilters,targetedOnly:true};renderRecruiting()},
  reset:()=>{recruitBoardFilters={...RECRUIT_FILTERS_CLEAR};renderRecruiting()}
 };
}
