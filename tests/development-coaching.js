const {test}=require('node:test');
const assert=require('node:assert/strict');
const {IDBFactory}=require('fake-indexeddb');
const {loadEngine}=require('../tools/harness');

async function setup(seed=9601,pos='QB'){
 const e=loadEngine({seed,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const t=e.T('Chicago Metropolitan'),p=t.roster.find(x=>x.pos===pos)||t.roster[0];p.pos=pos;p.coachRelationships={};
 for(const c of Object.values(t.staff))c.specialties=[];
 return{e,u:e.universe,t,p};
}

test('coaching context includes only the current head, SC and own-side coordinator',async()=>{
 const {e,t,p}=await setup();p.coachRelationships={};
 for(const key of ['HC','SC','OC','DC','RC'])t.staff[key].specialties=['Development specialist'];
 const result=e.resolveDevelopmentCoaching(t,p);
 assert.deepEqual(result.coaches.map(c=>c.coachId),[t.staff.HC.id,t.staff.SC.id,t.staff.OC.id]);
 assert.ok(!result.coaches.some(c=>c.role==='RC'||c.coachId===t.staff.RC.id));
 assert.ok(!result.coaches.some(c=>c.coachId===t.staff.DC.id));
 assert.ok(result.coaches.every(c=>Number.isFinite(c.support)));
});

test('specialties and exact current-coach relationships affect bounded support',async()=>{
 const {e,t,p}=await setup(9602);const neutral=e.resolveDevelopmentCoaching(t,p);
 for(const key of ['HC','SC','OC'])t.staff[key].specialties=['Development specialist'];
 p.coachRelationships=Object.fromEntries(['HC','SC','OC'].map(k=>[t.staff[k].id,100]));
 const positive=e.resolveDevelopmentCoaching(t,p);
 assert.ok(positive.modifier>neutral.modifier);assert.ok(positive.modifier<=.75);
 for(const key of ['HC','SC','OC'])t.staff[key].specialties=[];
 p.coachRelationships=Object.fromEntries(['HC','SC','OC'].map(k=>[t.staff[k].id,0]));
 const negative=e.resolveDevelopmentCoaching(t,p);
 assert.ok(negative.modifier<0);assert.ok(negative.modifier>=-.5);
 const stale=structuredClone(positive);p.coachRelationships={'old-coach-id':100};
 assert.equal(e.resolveDevelopmentCoaching(t,p).modifier,neutral.modifier);
 assert.ok(stale.modifier>neutral.modifier);
});

test('missing and invalid relationship values stay neutral and finite',async()=>{
 const {e,t,p}=await setup(9603);for(const key of ['HC','SC','OC'])t.staff[key].specialties=[];
 const baseline=e.resolveDevelopmentCoaching(t,p);p.coachRelationships={};
 assert.equal(e.resolveDevelopmentCoaching(t,p).modifier,baseline.modifier);
 for(const invalidValue of ['not-a-number','',true,[],{},-5,101]){
  p.coachRelationships={[t.staff.HC.id]:invalidValue};const invalid=e.resolveDevelopmentCoaching(t,p);
  assert.equal(invalid.modifier,baseline.modifier);assert.ok(Number.isFinite(invalid.modifier));
 }
 for(const key of ['HC','SC','OC'])t.staff[key].specialties=[{},null,7,'Development specialist'];
 assert.deepEqual(e.resolveDevelopmentCoaching(t,p).coaches.map(c=>c.specialties),[['Development specialist'],['Development specialist'],['Development specialist']]);
});

test('retired and explicitly foreign-school staff do not contribute',async()=>{
 const {e,t,p}=await setup(9608);for(const key of ['HC','SC','OC'])t.staff[key].specialties=['Development specialist'];
 const active=e.resolveDevelopmentCoaching(t,p);assert.ok(active.modifier>0);
 t.staff.HC.status='RETIRED';t.staff.SC.schoolId='other-school';t.staff.OC.leftSeason=2024;
 const rejected=e.resolveDevelopmentCoaching(t,p);assert.equal(rejected.modifier,0);assert.deepEqual(rejected.coaches,[]);
});

test('kickers receive no invented positional specialty match',async()=>{
 const {e,t,p}=await setup(9604,'K');for(const key of ['HC','SC','OC'])t.staff[key].specialties=[];
 const context=e.resolveDevelopmentCoaching(t,p);
 assert.ok(context.coaches.every(c=>c.positionalFit===null));
});

test('camp applies the same bounded coaching support and preserves report context after staff changes',async()=>{
 const e=loadEngine({seed:9605,fullRuntime:true,indexedDB:new IDBFactory()});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();let u=e.universe,t=e.T('Chicago Metropolitan'),p=t.roster.find(x=>x.pos==='QB');u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'spring',['review','departures','signing','portal']);
 const teamCoaches=['HC','SC','OC'];for(const key of teamCoaches)t.staff[key].specialties=['Development specialist'];
 p.coachRelationships=Object.fromEntries(teamCoaches.map(k=>[t.staff[k].id,100]));p.developmentPlan={season:u.year+1,featured:true,focus:'Technique',createdYear:u.year,receipts:[]};p.trainingFocus='Technique';
 u.playerArchive.push({...structuredClone(p),id:'archived-coaching-context'});await e.saveBrowser();await e.loadBrowser();assert.equal(e.archiveIsDeferred(),true);
 const pending=e.runSpringCamp();assert.equal(typeof pending.then,'function');await pending;u=e.universe;t=e.T('Chicago Metropolitan');p=t.roster.find(x=>x.pos==='QB');
 assert.equal(e.archiveIsDeferred(),false,'deferred calendar camp completed after archive hydration');
 const report=u.developmentState.springReport.find(x=>x.id===p.id),receipt=p.developmentPlan.receipts[0];
 assert.ok(report.coaching.modifier>0);assert.equal(receipt.coaching.summary,report.coaching.summary);assert.equal(receipt.phase,'SPRING');
 const frozen=structuredClone(receipt.coaching),oldStaffId=t.staff.SC.id;t.staff.SC={...t.staff.SC,id:'replacement-coach',name:'Replacement Coach'};
 assert.deepEqual(receipt.coaching,frozen);assert.notEqual(e.resolveDevelopmentCoaching(t,p).coaches.find(c=>c.role==='SC')?.coachId,oldStaffId);
 await e.saveBrowser();await e.loadBrowser();u=e.universe;t=e.T('Chicago Metropolitan');p=t.roster.find(x=>x.id===p.id);
 assert.equal(t.staff.SC.id,'replacement-coach');assert.deepEqual(p.developmentPlan.receipts[0].coaching,frozen,'recorded context survives a real installSave/loadBrowser round trip and staff change');
});

test('coaching modifier enters the canonical camp growth score before its phase scaling',async()=>{
 const {e,t,p}=await setup(9607);p.growthProfile='steady';p.eligibilityUsed=1;p.dev=60;p.work=60;p.coach=60;p.devFraction=0;
 for(const key of ['HC','SC','OC'])t.staff[key].specialties=[];
 p.coachRelationships={};const initial=structuredClone(p);
 e.setGameplayRng('coaching-growth-replay');const neutralDelta=e.applyDevelopmentPhase(p,t,'spring',{modifier:0});
 const neutralScore=neutralDelta+p.devFraction-initial.devFraction;
 const neutralDraws=e.syncGameplayRng().draws;
 for(const key of ['HC','SC','OC'])t.staff[key].specialties=['Development specialist'];
 p.coachRelationships=Object.fromEntries(['HC','SC','OC'].map(k=>[t.staff[k].id,100]));const context=e.resolveDevelopmentCoaching(t,p);
 for(const key of Object.keys(p))delete p[key];Object.assign(p,structuredClone(initial));
 e.setGameplayRng('coaching-growth-replay');const supportedDelta=e.applyDevelopmentPhase(p,t,'spring',context);
 const supportedScore=supportedDelta+p.devFraction-initial.devFraction;
 const supportedDraws=e.syncGameplayRng().draws;
 assert.ok(context.modifier>0);assert.ok(supportedScore>neutralScore);
 assert.ok(Math.abs((supportedScore-neutralScore)-context.modifier)<1e-9,JSON.stringify({neutralScore,supportedScore,modifier:context.modifier,neutralDelta,supportedDelta,devFraction:p.devFraction}));
 assert.equal(supportedDraws,neutralDraws,'coach fit changes the canonical score without adding random draws');
 const beforeResolve=e.syncGameplayRng();e.resolveDevelopmentCoaching(t,p);assert.deepEqual(e.syncGameplayRng(),beforeResolve,'resolving staff context is RNG-free');
 p.trueNow=70;p.upside=70;p.devFraction=0;e.setGameplayRng('coaching-ceiling-replay');
 e.applyDevelopmentPhase(p,t,'spring',context);assert.ok(p.trueNow<=70,'coaching support respects the existing player ceiling');
});

test('rendering the recorded development detail does not mutate the report or RNG',async()=>{
 const {e,u,t}=await setup(9606);u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'spring',['review','departures','signing','portal']);e.runSpringCamp();
 const report=structuredClone(u.developmentState.springReport),rng=structuredClone(e.syncGameplayRng()),row=report[0],player=t.roster.find(x=>x.id===row.id);
 for(let i=0;i<4;i++){const html=e.developmentResultDetailHTML(row,player);assert.match(html,/Coaching context/);assert.match(html,/small boost|neutral camp growth outlook/)}
 assert.deepEqual(u.developmentState.springReport,report);assert.deepEqual(e.syncGameplayRng(),rng);
});

test('malformed saved coaching snapshots fall back to no recorded context during render',async()=>{
 const {e,t}=await setup(9609),base={phase:'SPRING',name:'Test Player',pos:'QB',overallAfter:70,overallDelta:0,attr:{},attrAfter:{},heightAfter:72,heightDelta:0,weightAfter:200,weightDelta:0,familiarityAfter:70,familiarityDelta:0,confidenceAfter:50,confidenceDelta:0,healthAfter:100,wearAfter:0,teamFocus:'Balanced',focus:'Technique'};
 for(const coaching of [{summary:'bad',coaches:{}},{summary:'bad',coaches:[null]},{summary:'bad',coaches:[{role:'SC',coachName:'Coach',specialties:{}}]},{summary:'bad',coaches:[{role:'SC',coachName:'Coach',specialties:[{}],support:0}]}]){
  const html=e.developmentResultDetailHTML({...base,coaching},t.roster[0]);assert.match(html,/No coaching context recorded/);assert.doesNotMatch(html,/Coach ·/);
 }
});
