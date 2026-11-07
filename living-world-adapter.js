// Read-only facts for the short briefing and optional followed cast. No archive hydration or RNG.
globalThis.DynastyLivingWorldSnapshot=Object.freeze({
 read(keys=[]){
  if(!universe?.teams||!Number.isInteger(universe.rng?.seed))return null;
  const u=selected();if(!u)return null;
  const players=new Map(),coaches=new Map();
  for(const t of universe.teams){
   for(const p of t.roster||[])players.set(String(p.id),{p,t,status:'active'});
   for(const c of Object.values(t.staff||{}))if(c)coaches.set(String(c.id),{c,t,status:'active'});
  }
  for(const entry of universe.transferPortal||[])if(entry.p&&!players.has(String(entry.p.id)))players.set(String(entry.p.id),{p:entry.p,t:null,status:'portal'});
  for(const p of universe.playerArchive||[])if(!players.has(String(p.id)))players.set(String(p.id),{p,t:null,status:p.draftResult?.status==='Drafted'?'drafted':'career-complete'});
  for(const c of universe.coachArchive||[])if(!coaches.has(String(c.id)))coaches.set(String(c.id),{c,t:null,status:c.status==='RETIRED'?'retired':'departed'});
  const person=key=>{
   const split=key.indexOf(':'),kind=key.slice(0,split),id=key.slice(split+1);
   if(kind==='player'){
    const f=players.get(id);if(!f)return null;const {p,t,status}=f;
    return{key,id:String(p.id),kind,name:p.name,team:t?.name||p.lastTeam||'',teamId:t?.id??null,status,role:p.pos||'',injured:status==='active'&&(p.injuryWeeks||0)>0,
     detail:status==='drafted'?p.draftResult.label:status==='portal'?'In the transfer portal':status==='career-complete'?p.exitReason||'College career complete':`${p.pos} · ${t.name}${p.injuryWeeks>0?' · Injured':''}`};
   }
   if(kind==='coach'){
    const f=coaches.get(id);if(!f)return null;const {c,t,status}=f;
    return{key,id:String(c.id),kind,name:c.name,team:t?.name||c.schoolName||'',teamId:t?.id??null,status,role:c.role||'Coach',injured:false,
     detail:status==='active'?`${c.role||'Coach'} · ${t.name}`:status==='retired'?'Retired':`Formerly ${c.schoolName||'in the league'}`};
   }
   return null;
  };
  const game=universe.phase==='regular'?(u.schedule||[]).filter(g=>!g.played).sort((a,b)=>a.week-b.week)[0]:null;
  const opp=game?T(game.home===u.name?game.away:game.home):null,rival=rivalOf(u);
  const nextGame=opp?{week:game.week,home:game.home===u.name,rival:rival?.id===opp.id,opponent:{id:opp.id,name:opp.name,w:opp.w||0,l:opp.l||0,rank:opp.rank>0&&opp.rank<=25?opp.rank:null}}:null;
  const callbacks=[];
  if(opp){
   for(const p of opp.roster||[]){
    const stint=(p.seasonHistory||[]).filter(s=>s.team===u.name&&s.year<universe.year).at(-1);
    const transfer=(p.transferHistory||[]).filter(h=>h.fromSchoolId===u.id).at(-1);
    const recruited=p.recruitingMemory?.topFiveSchoolIds?.includes(u.id);
    if(stint||transfer||recruited)callbacks.push({key:`player:${p.id}`,title:`A familiar face: ${p.name}`,detail:stint?`Played for ${u.name} in ${stint.year}; now ${p.pos} at ${opp.name}.`:transfer?`Transferred from ${u.name} in ${transfer.season}; now at ${opp.name}.`:`${u.name} was in his recorded recruiting top five; now at ${opp.name}.`});
   }
   for(const c of Object.values(opp.staff||{})){
    const stint=(c?.careerHistory||[]).filter(s=>s.schoolId===u.id&&s.endSeason!=null&&!s.legacy).at(-1);
    if(stint)callbacks.push({key:`coach:${c.id}`,title:`Across the sideline: ${c.name}`,detail:`${stint.role} at ${u.name} through ${stint.endSeason}; now ${c.role} at ${opp.name}.`});
   }
  }
  const suggestions=[...(u.roster||[]).slice().sort((a,b)=>(b.stats?.games||0)-(a.stats?.games||0)).slice(0,2).map(p=>`player:${p.id}`),...(rival?.staff?.HC?[`coach:${rival.staff.HC.id}`]:[]),...callbacks.slice(0,4).map(x=>x.key)];
  const wanted=[...new Set([...keys,...suggestions])],people=wanted.map(person).filter(Boolean);
  const news=(universe.events||[]).filter(e=>e.season===universe.year&&e.week===universe.week&&e.summary&&(e.importance||0)>=65)
   .map(e=>({id:String(e.id||`${e.type}:${e.summary}`),title:e.summary,detail:'',mine:(e.schoolIds||[]).includes(u.id),importance:e.importance||0}))
   .sort((a,b)=>b.importance-a.importance||a.id.localeCompare(b.id)).slice(0,8);
  return{worldKey:`seed:${universe.rng.seed}`,stamp:`${universe.year}:${universe.phase}:${universe.week}:${universe.offseason?.phase||''}`,year:universe.year,week:universe.week,phase:universe.phase,offseasonPhase:universe.offseason?.phase||null,
   program:{id:u.id,name:u.name},nextGame,callbacks,people,suggestions,news};
 },
 open(key){const at=String(key).indexOf(':'),kind=String(key).slice(0,at),id=String(key).slice(at+1);if(kind==='player')showPlayerProfile(id);else if(kind==='coach')showCoachProfile(id)}
});
