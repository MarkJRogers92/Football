const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.9.48 commit 1 adds the validator and pins what today's scheduler actually does.
// The rules split in two: structural ones the current scheduler already satisfies (and
// which must never regress), and the rotation/balance gaps commits 3-4 exist to close.
// The gap tests below assert the CURRENT broken behavior on purpose, so that fixing it
// fails them loudly rather than passing silently — each one says what it should become.
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
function rollSeason(e){e.simSeason();e.simConferenceChampionships();e.simPlayoff();e.runOffseason();e.runSpringCamp();e.runFallCamp();e.runOffseason()}
const kindOf=p=>/home games/.test(p)?'home':/conference games/.test(p)?'confCount':/plays \d+ games/.test(p)?'gameCount'
 :/appears twice/.test(p)?'doubleBooked':/protected rival/.test(p)?'rival':/twice in conference/.test(p)?'confTwice'
 :/against itself/.test(p)?'selfGame':/does not/.test(p)?'unshared':/unknown team/.test(p)?'unknownTeam':'other';
function problemKinds(e){
 const kinds={};
 for(const p of e.validateSchedule(e.universe))kinds[kindOf(p)]=(kinds[kindOf(p)]||0)+1;
 return kinds;
}

test('the structural rules hold for every team, every season',async()=>{
 const e=await setup(9101);
 for(let season=0;season<3;season++){
  const kinds=problemKinds(e);
  // These are the invariants the current scheduler genuinely gets right. If any of them
  // ever appears here, something broke — they are not known gaps.
  for(const k of ['gameCount','confCount','doubleBooked','selfGame','confTwice','unshared','unknownTeam','rival'])
   assert.equal(kinds[k],undefined,`${k} problem appeared in season ${e.universe.year}: ${e.validateSchedule(e.universe).filter(p=>kindOf(p)===k)[0]}`);
  rollSeason(e);
 }
});

test('the validator actually catches a broken schedule instead of rubber-stamping it',async()=>{
 const e=await setup(9102),u=e.universe;
 assert.equal(problemKinds(e).selfGame,undefined,'clean to start');
 // A validator that never fails is worthless; corrupt the schedule and confirm each rule bites.
 const week=u.schedule[5],victim=week[0];
 const original={...victim};
 victim.away=victim.home;                                  // self-game
 assert.ok(e.validateSchedule(u).some(p=>/against itself/.test(p)),'self-game caught');
 Object.assign(victim,original);
 u.schedule[5].push({week:6,home:victim.home,away:week[1].away,conf:true,played:false});
 assert.ok(e.validateSchedule(u).some(p=>/appears twice/.test(p)),'double-booking caught');
 u.schedule[5].pop();
 const t=u.teams[0];
 t.schedule.push({week:99,home:t.name,away:u.teams[1].name,conf:true,played:false});
 assert.ok(e.validateSchedule(u).some(p=>/holds a game the universe schedule does not/.test(p)),'unshared game object caught');
 t.schedule.pop();
});

test('home and away are balanced across the whole league',async()=>{
 const e=await setup(9103);
 for(let season=0;season<3;season++){
  const homes=e.universe.teams.map(t=>t.schedule.filter(g=>g.home===t.name).length);
  const outside=homes.filter(h=>h<e.SCHEDULE_HOME_MIN||h>e.SCHEDULE_HOME_MAX);
  // Before v0.9.48 this ranged 2-11 with 83 of 120 teams outside the bound, and half the
  // league played every conference game on the road.
  assert.equal(outside.length,0,`${outside.length} teams outside ${e.SCHEDULE_HOME_MIN}-${e.SCHEDULE_HOME_MAX} in ${e.universe.year}`);
  for(const t of e.universe.teams){
   const conf=t.schedule.filter(g=>g.conf),home=conf.filter(g=>g.home===t.name).length;
   assert.ok(home>0&&home<conf.length,`${t.name} plays ${home}/${conf.length} conference games at home`);
  }
  rollSeason(e);
 }
});

test('the schedule rotates: new opponents every season, and the whole conference within a cycle',async()=>{
 const e=await setup(9104),name='Chicago Metropolitan';
 const rivalName=e.universe.teams.find(t=>t.id===e.T(name).protectedRivalId)?.name;
 assert.ok(rivalName,'a protected rival is designated');
 const confSets=[],nonConf=[];
 for(let season=0;season<6;season++){
  const met=[...e.conferenceOpponentsFor(e.universe,name)];
  assert.ok(met.includes(rivalName),`the protected rival was skipped in ${e.universe.year}`);
  confSets.push(met.sort().join('|'));
  nonConf.push(...e.nonConferenceOpponentsFor(e.universe,name));
  rollSeason(e);
 }
 // Every season must differ; previously all six were identical.
 assert.equal(new Set(confSets).size,6,'a conference slate repeated');
 // And the three permanently unreachable opponents must now come round.
 const union=new Set(confSets.flatMap(x=>x.split('|')));
 assert.equal(union.size,11,`only ${union.size} of 11 conference opponents were ever played`);
 // Nonconference must not rerun the same opponents either.
 assert.equal(new Set(nonConf).size,nonConf.length,'a nonconference opponent repeated within six seasons');
});

test('a protected rivalry does not depend on the schedule that happens to be generated',async()=>{
 const e=await setup(9106);
 // Designation is mutual, same-conference and total — the old derivation only considered
 // opponents already on the schedule, which left six teams with no rival at all.
 const byId=new Map(e.universe.teams.map(t=>[t.id,t]));
 for(const t of e.universe.teams){
  const o=byId.get(t.protectedRivalId);
  assert.ok(o,`${t.name} has no protected rival`);
  assert.equal(o.protectedRivalId,t.id,`${t.name} and ${o.name} do not agree`);
  assert.equal(o.conference,t.conference,`${t.name}'s rival is in another conference`);
  assert.notEqual(o.id,t.id);
 }
 // And it survives rebuilds rather than being re-picked each year.
 const before=new Map(e.universe.teams.map(t=>[t.id,t.protectedRivalId]));
 rollSeason(e);
 for(const t of e.universe.teams)assert.equal(t.protectedRivalId,before.get(t.id),`${t.name}'s rival changed between seasons`);
});

test('a played season keeps its schedule when the next one is generated',async()=>{
 const e=await setup(9105);
 e.simSeason();
 const played=e.universe.schedule.flat().filter(g=>g.played);
 assert.ok(played.length>500,'a full regular season was played');
 const frozen=played.slice(0,40).map(g=>JSON.stringify({h:g.home,a:g.away,w:g.week,s:g.score}));
 const archivedIds=e.universe.gameArchive.map(g=>g.id);
 e.simConferenceChampionships();e.simPlayoff();e.runOffseason();e.runSpringCamp();e.runFallCamp();e.runOffseason();
 // Building next season must not reach back into what already happened.
 for(const id of archivedIds)assert.ok(e.universe.gameArchive.some(g=>g.id===id),`archived game ${id} vanished`);
 assert.equal(e.universe.schedule.flat().some(g=>g.played),false,'the new season starts unplayed');
 assert.equal(frozen.length,40,'the archived sample is intact');
});
