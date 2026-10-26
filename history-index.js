// v0.12.13 — History index: every recorded coach and every archived national
// champion, read-only. The models live in app.js behind globalThis.DynastyHistoryIndex.
(function(){
 'use strict';
 const api=globalThis.DynastyHistoryIndex;
 const section=document.querySelector('#history');
 if(!api||!section||document.querySelector('#historyIndex'))return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const host=document.createElement('div');
 host.id='historyIndex';host.className='history-index';
 host.innerHTML=`<section class="card history-card">
   <div class="section-head"><div><h3>Coaches</h3><div class="muted">Every coach this dynasty has recorded, active and departed.</div></div></div>
   <input id="coachIndexSearch" class="wide-input" type="search" placeholder="Search name, program or role" aria-label="Search coaches" autocomplete="off">
   <div id="coachIndexList" class="history-list">Loading coaches…</div>
  </section>
  <section class="card history-card">
   <div class="section-head"><div><h3>National champions</h3><div class="muted">Archived seasons in this dynasty.</div></div></div>
   <div id="championTimeline" class="history-list">Loading champions…</div>
  </section>`;
 section.append(host);
 const input=host.querySelector('#coachIndexSearch'),list=host.querySelector('#coachIndexList'),champs=host.querySelector('#championTimeline');

 function renderCoaches(){
  const rows=api.coaches({query:input.value,limit:40});
  list.innerHTML=rows.length
   ?rows.map(r=>`<button type="button" class="history-row" data-coach-id="${esc(r.id)}"><span class="history-who"><strong>${esc(r.name)}</strong><small>${esc(r.role)} · ${esc(r.team||r.status)}</small></span><span class="history-record">${r.wins}–${r.losses}<small>${r.seasons} season${r.seasons===1?'':'s'}${r.active?'':' · '+esc(r.status)}</small></span></button>`).join('')
   :'<span class="muted">No coach matches that search.</span>';
  list.querySelectorAll('[data-coach-id]').forEach(button=>{button.onclick=()=>api.openCoach(button.dataset.coachId)});
 }
 function renderChampions(){
  const rows=api.champions({limit:25});
  champs.innerHTML=rows.length
   ?rows.map(r=>`<button type="button" class="history-row" data-champ="${esc(r.champion)}"><span class="history-who"><strong>${esc(r.champion)}</strong><small>${r.year}${r.record?' · '+esc(r.record):''}</small></span><span class="history-record">${r.runnerUp?esc(r.runnerUp):'—'}<small>${r.runnerUp?'runner-up':'no runner-up recorded'}</small></span></button>`).join('')
   :'<span class="muted">Champions appear once a season is archived.</span>';
  champs.querySelectorAll('[data-champ]').forEach(button=>{
   button.onclick=()=>globalThis.DynastyEncyclopedia?.open({kind:'team',name:button.dataset.champ});
  });
 }
 input.addEventListener('input',renderCoaches);
 document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-tab="history"],[data-client-tab="history"]'))setTimeout(()=>{renderCoaches();renderChampions()},0);
 });
 renderCoaches();renderChampions();
})();
