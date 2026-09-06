// Development-only Game Lab bridge for the v0.10.0 clock-aware shadow engine.
// This module is injected inside app.js's closure so it can read the same real
// profiles and gameplan state without making the core file another merge hotspot.
let v2GameLabPreview=null;
function v2GameLabKey(g){return g?`${universe.year}:${g.week||universe.week+1}:${g.home}:${g.away}`:''}
function v2LabClone(value){return JSON.parse(JSON.stringify(value))}
function v2LabIntegrity(g,home,away){return JSON.stringify({
  week:universe.week,phase:universe.phase,gameCounter:universe.gameCounter,
  archive:(universe.gameArchive||[]).length,events:(universe.events||[]).length,
  game:{played:!!g.played,gameId:g.gameId||null,score:g.score||null,winner:g.winner||null,detailed:!!g.detailed},
  home:{w:home.w,l:home.l,cw:home.cw,cl:home.cl,pf:home.pf,pa:home.pa},
  away:{w:away.w,l:away.l,cw:away.cw,cl:away.cl,pf:away.pf,pa:away.pa}
})}
function ensureV2GameLabHost(){
  let host=document.querySelector('#v2ShadowLab');
  if(host)return host;
  const section=document.querySelector('#gamelab');if(!section)return null;
  host=document.createElement('div');host.id='v2ShadowLab';host.className='card v2-lab-card';section.appendChild(host);return host;
}
function runV2GameLabShadow(){
  const g=findUserGame();if(!g){setStatus('No unsimulated user game is available for the v2 shadow preview.');return}
  const api=globalThis.DynastyGameEngineV2Lab;if(!api){setStatus('Game Engine 2 Lab is unavailable in this build.');return}
  const home=T(g.home),away=T(g.away);if(!home||!away)return;
  const before=v2LabIntegrity(g,home,away),hc=v2LabClone(home),ac=v2LabClone(away);
  // Match the live kickoff profile measurement, but charge wear only to clones.
  applyGameplanWear(hc,ac.name);applyGameplanWear(ac,hc.name);
  const homeProfile=gameProfiles(hc,ac.name),awayProfile=gameProfiles(ac,hc.name),key=v2GameLabKey(g);
  const preview=api.simulate({
    gameId:`v0100-shadow-${key}`,
    seed:`v0100-shadow-${key}`,
    home,away,homeProfile,awayProfile,
    homeFieldRating:homeFieldFor(home)
  });
  const after=v2LabIntegrity(g,home,away);
  if(after!==before)throw new Error('V2 shadow preview mutated live dynasty state.');
  v2GameLabPreview={key,...preview};renderV2GameLabPanel();
}
function renderV2GameLabPanel(){
  const host=ensureV2GameLabHost();if(!host)return;
  const api=globalThis.DynastyGameEngineV2Lab,g=findUserGame(),key=v2GameLabKey(g);
  if(v2GameLabPreview&&v2GameLabPreview.key!==key)v2GameLabPreview=null;
  const disabled=!g||!api;
  host.innerHTML=`<div class="section-head v2-lab-head"><div><div class="eyebrow">V0.10 DEVELOPMENT PREVIEW</div><h3>Game Engine 2 Shadow</h3><div class="muted">Clock, field position, down & distance and overtime — this preview never records the result.</div></div><button type="button" data-v2-shadow-run ${disabled?'disabled':''}>${v2GameLabPreview?'Replay Same Seed':'Run Shadow Preview'}</button></div>${api?api.summaryHTML(v2GameLabPreview):'<div class="muted">V2 Lab module unavailable.</div>'}<div class="v2-shadow-safety"><strong>Shadow only.</strong> Standings, player stats, the scheduled game and browser save are untouched.</div>${v2GameLabPreview?`<div class="v2-event-head"><strong>Clock-aware event stream</strong><span class="small muted">Newest first · deterministic seed</span></div><div class="v2-event-feed">${api.eventsHTML(v2GameLabPreview,160)}</div>`:''}`;
  const button=host.querySelector('[data-v2-shadow-run]');if(button)button.onclick=()=>{try{runV2GameLabShadow()}catch(err){console.error(err);setStatus(`V2 shadow preview stopped: ${err.message||err}`)}};
}
const renderGameLabWithV2=TAB_RENDERERS.gamelab;
TAB_RENDERERS.gamelab=()=>{renderGameLabWithV2();renderV2GameLabPanel()};
globalThis.DynastyGameEngineV2LabBridge={runShadow:runV2GameLabShadow,getPreview:()=>v2GameLabPreview,render:renderV2GameLabPanel};
