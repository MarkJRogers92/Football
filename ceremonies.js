// Ceremonies: the big beats of a dynasty get a moment on screen.
// A ceremony plays only when a real milestone (DynastyCeremonySnapshot) appears during this session, so
// loading a save never replays old ones. Presentation only: no saves, no randomness, nothing advanced.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastyCeremonies=api;api.mount?.()}
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORDER={national:0,conference:1,bowl:2,rivalry:3,signing:4,draft:5};
// Milestones that are new since the previous snapshot, biggest first. A missing baseline, another
// program or another season means "just loaded or switched": nothing is new, so old milestones never replay.
function newMilestones(prev,next){
 if(!prev||!next||prev.teamId!==next.teamId||prev.year!==next.year)return[];
 const seen=new Set((prev.milestones||[]).map(m=>m.key));
 return (next.milestones||[]).filter(m=>!seen.has(m.key)).sort((a,b)=>ORDER[a.kind]-ORDER[b.kind]);
}
// Confetti positions are derived from the index, so the effect is stable and uses no randomness.
function confettiHTML(n=56){
 let out='';for(let i=0;i<n;i++){const x=(i*37)%100,d=((i*53)%100)/100*1.6,dur=2.4+((i*29)%10)/10,rot=(i*71)%360,hue=i%4;out+=`<i style="--x:${x}%;--d:${d.toFixed(2)}s;--t:${dur.toFixed(1)}s;--r:${rot}deg" class="c${hue}"></i>`}
 return`<div class="cer-confetti" aria-hidden="true">${out}</div>`;
}
const stars=n=>'★'.repeat(Math.max(0,Math.min(5,Number(n)||0)));
function helmet(id,cls){return globalThis.DynastyBrandVisuals?.helmetHTML?.(id,cls)||''}
function bodyHTML(m){
 const t=m.team,record=`${t.w}-${t.l}`;
 if(m.kind==='national')return{tone:'gold',confetti:true,html:`<div class="cer-trophy" aria-hidden="true"></div><span class="cer-kicker">${m.year} College Football</span><h2>National Champions</h2><p class="cer-team">${esc(t.name)}</p><p class="cer-sub">${record} · the last team standing</p>`};
 if(m.kind==='conference')return{tone:'gold',confetti:true,html:`${helmet(t.id,'cer-helmet')}<span class="cer-kicker">${m.year} · ${esc(t.conference)}</span><h2>Conference Champions</h2><p class="cer-team">${esc(t.name)}</p><p class="cer-sub">${record} · a banner for the stadium</p>`};
 if(m.kind==='bowl')return{tone:'gold',confetti:true,html:`<div class="cer-faceoff">${helmet(t.id,'cer-helmet')}<b>${esc(m.score?.[0]??'')}–${esc(m.score?.[1]??'')}</b>${helmet(m.opponent?.id,'cer-helmet is-away')}</div><span class="cer-kicker">${m.year} · Bowl season</span><h2>${esc(m.label)} Champions</h2><p class="cer-team">${esc(t.name)}</p><p class="cer-sub">over ${esc(m.opponent?.name||'')}</p>`};
 if(m.kind==='rivalry')return{tone:'gold',confetti:true,html:`<div class="cer-faceoff">${helmet(t.id,'cer-helmet')}<b>${esc(m.score?.[0]??'')}–${esc(m.score?.[1]??'')}</b>${helmet(m.opponent?.id,'cer-helmet is-away')}</div><span class="cer-kicker">${m.year} · Rivalry game</span><h2>${m.trophy?esc(m.trophy):'Rivalry won'}</h2><p class="cer-team">${m.trophy?(m.streak>1?`stays with ${esc(t.name)}`:`comes home to ${esc(t.name)}`):`${esc(t.name)} beats ${esc(m.opponent?.name||'')}`}</p><p class="cer-sub">${m.streak>1?`${m.streak} straight over ${esc(m.opponent?.name||'')}`:`over ${esc(m.opponent?.name||'')}`}</p>`};
 if(m.kind==='signing'){const [s5,s4,s3]=m.stars||[0,0,0];return{tone:'team',confetti:false,html:`<span class="cer-kicker">${m.year} · Signing Day</span><h2>The Class Is In</h2><p class="cer-team">${esc(t.name)} signs ${m.count}</p><div class="cer-stars"><span><b>${s5}</b>5★</span><span><b>${s4}</b>4★</span><span><b>${s3}</b>3★</span></div><ol class="cer-list">${(m.top||[]).map((r,i)=>`<li style="--i:${i}"><canvas class="portrait portrait-list" width="44" height="44" data-portrait="${esc(r.id)}" data-portrait-size="44" data-portrait-frame="list" data-portrait-kind="recruit" aria-hidden="true"></canvas><span><b>${esc(r.name)}</b><small>${esc(r.pos)} · ${stars(r.stars)}</small></span></li>`).join('')}</ol>`}}
 if(m.kind==='draft')return{tone:'team',confetti:false,html:`<span class="cer-kicker">${m.year} · Draft Night</span><h2>Your Players Go Pro</h2><p class="cer-team">${esc(t.name)} · ${m.picks.length} drafted</p><ol class="cer-list">${m.picks.map((p,i)=>`<li style="--i:${i}"><span class="cer-pick">R${esc(p.round)}<small>#${esc(p.pick)}</small></span><span><b>${esc(p.name)}</b><small>${esc(p.pos)} · ${esc(p.label)}</small></span></li>`).join('')}</ol>`};
 return null;
}
let queue=[],open=null,prev=null,pending=false,lastStatus='';
function close(){if(!open)return;const el=open;open=null;el.classList.add('is-leaving');setTimeout(()=>el.remove(),260);document.removeEventListener('keydown',onKey,true);setTimeout(next,280)}
function onKey(e){if(!open)return;if(e.key==='Escape'||e.key==='Enter'){e.preventDefault();close()}else if(e.key==='Tab'){e.preventDefault();open.querySelector('[data-ceremony-close]')?.focus()}}
function show(m){
 const b=bodyHTML(m);if(!b)return false;
 const el=document.createElement('div');el.className=`ceremony is-${m.kind} tone-${b.tone}`;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label',el.className.includes('national')?'National Champions':m.kind);el.dataset.ceremony=m.key;
 el.innerHTML=`${b.confetti?confettiHTML():''}<div class="cer-card">${b.html}<button type="button" class="bi-primary cer-continue" data-ceremony-close>Continue</button></div>`;
 document.body.append(el);open=el;
 globalThis.DynastyLabPortraits?.paint?.(el);
 el.querySelector('[data-ceremony-close]').addEventListener('click',close);
 el.addEventListener('click',e=>{if(e.target===el)close()});
 document.addEventListener('keydown',onKey,true);
 setTimeout(()=>el.querySelector('[data-ceremony-close]')?.focus(),50);
 return true;
}
function next(){if(open)return;const m=queue.shift();if(m&&!show(m))next()}
function check(){
 pending=false;const snap=globalThis.DynastyCeremonySnapshot?.read?.();if(!snap)return;
 const status=document.querySelector('#saveStatus')?.textContent||'';if(status!==lastStatus){lastStatus=status;if(/^(Loaded|Imported)/i.test(status.trim()))prev=null}
 const fresh=newMilestones(prev,snap);prev=snap;
 if(document.querySelector('#titleScreen:not([hidden])'))return;
 if(fresh.length&&api.autoplay){queue.push(...fresh);next()}
}
// The baseline is taken at the first render, not after the delay: a long synchronous sim (a whole regular
// season) must not fold its milestones into the baseline and swallow them.
function schedule(){if(!prev){const snap=globalThis.DynastyCeremonySnapshot?.read?.();if(snap)prev=snap}if(pending)return;pending=true;setTimeout(check,350)}
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{
  for(const sel of ['#weekLine','#recordBig','#saveStatus','#teamName','#signingDay'])document.querySelectorAll(sel).forEach(el=>new MutationObserver(schedule).observe(el,{childList:true,subtree:true,characterData:true}));
  schedule();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
// Ceremonies are modal; automated browsers keep them off unless a test switches them on.
const api={newMilestones,bodyHTML,confettiHTML,show,mount,autoplay:!(typeof navigator!=='undefined'&&navigator.webdriver),_reset(){prev=null;queue=[]}};
return api;
});
