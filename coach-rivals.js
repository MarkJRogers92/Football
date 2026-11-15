// v0.34 — coaching rivals. The game already knows every head coach you have faced; now it says so. Your record
// against each opposing head coach is kept across schools, and two of them earn a name:
//
//   Nemesis       the coach you cannot beat: at least three meetings, at least three losses, winning no more than a
//                 third of them. If two qualify, the one with more losses (then the more recent) is the nemesis.
//   Favourite     the coach you always beat: at least three meetings and three wins, losing no more than a quarter.
//
// Before you face a coach you have met before, This Week says how it has gone; the Program page lists the coaches
// you have faced most. A coach is followed by his id, so the record carries over when he changes jobs, and so does
// yours when you change schools.
//
// State: universe.coachRivals {v, rows}. One small row per game you coach (about 1 KB a season), written as each game
// finishes and replaced if the same game is played again after a rollback. Older saves are backfilled once from the
// game archive, finding who was head coach of each opponent that season from the coaches' career records.
function makeCoachRivals(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const NEMESIS={meetings:3,losses:3,maxPct:1/3},FAVOURITE={meetings:3,wins:3,minPct:.75},LIST=6,VERSION=1;
 // Row: [gameId, season, week, coachId, coachName, oppSchoolId, oppSchool, us, them, mySchool]
 const rowObj=r=>({gameId:r[0],season:r[1],week:r[2],coachId:r[3],coachName:r[4],oppId:r[5],opp:r[6],us:r[7],them:r[8],mine:r[9],won:r[7]>r[8]});
 function state(){const u=universe();const s=u.coachRivals??={v:0,rows:[]};if(!Array.isArray(s.rows))s.rows=[];return s}
 function allCoaches(){const u=universe(),out=[];for(const t of u.teams||[])for(const c of Object.values(t.staff||{}))if(c)out.push(c);for(const c of u.coachArchive||[])if(c)out.push(c);return out}
 // Who was head coach at a school in a season, from the career stints every coach keeps.
 function headCoachAt(schoolId,season){
  let best=null;
  for(const c of allCoaches())for(const st of c.careerHistory||[]){
   if(st.role!=='Head Coach'||String(st.schoolId)!==String(schoolId))continue;
   const end=st.endSeason==null?Infinity:st.endSeason;
   if(season>=st.startSeason&&season<=end&&(!best||st.startSeason>best.start))best={id:c.id,name:c.name,start:st.startSeason};
  }
  return best;
 }
 // The coach's head coaching posts by school name and season range.
 function posts(){
  const u=universe(),out=(u.careerHistory||[]).map(p=>({school:p.school,from:p.startYear,to:p.endYear}));
  if(u.tenure&&!u.tenure.closed)out.push({school:u.tenure.school,from:u.tenure.startYear,to:Infinity});
  // A first season can begin before the tenure record exists: the current program is the only post so far.
  else if(!u.tenure){const me=env.selected?.();if(me)out.push({school:me.name,from:-Infinity,to:Infinity})}
  return out;
 }
 function mySideOf(g,list=posts()){
  for(const side of ['home','away']){const name=g?.[side]?.name;if(name&&list.some(p=>p.school===name&&g.season>=p.from&&g.season<=p.to))return side}
  return null;
 }
 function upsert(row){const s=state(),i=s.rows.findIndex(r=>r[0]===row[0]);if(i>=0)s.rows[i]=row;else s.rows.push(row);cache=null}
 // A finished game: who coached the other side, and the score from your side.
 function record(game,me,opp,coach){
  if(!game?.id||!game.score||!me||!opp)return null;
  const side=game.home?.id===me.id?'home':game.away?.id===me.id?'away':null;if(!side)return null;
  const other=side==='home'?'away':'home';
  const c=coach||headCoachAt(opp.id,game.season);if(!c?.id)return null;
  const row=[game.id,game.season,game.week,c.id,c.name,opp.id,opp.name,Number(game.score[side])||0,Number(game.score[other])||0,me.name];
  upsert(row);return rowObj(row);
 }
 // Older saves: rebuild from whatever part of the game archive is loaded, once.
 function backfill(){
  const s=state();if(s.v>=VERSION)return false;
  const u=universe(),list=posts(),teams=new Map((u.teams||[]).map(t=>[String(t.id),t]));
  for(const g of u.gameArchive||[]){
   if(!g?.final||!g.score)continue;const side=mySideOf(g,list);if(!side)continue;
   const other=side==='home'?'away':'home',oppId=g[other]?.id,c=headCoachAt(oppId,g.season);if(!c)continue;
   if(s.rows.some(r=>r[0]===g.id))continue;
   s.rows.push([g.id,g.season,g.week,c.id,c.name,oppId,teams.get(String(oppId))?.name||g[other].name,Number(g.score[side])||0,Number(g.score[other])||0,g[side].name]);
  }
  s.v=VERSION;cache=null;return true;
 }
 let cache=null;
 function series(){
  const s=state();if(cache&&cache.n===s.rows.length&&cache.rows===s.rows)return cache.list;
  const by=new Map();
  for(const r of s.rows.map(rowObj).sort((a,b)=>a.season-b.season||a.week-b.week)){
   let x=by.get(r.coachId);if(!x){x={coachId:r.coachId,name:r.coachName,w:0,l:0,t:0,games:[]};by.set(r.coachId,x)}
   if(r.us>r.them)x.w++;else if(r.us<r.them)x.l++;else x.t++;x.games.push(r);x.name=r.coachName;
  }
  const list=[...by.values()].map(x=>{const n=x.w+x.l+x.t;return{...x,meetings:n,pct:n?x.w/n:0,last:x.games.at(-1),streak:streakOf(x.games)}});
  cache={n:s.rows.length,rows:s.rows,list};return list;
 }
 function streakOf(games){let k=0,kind=null;for(let i=games.length-1;i>=0;i--){const g=games[i],w=g.us>g.them?'W':g.us<g.them?'L':'T';if(kind&&w!==kind)break;kind=w;k++}return kind?{kind,count:k}:null}
 const recent=(a,b)=>(b.last?.season||0)-(a.last?.season||0)||(b.last?.week||0)-(a.last?.week||0);
 function nemesis(){return series().filter(x=>x.meetings>=NEMESIS.meetings&&x.l>=NEMESIS.losses&&x.pct<=NEMESIS.maxPct).sort((a,b)=>b.l-a.l||recent(a,b))[0]||null}
 function favourite(){const n=nemesis();return series().filter(x=>x!==n&&x.meetings>=FAVOURITE.meetings&&x.w>=FAVOURITE.wins&&(x.l/x.meetings)<=1-FAVOURITE.minPct).sort((a,b)=>b.w-a.w||recent(a,b))[0]||null}
 function against(coachId){return series().find(x=>x.coachId===coachId)||null}
 function mostFaced(n=LIST){return series().slice().sort((a,b)=>b.meetings-a.meetings||recent(a,b)).slice(0,n)}
 function tag(x){if(!x)return null;const n=nemesis(),f=favourite();return n&&n.coachId===x.coachId?'Nemesis':f&&f.coachId===x.coachId?'Favourite opponent':null}
 return{NEMESIS,FAVOURITE,VERSION,state,headCoachAt,posts,record,backfill,series,nemesis,favourite,against,mostFaced,tag,clearCache:()=>{cache=null}};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeCoachRivals};
}else{
 const rivals=makeCoachRivals({getUniverse:()=>universe,selected:()=>selected()});
 globalThis.DynastyCoachRivals=rivals;
 const crEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const ready=()=>{if(!universe?.teams)return false;try{rivals.backfill()}catch(err){console.error(err)}return true};

 // Every finished game the coach's program plays is recorded against the other side's head coach at kickoff.
 const finishGameBeforeRivals=finishGame;
 finishGame=function finishGameWithRivals(before,home,away){
  const out=finishGameBeforeRivals.apply(this,arguments);
  try{
   const me=selected();
   if(me&&(home===me||away===me)&&out?.gameId){
    ready();const opp=home===me?away:home,hc=opp.staff?.HC;
    const g=(universe.gameArchive||[]).at(-1);
    if(g?.id===out.gameId)rivals.record(g,me,opp,hc?.id?{id:hc.id,name:hc.name}:null);
   }
  }catch(err){console.error(err)}
  return out;
 };

 const scoreText=g=>`${g.won?'W':g.us<g.them?'L':'T'} ${g.us}-${g.them}`;
 const recordText=x=>`${x.w}-${x.l}${x.t?`-${x.t}`:''}`;
 // This week's opponent's head coach, if you have met him before.
 function rivalsThisWeek(){
  const me=selected();if(!me||universe.phase!=='regular')return null;
  const g=(universe.schedule?.[universe.week]||[]).find(x=>!x.played&&(x.home===me.name||x.away===me.name));if(!g)return null;
  const opp=universe.teams.find(t=>t.name===(g.home===me.name?g.away:g.home)),hc=opp?.staff?.HC;if(!hc?.id)return null;
  const x=rivals.against(hc.id);return x?{x,opp,hc,tag:rivals.tag(x)}:null;
 }
 function renderRivalsWeekCard(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#coachRivalWeek');const info=ready()?rivalsThisWeek():null;
  if(!info){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='coachRivalWeek';card.className='coach-rival-week';card.setAttribute('role','region');card.setAttribute('aria-label','Head-to-head');host.insertAdjacentElement('beforebegin',card)}
  const {x,opp,hc,tag}=info,last=x.last,moved=last&&last.oppId!=null&&String(last.oppId)!==String(opp.id);
  const lead=tag==='Nemesis'?`${crEsc(hc.name)} is your nemesis.`:tag?`${crEsc(hc.name)} is your favourite opponent.`:`You have faced ${crEsc(hc.name)} before.`;
  card.innerHTML=`<div class="eyebrow">HEAD TO HEAD${tag?` · ${crEsc(tag.toUpperCase())}`:''}</div><p><strong>${lead}</strong> You are ${recordText(x)} against him${x.streak&&x.streak.count>=2?` (${x.streak.count} straight ${x.streak.kind==='W'?'wins':x.streak.kind==='L'?'losses':'ties'})`:''}. Last meeting: ${scoreText(last)} in ${last.season}${moved?`, when he coached ${crEsc(last.opp)}`:''}${last.mine!==selected().name?` and you coached ${crEsc(last.mine)}`:''}.</p>`;
 }
 extendRender('dashboard',renderRivalsWeekCard);

 function rivalsCardHTML(){
  const list=rivals.mostFaced(),n=rivals.nemesis(),f=rivals.favourite();
  const coachNow=id=>{for(const t of universe.teams)if(t.staff?.HC?.id===id)return t.name;return null};
  const row=x=>{const now=coachNow(x.coachId),tag=rivals.tag(x);return`<li><span class="stop-who">${crEsc(x.name)} ${tag?`<span class="lr-tag">${crEsc(tag)}</span>`:''}<small>${recordText(x)} in ${x.meetings} meeting${x.meetings===1?'':'s'} · last ${scoreText(x.last)} in ${x.last.season} · ${now?`now head coach at ${crEsc(now)}`:'no longer a head coach'}</small></span></li>`};
  const head=n?`${crEsc(n.name)} has your number: ${recordText(n)}.`:f?`You own ${crEsc(f.name)}: ${recordText(f)}.`:list.length?'No nemesis yet.':'No opposing head coach faced yet.';
  return`<div class="section-head"><div><div class="eyebrow">COACHING RIVALS</div><h3>${head}</h3><div class="muted">Your record against each head coach you have faced, at every school either of you has coached. A nemesis takes three meetings and three losses with no more than a third won; a favourite opponent takes three wins and no more than a quarter lost.</div></div></div>${list.length?`<ul class="stop-rows">${list.map(row).join('')}</ul>`:'<p class="small muted">Head coaches you face appear here after your first game.</p>'}`;
 }
 function renderRivalsCard(){
  if(!ready())return;
  let host=$('#coachRivals');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.getElementById){
   const anchor=document.getElementById('proPipeline')||document.getElementById('conferenceOutlook')||document.getElementById('facilitiesBoosters');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='coachRivals';host.className='card coach-rivals-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(host)host.innerHTML=rivalsCardHTML();
 }
 const renderProgramBeforeRivals=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeRivals();renderRivalsCard()};
 if(typeof window!=='undefined'&&window.__DL_TEST__){
  window.__DL_TEST__.coachRivals=()=>({rows:rivals.state().rows.length,nemesis:rivals.nemesis()?.name||null,favourite:rivals.favourite()?.name||null});
  // Three earlier losses to this week's opposing head coach (test pages only).
  window.__DL_TEST__.coachRivalsFixture=()=>{
   ready();const me=selected(),g=(universe.schedule?.[universe.week]||[]).find(x=>x.home===me.name||x.away===me.name);
   const opp=universe.teams.find(t=>t.name===(g.home===me.name?g.away:g.home)),hc=opp.staff.HC;
   for(let i=1;i<=3;i++)rivals.record({id:`FIX_${i}`,season:universe.year-i,week:2,home:{id:me.id,name:me.name},away:{id:opp.id,name:opp.name},score:{home:10+i,away:24}},me,opp,{id:hc.id,name:hc.name});
   render();return hc.name;
  };
 }
}
