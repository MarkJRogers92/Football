// app/09-careers-bowls.js: Coaching career posts, bowls, fan support and home field. Part of app.js; see tools/app-source.js.
// Taking a post is the only thing that clears the offer list, so the run cannot silently continue
// at a school that already let you go.
function acceptPost(schoolId){
 const t=universe.teams.find(x=>x.id===schoolId);
 if(!t)return {ok:false,reason:'That job is not on the board.'};
 if(!(universe.jobOffers||[]).some(o=>o.schoolId===schoolId))return {ok:false,reason:'That job was not offered.'};
 universe.jobOffers=[];
 universe.tenure={startYear:universe.year,school:t.name,seasons:[],ended:null,closed:false};
 ensureAdminState(t);ensureNilState(t);
 t.adminConfidence=clamp(Math.round((t.admin_patience??60)*.6+30),15,95);
 t.mandate=null;
 const order=universe.nextEventId++;universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'TENURE_STARTED',importance:80,schoolIds:[t.id],playerIds:[],coachIds:[],recruitIds:[],gameIds:[],
  summary:`New post: ${t.name}.`,metadata:{schoolId:t.id,career:careerTotals()}});
 return {ok:true,team:t};
}
function careerSummaryText(){
 const c=careerTotals(),pct=(careerWinPct()*100).toFixed(1);
 return `${c.w}-${c.l} across ${c.seasons} season${c.seasons===1?'':'s'} at ${c.posts} program${c.posts===1?'':'s'} · ${pct}%`;
}
function careerHistoryHTML(){
 const rows=(universe.careerHistory||[]).slice().reverse().map(x=>
  `<div class="lineitem"><span>${x.startYear}–${x.endYear} · ${x.school}</span><strong>${x.w}-${x.l} · ${x.reason}</strong></div>`).join('');
 const tn=universe.tenure&&!universe.tenure.closed?(()=>{const r=tenureRecord();
  return `<div class="lineitem"><span>${tn.startYear}–present · ${tn.school}</span><strong>${r.w}-${r.l} · current</strong></div>`})():'';
 return (tn+rows)||'<div class="muted">No completed seasons yet.</div>';
}
function careerPostHTML(){
 const offers=universe.jobOffers||[];
 if(!offers.length)return '';
 const last=(universe.careerHistory||[])[universe.careerHistory.length-1];
 return `<div class="decision-card"><div class="decision-kicker">CAREER</div>
  <div class="decision-title">Your tenure at ${last?.school||'your program'} is over</div>
  <div class="decision-summary">${last?`${last.w}-${last.l} across ${last.seasons} season${last.seasons===1?'':'s'}. `:''}Career: ${careerSummaryText()}. These programs will have you.</div>
  <div class="decision-options">${offers.map(o=>
   `<button class="decision-option" data-post="${o.schoolId}"><strong>${o.name}</strong><small>${o.why}</small></button>`).join('')}</div></div>`;
}
function renderCareerPost(){
 const el=$('#careerPost');if(!el)return;
 el.innerHTML=careerPostHTML();
 $$('[data-post]').forEach(b=>b.onclick=()=>{
  const r=acceptPost(+b.dataset.post);
  if(!r.ok){setStatus(r.reason);return}
  $('#userTeam').value=r.team.name;
  setStatus(`Took the ${r.team.name} job. ${careerSummaryText()}.`);
  render();
 });
}
function careerHubItems(t){
 if(!(universe.jobOffers||[]).length)return[];
 return [{type:'action',tab:'program',importance:95,kicker:'CAREER',
  main:'Your tenure is over — choose your next post',
  sub:`${(universe.jobOffers||[]).length} programs will have you · ${careerSummaryText()}`}];
}
// Bowl season. Before this, the phase machine ran regular -> confReady -> playoffReady -> complete,
// so roughly 112 of 120 programs simply stopped playing. Six wins now earns a game, which gives a
// mediocre team something to chase in weeks nine through twelve.
const BOWL_NAMES=['Sunbelt','Liberty','Heritage','Frontier','Gateway','Coastal','Prairie','Summit','Cascade','Delta','Keystone','Ironwood'];
function bowlEligible(t){return (t.w||0)>=6}
function bowlField(){
 const inPlayoff=new Set(seedField().map(t=>t.id));
 return ranked().filter(t=>bowlEligible(t)&&!inPlayoff.has(t.id));
}
function bowlNameFor(i){return `${BOWL_NAMES[i%BOWL_NAMES.length]} Bowl`}
// Paired best-against-best down the rankings, which keeps the matchups sensible without a
// selection-committee model nobody would see.
function simBowls(){
 if(universe.phase!=='bowlReady')return [];
 const field=bowlField(),logs=[],archiveStart=(universe.gameArchive||[]).length;
 universe.bowls=[];
 for(let i=0;i+1<field.length;i+=2){
  const a=field[i],b=field[i+1],label=bowlNameFor(i/2);
  const r=gameSim(a,b,true,false,{week:13,label});
  const w=T(r.winner),l=w===a?b:a;
  universe.bowls.push({label,winner:w.name,loser:l.name,score:[r.ap,r.hp],gameId:r.gameId});
  logs.push({...r,label});
  w.bowlResult={label,won:true,year:universe.year};l.bowlResult={label,won:false,year:universe.year};
  // Bowl practices are real development time, and a win is worth something to the fanbase.
  w.fan_support=clamp((w.fan_support||60)+2,0,100);
  l.fan_support=clamp((l.fan_support||60)+1,0,100);
  const order=universe.nextEventId++;universe.events??=[];
  universe.events.push({id:`EVT_${order}`,season:universe.year,week:13,timestampOrder:order,
   type:'BOWL_RESULT',importance:58,schoolIds:[w.id,l.id],playerIds:[],coachIds:[],recruitIds:[],
   gameIds:r.gameId?[r.gameId]:[],summary:`${w.name} wins the ${label}.`,metadata:{label,winnerId:w.id}});
 }
 universe.phase='playoffReady';
 if(universe.latest)universe.latest=logs.length?logs:universe.latest;
 announceUserPostseason(archiveStart);
 ranked();buildWeeklyHub();render();
 return logs;
}
function bowlHubItems(t){
 if(!t)return[];
 const b=t.bowlResult;
 if(b&&b.year===universe.year)return [{type:b.won?'good-news':'bad-news',tab:'season',importance:b.won?66:60,
  kicker:'BOWL',main:b.won?`${t.name} wins the ${b.label}`:`${t.name} falls in the ${b.label}`,
  sub:`${t.w}-${t.l} on the season`}];
 // Six wins is the bar, and it is worth naming while it can still be reached.
 if(universe.phase==='regular'&&universe.week>=6&&!bowlEligible(t)){
  const left=12-((t.w||0)+(t.l||0)),need=6-(t.w||0);
  if(need>0&&need<=left)return [{type:'action',tab:'season',importance:54,
   kicker:'BOWL WATCH',main:`${need} more win${need===1?'':'s'} for bowl eligibility`,
   sub:`${t.w}-${t.l} with ${left} to play`}];
 }
 return [];
}
// Fan support was a static number feeding one recruiting pitch. It now answers to results and
// decays back toward the program's own baseline, so a single good year is not permanent.
function fanSupportTarget(t){
 const exp=seasonExpectation(t),diff=(t.w||0)-exp,base=t.fanBaseline??t.fan_support??60;
 return clamp(base+diff*4+(t.champ?6:0)+(universe.champion===t.name?10:0)+(t.bowlResult?.year===universe.year&&t.bowlResult.won?3:0),5,100);
}
function updateFanSupport(t){
 if(!t)return;
 t.fanBaseline??=t.fan_support??60;
 t.fan_support=clamp(Math.round((t.fan_support??60)*.6+fanSupportTarget(t)*.4),5,100);
}
// A full house is worth something. This was a flat 2.2 for every program in the country.
function homeFieldFor(t){return clamp(2.2+(((t?.fan_support??60)-60)*.03),.8,3.4)}
// Keep quick-sim score changes in football-sized increments while matching homeFieldFor() in expectation.
function homeFieldScoreBonus(t,neutral=false){
 if(neutral)return 0;
 const edge=homeFieldFor(t),base=Math.floor(edge/3)*3,remainder=edge-base;
 return base+(remainder>0&&gameplayRandom()<remainder/3?3:0);
}
// Signing day. Wavering commitments — the ones already carrying a challenger and a pressure score —
// used to survive to signing day untouched, so the drama the engine had modelled all season simply
// evaporated. They now get one last resolution, and the player watches it land one name at a time.
//
// Everything is decided up front and stored; revealing is pure presentation. That matters because
// re-rolling on reveal would make the outcome depend on how fast someone clicks.
function signingDayOdds(r){
 // pressure is the challenger's pitch minus the hold, so it is already the right axis.
 const p=r.pressure||0,loyalty=(r.relationship||50)*.10,promise=r.signedPromise?8:0;
 return clamp(.06+(p+12)*.022-loyalty*.01-promise*.01,.02,.62);
}
function buildSigningDay(){
 const board=[],wavering=universe.recruits
  .filter(r=>r.committed&&r.challenger&&r.challenger!==r.committed&&(r.pressure||0)>-14)
  .sort((a,b)=>(b.pressure||0)-(a.pressure||0)||b.stars-a.stars)
  .slice(0,12);
 for(const r of wavering){
  const from=r.committed,to=r.challenger,odds=signingDayOdds(r),flips=gameplayRandom()<odds&&canTakeCommit(to);
  const entry={recruitId:r.id,name:r.name,pos:r.pos,stars:r.stars,from,challenger:to,
   pressure:r.pressure||0,odds:Math.round(odds*100),flipped:false};
  if(flips&&decommitRecruit(r,'SIGNING_DAY_FLIP')){
   if(commitRecruit(r,to)){
    entry.flipped=true;
    universe.decommitLog[universe.decommitLog.length-1].to=to;
   } else if(!commitRecruit(r,from)){
    // commitRecruit(r,from) can itself fail (a cap or block reached between the roll and
    // now) — the original school always has to take him back, since he was already
    // occupying that scholarship a moment ago. Restore directly rather than strand him.
    r.committed=from;r.commitWeek=universe.week;r.challenger=null;r.pressure=0;
    universe.recruitClassCounts[from]=classCommitCount(from)+1;
    const ft=T(from);if(ft){ft.commits??=[];ft.commits.push(r)}
   }
  }
  board.push(entry);
 }
 universe.signingDay={year:universe.year,board,revealed:0};
 if(board.length){
  const order=universe.nextEventId++;universe.events??=[];
  universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
   type:'SIGNING_DAY',importance:72,schoolIds:[],playerIds:[],coachIds:[],
   recruitIds:board.map(x=>x.recruitId),gameIds:[],
   summary:`Signing day: ${board.filter(x=>x.flipped).length} of ${board.length} contested commitments flipped.`,
   metadata:{contested:board.length,flipped:board.filter(x=>x.flipped).length}});
 }
 return universe.signingDay;
}
function signingDayPending(){const s=universe.signingDay;return s&&s.year===universe.year?Math.max(0,s.board.length-s.revealed):0}
function revealNextSigning(){
 const s=universe.signingDay;
 if(!s||s.year!==universe.year||s.revealed>=s.board.length)return null;
 return s.board[s.revealed++];
}
function revealAllSigning(){const s=universe.signingDay;if(!s)return[];const rest=s.board.slice(s.revealed);s.revealed=s.board.length;return rest}
function signingDayHTML(){
 const s=universe.signingDay,u=selected();
 if(!s||s.year!==universe.year||!s.board.length)return '';
 const mine=x=>x.from===u?.name||x.challenger===u?.name;
 const rows=s.board.slice(0,s.revealed).map(x=>{
  const good=(x.flipped&&x.challenger===u?.name)||(!x.flipped&&x.from===u?.name);
  const tone=mine(x)?(good?'good':'bad'):'muted';
  return `<div class="lineitem signing-row signing-${tone}">
   <span>${'★'.repeat(x.stars)} ${x.pos} ${x.name}</span>
   <strong>${x.flipped?`flips to ${x.challenger}`:`stays with ${x.from}`}</strong></div>`;
 }).join('');
 const left=signingDayPending();
 return `<div class="decision-card"><div class="decision-kicker">SIGNING DAY</div>
  <div class="decision-title">${s.board.length} contested commitment${s.board.length===1?'':'s'}</div>
  <div class="decision-summary">${left?`${left} still to announce.`:`All ${s.board.length} announced — ${s.board.filter(x=>x.flipped).length} flipped.`}</div>
  <div class="signing-board">${rows||'<div class="muted">Nothing announced yet.</div>'}</div>
  ${left?`<div class="decision-options"><button class="decision-option" data-signing="next"><strong>Announce the next name</strong></button><button class="decision-option" data-signing="all"><strong>Announce the rest</strong></button></div>`:''}</div>`;
}
function renderSigningDay(){
 const el=$('#signingDay');if(!el)return;
 el.innerHTML=signingDayHTML();
 $$('[data-signing]').forEach(b=>b.onclick=()=>{
  if(b.dataset.signing==='all')revealAllSigning();else revealNextSigning();
  renderSigningDay();
 });
}
function signingDayHubItems(){
 const left=signingDayPending();
 if(!left)return[];
 return [{type:'action',tab:'recruiting',importance:84,kicker:'SIGNING DAY',
  main:`${left} contested commitment${left===1?'':'s'} still to announce`,
  sub:'Every wavering commit gets one last decision.'}];
}
// Academic eligibility. t.academics was a recruiting weight and nothing else, so a 3-star at a
// 90-academics school was mechanically identical to one at a 55. Standing now drifts toward what
// the program and the player can sustain, and falling far enough costs you the player.
const ACADEMIC_FLOOR=30,ACADEMIC_WATCH=48;
function academicTarget(p,t,wear=p?.wear||0){
 // The program sets the support, the player's head does the rest, and a heavy season drags on both.
 return clamp(Math.round((((t?.academics??60)-50)*.5)+(((p.iq??60)-50)*.6)+55-(wear*.08)),5,99);
}
function ensureAcademics(p,t){
 if(!p)return;
 // Deterministic on purpose: this lazy default also runs when a save is loaded, and drawing from the
 // gameplay RNG there made a reloaded session diverge from an uninterrupted one (soak defect D1).
 // The spread (-9..9) and the wear-free starting target match a freshly created player.
 p.academicStanding??=clamp(academicTarget(p,t,0)+academicSeedOffset(p),5,99);
 p.academicPlan??=null;
 p.academicHold??=0;
}
function academicSeedOffset(p){return ((hashString(`academic:${p?.id??p?.name??''}`)>>>0)%19)-9}
function academicRisk(p){return (p.academicStanding??70)<ACADEMIC_WATCH}
function academicallyIneligible(p){return (p.academicHold||0)>0}
function academicStatusText(p){
 if(academicallyIneligible(p))return `Ineligible · ${p.academicHold} wk`;
 const s=p.academicStanding??70;
 return s<ACADEMIC_FLOOR?`At risk · ${s}`:s<ACADEMIC_WATCH?`Watch · ${s}`:`Clear · ${s}`;
}
// Called once a week for the controlled program's roster. Drift is slow on purpose: this should be
// a problem you see coming for a month, not a coin flip that takes a starter away on Saturday.
function advanceAcademics(t){
 if(!t)return [];
 const newHolds=[];
 for(const p of t.roster){
  ensureAcademics(p,t);
  if((p.academicHold||0)>0){p.academicHold--;if(p.academicHold===0)p.academicStanding=Math.max(p.academicStanding,ACADEMIC_FLOOR+6);continue}
  const target=academicTarget(p,t),plan=p.academicPlan?.season===universe.year&&p.academicPlan?.week===universe.week-1?p.academicPlan.id:null,
   lift=plan==='study'?6:plan==='balance'?2:0;
  p.academicStanding=clamp(Math.round(p.academicStanding+(target-p.academicStanding)*.12+lift-1),5,99);
  if(p.academicStanding<ACADEMIC_FLOOR&&!p.redshirtActive){
   p.academicHold=2;newHolds.push(p);
   const order=universe.nextEventId++;universe.events??=[];
   universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
    type:'ACADEMIC_INELIGIBLE',importance:68,schoolIds:[t.id],playerIds:[p.id],coachIds:[],recruitIds:[],
    gameIds:[],summary:`${p.name} is academically ineligible for two weeks.`,
    metadata:{standing:p.academicStanding}});
  }
 }
 return newHolds;
}
// Academic standing changes at the shared start-of-week boundary, before either a quick
// simulation or a recorded Detailed/Interactive game can choose its participants.
function advanceAcademicsForWeek(t){
 if(!t)return [];
 let progress=universe.academicProgression;
 if(!progress||progress.season!==universe.year||progress.week!==universe.week||!Array.isArray(progress.teamIds))
  progress=universe.academicProgression={season:universe.year,week:universe.week,teamIds:[]};
 if(progress.teamIds.includes(t.id))return [];
 const holds=advanceAcademics(t);progress.teamIds.push(t.id);return holds;
}
// The trade-off the Coach's Desk was missing: every option here costs something real.
function academicDecision(t,taken){
 const p=t.roster
  .filter(x=>!x.redshirtActive&&!academicallyIneligible(x)&&academicRisk(x)&&!taken.has(x.id)&&!decisionRecent('ACADEMIC_WATCH',x.id))
  .sort((a,b)=>(a.academicStanding??70)-(b.academicStanding??70))[0];
 if(!p)return null;
 return decisionRecord('ACADEMIC_WATCH',t,p.id,`${p.name} — academic standing`,
  `Standing ${p.academicStanding} against a ${ACADEMIC_FLOOR} floor. ${t.academics>=75?'Academic support here is strong':t.academics<=45?'Academic support here is thin':'Academic support here is ordinary'} (${t.academics}). Below the floor he sits two weeks.`,
  [decisionOption('study','Study table','Six points of standing a week. He loses practice reps and some scheme familiarity.'),
   decisionOption('balance','Split the week','Two points a week and a smaller practice cost.',true),
   decisionOption('practice','Keep him at practice','No academic help. Standing keeps drifting toward what the program supports.')],
  {playerId:p.id},88);
}
function applyAcademicDecision(p,t,optionId){
 if(!p)return;
 p.academicPlan={id:optionId,season:universe.year,week:universe.week};
 const cost=n=>{ensurePlayerDevelopment(p);p.positionFamiliarity??={};p.positionFamiliarity[p.pos]=clamp(familiarity(p,p.pos)-n,0,100)};
 if(optionId==='study'){p.academicStanding=clamp((p.academicStanding??70)+6,5,99);cost(6)}
 else if(optionId==='balance'){p.academicStanding=clamp((p.academicStanding??70)+2,5,99);cost(2)}
}
function academicHubItems(t){
 if(!t)return[];
 const out=[],held=t.roster.filter(p=>academicallyIneligible(p));
 if(held.length)out.push({type:'bad-news',tab:'roster',player:held[0].id,importance:74,
  kicker:'ACADEMICS',main:held.length===1?`${held[0].name} is academically ineligible`:`${held.length} players academically ineligible`,
  sub:`${held[0].pos} ${held[0].name} sits ${held[0].academicHold} more week${held[0].academicHold===1?'':'s'}`});
 else {
  const risk=t.roster.filter(p=>!p.redshirtActive&&academicRisk(p)).sort((a,b)=>(a.academicStanding??70)-(b.academicStanding??70))[0];
  if(risk)out.push({type:'alert',tab:'roster',player:risk.id,importance:56,
   kicker:'ACADEMIC WATCH',main:`${risk.name} is close to the floor`,
   sub:`Standing ${risk.academicStanding} · ${ACADEMIC_FLOOR} is ineligibility`});
 }
 return out;
}
// The coaching tree. Career stints and the coach archive already recorded everything needed; nothing
// showed where the people who worked for you ended up. A program that produces head coaches should
// get credit for it, because that is what recruits and candidates hear about.
function allKnownCoaches(){
 const seen=new Map();
 for(const t of universe.teams||[])for(const c of Object.values(t.staff||{}))if(c?.id)seen.set(c.id,c);
 for(const c of universe.coachArchive||[])if(c?.id&&!seen.has(c.id))seen.set(c.id,c);
 return [...seen.values()];
}
// A branch is someone who worked for you in any role and later held a job somewhere else. The
// "later" matters: a coach who was a head coach elsewhere first and then joined your staff is not
// something your program produced.
function coachingTree(t){
 if(!t)return [];
 const out=[];
 for(const c of allKnownCoaches()){
  const hist=(c.careerHistory||[]).filter(s=>s.schoolId!=null);
  const here=hist.filter(s=>s.schoolId===t.id).sort((a,b)=>a.startSeason-b.startSeason)[0];
  if(!here)continue;
  const after=hist.filter(s=>s.schoolId!==t.id&&s.startSeason>=(here.endSeason??here.startSeason))
   .sort((a,b)=>a.startSeason-b.startSeason);
  if(!after.length)continue;
  const hc=after.find(s=>s.role==='Head Coach')||null;
  const now=after[after.length-1];
  out.push({coachId:c.id,name:c.name,under:{role:here.role,startSeason:here.startSeason,endSeason:here.endSeason},
   headCoach:hc?{schoolName:hc.schoolName,startSeason:hc.startSeason}:null,
   latest:{schoolName:now.schoolName,role:now.role,startSeason:now.startSeason},
   totals:coachCareerTotals(c)});
 }
 return out.sort((a,b)=>(b.headCoach?1:0)-(a.headCoach?1:0)||b.under.startSeason-a.under.startSeason);
}
function treeHeadCoaches(t){return coachingTree(t).filter(x=>x.headCoach)}
// Credited once per coach, so a long-tenured branch does not pay out every season forever.
function creditCoachingTree(t){
 if(!t)return 0;
 t.coachTreeCredited??=[];
 const fresh=treeHeadCoaches(t).filter(x=>!t.coachTreeCredited.includes(x.coachId));
 if(!fresh.length)return 0;
 const gain=Math.min(2,fresh.length);
 for(const x of fresh)t.coachTreeCredited.push(x.coachId);
 t.prestige=clamp((t.prestige||60)+gain,10,t.program_ceiling??100);
 const order=universe.nextEventId++;universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'COACH_TREE',importance:64,schoolIds:[t.id],playerIds:[],coachIds:fresh.map(x=>x.coachId),
  recruitIds:[],gameIds:[],
  summary:`${fresh.map(x=>x.name).join(', ')} now running ${fresh.length===1?'a program':'programs'} of their own.`,
  metadata:{gain,coaches:fresh.map(x=>({id:x.coachId,name:x.name,school:x.headCoach?.schoolName}))}});
 return gain;
}
function coachingTreeHTML(t){
 const tree=coachingTree(t);
 if(!tree.length)return '<div class="muted">Nobody who has worked here has moved on yet.</div>';
 const hcs=tree.filter(x=>x.headCoach).length;
 const rows=tree.slice(0,12).map(x=>{
  const w=x.totals.wins,l=x.totals.losses;
  return `<div class="lineitem"><span>${x.name}<div class="small muted">${x.under.role} here, ${x.under.startSeason}${x.under.endSeason&&x.under.endSeason!==x.under.startSeason?`–${x.under.endSeason}`:''}</div></span>
   <strong>${x.headCoach?`HC · ${x.headCoach.schoolName}`:`${x.latest.role} · ${x.latest.schoolName}`}<div class="small muted">${w}-${l} career${x.totals.nationalTitles?` · ${x.totals.nationalTitles}×NC`:''}</div></strong></div>`;
 }).join('');
 return `<div class="muted" style="margin-bottom:8px">${hcs} head coach${hcs===1?'':'es'} produced · ${tree.length} former staff placed elsewhere.</div>${rows}`;
}
function coachTreeHubItems(t){
 if(!t)return[];
 const recent=treeHeadCoaches(t).filter(x=>x.headCoach.startSeason>=universe.year-1);
 if(!recent.length)return[];
 const x=recent[0];
 return [{type:'good-news',tab:'staff',importance:62,kicker:'COACHING TREE',
  main:`${x.name} is a head coach at ${x.headCoach.schoolName}`,
  sub:`${x.under.role} here in ${x.under.startSeason} · ${recent.length} produced in the last two years`}];
}
// Program history. Nothing tracked an all-time record for any of the 120 programs — t.w/t.l reset
// every season and nothing archived it. Tracking begins now, additively, from this version forward;
// a program's history before this release is not retroactively known, and the page says so.
function ensureAllTimeRecord(t){
 if(!t)return null;
 t.allTimeRecord??={w:0,l:0,confTitles:0,natTitles:0,seasons:0};
 return t.allTimeRecord;
}
function recordSeasonInHistory(t,w,l,wonConf,wonNational){
 const r=ensureAllTimeRecord(t);
 r.w+=w;r.l+=l;r.seasons++;
 if(wonConf)r.confTitles++;
 if(wonNational)r.natTitles++;
}
