// app/13-transfer-portal.js: The transfer portal cycle. Part of app.js; see tools/app-source.js.
// --- Transfer portal cycle (v0.9.47 commit 1: state + migration only) ---------
// The portal entry keeps owning its player record; nothing here copies p.
const PORTAL_ROUNDS=3,PORTAL_LOG_CAP=60,PORTAL_TARGET_CAP=8,PORTAL_STATUSES=['idle','open','resolved'];
// Stable across reloads and rounds: a player can only be in the portal once per season.
function portalCandidateId(entry){return `portal-${entry.enteredSeason??universe.year}-${entry.p?.id}`}
function ensurePortalEntry(entry){
 if(!entry||!entry.p)return entry;
 entry.candidateId??=portalCandidateId(entry);
 entry.finalists??=[];entry.interest??={};entry.exposure??=0;entry.decision??=null;
 entry.promiseOffer??=null;entry.placed??=false;
 return entry;
}
function newPortalCycle(year){return {year,round:0,status:'idle',targets:[],resolutions:[],log:[]}}
function ensurePortalCycle(){
 let c=universe.portalCycle;
 // A cycle belongs to one season; a rollover starts a clean one rather than carrying targets forward.
 if(!c||typeof c!=='object'||c.year!==universe.year)c=universe.portalCycle=newPortalCycle(universe.year);
 c.targets=Array.isArray(c.targets)?c.targets.slice(0,PORTAL_TARGET_CAP):[];
 c.resolutions=Array.isArray(c.resolutions)?c.resolutions:[];
 c.log=Array.isArray(c.log)?c.log.slice(-PORTAL_LOG_CAP):[];
 c.round=clamp(Math.round(Number(c.round)||0),0,PORTAL_ROUNDS);
 if(!PORTAL_STATUSES.includes(c.status))c.status='idle';
 return c;
}
function portalLog(message){const c=ensurePortalCycle();c.log.push({round:c.round,message:String(message)});if(c.log.length>PORTAL_LOG_CAP)c.log.splice(0,c.log.length-PORTAL_LOG_CAP);return c.log}
function portalCandidates(){return (universe.transferPortal||[]).map(ensurePortalEntry)}
function normalizePortalState(){universe.transferPortal??=[];universe.transferPortal.forEach(ensurePortalEntry);return ensurePortalCycle()}

// --- v0.9.47 commit 2: targeting, interest, rounds and AI competition ---------
// Attention is a fixed pool, so chasing one player is chasing fewer others.
const PORTAL_ATTENTION_POOL=10,PORTAL_ATTENTION_MAX=4,PORTAL_FINALISTS=4;
function portalEntry(candidateId){return portalCandidates().find(x=>x.candidateId===candidateId)||null}
function portalOrigin(entry){return universe.teams.find(t=>t.id===entry.fromSchoolId)||T(entry.from)||null}
// One shared decision model with the automatic path: transferFit already exposes the
// explainable categories (prior, opportunity, relationship, follow) the packet asks for.
function portalFit(entry,team){
 const from=portalOrigin(entry);
 if(!from||!team||team.id===entry.fromSchoolId||team.roster.length>=105)return null;
 return transferFit(entry.p,team,from,entry.reason);
}
// The field is narrowed once, at open, then only the finalists (plus anyone the user
// targets) are tracked — a 120-team recompute every round would be both slow and false
// to how a portal actually works.
function portalOpenFinalists(entry,limit=PORTAL_FINALISTS){
 const from=portalOrigin(entry);
 if(!from)return [];
 const scored=[];
 for(const t of universe.teams){const fit=portalFit(entry,t);if(fit)scored.push({schoolId:t.id,score:fit.score})}
 scored.sort((a,b)=>b.score-a.score);
 return scored.slice(0,limit).map(x=>x.schoolId);
}
function portalSetInterest(entry,schoolId,value){entry.interest[schoolId]=clamp(Math.round(value),0,100);return entry.interest[schoolId]}
function openPortalCycle(){
 const c=ensurePortalCycle();
 if(c.status!=='idle')return c;
 for(const entry of portalCandidates()){
  entry.finalists=portalOpenFinalists(entry);
  entry.interest={};
  for(const id of entry.finalists){const fit=portalFit(entry,universe.teams.find(t=>t.id===id));if(fit)portalSetInterest(entry,id,fit.score)}
 }
 c.status='open';c.round=1;
 portalLog(`Portal opened with ${portalCandidates().length} entrants.`);
 return c;
}
function portalAttentionSpent(){return ensurePortalCycle().targets.reduce((n,t)=>n+(t.attention||0),0)}
function portalAttentionLeft(){return Math.max(0,PORTAL_ATTENTION_POOL-portalAttentionSpent())}
function portalTargetFor(candidateId){return ensurePortalCycle().targets.find(t=>t.candidateId===candidateId)||null}
// Returns a reason string on refusal rather than throwing: every caller is a UI action.
function targetPortalCandidate(candidateId,attention=1){
 const c=ensurePortalCycle(),entry=portalEntry(candidateId);
 if(!entry)return 'No such portal candidate.';
 if(entry.decision)return `${entry.p.name} has already decided.`;
 const want=clamp(Math.round(Number(attention)||0),1,PORTAL_ATTENTION_MAX);
 const existing=portalTargetFor(candidateId);
 if(!existing&&c.targets.length>=PORTAL_TARGET_CAP)return `You can only chase ${PORTAL_TARGET_CAP} players at once.`;
 const spentElsewhere=portalAttentionSpent()-(existing?.attention||0);
 if(spentElsewhere+want>PORTAL_ATTENTION_POOL)return `Only ${PORTAL_ATTENTION_POOL-spentElsewhere} attention left.`;
 if(existing)existing.attention=want;
 else c.targets.push({candidateId,attention:want});
 // Targeting puts the program in the running even when it did not make the opening cut.
 const u=T($('#userTeam').value);
 if(u&&!entry.finalists.includes(u.id)&&portalFit(entry,u)){entry.finalists.push(u.id);portalSetInterest(entry,u.id,portalFit(entry,u).score)}
 return null;
}
function untargetPortalCandidate(candidateId){
 const c=ensurePortalCycle(),i=c.targets.findIndex(t=>t.candidateId===candidateId);
 if(i<0)return 'That player is not targeted.';
 c.targets.splice(i,1);
 return null;
}
// Chance a candidate decides this round: low early, certain at the final round, so the
// user gets at least one round to move interest before the field closes.
function portalCommitChance(round){return round>=PORTAL_ROUNDS?1:.18*round}
function portalResolveEntry(entry){
 const pool=entry.finalists.map(id=>({schoolId:id,interest:entry.interest[id]??0})).filter(x=>universe.teams.some(t=>t.id===x.schoolId));
 if(!pool.length)return null;
 // Same bounded weighted choice chooseTransferDestination uses — never a deterministic winner.
 const best=Math.max(...pool.map(x=>x.interest));let total=0;
 for(const x of pool){x.weight=Math.exp((x.interest-best)/7);total+=x.weight}
 let roll=gameplayRandom()*total,pick=pool.at(-1);
 for(const x of pool){roll-=x.weight;if(roll<=0){pick=x;break}}
 entry.decision={schoolId:pick.schoolId,round:ensurePortalCycle().round,interest:pick.interest};
 return entry.decision;
}
// --- v0.9.47 commit 3: NIL, promises, capacity and destination resolution -----
// Both levers spend the program's existing budgets — the portal gets no currency of its own.
const PORTAL_NIL_INTEREST=9,PORTAL_PROMISE_INTEREST=6;
// A transfer takes a roster spot, so the same 105 ceiling the automatic path respects.
function portalRoomFor(team){return team?Math.max(0,105-team.roster.length):0}
function portalUserTeam(){return T($('#userTeam').value)||null}
function portalRequireOpen(entry){
 if(!entry)return 'No such portal candidate.';
 if(entry.decision)return `${entry.p.name} has already decided.`;
 return null;
}
function offerPortalNil(candidateId){
 const entry=portalEntry(candidateId),blocked=portalRequireOpen(entry);
 if(blocked)return blocked;
 const u=portalUserTeam();if(!u)return 'No program selected.';
 // signNilDeal owns the budget rule, so the portal can never overspend it.
 const res=signNilDeal(u,entry.p,false);
 if(!res.ok)return res.reason;
 if(!entry.finalists.includes(u.id)&&portalFit(entry,u))entry.finalists.push(u.id);
 portalSetInterest(entry,u.id,(entry.interest[u.id]??0)+PORTAL_NIL_INTEREST);
 portalLog(`Offered ${entry.p.name} a ${res.cost}-unit NIL deal.`);
 return null;
}
function withdrawPortalNil(candidateId){
 const entry=portalEntry(candidateId),blocked=portalRequireOpen(entry);
 if(blocked)return blocked;
 const u=portalUserTeam();if(!u)return 'No program selected.';
 const res=cancelNilDeal(u,entry.p);
 if(!res.ok)return res.reason;
 portalSetInterest(entry,u.id,(entry.interest[u.id]??0)-PORTAL_NIL_INTEREST);
 return null;
}
// Recorded as an offer here and only written onto the player once he lands, so a promise
// can never attach to the school he was leaving.
function promisePortalCandidate(candidateId,label){
 const entry=portalEntry(candidateId),blocked=portalRequireOpen(entry);
 if(blocked)return blocked;
 const u=portalUserTeam();if(!u)return 'No program selected.';
 if(!PROMISES.includes(label))return `Unknown promise "${label}".`;
 const had=!!entry.promiseOffer;
 if(label==='None'){
  entry.promiseOffer=null;
  if(had)portalSetInterest(entry,u.id,(entry.interest[u.id]??0)-PORTAL_PROMISE_INTEREST);
  return null;
 }
 entry.promiseOffer={type:PROMISE_TYPES[label],schoolId:u.id,coachId:u.staff.HC.id,coachName:u.staff.HC.name,
  seasonMade:universe.year,madeWeek:universe.week,targetPosition:entry.p.pos,expectedGames:8,expectedFocus:'Technique'};
 if(!entry.finalists.includes(u.id)&&portalFit(entry,u))entry.finalists.push(u.id);
 if(!had)portalSetInterest(entry,u.id,(entry.interest[u.id]??0)+PORTAL_PROMISE_INTEREST);
 return null;
}
function attachPortalPromise(entry,dest){
 const offer=entry.promiseOffer;
 if(!offer||offer.schoolId!==dest.id)return null;
 promiseState();
 const q={...offer,id:`PR_${universe.nextPromiseId++}`,firstSeason:universe.year+1,
  status:offer.type==='NIL_PRIORITY'?'PASSIVE':'ACTIVE',resolvedSeason:null,result:null,severity:0,notes:[],trainingPhases:[]};
 entry.p.promises??=[];entry.p.promises.push(q);entry.p.promise=promiseLabel(q.type);
 addDynastyEvent('PROMISE_MADE',entry.p,dest,q);
 return q;
}
// Applies decisions already made. A destination with no room simply does not land the
// player: he stays in universe.transferPortal for the existing automatic fallback.
function resolvePortalCommitments(){
 const placed=[],blocked=[];
 for(const entry of portalCandidates()){
  if(!entry.decision||entry.placed)continue;
  const dest=universe.teams.find(t=>t.id===entry.decision.schoolId);
  if(!dest||portalRoomFor(dest)<=0){blocked.push({candidateId:entry.candidateId,reason:dest?'no room':'no school'});continue}
  const landed=placeTransfer(entry,dest);
  if(!landed){blocked.push({candidateId:entry.candidateId,reason:'placement refused'});continue}
  entry.placed=true;
  attachPortalPromise(entry,landed);
  const os=universe.offseason,controlled=$('#userTeam').value;
  if(os?.reports&&(entry.from===controlled||landed.name===controlled)){
   (os.reports.movement??=[]).push(`${entry.p.pos} ${entry.p.name}: ${entry.from} → ${landed.name} (${transferReasonLabel(entry.reason)})`);
  }
  portalDayNote(entry,landed.name);
  placed.push({candidateId:entry.candidateId,playerId:entry.p.id,schoolId:landed.id});
 }
 universe.transferPortal=(universe.transferPortal||[]).filter(x=>!x.placed);
 if(placed.length){const c=ensurePortalCycle();c.finalizedCount=(c.finalizedCount||0)+placed.length;autosaveAfter('portal');portalLog(`${placed.length} portal commitment${placed.length===1?'':'s'} finalized.`)}
 return {placed,blocked};
}

function advancePortalRound(){
 const c=ensurePortalCycle();
 if(c.status!=='open')return c;
 const u=T($('#userTeam').value),resolutions=[];
 for(const entry of portalCandidates()){
  if(entry.decision)continue;
  entry.exposure=(entry.exposure||0)+1;
  for(const id of entry.finalists){
   const team=universe.teams.find(t=>t.id===id);if(!team)continue;
   // AI schools drift on their own; the user's attention is the one lever the player has.
   let next=(entry.interest[id]??0)+gi(-3,4);
   const target=u&&id===u.id?portalTargetFor(entry.candidateId):null;
   if(target)next+=target.attention*3;
   portalSetInterest(entry,id,next);
  }
  if(gameplayRandom()<portalCommitChance(c.round)){
   const decision=portalResolveEntry(entry);
   if(decision){
    const school=universe.teams.find(t=>t.id===decision.schoolId);
    resolutions.push({candidateId:entry.candidateId,playerId:entry.p.id,schoolId:decision.schoolId,round:c.round});
    portalLog(`${entry.p.pos} ${entry.p.name} committed to ${school?.name||'a program'}.`);
   }
  }
 }
 if(resolutions.length){
  const decided=new Set(resolutions.map(x=>x.candidateId));
  for(const target of c.targets)if(decided.has(target.candidateId))portalEntry(target.candidateId).wasPortalTarget=true;
  c.targets=c.targets.filter(target=>!decided.has(target.candidateId));
 }
 c.resolutions.push(...resolutions);
 if(c.round>=PORTAL_ROUNDS){c.status='resolved';portalLog('Portal closed.')}
 else c.round+=1;
 autosaveAfter('portal');
 return c;
}

function transferFit(p,t,from,reason){
 const m=p.recruitingMemory||{},rank=(m.topFiveSchoolIds||[]).indexOf(t.id);
 const prior=clamp((rank<0?20:100-rank*10)+((m.offerSchoolIds||[]).includes(t.id)?15:0),0,100);
 const depth=t.roster.filter(x=>x.pos===p.pos),best=Math.max(50,...depth.map(x=>x.trueNow));
 const opportunity=clamp(65+(p.trueNow-best)*2-Math.max(0,depth.length-2)*6,0,100);
 let relationship=20,coachId=null;
 for(const c of Object.values(t.staff||{})){
  let value=p.coachRelationships?.[c.id]??(m.recruiterCoachId===c.id?m.relationship||50:20);
  if((p.promises||[]).some(q=>q.coachId===c.id&&q.status==='BROKEN'))value=Math.max(0,value-40);
  if(value>relationship){relationship=value;coachId=c.id}
 }
 const lat=Number.isFinite(m.lat)?m.lat:from.lat,lon=Number.isFinite(m.lon)?m.lon:from.lon;
 const proximity=Number.isFinite(lat)&&Number.isFinite(lon)?clamp(100-haversineMiles(lat,lon,t.lat,t.lon)/20,0,100):50;
 const pipeline=pipelineStrength(t,m.homeRegion||from.conference);
 const follow=p.coachDeparturePressure?.toSchoolId===t.id?clamp(p.coachDeparturePressure.strength||0,0,70):0;
 const score=prior*.20+opportunity*(reason==='BROKEN_PROMISE'?.30:.25)+playerSchemeFit(p,t)*.15+relationship*.15+follow*.08+proximity*.10+t.prestige*(reason==='BROKEN_PROMISE'?.05:.10)+pipeline*.05;
 // need = how far the position group sits below the engine's designed shape; a
 // program with a full room does not add a transfer there.
 const need=(POS_COUNTS[p.pos]||4)-depth.length;
 // A program only adds a player who can compete in that room; a deep room turns
 // away a lesser transfer instead of collecting him.
 const competitive=depth.length===0||p.trueNow>=best-8;
 return {score,prior,opportunity,relationship,coachId,follow,need,competitive};
}
// v0.12.22: a program only takes a transfer it has room AND a reason for — need at
// the position, a prior relationship, or a player better than its current depth.
// Without this every entrant landed somewhere and the portal had no failure mode.
function portalWanted(candidates){return candidates.filter(x=>x.prior>=55||(x.need>=2&&x.competitive&&x.opportunity>=40))}
function chooseTransferDestination(p,from,reason){
 const candidates=universe.teams.filter(t=>t.id!==from.id&&t.roster.length<105).map(t=>({t,...transferFit(p,t,from,reason)}));
 const wanted=portalWanted(candidates);
 if(!wanted.length)return null;
 candidates.length=0;candidates.push(...wanted);
 const best=Math.max(...candidates.map(x=>x.score));let total=0;
 for(const x of candidates){x.weight=Math.exp((x.score-best)/7);total+=x.weight}
 let roll=gameplayRandom()*total;for(const x of candidates){roll-=x.weight;if(roll<=0)return x}return candidates.at(-1);
}
function releasePlayerPromises(p,t,reason){for(const q of p.promises||[])if(q.status==='ACTIVE'&&q.schoolId===t.id){q.status='RELEASED';q.resolvedSeason=universe.year;q.result=reason;q.severity=0;q.transferPenalty=0;addDynastyEvent('PROMISE_RELEASED',p,t,q,{result:reason})}}
// `forced` lets the portal land a player at the school he actually chose; everything after
// the choice — history, promise release, roster move, event — stays one shared path.
function placeTransfer(entry,forced=null){
 const {p,reason}=entry,from=universe.teams.find(t=>t.id===entry.fromSchoolId)||T(entry.from);
 if(!from)throw new Error('Transfer origin is missing.');
 p.transferHistory??=[];
 // Defensive replay guard: never duplicate a transfer or a roster entry.
 if(p.transferHistory.some(h=>h.season===universe.year))return null;
 const match=forced&&forced.id!==from.id?{t:forced,...transferFit(p,forced,from,reason)}:chooseTransferDestination(p,from,reason);
 if(!match)return null;
 const dest=match.t;
 releasePlayerPromises(p,from,'Player left through the transfer portal; remaining obligation released.');
 const history={season:universe.year,fromSchoolId:from.id,toSchoolId:dest.id,fromSchool:from.name,toSchool:dest.name,reason,priorRelationship:match.relationship,coachId:match.coachId,recruiterCoachId:p.recruitingMemory?.recruiterCoachId||null,wasStarter:entry.wasStarter||false};
 p.transferHistory.push(history);p.currentSchoolId=dest.id;p.origin=`Transfer from ${from.name}`;p.morale=clamp(70+gi(-5,12),30,95);p.staffTrust=70;p.promise=null;p.stats=newStats();p.campGrade=null;p.year=CLASS_NAMES[Math.min(3,eligibilityBase(p))]||'SR';
 if(from.roster.some(x=>x.id===p.id))recordRosterMove(from,p,'portalOut');
 from.roster=from.roster.filter(x=>x.id!==p.id);dest.roster.push(p);recordRosterMove(dest,p,'portalIn');
 promiseState();const order=universe.nextEventId++;
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type:'TRANSFER_COMPLETED',importance:reason==='BROKEN_PROMISE'?65:50,schoolIds:[from.id,dest.id],playerIds:[p.id],coachIds:[history.coachId,history.recruiterCoachId].filter(Boolean),recruitIds:[],gameIds:[],summary:`${p.name}: ${from.name} → ${dest.name}.`,metadata:history});
 return dest;
}
function familiarFaceItems(t){
 if(!t)return [];const game=findUserGame();if(!game)return [];
 const opponent=T(game.home===t.name?game.away:game.home);if(!opponent)return [];
 const items=[];
 for(const [team,former] of [[opponent,t],[t,opponent]])for(const p of team.roster){
  const history=(p.transferHistory||[]).filter(h=>h.fromSchoolId===former.id).at(-1);if(!history)continue;
  const importance=55+(history.wasStarter?10:0)+((p.recruitingMemory?.stars||0)>=4?5:0)+(history.reason==='BROKEN_PROMISE'?10:0);
  items.push({type:'alert',tab:'roster',player:p.id,kicker:'FAMILIAR FACE',importance,main:`Former ${former.name} ${p.pos} ${p.name} now plays for ${team.name}`,sub:`Week ${universe.week+1} matchup · ${transferReasonLabel(history.reason)} · moved after ${history.season}`});
 }
 return items.sort((a,b)=>b.importance-a.importance).slice(0,2);
}
// A career reads as one list, not four: where he came from, what he did, what it cost him,
// where he went. Everything here is already stored — this only puts it in order.
function careerChronologyHTML(p){
 const rows=[],m=p.recruitingMemory;
 if(m?.season)rows.push({year:m.season,rank:0,kicker:'SIGNED',
  main:`${m.stars?'★'.repeat(m.stars):'Unrated'} · ${universe.teams.find(t=>t.id===m.schoolId)?.name||p.seasonHistory?.[0]?.team||'—'}`,
  sub:m.homeRegion?`Out of the ${m.homeRegion}`:''});
 for(const s of p.seasonHistory||[])rows.push({year:s.year,rank:1,kicker:'SEASON',
  main:`${s.team} · ${s.eligibility||s.pos}`,sub:`${s.pos} · ${statLine(s)}`});
 for(const a of p.awards||[])rows.push({year:a.year,rank:2,kicker:'HONOR',main:a.name,sub:''});
 for(const h of p.transferHistory||[])rows.push({year:h.season,rank:3,kicker:'TRANSFER',
  main:`${h.fromSchool} → ${h.toSchool}`,sub:transferReasonLabel(h.reason)});
 for(const i of p.injuryHistory||[])rows.push({year:i.year,rank:4,kicker:'INJURY',
  main:i.type,sub:`Week ${i.week} · ${i.weeks} week${i.weeks===1?'':'s'} out`});
 if(p.draftResult)rows.push({year:p.draftResult.year,rank:5,kicker:'DRAFT',main:p.draftResult.label,sub:''});
 for(const [eventIndex,e] of (Array.isArray(universe?.events)?universe.events:[]).entries()){if(!Array.isArray(e?.playerIds)||!e.playerIds.some(id=>String(id)===String(p.id))||!['BREAKOUT','ROLE_BATTLE','COLLEGE_CAREER_ENDED','FIRST_COLLEGE_START'].includes(e?.metadata?.storyType))continue;const phase=String(e.metadata?.phase||'').toUpperCase(),phaseLabel=['SPRING','FALL'].includes(phase)?`${phase} CAMP · `:'';rows.push({story:e.metadata.storyType,year:e.season,rank:-1,eventWeek:Number.isFinite(e.week)?e.week:null,eventOrder:Number.isFinite(e.timestampOrder)?e.timestampOrder:null,eventIndex,kicker:`${phaseLabel}WEEK ${e.week??'—'} · ${String(e.metadata.storyType).replaceAll('_',' ')}`,main:gameEscape(e.summary||'Recorded player milestone'),sub:e.gameIds?.[0]?gameLink(e.gameIds[0],'Open game record'):''})}
 // Older seasons' career-ended stories are compacted away (compactHistoryArchive); the record itself still says it.
 if(p.exitReason==='Eligibility exhausted'&&Number.isFinite(p.retiredYear)&&!rows.some(r=>r.story==='COLLEGE_CAREER_ENDED'))
  rows.push({year:p.retiredYear,rank:6,kicker:'COLLEGE CAREER ENDED',main:gameEscape(`${p.name} completed his college eligibility at ${p.lastTeam||'his school'}.`),sub:''});
 if(!rows.length)return '<div class="muted">No career history recorded yet.</div>';
 return rows.sort((a,b)=>{const yearDiff=(Number(b.year)||0)-(Number(a.year)||0);if(yearDiff)return yearDiff;if(a.eventWeek!=null&&b.eventWeek!=null){const weekDiff=b.eventWeek-a.eventWeek;if(weekDiff)return weekDiff;if(a.eventOrder!=null&&b.eventOrder!=null&&a.eventOrder!==b.eventOrder)return b.eventOrder-a.eventOrder;return b.eventIndex-a.eventIndex}return a.rank-b.rank}).map(r=>
  `<div class="timeline-row"><div class="small muted">${r.year} · ${r.kicker}</div><strong>${r.main}</strong>${r.sub?`<div class="muted">${r.sub}</div>`:''}</div>`).join('');
}
function orderPlayerStoryEvents(events=universe?.events||[]){return(Array.isArray(events)?events:[]).map((event,index)=>({event,index})).filter(({event})=>['BREAKOUT','ROLE_BATTLE','COLLEGE_CAREER_ENDED','FIRST_COLLEGE_START'].includes(event?.metadata?.storyType)).sort((a,b)=>{const year=(Number(b.event.season)||0)-(Number(a.event.season)||0);if(year)return year;const aw=Number.isFinite(a.event.week)?a.event.week:null,bw=Number.isFinite(b.event.week)?b.event.week:null;if(aw!=null&&bw!=null&&aw!==bw)return bw-aw;if(a.event.timestampOrder!=null&&b.event.timestampOrder!=null&&a.event.timestampOrder!==b.event.timestampOrder)return b.event.timestampOrder-a.event.timestampOrder;return b.index-a.index}).map(x=>x.event)}
function transferHistoryHTML(p){const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return '<h3 style="margin-top:14px">Transfer History</h3>'+((p.transferHistory||[]).map(h=>`<div class="timeline-row"><strong>${esc(h.season)} · ${esc(h.fromSchool)} → ${esc(h.toSchool)}</strong><div>${esc(transferReasonLabel(h.reason))}</div></div>`).join('')||'<div class="muted">No transfers recorded.</div>')}

const TRANSFER_MORALE_PIVOT=70,TRANSFER_ENTRY_DIVISOR=360;
function transferRisk(p){return clamp((TRANSFER_MORALE_PIVOT-p.morale)+(p.role==='Development'?12:0)+(p.role==='Redshirt candidate'?8:0)+promisePenalty(p)+coachTransferPressure(p)+schemeFitPressure(p)+(p.injuryWeeks>3?3:0)-nilRetentionRelief(p),0,100)}
function transferPortalEntryReason(p,roll=gameplayRandom()){return roll<transferRisk(p)/TRANSFER_ENTRY_DIVISOR?transferReason(p):null}
// A player who fit the old system and not the new one has a reason to leave.
function schemeFitPressure(p){const t=T(p.currentSchoolId?universe.teams.find(x=>x.id===p.currentSchoolId)?.name:null)||universe.teams.find(x=>x.roster?.includes(p));if(!t)return 0;const side=OFF_POS.has(p.pos)?'off':'def',tr=schemeTransition(t,side);if(!tr)return 0;const now=schemeFitFor(p,schemeDefFor(side,tr.to)),was=schemeFitFor(p,schemeDefFor(side,tr.from));if(now==null||was==null)return 0;return clamp(Math.round((was-now)*.45),0,14)}
function playerGrade(p){return grade(p.perceived)}
function upsideLabel(p){let g=p.perceivedUpside-p.perceived;return g>=18?'Huge':g>=11?'High':g>=6?'Moderate':'Limited'}
function newsScoreLine(g){
 const f=recapFacts(g);
 return `${gameEscape(f.win.name)} ${f.wPts}, ${gameEscape(f.lose.name)} ${f.lPts}`;
}
function renderNewsletter(){
 if(gamesAreDeferred())return storageOperation(async()=>{await ensureGamesLoaded();renderNewsletter()});
 const sel=$('#newsWeek'),scopeSel=$('#newsScope'),weeks=newsWeeks();
 if(!weeks.length){$('#newsletterBody').innerHTML='<div class="card"><span class="muted">No games have been played yet. Simulate a week and the newsletter fills in.</span></div>';sel.innerHTML='';return}
 const wanted=sel.value||`${weeks[0].season}|${weeks[0].week}`;
 sel.innerHTML=weeks.slice(0,60).map(w=>`<option value="${w.season}|${w.week}"${`${w.season}|${w.week}`===wanted?' selected':''}>${w.season} · ${w.label&&w.label!=='Regular season'?gameEscape(w.label):`Week ${w.week}`}</option>`).join('');
 const [season,week]=(sel.value||wanted).split('|').map(Number);
 const letter=weeklyNewsletter(season,week,scopeSel.value,$('#userTeam').value);
 if(!letter){$('#newsletterBody').innerHTML='<div class="card"><span class="muted">No games in that week for this coverage setting.</span></div>';return}
 let html=`<div class="card news-lead"><div class="eyebrow">${gameEscape(letter.title)}</div><h3>${gameEscape(newsHeadline(letter.lead.game))}</h3><div class="strong">${gameEscape(newsScoreLine(letter.lead.game))}</div><p class="recap">${letter.lead.recap.body}</p>${gameLink(letter.lead.game.id,'Open Game Center')}</div>`;
 if(letter.note)html+=`<div class="card"><div class="small muted">${letter.note}</div></div>`;
 if(letter.items.length)html+=`<div class="card"><h3>Around the ${letter.scope==='national'?'country':letter.scope==='conference'?'conference':'schedule'}</h3>${letter.items.map(x=>`<div class="news-item"><div class="strong">${gameEscape(newsHeadline(x.game))}</div><div class="small">${gameEscape(newsScoreLine(x.game))}</div><div class="compact muted">${x.recap.body}</div><div>${gameLink(x.game.id,'Box score','Box Score')}</div></div>`).join('')}${letter.more?`<div class="small muted">${letter.more} more game${letter.more===1?'':'s'} not shown.</div>`:''}</div>`;
 $('#newsletterBody').innerHTML=html;
}
// Feature modules add to a view by registering a step here instead of wrapping its render
// function. Steps run in registration order, which is the build's module order.
const RENDER_STEPS={};
function extendRender(view,step,{before=false}={}){const steps=(RENDER_STEPS[view]??={before:[],after:[]});(before?steps.before:steps.after).push(step)}
function runRender(view,base){const steps=RENDER_STEPS[view];if(steps)for(const step of steps.before)step();base();if(steps)for(const step of steps.after)step()}
function renderRoster(){runRender('roster',renderRosterBoard)}
function renderRecruiting(){runRender('recruiting',renderRecruitingBoard)}
function renderDevelopment(){runRender('development',renderDevelopmentBoard)}
function renderStaff(){runRender('staff',renderStaffBoard)}
const TAB_RENDERERS={dashboard:()=>runRender('dashboard',()=>{}),roster:renderRoster,depth:renderDepth,staff:renderStaff,gamelab:renderGameLab,season:renderSeason,newsletter:renderNewsletter,stats:renderStats,recruiting:renderRecruiting,program:renderProgram,development:renderDevelopment,offseason:renderOffseason,records:renderRecords,history:()=>{renderHistory();if(($('#archiveSearch')?.value||'').length>=2)renderArchiveSearch()}};
let activeTab='dashboard';
function renderActiveTab(){(TAB_RENDERERS[activeTab]||(()=>{}))()}
// One map of the game: these five groups are the sidebar sections and the phone bar, in that order.
const TAB_GROUPS=[
 {id:'home',label:'Home',tabs:['dashboard','newsletter']},
 {id:'program',label:'Program',tabs:['program','roster','depth','development','staff','offseason']},
 {id:'recruiting',label:'Recruiting',tabs:['recruiting']},
 {id:'season',label:'Season',tabs:['gamelab','season','stats']},
 {id:'world',label:'World',tabs:['history','records','legacy']}];
function groupOf(tab){return TAB_GROUPS.find(g=>g.tabs.includes(tab))||TAB_GROUPS[0]}
// Selecting a group reveals its tabs and nothing else. A single-tab group is just that tab.
function showTabGroup(id,{activate=true}={}){
 const g=TAB_GROUPS.find(x=>x.id===id)||TAB_GROUPS[0];
 $$('.tab-groups button').forEach(b=>b.classList.toggle('active',b.dataset.group===g.id));
 $$('.tabs button').forEach(b=>{b.hidden=!g.tabs.includes(b.dataset.tab)});
 if(activate&&!g.tabs.includes(activeTab))$(`.tabs button[data-tab="${g.tabs[0]}"]`)?.click();
 return g;
}
// Anything that activates a tab — a hub tile, the weekly plan, go() — must bring its group with it,
// or the tab would open with the wrong group highlighted and its siblings hidden.
function syncTabGroup(tab){showTabGroup(groupOf(tab).id,{activate:false})}
function setActiveTab(id){activeTab=id;syncTabGroup(id);renderActiveTab();if(id==='dashboard'&&typeof renderGuidanceSystem==='function')renderGuidanceSystem()}
function goToTab(id){if(!$('#'+id))return;$$('.tabs button').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));$$('.tab').forEach(x=>x.classList.toggle('active',x.id===id));setActiveTab(id);$('#'+id).scrollIntoView?.({block:'start'})}
// Team Branding v1. Numeric teamId is the only key ever used — never school-name strings — and the
// atlas ordering (row-major, 12 cols, ID 1 at row0/col0) is fixed by team-branding-v1's own spec.
// This is presentation only: it never reads or writes simulation state.
const TEAM_LOGO_ATLAS='assets/team-logos-atlas-32.png',TEAM_LOGO_COLS=12,TEAM_LOGO_ROWS=10;
function commissionerMode(){return universe?.mode==='commissioner'}
function legacyControlMode(save,u){
 const controlled=save?.userTeam,careerSchool=u?.tenure?.school;
 // Before modes existed, changing the selector did not update the active
 // tenure until the next offseason. That mismatch is durable evidence that
 // the save used direct team switching and should retain the old controls.
 return controlled&&careerSchool&&controlled!==careerSchool?'commissioner':'dynasty';
}
function renderControlMode(){
 const commissioner=commissionerMode(),selector=$('#userTeam'),banner=$('#controlModeBanner');
 if(selector){selector.disabled=!commissioner;selector.title=commissioner?'Commissioner Mode: switch controlled program':'Dynasty Mode: change programs only through career offers'}
 if(banner){banner.hidden=!commissioner;banner.textContent='COMMISSIONER MODE · Program switching and direct institutional editing are enabled.'}
 for(const id of ['editName','editConference','editPrestige','editResources','editNil','editDevelopment','editFacilities','editAcademics','applyProgramEdit'])if($('#'+id))$('#'+id).disabled=!commissioner;
 if($('#programEditor'))$('#programEditor').hidden=!commissioner;
 if($('#programAttributes'))$('#programAttributes').hidden=commissioner;
 const note=$('#programEditNotice');if(note)note.textContent=commissioner?'Commissioner controls are active. Changes alter the live universe.':'Dynasty Mode locks institutional editing. Build the program through results, staff and future investments.';
}
function teamLogoHTML(teamId,size=24,extraClass=''){
 const id=Number(teamId);
 if(!Number.isInteger(id)||id<1||id>120)
  return `<span class="team-logo team-logo--fallback ${extraClass}" style="width:${size}px;height:${size}px" aria-hidden="true"></span>`;
 const idx=id-1,col=idx%TEAM_LOGO_COLS,row=Math.floor(idx/TEAM_LOGO_COLS);
 return `<span class="team-logo ${extraClass}" role="img" aria-label="Team logo" style="width:${size}px;height:${size}px;background-image:url('${TEAM_LOGO_ATLAS}');background-size:${TEAM_LOGO_COLS*size}px ${TEAM_LOGO_ROWS*size}px;background-position:-${col*size}px -${row*size}px"></span>`;
}
function renderProgressionControls(){
 const preseason=openingPreseason(),regular=universe.phase==='regular'&&universe.week<12,u=selected(),weekGate=guidanceActionEligibility('advance-week',u),seasonGate=guidanceActionEligibility('simulate-season',u);
 // Explain the split state: a blocked week can still be simmed through by delegating to staff.
 const weekBlocked=regular&&!weekGate.allowed,weekHint=weekBlocked?`${weekGate.blockers[0]?.message||'Resolve this week’s decisions first.'}${seasonGate.allowed?' Sim Regular Season lets your staff decide instead.':''}`:'';
 for(const id of ['#simWeek','#seasonWeek']){$(id).disabled=!regular||!weekGate.allowed;$(id).title=weekHint}
 renderGateNote('#weekGateNote',weekGate,[],{extra:seasonGate.allowed?'Or use Sim Regular Season and your staff will decide.':''});
 $('#simSeason').disabled=!regular||!seasonGate.allowed;$('#simSeason').title=weekBlocked&&seasonGate.allowed?'Your staff will make the pending decisions each week.':'';
 const hub=$('#hubAdvance');hub.dataset.openingPreseason=preseason?'true':'false';hub.__beginSeason=beginSeason;
 if(preseason){hub.textContent='Begin Season';hub.disabled=false;hub.classList.add('recommended')}
 else{if(hub.textContent==='Begin Season')hub.textContent='Advance Week';hub.disabled=!weekGate.allowed;hub.classList.remove('recommended')}
}
function render(){
 const order=ranked(),u=selected();if(!u)return;ensureSeasonGoals(u);$('#seasonGoalsDashboard')&&($('#seasonGoalsDashboard').innerHTML=seasonGoalsHTML(u));const p=profiles(u),preseason=openingPreseason();
 $('#teamName').textContent=u.name;{const nick=globalThis.DynastyMascots?.nickname(u),eyebrow=$('#dashboard .program-masthead .eyebrow');if(eyebrow&&nick){eyebrow.textContent=`THE ${nick.toUpperCase()}`;eyebrow.dataset.nickname=nick}}const mm=$('.masthead-mark');if(mm){mm.innerHTML=teamLogoHTML(u.id,48);mm.classList.add('has-logo')}
 $('#teamMeta').textContent=`${u.conference} · ${u.offScheme} / ${u.defScheme} · Prestige ${u.prestige} · Ceiling ${u.program_ceiling}`;
 $('#teamMetrics').innerHTML=[['Offense',grade(p.offense)],['Defense',grade(p.defense)],['Scheme Fit',grade((p.offFit+p.defFit)/2)],['Development',grade(u.development)]].map(x=>`<div class="metric"><div class="small muted">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');
 $('#recordBig').textContent=`${u.w}–${u.l}`;$('#rankLine').textContent=preseason?`Preseason · #${u.rank} nationally`:u.rank<=25?`#${u.rank} nationally`:`#${u.rank} nationally · outside the top 25`;$('#weekLine').textContent=preseason?`${universe.year} · Preseason`:universe.phase!=='regular'&&SEASON_STAGE_LABELS[universe.phase]?`${universe.year} · ${universe.phase==='complete'&&universe.offseason?.year===universe.year&&(universe.offseason.completed||[]).includes('review')?'Offseason':SEASON_STAGE_LABELS[universe.phase]}`:`${universe.year} · Week ${universe.week+1}`;
 $('#top15').innerHTML=order.slice(0,15).map((t,i)=>`<div class="rankrow${t.name===u.name?' target':''}"><div><span class="rank">${i+1}.</span> ${teamLogoHTML(t.id,20,'team-logo--inline')} ${t.name}</div><div>${t.w}-${t.l}</div></div>`).join('');
 const leaders=u.roster.slice().sort((a,b)=>b.perceived-a.perceived).slice(0,5);$('#snapshot').innerHTML=`<div class="lineitem"><span>Roster</span><strong>${u.roster.length}</strong></div><div class="lineitem"><span>Protected redshirts</span><strong>${u.roster.filter(p=>p.redshirtActive).length}</strong></div><div class="lineitem"><span>Commits</span><strong>${u.commits.length}</strong></div><div class="lineitem"><span>Head Coach</span><strong>${u.staff.HC.name}</strong></div><div class="lineitem"><span>PF / PA</span><strong>${u.pf} / ${u.pa}</strong></div>`+leaders.map(x=>`<div class="lineitem compact"><span>${x.pos} ${x.name}</span><span>${playerGrade(x)} · ${x.style}</span></div>`).join('');
 renderWeeklyDecisions();if(typeof renderGuidanceSystem==='function')renderGuidanceSystem();renderWeeklyHub();renderActiveTab();$('#simConf').disabled=universe.phase!=='confReady';$('#simBowls').disabled=universe.phase!=='bowlReady';$('#simPlayoff').disabled=universe.phase!=='playoffReady';
 let devState=ensureDevelopmentState(),offseason=normalizeOffseasonState(),advance=$('#runOffseason');if(advance){const labels={review:'Run Season Review',departures:'Process Departures',signing:'Enroll Signing Class',portal:'Resolve Transfer Portal',preseason:'Open New Season'},gate=guidanceActionEligibility('offseason-phase',u);advance.disabled=universe.phase!=='complete'||['spring','fall'].includes(offseason.phase)||!gate.allowed;advance.textContent=labels[offseason.phase]||'Advance Offseason Phase'}
 const detailedGate=guidanceActionEligibility('detailed-game',u);$('#simDetailedGame').disabled=!detailedGate.allowed;$('#watchDetailedGame').disabled=!detailedGate.allowed;if($('#coachLiveGame'))$('#coachLiveGame').disabled=!detailedGate.allowed;renderDetailedGateNote(detailedGate);renderProgressionControls()
}
function attachPlayerLinks(){$$('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));paintPortraits()}
function showArchetypeGuide(style){const meta=archetypeMeta(style),pos=archetypePosition(style),traitNames={speed:'Speed',power:'Power',technique:'Technique',iq:'Processing',composure:'Composure',durability:'Durability',versatility:'Versatility'};$('#archetypeDialogName').textContent=meta.display;$('#archetypeDialogMeta').textContent=`${pos||'Player'} archetype · internal identity preserved as ${style}`;$('#archetypeDialogBody').innerHTML=`<div class="archetype-guide"><p class="archetype-guide-lead">${meta.short}</p><section><div class="eyebrow">WINS WITH</div><div class="archetype-strengths">${meta.strengths.map(x=>`<span class="pill">${traitNames[x]||x}</span>`).join('')}</div></section><section><div class="eyebrow">SIMULATION ROLE</div><p>${styleDescription({style,pos})}</p></section></div>`;const d=$('#archetypeDialog');if(d.showModal)d.showModal();else d.setAttribute('open','')}

