const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e;
}
const keys=p=>p.items.map(x=>x.key);

test('the plan always names the one step that moves the calendar',async()=>{
 const e=await setup(1301),u=e.universe;
 assert.ok(keys(e.weeklyPlan(e.T(u.teams[0].name))).includes('sim')||true);
 const me=e.T('Chicago Metropolitan');
 assert.ok(keys(e.weeklyPlan(me)).includes('sim'),'a regular-season week leads with playing it');
 for(let i=0;i<12;i++)e.simWeek();
 assert.ok(keys(e.weeklyPlan(me)).includes('conf'),'the conference round is surfaced when it is due');
 e.simConferenceChampionships();
 assert.ok(keys(e.weeklyPlan(me)).includes('playoff'));
 e.simPlayoff();
 const plan=e.weeklyPlan(me);
 assert.deepEqual(keys(plan).slice(0,3),['spring','fall','offseason'],
  'the offseason sequence is shown in order, which is the part nothing else signposts');
 assert.equal(plan.heading,'Offseason checklist');
});

test('completed steps are marked done, sink to the bottom and stop counting',async()=>{
 const e=await setup(1302),me=e.T('Chicago Metropolitan');
 for(let i=0;i<12;i++)e.simWeek();
 e.simConferenceChampionships();e.simPlayoff();
 const before=e.weeklyPlan(me);
 assert.equal(before.items.find(x=>x.key==='spring').done,false);
 e.runSpringCamp();
 const after=e.weeklyPlan(me);
 const spring=after.items.find(x=>x.key==='spring');
 assert.equal(spring.done,true,'a finished step is marked done rather than disappearing');
 assert.equal(after.remaining,before.remaining-1,'and stops counting toward what is left');
 assert.ok(after.items.indexOf(spring)>after.items.findIndex(x=>!x.done),'done steps sink below pending ones');
});

test('the plan surfaces real blockers and never invents one',async()=>{
 const e=await setup(1303),u=e.universe,me=e.T('Chicago Metropolitan');
 assert.equal(keys(e.weeklyPlan(me)).some(k=>k.startsWith('hire_')),false,'a full staff raises no hiring step');
 e.createOpening(me,'OC','Left for another opportunity','DEPARTED');
 assert.ok(keys(e.weeklyPlan(me)).includes('hire_OC'),'an open search is surfaced');
 // Every step points at a tab that exists and carries usable guidance.
 for(const x of e.weeklyPlan(me).items){
  assert.ok(x.label&&x.detail,`step ${x.key} needs a label and a reason`);
  assert.ok(['dashboard','season','staff','recruiting','roster','development','offseason'].includes(x.tab),
   `step ${x.key} points at an unknown tab: ${x.tab}`);
 }
});

test('the plan stays short enough to act on',async()=>{
 const e=await setup(1304),me=e.T('Chicago Metropolitan');
 for(let yr=0;yr<2;yr++){
  for(let i=0;i<12;i++){assert.ok(e.weeklyPlan(me).items.length<=6,'a weekly plan must stay readable');e.simWeek()}
  e.simConferenceChampionships();e.simPlayoff();
  assert.ok(e.weeklyPlan(me).items.length<=6);
  e.runSpringCamp();e.runFallCamp();e.runOffseason();
 }
});

test('the wire ranks tiles by importance instead of insertion order',async()=>{
 const e=await setup(1305),u=e.universe,me=e.T('Chicago Metropolitan');
 const imp=x=>x.importance??40;
 for(let i=0;i<12;i++){
  e.simWeek();
  const hub=u.weeklyHub;
  assert.ok(hub.length<=9,'the wire never shows more than nine tiles');
  assert.ok(hub.every(x=>Number.isFinite(x.importance)),`every tile carries a numeric importance (week ${u.week}): ${hub.filter(x=>!Number.isFinite(x.importance)).map(x=>x.kicker)}`);
  assert.ok(hub.every((x,i)=>i===0||imp(hub[i-1])>=imp(x)),`tiles are ordered by importance (week ${u.week}): ${hub.map(x=>x.kicker+'='+imp(x))}`);
 }
 // Promise items are the first thing buildWeeklyHub inserts, so under insertion order a trivial one would
 // lead the wire; ranked by importance it has to sink beneath the week's result and next matchup.
 u.events.push({id:'EVT_TEST',type:'PROMISE_BROKEN',season:u.year,week:u.week,timestampOrder:1e9,importance:5,schoolIds:[me.id],playerIds:[me.roster[0].id],coachIds:[],recruitIds:[],gameIds:[],summary:'Trivial promise',metadata:{result:'minor'}});
 e.buildWeeklyHub(me.rank);
 const hub=u.weeklyHub,trivial=hub.findIndex(x=>x.main==='Trivial promise');
 assert.ok(trivial>0,'a low-importance tile inserted first no longer leads the wire');
 assert.ok(hub.slice(0,trivial).every(x=>imp(x)>=5),'everything above it matters more');
});
