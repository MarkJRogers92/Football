// Rival Watch personalities/pressure lines and ceremony milestone detection are deterministic and fact-based.
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../rival-watch.js'),C=require('../ceremonies.js');

test('archetype follows the coach\'s strongest rating; traits follow ambition, loyalty and age',()=>{
 assert.equal(R.archetype({recruiting:90,playCall:70,development:60,evaluation:50}).name,'The Closer');
 assert.equal(R.archetype({recruiting:60,playCall:88,development:60,evaluation:50}).name,'The Schemer');
 assert.equal(R.archetype({recruiting:60,playCall:60,development:81,evaluation:50}).name,'The Builder');
 assert.equal(R.archetype({recruiting:60,playCall:60,development:60,evaluation:79}).name,'The Talent Scout');
 assert.deepEqual(R.traits({ambition:80,loyalty:85,age:62}),['Climber','Lifer','Old guard']);
 assert.deepEqual(R.traits({ambition:50,loyalty:50,age:38}),['Young gun']);
});

test('pressure lines are tied to real facts, most pointed first',()=>{
 const coach={name:'Coach X',recruiting:90,playCall:60,development:60,evaluation:60};
 const snap={week:5,rival:{coach,team:{id:2,name:'Rival U'},trophy:'The Axe',series:{w:1,l:4,streak:-3},meeting:{week:7,home:true,played:false},lastMeeting:null,racesLed:[{recruit:'Jay Doe',pos:'QB',stars:5}]}};
 const lines=R.pressureLines(snap);
 assert.equal(lines.length,2);
 assert.match(lines[0].fact,/Leads for Jay Doe/);assert.match(lines[0].quote,/Jay Doe already knows where home is/);
 assert.match(lines[1].fact,/Week 7 at your place/);
 const won=R.pressureLines({...snap,rival:{...snap.rival,racesLed:[],lastMeeting:{won:true,us:24,them:17}}});
 assert.match(won[0].fact,/You won 24-17/);
 assert.match(R.pressureLines({week:1,rival:{coach,team:{id:2,name:'Rival U'},racesLed:[]}})[0].fact,/The Closer · Rival U/);
 assert.equal(R.pressureLines(null).length,0);
});

test('ceremonies only fire for milestones new within the same program and season',()=>{
 const a={teamId:1,year:2027,milestones:[{key:'2027:conference',kind:'conference'}]};
 const b={teamId:1,year:2027,milestones:[{key:'2027:conference',kind:'conference'},{key:'2027:bowl',kind:'bowl'},{key:'2027:national',kind:'national'}]};
 assert.deepEqual(C.newMilestones(a,b).map(m=>m.kind),['national','bowl'],'new ones, biggest first');
 assert.deepEqual(C.newMilestones(null,b),[],'no baseline (just loaded) means nothing replays');
 assert.deepEqual(C.newMilestones({...a,teamId:2},b),[],'switching programs never replays theirs');
 assert.deepEqual(C.newMilestones({...a,year:2026},b),[],'a new season starts a new baseline');
});

test('ceremony bodies escape names and confetti is deterministic',()=>{
 const team={id:1,name:'A<b>',conference:'Great Lakes',w:12,l:1};
 assert.match(C.bodyHTML({kind:'national',year:2027,team}).html,/A&lt;b&gt;/);
 assert.match(C.bodyHTML({kind:'draft',year:2027,team,picks:[{name:'P',pos:'QB',round:1,pick:4,label:'Round 1, Pick 4'}]}).html,/R1<small>#4/);
 assert.equal(C.confettiHTML(10),C.confettiHTML(10));
 assert.equal(C.bodyHTML({kind:'unknown',team}),null);
});
