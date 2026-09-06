function makeDevelopmentTendencySystem(env){
 'use strict';
 const avg=a=>a.length?a.reduce((n,x)=>n+x,0)/a.length:0;
 const round1=n=>Math.round(n*10)/10;
 function evidence(player){
  return (player?.campHistory||[]).filter(x=>Number.isFinite(Number(x?.delta))).map(x=>({year:Number(x.year)||0,phase:String(x.phase||''),delta:Number(x.delta),grade:x.grade||null,focus:x.focus||null,teamFocus:x.teamFocus||null})).sort((a,b)=>a.year-b.year||(a.phase==='Spring'?-1:1)-(b.phase==='Spring'?-1:1));
 }
 function clue(player){
  const rows=evidence(player),confidence=Math.max(0,Math.min(100,Math.round(Number(player?.scoutConfidence)||0)));
  if(rows.length<2||confidence<52)return{code:'LEARNING',label:'Still Learning',tone:'neutral',confidence,observations:rows.length,summary:rows.length<2?'Staff needs another camp result before calling a development pattern.':'Staff confidence is still too low to call a development pattern.'};
  const deltas=rows.map(x=>x.delta),recent=deltas.slice(-2),older=deltas.slice(0,-2),mean=avg(deltas),recentMean=avg(recent),positive=deltas.filter(x=>x>0).length,flat=deltas.filter(x=>x===0).length,negative=deltas.filter(x=>x<0).length,positiveRate=positive/deltas.length,range=Math.max(...deltas)-Math.min(...deltas),swing=avg(deltas.map(x=>Math.abs(x-mean))),last=deltas.at(-1),previous=deltas.at(-2);
  let code='TRACKING',label='Tracking',tone='neutral';
  if(rows.length>=3&&positive>0&&negative>0&&(range>=5||swing>=2)){code='UNEVEN';label='Uneven Progress';tone='alert'}
  else if(rows.length>=3&&recentMean<=0.5&&avg(older.length?older:deltas)<=1){code='PLATEAU';label='Plateau Watch';tone='alert'}
  else if(rows.length>=3&&older.length&&recentMean>=avg(older)+1.5&&recentMean>=2){code='ACCELERATING';label='Accelerating';tone='good'}
  else if(rows.length>=3&&positiveRate>=.75&&mean>=1.25&&range<=4){code='STEADY';label='Steady Riser';tone='good'}
  else if(recentMean>=3&&last>0&&previous>0){code='SURGING';label='Camp Surge';tone='good'}
  else if(mean>=.75&&positive>=Math.ceil(rows.length/2)){code='PROGRESS';label='Gradual Progress';tone='good'}
  else if(negative>=Math.ceil(rows.length/2)&&mean<0){code='SLIPPING';label='Development Concern';tone='bad'}
  const summary={STEADY:`Positive movement in ${positive} of ${rows.length} observed camps with limited swings.`,ACCELERATING:`The last two camps average ${round1(recentMean)} points, stronger than the earlier evidence.`,SURGING:`Back-to-back strong camp gains average ${round1(recentMean)} points.`,UNEVEN:`Observed results have swung across a ${round1(range)}-point range.`,PLATEAU:`Recent camp movement has flattened to ${round1(recentMean)} points on average.`,PROGRESS:`Observed camp movement averages ${round1(mean)} points across ${rows.length} results.`,SLIPPING:`More observed camps have moved backward than forward.`,TRACKING:`The staff has ${rows.length} camp results, but no strong pattern yet.`}[code];
  return{code,label,tone,confidence,observations:rows.length,average:round1(mean),recentAverage:round1(recentMean),positive,flat,negative,range:round1(range),summary,last:rows.at(-1)||null};
 }
 function summarize(players=[]){
  const rows=players.map(p=>({p,clue:clue(p)})),counts={};for(const x of rows)counts[x.clue.code]=(counts[x.clue.code]||0)+1;
  const notable=rows.filter(x=>!['LEARNING','TRACKING'].includes(x.clue.code)).sort((a,b)=>b.clue.observations-a.clue.observations||Math.abs(b.clue.recentAverage||0)-Math.abs(a.clue.recentAverage||0)).slice(0,8);
  return{rows,counts,notable};
 }
 return{evidence,clue,summarize};
}

if(typeof module==='object'&&module.exports){module.exports={makeDevelopmentTendencySystem};}
else{
 const developmentTendencySystem=makeDevelopmentTendencySystem({});
 function developmentTendencyBadge(p){const x=developmentTendencySystem.clue(p);if(x.code==='LEARNING'||x.code==='TRACKING')return'';return `<span class="development-tendency-badge development-tendency-${x.tone}" title="${String(x.summary).replace(/"/g,'&quot;')}">${x.label}</span>`}
 function renderDevelopmentTendencyBadges(){
  const t=selected(),body=$('#rosterBody');if(!t||!body)return;
  for(const link of body.querySelectorAll?.('[data-player]')||[]){const p=t.roster.find(x=>String(x.id)===String(link.dataset.player));if(!p)continue;const badge=developmentTendencyBadge(p);if(!badge)continue;const cell=link.closest?.('td')||link.parentElement;if(cell&&!cell.querySelector?.('.development-tendency-badge'))cell.insertAdjacentHTML?.('beforeend',badge)}
 }
 function developmentTendencyPanelHTML(t){
  const summary=developmentTendencySystem.summarize(t?.roster||[]),rows=summary.notable;if(!rows.length)return'';
  return `<div class="development-tendency-panel"><div class="development-tendency-head"><div><div class="eyebrow">STAFF DEVELOPMENT READ</div><h3>Observed Growth Patterns</h3></div><span>${rows.length} notable pattern${rows.length===1?'':'s'}</span></div><div class="development-tendency-grid">${rows.map(({p,clue:x})=>`<button type="button" class="development-tendency-card development-tendency-${x.tone}" data-player="${p.id}"><strong>${p.pos} ${p.name}</strong><b>${x.label}</b><small>${x.summary}</small><span>${x.observations} camp observations · ${x.confidence}% staff confidence</span></button>`).join('')}</div><div class="small muted development-tendency-note">These labels are inferred only from observed camp receipts and staff confidence. They do not reveal a hidden development curve or ceiling.</div></div>`;
 }
 const renderRosterBeforeDevelopmentTendencies=renderRoster;
 renderRoster=function(){renderRosterBeforeDevelopmentTendencies();renderDevelopmentTendencyBadges()};
 const renderDevelopmentBeforeTendencies=renderDevelopment;
 renderDevelopment=function(){renderDevelopmentBeforeTendencies();const t=selected(),host=$('#development');if(host&&!host.querySelector?.('.development-tendency-panel')){const panel=developmentTendencyPanelHTML(t);if(panel)host.insertAdjacentHTML?.('beforeend',panel);attachPlayerLinks()}};
 if(typeof TAB_RENDERERS==='object'){TAB_RENDERERS.roster=renderRoster;TAB_RENDERERS.development=renderDevelopment}
 globalThis.DynastyLabDevelopmentTendencies={clue:p=>developmentTendencySystem.clue(p),summary:t=>developmentTendencySystem.summarize(t?.roster||[])};
}
