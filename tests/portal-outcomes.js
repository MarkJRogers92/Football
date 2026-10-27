const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

// v0.12.22: every portal entrant used to land somewhere. A program now needs room
// AND a reason, and an entrant nobody wants either returns to his school or leaves.
async function setup(seed){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 return e;
}
function readyForPortal(e){
 const u=e.universe;
 u.phase='complete';u.offseason=e.makeOffseasonState(u.year,'review');
 for(const team of u.teams){team.w=8;team.l=4;team.adminConfidence=90}
 e.offseasonReview();e.offseasonDepartures();e.offseasonEnrollment();
 assert.ok((u.transferPortal||[]).length>0,'departures create portal entrants');
 return u;
}

test('a destination needs a reason, not just roster room',async()=>{
 const e=await setup(9701),u=readyForPortal(e);
 const deep=u.teams[0],p={...deep.roster.find(x=>x.pos==='LB'),trueNow:35,perceived:34};
 p.recruitingMemory={topFiveSchoolIds:[],offerSchoolIds:[],lat:deep.lat,lon:deep.lon};
 const full=u.teams.slice(1,120).map(t=>({t,score:10,need:0,competitive:true,opportunity:90,prior:10,relationship:10,follow:0}));
 assert.deepEqual(e.portalWanted(full),[],'a full position room takes nobody, however good the fit');
 const wanted=e.portalWanted([...full,{t:deep,score:60,need:2,competitive:true,opportunity:70,prior:10,relationship:10,follow:0}]);
 assert.equal(wanted.length,1,'one program with a genuine opening qualifies');
 const thin=e.portalWanted([{t:deep,score:60,need:1,competitive:true,opportunity:70,prior:10,relationship:10,follow:0}]);
 assert.equal(thin.length,0,'one open slot is not a reason to take a transfer');
 const legacy=e.portalWanted([{t:deep,score:60,need:0,competitive:false,opportunity:10,prior:80,relationship:10,follow:0}]);
 assert.equal(legacy.length,1,'a prior relationship still opens a full room');
});

test('unplaced entrants return or leave, never linger',async()=>{
 const e=await setup(9702),u=readyForPortal(e);
 u.offseason.reports=u.offseason.reports||{};
 e.offseasonPortal();
 const report=u.offseason.reports.portal;
 assert.ok(report,'the phase records what happened');
 const outcome=(report.returned||0)+(report.exited||0);
 assert.ok(outcome>0,'some entrants find no home across 120 programs');
 assert.equal(u.transferPortal.length,0,'nobody is left pending forever');
 assert.equal(report.placed+(report.returned||0)+(report.exited||0),report.placed+outcome);
});

test('a departed player leaves the roster and its history is archived',async()=>{
 const e=await setup(9703),u=readyForPortal(e);
 e.offseasonPortal();
 const exited=u.offseason.reports.portal.exited||0;
 const archived=u.playerArchive.filter(x=>x.exitReason==='No landing spot').length;
 assert.equal(archived,exited,'each exit is archived once, with its own reason');
});

test('portal outcomes stay deterministic for a seed',async()=>{
 const run=async()=>{const e=await setup(9704);readyForPortal(e);e.offseasonPortal();
  const r=e.universe.offseason.reports.portal;return [r.placed,r.returned||0,r.exited||0].join(',')};
 assert.equal(await run(),await run());
});
