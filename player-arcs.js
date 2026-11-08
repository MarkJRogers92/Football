// Player arcs (v0.15.1). The players you recruit become a story you can follow: how you won him (the hours,
// the pitch, the visit, who you beat), what he became (starter, honors, the draft) and how each class turned
// out. Signing memories and recorded game/season statistics supply the facts.
function makePlayerArcSystem(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const starsText=n=>n?'★'.repeat(n):'Unrated';
 const MAJOR=/All-America|Heisman|of the Year|National/i,CONF=/All-Conference|Conference/i;

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
 function seasonsStarted(p){
  const history=p.seasonHistory||[],year=p.retiredYear??universe().year;
  const started=history.filter(s=>s.starts>=6);
  if(p.stats?.starts>=6&&!history.some(s=>s.year===year))started.push({year,starts:p.stats.starts});
  return started;
 }
 function hasPlayed(p){return p.career?.games>0||p.career?.starts>0||p.stats?.games>0||p.stats?.starts>0||(p.seasonHistory||[]).some(s=>s.games>0||s.starts>0)}
 // The best thing he became, as a short label and a rank used to sort a class.
 function peak(p,starts=seasonsStarted(p).length){
  const awards=p?.awards||[];
  if(p?.draftResult?.round===1)return{rank:6,label:'First-round pick'};
  if(awards.some(a=>MAJOR.test(a.name)))return{rank:5,label:awards.find(a=>MAJOR.test(a.name)).name};
  if(p?.draftResult&&p.draftResult.round)return{rank:4,label:`Drafted, round ${p.draftResult.round}`};
  if(awards.some(a=>CONF.test(a.name)))return{rank:3,label:awards.find(a=>CONF.test(a.name)).name};
  if(starts)return{rank:2,label:`Starter, ${starts} season${starts===1?'':'s'}`};
  if(hasPlayed(p))return{rank:1,label:'Contributor'};
  return{rank:0,label:'Did not play'};
 }

 // ---------- a class ----------
 // Index once per render. During departures, portal entrants and draft prospects temporarily
 // live outside both rosters and the archive; the draft report can outlive the move to the archive.
 function classIndex(){
  const u=universe(),years=new Map(),seen=new Set();
  function add(p,active,team=null){
   const m=p?.recruitingMemory;
   if(!Number.isFinite(m?.season)||m.schoolId==null||seen.has(p.id))return;
   seen.add(p.id);
   if(!years.has(m.season))years.set(m.season,new Map());
   const schools=years.get(m.season);
   if(!schools.has(m.schoolId))schools.set(m.schoolId,[]);
   schools.get(m.schoolId).push({p,active,team});
  }
  for(const t of u.teams)for(const p of t.roster||[])add(p,true,t);
  for(const p of u.playerArchive||[])add(p,false);
  for(const x of u.transferPortal||[])add(x.p,true);
  for(const x of u.offseason?.reports?.departures?.draftPool||[])add(x.p,true);
  return years;
 }
 function classOf(t,season,index=classIndex()){return index.get(season)?.get(t.id)||[]}
 function classSeasons(t,index=classIndex()){return [...index.keys()].filter(y=>index.get(y).has(t.id)).sort((a,b)=>b-a)}
 function outcomePoints(p,starts=seasonsStarted(p).length){
  return (starts?2:0)+(p.awards?.length?3:0)+(p.draftResult?.round?3:0);
 }
 function classReport(t,season,index=classIndex()){
  const rows=classOf(t,season,index);if(!rows.length)return null;
  const peaks=rows.map(x=>{const starts=seasonsStarted(x.p).length;return{...x,starts,peak:peak(x.p,starts),stars:x.p.recruitingMemory.stars||0}});
  const left=peaks.filter(x=>(x.p.transferHistory||[]).some(h=>h.fromSchoolId!=null?h.fromSchoolId===t.id:h.fromSchool===t.name)).length;
  const stay=peaks.filter(x=>x.active&&x.team?.id===t.id).length;
  const starters=peaks.filter(x=>x.starts>0).length,honors=peaks.filter(x=>x.p.awards?.length).length,drafted=peaks.filter(x=>x.p.draftResult?.round).length;
  const steals=peaks.filter(x=>x.stars>0&&x.stars<=3&&x.peak.rank>=3),misses=peaks.filter(x=>x.stars>=4&&x.peak.rank===0&&!x.active);
  const years=universe().year-season,score=peaks.reduce((n,x)=>n+outcomePoints(x.p,x.starts),0)/peaks.length;
  // Compare eligible classes from the same year. Tied classes split the percentile positions they occupy.
  const peers=[];
  if(years>=2&&rows.length>=5)for(const [school,list] of index.get(season)){
   if(school!==t.id&&list.length>=5)peers.push(list.reduce((n,x)=>n+outcomePoints(x.p),0)/list.length);
  }
  const percentile=peers.length>=9?peers.reduce((n,x)=>n+(x<score?1:(x===score?0.5:0)),0)/peers.length:null;
  const grade=percentile==null?null:percentile>=.85?'A':percentile>=.6?'B':percentile>=.35?'C':percentile>=.15?'D':'F';
  const best=peaks.slice().sort((a,b)=>b.peak.rank-a.peak.rank||b.stars-a.stars)[0];
  return{season,count:peaks.length,avgStars:peaks.reduce((n,x)=>n+x.stars,0)/peaks.length,stay,left,starters,honors,drafted,
   steals:steals.map(x=>({id:x.p.id,name:x.p.name,stars:x.stars,peak:x.peak.label})),misses:misses.map(x=>({id:x.p.id,name:x.p.name,stars:x.stars})),
   best:best?{id:best.p.id,name:best.p.name,pos:best.p.pos,stars:best.stars,peak:best.peak.label}:null,grade,years,score,
   percentile:percentile==null?null:Math.round(percentile*100),classes:percentile==null?0:peers.length+1};
 }

 // ---------- payoffs ----------
 // Called at the final whistle, after the engine applies this game's recorded player deltas.
 function firstStart(t,lines){
  const started=new Set(lines.filter(x=>x.stats?.starts===1).map(x=>x.id));
  const candidates=(t.roster||[]).filter(p=>{
   const m=p.recruitingMemory;
   return m?.schoolId===t.id&&Number.isFinite(m.season)&&started.has(p.id)&&p.stats?.starts===1&&
    (p.career?.starts??0)===0&&!(p.seasonHistory||[]).some(s=>s.starts>0);
  });
  // If multiple signees debut together, feature the recruitment the desk spent the most time on.
  const p=candidates.sort((a,b)=>(b.recruitingMemory.desk?.hours||0)-(a.recruitingMemory.desk?.hours||0))[0];
  if(!p)return null;
  const m=p.recruitingMemory,d=m.desk;
  const detail=d?.beat?` over ${d.beat}`:d?.topic?` after pitching him on ${d.topic}`:'';
  return{schoolId:t.id,playerId:p.id,text:`${p.name} made his first college start. ${t.name} signed the ${m.stars?`${m.stars}-star `:''}${p.pos} in ${m.season}${detail}.`};
 }
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

 return{deskStory,signedLine,peak,seasonsStarted,firstStart,classIndex,classOf,classSeasons,classReport,payoffs};
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
   <div class="arc-class-head"><strong>Class of ${c.season}</strong>${c.grade?`<span class="arc-grade arc-grade--${c.grade}" title="League percentile among ${c.classes} classes, with ties sharing a rank">${c.grade}</span>`:`<span class="small muted">${c.years<2?'Too early to grade':c.count<5?'Five signees needed to grade':'Not enough classes to compare'}</span>`}</div>
   <div class="small muted">${c.count} signed · ${stars}★ average · ${c.stay} still here${c.left?` · ${c.left} transferred out`:''}</div>
   ${c.grade?`<div class="small muted">League percentile: ${c.percentile} · ${c.classes} classes</div>`:''}
   <div class="arc-class-stats"><span><strong>${c.starters}</strong> starters</span><span><strong>${c.honors}</strong> honored</span><span><strong>${c.drafted}</strong> drafted</span></div>
   ${c.best&&c.best.peak!=='Did not play'?`<div class="small">Best: <button class="player-button" data-player="${paEsc(c.best.id)}">${paEsc(c.best.name)}</button> (${'★'.repeat(c.best.stars)||'Unrated'} ${paEsc(c.best.pos)}) — ${paEsc(c.best.peak)}</div>`:''}
   ${steal?`<div class="small">Steal: <button class="player-button" data-player="${paEsc(steal.id)}">${paEsc(steal.name)}</button>, a ${'★'.repeat(steal.stars)||'unrated'} recruit — ${paEsc(steal.peak)}</div>`:''}
   ${miss?`<div class="small muted">Miss: ${paEsc(miss.name)}, a ${'★'.repeat(miss.stars)} recruit who never played</div>`:''}
  </article>`;
 }
 function classesHTML(t){
  const index=playerArcs.classIndex(),seasons=playerArcs.classSeasons(t,index).slice(0,6),cards=seasons.map(s=>playerArcs.classReport(t,s,index)).filter(Boolean);
  if(!cards.length)return'';
  return`<section class="card arc-classes" id="arcClasses"><div class="eyebrow">RECRUITING CLASSES</div><h3>How your classes turned out</h3><div class="arc-class-grid">${cards.map(classCardHTML).join('')}</div></section>`;
 }
 // The Program view has no render-extension hook, so the class cards follow its own render.
 const renderProgramBeforeArcs=renderProgram;
 let classRequest=0;
 renderProgram=function(){
  renderProgramBeforeArcs();
  const request=++classRequest,t=selected(),world=universe,host=$('#programHistory')?.closest?.('.two-col');
  $('#arcClasses')?.remove();
  if(!t||!host)return;
  function showClasses(){
   const html=classesHTML(t);if(!html)return;
   host.insertAdjacentHTML('afterend',html);attachPlayerLinks();
  }
  if(!archiveIsDeferred()){showClasses();return}
  host.insertAdjacentHTML('afterend','<section class="card" id="arcClasses" role="status">Loading recruiting classes…</section>');
  const current=()=>request===classRequest&&universe===world&&selected()===t&&activeTab==='program';
  ensureArchiveLoaded().then(()=>{
   if(!current())return;
   if(archiveIsDeferred()){renderProgram();return} // A save can replace the archive reference during the read.
   $('#arcClasses')?.remove();showClasses();
  }).catch(()=>{if(current())$('#arcClasses').textContent='Recruiting classes could not be loaded. Reopen Program to retry.'});
 };
 // The tab map captured the original function when app.js ran.
 if(typeof TAB_RENDERERS==='object'&&TAB_RENDERERS)TAB_RENDERERS.program=renderProgram;
}
