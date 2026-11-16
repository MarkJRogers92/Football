// v0.37 — the long memory. Three things a long dynasty has earned the right to remember:
//
// * Where are they now? Every fifth archived season The Wire checks in on three notable former players of your program:
//   still playing pro football, retired from it, coaching somewhere, or out of the game with his college line standing.
//   Nothing is invented: a pro career is read from the pro pipeline, a coaching job from the staff lists.
// * This week in history. When the coming week's anniversary (5, 10, 15... years) holds a memorable game of yours, an
//   upset, a win over a top-five team or a rivalry win, This Week says so. Derived from the game archive; no save field.
// * Milestone watch. A player of yours within about two games of a school season record, a school career record or a
//   national career record is named on This Week, with what he needs and the holder he would pass. Derived; no save field.
//
// State: universe.longMemory {checkins:[year], seen:[playerId]} (seen capped at 60) for the check-ins only.
function makeLongMemory(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const n=v=>Number(v)||0;
 const CHECKIN_EVERY=5,CHECKIN_SIZE=3,CHECKIN_MIN_GONE=3,SEEN_CAP=60;
 const ANNIVERSARY_STEP=5,MILESTONE_GAMES=2,MILESTONE_MAX=3;
 function state(){const u=universe();u.longMemory??={checkins:[],seen:[]};u.longMemory.checkins??=[];u.longMemory.seen??=[];return u.longMemory}

 // ---- Where are they now ----
 function archivedSeasons(){return (universe().history||[]).filter(h=>h?.type==='season').length}
 function checkinDue(){const s=archivedSeasons();return s>0&&s%CHECKIN_EVERY===0&&!state().checkins.includes(universe().year)}
 const ROUND_POINTS={1:25,2:15,3:8};
 function notability(p){
  const awards=(p.awards||[]).length,round=p.draftResult?.round||0,pro=env.proCareer?.(p);
  return awards*30+(round?ROUND_POINTS[round]||4:0)+n(p.potw)*3+Math.max(0,n(env.production?.(p))-55)+(pro?n(pro.legacy):0);
 }
 function alumniOf(t){
  const u=universe(),out=[];
  for(const p of u.playerArchive||[]){
   if(p.lastTeam!==t.name&&String(p.currentSchoolId)!==String(t.id))continue;
   if(n(p.retiredYear)>u.year-CHECKIN_MIN_GONE)continue;
   if(!(n(p.career?.games)>0))continue;
   out.push(p);
  }
  return out;
 }
 function pickCheckins(t){
  const seen=new Set(state().seen.map(String));
  return alumniOf(t).filter(p=>!seen.has(String(p.id))).map(p=>({p,score:notability(p)})).filter(x=>x.score>=10)
   .sort((a,b)=>b.score-a.score||String(a.p.id).localeCompare(String(b.p.id))).slice(0,CHECKIN_SIZE).map(x=>x.p);
 }
 const BEST={QB:['passYds','passing yards'],RB:['rushYds','rushing yards'],WR:['recYds','receiving yards'],TE:['recYds','receiving yards'],EDGE:['sacks','sacks'],DT:['sacks','sacks'],LB:['tackles','tackles'],CB:['intDef','interceptions'],S:['intDef','interceptions']};
 function collegeLine(p){const d=BEST[p.pos];if(!d)return null;const v=n(p.career?.[d[0]]);return v?`${d[0]==='sacks'?v.toFixed(1).replace(/\.0$/,''):Math.round(v).toLocaleString('en-US')} career ${d[1]}`:null}
 const plural=(k,w)=>`${k} ${w}${k===1?'':'s'}`;
 function proHonours(c){return[c.proBowls?plural(c.proBowls,'Pro Bowl'):'',c.allPros?`${c.allPros}× All-Pro`:'',c.rings?plural(c.rings,'ring'):''].filter(Boolean).join(', ')}
 // One clause per former player, from facts the game holds.
 function whereNow(p){
  const c=env.proCareer?.(p),coach=env.coachFor?.(p.id),h=c?proHonours(c):'';
  const job=coach?`coaching ${coach.role||'on staff'} at ${coach.school}`:'';
  if(c&&c.hof)return`in the Pro Football Hall of Fame${h?` (${h})`:''}${job?`, now ${job}`:''}`;
  if(c&&c.active)return`in his ${ordinal(c.done+1)} pro season${h?` (${h})`:''}`;
  if(c&&c.retired&&c.length)return`retired after ${plural(c.length,'pro season')}${h?` (${h})`:''}${job?`, now ${job}`:''}`;
  if(job)return job;
  const line=collegeLine(p);return line?`out of football; his ${line} still stand`:`out of football after ${plural(n(p.career?.games),'college game')}`;
 }
 function ordinal(k){const s=['th','st','nd','rd'],v=k%100;return k+(s[(v-20)%10]||s[v]||s[0])}
 function checkin(t){
  if(!t||!checkinDue())return null;
  const s=state(),list=pickCheckins(t);s.checkins.push(universe().year);s.checkins=s.checkins.slice(-12);
  if(!list.length)return null;
  s.seen.push(...list.map(p=>String(p.id)));s.seen=s.seen.slice(-SEEN_CAP);
  return{year:universe().year,rows:list.map(p=>({playerId:p.id,name:p.name,pos:p.pos,left:p.retiredYear,text:whereNow(p)}))};
 }

 // ---- This week in history ----
 const ranked=r=>Number.isFinite(Number(r))&&Number(r)>0&&Number(r)<=25?Number(r):null;
 function memorable(g,t){
  if(!g?.score||g.season==null)return null;
  const side=String(g.home?.id)===String(t.id)?'home':String(g.away?.id)===String(t.id)?'away':null;if(!side)return null;
  const other=side==='home'?'away':'home',us=n(g.score[side]),them=n(g.score[other]);if(us<=them)return null;
  const mine=ranked(g[side]?.rank),opp=ranked(g[other]?.rank),oppName=g[other]?.name||'';
  const score=`${us}-${them}`;
  if(opp&&opp<=10&&(mine==null||mine-opp>=12))return{kind:'upset',weight:3,text:`${mine?`#${mine} `:'unranked '}${t.name} upset #${opp} ${oppName}, ${score}`};
  if(opp&&opp<=5)return{kind:'top5',weight:2,text:`${t.name} beat #${opp} ${oppName}, ${score}`};
  if(env.isRivalry?.(g,t))return{kind:'rivalry',weight:1,text:`${t.name} beat ${oppName}${g.trophy?` for the ${g.trophy}`:''}, ${score}`};
  return null;
 }
 // The coming week's games from 5, 10, 15... years ago; the best one wins, the older one breaking a tie.
 function anniversary(t,{week=universe().week+1,year=universe().year}={}){
  if(!t||env.gamesDeferred?.())return null;
  let best=null;
  for(const g of universe().gameArchive||[]){
   const ago=year-n(g.season);if(ago<ANNIVERSARY_STEP||ago%ANNIVERSARY_STEP)continue;
   if(g.week!==week||(g.label&&g.label!=='Regular season'))continue;
   const m=memorable(g,t);if(!m)continue;
   if(!best||m.weight>best.weight||(m.weight===best.weight&&ago>best.ago))best={...m,ago,season:g.season,gameId:g.id};
  }
  return best;
 }

 // ---- Milestone watch ----
 function pace(p,k){const g=n(p.stats?.games);if(g>=2)return n(p.stats?.[k])/g;const cg=n(p.career?.games);return cg?n(p.career?.[k])/cg:0}
 // records: {season:t.records, schoolCareer:(playerId,k)=>{total, holder}|null, nationalCareer:universe.records.nationalCareer}
 function milestones(t,records){
  if(!t)return[];
  const out=[];
  for(const p of t.roster||[]){
   const d=BEST[p.pos];if(!d||!(n(p.stats?.games)>=1)||n(p.injuryWeeks)>MILESTONE_GAMES)continue;
   const [k,label]=d,per=pace(p,k);if(per<=0)continue;
   const consider=(kind,mine,rec,holder,rank)=>{
    if(!(rec>0)||holder?.id===p.id)return;const need=rec-mine;if(need<=0)return;const games=Math.ceil(need/per);if(games>MILESTONE_GAMES)return;
    out.push({playerId:p.id,name:p.name,pos:p.pos,kind,stat:k,label,need:Math.ceil(need*10)/10,games,holder:holder?.name||'',holderYear:holder?.year??null,rank});
   };
   const nat=records?.nationalCareer?.[k];consider('national career',n(p.career?.[k])+n(p.stats?.[k]),n(nat?.value),nat&&{id:nat.playerId,name:nat.playerName,year:nat.year},3);
   const sc=records?.schoolCareer?.(p.id,k);if(sc)consider('school career',sc.total,sc.value,{id:sc.id,name:sc.holder},2);
   const ss=records?.season?.[k];consider('school season',n(p.stats?.[k]),n(ss?.value),ss&&{id:ss.playerId,name:ss.playerName,year:ss.year},1);
  }
  // One line per player, his biggest record first.
  const byPlayer=new Map();for(const m of out.sort((a,b)=>b.rank-a.rank||a.games-b.games||a.need-b.need))if(!byPlayer.has(m.playerId))byPlayer.set(m.playerId,m);
  return[...byPlayer.values()].slice(0,MILESTONE_MAX);
 }
 function fmt(v,k){return k==='sacks'?String(Math.round(v*10)/10):Math.ceil(v).toLocaleString('en-US')}
 function milestoneText(m){return`${m.pos} ${m.name} needs ${fmt(m.need,m.stat)} ${m.label} for the ${m.kind} record${m.holder?` (${m.holder}${m.holderYear&&m.kind==='school season'?`, ${m.holderYear}`:''})`:''}: ${m.games===1?'one good game':'about two games'} at his pace.`}

 return{CHECKIN_EVERY,CHECKIN_SIZE,ANNIVERSARY_STEP,MILESTONE_GAMES,state,checkinDue,notability,alumniOf,pickCheckins,whereNow,checkin,memorable,anniversary,milestones,milestoneText,ordinal};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeLongMemory};
}else{
 const lmEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function lmCoachFor(playerId){
  for(const t of universe.teams||[])for(const c of Object.values(t.staff||{}))if(c?.formerPlayer?.id!=null&&String(c.formerPlayer.id)===String(playerId))return{role:String(c.role||'').toLowerCase()||null,school:t.name};
  return null;
 }
 function lmProCareer(p){
  const nfl=globalThis.DynastyNfl;if(!nfl||!p?.draftResult)return null;
  const r=nfl.recordFor(p.id)||p.draftResult;if(!(r.round||r.status==='UDFA'))return null;
  try{return nfl.careerAt(r,universe.year,universe.phase==='complete')}catch{return null}
 }
 const memory=makeLongMemory({getUniverse:()=>universe,production:p=>productionRating(p),proCareer:lmProCareer,coachFor:lmCoachFor,
  gamesDeferred:()=>typeof gamesAreDeferred==='function'&&gamesAreDeferred(),
  isRivalry:(g,t)=>{if(g.rivalry)return true;const r=typeof rivalOf==='function'?rivalOf(t):null;const other=String(g.home?.id)===String(t.id)?g.away:g.home;return!!r&&String(r.id??r)===String(other?.id)}});
 globalThis.DynastyLongMemory=memory;

 // The check-in runs once the season is archived.
 const offseasonReviewBeforeMemory=offseasonReview;
 offseasonReview=function offseasonReviewWithLongMemory(){
  const out=offseasonReviewBeforeMemory.apply(this,arguments);
  try{
   const me=selected(),c=me&&memory.checkin(me);
   if(c){universe.events??=[];universe.events.push({id:`EVT_WHERE_NOW_${c.year}`,type:'WHERE_NOW',season:universe.year,week:universe.week,schoolIds:[me.id],playerIds:c.rows.map(r=>r.playerId),coachIds:[],gameIds:[],importance:58,
    summary:`Where are they now? ${c.rows.map(r=>`${r.pos} ${r.name} (${r.left}): ${r.text}`).join('; ')}.`,metadata:{rows:c.rows}})}
  }catch(err){console.error(err)}
  return out;
 };

 // School career records, worked out with the storylines tally and kept for the week.
 let lmRecords={key:null,value:null};
 function lmSchoolCareer(t){
  const key=`${universe.year}:${universe.week}:${t.id}:${(universe.playerArchive||[]).length}`;
  if(lmRecords.key!==key){
   let value=null;
   try{if(typeof storylineSchoolRecords==='function'&&!(typeof archiveIsDeferred==='function'&&archiveIsDeferred()))value=storylineSchoolRecords()}catch(err){console.error(err)}
   lmRecords={key,value};
  }
  const r=lmRecords.value;if(!r)return null;
  return(playerId,k)=>{
   if(r.incomplete?.has(k))return null;
   const list=r.bySchool[`${t.name}|${k}`]||[],top=list.find(x=>String(x.id)!==String(playerId));if(!top)return null;
   return{total:r.totals.get(`${playerId}|${t.name}|${k}`)||0,value:top.value,holder:top.holder,id:top.id};
  };
 }
 function cardData(me){
  if(!me)return{ann:null,ms:[]};
  return{ann:memory.anniversary(me),ms:memory.milestones(me,{season:me.records,schoolCareer:lmSchoolCareer(me),nationalCareer:universe.records?.nationalCareer})};
 }
 memory.cardData=cardData;
 function renderLongMemory(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#longMemory');const me=universe?.teams&&universe.phase==='regular'?selected():null;
  const {ann,ms}=cardData(me);
  if(!ann&&!ms.length){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='longMemory';card.className='long-memory';card.setAttribute('role','region');card.setAttribute('aria-label','History this week');host.insertAdjacentElement('beforebegin',card)}
  card.innerHTML=(ann?`<div class="eyebrow">THIS WEEK IN HISTORY</div><p><strong>${ann.ago} years ago</strong> this week, ${lmEsc(ann.text)}.</p>`:'')+
   (ms.length?`<div class="eyebrow">MILESTONE WATCH</div><ul class="lm-list">${ms.map(m=>`<li><button type="button" class="player-button" data-player="${lmEsc(m.playerId)}">${lmEsc(m.pos)} ${lmEsc(m.name)}</button> ${lmEsc(memory.milestoneText(m).replace(`${m.pos} ${m.name} `,''))}</li>`).join('')}</ul>`:'');
  card.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));
 }
 extendRender('dashboard',renderLongMemory);
 // Test pages only: an anniversary and a milestone for the card.
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.longMemoryFixture=()=>{
  const t=selected(),rb=t.roster.find(p=>p.pos==='RB');const opp=universe.teams.find(x=>x.id!==t.id);
  universe.gameArchive.push({id:'G_LM_FIXTURE',season:universe.year-10,week:universe.week+1,label:'Regular season',final:true,home:{id:t.id,name:t.name,rank:null},away:{id:opp.id,name:opp.name,rank:2},score:{home:24,away:21}});
  rb.stats.games=Math.max(rb.stats.games||0,4);rb.stats.rushYds=Math.max(rb.stats.rushYds||0,520);t.records??={};t.records.rushYds={label:'Rushing Yards',value:rb.stats.rushYds+90,playerId:'old',playerName:'Old Legend',year:universe.year-6};
  render();return rb.name;
 };
}
