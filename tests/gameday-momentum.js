// Win-chance estimate behind the Game Day graph: monotonic in the obvious directions and exact at the end.
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../gameday-momentum.js');
const st=(o)=>({period:1,clock:900,score:{home:0,away:0},possession:null,fieldPosition:null,status:'live',...o});

test('even game at kickoff is a coin flip without an edge, and home field tilts it',()=>{
 assert.equal(M.winChance(st({}),'home'),.5);
 assert.ok(M.winChance(st({}),'home',{homeEdge:3})>.5);
 assert.ok(Math.abs(M.winChance(st({}),'home',{homeEdge:3})+M.winChance(st({}),'away',{homeEdge:3})-1)<1e-9,'both sides sum to one');
});

test('a lead is worth more as the clock runs out',()=>{
 const early=M.winChance(st({period:1,clock:900,score:{home:7,away:0}}),'home');
 const late=M.winChance(st({period:4,clock:120,score:{home:7,away:0}}),'home');
 assert.ok(early>.5&&late>early&&late>.9,`${early} -> ${late}`);
});

test('possession deep in opponent territory helps the offense',()=>{
 const own=M.winChance(st({period:4,clock:300,score:{home:0,away:3},possession:'home',fieldPosition:20}),'home');
 const red=M.winChance(st({period:4,clock:300,score:{home:0,away:3},possession:'home',fieldPosition:92}),'home');
 assert.ok(red>own);
});

test('final results are certain and seconds left counts the remaining quarters',()=>{
 assert.equal(M.winChance(st({status:'final',score:{home:21,away:24}}),'away'),1);
 assert.equal(M.winChance(st({status:'final',score:{home:21,away:24}}),'home'),0);
 assert.equal(M.secondsLeft(st({period:3,clock:600})),1500);
 assert.equal(M.secondsLeft(st({status:'final'})),0);
});

test('the series is time-ordered, marks coaching decisions and scores, and the panel shows the current value',()=>{
 const events=[
  {type:'run',state:st({period:1,clock:800,possession:'home',fieldPosition:40})},
  {type:'touchdown',state:st({period:1,clock:700,score:{home:7,away:0},possession:'away',fieldPosition:25})},
  {type:'coaching_decision',state:st({period:2,clock:400,score:{home:7,away:0},possession:'home',fieldPosition:60})}
 ];
 const s=M.series(events,'home');
 assert.deepEqual(s.map(p=>p.kind),['kickoff','play','score','decision']);
 assert.ok(s.every((p,i)=>!i||p.t>=s[i-1].t));
 const html=M.panelHTML({state:{events},names:{home:'Home U',away:'Away'}},'home');
 assert.match(html,new RegExp(`${Math.round(s.at(-1).p*100)}%`));
 assert.match(html,/aria-label="Home U win chance: \d+% now"/);
});
