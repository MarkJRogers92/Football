function makeScoutingReceiptSystem(env){
 'use strict';
 const clamp=env.clamp;
 function universe(){return env.getUniverse()}
 function stageFromRecord(rec){return rec?.full?'FULL_EVALUATION':rec?.quick?'QUICK_FILM':'PRELIMINARY'}
 function receiptHours(rec){return (rec?.receipts||[]).reduce((n,x)=>n+(Number(x.cost)||0),0)}
 function signingSnapshot(r,t,verdict,rec={}){
  const u=universe(),current=Number.isFinite(r?.scout)?r.scout:Number.isFinite(r?.perceived)?r.perceived:60,upside=Number.isFinite(r?.scoutUp)?r.scoutUp:Number.isFinite(r?.perceivedUpside)?r.perceivedUpside:Math.max(current,68);
  return{
   version:1,schoolId:t.id,schoolName:t.name,recruitId:r.id,name:r.name,pos:r.pos,style:r.style||null,
   season:u.year,week:r.commitWeek??u.week,stars:r.stars??null,nationalRank:r.nationalRank??null,positionRank:r.positionRank??null,
   currentRead:Math.round(current),upsideRead:Math.round(upside),verdictScore:Math.round(verdict.score),verdictLabel:verdict.label,
   conviction:verdict.conviction,confidence:Math.round(verdict.confidence||0),rangeWidth:Number(verdict.spread||0),
   stage:stageFromRecord(rec),hoursSpent:receiptHours(rec),interest:Number.isFinite(r.interest)?Math.round(r.interest):null
  };
 }
 function freezeSigningReceipt(r,t,verdict,rec={}){
  if(!r||!t||r.committed!==t.name)return null;
  r.recruitingMemory??={season:universe().year,schoolId:t.id,stars:r.stars,homeRegion:r.homeRegion};
  if(r.recruitingMemory.scoutingReceipt)return r.recruitingMemory.scoutingReceipt;
  const snap=signingSnapshot(r,t,verdict,rec);r.recruitingMemory.scoutingReceipt=snap;return snap;
 }
 function totals(p){
  let games=0,starts=0;
  for(const s of p?.seasonHistory||[]){games+=Number(s.games??s.stats?.games)||0;starts+=Number(s.starts??s.stats?.starts)||0}
  games+=Number(p?.stats?.games)||0;starts+=Number(p?.stats?.starts)||0;
  return{games,starts,awards:(p?.awards||[]).length};
 }
 function observedEvidence(p,year){
  const snap=p?.recruitingMemory?.scoutingReceipt;if(!snap)return null;
  const count=totals(p),observed=Number.isFinite(p.perceived)?p.perceived:snap.currentRead,confidence=clamp(Math.round(p.scoutConfidence??50),0,100),seasons=Math.max(0,(year??universe().year)-snap.season),startRate=count.games?count.starts/count.games:0;
  const experienceBonus=count.games>=6?Math.min(3,count.games/10):0,roleBonus=count.games>=6?Math.min(4,startRate*5):0,awardBonus=Math.min(5,count.awards*2),outcomeScore=clamp(Math.round(observed+experienceBonus+roleBonus+awardBonus),20,99);
  const expectedScore=clamp(Math.round(snap.currentRead*.65+snap.upsideRead*.20+snap.verdictScore*.15),20,99),delta=outcomeScore-expectedScore;
  return{snapshot:snap,seasons,games:count.games,starts:count.starts,awards:count.awards,startRate,observed:Math.round(observed),confidence,outcomeScore,expectedScore,delta};
 }
 function classifyPlayer(p,year){
  const e=observedEvidence(p,year);if(!e)return null;
  const highExpectation=e.snapshot.verdictScore>=80||(e.snapshot.stars??0)>=4,lowExpectation=e.snapshot.verdictScore<=73||(e.snapshot.stars??5)<=3;
  const watchReady=e.seasons>=1&&e.games>=4&&e.confidence>=55,mature=e.seasons>=2&&e.games>=12&&e.confidence>=68;
  let code='TOO_EARLY',label='Too Early',tone='neutral';
  if(watchReady&&!mature){
   if(lowExpectation&&e.delta>=7){code='DIAMOND_WATCH';label='Diamond Watch';tone='good'}
   else if(highExpectation&&e.delta<=-7){code='BUST_WATCH';label='Bust Watch';tone='bad'}
   else if(e.delta>=6){code='UP';label='Trending Up';tone='good'}
   else if(e.delta<=-6){code='DOWN';label='Concern';tone='bad'}
   else{code='TRACKING';label='Tracking';tone='neutral'}
  }else if(mature){
   if(lowExpectation&&e.delta>=8&&e.observed>=74){code='DIAMOND';label='Diamond';tone='good'}
   else if(highExpectation&&e.delta<=-9&&e.observed<=75){code='BUST';label='Bust';tone='bad'}
   else if(highExpectation&&e.delta>=-3){code='HIT';label='Hit';tone='good'}
   else if(e.delta<=-6){code='MISS';label='Miss';tone='bad'}
   else if(e.delta>=5){code='HIT';label='Hit';tone='good'}
   else{code='AS_SCOUTED';label='As Scouted';tone='neutral'}
  }
  const final=['DIAMOND','BUST','HIT','MISS','AS_SCOUTED'].includes(code),costly=(code==='BUST'||code==='MISS')&&(e.snapshot.hoursSpent>=3||e.snapshot.verdictScore>=80);
  return{...e,code,label,tone,final,costly};
 }
 function receiptSummary(result){
  if(!result)return'';
  const s=result.snapshot,signing=`${s.verdictLabel} (${s.verdictScore})`,now=`${result.observed} observed`,delta=`${result.delta>=0?'+':''}${result.delta} vs signing expectation`;
  if(result.code==='TOO_EARLY')return `${signing} at signing · ${now}. Too early for a scouting grade.`;
  return `${result.label}: ${signing} at signing · ${now} · ${delta} · ${result.games} games / ${result.starts} starts.`;
 }
 function summarizePlayers(players,year,schoolId=null){
  const rows=(players||[]).map(p=>({p,result:classifyPlayer(p,year)})).filter(x=>x.result&&(!schoolId||x.result.snapshot.schoolId===schoolId));
  const visible=rows.filter(x=>x.result.code!=='TOO_EARLY'),final=visible.filter(x=>x.result.final),watch=visible.filter(x=>!x.result.final),counts={};
  for(const x of visible)counts[x.result.code]=(counts[x.result.code]||0)+1;
  const notable=visible.slice().sort((a,b)=>(b.result.final?1:0)-(a.result.final?1:0)||Math.abs(b.result.delta)-Math.abs(a.result.delta)||b.result.games-a.result.games).slice(0,6);
  return{tracked:rows.length,visible:visible.length,pending:rows.length-visible.length,final:final.length,watch:watch.length,costly:final.filter(x=>x.result.costly).length,counts,notable};
 }
 return{stageFromRecord,signingSnapshot,freezeSigningReceipt,observedEvidence,classifyPlayer,receiptSummary,summarizePlayers};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeScoutingReceiptSystem};
}else{
 const scoutingReceiptSystem=makeScoutingReceiptSystem({getUniverse:()=>universe,clamp});
 const receiptEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function freezeRecruitReceipt(r,t){if(!r||!t||r.committed!==t.name)return null;return scoutingReceiptSystem.freezeSigningReceipt(r,t,recruitStaffVerdict(r,t),recruitScoutingRecord(r,t,false))}
 function freezeControlledCommitReceipts(){const t=selected();if(!t)return;for(const r of universe.recruits||[])if(r.committed===t.name)freezeRecruitReceipt(r,t)}
 function receiptPlayers(t){
  const active=(t?.roster||[]),archive=(universe.playerArchive||[]).filter(p=>p?.recruitingMemory?.scoutingReceipt?.schoolId===t?.id),seen=new Set();
  return [...active,...archive].filter(p=>{if(!p?.id||seen.has(p.id))return false;seen.add(p.id);return true});
 }
 function receiptBadgeHTML(result){if(!result||result.code==='TOO_EARLY'||result.code==='TRACKING')return'';return `<span class="scouting-receipt-badge scouting-receipt-${result.tone}" title="${receiptEscape(scoutingReceiptSystem.receiptSummary(result))}">${receiptEscape(result.label)}</span>`}
 function renderRosterReceiptBadges(){
  const t=selected(),body=$('#rosterBody');if(!t||!body)return;
  for(const link of body.querySelectorAll?.('[data-player]')||[]){
   const p=t.roster.find(x=>String(x.id)===String(link.dataset.player));if(!p)continue;
   const result=scoutingReceiptSystem.classifyPlayer(p,universe.year),badge=receiptBadgeHTML(result);if(!badge)continue;
   const cell=link.closest?.('td')||link.parentElement;if(cell&&!cell.querySelector?.('.scouting-receipt-badge'))cell.insertAdjacentHTML?.('beforeend',badge);
  }
 }
 function renderRecruitingReceiptRecap(){
  const t=selected(),host=$('#classSummary');if(!t||!host||host.querySelector?.('.scouting-receipt-recap'))return;
  const summary=scoutingReceiptSystem.summarizePlayers(receiptPlayers(t),universe.year,t.id);if(!summary.tracked)return;
  const count=code=>summary.counts[code]||0,top=summary.notable.map(({p,result})=>`<div class="scouting-receipt-row"><span><strong>${receiptEscape(p.pos)} ${receiptEscape(p.name)}</strong><small>${receiptEscape(result.snapshot.verdictLabel)} at signing · ${result.games} games / ${result.starts} starts</small></span><b class="scouting-receipt-${result.tone}">${receiptEscape(result.label)} · ${result.delta>=0?'+':''}${result.delta}</b></div>`).join('');
  host.insertAdjacentHTML?.('beforeend',`<div class="scouting-receipt-recap"><div class="scouting-receipt-head"><div><strong>Scouting Receipts</strong><small>What the staff believed at signing versus what has actually been observed later.</small></div><span>${summary.final} settled · ${summary.watch} developing</span></div><div class="scouting-receipt-kpis"><span><b>${count('DIAMOND')}</b> Diamonds</span><span><b>${count('HIT')}</b> Hits</span><span><b>${count('BUST')}</b> Busts</span><span><b>${count('MISS')}</b> Misses</span><span><b>${summary.costly}</b> Costly misreads</span></div>${top?`<div class="scouting-receipt-list">${top}</div>`:''}<small class="scouting-receipt-note">Watch labels are provisional. Final labels require at least two seasons, 12 games and strong staff confidence. Hidden true ratings are never used.</small></div>`);
 }
 const commitRecruitBeforeScoutingReceipts=commitRecruit;
 commitRecruit=function(r,name){const ok=commitRecruitBeforeScoutingReceipts(r,name);if(ok){const t=T(name);if(t&&selected()?.id===t.id)freezeRecruitReceipt(r,t)}return ok};
 const finalizeRecruitingBeforeScoutingReceipts=finalizeRecruiting;
 finalizeRecruiting=function(){const out=finalizeRecruitingBeforeScoutingReceipts();freezeControlledCommitReceipts();return out};
 const renderRecruitingBeforeScoutingReceipts=renderRecruiting;
 renderRecruiting=function(){freezeControlledCommitReceipts();renderRecruitingBeforeScoutingReceipts();renderRecruitingReceiptRecap()};
 const renderRosterBeforeScoutingReceipts=renderRoster;
 renderRoster=function(){renderRosterBeforeScoutingReceipts();renderRosterReceiptBadges()};
 globalThis.DynastyLabScoutingReceipts={classifyPlayer:p=>scoutingReceiptSystem.classifyPlayer(p,universe.year),summary:p=>scoutingReceiptSystem.receiptSummary(scoutingReceiptSystem.classifyPlayer(p,universe.year)),teamSummary:t=>scoutingReceiptSystem.summarizePlayers(receiptPlayers(t),universe.year,t.id)};
}
