const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

const QB_STYLES=['Rhythm Distributor','Field Architect','Off-Script Creator','Vertical Hunter','Power Creator','Run-First Weapon','Toolsy Project','Backyard Magician'];
const PLAYER_TRAITS=['speed','power','technique','iq','composure','durability','versatility'];

test('every archetype is defined by real player traits',()=>{
 const e=loadEngine({seed:939}),styles=Object.values(e.STYLES).flat();
 assert.equal(new Set(styles).size,styles.length,'archetype labels remain unique');
 for(const style of styles){
  assert.equal(e.STYLE_TRAITS[style]?.length,3,`${style} has three rating emphases`);
  assert.ok(e.STYLE_TRAITS[style].every(x=>PLAYER_TRAITS.includes(x)),`${style} uses modeled ratings`);
 }
});

test('archetype assignment follows the generated rating shape',()=>{
 const e=loadEngine({seed:940}),base={speed:40,power:40,technique:40,iq:40,composure:40,durability:40,versatility:40};
 assert.equal(e.styleForTraits('RB',{...base,speed:99,technique:95,iq:90},0),'One-Cut Burner');
 assert.equal(e.styleForTraits('RB',{...base,power:99,durability:95,technique:90},0),'Gap Hammer');
 assert.equal(e.styleForTraits('EDGE',{...base,speed:99,technique:95,versatility:90},0),'Speed Bender');
 const desc=e.styleDescription({pos:'RB',style:'Third-Down Weapon'});
 assert.match(desc,/Archetype emphasis: technique, versatility, processing/);
 assert.match(desc,/receiving opportunity/);
});

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

test('position archetypes direct opportunity without replacing ratings',()=>{
 const e=loadEngine({seed:942}),p=(style,attrs={})=>({style,...attrs});
 assert.ok(e.playerUsageWeight(p('One-Cut Burner'),'carry')>e.playerUsageWeight(p('Third-Down Weapon'),'carry'));
 assert.ok(e.playerUsageWeight(p('One-Cut Burner'),'target')<e.playerUsageWeight(p('Third-Down Weapon'),'target'));
 assert.ok(e.playerUsageWeight(p('Route Sculptor'),'target')>e.playerUsageWeight(p('Vertical Glider'),'target'));
 assert.ok(e.playerUsageWeight(p('Pocket Wrecker'),'rush')>e.playerUsageWeight(p('Run-Side Anchor'),'rush'));
 assert.ok(e.playerUsageWeight(p('Run-Side Anchor'),'tackle')>e.playerUsageWeight(p('Pocket Wrecker'),'tackle'));
 assert.ok(e.playerUsageWeight(p('Ball Hunter'),'takeaway')>e.playerUsageWeight(p('Mirror Corner'),'takeaway'));
 assert.ok(e.playerUsageWeight(p('Coverage Eraser'),'coverage')>e.playerUsageWeight(p('Box Hammer'),'coverage'));
 assert.ok(e.playerUsageWeight(p('Island Protector'),'protect')<e.playerUsageWeight(p('Movement Tackle'),'protect'),'lower protection weight means fewer negative events');
 assert.equal(e.playerUsageWeight(p('Range Kicker'),'fieldGoal'),1,'a starter-only opportunity retains its role allocation');
});

test('specialist ratings drive the outcomes the game records',()=>{
 const e=loadEngine({seed:943}),weak={power:52,technique:52,composure:52},strong={power:92,technique:92,composure:92};
 assert.ok(e.fieldGoalChance(strong,48,true)>e.fieldGoalChance(weak,48,true)+.25,'kicking traits materially change a pressure attempt');
 assert.ok(e.fieldGoalChance(strong,32)>e.fieldGoalChance(strong,55),'distance lowers the same kicker chance');
 assert.ok(e.puntAverage({power:92,technique:88},0)>e.puntAverage({power:52,technique:56},0)+8,'power and technique change punt distance');
 const kick=e.styleDescription({pos:'K',style:'Pressure Leg'}),punt=e.styleDescription({pos:'P',style:'Directional Punter'});
 assert.match(kick,/accuracy\/range/);
 assert.match(punt,/Hang time and direction are not tracked/);
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
