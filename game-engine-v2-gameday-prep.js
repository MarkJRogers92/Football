// v0.10.1 pure pregame preparation for Interactive Game Day.
// Mirrors recoverWeek() on cloned matchup rosters by replaying the live gameplay RNG stream
// across every roster in universe order, then charges gameplan wear on the two clones.
function v2GameDayPreparedTeams(home,away){
  const hc=v2LabClone(home),ac=v2LabClone(away),targets=new Map([[String(home.id),hc],[String(away.id),ac]]);
  if(universe.recoveredWeek!==universe.week){
    const shadowRng=globalThis.DynastyRng.create(ensureGameplayRng().snapshot()),giShadow=(a,b)=>Math.floor(shadowRng.next()*(b-a+1)+a);
    for(const team of universe.teams){
      const target=targets.get(String(team.id)),players=target?new Map((target.roster||[]).map(p=>[String(p.id),p])):null;
      for(const source of team.roster||[]){
        const healing=(source.injuryWeeks||0)>0?giShadow(7,14):giShadow(2,6),wearRecovery=giShadow(3,7);
        if(!players)continue;const p=players.get(String(source.id));if(!p)continue;
        if((source.injuryWeeks||0)>0){p.injuryWeeks=Math.max(0,(source.injuryWeeks||0)-1);p.health=clamp((source.health??70)+healing,35,100);if(p.injuryWeeks===0)p.injury=null}
        else p.health=clamp((source.health??100)+healing,40,100);
        p.wear=clamp((source.wear||0)-wearRecovery,0,100)
      }
    }
  }
  applyGameplanWear(hc,ac.name);applyGameplanWear(ac,hc.name);
  return{home:hc,away:ac}
}
