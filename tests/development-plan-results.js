const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeDevelopmentPlanSystem}=require('../development-plans');

const plans=makeDevelopmentPlanSystem();
test('featured result follows focus skill gains even when overall stays flat',()=>{
 const result=plans.outcome('Technique',{overallDelta:0,attr:{technique:2,speed:0}});
 assert.equal(result.label,'Successful');assert.match(result.summary,/Technique \+2/);
});
test('mixed focus outcomes report both gains and losses, including Rehab directions',()=>{
 const skills=plans.outcome('Athleticism',{attr:{speed:-2,versatility:1}});
 assert.equal(skills.label,'Mixed');assert.match(skills.summary,/Speed -2/);assert.match(skills.summary,/Versatility \+1/);
 const rehab=plans.outcome('Rehab',{attr:{durability:0},healthDelta:5,wearDelta:3});
 assert.equal(rehab.label,'Mixed');assert.match(rehab.summary,/Health \+5/);assert.match(rehab.summary,/Wear \+3/);
});
test('Rehab and position transition use their recorded goals',()=>{
 assert.equal(plans.outcome('Rehab',{attr:{durability:0},healthDelta:4,wearDelta:-8}).label,'Outstanding');
 assert.equal(plans.outcome('Position Transition',{attr:{versatility:0},familiarityDelta:2}).label,'Successful');
 assert.equal(plans.outcome('Position Transition',{attr:{},familiarityDelta:0}).label,'No improvement');
});
test('capped target skills and flat camps do not fabricate a result',()=>{
 assert.equal(plans.outcome('Strength',{overallDelta:4,attr:{power:0,durability:0}}).label,'No improvement');
 assert.equal(plans.outcome('Rehab',{attr:{},healthDelta:0,wearDelta:0}).label,'No improvement');
 assert.equal(plans.outcome('Rehab',{attr:{},healthDelta:-2,wearDelta:1}).label,'Setback');
});
test('legacy receipts remain honest and phase progress is derived without mutation',()=>{
 const legacy={phase:'SPRING',overallDelta:2};
 assert.equal(plans.outcome('Athleticism',legacy).label,'Details unavailable');
 assert.equal(plans.outcome('Rehab',{phase:'SPRING',attr:{durability:2}}).label,'Details unavailable');
 const plan={focus:'Athleticism',receipts:[legacy]};
 assert.equal(plans.progress(plan),'Spring complete · Fall pending');
 assert.equal(plans.progress({receipts:[legacy,{phase:'FALL'}]}),'Completed cycle');
 assert.deepEqual(plan.receipts,[legacy]);
});
test('a plan holds one receipt per phase and keeps the latest observed phase result',()=>{
 const s=makeDevelopmentPlanSystem(),p={id:'P',trainingFocus:'Strength'},team={roster:[]},u={year:2027,phase:'complete',teams:[team]};team.roster=[p];s.toggle(p,u,'Strength');
 s.record(p,u,'spring',{overallDelta:1,attr:{power:1}});s.record(p,u,'spring',{overallDelta:2,attr:{power:2}});s.record(p,u,'fall',{overallDelta:0,attr:{power:0}});
 assert.equal(p.developmentPlan.receipts.length,2);assert.equal(p.developmentPlan.receipts.find(x=>x.phase==='SPRING').attr.power,2);
});
