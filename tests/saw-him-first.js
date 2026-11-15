const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeSawHimFirst}=require('../saw-him-first.js');
const {loadEngine}=require('../tools/harness.js');

const receipt=(o={})=>({schoolId:1,season:2027,stars:2,nationalRank:512,currentRead:68,verdictScore:70,verdictLabel:'Depth Piece',...o});
function world(){
 const t={id:1,name:'Home U'},u={year:2031,week:0,events:[]};
 const players=new Map();const P=(id,rec)=>{const p={id,name:`P${id}`,recruitingMemory:rec?{scoutingReceipt:rec}:{}};players.set(id,p);return p};
 return{t,u,players,P,S:makeSawHimFirst({getUniverse:()=>u}),find:id=>players.get(id)||null};
}
const pick=(playerId,round,o={})=>({playerId,playerName:`P${playerId}`,pos:'WR',schoolId:1,school:'Home U',round,pick:5,...o});

test('an overlooked signee drafted in the first three rounds is called out with his signing receipt',()=>{
 const {t,u,P,S,find}=world();
 P('a',receipt());P('b',receipt({stars:5,verdictScore:90}));P('c',receipt({stars:4,verdictScore:72}));P('d',receipt());P('e',null);P('f',receipt({schoolId:2}));
 const out=S.afterDraft([pick('a',2),pick('b',1),pick('c',3),pick('d',4),pick('e',1),pick('f',1),pick('a',1,{schoolId:9})],t,find);
 assert.deepEqual(out.map(e=>e.playerIds[0]),['a','c'],'a five-star, a fourth-rounder, no receipt, a transfer\'s old receipt and another program\'s pick are left out');
 assert.equal(u.events.length,2);
 assert.match(out[0].summary,/^You saw him first: WR Pa signed in 2027 as a two-star prospect, No\. 512 nationally, graded 68 \(depth piece\) by your staff\. He went in round 2 of the draft\.$/);
 assert.equal(out[0].type,'SCOUTING_VINDICATED');assert.equal(out[0].metadata.kind,'draft');
 assert.equal(S.afterDraft([pick('a',2)],t,find).length,0,'never twice for the same player and kind');
});

test('an overlooked signee who wins a national award is called out once',()=>{
 const {t,P,S,find}=world();P('a',receipt({stars:3,verdictScore:80}));P('b',receipt({stars:5,verdictScore:95}));
 const awards=[{name:'Receiver of the Year',playerId:'a',playerName:'Pa',team:'Home U',pos:'WR'},{name:'National Player of the Year',playerId:'b',playerName:'Pb',team:'Home U',pos:'QB'},{name:'Defensive Player of the Year',playerId:'a',playerName:'Pa',team:'Other',pos:'WR'}];
 const out=S.afterAwards(awards,t,find);
 assert.deepEqual(out.map(e=>e.summary),['You saw him first: WR Pa signed in 2027 as a three-star prospect, No. 512 nationally, graded 68 (depth piece) by your staff. He is the Receiver of the Year.']);
 assert.equal(S.afterAwards(awards,t,find).length,0);
});

test('in the game, the coach\'s overlooked signee drafted in round one makes The Wire',async()=>{
 const e=loadEngine({seed:3131,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan'),p=t.roster[0];
 Object.assign(p,{trueNow:97,upside:99,speed:96,power:96,technique:97,iq:97,composure:95,durability:90});
 p.recruitingMemory={season:u.year-3,schoolId:t.id,stars:2,scoutingReceipt:receipt({schoolId:t.id,season:u.year-3})};
 t.roster=t.roster.filter(x=>x!==p);
 const draft=e.runDraft([{p,t,teamId:t.id,reason:'Eligibility exhausted',score:96}]);
 assert.equal(draft[0].round,1);
 const ev=u.events.filter(x=>x.type==='SCOUTING_VINDICATED');
 assert.equal(ev.length,1);assert.match(ev[0].summary,new RegExp(`You saw him first: ${p.pos} ${p.name} signed in \\d+ as a two-star prospect`));
 const wire=require('../dynasty-world-news.js').items(u,t);
 assert.ok(wire.some(w=>w.kicker==='YOU SAW HIM FIRST'),'it reaches The Wire');
});
