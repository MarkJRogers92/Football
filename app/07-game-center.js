// app/07-game-center.js: Game archive compaction, box scores and the game center. Part of app.js; see tools/app-source.js.
// --- v0.9.49 commit 4: tiered game-detail compaction --------------------------
// Measured first (docs/SAVE_GROWTH_V0949.md): per-game player deltas are 87.9% of the game
// archive and ~44% of all save growth. The packet's proposed target, drive/play detail, is
// 0.0% of routine games because only the Game Day's detailed engine ever produces it — so
// the packet's own tiering is applied to the field that actually holds the bytes instead.
const GAME_DETAIL_HORIZON=3,COMPACTION_MANIFEST_CAP=40;
// Never compacted: anything a player would go back and read. Everything the permanent tier
// names — score, participants, context, team box, injuries, leaders — is kept either way.
function gameIsProtected(g,userTeamName){
 if(!g)return true;
 if(g.label&&g.label!=='Regular season')return true;          // titles, bowls, playoff
 if(g.drives?.length||g.plays?.length)return true;            // a Game Day game the player watched
 const names=[g.home?.name,g.away?.name];
 if(userTeamName&&names.includes(userTeamName))return true;
 const home=T(g.home?.name),away=T(g.away?.name);
 if(home&&away&&(primaryRivalId(home)===away.id||primaryRivalId(away)===home.id))return true;
 return false;
}
// A line survives if it carries a scoring or turnover contribution, or leads its side in
// passing, rushing or receiving yards — the "leaders" the permanent tier requires.
function keptStatLines(lines){
 if(!Array.isArray(lines)||!lines.length)return lines||[];
 const lead=key=>{
  let best=null,bestVal=0;
  for(const p of lines){const v=p.stats?.[key]||0;if(v>bestVal){bestVal=v;best=p}}
  return best;
 };
 const keep=new Set([lead('passYds'),lead('rushYds'),lead('recYds')].filter(Boolean));
 for(const p of lines){
  const st=p.stats||{};
  if(st.passTD||st.rushTD||st.recTD||st.int||st.fgMade)keep.add(p);
 }
 return lines.filter(p=>keep.has(p));
}
function compactGame(g){
 if(!g||g.compacted||!g.playerStats)return null;
 const before={home:g.playerStats.home||[],away:g.playerStats.away||[]};
 const kept={home:keptStatLines(before.home),away:keptStatLines(before.away)};
 const dropped=(before.home.length-kept.home.length)+(before.away.length-kept.away.length);
 if(!dropped)return null;
 g.playerStats=kept;
 // The marker is what tells the box score to say so rather than imply the game was quiet.
 g.compacted={season:universe.year,dropped,kept:kept.home.length+kept.away.length};
 return g.compacted;
}
// Runs over seasons older than the horizon. Game ids and every link to them are untouched.
function compactGameArchive({horizon=GAME_DETAIL_HORIZON}={}){
 const cutoff=universe.year-horizon,user=$('#userTeam')?.value||null;
 let games=0,dropped=0;
 for(const g of universe.gameArchive||[]){
  if((g.season??universe.year)>cutoff)continue;
  if(gameIsProtected(g,user))continue;
  const res=compactGame(g);
  if(res){games++;dropped+=res.dropped}
 }
 if(games){
  universe.compactionManifest??=[];
  universe.compactionManifest.push({at:universe.year,cutoff,games,dropped});
  if(universe.compactionManifest.length>COMPACTION_MANIFEST_CAP)
   universe.compactionManifest.splice(0,universe.compactionManifest.length-COMPACTION_MANIFEST_CAP);
 }
 return {games,dropped};
}

// v0.26: real quarter-by-quarter scores. Only games whose scoring drives recorded their period (Game Engine 2 games
// archived from v0.26) have them, and only when the drives add up to the final score; otherwise nothing is shown.
function gameLineScore(g){
 const drives=(g?.drives||[]).filter(d=>Number(d.points)>0);if(!drives.length||drives.some(d=>!(Number(d.q)>0)))return null;
 const last=Math.max(4,...drives.map(d=>Number(d.q))),row=()=>Array(last).fill(0),out={periods:last,home:row(),away:row()};
 for(const d of drives){if(!out[d.side])return null;out[d.side][Number(d.q)-1]+=Number(d.points)}
 const sum=r=>r.reduce((n,v)=>n+v,0);if(sum(out.home)!==Number(g.score?.home)||sum(out.away)!==Number(g.score?.away))return null;
 return out;
}
function gamePeriodLabel(q){q=Number(q);return q>4?(q===5?'OT':`${q-4}OT`):`Q${q}`}
function gameLineScoreHTML(g,cls='line-score'){
 const ls=gameLineScore(g);if(!ls)return'';
 const head=Array.from({length:ls.periods},(_,i)=>`<th scope="col">${i<4?i+1:gamePeriodLabel(i+1)}</th>`).join('');
 const row=side=>`<tr><th scope="row">${gameEscape(g[side]?.name||side)}</th>${ls[side].map(v=>`<td>${v}</td>`).join('')}<td class="line-score-total">${Number(g.score?.[side])||0}</td></tr>`;
 return`<table class="${cls}" aria-label="Score by quarter"><thead><tr><th scope="col" aria-label="Team"></th>${head}<th scope="col">T</th></tr></thead><tbody>${row('away')}${row('home')}</tbody></table>`;
}
function gameSummaryHTML(g){
 const winner=g.score.home>g.score.away?g.home:g.away;
 let html=`<p class="recap">${gameRecap(g).body}</p><p><strong>${gameEscape(winner.name)} wins by ${Math.abs(g.score.home-g.score.away)}.</strong> Total offense: ${gameEscape(g.away.name)} ${g.teamStats.away.passYds+g.teamStats.away.rushYds} yards; ${gameEscape(g.home.name)} ${g.teamStats.home.passYds+g.teamStats.home.rushYds} yards.</p>${(h=>h?`${h}<p class="muted">The recap above is written from this box score. Attendance and the game clock are not recorded for this game.</p>`:'<p class="muted">The recap above is written from this box score. Quarter-by-quarter scores, attendance and the game clock are not recorded for this game.</p>')(gameLineScoreHTML(g))}${coachingReportHTML(g)}<h3>Game leaders</h3>`;
 for(const side of ['away','home']){html+=`<h4>${gameEscape(g[side].name)}</h4>`;for(const [label,key] of [['Passing','passYds'],['Rushing','rushYds'],['Receiving','recYds'],['Tackles','tackles']]){const p=g.playerStats[side].slice().sort((a,b)=>(b.stats[key]||0)-(a.stats[key]||0))[0];if(p?.stats[key])html+=`<div class="lineitem"><span>${label} · ${gameEscape(p.name)}</span><strong>${p.stats[key]}${key==='tackles'?'':' yds'}</strong></div>`}}
 html+='<h3>Scoring summary</h3>';const scoring=(g.drives||[]).filter(d=>d.points);html+=scoring.length?scoring.map(d=>`<div class="lineitem"><span>${d.q?`${gamePeriodLabel(d.q)} · `:''}${gameEscape(d.label)} · ${gameEscape(g[d.side].name)}</span><strong>${gameEscape(d.result)} +${d.points}</strong></div>`).join(''):'<p class="muted">Individual scoring plays were not retained for this simulation.</p>';
 for(const s of ['away','home'])if(g.scoreAdjustment?.[s])html+=`<p class="muted">${gameEscape(g[s].name)}: ${g.scoreAdjustment[s]} additional simulation points (home-field/tiebreak adjustment; no scoring play recorded).</p>`;
 if(g.formerPlayers?.length)html+='<h3>Familiar faces</h3>'+g.formerPlayers.map(p=>`<p>${gameEscape(p.name)} appeared for ${gameEscape(p.school)} against former school ${gameEscape(p.formerSchool)}.</p>`).join('');
 html+='<h3>Injuries recorded in this game</h3>'+(g.injuries?.length?g.injuries.map(i=>`<p>${gameEscape(i.name)} · ${gameEscape(i.school)} · ${gameEscape(i.type)}, ${i.weeks} week(s)</p>`).join(''):'<p class="muted">None recorded.</p>');return html;
}
function gameDrivesHTML(g){
 if(!g.drives?.length)return '<p>No drive detail recorded. Use Box Score for the permanent statistics.</p>';
 const score={away:0,home:0};
 const drives=g.drives.map((d,i)=>{
  score[d.side]=(score[d.side]||0)+(d.points||0);
  const team=g[d.side]?.name||d.side,result=d.result||'END';
  return `<button type="button" class="drive-step" data-drive-step="${i}" data-side="${gameEscape(d.side)}" data-result="${gameEscape(result)}" data-points="${Number(d.points)||0}" data-plays="${Number(d.plays)||0}" data-away-score="${score.away}" data-home-score="${score.home}" aria-label="Drive ${i+1}: ${gameEscape(team)}, ${gameEscape(result)}, ${Number(d.points)||0} points"><span>${gameEscape(d.label||`D${i+1}`)}</span><strong>${gameEscape(team)}</strong><small>${gameEscape(result)} · ${Number(d.plays)||0} plays${d.points?` · +${d.points}`:''}</small></button>`;
 }).join('');
 return `<section class="drive-replay" data-drive-replay data-away="${gameEscape(g.away.name)}" data-home="${gameEscape(g.home.name)}"><div class="drive-replay-head"><div><div class="eyebrow">POSSESSION REPLAY</div><h3>Drive sequence</h3></div><button type="button" data-drive-play aria-pressed="false">Play sequence</button></div><div class="drive-field" role="img" aria-label="Schematic field showing recorded drive outcomes; exact field position was not retained"><div class="drive-endzone away"><span>${gameEscape(g.away.name)}</span></div><div class="drive-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b class="drive-ball">🏈</b></div><div class="drive-endzone home"><span>${gameEscape(g.home.name)}</span></div></div><div class="drive-live" aria-live="polite"><div><span>${gameEscape(g.away.name)}</span><strong data-drive-away-score>0</strong></div><p data-drive-caption>Select a drive or play the recorded sequence.</p><div><span>${gameEscape(g.home.name)}</span><strong data-drive-home-score>0</strong></div></div><div class="drive-sequence" role="list" aria-label="Recorded drives">${drives}</div></section><p class="muted">This is a schematic outcome replay. Drives begin at the 25, but exact field position, clock and possession time were not retained. The final score can also include recorded home-field or tiebreak adjustments.</p>`;
}
function gameWatchHTML(g){
 if(!g.drives?.length)return '<section class="watch-unavailable"><h3>Watch Mode unavailable</h3><p>This game does not have recorded drive detail. Its permanent result and statistics are still available in Summary and Box Score.</p></section>';
 const score={away:0,home:0};
 const drives=g.drives.map((d,i)=>{score[d.side]=(score[d.side]||0)+(Number(d.points)||0);const team=g[d.side]?.name||d.side,result=d.result||'END',plays=Number(d.plays)||0,events=(d.playByPlay||[]).map((x,j)=>`<span data-watch-play-event="${j}">${gameEscape(x)}</span>`).join('');let recap;if(result==='TD')recap=`${team} reaches the end zone`;else if(result==='FG')recap=`${team} converts a field goal`;else if(result==='MISS')recap=`${team} misses the field goal`;else if(result==='PUNT')recap=`${team} punts`;else if(result==='INT')recap=`${team}'s possession ends with an interception`;else recap=`${team}'s possession ends`;return `<article class="watch-drive" data-watch-drive="${i}" data-side="${gameEscape(d.side)}" data-result="${gameEscape(result)}" data-points="${Number(d.points)||0}" data-away-score="${score.away}" data-home-score="${score.home}" hidden><span>${gameEscape(d.label||`D${i+1}`)}</span><strong>${gameEscape(team)}</strong><small>${gameEscape(result)} · ${plays} plays${d.points?` · +${d.points}`:''}</small><p>${gameEscape(recap)} after ${plays} plays. Score: ${gameEscape(g.away.name)} ${score.away}, ${gameEscape(g.home.name)} ${score.home}.</p><div data-watch-play-events hidden>${events}</div></article>`}).join('');
 const adjustmentAway=Number(g.scoreAdjustment?.away)||0,adjustmentHome=Number(g.scoreAdjustment?.home)||0;
 return `<section class="watch-mode" data-watch-game data-away="${gameEscape(g.away.name)}" data-home="${gameEscape(g.home.name)}" data-final-away="${Number(g.score.away)||0}" data-final-home="${Number(g.score.home)||0}" data-adjust-away="${adjustmentAway}" data-adjust-home="${adjustmentHome}"><div class="watch-header"><div><div class="eyebrow">BROADCAST WATCH MODE</div><h3>${gameEscape(g.away.name)} at ${gameEscape(g.home.name)}</h3></div><div class="watch-controls"><button type="button" data-watch-play aria-pressed="false">Play</button><button type="button" data-watch-next>Next play</button><label>Speed<select data-watch-speed aria-label="Broadcast speed"><option value="1400">Slow</option><option value="850" selected>Normal</option><option value="400">Fast</option></select></label><button type="button" data-watch-skip>Skip to final</button></div></div><div class="drive-field watch-field" role="img" aria-label="Schematic broadcast field showing recorded drive outcomes; exact field position was not retained"><div class="drive-endzone away"><span>${gameEscape(g.away.name)}</span></div><div class="drive-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b class="drive-ball">🏈</b></div><div class="drive-endzone home"><span>${gameEscape(g.home.name)}</span></div></div><div class="drive-live watch-score" aria-live="polite"><div><span>${gameEscape(g.away.name)}</span><strong data-watch-away-score>0</strong></div><p data-watch-caption>Ready for kickoff. Press Play or reveal the next play.</p><div><span>${gameEscape(g.home.name)}</span><strong data-watch-home-score>0</strong></div></div><section class="watch-playboard"><div class="eyebrow" data-watch-play-kicker>LIVE PLAY-BY-PLAY</div><ol data-watch-play-log aria-live="polite"><li class="watch-play-empty">The opening play will appear here.</li></ol></section><div class="watch-progress"><span data-watch-progress>0 of ${g.drives.length} drives</span><i><b data-watch-progress-bar></b></i></div><div class="watch-feed" role="log" aria-live="polite" aria-label="Completed drive recaps">${drives}</div><div class="watch-final" data-watch-final-card hidden><div class="eyebrow">FINAL</div><strong data-watch-final-line></strong><p data-watch-adjustment hidden></p><button type="button" data-watch-summary>Open final summary</button></div><p class="muted watch-disclosure">The game is calculated once before this broadcast begins. New detailed games retain their generated play calls; older archives without them advance one drive at a time. Exact field position, clock and possession time are not retained or invented.</p></section>`;
}
let openedGameId=null;
let candidateOfferDraft=null;
function showGameCenter(id,tab='Summary'){
 if(gamesAreDeferred())return storageOperation(async()=>{await ensureGamesLoaded();showGameCenter(id,tab)});
 const g=(universe.gameArchive||[]).find(x=>x.id===id);if(!g)return;openedGameId=id;
 const watching=tab==='Watch';
 $('#gameDialogName').innerHTML=watching?`${teamLogoHTML(g.away.id,48,'team-logo--inline')} ${g.away.name} at ${teamLogoHTML(g.home.id,48,'team-logo--inline')} ${g.home.name}`:`${teamLogoHTML(g.away.id,48,'team-logo--inline')} ${g.away.name} ${g.score.away} — ${g.score.home} ${teamLogoHTML(g.home.id,48,'team-logo--inline')} ${g.home.name}`;
 $('#gameDialogMeta').textContent=`${watching?'WATCH MODE':'FINAL'} · ${g.season} · Week ${g.week} · ${g.label} · ${g.venue}`;
 $('#gamePregame').textContent=`Pregame: ${g.away.name} ${g.away.record} (#${g.away.rank??'—'}) · ${g.home.name} ${g.home.record} (#${g.home.rank??'—'})`;
 $$('#gameTabs button').forEach(b=>{b.classList.toggle('active',b.dataset.gameTab===tab);b.setAttribute('aria-pressed',String(b.dataset.gameTab===tab));if(b.dataset.gameTab==='Game Cast')b.hidden=!g.drives?.length});
 let html;if(tab==='Game Cast')html=gameCastHTML(g);else if(tab==='Watch')html=(typeof gameCastWatchHTML==='function'&&gameCastWatchHTML(g))||gameWatchHTML(g);else if(tab==='Box Score')html=gameBoxHTML(g);else if(tab==='Drives')html=gameDrivesHTML(g);else if(tab==='Play-by-Play'){const archived=(g.drives||[]).flatMap(d=>(d.playByPlay||[]).map(x=>`${d.label}: ${x}`)),d=universe.lastDetailedGame,lines=archived.length?archived:(d?.gameId===id?d.log||[]:[]);html=lines.length?`<p class="muted">${archived.length?'Archived generated play log.':'Temporary simulation log (last 160 entries).'} The drive model names primary players; box scores allocate production across the rotation. Clock and exact field position are unavailable.</p>`+lines.map(x=>`<div class="playline">${gameEscape(x)}</div>`).join(''):'<p>Play-by-play is unavailable for this archived game. Box scores and recorded drive summaries remain permanent.</p>'}else html=gameSummaryHTML(g);
 $('#gameDialog').dataset.gameTab=tab;$('#gameDialogBody').innerHTML=html;if(tab==='Box Score')bindGameBoxControls();if(tab==='Game Cast')bindGameCast();const dialog=$('#gameDialog');if(!dialog.open)dialog.showModal();if(tab==='Watch'&&typeof bindGameCastWatch==='function')bindGameCastWatch();
}
function renderGameArchive(){
 if(gamesAreDeferred())return storageOperation(async()=>{await ensureGamesLoaded();renderGameArchive()});
 const picker=$('#gameHistoryYear'),previous=picker.value,teamId=selected().id,games=(universe.gameArchive||[]).filter(g=>g.home.id===teamId||g.away.id===teamId),years=[...new Set(games.map(g=>g.season))].sort((a,b)=>b-a);
 picker.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');picker.value=years.includes(+previous)?previous:String(years[0]||'');
 $('#gameHistoryList').innerHTML=games.filter(g=>g.season===+picker.value).map(g=>`<div class="resultrow"><span>Week ${g.week} · ${gameEscape(g.label)}</span>${gameLink(g.id,`${g.away.name} ${g.score.away} — ${g.score.home} ${g.home.name}`)}</div>`).join('')||'<p class="muted">Completed games for this school will be listed here.</p>';
}

function recordGame(home,away,hp,ap,conf,H=profiles(home),A=profiles(away)){const win=hp>ap?home:away,lose=win===home?away:home;win.w++;lose.l++;if(conf){win.cw++;lose.cl++}home.pf+=hp;home.pa+=ap;away.pf+=ap;away.pa+=hp;home.sos+=A.overall;away.sos+=H.overall;return win}
function applyStarterStats(team,s,opp=null){applyGameStats(team,s,opp||{})}
