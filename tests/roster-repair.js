const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.21: measured over three seasons, thin kicker/punter depth grew 0 -> 7 -> 38
// team-seasons because the yearly walk-on top-up picked positions at random.
async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 return e;
}
function gut(e){
 const u=e.universe,t=u.teams[0];
 t.roster=t.roster.filter(p=>p.pos!=='K'&&p.pos!=='P').slice(0,80);
 u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'preseason');
 u.offseason.completed.push('spring','fall');
 return t;
}

test('walk-on top-up rebuilds the kicking game',async()=>{
 const e=await setup(9601),t=gut(e);
 assert.equal(t.roster.filter(p=>p.pos==='K').length,0);
 e.offseasonPreseason();
 assert.equal(t.roster.length,85);
 assert.ok(t.roster.filter(p=>p.pos==='K').length>=2,'two kickers are restored');
 assert.ok(t.roster.filter(p=>p.pos==='P').length>=2,'two punters are restored');
});

test('the same shortage is repaired for the whole league',async()=>{
 const e=await setup(9602);
 for(const t of e.universe.teams){
  t.roster=t.roster.filter(p=>p.pos!=='K'&&p.pos!=='P').slice(0,80);
 }
 e.universe.phase='complete';
 e.universe.offseason=e.makeOffseasonState(e.universe.year,'preseason');
 e.universe.offseason.completed.push('spring','fall');
 e.offseasonPreseason();
 const short=e.universe.teams.filter(t=>t.roster.filter(p=>p.pos==='K').length<2||t.roster.filter(p=>p.pos==='P').length<2);
 assert.equal(short.length,0,'no program is left without a kicker and punter');
});

test('repair stays deterministic for a seed',async()=>{
 const run=async seed=>{const e=await setup(seed),t=gut(e);e.offseasonPreseason();return t.roster.map(p=>p.id).join(',')};
 assert.equal(await run(9603),await run(9603));
});
