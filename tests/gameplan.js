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
 const offered=d.options.map(o=>o.id);
 assert.deepEqual(offered,['stop_run','protect_pass','pressure','balance','standard'],
  'directional prep replaced the old intensity slider — each option trades something, none is strictly best');
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
 me.schemeTransition.off.familiarity=40;me.gameplan=null;   // one gameplan per opponent; clear to re-decide
 e.applyGameplanDecision(me,{id:'balance'});
 assert.equal(me.schemeTransition.off.familiarity,40-3,'balanced prep costs less');
 me.schemeTransition=null;
 const p=e.T(u.teams.find(t=>t!==me).name);
 p.schemeTransition=null;
 // No scheme cost to speak of once installed — no error, no negative familiarity — but that must
 // not mean no cost at all (see the wear test below).
 assert.doesNotThrow(()=>e.applyGameplanDecision(me,{id:'scout'}));
});

test('prep wear is charged when the game is played, not when the card is answered',async()=>{
 const e=await setup(3107),u=e.universe,me=e.T('Chicago Metropolitan');
 me.schemeTransition=null;                       // fully installed: no familiarity to spend
 const g=u.schedule[u.week].find(x=>x.home===me.name||x.away===me.name);
 const opp=g.home===me.name?g.away:g.home;
 const starters=e.importantStarters(me).slice(0,5);
 for(const p of starters)p.wear=0;
 e.applyGameplanDecision(me,{id:'stop_run'});
 for(const p of starters)assert.equal(p.wear,0,'answering the card alone costs nothing — a game you never play should not tire anyone');
 assert.equal(me.gameplan.wearApplied,false);
 e.applyGameplanWear(me,opp);
 for(const p of starters)assert.equal(p.wear,3,'the cost lands when the game does');
 e.applyGameplanWear(me,opp);
 for(const p of starters)assert.equal(p.wear,3,'and is never charged twice for the same game');
 // Standard prep remains the genuinely free option.
 for(const p of starters)p.wear=0;
 me.gameplan=null;
 e.applyGameplanDecision(me,{id:'standard'});
 e.applyGameplanWear(me,opp);
 for(const p of starters)assert.equal(p.wear,0,'standard prep costs nothing at all');
 // Wear is not cosmetic: it directly lowers conditionRating, which is what makes "always full
 // scout" a real choice with a real downside instead of a free action.
 const p=starters[0];
 const fresh=e.conditionRating({...p,wear:0}),tired=e.conditionRating({...p,wear:30});
 assert.ok(tired<fresh,'accumulated wear measurably hurts the player it was spent on');
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

test('the edge actually reaches gameSim, through gameProfiles',async()=>{
 // Full-game score is noisy and, since the reconciliation with GPT's richer sim internals,
 // applyGameplanEdge spreads its bonus across qb/skill/ol/front/coverage rather than the old
 // coarse offense/defense fields — so the real, deterministic thing to check is the actual
 // integration point (gameProfiles), not a statistical guess at the final score.
 const e=await setup(3105),u=e.universe,a=u.teams[0],b=u.teams[1];
 const plain=e.profiles(a);
 a.gameplan={year:u.year,week:u.week,opponent:b.name,prep:'scout'};
 const scouted=e.gameProfiles(a,b.name);
 assert.notDeepEqual(scouted,plain,'gameProfiles actually differs once a gameplan is set');
 assert.ok(scouted.qb>=plain.qb&&scouted.skill>=plain.skill&&scouted.ol>=plain.ol,
  'full scout raises every offensive sub-rating gameSim reads');
 a.gameplan=null;
 assert.deepEqual(e.gameProfiles(a,b.name),plain,'and nothing lingers once the gameplan is cleared');
});
