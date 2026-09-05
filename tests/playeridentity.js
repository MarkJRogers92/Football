const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

const QB_STYLES=['Rhythm Distributor','Field Architect','Off-Script Creator','Vertical Hunter','Power Creator','Run-First Weapon','Toolsy Project','Backyard Magician'];

test('QB rushing opportunity follows the actual player identity and scheme',()=>{
 const e=loadEngine({seed:940});
 for(const offScheme of Object.keys(e.OFF_SCHEMES)){
  const team={offScheme},make=style=>({style,speed:78,versatility:76,trueNow:80});
  const weights=QB_STYLES.map(style=>e.qbRushWeight(make(style),team));
  assert.ok(weights.every(x=>x>=.02&&x<=.26),`${offScheme} weights stay bounded`);
  assert.ok(e.qbRushWeight(make('Run-First Weapon'),team)>e.qbRushWeight(make('Rhythm Distributor'),team),`${offScheme} distinguishes player styles`);
 }
 const q={style:'Run-First Weapon',speed:82,versatility:82,trueNow:80};
 assert.ok(e.qbRushWeight(q,{offScheme:'Option Motion'})>e.qbRushWeight(q,{offScheme:'Rhythm Control'}),'scheme changes the same player usage');
 assert.ok(e.qbRushWeight({...q,speed:95,versatility:95},{offScheme:'Multiple'})>e.qbRushWeight({...q,speed:55,versatility:55},{offScheme:'Multiple'}),'mobility ratings change usage within a style');
});

async function optionGame(style){
 const e=loadEngine({seed:941});await e.loadSchools();
 e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const home=e.T('Chicago Metropolitan'),away=e.universe.teams.find(t=>t.id!==home.id),q=e.roleStarter(home,'QB1');
 home.offScheme='Option Motion';q.style=style;q.speed=84;q.versatility=84;
 e.gameSim(home,away,true);
 const teamAttempts=home.roster.reduce((n,p)=>n+(p.stats.rushAtt||0),0);
 return {qbAttempts:q.stats.rushAtt,teamAttempts};
}

test('quick simulation gives a run-first QB more of identical team rushing volume',async()=>{
 const runFirst=await optionGame('Run-First Weapon'),rhythm=await optionGame('Rhythm Distributor');
 assert.equal(runFirst.teamAttempts,rhythm.teamAttempts,'style does not fabricate team attempts');
 assert.ok(runFirst.qbAttempts>rhythm.qbAttempts,`${runFirst.qbAttempts} run-first attempts vs ${rhythm.qbAttempts} rhythm attempts`);
});
