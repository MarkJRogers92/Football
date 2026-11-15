const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeRealignmentSystem}=require('../realignment.js');
const {loadEngine}=require('../tools/harness.js');

// A small league: four conferences of four, one point apart on the map so travel barely matters unless a test wants it.
function league({user=null,commissioner=false}={}){
 const conf=['A','B','C','D'],teams=[];let id=1;
 const base={A:90,B:70,C:55,D:40};
 for(const c of conf)for(let i=0;i<4;i++){const p=base[c]+(i===0?18:i===3?-12:0);teams.push({id:id++,name:`${c}${i}`,conference:c,prestige:p,fan_support:p,facilities:p,lat:40,lon:-90+i*.01})}
 const u={year:2030,week:0,teams,events:[]};
 const events=[];
 const R=makeRealignmentSystem({getUniverse:()=>u,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),userTeam:()=>teams.find(t=>t.name===user)||null,commissioner:()=>commissioner,
  rederiveRivalries:()=>{},event:e=>events.push(e),distance:(a,b,c,d)=>Math.hypot(a-c,b-d)*69});
 R.state().startYear=2027;
 return{R,u,teams,events,T:n=>teams.find(t=>t.name===n)};
}

test('conferences are ranked by media value and paid by rank, top two four units and bottom two nothing',()=>{
 const {R}=league();
 const r=R.ranking();
 assert.deepEqual(r.map(x=>x.conference),['A','B','C','D']);
 assert.deepEqual(r.map(x=>x.rank),[1,2,3,4]);
 assert.deepEqual([1,2,3,4,5,6,7,8,9,10].map(R.payoutFor),[4,4,3,3,2,2,1,1,0,0]);
});

test('a window opens every four seasons from the start of the dynasty',()=>{
 const {R}=league();
 assert.equal(R.isWindow(2029),false);
 assert.equal(R.isWindow(2030),true,'the fourth season closes the first cycle');
 assert.equal(R.isWindow(2031),false);
 assert.equal(R.isWindow(2034),true);
 assert.equal(R.nextWindow(2031),2034);
});

test('the best brand below swaps with the weakest brand above, between neighbours, at most twice, and sizes hold',()=>{
 const {R,u,T,events}=league();
 const plan=R.proposals();
 assert.ok(plan.length>=1&&plan.length<=R.MAX_MOVES);
 for(const p of plan){
  const r=R.ranking(),from=r.find(x=>x.conference===p.from).rank,to=r.find(x=>x.conference===p.to).rank;
  assert.equal(from-to,1,'only neighbouring conferences trade');
  assert.ok(p.gap>=R.GAP);
 }
 const used=plan.flatMap(p=>[p.from,p.to]);
 assert.equal(new Set(used).size,used.length,'a conference takes part in one swap per window');
 const out=R.runWindow();
 assert.equal(out.moves.length,plan.length);
 const sizes={};for(const t of u.teams)sizes[t.conference]=(sizes[t.conference]||0)+1;
 assert.deepEqual(Object.values(sizes),[4,4,4,4],'every conference keeps its size');
 const m=out.moves[0];
 assert.equal(T(m.up.name).conference,m.up.to);
 assert.equal(T(m.down.name).conference,m.down.to);
 assert.equal(events.filter(e=>e.type==='CONFERENCE_REALIGNMENT').length,plan.length);
 assert.equal(R.runWindow(),null,'one window per offseason');
});

test('fans notice: moving up lifts fan support, being dropped lowers it',()=>{
 const {R,T}=league();
 const p=R.proposals()[0],up=p.up.fan_support,down=p.down.fan_support;
 R.swap(p.up,p.down,'test');
 assert.equal(T(p.up.name).fan_support,up+3);
 assert.equal(T(p.down.name).fan_support,down-3);
});

test('travel costs appeal, so a distant brand loses out to a nearer one of similar strength',()=>{
 const {R,T}=league();
 const near=T('B0'),far=T('B1');
 far.prestige=far.fan_support=far.facilities=near.prestige+1;   // a fraction stronger
 far.lat=40;far.lon=-60;                                          // and about 2,000 miles away
 assert.ok(R.appeal(far,'A')<R.appeal(near,'A'));
 assert.equal(R.proposals().find(p=>p.to==='A').up.name,'B0');
});

test('an invitation to the coach waits for an answer; accepting swaps, declining offers the place to the next brand',()=>{
 const a=league({user:'B0'});
 a.R.runWindow();
 const inv=a.R.state().pending;
 assert.ok(inv,'the coach is asked');
 assert.equal(inv.schoolId,a.T('B0').id);
 assert.equal(a.T('B0').conference,'B','nothing moves before the answer');
 const yes=a.R.answer(true);
 assert.ok(yes.ok&&yes.accepted);
 assert.equal(a.T('B0').conference,'A');
 assert.equal(a.R.state().pending,null);

 const b=league({user:'B0'});
 b.R.runWindow();
 const replaced=b.T(b.R.state().pending.replacesName);
 const no=b.R.answer(false);
 assert.ok(no.ok&&!no.accepted);
 assert.equal(b.T('B0').conference,'B','declining keeps the program where it is');
 if(no.move){assert.notEqual(no.move.up.name,'B0');assert.equal(replaced.conference,'B','the place goes to the next brand instead')}
 assert.ok(b.events.some(e=>e.type==='REALIGNMENT_DECLINED'));
 assert.equal(b.R.answer(true).ok,false,'an answered invitation is gone');
});

test('an unanswered invitation is settled at the preseason by staying put',()=>{
 const {R,T}=league({user:'B0'});
 R.runWindow();
 const r=R.settle();
 assert.ok(r.ok&&!r.accepted);
 assert.equal(T('B0').conference,'B');
});

test('being dropped is not a choice, and the program page warns beforehand',()=>{
 const {R,T}=league({user:'A3'});
 assert.equal(R.outlook(T('A3')).status,'at-risk');
 R.runWindow();
 assert.equal(R.state().pending,null);
 assert.equal(T('A3').conference,'B');
 assert.equal(R.outlook(T('B0')).status!==undefined,true);
});

test('in commissioner mode nobody is asked',()=>{
 const {R,T}=league({user:'B0',commissioner:true});
 R.runWindow();
 assert.equal(R.state().pending,null);
 assert.equal(T('B0').conference,'A');
});

test('in the real game a window moves programs after the season is archived, keeps rivals in conference and pays members',async()=>{
 const e=loadEngine({seed:9301,fullRuntime:true});
 await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const R=globalThis.DynastyRealignment,u=e.universe;
 R.state().startYear=u.year-3;   // this season closes a cycle
 const before=new Map(u.teams.map(t=>[t.id,t.conference]));
 e.simSeason();e.simConferenceChampionships();e.simBowls();e.simPlayoff();
 assert.ok(R.isWindow(u.year));
 assert.ok(e.advanceOffseasonPhase(),'the review runs');
 const moved=u.teams.filter(t=>t.conference!==before.get(t.id));
 const pending=u.realignment.pending;
 assert.ok(moved.length>=2||pending,'the window moves programs or asks the coach');
 assert.equal(moved.length%2,0,'moves are swaps');
 const season=u.history.find(h=>h.type==='season');
 for(const t of moved){const rec=season.records.find(r=>r.schoolId===t.id||r.name===t.name);if(rec?.conference)assert.equal(rec.conference,before.get(t.id),'the archived season keeps the conference it was played in')}
 for(const t of u.teams.filter(x=>x.rivalry)){const o=e.rivalOf(t);assert.equal(o.conference,t.conference,`${t.name} and ${o.name} share a conference`)}
 // Through the rest of the offseason: the new schedule is valid for the new membership.
 let guard=0;
 while(u.phase==='complete'&&guard++<40){
  if((u.jobOffers||[]).length){e.acceptPost(u.jobOffers[0].schoolId);continue}
  const ph=u.offseason?.phase;if(ph==='spring'){e.runSpringCamp();continue}if(ph==='fall'){e.runFallCamp();continue}
  if(!e.advanceOffseasonPhase())break;
 }
 assert.equal(u.realignment.pending,null,'the preseason settles any invitation');
 assert.deepEqual(e.validateSchedule(),[]);
 const sizes={};for(const t of u.teams)sizes[t.conference]=(sizes[t.conference]||0)+1;
 assert.ok(Object.values(sizes).every(n=>n===12));
 const F=globalThis.DynastyFacilities,top=R.ranking()[0];
 assert.ok(top.payout>0&&F.state(u.teams.find(t=>t.conference===top.conference)).fund>=0);
});
