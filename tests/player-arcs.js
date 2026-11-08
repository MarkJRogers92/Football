const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
const {makePlayerArcSystem}=require('../player-arcs.js');

const USER='Chicago Metropolitan';

test('a recruit the desk worked carries the story of how he was won',async()=>{
 const e=loadEngine({seed:5201,fullRuntime:true});
 e.setUserTeam(USER);await e.loadSchools();e.initUniverse();
 const A=globalThis.DynastyRecruitingActions,t=e.T(USER);
 const r=e.universe.recruits.filter(x=>!x.committed).sort((a,b)=>e.recruitPitch(t,b)-e.recruitPitch(t,a))[0];
 r.targeted=true;
 A.perform(r,t,'call');A.perform(r,t,'offer');
 const topic=A.pitchOptions(r,t)[0].topic;A.perform(r,t,'pitch',{topic});
 assert.equal(e.commitRecruit(r,USER),true);
 const d=r.recruitingMemory.desk;
 assert.ok(d,'the memory written at commit has a desk summary');
 assert.equal(d.hours,A.COSTS.call+A.COSTS.offer+A.COSTS.pitch);
 assert.equal(d.topic,topic);
 assert.equal(d.offerWeek,e.universe.week);
 // Another program's signee gets no desk summary.
 const other=e.universe.teams.find(x=>x.name!==USER);
 const r2=e.universe.recruits.find(x=>!x.committed&&!e.recruitBlocked(other,x));
 if(e.commitRecruit(r2,other.name))assert.equal(r2.recruitingMemory.desk,undefined);
});

function fakeUniverse(){
 const team={id:7,name:'Test U',roster:[]},rival={id:8,name:'Rival State',roster:[]};
 const mem=(season,stars,desk)=>({season,stars,schoolId:7,homeRegion:'Midwest',desk});
 const star={id:'a',name:'Al Star',pos:'WR',recruitingMemory:mem(2027,3,{hours:14,topic:'Development',inHome:true,beat:'Rival State'}),
  seasonHistory:[{year:2028,starts:12},{year:2029,starts:12}],career:{games:26},awards:[{year:2029,name:'All-American'}]};
 const bust={id:'b',name:'Bo Bust',pos:'QB',recruitingMemory:mem(2027,5),seasonHistory:[],career:{games:0},awards:[],transferHistory:[{fromSchool:'Test U',toSchool:'Rival State'}]};
 const mid={id:'c',name:'Cy Mid',pos:'OG',recruitingMemory:mem(2027,3),seasonHistory:[{year:2029,starts:7}],career:{games:12},awards:[]};
 const fresh={id:'d',name:'Di New',pos:'CB',recruitingMemory:mem(2029,4),seasonHistory:[],career:{games:0},awards:[]};
 team.roster.push(star,mid,fresh);rival.roster.push(bust);
 return {year:2029,teams:[team,rival],playerArchive:[],team,star,bust,mid,fresh};
}

test('a profile line tells how he was won, and what he became',()=>{
 const u=fakeUniverse(),arcs=makePlayerArcSystem({getUniverse:()=>u});
 assert.equal(arcs.signedLine(u.star),'Signed in 2027 as a ★★★ WR out of the Midwest with Test U. You won him over Rival State with an in-home visit and pitches on Development (14 hours).');
 assert.equal(arcs.signedLine({pos:'WR'}),null,'no memory, no line');
 assert.equal(arcs.peak(u.star).label,'All-American');
 assert.equal(arcs.peak(u.mid).label,'Starter, 1 season');
 assert.equal(arcs.peak(u.bust).label,'Did not play');
 assert.equal(arcs.peak({draftResult:{round:1}}).label,'First-round pick');
});

test('a class report counts starters, honors, transfers, steals and misses, and waits two years to grade',()=>{
 const u=fakeUniverse(),arcs=makePlayerArcSystem({getUniverse:()=>u});
 assert.deepEqual(arcs.classSeasons(u.team),[2029,2027]);
 const c=arcs.classReport(u.team,2027);
 assert.equal(c.count,3);
 assert.equal(c.stay,2);assert.equal(c.left,1);
 assert.equal(c.starters,2);assert.equal(c.honors,1);assert.equal(c.drafted,0);
 assert.deepEqual(c.steals.map(x=>x.name),['Al Star']);
 assert.equal(c.misses.length,0,'a transfer still on a roster is not written off');
 assert.equal(c.best.name,'Al Star');
 assert.equal(c.grade,null,'no grade without at least ten classes that year to compare against');
 assert.equal(arcs.classReport(u.team,2029).grade,null,'too early to grade a class that just arrived');
 assert.equal(arcs.classReport(u.team,2020),null);
});

test('this season\'s honors become payoff news that finish the recruiting story',()=>{
 const u=fakeUniverse(),arcs=makePlayerArcSystem({getUniverse:()=>u});
 const items=arcs.payoffs(u.team,2029);
 assert.equal(items.length,1);
 assert.equal(items[0].kicker,'PAYOFF');
 assert.equal(items[0].player,'a');
 assert.match(items[0].main,/Al Star: All-American/);
 assert.match(items[0].sub,/you beat Rival State for in 2027/);
 assert.deepEqual(arcs.payoffs(u.team,2028),[]);
});

test('the profile timeline opens with the arc in the full game',async()=>{
 const e=loadEngine({seed:5202,fullRuntime:true});
 e.setUserTeam(USER);await e.loadSchools();e.initUniverse();
 const p=e.T(USER).roster.find(x=>x.recruitingMemory?.season);
 if(!p)return;
 assert.match(e.careerChronologyHTML(p),/PLAYER ARC/);
});

test('a class is graded against the league\'s classes from the same year',()=>{
 const teams=[];
 for(let i=0;i<20;i++){
  const roster=[];
  for(let k=0;k<6;k++)roster.push({id:`p${i}-${k}`,name:`P ${i} ${k}`,pos:'LB',recruitingMemory:{season:2026,stars:3,schoolId:i},
   seasonHistory:k<Math.floor(i/3)?[{year:2027,starts:10}]:[],career:{games:k<Math.floor(i/3)?10:0},awards:i===19&&k===0?[{year:2028,name:'All-Conference'}]:[]});
  teams.push({id:i,name:`Team ${i}`,roster});
 }
 const u={year:2029,teams,playerArchive:[]},arcs=makePlayerArcSystem({getUniverse:()=>u});
 assert.equal(arcs.classReport(teams[19],2026).grade,'A');
 assert.equal(arcs.classReport(teams[0],2026).grade,'F');
 const mid=arcs.classReport(teams[9],2026);
 assert.ok(['B','C','D'].includes(mid.grade));
 assert.equal(mid.classes,20);
});
