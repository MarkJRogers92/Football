// v0.32 — the locker room. Players already had morale and trust in the staff, but a team was only the sum of its
// ratings. Now every player has a personality, every team names captains, and the room has a chemistry that the
// season moves and the season feels.
//
//   Personality   Leader, Competitor, Steady, Quiet or Volatile. Read from a hash of the player's id, so it is fixed
//                 for life, costs nothing in the save and never draws gameplay randomness.
//   Leadership    class year, ability, trust in the staff, morale and personality, 0-100.
//   Captains      four a season (two each side of the ball), chosen by the staff before Week 1 unless the coach picks.
//                 A captain is less likely to leave at the end of the year. The staff
//                 never pick a kicker or punter; the coach can.
//   Chemistry     0-100, moved each week toward a target set by the captains' leadership, the morale of the players
//                 who matter, recent results, unhappy Volatile players and contented Leaders. It adds up to +1.0 or
//                 takes up to -1.5 from the team's offense and defense ratings, and nudges morale up or down.
//   Flashpoints   in the coach's program, an unhappy Volatile player can blow up. The coach disciplines him, backs
//                 him, or leaves it to the captains; left open while the next week is played, the captains handle it.
//                 A losing streak with a Leader among the captains can bring a players-only meeting instead.
function makeLockerRoomSystem(env){
 'use strict';
 const universe=()=>env.getUniverse(),clamp=env.clamp;
 const CAPTAINS=4,CORE=44,START=55,UNHAPPY=58,CHEM_MIN=5,CHEM_MAX=99,BLEND=.25,LOG_LIMIT=12;
 const PERSONALITIES={
  Leader:{label:'Leader',blurb:'Sets the standard. Lifts the room when he is happy.',lead:20},
  Competitor:{label:'Competitor',blurb:'Hates losing more than he loves winning.',lead:8},
  Steady:{label:'Steady',blurb:'Shows up, does the work, rarely a story.',lead:4},
  Quiet:{label:'Quiet',blurb:'Keeps to himself. Not a natural voice in the room.',lead:-4},
  Volatile:{label:'Volatile',blurb:'Brilliant when bought in. A problem when he is not.',lead:-10}
 };
 const SPECIALISTS=new Set(['K','P']);
 const ORDER=['Leader','Competitor','Steady','Quiet','Volatile'],CUTS=[10,30,75,90,100];
 function hash(...parts){let h=2166136261;for(const ch of parts.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;

 function personality(p){const roll=hash('personality',p?.id)%100;return ORDER[CUTS.findIndex(c=>roll<c)]}
 function leadership(p){
  if(!p)return 0;
  const years=clamp(num(env.eligibility(p),0),0,4)*8,ability=num(p.perceived,60)/4,trust=num(p.staffTrust,70)/5,mood=(num(p.morale,65)-60)/4;
  return clamp(Math.round(years+ability+trust+mood+PERSONALITIES[personality(p)].lead),0,100);
 }
 function state(t){
  if(!t)return null;
  const s=t.lockerRoom??={version:1};
  s.chemistry=clamp(Math.round(num(s.chemistry,START)),CHEM_MIN,CHEM_MAX);
  s.captains=Array.isArray(s.captains)?s.captains:[];
  s.captainsYear=num(s.captainsYear,null);
  s.incident=s.incident&&typeof s.incident==='object'?s.incident:null;
  s.log=Array.isArray(s.log)?s.log.slice(-LOG_LIMIT):[];
  return s;
 }
 const chemistryOf=t=>t?.lockerRoom?clamp(num(t.lockerRoom.chemistry,START),CHEM_MIN,CHEM_MAX):START;
 function chemistryLabel(c){return c>=75?'Tight-knit':c>=60?'Together':c>=45?'Steady':c>=30?'Fractured':'Toxic'}
 // Rating points added to offense and defense. Asymmetric on purpose: a broken room costs more than a great one gains.
 function ratingEdge(t){const c=chemistryOf(t);return Math.round(clamp((c-START)/20,-1.5,1)*10)/10}
 function note(t,text){const s=state(t),u=universe();s.log.push({year:u.year,week:u.week,text});if(s.log.length>LOG_LIMIT)s.log.splice(0,s.log.length-LOG_LIMIT)}
 // The players whose mood the room actually follows: the best 44 healthy or not.
 function core(t){return(t?.roster||[]).slice().sort((a,b)=>num(b.perceived,0)-num(a.perceived,0)||String(a.id).localeCompare(String(b.id))).slice(0,CORE)}

 function captainIds(t){const s=state(t),ids=new Set((t.roster||[]).map(p=>p.id));return s.captains.filter(id=>ids.has(id))}
 function captains(t){const ids=captainIds(t);return ids.map(id=>t.roster.find(p=>p.id===id)).filter(Boolean)}
 function isCaptain(t,p){return captainIds(t).includes(p?.id)}
 function candidates(t,n=12){return(t.roster||[]).map(p=>({p,lead:leadership(p),personality:personality(p)})).sort((a,b)=>b.lead-a.lead||String(a.p.id).localeCompare(String(b.p.id))).slice(0,n)}
 // The staff's picks: the two best leaders on each side of the ball.
 function staffCaptains(t){
  const all=candidates(t,t.roster?.length||0).filter(x=>!SPECIALISTS.has(x.p.pos)),off=all.filter(x=>env.offense(x.p)),def=all.filter(x=>!env.offense(x.p));
  return[...off.slice(0,2),...def.slice(0,2)].map(x=>x.p.id);
 }
 function setCaptains(t,ids){const s=state(t),year=universe().year;s.captains=ids.slice(0,CAPTAINS);s.captainsYear=year;for(const p of t.roster||[]){if(s.captains.includes(p.id))p.captainYear=year;else if(p.captainYear===year)delete p.captainYear}}
 function ensureCaptains(t){const s=state(t),year=universe().year;if(s.captainsYear!==year||!captainIds(t).length)setCaptains(t,staffCaptains(t));return captainIds(t)}
 // The coach can change captains until Week 1 kicks off.
 function captainsOpen(){const u=universe();return u.week===0&&(u.phase==='regular'||u.phase==='preseason')}
 function toggleCaptain(t,id){
  if(!captainsOpen())return{ok:false,reason:'Captains are set for the season once Week 1 kicks off.'};
  const p=(t.roster||[]).find(x=>String(x.id)===String(id));if(!p)return{ok:false,reason:'That player is not on the roster.'};
  ensureCaptains(t);const ids=captainIds(t);
  if(ids.includes(p.id)){setCaptains(t,ids.filter(x=>x!==p.id));return{ok:true,removed:true,p}}
  if(ids.length>=CAPTAINS)return{ok:false,reason:`There are already ${CAPTAINS} captains. Remove one first.`};
  setCaptains(t,[...ids,p.id]);return{ok:true,added:true,p};
 }

 function recentResults(t,n=3){
  const games=(t.schedule||[]).filter(g=>g.played&&g.winner).slice(-n);
  return games.map(g=>g.winner===t.name?1:-1);
 }
 function target(t){
  const room=core(t),caps=captains(t);
  const capLead=caps.length?caps.reduce((n,p)=>n+leadership(p),0)/caps.length:40;
  const mood=room.length?room.reduce((n,p)=>n+num(p.morale,65),0)/room.length:65;
  const results=recentResults(t).reduce((n,x)=>n+x*2,0);
  const unhappy=room.filter(p=>personality(p)==='Volatile'&&num(p.morale,65)<UNHAPPY).length;
  const content=Math.min(4,room.filter(p=>personality(p)==='Leader'&&num(p.morale,65)>=70&&!caps.includes(p)).length);
  return{value:clamp(Math.round(50+(capLead-65)*.3+(mood-70)*.5+results-unhappy*3+content),CHEM_MIN,CHEM_MAX),capLead:Math.round(capLead),mood:Math.round(mood),results,unhappy,content};
 }
 // One week in the room: chemistry moves a quarter of the way to its target, and the room moves morale back.
 function weekly(t){
  const s=state(t);ensureCaptains(t);
  const before=s.chemistry,tg=target(t);
  s.chemistry=clamp(Math.round(before*(1-BLEND)+tg.value*BLEND),CHEM_MIN,CHEM_MAX);
  if(s.chemistry>=70)for(const p of t.roster||[]){if(num(p.morale,65)<70)p.morale=clamp(num(p.morale,65)+1,15,99)}
  else if(s.chemistry<40)for(const p of t.roster||[]){if(num(p.morale,65)>40)p.morale=clamp(num(p.morale,65)-1,15,99)}
  return{before,after:s.chemistry,target:tg};
 }
 // A new season: the room keeps half of what it had, and the captains are chosen again.
 function newSeason(t){const s=state(t);s.chemistry=clamp(Math.round(s.chemistry*.5+START*.5),CHEM_MIN,CHEM_MAX);s.incident=null;s.meetingYear=null}

 // Flashpoints, for the coach's program only. The odds come from a hash of the program, season and week.
 function flashpointCandidate(t){return core(t).filter(p=>personality(p)==='Volatile'&&num(p.morale,65)<UNHAPPY+4).sort((a,b)=>num(a.morale,65)-num(b.morale,65)||String(a.id).localeCompare(String(b.id)))[0]||null}
 function maybeIncident(t){
  const s=state(t),u=universe();
  if(s.incident)return null;
  const results=recentResults(t,2);
  // Two straight losses and a Leader wearing the C: the players call their own meeting, once a season.
  const leaderCaptain=captains(t).find(p=>personality(p)==='Leader');
  if(results.length===2&&results.every(x=>x<0)&&leaderCaptain&&s.meetingYear!==u.year){
   s.meetingYear=u.year;s.chemistry=clamp(s.chemistry+6,CHEM_MIN,CHEM_MAX);
   const text=`${leaderCaptain.name} called a players-only meeting after two straight losses. Chemistry +6.`;
   note(t,text);env.event({type:'LOCKER_ROOM_MEETING',school:t,playerIds:[leaderCaptain.id],importance:48,summary:`${t.name}: ${text}`});
   return{kind:'meeting',p:leaderCaptain};
  }
  const p=flashpointCandidate(t);if(!p)return null;
  const odds=18+Math.max(0,50-s.chemistry)/2;
  if(hash('flashpoint',t.id,u.year,u.week)%100>=odds)return null;
  s.incident={year:u.year,week:u.week,playerId:p.id,name:p.name,pos:p.pos};
  note(t,`${p.pos} ${p.name} blew up at practice.`);
  env.event({type:'LOCKER_ROOM_FLASHPOINT',school:t,playerIds:[p.id],importance:52,summary:`${t.name}: ${p.pos} ${p.name} blew up at practice.`});
  return{kind:'flashpoint',p};
 }
 const RESPONSES={
  discipline:{label:'Discipline him',blurb:'Standards hold. He takes it hard.'},
  back:{label:'Back him',blurb:'He feels heard. Some teammates see favouritism.'},
  captains:{label:'Leave it to the captains',blurb:'Works if the captains carry weight in the room.'}
 };
 function respond(t,kind,source='COACH'){
  const s=state(t),inc=s.incident;
  if(!inc)return{ok:false,reason:'Nothing in the locker room needs an answer.'};
  if(!RESPONSES[kind])return{ok:false,reason:'Unknown response.'};
  const p=(t.roster||[]).find(x=>x.id===inc.playerId);
  s.incident=null;
  if(!p)return{ok:true,kind,text:`${inc.name} is no longer on the roster; the moment passed.`};
  let chem=0,text='';
  if(kind==='discipline'){p.morale=clamp(num(p.morale,65)-12,15,99);p.staffTrust=clamp(num(p.staffTrust,70)-6,0,100);chem=5;text=`You disciplined ${p.name}. The room noticed the standard: chemistry +5. His morale took a hit.`}
  else if(kind==='back'){p.morale=clamp(num(p.morale,65)+8,15,99);p.staffTrust=clamp(num(p.staffTrust,70)+4,0,100);chem=-5;text=`You backed ${p.name}. He is happier; some of the room is not: chemistry -5.`}
  else{const lead=target(t).capLead;if(lead>=60){chem=4;p.morale=clamp(num(p.morale,65)+2,15,99);text=`The captains sorted it out with ${p.name}. Chemistry +4.`}else{chem=-3;text=`The captains could not settle it with ${p.name}. Chemistry -3.`}}
  s.chemistry=clamp(s.chemistry+chem,CHEM_MIN,CHEM_MAX);
  note(t,`${source==='STAFF'?'Left open: ':''}${text}`);
  return{ok:true,kind,chem,text,p};
 }

 function summary(t){
  const s=state(t);ensureCaptains(t);
  const tg=target(t),room=core(t);
  return{chemistry:s.chemistry,label:chemistryLabel(s.chemistry),edge:ratingEdge(t),target:tg,captains:captains(t).map(p=>({p,lead:leadership(p),personality:personality(p)})),
   incident:s.incident,log:s.log.slice(),open:captainsOpen(),
   watch:room.filter(p=>personality(p)==='Volatile').map(p=>({p,morale:num(p.morale,65)})).sort((a,b)=>a.morale-b.morale).slice(0,4),
   voices:room.filter(p=>personality(p)==='Leader'&&!captainIds(t).includes(p.id)).map(p=>({p,lead:leadership(p)})).sort((a,b)=>b.lead-a.lead).slice(0,4)};
 }

 return{PERSONALITIES,ORDER,CAPTAINS,CORE,START,RESPONSES,personality,leadership,state,chemistryOf,chemistryLabel,ratingEdge,core,captainIds,captains,isCaptain,candidates,staffCaptains,setCaptains,ensureCaptains,captainsOpen,toggleCaptain,target,weekly,newSeason,flashpointCandidate,maybeIncident,respond,summary};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeLockerRoomSystem};
}else{
 const room=makeLockerRoomSystem({
  getUniverse:()=>universe,clamp,
  eligibility:p=>eligibilityBase(p),
  offense:p=>OFF_POS.has(p.pos),
  event:({type,school,playerIds,importance,summary})=>{universe.events??=[];universe.events.push({id:`EVT_${type}_${universe.year}_${universe.week}_${school.id}`,type,season:universe.year,week:universe.week,schoolIds:[school.id],playerIds,coachIds:[],gameIds:[],importance,summary})}
 });
 globalThis.DynastyLockerRoom=room;
 const lrEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 // Chemistry is part of how good a team is on Saturday, for every program and every path that rates a team.
 const profilesBeforeLockerRoom=profiles;
 profiles=function profilesWithLockerRoom(t){
  const out=profilesBeforeLockerRoom.apply(this,arguments),edge=t?.lockerRoom?room.ratingEdge(t):0;
  if(!edge)return out;
  const offense=clamp(out.offense+edge,35,99),defense=clamp(out.defense+edge,35,99);
  return{...out,offense,defense,overall:(offense+defense)/2,chemistryEdge:edge};
 };
 // A captain is invested in the place: his transfer risk is lower in the year he wears the C.
 const transferRiskBeforeLockerRoom=transferRisk;
 transferRisk=function transferRiskWithLockerRoom(p){
  const r=transferRiskBeforeLockerRoom.apply(this,arguments);
  return p?.captainYear===universe?.year?clamp(r-6,0,100):r;
 };
 // Each played week: play it, then the room reacts. Nothing is touched before the week runs, because a live game locked
 // in at kickoff must find the roster exactly as it was. A flashpoint still open once a later week has been played is
 // handled by the captains, then the room settles and a new one may start.
 const simWeekBeforeLockerRoom=simWeek;
 simWeek=function simWeekWithLockerRoom(){
  const week=universe?.week;
  const out=simWeekBeforeLockerRoom.apply(this,arguments);
  if(universe&&universe.week!==week&&week!=null){
   const mine=selected(),inc=mine?room.state(mine).incident:null;
   if(inc&&inc.year===universe.year&&inc.week<universe.week)room.respond(mine,'captains','STAFF');
   for(const t of universe.teams||[])room.weekly(t);
   if(mine&&universe.phase==='regular'&&!commissionerMode())room.maybeIncident(mine);
  }
  return out;
 };
 const offseasonPreseasonBeforeLockerRoom=offseasonPreseason;
 offseasonPreseason=function offseasonPreseasonWithLockerRoom(){
  const ok=offseasonPreseasonBeforeLockerRoom.apply(this,arguments);
  if(ok)for(const t of universe.teams||[])room.newSeason(t);
  return ok;
 };

 const tag=x=>`<span class="lr-tag lr-tag-${x.toLowerCase()}" title="${lrEsc(room.PERSONALITIES[x].blurb)}">${lrEsc(x)}</span>`;
 const BTN=(label,attrs,{disabled=false,pressed=null,title=''}={})=>`<button type="button" class="dw-button" ${attrs} ${disabled?'disabled':''}${pressed==null?'':` aria-pressed="${pressed}"`} title="${lrEsc(title)}">${label}</button>`;
 function cardHTML(t){
  const s=room.summary(t),pct=s.chemistry,tone=s.chemistry>=60?'lr-good':s.chemistry<40?'lr-bad':s.chemistry<50?'lr-warn':'';
  const edge=s.edge>0?`+${s.edge}`:`${s.edge}`;
  const why=[`captains' leadership ${s.target.capLead}`,`core morale ${s.target.mood}`,s.target.results?`recent results ${s.target.results>0?'+':''}${s.target.results}`:null,s.target.unhappy?`${s.target.unhappy} unhappy Volatile player${s.target.unhappy===1?'':'s'}`:null,s.target.content?`${s.target.content} contented Leader${s.target.content===1?'':'s'}`:null].filter(Boolean).join(' · ');
  const cap=x=>`<div class="lr-captain"><div><strong>${lrEsc(x.p.pos)} ${lrEsc(x.p.name)}</strong>${tag(x.personality)}<small>${lrEsc(eligibilityLabel(x.p))} · leadership ${x.lead} · morale ${Math.round(x.p.morale??65)}</small></div>${s.open?BTN('Remove',`data-lr-captain="${lrEsc(x.p.id)}"`,{title:'Remove this captain'}):''}</div>`;
  const pickRows=s.open?room.candidates(t,10).filter(x=>!room.isCaptain(t,x.p)).map(x=>`<li><span class="stop-who">${lrEsc(x.p.pos)} ${lrEsc(x.p.name)} ${tag(x.personality)}<small>${lrEsc(eligibilityLabel(x.p))} · leadership ${x.lead}</small></span>${BTN('Name captain',`data-lr-captain="${lrEsc(x.p.id)}"`,{disabled:s.captains.length>=room.CAPTAINS,title:s.captains.length>=room.CAPTAINS?'Remove a captain first':''})}</li>`).join(''):'';
  const watch=s.watch.length?`<div class="small"><strong>Watch list:</strong> ${s.watch.map(x=>`${lrEsc(x.p.pos)} ${lrEsc(x.p.name)} (morale ${Math.round(x.morale)})`).join(', ')}</div>`:'';
  const voices=s.voices.length?`<div class="small"><strong>Other voices:</strong> ${s.voices.map(x=>`${lrEsc(x.p.pos)} ${lrEsc(x.p.name)} (${x.lead})`).join(', ')}</div>`:'';
  const log=s.log.length?`<details class="fb-log"><summary>Locker room notes</summary><ul>${s.log.slice().reverse().map(x=>`<li><span class="muted">${x.year} · week ${x.week}</span> ${lrEsc(x.text)}</li>`).join('')}</ul></details>`:'';
  return`<div class="section-head has-art">${globalThis.DynastyArt?.img('locker-room','dl-art dl-art-head')||''}<div><div class="eyebrow">LOCKER ROOM</div><h3>${lrEsc(s.label)}</h3><div class="muted">Captains, personalities and the chemistry that carries into Saturday.</div></div></div>
  <div class="fb-summary"><div><span class="small muted">Chemistry</span><strong>${s.chemistry}<small> ${lrEsc(s.label)}</small></strong></div><div><span class="small muted">Saturday effect</span><strong>${edge}<small> offense &amp; defense</small></strong></div><div><span class="small muted">Heading toward</span><strong>${s.target.value}</strong></div></div>
  <div class="lr-meter" role="meter" aria-label="Chemistry" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
  <div class="lr-status ${tone}"><span>${lrEsc(why)}</span></div>
  <h4>Captains ${s.open?'<span class="small muted">· set until Week 1 kicks off</span>':''}</h4>
  <div class="lr-captains">${s.captains.map(cap).join('')||'<p class="muted">No captains named.</p>'}</div>
  ${s.open?`<details class="lr-pick"${s.captains.length<room.CAPTAINS?' open':''}><summary>Choose captains (${s.captains.length} of ${room.CAPTAINS})</summary><ul class="stop-rows">${pickRows}</ul></details>`:''}
  ${watch}${voices}<p class="small muted">A captain is less likely to transfer in the year he wears the C. Chemistry above 70 lifts morale each week; below 40 it wears morale down.</p>${log}`;
 }
 function renderLockerRoomCard(){
  if(!universe?.teams)return;const t=selected();if(!t)return;
  let host=$('#lockerRoom');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.querySelector){
   const anchor=document.querySelector('#roster .table-wrap');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='lockerRoom';host.className='card locker-room-card';anchor.insertAdjacentElement('beforebegin',host)}
  }
  if(!host)return;
  host.innerHTML=cardHTML(t);
  host.querySelectorAll('[data-lr-captain]').forEach(b=>b.onclick=()=>{
   const r=room.toggleCaptain(t,b.dataset.lrCaptain);
   setStatus(r.ok?(r.added?`${r.p.name} is a captain.`:`${r.p.name} is no longer a captain.`):r.reason);
   if(r.ok)autosaveAfter('management');renderLockerRoomCard();
   $('#lockerRoom')?.querySelector?.('[data-lr-captain]:not([disabled])')?.focus();
  });
 }
 extendRender('roster',renderLockerRoomCard);

 // An open flashpoint on This Week.
 function renderFlashpoint(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#lockerRoomFlashpoint');const t=universe?.teams?selected():null,inc=t?room.state(t).incident:null;
  if(!inc||universe.phase!=='regular'){if(card?.isConnected)card.remove();return}
  const p=t.roster.find(x=>x.id===inc.playerId);
  if(!card||!card.isConnected){card=document.createElement('section');card.id='lockerRoomFlashpoint';card.className='offseason-stop locker-room-stop';card.setAttribute('role','region');card.setAttribute('aria-label','Locker room');host.insertAdjacentElement('beforebegin',card)}
  const lead=room.target(t).capLead;
  const opt=(k)=>`<li><span class="stop-who">${lrEsc(room.RESPONSES[k].label)}<small>${lrEsc(room.RESPONSES[k].blurb)}${k==='captains'?` Captains' leadership: ${lead}.`:''}</small></span>${BTN('Choose',`data-lr-respond="${k}"`)}</li>`;
  card.innerHTML=`${globalThis.DynastyArt?.img('locker-room','dl-art dl-art-stop')||''}<div class="eyebrow">LOCKER ROOM</div><h3>${lrEsc(inc.pos)} ${lrEsc(inc.name)} blew up at practice</h3><p>${p?`He is ${lrEsc(room.personality(p)).toLowerCase()}, his morale is ${Math.round(p.morale??65)} and the room is watching how you handle it.`:'He is no longer on the roster.'} If you play the next week without answering, the captains handle it.</p><div class="stop-decide" role="group" aria-label="Respond"><ul class="stop-rows">${Object.keys(room.RESPONSES).map(opt).join('')}</ul></div>`;
  card.querySelectorAll('[data-lr-respond]').forEach(b=>b.onclick=()=>{const r=room.respond(t,b.dataset.lrRespond);setStatus(r.ok?r.text:r.reason);autosaveAfter('management');render()});
 }
 extendRender('dashboard',renderFlashpoint);
 if(typeof window!=='undefined'&&window.__DL_TEST__){
  window.__DL_TEST__.lockerRoom=()=>{const t=selected();return t?JSON.parse(JSON.stringify({...room.state(t),edge:room.ratingEdge(t)})):null};
  window.__DL_TEST__.lockerRoomFlashpointFixture=()=>{const t=selected(),p=room.core(t).find(x=>room.personality(x)==='Volatile')||t.roster[0];room.state(t).incident={year:universe.year,week:universe.week,playerId:p.id,name:p.name,pos:p.pos};render();return p.id};
 }
}
