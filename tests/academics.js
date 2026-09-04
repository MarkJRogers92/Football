const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('the program a player is at actually changes what he can sustain',async()=>{
 const e=await setup(2701),u=e.universe;
 const strong=u.teams.find(t=>t.academics>=78),weak=u.teams.find(t=>t.academics<=50);
 assert.ok(strong&&weak,'the league has both kinds of program');
 const p={iq:60,wear:0};
 assert.ok(e.academicTarget(p,strong)>e.academicTarget(p,weak),
  'the same player sustains more at a stronger academic program');
 assert.ok(e.academicTarget({iq:90,wear:0},weak)>e.academicTarget({iq:30,wear:0},weak),
  'and a smarter player sustains more anywhere');
 assert.ok(e.academicTarget({iq:60,wear:90},strong)<e.academicTarget({iq:60,wear:0},strong),
  'a heavy season drags on it');
 for(const t of [strong,weak])for(const iq of [5,50,99])for(const wear of [0,100]){
  const v=e.academicTarget({iq,wear},t);assert.ok(v>=5&&v<=99,`target stays bounded (${v})`);
 }
});

test('every player is seeded and standing drifts rather than jumping',async()=>{
 const e=await setup(2702),me=e.T('Chicago Metropolitan');
 for(const p of me.roster)assert.ok(Number.isFinite(p.academicStanding),`${p.name} is seeded`);
 const p=me.roster[0];
 const target=e.academicTarget(p,me);
 const before=p.academicStanding=Math.min(99,target+30);
 e.advanceAcademics(me);
 assert.ok(p.academicStanding<before,'a standing above what the program sustains drifts down');
 assert.ok(p.academicStanding>target,'but does not snap to the target in one week');
 assert.ok(before-p.academicStanding<15,'the move is a drift, not a jump');
});

test('falling through the floor costs you the player, and the gate is the one everything uses',async()=>{
 const e=await setup(2703),u=e.universe,me=e.T('Chicago Metropolitan');
 const p=me.roster.find(x=>!x.redshirtActive&&(x.injuryWeeks||0)===0);
 assert.equal(e.gameAvailable(p),true,'available to begin with');
 // A genuinely at-risk case: a weak student carrying a heavy season at a thin-support program.
 me.academics=38;p.iq=18;p.wear=85;
 assert.ok(e.academicTarget(p,me)<38,'this player cannot sustain much here');
 let held=[],weeks=0;
 while(!held.some(x=>x.id===p.id)&&weeks++<25)held=e.advanceAcademics(me);
 assert.ok(held.some(x=>x.id===p.id),`he drifts through the floor (after ${weeks} weeks)`);
 assert.ok(weeks>1,'and it took more than one week, so it was visible coming');
 assert.equal(e.academicallyIneligible(p),true);
 assert.equal(e.gameAvailable(p),false,'and the shared availability gate excludes him');
 assert.ok(!e.participants(me).some(x=>x.id===p.id),'so no selection path can field him');
 assert.ok(u.events.some(x=>x.type==='ACADEMIC_INELIGIBLE'&&x.playerIds[0]===p.id));
 // The hold is finite and leaves him above the floor rather than instantly ineligible again.
 e.advanceAcademics(me);e.advanceAcademics(me);
 assert.equal(e.academicallyIneligible(p),false,'the hold expires');
 assert.equal(p.academicHold,0);
 assert.equal(e.gameAvailable(p),true);
 assert.ok(p.academicStanding>=30,'and he comes back off the floor');
});

test('the Coach\'s Desk trade-off costs something on every branch',async()=>{
 const e=await setup(2704),me=e.T('Chicago Metropolitan');
 const p=me.roster.find(x=>!x.redshirtActive);
 const read=()=>({s:p.academicStanding,f:e.familiarity?e.familiarity(p,p.pos):null});
 p.academicStanding=40;
 e.applyAcademicDecision(p,me,'study');
 assert.equal(p.academicStanding,46,'study table is worth six');
 assert.equal(p.academicPlan.id,'study');
 p.academicStanding=40;
 e.applyAcademicDecision(p,me,'balance');
 assert.equal(p.academicStanding,42,'splitting the week is worth two');
 p.academicStanding=40;
 e.applyAcademicDecision(p,me,'practice');
 assert.equal(p.academicStanding,40,'and keeping him at practice buys nothing');
 assert.equal(p.academicPlan.id,'practice','but the choice is still recorded');
});

test('a struggling player reaches the Coach\'s Desk before he is lost',async()=>{
 const e=await setup(2705),u=e.universe,me=e.T('Chicago Metropolitan');
 const p=me.roster.find(x=>!x.redshirtActive);
 p.academicStanding=36;                       // on watch, still eligible
 const d=e.academicDecision(me,new Set());
 assert.ok(d,'a decision is offered');
 assert.equal(d.type,'ACADEMIC_WATCH');
 assert.equal(d.playerId,p.id,'and it is about the player closest to the floor');
 assert.equal(d.options.length,3);
 assert.ok(d.summary.includes(String(me.academics)),'the summary names the program support level');
 // Nobody at risk means no card; the desk should not manufacture one.
 for(const x of me.roster)x.academicStanding=80;
 assert.equal(e.academicDecision(me,new Set()),null);
});

test('the wire escalates from watch to ineligible',async()=>{
 const e=await setup(2706),me=e.T('Chicago Metropolitan');
 for(const x of me.roster)x.academicStanding=80;
 assert.equal(e.academicHubItems(me).length,0,'a healthy roster says nothing');
 const p=me.roster.find(x=>!x.redshirtActive);
 p.academicStanding=36;
 const watch=e.academicHubItems(me);
 assert.equal(watch[0].kicker,'ACADEMIC WATCH');
 assert.equal(watch[0].importance,56);
 p.academicHold=2;
 const out=e.academicHubItems(me);
 assert.equal(out[0].kicker,'ACADEMICS');
 assert.equal(out[0].importance,74,'losing him outranks merely worrying about him');
});
