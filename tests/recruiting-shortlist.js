const test=require('node:test');
const assert=require('node:assert/strict');
const {makeStaffShortlistSystem}=require('../recruiting-shortlist');
function system(counter=null){return makeStaffShortlistSystem({posCounts:{QB:3,WR:5,RB:3},eligibilityBase:p=>p.elig,staffVerdict:r=>{if(counter)counter.count++;return{score:r.staff,label:r.label||'Take',conviction:'Medium',confidence:60}},pipelineStrength:(t,region)=>region==='home'?80:30,distance:(t,r)=>r.distance||500})}
const team=()=>({name:'Metro',roster:[{pos:'QB',elig:0},{pos:'QB',elig:3},{pos:'WR',elig:0},{pos:'WR',elig:1},{pos:'RB',elig:0},{pos:'RB',elig:1}]});

test('roster outlook counts returning players and commitments',()=>{const s=system(),needs=s.positionNeeds(team(),[{pos:'QB',committed:'Metro'},{pos:'WR',targeted:true}]),qb=needs.find(x=>x.pos==='QB'),wr=needs.find(x=>x.pos==='WR');assert.equal(qb.returning,1);assert.equal(qb.committed,1);assert.equal(qb.gap,1);assert.equal(wr.targeted,1);assert.equal(wr.gap,3)});

test('larger roster holes can outrank a slightly better evaluation',()=>{const s=system(),rows=s.shortlist(team(),[{id:'q',pos:'QB',staff:90,interest:50,stars:4,distance:50,nationalRank:10},{id:'w',pos:'WR',staff:82,interest:55,stars:4,distance:50,nationalRank:25}]);assert.equal(rows[0].r.id,'w')});

test('shortlist never reads hidden true talent',()=>{const s=system(),t=team(),r={id:'x',pos:'QB',staff:82,interest:60,stars:4,distance:100,nationalRank:20,trueNow:99,upside:99},a=s.shortlist(t,[r])[0];r.trueNow=20;r.upside=25;const b=s.shortlist(t,[r])[0];assert.equal(a.score,b.score);assert.equal(a.reason,b.reason)});

test('committed prospects are not recommended as new targets',()=>{const s=system(),rows=s.shortlist(team(),[{id:'a',pos:'WR',staff:95,committed:'Other',stars:5},{id:'b',pos:'WR',staff:70,stars:3}]);assert.deepEqual(rows.map(x=>x.r.id),['b'])});

test('bounded shortlist is exactly equivalent to exhaustive ranking',()=>{
 const s=system(),t=team(),pos=['QB','WR','RB'],rows=[];
 for(let i=0;i<180;i++)rows.push({id:`r${i}`,pos:pos[i%3],staff:55+(i*17)%45,interest:(i*29)%101,stars:2+(i%4),distance:25+(i*73)%1400,nationalRank:1+i,homeRegion:i%5===0?'home':'away',targeted:i%11===0,committed:i%37===0?'Other':null});
 const fast=s.shortlist(t,rows,8),full=s.shortlistExhaustive(t,rows,8);
 assert.deepEqual(fast.map(x=>x.r.id),full.map(x=>x.r.id));
 assert.deepEqual(fast.map(x=>x.score),full.map(x=>x.score));
 assert.deepEqual(fast.map(x=>x.reason),full.map(x=>x.reason));
});

test('upper-bound search skips verdicts once the remaining pool cannot crack the cut',()=>{
 const counter={count:0},s=makeStaffShortlistSystem({
  posCounts:{WR:20},eligibilityBase:p=>p.elig,
  staffVerdict:r=>{counter.count++;return{score:r.staff,label:'Take',conviction:'Medium',confidence:60}},
  pipelineStrength:(t,region)=>region==='home'?80:30,distance:(t,r)=>r.distance
 }),t={name:'Metro',roster:[]},rows=[];
 for(let i=0;i<8;i++)rows.push({id:`top${i}`,pos:'WR',staff:95,interest:100,stars:5,distance:0,nationalRank:i+1,homeRegion:'home'});
 for(let i=0;i<192;i++)rows.push({id:`low${i}`,pos:'WR',staff:60,interest:0,stars:1,distance:2000,nationalRank:100+i,homeRegion:'away'});
 const fast=s.shortlist(t,rows,8);
 assert.deepEqual(fast.map(x=>x.r.id),Array.from({length:8},(_,i)=>`top${i}`));
 assert.ok(counter.count<=12,`expected major pruning, evaluated ${counter.count} of ${rows.length}`);
});
