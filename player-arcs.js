// Player arcs (v0.15.1). The players you recruit become a story you can follow: how you won him (the hours,
// the pitch, the visit, who you beat), what he became (starter, honors, the draft) and how each class turned
// out. Everything is read from what the game already keeps (recruitingMemory, seasonHistory, awards,
// draftResult, transferHistory). The one addition is a short desk summary saved on the memory of recruits
// who sign with the controlled program, written when he commits.
function makePlayerArcSystem(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const starsText=n=>n?'★'.repeat(n):'Unrated';
 const MAJOR=/All-America|Heisman|Player of the Year|National/i,CONF=/All-Conference|Conference/i;

 // ---------- at signing ----------
 // A compact record of the work behind a commitment: hours, the most-pitched topic, visits, the offer
 // week and the program he chose you over. Null when the desk never touched him.
 function deskStory(r,t){
  const rec=r?.recruitingActions?.[String(t?.id)];
  if(!rec||rec.season!==universe().year)return null;
  const hist=Array.isArray(rec.history)?rec.history:[];
  // History keeps the last ten actions; the running total is kept beside it.
  const hours=Number.isFinite(rec.hours)?rec.hours:hist.reduce((n,x)=>n+(Number(x.cost)||0),0);
  const topics={};for(const x of hist)if(x.kind==='pitch'&&x.topic)topics[x.topic]=(topics[x.topic]||0)+1;
  const topic=Object.entries(topics).sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
  const f=r.funnel&&r.funnel.season===universe().year?r.funnel:null;
  const finalists=(f?.top3||f?.top5||[]).filter(n=>n!==t.name);
  const out={hours,topic,inHome:!!rec.inHome||hist.some(x=>x.kind==='inhome'),visit:hist.some(x=>x.kind==='visit'),
   offerWeek:rec.offerWeek??null,beat:finalists[0]||null,decisionWeek:f?.decisionWeek??null};
  return out.hours||out.offerWeek!=null||out.beat?out:null;
 }

 // ---------- one player ----------
 function signedLine(p){
  const m=p?.recruitingMemory;if(!m?.season)return null;
  const school=universe().teams.find(t=>t.id===m.schoolId)?.name||p.seasonHistory?.[0]?.team||null;
  let line=`Signed in ${m.season} as a ${starsText(m.stars)} ${p.pos}${m.homeRegion?` out of the ${m.homeRegion}`:''}${school?` with ${school}`:''}.`;
  const d=m.desk;
  if(d){
   const how=[d.inHome&&'an in-home visit',d.visit&&!d.inHome&&'a campus visit',d.topic&&`pitches on ${d.topic}`].filter(Boolean);
   const beat=d.beat?` over ${d.beat}`:'';
   if(how.length||beat)line+=` You won him${beat}${how.length?` with ${how.join(' and ')}`:''}${d.hours?` (${d.hours} hours)`:''}.`;
  }
  return line;
 }
 function seasonsStarted(p){return(p?.seasonHistory||[]).filter(s=>(s.starts||0)>=6)}
 // The best thing he became, as a short label and a rank used to sort a class.
 function peak(p){
  const awards=p?.awards||[];
  if(p?.draftResult?.round===1)return{rank:6,label:'First-round pick'};
  if(awards.some(a=>MAJOR.test(a.name)))return{rank:5,label:awards.find(a=>MAJOR.test(a.name)).name};
  if(p?.draftResult&&p.draftResult.round)return{rank:4,label:`Drafted, round ${p.draftResult.round}`};
  if(awards.some(a=>CONF.test(a.name)))return{rank:3,label:awards.find(a=>CONF.test(a.name)).name};
  const starts=seasonsStarted(p).length;
  if(starts)return{rank:2,label:`Starter, ${starts} season${starts===1?'':'s'}`};
  if((p?.career?.games||0)>0)return{rank:1,label:'Contributor'};
  return{rank:0,label:'Did not play'};
 }

 // ---------- a class ----------
 function allPlayers(){
  const u=universe(),out=[];
  for(const t of u.teams)for(const p of t.roster||[])out.push({p,active:true,team:t});
  for(const p of u.playerArchive||[])out.push({p,active:false,team:null});
  return out;
 }
 function classOf(t,season){
  return allPlayers().filter(x=>x.p.recruitingMemory?.schoolId===t.id&&x.p.recruitingMemory?.season===season);
 }
 function classSeasons(t){
  const seen=new Set();for(const x of allPlayers())if(x.p.recruitingMemory?.schoolId===t.id&&Number.isFinite(x.p.recruitingMemory.season))seen.add(x.p.recruitingMemory.season);
  return[...seen].sort((a,b)=>b-a);
 }
 function scoreOf(players){
  if(!players.length)return 0;
  let n=0;for(const p of players){const pk=peak(p).rank;n+=(pk>=2?2:0)+((p.awards||[]).length?3:0)+(p.draftResult?.round?3:0)}
  return n/players.length;
 }
 // Every program's class score for one signing year (programs that signed at least five).
 const leagueCache={key:null,scores:null};
 function leagueScores(season){
  const u=universe(),key=`${season}|${u.year}|${(u.playerArchive||[]).length}`;
  if(leagueCache.key===key)return leagueCache.scores;
  const by=new Map();
  for(const x of allPlayers()){const m=x.p.recruitingMemory;if(m?.season!==season||m.schoolId==null)continue;if(!by.has(m.schoolId))by.set(m.schoolId,[]);by.get(m.schoolId).push(x.p)}
  const scores=[...by.values()].filter(list=>list.length>=5).map(scoreOf);
  leagueCache.key=key;leagueCache.scores=scores;return scores;
 }
 function classReport(t,season){
  const rows=classOf(t,season);if(!rows.length)return null;
  const peaks=rows.map(x=>({...x,peak:peak(x.p),stars:x.p.recruitingMemory.stars||0}));
  const left=peaks.filter(x=>(x.p.transferHistory||[]).some(h=>h.fromSchool===t.name)).length;
  const stay=peaks.filter(x=>x.active&&x.team?.id===t.id).length;
  const starters=peaks.filter(x=>x.peak.rank>=2).length,honors=peaks.filter(x=>(x.p.awards||[]).length).length,drafted=peaks.filter(x=>x.p.draftResult?.round).length;
  const steals=peaks.filter(x=>x.stars<=3&&x.peak.rank>=3),misses=peaks.filter(x=>x.stars>=4&&x.peak.rank<=1&&!x.active);
  const years=universe().year-season;
  // Graded against every program's class from the same year (points for starters, honors and draft picks
  // per signee), and only once the class has had two years: A is the top 15%, then B, C, D, F.
  const score=scoreOf(peaks.map(x=>x.p));
  const pool=years<2?null:leagueScores(season),league=pool&&pool.length>=10?pool:null,beat=league?league.filter(x=>x<score).length/league.length:null;
  const grade=beat==null?null:beat>=.85?'A':beat>=.6?'B':beat>=.35?'C':beat>=.15?'D':'F';
  const best=peaks.slice().sort((a,b)=>b.peak.rank-a.peak.rank||b.stars-a.stars)[0];
  return{season,count:peaks.length,avgStars:peaks.reduce((n,x)=>n+x.stars,0)/peaks.length,stay,left,starters,honors,drafted,
   steals:steals.map(x=>({id:x.p.id,name:x.p.name,stars:x.stars,peak:x.peak.label})),misses:misses.map(x=>({id:x.p.id,name:x.p.name,stars:x.stars})),
   best:best?{id:best.p.id,name:best.p.name,pos:best.p.pos,stars:best.stars,peak:best.peak.label}:null,grade,years,score,
   percentile:beat==null?null:Math.round(beat*100),classes:league?.length||0};
 }

 // ---------- payoffs ----------
 // This season's honors for players the program recruited, told as the recruiting story they finish.
 function payoffs(t,year=universe().year){
  if(!t)return[];
  const out=[];
  for(const p of t.roster||[]){
   const m=p.recruitingMemory;if(m?.schoolId!==t.id)continue;
   const won=(p.awards||[]).filter(a=>a.year===year);if(!won.length)continue;
   const a=won.sort((x,y)=>(MAJOR.test(y.name)?1:0)-(MAJOR.test(x.name)?1:0))[0];
   const how=m.desk?.beat?` you beat ${m.desk.beat} for`:m.desk?.topic?` you pitched on ${m.desk.topic}`:' you signed';
   out.push({type:'good-news',tab:'roster',player:p.id,kicker:'PAYOFF',importance:MAJOR.test(a.name)?78:60,
    main:`${p.name}: ${a.name}`,sub:`The ${starsText(m.stars)} ${p.pos}${how} in ${m.season}.`});
  }
  return out.sort((a,b)=>b.importance-a.importance).slice(0,3);
 }

 return{deskStory,signedLine,peak,seasonsStarted,classOf,classSeasons,classReport,payoffs};
}

if(typeof module==='object'&&module.exports){
 module.exports={makePlayerArcSystem};
}else{
 const playerArcs=makePlayerArcSystem({getUniverse:()=>universe});
 globalThis.DynastyPlayerArcs=playerArcs;
 const paEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

 // The desk summary rides on the memory written at commit, for the controlled program only.
 const captureRecruitmentBeforeArcs=captureRecruitment;
 captureRecruitment=function(r,t){
  const m=captureRecruitmentBeforeArcs(r,t);
  if(m&&t&&t.name===$('#userTeam')?.value){const d=playerArcs.deskStory(r,t);if(d)m.desk=d}
  return m;
 };
 // Season-complete honors as This Week items.
 globalThis.DynastyPlayerArcNews=t=>universe.phase==='complete'&&universe.awards?.[universe.year]?playerArcs.payoffs(t):[];

 const careerChronologyBeforeArcs=careerChronologyHTML;
 careerChronologyHTML=function(p){
  const html=careerChronologyBeforeArcs(p),line=playerArcs.signedLine(p),pk=p?.recruitingMemory?playerArcs.peak(p):null;
  if(!line)return html;
  return`<div class="arc-story"><div class="eyebrow">PLAYER ARC</div><p>${paEsc(line)}</p>${pk&&pk.rank>0?`<p class="small muted">Became: <strong>${paEsc(pk.label)}</strong></p>`:''}</div>${html}`;
 };

 function classCardHTML(c){
  const stars=c.avgStars.toFixed(1);
  const steal=c.steals[0],miss=c.misses[0];
  return`<article class="arc-class">
   <div class="arc-class-head"><strong>Class of ${c.season}</strong>${c.grade?`<span class="arc-grade arc-grade--${c.grade}" title="Better than ${c.percentile}% of the ${c.classes} classes signed that year">${c.grade}</span>`:`<span class="small muted">${c.years<2?'Too early to grade':'Not enough classes to compare'}</span>`}</div>
   <div class="small muted">${c.count} signed · ${stars}★ average · ${c.stay} still here${c.left?` · ${c.left} transferred out`:''}</div>
   ${c.grade?`<div class="small muted">Better than ${c.percentile}% of that year's classes</div>`:''}
   <div class="arc-class-stats"><span><strong>${c.starters}</strong> starters</span><span><strong>${c.honors}</strong> honored</span><span><strong>${c.drafted}</strong> drafted</span></div>
   ${c.best&&c.best.peak!=='Did not play'?`<div class="small">Best: <button class="player-button" data-player="${paEsc(c.best.id)}">${paEsc(c.best.name)}</button> (${'★'.repeat(c.best.stars)||'Unrated'} ${paEsc(c.best.pos)}) — ${paEsc(c.best.peak)}</div>`:''}
   ${steal?`<div class="small">Steal: <button class="player-button" data-player="${paEsc(steal.id)}">${paEsc(steal.name)}</button>, a ${'★'.repeat(steal.stars)||'unrated'} recruit — ${paEsc(steal.peak)}</div>`:''}
   ${miss?`<div class="small muted">Miss: ${paEsc(miss.name)}, a ${'★'.repeat(miss.stars)} recruit who never played</div>`:''}
  </article>`;
 }
 function classesHTML(t){
  const seasons=playerArcs.classSeasons(t).slice(0,6),cards=seasons.map(s=>playerArcs.classReport(t,s)).filter(Boolean);
  if(!cards.length)return'';
  return`<section class="card arc-classes" id="arcClasses"><div class="eyebrow">RECRUITING CLASSES</div><h3>How your classes turned out</h3><div class="arc-class-grid">${cards.map(classCardHTML).join('')}</div></section>`;
 }
 // The Program view has no render-extension hook, so the class cards follow its own render.
 const renderProgramBeforeArcs=renderProgram;
 renderProgram=function(){
  renderProgramBeforeArcs();
  const t=selected(),host=$('#programHistory');if(!t||!host)return;
  $('#arcClasses')?.remove();
  const html=classesHTML(t);if(!html)return;
  host.closest?.('.two-col')?.insertAdjacentHTML?.('afterend',html);
  attachPlayerLinks();
 };
 // The tab map captured the original function when app.js ran.
 if(typeof TAB_RENDERERS==='object'&&TAB_RENDERERS)TAB_RENDERERS.program=renderProgram;
}
