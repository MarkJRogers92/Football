// v0.10.2 development cutover: normal Detailed Game uses the transactional Game Engine 2 path.
function v2DetailedCutoverDebug(){
  const me=selected(),records=(universe.gameArchive||[]).filter(r=>r.engine==='v2'&&me&&(r.home?.id===me.id||r.away?.id===me.id));
  return{year:universe.year,week:universe.week,phase:universe.phase,userRecord:me?me.w+me.l:0,v2UserArchives:records.length,lastV2:records.at(-1)?{id:records.at(-1).id,week:records.at(-1).week,drives:records.at(-1).drives?.length||0,playerLines:(records.at(-1).playerStats?.home?.length||0)+(records.at(-1).playerStats?.away?.length||0)}:null};
}
function v2DetailedSeasonSoakProbe(){
  const me=selected();if(!me)throw new Error('No controlled program for Game Engine 2 season soak.');
  const start={week:universe.week,record:me.w+me.l,v2:v2DetailedCutoverDebug().v2UserArchives},ids=[],driveCounts=[];
  while(universe.phase==='regular'&&universe.week<12){
    if(hasPendingCareerChoice())throw new Error(`Career choice blocked v2 season soak before week ${universe.week+1}.`);
    if(hasPendingWeeklyDecisions())delegateWeeklyDecisions();
    const g=findUserGame();if(!g)throw new Error(`No scheduled user game for v2 season soak week ${universe.week+1}.`);
    const beforeWeek=universe.week;simulateUserDetailed();
    const last=universe.lastDetailedGame,record=(universe.gameArchive||[]).find(r=>r.id===last?.gameId);
    if(!last||last.engine!=='v2'||!record||record.engine!=='v2'||!g.played||g.gameId!==record.id)throw new Error(`Detailed Game cutover did not persist v2 in week ${g.week}.`);
    ids.push(record.id);driveCounts.push(record.drives?.length||0);
    if((record.playerStats?.home?.length||0)+(record.playerStats?.away?.length||0)<=0)throw new Error(`V2 season soak lost real-player stats in week ${g.week}.`);
    if(!(record.drives||[]).some(d=>(d.playByPlay?.length||0)>0))throw new Error(`V2 season soak lost play-by-play in week ${g.week}.`);
    simWeek(true);if(universe.week!==beforeWeek+1)throw new Error(`V2 season soak failed weekly advance after week ${g.week}.`);
  }
  const end=v2DetailedCutoverDebug(),uniqueDriveCounts=new Set(driveCounts).size;
  return{ok:ids.length===12-start.week&&new Set(ids).size===ids.length&&end.userRecord-start.record===ids.length&&end.v2UserArchives-start.v2===ids.length&&universe.phase==='confReady'&&uniqueDriveCounts>1,weeks:ids.length,startWeek:start.week,endWeek:universe.week,recordDelta:end.userRecord-start.record,v2Delta:end.v2UserArchives-start.v2,ids,driveCounts,uniqueDriveCounts,phase:universe.phase};
}
simulateUserDetailed=function simulateUserDetailedV2Cutover(){
  const g=findUserGame();if(!g)return;
  if(hasPendingCareerChoice()){setStatus('Choose your next job before advancing the week.');return}
  if(hasPendingWeeklyDecisions()){setStatus('Resolve the Coach’s Desk decisions before playing this week.');return}
  try{const out=recordV2GameLabResult();render();return out.result}catch(err){console.error(err);setStatus(`Detailed Game rolled back: ${err.message||err}`);render();return null}
};
// The development-only record button is obsolete after the normal Detailed Game cutover.
renderV2RecordGate=function renderV2RecordGateAfterCutover(){const host=document.querySelector('#v2RecordGate');if(host)host.remove()};
globalThis.DynastyGameEngineV2LabBridge.cutoverDebug=v2DetailedCutoverDebug;
if(globalThis.__DL_TEST__)globalThis.__DL_TEST__.v2DetailedSeasonSoakProbe=v2DetailedSeasonSoakProbe;
