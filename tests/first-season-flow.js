'use strict';

const assert=require('node:assert/strict');
const test=require('node:test');

function flow(){return require('../first-season-flow')}

test('guidance fades after the first four weeks and after the first season',()=>{
  const Flow=flow();
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:0}),'explicit');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:1}),'explicit');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:2}),'concise');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:3}),'concise');
  assert.equal(Flow.guidanceMode({seasonIndex:0,week:4}),'normal');
  assert.equal(Flow.guidanceMode({seasonIndex:1,week:0}),'normal');
});

test('agenda classification preserves authoritative meanings',()=>{
  const Flow=flow();
  const source=[
    {id:'required',meaning:'must_resolve',priority:400,title:'Resolve me'},
    {id:'due',meaning:'decision_due',priority:280,title:'Decide soon'},
    {id:'strong-rec',meaning:'staff_recommendation',priority:225,title:'Worth doing'},
    {id:'ordinary-rec',meaning:'staff_recommendation',priority:170,title:'Could help'},
    {id:'monitor',meaning:'monitoring',priority:100,title:'Keep an eye on it'}
  ];
  const result=Flow.classifyAgenda(source,'explicit');
  assert.deepEqual(result.required.map(x=>x.id),['required']);
  assert.deepEqual(result.recommended.map(x=>x.id),['due','strong-rec']);
  assert.deepEqual(result.optional.map(x=>x.id),['ordinary-rec','monitor']);
  assert.equal(result.mode,'explicit');
  assert.equal(source[0].group,undefined,'presentation classification must not mutate guidance items');
});

test('carry-forward uses the recorded score and game-plan evidence',()=>{
  const Flow=flow();
  const result=Flow.buildCarryForward({
    teamId:1,
    teamName:'Chicago Metropolitan',
    record:{
      home:{id:1,name:'Chicago Metropolitan'},
      away:{id:2,name:'Great Lakes University'},
      score:{home:31,away:17}
    },
    feedback:{verdict:'Worked',headline:'Pressure produced 4 sacks.',detail:'Opponent averaged 5.8 yards per pass attempt.'}
  });
  assert.equal(result.outcome,'win');
  assert.equal(result.result,'Won 31–17 vs Great Lakes University');
  assert.equal(result.verdict,'Worked');
  assert.equal(result.headline,'Pressure produced 4 sacks.');
  assert.equal(result.detail,'Opponent averaged 5.8 yards per pass attempt.');
});

test('carry-forward returns null when the selected team is not in the record',()=>{
  const Flow=flow();
  assert.equal(Flow.buildCarryForward({
    teamId:99,
    teamName:'Chicago Metropolitan',
    record:{home:{id:1,name:'A'},away:{id:2,name:'B'},score:{home:10,away:7}}
  }),null);
});

test('briefing prioritizes last game, opponent, required work, then factual texture',()=>{
  const Flow=flow();
  const briefing=Flow.buildBriefing({
    mode:'explicit',
    week:1,
    opponent:'Wisconsin Commonwealth',
    carryForward:{result:'Won 31–17 vs Great Lakes University',verdict:'Worked',headline:'Pressure produced 4 sacks.'},
    agenda:{required:[{id:'role',title:'Answer player role concern'}],recommended:[],optional:[]},
    scout:['Wisconsin Commonwealth leans on the passing game.'],
    texture:[{kind:'program',text:'The administration expects a conference-title push.'}],
    next:{label:'Answer player role concern',destination:{tab:'dashboard'}}
  });
  assert.equal(briefing.mode,'explicit');
  assert.equal(briefing.title,'Week 2 briefing');
  assert.deepEqual(briefing.bullets.map(x=>x.kind),['last_game','opponent','required','program']);
  assert.equal(briefing.next.label,'Answer player role concern');
});

test('prep path blocks later stages until required work is resolved',()=>{
  const Flow=flow();
  const path=Flow.buildPrepPath({
    hasGame:true,
    opponentReviewed:true,
    requiredCount:1,
    prepSet:false,
    personnelPending:false,
    gamedayReady:false
  });
  const status=Object.fromEntries(path.stages.map(x=>[x.key,x.status]));
  assert.equal(status.opponent,'done');
  assert.equal(status.decisions,'current');
  assert.equal(status.prep,'blocked');
  assert.equal(status.personnel,'optional');
  assert.equal(status.gameday,'blocked');
});

test('optional prep never creates a fake Game Day blocker',()=>{
  const Flow=flow();
  const path=Flow.buildPrepPath({
    hasGame:true,
    opponentReviewed:true,
    requiredCount:0,
    prepSet:false,
    personnelPending:false,
    gamedayReady:true
  });
  const status=Object.fromEntries(path.stages.map(x=>[x.key,x.status]));
  assert.equal(status.decisions,'done');
  assert.equal(status.prep,'optional','weekly prep is useful but not an authoritative requirement');
  assert.equal(status.gameday,'current','the path must mirror authoritative Game Day eligibility');
});

test('prep path advances to Game Day after review, decisions and prep are complete',()=>{
  const Flow=flow();
  const path=Flow.buildPrepPath({
    hasGame:true,
    opponentReviewed:true,
    requiredCount:0,
    prepSet:true,
    personnelPending:false,
    gamedayReady:true
  });
  const status=Object.fromEntries(path.stages.map(x=>[x.key,x.status]));
  assert.equal(status.opponent,'done');
  assert.equal(status.decisions,'done');
  assert.equal(status.prep,'done');
  assert.equal(status.personnel,'optional');
  assert.equal(status.gameday,'current');
});

test('pure flow builders do not mutate supplied data',()=>{
  const Flow=flow();
  const input={
    mode:'explicit',week:0,opponent:'Opponent',
    agenda:{required:[{id:'a',title:'Required'}],recommended:[],optional:[]},
    scout:['Scout fact'],texture:[],next:null
  };
  const before=JSON.stringify(input);
  Flow.buildBriefing(input);
  assert.equal(JSON.stringify(input),before);
});
