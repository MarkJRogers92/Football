// Game HUD v1 — presentation only. Adds a "Playbook" command menu (Ctrl/Cmd+K or /),
// number-key group switching, a sliding group indicator and section entry transitions.
// It navigates only through the existing goToTab / tab buttons and never reads or writes save state.
(function(){
  'use strict';
  if(document.body.dataset.gameHud==='1')return;
  document.body.dataset.gameHud='1';

  const groupsNav=document.querySelector('.tab-groups');
  const tabsNav=document.querySelector('.tabs');
  if(!groupsNav||!tabsNav)return;

  // Mirrors TAB_GROUPS in app.js (app scope is not global).
  const GROUP_TABS={program:['dashboard','program','history'],team:['roster','depth','development'],recruiting:['recruiting'],games:['gamelab','season','stats','newsletter'],staff:['staff','offseason','records']};
  const ICONS={dashboard:'◆',program:'⚑',history:'⌛',roster:'☰',depth:'⇅',development:'▲',recruiting:'★',gamelab:'⚙',season:'▦',stats:'∑',newsletter:'✉',staff:'♟',offseason:'↻',records:'♛'};
  const HINTS={dashboard:'Weekly command center',program:'Identity, budget & facilities',history:'Archive & program legacy',roster:'Full player list',depth:'Roles and depth chart',development:'Training plans & camp',recruiting:'Board, scouting & signing class',gamelab:'Game plan & matchup',season:'Schedule & standings',stats:'Leaders & team stats',newsletter:'Weekly headlines',staff:'Coordinators & schemes',offseason:'Transitions & portal',records:'Awards & record book'};
  const titleOpen=()=>{const t=document.querySelector('#titleScreen');return !!t&&!t.hidden&&getComputedStyle(t).display!=='none'};
  const typing=el=>!!el&&(el.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  const groupButtons=()=>[...groupsNav.querySelectorAll('button[data-group]')];

  function entries(){
    return groupButtons().flatMap(g=>{
      const ids=GROUP_TABS[g.dataset.group]||[];
      return ids.map(id=>{const b=tabsNav.querySelector(`button[data-tab="${id}"]`);return b&&{id,group:g.firstChild.textContent.trim(),label:b.textContent.trim()}}).filter(Boolean);
    });
  }
  function go(id){
    const g=Object.keys(GROUP_TABS).find(k=>GROUP_TABS[k].includes(id));
    groupsNav.querySelector(`button[data-group="${g}"]`)?.click();
    tabsNav.querySelector(`button[data-tab="${id}"]`)?.click();
  }

  // ---- Sliding group indicator + number keys ----
  const bar=document.createElement('span');
  bar.className='hud-group-bar';bar.setAttribute('aria-hidden','true');
  groupsNav.append(bar);
  function moveBar(){
    const a=groupsNav.querySelector('button.active');
    if(!a||!a.offsetWidth){bar.style.opacity='0';return}
    bar.style.opacity='1';
    bar.style.width=a.offsetWidth+'px';
    bar.style.transform=`translate(${a.offsetLeft}px,${a.offsetTop+a.offsetHeight-3}px)`;
  }
  groupButtons().forEach((b,i)=>{
    const k=document.createElement('kbd');k.className='hud-key';k.textContent=String(i+1);k.setAttribute('aria-hidden','true');
    b.append(k);
  });

  // ---- Playbook trigger ----
  const trigger=document.createElement('button');
  trigger.type='button';trigger.className='hud-playbook-trigger';
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.innerHTML='<span aria-hidden="true">⌕</span> Playbook <kbd>'+(/Mac/i.test(navigator.platform)?'⌘':'Ctrl')+' K</kbd>';
  const pauseBtn=document.createElement('button');
  pauseBtn.type='button';pauseBtn.className='hud-pause-trigger';pauseBtn.setAttribute('aria-label','Open pause menu (Esc)');pauseBtn.title='Menu (Esc)';
  pauseBtn.textContent='❚❚';pauseBtn.addEventListener('click',()=>openPause());
  function placeTrigger(){
    const top=document.querySelector('.client-shell-ready .topbar');
    const host=top&&(top.querySelector('.client-status')||top);
    if(host&&trigger.parentNode!==host){host.append(trigger,pauseBtn);trigger.classList.add('in-topbar')}
    else if(!trigger.parentNode)groupsNav.after(trigger);
  }
  placeTrigger();setTimeout(placeTrigger,300);

  // ---- Playbook dialog ----
  const overlay=document.createElement('div');
  overlay.className='hud-playbook';overlay.hidden=true;
  overlay.innerHTML=`<div class="hud-playbook-card" role="dialog" aria-modal="true" aria-labelledby="hudPlaybookTitle">
    <header><span class="hud-eyebrow">PLAYBOOK</span><strong id="hudPlaybookTitle">Call your next play</strong></header>
    <input type="search" class="hud-playbook-search" placeholder="Jump to a section…" aria-label="Search sections" autocomplete="off">
    <ul class="hud-playbook-list" role="listbox" aria-label="Sections"></ul>
    <footer><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> run play</span><span><kbd>1</kbd>–<kbd>5</kbd> groups</span><span><kbd>Esc</kbd> close · pause</span></footer>
  </div>`;
  document.body.append(overlay);
  const input=overlay.querySelector('input'),list=overlay.querySelector('ul');
  let items=[],cursor=0,returnFocus=null;

  function render(){
    const q=input.value.trim().toLowerCase();
    items=entries().filter(e=>!q||`${e.label} ${e.group} ${HINTS[e.id]||''}`.toLowerCase().includes(q));
    cursor=Math.min(cursor,Math.max(0,items.length-1));
    const current=tabsNav.querySelector('button.active')?.dataset.tab||null;
    list.replaceChildren(...items.map((e,i)=>{
      const li=document.createElement('li');
      li.setAttribute('role','option');li.id='hudOpt'+i;li.dataset.tab=e.id;
      li.setAttribute('aria-selected',String(i===cursor));
      li.className=(i===cursor?'is-cursor ':'')+(e.id===current?'is-current':'');
      li.innerHTML='<span class="hud-icon" aria-hidden="true"></span><span class="hud-copy"><strong></strong><small></small></span><span class="hud-chip"></span>';
      li.querySelector('.hud-icon').textContent=ICONS[e.id]||'•';
      li.querySelector('strong').textContent=e.label;
      li.querySelector('small').textContent=HINTS[e.id]||'';
      li.querySelector('.hud-chip').textContent=e.id===current?'ON FIELD':e.group.toUpperCase();
      li.addEventListener('mousemove',()=>{if(cursor!==i){cursor=i;render()}});
      li.addEventListener('click',()=>pick(i));
      return li;
    }));
    if(!items.length){const li=document.createElement('li');li.className='hud-empty';li.textContent='No matching section.';list.append(li)}
    input.setAttribute('aria-activedescendant',items.length?'hudOpt'+cursor:'');
    list.querySelector('.is-cursor')?.scrollIntoView?.({block:'nearest'});
  }
  function open(){
    if(titleOpen()||!overlay.hidden)return;
    returnFocus=document.activeElement;
    overlay.hidden=false;input.value='';cursor=0;render();
    requestAnimationFrame(()=>{overlay.classList.add('is-open');input.focus()});
  }
  function close(){
    overlay.classList.remove('is-open');overlay.hidden=true;
    returnFocus?.focus?.();
  }
  function pick(i){const e=items[i];if(!e)return;close();go(e.id)}

  input.addEventListener('input',()=>{cursor=0;render()});
  overlay.addEventListener('keydown',ev=>{
    const n=Math.max(1,items.length);
    if(ev.key==='ArrowDown'){ev.preventDefault();cursor=(cursor+1)%n;render()}
    else if(ev.key==='ArrowUp'){ev.preventDefault();cursor=(cursor-1+n)%n;render()}
    else if(ev.key==='Enter'){ev.preventDefault();pick(cursor)}
    else if(ev.key==='Escape'){ev.preventDefault();ev.stopPropagation();close()}
    else if(ev.key==='Tab'){ev.preventDefault();input.focus()}
  });
  overlay.addEventListener('mousedown',ev=>{if(ev.target===overlay)close()});
  trigger.addEventListener('click',open);

  document.addEventListener('keydown',ev=>{
    if(!pause.hidden){if(ev.key==='Escape'){ev.preventDefault();closePause()}return}
    if(!overlay.hidden||titleOpen()||document.querySelector('dialog[open]'))return;
    if(ev.key==='Escape'&&!typing(ev.target)){ev.preventDefault();openPause();return}
    if((ev.metaKey||ev.ctrlKey)&&ev.key.toLowerCase()==='k'){ev.preventDefault();open();return}
    if(typing(ev.target)||ev.metaKey||ev.ctrlKey||ev.altKey)return;
    if(ev.key==='/'){ev.preventDefault();open();return}
    const n=Number(ev.key);
    if(n>=1&&n<=groupButtons().length)groupButtons()[n-1].click();
  });

  // ---- Esc pause menu ----
  const pause=document.createElement('div');
  pause.className='hud-pause';pause.hidden=true;
  pause.innerHTML=`<div class="hud-pause-card" role="dialog" aria-modal="true" aria-labelledby="hudPauseTitle">
    <span class="hud-eyebrow">TIMEOUT</span><strong id="hudPauseTitle" class="hud-pause-title">Front Office</strong>
    <div class="hud-pause-meta"></div>
    <nav class="hud-pause-menu" aria-label="Pause menu"></nav>
    <small class="hud-pause-foot">Esc to resume</small></div>`;
  document.body.append(pause);
  const pauseMenu=pause.querySelector('nav');
  const ACTIONS=[
    ['Resume','▶',()=>{}],
    ['Playbook','⌕',()=>setTimeout(open,30)],
    ['Save Dynasty','💾',()=>document.querySelector('#saveBrowser')?.click(),'#saveBrowser'],
    ['Load Save','⤓',()=>document.querySelector('#loadBrowser')?.click(),'#loadBrowser'],
    ['Export Save','⇪',()=>document.querySelector('#exportSave')?.click(),'#exportSave'],
    ['Title Screen','⏏',()=>document.querySelector('#newUniverse')?.click(),'#newUniverse']];
  function openPause(){
    returnFocus=document.activeElement;
    const txt=sel=>document.querySelector(sel)?.textContent?.trim()||'';
    pause.querySelector('.hud-pause-title').textContent=txt('#teamName')||'Front Office';
    pause.querySelector('.hud-pause-meta').textContent=[txt('#recordBig'),txt('#rankLine'),txt('#weekLine')].filter(Boolean).join(' · ');
    pauseMenu.replaceChildren(...ACTIONS.filter(a=>!a[3]||document.querySelector(a[3])).map(([label,icon,fn],i)=>{
      const b=document.createElement('button');b.type='button';b.className='hud-pause-item';b.style.setProperty('--i',i);
      b.innerHTML='<span aria-hidden="true"></span><strong></strong>';
      b.firstChild.textContent=icon;b.lastChild.textContent=label;
      b.addEventListener('click',()=>{closePause(false);fn()});
      return b;
    }));
    pause.hidden=false;requestAnimationFrame(()=>{pause.classList.add('is-open');pauseMenu.firstChild?.focus()});
  }
  function closePause(restore=true){pause.classList.remove('is-open');pause.hidden=true;if(restore)returnFocus?.focus?.()}
  pause.addEventListener('mousedown',ev=>{if(ev.target===pause)closePause()});
  pause.addEventListener('keydown',ev=>{
    const bs=[...pauseMenu.children],i=bs.indexOf(document.activeElement);
    if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ev.preventDefault();bs[(i+(ev.key==='ArrowDown'?1:-1)+bs.length)%bs.length]?.focus()}
    else if(ev.key==='Tab'){ev.preventDefault();bs[(i+(ev.shiftKey?-1:1)+bs.length)%bs.length]?.focus()}
  });

  // ---- Toasts mirroring the save-status line ----
  const toasts=document.createElement('div');
  toasts.className='hud-toasts';toasts.setAttribute('role','status');toasts.setAttribute('aria-live','polite');
  document.body.append(toasts);
  const statusLine=document.querySelector('#saveStatus');
  let lastStatus=statusLine?.textContent?.trim()||'';
  function toast(text){
    const t=document.createElement('div');t.className='hud-toast';
    const ok=/sav|load|export|import/i.test(text)&&!/fail|could not|error/i.test(text);
    if(/fail|could not|error/i.test(text))t.classList.add('is-bad');else if(ok)t.classList.add('is-good');
    t.innerHTML='<span aria-hidden="true"></span><p></p>';
    t.firstChild.textContent=t.classList.contains('is-bad')?'!':ok?'✓':'•';t.lastChild.textContent=text;
    toasts.append(t);while(toasts.children.length>3)toasts.firstChild.remove();
    setTimeout(()=>t.classList.add('is-leaving'),3600);setTimeout(()=>t.remove(),4000);
  }
  if(statusLine)new MutationObserver(()=>{
    const v=statusLine.textContent.trim();
    if(v&&v!==lastStatus&&!titleOpen()){if(!splash(v))toast(v);tick(v)}
    lastStatus=v;
  }).observe(statusLine,{childList:true,characterData:true,subtree:true});

  // ---- Result splash (week finals, new job) ----
  const reduced=()=>document.body.classList.contains('motion-reduced')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function splash(text){
    let m=text.match(/^Week (\d+) final: ([WL]) (\d+)-(\d+) (vs|at) (.+?)\.?$/),kind,big,sub;
    if(m){kind=m[2]==='W'?'win':'loss';big=m[2]==='W'?'VICTORY':'FINAL';sub=`${m[3]}–${m[4]} ${m[5]} ${m[6]} · Week ${m[1]}`}
    else if((m=text.match(/^Took the (.+?) job\./))){kind='job';big='NEW ERA';sub=`Welcome to ${m[1]}`}
    else return false;
    document.querySelector('.hud-splash')?.remove();
    const el=document.createElement('div');
    el.className='hud-splash is-'+kind;el.setAttribute('role','status');
    el.innerHTML='<div class="hud-splash-band"><span class="hud-eyebrow"></span><strong></strong><small></small></div>';
    el.querySelector('.hud-eyebrow').textContent=kind==='job'?'CAREER MOVE':(document.querySelector('#teamName')?.textContent?.trim()||'FINAL SCORE').toUpperCase();
    el.querySelector('strong').textContent=big;el.querySelector('small').textContent=sub;
    if(kind==='win'&&!reduced())for(let i=0;i<28;i++){const c=document.createElement('i');c.style.setProperty('--x',Math.random()*100+'%');c.style.setProperty('--d',(Math.random()*.6)+'s');c.style.setProperty('--r',(Math.random()*720-360)+'deg');el.append(c)}
    document.body.append(el);
    setTimeout(()=>el.classList.add('is-leaving'),2400);setTimeout(()=>el.remove(),2900);
    return true;
  }

  // ---- Broadcast ticker of this session's headlines ----
  const ticker=document.createElement('div');
  ticker.className='hud-ticker';ticker.setAttribute('aria-label','Session headlines');
  ticker.innerHTML='<span class="hud-ticker-tag">LIVE</span><div class="hud-ticker-track"><div class="hud-ticker-reel"></div></div>';
  const reel=ticker.querySelector('.hud-ticker-reel');const feed=[];
  function tick(text){
    if(/^(Saved|Loaded|Exported)/.test(text))return;
    feed.unshift(text);feed.length=Math.min(feed.length,8);
    const top=document.querySelector('.topbar');if(top&&!ticker.isConnected)top.after(ticker);
    reel.replaceChildren(...[...feed,...feed].map(t=>{const s=document.createElement('span');s.textContent=t;return s}));
    reel.style.setProperty('--dur',Math.max(18,feed.join(' ').length/7)+'s');
  }

  // ---- Status bar: animated record/rank, rank movement, week flip ----
  const rankNum=t=>{const m=String(t).match(/#(\d+)/);return m?Number(m[1]):null};
  function flash(el,dir){el.classList.remove('hud-up','hud-down','hud-pulse');void el.offsetWidth;el.classList.add(dir>0?'hud-up':dir<0?'hud-down':'hud-pulse')}
  function weekFlip(label){
    const show=()=>{
      document.querySelector('.hud-weekflip')?.remove();
      const el=document.createElement('div');el.className='hud-weekflip';el.setAttribute('aria-hidden','true');
      el.innerHTML='<div><small>NOW ENTERING</small><strong></strong></div>';el.querySelector('strong').textContent=label.toUpperCase();
      document.body.append(el);setTimeout(()=>el.remove(),1500);
    };
    if(reduced()||document.querySelector('.hud-intro'))return;
    document.querySelector('.hud-splash')?setTimeout(show,2900):show();
  }
  const watched=new WeakSet();
  function watchStatus(){
    const rec=document.querySelector('[data-client-record]'),rank=document.querySelector('[data-client-rank]'),week=document.querySelector('[data-client-week]');
    if(rec&&!watched.has(rec)){watched.add(rec);let last=rec.textContent;new MutationObserver(()=>{const v=rec.textContent;if(v===last)return;
      const w=a=>Number((a.match(/^(\d+)/)||[])[1]||0);flash(rec,w(v)>w(last)?1:w(v)===w(last)?-1:0);last=v}).observe(rec,{childList:true,characterData:true,subtree:true})}
    if(rank&&!watched.has(rank)){watched.add(rank);let last=rank.textContent;
      const badge=document.createElement('span');badge.className='hud-rank-move';badge.hidden=true;rank.after(badge);
      new MutationObserver(()=>{const v=rank.textContent;if(v===last)return;const a=rankNum(last),b=rankNum(v);last=v;
        if(a!=null&&b!=null&&a!==b){const up=b<a;badge.hidden=false;badge.className='hud-rank-move '+(up?'is-up':'is-down');badge.textContent=(up?'▲':'▼')+Math.abs(a-b);flash(rank,up?1:-1)}
        else if(b==null)badge.hidden=true;
      }).observe(rank,{childList:true,characterData:true,subtree:true})}
    if(week&&!watched.has(week)){watched.add(week);let last=week.textContent;new MutationObserver(()=>{const v=week.textContent;if(v===last)return;
      const m=v.match(/Week \d+|Bowl[^·]*|Playoff[^·]*|Offseason|Preseason/i);if(m&&!titleOpen()&&!last.includes(m[0]))weekFlip(m[0].trim());last=v}).observe(week,{childList:true,characterData:true,subtree:true})}
  }
  watchStatus();setTimeout(watchStatus,500);new MutationObserver(watchStatus).observe(document.body,{childList:true});

  // ---- Game-day intro (first appearance of a live scoreboard) ----
  const introduced=new Set();let armed=0;
  document.addEventListener('click',ev=>{if(ev.target.closest?.('[data-v2-gameday-start]'))armed=Date.now()},true);
  function maybeIntro(){
    const board=document.querySelector('.v2-gameday-scoreboard');
    if(!board||reduced())return;
    const away=board.querySelector('.away'),home=board.querySelector('.home');
    const names=[away,home].map(t=>t?.querySelector('span:not(.team-logo)')?.textContent?.trim()||'');
    const key=names.join('|')+'|'+(document.querySelector('[data-client-week]')?.textContent||'');
    if(!names[0]||introduced.has(key)||Date.now()-armed>4000)return;
    introduced.add(key);
    const el=document.createElement('div');el.className='hud-intro';el.setAttribute('role','status');
    el.innerHTML='<div class="hud-intro-side away"></div><div class="hud-intro-vs">VS</div><div class="hud-intro-side home"></div><small class="hud-intro-tag">KICKOFF</small>';
    [[away,'.away',names[0]],[home,'.home',names[1]]].forEach(([src,sel,name])=>{
      const side=el.querySelector('.hud-intro-side'+sel);
      const logo=src.querySelector('.team-logo, img, svg, [class*="logo"]');if(logo)side.append(logo.cloneNode(true));
      const n=document.createElement('strong');n.textContent=name;side.append(n);
    });
    document.body.append(el);setTimeout(()=>el.classList.add('is-leaving'),1900);setTimeout(()=>el.remove(),2400);
  }
  new MutationObserver(maybeIntro).observe(document.querySelector('#app')||document.body,{childList:true,subtree:true});

  // ---- Section entry transitions + indicator sync ----
  let last=document.querySelector('.tab.active');
  const obs=new MutationObserver(()=>{
    moveBar();
    const now=document.querySelector('.tab.active');
    if(now&&now!==last){
      last=now;
      now.classList.remove('hud-enter');void now.offsetWidth;now.classList.add('hud-enter');
    }
  });
  obs.observe(groupsNav,{subtree:true,attributes:true,attributeFilter:['class']});
  document.querySelectorAll('.tab').forEach(t=>obs.observe(t,{attributes:true,attributeFilter:['class']}));
  document.addEventListener('animationend',ev=>{if(ev.target.classList?.contains('hud-enter'))ev.target.classList.remove('hud-enter')});
  window.addEventListener('resize',moveBar);
  requestAnimationFrame(moveBar);
  setTimeout(moveBar,400);
})();
