// Early rankings carry what a team's strength says to expect, so one result cannot throw a contender across the
// poll; from week ten on the formula is the plain record/strength/schedule/margin score it always was.
const test=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness.js');

test('a top-ten team that loses its opener stays near the top, and late rankings are unchanged',async()=>{
 const e=loadEngine({seed:31});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 e.ranked();const pre=Object.fromEntries(e.universe.teams.map(t=>[t.name,t.rank]));
 e.simWeek();e.ranked();
 const losers=e.universe.teams.filter(t=>pre[t.name]<=10&&t.l===1);
 for(const t of losers)assert.ok(t.rank<=35,`${t.name} fell from ${pre[t.name]} to ${t.rank}`);
 for(let w=1;w<10;w++)e.simWeek();
 for(const t of e.universe.teams){
  const g=t.w+t.l;assert.ok(g>=10);
  const old=(t.w/g)*60+e.profiles(t).overall*.22+(t.sos/g)*.10+Math.max(-20,Math.min(20,(t.pf-t.pa)/g))*.4;
  assert.ok(Math.abs(e.rankingScore(t)-old)<1e-9,'no prior once ten games are played');
 }
});
