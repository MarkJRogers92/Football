// v0.35 — a bet with the administration. Before the first game the coach may promise the board one thing above
// what it expects: more wins, a higher finish, a conference title or the rival. The promise joins the season goals
// as a Wager. Deliver it and the board's season review gains +8 confidence and the boosters +2 goodwill; miss it
// and the review loses 6. Not betting changes nothing, and the staff never bet for you.
//
// State: the wager is one more entry in t.seasonGoals (weight 'Wager', id 'wager'), plus t.adminWager {year,
// declined, settled} so the card asks once a season and the goodwill is paid once.
function makeAdminWager(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const WIN=8,LOSE=6,GOODWILL=2,WEIGHT='Wager';
 function state(t){const s=t.adminWager;if(!s||s.year!==universe().year)t.adminWager={year:universe().year,declined:false,settled:false};return t.adminWager}
 function current(t){return(t?.seasonGoals||[]).find(g=>g.id==='wager'&&g.year===universe().year)||null}
 // The window: the preseason, or the first week before any game is played.
 function open(t){const u=universe();if(!t||current(t)||state(t).declined)return false;return(u.phase==='preseason'&&u.week===0)||(u.phase==='regular'&&u.week===0&&(t.w||0)+(t.l||0)===0)}
 // Three promises, each beyond the board's stated goals.
 function choices(t){
  const exp=env.expectation(t),rival=env.rivalOf(t),p=t.prestige||0,out=[];
  out.push({key:'wins',type:'wins',label:`Win at least ${Math.min(12,exp+2)} games`,target:Math.min(12,exp+2)});
  const rank=p>=80?5:p>=65?10:20;out.push({key:'rank',type:'rank',label:`Finish in the Top ${rank}`,target:rank});
  if(p>=88)out.push({key:'title',type:'nationalTitle',label:'Win the national championship',target:null});
  else if(rival&&p<70)out.push({key:'rival',type:'rivalry',label:`Beat ${rival.name}`,target:rival.id});
  else out.push({key:'conf',type:'conferenceTitle',label:'Win the conference championship',target:null});
  return out;
 }
 function accept(t,key){
  if(!open(t))return{ok:false,reason:'The board only takes a bet before the first game.'};
  const c=choices(t).find(x=>x.key===key);if(!c)return{ok:false,reason:'That bet is not on the table.'};
  env.ensureGoals(t);
  t.seasonGoals.push({id:'wager',weight:WEIGHT,tier:WEIGHT,type:c.type,label:c.label,target:c.target,year:universe().year});
  return{ok:true,goal:c};
 }
 function decline(t){if(!open(t))return false;state(t).declined=true;return true}
 // The season goals' own adjustment counts any other goal as a bonus (+4 / -1); the wager replaces that with its stakes.
 function adjust(review,final){
  if(!final||!review)return review;
  for(const r of review.results||[])if(r.weight===WEIGHT)review.adjustment+=r.state==='complete'?WIN-4:-LOSE+1;
  return review;
 }
 // Paid once, when the board reviews the season.
 function settle(t,review){
  const g=current(t),s=state(t);if(!g||s.settled)return null;
  const r=(review?.results||[]).find(x=>x.id==='wager');if(!r)return null;
  s.settled=true;const won=r.state==='complete';if(won)env.goodwill(t,GOODWILL);
  return{won,label:g.label};
 }
 return{WIN,LOSE,GOODWILL,WEIGHT,state,current,open,choices,accept,decline,adjust,settle};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeAdminWager};
}else{
 const wager=makeAdminWager({getUniverse:()=>universe,expectation:t=>seasonExpectation(t),rivalOf:t=>rivalOf(t),ensureGoals:t=>ensureSeasonGoals(t),
  goodwill:(t,n)=>{const F=globalThis.DynastyFacilities;if(F){const p=F.state(t);p.goodwill=Math.min(100,p.goodwill+n)}}});
 globalThis.DynastyAdminWager=wager;
 const awEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const evaluateBeforeWager=evaluateSeasonGoals;
 evaluateSeasonGoals=function evaluateSeasonGoalsWithWager(t,final){return wager.adjust(evaluateBeforeWager.apply(this,arguments),!!final)};
 const reviewBeforeWager=adminSeasonReview;
 adminSeasonReview=function adminSeasonReviewWithWager(t){
  const out=reviewBeforeWager.apply(this,arguments);
  try{const r=wager.settle(t,evaluateSeasonGoals(t,true));if(r){universe.events??=[];universe.events.push({id:`EVT_WAGER_${universe.year}_${t.id}`,type:'ADMIN_WAGER',season:universe.year,week:universe.week,schoolIds:[t.id],playerIds:[],coachIds:[],gameIds:[],importance:60,summary:r.won?`You delivered on your bet with the board: ${r.label}. Confidence +${wager.WIN}, boosters +${wager.GOODWILL} goodwill.`:`You missed your bet with the board: ${r.label}. Confidence −${wager.LOSE}.`,metadata:{won:r.won}})}}catch(err){console.error(err)}
  return out;
 };
 function renderWagerCard(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#adminWager');const t=universe?.teams?selected():null;
  if(!t||!wager.open(t)||commissionerMode?.()){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='adminWager';card.className='offseason-stop admin-wager';card.setAttribute('role','region');card.setAttribute('aria-label','Bet with the administration');host.insertAdjacentElement('beforebegin',card)}
  const row=c=>`<li><span class="stop-who">${awEsc(c.label)}</span><button type="button" class="dw-button" data-wager="${awEsc(c.key)}">Promise it</button></li>`;
  card.innerHTML=`<div class="eyebrow">THE BOARD · OPTIONAL</div><h3>Make the board a promise?</h3><p>The board expects ${awEsc(seasonExpectation(t))} wins. Promise one thing more: deliver it for <strong>+${wager.WIN} confidence</strong> and <strong>+${wager.GOODWILL} booster goodwill</strong>; miss it and lose <strong>${wager.LOSE}</strong>. Open until the first game.</p><ul class="stop-rows">${wager.choices(t).map(row).join('')}</ul><button type="button" class="dw-button" data-wager-decline>No bet this season</button>`;
  card.querySelectorAll('[data-wager]').forEach(b=>b.onclick=()=>{const r=wager.accept(t,b.dataset.wager);setStatus(r.ok?`Bet made with the board: ${r.goal.label}.`:r.reason);if(r.ok)autosaveAfter('management');render()});
  card.querySelector('[data-wager-decline]').onclick=()=>{wager.decline(t);setStatus('No bet this season.');autosaveAfter('management');render()};
 }
 extendRender('dashboard',renderWagerCard);
}
