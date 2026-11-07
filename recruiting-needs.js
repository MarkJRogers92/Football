// Counts only: targets and rising watches never count as enrolled players.
function rosterOutlook(snap={},posCounts={}){
 return Object.entries(posCounts).map(([pos,target])=>{
  const players=(snap.players||[]).filter(p=>p.pos===pos),current=players.length;
  const departing=snap.departuresDone?0:players.filter(p=>p.year==='SR').length,returning=current-departing;
  const committed=snap.enrolled?0:snap.committed?.[pos]||0,targeted=snap.targeted?.[pos]||0,watched=snap.watched?.[pos]||0,projected=returning+committed;
  return{pos,target,current,departing,returning,committed,targeted,watched,projected,gap:Math.max(0,target-projected)};
 });
}
if(typeof module==='object'&&module.exports)module.exports={rosterOutlook};
else // Roster needs — read-only Recruiting-tab card. Thin groups are derived from the
// engine's designed roster shape (POS_COUNTS) against returning players plus
// commitments. No save fields, simulation, or randomness: everything comes from
// the existing DynastyRecruitingNeeds bridge.
(()=>{
 'use strict';
 const api=globalThis.DynastyRecruitingNeeds,tab=document.querySelector('#recruiting');
 if(!api?.posCounts||!tab)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let host=null,lastSig='',queued=false;
 function ensureHost(){
  if(host?.isConnected)return host;
  host=tab.querySelector('#recruitingNeeds');
  if(host)return host;
  host=document.createElement('section');
  host.id='recruitingNeeds';host.className='card recruiting-needs';host.hidden=true;
  host.innerHTML='<div class="section-head"><div><div class="eyebrow">ROSTER SHAPE</div><h3>Roster outlook</h3><div class="muted" id="recruitingNeedsCount" aria-live="polite"></div></div></div><p class="small muted roster-outlook-note"></p><div class="roster-need-strip" id="recruitingNeedsRows"></div>';
  const summary=tab.querySelector('#classSummary');
  if(summary)summary.insertAdjacentElement('afterend',host);
  else{const table=tab.querySelector(':scope > .table-wrap');if(table)table.insertAdjacentElement('beforebegin',host);else tab.append(host)}
  return host;
 }
 function render(){
  queued=false;
  const snap=api.snapshot?.(),node=ensureHost();
  if(!node)return;
  if(!snap){node.hidden=true;lastSig='';return}
  const rows=rosterOutlook(snap,api.posCounts),thin=rows.filter(x=>x.gap>0),sig=JSON.stringify(snap);
  if(sig===lastSig&&!node.hidden)return;
  lastSig=sig;node.hidden=false;
  node.querySelector('#recruitingNeedsCount').textContent=thin.length
   ?`${thin.length} position group${thin.length===1?'':'s'} thin for ${snap.team}`
   :`No position group is thin for ${snap.team}`;
  node.querySelector('#recruitingNeedsRows').innerHTML=rows.map(x=>`<article class="roster-outlook-position" data-outlook-pos="${esc(x.pos)}"${x.gap?` data-need-pos="${esc(x.pos)}"`:""}><div class="roster-outlook-title"><h4>${esc(x.pos)}</h4><strong>${x.gap?`${x.gap} short`:'Depth covered'}</strong></div><dl><div><dt>On roster</dt><dd>${x.current}</dd></div><div><dt>Eligibility exits</dt><dd>${x.departing}</dd></div><div><dt>Returning</dt><dd>${x.returning}</dd></div><div><dt>Committed, not enrolled</dt><dd>${x.committed}</dd></div><div><dt>Projected / target</dt><dd>${x.projected} of ${x.target}</dd></div><div><dt>Current targets</dt><dd>${x.targeted}</dd></div><div><dt>Watched · ${snap.year+1}</dt><dd data-outlook-watched>${x.watched}</dd></div></dl><div class="roster-outlook-actions"><button type="button" data-need-current="${esc(x.pos)}">Find current ${esc(x.pos)}</button><button type="button" data-need-rising="${esc(x.pos)}">Find rising ${esc(x.pos)}</button></div></article>`).join('');
  node.querySelector('.small.muted').textContent=`Projected ${snap.year+1} = returning players + commitments not yet enrolled. Targets and watched class ${snap.year+1} prospects are not roster additions. Transfers and early draft departures can change these totals.${snap.enrolled?' Signing is complete; enrolled recruits are already counted on the roster.':''}`;
  node.querySelectorAll('[data-need-current]').forEach(b=>b.onclick=()=>{
   globalThis.DynastyRecruitingClasses?.show('current');
   tab.querySelector('[data-rwm="workspace"]')?.click();tab.querySelector('[data-rwf="all"]')?.click();
   globalThis.DynastyLabRecruitingFilters?.setState({pos:b.dataset.needCurrent,stage:'ALL',verdict:'ALL',state:'ALL',query:'',targetedOnly:false});
   tab.querySelector('#rwSearch')?.focus({preventScroll:true});
  });
  node.querySelectorAll('[data-need-rising]').forEach(b=>b.onclick=()=>{
   globalThis.DynastyRecruitingClasses?.show('rising');
   const only=tab.querySelector('[data-rising-only]');if(only?.checked){only.checked=false;only.dispatchEvent(new Event('change',{bubbles:true}))}
   const pos=tab.querySelector('[data-rising-pos]');if(pos){pos.value=b.dataset.needRising;pos.dispatchEvent(new Event('change',{bubbles:true}));tab.querySelector('[data-rising-pos]')?.focus({preventScroll:true})}
  });
 }
 function queue(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(render,0)}
 const summary=tab.querySelector('#classSummary');
 if(summary&&window.MutationObserver)new MutationObserver(queue).observe(summary,{childList:true,subtree:true,characterData:true});
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="recruiting"],[data-client-tab="recruiting"],[data-recruit-class="outlook"]'))setTimeout(queue,0)});
 document.querySelector('#userTeam')?.addEventListener('change',()=>{lastSig='';setTimeout(queue,0)});
 queue();
})();
