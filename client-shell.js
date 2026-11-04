(function(){
  'use strict';

  const TAB_GROUP={dashboard:'program',program:'program',history:'program',roster:'team',depth:'team',development:'team',recruiting:'recruiting',gamelab:'games',season:'games',stats:'games',newsletter:'games',staff:'staff',offseason:'staff',records:'staff'};
  const NAV=[
    {label:'Home',items:[['dashboard','Command Center'],['newsletter','News / Inbox']]},
    {label:'Program',items:[['program','Program Overview'],['roster','Roster'],['depth','Roles & Depth'],['development','Development'],['staff','Staff'],['offseason','Offseason']]},
    {label:'Recruiting',items:[['recruiting','Recruiting Board']]},
    {label:'Season',items:[['gamelab','Game Lab'],['season','Schedule'],['stats','Stats & Rankings']]},
    {label:'World',items:[['history','History'],['records','Awards & Records']]}
  ];

  // Outline icons (16x16, stroke = currentColor) so the nav can be scanned, not just read.
  const NAV_ICONS={
    dashboard:'<rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>',
    newsletter:'<rect x="2" y="3.5" width="12" height="9" rx="1.5"/><path d="M2.5 4.5 8 9l5.5-4.5"/>',
    program:'<path d="M2 13h12M3.5 13V7.5M6.5 13V7.5M9.5 13V7.5M12.5 13V7.5M2 6.5 8 3l6 3.5z"/>',
    roster:'<circle cx="6" cy="5.5" r="2.2"/><path d="M2 13c0-2.4 1.8-4 4-4s4 1.6 4 4"/><circle cx="11.5" cy="6" r="1.7"/><path d="M11 9.2c2 .2 3.2 1.5 3.2 3.8"/>',
    depth:'<path d="M8 2 14 5.5 8 9 2 5.5z"/><path d="M2 8.5 8 12l6-3.5"/>',
    development:'<path d="M2 12 6 8l2.5 2.5L14 4.5M10.5 4.5H14V8"/>',
    staff:'<rect x="2" y="5" width="12" height="8" rx="1.5"/><path d="M6 5V3.5h4V5M2 8.5h12"/>',
    offseason:'<rect x="2" y="3.5" width="12" height="10" rx="1.5"/><path d="M2 7h12M5.5 2v3M10.5 2v3"/>',
    recruiting:'<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2.5"/><path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5"/>',
    gamelab:'<ellipse cx="8" cy="8" rx="6.2" ry="3.7" transform="rotate(-35 8 8)"/><path d="M6.2 9.8 9.8 6.2M7 6.8l.9.9M8.2 8.1l.9.9"/>',
    season:'<path d="M5 4h9M5 8h9M5 12h9"/><circle cx="2.5" cy="4" r=".7"/><circle cx="2.5" cy="8" r=".7"/><circle cx="2.5" cy="12" r=".7"/>',
    stats:'<path d="M3.5 13V8.5M7.5 13V4M11.5 13V6.5M2 13.5h12"/>',
    history:'<circle cx="8" cy="8" r="5.5"/><path d="M8 4.8V8l2.2 1.4"/>',
    records:'<path d="M5 2.5h6v3.5a3 3 0 0 1-6 0zM5 4H2.5c0 2 1 3 2.5 3M11 4h2.5c0 2-1 3-2.5 3M8 9v2.5M5.5 13.5h5"/>',
    more:'<circle cx="3.5" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="12.5" cy="8" r="1"/>'
  };
  const navIcon=tab=>NAV_ICONS[tab]?`<svg class="client-nav-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${NAV_ICONS[tab]}</svg>`:'';

  const app=document.querySelector('#app');
  const topbar=app?.querySelector('.topbar');
  const tabsShell=app?.querySelector('.tabs-shell');
  if(!app||!topbar||!tabsShell||document.querySelector('#clientRail'))return;

  function navButton(tab,label,extra=''){
    return `<button type="button" class="client-nav-item ${extra}" data-client-tab="${tab}">${navIcon(tab)}<span>${label}</span></button>`;
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
  mobile.innerHTML=`${navButton('dashboard','Home','client-mobile-item')}${navButton('roster','Program','client-mobile-item')}${navButton('recruiting','Recruit','client-mobile-item')}${navButton('gamelab','Season','client-mobile-item')}<button type="button" class="client-mobile-item" data-client-more>${navIcon('more')}<span>More</span></button>`;
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
