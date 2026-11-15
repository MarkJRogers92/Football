// v0.32 — conference realignment. The 120 programs used to stay in the same ten conferences forever, so season 25 of
// a dynasty looked like season 5. Every few offseasons the conferences now renegotiate their media deals, and
// membership follows the money: the strongest program in a weaker conference trades places with the weakest program
// in the conference above it.
//
//   Distance         a conference pays for travel: every 250 miles between a candidate and the conference's centre
//                    costs one brand point of appeal, so realignment bends towards neighbours without forbidding a
//                    cross-country move for a big enough brand.
//   Brand            prestige, fan support and facilities. Prestige already moves with winning, so a program that
//                    keeps winning in a small conference rises until a bigger one wants it.
//   Media value      the average brand of a conference's twelve members. It ranks the conferences and sets the
//                    payout every member banks in its booster fund each offseason.
//   Window           every CYCLE seasons, in the offseason review. At most MAX_MOVES swaps, each a one-for-one
//                    trade between neighbouring conferences in the media ranking, so every conference keeps twelve
//                    members and the schedule's rules (8 conference games, a protected rival) hold unchanged.
//   Your program     invited up: you decide before the preseason (silence keeps you where you are). Dropped: it is
//                    announced, with the warning visible on the Program page all along.
//
// Nothing here draws gameplay randomness: ties are broken by a hash of the program and the season, so loading a save
// never changes who moves. Season records already store each team's conference, so history stays as it was played.
function makeRealignmentSystem(env){
 'use strict';
 const universe=()=>env.getUniverse(),clamp=env.clamp;
 const CYCLE=4,MAX_MOVES=2,GAP=8,PAYOUT_MAX=4,FAN_SHIFT=3,HISTORY_LIMIT=40,MILES_PER_POINT=250,CANDIDATES=3;

 function hash(...parts){let h=2166136261;for(const ch of parts.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;

 function state(){
  const u=universe();if(!u)return null;
  const s=u.realignment??={version:1};
  s.startYear=Math.round(num(s.startYear,u.year));
  s.history=Array.isArray(s.history)?s.history.slice(-HISTORY_LIMIT):[];
  s.pending=s.pending&&typeof s.pending==='object'?s.pending:null;
  s.lastWindow=s.lastWindow&&typeof s.lastWindow==='object'?s.lastWindow:null;
  return s;
 }
 // The offseason that closes the season `year` is a window when `year` completes a cycle since the dynasty began.
 function isWindow(year){const s=state();return(year-s.startYear+1)%CYCLE===0&&year>=s.startYear+CYCLE-1}
 function nextWindow(year=universe().year){for(let y=year;y<year+CYCLE+1;y++)if(isWindow(y))return y;return year+CYCLE}

 function brand(t){return Math.round((num(t?.prestige,60)*.6+num(t?.fan_support,60)*.25+num(t?.facilities,60)*.15)*10)/10}
 function conferences(){return[...new Set((universe()?.teams||[]).map(t=>t.conference).filter(Boolean))]}
 function members(c){return(universe()?.teams||[]).filter(t=>t.conference===c)}
 function mediaValue(c){const m=members(c);return m.length?Math.round(m.reduce((n,t)=>n+brand(t),0)/m.length*10)/10:0}
 // Media ranking, strongest first. Ties fall to the name so the order is stable.
 function ranking(){return conferences().map(c=>({conference:c,value:mediaValue(c)})).sort((a,b)=>b.value-a.value||a.conference.localeCompare(b.conference)).map((x,i)=>({...x,rank:i+1,payout:payoutFor(i+1)}))}
 // The money is a ranking, not an absolute: the top two deals pay 4 units a season, the bottom two nothing.
 function payoutFor(rank){return clamp(Math.round(PAYOUT_MAX-(rank-1)*.5),0,PAYOUT_MAX)}
 function centre(c){const m=members(c);return m.length?{lat:m.reduce((n,t)=>n+num(t.lat,0),0)/m.length,lon:m.reduce((n,t)=>n+num(t.lon,0),0)/m.length}:{lat:0,lon:0}}
 function travel(t,c){const k=centre(c);return env.distance?env.distance(num(t.lat,0),num(t.lon,0),k.lat,k.lon):0}
 // How much a conference wants a program: its brand, less the cost of getting there.
 function appeal(t,c){return Math.round((brand(t)-travel(t,c)/MILES_PER_POINT)*10)/10}
 function conferencePayout(t){const r=ranking().find(x=>x.conference===t?.conference);return r?r.payout:0}
 function rankedMembers(c){return members(c).map(t=>({t,brand:brand(t)})).sort((a,b)=>b.brand-a.brand||a.t.id-b.t.id)}

 // The swaps the conferences would agree to today. Each pair is two neighbours in the media ranking: the weaker
 // conference's best brand against the stronger conference's weakest. Biggest gaps go first; a conference takes part
 // in one swap per window, and nobody moves twice.
 function proposals({exclude=new Set()}={}){
  const r=ranking(),year=universe().year,out=[];
  for(let i=0;i<r.length-1;i++){
   const strong=r[i].conference,weak=r[i+1].conference;
   const faller=rankedMembers(strong).slice().reverse().find(x=>!exclude.has(x.t.id));
   // The stronger conference looks at the weaker one's best few brands and takes the one it wants most.
   const riser=rankedMembers(weak).filter(x=>!exclude.has(x.t.id)).slice(0,CANDIDATES).map(x=>({...x,appeal:appeal(x.t,strong)})).sort((a,b)=>b.appeal-a.appeal||a.t.id-b.t.id)[0];
   if(!riser||!faller)continue;
   const gap=Math.round((riser.appeal-faller.brand)*10)/10;
   if(gap>=GAP)out.push({up:riser.t,down:faller.t,from:weak,to:strong,gap,tie:hash(riser.t.id,faller.t.id,year)});
  }
  out.sort((a,b)=>b.gap-a.gap||a.tie-b.tie);
  const used=new Set(),picked=[];
  for(const p of out){
   if(picked.length>=MAX_MOVES)break;
   if(used.has(p.from)||used.has(p.to))continue;
   used.add(p.from);used.add(p.to);picked.push(p);
  }
  return picked;
 }
 // Where a program stands if the window opened today.
 function outlook(t){
  if(!t)return null;
  const r=ranking(),me=r.find(x=>x.conference===t.conference),list=rankedMembers(t.conference),place=list.findIndex(x=>x.t===t)+1;
  const p=proposals(),up=p.find(x=>x.up===t),down=p.find(x=>x.down===t);
  const above=me&&me.rank>1?r[me.rank-2]:null,below=me&&me.rank<r.length?r[me.rank]:null;
  let status='settled',text='Your place in the conference is secure. Nobody is looking to move you in or out.';
  if(up){status='rising';text=`If the window opened today, the ${up.to} would invite you to replace ${up.down.name}.`}
  else if(down){status='at-risk';text=`If the window opened today, the ${down.to} would replace you with ${down.up.name} and you would drop to the ${down.from}.`}
  else if(place<=CANDIDATES&&above){const weakest=rankedMembers(above.conference).at(-1);const short=Math.max(0,Math.ceil((weakest.brand+GAP-appeal(t,above.conference))*10)/10);status='watching';text=`You are among the best brands in the ${t.conference}. The ${above.conference} would need ${short} more brand points from you, after travel, to make an offer.`}
  else if(place===list.length&&below){status='watching';text=`You are the weakest brand in the ${t.conference}. Keep within ${GAP} brand points of the ${below.conference}'s best and nobody will replace you.`}
  return{status,text,brand:brand(t),place,size:list.length,conference:t.conference,rank:me?.rank||null,of:r.length,payout:me?.payout||0,value:me?.value||0,nextWindow:nextWindow(),above:above?.conference||null,below:below?.conference||null};
 }

 // A program changes conferences. Both sides of the swap move together, so every conference keeps its size. Rivalries
 // that no longer share a conference end (their series is kept in the history), and the four programs without a rival
 // are paired again by distance inside their new conferences.
 function swap(a,b,reason){
  const u=universe(),from=a.conference,to=b.conference,year=u.year;
  const broken=[];
  for(const t of [a,b]){
   const rival=t.rivalry?u.teams.find(x=>x.id===t.rivalry.rivalId):null;
   if(rival){broken.push({schoolId:t.id,school:t.name,rivalId:rival.id,rival:rival.name,trophy:t.rivalry.trophy,w:t.rivalry.series?.w||0,l:t.rivalry.series?.l||0});
    rival.protectedRivalIds=[];rival.rivalry=null}
   t.protectedRivalIds=[];t.rivalry=null;
  }
  a.conference=to;b.conference=from;
  a.fan_support=clamp(Math.round(num(a.fan_support,60)+FAN_SHIFT),5,100);a.fanBaseline=clamp(Math.round(num(a.fanBaseline,a.fan_support)+FAN_SHIFT-1),5,100);
  b.fan_support=clamp(Math.round(num(b.fan_support,60)-FAN_SHIFT),5,100);b.fanBaseline=clamp(Math.round(num(b.fanBaseline,b.fan_support)-FAN_SHIFT+1),5,100);
  env.rederiveRivalries();
  const fresh=[a,b].map(t=>{const r=t.rivalry?u.teams.find(x=>x.id===t.rivalry.rivalId):null;return r?{schoolId:t.id,rivalId:r.id,rival:r.name,trophy:t.rivalry.trophy}:null}).filter(Boolean);
  const move={year,up:{id:a.id,name:a.name,from,to},down:{id:b.id,name:b.name,from:to,to:from},reason,brokenRivalries:broken,newRivalries:fresh};
  state().history.push(move);
  const s=state();if(s.history.length>HISTORY_LIMIT)s.history.splice(0,s.history.length-HISTORY_LIMIT);
  const userIds=new Set([env.userTeam()?.id].filter(x=>x!=null));
  env.event({type:'CONFERENCE_REALIGNMENT',schoolIds:[a.id,b.id],importance:[a.id,b.id].some(id=>userIds.has(id))?82:58,
   summary:`${a.name} joins the ${to}; ${b.name} moves to the ${from}.`,metadata:{up:a.id,down:b.id,from,to}});
  return move;
 }

 // The offseason review of a window season. Moves that do not involve the coach's program happen at once; an
 // invitation to the coach's program waits for an answer.
 function runWindow(){
  const u=universe(),s=state(),year=u.year;
  if(!isWindow(year)||s.lastWindow?.year===year)return null;
  const me=env.userTeam(),plan=proposals(),moves=[];let pending=null;
  for(const p of plan){
   if(me&&p.up===me&&!env.commissioner()){pending={year,schoolId:me.id,to:p.to,from:p.from,replaces:p.down.id,replacesName:p.down.name,gap:p.gap};continue}
   moves.push(swap(p.up,p.down,me&&p.down===me?'Dropped for a stronger brand':'Media deal'));
  }
  s.pending=pending;
  s.lastWindow={year,moves:moves.length,invited:!!pending,ack:false,ranking:ranking().map(x=>({conference:x.conference,value:x.value,payout:x.payout}))};
  return{moves,pending};
 }
 // The coach's answer. Accepting swaps at once. Declining keeps the program where it is, and the conference offers the
 // place to the next-best brand in the same conference if one still clears the gap.
 function answer(accept){
  const u=universe(),s=state(),inv=s.pending;
  if(!inv)return{ok:false,reason:'There is no invitation waiting.'};
  const me=u.teams.find(t=>t.id===inv.schoolId),down=u.teams.find(t=>t.id===inv.replaces);
  s.pending=null;
  if(!me||!down||me.conference!==inv.from||down.conference!==inv.to)return{ok:false,reason:'The invitation no longer applies.'};
  if(accept){const move=swap(me,down,'Accepted an invitation');return{ok:true,accepted:true,move}}
  inv.declinedYear=u.year;s.declined=[...(s.declined||[]).slice(-9),{year:u.year,schoolId:me.id,to:inv.to}];
  const next=rankedMembers(inv.from).filter(x=>x.t!==me).slice(0,CANDIDATES).map(x=>({...x,appeal:appeal(x.t,inv.to)})).sort((a,b)=>b.appeal-a.appeal)[0];const nextOk=next&&next.appeal-brand(down)>=GAP;
  const move=nextOk?swap(next.t,down,'Invited after another program declined'):null;
  env.event({type:'REALIGNMENT_DECLINED',schoolIds:[me.id],importance:64,summary:`${me.name} turns down the ${inv.to}${move?`; ${move.up.name} accepts instead`:''}.`,metadata:{to:inv.to}});
  return{ok:true,accepted:false,move};
 }
 // The preseason rollover settles an unanswered invitation: the program stays.
 function settle(){const s=state();if(s?.pending&&s.pending.year<=universe().year)return answer(false);return null}

 // Every member banks its conference's media payout each offseason.
 function payAll(fundOf){
  const out={},r=ranking(),by=new Map(r.map(x=>[x.conference,x.payout]));
  for(const t of universe().teams||[]){const n=by.get(t.conference)||0;if(n&&fundOf(t,n))out[t.id]=n}
  return out;
 }

 return{CYCLE,MAX_MOVES,GAP,PAYOUT_MAX,MILES_PER_POINT,CANDIDATES,centre,travel,appeal,state,isWindow,nextWindow,brand,conferences,members,mediaValue,ranking,payoutFor,conferencePayout,rankedMembers,proposals,outlook,swap,runWindow,answer,settle,payAll};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRealignmentSystem};
}else{
 const realign=makeRealignmentSystem({
  getUniverse:()=>universe,clamp,
  userTeam:()=>selected(),
  distance:(a,b,c,d)=>haversineMiles(a,b,c,d),
  commissioner:()=>commissionerMode(),
  rederiveRivalries:()=>deriveRivalries(),
  event:({type,schoolIds,importance,summary,metadata})=>{universe.events??=[];universe.events.push({id:`EVT_${type}_${universe.year}_${schoolIds.join('_')}`,type,season:universe.year,week:universe.week,schoolIds,playerIds:[],coachIds:[],gameIds:[],importance,summary,metadata})}
 });
 globalThis.DynastyRealignment=realign;
 const raEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 // The window opens once the season has been reviewed and archived, so the season just played keeps the conferences
 // it was played in.
 const offseasonReviewBeforeRealignment=offseasonReview;
 offseasonReview=function offseasonReviewWithRealignment(){
  const ok=offseasonReviewBeforeRealignment.apply(this,arguments);
  if(ok)try{realign.runWindow()}catch(err){console.error(err)}
  return ok;
 };
 // The new schedule is built from the final membership, so an open invitation is settled first.
 const offseasonPreseasonBeforeRealignment=offseasonPreseason;
 offseasonPreseason=function offseasonPreseasonWithRealignment(){
  try{realign.settle()}catch(err){console.error(err)}
  return offseasonPreseasonBeforeRealignment.apply(this,arguments);
 };
 // Media payouts land with the booster gifts, in the same fund, for every program.
 const resetNilSeasonBeforeRealignment=resetNilSeason;
 resetNilSeason=function resetNilSeasonWithRealignment(){
  const out=resetNilSeasonBeforeRealignment.apply(this,arguments);
  const F=globalThis.DynastyFacilities;
  if(F)try{
   const paid=realign.payAll((t,n)=>{const p=F.state(t);const before=p.fund;p.fund=Math.min(F.FUND_CAP,p.fund+n);return p.fund>before});
   const me=selected();if(me&&paid[me.id]){universe.realignment.lastPayout={year:universe.year,schoolId:me.id,units:paid[me.id],conference:me.conference}}
  }catch(err){console.error(err)}
  return out;
 };

 const STATUS_LABEL={rising:'Invitation likely',['at-risk']:'At risk of being dropped',watching:'On the edge',settled:'Secure'};
 function programCardHTML(t){
  const o=realign.outlook(t),r=realign.ranking(),s=realign.state(),members=realign.rankedMembers(t.conference);
  const hist=s.history.slice().reverse();
  const row=x=>`<tr class="${x.conference===t.conference?'is-mine':''}"><td>${x.rank}</td><td>${raEsc(x.conference)}</td><td>${x.value}</td><td>${x.payout}</td></tr>`;
  const mem=(x,i)=>`<tr class="${x.t===t?'is-mine':''}"><td>${i+1}</td><td>${raEsc(x.t.name)}</td><td>${x.brand}</td><td>${x.t.prestige??'—'}</td></tr>`;
  const moveLine=m=>`<li><span class="muted">${m.year}</span> <strong>${raEsc(m.up.name)}</strong> ${raEsc(m.up.from)} → ${raEsc(m.up.to)} · <strong>${raEsc(m.down.name)}</strong> ${raEsc(m.down.from)} → ${raEsc(m.down.to)}${m.brokenRivalries?.length?`<div class="small muted">Ended: ${m.brokenRivalries.map(b=>`${raEsc(b.trophy)} (${raEsc(b.school)} ${b.w}-${b.l} against ${raEsc(b.rival)})`).join('; ')}</div>`:''}</li>`;
  const pending=s.pending&&s.pending.schoolId===t.id?`<div class="ra-invite small"><strong>The ${raEsc(s.pending.to)} has invited you.</strong> Answer on This Week before the preseason.</div>`:'';
  return`<div class="section-head has-art">${globalThis.DynastyArt?.img('globe','dl-art dl-art-head')||''}<div><div class="eyebrow">CONFERENCE &amp; REALIGNMENT</div><h3>${raEsc(t.conference)}</h3><div class="muted">Media deals are renegotiated every ${realign.CYCLE} seasons. Membership follows the money.</div></div></div>
  <div class="fb-summary"><div><span class="small muted">Media rank</span><strong>#${o.rank}<small> of ${o.of}</small></strong></div><div><span class="small muted">Payout</span><strong>${o.payout}<small> units a season</small></strong></div><div><span class="small muted">Your brand</span><strong>${o.brand}<small> #${o.place} of ${o.size}</small></strong></div><div><span class="small muted">Next window</span><strong>${o.nextWindow}<small> offseason</small></strong></div></div>
  <div class="ra-status ra-${o.status}" data-ra-status="${o.status}"><strong>${STATUS_LABEL[o.status]}</strong> <span>${raEsc(o.text)}</span></div>${pending}
  <p class="small muted">Brand is prestige, fan support and facilities. When the window opens, the conference above looks at the best few brands below it, takes off a point for every ${realign.MILES_PER_POINT} miles of travel, and invites one that is at least ${realign.GAP} points clear of its own weakest member; the payout goes into your booster fund each offseason.</p>
  <details class="ra-details"><summary>Media ranking</summary><div class="table-wrap"><table><thead><tr><th>#</th><th>Conference</th><th>Value</th><th>Payout</th></tr></thead><tbody>${r.map(row).join('')}</tbody></table></div></details>
  <details class="ra-details"><summary>${raEsc(t.conference)} members by brand</summary><div class="table-wrap"><table><thead><tr><th>#</th><th>Program</th><th>Brand</th><th>Prestige</th></tr></thead><tbody>${members.map(mem).join('')}</tbody></table></div></details>
  <details class="ra-details"${hist.length?'':' hidden'}><summary>Realignment history (${hist.length})</summary><ul class="ra-history">${hist.map(moveLine).join('')}</ul></details>`;
 }
 function renderConferenceCard(){
  if(!universe?.teams)return;
  const t=selected();if(!t)return;
  let host=$('#conferenceOutlook');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.getElementById){
   const anchor=document.getElementById('facilitiesBoosters');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='conferenceOutlook';host.className='card realignment-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(!host)return;
  host.innerHTML=programCardHTML(t);
 }
 const renderProgramBeforeRealignment=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeRealignment();renderConferenceCard()};

 // The announcement on This Week: every move made in the window, and the invitation if the coach's program has one.
 function announcementHTML(){
  const s=realign.state(),w=s.lastWindow,t=selected();
  if(!w||w.year!==universe.year||universe.phase!=='complete'||!t)return'';
  const inv=s.pending&&s.pending.schoolId===t.id?s.pending:null;
  if(w.ack&&!inv)return'';
  const moves=s.history.filter(m=>m.year===w.year);
  const mine=m=>m.up.id===t.id||m.down.id===t.id;
  const line=m=>`<li class="${mine(m)?(m.up.id===t.id?'signing-good':'signing-bad'):''}"><span>${raEsc(m.up.name)} → <strong>${raEsc(m.up.to)}</strong></span><span>${raEsc(m.down.name)} → <strong>${raEsc(m.down.to)}</strong></span></li>`;
  const ranked=realign.ranking(),now=ranked.find(x=>x.conference===inv?.from),then=ranked.find(x=>x.conference===inv?.to);
  const rival=t.rivalry?universe.teams.find(x=>x.id===t.rivalry.rivalId):null;
  const invite=inv?`<div class="stop-decide" role="group" aria-label="Conference invitation"><div class="stop-decide-head"><span>The ${raEsc(inv.to)} wants you in place of ${raEsc(inv.replacesName)}</span></div>
   <ul class="stop-rows"><li><span class="stop-who">Payout<small>${now?.payout??0} units a season now · ${then?.payout??0} in the ${raEsc(inv.to)}</small></span></li>
   <li><span class="stop-who">Schedule<small>Eight conference games against the #${then?.rank??'—'} media conference instead of the #${now?.rank??'—'}</small></span></li>
   <li><span class="stop-who">Rivalry<small>${rival?`${raEsc(t.rivalry.trophy)} against ${raEsc(rival.name)} ends; a new rival is drawn from your new conference`:'You would be paired with a rival in your new conference'}</small></span></li></ul>
   <div class="button-row"><button type="button" class="bi-primary" data-ra-answer="accept">Join the ${raEsc(inv.to)}</button><button type="button" data-ra-answer="decline">Stay in the ${raEsc(inv.from)}</button></div>
   <p class="stop-note">No answer by the preseason keeps you in the ${raEsc(inv.from)}.</p></div>`:'';
  const title=inv?`The ${inv.to} has invited ${t.name}`:moves.some(mine)?`${t.name} changes conferences`:moves.length?`${moves.length} program${moves.length===1?'':'s'} change${moves.length===1?'s':''} conferences`:'The media deals are renewed with no moves';
  const text=inv?'The media deals have been renegotiated and the conference above you wants your brand. Decide before the preseason.':moves.some(m=>m.down.id===t.id)?`The ${moves.find(m=>m.down.id===t.id).down.from} replaced you with a stronger brand. You play in the ${t.conference} from next season.`:'The media deals have been renegotiated. New members play their new conference schedule from next season.';
  return`${globalThis.DynastyArt?.img('globe','dl-art dl-art-stop')||''}<div class="eyebrow">REALIGNMENT · ${w.year}</div><h3>${raEsc(title)}</h3><p>${raEsc(text)}</p>${moves.length?`<ol class="offseason-signing">${moves.map(line).join('')}</ol>`:''}${invite}${inv?'':'<div class="button-row"><button type="button" data-ra-ack>Got it</button><button type="button" data-ra-program>See your conference</button></div>'}`;
 }
 function renderAnnouncement(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#realignmentCard');
  const html=universe?.teams?announcementHTML():'';
  if(!html){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='realignmentCard';card.className='offseason-stop realignment-stop';card.setAttribute('role','region');card.setAttribute('aria-label','Conference realignment');host.insertAdjacentElement('beforebegin',card)}
  card.innerHTML=html;
  card.querySelectorAll('[data-ra-answer]').forEach(b=>b.onclick=()=>{
   const r=realign.answer(b.dataset.raAnswer==='accept');
   setStatus(r.ok?(r.accepted?`Welcome to the ${selected().conference}. ${selected().rivalry?`Your new rival: ${universe.teams.find(x=>x.id===selected().rivalry.rivalId)?.name}.`:''}`:`You stay in the ${selected().conference}.${r.move?` ${r.move.up.name} takes the place instead.`:''}`):r.reason);
   autosaveAfter('management');render();
  });
  card.querySelector('[data-ra-ack]')?.addEventListener('click',()=>{realign.state().lastWindow.ack=true;autosaveAfter('management');renderAnnouncement()});
  card.querySelector('[data-ra-program]')?.addEventListener('click',()=>goToTab('program'));
 }
 extendRender('dashboard',renderAnnouncement);
 // The Next button stops once for an open invitation, the way it stops before signing day.
 const stopBeforeRealignment=globalThis.DynastyOffseasonStop;
 globalThis.DynastyOffseasonStop=function realignmentStop(){
  try{
   const s=realign.state(),t=selected();
   if(universe?.phase==='complete'&&s?.pending&&t&&s.pending.schoolId===t.id&&!s.pending.shown){s.pending.shown=true;renderAnnouncement();setStatus(`The ${s.pending.to} has invited you. Decide before you move on.`);return true}
  }catch(err){console.error(err)}
  return stopBeforeRealignment?stopBeforeRealignment.apply(this,arguments):false;
 };
 if(typeof window!=='undefined'&&window.__DL_TEST__){
  window.__DL_TEST__.realignment=()=>JSON.parse(JSON.stringify(universe?.realignment||null));
  // Test fixture: open a window now with the coach's program invited up.
  window.__DL_TEST__.realignmentInviteFixture=()=>{
   const t=selected(),r=realign.ranking(),mine=r.find(x=>x.conference===t.conference),above=r.find(x=>x.rank===(mine.rank>1?mine.rank-1:2));
   const down=realign.rankedMembers(above.conference).at(-1).t,s=realign.state();
   s.pending={year:universe.year,schoolId:t.id,to:above.conference,from:t.conference,replaces:down.id,replacesName:down.name,gap:9};
   s.lastWindow={year:universe.year,moves:0,invited:true,ack:false,ranking:[]};render();return s.pending;
  };
 }
}
