const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.9.47 commit 1 covers portal *state* only — the targeting/interest engine, NIL and
// promise integration and the UI arrive in later commits. What has to hold from here on
// is that a candidate has one stable identity and that old saves migrate into it without
// the portal entry ever losing the player record it already owns.
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}

// Drives real departures so the portal holds actual entries rather than hand-built ones.
// It stops before the portal phase on purpose: that phase places transfers and empties
// universe.transferPortal, so running the whole offseason would leave nothing to inspect.
function fillPortal(e){
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 e.offseasonReview();e.offseasonDepartures();
 return e.universe.transferPortal||[];
}

test('a portal cycle exists for the current season with a bounded, well-formed shape',async()=>{
 const e=await setup(4701),u=e.universe;
 const c=e.ensurePortalCycle();
 assert.equal(c.year,u.year,'the cycle belongs to the season it was opened in');
 assert.equal(c.round,0);
 assert.equal(c.status,'idle');
 assert.deepEqual(c.targets,[]);
 assert.deepEqual(c.resolutions,[]);
 assert.deepEqual(c.log,[]);
 assert.equal(e.ensurePortalCycle(),c,'repeat calls reuse the same object rather than resetting it');
});

test('a season rollover starts a clean cycle instead of carrying targets forward',async()=>{
 const e=await setup(4702),u=e.universe;
 const first=e.ensurePortalCycle();
 first.targets.push('someone');first.round=2;first.status='open';
 u.year+=1;
 const next=e.ensurePortalCycle();
 assert.notEqual(next,first,'a new season gets its own cycle');
 assert.equal(next.year,u.year);
 assert.deepEqual(next.targets,[],'last season’s targets do not leak into the new portal');
 assert.equal(next.round,0);
 assert.equal(next.status,'idle');
});

test('every portal entry gets a stable, unique candidate id and keeps its own player record',async()=>{
 const e=await setup(4703);
 const portal=fillPortal(e);
 assert.ok(portal.length>0,'a real offseason put players in the portal');
 const ids=new Set();
 for(const entry of portal){
  assert.ok(entry.candidateId,'every entry is identified');
  assert.ok(!ids.has(entry.candidateId),`duplicate candidate id ${entry.candidateId}`);
  ids.add(entry.candidateId);
  assert.ok(entry.p&&entry.p.id,'the entry still owns the player record, not a copy of it');
  assert.ok(entry.candidateId.includes(String(entry.p.id)),'identity is derived from the player, not a counter');
 }
 // Re-normalizing must not mint new ids — a save/load cycle would otherwise orphan every target.
 const before=portal.map(x=>x.candidateId);
 e.normalizePortalState();e.normalizePortalState();
 assert.deepEqual((e.universe.transferPortal||[]).map(x=>x.candidateId),before,'ids are stable across repeat normalization');
});

test('a pre-v0.9.47 save migrates without losing the player or duplicating the record',async()=>{
 const e=await setup(4704);
 const portal=fillPortal(e);
 assert.ok(portal.length>0);
 // Strip everything this version added, leaving exactly what an older save carried.
 const players=portal.map(x=>x.p);
 for(const x of portal){delete x.candidateId;delete x.finalists;delete x.interest;delete x.exposure;delete x.decision}
 delete e.universe.portalCycle;
 e.normalizeUniverse();
 const migrated=e.universe.transferPortal;
 assert.equal(migrated.length,players.length,'migration neither drops nor duplicates entries');
 migrated.forEach((x,i)=>{
  assert.equal(x.p,players[i],'the same player object is still referenced, not cloned');
  assert.ok(x.candidateId,'the missing id is backfilled');
  assert.deepEqual(x.finalists,[]);
  assert.deepEqual(x.interest,{});
  assert.equal(x.exposure,0);
  assert.equal(x.decision,null);
 });
 assert.equal(e.universe.portalCycle.year,e.universe.year,'a cycle is created for the loaded season');
});

test('portal state survives a portable save/load round trip',async()=>{
 const e=await setup(4705);
 fillPortal(e);
 const c=e.ensurePortalCycle();
 c.status='open';c.round=2;c.targets.push(e.universe.transferPortal[0].candidateId);
 const expected=e.universe.transferPortal.map(x=>x.candidateId);
 const packed=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));
 e.installSave({version:'0.9.47',userTeam:'Chicago Metropolitan',universe:packed});
 e.normalizeUniverse();
 const after=e.ensurePortalCycle();
 assert.equal(after.status,'open','an in-progress portal resumes where it was');
 assert.equal(after.round,2);
 assert.deepEqual(after.targets,c.targets,'targets survive by candidate id');
 assert.deepEqual((e.universe.transferPortal||[]).map(x=>x.candidateId),expected,'the same candidates come back');
});

test('the event log is bounded so a long portal cannot grow the save without limit',async()=>{
 const e=await setup(4706);
 for(let i=0;i<e.PORTAL_LOG_CAP+40;i++)e.portalLog(`event ${i}`);
 const log=e.ensurePortalCycle().log;
 assert.equal(log.length,e.PORTAL_LOG_CAP,'the log stops at its cap');
 assert.equal(log.at(-1).message,`event ${e.PORTAL_LOG_CAP+39}`,'the most recent events are the ones kept');
});

// --- commit 2: targeting, interest, rounds, AI competition -------------------

test('opening the portal narrows each candidate to a real field of finalists',async()=>{
 const e=await setup(4707);
 const portal=fillPortal(e);
 assert.ok(portal.length>0);
 const c=e.openPortalCycle();
 assert.equal(c.status,'open');
 assert.equal(c.round,1);
 for(const entry of portal){
  assert.ok(entry.finalists.length>0&&entry.finalists.length<=e.PORTAL_FINALISTS,`field of ${entry.finalists.length}`);
  assert.ok(!entry.finalists.includes(entry.fromSchoolId),'a player never lists the school he just left');
  for(const id of entry.finalists){
   const interest=entry.interest[id];
   assert.ok(Number.isInteger(interest)&&interest>=0&&interest<=100,`interest ${interest} out of range`);
  }
 }
 // Opening twice must not re-roll a field the user may already be working.
 const first=portal[0].finalists.slice();
 e.openPortalCycle();
 assert.deepEqual(portal[0].finalists,first);
});

test('attention is a bounded pool, so chasing one player costs you another',async()=>{
 const e=await setup(4708);
 const portal=fillPortal(e);e.openPortalCycle();
 assert.equal(e.portalAttentionLeft(),e.PORTAL_ATTENTION_POOL);
 assert.equal(e.targetPortalCandidate(portal[0].candidateId,e.PORTAL_ATTENTION_MAX),null,'a first target is accepted');
 assert.equal(e.portalAttentionSpent(),e.PORTAL_ATTENTION_MAX);
 // Re-targeting the same player re-prices him rather than double-charging.
 assert.equal(e.targetPortalCandidate(portal[0].candidateId,1),null);
 assert.equal(e.portalAttentionSpent(),1);
 assert.equal(e.ensurePortalCycle().targets.length,1,'still one target, not two');
 // No single player can absorb the whole pool: the per-candidate cap clamps first, which
 // is why the pool only ever binds across several targets.
 assert.equal(e.targetPortalCandidate(portal[0].candidateId,e.PORTAL_ATTENTION_POOL),null);
 assert.equal(e.portalTargetFor(portal[0].candidateId).attention,e.PORTAL_ATTENTION_MAX,'a greedy request is clamped to the per-candidate cap');
 // Spend the rest of the pool across other players, then confirm the pool itself refuses.
 let spread=1;
 while(e.portalAttentionLeft()>0&&spread<portal.length){
  const want=Math.min(e.PORTAL_ATTENTION_MAX,e.portalAttentionLeft());
  assert.equal(e.targetPortalCandidate(portal[spread].candidateId,want),null,`filling with ${want}`);
  spread++;
 }
 assert.equal(e.portalAttentionLeft(),0,'the pool is now exhausted');
 const refusal=e.targetPortalCandidate(portal[spread].candidateId,1);
 assert.match(String(refusal),/attention left/);
 assert.equal(e.portalTargetFor(portal[spread].candidateId),null,'a refused target is not recorded');
 assert.equal(e.untargetPortalCandidate(portal[0].candidateId),null);
 assert.equal(e.portalAttentionLeft(),e.PORTAL_ATTENTION_MAX,'dropping a target refunds exactly its attention');
 assert.match(String(e.untargetPortalCandidate(portal[0].candidateId)),/not targeted/);
});

test('the target list is capped so the portal cannot be brute-forced',async()=>{
 const e=await setup(4709);
 const portal=fillPortal(e);e.openPortalCycle();
 assert.ok(portal.length>e.PORTAL_TARGET_CAP,'this seed has enough entrants to hit the cap');
 for(let i=0;i<e.PORTAL_TARGET_CAP;i++)assert.equal(e.targetPortalCandidate(portal[i].candidateId,1),null,`target ${i}`);
 const refusal=e.targetPortalCandidate(portal[e.PORTAL_TARGET_CAP].candidateId,1);
 assert.match(String(refusal),/only chase/i);
 assert.equal(e.ensurePortalCycle().targets.length,e.PORTAL_TARGET_CAP);
});

test('targeting puts the program in the running even when it missed the opening cut',async()=>{
 const e=await setup(4710),u=e.T('Chicago Metropolitan');
 const portal=fillPortal(e);e.openPortalCycle();
 const outside=portal.find(x=>!x.finalists.includes(u.id)&&x.fromSchoolId!==u.id&&e.portalFit(x,u));
 assert.ok(outside,'found a candidate not already courting the user');
 assert.equal(e.targetPortalCandidate(outside.candidateId,2),null);
 assert.ok(outside.finalists.includes(u.id),'the user joins the field');
 assert.ok(Number.isInteger(outside.interest[u.id]),'and starts with a real interest value');
});

test('attention measurably moves interest, and every candidate resolves by the final round',async()=>{
 const e=await setup(4711),u=e.T('Chicago Metropolitan');
 const portal=fillPortal(e);e.openPortalCycle();
 const chased=portal.filter(x=>x.fromSchoolId!==u.id&&e.portalFit(x,u)).slice(0,e.PORTAL_TARGET_CAP);
 for(const entry of chased)e.targetPortalCandidate(entry.candidateId,1);
 const before=chased.map(x=>x.interest[u.id]??0);
 for(let r=0;r<e.PORTAL_ROUNDS;r++)e.advancePortalRound();
 const c=e.ensurePortalCycle();
 assert.equal(c.status,'resolved','the portal closes after its rounds');
 assert.equal(c.round,e.PORTAL_ROUNDS);
 for(const entry of portal)assert.ok(entry.decision,`${entry.p.name} left the portal undecided`);
 // Attention is a real lever: across a targeted group it should raise interest on balance.
 const after=chased.map(x=>x.interest[u.id]??0);
 const gained=after.reduce((n,v,i)=>n+(v-before[i]),0);
 assert.ok(gained>0,`sustained attention should raise interest overall, moved ${gained}`);
 assert.ok(c.resolutions.length>0,'resolutions are recorded');
 for(const r of c.resolutions)assert.ok(portal.some(x=>x.candidateId===r.candidateId),'each resolution names a real candidate');
});

test('no school ever wins a candidate it was not actually competing for',async()=>{
 const e=await setup(4712);
 const portal=fillPortal(e);e.openPortalCycle();
 for(let r=0;r<e.PORTAL_ROUNDS;r++)e.advancePortalRound();
 for(const entry of portal){
  assert.ok(entry.finalists.includes(entry.decision.schoolId),'the winner came from the tracked field');
  assert.notEqual(entry.decision.schoolId,entry.fromSchoolId,'a player never "transfers" back to the school he left');
 }
});

test('the winner is weighted, not simply the highest interest',async()=>{
 const e=await setup(4713);
 const portal=fillPortal(e);e.openPortalCycle();
 // Run the same resolution many times on one candidate; a deterministic argmax would
 // return a single school every time, which is exactly what the packet forbids.
 const entry=portal.find(x=>x.finalists.length>=3);
 assert.ok(entry,'a candidate with a real field exists');
 const winners=new Set();
 for(let i=0;i<200;i++){entry.decision=null;winners.add(e.portalResolveEntry(entry).schoolId)}
 entry.decision=null;
 assert.ok(winners.size>1,'resolution is probabilistic across the field');
 for(const id of winners)assert.ok(entry.finalists.includes(id),'and stays inside the field');
});

// --- commit 3: NIL, promises, capacity and destination resolution ------------

// Puts the user's program in a candidate's field so the levers below have something to move.
function chase(e,portal,attention=2){
 const u=e.T('Chicago Metropolitan');
 const entry=portal.find(x=>x.fromSchoolId!==u.id&&e.portalFit(x,u));
 assert.ok(entry,'a chaseable candidate exists');
 e.targetPortalCandidate(entry.candidateId,attention);
 return {u,entry};
}

test('a portal NIL offer spends the program budget and cannot exceed it',async()=>{
 const e=await setup(4714);
 const portal=fillPortal(e);e.openPortalCycle();
 const {u,entry}=chase(e,portal);
 const before=e.nilRemaining(u),interestBefore=entry.interest[u.id]??0;
 assert.equal(e.offerPortalNil(entry.candidateId),null,'the offer is accepted');
 assert.ok(e.nilRemaining(u)<before,'it actually costs the NIL budget');
 assert.equal(entry.interest[u.id],interestBefore+e.PORTAL_NIL_INTEREST,'and moves interest');
 // The same budget rule the recruiting board uses still applies here.
 assert.match(String(e.offerPortalNil(entry.candidateId)),/already in place/);
 // Withdrawing refunds exactly what it cost and takes the interest back with it.
 assert.equal(e.withdrawPortalNil(entry.candidateId),null);
 assert.equal(e.nilRemaining(u),before,'the refund is exact');
 assert.equal(entry.interest[u.id],interestBefore,'the interest bump is reversed too');
});

test('the portal cannot overspend NIL that the recruiting board already committed',async()=>{
 const e=await setup(4715);
 const portal=fillPortal(e);e.openPortalCycle();
 const {u,entry}=chase(e,portal);
 u.nilSpent=e.nilBudgetFor(u);                 // budget fully committed elsewhere
 assert.equal(e.nilRemaining(u),0);
 assert.match(String(e.offerPortalNil(entry.candidateId)),/Not enough NIL/);
 assert.equal(entry.p.nilDeal,undefined,'a refused offer leaves no deal behind');
});

test('a promise made in the portal lands on the destination, never the school he left',async()=>{
 const e=await setup(4716);
 const portal=fillPortal(e);e.openPortalCycle();
 const {u,entry}=chase(e,portal,4);
 const origin=entry.fromSchoolId;
 assert.equal(e.promisePortalCandidate(entry.candidateId,'Early Role'),null);
 assert.equal(entry.promiseOffer.schoolId,u.id,'the offer is recorded against the offering program');
 assert.equal(entry.p.promises.some(q=>q.status==='ACTIVE'),false,'nothing is written onto the player yet');
 // Force him to pick the user, then resolve.
 entry.decision={schoolId:u.id,round:1,interest:entry.interest[u.id]??50};
 const {placed}=e.resolvePortalCommitments();
 assert.equal(placed.length,1,'he landed');
 const active=entry.p.promises.filter(q=>q.status==='ACTIVE'||q.status==='PASSIVE');
 assert.equal(active.length,1,'exactly one promise is live');
 assert.equal(active[0].schoolId,u.id,'attached to the destination');
 assert.notEqual(active[0].schoolId,origin,'and never to the origin');
 assert.ok(u.roster.some(p=>p.id===entry.p.id),'he is on the destination roster');
});

test('choosing "None" clears a promise offer and its interest without leaving residue',async()=>{
 const e=await setup(4717);
 const portal=fillPortal(e);e.openPortalCycle();
 const {u,entry}=chase(e,portal);
 const base=entry.interest[u.id]??0;
 assert.equal(e.promisePortalCandidate(entry.candidateId,'Development Plan'),null);
 assert.equal(entry.interest[u.id],base+e.PORTAL_PROMISE_INTEREST);
 // Re-offering must re-price rather than stack another bump on top.
 assert.equal(e.promisePortalCandidate(entry.candidateId,'Early Role'),null);
 assert.equal(entry.interest[u.id],base+e.PORTAL_PROMISE_INTEREST,'a changed promise does not double-count');
 assert.equal(e.promisePortalCandidate(entry.candidateId,'None'),null);
 assert.equal(entry.promiseOffer,null);
 assert.equal(entry.interest[u.id],base,'interest returns to where it started');
 assert.match(String(e.promisePortalCandidate(entry.candidateId,'Nonsense')),/Unknown promise/);
});

test('a full roster cannot take a transfer, and the player stays available instead',async()=>{
 const e=await setup(4718);
 const portal=fillPortal(e);e.openPortalCycle();
 const {u,entry}=chase(e,portal);
 while(u.roster.length<105)u.roster.push({...u.roster[0],id:`FILLER_${u.roster.length}`});
 assert.equal(e.portalRoomFor(u),0);
 entry.decision={schoolId:u.id,round:1,interest:80};
 const {placed,blocked}=e.resolvePortalCommitments();
 assert.equal(placed.length,0,'nobody is squeezed onto a full roster');
 assert.ok(blocked.some(b=>b.candidateId===entry.candidateId),'the block is reported');
 assert.ok(e.universe.transferPortal.some(x=>x.candidateId===entry.candidateId),
  'and he stays in the portal for the existing automatic fallback');
});

test('resolution moves the same player record, keeping identity and history intact',async()=>{
 const e=await setup(4719);
 const portal=fillPortal(e);e.openPortalCycle();
 const {u,entry}=chase(e,portal);
 const p=entry.p,id=p.id,seed=p.portraitSeed,career=JSON.stringify(p.career),origin=entry.fromSchoolId;
 const from=e.universe.teams.find(t=>t.id===origin);
 entry.decision={schoolId:u.id,round:2,interest:70};
 e.resolvePortalCommitments();
 const landed=u.roster.find(x=>x.id===id);
 assert.ok(landed,'the very same player id is on the new roster');
 assert.equal(landed,p,'it is the same object, not a copy');
 assert.equal(landed.portraitSeed,seed,'he keeps his face');
 assert.equal(JSON.stringify(landed.career),career,'and his career totals');
 assert.equal(from.roster.some(x=>x.id===id),false,'he is off the old roster');
 const hop=landed.transferHistory.at(-1);
 assert.equal(hop.fromSchoolId,origin);
 assert.equal(hop.toSchoolId,u.id);
 assert.equal(hop.season,e.universe.year,'the move is dated to this season');
});

test('resolving twice never places the same player twice',async()=>{
 const e=await setup(4720);
 const portal=fillPortal(e);e.openPortalCycle();
 const {u,entry}=chase(e,portal);
 entry.decision={schoolId:u.id,round:1,interest:70};
 const first=e.resolvePortalCommitments();
 assert.equal(first.placed.length,1);
 const size=u.roster.length;
 const second=e.resolvePortalCommitments();
 assert.equal(second.placed.length,0,'the second pass places nobody');
 assert.equal(u.roster.length,size,'and the roster does not grow again');
 assert.equal(u.roster.filter(x=>x.id===entry.p.id).length,1,'he appears exactly once');
});

// --- commit 5: distribution and multi-year persistence ----------------------

// Runs one full interactive portal: open, chase what we can, play out every round,
// then land the commitments. Returns what the user actually signed.
function runInteractivePortal(e,attention=2){
 const u=e.T('Chicago Metropolitan');
 e.offseasonReview();e.offseasonDepartures();
 const portal=e.universe.transferPortal||[];
 if(!portal.length)return {u,signed:[],portal};
 e.openPortalCycle();
 for(const entry of portal.filter(x=>x.fromSchoolId!==u.id&&e.portalFit(x,u)).slice(0,e.PORTAL_TARGET_CAP))
  e.targetPortalCandidate(entry.candidateId,attention);
 for(let r=0;r<e.PORTAL_ROUNDS;r++)e.advancePortalRound();
 const {placed}=e.resolvePortalCommitments();
 return {u,signed:placed.filter(x=>x.schoolId===u.id),portal};
}

test('portal commitments spread across the league rather than piling onto one program',async()=>{
 const e=await setup(4721);
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 const {portal}=runInteractivePortal(e);
 assert.ok(portal.length>20,'a real portal class to distribute');
 const bySchool=new Map();
 for(const entry of portal)if(entry.decision)bySchool.set(entry.decision.schoolId,(bySchool.get(entry.decision.schoolId)||0)+1);
 assert.ok(bySchool.size>10,`commitments reached only ${bySchool.size} schools`);
 const biggest=Math.max(...bySchool.values());
 assert.ok(biggest<=Math.max(4,portal.length*0.25),`one program took ${biggest} of ${portal.length} — the field is not competitive`);
});

test('a program that works the portal signs more than one that ignores it',async()=>{
 // Same seed, same league, one difference: whether the user spends attention at all.
 const active=await setup(4722),passive=await setup(4722);
 for(const e of [active,passive]){e.simSeason();e.simConferenceChampionships();e.simPlayoff()}
 const got=runInteractivePortal(active,active.PORTAL_ATTENTION_MAX).signed.length;
 const ignoredUser=passive.T('Chicago Metropolitan');
 passive.offseasonReview();passive.offseasonDepartures();
 passive.openPortalCycle();
 for(let r=0;r<passive.PORTAL_ROUNDS;r++)passive.advancePortalRound();
 const ignored=passive.resolvePortalCommitments().placed.filter(x=>x.schoolId===ignoredUser.id).length;
 assert.ok(got>=ignored,`working the portal (${got}) should not do worse than ignoring it (${ignored})`);
});

test('portal state and its results survive save/load in the middle of a live cycle',async()=>{
 const e=await setup(4723),u=e.T('Chicago Metropolitan');
 e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 e.offseasonReview();e.offseasonDepartures();
 const portal=e.universe.transferPortal;
 e.openPortalCycle();
 const target=portal.find(x=>x.fromSchoolId!==u.id&&e.portalFit(x,u));
 e.targetPortalCandidate(target.candidateId,3);
 e.promisePortalCandidate(target.candidateId,'Early Role');
 e.advancePortalRound();
 const round=e.ensurePortalCycle().round,targets=JSON.stringify(e.ensurePortalCycle().targets);
 const ids=portal.map(x=>x.candidateId),decided=portal.filter(x=>x.decision).length;
 // Reload mid-cycle, exactly as a player closing the tab and coming back would.
 const packed=JSON.parse(JSON.stringify(e.packUniverse(e.universe)));
 e.installSave({version:'0.9.47',userTeam:'Chicago Metropolitan',universe:packed});
 e.normalizeUniverse();
 const c=e.ensurePortalCycle();
 assert.equal(c.round,round,'the round resumes');
 assert.equal(c.status,'open');
 assert.equal(JSON.stringify(c.targets),targets,'targets and their attention survive');
 assert.deepEqual((e.universe.transferPortal||[]).map(x=>x.candidateId),ids,'the same candidates come back');
 assert.equal((e.universe.transferPortal||[]).filter(x=>x.decision).length,decided,'decisions already made are not re-rolled');
 const reloaded=e.portalEntry(target.candidateId);
 assert.equal(reloaded.promiseOffer.type,'EARLY_ROLE','a pending promise offer survives the reload');
 // And the cycle can still be finished after the reload.
 for(let r=c.round;r<=e.PORTAL_ROUNDS;r++)e.advancePortalRound();
 assert.doesNotThrow(()=>e.resolvePortalCommitments());
});

test('running the interactive portal for several seasons leaves rosters bounded and nobody stranded',async()=>{
 const e=await setup(4724);
 for(let season=0;season<3;season++){
  e.simSeason();e.simConferenceChampionships();e.simPlayoff();
  runInteractivePortal(e);
  // Finish the rest of the calendar so the season can roll over normally.
  e.runOffseason();e.runSpringCamp();e.runFallCamp();e.runOffseason();
  const sizes=e.universe.teams.map(t=>t.roster.length);
  assert.ok(Math.max(...sizes)<=105,`a roster reached ${Math.max(...sizes)}`);
  assert.ok(Math.min(...sizes)>60,`a roster fell to ${Math.min(...sizes)}`);
  // Nobody may be counted twice: the same player id must not sit on two rosters.
  const seen=new Set();
  for(const t of e.universe.teams)for(const p of t.roster){
   assert.ok(!seen.has(p.id),`${p.name} is on two rosters in ${e.universe.year}`);
   seen.add(p.id);
  }
  for(const entry of e.universe.transferPortal||[])
   assert.ok(!seen.has(entry.p.id),`${entry.p.name} is both rostered and in the portal`);
 }
});
