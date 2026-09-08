// v0.10.1 development-only recorded Game Engine 2 transaction runner.
function v2RecordPrepared(g,home,away,homeProfile,awayProfile){
  const api=globalThis.DynastyGameEngineV2Lab,actors=globalThis.DynastyGameEngineV2Attribution,tx=globalThis.DynastyGameEngineV2Transaction;
  if(!api||!actors||!tx)throw new Error('Game Engine 2 development modules are unavailable.');
  const key=v2GameLabKey(g),preview=api.simulate({gameId:`v0101-${key}`,seed:`v0101-${key}`,home,away,homeProfile,awayProfile,homeFieldRating:homeFieldFor(home)});
  const attribution=actors.attributeGame(preview.state,{home:v2AttributionContext(home),away:v2AttributionContext(away)});actors.attachEventSummary(attribution,preview.summary);preview.attribution=attribution;
  const candidate=tx.buildCandidate({state:preview.state,attribution,homeTeam:home,awayTeam:away,starterIds:{home:v2StarterIds(home),away:v2StarterIds(away)},meta:{season:universe.year,week:g.week??universe.week+1,phase:universe.phase,label:'Regular season',venue:`${home.name} · ${home.city||''}`},conference:g.conf??home.conference===away.conference,homeOpponentOverall:awayProfile.overall,awayOpponentOverall:homeProfile.overall});
  return{api,tx,key,preview,candidate}
}
function v2RecordLineMap(lines){const out=new Map();for(const row of lines||[])out.set(String(row.id),row.stats||{});return out}
function v2RecordValidate(candidate,record,home,away,snapshot,g){
  const errors=[],tx=globalThis.DynastyGameEngineV2Transaction,archiveCheck=tx.validateArchiveCandidate(record,{homeRoster:home.roster,awayRoster:away.roster});if(!archiveCheck.ok)errors.push(...archiveCheck.errors);
  if(record.engine!=='v2'||record.transactionVersion!==tx.VERSION)errors.push('archive v2 identity missing');
  if(!g.played||g.gameId!==record.id||g.winner!==candidate.winner)errors.push('scheduled game does not point to recorded v2 archive');
  const expectedHomeW=snapshot.home.scalars.w+(candidate.winner===home.name?1:0),expectedHomeL=snapshot.home.scalars.l+(candidate.winner===home.name?0:1),expectedAwayW=snapshot.away.scalars.w+(candidate.winner===away.name?1:0),expectedAwayL=snapshot.away.scalars.l+(candidate.winner===away.name?0:1);
  if(home.w!==expectedHomeW||home.l!==expectedHomeL||away.w!==expectedAwayW||away.l!==expectedAwayL)errors.push('team records do not reconcile');
  for(const [side,team,teamSnapshot] of [['home',home,snapshot.home],['away',away,snapshot.away]]){
    const before=new Map(teamSnapshot.players.map(x=>[String(x.id),x.state.stats||{}])),live=new Map((team.roster||[]).map(p=>[String(p.id),p])),arch=v2RecordLineMap(record.playerStats?.[side]),want=v2RecordLineMap(candidate.playerStats?.[side]);
    for(const [id,stats] of want){const player=live.get(id),old=before.get(id)||{};if(!player){errors.push(`${side} live player ${id} missing`);continue}for(const [key,value] of Object.entries(stats))if((Number(player.stats?.[key])||0)-(Number(old[key])||0)!==Number(value))errors.push(`${side} live delta ${id} ${key} mismatch`);const archived=arch.get(id)||{};for(const [key,value] of Object.entries(stats))if(Number(archived[key])!==Number(value))errors.push(`${side} archive delta ${id} ${key} mismatch`)}
  }
  return{ok:errors.length===0,errors}
}
function recordV2GameLabResult(options={}){
  const g=findUserGame();if(!g)throw new Error('No unsimulated user game is available for Game Engine 2.');
  if(universe.phase!=='regular')throw new Error('The v0.10.1 recorded v2 gate is limited to regular-season scheduled games.');
  if(g.played)throw new Error('This scheduled game is already complete.');
  if(hasPendingCareerChoice())throw new Error('Choose your next job before playing this week.');
  if(hasPendingWeeklyDecisions())throw new Error('Resolve the Coach’s Desk decisions before playing this week.');
  recoverWeek();const home=T(g.home),away=T(g.away);if(!home||!away)throw new Error('Scheduled teams could not be resolved.');const rollback=v2RecordCapture(g,home,away);
  try{
    advanceAcademicsForWeek(selected());const before=beginGame(home,away,false,{week:g.week,label:'Regular season'}),homeProfile=gameProfiles(home,away.name),awayProfile=gameProfiles(away,home.name),prepared=v2RecordPrepared(g,home,away,homeProfile,awayProfile),preview=prepared.preview,candidate=prepared.candidate;
    preview.transactionProof=prepared.tx.dryRunTransaction({candidate,homeTeam:home,awayTeam:away,homeGameplan:gameplanSnapshot(home,away.name),awayGameplan:gameplanSnapshot(away,home.name)});
    if(options.testFault==='afterDryRun')throw new Error('Injected v2 rollback fault after dry run.');
    v2RecordApplyPlayerStats(home,candidate.playerStats.home);v2RecordApplyPlayerStats(away,candidate.playerStats.away);const win=recordGame(home,away,candidate.hp,candidate.ap,candidate.conference,homeProfile,awayProfile);
    if(options.testFault==='afterStats')throw new Error('Injected v2 rollback fault after live stat application.');
    postGameCondition(home);postGameCondition(away);const drives=v2RecordDriveArchive(preview),log=(preview.state.events||[]).slice(-160).map(e=>prepared.api.eventText(e,preview.names));
    const result=finishGame(before,home,away,{home:home.name,away:away.name,hp:candidate.hp,ap:candidate.ap,winner:win.name,box:candidate.box,detailed:true,drives,log,engine:'v2',transactionVersion:prepared.tx.VERSION});
    const record=(universe.gameArchive||[]).find(x=>x.id===result.gameId);if(!record)throw new Error('Recorded v2 game was not found in the permanent archive.');
    record.engine='v2';record.transactionVersion=prepared.tx.VERSION;record.eventCount=candidate.eventCount;record.seed=candidate.seed;
    for(const side of ['home','away']){const drivePoints=drives.filter(d=>d.side===side).reduce((n,d)=>n+(Number(d.points)||0),0);record.scoreAdjustment[side]=record.score[side]-drivePoints}
    if(options.testFault==='afterArchive')throw new Error('Injected v2 rollback fault after archive write.');
    completeScheduledGame(g,result,true);if(options.testFault==='afterSchedule')throw new Error('Injected v2 rollback fault after schedule settlement.');
    universe.lastDetailedGame={...result,season:universe.year,week:g.week,engine:'v2',transactionVersion:prepared.tx.VERSION};universe.latest=[result];
    const validation=v2RecordValidate(candidate,record,home,away,rollback,g);if(!validation.ok)throw new Error(`Recorded v2 game failed post-commit validation: ${validation.errors.join('; ')}`);
    ranked();if(options.testFault==='afterRank')throw new Error('Injected v2 rollback fault after rankings.');syncGameplayRng();v2GameLabPreview={key:prepared.key,...preview,recorded:true,gameId:result.gameId};return{ok:true,result,record,candidate,validation,preview};
  }catch(err){v2RecordRestore(rollback,g,home,away);throw err}
}
