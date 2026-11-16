const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeFatigue}=require('../fatigue.js');
const adapter=require('../game-engine-v2-adapter.js');
const {loadEngine}=require('../tools/harness.js');

const roster=(starter,backup)=>{const out=[];let i=0;const add=(pos,n,v)=>{for(let k=0;k<n;k++)out.push({id:`${pos}${i++}`,pos,trueNow:v})};
 for(const [pos,[s,b]] of Object.entries({RB:[1,1],WR:[3,2],TE:[1,1],OT:[2,1],OG:[2,1],C:[1,1],EDGE:[2,2],DT:[2,2],LB:[3,1],CB:[2,2],S:[2,1]})){add(pos,s,starter);add(pos,b,backup)}return out};

test('the late-game penalty grows with the gap between starters and the players who rotate in, and is capped',()=>{
 const F=makeFatigue({});
 assert.equal(F.gap({roster:roster(80,74)},'off'),6);
 assert.deepEqual(F.forTeam({roster:roster(80,80)}),{off:0,def:0},'no drop-off, no penalty');
 assert.deepEqual(F.forTeam({roster:roster(80,76)}),{off:.5,def:.5},'the base at a four-point gap');
 assert.deepEqual(F.forTeam({roster:roster(80,72)}),{off:1.9,def:1.9});
 assert.deepEqual(F.forTeam({roster:roster(90,50)}),{off:F.MAX,def:F.MAX});
 // An unavailable backup leaves a replacement-level hole.
 const r=roster(80,76);const G=makeFatigue({available:p=>p.id!=='RB1'});
 assert.ok(G.forTeam({roster:r}).off>F.forTeam({roster:r}).off);
});

test('quick simulation folds a quarter of the penalty into the rotating units only',()=>{
 const F=makeFatigue({});
 const p={qb:80,skill:80,ol:80,front:80,coverage:80,offense:80,defense:80,overall:80};
 const b=F.blend(p,{off:2,def:1});
 assert.equal(b.qb,80,'the quarterback does not rotate');assert.equal(b.skill,79.5);assert.equal(b.ol,79.5);assert.equal(b.offense,79.5);
 assert.equal(b.front,79.75);assert.equal(b.defense,79.75);assert.equal(b.overall,79.625);assert.equal(p.skill,80,'a copy');
});

test('detailed games carry fatigue only when the profile has it and apply it from the fourth quarter',()=>{
 const t={id:1,name:'A'};
 assert.deepEqual(adapter.profileTeam(t,{overall:80}),{id:1,name:'A',rating:80,offense:80,defense:80},'older inputs are unchanged');
 const tired=adapter.profileTeam(t,{overall:80,fatigueOff:1.4,fatigueDef:9});
 assert.equal(tired.fatigueOff,1.4);assert.equal(tired.fatigueDef,3);
 const fresh={offense:80,defense:80};
 assert.deepEqual(adapter.lateGameRatings({period:3},tired,fresh),{off:80,def:80},'the third quarter is untouched');
 assert.deepEqual(adapter.lateGameRatings({period:4},tired,fresh),{off:78.6,def:80},'the tired offense loses its penalty');
 assert.deepEqual(adapter.lateGameRatings({period:5},fresh,tired),{off:80,def:77},'and so does a tired defense in overtime');
});

test('over many games a deep team does better in the fourth quarter only',()=>{
 const home={id:1,name:'A'},away={id:2,name:'B'};
 const diff=(hf,af)=>{let q4=0,early=0;for(let i=0;i<600;i++){const r=adapter.simulateShadow({gameId:'D'+i,seed:'depth'+i,home,away,homeProfile:{overall:80,...hf},awayProfile:{overall:80,...af},homeFieldRating:0,openingReceiver:i%2?'home':'away'});
  for(const e of r.state.events)if(e.points){const d=(e.team==='home'?1:-1)*e.points;if(e.state?.period>=4)q4+=d;else early+=d}}return{q4,early}};
 const even=diff({},{}),deep=diff({fatigueOff:.5,fatigueDef:.5},{fatigueOff:3,fatigueDef:3});
 assert.equal(deep.early,even.early,'the first three quarters are identical');
 assert.ok(deep.q4>even.q4,`the deep side gains late: ${even.q4} → ${deep.q4}`);
});

test('in the game, profiles carry the late penalty and quick simulation still plays',async()=>{
 const e=loadEngine({seed:4141,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');if(u.phase==='preseason')e.beginSeason();
 const p=e.gameProfiles(t,'Nobody');assert.ok(p.fatigueOff>=0&&p.fatigueOff<=3&&p.fatigueDef>=0&&p.fatigueDef<=3);
 assert.ok(globalThis.DynastyFatigue);
 e.simWeek();assert.equal(u.week,1);
});
