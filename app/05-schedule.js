// app/05-schedule.js: Schedule validation, rivalries, rotation and game links. Part of app.js; see tools/app-source.js.
// --- v0.9.48 commit 1: a pure schedule validator ------------------------------
// Reports problems instead of throwing, and reads only what it is handed, so it can check
// a freshly built schedule, a loaded save, or an archived season without side effects.
const SCHEDULE_GAMES=12,SCHEDULE_CONF_GAMES=8,SCHEDULE_HOME_MIN=5,SCHEDULE_HOME_MAX=7;
function validateSchedule(u=universe){
 const problems=[],weeks=Array.isArray(u?.schedule)?u.schedule:[];
 if(!u?.teams?.length)return ['no teams to validate'];
 const byTeam=new Map(u.teams.map(t=>[t.name,[]]));
 weeks.forEach((games,wi)=>{
  const week=wi+1,seen=new Set();
  for(const g of games||[]){
   if(g.home===g.away){problems.push(`week ${week}: ${g.home} is scheduled against itself`);continue}
   for(const side of [g.home,g.away]){
    if(!byTeam.has(side)){problems.push(`week ${week}: unknown team "${side}"`);continue}
    if(seen.has(side))problems.push(`week ${week}: ${side} appears twice`);
    seen.add(side);byTeam.get(side).push(g);
   }
  }
 });
 const flat=weeks.flat(),shared=new Set(flat);
 for(const t of u.teams){
  const games=byTeam.get(t.name)||[];
  if(games.length!==SCHEDULE_GAMES)problems.push(`${t.name} plays ${games.length} games, expected ${SCHEDULE_GAMES}`);
  const conf=games.filter(g=>g.conf).length;
  if(conf!==SCHEDULE_CONF_GAMES)problems.push(`${t.name} plays ${conf} conference games, expected ${SCHEDULE_CONF_GAMES}`);
  const home=games.filter(g=>g.home===t.name).length;
  if(games.length&&(home<SCHEDULE_HOME_MIN||home>SCHEDULE_HOME_MAX))
   problems.push(`${t.name} has ${home} home games, outside ${SCHEDULE_HOME_MIN}-${SCHEDULE_HOME_MAX}`);
  // A conference opponent must never appear twice in one regular season.
  const confOpponents=games.filter(g=>g.conf).map(g=>g.home===t.name?g.away:g.home);
  const dupes=confOpponents.filter((x,i)=>confOpponents.indexOf(x)!==i);
  if(dupes.length)problems.push(`${t.name} plays ${[...new Set(dupes)].join(', ')} twice in conference`);
  // The rival is the whole point of a protected game; it must be on the schedule.
  const rival=t.rivalry?u.teams.find(x=>x.id===t.rivalry.rivalId):null;
  if(rival){
   const met=games.filter(g=>g.home===rival.name||g.away===rival.name).length;
   if(met!==1)problems.push(`${t.name} meets protected rival ${rival.name} ${met} times, expected 1`);
  }
  // The team's own schedule must hold the same objects the universe does, or a played
  // result would land on one view and not the other.
  for(const g of t.schedule||[])if(!shared.has(g))problems.push(`${t.name} holds a game the universe schedule does not`);
 }
 return problems;
}
// Which conference opponents a team has actually met, for rotation-coverage checks.
function conferenceOpponentsFor(u,teamName){
 const out=new Set();
 for(const g of (u?.schedule||[]).flat()){
  if(!g.conf)continue;
  if(g.home===teamName)out.add(g.away);
  else if(g.away===teamName)out.add(g.home);
 }
 // A greedy pass can still strand a few teams outside the bound. Flipping any game whose
 // host already has two more home dates than its guest strictly reduces the spread, so
 // repeating it converges instead of trading one violation for another.
 const count=new Map();
 for(const g of out)count.set(g.home,(count.get(g.home)||0)+1);
 const homeOf=n=>count.get(n)||0;
 for(let pass=0;pass<24;pass++){
  let moved=false;
  for(const g of out){
   if(homeOf(g.home)-homeOf(g.away)<2)continue;
   count.set(g.home,homeOf(g.home)-1);count.set(g.away,homeOf(g.away)+1);
   [g.home,g.away]=[g.away,g.home];
   moved=true;
  }
  if(!moved)break;
 }
 return out;
}
function nonConferenceOpponentsFor(u,teamName){
 const out=[];
 for(const g of (u?.schedule||[]).flat()){
  if(g.conf)continue;
  if(g.home===teamName)out.push(g.away);
  else if(g.away===teamName)out.push(g.home);
 }
 return out;
}

// Designation has to happen before the schedule is built, or round 0 is not the rivalry
// round. Geographic only, so it needs nothing from the schedule it is about to shape.
// Stored as an array so adding a second protected rivalry later is a data change, not a
// schema rewrite. Index 0 is the one the schedule reserves a round for today.
function primaryRivalId(t){return t?.protectedRivalIds?.[0]??null}
function setPrimaryRival(t,o){t.protectedRivalIds=[o.id]}
function ensureProtectedRivals(){
 const byId=new Map(universe.teams.map(t=>[t.id,t]));
 const dist=(a,b)=>haversineMiles(a.lat||0,a.lon||0,b.lat||0,b.lon||0);
 for(const c of allConfs()){
  const arr=universe.teams.filter(t=>t.conference===c);
  const taken=new Set();
  for(const t of arr){
   const o=byId.get(primaryRivalId(t));
   if(o&&primaryRivalId(o)===t.id&&o.conference===t.conference&&!taken.has(t.id)&&!taken.has(o.id)){taken.add(t.id);taken.add(o.id)}
   else if(primaryRivalId(t)&&!(o&&primaryRivalId(o)===t.id))t.protectedRivalIds=[];
  }
  const free=arr.filter(t=>!taken.has(t.id));
  const pairs=[];
  for(let i=0;i<free.length;i++)for(let j=i+1;j<free.length;j++)pairs.push({t:free[i],o:free[j],d:dist(free[i],free[j])});
  pairs.sort((a,b)=>a.d-b.d||a.t.id-b.t.id);
  for(const {t,o} of pairs){
   if(taken.has(t.id)||taken.has(o.id))continue;
   setPrimaryRival(t,o);setPrimaryRival(o,t);taken.add(t.id);taken.add(o.id);
  }
 }
}
// Existing saves already carry a derived rival; keep it where both sides agree rather than
// re-picking and orphaning a series' history. Anything left over is paired geographically.
function migrateProtectedRivals(){
 const byId=new Map(universe.teams.map(t=>[t.id,t]));
 for(const t of universe.teams){
  if(primaryRivalId(t)||!t.rivalry?.rivalId)continue;
  const o=byId.get(t.rivalry.rivalId);
  if(o&&o.rivalry?.rivalId===t.id&&o.conference===t.conference){setPrimaryRival(t,o);setPrimaryRival(o,t)}
 }
 ensureProtectedRivals();
}
function ensureScheduleRotation(){const r=universe.scheduleRotation??={season:0,lastHost:{}};r.season=Math.max(0,Math.round(Number(r.season)||0));r.lastHost??={};return r}
// The circle method pairs index i with len-1-i, so putting protected rivals in mirrored
// slots makes round 0 the rivalry round — the one round every season is guaranteed to use.
function conferenceRotationOrder(arr){
 const byId=new Map(arr.map(t=>[t.id,t])),used=new Set(),left=[],right=[];
 for(const t of arr){
  if(used.has(t.id))continue;
  const o=byId.get(primaryRivalId(t));
  if(o&&o.id!==t.id&&!used.has(o.id)){left.push(t);right.unshift(o);used.add(t.id);used.add(o.id)}
 }
 const rest=arr.filter(t=>!used.has(t.id));
 while(rest.length){left.push(rest.shift());if(rest.length)right.unshift(rest.shift())}
 return [...left,...right];
}
// Home/away is decided after the pairings exist, never inside them: whoever has fewer home
// games so far hosts, and an even split reverses the previous meeting's venue rather than
// repeating it. That is what keeps anyone from a third straight home game in a series.
function assignHomeAway(pairings,rotation){
 const homeCount=new Map(),seriesKey=(a,b)=>a.id<b.id?`${a.id}:${b.id}`:`${b.id}:${a.id}`;
 const out=[];
 for(const p of pairings){
  const ha=homeCount.get(p.a.id)||0,hb=homeCount.get(p.b.id)||0,key=seriesKey(p.a,p.b);
  let host;
  if(ha!==hb)host=ha<hb?p.a:p.b;
  else{const last=rotation.lastHost[key];host=last===p.a.id?p.b:last===p.b.id?p.a:((p.a.id+p.b.id+rotation.season)%2===0?p.a:p.b)}
  const guest=host===p.a?p.b:p.a;
  homeCount.set(host.id,(homeCount.get(host.id)||0)+1);
  rotation.lastHost[key]=host.id;
  out.push({week:p.week,home:host.name,away:guest.name,conf:!!p.conf,played:false});
 }
 // The greedy pass above still strands a few teams, because it can only see the games it has
 // placed so far. Flipping any game whose host already holds two more home dates than its
 // guest strictly narrows the spread, so repeating it converges rather than trading one
 // violation for another.
 const tally=new Map();
 for(const g of out)tally.set(g.home,(tally.get(g.home)||0)+1);
 const homeOf=n=>tally.get(n)||0;
 for(let pass=0;pass<24;pass++){
  let moved=false;
  for(const g of out){
   if(homeOf(g.home)-homeOf(g.away)<2)continue;
   tally.set(g.home,homeOf(g.home)-1);tally.set(g.away,homeOf(g.away)+1);
   const host=g.away,guest=g.home;g.home=host;g.away=guest;
   moved=true;
  }
  if(!moved)break;
 }
 return out;
}
function buildSchedule(){
 universe.teams.forEach(t=>t.schedule=[]);
 universe.schedule=Array.from({length:12},()=>[]);
 ensureProtectedRivals();
 const rotation=ensureScheduleRotation(),season=rotation.season,cn=allConfs(),pairings=[];
 // Weeks 1-4, nonconference. The conference pairing and the offset within it both advance
 // with the season, so a dynasty stops replaying the same four opponents forever.
 for(let w=0;w<4;w++)circlePair(cn,(w+season)%cn.length).forEach(([ca,cb])=>{
  const A=universe.teams.filter(t=>t.conference===ca),B=universe.teams.filter(t=>t.conference===cb);
  if(!A.length||!B.length)return;
  for(let i=0;i<Math.min(A.length,B.length);i++){
   const j=(i+w+season*3)%B.length;
   pairings.push({week:w+1,a:A[i],b:B[j],conf:false});
  }
 });
 // Weeks 5-12, conference. Round 0 is the rivalry round and always plays, in the final week;
 // the other seven rotate through rounds 1-10 so every opponent comes round within a cycle.
 for(const c of allConfs()){
  const arr=universe.teams.filter(t=>t.conference===c);
  if(arr.length<2||arr.length%2)continue;
  const order=conferenceRotationOrder(arr),rounds=arr.length-1,spare=rounds-1;
  const chosen=[];
  for(let k=0;k<Math.min(7,spare);k++)chosen.push(1+((season*7+k)%spare));
  chosen.forEach((r,idx)=>circlePair(order,r).forEach(([a,b])=>pairings.push({week:5+idx,a,b,conf:true})));
  circlePair(order,0).forEach(([a,b])=>pairings.push({week:5+chosen.length,a,b,conf:true}));
 }
 for(const g of assignHomeAway(pairings,rotation))universe.schedule[g.week-1].push(g);
 universe.schedule.flat().forEach(g=>{T(g.home)?.schedule.push(g);T(g.away)?.schedule.push(g)});
 rotation.season=season+1;
}
// Immutable game snapshots. Sparse player deltas retain only actual game production.
function beginGame(home,away,neutral,context={}){
 // All simulation paths enter here after weekly recovery. Charge preparation once,
 // before profiles are measured, so rest cannot erase its cost before kickoff.
 applyGameplanWear(home,away.name);applyGameplanWear(away,home.name);
 const side=(t,opp)=>({id:t.id,name:t.name,rank:t.rank,record:`${t.w}-${t.l}`,gameplan:gameplanSnapshot(t,opp.name),players:new Map(t.roster.map(p=>[p.id,{stats:{...p.stats},injuries:p.injuryHistory?.length||0}]))});
 return {season:universe.year,week:context.week??universe.week+1,phase:universe.phase,label:context.label||'Regular season',venue:neutral?'Neutral site':`${home.name} · ${home.city||''}`,home:side(home,away),away:side(away,home)};
}
function finishGame(before,home,away,result){
 universe.gameArchive??=[];universe.gameArchiveVersion??=1;universe.gameCounter=(universe.gameCounter||0)+1;
 const id=`G${before.season}_${universe.gameCounter}`,players={},injuries=[];
 for(const [side,t] of [['home',home],['away',away]]){
  players[side]=[];
  for(const p of t.roster){const old=before[side].players.get(p.id),stats={};if(!old)continue;
   for(const k of Object.keys(p.stats)){const delta=(p.stats[k]||0)-(old.stats[k]||0);if(delta)stats[k]=delta}
   if(Object.keys(stats).length)players[side].push({id:p.id,name:p.name,pos:p.pos,stats});
   for(const injury of (p.injuryHistory||[]).slice(old.injuries))injuries.push({playerId:p.id,name:p.name,school:t.name,type:injury.type,weeks:injury.weeks});
  }
  delete before[side].players;
 }
 const record={id,...before,final:true,score:{home:result.hp,away:result.ap},teamStats:JSON.parse(JSON.stringify(result.box)),playerStats:players,injuries,drives:result.drives||[],detailed:!!result.detailed};
 record.scoreAdjustment={};for(const s of ['home','away']){const b=record.teamStats[s];record.scoreAdjustment[s]=record.score[s]-((b.passTD+b.rushTD)*7+b.fgMade*3)}
 record.formerPlayers=[];for(const [side,t,opp] of [['home',home,away],['away',away,home]])for(const p of t.roster)if(record.playerStats[side].some(x=>x.id===p.id)&&(p.transferHistory||[]).some(x=>x.fromSchoolId===opp.id))record.formerPlayers.push({id:p.id,name:p.name,school:t.name,formerSchool:opp.name});
 const controlled=selected(),side=controlled===home?'home':controlled===away?'away':null;
 if(side&&globalThis.DynastyPlayerArcs){
  const first=DynastyPlayerArcs.firstStart(controlled,players[side]);
  if(first)record.firstStart=result.firstStart=first;
 }
 universe.gameArchive.push(record);result.gameId=id;
 // Compact ledger reference; boxes, names and scores have one canonical snapshot.
 universe.events??=[];universe.events.push({id:`EVT_${id}`,type:before.label==='National Championship'?'CHAMPIONSHIP_WON':'GAME_COMPLETED',season:before.season,week:before.week,schoolIds:[home.id,away.id],playerIds:record.formerPlayers.map(p=>p.id),coachIds:[],gameIds:[id],importance:before.label==='National Championship'?95:30,summary:`${result.away} ${result.ap} – ${result.hp} ${result.home}`});
 return result;
}
const gameEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function gameLink(id,label='Open Game Center',tab='Summary',primary=false){return id?`<button type="button" class="game-link${primary?' game-link--primary':''}" data-game="${gameEscape(id)}" data-game-tab="${gameEscape(tab)}">${gameEscape(label)}</button>`:'<span class="muted">Box score unavailable (older save)</span>'}
function gameResultActions(id){return id?`<div class="game-result-actions">${universe.playLogs?.[id]?gameLink(id,'▶ Watch Replay','Watch',true):''}${gameLink(id,'View Box Score','Box Score',true)}${gameLink(id,'Full Game Center')}</div>`:'<span class="muted">Box score unavailable (older save)</span>'}
function gameSortCompare(a,b){const av=a??'',bv=b??'',an=Number(av),bn=Number(bv),numeric=av!==''&&bv!==''&&Number.isFinite(an)&&Number.isFinite(bn);return numeric?an-bn:String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'})}
function gameTable(headers,rows,{sortable=false,defaultSort=null}={}){
 const ordered=defaultSort==null?rows:[...rows].sort((a,b)=>gameSortCompare(b[defaultSort],a[defaultSort])||gameSortCompare(a[0],b[0]));
 const head=headers.map((x,i)=>sortable?`<th class="sortable${i===defaultSort?' sorted':''}" aria-sort="${i===defaultSort?'descending':'none'}"${i===defaultSort?' data-dir="desc"':''}><button type="button" class="game-sort-button" data-game-sort="${i}" aria-label="${gameEscape(x)}" title="Sort by ${gameEscape(x)}">${gameEscape(x)}</button></th>`:`<th>${gameEscape(x)}</th>`).join('');
 const body=ordered.map(row=>`<tr>${row.map(x=>`<td data-sort-value="${gameEscape(x??'')}">${gameEscape(x??'—')}</td>`).join('')}</tr>`).join('');
 return `<div class="table-wrap game-table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
