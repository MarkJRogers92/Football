const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('every rivalry is mutual, in-conference and actually played',async()=>{
 const e=await setup(2101),u=e.universe;
 const withR=u.teams.filter(t=>t.rivalry);
 assert.ok(withR.length>=110,`nearly every team gets a rival (${withR.length}/${u.teams.length})`);
 // The few left over are a real property of the schedule, not a bug: the conference round-robin
 // plays eight of eleven opponents, so a straggler can have no unpaired team it actually meets.
 for(const t of u.teams.filter(x=>!x.rivalry)){
  const opps=new Set((t.schedule||[]).map(g=>g.home===t.name?g.away:g.home));
  const eligible=u.teams.filter(x=>x!==t&&x.conference===t.conference&&opps.has(x.name)&&!x.rivalry);
  assert.equal(eligible.length,0,`${t.name} is unpaired only because nothing eligible was left`);
 }
 for(const t of withR){
  const o=e.rivalOf(t);
  assert.ok(o,'the rival resolves to a real team');
  assert.equal(o.rivalry.rivalId,t.id,'rivalries point both ways');
  assert.equal(o.conference,t.conference,'rivals share a conference');
  assert.equal(o.rivalry.trophy,t.rivalry.trophy,'and share one trophy');
  assert.ok(e.rivalryGameFor(t),'the conference round-robin guarantees the meeting');
 }
});

test('the rivalry game settles once and moves the series both ways',async()=>{
 const e=await setup(2102),u=e.universe,me=e.T('Chicago Metropolitan'),o=e.rivalOf(me);
 assert.equal(me.rivalry.series.w+me.rivalry.series.l,0,'no history before anything is played');
 const before={fan:me.fan_support,ofan:o.fan_support};
 for(let i=0;i<12;i++)e.simWeek();
 const s=me.rivalry.series,os=o.rivalry.series;
 assert.equal(s.w+s.l,1,'exactly one meeting is recorded in a season');
 assert.equal(os.w+os.l,1);
 assert.equal(s.w,os.l,'one side wins it and the other loses it');
 assert.equal(s.lastYear,u.year);
 assert.equal(Math.abs(s.streak),1,'a first result starts a streak of one');
 const won=s.w===1;
 assert.equal(me.fan_support,before.fan+(won?2:-2),'the result moves fan support');
 assert.equal(o.fan_support,before.ofan+(won?-2:2));
 const ev=u.events.filter(x=>x.type==='RIVALRY_RESULT'&&x.schoolIds.includes(me.id));
 assert.equal(ev.length,1,'one ledger entry, written once');
 assert.equal(ev[0].importance,76);
 // Re-settling the same played game must not double-count.
 const g=e.rivalryGameFor(me);e.settleRivalryGame(g);
 assert.equal(me.rivalry.series.w+me.rivalry.series.l,1,'settling twice changes nothing');
});

test('the wire flags rivalry week and then the result',async()=>{
 const e=await setup(2103),u=e.universe,me=e.T('Chicago Metropolitan');
 const g=e.rivalryGameFor(me),kick=()=>(u.weeklyHub||[]).filter(x=>['RIVALRY WEEK','RIVALRY'].includes(x.kicker));
 while(u.week<g.week-1)e.simWeek();
 const pre=kick();
 assert.equal(pre.length,1,'the week before, the wire says it is coming');
 assert.equal(pre[0].kicker,'RIVALRY WEEK');
 assert.ok(pre[0].main.includes(me.rivalry.trophy),'and names the trophy');
 assert.ok(u.weeklyHub.indexOf(pre[0])<4,'ranked near the top of the wire');
 e.simWeek();
 const post=kick();
 assert.equal(post.length,1,'after it is played, the wire reports the result');
 assert.equal(post[0].kicker,'RIVALRY');
 assert.ok(post[0].importance>=70);
});
