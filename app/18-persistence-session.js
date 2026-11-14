// app/18-persistence-session.js: Autosave, browser saves, export/import and session state. Part of app.js; see tools/app-source.js.
// Autosave fires only after a completed atomic action, never mid-transaction. The debounce
// coalesces a burst (simming a season fires one per week) into a single write.
const AUTOSAVE_DEBOUNCE_MS=900;
const AUTOSAVE_KINDS=['week','postseason','signing','portal','camp','preseason','guidance','management','game'];
let autosaveTimer=null,autosaveKind=null,autosaveEnabled=true,autosaveInFlight=null,autosaveContext=null;
function cancelQueuedAutosave(){
 if(typeof clearTimeout==='function')clearTimeout(autosaveTimer);
 const queued=!!autosaveKind;autosaveTimer=null;autosaveKind=null;autosaveContext=null;
 if(queued&&sessionSaveRecord?.state==='pending')setSessionSaveStatus('unsaved','Checkpoint has not been saved. Use Save.');
}
// Manual storage actions supersede the debounce, then wait for a real in-flight
// write. Cancelling a queued checkpoint can never create a Saved indication.
async function yieldToUserAction(){cancelQueuedAutosave();if(autosaveInFlight)await autosaveInFlight.catch(()=>{})}
function autosaveBlocked(){
 if(!universe)return 'no dynasty';
 if(!autosaveEnabled)return 'autosave is off';
 if(activeSlotMeta()&&!activeSlotMeta().empty&&!currentArchiveState())return 'the selected slot belongs to another dynasty';
 if(hasPendingCareerChoice())return 'a career decision is open';
 if(typeof document!=='undefined'&&document.querySelectorAll?.('dialog[open]')?.length)return 'a dialog is open';
 return null;
}
function autosaveAfter(kind){
 if(!AUTOSAVE_KINDS.includes(kind))throw new Error(`Unknown autosave checkpoint "${kind}".`);
 sessionCheckpointVersion++;
 if(!universe||!autosaveEnabled){cancelQueuedAutosave();setSessionSaveStatus('unsaved',autosaveEnabled?'No dynasty open.':'Autosave is off. Use Save to preserve your progress.');return}
 autosaveKind=kind;autosaveContext={target:universe,slot:activeSaveSlot};
 setSessionSaveStatus('pending','Checkpoint waiting to save…');
 if(typeof setTimeout!=='function')return;
 clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>runAutosave(),AUTOSAVE_DEBOUNCE_MS);
}
async function runAutosave(){
 const kind=autosaveKind,context=autosaveContext;if(!kind)return false;
 if(context?.target!==universe||context?.slot!==activeSaveSlot){cancelQueuedAutosave();return false}
 const blocked=autosaveBlocked();
 if(blocked==='a dialog is open'){
  clearTimeout(autosaveTimer);autosaveTimer=null;
  setSessionSaveStatus('pending','Changes waiting to save after you close the open dialog.');return false;
 }
 if(blocked){cancelQueuedAutosave();setSessionSaveStatus('unsaved',`Checkpoint not saved: ${blocked}. Use Save when ready.`);return false}
 if(storageBusy){clearTimeout(autosaveTimer);autosaveTimer=setTimeout(()=>runAutosave(),AUTOSAVE_DEBOUNCE_MS);return false}
 clearTimeout(autosaveTimer);autosaveTimer=null;autosaveKind=null;autosaveContext=null;storageBusy=true;
 let settle;autosaveInFlight=new Promise(r=>{settle=r});
 try{
  const year=universe.year,week=universe.week;await writeBrowserSave(kind);
  if(universe===context.target&&activeSaveSlot===context.slot)universe.lastCheckpoint={kind,year,week,at:new Date().toISOString()};
  return true;
 }catch{return false}
 finally{storageBusy=false;autosaveInFlight=null;settle()}
}
// Inline and extension controls share a bounded management checkpoint hook.
// Capture the control before render removes it, then queue after its handler runs.
// Pure navigation, sorting, filters, profile opening, and live-game controls are absent.
const SESSION_MANAGEMENT_CLICK=[
 '#autoTarget','#autoDepth','#applyCampWinners','#applyPositionChange','#applyProgramEdit','#portalOpen','#portalAdvance','#portalFinalize',
 '[data-decision]','[data-target]','[data-visit]','[data-pull]','[data-redshirt]','[data-nil-player]','[data-nil-recruit]','[data-scout-action]',
 '[data-feature-development]','[data-recruit-focus]','[data-shortlist-target]','[data-rising-watch]','[data-interview]','[data-send-offer]','[data-post]',
 '[data-portal-nil]','[data-portal-nil-off]','[data-v0102-prep-focus]','[data-v0102-prep-delegate]','[data-v0102-prep-clear]','[data-v0102-staff-plan]'
].join(',');
const SESSION_MANAGEMENT_CHANGE=['#teamTrainingFocus','[data-role]','[data-training]','[data-promise]','[data-portal-attention]','[data-portal-promise]'].join(',');
function sessionManagementEvent(event){
 const selector=event.type==='click'?SESSION_MANAGEMENT_CLICK:event.type==='change'?SESSION_MANAGEMENT_CHANGE:null;
 const control=selector&&event.target?.closest?.(selector);if(!control||control.disabled||!universe)return false;
 const target=universe,slot=activeSaveSlot,version=sessionCheckpointVersion;
 const completed=()=>{if(universe===target&&activeSaveSlot===slot&&version===sessionCheckpointVersion)autosaveAfter('management')};
 if(typeof queueMicrotask==='function')queueMicrotask(completed);else setTimeout(completed,0);
 return true;
}
function resumeAutosaveAfterDialog(){
 if(!autosaveKind||autosaveContext?.target!==universe||autosaveContext?.slot!==activeSaveSlot||autosaveBlocked())return false;
 return runAutosave();
}
if(typeof document!=='undefined'){
 document.addEventListener('click',sessionManagementEvent,true);document.addEventListener('change',sessionManagementEvent,true);
 document.addEventListener('close',event=>{if(event.target?.tagName==='DIALOG')resumeAutosaveAfterDialog()},true);
}
function loadBrowser(){return storageOperation(async()=>{
  const d=await browserStore.load();
  if(!d){setStatus(`No ${savedDynastyLabel()} found ${storageLocation()}.`);return false}
  // Careers are chunked from storage 2 on; box scores only from 3. Anything
  // older carried both inline and is already fully resident.
  installSave(d,{revision:DynastyStorage.revisionOf(d),archiveRef:d.archiveRef||null,loaded:!(d.storageVersion>=2),
    gameRef:d.gameRef||null,gamesLoaded:d.storageVersion!==3});
  titleBrowserSave=activeSlotMeta()||d;
  setStatus(`Loaded ${activeSlotMeta()?.label||savedDynastyLabel()} from ${d.savedAt||'an earlier session'} ${storageLocation()}.`);
  return true;
})}
// A long dynasty's portable save is hundreds of megabytes as one JSON string. It is written in pieces (no single giant
// string) and gzipped where the platform can, which is about a ninth of the size. The content is the same portable JSON.
function saveJsonParts(payload){
 const parts=[],key=k=>JSON.stringify(k)+':',big=v=>Array.isArray(v)&&v.length>20;
 // Items are gathered into pieces of about a quarter of a megabyte, whatever their own size (a team is 200 KB, a game 2 KB).
 const writeArray=list=>{parts.push('[');let piece='';for(let i=0;i<list.length;i++){piece+=(i?',':'')+(JSON.stringify(list[i]===undefined?null:list[i])??'null');if(piece.length>262144){parts.push(piece);piece=''}}if(piece)parts.push(piece);parts.push(']')};
 const writeObject=(obj,deep)=>{parts.push('{');let first=true;for(const [k,v] of Object.entries(obj)){if(v===undefined||typeof v==='function')continue;parts.push((first?'':',')+key(k));first=false;if(big(v))writeArray(v);else if(deep&&v&&typeof v==='object'&&!Array.isArray(v)&&k==='universe')writeObject(v,false);else parts.push(JSON.stringify(v))}parts.push('}')};
 writeObject(payload,true);return parts;
}
async function gzipBlob(blob){
 if(typeof CompressionStream!=='function'||typeof Response!=='function'||typeof blob?.stream!=='function')return null;
 try{return await new Response(blob.stream().pipeThrough(new CompressionStream('gzip'))).blob()}catch{return null}
}
async function saveFileText(file){
 let head=null;try{if(typeof file?.slice==='function'&&typeof file.slice(0,2).arrayBuffer==='function')head=new Uint8Array(await file.slice(0,2).arrayBuffer())}catch{}
 if(head&&head[0]===0x1f&&head[1]===0x8b){
  if(typeof DecompressionStream!=='function')throw new Error('This browser cannot open a compressed save. Unzip the .gz file and import the .json inside.');
  try{return await new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text()}catch{throw new Error('The compressed save file is damaged or incomplete.')}
 }
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the save file.'));r.onabort=()=>reject(new Error('Import cancelled.'));r.readAsText(file)});
}
function exportSave(){return storageOperation(async()=>{
  await ensureArchiveLoaded();await ensureGamesLoaded();
  const plain=new Blob(saveJsonParts({version:APP_VERSION,userTeam:$('#userTeam').value,universe:packUniverse(universe)}),{type:'application/json'}),zipped=await gzipBlob(plain),blob=zipped?new Blob([zipped],{type:'application/gzip'}):plain,a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`dynasty-lab-${universe.year}-week-${universe.week+1}.json${zipped?'.gz':''}`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);const size=Number.isFinite(blob.size)?` (${slotBytes(blob.size)})`:'';setStatus(zipped?`Save exported as a compressed backup${size}. Import it here as it is.`:`Save exported as JSON${size}.`);
})}
function importSave(file){return storageOperation(async()=>{
  const text=await saveFileText(file);
  let d;try{d=JSON.parse(text)}catch{throw new Error('That file is not a Dynasty Lab save.')}
  if(d.storageVersion||d.archiveRef)throw new Error('Import a complete exported JSON save, not an app storage record.');
  validateImportedSaveText(d?.universe||d);
  installSave(d);setStatus('Imported save file successfully.');
  return true;
})}
function refreshTeamOptions(sel){$('#userTeam').innerHTML='';universe.teams.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(s=>{let o=document.createElement('option');o.value=s.name;o.textContent=s.name;$('#userTeam').appendChild(o)});$('#userTeam').value=T(sel)?sel:universe.teams[0].name;renderControlMode()}
function titlePreferences(){
 let prefs={motion:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,watchSpeed:'850'};
 try{prefs={...prefs,...JSON.parse(localStorage.getItem('dynastyLabPreferences')||'{}')}}catch{}
 if(!['1400','850','400'].includes(String(prefs.watchSpeed)))prefs.watchSpeed='850';
 prefs.motion=prefs.motion!==false;return prefs;
}
function applyTitlePreferences(){const p=titlePreferences();document.body.classList.toggle('motion-reduced',!p.motion);$('#titleMotion').checked=p.motion;$('#titleWatchSpeed').value=String(p.watchSpeed)}
function saveTitlePreferences(){const p={motion:$('#titleMotion').checked,watchSpeed:$('#titleWatchSpeed').value};try{localStorage.setItem('dynastyLabPreferences',JSON.stringify(p))}catch{setTitleStatus('Options could not be saved. Check this device\'s storage settings.');return}applyTitlePreferences();setTitleStatus('Options saved on this device.');showTitlePanel()}
function setTitleStatus(x){if($('#titleStatus'))$('#titleStatus').textContent=x}
function slotBytes(n){if(!Number.isFinite(n)||n<=0)return'';const mb=n/1048576;return mb>=10?`${mb.toFixed(0)} MB`:`${mb.toFixed(1)} MB`}
function titleCalendarStage(phase,week){if(phase==='preseason')return'Preseason';if(phase==='regular')return `Week ${(Number(week)||0)+1}`;if(phase==='complete')return'Season complete';return'Postseason'}
function titleSummary(d){
 if(d?.program){const stage=titleCalendarStage(d.phase,d.week);return `${d.program} · ${d.year} · ${stage}${d.record?` · ${d.record}`:''}${d.approximateBytes?` · ${slotBytes(d.approximateBytes)}`:''}`}
 const u=d?.universe;if(!u||!Array.isArray(u.teams))return'';const name=d.userTeam||u.teams[0]?.name||'Unknown program',t=u.teams.find(x=>x.name===name),stage=titleCalendarStage(u.phase,u.week);return `${name} · ${u.year} · ${stage}${t?` · ${t.w}-${t.l}`:''}`;
}
function renderSaveSlotControls(){
 for(const id of ['saveSlot','titleSaveSlot']){
  const el=$('#'+id);if(!el)continue;el.innerHTML='';
  for(const slot of titleSaveSlots){const o=document.createElement('option');o.value=slot.slot;o.textContent=`${slot.label}${slotStorageError(slot)?' · Recovery needed':slot.empty?' · Empty':slot.program?` · ${slot.program}`:''}`;el.appendChild(o)}
  el.value=activeSaveSlot;
 }
 const meta=activeSlotMeta();if($('#titleSlotName'))$('#titleSlotName').value=meta?.label||'';
}
function renderTitleState(){
 const current=universe?{universe,userTeam:$('#userTeam').value}:null,continuation=current||titleBrowserSave,summary=titleSummary(continuation),has=!!summary;
 $('#titleContinue').disabled=!has;$('#titleContinueMeta').textContent=has?summary:`No saved dynasty found ${storageLocation()}`;
 const slot=activeSlotMeta();$('#titleLoadBrowser').disabled=!titleBrowserSave;$('#titleLoadMeta').textContent=slotStorageError(slot)?'Recovery needs attention':titleBrowserSave?titleSummary(titleBrowserSave):'This slot is empty';
 $('#titleContinue').classList.toggle('title-action--primary',has);$('#titleNew').classList.toggle('title-action--primary',!has);
}
function showTitlePanel(id=null){
 $('#titleMainMenu').hidden=!!id;for(const panel of $$('.title-subpanel'))panel.hidden=panel.id!==id;
 const target=id?$('#'+id)?.querySelector('button,select,input'):($('#titleContinue').disabled?$('#titleNew'):$('#titleContinue'));target?.focus();
}
function showTitleScreen(){
 $('#app').hidden=true;$('#dynastySetup')&&($('#dynastySetup').hidden=true);$('#titleScreen').hidden=false;document.body.classList.remove('dynasty-open','setup-open');renderTitleState();showTitlePanel();setTitleStatus(universe?'Current session is ready to resume.':slotStorageError()||(titleBrowserSave?`${storageKind()==='desktop'?'Desktop save':'Browser save'} ready ${storageLocation()}.`:'Choose New Dynasty or load a save.'));window.scrollTo?.(0,0);
}
function enterDynasty(){if(!universe)return;$('#titleScreen').hidden=true;$('#dynastySetup')&&($('#dynastySetup').hidden=true);$('#app').hidden=false;document.body.classList.remove('setup-open');document.body.classList.add('dynasty-open');render();window.scrollTo?.(0,0);$('#app .topbar')?.focus?.()}
function populateTitleTeams(){
 $('#titleTeam').innerHTML='';schools.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(s=>{const o=document.createElement('option');o.value=s.name;o.textContent=`${s.name} · ${s.conference}`;$('#titleTeam').appendChild(o)});$('#titleTeam').value='Chicago Metropolitan';
}
async function refreshTitleSave(){
 try{titleSaveSlots=await browserStore.listSlots();titleBrowserSave=loadableSlotMeta();renderSaveSlotControls();renderTitleState();setTitleStatus(slotStorageError()||(titleBrowserSave?`${storageKind()==='desktop'?'Desktop save':'Browser save'} ready ${storageLocation()}.`:'This slot is empty. Start a new dynasty when you are ready.'))}
 catch(e){titleBrowserSave=null;renderTitleState();setTitleStatus(e.message||`The ${savedDynastyLabel()} could not be read. You can still import a backup.`)}
}
async function chooseSaveSlot(slot){setActiveSaveSlot(slot);await refreshTitleSave()}
async function renameSaveSlot(){
 try{await browserStore.rename($('#titleSlotName').value);await refreshTitleSave();setTitleStatus('Save slot renamed.')}
 catch(e){setTitleStatus(e.message||'The save slot could not be renamed.')}
}
function startTitleDynasty(){
 if(universe&&!confirm('Start a new dynasty? Save the current session first if you want to keep it.'))return;
 const empty=titleSaveSlots.find(s=>s.empty);if(empty)setActiveSaveSlot(empty.slot);
 const program=$('#titleTeam').value||'Chicago Metropolitan',mode=$('#titleMode').value||'dynasty';createNewDynasty(mode);refreshTeamOptions(program);enterDynasty();setStatus(`New ${program} ${mode==='commissioner'?'commissioner universe':'dynasty'} ready for preseason setup in ${activeSlotMeta()?.label||'the selected slot'}. Save to preserve it.`);
}
async function continueTitleDynasty(){if(universe){enterDynasty();return}setTitleStatus(`Loading ${savedDynastyLabel()}…`);const ok=await loadBrowser();if(ok)enterDynasty();else setTitleStatus($('#saveStatus').textContent)}
async function loadTitleDynasty(){if(universe&&!confirm('Load the saved dynasty? Unsaved changes in the current session will be replaced.'))return;setTitleStatus(`Loading ${savedDynastyLabel()}…`);const ok=await loadBrowser();if(ok)enterDynasty();else setTitleStatus($('#saveStatus').textContent)}
function bind(){
 document.addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(b){e.preventDefault();showGameCenter(b.dataset.game,b.dataset.gameTab||'Summary')}});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-archetype]');if(b){e.preventDefault();showArchetypeGuide(b.dataset.archetype)}});
 $$('#gameTabs button').forEach(b=>b.onclick=()=>showGameCenter(openedGameId,b.dataset.gameTab));
 $('#gameHistoryYear').onchange=renderGameArchive;

 $$('.tab-groups button').forEach(b=>b.onclick=()=>showTabGroup(b.dataset.group));
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.remove('active'));$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active');setActiveTab(b.dataset.tab)});
 $('#simWeek').onclick=simWeek;$('#hubAdvance').onclick=()=>openingPreseason()?beginSeason():simWeek();$('#hubAdvance').__beginSeason=beginSeason;$('#seasonWeek').onclick=simWeek;$('#simSeason').onclick=simSeason;$('#simConf').onclick=simConferenceChampionships;$('#simBowls').onclick=simBowls;$('#simPlayoff').onclick=simPlayoff;$('#simDetailedGame').onclick=simulateUserDetailed;$('#autoTarget').onclick=autoTarget;$('#autoDepth').onclick=()=>{autoDepthTeam(selected(),true);render()};$('#archiveSearch').oninput=renderArchiveSearch;$('#runOffseason').onclick=runOffseason;$('#portalOpen').onclick=()=>{openPortalCycle();renderPortal()};$('#portalAdvance').onclick=()=>{advancePortalRound();renderPortal()};$('#portalFinalize').onclick=()=>{const r=resolvePortalCommitments();setStatus(`${r.placed.length} transfer${r.placed.length===1?'':'s'} finalized${r.blocked.length?`, ${r.blocked.length} could not be placed`:''}.`);render()};$('#runSpringCamp').onclick=runSpringCamp;$('#runFallCamp').onclick=runFallCamp;$('#applyCampWinners').onclick=applyCampRecommendations;$('#teamTrainingFocus').onchange=e=>{const t=selected();t.trainingFocus=e.target.value;t.trainingFocusSeason=universe.year;renderDevelopment()};$('#positionChangePlayer').onchange=renderPositionChangeOptions;$('#positionChangeTarget').onchange=renderPositionChangeOptions;$('#applyPositionChange').onclick=applyPositionChange;$('#newsWeek').onchange=renderNewsletter;$('#newsScope').onchange=renderNewsletter;$('#statsScope').onchange=renderStats;$('#positionFilter').onchange=renderRoster;$('#userTeam').onchange=()=>{candidateOfferDraft=null;render()};$('#applyProgramEdit').onclick=applyProgramEdit;
 $('#watchDetailedGame').onclick=watchUserDetailed;
 $('#applyProgramEdit').onclick=()=>commissionerMode()?applyProgramEdit():setStatus('Institutional editing is locked in Dynasty Mode.');
 $('#saveBrowser').onclick=saveBrowser;$('#loadBrowser').onclick=loadBrowser;$('#exportSave').onclick=exportSave;$('#importSave').onclick=()=>$('#importFile').click();$('#importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;const fromTitle=!$('#titleScreen').hidden,ok=await importSave(file);e.target.value='';if(ok&&fromTitle)enterDynasty();else if(!ok&&fromTitle)setTitleStatus($('#saveStatus').textContent)};
 $('#saveSlot').onchange=e=>{chooseSaveSlot(e.target.value);setStatus(`Active save slot: ${activeSlotMeta()?.label||e.target.value}.`)};
 $('#newUniverse').onclick=showTitleScreen;
 $('#titleContinue').onclick=continueTitleDynasty;$('#titleNew').onclick=openNewDynastySetup;$('#titleLoad').onclick=()=>showTitlePanel('titleLoadPanel');$('#titleOptions').onclick=()=>showTitlePanel('titleOptionsPanel');$('#titleHowTo').onclick=()=>showTitlePanel('titleHowPanel');
 $('#titleStart').onclick=startTitleDynasty;$('#titleLoadBrowser').onclick=loadTitleDynasty;$('#titleSaveSlot').onchange=e=>chooseSaveSlot(e.target.value);$('#titleRenameSlot').onclick=renameSaveSlot;$('#titleImport').onclick=()=>$('#importFile').click();$('#titleSaveOptions').onclick=saveTitlePreferences;$$('[data-title-back]').forEach(b=>b.onclick=()=>showTitlePanel());
}
