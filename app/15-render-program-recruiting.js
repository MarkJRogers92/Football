// app/15-render-program-recruiting.js: Recruiting board, program, development and offseason rendering. Part of app.js; see tools/app-source.js.
// v0.9.12: the recruiting board is long, so its headers sort it. Ascending on
// first click, descending on the second, and the whole pool is ordered before
// the visible slice is taken so sorting surfaces the real leaders.
let recruitSort={key:'rank',dir:1};
const RECRUIT_SORTS={
 name:r=>String(r.name||'').toLowerCase(),
 pos:r=>POS.indexOf(r.pos),
 rank:r=>r.nationalRank??9999,
 stars:r=>r.stars||0,
 home:r=>`${r.homeState||''} ${r.homeCity||''}`.toLowerCase(),
 miles:r=>recruitDistance(selected(),r),
 priority:r=>String(r.priority||'').toLowerCase(),
 scout:r=>r.scoutUp||0,
 interest:r=>r.interest||0,
 trend:r=>r.trend||0,
 leader:r=>String(r.leader||'~').toLowerCase(),
};
// Columns where the interesting end is the top: start them descending so the
// first click shows the best, and the arrow still tells the truth.
const RECRUIT_DESC=new Set(['stars','scout','interest','trend']);
function sortRecruits(list){
 const pick=RECRUIT_SORTS[recruitSort.key]||RECRUIT_SORTS.rank;
 return list.slice().sort((a,b)=>{
  const x=pick(a),y=pick(b);
  const cmp=typeof x==='string'?x.localeCompare(y):(x-y);
  // Ties always fall back to national rank, never reversed.
  return (cmp*recruitSort.dir)||((a.nationalRank??9999)-(b.nationalRank??9999));
 });
}
function attachRecruitSort(){
 $$('#recruiting th.sortable').forEach(th=>{
  const key=th.dataset.sort,active=recruitSort.key===key;
  th.setAttribute('aria-sort',active?(recruitSort.dir>0?'ascending':'descending'):'none');
  th.classList.toggle('sorted',active);
  th.dataset.dir=active?(recruitSort.dir>0?'asc':'desc'):'';
  th.onclick=()=>{
   recruitSort=recruitSort.key===key?{key,dir:-recruitSort.dir}:{key,dir:RECRUIT_DESC.has(key)?-1:1};
   renderRecruiting();
  };
 });
}
function renderRecruitingBoard(){renderSigningDay();const u=selected(),rank=recruitingClassRank(u);const sch=scholarshipSummary(u),bestPipeline=Object.entries(u.pipelines||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]||u.conference;
 $('#classSummary').innerHTML=`<strong>${rank?'#'+rank:'Unranked'} recruiting class</strong> · <strong class="${sch.over?'bad':sch.room?'':'warn'}">${sch.committed}/${sch.capacity} scholarships</strong> ${sch.over?`· <span class="bad">${sch.over} over the limit — offers will be pulled on signing day</span>`:`· ${sch.room} spot${sch.room===1?'':'s'} left`} · ${u.commits.length} commitments · ${universe.recruits.filter(r=>r.targeted&&!r.committed).length} active targets · ${universe.recruits.filter(r=>r.committed===u.name&&r.stars>=4).length} blue chips · Best pipeline: ${esc(bestPipeline)}`;$('#classSummary').innerHTML+='<div class="small muted">Promises are assessed when the player’s first offseason is finalized. Early Role: 8 appearances, adjusted for injury. Development Plan: Technique in both camps. NIL Priority is recorded only.</div>';renderRecruitBattles();$('#recruitBody').innerHTML=sortRecruits(universe.recruits).slice(0,220).map(r=>{let tr=r.trend||0,trend=tr>0?`<span class="trend-up">↑ ${tr}</span>`:tr<0?`<span class="trend-down">↓ ${Math.abs(tr)}</span>`:'<span class="trend-flat">—</span>';return `<tr class="${r.targeted?'target':''}"><td data-label="Player"><div class="player-cell">${portraitTag(r,64,'list','recruit')}<div class="player-cell-text"><button class="player-button" data-recruit="${r.id}">${r.name}</button><div class="small muted">${r.style}</div></div></div></td><td data-label="Pos">${r.pos}</td><td data-label="Rank">#${r.nationalRank}<div class="small muted">#${r.positionRank} ${r.pos}</div></td><td data-label="Stars"><span class="stars">${'★'.repeat(r.stars)}</span></td><td data-label="Hometown / HS">${r.homeCity}, ${r.homeState}<div class="small muted">${r.highSchool}</div></td><td data-label="Miles">${recruitDistance(u,r)}</td><td data-label="Priority">${r.priority}</td><td data-label="Scout">${grade(r.scout)} / ${grade(r.scoutUp)}</td><td data-label="Interest">${r.committed?(r.committed===u.name?(r.challenger?`<span class="pill pill--wavering">WAVERING</span>`:'<span class="pill pill--commit">COMMITTED</span>'):`<span class="muted">Committed</span><div class="small muted">${r.committed}</div>`):`<strong class="interest-val">${r.interest}%</strong>`}</td><td data-label="Trend">${trend}</td><td data-label="Leader">${r.leader||'—'}</td><td data-label="Visit">${r.committed===u.name?'—':`<button data-visit="${r.id}">${r.visitWeek?'Wk '+r.visitWeek:'Schedule'}</button>`}</td><td data-label="Promise">${r.committed?(r.committed===u.name?(r.signedPromise?promiseLabel(r.signedPromise.type):'None'):'—'):`<select data-promise="${r.id}">${PROMISES.map(x=>`<option ${x===(r.promiseOffer?.schoolId===u.id?r.promise:'None')?'selected':''}>${x}</option>`).join('')}</select>`}</td><td data-label="Target">${r.committed===u.name?`<button class="pull-offer" data-pull="${r.id}">Pull offer</button>`:`<button data-target="${r.id}">${r.targeted?'Remove':'Target'}</button>`}</td></tr>`}).join('');$$('[data-target]').forEach(b=>b.onclick=()=>{let r=universe.recruits.find(x=>x.id===b.dataset.target);r.targeted=!r.targeted;if(r.targeted)firstRecruitEvaluation(r,u);renderRecruiting()});$$('[data-visit]').forEach(b=>b.onclick=()=>{let r=universe.recruits.find(x=>x.id===b.dataset.visit);scheduleVisit(r);renderRecruiting()});
 $$('[data-pull]').forEach(b=>b.onclick=()=>{const r=universe.recruits.find(x=>x.id===b.dataset.pull);if(!r)return;
  if(!confirm(`Pull the offer to ${r.name}?\n\nHe reopens his recruitment, will not consider ${u.name} again, and the ${r.homeRegion||'local'} pipeline takes a hit.`))return;
  if(pullOffer(r,u.name,'Pulled by the staff')){setStatus(`Offer pulled: ${r.name} is no longer committed.`);render()}});$$('[data-promise]').forEach(s=>s.onchange=()=>{let r=universe.recruits.find(x=>x.id===s.dataset.promise);setRecruitPromise(r,s.value,u)});attachRecruitLinks()}
// Dynasty Mode locks institutional editing, so show the attributes as facts; the editable form is
// for Commissioner Mode only.
function renderProgramAttributes(u){
 const host=$('#programAttributes');if(!host)return;
 const rows=[['Prestige',u.prestige],['Resources',u.resources],['NIL',u.nil],['Development',u.development],['Facilities',u.facilities],['Academics',u.academics]];
 host.innerHTML=`<div class="eyebrow">PROGRAM ATTRIBUTES</div><div class="program-attrs">${rows.map(([k,v])=>`<div class="program-attr"><span>${k}</span><strong>${v}</strong></div>`).join('')}</div>`;
}
// Wins against what the administration expected, with its confidence as a line: direction at a
// glance, from the tenure records the game already keeps (no extra save data).
function programTrendsHTML(){
 const rows=(universe.tenure?.seasons||[]).slice(-10);
 const head='<div class="eyebrow">THIS TENURE</div><h3>Season by season</h3>';
 if(rows.length<2)return `${head}<div class="muted">Complete two seasons to see the trend.</div>`;
 const W=Math.max(320,rows.length*56+48),H=130,top=14,base=H-24,step=(W-40)/rows.length,barW=Math.min(30,step*.56);
 const maxWins=Math.max(12,...rows.flatMap(r=>[r.w,r.expected]).map(Number).filter(Number.isFinite));
 const y=v=>base-(base-top)*Math.min(maxWins,Math.max(0,v))/maxWins,yc=v=>base-(base-top)*Math.min(100,Math.max(0,v))/100;
 const x=i=>20+step*i+step/2;
 const bars=rows.map((r,i)=>`<rect class="trend-bar${r.champ?' is-champ':r.confChamp?' is-conf':''}" x="${(x(i)-barW/2).toFixed(1)}" y="${y(r.w).toFixed(1)}" width="${barW.toFixed(1)}" height="${(base-y(r.w)).toFixed(1)}" rx="3"><title>${r.year}: ${r.w}-${r.l}, expected ${r.expected} wins</title></rect><line class="trend-exp" x1="${(x(i)-barW/2-3).toFixed(1)}" x2="${(x(i)+barW/2+3).toFixed(1)}" y1="${y(r.expected).toFixed(1)}" y2="${y(r.expected).toFixed(1)}"/><text class="trend-label" x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="middle">${String(r.year).slice(2)}</text><text class="trend-val" x="${x(i).toFixed(1)}" y="${(y(r.w)-4).toFixed(1)}" text-anchor="middle">${r.w}</text>`).join('');
 const line=rows.map((r,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${yc(r.after).toFixed(1)}`).join(' ');
 const dots=rows.map((r,i)=>`<circle class="trend-dot" cx="${x(i).toFixed(1)}" cy="${yc(r.after).toFixed(1)}" r="3"><title>${r.year}: administration confidence ${r.after}</title></circle>`).join('');
 const summary=`Wins by season: ${rows.map(r=>`${r.year} ${r.w} (expected ${r.expected})`).join(', ')}.`;
 return `${head}<svg class="trend-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${summary}" preserveAspectRatio="xMinYMid meet">${bars}<path class="trend-line" d="${line}"/>${dots}</svg><div class="trend-key"><span><i class="k-bar"></i>Wins</span><span><i class="k-exp"></i>Expected</span><span><i class="k-line"></i>Administration confidence</span><span><i class="k-champ"></i>Conference or national title</span></div>`;
}
function renderProgram(){const u=selected();renderProgramAttributes(u);if($('#programTrends'))$('#programTrends').innerHTML=programTrendsHTML();ensureSeasonGoals(u);$('#programOverview')&&($('#programOverview').innerHTML=programOverviewHTML(u));$('#programGoals')&&($('#programGoals').innerHTML=seasonGoalsHTML(u));$('#editName').value=u.name;$('#editConference').value=u.conference;$('#editPrestige').value=u.prestige;$('#editResources').value=u.resources;$('#editNil').value=u.nil;$('#editDevelopment').value=u.development;$('#editFacilities').value=u.facilities;$('#editAcademics').value=u.academics;$('#careerHistory')&&($('#careerHistory').innerHTML=careerHistoryHTML());renderCareerPost();$('#programHistory')&&($('#programHistory').innerHTML=programHistoryHTML(selected()));$('#programDNA').innerHTML=[['Prestige',u.prestige],['Resources',u.resources],['NIL',u.nil],['Development',u.development],['Facilities',u.facilities],['Academics',u.academics],['Fan Support',u.fan_support],['Admin Patience',u.admin_patience],['Program Ceiling',u.program_ceiling],['Rivalry',u.rivalry?(rivalOf(u)?.name||'—'):'—'],['Trophy',u.rivalry?.trophy||'—'],['All-time series',rivalrySeriesText(u)||'—'],['Season expectation',seasonExpectation(u)+' wins'],['Admin confidence',(u.adminConfidence??'—')+' · '+adminConfidenceLabel(u.adminConfidence??50)],['Mandate',u.mandate?u.mandate.text:'None'],['NIL budget',nilSummaryText(u)],['Career',careerSummaryText()]].map(x=>`<div class="lineitem"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}
function applyProgramEdit(){const u=selected(),old=u.name,newName=$('#editName').value.trim()||old;if(/[<>"]/.test(newName)){alert('Program names cannot contain HTML markup or double quotes.');return}if(newName!==old&&T(newName)){alert('A program already uses that name.');return}u.name=newName;for(const [id,key] of [['editPrestige','prestige'],['editResources','resources'],['editNil','nil'],['editDevelopment','development'],['editFacilities','facilities'],['editAcademics','academics']])u[key]=clamp(parseInt($('#'+id).value||u[key],10),1,100);if(newName!==old){universe.schedule.flat().forEach(g=>{if(g.home===old)g.home=newName;if(g.away===old)g.away=newName});universe.teams.forEach(t=>t.schedule.forEach(g=>{if(g.home===old)g.home=newName;if(g.away===old)g.away=newName}));universe.recruits.forEach(r=>{if(r.leader===old)r.leader=newName;if(r.committed===old)r.committed=newName});for(const row of universe.signingDay?.board||[]){if(row.from===old)row.from=newName;if(row.challenger===old)row.challenger=newName}if(universe.recruitCycle?.signeesByTeam?.[old]!==undefined){universe.recruitCycle.signeesByTeam[newName]=universe.recruitCycle.signeesByTeam[old];delete universe.recruitCycle.signeesByTeam[old]}rebuildRecruitClassCounts();let opt=[...$('#userTeam').options].find(o=>o.value===old);if(opt){opt.value=newName;opt.textContent=newName}$('#userTeam').value=newName;rebuildIndexes()}ranked();render();setStatus('Program changes applied. Conference schedule will fully rebalance next season.')}
function renderDevelopmentResults(u,ds){const available={SPRING:ds.springReport||[],FALL:ds.fallReport||[]};if(!available[developmentResultsPhase]?.length)developmentResultsPhase=available.FALL.length?'FALL':available.SPRING.length?'SPRING':'';const report=available[developmentResultsPhase]||[];$('#developmentResults').innerHTML=developmentResultsHTML(report,u,developmentResultsFilter,developmentResultsSort);$$('[data-development-phase]').forEach(b=>{b.disabled=!available[b.dataset.developmentPhase]?.length;b.classList.toggle('active',b.dataset.developmentPhase===developmentResultsPhase);b.onclick=()=>{developmentResultsPhase=b.dataset.developmentPhase;developmentResultsFilter='ALL';renderDevelopment()}});$$('[data-development-filter]').forEach(b=>b.onclick=()=>{developmentResultsFilter=b.dataset.developmentFilter;renderDevelopment()});const sort=$('#developmentResultsSort');if(sort)sort.onchange=()=>{developmentResultsSort=sort.value;renderDevelopment()};$$('[data-development-result]').forEach(b=>b.onclick=()=>{const x=report.find(x=>x.id===b.dataset.developmentResult),p=u.roster.find(p=>p.id===b.dataset.developmentResult);$('#developmentResultDetail').innerHTML=developmentResultDetailHTML(x,p)})}
function renderDevelopmentBoard(){const u=selected(),ds=ensureDevelopmentState();ensureTeamDevelopment(u);for(const p of u.roster)ensurePlayerDevelopment(p,u);let focus=$('#teamTrainingFocus');if(focus){if(!focus.options.length)Object.keys(TEAM_TRAINING).forEach(x=>focus.add(new Option(x,x)));focus.value=u.trainingFocus;$('#trainingImpact').textContent=TEAM_TRAINING[u.trainingFocus]?.desc||''}let complete=universe.phase==='complete',os=normalizeOffseasonState();$('#runSpringCamp').disabled=!complete||os.phase!=='spring'||os.completed.includes('spring');$('#runFallCamp').disabled=!complete||os.phase!=='fall'||os.completed.includes('fall');$('#applyCampWinners').disabled=!ds.battles?.length;$('#campPhaseCard').innerHTML=complete?`<strong>${universe.year} offseason</strong><div class="compact muted">Spring development: ${ds.springRun?'complete':'not run'} · Fall camp: ${ds.fallRun?'complete':'not run'}</div>`:openingPreseason()?'<strong>Preseason setup</strong><div class="compact muted">Development priorities are editable now; camp actions unlock after the national championship.</div>':'<strong>In season</strong><div class="compact muted">Camps open after the season.</div>';let avgConf=Math.round(avg(u.roster.map(p=>{ensurePlayerDevelopment(p,u);return p.scoutConfidence}))),transition=u.roster.filter(p=>familiarity(p,p.pos)<80).length,young=u.roster.filter(p=>eligibilityBase(p)<=1).length;$('#developmentSummary').innerHTML=`<div class="lineitem"><span>Average scouting confidence</span><strong>${avgConf}%</strong></div><div class="lineitem"><span>Freshmen / sophomores</span><strong>${young}</strong></div><div class="lineitem"><span>Position-transition projects</span><strong>${transition}</strong></div><div class="lineitem"><span>Program development</span><strong>${grade(u.development)}</strong></div>`;renderDevelopmentResults(u,ds);
 let players=u.roster.slice().sort((a,b)=>eligibilityBase(a)-eligibilityBase(b)||b.perceivedUpside-a.perceivedUpside);$('#trainingBody').innerHTML=players.map(p=>`<tr><td data-label="Player"><button class="player-button" data-player="${p.id}">${p.name}</button><div class="small muted">${p.pos}${familiarity(p,p.pos)<80?` · <span class="transition-tag">${familiarity(p,p.pos)}% familiar</span>`:''}</div></td><td data-label="Elig">${eligibilityLabel(p)}</td><td data-label="Current Read">${scoutRangeText(p,u,false)}<div class="small muted">${confidenceText(p)}</div></td><td data-label="Potential Read">${scoutRangeText(p,u,true)}</td><td data-label="Body">${heightStr(p.height)} / ${p.weight}<div class="small muted">${p.lastPhysicalChange||'—'}</div></td><td data-label="Focus"><select class="training-focus" data-training="${p.id}" aria-label="Training focus for ${gameEscape(p.name)}">${INDIVIDUAL_TRAINING.map(x=>`<option ${x===p.trainingFocus?'selected':''}>${x}</option>`).join('')}</select></td><td class="staff-note" data-label="Staff Note">${devStaffNote(p,u)}</td></tr>`).join('');$$('[data-training]').forEach(s=>s.onchange=()=>{let p=u.roster.find(x=>x.id===s.dataset.training);if(p){p.trainingFocus=s.value;u.trainingFocusSeason=universe.year}});attachPlayerLinks();
 let pc=$('#positionChangePlayer'),old=pc.value;pc.innerHTML=u.roster.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<option value="${p.id}">${p.pos} ${p.name}</option>`).join('');if(u.roster.some(p=>p.id===old))pc.value=old;renderPositionChangeOptions();let rep=ds.fallRun?ds.fallReport:ds.springReport;$('#campReport').innerHTML=rep?.length?rep.slice(0,7).map(x=>`<div class="lineitem"><span><button class="player-button" data-player="${x.id}">${x.pos} ${x.name}</button>${x.grade?` · ${x.grade} camp`:''}</span><strong class="${x.delta>1?'dev-rise':x.delta<0?'dev-fall':'dev-flat'}">${x.delta>0?'+':''}${x.delta}${x.physical?` · ${x.physical}`:''}</strong></div>`).join(''):'<span class="muted">No camp results yet.</span>';$('#campBattles').innerHTML=ds.battles?.length?ds.battles.map(b=>`<div class="camp-battle"><div class="battle-head"><strong>${b.label}</strong><span class="small muted">gap ${b.gap}</span></div><div class="battle-candidates">${b.candidates.slice(0,3).map((c,i)=>`<div class="battle-candidate"><span>${i+1}. <button class="player-button" data-player="${c.id}">${c.name}</button>${c.id===b.recommended?' <span class="staff-rec">• staff pick</span>':''}</span><strong>${c.score}</strong></div>`).join('')}</div></div>`).join(''):'<span class="muted">Fall camp will identify the closest competitions.</span>';attachPlayerLinks()}
function renderPositionChangeOptions(){let u=selected(),p=u.roster.find(x=>x.id===$('#positionChangePlayer').value),target=$('#positionChangeTarget');if(!p||!target)return;let opts=positionOptions(p);target.innerHTML=opts.map(x=>`<option value="${x}">${x}</option>`).join('');let to=target.value;if(!to){$('#positionChangePreview').textContent='No realistic transition available.';$('#applyPositionChange').disabled=true;return}const will=positionChangeWillingness(p,u,to);
 $('#applyPositionChange').disabled=universe.phase!=='complete'||will.state==='REFUSES';
 $('#positionChangePreview').innerHTML=`Projected transition fit: <strong>${positionTransitionFit(p,to)}/100</strong>. Current ${p.pos} familiarity: ${familiarity(p,p.pos)}%. Moving to ${to} starts with a learning penalty that camp can reduce.<br><span class="pill${will.state==='REFUSES'?' bad':''}">${positionWillingnessLabel(will.state)}</span> <span class="small muted">${gameEscape(will.reasons.slice(0,2).join('; ')||'no strong feelings either way')}${will.state==='RELUCTANT'?' — forcing it will cost morale and staff trust.':will.state==='REFUSES'?' — he will not agree to this move.':''}</span>`}
function renderOffseason(){const u=selected(),risks=u.roster.map(p=>({p,risk:transferRisk(p)})).sort((a,b)=>b.risk-a.risk).slice(0,8);$('#transferWatch').innerHTML=risks.map(x=>`<div class="lineitem"><span>${x.p.pos} ${x.p.name}</span><span class="${x.risk>45?'bad':x.risk>25?'warn':''}">${Math.round(x.risk)} risk</span></div>`).join('');const dev=u.roster.slice().sort((a,b)=>(b.dev+b.work)-(a.dev+a.work)).slice(0,8);$('#developmentWatch').innerHTML=dev.map(p=>`<div class="lineitem"><span>${p.pos} ${p.name}</span><span>${p.year} · ${p.style}</span></div>`).join('');let ds=ensureDevelopmentState();$('#offseasonReport').textContent=universe.phase==='complete'?(ds.fallRun?`Fall camp is complete. Finalize the offseason to advance to ${universe.year+1}.`:`Complete spring development and fall camp before advancing.`):'Complete the season first.';$('#movementLog').innerHTML=universe.movementLog.length?universe.movementLog.map(x=>`<div class="lineitem"><span>${x}</span></div>`).join(''):'<span class="muted">No offseason movement yet.</span>';for(const x of universe.transferPortal||[])if(x.fromSchoolId===u.id)$('#movementLog').innerHTML+=`<div class="lineitem"><button class="player-button" data-player="${x.p.id}">${x.p.name}</button><span>In portal — awaiting a roster opening</span></div>`;renderPortal();attachPlayerLinks()}

// --- v0.9.47 commit 4: the Portal subview -------------------------------------
// Rows link to the existing player profile via data-player; there is deliberately no
// second profile implementation here.
function portalFilterValue(id,fallback='ALL'){return $(id)?.value||fallback}
function portalVisibleCandidates(){
 const pos=portalFilterValue('#portalPos'),elig=portalFilterValue('#portalElig'),conf=portalFilterValue('#portalConf');
 const sort=portalFilterValue('#portalSort','interest'),onlyTargets=!!$('#portalTargetedOnly')?.checked,u=portalUserTeam();
 let rows=portalCandidates().filter(x=>!x.placed);
 if(pos!=='ALL')rows=rows.filter(x=>x.p.pos===pos);
 if(elig!=='ALL')rows=rows.filter(x=>x.p.year===elig);
 if(conf!=='ALL')rows=rows.filter(x=>(universe.teams.find(t=>t.id===x.fromSchoolId)?.conference||'')===conf);
 if(onlyTargets)rows=rows.filter(x=>portalTargetFor(x.candidateId));
 const mine=x=>u?(x.interest[u.id]??-1):-1;
 if(sort==='rating')rows.sort((a,b)=>b.p.perceived-a.p.perceived);
 else if(sort==='pos')rows.sort((a,b)=>POS.indexOf(a.p.pos)-POS.indexOf(b.p.pos)||b.p.perceived-a.p.perceived);
 else rows.sort((a,b)=>mine(b)-mine(a)||b.p.perceived-a.p.perceived);
 return rows;
}
function portalSyncFilterOptions(){
 const rows=portalCandidates().filter(x=>!x.placed);
 const fill=(sel,values,label)=>{
  const el=$(sel);if(!el)return;
  const keep=el.value;
  el.innerHTML=`<option value="ALL">${label}</option>`+values.map(v=>`<option>${v}</option>`).join('');
  if([...el.options].some(o=>o.value===keep))el.value=keep;
 };
 fill('#portalPos',[...new Set(rows.map(x=>x.p.pos))].sort((a,b)=>POS.indexOf(a)-POS.indexOf(b)),'All');
 fill('#portalElig',[...new Set(rows.map(x=>x.p.year))].sort(),'All');
 fill('#portalConf',[...new Set(rows.map(x=>universe.teams.find(t=>t.id===x.fromSchoolId)?.conference).filter(Boolean))].sort(),'All conferences');
}
var PORTAL_PAGE=40,portalRowLimit=40,portalExpandedId=null;
function renderPortal(){
 if(!$('#portalBoard'))return;
 const c=ensurePortalCycle(),u=portalUserTeam();
 const open=c.status==='open',entries=portalCandidates().filter(x=>!x.placed);
 $('#portalStatus').textContent=c.status==='idle'
  ?`${entries.length} player${entries.length===1?'':'s'} in the portal. Open it to start recruiting them.`
  :c.status==='open'?`Round ${c.round} of ${PORTAL_ROUNDS} · ${entries.filter(x=>!x.decision).length} still deciding`
  :`Portal closed · ${entries.filter(x=>x.decision).length} decided, ${c.resolutions.length} recorded`;
 $('#portalOpen').disabled=c.status!=='idle'||!entries.length;
 $('#portalAdvance').disabled=!open;
 $('#portalFinalize').disabled=!entries.some(x=>x.decision);
 $('#portalPanels').innerHTML=[
  ['Attention left',`${portalAttentionLeft()} / ${PORTAL_ATTENTION_POOL}`],
  ['Targets',`${c.targets.length} / ${PORTAL_TARGET_CAP}`],
  ['NIL available',u?nilSummaryText(u):'—'],
  ['Roster room',u?`${portalRoomFor(u)} spots`:'—'],
 ].map(([k,v])=>`<div class="metric"><div class="small muted">${k}</div><div class="v">${v}</div></div>`).join('');
 portalSyncFilterOptions();
 // The portal can hold ~180 players; render the first PORTAL_PAGE (plus every target and decided
 // signing) and let the coach page through the rest instead of drawing a 14,000px table.
 const allRows=portalVisibleCandidates(),rows=allRows.filter((x,i)=>i<portalRowLimit||portalTargetFor(x.candidateId)||(u&&x.decision?.schoolId===u.id)),hiddenRows=allRows.length-rows.length;
 $('#portalBoard').innerHTML=(rows.length?rows.map(x=>{
  const from=universe.teams.find(t=>t.id===x.fromSchoolId),target=portalTargetFor(x.candidateId);
  const mine=u?(x.interest[u.id]??null):null,deal=u?nilDealActive(x.p,u):null;
  const field=x.finalists.map(id=>universe.teams.find(t=>t.id===id)?.name).filter(Boolean).slice(0,3).join(', ')||'—';
  const decided=x.decision?universe.teams.find(t=>t.id===x.decision.schoolId):null;
  const status=decided?(decided.id===u?.id?'<span class="pill pill--commit">COMMITTED TO YOU</span>':`<span class="muted">Chose ${decided.name}</span>`):open?'<span class="muted">Deciding</span>':'<span class="muted">Available</span>';
  const expanded=portalExpandedId===x.candidateId;
  return `<tr class="${target?'target ':''}${expanded?'pd-expanded':''}">
   <td data-label="Player"><div class="player-cell">${portraitTag(x.p,64,'list')}<div class="player-cell-text"><button class="player-button" data-player="${x.p.id}">${x.p.name}</button><div class="small muted">${x.p.style||''}</div></div><button type="button" class="pd-disclose" data-portal-expand="${esc(x.candidateId)}" aria-expanded="${expanded}" aria-label="${expanded?'Hide':'Show'} scouting details for ${esc(x.p.name)}">${expanded?'Close':'Scout'}</button></div></td>
   <td data-label="Pos">${x.p.pos}</td>
   <td data-label="Class">${x.p.year}</td>
   <td data-label="From">${from?.name||x.from}<div class="small muted">${from?.conference||''}</div></td>
   <td data-label="Reason">${transferReasonLabel(x.reason)}</td>
   <td data-label="Rating">${grade(x.p.perceived)}</td>
   <td data-label="Your interest">${mine==null?'<span class="muted">Not in the running</span>':`<strong class="interest-val">${mine}%</strong>`}</td>
   <td data-label="Field">${field}</td>
   <td data-label="Attention">${x.decision?'—':`<select data-portal-attention="${x.candidateId}"><option value="0">None</option>${[1,2,3,4].slice(0,PORTAL_ATTENTION_MAX).map(n=>`<option value="${n}" ${target?.attention===n?'selected':''}>${n}</option>`).join('')}</select>`}</td>
   <td data-label="NIL">${x.decision?'—':deal?`<button data-portal-nil-off="${x.candidateId}">Withdraw ${deal.amount}</button>`:`<button data-portal-nil="${x.candidateId}">Offer</button>`}</td>
   <td data-label="Promise">${x.decision?'—':`<select data-portal-promise="${x.candidateId}">${PROMISES.map(p=>`<option ${promiseLabel(x.promiseOffer?.type)===p?'selected':''}>${p}</option>`).join('')}</select>`}</td>
   <td data-label="Status">${status}</td>
  </tr>`}).join(''):'<tr><td colspan="12" class="muted">No portal candidates match these filters.</td></tr>')+(hiddenRows>0?`<tr class="portal-more-row"><td colspan="12"><button type="button" class="ghost" data-portal-more>Show ${Math.min(PORTAL_PAGE,hiddenRows)} more · ${hiddenRows} not shown</button></td></tr>`:'');
 const log=c.log.slice(-8).reverse();
 $('#portalLog').innerHTML=log.length?log.map(x=>`<div class="lineitem"><span>Round ${x.round}</span><span>${x.message}</span></div>`).join(''):'No portal activity yet.';
 bindPortalControls();
 attachPlayerLinks();
}
// setStatus carries every refusal, so a rule the engine enforces is never silently swallowed.
function bindPortalControls(){
 const act=(res,ok)=>{if(res)setStatus(res);else if(ok)setStatus(ok);renderPortal()};
 $$('[data-portal-expand]').forEach(b=>b.onclick=()=>{
  portalExpandedId=portalExpandedId===b.dataset.portalExpand?null:b.dataset.portalExpand;
  renderPortal();
  [...$$('[data-portal-expand]')].find(button=>button.dataset.portalExpand===b.dataset.portalExpand)?.focus();
 });
 $$('[data-portal-more]').forEach(b=>b.onclick=()=>{portalRowLimit+=PORTAL_PAGE;renderPortal()});
 $$('[data-portal-attention]').forEach(s=>s.onchange=()=>{
  const id=s.dataset.portalAttention,n=Number(s.value);
  act(n>0?targetPortalCandidate(id,n):untargetPortalCandidate(id));
 });
 $$('[data-portal-nil]').forEach(b=>b.onclick=()=>act(offerPortalNil(b.dataset.portalNil),'NIL offer made.'));
 $$('[data-portal-nil-off]').forEach(b=>b.onclick=()=>act(withdrawPortalNil(b.dataset.portalNilOff),'NIL offer withdrawn.'));
 $$('[data-portal-promise]').forEach(s=>s.onchange=()=>act(promisePortalCandidate(s.dataset.portalPromise,s.value)));
 for(const [sel,fn] of [['#portalPos',0],['#portalElig',0],['#portalConf',0],['#portalSort',0],['#portalTargetedOnly',0]]){
  const el=$(sel);if(el)el.onchange=()=>{portalRowLimit=PORTAL_PAGE;renderPortal()};
 }
}

function findPlayer(id){const pending=(universe.transferPortal||[]).find(x=>x.p.id===id);if(pending)return {p:pending.p,team:null,active:false,portal:true};if(!IDX.players)rebuildIndexes();let h=IDX.players.get(id);if(h&&universe.teams[h.i]===h.t&&h.t.roster.includes(h.p))return {p:h.p,team:h.t,active:true};if(IDX.pop!==rosterPopulation()||(h&&!IDX.archive.has(id))){rebuildIndexes();h=IDX.players.get(id);if(h)return {p:h.p,team:h.t,active:true}}indexArchive();let p=IDX.archive.get(id);if(p)return {p,team:p.lastTeam?{name:p.lastTeam}:null,active:false};if(IDX.miss!==id){IDX.miss=id;rebuildIndexes();h=IDX.players.get(id);if(h)return {p:h.p,team:h.t,active:true}}return null}
function statLine(s){if(!s)return 'No recorded statistics.';let a=[];if(s.passAtt||s.passYds){let pct=s.passAtt?Math.round((s.passComp||0)/s.passAtt*1000)/10:0;a.push(`${s.passComp||0}/${s.passAtt||0} (${pct}%) · ${s.passYds||0} pass yds · ${s.passTD||0} TD · ${s.int||0} INT`)}if(s.rushAtt||s.rushYds)a.push(`${s.rushAtt||0} car · ${s.rushYds||0} rush yds · ${s.rushTD||0} TD`);if(s.targets||s.recYds)a.push(`${s.receptions||0}/${s.targets||0} rec · ${s.recYds||0} yds · ${s.recTD||0} TD`);if(s.tackles||s.sacks||s.intDef)a.push(`${s.tackles||0} tackle${s.tackles===1?'':'s'} · ${s.tfl||0} TFL · ${s.sacks||0} sacks · ${s.pressures||0} pressures · ${s.intDef||0} INT`);if(s.snaps&&!(s.passYds||s.rushYds||s.recYds||s.tackles))a.push(`${s.snaps} snaps · ${s.sacksAllowed||0} sacks allowed · ${s.pressuresAllowed||0} pressures allowed`);return a.join(' · ')||`${s.games||0} games`}
function showPlayerProfile(id){let f=findPlayer(id);if(!f&&archiveIsDeferred()){const current=universe;return ensureArchiveLoaded().then(()=>{if(universe===current)showPlayerProfile(id)}).catch(e=>{if(universe===current)setStatus(e.message)})}if(!f)return;const p=f.p,t=f.team;{const ph=$('#playerDialogPortrait');if(ph){ph.innerHTML=portraitTag(p,192,'profile');}}
 $('#playerDialogName').textContent=p.name;$('#playerDialogMeta').textContent=`${p.pos} · ${eligibilityLabel(p)} · ${heightStr(p.height)} / ${p.weight} · ${p.style}${t?` · ${t.name}`:''}`;$('#playerDialogKicker').textContent=f.portal?'TRANSFER PORTAL':f.active?'ACTIVE PLAYER':'PLAYER ARCHIVE';if(f.active&&t)ensurePlayerDevelopment(p,t);let attrs=[['Current',f.active&&t?scoutRangeText(p,t,false):grade(p.perceived)],['Upside',f.active&&t?scoutRangeText(p,t,true):grade(p.perceivedUpside)],['Scout Confidence',f.active?`${Math.round(p.scoutConfidence||50)}%`:'Final'],['Health',p.health??100]];let injury=(p.injuryWeeks||0)>0?`<div class="injury-note"><strong>${p.injury}</strong> · expected ${p.injuryWeeks} more week${p.injuryWeeks===1?'':'s'}.</div>`:'';let hist=careerChronologyHTML(p),aw=(p.awards||[]).slice().reverse().map(a=>`<div class="lineitem"><span>${a.year}</span><strong>${a.name}</strong></div>`).join('')||'<div class="muted">No major awards.</div>',draft=p.draftResult?`<div class="lineitem"><span>${p.draftResult.year} Draft</span><strong>${p.draftResult.label}</strong></div>`:'';$('#playerDialogBody').innerHTML=`${injury}${f.active&&t?scoutingPanelHTML(p,t):''}<div class="profile-grid">${attrs.map(x=>`<div class="profile-stat"><div class="small muted">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('')}</div><div class="profile-sections"><section class="profile-section"><h3>Season</h3><div class="profile-callout"><span class="eyebrow">Production</span><strong>${statLine(p.stats)}</strong></div><div class="lineitem"><span>Eligibility</span><strong>${eligibilityLabel(p)}</strong></div><div class="lineitem"><span>Redshirt</span><strong>${p.redshirtUsed?`Used${p.redshirtSeason?' in '+p.redshirtSeason:''}`:p.redshirtActive?'Protected this year':'Available'}</strong></div><div class="lineitem"><span>Origin</span><strong>${p.origin||'—'}</strong></div></section><section class="profile-section"><h3>Development</h3><div class="lineitem"><span>Training focus</span><strong>${p.trainingFocus||'Balanced'}</strong></div><div class="lineitem"><span>Position familiarity</span><strong>${familiarity(p,p.pos)}%</strong></div><div class="lineitem"><span>Wear</span><strong>${p.wear||0}/100</strong></div><div class="profile-note">${f.active&&t?devStaffNote(p,t):'Career complete'}</div></section><section class="profile-section"><h3>Health</h3><div class="lineitem"><span>Status</span><strong>${f.active?healthText(p):(f.portal?'Awaiting a destination':p.exitReason||'Career complete')}</strong></div><div class="lineitem"><span>Injuries recorded</span><strong>${p.injuryHistory?.length||0}</strong></div><div class="lineitem"><span>Promise</span><strong>${p.promise||'None'}</strong></div></section><section class="profile-section"><h3>Career</h3><div class="lineitem"><span>Career production</span><strong>${statLine(p.career)}</strong></div>${draft}<div class="profile-subhead">Honors</div>${aw}</section></div>${scoutingHistoryHTML(p)}${promiseHTML(p)}${transferHistoryHTML(p)}<section class="profile-section profile-section--wide"><h3>Career Chronology</h3><div class="timeline">${hist}</div></section>`;let d=$('#playerDialog');d.dataset.lwEntity=`player:${p.id}`;if(d.showModal)d.showModal();else d.setAttribute('open','');paintPortraits(d)}
// v0.12.13 — history index models. Read-only over collections the dynasty already
// holds: no save shape, no simulation, no gameplay RNG.
function coachIndexRows({query='',limit=40}={}){
 if(!universe)return [];
 const q=String(query||'').trim().toLowerCase();
 const current=new Map();
 for(const t of universe.teams||[])for(const [slot,c] of Object.entries(t.staff||{}))if(c?.id)current.set(c.id,{team:t.name,role:c.role||slot});
 const rows=allKnownCoaches().map(c=>{
  const now=current.get(c.id),tot=coachCareerTotals(c);
  return {id:c.id,name:c.name,role:(now?.role||c.role||'Coach'),team:now?.team||c.schoolName||null,active:!!now,
   status:now?'ACTIVE':(c.status||'DEPARTED'),wins:tot.wins,losses:tot.losses,seasons:tot.seasons,
   titles:(tot.conferenceTitles||0)+(tot.nationalTitles||0)};
 });
 const match=row=>!q||[row.name,row.team,row.role,row.status].some(v=>String(v||'').toLowerCase().includes(q));
 return rows.filter(match).sort((a,b)=>(b.active-a.active)||(b.wins-a.wins)||a.name.localeCompare(b.name)).slice(0,limit);
}
function championTimeline({limit=25}={}){
 return (universe?.history||[]).filter(h=>h.type==='season'&&h.champion).slice().sort((a,b)=>b.year-a.year).slice(0,limit).map(h=>{
  const record=(h.records||[]).find(r=>h.championId!=null?r.schoolId===h.championId:r.name===h.champion);
  return {year:h.year,champion:h.champion,championId:h.championId??null,
   runnerUp:h.runnerUp||championshipOpponent(h.year,h.champion)||null,
   record:h.championRecord||(record?`${record.w}-${record.l}`:h.top10?.find(r=>r.name===h.champion)?.record)||null};
 });
}
// v0.30: national timeline. Everything is derived from what each season already archived: the season history entry
// (champion, awards), the game archive (both teams' rankings at kickoff) and the national season records (the year a
// standing record was set). No save field is added.
const TIMELINE_UPSETS=3;
function isRankedValue(rank){const n=Number(rank);return Number.isInteger(n)&&n>=1&&n<=25}
function seasonUpsets(year,limit=TIMELINE_UPSETS){
 const out=[];
 for(const g of universe?.gameArchive||[]){
  if(g?.season!==year||!g.final||!g.score)continue;
  const hs=Number(g.score.home),as=Number(g.score.away);if(!Number.isFinite(hs)||!Number.isFinite(as)||hs===as)continue;
  const [win,lose,ws,ls]=hs>as?[g.home,g.away,hs,as]:[g.away,g.home,as,hs];
  const loserRank=isRankedValue(lose?.rank)?Number(lose.rank):null;if(!loserRank||loserRank>10)continue;
  const winnerRank=isRankedValue(win?.rank)?Number(win.rank):null;
  // An upset: a top-10 team loses to an unranked team, or to a team at least 12 places below it.
  const gap=(winnerRank??40)-loserRank;if(gap<12)continue;
  out.push({gameId:g.id,week:g.week??null,label:g.label||null,winner:win?.name||'',winnerId:win?.id??null,winnerRank,loser:lose?.name||'',loserId:lose?.id??null,loserRank,score:`${ws}-${ls}`,gap});
 }
 return out.sort((a,b)=>a.loserRank-b.loserRank||b.gap-a.gap||String(a.gameId).localeCompare(String(b.gameId))).slice(0,limit).map(({gap,...x})=>x);
}
function seasonRecordsSet(year){
 return Object.entries(universe?.records?.nationalSeason||{}).filter(([,r])=>r&&r.year===year)
  .map(([key,r])=>({key,label:r.label||key,value:r.value,playerId:r.playerId??null,playerName:r.playerName||'',team:r.team||''}));
}
function nationalTimeline({limit=25}={}){
 const champions=new Map(championTimeline({limit:1e6}).map(x=>[x.year,x]));
 return (universe?.history||[]).filter(h=>h.type==='season').slice().sort((a,b)=>b.year-a.year).slice(0,limit).map(h=>({
  year:h.year,...(champions.get(h.year)||{champion:null,championId:null,runnerUp:null,record:null}),
  awards:(Array.isArray(h.awards)?h.awards:[]).map(a=>({name:a.name,playerId:a.playerId??null,playerName:a.playerName||'',team:a.team||'',pos:a.pos||''})),
  // Older browser saves keep past games in a deferred archive; null asks the page to load them first.
  upsets:gamesAreDeferred()?null:seasonUpsets(h.year),records:seasonRecordsSet(h.year)
 }));
}
// App scope is not global by design; the history module reaches these through this bridge.
if(typeof globalThis!=='undefined')globalThis.DynastyHistoryIndex=Object.freeze({coaches:coachIndexRows,champions:championTimeline,timeline:nationalTimeline,gamesDeferred:gamesAreDeferred,loadGames:ensureGamesLoaded,openCoach:showCoachProfile});
// Recruiting-needs bridge: only POS_COUNTS, roster positions/years and committed counts leave app scope.
if(typeof globalThis!=='undefined')globalThis.DynastyRecruitingNeeds=Object.freeze({posCounts:POS_COUNTS,snapshot:()=>{
 if(!universe)return null;const t=selected();if(!t)return null;
 const committed={},targeted={},watched={};
 for(const r of universe.recruits||[]){if(r.committed===t.name)committed[r.pos]=(committed[r.pos]||0)+1;else if(r.targeted&&!r.committed)targeted[r.pos]=(targeted[r.pos]||0)+1}
 for(const r of universe.risingClass||[])if(r.watch)watched[r.pos]=(watched[r.pos]||0)+1;
 const done=universe.phase==='complete'&&universe.offseason?.year===universe.year?universe.offseason.completed||[]:[];
 return{year:universe.year,team:t.name,players:(t.roster||[]).map(p=>({pos:p.pos,year:p.year})),committed,targeted,watched,departuresDone:done.includes('departures'),enrolled:done.includes('signing')};
}});

// v0.12.14 — Hall of Fame. Induction uses only recorded, player-visible facts:
// awards, draft result, career production and coach titles. There is no hidden
// rating and no new save field; inductees are derived every time from the archive.
const HOF_MAJOR_AWARD=/^(National|Offensive|Defensive|Quarterback|Running Back|Receiver|Lineman) .*of the Year$/i;
function hofPlayerPoints(p){
 const awards=(p.awards||[]).filter(a=>HOF_MAJOR_AWARD.test(String(a.name||'')));
 const round=p.draftResult?.round||null;
 const production=productionRating(p);
 const draft=round===1?25:round===2?15:round===3?8:round?4:0;
 return {points:Math.round(awards.length*40+draft+Math.max(0,production-55)),awards,round,production};
}
function hofPlayerReasons(p,{awards,round}={}){
 const reasons=awards.slice(0,3).map(a=>`${a.name} ${a.year}`);
 if(round)reasons.push(round===1?'First-round draft pick':`Round ${round} draft pick`);
 const c=p.career||{};
 if((c.passYds||0)>0)reasons.push(`${Math.round(c.passYds).toLocaleString()} career passing yards`);
 else if((c.rushYds||0)>0)reasons.push(`${Math.round(c.rushYds).toLocaleString()} career rushing yards`);
 else if((c.recYds||0)>0)reasons.push(`${Math.round(c.recYds).toLocaleString()} career receiving yards`);
 else if((c.tackles||0)>0)reasons.push(`${Math.round(c.tackles)} career tackles`);
 else if((c.sacks||0)>0)reasons.push(`${Number(c.sacks).toFixed(1)} career sacks`);
 return reasons.slice(0,4);
}
function hofCoachPoints(c){
 const totals=coachCareerTotals(c);
 return {totals,points:Math.round(totals.nationalTitles*50+totals.conferenceTitles*12+totals.coachAwards*20+totals.wins*.15)};
}
function hallOfFame({limit=24}={}){
 if(!universe)return [];
 const rows=[];
 for(const p of universe.playerArchive||[]){
  const facts=hofPlayerPoints(p);
  // A single award season is common; induction needs a career argument. Measured
  // on ten-season dynasties: the old rule produced ~25 inductees a season.
  const qualified=facts.awards.length>=2||(facts.awards.length>=1&&facts.round===1)||(facts.round===1&&facts.production>=85);
  if(!qualified||facts.points<90)continue;
  rows.push({kind:'player',id:p.id,name:p.name,pos:p.pos,team:p.lastTeam||'—',year:p.retiredYear||null,
   points:facts.points,reasons:hofPlayerReasons(p,facts)});
 }
 for(const c of allKnownCoaches()){
  const {totals,points}=hofCoachPoints(c);
  const qualified=totals.nationalTitles>=1||totals.conferenceTitles>=5||totals.coachAwards>=3;
  if(!qualified||points<60)continue;
  const reasons=[];
  if(totals.nationalTitles)reasons.push(`${totals.nationalTitles} national title${totals.nationalTitles===1?'':'s'}`);
  if(totals.conferenceTitles)reasons.push(`${totals.conferenceTitles} conference title${totals.conferenceTitles===1?'':'s'}`);
  if(totals.coachAwards)reasons.push(`${totals.coachAwards} Coach of the Year`);
  reasons.push(`${totals.wins}–${totals.losses} career`);
  rows.push({kind:'coach',id:c.id,name:c.name,pos:'HC',team:c.schoolName||c.status||'—',year:null,points,reasons});
 }
 return rows.sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name)).slice(0,limit);
}
if(typeof globalThis!=='undefined'&&globalThis.DynastyHistoryIndex)
 globalThis.DynastyHistoryIndex=Object.freeze({...globalThis.DynastyHistoryIndex,hallOfFame,openPlayer:showPlayerProfile});
