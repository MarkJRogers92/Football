(() => {
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const signed=n=>`${n>0?'+':''}${Number(n)||0}`;
const traitNames={speed:'Speed',power:'Power',technique:'Technique',iq:'Processing',composure:'Composure',durability:'Durability',versatility:'Versatility'};
let selectedPlayerId=null,queued=false,lastSignature='';
function lineRows(rows=[],empty='No observed results in this group yet.'){
 if(!rows.length)return `<div class="dev-viz-empty">${esc(empty)}</div>`;
 return rows.map(x=>`<button type="button" class="dev-viz-row" data-dev-player="${esc(x.id)}"><span><strong>${esc(x.pos)} ${esc(x.name)}</strong><small>${esc(x.focus||x.grade||'Observed camp result')}</small></span><b class="${x.delta>1?'dev-rise':x.delta<0?'dev-fall':'dev-flat'}">${signed(x.delta)}</b></button>`).join('');
}
function chartHTML(player){
 const rows=player?.series||[];
 if(!rows.length)return `<div class="dev-chart-empty"><strong>No camp history yet</strong><span>Spring Development and Fall Camp results will build this observed progression chart over time.</span></div>`;
 const values=[0,...rows.map(x=>x.value)],min=Math.min(...values),max=Math.max(...values),span=Math.max(2,max-min),w=640,h=190,padX=36,padY=25,count=Math.max(1,rows.length),x=i=>padX+(w-padX*2)*(i/count),y=v=>padY+(h-padY*2)*(max-v)/span;
 const points=[[x(0),y(0)],...rows.map((r,i)=>[x(i+1),y(r.value)])],poly=points.map(p=>p.join(',')).join(' '),zeroY=y(0);
 const dots=points.map((p,i)=>`<circle class="dev-chart-point" cx="${p[0]}" cy="${p[1]}" r="5"><title>${i===0?'Baseline':`${rows[i-1].label}: ${signed(rows[i-1].delta)} camp movement`}</title></circle>`).join('');
 const labels=rows.map((r,i)=>`<text x="${x(i+1)}" y="174" text-anchor="middle">${esc(String(r.year).slice(-2))} ${esc(r.phase.slice(0,1))}</text>`).join('');
 return `<div class="dev-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Observed cumulative camp movement for ${esc(player.name)}"><line class="dev-chart-baseline" x1="${padX}" y1="${zeroY}" x2="${w-padX}" y2="${zeroY}"></line><polyline points="${poly}"></polyline>${dots}${labels}</svg><div class="dev-chart-legend"><span>Baseline = first observed camp</span><strong>${signed(player.totalDelta)} cumulative observed movement</strong></div></div>`;
}
function attributesHTML(player){
 const attrs=player?.attributes||[];
 if(!attrs.length)return `<div class="dev-viz-empty">No attribute movement recorded in the latest observed camp.</div>`;
 const max=Math.max(1,...attrs.map(x=>Math.abs(x.value)));
 return attrs.slice(0,7).map(x=>`<div class="dev-attr-row"><span>${esc(traitNames[x.key]||x.key)}</span><i><b class="${x.value>=0?'positive':'negative'}" style="--dev-bar:${Math.max(8,Math.round(Math.abs(x.value)/max*100))}%"></b></i><strong class="${x.value>0?'dev-rise':x.value<0?'dev-fall':'dev-flat'}">${signed(x.value)}</strong></div>`).join('');
}
function playerPanel(player){
 if(!player)return `<div class="dev-player-detail dev-chart-empty"><strong>No roster player available.</strong></div>`;
 const trend=player.tendency,trendHTML=trend?`<div class="dev-story-card ${esc(trend.tone||'neutral')}"><span>OBSERVED PATTERN</span><strong>${esc(trend.label||'Tracking')}</strong><p>${esc(trend.summary||player.summary)}</p><small>${trend.observations||player.history.length} camp observations · ${trend.confidence??player.confidence??'—'}% staff confidence</small></div>`:`<div class="dev-story-card"><span>OBSERVED PATTERN</span><strong>Building the file</strong><p>${esc(player.summary)}</p></div>`;
 return `<div class="dev-player-detail"><div class="dev-player-head"><div><span>PLAYER DEVELOPMENT FILE</span><h3>${esc(player.name)}</h3><p>${esc(player.pos)} · Current staff read ${player.currentRead??'—'} · ${player.confidence??'—'}% confidence${player.trainingFocus?` · ${esc(player.trainingFocus)}`:''}</p></div><button type="button" data-dev-open-player="${esc(player.id)}">Open Profile</button></div><div class="dev-player-content"><div><h4>Observed progression</h4>${chartHTML(player)}</div><div><h4>Latest attribute movement</h4><div class="dev-attr-list">${attributesHTML(player)}</div></div></div>${trendHTML}<div class="dev-viz-guardrail">Observed camp receipts and staff reads only. Hidden growth curves, hidden potential and true talent are never exposed here.</div></div>`;
}
function render(){
 queued=false;const api=globalThis.DynastyLabDevelopmentView,snap=api?.snapshot?.(),host=document.querySelector('#development');if(!snap||!host)return;
 let root=document.querySelector('#developmentVisualLab');if(!root){root=document.createElement('section');root.id='developmentVisualLab';root.className='development-lab-viz';const head=host.querySelector('.section-head');head?.insertAdjacentElement('afterend',root);if(!head)host.prepend(root)}
 const candidates=[...(snap.players||[])].sort((a,b)=>b.historyCount-a.historyCount||Math.abs(b.totalDelta)-Math.abs(a.totalDelta)||(b.currentRead||0)-(a.currentRead||0));if(!candidates.some(x=>String(x.id)===String(selectedPlayerId)))selectedPlayerId=(snap.summary?.risers?.[0]?.id??candidates[0]?.id??null);
 const cycle=snap.summary?.cycle||{},cycleLabel=cycle.rows?.length?`${cycle.year} ${cycle.phase}`:'Awaiting first camp',summary=snap.summary||{},sig=[snap.team.id,snap.year,snap.phase,cycleLabel,summary.average,summary.improved,summary.declined,candidates.reduce((n,x)=>n+x.historyCount,0),selectedPlayerId].join('|');if(sig===lastSignature&&root.childElementCount)return;lastSignature=sig;
 const groups=(summary.groups||[]).slice(0,10).map(g=>`<div class="dev-group-row"><span>${esc(g.pos)}<small>${g.players} player${g.players===1?'':'s'}</small></span><i><b style="--dev-group:${Math.max(6,Math.min(100,50+g.average*9))}%"></b></i><strong class="${g.average>1?'dev-rise':g.average<0?'dev-fall':'dev-flat'}">${signed(g.average)}</strong></div>`).join('')||'<div class="dev-viz-empty">Position-group trends appear after camp results.</div>';
 const picker=candidates.slice(0,12).map(x=>`<button type="button" data-dev-player="${esc(x.id)}" class="${String(x.id)===String(selectedPlayerId)?'active':''}"><strong>${esc(x.pos)} ${esc(x.name)}</strong><span>${x.historyCount?`${x.historyCount} camps · ${signed(x.totalDelta)}`:'No camp history'}</span></button>`).join('');
 const player=api.player?.(selectedPlayerId);
 root.innerHTML=`<div class="dev-viz-hero"><div><span class="eyebrow">DEVELOPMENT LAB</span><h2>Is ${esc(snap.team.name)} developing talent?</h2><p>Observed camp movement, position-group trends and individual progression — built from the receipts the staff has actually seen.</p></div><div class="dev-viz-kpis"><div><span>Latest window</span><strong>${esc(cycleLabel)}</strong></div><div><span>Avg movement</span><strong class="${summary.average>1?'dev-rise':summary.average<0?'dev-fall':'dev-flat'}">${signed(summary.average||0)}</strong></div><div><span>Improved</span><strong>${summary.improved||0}</strong></div><div><span>Regressed</span><strong>${summary.declined||0}</strong></div></div></div><div class="dev-team-grid"><section><div class="dev-viz-head"><span>BIGGEST RISERS</span><strong>${cycleLabel}</strong></div>${lineRows(summary.risers,'No positive camp movement recorded yet.')}</section><section><div class="dev-viz-head"><span>STALLED / FLAT</span><strong>0 to +1</strong></div>${lineRows(summary.stalledPlayers,'No stalled players in the latest observed camp.')}</section><section><div class="dev-viz-head"><span>POSITION GROUPS</span><strong>Avg change</strong></div><div class="dev-group-list">${groups}</div></section></div><div class="dev-player-workspace"><aside><div class="dev-viz-head"><span>PLAYER FILES</span><strong>Observed history</strong></div><div class="dev-player-picker">${picker}</div></aside>${playerPanel(player)}</div>`;
 root.querySelectorAll('[data-dev-player]').forEach(b=>b.onclick=()=>{selectedPlayerId=b.dataset.devPlayer;lastSignature='';render()});root.querySelectorAll('[data-dev-open-player]').forEach(b=>b.onclick=()=>document.querySelector(`#trainingBody [data-player="${CSS.escape(b.dataset.devOpenPlayer)}"]`)?.click());
}
function queue(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(render,0)}
document.addEventListener('click',e=>{if(e.target.closest('[data-tab="development"], [data-shell-route="development"]'))setTimeout(queue,0)});document.querySelector('#userTeam')?.addEventListener('change',()=>{selectedPlayerId=null;lastSignature='';setTimeout(queue,0)});
if(window.MutationObserver){const development=document.querySelector('#development');if(development)new MutationObserver(queue).observe(development,{childList:true,subtree:true,characterData:true})}
queue();
})();
