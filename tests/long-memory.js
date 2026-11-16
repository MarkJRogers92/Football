const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeLongMemory}=require('../long-memory.js');
const {loadEngine}=require('../tools/harness.js');

const T={id:7,name:'Home U',roster:[]};
const season=y=>({type:'season',year:y});

test('every fifth archived season checks in on three notable alumni who left at least three years ago, once each',()=>{
 const arch=[
  {id:'a',name:'Ace',pos:'QB',lastTeam:'Home U',retiredYear:2028,awards:[{name:'National Player of the Year',year:2027}],draftResult:{round:1},career:{games:40,passYds:11000}},
  {id:'b',name:'Bo',pos:'RB',lastTeam:'Home U',retiredYear:2029,awards:[],draftResult:{round:2},career:{games:38,rushYds:4100}},
  {id:'c',name:'Cy',pos:'LB',lastTeam:'Home U',retiredYear:2029,awards:[],draftResult:{round:3},career:{games:44,tackles:310}},
  {id:'d',name:'Dee',pos:'WR',lastTeam:'Home U',retiredYear:2029,awards:[],potw:1,draftResult:{round:4},career:{games:30,recYds:2000}},
  {id:'r',name:'Recent',pos:'QB',lastTeam:'Home U',retiredYear:2031,awards:[{name:'x'},{name:'y'}],draftResult:{round:1},career:{games:40}},
  {id:'o',name:'Other',pos:'QB',lastTeam:'Away U',retiredYear:2028,awards:[{name:'x'}],draftResult:{round:1},career:{games:40}},
  {id:'z',name:'Zero',pos:'QB',lastTeam:'Home U',retiredYear:2028,awards:[{name:'x'}],career:{games:0}},
 ];
 const u={year:2032,history:[2027,2028,2029,2030,2031].map(season),playerArchive:arch};
 const pro={a:{active:false,retired:true,length:9,proBowls:3,allPros:1,rings:0,done:9,hof:false},b:{active:true,done:4,proBowls:0,allPros:0,rings:0}};
 const M=makeLongMemory({getUniverse:()=>u,production:()=>60,proCareer:p=>pro[p.id]||null,coachFor:id=>id==='a'?{role:'quarterbacks coach',school:'Away U'}:null});
 assert.equal(M.checkinDue(),true);
 const c=M.checkin(T);
 assert.deepEqual(c.rows.map(r=>r.playerId),['a','b','c'],'most notable first; too recent, other programs and players who never played are skipped');
 assert.equal(c.rows[0].text,'retired after 9 pro seasons (3 Pro Bowls, 1× All-Pro), now coaching quarterbacks coach at Away U');
 assert.equal(c.rows[1].text,'in his 5th pro season');
 assert.equal(c.rows[2].text,'out of football; his 310 career tackles still stand');
 assert.equal(M.checkinDue(),false,'once a year');assert.equal(M.checkin(T),null);
 u.year=2037;u.history.push(...[2032,2033,2034,2035,2036].map(season));
 assert.deepEqual(M.checkin(T).rows.map(r=>r.playerId),['r','d'],'five seasons on, the next ones (never the same player twice)');
 u.history.push(season(2037));u.year=2038;assert.equal(M.checkinDue(),false,'not between windows');
});

test('the coming week\'s anniversary names the best memorable win from 5, 10, 15 years ago',()=>{
 const g=(id,season,week,us,them,mine,opp,extra={})=>({id,season,week,label:'Regular season',home:{id:7,name:'Home U',rank:mine},away:{id:9,name:'Big State',rank:opp},score:{home:us,away:them},...extra});
 const u={year:2040,week:3,gameArchive:[
  g('loss',2030,4,10,20,null,2),
  g('upset',2030,4,24,21,null,2),
  g('top5',2035,4,30,10,4,5),
  g('odd',2033,4,30,10,null,1),
  g('wrongweek',2030,5,30,10,null,1),
  g('bowl',2030,4,30,10,null,1,{label:'Sunrise Bowl'}),
 ]};
 const M=makeLongMemory({getUniverse:()=>u,isRivalry:()=>false});
 const a=M.anniversary(T);
 assert.equal(a.gameId,'upset');assert.equal(a.ago,10);assert.equal(a.text,'unranked Home U upset #2 Big State, 24-21');
 u.gameArchive=u.gameArchive.filter(x=>x.id!=='upset');
 assert.equal(M.anniversary(T).text,'Home U beat #5 Big State, 30-10');
 u.gameArchive=[g('riv',2035,4,17,14,null,null,{trophy:'Old Bucket'})];
 assert.equal(M.anniversary(T),null,'an ordinary win is not remembered');
 const R=makeLongMemory({getUniverse:()=>u,isRivalry:()=>true});
 assert.equal(R.anniversary(T).text,'Home U beat Big State for the Old Bucket, 17-14');
 const D=makeLongMemory({getUniverse:()=>u,isRivalry:()=>true,gamesDeferred:()=>true});
 assert.equal(D.anniversary(T),null,'an unloaded archive says nothing');
});

test('milestone watch names records within two games at the player\'s pace, one line per player, biggest record first',()=>{
 const rb={id:'rb',name:'Run',pos:'RB',stats:{games:5,rushYds:600},career:{games:30,rushYds:3000}};
 const wr={id:'wr',name:'Catch',pos:'WR',stats:{games:5,recYds:300},career:{games:5,recYds:0}};
 const lb={id:'lb',name:'Hit',pos:'LB',stats:{games:5,tackles:50},career:{tackles:0},injuryWeeks:5};
 const t={id:7,name:'Home U',roster:[rb,wr,lb]};
 const records={season:{rushYds:{value:700,playerId:'old',playerName:'Old Back',year:2031},recYds:{value:1000,playerId:'x',playerName:'X'},tackles:{value:60,playerId:'y',playerName:'Y'}},
  schoolCareer:(id,k)=>id==='rb'&&k==='rushYds'?{total:3600,value:3800,holder:'Legend',id:'leg'}:null,
  nationalCareer:{rushYds:{value:9000,playerId:'n',playerName:'Nat'}}};
 const M=makeLongMemory({getUniverse:()=>({year:2032,week:5})});
 const out=M.milestones(t,records);
 assert.equal(out.length,1,'the receiver is too far away and the injured linebacker is out');
 assert.equal(out[0].kind,'school career','school career outranks school season');assert.equal(out[0].need,200);assert.equal(out[0].games,2);
 assert.equal(M.milestoneText(out[0]),'RB Run needs 200 rushing yards for the school career record (Legend): about two games at his pace.');
 records.schoolCareer=()=>null;const one=M.milestones(t,records)[0];
 assert.equal(one.kind,'school season');assert.equal(one.games,1);
 assert.match(M.milestoneText(one),/needs 100 rushing yards for the school season record \(Old Back, 2031\): one good game/);
 records.season.rushYds.playerId='rb';assert.equal(M.milestones(t,records).length,0,'he already holds it');
});

test('in the game, the check-in reaches The Wire at the fifth archived season and the This Week card renders',async()=>{
 const e=loadEngine({seed:7171,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');
 const M=globalThis.DynastyLongMemory;assert.ok(M,'loaded in the full runtime');
 // Five archived seasons and two notable alumni.
 u.history.push(...[2022,2023,2024,2025,2026].map(season));
 u.playerArchive.push({id:'lm1',name:'Old Star',pos:'QB',lastTeam:t.name,retiredYear:u.year-4,awards:[{name:'National Player of the Year',year:u.year-5}],draftResult:null,career:{games:44,passYds:12000}});
 const c=M.checkin(t);assert.equal(c.rows[0].playerId,'lm1');assert.match(c.rows[0].text,/12,000 career passing yards still stand/);
 u.events??=[];u.events.push({id:'EVT_WHERE_NOW_TEST',type:'WHERE_NOW',season:u.year,week:u.week,schoolIds:[t.id],playerIds:['lm1'],summary:`Where are they now? QB Old Star: ${c.rows[0].text}.`,importance:58});
 assert.ok(require('../dynasty-world-news.js').items(u,t).some(w=>w.kicker==='WHERE ARE THEY NOW'));
 // Rendering This Week with nothing to remember changes nothing.
 const before=JSON.stringify(u.longMemory);e.render?.();assert.equal(JSON.stringify(u.longMemory),before);
});

test('in the game, the card data comes from real records mid-season without errors',async()=>{
 const e=loadEngine({seed:7272,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');if(u.phase==='preseason')e.beginSeason();
 for(let i=0;i<4;i++)e.simWeek();
 const M=globalThis.DynastyLongMemory,rb=t.roster.filter(p=>p.pos==='RB'&&(p.stats?.games||0)>=2).sort((a,b)=>b.stats.rushYds-a.stats.rushYds)[0];
 assert.ok(rb,'a back has played');
 t.records.rushYds={label:'Rushing Yards',value:rb.stats.rushYds+Math.ceil(rb.stats.rushYds/rb.stats.games*.8),playerId:'old',playerName:'Old Legend',year:u.year-3};
 const {ms}=M.cardData(t);
 const mine=ms.find(m=>m.playerId===rb.id);assert.ok(mine,JSON.stringify(ms));assert.equal(mine.games,1);
 assert.ok(['school season','school career','national career'].includes(mine.kind));
});
