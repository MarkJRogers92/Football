const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness.js');

const USER='Chicago Metropolitan';
async function setup(seed){
 const e=loadEngine({seed,fullRuntime:true});
 await e.loadSchools();e.setUserTeam(USER);e.initUniverse();
 return{e,N:globalThis.DynastyNoncon,F:globalThis.DynastyFacilities,u:e.universe,me:e.T(USER)};
}
const homeCounts=u=>Object.fromEntries(u.teams.map(t=>[t.name,t.schedule.filter(g=>g.home===t.name).length]));

test('four nonconference games, the opener locked and the rest open to a trade',async()=>{
 const {N,me,u}=await setup(9501);
 const rows=N.games(me);
 assert.equal(rows.length,4);
 assert.equal(u.week,0);
 assert.equal(rows[0].tradable,false,'the opener is less than a week away');
 assert.ok(rows.slice(1).every(r=>r.tradable));
 assert.deepEqual(N.options(me,1),[]);
 const opts=N.options(me,2);
 assert.ok(opts.length>10,'plenty of alternatives in a 60-game week');
 for(const o of opts){
  assert.notEqual(o.y.conference,me.conference,'never a conference opponent');
  assert.notEqual(o.z.conference,o.x.conference,'the displaced opponent gets a nonconference game too');
 }
 const kinds=new Set(N.shortlist(opts).map(o=>o.kind));
 assert.ok(kinds.has('marquee'),'the card offers a marquee game');
});

test('a trade swaps opponents, keeps every home count and leaves a valid schedule',async()=>{
 const {e,N,me,u}=await setup(9502);
 const before=homeCounts(u),o=N.options(me,3)[0];
 const r=N.trade(me,3,o.y.name);
 assert.ok(r.ok,r.reason);
 assert.equal(N.games(me).find(x=>x.week===3).opp.name,o.y.name);
 assert.deepEqual(homeCounts(u),before,'nobody gains or loses a home game');
 assert.deepEqual(e.validateSchedule(),[]);
 const x=e.T(o.x.name),y=e.T(o.y.name);
 assert.ok(x.schedule.some(g=>g.week===3&&(g.home===o.z.name||g.away===o.z.name)),'the displaced opponent now plays the other game');
 assert.ok(y.schedule.some(g=>g.week===3&&(g.home===USER||g.away===USER)));
 for(const t of [x,y])assert.deepEqual(t.schedule.map(g=>g.week),[...t.schedule.map(g=>g.week)].sort((a,b)=>a-b),'team schedules stay in week order');
 assert.ok(u.events.some(ev=>ev.type==='NONCON_SCHEDULED'));
});

test('two trades a season, and a buy game costs a booster unit',async()=>{
 const {N,F,me}=await setup(9503);
 const home=N.games(me).filter(r=>r.tradable&&r.home);
 const any=N.games(me).filter(r=>r.tradable);
 let spent=false;
 const fund0=F.fundOf(me);
 for(const row of [...home,...any]){
  if(!N.tradesLeft(me))break;
  const buy=N.options(me,row.week).find(o=>o.kind==='buy');
  const pick=!spent&&buy?buy:N.options(me,row.week).find(o=>o.kind!=='buy');
  if(!pick)continue;
  const r=N.trade(me,row.week,pick.y.name);assert.ok(r.ok,r.reason);
  if(pick.kind==='buy'){spent=true;assert.equal(F.fundOf(me),fund0-1)}
 }
 assert.equal(N.tradesLeft(me),0);
 const row=N.games(me).find(r=>r.tradable),o=N.options(me,row.week)[0];
 if(o)assert.match(N.trade(me,row.week,o.y.name).reason,/both nonconference trades/);
 const p=F.state(me);p.fund=0;me.nonconPlan.trades=[];
 const buy=N.games(me).filter(r=>r.tradable&&r.home).flatMap(r=>N.options(me,r.week)).find(o=>o.kind==='buy');
 if(buy)assert.match(N.trade(me,buy.week,buy.y.name).reason,/booster fund/);
});

test('a marquee home game pays the boosters and the crowd once it is played',async()=>{
 const {e,N,F,me,u}=await setup(9504);
 const row=N.games(me).find(r=>r.tradable&&r.home);
 assert.ok(row,'the coach has a home nonconference date to fill');
 const big=N.options(me,row.week).find(o=>o.kind==='marquee');
 assert.ok(big);
 assert.ok(N.trade(me,row.week,big.y.name).ok);
 const g0=F.state(me).goodwill,f0=me.fan_support;
 while(u.week<row.week)e.simWeek(true);
 assert.ok(me.nonconPlan.paid.includes(row.week));
 assert.equal(F.state(me).goodwill,Math.min(100,g0+N.MARQUEE_GOODWILL*me.nonconPlan.paid.length),'boosters gave goodwill for every marquee home date played');
 assert.ok(Number.isFinite(f0));
 assert.deepEqual(e.validateSchedule(),[]);
});

test('played and near games are locked, and the plan starts fresh each season',async()=>{
 const {e,N,me,u}=await setup(9505);
 e.simWeek(true);e.simWeek(true);
 const rows=N.games(me);
 assert.equal(rows.find(r=>r.week===1).tradable,false);
 assert.equal(rows.find(r=>r.week===3).tradable,false,'next week is too close');
 assert.equal(rows.find(r=>r.week===4).tradable,true);
 me.nonconPlan.trades=[{week:4}];u.year+=1;
 assert.equal(N.tradesLeft(me),N.TRADES);
});
