// app/08-game-sim-awards-draft.js: Game simulation, awards, records and the draft. Part of app.js; see tools/app-source.js.
// Quick-simulated league games. A zero-sum 'game flow' swing between the two teams (plus a small independent form
// factor on yardage) gives the one-score/blowout mix of the live Game Engine 2 (mean margin ~13 against 9 before),
// and the larger rating-edge term keeps the better team winning about as often as it does there.
const QUICK_SIM_FLOW_SD=.32,QUICK_SIM_FORM_SD=.08,QUICK_SIM_EDGE_TD=.5;
function gameSim(home,away,neutral=false,confOverride=null,context={}){
 const before=beginGame(home,away,neutral,context),H=gameProfiles(home,away.name),A=gameProfiles(away,home.name);
 const flow=gauss()*QUICK_SIM_FLOW_SD;
 function side(O,D,team,scheme,sign){
  const plays=clamp(Math.round(60+(scheme.pace-68)*.10+gauss()*4),52,72),passRate=clamp(scheme.pass+(O.qb-D.coverage)*.0012,.25,.64),passAtt=Math.round(plays*passRate),pressure=clamp(.13+(D.front-O.ol)*.0035+(DEF_SCHEMES[(team===home?away:home).defScheme].pressure-70)*.001+(D.prepPressure||0),.06,.30),sacksTaken=Math.round(passAtt*pressure*rng(.18,.34)),intRate=clamp(.018+(D.coverage-O.qb)*.0008,.008,.052),ints=Math.min(4,Math.round(passAtt*intRate+rng(-.25,.65))),compPct=clamp(.61+(O.qb-D.coverage)*.0032+gauss()*.025,.43,.78),passComp=clamp(Math.round(passAtt*compPct),0,passAtt-ints),form=clamp(flow*sign+gauss()*QUICK_SIM_FORM_SD,-.5,.5),ypc=clamp(9.8+(O.skill-D.coverage)*.045+gauss()*.7,7.0,13.8),passYds=Math.max(40,Math.round(passComp*ypc*(1+form))),rushAtt=Math.max(15,plays-passAtt-sacksTaken),ypcRush=clamp(4.15+(O.ol-D.front)*.035+(O.skill-D.front)*.015+gauss()*.35,2.5,7.0),rushYds=Math.max(25,Math.round(rushAtt*ypcRush*(1+form))),totalYds=passYds+rushYds,edge=(O.offense-D.defense)/12,tds=clamp(Math.round(totalYds/128+edge*QUICK_SIM_EDGE_TD+gauss()*.75),0,7),passTD=clamp(Math.round(tds*clamp(passRate+rng(-.10,.10),.25,.82)),0,tds),rushTD=tds-passTD,fgAtt=clamp(Math.round(1.55+(totalYds-300)/240+gauss()*.7),0,5),fg=quickFieldGoals(team,fgAtt,O,D),fumblesLost=gameplayRandom()<clamp(.45+(D.front-O.skill)*.01,.18,.80)?1:0,pts=tds*7+fg*3,firstDowns=Math.round(totalYds/18+rng(-2,3)),punts=clamp(Math.round(5.4-(tds+fg)*.42+gauss()*1.1),1,9);
  return {pts,plays,firstDowns,passAtt,passComp,passYds,passTD,int:ints,sacksTaken,rushAtt,rushYds,rushTD,fumblesLost,turnovers:ints+fumblesLost,recYds:passYds,recTD:passTD,fgMade:fg,fgAtt,punts};
 }
 const hs=side(H,A,home,OFF_SCHEMES[home.offScheme],1),as=side(A,H,away,OFF_SCHEMES[away.offScheme],-1);let hp=hs.pts+homeFieldScoreBonus(home,neutral),ap=as.pts;if(hp===ap)(gameplayRandom()<.5?()=>hp+=3:()=>ap+=3)();const conf=confOverride??home.conference===away.conference,win=recordGame(home,away,hp,ap,conf,H,A);applyGameStats(home,hs,as);applyGameStats(away,as,hs);postGameCondition(home);postGameCondition(away);return finishGame(before,home,away,{home:home.name,away:away.name,hp,ap,winner:win.name,box:{home:hs,away:as}});
}
function detailedDriveCount(homeScheme,awayScheme,noise=gauss()){
 const averagePace=((homeScheme?.pace??68)+(awayScheme?.pace??68))/2;
 return clamp(Math.round(22+(averagePace-68)*.13+noise*2),18,30);
}
function detailedGame(home,away,neutral=false,confOverride=null,context={}){
 const before=beginGame(home,away,neutral,context),drives=[];
 const H=gameProfiles(home,away.name),A=gameProfiles(away,home.name),hScheme=OFF_SCHEMES[home.offScheme],aScheme=OFF_SCHEMES[away.offScheme],log=[];
 const totals={home:{plays:0,firstDowns:0,passAtt:0,passComp:0,passYds:0,passTD:0,int:0,rushAtt:0,rushYds:0,rushTD:0,recYds:0,recTD:0,sacksTaken:0,fumblesLost:0,turnovers:0,fgMade:0,fgAtt:0,punts:0},away:{plays:0,firstDowns:0,passAtt:0,passComp:0,passYds:0,passTD:0,int:0,rushAtt:0,rushYds:0,rushTD:0,recYds:0,recTD:0,sacksTaken:0,fumblesLost:0,turnovers:0,fgMade:0,fgAtt:0,punts:0}};
 const exact={home:new Map(),away:new Map()},exactDef={home:new Map(),away:new Map()};
 function drive(off,def,O,D,scheme,out,label,actors,defenders){let pos=25,down=1,toGo=10,plays=0,last=null;const qb=starter(off,'QB'),oc=off.staff.OC,dc=def.staff.DC;while(plays<16){plays++;out.plays++;let pass=scheme.pass+(down===3?.18:0)+(toGo>=8?.09:0)-(toGo<=2?.13:0),pen=gameplayRandom()<.045;if(pen){if(gameplayRandom()<.65){pos=Math.max(1,pos-5);toGo+=5;log.push(`${label}: ${off.name} false start; backed up five.`)}else{pos=Math.min(99,pos+5);toGo=Math.max(1,toGo-5);log.push(`${label}: defensive penalty gives ${off.name} five.`)}continue}
 const isPass=gameplayRandom()<pass;if(isPass){
  const target=weightedPlayer(receivingShares(off))||starter(off,'WR'),qs=exactOffenseLine(actors,qb),ts=exactOffenseLine(actors,target),pressure=clamp(.17+(D.front-O.ol)*.005+(DEF_SCHEMES[def.defScheme].pressure-70)*.0015+(dc.playCall-70)*.001-(oc.playCall-70)*.0008+(D.prepPressure||0),.08,.48),pressured=gameplayRandom()<pressure,rushDef=pressured?(defensiveActor(def,'rush',['EDGE','DT','LB'])||starter(def,'EDGE')):null,rushStats=rushDef?exactDefenseLine(defenders,rushDef):null;
  if(rushStats)rushStats.pressures++;
  if(pressured&&gameplayRandom()<.28){let loss=gi(3,10);pos=Math.max(1,pos-loss);out.sacksTaken++;qs.sacksTaken++;rushStats.sacks++;rushStats.tackles++;rushStats.tfl++;down++;toGo+=loss;last=null;log.push(`${label}: ${rushDef.name} sacks ${qb.name} for ${loss}.`)}
  else{out.passAtt++;qs.passAtt++;ts.targets++;let intP=clamp(.027+(D.coverage-O.qb)*.0014+(75-qb.iq)*.0007+(pressured?.009:0),.008,.09);if(gameplayRandom()<intP){const thief=defensiveActor(def,'takeaway',['CB','S','LB'])||starter(def,'CB'),ds=exactDefenseLine(defenders,thief);out.int++;out.turnovers++;qs.int++;ds.intDef++;log.push(`${label}: ${thief.name} intercepts ${qb.name} targeting ${target.name} near the ${Math.min(99,pos+gi(5,22))}.`);return {points:0,result:'INT',plays}}let comp=clamp(.61+(O.qb-D.coverage)*.004+(qb.technique-70)*.0015+(target.technique-70)*.0007-(pressured?.07:0),.38,.81);if(gameplayRandom()<comp){let y=Math.round(clamp(7+(O.skill-D.coverage)/8+gauss()*6,0,38));if(gameplayRandom()<.055+(qb.speed+target.speed-140)*.0005)y+=gi(12,38);pos+=y;out.passComp++;out.passYds+=y;out.recYds+=y;qs.passComp++;qs.passYds+=y;ts.receptions++;ts.recYds+=y;ts.yac+=Math.round(y*rng(.25,.48));last={type:'pass',qs,ts};const tackler=pos<100?(defensiveActor(def,'tackle')||starter(def,'LB')):null;if(tackler)exactDefenseLine(defenders,tackler).tackles++;if(y>=toGo){out.firstDowns++;down=1;toGo=Math.min(10,100-pos)}else{down++;toGo-=y}log.push(`${label}: ${qb.name} to ${target.name} for ${y}${tackler?`; tackle by ${tackler.name}`:''}.`)}else{const dropped=gameplayRandom()<clamp((90-target.technique)/250,0,.15);if(dropped)ts.drops++;const cover=!dropped&&gameplayRandom()<.35?(defensiveActor(def,'coverage',['CB','S','LB'])||starter(def,'CB')):null;if(cover)exactDefenseLine(defenders,cover).passBreakups++;last=null;down++;log.push(`${label}: ${qb.name} incomplete for ${target.name}${cover?`; broken up by ${cover.name}`:''}.`)}}
 }
 else{const rusher=weightedPlayer(rushingShares(off))||starter(off,'RB'),rs=exactOffenseLine(actors,rusher);out.rushAtt++;rs.rushAtt++;let runEdge=(O.ol*.38+O.skill*.25+rusher.power*.15+rusher.speed*.12+oc.playCall*.10)-(D.front*.60+DEF_SCHEMES[def.defScheme].run*.20+dc.playCall*.20),y=Math.round(clamp(3.7+runEdge/20+gauss()*3.2,-4,24));if(gameplayRandom()<.045+Math.max(0,rusher.speed-82)*.001)y+=gi(10,32);pos+=y;out.rushYds+=y;rs.rushYds+=y;last={type:'run',rs};const tackler=pos<100?(defensiveActor(def,'tackle')||starter(def,'LB')):null;if(tackler){const ds=exactDefenseLine(defenders,tackler);ds.tackles++;if(y<0)ds.tfl++}if(y>=toGo){out.firstDowns++;down=1;toGo=Math.min(10,100-pos)}else{down++;toGo=Math.max(1,toGo-y)}log.push(`${label}: ${rusher.name} ${rusher===qb?'keeps':'runs'} for ${y}${tackler?`; tackle by ${tackler.name}`:''}.`)}
 if(pos>=100){if(last?.type==='pass'){out.passTD++;out.recTD++;last.qs.passTD++;last.ts.recTD++}else{out.rushTD++;if(last?.rs)last.rs.rushTD++}log.push(`${label}: TOUCHDOWN ${off.name}.`);return {points:7,result:'TD',plays}}
 if(down>=4){if(pos>=62){const dist=117-pos,k=roleStarter(off,'K1')||starter(off,'K'),pct=fieldGoalChance(k,dist,true);out.fgAtt++;if(gameplayRandom()<pct){out.fgMade++;log.push(`${label}: ${k.name} field goal good from ${Math.round(dist)}.`);return {points:3,result:'FG',plays}}log.push(`${label}: ${k.name} misses the field goal from ${Math.round(dist)}.`);return {points:0,result:'MISS',plays}}const p=roleStarter(off,'P1')||starter(off,'P');out.punts++;log.push(`${label}: ${p.name} punts.`);return {points:0,result:'PUNT',plays}}
 }return {points:0,result:'END',plays}}
 let hp=0,ap=0;const driveCount=detailedDriveCount(hScheme,aScheme),openingSide=gameplayRandom()<.5?'home':'away',sideCounts={home:0,away:0};for(let i=0;i<driveCount;i++){const side=i%2?(openingSide==='home'?'away':'home'):openingSide,isHome=side==='home',label=`${isHome?'H':'A'}${++sideCounts[side]}`,logStart=log.length,d=drive(isHome?home:away,isHome?away:home,isHome?H:A,isHome?A:H,isHome?hScheme:aScheme,totals[side],label,exact[side],exactDef[isHome?'away':'home']);d.playByPlay=log.slice(logStart).map(x=>x.startsWith(label+': ')?x.slice(label.length+2):x);if(isHome)hp+=d.points;else ap+=d.points;drives.push({side,label,...d})}hp+=homeFieldScoreBonus(home,neutral);if(hp===ap){log.push('Overtime required.');if(gameplayRandom()<.5)hp+=3;else ap+=3}const conf=confOverride??home.conference===away.conference,win=recordGame(home,away,hp,ap,conf,H,A);totals.home.pts=hp;totals.away.pts=ap;applyGameStats(home,totals.home,totals.away,exact.home,exactDef.home);applyGameStats(away,totals.away,totals.home,exact.away,exactDef.away);postGameCondition(home);postGameCondition(away);return finishGame(before,home,away,{home:home.name,away:away.name,hp,ap,winner:win.name,log:log.slice(-160),box:totals,detailed:true,drives});
}
function seasonScore(p,t){let s=p.stats||{},teamBonus=(t?.w||0)*1.5,base=p.perceived*.12;if(p.pos==='QB')return base+s.passYds*.010+s.passTD*2.4-s.int*1.4+(s.passAtt?((s.passComp/s.passAtt)-.58)*35:0)+(s.rushYds||0)*.018+(s.rushTD||0)*2-(s.fumbles||0)*.8+teamBonus;if(p.pos==='RB')return base+s.rushYds*.026+s.rushTD*3+(s.receptions||0)*.12+(s.recYds||0)*.012+(s.recTD||0)*1.6-(s.fumbles||0)*.8+teamBonus;if(['WR','TE'].includes(p.pos))return base+s.recYds*.028+s.recTD*3.1+(s.receptions||0)*.28-(s.drops||0)*.8+teamBonus;if(['EDGE','DT','LB','CB','S'].includes(p.pos))return base+s.tackles*.30+s.tfl*.65+s.sacks*4.7+s.pressures*.22+s.intDef*6.2+s.passBreakups*.45+teamBonus;if(['OT','OG','C'].includes(p.pos))return base+(s.snaps||0)*.012-(s.sacksAllowed||0)*2.8-(s.pressuresAllowed||0)*.32+playerSchemeFit(p,t)*.22+teamBonus;if(p.pos==='K')return base+(s.fgMade||0)*1.5-Math.max(0,(s.fgAtt||0)-(s.fgMade||0))*.8+teamBonus;if(p.pos==='P')return base+(s.punts||0)*.12+(s.punts?(s.puntYds/s.punts-40)*1.4:0)+teamBonus;return base+playerSchemeFit(p,t)*.25+teamBonus}
function allActivePlayers(){let a=[];for(const t of universe.teams)for(const p of t.roster)a.push({p,t});return a}
function awardOne(name,list,scoreFn=x=>seasonScore(x.p,x.t)){let w=list.slice().sort((a,b)=>scoreFn(b)-scoreFn(a))[0];if(!w)return null;return {name,playerId:w.p.id,playerName:w.p.name,team:w.t.name,pos:w.p.pos}}
function projectedAwards(){let all=allActivePlayers(),off=all.filter(x=>OFF_POS.has(x.p.pos)&&!['K','P'].includes(x.p.pos)),def=all.filter(x=>!OFF_POS.has(x.p.pos));let awards=[];for(const x of [awardOne('National Player of the Year',all),awardOne('Offensive Player of the Year',off),awardOne('Defensive Player of the Year',def),awardOne('Quarterback of the Year',all.filter(x=>x.p.pos==='QB')),awardOne('Running Back of the Year',all.filter(x=>x.p.pos==='RB')),awardOne('Receiver of the Year',all.filter(x=>['WR','TE'].includes(x.p.pos))),awardOne('Lineman of the Year',all.filter(x=>['OT','OG','C'].includes(x.p.pos))),awardOne('Freshman of the Year',all.filter(x=>eligibilityBase(x.p)===0&&!x.p.redshirtActive))])if(x)awards.push(x);let coach=universe.teams.slice().sort((a,b)=>(b.w*7-b.prestige*.3)-(a.w*7-a.prestige*.3))[0];if(coach)awards.push({name:'Coach of the Year',playerId:null,playerName:coach.staff.HC.name,team:coach.name,pos:'HC'});return awards}
function finalizeSeasonHonors(){if(universe.awards[universe.year])return universe.awards[universe.year];let awards=projectedAwards();for(const a of awards){if(!a.playerId)continue;let f=findPlayer(a.playerId);if(f?.p){f.p.awards??=[];if(!f.p.awards.some(x=>x.year===universe.year&&x.name===a.name))f.p.awards.push({year:universe.year,name:a.name})}}universe.awards[universe.year]=awards;updateSeasonRecords();return awards}
function updateSeasonRecords(){universe.records??={nationalSeason:{},nationalCareer:{}};universe.records.nationalSeason??={};for(const t of universe.teams){t.records??={};for(const p of t.roster){for(const [k,label] of Object.entries(RECORD_CATS)){let v=p.stats?.[k]||0;if(v>(universe.records.nationalSeason[k]?.value||0))universe.records.nationalSeason[k]={label,value:v,playerId:p.id,playerName:p.name,team:t.name,year:universe.year};if(v>(t.records[k]?.value||0))t.records[k]={label,value:v,playerId:p.id,playerName:p.name,year:universe.year}}}}}
function updateCareerRecords(){universe.records??={nationalSeason:{},nationalCareer:{}};universe.records.nationalCareer??={};let all=[];for(const t of universe.teams)for(const p of t.roster)all.push({p,t:t.name});for(const p of universe.playerArchive||[])all.push({p,t:p.lastTeam||'—'});for(const x of all)for(const [k,label] of Object.entries(RECORD_CATS)){let v=x.p.career?.[k]||0;if(v>(universe.records.nationalCareer[k]?.value||0))universe.records.nationalCareer[k]={label,value:v,playerId:x.p.id,playerName:x.p.name,team:x.t,year:universe.year}}}
function productionRating(p){let c=p.career||p.stats||{},v=50;if(p.pos==='QB')v+=(c.passYds||0)/650+(c.passTD||0)*.35-(c.int||0)*.12+(c.rushYds||0)/300+(c.rushTD||0)*.5;else if(p.pos==='RB')v+=(c.rushYds||0)/330+(c.rushTD||0)*.7+(c.recYds||0)/500+(c.recTD||0)*.45;else if(['WR','TE'].includes(p.pos))v+=(c.recYds||0)/350+(c.recTD||0)*.75;else if(['EDGE','DT','LB','CB','S'].includes(p.pos))v+=(c.tackles||0)/16+(c.tfl||0)*.25+(c.sacks||0)*1.8+(c.pressures||0)*.08+(c.intDef||0)*2.3+(c.passBreakups||0)*.12;else if(['OT','OG','C'].includes(p.pos))v+=(p.perceived||p.trueNow)*.18+(c.snaps||0)/700-(c.sacksAllowed||0)*.45-(c.pressuresAllowed||0)*.05;else if(p.pos==='K')v+=(c.fgMade||0)*.35-Math.max(0,(c.fgAtt||0)-(c.fgMade||0))*.25;else if(p.pos==='P')v+=(c.punts||0)?(c.puntYds/c.punts-38)*1.2:0;else v+=p.perceived*.28;return clamp(v,35,99)}
function draftProjection(p,t){let athletic=avg([p.speed,p.power,p.technique]),score=p.trueNow*.72+athletic*.10+productionRating(p)*.12+t.prestige*.06+gauss()*2.2;let round=score>=92?1:score>=88?2:score>=85?3:score>=82?4:score>=79?5:score>=76?6:score>=72?7:null;return {score:Math.round(score),round,pick:round?gi(1,32):null,label:round?`Round ${round}, Pick ${gi(1,32)}`:'Undrafted Free Agent'}}
function draftPlayer(p,t,reason='Eligibility exhausted'){let d=draftProjection(p,t),r={year:universe.year,playerId:p.id,playerName:p.name,pos:p.pos,school:t.name,reason,...d};return r}
function runDraft(pool){let rankedPool=pool.slice().sort((a,b)=>b.score-a.score);universe.draftHistory[universe.year]=[];rankedPool.forEach((x,i)=>{let round=i<224?Math.floor(i/32)+1:null,pick=round?(i%32)+1:null,status=round?'Drafted':x.score>=66?'UDFA':'College Career Complete',label=round?`Round ${round}, Pick ${pick}`:status==='UDFA'?'Undrafted Free Agent':'No professional deal',r={year:universe.year,playerId:x.p.id,playerName:x.p.name,pos:x.p.pos,school:x.t.name,reason:x.reason,score:Math.round(x.score),round,pick,status,label};x.p.draftResult=r;universe.draftHistory[universe.year].push(r);addToArchive(x.p,x.t,x.reason)});return universe.draftHistory[universe.year]}
function earlyDeclaration(p,t){if(eligibilityBase(p)<2||eligibilityBase(p)>=3)return false;let d=draftProjection(p,t);return d.round&&d.round<=2&&gameplayRandom()<(d.round===1?.52:.24)}
// Early in the season a single result should not throw a team across the poll: win rate and margin are blended
// with what the team's strength says to expect, weighted like a few phantom games that fade out by week ten, so
// late-season rankings, conference title races and the playoff field are exactly as before.
function rankingScore(t){const g=t.w+t.l,p=profiles(t).overall,prior=clamp(.5+(p-73)/30,.05,.95),k=Math.max(0,9-g*.9),wp=g+k?(t.w+k*prior)/(g+k):0,sos=g?t.sos/g:60,margin=g+k?(t.pf-t.pa)/(g+k):0;return wp*60+p*.22+sos*.10+clamp(margin,-20,20)*.4}
function ranked(){let r=universe.teams.map(t=>({t,s:rankingScore(t)})).sort((a,b)=>b.s-a.s).map(x=>x.t);r.forEach((t,i)=>t.rank=i+1);return r}
function findUserGame(){if(universe.phase!=='regular'||universe.week>=12)return null;const n=$('#userTeam').value;return universe.schedule[universe.week].find(g=>!g.played&&(g.home===n||g.away===n))||null}

// After the regular season the most recent result is a championship, bowl or playoff game,
// which lives only in the game archive, not on the team schedule.
function latestUserPostseasonGame(u){const games=(universe.gameArchive||[]).filter(g=>g.season===universe.year&&g.label&&g.label!=='Regular season'&&(g.home?.name===u.name||g.away?.name===u.name));return games.at(-1)||null}
function userWeekResult(u){if(universe.phase!=='regular'){const g=latestUserPostseasonGame(u);if(g){const userHome=g.home.name===u.name,userPts=userHome?g.score?.home:g.score?.away,oppPts=userHome?g.score?.away:g.score?.home;return{gameId:g.id,win:userPts>oppPts,opp:userHome?g.away.name:g.home.name,userPts,oppPts,loc:'vs',label:g.label}}}let w=universe.week;if(w<=0)return null;let g=u.schedule.find(g=>g.week===w&&g.played);if(!g)return null;let userHome=g.home===u.name,userPts=userHome?g.score?.[1]:g.score?.[0],oppPts=userHome?g.score?.[0]:g.score?.[1],opp=userHome?g.away:g.home;return {gameId:g.gameId,win:g.winner===u.name,opp,userPts,oppPts,loc:userHome?'vs':'@'}}
function buildPreseasonHub(){normalizeOffseasonState();const gt=selected();ensureSeasonGoals(gt);const ge=evaluateSeasonGoals(gt,false);universe.weeklyHub=[{type:'action',tab:'program',kicker:'SEASON GOALS',importance:64,main:`${ge.total} objectives set by the administration`,sub:`Primary: ${ge.results.find(x=>x.tier==='Primary')?.label||'Review expectations'}`},...pulledOfferHubItems(selected()),...coachOpeningHubItems(selected()),...coachFalloutHubItems(selected()),...promiseHubItems(selected()),{type:'action',tab:'depth',kicker:'ROSTER',main:'Set your role depth chart',sub:'X/Z/slot, nickel, rush edge and special teams are live.'},{type:'action',tab:'recruiting',kicker:'RECRUITING',main:'Build an initial recruiting board',sub:'Auto-target 20 or manually chase players who fit the roster.'},{type:'action',tab:'roster',kicker:'REDSHIRTS',main:'Review freshman redshirts',sub:'Protected players can appear in no more than four games.'}]}
function openingPreseason(target=universe){return !!target&&target.phase==='preseason'&&target.week===0}
// Raw phase keys ("regular", "confReady") and "Week 0" are engine terms, not copy.
const SEASON_STAGE_LABELS={confReady:'Conference championships',bowlReady:'Bowl season',playoffReady:'Playoff',complete:'Season complete'};
function seasonStageLabel(target=universe){
 if(openingPreseason(target))return 'Preseason';
 // universe.week counts completed weeks; every screen names the week being prepared, so the label does too.
 if(target.phase==='regular')return `Regular season · Week ${target.week+1}`;
 return SEASON_STAGE_LABELS[target.phase]||`${target.phase} · Week ${target.week}`;
}
function beginSeason(){
 const gate=guidanceActionEligibility('begin-season');if(!gate.allowed){setStatus('The season can begin only from the opening preseason at Week 0.');return false}
 universe.phase='regular';buildWeeklyHub();autosaveAfter('preseason');setStatus('Season begun. Week 1 is ready.');render();return true
}
// Rivals are derived, never authored: the nearest school in your own conference. Weeks 4-11 are a
// conference round-robin, so a same-conference rival is guaranteed on the schedule every season
// without buildSchedule needing to know rivalries exist at all.
const TROPHY_NOUNS=['Bell','Axe','Boot','Jug','Barrel','Anvil','Lantern','Spade','Bucket','Cannon'];
function deriveRivalries(){
 const teams=universe.teams,prev=new Map(teams.map(t=>[t.id,t.rivalry]));
 for(const t of teams)t.rivalry=null;
 // Only opponents actually on the schedule qualify: the conference round-robin plays eight of
 // eleven, so the nearest school geographically is not necessarily one you ever meet. Pair the
 // globally closest eligible pair first — taking each team in turn strands the last two in a
 // conference when they happen not to play each other.
 // v0.9.48: identity no longer depends on which opponents a season's rotation happened to
 // include. Pairing is geographic and permanent; the schedule then guarantees the game.
 // Anything already designated is honoured first, so a rivalry survives every rebuild.
 const byId=new Map(teams.map(t=>[t.id,t]));
 const dist=(a,b)=>haversineMiles(a.lat||0,a.lon||0,b.lat||0,b.lon||0);
 const bind=(t,o,d)=>{
  const noun=TROPHY_NOUNS[Math.abs(Math.min(t.id,o.id))%TROPHY_NOUNS.length],
   place=t.state===o.state?t.state:'Border',trophy=`The ${place} ${noun}`,miles=Math.round(d),
   keep=(me,them)=>{const p=prev.get(me.id);return p&&p.rivalId===them.id?{...p.series,miles}:{w:0,l:0,streak:0,lastYear:null,lastResult:null,miles}};
  t.rivalry={rivalId:o.id,trophy,series:keep(t,o)};
  o.rivalry={rivalId:t.id,trophy,series:keep(o,t)};
  setPrimaryRival(t,o);setPrimaryRival(o,t);
 };
 for(const t of teams){
  if(t.rivalry||!primaryRivalId(t))continue;
  const o=byId.get(primaryRivalId(t));
  if(o&&!o.rivalry&&o.id!==t.id&&o.conference===t.conference&&primaryRivalId(o)===t.id)bind(t,o,dist(t,o));
 }
 const pairs=[];
 for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
  const t=teams[i],o=teams[j];
  if(t.conference!==o.conference)continue;
  if(t.rivalry||o.rivalry)continue;
  pairs.push({t,o,d:dist(t,o)});
 }
 pairs.sort((a,b)=>a.d-b.d||a.t.id-b.t.id);
 for(const {t,o,d} of pairs){
  if(t.rivalry||o.rivalry)continue;
  bind(t,o,d);
 }
}
function rivalOf(t){return t?.rivalry?universe.teams.find(x=>x.id===t.rivalry.rivalId)||null:null}
function isRivalryGame(t,g){const o=rivalOf(t);return !!(o&&g&&(g.home===o.name||g.away===o.name))}
function rivalryGameFor(t){const o=rivalOf(t);if(!o)return null;return (t.schedule||[]).find(g=>g.home===o.name||g.away===o.name)||null}
// One result, recorded once, from both sides.
const RIVALRY_POSTSEASON_CAP=12;
function recordRivalryResult(t,won,ctx={}){
 const s=t.rivalry?.series;if(!s)return;
 if(s.lastYear===universe.year)return;
 s[won?'w':'l']++;s.lastYear=universe.year;s.lastResult=won?'W':'L';
 s.streak=won?(s.streak>0?s.streak+1:1):(s.streak<0?s.streak-1:-1);
 // v0.9.48: who actually holds the trophy, the biggest win in the series, and the times
 // it was settled somewhere that mattered. Bounded, so a long dynasty cannot grow the save.
 s.holderId=won?t.id:(t.rivalry.rivalId??null);
 const margin=Number(ctx.margin);
 if(won&&Number.isFinite(margin)&&margin>(s.bestWin?.margin??-1))
  s.bestWin={year:universe.year,margin,score:ctx.score||null};
 if(ctx.label&&ctx.label!=='Regular season'){
  s.postseason??=[];
  s.postseason.push({year:universe.year,label:ctx.label,result:won?'W':'L',score:ctx.score||null});
  if(s.postseason.length>RIVALRY_POSTSEASON_CAP)s.postseason.splice(0,s.postseason.length-RIVALRY_POSTSEASON_CAP);
 }
}
function settleRivalryGame(g){
 if(!g?.played||g.winner==null)return;
 const home=T(g.home),away=T(g.away);
 if(!home?.rivalry||home.rivalry.rivalId!==away?.id)return;
 // Older saves already tracked the series. Use it as the durable once-only
 // guard for fan changes and the event too, not just the win/loss counters.
 if(home.rivalry.series.lastYear===universe.year&&away.rivalry?.series.lastYear===universe.year)return;
 const homeWon=g.winner===g.home;
 const hs=g.score?.[1]??null,as=g.score?.[0]??null,gap=Number.isFinite(hs)&&Number.isFinite(as)?Math.abs(hs-as):null;
 const score=gap==null?null:`${as}-${hs}`,label=g.label||'Regular season';
 recordRivalryResult(home,homeWon,{margin:gap,score,label});
 recordRivalryResult(away,!homeWon,{margin:gap,score,label});
 const loser=homeWon?away:home,winner=homeWon?home:away;
 winner.fan_support=clamp((winner.fan_support||60)+2,0,100);
 loser.fan_support=clamp((loser.fan_support||60)-2,0,100);
 universe.events??=[];universe.nextEventId??=1;
 const order=universe.nextEventId++;
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'RIVALRY_RESULT',importance:76,schoolIds:[home.id,away.id],playerIds:[],coachIds:[],recruitIds:[],
  gameIds:g.gameId?[g.gameId]:[],summary:`${winner.name} keeps ${winner.rivalry.trophy}.`,
  metadata:{trophy:winner.rivalry.trophy,winnerId:winner.id,loserId:loser.id}});
}
function rivalrySeriesText(t){
 const s=t?.rivalry?.series;if(!s)return '';
 if(!s.w&&!s.l)return 'First meeting';
 const run=s.streak>0?`W${s.streak}`:s.streak<0?`L${Math.abs(s.streak)}`:'';
 return `${s.w}-${s.l}${run?` · ${run}`:''}`;
}
// The wire cares twice: when the game is next, and once it is settled.
function rivalryHubItems(t){
 if(!t?.rivalry)return[];
 const o=rivalOf(t),s=t.rivalry.series,out=[];
 if(!o)return[];
 const g=rivalryGameFor(t);
 if(g&&!g.played&&g.week===universe.week+1)out.push({type:'action',tab:'gamelab',importance:74,
  kicker:'RIVALRY WEEK',main:`${t.rivalry.trophy} is on the line vs ${o.name}`,
  sub:`${rivalrySeriesText(t)} all-time · ${s.miles} miles apart`});
 if(g?.played&&s.lastYear===universe.year)out.push({type:s.lastResult==='W'?'good-news':'bad-news',tab:'season',
  importance:s.lastResult==='W'?70:78,gameId:g.gameId,
  kicker:'RIVALRY',main:s.lastResult==='W'?`${t.rivalry.trophy} stays home`:`${o.name} takes ${t.rivalry.trophy}`,
  sub:`${rivalrySeriesText(t)} all-time`});
 return out;
}
// The administration. Every AI program already lives with consequences — carousel() fires coaches
// on admin_patience — while the controlled program never did. This is that same judgement, applied
// to the program you run, on the same expectation scale so you are held to the AI's standard.
function seasonExpectation(t){return clamp(Math.round(((t?.prestige??60)-30)/8),4,10)}
function ensureAdminState(t){
 if(!t)return null;
 t.adminConfidence??=clamp(Math.round(((t.admin_patience??60)*.6)+30),15,95);
 t.mandate??=null;
 return t;
}
function adminConfidenceLabel(c){return c>=80?'Secure':c>=60?'Backed':c>=40?'Watched':c>=20?'Hot seat':'Final warning'}
// v0.9.51: explicit season objectives turn the board's expectations into a visible contract.
function seasonGoalSeed(t){return (((universe.year||0)*131)+((t?.id||0)*17))>>>0}
function seasonGoalChoice(t,items,salt=0){return items[(seasonGoalSeed(t)+salt)%items.length]}
function ensureSeasonGoals(t){
 if(!t)return[];
 if(t.seasonGoalsYear===universe.year&&Array.isArray(t.seasonGoals)&&t.seasonGoals.length){
  for(const g of t.seasonGoals){
    g.weight??=g.tier==='Primary'?'Critical':g.tier==='Secondary'?'Important':'Bonus';
    g.tier??=g.weight==='Critical'?'Primary':g.weight==='Important'?'Secondary':'Stretch';
    if(g.type==='top25'){g.type='rank';g.target??=25}
  }
  return t.seasonGoals;
 }
 const exp=seasonExpectation(t),rival=rivalOf(t),blueTarget=t.prestige>=82?5:t.prestige>=62?4:3,goals=[];
 const add=(id,weight,type,label,target=null)=>goals.push({id,weight,tier:weight==='Critical'?'Primary':weight==='Important'?'Secondary':'Stretch',type,label,target,year:universe.year});
 add('wins','Critical','wins',`Win at least ${exp} games`,exp);
 if(rival)add('rivalry','Important','rivalry',`Beat ${rival.name}`,rival.id);
 const recruitType=seasonGoalChoice(t,['bluechips','classSize'],3);
 if(recruitType==='bluechips')add('recruiting','Important','bluechips',`Sign ${blueTarget} blue-chip recruits`,blueTarget);
 else {const target=t.prestige>=82?18:t.prestige>=60?15:12;add('recruiting','Important','classSize',`Sign at least ${target} recruits`,target)}
 const p=t.prestige||0;
 if(p>=90){const type=seasonGoalChoice(t,['nationalTitle','conferenceTitle'],7);if(type==='nationalTitle')add('stretch','Bonus','nationalTitle','Win the national championship');else add('stretch','Bonus','conferenceTitle','Win the conference championship')}
 else if(p>=75){const type=seasonGoalChoice(t,['conferenceTitle','rank'],7);if(type==='conferenceTitle')add('stretch','Bonus','conferenceTitle','Win the conference championship');else add('stretch','Bonus','rank','Finish in the Top 15',15)}
 else if(p>=55){const type=seasonGoalChoice(t,['rank','bowl'],7);if(type==='rank')add('stretch','Bonus','rank','Finish in the Top 25',25);else add('stretch','Bonus','bowl','Reach bowl eligibility',6)}
 else add('stretch','Bonus','bowl','Reach bowl eligibility',6);
 t.seasonGoalsYear=universe.year;t.seasonGoals=goals;return goals;
}
function seasonGoalStatus(t,g,final=false){
 if(!t||!g)return{state:'pending',progress:'—'};
 // Once the season is complete, on-field goals are settled; recruiting goals stay open until signing day.
 final=final||(universe.phase==='complete'&&g.type!=='classSize'&&g.type!=='bluechips');
 const played=(t.w||0)+(t.l||0),remaining=Math.max(0,12-played),late=(universe.week||0)>=8;
 if(g.type==='wins'){const done=(t.w||0)>=g.target,impossible=(t.w||0)+remaining<g.target,atRisk=!done&&(impossible||(played>=6&&((t.w||0)/Math.max(1,played))<(g.target/12)*.8));return{state:done?'complete':final?'failed':atRisk?'at_risk':'on_track',progress:`${t.w||0}/${g.target} wins`}}
 if(g.type==='rivalry'){const s=t.rivalry?.series,hasPlayed=s?.lastYear===universe.year;if(!hasPlayed)return{state:final?'failed':'on_track',progress:'Game pending'};return{state:s.lastResult==='W'?'complete':'failed',progress:s.lastResult==='W'?'Won rivalry':'Lost rivalry'}}
 if(g.type==='bluechips'){const n=(universe.recruits||[]).filter(r=>r.committed===t.name&&(r.stars||0)>=4).length,done=n>=g.target;return{state:done?'complete':final?'failed':late&&n<Math.ceil(g.target/2)?'at_risk':'on_track',progress:`${n}/${g.target} blue chips`}}
 if(g.type==='classSize'){const n=(universe.recruits||[]).filter(r=>r.committed===t.name).length,done=n>=g.target;return{state:done?'complete':final?'failed':late&&n<Math.ceil(g.target*.55)?'at_risk':'on_track',progress:`${n}/${g.target} signees`}}
 if(g.type==='conferenceTitle'){const done=conferenceChampionIdsFor().includes(t.id);return{state:done?'complete':final?'failed':'on_track',progress:done?'Conference champion':final?'Missed':'Still alive'}}
 if(g.type==='nationalTitle'){const done=universe.champion===t.name||!!t.champ;return{state:done?'complete':final?'failed':'on_track',progress:done?'National champion':final?'Missed':'Still alive'}}
 if(g.type==='rank'){const rank=t.rank||999,done=rank<=g.target,atRisk=late&&rank>g.target+12;return{state:done?'complete':final?'failed':atRisk?'at_risk':'on_track',progress:rank<999?`#${rank} nationally`:'Unranked'}}
 if(g.type==='bowl'){const done=(t.w||0)>=6||t.bowlResult?.year===universe.year,impossible=(t.w||0)+remaining<6;return{state:done?'complete':final?'failed':impossible?'at_risk':'on_track',progress:`${t.w||0}/6 wins`}}
 return{state:final?'failed':'on_track',progress:'—'};
}
function seasonGoalStatusLabel(state){return state==='complete'?'Complete':state==='failed'?'Failed':state==='at_risk'?'At risk':'On track'}
function evaluateSeasonGoals(t,final=false){
 const goals=ensureSeasonGoals(t),results=goals.map(g=>({...g,...seasonGoalStatus(t,g,final)}));
 let adjustment=0;
 if(final)for(const r of results){if(r.weight==='Critical')continue;if(r.weight==='Important')adjustment+=r.state==='complete'?3:-3;else adjustment+=r.state==='complete'?4:-1}
 const completed=results.filter(r=>r.state==='complete').length,atRisk=results.filter(r=>r.state==='at_risk'||r.state==='failed').length;
 return{results,completed,total:results.length,atRisk,adjustment};
}
function seasonGoalsHTML(t){
 const review=evaluateSeasonGoals(t,false);
 const rows=review.results.map(g=>{const icon=g.state==='complete'?'✓':g.state==='failed'?'✕':g.state==='at_risk'?'!':'•';return `<div class="lineitem"><span><span class="pill">${esc(g.weight||g.tier)}</span> ${icon} ${esc(g.label)}</span><span><strong>${esc(g.progress)}</strong><div class="small muted">${seasonGoalStatusLabel(g.state)}</div></span></div>`}).join('');
 const readout=review.atRisk?`${review.atRisk} objective${review.atRisk===1?' is':'s are'} at risk.`:`All active objectives are on track.`;
 return rows+`<div class="compact muted" style="margin-top:8px">${review.completed} of ${review.total} complete · ${readout} Critical wins remain governed by the existing wins-vs-expectation administration model.</div>`;
}
function programOverviewHTML(t){
 ensureAdminState(t);const review=evaluateSeasonGoals(t,false),expect=seasonExpectation(t),rank=t.rank&&t.rank<999?`#${t.rank}`:'Unranked',rival=rivalOf(t);
 return `<div class="profile-grid"><div class="profile-stat"><div class="small muted">Record</div><div class="v">${t.w||0}–${t.l||0}</div></div><div class="profile-stat"><div class="small muted">National standing</div><div class="v">${rank}</div></div><div class="profile-stat"><div class="small muted">Admin confidence</div><div class="v">${t.adminConfidence??50}</div><div class="small muted">${adminConfidenceLabel(t.adminConfidence??50)}</div></div><div class="profile-stat"><div class="small muted">Season expectation</div><div class="v">${expect} wins</div></div></div><div class="lineitem"><span>Goal status</span><strong>${review.completed}/${review.total} complete${review.atRisk?` · ${review.atRisk} at risk`:''}</strong></div><div class="lineitem"><span>Primary rival</span><strong>${esc(rival?.name||'None')}</strong></div><div class="lineitem"><span>Board mandate</span><strong>${esc(t.mandate?.text||'No special mandate')}</strong></div>`;
}
// Movement is dominated by wins against expectation. admin_patience decides how hard it swings:
// an impatient board (25) moves roughly twice as fast as a patient one (78).
function adminSeasonReview(t){
 ensureAdminState(t);
 const exp=seasonExpectation(t),diff=(t.w||0)-exp,
  swing=clamp(1.6-((t.admin_patience??60)/100),.7,1.5),
  goalReview=evaluateSeasonGoals(t,true),
  titleBonus=(t.champ?14:0)+(conferenceChampionIdsFor().includes(t.id)?6:0),
  pull=diff*6*swing,delta=Math.round((pull<0?pull/gameSetting('boardPatience'):pull)+titleBonus+goalReview.adjustment);
 const before=t.adminConfidence;
 t.adminConfidence=clamp(before+delta,0,100);
 const review={year:universe.year,w:t.w||0,l:t.l||0,champ:!!t.champ,confChamp:conferenceChampionIdsFor().includes(t.id),expected:exp,delta,before,after:t.adminConfidence,
  goalAdjustment:goalReview.adjustment,goals:goalReview.results,label:adminConfidenceLabel(t.adminConfidence)};
 t.mandate=t.adminConfidence<40?{year:universe.year+1,wins:exp,
  text:`The administration expects ${exp} wins in ${universe.year+1}.`}:null;
 return review;
}
// The review in one sentence that adds up: the record against the target, what the season goals added or cost, and
// where confidence went. "8-5 against 8 expected" alone read as a pass while confidence fell on missed goals.
function adminReviewSummary(t,review){
 const winPart=review.w===review.expected?`met the ${review.expected}-win target`:review.w>review.expected?`beat the ${review.expected}-win target by ${review.w-review.expected}`:`fell ${review.expected-review.w} short of the ${review.expected}-win target`;
 const missed=(review.goals||[]).filter(g=>g&&g.weight!=='Critical'&&g.state!=='complete').length,goalPart=review.goalAdjustment?`; season goals ${review.goalAdjustment>0?'added':'cost'} ${Math.abs(review.goalAdjustment)}${review.goalAdjustment<0&&missed?` (${missed} missed)`:''}`:'';
 return `${t.name} review: ${review.w}-${review.l} ${winPart}${goalPart}. Confidence ${review.before} to ${review.after} (${review.label}).`;
}
// Applied to the controlled program only, and recorded so the tenure has a history.
function reviewControlledProgram(t){
 if(!t)return null;
 universe.tenure??={startYear:universe.year,school:t.name,seasons:[],ended:null,closed:false};
 // A closed tenure is waiting on the player to take a post; it must not keep accruing seasons.
 if(universe.tenure.closed&&(universe.jobOffers||[]).length)return null;
 // Switching the controlled program by hand is a new post, not a continuation of the old record.
 if(universe.tenure.school!==t.name){closeTenure('stepped away');universe.jobOffers=[];
  universe.tenure={startYear:universe.year,school:t.name,seasons:[],ended:null,closed:false}}
 const review=adminSeasonReview(t);
 universe.tenure.seasons.push(review);
 const order=universe.nextEventId++;
 universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'ADMIN_REVIEW',importance:review.after<40?78:52,schoolIds:[t.id],playerIds:[],coachIds:[],
  recruitIds:[],gameIds:[],
  summary:adminReviewSummary(t,review),
  metadata:{...review}});
 if(t.adminConfidence<=0&&!universe.tenure.ended){
  universe.tenure.ended={year:universe.year,record:`${review.w}-${review.l}`,
   seasons:universe.tenure.seasons.length};
  closeTenure('let go');
 }
 if(typeof updateCareerMilestones==='function')updateCareerMilestones();
 // Confidence is not only a scoreboard: it buys or costs the program real ground.
 if(review.after>=80){
  t.resources=clamp((t.resources||60)+1,0,100);
  t.facilities=clamp((t.facilities||60)+1,0,100);
 } else if(review.after<25){
  t.resources=clamp((t.resources||60)-2,0,100);
  t.fan_support=clamp((t.fan_support||60)-2,0,100);
 }
 return review;
}
// Mid-season the number must never be a surprise, so the wire tracks the mandate as it slips.
function adminHubItems(t){
 if(!t)return[];
 ensureAdminState(t);
 const exp=seasonExpectation(t),played=(t.w||0)+(t.l||0),left=12-played,
  reachable=(t.w||0)+left,conf=t.adminConfidence,out=[];
 if(universe.week<3)return[];
 if(reachable<exp)out.push({type:'bad-news',tab:'program',importance:82,
  kicker:'ADMINISTRATION',main:`${exp} wins is now out of reach`,
  sub:`${t.w}-${t.l} with ${left} to play · confidence ${conf} (${adminConfidenceLabel(conf)})${typeof adminOutlookModel==='function'&&adminOutlookModel(t)?.mode==='pace'?` → ${adminOutlookModel(t).projected} at this pace`:''}`});
 else if(conf<40)out.push({type:'alert',tab:'program',importance:72,
  kicker:'ADMINISTRATION',main:t.mandate?t.mandate.text:`The administration expects ${exp} wins`,
  sub:`${t.w}-${t.l} · confidence ${conf} (${adminConfidenceLabel(conf)})`});
 // Early warning: the current pace would drop confidence into a worse band at the review.
 else if(typeof adminOutlookModel==='function'){const o=adminOutlookModel(t);if(o?.mode==='pace'&&o.projected<conf&&o.projectedLabel!==adminConfidenceLabel(conf))out.push({type:'alert',tab:'dashboard',importance:66,
  kicker:'ADMINISTRATION',main:`On pace to slip to ${o.projectedLabel}`,sub:`${o.projectedWins} projected wins against ${exp} expected · confidence ${conf} → ${o.projected}`})}
 return out;
}
// NIL. t.nil was a static number that only tilted recruitPitch; here it becomes a budget you spend.
// The point is that it is finite: holding the disgruntled starter and signing the blue-chip are the
// same pool of money, so the allocation is the decision.
function nilBudgetFor(t){return t?clamp(Math.round(((t.nil??60)*.7+(t.resources??60)*.3)/8),3,14):0}
function nilRemaining(t){return Math.max(0,nilBudgetFor(t)-(t?.nilSpent||0))}
function nilDealCost(x,isRecruit){return isRecruit?clamp((x.stars||2)-1,1,4):clamp(Math.round(((x.perceived||60)-50)/10),1,5)}
function nilDealActive(x,t){const d=x?.nilDeal;if(!d||d.year!==universe.year)return null;return (!t||d.schoolId==null||d.schoolId===t.id)?d:null}
// Retention pressure is the whole point of a player deal: it pushes back on everything transferRisk sums.
function nilRetentionRelief(p){const d=nilDealActive(p);return d?Math.min(30,d.amount*6):0}
function signNilDeal(t,x,isRecruit){
 if(!t||!x)return {ok:false,reason:'No target.'};
 ensureNilState(t);
 if(nilDealActive(x,t))return {ok:false,reason:'A deal is already in place this year.'};
 const cost=nilDealCost(x,isRecruit);
 if(cost>nilRemaining(t))return {ok:false,reason:`Not enough NIL left — ${nilRemaining(t)} of ${nilBudgetFor(t)} available, this costs ${cost}.`};
 x.nilDeal={amount:cost,year:universe.year,schoolId:t.id};
 t.nilSpent=(t.nilSpent||0)+cost;
 const order=universe.nextEventId++;universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'NIL_DEAL',importance:isRecruit?44:50,schoolIds:[t.id],playerIds:isRecruit?[]:[x.id],
  coachIds:[],recruitIds:isRecruit?[x.id]:[],gameIds:[],
  summary:`${x.name} signed a ${cost}-unit NIL deal with ${t.name}.`,metadata:{amount:cost,isRecruit:!!isRecruit}});
 return {ok:true,cost};
}
// Reversible while it is still the season it was signed in, so a misallocation is not permanent.
function cancelNilDeal(t,x){
 const d=nilDealActive(x,t);if(!d)return {ok:false,reason:'No active deal.'};
 t.nilSpent=Math.max(0,(t.nilSpent||0)-d.amount);x.nilDeal=null;
 return {ok:true,refund:d.amount};
}
function ensureNilState(t){if(!t)return null;t.nilSpent??=0;return t}
function resetNilSeason(){
 for(const t of universe.teams){t.nilSpent=0;for(const p of t.roster)if(p.nilDeal&&p.nilDeal.year<universe.year)p.nilDeal=null}
 for(const r of universe.recruits||[])if(r.nilDeal&&r.nilDeal.year<universe.year)r.nilDeal=null;
}
function nilSummaryText(t){return `${nilRemaining(t)} of ${nilBudgetFor(t)} available`}
function nilCellHTML(p,t){
 const d=nilDealActive(p,t),cost=nilDealCost(p,false),afford=cost<=nilRemaining(t);
 return d?`<button class="rs-button rs-active" data-nil-player="${p.id}" title="Release this deal">Held · ${d.amount}</button>`
  :`<button class="rs-button" data-nil-player="${p.id}" ${afford?'':'disabled'} title="${afford?`Costs ${cost}`:'Not enough NIL left'}">Offer · ${cost}</button>`;
}
function toggleNilPlayer(id){
 const t=selected(),p=t?.roster.find(x=>x.id===id);if(!p)return;
 const r=nilDealActive(p,t)?cancelNilDeal(t,p):signNilDeal(t,p,false);
 setStatus(r.ok?(r.refund!=null?`Released ${p.name}'s NIL deal — ${r.refund} back. ${nilSummaryText(t)}.`:`${p.name} signed for ${r.cost}. ${nilSummaryText(t)}.`):r.reason);
 render();
}
function toggleNilRecruit(id){
 const t=selected(),r=universe.recruits.find(x=>x.id===id);if(!r)return;
 const res=nilDealActive(r,t)?cancelNilDeal(t,r):signNilDeal(t,r,true);
 setStatus(res.ok?(res.refund!=null?`Pulled the NIL offer to ${r.name} — ${res.refund} back. ${nilSummaryText(t)}.`:`${r.name} offered ${res.cost} in NIL. ${nilSummaryText(t)}.`):res.reason);
 renderRecruiting();
}
// The career arc. v0.9.21 gave the hot seat an ending and nowhere to go; a dynasty that can only
// end is worse than one that never ends. A tenure that closes now becomes a line on a résumé, and
// the résumé is what the next job market reads.
function tenureRecord(t){
 const s=(universe.tenure?.seasons)||[];
 return s.reduce((a,x)=>({w:a.w+(x.w||0),l:a.l+(x.l||0)}),{w:0,l:0});
}
// One closed or open tenure reduced to the counts career milestones read.
function tenureDigest(seasons){
 const rows=seasons||[],digest={w:0,l:0,titles:0,confTitles:0,winningSeasons:0,bestWins:0,perfectSeasons:0,repeatTitles:0};
 let previousTitle=false;
 for(const s of rows){
  const w=s.w||0,l=s.l||0;
  digest.w+=w;digest.l+=l;
  if(s.champ)digest.titles++;
  if(s.confChamp)digest.confTitles++;
  if(w>l)digest.winningSeasons++;
  digest.bestWins=Math.max(digest.bestWins,w);
  if(l===0&&w>=8)digest.perfectSeasons++;
  if(s.champ&&previousTitle)digest.repeatTitles++;
  previousTitle=!!s.champ;
 }
 return digest;
}
function careerTotals(){
 const past=(universe.careerHistory||[]).reduce((a,x)=>({w:a.w+x.w,l:a.l+x.l,seasons:a.seasons+x.seasons}),{w:0,l:0,seasons:0}),
  now=tenureRecord();
 return {w:past.w+now.w,l:past.l+now.l,seasons:past.seasons+((universe.tenure?.seasons)||[]).length,posts:(universe.careerHistory||[]).length+(universe.tenure?1:0)};
}
function careerWinPct(){const c=careerTotals(),g=c.w+c.l;return g?c.w/g:0}
// What a program will take a chance on: a résumé that got you fired does not get you a better job,
// but a good record at a bad school still counts for something.
function hiringCeiling(){
 const c=careerTotals(),pct=careerWinPct(),
  best=Math.max(0,...(universe.careerHistory||[]).map(x=>x.prestige||0),(universe.tenure?T(universe.tenure.school)?.prestige:0)||0);
 return clamp(Math.round(best*.72+pct*46+Math.min(10,c.seasons)),18,96);
}
function hiringMarket(){
 const ceiling=hiringCeiling(),current=universe.tenure?.school;
 return universe.teams
  .filter(t=>t.name!==current&&(t.prestige||0)<=ceiling)
  .sort((a,b)=>(b.prestige||0)-(a.prestige||0))
  .slice(0,3)
  .map(t=>({schoolId:t.id,name:t.name,conference:t.conference,prestige:t.prestige,
   why:`Prestige ${t.prestige} · ${t.conference} · expects ${seasonExpectation(t)} wins`}));
}
function closeTenure(reason){
 const tn=universe.tenure;if(!tn||tn.closed)return null;
 const rec=tenureRecord(),school=T(tn.school);
 universe.careerHistory??=[];
 universe.careerHistory.push({school:tn.school,prestige:school?.prestige??null,
  startYear:tn.startYear,endYear:universe.year,seasons:tn.seasons.length,w:rec.w,l:rec.l,reason,...tenureDigest(tn.seasons)});
 tn.closed=true;
 universe.jobOffers=hiringMarket();
 return universe.careerHistory[universe.careerHistory.length-1];
}
