const test=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// Postseason games never passed through weekResultStatus, so the status line (mirrored by the
// ticker, toast and result sting) showed the Week 12 final through the whole postseason.
test('each postseason step posts the controlled program\'s own result',async()=>{
 const e=loadEngine({seed:4411,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const status=()=>document.querySelector('#saveStatus').textContent,me=e.universe.teams.find(t=>t.name==='Chicago Metropolitan');
 e.simSeason();
 const mine=()=>e.universe.gameArchive.filter(g=>g.label&&g.week>12&&(g.home?.id===me.id||g.away?.id===me.id));
 let announced=0;
 for(const step of ['simConferenceChampionships','simBowls','simPlayoff']){
  const before=mine().length,prior=status();e[step]();const after=mine();
  if(after.length>before){
   const g=after.at(-1),home=g.home.id===me.id,us=g.score[home?'home':'away'],them=g.score[home?'away':'home'];
   assert.equal(status().startsWith(`${g.label} final: ${us>them?'W':'L'} ${us}-${them} vs `),true,`${step}: ${status()}`);
   announced++;
   if(g.label==='National Championship'&&us>them)assert.match(status(),/National champions!$/);
  }else assert.equal(status(),prior,`${step} leaves the status alone when the program did not play`);
 }
 assert.ok(announced>=1,'this seed sends the program to at least one postseason game');
});
