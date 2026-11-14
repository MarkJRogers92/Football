// app/06-recaps-news.js: Deterministic game recaps and news headlines. Part of app.js; see tools/app-source.js.
// --- v0.9.7: deterministic game recaps -------------------------------------
// Prose is derived from the archived box score on demand and never stored, so
// recaps appear for every game already in an old save and cost nothing to keep.
// Wording is picked from a seeded stream keyed to the game id: the same game
// always reads the same way, and generating a recap never touches Math.random,
// so reading history can never perturb the simulation.
function recapHash(value){let h=2166136261>>>0;const s=String(value??'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function recapPicker(seed){let s=recapHash(seed)||1;return arr=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return arr[s%arr.length]}}
function recapLeader(g,side,key,min=1){const p=(g.playerStats?.[side]||[]).slice().sort((a,b)=>(b.stats[key]||0)-(a.stats[key]||0))[0];return p&&(p.stats[key]||0)>=min?p:null}
function recapStopper(g,side){
 // Deliberately high bars: one sack or one interception happens in nearly
 // every game, so mentioning those would make every recap read the same.
 const rows=(g.playerStats?.[side]||[]);
 const top=key=>rows.slice().sort((a,b)=>(b.stats[key]||0)-(a.stats[key]||0))[0];
 const bySack=top('sacks');if((bySack?.stats.sacks||0)>=2)return{p:bySack,kind:'sacks'};
 const byInt=top('intDef');if((byInt?.stats.intDef||0)>=2)return{p:byInt,kind:'int'};
 const byTackle=top('tackles');if((byTackle?.stats.tackles||0)>=11)return{p:byTackle,kind:'tackles'};
 if((byInt?.stats.intDef||0)>=1&&(byInt?.stats.tackles||0)>=7)return{p:byInt,kind:'int'};
 return null;
}
function recapFacts(g){
 const homeWon=g.score.home>=g.score.away,w=homeWon?'home':'away',l=homeWon?'away':'home';
 const ws=g.teamStats[w],ls=g.teamStats[l];
 const wYds=(ws.passYds||0)+(ws.rushYds||0),lYds=(ls.passYds||0)+(ls.rushYds||0);
 const wRank=Number(g[w].rank)||null,lRank=Number(g[l].rank)||null;
 const ranked=r=>r!=null&&r<=25;
 return {
  win:g[w],lose:g[l],winSide:w,loseSide:l,ws,ls,
  wPts:g.score[w],lPts:g.score[l],margin:g.score[w]-g.score[l],
  wYds,lYds,yardEdge:wYds-lYds,
  toMargin:(ls.turnovers||0)-(ws.turnovers||0),
  sacksBy:ls.sacksTaken||0,           // the winner's defense produced these
  neutral:g.venue==='Neutral site',winnerAtHome:w==='home',
  wRank,lRank,rankedWinner:ranked(wRank),rankedLoser:ranked(lRank),
  // An upset is the unranked (or clearly lower-ranked) side winning.
  upset:ranked(lRank)&&(!ranked(wRank)||(wRank-lRank)>=8),
  outgained:wYds<lYds,
  fgMade:ws.fgMade||0,shutout:g.score[l]===0,
  title:g.label&&g.label!=='Regular season'?g.label:null,
 };
}
function recapResultLine(g,f,pick){
 const w=gameEscape(f.win.name),l=gameEscape(f.lose.name),score=`${f.wPts}–${f.lPts}`;
 const where=f.neutral?' at a neutral site':f.winnerAtHome?' at home':' on the road';
 const winName=f.upset&&!f.rankedWinner?`Unranked ${w}`:f.rankedWinner?`No. ${f.wRank} ${w}`:w;
 const loseName=f.rankedLoser?`No. ${f.lRank} ${l}`:l;
 const verb=f.upset?pick(['knocked off','upset','took down','stunned'])
  :f.shutout?pick(['shut out','blanked'])
  :f.margin>=24?pick(['ran away from','buried','overwhelmed','rolled past'])
  :f.margin>=14?pick(['handled','pulled away from','beat','controlled'])
  :f.margin>=9?pick(['beat','got past','took care of'])
  :f.margin>=4?pick(['held off','edged','beat'])
  :pick(['survived','slipped past','outlasted','edged']);
 const tail=f.title?` in the ${gameEscape(f.title)}`:where;
 return `${winName} ${verb} ${loseName} ${score}${tail}.`;
}
function recapHowLine(g,f,pick){
 if(f.outgained&&f.toMargin>0)
  return `${gameEscape(f.win.name)} was outgained ${f.lYds}–${f.wYds} and won anyway, ${pick(['cashing in','turning the game'])} on a ${f.toMargin > 1 ? `plus-${f.toMargin}` : 'plus-one'} turnover margin.`;
 if(f.outgained)
  return `${gameEscape(f.win.name)} won without the better day on offense, outgained ${f.lYds}–${f.wYds}.`;
 if(f.toMargin>=2)
  return `The difference was the ball: ${gameEscape(f.lose.name)} gave it away ${f.ls.turnovers} time${f.ls.turnovers===1?'':'s'} to ${gameEscape(f.win.name)}'s ${f.ws.turnovers}.`;
 if((f.ws.rushYds||0)>=200)
  return `${gameEscape(f.win.name)} ${pick(['leaned on the run','pounded the ball','ground it out'])} for ${f.ws.rushYds} rushing yards on the way to ${f.wYds} total.`;
 if((f.ws.passYds||0)>=300)
  return `${gameEscape(f.win.name)} threw for ${f.ws.passYds} yards and finished with ${f.wYds} total.`;
 if(f.sacksBy>=4)
  return `${gameEscape(f.win.name)}'s front wrecked the pocket, sacking ${gameEscape(f.lose.name)} ${f.sacksBy} times.`;
 if(f.yardEdge>=150)
  return `${gameEscape(f.win.name)} controlled the game statistically, ${f.wYds} yards to ${f.lYds}.`;
 if(Math.abs(f.yardEdge)<=60)
  return pick([
   `The teams were even on the stat sheet, ${f.wYds} yards to ${f.lYds}.`,
   `Neither offense separated: ${f.wYds} yards to ${f.lYds}.`,
   `There was nothing between them statistically — ${f.wYds} yards to ${f.lYds} — and ${gameEscape(f.win.name)} made the plays that counted.`,
   `${gameEscape(f.win.name)} won an evenly played game, ${f.wYds} yards to ${f.lYds}.`]);
 return `${gameEscape(f.win.name)} finished with ${f.wYds} total yards to ${f.lYds} for ${gameEscape(f.lose.name)}.`;
}
function recapStarLine(g,f,pick){
 const bits=[],side=f.winSide;
 const passer=recapLeader(g,side,'passYds',150),rusher=recapLeader(g,side,'rushYds',75),receiver=recapLeader(g,side,'recYds',70);
 if(passer){const s=passer.stats,td=s.passTD||0,int=s.int||0;
  bits.push(`${gameEscape(passer.name)} threw for ${s.passYds} yards${s.passComp?` on ${s.passComp}-of-${s.passAtt||s.passComp}`:''}${td?` with ${td} touchdown${td===1?'':'s'}`:''}${int?` and ${int} interception${int===1?'':'s'}`:''}`)}
 if(rusher){const s=rusher.stats;
  bits.push(`${gameEscape(rusher.name)} ran for ${s.rushYds} yards${s.rushAtt?` on ${s.rushAtt} carr${s.rushAtt===1?'y':'ies'}`:''}${s.rushTD?` and ${s.rushTD===1?'a score':`${s.rushTD} scores`}`:''}`)}
 if(receiver&&bits.length<3){const s=receiver.stats;
  bits.push(`${gameEscape(receiver.name)} caught ${s.receptions||0} passes for ${s.recYds} yards${s.recTD?' and a score':''}`)}
 if(!bits.length){
  const stop=recapStopper(g,side);
  if(!stop)return '';
  return `${gameEscape(stop.p.name)} led the defense${stop.kind==='sacks'?` with ${stop.p.stats.sacks} sack${stop.p.stats.sacks===1?'':'s'}`:stop.kind==='int'?` with an interception`:` with ${stop.p.stats.tackles} tackles`}.`;
 }
 let out=`${bits.join('; ')}.`;
 // In a tight game the losing side's best performance is part of the story.
 if(f.margin<=10){
  const lp=recapLeader(g,f.loseSide,'passYds',260)||recapLeader(g,f.loseSide,'rushYds',110);
  if(lp)out+=` ${gameEscape(lp.name)} ${lp.stats.passYds>=260?`threw for ${lp.stats.passYds}`:`ran for ${lp.stats.rushYds}`} yards in the loss.`;
 }
 return out;
}
function recapColorLine(g,f,pick){
 const lines=[];
 const stop=recapStopper(g,f.winSide);
 if(stop&&stop.kind==='sacks')
  lines.push(`${gameEscape(stop.p.name)} got home ${stop.p.stats.sacks} times.`);
 else if(stop&&stop.kind==='int')
  lines.push(`${gameEscape(stop.p.name)} intercepted ${stop.p.stats.intDef>1?`${stop.p.stats.intDef} passes`:'a pass'}.`);
 else if(stop&&stop.kind==='tackles')
  lines.push(`${gameEscape(stop.p.name)} finished with ${stop.p.stats.tackles} tackles.`);
 const returning=(g.formerPlayers||[]).filter(p=>(g.playerStats[f.winSide]||[]).some(x=>x.id===p.id)||(g.playerStats[f.loseSide]||[]).some(x=>x.id===p.id));
 for(const p of returning.slice(0,1))
  lines.push(`${gameEscape(p.name)} played against ${gameEscape(p.formerSchool)}, his former school.`);
 // A one-week knock is not news; only a real absence is.
 const hurt=(g.injuries||[]).filter(x=>(x.weeks||0)>=3).slice(0,1);
 for(const inj of hurt)
  lines.push(`${gameEscape(inj.school)} lost ${gameEscape(inj.name)} to injury (${gameEscape(inj.type)}${inj.weeks?`, ${inj.weeks} week${inj.weeks===1?'':'s'}`:''}).`);
 if(!lines.length&&f.fgMade>=3)
  lines.push(`${gameEscape(f.win.name)} made ${f.fgMade} field goals.`);
 return lines.join(' ');
}
// Returns plain text sentences; callers escape nothing further because the
// team/player names are escaped as they are interpolated above.
function gameRecap(g,{short=false}={}){
 if(!g||!g.teamStats||!g.score)return {headline:'',body:''};
 const f=recapFacts(g),pick=recapPicker(g.id||`${g.season}_${g.week}_${g.home?.name}`);
 const result=recapResultLine(g,f,pick);
 if(short)return {headline:result,body:result};
 const body=[result,recapHowLine(g,f,pick),recapStarLine(g,f,pick),recapColorLine(g,f,pick),g.firstStart?.text&&gameEscape(g.firstStart.text)].filter(Boolean).join(' ');
 return {headline:result,body};
}
// --- v0.9.7: weekly newsletter ---------------------------------------------
// A week's archived games, ranked by how much they mattered, turned into a
// lead story plus short items. Everything is derived at render time from the
// same immutable game records the Game Center reads.
function newsWeeks(){const out=new Map();for(const g of universe.gameArchive||[])out.set(`${g.season}|${g.week}`,{season:g.season,week:g.week,label:g.label});return [...out.values()].sort((a,b)=>b.season-a.season||b.week-a.week)}
function newsGames(season,week,scope,teamName){
 const conf=T(teamName)?.conference;
 return (universe.gameArchive||[]).filter(g=>{
  if(g.season!==season||g.week!==week)return false;
  if(scope==='team')return g.home.name===teamName||g.away.name===teamName;
  if(scope==='conference')return [g.home.name,g.away.name].some(n=>T(n)?.conference===conf);
  return true;
 });
}
// Newsworthiness: ranked teams, upsets, close finishes and blowouts all rate.
function newsWeight(g){
 const f=recapFacts(g);let w=0;
 if(f.rankedWinner)w+=Math.max(0,30-f.wRank);
 if(f.rankedLoser)w+=Math.max(0,30-f.lRank);
 if(f.upset)w+=45;
 if(f.title)w+=60;
 if(f.margin<=3)w+=14;else if(f.margin<=7)w+=8;
 if(f.shutout)w+=10;
 if(f.margin>=35)w+=8;
 if((g.formerPlayers||[]).length)w+=6;
 return w;
}
// A one-line headline for an archived game, chosen from the same facts the recap uses:
// titles first, then upsets, rivalries, shutouts, close finishes, routs and ranked winners.
function newsHeadline(g){
 const f=recapFacts(g),W=f.win.name,L=f.lose.name,named=(n,r)=>r&&r<=25?`No. ${r} ${n}`:n;
 const rivalry=T(W)?.rivalry,rivalGame=rivalry&&T(L)?.id===rivalry.rivalId;
 if(f.title==='National Championship')return`${W} wins the national championship`;
 if(f.title&&/Championship$/.test(f.title))return`${W} claims the ${f.title}`;
 if(f.title&&/Bowl$/.test(f.title))return`${W} wins the ${f.title} over ${L}`;
 if(f.title)return`${W} advances past ${named(L,f.lRank)} in the ${f.title}`;
 if(f.upset)return`Upset: ${W} stuns ${named(L,f.lRank)}`;
 if(rivalGame)return`${W} takes ${rivalry.trophy||'the rivalry'} from ${L}`;
 if(f.shutout)return`${named(W,f.wRank)} blanks ${L}`;
 if(f.margin<=3)return`${named(W,f.wRank)} survives ${named(L,f.lRank)} by ${f.margin}`;
 if(f.margin>=28)return`${named(W,f.wRank)} routs ${L}`;
 return`${named(W,f.wRank)} beats ${named(L,f.lRank)}`;
}
// The week's top national story for the dashboard feed, skipping the controlled team's own
// game (that already has its FINAL item).
function newsHeadlineHubItem(u){
 const latest=newsWeeks()[0];if(!latest||latest.season!==universe.year)return[];
 const top=newsGames(latest.season,latest.week,'national',u?.name).filter(g=>g.home.name!==u?.name&&g.away.name!==u?.name).sort((a,b)=>newsWeight(b)-newsWeight(a))[0];
 if(!top||newsWeight(top)<20)return[];
 return[{type:'news',tab:'newsletter',importance:34,kicker:'HEADLINE',main:newsHeadline(top),sub:newsScoreLine(top)}];
}
function newsStandingsNote(season,week,teamName){
 const t=T(teamName);if(!t)return '';
 const played=(universe.gameArchive||[]).filter(g=>g.season===season&&(g.home.name===teamName||g.away.name===teamName));
 if(!played.length)return '';
 const last=played[played.length-1],side=last.home.name===teamName?'home':'away';
 const won=last.score[side]>last.score[side==='home'?'away':'home'];
 return `${gameEscape(teamName)} is ${t.w}-${t.l} (${t.cw}-${t.cl} ${gameEscape(t.conference)})${t.rank&&t.rank<=25?`, ranked No. ${t.rank}`:''} after ${won?'the win':'the loss'}.`;
}
function weeklyNewsletter(season,week,scope,teamName){
 const games=newsGames(season,week,scope,teamName).slice().sort((a,b)=>newsWeight(b)-newsWeight(a));
 if(!games.length)return null;
 const [lead,...rest]=games;
 return {
  season,week,scope,
  title:scope==='team'?`${teamName} · Week ${week}`:scope==='conference'?`${T(teamName)?.conference||'Conference'} · Week ${week}`:`National · Week ${week}`,
  lead:{game:lead,recap:gameRecap(lead)},
  items:rest.slice(0,scope==='national'?12:24).map(g=>({game:g,recap:gameRecap(g,{short:true})})),
  more:Math.max(0,rest.length-(scope==='national'?12:24)),
  note:newsStandingsNote(season,week,teamName),
 };
}
function gameBoxHTML(g){
 const fields=[['First downs','firstDowns'],['Plays','plays'],['Passing yards','passYds'],['Rushing yards','rushYds'],['Turnovers','turnovers'],['Sacks taken','sacksTaken'],['Field goals made','fgMade'],['Field goal attempts','fgAtt'],['Punts','punts']];
 let rows=[['Total yards',...['away','home'].map(s=>g.teamStats[s].passYds+g.teamStats[s].rushYds)],...fields.map(([n,k])=>[n,g.teamStats.away[k],g.teamStats.home[k]])];
 // Games recorded with the v0.16 play model carry flags, pressure and return totals; older games do not.
 const recordsFlags=['away','home'].every(s=>typeof g.teamStats?.[s]?.penalties==='number');
 if(recordsFlags){const ts=g.teamStats;rows.push(['Penalties – yards',...['away','home'].map(s=>`${ts[s].penalties}–${ts[s].penaltyYds||0}`)],['Pressures allowed',...['away','home'].map(s=>ts[s].pressures||0)],['Return yards',...['away','home'].map(s=>ts[s].returnYds||0)])}
 const conditionLine=g.conditions&&globalThis.DynastyGameConditions?globalThis.DynastyGameConditions.describe(g.conditions):null,conditionsNote=conditionLine?`<p class="game-conditions muted" data-severity="${conditionLine.severity}"><strong>${gameEscape(conditionLine.headline)}</strong>${conditionLine.notes.length?` · ${gameEscape(conditionLine.notes.join(' · '))}`:''}</p>`:'';
 // A compacted game keeps its leaders and scorers; say so rather than let the shorter list
 // read as a quiet night from everyone else.
 const compactNote=g.compacted?`<p class="muted">Individual lines for this game were compacted to its leaders and scorers to keep long dynasties small. Team statistics, the score and injuries are unchanged.</p>`:'';
 const groups=[['Passing',['Cmp','Att','Yds','TD','INT','Sacks'],['passComp','passAtt','passYds','passTD','int','sacksTaken'],'passAtt',4],['Rushing',['Car','Yds','Avg','TD'],['rushAtt','rushYds','rushAvg','rushTD'],'rushAtt',3],['Receiving',['Rec','Targets','Yds','Avg','TD'],['receptions','targets','recYds','recAvg','recTD'],'targets',4],['Defense',['Tkl','TFL','Sack','INT','PD','Pressures'],['tackles','tfl','sacks','intDef','passBreakups','pressures'],'tackles',2],['Kicking',['FGM','FGA'],['fgMade','fgAtt'],'fgAtt',2],['Punting',['Punts','Yds','Avg'],['punts','puntYds','puntAvg'],'punts',3],['Returns',['Ret','Yds','Avg','TD'],['returns','returnYds','retAvg','returnTD'],'returns',2],['Penalties',['Flags'],['penalties'],'penalties',1]];
 const filters=`<div class="game-box-controls" aria-label="Box score filters"><label>Player team<select data-game-box-team><option value="all">Both teams</option><option value="away">${gameEscape(g.away.name)}</option><option value="home">${gameEscape(g.home.name)}</option></select></label><label>Category<select data-game-box-category><option value="all">All categories</option>${groups.map(([title])=>`<option value="${title.toLowerCase()}">${title}</option>`).join('')}</select></label><output data-game-box-status aria-live="polite">Showing both teams · all categories</output></div>`;
 let html=conditionsNote+compactNote+filters+'<h3>Team statistics</h3>'+gameTable(['Statistic',g.away.name,g.home.name],rows)+`<p class="muted">The game does not record quarter scores, possession time, third and fourth downs${recordsFlags?'':', penalties'} or long gains. Player stat lines are distributed from each team’s production.</p><div class="game-player-stats">`;
 for(const side of ['away','home']){html+=`<section class="game-stat-team" data-game-stat-team="${side}"><h3>${gameEscape(g[side].name)}</h3>`;for(const [title,cols,keys,filter,defaultSort] of groups){const list=g.playerStats[side].filter(p=>p.stats[filter]||keys.some(k=>p.stats[k]));if(!list.length)continue;const category=title.toLowerCase();html+=`<section class="game-stat-group" data-game-stat-category="${category}"><h4>${title}</h4>`+gameTable(['Player','Pos',...cols],list.map(p=>[p.name,p.pos,...keys.map(k=>{const s=p.stats;if(k==='rushAvg')return s.rushAtt?((s.rushYds||0)/s.rushAtt).toFixed(1):'—';if(k==='recAvg')return s.receptions?((s.recYds||0)/s.receptions).toFixed(1):'—';if(k==='puntAvg')return s.punts?((s.puntYds||0)/s.punts).toFixed(1):'—';if(k==='retAvg')return s.returns?((s.returnYds||0)/s.returns).toFixed(1):'—';return s[k]||0})]),{sortable:true,defaultSort})+'</section>'}html+='</section>'}
 html+='</div>';
 return html;
}
function bindGameBoxControls(){
 const root=$('#gameDialogBody'),teamFilter=root.querySelector('[data-game-box-team]'),categoryFilter=root.querySelector('[data-game-box-category]'),status=root.querySelector('[data-game-box-status]');if(!teamFilter||!categoryFilter)return;
 const applyFilters=()=>{const team=teamFilter.value,category=categoryFilter.value;for(const section of root.querySelectorAll('[data-game-stat-team]')){const teamVisible=team==='all'||section.dataset.gameStatTeam===team;let visibleGroups=0;for(const group of section.querySelectorAll('[data-game-stat-category]')){const visible=teamVisible&&(category==='all'||group.dataset.gameStatCategory===category);group.hidden=!visible;if(visible)visibleGroups++}section.hidden=!teamVisible||visibleGroups===0}if(status)status.textContent=`Showing ${teamFilter.selectedOptions[0].textContent} · ${categoryFilter.selectedOptions[0].textContent.toLowerCase()}`};
 teamFilter.addEventListener('change',applyFilters);categoryFilter.addEventListener('change',applyFilters);applyFilters();
 for(const button of root.querySelectorAll('[data-game-sort]'))button.addEventListener('click',()=>{const table=button.closest('table'),head=button.closest('th'),index=+button.dataset.gameSort,rows=[...table.tBodies[0].rows],was=head.getAttribute('aria-sort'),direction=was==='ascending'?'descending':was==='descending'?'ascending':rows.every(row=>{const value=row.cells[index]?.dataset.sortValue??'';return value!==''&&Number.isFinite(Number(value))})?'descending':'ascending';for(const other of table.querySelectorAll('th')){other.classList.remove('sorted');other.removeAttribute('data-dir');other.setAttribute('aria-sort','none')}head.classList.add('sorted');head.dataset.dir=direction==='ascending'?'asc':'desc';head.setAttribute('aria-sort',direction);rows.sort((a,b)=>{const result=gameSortCompare(a.cells[index]?.dataset.sortValue,b.cells[index]?.dataset.sortValue);return direction==='ascending'?result:-result});for(const row of rows)table.tBodies[0].appendChild(row)});
}
// Derived from immutable game records: no new report text or live roster lookup.
function coachingReportHTML(g){
 const sections=['away','home'].map(side=>{
  const other=side==='home'?'away':'home',s=g.teamStats?.[side],o=g.teamStats?.[other];
  if(!s||!o)return `<section><h4>${gameEscape(g[side]?.name)}</h4><p>Coaching report unavailable: no recorded box score.</p></section>`;
  const known=x=>Number.isFinite(x),n=x=>known(x)?String(x):'unavailable';
  const ypc=known(o.rushYds)&&o.rushAtt>0?(o.rushYds/o.rushAtt).toFixed(1):'unavailable';
  const plan=g[side]?.gameplan,planText=plan?plan.label:'Not recorded for this older game';
  let next='Keep the balanced approach available; choose the next plan from the next opponent’s tendencies.';
  if(known(s.turnovers)&&s.turnovers>=2)next='Review ball security and quarterback decisions before chasing a more aggressive plan.';
  else if(known(s.sacksTaken)&&s.sacksTaken>=3)next='Review protection and your offensive-line depth chart before next week.';
  else if(o.rushAtt>=15&&o.rushYds/o.rushAtt>=5)next='Consider a stronger run front against a similar opponent; expect to give up some coverage.';
  else if(o.passAtt>=15&&o.passYds/o.passAtt>=8)next='Consider tighter pass coverage against a similar opponent; expect a softer run front.';
  const injuries=(g.injuries||[]).filter(i=>i.school===g[side]?.name);
  return `<section class="profile-section"><h4>${gameEscape(g[side]?.name)}</h4><p><strong>Plan:</strong> ${gameEscape(planText)}</p><p>Turnovers: ${n(s.turnovers)} committed / ${n(o.turnovers)} forced. Sacks: ${n(s.sacksTaken)} allowed / ${n(o.sacksTaken)} made.</p><p>Defense allowed ${n(o.rushYds)} rushing yards (${ypc} per carry) and ${n(o.passYds)} passing yards.</p><p><strong>Next practice:</strong> ${gameEscape(next)}</p>${injuries.length?`<p><strong>Availability:</strong> Review ${injuries.map(i=>gameEscape(i.name)).join(', ')} before setting next week’s lineup.</p>`:''}</section>`;
 });
 return `<section class="coaching-report"><h3>Postgame coaching report</h3><p class="muted">Recorded results and suggestions for next week. These numbers do not isolate the effect of a gameplan.</p><div class="profile-sections">${sections.join('')}</div></section>`;
}
