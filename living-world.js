// Optional continuity: device preferences only. Reading stories never creates a coaching obligation.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.DynastyLivingWorld=api;api.mount()}})(typeof window!=='undefined'?window:this,function(){
'use strict';
const KEY='dynastyLabFollowing',LIMIT=24;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const emptyStore=()=>({version:1,worlds:{}});
const followed=(store,snap)=>Array.isArray(store?.worlds?.[snap?.worldKey])?store.worlds[snap.worldKey].filter(x=>x&&typeof x.key==='string'&&typeof x.name==='string'):[];
const copy=store=>JSON.parse(JSON.stringify(store?.version===1&&store.worlds?store:emptyStore()));
const clock=s=>(Number(s.year)||0)*10000+(Number(s.week)||0)*100+({preseason:0,regular:1,confReady:2,bowlReady:3,playoffReady:4,complete:5}[s.phase]||0)*10+(s.phase==='complete'?Math.max(0,['review','departures','signing','portal','spring','fall','preseason'].indexOf(s.offseasonPhase)):0);
const facts=p=>({team:p.team,teamId:p.teamId,status:p.status,role:p.role,injured:!!p.injured});
function toggleFollow(store,snap,key){
 const s=copy(store);if(!snap?.worldKey)return s;
 const rows=followed(s,snap),exists=rows.some(x=>x.key===key);
 if(exists)s.worlds[snap.worldKey]=rows.filter(x=>x.key!==key);
 else{const p=snap.people.find(x=>x.key===key);if(p&&rows.length<LIMIT)s.worlds[snap.worldKey]=[...rows,{key:p.key,name:p.name,kind:p.kind,id:p.id,baseline:facts(p),observed:clock(snap),update:null}]}
 return s;
}
function change(old,p){
 if(p.status!==old.status&&p.status==='drafted')return`${p.name} was drafted`;
 if(p.status!==old.status&&p.status==='portal')return`${p.name} entered the portal`;
 if(p.status!==old.status&&['career-complete','retired','departed'].includes(p.status))return`${p.name}: ${p.status==='retired'?'retired':p.status==='departed'?'left the staff':'college career complete'}`;
 if(p.status==='active'&&(old.teamId!==p.teamId||old.team!==p.team||old.status==='portal'))return`${p.name} moved to ${p.team}`;
 if(p.status==='active'&&p.role!==old.role)return`${p.name} is now ${p.role}`;
 if(p.status==='active'&&old.injured&&!p.injured)return`${p.name} is available again`;
 if(p.status==='active'&&!old.injured&&p.injured)return`${p.name} is injured`;
 return null;
}
function reconcile(store,snap){
 const s=copy(store);if(!snap?.worldKey)return s;
 s.worlds[snap.worldKey]=followed(s,snap).map(entry=>{
  const p=snap.people.find(x=>x.key===entry.key),update=entry.update?.stamp===snap.stamp?entry.update:null;
  if(!p)return{...entry,update}; // Deferred history is not evidence of a departure.
  const rollback=Number.isFinite(entry.observed)&&clock(snap)<entry.observed;
  const title=entry.baseline&&!rollback?change(entry.baseline,p):null;
  return{...entry,name:p.name,baseline:facts(p),observed:clock(snap),update:rollback?null:title?{stamp:snap.stamp,title,detail:p.detail||'',key:p.key}:update};
 });return s;
}
function briefing(snap,store){
 const items=[],add=item=>{if(items.length<3&&!items.some(x=>item.key?x.key===item.key:x.title===item.title))items.push(item)};
 const g=snap.nextGame;if(g){const o=g.opponent;add({kind:'matchup',title:`${g.rival?'Rivalry week · ':''}${g.home?'vs':'at'} ${o.rank?`#${o.rank} `:''}${o.name}`,detail:`Week ${g.week} · ${o.w}–${o.l}${g.rival?' · Your primary rival':''}`})}
 for(const c of (snap.callbacks||[]).slice(0,1))add({...c,kind:'callback'});
 for(const f of followed(store,snap))if(f.update?.stamp===snap.stamp)add({...f.update,kind:'following'});
 const news=snap.news||[],mine=news.find(x=>x.mine),league=news.find(x=>!x.mine);
 if(mine)add({...mine,kind:'team'});if(league)add({...league,kind:'league'});
 return{items};
}
function followButton(p,on){return`<button type="button" class="lw-follow" data-lw-follow="${esc(p.key)}" aria-pressed="${on}" aria-label="${on?'Stop following':'Follow'} ${esc(p.name)}">${on?'Following':'Follow'}</button>`}
function html(snap,store){
 const b=briefing(snap,store),rows=followed(store,snap),keys=new Set(rows.map(x=>x.key));
 const personRow=(p,on)=>`<li><span><button type="button" class="lw-person" data-lw-open="${esc(p.key)}">${esc(p.name)}</button><small>${esc(p.detail||'History not currently loaded')}</small></span>${followButton(p,on)}</li>`;
 return`<div class="lw-heading"><span class="eyebrow">AROUND YOUR PROGRAM</span><small>Optional reading</small></div>`+
  (b.items.length?`<ul class="lw-brief">${b.items.map(x=>`<li><span class="lw-tag">${esc({matchup:'Next game',callback:'Familiar face',following:'Following',team:'Your team',league:'League'}[x.kind])}</span><div>${x.key?`<button type="button" class="lw-person" data-lw-open="${esc(x.key)}">${esc(x.title)}</button>`:`<strong>${esc(x.title)}</strong>`}${x.detail?`<p>${esc(x.detail)}</p>`:''}</div></li>`).join('')}</ul>`:'<p class="lw-quiet">No major updates. Your current plan can carry on.</p>')+
  `<details class="lw-cast"><summary>People you follow${rows.length?` · ${rows.length}`:''}</summary><p class="muted small">Follow players and coaches for updates when their situation changes. Saved on this device; no effect on your coaching decisions.</p>`+
  (rows.length?`<ul>${rows.map(f=>{const p=snap.people.find(p=>p.key===f.key)||f;return personRow({...p,detail:f.update?.stamp===snap.stamp?`${f.update.title}. ${p.detail||''}`:p.detail},true)}).join('')}</ul>`:'<p class="muted small">Nobody followed yet.</p>')+
  (rows.length<LIMIT?`<div class="eyebrow">From your football world</div><ul>${(snap.suggestions||[]).filter(k=>!keys.has(k)).slice(0,4).map(k=>snap.people.find(p=>p.key===k)).filter(Boolean).map(p=>personRow(p,false)).join('')}</ul>`:'<p class="muted small">Following 24 people. Unfollow someone to make room.</p>')+`</details>`;
}
let store=null,queued=false,lastHTML='',storageFailed=false;
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');return s?.version===1&&s.worlds&&typeof s.worlds==='object'?s:emptyStore()}catch(e){return emptyStore()}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(store));storageFailed=false}catch(e){storageFailed=true}}
function snapshot(extra=[]){const api=globalThis.DynastyLivingWorldSnapshot;if(!api)return null;const seed=api.read([]);if(!seed)return null;return api.read([...followed(store,seed).map(x=>x.key),...extra])}
function decorate(snap){
 const keys=new Set(followed(store,snap).map(x=>x.key));
 for(const card of document.querySelectorAll('#storylinesCard .sl-card')){
  const id=card.querySelector('[data-player]')?.dataset.player;if(!id)continue;
  const p={key:`player:${id}`,name:card.querySelector('.sl-who b')?.textContent||'player'};
  const existing=card.querySelector('[data-lw-follow]');if(existing){existing.setAttribute('aria-pressed',String(keys.has(p.key)));existing.textContent=keys.has(p.key)?'Following':'Follow';existing.setAttribute('aria-label',`${keys.has(p.key)?'Stop following':'Follow'} ${p.name}`)}else card.insertAdjacentHTML('beforeend',followButton(p,keys.has(p.key)));
 }
 for(const id of ['playerDialog','coachDialog']){
  const dialog=document.getElementById(id),key=dialog?.dataset.lwEntity;if(!dialog?.open||!key)continue;
  const name=document.getElementById(`${id}Name`)?.textContent||'person',p={key,name};
  let button=dialog.querySelector('.lw-profile-follow');const content=followButton(p,keys.has(key));
  if(!button){button=document.createElement('div');button.className='lw-profile-follow';document.getElementById(`${id}Body`)?.insertAdjacentElement('beforebegin',button)}
  let control=button.querySelector('[data-lw-follow]');
  if(!control){button.innerHTML=content;control=button.querySelector('button')}
  control.dataset.lwFollow=key;control.setAttribute('aria-pressed',String(keys.has(key)));control.setAttribute('aria-label',`${keys.has(key)?'Stop following':'Follow'} ${name}`);if(control.textContent!==(keys.has(key)?'Following':'Follow'))control.textContent=keys.has(key)?'Following':'Follow';
 }
}
function paint(){
 queued=false;store??=load();const snap=snapshot();if(!snap)return;
 const before=JSON.stringify(store);store=reconcile(store,snap);if(JSON.stringify(store)!==before)persist();
 const host=document.getElementById('weeklyWorldBriefing');if(!host)return;
 const content=html(snap,store)+(storageFailed?'<p class="muted small" role="status">Following works for this session, but could not be saved on this device.</p>':'');
 if(content!==lastHTML){
  const open=host.querySelector('details')?.open,focus=document.activeElement,focusKey=host.contains(focus)?focus?.dataset.lwFollow||focus?.dataset.lwOpen:null;
  const focusAttr=focus?.dataset.lwFollow?'data-lw-follow':'data-lw-open';
  host.innerHTML=content;lastHTML=content;if(open)host.querySelector('details').open=true;
  if(focusKey){const next=[...host.querySelectorAll(`[${focusAttr}]`)].find(b=>b.getAttribute(focusAttr)===focusKey);(next||host.querySelector('summary'))?.focus()}
 }
 // Keep detailed coverage available inside the existing optional briefing, below the short summary.
 const detail=document.getElementById('weeklyDeskDetails');
 if(detail)for(const id of ['rivalWatch']){const card=document.getElementById(id);if(card&&card.parentElement!==detail)detail.append(card)}
 decorate(snap);
}
function queue(){if(queued)return;queued=true;setTimeout(paint,90)}
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{
  document.addEventListener('click',e=>{
   const follow=e.target.closest('[data-lw-follow]'),open=e.target.closest('[data-lw-open]');
   if(follow){store??=load();const snap=snapshot([follow.dataset.lwFollow]);if(snap){store=toggleFollow(store,snap,follow.dataset.lwFollow);persist();paint()}}
   else if(open)globalThis.DynastyLivingWorldSnapshot?.open(open.dataset.lwOpen);
   if(e.target.closest('[data-player],[data-coach],[data-tab],[data-client-tab],[data-dash-view]'))queue();
  });
  for(const sel of ['#weekLine','#recordBig','#teamName','#saveStatus','#weeklyHub'])document.querySelectorAll(sel).forEach(el=>new MutationObserver(queue).observe(el,{childList:true,subtree:true,characterData:true}));
  for(const id of ['playerDialog','coachDialog']){const el=document.getElementById(id);if(el)new MutationObserver(queue).observe(el,{attributes:true,attributeFilter:['open','data-lw-entity']})}
  const dash=document.getElementById('dashboard');if(dash)new MutationObserver(rs=>{if(rs.some(r=>[...r.addedNodes].some(n=>['rivalWatch','highlightsCard','storylinesCard'].includes(n.id))))queue()}).observe(dash,{childList:true,subtree:true});
  queue();
 };if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{KEY,emptyStore,followed,toggleFollow,reconcile,briefing,html,mount};
});
