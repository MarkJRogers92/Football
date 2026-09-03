const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const {loadEngine}=require('../tools/harness');
const P=require('../portraits/renderer-v1.js');

// The renderer is frozen at V1. These tests guard the *integration* — that a
// face is minted once and then survives every path a player can take through
// the game: signing day, the save file, a transfer and the archive.

test('portrait identity is minted for every player and school',async()=>{
 const e=loadEngine({seed:4242,indexedDB:new IDBFactory()});await e.loadSchools();
 e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,players=u.teams.flatMap(t=>t.roster);
 assert.ok(players.length>10000,`expected a full universe, got ${players.length}`);
 for(const p of players.slice(0,500)){
  assert.ok(p.portraitSeed,'every player carries a seed');
  assert.equal(p.portraitVersion,e.PORTRAIT_VERSION);
  assert.ok(p.jerseyNumber>=1&&p.jerseyNumber<=99,`jersey ${p.jerseyNumber} out of range`);
 }
 const seeds=new Set(players.map(p=>p.portraitSeed));
 assert.equal(seeds.size,players.length,'seeds are unique across the universe');
 for(const t of u.teams){assert.match(t.primary,/^#[0-9a-f]{6}$/);assert.match(t.secondary,/^#[0-9a-f]{6}$/)}
 assert.ok(new Set(u.teams.map(t=>t.primary)).size>100,'schools do not all share one colour');
});

test('the same seed always paints the same face, and different seeds do not',()=>{
 const base={id:'x',pos:'QB',height:74,weight:215,eligibilityUsed:1,portraitSeed:'seed-a',portraitVersion:1};
 const school={primary:'#123456',secondary:'#abcdef'};
 const a=JSON.stringify(P.drawingCommands(P.prepare(base,school)));
 const b=JSON.stringify(P.drawingCommands(P.prepare({...base},school)));
 assert.equal(a,b,'identical inputs paint identically');
 const c=JSON.stringify(P.drawingCommands(P.prepare({...base,portraitSeed:'seed-b'},school)));
 assert.notEqual(a,c,'a different seed paints a different face');
 // Identity must not follow the jersey.
 const d=P.prepare(base,school).identity,eIdent=P.prepare(base,{primary:'#000000',secondary:'#ffffff'}).identity;
 assert.deepEqual(d,eIdent,'school colours never change who the player is');
});

test('a recruit keeps his face through signing day',async()=>{
 const e=loadEngine({seed:77,indexedDB:new IDBFactory()});await e.loadSchools();
 e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;
 for(const r of u.recruits.slice(0,50)){assert.ok(r.portraitSeed,'recruits carry a seed too')}
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 const signed=u.recruits.filter(r=>r.committed);
 assert.ok(signed.length>1000,'a full signing class exists');
 const before=new Map(signed.map(r=>[r.name+'|'+r.portraitSeed,r.portraitSeed]));
 e.runSpringCamp();e.runFallCamp();e.runOffseason();
 const freshmen=u.teams.flatMap(t=>t.roster).filter(p=>p.origin&&p.origin.includes('star recruit'));
 assert.ok(freshmen.length>0,'signees joined rosters');
 let carried=0;
 for(const p of freshmen){if([...before.values()].includes(p.portraitSeed))carried++}
 assert.ok(carried>freshmen.length*0.9,
  `expected signees to keep their recruiting-board face, only ${carried}/${freshmen.length} did`);
});

test('a face survives the save file, a transfer and the archive',async()=>{
 const e=loadEngine({seed:31337,indexedDB:new IDBFactory()});await e.loadSchools();
 e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,p=u.teams[0].roster[0];
 const seed=p.portraitSeed,ver=p.portraitVersion,num=p.jerseyNumber;
 assert.ok(seed);
 e.rebuildIndexes();await e.saveBrowser();await e.loadBrowser();await e.ensureArchiveLoaded();
 const loaded=e.findPlayer(p.id);
 assert.equal(loaded.p.portraitSeed,seed,'seed survives a browser save round-trip');
 assert.equal(loaded.p.portraitVersion,ver);
 assert.equal(loaded.p.jerseyNumber,num);
 // Drive players into the archive and confirm the seed is on the slim record.
 for(let i=0;i<2;i++){e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason()}
 await e.ensureArchiveLoaded();
 const archive=e.universe.playerArchive||[];
 assert.ok(archive.length>0,'players reached the archive');
 const withSeed=archive.filter(r=>r.portraitSeed).length;
 assert.ok(withSeed>archive.length*0.95,
  `archived players keep their face: only ${withSeed}/${archive.length} carry a seed`);
});

test('an old save with no portrait data is migrated, not broken',async()=>{
 const e=loadEngine({seed:555,indexedDB:new IDBFactory()});await e.loadSchools();
 e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;
 // Simulate a pre-portrait save: strip every portrait field and the colours.
 for(const t of u.teams){delete t.primary;delete t.secondary;
  for(const p of t.roster){delete p.portraitSeed;delete p.portraitVersion;delete p.jerseyNumber}}
 e.normalizeUniverse();
 const players=u.teams.flatMap(t=>t.roster);
 for(const p of players.slice(0,300)){
  assert.ok(p.portraitSeed,'migration backfills a seed');
  assert.equal(p.portraitVersion,e.PORTRAIT_VERSION);
  assert.ok(p.jerseyNumber>=1&&p.jerseyNumber<=99);
 }
 for(const t of u.teams){assert.match(t.primary,/^#[0-9a-f]{6}$/,'migration backfills school colours')}
});

// The header, the status line and the page title have drifted apart before —
// v0.9.3 shipped with portraits while still calling itself v0.9.2. The build
// now refuses to produce a mismatched page; this keeps `npm test` honest too.
test('every version source agrees',()=>{
 const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..');
 const rd=f=>fs.readFileSync(path.join(root,f),'utf8');
 const version=rd('VERSION.txt').trim().replace(/^Dynasty Lab\s*/,'').replace(/^v/,'');
 assert.match(version,/^\d+\.\d+\.\d+$/,`VERSION.txt should hold a bare semver, got "${version}"`);
 const appVersion=(rd('app.js').match(/APP_VERSION='([^']+)'/)||[])[1];
 assert.equal(appVersion,version,'app.js APP_VERSION matches VERSION.txt');
 assert.equal(JSON.parse(rd('package.json')).version,version,'package.json matches VERSION.txt');
 // The header must be a build-filled placeholder, never a literal that can rot.
 assert.match(rd('body.html'),/<span data-app-version>/,'header carries a version placeholder');
 // And the built artifact must actually show it in all three places.
 const built=rd('index.html');
 assert.ok(built.includes(`<title>Dynasty Lab v${version}</title>`),'built title shows the version');
 assert.ok(built.includes(`<span data-app-version>v${version}</span>`),'built header shows the version');
 assert.ok(built.includes(`APP_VERSION='${version}'`),'built script carries the version');
});
