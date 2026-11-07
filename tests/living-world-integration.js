const test=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness'),W=require('../living-world'),L=require('../legacy');
test('two real seasons retain optional follows and accurate titles without presentation changing saves or RNG',async()=>{
 const e=loadEngine({seed:7,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 assert.ok(globalThis.DynastyLivingWorldSnapshot,'full runtime includes the production briefing adapter');
 const u=e.universe,start=u.year;let following=W.emptyStore(),legacy=L.emptyStore(),checks=0;
 let snap=globalThis.DynastyLivingWorldSnapshot.read();const who=snap.people.find(p=>p.kind==='player');assert.ok(who);
 following=W.toggleFollow(following,snap,who.key);
 function check(){
  const before=JSON.stringify(e.packUniverse(u)),s=globalThis.DynastyLivingWorldSnapshot.read([who.key]),f=globalThis.DynastyLegacySnapshot.read(),c=globalThis.DynastyCeremonySnapshot.read();
  following=W.reconcile(JSON.parse(JSON.stringify(following)),s);legacy=L.merge(legacy,f).store;
  assert.equal(W.followed(following,s)[0].key,who.key);assert.ok(W.briefing(s,following).items.length<=3);
  assert.equal(JSON.stringify(e.packUniverse(u)),before,'all reads preserve the entire save and gameplay RNG');
  const seasons=new Map(f.seasons.map(x=>[x.year,x]));if(f.current.regularDone&&!seasons.has(f.year))seasons.set(f.year,{year:f.year,...f.current});
  for(const s of seasons.values())assert.equal(s.champ,u.history.some(h=>h.type==='season'&&h.year===s.year&&h.championId===f.program.id));
  assert.equal(legacy.records.confTitles?.value||0,[...seasons.values()].filter(x=>x.confChamp).length,'conference titles counted once');
  assert.equal(legacy.records.titles?.value||0,[...seasons.values()].filter(x=>x.champ).length,'national titles are actual national titles');
  if(u.week===0)assert.ok(!c.milestones.some(m=>m.kind==='bowl'),'old bowl list never becomes a new-year milestone');checks++;
 }
 check();for(let year=0;year<2;year++){
  if(u.phase==='preseason')e.beginSeason();
  for(let w=0;w<4;w++){e.delegateWeeklyDecisions();e.simWeek()}check();
  e.simSeason();e.simConferenceChampionships();e.simBowls();e.simPlayoff();check();
  let guard=0;while(u.phase==='complete'&&guard++<30){
   assert.equal(u.jobOffers?.length||0,0,'seed keeps this coach at the same program');
   const phase=u.offseason?.phase;if(phase==='spring')e.runSpringCamp();else if(phase==='fall')e.runFallCamp();else assert.ok(e.advanceOffseasonPhase());check();
  }
  assert.equal(u.year,start+year+1);
 }
 assert.ok(checks>=15);assert.ok(W.followed(following,globalThis.DynastyLivingWorldSnapshot.read())[0]);
});
