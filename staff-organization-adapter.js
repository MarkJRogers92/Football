function makeStaffOrganizationPresentationModel(){
 'use strict';
 const SLOT_ORDER=['HC','OC','DC','RC','SC'];
 const SLOT_META={
  HC:{lane:'PROGRAM LEADERSHIP',focus:'Program direction',detail:'Coordinates the full football operation.'},
  OC:{lane:'OFFENSE',focus:'Offensive system',detail:'Play calling, adaptability and offensive development.'},
  DC:{lane:'DEFENSE',focus:'Defensive system',detail:'Play calling, adaptability and defensive development.'},
  RC:{lane:'RECRUITING',focus:'Talent acquisition',detail:'Recruiting, evaluation and relationship work.'},
  SC:{lane:'PERFORMANCE',focus:'Player development',detail:'Development, adaptability and performance program.'}
 };
 const METRIC_LABELS={recruiting:'Recruit',development:'Develop',evaluation:'Evaluate',playCall:'Call',adaptability:'Adapt'};
 const number=x=>Number.isFinite(Number(x))?Number(x):null;
 function cleanCoach(raw={}){const metrics={recruiting:number(raw.recruiting),development:number(raw.development),evaluation:number(raw.evaluation),playCall:number(raw.playCall),adaptability:number(raw.adaptability)};return{id:raw.id??null,slot:raw.slot??null,name:raw.name??'Unknown coach',role:raw.role??'Coach',age:number(raw.age),years:number(raw.years),contractYears:number(raw.contractYears),salary:number(raw.salary),interim:!!raw.interim,status:raw.status??'ACTIVE',playCallAuthority:raw.playCallAuthority??null,preferredScheme:raw.preferredScheme??null,schemeIdentity:raw.schemeIdentity??null,specialties:Array.isArray(raw.specialties)?[...raw.specialties]:[],traitText:raw.traitText??null,metrics,grades:raw.grades?{...raw.grades}:null}}
 function strengths(raw){const c=cleanCoach(raw);return Object.entries(c.metrics).filter(([,v])=>v!=null).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([key,value])=>({key,label:METRIC_LABELS[key],value,grade:c.grades?.[key]??null}))}
 function organization(staff={}){const rows=SLOT_ORDER.map(slot=>{const raw=staff[slot];if(!raw)return null;const coach=cleanCoach({...raw,slot}),meta=SLOT_META[slot];return{slot,...meta,coach:{...coach,strengths:strengths(coach)}}}).filter(Boolean);return{head:rows.find(x=>x.slot==='HC')||null,departments:rows.filter(x=>x.slot!=='HC'),all:rows}}
 function summary(staff={},budget=null){const org=organization(staff),coaches=org.all.map(x=>x.coach),salaryTotal=Math.round(coaches.reduce((n,c)=>n+(c.salary||0),0)*10)/10,avgTenure=coaches.length?Math.round(coaches.reduce((n,c)=>n+((c.years??0)+1),0)/coaches.length*10)/10:0;return{count:coaches.length,interim:coaches.filter(c=>c.interim).length,salaryTotal,budget:number(budget),avgTenure}}
 return{cleanCoach,strengths,organization,summary,SLOT_ORDER,SLOT_META,METRIC_LABELS};
}

if(typeof module==='object'&&module.exports){module.exports={makeStaffOrganizationPresentationModel};}
else{
 const staffOrganizationPresentationModel=makeStaffOrganizationPresentationModel();
 function staffOrganizationReady(){return !!universe&&Array.isArray(universe.teams)}
 function presentationCoach(t,slot,c){const grades={recruiting:grade(c.recruiting),development:grade(c.development),evaluation:grade(c.evaluation),playCall:grade(c.playCall),adaptability:grade(c.adaptability)};return{id:c.id,slot,name:c.name,role:COACH_SLOT_ROLES[slot]||c.role,age:c.age,years:c.years??0,contractYears:c.contractYears??2,salary:c.salary??null,interim:!!c.interim,status:c.status||'ACTIVE',playCallAuthority:c.playCallAuthority||null,preferredScheme:c.preferredScheme||null,schemeIdentity:coachSchemeIdentity(COACH_SLOT_ROLES[slot]||c.role,t),specialties:c.specialties?.length?[...c.specialties]:coachSpecialties(c),traitText:coachTraitText(c),recruiting:c.recruiting,development:c.development,evaluation:c.evaluation,playCall:c.playCall,adaptability:c.adaptability,grades};}
 globalThis.DynastyLabStaffOrganization={
  snapshot:()=>{if(!staffOrganizationReady())return null;const t=selected?.();if(!t)return null;const staff={};for(const slot of staffOrganizationPresentationModel.SLOT_ORDER){const c=t.staff?.[slot];if(c)staff[slot]=presentationCoach(t,slot,c)}const organization=staffOrganizationPresentationModel.organization(staff);return{team:{id:t.id,name:t.name,offScheme:t.offScheme,defScheme:t.defScheme},organization,summary:staffOrganizationPresentationModel.summary(staff,teamStaffBudget(t)),staffSpend:teamStaffSpend(t),staffBudget:teamStaffBudget(t)};},
  note:'Read-only presentation of the five canonical staff slots. No position-coach jobs, reporting mechanics or staff state are created by this view.'
 };
}
