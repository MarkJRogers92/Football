const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function setup(seed){const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();return e}
const season=(year,team,extra={})=>({year,team,pos:'LB',style:'Run-and-Chase',eligibility:'SR',rating:61,games:12,tackles:14,...extra});

test('a career that never started goes cold: totals, seasons and identity stay, the scouting history goes',async()=>{
 const e=await setup(9701),u=e.universe,t=u.teams[0];
 const p={...t.roster.find(x=>x.pos==='LB'),id:'cold-1',name:'Backup Linebacker',career:{games:30,starts:0,tackles:41},stats:{games:12,tackles:14},
  seasonHistory:[season(2028,t.name),season(2029,t.name)],campHistory:[{year:2029,phase:'Fall',grade:'B',delta:1}],scoutingHistory:[{year:2028}],
  scoutingDomains:{a:1},positionFamiliarity:{LB:90},trainingFocus:'Technique',recruitingMemory:{season:2026,stars:3,schoolId:t.id},awards:[],draftResult:{year:2030,label:'Undrafted Free Agent',round:null,pick:null}};
 e.addToArchive(p,t,'Eligibility exhausted');
 const r=u.playerArchive.find(x=>x.id==='cold-1');
 assert.equal(r.cold,1);
 for(const k of ['scoutingHistory','scoutingDomains','positionFamiliarity','trainingFocus'])assert.equal(r[k],undefined,k);
 assert.deepEqual(r.campHistory,p.campHistory,'camp attendance is real off-field history');
 assert.deepEqual(r.seasonHistory,[{year:2028,team:t.name,pos:'LB',rating:61,games:12,tackles:14},{year:2029,team:t.name,pos:'LB',rating:61,games:12,tackles:14}],'every season line keeps team, position, rating, games and statistics');
 assert.equal(r.career.tackles,41);assert.equal(r.name,'Backup Linebacker');assert.equal(r.lastTeam,t.name);
 assert.deepEqual(r.recruitingMemory,p.recruitingMemory,'the signing receipt stays');
 assert.equal(r.draftResult.label,'Undrafted Free Agent');
 assert.match(e.careerChronologyHTML(r),/scouting history was trimmed/);
 // A save round trip keeps the cold record as it is (stat blocks unpack on load, as for every record).
 const seasons=JSON.stringify(r.seasonHistory);e.installSave(JSON.parse(JSON.stringify({userTeam:t.name,universe:e.packUniverse(u)})));
 const back=e.universe.playerArchive.find(x=>x.id==='cold-1');
 assert.equal(back.cold,1);assert.deepEqual(back.campHistory,p.campHistory);assert.equal(back.scoutingHistory,undefined);
 assert.equal(JSON.stringify(back.seasonHistory),seasons);assert.equal(back.career.tackles,41);
});

test('starters, honourees, draft picks, honoured players and other exits keep the full record',async()=>{
 const e=await setup(9702),u=e.universe,t=u.teams[0],base={...t.roster[0],campHistory:[{year:2029}],scoutingHistory:[{year:2028}],career:{games:20},stats:{games:10}};
 const cases=[['started',{career:{games:20,starts:3}},'Eligibility exhausted'],['award',{awards:[{year:2029,name:'Lineman of the Year'}]},'Eligibility exhausted'],
  ['drafted',{draftResult:{year:2030,label:'Round 6, Pick 2',round:6,pick:2}},'Eligibility exhausted'],['potw',{potw:1},'Eligibility exhausted'],['cut',{},'Roster cut'],['early',{},'Declared early for draft']];
 for(const [id,extra,reason] of cases)e.addToArchive({...base,id,...extra},t,reason);
 for(const [id] of cases){const r=u.playerArchive.find(x=>x.id===id);assert.equal(r.cold,undefined,id);assert.deepEqual(r.scoutingHistory,[{year:2028}],id)}
});

test('the offseason compaction moves older records to the cold tier once, and only when the archive is loaded',async()=>{
 const e=await setup(9703),u=e.universe,t=u.teams[0];
 u.playerArchive.push({id:'old-1',name:'Old Backup',pos:'S',lastTeam:t.name,retiredYear:2027,exitReason:'Eligibility exhausted',career:{games:22},stats:{},awards:[],seasonHistory:[season(2026,t.name,{pos:'S'})],campHistory:[{year:2026}]},
  {id:'old-2',name:'Old Starter',pos:'S',lastTeam:t.name,retiredYear:2027,exitReason:'Eligibility exhausted',career:{games:22,starts:20},stats:{},awards:[],seasonHistory:[],campHistory:[{year:2026}]});
 const first=e.compactHistoryArchive();assert.ok(first.cold>=1);
 assert.equal(u.playerArchive.find(x=>x.id==='old-1').cold,1);assert.deepEqual(u.playerArchive.find(x=>x.id==='old-1').campHistory,[{year:2026}]);assert.equal(u.playerArchive.find(x=>x.id==='old-1').seasonHistory[0].style,undefined);
 assert.equal(u.playerArchive.find(x=>x.id==='old-2').cold,undefined);
 assert.equal(e.compactHistoryArchive().cold,0,'idempotent');
});
