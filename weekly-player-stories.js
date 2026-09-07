// v0.10.2 Slice 4 — factual Player Story Cards on the weekly dashboard.
const v0102StoryApi=globalThis.DynastyPlayerStories;
function v0102StoryPlayerInput(t,p){
  const promise=(p.promises||[]).find(q=>q.status==='ACTIVE');return{id:p.id,name:p.name,pos:p.pos,year:p.year,grade:p.perceived??p.trueNow??60,upside:p.perceivedUpside??p.upside??60,role:p.role||'Development',morale:p.morale??70,transferRisk:transferRisk(p),health:p.health??100,injuryWeeks:p.injuryWeeks||0,redshirtActive:!!p.redshirtActive,promiseLabel:promise?.type?String(promise.type).replaceAll('_',' '):(p.promise&&p.promise!=='None'?p.promise:null),stats:{...(p.stats||{})}}
}
function v0102PlayerStories(t=selected()){
  if(!t||!v0102StoryApi)return[];const players=(t.roster||[]).map(p=>v0102StoryPlayerInput(t,p)),challenge=v0102StarterChallenge(t);return v0102StoryApi.buildPlayerStories(players,{challenge,limit:5})
}
function ensureV0102PlayerStoriesHost(){let host=document.querySelector('#v0102PlayerStories');if(host)return host;const command=document.querySelector('#dashboard .command-center');if(!command)return null;host=document.createElement('div');host.id='v0102PlayerStories';host.className='card v0102-player-stories';command.insertAdjacentElement('afterend',host);return host}
function renderV0102PlayerStories(){
  const host=ensureV0102PlayerStoriesHost();if(!host)return;const t=selected(),stories=v0102PlayerStories(t);if(!t||!stories.length){host.hidden=true;return}host.hidden=false;
  host.innerHTML=`<div class="section-head"><div><div class="eyebrow">PLAYERS TO WATCH</div><h3>This week’s player stories</h3><div class="muted">Selected from real roster status, promises, role pressure and accumulated production.</div></div><span class="pill">${stories.length} active</span></div><div class="v0102-story-grid">${stories.map(s=>`<article class="v0102-story-card ${s.tone?`v0102-story-${gameEscape(s.tone)}`:''}" data-v0102-story="${gameEscape(s.type)}"><div class="v0102-story-kicker">${gameEscape(String(s.type).replaceAll('_',' '))}</div><button class="player-button v0102-story-name" data-player="${gameEscape(s.playerId)}">${gameEscape(s.name)}</button><div class="small muted">${gameEscape(s.pos)}</div><div class="compact">${gameEscape(s.summary)}</div></article>`).join('')}</div>`;attachPlayerLinks()
}
const renderDashboardBeforePlayerStoriesV0102=TAB_RENDERERS.dashboard;TAB_RENDERERS.dashboard=()=>{renderDashboardBeforePlayerStoriesV0102();renderV0102PlayerStories()};
if(globalThis.__DL_TEST__){
  globalThis.__DL_TEST__.weeklyPlayerStoriesDebug=()=>v0102PlayerStories().map(x=>({...x}));
  globalThis.__DL_TEST__.weeklyPlayerStoriesForceFixture=()=>{const t=selected();if(!t||!t.roster?.length)return null;const p=t.roster[0];p.injuryWeeks=2;p.health=63;p.morale=42;renderV0102PlayerStories();return{id:p.id,name:p.name}}
}
