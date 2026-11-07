// Peer recruiting views preserve the existing modules and their independent UI state.
(()=>{
 'use strict';
 const tab=document.querySelector('#recruiting');if(!tab)return;
 let view='current',queued=false;
 const keys=['current','rising','outlook','map','shortlist','summary','history'];
 function paint(){
  queued=false;
  const head=tab.querySelector(':scope > .section-head');if(!head)return;
  let bar=tab.querySelector('#recruitClassViews');
  if(!bar){bar=document.createElement('div');bar.id='recruitClassViews';bar.className='recruit-class-views';bar.setAttribute('role','group');bar.setAttribute('aria-label','Recruiting views');bar.innerHTML=keys.map(key=>`<button type="button" data-recruit-class="${key}" aria-pressed="false"></button>`).join('');head.after(bar);bar.addEventListener('click',e=>{const button=e.target.closest('[data-recruit-class]');if(button)show(button.dataset.recruitClass)})}
  if(head.nextElementSibling!==bar)head.after(bar);
  const year=globalThis.DynastyRecruitingNeeds?.snapshot?.()?.year;
  const labels={current:`Current · ${year??'this year'}`,rising:`Rising · ${year!=null?year+1:'next year'}`,outlook:'Outlook',map:'Map',shortlist:'Shortlist',summary:'Class summary',history:'History'};
  bar.querySelectorAll('[data-recruit-class]').forEach(b=>{const key=b.dataset.recruitClass;if(b.textContent!==labels[key])b.textContent=labels[key];b.setAttribute('aria-pressed',String(view===key))});
  const panels={risingClass:'rising',recruitingNeeds:'outlook',recruitMap:'map',staffRecruitShortlist:'shortlist',classSummary:'summary',signingClassFeature:'summary',signingDay:'summary',recruitingHistory:'history'};
  for(const node of tab.children){if(node===head||node===bar||node.matches('.guidance-return-context')){delete node.dataset.recruitClassPanel;continue}const key=panels[node.id]||'current';if(node.dataset.recruitClassPanel!==key)node.dataset.recruitClassPanel=key}
  tab.dataset.recruitClassView=view;
 }
 function show(key){if(!keys.includes(key))return;view=key;paint();tab.querySelector(`[data-recruit-class="${key}"]`)?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})}
 function queue(){if(queued)return;queued=true;requestAnimationFrame(paint)}
 // Panel additions and canonical summary rebuilds affect routing; map hover tips do not.
 const observer=new MutationObserver(queue);observer.observe(tab,{childList:true});
 const summary=tab.querySelector('#classSummary');if(summary)observer.observe(summary,{childList:true});
 globalThis.DynastyRecruitingClasses=Object.freeze({show,current:()=>view});
 paint();
})();
