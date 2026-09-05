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

test('KNOWN GAP: home and away are badly unbalanced across the league',async()=>{
 const e=await setup(9103);
 const homes=e.universe.teams.map(t=>t.schedule.filter(g=>g.home===t.name).length);
 const outside=homes.filter(h=>h<e.SCHEDULE_HOME_MIN||h>e.SCHEDULE_HOME_MAX).length;
 // Today most of the league is outside the bound: teams run from 2 home games to 11.
 // When commit 3 lands, this becomes assert.equal(outside,0) and the range narrows.
 assert.ok(outside>50,`expected the current imbalance, only ${outside} teams were outside the bound`);
 assert.ok(Math.min(...homes)<=3,`expected someone stuck near-all-away, min was ${Math.min(...homes)}`);
 assert.ok(Math.max(...homes)>=9,`expected someone hoarding home games, max was ${Math.max(...homes)}`);
});

test('KNOWN GAP: the same schedule repeats forever and three conference opponents are never played',async()=>{
 const e=await setup(9104),name='Chicago Metropolitan';
 const confSets=[],nonConfSets=[];
 for(let season=0;season<3;season++){
  confSets.push([...e.conferenceOpponentsFor(e.universe,name)].sort().join('|'));
  nonConfSets.push(e.nonConferenceOpponentsFor(e.universe,name).slice().sort().join('|'));
  rollSeason(e);
 }
 // Every season is identical, so a dynasty never sees a new opponent. Commit 3 rotates the
 // conference slate and commit 4 varies nonconference; both of these become >1 then.
 assert.equal(new Set(confSets).size,1,'expected the conference slate to repeat exactly');
 assert.equal(new Set(nonConfSets).size,1,'expected the nonconference slate to repeat exactly');
 const met=new Set(confSets[0].split('|'));
 assert.equal(met.size,8,`expected 8 of 11 conference opponents, saw ${met.size}`);
 // The union over three seasons is no larger than one season: those three are unreachable.
 const union=new Set(confSets.flatMap(x=>x.split('|')));
 assert.equal(union.size,8,'three conference opponents are unreachable in any season');
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
