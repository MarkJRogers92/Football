const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');
async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const toSigning=e=>{for(let i=0;i<12;i++)e.simWeek();e.simConferenceChampionships();e.simBowls();e.simPlayoff()};

test('signing day builds a board from exactly the contested commitments',async()=>{
 const e=await setup(2601),u=e.universe;
 const contested=u.recruits.filter(r=>r.committed&&r.challenger&&(r.pressure||0)>-14).length;
 toSigning(e);
 const s=u.signingDay;
 assert.ok(s,'a board exists after signing day');
 assert.equal(s.year,u.year);
 assert.ok(s.board.length<=12,'the board is capped so it stays watchable');
 if(contested)assert.ok(s.board.length>0,'contested commitments produce a board');
 for(const x of s.board){
  assert.ok(x.stars>=1&&x.name&&x.pos);
  assert.notEqual(x.from,x.challenger,'a recruit is never contested by his own school');
  assert.ok(x.odds>=2&&x.odds<=62,'the published odds match the model bounds');
 }
 // Highest pressure is announced first — the board is sorted by how contested it was.
 for(let i=1;i<s.board.length;i++)assert.ok(s.board[i-1].pressure>=s.board[i].pressure);
});

test('a flip actually moves the recruit and is recorded as one',async()=>{
 const e=await setup(2602),u=e.universe;
 toSigning(e);
 const s=u.signingDay;
 for(const x of s.board){
  const r=u.recruits.find(y=>y.id===x.recruitId);
  assert.equal(r.committed,x.flipped?x.challenger:x.from,
   `${x.name} ends up where the board says he does`);
 }
 const flips=s.board.filter(x=>x.flipped);
 for(const f of flips){
  const log=(u.decommitLog||[]).find(l=>l.id===f.recruitId&&l.reason==='SIGNING_DAY_FLIP');
  assert.ok(log,`${f.name}'s flip is on the decommit log`);
  assert.equal(log.from,f.from);
  assert.equal(log.to,f.challenger,'and names where he went, not just that he left');
 }
});

test('odds respond to pressure, loyalty and a signed promise',async()=>{
 const e=await setup(2603);
 const base={pressure:0,relationship:50,signedPromise:null};
 const hot={...base,pressure:30},cold={...base,pressure:-12};
 assert.ok(e.signingDayOdds(hot)>e.signingDayOdds(cold),'more pressure, more risk');
 assert.ok(e.signingDayOdds({...base,relationship:95})<e.signingDayOdds({...base,relationship:5}),
  'a strong relationship holds him');
 assert.ok(e.signingDayOdds({...base,signedPromise:{}})<e.signingDayOdds(base),
  'a signed promise holds him');
 for(const r of [hot,cold,base,{pressure:999,relationship:0}]){
  const o=e.signingDayOdds(r);
  assert.ok(o>=.02&&o<=.62,`odds stay bounded (${o})`);
 }
});

test('revealing is presentation only and never changes an outcome',async()=>{
 const e=await setup(2604),u=e.universe;
 toSigning(e);
 const s=u.signingDay;
 if(!s.board.length)return;
 const before=JSON.stringify(s.board);
 assert.equal(s.revealed,0,'nothing is announced until the player asks');
 assert.equal(e.signingDayPending(),s.board.length);
 const first=e.revealNextSigning();
 assert.equal(first,s.board[0]);
 assert.equal(s.revealed,1);
 assert.equal(e.signingDayPending(),s.board.length-1);
 const rest=e.revealAllSigning();
 assert.equal(rest.length,s.board.length-1);
 assert.equal(e.signingDayPending(),0);
 assert.equal(e.revealNextSigning(),null,'there is nothing left to announce');
 assert.equal(JSON.stringify(s.board),before,'revealing changed no outcome');
});

test('the wire pushes signing day hard, then stops once it is over',async()=>{
 const e=await setup(2605),u=e.universe,me=e.T('Chicago Metropolitan');
 toSigning(e);
 if(!u.signingDay.board.length)return;
 const tiles=e.signingDayHubItems();
 assert.equal(tiles.length,1);
 assert.equal(tiles[0].importance,84);
 assert.ok(tiles[0].main.includes(String(u.signingDay.board.length)));
 e.revealAllSigning();
 assert.equal(e.signingDayHubItems().length,0,'and it goes quiet once every name is in');
});
