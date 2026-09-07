(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DynastyWeeklyCoaching=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION=1;
  const MAX_POINTS=2;
  const FOCUSES={
    pass_protection:{label:'Pass Protection',side:'offense',description:'More protection reps and pickup work; slightly less route-detail time.',deltas:{ol:2.6,skill:-0.4,offense:0.4}},
    run_blocking:{label:'Run Blocking',side:'offense',description:'More fit and combination-block work; slightly less QB timing work.',deltas:{ol:1.8,skill:0.9,qb:-0.4,offense:0.5}},
    explosive_pass:{label:'Explosive Passing',side:'offense',description:'Push vertical timing and separation; protection gets fewer dedicated reps.',deltas:{qb:1.4,skill:1.8,ol:-0.8,offense:0.7}},
    run_fits:{label:'Run Fits',side:'defense',description:'Tighter front mechanics and fits; fewer coverage-detail reps.',deltas:{front:2.5,coverage:-0.7,defense:0.6}},
    coverage:{label:'Coverage',side:'defense',description:'Extra leverage and pattern-match work; slightly fewer front reps.',deltas:{coverage:2.5,front:-0.7,defense:0.6}},
    pressure:{label:'Pressure Package',side:'defense',description:'Install pressure answers and rush games; coverage is more exposed if pressure misses.',deltas:{front:1.3,coverage:-1.1,prepPressure:0.012,defense:0.5}}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function normalizeFocuses(list){const out=[];for(const id of Array.isArray(list)?list:[]){if(FOCUSES[id]&&!out.includes(id))out.push(id);if(out.length===MAX_POINTS)break}return out}
  function hashUnit(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return (h/4294967295)*2-1}
  function confidenceLabel(v){return v>=82?'High':v>=64?'Medium':'Low'}
  function noisy(value,confidence,key){const spread=clamp((100-confidence)/9,1,6);return Math.round(Number(value||0)+hashUnit(key)*spread)}
  function edgeLabel(v){return v>=5?'clear edge':v>=2?'slight edge':v<=-5?'clear concern':v<=-2?'slight concern':'close to even'}
  function buildReport(input={}){
    const confidence=clamp(Math.round(input.confidence??70),45,94),seed=`${input.season||0}|${input.week||0}|${input.teamName||''}|${input.opponentName||''}`;
    const passShare=clamp(Number(input.passShare??.5),.2,.8),passEstimate=clamp(Math.round(passShare*100+hashUnit(seed+'|pass')*Math.max(2,(100-confidence)/7)),25,75);
    const te=input.teamEdges||{},oe=input.opponentEdges||{};
    const est={
      teamPass:noisy(te.passGame,confidence,seed+'|tp'),teamRun:noisy(te.runGame,confidence,seed+'|tr'),teamProtect:noisy(te.passProtection,confidence,seed+'|tprot'),
      oppPass:noisy(oe.passGame,confidence,seed+'|op'),oppRun:noisy(oe.runGame,confidence,seed+'|or'),oppProtect:noisy(oe.passProtection,confidence,seed+'|oprot')
    };
    const observations=[];
    observations.push(passEstimate>=56?`Staff expects a pass-leaning opponent, roughly ${passEstimate}% through the air.`:passEstimate<=44?`Staff expects a run-leaning opponent, roughly ${100-passEstimate}% on the ground.`:`Staff sees a balanced offense, roughly ${passEstimate}% pass.`);
    if(est.oppPass>=3)observations.push(`Their passing matchup looks like a ${edgeLabel(est.oppPass)} for them; coverage detail matters.`);
    else if(est.oppRun>=3)observations.push(`Their run game looks like a ${edgeLabel(est.oppRun)} for them; the front needs a clean week.`);
    else if(est.oppProtect<=-3)observations.push('Staff believes their protection can be stressed with pressure and rush games.');
    else observations.push('Staff does not see one obvious opponent matchup to sell out against.');
    if(est.teamProtect<=-3)observations.push('Your protection matchup is a concern; extra pickup and protection work could stabilize the offense.');
    else if(est.teamPass>=3)observations.push('Your passing matchup looks favorable enough to justify an explosive-pass emphasis.');
    else if(est.teamRun>=3)observations.push('Your run-game matchup looks favorable enough to lean into blocking detail.');
    else observations.push('Your offense projects relatively even; preparation can be used to shape identity rather than patch a clear weakness.');
    const oppInjuries=Number(input.opponentInjuries||0);if(oppInjuries>0)observations.push(`${oppInjuries} opponent availability issue${oppInjuries===1?' is':'s are'} on the staff report.`);
    const candidates=[];const add=id=>{if(FOCUSES[id]&&!candidates.includes(id))candidates.push(id)};
    if(est.teamProtect<=-2)add('pass_protection');
    if(est.oppPass>=2||passEstimate>=56)add('coverage');
    if(est.oppProtect<=-2)add('pressure');
    if(est.oppRun>=2||passEstimate<=44)add('run_fits');
    if(est.teamPass>=2)add('explosive_pass');
    if(est.teamRun>=2)add('run_blocking');
    add('pass_protection');add('coverage');
    return{version:VERSION,confidence,confidenceLabel:confidenceLabel(confidence),passEstimate,estimatedEdges:est,observations:observations.slice(0,4),recommendedFocuses:candidates.slice(0,MAX_POINTS)}
  }
  function applyPrepProfile(profile,focuses){
    const ids=normalizeFocuses(focuses);if(!profile||!ids.length)return profile&&JSON.parse(JSON.stringify(profile));
    const out={...profile};
    for(const id of ids){const deltas=FOCUSES[id].deltas;for(const [key,delta] of Object.entries(deltas)){const base=Number(out[key]||0);out[key]=key==='prepPressure'?clamp(base+delta,-.1,.2):clamp(base+delta,20,99)}}
    if(Number.isFinite(out.offense)&&Number.isFinite(out.defense))out.overall=(out.offense+out.defense)/2;
    return out
  }
  function focusSummary(focuses){return normalizeFocuses(focuses).map(id=>({id,label:FOCUSES[id].label,side:FOCUSES[id].side,description:FOCUSES[id].description}))}
  function struggleSignal(pos,stats={}){
    if(pos==='QB'&&(stats.passAtt||0)>=25){const comp=(stats.passComp||0)/stats.passAtt,intRate=(stats.int||0)/stats.passAtt;return{score:(comp<.55?1:0)+(intRate>.05?1:0),text:comp<.55||intRate>.05?'passing efficiency has slipped':'passing production is stable'}}
    if(pos==='RB'&&(stats.rushAtt||0)>=25){const ypc=(stats.rushYds||0)/stats.rushAtt;return{score:ypc<3.5?2:ypc<4?1:0,text:ypc<3.5?'rushing efficiency has been poor':ypc<4?'rushing efficiency is under pressure':'rushing production is stable'}}
    if(['WR','TE'].includes(pos)&&(stats.targets||0)>=15){const rate=(stats.receptions||0)/stats.targets;return{score:rate<.5?2:rate<.58?1:0,text:rate<.5?'target conversion has been poor':rate<.58?'target conversion has dipped':'receiving production is stable'}}
    return{score:0,text:'season production is not a major warning'}
  }
  function selectStarterChallenge(groups=[]){
    const rows=[];for(const g of groups){const s=g?.starter,c=g?.challenger;if(!s||!c)continue;const gap=Number(c.grade||0)-Number(s.grade||0),upsideGap=Number(c.upside||0)-Number(s.upside||0),struggle=struggleSignal(g.pos,s.stats||{}),youthPush=(c.year==='FR'||c.year==='SO')&&upsideGap>=6;
      if(!(gap>=1||(gap>=-3&&struggle.score>0)||(gap>=-2&&youthPush)))continue;
      const score=gap*4+struggle.score*6+Math.max(0,upsideGap)*.3+(youthPush?2:0),recommendation=(gap>=2||(struggle.score>=2&&gap>=-1))?'promote':(gap>=-2?'split':'stay');
      const reason=gap>=2?`${c.name} is grading ahead of ${s.name}.`:struggle.score?`${s.name} is under performance pressure and ${c.name} is close enough to force a decision.`:`${c.name}'s development has closed the gap on ${s.name}.`;
      rows.push({pos:g.pos,starterId:s.id,starterName:s.name,challengerId:c.id,challengerName:c.name,gap,upsideGap,struggleScore:struggle.score,struggleText:struggle.text,recommendation,reason,score})
    }return rows.sort((a,b)=>b.score-a.score||a.pos.localeCompare(b.pos))[0]||null
  }
  return{VERSION,MAX_POINTS,FOCUSES,normalizeFocuses,buildReport,applyPrepProfile,focusSummary,confidenceLabel,struggleSignal,selectStarterChallenge}
});
