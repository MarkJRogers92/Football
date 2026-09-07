// v0.10.2 Slice 1 — opponent scouting + weekly preparation bridge.
const v0102WeeklyApi=globalThis.DynastyWeeklyCoaching;
const gameProfilesBeforeWeeklyPrep=gameProfiles;
function v0102WeeklyStaffConfidence(t){
  const vals=[t?.staff?.OC?.playCall,t?.staff?.DC?.playCall,t?.staff?.HC?.development].filter(Number.isFinite);
  return clamp(Math.round(vals.length?avg(vals):70),45,94)
}
function v0102WeeklyPrepFor(t,opponentName){
  const p=t?.weeklyPrep;if(!p)return null;
  return p.year===universe.year&&p.week===universe.week&&p.opponent===opponentName?p:null
}
function v0102WeeklyPrepSnapshot(t,opponentName){
  const p=v0102WeeklyPrepFor(t,opponentName);if(!p)return null;
  return{version:p.version||1,year:p.year,week:p.week,opponent:p.opponent,focuses:[...(p.focuses||[])],delegated:!!p.delegated,staffRecommended:[...(p.staffRecommended||[])]}
}
function v0102WeeklyBaselineMatchup(t,opp){
  const P=gameProfilesBeforeWeeklyPrep(t,opp.name),O=gameProfilesBeforeWeeklyPrep(opp,t.name);
  return{teamProfile:P,opponentProfile:O,teamEdges:matchupEdges(t,opp,P,O),opponentEdges:matchupEdges(opp,t,O,P)}
}
function v0102WeeklyOpponentReport(t,opp){
  if(!v0102WeeklyApi||!t||!opp)return null;
  const m=v0102WeeklyBaselineMatchup(t,opp),passShare=OFF_SCHEMES[opp.offScheme]?.pass??.5;
  return v0102WeeklyApi.buildReport({season:universe.year,week:universe.week,teamName:t.name,opponentName:opp.name,passShare,confidence:v0102WeeklyStaffConfidence(t),teamEdges:m.teamEdges,opponentEdges:m.opponentEdges,opponentInjuries:(opp.roster||[]).filter(p=>p.injury||(p.injuryWeeks||0)>0).length})
}
function v0102SetWeeklyPrep(t,opp,focuses,{delegated=false}={}){
  if(!v0102WeeklyApi||!t||!opp||v2InteractiveGameDay)return false;
  const normalized=v0102WeeklyApi.normalizeFocuses(focuses),report=v0102WeeklyOpponentReport(t,opp);
  t.weeklyPrep={version:v0102WeeklyApi.VERSION,year:universe.year,week:universe.week,opponent:opp.name,focuses:normalized,delegated:!!delegated,staffRecommended:[...(report?.recommendedFocuses||[])]};
  setStatus(normalized.length?`Weekly prep set: ${v0102WeeklyApi.focusSummary(normalized).map(x=>x.label).join(' + ')}.`:'Weekly prep cleared; kickoff returns to the standard profile.');
  render();return true
}
function v0102DelegateWeeklyPrep(t,opp){const report=v0102WeeklyOpponentReport(t,opp);return v0102SetWeeklyPrep(t,opp,report?.recommendedFocuses||[],{delegated:true})}
gameProfiles=function gameProfilesWithWeeklyPrep(t,opponentName){
  const base=gameProfilesBeforeWeeklyPrep(t,opponentName),prep=v0102WeeklyPrepFor(t,opponentName);
  return prep&&v0102WeeklyApi?v0102WeeklyApi.applyPrepProfile(base,prep.focuses):base
};
function v0102WeeklyFocusButton(id,selected,recommended,disabled){
  const f=v0102WeeklyApi.FOCUSES[id],on=selected.includes(id),rec=recommended.includes(id);
  return`<button type="button" class="v0102-prep-focus${on?' active':''}" data-v0102-prep-focus="${gameEscape(id)}" ${disabled&&!on?'disabled':''}><strong>${gameEscape(f.label)}${rec?' · Staff pick':''}</strong><small>${gameEscape(f.description)}</small></button>`
}
function ensureV0102WeeklyCoachingHost(){
  let host=document.querySelector('#v0102WeeklyCoaching');if(host)return host;const matchup=document.querySelector('#v2MatchupIntelligence');if(!matchup)return null;
  host=document.createElement('div');host.id='v0102WeeklyCoaching';host.className='card v0102-weekly-coaching';matchup.insertAdjacentElement('afterend',host);return host
}
function renderV0102WeeklyCoaching(){
  const host=ensureV0102WeeklyCoachingHost();if(!host)return;const t=selected(),g=findUserGame();if(!t||!g){host.hidden=true;return}const opp=T(g.home===t.name?g.away:g.home);if(!opp||!v0102WeeklyApi){host.hidden=true;return}host.hidden=false;
  const report=v0102WeeklyOpponentReport(t,opp),prep=v0102WeeklyPrepFor(t,opp.name),selectedFocuses=[...(prep?.focuses||[])],recommended=report?.recommendedFocuses||[],started=!!v2InteractiveGameDay,full=selectedFocuses.length>=v0102WeeklyApi.MAX_POINTS;
  const focusRows=Object.keys(v0102WeeklyApi.FOCUSES).map(id=>v0102WeeklyFocusButton(id,selectedFocuses,recommended,started||full)).join('');
  host.innerHTML=`<div class="section-head"><div><div class="eyebrow">V0.10.2 WEEKLY COACHING</div><h3>Opponent scout + preparation</h3><div class="muted">Staff estimate for ${gameEscape(opp.name)} · ${gameEscape(report.confidenceLabel)} confidence (${report.confidence}%)</div></div><span class="pill ${report.confidence>=82?'good':report.confidence<64?'warn':''}">${selectedFocuses.length}/${v0102WeeklyApi.MAX_POINTS} prep points used</span></div><div class="v0102-weekly-grid"><section><div class="v0102-weekly-head"><strong>Opponent scout</strong><span>Estimated ${report.passEstimate}% pass</span></div>${report.observations.map(x=>`<div class="v0102-scout-note">${gameEscape(x)}</div>`).join('')}<div class="small muted">This is a deterministic staff estimate with uncertainty. It does not reveal hidden exact ratings.</div></section><section><div class="v0102-weekly-head"><strong>Preparation board</strong><span>Choose up to ${v0102WeeklyApi.MAX_POINTS}</span></div><div class="v0102-prep-focuses">${focusRows}</div><div class="button-row v0102-prep-actions"><button type="button" data-v0102-prep-delegate ${started?'disabled':''}>Delegate to Staff</button><button type="button" data-v0102-prep-clear ${started||!selectedFocuses.length?'disabled':''}>Clear Prep</button></div>${started?'<div class="small warn">Game Day has started. Reset the staged game before changing preparation.</div>':prep?.delegated?'<div class="small muted">Staff selected the active emphases.</div>':'<div class="small muted">Prep is editable until Game Day begins. Unused points leave the v0.10.1 kickoff profile unchanged.</div>'}</section></div>`;
  host.querySelectorAll('[data-v0102-prep-focus]').forEach(button=>button.addEventListener('click',()=>{const id=button.dataset.v0102PrepFocus,current=[...selectedFocuses],i=current.indexOf(id);if(i>=0)current.splice(i,1);else if(current.length<v0102WeeklyApi.MAX_POINTS)current.push(id);v0102SetWeeklyPrep(t,opp,current)}));
  host.querySelector('[data-v0102-prep-delegate]')?.addEventListener('click',()=>v0102DelegateWeeklyPrep(t,opp));
  host.querySelector('[data-v0102-prep-clear]')?.addEventListener('click',()=>v0102SetWeeklyPrep(t,opp,[]))
}
const renderGameLabBeforeWeeklyCoachingV0102=TAB_RENDERERS.gamelab;TAB_RENDERERS.gamelab=()=>{renderGameLabBeforeWeeklyCoachingV0102();renderV0102WeeklyCoaching()};
const recordInteractiveBeforeWeeklyPrepV0102=recordInteractiveV2GameDay;
recordInteractiveV2GameDay=function recordInteractiveV2GameDayWithWeeklyPrep(session,options={}){
  const g=findUserGame(),home=g?T(g.home):null,away=g?T(g.away):null,weeklyPrep={home:home&&away?v0102WeeklyPrepSnapshot(home,away.name):null,away:home&&away?v0102WeeklyPrepSnapshot(away,home.name):null};
  const out=recordInteractiveBeforeWeeklyPrepV0102(session,options);if(out?.record){out.record.weeklyPrepVersion=v0102WeeklyApi?.VERSION||1;out.record.weeklyPrep=weeklyPrep}return out
};
if(globalThis.DynastyGameEngineV2LabBridge)globalThis.DynastyGameEngineV2LabBridge.recordInteractive=recordInteractiveV2GameDay;
if(globalThis.__DL_TEST__){
  globalThis.__DL_TEST__.weeklyCoachingDebug=()=>{const t=selected(),g=findUserGame(),opp=t&&g?T(g.home===t.name?g.away:g.home):null;if(!t||!opp)return null;const report=v0102WeeklyOpponentReport(t,opp),prep=v0102WeeklyPrepSnapshot(t,opp.name),base=gameProfilesBeforeWeeklyPrep(t,opp.name),active=gameProfiles(t,opp.name);return{opponent:opp.name,report,prep,profile:{base,active}}};
  globalThis.__DL_TEST__.weeklyCoachingSet=(focuses=[])=>{const t=selected(),g=findUserGame(),opp=t&&g?T(g.home===t.name?g.away:g.home):null;return!!(t&&opp&&v0102SetWeeklyPrep(t,opp,focuses))};
  globalThis.__DL_TEST__.weeklyCoachingDelegate=()=>{const t=selected(),g=findUserGame(),opp=t&&g?T(g.home===t.name?g.away:g.home):null;return!!(t&&opp&&v0102DelegateWeeklyPrep(t,opp))};
  globalThis.__DL_TEST__.weeklyCoachingLastArchive=()=>{const r=(universe.gameArchive||[]).at(-1);return r?{id:r.id,weeklyPrepVersion:r.weeklyPrepVersion||null,weeklyPrep:v2RecordClone(r.weeklyPrep||null)}:null};
}
