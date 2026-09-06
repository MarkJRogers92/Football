const fs=require('fs');
const path=require('path');
const Module=require('module');
const {makeStaffShortlistSystem}=require('../recruiting-shortlist');
const {makeScoutingActionSystem}=require('../scouting-actions');

function loadMeasuredEngine(seed){
 const harnessPath=path.join(__dirname,'harness.js');
 let source=fs.readFileSync(harnessPath,'utf8');
 const anchor='pipelineStrength, oversignAppetite';
 if(!source.includes(anchor))throw new Error('measurement export anchor not found in harness');
 source=source.replace(anchor,'pipelineStrength, staffEval, scoutHash, recruitDistance, oversignAppetite');
 const localRequire=Module.createRequire(harnessPath),mod={exports:{}};
 const fn=new Function('require','module','exports','__filename','__dirname',source);
 fn(localRequire,mod,mod.exports,harnessPath,path.dirname(harnessPath));
 return mod.exports.loadEngine({seed});
}

async function measure(seed){
 const e=loadMeasuredEngine(seed);
 await e.loadSchools();
 e.setUserTeam('Chicago Metropolitan');
 e.initUniverse();
 const u=e.universe,t=e.T('Chicago Metropolitan');
 if(!t)throw new Error('measurement team not found');
 const counter={count:0};
 const scouting=makeScoutingActionSystem({
  getUniverse:()=>u,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),avg:a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0,
  scoutingDomainView:e.scoutingDomainView,firstRecruitEvaluation:e.firstRecruitEvaluation,refreshScoutingIntel:e.refreshScoutingIntel,snapshotScouting:e.snapshotScouting,
  staffEval:e.staffEval,staffBias:(r,team)=>e.scoutHash(r,'staff_verdict',String(team.id))*12
 });
 const staffVerdict=(r,team)=>{counter.count++;return scouting.staffVerdict(r,team)};
 const shortlist=makeStaffShortlistSystem({posCounts:e.POS_COUNTS,eligibilityBase:e.eligibilityBase,staffVerdict,pipelineStrength:e.pipelineStrength,distance:e.recruitDistance});
 const fast=shortlist.shortlist(t,u.recruits,8),fastCalls=counter.count;
 counter.count=0;
 const full=shortlist.shortlistExhaustive(t,u.recruits,8),fullCalls=counter.count;
 const pick=x=>x.map(row=>({id:row.r.id,score:row.score,reason:row.reason}));
 if(JSON.stringify(pick(fast))!==JSON.stringify(pick(full)))throw new Error(`seed ${seed}: optimized shortlist differs from exhaustive ranking`);
 return{seed,recruits:u.recruits.length,uncommitted:u.recruits.filter(r=>!r.committed).length,fastCalls,fullCalls,saved:fullCalls-fastCalls,reductionPct:Math.round((1-fastCalls/fullCalls)*1000)/10,top:fast.map(x=>`${x.r.pos} ${x.r.name}`)};
}

(async()=>{
 const seeds=[95401,95402,95403,95404,95405],rows=[];
 for(const seed of seeds)rows.push(await measure(seed));
 console.table(rows.map(({top,...x})=>x));
 console.log('MEASUREMENT_JSON='+JSON.stringify(rows));
 const avg=rows.reduce((n,x)=>n+x.reductionPct,0)/rows.length,min=Math.min(...rows.map(x=>x.reductionPct)),max=Math.max(...rows.map(x=>x.reductionPct));
 console.log(`Average Staff Verdict call reduction: ${avg.toFixed(1)}% (range ${min.toFixed(1)}%-${max.toFixed(1)}%) across ${rows.length} real generated recruiting pools.`);
})().catch(err=>{console.error(err);process.exit(1)});
