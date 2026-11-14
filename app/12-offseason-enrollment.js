// app/12-offseason-enrollment.js: Enrollment, the late market, roster repair and history compaction. Part of app.js; see tools/app-source.js.
// A recruit becomes a rostered player the same way at signing day and in the late market.
function recruitOriginLabel(r){return `${r.stars}-star recruit from ${r.highSchool||r.homeRegion} (${r.homeCity||r.homeRegion}, ${r.homeState||''})${r.flippedFrom?` · flipped from ${r.flippedFrom}`:''}`}
function playerFromRecruit(r,t,origin=recruitOriginLabel(r)){const p=generatePlayer(t,r.pos,99);Object.assign(p,{name:r.name,style:r.style,trueNow:r.trueNow,upside:r.upside,perceived:r.scout,perceivedUpside:r.scoutUp,year:'FR',eligibilityUsed:0,redshirtUsed:false,redshirtActive:false,origin,promise:r.promise&&r.promise!=='None'?r.promise:null,promiseBaseline:r.scout,portraitSeed:r.portraitSeed||p.portraitSeed,portraitVersion:r.portraitVersion||PORTRAIT_VERSION,scoutConfidence:r.scoutConfidence??p.scoutConfidence,scoutingDomains:r.scoutingDomains?JSON.parse(JSON.stringify(r.scoutingDomains)):undefined,scoutingHistory:r.scoutingHistory?JSON.parse(JSON.stringify(r.scoutingHistory)):[]});return p}
// v0.12.29: roughly half the recruit pool is never signed, and it is not the weak half
// (an unsigned class averages the same trueNow as the signed one, 5-stars included).
// Walk-on top-ups draw from those named prospects first, best scouted grade at the
// needed position, with the controlled program's own targets ahead of the rest.
function takeLatePlayer(pool,t,pos,controlled){
 const cand=pool.filter(r=>r.pos===pos);if(!cand.length)return null;
 const mine=t.name===controlled;
 cand.sort((a,b)=>((mine&&b.targeted?1:0)-(mine&&a.targeted?1:0))||b.scout-a.scout);
 const r=mine&&cand[0].targeted?cand[0]:pick(cand.slice(0,3));pool.splice(pool.indexOf(r),1);
 const p=playerFromRecruit(r,t,`Unsigned ${r.stars}-star prospect from ${r.highSchool||r.homeRegion} (${r.homeCity||r.homeRegion}, ${r.homeState||''}) · late addition`);
 p.year='FR';p.jerseyNumber=jerseyFor(p.pos,p.portraitSeed);p.redshirtSeason=null;p.lateAddition=true;
 return p;
}
function offseasonEnrollment(){
 const os=normalizeOffseasonState();
 if(offseasonPhaseDone('signing')){if(os.phase==='signing')os.phase='portal';return true}
 const controlled=$('#userTeam').value,teams={};
 for(const t of universe.teams){
  const signed=universe.recruits.filter(r=>r.committed===t.name).slice(0,Math.max(0,105-t.roster.length));
  signed.forEach(r=>{
   if(t.name===controlled){firstRecruitEvaluation(r,t);snapshotScouting(r,t,'SIGNING_DAY','RECRUITING',true)}
   const p=playerFromRecruit(r,t);
   p.jerseyNumber=jerseyFor(p.pos,p.portraitSeed);signPlayerPromise(p,r,t);const developmentPromise=(p.promises||[]).find(q=>q.type==='DEVELOPMENT_PLAN'&&q.status==='ACTIVE');if(developmentPromise)p.trainingFocus=developmentPromise.expectedFocus;p.recruitingMemory=r.recruitingMemory;p.primaryRecruiterCoachId=r.primaryRecruiterCoachId||r.recruitingMemory?.primaryRecruiterCoachId||r.recruitingMemory?.recruiterCoachId||null;p.coachRelationships={...(r.coachRelationships||r.recruitingMemory?.coachRelationships||{})};p.coachDeparturePressure=r.coachDeparturePressure?{...r.coachDeparturePressure}:null;p.transferHistory=[];ensurePlayerDevelopment(p,t);t.roster.push(p);
   recordRosterMove(t,p,'signees');
   const hs=(universe.highSchools||[]).find(h=>h.id===r.highSchoolId);if(hs)hs.d1Signees=(hs.d1Signees||0)+1;
   t.pipelines[r.homeRegion]=clamp(pipelineStrength(t,r.homeRegion)+gi(1,3),0,100);
  });
  for(const c of Object.keys(t.pipelines))if(!signed.some(r=>r.homeRegion===c))t.pipelines[c]=clamp(t.pipelines[c]-1,5,100);
  teams[t.id]={signed:signed.length};
 }
 const movement=[];
 const departures=os.reports.departures?.teams||{},review=os.reports.review?.teams||{};
 const controlledTeam=universe.teams.find(t=>t.name===controlled);
 if(controlledTeam){
  const d=departures[controlledTeam.id]?.exits||0,s=teams[controlledTeam.id]?.signed||0,p=review[controlledTeam.id]?.prestigeDelta||0;
  movement.push(`${d} players left for the draft/eligibility; ${s} signees joined; ${p>=0?'+':''}${p} prestige.`);
 }
 os.reports.movement=movement;
 autosaveAfter('signing'),finishOffseasonPhase('signing','portal',teams);
 return true;
}
// An entrant nobody wants either stays at his school or leaves football; leaving
// the roster is the only way a portal class can shrink.
const PORTAL_RETURN_CHANCE=.65;
function resolveUnplacedPortal(entry){
 const {p}=entry,from=universe.teams.find(t=>t.id===entry.fromSchoolId)||T(entry.from);
 if(!from)return null;
 const alreadyHome=from.roster.some(player=>player.id===p.id);
 if(gameplayRandom()<PORTAL_RETURN_CHANCE&&(alreadyHome||from.roster.length<105)){
  if(!alreadyHome){from.roster.push(p);recordRosterMove(from,p,'portalIn')}
  p.morale=clamp((p.morale??70)-8,20,99);p.staffTrust=clamp((p.staffTrust??70)-5,0,99);
  return {outcome:'returned',team:from};
 }
 from.roster=from.roster.filter(x=>x.id!==p.id);
 addToArchive(p,from,'No landing spot');
 return {outcome:'exited',team:from};
}
// One portal outcome for the coach's program: a player of his leaving (out), one returning or leaving football after
// finding no landing spot, or a player arriving (in). Presentation only; the move itself is already made.
function portalDayNote(x,destName,unplaced){
 const pd=universe.portalDay,me=$('#userTeam')?.value;if(!pd?.collecting||!x?.p||!me)return;
 const kind=unplaced?(unplaced==='returned'?'returned':'left'):destName===me?'in':x.from===me?'out':null;if(!kind||(kind!=='in'&&x.from!==me))return;
 if(pd.board.some(b=>b.playerId===x.p.id))return;
 pd.board.push({playerId:x.p.id,name:x.p.name,pos:x.p.pos,from:x.from,to:destName||null,kind,reason:transferReasonLabel(x.reason)});
}
function offseasonPortal(){
 const os=normalizeOffseasonState();
 if(offseasonPhaseDone('portal')){if(os.phase==='portal')os.phase='spring';return true}
 // v0.26: every portal outcome that touches the coach's program is kept so the offseason stop can announce them in turn.
 universe.portalDay={year:universe.year,board:[],revealed:0,collecting:true};
 // Place announced decisions before the draft or any fallback draws, exactly as the Finalize button does.
 if((universe.transferPortal||[]).some(x=>x.decision)){
  const {blocked}=resolvePortalCommitments();
  for(const b of blocked)portalLog(`Commitment reopened (${b.reason}): ${portalEntry(b.candidateId)?.p.name||'transfer'} returns to the available field.`);
 }
 const controlled=$('#userTeam').value,movement=[...(os.reports.movement||[])];
 const draftPool=(os.reports.departures?.draftPool||[]).map(d=>({...d,t:universe.teams.find(x=>x.id===d.teamId)||d.t}));runDraft(draftPool);
 const portal=[...(universe.transferPortal||[])];universe.transferPortal=[];
 let placedCount=universe.portalCycle?.year===universe.year?(universe.portalCycle.finalizedCount||0):0,returnedCount=0,exitedCount=0;
 portal.forEach(x=>{x.p.stats=newStats();x.p.year=CLASS_NAMES[Math.min(3,eligibilityBase(x.p))]||'SR';const dest=placeTransfer(x);
  if(dest){placedCount++;portalDayNote(x,dest.name);if(x.from===controlled||dest.name===controlled)movement.push(`${x.p.pos} ${x.p.name}: ${x.from} → ${dest.name} (${transferReasonLabel(x.reason)})`);return}
  const outcome=resolveUnplacedPortal(x);
  if(!outcome){universe.transferPortal.push(x);return}
  portalDayNote(x,null,outcome.outcome);
  if(outcome.outcome==='returned'){returnedCount++;if(x.from===controlled)movement.push(`${x.p.pos} ${x.p.name}: no landing spot, returned to ${x.from}`)}
  else{exitedCount++;if(x.from===controlled)movement.push(`${x.p.pos} ${x.p.name}: no landing spot, left the program`)}
 });
 if(universe.portalCycle?.year===universe.year&&universe.portalCycle.status==='open'){
  universe.portalCycle.status='resolved';
  portalLog('Offseason advanced. Remaining transfers resolved.');
 }
 if(universe.portalDay){const pd=universe.portalDay,order={out:0,returned:1,left:2,in:3};pd.board.sort((x,y)=>order[x.kind]-order[y.kind]);delete pd.collecting}
 updateCareerRecords();
 movement.push(...(os.reports.review?.carouselLog||[]).filter(x=>x.includes(controlled)));
 universe.movementLog=movement.slice(0,100);
 autosaveAfter('portal'),finishOffseasonPhase('portal','spring',{placed:placedCount,pending:universe.transferPortal.length,returned:returnedCount,exited:exitedCount});
 return true;
}
// v0.12.21: the yearly walk-on top-up repairs positional scarcity. Measured over
// three seasons, random fill left thin kicker/punter depth growing 0 -> 7 -> 38
// team-seasons, and a program could end a season with no kicker at all.
function scarcePosition(t){
 const counts={};for(const p of t.roster)counts[p.pos]=(counts[p.pos]||0)+1;
 let best=null,deficit=0;
 for(const pos of POS){const gap=(POS_COUNTS[pos]||4)-(counts[pos]||0);if(gap>deficit){deficit=gap;best=pos}}
 return best;
}
// Filling to 85 was never enough: a program sits at 85 with a skewed shape, so the
// top-up never ran and kicker depth still decayed. Repair swaps a surplus walk-on
// for the missing position, recording the cut like any other roster cut.
// A missing kicker or punter is unplayable; general depth is not. Critical
// positions are repaired first, so repair never spends its swaps on soft depth.
const CRITICAL_FLOOR={QB:2,K:2,P:2};
function criticalPosition(t){
 const counts={};for(const p of t.roster)counts[p.pos]=(counts[p.pos]||0)+1;
 for(const pos of Object.keys(CRITICAL_FLOOR))if((counts[pos]||0)<CRITICAL_FLOOR[pos])return pos;
 return null;
}
function repairRosterShape(t,receipt){
 const count=pos=>t.roster.filter(p=>p.pos===pos).length;
 for(let guard=0;guard<6;guard++){
  const need=criticalPosition(t);if(!need)break;
  let donor=null,excess=0;
  for(const pos of POS){const gap=count(pos)-(POS_COUNTS[pos]||4);if(pos!==need&&gap>excess){excess=gap;donor=pos}}
  if(!donor||excess<1)break;
  const victim=t.roster.filter(p=>p.pos===donor).sort((a,b)=>a.trueNow-b.trueNow)[0];
  if(!victim)break;
  t.roster=t.roster.filter(p=>p.id!==victim.id);
  addToArchive(victim,t,'Roster cut');recordRosterMove(t,victim,'cuts',receipt);
  const added=generateFreshman(t,need);t.roster.push(added);recordRosterMove(t,added,'walkOns',receipt);
 }
}
// v0.15.1 — events are the one part of the core save that grows without limit (about 2 MB a season, 80% of it two
// story types written for every player in the league). Past the horizon those stories keep everything a reader
// shows (id, season, week, type, school, player, game, story id and summary) and drop metadata that only repeats
// the summary or the player record. The camp report kept for each season is never read back; past the horizon it
// keeps the rows and drops the zero deltas.
const EVENT_DETAIL_HORIZON=3,SLIM_EVENT_TYPES=new Set(['COLLEGE_CAREER_ENDED','PLAYER_BREAKOUT']);
function slimEvent(e){
 if(!e||e.slim||!SLIM_EVENT_TYPES.has(e.type)||!e.metadata)return false;
 const keep={storyType:e.metadata.storyType};if(e.metadata.phase!=null)keep.phase=e.metadata.phase;
 if(e.storyId==null&&e.metadata.storyId!=null)e.storyId=e.metadata.storyId;
 e.metadata=keep;e.slim=true;return true;
}
function slimCampReport(rows){
 let n=0;
 for(const r of Array.isArray(rows)?rows:[]){
  if(!r||typeof r!=='object')continue;
  for(const [k,v] of Object.entries(r)){
   if(v===0){delete r[k];n++}
   else if(v&&typeof v==='object'&&!Array.isArray(v)){for(const [a,x] of Object.entries(v))if(x===0){delete v[a];n++}}
  }
 }
 return n;
}
function compactHistoryArchive({horizon=EVENT_DETAIL_HORIZON}={}){
 const cutoff=universe.year-horizon;let events=0,dropped=0,camps=0;
 // A finished career is already on the archived record (name, last team, exit reason, year), and the career
 // timeline draws the line from there when the event is gone. Programs the coach has led keep theirs, so the
 // school's story history stays whole wherever the coach has been.
 const led=new Set([$('#userTeam')?.value,universe.tenure?.school,...(universe.careerHistory||[]).map(x=>x.school)].filter(Boolean));
 const ledIds=new Set(universe.teams.filter(t=>led.has(t.name)).map(t=>t.id));
 if(Array.isArray(universe.events)){
  const kept=[];
  for(const e of universe.events){
   if((e?.season??universe.year)<=cutoff){
    if(e?.type==='COLLEGE_CAREER_ENDED'&&!(e.schoolIds||[]).some(id=>ledIds.has(id))){dropped++;continue}
    if(slimEvent(e))events++;
   }
   kept.push(e);
  }
  if(dropped)universe.events=kept;
 }
 for(const [year,ds] of Object.entries(universe.campHistory||{})){
  if(Number(year)>cutoff||!ds||ds.slim)continue;
  slimCampReport(ds.springReport);slimCampReport(ds.fallReport);ds.slim=true;camps++;
 }
 return {events,dropped,camps};
}
function offseasonPreseason(){
 const os=normalizeOffseasonState(),ds=ensureDevelopmentState();
 if(!offseasonPhaseDone('spring')||!offseasonPhaseDone('fall')){setStatus('Complete spring development and fall camp first.');return false}
 universe.campHistory[universe.year]=JSON.parse(JSON.stringify(ds));
 const compacted=compactGameArchive();
 const historyCompacted=compactHistoryArchive();
 if(historyCompacted.events||historyCompacted.dropped){universe.compactionManifest??=[];const last=universe.compactionManifest.at(-1);const row=last?.at===universe.year?last:(universe.compactionManifest.push({at:universe.year,cutoff:universe.year-EVENT_DETAIL_HORIZON,games:0,dropped:0}),universe.compactionManifest.at(-1));row.events=historyCompacted.events;row.eventsDropped=historyCompacted.dropped}
 if(compacted.games&&currentArchiveState())currentArchiveState().gamesDirty=true;
 const latePool=(universe.recruits||[]).filter(r=>!r.committed),lateControlled=$('#userTeam').value,latePoolSize=latePool.length;
 universe.year++;universe.week=0;resetNilSeason();universe.recoveredWeek=-1;universe.phase='regular';universe.latest=[];universe.confChamps=[];universe.playoffFieldIds=[];universe.playoffFieldUnavailable=false;universe.academicProgression={season:universe.year,week:0,teamIds:[]};universe.champion=null;universe.lastDetailedGame=null;universe.playLogs={};rollRecruitClass();universe.recruitClassCounts={};
 universe.teams.forEach(t=>{t.w=t.l=t.cw=t.cl=t.pf=t.pa=t.sos=0;t.rank=null;t.champ=false;t.commits=[];while(t.roster.length<85){const need=criticalPosition(t)||scarcePosition(t)||pick(POS),p=takeLatePlayer(latePool,t,need,lateControlled)||generateFreshman(t,need);t.roster.push(p);recordRosterMove(t,p,'walkOns',os.reports.roster?.[t.id])}repairRosterShape(t,os.reports.roster?.[t.id]);if(t.roster.length>105){const keep=t.roster.sort((a,b)=>b.trueNow-a.trueNow).slice(0,105),cut=t.roster.filter(p=>!keep.includes(p));for(const p of cut){addToArchive(p,t,'Roster cut');recordRosterMove(t,p,'cuts',os.reports.roster?.[t.id])}t.roster=keep}autoRedshirts(t);autoDepthTeam(t,false);autoRoleDepth(t,false)});applyEarlyCommitments();
 if(os.reports.roster)universe.lastOffseasonRecap={year:os.year,teams:Object.fromEntries(universe.teams.filter(t=>os.reports.roster[t.id]).map(t=>[t.id,offseasonReceiptView(t,os.reports.roster[t.id],os.year,true)]))};
 universe.lateMarket={year:universe.year,pool:latePoolSize,placed:latePoolSize-latePool.length};
 normalizePromiseState();universe.developmentState={year:universe.year,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]};universe.offseasonDone=false;buildSchedule();ranked();buildPreseasonHub();autosaveAfter('preseason');
 return true;
}
function advanceOffseasonPhase(){
 if(universe.phase!=='complete')return false;
 const os=normalizeOffseasonState();
 const gate=guidanceActionEligibility('offseason-phase');
 if(os.phase!=='review'&&!gate.allowed){setStatus(gate.blockers[0]?.message||'Choose your next job before advancing the offseason.');return false}
 // Review and departures change the calendar like every other phase, so they checkpoint too (they used to leave the
 // desk reading 'Not saved' until the next phase).
 if(os.phase==='review'){const ok=offseasonReview();if(ok)autosaveAfter('postseason');return ok}
 if(os.phase==='departures'){const ok=offseasonDepartures();if(ok)autosaveAfter('postseason');return ok}
 if(os.phase==='signing')return offseasonEnrollment();
 if(os.phase==='portal')return offseasonPortal();
 if(os.phase==='preseason')return offseasonPreseason();
 setStatus(os.phase==='spring'?'Run spring development next.':'Run fall camp next.');
 return false;
}
function advanceOffseasonTo(target){
 for(let i=0;i<OFFSEASON_PHASES.length&&universe.phase==='complete'&&normalizeOffseasonState().phase!==target;i++)if(!advanceOffseasonPhase())break;
 return normalizeOffseasonState().phase===target;
}
const runPreCalendarSpringCamp=runSpringCamp,runPreCalendarFallCamp=runFallCamp;
function calendarSpringCamp(){
 if(universe.phase!=='complete'){setStatus('Finish the season before spring development.');return}
 if(archiveIsDeferred())return storageOperation(async()=>{await ensureArchiveLoaded();calendarSpringCamp()});
 if(!advanceOffseasonTo('spring'))return;
 const os=normalizeOffseasonState();
 if(offseasonPhaseDone('spring')){os.phase='fall';render();return}
 runPreCalendarSpringCamp();
 if(ensureDevelopmentState().springRun)developmentResultsPhase='SPRING',developmentResultsFilter='ALL',autosaveAfter('camp'),finishOffseasonPhase('spring','fall',{rosterSize:universe.teams.reduce((n,t)=>n+t.roster.length,0)});
 render();
}
function calendarFallCamp(){
 if(universe.phase!=='complete'){setStatus('Finish the season before fall camp.');return}
 const os=normalizeOffseasonState();
 if(os.phase==='spring'){setStatus('Run spring development first.');return}
 if(os.phase!=='fall'){setStatus('Complete the earlier offseason phases first.');return}
 if(offseasonPhaseDone('fall')){os.phase='preseason';render();return}
 runPreCalendarFallCamp();
 if(ensureDevelopmentState().fallRun)developmentResultsPhase='FALL',developmentResultsFilter='ALL',autosaveAfter('camp'),finishOffseasonPhase('fall','preseason',{rosterSize:universe.teams.reduce((n,t)=>n+t.roster.length,0)});
 render();
}
function runOffseason(){
 if(universe.phase!=='complete')return;
 const needsGames=normalizeOffseasonState().phase==='preseason'&&gamesAreDeferred();
 if(archiveIsDeferred()||needsGames)return storageOperation(async()=>{
  if(archiveIsDeferred())await ensureArchiveLoaded();
  if(needsGames)await ensureGamesLoaded();
  advanceOffseasonPhase();render();
 });
 advanceOffseasonPhase();render();
}
runSpringCamp=calendarSpringCamp;
runFallCamp=calendarFallCamp;
// v0.9.1: move the same player object; preserve the reasons and relationships.
function captureRecruitment(r,t){
 const topFive=universe.teams.map(team=>({id:team.id,score:recruitPitch(team,r)})).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.id);
 const recruiter=assignPrimaryRecruiter(r,t,r.coachRelationships?.[r.primaryRecruiterCoachId]),recruiterId=recruiter?.id||t.staff.RC.id;return {season:universe.year,schoolId:t.id,topFiveSchoolIds:topFive,offerSchoolIds:[...new Set([t.id,r.promiseOffer?.schoolId].filter(x=>x!=null))],recruiterCoachId:recruiterId,primaryRecruiterCoachId:recruiterId,relationship:coachRelationshipValue(r,recruiterId,50),coachRelationships:{...(r.coachRelationships||{})},stars:r.stars,homeRegion:r.homeRegion,lat:r.lat,lon:r.lon};
}
function transferReason(p){return promisePenalty(p)>0?'BROKEN_PROMISE':(p.stats?.starts||0)<4?'PLAYING_TIME':'FRESH_START'}
function transferReasonLabel(reason){return {BROKEN_PROMISE:'Broken promise',PLAYING_TIME:'Playing opportunity',FRESH_START:'Fresh start',ROSTER_RELEASE:'Roster release'}[reason]||reason}
