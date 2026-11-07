// Ceremony milestones read-only bridge. Engine extension: lists this season's real milestones for the
// controlled program (titles, bowl wins, a completed signing day, draft picks). Copies only; no writes,
// no time advance, no randomness.
globalThis.DynastyCeremonySnapshot=Object.freeze({
 read(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;const year=universe.year,out=[];
   const team={id:u.id,name:u.name,conference:u.conference||'',w:u.w||0,l:u.l||0,rank:u.rank&&u.rank<=25?u.rank:null};
   if((universe.confChamps||[]).includes(u.id))out.push({key:`${year}:conference`,kind:'conference',year,team});
   const bowl=(universe.bowls||[]).find(b=>b.winner===u.name||b.loser===u.name);
   if(bowl&&bowl.winner===u.name){const opp=T(bowl.loser);out.push({key:`${year}:bowl`,kind:'bowl',year,team,label:bowl.label,score:[...(bowl.score||[])].sort((a,b)=>b-a),opponent:{id:opp?.id??null,name:bowl.loser}})}
   if(universe.champion===u.name&&(universe.history||[]).some(h=>h.type==='season'&&h.year===year&&h.championId===u.id))out.push({key:`${year}:national`,kind:'national',year,team});
   const rival=rivalOf(u),meet=rival&&(u.schedule||[]).find(g=>g.played&&(g.home===rival.name||g.away===rival.name));
   if(meet&&meet.winner===u.name){const home=meet.home===u.name,sc=meet.score||[0,0],streak=u.rivalry?.series?.streak||1;out.push({key:`${year}:rivalry`,kind:'rivalry',year,team,trophy:u.rivalry?.trophy||null,opponent:{id:rival.id,name:rival.name},score:[Number(sc[home?1:0])||0,Number(sc[home?0:1])||0],streak})}
   const sd=universe.signingDay;
   if(sd&&sd.year===year&&sd.board?.length&&sd.revealed>=sd.board.length){
    const signed=(universe.recruits||[]).filter(r=>r.committed===u.name).sort((a,b)=>(b.stars||0)-(a.stars||0)||(a.rank||999)-(b.rank||999));
    out.push({key:`${year}:signing`,kind:'signing',year,team,count:signed.length,stars:[5,4,3].map(n=>signed.filter(r=>(r.stars||0)===n).length),top:signed.slice(0,5).map(r=>({id:r.id,name:r.name,pos:r.pos,stars:r.stars||0,rank:r.rank||null}))});
   }
   const picks=(universe.draftHistory?.[year]||[]).filter(d=>d.school===u.name&&d.status==='Drafted').sort((a,b)=>(a.round-b.round)||(a.pick-b.pick));
   if(picks.length)out.push({key:`${year}:draft`,kind:'draft',year,team,picks:picks.slice(0,8).map(d=>({playerId:d.playerId,name:d.playerName,pos:d.pos,round:d.round,pick:d.pick,label:d.label}))});
   return{year,teamId:u.id,milestones:out};
  }catch(e){return null}
 }
});
