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

test('a decorated retired player is inducted with visible reasons', async()=>{
 const e=await setup(9201),u=e.universe;
 u.playerArchive.push({id:'hof-qb',name:'Quincy Vale',pos:'QB',lastTeam:'Chicago Metropolitan',retiredYear:2031,
  perceived:80,draftResult:{year:2031,round:1,label:'Round 1, Pick 3'},
  awards:[{year:2030,name:'National Player of the Year'}],
  career:{passYds:11200,passTD:88,int:24,rushYds:900,rushTD:9}});
 const row=e.hallOfFame().find(r=>r.id==='hof-qb');
 assert.ok(row,'a national player of the year is inducted');
 assert.equal(row.kind,'player');
 assert.ok(row.reasons.some(reason=>/National Player of the Year 2030/.test(reason)),'the award is named');
 assert.ok(row.reasons.some(reason=>/First-round draft pick/.test(reason)),'the draft result is named');
 assert.ok(row.reasons.some(reason=>/career passing yards/.test(reason)),'career production is named');
});

test('an ordinary or unfinished career stays out', async()=>{
 const e=await setup(9202),u=e.universe;
 u.playerArchive.push({id:'hof-none',name:'Ordinary Walk-On',pos:'LB',lastTeam:'Chicago Metropolitan',retiredYear:2030,
  perceived:52,draftResult:null,awards:[],career:{tackles:12,sacks:1}});
 assert.equal(e.hallOfFame().some(r=>r.id==='hof-none'),false);
});

test('a championship coach is inducted', async()=>{
 const e=await setup(9203),u=e.universe,t=u.teams[0],hc=t.staff.HC;
 hc.seasons=[{year:2030,schoolId:t.id,schoolName:t.name,role:'Head Coach',wins:13,losses:1,nationalTitle:true,conferenceTitle:true,coachOfYear:true}];
 const row=e.hallOfFame().find(r=>r.kind==='coach'&&r.id===hc.id);
 assert.ok(row,'a national-title coach is inducted');
 assert.ok(row.reasons.some(reason=>/national title/.test(reason)));
 assert.ok(row.reasons.some(reason=>/Coach of the Year/.test(reason)));
});

test('induction is deterministic and read-only', async()=>{
 const e=await setup(9204),u=e.universe;
 u.playerArchive.push({id:'hof-det',name:'Deterministic Career',pos:'RB',lastTeam:'Chicago Metropolitan',retiredYear:2031,
  perceived:75,draftResult:{year:2031,round:2,label:'Round 2, Pick 9'},awards:[{year:2030,name:'Running Back of the Year'}],
  career:{rushYds:5400,rushTD:52,recYds:900}});
 const snapshot=()=>JSON.stringify({archive:u.playerArchive.map(p=>[p.id,p.awards.length]),teams:u.teams.map(t=>t.name)});
 const before=snapshot();
 const first=e.hallOfFame({limit:10}),second=e.hallOfFame({limit:10});
 assert.deepEqual(second,first,'repeat calls return the same list');
 assert.equal(snapshot(),before,'induction never mutates the universe');
});
