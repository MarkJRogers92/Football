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

// v0.12.30: home state and a name/school/city search narrow the whole pool, so a prospect
// outside the 220 displayed rows can still be found.
const located=[
 {id:'p',name:'Malik Whitaker',pos:'S',homeState:'CA',highSchool:'Sacramento Washington Prep',homeCity:'Sacramento',targeted:false},
 {id:'q',name:'Noah Bennett',pos:'CB',homeState:'TX',highSchool:'Fort Worth Washington High',homeCity:'Fort Worth',targeted:false},
 {id:'r',name:'Caleb Marsh',pos:'TE',homeState:'TX',highSchool:'Austin East High',homeCity:'Austin',targeted:true}
];
test('home state narrows the pool and defaults to every state',()=>{
 const sys=make();
 assert.deepEqual(sys.apply(located,{},{}).map(r=>r.id),['p','q','r']);
 assert.deepEqual(sys.apply(located,{state:'TX'},{}).map(r=>r.id),['q','r']);
 assert.equal(sys.normalize({state:'ALL'}).state,'ALL');
 assert.equal(sys.normalize({}).state,'ALL');
});

test('search matches name, high school or city, ignoring case and padding',()=>{
 const sys=make();
 assert.deepEqual(sys.apply(located,{query:'  WHITAKER '},{}).map(r=>r.id),['p']);
 assert.deepEqual(sys.apply(located,{query:'washington'},{}).map(r=>r.id),['p','q'],'matches the school');
 assert.deepEqual(sys.apply(located,{query:'austin'},{}).map(r=>r.id),['r'],'matches the city');
 assert.deepEqual(sys.apply(located,{query:'zzz'},{}).map(r=>r.id),[]);
 assert.equal(sys.normalize({query:'x'.repeat(80)}).query.length,40,'the query is capped');
});

test('state, position, search and board filters compose',()=>{
 const sys=make();
 assert.deepEqual(sys.apply(located,{state:'TX',query:'high',targetedOnly:true},{}).map(r=>r.id),['r']);
 assert.deepEqual(sys.apply(located,{state:'CA',pos:'CB'},{}).map(r=>r.id),[]);
});
