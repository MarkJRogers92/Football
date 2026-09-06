const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed=952){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('v0.9.52 goals carry explicit weights and stable live status',async()=>{
 const e=await setup(),t=e.T('Chicago Metropolitan'),goals=e.ensureSeasonGoals(t);
 assert.equal(goals.length,4);
 assert.deepEqual(goals.map(g=>g.weight),['Critical','Important','Important','Bonus']);
 assert.equal(e.ensureSeasonGoals(t),goals,'same season does not reroll objectives');
 const states=e.evaluateSeasonGoals(t,false).results.map(g=>g.state);
 assert.ok(states.every(s=>['complete','on_track','at_risk','failed'].includes(s)));
});

test('goal mix varies across programs while remaining mechanically supported',async()=>{
 const e=await setup(953),teams=e.universe.teams.slice(0,36),types=new Set(),stretch=new Set();
 for(const t of teams){const g=e.ensureSeasonGoals(t);types.add(g.find(x=>x.id==='recruiting')?.type);stretch.add(g.find(x=>x.id==='stretch')?.type)}
 assert.ok(types.has('bluechips')&&types.has('classSize'),'recruiting goals should not all be identical');
 assert.ok(stretch.size>=3,'program stature should create multiple stretch-goal families');
});

test('win goal can become visibly at risk and Program Overview renders board context',async()=>{
 const e=await setup(954),t=e.T('Chicago Metropolitan');e.ensureSeasonGoals(t);t.w=0;t.l=11;
 const win=e.evaluateSeasonGoals(t,false).results.find(g=>g.type==='wins');
 assert.equal(win.state,'at_risk');
 const goalsHtml=e.seasonGoalsHTML(t),overview=e.programOverviewHTML(t);
 assert.match(goalsHtml,/At risk/);
 assert.match(overview,/Admin confidence/);
 assert.match(overview,/Season expectation/);
 assert.match(overview,/Goal status/);
});

test('v0.9.51 goal records migrate in place without rerolling the current season',async()=>{
 const e=await setup(955),t=e.T('Chicago Metropolitan');
 const legacy=[
  {id:'wins',tier:'Primary',type:'wins',label:'Win at least 8 games',target:8,year:e.universe.year},
  {id:'rivalry',tier:'Secondary',type:'rivalry',label:'Beat rival',target:2,year:e.universe.year},
  {id:'recruiting',tier:'Secondary',type:'bluechips',label:'Sign 5 blue-chip recruits',target:5,year:e.universe.year},
  {id:'stretch',tier:'Stretch',type:'top25',label:'Finish in the Top 25',target:25,year:e.universe.year},
 ];
 t.seasonGoalsYear=e.universe.year;t.seasonGoals=legacy;
 const migrated=e.ensureSeasonGoals(t);
 assert.equal(migrated,legacy,'current-season objectives should be preserved, not rerolled');
 assert.deepEqual(migrated.map(g=>g.weight),['Critical','Important','Important','Bonus']);
 assert.equal(migrated[3].type,'rank');
 assert.equal(migrated[3].target,25);
 assert.doesNotThrow(()=>e.seasonGoalsHTML(t));
});
