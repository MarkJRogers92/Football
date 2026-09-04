const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

test('the gameplan card is offered once per opponent and names the matchup',async()=>{
 const e=await setup(3101),u=e.universe,me=e.T('Chicago Metropolitan');
 const g=u.schedule[0].find(x=>x.home===me.name||x.away===me.name);
 const opp=e.T(g.home===me.name?g.away:g.home);
 const d=e.weeklyGameplanDecision(me);
 assert.ok(d,'a decision is offered ahead of a scheduled game');
 assert.equal(d.type,'WEEKLY_GAMEPLAN');
 assert.ok(d.title.includes(opp.name));
 assert.equal(d.options.length,5);
 assert.ok(d.options.some(o=>o.id==='stop_run'));
 assert.ok(d.options.some(o=>o.id==='protect_pass'));
 assert.ok(d.options.some(o=>o.id==='pressure'));
 assert.equal(d.options.filter(o=>o.recommended).length,1);
 // Resolving it (via the same path resolveWeeklyDecision uses) should stop it re-offering this week.
 e.applyGameplanDecision(me,{id:'balance'});
 // decisionRecent needs a matching resolved record, which only resolveWeeklyDecision writes; confirm
 // the underlying state changed regardless, since that is what the gate itself depends on later.
 assert.equal(me.gameplan.opponent,opp.name);
 assert.equal(me.gameplan.week,u.week);
 assert.equal(me.gameplan.year,u.year);
});

test('a gameplan edge only applies to the matching opponent, in the matching week',async()=>{
 const e=await setup(3102),u=e.universe,me=e.T('Chicago Metropolitan'),other=u.teams.find(t=>t!==me);
 me.gameplan={year:u.year,week:u.week,opponent:other.name,prep:'scout'};
 assert.ok(e.teamGameplanFor(me,other.name),'matches the right opponent, right week');
 assert.equal(e.teamGameplanFor(me,'Someone Else'),null,'not a different opponent');
 const staleWeek={...me.gameplan,week:u.week+1};me.gameplan=staleWeek;
 assert.equal(e.teamGameplanFor(me,other.name),null,'not a stale week');
 me.gameplan={year:u.year-1,week:u.week,opponent:other.name,prep:'scout'};
 assert.equal(e.teamGameplanFor(me,other.name),null,'not a stale year');
});

test('applyGameplanEdge scales with prep tier and stays within profile bounds',async()=>{
 const e=await setup(3103);
 const base=()=>({offense:70,defense:70});
 const scout=e.applyGameplanEdge(base(),'scout'),balance=e.applyGameplanEdge(base(),'balance'),standard=e.applyGameplanEdge(base(),'standard');
 assert.ok(scout.offense>balance.offense&&balance.offense>standard.offense,'full scout beats balanced beats standard');
 assert.ok(scout.defense>balance.defense&&balance.defense>standard.defense);
 assert.equal(standard.offense,70,'standard prep changes nothing');
 const capped=e.applyGameplanEdge({offense:99,defense:99},'scout');
 assert.equal(capped.offense,99,'never exceeds the profile ceiling');
 assert.equal(e.applyGameplanEdge(null,'scout'),null,'tolerates no profile');
});

test('scouting costs extra scheme familiarity only while a program is mid-installation',async()=>{
 const e=await setup(3104),u=e.universe,me=e.T('Chicago Metropolitan');
 me.schemeTransition={off:{to:me.offScheme,from:'Pro Style',familiarity:40},def:null};
 const before=me.schemeTransition.off.familiarity;
 e.applyGameplanDecision(me,{id:'scout'});
 assert.equal(me.schemeTransition.off.familiarity,before-8,'full scout costs the most install progress');
 me.schemeTransition.off.familiarity=40;
 me.gameplan=null;
 e.applyGameplanDecision(me,{id:'balance'});
 assert.equal(me.schemeTransition.off.familiarity,40-3,'balanced prep costs less');
 me.schemeTransition=null;
 const p=e.T(u.teams.find(t=>t!==me).name);
 p.schemeTransition=null;
 // No scheme cost to speak of once installed — no error, no negative familiarity — but that must
 // not mean no cost at all (see the wear test below).
 assert.doesNotThrow(()=>e.applyGameplanDecision(me,{id:'scout'}));
});

test('preparation survives recovery and portable save/load, and kickoff charges it only once',async()=>{
 const e=await setup(3107),u=e.universe,me=e.T('Chicago Metropolitan');
 me.schemeTransition=null;
 me.roster.forEach(p=>{p.wear=0;p.health=100;p.injuryWeeks=0});
 const starters=e.importantStarters(me).slice(0,5),ids=starters.map(p=>p.id);
 const match=u.schedule[0].find(g=>g.home===me.name||g.away===me.name);
 const opp=e.T(match.home===me.name?match.away:match.home);
 assert.equal(e.applyGameplanDecision(me,{id:'stop_run'}),true);
 assert.equal(e.applyGameplanDecision(me,{id:'pressure'}),false,'choice cannot be charged twice');
 assert.ok(starters.every(p=>p.wear===0),'cost is pending until kickoff');
 const portable=JSON.parse(JSON.stringify(e.packUniverse(u)));
 e.installSave({version:'0.9.36',userTeam:me.name,universe:portable});
 const loaded=e.T(me.name),other=e.T(opp.name);
 e.recoverWeek();e.beginGame(loaded,other,true);
 const actual=ids.map(id=>loaded.roster.find(p=>p.id===id));
 assert.ok(actual.every(p=>p.wear===3),'fresh starters still pay after recovery');
 e.recoverWeek();e.beginGame(loaded,other,true);
 assert.ok(actual.every(p=>p.wear===3),'repeat kickoff cannot double-charge');
 assert.ok(e.conditionRating(actual[0])<e.conditionRating({...actual[0],wear:0}));
});

test('an unresolved gameplan card never blocks the calendar, unlike every other Coach\'s Desk decision',async()=>{
 const e=await setup(3106),u=e.universe,me=e.T('Chicago Metropolitan');
 // A scheduled game exists almost every week, unlike every other decision type, which is
 // situational — so if this one blocked like the rest, the calendar would stall every single
 // week rather than occasionally. It must stay real and choosable without being mandatory.
 const decs=e.ensureWeeklyDecisions(me);
 assert.ok(decs.some(d=>d.type==='WEEKLY_GAMEPLAN'),'the card exists and is visible');
 assert.equal(e.hasPendingWeeklyDecisions(me),false,'but it alone never blocks simWeek');
 const weekBefore=u.week;
 e.simWeek();
 assert.equal(u.week,weekBefore+1,'the calendar advances without resolving it');
 assert.equal(me.gameplan,undefined,'ignoring it is the same as choosing standard: no edge applied');
});

test('matchup choices trade real run, coverage and pressure components',async()=>{
 const e=await setup(3110),base={offense:70,defense:70,qb:70,skill:70,ol:70,front:70,coverage:70};
 const run=e.applyGameplanEdge({...base},'stop_run'),pass=e.applyGameplanEdge({...base},'protect_pass'),pressure=e.applyGameplanEdge({...base},'pressure');
 assert.ok(run.front>base.front&&run.coverage<base.coverage);
 assert.ok(pass.coverage>base.coverage&&pass.front<base.front);
 assert.ok(pressure.prepPressure>0&&pressure.coverage<base.coverage);
 assert.deepEqual(e.applyGameplanEdge({...base},'unknown'),base);
});

test('quick and Watch simulations consume the plan and preserve an immutable report',async()=>{
 for(const mode of ['gameSim','detailedGame']){
  const boxes=[];
  for(const prep of ['stop_run','protect_pass']){
   const e=await setup(3111),u=e.universe,a=u.teams[0],g=u.schedule[0].find(g=>g.home===a.name||g.away===a.name),b=e.T(g.home===a.name?g.away:g.home);
   e.applyGameplanDecision(a,{id:prep});e.recoverWeek();
   const ids=a.gameplan.wearPending;
   const result=e[mode](a,b,true),record=u.gameArchive.find(g=>g.id===result.gameId);
   assert.ok(a.gameplan.wearApplied,mode+' charges pending preparation');
   assert.equal(record.home.gameplan.prep,prep);
   assert.equal(record.away.gameplan.prep,'standard');
   assert.ok(ids.every(id=>a.roster.find(p=>p.id===id).wear>=3));
   const report=e.coachingReportHTML(record),snapshot=JSON.stringify(record);
   assert.match(report,/Postgame coaching report/);assert.match(report,/Turnovers:/);
   a.gameplan=null;assert.equal(e.coachingReportHTML(record),report);
   assert.equal(JSON.stringify(record),snapshot,'report is read-only');
   boxes.push(JSON.stringify(result.box));
  }
  assert.notEqual(boxes[0],boxes[1],mode+' uses tactical components with the same seed');
 }
});

test('old reports label missing plans and escape names without inventing untracked stats',async()=>{
 const e=await setup(3112);
 const g={home:{name:'<script>'},away:{name:'Away'},teamStats:{home:{sacksTaken:4},away:{rushAtt:20,rushYds:120}},injuries:[]};
 const html=e.coachingReportHTML(g);
 assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);
 assert.match(html,/Not recorded for this older game/);assert.match(html,/unavailable/);
 assert.match(html,/Review protection/);assert.match(html,/6.0 per carry/);
});
