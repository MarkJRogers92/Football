// Brand visuals read-only bridge. Engine extension: shares app.js's closure so the presentation layer
// (brand-visuals.js) can draw charts from real game state without reaching into the universe itself.
// Every value is copied out; nothing here writes to the universe, advances time or draws randomness.
function brandSnapshotTeam(t){
 if(!t)return null;
 const goals=t.seasonGoalsYear===universe.year&&Array.isArray(t.seasonGoals)&&t.seasonGoals.length?evaluateSeasonGoals(t,false):null;
 const schedule=(t.schedule||[]).slice().sort((a,b)=>(a.week||0)-(b.week||0)).map(g=>{
  const home=g.home===t.name,oppName=home?g.away:g.home,opp=T(oppName);
  const score=Array.isArray(g.score)?g.score:null,us=score?Number(score[home?1:0])||0:null,them=score?Number(score[home?0:1])||0:null;
  return{week:Number(g.week)||0,home,conf:!!g.conf,played:!!g.played,result:g.played?(g.winner===t.name?'W':'L'):null,us,them,
   opponent:{id:opp?.id??null,name:oppName||'TBD',rank:opp?.rank&&opp.rank<=25?opp.rank:null}};
 });
 return{
  id:t.id,name:t.name,conference:t.conference||'',w:t.w||0,l:t.l||0,cw:t.cw||0,cl:t.cl||0,
  rank:t.rank&&t.rank<999?t.rank:null,
  confidence:Number.isFinite(Number(t.adminConfidence))?Number(t.adminConfidence):null,
  confidenceLabel:Number.isFinite(Number(t.adminConfidence))?adminConfidenceLabel(Number(t.adminConfidence)):null,
  expectedWins:seasonExpectation(t),
  attributes:[['Prestige',t.prestige],['Resources',t.resources],['NIL',t.nil],['Development',t.development],['Facilities',t.facilities],['Academics',t.academics]].map(([label,value])=>({label,value:Number(value)||0})),
  goals:goals?{completed:goals.completed,total:goals.total,atRisk:goals.atRisk}:null,
  schedule
 };
}
globalThis.DynastyBrandSnapshot=Object.freeze({
 team(){try{if(!universe?.teams)return null;return brandSnapshotTeam(selected())}catch(e){return null}},
 year(){return universe?.year??null},
 week(){return universe?.week??null},
 phase(){return universe?.phase??null}
});
