(function(){
  'use strict';

  // The Command Center stacks every dashboard card in one long scroll. This splits the cards that
  // arrive from several modules into three views without changing any of them: the week's work
  // (default), stories and goals, and the league picture. Cards are classified, never moved.
  const VIEWS=[['week','This week'],['stories','Players & goals'],['league','League']];
  const dash=document.querySelector('#dashboard');
  if(!dash||dash.querySelector('.dash-views'))return;

  let view='week';

  function classify(node){
    if(node.matches('.program-masthead,.dash-views'))return'all';
    if(node.matches('#v0102PlayerStories,#seasonStoryRail')||node.querySelector?.('#seasonGoalsDashboard'))return'stories';
    if(node.querySelector?.('#top15,#snapshot'))return'league';
    return'week';
  }
  function tag(){
    // Other modules insert their strips right after the masthead; keep the switcher first so it never jumps between views.
    const bar=dash.querySelector('.dash-views'),masthead=dash.querySelector('.program-masthead');
    if(bar&&masthead&&masthead.nextElementSibling!==bar)masthead.insertAdjacentElement('afterend',bar);
    for(const node of dash.children)node.dataset.dview=classify(node);
    dash.dataset.view=view;
  }
  function counts(){
    const stories=[...dash.querySelectorAll('#v0102PlayerStories .v0102-story-grid > *,#seasonStoryRail .season-story-card')].length;
    return{stories};
  }
  function paint(){
    const bar=dash.querySelector('.dash-views');if(!bar)return;
    const c=counts();
    bar.querySelectorAll('[data-dash-view]').forEach(button=>{
      const on=button.dataset.dashView===view;
      button.classList.toggle('active',on);button.setAttribute('aria-selected',on?'true':'false');button.tabIndex=on?0:-1;
      const badge=button.querySelector('i'),text=button.dataset.dashView==='stories'&&c.stories?String(c.stories):'';if(badge&&badge.textContent!==text)badge.textContent=text;
    });
  }
  function show(next){
    if(!VIEWS.some(([key])=>key===next))return;
    view=next;tag();paint();
  }
  function mount(){
    const bar=document.createElement('div');
    bar.className='dash-views';bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Dashboard view');
    bar.innerHTML=VIEWS.map(([key,label])=>`<button type="button" role="tab" data-dash-view="${key}">${label}<i></i></button>`).join('');
    bar.addEventListener('click',event=>{const button=event.target.closest('[data-dash-view]');if(button)show(button.dataset.dashView)});
    bar.addEventListener('keydown',event=>{
      if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;
      const keys=VIEWS.map(([key])=>key),at=keys.indexOf(view),next=keys[(at+(event.key==='ArrowRight'?1:keys.length-1))%keys.length];
      show(next);bar.querySelector(`[data-dash-view="${next}"]`)?.focus();
    });
    const masthead=dash.querySelector('.program-masthead');
    if(masthead)masthead.insertAdjacentElement('afterend',bar);else dash.prepend(bar);
  }

  mount();tag();paint();
  // Other modules append their cards after first render, so re-tag whenever the child list changes.
  // paint only writes when the badge changes, and the refresh runs at most once per frame.
  let queued=false;
  const refresh=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;tag();paint()})};
  new MutationObserver(refresh).observe(dash,{childList:true,subtree:true});

  window.DynastyDashboardViews={show,current:()=>view};
})();
