// v0.36 — national Players of the Week. After each regular-season week the best offensive and the best defensive
// performance in the country are named from the week's box scores. This Week shows last week's winners; when one of
// them is yours, The Wire says so and the honour counts on his season line in the card.
//
// The score reads only the game's own statistics (a small bonus for winning), never ratings. State:
// universe.weeklyHonors {year, rows:[{week, off, def}]}, this season only (about 2 KB), cleared when a new season starts.
//
// v0.37 — the honour counts for more than a week. This season's honours lift a player in the award race (seasonScore),
// his career count (p.potw, one small integer, carried into the archive and onto his draft record) lifts his draft
// stock a little, and a player honoured twice or more is introduced that way on Draft Night and in the Hall of Fame.
function makePlayersOfWeek(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const OFF=new Set(['QB','RB','WR','TE']),DEF=new Set(['EDGE','DT','LB','CB','S']);
 const n=v=>Number(v)||0;
 function score(pos,s){
  if(pos==='QB')return n(s.passYds)*.04+n(s.passTD)*4-n(s.int)*3+n(s.rushYds)*.08+n(s.rushTD)*5-n(s.fumbles)*2;
  if(OFF.has(pos))return n(s.rushYds)*.1+n(s.rushTD)*6+n(s.recYds)*.1+n(s.recTD)*6+n(s.receptions)*.4-n(s.fumbles)*2-n(s.drops);
  if(DEF.has(pos))return n(s.tackles)*.9+n(s.tfl)*1.5+n(s.sacks)*5+n(s.intDef)*7+n(s.passBreakups)*1.2+n(s.forcedFumbles)*4+n(s.pressures)*.3;
  return 0;
 }
 function line(pos,s){
  const parts=[];
  if(n(s.passYds))parts.push(`${n(s.passYds)} pass yds, ${n(s.passTD)} TD${n(s.int)?`, ${n(s.int)} INT`:''}`);
  if(n(s.rushYds)>=20||n(s.rushTD))parts.push(`${n(s.rushYds)} rush yds${n(s.rushTD)?`, ${n(s.rushTD)} TD`:''}`);
  if(n(s.recYds))parts.push(`${n(s.receptions)} rec, ${n(s.recYds)} yds${n(s.recTD)?`, ${n(s.recTD)} TD`:''}`);
  if(DEF.has(pos)){if(n(s.tackles))parts.push(`${n(s.tackles)} tackles`);if(n(s.sacks))parts.push(`${n(s.sacks)} sack${n(s.sacks)===1?'':'s'}`);if(n(s.intDef))parts.push(`${n(s.intDef)} INT`);if(n(s.tfl))parts.push(`${n(s.tfl)} TFL`)}
  return parts.slice(0,3).join(' · ');
 }
 // The best offensive and defensive line among a week's finished games.
 function pick(games){
  let off=null,def=null;
  for(const g of games||[]){
   if(!g?.playerStats||!g.score)continue;
   for(const side of ['home','away']){
    const won=n(g.score[side])>n(g.score[side==='home'?'away':'home']),team=g[side];
    for(const p of g.playerStats[side]||[]){
     const group=OFF.has(p.pos)?'off':DEF.has(p.pos)?'def':null;if(!group)continue;
     const v=score(p.pos,p.stats||{})+(won?3:0),row={playerId:p.id,name:p.name,pos:p.pos,team:team.name,teamId:team.id,line:line(p.pos,p.stats||{}),score:Math.round(v*10)/10,gameId:g.id};
     if(group==='off'){if(!off||v>off.score||(v===off.score&&String(p.id)<String(off.playerId)))off=row}
     else if(!def||v>def.score||(v===def.score&&String(p.id)<String(def.playerId)))def=row;
    }
   }
  }
  return{off,def};
 }
 function state(){const u=universe();if(!u.weeklyHonors||u.weeklyHonors.year!==u.year)u.weeklyHonors={year:u.year,rows:[]};return u.weeklyHonors}
 // Name the winners for a played week (1-based). Idempotent per week.
 function award(week){
  const u=universe(),s=state();const had=s.rows.find(r=>r.week===week);if(had)return null;
  const games=[];const arch=u.gameArchive||[];
  for(let i=arch.length-1;i>=0;i--){const g=arch[i];if((g.season??u.year)!==u.year)break;if(g.week===week&&(!g.label||g.label==='Regular season'))games.push(g)}
  const {off,def}=pick(games);if(!off&&!def)return null;
  const row={week,off,def};s.rows.push(row);return row;
 }
 function last(){return state().rows.at(-1)||null}
 // This season's honours by player, rebuilt only when a week is added (seasonScore reads it for every player).
 let counts={key:null,map:new Map()};
 function seasonCounts(){
  const s=state(),key=`${s.year}:${s.rows.length}`;
  if(counts.key!==key){const map=new Map();for(const r of s.rows)for(const w of [r.off,r.def])if(w)map.set(String(w.playerId),(map.get(String(w.playerId))||0)+1);counts={key,map}}
  return counts.map;
 }
 function countFor(playerId){return seasonCounts().get(String(playerId))||0}
 // Award race: each honour this season is worth about one strong game in seasonScore, up to four of them.
 const AWARD_BONUS=2.5,AWARD_MAX=4;
 function awardBonus(playerId){return Math.min(AWARD_MAX,countFor(playerId))*AWARD_BONUS}
 // Draft: scouts notice a player the country kept naming. Worth well under a round (a round is 3-4 board points).
 const DRAFT_STEP=.6,DRAFT_MAX=2;
 function draftBump(career){return Math.round(Math.min(DRAFT_MAX,Math.max(0,Number(career)||0)*DRAFT_STEP)*10)/10}
 const WORDS=['','','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten'];
 function honourLabel(k){k=Number(k)||0;if(k<1)return'';if(k===1)return'Player of the Week';return`${WORDS[k]||k}-time Player of the Week`}
 return{score,line,pick,award,last,countFor,seasonCounts,awardBonus,draftBump,honourLabel,AWARD_BONUS,AWARD_MAX,DRAFT_STEP,DRAFT_MAX,state};
}

if(typeof module==='object'&&module.exports){
 module.exports={makePlayersOfWeek};
}else{
 const potw=makePlayersOfWeek({getUniverse:()=>universe});
 globalThis.DynastyPlayersOfWeek=potw;
 const pwEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Your winners go in the event ledger, which The Wire reads.
 function announcePlayersOfWeek(row){
  const me=selected();if(!row||!me)return;
  for(const [kind,w] of [['Offensive',row.off],['Defensive',row.def]]){
   if(!w||String(w.teamId)!==String(me.id))continue;
   const k=potw.countFor(w.playerId);
   universe.events??=[];universe.events.push({id:`EVT_POTW_${universe.year}_${row.week}_${kind}`,type:'PLAYER_OF_WEEK',season:universe.year,week:universe.week,schoolIds:[me.id],playerIds:[w.playerId],coachIds:[],gameIds:w.gameId?[w.gameId]:[],importance:63,summary:`${w.pos} ${w.name} is the National ${kind} Player of the Week (${w.line})${k>1?`, his ${k===2?'second':k===3?'third':`${k}th`} this season`:''}.`,metadata:{kind,week:row.week}});
  }
 }
 potw.announce=announcePlayersOfWeek;
 // A player's career count lives on the player, so it survives the season, the archive and the draft.
 function creditCareer(row){for(const w of [row?.off,row?.def]){if(!w)continue;const f=findPlayer(w.playerId);if(f?.p)f.p.potw=(f.p.potw||0)+1}}
 potw.creditCareer=creditCareer;
 const simWeekBeforePotw=simWeek;
 simWeek=function simWeekWithPlayersOfWeek(){
  const week=universe?.week,out=simWeekBeforePotw.apply(this,arguments);
  try{if(universe&&week!=null&&universe.week===week+1){const row=potw.award(week+1);if(row){creditCareer(row);announcePlayersOfWeek(row)}}}catch(err){console.error(err)}
  return out;
 };
 // The award race and the season's awards read seasonScore.
 const seasonScoreBeforePotw=seasonScore;
 seasonScore=function seasonScoreWithPlayersOfWeek(p,t){const base=seasonScoreBeforePotw.apply(this,arguments);return p?.id!=null?base+potw.awardBonus(p.id):base};
 // The draft board: a small lift for a career of weekly honours, recomputing the round on the same thresholds.
 const draftProjectionBeforePotw=draftProjection;
 draftProjection=function draftProjectionWithPlayersOfWeek(p,t){
  const d=draftProjectionBeforePotw.apply(this,arguments),bump=potw.draftBump(p?.potw);
  if(!d||!bump)return d;
  const nfl=globalThis.DynastyNfl,raw=d.grade!=null&&d.positionValue!=null&&nfl?d.grade+d.positionValue*.8:d.score;
  const score=raw+bump,round=nfl?nfl.roundFor(score):d.round;
  const pick=round?(d.pick??(nfl?1+nfl.hash(p.id,'pick')%32:16)):null;
  return{...d,score:Math.round(score),round,pick,label:round?`Projected round ${round}`:d.label,potwBump:bump};
 };
 const draftPlayerBeforePotw=draftPlayer;
 draftPlayer=function draftPlayerWithPlayersOfWeek(p){const r=draftPlayerBeforePotw.apply(this,arguments);if(r&&p?.potw)r.potw=p.potw;return r};
 const archiveRecordBeforePotw=archiveRecord;
 archiveRecord=function archiveRecordWithPlayersOfWeek(p){const out=archiveRecordBeforePotw.apply(this,arguments);if(out&&p?.potw)out.potw=p.potw;return out};
 // Hall of Fame: twice honoured or more is part of the case.
 const hofReasonsBeforePotw=hofPlayerReasons;
 hofPlayerReasons=function hofReasonsWithPlayersOfWeek(p){const reasons=hofReasonsBeforePotw.apply(this,arguments);if((p?.potw||0)>=2){const at=Math.min(reasons.length,2);reasons.splice(at,0,potw.honourLabel(p.potw))}return reasons.slice(0,4)};
 function renderPlayersOfWeek(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#playersOfWeek');const row=universe?.teams&&universe.phase==='regular'?potw.last():null,me=row?selected():null;
  if(!row||row.week!==universe.week){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='playersOfWeek';card.className='players-of-week';card.setAttribute('role','region');card.setAttribute('aria-label','Players of the Week');host.insertAdjacentElement('beforebegin',card)}
  const one=(label,w)=>w?`<li${String(w.teamId)===String(me?.id)?' class="is-mine"':''}><span class="small muted">${label}</span> <button type="button" class="player-button" data-player="${pwEsc(w.playerId)}">${pwEsc(w.pos)} ${pwEsc(w.name)}</button>, ${pwEsc(w.team)}<small>${pwEsc(w.line)}</small></li>`:'';
  card.innerHTML=`<div class="eyebrow">NATIONAL PLAYERS OF THE WEEK · WEEK ${row.week}</div><ul class="potw-list">${one('Offense',row.off)}${one('Defense',row.def)}</ul>`;
  card.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));
 }
 extendRender('dashboard',renderPlayersOfWeek);
 // Test pages only: last week's winners, one of them yours.
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.playersOfWeekFixture=()=>{const t=selected(),p=t.roster.find(x=>x.pos==='QB');potw.state().rows.push({week:universe.week,off:{playerId:p.id,name:p.name,pos:'QB',team:t.name,teamId:t.id,line:'412 pass yds, 5 TD'},def:{playerId:'x',name:'Other Guy',pos:'LB',team:'Elsewhere',teamId:-1,line:'14 tackles · 2 sacks'}});renderPlayersOfWeek();return p.name};
}
