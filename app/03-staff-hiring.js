// app/03-staff-hiring.js: Staff budgets, coaching candidates, openings and hires. Part of app.js; see tools/app-source.js.
// v0.9.6: coaching market. AI teams still auto-fill instantly (unchanged carousel behavior);
// only the controlled team's vacancies become an Opening the user works through.
function teamStaffBaseline(t){return ['Head Coach','Offensive Coordinator','Defensive Coordinator','Recruiting Coordinator','Strength & Performance'].reduce((s,role)=>s+(0.35+t.resources/35+t.prestige/45+(role==='Head Coach'?2.4:role.includes('Coordinator')?0.9:0)),0)}
function teamStaffBudget(t){return Math.round(teamStaffBaseline(t)*1.15*10)/10}
function teamStaffSpend(t){return Math.round(Object.values(t.staff||{}).reduce((s,c)=>s+(c.salary||0),0)*10)/10}
function candidateAskSalary(base,ambition){return Math.round(base*(0.85+(ambition||60)/500)*10)/10}
function candidateFitScore(t,slot,c){const base=c.recruiting*.22+c.development*.22+c.evaluation*.18+c.playCall*.20+c.adaptability*.18,need=slot==='RC'?t.nil*.05:slot==='HC'?t.prestige*.04:t.development*.04;return Math.round(base+need)}
function freshCandidate(t,slot){const c=generateCoach(COACH_SLOT_ROLES[slot],t,gi(0,9));return {candidateId:`CAND_${c.id}`,source:'fresh',coachId:null,name:c.name,age:c.age,recruiting:c.recruiting,development:c.development,evaluation:c.evaluation,playCall:c.playCall,adaptability:c.adaptability,ambition:c.ambition,loyalty:c.loyalty,specialties:c.specialties||coachSpecialties(c),askSalary:candidateAskSalary(c.salary,c.ambition),askYears:gi(2,5),wantsAuthority:c.ambition>=70?'full':'shared',fitScore:candidateFitScore(t,slot,c)}}
function internalCandidates(t,slot){if(slot!=='HC')return[];return ['OC','DC'].map(s=>t.staff[s]).filter(Boolean).map(c=>({candidateId:`CAND_${c.id}`,source:'internal',coachId:c.id,fromSlot:coachSlot(t,c),name:c.name,age:c.age,recruiting:c.recruiting,development:c.development,evaluation:c.evaluation,playCall:c.playCall,adaptability:c.adaptability,ambition:c.ambition,loyalty:c.loyalty,specialties:c.specialties||coachSpecialties(c),askSalary:Math.round(candidateAskSalary(c.salary,c.ambition)*1.15*10)/10,askYears:gi(3,5),wantsAuthority:'full',fitScore:candidateFitScore(t,'HC',c)+8}))}
function externalCandidates(t,slot,n=2){const eligibleRoles=slot==='HC'?['HC','OC','DC']:[slot];let pool=[];for(const other of universe.teams){if(other.id===t.id)continue;for(const [oslot,c] of Object.entries(other.staff||{})){if(!eligibleRoles.includes(oslot)||c.interim||(c.ambition||0)<58)continue;pool.push({c,other,oslot})}}pool=pool.map(x=>({...x,score:candidateFitScore(t,slot,x.c)+((x.c.ambition||60)-60)*.3+gauss()*4})).sort((a,b)=>b.score-a.score).slice(0,Math.max(n*3,6));return sample(pool,n).map(x=>{const c=x.c;return {candidateId:`CAND_${c.id}`,source:'external',coachId:c.id,fromSlot:x.oslot,fromSchoolId:x.other.id,fromSchoolName:x.other.name,name:c.name,age:c.age,recruiting:c.recruiting,development:c.development,evaluation:c.evaluation,playCall:c.playCall,adaptability:c.adaptability,ambition:c.ambition,loyalty:c.loyalty,specialties:c.specialties||coachSpecialties(c),askSalary:candidateAskSalary(c.salary,c.ambition),askYears:gi(2,4),wantsAuthority:c.ambition>=70?'full':'shared',fitScore:candidateFitScore(t,slot,c)}})}
function generateCandidatePool(t,slot){return [freshCandidate(t,slot),freshCandidate(t,slot),...internalCandidates(t,slot),...externalCandidates(t,slot,2)].map(c=>({...c,interviewed:false,status:'AVAILABLE'}))}
function createOpening(t,slot,reason,status='DEPARTED'){
 universe.openings??=[];universe.candidateMarket??={};
 const current=t.staff[slot],existing=universe.openings.find(o=>o.schoolId===t.id&&o.slot===slot&&o.status==='OPEN');
 if(current&&!current.interim){applyCoachRelationshipChange(current,t,null,reason);archiveCoach(current,t,reason,status,universe.year);addCoachEvent(status==='RETIRED'?'COACH_RETIRED':status==='FIRED'?'COACH_FIRED':'COACH_DEPARTED',current,t,null,{role:current.role,reason})}
 const interim=generateCoach(COACH_SLOT_ROLES[slot],t,0);interim.interim=true;
 for(const k of ['recruiting','development','evaluation','playCall','adaptability'])interim[k]=clamp(Math.round(interim[k]*.82),20,90);
 interim.salary=Math.round((interim.salary||1.2)*.5*10)/10;
 openCoachStint(interim,t,slot,universe.year,'Interim appointment');
 t.staff[slot]=interim;
 if(existing){existing.reason=reason;existing.seasonOpened=universe.year;existing.interimCoachId=interim.id;universe.candidateMarket[existing.id]=generateCandidatePool(t,slot);return existing}
 const id=`OPEN_${t.id}_${slot}_${universe.year}`,o={id,schoolId:t.id,schoolName:t.name,slot,role:COACH_SLOT_ROLES[slot],reason,seasonOpened:universe.year,status:'OPEN',interimCoachId:interim.id};
 universe.openings.push(o);universe.candidateMarket[id]=generateCandidatePool(t,slot);return o
}
function interviewCandidate(openingId,candidateId){const cand=(universe.candidateMarket?.[openingId]||[]).find(c=>c.candidateId===candidateId);if(!cand||cand.status!=='AVAILABLE')return null;cand.interviewed=true;return cand}
function candidateAcceptChance(cand,offer){let chance=.35+((cand.fitScore||60)-55)/140;chance+=cand.interviewed?.12:0;const salaryRatio=offer.salary/(cand.askSalary||1);chance+=clamp((salaryRatio-1)*.6,-.35,.35);if(offer.years<Math.min(2,cand.askYears||2))chance-=.15;if(offer.authority==='full'&&cand.wantsAuthority==='full')chance+=.08;if(offer.authority==='shared'&&cand.wantsAuthority==='full')chance-=.12;if(cand.source==='internal')chance+=.20;if(cand.source==='external')chance-=((cand.loyalty||60)-50)/300;return clamp(chance,.05,.95)}
function materializeCandidateCoach(t,slot,cand){const c=generateCoach(COACH_SLOT_ROLES[slot],t,gi(0,4));c.name=cand.name;c.age=cand.age;c.recruiting=cand.recruiting;c.development=cand.development;c.evaluation=cand.evaluation;c.playCall=cand.playCall;c.adaptability=cand.adaptability;c.loyalty=cand.loyalty;c.ambition=cand.ambition;c.specialties=cand.specialties;return c}
function hireCandidate(o,cand,offer){
 const t=T(o.schoolName),slot=o.slot,year=universe.year,next=year+1,interim=t.staff[slot];
 let coach=null,originTeam=null,originSlot=null;
 if(cand.source!=='fresh'){const found=coachById(cand.coachId);if(found?.active){coach=found.coach;originTeam=found.team;originSlot=found.slot}}
 if(!coach)coach=materializeCandidateCoach(t,slot,cand);
 if(interim){archiveCoach(interim,t,'Interim tenure ended','DEPARTED',year);addCoachEvent('COACH_DEPARTED',interim,t,null,{role:interim.role,reason:'Interim tenure ended'})}
 if(originTeam&&originTeam!==t){applyCoachRelationshipChange(coach,originTeam,t,'Accepted a new job');closeCoachStint(coach,originTeam,year,'Accepted a new job');originTeam.staff[originSlot]=startGeneratedCoach(originTeam,originSlot,next,'Vacancy after coach departure');addCoachEvent('COACH_DEPARTED',coach,originTeam,t,{role:COACH_SLOT_ROLES[originSlot],reason:'Hired away'},`${coach.name} leaves ${originTeam.name} to join ${t.name}.`)}else if(originTeam){closeCoachStint(coach,t,year,'Promoted internally');t.staff[originSlot]=null}
 coach.salary=offer.salary;coach.contractYears=offer.years;coach.playCallAuthority=offer.authority;
 t.staff[slot]=coach;
 openCoachStint(coach,t,slot,next,cand.source==='internal'?'Promoted internally':'Hired');
 addCoachEvent(cand.source==='internal'?'COACH_PROMOTED':'COACH_HIRED',coach,originTeam,t,{role:slot,source:cand.source,salary:offer.salary,years:offer.years,authority:offer.authority},`${t.name} hires ${coach.name} as ${COACH_SLOT_ROLES[slot]}${cand.source==='internal'?' (internal promotion)':''}.`);
 o.status='FILLED';o.filledSeason=year;o.filledCandidateId=cand.candidateId;o.hiredCoachId=coach.id;cand.status='HIRED';
 for(const other of universe.candidateMarket[o.id]||[])if(other!==cand&&other.status==='AVAILABLE')other.status='WITHDRAWN';
 applyCoachScheme(coach,slot,t,`${coach.name} hired`);
 if(cand.source==='internal')createOpening(t,cand.fromSlot,'Vacancy after internal promotion');
 return coach
}
// A new coordinator installs the system he wants to run, which starts the
// transition the roster then has to absorb.
function applyCoachScheme(coach,slot,t,reason){
 const side=SCHEME_SIDE[slot];if(!side||!coach)return null;
 ensureCoachScheme(coach,slot,t);
 return setTeamScheme(t,side,coach.preferredScheme,reason);
}
function extendOffer(openingId,candidateId,offer){
 const o=(universe.openings||[]).find(x=>x.id===openingId);if(!o||o.status!=='OPEN')return{ok:false,accepted:false,reason:'Opening is no longer available.'};
 const t=T(o.schoolName);if(!t)return{ok:false,accepted:false,reason:'Team not found.'};
 const cand=(universe.candidateMarket?.[openingId]||[]).find(c=>c.candidateId===candidateId);
 if(!cand||cand.status!=='AVAILABLE')return{ok:false,accepted:false,reason:'Candidate is no longer available.'};
 if(!cand.interviewed)return{ok:false,accepted:false,reason:'Interview the candidate before extending an offer.'};
 const salary=clamp(Math.round((+offer.salary||0)*10)/10,0.4,9.9),years=clamp(Math.round(+offer.years||1),1,6),authority=offer.authority==='full'?'full':'shared';
 const headroom=teamStaffBudget(t)-teamStaffSpend(t)+(t.staff[o.slot]?.salary||0);
 if(salary>headroom+0.05)return{ok:false,accepted:false,reason:'That salary exceeds the athletic department budget.'};
 const chance=candidateAcceptChance(cand,{salary,years,authority}),accepted=gameplayRandom()<chance;
 if(!accepted){cand.status='DECLINED';cand.declineReason=salary<cand.askSalary*.85?'Turned down the offer: salary too low.':years<2?'Turned down the offer: wanted more security.':'Turned down the offer for a different opportunity.';return{ok:true,accepted:false,reason:cand.declineReason}}
 hireCandidate(o,cand,{salary,years,authority});
 return{ok:true,accepted:true}
}
function coachOpeningHubItems(t){if(!t)return[];return (universe.openings||[]).filter(o=>o.schoolId===t.id&&o.status==='OPEN').map(o=>({type:'action',tab:'staff',kicker:'COACHING SEARCH',importance:62,main:`${o.role} opening`,sub:'Interview and hire from the candidate market on the Staff tab.'}))}
function promiseHubItems(t){return (universe.events||[]).filter(e=>e.type==='PROMISE_BROKEN'&&e.schoolIds.includes(t?.id)&&e.season>=universe.year-1).slice(-3).reverse().map(e=>({type:'bad-news',tab:'roster',player:e.playerIds[0],kicker:'PROMISE BROKEN',importance:e.importance,main:e.summary,sub:e.metadata.result}))}
// A record nobody is near is trivia. A record somebody is two hundred yards from is a storyline,
// and the wire should say so while he can still get there. Season records are only rewritten at
// year end (finalizeSeasonHonors), so through the season these are last year's marks to chase.
function recordChaseHubItems(t){
 if(!t||universe.week<2)return[];
 const out=[];
 for(const p of t.roster){
  if(p.redshirtActive)continue;
  let best=null;
  for(const [k,label] of Object.entries(RECORD_CATS)){
   const v=p.stats?.[k]||0;if(v<=0)continue;
   for(const [nat,rec] of [[true,universe.records?.nationalSeason?.[k]],[false,t.records?.[k]]]){
    if(!rec?.value)continue;
    if(rec.playerId===p.id&&rec.year===universe.year)continue;
    const broke=v>rec.value;
    if(!broke&&v<rec.value*.8)continue;
    const importance=broke?(nat?88:72):(nat?60:50);
    if(best&&best.importance>=importance)continue;
    const held=`${rec.playerName}, ${rec.year}`;
    best={type:'good-news',tab:'roster',player:p.id,importance,
     kicker:broke?(nat?'NATIONAL RECORD':'SCHOOL RECORD'):'RECORD WATCH',
     main:broke?`${p.name} passed the ${nat?'national':t.name} single-season ${label.toLowerCase()} record`
      :`${p.name} is closing on the ${nat?'national':t.name} ${label.toLowerCase()} record`,
     sub:broke?`${Math.round(v)} · previous mark ${Math.round(rec.value)} by ${held}`
      :`${Math.round(v)} of ${Math.round(rec.value)} · held by ${held}`};
   }
  }
  if(best)out.push(best);
 }
 return out.sort((a,b)=>b.importance-a.importance).slice(0,2);
}
function promiseHTML(p){const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return '<h3 style="margin-top:14px">Promises</h3>'+((p.promises||[]).map(q=>{
  const terms=q.type==='EARLY_ROLE'?`${q.expectedGames} appearances in the first season`:q.type==='DEVELOPMENT_PLAN'?`${q.expectedFocus} in both spring and fall camp`:q.type==='POSITION_LOCK'?`Keep position: ${q.targetPosition}`:q.type==='NO_REDSHIRT'?'No first-season redshirt (major injury exception)':'NIL priority recorded; not yet assessed';
  return `<div class="timeline-row"><strong>${esc(promiseLabel(q.type))} · ${esc(q.status)}</strong><div>${esc(q.status==='LEGACY'?q.notes?.[0]:q.result||terms)}</div><div class="small muted">${q.firstSeason?`First season: ${esc(q.firstSeason)} · `:''}${q.coachName?`Promised by ${esc(q.coachName)}`:''}${q.resolvedSeason?` · Assessed ${esc(q.resolvedSeason)}`:''}</div></div>`;
 }).join('')||'<div class="muted">No recruiting promises recorded.</div>');
}

function promisePenalty(p){return Math.min(30,(p.promises||[]).filter(q=>q.schoolId===p.currentSchoolId&&q.resolvedSeason>=universe.year-1).reduce((n,q)=>n+(q.transferPenalty||0),0))}
function archivePlayerSeason(p,team,year){p.seasonHistory??=[];if(p.seasonHistory.some(s=>s.year===year&&s.team===team.name))return;let s={year,team:team.name,pos:p.pos,style:p.style,eligibility:eligibilityLabel(p),rating:p.perceived,...packStats(p.stats)};p.seasonHistory.push(s);p.career??=newStats();for(const k of Object.keys(newStats()))p.career[k]=(p.career[k]||0)+(p.stats?.[k]||0)}
const PORTRAIT_VERSION=1;
function hsl2hex(h,sPct,lPct){
 const sN=sPct/100,lN=lPct/100,c=(1-Math.abs(2*lN-1))*sN,x=c*(1-Math.abs((h/60)%2-1)),m=lN-c/2;
 let r=0,g=0,b=0;
 if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}
 else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
 const to=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');
 return `#${to(r)}${to(g)}${to(b)}`;
}
function schoolColors(school){
 const id=Number(school?.id)||Math.abs(hashString(String(school?.name||'school')));
 const hue=(id*137.508)%360, band=id%4;
 const primary=hsl2hex(hue,band===3?52:58,band===1?26:31);
 const secondary=band===0?hsl2hex((hue+42)%360,68,62)
   :band===1?'#f2ede3'
   :band===2?'#c9d2d8'
   :hsl2hex((hue+168)%360,55,58);
 return {primary,secondary};
}
function hashString(str){let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))|0;return h}
function ensureSchoolColors(t){if(!t)return t;const c=schoolColors(t);t.primary??=c.primary;t.secondary??=c.secondary;return t}
// A per-load counter plus one Math.random draw: unique within a universe, and reproducible
// when Math.random is seeded (the old Date.now() prefix made seeded dynasties differ run to run).
let portraitSeedCount=0;
function portraitSeedFor(){return `p${(++portraitSeedCount).toString(36)}-${Math.floor(Math.random()*1e9).toString(36)}`}
function jerseyFor(pos,seed){
 const bands={QB:[1,19],RB:[20,49],WR:[1,19],TE:[80,89],OT:[70,79],OG:[60,69],C:[50,59],EDGE:[40,59],DT:[90,99],LB:[40,59],CB:[20,39],S:[20,39],K:[1,19],P:[1,19]};
 const [lo,hi]=bands[pos]||[1,99];let h=0,str=String(seed);
 for(let i=0;i<str.length;i++){h=(h*31+str.charCodeAt(i))>>>0}
 return lo+(h%(hi-lo+1));
}
// Real numbers by position: preferred band first, then the fallbacks a coach would reach for.
const JERSEY_BANDS={QB:[[1,19]],RB:[[20,49],[1,19]],WR:[[1,19],[80,89],[20,39]],TE:[[80,89],[40,49]],OT:[[70,79],[50,79]],OG:[[60,69],[50,79]],C:[[50,59],[50,79]],EDGE:[[40,59],[90,99],[1,39]],DT:[[90,99],[50,59]],LB:[[40,59],[1,39]],CB:[[20,39],[1,19]],S:[[20,39],[1,49]],K:[[1,49],[90,99]],P:[[1,49],[90,99]]};
// Teammates may share a number only when they never take the field together: offense, defense and specialists.
function jerseySide(pos){return ['K','P'].includes(pos)?'special':OFF_POS.has(pos)?'offense':'defense'}
// Give every player a number no teammate on the same side wears. Veterans keep theirs; a newcomer or a player whose
// number clashes moves to the next free number in his position's band (starting from his seeded number, so it is stable).
function assignTeamJerseys(t){
 if(!t?.roster?.length)return t;const used={offense:new Set(),defense:new Set(),special:new Set()};
 const order=t.roster.slice().sort((a,b)=>eligibilityBase(b)-eligibilityBase(a)||String(a.id).localeCompare(String(b.id)));
 for(const p of order){
  ensurePortrait(p);const side=used[jerseySide(p.pos)],n=Number(p.jerseyNumber);
  if(Number.isInteger(n)&&n>=0&&n<=99&&!side.has(n)){side.add(n);continue}
  let h=0;const str=String(p.portraitSeed||p.id);for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))>>>0;
  const bands=[...(JERSEY_BANDS[p.pos]||[]),[1,99],[0,0]];let got=null;
  for(const [lo,hi] of bands){const span=hi-lo+1;for(let k=0;k<span&&got==null;k++){const c=lo+((h+k)%span);if(!side.has(c))got=c}if(got!=null)break}
  if(got!=null){p.jerseyNumber=got;side.add(got)}
 }
 return t;
}
function portraitTag(p,size,frame,kind='player'){if(!p)return '';return `<canvas class="portrait portrait-${frame}" width="${size}" height="${size}" data-portrait="${p.id}" data-portrait-size="${size}" data-portrait-frame="${frame}" data-portrait-kind="${kind}" aria-label="Portrait of ${String(p.name||'player').replace(/"/g,'&quot;')}"></canvas>`}
const RECRUIT_PORTRAIT_SCHOOL={id:'recruit-neutral',name:'National Prospect',primary:'#283747',secondary:'#b8c2cf'};
function paintPortraits(scope){
 if(typeof DynastyPortraits==='undefined')return;
 const root=scope||document,nodes=[...(root.matches?.('canvas[data-portrait]')?[root]:[]),...(root.querySelectorAll?.('canvas[data-portrait]')||[])];
 for(const c of nodes){
  if(c.dataset.portraitPainted==='1')continue;
  const isRecruit=c.dataset.portraitKind==='recruit';let p=null,team=null;
  if(isRecruit){p=(universe.recruits||[]).find(r=>String(r.id)===String(c.dataset.portrait));if(!p)continue;p.portraitSeed??=`recruit-${p.id}`;p.portraitVersion??=PORTRAIT_VERSION;if(p.committed)team=T(p.committed)||null}
  else{const f=findPlayer(c.dataset.portrait);if(!f?.p)continue;p=f.p;team=f.team&&f.team.primary?f.team:null;if(!team){const nm=f.team?.name||f.p.lastTeam;if(nm)team=T(nm)||null}}
  const school=team?ensureSchoolColors(team):(isRecruit?RECRUIT_PORTRAIT_SCHOOL:schoolColors({id:0,name:p.lastTeam||'archive'}));
  const subject=isRecruit?{...p,jerseyNumber:p.jerseyNumber??jerseyFor(p.pos,p.portraitSeed)}:ensurePortrait(p);
  try{
   DynastyPortraits.renderPlayerPortrait(subject,school||{},c,{
    size:Number(c.dataset.portraitSize)||64,
    pixelRatio:Math.min(2,globalThis.devicePixelRatio||1),
    frame:c.dataset.portraitFrame||'list'
   });
   c.dataset.portraitPainted='1';
  }catch(e){c.dataset.portraitPainted='error'}
 }
}
globalThis.DynastyLabPortraits={paint:paintPortraits};
function ensurePortrait(p){if(!p)return p;p.portraitSeed??=portraitSeedFor();p.portraitVersion??=PORTRAIT_VERSION;p.jerseyNumber??=jerseyFor(p.pos,p.portraitSeed);return p}
const ARCHIVE_FIELDS=['id','name','pos','style','portraitSeed','portraitVersion','jerseyNumber','height','weight','year','eligibilityUsed','redshirtUsed','redshirtSeason','perceived','perceivedUpside','speed','power','technique','iq','health','wear','origin','recruitingMemory','primaryRecruiterCoachId','coachRelationships','transferHistory','promise','promises','staffTrust','currentSchoolId','trainingFocus','scoutConfidence','scoutingDomains','scoutingHistory','positionFamiliarity','requestedPositionChange','seasonHistory','campHistory','injuryHistory','awards'];
// v0.12.16 — measured: players who never took a snap are 30.5% of the archive and
// 27.9% of its bytes (10.6 MB at season ten). Their scouting trails, relationships
// are compacted for careers with no games. Recorded off-field events still count
// as history: keep recruitment, seasons, camps, transfers, injuries and evaluations.
// Played careers are archived exactly as before.
const ARCHIVE_SUMMARY_FIELDS=['id','name','pos','style','portraitSeed','portraitVersion','jerseyNumber','height','weight','year','eligibilityUsed','redshirtUsed','redshirtSeason','perceived','perceivedUpside','origin','promise','promises','staffTrust'];
// v0.30: two lossless trims for newly archived players. coachDeparturePressure only feeds an active player's transfer
// risk and portal choice, and nothing ever reads an archived record back into play, so it is not copied (above). The
// recruit's home coordinates are kept to four decimals (about 11 m), which every map and distance reads the same.
const ARCHIVE_COORD=1e4;
function archiveMemory(memory){
 if(!memory||typeof memory!=='object')return memory;
 const round=v=>Number.isFinite(v)?Math.round(v*ARCHIVE_COORD)/ARCHIVE_COORD:v;
 return Number.isFinite(memory.lat)||Number.isFinite(memory.lon)?{...memory,lat:round(memory.lat),lon:round(memory.lon)}:memory;
}
function archiveRecord(p,team,reason){
 const played=(p.career?.games||0)>0||(p.stats?.games||0)>0;
 if(!played){
  // Keep the keys normalizeUniverse fills in, so a summary record survives a
  // save/load round trip byte-identical instead of growing defaults on load.
  const out={lastTeam:team.name,retiredYear:universe.year,exitReason:reason,redshirtActive:false,redshirtUsed:!!p.redshirtUsed,
   injury:null,injuryWeeks:0,stats:packStats(p.stats),career:packStats(p.career),recordTier:'summary',
   awards:p.awards||[],seasonHistory:[],coachRelationships:{},primaryRecruiterCoachId:p.primaryRecruiterCoachId??null};
  for(const key of ARCHIVE_SUMMARY_FIELDS)if(p[key]!==undefined)out[key]=p[key];
  for(const key of ['recruitingMemory','seasonHistory','campHistory','transferHistory','injuryHistory','scoutingHistory','coachRelationships']){
   const value=p[key];
   if(value&&Object.keys(value).length)out[key]=value;
  }
  if(p.awards?.length)out.awards=p.awards;
  if(out.recruitingMemory)out.recruitingMemory=archiveMemory(out.recruitingMemory);
  if(p.draftResult)out.draftResult={year:p.draftResult.year,label:p.draftResult.label,round:p.draftResult.round,pick:p.draftResult.pick};
  return out;
 }
 let out={lastTeam:team.name,retiredYear:universe.year,exitReason:reason,redshirtActive:false,injury:null,injuryWeeks:0,stats:packStats(p.stats),career:packStats(p.career)};
 for(const k of ARCHIVE_FIELDS)if(p[k]!==undefined)out[k]=p[k];
 if(out.recruitingMemory)out.recruitingMemory=archiveMemory(out.recruitingMemory);
 if(p.draftResult)out.draftResult={year:p.draftResult.year,label:p.draftResult.label,round:p.draftResult.round,pick:p.draftResult.pick};
 return out;
}
function addToArchive(p,team,reason){if(reason==='Roster cut')releasePlayerPromises(p,team,'Released from the roster before the obligation could be completed.');universe.playerArchive??=[];universe.playerArchive.push(archiveRecord(p,team,reason))}
function participants(t){ensureRoleDepth(t);let out=[];for(const role of ROLE_DEFS){let p=roleStarter(t,role.id);if(p)out.push(p)}for(const [pos,n] of Object.entries({QB:2,RB:3,WR:6,TE:3,OT:4,OG:4,C:2,EDGE:4,DT:4,LB:5,CB:5,S:4,K:1,P:1}))out.push(...orderedAt(t,pos).filter(gameAvailable).slice(0,n));return [...new Map(out.map(p=>[p.id,p])).values()]}
function postGameCondition(t){for(const p of participants(t)){ensurePlayerDevelopment(p,t);const plan=weeklyPlayerPlan(p),limited=plan?.role==='limited',full=plan?.role==='full';p.scoutConfidence=clamp(p.scoutConfidence+gi(0,2),25,98);p.wear=clamp((p.wear||0)+gi(limited?1:3,limited?5:9)+(full?3:0),0,100);p.health=clamp((p.health??100)-gi(0,limited?2:3),40,100);let risk=.006+(p.wear||0)/4200+(100-(p.durability??70))/9000+(full?.012:0);if(limited)risk*=.65;risk*=gameSetting('injuryRate');if(gameplayRandom()<risk){let r=gameplayRandom(),weeks=r<.56?1:r<.82?2:r<.94?gi(3,4):gi(5,7),type=pick(INJURIES);p.injury=type;p.injuryWeeks=weeks;p.health=clamp((p.health??100)-gi(8,22),35,92);p.injuryHistory??=[];p.injuryHistory.push({year:universe.year,week:universe.week+1,type,weeks})}}}
function recoverWeek(){if(universe.recoveredWeek===universe.week)return;for(const t of universe.teams)for(const p of t.roster){if((p.injuryWeeks||0)>0){p.injuryWeeks=Math.max(0,p.injuryWeeks-1);p.health=clamp((p.health??70)+gi(7,14),35,100);if(p.injuryWeeks===0)p.injury=null}else p.health=clamp((p.health??100)+gi(2,6),40,100);p.wear=clamp((p.wear||0)-gi(3,7),0,100)}universe.recoveredWeek=universe.week}

const STATE_TALENT={TX:1.55,FL:1.50,GA:1.38,CA:1.35,OH:1.22,PA:1.17,NC:1.20,LA:1.24,AL:1.20,TN:1.14,MI:1.10,IL:1.12,NJ:1.08,VA:1.12,MD:1.10,SC:1.12,MS:1.13,AZ:1.05,MO:1.03,WA:1.03,IN:1.02,WI:1.00,NY:1.00};
const HS_WORDS=['Central','North','South','West','East','Memorial','Union','Catholic','Academy','Tech','Prep','Roosevelt','Lincoln','Jefferson','Washington'];
function haversineMiles(aLat,aLon,bLat,bLon){const R=3958.8,dLat=(bLat-aLat)*Math.PI/180,dLon=(bLon-aLon)*Math.PI/180,x=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function generateHighSchools(){let seen=new Map(),out=[],id=1;for(const s of schools){let k=`${s.city}|${s.state}`;if(!seen.has(k))seen.set(k,{city:s.city,state:s.state,lat:s.lat,lon:s.lon,region:s.conference})}for(const m of seen.values()){let n=(STATE_TALENT[m.state]||.90)>=1.2?5:3;for(let i=0;i<n;i++){let word=HS_WORDS[(i+Math.abs(Math.round(m.lat*10)))%HS_WORDS.length],name=i===0?`${m.city} Central High`:`${m.city} ${word} ${i%3===0?'Prep':'High'}`;out.push({id:`HS${id++}`,name,city:m.city,state:m.state,lat:m.lat+gauss()*.045,lon:m.lon+gauss()*.055,region:m.region,talent:(STATE_TALENT[m.state]||.90)*rng(.82,1.18),d1Signees:0})}}return out}
function weightedHighSchool(pool){let total=pool.reduce((a,h)=>a+h.talent,0),r=gameplayRandom()*total;for(const h of pool){r-=h.talent;if(r<=0)return h}return pool.at(-1)}
function assignRecruitRanks(pool){pool.sort((a,b)=>(b.scoutUp+b.scout*.55+b.trueNow*.25)-(a.scoutUp+a.scout*.55+a.trueNow*.25));let pos={},state={};pool.forEach((r,i)=>{r.nationalRank=i+1;pos[r.pos]=(pos[r.pos]||0)+1;r.positionRank=pos[r.pos];state[r.homeState]=(state[r.homeState]||0)+1;r.stateRank=state[r.homeState]});return pool}
// Per-recruit distance cache: a whole pool (2,800 recruits x 120 schools) fits, and it is
// released with the pool instead of thrashing a global size cap every week.
let distCache=new WeakMap();
function recruitDistance(t,r){let byTeam=distCache.get(r);if(!byTeam){byTeam=new Map();distCache.set(r,byTeam)}let v=byTeam.get(t.name);if(v===undefined){v=Math.round(haversineMiles(t.lat||0,t.lon||0,r.lat||0,r.lon||0));byTeam.set(t.name,v)}return v}
function distancePitch(t,r){let d=recruitDistance(t,r),importance=r.distanceImportance??50,tol=r.distanceTolerance??500;if(importance<20)return 0;if(d<=75)return importance*.11;if(d<=tol)return importance*.04*(1-d/Math.max(100,tol));return -Math.min(18,(d-tol)/150)*(importance/100)}
function recruitSchemeFit(t,r){const def=OFF_POS.has(r.pos)?OFF_SCHEMES[t.offScheme]:DEF_SCHEMES[t.defScheme];return schemeFitFor(r,def)}
function recruitSchemePriority(t,r){return clamp((recruitSchemeFit(t,r)-60)*.3,-8,12)}
// The simulation and profile use the same ordered contributions. Keep this order stable:
// changing floating-point addition order can change seeded recruiting outcomes.
function recruitPitchBreakdown(t,r){
 const items=[['Program prestige',t.prestige*.42],['NIL resources',t.nil*.16],['Development',t.development*.15],['Academics',t.academics*.06],['Facilities',t.facilities*.07],['Recruiting staff',t.staff.RC.recruiting*.10],['Head coach',t.staff.HC.recruiting*.05],['Season record',(t.w-t.l)*.7],['Pipeline',pipelineStrength(t,r.homeRegion)*.10],['Distance',distancePitch(t,r)],['Coach relationship',recruitCoachRelationshipBoost(t,r)],['NIL deal',nilDealActive(r,t)?nilDealActive(r,t).amount*3:0]];
 let priority=0;
 switch(r.priority){
  case'Prestige':priority=t.prestige*.22;break;
  case'NIL':priority=t.nil*.20;break;
  case'Development':priority=t.development*.18;break;
  case'Early Role':priority=Math.max(0,90-unitCached(t,r.pos))*.20;break;
  case'Coaching':priority=(t.staff.HC.loyalty+t.staff.RC.recruiting)*.08;break;
  case'Academics':priority=t.academics*.18;break;
  case'Scheme Fit':priority=recruitSchemePriority(t,r);break;
  case'Winning':priority=(t.w/Math.max(1,t.w+t.l))*18;break;
  case'Stay Close':priority=Math.max(-12,12-recruitDistance(t,r)/80);break;
  case'Campus Life':priority=(t.fan_support+t.facilities)*.06;break;
 }
 items.push([`${r.priority} priority`,priority]);
 const edge=recruitingEdgeFor(t);if(edge)items.push(['Game setting',edge]);
 return items;
}
function sample(arr,n){if(arr.length<=n)return arr.slice();let seen=new Set(),out=[];while(out.length<n){let j=gi(0,arr.length-1);if(seen.has(j))continue;seen.add(j);out.push(arr[j])}return out}
