const test=require('node:test');
const assert=require('node:assert/strict');
const {makeRecruitCompareSystem}=require('../recruit-compare');
const verdict=()=>({label:'Strong target',score:78,conviction:'Medium',confidence:64,strong:['Speed','Technique'],risk:'Processing'});
const record=()=>({season:2027,quick:true,full:false});
const api=()=>makeRecruitCompareSystem({staffVerdict:verdict,scoutingRecord:record});

test('compare list toggles and caps at three',()=>{const x=api();let ids=[];for(const id of ['1','2','3'])ids=x.toggle(ids,id).ids;const blocked=x.toggle(ids,'4');assert.equal(blocked.ok,false);assert.deepEqual(blocked.ids,['1','2','3']);const removed=x.toggle(ids,'2');assert.equal(removed.ok,true);assert.deepEqual(removed.ids,['1','3'])});

test('compare summary is staff-report only',()=>{const x=api(),t={id:1},r={id:'1',name:'Prospect',pos:'QB',trueNow:99,upside:99},a=x.summary(r,t);r.trueNow=25;r.upside=30;const b=x.summary(r,t);assert.deepEqual(b,a)});

test('compare summary carries scouting stage and uncertainty',()=>{const x=api(),s=x.summary({id:'1',name:'Prospect',pos:'QB'},{});assert.equal(s.stage,'Film reviewed');assert.equal(s.verdict,'Strong target');assert.equal(s.risk,'Processing')});
