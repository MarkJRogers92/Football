const test=require('node:test');
const assert=require('node:assert/strict');
const {makeScoutingTrailSystem}=require('../scouting-trail');

const receipt=(extra={})=>({season:2027,week:3,kind:'quick',cost:1,beforeConfidence:42,afterConfidence:50,beforeWidth:18,afterWidth:14,beforeVerdict:'Boardable',afterVerdict:'Strong target',...extra});

test('evaluation trail normalizes action deltas without mutating receipts',()=>{
 const api=makeScoutingTrailSystem(),record={receipts:[receipt()]},before=structuredClone(record),row=api.rows(record)[0];
 assert.equal(row.label,'Quick Film');assert.equal(row.confidenceGain,8);assert.equal(row.rangeTightening,4);assert.equal(row.verdictChanged,true);assert.deepEqual(record,before);
});

test('trail summary reconciles hours and cumulative report movement',()=>{
 const api=makeScoutingTrailSystem(),record={receipts:[receipt(),receipt({week:5,kind:'full',cost:3,beforeConfidence:50,afterConfidence:67,beforeWidth:14,afterWidth:8,beforeVerdict:'Strong target',afterVerdict:'Take'})]},s=api.summary(record);
 assert.equal(s.actions,2);assert.equal(s.hours,4);assert.equal(s.confidenceGain,25);assert.equal(s.rangeTightening,10);assert.equal(s.verdictChanges,2);assert.equal(s.lastVerdict,'Take');
});

test('trail preserves receipt chronology',()=>{
 const api=makeScoutingTrailSystem(),rows=api.rows({receipts:[receipt({week:2}),receipt({week:7,kind:'full'})]});assert.deepEqual(rows.map(x=>x.week),[2,7]);
});

test('hidden recruit fields cannot affect the evaluation trail',()=>{
 const api=makeScoutingTrailSystem(),record={receipts:[receipt()],trueNow:99,upside:99,growthProfile:'elite'},a=api.summary(record);record.trueNow=25;record.upside=30;record.growthProfile='late';assert.deepEqual(api.summary(record),a);
});
