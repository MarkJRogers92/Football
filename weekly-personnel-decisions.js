// v0.10.2 Slice 2 — selective starter-pressure / rotation decisions.
function v0102PersonnelGroups(t){
  ensureDepth(t);const positions=['QB','RB','WR','TE','EDGE','DT','LB','CB','S'],rows=[];
  for(const pos of positions){const ids=t.depthChart?.[pos]||[],starter=t.roster.find(p=>p.id===ids[0]),challenger=t.roster.find(p=>p.id===ids[1]);if(!starter||!challenger||starter.redshirtActive||challenger.redshirtActive||(starter.injuryWeeks||0)>0||(challenger.injuryWeeks||0)>0)continue;
    rows.push({pos,starter:{id:starter.id,name:starter.name,grade:starter.perceived??starter.trueNow??60,upside:starter.perceivedUpside??starter.upside??60,year:starter.year,stats:starter.stats||{}},challenger:{id:challenger.id,name:challenger.name,grade:challenger.perceived??challenger.trueNow??60,upside:challenger.perceivedUpside??challenger.upside??60,year:challenger.year,stats:challenger.stats||{}}})
  }return rows
}
function v0102StarterChallenge(t){return globalThis.DynastyWeeklyCoaching?.selectStarterChallenge(v0102PersonnelGroups(t))||null}
function v0102BumpRolePackage(t,p){
  ensureRoleDepth(t);for(const role of ROLE_DEFS){if(!role.eligible.includes(p.pos))continue;const arr=t.roleDepth?.[role.id]||[],i=arr.indexOf(p.id);if(i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]]}
}
function v0102StarterChallengeDecision(t,challenge){
  const rec=challenge.recommendation,key=`${challenge.starterId}_${challenge.challengerId}`;
  return decisionRecord('STARTER_CHALLENGE',t,challenge.challengerId,`${challenge.pos} room — starter pressure`,`${challenge.reason} Staff recommends ${rec==='promote'?'a change at the top':rec==='split'?'a larger rotation':'holding the current order'}.`,[
    decisionOption('stay',`Keep ${challenge.starterName} on top`,'Keep the current depth order and make the challenger earn another week.',rec==='stay'),
    decisionOption('split','Expand the rotation',`Give ${challenge.challengerName} a larger package without fully changing the starter.`,rec==='split'),
    decisionOption('promote',`Promote ${challenge.challengerName}`,`Move ${challenge.challengerName} ahead of ${challenge.starterName} in the current depth order.`,rec==='promote')],{playerId:challenge.challengerId,starterId:challenge.starterId,pos:challenge.pos,recommendedOption:rec,challengeKey:key},84)
}
const ensureWeeklyDecisionsBeforePersonnelV0102=ensureWeeklyDecisions;
ensureWeeklyDecisions=function ensureWeeklyDecisionsWithPersonnel(t=selected()){
  const current=ensureWeeklyDecisionsBeforePersonnelV0102(t);if(!t||universe.phase!=='regular'||universe.week>=12||v2InteractiveGameDay||current.length>=3||current.some(d=>d.type==='STARTER_CHALLENGE'))return current;
  const challenge=v0102StarterChallenge(t);if(!challenge)return current;const key=`${challenge.starterId}_${challenge.challengerId}`;
  if(decisionRecent('STARTER_CHALLENGE',key,2)||current.some(d=>[challenge.starterId,challenge.challengerId].includes(d.playerId)))return current;
  const d=v0102StarterChallengeDecision(t,challenge);universe.weeklyDecisions.push(d);return[...current,d]
};
const resolveWeeklyDecisionBeforePersonnelV0102=resolveWeeklyDecision;
resolveWeeklyDecision=function resolveWeeklyDecisionWithPersonnel(id,optionId){
  const d=(universe.weeklyDecisions||[]).find(x=>x.id===id);if(d?.type!=='STARTER_CHALLENGE')return resolveWeeklyDecisionBeforePersonnelV0102(id,optionId);
  const t=universe.teams.find(x=>x.id===d.teamId),option=d.options?.find(x=>x.id===optionId),challenger=t?.roster.find(x=>x.id===d.playerId),starter=t?.roster.find(x=>x.id===d.starterId);if(!t||!option||!challenger||!starter||d.resolved)return false;
  if(option.id==='stay'){starter.staffTrust=clamp((starter.staffTrust??70)+1,0,100);challenger.morale=clamp((challenger.morale??70)-1,15,99)}
  else if(option.id==='split'){challenger.role='Rotation';challenger.morale=clamp((challenger.morale??70)+3,15,99);challenger.staffTrust=clamp((challenger.staffTrust??70)+2,0,100);v0102BumpRolePackage(t,challenger)}
  else if(option.id==='promote'){starter.role='Rotation';challenger.role='Starter';promoteRotationPlayer(t,challenger);challenger.morale=clamp((challenger.morale??70)+5,15,99);challenger.staffTrust=clamp((challenger.staffTrust??70)+3,0,100);starter.morale=clamp((starter.morale??70)-3,15,99)}
  d.resolved=true;d.resolvedOptionId=option.id;d.resolvedSeason=universe.year;d.resolvedWeek=universe.week;addWeeklyDecisionEvent(d,option,t);setStatus(`Personnel decision recorded: ${option.label}.`);render();return true
};
if(globalThis.__DL_TEST__){
  globalThis.__DL_TEST__.weeklyPersonnelDebug=()=>{const t=selected(),c=t?v0102StarterChallenge(t):null;return{candidate:c,decision:(universe.weeklyDecisions||[]).find(d=>d.season===universe.year&&d.week===universe.week&&d.teamId===t?.id&&d.type==='STARTER_CHALLENGE')||null}};
  globalThis.__DL_TEST__.weeklyPersonnelForceFixture=()=>{const t=selected();if(!t)return null;ensureDepth(t);const ids=t.depthChart?.QB||[],starter=t.roster.find(p=>p.id===ids[0]),challenger=t.roster.find(p=>p.id===ids[1]);if(!starter||!challenger)return null;starter.redshirtActive=false;challenger.redshirtActive=false;starter.injuryWeeks=0;challenger.injuryWeeks=0;starter.stats={...(starter.stats||{}),passAtt:100,passComp:48,int:7};challenger.perceived=clamp((starter.perceived??starter.trueNow??70)+3,30,99);challenger.perceivedUpside=clamp(Math.max(challenger.perceived+4,(starter.perceivedUpside??starter.upside??75)+5),challenger.perceived,99);universe.weeklyDecisions=(universe.weeklyDecisions||[]).filter(d=>!(d.season===universe.year&&d.week===universe.week&&d.teamId===t.id));const challenge=v0102StarterChallenge(t);if(!challenge)return null;const decision=v0102StarterChallengeDecision(t,challenge);universe.weeklyDecisions.push(decision);render();return{id:decision.id,starterId:decision.starterId,challengerId:decision.playerId,pos:decision.pos,recommendedOption:decision.recommendedOption}};
  globalThis.__DL_TEST__.weeklyPersonnelDepth=(pos='QB')=>{const t=selected();ensureDepth(t);return[...(t?.depthChart?.[pos]||[])]};
}
