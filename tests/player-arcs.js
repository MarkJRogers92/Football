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

test('class outcomes count current and closed seasons once and separate playing, starting, and honors',()=>{
 const u=fakeUniverse(),A=makePlayerArcSystem({getUniverse:()=>u}),t=u.team;
 const signed=(id,extra)=>({id,name:id,pos:'LB',recruitingMemory:{schoolId:t.id,season:2027,stars:4},...extra});
 t.roster=[signed('fresh starter',{stats:{games:7,starts:7}}),signed('closed season',{stats:{games:7,starts:7},seasonHistory:[{year:u.year,games:7,starts:7}]}),
  signed('trophy',{awards:[{name:'Lineman of the Year'}]})];
 u.teams[1].roster=[];
 const contributor=signed('rotation',{retiredYear:u.year-1,career:{games:12,starts:4},stats:{games:12,starts:4}});
 u.playerArchive=[contributor,signed('never played',{})];
 const report=A.classReport(t,2027);
 assert.equal(A.peak(t.roster[0]).label,'Starter, 1 season');assert.equal(A.peak(t.roster[1]).label,'Starter, 1 season');
 assert.equal(A.peak(contributor).label,'Contributor');assert.equal(A.peak(t.roster[2]).label,'Lineman of the Year');
 assert.equal(report.starters,2);assert.equal(report.honors,1);assert.equal(report.score,7/5);
 assert.deepEqual(report.misses.map(p=>p.name),['never played']);
});

test('classes retain pending portal and draft careers across departures without duplicate alumni',()=>{
 const u=fakeUniverse(),A=makePlayerArcSystem({getUniverse:()=>u}),t=u.team;
 t.roster=[];u.teams[1].roster=[];
 u.transferPortal=[{p:u.bust}];u.offseason={reports:{departures:{draftPool:[{p:u.star}]}}};
 const before=A.classReport(t,2027);assert.equal(before.count,2);assert.equal(before.stay,0);assert.equal(before.misses.length,0);
 u.playerArchive.push({...u.star,draftResult:{round:2}});
 const after=A.classReport(t,2027);assert.equal(after.count,2);assert.equal(after.drafted,1);
});

test('league grades share ties and reflect new starts even in the same week and archive length',()=>{
 const u={year:2029,teams:[],playerArchive:[]},A=makePlayerArcSystem({getUniverse:()=>u});
 for(let i=0;i<10;i++)u.teams.push({id:i,roster:Array.from({length:5},(_,j)=>({id:i+'-'+j,recruitingMemory:{schoolId:i,season:2027},stats:{}}))});
 const t=u.teams[0];assert.equal(A.classReport(t,2027).percentile,50);
 t.roster[0].stats={games:6,starts:6};
 assert.equal(A.classReport(t,2027).percentile,100);assert.equal(A.classReport(u.teams[1],2027).percentile,44);
 t.roster.pop();assert.equal(A.classReport(t,2027).grade,null);
});

test('only a recorded first college start earns a callback in quick and detailed finals',async()=>{
 for(const detailed of [false,true]){
  const e=loadEngine({seed:5204,fullRuntime:true});e.setUserTeam(USER);await e.loadSchools();e.initUniverse();
  const u=e.universe,t=e.T(USER),qb=e.roleStarter(t,'QB1'),m={schoolId:t.id,season:u.year-1,stars:3,desk:{beat:'Rival State',hours:14}};
  qb.recruitingMemory=m;
  const first=e.findUserGame();if(detailed){e.delegateWeeklyDecisions(t);e.simulateUserDetailed()}else e.simWeek(true);
  const game=u.gameArchive.find(g=>g.id===first.gameId),side=game.home.id===t.id?'home':'away';
  assert.equal(game.playerStats[side].find(p=>p.id===qb.id).stats.starts,1);
  assert.equal(game.firstStart.playerId,qb.id);assert.match(e.gameRecap(game).body,/first college start.*over Rival State/);
  assert.deepEqual(first.firstStart,game.firstStart);
  const snapshot=JSON.stringify(game.firstStart);e.gameRecap(game);assert.equal(JSON.stringify(game.firstStart),snapshot);
  if(detailed)e.simWeek(true);e.simWeek(true);
  assert.equal(u.gameArchive.find(g=>g.week===2&&(g.home.id===t.id||g.away.id===t.id)).firstStart,undefined);
  assert.equal(globalThis.DynastyPlayerArcs.firstStart(t,[{id:qb.id,stats:{games:1}}]),null);
  qb.stats.starts=1;qb.career.starts=1;assert.equal(globalThis.DynastyPlayerArcs.firstStart(t,[{id:qb.id,stats:{starts:1}}]),null);
 }
});

test('Program waits for archived classes and ignores a late response after a dynasty switch',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),u=fakeUniverse();
 let deferred=true,finish,html='',selected=u.team;
 const host={insertAdjacentHTML(_where,value){html=value}};
 const ctx={universe:u,activeTab:'program',selected:()=>selected,captureRecruitment(){},careerChronologyHTML(){},renderProgram(){},
  attachPlayerLinks(){},archiveIsDeferred:()=>deferred,ensureArchiveLoaded:()=>new Promise(resolve=>{finish=resolve}),
  $:id=>id==='#programHistory'?{closest:()=>host}:{remove(){html=''}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../player-arcs.js'),'utf8'),ctx);
 ctx.renderProgram();assert.match(html,/Loading/);
 const oldLoad=finish;ctx.universe={year:u.year,teams:[{id:42,name:'New',roster:[]}],playerArchive:[]};selected=ctx.universe.teams[0];
 ctx.renderProgram();oldLoad();await new Promise(resolve=>setImmediate(resolve));assert.match(html,/Loading/);
 ctx.universe.playerArchive.push({id:'alum',name:'Archived Name',pos:'WR',career:{games:2},recruitingMemory:{schoolId:42,season:2027,stars:3}});
 deferred=false;finish();await new Promise(resolve=>setImmediate(resolve));
 assert.match(html,/Archived Name/);assert.doesNotMatch(html,/Al Star|Loading/);
});

test('a browser checkpoint preserves the recruiting receipt and the archived class',async()=>{
 const {IDBFactory}=require('fake-indexeddb');
 const e=loadEngine({seed:5210,fullRuntime:true,indexedDB:new IDBFactory()});
 e.setUserTeam(USER);await e.loadSchools();e.initUniverse();
 const t=e.T(USER),year=e.universe.year,qb=e.roleStarter(t,'QB1'),alum=t.roster.pop(),A=globalThis.DynastyPlayerArcs;
 qb.recruitingMemory={season:year-1,schoolId:t.id,stars:3};
 alum.recruitingMemory={season:year-4,schoolId:t.id,stars:4};
 alum.stats.games=12;alum.stats.starts=4;e.archivePlayerSeason(alum,t,year-1);e.addToArchive(alum,t,'Graduated');e.rebuildIndexes();
 const before=A.classReport(t,year-4);
 const scheduled=e.findUserGame();e.simWeek(true);const receipt=scheduled.firstStart;
 assert.equal(receipt.playerId,qb.id);await e.saveBrowser();await e.loadBrowser();
 assert.equal(e.archiveIsDeferred(),true);assert.equal(e.gamesAreDeferred(),true);
 assert.deepEqual(e.T(USER).schedule.find(g=>g.gameId===scheduled.gameId).firstStart,receipt);
 await e.ensureArchiveLoaded();assert.deepEqual(A.classReport(e.T(USER),year-4),before);
 await e.ensureGamesLoaded();const game=e.universe.gameArchive.find(g=>g.id===scheduled.gameId);
 assert.deepEqual(game.firstStart,receipt);assert.match(e.gameRecap(game).body,/first college start/);
});
