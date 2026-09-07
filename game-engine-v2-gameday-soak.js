// Test-only hardening probe for a full regular season of permanent Interactive Game Day results.
function v2GameDaySoakSession(g,me){
  const api=globalThis.DynastyGameEngineV2GameDay,home=T(g.home),away=T(g.away);if(!api||!home||!away)throw new Error('Interactive Game Day soak could not resolve matchup modules.');
  const integrity=v2LabIntegrity(g,home,away),prepared=v2GameDayPreparedTeams(home,away),homeProfile=gameProfiles(prepared.home,prepared.away.name),awayProfile=gameProfiles(prepared.away,prepared.home.name),key=v2GameLabKey(g);
  const session=api.createSession({gameId:`v0101-gameday-${key}`,seed:`v0101-gameday-${key}`,home,away,homeProfile,awayProfile,homeFieldRating:homeFieldFor(home),controlledTeamId:me.id});
  api.simulate(session,()=> 'delegate');return{session,integrity,home,away}
}
function v2InteractiveSeasonSoakProbe(){
  const me=selected();if(!me)throw new Error('No controlled program for Interactive Game Day season soak.');
  const start={week:universe.week,record:me.w+me.l,archives:(universe.gameArchive||[]).filter(r=>r.gameDayVersion===2&&(r.home?.id===me.id||r.away?.id===me.id)).length},ids=[],driveCounts=[],decisionCounts=[];
  while(universe.phase==='regular'&&universe.week<12){
    if(hasPendingCareerChoice())throw new Error(`Career choice blocked Interactive Game Day soak before week ${universe.week+1}.`);
    if(hasPendingWeeklyDecisions())delegateWeeklyDecisions();
    const g=findUserGame();if(!g)throw new Error(`No scheduled user game for Interactive Game Day soak week ${universe.week+1}.`);
    const beforeWeek=universe.week,staged=v2GameDaySoakSession(g,me),out=recordInteractiveV2GameDay(staged.session,{expectedIntegrity:staged.integrity}),record=out.record;
    if(!out.ok||record.engine!=='v2'||record.gameDayVersion!==2||record.transactionVersion!==1||!g.played||g.gameId!==record.id)throw new Error(`Interactive Game Day did not settle week ${g.week}.`);
    if((record.playerStats?.home?.length||0)+(record.playerStats?.away?.length||0)<=0)throw new Error(`Interactive Game Day lost player stats in week ${g.week}.`);
    if(!(record.drives||[]).some(d=>(d.playByPlay?.length||0)>0))throw new Error(`Interactive Game Day lost durable play-by-play in week ${g.week}.`);
    if(!(record.coachingDecisions||[]).length)throw new Error(`Interactive Game Day lost coaching receipts in week ${g.week}.`);
    ids.push(record.id);driveCounts.push(record.drives?.length||0);decisionCounts.push(record.coachingDecisions.length);
    simWeek(true);if(universe.week!==beforeWeek+1)throw new Error(`Interactive Game Day soak failed weekly advance after week ${g.week}.`)
  }
  const records=(universe.gameArchive||[]).filter(r=>r.gameDayVersion===2&&(r.home?.id===me.id||r.away?.id===me.id)),delta=records.length-start.archives,uniqueDriveCounts=new Set(driveCounts).size;
  return{ok:ids.length===12-start.week&&new Set(ids).size===ids.length&&(me.w+me.l)-start.record===ids.length&&delta===ids.length&&universe.phase==='confReady'&&driveCounts.every(n=>n>0)&&decisionCounts.every(n=>n>0),weeks:ids.length,startWeek:start.week,endWeek:universe.week,recordDelta:(me.w+me.l)-start.record,archiveDelta:delta,ids,driveCounts,uniqueDriveCounts,decisionCounts,phase:universe.phase}
}
if(globalThis.__DL_TEST__)globalThis.__DL_TEST__.v2InteractiveSeasonSoakProbe=v2InteractiveSeasonSoakProbe;
