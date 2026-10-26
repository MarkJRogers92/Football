const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.13: the history index reads what the dynasty has already recorded.
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('the coach index lists active staff with career records', async()=>{
 const e=await setup(9101),u=e.universe;
 const rows=e.coachIndexRows();
 const staffCount=u.teams.reduce((n,t)=>n+Object.keys(t.staff||{}).length,0);
 assert.equal(rows.length,Math.min(40,staffCount),'respects the requested limit');
 assert.ok(rows.every(r=>r.id&&r.name&&Number.isFinite(r.wins)&&Number.isFinite(r.losses)));
 assert.ok(rows.every(r=>r.active),'nobody has departed in a fresh universe');
 const me=u.teams.find(t=>t.name==='Chicago Metropolitan');
 const hc=e.coachIndexRows({query:me.staff.HC.name}).find(r=>r.id===me.staff.HC.id);
 assert.ok(hc,'the controlled program head coach is findable by name');
 assert.equal(hc.team,'Chicago Metropolitan');
});

test('coach search matches name or program and never mutates the universe', async()=>{
 const e=await setup(9102),u=e.universe,t=u.teams[0],hc=t.staff.HC;
 const before=JSON.stringify(u.teams.map(x=>[x.name,x.staff.HC.id]));
 assert.ok(e.coachIndexRows({query:hc.name}).some(r=>r.id===hc.id));
 assert.ok(e.coachIndexRows({query:t.name}).every(r=>r.team===t.name));
 assert.equal(e.coachIndexRows({query:'zzz-no-such-coach'}).length,0);
 assert.equal(JSON.stringify(u.teams.map(x=>[x.name,x.staff.HC.id])),before);
});

test('the champion timeline maps archived seasons newest first', async()=>{
 const e=await setup(9103),u=e.universe;
 assert.deepEqual(e.championTimeline(),[]);
 u.history.unshift({type:'season',year:2032,champion:'Tidewater State',top10:[{name:'Tidewater State',record:'13-1'},{name:'Puget Sound State',record:'12-2'}]});
 u.history.unshift({type:'season',year:2033,champion:'Great Lakes University',top10:[{name:'Great Lakes University',record:'14-0'},{name:'Chicago Metropolitan',record:'11-2'}]});
 const rows=e.championTimeline();
 assert.deepEqual(rows.map(r=>r.year),[2033,2032]);
 assert.equal(rows[0].champion,'Great Lakes University');
 assert.equal(rows[0].runnerUp,'Chicago Metropolitan');
 assert.equal(rows[0].record,'14-0');
});
