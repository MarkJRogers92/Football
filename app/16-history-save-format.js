// app/16-history-save-format.js: Conference history, the encyclopedia, records and save packing. Part of app.js; see tools/app-source.js.
// v0.12.15 — conference history from the season records the save already keeps.
// New archives freeze membership; old saves can only estimate it from today's teams.
function historySeasons(){ return (universe?.history||[]).filter(h=>h.type==='season').map(h=>h.year); }
function conferenceNames(){ return [...new Set([...(universe?.teams||[]).map(t=>t.conference),...(universe?.history||[]).filter(h=>h.type==='season').flatMap(h=>(h.records||[]).map(r=>r.conference))].filter(Boolean))].sort(); }
function conferenceStandings({conference,year}={}){
 if(!universe)return null;
 const seasons=(universe.history||[]).filter(h=>h.type==='season');
 if(!seasons.length)return null;
 const entry=year!=null?seasons.find(h=>h.year===year):seasons[0];
 if(!entry)return null;
 const controlled=T($('#userTeam')?.value)?.conference;
 const name=conference||controlled||conferenceNames()[0];
 const rows=(entry.records||[])
  .filter(r=>(r.conference??(r.schoolId!=null?teamById(r.schoolId):T(r.name))?.conference)===name)
  .map(r=>({name:r.name,schoolId:r.schoolId??null,w:r.w??0,l:r.l??0,cw:r.cw??0,cl:r.cl??0,pf:r.pf??0,pa:r.pa??0,prestige:r.prestige??0}))
  .sort((a,b)=>b.cw-a.cw||a.cl-b.cl||b.w-a.w||a.l-b.l||(b.pf-b.pa)-(a.pf-a.pa)||a.name.localeCompare(b.name));
 return {year:entry.year,conference:name,membershipEstimated:(entry.records||[]).some(r=>r.conference==null),rows:rows.map((row,index)=>({...row,place:index+1}))};
}
if(typeof globalThis!=='undefined'&&globalThis.DynastyHistoryIndex)
 globalThis.DynastyHistoryIndex=Object.freeze({...globalThis.DynastyHistoryIndex,
  seasons:historySeasons,conferences:conferenceNames,standings:conferenceStandings});



// v0.12.10 — global search across the universe a dynasty already holds. Read-only:
// it never loads a deferred archive and never mutates save state.
function encyclopediaSearch(term,{limit=6}={}){
 const q=String(term||'').trim().toLowerCase();
 if(q.length<2)return [];
 const kindRank={team:0,coach:1,player:2},out=[],seen=new Set();
 const score=name=>{
  const n=String(name||'').toLowerCase();
  if(!n.includes(q))return -1;
  if(n===q)return 0;
  if(n.startsWith(q))return 1;
  if(n.split(/[\s.'-]+/).some(w=>w.startsWith(q)))return 2;
  return 3;
 };
 const push=(kind,id,label,meta)=>{
  if(id==null||!label)return;
  const key=kind+':'+id;
  if(seen.has(key))return;
  const s=score(label);
  if(s<0)return;
  seen.add(key);out.push({kind,id,name:String(label),meta:meta||'',score:s});
 };
 for(const t of universe.teams||[]){
  push('team',t.id,t.name,`${t.conference||'Independent'} · ${t.w??0}–${t.l??0}`);
  for(const c of Object.values(t.staff||{}))if(c?.id)push('coach',c.id,c.name,`${c.role||'Coach'} · ${t.name}`);
 }
 for(const c of universe.coachArchive||[])push('coach',c.id,c.name,c.status==='RETIRED'?'Retired':`Formerly ${c.schoolName||'—'}`);
 for(const t of universe.teams||[])for(const p of t.roster||[])push('player',p.id,p.name,`${p.pos} · ${t.name}`);
 for(const x of universe.transferPortal||[])if(x.p)push('player',x.p.id,x.p.name,'Transfer portal');
 for(const p of universe.playerArchive||[])push('player',p.id,p.name,`${p.lastTeam||'Archived'} · ${p.exitReason||'Archived'}`);
 out.sort((a,b)=>kindRank[a.kind]-kindRank[b.kind]||a.score-b.score||a.name.localeCompare(b.name));
 const counts={team:0,coach:0,player:0},res=[];
 for(const row of out){if(counts[row.kind]>=limit)continue;counts[row.kind]++;res.push(row)}
 return res;
}
function encyclopediaOpen(row){
 if(!row)return false;
 if(row.kind==='player'){showPlayerProfile(row.id);return true}
 if(row.kind==='coach'){showCoachProfile(row.id);return true}
 if(row.kind==='team'){
  const resolved=row.id!=null?teamById(row.id):T(row.name);
  if(!resolved)return false;
  const sel=$('#userTeam');
  // Search is read-only: never write the controlled program. The selector is
  // disabled in Dynasty Mode and switching would end the tenure as "stepped away".
  if(sel&&sel.value===resolved.name){document.querySelector('.tabs button[data-tab="program"]')?.click();return true}
  const team=resolved;
  let dialog=document.querySelector('#programPeek');
  if(!dialog){dialog=document.createElement('dialog');dialog.id='programPeek';dialog.className='program-peek';document.body.append(dialog)}
  dialog.innerHTML=programPeekHTML(team);
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
  return true;
 }
 return false;
}
function programPeekHTML(t){
 const rank=ranked().findIndex(x=>x.name===t.name)+1,coach=t.staff?.HC,controlled=$('#userTeam')?.value||null;
 const facts=[['Record',`${t.w??0}–${t.l??0}${t.cw!=null?` · ${t.cw}–${t.cl} conference`:''}`],['Ranking',rank?`#${rank}`:'Unranked'],['Prestige',String(t.prestige??'—')],['Head coach',coach?`${coach.name} · ${coach.role}`:'—'],['Conference',t.conference||'Independent']];
 return `<div class="program-peek-head">${teamLogoHTML(t.id,44)}<div><h2>${gameEscape(t.name)}</h2><p class="muted">${gameEscape(t.conference||'Independent')}</p></div></div>
 <div class="profile-grid">${facts.map(([k,v])=>`<div class="profile-stat"><div class="small muted">${k}</div><div class="v">${gameEscape(String(v))}</div></div>`).join('')}</div>
 <p class="muted">Read-only program view. You control ${gameEscape(controlled||'one program')}; change programs through career offers, or start a Commissioner-mode dynasty to switch freely.</p>
 <form method="dialog"><button class="primary" type="submit">Close</button></form>`;
}
// App scope is not global by design; presentation modules reach search through this bridge.
if(typeof globalThis!=='undefined')globalThis.DynastyEncyclopedia=Object.freeze({search:encyclopediaSearch,open:encyclopediaOpen});
function renderArchiveSearch(){const q=($('#archiveSearch').value||'').trim().toLowerCase();if(q.length>=2&&archiveIsDeferred()){const current=universe;$('#archiveResults').textContent='Loading archived careers…';return ensureArchiveLoaded().then(()=>{if(universe===current)renderArchiveSearch()}).catch(e=>{if(universe===current)$('#archiveResults').textContent=e.message})}if(q.length<2){$('#archiveResults').innerHTML='<span class="muted">Type at least 2 letters.</span>';return}let results=[];for(const x of universe.transferPortal||[])if(x.p.name.toLowerCase().includes(q))results.push({p:x.p,team:'Transfer portal',status:'Awaiting a destination'});for(const t of universe.teams)for(const p of t.roster)if(p.name.toLowerCase().includes(q))results.push({p,team:t.name,status:'Active'});for(const p of universe.playerArchive||[])if(p.name.toLowerCase().includes(q))results.push({p,team:p.lastTeam||'—',status:p.exitReason||'Archived'});$('#archiveResults').innerHTML=results.slice(0,30).map(x=>`<div class="lineitem"><span><button class="player-button" data-player="${x.p.id}">${x.p.name}</button> · ${x.p.pos}</span><span>${x.team} · ${x.status}</span></div>`).join('')||'<span class="muted">No players found.</span>';attachPlayerLinks()}

function renderRecords(){const u=selected(),final=universe.awards?.[universe.year],aw=final||projectedAwards();$('#awardsHeading').textContent=final?`${universe.year} Award Winners`:`${universe.year} Awards Watch`;$('#awardsBoard').innerHTML=aw.map(a=>`<div class="award-card"><div class="small muted">${a.name}</div><div><strong>${a.playerName}</strong> · ${a.team}${a.pos?` · ${a.pos}`:''}</div></div>`).join('')||'<span class="muted">No award data yet.</span>';let years=Object.keys(universe.draftHistory||{}).sort((a,b)=>b-a),draft=years.length?(universe.draftHistory[years[0]]||[]).filter(d=>d.status!=='College Career Complete'):[];$('#draftBoard').innerHTML=draft?.length?draft.slice().sort((a,b)=>(a.round||99)-(b.round||99)||(a.pick||99)-(b.pick||99)).slice(0,18).map(d=>`<div class="lineitem"><span><span class="draft-round">${d.round?'R'+d.round:'UDFA'}</span> ${d.playerName} · ${d.pos}</span><span>${d.school}</span></div>`).join(''):'<span class="muted">Draft results appear after the first offseason.</span>';let ns=universe.records?.nationalSeason||{},nc=universe.records?.nationalCareer||{};$('#nationalRecords').innerHTML=`<div class="record-group"><h4>Single Season</h4>${Object.entries(RECORD_CATS).map(([k,label])=>{let r=ns[k];return `<div class="lineitem"><span>${label}</span><span class="record-value">${r?`${r.value} · ${r.playerName} (${r.team}, ${r.year})`:'—'}</span></div>`}).join('')}</div><div class="record-group"><h4>Career</h4>${Object.entries(RECORD_CATS).map(([k,label])=>{let r=nc[k];return `<div class="lineitem"><span>${label}</span><span class="record-value">${r?`${r.value} · ${r.playerName} (${r.team})`:'—'}</span></div>`}).join('')}</div>`;$('#schoolRecordsHeading').textContent=`${u.name} Record Book`;$('#schoolRecords').innerHTML=Object.entries(RECORD_CATS).map(([k,label])=>{let r=u.records?.[k];return `<div class="lineitem"><span>${label}</span><span class="record-value">${r?`${r.value} · ${r.playerName} (${r.year})`:'—'}</span></div>`}).join('')}
function renderHistory(){renderGameArchive();let items=[];for(const h of universe.history){if(h.type==='season'){let np=h.awards?.find(a=>a.name==='National Player of the Year');items.push(`<div class="card"><div class="historyrow champ"><span>${h.year} National Champion</span><strong>${h.champion}</strong></div>${np?`<div class="historyrow"><span>National Player of the Year</span><span>${np.playerName} · ${np.team}</span></div>`:''}${h.top10.slice(0,5).map((t,i)=>`<div class="historyrow"><span>#${i+1} ${t.name}</span><span>${t.record}</span></div>`).join('')}</div>`)}else items.push(`<div class="historyrow"><span>${h.year} ${h.event||''}</span><span>${h.detail||''}</span></div>`)}$('#historyLog').innerHTML=items.join('')||'<div class="card muted">No completed seasons yet.</div>'}
function packPlayer(p){return {...p,stats:packStats(p.stats),career:packStats(p.career)}}
function packUniverse(u,includeArchive=true){if(u===universe)syncGameplayRng(u);if(includeArchive&&u===universe&&archiveIsDeferred())throw new Error("Load archived careers before exporting.");const {playerArchive,...core}=u;const out={...core,confChamps:conferenceChampionIdsFor(u),playoffFieldIds:playoffFieldIdsFor(u),teams:u.teams.map(t=>({...t,roster:t.roster.map(packPlayer)}))};if(includeArchive)out.playerArchive=(playerArchive||[]).map(packPlayer);return out}
function normalizeUniverse(){ensureGameplayRng();for(const t of universe?.teams||[])assignTeamJerseys(t);universe.phase??='regular';universe.playLogs??={};universe.gameArchive??=[];universe.gameArchiveVersion??=1;universe.gameCounter=universe.gameArchive.reduce((n,g)=>Math.max(n,Number(g.id.split('_').pop())||0),universe.gameCounter||0);universe.version=APP_VERSION;IDX.teams=null;IDX.players=null;universe.movementLog??=[];universe.lastDetailedGame??=null;normalizePortalState();ensureScheduleRotation();migrateProtectedRivals();universe.playerArchive??=[];universe.recoveredWeek??=-1;universe.weeklyHub??=[];universe.highSchools??=generateHighSchools();universe.awards??={};universe.records??={nationalSeason:{},nationalCareer:{}};universe.records.nationalSeason??={};universe.records.nationalCareer??={};universe.draftHistory??={};universe.recruitClassCounts??={};universe.risingClass??=[];universe.campHistory??={};universe.developmentState??={year:universe.year,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]};if(!Object.keys(universe.recruitClassCounts).length)for(const r of universe.recruits||[])if(r.committed)universe.recruitClassCounts[r.committed]=(universe.recruitClassCounts[r.committed]||0)+1;universe.teams.forEach(t=>{let base=schools.find(s=>s.name===t.name);if(base){t.city??=base.city;t.state??=base.state;t.lat??=base.lat;t.lon??=base.lon}t.staff??=generateStaff(t);for(const c of Object.values(t.staff)){c.contractYears??=gi(1,4);c.salary??=1.2}t.offScheme??=pick(Object.keys(OFF_SCHEMES));t.defScheme??=pick(Object.keys(DEF_SCHEMES));t.nickname??='';t.commits??=[];t.pipelines??=makePipelines(t);t.records??={};ensureSchoolColors(t);ensureTeamDevelopment(t);t.roster.forEach(p=>{p.speed??=clamp(p.trueNow+gi(-8,8),25,99);p.power??=clamp(p.trueNow+gi(-8,8),25,99);p.technique??=clamp(p.trueNow+gi(-8,8),25,99);p.iq??=clamp(p.trueNow+gi(-10,10),20,99);p.composure??=65;p.durability??=70;p.versatility??=60;p.health??=100;p.wear??=0;p.injury??=null;p.injuryWeeks??=0;p.injuryHistory??=[];p.seasonHistory??=[];p.awards??=[];p.draftResult??=null;p.promise??=null;p.promiseBaseline??=p.perceived;p.eligibilityUsed??=({FR:0,SO:1,JR:2,SR:3}[p.year]??0);p.redshirtUsed??=false;p.redshirtActive??=false;p.redshirtSeason??=null;p.stats={...newStats(),...(p.stats||{})};p.career={...newStats(),...(p.career||{})};p.year=CLASS_NAMES[Math.min(3,eligibilityBase(p))]||'SR';ensurePlayerDevelopment(p,t)});ensureDepth(t);ensureRoleDepth(t)});universe.playerArchive.forEach(p=>{p.awards??=[];p.seasonHistory??=[];p.coachRelationships??={};p.primaryRecruiterCoachId??=p.recruitingMemory?.primaryRecruiterCoachId||p.recruitingMemory?.recruiterCoachId||null;p.career={...newStats(),...(p.career||{})};p.stats={...newStats(),...(p.stats||{})};p.eligibilityUsed??=3;p.redshirtUsed??=false;p.redshirtActive=false});if(Array.isArray(universe.schedule)){universe.teams.forEach(t=>t.schedule=[]);universe.schedule.flat().forEach(g=>{T(g.home)?.schedule.push(g);T(g.away)?.schedule.push(g)})}
 universe.weeklyDecisions??=[];if(!universe.teams.some(t=>t.rivalry))deriveRivalries();universe.careerHistory??=[];universe.jobOffers??=[];universe.bowls??=[];universe.signingDay??=null;normalizeConferenceChampions();normalizePlayoffField();if(!universe.academicProgression||universe.academicProgression.season!==universe.year||universe.academicProgression.week!==universe.week||!Array.isArray(universe.academicProgression.teamIds))universe.academicProgression={season:universe.year,week:universe.week,teamIds:[]};rebuildRecruitClassCounts();for(const t of universe.teams){t.fanBaseline??=t.fan_support??60;for(const p of t.roster)ensureAcademics(p,t)}for(const t of universe.teams){ensureAdminState(t);ensureNilState(t)}for(const d of universe.weeklyDecisions)d.source??='STAFF';normalizePromiseState();for(const r of universe.recruits||[])normalizeRecruitGeography(r,universe.highSchools);assignRecruitRanks(universe.recruits||[]);if(!universe.weeklyHub.length)buildPreseasonHub();rebuildIndexes()}
function storageKind(){return DynastyStorage.kind==='desktop'?'desktop':'browser'}
function storageLocation(){return storageKind()==='desktop'?'on this computer':'in this browser'}
function savedDynastyLabel(){return storageKind()==='desktop'?'desktop save':'browser save'}
function setStatus(x){if($('#saveStatus'))$('#saveStatus').textContent=x}
// Browser persistence state is deliberately outside the portable universe.
const SAVE_SLOT_IDS=DynastyStorage.SLOT_IDS||['main','dynasty-2','dynasty-3'];
let activeSaveSlot=SAVE_SLOT_IDS[0];
const browserArchives=new Map();
let storageBusy = false;
let titleBrowserSave = null;
let titleSaveSlots=[];
let browserStore = DynastyStorage.create({slot:activeSaveSlot});
// Session presentation observes real persistence. It never serializes a live game or
// changes the portable save schema. Calendar and checkpoint versions guard late writes.
let sessionSaveRecord=null,sessionCheckpointVersion=0;
const SESSION_VIEW_KEY='dynastyLabSessionContextV1';
const SESSION_VIEW_SELECTS=['positionFilter','statsScope','newsScope','newsWeek','gameHistoryYear'];
let sessionViewRestoredFor=null,sessionViewRestoring=false;
function sessionSaveContext(target=universe,slot=activeSaveSlot){
 const program=target?.teams?.find(t=>t.name===$('#userTeam')?.value);
 return {slot,year:target?.year??null,week:target?.week??null,programId:program?.id??null,world:String(target?.rng?.seed??'')};
}
function readSessionSaveStatus(){
 const context=sessionSaveContext(),record=sessionSaveRecord,matching=record?.universe===universe&&record.slot===activeSaveSlot&&record.programId===context.programId;
 let state='unsaved',message=universe?'Not saved in this slot. Use Save to preserve this dynasty.':'No dynasty open.';
 if(matching){
  state=record.state;message=record.message;
  if(state==='saved'&&(record.stamp!==guidanceCalendarStamp()||record.version!==sessionCheckpointVersion)){state=autosaveKind?'pending':'unsaved';message=autosaveKind?'Checkpoint waiting to save…':'Changes since the last checkpoint. Use Save.'}
 }
 if(!autosaveEnabled&&!['saving','failed'].includes(state)){
  if(state==='saved')message='Saved manually. Autosave is off.';
  else{state='unsaved';message='Autosave is off. Use Save to preserve your progress.'}
 }
 return {...context,state,message,autosaveEnabled};
}
function emitSessionSaveStatus(){
 const status=readSessionSaveStatus();
 if(typeof window?.dispatchEvent==='function'&&typeof CustomEvent==='function')window.dispatchEvent(new CustomEvent('dynasty:save-status',{detail:status}));
 return status;
}
function setSessionSaveStatus(state,message,{target=universe,slot=activeSaveSlot,version=sessionCheckpointVersion,stamp=guidanceCalendarStamp(target),programId=sessionSaveContext(target,slot).programId}={}){
 if(target!==universe||slot!==activeSaveSlot)return readSessionSaveStatus();
 sessionSaveRecord={state,message,universe:target,slot,version,stamp,programId};return emitSessionSaveStatus();
}
if(typeof window!=='undefined')window.DynastySessionStatus=Object.freeze({read:readSessionSaveStatus});
function sessionViewIdentity(){
 const context=sessionSaveContext(),archive=currentArchiveState()?.archiveRef?.id;
 // The storage archive identity prevents preferences leaking between two worlds
 // deliberately created with the same seed. Unsaved/legacy worlds restore nothing.
 return context.world&&archive&&context.programId!=null?JSON.stringify([context.slot,context.world,archive,String(context.programId)]):null;
}
function readSessionViewContext(){
 const key=sessionViewIdentity();if(!key)return null;
 try{
  const rows=JSON.parse(localStorage.getItem(SESSION_VIEW_KEY)||'[]');
  const row=Array.isArray(rows)?rows.find(x=>x?.key===key):null;if(!row)return null;
  const selects={};for(const id of SESSION_VIEW_SELECTS)if(typeof row.selects?.[id]==='string'&&row.selects[id].length<=80)selects[id]=row.selects[id];
  let recruitFilters=null;
  if(row.recruitFilters&&typeof row.recruitFilters==='object'){
   const filters=row.recruitFilters;
   recruitFilters={pos:POS.includes(filters.pos)?filters.pos:'ALL',stage:['PRELIMINARY','QUICK_FILM','FULL_EVALUATION'].includes(filters.stage)?filters.stage:'ALL',verdict:['Priority take','Take','Strong target','Boardable','Developmental','Pass'].includes(filters.verdict)?filters.verdict:'ALL',state:typeof filters.state==='string'&&/^[A-Z]{2}$/.test(filters.state)?filters.state:'ALL',query:typeof filters.query==='string'?filters.query.slice(0,40):'',targetedOnly:filters.targetedOnly===true};
  }
  const workspace=row.recruitingWorkspace;
  const recruitingWorkspace=workspace&&typeof workspace==='object'?{mode:workspace.mode==='table'?'table':'workspace',filter:['board','all','commits'].includes(workspace.filter)?workspace.filter:'board',selectedId:typeof workspace.selectedId==='string'?workspace.selectedId.slice(0,100):'',shown:Number.isInteger(workspace.shown)?Math.max(1,Math.min(220,workspace.shown)):30}:null;
  return {key,tab:TAB_GROUPS.some(group=>group.tabs.includes(row.tab))?row.tab:'dashboard',recruitingWorkspace,dashboardView:['week','stories','league'].includes(row.dashboardView)?row.dashboardView:'week',recruitingView:['current','rising','outlook','map','shortlist','summary','history'].includes(row.recruitingView)?row.recruitingView:'current',selects,recruitFilters};
 }catch{return null}
}
function rememberSessionViewContext(){
 if(sessionViewRestoring)return false;const key=sessionViewIdentity();if(!key)return false;
 const selects={};for(const id of SESSION_VIEW_SELECTS){const value=$('#'+id)?.value;if(typeof value==='string'&&value.length<=80)selects[id]=value}
 const row={key,tab:activeTab,dashboardView:window.DynastyDashboardViews?.current?.()||'week',recruitingView:window.DynastyRecruitingClasses?.current?.()||'current',selects,recruitFilters:window.DynastyLabRecruitingFilters?.getState?.()||null,recruitingWorkspace:window.DynastyRecruitingWorkspaceView?.read?.()||null};
 const search=$('#rwSearch');if(row.tab==='recruiting'&&row.recruitingWorkspace?.mode==='workspace'&&search?.tagName==='INPUT')row.recruitFilters={...(row.recruitFilters||{}),query:String(search.value||'').slice(0,40)};
 try{const prior=JSON.parse(localStorage.getItem(SESSION_VIEW_KEY)||'[]'),rows=Array.isArray(prior)?prior:[];localStorage.setItem(SESSION_VIEW_KEY,JSON.stringify([...rows.filter(x=>x?.key!==key).slice(-11),row]));return true}catch{return false}
}
function restoreSessionViewContext(){
 if(sessionViewRestoring)return false;
 const record=readSessionViewContext();if(!record)return false;
 sessionViewRestoring=true;
 try{
  window.DynastyDashboardViews?.show?.(record.dashboardView);
  window.DynastyRecruitingClasses?.show?.(record.recruitingView);
  if(record.recruitFilters)window.DynastyLabRecruitingFilters?.setState?.(record.recruitFilters);
  // Rendering the destination first supplies dynamic week/season options. Setting
  // allowlisted controls directly never dispatches their gameplay event handlers.
  goToTab(record.tab);let changed=false;
  for(const [id,value] of Object.entries(record.selects)){
   const control=$('#'+id);if(control&&Array.from(control.options||[]).some(option=>option.value===value)&&control.value!==value){control.value=value;changed=true}
  }
  if(changed)renderActiveTab();
  if(record.recruitingWorkspace)window.DynastyRecruitingWorkspaceView?.restore?.(record.recruitingWorkspace);return true;
 }finally{sessionViewRestoring=false}
}
function currentArchiveState(){const state=browserArchives.get(activeSaveSlot);return state?.universe===universe?state:null}
function activeSlotMeta(){return titleSaveSlots.find(s=>s.slot===activeSaveSlot)||null}
function slotStorageError(meta=activeSlotMeta()){return meta?.storageError||meta?.migrationError||''}
function loadableSlotMeta(){const meta=activeSlotMeta();return !meta?.empty&&!slotStorageError(meta)?meta:null}
function setActiveSaveSlot(slot){
 if(!SAVE_SLOT_IDS.includes(slot))throw new Error('Unknown save slot.');
 cancelQueuedAutosave();activeSaveSlot=slot;browserStore=DynastyStorage.create({slot});sessionViewRestoredFor=null;emitSessionSaveStatus();
 if($('#saveSlot'))$('#saveSlot').value=slot;if($('#titleSaveSlot'))$('#titleSaveSlot').value=slot;
 titleBrowserSave=loadableSlotMeta();
 renderTitleState();return slot;
}
function archiveIsDeferred(){const s=currentArchiveState();return !!s&&!s.loaded}
