// Rival Watch read-only bridge. Engine extension: copies the primary rival's head coach, the rivalry
// series and the recruiting races other programs lead for your targets out of the universe.
// It never writes state, advances time or draws randomness.
function rivalSnapshotCoach(team){
 const c=team?.staff?.HC;if(!c)return null;
 return{id:c.id,name:c.name,age:Number(c.age)||null,recruiting:Number(c.recruiting)||0,development:Number(c.development)||0,evaluation:Number(c.evaluation)||0,playCall:Number(c.playCall)||0,ambition:Number(c.ambition)||0,loyalty:Number(c.loyalty)||0};
}
function rivalSnapshotTeam(team){return team?{id:team.id,name:team.name,w:team.w||0,l:team.l||0,rank:team.rank&&team.rank<=25?team.rank:null,prestige:Number(team.prestige)||0}:null}
globalThis.DynastyRivalSnapshot=Object.freeze({
 read(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;
   const rival=rivalOf(u),s=u.rivalry?.series||null;
   const meeting=rival?(u.schedule||[]).find(g=>(g.home===rival.name||g.away===rival.name)):null;
   let lastMeeting=null;
   if(meeting?.played){const home=meeting.home===u.name,sc=meeting.score||[0,0];lastMeeting={year:universe.year,won:meeting.winner===u.name,us:Number(sc[home?1:0])||0,them:Number(sc[home?0:1])||0}}
   const battles=globalThis.DynastyLabRecruitingBattles;
   const races=(universe.recruits||[]).filter(r=>r.targeted&&!r.committed).map(r=>{const sum=battles?.summary?.(r);return sum&&sum.leader&&sum.leader!==u.name?{recruitId:r.id,recruit:r.name,pos:r.pos,stars:r.stars||0,leader:sum.leader,gap:sum.gap,label:sum.label}:null}).filter(Boolean)
    .sort((a,b)=>(b.stars-a.stars)||((a.gap??-99)-(b.gap??-99)));
   const recruiters=[...new Set(races.map(x=>x.leader))].slice(0,3).map(name=>{const t=T(name);return{team:rivalSnapshotTeam(t),coach:rivalSnapshotCoach(t),races:races.filter(x=>x.leader===name).slice(0,3)}}).filter(x=>x.team&&x.coach);
   return{
    year:universe.year,week:universe.week,phase:universe.phase,
    user:rivalSnapshotTeam(u),
    rival:rival?{team:rivalSnapshotTeam(rival),coach:rivalSnapshotCoach(rival),trophy:u.rivalry?.trophy||null,
     series:s?{w:s.w||0,l:s.l||0,streak:s.streak||0}:null,
     meeting:meeting?{week:Number(meeting.week)||null,home:meeting.home===u.name,played:!!meeting.played}:null,lastMeeting,
     racesLed:races.filter(x=>x.leader===rival.name).slice(0,3)}:null,
    recruiters
   };
  }catch(e){return null}
 }
});
