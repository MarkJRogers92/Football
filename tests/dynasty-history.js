const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {makeWorldHistoryPresentationModel}=require('../world-history-presentation-adapter.js');
const model=makeWorldHistoryPresentationModel();
const schoolSeason=(year,games,starts,rating,team='Home')=>({year,team,games,starts,rating});
const signedPlayer=(id,extra={})=>({id,name:'Alex Carter',pos:'QB',recruitingMemory:{season:2028,schoolId:1,stars:3,scoutingReceipt:{schoolId:1,season:2028,currentRead:65}},seasonHistory:[schoolSeason(2029,4,1,68),schoolSeason(2030,12,10,73)],...extra});
const raw=(extra={})=>({teamId:1,teamName:'Home',conference:'Lakes',year:2031,week:4,phase:'regular',history:[],players:[],...extra});
const game=(id,season,us,them,extra={})=>({id,season,week:3,final:true,label:'Regular season',home:{id:1,name:'Home'},away:{id:2,name:'Rival'},score:{home:us,away:them},...extra});

test('season timeline follows school IDs across a rename and rejects conflicting name matches',()=>{
 const archived={type:'season',year:2030,records:[{schoolId:1,name:'Old Home',w:11,l:2,cw:7,cl:1}],top10:[{schoolId:1,name:'Old Home'}],championId:1,champion:'Old Home',awards:[]};
 assert.deepEqual(model.snapshot(raw({history:[archived]})).seasons,[{year:2030,record:'11-2',conferenceRecord:'7-1',rank:1,champion:true,awards:[]}]);
 assert.deepEqual(model.snapshot(raw({history:[{...archived,records:[{schoolId:9,name:'Home',w:1,l:12}],top10:[],championId:9,champion:'Home'}]})).seasons,[]);
});

test('name-only season callers remain compatible when their archive also contains school IDs',()=>{
 const entry={type:'season',year:2030,records:[{schoolId:1,name:'Home',w:9,l:4,cw:6,cl:2}],top10:[{schoolId:1,name:'Home'}],championId:1,champion:'Home',awards:[]};
 assert.deepEqual(model.seasonForTeam(entry,'Home'),{year:2030,record:'9-4',conferenceRecord:'6-2',rank:1,champion:true,awards:[]});
});

test('retained signing receipts reveal actual school seasons without merging same-name players',()=>{
 const a=signedPlayer('p1'),b=signedPlayer('p2',{seasonHistory:[schoolSeason(2029,3,0,66)]});
 const input=raw({players:[{p:a,schoolId:1,schoolName:'Home',status:'active'},{p:b,schoolId:2,schoolName:'Rival',status:'active'},{p:{...a},status:'archived'}]});
 const before=JSON.stringify(input),out=model.snapshot(input);
 assert.equal(out.classes?.length,1);
 assert.deepEqual(out.classes[0],{year:2028,retained:2,players:[
  {id:'p1',name:'Alex Carter',pos:'QB',status:'active',schoolId:1,schoolName:'Home',stars:3,signingRead:65,seasons:[{year:2029,games:4,starts:1,rating:68},{year:2030,games:12,starts:10,rating:73}]},
  {id:'p2',name:'Alex Carter',pos:'QB',status:'active',schoolId:2,schoolName:'Rival',stars:3,signingRead:65,seasons:[{year:2029,games:3,starts:0,rating:66}]}
 ]});
 assert.equal(JSON.stringify(input),before,'presentation must not alter records');
});

test('classes require recorded signing identity and exclude other schools and future evidence',()=>{
 const players=[
  {p:signedPlayer('starter',{recruitingMemory:null,year:'FR',origin:'Five-star recruit'})},
  {p:signedPlayer('elsewhere',{recruitingMemory:{season:2028,schoolId:2,stars:5}})},
  {p:signedPlayer('future',{recruitingMemory:{season:2032,schoolId:1,stars:4}})},
  {p:signedPlayer('retained',{seasonHistory:[schoolSeason(2027,9,9,80),schoolSeason(2029,4,1,68),schoolSeason(2030,13,12,90,'Rival'),schoolSeason(2032,15,15,99)]})}
 ];
 const out=model.snapshot(raw({players}));
 assert.equal(out.classes?.length,1);
 assert.deepEqual(out.classes[0].players.map(p=>p.id),['retained']);
 assert.deepEqual(out.classes[0].players[0].seasons,[{year:2029,games:4,starts:1,rating:68}]);
});

test('class receipts and chronological progression stay bounded in long dynasties',()=>{
 const players=[];
 for(let year=2020;year<=2029;year++)for(let n=0;n<5;n++)players.push({p:signedPlayer(`${year}-${n}`,{recruitingMemory:{season:year,schoolId:1},seasonHistory:[2027,2028,2029,2030].map(y=>schoolSeason(y,10,5,70))})});
 const classes=model.snapshot(raw({players})).classes;
 assert.deepEqual(classes?.map(c=>[c.year,c.retained,c.players.length]),[[2029,5,3],[2028,5,3],[2027,5,3],[2026,5,3]]);
 assert.deepEqual(classes[0].players[0].seasons.map(s=>s.year),[2029,2030]);
 assert.deepEqual(classes[3].players[0].seasons.map(s=>s.year),[2028,2029,2030]);
});

test('recurring players need two distinct completed school seasons and current roster identity',()=>{
 const players=[
  {p:signedPlayer('returning'),schoolId:1,schoolName:'Home',status:'active'},
  {p:signedPlayer('same-name-other'),schoolId:2,schoolName:'Rival',status:'active'},
  {p:signedPlayer('archived'),status:'archived'},
  {p:signedPlayer('duplicate-season',{seasonHistory:[schoolSeason(2030,6,2,69),schoolSeason(2030,6,2,69)]}),schoolId:1,status:'active'},
  {p:signedPlayer('transfer',{seasonHistory:[schoolSeason(2029,8,8,70,'Rival'),schoolSeason(2030,12,10,73)]}),schoolId:1,status:'active'}
 ];
 const out=model.snapshot(raw({players}));
 assert.deepEqual(out.recurringPlayers?.map(p=>[p.id,p.seasons.map(s=>s.year)]),[['returning',[2029,2030]]]);
});

test('recent rivalry meetings use final archive scores and canonical IDs, including ties and close losses',()=>{
 const games=[game('win',2030,27,24),game('loss',2031,20,21),game('tie',2029,17,17),game('unplayed',2031,0,0,{final:false}),game('wrong-school',2031,50,0,{home:{id:9,name:'Home'}}),game('future-season',2032,40,0),game('future-week',2031,30,0,{week:9}),game('missing-score',2031,0,0,{score:null})];
 const out=model.snapshot(raw({rival:{id:2,name:'Rival'},rivalry:{trophy:'Old Bell',series:{w:6,l:3}},games}));
 assert.deepEqual(out.rivalry,{teamId:2,teamName:'Rival',trophy:'Old Bell',series:{wins:6,losses:3},meetings:[
  {id:'loss',year:2031,week:3,label:'Regular season',venue:'home',us:20,them:21,result:'L'},
  {id:'win',year:2030,week:3,label:'Regular season',venue:'home',us:27,them:24,result:'W'},
  {id:'tie',year:2029,week:3,label:'Regular season',venue:'home',us:17,them:17,result:'T'}
 ]});
});

test('rivalry meetings remain bounded and preserve the selected school perspective away from home',()=>{
 const games=Array.from({length:10},(_,i)=>game(`g${i}`,2021+i,14,21,{home:{id:2,name:'Rival'},away:{id:1,name:'Old Home'}}));
 const out=model.snapshot(raw({rival:{id:2,name:'Rival'},games}));
 assert.deepEqual(out.rivalry?.meetings.map(g=>[g.id,g.us,g.them,g.result,g.venue]),[['g9',21,14,'W','away'],['g8',21,14,'W','away'],['g7',21,14,'W','away'],['g6',21,14,'W','away'],['g5',21,14,'W','away'],['g4',21,14,'W','away']]);
});

test('browser bridge reports deferred archives without hydration, writes, or random draws',()=>{
 const p=signedPlayer('p1'),home={id:1,name:'Home',roster:[p],rivalry:{rivalId:2,series:{w:2,l:1}}},away={id:2,name:'Rival',roster:[]};
 const universe={year:2031,week:4,phase:'regular',teams:[home,away],history:[],playerArchive:[],gameArchive:[],rng:{seed:7,draws:42}};
 const ctx={universe,selected:()=>home,archiveIsDeferred:()=>true,gamesAreDeferred:()=>true,ensureArchiveLoaded:()=>assert.fail('must not hydrate players'),ensureGamesLoaded:()=>assert.fail('must not hydrate games'),Math:Object.create(Math)};
 ctx.Math.random=()=>assert.fail('must not draw randomness');
 const before=JSON.stringify(universe);
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','world-history-presentation-adapter.js'),'utf8'),ctx);
 const out=ctx.DynastyLabWorldHistoryPresentation.snapshot();
 assert.ok(out.archives,'archive completeness is exposed to the history view');
 assert.deepEqual(JSON.parse(JSON.stringify(out.archives)),{playersDeferred:true,gamesDeferred:true});
 assert.equal(out.classes?.[0]?.players[0]?.id,'p1');
 assert.equal(JSON.stringify(universe),before);
});

test('old and partial saves present empty evidence without inventing signings or meetings',()=>{
 const out=model.snapshot(raw());
 assert.deepEqual(out.classes,[]);
 assert.deepEqual(out.recurringPlayers,[]);
 assert.equal(out.rivalry,null);
 assert.deepEqual(out.archives,{playersDeferred:false,gamesDeferred:false});
});
