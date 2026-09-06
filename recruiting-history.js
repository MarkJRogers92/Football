function makeRecruitingHistorySystem(env){
 'use strict';
 function rows(players=[],year,schoolId=null){
  return players.map(p=>({p,result:env.classifyPlayer(p,year)})).filter(x=>x.result&&(!schoolId||x.result.snapshot.schoolId===schoolId));
 }
 function classSummary(entries,season){
  const visible=entries.filter(x=>x.result.code!=='TOO_EARLY'),settled=visible.filter(x=>x.result.final),developing=visible.filter(x=>!x.result.final),counts={};
  for(const x of visible)counts[x.result.code]=(counts[x.result.code]||0)+1;
  const deltas=visible.map(x=>x.result.delta),hours=entries.reduce((n,x)=>n+(Number(x.result.snapshot.hoursSpent)||0),0);
  return{season,signed:entries.length,settled:settled.length,developing:developing.length,pending:entries.length-visible.length,costly:settled.filter(x=>x.result.costly).length,counts,hoursSpent:hours,averageDelta:deltas.length?Math.round(deltas.reduce((a,b)=>a+b,0)/deltas.length*10)/10:0};
 }
 function history(players=[],year,schoolId=null){
  const grouped=new Map();
  for(const entry of rows(players,year,schoolId)){
   const season=entry.result.snapshot.season;
   if(!grouped.has(season))grouped.set(season,[]);
   grouped.get(season).push(entry);
  }
  return [...grouped.entries()].map(([season,entries])=>{
   const sorted=entries.slice().sort((a,b)=>(b.result.final?1:0)-(a.result.final?1:0)||Math.abs(b.result.delta)-Math.abs(a.result.delta)||(a.p.pos||'').localeCompare(b.p.pos||'')||(a.p.name||'').localeCompare(b.p.name||''));
   return{...classSummary(entries,season),players:sorted};
  }).sort((a,b)=>b.season-a.season);
 }
 return{rows,classSummary,history};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeRecruitingHistorySystem};
}else{
 const recruitingHistorySystem=makeRecruitingHistorySystem({classifyPlayer:(p,year)=>scoutingReceiptSystem.classifyPlayer(p,year)});
 function recruitingHistoryHTML(t){
  const classes=recruitingHistorySystem.history(receiptPlayers(t),universe.year,t.id);if(!classes.length)return'';
  const count=(c,code)=>c.counts[code]||0;
  return `<div class="recruiting-history"><div class="recruiting-history-head"><strong>Recruiting Class History</strong><small>Review the staff's signing-day calls against only what the program has actually observed since.</small></div><div class="recruiting-history-classes">${classes.slice(0,6).map((c,i)=>`<details class="recruiting-history-class" ${i===0?'open':''}><summary><span><strong>Class of ${c.season}</strong><small>${c.signed} signed · ${c.settled} settled · ${c.developing} developing${c.pending?` · ${c.pending} pending`:''}</small></span><span class="recruiting-history-summary"><b>${count(c,'DIAMOND')} D</b><b>${count(c,'HIT')} H</b><b>${count(c,'BUST')} B</b><b>${count(c,'MISS')} M</b></span></summary><div class="recruiting-history-meta"><span>Avg outcome vs expectation <b>${c.averageDelta>=0?'+':''}${c.averageDelta}</b></span><span>Evaluation hours <b>${c.hoursSpent}</b></span><span>Costly misreads <b>${c.costly}</b></span></div><div class="recruiting-history-rows">${c.players.map(({p,result})=>`<div class="recruiting-history-row"><span><strong>${receiptEscape(p.pos)} ${receiptEscape(p.name)}</strong><small>${result.snapshot.stars??'—'}★ · ${receiptEscape(result.snapshot.verdictLabel)} (${result.snapshot.verdictScore}) · ${result.snapshot.stage.replaceAll('_',' ')}</small></span><span><b class="scouting-receipt-${result.tone}">${receiptEscape(result.label)}</b><small>${result.code==='TOO_EARLY'?'Awaiting evidence':`${result.delta>=0?'+':''}${result.delta} vs expectation · ${result.games} G / ${result.starts} GS`}</small></span></div>`).join('')}</div></details>`).join('')}</div><small class="scouting-receipt-note">Historical classes use the same maturation gates as Scouting Receipts. Hidden true ratings, upside and growth profile are not used.</small></div>`;
 }
 function renderRecruitingHistory(){const t=selected(),recap=$('.scouting-receipt-recap');if(!t||!recap||recap.querySelector?.('.recruiting-history'))return;recap.insertAdjacentHTML?.('beforeend',recruitingHistoryHTML(t))}
 const renderRecruitingBeforeHistory=renderRecruiting;
 renderRecruiting=function(){renderRecruitingBeforeHistory();renderRecruitingHistory()};
 if(typeof TAB_RENDERERS==='object')TAB_RENDERERS.recruiting=renderRecruiting;
 globalThis.DynastyLabRecruitingHistory={history:t=>recruitingHistorySystem.history(receiptPlayers(t),universe.year,t.id)};
}
