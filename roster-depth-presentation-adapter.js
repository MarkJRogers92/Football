function makeRosterDepthPresentationModel(){
 'use strict';
 function cleanPlayer(p){return{id:p.id,name:p.name,pos:p.pos,jerseyNumber:p.jerseyNumber??0,eligibility:p.eligibility??null,height:p.height??null,weight:p.weight??null,style:p.style??null,currentRead:Number.isFinite(Number(p.currentRead))?Number(p.currentRead):null,currentLabel:p.currentLabel??null,upsideLabel:p.upsideLabel??null,health:p.health??null,healthLabel:p.healthLabel??null,injuryWeeks:Number(p.injuryWeeks)||0,redshirtActive:!!p.redshirtActive,academicLabel:p.academicLabel??null,morale:Number.isFinite(Number(p.morale))?Number(p.morale):null,roles:Array.isArray(p.roles)?[...p.roles]:[]}}
 function groups(players=[]){
  const map={};for(const raw of players){const p=cleanPlayer(raw),g=map[p.pos]??={pos:p.pos,players:[],count:0,starters:0,injured:0,redshirts:0};g.players.push(p);g.count++;if(p.roles.length)g.starters++;if(p.injuryWeeks>0)g.injured++;if(p.redshirtActive)g.redshirts++}
  return Object.values(map).map(g=>({...g,players:g.players.sort((a,b)=>(b.currentRead??-1)-(a.currentRead??-1)||a.name.localeCompare(b.name))})).sort((a,b)=>POSITION_ORDER.indexOf(a.pos)-POSITION_ORDER.indexOf(b.pos)||a.pos.localeCompare(b.pos));
 }
 function formation(roles=[],side){return roles.filter(r=>r.side===side&&r.base!==false).map(r=>({id:r.id,label:r.label,side:r.side,active:r.active?cleanPlayer(r.active):null,candidates:(r.candidates||[]).map(x=>({...cleanPlayer(x),fit:x.fit??null,fitGrade:x.fitGrade??null}))}))}
 const POSITION_ORDER=['QB','RB','WR','TE','OT','OG','C','EDGE','DT','LB','CB','S','K','P'];
 return{cleanPlayer,groups,formation,POSITION_ORDER};
}

if(typeof module==='object'&&module.exports){module.exports={makeRosterDepthPresentationModel};}
else{
 const rosterDepthPresentationModel=makeRosterDepthPresentationModel();
 function rosterDepthReady(){return !!universe&&Array.isArray(universe.teams)}
 function presentationRolesForPlayer(t,p){if(!t?.roleDepth)return[];return ROLE_DEFS.filter(r=>(t.roleDepth[r.id]||[])[0]===p.id).map(r=>r.label)}
 function presentationPlayer(t,p){return{id:p.id,name:p.name,pos:p.pos,jerseyNumber:p.jerseyNumber??0,eligibility:eligibilityLabel(p),height:heightStr(p.height),weight:p.weight,style:p.style,currentRead:Number.isFinite(Number(p.perceived))?Math.round(Number(p.perceived)):null,currentLabel:scoutRangeLabel(p,t,false),upsideLabel:scoutRangeLabel(p,t,true),health:p.health,healthLabel:healthText(p),injuryWeeks:p.injuryWeeks||0,redshirtActive:!!p.redshirtActive,academicLabel:academicStatusText(p),morale:p.morale,roles:presentationRolesForPlayer(t,p)};}
 function presentationRole(t,role){if(!t?.roleDepth?.[role.id])return null;const active=roleStarter(t,role.id),candidates=rolePlayers(t,role.id).slice(0,4).map(p=>({...presentationPlayer(t,p),fit:roleFit(p,t,role,true),fitGrade:grade(roleFit(p,t,role,true))}));return{id:role.id,label:role.label,side:role.side,base:!!role.base,active:active?presentationPlayer(t,active):null,candidates};}
 globalThis.DynastyLabRosterDepthView={
  snapshot:()=>{if(!rosterDepthReady())return null;const t=selected?.();if(!t)return null;const players=(t.roster||[]).map(p=>presentationPlayer(t,p)),roles=t.roleDepth?ROLE_DEFS.map(r=>presentationRole(t,r)).filter(Boolean):[];return{team:{id:t.id,name:t.name,offScheme:t.offScheme,defScheme:t.defScheme},players,groups:rosterDepthPresentationModel.groups(players),roles,offense:rosterDepthPresentationModel.formation(roles,'Offense'),defense:rosterDepthPresentationModel.formation(roles,'Defense'),specialTeams:rosterDepthPresentationModel.formation(roles,'Special Teams')};},
  note:'Read-only presentation of staff-visible roster and canonical role-depth state. Assignment actions remain owned by the existing roleDepth controls.'
 };
}
