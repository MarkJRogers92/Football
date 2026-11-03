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

test('positions the pool never produces fall back to anonymous walk-ons',async()=>{
 const e=await setup(9703),t=e.universe.teams[0],pool=e.generateRecruitPool(400);
 assert.equal(pool.some(r=>r.pos==='K'||r.pos==='P'),false);
 assert.equal(e.takeLatePlayer(pool,t,'K','Nobody'),null);
 assert.equal(e.takeLatePlayer(pool,t,'P','Nobody'),null);
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
