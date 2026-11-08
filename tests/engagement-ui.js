const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {loadEngine}=require('../tools/harness');
function yearbookFixture(){
 const keys=new Set();let modal=null,active,printed=0;
 const button=()=>({isConnected:true,disabled:false,handlers:{},focus(){active=this},addEventListener(type,fn){this.handlers[type]=fn}});
 const opener=button(),fallback=button();active=opener;
 const document={get activeElement(){return active},querySelector(s){return s==='.yearbook'?modal:s==='[data-yearbook]'?fallback:null},addEventListener(type,fn){if(type==='keydown')keys.add(fn)},removeEventListener(type,fn){keys.delete(fn)},body:{insertAdjacentHTML(){const print=button(),close=button();modal={isConnected:true,print,close,querySelector:s=>s==='[data-yb-print]'?print:close,querySelectorAll:()=>[print,close],contains:el=>el===print||el===close,remove(){this.isConnected=false;print.isConnected=close.isConnected=false;modal=null}}}}};
 const context={module:{exports:{}},document,window:{print(){printed++}},DynastySeasonMoments:{yearbook:()=>({year:2028,team:{id:1,name:'Home',w:8,l:4,cw:5,cl:3},leaders:[],awards:[],signing:{count:0,five:0,four:0},picks:[],coach:'Coach'})}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../season-moments.js'),'utf8'),context);
 return {api:context.module.exports,opener,fallback,get modal(){return modal},get active(){return active},key(key,shiftKey=false){const e={key,shiftKey,preventDefault(){this.prevented=true}};for(const fn of keys)fn(e);return e}};
}
test('yearbook restores its opener and contains keyboard focus, including Escape and replaced triggers',()=>{
 const f=yearbookFixture();assert.equal(f.api.openYearbook(),true);assert.equal(f.active,f.modal.print);
 f.modal.close.focus();assert.equal(f.key('Tab').prevented,true);assert.equal(f.active,f.modal.print);
 f.key('Tab',true);assert.equal(f.active,f.modal.close);
 f.key('Escape');assert.equal(f.modal,null);assert.equal(f.active,f.opener);
 f.api.openYearbook();f.opener.isConnected=false;f.modal.close.handlers.click();assert.equal(f.active,f.fallback);
});
test('weekly preparation exposes its selection state and budget context before a choice',async()=>{
 const e=loadEngine({seed:5230,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const off=e.weeklyPrepFocusHTML('coverage',[],['coverage'],false),on=e.weeklyPrepFocusHTML('coverage',['coverage'],['coverage'],false);
 assert.match(off,/aria-pressed="false"/);assert.match(on,/aria-pressed="true"/);assert.match(off,/aria-describedby="v0102PrepBudget"/);assert.match(off,/fewer front reps/);
});

test('big-moments coaching advances between real decisions and replays the same actions after a saved-game restore',async()=>{
 global.__DL_TEST__={};const e=loadEngine({seed:5240,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();e.delegateWeeklyDecisions(e.T('Chicago Metropolitan'));
 assert.equal(typeof e.gameDayBigStart,'function');global.__DL_TEST__.v2GameDayHoldFinal(true);e.gameDayBigStart();
 const api=global.DynastyGameEngineV2GameDay;let live=e.gameDaySession();assert.ok(api.pendingDecision(live));assert.equal(e.gameDayMode(),'moments');
 const manual=api.restore(api.snapshot(live)),choice=api.pendingDecision(manual).staffRecommendation;api.resolve(manual,choice);api.advance(manual);
 e.gameDayRun(`choice:${choice}`);assert.deepEqual(api.snapshot(e.gameDaySession()),api.snapshot(manual),'same seed and coaching choices retain exactly the same game');
 const expected=api.snapshot(e.gameDaySession()),actions=[...e.universe.liveGameDay.actions];e.universe=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));e.gameDayForget();e.normalizeUniverse();assert.equal(e.gameDayRestore(),true);
 assert.deepEqual(api.snapshot(e.gameDaySession()),expected);assert.deepEqual(e.universe.liveGameDay.actions,actions);assert.equal(e.gameDayMode(),'moments');
 const final=api.restore(expected);api.simulate(final,()=> 'delegate');e.gameDayRun('delegate');assert.deepEqual(api.snapshot(e.gameDaySession()),api.snapshot(final));
});

test('legacy live-game saves without a presentation mode retain manual play navigation',async()=>{
 const e=loadEngine({seed:5241,fullRuntime:true});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();e.delegateWeeklyDecisions(e.T('Chicago Metropolitan'));e.gameDayPrepare();e.gameDayRun('decision');
 const api=global.DynastyGameEngineV2GameDay,before=api.snapshot(e.gameDaySession());delete e.universe.liveGameDay.mode;e.gameDayForget();assert.equal(e.gameDayRestore(),true);assert.equal(e.gameDayMode(),'plays');assert.deepEqual(api.snapshot(e.gameDaySession()),before);
});

test('briefing profile activation stays single when normal profile links are rebound',()=>{
 const opened=[],buttons=['qb','edge'].map(id=>({dataset:{player:id},listeners:[],addEventListener(_type,fn){this.listeners.push(fn)},click(){this.onclick?.();this.listeners.forEach(fn=>fn())}}));
 const host={innerHTML:'',querySelectorAll:()=>buttons,querySelector:()=>null},team={id:1,name:'Home'},opponent={id:2,name:'Away'};
 const context={DynastyFirstSeasonFlow:require('../first-season-flow'),universe:{year:2027,week:0,phase:'regular',gameArchive:[]},selected:()=>team,findUserGame:()=>({home:'Home',away:'Away'}),T:()=>opponent,guidanceModel:()=>({items:[],leading:[],forecast:{}}),ROLE_DEFS:[{id:'QB1',label:'Starting QB',side:'Offense',base:true},{id:'EDGE',label:'Edge defender',side:'Defense',base:true}],roleStarter:(_t,id)=>id==='QB1'?{id:'qb',name:'Quarterback',pos:'QB'}:{id:'edge',name:'Defender',pos:'EDGE'},showPlayerProfile:id=>opened.push(id),extendRender(){},document:{querySelector:s=>s==='#firstSeasonBriefing'?host:null}};
 context.window=context;vm.runInNewContext(fs.readFileSync(require.resolve('../first-season-flow-ui'),'utf8'),context);context.renderFirstSeasonFlow({prep:false});
 // The dashboard's weekly stories refresh the shared profile bindings after the briefing renders.
 for(const b of buttons)b.onclick=()=>context.showPlayerProfile(b.dataset.player);buttons[0].click();assert.deepEqual(opened,['qb']);
});
