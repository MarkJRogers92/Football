const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.16: measured archive analysis showed never-played careers were 30.5% of
// the archive and 27.9% of its bytes. They are summarised at write time; played
// careers keep every field they had.
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const career=(games,extra={})=>({games,passYds:0,rushYds:0,recYds:0,tackles:0,...extra});

test('a career with no games is archived as a summary record', async()=>{
 const e=await setup(9401),u=e.universe,t=u.teams[0];
 const p={...t.roster[0],id:'summary-x',name:'Slim Walker',career:career(0),stats:career(0),
  seasonHistory:[{year:2030,team:t.name,pos:'LB',rating:52}],scoutingDomains:{athleticism:{lo:40,hi:60}},
  coachRelationships:{coach1:55},campHistory:[{year:2030,phase:'Spring'}],portraitSeed:12345};
 e.addToArchive(p,t,'Roster cut');
 const row=u.playerArchive.find(x=>x.id==='summary-x');
 assert.ok(row,'the player is still archived and findable');
 assert.equal(row.recordTier,'summary');
 assert.deepEqual(row.seasonHistory,p.seasonHistory,'recorded seasons survive even without game appearances');
 assert.deepEqual(row.coachRelationships,{coach1:55},'recorded relationships survive');
 assert.equal(row.scoutingDomains,undefined);
 assert.deepEqual(row.campHistory,p.campHistory,'camp attendance is real off-field history');
 assert.equal(row.name,'Slim Walker');
 assert.equal(row.pos,p.pos);
 assert.equal(row.portraitSeed,12345,'identity survives');
 assert.equal(row.lastTeam,t.name);
 assert.equal(row.exitReason,'Roster cut');
});

test('never-played careers retain recruitment, transfers and injuries through reload', async()=>{
 const e=await setup(9408),u=e.universe,t=u.teams[0],p={...t.roster[0],id:'off-field',career:career(0),stats:career(0),
  recruitingMemory:{schoolId:t.id,season:2028,stars:3},
  transferHistory:[{year:2029,from:'Prior School',to:t.name,fromSchoolId:2,toSchoolId:t.id}],
  injuryHistory:[{year:2030,type:'Knee injury',weeks:8}],scoutingHistory:[{year:2029,reason:'SIGNING_DAY'}]};
 e.addToArchive(p,t,'Eligibility exhausted');
 const save=JSON.parse(JSON.stringify({userTeam:t.name,universe:e.packUniverse(u)}));e.installSave(save);
 const row=e.universe.playerArchive.find(x=>x.id===p.id);
 for(const key of ['recruitingMemory','transferHistory','injuryHistory','scoutingHistory'])assert.deepEqual(row[key],p[key],key);
});

test('a career with games keeps the full record', async()=>{
 const e=await setup(9402),u=e.universe,t=u.teams[0];
 const p={...t.roster[0],id:'full-y',name:'Played Career',career:career(14,{passYds:1200}),stats:career(14),
  seasonHistory:[{year:2030,team:t.name,pos:'QB',rating:70}]};
 e.addToArchive(p,t,'Graduated');
 const row=u.playerArchive.find(x=>x.id==='full-y');
 assert.equal(row.recordTier,undefined,'played careers are untouched');
 assert.equal(row.seasonHistory.length,1,'their history is kept');
 assert.equal(row.career.games,14);
});

test('summary records survive normalization', async()=>{
 const e=await setup(9403),u=e.universe,t=u.teams[0];
 e.addToArchive({...t.roster[0],id:'summary-z',career:career(0),stats:career(0)},t,'No professional deal');
 assert.doesNotThrow(()=>e.normalizeUniverse());
 const row=u.playerArchive.find(x=>x.id==='summary-z');
 assert.deepEqual(row.awards,[]);
 assert.deepEqual(row.seasonHistory,[]);
});

// v0.30: lossless trims for newly archived players, played or not.
test('archived records drop coach departure pressure and keep home coordinates to four decimals', async()=>{
 const e=await setup(9409),u=e.universe,t=u.teams[0];
 const pressure={coachId:'c1',fromSchoolId:t.id,toSchoolId:2,strength:30,season:2030};
 const memory={schoolId:t.id,season:2028,stars:3,homeRegion:'Pacific',lat:21.283248493511696,lon:-157.92391415222895};
 const played={...t.roster[0],id:'trim-played',career:career(12),stats:career(12),coachDeparturePressure:pressure,recruitingMemory:memory};
 const unplayed={...t.roster[1],id:'trim-unplayed',career:career(0),stats:career(0),coachDeparturePressure:pressure,recruitingMemory:memory};
 e.addToArchive(played,t,'Graduated');e.addToArchive(unplayed,t,'Roster cut');
 for(const id of ['trim-played','trim-unplayed']){
  const row=u.playerArchive.find(x=>x.id===id);
  assert.equal(row.coachDeparturePressure,undefined,`${id}: departure pressure only matters to an active player`);
  assert.deepEqual(row.recruitingMemory,{...memory,lat:21.2832,lon:-157.9239},`${id}: everything else in the recruitment is kept`);
 }
 assert.equal(played.recruitingMemory.lat,memory.lat,'the departing player object is not changed');
 assert.equal(played.coachDeparturePressure,pressure);
 const save=JSON.parse(JSON.stringify({userTeam:t.name,universe:e.packUniverse(u)}));e.installSave(save);
 assert.deepEqual(e.universe.playerArchive.find(x=>x.id==='trim-played').recruitingMemory,{...memory,lat:21.2832,lon:-157.9239},'stable through reload');
});
