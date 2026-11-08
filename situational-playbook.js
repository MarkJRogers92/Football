// Situational playbook (v0.15.1). How your staff call fourth downs, conversions and the late clock in the
// games you do not coach live, and what they recommend when you do. The rules live in Game Engine 2
// (playbookFourthDown, playbookTwoPoint, playbookClock) so a simulated game and a live one decide the same
// way. Only the controlled program has a playbook; "Standard / Kick / Standard" is the engine's default, so
// a program that never opens the card plays exactly as before.
function makePlaybookSystem(env){
 'use strict';
 const OPTIONS={
  fourthDown:[
   {id:'standard',label:'Standard',note:'Go on short yardage near midfield, kick field goals in range, punt otherwise.'},
   {id:'conservative',label:'Conservative',note:'Go only on 4th and 1 inside the 40; otherwise kick or punt.'},
   {id:'aggressive',label:'Aggressive',note:'Go on 4th and 2 or less from your own 35, 4th and 4 or less between midfield and the 30, and 4th and 3 or less inside the 10.'}],
  twoPoint:[
   {id:'kick',label:'Always kick',note:'Kick the extra point after every touchdown.'},
   {id:'chart',label:'Use the chart',note:'In the second half, go for two when the margin after the touchdown is −10, −5, −2, +1, +5 or +12.'}],
  clock:[
   {id:'standard',label:'Standard',note:'Play at the normal pace all game.'},
   {id:'manage',label:'Manage the clock',note:'In the fourth quarter, leading: runs and completions take 6 more seconds. Trailing in the last five minutes: get out of bounds and save 8.'}]
 };
 const DEFAULTS={fourthDown:'standard',twoPoint:'kick',clock:'standard'};
 function get(t){
  const p=t?.playbook;if(!p||typeof p!=='object')return{...DEFAULTS};
  const out={};for(const k of Object.keys(DEFAULTS))out[k]=OPTIONS[k].some(o=>o.id===p[k])?p[k]:DEFAULTS[k];
  return out;
 }
 function isDefault(p){return Object.keys(DEFAULTS).every(k=>p[k]===DEFAULTS[k])}
 function set(t,key,value){
  if(!t||!OPTIONS[key])return{ok:false,reason:'Unknown playbook setting.'};
  if(!OPTIONS[key].some(o=>o.id===value))return{ok:false,reason:`Unknown option "${value}".`};
  const next={...get(t),[key]:value};
  if(isDefault(next))delete t.playbook;else t.playbook=next;
  return{ok:true,playbook:next};
 }
 // {home, away} for a game, with the controlled side's playbook only; null when neither side has one.
 function forMatch(home,away,controlledName){
  const out={};
  for(const [side,t] of [['home',home],['away',away]])if(t&&t.name===controlledName){const p=get(t);if(!isDefault(p))out[side]=p}
  return Object.keys(out).length?out:null;
 }
 // What the staff did with the playbook in one game, from the engine's own events.
 function tally(state,side){
  const out={fourthTries:0,fourthConverted:0,twoTries:0,twoMade:0};
  for(const e of state?.events||[]){
   if(e.team!==side||e.ot)continue;
   if(e.from?.down===4&&['scrimmage','interception','fumble'].includes(e.type)){
    out.fourthTries++;
    if(e.type==='scrimmage'&&e.yards>=e.from.distance)out.fourthConverted++;
   }
   if(e.type==='two_point'){out.twoTries++;if(e.made)out.twoMade++}
  }
  return out;
 }
 return{OPTIONS,DEFAULTS,get,set,isDefault,forMatch,tally};
}

if(typeof module==='object'&&module.exports){
 module.exports={makePlaybookSystem};
}else{
 const playbook=makePlaybookSystem({});
 globalThis.DynastyPlaybook={...playbook,noteGame};
 const pbEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const controlled=()=>$('#userTeam')?.value||null;

 // Recorded and live games pick up the controlled program's playbook without changing their callers.
 const lab=globalThis.DynastyGameEngineV2Lab;
 if(lab&&typeof lab.simulate==='function'){
  const simulateBeforePlaybook=lab.simulate;
  lab.simulate=function(options={}){
   const pb=options.playbook===undefined?playbook.forMatch(options.home,options.away,controlled()):options.playbook;
   return simulateBeforePlaybook(pb?{...options,playbook:pb}:options);
  };
 }
 const gameDay=globalThis.DynastyGameEngineV2GameDay;
 if(gameDay&&typeof gameDay.createSession==='function'){
  const createSessionBeforePlaybook=gameDay.createSession;
  gameDay.createSession=function(options={}){
   const pb=options.playbook===undefined?playbook.forMatch(options.home,options.away,controlled()):options.playbook;
   return createSessionBeforePlaybook(pb?{...options,playbook:pb}:options);
  };
 }
 function noteGame(state){
  const side=state.playbook?.home?'home':state.playbook?.away?'away':null;
  if(!side)return;
  const id=state.gameId,t=T(state[side].name),log=(t.playbookLog&&t.playbookLog.year===universe.year)?t.playbookLog:(t.playbookLog={year:universe.year,games:[],totals:{fourthTries:0,fourthConverted:0,twoTries:0,twoMade:0}});
  if(log.games.includes(id))return;
  log.games.push(id);if(log.games.length>30)log.games.splice(0,log.games.length-30);
  const x=playbook.tally(state,side);for(const k of Object.keys(log.totals))log.totals[k]+=x[k]||0;
 }

 function cardHTML(t){
  const p=playbook.get(t),log=t.playbookLog&&t.playbookLog.year===universe.year?t.playbookLog:null;
  const row=(key,title)=>`<label class="pb-row"><span><strong>${title}</strong><small>${pbEsc(playbook.OPTIONS[key].find(o=>o.id===p[key]).note)}</small></span><select data-pb="${key}">${playbook.OPTIONS[key].map(o=>`<option value="${o.id}" ${o.id===p[key]?'selected':''}>${pbEsc(o.label)}</option>`).join('')}</select></label>`;
  const tot=log?.totals;
  return`<div class="card situational-playbook" id="situationalPlaybook"><h3>Situational Playbook</h3>
   <p class="small muted">How your staff call it in games you sim or watch, and what they recommend when you coach live. Late in the fourth quarter and behind, every setting except Standard keeps the ball on fourth down unless a field goal ties or takes the lead.</p>
   ${row('fourthDown','Fourth down')}${row('twoPoint','Two-point tries')}${row('clock','Late clock')}
   ${tot?`<p class="small">Regulation totals this season: ${tot.fourthTries} fourth-down tr${tot.fourthTries===1?'y':'ies'} (${tot.fourthConverted} converted) · ${tot.twoTries} two-point tr${tot.twoTries===1?'y':'ies'} (${tot.twoMade} good) in ${log.games.length} game${log.games.length===1?'':'s'} with custom settings.</p>`:''}
  </div>`;
 }
 function bind(root,t){
  root.querySelectorAll?.('[data-pb]').forEach(s=>s.onchange=()=>{
   const r=playbook.set(t,s.dataset.pb,s.value);
   if(r.ok)autosaveAfter('management');
   setStatus(r.ok?`Playbook: ${playbook.OPTIONS[s.dataset.pb].find(o=>o.id===s.value).label} ${{fourthDown:'on fourth down',twoPoint:'after touchdowns',clock:'late clock'}[s.dataset.pb]}.`:r.reason);
   renderActiveTab();
  });
 }
 extendRender('gamelab',()=>{
  const t=selected(),anchor=$('#nextGameCard');if(!t||!anchor)return;
  $('#situationalPlaybook')?.remove();
  anchor.insertAdjacentHTML?.('afterend',cardHTML(t));
  const card=$('#situationalPlaybook');if(card)bind(card,t);
 });
}
