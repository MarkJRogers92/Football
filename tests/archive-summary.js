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
 assert.equal(row.seasonHistory,undefined,'no empty season rows are kept');
 assert.equal(row.scoutingDomains,undefined);
 assert.equal(row.coachRelationships,undefined);
 assert.equal(row.campHistory,undefined);
 assert.equal(row.name,'Slim Walker');
 assert.equal(row.pos,p.pos);
 assert.equal(row.portraitSeed,12345,'identity survives');
 assert.equal(row.lastTeam,t.name);
 assert.equal(row.exitReason,'Roster cut');
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
