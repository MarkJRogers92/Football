// Season moments read-only bridge. Engine extension: last-game highlights (from the stored play log),
// rivalry week status and the facts a season yearbook prints. Copies only; no writes, no randomness.
function momentsTeamName(t){return typeof t==='string'?t:t?.name}
function momentsTeamMatches(side,t){return side?.id!=null?String(side.id)===String(t.id):momentsTeamName(side)===t.name&&(universe.teams||[]).filter(x=>x.name===t.name).length===1}
function momentsGameSide(g,t){return momentsTeamMatches(g.home,t)?'home':momentsTeamMatches(g.away,t)?'away':null}
function momentsScores(g){const home=Array.isArray(g.score)?g.score[1]:g.score?.home,away=Array.isArray(g.score)?g.score[0]:g.score?.away;return [home,away].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)?{home,away}:null}
function momentsSchedule(t){return(t.schedule||[]).filter(g=>g&&(g.season==null||g.season===universe.year)&&momentsGameSide(g,t))}
function momentsLastFinal(t){
 const phase=universe.phase,week=universe.week||0;
 if(phase==='preseason')return null;
 const scheduled=momentsSchedule(t),max=phase==='regular'?week+1:phase==='confReady'?12:['bowlReady','playoffReady'].includes(phase)?13:17;
 const inTime=g=>Number.isInteger(g.week)&&g.week>0&&g.week<=max&&(phase!=='regular'||g.week<=week||scheduled.some(s=>s.week===g.week&&s.played&&s.gameId===g.id));
 let last=null;
 for(const g of universe.gameArchive||[])if(g&&g.season===universe.year&&g.final!==false&&momentsGameSide(g,t)&&momentsScores(g)&&inTime(g)&&(!last||g.week>=last.week))last=g;
 // The current schedule retains its final even while permanent box scores are deferred.
 for(const g of scheduled){
  const idYear=/^G(\d{4})_/.exec(g.gameId||'');
  if(!g.played||!momentsScores(g)||(idYear&&Number(idYear[1])!==universe.year))continue;
  const row={...g,id:g.gameId,season:universe.year,phase:'regular',label:'Regular season',scheduleOnly:true};
  if(inTime(row)&&(!last||row.week>last.week))last=row;
 }
 return last;
}
function momentsNextGame(t){
 if(['regular','preseason'].includes(universe.phase)){
  const g=momentsSchedule(t).filter(g=>!g.played&&g.week>universe.week).sort((a,b)=>a.week-b.week)[0];
  if(!g)return null;const side=momentsGameSide(g,t),opponent=g[side==='home'?'away':'home'];
  return{week:g.week,label:'Regular season',home:side==='home',opponent:momentsTeamName(opponent),opponentId:opponent?.id??(universe.teams||[]).find(x=>x.name===momentsTeamName(opponent))?.id??null};
 }
 // A frozen field records the opening playoff matchup. Later opponents depend on results.
 if(['bowlReady','playoffReady'].includes(universe.phase)&&!universe.playoffFieldUnavailable){
  const ids=universe.playoffFieldIds||[],i=ids.findIndex(id=>String(id)===String(t.id));
  if(ids.length===16&&new Set(ids.map(String)).size===16&&i>=0){const opp=(universe.teams||[]).find(x=>String(x.id)===String(ids[15-i]));if(opp)return{week:14,label:'Round of 16',home:null,opponent:opp.name,opponentId:opp.id}}
 }
 return null;
}
function momentsConsequence(g,side,t,outcome){
 if(outcome==='W'&&g.label==='National Championship')return'National champions.';
 if(outcome==='W'&&/ Championship$/.test(g.label||''))return`${g.label} won.`;
 if(outcome==='W'&&/ Bowl$/.test(g.label||''))return`${g.label} won.`;
 const before=/^(\d+)[-–](\d+)$/.exec(g[side]?.record||'');
 if(before&&outcome!=='T')return`Record after this game: ${Number(before[1])+(outcome==='W'?1:0)}–${Number(before[2])+(outcome==='L'?1:0)}.`;
 if(Number.isInteger(t.w)&&Number.isInteger(t.l)&&t.w>=0&&t.l>=0)return`Current season record: ${t.w}–${t.l}.`;
 return null;
}
function momentsActorName(a,g){if(!a)return null;for(const v of Object.values(a)){const id=typeof v==='object'?v?.id:v;if(id==null)continue;const p=[...(g.playerStats?.home||[]),...(g.playerStats?.away||[])].find(p=>String(p.id)===String(id));if(p?.name)return p.name}return null}
globalThis.DynastyLabOpenGame=(id,tab='Summary')=>showGameCenter(id,tab);
globalThis.DynastySeasonMoments=Object.freeze({
 highlights(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;
   const g=momentsLastFinal(u);if(!g)return null;const rows=universe.playLogs?.[g.id];
   const side=momentsGameSide(g,u),opp=side==='home'?'away':'home',names={home:momentsTeamName(g.home),away:momentsTeamName(g.away)};
   const score=momentsScores(g),us=score[side],them=score[opp],outcome=us>them?'W':us<them?'L':'T';
   const plays=[];
   let prevPlay=null;
   for(const r of rows||[]){
    const playSide=r.sd==='h'?'home':r.sd==='a'?'away':r.sd,who=names[playSide],clock=`Q${r.q||'?'} ${Math.floor((r.c||0)/60)}:${String((r.c||0)%60).padStart(2,'0')}`,actor=momentsActorName(r.a,g)||(r.t==='touchdown'&&prevPlay?.sd===r.sd?momentsActorName(prevPlay?.a,g):null);
    let weight=0,text='';
    if(r.t==='touchdown'){const p=prevPlay?.sd===r.sd?prevPlay:null;weight=60+Math.min(30,p?.y||0);text=`${p?.y>=5?`${p.y}-yard ${p.k==='p'?'touchdown pass':'touchdown run'}`:'Touchdown'} · ${who||''}${actor?` · ${actor}`:''}`}
    else if(r.t==='interception'||r.t==='fumble'){weight=48;text=`${r.t==='interception'?'Interception':'Fumble'} · ${who||''} turnover`}
    else if(r.t==='field_goal'&&r.m&&r.fd>=45){weight=40;text=`${r.fd}-yard field goal · ${who||''}`}
    else if(r.t==='scrimmage'&&(r.y||0)>=20){weight=20+r.y;text=`${r.y}-yard ${r.k==='p'?'pass':'run'} · ${who||''}${actor?` · ${actor}`:''}`}
    if(weight)plays.push({weight,text,clock,ours:playSide===side});
    if(r.t==='scrimmage')prevPlay=r;
   }
   for(let i=plays.length-1;i>0;i--)if(/touchdown/i.test(plays[i].text)&&/-yard (pass|run)/.test(plays[i-1].text)&&plays[i-1].clock===plays[i].clock)plays.splice(i-1,1);
   const top=plays.sort((a,b)=>(b.ours-a.ours)||(b.weight-a.weight)).slice(0,3);
   // Box-score performers exist for every game, simmed or played: the same impact weighting the season page uses.
   const impact=x=>{const t=x.stats||{};return(t.passYds||0)*.035+(t.passTD||0)*5-(t.int||0)*3+(t.rushYds||0)*.08+(t.rushTD||0)*5+(t.recYds||0)*.08+(t.recTD||0)*5+(t.tackles||0)*.8+(t.tfl||0)*1.6+(t.sacks||0)*3.5+(t.intDef||0)*4.5+(t.forcedFumbles||0)*3};
   const line=x=>{const t=x.stats||{},o=[];if(t.passYds)o.push(`${t.passYds} pass yd`);if(t.passTD)o.push(`${t.passTD} pass TD`);if(t.rushYds)o.push(`${t.rushYds} rush yd`);if(t.rushTD)o.push(`${t.rushTD} rush TD`);if(t.recYds)o.push(`${t.recYds} rec yd`);if(t.recTD)o.push(`${t.recTD} rec TD`);if(t.sacks)o.push(`${t.sacks} sack${t.sacks===1?'':'s'}`);if(t.intDef)o.push(`${t.intDef} INT`);if(t.tackles&&o.length<2)o.push(`${t.tackles} tackles`);return o.slice(0,3).join(' · ')};
   const performers=(g.playerStats?.[side]||[]).slice().sort((a,b)=>impact(b)-impact(a)).filter(x=>impact(x)>0&&x.name&&line(x)).slice(0,3).map(x=>{const f=typeof findPlayer==='function'?findPlayer(x.id):null;return{id:x.id,name:x.name,pos:x.pos||'',line:line(x),face:!!f?.p}});
   return{gameId:g.id,season:g.season,week:g.week,label:g.label||'Final',opponent:names[opp],outcome,won:outcome==='W',us,them,hasBoxScore:!g.scheduleOnly,hasReplay:!!rows?.length,plays:top,performers,firstStart:g.firstStart?.schoolId===u.id?g.firstStart.text:null,consequence:momentsConsequence(g,side,u,outcome)};
  }catch(e){return null}
 },
 weeklyRhythm(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;
   const next=momentsNextGame(u),phase=universe.phase,week=universe.week||0,current=momentsSchedule(u).find(g=>g.week===week+1),bye=phase==='regular'&&week<12&&!current;
   const requiredChoices=(universe.weeklyDecisions||[]).filter(d=>phase==='regular'&&d.season===universe.year&&d.week===week&&String(d.teamId)===String(u.id)&&!d.resolved&&d.type!=='WEEKLY_GAMEPLAN').length;
   const nextLabel=next?`${next.label==='Regular season'?`Week ${next.week}`:next.label} ${next.home===false?'at':'vs'} ${next.opponent}`:null;
   const offseasonLabel={review:'season review',departures:'player departures',signing:'the signing class',portal:'the transfer portal',spring:'spring development',fall:'fall camp',preseason:'the new season'}[universe.offseason?.phase]||'season review';
   const phaseLabel={preseason:'preseason setup',confReady:'conference championships',bowlReady:'bowl season',playoffReady:'the playoff',complete:offseasonLabel,offseason:'the offseason'}[phase];
   const resume=phase==='regular'&&current?.played?`the rest of Week ${week+1}`:nextLabel||phaseLabel||`Week ${week+1}`;
   const stop=phase==='regular'&&current?.played?`Game complete. Pick up with ${resume}.`:phase==='regular'&&week>0?`Week complete. Pick up with ${resume}.`:phase==='complete'?`Season complete. Pick up with ${resume}.`:['confReady','bowlReady','playoffReady'].includes(phase)?`Pick up with ${resume}.`:null;
   return{context:{slot:typeof activeSaveSlot==='undefined'?null:activeSaveSlot,year:universe.year,week:universe.week,programId:u.id,world:String(universe.rng?.seed??'')},next,bye,week:week+1,phase,requiredChoices,careerChoice:!!universe.jobOffers?.length,resume,stop};
  }catch(e){return null}
 },
 rivalryWeek(){
  try{
   if(!universe?.teams||universe.phase!=='regular')return null;const u=selected(),rival=rivalOf(u);if(!u||!rival)return null;
   const next=momentsNextGame(u);
   if(!next||String(next.opponentId)!==String(rival.id))return null;
   return{week:next.week,home:next.home,rival:{id:rival.id,name:rival.name},trophy:u.rivalry?.trophy||null,series:u.rivalry?.series?{w:u.rivalry.series.w||0,l:u.rivalry.series.l||0,streak:u.rivalry.series.streak||0}:null};
  }catch(e){return null}
 },
 yearbook(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;
   const done=['bowlReady','playoffReady','offseason','preseason'].includes(universe.phase)||universe.champion!=null||(u.schedule||[]).every(g=>g.played);
   const leaders=(u.roster||[]).filter(p=>(p.stats?.games||0)>0).map(p=>({p,s:seasonScore(p,u)})).sort((a,b)=>b.s-a.s).slice(0,5).map(x=>({id:x.p.id,name:x.p.name,pos:x.p.pos,line:globalThis.DynastyPlayerStories?.statLine?.(x.p)||''}));
   const awards=(universe.awards?.[universe.year]||projectedAwards()).filter(a=>a.team===u.name&&a.playerId).map(a=>({award:a.name,name:a.playerName,pos:a.pos}));
   const signed=(universe.recruits||[]).filter(r=>r.committed===u.name);
   const picks=(universe.draftHistory?.[universe.year]||[]).filter(d=>d.school===u.name&&d.status==='Drafted').map(d=>({name:d.playerName,pos:d.pos,label:d.label}));
   const stand=confStand(u.conference),place=stand.findIndex(t=>t.id===u.id)+1;
   const rival=rivalOf(u),meeting=rival&&(u.schedule||[]).find(g=>g.played&&(g.home===rival.name||g.away===rival.name));
   return{done,year:universe.year,team:{id:u.id,name:u.name,conference:u.conference,w:u.w||0,l:u.l||0,cw:u.cw||0,cl:u.cl||0,rank:u.rank&&u.rank<=25?u.rank:null,place:place||null},
    champ:universe.champion===u.name,confChamp:(universe.confChamps||[]).includes(u.id),bowl:u.bowlResult?.year===universe.year?u.bowlResult:null,
    rival:meeting?{name:rival.name,won:meeting.winner===u.name,trophy:u.rivalry?.trophy||null}:null,
    leaders,awards,signing:{count:signed.length,five:signed.filter(r=>r.stars>=5).length,four:signed.filter(r=>r.stars===4).length},picks,coach:u.staff?.HC?.name||''};
  }catch(e){return null}
 }
});
