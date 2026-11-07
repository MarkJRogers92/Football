// Rival Watch: the coaches across the field become characters.
// Personality comes from each coach's real ratings; pressure lines come from real facts (who leads which
// recruiting race, the rivalry series, the next meeting). Choices are deterministic: no randomness, no saves.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastyRivalWatch=api;api.mount?.()}
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ARCHETYPES={
 recruiting:{name:'The Closer',blurb:'Wins living rooms. Turns up in every recruiting race you care about.'},
 playCall:{name:'The Schemer',blurb:'Out-calls people on Saturdays. Expect a plan built for your weaknesses.'},
 development:{name:'The Builder',blurb:'Turns three-stars into starters. That roster improves every November.'},
 evaluation:{name:'The Talent Scout',blurb:'Finds the players everyone else missed.'}
};
const ORDER=['recruiting','playCall','development','evaluation'];
function archetype(coach){
 if(!coach)return null;
 const key=ORDER.reduce((best,k)=>(Number(coach[k])||0)>(Number(coach[best])||0)?k:best,ORDER[0]);
 return{key,...ARCHETYPES[key]};
}
function traits(coach){
 if(!coach)return[];const out=[];
 if(coach.ambition>=75)out.push('Climber');
 if(coach.loyalty>=80)out.push('Lifer');
 if(coach.age>=60)out.push('Old guard');else if(coach.age&&coach.age<=40)out.push('Young gun');
 return out;
}
const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)));
// Pressure lines, most pointed first. Every line is tied to a fact in the snapshot.
function pressureLines(snap){
 const r=snap?.rival;if(!r?.coach)return[];
 const a=archetype(r.coach),lines=[],trophy=r.trophy||'This game';
 const race=r.racesLed?.[0];
 if(race)lines.push({fact:`Leads for ${race.recruit} (${race.pos} ${stars(race.stars)})`,quote:a.key==='recruiting'?`${race.recruit} already knows where home is.`:`We like where we stand with ${race.recruit}.`});
 if(r.lastMeeting)lines.push(r.lastMeeting.won?{fact:`You won ${r.lastMeeting.us}-${r.lastMeeting.them} this year`,quote:'Enjoy it. It was one game.'}:{fact:`Beat you ${r.lastMeeting.them}-${r.lastMeeting.us} this year`,quote:'Same result next year.'});
 else if(r.meeting&&!r.meeting.played&&snap.week!=null){const away=r.meeting.week-snap.week;if(away>=0&&away<=3)lines.push({fact:`Week ${r.meeting.week} ${r.meeting.home?'at your place':'on the road'}`,quote:a.key==='playCall'?'We have seen your film. All of it.':`${trophy} is not leaving our building.`})}
 if(r.series&&r.series.streak<=-2)lines.push({fact:`Has won ${-r.series.streak} straight in the series`,quote:`${-r.series.streak} in a row. Ask your fans how that feels.`});
 else if(r.series&&r.series.streak>=2)lines.push({fact:`You have won ${r.series.streak} straight`,quote:'Streaks end. Usually when you stop paying attention.'});
 if(!lines.length)lines.push({fact:`${a.name} · ${r.team.name}`,quote:a.key==='development'?'Check back in November.':a.key==='evaluation'?'Keep chasing the stars. We will take the players.':'See you on the trail.'});
 return lines.slice(0,2);
}
function meter(label,v){v=Math.max(0,Math.min(100,Number(v)||0));return`<div class="rvw-meter"><span>${esc(label)}</span><i style="--v:${v}%"></i><b>${v}</b></div>`}
function helmet(id,cls=''){return globalThis.DynastyBrandVisuals?.helmetHTML?.(id,cls)||''}
function cardHTML(snap){
 const r=snap?.rival;if(!r?.coach||!r.team)return'';
 const a=archetype(r.coach),tr=traits(r.coach),lines=pressureLines(snap);
 const series=r.series?(r.series.w||r.series.l?`${r.series.w}-${r.series.l}${r.series.streak?` · ${r.series.streak>0?'W':'L'}${Math.abs(r.series.streak)}`:''}`:'First meeting'):'—';
 const meet=r.lastMeeting?`${r.lastMeeting.won?'W':'L'} ${r.lastMeeting.us}-${r.lastMeeting.them}`:r.meeting?`Week ${r.meeting.week} · ${r.meeting.home?'home':'away'}`:'Not scheduled';
 const others=(snap.recruiters||[]).filter(x=>x.team.id!==r.team.id).slice(0,2);
 return`<section id="rivalWatch" class="card rival-watch" aria-label="Rival watch">`+
  `<div class="rvw-head"><span class="eyebrow">RIVAL WATCH</span>${r.trophy?`<span class="rvw-trophy">${esc(r.trophy)}</span>`:''}</div>`+
  `<div class="rvw-main">${helmet(r.team.id,'rvw-helmet is-away')}<div class="rvw-id"><strong>${esc(r.coach.name)}</strong><span>Head coach · ${esc(r.team.rank?`#${r.team.rank} `:'')}${esc(r.team.name)} (${r.team.w}-${r.team.l})</span><div class="rvw-tags"><b class="rvw-arch">${esc(a.name)}</b>${tr.map(t=>`<i>${esc(t)}</i>`).join('')}</div><p>${esc(a.blurb)}</p></div>`+
  `<div class="rvw-meters">${meter('Recruiting',r.coach.recruiting)}${meter('Play calling',r.coach.playCall)}${meter('Development',r.coach.development)}${meter('Evaluation',r.coach.evaluation)}</div></div>`+
  `<div class="rvw-facts"><div><span>Series</span><b>${esc(series)}</b></div><div><span>${r.lastMeeting?'This year':'Next meeting'}</span><b>${esc(meet)}</b></div><div><span>Your targets they lead</span><b>${r.racesLed?.length||0}</b></div></div>`+
  (lines.length?`<div class="rvw-quotes">${lines.map(l=>`<blockquote><p>“${esc(l.quote)}”</p><footer>${esc(r.coach.name)} · <span>${esc(l.fact)}</span></footer></blockquote>`).join('')}</div>`:'')+
  (others.length?`<div class="rvw-others"><span class="eyebrow">ALSO CHASING YOUR TARGETS</span>${others.map(o=>{const oa=archetype(o.coach),race=o.races[0];return`<div class="rvw-other">${helmet(o.team.id,'rvw-helmet-sm')}<div><strong>${esc(o.coach.name)}</strong><span>${esc(o.team.name)} · ${esc(oa.name)}</span></div><small>Leads for ${esc(race.recruit)} · ${esc(race.pos)} ${stars(race.stars)}</small></div>`}).join('')}</div>`:'')+
  `</section>`;
}
let sig='',queued=false;
function paint(){
 queued=false;const dash=document.querySelector('#dashboard');if(!dash)return;
 const snap=globalThis.DynastyRivalSnapshot?.read?.();
 let host=dash.querySelector('#rivalWatch');
 if(!snap?.rival){host?.remove();sig='';return}
 const next=JSON.stringify(snap);if(host&&next===sig)return;sig=next;
 const html=cardHTML(snap);
 if(host)host.outerHTML=html;else{const anchor=dash.querySelector('#broadcastFeature')||dash.querySelector('.command-center');anchor?anchor.insertAdjacentHTML('afterend',html):dash.insertAdjacentHTML('beforeend',html)}
 dash.querySelector('#rivalWatch')?.setAttribute('data-dview','week');
}
function queue(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(paint)}
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{
  for(const sel of ['#recordBig','#weekLine','#teamName','#weeklyHub'])document.querySelectorAll(sel).forEach(el=>new MutationObserver(queue).observe(el,{childList:true,subtree:true,characterData:true}));
  document.addEventListener('click',e=>{if(e.target.closest('[data-tab="dashboard"],[data-client-tab="dashboard"],[data-rwa],[data-target]'))setTimeout(queue,0)});
  queue();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{archetype,traits,pressureLines,cardHTML,mount};
});
