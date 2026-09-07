// v0.10.1 permanent commit bridge for a completed Interactive Game Day session.
function v2GameDayInputMatches(session,home,away,homeProfile,awayProfile){
  const adapter=globalThis.DynastyGameEngineV2Adapter;if(!adapter)return false;
  const expected={home:adapter.profileTeam(home,homeProfile),away:adapter.profileTeam(away,awayProfile)};
  return['home','away'].every(side=>['rating','offense','defense'].every(key=>Number(expected[side][key])===Number(session.inputs?.[side]?.[key])))
}
function v2GameDayDecisionReceipts(state){
  return(state?.events||[]).filter(e=>e.type==='coaching_decision').map(e=>({
    id:e.decisionId,type:e.decisionType||'fourth_down',team:e.team,selectedOption:e.selectedOption,resolvedAction:e.resolvedAction,
    staffRecommendation:e.staffRecommendation,situation:e.situation,period:e.state?.period??null,clock:e.state?.clock??null
  }))
}
function recordInteractiveV2GameDay(session,options={}){
  const gameday=globalThis.DynastyGameEngineV2GameDay,engine=globalThis.DynastyGameEngineV2,adapter=globalThis.DynastyGameEngineV2Adapter,actors=globalThis.DynastyGameEngineV2Attribution,tx=globalThis.DynastyGameEngineV2Transaction;
  if(!gameday||!engine||!adapter||!actors||!tx)throw new Error('Interactive Game Day transaction modules are unavailable.');
  gameday.validateSession(session);engine.validateGame(session.state);
  if(session.state.status!=='final')throw new Error('Interactive Game Day must be final before it can be recorded.');
  if(gameday.pendingDecision(session))throw new Error('Resolve the pending coaching decision before recording the game.');
  const g=findUserGame();if(!g)throw new Error('No unsimulated user game is available for Interactive Game Day.');
  if(universe.phase!=='regular')throw new Error('Interactive Game Day recording is currently limited to regular-season scheduled games.');
  if(g.played)throw new Error('This scheduled game is already complete.');
  if(hasPendingCareerChoice())throw new Error('Choose your next job before recording this game.');
  if(hasPendingWeeklyDecisions())throw new Error('Resolve the Coach’s Desk decisions before recording this game.');
  const key=v2GameLabKey(g),expectedId=`v0101-gameday-${key}`;if(session.gameId!==expectedId)throw new Error('Interactive Game Day session does not match the current scheduled game.');
  const home=T(g.home),away=T(g.away);if(!home||!away)throw new Error('Scheduled teams could not be resolved.');
  if(options.expectedIntegrity&&v2LabIntegrity(g,home,away)!==options.expectedIntegrity)throw new Error('The live dynasty changed after this Interactive Game Day preview began. Reset the preview before recording.');
  recoverWeek();const rollback=v2RecordCapture(g,home,away);
  try{
    const before=beginGame(home,away,false,{week:g.week,label:'Regular season'}),homeProfile=gameProfiles(home,away.name),awayProfile=gameProfiles(away,home.name);
    if(!v2GameDayInputMatches(session,home,away,homeProfile,awayProfile))throw new Error('Matchup inputs changed after the Interactive Game Day session began. Reset the preview before recording.');
    const summary=adapter.eventSummary(session.state),attribution=actors.attributeGame(session.state,{home:v2AttributionContext(home),away:v2AttributionContext(away)});actors.attachEventSummary(attribution,summary);
    const candidate=tx.buildCandidate({state:session.state,attribution,homeTeam:home,awayTeam:away,starterIds:{home:v2StarterIds(home),away:v2StarterIds(away)},meta:{season:universe.year,week:g.week??universe.week+1,phase:universe.phase,label:'Regular season',venue:`${home.name} · ${home.city||''}`},conference:g.conf??home.conference===away.conference,homeOpponentOverall:awayProfile.overall,awayOpponentOverall:homeProfile.overall});
    const transactionProof=tx.dryRunTransaction({candidate,homeTeam:home,awayTeam:away,homeGameplan:gameplanSnapshot(home,away.name),awayGameplan:gameplanSnapshot(away,home.name)});
    if(options.testFault==='afterDryRun')throw new Error('Injected Interactive Game Day rollback fault after dry run.');
    v2RecordApplyPlayerStats(home,candidate.playerStats.home);v2RecordApplyPlayerStats(away,candidate.playerStats.away);const win=recordGame(home,away,candidate.hp,candidate.ap,candidate.conference,homeProfile,awayProfile);
    if(options.testFault==='afterStats')throw new Error('Injected Interactive Game Day rollback fault after stat application.');
    postGameCondition(home);postGameCondition(away);
    const preview={state:session.state,names:session.names},drives=v2RecordDriveArchive(preview),log=(session.state.events||[]).slice(-160).map(e=>globalThis.DynastyGameEngineV2Lab.eventText(e,session.names));
    const result=finishGame(before,home,away,{home:home.name,away:away.name,hp:candidate.hp,ap:candidate.ap,winner:win.name,box:candidate.box,detailed:true,drives,log,engine:'v2',transactionVersion:tx.VERSION});
    const record=(universe.gameArchive||[]).find(x=>x.id===result.gameId);if(!record)throw new Error('Interactive Game Day archive record was not created.');
    record.engine='v2';record.transactionVersion=tx.VERSION;record.eventCount=candidate.eventCount;record.seed=candidate.seed;record.gameDayVersion=gameday.VERSION;record.coachingDecisionVersion=globalThis.DynastyGameEngineV2Decisions?.VERSION||1;record.coachingDecisions=v2GameDayDecisionReceipts(session.state);
    for(const side of ['home','away']){const drivePoints=drives.filter(d=>d.side===side).reduce((n,d)=>n+(Number(d.points)||0),0);record.scoreAdjustment[side]=record.score[side]-drivePoints}
    if(options.testFault==='afterArchive')throw new Error('Injected Interactive Game Day rollback fault after archive write.');
    completeScheduledGame(g,result,true);if(options.testFault==='afterSchedule')throw new Error('Injected Interactive Game Day rollback fault after schedule settlement.');
    universe.lastDetailedGame={...result,season:universe.year,week:g.week,engine:'v2',transactionVersion:tx.VERSION,gameDayVersion:gameday.VERSION};universe.latest=[result];
    const validation=v2RecordValidate(candidate,record,home,away,rollback,g);if(!validation.ok)throw new Error(`Interactive Game Day failed post-commit validation: ${validation.errors.join('; ')}`);
    ranked();if(options.testFault==='afterRank')throw new Error('Injected Interactive Game Day rollback fault after rankings.');syncGameplayRng();
    return{ok:true,result,record,candidate,validation,transactionProof,coachingDecisions:record.coachingDecisions}
  }catch(err){v2RecordRestore(rollback,g,home,away);throw err}
}
function v2GameDayCommitDebug(){
  const me=selected(),g=findUserGame();return{year:universe.year,week:universe.week,phase:universe.phase,userRecord:me?me.w+me.l:0,archiveLength:(universe.gameArchive||[]).length,game:g?{week:g.week,played:!!g.played,gameId:g.gameId||null}:null,last:universe.lastDetailedGame?{gameId:universe.lastDetailedGame.gameId,engine:universe.lastDetailedGame.engine,gameDayVersion:universe.lastDetailedGame.gameDayVersion}:null}
}
globalThis.DynastyGameEngineV2LabBridge.recordInteractive=recordInteractiveV2GameDay;
if(globalThis.__DL_TEST__)globalThis.__DL_TEST__.v2GameDayCommitDebug=v2GameDayCommitDebug;
