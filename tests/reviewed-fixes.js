const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// The production build injects these extensions inside app.js. Keep the test bridge enabled
// before the effective-runtime harness is first constructed so rollback can be exercised too.
global.__DL_TEST__={};
async function setup(seed,mode='dynasty'){
 const e=loadEngine({seed,fullRuntime:true});
 await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse(mode);return e;
}
function playoffFixture(e,phase='playoffReady'){
 const u=e.universe,me=e.T('Chicago Metropolitan'),others=u.teams.filter(t=>t!==me);
 u.phase=phase;u.bowls=[];u.playoffFieldIds=[];u.playoffFieldUnavailable=false;
 for(const t of u.teams){t.w=6;t.l=6;t.cw=4;t.cl=5;t.champ=false}
 me.w=12;me.l=0;
 const champs=[me,...others.slice(0,9)];
 for(const t of champs){t.w=Math.max(t.w,10);t.l=12-t.w}
 u.confChamps=champs; // Deliberately use old object references; pack/normalize must migrate them.
 e.ranked();e.freezePlayoffField();return {u,me};
}

test('portable imports validate keys and the recruiting pipeline summary escapes independently',async()=>{
 const e=await setup(6101),portable={version:e.APP_VERSION,userTeam:'Chicago Metropolitan',universe:JSON.parse(JSON.stringify(e.packUniverse(e.universe)))};
 assert.doesNotThrow(()=>e.validateImportedSaveText(portable.universe),'ordinary exported saves remain valid');
 global.FileReader=class {readAsText(file){this.result=file;queueMicrotask(()=>this.onload())}};
 assert.equal(await e.importSave(JSON.stringify(portable)),true,'ordinary exported saves still import');
 const malicious=JSON.parse(JSON.stringify(portable));malicious.universe.teams[0].pipelines={'<img src=x onerror=alert(1)>':100};
 const before=e.universe;assert.equal(await e.importSave(JSON.stringify(malicious)),false,'malicious keys are rejected during import');
 assert.equal(e.universe,before,'a rejected import cannot replace the active dynasty');
 const me=e.T('Chicago Metropolitan');me.pipelines={'<img src=x onerror=alert(1)>':100};
 e.renderRecruiting();
 const summary=document.querySelector('#classSummary').innerHTML;
 assert.match(summary,/&lt;img src=x onerror=alert\(1\)&gt;/,'pipeline labels are escaped at the rendering boundary');
 assert.doesNotMatch(summary,/<img src=x onerror=alert\(1\)>/,'pipeline markup never becomes a DOM element');
});

test('postseason save migration resolves champions to live teams and rolls back a failed v2 stage',async()=>{
 const e=await setup(6102),{u,me}=playoffFixture(e);
 const portable=JSON.parse(JSON.stringify(e.packUniverse(u)));
 assert.ok(portable.confChamps.every(id=>typeof id==='number'||typeof id==='string'),'champions serialize as stable ids');
 e.installSave({version:e.APP_VERSION,userTeam:me.name,universe:portable});
 const live=e.T(me.name),field=e.seedField();
 assert.ok(field.includes(live),'the reloaded field holds the live champion, not a serialized copy');
 const before=JSON.parse(JSON.stringify(e.packUniverse(e.universe))),beforeGames=live.w+live.l,beforeStats=JSON.stringify(live.roster.map(p=>p.stats));
 const priorError=console.error;console.error=()=>{};
 try{global.__DL_TEST__.v2PostseasonInjectFault('afterArchive');e.simPlayoff()}finally{console.error=priorError}
 assert.deepEqual(e.packUniverse(e.universe),before,'a postseason v2 fault restores live-team records, players and archive state');
 e.simPlayoff();
 const after=e.T(me.name);
 assert.ok(after.w+after.l>beforeGames,'the live champion record changes after its reloaded playoff game');
 assert.notEqual(JSON.stringify(after.roster.map(p=>p.stats)),beforeStats,'the live champion player statistics change with that game');
});

test('the playoff field is frozen before bowls, persists through reload, and legacy ambiguity is explicit',async()=>{
 const e=await setup(6103),{u}=playoffFixture(e,'bowlReady'),initial=[...u.playoffFieldIds];
 const bowlTeams=e.bowlField();
 assert.ok(bowlTeams.every(t=>!initial.includes(t.id)),'bowl assignments are disjoint from the frozen playoff field');
 e.simBowls();
 assert.equal(u.phase,'playoffReady');
 assert.deepEqual(e.seedField().map(t=>t.id),initial,'bowl results cannot change playoff membership');
 const reloaded=JSON.parse(JSON.stringify(e.packUniverse(u)));e.installSave({version:e.APP_VERSION,userTeam:'Chicago Metropolitan',universe:reloaded});
 assert.deepEqual(e.seedField().map(t=>t.id),initial,'the ordered field survives a postseason reload');
 const legacy=JSON.parse(JSON.stringify(reloaded));legacy.playoffFieldIds=[];legacy.phase='playoffReady';legacy.bowls=[{label:'Legacy Bowl',winner:'A',loser:'B'}];
 e.installSave({version:e.APP_VERSION,userTeam:'Chicago Metropolitan',universe:legacy});
 assert.equal(e.universe.playoffFieldUnavailable,true,'older post-bowl saves are marked unavailable instead of reselected');
 e.simPlayoff();
 assert.equal(e.universe.phase,'playoffReady','an unavailable historical playoff field is never invented');
 assert.match(document.querySelector('#saveStatus').textContent,/original field is unavailable/);
});

test('academic progression occurs once before every effective game path and persists midweek',async()=>{
 const detailed=await setup(6104),me=detailed.T('Chicago Metropolitan'),qb=me.roster.find(p=>p.pos==='QB');
 for(const p of me.roster){p.academicStanding=80;p.academicHold=0;p.redshirtActive=false}
 qb.academicHold=1;detailed.simulateUserDetailed();
 assert.equal(qb.academicHold,0,'a one-week hold expires before the recorded Detailed game selects participants');
 assert.equal(detailed.gameAvailable(qb),true);
 const saved=JSON.parse(JSON.stringify(detailed.packUniverse(detailed.universe))),standing=qb.academicStanding,week=detailed.universe.week;
 detailed.installSave({version:detailed.APP_VERSION,userTeam:me.name,universe:saved});
 const reloaded=detailed.findPlayer(qb.id).p;detailed.simWeek(true);
 assert.equal(detailed.universe.week,week+1,'weekly completion follows the Detailed game');
 assert.equal(reloaded.academicStanding,standing,'reload plus weekly completion does not apply academics twice');

 const quick=await setup(6105),quickTeam=quick.T('Chicago Metropolitan'),quickQb=quickTeam.roster.find(p=>p.pos==='QB');
 quickQb.academicHold=1;quick.simWeek(true);
 assert.equal(quickQb.academicHold,0,'Quick simulation uses the same start-of-week hold expiry');

 const newHold=await setup(6106),holdTeam=newHold.T('Chicago Metropolitan'),holdQb=holdTeam.roster.find(p=>p.pos==='QB');
 holdQb.academicStanding=5;holdQb.academicHold=0;holdQb.redshirtActive=false;newHold.simWeek(true);
 assert.equal(holdQb.academicHold,2,'a newly failing player is held before that week\'s kickoff');
 assert.equal(newHold.gameAvailable(holdQb),false);
});

test('renaming a program rebuilds live commitment counts without rewriting history',async()=>{
 const e=await setup(6107,'commissioner'),u=e.universe,team=e.T('Chicago Metropolitan'),recruit=u.recruits.find(r=>!r.committed);
 assert.equal(e.commitRecruit(recruit,team.name),true);u.history=[{type:'season',year:2026,champion:'Chicago Metropolitan'}];
 document.querySelector('#editName').value='Chicago Metro Renamed';e.applyProgramEdit();
 assert.equal(recruit.committed,'Chicago Metro Renamed');
 assert.equal(e.classCommitCount('Chicago Metro Renamed'),1,'the live count follows the renamed commitment');
 assert.equal(e.classCommitCount('Chicago Metropolitan'),0,'the old program key is removed');
 assert.ok(team.commits.some(r=>r.id===recruit.id),'the team keeps the live commitment reference');
 assert.equal(u.history[0].champion,'Chicago Metropolitan','historical snapshots are left unchanged');
 const extra=u.recruits.filter(r=>!r.committed).slice(0,e.scholarshipCapacity(team)+3);
 for(const r of extra)r.committed=team.name;e.rebuildRecruitClassCounts();e.enforceScholarshipLimits();
 assert.ok(e.classCommitCount(team.name)<=e.scholarshipCapacity(team),'limit enforcement sees the rebuilt renamed count');
 const saved=JSON.parse(JSON.stringify(e.packUniverse(u)));e.installSave({version:e.APP_VERSION,userTeam:team.name,universe:saved});
 assert.equal(e.classCommitCount(team.name),e.universe.recruits.filter(r=>r.committed===team.name).length,'renamed counts remain correct after save/load');
 assert.equal(e.canTakeCommit(team.name),e.classCommitCount(team.name)<e.scholarshipCapacity(e.T(team.name))+e.oversignAppetite(e.T(team.name)),'admission uses the rebuilt count');
});

test('enrollment preserves recruited work and development traits, with legacy defaults only when absent',async()=>{
 const e=await setup(6108),team=e.T('Chicago Metropolitan'),recruit=e.universe.recruits.find(r=>!r.committed);
 assert.equal(e.commitRecruit(recruit,team.name),true);recruit.work=99;recruit.dev=15;e.offseasonEnrollment();
 const enrolled=team.roster.find(p=>p.name===recruit.name&&p.portraitSeed===recruit.portraitSeed);
 assert.equal(enrolled.work,99);assert.equal(enrolled.dev,15);

 const legacy=await setup(6109),legacyTeam=legacy.T('Chicago Metropolitan'),legacyRecruit=legacy.universe.recruits.find(r=>!r.committed);
 assert.equal(legacy.commitRecruit(legacyRecruit,legacyTeam.name),true);delete legacyRecruit.work;delete legacyRecruit.dev;legacy.offseasonEnrollment();
 const legacyEnrolled=legacyTeam.roster.find(p=>p.name===legacyRecruit.name&&p.portraitSeed===legacyRecruit.portraitSeed);
 assert.ok(Number.isFinite(legacyEnrolled.work)&&Number.isFinite(legacyEnrolled.dev),'legacy recruits without traits receive generated defaults');
});
