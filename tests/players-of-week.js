const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makePlayersOfWeek}=require('../players-of-week.js');
const {loadEngine}=require('../tools/harness.js');

const game=(id,hs,as,home,away)=>({id,season:2030,week:3,label:'Regular season',home:{id:1,name:'Home U'},away:{id:2,name:'Away U'},score:{home:hs,away:as},playerStats:{home,away}});
const P=(id,pos,stats)=>({id,name:`P${id}`,pos,stats});

test('the best offensive and defensive box-score lines of the week win, with a small edge for winning',()=>{
 const u={year:2030,gameArchive:[]};const W=makePlayersOfWeek({getUniverse:()=>u});
 const g=game('G1',31,10,[P('q','QB',{passYds:310,passTD:3,int:1}),P('l','LB',{tackles:9,sacks:1}),P('k','K',{fgMade:4})],[P('r','RB',{rushYds:190,rushTD:2}),P('e','EDGE',{sacks:3,tackles:4,tfl:3})]);
 const {off,def}=W.pick([g]);
 assert.equal(off.playerId,'r','190 and 2 beats 310, 3 and a pick');assert.equal(off.line,'190 rush yds, 2 TD');
 assert.equal(def.playerId,'e');assert.equal(def.team,'Away U');
 const tie=game('G2',20,10,[P('a','RB',{rushYds:100,rushTD:1})],[P('b','RB',{rushYds:100,rushTD:1})]);
 assert.equal(W.pick([tie]).off.playerId,'a','the winner takes an even line');
 assert.deepEqual(W.pick([]),{off:null,def:null});
});

test('a week is awarded once, only from that week\'s regular-season games, and a new season starts clean',()=>{
 const u={year:2030,gameArchive:[{...game('G0',7,3,[P('z','RB',{rushYds:300,rushTD:4})],[]),week:2},game('G1',31,10,[P('q','QB',{passYds:250,passTD:2})],[P('s','S',{intDef:2,tackles:5})]),{...game('G9',7,3,[P('y','RB',{rushYds:300,rushTD:4})],[]),label:'Sunrise Bowl'}]};
 const W=makePlayersOfWeek({getUniverse:()=>u});
 const row=W.award(3);assert.equal(row.off.playerId,'q');assert.equal(row.def.playerId,'s');
 assert.equal(W.award(3),null,'once');assert.equal(W.countFor('q'),1);assert.equal(W.last().week,3);
 u.year=2031;assert.equal(W.last(),null);assert.equal(u.weeklyHonors.year,2031);
});

test('in the game, each played week names winners and your winner makes The Wire',async()=>{
 const e=loadEngine({seed:6161,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');if(u.phase==='preseason')e.beginSeason();
 e.simWeek();e.simWeek();
 assert.deepEqual(u.weeklyHonors.rows.map(r=>r.week),[1,2]);
 for(const r of u.weeklyHonors.rows){assert.ok(r.off&&r.def);assert.ok(['QB','RB','WR','TE'].includes(r.off.pos));assert.ok(r.off.line.length>0)}
 // Hand this program the honour by making its game the only one considered.
 const W=globalThis.DynastyPlayersOfWeek||e.DynastyPlayersOfWeek;
 const mine=u.gameArchive.filter(g=>g.week===2&&(g.home.id===t.id||g.away.id===t.id));
 const p=W.pick(mine);assert.ok(p.off&&p.def);
 const before=JSON.stringify(u.weeklyHonors);e.render?.();assert.equal(JSON.stringify(u.weeklyHonors),before);
});

test('in the game, your winner is reported in The Wire',async()=>{
 const e=loadEngine({seed:6262,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');if(u.phase==='preseason')e.beginSeason();
 e.simWeek();
 const W=globalThis.DynastyPlayersOfWeek||e.DynastyPlayersOfWeek;
 // Re-award week one as though this program's game were the only one played.
 const all=u.gameArchive;u.gameArchive=all.filter(g=>g.home.id===t.id||g.away.id===t.id);
 const g=u.gameArchive[0],side=g.home.id===t.id?'home':'away';g.playerStats[side==='home'?'away':'home']=[];
 u.weeklyHonors.rows=[];const row=W.award(1);u.gameArchive=all;
 assert.equal(row.off.teamId,t.id);
 W.announce(row);
 const ev=u.events.filter(x=>x.type==='PLAYER_OF_WEEK');
 assert.ok(ev.length>=1);assert.match(ev[0].summary,/is the National Offensive Player of the Week \(/);
 assert.ok(require('../dynasty-world-news.js').items(u,t).some(w=>w.kicker==='PLAYER OF THE WEEK'),'it reaches The Wire');
});

test('honours count toward the award race, lift draft stock a little and read as a career line',()=>{
 const u={year:2030,gameArchive:[]};const W=makePlayersOfWeek({getUniverse:()=>u});
 W.state().rows.push({week:1,off:{playerId:'q'},def:{playerId:'d'}},{week:2,off:{playerId:'q'},def:null});
 assert.equal(W.countFor('q'),2);assert.equal(W.awardBonus('q'),2*W.AWARD_BONUS);assert.equal(W.awardBonus('nobody'),0);
 W.state().rows.push({week:3,off:{playerId:'q'}},{week:4,off:{playerId:'q'}},{week:5,off:{playerId:'q'}});
 assert.equal(W.countFor('q'),5,'the cache follows new weeks');assert.equal(W.awardBonus('q'),W.AWARD_MAX*W.AWARD_BONUS,'capped');
 assert.equal(W.draftBump(0),0);assert.equal(W.draftBump(2),1.2);assert.equal(W.draftBump(9),W.DRAFT_MAX);
 assert.ok(W.DRAFT_MAX<3,'never a whole round');
 assert.equal(W.honourLabel(1),'Player of the Week');assert.equal(W.honourLabel(3),'Three-time Player of the Week');assert.equal(W.honourLabel(14),'14-time Player of the Week');
});

test('in the game, honours lift seasonScore and the draft board, survive the archive and appear in the Hall of Fame case',async()=>{
 const e=loadEngine({seed:6363,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');if(u.phase==='preseason')e.beginSeason();
 e.simWeek();
 const W=globalThis.DynastyPlayersOfWeek||e.DynastyPlayersOfWeek;
 const row=u.weeklyHonors.rows[0];const f=e.findPlayer(row.off.playerId);
 assert.equal(f.p.potw,1,'the career count is credited when the week is named');
 const qb=t.roster.find(p=>p.pos==='QB');
 const plain=e.seasonScore(qb,t);W.state().rows.push({week:9,off:{playerId:qb.id}});
 assert.equal(Math.round((e.seasonScore(qb,t)-plain)*10)/10,W.AWARD_BONUS);
 delete qb.potw;const before=e.draftProjection(qb,t);qb.potw=3;const after=e.draftProjection(qb,t);
 assert.ok(after.score>=before.score+1&&after.score<=before.score+2,`${before.score} → ${after.score}`);assert.equal(after.potwBump,1.8);
 assert.ok(after.round==null||before.round==null||before.round-after.round<=1);
 assert.equal(e.draftPlayer(qb,t).potw,3);
 qb.career.games=10;const arch=e.archiveRecord(qb,t,'Eligibility exhausted');assert.equal(arch.potw,3);
 const reasons=e.hofPlayerReasons(arch,{awards:[{name:'National Player of the Year',year:2029}],round:1});
 assert.ok(reasons.includes('Three-time Player of the Week'),reasons.join(' | '));assert.ok(reasons.length<=4);
 qb.potw=1;assert.ok(!e.hofPlayerReasons(qb,{awards:[],round:null}).some(r=>/Player of the Week/.test(r)),'once is not a career line');
});
