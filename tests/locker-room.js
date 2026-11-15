const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeLockerRoomSystem}=require('../locker-room.js');
const {loadEngine}=require('../tools/harness.js');

const OFF=new Set(['QB','RB','WR','TE','OT','OG','C','K','P']);
function room({week=0,phase='regular'}={}){
 const u={year:2030,week,phase,teams:[],events:[]};
 const pos=['QB','RB','WR','TE','OT','OG','C','K','P','EDGE','DT','LB','CB','S'];
 const roster=Array.from({length:60},(_,i)=>({id:`p${i}`,name:`Player ${i}`,pos:pos[i%pos.length],perceived:50+(i*7)%45,morale:70,staffTrust:70,eligibilityUsed:i%4}));
 const t={id:7,name:'Test U',roster,schedule:[]};u.teams.push(t);
 const events=[];
 const L=makeLockerRoomSystem({getUniverse:()=>u,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),eligibility:p=>p.eligibilityUsed,offense:p=>OFF.has(p.pos),event:e=>events.push(e)});
 return{L,u,t,events};
}

test('personality is fixed by the player id and spread across five kinds',()=>{
 const {L,t}=room();
 const p=t.roster[3];
 assert.equal(L.personality(p),L.personality({...p}),'the same id gives the same personality');
 const counts={};for(let i=0;i<4000;i++){const k=L.personality({id:`x${i}`});counts[k]=(counts[k]||0)+1}
 assert.deepEqual(Object.keys(counts).sort(),[...L.ORDER].sort());
 assert.ok(counts.Steady>counts.Leader&&counts.Steady>counts.Volatile,'most players are steady');
 assert.ok(counts.Leader>250&&counts.Leader<550,`about one in ten is a leader (${counts.Leader})`);
});

test('leadership grows with class year, trust and morale',()=>{
 const {L}=room();
 const base={id:'same',pos:'QB',perceived:70,morale:70,staffTrust:70,eligibilityUsed:0};
 assert.ok(L.leadership({...base,eligibilityUsed:3})>L.leadership(base),'seniors lead');
 assert.ok(L.leadership({...base,staffTrust:95})>L.leadership(base),'trust in the staff');
 assert.ok(L.leadership({...base,morale:95})>L.leadership(base),'a happy player');
});

test('the staff name two captains a side, never a specialist, and the coach can change them only before Week 1',()=>{
 const {L,t,u}=room();
 const ids=L.ensureCaptains(t);
 assert.equal(ids.length,L.CAPTAINS);
 const caps=L.captains(t);
 assert.equal(caps.filter(p=>OFF.has(p.pos)).length,2);
 assert.ok(caps.every(p=>p.pos!=='K'&&p.pos!=='P'));
 assert.ok(caps.every(p=>p.captainYear===u.year),'captains are marked for the year');
 const full=L.toggleCaptain(t,t.roster.find(p=>!ids.includes(p.id)).id);
 assert.equal(full.ok,false,'four is the limit');
 const off=L.toggleCaptain(t,ids[0]);
 assert.ok(off.ok&&off.removed);
 assert.equal(t.roster.find(p=>p.id===ids[0]).captainYear,undefined);
 const kicker=t.roster.find(p=>p.pos==='K');
 assert.ok(L.toggleCaptain(t,kicker.id).ok,'the coach may pick a kicker');
 u.week=1;
 assert.match(L.toggleCaptain(t,ids[1]).reason,/Week 1/);
});

test('chemistry moves a quarter of the way to its target each week and follows morale and results',()=>{
 const {L,t}=room();
 const s=L.state(t);s.chemistry=55;L.ensureCaptains(t);
 const tg=L.target(t).value,r=L.weekly(t);
 assert.equal(r.after,Math.round(55*.75+tg*.25));
 const happy=room(),sad=room();
 for(const p of sad.t.roster)p.morale=40;
 sad.t.schedule=[1,2,3].map(()=>({played:true,winner:'Other'}));
 happy.t.schedule=[1,2,3].map(()=>({played:true,winner:'Test U'}));
 assert.ok(happy.L.target(happy.t).value>sad.L.target(sad.t).value+10);
});

test('chemistry is worth up to +1.0 and costs up to -1.5 on offense and defense',()=>{
 const {L,t}=room();
 L.state(t).chemistry=99;assert.equal(L.ratingEdge(t),1);
 L.state(t).chemistry=5;assert.equal(L.ratingEdge(t),-1.5);
 L.state(t).chemistry=55;assert.equal(L.ratingEdge(t),0);
 assert.equal(L.ratingEdge({roster:[]}),0,'a team without a locker room record is neutral');
});

test('a strong room lifts low morale and a broken one wears it down',()=>{
 const a=room();a.L.state(a.t).chemistry=95;a.t.roster.forEach(p=>p.morale=50);
 const tg=a.L.target(a.t);a.L.weekly(a.t);
 if(a.L.state(a.t).chemistry>=70)assert.ok(a.t.roster.every(p=>p.morale===51));
 const b=room();b.L.state(b.t).chemistry=10;b.t.roster.forEach(p=>p.morale=60);b.L.weekly(b.t);
 assert.ok(b.t.roster.every(p=>p.morale===59));
 assert.ok(tg.value>0);
});

test('a flashpoint waits for the coach: discipline, back him, or the captains',()=>{
 const make=()=>{const r=room({week:3});const p=r.L.core(r.t).find(x=>r.L.personality(x)==='Volatile')||r.t.roster[0];r.L.state(r.t).incident={year:2030,week:3,playerId:p.id,name:p.name,pos:p.pos};r.L.state(r.t).chemistry=50;return{...r,p}};
 let r=make();let res=r.L.respond(r.t,'discipline');
 assert.ok(res.ok);assert.equal(r.L.state(r.t).chemistry,55);assert.equal(r.p.morale,58);assert.equal(r.L.state(r.t).incident,null);
 r=make();res=r.L.respond(r.t,'back');assert.equal(r.L.state(r.t).chemistry,45);assert.equal(r.p.morale,78);
 r=make();r.L.ensureCaptains(r.t);res=r.L.respond(r.t,'captains');
 assert.equal(r.L.state(r.t).chemistry,50+(r.L.target(r.t).capLead>=60?4:-3));
 assert.equal(r.L.respond(r.t,'back').ok,false,'nothing left to answer');
});

test('an unhappy Volatile player can blow up, and the odds are the same on every load',()=>{
 let fired=0,first=null;
 for(let week=1;week<=40;week++){
  const r=room({week});const p=r.t.roster.find(x=>r.L.personality(x)==='Volatile');if(!p)continue;p.morale=40;p.perceived=99;
  const out=r.L.maybeIncident(r.t);
  const again=room({week});const q=again.t.roster.find(x=>x.id===p.id);q.morale=40;q.perceived=99;
  assert.equal(!!again.L.maybeIncident(again.t),!!out,'the same week gives the same answer');
  if(out){fired++;first??=r;assert.equal(out.kind,'flashpoint');assert.ok(r.events.some(e=>e.type==='LOCKER_ROOM_FLASHPOINT'))}
 }
 assert.ok(fired>=3&&fired<=30,`fires some weeks, not all (${fired}/40)`);
});

test('two straight losses with a Leader captain bring a players-only meeting, once a season',()=>{
 const r=room({week:5});
 const leader=r.t.roster.find(p=>r.L.personality(p)==='Leader');
 r.L.setCaptains(r.t,[leader.id]);
 r.t.schedule=[{played:true,winner:'Other'},{played:true,winner:'Other'}];
 r.t.roster.forEach(p=>{if(r.L.personality(p)==='Volatile')p.morale=90});
 const before=r.L.state(r.t).chemistry,out=r.L.maybeIncident(r.t);
 assert.equal(out.kind,'meeting');
 assert.equal(r.L.state(r.t).chemistry,before+6);
 assert.notEqual(r.L.maybeIncident(r.t)?.kind,'meeting');
});

test('a new season keeps half the chemistry and clears what was open',()=>{
 const {L,t}=room();L.state(t).chemistry=95;L.state(t).incident={playerId:'p1'};
 L.newSeason(t);
 assert.equal(L.state(t).chemistry,75);
 assert.equal(L.state(t).incident,null);
});

test('in the real game chemistry moves every week for every program, rates teams, and lowers a captain\'s transfer risk',async()=>{
 const e=loadEngine({seed:9411,fullRuntime:true});
 await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const L=globalThis.DynastyLockerRoom,u=e.universe,me=e.T('Chicago Metropolitan');
 const raw=e.profiles(me);
 for(let i=0;i<4;i++)e.simWeek(true);
 assert.ok(u.teams.every(t=>t.lockerRoom&&Number.isFinite(t.lockerRoom.chemistry)),'every program has a room');
 assert.equal(L.captainIds(me).length,4);
 L.state(me).chemistry=99;
 const lifted=e.profiles(me);
 assert.equal(lifted.chemistryEdge,1);
 assert.ok(lifted.offense>=Math.min(99,raw.offense-5),'the edge is applied on top of the ratings');
 const cap=L.captains(me)[0];
 const withC=e.transferRisk(cap);delete cap.captainYear;const without=e.transferRisk(cap);
 assert.ok(withC<=without&&(without===0||withC===Math.max(0,without-6)));
 const chems=u.teams.map(t=>t.lockerRoom.chemistry).sort((a,b)=>a-b);
 assert.ok(chems[60]>=40&&chems[60]<=70,`the league median is near neutral (${chems[60]})`);
});
