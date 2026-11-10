// Quick-simulated league games must have the same one-score/blowout mix as the live Game Engine 2, otherwise the
// controlled team's coached games and the rest of the league's results come from different worlds.
const test=require('node:test'),assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness.js');
const clone=v=>JSON.parse(JSON.stringify(v)),mean=a=>a.reduce((x,y)=>x+y,0)/a.length;

test('league quick-sim margins are not far tighter than live games',async()=>{
 const rows=[];
 for(const seed of [5,6]){
  const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();const u=e.universe;
  u.schedule.slice(0,6).forEach((games,i)=>games.forEach(g=>{
   const home=e.T(g.home),away=e.T(g.away),gap=e.gameProfiles(clone(home),away.name).overall-e.gameProfiles(clone(away),home.name).overall;
   const r=e.gameSim(clone(home),clone(away),false,false,{week:i+1,label:'spread test'});
   rows.push({margin:Math.abs(r.hp-r.ap),total:r.hp+r.ap,gap,favoriteWon:(r.hp>r.ap)===(gap>0)});
  }));
 }
 const share=f=>rows.filter(f).length/rows.length,favored=rows.filter(r=>Math.abs(r.gap)>=8);
 assert.ok(mean(rows.map(r=>r.margin))>12&&mean(rows.map(r=>r.margin))<16,'mean margin near the live engine (13.8)');
 assert.ok(share(r=>r.margin<=8)<.45,'fewer than 45% of games within a score');
 assert.ok(share(r=>r.margin>=28)>.05&&share(r=>r.margin>=28)<.16,'some blowouts, but not a rout every week');
 assert.ok(mean(rows.map(r=>r.total))>38&&mean(rows.map(r=>r.total))<46,'scoring level unchanged');
 assert.ok(favored.filter(r=>r.favoriteWon).length/favored.length>.72,'clearly better teams still usually win');
});
