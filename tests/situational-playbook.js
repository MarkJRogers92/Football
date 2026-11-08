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

test('delegating live tempo follows the clock plan as the score changes and an explicit call overrides it',()=>{
 const session=GameDay.createSession({gameId:'clock-plan',seed:'clock-plan',home:team('H',70,70),away:team('A',70,70),controlledSide:'home',playbook:{home:{clock:'manage'}}});
 E.startGame(session.state);
 Object.assign(session.state,{period:4,clock:250,down:1,distance:10,fieldPosition:35,possession:'home',score:{home:21,away:14}});
 const pending=GameDay.advanceOne(session).decision;
 assert.equal(pending.staffRecommendation,'drain');
 const manual=GameDay.restore(GameDay.snapshot(session));
 assert.equal(GameDay.resolve(session,'delegate').resolvedAction,'drain');
 GameDay.resolve(manual,'normal');
 for(const [home,away,delta] of [[21,14,6],[14,21,-8],[21,21,0]]){
  const delegated=GameDay.restore(GameDay.snapshot(session)),explicit=GameDay.restore(GameDay.snapshot(manual));
  // Same seeded moving-clock snap for both teams, with only the margin changed.
  for(const game of [delegated,explicit])Object.assign(game.state,{score:{home,away},clock:210});
  GameDay.advanceOne(delegated);GameDay.advanceOne(explicit);
  const elapsed=210-explicit.state.clock;
  assert.equal(210-delegated.state.clock,Math.min(45,Math.max(5,elapsed+delta)));
  assert.deepEqual(delegated.state.rng,explicit.state.rng);
 }
});

test('regulation fourth-down turnovers are failed attempts and manual two-point tries count',()=>{
 const P=makePlaybookSystem({}),from={down:4,distance:2};
 const events=[{type:'interception',from,yards:11},{type:'fumble',from,yards:5},{type:'scrimmage',from,yards:2},{type:'two_point',made:true},{type:'two_point',made:true,ot:true}].map(e=>({...e,team:'away'}));
 assert.deepEqual(P.tally({events},'away'),{fourthTries:3,fourthConverted:1,twoTries:1,twoMade:1});
});

test('Advance Week and Sim Season record only the controlled custom playbook matchup through Engine 2',async()=>{
 const {loadEngine}=require('../tools/harness');
 const e=loadEngine({seed:72918,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const user=e.T('Chicago Metropolitan'),pb=globalThis.DynastyPlaybook,bridge=globalThis.DynastyGameEngineV2LabBridge;
 pb.set(user,'fourthDown','aggressive');pb.set(user,'twoPoint','chart');pb.set(user,'clock','manage');
 e.delegateWeeklyDecisions(user);
 assert.throws(()=>bridge.recordCurrent({testFault:'afterArchive'}),/Injected v2 rollback/);
 assert.equal(user.playbookLog,undefined);
 const game=e.findUserGame();e.simWeek();
 const record=e.universe.gameArchive.find(r=>r.id===game.gameId),preview=bridge.getPreview(),side=game.home===user.name?'home':'away';
 assert.equal(record.engine,'v2');
 assert.deepEqual(preview.state.playbook,{[side]:pb.get(user)});
 assert.deepEqual(user.playbookLog.totals,pb.tally(preview.state,side));
 assert.equal(user.playbookLog.games.length,1);
 assert.equal(user.w+user.l,1);
 assert.equal(e.universe.latest.filter(r=>r.gameId===record.id).length,1);
 assert.deepEqual(game.score,[record.score.away,record.score.home]);
 for(const row of record.playerStats[side]){
  const player=user.roster.find(p=>p.id===row.id);
  for(const [key,value] of Object.entries(row.stats))assert.equal(player.stats[key],value);
 }
 // Restore defaults for one week. That game stays on the original fast path.
 for(const [key,value] of Object.entries(pb.DEFAULTS))pb.set(user,key,value);
 e.delegateWeeklyDecisions(user);const defaultGame=e.findUserGame();e.simWeek();
 assert.notEqual(e.universe.gameArchive.find(r=>r.id===defaultGame.gameId).engine,'v2');
 assert.equal(user.playbookLog.games.length,1);
 pb.set(user,'clock','manage');
 e.delegateWeeklyDecisions(user);
 const liveSession=bridge.interactive.start(),kickoff=structuredClone(liveSession.state);
 pb.set(user,'clock','standard');
 globalThis.__DL_TEST__.v2GameDayForget();bridge.interactive.render();
 assert.deepEqual(bridge.interactive.getSession().state,kickoff,'reloading uses the kickoff playbook even after settings are edited');
 const liveGame=e.findUserGame();e.simWeek();
 assert.equal(e.universe.gameArchive.find(r=>r.id===liveGame.gameId).gameDayVersion,2);
 assert.equal(user.playbookLog.games.length,2,'a completed live game counts once when advancing');
 pb.set(user,'clock','manage');
 e.simSeason();
 const records=e.universe.gameArchive.filter(r=>r.engine==='v2');
 assert.equal(user.w+user.l,12);assert.equal(records.length,11);
 assert.ok(records.every(r=>r.home.id===user.id||r.away.id===user.id));
 assert.equal(new Set(user.playbookLog.games).size,11);
 assert.equal(e.universe.phase,'confReady');
});
