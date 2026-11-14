const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed=1402){
 const e=loadEngine({seed,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();e.universe.weeklyDecisions=[];
 return {e,u:e.universe,t:e.T('Chicago Metropolitan')};
}
function events(u,id){return (u.events||[]).filter(x=>x.type==='WEEKLY_DECISION_RESOLVED'&&x.metadata.decisionId===id)}
function injury(e,t){const p=e.importantStarters(t)[0];Object.assign(p,{health:70,wear:76,injuryWeeks:0,redshirtActive:false});return {p,d:e.ensureWeeklyDecisions(t).find(x=>x.type==='INJURED_STARTER')}}

test('seed 1402 delegation applies the manual limited role once, persists across reload and expires next week',async()=>{
 const {e,u,t}=await setup(),{p,d}=injury(e,t);u.weeklyDecisions=[d];const before=JSON.stringify(u);
 assert.equal(e.resolveWeeklyDecision(d.id,'limited'),true);const manual=JSON.parse(JSON.stringify(p));
 const role=e.ROLE_DEFS.find(r=>t.roleDepth[r.id]?.[0]===p.id);assert.ok(role);
 const manualStarter=e.roleStarter(t,role.id).id;assert.notEqual(manualStarter,p.id);
 // Delegation also settles any other live decision the week generates; let the staff do the same here so the two runs
 // differ only in who chose the limited role.
 e.delegateWeeklyDecisions(t);e.simWeek(true);const manualWeek=JSON.stringify(e.universe.schedule[0]),manualStats=JSON.stringify(p.stats);
 e.universe=JSON.parse(before);e.normalizeUniverse();const dt=e.T(t.name),dp=dt.roster.find(x=>x.id===p.id);
 assert.equal(e.delegateWeeklyDecisions(dt),true);
 assert.deepEqual(dp.weeklyAvailability,manual.weeklyAvailability);assert.equal(e.roleStarter(dt,role.id).id,manualStarter);
 let saved=JSON.parse(JSON.stringify(e.universe));let decision=saved.weeklyDecisions.find(x=>x.id===d.id);
 assert.equal(decision.resolvedOptionId,'limited');assert.equal(decision.selectedBy,'staff');assert.equal(decision.selectedByCoachId,dt.staff.HC.id);
 assert.equal(events(saved,d.id).length,1);assert.equal(events(saved,d.id)[0].metadata.optionId,'limited');
 e.universe=saved;e.normalizeUniverse();assert.equal(e.delegateWeeklyDecisions(e.T(t.name)),true);
 assert.equal(events(e.universe,d.id).length,1);assert.equal(e.resolveWeeklyDecision(d.id,'sit'),false);
 // Actual game participants use the same role selection; the limited plan is then scoped out at the next boundary.
 const team=e.T(t.name),player=team.roster.find(x=>x.id===p.id);
 assert.equal(e.roleStarter(team,role.id).id,manualStarter);e.simWeek(true);assert.equal(e.universe.week,1);assert.equal(e.weeklyPlayerPlan(player),null);
 assert.equal(JSON.stringify(e.universe.schedule[0]),manualWeek,'same seed and same choice produce the same game results');assert.equal(JSON.stringify(player.stats),manualStats);
});

test('delegation applies academics and redshirts rather than only writing a receipt',async()=>{
 const {e,u,t}=await setup(1403);const p=t.roster.find(x=>!e.importantStarters(t).includes(x));
 Object.assign(p,{redshirtUsed:false,redshirtActive:false,eligibilityUsed:0});p.stats.games=3;
 let d=e.ensureWeeklyDecisions(t).find(x=>x.type==='REDSHIRT_DECISION');assert.ok(d);u.weeklyDecisions=[d];
 assert.equal(e.delegateWeeklyDecisions(t),true);assert.equal(p.redshirtActive,true);
 u.weeklyDecisions=[];p.redshirtActive=false;p.stats.games=0;p.academicStanding=43;p.academicHold=0;
 d=e.academicDecision(t,new Set());assert.ok(d);u.weeklyDecisions=[d];const standing=t.roster.find(x=>x.id===d.playerId).academicStanding;
 assert.equal(e.delegateWeeklyDecisions(t),true);assert.equal(t.roster.find(x=>x.id===d.playerId).academicStanding,standing+2);assert.equal(d.resolvedOptionId,'balance');
});

test('missing targets, invalid options, stale cards and missing staff authority do not resolve or consume a week',async()=>{
 const {e,u,t}=await setup(),{p,d}=injury(e,t);u.weeklyDecisions=[d];t.roster=t.roster.filter(x=>x.id!==p.id);
 assert.equal(e.resolveWeeklyDecision(d.id,'limited'),false);assert.equal(d.resolved,false);assert.equal(e.delegateWeeklyDecisions(t),false);
 e.simSeason();assert.equal(u.week,0);assert.equal(u.phase,'regular');assert.equal(events(u,d.id).length,0);
 t.roster.push(p);assert.equal(e.resolveWeeklyDecision(d.id,'made_up'),false);
 d.week=-1;assert.equal(e.resolveWeeklyDecision(d.id,'limited'),false);d.week=0;
 const hc=t.staff.HC;t.staff.HC=null;assert.equal(e.delegateWeeklyDecisions(t),false);assert.equal(d.resolved,false);t.staff.HC=hc;
});

test('staff never invents a new promise and refuses an unknown decision type',async()=>{
 const {e,u,t}=await setup(),{p,d}=injury(e,t);
 Object.assign(d,{type:'PLAYING_TIME_CONCERN',options:[{id:'keep',label:'Keep current role'},{id:'promise',label:'Promise an opportunity',recommended:true}]});u.weeklyDecisions=[d];
 assert.equal(e.delegateWeeklyDecisions(t),true);assert.equal(d.resolvedOptionId,'keep');assert.equal((p.promises||[]).filter(q=>q.type==='EARLY_ROLE').length,0);
 for(const type of ['FUTURE_DECISION','constructor','toString']){Object.assign(d,{type,resolved:false});assert.equal(e.delegateWeeklyDecisions(t),false);assert.equal(d.resolved,false)}
});

test('starter challenge delegation uses the personnel effect path once',async()=>{
 const {e,u,t}=await setup(1410);const [a,b]=t.roster.filter(p=>p.pos==='QB');Object.assign(a,{redshirtActive:false,injuryWeeks:0});Object.assign(b,{redshirtActive:false,injuryWeeks:0});
 t.depthChart.QB=[a.id,b.id];
 const d={id:'challenge_fixture',season:u.year,week:u.week,teamId:t.id,type:'STARTER_CHALLENGE',playerId:b.id,starterId:a.id,pos:'QB',title:'QB room',recommendedOption:'promote',options:[{id:'stay',label:'Keep starter'},{id:'promote',label:'Promote challenger',recommended:true}],resolved:false};u.weeklyDecisions=[d];
 assert.equal(e.delegateWeeklyDecisions(t),true);assert.equal(t.depthChart.QB[0],b.id);assert.equal(b.role,'Starter');assert.equal(events(u,d.id).length,1);
 const morale=b.morale;assert.equal(e.delegateWeeklyDecisions(t),true);assert.equal(b.morale,morale);assert.equal(events(u,d.id).length,1);
});

test('ordinary full-runtime unattended season reaches confReady using real options',async()=>{
 const {e,u}=await setup(1406);e.simSeason();assert.equal(u.phase,'confReady');assert.equal(u.week,12);
 for(const d of u.weeklyDecisions){assert.equal(d.resolved,true);assert.ok(d.options.some(o=>o.id===d.resolvedOptionId));assert.equal(events(u,d.id).length,1)}
});

test('an optional gameplan for an already played game does not stall unattended season completion',async()=>{
 const {e,u,t}=await setup(1411),d=e.weeklyGameplanDecision(t);assert.ok(d);u.weeklyDecisions=[d];
 const game=e.findUserGame();e.simulateUserDetailed();assert.equal(game.played,true);assert.equal(d.resolved,false,'optional preparation can be left alone');
 assert.equal(e.delegateWeeklyDecisions(t),true);assert.equal(events(u,d.id).length,0,'expired optional prep must not gain fictional effects or receipts');
 e.simSeason();assert.equal(u.phase,'confReady');assert.equal(u.week,12);
});

test('legacy delegate decisions remain readable and are never applied again',async()=>{
 const {e,u,t}=await setup(),{p,d}=injury(e,t);Object.assign(d,{resolved:true,resolvedOptionId:'delegate',resolvedSeason:u.year,resolvedWeek:u.week});u.weeklyDecisions=[d];
 u.events.push({id:'old-delegate',season:u.year,week:u.week,type:'WEEKLY_DECISION_RESOLVED',schoolIds:[t.id],metadata:{decisionId:d.id,optionId:'delegate',optionLabel:'Delegated to staff'}});
 const saved=JSON.parse(JSON.stringify(e.packUniverse(u)));e.universe=saved;e.normalizeUniverse();assert.equal(e.delegateWeeklyDecisions(e.T(t.name)),true);
 assert.equal(saved.weeklyDecisions[0].resolvedOptionId,'delegate');assert.equal(e.T(t.name).roster.find(x=>x.id===p.id).weeklyAvailability,undefined);assert.equal(events(saved,d.id).length,1);
});


test('a standing medical instruction rests worn starters across reload and still lets the coach override it',async()=>{
 const {e,u,t}=await setup(1420),{p,d}=injury(e,t);t.weeklyStaffInstructions={medical:'sit'};u.weeklyDecisions=[d];
 const before=JSON.stringify(e.packUniverse(u));e.universe=JSON.parse(before);e.normalizeUniverse();const team=e.T(t.name),player=team.roster.find(x=>x.id===p.id);
 assert.equal(e.delegateWeeklyDecisions(team),true);assert.equal(player.weeklyAvailability.role,'sit');assert.equal(e.gameAvailable(player),false);
 const saved=e.universe.weeklyDecisions.find(x=>x.id===d.id);assert.equal(saved.resolvedOptionId,'sit');assert.equal(events(e.universe,d.id).length,1);
 e.universe=JSON.parse(before);e.normalizeUniverse();const manualTeam=e.T(t.name),manualPlayer=manualTeam.roster.find(x=>x.id===p.id);assert.equal(e.resolveWeeklyDecision(d.id,'limited'),true);assert.equal(e.delegateWeeklyDecisions(manualTeam),true);assert.equal(manualPlayer.weeklyAvailability.role,'limited');assert.equal(e.universe.weeklyDecisions.find(x=>x.id===d.id).selectedBy,'coach');
});

// v0.30.1: one refused staff choice used to stop delegation, leaving the rest of the week's decisions open.
function gameplanDecision(e,u,t){
 const g=u.schedule[u.week].find(x=>!x.played&&(x.home===t.name||x.away===t.name));const opp=g.home===t.name?g.away:g.home;
 return {opp,d:{id:`WD_${u.year}_${u.week}_${t.id}_WEEKLY_GAMEPLAN_null`,season:u.year,week:u.week,teamId:t.id,type:'WEEKLY_GAMEPLAN',source:'STAFF',title:`Gameplan for ${opp}`,
  options:[{id:'standard',label:'Standard',recommended:true},{id:'protect_pass',label:'Protect against the pass'}],resolved:false}};
}
test('a game plan already chosen for the opponent answers the optional decision and never blocks the rest',async()=>{
 const {e,u,t}=await setup(1411),{p,d:hurt}=injury(e,t),{opp,d:plan}=gameplanDecision(e,u,t);
 // The plan was set for this opponent while the optional decision stayed open; it comes first in the list.
 t.gameplan={year:u.year,week:u.week,opponent:opp,prep:'protect_pass',wearPending:[],wearApplied:false};
 u.weeklyDecisions=[plan,hurt];
 assert.equal(e.delegateWeeklyDecisions(t),true,'staff settle the week');
 assert.equal(e.hasPendingWeeklyDecisions(t),false,'the required decision after the game plan is resolved');
 assert.equal(u.weeklyDecisions.find(x=>x.id===hurt.id).resolvedOptionId,'limited');
 assert.equal(u.weeklyDecisions.find(x=>x.id===plan.id).resolvedOptionId,'protect_pass','the existing plan is recorded, not replaced');
 assert.equal(t.gameplan.prep,'protect_pass');assert.equal(p.weeklyAvailability.role,'limited');
});
test('a refused preferred choice falls back to a safe option instead of leaving the decision open',async()=>{
 const {e,u,t}=await setup(1412);
 const pair=u.recruits.filter(r=>!r.committed).slice(0,2);pair.forEach(r=>{r.targeted=true;r.visitWeek=null});
 const d={id:`WD_${u.year}_${u.week}_${t.id}_RECRUITING_PRIORITY_x`,season:u.year,week:u.week,teamId:t.id,type:'RECRUITING_PRIORITY',source:'STAFF',title:'Choose this week’s recruiting priority',
  recruitIds:pair.map(r=>r.id),options:[{id:`prioritize_${pair[0].id}`,label:'A',recommended:true},{id:`prioritize_${pair[1].id}`,label:'B'},{id:'hold',label:'Hold'}],resolved:false};
 u.weeklyDecisions=[d];
 pair[0].visitWeek=u.week+1; // the recommended recruit already has a visit booked, so prioritizing him is refused
 assert.equal(e.delegateWeeklyDecisions(t),true);
 assert.equal(u.weeklyDecisions[0].resolvedOptionId,'hold','staff hold rather than leave the decision open');
});
test('staff never fall back to a choice that commits the coach',async()=>{
 const {e,u,t}=await setup(1413);
 const p=t.roster.find(x=>!x.redshirtActive);
 const d={id:`WD_${u.year}_${u.week}_${t.id}_PLAYER_ROLE_REQUEST_${p.id}`,season:u.year,week:u.week,teamId:t.id,type:'PLAYER_ROLE_REQUEST',source:'PLAYER',title:'Role request',playerId:p.id,
  options:[{id:'grant',label:'Grant'}],resolved:false};
 u.weeklyDecisions=[d];
 assert.equal(e.delegateWeeklyDecisions(t),false,'only a committing option exists, so staff leave it to the coach');
 assert.equal(u.weeklyDecisions[0].resolved,false);
});
