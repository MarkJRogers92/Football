// app/14-weekly-decisions.js: Weekly decisions, player agency and promises. Part of app.js; see tools/app-source.js.
// --- v0.9.14: the coach's desk --------------------------------------------
// A few state-backed choices sit above the existing weekly checklist. They
// persist with the universe, resolve through mechanics the game already owns,
// and write one ordinary event so the choice is auditable after the week ends.
function decisionOption(id,label,description,recommended=false){return{id,label,description,recommended}}
function decisionRecent(type,subjectId,weeks=3){return (universe.weeklyDecisions||[]).some(d=>d.type===type&&d.season===universe.year&&d.subjectId===subjectId&&universe.week-d.week>0&&universe.week-d.week<=weeks)}
function decisionRecord(type,t,subjectId,title,summary,options,links={},priority=50){return{id:`WD_${universe.year}_${universe.week}_${t.id}_${type}_${subjectId}`,season:universe.year,week:universe.week,teamId:t.id,type,source:'STAFF',subjectId,title,summary,playerId:null,recruitId:null,coachId:null,...links,options,resolved:false,resolvedOptionId:null,resolvedSeason:null,resolvedWeek:null,priority}}
function importantStarters(t){ensureRoleDepth(t);const seen=new Set(),out=[];for(const role of ROLE_DEFS.filter(r=>r.base)){const p=rolePlayers(t,role.id)[0];if(p&&!seen.has(p.id)){seen.add(p.id);out.push(p)}}return out.sort((a,b)=>b.perceived-a.perceived)}
function activePromise(p,type){return (p.promises||[]).find(q=>q.type===type&&q.status==='ACTIVE'&&q.schoolId===p.currentSchoolId)}
function playerInteractionRecent(p,weeks=4){return (universe.weeklyDecisions||[]).some(d=>d.source==='PLAYER'&&d.season===universe.year&&d.playerId===p.id&&universe.week-d.week>=0&&universe.week-d.week<weeks)}
function playerInteractionWindow(t,weeks=4){return (universe.weeklyDecisions||[]).filter(d=>d.source==='PLAYER'&&d.teamId===t.id&&d.season===universe.year&&universe.week-d.week>=0&&universe.week-d.week<weeks).length}
function playerAgencyDecision(t,excluded=new Set()){
 if(!t||universe.week<1||playerInteractionWindow(t)>=3)return null;
 const available=t.roster.filter(p=>!excluded.has(p.id)&&!playerInteractionRecent(p)&&(p.injuryWeeks||0)<3),urgent=available.some(p=>transferRisk(p)>=78);
 if(universe.week%2===0&&!urgent)return null;
 const choices=[];
 const transfer=available.map(p=>({p,risk:transferRisk(p)})).filter(x=>x.risk>=70).sort((a,b)=>b.risk-a.risk)[0];
 if(transfer)choices.push(decisionRecord('PLAYER_TRANSFER_CONCERN',t,transfer.p.id,`${transfer.p.name} is weighing his future`,`${transfer.p.role} · ${transfer.p.stats?.games||0} appearances · transfer risk ${Math.round(transfer.risk)}. He wants to know whether there is still a path here.`,[
  decisionOption('reassure','Reassure him','Repair some morale and trust without guaranteeing a role.',true),
  decisionOption('opportunity','Promise an opportunity','Create or reaffirm a bounded Early Role obligation.'),
  decisionOption('no_guarantees','Make no guarantees','Be direct, accepting a modest morale cost.')],{source:'PLAYER',playerId:transfer.p.id},94));
 const complaint=available.map(p=>({p,risk:transferRisk(p),q:activePromise(p,'EARLY_ROLE')})).filter(x=>x.risk<70&&!x.p.redshirtActive&&['Development','Redshirt candidate','Rotation'].includes(x.p.role)&&(x.p.stats?.games||0)<=Math.max(1,Math.floor(universe.week/2))&&((x.p.morale??60)<=55||x.q)).sort((a,b)=>(a.p.morale??60)-(b.p.morale??60))[0];
 if(complaint)choices.push(decisionRecord('PLAYER_PLAYING_TIME_COMPLAINT',t,complaint.p.id,`${complaint.p.name} wants more snaps`,`${complaint.p.role} · ${complaint.p.stats?.games||0} appearances through week ${universe.week}. He is asking for a clearer path into the rotation.`,[
  decisionOption('keep','Keep current role','Explain that the depth chart is not changing.'),
  decisionOption('rotation','Increase rotation','Move him one step closer to the field now.',true),
  decisionOption('opportunity','Set a clear opportunity','Create or reaffirm a bounded Early Role obligation.')],{source:'PLAYER',playerId:complaint.p.id},88));
 const redshirt=available.filter(p=>canRedshirt(p)&&((p.redshirtActive&&((p.morale??60)<=62||activePromise(p,'NO_REDSHIRT')))||(!p.redshirtActive&&(p.stats?.games||0)>=2&&(p.stats?.games||0)<=3))).sort((a,b)=>(b.stats?.games||0)-(a.stats?.games||0))[0];
 if(redshirt){const noRs=activePromise(redshirt,'NO_REDSHIRT');choices.push(decisionRecord('PLAYER_REDSHIRT_DISCUSSION',t,redshirt.id,`${redshirt.name} asks about his redshirt`,`${redshirt.stats?.games||0} appearances used. ${noRs?'He also has an active No Redshirt promise.':'He wants clarity before the four-game threshold is gone.'}`,[
  decisionOption('preserve','Preserve the redshirt',noRs?'Protect the year, putting the existing promise at risk.':'Protect the year and remove him from weekly availability.',!noRs),
  decisionOption('continue','Keep playing',noRs?'Honor the existing promise and keep him available.':'Keep him in the rotation and accept the eligibility risk.',!!noRs),
  decisionOption('revisit','Revisit next week','Make no change; a small trust cost comes with delaying the answer.')],{source:'PLAYER',playerId:redshirt.id},noRs?92:84))}
 const role=available.map(p=>{const depth=orderedAt(t,p.pos),i=depth.indexOf(p);return{p,i,top:depth[0]}}).filter(x=>x.i>=1&&x.i<=2&&x.top&&x.p.perceived>=x.top.perceived-5&&(x.p.morale??60)<=65&&(x.p.stats?.games||0)<universe.week).sort((a,b)=>a.i-b.i||b.p.perceived-a.p.perceived)[0];
 if(role)choices.push(decisionRecord('PLAYER_ROLE_REQUEST',t,role.p.id,`${role.p.name} asks for a larger role`,`${role.p.pos} depth position ${role.i+1} · ${role.p.stats?.games||0} appearances. His current evaluation is close to the player ahead of him.`,[
  decisionOption('grant','Grant the larger role','Move him up the depth structure and into the starter mix.'),
  decisionOption('rotation','Offer more rotation','Move him up one step without promising a start.',true),
  decisionOption('decline','Decline the request','Keep the current role, with a modest morale and trust cost.')],{source:'PLAYER',playerId:role.p.id},82));
 const position=available.map(p=>{const current=positionTransitionFit(p,p.pos),best=positionOptions(p).map(to=>({to,fit:positionTransitionFit(p,to)})).sort((a,b)=>b.fit-a.fit)[0];return{p,current,best}}).filter(x=>x.best&&x.best.fit>=70&&x.best.fit>=x.current+7&&(['Development','Redshirt candidate'].includes(x.p.role)||playerSchemeFit(x.p,t)<60)).sort((a,b)=>(b.best.fit-b.current)-(a.best.fit-a.current))[0];
 if(position)choices.push(decisionRecord('PLAYER_POSITION_CHANGE_REQUEST',t,position.p.id,`${position.p.name} asks to move to ${position.best.to}`,`${position.p.role} at ${position.p.pos}. The staff sees a workable physical and role fit at ${position.best.to}.`,[
  decisionOption('approve','Approve the move','Change his position now and begin the existing familiarity process.',true),
  decisionOption('defer','Defer to the offseason','Record the request without changing his current position.'),
  decisionOption('decline','Decline the move','Keep him at his current position, with a modest trust cost.')],{source:'PLAYER',playerId:position.p.id,requestedPosition:position.best.to},78));
 return choices.sort((a,b)=>b.priority-a.priority)[0]||null;
}
function ensureWeeklyDecisions(t){
 universe.weeklyDecisions??=[];
 if(!t||universe.phase!=='regular'||universe.week>=12)return [];
 const current=universe.weeklyDecisions.filter(d=>d.season===universe.year&&d.week===universe.week&&d.teamId===t.id);
 if(current.length)return current;
 const candidates=[];
 const hurt=importantStarters(t).find(p=>!p.redshirtActive&&(p.injuryWeeks||0)<=1&&((p.injuryWeeks||0)===1||(p.health??100)<=84||(p.wear||0)>=68)&&!decisionRecent('INJURED_STARTER',p.id));
 if(hurt)candidates.push(decisionRecord('INJURED_STARTER',t,hurt.id,`${hurt.name} — ${hurt.pos}`,`${hurt.health??100}% healthy with ${hurt.wear||0}/100 wear entering the next game. Medical staff recommends a limited role.`,[
  decisionOption('full','Full role','Keep him atop every package; adds a small workload risk.'),
  decisionOption('limited','Limited role','Use the rotation and reduce his workload.',true),
  decisionOption('sit','Sit','Make him unavailable for this week.')],{playerId:hurt.id},100));
 const redshirt=t.roster.filter(p=>canRedshirt(p)&&!p.redshirtUsed&&(p.stats?.games||0)>=3&&!decisionRecent('REDSHIRT_DECISION',p.id)).sort((a,b)=>(b.stats?.games||0)-(a.stats?.games||0)||b.perceivedUpside-a.perceivedUpside)[0];
 if(redshirt){const noRs=activePromise(redshirt,'NO_REDSHIRT');candidates.push(decisionRecord('REDSHIRT_DECISION',t,redshirt.id,`${redshirt.name} — redshirt threshold`,`${redshirt.stats.games} appearances used. ${noRs?'An active No Redshirt promise is part of this choice.':'One more appearance may exhaust the four-game cushion.'}`,[
  decisionOption('preserve','Preserve redshirt',noRs?'Protect him, putting the No Redshirt promise at risk.':'Protect him from further appearances.',!noRs),
  decisionOption('continue','Continue playing',noRs?'Honor the No Redshirt promise and keep him available.':'Keep him available, accepting the eligibility risk.',!!noRs)],{playerId:redshirt.id},95))}
 const concern=t.roster.map(p=>({p,risk:transferRisk(p),promise:activePromise(p,'EARLY_ROLE')})).filter(x=>!x.p.redshirtActive&&!decisionRecent('PLAYING_TIME_CONCERN',x.p.id)&&((x.risk>=48&&['Development','Redshirt candidate'].includes(x.p.role))||(x.promise&&(x.p.stats?.games||0)<Math.min(x.promise.expectedGames||8,universe.week)))).sort((a,b)=>b.risk-a.risk)[0];
 if(concern)candidates.push(decisionRecord('PLAYING_TIME_CONCERN',t,concern.p.id,`${concern.p.name} wants clarity`,`${concern.p.role} · ${concern.p.stats?.games||0} appearances · transfer risk ${Math.round(concern.risk)}.`,[
  decisionOption('keep','Keep current role','Be honest that the rotation is not changing.'),
  decisionOption('rotation','Increase rotation','Move him one step closer to the field now.',true),
  decisionOption('promise','Promise an opportunity',concern.promise?'Reaffirm the existing Early Role promise.':'Create a bounded Early Role obligation for this season.')],{playerId:concern.p.id},80));
 const recruitPool=universe.recruits.filter(r=>r.targeted&&!r.committed&&!r.visitWeek).sort((a,b)=>(b.stars-a.stars)||(b.interest-a.interest)||(a.nationalRank-b.nationalRank));
 if(universe.week<=9&&recruitPool.length>=2){const pair=recruitPool.slice(0,2),key=pair.map(r=>r.id).sort().join('_');if(!decisionRecent('RECRUITING_PRIORITY',key,2))candidates.push(decisionRecord('RECRUITING_PRIORITY',t,key,'Choose this week’s recruiting priority',`${pair[0].name} and ${pair[1].name} are both important targets. Staff has time to make one the visit priority.`,[
  decisionOption(`prioritize_${pair[0].id}`,`Prioritize ${pair[0].name}`,`Schedule his visit and give his coach relationship a small boost.`,pair[0].nationalRank<pair[1].nationalRank),
  decisionOption(`prioritize_${pair[1].id}`,`Prioritize ${pair[1].name}`,`Schedule his visit and give his coach relationship a small boost.`,pair[1].nationalRank<pair[0].nationalRank),
  decisionOption('hold','Hold the resource','Keep both recruitments unchanged.')],{recruitId:pair[0].id,recruitIds:pair.map(r=>r.id)},60))}
 const acad=academicDecision(t,new Set(candidates.map(d=>d.playerId).filter(Boolean)));if(acad)candidates.push(acad);
 const gameplan=weeklyGameplanDecision(t);if(gameplan)candidates.push(gameplan);
 const agency=playerAgencyDecision(t,new Set(candidates.map(d=>d.playerId).filter(Boolean)));if(agency)candidates.push(agency);
 const used=new Set(),made=candidates.sort((a,b)=>b.priority-a.priority).filter(d=>!d.playerId||(!used.has(d.playerId)&&used.add(d.playerId))).slice(0,3);universe.weeklyDecisions.push(...made);return made;
}
function currentWeeklyDecisions(t=selected()){return ensureWeeklyDecisions(t).filter(d=>!d.resolved)}
function hasPendingWeeklyDecisions(t=selected()){return !!t&&(universe.weeklyDecisions||[]).some(d=>d.season===universe.year&&d.week===universe.week&&d.teamId===t.id&&!d.resolved&&d.type!=='WEEKLY_GAMEPLAN')}
function promoteRotationPlayer(t,p){ensureDepth(t);ensureRoleDepth(t);const bump=arr=>{const i=arr.indexOf(p.id);if(i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]]};bump(t.depthChart[p.pos]||[]);for(const role of ROLE_DEFS)if(role.eligible.includes(p.pos))bump(t.roleDepth[role.id]||[])}
function promisePlayerOpportunity(t,p,note){let q=activePromise(p,'EARLY_ROLE');if(q)return q;promiseState();q={id:`PR_${universe.nextPromiseId++}`,type:'EARLY_ROLE',schoolId:t.id,coachId:t.staff.HC.id,coachName:t.staff.HC.name,seasonMade:universe.year,madeWeek:universe.week,firstSeason:universe.year,expectedGames:Math.min(4,(p.stats?.games||0)+Math.max(1,12-universe.week)),status:'ACTIVE',resolvedSeason:null,result:null,severity:0,notes:[note],trainingPhases:[]};p.promises??=[];p.promises.push(q);p.promise='Early Role';addDynastyEvent('PROMISE_MADE',p,t,q);return q}
function applyRequestedPositionChange(t,p,to){if(!to||to===p.pos||!positionOptions(p).includes(to))return false;recordPromisePositionChange(p,to,true);const old=p.pos;p.formerPositions??=[];p.formerPositions.push({pos:old,year:universe.year});p.positionFamiliarity??={[old]:100};p.positionFamiliarity[to]=Math.max(p.positionFamiliarity[to]||0,38+Math.round((p.versatility??60)*.25));p.pos=to;p.trainingFocus='Position Transition';p.role='Development';p.requestedPositionChange={season:universe.year,week:universe.week,from:old,to,status:'APPROVED'};ensureDepth(t);autoRoleDepth(t,true);return true}
function addWeeklyDecisionEvent(d,option,t){promiseState();const order=universe.nextEventId++;universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type:'WEEKLY_DECISION_RESOLVED',importance:d.source==='PLAYER'?55:45,schoolIds:[t.id],playerIds:d.playerId?[d.playerId]:[],coachIds:d.coachId?[d.coachId]:[],recruitIds:d.recruitIds||[d.recruitId].filter(Boolean),gameIds:[],summary:`${d.title} — ${option.label}.`,metadata:{decisionId:d.id,decisionType:d.type,decisionSource:d.source||'STAFF',optionId:option.id,optionLabel:option.label,selectedBy:d.selectedBy||'coach',selectedByCoachId:d.selectedByCoachId??null}})}
// Staff policy is explicit: recommendations for routine choices, no new promises or in-season position moves.
function delegatedWeeklyOption(d,t){
 if(d.type==='INJURED_STARTER'&&t?.weeklyStaffInstructions?.medical==='sit')return d.options?.find(o=>o.id==='sit')||null;
 const policy={INJURED_STARTER:['limited'],ACADEMIC_WATCH:['balance'],REDSHIRT_DECISION:['continue','preserve'],
  PLAYING_TIME_CONCERN:['rotation','keep'],PLAYER_PLAYING_TIME_COMPLAINT:['rotation','keep'],PLAYER_TRANSFER_CONCERN:['reassure','no_guarantees'],
  PLAYER_ROLE_REQUEST:['rotation','decline'],PLAYER_REDSHIRT_DISCUSSION:['continue','preserve'],PLAYER_POSITION_CHANGE_REQUEST:['defer','decline'],
  RECRUITING_PRIORITY:['hold'],WEEKLY_GAMEPLAN:['standard'],STARTER_CHALLENGE:['stay','split','promote']};
 let allowed=policy[d.type];if(!Array.isArray(allowed))return null;
 if(d.type==='RECRUITING_PRIORITY')allowed=[...(d.recruitIds||[]).map(id=>`prioritize_${id}`),'hold'];
 if(d.type==='WEEKLY_GAMEPLAN')allowed=['standard',...Object.keys(GAMEPLAN_TIERS)];
 return d.options?.find(o=>allowed.includes(o.id)&&o.recommended)||allowed.map(id=>d.options?.find(o=>o.id===id)).find(Boolean)||null;
}
function weeklyDecisionReceipts(t=selected()){
 return (universe.events||[]).filter(e=>e.type==='WEEKLY_DECISION_RESOLVED'&&e.metadata?.selectedBy==='staff'&&e.season===universe.year&&
  (e.week===universe.week||e.week===universe.week-1)&&e.schoolIds?.includes(t?.id)).slice().reverse().map(e=>({kind:'staff',text:`Staff: ${e.summary}`,decisionId:e.metadata.decisionId}));
}
function delegateWeeklyDecisions(t=selected()){
 if(!t||t.id!==selected()?.id||!t.staff?.HC?.id)return false;
 for(const d of ensureWeeklyDecisions(t).filter(x=>guidanceDecisionIsLive(t,x))){
  const option=delegatedWeeklyOption(d,t);
  if(!option||!applyWeeklyDecision(d.id,option.id,{selectedBy:'staff',coachId:t.staff.HC.id})){
   setStatus(`Staff could not resolve ${d.title}. Review this decision before advancing.`);return false;
  }
 }
 return true;
}
function weeklyDecisionContext(id,optionId,{selectedBy='coach',coachId=null}={}){
 const d=(universe.weeklyDecisions||[]).find(x=>x.id===id),t=d&&universe.teams.find(x=>x.id===d.teamId),option=d?.options?.find(x=>x.id===optionId);
 if(!d||!t||t.id!==selected()?.id||!option||!guidanceDecisionIsLive(t,d)||universe.phase!=='regular')return null;
 if(selectedBy==='staff'&&(!coachId||t.staff?.HC?.id!==coachId))return null;
 const p=d.playerId?t.roster.find(x=>x.id===d.playerId):null;if(d.playerId&&!p)return null;
 return {d,t,option,p};
}
function finishWeeklyDecision(d,option,t,{selectedBy='coach',coachId=null}={}){
 d.resolved=true;d.resolvedOptionId=option.id;d.resolvedSeason=universe.year;d.resolvedWeek=universe.week;
 d.selectedBy=selectedBy;d.selectedByCoachId=coachId||t.staff?.HC?.id||null;addWeeklyDecisionEvent(d,option,t);return true;
}
function resolveWeeklyDecision(id,optionId){
 if(!applyWeeklyDecision(id,optionId))return false;
 const d=universe.weeklyDecisions.find(x=>x.id===id),option=d.options.find(x=>x.id===optionId);
 autosaveAfter('management');setStatus(`Decision recorded: ${option.label}.`);render();return true;
}
// Effects only: both interactive choices and unattended batches use this path; the caller owns save/render.
function applyWeeklyDecision(id,optionId,actor={}){
 const ctx=weeklyDecisionContext(id,optionId,actor);if(!ctx)return false;const {d,t,option,p}=ctx;
 const allowed={ACADEMIC_WATCH:['study','balance','practice'],INJURED_STARTER:['full','limited','sit'],REDSHIRT_DECISION:['preserve','continue'],
  PLAYING_TIME_CONCERN:['keep','rotation','promise'],PLAYER_PLAYING_TIME_COMPLAINT:['keep','rotation','opportunity'],PLAYER_TRANSFER_CONCERN:['reassure','opportunity','no_guarantees'],
  PLAYER_ROLE_REQUEST:['grant','rotation','decline'],PLAYER_REDSHIRT_DISCUSSION:['preserve','continue','revisit'],PLAYER_POSITION_CHANGE_REQUEST:['approve','defer','decline'],
  WEEKLY_GAMEPLAN:Object.keys(GAMEPLAN_TIERS),RECRUITING_PRIORITY:['hold',...(d.recruitIds||[]).map(rid=>`prioritize_${rid}`)]};
 if(!Array.isArray(allowed[d.type])||!allowed[d.type].includes(option.id))return false;
 if(d.type!=='WEEKLY_GAMEPLAN'&&d.type!=='RECRUITING_PRIORITY'&&!p)return false;
 if(['REDSHIRT_DECISION','PLAYER_REDSHIRT_DISCUSSION'].includes(d.type)&&option.id==='preserve'&&!canRedshirt(p))return false;
 if(d.type==='PLAYER_POSITION_CHANGE_REQUEST'&&option.id==='approve'&&(!positionOptions(p).includes(d.requestedPosition)||p.pos===d.requestedPosition))return false;
 if(d.type==='ACADEMIC_WATCH'&&p)applyAcademicDecision(p,t,option.id);
 else if(d.type==='WEEKLY_GAMEPLAN'&&!applyGameplanDecision(t,option))return false;
 else if(d.type==='INJURED_STARTER'&&p)p.weeklyAvailability={season:d.season,week:d.week,role:option.id};
 else if(d.type==='REDSHIRT_DECISION'&&p)p.redshirtActive=option.id==='preserve';
 else if(d.type==='PLAYING_TIME_CONCERN'&&p){if(option.id==='keep'){p.morale=clamp(p.morale-1,15,99);p.staffTrust=clamp((p.staffTrust??70)-1,0,100)}else if(option.id==='rotation'){p.role='Rotation';p.morale=clamp(p.morale+5,15,99);p.staffTrust=clamp((p.staffTrust??70)+3,0,100);promoteRotationPlayer(t,p)}else if(option.id==='promise'){promisePlayerOpportunity(t,p,'Made at the Coach\'s Desk after a playing-time concern.');p.morale=clamp(p.morale+3,15,99);p.staffTrust=clamp((p.staffTrust??70)+4,0,100)}}
 else if(d.type==='PLAYER_PLAYING_TIME_COMPLAINT'&&p){if(option.id==='keep'){p.morale=clamp(p.morale-4,15,99);p.staffTrust=clamp((p.staffTrust??70)-3,0,100)}else if(option.id==='rotation'){p.role='Rotation';promoteRotationPlayer(t,p);p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+3,0,100)}else{promisePlayerOpportunity(t,p,'Made after the player requested a clearer path to playing time.');p.morale=clamp(p.morale+3,15,99);p.staffTrust=clamp((p.staffTrust??70)+4,0,100)}}
 else if(d.type==='PLAYER_TRANSFER_CONCERN'&&p){if(option.id==='reassure'){p.morale=clamp(p.morale+5,15,99);p.staffTrust=clamp((p.staffTrust??70)+6,0,100)}else if(option.id==='opportunity'){promisePlayerOpportunity(t,p,'Made after the player raised a transfer concern.');p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+4,0,100)}else{p.morale=clamp(p.morale-3,15,99);p.staffTrust=clamp((p.staffTrust??70)+1,0,100)}}
 else if(d.type==='PLAYER_ROLE_REQUEST'&&p){if(option.id==='grant'){p.role='Starter mix';promoteRotationPlayer(t,p);promoteRotationPlayer(t,p);p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+2,0,100)}else if(option.id==='rotation'){p.role='Rotation';promoteRotationPlayer(t,p);p.morale=clamp(p.morale+3,15,99);p.staffTrust=clamp((p.staffTrust??70)+2,0,100)}else{p.morale=clamp(p.morale-3,15,99);p.staffTrust=clamp((p.staffTrust??70)-2,0,100)}}
 else if(d.type==='PLAYER_REDSHIRT_DISCUSSION'&&p){if(option.id==='preserve'){p.redshirtActive=true;p.staffTrust=clamp((p.staffTrust??70)+2,0,100)}else if(option.id==='continue'){p.redshirtActive=false;p.morale=clamp(p.morale+2,15,99)}else p.staffTrust=clamp((p.staffTrust??70)-2,0,100)}
 else if(d.type==='PLAYER_POSITION_CHANGE_REQUEST'&&p){if(option.id==='approve'&&applyRequestedPositionChange(t,p,d.requestedPosition)){p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+3,0,100)}else if(option.id==='defer')p.requestedPositionChange={season:universe.year,week:universe.week,from:p.pos,to:d.requestedPosition,status:'DEFERRED'};else if(option.id==='decline'){p.requestedPositionChange={season:universe.year,week:universe.week,from:p.pos,to:d.requestedPosition,status:'DECLINED'};p.morale=clamp(p.morale-4,15,99);p.staffTrust=clamp((p.staffTrust??70)-3,0,100)}}
 else if(d.type==='RECRUITING_PRIORITY'&&option.id.startsWith('prioritize_')){const rid=option.id.slice(11),r=universe.recruits.find(x=>String(x.id)===rid);if(!r||r.committed||!r.targeted||r.visitWeek)return false;scheduleVisit(r);growRecruiterRelationship(r,t,3)}
 return finishWeeklyDecision(d,option,t,actor);}
// A face for every named player: portrait, jersey and position, linking to the canonical profile.
function playerFaceChip(id,role=''){const f=id!=null&&findPlayer(id);if(!f?.p)return'';const p=ensurePortrait(f.p);return `<button type="button" class="face-chip" data-player="${gameEscape(p.id)}">${portraitTag(p,36,'list')}<span><b>${gameEscape(p.name)}</b><small>#${gameEscape(p.jerseyNumber??'')} · ${gameEscape(p.pos)}${role?` · ${gameEscape(role)}`:''}</small></span></button>`}
function decisionFacesHTML(d){const faces=d.starterId&&d.playerId?[playerFaceChip(d.starterId,'Starter'),playerFaceChip(d.playerId,'Challenger')]:[playerFaceChip(d.playerId)];const html=faces.filter(Boolean).join(faces.length>1?'<span class="face-vs">vs</span>':'');return html?`<div class="decision-faces">${html}</div>`:''}
function renderWeeklyDecisions(){
 const host=$('#weeklyDecisions'),t=selected();if(!host||!t)return;
 ensureWeeklyDecisions(t);
 const open=guidanceStoredDecisions(t),blocked=open.some(d=>d.type!=='WEEKLY_GAMEPLAN');
 const card=d=>`<div class="decision-card${d.source==='PLAYER'?' player-request':''}"><div class="decision-kicker">${d.type==='WEEKLY_GAMEPLAN'?'OPTIONAL PREPARATION':d.source==='PLAYER'?'PLAYER REQUEST':'DECISION REQUIRED'}</div><div class="decision-title">${gameEscape(d.title)}</div>${decisionFacesHTML(d)}<div class="decision-summary">${gameEscape(d.summary)}</div>${d.type!=='WEEKLY_GAMEPLAN'?`<button type="button" class="decision-room-link" data-decision-room="${gameEscape(d.id)}">Compare and decide</button>`:''}<div class="decision-options">${d.options.map(o=>`<button class="decision-option" data-decision="${gameEscape(d.id)}" data-choice="${gameEscape(o.id)}">${gameEscape(o.label)}${o.recommended?' · Staff pick':''}<small>${gameEscape(o.description)}</small></button>`).join('')}</div></div>`;
 host.innerHTML=open.filter(d=>d.type!=='WEEKLY_GAMEPLAN').map(card).join('');
 const optional=$('#optionalWeeklyDecisions');if(optional)optional.innerHTML=open.filter(d=>d.type==='WEEKLY_GAMEPLAN').map(card).join('');
 for(const id of ['#simWeek','#seasonWeek'])$(id).disabled=openingPreseason()||blocked;
 $('#hubAdvance').disabled=openingPreseason()?false:blocked;
 $$('[data-decision]').forEach(b=>b.onclick=()=>resolveWeeklyDecision(b.dataset.decision,b.dataset.choice));$$('[data-decision-room]').forEach(b=>b.onclick=()=>globalThis.DynastyDecisionRoom?.open(b.dataset.decisionRoom));
 for(const h of [host,optional])if(h){h.querySelectorAll('.face-chip[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));paintPortraits(h)}
}

// --- v0.9.13: the weekly plan ----------------------------------------------
// Fourteen tabs and no signposting: the sequence that actually advances a
// dynasty (season → spring → fall camp → offseason) was invisible until you
// got stuck. This derives a short, ordered list of what is worth doing now,
// with the steps you have already cleared shown as done so the run of play
// reads like a checklist rather than a guess.
function planStep(key,label,detail,tab,done=false,priority=50){return {key,label,detail,tab,done,priority}}
function weeklyPlan(u){
 if(!u)return {items:[],remaining:0,heading:''};
 const out=[],ds=ensureDevelopmentState(),phase=universe.phase;
 // 1. The gate that moves the calendar. There is always exactly one.
 if(openingPreseason())
  out.push(planStep('begin','Begin season','Your schedule is ready. Start Week 1 when your setup feels right.','dashboard',false,100));
 else if(phase==='regular'&&universe.week<12)
  out.push(planStep('sim',`Play week ${universe.week+1}`,'Simulate the week, or take the game yourself in Game Day.','dashboard',false,100));
 else if(phase==='confReady')
  out.push(planStep('conf','Play the conference championships','The regular season is over.','season',false,100));
 else if(phase==='bowlReady')
  out.push(planStep('bowls','Play the bowl games','Every team with six wins has one more.','season',false,100));
 else if(phase==='playoffReady')
  out.push(planStep('playoff','Play the playoff','Conference titles are settled.','season',false,100));
 else if(phase==='complete'){
  const os=normalizeOffseasonState(),labels={review:'Run season review',departures:'Process departures',signing:'Enroll the signing class',portal:'Resolve the transfer portal',spring:'Run spring development',fall:'Run fall camp',preseason:'Open the new season'},details={review:'Finalize records, honors, administration and coaching.',departures:'Graduates, declarations and portal entrants leave first.',signing:'Committed freshmen join the post-departure roster.',portal:'Place transfers before either development window.',spring:'Develop the actual returning and incoming roster.',fall:'Settle position battles on the opening-day roster.',preseason:'Reset the calendar, schedules and recruiting pool.'};
  OFFSEASON_PHASES.forEach((key,i)=>out.push(planStep(key,labels[key],details[key],['spring','fall'].includes(key)?'development':'offseason',os.completed.includes(key),100-i)));
 }
 // 2. Anything blocking the program.
 for(const o of (universe.openings||[]).filter(o=>o.schoolId===u.id&&o.status==='OPEN'))
  out.push(planStep(`hire_${o.slot}`,`Hire a ${o.role}`,'An interim is holding the job and your staff is weaker for it.','staff',false,95));
 const sch=scholarshipSummary(u);
 if(sch.over)
  out.push(planStep('over','Scholarship limit warning',`${sch.over} over. This does not block postseason; signing day will pull your weakest commitments for you.`,'recruiting',false,92));
 // 3. Recruiting work that is actually available this week.
 const targets=universe.recruits.filter(r=>r.targeted&&!r.committed).length;
 if(sch.room>0&&(phase==='regular'||openingPreseason()))
  out.push(planStep('target',targets?`Work your ${targets} recruiting target${targets===1?'':'s'}`:'Build a recruiting board',
   `${sch.room} scholarship${sch.room===1?'':'s'} open. Auto-target fills the board in one click.`,'recruiting',targets>=Math.min(8,sch.room),70));
 const waver=universe.recruits.find(r=>r.committed===u.name&&r.challenger&&r.pressure>0);
 if(waver)out.push(planStep('waver',`Hold ${waver.name}`,`${waver.challenger} is making a push. Target him, schedule a visit or make a promise.`,'recruiting',false,85));
 // 4. The locker room.
 const risk=u.roster.map(p=>({p,r:transferRisk(p)})).sort((a,b)=>b.r-a.r)[0];
 if(risk&&risk.r>=50)
  out.push(planStep('risk',`Check in on ${risk.p.name}`,`Transfer risk ${Math.round(risk.r)}. Playing time, a broken promise or a scheme change is behind it.`,'roster',false,60));
 out.sort((a,b)=>(a.done-b.done)||(b.priority-a.priority));
 const items=out.slice(0,6);
 return {items,remaining:items.filter(x=>!x.done).length,
  heading:phase==='complete'?'Offseason checklist'
   :phase==='confReady'||phase==='playoffReady'?'Postseason'
   :openingPreseason()?'Preseason setup'
   :universe.week===0?'Before the season':`Week ${universe.week+1}`};
}
function renderWeeklyPlan(){
 const u=selected();if(!u||!$('#weeklyPlan'))return;
 renderWeeklyDecisions();
 const plan=weeklyPlan(u);
 $('#planCount').textContent=plan.remaining?`${plan.remaining} thing${plan.remaining===1?'':'s'} worth doing`:'Nothing pending';
 $('#planHeading').textContent=plan.heading;
 $('#weeklyPlan').innerHTML=plan.items.map((x,i)=>
  `<div class="plan-item${x.done?' plan-done':''}" data-plan="${i}" data-tab="${gameEscape(x.tab)}" role="button" tabindex="0">
   <span class="plan-mark">${x.done?'✓':'○'}</span>
   <span class="plan-text"><span class="plan-label">${gameEscape(x.label)}</span><span class="plan-detail">${gameEscape(x.detail)}</span></span>
  </div>`).join('')||'<div class="muted small">Nothing pending.</div>';
 $$('#weeklyPlan [data-plan]').forEach(el=>{
  const go=()=>{const b=$(`.tabs button[data-tab="${el.dataset.tab}"]`);if(b)b.click()};
  el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}};
 });
}
function renderWeeklyHub(){universe.weeklyHub=[...familiarFaceItems(selected()),...(universe.weeklyHub||[]).filter(x=>x.kicker!=='FAMILIAR FACE')].slice(0,9);let hub=universe.weeklyHub||[];$('#hubTitle').textContent=openingPreseason()?'Preseason Briefing':({confReady:'Championship Week Briefing',bowlReady:'Bowl Season Briefing',playoffReady:'Playoff Briefing',complete:'Season Complete'})[universe.phase]||`Week ${Math.min(universe.week+1,12)} Briefing`;if(!hub.length)buildPreseasonHub();$('#weeklyHub').innerHTML=(universe.weeklyHub||[]).map((x,i)=>`<div class="hub-item ${x.type||''}${x.tab?' hub-link':''}"${x.tab?` data-hub="${i}" data-tab="${x.tab}"${x.gameId?` data-game-id="${gameEscape(x.gameId)}"`:''} role="button" tabindex="0"`:''}><div class="hub-kicker">${globalThis.DynastyArt?.img(globalThis.DynastyArt.kickerKey(x.kicker),'dl-art dl-art-kicker')||''}${x.kicker}</div><div class="hub-main">${x.main}</div><div class="hub-sub">${x.sub||''}</div></div>`).join('');$$('[data-hub]').forEach(el=>{const go=()=>openHubItem((universe.weeklyHub||[])[+el.dataset.hub]);el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}})}
function openHubItem(x){if(!x?.tab)return;goToTab(x.tab);if(x.gameId){showGameCenter(x.gameId);return}if(x.player&&findPlayer(x.player))showPlayerProfile(x.player);else if(x.recruit&&universe.recruits.find(r=>r.id===x.recruit))showRecruitProfile(x.recruit)}
// Each leader row carries its share of the category leader (--lead) so the row draws a proportional bar.
function leaderShare(v,top){return top>0?Math.max(4,Math.round(100*v/top)):0}
function statLeaderRows(list,key,fmt=v=>v,n=8){const rows=list.filter(x=>(x.p.stats?.[key]||0)>0).sort((a,b)=>(b.p.stats?.[key]||0)-(a.p.stats?.[key]||0)).slice(0,n),top=rows[0]?.p.stats?.[key]||0;return rows.map((x,i)=>`<div class="leader-row" style="--lead:${leaderShare(x.p.stats?.[key]||0,top)}%"><span>${globalThis.DynastyArt?.img(globalThis.DynastyArt.medalKey(i),'dl-art dl-art-medal')||''}${i+1}</span><span class="leader-who">${portraitTag(x.p,34,'list')}<span><button class="player-button" data-player="${x.p.id}">${x.p.name}</button><div class="small muted">${x.p.pos} · ${x.t.name}</div></span></span><span class="leader-val">${fmt(x.p.stats?.[key]||0,x.p.stats)}</span></div>`).join('')||'<span class="muted">No qualifying statistics yet.</span>'}
function renderStats(){const u=selected(),scope=$('#statsScope')?.value||'national',all=scope==='team'?u.roster.map(p=>({p,t:u})):allActivePlayers();$('#passingLeaders').innerHTML=statLeaderRows(all.filter(x=>x.p.pos==='QB'),'passYds');$('#rushingLeaders').innerHTML=statLeaderRows(all.filter(x=>['RB','QB'].includes(x.p.pos)),'rushYds');$('#receivingLeaders').innerHTML=statLeaderRows(all.filter(x=>['WR','TE','RB'].includes(x.p.pos)),'recYds');const defScore=x=>(x.p.stats?.sacks||0)*5+(x.p.stats?.intDef||0)*7+(x.p.stats?.tackles||0)*.25;let def=all.filter(x=>['EDGE','DT','LB','CB','S'].includes(x.p.pos)&&defScore(x)>0).sort((a,b)=>defScore(b)-defScore(a)).slice(0,8),defTop=def[0]?defScore(def[0]):0;$('#defensiveLeaders').innerHTML=def.map((x,i)=>`<div class="leader-row" style="--lead:${leaderShare(defScore(x),defTop)}%"><span>${i+1}</span><span class="leader-who">${portraitTag(x.p,34,'list')}<span><button class="player-button" data-player="${x.p.id}">${x.p.name}</button><div class="small muted">${x.p.pos} · ${x.t.name}</div></span></span><span class="leader-val">${x.p.stats.sacks||0} SCK · ${x.p.stats.intDef||0} INT</span></div>`).join('')||'<span class="muted">No defensive statistics yet.</span>';$('#teamStatHeading').textContent=`${u.name} Production`;let rows=u.roster.filter(p=>(p.stats.games||0)>0).sort((a,b)=>seasonScore(b,u)-seasonScore(a,u)).slice(0,25);$('#teamStatTable').innerHTML=rows.map(p=>`<div class="lineitem"><span><button class="player-button" data-player="${p.id}">${p.name}</button> · ${p.pos}</span><span>${statLine(p.stats)}</span></div>`).join('')||'<span class="muted">No games played yet.</span>';attachPlayerLinks()}
function recruitingClassScore(t){let c=universe.recruits.filter(r=>r.committed===t.name);return c.reduce((a,r)=>a+r.scoutUp*(r.stars*.25+.45),0)}
function recruitingClassRank(t){if(classCommitCount(t.name)===0)return null;let ranked=universe.teams.filter(x=>classCommitCount(x.name)>0).sort((a,b)=>recruitingClassScore(b)-recruitingClassScore(a));return ranked.findIndex(x=>x.name===t.name)+1}
function renderRecruitBattles(){const u=selected(),targets=universe.recruits.filter(r=>r.targeted&&!r.committed).sort((a,b)=>b.interest-a.interest).slice(0,6);$('#recruitBattleBoard').innerHTML=targets.map(r=>{let top=recruitTopSchools(r,3);return `<div class="battle-card"><div><button class="player-button" data-recruit="${r.id}">${r.name}</button> · ${r.pos} · #${r.nationalRank} · ${'★'.repeat(r.stars)}</div><div class="small muted">${r.highSchool} · ${r.homeCity}, ${r.homeState} · ${recruitDistance(u,r)} mi · priority: ${r.priority}</div><div class="battle-schools">${top.map((x,i)=>`<span class="battle-school">${i+1}. ${x.t.name}</span>`).join('')}</div></div>`}).join('')||'<span class="muted">Target recruits to create active battles.</span>';attachRecruitLinks();attachRecruitSort()}
function attachRecruitLinks(){$$('[data-recruit]').forEach(b=>b.onclick=()=>showRecruitProfile(b.dataset.recruit))}
function showRecruitProfile(id){let r=universe.recruits.find(x=>x.id===id);if(!r)return;const u=selected(),top=recruitTopSchools(r,5),primary=coachById(r.primaryRecruiterCoachId)?.coach;ensureScoutingIntel(r,u,true);$('#recruitDialogName').textContent=r.name;$('#recruitDialogMeta').textContent=`${r.pos} · ${'★'.repeat(r.stars)} · #${r.nationalRank} national / #${r.positionRank} ${r.pos} / #${r.stateRank} ${r.homeState}`;let reasons=recruitPitchBreakdown(u,r).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,8);$('#recruitDialogBody').innerHTML=`${scoutingPanelHTML(r,u,true)}<div class="profile-grid"><div class="profile-stat"><div class="small muted">Hometown</div><div class="v">${r.homeCity}, ${r.homeState}</div></div><div class="profile-stat"><div class="small muted">High School</div><div class="v">${r.highSchool}</div></div><div class="profile-stat"><div class="small muted">Distance</div><div class="v">${recruitDistance(u,r)} mi</div></div><div class="profile-stat"><div class="small muted">Interest</div><div class="v">${r.interest}%</div></div></div><div class="profile-sections"><section class="profile-section"><h3>Recruiting Race</h3>${top.map((x,i)=>`<div class="lineitem"><span>${i+1}. ${x.t.name}</span><strong>${Math.round(x.score)}</strong></div>`).join('')}</section><section class="profile-section"><h3>Your Pitch</h3>${reasons.map(x=>`<div class="lineitem"><span>${x[0]}</span><strong class="${x[1]>5?'pitch-positive':x[1]<0?'pitch-negative':'pitch-neutral'}">${x[1]>=0?'+':''}${Math.round(x[1])}</strong></div>`).join('')}</section><section class="profile-section profile-section--wide"><h3>Recruitment</h3><div class="lineitem"><span>Distance preference</span><strong>${r.distanceImportance}/100 · comfort about ${r.distanceTolerance} mi</strong></div><div class="lineitem"><span>Primary recruiter</span><strong>${primary?coachEscape(primary.name):'Not established'}</strong></div><div class="lineitem"><span>Current promise</span><strong>${r.promise||'None'}</strong></div>${scoutingHistoryHTML(r)}</section></div>`;$('#recruitDialog').showModal()}

function renderRosterBoard(){const u=selected(),f=$('#positionFilter').value||'ALL';let rows=u.roster.filter(p=>f==='ALL'||p.pos===f).sort((a,b)=>POS.indexOf(a.pos)-POS.indexOf(b.pos)||b.perceived-a.perceived);$('#rosterBody').innerHTML=rows.map(p=>`<tr><td data-label="Player"><div class="player-cell">${portraitTag(p,64,'list')}<div class="player-cell-text"><button class="player-button" data-player="${p.id}">${p.name}</button><div class="small muted">#${p.jerseyNumber??0} · ${p.origin}</div></div></div></td><td data-label="Pos">${p.pos}</td><td data-label="Elig">${eligibilityLabel(p)}</td><td data-label="Redshirt">${p.redshirtUsed?'<span class="pill rs-used">Used</span>':`<button class="rs-button ${p.redshirtActive?'rs-active':''}" data-redshirt="${p.id}" ${canRedshirt(p)?'':'disabled'}>${p.redshirtActive?'Protecting':'Available'}</button>`}</td><td data-label="Ht/Wt">${heightStr(p.height)} / ${p.weight}</td><td data-label="Style">${archetypeChipHTML(p.style)}</td><td data-label="Current">${scoutRangeText(p,u,false)}</td><td data-label="Upside">${scoutRangeText(p,u,true)}</td><td data-label="Scheme Fit">${grade(playerSchemeFit(p,u))}</td><td data-label="Health" class="${p.injuryWeeks?'health-out':p.health<78?'health-warn':'health-ok'}">${healthText(p)}</td><td data-label="Morale">${p.morale}</td><td data-label="NIL">${nilCellHTML(p,u)}</td><td data-label="Academics" class="${academicallyIneligible(p)?'health-out':academicRisk(p)?'health-warn':'health-ok'}">${academicStatusText(p)}</td></tr>`).join('');$$('[data-redshirt]').forEach(b=>b.onclick=()=>toggleRedshirt(b.dataset.redshirt));$$('[data-nil-player]').forEach(b=>b.onclick=()=>toggleNilPlayer(b.dataset.nilPlayer));attachPlayerLinks()}
function renderDepth(){const u=selected();ensureRoleDepth(u);const off=OFF_SCHEMES[u.offScheme],def=DEF_SCHEMES[u.defScheme];$('#offPackages').innerHTML=`<div class="scheme-badge">${u.offScheme}</div><div class="lineitem"><span>Base pass rate</span><strong>${Math.round(off.pass*100)}%</strong></div><div class="lineitem"><span>Primary skill package</span><strong>${off.pass>.60?'X / Z / Slot':off.pass<.42?'Lead back / TE / Power':'Multiple personnel'}</strong></div><div class="lineitem"><span>Protected redshirts</span><strong>${u.roster.filter(p=>p.redshirtActive).length}</strong></div>`;$('#defPackages').innerHTML=`<div class="scheme-badge">${u.defScheme}</div><div class="lineitem"><span>Pressure</span><strong>${def.pressure}</strong></div><div class="lineitem"><span>Coverage</span><strong>${def.coverage}</strong></div><div class="lineitem"><span>Sub package</span><strong>Nickel / Slot / Rush roles</strong></div>`;$('#depthGrid').innerHTML=ROLE_DEFS.map(role=>{let a=rolePlayers(u,role.id),top=a.slice(0,4),active=roleStarter(u,role.id);return `<div class="depth-card role-card"><div class="role-side">${role.side}</div><div class="strong">${role.label}</div><select data-role="${role.id}" aria-label="${gameEscape(role.label)}">${a.map(p=>`<option value="${p.id}" ${a[0]?.id===p.id?'selected':''}>${p.name} · ${grade(p.perceived)} · ${grade(roleFit(p,u,role,true))}${p.injuryWeeks?' · OUT':p.redshirtActive?' · RS':''}</option>`).join('')}</select><div class="role-note">Role fit uses traits + scheme, not universal OVR.</div><div class="depth-list">${top.map((p,i)=>`<div>${i+1}. <button class="player-button" data-player="${p.id}">${p.name}</button> · ${grade(roleFit(p,u,role,true))} fit ${p===active?'<span class="good">• active</span>':''}${p.injuryWeeks?` · <span class="health-out">${p.injuryWeeks} wk</span>`:p.redshirtActive?' · <span class="warn">RS protected</span>':''}</div>`).join('')}</div></div>`}).join('');$$('[data-role]').forEach(s=>s.onchange=()=>{let id=s.dataset.role,pid=s.value,arr=u.roleDepth[id]||[];u.roleDepth[id]=[pid,...arr.filter(x=>x!==pid)];render()});attachPlayerLinks()}
function renderStaffBoard(){const u=selected();$('#staffList').innerHTML=Object.values(u.staff).map(c=>{ensureCoachCareer(c,u,coachSlot(u,c));return `<div class="coach-card"><div class="strong"><button class="player-button" data-coach="${coachEscape(c.id)}">${coachEscape(c.name)}</button> <span class="pill">${coachEscape(c.role)}</span>${c.interim?' <span class="pill bad">INTERIM</span>':''}</div><div class="compact muted">Age ${c.age} · Year ${c.years+1} · ${c.contractYears??2} yr contract · $${c.salary??1.2}M${c.playCallAuthority?` · ${c.playCallAuthority==='full'?'Full play-calling':'Shared authority'}`:''}</div><div class="compact">Recruit ${grade(c.recruiting)} · Develop ${grade(c.development)} · Evaluate ${grade(c.evaluation)} · Call ${grade(c.playCall)} · Adapt ${grade(c.adaptability)}</div><div class="small muted">${coachEscape((c.specialties||coachSpecialties(c)).join(' · '))} · ${coachEscape(coachTraitText(c))}${c.preferredScheme?` · runs ${coachEscape(c.preferredScheme)}`:''}</div></div>`}).join('');const o=OFF_SCHEMES[u.offScheme],d=DEF_SCHEMES[u.defScheme];const bar=side=>{const tr=schemeTransition(u,side);return tr?`<div class="compact warn">${gameEscape(schemeInstallNote(u,side))}</div><div class="bar"><span style="width:${tr.familiarity}%"></span></div>`:'<div class="small muted">Fully installed.</div>'};
 $('#schemeCard').innerHTML=`<div class="scheme-badge">OFF: ${u.offScheme}</div><div class="compact muted">Pass tendency ${Math.round(o.pass*100)}% · Pace ${o.pace}/100 · Core traits: ${o.traits.join(', ')}</div>${bar('off')}<br><div class="scheme-badge">DEF: ${u.defScheme}</div><div class="compact muted">Pressure ${d.pressure} · Coverage ${d.coverage} · Run control ${d.run} · Core traits: ${d.traits.join(', ')}</div>${bar('def')}`;$('#coachingTree')&&($('#coachingTree').innerHTML=coachingTreeHTML(selected()));$('#schemeFitLeaders').innerHTML=u.roster.slice().sort((a,b)=>playerSchemeFit(b,u)-playerSchemeFit(a,u)).slice(0,10).map(p=>`<div class="lineitem"><span>${p.pos} ${p.name} · ${p.style}</span><strong>${grade(playerSchemeFit(p,u))} (${playerSchemeFit(p,u)})</strong></div>`).join('');renderCoachHistory(u);attachCoachLinks();$('#coachMarket').innerHTML=coachMarketHTML(u);attachCoachMarketLinks()}
function candidateSourceLabel(c){return c.source==='internal'?'Internal promotion':c.source==='external'?`From ${coachEscape(c.fromSchoolName)}`:'Free agent'}
function candidateCardHTML(o,c){const declined=c.status==='DECLINED',draft=candidateOfferDraft&&candidateOfferDraft.candidateId===c.candidateId&&candidateOfferDraft.openingId===o.id?candidateOfferDraft:null;
 return `<div class="coach-card candidate-card${declined?' declined':''}"><div class="strong">${coachEscape(c.name)} <span class="pill">${candidateSourceLabel(c)}</span>${declined?' <span class="pill bad">DECLINED</span>':c.interviewed?' <span class="pill">INTERVIEWED</span>':''}</div>`+
 `<div class="compact muted">Age ${c.age} · Fit ${c.fitScore} · Wants $${c.askSalary}M · ${c.askYears}yr · ${c.wantsAuthority==='full'?'full play-calling':'shared authority'}</div>`+
 `<div class="compact">Recruit ${grade(c.recruiting)} · Develop ${grade(c.development)} · Evaluate ${grade(c.evaluation)} · Call ${grade(c.playCall)} · Adapt ${grade(c.adaptability)}</div>`+
 `<div class="small muted">${coachEscape((c.specialties||[]).join(' · '))}</div>`+
 (()=>{const side=SCHEME_SIDE[o.slot];if(!side||!c.preferredScheme)return '';
  const cur=side==='off'?T(o.schoolName)?.offScheme:T(o.schoolName)?.defScheme;
  return c.preferredScheme===cur?`<div class="small muted">Runs your current ${coachEscape(c.preferredScheme)}.</div>`
   :`<div class="small warn">Runs ${coachEscape(c.preferredScheme)} — hiring him replaces ${coachEscape(cur)} and starts a scheme installation.</div>`})()+
 (declined?`<div class="small muted">${coachEscape(c.declineReason||'Declined the opportunity.')}</div>`:
  draft?`<div class="offer-form"><label>Salary $<input type="number" step="0.1" min="0.4" max="9.9" data-offer-salary value="${draft.salary}"></label><label>Years<input type="number" min="1" max="6" data-offer-years value="${draft.years}"></label><label>Authority<select data-offer-authority><option value="shared"${draft.authority==='shared'?' selected':''}>Shared</option><option value="full"${draft.authority==='full'?' selected':''}>Full play-calling</option></select></label><div class="offer-actions"><button type="button" data-send-offer="${o.id}|${c.candidateId}">Send Offer</button> <button type="button" data-cancel-offer>Cancel</button></div></div>`:
  `<div class="offer-actions"><button type="button" data-interview="${o.id}|${c.candidateId}" ${c.interviewed?'disabled':''}>${c.interviewed?'Interviewed':'Interview'}</button> <button type="button" data-start-offer="${o.id}|${c.candidateId}" ${c.interviewed?'':'disabled'}>Make Offer</button></div>`)+
 '</div>'}
function coachMarketHTML(t){const openings=(universe.openings||[]).filter(o=>o.schoolId===t.id&&o.status==='OPEN');if(!openings.length)return '';const budget=teamStaffBudget(t),spend=teamStaffSpend(t);
 return `<div class="card"><h3>Coaching Search</h3><div class="small muted">Athletic department budget: $${spend.toFixed(1)}M / $${budget.toFixed(1)}M spent</div>`+
 openings.map(o=>{const cands=(universe.candidateMarket?.[o.id]||[]).filter(c=>c.status!=='WITHDRAWN'&&c.status!=='HIRED');return `<h4 style="margin-top:12px">${coachEscape(o.role)} opening${o.reason?` · ${coachEscape(o.reason)}`:''}</h4>`+cands.map(c=>candidateCardHTML(o,c)).join('')}).join('')+'</div>'}
function attachCoachMarketLinks(){
 $$('[data-interview]').forEach(b=>b.onclick=()=>{const [oid,cid]=b.dataset.interview.split('|');interviewCandidate(oid,cid);renderStaff()});
 $$('[data-start-offer]').forEach(b=>b.onclick=()=>{const [oid,cid]=b.dataset.startOffer.split('|'),c=(universe.candidateMarket[oid]||[]).find(x=>x.candidateId===cid);if(!c)return;candidateOfferDraft={openingId:oid,candidateId:cid,salary:c.askSalary,years:c.askYears,authority:c.wantsAuthority};renderStaff()});
 $$('[data-cancel-offer]').forEach(b=>b.onclick=()=>{candidateOfferDraft=null;renderStaff()});
 $$('[data-send-offer]').forEach(b=>b.onclick=()=>{const [oid,cid]=b.dataset.sendOffer.split('|'),card=b.closest('.offer-form'),salary=+card.querySelector('[data-offer-salary]').value,years=+card.querySelector('[data-offer-years]').value,authority=card.querySelector('[data-offer-authority]').value,res=extendOffer(oid,cid,{salary,years,authority});candidateOfferDraft=null;setStatus(res.accepted?'Hired! The new coach is in place.':(res.reason||'Offer declined.'));renderStaff();render()});
}
function renderGameLab(){
 const u=selected(),g=findUserGame();
 if(g){
  const opp=T(g.home===u.name?g.away:g.home),P=profiles(u),O=profiles(opp);
  $('#nextGameCard').innerHTML=`<strong>Week ${universe.week+1}: ${g.home===u.name?'vs':'@'} ${opp.name}</strong><div class="muted">${u.name}: O ${grade(P.offense)} / D ${grade(P.defense)} · ${opp.name}: O ${grade(O.offense)} / D ${grade(O.defense)}</div>`;
  $('#keyMatchups').innerHTML=`<div class="lineitem"><span>Your QB vs their coverage</span><strong>${grade(P.qb)} vs ${grade(O.coverage)}</strong></div><div class="lineitem"><span>Your OL vs their front</span><strong>${grade(P.ol)} vs ${grade(O.front)}</strong></div><div class="lineitem"><span>Your scheme fit</span><strong>${grade(P.offFit)}</strong></div><div class="lineitem"><span>Their scheme fit</span><strong>${grade(O.offFit)}</strong></div>`;
 }else $('#nextGameCard').innerHTML=openingPreseason()?'<strong>Week 1 is waiting.</strong><div class="muted">Choose Begin Season in This Week when your team is ready.</div>':'<span class="muted">No remaining game for your team this week.</span>';
 const d=universe.lastDetailedGame;
 if(d){
  $('#detailedBox').innerHTML=`${gameResultActions(d.gameId)}${d.season?`<div class="small muted">${d.season} · Week ${d.week}</div>`:''}<div class="big">${d.away} ${d.ap} – ${d.hp} ${d.home}</div><div class="lineitem"><span>${d.away} total offense</span><strong>${d.box.away.passYds+d.box.away.rushYds}</strong></div><div class="lineitem"><span>${d.home} total offense</span><strong>${d.box.home.passYds+d.box.home.rushYds}</strong></div><div class="lineitem"><span>Turnovers</span><strong>${d.box.away.turnovers} – ${d.box.home.turnovers}</strong></div>`;
  $('#detailedLog').innerHTML=d.log.slice().reverse().map(x=>`<div class="playline">${x}</div>`).join('');
  $('#detailedBox').dataset.empty='';$('#detailedLog').dataset.empty='';
 }else{$('#detailedBox').textContent='No detailed game simulated yet.';$('#detailedLog').textContent='No detailed game simulated yet.';$('#detailedBox').dataset.empty='1';$('#detailedLog').dataset.empty='1'}
}
function renderMatchupStrategy(){
 const u=selected(),g=findUserGame();if(!g)return;
 const opp=T(g.home===u.name?g.away:g.home),m=gameMatchup(u,opp),P=m.teamProfile,O=m.opponentProfile,e=m.teamEdges,oe=m.opponentEdges,
  plan=teamGameplanFor(u,opp.name),tier=GAMEPLAN_TIERS[plan?.prep]||GAMEPLAN_TIERS.standard,rec=gameplanRecommendation(u,opp,m),
  isHome=g.home===u.name,homeTeam=isHome?u:opp,home=isHome?`Home field: about +${homeFieldFor(u).toFixed(1)} points`:'Road game: opponent receives its home-field edge',
  outU=u.roster.filter(p=>!gameAvailable(p)).length,outO=opp.roster.filter(p=>!gameAvailable(p)).length,
  rival=rivalOf(u),isRival=rival?.name===opp.name,sameConference=u.conference===opp.conference,
  stakes=isRival?`${u.rivalry?.trophy||'Rivalry game'} · ${rivalrySeriesText(u)}`:sameConference?`${u.conference} Conference game`:'Nonconference game',
  venue=`${homeTeam.city}, ${homeTeam.state}`,
  rankLabel=t=>t.rank<=25?`#${t.rank}`:'NR',
  row=(label,value)=>`<div class="lineitem"><span>${label}</span><strong class="${value>=3?'good':value<=-3?'bad':''}">${matchupEdgeLabel(value)} (${value>=0?'+':''}${value})</strong></div>`;
 $('#nextGameCard').innerHTML=`<div class="gameday-data" hidden data-week="${universe.week+1}" data-location="${isHome?'vs':'@'}" data-user-id="${u.id}" data-opponent-id="${opp.id}" data-user-name="${gameEscape(u.name)}" data-opponent-name="${gameEscape(opp.name)}" data-user-record="${u.w}-${u.l}" data-opponent-record="${opp.w}-${opp.l}" data-user-rank="${rankLabel(u)}" data-opponent-rank="${rankLabel(opp)}" data-user-conference="${gameEscape(u.conference)}" data-opponent-conference="${gameEscape(opp.conference)}" data-venue="${gameEscape(venue)}" data-stakes="${gameEscape(stakes)}" data-rivalry="${isRival?'true':'false'}" data-user-offense="${grade(P.offense)}" data-user-defense="${grade(P.defense)}" data-opponent-offense="${grade(O.offense)}" data-opponent-defense="${grade(O.defense)}" data-opponent-pass-mix="${Math.round(OFF_SCHEMES[opp.offScheme].pass*100)}" data-home-edge="${gameEscape(home)}" data-user-out="${outU}" data-opponent-out="${outO}" data-active-plan="${gameEscape(tier.label)}" data-recommended-plan="${gameEscape(GAMEPLAN_TIERS[rec.id].label)}" data-recommendation="${gameEscape(rec.reason)}"></div><strong>Week ${universe.week+1}: ${isHome?'vs':'@'} ${gameEscape(opp.name)}</strong><div class="muted">${gameEscape(u.name)}: O ${grade(P.offense)} / D ${grade(P.defense)} · ${gameEscape(opp.name)}: O ${grade(O.offense)} / D ${grade(O.defense)}</div><div class="small muted">Expected opponent mix: ${Math.round(OFF_SCHEMES[opp.offScheme].pass*100)}% pass · ${home} · unavailable: ${outU} yours / ${outO} theirs</div><div class="small"><strong>Active plan:</strong> ${tier.label}. <strong>Staff recommendation:</strong> ${GAMEPLAN_TIERS[rec.id].label} — ${rec.reason}</div>`;
 $('#keyMatchups').innerHTML=`${row('Your passing game vs their coverage',e.passGame)}${row('Your run game vs their front',e.runGame)}${row('Your pass protection vs their rush',e.passProtection)}${row('Their passing game vs your coverage',oe.passGame)}${row('Their run game vs your front',oe.runGame)}${row('Their protection vs your rush',oe.passProtection)}<div class="small muted">Based on current health, fatigue, scheme and game plan.</div>`
}
TAB_RENDERERS.gamelab=()=>runRender('gamelab',()=>{renderGameLab();renderMatchupStrategy()});
function renderSeason(){const u=selected();$('#seasonPhase').textContent=openingPreseason()?`${universe.year} · Preseason`:`${universe.year} · ${seasonStageLabel()}`;$('#confStandings').innerHTML=confStand(u.conference).map((t,i)=>`<div class="rankrow ${t.name===u.name?'strong':''}"><div>${i+1}. ${teamLogoHTML(t.id,20,'team-logo--inline')} ${t.name}</div><div>${t.cw}-${t.cl} · ${t.w}-${t.l}</div></div>`).join('');$('#latestResults').innerHTML=universe.latest.length?universe.latest.slice(-12).reverse().map(r=>`<div class="resultrow ${r.label?'champ':''}"><div>${r.label?`<span class="small muted">${r.label}</span><br>`:''}${teamLogoHTML(T(r.away)?.id,18,'team-logo--inline')} ${r.away}</div><div><strong>${r.ap}</strong> – <strong>${r.hp}</strong> ${teamLogoHTML(T(r.home)?.id,18,'team-logo--inline')} ${r.home} ${gameLink(r.gameId)}</div></div>`).join(''):'<div class="muted">No results yet.</div>';$('#teamSchedule').innerHTML=u.schedule.map(g=>{let opp=g.home===u.name?g.away:g.home,loc=g.home===u.name?'vs':'@',score=g.played?`${g.score[0]}-${g.score[1]}`:'—';return `<div class="resultrow"><div>Wk ${g.week} · ${loc} ${teamLogoHTML(T(opp)?.id,18,'team-logo--inline')} ${opp}${g.detailed?' <span class="pill">Detailed</span>':''}</div><div>${g.played?gameLink(g.gameId,`${g.winner===u.name?'W':'L'} ${g.home===u.name?g.score[1]:g.score[0]}–${g.home===u.name?g.score[0]:g.score[1]}`):score}</div></div>`}).join('')}
