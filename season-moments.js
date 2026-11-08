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
function performerHTML(p,label){
 return`<button type="button" class="hl-star" data-player="${esc(p.id)}" data-hl-focus="player:${esc(p.id)}">${p.face?`<canvas class="portrait portrait-list" width="44" height="44" data-portrait="${esc(p.id)}" data-portrait-size="44" data-portrait-frame="list" data-portrait-kind="player" aria-hidden="true"></canvas>`:''}<span><small>${label}</small><b>${esc(p.name)}</b><em>${esc([p.pos,p.line].filter(Boolean).join(' · '))}</em></span></button>`;
}
function saveStatusHTML(status,context){
 const labels={pending:'Save queued',saving:'Saving',saved:'Saved',unsaved:'Not saved',failed:'Save failed'};
 if(!status||!context||!labels[status.state]||context.slot==null)return'';
 if(['slot','year','week','programId','world'].some(k=>status[k]==null||String(status[k])!==String(context[k])))return'';
 return`<p class="hl-save" data-save-state="${status.state}" role="status"><b>${labels[status.state]}</b>${status.message?` · ${esc(status.message)}`:''}</p>`;
}
function highlightsHTML(h,rhythm,status){
 if(!h)return'';
 const outcome=h?.outcome||(h?.won?'W':h?'L':null),performers=h?.performers||[],plays=h?.plays||[];
 const result=h?`<div class="hl-head"><div><span class="eyebrow">LAST FINAL · ${esc(h.label&&h.label!=='Regular season'?h.label:`WEEK ${h.week??''}`)}</span><strong>${outcome} ${esc(h.us)}–${esc(h.them)} <small>vs ${esc(h.opponent)}</small></strong></div><div class="hl-actions">${h.gameId&&h.hasBoxScore!==false?'<button type="button" data-hl-box data-hl-focus="box">Box score</button>':''}</div></div>`:'';
 const payoff=h?`<div class="hl-payoff">${performers[0]?performerHTML(performers[0],'Top performer'):'<p class="hl-missing">Individual game statistics unavailable here.</p>'}${h.consequence?`<p class="hl-consequence"><small>What changed</small><b>${esc(h.consequence)}</b></p>`:''}</div>`:'';
 const next=rhythm?.next,note=next?`Next opponent: ${next.home===false?'at':'vs'} ${next.opponent} · ${next.label==='Regular season'?`Week ${next.week}`:next.label}`:rhythm?.phase==='complete'?'No further games this season.':rhythm?'Next opponent not set yet.':'';
 const choices=rhythm?.careerChoice?'Coaching post choice pending.':rhythm?.requiredChoices?`${rhythm.requiredChoices} required choice${rhythm.requiredChoices===1?'':'s'} in This Week.`:'No required weekly choices.';
 const weekly=rhythm?`<div class="hl-week"><p class="hl-next">${rhythm.bye?`Week ${esc(rhythm.week)} is a bye. `:''}${esc(note)}</p><p class="hl-choices">${esc(choices)}</p></div>`:'';
 const more=h&&(performers.length>1||plays.length||h.hasReplay)?`<details class="hl-more"><summary data-hl-focus="more">More from this game</summary>${performers.length>1?`<div class="hl-stars">${performers.slice(1).map(p=>performerHTML(p,'Contributor')).join('')}</div>`:''}${plays.length?`<ol class="hl-plays">${plays.map(p=>`<li class="${p.ours?'is-ours':'is-theirs'}"><span>${esc(p.clock)}</span>${esc(p.text)}</li>`).join('')}</ol>`:''}${h.hasReplay?'<div class="hl-actions"><button type="button" data-hl-watch data-hl-focus="watch">Watch highlights</button></div>':''}</details>`:'';
 const stop=rhythm?.stop?`<p class="hl-stop">${esc(rhythm.stop)}</p>`:'';
 return`<section id="highlightsCard" data-hl-game="${esc(h?.gameId||'')}" class="card highlights${outcome?` is-${outcome==='W'?'win':outcome==='L'?'loss':'tie'}`:''}" aria-label="Weekly rhythm and game result">${result}${payoff}${h.firstStart?`<p class="hl-next"><b>Signing class</b> · ${esc(h.firstStart)}</p>`:''}${weekly}${stop}${saveStatusHTML(status,rhythm?.context)}${more}</section>`;
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
let closeYearbook=null;
function openYearbook(){
 const y=globalThis.DynastySeasonMoments?.yearbook?.();if(!y)return false;
 closeYearbook?.();const returnFocus=document.activeElement;
 document.body.insertAdjacentHTML('beforeend',yearbookHTML(y));
 const el=document.querySelector('.yearbook'),close=()=>{
  el.remove();document.removeEventListener('keydown',key,true);if(closeYearbook===close)closeYearbook=null;
  const target=returnFocus?.isConnected?returnFocus:document.querySelector('[data-yearbook]');target?.focus?.({preventScroll:true});
 },key=e=>{
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key!=='Tab')return;
  const controls=[...el.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled),first=controls[0],last=controls.at(-1);
  if(!first)return;
  if(e.shiftKey&&(document.activeElement===first||!el.contains(document.activeElement))){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&(document.activeElement===last||!el.contains(document.activeElement))){e.preventDefault();first.focus()}
 };
 closeYearbook=close;
 el.querySelector('[data-yb-close]').addEventListener('click',close);el.querySelector('[data-yb-print]').addEventListener('click',()=>window.print());
 document.addEventListener('keydown',key,true);el.querySelector('[data-yb-print]').focus();return true;
}
let sig='',queued=false;
function paint(){
 queued=false;const dash=document.querySelector('#dashboard');if(!dash)return;const api=globalThis.DynastySeasonMoments;if(!api)return;
 const h=api.highlights(),rhythm=api.weeklyRhythm?.(),rw=api.rivalryWeek(),yb=api.yearbook(),status=globalThis.DynastySessionStatus?.read?.();
 let host=dash.querySelector('#highlightsCard');
 const next=JSON.stringify([h,rhythm,status,rw,yb?.done]);if(next===sig&&host)return;sig=next;
 // Keep the compact payoff visible beside the desk; Rival Watch may be in closed details.
 const sameGame=host?.dataset.hlGame===String(h?.gameId||''),expanded=sameGame&&!!host?.querySelector('.hl-more')?.open,focused=sameGame&&host?.contains(document.activeElement)?document.activeElement?.getAttribute('data-hl-focus'):null;
 const html=highlightsHTML(h,rhythm,status);
 if(!html)host?.remove();else if(host)host.outerHTML=html;else{const anchor=dash.querySelector(':scope > #broadcastFeature')||dash.querySelector(':scope > .command-center');anchor?anchor.insertAdjacentHTML('afterend',html):dash.insertAdjacentHTML('beforeend',html)}
 host=dash.querySelector('#highlightsCard');
 if(host){host.dataset.dview='week';
  if(expanded&&host.querySelector('.hl-more'))host.querySelector('.hl-more').open=true;
  if(focused)[...host.querySelectorAll('[data-hl-focus]')].find(el=>el.getAttribute('data-hl-focus')===focused)?.focus({preventScroll:true});
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
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="dashboard"],[data-client-tab="dashboard"]'))queue()});globalThis.addEventListener?.('dynasty:save-status',queue);queue()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{highlightsHTML,yearbookHTML,openYearbook,mount};
});
