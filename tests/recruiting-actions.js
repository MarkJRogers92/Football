const test=require('node:test');
const assert=require('node:assert/strict');
const {makeRecruitingActionSystem}=require('../recruiting-actions');
const {loadEngine}=require('../tools/harness');

const PRIORITIES=['Prestige','NIL','Development','Early Role','Coaching','Academics','Scheme Fit','Winning','Stay Close','Campus Life'];
function fixture(over={}){
 const universe={year:2027,week:2,phase:'regular',recruits:[]};
 const calls={visit:0,grown:0};
 const api=makeRecruitingActionSystem({
  getUniverse:()=>universe,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  priorities:PRIORITIES,
  scholarshipCapacity:()=>over.capacity??16,
  unitStrength:()=>70,schemeFit:()=>70,distance:()=>300,
  recruitBlocked:over.blocked||(()=>false),
  growRecruiterRelationship:()=>{calls.grown++},
  ensureTargeted:r=>{r.targeted=true},
  scheduleVisit:r=>{calls.visit++;r.visitWeek=universe.week+1;r.visit=true}
 });
 return{universe,api,calls};
}
const team=(over={})=>({id:1,name:'Chicago Metropolitan',prestige:70,nil:60,development:65,academics:55,facilities:60,fan_support:58,w:3,l:1,resources:70,staff:{RC:{recruiting:80},HC:{recruiting:70,loyalty:65}},...over});
const recruit=(id='R1',over={})=>({id,name:`Recruit ${id}`,pos:'WR',stars:3,priority:'Prestige',interest:30,relationship:10,committed:null,targeted:false,nationalRank:50,...over});

test('the weekly recruiting budget is bounded and follows the recruiting staff',()=>{
 const {api}=fixture();
 const strong=api.hoursBudgetFor(team({staff:{RC:{recruiting:95},HC:{recruiting:90}},resources:95})),weak=api.hoursBudgetFor(team({staff:{RC:{recruiting:30},HC:{recruiting:30}},resources:20}));
 assert.ok(strong>weak);assert.ok(strong<=60);assert.ok(weak>=30);
});

test('reading hours is pure and the budget resets when the week advances',()=>{
 const {api,universe}=fixture(),t=team(),r=recruit();
 const before=JSON.stringify(t);
 assert.equal(api.hoursLeft(t),api.hoursBudgetFor(t));api.weekInfo(t);
 assert.equal(JSON.stringify(t),before,'reading the ledger writes nothing');
 api.perform(r,t,'call');assert.equal(api.hoursLeft(t),api.hoursBudgetFor(t)-2);
 universe.week++;assert.equal(api.hoursLeft(t),api.hoursBudgetFor(t));
});

test('a call costs two hours, puts the recruit on the board and shrinks if repeated',()=>{
 const {api}=fixture(),t=team(),r=recruit();
 const first=api.perform(r,t,'call');
 assert.equal(first.ok,true);assert.equal(first.cost,2);assert.equal(r.targeted,true);
 assert.ok(r.interest>30&&r.relationship>10);
 const gain1=r.relationship-10;
 const before=r.relationship;api.perform(r,t,'call');api.perform(r,t,'call');api.perform(r,t,'call');
 const fourth=api.record(r,t,false).history.at(-1);
 assert.equal(fourth.dI,0,'a fourth call in one week adds nothing');
 assert.ok(r.relationship-before<gain1*3);
});

test('a pitch pays when it matches what he cares about and your program backs it up',()=>{
 const {api}=fixture(),t=team({prestige:88}),match=recruit('A',{priority:'Prestige'}),other=recruit('B',{priority:'NIL'});
 const a=api.pitchProjection(match,t,'Prestige'),b=api.pitchProjection(other,t,'Prestige');
 assert.ok(a.delta>b.delta,'the same pitch is worth more to a recruit who cares');
 assert.equal(a.priority,true);
 assert.ok(a.delta>=4);
});

test('selling something your program cannot back up costs interest',()=>{
 const {api}=fixture(),t=team({prestige:20}),r=recruit('A',{priority:'Prestige',interest:50});
 const proj=api.pitchProjection(r,t,'Prestige');
 assert.ok(proj.delta<0);assert.equal(proj.label,'Risky');
 const out=api.perform(r,t,'pitch',{topic:'Prestige'});
 assert.equal(out.ok,true);assert.ok(r.interest<50);
});

test('pitch options lead with the strongest play and repeating a topic fades',()=>{
 const {api}=fixture(),t=team({prestige:90,nil:30}),r=recruit('A',{priority:'Prestige'});
 const opts=api.pitchOptions(r,t);
 assert.equal(opts[0].topic,'Prestige');
 for(let i=1;i<opts.length;i++)assert.ok(opts[i-1].delta>=opts[i].delta);
 const first=api.perform(r,t,'pitch',{topic:'Prestige'}),second=api.perform(r,t,'pitch',{topic:'Prestige'});
 assert.ok(second.dI<first.dI,'the same pitch twice in a week is worth less');
});

test('an offer needs hours, is limited, and is the only way a recruit can commit to you',()=>{
 const {api,universe}=fixture({capacity:6}),t=team(),limit=api.offerLimit(t);
 assert.equal(limit,10,'the limit has a floor');
 for(let i=0;i<limit;i++){
  const r=recruit(`R${i}`);universe.recruits.push(r);
  universe.week=1+i%2;// spread over two weeks so the budget is not the constraint
  assert.equal(api.perform(r,t,'offer').ok,true,`offer ${i}`);
 }
 const extra=recruit('EXTRA');universe.recruits.push(extra);
 const refused=api.availability(extra,t,'offer');
 assert.equal(refused.ok,false);assert.match(refused.reason,/offers out/);
 assert.equal(api.mayCommit(universe.recruits[0],t),true);
 assert.equal(api.mayCommit(extra,t),false,'no offer, no commit');
 assert.equal(api.availability(universe.recruits[0],t,'offer').ok,false,'only one offer per recruit');
});

test('withdrawing an offer takes the gate back and costs him some warmth',()=>{
 const {api}=fixture(),t=team(),r=recruit('A',{interest:60,relationship:40});
 api.perform(r,t,'offer');assert.equal(api.mayCommit(r,t),true);
 const interest=r.interest,rel=r.relationship;
 assert.equal(api.withdrawOffer(r,t).ok,true);
 assert.equal(api.mayCommit(r,t),false);assert.ok(r.interest<interest&&r.relationship<rel);
 assert.equal(api.withdrawOffer(r,t).ok,false);
});

test('an in-home visit needs an offer, a warm recruit and the back half of the season',()=>{
 const {api,universe}=fixture(),t=team(),r=recruit('A',{interest:50});
 universe.week=5;assert.match(api.availability(r,t,'inhome').reason,/Offer a scholarship/);
 api.perform(r,t,'offer');
 universe.week=3;assert.match(api.availability(r,t,'inhome').reason,/week 5/);
 universe.week=6;r.interest=30;assert.match(api.availability(r,t,'inhome').reason,/45%/);
 r.interest=50;const out=api.perform(r,t,'inhome');
 assert.equal(out.ok,true);assert.equal(out.cost,8);
 assert.match(api.availability(r,t,'inhome').reason,/already done/);
});

test('a campus visit costs five hours, goes through the existing scheduler and cannot be double-booked',()=>{
 const {api,calls}=fixture(),t=team(),r=recruit('A');
 const out=api.perform(r,t,'visit');
 assert.equal(out.ok,true);assert.equal(out.cost,5);assert.equal(calls.visit,1);
 assert.match(api.availability(r,t,'visit').reason,/already scheduled/);
});

test('actions are refused out of season, for committed recruits and for blocked ones',()=>{
 const {api,universe}=fixture({blocked:(t,r)=>r.id==='NO'}),t=team();
 universe.phase='offseason';assert.equal(api.availability(recruit('A'),t,'call').ok,false);
 universe.phase='regular';
 assert.match(api.availability(recruit('A',{committed:'Other U'}),t,'call').reason,/committed/);
 assert.match(api.availability(recruit('NO'),t,'call').reason,/will not consider/);
 universe.phase='preseason';universe.week=0;assert.equal(api.availability(recruit('A'),t,'call').ok,true,'the opening preseason counts');
 universe.week=1;assert.equal(api.availability(recruit('A'),t,'call').ok,false);
});

test('running out of hours is explained, not silent',()=>{
 const {api}=fixture(),t=team({staff:{RC:{recruiting:20},HC:{recruiting:20}},resources:10});
 let i=0;
 while(api.hoursLeft(t)>=5)assert.equal(api.perform(recruit(`R${i++}`,{interest:60}),t,'visit').ok,true);
 const refused=api.availability(recruit('LATE'),t,'visit');
 assert.equal(refused.ok,false);assert.match(refused.reason,/recruiting hour/);
});

test('a target stays warm for a week, cools slowly, then keeps cooling until somebody works him',()=>{
 const {api}=fixture(),t=team(),r=recruit('A',{targeted:true});
 // The first weekly pass after he joins the board is a grace week even though nobody has called.
 let e=api.effort(r,t);assert.equal(e.state,'worked');
 assert.equal(api.effortFromSince(1).state,'warm');
 const cold=api.effortFromSince(2);
 assert.equal(cold.state,'cooling');assert.equal(cold.freeze,true);assert.ok(cold.cool>=1);assert.ok(cold.relDecay>=1);
 assert.ok(api.effortFromSince(6).cool>api.effortFromSince(2).cool,'the longer he is ignored the faster he cools');
 assert.ok(api.effortFromSince(6).cool<=3);
});

test('working a recruit this week resets the clock and the preview says so',()=>{
 const {api,universe}=fixture(),t=team(),r=recruit('A',{targeted:true,interest:40});
 universe.week=4;
 const ignored=api.record(r,t,true);ignored.lastWorkedWeek=1;
 assert.equal(api.status(r,t).cooling,true,'last worked three weeks ago');
 api.perform(r,t,'call');
 const s=api.status(r,t);assert.equal(s.worked,true);assert.equal(s.cooling,false);
 // The weekly pass runs after the counter moves on, so the week just played is week-1.
 universe.week=5;assert.equal(api.effort(r,t).state,'worked');
 universe.week=6;assert.equal(api.effort(r,t).state,'warm');
 universe.week=7;assert.equal(api.effort(r,t).state,'cooling');
});

test('offers and in-home visits are a standing edge against rival programs, for this season only',()=>{
 const {api,universe}=fixture(),t=team(),r=recruit('A',{interest:60});
 assert.equal(api.pitchBoost(r,t),0);
 api.perform(r,t,'offer');const offered=api.pitchBoost(r,t);assert.ok(offered>0);
 universe.week=6;api.perform(r,t,'inhome');assert.ok(api.pitchBoost(r,t)>offered);
 assert.equal(api.pitchBoost(r,team({id:2})),0,'it belongs to the program that earned it');
 universe.year++;assert.equal(api.pitchBoost(r,t),0);
});

test('the board reports who is worked, who is cooling and who is ready for an offer',()=>{
 const {api,universe}=fixture(),t=team();
 const worked=recruit('W',{targeted:true}),cool=recruit('C',{targeted:true}),ready=recruit('Y',{targeted:true,interest:75}),done=recruit('D',{targeted:true,committed:'Other U'});
 universe.recruits.push(worked,cool,ready,done);universe.week=5;
 api.record(cool,t,true).lastWorkedWeek=1;
 api.perform(worked,t,'call');
 const w=api.workload(universe.recruits,t);
 assert.equal(w.targets,3);assert.equal(w.worked,1);assert.equal(w.cooling,1);assert.equal(w.ready,1);
 assert.ok(w.left<w.budget);
});

test('the staff plan is deterministic, stays inside the budget and never books visits',()=>{
 const {api,universe}=fixture(),t=team(),realRandom=Math.random;
 for(let i=0;i<40;i++)universe.recruits.push(recruit(`R${i}`,{targeted:true,interest:20+i,nationalRank:i+1}));
 Math.random=()=>{throw new Error('staff work must not draw randomness')};
 let out;try{out=api.staffPlan(universe.recruits,t)}finally{Math.random=realRandom}
 assert.ok(out.hours>0&&out.hours<=api.hoursBudgetFor(t));
 assert.equal(api.hoursLeft(t),api.hoursBudgetFor(t)-out.hours);
 assert.ok(out.pitches<=3,'the staff does not out-recruit a coach who is paying attention');
 assert.ok(universe.recruits.every(r=>!r.visitWeek&&!api.record(r,t,false).inHome));
 // Best-ranked targets are called first, so a short budget cools the long tail, not the stars.
 const worked=universe.recruits.filter(r=>api.workedThisWeek(r,t));
 assert.ok(worked.some(r=>r.nationalRank===1));
});

test('handing recruiting to the staff is a saved setting that defaults to off',()=>{
 const {api,universe}=fixture();
 assert.equal(api.isAuto(universe),false);
 assert.equal(api.setAuto(universe,true),true);assert.equal(api.isAuto(universe),true);
 assert.equal(JSON.parse(JSON.stringify(universe)).recruitingActions.auto,true,'it survives a save');
 assert.equal(api.setAuto(universe,false),false);assert.equal(api.isAuto(universe),false);
});

test('saves from before the desk grandfather their open targets once, and only with a program',()=>{
 const {api,universe}=fixture(),t=team();
 const targeted=recruit('T',{targeted:true,interest:70}),plain=recruit('P'),signed=recruit('S',{targeted:true,committed:'Chicago Metropolitan'});
 universe.recruits.push(targeted,plain,signed);
 assert.equal(api.grandfather(universe,null),false,'no controlled program yet, so wait');
 assert.equal(universe.recruitingActions,undefined);
 assert.equal(api.grandfather(universe,t),true);
 assert.equal(api.mayCommit(targeted,t),true,'a target already in flight keeps committing on interest');
 assert.equal(api.mayCommit(plain,t),false);
 assert.equal(api.grandfather(universe,t),false,'idempotent');
});

// ---------- engine integration ----------
async function engine(seed){
 const e=loadEngine({seed,fullRuntime:true});
 e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 return{e,A:globalThis.DynastyRecruitingActions,team:()=>e.universe.teams.find(x=>x.name==='Chicago Metropolitan')};
}

test('a new universe is stamped as using the desk, so nothing is grandfathered',async()=>{
 const {e}=await engine(7101);
 assert.equal(e.universe.recruitingActions.version,1);assert.equal(e.universe.recruitingActions.migrated,undefined);
});

test('worked targets climb while neglected ones cool, over a real stretch of the season',async()=>{
 const {e,A,team}=await engine(7102),u=e.universe;
 const pool=u.recruits.filter(r=>!r.committed).slice(0,16);pool.forEach(r=>{r.targeted=true});
 const worked=pool.slice(0,8),idle=pool.slice(8);
 const start=Object.fromEntries(pool.map(r=>[r.id,r.interest]));
 for(let w=0;w<7;w++){
  for(const r of worked)if(!r.committed){A.perform(r,team(),'call');const b=A.pitchOptions(r,team())[0];if(b.delta>=2)A.perform(r,team(),'pitch',{topic:b.topic})}
  e.simWeek();
 }
 const gain=list=>list.filter(r=>!r.committed).reduce((s,r)=>s+(r.interest-start[r.id]),0)/Math.max(1,list.filter(r=>!r.committed).length);
 assert.ok(gain(worked)>gain(idle)+10,`worked ${gain(worked).toFixed(1)} vs idle ${gain(idle).toFixed(1)}`);
 assert.ok(gain(idle)<=0,`neglected targets do not keep climbing (${gain(idle).toFixed(1)})`);
 const last=team().recruitingLastWeek;
 assert.ok(last&&last.cooledCount>0,'the weekly pass records who cooled');
 assert.equal(last.week,6);
});

test('the same seed and the same choices give the same recruiting results',async()=>{
 const run=async()=>{
  const {e,A,team}=await engine(7103),u=e.universe;
  const pool=u.recruits.filter(r=>!r.committed).slice(0,12);pool.forEach(r=>{r.targeted=true});
  for(let w=0;w<8;w++){for(const r of pool.slice(0,5))if(!r.committed){A.perform(r,team(),'call');if(r.interest>=50)A.perform(r,team(),'offer')}e.simWeek()}
  return JSON.stringify(u.recruits.slice(0,200).map(r=>[r.id,r.interest,r.relationship,r.committed]));
 };
 assert.equal(await run(),await run());
});

test('a targeted recruit at the finish line commits to you only if you made the offer',async()=>{
 const {e,A,team}=await engine(7104),u=e.universe,t=team();
 // Signing day walks the class in rank order, so use the best prospects still on the board.
 // Eight equally ripe targets: the first four are offered, the last four are not.
 const open=u.recruits.filter(r=>!r.committed).slice(0,8);
 for(const r of open){r.targeted=true;r.interest=95;r.relationship=80}
 const offered=open.slice(0,4),unoffered=open.slice(4);
 for(const r of offered)A.record(r,t,true).offered=true;
 e.finalizeRecruiting();
 assert.ok(offered.every(r=>r.committed===t.name),'every offered target came');
 const walkedIn=unoffered.filter(r=>r.committed===t.name).length;
 assert.ok(walkedIn<unoffered.length,`without an offer the interest-only path no longer hands him over (${walkedIn} of ${unoffered.length} still did)`);
});

test('a save from before the desk keeps its in-flight targets committing after normalization',async()=>{
 const {e,A,team}=await engine(7105),u=e.universe,t=team();
 const pool=u.recruits.filter(r=>!r.committed).slice(0,5);pool.forEach(r=>{r.targeted=true});
 delete u.recruitingActions;
 e.normalizeUniverse();
 assert.equal(u.recruitingActions.migrated,true);
 assert.ok(pool.every(r=>A.mayCommit(r,t)));
 const later=u.recruits.filter(r=>!r.committed&&!r.targeted)[0];later.targeted=true;
 assert.equal(A.mayCommit(later,t),false,'only what was already a target is grandfathered');
});

test('with staff handling recruiting, an ordinary week is worked for you; with it off, nothing is',async()=>{
 const play=async(seed,auto)=>{
  const {e,A,team}=await engine(seed),u=e.universe;
  const pool=u.recruits.filter(r=>!r.committed).slice(0,10);pool.forEach(r=>{r.targeted=true});
  A.setAuto(u,auto);
  e.simWeek();
  return{worked:pool.filter(r=>A.record(r,team(),false).lastWorkedWeek===0).length,last:team().recruitingLastWeek,A};
 };
 const on=await play(7107,true),off=await play(7107,false);
 assert.ok(on.worked>=5,`staff worked ${on.worked} of 10 targets`);
 assert.ok(on.last.spent>0);
 assert.equal(off.worked,0);assert.equal(off.last.spent,0);
 assert.ok(off.last.cooledCount===0,'the first week after targeting is a grace week');
});

test('staff fill in around what the coach already did and never exceed the budget',async()=>{
 const {e,A,team}=await engine(7108),u=e.universe,t=team();
 const pool=u.recruits.filter(r=>!r.committed).slice(0,12);pool.forEach(r=>{r.targeted=true});
 A.perform(pool[0],t,'visit');A.perform(pool[1],t,'pitch');
 const mine=A.weekInfo(t).spent;
 A.setAuto(u,true);e.simWeek();
 const last=t.recruitingLastWeek;
 assert.ok(last.spent>mine,'the staff spent more after the coach did');
 assert.ok(last.spent<=last.budget);
 assert.equal(A.record(pool[0],t,false).history.filter(h=>h.kind==='visit').length,1,'staff never book a second visit');
});

test('the weekly reminder to spend hours goes quiet once the staff have recruiting',async()=>{
 const {e,A,team}=await engine(7109),u=e.universe;
 assert.equal(globalThis.DynastyRecruitingWeek(team()).spent,0,'the reminder reads an unspent week');
 A.setAuto(u,true);
 assert.equal(globalThis.DynastyRecruitingWeek(team()),null,'and says nothing once the staff have it');
});

test('simulating the season hands the board to the staff instead of letting it cool',async()=>{
 const {e,A,team}=await engine(7106),u=e.universe;
 const pool=u.recruits.filter(r=>!r.committed).slice(0,10);pool.forEach(r=>{r.targeted=true});
 e.simWeek(true);
 assert.ok(pool.some(r=>A.workedThisWeek(r,team())||A.record(r,team(),false).lastWorkedWeek===0),'the staff worked the board before the week was played');
});
