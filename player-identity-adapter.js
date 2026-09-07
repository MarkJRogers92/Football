function makePlayerIdentityPresentationModel(){
 'use strict';
 const numeric=x=>Number.isFinite(Number(x))?Number(x):null;
 function cleanPlayer(raw={}){return{id:raw.id??null,teamId:numeric(raw.teamId),teamName:raw.teamName??null,name:raw.name??'Unknown player',jerseyNumber:numeric(raw.jerseyNumber)??0,pos:raw.pos??'—',eligibility:raw.eligibility??'—',height:raw.height??'—',weight:raw.weight??'—',style:raw.style??'—',status:raw.status??'ACTIVE PLAYER',currentLabel:raw.currentLabel??'—',upsideLabel:raw.upsideLabel??'—',confidence:numeric(raw.confidence),healthLabel:raw.healthLabel??'—',schemeFit:numeric(raw.schemeFit),schemeFitGrade:raw.schemeFitGrade??'—',roles:Array.isArray(raw.roles)?[...raw.roles]:[],seasonProduction:raw.seasonProduction??'No recorded statistics.',careerProduction:raw.careerProduction??'No recorded statistics.',developmentNote:raw.developmentNote??null,trainingFocus:raw.trainingFocus??null,positionFamiliarity:numeric(raw.positionFamiliarity),wear:numeric(raw.wear),redshirtLabel:raw.redshirtLabel??null,academicLabel:raw.academicLabel??null,morale:numeric(raw.morale)}}
 function headline(raw={}){const p=cleanPlayer(raw),role=p.roles[0]||'No active specialist role';return{identity:`#${p.jerseyNumber} · ${p.pos} · ${p.eligibility}`,role,scheme:`${p.schemeFitGrade}${p.schemeFit!=null?` (${p.schemeFit})`:''}`,current:p.currentLabel,upside:p.upsideLabel,confidence:p.confidence!=null?`${Math.round(p.confidence)}%`:'—'}}
 function statusChips(raw={}){const p=cleanPlayer(raw),chips=[];if(p.roles.length)chips.push(...p.roles.slice(0,2).map(x=>({kind:'role',label:x})));if(p.style&&p.style!=='—')chips.push({kind:'style',label:p.style});if(p.redshirtLabel)chips.push({kind:'status',label:p.redshirtLabel});if(p.academicLabel)chips.push({kind:'status',label:p.academicLabel});return chips.slice(0,5)}
 return{cleanPlayer,headline,statusChips};
}

if(typeof module==='object'&&module.exports){module.exports={makePlayerIdentityPresentationModel};}
else{
 const playerIdentityPresentationModel=makePlayerIdentityPresentationModel();
 function identityReady(){return !!universe&&Array.isArray(universe.teams)}
 function identitySnapshot(id){
  if(!identityReady()||!id)return null;const f=findPlayer(id);if(!f)return null;const p=f.p,t=f.team,active=!!f.active&&!!t;if(active)ensurePlayerDevelopment(p,t);
  const roles=active&&t?ROLE_DEFS.filter(r=>roleStarter(t,r.id)?.id===p.id).map(r=>r.label):[];
  const redshirtLabel=p.redshirtUsed?`Redshirt used${p.redshirtSeason?` ${p.redshirtSeason}`:''}`:p.redshirtActive?'Redshirt protected':null;
  const raw={id:p.id,teamId:t?.id??p.schoolId??null,teamName:t?.name??p.lastTeam??null,name:p.name,jerseyNumber:p.jerseyNumber??0,pos:p.pos,eligibility:eligibilityLabel(p),height:heightStr(p.height),weight:p.weight,style:p.style,status:f.portal?'TRANSFER PORTAL':active?'ACTIVE PLAYER':'PLAYER ARCHIVE',currentLabel:active?scoutRangeText(p,t,false):grade(p.perceived),upsideLabel:active?scoutRangeText(p,t,true):grade(p.perceivedUpside),confidence:active?Math.round(p.scoutConfidence||50):null,healthLabel:active?healthText(p):(f.portal?'Awaiting a destination':p.exitReason||'Career complete'),schemeFit:active?playerSchemeFit(p,t):null,schemeFitGrade:active?grade(playerSchemeFit(p,t)):'—',roles,seasonProduction:statLine(p.stats),careerProduction:statLine(p.career),developmentNote:active?devStaffNote(p,t):'Career complete',trainingFocus:p.trainingFocus||'Balanced',positionFamiliarity:active?familiarity(p,p.pos):null,wear:p.wear||0,redshirtLabel,academicLabel:active?academicStatusText(p):null,morale:p.morale};
  const clean=playerIdentityPresentationModel.cleanPlayer(raw);return{player:clean,headline:playerIdentityPresentationModel.headline(clean),chips:playerIdentityPresentationModel.statusChips(clean)};
 }
 globalThis.DynastyLabPlayerIdentity={snapshot:identitySnapshot,note:'Read-only player identity presentation. Uses only information already exposed through the canonical player profile, role depth and staff-facing evaluation helpers.'};
}
