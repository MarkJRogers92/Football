// v0.20 — the offseason used to be seven presses of the same button. Three of its stages hold a real decision, and the
// Next button on This Week now stops once before each of them to say what is at stake and offer the way to act on it.
// Only that button stops: the Offseason screen's own controls, Sim Season and the engine advance as before.
const OFFSEASON_STOP_PHASES=['departures','signing','portal','spring'];
// v0.26 — portal day. When the portal is resolved, each outcome that touches the coach's program is kept in
// universe.portalDay (players leaving first, arrivals last). The stop before spring practice announces them one at a
// time, the way signing day is announced. Every move was already made; announcing changes nothing.
function portalDayLeft(){const d=universe?.portalDay;return d&&d.year===universe.year?d.board.slice(d.revealed||0):[]}
function portalDayShown(){const d=universe?.portalDay;return d&&d.year===universe.year?d.board.slice(0,d.revealed||0):[]}
function revealNextPortal(){const d=universe?.portalDay;if(!d||d.year!==universe.year||(d.revealed||0)>=d.board.length)return null;d.revealed=(d.revealed||0)+1;return d.board[d.revealed-1]}
function portalDayLine(x){
 const who=`${gameEscape(x.pos)} ${gameEscape(x.name)}`;
 if(x.kind==='in')return{good:true,who,what:`joins from ${gameEscape(x.from)}`};
 if(x.kind==='out')return{good:false,who,what:`leaves for ${gameEscape(x.to)}`};
 if(x.kind==='returned')return{good:true,who,what:'found no landing spot and stays'};
 return{good:false,who,what:'found no landing spot and leaves football'};
}
function portalRevealHTML(){
 const shown=portalDayShown(),left=portalDayLeft().length;
 const row=x=>{const l=portalDayLine(x);return`<li class="signing-${l.good?'good':'bad'}"><span>${l.who}</span><strong>${l.what}</strong></li>`};
 return`<ol class="offseason-signing" aria-live="polite">${shown.map(row).join('')}</ol>${left?`<div class="button-row"><button type="button" class="bi-primary" data-offseason-portal="next">Announce the next move</button><button type="button" data-offseason-portal="all">Announce the rest</button></div>`:''}`;
}
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
// v0.28 — the stops used to describe a decision and send the coach to another screen to make it. Each now carries the
// decision itself: NIL deals for the players closest to leaving, releasing commitments when the class is over the
// limit, and pursuing the best fits in the transfer portal. Every action calls the same engine function the full
// screen uses, so the rules (budget, attention, roster room) are enforced in one place. The full screen stays one
// press away for everything the card leaves out.
const STOP_ROWS=5;
const stopSeniors=['SR','RS SR'];
// Sorted by risk before any NIL relief, so a row does not jump when its deal is signed.
function stopRiskRows(t){
 return t.roster.filter(p=>!stopSeniors.includes(eligibilityLabel(p))).map(p=>({p,risk:transferRisk(p),raw:transferRisk(p)+nilRetentionRelief(p),deal:nilDealActive(p,t)}))
  .filter(x=>x.risk>=40||x.deal).sort((a,b)=>b.raw-a.raw||String(a.p.id).localeCompare(String(b.p.id)));
}
function departuresDecideHTML(t){
 const rows=stopRiskRows(t).slice(0,STOP_ROWS),left=nilRemaining(t);
 if(!rows.length)return'';
 const row=x=>{const cost=nilDealCost(x.p,false),who=`${gameEscape(x.p.pos)} ${gameEscape(x.p.name)}`;
  return`<li class="${x.deal?'stop-held':'stop-risk'}"><span class="stop-who">${who}<small>${x.deal?`Risk ${x.risk} with the deal`:`Risk ${x.risk}`}</small></span>${x.deal
   ?`<button type="button" data-stop-nil="${gameEscape(x.p.id)}" aria-pressed="true" aria-label="Release ${who}'s NIL deal (${x.deal.amount} back)">Held · ${x.deal.amount}</button>`
   :`<button type="button" data-stop-nil="${gameEscape(x.p.id)}" aria-pressed="false" ${cost>left?'disabled':''} aria-label="Offer ${who} an NIL deal for ${cost}">Offer NIL · ${cost}</button>`}</li>`};
 return`<div class="stop-decide" role="group" aria-label="Hold players with NIL deals"><div class="stop-decide-head"><span>NIL left this year</span><strong data-stop-budget>${left} of ${nilBudgetFor(t)}</strong></div><ul class="stop-rows">${rows.map(row).join('')}</ul></div>`;
}
// The staff's own cut order (enforceScholarshipLimits): lowest scouted grade and upside first.
function stopCutRows(t){
 return(universe.recruits||[]).filter(r=>r.committed===t.name).sort((a,b)=>(a.scoutUp+a.scout*.55)-(b.scoutUp+b.scout*.55));
}
function signingCutHTML(t){
 const sch=scholarshipSummary(t);if(!sch.over)return'';
 const rows=stopCutRows(t).slice(0,Math.max(STOP_ROWS,sch.over+2));
 const row=r=>{const who=`${'★'.repeat(r.stars||0)} ${gameEscape(r.pos)} ${gameEscape(r.name)}`;
  return`<li class="stop-risk"><span class="stop-who">${who}<small>Scouted ${grade(r.scout)}, upside ${grade(r.scoutUp)}</small></span><button type="button" data-stop-release="${gameEscape(r.id)}" aria-label="Release ${gameEscape(r.name)}'s commitment">Release</button></li>`};
 return`<div class="stop-decide" role="group" aria-label="Release commitments"><div class="stop-decide-head"><span>Over the limit</span><strong>${sch.over}</strong></div><ul class="stop-rows">${rows.map(row).join('')}</ul><p class="stop-note">A released recruit will not come back, and his home region's pipeline notices.</p></div>`;
}
function stopPortalRows(u){
 const fits=portalCandidates().filter(x=>!x.decision&&!x.placed&&x.fromSchoolId!==u.id).map(x=>({x,fit:portalFit(x,u)})).filter(y=>y.fit);
 const targeted=fits.filter(y=>portalTargetFor(y.x.candidateId));
 const rest=fits.filter(y=>!portalTargetFor(y.x.candidateId)).sort((a,b)=>b.fit.score-a.fit.score||b.x.p.perceived-a.x.p.perceived);
 return[...targeted,...rest].slice(0,Math.max(STOP_ROWS,targeted.length));
}
function portalDecideHTML(u){
 const rows=stopPortalRows(u),left=portalAttentionLeft(),cap=ensurePortalCycle().targets.length>=PORTAL_TARGET_CAP;
 if(!rows.length)return'';
 const row=({x})=>{const tg=portalTargetFor(x.candidateId),who=`${gameEscape(x.p.pos)} ${gameEscape(x.p.name)}`,from=portalOrigin(x)?.name||x.from,mine=x.interest?.[u.id];
  const info=`${grade(x.p.perceived)} · ${gameEscape(x.p.year)} · from ${gameEscape(from)}${mine!=null?` · interest ${mine}%`:''}`;
  const btns=tg?`<button type="button" data-stop-att="${gameEscape(x.candidateId)}" data-dir="up" ${left<1||tg.attention>=PORTAL_ATTENTION_MAX?'disabled':''} aria-label="More attention on ${who} (now ${tg.attention})">Attention ${tg.attention} · add</button><button type="button" data-stop-att="${gameEscape(x.candidateId)}" data-dir="drop" aria-label="Stop pursuing ${who}">Drop</button>`
   :`<button type="button" data-stop-att="${gameEscape(x.candidateId)}" data-dir="up" ${left<1||cap?'disabled':''} aria-label="Pursue ${who}">Pursue</button>`;
  return`<li class="${tg?'stop-held':''}"><span class="stop-who">${who}<small>${info}</small></span><span class="stop-btns">${btns}</span></li>`};
 return`<div class="stop-decide" role="group" aria-label="Pursue transfers"><div class="stop-decide-head"><span>Best fits for your program · attention left</span><strong data-stop-budget>${left} of ${PORTAL_ATTENTION_POOL}</strong></div><ul class="stop-rows">${rows.map(row).join('')}</ul></div>`;
}
// Pursuing someone opens the portal's rounds (the same path as Open portal on the Offseason screen); moving on plays
// out whatever rounds are left so the players chased get their answer before the portal is resolved.
function stopPortalPursue(id,dir){
 const c=ensurePortalCycle();
 if(dir==='drop')return untargetPortalCandidate(id);
 if(c.status==='idle')openPortalCycle();
 const tg=portalTargetFor(id);
 return targetPortalCandidate(id,(tg?.attention||0)+1);
}
function stopPortalPlayOut(){
 const c=ensurePortalCycle();
 for(let i=0;i<=PORTAL_ROUNDS&&c.status==='open';i++)advancePortalRound();
}
function offseasonStopState(){
 if(!universe)return null;
 if(!universe.offseasonStops||universe.offseasonStops.year!==universe.year)universe.offseasonStops={year:universe.year,seen:{},open:null};
 return universe.offseasonStops;
}
function offseasonStopFacts(phase,t){
 if(!t)return null;
 if(phase==='departures'){
  const rows=stopRiskRows(t),risks=rows.filter(x=>x.risk>=40),open=universe.offseasonStops?.open==='departures';
  if(!risks.length&&!open)return null;
  if(!risks.length)return{title:'Nobody is close to leaving now',text:`Every player who was at risk has an NIL deal. Deals last this season; you can still release one and get the money back before departures are processed.`,
   act:{label:'See the full list',tab:'offseason'},go:'Process departures',decide:'departures'};
  return{title:`${risks.length} player${risks.length===1?' is':'s are'} close to leaving`,
   text:`Once departures are processed, anyone who enters the portal is gone from your roster. An NIL deal now lowers a player's risk; the money comes from the same budget as recruiting.`,
   act:{label:'See the full list',tab:'offseason'},go:'Process departures',decide:'departures'};
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
  if(!sch.room&&!sch.over)return universe.offseasonStops?.open==='signing'?{title:`Your class fits: ${commits} signee${commits===1?'':'s'}`,text:'Every scholarship is spoken for and nobody is over the limit. Enrolling the class closes this recruiting cycle.',act:{label:'Review the class',tab:'recruiting'},go:'Enroll the class'}:null;
  return{decide:sch.over?'signing':null,title:sch.over?`Your class is ${sch.over} over the limit`:`${sch.room} scholarship${sch.room===1?' is':'s are'} still open`,
   text:sch.over?`${commits} recruits have committed and only ${sch.capacity} can enroll. Release who you choose, lowest-rated listed first.`:`${commits} recruit${commits===1?' has':'s have'} committed. Enrolling the class closes this recruiting cycle; open places are filled with whoever is left.`,
   act:{label:'Review the class',tab:'recruiting'},go:'Enroll the class'};
 }
 if(phase==='portal'){
  const cycle=ensurePortalCycle(),u=selected(),field=portalCandidates().filter(x=>!x.decision).length,targets=(cycle.targets||[]).length,open=universe.offseasonStops?.open==='portal';
  if(!field||(targets&&!open))return null;
  if(targets)return{title:`You are pursuing ${targets} transfer${targets===1?'':'s'}`,
   text:`${portalAttentionLeft()} attention left. Moving on plays out the portal's remaining rounds: each round the players you chase hear from you, then everyone picks a school.`,
   act:{label:'Work the full portal',tab:'offseason'},go:'Resolve the portal',decide:'portal'};
  return{title:`${field} players are in the transfer portal`,
   text:`You have not pursued any of them. You have ${portalAttentionLeft()} attention to spend; these fit your program best. Left alone, your staff take whoever fits and is still available.`,
   act:{label:'Work the full portal',tab:'offseason'},go:'Let the staff handle it',decide:u?'portal':null};
 }
 if(phase==='spring'){
  const d=universe.portalDay;if(!d||d.year!==universe.year||!d.board.length)return null;
  const left=portalDayLeft().length,shown=portalDayShown();
  if(left)return{title:`${d.board.length} portal decision${d.board.length===1?' involves':'s involve'} your program`,
   text:`The transfer portal has closed. Players leaving are announced first and new arrivals last. Every move is already made; announce them one at a time, then start spring practice.`,
   act:{label:'See the roster',tab:'roster'},go:'Start spring practice',portal:true};
  const joined=shown.filter(x=>x.kind==='in').length,lost=shown.filter(x=>x.kind==='out'||x.kind==='left').length,stayed=shown.filter(x=>x.kind==='returned').length;
  return{title:`Portal day: ${joined} joined, ${lost} left`,text:`${stayed?`${stayed} found no landing spot and stay${stayed===1?'s':''}. `:''}Your roster for spring practice is set.`,
   act:{label:'See the roster',tab:'roster'},go:'Start spring practice',portal:true};
 }
 return null;
}
// v0.26: the portal is resolved by the press that follows its stop, so the portal day opens straight after it.
function offseasonStopAfterAdvance(){
 try{
  if(universe?.phase!=='complete'||commissionerMode?.())return false;
  const phase=normalizeOffseasonState().phase,state=offseasonStopState();
  if(phase!=='spring'||state.seen.spring||!portalDayLeft().length)return false;
  state.seen.spring=true;state.open='spring';renderOffseasonStop();
  setStatus(`${universe.portalDay.board.length} portal decisions involve your program.`);return true;
 }catch(err){console.error(err);return false}
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
 card.innerHTML=`${globalThis.DynastyArt?.img(globalThis.DynastyArt.stopKey(open),'dl-art dl-art-stop')||''}<div class="eyebrow">${signing?'SIGNING DAY':facts.portal?'PORTAL DAY':'BEFORE YOU MOVE ON'}</div><h3>${gameEscape(facts.title)}</h3><p>${gameEscape(facts.text)}</p>${facts.decide==='departures'?departuresDecideHTML(t):''}${facts.decide==='signing'?signingCutHTML(t):''}${facts.decide==='portal'?portalDecideHTML(t):''}${signing?signingRevealHTML(t):''}${facts.portal?portalRevealHTML():''}<div class="button-row">${facts.decide?`<button type="button" class="bi-primary" data-offseason-stop-go>${gameEscape(facts.go)}</button><button type="button" data-offseason-stop-act>${gameEscape(facts.act.label)}</button>`:`<button type="button" class="bi-primary" data-offseason-stop-act>${gameEscape(facts.act.label)}</button><button type="button" data-offseason-stop-go>${gameEscape(facts.go)}</button>`}</div>`;
 card.querySelector('[data-offseason-stop-act]').onclick=()=>goToTab(facts.act.tab);
 // Re-render, then put focus back on the row that was acted on (or the first enabled control) so keyboard users keep
 // their place.
 const refocus=(attr,id)=>{const c=$('#offseasonStop');if(!c)return;const same=[...c.querySelectorAll(`[${attr}]`)].filter(b=>b.getAttribute(attr)===id&&!b.disabled);(same[0]||c.querySelector('.stop-rows button:not([disabled])')||c.querySelector('[data-offseason-stop-go]'))?.focus()};
 card.querySelectorAll('[data-stop-nil]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.stopNil,p=t.roster.find(x=>String(x.id)===id);if(!p)return;
  const r=nilDealActive(p,t)?cancelNilDeal(t,p):signNilDeal(t,p,false);
  setStatus(r.ok?(r.refund!=null?`Released ${p.name}'s NIL deal: ${r.refund} back. ${nilSummaryText(t)}.`:`${p.name} signed for ${r.cost}. Risk now ${transferRisk(p)}. ${nilSummaryText(t)}.`):r.reason);
  autosaveAfter('management');renderOffseasonStop();refocus('data-stop-nil',id);
 });
 card.querySelectorAll('[data-stop-release]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.stopRelease,r=(universe.recruits||[]).find(x=>String(x.id)===id);if(!r)return;
  if(pullOffer(r,t.name,'Released at the signing stop'))setStatus(`Released ${r.name}. ${scholarshipSummary(t).over?`${scholarshipSummary(t).over} still over the limit.`:'The class now fits.'}`);
  autosaveAfter('management');renderOffseasonStop();refocus('data-stop-release','');
 });
 card.querySelectorAll('[data-stop-att]').forEach(b=>b.onclick=()=>{
  const id=b.dataset.stopAtt,name=portalEntry(id)?.p.name||'That player',err=stopPortalPursue(id,b.dataset.dir);
  setStatus(err||(b.dataset.dir==='drop'?`Stopped pursuing ${name}. ${portalAttentionLeft()} attention left.`:`Pursuing ${name} (${portalTargetFor(id)?.attention||0}). ${portalAttentionLeft()} attention left.`));
  autosaveAfter('management');renderOffseasonStop();refocus('data-stop-att',id);
 });
 card.querySelectorAll('[data-offseason-sign]').forEach(b=>b.onclick=()=>{
  if(b.dataset.offseasonSign==='all'){for(let i=0;i<40&&mySigningDayLeft(t).length;i++)revealNextSigning()}else revealNextSigning();
  autosaveAfter('management');renderOffseasonStop();if(typeof renderSigningDay==='function')renderSigningDay();
  card.querySelector('[data-offseason-sign="next"]')?.focus();
 });
 card.querySelectorAll('[data-offseason-portal]').forEach(b=>b.onclick=()=>{
  if(b.dataset.offseasonPortal==='all'){for(let i=0;i<80&&portalDayLeft().length;i++)revealNextPortal()}else revealNextPortal();
  autosaveAfter('management');renderOffseasonStop();
  card.querySelector('[data-offseason-portal="next"]')?.focus();
 });
 // The stop is spent, so pressing Next again (here or on the main button) processes the stage.
 card.querySelector('[data-offseason-stop-go]').onclick=()=>{if(open==='portal')stopPortalPlayOut();state.open=null;card.remove();$('#hubAdvance')?.click()};
}
extendRender('dashboard',renderOffseasonStop);
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.offseasonStops=()=>JSON.parse(JSON.stringify(universe?.offseasonStops||null));
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.portalDay=()=>JSON.parse(JSON.stringify(universe?.portalDay||null));
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.offseasonStopFacts=phase=>{const t=selected();return{facts:offseasonStopFacts(phase,t),risks:t.roster.map(p=>transferRisk(p)).sort((a,b)=>b-a).slice(0,5),sch:scholarshipSummary(t),field:portalCandidates().length,targets:(ensurePortalCycle().targets||[]).length,status:ensurePortalCycle().status}};
// The Next button's controller (next-action.js) reaches this module through one global.
globalThis.DynastyOffseasonStop=offseasonStopBeforeAdvance;
globalThis.DynastyOffseasonStopAfter=offseasonStopAfterAdvance;
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
// Test fixture: a portal day of three entries from the coach's own roster (two leaving, one arriving). Entries are
// presentation only, so the fixture moves nobody. The spring stop is re-armed so the next press opens it.
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.portalDayFixture=()=>{
 const t=selected(),[a,b,c]=t.roster,other=universe.teams.find(x=>x.name!==t.name).name,e=(p,kind,from,to)=>({playerId:p.id,name:p.name,pos:p.pos,from,to,kind,reason:'Playing opportunity'});
 universe.portalDay={year:universe.year,board:[e(a,'out',t.name,other),e(b,'returned',t.name,null),e(c,'in',other,t.name)],revealed:0};
 const s=offseasonStopState();s.seen.spring=false;s.open=null;renderOffseasonStop();return universe.portalDay.board.length;
};
// Test fixtures for the v0.28 decisions. Departures: three non-seniors with low morale, so they are at risk. Signing:
// commit uncommitted recruits directly until the class is `n` over its limit.
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.departuresRiskFixture=()=>{
 const t=selected(),ps=t.roster.filter(p=>!stopSeniors.includes(eligibilityLabel(p))).slice(0,3);
 ps.forEach(p=>{p.morale=10});t.nilSpent=0;return ps.map(p=>({id:p.id,risk:transferRisk(p)}));
};
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.signingOverFixture=(n=2)=>{
 const t=selected();
 for(const r of universe.recruits||[]){if(scholarshipSummary(t).over>=n)break;if(r.committed||recruitBlocked(t,r))continue;
  r.committed=t.name;r.commitWeek=universe.week;universe.recruitClassCounts??={};universe.recruitClassCounts[t.name]=classCommitCount(t.name)+1}
 const s=offseasonStopState();s.seen.signing=false;s.open=null;return scholarshipSummary(t);
};
if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.portalStopState=()=>{const c=ensurePortalCycle();return{status:c.status,round:c.round,targets:c.targets.map(x=>({...x})),left:portalAttentionLeft(),decided:portalCandidates().filter(x=>x.decision).length}};
