const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeSeniorDay}=require('../senior-day.js');
const {loadEngine}=require('../tools/harness.js');

const base=p=>p.eligibilityUsed;
function world(){
 const t={name:'Home U',roster:[]};
 const p=(id,used,o={})=>({id,name:`P${id}`,pos:'RB',eligibilityUsed:used,career:{},stats:{},awards:[],...o});
 t.roster=[p(1,3,{career:{starts:20,games:30,rushYds:2100,rushTD:18},stats:{starts:5,games:5,rushYds:400,rushTD:4},awards:[{name:'All-Conference'}]}),p(2,3,{career:{games:12},stats:{games:4}}),p(3,2),p(4,3,{redshirtActive:true}),p(5,4)];
 const sched=Array.from({length:12},(_,i)=>[{home:i%2?'Home U':'Away '+i,away:i%2?'Away '+i:'Home U',played:false}]);
 const u={year:2030,week:0,phase:'regular',schedule:sched};
 return{t,u,S:makeSeniorDay({getUniverse:()=>u,eligibilityBase:base,eligibilityLabel:()=>'SR'})};
}

test('Senior Day is the last regular-season home game, and only the coming week shows it',()=>{
 const {t,u,S}=world();
 assert.equal(S.seniorWeek(t),12);
 u.week=10;assert.equal(S.upcoming(t),null,'two weeks out');
 u.week=11;const up=S.upcoming(t);assert.equal(up.week,12);assert.equal(up.opponent,'Away 11');
 u.phase='confReady';assert.equal(S.upcoming(t),null,'not after the regular season');
});

test('seniors are players in their last season, ordered by what they gave, with one career line each',()=>{
 const {t,S}=world(),list=S.seniors(t);
 assert.deepEqual(list.map(s=>s.id),[1,2],'juniors, players redshirting this season and exhausted players are left out');
 assert.equal(list[0].starts,25,'career plus this season');
 assert.match(list[0].best,/2,500 rushing yards, 22 TD/);
 assert.equal(list[0].honour,'All-Conference');
 assert.equal(list[1].starts,0);assert.equal(list[1].games,16);
});

test('in the game, This Week shows the seniors before the last home game and writes nothing',async()=>{
 const e=loadEngine({seed:5150,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;if(u.phase==='preseason')e.beginSeason();
 const S=globalThis.DynastySeniorDay||e.DynastySeniorDay,t=e.T('Chicago Metropolitan'),week=S.seniorWeek(t);
 assert.ok(week>=6&&week<=12,`a late home game (week ${week})`);
 while(u.week<week-1)e.simWeek();
 const before=JSON.stringify(u).length,up=S.upcoming(t);
 assert.ok(up&&up.seniors.length>0,'the roster has seniors');
 assert.ok(up.seniors.every(s=>t.roster.find(p=>p.id===s.id).eligibilityUsed===3));
 assert.equal(JSON.stringify(u).length,before,'reading Senior Day stores nothing');
 e.simWeek();assert.equal(S.upcoming(t),null,'gone once the game is played');
});
