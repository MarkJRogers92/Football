// Roster needs — read-only Recruiting-tab card. Thin groups are derived from the
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
  host.innerHTML='<div class="section-head"><div><div class="eyebrow">ROSTER SHAPE</div><h3>Roster needs</h3><div class="muted" id="recruitingNeedsCount" aria-live="polite"></div></div></div><div class="roster-need-strip" id="recruitingNeedsRows"></div><div class="small muted">Thin against the designed roster shape: returning players plus committed recruits, with seniors excluded because they leave before signing day.</div>';
  const summary=tab.querySelector('#classSummary');
  if(summary)summary.insertAdjacentElement('afterend',host);
  else{const table=tab.querySelector(':scope > .table-wrap');if(table)table.insertAdjacentElement('beforebegin',host);else tab.append(host)}
  return host;
 }
 function thinRows(snap){
  const thin=[];
  for(const [pos,target] of Object.entries(api.posCounts)){
   const returning=(snap.players||[]).filter(p=>p.pos===pos&&p.year!=='SR').length;
   const committed=snap.committed?.[pos]||0;
   const have=returning+committed;
   if(have<target)thin.push({pos,target,returning,committed,have,gap:target-have});
  }
  return thin;
 }
 function render(){
  queued=false;
  const snap=api.snapshot?.(),node=ensureHost();
  if(!node)return;
  if(!snap){node.hidden=true;lastSig='';return}
  const thin=thinRows(snap),sig=[snap.team,...thin.map(x=>`${x.pos}:${x.have}:${x.target}:${x.committed}`)].join('|');
  if(sig===lastSig&&!node.hidden)return;
  lastSig=sig;node.hidden=false;
  node.querySelector('#recruitingNeedsCount').textContent=thin.length
   ?`${thin.length} position group${thin.length===1?'':'s'} thin for ${snap.team}`
   :`No position group is thin for ${snap.team}`;
  node.querySelector('#recruitingNeedsRows').innerHTML=thin.length
   ?thin.map(x=>`<div class="roster-need${x.gap>=3?' urgent':''}" data-need-pos="${esc(x.pos)}" title="${esc(`${x.returning} returning + ${x.committed} committed against ${x.target} designed`)}"><strong>${esc(x.pos)}</strong><span>${x.have} of ${x.target}</span><small>${x.committed} committed</small></div>`).join('')
   :'<span class="muted">Every position group projects at or above its designed depth.</span>';
 }
 function queue(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(render,0)}
 const summary=tab.querySelector('#classSummary');
 if(summary&&window.MutationObserver)new MutationObserver(queue).observe(summary,{childList:true,subtree:true,characterData:true});
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-tab="recruiting"],[data-client-tab="recruiting"]'))setTimeout(queue,0)});
 document.querySelector('#userTeam')?.addEventListener('change',()=>{lastSig='';setTimeout(queue,0)});
 queue();
})();
