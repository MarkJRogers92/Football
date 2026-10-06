// Game Cast: win probability and a real-field replay for games with recorded play-by-play.
// Every point comes from the archived play lines ("Q1 14:18 · 1st & 10 at own 25 · ...") and
// drive records; the model below only interprets them, it never alters a game.
const GAME_CAST_LINE=/^(Q([1-4])|OT(\d*)) (\d+):(\d\d) · (\d)(?:st|nd|rd|th) & (\d+) at (own (\d+)|opp (\d+)|(50)) · (.*)$/;
// Normal CDF (Abramowitz-Stegun 7.1.26), enough precision for a chart.
function gameCastPhi(z){const t=1/(1+.3275911*Math.abs(z)/Math.SQRT2),y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-z*z/2);return z>=0?(1+y)/2:(1-y)/2}
// Home win probability from the lead, the value of the ball and the time left. Field position is
// worth roughly 1.4 points at your own 25 and 5 points at the opponent's 20; the spread of possible
// outcomes shrinks with the square root of time remaining.
function gameCastWinProbability(lead,offense,yardsToGoal,secondsLeft){
 const ep=offense?(6.5-.068*yardsToGoal)*(offense==='home'?1:-1):0;
 const sigma=13.5*Math.sqrt(Math.max(secondsLeft,20)/3600);
 return gameCastPhi((lead+ep*.6+1.2*secondsLeft/3600)/sigma);
}
function gameCastModel(g){
 if(!g?.drives?.length)return null;
 const plays=[],score={home:0,away:0};
 for(const [di,d] of g.drives.entries()){
  const side=d.side==='home'?'home':'away';let scored=0;
  for(const line of d.playByPlay||[]){
   const m=GAME_CAST_LINE.exec(line);if(!m)continue;
   const q=m[2]?Number(m[2]):4+Math.max(1,Number(m[3])||1),clock=Number(m[4])*60+Number(m[5]);
   const own=m[9]!=null?Number(m[9]):null,opp=m[10]!=null?Number(m[10]):null;
   // x runs 0..100 from the away end zone (left) to the home end zone (right).
   const fromOwn=own!=null?own:opp!=null?100-opp:50,x=side==='away'?fromOwn:100-fromOwn;
   const secondsLeft=q<=4?(4-q)*900+clock:Math.min(clock,300),elapsed=q<=4?3600-secondsLeft:3600+(q-5)*300+(300-Math.min(clock,300));
   const text=m[12],lead=score.home-score.away;
   plays.push({drive:di,label:d.label,q,quarter:q<=4?`Q${q}`:`OT${q-4}`,clock:`${m[4]}:${m[5]}`,elapsed,x,offense:side,down:Number(m[6]),distance:Number(m[7]),text,
    home:score.home,away:score.away,wp:gameCastWinProbability(lead,side,100-fromOwn,secondsLeft)});
   const pts=/TOUCHDOWN/.test(text)?6:/extra point good/.test(text)?1:/field goal good/.test(text)?3:0;
   if(pts){score[side]+=pts;scored+=pts;plays.at(-1).scoring=pts}
  }
  // Reconcile anything the text doesn't spell out (two-point tries, adjustments) at the drive's end.
  const rest=(Number(d.points)||0)-scored;if(rest)score[side]+=rest;
 }
 if(!plays.length)return null;
 const final={home:g.score.home,away:g.score.away},end=Math.max(3600,plays.at(-1).elapsed+30);
 plays.push({final:true,quarter:'Final',clock:'0:00',elapsed:end,x:50,offense:null,text:'Final',home:final.home,away:final.away,wp:final.home>final.away?1:final.home<final.away?0:.5});
 let swing=null;for(let i=1;i<plays.length-1;i++){const delta=plays[i+1].wp-plays[i].wp;if(!swing||Math.abs(delta)>Math.abs(swing.delta))swing={i,delta}}
 const winner=final.home>final.away?'home':'away',winnerLow=Math.min(...plays.map(p=>winner==='home'?p.wp:1-p.wp));
 return{home:g.home.name,away:g.away.name,plays,end,final,winner,swing,winnerLow};
}
function gameCastPct(v){return`${Math.round(v*100)}%`}
// Full 3D replay data: the user's games this season keep a structured play log (universe.playLogs).
function gameCastPlayLog(g){const rows=g?.id!=null?universe.playLogs?.[g.id]:null;return Array.isArray(rows)&&rows.length&&globalThis.DynastyGameCastField?rows:null}
function gameCastFieldMeta(g,rows){
 const names={},brand=id=>globalThis.DynastyProgramBranding?.brandFor?.(id)||null;
 for(const side of ['home','away'])for(const line of g.playerStats?.[side]||[])if(line?.id!=null)names[line.id]=line.name;
 const missing=new Set();for(const r of rows)for(const id of Object.values(r.a||{}))if(typeof id==='string'&&!(id in names))missing.add(id);
 if(missing.size)for(const t of [T(g.home?.name),T(g.away?.name)])for(const p of t?.roster||[])if(missing.has(p.id))names[p.id]=p.name;
 return{names,home:{name:g.home.name,brand:brand(g.home.id)},away:{name:g.away.name,brand:brand(g.away.id)}};
}
function gameCastHTML(g){
 const m=gameCastModel(g);
 if(!m)return'<section class="watch-unavailable"><h3>Game Cast unavailable</h3><p>Game Cast needs recorded play-by-play, which is kept for games played in Game Lab or Game Day. Summary and Box Score still have the full result.</p></section>';
 const full=!!gameCastPlayLog(g);
 const W=m[m.winner],L=m[m.winner==='home'?'away':'home'],s=m.swing&&m.plays[m.swing.i],sp=s&&m.plays[m.swing.i+1];
 const swingTeam=m.swing&&(m.swing.delta>0?m.home:m.away);
 const facts=[`<li><strong>${gameEscape(W)}</strong> won ${m.final[m.winner]}–${m.final[m.winner==='home'?'away':'home']}${m.winnerLow<.25?`, rallying from as low as ${gameCastPct(m.winnerLow)} to win`:''}.</li>`];
 if(s)facts.push(`<li>Biggest swing: <strong>${gameEscape(swingTeam)} +${gameCastPct(Math.abs(m.swing.delta))}</strong> · ${gameEscape(s.quarter)} ${gameEscape(s.clock)} · ${gameEscape(s.text)}</li>`);
 const scoring=m.plays.filter(p=>p.scoring).map(p=>`<tr><td>${gameEscape(p.quarter)} ${gameEscape(p.clock)}</td><td>${gameEscape(m[p.offense])}</td><td>${gameEscape(p.text)}</td><td>${p.home+(p.offense==='home'?p.scoring:0)}–${p.away+(p.offense==='away'?p.scoring:0)}</td><td>${gameCastPct(p.wp)}</td></tr>`).join('');
 return `<section class="game-cast" data-game-cast="${gameEscape(g.id)}">
 <div class="gc-head"><div><div class="eyebrow">GAME CAST</div><h3>Win probability</h3></div><ul class="gc-facts">${facts.join('')}</ul></div>
 <div class="gc-legend"><span class="gc-key home">${gameEscape(m.home)}</span><span class="gc-key away">${gameEscape(m.away)}</span><span class="muted small">Hover the chart for any moment · click to jump the replay</span></div>
 <p class="gc-mode small muted" data-gc-mode>${full?'Full 3D replay: every snap, with players, from the saved play log.':'Position replay. Full 3D replays are kept for your team’s games this season.'}</p>
 <div class="gc-chart" data-gc-chart><div class="gc-tip" data-gc-tip hidden></div></div>
 ${full?'<div class="gc-replay gc-replay-3d" data-gcf-host></div>':`<div class="gc-replay">
  <div class="gc-board"><span class="gc-team away">${gameEscape(m.away)}</span><strong data-gc-score>0 – 0</strong><span class="gc-team home">${gameEscape(m.home)}</span></div>
  <div class="gc-field" role="img" aria-label="Field position replay"><div class="gc-endzone away"><span>${gameEscape(m.away)}</span></div><div class="gc-turf"><i style="left:10%"></i><i style="left:20%"></i><i style="left:30%"></i><i style="left:40%"></i><i class="mid" style="left:50%"></i><i style="left:60%"></i><i style="left:70%"></i><i style="left:80%"></i><i style="left:90%"></i><span class="gc-ball" data-gc-ball></span></div><div class="gc-endzone home"><span>${gameEscape(m.home)}</span></div></div>
  <div class="gc-play" data-gc-play aria-live="polite"></div>
  <div class="gc-controls"><button type="button" data-gc-toggle aria-pressed="false">▶ Play</button><input type="range" min="0" max="${m.plays.length-1}" value="0" step="1" data-gc-scrub aria-label="Replay position"><span class="small muted" data-gc-pos></span></div>
 </div>`}
 <details class="gc-table"><summary>Scoring plays table</summary><table><thead><tr><th>Time</th><th>Team</th><th>Play</th><th>Score (away–home)</th><th>${gameEscape(m.home)} win %</th></tr></thead><tbody>${scoring||'<tr><td colspan="5">No scoring plays recorded.</td></tr>'}</tbody></table></details>
 </section>`;
}
function bindGameCast(){
 const root=document.querySelector('[data-game-cast]');if(!root)return;
 const g=(universe.gameArchive||[]).find(x=>x.id===root.dataset.gameCast),m=gameCastModel(g);if(!m)return;
 const chart=root.querySelector('[data-gc-chart]'),tip=root.querySelector('[data-gc-tip]'),scrub=root.querySelector('[data-gc-scrub]'),toggle=root.querySelector('[data-gc-toggle]'),host=root.querySelector('[data-gcf-host]');
 let current=0,timer=null,geo=null,field=null;
 const nowAt=e=>{const now=chart.querySelector('[data-gc-now]');if(now&&geo){const cx=geo.X(Math.min(e,m.end));now.setAttribute('x1',cx);now.setAttribute('x2',cx)}};
 if(host){const rows=gameCastPlayLog(g);field=rows?globalThis.DynastyGameCastField.mount(host,{rows,meta:gameCastFieldMeta(g,rows),onStep:s=>nowAt(s.elapsed)}):null}
 const draw=()=>{
  const width=Math.max(280,chart.clientWidth||640),height=width<520?180:220,pad={l:36,r:10,t:12,b:24},iw=width-pad.l-pad.r,ih=height-pad.t-pad.b;
  const X=e=>pad.l+e/m.end*iw,Y=v=>pad.t+(1-v)*ih;
  geo={X,Y,width,height,pad,iw,ih};
  const pts=m.plays.map(p=>[X(p.elapsed),Y(p.wp)]),line=pts.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(''),mid=Y(.5);
  const area=`${line}L${pts.at(-1)[0].toFixed(1)},${mid}L${pts[0][0].toFixed(1)},${mid}Z`;
  const quarters=[0,900,1800,2700,3600].filter(e=>e<=m.end).map((e,i)=>`<line x1="${X(e)}" x2="${X(e)}" y1="${pad.t}" y2="${pad.t+ih}" class="gc-grid"/>${i<4?`<text x="${X(e+450)}" y="${height-6}" class="gc-axis" text-anchor="middle">Q${i+1}</text>`:''}`).join('');
  const marks=m.plays.map((p,i)=>p.scoring?`<circle cx="${pts[i+1][0].toFixed(1)}" cy="${pts[i+1][1].toFixed(1)}" r="4" class="gc-score ${p.offense}"/>`:'').join('');
  chart.innerHTML=`<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${gameEscape(`${m.home} win probability over the game, ending ${gameCastPct(m.plays.at(-1).wp)}`)}">
   <defs><clipPath id="gcTop"><rect x="0" y="0" width="${width}" height="${mid}"/></clipPath><clipPath id="gcBottom"><rect x="0" y="${mid}" width="${width}" height="${height-mid}"/></clipPath></defs>
   ${quarters}
   <line x1="${pad.l}" x2="${pad.l+iw}" y1="${mid}" y2="${mid}" class="gc-mid"/>
   <text x="${pad.l-6}" y="${Y(1)+4}" class="gc-axis" text-anchor="end">100%</text><text x="${pad.l-6}" y="${mid+4}" class="gc-axis" text-anchor="end">50%</text><text x="${pad.l-6}" y="${Y(0)}" class="gc-axis" text-anchor="end">100%</text>
   <text x="${pad.l+6}" y="${Y(1)+12}" class="gc-side">▲ ${gameEscape(m.home)}</text><text x="${pad.l+6}" y="${Y(0)-6}" class="gc-side">▼ ${gameEscape(m.away)}</text>
   <path d="${area}" class="gc-area home" clip-path="url(#gcTop)"/><path d="${area}" class="gc-area away" clip-path="url(#gcBottom)"/>
   <path d="${line}" class="gc-line"/>${marks}
   <line class="gc-cross" data-gc-cross x1="0" x2="0" y1="${pad.t}" y2="${pad.t+ih}" visibility="hidden"/><circle class="gc-dot" data-gc-dot r="5" visibility="hidden"/>
   <line class="gc-now" data-gc-now x1="0" x2="0" y1="${pad.t}" y2="${pad.t+ih}"/>
   <rect x="${pad.l}" y="${pad.t}" width="${iw}" height="${ih}" fill="transparent" data-gc-hit/>
  </svg>`+tip.outerHTML;
  const hit=chart.querySelector('[data-gc-hit]'),newTip=chart.querySelector('[data-gc-tip]');
  const nearest=ev=>{const r=hit.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*iw+pad.l;let best=0;for(let i=0;i<m.plays.length;i++)if(Math.abs(X(m.plays[i].elapsed)-x)<Math.abs(X(m.plays[best].elapsed)-x))best=i;return best};
  hit.addEventListener('mousemove',ev=>{const i=nearest(ev),p=m.plays[i],cx=X(p.elapsed),cy=Y(p.wp),cross=chart.querySelector('[data-gc-cross]'),dot=chart.querySelector('[data-gc-dot]');
   cross.setAttribute('x1',cx);cross.setAttribute('x2',cx);cross.setAttribute('visibility','visible');dot.setAttribute('cx',cx);dot.setAttribute('cy',cy);dot.setAttribute('visibility','visible');
   const leader=p.wp>=.5?m.home:m.away;
   newTip.innerHTML=`<strong>${gameEscape(p.quarter)} ${gameEscape(p.clock)}</strong><span>${gameEscape(m.away)} ${p.away} – ${p.home} ${gameEscape(m.home)}</span>${p.final?'':`<span>${p.down}${['','st','nd','rd','th'][p.down]} & ${p.distance} · ${gameEscape(m[p.offense])} ball</span>`}<span>${gameEscape(p.text)}</span><span><b>${gameEscape(leader)} ${gameCastPct(Math.max(p.wp,1-p.wp))}</b> to win</span>`;
   newTip.hidden=false;const left=Math.min(Math.max(cx+12,0),width-230);newTip.style.left=`${left}px`;newTip.style.top=`${Math.max(0,cy-40)}px`});
  hit.addEventListener('mouseleave',()=>{chart.querySelector('[data-gc-cross]').setAttribute('visibility','hidden');chart.querySelector('[data-gc-dot]').setAttribute('visibility','hidden');newTip.hidden=true});
  hit.addEventListener('click',ev=>{stop();show(nearest(ev))});
  if(host)nowAt(field?field.timeline.steps[field.state.step]?.elapsed||0:0);else show(current);
 };
 const show=i=>{
  current=Math.max(0,Math.min(m.plays.length-1,i));const p=m.plays[current];
  // Full replay: a click on the chart jumps the 3D field to that moment.
  if(host){if(field){if(p.final)field.seek(field.timeline.steps.length-1);else field.seekElapsed(p.elapsed)}return}
  scrub.value=String(current);
  root.querySelector('[data-gc-score]').textContent=`${p.away} – ${p.home}`;
  const ball=root.querySelector('[data-gc-ball]');ball.style.left=`${p.x}%`;ball.dataset.offense=p.offense||'';ball.textContent=p.offense==='away'?'▶':p.offense==='home'?'◀':'●';
  root.querySelector('[data-gc-play]').innerHTML=p.final?`<strong>Final</strong> · ${gameEscape(m[m.winner])} win`:`<strong>${gameEscape(p.quarter)} ${gameEscape(p.clock)}</strong> · ${p.down}${['','st','nd','rd','th'][p.down]} & ${p.distance} · ${gameEscape(p.text)}`;
  root.querySelector('[data-gc-pos]').textContent=`Play ${current+1} of ${m.plays.length}`;
  const now=chart.querySelector('[data-gc-now]');if(now&&geo){const cx=geo.X(p.elapsed);now.setAttribute('x1',cx);now.setAttribute('x2',cx)}
 };
 const stop=()=>{if(field)field.pause();if(!toggle)return;if(timer){clearInterval(timer);timer=null}toggle.textContent='▶ Play';toggle.setAttribute('aria-pressed','false')};
 if(toggle)toggle.onclick=()=>{if(timer)return stop();if(current>=m.plays.length-1)show(0);toggle.textContent='❚❚ Pause';toggle.setAttribute('aria-pressed','true');timer=setInterval(()=>{if(current>=m.plays.length-1||!document.body.contains(root))return stop();show(current+1)},650)};
 if(scrub)scrub.oninput=()=>{stop();show(Number(scrub.value))};
 const start=()=>{if(!chart.clientWidth)return requestAnimationFrame(start);draw()};start();
 if(window.ResizeObserver){const ro=new ResizeObserver(()=>{if(!document.body.contains(root))return ro.disconnect();const w=chart.clientWidth;if(w&&geo&&Math.abs(w-geo.width)>8)draw()});ro.observe(chart)}
}
globalThis.DynastyGameCast={model:gameCastModel,winProbability:gameCastWinProbability};
if(globalThis.__DL_TEST__)globalThis.__DL_TEST__.playLogKeys=()=>Object.keys(universe.playLogs||{});
