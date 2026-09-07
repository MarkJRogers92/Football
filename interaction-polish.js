(() => {
'use strict';
const motion=window.matchMedia?.('(prefers-reduced-motion: reduce)');
const observed=new WeakSet(),timers=new WeakMap();
function reduced(){return !!motion?.matches}
function markMode(){document.documentElement.dataset.dlMotion=reduced()?'reduced':'full'}
function visible(el){if(!el)return false;const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&!el.hidden}
function replay(el,kind='surface'){
 if(!el||reduced()||!visible(el))return;
 const cls=`dl-motion-${kind}`;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);
 clearTimeout(timers.get(el));timers.set(el,setTimeout(()=>el.classList.remove(cls),360));
}
function values(root){if(!root||reduced())return;for(const el of root.querySelectorAll('strong,b')){if(el.closest('button')||!visible(el))continue;el.classList.remove('dl-motion-value');void el.offsetWidth;el.classList.add('dl-motion-value');setTimeout(()=>el.classList.remove('dl-motion-value'),300)}}
function watch(selector,childSelector,kind='surface',valueMotion=false){
 const host=document.querySelector(selector);if(!host||observed.has(host))return;observed.add(host);
 let queued=false;const run=()=>{queued=false;const target=childSelector?host.querySelector(childSelector):host;if(!target)return;replay(target,kind);if(valueMotion)values(target)};
 new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(run)}).observe(host,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden','class']});
 if(visible(host))requestAnimationFrame(run);
}
function attach(){
 watch('#recruitWorkspace','.recruit-workspace-dossier','detail',true);
 watch('#developmentVisualLab','.dev-player-detail','detail',true);
 watch('#playerIdentityHero',null,'detail',true);
 watch('#gamedayEventHero',null,'result',true);
 watch('#seasonPulse',null,'result',true);
 watch('#seasonStoryRail',null,'surface',false);
 watch('#rosterPositionBoard',null,'surface',false);
 watch('#depthFormationBoard',null,'surface',false);
 watch('#dynastyMuseum',null,'surface',true);
}
function routeReveal(){
 const active=[...document.querySelectorAll('.tab.active')].find(visible);if(!active)return;
 const first=active.querySelector(':scope > .section-head + *')||active.querySelector(':scope > .section-head')||active.firstElementChild;
 replay(first||active,'surface');
}
markMode();motion?.addEventListener?.('change',()=>{markMode();document.querySelectorAll('.dl-motion-surface,.dl-motion-detail,.dl-motion-value,.dl-motion-result').forEach(el=>el.classList.remove('dl-motion-surface','dl-motion-detail','dl-motion-value','dl-motion-result'))});
document.addEventListener('click',e=>{
 const route=e.target.closest?.('[data-client-tab],.tabs button[data-tab]');if(route)setTimeout(()=>{attach();routeReveal()},0);
 if(e.target.closest?.('[data-rwid],[data-rwf],[data-rwa],[data-scout-action],[data-dev-player],[data-player],[data-rd-player],[data-rd-assign],.season-story-card'))setTimeout(attach,0);
},true);
const bodyObserver=new MutationObserver(()=>attach());if(document.body)bodyObserver.observe(document.body,{childList:true,subtree:true});
attach();setTimeout(attach,0);setTimeout(attach,150);
})();
