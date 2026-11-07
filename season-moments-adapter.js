// Season moments read-only bridge. Engine extension: last-game highlights (from the stored play log),
// rivalry week status and the facts a season yearbook prints. Copies only; no writes, no randomness.
function momentsGameSide(g,name){const h=typeof g.home==='string'?g.home:g.home?.name;return h===name?'home':'away'}
function momentsActorName(a){if(!a)return null;for(const v of Object.values(a)){const id=typeof v==='object'?v?.id:v;const f=id!=null&&findPlayer(id);if(f?.p)return f.p.name}return null}
globalThis.DynastyLabOpenGame=(id,tab='Summary')=>showGameCenter(id,tab);
globalThis.DynastySeasonMoments=Object.freeze({
 highlights(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;
   const games=(universe.gameArchive||[]).filter(g=>{const h=typeof g.home==='string'?g.home:g.home?.name,a=typeof g.away==='string'?g.away:g.away?.name;return h===u.name||a===u.name}).sort((a,b)=>((b.season??universe.year)-(a.season??universe.year))||((b.week||0)-(a.week||0)));
   const g=games[0];if(!g)return null;const rows=universe.playLogs?.[g.id];
   const side=momentsGameSide(g,u.name),opp=side==='home'?'away':'home',names={home:typeof g.home==='string'?g.home:g.home?.name,away:typeof g.away==='string'?g.away:g.away?.name};
   const us=Number(g.score?.[side]??(Array.isArray(g.score)?g.score[side==='home'?1:0]:0))||0,them=Number(g.score?.[opp]??(Array.isArray(g.score)?g.score[opp==='home'?1:0]:0))||0;
   const plays=[];
   let prevPlay=null;
   for(const r of rows||[]){
    const who=r.sd?names[r.sd]:null,clock=`Q${r.q||'?'} ${Math.floor((r.c||0)/60)}:${String((r.c||0)%60).padStart(2,'0')}`,actor=momentsActorName(r.a)||(r.t==='touchdown'?momentsActorName(prevPlay?.a):null);
    let weight=0,text='';
    if(r.t==='touchdown'){weight=60+Math.min(30,prevPlay?.y||0);text=`${prevPlay?.y>=5?`${prevPlay.y}-yard ${prevPlay.k==='p'?'touchdown pass':'touchdown run'}`:'Touchdown'} · ${who||''}${actor?` · ${actor}`:''}`}
    else if(r.t==='interception'||r.t==='fumble'){weight=48;text=`${r.t==='interception'?'Interception':'Fumble'} · ${who||''} turnover`}
    else if(r.t==='field_goal'&&r.m&&r.fd>=45){weight=40;text=`${r.fd}-yard field goal · ${who||''}`}
    else if(r.t==='scrimmage'&&(r.y||0)>=20){weight=20+r.y;text=`${r.y}-yard ${r.k==='p'?'pass':'run'} · ${who||''}${actor?` · ${actor}`:''}`}
    if(weight)plays.push({weight,text,clock,ours:r.sd===side});
    if(r.t==='scrimmage')prevPlay=r;
   }
   for(let i=plays.length-1;i>0;i--)if(/touchdown/i.test(plays[i].text)&&/-yard (pass|run)/.test(plays[i-1].text)&&plays[i-1].clock===plays[i].clock)plays.splice(i-1,1);
   const top=plays.sort((a,b)=>(b.ours-a.ours)||(b.weight-a.weight)).slice(0,3);
   // Box-score performers exist for every game, simmed or played: the same impact weighting the season page uses.
   const impact=x=>{const t=x.stats||{};return(t.passYds||0)*.035+(t.passTD||0)*5-(t.int||0)*3+(t.rushYds||0)*.08+(t.rushTD||0)*5+(t.recYds||0)*.08+(t.recTD||0)*5+(t.tackles||0)*.8+(t.tfl||0)*1.6+(t.sacks||0)*3.5+(t.intDef||0)*4.5+(t.forcedFumbles||0)*3};
   const line=x=>{const t=x.stats||{},o=[];if(t.passYds)o.push(`${t.passYds} pass yd`);if(t.passTD)o.push(`${t.passTD} pass TD`);if(t.rushYds)o.push(`${t.rushYds} rush yd`);if(t.rushTD)o.push(`${t.rushTD} rush TD`);if(t.recYds)o.push(`${t.recYds} rec yd`);if(t.recTD)o.push(`${t.recTD} rec TD`);if(t.sacks)o.push(`${t.sacks} sacks`);if(t.intDef)o.push(`${t.intDef} INT`);if(t.tackles&&o.length<2)o.push(`${t.tackles} tackles`);return o.slice(0,3).join(' · ')};
   const performers=(g.playerStats?.[side]||[]).slice().sort((a,b)=>impact(b)-impact(a)).slice(0,3).filter(x=>impact(x)>0).map(x=>{const f=findPlayer(x.id);return{id:x.id,name:f?.p?.name||x.name||'Player',pos:f?.p?.pos||x.pos||'',line:line(x),face:!!f?.p}});
   return{gameId:g.id,season:g.season??universe.year,week:g.week,opponent:names[opp],won:us>them,us,them,hasReplay:!!rows?.length,plays:top,performers};
  }catch(e){return null}
 },
 rivalryWeek(){
  try{
   if(!universe?.teams||universe.phase!=='regular')return null;const u=selected(),rival=rivalOf(u);if(!u||!rival)return null;
   const next=(u.schedule||[]).filter(g=>!g.played).sort((a,b)=>(a.week||0)-(b.week||0))[0];
   if(!next||(next.home!==rival.name&&next.away!==rival.name))return null;
   return{week:next.week,home:next.home===u.name,rival:{id:rival.id,name:rival.name},trophy:u.rivalry?.trophy||null,series:u.rivalry?.series?{w:u.rivalry.series.w||0,l:u.rivalry.series.l||0,streak:u.rivalry.series.streak||0}:null};
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
