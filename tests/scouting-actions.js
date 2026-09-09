const test=require('node:test');
const assert=require('node:assert/strict');
const {makeScoutingActionSystem}=require('../scouting-actions');

function fixture(){
 const universe={year:2027,week:2,phase:'regular'};
 let domainReads=0;
 const api=makeScoutingActionSystem({
  getUniverse:()=>universe,
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  avg:a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,
  scoutingDomainView:r=>{domainReads++;return r.domains.map(x=>({...x}))},
  firstRecruitEvaluation:r=>{r.scoutingHistory??=[];r.scoutingHistory.push({phase:'FIRST_EVALUATION'});r.scoutingDomains={speed:{}}},
  refreshScoutingIntel:(r,t,gain)=>{r.domains=r.domains.map(x=>({...x,low:x.low+1,high:x.high-1,confidence:Math.min(96,x.confidence+gain)}))},
  snapshotScouting:(r,t,phase)=>{r.scoutingHistory??=[];r.scoutingHistory.push({phase});return true},
  staffEval:()=>72,
  staffBias:()=>3,
  hasDetailedScouting:r=>!!r.scoutingDomains
 });
 return{universe,api,domainReads:()=>domainReads};
}
const team=()=>({id:1,name:'Chicago Metropolitan',staff:{RC:{evaluation:78,recruiting:82},HC:{evaluation:70}}});
const recruit=()=>({id:'R1',name:'Test Recruit',trueNow:99,upside:99,scout:67,scoutUp:78,scoutConfidence:38,domains:[{key:'speed',label:'Speed',low:58,high:74,confidence:45},{key:'technique',label:'Technique',low:60,high:78,confidence:42},{key:'upside',label:'Upside',low:66,high:84,confidence:40}]});

test('weekly scouting budget stays bounded',()=>{const {api}=fixture(),t=team();assert.ok(api.scoutingBudgetFor(t)>=8);assert.ok(api.scoutingBudgetFor(t)<=14)});

test('quick film costs one hour and tightens the read',()=>{const {api}=fixture(),t=team(),r=recruit(),before=api.scoutingHoursLeft(t),res=api.performScoutingAction(r,t,'quick');assert.equal(res.ok,true);assert.equal(api.scoutingHoursLeft(t),before-1);assert.equal(res.receipt.afterConfidence>res.receipt.beforeConfidence,true);assert.equal(res.receipt.afterWidth<res.receipt.beforeWidth,true);assert.equal(api.actionAvailability(r,t,'quick').ok,false)});

test('full evaluation costs three and supersedes quick film',()=>{const {api}=fixture(),t=team(),r=recruit(),before=api.scoutingHoursLeft(t),res=api.performScoutingAction(r,t,'full');assert.equal(res.ok,true);assert.equal(api.scoutingHoursLeft(t),before-3);assert.equal(api.recruitScoutingRecord(r,t).full,true);assert.equal(api.actionAvailability(r,t,'quick').ok,false)});

test('budget resets when the week advances',()=>{const {api,universe}=fixture(),t=team(),r=recruit();api.performScoutingAction(r,t,'full');assert.ok(api.scoutingHoursLeft(t)<api.scoutingBudgetFor(t));universe.week++;assert.equal(api.scoutingHoursLeft(t),api.scoutingBudgetFor(t))});

test('cannot manually scout a recruit committed elsewhere',()=>{const {api}=fixture(),t=team(),r={...recruit(),committed:'Wisconsin Commonwealth'};const res=api.performScoutingAction(r,t,'quick');assert.equal(res.ok,false);assert.match(res.reason,/committed elsewhere/i)});

test('staff verdict never reads hidden true rating directly',()=>{const {api}=fixture(),t=team(),r=recruit(),a=api.staffVerdict(r,t);r.trueNow=30;r.upside=35;const b=api.staffVerdict(r,t);assert.deepEqual(b,a)});

test('staff verdict conviction improves after a full evaluation',()=>{const {api}=fixture(),t=team(),r=recruit(),before=api.staffVerdict(r,t);api.performScoutingAction(r,t,'full');const after=api.staffVerdict(r,t);assert.equal(before.conviction,'Preliminary');assert.notEqual(after.conviction,'Preliminary');assert.ok(after.confidence>before.confidence)});

test('preliminary verdict browsing does not create persistent scouting state',()=>{const {api,domainReads}=fixture(),t=team(),r=recruit();const before=JSON.stringify(r);const v=api.staffVerdict(r,t);assert.equal(v.conviction,'Preliminary');assert.equal(r.manualScouting,undefined);assert.equal(r.scoutingDomains,undefined);assert.equal(domainReads(),0);assert.equal(JSON.stringify(r),before)});

test('action availability is read-only until an evaluation is actually performed',()=>{const {api}=fixture(),t=team(),r=recruit();assert.equal(api.actionAvailability(r,t,'quick').ok,true);assert.equal(r.manualScouting,undefined);api.performScoutingAction(r,t,'quick');assert.ok(r.manualScouting?.['1']);assert.ok(r.scoutingDomains)});

test('manual scouting is available in opening preseason but not outside active recruiting',()=>{const {api,universe}=fixture(),t=team(),r=recruit();universe.phase='preseason';universe.week=0;assert.equal(api.actionAvailability(r,t,'quick').ok,true);universe.week=1;assert.equal(api.actionAvailability(r,t,'quick').ok,false);universe.phase='complete';universe.week=0;assert.equal(api.actionAvailability(r,t,'quick').ok,false)});

test('evaluation workload summarizes active targets without reading hidden talent',()=>{
 const {api}=fixture(),tm=team(),a={...recruit(),id:'A',targeted:true},b={...recruit(),id:'B',targeted:true},c={...recruit(),id:'C',targeted:true},other={...recruit(),id:'D',targeted:false};
 api.performScoutingAction(b,tm,'quick');api.performScoutingAction(c,tm,'full');
 const before=JSON.stringify([a,b,c,other]),w=api.evaluationWorkload([a,b,c,other],tm);
 assert.deepEqual({targets:w.targets,untouched:w.untouched,film:w.film,full:w.full},{targets:3,untouched:1,film:1,full:1});
 assert.equal(w.quickCapacity,1);assert.equal(w.fullCapacity,2);assert.equal(JSON.stringify([a,b,c,other]),before);
 a.trueNow=20;a.upside=25;assert.deepEqual(api.evaluationWorkload([a,b,c,other],tm),w);
});
