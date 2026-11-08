const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeTutorialSystem}=require('../tutorial.js');

test('the tour covers each desk, in order, with a tab and a target for every step',()=>{
 const T=makeTutorialSystem();
 assert.deepEqual(T.STEPS.map(s=>s.tab),['dashboard','recruiting','recruiting','staff','gamelab','program','offseason']);
 for(const s of T.STEPS){assert.ok(s.target.length&&s.title&&s.body.length>40)}
});

test('it is offered early in a new dynasty, once, until finished or dismissed',()=>{
 const T=makeTutorialSystem();
 const u={year:2027,week:0,phase:'regular',history:[]};
 assert.equal(T.shouldOffer(u),true);
 assert.equal(T.shouldOffer({...u,week:4}),false,'not after the first weeks');
 assert.equal(T.shouldOffer({...u,history:[{type:'season',year:2026}]}),false,'not in a dynasty that has finished a season');
 T.markDone(u,'dismissed');
 assert.equal(T.seen(u),true);assert.equal(u.tutorial.how,'dismissed');
 assert.equal(T.shouldOffer(u),false);
});
