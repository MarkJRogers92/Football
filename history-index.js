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
   <div class="section-head"><div><h3>National timeline</h3><div class="muted">Each archived season: the champion, then its award winners, biggest upsets and records still standing.</div></div></div>
   <div id="championTimeline" class="history-list">Loading champions…</div>
  </section>
  <section class="card history-card">
   <div class="section-head"><div><h3>Hall of Fame</h3><div class="muted">Awards, draft results, titles and career production — nothing hidden.</div></div></div>
   <div class="history-controls">
    <label>Show <select id="hofKind" aria-label="Hall of Fame category"><option value="all">All inductees</option><option value="player">Players</option><option value="coach">Coaches</option></select></label>
   </div>
   <div id="hofCount" class="muted small" aria-live="polite"></div>
   <div id="hallOfFameList" class="history-list">Loading inductees…</div>
  </section>
  <section class="card history-card">
   <div class="section-head"><div><h3>Conferences</h3><div class="muted">Archived membership and final records. Ordered by conference wins/losses, overall wins/losses, then point differential; not an official title-game result.</div></div></div>
   <div class="history-controls">
    <label>Conference <select id="conferencePick" aria-label="Conference"></select></label>
    <label>Season <select id="conferenceSeason" aria-label="Archived season"></select></label>
   </div>
   <div id="conferenceTable" class="history-list">Loading standings…</div>
  </section>`;
 section.append(host);
 const input=host.querySelector('#coachIndexSearch'),list=host.querySelector('#coachIndexList'),champs=host.querySelector('#championTimeline'),hall=host.querySelector('#hallOfFameList'),hofCount=host.querySelector('#hofCount'),hofKind=host.querySelector('#hofKind'),confSel=host.querySelector('#conferencePick'),seasonSel=host.querySelector('#conferenceSeason'),confTable=host.querySelector('#conferenceTable');

 // v0.12.19: induction is stricter, but a long dynasty still passes 24 inductees.
 let hofLimit=24,hofCategory='all';

 function renderCoaches(){
  const rows=api.coaches({query:input.value,limit:40});
  list.innerHTML=rows.length
   ?rows.map(r=>`<button type="button" class="history-row" data-coach-id="${esc(r.id)}"><span class="history-who"><strong>${esc(r.name)}</strong><small>${esc(r.role)} · ${esc(r.team||r.status)}</small></span><span class="history-record">${r.wins}–${r.losses}<small>${r.seasons} season${r.seasons===1?'':'s'}${r.active?'':' · '+esc(r.status)}</small></span></button>`).join('')
   :'<span class="muted">No coach matches that search.</span>';
  list.querySelectorAll('[data-coach-id]').forEach(button=>{button.onclick=()=>api.openCoach(button.dataset.coachId)});
 }
 // v0.30: each champion row opens that season's awards, upsets (top-10 losses to unranked or much lower-ranked
 // teams) and the national season records set that year that still stand. Open seasons survive a re-render.
 const openYears=new Set();
 const rank=n=>n?`#${n} `:'';
 function seasonDetail(r){
  const awards=(r.awards||[]).map(a=>`<li><button type="button" class="timeline-link" data-player-id="${esc(a.playerId??'')}"${a.playerId==null?' disabled':''}><b>${esc(a.name)}</b> ${esc(a.playerName)}<small>${esc(a.pos)}${a.pos&&a.team?' · ':''}${esc(a.team)}</small></button></li>`).join('');
  const upsets=r.upsets==null
   ?'<li><button type="button" class="timeline-link" data-load-games>Load past games to see upsets</button></li>'
   :r.upsets.map(u=>`<li><button type="button" class="timeline-link" data-game-id="${esc(u.gameId)}"><b>${rank(u.winnerRank)||'Unranked '}${esc(u.winner)}</b> beat ${rank(u.loserRank)}${esc(u.loser)} ${esc(u.score)}<small>${u.week!=null&&u.label==='Regular season'?`Week ${esc(u.week)}`:esc(u.label||'')}</small></button></li>`).join('');
  const records=(r.records||[]).map(x=>`<li><button type="button" class="timeline-link" data-player-id="${esc(x.playerId??'')}"${x.playerId==null?' disabled':''}><b>${esc(x.label)}: ${esc(x.value)}</b> ${esc(x.playerName)}<small>${esc(x.team)}</small></button></li>`).join('');
  const block=(title,items,empty)=>`<div class="timeline-block"><span class="eyebrow">${title}</span>${items?`<ul>${items}</ul>`:`<p class="muted small">${empty}</p>`}</div>`;
  return`<details class="timeline-detail" data-year="${r.year}"${openYears.has(r.year)?' open':''}><summary>${r.year} awards, upsets and records</summary><div class="timeline-grid">`+
   block('AWARDS',awards,'No awards were recorded for this season.')+
   block('UPSETS',upsets,'No top-10 team lost to an unranked or much lower-ranked opponent.')+
   block('RECORDS STILL STANDING',records,'No national season record from this year still stands.')+'</div></details>';
 }
 function renderChampions(){
  const rows=(api.timeline?api.timeline({limit:25}):api.champions({limit:25}).map(r=>({...r,awards:[],upsets:[],records:[]})));
  champs.innerHTML=rows.length
   ?rows.map(r=>`<div class="timeline-season">${r.champion?`<button type="button" class="history-row" data-champ="${esc(r.champion)}" data-school-id="${esc(r.championId??'')}"><span class="history-who"><strong>${esc(r.champion)}</strong><small>${r.year}${r.record?' · '+esc(r.record):''}</small></span><span class="history-record">${r.runnerUp?esc(r.runnerUp):'—'}<small>${r.runnerUp?'runner-up':'no runner-up recorded'}</small></span></button>`:`<div class="history-row"><span class="history-who"><strong>${r.year}</strong><small>No champion recorded</small></span></div>`}${seasonDetail(r)}</div>`).join('')
   :'<span class="muted">Champions appear once a season is archived.</span>';
  champs.querySelectorAll('[data-champ]').forEach(button=>{
   button.onclick=()=>globalThis.DynastyEncyclopedia?.open({kind:'team',id:button.dataset.schoolId||undefined,name:button.dataset.champ});
  });
  champs.querySelectorAll('details.timeline-detail').forEach(d=>d.addEventListener('toggle',()=>{const y=Number(d.dataset.year);d.open?openYears.add(y):openYears.delete(y)}));
  champs.querySelectorAll('[data-player-id]:not([disabled])').forEach(b=>{b.onclick=()=>api.openPlayer?.(b.dataset.playerId)});
  champs.querySelectorAll('[data-game-id]').forEach(b=>{b.onclick=()=>globalThis.DynastyLabOpenGame?.(b.dataset.gameId)});
  champs.querySelectorAll('[data-load-games]').forEach(b=>{b.onclick=async()=>{b.disabled=true;b.textContent='Loading past games…';try{await api.loadGames?.()}finally{renderChampions()}}});
 }
 function renderHall(){
  const all=api.hallOfFame?.({limit:1000})||[];
  const filtered=all.filter(r=>hofCategory==='all'||r.kind===hofCategory);
  const rows=filtered.slice(0,hofLimit);
  hofCount.textContent=!all.length?'':rows.length<filtered.length?`Showing ${rows.length} of ${filtered.length} inductees`:`All ${filtered.length} inductee${filtered.length===1?'':'s'}`;
  const more=rows.length<filtered.length?`<button type="button" class="history-row history-more" data-hof-more>Show all ${filtered.length} inductees</button>`:'';
  hall.innerHTML=rows.length
   ?rows.map(r=>`<button type="button" class="history-row" data-hof="${esc(r.id)}" data-hof-kind="${r.kind}"><span class="history-who"><strong>${esc(r.name)}</strong><small>${esc(r.pos)} · ${esc(r.team)}${r.year?' · '+esc(r.year):''}</small><small class="hof-why">${r.reasons.map(esc).join(' · ')}</small></span><span class="history-record">${r.kind==='coach'?'COACH':'PLAYER'}<small>HALL OF FAME</small></span></button>`).join('')+more
   :all.length?`<span class="muted">No ${hofCategory==='coach'?'coaches':'players'} are inducted yet.</span>`
   :'<span class="muted">No inductees yet. Awards, draft results, titles and career production qualify a career.</span>';
  hall.querySelectorAll('[data-hof]').forEach(button=>{
   button.onclick=()=>button.dataset.hofKind==='coach'?api.openCoach(button.dataset.hof):api.openPlayer(button.dataset.hof);
  });
  hall.querySelector('[data-hof-more]')?.addEventListener('click',()=>{hofLimit=filtered.length;renderHall()});
 }
 function renderConference(){
  const seasons=api.seasons?.()||[], conferences=api.conferences?.()||[];
  if(!seasons.length){
   confSel.disabled=seasonSel.disabled=true;
   confTable.innerHTML='<span class="muted">Conference standings appear once a season is archived.</span>';
   return;
  }
  confSel.disabled=seasonSel.disabled=false;
  const conference=confSel.value,year=seasonSel.value;
  confSel.innerHTML=conferences.map(name=>`<option>${esc(name)}</option>`).join('');
  seasonSel.innerHTML=seasons.map(year=>`<option>${year}</option>`).join('');
  if(conferences.includes(conference))confSel.value=conference;
  if(seasons.some(y=>String(y)===year))seasonSel.value=year;
  const view=api.standings({conference:confSel.value,year:Number(seasonSel.value)});
  if(!view){confTable.innerHTML='<span class="muted">No standings are stored for that season.</span>';return}
  confTable.innerHTML=(view.membershipEstimated?'<p class="muted">Estimated membership: this older season did not store conferences. Current membership is used where historical data is missing.</p>':'')+`<div class="history-row is-head" role="row"><span class="history-who"><strong>Team</strong></span><span class="history-record">Conf<small>Overall</small></span></div>`
   +view.rows.map(row=>`<button type="button" class="history-row" data-conf-team="${esc(row.name)}" data-school-id="${esc(row.schoolId??'')}" role="row"><span class="history-who"><strong>${row.place}. ${esc(row.name)}</strong><small>Prestige ${row.prestige} · ${row.pf}–${row.pa} points</small></span><span class="history-record">${row.cw}–${row.cl}<small>${row.w}–${row.l}</small></span></button>`).join('');
  confTable.querySelectorAll('[data-conf-team]').forEach(button=>{
   button.onclick=()=>globalThis.DynastyEncyclopedia?.open({kind:'team',id:button.dataset.schoolId||undefined,name:button.dataset.confTeam});
  });
 }
 confSel.addEventListener('change',renderConference);
 seasonSel.addEventListener('change',renderConference);
 input.addEventListener('input',renderCoaches);
 hofKind.addEventListener('change',()=>{hofCategory=hofKind.value;hofLimit=24;renderHall()});
 document.addEventListener('click',event=>{
  if(event.target.closest?.('[data-tab="history"],[data-client-tab="history"]'))setTimeout(()=>{renderCoaches();renderChampions();renderHall();renderConference()},0);
 });
 renderCoaches();renderChampions();renderHall();renderConference();
})();
