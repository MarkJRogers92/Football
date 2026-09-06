const{test}=require('node:test');
const assert=require('node:assert/strict');
const RNG=require('../rng.js');

test('a reported seed reproduces one pinned sequence',()=>{
 const a=RNG.create('dynasty-950'),b=RNG.create('dynasty-950');
 const sequence=Array.from({length:6},()=>a.next());
 assert.deepEqual(sequence,Array.from({length:6},()=>b.next()));
 assert.deepEqual(sequence.map(n=>Number(n.toFixed(10))),[0.8179193095,0.3936673529,0.1938901737,0.8502599176,0.6011525167,0.1030703797]);
 const original=RNG.create('dynasty-950'),reported=original.snapshot().seed,replay=RNG.create(reported);
 assert.deepEqual(Array.from({length:6},()=>replay.next()),Array.from({length:6},()=>original.next()));
 assert.equal(a.snapshot().draws,6);
});
test('a saved state resumes at the exact next draw',()=>{
 const live=RNG.create(950);Array.from({length:17},()=>live.next());
 const resumed=RNG.create(JSON.parse(JSON.stringify(live.snapshot())));
 assert.deepEqual(Array.from({length:20},()=>live.next()),Array.from({length:20},()=>resumed.next()));
 assert.equal(resumed.snapshot().draws,37);
});
test('helpers have explicit bounds and predictable draw costs',()=>{
 const r=RNG.create('helpers');
 for(let i=0;i<100;i++){const n=r.int(3,7);assert.ok(n>=3&&n<=7)}
 const before=r.snapshot().draws;assert.ok(['a','b','c'].includes(r.pick(['a','b','c'])));assert.equal(r.snapshot().draws,before+1);
 r.gauss();assert.equal(r.snapshot().draws,before+3);assert.throws(()=>r.int(2,1),/range/);assert.throws(()=>r.pick([]),/empty/);
});
test('named substreams are deterministic and do not advance their parent',()=>{
 const parent=RNG.create('league-1'),before=parent.snapshot();
 assert.notEqual(parent.substream('schedule').next(),parent.substream('portraits').next());
 assert.equal(parent.snapshot().draws,before.draws);
 assert.equal(parent.substream('schedule').next(),RNG.create(`${before.seed}:schedule`).next());
});
test('the baseline distributions remain sane',()=>{
 const uniform=RNG.create('uniform-baseline'),normal=RNG.create('normal-baseline'),mean=a=>a.reduce((n,x)=>n+x,0)/a.length;
 const us=Array.from({length:10000},()=>uniform.next()),ns=Array.from({length:10000},()=>normal.gauss());
 assert.ok(Math.abs(mean(us)-.5)<.012);assert.ok(Math.abs(mean(ns))<.035);assert.equal(normal.snapshot().draws,20000);
});
test('malformed or future saved states fail loudly',()=>{
 assert.throws(()=>RNG.create({version:2,seed:1,state:1,draws:0}),/newer/);
 assert.throws(()=>RNG.create({version:1,seed:1,state:1,draws:-1}),/counter/);
 assert.throws(()=>RNG.create({version:1,seed:1,state:1.5,draws:0}),/state/);
});
