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
    lastDetailedGame:v2RecordClone(universe.lastDetailedGame),latest:v2RecordClone(universe.latest||[]),rng:v2RecordClone(universe.rng),
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
  universe.lastDetailedGame=v2RecordClone(snapshot.lastDetailedGame);universe.latest=v2RecordClone(snapshot.latest);
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
