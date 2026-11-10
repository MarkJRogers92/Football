const {test}=require('node:test');
const assert=require('node:assert/strict');
const lab=require('../game-engine-v2-lab.js');
const home={id:1,name:'Chicago Metropolitan'},away={id:2,name:'Great Lakes University'};
const homeProfile={offense:84,defense:79,overall:81.5},awayProfile={offense:72,defense:74,overall:73};

test('v2 lab preview is deterministic and produces a final shadow game',()=>{
 const options={gameId:'lab-1',seed:'lab-seed',home,away,homeProfile,awayProfile,homeFieldRating:2.5};
 const a=lab.simulate(options),b=lab.simulate(options);
 assert.equal(a.state.status,'final');assert.deepEqual(a.state.events,b.state.events);assert.deepEqual(a.summary,b.summary);
 assert.equal(a.names.home,home.name);assert.equal(a.names.away,away.name);
});

test('v2 lab formats clock, field and down context for football-readable events',()=>{
 assert.equal(lab.clockLabel({period:2,clock:65}),'Q2 1:05');
 assert.equal(lab.clockLabel({period:5,clock:0,ot:{period:2}}),'OT2');
 assert.equal(lab.fieldLabel({possession:'home',fieldPosition:37}),'own 37');
 assert.equal(lab.fieldLabel({possession:'away',fieldPosition:78}),'opp 22');
 assert.equal(lab.downLabel({down:3,distance:7,possession:'home',fieldPosition:44}),'3rd & 7 at own 44');
 const html=lab.eventRowHTML({type:'scrimmage',team:'home',yards:8,from:{down:2,distance:6,fieldPosition:48},state:{period:1,clock:511,score:{home:7,away:3}}},{home:'Metro',away:'Lakes'});
 assert.match(html,/Q1 8:31/);assert.match(html,/2nd &amp; 6 at own 48/);assert.match(html,/Metro gains 8 yards/);
});

test('v2 lab summary and event feed escape team names and show core metrics',()=>{
 const preview=lab.simulate({gameId:'lab-2',seed:'lab-html',home:{id:1,name:'Metro <A>'},away:{id:2,name:'Lakes & B'},homeProfile,awayProfile,homeFieldRating:2});
 const summary=lab.summaryHTML(preview),events=lab.eventsHTML(preview,20);
 assert.match(summary,/Metro &lt;A&gt;/);assert.match(summary,/Lakes &amp; B/);assert.match(summary,/Total yards/);assert.match(summary,/Turnovers/);
 assert.ok(events.length>0);assert.doesNotMatch(events,/<script/i);
});

test('play-by-play names the players attribution recorded for each play',()=>{
 const attribution={contexts:{home:{qb:{id:'q',name:'Malachi Voss'},rushers:[{player:{id:'r',name:'Gavin Kemp'},weight:1}],receivers:[{player:{id:'w',name:'Aaron Woods'},weight:1}],defenders:[],offensiveLine:[],kicker:{id:'k',name:'Roman Monroe'}},away:{defenders:[{player:{id:'d',name:'Darius Stone'},weight:1}],rushers:[],receivers:[],offensiveLine:[]}},
  playActors:{1:{qb:'q',tg:'w',tk:'d'},2:{ca:'r',qb:'q',tk:'d'},3:{qb:'q',sb:'d'},4:{qb:'q',tg:'w',ib:'d'},5:{kk:'k'},6:{qb:'q',tg:'w',pb:'d'}}};
 const names=lab.withActors({home:'Metro',away:'Lakes'},attribution),t=e=>lab.eventText({team:'home',...e},names);
 assert.equal(t({seq:1,type:'scrimmage',kind:'pass',completed:true,yards:14}),'M. Voss pass complete to A. Woods for 14 yards, tackled by D. Stone.');
 assert.equal(t({seq:2,type:'scrimmage',kind:'rush',yards:-2}),'G. Kemp runs for a loss of 2, tackled by D. Stone.');
 assert.equal(t({seq:3,type:'scrimmage',kind:'pass',sack:true,completed:false,yards:-7}),'M. Voss sacked by D. Stone for a loss of 7.');
 assert.equal(t({seq:4,type:'interception',kind:'pass'}),'M. Voss pass for A. Woods intercepted by D. Stone.');
 assert.equal(t({seq:5,type:'field_goal',distance:42,made:true}),'R. Monroe (Metro) 42-yard field goal good.');
 assert.equal(t({seq:6,type:'scrimmage',kind:'pass',completed:false,yards:0}),'M. Voss pass incomplete, intended for A. Woods, broken up by D. Stone.');
 assert.equal(lab.eventText({seq:9,type:'scrimmage',team:'home',kind:'rush',yards:3},{home:'Metro'}),'Metro runs for 3 yards.','without attribution the team is named');
});
