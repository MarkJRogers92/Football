const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.13: the history index reads what the dynasty has already recorded.
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('the coach index lists active staff with career records', async()=>{
 const e=await setup(9101),u=e.universe;
 const rows=e.coachIndexRows();
 const staffCount=u.teams.reduce((n,t)=>n+Object.keys(t.staff||{}).length,0);
 assert.equal(rows.length,Math.min(40,staffCount),'respects the requested limit');
 assert.ok(rows.every(r=>r.id&&r.name&&Number.isFinite(r.wins)&&Number.isFinite(r.losses)));
 assert.ok(rows.every(r=>r.active),'nobody has departed in a fresh universe');
 const me=u.teams.find(t=>t.name==='Chicago Metropolitan');
 const hc=e.coachIndexRows({query:me.staff.HC.name}).find(r=>r.id===me.staff.HC.id);
 assert.ok(hc,'the controlled program head coach is findable by name');
 assert.equal(hc.team,'Chicago Metropolitan');
});

test('coach search matches name or program and never mutates the universe', async()=>{
 const e=await setup(9102),u=e.universe,t=u.teams[0],hc=t.staff.HC;
 const before=JSON.stringify(u.teams.map(x=>[x.name,x.staff.HC.id]));
 assert.ok(e.coachIndexRows({query:hc.name}).some(r=>r.id===hc.id));
 assert.ok(e.coachIndexRows({query:t.name}).every(r=>r.team===t.name));
 assert.equal(e.coachIndexRows({query:'zzz-no-such-coach'}).length,0);
 assert.equal(JSON.stringify(u.teams.map(x=>[x.name,x.staff.HC.id])),before);
});

test('the champion timeline maps archived seasons newest first', async()=>{
 const e=await setup(9103),u=e.universe;
 assert.deepEqual(e.championTimeline(),[]);
 u.history.unshift({type:'season',year:2032,champion:'Tidewater State',top10:[{name:'Tidewater State',record:'13-1'},{name:'Puget Sound State',record:'12-2'}]});
 u.history.unshift({type:'season',year:2033,champion:'Great Lakes University',top10:[{name:'Great Lakes University',record:'14-0'},{name:'Chicago Metropolitan',record:'11-2'}]});
 const rows=e.championTimeline();
 assert.deepEqual(rows.map(r=>r.year),[2033,2032]);
 assert.equal(rows[0].champion,'Great Lakes University');
 assert.equal(rows[0].runnerUp,null,'rank two is not evidence of a championship appearance');
 assert.equal(rows[0].record,'14-0');
 assert.equal(rows[1].runnerUp,null);
});

test('champion records match the champion, not the first ranked team', async()=>{
 const e=await setup(9404),u=e.universe;
 u.history=[{type:'season',year:2030,champion:'Actual Champion',top10:[{name:'Rank One',record:'15-1'},{name:'Actual Champion',record:'13-3'}]}];
 assert.equal(e.championTimeline()[0].record,'13-3');
 assert.equal(e.championTimeline()[0].runnerUp,null);
});

test('new archives freeze the final opponent, school identity and conference', async()=>{
 const e=await setup(9405),u=e.universe,t=u.teams[0],opponent=u.teams[1],oldName=t.name,oldConf=t.conference;
 u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'review');u.champion=t.name;t.w=14;t.l=2;
 u.latest=[{label:'National Championship',home:t.name,away:opponent.name,winner:t.name,hp:31,ap:24}];
 e.offseasonReview();
 const archived=u.history.find(h=>h.type==='season'),record=archived.records.find(r=>r.name===oldName);
 assert.equal(record.schoolId,t.id);assert.equal(record.conference,oldConf);
 t.name='Renamed School';t.conference='New League';
 const champion=e.championTimeline()[0];assert.equal(champion.champion,oldName);assert.equal(champion.runnerUp,opponent.name);assert.equal(champion.record,'14-2');
 const table=e.conferenceStandings({conference:oldConf,year:archived.year});
 assert.ok(table.rows.some(r=>r.name===oldName));assert.equal(table.membershipEstimated,false);
 assert.ok(e.conferenceNames().includes(oldConf));
});

test('standings use overall wins to break equal conference records and reject missing seasons', async()=>{
 const e=await setup(9406),u=e.universe,conf=u.teams[0].conference;
 u.history=[{type:'season',year:2031,records:[
  {name:'Low',conference:conf,w:7,l:5,cw:5,cl:3},
  {name:'High',conference:conf,w:10,l:2,cw:5,cl:3},
  {name:'Middle',conference:conf,w:9,l:3,cw:5,cl:3}]}];
 assert.deepEqual(e.conferenceStandings({conference:conf,year:2031}).rows.map(r=>r.name),['High','Middle','Low']);
 assert.equal(e.conferenceStandings({conference:conf,year:1999}),null);
});

test('legacy final games supply a runner-up, never another season or a ranking', async()=>{
 const e=await setup(9407),u=e.universe;
 u.history=[{type:'season',year:2030,champion:'Winner',top10:[]}];
 u.gameArchive=[{season:2029,label:'National Championship',home:{name:'Winner'},away:{name:'Wrong year'},score:{home:30,away:10}}];
 assert.equal(e.championTimeline()[0].runnerUp,null);
 u.gameArchive.push({season:2030,label:'National Championship',home:{name:'Finalist'},away:{name:'Winner'},score:{home:21,away:28}});
 assert.equal(e.championTimeline()[0].runnerUp,'Finalist');
});

test('a decorated retired player is inducted with visible reasons', async()=>{
 const e=await setup(9201),u=e.universe;
 u.playerArchive.push({id:'hof-qb',name:'Quincy Vale',pos:'QB',lastTeam:'Chicago Metropolitan',retiredYear:2031,
  perceived:80,draftResult:{year:2031,round:1,label:'Round 1, Pick 3'},
  awards:[{year:2030,name:'National Player of the Year'}],
  career:{passYds:11200,passTD:88,int:24,rushYds:900,rushTD:9}});
 const row=e.hallOfFame().find(r=>r.id==='hof-qb');
 assert.ok(row,'a national player of the year is inducted');
 assert.equal(row.kind,'player');
 assert.ok(row.reasons.some(reason=>/National Player of the Year 2030/.test(reason)),'the award is named');
 assert.ok(row.reasons.some(reason=>/First-round draft pick/.test(reason)),'the draft result is named');
 assert.ok(row.reasons.some(reason=>/career passing yards/.test(reason)),'career production is named');
});

test('an ordinary or unfinished career stays out', async()=>{
 const e=await setup(9202),u=e.universe;
 u.playerArchive.push({id:'hof-none',name:'Ordinary Walk-On',pos:'LB',lastTeam:'Chicago Metropolitan',retiredYear:2030,
  perceived:52,draftResult:null,awards:[],career:{tackles:12,sacks:1}});
 assert.equal(e.hallOfFame().some(r=>r.id==='hof-none'),false);
});

test('a championship coach is inducted', async()=>{
 const e=await setup(9203),u=e.universe,t=u.teams[0],hc=t.staff.HC;
 hc.seasons=[{year:2030,schoolId:t.id,schoolName:t.name,role:'Head Coach',wins:13,losses:1,nationalTitle:true,conferenceTitle:true,coachOfYear:true}];
 const row=e.hallOfFame().find(r=>r.kind==='coach'&&r.id===hc.id);
 assert.ok(row,'a national-title coach is inducted');
 assert.ok(row.reasons.some(reason=>/national title/.test(reason)));
 assert.ok(row.reasons.some(reason=>/Coach of the Year/.test(reason)));
});

test('induction is deterministic and read-only', async()=>{
 const e=await setup(9204),u=e.universe;
 u.playerArchive.push({id:'hof-det',name:'Deterministic Career',pos:'RB',lastTeam:'Chicago Metropolitan',retiredYear:2031,
  perceived:75,draftResult:{year:2031,round:2,label:'Round 2, Pick 9'},awards:[{year:2030,name:'Running Back of the Year'}],
  career:{rushYds:5400,rushTD:52,recYds:900}});
 const snapshot=()=>JSON.stringify({archive:u.playerArchive.map(p=>[p.id,p.awards.length]),teams:u.teams.map(t=>t.name)});
 const before=snapshot();
 const first=e.hallOfFame({limit:10}),second=e.hallOfFame({limit:10});
 assert.deepEqual(second,first,'repeat calls return the same list');
 assert.equal(snapshot(),before,'induction never mutates the universe');
});

test('conference standings filter by league and rank the league record', async()=>{
 const e=await setup(9301),u=e.universe;
 const conf=u.teams[0].conference, inConf=u.teams.filter(t=>t.conference===conf);
 const records=u.teams.map(t=>({name:t.name,w:6,l:4,cw:3,cl:2,pf:300,pa:250,prestige:t.prestige}));
 const top=records.find(r=>r.name===inConf[0].name); top.cw=9; top.cl=0; top.w=11;
 const second=records.find(r=>r.name===inConf[1].name); second.cw=8; second.cl=1;
 u.history.unshift({type:'season',year:2031,champion:'X',top10:[],records});
 const view=e.conferenceStandings({conference:conf,year:2031});
 assert.equal(view.year,2031);
 assert.equal(view.conference,conf);
 assert.ok(view.rows.length>=8,'a conference shows its members');
 assert.ok(view.rows.every(r=>e.T(r.name).conference===conf),'only that conference is listed');
 assert.equal(view.rows[0].place,1);
 assert.equal(view.rows[0].cw,9,'the best league record leads');
 for(let i=1;i<view.rows.length;i++){
  const a=view.rows[i-1],b=view.rows[i];
  assert.ok(a.cw>b.cw||(a.cw===b.cw&&a.cl<=b.cl),'league record orders the table');
 }
 assert.ok(e.conferenceNames().includes(conf));
 assert.deepEqual(e.historySeasons(),[2031]);
});

test('a dynasty with no archived season has no conference standings', async()=>{
 const e=await setup(9302);
 assert.equal(e.conferenceStandings(),null);
 assert.deepEqual(e.historySeasons(),[]);
});

test('one award season alone is not a hall of fame career', async()=>{
 const e=await setup(9205),u=e.universe;
 u.playerArchive.push({id:'hof-one',name:'One Good Year',pos:'WR',lastTeam:'Chicago Metropolitan',retiredYear:2031,
  perceived:70,draftResult:null,awards:[{year:2030,name:'Receiver of the Year'}],career:{recYds:2600,recTD:22}});
 assert.equal(e.hallOfFame().some(r=>r.id==='hof-one'),false,'a single award without a draft case is not enough');
});

test('two major awards carry a career without a draft result', async()=>{
 const e=await setup(9206),u=e.universe;
 u.playerArchive.push({id:'hof-two',name:'Twice Honored',pos:'LB',lastTeam:'Chicago Metropolitan',retiredYear:2031,
  perceived:78,draftResult:null,awards:[{year:2029,name:'Defensive Player of the Year'},{year:2030,name:'National Player of the Year'}],
  career:{tackles:410,sacks:38}});
 assert.ok(e.hallOfFame().some(r=>r.id==='hof-two'),'two major awards are a career argument');
});

// v0.30: the national timeline derives awards, upsets and standing records from what each season archived.
test('the national timeline lists awards, real upsets and records set that season', async()=>{
 const e=await setup(9601),u=e.universe;
 assert.deepEqual(e.nationalTimeline(),[]);
 const award={name:'National Player of the Year',playerId:'p1',playerName:'Ace Back',team:'Tidewater State',pos:'RB'};
 u.history=[{type:'season',year:2031,champion:'Tidewater State',top10:[{name:'Tidewater State',record:'13-1'}],awards:[award]},
  {type:'season',year:2030,champion:'Old Champ',top10:[],awards:[]}];
 const game=(id,season,home,away,hs,as)=>({id,season,week:5,label:'Regular season',final:true,home,away,score:{home:hs,away:as}});
 u.gameArchive=[
  game('G1',2031,{id:1,name:'Unranked U',rank:44},{id:2,name:'Top Dog',rank:2},24,21),   // unranked over #2
  game('G2',2031,{id:3,name:'Close Call',rank:9},{id:4,name:'Number Four',rank:4},30,27), // only 5 places: not an upset
  game('G3',2031,{id:5,name:'Number Eleven',rank:11},{id:6,name:'Number One',rank:1},17,14), // 10 places: not an upset
  game('G4',2031,{id:7,name:'Number Twenty',rank:20},{id:8,name:'Number Six',rank:6},28,10), // 14 places: upset
  game('G5',2031,{id:9,name:'Top Dog',rank:2},{id:10,name:'Unranked V',rank:50},45,3),    // favorite won
  game('G6',2030,{id:11,name:'Last Year',rank:60},{id:12,name:'Number Three',rank:3},20,17)];
 u.records={nationalSeason:{rushYds:{label:'Rushing Yards',value:2400,playerId:'p1',playerName:'Ace Back',team:'Tidewater State',year:2031},passYds:{label:'Passing Yards',value:5000,playerId:'p9',playerName:'Old Arm',team:'Old Champ',year:2030}}};
 const before=JSON.stringify(u.gameArchive);
 const [y2031,y2030]=e.nationalTimeline();
 assert.equal(y2031.year,2031);assert.equal(y2031.champion,'Tidewater State');
 assert.deepEqual(y2031.awards,[award]);
 assert.deepEqual(y2031.upsets.map(x=>x.gameId),['G1','G4'],'ordered by the loser\'s ranking; close and expected results excluded');
 assert.equal(y2031.upsets[0].winnerRank,null,'an unranked winner has no rank');
 assert.equal(y2031.upsets[0].score,'24-21');
 assert.deepEqual(y2031.records.map(r=>r.key),['rushYds']);
 assert.deepEqual(y2030.upsets.map(x=>x.gameId),['G6']);assert.deepEqual(y2030.records.map(r=>r.key),['passYds']);
 assert.equal(JSON.stringify(u.gameArchive),before,'reading the timeline never changes the archive');
});
test('the national timeline keeps at most three upsets per season', async()=>{
 const e=await setup(9602),u=e.universe;
 u.history=[{type:'season',year:2031,champion:'X',top10:[],awards:[]}];
 u.gameArchive=Array.from({length:6},(_,i)=>({id:'U'+i,season:2031,week:i+1,label:'Regular season',final:true,home:{id:i,name:'Low '+i,rank:99},away:{id:100+i,name:'High '+i,rank:i+1},score:{home:21,away:20}}));
 assert.deepEqual(e.nationalTimeline()[0].upsets.map(x=>x.gameId),['U0','U1','U2']);
});
