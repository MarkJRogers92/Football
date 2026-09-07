const test=require('node:test');
const assert=require('node:assert/strict');
const {makeDevelopmentVisualizationModel}=require('../development-visualization-adapter');

const model=makeDevelopmentVisualizationModel();
const players=[
 {id:'a',name:'Alex Reed',pos:'WR',perceived:78,scoutConfidence:76,campHistory:[{year:2029,phase:'Spring',delta:2,attr:{technique:2}},{year:2029,phase:'Fall',delta:1,attr:{iq:1}},{year:2030,phase:'Spring',delta:4,attr:{speed:1,technique:2}}]},
 {id:'b',name:'Ben Stone',pos:'WR',perceived:70,scoutConfidence:68,campHistory:[{year:2030,phase:'Spring',delta:1,attr:{power:1}}]},
 {id:'c',name:'Chris Vale',pos:'LB',perceived:73,scoutConfidence:61,campHistory:[{year:2030,phase:'Spring',delta:-1,attr:{iq:-1}}]},
 {id:'d',name:'Drew King',pos:'QB',perceived:69,scoutConfidence:59,campHistory:[]}
];

test('team dashboard uses only the latest observed camp window',()=>{
 const x=model.team(players);assert.equal(x.cycle.year,2030);assert.equal(x.cycle.phase,'Spring');assert.equal(x.cycle.rows.length,3);assert.equal(x.average,1.3);assert.equal(x.improved,2);assert.equal(x.declined,1);assert.equal(x.risers[0].id,'a');assert.equal(x.stalledPlayers[0].id,'b');
});

test('position groups summarize observed movement without hidden state',()=>{
 const x=model.team(players);const wr=x.groups.find(g=>g.pos==='WR'),lb=x.groups.find(g=>g.pos==='LB');assert.equal(wr.average,2.5);assert.equal(wr.players,2);assert.equal(lb.average,-1);assert.equal('trueTalent' in wr,false);assert.equal(JSON.stringify(x).includes('potential'),false);
});

test('player progression is cumulative observed camp movement',()=>{
 const x=model.player(players[0]);assert.deepEqual(x.series.map(r=>r.value),[2,3,7]);assert.equal(x.totalDelta,7);assert.equal(x.latest.year,2030);assert.deepEqual(x.attributes.map(a=>[a.key,a.value]),[['technique',2],['speed',1]]);assert.match(x.summary,/3 observed camp results/);
});

test('changing hidden fields cannot alter development visualization output',()=>{
 const base={...players[0],campHistory:players[0].campHistory.map(x=>({...x,attr:{...x.attr}}))},mutated={...base,trueTalent:1,trueNow:12,growth:99,volatility:100,potential:100};assert.deepEqual(model.player(base),model.player(mutated));
});
