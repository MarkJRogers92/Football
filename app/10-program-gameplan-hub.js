// app/10-program-gameplan-hub.js: Program history, game plans, matchups and the weekly hub. Part of app.js; see tools/app-source.js.
// Every coach who has ever held a stint at this school, in order — works for any program, not just
// the one the player runs, because it reads the same careerHistory the coaching tree already reads.
function programCoachingLineage(t){
 if(!t)return [];
 const rows=[];
 for(const c of allKnownCoaches()){
  for(const s of (c.careerHistory||[]).filter(s=>s.schoolId===t.id))
   rows.push({coachId:c.id,name:c.name,role:s.role,startSeason:s.startSeason,endSeason:s.endSeason,reasonEnded:s.reasonEnded});
 }
 return rows.sort((a,b)=>b.startSeason-a.startSeason||(b.endSeason??9999)-(a.endSeason??9999));
}
function programHistoryHTML(t){
 if(!t)return '';
 const r=ensureAllTimeRecord(t),pct=r.w+r.l?((r.w/(r.w+r.l))*100).toFixed(1):'—';
 const lineage=programCoachingLineage(t).slice(0,12).map(s=>
  `<div class="lineitem"><span>${s.name}<div class="small muted">${s.role}</div></span><strong>${s.startSeason}${s.endSeason&&s.endSeason!==s.startSeason?`–${s.endSeason}`:s.endSeason?'':'–present'}${s.reasonEnded?`<div class="small muted">${s.reasonEnded}</div>`:''}</strong></div>`
 ).join('');
 return `<div class="muted" style="margin-bottom:8px">${r.w}-${r.l} (${pct}%) over ${r.seasons} tracked season${r.seasons===1?'':'s'} · ${r.confTitles} conference title${r.confTitles===1?'':'s'} · ${r.natTitles} national title${r.natTitles===1?'':'s'}. Seasons before tracking began are not included.</div>${lineage||'<div class="muted">No coaching stints on record yet.</div>'}`;
}
// One opponent, one week. Old full-scout saves still work; new plans expose
// component tradeoffs used by both quick simulation and the drive model.
const GAMEPLAN_TIERS={
 scout:{label:'Full scout',off:1.2,def:1.8,famCost:8,wearCost:3},
 balance:{label:'Balanced prep',off:.6,def:.9,famCost:3,wearCost:1},
 standard:{label:'Standard week',off:0,def:0,famCost:0,wearCost:0},
 stop_run:{label:'Stop the run',off:0,def:0,front:6,coverage:-4,famCost:8,wearCost:3},
 protect_pass:{label:'Protect against the pass',off:0,def:0,front:-4,coverage:6,famCost:8,wearCost:3},
 pressure:{label:'Pressure the QB',off:0,def:0,front:0,coverage:-3,pressure:.035,famCost:8,wearCost:3}
};
function teamGameplanFor(t,opponentName){
 const g=t?.gameplan;
 return (g&&g.year===universe.year&&g.week===universe.week&&g.opponent===opponentName)?g:null;
}
function applyGameplanEdge(profile,prep){
 const tier=GAMEPLAN_TIERS[prep];if(!tier||!profile)return profile;
 profile.offense=clamp(profile.offense+tier.off,35,99);
 profile.defense=clamp(profile.defense+tier.def,35,99);
 // Detailed drives use components rather than aggregate offense/defense.
 for(const [key,delta] of Object.entries({qb:tier.off,skill:tier.off,ol:tier.off,front:(tier.front||0)+tier.def,coverage:(tier.coverage||0)+tier.def})){
  if(Number.isFinite(profile[key]))profile[key]=clamp(profile[key]+delta,20,99);
 }
 profile.prepPressure=tier.pressure||0;
 return profile;
}
function gameProfiles(t,opponentName){const p=profiles(t),g=teamGameplanFor(t,opponentName);return g?applyGameplanEdge(p,g.prep):p}
function matchupEdges(off,def,O,D){const defScheme=DEF_SCHEMES[def.defScheme];return {
 passGame:Math.round(O.qb*.55+O.skill*.45-D.coverage),
 runGame:Math.round(O.ol*.62+O.skill*.38-(D.front*.78+defScheme.run*.22)),
 passProtection:Math.round(O.ol-(D.front*.80+defScheme.pressure*.20+(D.prepPressure||0)*100))
}}
function gameMatchup(team,opponent){const teamProfile=gameProfiles(team,opponent.name),opponentProfile=gameProfiles(opponent,team.name);return {team,opponent,teamProfile,opponentProfile,teamEdges:matchupEdges(team,opponent,teamProfile,opponentProfile),opponentEdges:matchupEdges(opponent,team,opponentProfile,teamProfile)}}
function gameplanRecommendation(team,opponent,matchup=gameMatchup(team,opponent)){const pass=OFF_SCHEMES[opponent.offScheme].pass,e=matchup.opponentEdges;if(pass>=.54){if(e.passProtection<=-4)return{id:'pressure',reason:`Their pass protection grades ${e.passProtection}; attack it before routes develop.`};return{id:'protect_pass',reason:`Their ${Math.round(pass*100)}% pass tendency makes coverage the larger threat.`}}if(pass<=.46)return{id:'stop_run',reason:`Their ${Math.round((1-pass)*100)}% run tendency puts the front at the center of the matchup.`};if(e.runGame>e.passGame+3)return{id:'stop_run',reason:`Their run-game edge (${e.runGame}) is stronger than their pass-game edge (${e.passGame}).`};if(e.passGame>e.runGame+3)return{id:'protect_pass',reason:`Their pass-game edge (${e.passGame}) is stronger than their run-game edge (${e.runGame}).`};return{id:'balance',reason:'Neither offensive matchup has a decisive edge.'}}
function matchupEdgeLabel(v){return v>=8?'Strong advantage':v>=3?'Advantage':v<=-8?'Major concern':v<=-3?'Disadvantage':'Even'}
function applyGameplanWear(t,opponentName){
 const g=teamGameplanFor(t,opponentName),tier=GAMEPLAN_TIERS[g?.prep];
 if(!tier||!Array.isArray(g.wearPending)||g.wearApplied)return;
 for(const id of g.wearPending){const p=t.roster.find(p=>p.id===id);if(p)p.wear=clamp((p.wear||0)+tier.wearCost,0,100)}
 g.wearApplied=true;
}
function gameplanSnapshot(t,opponentName){
 const g=teamGameplanFor(t,opponentName),tier=GAMEPLAN_TIERS[g?.prep];
 return {prep:tier?g.prep:'standard',label:tier?.label||'Standard week'};
}
function weeklyGameplanDecision(t){
 const g=universe.schedule[universe.week]?.find(x=>!x.played&&(x.home===t.name||x.away===t.name));
 if(!g)return null;
 const oppName=g.home===t.name?g.away:g.home,opp=T(oppName);
 if(!opp||decisionRecent('WEEKLY_GAMEPLAN',`${t.name}_${oppName}_${g.week}`,0))return null;
 const installing=!!(schemeTransition(t,'off')||schemeTransition(t,'def'));
 const passShare=OFF_SCHEMES[opp.offScheme].pass,analysis=gameMatchup(t,opp),recommendation=gameplanRecommendation(t,opp,analysis),staffPick=recommendation.id;
 const cost=`3 wear for five key starters at kickoff${installing?'; costs 8 scheme-install familiarity':''}.`;
 return decisionRecord('WEEKLY_GAMEPLAN',t,null,`Gameplan for ${opp.name}`,
  `${opp.offScheme} / ${opp.defScheme} · ${opp.w}-${opp.l}. Scheme tendency: about ${Math.round(passShare*100)}% pass. ${recommendation.reason}`,
  [decisionOption('stop_run','Stop the run',`Stronger run front, weaker pass coverage. ${cost}`,staffPick==='stop_run'),
   decisionOption('protect_pass','Protect against the pass',`Tighter coverage, softer run front. ${cost}`,staffPick==='protect_pass'),
   decisionOption('pressure','Pressure the QB',`More pass pressure, weaker coverage if the throw gets away. ${cost}`),
   decisionOption('balance','Balanced prep',`Small all-around edge; 1 wear for five key starters at kickoff${installing?'; costs 3 scheme-install familiarity':''}.`,staffPick==='balance'),
   decisionOption('standard','Standard week','No special adjustment or extra wear.')],
  {},58);
}
function applyGameplanDecision(t,option){
 const g=universe.schedule[universe.week]?.find(x=>!x.played&&(x.home===t.name||x.away===t.name));
 if(!g||teamGameplanFor(t,g.home===t.name?g.away:g.home))return false;
 const oppName=g.home===t.name?g.away:g.home,tier=GAMEPLAN_TIERS[option.id];
 if(!tier)return false;
 t.gameplan={year:universe.year,week:universe.week,opponent:oppName,prep:option.id,wearPending:importantStarters(t).slice(0,5).map(p=>p.id),wearApplied:false};
 if(tier?.famCost){
  for(const side of ['off','def']){
   const tr=schemeTransition(t,side);
   if(tr)tr.familiarity=clamp(tr.familiarity-tier.famCost,0,100);
  }
 }
 return true;
}
function buildWeeklyHub(beforeRank=selected()?.rank||null){const u=selected(),items=[...pulledOfferHubItems(u),...coachOpeningHubItems(u),...coachFalloutHubItems(u),...promiseHubItems(u),...recordChaseHubItems(u),...rivalryHubItems(u),...adminHubItems(u),...careerHubItems(u),...(typeof milestoneHubItems==='function'?milestoneHubItems(u):[]),...bowlHubItems(u),...signingDayHubItems(),...(globalThis.DynastyRecruitingNews?.(u)||[]),...(globalThis.DynastyPlayerArcNews?.(u)||[]),...(globalThis.DynastyStaffAssignmentNews?.(u)||[]),...(globalThis.DynastyFacilityNews?.(u)||[]),...academicHubItems(u),...coachTreeHubItems(u),...newsHeadlineHubItem(u)],res=userWeekResult(u);if(res)items.push({type:res.win?'good-news':'bad-news',tab:'season',kicker:'FINAL',importance:res.win?50:60,gameId:res.gameId,main:`${res.win?'Win':'Loss'} ${res.userPts}–${res.oppPts} ${res.loc} ${res.opp}`,sub:res.label?`${res.label} · ${u.w}-${u.l} overall`:`${u.w}-${u.l} overall · ${u.cw}-${u.cl} conference`});if(beforeRank&&u.rank!==beforeRank)items.push({type:u.rank<beforeRank?'good-news':'alert',tab:'season',kicker:'RANKINGS',importance:45,main:`${u.rank<beforeRank?'Up':'Down'} to #${u.rank}`,sub:`Previous ranking: #${beforeRank}`});let inj=u.roster.filter(p=>(p.injuryHistory||[]).some(x=>x.year===universe.year&&x.week===universe.week)).slice(0,2);for(const p of inj)items.push({type:'bad-news',tab:'roster',player:p.id,kicker:'MEDICAL',importance:55,main:`${p.name}: ${p.injury}`,sub:`Expected absence: ${p.injuryWeeks} week${p.injuryWeeks===1?'':'s'}`});let commits=universe.recruits.filter(r=>r.committed===u.name&&r.commitWeek===universe.week).slice(0,3);for(const r of commits)items.push({type:'good-news',tab:'recruiting',recruit:r.id,kicker:'COMMITMENT',importance:40+r.stars*3,main:`${'★'.repeat(r.stars)} ${r.pos} ${r.name}`,sub:`#${r.nationalRank} nationally · ${r.homeCity}, ${r.homeState}`});let next=findUserGame();if(next){let opp=T(next.home===u.name?next.away:next.home);items.push({type:'action',tab:'gamelab',kicker:'NEXT UP',importance:48,main:`Week ${universe.week+1}: ${next.home===u.name?'vs':'@'} ${opp.name}`,sub:`${opp.w}-${opp.l} · #${opp.rank<=25?opp.rank:'—'} · ${opp.offScheme}`})}let risk=u.roster.map(p=>({p,r:transferRisk(p)})).sort((a,b)=>b.r-a.r)[0];if(risk?.r>=42)items.push({type:'alert',tab:'roster',player:risk.p.id,kicker:'LOCKER ROOM',importance:Math.min(80,Math.round(risk.r)),main:`${risk.p.name} transfer risk: ${Math.round(risk.r)}`,sub:`${risk.p.role} · morale ${risk.p.morale}`});for(const e of (universe.decommitLog||[]).filter(e=>e.year===universe.year&&e.week===universe.week&&(e.from===u.name||e.to===u.name)).slice(0,3))items.push(e.from===u.name?{type:'bad-news',tab:'recruiting',recruit:e.id,kicker:'DECOMMIT',importance:50+e.stars*3,main:`${'★'.repeat(e.stars)} ${e.pos} ${e.name}`,sub:e.to?`Flipped to ${e.to}`:'Reopened his recruitment'}:{type:'good-news',tab:'recruiting',recruit:e.id,kicker:'FLIP',importance:45+e.stars*3,main:`${'★'.repeat(e.stars)} ${e.pos} ${e.name}`,sub:`Flipped from ${e.from}`});let waver=universe.recruits.filter(r=>r.committed===u.name&&r.challenger&&r.pressure>0).sort((a,b)=>b.pressure-a.pressure)[0];if(waver)items.push({type:'alert',tab:'recruiting',recruit:waver.id,kicker:'WAVERING',importance:52,main:`${waver.name} hearing from ${waver.challenger}`,sub:`${'★'.repeat(waver.stars)} ${waver.pos} commit · target, visit or promise to hold him`});let hot=universe.recruits.filter(r=>r.targeted&&!r.committed).sort((a,b)=>b.interest-a.interest)[0];if(hot)items.push({type:'action',tab:'recruiting',recruit:hot.id,kicker:'TOP TARGET',importance:35,main:`${hot.name} · ${hot.interest}%`,sub:`#${hot.nationalRank} ${hot.pos} · ${hot.trend>0?'↑ '+hot.trend:hot.trend<0?'↓ '+Math.abs(hot.trend):'steady'}`});universe.weeklyHub=items.sort((a,b)=>(b.importance??40)-(a.importance??40)).slice(0,9)}

const GUIDANCE_STATE_VERSION=1,GUIDANCE_FAMILIARITY_MAX=3,GUIDANCE_RETURN_AFTER_MS=15*60*1000;
const GUIDANCE_CATEGORIES=new Set(['career','coach_desk','game_plan','roster_management','staffing','recruiting','monitoring']);
let guidanceReturnState=null;
function guidanceCalendarStamp(target=universe){
 const os=target?.phase==='complete'?(OFFSEASON_PHASES.includes(target?.offseason?.phase)?target.offseason.phase:'review'):'season';
 return `${target?.year??0}:${target?.phase||'none'}:${target?.week??0}:${os}`;
}
function normalizeGuidanceState(target=universe){
 const raw=target?.guidanceState,valid=raw?.version===GUIDANCE_STATE_VERSION&&raw.teams&&typeof raw.teams==='object'&&!Array.isArray(raw.teams),out={version:GUIDANCE_STATE_VERSION,teams:{}},currentStamp=guidanceCalendarStamp(target);
 for(const team of target?.teams||[]){
  const prior=valid&&raw.teams[String(team.id)]&&typeof raw.teams[String(team.id)]==='object'?raw.teams[String(team.id)]:{},familiarity={},deferred={};
  for(const category of GUIDANCE_CATEGORIES){const score=Number(prior.familiarity?.[category]);if(Number.isFinite(score)&&score>0)familiarity[category]=Math.min(GUIDANCE_FAMILIARITY_MAX,Math.floor(score))}
  for(const [id,record] of Object.entries(prior.deferred||{}).slice(-100))if(id.startsWith(`guidance:${team.id}:`)&&id.length<=240&&record?.stamp===currentStamp)deferred[id]={stamp:record.stamp};
  out.teams[String(team.id)]={familiarity,deferred};
 }
 target.guidanceState=out;return out;
}
function guidanceStateFor(t=selected(),target=universe){
 const state=target?.guidanceState?.version===GUIDANCE_STATE_VERSION?target.guidanceState.teams?.[String(t?.id)]:null;
 return state&&typeof state==='object'?state:{familiarity:{},deferred:{}};
}
function guidanceMutableStateFor(t=selected()){
 normalizeGuidanceState();return universe.guidanceState.teams[String(t.id)];
}
function guidanceRecordFamiliarity(category,t=selected()){
 if(!t||!GUIDANCE_CATEGORIES.has(category))return 0;
 const state=guidanceMutableStateFor(t),next=Math.min(GUIDANCE_FAMILIARITY_MAX,(Number(state.familiarity[category])||0)+1);
 state.familiarity[category]=next;autosaveAfter('guidance');return next;
}
function guidanceMarkFamiliar(id,t=selected()){
 const model=guidanceModel(t),item=[...(model.items||[]),...(model.snoozed||[])].find(x=>x.id===id);
 return item?guidanceRecordFamiliarity(item.category,t):0;
}
function snoozeGuidance(id,t=selected()){
 if(!t)return false;const item=guidanceModel(t).items.find(x=>x.id===id);
 if(!item||!['staff_recommendation','monitoring'].includes(item.meaning))return false;
 const state=guidanceMutableStateFor(t);state.deferred[id]={stamp:guidanceCalendarStamp()};autosaveAfter('guidance');return true;
}
function restoreGuidance(id,t=selected()){
 if(!t)return false;const state=guidanceMutableStateFor(t);if(!state.deferred[id])return false;
 delete state.deferred[id];autosaveAfter('guidance');return true;
}
function guidanceCurrentLabel(target=universe){
 if(openingPreseason(target))return `${target.year} preseason`;
 if(target?.phase==='regular')return `${target.year} · Week ${Number(target.week||0)+1}`;
 if(target?.phase==='complete')return `${target.year} offseason · ${guidanceOffseasonPhase()}`;
 return `${target?.year??''} · ${target?.phase||'dynasty'}`;
}
// Read recorded results only; a deferred postseason archive must never masquerade as
// a current result from a prior week, another program, or a future season.
function guidanceLastResult(t=selected()){
 if(!t||!universe||openingPreseason())return null;
 const phase=universe.phase,maxWeek=phase==='regular'?Number(universe.week)+1:phase==='confReady'?12:['bowlReady','playoffReady'].includes(phase)?13:17;
 const belongs=side=>side?.id!=null?String(side.id)===String(t.id):side?.name===t.name;
 const games=(universe.gameArchive||[]).filter(g=>g?.season===universe.year&&Number.isFinite(g.week)&&g.week<=maxWeek&&(belongs(g.home)||belongs(g.away))&&Number.isFinite(g.score?.home)&&Number.isFinite(g.score?.away));
 const archived=games.reduce((latest,g)=>!latest||g.week>=latest.week?g:latest,null);
 const scheduled=(t.schedule||[]).filter(g=>g?.played&&Number.isFinite(g.week)&&g.week<=Math.min(maxWeek,12)&&(g.season==null||g.season===universe.year)&&(g.home===t.name||g.away===t.name)&&Array.isArray(g.score)&&g.score.length===2&&g.score.every(Number.isFinite)).sort((a,b)=>b.week-a.week)[0];
 if(gamesAreDeferred()&&!['preseason','regular','confReady'].includes(phase))return null;
 let result;
 if(archived&&(!scheduled||archived.week>=scheduled.week)){
  const home=belongs(archived.home);result={gameId:archived.id,week:archived.week,label:archived.label||'Game',opponent:home?archived.away.name:archived.home.name,userPts:home?archived.score.home:archived.score.away,oppPts:home?archived.score.away:archived.score.home};
 }else if(scheduled){
  const home=scheduled.home===t.name;result={gameId:scheduled.gameId||null,week:scheduled.week,label:'Regular season',opponent:home?scheduled.away:scheduled.home,userPts:home?scheduled.score[1]:scheduled.score[0],oppPts:home?scheduled.score[0]:scheduled.score[1]};
 }
 return result?{...result,programId:t.id,year:universe.year,outcome:result.userPts>result.oppPts?'Win':result.userPts<result.oppPts?'Loss':'Tie'}:null;
}
function guidanceWelcomeBack(savedAt,t=selected(),loadedAt=Date.now()){
 const saved=Date.parse(savedAt),elapsed=loadedAt-saved;if(!t||!Number.isFinite(saved)||!Number.isFinite(loadedAt)||elapsed<GUIDANCE_RETURN_AFTER_MS)return null;
 const model=guidanceModel(t),counts={required:model.items.filter(x=>x.meaning==='must_resolve').length,due:model.items.filter(x=>x.meaning==='decision_due').length,recommended:model.items.filter(x=>x.meaning==='staff_recommendation').length};
 const itemSummary=item=>item?{id:item.id,title:item.title,meaning:item.meaning}:null;
 const pendingChoice=model.items.find(x=>x.meaning==='must_resolve')||model.items.find(x=>x.meaning==='decision_due');
 return {kind:'guidance_return',savedAt,elapsedMs:elapsed,currentLabel:guidanceCurrentLabel(),boundary:{key:model.forecast?.key||'none',label:model.forecast?.label||'No advance available',status:model.forecast?.status||'ready'},counts,items:model.leading.slice(0,3).map(itemSummary),
  lastResult:guidanceLastResult(t),resultUnavailable:gamesAreDeferred()&&!['preseason','regular','confReady'].includes(universe.phase),priority:itemSummary(model.leading[0])||{title:model.forecast?.title||model.forecast?.label||'Review your program'},pendingChoice:itemSummary(pendingChoice)};
}
function guidancePrepareReturn(savedAt){const loadedAt=Date.now();guidanceReturnState=guidanceWelcomeBack(savedAt,selected(),loadedAt)?{savedAt,loadedAt,programId:selected()?.id}:null;return guidanceReturnState}
function guidanceReturnSummary(){return guidanceReturnState&&String(guidanceReturnState.programId)===String(selected()?.id)?guidanceWelcomeBack(guidanceReturnState.savedAt,selected(),guidanceReturnState.loadedAt):null}
function dismissGuidanceReturnSummary(){guidanceReturnState=null;return true}
function guidanceDeferItem(id,t=selected()){return snoozeGuidance(id,t)}
function guidanceRestoreItem(id,t=selected()){return restoreGuidance(id,t)}

function guidanceActionBlockers(action,t=selected()){
 const out=[],careerActions=new Set(['advance-week','simulate-season','detailed-game','offseason-phase']);
 const reviewCanRun=action==='offseason-phase'&&guidanceOffseasonPhase()==='review';
 if(careerActions.has(action)&&!reviewCanRun&&hasPendingCareerChoice())out.push({
  id:`career:${universe.year}`,kind:'career_choice',message:'Choose your next job before advancing.',
  title:'Choose your next coaching post',destination:{tab:'program',focus:'career-post'}
 });
 if(['advance-week','detailed-game'].includes(action)&&hasPendingWeeklyDecisions(t))out.push({
  id:`coach-desk:${universe.year}:${universe.week}:${t?.id??'team'}`,kind:'weekly_decisions',
  message:action==='detailed-game'?'Resolve the Coach’s Desk decisions before playing this week.':'Resolve the Coach’s Desk decisions before advancing the week.',
  title:'Resolve Coach’s Desk decisions',destination:{tab:'dashboard',focus:'weekly-decisions'}
 });
 return out;
}
function guidanceActionEligibility(action,t=selected()){
 const phase=universe?.phase,week=universe?.week??0,opening=openingPreseason(),phaseAllowed={
  'begin-season':opening,
  'advance-week':phase==='regular'&&week<12,
  'simulate-season':phase==='regular'&&week<12,
  'detailed-game':phase==='regular'&&week<12&&!!findUserGame(),
  'conference-championships':phase==='confReady',
  'bowls':phase==='bowlReady',
  'playoff':phase==='playoffReady',
  'offseason-phase':phase==='complete'
 }[action]===true,blockers=phaseAllowed?guidanceActionBlockers(action,t):[];
 return {action,phaseAllowed,allowed:phaseAllowed&&!blockers.length,blockers};
}
// A gated action says why, and offers the jump, instead of leaving greyed buttons with no reason.
function renderGateNote(noteSel,gate,buttonSels,{extra='',scrollTo=null}={}){
 const note=$(noteSel);if(!note)return;
 const blocker=!gate.allowed&&gate.phaseAllowed?gate.blockers[0]:null,buttons=buttonSels.map(x=>$(x)).filter(Boolean);
 note.replaceChildren();note.hidden=!blocker;
 buttons.forEach(b=>{if(blocker&&b.dataset.gateTitle!=='off')b.title=blocker.message;else if(!blocker&&b.dataset.gateTitle!=='off')b.removeAttribute('title')});
 if(!blocker)return;
 const text=document.createElement('span');text.textContent=blocker.message+(extra?' '+extra:'');
 const go=document.createElement('button');go.type='button';go.className='gate-note-go';
 go.textContent=blocker.destination?.focus==='career-post'?'Choose your next job':'Go to decisions';
 go.onclick=()=>{
  goToTab(blocker.destination?.tab||'dashboard');
  requestAnimationFrame(()=>{const target=$(blocker.destination?.focus==='career-post'?'#careerPost':scrollTo||'#weeklyDecisions');target?.scrollIntoView?.({behavior:'smooth',block:'center'})});
 };
 note.append(text,go);
}
function renderDetailedGateNote(gate){renderGateNote('#detailedGateNote',gate,['#simDetailedGame','#watchDetailedGame','#coachLiveGame'])}
function guidanceOffseasonPhase(){const os=universe?.offseason;return OFFSEASON_PHASES.includes(os?.phase)?os.phase:'review'}
function guidanceNextBoundary(t=selected()){
 const phase=universe?.phase,week=universe?.week??0,os=guidanceOffseasonPhase();
 if(openingPreseason())return {key:'begin-season',label:'Begin Season',title:'Week 1 becomes available',destination:{tab:'dashboard'},processes:['Keeps the generated schedule and current setup unchanged.','Unlocks the existing Week 1 matchup without simulating a game.']};
 if(phase==='regular'&&week<12){
  const game=(universe.schedule?.[week]||[]).find(g=>g.home===t?.name||g.away===t?.name),opponent=game?(game.home===t.name?game.away:game.home):null,played=!!game?.played;
  return {key:'advance-week',label:'Advance Week',title:`Complete Week ${week+1}${opponent?` ${game.home===t.name?'vs':'@'} ${opponent}`:''}`,destination:{tab:'dashboard'},
   processes:[played?'Your game is already complete; the remaining national schedule is played.':'Every unplayed game in the current week is completed.','Academic progress and recruiting are processed as the calendar moves on.',week===11?'Conference championships become available next.':`The calendar moves to Week ${week+2}.`]};
 }
 if(phase==='confReady')return {key:'conference-championships',label:'Play Conference Championships',title:'Conference titles are decided',destination:{tab:'season'},processes:['Conference championship games are played.','The 16-team playoff field is frozen before bowl play.']};
 if(phase==='bowlReady')return {key:'bowls',label:'Play Bowl Games',title:'Bowl games are played',destination:{tab:'season'},processes:['Eligible non-playoff teams play their bowls.','The playoff becomes the next available boundary.']};
 if(phase==='playoffReady')return {key:'playoff',label:'Play Playoff',title:'The national championship is decided',destination:{tab:'season'},processes:['All four playoff rounds are played.','Recruiting and season honors finalize before season review opens.']};
 if(phase==='complete'){
  const meta={
   review:['Run Season Review','Season results and administration review are finalized; coaching changes may occur.','offseason'],
   departures:['Process Departures','Graduations, declarations and transfer entries are processed.','offseason'],
   signing:['Enroll Signing Class','Committed recruits enroll and the scholarship limit is enforced.','offseason'],
   portal:['Resolve Transfer Portal','Transfer destinations are resolved before development begins.','offseason'],
   spring:['Run Spring Development','The spring development phase is applied to the current roster.','development'],
   fall:['Run Fall Camp','Fall development and position battles are resolved.','development'],
   preseason:['Open New Season','The next season schedule and recruiting pool are created.','offseason']
  }[os]||['Advance Offseason','The next offseason phase is processed.','offseason'];
  return {key:os==='spring'?'spring-development':os==='fall'?'fall-camp':'offseason-phase',label:meta[0],title:meta[0],destination:{tab:meta[2]},processes:[meta[1]]};
 }
 return {key:'none',label:'No Advance Available',title:'No simulation boundary is available',destination:{tab:'dashboard'},processes:['Finish the current phase before advancing.']};
}
function guidanceDecisionIsLive(t,d){
 if(!t||!d||d.resolved||d.season!==universe.year||d.week!==universe.week||d.teamId!==t.id)return false;
 if(d.type!=='WEEKLY_GAMEPLAN')return true;
 const game=(universe.schedule?.[universe.week]||[]).find(g=>g.home===t.name||g.away===t.name);
 return !!game&&!game.played;
}
function guidanceStoredDecisions(t=selected()){
 return !t?[]:(universe.weeklyDecisions||[]).filter(d=>guidanceDecisionIsLive(t,d));
}
function guidanceItemId(t,kind,occurrence){return `guidance:${t.id}:${universe.year}:${kind}:${occurrence}`}
function guidanceAffectedEntity(t,d){
 if(d?.playerId){const p=t.roster.find(x=>String(x.id)===String(d.playerId));return {type:'player',id:d.playerId,label:p?.name||d.title||'Player'}}
 if(d?.recruitId){const r=(universe.recruits||[]).find(x=>String(x.id)===String(d.recruitId));return {type:'recruit',id:d.recruitId,label:r?.name||d.title||'Recruit'}}
 return {type:'team',id:t.id,label:t.name};
}
function guidanceModel(t=selected()){
 if(!t)return {items:[],leading:[],remaining:[],forecast:null,plan:[]};
 const items=[],add=x=>items.push({scope:{teamId:t.id,season:universe.year,occurrence:x.occurrence},...x});
 if(hasPendingCareerChoice())add({id:guidanceItemId(t,'career','open-offers'),occurrence:'open-offers',meaning:'must_resolve',category:'career',priority:400,title:'Choose your next coaching post',cause:`Your prior tenure ended and ${(universe.jobOffers||[]).length} offer${(universe.jobOffers||[]).length===1?' is':'s are'} waiting.`,affectedEntity:{type:'coach',id:'user',label:'Head coach'},destination:{tab:'program',focus:'career-post'},boundary:'Before departures or another eligible calendar action',consequence:'Weekly, season, detailed-game, and post-review offseason advancement remain blocked until a post is accepted.'});
 for(const d of guidanceStoredDecisions(t)){
  const gameplan=d.type==='WEEKLY_GAMEPLAN',entity=guidanceAffectedEntity(t,d);
  add({id:guidanceItemId(t,gameplan?'gameplan':'coach-desk',d.id),occurrence:d.id,meaning:gameplan?'decision_due':'must_resolve',category:gameplan?'game_plan':'coach_desk',priority:gameplan?285:350+(d.priority||0)/100,title:d.title,cause:d.summary,affectedEntity:entity,destination:{tab:'dashboard',focus:'weekly-decision',decisionId:d.id,playerId:d.playerId||null,recruitId:d.recruitId||null},boundary:`Week ${universe.week+1} kickoff`,consequence:gameplan?'If unchanged, the game uses the existing Standard week plan.':'Advance Week and Game Day remain blocked; Sim Regular Season delegates the choice to staff.',boundaryKey:'advance-week'});
 }
 const sch=scholarshipSummary(t);
 if(sch.over)add({id:guidanceItemId(t,'scholarships','over-limit'),occurrence:'over-limit',meaning:'decision_due',category:'roster_management',priority:260,title:`Reduce the signing class by ${sch.over}`,cause:`${sch.committed} commitments currently exceed the ${sch.capacity}-player class capacity.`,affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'recruiting',focus:'scholarship-summary'},boundary:'Playoff completion',consequence:'This does not block time. When the playoff finalizes recruiting, the game pulls the weakest commitments until the class fits.',boundaryKey:'playoff'});
 for(const o of (universe.openings||[]).filter(o=>o.schoolId===t.id&&o.status==='OPEN'))add({id:guidanceItemId(t,'staff-opening',o.id||o.slot),occurrence:o.id||o.slot,meaning:'staff_recommendation',category:'staffing',priority:190,title:`Hire a ${o.role}`,cause:`The ${o.role} position is open${o.reason?`: ${o.reason}`:''}.`,affectedEntity:{type:'staff_role',id:o.slot,label:o.role},destination:{tab:'staff',focus:'coach-opening',coachId:o.coachId||null},boundary:null,consequence:'The interim arrangement remains in place if you advance; this recommendation never blocks time.'});
 const targets=(universe.recruits||[]).filter(r=>r.targeted&&!r.committed).length;
 if(!targets&&sch.room>0&&(universe.phase==='regular'||openingPreseason()))add({id:guidanceItemId(t,'recruiting-board','empty'),occurrence:'empty',meaning:'staff_recommendation',category:'recruiting',priority:170,title:'Build a recruiting board',cause:universe.recruitingActions?.auto?`Your staff are running recruiting until you take over. ${sch.room} scholarship${sch.room===1?' is':'s are'} open.`:`You have ${sch.room} scholarship${sch.room===1?'':'s'} available and no active targets.`,affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'recruiting',focus:'recruiting-board'},boundary:null,consequence:'Prospects only commit to programs that recruit them. Left empty, the class fills on signing day with late additions nobody else wanted, unless you turn on Staff handle recruiting.'});
 // Setup reminders. All are optional staff recommendations: they never block an advance, but they
 // keep recruiting and development from sitting untouched while the season moves on.
 const inSeason=universe.phase==='regular'||openingPreseason(),optional='Optional. The week still advances if you leave it.';
 if(targets&&sch.room>0&&inSeason&&targets<Math.min(sch.room,6))add({id:guidanceItemId(t,'recruiting-board','thin'),occurrence:'thin',meaning:'staff_recommendation',category:'recruiting',priority:165,title:`Add recruiting targets (${targets} for ${sch.room} spots)`,cause:`Only ${targets} active target${targets===1?'':'s'} for ${sch.room} open scholarship${sch.room===1?'':'s'}.`,affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'recruiting',focus:'recruiting-board'},boundary:null,consequence:optional});
 const scoutWeek=universe.phase==='regular'&&targets?globalThis.DynastyScoutingWeek?.(t):null;
 if(scoutWeek&&scoutWeek.spent===0&&scoutWeek.budget>0)add({id:guidanceItemId(t,'scouting-hours',`${universe.year}-${universe.week}`),occurrence:`${universe.year}-${universe.week}`,meaning:'staff_recommendation',category:'recruiting',priority:160,title:`Use ${scoutWeek.budget} scouting hours`,cause:'No targets have been scouted this week. Unused hours do not carry over.',affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'recruiting',focus:'recruiting-board'},boundary:null,consequence:optional});
 const recruitWeek=universe.phase==='regular'&&targets?globalThis.DynastyRecruitingWeek?.(t):null;
 if(recruitWeek&&recruitWeek.spent===0&&recruitWeek.budget>0)add({id:guidanceItemId(t,'recruiting-hours',`${universe.year}-${universe.week}`),occurrence:`${universe.year}-${universe.week}`,meaning:'staff_recommendation',category:'recruiting',priority:162,title:`Use ${recruitWeek.budget} recruiting hours`,cause:'Nobody on the board has been worked this week. A target left alone for two weeks starts to cool, and unused hours do not carry over.',affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'recruiting',focus:'recruiting-board'},boundary:null,consequence:optional});
 const rivalWatch=universe.phase==='regular'&&targets?globalThis.DynastyRecruitingRivals?.(t):null;
 if(rivalWatch&&rivalWatch.count>0)add({id:guidanceItemId(t,'recruiting-rivals',`${universe.year}-${universe.week}`),occurrence:`${universe.year}-${universe.week}`,meaning:'staff_recommendation',category:'recruiting',priority:164,title:`${rivalWatch.count} rival move${rivalWatch.count===1?'':'s'} on your board`,cause:`Rivals have made moves on ${rivalWatch.names.join(', ')}${rivalWatch.count>rivalWatch.names.length?' and others':''}. An unanswered move adds to their pitch.`,affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'recruiting',focus:'recruiting-board'},boundary:null,consequence:optional});
 const decisionsSoon=universe.phase==='regular'&&targets?globalThis.DynastyRecruitingDecisions?.(t):null;
 if(decisionsSoon&&decisionsSoon.count>0)add({id:guidanceItemId(t,'recruiting-decisions',`${universe.year}-${universe.week}`),occurrence:`${universe.year}-${universe.week}`,meaning:'staff_recommendation',category:'recruiting',priority:166,title:`${decisionsSoon.count} recruit${decisionsSoon.count===1?'':'s'} may choose a school soon`,cause:`${decisionsSoon.names.join(', ')}${decisionsSoon.count>decisionsSoon.names.length?' and others':''} may be approaching a decision. Only an announced date is public, and plans can change.${decisionsSoon.unoffered?` ${decisionsSoon.unoffered} of them ${decisionsSoon.unoffered===1?'has':'have'} no offer from you, and a recruit cannot choose you without one.`:''}`,affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'recruiting',focus:'recruiting-board'},boundary:null,consequence:optional});
 if(inSeason&&t.trainingFocusSeason!==universe.year)add({id:guidanceItemId(t,'training-focus',String(universe.year)),occurrence:String(universe.year),meaning:'staff_recommendation',category:'development',priority:150,title:'Set a training focus',cause:`Practice is running the default ${t.trainingFocus||'Balanced'} plan.`,affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'development',focus:'training-focus'},boundary:null,consequence:optional});
 if(universe.phase==='complete'&&typeof developmentPlanSystem!=='undefined'&&!(universe.developmentState?.year===universe.year&&universe.developmentState.springRun)){const used=developmentPlanSystem.count(t.roster||[],universe),open=developmentPlanSystem.LIMIT-used;if(open>0)add({id:guidanceItemId(t,'featured-plans',String(universe.year)),occurrence:String(universe.year),meaning:'staff_recommendation',category:'development',priority:175,title:`Choose featured development plans (${used}/${developmentPlanSystem.LIMIT})`,cause:`${open} featured plan slot${open===1?' is':'s are'} open before spring development.`,affectedEntity:{type:'team',id:t.id,label:t.name},destination:{tab:'development',focus:'featured-plans'},boundary:null,consequence:optional})}
 const state=guidanceStateFor(t),stamp=guidanceCalendarStamp();
 for(const item of items){item.familiarity=Number(state.familiarity?.[item.category])||0;item.deferred=['staff_recommendation','monitoring'].includes(item.meaning)&&state.deferred?.[item.id]?.stamp===stamp}
 const meaningRank={must_resolve:4,decision_due:3,staff_recommendation:2,monitoring:1};
 items.sort((a,b)=>(meaningRank[b.meaning]-meaningRank[a.meaning])||(b.priority-a.priority)||a.id.localeCompare(b.id));
 const snoozed=items.filter(x=>x.deferred),activeItems=items.filter(x=>!x.deferred),blockers=activeItems.filter(x=>x.meaning==='must_resolve'),leading=blockers.concat(activeItems.filter(x=>x.meaning!=='must_resolve').slice(0,Math.max(0,3-blockers.length))),leadIds=new Set(leading.map(x=>x.id)),remaining=activeItems.filter(x=>!leadIds.has(x.id));
 const forecast=guidanceNextBoundary(t),eligibilityAction=forecast.key==='spring-development'||forecast.key==='fall-camp'?'offseason-phase':forecast.key,eligibility=guidanceActionEligibility(eligibilityAction,t),cautions=items.filter(x=>x.meaning==='decision_due'&&x.boundaryKey===forecast.key);
 forecast.eligibility=eligibility;forecast.status=eligibility.blockers.length?'blocked':cautions.length?'caution':'ready';forecast.cautions=cautions.map(x=>x.id);
 const game=(universe.phase==='regular'&&(universe.schedule?.[universe.week]||[]).find(g=>!g.played&&(g.home===t.name||g.away===t.name)))||null,opponent=game?(game.home===t.name?game.away:game.home):null,activePlan=opponent?gameplanSnapshot(t,opponent).label:null;
 const plan=[{key:'schemes',label:'Schemes',value:`${t.offScheme} / ${t.defScheme}`,note:'Remain active until you change staff or scheme.'},{key:'training',label:'Team training',value:t.trainingFocus||'Balanced',note:'Applies at spring and fall development, not every week.'},{key:'recruiting',label:'Recruiting board',value:`${targets} active target${targets===1?'':'s'}`,note:'Targets remain active as recruiting advances.'}];
 if(activePlan)plan.push({key:'gameplan',label:'This week’s gameplan',value:activePlan,note:'Applies only to the current opponent and week.'});
 return {items:activeItems,snoozed,leading,remaining,forecast,plan,quiet:!items.some(x=>x.meaning==='must_resolve'||x.meaning==='decision_due')};
}
function simulateUserDetailed(){const g=findUserGame();if(!g)return;const gate=guidanceActionEligibility('detailed-game');if(!gate.allowed){setStatus(gate.blockers[0]?.message||'This game is not available.');return}recoverWeek();advanceAcademicsForWeek(selected());const r=detailedGame(T(g.home),T(g.away),false,g.conf);completeScheduledGame(g,r,true);universe.lastDetailedGame={...r,season:universe.year,week:g.week};universe.latest=[r];ranked();render()}
function completeScheduledGame(g,r,detailed=false){
 if(g.played)return;
 g.gameId=r.gameId;g.played=true;g.score=[r.ap,r.hp];g.winner=r.winner;
 if(r.firstStart)g.firstStart=r.firstStart; // The schedule is available before saved box scores load.
 if(detailed)g.detailed=true;
 settleRivalryGame(g);
}
function watchUserDetailed(){const before=universe.lastDetailedGame?.gameId;simulateUserDetailed();const id=universe.lastDetailedGame?.gameId;if(id&&id!==before)showGameCenter(id,'Watch')}
function hasPendingCareerChoice(){return !!(universe.jobOffers||[]).length}
function simWeek(skipDecisions=false){
 const gate=guidanceActionEligibility(skipDecisions===true?'simulate-season':'advance-week');
 if(!gate.allowed){if(gate.blockers[0])setStatus(gate.blockers[0].message);return}
 recoverWeek();const u=selected(),beforeRank=u.rank;advanceAcademicsForWeek(u);
 const results=[],pb=globalThis.DynastyPlaybook;
 // Record the controlled game first so a failed transaction can be retried before other matchups settle.
 const customGame=u.playbook&&pb&&!pb.isDefault(pb.get(u))?findUserGame():null;
 const customResult=customGame?recordV2GameLabResult({advancingWeek:true}).result:null;
 for(const g of universe.schedule[universe.week]){
  if(g===customGame){results.push(customResult);continue}
  if(g.played){settleRivalryGame(g);continue}
  const r=gameSim(T(g.home),T(g.away),false,g.conf);completeScheduledGame(g,r);results.push(r);
  if(g.home===u.name||g.away===u.name)universe.lastDetailedGame=null;
 }
 const userGame=universe.schedule[universe.week].find(g=>g.played&&(g.home===u.name||g.away===u.name));universe.week++;if(results.length)universe.latest=results;ranked();advanceRecruiting();buildWeeklyHub(beforeRank);if(universe.week===12)universe.phase='confReady';setStatus(weekResultStatus(universe.week,u,userGame));autosaveAfter('week');render()}
// Postseason games never reach weekResultStatus, so the status line (and the ticker that mirrors it)
// kept showing the Week 12 final through championship weekend, bowls and the playoff.
function announceUserPostseason(fromIndex){const u=selected(),games=universe.gameArchive||[];if(!u)return;let r=null;for(let i=games.length-1;i>=Math.max(0,fromIndex);i--){const g=games[i];if(g?.home?.id===u.id||g?.away?.id===u.id){r=g;break}}if(!r?.label)return;const home=r.home?.id===u.id,us=Number(r.score?.[home?'home':'away'])||0,them=Number(r.score?.[home?'away':'home'])||0,opp=(home?r.away:r.home)?.name||'opponent',won=us>them;setStatus(`${r.label} final: ${won?'W':'L'} ${us}-${them} ${home||r.venue==='Neutral site'?'vs':'at'} ${opp}.${won&&r.label==='National Championship'?' National champions!':''}`)}
function weekResultStatus(week,u,g){if(!g?.score)return `Week ${week} complete.`;const home=g.home===u.name,us=home?g.score[1]:g.score[0],them=home?g.score[0]:g.score[1];return `Week ${week} final: ${g.winner===u.name?'W':'L'} ${us}-${them} ${home?'vs':'at'} ${home?g.away:g.home}.`}
function simSeason(){const gate=guidanceActionEligibility('simulate-season');if(!gate.allowed){if(gate.blockers[0])setStatus(gate.blockers[0].message);return}while(universe.phase==='regular'){if(!delegateWeeklyDecisions(selected())){autosaveAfter('management');render();return}const week=universe.week;simWeek(true);if(universe.week===week)break}render()}
function confStand(c){return universe.teams.filter(t=>t.conference===c).map(t=>({t,s:rankingScore(t)})).sort((a,b)=>b.t.cw-a.t.cw||b.t.w-a.t.w||b.s-a.s).map(x=>x.t)}
function simConferenceChampionships(){if(universe.phase!=='confReady')return;const archiveStart=(universe.gameArchive||[]).length;universe.latest=[];universe.confChamps=[];universe.playoffFieldIds=[];universe.playoffFieldUnavailable=false;allConfs().forEach(c=>{let s=confStand(c);if(s.length<2)return;let r=gameSim(s[0],s[1],true,false,{week:13,label:c+' Championship'}),w=T(r.winner);w.champ=true;universe.confChamps.push(w.id);universe.latest.push({...r,label:c+' Championship'})});ranked();freezePlayoffField();universe.phase='bowlReady';buildWeeklyHub();announceUserPostseason(archiveStart);autosaveAfter('postseason');render()}
function seedField(){if(universe.playoffFieldUnavailable)return [];const frozen=playoffFieldFromIds();return frozen.length===16?frozen:selectPlayoffField()}
function simPlayoff(){if(universe.phase==='bowlReady')simBowls();if(universe.phase!=='playoffReady')return;if(universe.playoffFieldUnavailable){setStatus('This older postseason save predates frozen playoff selections after its bowls. The original field is unavailable, so no playoff was simulated.');return}let field=seedField();if(field.length!==16){setStatus('The saved playoff field is incomplete, so no playoff was simulated.');return}const archiveStart=(universe.gameArchive||[]).length;field.forEach((t,i)=>t.seed=i+1);let logs=[];function round(arr,label){let out=[];for(let i=0;i<arr.length/2;i++){let a=arr[i],b=arr[arr.length-1-i],r=gameSim(a,b,true,false,{week:14+['Round of 16','Quarterfinal','Semifinal','National Championship'].indexOf(label),label});logs.push({...r,label});out.push(T(r.winner))}return out}let r16=round(field,'Round of 16'),q=round(r16,'Quarterfinal'),s=round(q,'Semifinal'),f=round(s,'National Championship');universe.champion=f[0].name;universe.phase='complete';universe.offseason=makeOffseasonState(universe.year,'review');universe.latest=logs;finalizeRecruiting();finalizeSeasonHonors();archiveSeason();ranked();buildWeeklyHub();announceUserPostseason(archiveStart);autosaveAfter('postseason');render()}
function championshipOpponent(year,champion){
 const game=(universe.gameArchive||[]).find(g=>g.season===year&&g.label==='National Championship'&&
  ((g.home?.name===champion&&g.score?.home>g.score?.away)||(g.away?.name===champion&&g.score?.away>g.score?.home)));
 if(game)return game.home.name===champion?game.away.name:game.home.name;
 // Older saves may still have the final result even when detailed games are deferred.
 const latest=year===universe.year&&(universe.latest||[]).find(g=>g.label==='National Championship'&&g.winner===champion);
 return latest?(latest.home===champion?latest.away:latest.home):null;
}
function archiveSeason(){
 if(universe.history.some(h=>h.year===universe.year&&h.type==='season'))return;
 const champion=T(universe.champion),runnerUp=championshipOpponent(universe.year,universe.champion);
 universe.history.unshift({type:'season',year:universe.year,champion:universe.champion,championId:champion?.id??null,
  championRecord:champion?`${champion.w}-${champion.l}`: null,
  runnerUp,runnerUpId:T(runnerUp)?.id??null,
  top10:ranked().slice(0,10).map(t=>({name:t.name,schoolId:t.id,record:`${t.w}-${t.l}`})),
  records:universe.teams.map(t=>({name:t.name,schoolId:t.id,conference:t.conference,w:t.w,l:t.l,cw:t.cw,cl:t.cl,pf:t.pf,pa:t.pa,prestige:t.prestige})),
  awards:universe.awards?.[universe.year]||projectedAwards(),userTeam:$('#userTeam').value});
}
// Per-dynasty game settings (engine side). The Program Lab card that edits them is game-settings.js.
const GAME_SETTING_DEFS={
 boardPatience:{label:'Administration patience',note:'How hard a losing season swings the board against you. Good seasons are unaffected.',min:.5,max:1.6,fallback:1,options:[[.75,'Short leash'],[1,'Standard'],[1.3,'Patient']]},
 injuryRate:{label:'Injuries',note:'How often players get hurt, for every program in the league.',min:.3,max:2,fallback:1,options:[[.6,'Fewer'],[1,'Standard'],[1.5,'More']]},
 recruitingEdge:{label:'Recruiting rivals',note:'Points added to your program’s pitch on every recruit. Other programs are unchanged.',min:-12,max:12,fallback:0,options:[[-6,'Tougher'],[0,'Standard'],[6,'Friendlier']]}
};
// Called per player per game and per recruit per program, so keep the lookup to one property read.
function gameSetting(key){
 const def=GAME_SETTING_DEFS[key],raw=universe?.settings?.[key];
 if(raw===undefined)return def.fallback;
 const n=Number(raw);return Number.isFinite(n)?clamp(n,def.min,def.max):def.fallback;
}
function recruitingEdgeFor(t){const edge=gameSetting('recruitingEdge');return edge&&t.name===selected()?.name?edge:0}
function recruitPitch(t,r){
 if(recruitBlocked(t,r))return -1e6;
 return recruitPitchBreakdown(t,r).reduce((total,[,value])=>total+value,0);
}
function scheduleVisit(r){const u=selected();if(r.visitWeek){r.visitWeek=null;r.visit=false;return}let g=u.schedule.find(g=>!g.played&&g.home===u.name&&g.week>=universe.week+1);r.visitWeek=g?g.week:Math.min(12,universe.week+1);r.visit=true;firstRecruitEvaluation(r,u);refreshScoutingIntel(r,u,5,'VISIT',true)}
function decommitRecruit(r,reason){if(!r.committed)return false;let from=r.committed,t=T(from);r.committed=null;r.commitWeek=null;r.flippedFrom=from;universe.recruitClassCounts[from]=Math.max(0,classCommitCount(from)-1);if(t?.commits)t.commits=t.commits.filter(x=>x.id!==r.id);universe.decommitLog??=[];universe.decommitLog.push({year:universe.year,week:universe.week,id:r.id,name:r.name,pos:r.pos,stars:r.stars,from,to:null,reason});if(universe.decommitLog.length>300)universe.decommitLog.splice(0,universe.decommitLog.length-300);return true}
function pressureCommit(r,u){if(universe.week<6||(r.commitWeek??0)+2>universe.week)return;let home=T(r.committed);if(!home)return;let mine=r.committed===u.name,boost=(r.targeted?10:0)+r.relationship*.12+recruitPromiseBoost(r,u)+(r.visitWeek===universe.week?7:0)+(mine?recruitKeepBoost(r,u):0);if(r.visitWeek===universe.week)r.visit=false;let hold=recruitPitch(home,r)+(mine?boost:0)+6;let best=null,bestPitch=-1e9;for(const t of sample(universe.teams,12)){if(t.name===r.committed||!canTakeCommit(t.name))continue;let v=recruitPitch(t,r)+(t.name===u.name?(r.targeted&&userMayCommit(r,u)?boost:-1e9):0);if(v>bestPitch){bestPitch=v;best=t}}if(!best)return;let gap=bestPitch-hold;r.pressure=Math.round(gap);r.challenger=gap>-14?best.name:null;if(gap<-30)return;if(gameplayRandom()<.07/(1+Math.exp(-(gap+11)/4))){let from=r.committed;decommitRecruit(r,'flip');r.interest=clamp(Math.round(best.name===u.name?Math.max(r.interest,70):40+gauss()*8),1,100);if(commitRecruit(r,best.name)){let e=universe.decommitLog[universe.decommitLog.length-1];if(e&&e.id===r.id)e.to=best.name}r.trend=0}}
// --- v0.9.11: scholarship scarcity ------------------------------------------
// A class is bounded by the room the roster actually leaves, so every offer
// costs a spot and attrition becomes a recruiting resource.
const SCHOLARSHIP_LIMIT=85;
// Steady state is about a quarter of an 85-man roster leaving each year.
const CLASS_TARGET=20,CLASS_SMOOTHING=.5,CLASS_FLOOR=14;
function projectedDepartures(t){return (t.roster||[]).filter(p=>eligibilityBase(p)>=3).length}
function projectedReturning(t){
 const roster=t.roster||[],departing=projectedDepartures(t);
 // Programs plan for a little churn they cannot name yet: early declarations,
 // the portal, medical. Without it every class would be cut a few short.
 const attrition=Math.round((roster.length-departing)*.06);
 return Math.max(0,roster.length-departing-attrition);
}
function scholarshipCapacity(t){
 // Programs sign toward a steady roster rather than exactly replacing a lumpy
 // senior class, and initial counters are capped besides. The floor keeps a
 // thin-attrition year from making recruiting pointless; the ceiling is what
 // stops a big graduating class from becoming a 38-man haul.
 // v0.12.29: the raw figure follows how many seniors a roster happens to hold, and
 // cohorts echo: a 12-man class today is a thin senior class in four years, then a
 // 23-man class, then thin again. Measured over seven cycles the league mean ran
 // 12.7, 22.7, 23.0, 12.4, 18.7, 15.5, 21.4. Blending toward the steady-state class
 // damps that echo so a thin or fat graduating class moves capacity halfway, not fully.
 const raw=SCHOLARSHIP_LIMIT-projectedReturning(t);
 return clamp(Math.round(raw*(1-CLASS_SMOOTHING)+CLASS_TARGET*CLASS_SMOOTHING),CLASS_FLOOR,25);
}
function scholarshipRoom(t){return t?clamp(scholarshipCapacity(t)-classCommitCount(t.name),0,40):0}
function scholarshipSummary(t){
 const cap=scholarshipCapacity(t),used=classCommitCount(t.name);
 return {capacity:cap,committed:used,room:Math.max(0,cap-used),over:Math.max(0,used-cap),
  returning:projectedReturning(t),departing:projectedDepartures(t)};
}
// --- pulled offers ----------------------------------------------------------
// Pulling a commitment is allowed and sometimes necessary, but it is never
// free: the recruit will not come back, and the pipeline he came from notices.
function pullOffer(r,teamName,reason='Roster space'){
 if(!r||r.committed!==teamName)return false;
 const t=T(teamName);if(!t)return false;
 decommitRecruit(r,'pulled');
 r.pulledBy??=[];if(!r.pulledBy.includes(teamName))r.pulledBy.push(teamName);
 r.pulledSeason=universe.year;r.interest=clamp(Math.round((r.interest||50)*.45),1,60);
 const e=(universe.decommitLog||[])[universe.decommitLog.length-1];
 if(e&&e.id===r.id)e.reason='pulled';
 if(r.homeRegion)t.pipelines[r.homeRegion]=clamp(pipelineStrength(t,r.homeRegion)-gi(4,9),5,100);
 promiseState();
 const order=universe.nextEventId++;
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type:'OFFER_PULLED',
  importance:58,schoolIds:[t.id],playerIds:[],coachIds:[],recruitIds:[r.id],gameIds:[],
  summary:`${t.name} pulled its offer to ${'★'.repeat(r.stars||3)} ${r.pos} ${r.name}.`,
  metadata:{recruitId:r.id,recruitName:r.name,pos:r.pos,stars:r.stars,region:r.homeRegion,reason}});
 return true;
}
function pulledOfferHubItems(t){
 if(!t)return[];
 return (universe.events||[]).filter(e=>e.type==='OFFER_PULLED'&&e.schoolIds.includes(t.id)&&e.season===universe.year).slice(-2).reverse()
  .map(e=>({type:'bad-news',tab:'recruiting',kicker:'OFFER PULLED',importance:e.importance,main:e.summary,
   sub:`${e.metadata.region||'His region'} pipeline took a hit. He will not consider ${t.name} again.`}));
}
// A recruit does not forget who pulled his offer.
function recruitBlocked(t,r){return !!(r.pulledBy||[]).includes(t?.name)}
// Any program that ends signing day over its limit has to let people go.
// Signing day flips/stays can be given a `protect` set of recruit ids so a scholarship
// cleanup moments later in the same cycle cannot undo what the board just told the
// player happened to them.
function enforceScholarshipLimits(protect=null){
 for(const t of universe.teams){
  let guard=0;
  while(classCommitCount(t.name)>scholarshipCapacity(t)&&guard++<40){
   const commits=universe.recruits.filter(r=>r.committed===t.name&&!(protect&&protect.has(r.id)));
   if(!commits.length)break;
   const weakest=commits.slice().sort((a,b)=>(a.scoutUp+a.scout*.55)-(b.scoutUp+b.scout*.55))[0];
   if(!pullOffer(weakest,t.name,'Over the scholarship limit'))break;
  }
 }
}
function classCommitCount(name){return universe.recruitClassCounts?.[name]||0}
