const test=require('node:test');
const assert=require('node:assert/strict');
const {makeScoutingReceiptSystem}=require('../scouting-receipts');
const {makeRecruitingHistorySystem}=require('../recruiting-history');

function systems(){
 const universe={year:2030};
 const receipts=makeScoutingReceiptSystem({getUniverse:()=>universe,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 return{universe,receipts,history:makeRecruitingHistorySystem({classifyPlayer:(p,year)=>receipts.classifyPlayer(p,year)})};
}
function snapshot({season=2027,schoolId=1,stars=3,currentRead=65,upsideRead=75,verdictScore=70,verdictLabel='Boardable',hoursSpent=1}={}){return{version:1,schoolId,schoolName:'Metro',recruitId:`r${season}${currentRead}`,name:'Recruit',pos:'WR',season,week:8,stars,nationalRank:300,currentRead,upsideRead,verdictScore,verdictLabel,conviction:'Medium',confidence:65,rangeWidth:8,stage:'QUICK_FILM',hoursSpent,interest:80}}
function player(name,snap,{perceived=80,confidence=80,games=14,starts=10,awards=[],trueNow=99,upside=99,growthProfile='elite'}={}){return{id:name,name,pos:'WR',perceived,perceivedUpside:Math.max(perceived,85),scoutConfidence:confidence,trueNow,upside,growthProfile,recruitingMemory:{season:snap.season,schoolId:snap.schoolId,stars:snap.stars,scoutingReceipt:snap},stats:{games,starts},seasonHistory:[],awards}}

test('history player pool combines active roster and matching archive without duplicates',()=>{
 const {history}=systems(),active=player('Active',snapshot({schoolId:1}),{}),archived=player('Archived',snapshot({schoolId:1,season:2027}),{}),duplicate={...active,name:'Stale Archive Copy'},other=player('Other School',snapshot({schoolId:2}),{}),team={id:1,roster:[active]};
 const pool=history.playerPool(team,[duplicate,archived,other]);
 assert.deepEqual(pool.map(p=>p.name),['Active','Archived']);assert.equal(pool[0],active);
});

test('history groups receipts by signing class newest first',()=>{
 const {history}=systems(),p1=player('Diamond',snapshot({season:2027}),{perceived:82}),p2=player('Bust',snapshot({season:2028,stars:5,currentRead:84,upsideRead:91,verdictScore:88,verdictLabel:'Priority take',hoursSpent:3}),{perceived:66,starts:2});
 const classes=history.history([p1,p2],2030,1);
 assert.deepEqual(classes.map(x=>x.season),[2028,2027]);
 assert.equal(classes[0].signed,1);assert.equal(classes[1].signed,1);
 assert.equal(classes[0].counts.BUST,1);assert.equal(classes[1].counts.DIAMOND,1);
});

test('class summary reconciles settled, developing, pending and evaluation hours',()=>{
 const {history}=systems(),settled=player('Settled',snapshot({season:2027,hoursSpent:3}),{perceived:82}),watch=player('Watch',snapshot({season:2029,hoursSpent:1}),{perceived:82,games:7,starts:5,confidence:65}),pending=player('Pending',snapshot({season:2029,hoursSpent:0}),{perceived:67,games:1,starts:0,confidence:45});
 const c2029=history.history([settled,watch,pending],2030,1).find(x=>x.season===2029);
 assert.equal(c2029.signed,2);assert.equal(c2029.settled,0);assert.equal(c2029.developing,1);assert.equal(c2029.pending,1);assert.equal(c2029.hoursSpent,1);
});

test('history filters receipts to the selected school',()=>{
 const {history}=systems(),mine=player('Mine',snapshot({schoolId:1}),{}),other=player('Other',snapshot({schoolId:2}),{});
 const classes=history.history([mine,other],2030,1);
 assert.equal(classes.reduce((n,c)=>n+c.signed,0),1);assert.equal(classes[0].players[0].p.name,'Mine');
});

test('historical report is independent of hidden talent and growth fields',()=>{
 const {history}=systems(),p=player('Hidden Proof',snapshot({season:2027}),{perceived:82}),before=history.history([p],2030,1);
 p.trueNow=25;p.upside=30;p.growthProfile='late';
 const after=history.history([p],2030,1);
 const scrub=x=>x.map(c=>({season:c.season,signed:c.signed,settled:c.settled,developing:c.developing,pending:c.pending,costly:c.costly,counts:c.counts,averageDelta:c.averageDelta,players:c.players.map(y=>({name:y.p.name,code:y.result.code,delta:y.result.delta,label:y.result.label}))}));
 assert.deepEqual(scrub(after),scrub(before));
});
