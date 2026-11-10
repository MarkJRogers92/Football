const test=require('node:test');
const assert=require('node:assert/strict');
const {makeRecruitingActionSystem}=require('../recruiting-actions');
const {loadEngine}=require('../tools/harness');

const PRIORITIES=['Prestige','NIL','Development','Early Role','Coaching','Academics','Scheme Fit','Winning','Stay Close','Campus Life'];
function fixture(over={}){
 const universe={year:2027,week:2,phase:'regular',recruits:[]};
 const calls={visit:0,grown:0,commits:[]};
 const api=makeRecruitingActionSystem({
  getUniverse:()=>universe,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  priorities:PRIORITIES,
  scholarshipCapacity:()=>over.capacity??16,
  unitStrength:()=>70,schemeFit:()=>70,distance:()=>300,
  recruitBlocked:over.blocked||(()=>false),
  growRecruiterRelationship:()=>{calls.grown++},
  ensureTargeted:r=>{r.targeted=true},
  scheduleVisit:r=>{calls.visit++;r.visitWeek=universe.week+1;r.visit=true},
  topRivals:(r,t,n)=>(over.rivals||['Kentucky Commonwealth','Texas Tech Plains','Ohio Valley']).slice(0,n),
  // Programs as he ranks them this week. Yours stands where `over.userScore` puts it before his interest is added.
  rankTeams:(r,t)=>[['Kentucky Commonwealth',100],['Texas Tech Plains',95],['Ohio Valley',90],['Alpha State',85],['Beta Tech',80],['Gamma University',70],[t.name,over.userScore??60]]
   .map(([name,score])=>({name,score})).sort((a,b)=>b.score-a.score),
  canTake:name=>!(over.full||[]).includes(name),
  commit:(r,name)=>{if((over.refuse||[]).includes(name))return false;r.committed=name;calls.commits.push(name);return true}
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

// ---------- motivations and dealbreakers ----------
// Find a recruit id whose hidden motives match a predicate, so the tests do not depend on luck.
function findMotive(api,pred,limit=3000){
 for(let i=0;i<limit;i++){const r=recruit(`M${i}`,{priority:PRIORITIES[i%PRIORITIES.length]});if(pred(api.motivesFor(r),r))return r}
 throw new Error('no recruit with those motives');
}
const strongTeam=()=>team({prestige:85,nil:85,development:85,academics:85,facilities:85,fan_support:85});
const weakTeam=()=>team({prestige:30,nil:30,development:30,academics:30,facilities:30,fan_support:30});
const CONTROLLABLE=['Prestige','NIL','Development','Academics','Campus Life'];

test('hidden motives are stable, valid and distinct, and about three in ten recruits have a dealbreaker',()=>{
 const {api}=fixture(),realRandom=Math.random;let deal=0;const N=1000;
 Math.random=()=>{throw new Error('motives must not draw randomness')};
 try{
  for(let i=0;i<N;i++){
   const r=recruit(`X${i}`,{priority:PRIORITIES[i%PRIORITIES.length]}),m=api.motivesFor(r);
   assert.deepEqual(m,api.motivesFor(r),'the same recruit always has the same motives');
   assert.ok(PRIORITIES.includes(m.secondary)&&m.secondary!==m.primary);
   if(m.dealbreaker){deal++;assert.ok(PRIORITIES.includes(m.dealbreaker)&&m.dealbreaker!==m.primary&&m.dealbreaker!==m.secondary)}
  }
 }finally{Math.random=realRandom}
 assert.ok(deal>N*.22&&deal<N*.38,`${deal} of ${N}`);
});

test('nothing about his second priority or dealbreaker is shown until contact uncovers it',()=>{
 const {api}=fixture(),t=strongTeam(),r=findMotive(api,m=>m.dealbreaker);
 let i=api.intel(r,t);
 assert.equal(i.primary,r.priority);assert.equal(i.secondary,null);assert.equal(i.dealbreaker,null);
 assert.equal(i.secondaryIn,2);assert.equal(i.dealbreakerIn,4);
 const menu=api.pitchOptions(r,t);
 assert.ok(menu.every(o=>!o.secondary&&!o.dealbreaker),'the pitch menu does not tag what you have not learned');
 const m=api.motivesFor(r);
 assert.equal(menu.find(o=>o.topic===m.secondary).fit,.4,'and prices it as if it did not matter');
});

test('two contacts uncover the second priority and four settle the dealbreaker',()=>{
 const {api}=fixture(),t=strongTeam(),r=findMotive(api,m=>m.dealbreaker),m=api.motivesFor(r);
 let out=api.perform(r,t,'call');assert.deepEqual(out.reveals,[]);
 out=api.perform(r,t,'call');
 assert.equal(out.reveals.length,1);assert.match(out.reveals[0],new RegExp(m.secondary));
 assert.equal(api.intel(r,t).secondary,m.secondary);assert.equal(api.intel(r,t).dealbreaker,null);
 api.perform(r,t,'call');out=api.perform(r,t,'call');
 assert.match(out.reveals[0],new RegExp(m.dealbreaker));
 assert.equal(api.intel(r,t).dealbreaker.topic,m.dealbreaker);
});

test('a recruit with no dealbreaker is eventually confirmed to have none',()=>{
 const {api}=fixture(),t=strongTeam(),r=findMotive(api,m=>!m.dealbreaker);
 for(let i=0;i<4;i++)api.perform(r,t,'call');
 assert.equal(api.intel(r,t).dealbreaker.none,true);
});

test('a visit shows you both at once, and pitching a hidden topic uncovers it',()=>{
 const {api}=fixture(),t=strongTeam(),r=findMotive(api,m=>m.dealbreaker);
 const out=api.perform(r,t,'visit');assert.equal(out.reveals.length,2);
 const a=findMotive(api,m=>m.dealbreaker),b=findMotive(api,m=>m.dealbreaker),ma=api.motivesFor(a);
 const p=api.perform(a,t,'pitch',{topic:ma.secondary});
 assert.equal(p.reveals.length,1,'one pitch on his second priority is enough');
 assert.match(p.note,/better than expected/);
 const q=api.perform(b,t,'pitch',{topic:api.motivesFor(b).dealbreaker});
 assert.ok(q.reveals.some(x=>/dealbreaker/.test(x)),'touching the sore spot shows you it');
});

test('his second priority pays more than the menu promised, and the menu catches up once you know',()=>{
 const {api}=fixture(),t=strongTeam(),r=findMotive(api,m=>m.secondary==='Academics'&&!m.dealbreaker);
 const shown=api.pitchProjection(r,t,'Academics').delta,out=api.perform(r,t,'pitch',{topic:'Academics'});
 assert.ok(out.dI>shown,`landed ${out.dI}, menu said ${shown}`);
 const after=api.pitchProjection(r,t,'Academics');
 assert.equal(after.fit,.7);assert.equal(after.secondary,true);
});

test('an unmet dealbreaker blocks the commit and drags the pitch, whether or not he has said so',()=>{
 const {api}=fixture(),weak=weakTeam(),strong=strongTeam();
 const r=findMotive(api,m=>m.dealbreaker&&CONTROLLABLE.includes(m.dealbreaker));
 api.perform(r,weak,'offer');
 assert.ok(api.dealbreakerUnmet(r,weak));assert.equal(api.mayCommit(r,weak),false);
 assert.equal(api.pitchBoost(r,weak),3-6,'the offer edge is more than eaten by the dealbreaker');
 assert.equal(api.knownBlock(r,weak),null,'he has not told you yet');
 const s=api.status(r,weak);assert.equal(s.blocked,null);
 // Same recruit, a program that clears his floor.
 api.perform(r,strong,'offer');
 assert.equal(api.dealbreakerUnmet(r,strong),null);assert.equal(api.mayCommit(r,strong),true);
});

test('once he tells you, it shows on the board and he is no longer "ready" for an offer',()=>{
 const {api}=fixture(),weak=weakTeam();
 const r=findMotive(api,m=>m.dealbreaker&&CONTROLLABLE.includes(m.dealbreaker));
 r.interest=80;r.targeted=true;
 assert.equal(api.status(r,weak).ready,true,'before he says anything he looks ready');
 api.perform(r,weak,'visit');
 const s=api.status(r,weak);
 assert.equal(s.blocked.topic,api.motivesFor(r).dealbreaker);assert.equal(s.ready,false);
 assert.ok(s.blocked.strength<s.blocked.floor);
});

test('staff do not spend an offer on a recruit who has said you cannot clear his dealbreaker',()=>{
 const {api,universe}=fixture(),weak=weakTeam();
 const blocked=findMotive(api,m=>m.dealbreaker&&CONTROLLABLE.includes(m.dealbreaker)),clear=findMotive(api,m=>!m.dealbreaker);
 for(const r of [blocked,clear]){r.targeted=true;r.interest=75;universe.recruits.push(r)}
 blocked.nationalRank=1;clear.nationalRank=2;
 api.perform(blocked,weak,'visit');// he tells you
 api.staffPlan(universe.recruits,weak);
 assert.equal(api.hasOffer(blocked,weak),false);assert.equal(api.hasOffer(clear,weak),true);
});

test('saves from before the desk have no hidden motives, so nothing changes under them',()=>{
 const {api,universe}=fixture(),weak=weakTeam();
 const r=findMotive(api,m=>m.dealbreaker&&CONTROLLABLE.includes(m.dealbreaker));
 universe.recruitingActions={migrated:true};
 assert.equal(api.dealbreakerUnmet(r,weak),null);assert.equal(api.intel(r,weak).on,false);
 api.perform(r,weak,'offer');assert.equal(api.mayCommit(r,weak),true);
 assert.equal(api.pitchProjection(r,weak,api.motivesFor(r).secondary,{actual:true}).fit,.4);
});

// ---------- rival reactions ----------
const worked=(api,r,t)=>{api.perform(r,t,'call');return r};
test('rivals only react to recruits you are actually working',()=>{
 const {api,universe}=fixture(),t=team();universe.week=5;
 const idle=recruit('I',{targeted:true}),untargeted=recruit('U'),signed=recruit('S',{targeted:true,committed:'Other U'}),active=worked(api,recruit('A'),t);
 universe.recruits.push(idle,untargeted,signed,active);
 for(let w=1;w<=11;w++){universe.week=w;api.generateRivals(universe.recruits,t)}
 assert.equal(api.rivalMoves(idle).length,0);assert.equal(api.rivalMoves(untargeted).length,0);assert.equal(api.rivalMoves(signed).length,0);
});

test('rival activity is decided by a hash, not by gameplay randomness, and repeats exactly',()=>{
 const run=()=>{
  const {api,universe}=fixture(),t=team(),realRandom=Math.random;
  for(let i=0;i<120;i++)universe.recruits.push(worked(api,recruit(`V${i}`,{stars:3+i%3}),t));
  Math.random=()=>{throw new Error('rivals must not draw randomness')};
  try{for(let w=1;w<=11;w++){universe.week=w;api.generateRivals(universe.recruits,t)}}finally{Math.random=realRandom}
  return JSON.stringify(universe.recruits.map(r=>api.rivalMoves(r)));
 };
 assert.equal(run(),run());
});

test('rivals escalate in order, offer then visit then in-home, and never before their week',()=>{
 const {api,universe}=fixture(),t=team();
 for(let i=0;i<300;i++)universe.recruits.push(worked(api,recruit(`E${i}`,{stars:3+i%3}),t));
 for(let w=1;w<=11;w++){universe.week=w;api.generateRivals(universe.recruits,t)}
 const order=['offer','visit','inhome'],minWeek={offer:1,visit:3,inhome:6},seen={offer:0,visit:0,inhome:0};
 for(const r of universe.recruits){
  const byTeam={};
  for(const m of api.rivalMoves(r).slice().reverse()){
   seen[m.kind]++;assert.ok(m.week>=minWeek[m.kind],`${m.kind} in week ${m.week}`);
   (byTeam[m.team]??=[]).push(m);
  }
  for(const list of Object.values(byTeam)){
   assert.deepEqual(list.map(m=>m.kind),order.slice(0,list.length),'steps come in order, none skipped');
   for(let i=1;i<list.length;i++)assert.ok(list[i].week>list[i-1].week||list[i].week===list[i-1].week);
  }
  assert.ok(api.rivalMoves(r).length<=12);
 }
 assert.ok(seen.offer>seen.visit&&seen.visit>seen.inhome&&seen.inhome>0,JSON.stringify(seen));
});

test('an unanswered move adds to that program only, and fades with time',()=>{
 const {api,universe}=fixture(),t=team(),r=worked(api,recruit('A'),t);universe.week=4;
 api.addRivalEvent(r,t,'Kentucky Commonwealth','visit');
 assert.equal(api.rivalHeat(r,'Kentucky Commonwealth'),5);assert.equal(api.rivalHeat(r,'Texas Tech Plains'),0);assert.equal(api.rivalHeat(r,t.name),0);
 universe.week=5;assert.equal(api.rivalHeat(r,'Kentucky Commonwealth'),5,'a full week at full strength');
 universe.week=6;assert.equal(api.rivalHeat(r,'Kentucky Commonwealth'),2.5,'then half');
 universe.week=8;assert.equal(api.rivalHeat(r,'Kentucky Commonwealth'),0,'then gone');
 assert.equal(api.rivalMoves(r)[0].state,'lapsed');
});

test('your own step answers a rival move, and only the right ones',()=>{
 const {api,universe}=fixture(),t=team();universe.week=7;
 const a=recruit('A',{interest:60}),b=recruit('B',{interest:60}),c=recruit('C',{interest:60});
 for(const r of [a,b,c]){worked(api,r,t);api.perform(r,t,'offer')}
 // They are offered by us already, so offers are born answered; visits and in-homes are not.
 for(const r of [a,b,c]){api.addRivalEvent(r,t,'Kentucky Commonwealth','visit');api.addRivalEvent(r,t,'Kentucky Commonwealth','inhome')}
 assert.equal(api.liveMoves(a).length,2);
 let out=api.perform(a,t,'visit');assert.equal(out.answered,1,'a visit answers a visit');
 assert.deepEqual(api.liveMoves(a).map(m=>m.kind),['inhome'],'but not an in-home');
 out=api.perform(b,t,'inhome');assert.equal(out.answered,2,'an in-home answers both');
 assert.equal(api.liveMoves(b).length,0);
 assert.equal(api.rivalHeat(b,'Kentucky Commonwealth'),0);
 assert.equal(api.liveMoves(c).length,2);
});

test('a rival offer is answered only by your own offer',()=>{
 const {api,universe}=fixture(),t=team(),r=worked(api,recruit('A',{interest:60}),t);universe.week=2;
 api.addRivalEvent(r,t,'Kentucky Commonwealth','offer');
 assert.equal(api.liveMoves(r).length,1);
 api.perform(r,t,'pitch');api.perform(r,t,'call');assert.equal(api.liveMoves(r).length,1,'talking is not an offer');
 assert.equal(api.perform(r,t,'offer').answered,1);assert.equal(api.liveMoves(r).length,0);
});

test('answering works in the opening preseason, when the week number is zero',()=>{
 const {api,universe}=fixture(),t=team(),r=worked(api,recruit('A',{interest:60}),t);universe.week=0;universe.phase='preseason';
 api.addRivalEvent(r,t,'Kentucky Commonwealth','offer');
 assert.equal(api.rivalHeat(r,'Kentucky Commonwealth'),3);
 api.perform(r,t,'offer');
 assert.equal(api.rivalHeat(r,'Kentucky Commonwealth'),0);assert.equal(api.liveMoves(r).length,0);assert.equal(api.rivalMoves(r)[0].state,'answered');
});

test('a move that matches something you already did is born answered',()=>{
 const {api,universe}=fixture(),t=team(),r=worked(api,recruit('A',{interest:60}),t);universe.week=6;
 api.perform(r,t,'offer');api.perform(r,t,'visit');
 assert.equal(api.addRivalEvent(r,t,'Kentucky Commonwealth','offer').answered,universe.week);
 assert.equal(api.addRivalEvent(r,t,'Texas Tech Plains','visit').answered,universe.week);
 assert.equal(api.addRivalEvent(r,t,'Ohio Valley','inhome').answered,false,'we have not been to the family');
});

test('the board counts live rival moves and drops committed recruits',()=>{
 const {api,universe}=fixture(),t=team();universe.week=4;
 const a=worked(api,recruit('A'),t),b=worked(api,recruit('B'),t),c=worked(api,recruit('C'),t);
 universe.recruits.push(a,b,c);
 api.addRivalEvent(a,t,'Kentucky Commonwealth','offer');api.addRivalEvent(a,t,'Texas Tech Plains','offer');api.addRivalEvent(b,t,'Kentucky Commonwealth','offer');
 assert.equal(api.workload(universe.recruits,t).rivals,3);
 assert.equal(api.status(a,t).rivals.length,2);
 b.committed='Other U';assert.equal(api.workload(universe.recruits,t).rivals,2);
 assert.equal(api.unansweredMoves(universe.recruits,t).length,1);
});

test('staff answer a rival offer sooner than an ordinary one, but leave visits to you',()=>{
 const {api,universe}=fixture(),t=team();universe.week=4;
 const threatened=recruit('T',{targeted:true,interest:45,nationalRank:1}),quiet=recruit('Q',{targeted:true,interest:45,nationalRank:2}),visited=recruit('V',{targeted:true,interest:70,nationalRank:3});
 universe.recruits.push(threatened,quiet,visited);
 api.addRivalEvent(threatened,t,'Kentucky Commonwealth','offer');api.addRivalEvent(visited,t,'Kentucky Commonwealth','offer');api.addRivalEvent(visited,t,'Kentucky Commonwealth','visit');
 api.staffPlan(universe.recruits,t);
 assert.equal(api.hasOffer(threatened,t),true,'a rival offered him, so they matched it');
 assert.equal(api.hasOffer(quiet,t),false,'nothing pressing at 45%');
 assert.equal(api.liveMoves(visited).some(m=>m.kind==='visit'),true,'the visit stays for you to answer');
 assert.ok(!visited.visitWeek);
});

test('staff make an offer to a recruit who has put you on his list, however warm he is',()=>{
 const {api,universe}=fixture({userScore:100}),t=team();universe.week=6;
 const listed=withDecision(api,9,{interest:30,nationalRank:1}),unlisted=withDecision(api,9,{interest:30,nationalRank:2},1);
 universe.recruits.push(listed,unlisted);
 api.runFunnel(universe.recruits,t);// both reach their Top 5 cut
 const f=api.funnelState(listed);assert.ok(f.top5.includes(t.name),'precondition: the first one lists you');
 api.funnelState(unlisted).top5=['Kentucky Commonwealth','Texas Tech Plains','Ohio Valley','Alpha State','Beta Tech'];
 api.staffPlan(universe.recruits,t);
 assert.equal(api.hasOffer(listed,t),true,'he cannot choose you without it');
 assert.equal(api.hasOffer(unlisted,t),false,'a recruit who left you off his list is not worth the hours');
});

test('the history of rival moves is bounded',()=>{
 const {api,universe}=fixture(),t=team(),r=worked(api,recruit('A'),t);
 for(let i=0;i<30;i++){universe.week=1+i%11;api.addRivalEvent(r,t,`Team ${i}`,'offer')}
 assert.ok(api.rivalMoves(r).length<=12);
});

// ---------- decision funnel ----------
// A board recruit whose decision lands in the given week, so tests do not depend on luck.
// `skip` picks a later match, so several distinct recruits can share a decision week. Never rename one
// afterwards: the date is a hash of his id.
function withDecision(api,week,over={},skip=0){
 let seen=0;
 for(let i=0;i<8000;i++){const r=recruit(`F${i}`,{targeted:true,interest:50,...over});if(api.decisionWeekFor(r)===week&&seen++===skip)return r}
 throw new Error(`no recruit decides in week ${week}`);
}
const standing=(api,r,t)=>api.funnelStatus(r,t);

test('every recruit has a fixed decision week, later for blue chips',()=>{
 const {api}=fixture();let early=0,late=0;
 for(let i=0;i<600;i++){
  const plain=recruit(`D${i}`,{stars:3}),blue=recruit(`D${i}`,{stars:5}),a=api.decisionWeekFor(plain),b=api.decisionWeekFor(blue);
  assert.equal(a,api.decisionWeekFor(plain),'stable');assert.ok(a>=5&&a<=10,`3-star ${a}`);assert.equal(b,Math.min(11,a+1));
  if(a===5)early++;if(a===10)late++;
 }
 assert.ok(early>50&&late>50,'the dates are spread across the season');
});

test('he cuts to a Top 5 three weeks out and a Top 3 one week out, and not before',()=>{
 const {api,universe}=fixture({userScore:80}),t=team(),r=withDecision(api,9,{interest:90});
 universe.recruits.push(r);
 for(const w of [1,5]){universe.week=w;api.runFunnel(universe.recruits,t);assert.equal(api.funnelState(r).top5,null,`week ${w}: no list yet`)}
 universe.week=6;api.runFunnel(universe.recruits,t);
 const f=api.funnelState(r);
 assert.equal(f.top5.length,5);assert.equal(f.top3,null);
 assert.ok(f.top5.includes(t.name),'interest at 90% lifts you into his Top 5');
 universe.week=8;api.runFunnel(universe.recruits,t);
 assert.equal(f.top3.length,3);assert.ok(f.top3.every(n=>f.top5.includes(n)),'the Top 3 comes out of the Top 5');
 assert.equal(f.cut,null);
});

test('your standing includes the work you put in, so a warmer recruit ranks you higher',()=>{
 const {api,universe}=fixture({userScore:70}),t=team();universe.week=6;
 const cold=withDecision(api,9,{interest:30}),warm=withDecision(api,9,{interest:95},1);
 api.runFunnel([cold],t);api.runFunnel([warm],t);
 assert.equal(api.funnelState(cold).top5.includes(t.name),false);assert.equal(api.funnelState(warm).top5.includes(t.name),true);
});

test('being cut ends it for the season: no actions, no commit, and the offer no longer counts',()=>{
 const {api,universe}=fixture({userScore:40}),t=team(),r=withDecision(api,8,{interest:40});
 universe.recruits.push(r);universe.week=3;api.perform(r,t,'offer');assert.equal(api.offersOut(universe.recruits,t),1);
 universe.week=5;api.runFunnel(universe.recruits,t);
 const f=api.funnelState(r);
 assert.deepEqual(f.cut,{week:5,at:'top5'});
 const a=api.availability(r,t,'call');assert.equal(a.ok,false);assert.match(a.reason,/cut .* from his Top 5 in week 5/);
 assert.equal(api.mayCommit(r,t),false);assert.equal(api.offersOut(universe.recruits,t),0);
 assert.equal(api.status(r,t).cut,true);assert.equal(standing(api,r,t).stage,'cut');
 // Staff do not keep working him.
 api.staffPlan(universe.recruits,t);assert.equal(api.workedThisWeek(r,t),false);
});

test('a program he likes and that has offered keeps a place on his list even when its pitch ranks lower',()=>{
 const {api,universe}=fixture({userScore:30}),t=team();universe.week=6;
 const kept=withDecision(api,9,{interest:70}),notOffered=withDecision(api,9,{interest:70},1);
 kept.recruitingActions={[String(t.id)]:{season:universe.year,offered:true,history:[],contacts:0,known:{secondary:false,dealbreaker:false}}};
 api.runFunnel([kept],t);api.runFunnel([notOffered],t);
 assert.ok(api.funnelState(kept).top5.includes(t.name));assert.equal(api.funnelState(kept).top5.length,5);
 assert.equal(api.funnelState(notOffered).top5.includes(t.name),false,'a program with no offer gets no such favour');
});

test('he can cut you at the Top 3 as well',()=>{
 const {api,universe}=fixture({userScore:70}),t=team(),r=withDecision(api,9,{interest:100});
 // Strong enough for the Top 5 but not the Top 3 once the field is trimmed.
 universe.week=6;api.runFunnel([r],t);assert.ok(api.funnelState(r).top5.includes(t.name));
 r.interest=1;universe.week=8;api.runFunnel([r],t);
 assert.deepEqual(api.funnelState(r).cut,{week:8,at:'top3'});
});

test('while he waits for his date he does not commit on the weekly roll, and afterwards he does',()=>{
 const {api,universe}=fixture(),t=team(),r=withDecision(api,9,{interest:90});universe.recruits.push(r);
 universe.week=5;api.runFunnel(universe.recruits,t);assert.equal(api.holds(r,t),true);
 universe.week=9;api.runFunnel(universe.recruits,t);
 assert.ok(r.committed,'he decided');assert.equal(api.holds(r,t),false);
 assert.equal(api.holds(recruit('X',{targeted:false}),t),false,'recruits off your board are untouched');
});

test('he picks the best finalist, you only if you offered, and a team with no room is skipped',()=>{
 const {api,universe}=fixture({userScore:200}),t=team();universe.week=9;
 const offered=withDecision(api,9,{interest:90}),blind=withDecision(api,9,{interest:90},1);
 offered.recruitingActions={[String(t.id)]:{season:universe.year,offered:true,history:[],contacts:0,known:{secondary:false,dealbreaker:false}}};
 api.runFunnel([offered],t);api.runFunnel([blind],t);
 assert.equal(offered.committed,t.name,'you stand first and you offered');
 assert.notEqual(blind.committed,t.name,'without an offer you cannot be chosen however well you stand');
 assert.ok(blind.committed,'he still picks somebody');
 // Room matters too.
 const {api:api2,universe:u2}=fixture({userScore:0,full:['Kentucky Commonwealth','Texas Tech Plains']}),r=withDecision(api2,9,{interest:100});u2.week=9;
 api2.runFunnel([r],t);assert.ok(r.committed&&!['Kentucky Commonwealth','Texas Tech Plains'].includes(r.committed));
});

test('when none of his finalists has room he goes to the best program that does',()=>{
 const {api,universe}=fixture({userScore:0,full:['Kentucky Commonwealth','Texas Tech Plains','Ohio Valley']}),t=team(),r=withDecision(api,9,{interest:20});
 universe.week=9;const out=api.runFunnel([r],t);
 assert.equal(out.decided[0].fallback,true);assert.equal(r.committed,'Alpha State');assert.equal(api.funnelState(r).decided.fallback,true);
});

test('decisions repeat exactly and respect a program that refuses the commitment',()=>{
 const run=()=>{const {api,universe}=fixture({userScore:92,refuse:['Kentucky Commonwealth']}),t=team(),out=[];
  for(let i=0;i<40;i++){const r=withDecision(api,9,{interest:60},i);universe.week=9;api.runFunnel([r],t);out.push(r.committed)}return out.join('|')};
 assert.equal(run(),run());assert.ok(!run().includes('Kentucky Commonwealth'));
});

test('the funnel reads where you stand and what comes next, without changing anything',()=>{
 const {api,universe}=fixture({userScore:80}),t=team(),r=withDecision(api,9,{interest:80});universe.week=3;
 const before=JSON.stringify(r),st=standing(api,r,t);
 assert.equal(JSON.stringify(r),before,'reading the funnel writes nothing');
 assert.equal(st.stage,'open');assert.equal(st.decisionWeek,9);assert.equal(st.weeksLeft,6);
 assert.deepEqual(st.next,{kind:'top5',week:6,size:5});assert.ok(st.rank>=1&&st.cushion!=null);
});

test('decisions due lists the recruits about to pick, soonest first, and skips the cut and the committed',()=>{
 const {api,universe}=fixture(),t=team();universe.week=7;
 const a=withDecision(api,8),b=withDecision(api,7),far=withDecision(api,10),cut=withDecision(api,8,{},1),done=withDecision(api,8,{},2);
 api.runFunnel([cut],t);api.funnelState(cut).cut={week:6,at:'top5'};done.committed='Other U';
 const rows=api.decisionsDue([a,b,far,cut,done],t,1);
 assert.deepEqual(rows.map(x=>x.recruit.id),[b.id,a.id]);
});

test('saves from before the desk have no funnel at all',()=>{
 const {api,universe}=fixture({userScore:0}),t=team(),r=withDecision(api,6,{interest:10});
 universe.recruitingActions={migrated:true};universe.week=6;
 assert.equal(api.funnelOn(),false);assert.deepEqual(api.runFunnel([r],t),{decided:[],cut:[]});
 assert.equal(api.holds(r,t),false);assert.equal(r.committed,null);assert.equal(standing(api,r,t).on,false);
});

// ---------- flip defense ----------
test('a check-in is only for your own commitments, and only once flip season opens',()=>{
 const {api,universe}=fixture(),t=team(),mine=recruit('M',{committed:t.name}),theirs=recruit('T',{committed:'Other U'}),open=recruit('O');
 universe.week=3;assert.match(api.availability(mine,t,'keep').reason,/Flip season opens in week 5/);
 universe.week=6;assert.equal(api.availability(mine,t,'keep').ok,true);
 assert.match(api.availability(theirs,t,'keep').reason,/committed to you/);assert.match(api.availability(open,t,'keep').reason,/committed to you/);
 assert.equal(api.availability(mine,t,'call').ok,false,'everything else is still closed to a commit');
});

test('a check-in costs two hours, answers every move aimed at him, and holds him for two weeks',()=>{
 const {api,universe}=fixture(),t=team(),r=recruit('M',{committed:t.name,targeted:true});universe.week=6;
 api.record(r,t,true).lastWorkedWeek=2;
 api.addRivalEvent(r,t,'Kentucky Commonwealth','offer');api.addRivalEvent(r,t,'Texas Tech Plains','visit');api.addRivalEvent(r,t,'Ohio Valley','inhome');
 assert.equal(api.liveMoves(r).length,3,'rivals\' moves on a commitment are never born answered');
 assert.deepEqual(api.liveMoves(r)[0].answerWith,['keep']);
 const hours=api.hoursLeft(t),out=api.perform(r,t,'keep');
 assert.equal(out.ok,true);assert.equal(out.cost,2);assert.equal(api.hoursLeft(t),hours-2);assert.equal(out.answered,3);assert.equal(api.liveMoves(r).length,0);
 universe.week=7;assert.equal(api.keepBoost(r,t),8);
 universe.week=8;assert.equal(api.keepBoost(r,t),4);
 universe.week=9;assert.equal(api.keepBoost(r,t),0,'it fades');
});

test('rivals start working on your commitments in flip season, and only on yours',()=>{
 const {api,universe}=fixture(),t=team();
 const mine=[],theirs=[];
 for(let i=0;i<200;i++){
  const a=recruit(`C${i}`,{committed:t.name,stars:4}),b=recruit(`E${i}`,{committed:'Other U',stars:4});
  api.record(a,t,true).lastWorkedWeek=1;api.record(b,t,true).lastWorkedWeek=1;mine.push(a);theirs.push(b);
 }
 for(let w=1;w<=4;w++){universe.week=w;api.generateRivals([...mine,...theirs],t)}
 assert.equal(mine.filter(r=>api.rivalMoves(r).length).length,0,'nothing before week 5');
 for(let w=5;w<=11;w++){universe.week=w;api.generateRivals([...mine,...theirs],t)}
 assert.ok(mine.filter(r=>api.rivalMoves(r).length).length>20,'a real share of commitments get approached');
 assert.equal(theirs.filter(r=>api.rivalMoves(r).length).length,0);
 assert.ok(api.unansweredMoves(mine,t).length>0);assert.equal(api.workload(mine,t).rivals,api.unansweredMoves(mine,t).reduce((n,x)=>n+x.moves.length,0));
});

test('staff check in on a commitment under pressure before anything else',()=>{
 const {api,universe}=fixture(),t=team(),threatened=recruit('M',{committed:t.name,targeted:true}),calm=recruit('Q',{committed:t.name,targeted:true});universe.week=7;
 api.record(threatened,t,true).lastWorkedWeek=2;api.record(calm,t,true).lastWorkedWeek=2;
 api.addRivalEvent(threatened,t,'Kentucky Commonwealth','visit');
 const out=api.staffPlan([threatened,calm],t);
 assert.equal(out.keeps,1);assert.equal(api.liveMoves(threatened).length,0);assert.equal(api.keepBoost(calm,t),0,'no spend on a commitment nobody is chasing');
});

// ---------- news and the season ledger ----------
const decidedFor=(r,over={})=>({recruit:r,team:'Kentucky Commonwealth',won:false,finalists:[],listed:true,offered:true,...over});
function weekOf(api,universe,t,input){
 // What the weekly pass does: record the week, then keep it as last week's news.
 const week=api.noteWeek(t,input);
 universe.week++;
 t.recruitingLastWeek={year:universe.year,week:universe.week-1,funnel:{won:week.won,lost:week.lost,cut:week.cut},flipped:week.flipped};
 return week;
}

test('spending is recorded in the season ledger and nothing is reported before the desk has done anything',()=>{
 const {api,universe}=fixture(),t=team(),r=recruit('A',{interest:60});
 assert.equal(api.deskSummary(t),null);
 api.perform(r,t,'call');api.perform(r,t,'pitch');api.perform(r,t,'offer');
 const d=api.deskSummary(t);
 assert.equal(d.hours,2+3+2);assert.deepEqual(d.actions,{call:1,pitch:1,offer:1});
 universe.year++;assert.equal(api.deskSummary(t),null,'the ledger belongs to its season');
});

test('lost recruits are explained from the records: no room, not listed, never offered, or simply beaten',()=>{
 const {api,universe}=fixture(),t=team();universe.week=7;
 const r=(id,stars=4)=>recruit(id,{stars,pos:'QB'});
 weekOf(api,universe,t,{decided:[
  decidedFor(r('a'),{fallback:true}),decidedFor(r('b'),{listed:false,offered:false}),decidedFor(r('c'),{listed:true,offered:false}),decidedFor(r('d'),{listed:true,offered:true})]});
 const items=api.newsItems(t),lost=items.filter(x=>x.kicker==='LOST');
 assert.equal(lost.length,4);
 const by=name=>lost.find(x=>x.main.includes(`Recruit ${name}`)).sub;
 assert.match(by('a'),/had room/);assert.match(by('b'),/not on his final list/);assert.match(by('c'),/never made him an offer/);assert.match(by('d'),/chose Kentucky Commonwealth/);
 assert.match(lost[0].main,/★★★★ QB Recruit/,'stars and position lead the headline');
 assert.ok(lost.every(x=>x.type==='bad-news'&&x.tab==='recruiting'&&x.recruit));
});

test('a cut names who made his list, and a flip names where he went',()=>{
 const {api,universe}=fixture({userScore:0}),t=team();
 const r=withDecision(api,9,{interest:5,stars:5,pos:'WR'});universe.week=6;
 const out=api.runFunnel([r],t);assert.equal(out.cut.length,1);
 const f=recruit('F',{stars:3,pos:'CB'});
 weekOf(api,universe,t,{cut:out.cut,flipped:[{recruit:f,to:'Texas Tech Plains'}]});
 const items=api.newsItems(t);
 const cut=items.find(x=>x.kicker==='CUT'),flip=items.find(x=>x.kicker==='FLIPPED');
 assert.match(cut.main,/cut you from his Top 5/);assert.match(cut.sub,/His list: Kentucky Commonwealth/);assert.doesNotMatch(cut.sub,/Chicago Metropolitan/,'you are not listed among those who made it');
 assert.match(flip.main,/CB .* flipped to Texas Tech Plains/);assert.equal(flip.type,'bad-news');
 assert.ok(flip.importance>cut.importance,'losing a commitment outranks being cut');
});

test('news is only for the week just played, and a quiet week has none',()=>{
 const {api,universe}=fixture(),t=team();universe.week=7;
 assert.deepEqual(api.newsItems(t),[]);
 weekOf(api,universe,t,{decided:[decidedFor(recruit('a'))]});
 assert.equal(api.newsItems(t).length,1);
 universe.week++;assert.deepEqual(api.newsItems(t),[],'it does not linger into the next week');
 weekOf(api,universe,t,{});assert.deepEqual(api.newsItems(t),[]);
});

test('commitments to you are left to the existing commitment item, not repeated as news',()=>{
 const {api,universe}=fixture(),t=team();universe.week=7;
 weekOf(api,universe,t,{decided:[decidedFor(recruit('a'),{won:true,team:t.name})]});
 assert.deepEqual(api.newsItems(t),[]);assert.equal(api.deskSummary(t).won,1,'but the year still counts it');
});

test('the season summary finds the biggest win and loss and counts the offers that never came',()=>{
 const {api,universe}=fixture(),t=team();universe.week=7;
 weekOf(api,universe,t,{decided:[
  decidedFor(recruit('w1',{stars:3}),{won:true,team:t.name}),decidedFor(recruit('w2',{stars:5}),{won:true,team:t.name}),
  decidedFor(recruit('l1',{stars:2}),{offered:true}),decidedFor(recruit('l2',{stars:4}),{listed:true,offered:false}),decidedFor(recruit('l3',{stars:3}),{listed:false,offered:false})],
  flipped:[{recruit:recruit('f'),to:'Ohio Valley'}],rivalMoves:6});
 api.perform(recruit('x',{interest:50}),t,'call');
 const d=api.deskSummary(t);
 assert.equal(d.won,2);assert.equal(d.lost,3);assert.equal(d.flipped,1);
 assert.equal(d.biggestWin.stars,5);assert.equal(d.biggestLoss.stars,4);assert.match(d.biggestLoss.why,/never made him an offer/);
 assert.equal(d.neverOffered,1,'only recruits who had you on a final list count');
 assert.ok(d.answered<=d.rivalMoves,'answered can never exceed what happened');assert.equal(d.rivalMoves,6);
});

test('the ledger keeps only the most recent entries',()=>{
 const {api,universe}=fixture(),t=team();universe.week=7;
 for(let i=0;i<60;i++)api.noteWeek(t,{decided:[decidedFor(recruit(`l${i}`))]});
 assert.equal(t.recruitingSeason.lost.length,40);assert.equal(t.recruitingSeason.lost.at(-1).name,'Recruit l59');
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

test('an unanswered rival move raises that rival\'s pitch in the real race, and answering takes it back',async()=>{
 const {e,A,team}=await engine(7110),u=e.universe,t=team();
 const r=u.recruits.filter(x=>!x.committed)[0];r.targeted=true;A.perform(r,t,'call');
 const rival=u.teams.find(x=>x.name!==t.name),other=u.teams.find(x=>x.name!==t.name&&x!==rival);
 const base=e.recruitPitch(rival,r),otherBase=e.recruitPitch(other,r),mine=e.recruitPitch(t,r);
 A.addRivalEvent(r,t,rival.name,'offer');
 assert.equal(e.recruitPitch(rival,r)-base,3,'their pitch rose by the move\'s weight');
 assert.equal(e.recruitPitch(other,r),otherBase,'nobody else moved');assert.equal(e.recruitPitch(t,r),mine);
 A.perform(r,t,'offer');
 assert.equal(e.recruitPitch(rival,r),base,'answering takes it back');
});

test('rival moves show up in the desk, on the card, in the sidebar and in the weekly reminder',async()=>{
 const {e,A,team}=await engine(7111),u=e.universe,t=team(),D=globalThis.DynastyRecruitingDesk;
 const r=u.recruits.filter(x=>!x.committed)[0];r.targeted=true;A.perform(r,t,'call');
 assert.doesNotMatch(D.badge(r.id),/ra-rival-badge/,'no rival flag yet');assert.doesNotMatch(D.html(r.id),/RIVAL WATCH/);assert.equal(globalThis.DynastyRecruitingRivals(t).count,0);
 const rival=u.teams.find(x=>x.name!==t.name);
 A.addRivalEvent(r,t,rival.name,'visit');
 const desk=D.html(r.id);
 assert.match(desk,/RIVAL WATCH/);assert.match(desk,new RegExp(rival.name));assert.match(desk,/Unanswered/);
 assert.match(desk,/class="ra-answer"[^>]*data-ra-action="visit"/,'the buttons that would answer it are marked');
 assert.match(desk,/class="ra-answer"[^>]*data-ra-action="inhome"|data-ra-action="inhome"/);
 assert.match(D.badge(r.id),new RegExp(rival.name));
 assert.match(D.nav(),/RIVAL MOVES/);assert.match(D.nav(),new RegExp(`data-rwid="${r.id}"`));
 const reminder=globalThis.DynastyRecruitingRivals(t);assert.equal(reminder.count,1);assert.deepEqual(reminder.names,[r.name]);
 A.perform(r,t,'visit');
 assert.equal(globalThis.DynastyRecruitingRivals(t).count,0);assert.match(D.html(r.id),/Answered/);
});

test('the same seed and the same choices give the same rival moves',async()=>{
 const run=async()=>{
  const {e,A,team}=await engine(7112),u=e.universe,t=team();
  const pool=u.recruits.filter(r=>!r.committed).slice(0,15);pool.forEach(r=>{r.targeted=true});
  for(let w=0;w<9;w++){for(const r of pool)if(!r.committed)A.perform(r,t,'call');e.simWeek()}
  return JSON.stringify(pool.map(r=>A.rivalMoves(r)));
 };
 const a=await run(),b=await run();assert.equal(a,b);assert.ok(JSON.parse(a).some(x=>x.length),'something happened');
});

test('on a real board nobody commits before his date, and everybody has chosen by the end of the season',async()=>{
 const {e,A,team}=await engine(7120),u=e.universe,t=team();
 const board=u.recruits.filter(r=>!r.committed).slice(0,30);board.forEach(r=>{r.targeted=true});
 for(let w=1;w<=11;w++){
  for(const r of board)if(!r.committed&&!A.funnelState(r)?.cut)A.perform(r,t,'call');
  e.simWeek();
  for(const r of board){
   const dw=A.decisionWeekFor(r);
   if(dw>u.week)assert.ok(!r.committed,`${r.name} committed in week ${u.week}, before his week ${dw}`);
   else assert.ok(r.committed,`${r.name} should have decided by week ${u.week} (his date was ${dw})`);
  }
 }
 const f=t.recruitingLastWeek.funnel;assert.ok(f&&Array.isArray(f.won)&&Array.isArray(f.lost)&&Array.isArray(f.cut));
});

test('the funnel is deterministic on a real board',async()=>{
 const run=async()=>{
  const {e,A,team}=await engine(7121),u=e.universe,t=team();
  const board=u.recruits.filter(r=>!r.committed).slice(0,25);board.forEach(r=>{r.targeted=true});
  for(let w=0;w<10;w++){for(const r of board)if(!r.committed&&!A.funnelState(r)?.cut){A.perform(r,t,'call');if(r.interest>=50)A.perform(r,t,'offer')}e.simWeek()}
  return JSON.stringify(board.map(r=>[r.committed,A.funnelState(r)?.cut,A.funnelState(r)?.top3]));
 };
 assert.equal(await run(),await run());
});

test('the desk, the commitment panel, the sidebar and the card all show the funnel',async()=>{
 const {e,A,team}=await engine(7122),u=e.universe,t=team(),D=globalThis.DynastyRecruitingDesk;
 const [a,b,c]=u.recruits.filter(r=>!r.committed);a.targeted=true;A.perform(a,t,'call');
 const dw=A.decisionWeekFor(a);
 const desk=D.html(a.id);
 assert.match(desk,/class="ra-funnel"/);assert.match(desk,new RegExp(`week ${dw}`));assert.match(desk,/Next cut/);assert.match(desk,/cannot choose you without a scholarship offer/);
 A.perform(a,t,'offer');assert.doesNotMatch(D.html(a.id),/cannot choose you without/);
 assert.match(D.badge(a.id),new RegExp(`Decides week ${dw}`));
 // A recruit decides soon: he shows in the sidebar and the reminder.
 u.week=dw-1;
 assert.match(D.nav(),/DECIDING SOON/);assert.match(D.nav(),new RegExp(`data-rwid="${a.id}"`));
 assert.ok(globalThis.DynastyRecruitingDecisions(t).count>=1);
 // Cut: the card and desk say so.
 A.funnelState(a)??(a.funnel={season:u.year,decisionWeek:dw,top5:null,top3:null,cut:null,decided:null});
 a.funnel.cut={week:u.week,at:'top5'};
 assert.match(D.badge(a.id),/Cut you/);assert.match(D.html(a.id),/Cut you from his Top 5/);
 // A commitment to you gets the care panel; to anyone else, nothing.
 b.committed=t.name;u.week=6;A.record(b,t,true);
 const care=D.html(b.id);
 assert.match(care,/COMMITMENT/);assert.match(care,/Check in · 2h/);assert.match(care,/data-ra-action="keep"/);assert.doesNotMatch(care,/data-ra-action="call"/);
 c.committed='Some Other University';assert.equal(D.html(c.id),'');
});

test('over a real season the This Week list reports what happened, and the review totals match',async()=>{
 const {e,A,team}=await engine(7130),u=e.universe,t=team();
 const board=u.recruits.filter(r=>!r.committed).slice(0,30);board.forEach(r=>{r.targeted=true});
 const seen={LOST:0,CUT:0,FLIPPED:0};
 A.setAuto(u,true);
 for(let w=1;w<=12;w++){
  e.simWeek();
  for(const item of u.weeklyHub||[])if(seen[item.kicker]!==undefined){
   seen[item.kicker]++;
   assert.ok(item.recruit&&item.main&&item.sub,'every item says who, what and why');
   assert.ok(u.recruits.some(r=>String(r.id)===String(item.recruit)),'and points at a real recruit');
  }
 }
 const d=A.deskSummary(t);
 assert.ok(d&&d.hours>0&&d.budget>=d.hours,'the staff worked the board and the year records it');
 // With Staff handle recruiting on, the staff also add prospects to the board, so count the whole board.
 const worked=u.recruits.filter(r=>r.targeted||board.includes(r));
 assert.ok(worked.length>=board.length);
 assert.equal(d.won+d.lost,worked.filter(r=>A.funnelState(r)?.decided).length,'every decision is counted exactly once');
 assert.equal(d.cut,worked.filter(r=>A.funnelState(r)?.cut).length);
 assert.ok(seen.LOST+seen.CUT>0,`something was worth reporting (${JSON.stringify(seen)})`);
 e.simConferenceChampionships();e.simBowls();e.simPlayoff();
 const m=globalThis.DynastySeasonReview.model();
 assert.ok(m&&m.desk,'the season review carries the desk');
 assert.equal(m.desk.hours,d.hours);
 const html=globalThis.DynastySeasonReview.html(m);
 assert.match(html,/RECRUITING DESK/);assert.match(html,/hours spent/);assert.match(html,/chose you/);
});

test('simulating the season hands the board to the staff instead of letting it cool',async()=>{
 const {e,A,team}=await engine(7106),u=e.universe;
 const pool=u.recruits.filter(r=>!r.committed).slice(0,10);pool.forEach(r=>{r.targeted=true});
 e.simWeek(true);
 assert.ok(pool.some(r=>A.workedThisWeek(r,team())||A.record(r,team(),false).lastWorkedWeek===0),'the staff worked the board before the week was played');
});
