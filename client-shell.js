(function(){
  'use strict';

  const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
  const NAV=[
    {label:'Home',items:[['dashboard','Command Center'],['newsletter','News / Inbox']]},
    {label:'Program',items:[['program','Program Overview'],['roster','Roster'],['depth','Roles & Depth'],['development','Development'],['staff','Staff'],['offseason','Offseason']]},
    {label:'Recruiting',items:[['recruiting','Recruiting Board']]},
    {label:'Season',items:[['gamelab','Game Center'],['season','Schedule'],['stats','Stats & Rankings']]},
    {label:'World',items:[['history','History'],['records','Awards & Records']]}
  ];

  const app=document.querySelector('#app');
  const topbar=app?.querySelector('.topbar');
  const tabsShell=app?.querySelector('.tabs-shell');
  if(!app||!topbar||!tabsShell||document.querySelector('#clientRail'))return;

  function navButton(tab,label,extra=''){
    return `<button type="button" class="client-nav-item ${extra}" data-client-tab="${tab}"><span>${label}</span></button>`;
  }

  const rail=document.createElement('aside');
  rail.id='clientRail';
  rail.className='client-rail';
  rail.setAttribute('aria-label','Dynasty Lab navigation');
  rail.innerHTML=`
    <div class="client-rail-brand"><strong>DYNASTY LAB</strong><span>Front Office</span></div>
    <nav class="client-rail-nav">${NAV.map(group=>`<section class="client-nav-group"><div class="client-nav-label">${group.label}</div>${group.items.map(([tab,label])=>navButton(tab,label)).join('')}</section>`).join('')}</nav>
    <div class="client-rail-footer">
      <details class="client-utilities">
        <summary>Dynasty &amp; Saves</summary>
        <div class="client-utility-host"></div>
      </details>
      <span data-client-version>Dynasty Lab</span>
    </div>`;
  topbar.insertAdjacentElement('beforebegin',rail);

  const navToggle=document.createElement('button');
  navToggle.type='button';
  navToggle.className='client-nav-toggle';
  navToggle.setAttribute('aria-label','Open navigation');
  navToggle.setAttribute('aria-expanded','false');
  navToggle.innerHTML='<span aria-hidden="true">☰</span><span>Menu</span>';
  topbar.insertAdjacentElement('afterbegin',navToggle);

  const actions=topbar.querySelector('.header-actions');
  if(actions){
    actions.classList.add('client-utility-actions');
    rail.querySelector('.client-utility-host')?.appendChild(actions);
  }

  const status=document.createElement('div');
  status.id='clientStatus';
  status.className='client-status';
  status.innerHTML=`<div class="client-status-program"><strong data-client-program>Program</strong><span data-client-context>Dynasty</span></div><div class="client-status-facts"><span data-client-record>0–0</span><span data-client-rank>Preseason</span><span data-client-week>Week 0</span></div>`;
  topbar.append(status);

  const mobile=document.createElement('nav');
  mobile.className='client-mobile-nav';
  mobile.setAttribute('aria-label','Quick navigation');
  mobile.innerHTML=`${navButton('dashboard','Home','client-mobile-item')}${navButton('roster','Program','client-mobile-item')}${navButton('recruiting','Recruit','client-mobile-item')}${navButton('gamelab','Season','client-mobile-item')}<button type="button" class="client-mobile-item" data-client-more>More</button>`;
  app.appendChild(mobile);

  function currentTab(){return app.querySelector('.tabs button.active[data-tab]')?.dataset.tab||'dashboard'}

  function go(tab){
    const groupId=TAB_GROUP[tab];
    const group=groupId&&app.querySelector(`.tab-groups button[data-group="${groupId}"]`);
    if(group&&!group.classList.contains('active'))group.click();
    const target=app.querySelector(`.tabs button[data-tab="${tab}"]`);
    if(target)target.click();
    closeRail();
    setTimeout(sync,0);
  }

  function clean(text,fallback){const v=String(text||'').replace(/\s+/g,' ').trim();return v&&v!=='—'?v:fallback}
  function syncStatus(){
    const program=clean(document.querySelector('#teamName')?.textContent,document.querySelector('#userTeam')?.selectedOptions?.[0]?.textContent||'Program');
    const record=clean(document.querySelector('#recordBig')?.textContent,'0–0');
    const rank=clean(document.querySelector('#rankLine')?.textContent,'Preseason');
    const week=clean(document.querySelector('#weekLine')?.textContent,'Week 0');
    const programEl=status.querySelector('[data-client-program]'),recordEl=status.querySelector('[data-client-record]'),rankEl=status.querySelector('[data-client-rank]'),weekEl=status.querySelector('[data-client-week]');
    if(programEl)programEl.textContent=program;if(recordEl)recordEl.textContent=record;if(rankEl)rankEl.textContent=rank;if(weekEl)weekEl.textContent=week;
    const version=document.querySelector('[data-app-version]')?.textContent?.trim();const versionEl=rail.querySelector('[data-client-version]');if(versionEl&&version)versionEl.textContent=`Dynasty Lab ${version}`;
  }

  function sync(){
    const tab=currentTab();
    app.querySelectorAll('[data-client-tab]').forEach(button=>{const active=button.dataset.clientTab===tab;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'page':'false')});
    syncStatus();
  }

  function openRail(){app.classList.add('client-rail-open');navToggle.setAttribute('aria-expanded','true')}
  function closeRail(){app.classList.remove('client-rail-open');navToggle.setAttribute('aria-expanded','false')}

  app.addEventListener('click',event=>{
    const nav=event.target.closest('[data-client-tab]');if(nav){event.preventDefault();go(nav.dataset.clientTab);return}
    const more=event.target.closest('[data-client-more]');if(more){event.preventDefault();app.classList.contains('client-rail-open')?closeRail():openRail();return}
    const utilityButton=event.target.closest('.client-utility-actions button');if(utilityButton){setTimeout(closeRail,0);return}
    if(event.target.closest('.tabs button,.tab-groups button'))setTimeout(sync,0);
  });
  navToggle.addEventListener('click',()=>app.classList.contains('client-rail-open')?closeRail():openRail());
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeRail()});
  document.querySelector('#userTeam')?.addEventListener('change',()=>setTimeout(syncStatus,0));

  const watched=['teamName','recordBig','rankLine','weekLine'];
  for(const id of watched){const node=document.getElementById(id);if(node)new MutationObserver(syncStatus).observe(node,{childList:true,subtree:true,characterData:true})}
  const tabObserver=new MutationObserver(sync);app.querySelectorAll('.tabs button[data-tab]').forEach(button=>tabObserver.observe(button,{attributes:true,attributeFilter:['class','hidden']}));

  app.classList.add('client-shell-ready');
  sync();
})();
