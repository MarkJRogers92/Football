const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeTraditions}=require('../traditions.js');
const {loadEngine}=require('../tools/harness.js');

function world(){
 const t={id:7,name:'Home U',rivalry:{series:{streak:5}}};
 const season=(year,w,l)=>({type:'season',year,records:[{schoolId:7,name:'Home U',w,l}]});
 const u={year:2034,history:[season(2034,9,3),season(2033,8,4),season(2032,10,2),season(2031,7,5),season(2030,9,4),season(2029,4,8)],
  events:[2030,2031,2032,2033].map(y=>({type:'BOWL_RESULT',season:y,schoolIds:[3,7]}))};
 let home=12;
 return{t,u,setHome:n=>{home=n},T:makeTraditions({getUniverse:()=>u,homeStreak:()=>home})};
}

test('long runs become traditions; short ones are shown as building',()=>{
 const {t,T}=world();
 assert.deepEqual(T.runs(t),{fortress:12,rivalry:5,winning:5,bowls:0},'no bowl in 2034 breaks the bowl run');
 assert.deepEqual(T.active(t).map(x=>x.key),['fortress','rivalry','winning']);
 assert.deepEqual(T.building(t),[]);assert.equal(T.fans(t),3);
 t.rivalry.series.streak=-2;assert.equal(T.runs(t).rivalry,0,'a losing streak is no tradition');
});

test('the yearly review reports traditions gained and lost, once a year',()=>{
 const {t,u,setHome,T}=world();
 const first=T.review(t);assert.deepEqual(first.gained.map(x=>x.key),['fortress','rivalry','winning']);
 assert.deepEqual(T.review(t).gained,[],'once a year');
 u.year=2035;u.history.unshift({type:'season',year:2035,records:[{schoolId:7,w:3,l:9}]});setHome(0);
 const next=T.review(t);assert.deepEqual(next.lost.map(x=>x.key).sort(),['fortress','winning']);
 assert.deepEqual(t.traditions.active,['rivalry']);assert.equal(t.traditions.since.rivalry,2034);
});

test('in the game, only the coach\'s program gets the fan support, and a new tradition is news',async()=>{
 const e=loadEngine({seed:9393,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan'),other=u.teams.find(x=>x!==t);
 (globalThis.DynastyHomeStreaks||e.DynastyHomeStreaks).of(t.id).streak=11;(globalThis.DynastyHomeStreaks||e.DynastyHomeStreaks).of(other.id).streak=11;
 t.fan_support=60;other.fan_support=60;
 const base=x=>Math.round((x.fan_support??60)*.6+e.fanSupportTarget(x)*.4);
 const expectMine=Math.min(100,base(t)+1),expectOther=base(other);
 e.updateFanSupport(t);e.updateFanSupport(other);
 assert.equal(t.fan_support,expectMine,'the Fortress adds one');assert.equal(other.fan_support,expectOther,'AI programs are unchanged');
 const ev=u.events.filter(x=>x.type==='TRADITION');assert.equal(ev.length,1);assert.match(ev[0].summary,/A new tradition at Chicago Metropolitan: The Fortress \(11 straight home wins\)/);
});
