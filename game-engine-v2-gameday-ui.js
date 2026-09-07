// v0.10.1 interactive Game Day preview. Uses the real upcoming matchup but never commits dynasty state.
let v2InteractiveGameDay=null;
function v2GameDayUIKey(g){return v2GameLabKey(g)}
function v2GameDayUILiveContext(){
  const g=findUserGame();if(!g)return null;const home=T(g.home),away=T(g.away);if(!home||!away)return null;
  return{g,home,away,key:v2GameDayUIKey(g)}
}
function v2GameDayUIDigest(ctx=v2GameDayUILiveContext()){return ctx?v2LabIntegrity(ctx.g,ctx.home,ctx.away):null}
function v2GameDayUIAssertUnchanged(before,ctx){const after=v2GameDayUIDigest(ctx);if(before!==after)throw new Error('Interactive Game Day preview mutated live dynasty state.')}
function v2GameDayUIPrepare(){
  const ctx=v2GameDayUILiveContext(),api=globalThis.DynastyGameEngineV2GameDay;if(!ctx||!api)throw new Error('No upcoming game is available for Interactive Game Day.');
  const before=v2GameDayUIDigest(ctx),hc=v2LabClone(ctx.home),ac=v2LabClone(ctx.away);
  applyGameplanWear(hc,ac.name);applyGameplanWear(ac,hc.name);
  const homeProfile=gameProfiles(hc,ac.name),awayProfile=gameProfiles(ac,hc.name);
  const session=api.createSession({gameId:`v0101-gameday-${ctx.key}`,seed:`v0101-gameday-${ctx.key}`,home:ctx.home,away:ctx.away,homeProfile,awayProfile,homeFieldRating:homeFieldFor(ctx.home)});
  api.advanceOne(session);v2GameDayUIAssertUnchanged(before,ctx);
  v2InteractiveGameDay={key:ctx.key,session,integrity:before};renderV2InteractiveGameDay();return session
}
function v2GameDayUIRun(action){
  const ctx=v2GameDayUILiveContext(),api=globalThis.DynastyGameEngineV2GameDay;if(!ctx||!api||!v2InteractiveGameDay)throw new Error('Interactive Game Day session is unavailable.');
  const before=v2GameDayUIDigest(ctx);action(api,v2InteractiveGameDay.session);v2GameDayUIAssertUnchanged(before,ctx);renderV2InteractiveGameDay()
}
function v2GameDayUIEventText(event,names){
  if(event?.type==='coaching_decision'){
    const chosen=event.selectedOption==='delegate'?`delegated (${event.resolvedAction.replaceAll('_',' ')})`:event.selectedOption.replaceAll('_',' ');
    return`COACH DECISION · ${chosen}`
  }
  return globalThis.DynastyGameEngineV2Lab?.eventText(event,names)||String(event?.type||'event').replaceAll('_',' ')
}
function v2GameDayUIScoreboard(session){
  const s=session.state,lab=globalThis.DynastyGameEngineV2Lab,context=s.status==='final'?'Final':`${lab?.clockLabel(s)||''}${lab?.downLabel(s)?` · ${lab.downLabel(s)}`:''}`;
  return`<div class="v2-gameday-scoreboard"><div class="v2-gameday-team away">${teamLogoHTML(s.away?.id,42,'team-logo--inline')}<span>${gameEscape(session.names.away)}</span><b>${s.score.away}</b></div><div class="v2-gameday-center"><strong>${gameEscape(context)}</strong><small>${s.possession?`${gameEscape(session.names[s.possession])} ball · ${s.timeouts.away} TO / ${s.timeouts.home} TO`:''}</small></div><div class="v2-gameday-team home"><b>${s.score.home}</b><span>${gameEscape(session.names.home)}</span>${teamLogoHTML(s.home?.id,42,'team-logo--inline')}</div></div>`
}
function v2GameDayUIDecision(session){
  const d=globalThis.DynastyGameEngineV2GameDay?.pendingDecision(session);if(!d)return'';
  return`<div class="v2-gameday-decision"><div class="eyebrow">HEAD COACH DECISION</div><h3>${gameEscape(d.situation)}</h3><div class="muted">Staff recommendation: <strong>${gameEscape(d.staffRecommendation.replaceAll('_',' '))}</strong></div><div class="button-row">${d.options.map(o=>`<button type="button" data-v2-gameday-choice="${gameEscape(o.id)}" ${o.id===d.staffRecommendation?'class="recommended"':''}>${gameEscape(o.label)}</button>`).join('')}</div></div>`
}
function v2GameDayUIFeed(session){
  const rows=(session.state.events||[]).slice(-18).reverse();if(!rows.length)return'<div class="muted">Kickoff is next.</div>';
  return rows.map(e=>`<div class="v2-gameday-feed-row"><span>${gameEscape(globalThis.DynastyGameEngineV2Lab?.clockLabel(e.state)||'')}</span><strong>${gameEscape(v2GameDayUIEventText(e,session.names))}</strong><b>${e.state?.score?.away??0}–${e.state?.score?.home??0}</b></div>`).join('')
}
function ensureV2InteractiveGameDayHost(){
  let host=document.querySelector('#v2InteractiveGameDay');if(host)return host;const next=document.querySelector('#nextGameCard');if(!next)return null;
  host=document.createElement('div');host.id='v2InteractiveGameDay';host.className='card v2-gameday-host';next.insertAdjacentElement('afterend',host);return host
}
function renderV2InteractiveGameDay(){
  const host=ensureV2InteractiveGameDayHost();if(!host)return;const ctx=v2GameDayUILiveContext(),api=globalThis.DynastyGameEngineV2GameDay;
  if(v2InteractiveGameDay&&v2InteractiveGameDay.key!==ctx?.key)v2InteractiveGameDay=null;
  if(!ctx||!api){host.innerHTML='<div class="muted">Interactive Game Day becomes available when your program has an unsimulated game.</div>';return}
  if(!v2InteractiveGameDay){
    host.innerHTML=`<div class="section-head"><div><div class="eyebrow">V0.10.1 GAME DAY PREVIEW</div><h3>Coach the next game</h3><div class="muted">Play-by-play Game Engine 2 with fourth-down decisions. Preview only — standings, player stats, schedule and save data stay untouched.</div></div><button type="button" data-v2-gameday-start>Start Interactive Preview</button></div>`;
    host.querySelector('[data-v2-gameday-start]').onclick=()=>{try{v2GameDayUIPrepare()}catch(err){console.error(err);setStatus(`Interactive Game Day stopped: ${err.message||err}`)}};return
  }
  const session=v2InteractiveGameDay.session,d=api.pendingDecision(session),final=session.state.status==='final';
  host.innerHTML=`<div class="v2-gameday-head"><div><div class="eyebrow">INTERACTIVE GAME DAY · PREVIEW ONLY</div><h3>${gameEscape(session.names.away)} at ${gameEscape(session.names.home)}</h3></div><button type="button" data-v2-gameday-reset>Reset Preview</button></div>${v2GameDayUIScoreboard(session)}${v2GameDayUIDecision(session)}<div class="v2-gameday-controls button-row">${!final&&!d?'<button type="button" data-v2-gameday-next>Next Play</button><button type="button" data-v2-gameday-decision>Advance to Next Decision</button>':''}${!final?'<button type="button" data-v2-gameday-delegate>Delegate Rest</button>':''}${final?'<strong>FINAL · Preview complete. Nothing was recorded.</strong>':''}</div><div class="v2-gameday-feed"><div class="v2-gameday-feed-head"><strong>Game feed</strong><span class="muted">Newest first</span></div>${v2GameDayUIFeed(session)}</div><div class="v2-shadow-safety"><strong>Preview only.</strong> This interactive session uses cloned matchup inputs and cannot change the live dynasty.</div>`;
  host.querySelector('[data-v2-gameday-reset]')?.addEventListener('click',()=>{v2InteractiveGameDay=null;renderV2InteractiveGameDay()});
  host.querySelector('[data-v2-gameday-next]')?.addEventListener('click',()=>{try{v2GameDayUIRun((x,s)=>x.advanceOne(s))}catch(err){console.error(err);setStatus(`Interactive Game Day stopped: ${err.message||err}`)}});
  host.querySelector('[data-v2-gameday-decision]')?.addEventListener('click',()=>{try{v2GameDayUIRun((x,s)=>x.advance(s))}catch(err){console.error(err);setStatus(`Interactive Game Day stopped: ${err.message||err}`)}});
  host.querySelector('[data-v2-gameday-delegate]')?.addEventListener('click',()=>{try{v2GameDayUIRun((x,s)=>x.simulate(s,()=> 'delegate'))}catch(err){console.error(err);setStatus(`Interactive Game Day stopped: ${err.message||err}`)}});
  host.querySelectorAll('[data-v2-gameday-choice]').forEach(button=>button.addEventListener('click',()=>{try{v2GameDayUIRun((x,s)=>x.resolve(s,button.dataset.v2GamedayChoice))}catch(err){console.error(err);setStatus(`Interactive Game Day stopped: ${err.message||err}`)}}))
}
const renderGameLabBeforeInteractiveV2=TAB_RENDERERS.gamelab;
TAB_RENDERERS.gamelab=()=>{renderGameLabBeforeInteractiveV2();renderV2InteractiveGameDay()};
globalThis.DynastyGameEngineV2LabBridge.interactive={start:v2GameDayUIPrepare,render:renderV2InteractiveGameDay,getSession:()=>v2InteractiveGameDay?.session||null,reset:()=>{v2InteractiveGameDay=null;renderV2InteractiveGameDay()}};
if(globalThis.__DL_TEST__){globalThis.__DL_TEST__.v2GameDayPreviewDigest=()=>v2GameDayUIDigest();globalThis.__DL_TEST__.v2GameDayPreviewState=()=>v2InteractiveGameDay?v2LabClone(v2InteractiveGameDay.session):null}
