const {test}=require('node:test');
const assert=require('node:assert/strict');
const mascots=require('../mascots.js');
const schools=require('../schools-data.js');
const {loadEngine}=require('../tools/harness');

test('every program has its own nickname',()=>{
 const names=schools.map(s=>mascots.nickname(s.id));
 assert.equal(names.length,120);assert.ok(names.every(n=>typeof n==='string'&&n.length>=3),'no program is left without one');
 assert.equal(new Set(names).size,120,'no two programs share a nickname');
 assert.ok(names.every(n=>n.length<=16),'nicknames fit an end zone');
});

test('a team object answers by id, and its own nickname wins',()=>{
 assert.equal(mascots.nickname({id:1,name:'Chicago Metropolitan'}),'Skyliners');
 assert.equal(mascots.fullName({id:1,name:'Chicago Metropolitan'}),'Chicago Metropolitan Skyliners');
 assert.equal(mascots.nickname({id:1,nickname:'Lake <b>Kings</b>'}),'Lake bKings/b','a custom nickname is stripped of markup');
 assert.equal(mascots.nickname({id:999}),'');assert.equal(mascots.nickname(null),'');
});

// v0.20: "8-5 against 8 expected, confidence 38 (Hot seat)" read as a pass while confidence fell.
test('the administration review says where every point of confidence went',async()=>{
 const e=loadEngine({seed:2001});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const t={name:'Chicago Metropolitan'},goals=[{weight:'Critical',state:'complete'},{weight:'Important',state:'failed'},{weight:'Bonus',state:'failed'}];
 assert.equal(e.adminReviewSummary(t,{w:8,l:5,expected:8,goalAdjustment:-4,goals,before:45,after:41,label:'Watched'}),
  'Chicago Metropolitan review: 8-5 met the 8-win target; season goals cost 4 (2 missed). Confidence 45 to 41 (Watched).');
 assert.match(e.adminReviewSummary(t,{w:10,l:3,expected:8,goalAdjustment:7,goals:[],before:60,after:89,label:'Secure'}),/beat the 8-win target by 2; season goals added 7\. Confidence 60 to 89 \(Secure\)\./);
 assert.match(e.adminReviewSummary(t,{w:5,l:7,expected:8,goalAdjustment:0,goals:[],before:60,after:40,label:'Watched'}),/fell 3 short of the 8-win target\. Confidence 60 to 40/);
});
