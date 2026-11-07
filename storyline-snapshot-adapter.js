// Storylines read-only bridge. Engine extension: turns real player records into plain storyline inputs
// (season history, recruit origin, injuries, transfers, school records) and computes the award race with
// week-over-week movement. Copies only: no writes, no time advance, no randomness. Cached per game week.
globalThis.DynastyLabShowPlayer=id=>showPlayerProfile(id);
const STORYLINE_RECORD_STATS={QB:['passYds','passing yards'],RB:['rushYds','rushing yards'],WR:['recYds','receiving yards'],TE:['recYds','receiving yards'],EDGE:['sacks','sacks'],DT:['sacks','sacks'],LB:['tackles','tackles'],CB:['intDef','interceptions'],S:['intDef','interceptions']};
let storylineCache={key:null,value:null};
function storylineSchoolRecords(){
 // Best career total per school and stat across archived players (career totals are final for them).
 const best={};
 for(const a of universe.playerArchive||[]){const def=STORYLINE_RECORD_STATS[a.pos];if(!def||!a.lastTeam)continue;const [k]=def,v=(a.career?.[k]||0);const key=`${a.lastTeam}|${k}`;if(v>(best[key]?.value||0))best[key]={value:v,holder:a.name}}
 return best;
}
function storylinePlayer(p,t,ctx){
 const P=globalThis.DynastyPlayerStories,prod=x=>P?.productionScore?.(x)||0;
 const stars=Number((String(p.origin||'').match(/^(\d)-star/)||[])[1])||null;
 const seasons=(p.seasonHistory||[]).slice().sort((a,b)=>a.year-b.year).map(s=>({year:s.year,team:s.team,rating:Number.isFinite(Number(s.rating))?Number(s.rating):null,games:s.games||0,starts:s.starts||0,production:prod({pos:s.pos||p.pos,stats:s})}));
 const tr=(p.transferHistory||[]).filter(h=>h.toSchoolId===t.id).at(-1);
 const def=STORYLINE_RECORD_STATS[p.pos];let record=null;
 if(def){const [k,label]=def,total=(p.career?.[k]||0)+(p.stats?.[k]||0),r=ctx.records[`${t.name}|${k}`];if(r&&total>0)record={label,total,value:r.value,holder:r.holder}}
 return{id:p.id,name:p.name,pos:p.pos,team:t.name,teamId:t.id,eligibility:eligibilityLabel(p),stars,redshirtUsed:!!p.redshirtUsed,injuryWeeks:p.injuryWeeks||0,
  seasons,current:{year:universe.year,games:p.stats?.games||0,starts:p.stats?.starts||0,production:prod(p),line:P?.statLine?.(p)||'',rating:Number.isFinite(Number(p.perceived))?Number(p.perceived):null},
  injuries:(p.injuryHistory||[]).map(i=>({year:i.year,week:i.week,weeks:i.weeks,type:i.type})),
  transfer:tr?{season:tr.season,from:tr.fromSchool}:null,record,teamPosRank:ctx.posRank.get(p.id)||null,nationalPosRank:ctx.national?.get(p.id)||null,award:ctx.awards.get(p.id)||null};
}
function storylinePosRanks(t){const m=new Map(),P=globalThis.DynastyPlayerStories,groups={};for(const p of t.roster||[])(groups[p.pos]??=[]).push(p);for(const list of Object.values(groups))list.map(p=>({p,v:P?.productionScore?.(p)||0})).filter(x=>x.v>0).sort((a,b)=>b.v-a.v).forEach((x,i)=>m.set(x.p.id,i+1));return m}
// Award race: the top five by the game's own award score, and movement since last week (the same score
// with this week's game line taken back out, ranked among the current contenders).
function storylineAwardRace(u){
 if(!(universe.week>=2)||universe.phase==='preseason')return[];
 const all=allActivePlayers(),lastWeek=universe.week,lastLines=new Map();
 for(const g of universe.gameArchive||[])if((g.season??universe.year)===universe.year&&g.week===lastWeek)for(const side of ['home','away'])for(const line of g.playerStats?.[side]||[])lastLines.set(line.id,{stats:line.stats||{},won:(g.winner??null)});
 const minus=(x)=>{const l=lastLines.get(x.p.id);if(!l)return seasonScore(x.p,x.t);const s={...x.p.stats};for(const [k,v] of Object.entries(l.stats))if(typeof v==='number')s[k]=(s[k]||0)-v;const won=l.won===x.t.name;return seasonScore({...x.p,stats:s},{...x.t,w:Math.max(0,(x.t.w||0)-(won?1:0))})};
 const races=[['Player of the Year',all],['Offensive Player of the Year',all.filter(x=>OFF_POS.has(x.p.pos)&&!['K','P'].includes(x.p.pos))],['Defensive Player of the Year',all.filter(x=>!OFF_POS.has(x.p.pos))],['Freshman of the Year',all.filter(x=>eligibilityBase(x.p)===0&&!x.p.redshirtActive)]];
 return races.map(([name,list])=>{const now=list.map(x=>({x,s:seasonScore(x.p,x.t)})).sort((a,b)=>b.s-a.s).slice(0,25);const prevRank=new Map(now.map(r=>({id:r.x.p.id,s:minus(r.x)})).sort((a,b)=>b.s-a.s).map((r,i)=>[r.id,i+1]));
  return{name,top:now.slice(0,5).map((r,i)=>({id:r.x.p.id,name:r.x.p.name,pos:r.x.p.pos,team:r.x.t.name,mine:r.x.t.id===u.id,rank:i+1,move:(prevRank.get(r.x.p.id)||i+1)-(i+1)}))}});
}
globalThis.DynastyStorylineSnapshot=Object.freeze({
 read(){
  try{
   if(!universe?.teams)return null;const u=selected();if(!u)return null;
   const key=[universe.year,universe.week,universe.phase,u.id,universe.gameCounter||0,(universe.playerArchive||[]).length].join(':');
   if(storylineCache.key===key)return storylineCache.value;
   const P=globalThis.DynastyPlayerStories,records=storylineSchoolRecords(),race=storylineAwardRace(u),awards=new Map();
   for(const a of race)for(const c of a.top)if(!awards.has(c.id)||awards.get(c.id).rank>c.rank)awards.set(c.id,{name:a.name,rank:c.rank,move:c.move});
   // National production rank within each position (top 10 only), from the same production scale. Skill and
   // defensive positions only: kickers, punters and linemen have no meaningful production line.
   const national=new Map(),byPos={};for(const t of universe.teams)for(const p of t.roster||[]){if(!STORYLINE_RECORD_STATS[p.pos])continue;const v=P?.productionScore?.(p)||0;if(v>0)(byPos[p.pos]??=[]).push({id:p.id,v})}
   for(const list of Object.values(byPos))list.sort((a,b)=>b.v-a.v).slice(0,10).forEach((x,i)=>national.set(x.id,i+1));
   const team=(u.roster||[]).map(p=>storylinePlayer(p,u,{records,posRank:storylinePosRanks(u),awards,national}));
   // League: only players with real production or award standing are candidates, from every other program.
   const league=[];
   for(const t of universe.teams){if(t.id===u.id)continue;let ranks=null;for(const p of t.roster||[]){if(!awards.has(p.id)&&!national.has(p.id)&&(P?.productionScore?.(p)||0)<8)continue;ranks??=storylinePosRanks(t);league.push(storylinePlayer(p,t,{records,posRank:ranks,awards,national}))}}
   const value={year:universe.year,week:universe.week,signature:key,team,league,race:race.filter(a=>a.top.length).slice(0,2)};
   storylineCache={key,value};return value;
  }catch(e){return null}
 }
});
