const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeCoachRivals}=require('../coach-rivals.js');
const {loadEngine}=require('../tools/harness.js');

function world(){
 const me={id:1,name:'Home U'},a={id:2,name:'Alpha'},b={id:3,name:'Beta'},c={id:4,name:'Gamma'};
 const coach=(id,name,schoolId,start,end=null)=>({id,name,careerHistory:[{role:'Head Coach',schoolId,startSeason:start,endSeason:end}]});
 const u={year:2034,phase:'regular',teams:[me,a,b,c],coachArchive:[],careerHistory:[],tenure:{school:'Home U',startYear:2027,closed:false},gameArchive:[]};
 // Stone coached Alpha through 2030, then moved to Beta; Reed took Alpha.
 a.staff={HC:{id:'C2',name:'Reed',careerHistory:[{role:'Head Coach',schoolId:2,startSeason:2031,endSeason:null}]}};
 b.staff={HC:{id:'C1',name:'Stone',careerHistory:[{role:'Head Coach',schoolId:2,startSeason:2027,endSeason:2030},{role:'Head Coach',schoolId:3,startSeason:2031,endSeason:null}]}};
 c.staff={HC:coach('C3','Hart',4,2027)};
 return{u,me,a,b,c,R:makeCoachRivals({getUniverse:()=>u})};
}
let n=0;
const game=(season,me,opp,us,them,home=true)=>({id:`G${season}_${++n}`,season,week:3,final:true,home:{id:(home?me:opp).id,name:(home?me:opp).name},away:{id:(home?opp:me).id,name:(home?opp:me).name},score:home?{home:us,away:them}:{home:them,away:us}});

test('a coach is followed by id across schools, and a nemesis takes three losses in three meetings or more',()=>{
 const {u,me,a,b,R}=world();
 R.record(game(2028,me,a,10,24),me,a);   // Stone at Alpha
 R.record(game(2029,me,a,17,20,false),me,a);
 R.record(game(2032,me,b,14,28),me,b);   // Stone at Beta
 assert.equal(R.series().length,1,'one coach, two schools');
 const s=R.against('C1');assert.equal(s.l,3);assert.equal(s.meetings,3);
 assert.equal(R.nemesis()?.name,'Stone');assert.equal(R.tag(s),'Nemesis');
 assert.deepEqual(s.streak,{kind:'L',count:3});
 R.record(game(2033,me,b,35,7),me,b);
 assert.equal(R.nemesis()?.name,'Stone','1-3 still has your number');
 R.record(game(2034,me,b,31,30),me,b);
 assert.equal(R.nemesis(),null,'2-3 is no longer a nemesis');
 assert.equal(R.series().length,1);assert.equal(u.coachRivals.rows.length,5);
});

test('a favourite opponent takes three wins and no more than a quarter lost; the same game is never counted twice',()=>{
 const {me,c,R}=world();
 const g1=game(2028,me,c,30,10);R.record(g1,me,c);R.record(game(2029,me,c,28,14),me,c);
 assert.equal(R.favourite(),null,'two meetings is not enough');
 R.record(game(2030,me,c,21,20),me,c);
 assert.equal(R.favourite()?.name,'Hart');assert.equal(R.tag(R.against('C3')),'Favourite opponent');
 // A rolled-back game played again replaces its row.
 R.record({...g1,score:{home:3,away:31}},me,c);
 assert.equal(R.against('C3').meetings,3);assert.equal(R.against('C3').l,1);
 assert.equal(R.favourite(),null,'2-1 loses a quarter-plus');
});

test('older saves are backfilled once from the game archive, using who was head coach that season',()=>{
 const {u,me,a,b,R}=world();
 u.careerHistory=[{school:'Other U',startYear:2025,endYear:2026}];
 u.gameArchive=[game(2028,me,a,10,24),game(2032,me,a,40,0),game(2032,me,b,7,21),{...game(2030,a,b,1,0)}];
 assert.equal(R.backfill(),true);
 assert.equal(R.against('C1').meetings,2,'Stone at Alpha in 2028 and at Beta in 2032');
 assert.equal(R.against('C2').meetings,1,'Reed took Alpha in 2031');
 assert.equal(u.coachRivals.rows.length,3,'other programs\' games are ignored');
 assert.equal(R.backfill(),false,'only once');
});

test('in the game, every coached game is recorded and older saves are backfilled',async()=>{
 const e=loadEngine({seed:4404,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;if(u.phase==='preseason')e.beginSeason();
 for(let i=0;i<4;i++)e.simWeek();
 const R=globalThis.DynastyCoachRivals||e.DynastyCoachRivals;
 const mine=u.gameArchive.filter(g=>g.home.name==='Chicago Metropolitan'||g.away.name==='Chicago Metropolitan');
 assert.ok(mine.length>=3);
 assert.equal(u.coachRivals.rows.length,mine.length,'one row per game the coach played');
 const rows=u.coachRivals.rows.map(r=>r[0]).sort();assert.deepEqual(rows,mine.map(g=>g.id).sort());
 // Drop the ledger: an older save rebuilds the same rows from the archive.
 const before=JSON.stringify(u.coachRivals.rows.map(r=>r.slice(0,4)).sort());
 delete u.coachRivals;R.clearCache();R.backfill();
 assert.equal(JSON.stringify(u.coachRivals.rows.map(r=>r.slice(0,4)).sort()),before);
});
