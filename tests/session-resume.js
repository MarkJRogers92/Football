// Real save orchestration with disposable storage. No user's saves or live-game state.
const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {IDBFactory}=require('fake-indexeddb');
const storage=require('../storage.js');
const {loadEngine}=require('../tools/harness');

// These tests drive persistence explicitly while real IndexedDB tasks run on
// setImmediate. Freeze only the debounce clock so CPU/IO delays cannot let an
// automatic checkpoint race a manually requested runAutosave between assertions.
// Each test context automatically restores the clock and discards queued timers.
beforeEach(t=>t.mock.timers.enable({apis:['setTimeout']}));

async function fixture(seed=8310,{fullRuntime=false}={}){
 const indexedDB=new IDBFactory(),control={hold:null,error:null},events=[],values=new Map();
 const create=storage.create,read=fs.readFileSync;
 delete global.DynastySessionStatus;
 storage.create=options=>{
  const store=create(options),save=store.save;
  store.save=async(...args)=>{if(control.hold)await control.hold;if(control.error)throw new Error(control.error);return save(...args)};
  return store;
 };
 // Extend only this test's harness hook; production gets no mutable session API.
 fs.readFileSync=function(file,...args){
  const source=read.call(this,file,...args);
  if(!String(file).endsWith('/app.js'))return source;
  const at=source.lastIndexOf('loadSchools().then(');
  return source.slice(0,at)+`globalThis.__SESSION_PRIVATE__={
   selectSlot:setActiveSaveSlot,setAutosave(value){autosaveEnabled=value},autoTarget,renderDepth,
   managementEvent:typeof sessionManagementEvent==='function'?sessionManagementEvent:null,
   dialogClosed:typeof resumeAutosaveAfterDialog==='function'?resumeAutosaveAfterDialog:null,
   capture:typeof rememberSessionViewContext==='function'?rememberSessionViewContext:null,
   readView:typeof readSessionViewContext==='function'?readSessionViewContext:null,
   restore:typeof restoreSessionViewContext==='function'?restoreSessionViewContext:null,
   setTab(id){activeTab=id},setNavigator(fn){goToTab=fn;renderActiveTab=()=>{}}
  };\n`+source.slice(at);
 };
 let e;
 try{e=loadEngine({seed,indexedDB,fullRuntime})}finally{storage.create=create;fs.readFileSync=read}
 global.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
 global.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init.detail}};
 global.dispatchEvent=event=>{events.push(event);return true};
 await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 for(const selector of ['#titleContinue','#titleNew'])document.querySelector(selector).classList.toggle=()=>{};
 const api=global.DynastySessionStatus,privateApi=global.__SESSION_PRIVATE__;
 return {e,indexedDB,store:create({indexedDB}),control,events,values,api,privateApi,
  hold(){let release;control.hold=new Promise(resolve=>{release=resolve});return()=>{control.hold=null;release()}}};
}
const assertApi=f=>{assert.equal(typeof f.api?.read,'function','read-only save status is available');return f.api};

test('save status stays pending or saving until a real write completes, then emits context',async()=>{
 const f=await fixture(),{e,store}=f,api=assertApi(f);
 assert.equal(api.read().state,'unsaved');
 e.autosaveAfter('week');assert.equal(api.read().state,'pending');
 assert.equal(await store.load(),undefined,'a queued debounce is not a saved dynasty');
 const release=f.hold(),saving=e.runAutosave();
 assert.equal(api.read().state,'saving');assert.equal(await store.load(),undefined);
 release();assert.equal(await saving,true);
 const status=api.read(),saved=await store.load();
 assert.equal(status.state,'saved');assert.equal(status.year,saved.universe.year);assert.equal(status.week,saved.universe.week);
 assert.equal(status.slot,'main');assert.equal(status.programId,e.T('Chicago Metropolitan').id);
 assert.equal(status.world,String(e.universe.rng.seed));
 assert.ok(f.events.some(event=>event.type==='dynasty:save-status'&&event.detail.state==='saved'));
 const copy=api.read();copy.state='failed';assert.equal(api.read().state,'saved','consumers cannot change the tracker');
 await e.yieldToUserAction();
});

test('failed writes remain failed, preserve the news channel, and a real retry recovers',async()=>{
 const f=await fixture(8311),{e,store,control}=f,api=assertApi(f);
 await e.saveBrowser();const revision=(await store.load()).revision;
 e.$el('#saveStatus').textContent='A recruiting headline';
 control.error='Disk full';e.autosaveAfter('week');assert.equal(await e.runAutosave(),false);
 assert.equal(api.read().state,'failed');assert.match(api.read().message,/Disk full|Save|retry/i);
 assert.equal(e.$el('#saveStatus').textContent,'A recruiting headline','quiet checkpoint reporting has its own channel');
 assert.equal((await store.load()).revision,revision);
 control.error=null;await e.saveBrowser();assert.equal(api.read().state,'saved');
 await e.yieldToUserAction();
});

test('disabled autosave and a cancelled queued checkpoint cannot claim saved progress',async()=>{
 const f=await fixture(8312),{e,store,privateApi}=f,api=assertApi(f);
 e.autosaveAfter('week');await e.yieldToUserAction();assert.equal(api.read().state,'unsaved');
 privateApi.setAutosave(false);e.autosaveAfter('week');assert.equal(api.read().state,'unsaved');
 assert.match(api.read().message,/off|disabled/i);assert.equal(await e.runAutosave(),false);
 assert.equal(await store.load(),undefined);
 await e.saveBrowser();assert.equal(api.read().state,'saved');assert.match(api.read().message,/off|disabled/i);
});

test('new progress queued during a write remains pending after the older write completes',async()=>{
 const f=await fixture(8313),{e,store}=f,api=assertApi(f);
 await e.saveBrowser();const release=f.hold();e.autosaveAfter('week');const saving=e.runAutosave();
 e.universe.week++;e.autosaveAfter('week');release();await saving;
 assert.equal(api.read().state,'pending');assert.equal((await store.load()).universe.week,0);
 assert.equal(await e.runAutosave(),true);assert.equal(api.read().state,'saved');
 assert.equal((await store.load()).universe.week,1);await e.yieldToUserAction();
});

test('slot switches and world replacement cannot inherit an earlier save completion',async()=>{
 const f=await fixture(8314),{e,privateApi}=f,api=assertApi(f);
 await e.saveBrowser();privateApi.selectSlot('dynasty-2');assert.equal(api.read().state,'unsaved');assert.equal(api.read().slot,'dynasty-2');
 const release=f.hold();e.autosaveAfter('week');const saving=e.runAutosave();
 const old=e.universe;e.initUniverse('dynasty',{seed:9393});release();await saving;
 assert.notEqual(e.universe,old);assert.equal(api.read().state,'unsaved');assert.equal(api.read().world,String(e.universe.rng.seed));
 assert.equal(e.archiveIsDeferred(),false,'old completion cannot attach old archives to the new world');
 await e.saveBrowser();assert.equal(api.read().state,'saved');await e.yieldToUserAction();
});

test('loads report the persisted checkpoint while portable installation remains unsaved',async()=>{
 const f=await fixture(8315),{e}=f,api=assertApi(f);
 await e.saveBrowser();e.universe.week++;e.autosaveAfter('week');await e.loadBrowser();
 assert.equal(api.read().state,'saved');assert.equal(api.read().week,0);
 await e.ensureArchiveLoaded();await e.ensureGamesLoaded();
 e.installSave({userTeam:'Chicago Metropolitan',universe:structuredClone(e.packUniverse(e.universe))});
 assert.equal(api.read().state,'unsaved','importing a portable file is not a local write');
});

test('welcome back includes a factual last result, priority and pending choice without mutating simulation',async()=>{
 const f=await fixture(8316),{e}=f,t=e.T('Chicago Metropolitan');
 e.simWeek();await e.yieldToUserAction();
 const starter=e.importantStarters(t)[0];Object.assign(starter,{health:70,wear:76,injuryWeeks:0,redshirtActive:false});e.ensureWeeklyDecisions(t);
 const before=JSON.stringify(e.universe),savedAt=new Date(Date.now()-8*60*60*1000).toISOString();
 const summary=e.guidanceWelcomeBack(savedAt,t);
 assert.ok(summary.lastResult,'the last completed game is included');
 assert.equal(summary.lastResult.programId,t.id);assert.equal(summary.lastResult.year,e.universe.year);
 assert.ok(Number.isFinite(summary.lastResult.userPts));assert.ok(Number.isFinite(summary.lastResult.oppPts));
 assert.ok(summary.priority?.title);assert.ok(summary.pendingChoice?.title);
 assert.equal(JSON.stringify(e.universe),before,'returning never resolves choices, advances time, or draws RNG');
 e.installSave({userTeam:t.name,universe:e.packUniverse(e.universe),savedAt});
 const other=e.universe.teams.find(team=>team.id!==t.id);e.setUserTeam(other.name);
 assert.equal(e.guidanceReturnSummary(),null,'a return card belongs to the loaded program');
});

test('view preferences are local, scoped to world/slot/program, and restore only safe view state',async()=>{
 const f=await fixture(8317),{e,privateApi,values}=f;
 assert.equal(typeof privateApi.capture,'function');assert.equal(typeof privateApi.restore,'function');
 await e.saveBrowser();privateApi.setTab('roster');
 const roster=e.$el('#positionFilter');roster.options=[{value:'ALL'},{value:'QB'}];roster.value='QB';
 privateApi.capture();const record=privateApi.readView();assert.equal(record.tab,'roster');assert.equal(record.selects.positionFilter,'QB');
 assert.ok(values.size,'preferences are device state, outside the portable save');
 assert.equal(Object.hasOwn(e.packUniverse(e.universe),'sessionView'),false);
 const before=JSON.stringify(e.universe),opened=[];privateApi.setNavigator(id=>opened.push(id));roster.value='ALL';
 privateApi.restore();assert.deepEqual(opened,['roster']);assert.equal(roster.value,'QB');assert.equal(JSON.stringify(e.universe),before);
 const other=e.universe.teams.find(t=>t.name!=='Chicago Metropolitan');e.setUserTeam(other.name);assert.equal(privateApi.readView(),null);
 e.setUserTeam('Chicago Metropolitan');privateApi.selectSlot('dynasty-2');assert.equal(privateApi.readView(),null);
 privateApi.selectSlot('main');e.initUniverse('dynasty',{seed:9090});assert.equal(privateApi.readView(),null);
});

test('return result handles ties, bye weeks, wrong programs and future seasons without invented history',async()=>{
 const f=await fixture(8318),{e}=f,t=e.T('Chicago Metropolitan'),other=e.universe.teams.find(x=>x.id!==t.id);
 const savedAt=new Date(Date.now()-8*60*60*1000).toISOString();
 e.universe.week=2;t.schedule=[{week:1,played:true,home:t.name,away:other.name,score:[17,17],winner:null,gameId:'tie'}];
 let summary=e.guidanceWelcomeBack(savedAt,t);assert.equal(summary.lastResult?.outcome,'Tie');assert.equal(summary.lastResult?.gameId,'tie','last played result survives a bye');
 e.universe.phase='complete';e.universe.offseason=e.makeOffseasonState(e.universe.year,'review');t.schedule=[];
 const record=(id,season,homeId,week=13)=>({id,season,week,label:'Conference Championship',home:{id:homeId,name:t.name},away:{id:other.id,name:other.name},score:{home:20,away:17},teamStats:{home:{},away:{}},playerStats:{home:[],away:[]}});
 e.universe.gameArchive=[record('wrong-id',e.universe.year,other.id),record('future',e.universe.year+1,t.id),record('past',e.universe.year-1,t.id)];
 summary=e.guidanceWelcomeBack(savedAt,t);assert.equal(summary.lastResult,null,'names never override a conflicting permanent program identity');
 e.universe.gameArchive.push(record('close-loss',e.universe.year,t.id));e.universe.gameArchive.at(-1).score={home:16,away:17};
 summary=e.guidanceWelcomeBack(savedAt,t);assert.equal(summary.lastResult?.outcome,'Loss');assert.equal(summary.lastResult?.userPts,16);
 e.universe.phase='preseason';e.universe.week=0;assert.equal(e.guidanceWelcomeBack(savedAt,t).lastResult,null,'a new preseason does not repeat the prior season');
});

test('unavailable preference storage does not affect save completion or gameplay',async()=>{
 const f=await fixture(8319),{e,privateApi}=f,api=assertApi(f);
 global.localStorage={getItem(){throw new Error('blocked')},setItem(){throw new Error('blocked')}};
 const before=JSON.stringify(e.universe);assert.doesNotThrow(()=>privateApi.capture());assert.equal(privateApi.readView(),null);
 assert.equal(JSON.stringify(e.universe),before);await e.saveBrowser();assert.equal(api.read().state,'saved');
});


test('program switches cannot inherit a checkpoint saved under another controlled program',async()=>{
 const f=await fixture(8320),{e}=f,api=assertApi(f);await e.saveBrowser();
 const release=f.hold();e.autosaveAfter('week');const saving=e.runAutosave();
 const other=e.universe.teams.find(t=>t.name!=='Chicago Metropolitan');e.setUserTeam(other.name);
 assert.equal(api.read().state,'unsaved');release();await saving;
 assert.equal(api.read().state,'unsaved');assert.equal(api.read().programId,other.id);await e.yieldToUserAction();
});

test('malformed stored view preferences cannot invoke actions or restore unknown filter values',async()=>{
 const f=await fixture(8321),{e,privateApi,values}=f;await e.saveBrowser();privateApi.capture();
 const key=[...values.keys()][0],rows=JSON.parse(values.get(key));
 Object.assign(rows[0],{tab:'simWeek',dashboardView:'advance',recruitingView:'commit',selects:{positionFilter:'DELETE',userTeam:'Somewhere'},recruitFilters:{pos:'DELETE',stage:'bogus',verdict:'bogus',state:'anywhere',query:'x'.repeat(90),targetedOnly:'true',advance:true}});
 values.set(key,JSON.stringify(rows));const normalized=privateApi.readView();
 assert.equal(normalized.tab,'dashboard');assert.equal(normalized.dashboardView,'week');assert.equal(normalized.recruitingView,'current');
 assert.equal(Object.hasOwn(normalized.selects,'userTeam'),false);assert.equal(normalized.recruitFilters.pos,'ALL');assert.equal(normalized.recruitFilters.targetedOnly,false);assert.equal(normalized.recruitFilters.query.length,40);
 const opened=[];privateApi.setNavigator(id=>opened.push(id));const before=JSON.stringify(e.universe);privateApi.restore();
 assert.deepEqual(opened,['dashboard']);assert.equal(JSON.stringify(e.universe),before);
});

test('a completed deferred write retains careers and games appended while storage was busy',async()=>{
 const f=await fixture(8322),{e,store}=f,api=assertApi(f);
 e.simWeek();const game=structuredClone(e.universe.gameArchive[0]),player=structuredClone(e.T('Chicago Metropolitan').roster[0]);
 await e.saveBrowser();await e.loadBrowser();assert.equal(e.gamesAreDeferred(),true);assert.equal(e.archiveIsDeferred(),true);
 const before=await store.load(),firstGame={...game,id:'session-pending-a'},secondGame={...game,id:'session-pending-b'};
 e.universe.gameArchive.push(firstGame);e.universe.playerArchive.push({...player,id:'session-alumnus-a'});
 e.autosaveAfter('week');const release=f.hold(),saving=e.runAutosave();
 e.universe.gameArchive.push(secondGame);e.universe.playerArchive.push({...player,id:'session-alumnus-b'});e.autosaveAfter('week');
 release();await saving;
 assert.equal(api.read().state,'pending');assert.deepEqual(e.universe.gameArchive.map(g=>g.id),['session-pending-b']);
 assert.deepEqual(e.universe.playerArchive.map(p=>p.id),['session-alumnus-b']);
 assert.equal(await e.runAutosave(),true);const saved=await store.load();
 assert.equal(saved.gameRef.count,before.gameRef.count+2);assert.equal(saved.archiveRef.count,before.archiveRef.count+2);
 assert.equal((await store.readGames(saved.gameRef)).filter(g=>g.id.startsWith('session-pending-')).length,2);
 assert.equal((await store.readArchive(saved.archiveRef)).filter(p=>p.id.startsWith('session-alumnus-')).length,2);
 await e.yieldToUserAction();
});


test('auto-target changes invalidate saved status and survive an actual checkpoint/load at the same week',async()=>{
 const f=await fixture(8323),{e,privateApi,store}=f,api=assertApi(f);await e.saveBrowser();
 const before=await store.load();assert.equal(before.universe.recruits.filter(r=>r.targeted).length,0);
 privateApi.autoTarget();const ids=e.universe.recruits.filter(r=>r.targeted).map(r=>r.id);assert.equal(ids.length,20);
 assert.equal(api.read().state,'pending','a real recruiting action invalidates the old Saved indication');
 assert.equal(await e.runAutosave(),true);await e.loadBrowser();
 assert.equal(api.read().state,'saved');assert.equal(e.universe.week,before.universe.week);assert.deepEqual(e.universe.recruits.filter(r=>r.targeted).map(r=>r.id),ids);
});

test('ordinary weekly decisions invalidate saved status and persist the recorded choice at the same week',async()=>{
 const f=await fixture(8324),{e}=f,api=assertApi(f),t=e.T('Chicago Metropolitan');
 const starter=e.importantStarters(t)[0];Object.assign(starter,{health:70,wear:76,injuryWeeks:0,redshirtActive:false});
 const decision=e.ensureWeeklyDecisions(t).find(d=>d.type==='INJURED_STARTER');assert.ok(decision);await e.saveBrowser();
 const choice=decision.options[0].id;assert.equal(e.resolveWeeklyDecision(decision.id,choice),true);
 assert.equal(api.read().state,'pending','recording a choice must make the previous checkpoint obsolete');
 await e.runAutosave();await e.loadBrowser();const restored=e.universe.weeklyDecisions.find(d=>d.id===decision.id);
 assert.equal(restored.resolved,true);assert.equal(restored.resolvedOptionId,choice);assert.equal(e.universe.week,0);assert.equal(api.read().state,'saved');
});

test('profile management waits for dialog close, then persists; navigation never schedules gameplay saves',async()=>{
 const f=await fixture(8325),{e,privateApi,store}=f,api=assertApi(f);await e.saveBrowser();
 assert.equal(typeof privateApi.managementEvent,'function');assert.equal(typeof privateApi.dialogClosed,'function');
 const revision=(await store.load()).revision,query=document.querySelectorAll;let open=true;
 document.querySelectorAll=selector=>selector==='dialog[open]'&&open?[{tagName:'DIALOG'}]:query(selector);
 const target={disabled:false,closest:selector=>selector.includes('[data-training]')?target:null};
 privateApi.managementEvent({type:'change',target});e.T('Chicago Metropolitan').roster[0].trainingFocus='Technique';
 await new Promise(resolve=>queueMicrotask(resolve));assert.equal(api.read().state,'pending');
 assert.equal(await e.runAutosave(),false);assert.equal(api.read().state,'pending');assert.match(api.read().message,/close|dialog/i);
 assert.equal((await store.load()).revision,revision,'an open profile must not be checkpointed behind the dialog');
 open=false;await privateApi.dialogClosed();assert.equal(api.read().state,'saved');
 const saved=await store.load();assert.equal(saved.universe.teams.find(t=>t.name==='Chicago Metropolitan').roster[0].trainingFocus,'Technique');
 privateApi.managementEvent({type:'click',target:{disabled:false,closest:()=>null}});await new Promise(resolve=>queueMicrotask(resolve));
 assert.equal(api.read().state,'saved');assert.equal(await e.runAutosave(),false);assert.equal((await store.load()).revision,saved.revision);
 document.querySelectorAll=query;await e.yieldToUserAction();
});

test('welcome back appears after a short meaningful absence and stays dismissed',async()=>{
 const f=await fixture(8326),{e}=f,t=e.T('Chicago Metropolitan'),now=Date.now();
 assert.equal(e.guidanceWelcomeBack(new Date(now-8*60*1000).toISOString(),t,now),null);
 const savedAt=new Date(now-16*60*1000).toISOString();assert.ok(e.guidanceWelcomeBack(savedAt,t,now));
 e.installSave({userTeam:t.name,universe:e.packUniverse(e.universe),savedAt});assert.ok(e.guidanceReturnSummary());
 e.dismissGuidanceReturnSummary();for(let i=0;i<3;i++)assert.equal(e.guidanceReturnSummary(),null);
});


test('a completed detailed game queues and persists its official result without advancing the calendar',async()=>{
 const f=await fixture(8327,{fullRuntime:true}),{e,store}=f,api=assertApi(f);
 const ready=global.__DL_TEST__.v2PrepareDetailedGame();assert.equal(ready.ready,true);await e.saveBrowser();
 const before=await store.load();assert.equal(before.gameRef.count,0);e.simulateUserDetailed();
 assert.equal(e.universe.gameArchive.length,1);assert.equal(api.read().state,'pending');
 await e.runAutosave();const saved=await store.load();assert.equal(saved.gameRef.count,1);assert.equal(saved.universe.week,0);
 await e.loadBrowser();await e.ensureGamesLoaded();assert.equal(e.universe.gameArchive.length,1);assert.equal(e.universe.gameArchive[0].engine,'v2');
});

test('interactive preview and rollback stay unpersisted while a committed final queues a real checkpoint',async()=>{
 const f=await fixture(8328,{fullRuntime:true}),{e,store}=f,api=assertApi(f);
 const ready=global.__DL_TEST__.v2PrepareDetailedGame();assert.equal(ready.ready,true);await e.saveBrowser();
 const bridge=global.DynastyGameEngineV2LabBridge,gameDay=global.DynastyGameEngineV2GameDay;
 bridge.interactive.start();const session=bridge.interactive.getSession();assert.ok(session);gameDay.simulate(session,()=> 'delegate');
 assert.equal(session.state.status,'final');assert.equal(api.read().state,'saved','a staged final is not a committed game');
 assert.equal((await store.load()).gameRef.count,0);assert.equal(await e.runAutosave(),false);
 assert.throws(()=>bridge.recordInteractive(session,{testFault:'afterArchive'}),/Injected.*rollback fault/);
 assert.equal(api.read().state,'saved');assert.equal(await e.runAutosave(),false,'rollback never schedules an official save');
 const recorded=bridge.recordInteractive(session);assert.equal(recorded.ok,true);assert.equal(api.read().state,'pending');
 await e.runAutosave();const saved=await store.load();assert.equal(saved.gameRef.count,1);assert.equal(saved.universe.week,0);
 await e.loadBrowser();await e.ensureGamesLoaded();assert.equal(e.universe.gameArchive[0].gameDayVersion,gameDay.VERSION);
});


test('actual recruiting target and depth controls checkpoint their changes through the management hook',async()=>{
 const f=await fixture(8329),{e,privateApi}=f,api=assertApi(f);await e.saveBrowser();
 const query=document.querySelectorAll,r=e.universe.recruits.find(r=>!r.targeted&&!r.committed);
 const target={dataset:{target:r.id},disabled:false,closest:selector=>selector.includes('[data-target]')?target:null};
 document.querySelectorAll=selector=>selector==='[data-target]'?[target]:query(selector);
 e.renderRecruiting();assert.equal(typeof target.onclick,'function');privateApi.managementEvent({type:'click',target});target.onclick();
 await new Promise(resolve=>queueMicrotask(resolve));assert.equal(r.targeted,true);assert.equal(api.read().state,'pending');await e.runAutosave();
 const t=e.T('Chicago Metropolitan'),role=e.ROLE_DEFS.find(role=>(t.roleDepth?.[role.id]||[]).length>1),next=t.roleDepth[role.id][1];
 const depth={dataset:{role:role.id},value:next,disabled:false,closest:selector=>selector.includes('[data-role]')?depth:null};
 document.querySelectorAll=selector=>selector==='[data-role]'?[depth]:query(selector);
 privateApi.renderDepth();assert.equal(typeof depth.onchange,'function');privateApi.managementEvent({type:'change',target:depth});depth.onchange();
 await new Promise(resolve=>queueMicrotask(resolve));assert.equal(api.read().state,'pending');assert.equal(t.roleDepth[role.id][0],next);
 await e.runAutosave();document.querySelectorAll=query;await e.loadBrowser();
 assert.equal(e.universe.recruits.find(x=>x.id===r.id).targeted,true);assert.equal(e.T(t.name).roleDepth[role.id][0],next);assert.equal(api.read().state,'saved');
});


test('Legacy and safe recruiting list selection survive scoped local context restoration',async()=>{
 const f=await fixture(8330),{e,privateApi}=f;await e.saveBrowser();
 const record={mode:'table',filter:'commits',selectedId:String(e.universe.recruits[0].id),shown:24},restored=[];
 global.DynastyRecruitingWorkspaceView={read:()=>({...record}),restore:context=>{restored.push(context);return true}};
 privateApi.setTab('legacy');privateApi.capture();const saved=privateApi.readView();
 assert.equal(saved.tab,'legacy','every actual navigation tab can restore safely');assert.deepEqual(saved.recruitingWorkspace,record);
 const tabs=[];privateApi.setNavigator(id=>tabs.push(id));const before=JSON.stringify(e.universe);privateApi.restore();
 assert.deepEqual(tabs,['legacy']);assert.deepEqual(restored,[record]);assert.equal(JSON.stringify(e.universe),before);
 delete global.DynastyRecruitingWorkspaceView;
});


test('the debounce starts a real checkpoint at 900ms and reports saved only after persistence completes',async t=>{
 const f=await fixture(8331),{e,store}=f,api=assertApi(f);
 e.autosaveAfter('week');assert.equal(api.read().state,'pending');
 t.mock.timers.tick(899);assert.equal(api.read().state,'pending');assert.equal(await store.load(),undefined);
 t.mock.timers.tick(1);assert.equal(api.read().state,'saving');
 await e.yieldToUserAction();assert.equal(api.read().state,'saved');
 const saved=await store.load();assert.equal(saved.universe.year,e.universe.year);assert.equal(saved.universe.week,0);
 assert.deepEqual(f.events.filter(event=>event.type==='dynasty:save-status').map(event=>event.detail.state),['pending','saving','saved']);
});

test('postseason rollback restores the whole world after the preceding checkpoint has settled',async t=>{
 const f=await fixture(8332,{fullRuntime:true}),{e,store}=f,api=assertApi(f),errors=[];
 t.mock.method(console,'error',error=>errors.push(String(error)));
 e.autosaveAfter('week');await e.runAutosave();assert.equal(e.universe.lastCheckpoint.week,0);
 e.simSeason();assert.equal(e.universe.phase,'confReady');
 const release=f.hold(),saving=e.runAutosave();assert.equal(api.read().state,'saving');
 const unsettled=global.__DL_TEST__.v2PostseasonStateDigest();
 release();assert.equal(await saving,true);
 assert.equal(api.read().state,'saved');assert.equal((await store.load()).universe.week,12);
 assert.equal(e.universe.lastCheckpoint.week,12);
 assert.notEqual(global.__DL_TEST__.v2PostseasonStateDigest(),unsettled,'the real checkpoint updates the world even without a postseason action');
 global.__DL_TEST__.v2PostseasonPrepare('conference');
 const before=global.__DL_TEST__.v2PostseasonStateDigest();
 global.__DL_TEST__.v2PostseasonInjectFault('afterArchive');e.simConferenceChampionships();
 assert.equal(global.__DL_TEST__.v2PostseasonStateDigest(),before,'rollback restores the complete dynasty');
 assert.equal(e.universe.phase,'confReady');assert.equal(global.__DL_TEST__.v2PostseasonAudit().totalPostseason,0);
 assert.equal(errors.length,1);assert.match(errors[0],/Injected postseason v2 rollback fault after archive write/);
 await e.yieldToUserAction();
});
