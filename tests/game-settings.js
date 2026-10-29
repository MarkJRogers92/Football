const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('a dynasty with no settings plays at the neutral defaults',async()=>{
 const e=await setup(3101);
 assert.deepEqual(e.gameSettings(),{boardPatience:1,injuryRate:1,recruitingEdge:0});
 delete e.universe.settings;
 assert.equal(e.gameSetting('injuryRate'),1,'an old save without settings is neutral');
});

test('settings are bounded and ignore junk',async()=>{
 const e=await setup(3102);
 assert.equal(e.setGameSetting('injuryRate',99),true);assert.equal(e.gameSetting('injuryRate'),2,'clamped to the maximum');
 assert.equal(e.setGameSetting('injuryRate','abc'),false);assert.equal(e.gameSetting('injuryRate'),2,'junk does not overwrite');
 assert.equal(e.setGameSetting('nonsense',1),false);
 e.universe.settings.boardPatience='oops';assert.equal(e.gameSetting('boardPatience'),1,'a corrupt value falls back');
});

test('settings survive a save round trip',async()=>{
 const e=await setup(3103);
 e.setGameSetting('boardPatience',1.3);e.setGameSetting('recruitingEdge',-6);
 const packed=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));
 assert.deepEqual(packed.settings,{boardPatience:1.3,recruitingEdge:-6});
});

test('injury rate scales how many players get hurt',async()=>{
 const count=async rate=>{
  const e=await setup(3104);e.setGameSetting('injuryRate',rate);
  const teams=e.universe.teams.slice(0,40);for(const t of teams)for(const p of t.roster){p.injuryWeeks=0;p.wear=60}
  for(let g=0;g<6;g++)for(const t of teams)e.postGameCondition(t);
  return teams.reduce((n,t)=>n+t.roster.filter(p=>p.injuryWeeks>0).length,0);
 };
 const few=await count(.3),many=await count(2);
 assert.ok(many>few*1.5,`more injuries at the high setting (${few} vs ${many})`);
});

test('board patience only softens losing seasons',async()=>{
 const review=async(patience,wins)=>{
  const e=await setup(3105);e.setGameSetting('boardPatience',patience);
  const t=e.T('Chicago Metropolitan');t.adminConfidence=60;t.w=wins;t.l=12-wins;t.champ=false;
  return e.adminSeasonReview(t).delta;
 };
 const badStandard=await review(1,2),badPatient=await review(1.6,2);
 assert.ok(badStandard<0&&badPatient<0&&badPatient>badStandard,`patient board hurts less (${badStandard} vs ${badPatient})`);
 const goodStandard=await review(1,11),goodPatient=await review(1.6,11);
 assert.equal(goodPatient,goodStandard,'a winning season is untouched');
});

test('the recruiting edge changes only the controlled program’s pitch',async()=>{
 const e=await setup(3106),mine=e.T('Chicago Metropolitan'),other=e.universe.teams.find(t=>t.name!==mine.name),r=e.universe.recruits[0];
 const base={mine:e.recruitPitch(mine,r),other:e.recruitPitch(other,r)};
 e.setGameSetting('recruitingEdge',6);
 assert.equal(e.recruitPitch(mine,r)-base.mine,6);
 assert.equal(e.recruitPitch(other,r),base.other,'rivals are unchanged');
 assert.ok(e.recruitPitchBreakdown(mine,r).some(([label,v])=>label==='Game setting'&&v===6),'the breakdown explains the extra points');
});
