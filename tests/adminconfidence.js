const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const season=e=>{for(let i=0;i<12;i++)e.simWeek();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason()};

test('the board judges the player on the same scale it judges the AI',async()=>{
 const e=await setup(2201),u=e.universe,me=e.T('Chicago Metropolitan');
 // carousel() fires an AI coach when wins fall two short of clamp((prestige-30)/8,4,10).
 for(const t of u.teams)assert.equal(e.seasonExpectation(t),Math.max(4,Math.min(10,Math.round((t.prestige-30)/8))));
 assert.ok(Number.isFinite(me.adminConfidence),'every program starts with a seeded confidence');
 assert.ok(me.adminConfidence>=15&&me.adminConfidence<=95);
});

test('beating expectation buys confidence and missing it spends confidence',async()=>{
 const e=await setup(2202),u=e.universe,me=e.T('Chicago Metropolitan');
 const exp=e.seasonExpectation(me),start=me.adminConfidence;
 me.w=exp+3;me.l=12-me.w;
 const good=e.adminSeasonReview(me);
 assert.ok(good.delta>0,'beating the number is rewarded');
 assert.equal(good.after,Math.min(100,start+good.delta));
 assert.equal(good.expected,exp);
 me.adminConfidence=start;me.w=Math.max(0,exp-4);me.l=12-me.w;
 const bad=e.adminSeasonReview(me);
 assert.ok(bad.delta<0,'missing it is punished');
 assert.ok(me.mandate,'a struggling program is told what is expected next year');
 assert.equal(me.mandate.wins,exp);
});

test('an impatient administration moves faster than a patient one',async()=>{
 const e=await setup(2203),u=e.universe;
 const [a,b]=[u.teams[0],u.teams[1]];
 for(const t of [a,b]){t.prestige=70;e.ensureAdminState(t);t.adminConfidence=60;t.w=2;t.l=10;t.rivalry=null;t.champ=false}
 a.admin_patience=25;b.admin_patience=90;
 const impatient=e.adminSeasonReview(a),patient=e.adminSeasonReview(b);
 assert.ok(impatient.delta<patient.delta,
  `an impatient board punishes harder (${impatient.delta} vs ${patient.delta})`);
});

test('a real season records a review, an event and a tenure history',async()=>{
 const e=await setup(2204),u=e.universe,me=e.T('Chicago Metropolitan');
 season(e);
 assert.equal(u.tenure.seasons.length,1,'one review per season');
 const r=u.tenure.seasons[0];
 // The record includes the postseason, so a playoff run makes it longer than twelve.
 assert.ok(r.w+r.l>=12,`a full season is reviewed (${r.w}-${r.l})`);
 assert.equal(u.tenure.school,'Chicago Metropolitan');
 const ev=u.events.filter(x=>x.type==='ADMIN_REVIEW');
 assert.equal(ev.length,1,'and one ledger entry');
 assert.ok(ev[0].summary.includes('expected'));
 assert.ok(['Secure','Backed','Watched','Hot seat','Final warning'].includes(r.label));
});

test('the wire warns before the number becomes unreachable, never after the fact only',async()=>{
 const e=await setup(2205),u=e.universe,me=e.T('Chicago Metropolitan');
 const tiles=()=>(u.weeklyHub||[]).filter(x=>x.kicker==='ADMINISTRATION');
 for(let i=0;i<4;i++)e.simWeek();
 // Force a hopeless record: expectation cannot be reached with the games that remain.
 // Six losses with six to play puts eight wins arithmetically out of reach.
 const exp=e.seasonExpectation(me);me.w=0;me.l=6;me.adminConfidence=30;
 e.buildWeeklyHub(me.rank);
 const t=tiles();
 assert.equal(t.length,1,'the wire says so while the season is still running');
 assert.equal(t[0].importance,82);
 assert.ok(t[0].main.includes(String(exp)));
 assert.ok(u.weeklyHub.indexOf(t[0])<3,'and ranks it near the top');
 // A program comfortably ahead of the number is not nagged.
 me.w=exp+2;me.l=0;me.adminConfidence=85;
 e.buildWeeklyHub(me.rank);
 assert.equal(tiles().length,0,'a program meeting expectations hears nothing');
});
