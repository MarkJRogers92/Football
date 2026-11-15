// v0.34 — the trophy case. One Program page section with everything the program has won since the dynasty began:
// national and conference titles, bowl wins, the rivalry trophy (and who has it now), national awards won by its
// players, Coach of the Year, and alumni in the Pro Football Hall of Fame. Empty shelves stay visible, so the case
// shows what is still to win.
//
// Nothing is stored. Each shelf reads a record the game already keeps: the season archive (national titles), head
// coaches' season rows (conference titles and Coach of the Year), BOWL_RESULT events, the rivalry series, the awards
// table and the pro pipeline.
function makeTrophyCase(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const same=(a,b)=>a!=null&&b!=null&&String(a)===String(b);
 const years=list=>[...new Set(list)].sort((a,b)=>b-a);
 function headCoachSeasons(t){
  const u=universe(),rows=[],seen=new Set();
  const coaches=[...(u.teams||[]).flatMap(x=>Object.values(x.staff||{})),...(u.coachArchive||[])];
  for(const c of coaches)for(const s of c?.seasons||[]){if(s.role!=='Head Coach'||!same(s.schoolId,t.id))continue;const k=`${c.id}|${s.year}`;if(seen.has(k))continue;seen.add(k);rows.push({...s,coach:c.name})}
  return rows;
 }
 function national(t){return years((universe().history||[]).filter(h=>h.type==='season'&&(same(h.championId,t.id)||(h.championId==null&&h.champion===t.name))).map(h=>h.year))}
 function conference(t,hc){
  const ys=years(hc.filter(s=>s.conferenceTitle).map(s=>s.year));
  // Seasons before coaches kept season rows still count in the program's all-time record.
  const total=Math.max(ys.length,Number(t.allTimeRecord?.confTitles)||0);
  return{years:ys,total};
 }
 function bowls(t){return(universe().events||[]).filter(e=>e?.type==='BOWL_RESULT'&&same(e.metadata?.winnerId,t.id)).map(e=>({year:e.season,label:e.metadata?.label||'Bowl'})).sort((a,b)=>b.year-a.year)}
 function awards(t){
  const out=[];
  for(const [y,list] of Object.entries(universe().awards||{}))for(const a of list||[])if(a&&a.team===t.name&&a.playerName)out.push({year:Number(y),name:a.name,player:a.playerName,pos:a.pos,playerId:a.playerId});
  return out.sort((a,b)=>b.year-a.year||a.name.localeCompare(b.name));
 }
 function rivalry(t){
  const r=t.rivalry;if(!r?.rivalId&&r?.rivalId!==0)return null;
  const rival=(universe().teams||[]).find(x=>same(x.id,r.rivalId)),s=r.series||{};
  return{trophy:r.trophy||'Rivalry trophy',rival:rival?.name||'Rival',held:same(s.holderId,t.id),played:(s.w||0)+(s.l||0)>0,w:s.w||0,l:s.l||0,lastYear:s.lastYear||null};
 }
 function proHall(t){
  const N=env.nfl?.();if(!N)return[];
  return(N.school(t.name).top||[]).map(x=>x.c).filter(c=>c?.hof).map(c=>({name:c.name,pos:c.pos,draftYear:c.draftYear}));
 }
 function read(t){
  if(!t)return null;
  const hc=headCoachSeasons(t);
  return{national:national(t),conference:conference(t,hc),bowls:bowls(t),awards:awards(t),coachOfYear:years(hc.filter(s=>s.coachOfYear).map(s=>s.year)),rivalry:rivalry(t),proHall:proHall(t)};
 }
 return{read};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeTrophyCase};
}else{
 const trophies=makeTrophyCase({getUniverse:()=>universe,nfl:()=>globalThis.DynastyNfl});
 globalThis.DynastyTrophyCase=trophies;
 const tcEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const yearList=ys=>ys.length?ys.map(tcEsc).join(', '):'';
 function trophyCaseHTML(t){
  const c=trophies.read(t),r=c.rivalry;
  const shelf=(label,count,detail,key)=>`<div class="tc-shelf${count?'':' is-empty'}" data-tc="${key}"><span class="small muted">${tcEsc(label)}</span><strong>${count}</strong><small>${detail||'Still to win'}</small></div>`;
  const awardRows=c.awards.slice(0,10).map(a=>`<li><span class="stop-who">${a.playerId?`<button type="button" class="player-button" data-player="${tcEsc(a.playerId)}">${tcEsc(a.pos)} ${tcEsc(a.player)}</button>`:`${tcEsc(a.pos)} ${tcEsc(a.player)}`}<small>${tcEsc(a.year)} ${tcEsc(a.name)}</small></span></li>`).join('');
  const bowlText=c.bowls.slice(0,6).map(b=>`${b.year} ${b.label}`).join(', ')+(c.bowls.length>6?`, and ${c.bowls.length-6} more`:'');
  const rivalText=r?(r.held?`On campus. ${r.w}-${r.l} in the series.`:r.played?`Held by ${r.rival}. ${r.w}-${r.l} in the series.`:`Not yet played for against ${r.rival}.`):'';
  const total=c.national.length+c.conference.total+c.bowls.length+c.awards.length+c.coachOfYear.length+c.proHall.length+(r?.held?1:0);
  return`<div class="section-head has-art">${globalThis.DynastyArt?.img('championship-ring','dl-art dl-art-head')||''}<div><div class="eyebrow">TROPHY CASE</div><h3>${total?`${total} piece${total===1?'':'s'} of hardware`:'An empty case, for now'}</h3><div class="muted">Everything ${tcEsc(t.name)} has won since the dynasty began.</div></div></div>
  <div class="tc-shelves">
   ${shelf('National titles',c.national.length,yearList(c.national),'national')}
   ${shelf('Conference titles',c.conference.total,yearList(c.conference.years)||(c.conference.total?'Before coaches\' records were kept':''),'conference')}
   ${shelf('Bowl wins',c.bowls.length,bowlText,'bowls')}
   ${r?`<div class="tc-shelf${r.held?'':' is-empty'}" data-tc="rivalry"><span class="small muted">${tcEsc(r.trophy)}</span><strong>${r.held?'Home':r.played?'Away':'—'}</strong><small>${tcEsc(rivalText)}</small></div>`:''}
   ${shelf('Coach of the Year',c.coachOfYear.length,yearList(c.coachOfYear),'coy')}
   ${shelf('Pro Hall of Fame',c.proHall.length,c.proHall.map(h=>`${h.pos} ${h.name}`).map(tcEsc).join(', '),'prohall')}
  </div>
  <h4>National awards</h4>${awardRows?`<ul class="stop-rows">${awardRows}</ul>${c.awards.length>10?`<p class="small muted">And ${c.awards.length-10} more.</p>`:''}`:'<p class="small muted">No national award winners yet.</p>'}`;
 }
 function renderTrophyCase(){
  if(!universe?.teams)return;const t=selected();if(!t)return;
  let host=$('#trophyCase');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.getElementById){
   const anchor=document.getElementById('coachRivals')||document.getElementById('proPipeline')||document.getElementById('conferenceOutlook');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='trophyCase';host.className='card trophy-case-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(!host)return;host.innerHTML=trophyCaseHTML(t);
  host.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));
 }
 const renderProgramBeforeTrophies=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeTrophies();renderTrophyCase()};
}
