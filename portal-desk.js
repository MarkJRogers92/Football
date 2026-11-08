// Portal Desk (v0.15.1). The transfer portal already had targets, attention, NIL and promises. The desk
// makes each round a set of decisions the way the Recruiting Desk does for high schoolers: a budget of
// portal hours per round spent on calls, a playing-time pitch, a host visit and a head coach visit; an
// honest read of where you stand with each target (his decision rule is the engine's own); rival
// programs that counter when you get close; and the roster holes you are trying to fill.
//
// Rules live in a pure factory (testable in Node). The browser branch wraps advancePortalRound and
// offerPortalNil and adds the desk to the portal screen. With nobody using it, the portal is unchanged:
// rival counters are decided by a hash, so no gameplay randomness is drawn.
function makePortalDeskSystem(env){
 'use strict';
 const COSTS={call:1,pitch:2,host:4,coach:6};
 const LABELS={call:'Call',pitch:'Pitch playing time',host:'Host visit',coach:'Head coach visit'};
 const CALL_INTEREST=2,HOST_INTEREST=6,COACH_INTEREST=5,COACH_RELATIONSHIP_STEP=25;
 // A rival close to losing him counters once per round: the move adds to its interest at once, and every
 // round it stays unanswered costs you interest. Answering takes the rival's gain back.
 const RIVAL={within:8,chance:45,gain:5,penalty:3,life:2};
 const ANSWERS={visit:['host','coach'],nil:['nil','coach']};
 const RIVAL_LABELS={visit:'hosted him on a visit',nil:'made him an NIL offer'};
 const universe=()=>env.getUniverse(),clamp=env.clamp;
 function hash(v){let h=2166136261>>>0;for(const ch of String(v??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 const teamById=id=>universe().teams.find(t=>t.id===id)||null;

 // ---------- hours ----------
 function hoursFor(t){
  const rc=t?.staff?.RC||{},hc=t?.staff?.HC||{};
  return clamp(Math.round(8+(rc.recruiting||60)*.06+(hc.recruiting||60)*.04),10,16);
 }
 function cycle(){return env.cycle()}
 function roundInfo(t){
  const c=cycle(),budget=hoursFor(t),d=c.desk;
  const spent=d&&d.round===c.round?clamp(Math.round(d.spent||0),0,budget):0;
  return{round:c.round,rounds:env.rounds,status:c.status,budget,spent,left:budget-spent};
 }
 function spend(t,hours){
  const c=cycle(),info=roundInfo(t);
  c.desk={...(c.desk||{}),round:c.round,spent:info.spent+hours};
 }
 function isAuto(){return!!cycle().deskAuto}
 function setAuto(on){cycle().deskAuto=!!on;return!!on}

 // ---------- per-candidate record ----------
 function record(entry){
  entry.desk??={};
  const d=entry.desk;d.rivals=Array.isArray(d.rivals)?d.rivals:[];
  return d;
 }
 function workedThisRound(entry,r=cycle().round){
  const d=entry.desk;
  return!!d&&(d.call===r||d.pitch===r||d.hostRound===r||d.coachRound===r);
 }

 // ---------- what you can see ----------
 // Playing time is the portal's currency. The read uses perceived ratings only (what your staff can see),
 // never his hidden true rating, so it is the same information the coach has.
 function room(t,pos){
  const depth=(t?.roster||[]).filter(p=>p.pos===pos);
  const best=depth.length?Math.max(...depth.map(p=>p.perceived||0)):0;
  return{depth:depth.length,want:env.posCounts[pos]||4,best};
 }
 function pitchRead(entry,t){
  const r=room(t,entry.p.pos),gap=(entry.p.perceived||0)-(r.best||50);
  const short=r.want-r.depth;
  const delta=clamp(Math.round(2+gap*.35+(short>0?2:0)-Math.max(0,-short)*1.5),-3,6);
  const label=delta>=5?'Strong':delta>=3?'Good':delta>=1?'Modest':delta===0?'Flat':'Risky';
  const pos=entry.p.pos,lead=gap>0?`he would be your best ${pos}`:gap>-6?'he would compete for the job':`your ${pos} starter is well ahead of him`;
  const why=short>0?`${lead}${gap>-6?', and':', though'} your ${pos} room is short`:lead;
  return{delta,label,why};
 }
 function needs(t){
  if(!t)return[];
  return Object.keys(env.posCounts).map(pos=>({pos,...room(t,pos)})).map(x=>({...x,short:x.want-x.depth}))
   .filter(x=>x.short>0).sort((a,b)=>b.short-a.short||a.best-b.best).slice(0,5);
 }
 function tags(entry,t){
  if(!t)return[];
  const r=room(t,entry.p.pos),out=[];
  if(r.want>r.depth)out.push('Fills a need');
  if((entry.p.perceived||0)>r.best)out.push('Would start');
  return out;
 }
 // Where you stand: the decision is a weighted choice over finalists, weight exp((interest - best) / 7).
 // The same formula gives the coach his real odds if the player decided now.
 function standing(entry,t){
  const pool=(entry.finalists||[]).map(id=>({id,team:teamById(id),interest:entry.interest?.[id]??0})).filter(x=>x.team);
  if(!pool.length)return{field:[],mine:null,rank:null,odds:0,decideChance:env.commitChance(cycle().round)};
  const best=Math.max(...pool.map(x=>x.interest));let total=0;
  for(const x of pool){x.weight=Math.exp((x.interest-best)/7);total+=x.weight}
  for(const x of pool)x.odds=x.weight/total;
  pool.sort((a,b)=>b.interest-a.interest);
  const mine=t?pool.find(x=>x.id===t.id)||null:null;
  return{field:pool.map(x=>({id:x.id,name:x.team.name,interest:x.interest,odds:x.odds,you:!!mine&&x.id===mine.id})),
   mine:mine?mine.interest:null,rank:mine?pool.indexOf(mine)+1:null,odds:mine?mine.odds:0,
   leader:pool.find(x=>!mine||x.id!==mine.id)||null,decideChance:env.commitChance(cycle().round)};
 }

 // ---------- actions ----------
 function availability(entry,t,action){
  const c=cycle();
  if(!entry||!t)return{ok:false,reason:'No such portal candidate.'};
  if(!COSTS[action])return{ok:false,reason:'Unknown action.'};
  if(c.status!=='open')return{ok:false,reason:'Open the portal first.'};
  if(entry.decision)return{ok:false,reason:`${entry.p.name} has already decided.`};
  if(!(entry.finalists||[]).includes(t.id)&&!env.fit(entry,t))return{ok:false,reason:`${entry.p.name} is not considering your program (no roster room or no fit).`};
  const d=entry.desk||{};
  if(action==='call'&&d.call===c.round)return{ok:false,reason:'Already called him this round.'};
  if(action==='pitch'&&d.pitch===c.round)return{ok:false,reason:'Already pitched him this round.'};
  if(action==='host'&&d.hostRound!=null)return{ok:false,reason:'He has already visited.'};
  if(action==='host'&&!env.targetFor(entry.candidateId))return{ok:false,reason:'Target him first (give him attention).'};
  if(action==='coach'&&d.coachRound!=null)return{ok:false,reason:'Your head coach has already visited him.'};
  const left=roundInfo(t).left;
  if(left<COSTS[action])return{ok:false,reason:`Not enough portal hours (${left} left, needs ${COSTS[action]}).`};
  return{ok:true};
 }
 function join(entry,t){
  if(!(entry.finalists||[]).includes(t.id)){
   const fit=env.fit(entry,t);if(!fit)return false;
   entry.finalists.push(t.id);env.setInterest(entry,t.id,fit.score);
  }
  return true;
 }
 function bump(entry,id,delta){return env.setInterest(entry,id,(entry.interest?.[id]??0)+delta)}
 function answerRivals(entry,how){
  const d=record(entry),r=cycle().round,answered=[];
  for(const m of d.rivals){
   if(m.answered!=null||r-m.round>RIVAL.life)continue;
   if(!(ANSWERS[m.kind]||[]).includes(how))continue;
   m.answered=r;answered.push(m);
   if((entry.finalists||[]).includes(m.schoolId))bump(entry,m.schoolId,-RIVAL.gain);
  }
  return answered;
 }
 function perform(entry,t,action){
  const ok=availability(entry,t,action);if(!ok.ok)return{ok:false,reason:ok.reason};
  if(!join(entry,t))return{ok:false,reason:`${entry.p.name} is not considering your program.`};
  const c=cycle(),d=record(entry);let delta=0;
  if(action==='call'){delta=CALL_INTEREST;d.call=c.round}
  if(action==='pitch'){delta=pitchRead(entry,t).delta;d.pitch=c.round}
  if(action==='host'){delta=HOST_INTEREST;d.hostRound=c.round}
  if(action==='coach'){
   const rel=env.fit(entry,t)?.relationship||20;
   delta=COACH_INTEREST+Math.floor(rel/COACH_RELATIONSHIP_STEP);d.coachRound=c.round;
  }
  spend(t,COSTS[action]);
  const after=bump(entry,t.id,delta),answered=answerRivals(entry,action);
  d.log=[...(d.log||[]),{round:c.round,action,delta}].slice(-8);
  return{ok:true,delta,interest:after,answered:answered.length,cost:COSTS[action]};
 }
 // NIL is the portal's existing lever; an offer answers a rival's NIL counter.
 function noteNil(entry){return entry?answerRivals(entry,'nil').length:0}

 // ---------- rivals ----------
 function liveRivals(entry){
  const r=cycle().round;
  return(entry?.desk?.rivals||[]).filter(m=>m.answered==null&&r-m.round<=RIVAL.life&&!entry.decision);
 }
 // After a round plays: every program still unanswered costs you interest; then rivals close to losing a
 // player you worked this round may counter. Called before the round number advances.
 function settleRound(t){
  const c=cycle();if(!t||c.status!=='open')return{penalties:0,moves:[]};
  let penalties=0;const moves=[];
  for(const entry of env.entries()){
   if(entry.decision||!entry.desk)continue;
   const live=liveRivals(entry).filter(m=>m.round<c.round);
   if(live.length&&(entry.finalists||[]).includes(t.id)){bump(entry,t.id,-RIVAL.penalty*live.length);penalties+=live.length}
  }
  return{penalties,moves};
 }
 // Runs after a round's decisions, for the round just played, so a counter lands on players still deciding.
 function counter(t,round=cycle().round){
  const c=cycle(),moves=[];if(!t||c.status!=='open')return moves;
  for(const entry of env.entries()){
   if(entry.decision||!entry.desk||!workedThisRound(entry,round))continue;
   const mine=entry.interest?.[t.id];if(mine==null)continue;
   const rivals=(entry.finalists||[]).filter(id=>id!==t.id).map(id=>({id,interest:entry.interest?.[id]??0})).sort((a,b)=>b.interest-a.interest);
   const lead=rivals[0];if(!lead||mine<lead.interest-RIVAL.within)continue;
   const h=hash(`${entry.candidateId}|${round}|${lead.id}`);
   if(h%100>=RIVAL.chance)continue;
   const kind=(h>>>8)%2?'nil':'visit',school=teamById(lead.id);
   bump(entry,lead.id,RIVAL.gain);
   const m={schoolId:lead.id,school:school?.name||'A rival',kind,round,answered:null};
   record(entry).rivals.push(m);moves.push({candidateId:entry.candidateId,name:entry.p.name,...m});
  }
  return moves;
 }
 function watch(){
  const out=[];
  for(const entry of env.entries())for(const m of liveRivals(entry))out.push({candidateId:entry.candidateId,name:entry.p.name,pos:entry.p.pos,...m,label:RIVAL_LABELS[m.kind],answerWith:ANSWERS[m.kind]});
  return out;
 }

 // ---------- staff ----------
 // The staff spend what is left: answer rival moves first (a host visit, then the head coach if the visit is
 // used), then call every target, then pitch where the read is Good or better. They never spend the host or
 // head coach visit on their own initiative except to answer a move.
 function staffPlan(t){
  const out={hours:0,calls:0,pitches:0,answers:0};if(!t||cycle().status!=='open')return out;
  const targets=env.entries().filter(e=>!e.decision&&env.targetFor(e.candidateId)).sort((a,b)=>(b.interest?.[t.id]??0)-(a.interest?.[t.id]??0));
  const go=(e,a)=>{const r=perform(e,t,a);if(r.ok)out.hours+=r.cost;return r.ok};
  for(const e of targets)if(liveRivals(e).length){for(const a of ['host','coach']){if(liveRivals(e).some(m=>ANSWERS[m.kind].includes(a))&&go(e,a)){out.answers++;break}}}
  for(const e of targets)if(go(e,'call'))out.calls++;
  for(const e of targets)if(pitchRead(e,t).delta>=3&&go(e,'pitch'))out.pitches++;
  return out;
 }

 return{COSTS,LABELS,RIVAL,ANSWERS,hoursFor,roundInfo,isAuto,setAuto,record,pitchRead,needs,tags,standing,availability,perform,noteNil,liveRivals,settleRound,counter,watch,staffPlan,workedThisRound,hash};
}

if(typeof module==='object'&&module.exports){
 module.exports={makePortalDeskSystem};
}else{
 const portalDesk=makePortalDeskSystem({
  getUniverse:()=>universe,clamp,posCounts:POS_COUNTS,rounds:PORTAL_ROUNDS,
  cycle:()=>ensurePortalCycle(),entries:()=>portalCandidates(),
  fit:(entry,t)=>portalFit(entry,t),setInterest:(entry,id,v)=>portalSetInterest(entry,id,v),
  targetFor:id=>portalTargetFor(id),commitChance:round=>portalCommitChance(round)
 });
 globalThis.DynastyPortalDesk=portalDesk;
 const pdEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=x=>`${Math.round((x||0)*100)}%`;

 const advancePortalRoundBeforeDesk=advancePortalRound;
 advancePortalRound=function(){
  const c=ensurePortalCycle(),t=portalUserTeam();
  if(c.status!=='open'||!t)return advancePortalRoundBeforeDesk();
  let staffNote='';
  if(portalDesk.isAuto()){const s=portalDesk.staffPlan(t);if(s.hours)staffNote=`Staff worked the portal: ${s.calls} call${s.calls===1?'':'s'}, ${s.pitches} pitch${s.pitches===1?'':'es'}, ${s.answers} answer${s.answers===1?'':'s'} (${s.hours}h).`}
  const settled=portalDesk.settleRound(t),played=c.round;
  if(staffNote)portalLog(staffNote);
  if(settled.penalties)portalLog(`${settled.penalties} rival move${settled.penalties===1?'':'s'} went unanswered.`);
  const out=advancePortalRoundBeforeDesk();
  for(const m of portalDesk.counter(t,played))portalLog(`${m.school} ${m.kind==='visit'?'hosted':'made an NIL offer to'} ${m.name}.`);
  return out;
 };
 const offerPortalNilBeforeDesk=offerPortalNil;
 offerPortalNil=function(candidateId){
  const res=offerPortalNilBeforeDesk(candidateId);
  if(!res)portalDesk.noteNil(portalEntry(candidateId));
  return res;
 };

 function actionButton(entry,t,action){
  const a=portalDesk.availability(entry,t,action),answers=portalDesk.liveRivals(entry).some(m=>portalDesk.ANSWERS[m.kind].includes(action));
  const read=action==='pitch'?` · ${portalDesk.pitchRead(entry,t).label}`:'';
  return`<button type="button" class="${answers?'pd-answer':''}" data-pd-act="${action}" data-pd-id="${pdEsc(entry.candidateId)}" ${a.ok?'':`disabled title="${pdEsc(a.reason)}"`}>${portalDesk.LABELS[action]} <small>${portalDesk.COSTS[action]}h${read}</small></button>`;
 }
 function targetCard(entry,t){
  const s=portalDesk.standing(entry,t),read=portalDesk.pitchRead(entry,t),live=portalDesk.liveRivals(entry),tags=portalDesk.tags(entry,t);
  const decided=entry.decision?universe.teams.find(x=>x.id===entry.decision.schoolId):null;
  const field=s.field.slice(0,4).map(x=>`<li class="${x.you?'pd-you':''}"><span>${pdEsc(x.you?'You':x.name)}</span><strong>${x.interest}%</strong><small>${pct(x.odds)}</small></li>`).join('');
  const head=`<div class="pd-card-head"><button class="player-button" data-player="${pdEsc(entry.p.id)}">${pdEsc(entry.p.name)}</button><span class="small muted">${pdEsc(entry.p.pos)} · ${pdEsc(entry.p.year)} · ${grade(entry.p.perceived)}</span>${tags.map(x=>`<span class="pd-tag">${pdEsc(x)}</span>`).join('')}</div>`;
  if(decided)return`<article class="pd-card pd-card--done">${head}<p>${decided.id===t.id?'<strong>Committed to you.</strong>':`Chose ${pdEsc(decided.name)}.`}</p></article>`;
  const where=s.rank==null?'You are not in his running yet.':s.rank===1?`You lead. If he decided now: ${pct(s.odds)} you.`:`You are ${s.rank}${['','st','nd','rd'][s.rank]||'th'}, ${s.field[0].interest-s.mine} behind ${pdEsc(s.field[0].name)}. If he decided now: ${pct(s.odds)} you.`;
  const rivals=live.map(m=>`<li>${pdEsc(m.school)} ${pdEsc(m.kind==='visit'?'hosted him':'made him an NIL offer')} (round ${m.round}). Answer with ${m.kind==='visit'?'a host visit or the head coach':'an NIL offer or the head coach'}.</li>`).join('');
  return`<article class="pd-card">${head}
   <p class="pd-where">${where} <span class="muted">${pct(s.decideChance)} chance he decides this round.</span></p>
   <ul class="pd-field">${field}</ul>
   ${rivals?`<ul class="pd-rivals">${rivals}</ul>`:''}
   <p class="small muted">Playing-time read: <strong>${read.label}</strong> (${pdEsc(read.why)}).</p>
   <div class="pd-actions">${['call','pitch','host','coach'].map(a=>actionButton(entry,t,a)).join('')}</div>
  </article>`;
 }
 function deskHTML(){
  const c=ensurePortalCycle(),t=portalUserTeam();if(!t||c.status==='idle')return needsOnlyHTML(t);
  const info=portalDesk.roundInfo(t),targets=portalCandidates().filter(e=>portalTargetFor(e.candidateId)||(e.decision&&e.decision.schoolId===t.id&&!e.placed));
  const needs=portalDesk.needs(t),watch=portalDesk.watch();
  return`<section class="portal-desk card" id="portalDesk">
   <div class="section-head"><div><div class="eyebrow">PORTAL DESK</div><h3>${c.status==='open'?`Round ${info.round} of ${info.rounds}`:'Portal closed'}</h3></div>
    ${c.status==='open'?`<div class="pd-hours"><strong>${info.left}</strong> / ${info.budget} portal hours left this round</div>`:''}</div>
   ${needsLine(needs)}
   ${watch.length?`<p class="pd-watch"><strong>Rival Watch:</strong> ${watch.map(m=>`${pdEsc(m.school)} on ${pdEsc(m.name)}`).join(' · ')}</p>`:''}
   ${c.status==='open'?`<div class="pd-staff"><label><input type="checkbox" data-pd-auto ${portalDesk.isAuto()?'checked':''}> Staff handle the portal</label><button type="button" class="ghost" data-pd-staff>Work the portal now</button></div>`:''}
   <div class="pd-cards">${targets.length?targets.map(e=>targetCard(e,t)).join(''):'<p class="muted">Give a player attention in the board below to work him here.</p>'}</div>
  </section>`;
 }
 function needsLine(needs){return needs.length?`<p class="pd-needs"><strong>Roster needs:</strong> ${needs.map(n=>`<span class="pd-need">${pdEsc(n.pos)} <small>${n.depth}/${n.want}</small></span>`).join(' ')}</p>`:'<p class="pd-needs muted">No position is below its designed depth.</p>'}
 function needsOnlyHTML(t){
  if(!t)return'';
  return`<section class="portal-desk card" id="portalDesk"><div class="section-head"><div><div class="eyebrow">PORTAL DESK</div><h3>Before the portal opens</h3></div></div>${needsLine(portalDesk.needs(t))}<p class="small muted">Open the portal to get ${portalDesk.hoursFor(t)} portal hours a round for calls, pitches and visits.</p></section>`;
 }
 function bindDesk(root){
  const t=portalUserTeam();
  root.querySelectorAll?.('[data-pd-act]').forEach(b=>b.onclick=e=>{
   e.preventDefault();const entry=portalEntry(b.dataset.pdId),r=portalDesk.perform(entry,t,b.dataset.pdAct);
   setStatus(r.ok?`${portalDesk.LABELS[b.dataset.pdAct]}: ${entry.p.name} ${r.delta>=0?'+':''}${r.delta} interest (now ${r.interest}%).${r.answered?' Rival move answered.':''}`:r.reason);
   renderPortal();
  });
  root.querySelectorAll?.('[data-pd-auto]').forEach(b=>b.onchange=()=>{portalDesk.setAuto(b.checked);setStatus(b.checked?'Staff now spend unused portal hours before each round.':'The portal is back in your hands.');renderPortal()});
  root.querySelectorAll?.('[data-pd-staff]').forEach(b=>b.onclick=e=>{e.preventDefault();const s=portalDesk.staffPlan(t);setStatus(s.hours?`Staff worked the portal: ${s.calls} calls, ${s.pitches} pitches, ${s.answers} answers (${s.hours}h).`:'The staff had nothing to add this round.');renderPortal()});
 }
 const renderPortalBeforeDesk=renderPortal;
 renderPortal=function(){
  renderPortalBeforeDesk();
  const board=$('#portalBoard');if(!board||!universe?.teams)return;
  const anchor=$('#portalPanels');if(!anchor)return;
  $('#portalDesk')?.remove();
  anchor.insertAdjacentHTML?.('afterend',deskHTML());
  const host=$('#portalDesk');if(host){bindDesk(host);attachPlayerLinks()}
 };
}
// Browser tests: play to the portal, open it and target the first players who would consider the program.
if(typeof window!=='undefined'&&globalThis.__DL_TEST__){
 globalThis.__DL_TEST__.portalDeskPrepare=(targets=3)=>{
  if(universe.phase!=='complete'){simSeason();simConferenceChampionships();simBowls();simPlayoff()}
  offseasonReview();offseasonDepartures();openPortalCycle();
  const t=portalUserTeam(),list=portalCandidates().filter(x=>!x.decision&&portalFit(x,t)).slice(0,targets);
  list.forEach(x=>targetPortalCandidate(x.candidateId,2));
  goToTab('offseason');renderPortal();
  return list.map(x=>x.candidateId);
 };
 globalThis.__DL_TEST__.showPlayer=id=>showPlayerProfile(id);
 globalThis.__DL_TEST__.goToTab=tab=>goToTab(tab);
}
