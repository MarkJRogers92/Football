// Game Day momentum: a live win-chance estimate and graph for Interactive Game Day.
// Presentation only. It reads the event states Game Engine 2 already records (score, clock, possession,
// field position) and never feeds back into the simulation.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.DynastyGameDayMomentum=api;
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const QUARTER=900,GAME=4*QUARTER;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function erf(x){const s=Math.sign(x);x=Math.abs(x);const t=1/(1+.3275911*x),y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-x*x);return s*y}
const phi=z=>.5*(1+erf(z/Math.SQRT2));
function secondsLeft(st){if(!st)return GAME;if(st.status==='final')return 0;const p=Number(st.period)||1;if(p>4||st.ot)return 300;return Math.max(0,(4-p)*QUARTER+(Number(st.clock)||0))}
// Expected points of the current possession from field position (yards from the offense's own goal line).
function possessionValue(fieldPosition){const f=Number(fieldPosition);if(!Number.isFinite(f))return 0;return Math.max(-1,Math.min(6,-1+.07*f))}
// Expected points of margin per point of overall rating gap, measured on league games (a 10 point gap wins ~80%).
const POINTS_PER_RATING=1;
// Pre-game edge in points for the home team from the two teams' ratings, so a mismatch shows before a snap is played.
function strengthEdge(inputs){const h=Number(inputs?.home?.rating),a=Number(inputs?.away?.rating);return Number.isFinite(h)&&Number.isFinite(a)?(h-a)*POINTS_PER_RATING:0}
// Chance that `side` wins from this state. homeEdge is a small pre-game edge in points for the home team and
// strengthEdge the team-rating edge in points for the home team; both fade as the clock runs down.
function winChance(st,side,{homeEdge=0,strengthEdge=0}={}){
 if(!st?.score)return .5;const other=side==='home'?'away':'home';
 const margin=(Number(st.score[side])||0)-(Number(st.score[other])||0),left=secondsLeft(st);
 if(st.status==='final')return margin>0?1:margin<0?0:.5;
 const poss=st.possession===side?possessionValue(st.fieldPosition):st.possession===other?-possessionValue(st.fieldPosition):0;
 const edge=(side==='home'?1:-1)*((Number(homeEdge)||0)+(Number(strengthEdge)||0))*(left/GAME);
 const sd=13.5*Math.sqrt(left/GAME)+.6;
 return Math.min(.995,Math.max(.005,phi((margin+poss+edge)/sd)));
}
// One point per recorded event, in game-time order, with decisions and scores marked.
function series(events,side,opts={}){
 const out=[{t:0,p:winChance({period:1,clock:QUARTER,score:{home:0,away:0},possession:null},side,opts),kind:'kickoff'}];
 let last={home:0,away:0};
 for(const e of events||[]){const st=e?.state;if(!st?.score)continue;const t=GAME-secondsLeft(st);const scored=st.score.home!==last.home||st.score.away!==last.away;last=st.score;
  out.push({t:Math.min(GAME,Math.max(out.at(-1).t,t)),p:winChance(st,side,opts),kind:e.type==='coaching_decision'?'decision':scored?'score':'play'})}
 return out;
}
function graphSVG(points,{label='Win chance',w=640,h=150}={}){
 if(!points?.length)return'';
 const pad=8,x=t=>pad+(w-2*pad)*t/GAME,y=p=>pad+(h-2*pad)*(1-p);
 const line=points.map((pt,i)=>`${i?'L':'M'}${x(pt.t).toFixed(1)} ${y(pt.p).toFixed(1)}`).join(' ');
 const area=`${line} L${x(points.at(-1).t).toFixed(1)} ${y(.5)} L${x(0)} ${y(.5)} Z`;
 const now=points.at(-1),pct=Math.round(now.p*100);
 const quarters=[1,2,3].map(q=>`<line class="gm-q" x1="${x(q*QUARTER)}" x2="${x(q*QUARTER)}" y1="${pad}" y2="${h-pad}"/>`).join('');
 const marks=points.filter(p=>p.kind==='decision'||p.kind==='score').map(p=>`<circle class="gm-${p.kind}" cx="${x(p.t).toFixed(1)}" cy="${y(p.p).toFixed(1)}" r="${p.kind==='decision'?4.5:3}"/>`).join('');
 return`<svg class="gm-graph" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(label)}: ${pct}% now">`+
  `<defs><clipPath id="gmAbove"><rect x="0" y="0" width="${w}" height="${y(.5)}"/></clipPath><clipPath id="gmBelow"><rect x="0" y="${y(.5)}" width="${w}" height="${h}"/></clipPath></defs>`+
  `${quarters}<line class="gm-mid" x1="${pad}" x2="${w-pad}" y1="${y(.5)}" y2="${y(.5)}"/>`+
  `<path class="gm-area-up" d="${area}" clip-path="url(#gmAbove)"/><path class="gm-area-down" d="${area}" clip-path="url(#gmBelow)"/>`+
  `<path class="gm-line" d="${line}"/>${marks}</svg>`;
}
function panelHTML(session,side,opts={}){
 const pts=series(session?.state?.events,side,opts),now=pts.at(-1),pct=Math.round(now.p*100);
 const swing=pts.length>1?Math.round((now.p-pts.at(-2).p)*100):0;
 const tone=pct>=60?'is-up':pct<=40?'is-down':'is-even';
 return`<section class="gm-panel ${tone}" aria-label="Win chance"><div class="gm-head"><div><span class="eyebrow">WIN CHANCE · ESTIMATE</span><strong>${pct}%</strong>${swing?`<em class="${swing>0?'up':'down'}">${swing>0?'▲':'▼'} ${Math.abs(swing)}</em>`:''}</div><div class="gm-key"><span><i class="k-dec"></i>Your calls</span><span><i class="k-score"></i>Scores</span></div></div>${graphSVG(pts,{label:`${session?.names?.[side]||'Your'} win chance`})}<div class="gm-axis"><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span></div></section>`;
}
return{secondsLeft,possessionValue,strengthEdge,winChance,series,graphSVG,panelHTML,GAME};
});
