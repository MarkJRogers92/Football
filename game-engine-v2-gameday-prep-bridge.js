// v0.10.1 Interactive Game Day pregame bridge.
// Replaces only the staged preparation step so preview kickoff profiles mirror the
// permanent record path: recoverWeek() on cloned rosters, then beginGame() preparation wear.
// `calls` turns on the v0.19 drive and defensive calls. A fully coached game has them; Coach big moments and a live
// game saved before v0.19 (which must replay exactly as it was played) do not.
v2GameDayUIPrepare=function v2GameDayUIPrepareWithRecovery(playbook,rules,mode='plays',skipRoutine=true,calls=mode!=='moments'){
  const ctx=v2GameDayUILiveContext(),api=globalThis.DynastyGameEngineV2GameDay;if(!ctx||!api)throw new Error('No upcoming game is available for Interactive Game Day.');
  const before=v2GameDayUIDigest(ctx),prepared=v2GameDayPreparedTeams(ctx.home,ctx.away),hc=prepared.home,ac=prepared.away;
  const homeProfile=gameProfiles(hc,ac.name),awayProfile=gameProfiles(ac,hc.name),me=selected();
  const session=api.createSession({gameId:`v0101-gameday-${ctx.key}`,seed:`v0101-gameday-${ctx.key}`,home:ctx.home,away:ctx.away,homeProfile,awayProfile,homeFieldRating:homeFieldFor(ctx.home),controlledTeamId:me?.id??null,skipRoutine,calls:calls===true,playbook,year:universe.year,week:ctx.g.week??universe.week+1,rules});
  api.advanceOne(session);v2GameDayUIAssertUnchanged(before,ctx);
  v2InteractiveGameDay={key:ctx.key,session,integrity:before,actions:[],mode:mode==='moments'?'moments':'plays'};v2GameDayUIPersist();renderV2InteractiveGameDay();return session
};
if(globalThis.DynastyGameEngineV2LabBridge?.interactive)globalThis.DynastyGameEngineV2LabBridge.interactive.start=v2GameDayUIPrepare;
