(function(root,factory){
  const adapter=(typeof module==='object'&&module.exports)?require('./game-engine-v2-adapter.js'):root.DynastyGameEngineV2Adapter;
  const api=factory(adapter);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2Lab=api;
})(typeof window==='object'?window:globalThis,function(Adapter){
'use strict';
if(!Adapter)throw new Error('Game Engine 2 Lab requires the v2 adapter.');
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const ordinal=n=>n===1?'1st':n===2?'2nd':n===3?'3rd':n===4?'4th':String(n??'—');
function clockLabel(state={}){
  if((state.period||0)>4){const ot=state.ot?.period||Math.max(1,(state.period||5)-4);return `OT${ot}`}
  const seconds=Math.max(0,Number(state.clock)||0),m=Math.floor(seconds/60),s=seconds%60;
  return `Q${state.period||1} ${m}:${String(s).padStart(2,'0')}`;
}
function fieldLabel(state={}){
  if(!state.possession||!Number.isFinite(Number(state.fieldPosition)))return'';
  const p=Math.round(Number(state.fieldPosition));
  if(p===50)return'50';
  return p<50?`own ${p}`:`opp ${100-p}`;
}
function downLabel(state={}){
  if(!state.down||!state.distance)return'';
  return `${ordinal(state.down)} & ${state.distance}${fieldLabel(state)?` at ${fieldLabel(state)}`:''}`;
}
function teamName(side,names={}){return names[side]||side||'Team'}
function signedYards(y){const n=Number(y)||0;return n===0?'no gain':n>0?`gains ${n}`:`loses ${Math.abs(n)}`}
function returnText(event){
  const n=Number(event.ret)||0;
  if(event.td)return', returned for a touchdown';
  if(event.fairCatch)return', fair catch';
  return n>0?`, returned ${n} yard${n===1?'':'s'}`:'';
}
const DECISION_ACTION_LABELS={timeout:'a timeout',run:'to let the clock run',ground:'to run the ball',quick:'quick passes',shots:'to take shots',balanced:'a balanced drive',base:'to play it straight',pressure:'to bring pressure',coverage:'to drop into coverage',run_stop:'to load the box'};
function decisionActionLabel(value){return DECISION_ACTION_LABELS[value]||String(value||'decision').replaceAll('_',' ')}
// Broadcast-style short name: "Gavin Kemp" -> "G. Kemp".
function shortName(name){const parts=String(name||'').trim().split(/\s+/);return parts.length>1?`${parts[0][0]}. ${parts.slice(1).join(' ')}`:parts[0]||''}
// The player recorded in a play role (qb, ca carrier, tg target, tk tackler, sb sacker, ib interceptor, ff forced
// fumble, pb breakup, pr pressure, rt returner, kk kicker, pt punter, pn penalized) when attribution is available.
function actorName(event,names,key){const id=names?.actors?.[event?.seq]?.[key];const n=id!=null?names?.players?.[id]:null;return n?shortName(n):null}
// Names plus the per-play actors from a Game Engine 2 attribution, so eventText can say who made each play.
function withActors(names={},attribution){
  if(!attribution?.playActors)return names;const players={};
  for(const c of Object.values(attribution.contexts||{})){if(!c)continue;
    for(const p of [c.qb,c.kicker,c.punter,c.kickReturner,c.puntReturner])if(p?.id!=null)players[p.id]=p.name;
    for(const list of [c.rushers,c.receivers,c.defenders,c.offensiveLine])for(const x of list||[]){const p=x?.player||x;if(p?.id!=null)players[p.id]=p.name}}
  return{...names,actors:attribution.playActors,players}
}
const yardsPhrase=y=>y>0?`for ${y} yard${y===1?'':'s'}`:y<0?`for a loss of ${Math.abs(y)}`:'for no gain';
function eventText(event={},names={}){
  const state=event.state||{},team=teamName(event.team,names),receiver=teamName(event.receiver,names),who=key=>actorName(event,names,key);
  if(event.type==='game_start')return'Game begins.';
  if(event.type==='kickoff'){
    const rt=who('rt');
    if(event.td)return`${rt?`${rt} (${receiver})`:receiver} return${rt?'s':''} the kickoff for a touchdown!`;
    if(event.touchback===false&&Number(event.ret)>0)return`${rt?`${rt} returns`:`${receiver} return`} the kickoff ${event.ret} yards.`;
    return`${receiver} receives the kickoff.`;
  }
  if(event.type==='penalty'){
    const against=teamName(event.against,names),yards=Number(event.yards)||0,pn=who('pn');
    return`Flag: ${event.label||'penalty'} on ${pn?`${pn} (${against})`:against}, ${yards} yard${yards===1?'':'s'}${event.autoFirst?', automatic first down':''}.`;
  }
  if(event.type==='scrimmage'){
    const y=Number(event.yards)||0,qb=who('qb'),ca=who('ca'),tg=who('tg'),tk=who('tk'),sb=who('sb'),pb=who('pb'),pr=who('pr'),dropped=names?.actors?.[event.seq]?.dr;
    const tackle=tk?`, tackled by ${tk}`:'',hurry=pr?` (hurried by ${pr})`:'';
    if(event.scramble)return`${ca||qb||`${team} quarterback`} scrambles ${y>0?`for ${y} yard${y===1?'':'s'}`:y<0?`and loses ${Math.abs(y)}`:'for no gain'}${tackle}.`;
    if(event.sack)return`${qb||`${team} quarterback`} sacked${sb?` by ${sb}`:''}${y<0?` for a loss of ${Math.abs(y)}`:''}.`;
    if(event.kind==='pass'){
      if(event.completed)return`${qb||team} pass complete${tg?` to ${tg}`:''} ${yardsPhrase(y)}${hurry}${tackle}.`;
      if(event.completed===false)return`${qb||team} pass incomplete${tg?`, intended for ${tg}`:''}${dropped?' (dropped)':pb?`, broken up by ${pb}`:''}${hurry}.`;
    }
    if(event.kind==='rush')return`${ca||team} runs ${yardsPhrase(y)}${tackle}.`;
    return y?`${team} ${signedYards(y)} yard${Math.abs(y)===1?'':'s'}.`:`${team} no gain.`;
  }
  if(event.type==='interception'){const qb=who('qb'),ib=who('ib'),tg=who('tg');return qb||ib?`${qb||team} pass${tg?` for ${tg}`:''} intercepted${ib?` by ${ib}`:''}.`:`${team} throws an interception.`}
  if(event.type==='fumble'){const ca=who('ca'),ff=who('ff');return ca?`${ca} fumbles${ff?`, forced by ${ff}`:''}; ${teamName(event.team==='home'?'away':'home',names)} recover.`:`${team} loses a fumble.`}
  if(event.type==='possession_change')return`${teamName(event.to,names)} takes possession.`;
  if(event.type==='touchdown')return event.kind==='return'?`RETURN TOUCHDOWN ${team}.`:`TOUCHDOWN ${team}.`;
  if(event.type==='extra_point')return`${team} extra point ${event.made===false?'missed':'good'}.`;
  if(event.type==='two_point')return`${team} two-point try ${event.made?'good':'failed'}.`;
  if(event.type==='field_goal'){const kk=who('kk');return`${kk?`${kk} (${team})`:team} ${event.distance||''}-yard field goal ${event.made?'good':'missed'}.`.replace('  -',' ')}
  if(event.type==='punt'){const pt=who('pt'),rt=who('rt');return`${pt?`${pt} (${team})`:team} punts${event.touchback?' for a touchback':''}${event.touchback?'':returnText(event)}${rt&&!event.touchback&&(Number(event.ret)>0||event.td)?` by ${rt}`:''}.`}
  if(event.type==='safety')return`SAFETY for ${team}.`;
  if(event.type==='timeout')return`Timeout, ${team} (${event.left??0} left).`;
  if(event.type==='coaching_decision'){
    const choice=event.selectedOption==='delegate'?`delegates — staff chooses ${decisionActionLabel(event.resolvedAction)}`:`chooses ${decisionActionLabel(event.selectedOption)}`;
    return`${team} coach ${choice}.`;
  }
  if(event.type==='period_end')return`End of ${event.period===1?'1st quarter':event.period===2?'1st half':event.period===3?'3rd quarter':'regulation'}.`;
  if(event.type==='period_start')return`Start of quarter ${event.period}.`;
  if(event.type==='halftime')return'Halftime.';
  if(event.type==='overtime_start')return`Overtime ${event.overtime||1} begins.`;
  if(event.type==='overtime_possession')return`${teamName(event.possession,names)} begins an overtime possession.`;
  if(event.type==='game_end')return'Final.';
  return String(event.type||'event').replaceAll('_',' ');
}
function eventRowHTML(event,names={}){
  const s=event.state||{},context=event.from?`${ordinal(event.from.down)} & ${event.from.distance} at ${event.from.fieldPosition===50?'50':event.from.fieldPosition<50?`own ${event.from.fieldPosition}`:`opp ${100-event.from.fieldPosition}`}`:downLabel(s);
  return `<div class="v2-event-line"><span class="v2-event-clock">${escapeHTML(clockLabel(s))}</span><span class="v2-event-copy"><strong>${escapeHTML(eventText(event,names))}</strong>${context?`<small>${escapeHTML(context)}</small>`:''}</span><span class="v2-event-score">${s.score?.away??0}–${s.score?.home??0}</span></div>`;
}
function simulate(options={}){
  const result=Adapter.simulateShadow(options),names={home:String(options.home?.name??'Home'),away:String(options.away?.name??'Away')};
  return{...result,names,seed:String(options.seed??''),gameId:String(options.gameId??result.state.gameId)};
}
function summaryHTML(preview){
  if(!preview)return'<div class="muted">Run the v2 shadow preview to inspect the clock-aware game.</div>';
  const {state,summary,names}=preview;
  return `<div class="v2-shadow-score"><div><span>${escapeHTML(names.away)}</span><strong>${state.score.away}</strong></div><div class="v2-shadow-final">FINAL${state.period>4?' · OT':''}</div><div><span>${escapeHTML(names.home)}</span><strong>${state.score.home}</strong></div></div><div class="v2-shadow-metrics"><div><span>Plays</span><strong>${summary.totalPlays}</strong></div><div><span>Total yards</span><strong>${summary.away.yards+summary.home.yards}</strong></div><div><span>Turnovers</span><strong>${summary.away.turnovers+summary.home.turnovers}</strong></div><div><span>Possessions</span><strong>${summary.away.possessions+summary.home.possessions}</strong></div></div>`;
}
function eventsHTML(preview,limit=160){
  if(!preview)return'';
  const rows=(preview.state.events||[]).slice(-Math.max(1,limit)).reverse();
  return rows.map(e=>eventRowHTML(e,preview.names)).join('');
}
return{clockLabel,fieldLabel,downLabel,eventText,withActors,shortName,eventRowHTML,simulate,summaryHTML,eventsHTML};
});