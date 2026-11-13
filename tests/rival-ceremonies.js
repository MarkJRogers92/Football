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

test('national awards get their own ceremony, after the rivalry and before signing day',()=>{
 const team={id:1,name:'State',w:11,l:2};
 const a={teamId:1,year:2027,milestones:[{key:'2027:signing',kind:'signing'}]};
 const b={teamId:1,year:2027,milestones:[...a.milestones,{key:'2027:awards',kind:'awards'},{key:'2027:rivalry',kind:'rivalry'}]};
 assert.deepEqual(C.newMilestones(a,b).map(m=>m.kind),['rivalry','awards']);
 const one=C.bodyHTML({kind:'awards',year:2027,team,awards:[{name:'National Player of the Year',playerId:7,playerName:'Jay <Doe>',pos:'QB'}]});
 assert.match(one.html,/<h2>National Player of the Year<\/h2>/);assert.match(one.html,/Jay &lt;Doe&gt; · State/);
 const coach=C.bodyHTML({kind:'awards',year:2027,team,awards:[{name:'Coach of the Year',playerId:null,playerName:'Pat Coach',pos:'HC'}]});
 assert.match(coach.html,/Head coach/);assert.doesNotMatch(coach.html,/data-portrait=/,'a coach has no player portrait');
 const many=C.bodyHTML({kind:'awards',year:2027,team,awards:[{name:'National Player of the Year',playerId:7,playerName:'Jay Doe',pos:'QB'},{name:'Coach of the Year',playerId:null,playerName:'Pat Coach',pos:'HC'}]});
 assert.match(many.html,/Award Winners/);assert.match(many.html,/State · 2 national awards/);assert.equal((many.html.match(/<li /g)||[]).length,2);
 assert.equal(C.bodyHTML({kind:'awards',year:2027,team,awards:[]}),null,'no winners, no ceremony');
});

test('rivalry trophies and season honors turn when a turntable strip exists, else show the still',()=>{
 const team={id:1,name:'State',w:9,l:3};
 globalThis.DynastyArt={turnSrc:k=>k==='rivalry-axe'?'assets/turntables/rivalry-axe.webp':'',rivalryKey:t=>/axe/i.test(t)?'rivalry-axe':'rivalry-shield',img:k=>`<img src="assets/awards/${k}.webp">`};
 try{
  const axe=C.bodyHTML({kind:'rivalry',year:2027,team,trophy:'The River Axe',opponent:{id:2,name:'Rival'},score:[21,17],streak:1}).html;
  assert.match(axe,/class="cer-turn" style="--turn:url\('assets\/turntables\/rivalry-axe.webp'\)"/);
  const other=C.bodyHTML({kind:'rivalry',year:2027,team,trophy:'The Old Thing',opponent:{id:2,name:'Rival'},score:[21,17],streak:1}).html;
  assert.match(other,/assets\/awards\/rivalry-shield.webp/);assert.doesNotMatch(other,/cer-turn/);
 }finally{delete globalThis.DynastyArt}
 require('../program-art.js');const A=globalThis.DynastyArt;  // sets the global, like the browser
 const fs=require('node:fs'),path=require('node:path');
 for(const k of A.TURNS)assert.ok(fs.existsSync(path.join(__dirname,'..',A.turnSrc(k))),`${k} has a strip`);
 for(const n of ['bell','axe','boot','jug','barrel','anvil','lantern','spade','bucket','cannon'])assert.ok(A.turnSrc(A.rivalryKey(`The Test ${n}`)),`${n} turns`);
});

test('every Around Your Program briefing kind has art that exists',()=>{
 require('../program-art.js');const A=globalThis.DynastyArt,fs=require('node:fs'),path=require('node:path');
 for(const kind of ['matchup','callback','following','team','league']){
  const src=A.src(A.briefKey(kind));assert.ok(src,`${kind} maps to a registered file`);
  assert.ok(fs.existsSync(path.join(__dirname,'..',src)),`${src} exists`);
 }
 assert.equal(A.briefKey('nothing'),'');
});
