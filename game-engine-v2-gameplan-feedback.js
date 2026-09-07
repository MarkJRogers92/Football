(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.DynastyGameplanFeedback=api;
})(typeof window==='object'?window:globalThis,function(){
'use strict';

const VERSION=1;
const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const safeDiv=(a,b)=>b>0?a/b:0;
const opposite=side=>side==='home'?'away':'home';
const PLAN_LABELS={
  scout:'Full scout',balance:'Balanced prep',standard:'Standard week',stop_run:'Stop the run',
  protect_pass:'Protect against the pass',pressure:'Pressure the QB'
};
function normalizePlan(record,side){
  const raw=record?.[side]?.gameplan||{},prep=String(raw.prep||'standard');
  return{prep,label:String(raw.label||PLAN_LABELS[prep]||prep)}
}
function metrics(record,side){
  const opp=opposite(side),mine=record?.teamStats?.[side]||{},theirs=record?.teamStats?.[opp]||{};
  const rushAtt=finite(theirs.rushAtt),passAtt=finite(theirs.passAtt),plays=finite(theirs.plays),rushYds=finite(theirs.rushYds),passYds=finite(theirs.passYds);
  return{
    pointsAllowed:finite(record?.score?.[opp]),pointsFor:finite(record?.score?.[side]),
    rushAtt,rushYds,rushYpc:safeDiv(rushYds,rushAtt),passAtt,passYds,passYpa:safeDiv(passYds,passAtt),
    sacks:finite(theirs.sacksTaken),takeaways:finite(theirs.turnovers),totalYards:rushYds+passYds,yardsPerPlay:safeDiv(rushYds+passYds,plays),
    ownTurnovers:finite(mine.turnovers),ownYards:finite(mine.rushYds)+finite(mine.passYds)
  }
}
function verdict(rank){return rank>=2?'Worked':rank<=-2?'Missed':'Mixed'}
function evaluate(record,side){
  if(side!=='home'&&side!=='away')throw new Error('Gameplan feedback side must be home or away.');
  const plan=normalizePlan(record,side),m=metrics(record,side);let rank=0,headline='',detail='';
  if(plan.prep==='stop_run'){
    if(m.rushAtt<8){rank=0;headline='Opponent rarely tested the run front.'}
    else{rank=m.rushYpc<=3.7?2:m.rushYpc>=5.0?-2:0;headline=`Run defense allowed ${m.rushYpc.toFixed(1)} yards per carry.`}
    detail=`${m.rushYds} rushing yards on ${m.rushAtt} carries; ${m.passYds} passing yards allowed.`
  }else if(plan.prep==='protect_pass'){
    rank=m.passAtt<12?0:m.passYpa<=6.4?2:m.passYpa>=8.5?-2:0;headline=`Pass defense allowed ${m.passYpa.toFixed(1)} yards per attempt.`;
    detail=`${m.passYds} passing yards on ${m.passAtt} attempts with ${m.takeaways} total takeaway${m.takeaways===1?'':'s'}.`
  }else if(plan.prep==='pressure'){
    rank=m.sacks>=4&&m.passYpa<8.5?2:m.sacks<=1&&m.passYpa>=8.0?-2:m.sacks>=3?1:0;headline=`Pressure produced ${m.sacks} sack${m.sacks===1?'':'s'}.`;
    detail=`Opponent averaged ${m.passYpa.toFixed(1)} yards per pass attempt and finished with ${m.passYds} passing yards.`
  }else if(plan.prep==='scout'||plan.prep==='balance'){
    rank=m.yardsPerPlay<=5.2?2:m.yardsPerPlay>=7.0?-2:0;headline=`Defense allowed ${m.yardsPerPlay.toFixed(1)} yards per play.`;
    detail=`${m.totalYards} total yards allowed, ${m.takeaways} takeaway${m.takeaways===1?'':'s'}, ${m.pointsAllowed} points allowed.`
  }else{
    rank=0;headline=`Standard preparation produced a ${m.pointsFor}–${m.pointsAllowed} result.`;
    detail=`${m.ownYards} yards gained, ${m.totalYards} allowed, turnover margin ${m.takeaways-m.ownTurnovers>=0?'+':''}${m.takeaways-m.ownTurnovers}.`
  }
  return{version:VERSION,side,plan,verdict:plan.prep==='standard'?'Baseline':verdict(rank),rank,headline,detail,metrics:m}
}
function forTeam(record,teamId){
  const id=String(teamId);let side=null;if(String(record?.home?.id)===id)side='home';else if(String(record?.away?.id)===id)side='away';
  if(!side)throw new Error('Team is not part of the supplied game archive record.');return evaluate(record,side)
}
return{VERSION,PLAN_LABELS,metrics,evaluate,forTeam};
});
