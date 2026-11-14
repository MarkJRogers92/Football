// app/11-recruiting-commitments.js: Class limits, commitments, the weekly recruiting pass and signing. Part of app.js; see tools/app-source.js.
// Some programs over-sign on purpose, betting on attrition they cannot name
// yet; signing day settles the bet. Appetite is stable per program per class,
// and impatient, high-profile programs are the ones that push the limit.
function oversignAppetite(t){
 if(!t)return 0;
 const h=Math.abs(hashString(`${t.id}|${universe.year}|oversign`));
 const nerve=clamp(((100-(t.admin_patience??60))+(t.prestige??60))/5,4,38);
 return h%100<nerve?1+(h>>7&1):0;
}
function canTakeCommit(name){const t=T(name);return t?classCommitCount(name)<scholarshipCapacity(t)+oversignAppetite(t):false}
function commitRecruit(r,name){if(r.committed||!canTakeCommit(name))return false;let t=T(name);if(recruitBlocked(t,r))return false;assignPrimaryRecruiter(r,t,t.name===selected()?.name?r.relationship:null);r.committed=name;r.commitWeek=universe.week;r.challenger=null;r.pressure=0;r.signedPromise=r.promiseOffer?.schoolId===t.id?{...r.promiseOffer}:null;universe.recruitClassCounts??={};universe.recruitClassCounts[name]=classCommitCount(name)+1;t.commits??=[];t.commits.push(r);r.recruitingMemory=captureRecruitment(r,t);return true}
// v0.15.0: recruiting-actions.js reassigns both of these. The defaults keep the engine standalone:
// no effort model (targets drift for free) and no scholarship-offer gate on commitments.
function recruitEffort(r,t){return null}
function userMayCommit(r,t){return true}
// The timeline extension holds uncommitted recruits out of the legacy weekly roll. The draw still
// happens in that pass; a check-in continues to strengthen existing commitments against flips.
function recruitHolds(r,u){return false}
function recruitKeepBoost(r,u){return 0}
function advanceRecruiting(){const u=selected();clearUnitCache();universe.recruits.forEach(r=>{ensureRecruitRelationships(r);if(r.committed){pressureCommit(r,u);return}r.prevInterest=r.interest;let pool=recruitConsideration(r).map(t=>({t,pitch:recruitPitch(t,r)})).sort((a,b)=>b.pitch-a.pitch).map(x=>x.t),top=pool.find(t=>canTakeCommit(t.name)&&aiWantsRecruit(t,r))||pool.find(t=>canTakeCommit(t.name))||pool[0];r.leader=top.name;let promiseBoost=recruitPromiseBoost(r,u),visitBoost=0;if(r.visitWeek===universe.week){let g=u.schedule.find(g=>g.week===universe.week&&g.home===u.name);visitBoost=g&&g.played?(g.winner===u.name?13:5):7;r.visit=false}let us=recruitPitch(u,r)+(r.targeted?10:0)+r.relationship*.12+visitBoost+promiseBoost,ais=recruitPitch(top,r);if(r.targeted){firstRecruitEvaluation(r,u);refreshScoutingIntel(r,u,2+(visitBoost?4:0),'RECRUITING',true);
 // Draw order is part of the seeded contract: gain, bump, noise. recruitEffort() only scales what was drawn.
 let gain=gi(2,6),bump=gi(1,5),noise=gauss()*2,drift=(us-ais)*.065,cool=0;const eff=recruitEffort(r,u);
 if(eff){gain=Math.round(gain*eff.relScale);bump*=eff.bumpScale;noise*=eff.noiseScale;if(eff.freeze)drift=Math.min(0,drift);cool=eff.cool}
 r.relationship=clamp(r.relationship+gain-(eff?.relDecay||0),0,100);if(gain>0)growRecruiterRelationship(r,u,gain);r.interest=clamp(Math.round(r.interest+drift+bump+noise-cool),1,100)}else r.interest=clamp(Math.round(r.interest+(us-ais)*.018+gauss()*2),1,100);r.trend=r.interest-r.prevInterest;if(universe.week>=5&&gameplayRandom()<.028+universe.week*.009&&!recruitHolds(r,u)){if(r.targeted&&r.interest>=72&&us>=ais-4&&canTakeCommit(u.name)&&userMayCommit(r,u))commitRecruit(r,u.name);else{let dest=pool.find(t=>t.name!==u.name&&canTakeCommit(t.name)&&aiWantsRecruit(t,r));if(dest)commitRecruit(r,dest.name)}}})}
// v0.12.29: commitments fill first-come, so in a small-class year the room is gone before
// the best prospects decide, and 4- and 5-stars were left unsigned (149 of them in one
// measured cycle, as good as the ones who signed). Signing day places each unsigned elite
// at a program that wants him, at the cost of that program's weakest commit, which must be
// at least two stars lower. Class sizes are unchanged and the displaced prospect joins the
// late market. The controlled program's commits, today's signing-day board and any
// program already displaced three times are left alone.
const ELITE_MIN_STARS=4,ELITE_DISPLACE_GAP=2,ELITE_DISPLACE_CAP=3;
function placeUnsignedElites(){
 const controlled=selected()?.name,protectedIds=new Set((universe.signingDay?.board||[]).map(b=>b.recruitId)),taken={};
 const userRoom=controlled?canTakeCommit(controlled):false;
 let placed=0,displaced=0;
 const elites=universe.recruits.filter(r=>!r.committed&&r.stars>=ELITE_MIN_STARS).sort((a,b)=>(a.nationalRank||1e9)-(b.nationalRank||1e9));
 for(const e of elites){
  // A target the controlled program is winning is settled by the normal fill below.
  if(userRoom&&e.targeted&&e.interest>=68&&userMayCommit(e,selected()))continue;
  let dest=null,removed=null;
  // His own list first: a program he wants signs him if it has room, or by releasing a commit two stars lower.
  for(const t of recruitAiList(e)){
   if(t.name===controlled||recruitBlocked(t,e))continue;
   if(canTakeCommit(t.name)){dest=t;break}
   if((taken[t.name]||0)>=ELITE_DISPLACE_CAP)continue;
   const weakest=universe.recruits.filter(r=>r.committed===t.name&&!protectedIds.has(r.id)&&r.stars<=e.stars-ELITE_DISPLACE_GAP).sort((a,b)=>(a.scoutUp+a.scout*.55)-(b.scoutUp+b.scout*.55))[0];
   if(!weakest||!decommitRecruit(weakest,'DISPLACED_BY_ELITE'))continue;
   removed=weakest;taken[t.name]=(taken[t.name]||0)+1;dest=t;break;
  }
  const open=dest?[]:universe.teams.filter(t=>t.name!==controlled&&canTakeCommit(t.name)&&!recruitBlocked(t,e));
  if(dest){}
  else if(open.length)dest=sample(open,24).sort((a,b)=>recruitPitch(b,e)-recruitPitch(a,e))[0];
  else{
   const cands=sample(universe.teams.filter(t=>t.name!==controlled&&!recruitBlocked(t,e)&&(taken[t.name]||0)<ELITE_DISPLACE_CAP),24).sort((a,b)=>recruitPitch(b,e)-recruitPitch(a,e));
   for(const t of cands){
    const weakest=universe.recruits.filter(r=>r.committed===t.name&&!protectedIds.has(r.id)&&r.stars<=e.stars-ELITE_DISPLACE_GAP).sort((a,b)=>(a.scoutUp+a.scout*.55)-(b.scoutUp+b.scout*.55))[0];
    if(!weakest||!decommitRecruit(weakest,'DISPLACED_BY_ELITE'))continue;
    removed=weakest;taken[t.name]=(taken[t.name]||0)+1;dest=t;break;
   }
  }
  if(dest&&commitRecruit(e,dest.name)){placed++;if(removed)displaced++}
  else if(removed)commitRecruit(removed,dest.name);
 }
 return {placed,displaced};
}
// A prospect commits to the controlled program only if it recruited him (the targeted path); on signing day a
// program that did not recruit fills its room last, and only with late additions (two stars or fewer) nobody else took.
function finalizeRecruiting(){const u=selected();clearUnitCache();buildSigningDay();universe.recruitCycle={year:universe.year,seasonCommits:universe.recruits.filter(r=>r.commitWeek).length,decommits:(universe.decommitLog||[]).filter(e=>e.year===universe.year).length,flips:(universe.decommitLog||[]).filter(e=>e.year===universe.year&&e.to).length};Object.assign(universe.recruitCycle,{elites:placeUnsignedElites()});let remaining=universe.recruits.filter(r=>!r.committed);while(remaining.length){let needy=universe.teams.filter(t=>t.name!==u.name&&scholarshipRoom(t)>0&&classCommitCount(t.name)<15);if(!needy.length)break;let r=remaining.shift();if(r.targeted&&r.interest>=68&&canTakeCommit(u.name)&&classCommitCount(u.name)<15&&userMayCommit(r,u)){commitRecruit(r,u.name);continue}let top=sample(needy,16).sort((a,b)=>recruitPitch(b,r)-recruitPitch(a,r))[0]||needy[0];commitRecruit(r,top.name)}for(const r of remaining){if(r.committed)continue;if(r.targeted&&r.interest>=68&&canTakeCommit(u.name)&&userMayCommit(r,u)){let available=universe.teams.filter(t=>canTakeCommit(t.name)),top=sample(available,24).sort((a,b)=>recruitPitch(b,r)-recruitPitch(a,r))[0];if(!top||recruitPitch(u,r)+10+r.relationship*.12>=recruitPitch(top,r)-3){commitRecruit(r,u.name);continue}}let available=universe.teams.filter(t=>canTakeCommit(t.name)&&(t.name!==u.name||((r.stars||1)<=2&&!r.targeted)));if(!available.length)continue;let top=sample(available,28).sort((a,b)=>recruitPitch(b,r)-recruitPitch(a,r))[0]||available[0];commitRecruit(r,top.name)}enforceScholarshipLimits(new Set(universe.signingDay?.board?.map(b=>b.recruitId)||[]));universe.recruitCycle.signeesByTeam=Object.fromEntries(universe.teams.map(t=>[t.name,universe.recruits.filter(r=>r.committed===t.name).length]));}
// When the staff run recruiting (the auto option, or Sim Season), they also keep the board stocked: up to 1.3 times
// the open scholarships, with prospects for whom this program would be one of their real options (its pitch at least
// matches the sixth-best program on his list). Staff weigh how likely he is to sign as much as how good he is, so a
// delegated class is about what a peer program signs, and a coach who builds his own board can do better. A coach who recruits
// nobody and delegates nothing signs only late additions.
function staffBuildBoard(t=selected()){
 if(!t)return 0;const room=scholarshipRoom(t),onBoard=universe.recruits.filter(r=>r.targeted&&!r.committed).length,want=Math.min(24,Math.round(room*1.3))-onBoard;
 if(want<=0)return 0;
 const needs={};POS.forEach(p=>needs[p]=(POS_COUNTS[p]||4)-t.roster.filter(x=>x.pos===p&&x.year!=='SR').length*.55);
 const picks=universe.recruits.filter(r=>!r.committed&&!r.targeted&&!recruitBlocked(t,r)).map(r=>{const list=recruitAiList(r),bar=list.length?recruitPitch(list[list.length-1],r):-1e9;const mine=recruitPitch(t,r);return{r,ok:mine>=bar,score:((r.scoutUp||0)+(r.scout||0)*.55)*.5+(mine-bar)*2+(needs[r.pos]||0)*5}}).filter(x=>x.ok).sort((a,b)=>b.score-a.score).slice(0,want);
 for(const {r} of picks){r.targeted=true;firstRecruitEvaluation(r,t)}
 return picks.length;
}
function autoTarget(){const u=selected();universe.recruits.forEach(r=>r.targeted=false);let needs={};POS.forEach(p=>needs[p]=(POS_COUNTS[p]||4)-u.roster.filter(x=>x.pos===p&&x.year!=='SR').length*.55);universe.recruits.filter(r=>!r.committed).sort((a,b)=>(b.scoutUp+(needs[b.pos]||0)*5)-(a.scoutUp+(needs[a.pos]||0)*5)).slice(0,20).forEach(r=>{r.targeted=true;firstRecruitEvaluation(r,u)});autosaveAfter('management');renderRecruiting()}
function chooseCoachMoveDestination(c,from,slot,changed,moved){
 const user=selected()?.name,candidates=universe.teams.filter(t=>t.id!==from.id&&t.name!==user&&!changed.get(t.id)?.has(slot)&&!moved.has(t.staff?.[slot]?.id)&&t.prestige>=from.prestige-5);
 if(!candidates.length)return null;const scored=candidates.map(t=>({t,score:(t.prestige-from.prestige)*1.1+t.resources*.14+(slot==='RC'?t.nil*.10:t.development*.09)+(c.ambition||60)*.05+gauss()*3})).sort((a,b)=>b.score-a.score),short=scored.slice(0,6),best=short[0]?.score??0;let total=0;for(const x of short){x.weight=Math.exp((x.score-best)/6);total+=x.weight}let roll=gameplayRandom()*total;for(const x of short){roll-=x.weight;if(roll<=0)return x.t}return short.at(-1)?.t||null
}
function carousel(){
 let log=[],trackedMoves=0,next=universe.year+1,moved=new Set(),changed=new Map(universe.teams.map(t=>[t.id,new Set()])),mark=(t,slot)=>changed.get(t.id).add(slot),did=(t,slot)=>changed.get(t.id).has(slot),controlled=$('#userTeam').value;
 for(const t of universe.teams){recordCoachSeason(t);for(const c of Object.values(t.staff)){c.age=(c.age||40)+1;c.years=(c.years||0)+1;c.contractYears=Math.max(0,(c.contractYears??2)-1)}}
 for(const t of universe.teams){const hc=t.staff.HC,expected=clamp(Math.round((t.prestige-30)/8),4,10),bad=t.w<expected-2,fire=bad&&gameplayRandom()>(t.admin_patience/100),hcRetire=gameplayRandom()<coachRetirementChance(hc);if(!(fire||hcRetire))continue;const status=hcRetire?'RETIRED':'FIRED',reason=hcRetire?'Retired after the season':`Fired after ${t.w}-${t.l}`;if(t.name===controlled){createOpening(t,'HC',reason,status);mark(t,'HC');log.push(`${t.name}: ${hc.name} ${status==='FIRED'?'was fired':'retired'}. The Head Coach job is open — interview and hire from the Staff tab.`);continue}const candidates=['OC','DC'].filter(slot=>!did(t,slot)).map(slot=>({slot,c:t.staff[slot],score:(t.staff[slot].ambition||60)+(t.staff[slot].playCall||60)*.35+(t.staff[slot].development||60)*.2})).sort((a,b)=>b.score-a.score),promote=gameplayRandom()<.32&&candidates[0]?.c;if(promote){const who=candidates[0],oldName=hc.name;promoteCoachWithinTeam(t,who.slot,'HC',reason,status);mark(t,'HC');mark(t,who.slot);moved.add(who.c.id);log.push(`${t.name}: ${oldName} ${status==='FIRED'?'was fired':'retired'}; ${who.c.name} promoted from ${COACH_SLOT_ROLES[who.slot]} to Head Coach.`)}else{const x=replaceStaffCoach(t,'HC',reason,status,next);mark(t,'HC');log.push(`${t.name}: ${x.old.name} ${status==='FIRED'?'was fired':'retired'}; ${x.fresh.name} hired as Head Coach.`)}}
 for(const t of universe.teams)for(const slot of ['OC','DC']){if(did(t,slot))continue;const c=t.staff[slot];if(moved.has(c.id))continue;const retire=gameplayRandom()<coachRetirementChance(c),turn=!retire&&gameplayRandom()<(slot==='OC'?.07+c.ambition/900:.06+c.ambition/1000);if(!retire&&!turn)continue;if(t.name===controlled){createOpening(t,slot,retire?'Retired after the season':'Left for another opportunity',retire?'RETIRED':'DEPARTED');mark(t,slot);log.push(`${t.name}: ${c.name} ${retire?'retired':'left for another opportunity'} as ${COACH_SLOT_ROLES[slot]}. The job is open — interview and hire from the Staff tab.`);continue}if(retire){const x=replaceStaffCoach(t,slot,'Retired after the season','RETIRED',next);mark(t,slot);log.push(`${t.name}: ${x.old.name} retired; ${x.fresh.name} takes over as ${COACH_SLOT_ROLES[slot]}.`);continue}const dest=trackedMoves<6?chooseCoachMoveDestination(c,t,slot,changed,moved):null;if(dest){const destOld=dest.staff[slot].name;moveCoach(c,t,dest,slot,'Accepted a new coordinator job');mark(t,slot);mark(dest,slot);moved.add(c.id);trackedMoves++;log.push(`${c.name}: ${t.name} ${COACH_SLOT_ROLES[slot]} → ${dest.name} ${COACH_SLOT_ROLES[slot]}; ${destOld} departs.`)}else{const x=replaceStaffCoach(t,slot,'Left for another opportunity','DEPARTED',next);mark(t,slot);log.push(`${t.name}: ${x.old.name} left as ${COACH_SLOT_ROLES[slot]}; ${x.fresh.name} takes over.`)}}
 for(const t of universe.teams){if(!did(t,'RC')){const c=t.staff.RC,retire=gameplayRandom()<coachRetirementChance(c),turn=!retire&&gameplayRandom()<.018+(c.ambition||60)/2200;if(t.name===controlled){if(retire||turn){createOpening(t,'RC',retire?'Retired after the season':'Left for another opportunity',retire?'RETIRED':'DEPARTED');mark(t,'RC');log.push(`${t.name}: ${c.name} ${retire?'retired':'left for another opportunity'} as Recruiting Coordinator. The job is open — interview and hire from the Staff tab.`)}}else if(retire){const x=replaceStaffCoach(t,'RC','Retired after the season','RETIRED',next);mark(t,'RC');log.push(`${t.name}: ${x.old.name} retired; ${x.fresh.name} takes over as Recruiting Coordinator.`)}else if(turn){const dest=trackedMoves<8?chooseCoachMoveDestination(c,t,'RC',changed,moved):null;if(dest){const destOld=dest.staff.RC.name;moveCoach(c,t,dest,'RC','Accepted a new recruiting coordinator job');mark(t,'RC');mark(dest,'RC');moved.add(c.id);trackedMoves++;log.push(`${c.name}: ${t.name} Recruiting Coordinator → ${dest.name}; ${destOld} departs.`)}else{const x=replaceStaffCoach(t,'RC','Left for another opportunity','DEPARTED',next);mark(t,'RC');log.push(`${t.name}: ${x.old.name} left as Recruiting Coordinator; ${x.fresh.name} takes over.`)}}}if(!did(t,'SC')){const c=t.staff.SC;if(gameplayRandom()<coachRetirementChance(c)){if(t.name===controlled){createOpening(t,'SC','Retired after the season','RETIRED');mark(t,'SC');log.push(`${t.name}: ${c.name} retired as Strength & Performance. The job is open — interview and hire from the Staff tab.`)}else{const x=replaceStaffCoach(t,'SC','Retired after the season','RETIRED',next);mark(t,'SC');log.push(`${t.name}: ${x.old.name} retired; ${x.fresh.name} takes over as Strength & Performance.`)}}}}
 return log
}
function offseasonPhaseDone(phase){
 return normalizeOffseasonState().completed.includes(phase);
}
function finishOffseasonPhase(phase,next,report={}){
 const os=normalizeOffseasonState();
 if(!os.completed.includes(phase))os.completed.push(phase);
 os.reports[phase]=report;
 os.phase=next;
 return os;
}
// Receipts observe actual roster mutations; they never choose a player or consume RNG.
function recordRosterMove(t,p,kind,receipt=universe.phase==='complete'&&universe.offseason?.year===universe.year?universe.offseason.reports?.roster?.[t.id]:null){
 if(!receipt)return;
 receipt[kind]++;
 if(!['eligibility','earlyDraft','portalOut','signees','portalIn'].includes(kind))return;
 const key=['signees','portalIn'].includes(kind)?'additions':'losses';
 receipt[key].push({id:p.id,name:p.name,pos:p.pos,rating:Math.round(p.perceived||0),kind});
 receipt[key].sort((a,b)=>b.rating-a.rating||a.name.localeCompare(b.name));receipt[key]=receipt[key].slice(0,3);
}
function offseasonReceiptView(t,r,year,complete=false){
 const current=t.roster.length,accounted=r.start-r.eligibility-r.earlyDraft-r.portalOut+r.signees+r.portalIn+r.walkOns-r.cuts;
 const ds=universe.developmentState,risers=new Map();
 if(ds?.year===year)for(const row of [...(ds.springReport||[]),...(ds.fallReport||[])]){
  if(!t.roster.some(p=>p.id===row.id))continue;
  const prior=risers.get(row.id)||{id:row.id,name:row.name,pos:row.pos,delta:0};
  prior.delta+=row.perceivedDelta||0;risers.set(row.id,prior);
 }
 const battles=(ds?.year===year?ds.battles||[]:[]).filter(b=>t.roster.some(p=>p.id===b.recommended)).slice(0,3)
  .map(b=>({label:b.label,name:b.candidates?.find(p=>p.id===b.recommended)?.name||'Staff recommendation',applied:t.roleDepth?.[b.roleId]?.[0]===b.recommended}));
 return {...r,year,teamId:t.id,team:t.name,current,unexplained:current-accounted,complete,
  risers:[...risers.values()].filter(p=>p.delta>0).sort((a,b)=>b.delta-a.delta||a.name.localeCompare(b.name)).slice(0,3),battles};
}
function offseasonRecapModel(t=selected()){
 if(!t)return null;
 if(universe.phase==='complete'){
  const os=universe.offseason,r=os?.year===universe.year&&os.reports?.roster?.[t.id];
  return r?offseasonReceiptView(t,r,os.year):null;
 }
 return universe.lastOffseasonRecap?.teams?.[t.id]||null;
}
function offseasonReview(){
 const os=normalizeOffseasonState();
 if(offseasonPhaseDone('review')){if(os.phase==='review')os.phase='departures';return true}
 os.reports.roster=Object.fromEntries(universe.teams.map(t=>[t.id,{start:t.roster.length,eligibility:0,earlyDraft:0,portalOut:0,signees:0,portalIn:0,walkOns:0,cuts:0,losses:[],additions:[]}]));
 auditPromises();finalizeSeasonHonors();archiveSeason();reviewControlledProgram(selected());creditCoachingTree(selected());
 for(const t of universe.teams)updateFanSupport(t);
 const carouselLog=carousel(),controlled=$('#userTeam').value;
 const meanPrestige=avg(universe.teams.map(t=>t.prestige)),meanWins=avg(universe.teams.map(t=>t.w)),teams={};
 for(const t of universe.teams){
  ensureAllTimeRecord(t);
  recordSeasonInHistory(t,t.w,t.l,conferenceChampionIdsFor().includes(t.id),universe.champion===t.name);
  for(const p of t.roster)archivePlayerSeason(p,t,universe.year);
  const target=meanWins+(t.prestige-meanPrestige)/9,prestigeDelta=clamp(Math.round((t.w-target)*.35),-3,3);
  t.prestige=clamp(t.prestige+prestigeDelta,10,t.program_ceiling);
  teams[t.id]={prestigeDelta,record:`${t.w}-${t.l}`};
 }
 finishOffseasonPhase('review','departures',{carouselLog,controlled,teams});
 return true;
}
function offseasonDepartures(){
 const os=normalizeOffseasonState();
 if(offseasonPhaseDone('departures')){if(os.phase==='departures')os.phase='signing';return true}
 const controlled=$('#userTeam').value,portal=[...(universe.transferPortal||[])],draftPool=[],teams={};
 universe.transferPortal=[];
 for(const t of universe.teams){
  const exits=[];
  for(const p of t.roster){
   if(t.name===controlled&&eligibilityBase(p)===0)snapshotScouting(p,t,'FRESHMAN_YEAR_END','SEASON');
   const preserved=p.redshirtActive&&canRedshirt(p)&&(p.stats?.games||0)<=4;
   if(preserved){p.redshirtUsed=true;p.redshirtSeason=universe.year;p.redshirtActive=false}
   else{p.redshirtActive=false;p.eligibilityUsed=eligibilityBase(p)+1}
   const exhausted=p.eligibilityUsed>=4,early=!exhausted&&earlyDeclaration(p,t);
   if(exhausted||early){const reason=early?'Declared early for draft':'Eligibility exhausted';draftPool.push({p,teamId:t.id,reason,score:draftProjection(p,t).score});exits.push(p);recordRosterMove(t,p,early?'earlyDraft':'eligibility')}
  }
  t.roster=t.roster.filter(p=>!exits.includes(p));
  const keep=[];
  for(const p of t.roster){
   const reason=transferPortalEntryReason(p);
   if(reason){portal.push(ensurePortalEntry({p,from:t.name,fromSchoolId:t.id,reason,enteredSeason:universe.year,wasStarter:(p.stats?.starts||0)>=6}));recordRosterMove(t,p,'portalOut')}
   else keep.push(p);
  }
  t.roster=keep;
  t.roster.forEach(p=>{ensurePlayerDevelopment(p,t);const old=p.perceived;p.morale=clamp(p.morale+gi(-5,9),15,99);p.promiseBaseline??=old;p.year=CLASS_NAMES[Math.min(3,eligibilityBase(p))]||'SR';p.positionFamiliarity[p.pos]=clamp(familiarity(p,p.pos)+gi(2,6),0,100);p.stats=newStats();p.campGrade=null});
  teams[t.id]={exits:exits.length,portal:portal.filter(x=>x.fromSchoolId===t.id).length};
 }
 universe.transferPortal=portal;
 finishOffseasonPhase('departures','signing',{draftPool,teams});
 return true;
}
