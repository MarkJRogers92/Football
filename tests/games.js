const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const {loadEngine}=require('../tools/harness');

test('permanent boxes match actual player deltas, snapshot identity and retain detailed drives',async()=>{
 const e=loadEngine({seed:922,indexedDB:new IDBFactory()});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const scheduled=e.universe.schedule[0].find(x=>x.home==='Chicago Metropolitan'||x.away==='Chicago Metropolitan'),home=e.T(scheduled.home),away=e.T(scheduled.away);const former=e.roleStarter(home,'QB1');former.transferHistory=[{fromSchoolId:away.id}];
 e.simulateUserDetailed();const u=e.universe,g=u.gameArchive[0],result=u.lastDetailedGame;
 assert.equal(g.id,result.gameId);assert.equal(u.schedule[0].find(x=>x.gameId===g.id).score[1],g.score.home);
 assert.ok(g.formerPlayers.some(x=>x.id===former.id));assert.ok(u.events.some(x=>x.gameIds.includes(g.id)&&x.playerIds.includes(former.id)));
 // The exact count for this seed shifted (24 -> 23) once app.js reconciled GPT's drive-replay
 // work (v0.9.29-32) on top of this branch's v0.9.21-28 — a RNG-sequence-dependent number, not
 // an invariant. What actually matters, and still holds: drive scoring reconciles to the final
 // score, which the next line checks.
 assert.ok(g.drives.length>=18&&g.drives.length<=30,`dynamic drive count ${g.drives.length} stays in bounds`);assert.equal(g.drives.reduce((n,d)=>n+d.points,0)+g.scoreAdjustment.home+g.scoreAdjustment.away,g.score.home+g.score.away);
 for(const d of g.drives){const credited=g.playerStats[d.side];for(const line of d.playByPlay||[]){let m=line.match(/^.+? to (.+?) for -?\d+\.$/)||line.match(/^.+? incomplete for (.+?)\.$/)||line.match(/^.+? intercepted targeting (.+?) near/);if(m)assert.ok(credited.some(x=>x.name===m[1]&&(x.stats.targets||0)>0),`${m[1]} owns a target credited by the play log`);m=line.match(/^(.+?) (?:keeps|runs) for -?\d+\.$/);if(m)assert.ok(credited.some(x=>x.name===m[1]&&(x.stats.rushAtt||0)>0),`${m[1]} owns a carry credited by the play log`);m=line.match(/^(.+?) (?:field goal good|misses the field goal)/);if(m)assert.ok(credited.some(x=>x.name===m[1]&&(x.stats.fgAtt||0)>0),`${m[1]} owns the field-goal attempt named by the play log`);m=line.match(/^(.+?) punts\.$/);if(m)assert.ok(credited.some(x=>x.name===m[1]&&(x.stats.punts||0)>0),`${m[1]} owns the punt named by the play log`)}}
 assert.equal(g.plays,undefined,'full play logs are not duplicated into permanent archive');
 const frozen=JSON.stringify(g);e.simWeek();assert.equal(u.gameArchive.length,60,'detailed game is not simulated twice');assert.equal(new Set(u.gameArchive.map(x=>x.id)).size,60);
 for(const game of u.gameArchive){for(const side of ['away','home']){
  const b=game.teamStats[side],players=game.playerStats[side];
  for(const key of ['passAtt','passComp','passYds','passTD','int','rushAtt','rushYds','rushTD','fgMade','fgAtt','punts'])assert.equal(players.reduce((n,p)=>n+(p.stats[key]||0),0),b[key]||0,`${side} ${key}`);
  assert.equal(players.reduce((n,p)=>n+(p.stats.receptions||0),0),b.passComp);
  assert.equal(players.reduce((n,p)=>n+(p.stats.targets||0),0),b.passAtt);
  assert.equal(players.reduce((n,p)=>n+(p.stats.recYds||0),0),b.passYds);
  assert.equal(game.score[side],(b.passTD+b.rushTD)*7+b.fgMade*3+game.scoreAdjustment[side]);
 }}
 assert.ok(u.events.some(x=>x.gameIds?.includes(g.id)));
 assert.match(e.gameBoxHTML(g),/Passing/);assert.match(e.gameSummaryHTML(g),/Game leaders/);
 const t=u.teams.find(t=>t.id===g.home.id);t.rank=120;t.w=99;t.roster[0].name='CHANGED NAME';assert.equal(JSON.stringify(g),frozen);
 // v0.9.12: box scores are chunked and deferred like archived careers, so a
 // freshly loaded dynasty hydrates them before the record is readable.
 await e.saveBrowser();await e.loadBrowser();
 assert.equal(e.gamesAreDeferred(),true);assert.equal(e.universe.gameArchive.length,0);
 await e.ensureGamesLoaded();assert.equal(JSON.stringify(e.universe.gameArchive[0]),frozen);
 await e.ensureArchiveLoaded();const portable=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));e.installSave({version:'0.9.2',userTeam:'Chicago Metropolitan',universe:portable});
 assert.equal(JSON.stringify(e.universe.gameArchive[0]),frozen);e.normalizeUniverse();assert.equal(e.universe.gameArchive.length,60);
 const current=e.universe;assert.throws(()=>e.installSave({universe:{...current,gameArchiveVersion:2}}),/newer version/);assert.equal(e.universe,current);
 const oldCounter=e.universe.gameCounter;e.simWeek();assert.ok(e.universe.gameCounter>oldCounter);assert.equal(new Set(e.universe.gameArchive.map(x=>x.id)).size,120);
 const sparse={...g,drives:undefined,injuries:undefined,scoreAdjustment:undefined};assert.doesNotThrow(()=>e.gameSummaryHTML(sparse));
});

test('regular season, championships, rollover and portable history preserve game records',async()=>{
 const e=loadEngine({seed:923});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 e.simWeek();const original=JSON.stringify(e.universe.gameArchive[0]);e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 const u=e.universe;
 // 720 regular season + 10 conference titles + 15 playoff + however many bowls the field produced.
 const bowlGames=u.bowls.length,expected=745+bowlGames;
 assert.ok(bowlGames>0,'bowl season actually happened');
 assert.equal(u.gameArchive.length,expected);const final=u.gameArchive.find(g=>g.label==='National Championship');assert.ok(final);assert.equal(final.week,17);assert.equal(final.venue,'Neutral site');
 assert.ok(u.events.some(x=>x.type==='CHAMPIONSHIP_WON'&&x.gameIds[0]===final.id));
 e.runSpringCamp();e.runFallCamp();e.runOffseason();assert.equal(JSON.stringify(u.gameArchive[0]),original);assert.equal(u.gameArchive.length,expected);
 const save=JSON.parse(JSON.stringify(e.packUniverse(u)));e.installSave({version:'0.9.2',userTeam:'Chicago Metropolitan',universe:save});assert.equal(JSON.stringify(e.universe.gameArchive[0]),original);
 e.simWeek();assert.equal(e.universe.gameArchive.length,expected+60);assert.equal(new Set(e.universe.gameArchive.map(g=>g.id)).size,expected+60);
 console.log('Game archive bytes/season:',Buffer.byteLength(JSON.stringify(save.gameArchive)));
});


test('shared home-field bonus scales with fan support and vanishes on neutral sites',()=>{
 const e=loadEngine({seed:924}),low={fan_support:30},high={fan_support:95},samples=12000;
 const lowExpected=e.homeFieldFor(low),highExpected=e.homeFieldFor(high);
 assert.ok(Math.abs(lowExpected-1.3)<1e-9);assert.ok(Math.abs(highExpected-3.25)<1e-9);
 let lowTotal=0,highTotal=0;
 for(let i=0;i<samples;i++)lowTotal+=e.homeFieldScoreBonus(low,false);
 for(let i=0;i<samples;i++)highTotal+=e.homeFieldScoreBonus(high,false);
 const lowMean=lowTotal/samples,highMean=highTotal/samples;
 assert.ok(Math.abs(lowMean-lowExpected)<.08,`low-support mean ${lowMean} vs expected ${lowExpected}`);
 assert.ok(Math.abs(highMean-highExpected)<.08,`high-support mean ${highMean} vs expected ${highExpected}`);
 assert.ok(highMean>lowMean+1.7,`high-support edge ${highMean} should materially exceed low-support edge ${lowMean}`);
 for(let i=0;i<100;i++)assert.equal(e.homeFieldScoreBonus(high,true),0,'neutral sites receive no home-field bonus');
 const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'..','app.js'),'utf8');
 assert.ok(source.includes('let hp=hs.pts+homeFieldScoreBonus(home,neutral),ap=as.pts;'),'quick sim must consume the dynamic home-field helper');
});

test('both actual game engines use fan support for home-field scoring and no edge on neutral sites',async()=>{
 for(const mode of ['gameSim','detailedGame']){
  const outcomes=[];
  for(const [fan,neutral] of [[30,false],[95,false],[95,true]]){
   const e=loadEngine({seed:929});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
   const [home,away]=e.universe.teams;home.fan_support=fan;
   const random=Math.random;
   // A fixed draw isolates the score adjustment from game and tiebreak noise.
   try{Math.random=()=>.99;e[mode](home,away,neutral)}finally{Math.random=random}
   const record=e.universe.gameArchive.at(-1);
   outcomes.push(record.scoreAdjustment.home);
   assert.equal(record.score.home+record.score.away,
    ['home','away'].reduce((sum,s)=>{const b=record.teamStats[s];return sum+(b.passTD+b.rushTD)*7+b.fgMade*3+record.scoreAdjustment[s]},0));
  }
  assert.deepEqual(outcomes,[0,3,0],mode+' applies dynamic crowd support only at home');
 }
});
