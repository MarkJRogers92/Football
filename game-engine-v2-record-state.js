// v0.10 recorded Game Engine 2 state/rollback helpers.
function v2RecordClone(value){return value==null?value:JSON.parse(JSON.stringify(value))}
function v2RecordRestoreObject(target,snapshot){
  for(const key of Object.keys(target))if(!(key in snapshot))delete target[key];
  for(const [key,value] of Object.entries(snapshot))target[key]=v2RecordClone(value);
  return target
}
function v2RecordSnapshotTeam(team){return{
  scalars:{w:team.w,l:team.l,cw:team.cw,cl:team.cl,pf:team.pf,pa:team.pa,sos:team.sos,rank:team.rank,fan_support:team.fan_support},
  gameplan:v2RecordClone(team.gameplan),rivalry:v2RecordClone(team.rivalry),
  players:(team.roster||[]).map(p=>({id:p.id,state:v2RecordClone(p)}))
}}
function v2RecordRestoreTeam(team,snapshot){
  Object.assign(team,snapshot.scalars);
  if(snapshot.gameplan==null)delete team.gameplan;else team.gameplan=v2RecordClone(snapshot.gameplan);
  if(snapshot.rivalry==null)delete team.rivalry;else team.rivalry=v2RecordClone(snapshot.rivalry);
  const current=new Map((team.roster||[]).map(p=>[String(p.id),p]));
  for(const row of snapshot.players){const p=current.get(String(row.id));if(!p)throw new Error(`Rollback could not find ${team.name} player ${row.id}.`);v2RecordRestoreObject(p,row.state)}
}
function v2RecordCapture(g,home,away){
  syncGameplayRng();
  return{
    game:v2RecordClone(g),home:v2RecordSnapshotTeam(home),away:v2RecordSnapshotTeam(away),
    hadArchive:Array.isArray(universe.gameArchive),archiveLength:Array.isArray(universe.gameArchive)?universe.gameArchive.length:0,
    hadArchiveVersion:Object.prototype.hasOwnProperty.call(universe,'gameArchiveVersion'),gameArchiveVersion:universe.gameArchiveVersion,
    hadEvents:Array.isArray(universe.events),eventsLength:Array.isArray(universe.events)?universe.events.length:0,
    hadNextEventId:Object.prototype.hasOwnProperty.call(universe,'nextEventId'),nextEventId:universe.nextEventId,
    hadCounter:Object.prototype.hasOwnProperty.call(universe,'gameCounter'),gameCounter:universe.gameCounter,
    playLogKeys:universe.playLogs?Object.keys(universe.playLogs):null,
    lastDetailedGame:v2RecordClone(universe.lastDetailedGame),latest:v2RecordClone(universe.latest||[]),academicProgression:v2RecordClone(universe.academicProgression),rng:v2RecordClone(universe.rng),
    ranks:universe.teams.map(t=>({id:t.id,rank:t.rank}))
  }
}
function v2RecordRestore(snapshot,g,home,away){
  v2RecordRestoreTeam(home,snapshot.home);v2RecordRestoreTeam(away,snapshot.away);v2RecordRestoreObject(g,snapshot.game);
  if(snapshot.hadArchive)universe.gameArchive.length=snapshot.archiveLength;else delete universe.gameArchive;
  if(snapshot.hadArchiveVersion)universe.gameArchiveVersion=snapshot.gameArchiveVersion;else delete universe.gameArchiveVersion;
  if(snapshot.hadEvents)universe.events.length=snapshot.eventsLength;else delete universe.events;
  if(snapshot.hadNextEventId)universe.nextEventId=snapshot.nextEventId;else delete universe.nextEventId;
  if(snapshot.hadCounter)universe.gameCounter=snapshot.gameCounter;else delete universe.gameCounter;
  if(snapshot.playLogKeys==null)delete universe.playLogs;else if(universe.playLogs){const keep=new Set(snapshot.playLogKeys);for(const key of Object.keys(universe.playLogs))if(!keep.has(key))delete universe.playLogs[key]}
  universe.lastDetailedGame=v2RecordClone(snapshot.lastDetailedGame);universe.latest=v2RecordClone(snapshot.latest);universe.academicProgression=v2RecordClone(snapshot.academicProgression);
  const ranks=new Map(snapshot.ranks.map(x=>[x.id,x.rank]));for(const t of universe.teams)if(ranks.has(t.id))t.rank=ranks.get(t.id);
  activateGameplayRng(snapshot.rng,universe);universe.rng=v2RecordClone(snapshot.rng);rebuildIndexes()
}
function v2RecordApplyPlayerStats(team,lines){
  const byId=new Map((team.roster||[]).map(p=>[String(p.id),p]));
  for(const row of lines||[]){const p=byId.get(String(row.id));if(!p)throw new Error(`${team.name} is missing v2 player ${row.id}.`);for(const [key,value] of Object.entries(row.stats||{}))p.stats[key]=(Number(p.stats[key])||0)+(Number(value)||0)}
}
function v2RecordArchiveContext(event){
  const api=globalThis.DynastyGameEngineV2Lab,from=event?.from;
  if(from?.down&&from?.distance){
    const n=Number(from.down),ord=n===1?'1st':n===2?'2nd':n===3?'3rd':n===4?'4th':String(n),p=Number(from.fieldPosition),field=p===50?'50':p<50?`own ${p}`:`opp ${100-p}`;
    return`${ord} & ${from.distance} at ${field}`
  }
  return api?.downLabel?api.downLabel(event?.state||{}):''
}
function v2RecordArchiveText(event,names){
  const api=globalThis.DynastyGameEngineV2Lab,clock=api?.clockLabel?api.clockLabel(event?.state||{}):'',context=v2RecordArchiveContext(event),text=api?.eventText?api.eventText(event,names):String(event?.type||'play');
  return[clock,context,text].filter(Boolean).join(' · ')
}
function v2RecordDriveArchive(preview){
  const events=preview?.state?.events||[],names=preview?.names||{},counts={home:0,away:0},drives=[];let drive=null;
  const valid=s=>s==='home'||s==='away';
  const finish=()=>{if(drive&&(drive.plays||drive.playByPlay.length)){if(!drive.result)drive.result='END';drives.push(drive)}drive=null};
  const start=(side,overtime=false)=>{if(valid(side))drive={side,label:`${side==='home'?'H':'A'}${++counts[side]}`,points:0,result:'',plays:0,overtime:!!overtime,playByPlay:[]}};
  for(const e of events){
    if(e.type==='kickoff'&&valid(e.receiver)){finish();start(e.receiver);continue}
    if(e.type==='overtime_possession'&&valid(e.possession)){finish();start(e.possession,true);continue}
    if(e.type==='possession_change'&&valid(e.to)){if(drive&&drive.side!==e.to)finish();if(!drive)start(e.to);continue}
    const side=valid(e.team)?e.team:null;if(side&&(!drive||drive.side!==side)){finish();start(side,(e.state?.period||0)>4)}if(!drive)continue;
    if(['scrimmage','interception','fumble'].includes(e.type)){drive.plays++;drive.playByPlay.push(v2RecordArchiveText(e,names));if(e.type==='interception')drive.result='INT';if(e.type==='fumble')drive.result='FUMBLE'}
    else if(e.type==='coaching_decision'){drive.playByPlay.push(v2RecordArchiveText(e,names))}
    else if(e.type==='touchdown'){drive.points+=6;drive.result='TD';drive.playByPlay.push(v2RecordArchiveText(e,names))}
    else if(e.type==='extra_point'){if(e.made!==false)drive.points++;drive.playByPlay.push(v2RecordArchiveText(e,names))}
    else if(e.type==='two_point'){if(e.made)drive.points+=2;drive.playByPlay.push(v2RecordArchiveText(e,names))}
    else if(e.type==='field_goal'){if(e.made){drive.points+=3;drive.result='FG'}else drive.result='MISS';drive.playByPlay.push(v2RecordArchiveText(e,names))}
    else if(e.type==='punt'){drive.result='PUNT';drive.playByPlay.push(v2RecordArchiveText(e,names))}
    else if(e.type==='safety'){drive.points+=2;drive.result='SAFETY';drive.playByPlay.push(v2RecordArchiveText(e,names))}
  }
  finish();return drives.slice(-40)
}
// v0.12.6 compact play log for the Game Cast field replay. One short-key row per Engine 2 event:
// s seq, t type, sd side ('h'|'a'), q period, c clock after the event, p spot before the snap
// (or where a new possession starts) from that side's own goal line, dn/ds down and distance
// before the snap, y yards, k 'p' pass | 'r' rush, cp completed, sk sack, n punt net, tb touchback,
// fd/m field goal distance and made, sc score [home, away] after a scoring event, a actor ids.
const V2_PLAY_LOG_SCORING=new Set(['touchdown','extra_point','two_point','field_goal','safety','game_end']);
function v2PlayLogSide(e){const s=e.team||e.receiver||e.to||e.possession;return s==='home'?'h':s==='away'?'a':undefined}
function v2PlayLogProjection(state,attribution){
  const rows=[],actors=attribution?.playActors||{};let prev=null;
  for(const e of state?.events||[]){
    const st=e.state||{};
    if(e.type==='game_start'||e.type==='coaching_decision'){prev=st;continue}
    const row={s:e.seq,t:e.type},sd=v2PlayLogSide(e);if(sd)row.sd=sd;
    if(Number.isFinite(st.period))row.q=st.period;if(Number.isFinite(st.clock))row.c=st.clock;
    const before=e.from||prev||{};
    if(['scrimmage','interception','fumble','punt','field_goal'].includes(e.type)){
      if(Number.isFinite(before.fieldPosition))row.p=before.fieldPosition;
      if(before.down)row.dn=before.down;if(before.distance)row.ds=before.distance;
    }
    if(['scrimmage','interception','fumble'].includes(e.type)){
      row.y=Number(e.yards)||0;
      if(e.kind==='pass')row.k='p';else if(e.kind==='rush')row.k='r';
      if(e.completed)row.cp=1;if(e.sack)row.sk=1;
    }
    if(e.type==='kickoff'||e.type==='possession_change'||e.type==='overtime_possession'||e.type==='overtime_start'){if(Number.isFinite(st.fieldPosition))row.p=st.fieldPosition;if(e.type==='kickoff')row.tb=1}
    if(e.type==='possession_change'&&e.reason)row.r=e.reason;
    if(e.type==='punt'){row.n=Number(e.net)||0;if(e.touchback)row.tb=1}
    if(e.type==='field_goal'){row.fd=Number(e.distance)||0;if(e.made)row.m=1}
    if((e.type==='extra_point'||e.type==='two_point')&&e.made!==false)row.m=1;
    if(V2_PLAY_LOG_SCORING.has(e.type)&&st.score)row.sc=[st.score.home,st.score.away];
    const a=actors[e.seq];if(a&&Object.keys(a).length)row.a=a;
    rows.push(row);prev=st;
  }
  return rows;
}
// Kept for the user's games this season only; cleared at the season rollover.
function v2StorePlayLog(gameId,state,attribution){
  if(gameId==null||!state)return null;
  universe.playLogs??={};
  const rows=v2PlayLogProjection(state,attribution);
  universe.playLogs[gameId]=rows;return rows;
}
