const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs');
const {loadEngine}=require('../tools/harness');

// Portal Desk: hours per round, four actions, an honest standing, rival counters and roster needs.
const USER='Chicago Metropolitan';
async function setup(seed,{withoutDesk=false}={}){
 const read=fs.readFileSync;
 if(withoutDesk)fs.readFileSync=function(p,...rest){return String(p).endsWith('portal-desk.js')?'':read.call(fs,p,...rest)};
 let e;
 try{e=loadEngine({seed,fullRuntime:true})}finally{fs.readFileSync=read}
 e.setUserTeam(USER);await e.loadSchools();e.initUniverse();
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 e.offseasonReview();e.offseasonDepartures();
 return e;
}
const D=()=>globalThis.DynastyPortalDesk;
const me=e=>e.T(USER);
function openWithCandidate(e){
 e.openPortalCycle();
 const t=me(e),list=e.portalCandidates().filter(x=>!x.decision&&e.portalFit(x,t));
 assert.ok(list.length>2,'the portal has players who would consider the program');
 return {t,list};
}

test('each round has a budget of portal hours that actions spend',async()=>{
 const e=await setup(5101),{t,list}=openWithCandidate(e),desk=D();
 const info=desk.roundInfo(t);
 assert.ok(info.budget>=10&&info.budget<=16);
 assert.equal(info.spent,0);
 const x=list[0],before=x.interest[t.id]??null;
 const r=desk.perform(x,t,'call');
 assert.equal(r.ok,true);
 assert.ok(x.finalists.includes(t.id),'working a player puts you in his running');
 const start=before??Math.round(e.portalFit(x,t).score);
 assert.equal(r.interest,Math.min(100,start+2),'a call is worth two points');
 assert.equal(desk.roundInfo(t).spent,1);
 assert.equal(desk.perform(x,t,'call').ok,false,'one call a round');
 assert.match(desk.perform(x,t,'host').reason,/Target him first/);
 assert.equal(e.targetPortalCandidate(x.candidateId,1),null);
 const host=desk.perform(x,t,'host');
 assert.equal(host.ok,true);assert.equal(host.delta,6);
 assert.equal(desk.perform(x,t,'host').ok,false,'one host visit a cycle');
 // Spend down to nothing; the next action is refused for hours.
 for(const y of list.slice(1))desk.perform(y,t,'coach');
 const left=desk.roundInfo(t).left;
 assert.ok(left<6);
 const refused=list.slice(1).map(y=>desk.availability(y,t,'coach')).find(a=>!a.ok&&/hours/.test(a.reason||''));
 assert.ok(refused,'out of hours is a reason, not a silent no-op');
});

test('hours reset each round and actions close once he has decided',async()=>{
 const e=await setup(5102),{t,list}=openWithCandidate(e),desk=D();
 desk.perform(list[0],t,'call');
 e.advancePortalRound();
 assert.equal(desk.roundInfo(t).spent,0,'a new round, a fresh budget');
 assert.equal(desk.perform(list[0],t,'call').ok,true,'and a new call');
 const decided=e.portalCandidates().find(x=>x.decision);
 if(decided)assert.match(desk.availability(decided,t,'call').reason,/already decided/);
});

test('the playing-time read uses only ratings the staff can see',async()=>{
 const e=await setup(5103),{t,list}=openWithCandidate(e),desk=D();
 const x=list[0],read=desk.pitchRead(x,t);
 assert.ok(read.delta>=-3&&read.delta<=6);
 assert.ok(['Strong','Good','Modest','Flat','Risky'].includes(read.label));
 const hidden=x.p.trueNow;x.p.trueNow=hidden+40;
 for(const p of t.roster)p.trueNow+=40;
 assert.deepEqual(desk.pitchRead(x,t),read,'hidden ratings never move the read');
 x.p.trueNow=hidden;for(const p of t.roster)p.trueNow-=40;
 // An empty room at his position is the strongest pitch there is.
 const saved=t.roster;t.roster=t.roster.filter(p=>p.pos!==x.p.pos);
 const open=desk.pitchRead(x,t);t.roster=saved;
 assert.ok(open.delta>=read.delta);
 assert.ok(desk.tags(x,{...t,roster:t.roster.filter(p=>p.pos!==x.p.pos)}).includes('Fills a need'));
 const pitch=desk.perform(x,t,'pitch');assert.equal(pitch.delta,read.delta);
});

test('standing gives the real odds of the engine\'s decision rule',async()=>{
 const e=await setup(5104),{t,list}=openWithCandidate(e),desk=D();
 const x=list[0];desk.perform(x,t,'call');
 const s=desk.standing(x,t);
 const sum=s.field.reduce((n,f)=>n+f.odds,0);
 assert.ok(Math.abs(sum-1)<1e-9,'odds over the field sum to one');
 const best=Math.max(...s.field.map(f=>f.interest)),w=s.field.map(f=>Math.exp((f.interest-best)/7)),total=w.reduce((a,b)=>a+b,0);
 const mine=s.field.findIndex(f=>f.you);
 assert.ok(mine>=0);
 assert.ok(Math.abs(s.odds-w[mine]/total)<1e-9);
 assert.equal(s.rank,mine+1);
 assert.equal(s.decideChance,e.portalCommitChance(e.ensurePortalCycle().round));
});

test('a rival close to losing him counters, and answering takes its gain back',async()=>{
 const e=await setup(5105),{t,list}=openWithCandidate(e),desk=D();
 // Put the program within reach on every candidate and work them all, so some counters are certain.
 for(const x of list.slice(0,30)){desk.record(x);e.portalSetInterest(x,t.id,Math.max(...x.finalists.map(id=>x.interest[id]??0)));if(!x.finalists.includes(t.id))x.finalists.push(t.id);x.desk.call=e.ensurePortalCycle().round}
 e.advancePortalRound();
 const watch=desk.watch();
 assert.ok(watch.length>0,'rivals countered');
 const m=watch.find(w=>w.kind==='visit')||watch[0],x=e.portalEntry(m.candidateId);
 const theirs=x.interest[m.schoolId];
 if(m.kind==='visit'){e.targetPortalCandidate(x.candidateId,1);const r=desk.perform(x,t,'host');assert.equal(r.answered,1)}
 else{const r=desk.perform(x,t,'coach');assert.equal(r.answered,1)}
 assert.equal(x.interest[m.schoolId],Math.max(0,theirs-desk.RIVAL.gain),'their gain is taken back');
 assert.equal(desk.liveRivals(x).length,0);
 // Leave another unanswered: the next round costs you interest.
 const other=desk.watch()[0];
 if(other&&e.ensurePortalCycle().status==='open'){
  const y=e.portalEntry(other.candidateId),mineBefore=y.interest[t.id];
  const settled=desk.settleRound(t);
  assert.ok(settled.penalties>=1);
  assert.equal(y.interest[t.id],Math.max(0,mineBefore-desk.RIVAL.penalty*desk.liveRivals(y).filter(r=>r.round<e.ensurePortalCycle().round).length));
 }
});

test('the staff spend what is left: answers, calls, then good pitches',async()=>{
 const e=await setup(5106),{t,list}=openWithCandidate(e),desk=D();
 for(const x of list.slice(0,4))e.targetPortalCandidate(x.candidateId,1);
 const s=desk.staffPlan(t);
 assert.ok(s.calls>=1);
 assert.ok(desk.roundInfo(t).spent===s.hours&&s.hours<=desk.roundInfo(t).budget);
 assert.ok(list.slice(0,4).every(x=>x.desk?.hostRound==null&&x.desk?.coachRound==null),'no visit spent without a rival move to answer');
 e.advancePortalRound();
 desk.setAuto(true);
 e.advancePortalRound();
 assert.ok(e.ensurePortalCycle().log.some(l=>/Staff worked the portal/.test(l.message)),'auto mode works the portal before each round');
});

test('roster needs list positions below their designed depth',async()=>{
 const e=await setup(5107),desk=D(),t=me(e);
 const pos=Object.keys(e.POS_COUNTS)[0];
 const saved=t.roster;t.roster=t.roster.filter(p=>p.pos!==pos);
 const needs=desk.needs(t);t.roster=saved;
 assert.ok(needs.some(n=>n.pos===pos&&n.depth===0&&n.want===e.POS_COUNTS[pos]));
});

test('a portal nobody works resolves exactly as it did without the desk',async()=>{
 const run=async withoutDesk=>{
  const e=await setup(5108,{withoutDesk});
  e.openPortalCycle();while(e.ensurePortalCycle().status==='open')e.advancePortalRound();
  return JSON.stringify(e.portalCandidates().map(x=>[x.candidateId,x.decision,x.interest]));
 };
 assert.equal(await run(false),await run(true));
});

test('advancing the offseason honors the same commitments as Finalize, including the offered promise',async()=>{
 async function run(finalizeFirst){
  const e=await setup(5105),t=me(e);
  e.offseasonEnrollment();e.openPortalCycle();
  const entries=e.portalCandidates().filter(x=>e.portalFit(x,t));
  const pick=entries[0],id=pick.p.id;
  e.targetPortalCandidate(pick.candidateId,1);
  const promise='Early Role';
  assert.equal(e.promisePortalCandidate(pick.candidateId,promise),null);
  assert.equal(e.offerPortalNil(pick.candidateId),null);
  // Fix his finalist so the test exercises placement independently of winning the lottery.
  pick.finalists=[t.id];
  while(e.ensurePortalCycle().status==='open')e.advancePortalRound();
  const transfers=e.portalCandidates().map(x=>[x.p.id,x.decision.schoolId]);
  assert.equal(e.portalAttentionSpent(),0);
  if(finalizeFirst)e.resolvePortalCommitments();
  e.runOffseason();
  const player=t.roster.find(p=>p.id===id);
  assert.ok(player,'the chosen school lands its commit');
  assert.ok(player.promises.some(q=>q.schoolId===t.id&&q.seasonMade===e.universe.year));
  assert.ok(e.nilDealActive(player,t));
  const rosters=new Map(e.universe.teams.flatMap(team=>team.roster.map(p=>[p.id,team.id])));
  return {actual:transfers.map(([id])=>[id,rosters.get(id)]),report:e.universe.offseason.reports.portal};
 }
 assert.deepEqual(await run(false),await run(true));
});

test('staff nominate real vacancies from visible grades and delegate an empty board',async()=>{
 const e=await setup(5111),{t}=openWithCandidate(e),d=D();
 const s=d.shortlist(t);
 assert.ok(s&&s.options.length>=2&&s.options.length<=3);
 assert.ok(s.need.depth<s.need.want);
 const ids=s.options.map(o=>o.entry.candidateId);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(s.options.every(o=>o.entry.p.pos===s.need.pos&&o.entry.fromSchoolId!==t.id));
 assert.equal(e.portalAttentionSpent(),0,'previewing the shortlist costs nothing');
 for(const x of e.portalCandidates()){x.p.trueNow=1;x.p.upside=1}
 assert.deepEqual(d.shortlist(t).options.map(o=>o.entry.candidateId),ids,'hidden ratings never rank suggestions');
 d.setAuto(true);const plan=d.staffPlan(t);
 assert.ok(plan.calls>0);assert.ok(e.portalAttentionSpent()>0);
 for(const id of ids)assert.ok(e.portalTargetFor(id));
 assert.ok(e.portalAttentionSpent()<=e.PORTAL_ATTENTION_POOL);
});
