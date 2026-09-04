const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const toPostseason=e=>{for(let i=0;i<12;i++)e.simWeek();e.simConferenceChampionships()};

test('bowl season is its own step between the conference round and the playoff',async()=>{
 const e=await setup(2501),u=e.universe;
 toPostseason(e);
 assert.equal(u.phase,'bowlReady','the conference round hands off to bowls, not the playoff');
 const plan=e.weeklyPlan(e.T('Chicago Metropolitan'));
 assert.ok(plan.items.map(x=>x.key).includes('bowls'),'and the plan names it as the gate');
 const logs=e.simBowls();
 assert.equal(u.phase,'playoffReady');
 assert.ok(logs.length>0,'bowls were actually played');
 assert.equal(u.bowls.length,logs.length);
 assert.equal(e.simBowls().length,0,'running them twice does nothing');
});

test('only six-win teams outside the playoff get a bowl, each in exactly one',async()=>{
 const e=await setup(2502),u=e.universe;
 toPostseason(e);
 const playoff=new Set(e.seedField?e.seedField().map(t=>t.name):[]);
 const field=e.bowlField();
 for(const t of field){
  assert.ok(t.w>=6,`${t.name} earned it at ${t.w}-${t.l}`);
  assert.equal(playoff.has(t.name),false,`${t.name} is not already in the playoff`);
 }
 for(const t of u.teams)if(t.w>=6&&!playoff.has(t.name))assert.ok(field.some(x=>x.name===t.name),`${t.name} was not left out`);
 e.simBowls();
 const appearances=new Map();
 for(const b of u.bowls)for(const n of [b.winner,b.loser])appearances.set(n,(appearances.get(n)||0)+1);
 for(const [n,c] of appearances)assert.equal(c,1,`${n} plays one bowl, not ${c}`);
 assert.equal(u.bowls.length,Math.floor(field.length/2));
 for(const b of u.bowls)assert.notEqual(b.winner,b.loser);
});

test('the playoff plays the bowls first rather than skipping them',async()=>{
 const e=await setup(2503),u=e.universe;
 toPostseason(e);
 assert.equal(u.bowls.length,0);
 e.simPlayoff();               // called straight from bowlReady, as every older caller does
 assert.ok(u.bowls.length>0,'bowls cannot be skipped by going straight to the playoff');
 assert.equal(u.phase,'complete');
 assert.ok(u.champion,'and the playoff still ran');
});

test('the wire chases eligibility and then reports the result',async()=>{
 const e=await setup(2504),u=e.universe,me=e.T('Chicago Metropolitan');
 for(let i=0;i<7;i++)e.simWeek();
 me.w=3;me.l=4;
 const watch=e.bowlHubItems(me);
 assert.equal(watch.length,1);
 assert.equal(watch[0].kicker,'BOWL WATCH');
 assert.ok(watch[0].main.includes('3 more wins'));
 me.w=9;me.l=1;
 assert.equal(e.bowlHubItems(me).length,0,'a team already eligible is not nagged');
 me.bowlResult={label:'Liberty Bowl',won:true,year:u.year};
 const done=e.bowlHubItems(me);
 assert.equal(done[0].kicker,'BOWL');
 assert.ok(done[0].main.includes('Liberty Bowl'));
});

test('fan support answers to results and decays back toward the program baseline',async()=>{
 const e=await setup(2505),u=e.universe;
 const t=u.teams[0];t.fan_support=60;t.fanBaseline=60;t.champ=false;t.bowlResult=null;
 const exp=e.seasonExpectation(t);
 t.w=exp+4;t.l=0;
 e.updateFanSupport(t);
 const up=t.fan_support;
 assert.ok(up>60,`winning big lifts the fanbase (${up})`);
 // A bad year pulls it back down, and repeated average years return it toward baseline.
 t.w=Math.max(0,exp-4);t.l=12-t.w;
 e.updateFanSupport(t);
 assert.ok(t.fan_support<up,'a bad year costs it');
 t.w=exp;t.l=12-exp;
 for(let i=0;i<12;i++)e.updateFanSupport(t);
 assert.ok(Math.abs(t.fan_support-60)<=2,`meeting expectations settles back at baseline (${t.fan_support})`);
});

test('home field is worth more at a full house than an empty one',async()=>{
 const e=await setup(2506),u=e.universe;
 const loud={fan_support:95},quiet={fan_support:20},mid={fan_support:60};
 assert.ok(e.homeFieldFor(loud)>e.homeFieldFor(mid));
 assert.ok(e.homeFieldFor(mid)>e.homeFieldFor(quiet));
 assert.equal(Math.round(e.homeFieldFor(mid)*10)/10,2.2,'an average fanbase keeps the old flat value');
 assert.ok(e.homeFieldFor(loud)<=3.4&&e.homeFieldFor(quiet)>=.8,'and it stays bounded');
});
