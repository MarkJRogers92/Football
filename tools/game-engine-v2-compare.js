const fs=require('fs');
const {loadEngine}=require('./harness.js');
const adapter=require('../game-engine-v2-adapter.js');

const clone=v=>JSON.parse(JSON.stringify(v));
const mean=(xs,key)=>xs.reduce((n,x)=>n+(x[key]||0),0)/Math.max(1,xs.length);
const round=n=>Math.round(n*100)/100;

async function main(){
 const e=loadEngine({seed:41010});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 const u=e.universe,matchups=(u.schedule||[]).slice(0,2).flatMap((games,weekIndex)=>games.map(g=>({g,week:weekIndex+1}))).slice(0,120);
 if(matchups.length<100)throw new Error(`Calibration expected at least 100 early-season matchups; found ${matchups.length}.`);
 const oldRows=[],v2Rows=[];
 for(let i=0;i<matchups.length;i++){
  const {g,week}=matchups[i],home=e.T(g.home),away=e.T(g.away);if(!home||!away)throw new Error('Calibration matchup team missing.');
  const ph=clone(home),pa=clone(away);e.applyGameplanWear(ph,pa.name);e.applyGameplanWear(pa,ph.name);
  const homeProfile=e.gameProfiles(ph,pa.name),awayProfile=e.gameProfiles(pa,ph.name),homeFieldRating=e.homeFieldFor(home)*2;

  const oh=clone(home),oa=clone(away),archiveLen=(u.gameArchive||[]).length,eventLen=(u.events||[]).length,counter=u.gameCounter||0;
  const old=e.gameSim(oh,oa,false,false,{week,label:'V2 calibration'}),box=old.box||{};
  oldRows.push({
   points:(old.hp||0)+(old.ap||0),homePoints:old.hp||0,awayPoints:old.ap||0,
   plays:(box.home?.plays||0)+(box.away?.plays||0),
   yards:(box.home?.passYds||0)+(box.home?.rushYds||0)+(box.away?.passYds||0)+(box.away?.rushYds||0),
   turnovers:(box.home?.turnovers||0)+(box.away?.turnovers||0),
   touchdowns:(box.home?.passTD||0)+(box.home?.rushTD||0)+(box.away?.passTD||0)+(box.away?.rushTD||0),
   fgMade:(box.home?.fgMade||0)+(box.away?.fgMade||0),fgAtt:(box.home?.fgAtt||0)+(box.away?.fgAtt||0),
   punts:(box.home?.punts||0)+(box.away?.punts||0),homeWin:(old.hp||0)>(old.ap||0)?1:0,homeMargin:(old.hp||0)-(old.ap||0),
   profileGap:round(homeProfile.overall-awayProfile.overall),homeFieldRating:round(homeFieldRating)
  });
  if(u.gameArchive)u.gameArchive.length=archiveLen;if(u.events)u.events.length=eventLen;u.gameCounter=counter;

  const shadow=adapter.simulateShadow({gameId:`cal-${week}-${i}-${home.id}-${away.id}`,seed:`v0100-cal-${week}-${i}-${home.id}-${away.id}`,home,away,homeProfile,awayProfile,homeFieldRating}),s=shadow.summary;
  v2Rows.push({
   points:s.totalPoints,homePoints:s.home.points,awayPoints:s.away.points,plays:s.totalPlays,yards:s.home.yards+s.away.yards,
   turnovers:s.home.turnovers+s.away.turnovers,touchdowns:s.home.touchdowns+s.away.touchdowns,
   fgMade:s.home.fieldGoals.made+s.away.fieldGoals.made,fgAtt:s.home.fieldGoals.attempted+s.away.fieldGoals.attempted,
   punts:s.home.punts+s.away.punts,homeWin:shadow.state.score.home>shadow.state.score.away?1:0,homeMargin:shadow.state.score.home-shadow.state.score.away,
   profileGap:round(homeProfile.overall-awayProfile.overall),homeFieldRating:round(homeFieldRating)
  });
 }
 const summarize=rows=>({games:rows.length,meanPoints:round(mean(rows,'points')),meanPlays:round(mean(rows,'plays')),meanYards:round(mean(rows,'yards')),meanTurnovers:round(mean(rows,'turnovers')),meanTouchdowns:round(mean(rows,'touchdowns')),meanFgMade:round(mean(rows,'fgMade')),meanFgAtt:round(mean(rows,'fgAtt')),meanPunts:round(mean(rows,'punts')),homeWinRate:round(mean(rows,'homeWin')),meanHomeMargin:round(mean(rows,'homeMargin')),meanHomeFieldRating:round(mean(rows,'homeFieldRating'))});
 const old=summarize(oldRows),v2=summarize(v2Rows),delta={};
 for(const k of ['meanPoints','meanPlays','meanYards','meanTurnovers','meanTouchdowns','meanFgMade','meanFgAtt','meanPunts','homeWinRate','meanHomeMargin'])delta[k]=round(v2[k]-old[k]);
 const strengthBuckets={favored:{old:[],v2:[]},even:{old:[],v2:[]},underdog:{old:[],v2:[]}};
 for(let i=0;i<oldRows.length;i++){const gap=oldRows[i].profileGap,b=gap>=7?'favored':gap<=-7?'underdog':'even';strengthBuckets[b].old.push(oldRows[i].homeWin);strengthBuckets[b].v2.push(v2Rows[i].homeWin)}
 const sensitivity={};for(const [k,b] of Object.entries(strengthBuckets))sensitivity[k]={games:b.old.length,oldHomeWinRate:round(mean(b.old.map(homeWin=>({homeWin})),'homeWin')),v2HomeWinRate:round(mean(b.v2.map(homeWin=>({homeWin})),'homeWin'))};
 const report={generatedAt:new Date().toISOString(),branch:'codex/v0100-game-engine-2',baselineVersion:e.APP_VERSION,mode:'development-only shadow comparison',matchups:matchups.length,sample:'weeks 1-2, all 120 scheduled games',old,v2,delta,strengthSensitivity:sensitivity,notes:['The v0.9 simulator runs only on cloned team objects. Its temporary archive/event writes are removed after each sample.','The v2 result is never installed into the dynasty.','Home-field input is derived from the current homeFieldFor() value and converted to a bounded matchup-rating edge.','Red-zone finishing is a v2 calibration layer; it changes only shadow play outcomes, not live dynasty results.','These are calibration observations, not release thresholds.']};
 if(!Number.isFinite(v2.meanPoints)||v2.games!==matchups.length)throw new Error('Invalid v2 calibration report.');
 const text=JSON.stringify(report,null,2)+'\n',out=process.argv[2];if(out)fs.writeFileSync(out,text);else process.stdout.write(text);
 console.log(`Compared ${matchups.length} real early-season matchup profiles: old ${old.meanPoints} pts/${old.meanPlays} plays vs v2 ${v2.meanPoints} pts/${v2.meanPlays} plays.`);
}
main().catch(err=>{console.error(err);process.exit(1)});
