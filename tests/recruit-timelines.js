const test=require('node:test');
const assert=require('node:assert/strict');
const {makeRecruitingActionSystem}=require('../recruiting-actions');
function setup(){
 const u={year:2027,week:0,phase:'regular',rng:{seed:4},recruits:[]},t={id:1,name:'User'};
 let capacity=true;
 let ranks=[{name:'A',score:90},{name:'B',score:84},{name:'C',score:80},{name:'D',score:75},{name:'E',score:70},{name:'F',score:65},{name:'User',score:40}];
 const api=makeRecruitingActionSystem({getUniverse:()=>u,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),priorities:['Prestige','NIL'],rankTeams:()=>ranks,canTake:()=>capacity,commit:(r,name)=>{r.committed=name;return true}});
 const r=id=>({id,name:id,stars:3,priority:'Prestige',relationship:10,interest:30,targeted:false,committed:null});
 return{u,t,api,r,setRanks:x=>ranks=x,setCapacity:x=>capacity=x};
}
test('private timeline status is pure and never returns a hidden countdown',()=>{
 const {api,t,r}=setup(),p=r('private');const before=JSON.stringify(p);
 const f=api.funnelStatus(p,t);
 for(const key of ['decisionWeek','weeksLeft','cutWeeks','readiness','threshold'])assert.equal(key in f,false,key);
 assert.equal(f.announcedWeek,null);assert.equal(typeof f.clue,'string');assert.equal(JSON.stringify(p),before);
});
test('all prospects use the same timing whether targeted or not',()=>{
 const a=setup(),b=setup(),ra=a.r('same'),rb=b.r('same');rb.targeted=true;
 for(let w=1;w<=12;w++){
  a.u.week=b.u.week=w;a.api.runFunnel([ra],a.t);b.api.runFunnel([rb],b.t);
  assert.equal(ra.committed,rb.committed);assert.equal(ra.funnel?.readiness,rb.funnel?.readiness);
  assert.equal(a.api.holds(ra,a.t),b.api.holds(rb,b.t));
 }
 assert.ok(ra.committed);
});
test('a repeat pass or a save roundtrip does not advance or reroll a timeline',()=>{
 const {api,u,t,r}=setup(),p=r('save');u.week=6;api.runFunnel([p],t);
 const before=JSON.stringify(p);api.runFunnel([p],t);assert.equal(JSON.stringify(p),before);
 const restored=JSON.parse(before);u.week=7;api.runFunnel([p],t);api.runFunnel([restored],t);assert.deepEqual(restored,p);
});
test('strong relationships reveal context without exposing a private week',()=>{
 const {api,u,t,r}=setup(),p=r('intel');u.week=5;api.runFunnel([p],t);
 const distant=api.funnelStatus(p,t);p.relationship=85;const close=api.funnelStatus(p,t);
 assert.equal(distant.detail,null);assert.equal(typeof close.detail,'string');assert.equal(close.announcedWeek,null);
 assert.equal('decisionWeek' in close,false);
});
test('legacy deadlines migrate without becoming public announcements or losing lists',()=>{
 const {api,u,t,r}=setup(),p=r('legacy');u.week=6;u.recruitingActions={migrated:true};
 p.funnel={season:2027,decisionWeek:6,top5:['A','B','C','D','E'],top3:null,cut:{week:3,at:'top5'},decided:null};
 api.runFunnel([p],t);
 assert.equal(p.funnel.version,2);assert.equal(p.funnel.decisionWeek,undefined);assert.deepEqual(p.funnel.cut,{week:3,at:'top5'});
 assert.equal(api.funnelStatus(p,t).announcedWeek,null);assert.equal(api.funnelOn(),true);
});
test('public announcements are a minority, and every postponement has an explanation',()=>{
 const {api,u,t,r}=setup(),pool=Array.from({length:400},(_,i)=>r('sample'+i)),announced=new Set(),delays=new Set();
 for(let w=1;w<=12;w++){u.week=w;api.runFunnel(pool,t);for(const p of pool){if(p.funnel?.announcement)announced.add(p.id);if(p.funnel?.announcement?.reason){delays.add(p.id);assert.equal(p.funnel.announcement.postponed,true)}}}
 assert.ok(announced.size>=35&&announced.size<150,announced.size);assert.ok(delays.size>0);assert.ok(delays.size<announced.size*.35,`only occasional announced dates move (${delays.size}/${announced.size})`);
});
test('reopened commitments can choose again and completed commitments are untouched',()=>{
 const {api,u,t,r}=setup(),p=r('reopened');u.week=12;api.runFunnel([p],t);assert.ok(p.committed);
 const snapshot=JSON.stringify(p);u.week++;api.runFunnel([p],t);assert.equal(JSON.stringify(p),snapshot);
 p.committed=null;u.week++;api.runFunnel([p],t);assert.equal(p.committed,null,'he can hear from schools after reopening');
 for(let i=0;i<4&&!p.committed;i++){u.week++;api.runFunnel([p],t)}assert.ok(p.committed);
});

test('only completed visits help readiness and repeating the pass cannot farm progress',()=>{
 const a=setup(),b=setup(),c=setup(),plain=a.r('visits'),scheduled=b.r('visits'),visited=c.r('visits');
 scheduled.visitWeek=10;visited.visitWeek=5;
 a.u.week=b.u.week=c.u.week=5;
 a.api.runFunnel([plain],a.t);b.api.runFunnel([scheduled],b.t);c.api.runFunnel([visited],c.t);
 assert.equal(plain.funnel.readiness,scheduled.funnel.readiness);
 assert.ok(visited.funnel.readiness>plain.funnel.readiness);
 const score=visited.funnel.readiness;c.api.runFunnel([visited],c.t);assert.equal(visited.funnel.readiness,score);
});
test('fit and competing offers change readiness without a random draw',()=>{
 const a=setup(),b=setup(),ra=a.r('fit'),rb=b.r('fit');
 b.setRanks([{name:'A',score:110},{name:'B',score:75}]);a.u.week=b.u.week=7;
 const old=Math.random;Math.random=()=>{throw Error('timeline consumed randomness')};
 try{a.api.runFunnel([ra],a.t);b.api.runFunnel([rb],b.t)}finally{Math.random=old}
 assert.ok(rb.funnel.readiness>ra.funnel.readiness);
});
test('midseason migration staggers decisions without deleting existing choices or offers',()=>{
 const {u,api,t,r}=setup();u.week=10;u.recruitingActions={timelineMigrationWeek:10,timelineMigrationYear:2027};const pool=Array.from({length:120},(_,i)=>r('migrate'+i));
 api.runFunnel(pool,t);assert.equal(pool.filter(p=>p.committed).length,0);
 for(let w=11;w<=16;w++){u.week=w;api.runFunnel(pool,t)}
 assert.ok(pool.some(p=>p.committed));
});
test('legacy migration pause applies only to the class that was loaded',()=>{
 const a=setup(),b=setup(),ra=a.r('newclass'),rb=b.r('newclass');
 a.u.year=b.u.year=2028;a.u.recruitingActions={timelineMigrationWeek:10,timelineMigrationYear:2027};
 for(let w=1;w<=12;w++){a.u.week=b.u.week=w;a.api.runFunnel([ra],a.t);b.api.runFunnel([rb],b.t);assert.equal(ra.committed,rb.committed)}
});
test('a due public announcement cannot silently remain in the past',()=>{
 const {api,u,t,r}=setup(),p=r('due');u.week=5;
 p.funnel={version:2,season:2027,readiness:0,lastWeek:null,top5:null,top3:null,cut:null,decided:null,announcement:{week:5,announcedAt:3,postponed:false,reason:null,leader:'A'}};
 api.runFunnel([p],t);assert.ok(p.committed||p.funnel.announcement.week>5||p.funnel.announcement.week===null);
 assert.ok(p.funnel.announcement.reason);
});
test('a reopened legacy commitment cannot choose again in the same advance',()=>{
 const {api,u,t,r}=setup(),p=r('legacy-reopen');u.week=14;
 u.decommitLog=[{id:p.id,year:2027,week:14,from:'A',to:null}];
 api.runFunnel([p],t);assert.equal(p.committed,null);
});
test('an almost-ready public recruit postpones rather than silently misses his date',()=>{
 const {api,u,t,r,setRanks}=setup(),p=r('sample4');setRanks([{name:'A',score:90},{name:'B',score:72}]);
 for(let w=1;w<=7;w++){u.week=w;api.runFunnel([p],t)}
 assert.ok(p.committed||p.funnel.announcement.week>7||p.funnel.announcement.week===null);
});
test('a completed visit remains experience even when its old appointment is cleared',()=>{
 const a=setup(),b=setup(),ra=a.r('visit-memory'),rb=b.r('visit-memory');ra.visitWeek=rb.visitWeek=5;
 a.u.week=b.u.week=5;a.api.runFunnel([ra],a.t);b.api.runFunnel([rb],b.t);
 ra.visitWeek=null;a.u.week=b.u.week=6;a.api.runFunnel([ra],a.t);b.api.runFunnel([rb],b.t);
 assert.equal(ra.funnel.readiness,rb.funnel.readiness);
});

test('lost scholarship options withdraw the date and can be reconsidered next week',()=>{
 const {api,u,t,r,setCapacity}=setup(),p=r('capacity');u.week=20;setCapacity(false);
 p.funnel={version:2,season:2027,readiness:0,lastWeek:null,top5:null,top3:null,cut:null,decided:null,announcement:{week:20,announcedAt:18,postponed:true,reason:'Prior delay',leader:'A'}};
 api.runFunnel([p],t);assert.equal(p.committed,null);assert.equal(p.funnel.announcement.week,null);assert.match(p.funnel.announcement.reason,/scholarship/);
 setCapacity(true);u.week++;api.runFunnel([p],t);assert.ok(p.committed);
});
test('real engine ranking stays target-neutral and does not draw randomness during timeline evaluation',async()=>{
 const {loadEngine}=require('../tools/harness'),e=loadEngine({seed:9461,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const A=global.DynastyRecruitingActions,t=e.T('Chicago Metropolitan');e.universe.week=4;
 const a=JSON.parse(JSON.stringify(e.universe.recruits[0])),b=JSON.parse(JSON.stringify(a));a.targeted=false;b.targeted=true;
 const before=JSON.stringify(e.syncGameplayRng());A.runFunnel([a],t);A.runFunnel([b],t);
 assert.equal(a.funnel.readiness,b.funnel.readiness);assert.deepEqual(a.funnel.top5,b.funnel.top5);assert.equal(JSON.stringify(e.syncGameplayRng()),before);
});
