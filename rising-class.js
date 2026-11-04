// v0.13.0: the rising class card. Next year's best prospects, read-only, with a watchlist whose
// relationship head start carries across the class rollover (see rollRecruitClass in app.js).
(function(){
 'use strict';
 if(typeof extendRender!=='function')return;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const PAGE=20;
 let shown=PAGE,position='ALL',watchingOnly=false,notice='';
 function visibleRows(){
  const rows=Array.isArray(universe?.risingClass)?universe.risingClass:[];
  return rows.filter(r=>(position==='ALL'||r.pos===position)&&(!watchingOnly||r.watch));
 }
 // Where a watched prospect stands against the leading rival, using the same test the rollover
 // applies: a prospect is protected from an early commitment while your projected pitch (a target's
 // +10 and the relationship head start included) is within EARLY_COMMIT_MARGIN of that rival.
 const standing=new Map();
 function standingFor(r){
  const user=selected();if(!user)return null;
  const key=`${r.id}|${universe.year}|${universe.week}`;
  if(standing.has(key))return standing.get(key);
  clearUnitCache();
  let best=null;
  for(const t of universe.teams){if(t.name===user.name)continue;const pitch=recruitPitch(t,r);if(!best||pitch>best.pitch)best={team:t.name,pitch}}
  const us=recruitPitch(user,r)+10+(r.relationship+WATCH_RELATIONSHIP)*.12,gap=Math.round(us-best.pitch);
  const out={rival:best.team,gap,holding:gap>=-EARLY_COMMIT_MARGIN};
  if(standing.size>400)standing.clear();
  standing.set(key,out);return out;
 }
 function scoutingBlock(r,t){
  const v=recruitStaffVerdict(r,t),rec=recruitScoutingRecord(r,t,false),tag=rec.full?'Full evaluation':rec.quick?'Film reviewed':'Preliminary';
  const st=standingFor(r),standingHTML=st?`<span class="rising-standing ${st.holding?'is-holding':'is-trailing'}">${st.holding?'Holding':'Trailing'} · leading rival ${esc(st.rival)} (${st.gap>=0?'you lead by '+st.gap:'you trail by '+Math.abs(st.gap)})</span>`:'';
  return `<div class="rising-extra"><span class="rising-verdict"><strong>${esc(v.label)}</strong> · ${esc(tag)} · ${v.confidence}% confidence</span>${standingHTML}${scoutingActionButtonsHTML(r,t)}</div>`;
 }
 function rowHTML(r){
  const grade=Math.round((r.scout||0)/5)*5,where=[r.highSchool,r.homeState].filter(Boolean).join(', ');
  const t=selected(),extra=r.watch&&t&&typeof recruitStaffVerdict==='function'?scoutingBlock(r,t):'';
  return `<li class="rising-row${r.watch?' is-watched':''}" data-rising-row="${esc(r.id)}"><div class="rising-main"><span class="rising-rank">#${esc(r.nationalRank)}</span><span class="rising-who"><strong>${esc(r.name)}</strong><small>${esc(r.pos)} · ${'★'.repeat(r.stars)} · ${esc(where)}</small></span><span class="rising-grade" title="Staff estimate, rounded">~${grade}</span><button type="button" class="rising-watch" data-rising-watch="${esc(r.id)}" aria-pressed="${r.watch?'true':'false'}">${r.watch?'Watching':'Watch'}</button></div>${extra}</li>`;
 }
 function render(){
  const tab=document.querySelector('#recruiting');if(!tab||!Array.isArray(universe?.risingClass))return;
  let card=tab.querySelector('#risingClass');
  if(!card){card=document.createElement('section');card.id='risingClass';card.className='card rising-class';tab.append(card)}
  const all=universe.risingClass,watching=all.filter(r=>r.watch).length,rows=visibleRows(),page=rows.slice(0,shown);
  const early=universe.earlyCommitLog?.year===universe.year?universe.earlyCommitLog:null,carried=universe.lastRisingCarry?.year===universe.year?universe.lastRisingCarry.carried:0;
  const carry=(carried>0||early?.total>0)?`<p class="rising-carry">${carried>0?`${carried} watched prospect${carried===1?'':'s'} joined your board this year with a head start`+(early?` and ${early.kept} ${early.kept===1?'is':'are'} still available`:''):''}${carried>0&&early?.total>0?'. ':''}${early?.total>0?`Before the season ${early.total} top prospects committed to rivals${early.lost.length?`, including ${early.lost.slice(0,3).map(x=>esc(x.name)+' ('+esc(x.to)+')').join(', ')}`:''}`:''}.</p>`:'';
  const hours=typeof scoutingHoursInfo==='function'&&selected()&&watching>0?scoutingHoursInfo(selected()):null;
  const positions=['ALL',...POS].map(p=>`<option value="${p}"${p===position?' selected':''}>${p==='ALL'?'All positions':p}</option>`).join('');
  card.innerHTML=`<header class="rising-head"><div><span class="eyebrow">NEXT CLASS · ${universe.year+1}</span><h3>Rising prospects</h3><p>The ${all.length} best prospects of the class that arrives after this one. Watch up to ${WATCHLIST_LIMIT}: when the class rolls over they join your board already targeted, with a relationship and interest head start.</p>${carry}</div><div class="rising-count"><strong>${watching}</strong><span>of ${WATCHLIST_LIMIT} watching</span></div></header><div class="rising-controls"><label>Position<select data-rising-pos>${positions}</select></label><label class="rising-toggle"><input type="checkbox" data-rising-only ${watchingOnly?'checked':''}> Watching only</label>${hours?`<span class="rising-hours">${hours.left} of ${hours.budget} evaluation hours left this week, shared with your current class</span>`:''}<span class="rising-meta">${rows.length===all.length?`${all.length} prospects`:`${rows.length} of ${all.length} prospects`}</span></div>${notice?`<p class="rising-notice" role="status">${esc(notice)}</p>`:''}<ol class="rising-list">${page.map(rowHTML).join('')||'<li class="rising-empty">No prospects match.</li>'}</ol>${rows.length>shown?`<button type="button" class="rising-more" data-rising-more>Show ${Math.min(PAGE,rows.length-shown)} more</button>`:''}`;
  card.querySelector('[data-rising-pos]').onchange=e=>{position=e.target.value;shown=PAGE;notice='';render()};
  card.querySelector('[data-rising-only]').onchange=e=>{watchingOnly=!!e.target.checked;shown=PAGE;notice='';render()};
  const more=card.querySelector('[data-rising-more]');if(more)more.onclick=()=>{shown+=PAGE;render()};
  if(typeof bindScoutingActionButtons==='function')bindScoutingActionButtons();
  card.querySelectorAll('[data-rising-watch]').forEach(b=>b.onclick=()=>{
   const out=toggleRisingWatch(b.dataset.risingWatch);
   notice=out.ok?'':out.reason==='limit'?`Your watchlist is full (${WATCHLIST_LIMIT}). Unwatch someone to add another.`:'That prospect is no longer in the class.';
   render();
  });
 }
 extendRender('recruiting',render);
})();
