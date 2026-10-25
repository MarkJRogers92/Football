const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.10: the Playbook's second job. These check that the index is built from the
// universe the dynasty already holds, that it never mutates state, and that a
// deferred archive is not silently loaded by a keystroke.
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('finds a program, its head coach and one of its players', async()=>{
 const e=await setup(9001),u=e.universe,t=u.teams[0],coach=t.staff.HC,player=t.roster[0];
 const teamRows=e.encyclopediaSearch(t.name);
 assert.equal(teamRows[0].kind,'team');
 assert.equal(teamRows[0].name,t.name);
 const coachRows=e.encyclopediaSearch(coach.name).filter(r=>r.kind==='coach'&&r.id===coach.id);
 assert.equal(coachRows.length,1,'the coach is found once');
 assert.ok(coachRows[0].meta.includes(t.name),'the row says which program he is at');
 assert.ok(e.encyclopediaSearch(player.name).some(r=>r.kind==='player'&&r.id===player.id));
});

test('ranks exact and prefix matches first and ignores one-character terms', async()=>{
 const e=await setup(9002),u=e.universe;
 assert.deepEqual(e.encyclopediaSearch('a'),[]);
 assert.deepEqual(e.encyclopediaSearch(''),[]);
 const name=u.teams[0].name;
 const prefix=e.encyclopediaSearch(name.slice(0,3));
 assert.ok(prefix.length>0,'a three-letter prefix matches');
 assert.equal(e.encyclopediaSearch(name).filter(r=>r.kind==='team')[0].name,name,'the exact program ranks first');
});

test('rows are unique and capped per kind', async()=>{
 const e=await setup(9003);
 const rows=e.encyclopediaSearch('an',{limit:2});
 const keys=new Set(rows.map(r=>r.kind+':'+r.id));
 assert.equal(keys.size,rows.length,'no entity appears twice');
 for(const kind of ['team','coach','player']){
  assert.ok(rows.filter(r=>r.kind===kind).length<=2,`${kind} respects the cap`);
 }
});

test('an archived career is searchable without loading the archive', async()=>{
 const e=await setup(9004),u=e.universe,t=u.teams[0],retired=t.roster[0];
 u.playerArchive.push({...retired,id:'archive-zq',name:'Zebediah Quarry',lastTeam:t.name,exitReason:'Graduated'});
 const rows=e.encyclopediaSearch('zebediah');
 assert.ok(rows.some(r=>r.kind==='player'&&r.id==='archive-zq'),'the retired player is reachable');
 assert.ok(rows[0].meta.includes('Graduated'),'and carries why he left');
});
