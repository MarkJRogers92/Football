const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const {loadEngine}=require('../tools/harness');

test('transfer weighting, capacity, identity, history and former-player alerts',async()=>{
 const e=loadEngine({seed:919,indexedDB:new IDBFactory()});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,from=u.teams[0],p=from.roster[0],teams=u.teams;
 const a={...teams[1],roster:[]},b={...a,id:999,name:'Other destination',roster:[]};u.teams=[from,a,b];
 p.recruitingMemory={topFiveSchoolIds:[a.id],offerSchoolIds:[],lat:from.lat,lon:from.lon,recruiterCoachId:'recruiter',relationship:90};
 let preferred=0;for(let i=0;i<600;i++){const choice=e.chooseTransferDestination(p,from,'PLAYING_TIME');assert.notEqual(choice.t.id,from.id);if(choice.t.id===a.id)preferred++}assert.ok(preferred>450,`${preferred}/600 favored the recruiting finalist`);
 const score=e.transferFit(p,a,from,'PLAYING_TIME').score;a.staff={...a.staff,RC:{...a.staff.RC,id:'recruiter'}};assert.ok(e.transferFit(p,a,from,'PLAYING_TIME').score>score,'recruiting coach at new school increases attraction');
 a.roster=Array(105).fill({pos:'QB',trueNow:60});assert.equal(e.chooseTransferDestination(p,from,'PLAYING_TIME').t.id,b.id);b.roster=Array(105).fill({pos:'QB',trueNow:60});assert.equal(e.chooseTransferDestination(p,from,'PLAYING_TIME'),null);u.teams=teams;
 p.stats.passYds=154;p.stats.games=2;p.injuryHistory=[{year:u.year,week:1,weeks:2}];p.injuryWeeks=1;p.redshirtUsed=true;p.redshirtSeason=2026;p.eligibilityUsed=1;
 p.promises=[{id:'PR_test',type:'EARLY_ROLE',schoolId:from.id,status:'BROKEN',resolvedSeason:u.year,transferPenalty:18}];e.archivePlayerSeason(p,from,u.year);
 const identity=p.id,growth=p.growthProfile,injuries=structuredClone(p.injuryHistory),career=structuredClone(p.career),entry={p,from:from.name,fromSchoolId:from.id,reason:'BROKEN_PROMISE',wasStarter:true};
 const dest=e.placeTransfer(entry);assert.ok(dest&&dest.id!==from.id);assert.ok(dest.roster.includes(p));assert.ok(!from.roster.includes(p));assert.equal(p.id,identity);assert.equal(p.growthProfile,growth);assert.equal(p.stats.passYds,0);assert.deepEqual(p.career,career);assert.deepEqual(p.injuryHistory,injuries);assert.equal(p.injuryWeeks,1);assert.equal(p.redshirtSeason,2026);assert.equal(p.year,'SO');assert.equal(p.promises[0].status,'BROKEN');assert.equal(e.promisePenalty(p),0);assert.ok(dest.roster.length<=105);
 assert.equal(e.placeTransfer(entry),null);assert.equal(p.transferHistory.length,1);assert.equal(u.teams.flatMap(t=>t.roster).filter(x=>x.id===identity).length,1);
 u.schedule[0]=[{home:from.name,away:dest.name,played:false,week:1}];const alert=e.familiarFaceItems(from).find(x=>x.player===identity);assert.ok(alert);assert.match(alert.main,/now plays for/);assert.match(alert.sub,/Broken promise/);
 e.rebuildIndexes();await e.saveBrowser();await e.loadBrowser();await e.ensureArchiveLoaded();const loaded=e.findPlayer(identity);assert.equal(loaded.team.id,dest.id);assert.deepEqual(loaded.p.transferHistory,p.transferHistory);assert.deepEqual(loaded.p.career,career);
 const exported=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));e.installSave({version:'0.9.1',userTeam:from.name,universe:exported});assert.equal(e.findPlayer(identity).p.transferHistory[0].toSchoolId,dest.id);
 const archive=e.archiveRecord(e.findPlayer(identity).p,dest,'Eligibility exhausted');assert.deepEqual(archive.transferHistory,p.transferHistory);assert.deepEqual(archive.recruitingMemory,p.recruitingMemory);
 // No available seat: preserve the unplaced person in the portable portal queue.
 const pending=e.universe.teams[2].roster.pop();e.universe.transferPortal.push({p:pending,fromSchoolId:e.universe.teams[2].id,from:e.universe.teams[2].name,reason:'PLAYING_TIME',enteredSeason:e.universe.year});await e.saveBrowser();await e.loadBrowser();assert.equal(e.findPlayer(pending.id).portal,true);assert.equal(e.findPlayer(pending.id).p.id,pending.id);
});

test('two seasons retain one career per transfer without duplicated seasonal totals',async()=>{
 const e=loadEngine({seed:920});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 for(let season=0;season<2;season++){
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason();
  const u=e.universe,players=[...u.teams.flatMap(t=>t.roster),...u.playerArchive,...u.transferPortal.map(x=>x.p)];
  assert.equal(new Set(players.map(p=>p.id)).size,players.length,'each person occupies one location');
  assert.ok(u.teams.every(t=>t.roster.length<=105&&t.roster.length>=85));
  const moved=players.filter(p=>p.transferHistory?.length);assert.ok(moved.length>0);
  for(const p of moved){for(const key of ['games','passYds','rushYds','recYds'])assert.equal(p.career[key]||0,(p.seasonHistory||[]).reduce((n,h)=>n+(h[key]||0),0));if(u.teams.some(t=>t.roster.includes(p)))assert.equal(p.stats.games,0)}
  const recent=u.events.filter(x=>x.type==='TRANSFER_COMPLETED'&&x.season===u.year-1);assert.ok(recent.length>0);assert.ok(recent.every(x=>x.metadata.fromSchoolId!==x.metadata.toSchoolId));
  assert.ok(u.teams.flatMap(t=>t.roster).some(p=>p.recruitingMemory?.topFiveSchoolIds.length===5));
 }
});
