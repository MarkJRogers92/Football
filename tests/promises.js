const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const {loadEngine}=require('../tools/harness');

test('promise outcomes, exceptions, ownership, identities and idempotent history',async()=>{
 const e=loadEngine({seed:913,indexedDB:new IDBFactory()});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=u.teams[0];let caseId=0;
 const setup=(label)=>{
  const p=structuredClone(t.roster[0]);Object.assign(p,{id:`case${++caseId}`,morale:70,staffTrust:70,stats:{games:0},injuryHistory:[],redshirtUsed:false,redshirtActive:false,eligibilityUsed:0});
  const r={id:`recruit${caseId}`,pos:p.pos,promise:'None'};e.setRecruitPromise(r,label,t);assert.ok(e.commitRecruit(r,t.name));e.signPlayerPromise(p,r,t);p.promises[0].firstSeason=u.year;return p;
 };
 let p=setup('Early Role');p.stats.games=8;e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'FULFILLED');
 p=setup('Early Role');p.stats.games=4;e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'PARTIAL');
 p=setup('Early Role');const risk=e.transferRisk(p);e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'BROKEN');assert.ok(p.morale<70&&p.staffTrust<70&&e.transferRisk(p)>risk);
 const snapshot=JSON.stringify(p),count=u.events.length;e.auditPlayerPromises(p,t);assert.equal(JSON.stringify(p),snapshot);assert.equal(u.events.length,count);
 assert.equal(u.events.filter(x=>x.type==='PROMISE_BROKEN'&&x.metadata.promiseId===p.promises[0].id).length,1);
 assert.ok(e.promiseHubItems(t).some(x=>x.player===p.id));
 const archived=e.archiveRecord(p,t,'Eligibility exhausted');assert.deepEqual(archived.promises,p.promises);
 p=setup('Early Role');p.stats.games=5;p.injuryHistory=[{year:u.year,week:1,weeks:7}];e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'FULFILLED');
 p=setup('No Redshirt');e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'FULFILLED');
 p=setup('No Redshirt');p.redshirtActive=true;e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'BROKEN');
 p=setup('No Redshirt');p.redshirtActive=true;p.injuryHistory=[{year:u.year,week:1,weeks:5}];e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'FULFILLED');
 p=setup('No Redshirt');p.redshirtActive=true;p.injuryHistory=[{year:u.year,week:12,weeks:7}];e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'BROKEN','late injury cannot excuse earlier redshirt decisions');
 p=setup('Position Lock');e.recordPromisePositionChange(p,'WR');e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'BROKEN','changing back does not erase breach');
 p=setup('Position Lock');e.recordPromisePositionChange(p,'WR',true);p.pos='WR';e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'FULFILLED');
 p=setup('Development Plan');p.trainingFocus='Technique';e.recordPromiseTraining(p,'spring');e.recordPromiseTraining(p,'spring');p.trainingFocus='Balanced';e.recordPromiseTraining(p,'fall');e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'PARTIAL');
 p=setup('Development Plan');p.trainingFocus='Technique';e.applyDevelopmentPhase(p,t,'spring');e.applyDevelopmentPhase(p,t,'fall');e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'FULFILLED');
 p=setup('Development Plan');p.trainingFocus='Technique';e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'BROKEN','changing selection alone is not delivering training');
 p=setup('NIL Priority');e.auditPlayerPromises(p,t);assert.equal(p.promises[0].status,'PASSIVE');
 const rival=u.teams[1],r={id:'rival-recruit',pos:'QB'};e.setRecruitPromise(r,'Early Role',t);e.commitRecruit(r,rival.name);e.signPlayerPromise(p,r,rival);assert.equal(p.promises.length,0,'offers belong to the promising school');
 const coach=t.staff.RC;e.rememberCoach(coach,t);e.rememberCoach(coach,t);assert.equal(u.coachArchive.filter(c=>c.id===coach.id).length,1);
 delete t.staff.SC.id;t.roster[1].promise='Early Role';e.normalizePromiseState();const ids=JSON.stringify(t.staff),legacy=JSON.stringify(t.roster[1].promises);e.normalizePromiseState();assert.equal(JSON.stringify(t.staff),ids);assert.equal(JSON.stringify(t.roster[1].promises),legacy);assert.equal(e.promisePenalty(t.roster[1]),0);
 // Core events, coach IDs and roster obligations survive actual IndexedDB and portable export.
 p=setup('Early Role');p.stats.games=8;t.roster.push(p);e.auditPlayerPromises(p,t);const expected=structuredClone(p.promises),events=structuredClone(u.events);
 await e.saveBrowser();await e.loadBrowser();await e.ensureArchiveLoaded();assert.deepEqual(e.findPlayer(p.id).p.promises,expected);assert.deepEqual(e.universe.events,events);assert.equal(e.universe.teams[0].staff.RC.id,coach.id);
 const portable=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));e.installSave({version:'0.9.0',userTeam:t.name,universe:portable});assert.deepEqual(e.findPlayer(p.id).p.promises,expected);assert.deepEqual(e.universe.events,events);
});

test('recruit signing, first-season audit and rollover keep permanent promise history',async()=>{
 const e=loadEngine({seed:914});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const t=e.universe.teams[0],r=e.universe.recruits[0],coachId=t.staff.RC.id;
 r.trueNow=r.scout=95;r.upside=r.scoutUp=99;e.setRecruitPromise(r,'Development Plan',t);e.commitRecruit(r,t.name);r.commitWeek=12; // isolate promise lifecycle from commitment flips
 function season(){e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason()}
 season();let p=e.universe.teams[0].roster.find(p=>p.promises?.some(q=>q.recruitId===r.id));
 assert.ok(p);assert.equal(p.promises[0].coachId,coachId);assert.equal(p.promises[0].firstSeason,2028);assert.equal(p.promises[0].status,'ACTIVE');
 p.trainingFocus='Technique';const id=p.id;season();const found=e.findPlayer(id).p,q=found.promises[0];assert.equal(q.status,'FULFILLED');assert.equal(q.resolvedSeason,2028);
 assert.equal(e.universe.events.filter(x=>x.type==='PROMISE_FULFILLED'&&x.metadata.promiseId===q.id).length,1);
 const roundtrip=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));e.installSave({version:'0.9.0',userTeam:t.name,universe:roundtrip});assert.equal(e.findPlayer(id).p.promises[0].status,'FULFILLED');
});
