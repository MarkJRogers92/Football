// v0.10.2 development extension: user-controlled postseason games use the same transactional Game Engine 2 path.
function v2PostseasonUserMatch(a,b){const me=selected();return !!me&&(a?.id===me.id||b?.id===me.id)}
function v2PostseasonStageCapture(){syncGameplayRng();return v2RecordClone(universe)}
function v2PostseasonStageRestore(snapshot){universe=v2RecordClone(snapshot);rebuildIndexes();activateGameplayRng(universe.rng,universe);render()}
function v2PostseasonRecordMatch(home,away,options={}){
  const api=globalThis.DynastyGameEngineV2Lab,actors=globalThis.DynastyGameEngineV2Attribution,tx=globalThis.DynastyGameEngineV2Transaction;
  if(!api||!actors||!tx)throw new Error('Game Engine 2 development modules are unavailable.');
  const week=options.week??13,label=options.label||'Postseason',neutral=options.neutral!==false,conference=!!options.conference;
  const stub={week,label,conf:conference,played:false,home:home.name,away:away.name},rollback=v2RecordCapture(stub,home,away);
  try{
    const before=beginGame(home,away,neutral,{week,label}),homeProfile=gameProfiles(home,away.name),awayProfile=gameProfiles(away,home.name);
    const key=`${universe.year}:${week}:${label}:${home.name}:${away.name}`,preview=api.simulate({gameId:`v0102-post-${key}`,seed:`v0102-post-${key}`,home,away,homeProfile,awayProfile,homeFieldRating:neutral?0:homeFieldFor(home)});
    const attribution=actors.attributeGame(preview.state,{home:v2AttributionContext(home),away:v2AttributionContext(away)});actors.attachEventSummary(attribution,preview.summary);preview.attribution=attribution;
    const candidate=tx.buildCandidate({state:preview.state,attribution,homeTeam:home,awayTeam:away,starterIds:{home:v2StarterIds(home),away:v2StarterIds(away)},meta:{season:universe.year,week,phase:universe.phase,label,venue:neutral?'Neutral site':`${home.name} · ${home.city||''}`},conference,homeOpponentOverall:awayProfile.overall,awayOpponentOverall:homeProfile.overall});
    preview.transactionProof=tx.dryRunTransaction({candidate,homeTeam:home,awayTeam:away,homeGameplan:gameplanSnapshot(home,away.name),awayGameplan:gameplanSnapshot(away,home.name)});
    if(options.testFault==='afterDryRun')throw new Error('Injected postseason v2 rollback fault after dry run.');
    v2RecordApplyPlayerStats(home,candidate.playerStats.home);v2RecordApplyPlayerStats(away,candidate.playerStats.away);
    const win=recordGame(home,away,candidate.hp,candidate.ap,conference,homeProfile,awayProfile);
    if(options.testFault==='afterStats')throw new Error('Injected postseason v2 rollback fault after live stat application.');
    postGameCondition(home);postGameCondition(away);
    const drives=v2RecordDriveArchive(preview),log=(preview.state.events||[]).slice(-160).map(e=>api.eventText(e,preview.names));
    const result=finishGame(before,home,away,{home:home.name,away:away.name,hp:candidate.hp,ap:candidate.ap,winner:win.name,box:candidate.box,detailed:true,drives,log,engine:'v2',transactionVersion:tx.VERSION});
    const record=(universe.gameArchive||[]).find(x=>x.id===result.gameId);if(!record)throw new Error('Postseason v2 game was not found in the permanent archive.');
    record.engine='v2';record.transactionVersion=tx.VERSION;record.eventCount=candidate.eventCount;record.seed=candidate.seed;
    for(const side of ['home','away']){const drivePoints=drives.filter(d=>d.side===side).reduce((n,d)=>n+(Number(d.points)||0),0);record.scoreAdjustment[side]=record.score[side]-drivePoints}
    if(options.testFault==='afterArchive')throw new Error('Injected postseason v2 rollback fault after archive write.');
    Object.assign(stub,{played:true,gameId:result.gameId,winner:candidate.winner,score:[candidate.ap,candidate.hp]});
    const validation=v2RecordValidate(candidate,record,home,away,rollback,stub);if(!validation.ok)throw new Error(`Postseason v2 game failed post-commit validation: ${validation.errors.join('; ')}`);
    universe.lastDetailedGame={...result,season:universe.year,week,engine:'v2',transactionVersion:tx.VERSION};
    syncGameplayRng();v2GameLabPreview={key,...preview,recorded:true,gameId:result.gameId};return{ok:true,result,record,candidate,validation,preview};
  }catch(err){v2RecordRestore(rollback,stub,home,away);throw err}
}
function v2PostseasonSim(a,b,options){return v2PostseasonUserMatch(a,b)?v2PostseasonRecordMatch(a,b,options).result:gameSim(a,b,options?.neutral!==false,options?.conference??false,{week:options?.week,label:options?.label})}
function v2PostseasonFail(stage,stageSnapshot,err){console.error(err);v2PostseasonStageRestore(stageSnapshot);setStatus(`${stage} rolled back: ${err.message||err}`)}

simConferenceChampionships=function simConferenceChampionshipsV2(){
  if(universe.phase!=='confReady')return;const stage=v2PostseasonStageCapture();
  try{
    universe.latest=[];universe.confChamps=[];
    allConfs().forEach(c=>{let s=confStand(c);if(s.length<2)return;const label=c+' Championship',r=v2PostseasonSim(s[0],s[1],{week:13,label,neutral:true,conference:false}),w=T(r.winner);w.champ=true;universe.confChamps.push(w);universe.latest.push({...r,label})});
    universe.phase='bowlReady';ranked();autosaveAfter('postseason');render()
  }catch(err){v2PostseasonFail('Conference championships',stage,err)}
};

simBowls=function simBowlsV2(){
  if(universe.phase!=='bowlReady')return [];const stage=v2PostseasonStageCapture();
  try{
    const field=bowlField(),logs=[];universe.bowls=[];
    for(let i=0;i+1<field.length;i+=2){
      const a=field[i],b=field[i+1],label=bowlNameFor(i/2),r=v2PostseasonSim(a,b,{week:13,label,neutral:true,conference:false}),w=T(r.winner),l=w===a?b:a;
      universe.bowls.push({label,winner:w.name,loser:l.name,score:[r.ap,r.hp],gameId:r.gameId});logs.push({...r,label});
      w.bowlResult={label,won:true,year:universe.year};l.bowlResult={label,won:false,year:universe.year};
      w.fan_support=clamp((w.fan_support||60)+2,0,100);l.fan_support=clamp((l.fan_support||60)+1,0,100);
      const order=universe.nextEventId++;universe.events??=[];universe.events.push({id:`EVT_${order}`,season:universe.year,week:13,timestampOrder:order,type:'BOWL_RESULT',importance:58,schoolIds:[w.id,l.id],playerIds:[],coachIds:[],recruitIds:[],gameIds:r.gameId?[r.gameId]:[],summary:`${w.name} wins the ${label}.`,metadata:{label,winnerId:w.id}})
    }
    universe.phase='playoffReady';if(universe.latest)universe.latest=logs.length?logs:universe.latest;ranked();render();return logs
  }catch(err){v2PostseasonFail('Bowl simulation',stage,err);return[]}
};

simPlayoff=function simPlayoffV2(){
  if(universe.phase==='bowlReady')simBowls();if(universe.phase!=='playoffReady')return;const stage=v2PostseasonStageCapture();
  try{
    const field=seedField();field.forEach((t,i)=>t.seed=i+1);let logs=[];
    function round(arr,label){let out=[];for(let i=0;i<arr.length/2;i++){let a=arr[i],b=arr[arr.length-1-i],week=14+['Round of 16','Quarterfinal','Semifinal','National Championship'].indexOf(label),r=v2PostseasonSim(a,b,{week,label,neutral:true,conference:false});logs.push({...r,label});out.push(T(r.winner))}return out}
    let r16=round(field,'Round of 16'),q=round(r16,'Quarterfinal'),s=round(q,'Semifinal'),f=round(s,'National Championship');
    universe.champion=f[0].name;universe.phase='complete';universe.offseason=makeOffseasonState(universe.year,'review');universe.latest=logs;finalizeRecruiting();finalizeSeasonHonors();archiveSeason();ranked();autosaveAfter('postseason');render()
  }catch(err){v2PostseasonFail('Playoff simulation',stage,err)}
};

function v2PostseasonArchiveSummary(){
  const me=selected(),rows=(universe.gameArchive||[]).filter(r=>r.engine==='v2'&&r.label!=='Regular season'&&me&&(r.home?.id===me.id||r.away?.id===me.id));
  return rows.map(r=>({id:r.id,label:r.label,week:r.week,engine:r.engine,drives:r.drives?.length||0,playerLines:(r.playerStats?.home?.length||0)+(r.playerStats?.away?.length||0)}))
}
function v2PostseasonTestPrepare(stage){
  const me=selected();if(!me)throw new Error('No controlled program.');
  const others=universe.teams.filter(t=>t.id!==me.id);
  if(stage==='conference'){
    universe.phase='confReady';for(const t of universe.teams){t.champ=false;if(t.conference===me.conference){t.w=2;t.l=10;t.cw=1;t.cl=8}}
    me.w=12;me.l=0;me.cw=9;me.cl=0;const rival=others.find(t=>t.conference===me.conference);if(rival){rival.w=11;rival.l=1;rival.cw=8;rival.cl=1}ranked();return{stage,conference:me.conference}
  }
  if(stage==='bowl'){
    universe.phase='bowlReady';for(const t of universe.teams){t.champ=false;t.w=Math.max(6,t.w||0);t.l=Math.max(0,12-t.w)}
    me.w=6;me.l=6;const elite=others.slice(0,20);for(const t of elite){t.w=12;t.l=0}universe.confChamps=elite.slice(0,10);ranked();return{stage,field:bowlField().map(t=>t.id),userId:me.id}
  }
  if(stage==='playoff'){
    universe.phase='playoffReady';for(const t of universe.teams){t.champ=false}me.w=12;me.l=0;const champs=[me,...others.slice(0,9)];for(const t of champs){t.w=Math.max(10,t.w||0);t.l=Math.min(2,t.l||0)}universe.confChamps=champs;ranked();return{stage,field:seedField().map(t=>t.id),userId:me.id}
  }
  throw new Error(`Unknown postseason test stage: ${stage}`)
}
globalThis.DynastyGameEngineV2LabBridge.postseasonSummary=v2PostseasonArchiveSummary;
if(globalThis.__DL_TEST__){globalThis.__DL_TEST__.v2PostseasonRecordMatch=v2PostseasonRecordMatch;globalThis.__DL_TEST__.v2PostseasonPrepare=v2PostseasonTestPrepare;globalThis.__DL_TEST__.v2PostseasonSummary=v2PostseasonArchiveSummary}
