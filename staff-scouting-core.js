function makeStaffScoutingIdentitySystem(){
 'use strict';
 const GROUPS=[
  {key:'QB',label:'Quarterbacks',positions:['QB']},
  {key:'SKILL',label:'Skill positions',positions:['RB','WR','TE']},
  {key:'OL',label:'Offensive line',positions:['OT','OG','C']},
  {key:'FRONT',label:'Front seven',positions:['EDGE','DT','LB']},
  {key:'SECONDARY',label:'Secondary',positions:['CB','S']}
 ];
 function hash(value){let h=2166136261>>>0;for(const ch of String(value??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 function groupForPosition(pos){return GROUPS.find(g=>g.positions.includes(pos))||GROUPS[1]}
 function profileForCoach(c){
  const seed=hash(`${c?.id||c?.name||'coach'}|scouting-profile`),first=seed%GROUPS.length,second=(first+1+((seed>>>5)%(GROUPS.length-1)))%GROUPS.length;
  return{primary:GROUPS[first],secondary:GROUPS[second]};
 }
 function coachBonus(c,pos){if(!c)return 0;const group=groupForPosition(pos),p=profileForCoach(c);if(group.key===p.primary.key)return 5;if(group.key===p.secondary.key)return 2;return 0}
 function evaluationModifier(t,r){
  if(!t||!r)return 0;const rc=t.staff?.RC,hc=t.staff?.HC,side=['QB','RB','WR','TE','OT','OG','C'].includes(r.pos)?t.staff?.OC:t.staff?.DC;
  const raw=coachBonus(rc,r.pos)+Math.round(coachBonus(side,r.pos)*.55)+Math.round(coachBonus(hc,r.pos)*.25);
  return Math.max(0,Math.min(8,raw));
 }
 function gainModifier(t,r){const m=evaluationModifier(t,r);return m>=7?3:m>=4?2:m>=2?1:0}
 function classifyRecord(rows=[]){
  const settled=rows.filter(x=>x?.result?.final),good=settled.filter(x=>['DIAMOND','HIT','AS_SCOUTED'].includes(x.result.code)),bad=settled.filter(x=>['BUST','MISS'].includes(x.result.code)),avgDelta=settled.length?settled.reduce((n,x)=>n+(Number(x.result.delta)||0),0)/settled.length:0,accuracy=settled.length?good.length/settled.length:null;
  let label='Unproven';if(settled.length>=8)label=accuracy>=.78?'Excellent':accuracy>=.64?'Reliable':accuracy>=.50?'Mixed':'Questionable';else if(settled.length>=3)label=accuracy>=.75?'Strong start':accuracy>=.50?'Developing':'Early concerns';
  return{settled:settled.length,good:good.length,bad:bad.length,diamonds:settled.filter(x=>x.result.code==='DIAMOND').length,busts:settled.filter(x=>x.result.code==='BUST').length,accuracy,avgDelta:Math.round(avgDelta*10)/10,label};
 }
 function summarizeCoach(coachId,players=[],classify){
  const rows=[];for(const p of players||[]){const snap=p?.recruitingMemory?.scoutingReceipt;if(!snap||snap.recruiterCoachId!==coachId)continue;const result=classify?.(p);if(result)rows.push({p,result})}
  const byGroup={};for(const x of rows){const key=groupForPosition(x.p.pos).key;(byGroup[key]??=[]).push(x)}
  return{...classifyRecord(rows),tracked:rows.length,groups:Object.fromEntries(Object.entries(byGroup).map(([k,v])=>[k,classifyRecord(v)])),rows};
 }
 return{GROUPS,hash,groupForPosition,profileForCoach,coachBonus,evaluationModifier,gainModifier,classifyRecord,summarizeCoach};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeStaffScoutingIdentitySystem};
}else{
 var staffScoutingIdentity=makeStaffScoutingIdentitySystem();
 const refreshScoutingIntelBeforeStaffIdentity=refreshScoutingIntel;
 refreshScoutingIntel=function(subject,t,gain,source,recruit=false){
  const manual=recruit&&(source==='QUICK_FILM'||source==='FULL_EVALUATION');
  return refreshScoutingIntelBeforeStaffIdentity(subject,t,gain+(manual?staffScoutingIdentity.gainModifier(t,subject):0),source,recruit);
 };
}
