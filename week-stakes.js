// v0.34 — trap games and statement wins. Ordinary weeks get stakes without a new decision.
//
//   Trap game       This Week warns when a ranked team (yours) hosts or visits an unranked opponent with a .500 record
//                   or better, either right before a big game (a top-15 opponent or your rival next week) or right
//                   after a win over a top-10 team.
//   Statement win   when you beat a top-10 team at kickoff while unranked or ranked at least ten places lower, the
//                   win goes in The Wire and the event ledger as a STATEMENT_WIN.
//
// Rankings come from the game records (rank at kickoff) and the current poll. Nothing else is stored.
function makeWeekStakes(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const RANKED=25,BIG_NEXT=15,TOP=10,GAP=10;
 const isRanked=r=>Number.isFinite(r)&&r>=1&&r<=RANKED;
 function gameOf(t,week){return(universe().schedule?.[week]||[]).find(g=>g.home===t.name||g.away===t.name)||null}
 const opponentName=(g,t)=>g.home===t.name?g.away:g.home;
 const team=n=>(universe().teams||[]).find(x=>x.name===n)||null;
 // This week's game, if it has the look of a trap.
 function trap(t){
  const u=universe();if(!t||u.phase!=='regular'||!isRanked(t.rank))return null;
  const g=gameOf(t,u.week);if(!g||g.played)return null;
  const opp=team(opponentName(g,t));if(!opp||isRanked(opp.rank)||(opp.w||0)<(opp.l||0))return null;
  const next=gameOf(t,u.week+1),nextOpp=next?team(opponentName(next,t)):null,rivalId=t.rivalry?.rivalId;
  const lookahead=nextOpp&&(isRanked(nextOpp.rank)&&nextOpp.rank<=BIG_NEXT||(rivalId!=null&&String(nextOpp.id)===String(rivalId)))?nextOpp:null;
  const last=gameOf(t,u.week-1),lastOpp=last?.played?team(opponentName(last,t)):null;
  const lastRank=last?.played&&last.winner===t.name?rankAtKickoff(last,lastOpp):null;
  const letdown=Number.isFinite(lastRank)&&lastRank<=TOP?{opp:lastOpp,rank:lastRank}:null;
  if(!lookahead&&!letdown)return null;
  return{opp,home:g.home===t.name,lookahead:lookahead?{name:lookahead.name,rank:isRanked(lookahead.rank)?lookahead.rank:null,rival:String(lookahead.id)===String(rivalId)}:null,letdown:letdown?{name:letdown.opp?.name,rank:letdown.rank}:null};
 }
 // An opponent's ranking when the game kicked off, from the archived game record when there is one.
 function rankAtKickoff(g,opp){
  const rec=(universe().gameArchive||[]).find(x=>x.id===g.gameId);
  const side=rec?(rec.home?.id===opp?.id?rec.home:rec.away?.id===opp?.id?rec.away:null):null;
  return Number.isFinite(side?.rank)?side.rank:opp?.rank;
 }
 // A finished game record: was it a statement win for this program?
 function statement(rec,t){
  if(!rec?.score||!t)return null;
  const side=rec.home?.id===t.id?'home':rec.away?.id===t.id?'away':null;if(!side)return null;
  const other=side==='home'?'away':'home',us=Number(rec.score[side]),them=Number(rec.score[other]);if(!(us>them))return null;
  const oppRank=rec[other]?.rank,myRank=rec[side]?.rank;
  if(!Number.isFinite(oppRank)||oppRank>TOP)return null;
  if(isRanked(myRank)&&myRank-oppRank<GAP)return null;
  return{oppName:rec[other].name,oppRank,myRank:isRanked(myRank)?myRank:null,us,them,label:rec.label};
 }
 function recordStatement(rec,t){
  const s=statement(rec,t);if(!s)return null;
  const u=universe(),id=`EVT_STATEMENT_${rec.id}`;if((u.events||[]).some(e=>e.id===id))return null;
  const who=s.myRank?`#${s.myRank} ${t.name}`:`Unranked ${t.name}`;
  // A regular-season game finishes before the week counter moves on; The Wire reads the week it is shown in.
  const e={id,type:'STATEMENT_WIN',season:rec.season??u.year,week:u.phase==='regular'?u.week+1:u.week,schoolIds:[t.id],playerIds:[],coachIds:[],gameIds:[rec.id],importance:68,
   summary:`Statement win: ${who} beat #${s.oppRank} ${s.oppName} ${s.us}–${s.them}.`,metadata:{oppRank:s.oppRank,myRank:s.myRank}};
  (u.events??=[]).push(e);return e;
 }
 return{trap,statement,recordStatement};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeWeekStakes};
}else{
 const stakes=makeWeekStakes({getUniverse:()=>universe});
 globalThis.DynastyWeekStakes=stakes;
 const wsEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Your finished games are checked for a statement win as they are recorded.
 const finishGameBeforeStakes=finishGame;
 finishGame=function finishGameWithStakes(before,home,away){
  const out=finishGameBeforeStakes.apply(this,arguments);
  try{const me=selected();if(me&&(home===me||away===me)){const rec=(universe.gameArchive||[]).at(-1);if(rec?.id===out?.gameId)stakes.recordStatement(rec,me)}}catch(err){console.error(err)}
  return out;
 };
 function renderTrapCard(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#trapGame');const t=universe?.teams?selected():null,info=t?stakes.trap(t):null;
  if(!info){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='trapGame';card.className='trap-game';card.setAttribute('role','region');card.setAttribute('aria-label','Trap game');host.insertAdjacentElement('beforebegin',card)}
  const o=info.opp,why=[info.letdown?`coming off the win over #${info.letdown.rank} ${wsEsc(info.letdown.name)}`:'',info.lookahead?`with ${info.lookahead.rival?`your rival ${wsEsc(info.lookahead.name)}`:`#${info.lookahead.rank} ${wsEsc(info.lookahead.name)}`} next week`:''].filter(Boolean).join(' and ');
  card.innerHTML=`<div class="eyebrow">TRAP GAME</div><p><strong>${info.home?'Unranked':'At unranked'} ${wsEsc(o.name)} (${o.w||0}-${o.l||0})</strong>, ${why}. Ranked teams drop more of these than anyone admits.</p>`;
 }
 extendRender('dashboard',renderTrapCard);
 // Test pages only: rank this program, make this week's opponent an unranked .500 team and next week's a top-5 one.
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.trapGameFixture=()=>{
  const t=selected(),w=universe.week,g=universe.schedule[w].find(x=>x.home===t.name||x.away===t.name),n=universe.schedule[w+1].find(x=>x.home===t.name||x.away===t.name);
  const opp=universe.teams.find(x=>x.name===(g.home===t.name?g.away:g.home)),next=universe.teams.find(x=>x.name===(n.home===t.name?n.away:n.home));
  // render() recomputes the poll, so this paints only the card from the fixture rankings.
  t.rank=8;opp.rank=50;opp.w=2;opp.l=1;next.rank=4;renderTrapCard();return opp.name;
 };
}
