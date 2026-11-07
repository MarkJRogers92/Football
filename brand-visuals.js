// Dynasty Lab brand visuals: charts, helmets and motion drawn from real game state.
// Presentation only. Data comes from the read-only DynastyBrandSnapshot bridge or already-rendered DOM;
// nothing here writes save data, advances the calendar or draws gameplay randomness.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastyBrandVisuals=api;api.mount?.()}
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const f1=n=>Number(n.toFixed(1))||0;

// ---------- Pure geometry (unit tested) ----------
// Points of a regular polygon radar, first axis straight up, clockwise.
function radarPoints(values,{max=100,radius=1,cx=0,cy=0}={}){
 const n=values.length;
 return values.map((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=radius*clamp(Number(v)||0,0,max)/max;return[f1(cx+r*Math.cos(a)),f1(cy+r*Math.sin(a))]});
}
// Semicircle gauge: angle 180° (left) for 0 through 0° (right) for max.
function gaugePoint(value,{max=100,radius=1,cx=0,cy=0}={}){
 const a=Math.PI*(1-clamp(Number(value)||0,0,max)/max);
 return[f1(cx+radius*Math.cos(a)),f1(cy-radius*Math.sin(a))];
}
function gaugeArc(from,to,opts={}){
 const {radius=1}=opts,[x1,y1]=gaugePoint(from,opts),[x2,y2]=gaugePoint(to,opts);
 return`M${x1} ${y1}A${radius} ${radius} 0 0 1 ${x2} ${y2}`;
}
// Parses a staff estimate such as "A- · 85-93" into a bounded range on the 40–99 rating scale.
function estimateRange(label,{lo=40,hi=99}={}){
 const m=String(label||'').match(/(\d{2})\s*[-–]\s*(\d{2})/);if(!m)return null;
 let a=Number(m[1]),b=Number(m[2]);if(a>b)[a,b]=[b,a];
 const pct=v=>f1(clamp((v-lo)/(hi-lo),0,1)*100);
 return{low:a,high:b,start:pct(a),end:pct(b)};
}
// Season strip model: every scheduled game in week order, with the first unplayed game marked next.
function seasonStrip(schedule){
 const games=(schedule||[]).slice().sort((a,b)=>(a.week||0)-(b.week||0));
 const nextIndex=games.findIndex(g=>!g.played);
 return games.map((g,i)=>({...g,next:i===nextIndex,label:g.played?`${g.result} ${g.us}-${g.them}`:(g.home?'vs':'@')}));
}

// ---------- SVG builders ----------
function radarSVG(attrs,{size=220}={}){
 const pad=52,r=(size-pad*2)/2,c=size/2,values=attrs.map(a=>a.value);
 const ring=f=>radarPoints(values.map(()=>100*f),{radius:r,cx:c,cy:c}).map(p=>p.join(',')).join(' ');
 const axes=radarPoints(values.map(()=>100),{radius:r,cx:c,cy:c});
 const labels=radarPoints(values.map(()=>100),{radius:r+26,cx:c,cy:c});
 const shape=radarPoints(values,{radius:r,cx:c,cy:c}).map(p=>p.join(',')).join(' ');
 const summary=attrs.map(a=>`${a.label} ${a.value}`).join(', ');
 return`<svg class="bi-radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="Program attributes: ${esc(summary)}">`+
  `<defs><linearGradient id="biRadarFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--bi-gold)" stop-opacity=".55"/><stop offset="1" stop-color="var(--team-secondary,#73a8ff)" stop-opacity=".3"/></linearGradient></defs>`+
  [1,.75,.5,.25].map(f=>`<polygon class="bi-radar-ring" points="${ring(f)}"/>`).join('')+
  axes.map(([x,y])=>`<line class="bi-radar-axis" x1="${c}" y1="${c}" x2="${x}" y2="${y}"/>`).join('')+
  `<polygon class="bi-radar-shape" points="${shape}"/>`+
  radarPoints(values,{radius:r,cx:c,cy:c}).map(([x,y])=>`<circle class="bi-radar-dot" cx="${x}" cy="${y}" r="3"/>`).join('')+
  labels.map(([x,y],i)=>`<text class="bi-radar-label" x="${x}" y="${f1(y-4)}" text-anchor="middle">${esc(attrs[i].label.toUpperCase())}</text><text class="bi-radar-value" x="${x}" y="${f1(y+10)}" text-anchor="middle">${esc(attrs[i].value)}</text>`).join('')+
  `</svg>`;
}
function gaugeSVG(value,{label='',caption=''}={}){
 const W=200,H=118,c=100,cy=100,r=78,v=clamp(Number(value)||0,0,100),[nx,ny]=gaugePoint(Math.max(.5,v),{radius:r-14,cx:c,cy});
 const bands=[[0,20,'bad'],[20,40,'warn'],[40,60,'mid'],[60,80,'good'],[80,100,'great']];
 return`<svg class="bi-gauge" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}: ${v} of 100${caption?`, ${esc(caption)}`:''}">`+
  bands.map(([a,b,k])=>`<path class="bi-gauge-band is-${k}" d="${gaugeArc(a+.8,b-.8,{radius:r,cx:c,cy})}"/>`).join('')+
  `<path class="bi-gauge-fill" d="${gaugeArc(0,Math.max(.5,v),{radius:r-14,cx:c,cy})}"/>`+
  `<circle class="bi-gauge-tip" cx="${nx}" cy="${ny}" r="5"/>`+
  `<text class="bi-gauge-value" x="${c}" y="${cy-4}" text-anchor="middle">${v}</text>`+
  `</svg>`;
}
function ringSVG(done,total,{label='Goals'}={}){
 const r=30,C=2*Math.PI*r,frac=total?clamp(done/total,0,1):0;
 return`<svg class="bi-ring" viewBox="0 0 80 80" role="img" aria-label="${esc(label)}: ${done} of ${total} complete"><circle class="bi-ring-track" cx="40" cy="40" r="${r}"/><circle class="bi-ring-fill" cx="40" cy="40" r="${r}" stroke-dasharray="${f1(C*frac)} ${f1(C)}" transform="rotate(-90 40 40)"/><text class="bi-ring-value" x="40" y="45" text-anchor="middle">${done}/${total}</text></svg>`;
}
function helmetHTML(id,cls=''){
 id=Number(id);if(!Number.isInteger(id)||id<1||id>120)return`<span class="bi-helmet bi-helmet--none ${cls}" aria-hidden="true"></span>`;
 const i=id-1;return`<span class="bi-helmet ${cls}" style="--col:${i%12};--row:${Math.floor(i/12)}" aria-hidden="true"><span class="bi-helmet-shell"></span><span class="bi-helmet-logo"></span></span>`;
}
function stripHTML(team){
 const games=seasonStrip(team.schedule);if(!games.length)return'';
 const chips=games.map(g=>{
  const state=g.played?(g.result==='W'?'is-win':'is-loss'):g.next?'is-next':'is-future';
  const opp=`${g.home?'vs':'at'} ${g.opponent.rank?`#${g.opponent.rank} `:''}${g.opponent.name}`;
  const res=g.played?`${g.result==='W'?'Won':'Lost'} ${g.us}-${g.them}`:g.next?'Next game':'Upcoming';
  return`<li class="bi-chip ${state}${g.conf?' is-conf':''}" title="Week ${g.week}: ${esc(opp)} · ${esc(res)}"><span class="bi-chip-wk">W${g.week}</span>${helmetHTML(g.opponent.id,'bi-helmet--chip'+(g.home?'':' is-away'))}<b>${esc(g.label)}</b><span class="bi-sr">Week ${g.week}, ${esc(opp)}, ${esc(res)}</span></li>`;
 }).join('');
 return`<ol class="bi-strip" aria-label="${esc(team.name)} season schedule">${chips}</ol>`;
}

// ---------- DOM mounting ----------
function reducedMotion(){return document.body.classList.contains('motion-reduced')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
function snapshot(){try{return globalThis.DynastyBrandSnapshot?.team?.()||null}catch(e){return null}}
const sigs=new Map();
function same(key,sig){if(sigs.get(key)===sig)return true;sigs.set(key,sig);return false}

function paintMasthead(team){
 const mast=document.querySelector('#dashboard .program-masthead');if(!mast||!team)return;
 const ident=mast.querySelector('.masthead-identity');
 if(ident){
  let h=ident.querySelector(':scope > .bi-helmet');
  if(!h||h.dataset.team!==String(team.id)){h?.remove();ident.insertAdjacentHTML('afterbegin',helmetHTML(team.id,'bi-helmet--hero'));h=ident.firstElementChild;h.dataset.team=String(team.id)}
  mast.classList.add('bi-has-helmet');
 }
 let strip=mast.querySelector(':scope > .bi-strip-host');
 const sig=JSON.stringify(team.schedule.map(g=>[g.week,g.played,g.us,g.them,g.opponent.id,g.opponent.rank]));
 if(!strip){strip=document.createElement('div');strip.className='bi-strip-host';const details=mast.querySelector('#programDetails');details?mast.insertBefore(strip,details):mast.append(strip);sigs.delete('strip')}
 if(!same('strip',team.id+sig))strip.innerHTML=stripHTML(team);
 const next=strip.querySelector('.bi-chip.is-next');
 if(next&&strip.scrollWidth>strip.clientWidth){const list=strip.querySelector('.bi-strip');if(list)list.scrollLeft=Math.max(0,next.offsetLeft-list.clientWidth/2+next.clientWidth/2)}
}
function paintProgram(team){
 const host=document.querySelector('#programAttributes');if(!host||!team||host.hidden)return;
 if(!host.querySelector('.program-attrs'))return;
 const sig=JSON.stringify([team.attributes,team.confidence,team.goals,team.expectedWins,team.w,team.l]);
 let vis=host.querySelector(':scope > .bi-program-visual');
 if(vis&&same('program',sig))return;sigs.set('program',sig);
 const html=`<div class="bi-program-visual"><figure class="bi-figure bi-figure--radar">${radarSVG(team.attributes)}<figcaption>Program profile</figcaption></figure>`+
  `<figure class="bi-figure">${gaugeSVG(team.confidence??50,{label:'Administration confidence',caption:team.confidenceLabel||''})}<figcaption>Admin confidence<b>${esc(team.confidenceLabel||'—')}</b></figcaption></figure>`+
  (team.goals?`<figure class="bi-figure">${ringSVG(team.goals.completed,team.goals.total,{label:'Season goals'})}<figcaption>Season goals<b>${team.goals.atRisk?`${team.goals.atRisk} at risk`:'On track'}</b></figcaption></figure>`:'')+
  `<figure class="bi-figure bi-figure--pace"><div class="bi-pace" role="img" aria-label="${team.w} wins against an expectation of ${team.expectedWins}"><div class="bi-pace-track"><i style="width:${clamp(team.w/Math.max(12,team.expectedWins)*100,0,100).toFixed(1)}%"></i><s style="left:${clamp(team.expectedWins/Math.max(12,team.expectedWins)*100,0,100).toFixed(1)}%"></s></div><div class="bi-pace-copy"><strong>${team.w}</strong><span>of ${team.expectedWins} expected wins</span></div></div><figcaption>Win pace</figcaption></figure></div>`;
 if(vis)vis.outerHTML=html;else host.querySelector('.eyebrow')?.insertAdjacentHTML('afterend',html);
 host.classList.add('bi-has-visual');
}
// Next-matchup card: swap the flat marks for the two real helmets, facing each other.
function paintMatchup(team){
 const host=document.querySelector('#broadcastFeature .broadcast-matchup');if(!host)return;
 const byName=new Map([[team.name,team.id],...team.schedule.map(g=>[g.opponent.name,g.opponent.id])]);
 for(const card of host.querySelectorAll('.broadcast-team')){
  const name=(card.querySelector('strong')?.textContent||'').trim(),id=byName.get(name);
  const existing=card.querySelector(':scope > .bi-helmet');
  if(existing&&existing.dataset.team===String(id))continue;existing?.remove();
  if(!id)continue;
  card.insertAdjacentHTML('afterbegin',helmetHTML(id,'bi-helmet--matchup'+(card.classList.contains('opponent')?' is-away':'')));
  card.firstElementChild.dataset.team=String(id);card.classList.add('bi-has-helmet');
 }
}
// Season pulse: the program and next-opponent marks become helmets as well.
function paintSeasonPulse(){
 const host=document.querySelector('#seasonPulse');if(!host)return;
 for(const [sel,attr,cls] of [['.season-pulse-main','seasonTeam','bi-helmet--pulse'],['.season-next','seasonOpponent','bi-helmet--pulse-next is-away']]){
  const box=host.querySelector(sel);if(!box)continue;const id=box.dataset[attr];
  const existing=box.querySelector(':scope > .bi-helmet');if(existing&&existing.dataset.team===String(id))continue;existing?.remove();
  if(!id)continue;box.insertAdjacentHTML('afterbegin',helmetHTML(id,cls));box.firstElementChild.dataset.team=String(id);box.classList.add('bi-has-helmet');
 }
}
let queued=false,watchFeature=null;
function paint(){queued=false;watchFeature?.();const team=snapshot();if(!team)return;paintMasthead(team);paintProgram(team);paintMatchup(team);paintSeasonPulse()}
function queue(){if(queued)return;queued=true;(window.requestAnimationFrame||setTimeout)(paint)}

// Section entrance: the newly active tab's cards rise in once; no effect under reduced motion.
function enter(section){
 if(!section||reducedMotion())return;
 section.classList.remove('bi-enter');void section.offsetWidth;section.classList.add('bi-enter');
 clearTimeout(section._biEnter);section._biEnter=setTimeout(()=>section.classList.remove('bi-enter'),900);
}
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{
  document.documentElement.classList.add('bi-brand');
  const ownNode=n=>n.nodeType===1&&(n.classList?.contains('bi-strip-host')||n.classList?.contains('bi-helmet')||n.classList?.contains('bi-program-visual')||n.closest?.('.bi-strip-host,.bi-program-visual'));
  const real=records=>records.some(r=>!(r.target.nodeType===1&&r.target.closest?.('.bi-strip-host,.bi-program-visual'))&&![...r.addedNodes,...r.removedNodes].every(ownNode));
  const obs=new MutationObserver(records=>{if(real(records))queue()});
  const feature=()=>{for(const f of [document.querySelector('#broadcastFeature'),document.querySelector('#seasonPulse')])if(f&&!f.dataset.biObserved){f.dataset.biObserved='1';obs.observe(f,{childList:true,subtree:true})}};
  for(const sel of ['#dashboard .program-masthead','#programAttributes','#recordBig','#weekLine','#teamName'])document.querySelectorAll(sel).forEach(el=>obs.observe(el,sel==='#programAttributes'?{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']}:{childList:true,subtree:true,characterData:true}));
  const tabObs=new MutationObserver(records=>{for(const r of records){const s=r.target;if(s.classList.contains('active')&&!(r.oldValue||'').split(/\s+/).includes('active')){enter(s);queue()}}});
  document.querySelectorAll('main section.tab').forEach(s=>tabObs.observe(s,{attributes:true,attributeFilter:['class'],attributeOldValue:true}));
  watchFeature=feature;queue();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{radarPoints,gaugePoint,gaugeArc,estimateRange,seasonStrip,radarSVG,gaugeSVG,ringSVG,helmetHTML,stripHTML,mount};
});
