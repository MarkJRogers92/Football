const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

const USER='Chicago Metropolitan';
async function setup(seed){
 const e=loadEngine({seed,fullRuntime:true});
 e.setUserTeam(USER);await e.loadSchools();e.initUniverse();
 return {e,S:globalThis.DynastyStaffAssignments,t:e.T(USER)};
}

test('assignments are one coach per territory and per room, within what each role may coach',async()=>{
 const {S,t}=await setup(5301);
 assert.equal(S.assign(t,'RC',{region:'Gulf'}).ok,true);
 assert.match(S.assign(t,'HC',{region:'Gulf'}).reason,/already has a coach/);
 assert.match(S.assign(t,'RC',{group:'QB'}).reason,/cannot coach/,'the recruiting coordinator recruits only');
 assert.match(S.assign(t,'OC',{group:'DB'}).reason,/cannot coach/);
 assert.equal(S.assign(t,'DC',{group:'DB'}).ok,true);
 assert.match(S.assign(t,'HC',{group:'DB'}).reason,/already have a coach/);
 assert.equal(S.assign(t,'OC',{group:'ST'}).ok,true,'specialists can go to either side');
 assert.match(S.assign(t,'HC',{region:'Narnia'}).reason,/Unknown region/);
 const rc=S.rows(t).find(r=>r.slot==='RC');
 assert.equal(rc.region,'Gulf');assert.equal(rc.coach.id,t.staff.RC.id);
});

test('a territory pays after two weeks, on contacts that already gained interest, scaled by the recruiter',async()=>{
 const {e,S,t}=await setup(5302),A=globalThis.DynastyRecruitingActions;
 const r=e.universe.recruits.filter(x=>!x.committed&&x.homeRegion).sort((a,b)=>e.recruitPitch(t,b)-e.recruitPitch(t,a))[0];
 t.staff.RC.recruiting=90;
 S.assign(t,'RC',{region:r.homeRegion});
 assert.equal(S.recruitBonus(r,t),0,'learning the territory');
 e.universe.week+=S.LEARN_WEEKS;
 assert.equal(S.recruitBonus(r,t),2,'a 90 recruiter adds two points');
 t.staff.RC.recruiting=70;assert.equal(S.recruitBonus(r,t),1);
 t.staff.RC.recruiting=45;assert.equal(S.recruitBonus(r,t),0);
 t.staff.RC.recruiting=90;
 r.targeted=true;const before=r.interest;
 const out=A.perform(r,t,'call');
 assert.equal(out.ok,true);
 assert.equal(r.interest,Math.min(100,before+out.dI),JSON.stringify(out));
 assert.equal(out.dI,1+2,'a first call is worth one point, plus the territory');
 assert.match(out.note,/Territory bonus/);
 // Another program working the same recruit gets nothing from your staff.
 const other=e.universe.teams.find(x=>x.name!==USER);
 assert.equal(S.recruitBonus(r,other),0);
});

test('an assigned developer lifts his room at camp, for the controlled program only',async()=>{
 const {e,S,t}=await setup(5303);
 const qb=t.roster.find(p=>p.pos==='QB');
 const base=e.resolveDevelopmentCoaching(t,qb).modifier;
 t.staff.HC.development=90;
 S.assign(t,'HC',{group:'QB'});
 const lifted=e.resolveDevelopmentCoaching(t,qb);
 assert.ok(Math.abs(lifted.modifier-Math.min(.95,base+.2))<.002,'a 90 developer adds .2');
 assert.match(lifted.summary,/assigned to coach the quarterbacks/);
 assert.equal(lifted.assignment.group,'Quarterbacks');
 const wr=t.roster.find(p=>p.pos==='WR');
 assert.equal(e.resolveDevelopmentCoaching(t,wr).assignment,undefined,'other rooms are unchanged');
 const other=e.universe.teams.find(x=>x.name!==USER);
 assert.equal(e.resolveDevelopmentCoaching(other,other.roster.find(p=>p.pos==='QB')).assignment,undefined);
});

test('a departed coach leaves his assignment open until it is reassigned',async()=>{
 const {e,S,t}=await setup(5304);
 S.assign(t,'OC',{region:'Pacific',group:'QB'});
 const name=t.staff.OC.name;
 t.staff.OC={...t.staff.OC,id:'replacement',name:'New Hire'};
 const row=S.rows(t).find(r=>r.slot==='OC');
 assert.equal(row.region,null);assert.equal(row.group,null);
 assert.deepEqual(row.vacated,{name,region:'Pacific',group:'QB'});
 const qb=t.roster.find(p=>p.pos==='QB');
 assert.equal(S.developBonus(qb,t),null,'the room lost its coach');
 const news=globalThis.DynastyStaffAssignmentNews(t);
 assert.equal(news.length,1);assert.match(news[0].main,new RegExp(name));
 assert.equal(S.assign(t,'OC',{region:'Pacific'}).ok,true,'the territory is free for the new coach');
 assert.equal(S.vacancies(t).length,0);
 assert.ok(e.universe);
});

test('the staff suggestion fills territories where the board is and rooms by need',async()=>{
 const {e,S,t}=await setup(5305);
 for(const r of e.universe.recruits.filter(x=>x.homeRegion==='Mountain').slice(0,12))r.targeted=true;
 const rows=S.applySuggestion(t);
 const top=t.staff[Object.keys(t.staff).sort((a,b)=>t.staff[b].recruiting-t.staff[a].recruiting)[0]];
 assert.equal(rows.find(r=>r.coach.id===top.id).region,'Mountain','the best recruiter takes the busiest territory');
 assert.equal(new Set(rows.map(r=>r.region).filter(Boolean)).size,rows.filter(r=>r.region).length,'no territory twice');
 const groups=rows.map(r=>r.group).filter(Boolean);
 assert.equal(new Set(groups).size,groups.length,'no room twice');
 assert.equal(rows.find(r=>r.slot==='RC').group,null);
});

test('a dynasty without assignments plays exactly as before',async()=>{
 const run=async()=>{const {e}=await setup(5306);e.simWeek();e.simWeek();return JSON.stringify(e.universe.recruits.map(r=>[r.id,r.interest,r.committed||null]))};
 const a=await run(),b=await run();
 assert.equal(a,b);
});

test('repeated suggestions preserve learned coach-territory pairs across reload; real moves relearn',async()=>{
 const {e,S,t}=await setup(5307);t.staff.RC.recruiting=99;
 for(const r of e.universe.recruits)r.targeted=r.homeRegion==='Gulf';
 S.applySuggestion(t);assert.equal(S.rows(t).find(r=>r.slot==='RC').region,'Gulf');
 e.universe.week+=2;const since={...t.staffAssignments.slots.RC.regionSince};
 assert.equal(S.recruitBonus({homeRegion:'Gulf'},t),2);
 S.applySuggestion(t);S.applySuggestion(t);assert.deepEqual(t.staffAssignments.slots.RC.regionSince,since);assert.equal(S.recruitBonus({homeRegion:'Gulf'},t),2);
 e.universe=JSON.parse(JSON.stringify(e.universe));e.normalizeUniverse();const reloaded=e.T(USER);S.applySuggestion(reloaded);assert.equal(S.recruitBonus({homeRegion:'Gulf'},reloaded),2);
 // Changing the board swaps territories, which really does restart learning.
 for(const r of e.universe.recruits)r.targeted=r.homeRegion==='Pacific';
 S.applySuggestion(reloaded);assert.equal(S.rows(reloaded).find(r=>r.slot==='RC').region,'Pacific');assert.equal(S.recruitBonus({homeRegion:'Pacific'},reloaded),0);
 const regions=S.rows(reloaded).map(r=>r.region).filter(Boolean);assert.equal(new Set(regions).size,regions.length);
 assert.equal(S.assign(reloaded,'RC',{region:null}).ok,true);assert.equal(reloaded.staffAssignments.slots.RC.regionSince,null);
 assert.equal(S.assign(reloaded,'RC',{region:'Pacific'}).ok,true);assert.equal(S.recruitBonus({homeRegion:'Pacific'},reloaded),0);
});
