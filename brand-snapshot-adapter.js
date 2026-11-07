// Brand visuals read-only bridge. Engine extension: shares app.js's closure so the presentation layer
// (brand-visuals.js) can draw charts from real game state without reaching into the universe itself.
// Every value is copied out; nothing here writes to the universe, advances time or draws randomness.
function brandPostseasonTag(label){label=String(label||'');return /National Championship/.test(label)?'TITLE':/Semifinal/.test(label)?'SF':/Quarterfinal/.test(label)?'QF':/Round of 16/.test(label)?'R16':/\bBowl\b/.test(label)?'BOWL':/Championship/.test(label)?'CCG':'POST'}
function brandSnapshotTeam(t){
 if(!t)return null;
 const goals=t.seasonGoalsYear===universe.year&&Array.isArray(t.seasonGoals)&&t.seasonGoals.length?evaluateSeasonGoals(t,false):null;
 const schedule=(t.schedule||[]).slice().sort((a,b)=>(a.week||0)-(b.week||0)).map(g=>{
  const home=g.home===t.name,oppName=home?g.away:g.home,opp=T(oppName);
  const score=Array.isArray(g.score)?g.score:null,us=score?Number(score[home?1:0])||0:null,them=score?Number(score[home?0:1])||0:null;
  return{week:Number(g.week)||0,home,conf:!!g.conf,played:!!g.played,result:g.played?(g.winner===t.name?'W':'L'):null,us,them,
   opponent:{id:opp?.id??null,name:oppName||'TBD',rank:opp?.rank&&opp.rank<=25?opp.rank:null}};
 });
 // Postseason games are archived rather than scheduled; append this season's to the strip so a
 // title run reads as one story instead of stopping at Week 12.
 for(const r of universe.gameArchive||[]){
  if((r?.season??universe.year)!==universe.year||!r?.label||!(Number(r.week)>12))continue;
  const side=r.home?.name===t.name?'home':r.away?.name===t.name?'away':null;if(!side)continue;
  const oppSide=side==='home'?'away':'home',oppName=r[oppSide]?.name||'TBD',opp=T(oppName),us=Number(r.score?.[side])||0,them=Number(r.score?.[oppSide])||0;
  schedule.push({week:Number(r.week),home:side==='home',conf:false,played:true,result:us>them?'W':'L',us,them,post:brandPostseasonTag(r.label),postLabel:String(r.label),
   opponent:{id:opp?.id??r[oppSide]?.id??null,name:oppName,rank:opp?.rank&&opp.rank<=25?opp.rank:null}});
 }
 schedule.sort((a,b)=>a.week-b.week||(a.post==='BOWL')-(b.post==='BOWL'));
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
