// Season in Review: once the postseason is complete, the dashboard sums up the controlled
// program's year. Everything here is derived from stored results (game archive, rankings,
// awards, season goals, recruiting); it creates no new state and uses no randomness.
function seasonReviewGames(t){
 return (universe.gameArchive||[]).filter(g=>g.season===universe.year&&(g.home?.name===t.name||g.away?.name===t.name)).map(g=>{
  const home=g.home.name===t.name,us=home?g.score?.home:g.score?.away,them=home?g.score?.away:g.score?.home,opp=home?g.away:g.home;
  const postseason=!!g.label&&g.label!=='Regular season';
  return{id:g.id,week:g.week,label:postseason?g.label:`Week ${g.week}`,postseason,opp:opp.name,oppRank:opp.rank&&opp.rank<=25?opp.rank:null,
   loc:postseason?'vs':home?'vs':'at',us:us??0,them:them??0,win:(us??0)>(them??0)};
 });
}
function seasonReviewMoments(t,games){
 // The rivalry game gets its own moment, so it is left out of the best-win and loss picks.
 const rival=rivalOf(t),rivalGame=rival&&games.find(g=>g.opp===rival.name),others=games.filter(g=>g!==rivalGame);
 const moments=[],wins=others.filter(g=>g.win),losses=others.filter(g=>!g.win);
 const describe=g=>`${g.win?'Beat':'Fell to'} ${g.oppRank?`#${g.oppRank} `:''}${g.opp} ${g.us}–${g.them}`;
 const best=wins.slice().sort((a,b)=>(a.oppRank??99)-(b.oppRank??99)||(b.us-b.them)-(a.us-a.them))[0];
 if(best)moments.push({kind:'best',title:best.oppRank?'Signature win':'Biggest win',text:describe(best),detail:best.label,gameId:best.id});
 const heartbreak=losses.slice().sort((a,b)=>(a.them-a.us)-(b.them-b.us)||b.week-a.week)[0];
 if(heartbreak)moments.push({kind:'loss',title:heartbreak.them-heartbreak.us<=7?'Heartbreaker':'Toughest loss',text:describe(heartbreak),detail:heartbreak.label,gameId:heartbreak.id});
 if(rivalGame)moments.push({kind:'rivalry',title:rivalGame.win?'Rivalry won':'Rivalry lost',text:describe(rivalGame),detail:t.rivalry?.trophy||rivalGame.label,gameId:rivalGame.id});
 return moments;
}
function seasonReviewOutcome(t,games){
 if(universe.champion===t.name)return'National champions';
 const last=games.filter(g=>g.postseason).at(-1);
 if(!last)return(t.w||0)>=6?'No postseason bid':'Missed bowl eligibility';
 return last.win?`Won the ${last.label}`:`Lost in the ${last.label}`;
}
function seasonReviewLeaders(t){
 const cats=[['Passing','passYds',p=>`${p.stats.passYds.toLocaleString('en-US')} yds · ${p.stats.passTD||0} TD`],
  ['Rushing','rushYds',p=>`${p.stats.rushYds.toLocaleString('en-US')} yds · ${p.stats.rushTD||0} TD`],
  ['Receiving','recYds',p=>`${p.stats.recYds.toLocaleString('en-US')} yds · ${p.stats.recTD||0} TD`],
  ['Tackles','tackles',p=>`${p.stats.tackles} tackles · ${p.stats.tfl||0} TFL`],
  ['Pass rush','sacks',p=>`${p.stats.sacks} sacks`]];
 const out=[];
 for(const [label,key,line] of cats){
  const p=(t.roster||[]).filter(x=>(x.stats?.[key]||0)>0).sort((a,b)=>b.stats[key]-a.stats[key])[0];
  if(p)out.push({label,playerId:p.id,name:p.name,pos:p.pos,line:line(p)});
 }
 return out;
}
function seasonReviewModel(t=selected()){
 // Shown from the end of the postseason until departures run; after that the roster no longer
 // matches the season (graduates leave), so leaders would silently change.
 if(!t||universe.phase!=='complete'||!['review','departures'].includes(normalizeOffseasonState().phase))return null;
 const games=seasonReviewGames(t);if(!games.length)return null;
 const goals=evaluateSeasonGoals(t,false),signees=(universe.recruits||[]).filter(r=>r.committed===t.name);
 const stars=signees.length?signees.reduce((s,r)=>s+(r.stars||0),0)/signees.length:0;
 return{
  year:universe.year,team:t.name,record:`${t.w||0}–${t.l||0}`,conference:`${t.cw||0}–${t.cl||0} ${t.conference}`,
  rank:t.rank&&t.rank<=25?`#${t.rank}`:'Unranked',outcome:seasonReviewOutcome(t,games),
  games,moments:seasonReviewMoments(t,games),leaders:seasonReviewLeaders(t),
  awards:(universe.awards?.[universe.year]||[]).filter(a=>a.team===t.name).map(a=>({name:a.name,playerId:a.playerId,playerName:a.playerName,pos:a.pos})),
  goals:goals.results.map(g=>({label:g.label,weight:g.weight||g.tier,state:g.state,progress:g.progress})),
  recruiting:{signees:signees.length,blueChips:signees.filter(r=>(r.stars||0)>=4).length,avgStars:Math.round(stars*10)/10,rank:recruitingClassRank(t)}
 };
}
function seasonReviewChipLabel(g){
 if(!g.postseason)return`Wk ${g.week}`;
 if(/national championship/i.test(g.label))return'Title game';
 if(/bowl/i.test(g.label))return'Bowl';
 if(/championship/i.test(g.label))return'Conf. title';
 return'Playoff';
}
function seasonReviewHTML(m){
 const game=g=>`<button type="button" class="sr-game ${g.win?'win':'loss'}${g.postseason?' post':''}" data-game="${esc(g.id)}" title="${esc(`${g.label}: ${g.win?'W':'L'} ${g.us}–${g.them} ${g.loc} ${g.opp}`)}"><b>${g.win?'W':'L'}</b><span>${esc(seasonReviewChipLabel(g))}</span><small>${g.us}–${g.them}</small></button>`;
 const goalIcon={complete:'✓',failed:'✕',at_risk:'!'};
 const r=m.recruiting;
 return `<div class="section-head"><div><div class="eyebrow">${esc(m.year)} SEASON IN REVIEW</div><h2>${esc(m.outcome)}</h2><div class="muted">${esc(m.record)} · ${esc(m.conference)} · Final ranking ${esc(m.rank)}</div></div></div>
 <div class="sr-strip" aria-label="Season results">${m.games.map(game).join('')}</div>
 <div class="sr-grid">
  <div class="sr-block"><div class="eyebrow">DEFINING MOMENTS</div>${m.moments.map(x=>`<button type="button" class="sr-moment ${x.kind}" data-game="${esc(x.gameId)}"><small>${esc(x.title)}</small><strong>${esc(x.text)}</strong><span>${esc(x.detail)}</span></button>`).join('')||'<p class="muted">No games recorded.</p>'}</div>
  <div class="sr-block"><div class="eyebrow">TEAM LEADERS</div>${m.leaders.map(x=>`<div class="lineitem"><span><span class="muted">${esc(x.label)}</span> <button type="button" class="player-button" data-player="${esc(x.playerId)}">${esc(x.name)}</button> <span class="muted">${esc(x.pos)}</span></span><span>${esc(x.line)}</span></div>`).join('')}
   ${m.awards.length?`<div class="sr-awards">${m.awards.map(a=>`<span class="pill">🏆 ${esc(a.name)}: ${esc(a.playerName)}</span>`).join('')}</div>`:''}</div>
  <div class="sr-block"><div class="eyebrow">SEASON GOALS</div>${m.goals.map(g=>`<div class="lineitem"><span>${goalIcon[g.state]||'•'} ${esc(g.label)}</span><span class="${g.state==='complete'?'good':g.state==='failed'?'bad':'muted'}">${esc(g.state==='complete'||g.state==='failed'?seasonGoalStatusLabel(g.state):'Signing day pending')}</span></div>`).join('')}
   <div class="eyebrow" style="margin-top:12px">RECRUITING CLASS</div><div class="lineitem"><span>${r.signees} commits${r.blueChips?` · ${r.blueChips} blue-chip${r.blueChips===1?'':'s'}`:''} · ${r.avgStars||'—'}★ average</span><span>${r.rank?`#${r.rank} class`:'Unranked'}</span></div></div>
 </div>`;
}
function renderSeasonReview(){
 const dash=document.querySelector('#dashboard'),center=dash?.querySelector('.command-center');if(!dash||!center)return;
 let host=document.querySelector('#seasonReview');const m=seasonReviewModel();
 if(!m){if(host)host.hidden=true;return}
 if(!host){host=document.createElement('section');host.id='seasonReview';host.className='card season-review';center.before(host)}
 host.hidden=false;host.innerHTML=seasonReviewHTML(m);attachPlayerLinks();
}
extendRender('dashboard',renderSeasonReview);
globalThis.DynastySeasonReview={model:seasonReviewModel};
