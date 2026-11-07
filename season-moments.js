// Season moments: last-game highlights, Rivalry Week and the season yearbook.
// Reads DynastySeasonMoments (read-only); opens the existing replay in its key-plays mode. No saves.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastySeasonMomentsUI=api;api.mount?.()}
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const helmet=(id,cls)=>globalThis.DynastyBrandVisuals?.helmetHTML?.(id,cls)||'';
function highlightsHTML(h){
 if(!h)return'';
 return`<section id="highlightsCard" class="card highlights ${h.won?'is-win':'is-loss'}" aria-label="Last game"><div class="hl-head"><div><span class="eyebrow">LAST GAME · WEEK ${esc(h.week??'')}</span><strong>${h.won?'W':'L'} ${esc(h.us)}–${esc(h.them)} <small>vs ${esc(h.opponent)}</small></strong></div><div class="hl-actions">${h.hasReplay?'<button type="button" class="bi-primary" data-hl-watch>Watch highlights</button>':''}<button type="button" data-hl-box>Box score</button></div></div>`+
  ((h.performers||[]).length?`<div class="hl-stars">${h.performers.map((p,i)=>`<button type="button" class="hl-star" data-player="${esc(p.id)}">${p.face?`<canvas class="portrait portrait-list" width="44" height="44" data-portrait="${esc(p.id)}" data-portrait-size="44" data-portrait-frame="list" data-portrait-kind="player" aria-hidden="true"></canvas>`:''}<span><small>${i===0?'Player of the game':'Top performer'}</small><b>${esc(p.name)}</b><em>${esc(p.pos)} · ${esc(p.line)}</em></span></button>`).join('')}</div>`:'')+
  (h.plays.length?`<ol class="hl-plays">${h.plays.map(p=>`<li class="${p.ours?'is-ours':'is-theirs'}"><span>${esc(p.clock)}</span>${esc(p.text)}</li>`).join('')}</ol>`:'')+`</section>`;
}
function yearbookHTML(y){
 const t=y.team,headline=y.champ?'National Champions':y.confChamp?`${esc(t.conference)} Champions`:y.bowl?.won?`${esc(y.bowl.label)} Champions`:`${t.w}-${t.l}`;
 return`<div class="yearbook" role="dialog" aria-modal="true" aria-label="${esc(y.year)} season yearbook"><article class="yb-page">`+
  `<header class="yb-cover">${helmet(t.id,'yb-helmet')}<div><span>${esc(y.year)} Season Yearbook</span><h2>${esc(t.name)}</h2><p>${headline}</p></div></header>`+
  `<div class="yb-facts"><div><span>Record</span><b>${t.w}-${t.l}</b></div><div><span>Conference</span><b>${t.cw}-${t.cl}${t.place?` · ${t.place}${['th','st','nd','rd'][((t.place%100-20)%10>3||t.place%100<20&&t.place%100>3)?0:t.place%10]||'th'}`:''}</b></div><div><span>Final rank</span><b>${t.rank?`#${t.rank}`:'Unranked'}</b></div><div><span>Bowl</span><b>${y.bowl?`${y.bowl.won?'W':'L'} · ${esc(y.bowl.label)}`:'—'}</b></div></div>`+
  (y.rival?`<p class="yb-line"><b>Rivalry:</b> ${y.rival.won?'Beat':'Lost to'} ${esc(y.rival.name)}${y.rival.trophy?` · ${esc(y.rival.trophy)} ${y.rival.won?'won':'lost'}`:''}</p>`:'')+
  `<section><h3>Top performers</h3><ol class="yb-list">${y.leaders.map(p=>`<li><b>${esc(p.name)}</b> <small>${esc(p.pos)}</small><span>${esc(p.line)}</span></li>`).join('')||'<li>No games played.</li>'}</ol></section>`+
  (y.awards.length?`<section><h3>Honors</h3><ul class="yb-list">${y.awards.map(a=>`<li><b>${esc(a.name)}</b> <small>${esc(a.pos)}</small><span>${esc(a.award)}</span></li>`).join('')}</ul></section>`:'')+
  `<section><h3>Signing class</h3><p class="yb-line">${y.signing.count} signed · ${y.signing.five} five-star · ${y.signing.four} four-star</p></section>`+
  (y.picks.length?`<section><h3>Draft</h3><ul class="yb-list">${y.picks.map(p=>`<li><b>${esc(p.name)}</b> <small>${esc(p.pos)}</small><span>${esc(p.label)}</span></li>`).join('')}</ul></section>`:'')+
  `<footer class="yb-foot">Head coach ${esc(y.coach)} · Dynasty Lab</footer></article><div class="yb-controls"><button type="button" class="bi-primary" data-yb-print>Print or save as PDF</button><button type="button" data-yb-close>Close</button></div></div>`;
}
function openYearbook(){
 const y=globalThis.DynastySeasonMoments?.yearbook?.();if(!y)return false;
 document.querySelector('.yearbook')?.remove();document.body.insertAdjacentHTML('beforeend',yearbookHTML(y));
 const el=document.querySelector('.yearbook'),close=()=>{el.remove();document.removeEventListener('keydown',key,true)},key=e=>{if(e.key==='Escape'){e.preventDefault();close()}};
 el.querySelector('[data-yb-close]').addEventListener('click',close);el.querySelector('[data-yb-print]').addEventListener('click',()=>window.print());
 document.addEventListener('keydown',key,true);el.querySelector('[data-yb-print]').focus();return true;
}
let sig='',queued=false;
function paint(){
 queued=false;const dash=document.querySelector('#dashboard');if(!dash)return;const api=globalThis.DynastySeasonMoments;if(!api)return;
 const h=api.highlights(),rw=api.rivalryWeek(),yb=api.yearbook();
 const next=JSON.stringify([h,rw,yb?.done]);if(next===sig)return;sig=next;
 // Highlights card sits with the week's work, after the matchup and rival cards.
 let host=dash.querySelector('#highlightsCard');const html=highlightsHTML(h);
 if(!html)host?.remove();else if(host)host.outerHTML=html;else{const anchor=dash.querySelector('#rivalWatch')||dash.querySelector('#broadcastFeature')||dash.querySelector('.command-center');anchor?anchor.insertAdjacentHTML('afterend',html):dash.insertAdjacentHTML('beforeend',html)}
 host=dash.querySelector('#highlightsCard');
 if(host){host.dataset.dview='week';
  if(yb?.done&&!host.querySelector('[data-yearbook]'))host.querySelector('.hl-actions')?.insertAdjacentHTML('beforeend','<button type="button" data-yearbook>Season yearbook</button>');
  host.querySelector('[data-hl-watch]')?.addEventListener('click',()=>{globalThis.DynastyLabOpenGame?.(h.gameId,'Watch');setTimeout(()=>{const sel=document.querySelector('#gameDialog [data-gcf-speed]');if(sel){sel.value='key';sel.dispatchEvent(new Event('change',{bubbles:true}))}},350)});
  host.querySelector('[data-hl-box]')?.addEventListener('click',()=>globalThis.DynastyLabOpenGame?.(h.gameId,'Box Score'));
  host.querySelector('[data-yearbook]')?.addEventListener('click',openYearbook);
  host.querySelectorAll('.hl-star[data-player]').forEach(b=>b.addEventListener('click',()=>globalThis.DynastyLabShowPlayer?.(b.dataset.player)));globalThis.DynastyLabPortraits?.paint?.(host)}
 // Rivalry Week: a ribbon on the program banner and the Rival Watch card turns up the heat.
 const mast=dash.querySelector('.program-masthead');let ribbon=mast?.querySelector('.rvw-week-ribbon');
 if(rw&&mast){const text=`Rivalry Week · ${rw.home?'vs':'at'} ${rw.rival.name}${rw.trophy?` · ${rw.trophy} on the line`:''}${rw.series?` · series ${rw.series.w}-${rw.series.l}`:''}`;if(!ribbon){mast.insertAdjacentHTML('afterbegin',`<div class="rvw-week-ribbon" role="note"></div>`);ribbon=mast.querySelector('.rvw-week-ribbon')}ribbon.textContent=text}else ribbon?.remove();
 dash.querySelector('#rivalWatch')?.classList.toggle('is-rivalry-week',!!rw);
 document.documentElement.classList.toggle('bi-rivalry-week',!!rw);
}
function queue(){if(queued)return;queued=true;setTimeout(paint,80)}
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{for(const sel of ['#recordBig','#weekLine','#teamName','#saveStatus'])document.querySelectorAll(sel).forEach(el=>new MutationObserver(queue).observe(el,{childList:true,subtree:true,characterData:true}));
  const dash=document.querySelector('#dashboard');if(dash)new MutationObserver(rs=>{if(rs.some(r=>[...r.addedNodes].some(n=>n.id==='rivalWatch')))sig='',queue()}).observe(dash,{childList:true});
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="dashboard"],[data-client-tab="dashboard"]'))queue()});queue()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{highlightsHTML,yearbookHTML,openYearbook,mount};
});
