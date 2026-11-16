const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeConversionReview}=require('../conversion-review.js');
const {loadEngine}=require('../tools/harness.js');
const C=makeConversionReview();

test('the late-game chart gives the familiar answers',()=>{
 const best=(m,period,clock)=>{const o=C.options(m,C.drivesLeft(period,clock));return o.two>o.kick?'two':'kick'};
 assert.equal(best(-2,4,120),'two','down 2: go for two to tie');
 assert.equal(best(0,4,120),'kick','tied: kick to lead');
 assert.equal(best(5,4,150),'two','up 5 late: two makes it a touchdown game');
 assert.equal(C.drivesLeft(4,0),0);assert.equal(C.drivesLeft(3,900),12);assert.equal(C.drivesLeft(5,300),0);
 assert.equal(C.winChance(1,0),1);assert.equal(C.winChance(0,0),.5);assert.equal(C.winChance(-1,0),0);
 assert.equal(C.judge(-2,4,60,'two'),null,'the right call is not flagged');
 assert.deepEqual(C.judge(-2,4,60,'kick'),{better:'two',gain:24});
 assert.equal(C.judge(-2,3,800,'kick'),null,'early in the third quarter it barely matters');
});

const td=(team,period,clock,home,away)=>({type:'touchdown',team,points:6,state:{period,clock,score:{home,away}}});
test('only the staff\'s second-half calls for the coach\'s side are reviewed, the worst two first',()=>{
 const events=[
  td('home',2,100,6,0),{type:'extra_point',team:'home',points:0,made:false},
  td('home',4,150,20,22),{type:'extra_point',team:'home',points:1,made:true},
  td('away',4,90,21,27),{type:'extra_point',team:'away',points:1,made:true},
  td('home',4,40,27,28),{type:'coaching_decision',decisionType:'two_point_decision',team:'home',selectedOption:'extra_point'},{type:'extra_point',team:'home',points:1,made:true},
  td('home',4,20,33,33),{type:'two_point',team:'home',points:0,made:false},
 ];
 const rows=C.review(events,'home');
 assert.equal(rows.length,2);
 assert.deepEqual(rows.map(r=>[r.margin,r.choice,r.better]),[[-2,'kick','two'],[0,'two','kick']]);
 assert.equal(C.text(rows[0]),'Q4 2:30: Down 2 after the touchdown, the staff kicked the extra point. Going for two was worth '+rows[0].gain+' points of win chance by the chart.');
 assert.match(C.text(rows[1]),/^Q4 0:20: Tied after the touchdown, the staff went for two \(no good\)\. Kicking was worth \d+ points/);
 assert.deepEqual(C.review(events,'away'),[],'the other side is not ours to review');
 assert.deepEqual(C.review(null,'home'),[]);
});

test('in the game, the box score shows a review and a detailed game records cleanly',async()=>{
 const e=loadEngine({seed:5151,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;if(u.phase==='preseason')e.beginSeason();
 if(e.hasPendingWeeklyDecisions())e.delegateWeeklyDecisions();
 e.simulateUserDetailed();
 const rec=u.gameArchive.find(g=>g.id===u.lastDetailedGame?.gameId);assert.ok(rec,'the game was recorded');
 assert.ok(rec.conversionReview===undefined||Array.isArray(rec.conversionReview));
 rec.conversionReview=[{period:4,clock:150,margin:-2,choice:'kick',better:'two',gain:15,made:true}];
 const html=e.gameBoxHTML(rec);assert.match(html,/STAFF CALLS, REVIEWED/);assert.match(html,/Going for two was worth 15 points/);
});
