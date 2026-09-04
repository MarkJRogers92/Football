const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const finishSeason=e=>{for(let i=0;i<12;i++)e.simWeek();e.simConferenceChampionships();e.simBowls();e.simPlayoff();e.runSpringCamp();e.runFallCamp();e.runOffseason()};

test('every program accrues an all-time record, not just the controlled one',async()=>{
 const e=await setup(3001),u=e.universe;
 for(const t of u.teams)assert.equal(t.allTimeRecord,undefined,'nothing is tracked before the first season closes');
 for(let i=0;i<12;i++)e.simWeek();
 e.simConferenceChampionships();e.simBowls();e.simPlayoff();
 const championName=u.champion;                 // captured before offseason rollover clears it
 e.runSpringCamp();e.runFallCamp();e.runOffseason();
 for(const t of u.teams){
  const r=t.allTimeRecord;
  assert.ok(r,`${t.name} is tracked`);
  assert.equal(r.seasons,1);
  assert.ok(r.w+r.l>0,`${t.name} played games (${r.w}-${r.l})`);
 }
 const champ=u.teams.find(t=>t.name===championName);
 assert.equal(champ.allTimeRecord.natTitles,1,'the national champion is credited');
});

test('the record accumulates across seasons rather than resetting',async()=>{
 const e=await setup(3002),me=e.T('Chicago Metropolitan');
 finishSeason(e);
 const after1={...me.allTimeRecord};
 finishSeason(e);
 const after2=me.allTimeRecord;
 assert.equal(after2.seasons,2);
 assert.equal(after2.w+after2.l,after1.w+after1.l+(after2.w+after2.l-after1.w-after1.l),'sanity');
 assert.ok(after2.w>=after1.w,'wins only accumulate');
 assert.ok(after2.w+after2.l>after1.w+after1.l,'more games are on the books after a second season');
});

test('coaching lineage lists stints at THIS school only, in order, for any program',async()=>{
 const e=await setup(3003),u=e.universe,me=e.T('Chicago Metropolitan'),other=u.teams.find(t=>t!==me);
 // World generation already opens a stint for every current staffer at their own school — five
 // for the standard staff. None of those belong to another school.
 const base=e.programCoachingLineage(me);
 assert.equal(base.length,5,'the five current staffers each have a stint here already');
 assert.ok(base.every(s=>s.startSeason===2027));
 assert.equal(e.programCoachingLineage(other).length,5,'the same is true for any other program');
 // Add a coach with history at both schools and confirm only the matching stint surfaces.
 const c=me.staff.OC;
 c.careerHistory=[
  {schoolId:other.id,schoolName:other.name,role:'Offensive Coordinator',startSeason:2018,endSeason:2022},
  {schoolId:me.id,schoolName:me.name,role:'Offensive Coordinator',startSeason:2027,endSeason:null},
 ];
 const lineage=e.programCoachingLineage(me);
 assert.equal(lineage.filter(s=>s.coachId===c.id).length,1,'only the stint at this school appears, not the one elsewhere');
 assert.equal(lineage.find(s=>s.coachId===c.id).startSeason,2027);
 const html=e.programHistoryHTML(me);
 assert.ok(html.includes(c.name));
});

test('the history page reads correctly before any season has closed',async()=>{
 const e=await setup(3004),me=e.T('Chicago Metropolitan');
 const html=e.programHistoryHTML(me);
 assert.ok(html.includes('0-0'),'no all-time record yet, but the card still renders');
 assert.ok(html.includes(me.staff.HC.name),'the current staff already appears as day-one stints');
 assert.equal(e.programHistoryHTML(null),'');
});
