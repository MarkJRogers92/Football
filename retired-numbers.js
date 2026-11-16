// v0.36 — retired numbers. A program's greatest players can have their number retired: a permanent mark the coach
// places on purpose. A former player qualifies with a national award or a first-round draft result, having finished
// his college career at this program. One number may be retired each season, twelve in all, so each is a choice.
//
// A retired number is never given to a newcomer (assignTeamJerseys skips it); a player already wearing it keeps it
// until he leaves. State: t.retiredNumbers [{number, playerId, name, pos, year, honour}].
function makeRetiredNumbers(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const MAX=12,SHOW=5;
 const list=t=>Array.isArray(t?.retiredNumbers)?t.retiredNumbers:[];
 function honour(p){
  const awards=(p.awards||[]).map(a=>a.name).filter(Boolean),first=p.draftResult?.round===1;
  if(!awards.length&&!first)return null;
  const best=awards.find(n=>/National Player/i.test(n))||awards[0];
  return{score:awards.length*3+(first?2:0)+(awards.some(n=>/National Player/i.test(n))?3:0),text:[best?`${awards.length>1?`${awards.length} national awards incl. `:''}${best}`:'',first?`first-round pick${p.draftResult.pick?` (#${p.draftResult.pick})`:''}`:''].filter(Boolean).join(' · ')};
 }
 // Former players who could be honoured, best first.
 function candidates(t){
  const taken=new Set(list(t).map(x=>String(x.playerId))),numbers=new Set(list(t).map(x=>Number(x.number))),out=[];
  for(const p of universe().playerArchive||[]){
   if(p.lastTeam!==t.name||taken.has(String(p.id)))continue;
   const n=Number(p.jerseyNumber);if(!Number.isInteger(n)||n<0||n>99||numbers.has(n))continue;
   const h=honour(p);if(h)out.push({playerId:p.id,name:p.name,pos:p.pos,number:n,year:p.retiredYear,honour:h.text,score:h.score});
  }
  return out.sort((a,b)=>b.score-a.score||(b.year||0)-(a.year||0)||String(a.playerId).localeCompare(String(b.playerId)));
 }
 function canRetire(t){
  if(list(t).length>=MAX)return{ok:false,reason:`A program retires at most ${MAX} numbers.`};
  if(list(t).some(x=>x.year===universe().year))return{ok:false,reason:'One number a season.'};
  return{ok:true};
 }
 function retire(t,playerId){
  const can=canRetire(t);if(!can.ok)return can;
  const c=candidates(t).find(x=>String(x.playerId)===String(playerId));if(!c)return{ok:false,reason:'He does not qualify.'};
  (t.retiredNumbers??=[]).push({number:c.number,playerId:c.playerId,name:c.name,pos:c.pos,year:universe().year,honour:c.honour});
  return{ok:true,entry:t.retiredNumbers.at(-1)};
 }
 return{MAX,SHOW,list,candidates,canRetire,retire};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRetiredNumbers};
}else{
 const retiredNumbers=makeRetiredNumbers({getUniverse:()=>universe});
 globalThis.DynastyRetiredNumbers=retiredNumbers;
 const rnEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function retiredNumbersHTML(t){
  const have=retiredNumbers.list(t).slice().sort((a,b)=>a.number-b.number),can=retiredNumbers.canRetire(t),deferred=typeof archiveIsDeferred==='function'&&archiveIsDeferred();
  const cands=deferred?[]:retiredNumbers.candidates(t).slice(0,retiredNumbers.SHOW);
  const row=x=>`<li data-retired="${x.number}"><span class="stop-who"><strong class="rn-number">${x.number}</strong> <button type="button" class="player-button" data-player="${rnEsc(x.playerId)}">${rnEsc(x.pos)} ${rnEsc(x.name)}</button><small>Retired ${x.year} · ${rnEsc(x.honour)}</small></span></li>`;
  const cand=x=>`<li><span class="stop-who"><strong class="rn-number">${x.number}</strong> <button type="button" class="player-button" data-player="${rnEsc(x.playerId)}">${rnEsc(x.pos)} ${rnEsc(x.name)}</button><small>${rnEsc(x.honour)}${x.year?` · left ${x.year}`:''}</small></span><button type="button" class="dw-button" data-retire="${rnEsc(x.playerId)}" ${can.ok?'':'disabled'}>Retire No. ${x.number}</button></li>`;
  return`<div class="section-head"><div><div class="eyebrow">RETIRED NUMBERS</div><h3>${have.length?`${have.length} number${have.length===1?'':'s'} retired`:'No numbers retired'}</h3><div class="muted">Honour a former player with a national award or a first-round draft result. One a season, ${retiredNumbers.MAX} in all; no newcomer wears a retired number.</div></div></div>
  ${have.length?`<ul class="stop-rows">${have.map(row).join('')}</ul>`:''}
  ${deferred?'<p class="small muted">Open History to load past careers, then return to choose.</p>':cands.length?`<h4>Could be honoured${can.ok?'':` <small class="muted">(${rnEsc(can.reason)})</small>`}</h4><ul class="stop-rows rn-candidates">${cands.map(cand).join('')}</ul>`:(have.length?'<p class="small muted">No other former player qualifies right now.</p>':'<p class="small muted">No former player qualifies yet.</p>')}`;
 }
 function renderRetiredNumbers(){
  if(!universe?.teams)return;const t=selected();if(!t)return;
  let host=$('#retiredNumbers');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.getElementById){
   const anchor=document.getElementById('trophyCase')||document.getElementById('coachRivals')||document.getElementById('proPipeline');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='retiredNumbers';host.className='card retired-numbers-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(!host)return;host.innerHTML=retiredNumbersHTML(t);
  host.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));
  host.querySelectorAll('[data-retire]').forEach(b=>b.onclick=()=>{
   const r=retiredNumbers.retire(t,b.dataset.retire);
   if(r.ok){const e=r.entry;universe.events??=[];universe.events.push({id:`EVT_RETIRED_${t.id}_${e.number}`,type:'NUMBER_RETIRED',season:universe.year,week:universe.week,schoolIds:[t.id],playerIds:[e.playerId],coachIds:[],gameIds:[],importance:66,summary:`${t.name} retire No. ${e.number} for ${e.pos} ${e.name}.`,metadata:{number:e.number}});autosaveAfter('management')}
   setStatus(r.ok?`No. ${r.entry.number} is retired for ${r.entry.name}.`:r.reason);renderRetiredNumbers();
  });
 }
 const renderProgramBeforeRetired=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeRetired();renderRetiredNumbers()};
 // Test pages only: a decorated former player in the archive.
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.retiredNumberFixture=()=>{const t=selected();(universe.playerArchive??=[]).push({id:'RNFIX',name:'Legend Fixture',pos:'QB',lastTeam:t.name,retiredYear:universe.year-2,jerseyNumber:12,awards:[{year:universe.year-2,name:'National Player of the Year'}],draftResult:{round:1,pick:3},seasonHistory:[],career:{},stats:{}});renderRetiredNumbers();return 12};
}
