const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../game-engine-v2.js');
const Adapter=require('../game-engine-v2-adapter.js');
const GameDay=require('../game-engine-v2-gameday.js');
const {makePlaybookSystem}=require('../situational-playbook.js');

// Situational playbook: fourth downs, two-point tries and the late clock, in Game Engine 2.
const team=(name,o,d)=>({id:name,name,offense:o,defense:d});
const live=(over={})=>{
 const s=E.createGame({gameId:'pb',seed:'pb',home:team('H',70,70),away:team('A',70,70),openingReceiver:'home'});
 E.startGame(s);return Object.assign(s,{possession:'home',down:4,distance:2,fieldPosition:50,period:2,clock:600},over);
};
const withBook=(s,p)=>{s.playbook={home:E.sanitizePlaybook(p)};return s};

test('no playbook leaves every call to the default policy',()=>{
 const s=live();
 assert.equal(E.playbookFourthDown(s),null);
 assert.equal(E.playbookTwoPoint(s,'home'),false);
 const o={kind:'rush',yards:4,clock:30};assert.equal(E.playbookClock({...s,period:4},o),o);
 assert.equal(E.playbookFourthDown(withBook(live(),{fourthDown:'standard'})),null,'Standard is the default');
});

test('fourth down: aggressive goes for it where conservative kicks',()=>{
 const agg=p=>withBook(live(p),{fourthDown:'aggressive'}),con=p=>withBook(live(p),{fourthDown:'conservative'});
 assert.equal(E.playbookFourthDown(agg({distance:2,fieldPosition:40})),'play');
 assert.equal(E.playbookFourthDown(con({distance:2,fieldPosition:40})),'punt');
 assert.equal(E.playbookFourthDown(agg({distance:4,fieldPosition:62})),'play','4th and 4 between midfield and the 30');
 assert.equal(E.playbookFourthDown(con({distance:4,fieldPosition:62})),'field_goal');
 assert.equal(E.playbookFourthDown(con({distance:1,fieldPosition:62})),'play');
 assert.equal(E.playbookFourthDown(agg({distance:9,fieldPosition:30})),'punt');
 assert.equal(E.playbookFourthDown(live({down:3})),null);
});

test('late and behind, both keep the ball unless a field goal ties or takes the lead',()=>{
 const late=(margin,fp,style='conservative')=>{const s=withBook(live({period:4,clock:180,distance:8,fieldPosition:fp}),{fourthDown:style});s.score={home:20,away:20-margin};return s};
 assert.equal(E.playbookFourthDown(late(-3,70)),'field_goal','a field goal ties');
 assert.equal(E.playbookFourthDown(late(-4,70)),'play','a field goal does not tie');
 assert.equal(E.playbookFourthDown(late(-7,30)),'play','deep in his own end, still go');
 assert.equal(E.playbookFourthDown(late(3,30)),'punt','ahead: punt as usual');
});

test('the two-point chart goes for two on the chart margins in the second half only',()=>{
 for(const m of [-10,-5,-2,1,5,12]){const s=withBook(live({period:3}),{twoPoint:'chart'});s.score={home:20,away:20-m};assert.equal(E.playbookTwoPoint(s,'home'),true,`margin ${m}`)}
 for(const m of [-7,0,7,-1,2]){const s=withBook(live({period:4}),{twoPoint:'chart'});s.score={home:20,away:20-m};assert.equal(E.playbookTwoPoint(s,'home'),false,`margin ${m}`)}
 const first=withBook(live({period:2}),{twoPoint:'chart'});first.score={home:20,away:22};
 assert.equal(E.playbookTwoPoint(first,'home'),false,'not in the first half');
 assert.equal(E.playbookTwoPoint(first,'away'),false,'only the side with the playbook');
});

test('managing the clock bleeds it ahead and saves it behind, after the play is drawn',()=>{
 const s=withBook(live({period:4,clock:250}),{clock:'manage'});
 s.score={home:21,away:14};
 assert.equal(E.playbookClock(s,{kind:'rush',yards:3,clock:30}).clock,36);
 assert.equal(E.playbookClock(s,{kind:'pass',completed:false,yards:0,clock:8}).clock,8,'an incompletion already stops the clock');
 s.score={home:14,away:21};
 assert.equal(E.playbookClock(s,{kind:'pass',completed:true,yards:12,clock:30}).clock,22);
 assert.equal(E.playbookClock({...s,clock:400},{kind:'rush',yards:3,clock:30}).clock,30,'only in the last five minutes when behind');
 assert.equal(E.playbookClock(s,{turnover:'fumble',clock:20}).clock,20);
});

test('a simulated game with no playbook is identical to before, and a playbook only changes its own side\'s calls',()=>{
 const opts={gameId:'pb-sim',seed:'pb-sim',home:team('H',72,68),away:team('A',69,71),homeFieldRating:3};
 const a=Adapter.simulateShadow(opts),b=Adapter.simulateShadow({...opts,playbook:null});
 assert.deepEqual(a.state.score,b.state.score);assert.equal(a.state.events.length,b.state.events.length);
 let differed=0,twoTries=0;
 for(let i=0;i<40;i++){
  const o={...opts,gameId:`pb-${i}`,seed:`pb-${i}`};
  const base=Adapter.simulateShadow(o),bold=Adapter.simulateShadow({...o,playbook:{home:{fourthDown:'aggressive',twoPoint:'chart',clock:'manage'}}});
  if(JSON.stringify(base.state.score)!==JSON.stringify(bold.state.score))differed++;
  twoTries+=bold.state.events.filter(e=>e.type==='two_point'&&e.playbook).length;
  assert.ok(!bold.state.events.some(e=>e.type==='two_point'&&e.playbook&&e.team!=='home'),'the opponent never uses your chart');
  E.validateGame(bold.state);
 }
 assert.ok(differed>0,'an aggressive playbook changes some results');
 assert.ok(twoTries>0,'the chart produces two-point tries');
});

test('Coach It Live: the staff recommendation follows the playbook',()=>{
 const s=GameDay.createSession({gameId:'pb-live',seed:'pb-live',home:team('H',70,70),away:team('A',70,70),controlledSide:'home',playbook:{home:{fourthDown:'aggressive'}}});
 assert.deepEqual(s.state.playbook.home,{fourthDown:'aggressive',twoPoint:'kick',clock:'standard'});
});

test('settings are validated, default to the engine, and only the controlled program gets a playbook',()=>{
 const P=makePlaybookSystem({}),t={name:'Mine'},o={name:'Other'};
 assert.deepEqual(P.get(t),P.DEFAULTS);
 assert.equal(P.set(t,'fourthDown','reckless').ok,false);
 assert.equal(P.set(t,'fourthDown','aggressive').ok,true);
 assert.deepEqual(P.forMatch(o,t,'Mine'),{away:{fourthDown:'aggressive',twoPoint:'kick',clock:'standard'}});
 assert.equal(P.forMatch(o,{name:'x'},'Mine'),null);
 P.set(t,'fourthDown','standard');
 assert.equal(t.playbook,undefined,'back to the defaults leaves nothing in the save');
 assert.equal(P.forMatch(o,t,'Mine'),null);
});
