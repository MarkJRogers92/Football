// v0.20 — the offseason used to be seven presses of the same button. Three of its stages hold a real decision, and the
// Next button on This Week now stops once before each of them to say what is at stake and offer the way to act on it.
// Only that button stops: the Offseason screen's own controls, Sim Season and the engine advance as before.
const OFFSEASON_STOP_PHASES=['departures','signing','portal'];
function offseasonStopState(){
 if(!universe)return null;
 if(!universe.offseasonStops||universe.offseasonStops.year!==universe.year)universe.offseasonStops={year:universe.year,seen:{},open:null};
 return universe.offseasonStops;
}
function offseasonStopFacts(phase,t){
 if(!t)return null;
 if(phase==='departures'){
  const risks=t.roster.map(p=>({p,risk:transferRisk(p)})).filter(x=>x.risk>=40&&!['SR','RS SR'].includes(eligibilityLabel(x.p))).sort((a,b)=>b.risk-a.risk);
  if(!risks.length)return null;
  const names=risks.slice(0,3).map(x=>`${x.p.pos} ${x.p.name} (${x.risk})`).join(', ');
  return{title:`${risks.length} player${risks.length===1?' is':'s are'} close to leaving`,
   text:`${names}${risks.length>3?` and ${risks.length-3} more`:''}. Once departures are processed, anyone who enters the portal is gone from your roster. A conversation or an NIL deal now can still change a mind.`,
   act:{label:'See who is at risk',tab:'offseason'},go:'Process departures'};
 }
 if(phase==='signing'){
  const sch=scholarshipSummary(t),commits=(universe.recruits||[]).filter(r=>r.committed===t.name).length;
  if(!sch.room&&!sch.over)return null;
  return{title:sch.over?`Your class is ${sch.over} over the limit`:`${sch.room} scholarship${sch.room===1?' is':'s are'} still open`,
   text:sch.over?`${commits} recruits have committed and only ${sch.capacity} can enroll. Decide who signs, or the last to commit are turned away.`:`${commits} recruit${commits===1?' has':'s have'} committed. Enrolling the class closes this recruiting cycle; open places are filled with whoever is left.`,
   act:{label:'Review the class',tab:'recruiting'},go:'Enroll the class'};
 }
 if(phase==='portal'){
  const cycle=ensurePortalCycle(),field=portalCandidates().length,targets=(cycle.targets||[]).length;
  if(!field||targets)return null;
  return{title:`${field} players are in the transfer portal`,
   text:`You have not pursued any of them. You have ${portalAttentionLeft()} attention to spend on calls, pitches and visits. Left alone, your staff take whoever fits and is still available.`,
   act:{label:'Work the portal',tab:'offseason'},go:'Let the staff handle it'};
 }
 return null;
}
// True when the press was used to show a stop instead of advancing.
function offseasonStopBeforeAdvance(){
 try{
  if(universe?.phase!=='complete'||commissionerMode?.())return false;
  const os=normalizeOffseasonState(),phase=os.phase,state=offseasonStopState();
  if(!OFFSEASON_STOP_PHASES.includes(phase)||state.seen[phase])return false;
  const facts=offseasonStopFacts(phase,selected());state.seen[phase]=true;
  if(!facts){state.open=null;return false}
  state.open=phase;renderOffseasonStop();setStatus(`${facts.title}. Decide before you move on.`);return true;
 }catch(err){console.error(err);return false}
}
function renderOffseasonStop(){
 const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
 let card=$('#offseasonStop');
 const state=universe?.offseasonStops,phase=universe?.phase==='complete'?normalizeOffseasonState().phase:null,open=state&&state.year===universe.year&&state.open===phase&&phase?phase:null;
 const facts=open?offseasonStopFacts(open,selected()):null;
 if(!facts){if(state&&state.open&&state.open!==phase)state.open=null;card?.remove();return}
 if(!card){card=document.createElement('section');card.id='offseasonStop';card.className='offseason-stop';card.setAttribute('role','region');card.setAttribute('aria-label','Offseason decision');host.insertAdjacentElement('beforebegin',card)}
 card.innerHTML=`<div class="eyebrow">BEFORE YOU MOVE ON</div><h3>${gameEscape(facts.title)}</h3><p>${gameEscape(facts.text)}</p><div class="button-row"><button type="button" class="bi-primary" data-offseason-stop-act>${gameEscape(facts.act.label)}</button><button type="button" data-offseason-stop-go>${gameEscape(facts.go)}</button></div>`;
 card.querySelector('[data-offseason-stop-act]').onclick=()=>goToTab(facts.act.tab);
 // The stop is spent, so pressing Next again (here or on the main button) processes the stage.
 card.querySelector('[data-offseason-stop-go]').onclick=()=>{state.open=null;card.remove();$('#hubAdvance')?.click()};
}
extendRender('dashboard',renderOffseasonStop);
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.offseasonStops=()=>JSON.parse(JSON.stringify(universe?.offseasonStops||null));
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.offseasonStopFacts=phase=>{const t=selected();return{facts:offseasonStopFacts(phase,t),risks:t.roster.map(p=>transferRisk(p)).sort((a,b)=>b-a).slice(0,5),sch:scholarshipSummary(t),field:portalCandidates().length,targets:(ensurePortalCycle().targets||[]).length,status:ensurePortalCycle().status}};
// The Next button's controller (next-action.js) reaches this module through one global.
globalThis.DynastyOffseasonStop=offseasonStopBeforeAdvance;
