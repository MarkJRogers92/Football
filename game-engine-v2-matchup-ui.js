// v0.10.1 release-facing matchup intelligence and postgame gameplan receipt.
function v2MatchupEdgeTone(v){return v>=3?'good':v<=-3?'bad':''}
function v2MatchupEdgeRow(label,v){return`<div class="v2-matchup-edge"><span>${gameEscape(label)}</span><strong class="${v2MatchupEdgeTone(v)}">${gameEscape(matchupEdgeLabel(v))}<small>${v>=0?'+':''}${v}</small></strong></div>`}
function v2MatchupPlayer(team,role,label){const p=roleStarter(team,role);return p?{p,label}:null}
function v2MatchupKeyPlayers(team){
  const candidates=[v2MatchupPlayer(team,'QB1','QB'),v2MatchupPlayer(team,'RB1','Backfield'),v2MatchupPlayer(team,'X','Top target'),v2MatchupPlayer(team,'RUSH','Pass rush'),v2MatchupPlayer(team,'MIKE','Front seven'),v2MatchupPlayer(team,'FCB','Coverage')].filter(Boolean);
  const seen=new Set(),out=[];for(const row of candidates){if(seen.has(String(row.p.id)))continue;seen.add(String(row.p.id));out.push(row);if(out.length===3)break}return out
}
function v2MatchupPlayerHTML(team){
  const rows=v2MatchupKeyPlayers(team);if(!rows.length)return'<div class="muted">No projected key players available.</div>';
  return rows.map(({p,label})=>`<div class="v2-matchup-player"><span>${gameEscape(label)}</span><strong>${gameEscape(p.name)} · ${gameEscape(p.pos||'')}</strong><small>${p.injury?`${gameEscape(p.injury)} · ${p.injuryWeeks||0} wk`:gameAvailable(p)?`Health ${Math.round(p.health??100)}`:'Unavailable'}</small></div>`).join('')
}
function v2MatchupAvailability(team){
  const injuries=(team.roster||[]).filter(p=>p.injury||(p.injuryWeeks||0)>0).sort((a,b)=>(b.injuryWeeks||0)-(a.injuryWeeks||0));
  if(!injuries.length)return'<span class="good">No active injuries</span>';
  const shown=injuries.slice(0,4).map(p=>`${gameEscape(p.name)} (${gameEscape(p.pos||'')}, ${gameEscape(p.injury||'limited')}, ${p.injuryWeeks||0} wk)`).join(' · ');
  return`<span class="warn">${shown}${injuries.length>4?` · +${injuries.length-4} more`:''}</span>`
}
function v2MatchupPlanHTML(team,opp,matchup){
  const plan=teamGameplanFor(team,opp.name),tier=GAMEPLAN_TIERS[plan?.prep]||GAMEPLAN_TIERS.standard,rec=gameplanRecommendation(team,opp,matchup),recommended=GAMEPLAN_TIERS[rec.id]||GAMEPLAN_TIERS.balance;
  const planSet=!!plan;
  return`<div class="v2-matchup-plan"><div><span>Active plan</span><strong>${gameEscape(tier.label)}</strong></div><div><span>Staff recommendation</span><strong>${gameEscape(recommended.label)}</strong><small>${gameEscape(rec.reason)}</small></div><div class="v2-matchup-plan-action">${planSet?'<span class="pill good">Plan locked for kickoff</span>':'<button type="button" data-v2-open-coachs-desk>Set plan in Coach’s Desk</button>'}</div></div>`
}
function v2MatchupStakes(team,opp,g){
  const rival=rivalOf(team),isRival=rival?.name===opp.name,sameConference=team.conference===opp.conference;
  if(isRival)return`${team.rivalry?.trophy||'Rivalry game'} · ${rivalrySeriesText(team)}`;
  if(sameConference)return`${team.conference} Conference game`;
  return'Nonconference game'
}
function ensureV2MatchupHost(){
  let host=document.querySelector('#v2MatchupIntelligence');if(host)return host;const next=document.querySelector('#nextGameCard');if(!next)return null;
  host=document.createElement('div');host.id='v2MatchupIntelligence';host.className='card v2-matchup-host';next.insertAdjacentElement('afterend',host);return host
}
function v2MatchupReceiptHTML(){
  const record=typeof v2ReleaseRecord==='function'?v2ReleaseRecord():null,me=selected(),api=globalThis.DynastyGameplanFeedback;if(!record||!me||!api)return'';
  let receipt;try{receipt=api.forTeam(record,me.id)}catch{return''}
  const tone=receipt.verdict==='Worked'?'good':receipt.verdict==='Missed'?'bad':'warn';
  return`<div class="card v2-plan-receipt"><div class="section-head"><div><div class="eyebrow">POSTGAME PLAN RECEIPT</div><h3>${gameEscape(receipt.plan.label)}</h3></div><span class="pill ${tone}">${gameEscape(receipt.verdict)}</span></div><strong>${gameEscape(receipt.headline)}</strong><div class="muted">${gameEscape(receipt.detail)}</div><div class="small muted">This grades the archived result against the plan’s intended matchup target. It does not claim the plan alone caused the outcome.</div></div>`
}
function renderV2MatchupIntelligence(){
  const host=ensureV2MatchupHost();if(!host)return;const team=selected(),g=findUserGame();
  if(!team||!g){host.hidden=true;const old=document.querySelector('#v2PlanReceipt');if(old)old.remove();return}
  const opp=T(g.home===team.name?g.away:g.home);if(!opp){host.hidden=true;return}host.hidden=false;
  const m=gameMatchup(team,opp),P=m.teamProfile,O=m.opponentProfile,e=m.teamEdges,oe=m.opponentEdges,isHome=g.home===team.name,passMix=Math.round((OFF_SCHEMES[opp.offScheme]?.pass??.5)*100),homeText=isHome?`Home field +${homeFieldFor(team).toFixed(1)} pts`:`Road game · ${opp.name} receives home field`;
  host.innerHTML=`<div class="v2-matchup-head"><div><div class="eyebrow">GAME DAY INTELLIGENCE</div><h2>${teamLogoHTML(team.id,34,'team-logo--inline')} ${gameEscape(team.name)} ${isHome?'vs':'at'} ${teamLogoHTML(opp.id,34,'team-logo--inline')} ${gameEscape(opp.name)}</h2><div class="muted">Week ${g.week??universe.week+1} · ${gameEscape(v2MatchupStakes(team,opp,g))} · ${gameEscape(homeText)}</div></div><div class="v2-matchup-ratings"><span>YOU <b>O ${grade(P.offense)} · D ${grade(P.defense)}</b></span><span>THEM <b>O ${grade(O.offense)} · D ${grade(O.defense)}</b></span></div></div><div class="v2-matchup-grid"><section><div class="v2-matchup-section-head"><strong>Where the game tilts</strong><span>Current kickoff profiles</span></div>${v2MatchupEdgeRow('Your passing game vs coverage',e.passGame)}${v2MatchupEdgeRow('Your run game vs front',e.runGame)}${v2MatchupEdgeRow('Your protection vs rush',e.passProtection)}${v2MatchupEdgeRow('Their passing game vs coverage',oe.passGame)}${v2MatchupEdgeRow('Their run game vs front',oe.runGame)}${v2MatchupEdgeRow('Their protection vs rush',oe.passProtection)}</section><section><div class="v2-matchup-section-head"><strong>Opponent identity</strong><span>${passMix}% pass tendency</span></div><div class="v2-matchup-tendency"><b>${passMix>=55?'Pass leaning':passMix<=45?'Run leaning':'Balanced'}</b><span>${passMix}% pass · ${100-passMix}% run</span></div><div class="v2-matchup-section-head minor"><strong>Availability</strong></div><div class="v2-matchup-availability"><span>You</span>${v2MatchupAvailability(team)}</div><div class="v2-matchup-availability"><span>Them</span>${v2MatchupAvailability(opp)}</div></section></div><div class="v2-matchup-grid players"><section><div class="v2-matchup-section-head"><strong>Your key players</strong></div>${v2MatchupPlayerHTML(team)}</section><section><div class="v2-matchup-section-head"><strong>Players to know</strong></div>${v2MatchupPlayerHTML(opp)}</section></div>${v2MatchupPlanHTML(team,opp,m)}<div class="small muted v2-matchup-note">Matchup edges use the same health, wear, scheme, staff and active game-plan profile inputs consumed at kickoff.</div>`;
  host.querySelector('[data-v2-open-coachs-desk]')?.addEventListener('click',()=>{document.querySelector('.tab-groups button[data-group="program"]')?.click();document.querySelector('.tabs button[data-tab="dashboard"]')?.click();document.querySelector('#weeklyDecisions')?.scrollIntoView({behavior:'smooth',block:'center'})});
  let receipt=document.querySelector('#v2PlanReceipt');if(!receipt){receipt=document.createElement('div');receipt.id='v2PlanReceipt';host.insertAdjacentElement('afterend',receipt)}receipt.innerHTML=v2MatchupReceiptHTML()
}
const renderGameLabBeforeMatchupV2=TAB_RENDERERS.gamelab;TAB_RENDERERS.gamelab=()=>{renderGameLabBeforeMatchupV2();renderV2MatchupIntelligence()};
if(globalThis.__DL_TEST__)globalThis.__DL_TEST__.v2MatchupSummary=()=>{const h=document.querySelector('#v2MatchupIntelligence');return h?{visible:!h.hidden,text:h.textContent}:null};
