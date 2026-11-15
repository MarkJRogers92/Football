const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeWeekStakes}=require('../week-stakes.js');
const {loadEngine}=require('../tools/harness.js');

function world(){
 const me={id:1,name:'Home U',rank:8,w:4,l:0,rivalry:{rivalId:4}},opp={id:2,name:'Sleepy U',rank:40,w:3,l:2},big={id:3,name:'Big U',rank:5,w:4,l:0},rival={id:4,name:'Rival U',rank:60,w:1,l:4},weak={id:5,name:'Weak U',rank:90,w:1,l:4};
 const u={phase:'regular',week:4,teams:[me,opp,big,rival,weak],gameArchive:[],schedule:Array.from({length:12},()=>[])};
 u.schedule[4]=[{home:'Home U',away:'Sleepy U',played:false}];
 return{u,me,opp,big,rival,weak,S:makeWeekStakes({getUniverse:()=>u})};
}

test('a trap game is an unranked .500 opponent right before a big game or right after a top-10 win',()=>{
 const {u,me,opp,S}=world();
 assert.equal(S.trap(me),null,'no big game around it');
 u.schedule[5]=[{home:'Big U',away:'Home U'}];
 const t=S.trap(me);assert.equal(t.opp.name,'Sleepy U');assert.deepEqual(t.lookahead,{name:'Big U',rank:5,rival:false});
 u.schedule[5]=[{home:'Home U',away:'Rival U'}];assert.equal(S.trap(me).lookahead.rival,true,'the rival next week counts at any ranking');
 u.schedule[5]=[];u.schedule[3]=[{home:'Big U',away:'Home U',played:true,winner:'Home U',gameId:'G1'}];
 u.gameArchive=[{id:'G1',home:{id:3,name:'Big U',rank:4},away:{id:1,name:'Home U',rank:12},score:{home:10,away:20}}];
 assert.deepEqual(S.trap(me).letdown,{name:'Big U',rank:4},'rank at kickoff, from the game record');
 opp.l=4;assert.equal(S.trap(me),null,'a losing opponent is no trap');opp.l=2;
 opp.rank=20;assert.equal(S.trap(me),null,'a ranked opponent is no trap');opp.rank=40;
 me.rank=30;assert.equal(S.trap(me),null,'only a ranked team falls in a trap');
});

test('a statement win is beating a top-10 team while unranked or ten places lower, recorded once',()=>{
 const {u,me,S}=world();
 const rec=(myRank,oppRank,us,them)=>({id:`G_${myRank}_${oppRank}_${us}`,season:2030,label:'Regular season',home:{id:1,name:'Home U',rank:myRank},away:{id:3,name:'Big U',rank:oppRank},score:{home:us,away:them}});
 assert.ok(S.statement(rec(40,3,24,21),me));assert.ok(S.statement(rec(18,6,24,21),me));
 assert.equal(S.statement(rec(9,3,24,21),me),null,'a close ranking is no statement');
 assert.equal(S.statement(rec(40,12,24,21),me),null,'outside the top 10');
 assert.equal(S.statement(rec(40,3,21,24),me),null,'a loss');
 const e=S.recordStatement(rec(40,3,24,21),me);
 assert.equal(e.summary,'Statement win: Unranked Home U beat #3 Big U 24–21.');assert.equal(e.type,'STATEMENT_WIN');
 assert.equal(S.recordStatement(rec(40,3,24,21),me),null,'once');assert.equal(u.events.length,1);
});

test('in the game, a statement win from a played week reaches The Wire',async()=>{
 const e=loadEngine({seed:2121,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;if(u.phase==='preseason')e.beginSeason();
 const t=e.T('Chicago Metropolitan');
 // Make this week's opponent a top-10 team on paper and this program unranked, then play the week.
 const g=u.schedule[u.week].find(x=>x.home===t.name||x.away===t.name),opp=e.T(g.home===t.name?g.away:g.home);
 for(const p of t.roster)Object.assign(p,{trueNow:Math.min(99,p.trueNow+25)});
 t.rank=60;opp.rank=2;
 e.simWeek();
 const rec=u.gameArchive.find(x=>x.id===u.schedule[u.week-1].find(y=>y.home===t.name||y.away===t.name).gameId);
 const S=globalThis.DynastyWeekStakes||e.DynastyWeekStakes,expected=S.statement(rec,t);
 const ev=(u.events||[]).filter(x=>x.type==='STATEMENT_WIN');
 assert.ok(expected,'this seed\'s upset qualifies');assert.equal(ev.length,1,'recorded once');
 const wire=require('../dynasty-world-news.js').items(u,t);assert.ok(wire.some(w=>w.kicker==='STATEMENT WIN'),'it reaches The Wire');
});
