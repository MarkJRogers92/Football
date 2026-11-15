// v0.35 — home streaks. Every program's run of home wins is counted as games finish, for the whole league. Before a
// home game This Week names your streak once it reaches four; before a road game it warns about the other program's
// once it reaches five. Long runs get a name (Home cooking at 5, The Fortress at 10, Untouchable at 20), and The Wire
// reports when you reach 10 or 20 straight, or end someone else's run of eight or more.
//
// State: universe.homeStreaks {teamId: {streak, best, bestEnded}} — one small object per program. Neutral-site games
// do not count. Streaks start counting with this version; earlier seasons are not reconstructed.
function makeHomeStreaks(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const SHOW_MINE=4,SHOW_THEIRS=5,SNAP=8,MILESTONES=[10,20];
 const NAMES=[[20,'Untouchable'],[10,'The Fortress'],[5,'Home cooking']];
 function table(){return universe().homeStreaks??={}}
 function of(id){const t=table();return t[id]??={streak:0,best:0,bestEnded:null}}
 const nameFor=n=>NAMES.find(([at])=>n>=at)?.[1]||null;
 // A finished game: the home side's run grows with a win and ends with a loss. Returns what changed.
 function record(rec){
  if(!rec?.score||!rec.home||!rec.away||/neutral/i.test(rec.venue||''))return null;
  const h=of(rec.home.id),won=Number(rec.score.home)>Number(rec.score.away),before=h.streak;
  if(won){h.streak++;if(h.streak>h.best)h.best=h.streak}else{if(h.streak>0)h.bestEnded=h.best===h.streak?rec.season:h.bestEnded;h.streak=0}
  return{homeId:rec.home.id,awayId:rec.away.id,won,before,after:h.streak};
 }
 function line(n,whose){const name=nameFor(n);return`${name?`${name}: `:''}${whose} ${n} straight home win${n===1?'':'s'}`}
 return{SHOW_MINE,SHOW_THEIRS,SNAP,MILESTONES,of,nameFor,record,line};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeHomeStreaks};
}else{
 const streaks=makeHomeStreaks({getUniverse:()=>universe});
 globalThis.DynastyHomeStreaks=streaks;
 const hsEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const finishGameBeforeStreaks=finishGame;
 finishGame=function finishGameWithStreaks(before,home,away){
  const out=finishGameBeforeStreaks.apply(this,arguments);
  try{
   const rec=(universe.gameArchive||[]).at(-1);if(rec?.id!==out?.gameId)return out;
   const r=streaks.record(rec),me=selected();if(!r||!me)return out;
   const week=universe.phase==='regular'?universe.week+1:universe.week,push=(kind,text,importance)=>{universe.events??=[];universe.events.push({id:`EVT_HOME_${kind}_${rec.id}`,type:'HOME_STREAK',season:rec.season??universe.year,week,schoolIds:[me.id],playerIds:[],coachIds:[],gameIds:[rec.id],importance,summary:text,metadata:{kind}})};
   if(String(r.homeId)===String(me.id)&&r.won&&streaks.MILESTONES.includes(r.after))push('mine',`${me.name} have won ${r.after} straight at home${streaks.nameFor(r.after)?` (${streaks.nameFor(r.after)})`:''}.`,62);
   if(String(r.awayId)===String(me.id)&&!r.won&&r.before>=streaks.SNAP)push('snapped',`${me.name} ended ${home.name}'s ${r.before}-game home winning streak.`,66);
  }catch(err){console.error(err)}
  return out;
 };
 function renderStreakCard(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#homeStreak');const t=universe?.teams?selected():null;
  const g=t&&universe.phase==='regular'?(universe.schedule?.[universe.week]||[]).find(x=>!x.played&&(x.home===t.name||x.away===t.name)):null;
  let text=null;
  if(g){
   const home=g.home===t.name,host=universe.teams.find(x=>x.name===g.home),n=host?streaks.of(host.id).streak:0;
   if(home&&n>=streaks.SHOW_MINE)text=`${streaks.line(n,'you have')}. ${hsEsc(g.away)} come to town.`;
   else if(!home&&n>=streaks.SHOW_THEIRS)text=`${streaks.line(n,`${hsEsc(g.home)} have`)}. End it and the Wire will notice.`;
  }
  if(!text){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='homeStreak';card.className='home-streak';card.setAttribute('role','region');card.setAttribute('aria-label','Home streak');host.insertAdjacentElement('beforebegin',card)}
  card.innerHTML=`<div class="eyebrow">HOME STREAK</div><p>${text}</p>`;
 }
 extendRender('dashboard',renderStreakCard);
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.homeStreakFixture=n=>{const t=selected(),g=universe.schedule[universe.week].find(x=>x.home===t.name||x.away===t.name),host=universe.teams.find(x=>x.name===g.home);streaks.of(host.id).streak=n;render();return{home:g.home===t.name,host:host.name}};
}
