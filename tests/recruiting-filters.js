const test=require('node:test');
const assert=require('node:assert/strict');
const {makeRecruitingFilterSystem}=require('../recruiting-filters.js');

const recruits=[
 {id:'a',pos:'QB',targeted:true,stage:'PRELIMINARY',verdict:'Take'},
 {id:'b',pos:'QB',targeted:false,stage:'FULL_EVALUATION',verdict:'Priority take'},
 {id:'c',pos:'WR',targeted:true,stage:'QUICK_FILM',verdict:'Boardable'},
 {id:'d',pos:'WR',targeted:false,stage:'FULL_EVALUATION',verdict:'Pass'}
];
const make=(counter={n:0})=>makeRecruitingFilterSystem({
 stageOf:r=>r.stage,
 verdictOf:r=>{counter.n++;return{label:r.verdict}}
});

test('default filters preserve the pool without evaluating verdicts',()=>{
 const calls={n:0},sys=make(calls),out=sys.apply(recruits,{},{});
 assert.deepEqual(out.map(r=>r.id),['a','b','c','d']);
 assert.equal(calls.n,0);
});

test('cheap filters narrow candidates before verdict evaluation',()=>{
 const calls={n:0},sys=make(calls),out=sys.apply(recruits,{pos:'QB',verdict:'Priority take'},{});
 assert.deepEqual(out.map(r=>r.id),['b']);
 assert.equal(calls.n,2);
});

test('evaluation stage and targeted-only filters intersect',()=>{
 const sys=make(),out=sys.apply(recruits,{stage:'QUICK_FILM',targetedOnly:true},{});
 assert.deepEqual(out.map(r=>r.id),['c']);
});

test('verdict filter uses exact staff-facing labels',()=>{
 const sys=make(),out=sys.apply(recruits,{verdict:'Boardable'},{});
 assert.deepEqual(out.map(r=>r.id),['c']);
});

test('filtering never mutates the source list',()=>{
 const sys=make(),before=recruits.map(r=>r.id),out=sys.apply(recruits,{pos:'WR'},{});
 assert.deepEqual(out.map(r=>r.id),['c','d']);
 assert.deepEqual(recruits.map(r=>r.id),before);
});
