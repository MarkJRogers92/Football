// Development-only Game Lab bridge for the clock-aware v2 engine and v0.10.1 player attribution.
// Injected inside app.js's closure so it can consume the same real depth chart, roles and gameplan profiles.
let v2GameLabPreview=null;
function v2GameLabKey(g){return g?`${universe.year}:${g.week||universe.week+1}:${g.home}:${g.away}`:''}
function v2LabClone(value){return JSON.parse(JSON.stringify(value))}
function v2RosterStatChecksum(team){let n=0;for(const p of team?.roster||[])for(const v of Object.values(p.stats||{}))if(Number.isFinite(Number(v)))n+=Number(v);return n}
function v2LabIntegrity(g,home,away){return JSON.stringify({
  week:universe.week,phase:universe.phase,gameCounter:universe.gameCounter,
  archive:(universe.gameArchive||[]).length,events:(universe.events||[]).length,
  game:{played:!!g.played,gameId:g.gameId||null,score:g.score||null,winner:g.winner||null,detailed:!!g.detailed},
  home:{w:home.w,l:home.l,cw:home.cw,cl:home.cl,pf:home.pf,pa:home.pa,playerStats:v2RosterStatChecksum(home)},
  away:{w:away.w,l:away.l,cw:away.cw,cl:away.cl,pf:away.pf,pa:away.pa,playerStats:v2RosterStatChecksum(away)}
})}
function v2PlayerRef(p){return p?{id:p.id,name:p.name,pos:p.pos,speed:p.speed,power:p.power,technique:p.technique,iq:p.iq,composure:p.composure,trueNow:p.trueNow}:null}
function v2WeightedRefs(items){return(items||[]).filter(x=>x?.p).map(x=>({player:v2PlayerRef(x.p),weight:x.weight||1}))}
function v2AttributionContext(team){
  const qb=roleStarter(team,'QB1')||starter(team,'QB'),k=roleStarter(team,'K1')||starter(team,'K'),pu=roleStarter(team,'P1')||starter(team,'P');
  const ol=[...new Map(['LT','LG','C1','RG','RT'].map(id=>roleStarter(team,id)).filter(Boolean).map(p=>[p.id,p])).values()];
  return{teamName:team.name,qb:v2PlayerRef(qb),rushers:v2WeightedRefs(rushingShares(team)),receivers:v2WeightedRefs(receivingShares(team)),defenders:v2WeightedRefs(defensiveShares(team)),offensiveLine:ol.map(p=>({player:v2PlayerRef(p),weight:1})),kicker:v2PlayerRef(k),punter:v2PlayerRef(pu)}
}
function ensureV2GameLabHost(){
  let host=document.querySelector('#v2ShadowLab');
  if(host)return host;
  const section=document.querySelector('#gamelab');if(!section)return null;
  host=document.createElement('div');host.id='v2ShadowLab';host.className='card v2-lab-card';section.appendChild(host);return host;
}
function runV2GameLabShadow(){
  const g=findUserGame();if(!g){setStatus('No unsimulated user game is available for the v2 shadow preview.');return}
  const api=globalThis.DynastyGameEngineV2Lab,actors=globalThis.DynastyGameEngineV2Attribution;if(!api||!actors){setStatus('Game Engine 2 development modules are unavailable in this build.');return}
  const home=T(g.home),away=T(g.away);if(!home||!away)return;
  const before=v2LabIntegrity(g,home,away),hc=v2LabClone(home),ac=v2LabClone(away);
  // Match live kickoff profile measurement, but charge gameplan wear only to clones.
  applyGameplanWear(hc,ac.name);applyGameplanWear(ac,hc.name);
  const homeProfile=gameProfiles(hc,ac.name),awayProfile=gameProfiles(ac,hc.name),key=v2GameLabKey(g);
  const preview=api.simulate({
    gameId:`v0101-shadow-${key}`,
    seed:`v0101-shadow-${key}`,
    home,away,homeProfile,awayProfile,
    homeFieldRating:homeFieldFor(home)
  });
  const attribution=actors.attributeGame(preview.state,{home:v2AttributionContext(hc),away:v2AttributionContext(ac)});actors.attachEventSummary(attribution,preview.summary);preview.attribution=attribution;
  const after=v2LabIntegrity(g,home,away);
  if(after!==before)throw new Error('V2 shadow preview mutated live dynasty state.');
  v2GameLabPreview={key,...preview};renderV2GameLabPanel();
}
function v2Line(label,line,text){return`<div class="lineitem"><span>${label}</span><strong>${line?`${gameEscape(line.name)} · ${text(line.stats)}`:'—'}</strong></div>`}
function v2AttributionHTML(preview){
  const a=preview?.attribution;if(!a)return'';const actors=globalThis.DynastyGameEngineV2Attribution;
  return`<div class="v2-event-head"><strong>Real-player shadow box</strong><span class="small muted">Reconciled to v2 team totals · no stats recorded</span></div><div class="two-col">${['away','home'].map(side=>{const l=actors.leaders(a,side),name=preview.state?.[side]?.name||side;return`<div class="v2-leader-card"><strong>${gameEscape(name)}</strong>${v2Line('Passing',l.passer,s=>`${s.passComp}/${s.passAtt}, ${s.passYds} YDS, ${s.passTD} TD, ${s.int} INT`)}${v2Line('Rushing',l.rusher,s=>`${s.rushAtt} CAR, ${s.rushYds} YDS, ${s.rushTD} TD`)}${v2Line('Receiving',l.receiver,s=>`${s.receptions}/${s.targets}, ${s.recYds} YDS, ${s.recTD} TD`)}${v2Line('Defense',l.defender,s=>`${s.tackles} TKL, ${s.sacks} SACK, ${s.intDef} INT`)}</div>`}).join('')}</div>`
}
function renderV2GameLabPanel(){
  const host=ensureV2GameLabHost();if(!host)return;
  const api=globalThis.DynastyGameEngineV2Lab,g=findUserGame(),key=v2GameLabKey(g);
  if(v2GameLabPreview&&v2GameLabPreview.key!==key)v2GameLabPreview=null;
  const disabled=!g||!api||!globalThis.DynastyGameEngineV2Attribution;
  host.innerHTML=`<div class="section-head v2-lab-head"><div><div class="eyebrow">V0.10.1 DEVELOPMENT PREVIEW</div><h3>Game Engine 2 Shadow</h3><div class="muted">Clock-aware football plus real-player attribution — this preview never records the result.</div></div><button type="button" data-v2-shadow-run ${disabled?'disabled':''}>${v2GameLabPreview?'Replay Same Seed':'Run Shadow Preview'}</button></div>${api?api.summaryHTML(v2GameLabPreview):'<div class="muted">V2 Lab module unavailable.</div>'}${v2AttributionHTML(v2GameLabPreview)}<div class="v2-shadow-safety"><strong>Shadow only.</strong> Standings, roster statistics, the scheduled game and browser save are untouched.</div>${v2GameLabPreview?`<div class="v2-event-head"><strong>Clock-aware event stream</strong><span class="small muted">Newest first · deterministic seed</span></div><div class="v2-event-feed">${api.eventsHTML(v2GameLabPreview,160)}</div>`:''}`;
  const button=host.querySelector('[data-v2-shadow-run]');if(button)button.onclick=()=>{try{runV2GameLabShadow()}catch(err){console.error(err);setStatus(`V2 shadow preview stopped: ${err.message||err}`)}};
}
const renderGameLabWithV2=TAB_RENDERERS.gamelab;
TAB_RENDERERS.gamelab=()=>{renderGameLabWithV2();renderV2GameLabPanel()};
globalThis.DynastyGameEngineV2LabBridge={runShadow:runV2GameLabShadow,getPreview:()=>v2GameLabPreview,render:renderV2GameLabPanel,contextForTeam:v2AttributionContext};
