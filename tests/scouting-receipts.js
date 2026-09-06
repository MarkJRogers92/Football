const test=require('node:test');
const assert=require('node:assert/strict');
const {makeScoutingReceiptSystem}=require('../scouting-receipts');

function fixture(){
 const universe={year:2027,week:8};
 return{universe,api:makeScoutingReceiptSystem({getUniverse:()=>universe,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))})};
}
const team=()=>({id:1,name:'Chicago Metropolitan'});
const recruit=(extra={})=>({id:'R1',name:'Test Recruit',pos:'WR',style:'Route Artisan',stars:3,nationalRank:420,positionRank:58,scout:67,scoutUp:77,interest:84,commitWeek:8,committed:'Chicago Metropolitan',trueNow:99,upside:99,growthProfile:'elite',recruitingMemory:{season:2027,schoolId:1,stars:3},...extra});
const verdict=(extra={})=>({score:70,label:'Boardable',conviction:'Medium',confidence:62,spread:10,...extra});
const playerFrom=(snap,extra={})=>({id:'P1',name:'Test Recruit',perceived:78,perceivedUpside:86,scoutConfidence:74,trueNow:99,upside:99,growthProfile:'elite',recruitingMemory:{season:2027,schoolId:1,stars:snap.stars,scoutingReceipt:snap},stats:{games:8,starts:5},seasonHistory:[],awards:[],...extra});

test('signing receipt freezes only staff-visible belief',()=>{const {api}=fixture(),r=recruit(),snap=api.freezeSigningReceipt(r,team(),verdict(),{quick:true,full:false,receipts:[{cost:1}]});assert.equal(snap.stage,'QUICK_FILM');assert.equal(snap.hoursSpent,1);assert.equal(snap.currentRead,67);assert.equal(snap.upsideRead,77);for(const hidden of ['trueNow','upside','growthProfile'])assert.equal(Object.hasOwn(snap,hidden),false);assert.deepEqual(r.recruitingMemory.scoutingReceipt,snap)});

test('receipt is immutable once the player commits',()=>{const {api}=fixture(),r=recruit(),first=api.freezeSigningReceipt(r,team(),verdict(),{});r.scout=90;r.scoutUp=96;const second=api.freezeSigningReceipt(r,team(),verdict({score:91,label:'Priority take'}),{});assert.deepEqual(second,first);assert.equal(second.currentRead,67)});

test('early evidence can produce diamond and bust watch without final labels',()=>{const {api,universe}=fixture(),low=api.signingSnapshot(recruit(),team(),verdict(),{}),high=api.signingSnapshot(recruit({stars:5,scout:84,scoutUp:91}),team(),verdict({score:88,label:'Priority take'}),{full:true,receipts:[{cost:3}]});universe.year=2028;const diamond=api.classifyPlayer(playerFrom(low,{perceived:81,stats:{games:7,starts:5}}),2028),bust=api.classifyPlayer(playerFrom(high,{perceived:67,stats:{games:7,starts:1}}),2028);assert.equal(diamond.code,'DIAMOND_WATCH');assert.equal(diamond.final,false);assert.equal(bust.code,'BUST_WATCH');assert.equal(bust.final,false)});

test('mature evidence can settle diamond and bust receipts',()=>{const {api,universe}=fixture(),low=api.signingSnapshot(recruit(),team(),verdict(),{}),high=api.signingSnapshot(recruit({stars:5,scout:84,scoutUp:91}),team(),verdict({score:88,label:'Priority take'}),{full:true,receipts:[{cost:3}]});universe.year=2029;const diamond=api.classifyPlayer(playerFrom(low,{perceived:84,stats:{games:14,starts:11},awards:[{name:'All-Conference'}]}),2029),bust=api.classifyPlayer(playerFrom(high,{perceived:66,stats:{games:14,starts:2}}),2029);assert.equal(diamond.code,'DIAMOND');assert.equal(diamond.final,true);assert.equal(bust.code,'BUST');assert.equal(bust.final,true);assert.equal(bust.costly,true)});

test('changing hidden truth cannot change a scouting receipt outcome',()=>{const {api,universe}=fixture(),snap=api.signingSnapshot(recruit(),team(),verdict(),{});universe.year=2029;const p=playerFrom(snap,{perceived:79,stats:{games:16,starts:10}}),a=api.classifyPlayer(p,2029);p.trueNow=30;p.upside=35;p.growthProfile='late';const b=api.classifyPlayer(p,2029);assert.deepEqual(b,a)});

test('receipt summary explains expectation versus observed result',()=>{const {api,universe}=fixture(),snap=api.signingSnapshot(recruit(),team(),verdict(),{});universe.year=2029;const result=api.classifyPlayer(playerFrom(snap,{perceived:84,stats:{games:14,starts:11}}),2029),text=api.receiptSummary(result);assert.match(text,/signing/i);assert.match(text,/games/i);assert.match(text,/Diamond|Hit|As Scouted/)});
