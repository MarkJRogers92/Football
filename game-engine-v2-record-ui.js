// v0.10.1 development-only UI/test surface for the recorded Game Engine 2 gate.
function v2RecordDebugState(){
  const me=selected(),g=(me?.schedule||[]).find(x=>x.week===universe.week+1)||null,last=(universe.gameArchive||[]).at(-1)||null;
  return{year:universe.year,week:universe.week,phase:universe.phase,gameCounter:universe.gameCounter||0,nextEventId:universe.nextEventId??null,archiveLength:(universe.gameArchive||[]).length,eventLength:(universe.events||[]).length,rng:v2RecordClone(universe.rng),team:me?{id:me.id,name:me.name,w:me.w,l:me.l,cw:me.cw,cl:me.cl,pf:me.pf,pa:me.pa,sos:me.sos,stats:v2RosterStatChecksum(me)}:null,game:g?v2RecordClone(g):null,lastArchive:last?{id:last.id,engine:last.engine,transactionVersion:last.transactionVersion,score:v2RecordClone(last.score),scoreAdjustment:v2RecordClone(last.scoreAdjustment),drivePoints:{home:(last.drives||[]).filter(d=>d.side==='home').reduce((n,d)=>n+(Number(d.points)||0),0),away:(last.drives||[]).filter(d=>d.side==='away').reduce((n,d)=>n+(Number(d.points)||0),0)},playerLines:(last.playerStats?.home?.length||0)+(last.playerStats?.away?.length||0),drives:last.drives?.length||0}:null,lastDetailed:universe.lastDetailedGame?{gameId:universe.lastDetailedGame.gameId,engine:universe.lastDetailedGame.engine,week:universe.lastDetailedGame.week}:null}
}
function v2RollbackProbe(fault='afterArchive'){
  recoverWeek();syncGameplayRng();const before=v2RecordDebugState();let message='';try{recordV2GameLabResult({testFault:fault});return{ok:false,before,after:v2RecordDebugState(),message:'fault did not throw'}}catch(err){message=String(err.message||err)}const after=v2RecordDebugState();return{ok:JSON.stringify(before)===JSON.stringify(after),before,after,message}
}
function v2RecordedSoakProbe(weeks=6){
  const count=Math.max(1,Math.min(10,Math.trunc(Number(weeks)||6))),me=selected();if(!me)throw new Error('No controlled program for v2 soak.');
  const start={week:universe.week,record:me.w+me.l,v2:(universe.gameArchive||[]).filter(r=>r.engine==='v2'&&(r.home?.id===me.id||r.away?.id===me.id)).length},ids=[];
  for(let i=0;i<count;i++){
    if(hasPendingCareerChoice())throw new Error(`Career choice blocked v2 soak before week ${universe.week+1}.`);
    if(hasPendingWeeklyDecisions())delegateWeeklyDecisions();
    const g=findUserGame();if(!g)throw new Error(`No scheduled user game for v2 soak week ${universe.week+1}.`);
    const scheduledWeek=g.week,beforeWeek=universe.week,out=recordV2GameLabResult();ids.push(out.record.id);
    if(!g.played||g.gameId!==out.record.id)throw new Error(`V2 soak failed schedule settlement in week ${scheduledWeek}.`);
    simWeek();if(universe.week!==beforeWeek+1)throw new Error(`V2 soak failed to advance after week ${scheduledWeek}.`);
  }
  const records=(universe.gameArchive||[]).filter(r=>r.engine==='v2'&&(r.home?.id===me.id||r.away?.id===me.id)),selectedRecords=records.filter(r=>ids.includes(r.id));
  const durable=selectedRecords.every(r=>r.transactionVersion===1&&(r.playerStats?.home?.length||0)+(r.playerStats?.away?.length||0)>0&&(r.drives?.length||0)>0&&(r.drives||[]).some(d=>(d.playByPlay?.length||0)>0));
  return{ok:ids.length===count&&new Set(ids).size===count&&universe.week-start.week===count&&(me.w+me.l)-start.record===count&&records.length-start.v2===count&&durable,weeks:count,startWeek:start.week,endWeek:universe.week,recordDelta:(me.w+me.l)-start.record,v2Delta:records.length-start.v2,ids,durable,lastDetailed:universe.lastDetailedGame?{gameId:universe.lastDetailedGame.gameId,engine:universe.lastDetailedGame.engine,week:universe.lastDetailedGame.week}:null};
}
function ensureV2RecordGateHost(){let host=document.querySelector('#v2RecordGate');if(host)return host;const section=document.querySelector('#gamelab');if(!section)return null;host=document.createElement('div');host.id='v2RecordGate';host.className='card';section.appendChild(host);return host}
function renderV2RecordGate(){
  const host=ensureV2RecordGateHost();if(!host)return;const g=findUserGame(),disabled=!g||universe.phase!=='regular'||!globalThis.DynastyGameEngineV2Transaction;
  host.innerHTML=`<div class="section-head"><div><div class="eyebrow">V0.10.1 DEVELOPMENT GATE</div><h3>Recorded Game Engine 2</h3><div class="muted">All-or-nothing scheduled-game commit using real-player v2 stats, the permanent Game Center archive and rollback protection.</div></div><button type="button" data-v2-record ${disabled?'disabled':''}>Record with V2 (Dev)</button></div><div class="v2-shadow-safety"><strong>Development only.</strong> This gate is not a production cutover and does not replace Quick Sim.</div>`;
  const button=host.querySelector('[data-v2-record]');if(button)button.onclick=()=>{if(!confirm('Development-only Game Engine 2 test: permanently record this scheduled game with v2?'))return;try{const out=recordV2GameLabResult();setStatus(`Game Engine 2 recorded ${out.result.away} ${out.result.ap} – ${out.result.hp} ${out.result.home}.`);render()}catch(err){console.error(err);setStatus(`V2 recorded-game transaction rolled back: ${err.message||err}`)}}
}
const renderGameLabWithV2Recorded=TAB_RENDERERS.gamelab;TAB_RENDERERS.gamelab=()=>{renderGameLabWithV2Recorded();renderV2RecordGate()};
globalThis.DynastyGameEngineV2LabBridge.recordCurrent=recordV2GameLabResult;globalThis.DynastyGameEngineV2LabBridge.debug=v2RecordDebugState;
if(globalThis.__DL_TEST__){globalThis.__DL_TEST__.v2RollbackProbe=v2RollbackProbe;globalThis.__DL_TEST__.v2RecordedSoakProbe=v2RecordedSoakProbe}
