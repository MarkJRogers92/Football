const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.29: about half of each recruit pool is never signed, and it is not the weak
// half. The walk-on top-up now draws on those named prospects before inventing anonymous
// walk-ons. These tests pin that contract.
async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 return e;
}
test('a late addition is a real prospect, best scouted grade first',async()=>{
 const e=await setup(9701),t=e.universe.teams[0],pool=e.generateRecruitPool(400);
 const wr=pool.filter(r=>r.pos==='WR').sort((a,b)=>b.scout-a.scout),before=pool.length;
 const p=e.takeLatePlayer(pool,t,'WR','Nobody');
 assert.equal(p.pos,'WR');assert.equal(p.year,'FR');assert.equal(p.lateAddition,true);
 assert.match(p.origin,/^Unsigned \d-star prospect from .* · late addition$/);
 assert.equal(pool.length,before-1,'the prospect leaves the pool');
 assert.ok(wr.slice(0,3).some(r=>r.name===p.name),'chosen from the three best-graded at the position');
 assert.equal(p.trueNow,wr.find(r=>r.name===p.name).trueNow,'keeps the prospect\'s real ability');
});

test('the controlled program gets its own target ahead of better-graded prospects',async()=>{
 const e=await setup(9702),t=e.universe.teams.find(x=>x.name==='Chicago Metropolitan'),pool=e.generateRecruitPool(400);
 const wr=pool.filter(r=>r.pos==='WR').sort((a,b)=>b.scout-a.scout),target=wr.at(-1);target.targeted=true;
 assert.equal(e.takeLatePlayer(pool,t,'WR',t.name).name,target.name);
 const other=e.universe.teams.find(x=>x.name!==t.name);
 assert.notEqual(e.takeLatePlayer(pool,other,'WR',t.name).name,target.name,'AI programs ignore the controlled program\'s board');
});

test('the pool recruits specialists, and a position with no prospect falls back to an anonymous walk-on',async()=>{
 const e=await setup(9703),t=e.universe.teams[0],pool=e.generateRecruitPool(1000);
 const k=pool.filter(r=>r.pos==='K'),p=pool.filter(r=>r.pos==='P');
 assert.ok(k.length>=25&&p.length>=25,`one K and one P per 31 prospects, got ${k.length} K and ${p.length} P`);
 assert.ok(k.concat(p).every(r=>r.stars<=3&&r.trueNow<=71),'specialists are three stars at most');
 const bare=pool.filter(r=>r.pos!=='K');
 assert.equal(e.takeLatePlayer(bare,t,'K','Nobody'),null,'no kicker left: the caller generates a walk-on');
 assert.equal(e.takeLatePlayer(pool,t,'K','Nobody').pos,'K','a kicker is available from a pool that has them');
});

test('the offseason top-up fills a position gap from the unsigned pool',async()=>{
 const e=await setup(9704),u=e.universe,t=u.teams[0];
 u.recruits=e.generateRecruitPool(400);const pool=new Set(u.recruits.map(r=>r.name));
 t.roster=t.roster.filter(p=>p.pos!=='WR').slice(0,80);
 u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'preseason');u.offseason.completed.push('spring','fall');
 e.offseasonPreseason();
 assert.equal(t.roster.length,85);
 const late=t.roster.filter(p=>p.lateAddition);
 assert.ok(late.length>=1,'at least one WR gap is filled by a named prospect');
 assert.ok(late.every(p=>p.pos==='WR'&&pool.has(p.name)),'every late addition came from the old pool');
 assert.ok(u.lateMarket.placed>=late.length&&u.lateMarket.pool===400);
 assert.equal(u.lateMarket.year,u.year);
});

// v0.12.29: class sizes echoed through the roster (12, 23, 23, 12 ...). The capacity is
// now blended toward a steady-state class, so a thin or fat senior class moves it halfway.
test('scholarship capacity is damped toward the steady-state class',async()=>{
 const e=await setup(9705),t=e.universe.teams[0];
 t.roster.forEach(p=>{p.eligibilityUsed=0;p.redshirtUsed=false});
 assert.equal(e.scholarshipCapacity(t),14,'a roster with no seniors used to floor at 12; it now floors at 14');
 t.roster.forEach(p=>{p.eligibilityUsed=3});
 assert.equal(e.scholarshipCapacity(t),25,'an all-senior roster is still capped at 25');
 const mid=t.roster.length-Math.round(.25*t.roster.length);
 t.roster.forEach((p,i)=>{p.eligibilityUsed=i<mid?0:3});
 const cap=e.scholarshipCapacity(t);
 assert.ok(cap>=14&&cap<=25);
});

// A pool of 6000 with every program completely full (over-sign room included) of commits, plus exactly
// `elites` unsigned prospects at the given star levels.
function fullLeague(e,fillStars,elites){
 const u=e.universe;u.recruitClassCounts={};
 const pool=e.generateRecruitPool(6000),fill=pool.filter(r=>fillStars.includes(r.stars)),top=[];for(const st of elites)top.push(pool.find(r=>r.stars===st&&!top.includes(r)));
 u.recruits=fill.concat(top);
 for(const t of u.teams){
  while(e.canTakeCommit(t.name)){const r=fill.pop();if(!r)throw new Error('ran out of fill prospects');e.commitRecruit(r,t.name)}
 }
 return top;
}

test('an unsigned elite displaces a weaker commit at a program that wants him',async()=>{
 const e=await setup(9706),u=e.universe,controlled='Chicago Metropolitan';
 const elites=fullLeague(e,[1,2],[5,5,4,4,4]);
 assert.equal(elites.length,5);assert.ok(elites.every(r=>!r.committed));
 const sizes=Object.fromEntries(u.teams.map(t=>[t.name,e.classCommitCount(t.name)]));
 const userCommits=u.recruits.filter(r=>r.committed===controlled).map(r=>r.id);
 const out=e.placeUnsignedElites();
 assert.deepEqual(out,{placed:5,displaced:5},'every program was full, so each placement displaced someone');
 assert.ok(elites.every(r=>r.committed),'all five elites are signed');
 for(const t of u.teams)assert.equal(e.classCommitCount(t.name),sizes[t.name],`${t.name} class size is unchanged`);
 assert.ok(userCommits.every(id=>u.recruits.find(r=>r.id===id).committed===controlled),'the controlled program keeps every commit');
 const bumped=u.recruits.filter(r=>r.flippedFrom&&!r.committed);
 assert.equal(bumped.length,5);assert.ok(bumped.every(r=>r.stars<=2),'displaced prospects are the low-star ones');
});

test('no displacement when the weakest commit is within a star of the elite',async()=>{
 const e=await setup(9707),u=e.universe;
 const [elite]=fullLeague(e,[3],[4]);
 const out=e.placeUnsignedElites();
 assert.deepEqual(out,{placed:0,displaced:0},'a 4-star will not bump a 3-star');
 assert.equal(elite.committed,null,'he stays unsigned, on the late market');
});

test('no program is displaced more than three times in one signing day',async()=>{
 const e=await setup(9708),u=e.universe;
 const elites=fullLeague(e,[1,2],Array(40).fill(5));
 const before=Object.fromEntries(u.teams.map(t=>[t.name,u.recruits.filter(r=>r.committed===t.name).map(r=>r.id)]));
 e.placeUnsignedElites();
 for(const t of u.teams){
  const lost=before[t.name].filter(id=>!u.recruits.find(r=>r.id===id).committed).length;
  assert.ok(lost<=3,`${t.name} lost ${lost}`);
 }
 assert.ok(elites.every(r=>r.committed),'forty elites fit under the cap');
});
