// Legacy read-only bridge. Engine extension: the facts that achievements, cross-save records, the hall of
// fame and challenges are judged on, copied out of the current dynasty. No writes, no time advance, no
// randomness; the legacy store itself lives outside the save (see legacy.js).
globalThis.DynastyLegacySnapshot=Object.freeze({
 read(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;
   const tenure=universe.tenure||{startYear:universe.year,school:u.name,seasons:[]};
   const coach=u.staff?.HC?.name||'Head coach';
   const seasons=(tenure.seasons||[]).map(s=>({year:s.year,w:s.w||0,l:s.l||0,champ:(universe.history||[]).some(h=>h.type==='season'&&h.year===s.year&&(h.championId!=null?h.championId===u.id:h.champion===u.name)),confChamp:!!s.confChamp}));
   const finalPhase=universe.phase==='complete'||(universe.history||[]).some(h=>h.type==='season'&&h.year===universe.year);
   const awards=[];for(const [year,list] of Object.entries(universe.awards||{}))for(const a of list||[])if(a.team===u.name&&a.playerId)awards.push({year:Number(year),award:a.name,playerId:a.playerId,name:a.playerName,pos:a.pos});
   const picks=[];for(const [year,list] of Object.entries(universe.draftHistory||{}))for(const d of list||[])if(d.school===u.name&&d.status==='Drafted')picks.push({year:Number(year),playerId:d.playerId,name:d.playerName,pos:d.pos,round:d.round,pick:d.pick});
   const s=u.rivalry?.series||null,rival=rivalOf(u);
   const signed=(universe.recruits||[]).filter(r=>r.committed===u.name);
   return{
    key:`${tenure.school||u.name}|${tenure.startYear??universe.year}|${coach}`,
    year:universe.year,week:universe.week,phase:universe.phase,coach,
    program:{id:u.id,name:u.name,prestige:Number(u.prestige)||0,conference:u.conference||''},
    current:{w:u.w||0,l:u.l||0,champ:universe.champion===u.name,confChamp:(universe.confChamps||[]).includes(u.id),bowlWon:!!(u.bowlResult?.won&&u.bowlResult.year===universe.year),regularDone:finalPhase},
    seasons,rival:rival?{name:rival.name,w:s?.w||0,l:s?.l||0,streak:s?.streak||0}:null,
    adminConfidence:Number(u.adminConfidence)||0,
    signedFiveStars:signed.filter(r=>(r.stars||0)>=5).length,signedCount:signed.length,
    awards,picks
   };
  }catch(e){return null}
 }
});
