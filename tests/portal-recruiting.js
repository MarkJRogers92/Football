const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.9.47 commit 1 covers portal *state* only — the targeting/interest engine, NIL and
// promise integration and the UI arrive in later commits. What has to hold from here on
// is that a candidate has one stable identity and that old saves migrate into it without
// the portal entry ever losing the player record it already owns.
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

// Drives real departures so the portal holds actual entries rather than hand-built ones.
// It stops before the portal phase on purpose: that phase places transfers and empties
// universe.transferPortal, so running the whole offseason would leave nothing to inspect.
function fillPortal(e){
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 e.offseasonReview();e.offseasonDepartures();
 return e.universe.transferPortal||[];
}

test('a portal cycle exists for the current season with a bounded, well-formed shape',async()=>{
 const e=await setup(4701),u=e.universe;
 const c=e.ensurePortalCycle();
 assert.equal(c.year,u.year,'the cycle belongs to the season it was opened in');
 assert.equal(c.round,0);
 assert.equal(c.status,'idle');
 assert.deepEqual(c.targets,[]);
 assert.deepEqual(c.resolutions,[]);
 assert.deepEqual(c.log,[]);
 assert.equal(e.ensurePortalCycle(),c,'repeat calls reuse the same object rather than resetting it');
});

test('a season rollover starts a clean cycle instead of carrying targets forward',async()=>{
 const e=await setup(4702),u=e.universe;
 const first=e.ensurePortalCycle();
 first.targets.push('someone');first.round=2;first.status='open';
 u.year+=1;
 const next=e.ensurePortalCycle();
 assert.notEqual(next,first,'a new season gets its own cycle');
 assert.equal(next.year,u.year);
 assert.deepEqual(next.targets,[],'last season’s targets do not leak into the new portal');
 assert.equal(next.round,0);
 assert.equal(next.status,'idle');
});

test('every portal entry gets a stable, unique candidate id and keeps its own player record',async()=>{
 const e=await setup(4703);
 const portal=fillPortal(e);
 assert.ok(portal.length>0,'a real offseason put players in the portal');
 const ids=new Set();
 for(const entry of portal){
  assert.ok(entry.candidateId,'every entry is identified');
  assert.ok(!ids.has(entry.candidateId),`duplicate candidate id ${entry.candidateId}`);
  ids.add(entry.candidateId);
  assert.ok(entry.p&&entry.p.id,'the entry still owns the player record, not a copy of it');
  assert.ok(entry.candidateId.includes(String(entry.p.id)),'identity is derived from the player, not a counter');
 }
 // Re-normalizing must not mint new ids — a save/load cycle would otherwise orphan every target.
 const before=portal.map(x=>x.candidateId);
 e.normalizePortalState();e.normalizePortalState();
 assert.deepEqual((e.universe.transferPortal||[]).map(x=>x.candidateId),before,'ids are stable across repeat normalization');
});

test('a pre-v0.9.47 save migrates without losing the player or duplicating the record',async()=>{
 const e=await setup(4704);
 const portal=fillPortal(e);
 assert.ok(portal.length>0);
 // Strip everything this version added, leaving exactly what an older save carried.
 const players=portal.map(x=>x.p);
 for(const x of portal){delete x.candidateId;delete x.finalists;delete x.interest;delete x.exposure;delete x.decision}
 delete e.universe.portalCycle;
 e.normalizeUniverse();
 const migrated=e.universe.transferPortal;
 assert.equal(migrated.length,players.length,'migration neither drops nor duplicates entries');
 migrated.forEach((x,i)=>{
  assert.equal(x.p,players[i],'the same player object is still referenced, not cloned');
  assert.ok(x.candidateId,'the missing id is backfilled');
  assert.deepEqual(x.finalists,[]);
  assert.deepEqual(x.interest,{});
  assert.equal(x.exposure,0);
  assert.equal(x.decision,null);
 });
 assert.equal(e.universe.portalCycle.year,e.universe.year,'a cycle is created for the loaded season');
});

test('portal state survives a portable save/load round trip',async()=>{
 const e=await setup(4705);
 fillPortal(e);
 const c=e.ensurePortalCycle();
 c.status='open';c.round=2;c.targets.push(e.universe.transferPortal[0].candidateId);
 const expected=e.universe.transferPortal.map(x=>x.candidateId);
 const packed=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));
 e.installSave({version:'0.9.47',userTeam:'Chicago Metropolitan',universe:packed});
 e.normalizeUniverse();
 const after=e.ensurePortalCycle();
 assert.equal(after.status,'open','an in-progress portal resumes where it was');
 assert.equal(after.round,2);
 assert.deepEqual(after.targets,c.targets,'targets survive by candidate id');
 assert.deepEqual((e.universe.transferPortal||[]).map(x=>x.candidateId),expected,'the same candidates come back');
});

test('the event log is bounded so a long portal cannot grow the save without limit',async()=>{
 const e=await setup(4706);
 for(let i=0;i<e.PORTAL_LOG_CAP+40;i++)e.portalLog(`event ${i}`);
 const log=e.ensurePortalCycle().log;
 assert.equal(log.length,e.PORTAL_LOG_CAP,'the log stops at its cap');
 assert.equal(log.at(-1).message,`event ${e.PORTAL_LOG_CAP+39}`,'the most recent events are the ones kept');
});
