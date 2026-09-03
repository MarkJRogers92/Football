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
 assert.equal(g.drives.length,24);assert.equal(g.drives.reduce((n,d)=>n+d.points,0)+g.scoreAdjustment.home+g.scoreAdjustment.away,g.score.home+g.score.away);
 assert.equal(g.plays,undefined,'full play logs are not duplicated into permanent archive');
 const frozen=JSON.stringify(g);e.simWeek();assert.equal(u.gameArchive.length,60,'detailed game is not simulated twice');assert.equal(new Set(u.gameArchive.map(x=>x.id)).size,60);
 for(const game of u.gameArchive){for(const side of ['away','home']){
  const b=game.teamStats[side],players=game.playerStats[side];
  for(const key of ['passAtt','passComp','passYds','passTD','int','rushAtt','rushYds','rushTD','fgMade','fgAtt','punts'])assert.equal(players.reduce((n,p)=>n+(p.stats[key]||0),0),b[key]||0,`${side} ${key}`);
  assert.equal(players.reduce((n,p)=>n+(p.stats.receptions||0),0),b.passComp);
  assert.equal(players.reduce((n,p)=>n+(p.stats.recYds||0),0),b.passYds);
  assert.equal(game.score[side],(b.passTD+b.rushTD)*7+b.fgMade*3+game.scoreAdjustment[side]);
 }}
 assert.ok(u.events.some(x=>x.gameIds?.includes(g.id)));
 assert.match(e.gameBoxHTML(g),/Passing/);assert.match(e.gameSummaryHTML(g),/Game leaders/);
 const t=u.teams.find(t=>t.id===g.home.id);t.rank=120;t.w=99;t.roster[0].name='CHANGED NAME';assert.equal(JSON.stringify(g),frozen);
 await e.saveBrowser();await e.loadBrowser();assert.equal(JSON.stringify(e.universe.gameArchive[0]),frozen);
 await e.ensureArchiveLoaded();const portable=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));e.installSave({version:'0.9.2',userTeam:'Chicago Metropolitan',universe:portable});
 assert.equal(JSON.stringify(e.universe.gameArchive[0]),frozen);e.normalizeUniverse();assert.equal(e.universe.gameArchive.length,60);
 const current=e.universe;assert.throws(()=>e.installSave({universe:{...current,gameArchiveVersion:2}}),/newer version/);assert.equal(e.universe,current);
 const oldCounter=e.universe.gameCounter;e.simWeek();assert.ok(e.universe.gameCounter>oldCounter);assert.equal(new Set(e.universe.gameArchive.map(x=>x.id)).size,120);
 const sparse={...g,drives:undefined,injuries:undefined,scoreAdjustment:undefined};assert.doesNotThrow(()=>e.gameSummaryHTML(sparse));
});

test('regular season, championships, rollover and portable history preserve game records',async()=>{
 const e=loadEngine({seed:923});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 e.simWeek();const original=JSON.stringify(e.universe.gameArchive[0]);e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 const u=e.universe;assert.equal(u.gameArchive.length,745);const final=u.gameArchive.find(g=>g.label==='National Championship');assert.ok(final);assert.equal(final.week,17);assert.equal(final.venue,'Neutral site');
 assert.ok(u.events.some(x=>x.type==='CHAMPIONSHIP_WON'&&x.gameIds[0]===final.id));
 e.runSpringCamp();e.runFallCamp();e.runOffseason();assert.equal(JSON.stringify(u.gameArchive[0]),original);assert.equal(u.gameArchive.length,745);
 const save=JSON.parse(JSON.stringify(e.packUniverse(u)));e.installSave({version:'0.9.2',userTeam:'Chicago Metropolitan',universe:save});assert.equal(JSON.stringify(e.universe.gameArchive[0]),original);
 e.simWeek();assert.equal(e.universe.gameArchive.length,805);assert.equal(new Set(e.universe.gameArchive.map(g=>g.id)).size,805);
 console.log('Game archive bytes/season:',Buffer.byteLength(JSON.stringify(save.gameArchive)));
});
