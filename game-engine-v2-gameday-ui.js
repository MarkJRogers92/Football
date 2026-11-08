// v0.10.1 interactive Game Day surface. Live play is isolated until the player makes the final result official.
let v2InteractiveGameDay=null;
function v2GameDayUIKey(g){return v2GameLabKey(g)}
function v2GameDayUILiveContext(){
  const g=findUserGame();if(!g)return null;const home=T(g.home),away=T(g.away);if(!home||!away)return null;
  return{g,home,away,key:v2GameDayUIKey(g)}
}
function v2GameDayUIDigest(ctx=v2GameDayUILiveContext()){return ctx?v2LabIntegrity(ctx.g,ctx.home,ctx.away):null}
function v2GameDayUIAssertUnchanged(before,ctx){const after=v2GameDayUIDigest(ctx);if(before!==after)throw new Error('Game Day preview mutated live dynasty state.')}
function v2GameDayUIPrepare(playbook){
  const ctx=v2GameDayUILiveContext(),api=globalThis.DynastyGameEngineV2GameDay;if(!ctx||!api)throw new Error('No upcoming game is available for Game Day.');
  const before=v2GameDayUIDigest(ctx),hc=v2LabClone(ctx.home),ac=v2LabClone(ctx.away);
  applyGameplanWear(hc,ac.name);applyGameplanWear(ac,hc.name);
  const homeProfile=gameProfiles(hc,ac.name),awayProfile=gameProfiles(ac,hc.name);
  const session=api.createSession({gameId:`v0101-gameday-${ctx.key}`,seed:`v0101-gameday-${ctx.key}`,home:ctx.home,away:ctx.away,homeProfile,awayProfile,homeFieldRating:homeFieldFor(ctx.home),playbook});
  api.advanceOne(session);v2GameDayUIAssertUnchanged(before,ctx);
  v2InteractiveGameDay={key:ctx.key,session,integrity:before,actions:[]};v2GameDayUIPersist();renderV2InteractiveGameDay();return session
}
// A fixture seed, its kickoff playbook and the coaching actions reproduce a paused game.
let v2GameDayHoldFinal=false;
function v2GameDayUIPersist(){
  if(!universe)return;
  if(!v2InteractiveGameDay){if(universe.liveGameDay){delete universe.liveGameDay;autosaveAfter('game')}return}
  const {key,session,actions}=v2InteractiveGameDay;
  universe.liveGameDay={version:1,key,playbook:session.state.playbook??null,actions:actions.slice()};
  autosaveAfter('game')
}
function v2GameDayUIApply(api,session,action){if(action==='next')return api.advanceOne(session);if(action==='decision')return api.advance(session);if(action==='delegate')return api.simulate(session,()=> 'delegate');if(typeof action==='string'&&action.startsWith('choice:'))return api.resolve(session,action.slice(7));throw new Error(`Unknown Game Day action ${action}`)}
function v2GameDayUIRestore(){
  if(v2InteractiveGameDay||!universe?.liveGameDay)return false;const saved=universe.liveGameDay,ctx=v2GameDayUILiveContext();
  if(!ctx||saved.key!==ctx.key||!Array.isArray(saved.actions)){delete universe.liveGameDay;return false}
  try{const session=v2GameDayUIPrepare(saved.playbook),api=globalThis.DynastyGameEngineV2GameDay;for(const a of saved.actions){v2GameDayUIApply(api,session,a);v2InteractiveGameDay.actions.push(a)}v2InteractiveGameDay.integrity=v2GameDayUIDigest(ctx);universe.liveGameDay.actions=v2InteractiveGameDay.actions.slice();return true}
  catch(err){console.error(err);v2InteractiveGameDay=null;delete universe.liveGameDay;setStatus('The saved live game could not be rebuilt, so it was set aside.');return false}
}
// Finish a live game with the staff and record it. Used before anything else would play this week.
function v2GameDayUIFinishPending(){
  v2GameDayUIRestore();if(!v2InteractiveGameDay)return null;const api=globalThis.DynastyGameEngineV2GameDay,ctx=v2GameDayUILiveContext();
  if(!ctx||v2InteractiveGameDay.key!==ctx.key){v2InteractiveGameDay=null;v2GameDayUIPersist();return null}
  const session=v2InteractiveGameDay.session;if(session.state.status!=='final'){v2GameDayUIApply(api,session,'delegate');v2InteractiveGameDay.actions.push('delegate')}
  return v2GameDayUIRecord()
}
function v2GameDayUIRun(action){
  const ctx=v2GameDayUILiveContext(),api=globalThis.DynastyGameEngineV2GameDay;if(!ctx||!api||!v2InteractiveGameDay)throw new Error('Game Day session is unavailable.');
  const before=v2GameDayUIDigest(ctx),session=v2InteractiveGameDay.session;v2GameDayUIApply(api,session,action);v2InteractiveGameDay.actions.push(action);v2GameDayUIAssertUnchanged(before,ctx);
  if(session.state.status==='final'&&!api.pendingDecision(session)&&!v2GameDayHoldFinal){try{v2GameDayUIRecord();return}catch(err){console.error(err);setStatus(`Final not recorded yet: ${err.message||err} Choose Record Final to try again.`)}}
  v2GameDayUIPersist();renderV2InteractiveGameDay()
}
function v2GameDayUIRecord(options={}){
  if(!v2InteractiveGameDay)throw new Error('No Game Day session is available to record.');
  const out=recordInteractiveV2GameDay(v2InteractiveGameDay.session,{...options,expectedIntegrity:v2InteractiveGameDay.integrity});
  v2InteractiveGameDay=null;delete universe.liveGameDay;setStatus(`Game Day recorded: ${out.result.away} ${out.result.ap} – ${out.result.hp} ${out.result.home}.`);render();return out
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
// Which side the coach is on, and the live win-chance estimate from that side (presentation only).
function v2GameDayUIUserSide(session){return selected()?.name===session.names.home?'home':'away'}
function v2GameDayUIWinChance(session){const m=globalThis.DynastyGameDayMomentum;return m?Math.round(m.winChance(session.state,v2GameDayUIUserSide(session),{homeEdge:Number(session.homeFieldRating)||0})*100):null}
function v2GameDayUIMomentum(session){return globalThis.DynastyGameDayMomentum?.panelHTML(session,v2GameDayUIUserSide(session),{homeEdge:Number(session.homeFieldRating)||0})||''}
function v2GameDayUIDecision(session){
  const d=globalThis.DynastyGameEngineV2GameDay?.pendingDecision(session);if(!d)return'';
  return`<div class="v2-gameday-decision"><div class="eyebrow">HEAD COACH DECISION</div><h3>${gameEscape(d.situation)}</h3><div class="muted">Staff recommendation: <strong>${gameEscape(d.staffRecommendation.replaceAll('_',' '))}</strong>${v2GameDayUIWinChance(session)!=null?` · Win chance now <strong>${v2GameDayUIWinChance(session)}%</strong>`:''}</div><div class="button-row">${d.options.map(o=>`<button type="button" data-v2-gameday-choice="${gameEscape(o.id)}" ${o.id===d.staffRecommendation?'class="recommended"':''}>${gameEscape(o.label)}</button>`).join('')}</div></div>`
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
  if(v2InteractiveGameDay&&v2InteractiveGameDay.key!==ctx?.key){v2InteractiveGameDay=null;v2GameDayUIPersist()}
  if(!v2InteractiveGameDay&&ctx)v2GameDayUIRestore();
  if(!ctx||!api){host.innerHTML=`<div class="muted">${typeof openingPreseason==='function'&&openingPreseason()?'Choose Begin Season in This Week to open your first matchup.':'Your next scheduled game will appear here.'}</div>`;return}
  if(!v2InteractiveGameDay){
    host.innerHTML=`<div class="section-head"><div><div class="eyebrow">LIVE GAME DAY</div><h3>Coach the next game live</h3><div class="muted">Make the big calls yourself. The result counts as soon as the game ends.</div></div><button type="button" data-v2-gameday-start class="bi-primary">Coach It Live</button></div>`;
    host.querySelector('[data-v2-gameday-start]').onclick=()=>{try{v2GameDayUIPrepare()}catch(err){console.error(err);setStatus(`Game Day stopped: ${err.message||err}`)}};return
  }
  const session=v2InteractiveGameDay.session,d=api.pendingDecision(session),final=session.state.status==='final';
  host.innerHTML=`<div class="v2-gameday-head"><div><div class="eyebrow">LIVE GAME DAY${final?' · FINAL':''}</div><h3>${gameEscape(session.names.away)} at ${gameEscape(session.names.home)}</h3></div></div>${v2GameDayUIScoreboard(session)}${v2GameDayUIMomentum(session)}${v2GameDayUIDecision(session)}<div class="v2-gameday-controls button-row">${!final&&!d?'<button type="button" data-v2-gameday-next>Next Play</button><button type="button" data-v2-gameday-decision>Advance to Next Decision</button>':''}${!final?'<button type="button" data-v2-gameday-delegate>Delegate Rest</button>':''}${final?'<button type="button" data-v2-gameday-record class="recommended">Record Final</button>':''}</div><div class="v2-gameday-feed"><div class="v2-gameday-feed-head"><strong>Game feed</strong><span class="muted">Newest first</span></div>${v2GameDayUIFeed(session)}</div><div class="v2-shadow-safety"><strong>${final?'Final whistle.':'Live game.'}</strong> ${final?'Record the final to keep this result.':'Saved as you play. Advancing the week lets your staff finish this game.'}</div>`;
  host.querySelector('[data-v2-gameday-next]')?.addEventListener('click',()=>{try{v2GameDayUIRun('next')}catch(err){console.error(err);setStatus(`Game Day stopped: ${err.message||err}`)}});
  host.querySelector('[data-v2-gameday-decision]')?.addEventListener('click',()=>{try{v2GameDayUIRun('decision')}catch(err){console.error(err);setStatus(`Game Day stopped: ${err.message||err}`)}});
  host.querySelector('[data-v2-gameday-delegate]')?.addEventListener('click',()=>{try{v2GameDayUIRun('delegate')}catch(err){console.error(err);setStatus(`Game Day stopped: ${err.message||err}`)}});
  host.querySelector('[data-v2-gameday-record]')?.addEventListener('click',()=>{try{v2GameDayUIRecord()}catch(err){console.error(err);setStatus(`Game Day rolled back: ${err.message||err}`)}});
  host.querySelectorAll('[data-v2-gameday-choice]').forEach(button=>button.addEventListener('click',()=>{try{v2GameDayUIRun(`choice:${button.dataset.v2GamedayChoice}`)}catch(err){console.error(err);setStatus(`Game Day stopped: ${err.message||err}`)}}))
}
extendRender('gamelab',()=>renderV2InteractiveGameDay());
function v2GameDayUIGuard(name,original){return function(...args){if(v2InteractiveGameDay||universe?.liveGameDay){try{const out=v2GameDayUIFinishPending();if(out){setStatus(`Your live game is locked in: ${out.result.away} ${out.result.ap} – ${out.result.hp} ${out.result.home}.`);if(name!=='simWeek')return out}}catch(err){console.error(err);setStatus(`Your live game must be recorded first: ${err.message||err}`);return}}return original.apply(this,args)}}
simWeek=v2GameDayUIGuard('simWeek',simWeek);
// Sim Season loops on simWeek; finish the live game once up front so a refusal stops the loop.
if(typeof simSeason==='function'){const simSeasonBeforeLive=simSeason;simSeason=function(...args){if(v2InteractiveGameDay||universe?.liveGameDay){if(guidanceActionEligibility('simulate-season').allowed)delegateWeeklyDecisions(selected());try{v2GameDayUIFinishPending()}catch(err){console.error(err);setStatus(`Your live game must be recorded first: ${err.message||err}`);return}}return simSeasonBeforeLive.apply(this,args)}}
if(typeof simulateUserDetailed==='function')simulateUserDetailed=v2GameDayUIGuard('simulateUserDetailed',simulateUserDetailed);
if(typeof watchUserDetailed==='function')watchUserDetailed=v2GameDayUIGuard('watchUserDetailed',watchUserDetailed);
// "Coach it live" from anywhere: open Game Day, start the live session if none is running, and bring it into view.
function v2GameDayUICoachLive(){
  const tab=document.querySelector('.tabs button[data-tab="gamelab"]');if(tab&&!tab.classList.contains('active'))tab.click();
  try{if(!v2InteractiveGameDay&&v2GameDayUILiveContext())v2GameDayUIPrepare();else renderV2InteractiveGameDay()}catch(err){console.error(err);setStatus(`Game Day stopped: ${err.message||err}`)}
  document.querySelector('#v2InteractiveGameDay')?.scrollIntoView({behavior:'smooth',block:'start'})
}
document.addEventListener('click',e=>{if(e.target.closest('[data-coach-live]'))v2GameDayUICoachLive()});
globalThis.DynastyGameEngineV2LabBridge.interactive={coachLive:v2GameDayUICoachLive,start:v2GameDayUIPrepare,render:renderV2InteractiveGameDay,getSession:()=>v2InteractiveGameDay?.session||null,record:v2GameDayUIRecord,reset:()=>{v2InteractiveGameDay=null;renderV2InteractiveGameDay()}};
if(globalThis.__DL_TEST__){
  globalThis.__DL_TEST__.v2GameDayPreviewDigest=()=>v2GameDayUIDigest();
  globalThis.__DL_TEST__.v2GameDayPreviewState=()=>v2InteractiveGameDay?v2LabClone(v2InteractiveGameDay.session):null;
  globalThis.__DL_TEST__.v2GameDayCommitCurrent=(fault=null)=>v2GameDayUIRecord(fault?{testFault:fault}:{});
  // Rollback tests stage a final and record it by hand; real play records at the final whistle.
  globalThis.__DL_TEST__.v2GameDayHoldFinal=(on=true)=>{v2GameDayHoldFinal=!!on};
  globalThis.__DL_TEST__.v2GameDaySaved=()=>universe?.liveGameDay?JSON.parse(JSON.stringify(universe.liveGameDay)):null;
  globalThis.__DL_TEST__.v2GameDayForget=()=>{v2InteractiveGameDay=null};
}
