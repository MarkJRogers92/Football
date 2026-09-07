// v0.10 release-facing Game Engine 2 presentation. Debug/test APIs remain available, but development UI stays hidden.
function v2ReleaseRecord(){
  const archive=universe.gameArchive||[],id=universe.lastDetailedGame?.gameId;let record=id?archive.find(r=>r.id===id):null;
  if(record?.engine==='v2')return record;
  const me=selected();return me?[...archive].reverse().find(r=>r.engine==='v2'&&(r.home?.id===me.id||r.away?.id===me.id))||null:null
}
function v2ReleaseNum(n){return Number(n)||0}
function v2ReleaseLeader(lines,key,scoreFn=null){
  const eligible=(lines||[]).filter(r=>v2ReleaseNum(r.stats?.[key])||scoreFn);
  return eligible.sort((a,b)=>(scoreFn?scoreFn(b):v2ReleaseNum(b.stats?.[key]))-(scoreFn?scoreFn(a):v2ReleaseNum(a.stats?.[key])))[0]||null
}
function v2ReleaseLeaderLine(label,row,format){return`<div class="v2-release-leader"><span>${label}</span><strong>${row?`${gameEscape(row.name)} · ${format(row.stats||{})}`:'—'}</strong></div>`}
function v2ReleaseTeamLeaders(record,side){
  const lines=record.playerStats?.[side]||[],passer=v2ReleaseLeader(lines,'passYds'),rusher=v2ReleaseLeader(lines,'rushYds'),receiver=v2ReleaseLeader(lines,'recYds'),defender=v2ReleaseLeader(lines,'tackles',r=>v2ReleaseNum(r.stats?.tackles)+v2ReleaseNum(r.stats?.sacks)*4+v2ReleaseNum(r.stats?.intDef)*6+v2ReleaseNum(r.stats?.forcedFumbles)*3);
  return`${v2ReleaseLeaderLine('PASS',passer,s=>`${v2ReleaseNum(s.passComp)}/${v2ReleaseNum(s.passAtt)} · ${v2ReleaseNum(s.passYds)} YDS · ${v2ReleaseNum(s.passTD)} TD`)}${v2ReleaseLeaderLine('RUSH',rusher,s=>`${v2ReleaseNum(s.rushAtt)} CAR · ${v2ReleaseNum(s.rushYds)} YDS · ${v2ReleaseNum(s.rushTD)} TD`)}${v2ReleaseLeaderLine('REC',receiver,s=>`${v2ReleaseNum(s.receptions)} REC · ${v2ReleaseNum(s.recYds)} YDS · ${v2ReleaseNum(s.recTD)} TD`)}${v2ReleaseLeaderLine('DEF',defender,s=>`${v2ReleaseNum(s.tackles)} TKL · ${v2ReleaseNum(s.sacks)} SACK · ${v2ReleaseNum(s.intDef)} INT`)}`
}
function v2ReleaseDriveTimeline(record){
  const score={home:0,away:0},names={home:record.home?.name||'Home',away:record.away?.name||'Away'},scoring=[];
  for(const d of record.drives||[]){
    score[d.side]+=v2ReleaseNum(d.points);
    if(v2ReleaseNum(d.points)>0)scoring.push(`<div class="v2-release-scoring-row"><span>${gameEscape(d.overtime?'OT':d.label)}</span><strong>${gameEscape(names[d.side])} · ${gameEscape(d.result||'SCORE')} · +${v2ReleaseNum(d.points)}</strong><b>${score.away}–${score.home}</b></div>`)
  }
  return scoring.length?scoring.join(''):'<div class="muted">No scoring drives were retained.</div>'
}
function v2ReleaseDriveStrip(record){
  return(record.drives||[]).map(d=>`<span class="v2-release-drive ${['TD','FG','SAFETY'].includes(d.result)?'score':['INT','FUMBLE'].includes(d.result)?'turnover':''}"><b>${gameEscape(d.overtime?'OT':d.label)}</b>${gameEscape(d.result||'END')}<small>${d.plays||0} plays${d.points?` · ${d.points} pts`:''}</small></span>`).join('')
}
function v2ReleaseRecapHTML(record){
  const hs=record.teamStats?.home||{},as=record.teamStats?.away||{},ot=(record.drives||[]).some(d=>d.overtime),meta=[record.season,record.label||`Week ${record.week??'—'}`,record.venue].filter(Boolean).map(gameEscape).join(' · ');
  const awayY=v2ReleaseNum(as.passYds)+v2ReleaseNum(as.rushYds),homeY=v2ReleaseNum(hs.passYds)+v2ReleaseNum(hs.rushYds);
  return`<div class="v2-release-recap"><div class="v2-release-kicker"><span>GAME DAY</span><strong>${meta}</strong></div><div class="v2-release-score"><div class="v2-release-team">${teamLogoHTML(record.away?.id,46,'team-logo--inline')}<span>${gameEscape(record.away?.name||'Away')}</span><b>${v2ReleaseNum(record.score?.away)}</b></div><div class="v2-release-final">FINAL${ot?' · OT':''}</div><div class="v2-release-team home"><b>${v2ReleaseNum(record.score?.home)}</b><span>${gameEscape(record.home?.name||'Home')}</span>${teamLogoHTML(record.home?.id,46,'team-logo--inline')}</div></div><div class="v2-release-metrics"><div><span>Total yards</span><strong>${awayY} – ${homeY}</strong></div><div><span>Plays</span><strong>${v2ReleaseNum(as.plays)} – ${v2ReleaseNum(hs.plays)}</strong></div><div><span>First downs</span><strong>${v2ReleaseNum(as.firstDowns)} – ${v2ReleaseNum(hs.firstDowns)}</strong></div><div><span>Turnovers</span><strong>${v2ReleaseNum(as.turnovers)} – ${v2ReleaseNum(hs.turnovers)}</strong></div></div><div class="v2-release-section"><div class="v2-release-section-head"><strong>Drive chart</strong><span>${(record.drives||[]).length} possessions · clock-aware archive</span></div><div class="v2-release-drive-strip">${v2ReleaseDriveStrip(record)}</div></div><div class="v2-release-grid"><section><div class="v2-release-section-head"><strong>Scoring flow</strong><span>away – home</span></div>${v2ReleaseDriveTimeline(record)}</section><section><div class="v2-release-section-head"><strong>Player leaders</strong><span>real roster production</span></div><div class="v2-release-leader-team"><h4>${gameEscape(record.away?.name||'Away')}</h4>${v2ReleaseTeamLeaders(record,'away')}</div><div class="v2-release-leader-team"><h4>${gameEscape(record.home?.name||'Home')}</h4>${v2ReleaseTeamLeaders(record,'home')}</div></section></div></div>`
}
function ensureV2ReleaseRecap(){
  let host=document.querySelector('#v2GameDayRecap');if(host)return host;const next=document.querySelector('#nextGameCard');if(!next)return null;
  host=document.createElement('div');host.id='v2GameDayRecap';host.className='card v2-release-host';next.insertAdjacentElement('afterend',host);return host
}
function renderV2ReleaseGameLab(){
  document.querySelector('#v2ShadowLab')?.remove();document.querySelector('#v2RecordGate')?.remove();
  const host=ensureV2ReleaseRecap(),record=v2ReleaseRecord();if(host){host.hidden=!record;host.innerHTML=record?v2ReleaseRecapHTML(record):''}
  const box=document.querySelector('#detailedBox'),log=document.querySelector('#detailedLog');
  if(box){const h=box.closest('.card')?.querySelector('h3');if(h)h.textContent='Quick Box'}
  if(log){const h=log.closest('.card')?.querySelector('h3');if(h)h.textContent='Play-by-Play';if(record){const lines=(record.drives||[]).flatMap(d=>d.playByPlay||[]).slice(-160).reverse();log.classList.remove('muted');log.innerHTML=lines.map(x=>`<div class="playline">${gameEscape(x)}</div>`).join('')}}
}
renderV2GameLabPanel=function renderV2GameLabPanelRelease(){document.querySelector('#v2ShadowLab')?.remove()};
renderV2RecordGate=function renderV2RecordGateRelease(){document.querySelector('#v2RecordGate')?.remove()};
const renderGameLabBeforeV2Release=TAB_RENDERERS.gamelab;TAB_RENDERERS.gamelab=()=>{renderGameLabBeforeV2Release();renderV2ReleaseGameLab()};
globalThis.DynastyGameEngineV2LabBridge.releaseRecord=v2ReleaseRecord;
globalThis.DynastyGameEngineV2LabBridge.renderRelease=renderV2ReleaseGameLab;
