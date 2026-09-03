const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const {loadEngine}=require('../tools/harness');

test('coach identity and career seasons are durable and idempotent',async()=>{
 const e=loadEngine({seed:941,indexedDB:new IDBFactory()});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=u.teams[0],c=t.staff.HC,id=c.id;
 assert.ok(id);assert.equal(c.careerHistory.length,1);assert.equal(c.careerHistory[0].endSeason,null);
 t.w=10;t.l=3;t.champ=true;u.champion=t.name;u.awards[u.year]=[{name:'Coach of the Year',playerId:null,playerName:c.name,team:t.name,pos:'HC'}];
 e.recordCoachSeason(t);e.recordCoachSeason(t);
 assert.equal(c.seasons.filter(s=>s.year===u.year).length,1);assert.equal(c.careerHistory[0].wins,10);assert.equal(c.careerHistory[0].nationalTitles,1);
 const packed=JSON.parse(JSON.stringify(e.packUniverse(u)));e.installSave({version:'0.9.4',userTeam:t.name,universe:packed});
 const again=e.universe.teams[0].staff.HC;assert.equal(again.id,id);assert.deepEqual(again.careerHistory,c.careerHistory);assert.deepEqual(again.seasons,c.seasons);
});

test('coach moves keep one identity and linked recruiting/player memory',async()=>{
 const e=loadEngine({seed:942});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,from=u.teams[0],to=u.teams[1],c=from.staff.OC,id=c.id,oldDest=to.staff.OC.id,p=from.roster[0],r=u.recruits[0];
 p.coachRelationships={[id]:77};r.recruitingMemory={recruiterCoachId:id,relationship:74};
 e.recordCoachSeason(from);const moved=e.moveCoach(c,from,to,'OC','Accepted coordinator job');
 assert.equal(moved.id,id);assert.equal(to.staff.OC.id,id);assert.notEqual(from.staff.OC.id,id);assert.equal(e.coachById(id).coach.id,id);assert.equal(e.coachById(id).active,true);
 assert.equal(p.coachRelationships[id],77);assert.equal(r.recruitingMemory.recruiterCoachId,id);
 assert.equal(c.careerHistory.length,2);assert.ok(c.careerHistory[0].endSeason!=null);assert.equal(c.careerHistory[1].schoolId,to.id);assert.equal(c.careerHistory[1].endSeason,null);
 assert.ok(u.coachArchive.some(x=>x.id===oldDest));assert.ok(u.events.some(x=>x.type==='COACH_MOVED'&&x.coachIds.includes(id)));
});

test('retirement archives the same coach and installs a new active coach',async()=>{
 const e=loadEngine({seed:943});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=u.teams[0],c=t.staff.DC,id=c.id;e.recordCoachSeason(t);e.retireCoach(t,'DC','Test retirement');
 assert.notEqual(t.staff.DC.id,id);const archived=u.coachArchive.find(x=>x.id===id);assert.ok(archived);assert.equal(archived.status,'RETIRED');assert.ok(archived.careerHistory.every(s=>s.endSeason!=null));
 assert.ok(u.events.some(x=>x.type==='COACH_RETIRED'&&x.coachIds.includes(id)));
 const portable=JSON.parse(JSON.stringify(e.packUniverse(u)));e.installSave({version:'0.9.4',userTeam:t.name,universe:portable});assert.equal(e.coachById(id).coach.status,'RETIRED');assert.deepEqual(e.coachById(id).coach.careerHistory,archived.careerHistory);
});

test('legacy coaches normalize once without inventing historical results',async()=>{
 const e=loadEngine({seed:944});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const t=e.universe.teams[0],c=t.staff.RC;delete c.careerHistory;delete c.seasons;delete c.specialties;delete c.status;const id=c.id;
 e.normalizeCoachState();const once=JSON.stringify(c);e.normalizeCoachState();assert.equal(JSON.stringify(c),once);assert.equal(c.id,id);assert.equal(c.careerHistory.length,1);assert.equal(c.careerHistory[0].wins,0);assert.equal(c.careerHistory[0].legacy,true);
});
