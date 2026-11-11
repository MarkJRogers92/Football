// v0.20 — the offseason used to be seven presses of the same button. Three of its stages hold a real decision, and the
// Next button on This Week now stops once before each of them to say what is at stake and offer the way to act on it.
// Only that button stops: the Offseason screen's own controls, Sim Season and the engine advance as before.
const OFFSEASON_STOP_PHASES=['departures','signing','portal'];
// Signing day entries still to be announced that involve the coach's program, either as the school he committed to
// or as the one trying to flip him. The outcome of each was decided and stored when the board was built.
function mySigningDayLeft(t){
 const s=universe?.signingDay;if(!t||!s||s.year!==universe.year)return[];
 return s.board.slice(s.revealed).filter(x=>x.from===t.name||x.challenger===t.name);
}
// Move the coach's own unannounced entries to the front of the queue. Order is presentation only.
function signingDayMineFirst(t){
 const s=universe?.signingDay;if(!t||!s||s.year!==universe.year)return;
 const done=s.board.slice(0,s.revealed),rest=s.board.slice(s.revealed),mine=x=>x.from===t.name||x.challenger===t.name;
 s.board=[...done,...rest.filter(mine),...rest.filter(x=>!mine(x))];
}
function signingRevealHTML(t){
 const s=universe.signingDay,shown=s.board.slice(0,s.revealed).filter(x=>x.from===t.name||x.challenger===t.name),left=mySigningDayLeft(t).length;
 const row=x=>{const good=(x.flipped&&x.challenger===t.name)||(!x.flipped&&x.from===t.name);return`<li class="signing-${good?'good':'bad'}"><span>${'★'.repeat(x.stars)} ${gameEscape(x.pos)} ${gameEscape(x.name)}</span><strong>${x.flipped?`flips to ${gameEscape(x.challenger)}`:`stays with ${gameEscape(x.from)}`}</strong></li>`};
 return`<ol class="offseason-signing" aria-live="polite">${shown.map(row).join('')}</ol>${left?`<div class="button-row"><button type="button" class="bi-primary" data-offseason-sign="next">Announce the next name</button><button type="button" data-offseason-sign="all">Announce the rest</button></div>`:''}`;
}
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
  const sch=scholarshipSummary(t),commits=(universe.recruits||[]).filter(r=>r.committed===t.name).length,mine=mySigningDayLeft(t);
  // v0.24: signing day's contested commitments are announced here, the coach's own first, before the class enrolls.
  if(mine.length)return{title:`${mine.length} of your recruit${mine.length===1?' is':'s are'} still deciding`,
   text:`${mine.length===1?'He has':'They have'} committed to one program and a rival is still pushing. Each decision was made when the season ended; announce them one at a time, then enroll the class.`,
   act:{label:'Review the class',tab:'recruiting'},go:'Enroll the class',signing:true};
  const sd=universe.signingDay,told=sd?.year===universe.year?sd.board.slice(0,sd.revealed).filter(x=>x.from===t.name||x.challenger===t.name):[];
  if(told.length&&universe.offseasonStops?.open==='signing'){const won=told.filter(x=>(x.flipped&&x.challenger===t.name)||(!x.flipped&&x.from===t.name)).length;
   return{title:`Signing day: you kept or won ${won} of ${told.length}`,text:`Every contested decision involving your program is in. ${sch.over?`Your class is ${sch.over} over the limit; the last to commit will be turned away.`:sch.room?`${sch.room} scholarship${sch.room===1?' is':'s are'} still open and will be filled with whoever is left.`:'The class is full.'}`,
    act:{label:'Review the class',tab:'recruiting'},go:'Enroll the class',signing:true}}
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
  if(facts.signing)signingDayMineFirst(selected());
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
 const t=selected(),signing=facts.signing||(open==='signing'&&universe.signingDay?.year===universe.year&&universe.signingDay.board.slice(0,universe.signingDay.revealed).some(x=>x.from===t?.name||x.challenger===t?.name));
 card.innerHTML=`<div class="eyebrow">${signing?'SIGNING DAY':'BEFORE YOU MOVE ON'}</div><h3>${gameEscape(facts.title)}</h3><p>${gameEscape(facts.text)}</p>${signing?signingRevealHTML(t):''}<div class="button-row"><button type="button" class="bi-primary" data-offseason-stop-act>${gameEscape(facts.act.label)}</button><button type="button" data-offseason-stop-go>${gameEscape(facts.go)}</button></div>`;
 card.querySelector('[data-offseason-stop-act]').onclick=()=>goToTab(facts.act.tab);
 card.querySelectorAll('[data-offseason-sign]').forEach(b=>b.onclick=()=>{
  if(b.dataset.offseasonSign==='all'){for(let i=0;i<40&&mySigningDayLeft(t).length;i++)revealNextSigning()}else revealNextSigning();
  autosaveAfter('management');renderOffseasonStop();if(typeof renderSigningDay==='function')renderSigningDay();
  card.querySelector('[data-offseason-sign="next"]')?.focus();
 });
 // The stop is spent, so pressing Next again (here or on the main button) processes the stage.
 card.querySelector('[data-offseason-stop-go]').onclick=()=>{state.open=null;card.remove();$('#hubAdvance')?.click()};
}
extendRender('dashboard',renderOffseasonStop);
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.offseasonStops=()=>JSON.parse(JSON.stringify(universe?.offseasonStops||null));
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.offseasonStopFacts=phase=>{const t=selected();return{facts:offseasonStopFacts(phase,t),risks:t.roster.map(p=>transferRisk(p)).sort((a,b)=>b-a).slice(0,5),sch:scholarshipSummary(t),field:portalCandidates().length,targets:(ensurePortalCycle().targets||[]).length,status:ensurePortalCycle().status}};
// The Next button's controller (next-action.js) reaches this module through one global.
globalThis.DynastyOffseasonStop=offseasonStopBeforeAdvance;
// Test fixture: a signing day board on which the coach's program is contested. Every entry holds (no flip), so the
// fixture announces decisions without moving any commitment.
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.signingDayFixture=(n=3)=>{
 const t=selected(),rival=universe.teams.find(x=>x.id===t?.rivalry?.rivalId)||universe.teams.find(x=>x.name!==t?.name);
 const mine=(universe.recruits||[]).filter(r=>r.committed===t.name).slice(0,n),theirs=(universe.recruits||[]).filter(r=>r.committed===rival.name).slice(0,1);
 const entry=(r,from,to)=>({recruitId:r.id,name:r.name,pos:r.pos,stars:r.stars,from,challenger:to,pressure:4,odds:20,flipped:false});
 const others=(universe.recruits||[]).filter(r=>r.committed&&r.committed!==t.name&&r.committed!==rival.name).slice(0,3).map(r=>entry(r,r.committed,rival.name));
 universe.signingDay={year:universe.year,board:[...others,...mine.map(r=>entry(r,t.name,rival.name)),...theirs.map(r=>entry(r,rival.name,t.name))],revealed:0};
 return universe.signingDay.board.length;
};
