(function(root,factory){
  const adapter=(typeof module==='object'&&module.exports)?require('./game-engine-v2-adapter.js'):root.DynastyGameEngineV2Adapter;
  const api=factory(adapter);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameEngineV2Lab=api;
})(typeof window==='object'?window:globalThis,function(Adapter){
'use strict';
if(!Adapter)throw new Error('Game Engine 2 Lab requires the v2 adapter.');
const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
function eventText(event={},names={}){
  const state=event.state||{},team=teamName(event.team,names),receiver=teamName(event.receiver,names);
  if(event.type==='game_start')return'Game begins.';
  if(event.type==='kickoff')return`${receiver} receives the kickoff.`;
  if(event.type==='scrimmage')return`${team} ${signedYards(event.yards)} yard${Math.abs(Number(event.yards)||0)===1?'':'s'}.`;
  if(event.type==='interception')return`${team} throws an interception.`;
  if(event.type==='fumble')return`${team} loses a fumble.`;
  if(event.type==='possession_change')return`${teamName(event.to,names)} takes possession.`;
  if(event.type==='touchdown')return`TOUCHDOWN ${team}.`;
  if(event.type==='extra_point')return`${team} extra point ${event.made===false?'missed':'good'}.`;
  if(event.type==='two_point')return`${team} two-point try ${event.made?'good':'failed'}.`;
  if(event.type==='field_goal')return`${team} ${event.distance||''}-yard field goal ${event.made?'good':'missed'}.`.replace('  -',' ');
  if(event.type==='punt')return`${team} punts${event.touchback?' for a touchback':''}.`;
  if(event.type==='safety')return`SAFETY for ${team}.`;
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
return{clockLabel,fieldLabel,downLabel,eventText,eventRowHTML,simulate,summaryHTML,eventsHTML};
});