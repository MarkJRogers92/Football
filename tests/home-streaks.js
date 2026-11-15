const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeHomeStreaks}=require('../home-streaks.js');
const {loadEngine}=require('../tools/harness.js');

let n=0;const g=(home,away,hs,as,o={})=>({id:`G${++n}`,season:2030,venue:'Home stadium',home:{id:home},away:{id:away},score:{home:hs,away:as},...o});

test('a home win extends the run, a home loss ends it; road and neutral games do not count',()=>{
 const u={};const S=makeHomeStreaks({getUniverse:()=>u});
 S.record(g(1,2,20,10));S.record(g(1,3,30,10));S.record(g(2,1,10,30));S.record(g(1,4,7,3,{venue:'Neutral site'}));
 assert.equal(S.of(1).streak,2,'the road win and the neutral game leave the home run alone');
 assert.equal(S.of(2).streak,0);
 const r=S.record(g(1,5,10,20));assert.deepEqual({before:r.before,after:r.after,won:r.won},{before:2,after:0,won:false});
 assert.equal(S.of(1).best,2);assert.equal(S.of(1).bestEnded,2030);
 assert.equal(S.nameFor(4),null);assert.equal(S.nameFor(5),'Home cooking');assert.equal(S.nameFor(12),'The Fortress');assert.equal(S.nameFor(20),'Untouchable');
 assert.equal(S.line(10,'you have'),'The Fortress: you have 10 straight home wins');
});

test('in the game, every home result is counted for every program, and reaching ten is news',async()=>{
 const e=loadEngine({seed:5353,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan'),S=globalThis.DynastyHomeStreaks||e.DynastyHomeStreaks;
 if(u.phase==='preseason')e.beginSeason();
 const g0=u.schedule[u.week].find(x=>x.home===t.name||x.away===t.name);
 e.simWeek();
 const games=u.schedule[u.week-1];
 for(const x of games){const home=e.T(x.home),s=S.of(home.id);assert.equal(s.streak,x.winner===x.home?1:0,`${x.home} after week one`)}
 // A program at nine straight that wins at home reaches ten: the Wire reports it.
 while(!u.schedule[u.week].some(x=>x.home===t.name))e.simWeek();
 S.of(t.id).streak=9;for(const p of t.roster)Object.assign(p,{trueNow:99,speed:99,power:99,technique:99,iq:99});
 e.simWeek();
 const played=u.schedule[u.week-1].find(x=>x.home===t.name);
 assert.equal(played.winner,t.name,'the loaded roster wins at home');
 const ev=u.events.filter(x=>x.type==='HOME_STREAK');assert.equal(ev.length,1);assert.match(ev[0].summary,/won 10 straight at home \(The Fortress\)/);
 const wire=require('../dynasty-world-news.js').items(u,t);assert.ok(wire.some(w=>w.kicker==='HOME STREAK'),'it reaches The Wire');
 assert.ok(g0);
});
