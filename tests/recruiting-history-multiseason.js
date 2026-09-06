const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness.js');
const {makeScoutingReceiptSystem}=require('../scouting-receipts.js');
const {makeRecruitingHistorySystem}=require('../recruiting-history.js');

function rollSeason(e){
 const before=e.universe.year;
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 for(let step=0;step<20&&e.universe.year===before;step++){
  if(e.hasPendingCareerChoice()){
   const offer=(e.universe.jobOffers||[])[0];
   const res=offer?e.acceptPost(offer.schoolId):null;
   if(res&&res.ok===false)throw new Error(`could not clear career choice: ${res.reason}`);
  }
  const phase=e.normalizeOffseasonState().phase;
  if(phase==='spring')e.runSpringCamp();
  else if(phase==='fall')e.runFallCamp();
  e.runOffseason();
 }
 if(e.universe.year===before)throw new Error(`season did not advance past ${before}; phase=${e.normalizeOffseasonState().phase}`);
}

(async()=>{
 const e=loadEngine({seed:95454});
 await e.loadSchools();
 e.setUserTeam('Chicago Metropolitan');
 e.initUniverse();
 const team=()=>e.universe.teams.find(t=>t.name==='Chicago Metropolitan');
 const receipts=makeScoutingReceiptSystem({getUniverse:()=>e.universe,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const history=makeRecruitingHistorySystem({classifyPlayer:(p,year)=>receipts.classifyPlayer(p,year)});
 const signingYear=e.universe.year;
 let recruit=null;
 for(const candidate of e.universe.recruits.slice().sort((a,b)=>(a.nationalRank??9999)-(b.nationalRank??9999))){
  candidate.targeted=true;
  if(e.commitRecruit(candidate,team().name)){recruit=candidate;break}
 }
 assert.ok(recruit,'expected a generated recruit to commit to the controlled program');
 const verdict={score:68,label:'Developmental',conviction:'Medium',confidence:62,spread:10};
 const snap=receipts.freezeSigningReceipt(recruit,team(),verdict,{quick:true,full:false,receipts:[{cost:1}]});
 assert.ok(snap,'signing receipt should freeze after the real commit');
 assert.equal(snap.season,signingYear);
 assert.equal(snap.schoolId,team().id);
 for(const hidden of ['trueNow','upside','growthProfile'])assert.equal(Object.hasOwn(snap,hidden),false);

 // Drive the real calendar through the complete season/offseason. Enrollment assigns a new player id,
 // so the durable recruit -> player bridge is the receipt's recruitId.
 rollSeason(e);
 assert.equal(e.universe.year,signingYear+1,'first full season should advance exactly one year');
 let controlled=team();
 let player=controlled.roster.find(p=>p.recruitingMemory?.scoutingReceipt?.recruitId===recruit.id);
 assert.ok(player,`expected recruit id ${recruit.id} (${recruit.name}) to enroll with its signing receipt`);
 const trackedId=player.id;
 assert.deepEqual(player.recruitingMemory?.scoutingReceipt,snap,'enrollment must preserve the signing receipt');

 // One season of observed evidence should create a provisional watch result, not a final grade.
 player.perceived=Math.max(84,snap.currentRead+12);
 player.scoutConfidence=66;
 player.stats={...(player.stats||{}),games:7,starts:5};
 let pool=history.playerPool(controlled,e.universe.playerArchive||[]);
 let classes=history.history(pool,e.universe.year,controlled.id);
 let signingClass=classes.find(c=>c.season===signingYear);
 assert.ok(signingClass,'signing class should appear after enrollment');
 let tracked=signingClass.players.find(x=>x.p.id===trackedId);
 assert.ok(tracked,'enrolled player should appear in signing class history');
 assert.equal(tracked.result.final,false,'one-season evidence must remain provisional');
 assert.ok(['DIAMOND_WATCH','UP','TRACKING'].includes(tracked.result.code),`unexpected one-year result ${tracked.result.code}`);

 // Preserve observed first-year evidence, then force this test player to senior status and drive another
 // complete real season/offseason. The normal departures phase must archive the same player + receipt.
 player.seasonHistory??=[];
 player.seasonHistory.push({year:e.universe.year,games:7,starts:5,stats:{games:7,starts:5}});
 player.perceived=Math.max(90,snap.currentRead+18);
 player.scoutConfidence=86;
 player.year='SR';
 rollSeason(e);
 assert.equal(e.universe.year,signingYear+2,'second full season should advance exactly one more year');
 controlled=team();
 const archived=(e.universe.playerArchive||[]).find(p=>p.id===trackedId);
 assert.ok(archived,'normal senior departure should archive the tracked recruit');
 assert.deepEqual(archived.recruitingMemory?.scoutingReceipt,snap,'archive record must preserve the signing receipt');

 pool=history.playerPool(controlled,e.universe.playerArchive||[]);
 classes=history.history(pool,e.universe.year,controlled.id);
 signingClass=classes.find(c=>c.season===signingYear);
 assert.ok(signingClass,'historical class must remain visible after the player leaves the active roster');
 tracked=signingClass.players.find(x=>x.p.id===trackedId);
 assert.ok(tracked,'archived player must remain in the historical signing class');
 assert.equal(tracked.result.final,true,'two-season mature evidence should settle to a final scouting result');
 assert.ok(['DIAMOND','HIT','AS_SCOUTED','MISS','BUST'].includes(tracked.result.code),`unexpected mature result ${tracked.result.code}`);
 assert.equal(signingClass.signed>=1,true);
 assert.equal(signingClass.settled>=1,true);

 // Historical result must remain independent from hidden truth even after archive handoff.
 const before={code:tracked.result.code,delta:tracked.result.delta,label:tracked.result.label,settled:signingClass.settled,signed:signingClass.signed};
 archived.trueNow=25;archived.upside=30;archived.growthProfile='late';archived.growthVolatility=99;
 const afterClass=history.history(history.playerPool(controlled,e.universe.playerArchive||[]),e.universe.year,controlled.id).find(c=>c.season===signingYear);
 const afterTracked=afterClass.players.find(x=>x.p.id===trackedId);
 const after={code:afterTracked.result.code,delta:afterTracked.result.delta,label:afterTracked.result.label,settled:afterClass.settled,signed:afterClass.signed};
 assert.deepEqual(after,before,'hidden talent/development fields must not alter historical scouting results');
 console.log(`multi-season scouting history ok: ${recruit.name} ${signingYear} -> ${tracked.result.label} (${tracked.result.delta>=0?'+':''}${tracked.result.delta}), archived with receipt intact`);
})().catch(err=>{console.error(err);process.exitCode=1});
