'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ui=require('../season-moments.js');
const source=fs.readFileSync(path.join(__dirname,'..','season-moments-adapter.js'),'utf8');
function fixture(){
 const home={id:1,name:'Home',w:3,l:1,roster:[],schedule:[{week:4,home:'Home',away:'Away',played:true,gameId:'G2028_4',score:[21,24]},{week:5,home:'Next',away:'Home',played:false}]};
 const away={id:2,name:'Away'},next={id:3,name:'Next'};
 const game={id:'G2028_4',season:2028,week:4,phase:'regular',label:'Regular season',final:true,home:{id:1,name:'Home',record:'2-1'},away:{id:2,name:'Away',record:'1-2'},score:{home:24,away:21},playerStats:{home:[{id:'qb',name:'Recorded Quarterback',pos:'QB',stats:{passYds:285,passTD:3}},{id:'rb',name:'Recorded Runner',pos:'RB',stats:{rushYds:80,rushTD:1}},{id:'wr',name:'Recorded Receiver',pos:'WR',stats:{recYds:66}}],away:[]}};
 const u={year:2028,week:4,phase:'regular',rng:{seed:71,draws:42},teams:[home,away,next],gameArchive:[game],playLogs:{},weeklyDecisions:[]};
 const ctx={universe:u,selected:()=>home,activeSaveSlot:'main',findPlayer:id=>id==='qb'?{p:{id,name:'Current Name',pos:'QB'}}:null,showGameCenter(){},rivalOf:()=>away};
 vm.runInNewContext(source,ctx);
 return{ctx,u,home,game,api:ctx.DynastySeasonMoments};
}
function statusFor(r,state='saved'){return{...r.context,state,message:state==='saved'?'Autosave finished.':'Autosave is off.'}}

test('last final is current-season and program-ID scoped, even after a rename or same-name collision',()=>{
 const {u,home,game,api}=fixture();home.name='Renamed Home';
 u.gameArchive.push({...game,id:'old',season:2027,week:17},{...game,id:'future',season:2029,week:1},{...game,id:'other',week:5,home:{id:99,name:'Renamed Home'}},{...game,id:'undated',season:undefined,week:9});
 assert.equal(api.highlights()?.gameId,game.id);
});
test('season rollover never borrows the prior season final',()=>{
 const {u,api}=fixture();u.year++;u.week=0;u.phase='preseason';
 assert.equal(api.highlights(),null);
});
test('incomplete or future archive rows cannot replace a recorded final',()=>{
 const {u,game,api}=fixture();
 u.gameArchive.push({...game,id:'unfinished',week:5,final:false},{...game,id:'missing-score',week:5,score:{home:undefined,away:14}},{...game,id:'future-week',week:10});
 assert.equal(api.highlights()?.gameId,game.id);
});
test('a more recent schedule final stays factual when its box score is deferred',()=>{
 const {u,home,api}=fixture();u.week=5;
 Object.assign(home.schedule[1],{played:true,gameId:'G2028_5',score:[17,20]});
 const h=api.highlights();assert.equal(h.gameId,'G2028_5');assert.equal(h.us,17);assert.equal(h.them,20);assert.equal(h.performers.length,0);assert.equal(h.hasBoxScore,false);
});
test('ties are not labeled losses or credited with an invented record change',()=>{
 const {game,home,api}=fixture();game.score={home:21,away:21};delete game.home.record;delete home.w;delete home.l;
 const h=api.highlights();assert.equal(h.outcome,'T');assert.equal(h.consequence,null);
 assert.match(ui.highlightsHTML(h),/T 21–21/);assert.doesNotMatch(ui.highlightsHTML(h),/is-loss|Player of the game/);
});
test('the consequence uses the archived pregame record, rather than a later program record',()=>{
 const {home,api}=fixture();home.w=8;home.l=4;
 assert.equal(api.highlights().consequence,'Record after this game: 3–1.');
});
test('postseason consequences require a recorded result and never invent a first achievement',()=>{
 const {u,game,api}=fixture();u.phase='complete';game.week=17;game.label='National Championship';
 assert.equal(api.highlights().consequence,'National champions.');
 game.score={home:20,away:23};assert.doesNotMatch(api.highlights().consequence,/champions|first/i);
});
test('performers retain their recorded names and compact play-log sides identify our actual plays',()=>{
 const {u,game,api}=fixture();
 u.playLogs[game.id]=[{t:'scrimmage',sd:'a',q:1,c:600,y:60,k:'r'},{t:'scrimmage',sd:'h',q:3,c:300,y:27,k:'p',a:{passer:'qb'}},{t:'touchdown',sd:'h',q:3,c:300}];
 const h=api.highlights();assert.equal(h.performers[0].name,'Recorded Quarterback');assert.equal(h.plays[0].ours,true);assert.match(h.plays[0].text,/Home/);assert.match(h.plays[0].text,/Recorded Quarterback/);
});
test('a bye week points to the next actual unplayed opponent without creating a task',()=>{
 const {u,home,api}=fixture();home.schedule[1].week=6;
 home.schedule.push({season:2027,week:5,home:'Home',away:'Old Opponent',played:false});
 const r=api.weeklyRhythm();assert.equal(r.bye,true);assert.equal(r.next.opponent,'Next');assert.equal(r.next.week,6);assert.equal(r.requiredChoices,0);assert.match(r.resume,/Week 6 at Next/);
 assert.equal(u.week,4);
});
test('a user game final before national advancement says game complete, not week complete',()=>{
 const {u,api}=fixture();u.week=3;
 const r=api.weeklyRhythm();assert.match(r.stop,/^Game complete\./);assert.match(r.resume,/rest of Week 4/);assert.doesNotMatch(r.stop,/Week complete/);
 u.week=4;assert.match(api.weeklyRhythm().stop,/^Week complete\. Pick up with/);
});
test('weekly choices remain read-only and distinguish the optional gameplan',()=>{
 const {u,api}=fixture();u.weeklyDecisions=[{id:'real',season:2028,week:4,teamId:1,type:'INJURED_STARTER',resolved:false},{id:'optional',season:2028,week:4,teamId:1,type:'WEEKLY_GAMEPLAN',resolved:false},{id:'stale',season:2027,week:4,teamId:1,type:'INJURED_STARTER',resolved:false}];
 const before=JSON.stringify(u);assert.equal(api.weeklyRhythm().requiredChoices,1);api.highlights();api.weeklyRhythm();assert.equal(JSON.stringify(u),before);
});
test('postseason names only an actual frozen pairing and does not reuse the regular schedule',()=>{
 const {u,api}=fixture();u.phase='playoffReady';
 assert.equal(api.weeklyRhythm().next,null);
 u.teams.push(...Array.from({length:13},(_,i)=>({id:i+4,name:`Program ${i+4}`})));u.playoffFieldIds=u.teams.map(t=>t.id);
 const r=api.weeklyRhythm();assert.equal(r.next.opponent,'Program 16');assert.equal(r.next.label,'Round of 16');assert.doesNotMatch(r.stop,/Week complete/);
 u.playoffFieldUnavailable=true;assert.equal(api.weeklyRhythm().next,null);
});
test('the stopping line follows the current offseason phase rather than reopening season review',()=>{
 const {u,api}=fixture();u.phase='complete';u.offseason={phase:'spring'};
 assert.equal(api.weeklyRhythm().resume,'spring development');
 u.offseason.phase='portal';assert.equal(api.weeklyRhythm().resume,'the transfer portal');
});
test('an old unplayed rivalry entry cannot override the current next opponent',()=>{
 const {home,api}=fixture();home.schedule.push({season:2027,week:1,home:'Home',away:'Away',played:false});
 assert.equal(api.rivalryWeek(),null);
});
test('deferred statistics are not described as nonexistent records',()=>{
 const {u,api}=fixture();u.gameArchive=[];
 const html=ui.highlightsHTML(api.highlights(),api.weeklyRhythm());
 assert.doesNotMatch(html,/No individual game statistics recorded/);assert.match(html,/statistics unavailable here/);
});
test('one standout is visible while secondary performers and replay stay in an optional native disclosure',()=>{
 const {api}=fixture(),h=api.highlights(),html=ui.highlightsHTML(h,api.weeklyRhythm());
 const collapsed=html.split('<details')[0];assert.equal((collapsed.match(/class="hl-star"/g)||[]).length,1);
 assert.match(html,/<details class="hl-more"><summary[^>]*>More from this game/);assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
 assert.match(collapsed,/Record after this game: 3–1/);assert.match(collapsed,/Next/);assert.doesNotMatch(html,/data-.*(?:dismiss|acknowledge)/);
});
test('before the first final the existing weekly desk stands alone',()=>{
 const {u,home,api}=fixture();u.gameArchive=[];home.schedule[0].played=false;u.week=0;
 assert.equal(ui.highlightsHTML(null,api.weeklyRhythm()),'');
});
test('the payoff inserts beside the visible weekly desk, even when Rival Watch is in closed details',()=>{
 const {api}=fixture(),insertions=[],timers=[];
 const anchor=name=>({insertAdjacentHTML:(position,html)=>insertions.push({name,position,html}),classList:{toggle(){}}});
 const rival=anchor('hidden rival'),desk=anchor('visible desk');
 const dash={querySelector:selector=>selector==='#rivalWatch'?rival:selector.includes('.command-center')?desk:null,insertAdjacentHTML:(position,html)=>insertions.push({name:'dashboard',position,html})};
 const context={DynastySeasonMoments:{highlights:api.highlights,weeklyRhythm:api.weeklyRhythm,rivalryWeek:()=>null,yearbook:()=>null},document:{readyState:'complete',querySelector:selector=>selector==='#dashboard'?dash:null,querySelectorAll:()=>[],addEventListener(){},documentElement:{classList:{toggle(){}}}},MutationObserver:class{observe(){}},setTimeout:fn=>timers.push(fn),addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','season-moments.js'),'utf8'),context);
 timers.shift()();assert.equal(insertions.length,1);assert.equal(insertions[0].name,'visible desk');assert.match(insertions[0].html,/id="highlightsCard"/);
});
test('save status comes from a matching persistence snapshot and remains separate from the stopping line',()=>{
 const {api}=fixture(),h=api.highlights(),r=api.weeklyRhythm();
 for(const state of ['pending','saving','saved','unsaved','failed']){
  const html=ui.highlightsHTML(h,r,statusFor(r,state));assert.match(html,new RegExp(`data-save-state="${state}"`));
 }
 const html=ui.highlightsHTML(h,r,statusFor(r));assert.match(html,/class="hl-stop"[^>]*>Week complete\. Pick up with/);assert.match(html,/Autosave finished\./);
 for(const [key,value] of Object.entries({slot:'dynasty-2',year:2027,week:3,programId:2,world:'other'})){
  assert.doesNotMatch(ui.highlightsHTML(h,r,{...statusFor(r),[key]:value}),/data-save-state|Autosave finished/);
 }
 assert.doesNotMatch(ui.highlightsHTML(h,r),/data-save-state="saved"|autosaved|safe to close/i);
});
test('missing/partial facts and long untrusted names render without invented performers or unsafe markup',()=>{
 const {home,game,api}=fixture();game.playerStats={};delete game.home.record;delete home.w;delete home.l;game.away.name='<Away & Co>';home.schedule[1].home='A very long <Next & Program>';
 const h=api.highlights(),html=ui.highlightsHTML(h,api.weeklyRhythm());
 assert.equal(h.consequence,null);assert.doesNotMatch(html,/class="hl-star"|<Away|<Next/);assert.match(html,/&lt;Away &amp; Co&gt;/);assert.match(html,/A very long &lt;Next &amp; Program&gt;/);
});
