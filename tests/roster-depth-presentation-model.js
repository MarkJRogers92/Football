const test=require('node:test');
const assert=require('node:assert/strict');
const {makeRosterDepthPresentationModel}=require('../roster-depth-presentation-adapter');

const model=makeRosterDepthPresentationModel();
const players=[
 {id:'qb1',name:'A Quarterback',pos:'QB',jerseyNumber:7,currentRead:82,currentLabel:'80–84',roles:['Starting QB'],health:94,injuryWeeks:0},
 {id:'qb2',name:'B Quarterback',pos:'QB',jerseyNumber:12,currentRead:76,currentLabel:'73–79',roles:[],health:90,injuryWeeks:0},
 {id:'wr1',name:'C Receiver',pos:'WR',jerseyNumber:1,currentRead:84,currentLabel:'82–86',roles:['X Receiver'],health:88,injuryWeeks:0},
 {id:'wr2',name:'D Receiver',pos:'WR',jerseyNumber:4,currentRead:72,currentLabel:'69–75',roles:[],health:70,injuryWeeks:2},
 {id:'lb1',name:'E Backer',pos:'LB',jerseyNumber:9,currentRead:79,currentLabel:'77–81',roles:['MIKE Linebacker'],redshirtActive:true}
];

test('position groups preserve football order and staff-visible hierarchy',()=>{
 const groups=model.groups(players);assert.deepEqual(groups.map(g=>g.pos),['QB','WR','LB']);assert.equal(groups[0].players[0].id,'qb1');assert.equal(groups[1].injured,1);assert.equal(groups[2].redshirts,1);assert.equal(groups[0].starters,1);
});

test('formation uses canonical base roles and active players',()=>{
 const roles=[{id:'QB1',label:'Starting QB',side:'Offense',base:true,active:players[0],candidates:[{...players[0],fit:90,fitGrade:'A'},{...players[1],fit:82,fitGrade:'B'}]},{id:'3DRB',label:'Third-Down Back',side:'Offense',base:false,active:null,candidates:[]},{id:'MIKE',label:'MIKE Linebacker',side:'Defense',base:true,active:players[4],candidates:[{...players[4],fit:84,fitGrade:'B+'}]}];
 const off=model.formation(roles,'Offense'),def=model.formation(roles,'Defense');assert.deepEqual(off.map(r=>r.id),['QB1']);assert.equal(off[0].active.id,'qb1');assert.equal(off[0].candidates[1].fit,82);assert.deepEqual(def.map(r=>r.id),['MIKE']);
});

test('hidden player truth cannot alter roster presentation model output',()=>{
 const base={...players[0]},mutated={...base,trueNow:12,trueTalent:99,potential:100,growth:100,volatility:100};assert.deepEqual(model.cleanPlayer(base),model.cleanPlayer(mutated));assert.deepEqual(model.groups([base]),model.groups([mutated]));
});
