// v0.37 — the staff's conversion calls, reviewed. After a detailed game (coached or simulated) each extra point or
// two-point try the coach's staff chose in the second half is checked against a late-game chart; when the other
// choice was worth 5+ points of win chance, the box score says so ("Down 2 after the touchdown with 2:31 left, the
// staff kicked. Going for two was worth 15 points of win chance by the chart."). A call the coach made himself is
// never second-guessed.
//
// The chart. The live win-chance graph is a smooth curve and cannot tell a kick from a two-point try (they differ by
// at most 3 points anywhere in a game), so the review uses a small possession model: the other team receives, then
// the drives left (one per 145 seconds, the engine's pace) alternate, each a touchdown (22%), a field goal (13%) or
// nothing; a tie at the end is a coin flip (overtime). The kick and two-point rates are the engine's (96.5% and 47%).
// It reproduces the familiar chart: down 2, go for two; tied, kick; up 5, go for two late.
//
// Saved on the game record as conversionReview [{period, clock, margin, choice, better, gain, made}] (at most two),
// only when there is something to say. No randomness.
function makeConversionReview(){
 'use strict';
 const TD=.22,FG=.13,SECONDS_PER_DRIVE=145,KICK=.965,TWO=.47,FLAG=.05,MAX_ROWS=2,QUARTER=900;
 function drivesLeft(period,clock){if(!(period>=1&&period<=4))return 0;return Math.max(0,Math.round(((4-period)*QUARTER+(Number(clock)||0))/SECONDS_PER_DRIVE))}
 // Chance to win with `margin` (for us) and `drives` drives left, the other team going first.
 function winChance(margin,drives){
  const memo=new Map();
  const f=(m,p,ours)=>{if(p<=0)return m>0?1:m<0?0:.5;const k=`${m}|${p}|${ours}`;if(memo.has(k))return memo.get(k);const s=ours?1:-1;
   const v=TD*f(m+7*s,p-1,!ours)+FG*f(m+3*s,p-1,!ours)+(1-TD-FG)*f(m,p-1,!ours);memo.set(k,v);return v};
  return f(margin,drives,false);
 }
 // Margin is ours after the six points.
 function options(margin,drives){
  const w=x=>winChance(x,drives);
  return{kick:KICK*w(margin+1)+(1-KICK)*w(margin),two:TWO*w(margin+2)+(1-TWO)*w(margin)};
 }
 function judge(margin,period,clock,choice){
  const o=options(margin,drivesLeft(period,clock)),mine=o[choice],otherChoice=choice==='kick'?'two':'kick',gain=o[otherChoice]-mine;
  return gain>=FLAG?{better:otherChoice,gain:Math.round(gain*100)}:null;
 }
 // events: a Game Engine 2 event list. side: 'home' or 'away' (the coach's program).
 function review(events,side){
  const out=[];const list=Array.isArray(events)?events:[];
  for(let i=0;i<list.length;i++){
   const e=list[i];if(!e||e.team!==side||!['extra_point','two_point'].includes(e.type)||e.ot||e.shootout)continue;
   // The touchdown just before it gives the score after the six points and the clock.
   let td=null;for(let j=i-1;j>=0&&j>=i-6;j--){if(list[j]?.type==='touchdown'&&list[j].team===side){td=list[j];break}}
   const st=td?.state;if(!st||!(st.period>=3&&st.period<=4))continue;
   // Was it the coach's own call? A two-point decision he answered himself sits between the touchdown and the try.
   const own=list.slice(list.indexOf(td),i).some(x=>x?.type==='coaching_decision'&&x.decisionType==='two_point_decision'&&x.team===side&&x.selectedOption&&x.selectedOption!=='delegate');
   if(own)continue;
   const other=side==='home'?'away':'home',margin=(Number(st.score?.[side])||0)-(Number(st.score?.[other])||0),choice=e.type==='extra_point'?'kick':'two';
   const verdict=judge(margin,st.period,st.clock,choice);if(!verdict)continue;
   out.push({period:st.period,clock:Number(st.clock)||0,margin,choice,better:verdict.better,gain:verdict.gain,made:e.made!==false&&(Number(e.points)||0)>0});
  }
  return out.sort((a,b)=>b.gain-a.gain).slice(0,MAX_ROWS).sort((a,b)=>a.period-b.period||b.clock-a.clock);
 }
 const clockText=(period,clock)=>`${period===4?'Q4':'Q3'} ${Math.floor(clock/60)}:${String(clock%60).padStart(2,'0')}`;
 const marginText=m=>m===0?'Tied':m>0?`Up ${m}`:`Down ${-m}`;
 function text(r){
  const did=r.choice==='kick'?'kicked the extra point':'went for two',should=r.better==='two'?'Going for two':'Kicking';
  return`${clockText(r.period,r.clock)}: ${marginText(r.margin)} after the touchdown, the staff ${did}${r.choice==='two'?(r.made?' (good)':' (no good)'):''}. ${should} was worth ${r.gain} points of win chance by the chart.`;
 }
 return{TD,FG,SECONDS_PER_DRIVE,KICK,TWO,FLAG,drivesLeft,winChance,options,judge,review,text};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeConversionReview};
}else{
 const conv=makeConversionReview();
 globalThis.DynastyConversionReview=conv;
 const crEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // The two ways a detailed game is recorded each hand over their play-by-play state; finishGame writes the record.
 let pending=null;
 const preparedBeforeReview=v2RecordPrepared;
 v2RecordPrepared=function v2RecordPreparedWithReview(g,home,away){const out=preparedBeforeReview.apply(this,arguments);pending={home:home?.name,away:away?.name,events:out?.preview?.state?.events||null};return out};
 const interactiveBeforeReview=recordInteractiveV2GameDay;
 recordInteractiveV2GameDay=function recordInteractiveV2GameDayWithReview(session){
  const g=findUserGame();pending={home:g?.home,away:g?.away,events:session?.state?.events||null};
  try{return interactiveBeforeReview.apply(this,arguments)}finally{pending=null}
 };
 if(globalThis.DynastyGameEngineV2LabBridge)globalThis.DynastyGameEngineV2LabBridge.recordInteractive=recordInteractiveV2GameDay;
 const finishGameBeforeReview=finishGame;
 finishGame=function finishGameWithReview(before,home,away){
  const out=finishGameBeforeReview.apply(this,arguments);
  try{
   const p=pending;pending=null;
   const me=selected();
   if(p&&p.events&&me&&p.home===home?.name&&p.away===away?.name&&(home.id===me.id||away.id===me.id)){
    const rows=conv.review(p.events,home.id===me.id?'home':'away');
    const record=rows.length&&out?.gameId?(universe.gameArchive||[]).find(x=>x.id===out.gameId):null;
    if(record)record.conversionReview=rows;
   }
  }catch(err){console.error(err)}
  return out;
 };
 // The box score says it under the team statistics.
 const gameBoxBeforeReview=gameBoxHTML;
 gameBoxHTML=function gameBoxWithReview(g){
  const html=gameBoxBeforeReview.apply(this,arguments);
  const rows=Array.isArray(g?.conversionReview)?g.conversionReview:[];if(!rows.length)return html;
  return html+`<div class="conversion-review"><div class="eyebrow">STAFF CALLS, REVIEWED</div><ul>${rows.map(r=>`<li>${crEsc(conv.text(r))}</li>`).join('')}</ul></div>`;
 };
}
