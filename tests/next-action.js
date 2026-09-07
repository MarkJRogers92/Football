const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../next-action');

test('decisions outrank plan navigation',()=>{
 assert.deepEqual(api.model({decisionCount:2,items:[{label:'Play week 1',tab:'dashboard'}]}),{kind:'decision',label:'Resolve 2 decisions'});
});

test('first unfinished plan item wins',()=>{
 assert.deepEqual(api.model({items:[{done:true,label:'Review'},{done:false,label:'Run spring development',tab:'development',index:1},{done:false,label:'Fall camp',tab:'development',index:2}]}),{kind:'plan',label:'Run spring development',tab:'development',index:1});
});

test('postseason calendar gates map to their canonical controls',()=>{
 assert.equal(api.actionSelector('Play week 7'),'#simWeek');
 assert.equal(api.actionSelector('Play the conference championships'),'#simConf');
 assert.equal(api.actionSelector('Play the bowl games'),'#simBowls');
 assert.equal(api.actionSelector('Play the playoff'),'#simPlayoff');
 assert.equal(api.actionSelector('Build a recruiting board'),null);
});

test('regular-season labels only map when they identify a numbered week',()=>{
 assert.equal(api.actionSelector('Play week'),null);
 assert.equal(api.actionSelector('Play week seven'),null);
 assert.equal(api.actionSelector('Work your 12 recruiting targets'),null);
});

test('clear state never invents work',()=>{
 assert.deepEqual(api.model({items:[{done:true,label:'Review'}]}),{kind:'clear',label:'All caught up'});
});
