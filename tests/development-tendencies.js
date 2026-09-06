const test=require('node:test');
const assert=require('node:assert/strict');
const {makeDevelopmentTendencySystem}=require('../development-tendencies');
const api=makeDevelopmentTendencySystem({});
const player=(campHistory,extra={})=>({id:'P1',name:'Test Player',pos:'WR',scoutConfidence:76,campHistory,trueNow:99,upside:99,growthProfile:'elite',growthVolatility:99,...extra});
const camps=(deltas)=>deltas.map((delta,i)=>({year:2027+Math.floor(i/2),phase:i%2?'Fall':'Spring',delta,grade:i%2?'B+':null,focus:'Technique'}));

test('needs repeated evidence and staff confidence before calling a pattern',()=>{assert.equal(api.clue(player(camps([3]))).code,'LEARNING');assert.equal(api.clue(player(camps([3,3]),{scoutConfidence:45})).code,'LEARNING')});

test('steady riser comes from repeated positive camp receipts',()=>{const x=api.clue(player(camps([2,2,3,2])));assert.equal(x.code,'STEADY');assert.equal(x.label,'Steady Riser');assert.equal(x.observations,4);assert.match(x.summary,/Positive movement/)});

test('accelerating distinguishes stronger recent camps from earlier evidence',()=>{const x=api.clue(player(camps([0,1,3,4])));assert.equal(x.code,'ACCELERATING');assert.ok(x.recentAverage>x.average-1);assert.match(x.summary,/last two camps/i)});

test('uneven progress requires observed swings rather than hidden volatility',()=>{const x=api.clue(player(camps([4,-2,5,-1])));assert.equal(x.code,'UNEVEN');assert.equal(x.tone,'alert');assert.ok(x.range>=6)});

test('plateau watch can emerge from repeated flat observed results',()=>{const x=api.clue(player(camps([1,0,0,0])));assert.equal(x.code,'PLATEAU');assert.match(x.summary,/flattened/i)});

test('hidden growth fields cannot change the tendency clue',()=>{const p=player(camps([1,3,2,3])),a=api.clue(p);p.trueNow=30;p.upside=35;p.growthProfile='late';p.growthVolatility=0;const b=api.clue(p);assert.deepEqual(b,a)});

test('team summary surfaces notable patterns without inventing evidence',()=>{const steady=player(camps([2,2,3,2]),{id:'S'}),uneven=player(camps([4,-2,5,-1]),{id:'U'}),newbie=player(camps([2]),{id:'N'}),s=api.summarize([steady,uneven,newbie]);assert.equal(s.rows.length,3);assert.equal(s.counts.STEADY,1);assert.equal(s.counts.UNEVEN,1);assert.equal(s.counts.LEARNING,1);assert.equal(s.notable.length,2)});
