const fs=require('fs');
function read(p){return fs.readFileSync(p,'utf8')}
function write(p,s){fs.writeFileSync(p,s)}
function replaceBetween(src,start,end,repl,label){const a=src.indexOf(start),b=src.indexOf(end,a);if(a<0||b<0)throw new Error(`missing ${label}`);return src.slice(0,a)+repl+'\n'+src.slice(b)}
function mustReplace(src,from,to,label){if(!src.includes(from))throw new Error(`missing ${label}`);return src.replace(from,to)}

let app=read('app.js');
const goalBlock=`function seasonGoalSeed(t){return (((universe.year||0)*131)+((t?.id||0)*17))>>>0}
function seasonGoalChoice(t,items,salt=0){return items[(seasonGoalSeed(t)+salt)%items.length]}
function ensureSeasonGoals(t){
 if(!t)return[];
 if(t.seasonGoalsYear===universe.year&&Array.isArray(t.seasonGoals)&&t.seasonGoals.length)return t.seasonGoals;
 const exp=seasonExpectation(t),rival=rivalOf(t),blueTarget=t.prestige>=82?5:t.prestige>=62?4:3,goals=[];
 const add=(id,weight,type,label,target=null)=>goals.push({id,weight,tier:weight==='Critical'?'Primary':weight==='Important'?'Secondary':'Stretch',type,label,target,year:universe.year});
 add('wins','Critical','wins',\`Win at least \${exp} games\`,exp);
 if(rival)add('rivalry','Important','rivalry',\`Beat \${rival.name}\`,rival.id);
 const recruitType=seasonGoalChoice(t,['bluechips','classSize'],3);
 if(recruitType==='bluechips')add('recruiting','Important','bluechips',\`Sign \${blueTarget} blue-chip recruits\`,blueTarget);
 else {const target=t.prestige>=82?18:t.prestige>=60?15:12;add('recruiting','Important','classSize',\`Sign at least \${target} recruits\`,target)}
 const p=t.prestige||0;
 if(p>=90){const type=seasonGoalChoice(t,['nationalTitle','conferenceTitle'],7);if(type==='nationalTitle')add('stretch','Bonus','nationalTitle','Win the national championship');else add('stretch','Bonus','conferenceTitle','Win the conference championship')}
 else if(p>=75){const type=seasonGoalChoice(t,['conferenceTitle','rank'],7);if(type==='conferenceTitle')add('stretch','Bonus','conferenceTitle','Win the conference championship');else add('stretch','Bonus','rank','Finish in the Top 15',15)}
 else if(p>=55){const type=seasonGoalChoice(t,['rank','bowl'],7);if(type==='rank')add('stretch','Bonus','rank','Finish in the Top 25',25);else add('stretch','Bonus','bowl','Reach bowl eligibility',6)}
 else add('stretch','Bonus','bowl','Reach bowl eligibility',6);
 t.seasonGoalsYear=universe.year;t.seasonGoals=goals;return goals;
}
function seasonGoalStatus(t,g,final=false){
 if(!t||!g)return{state:'pending',progress:'—'};
 const played=(t.w||0)+(t.l||0),remaining=Math.max(0,12-played),late=(universe.week||0)>=8;
 if(g.type==='wins'){const done=(t.w||0)>=g.target,impossible=(t.w||0)+remaining<g.target,atRisk=!done&&(impossible||(played>=6&&((t.w||0)/Math.max(1,played))<(g.target/12)*.8));return{state:done?'complete':final?'failed':atRisk?'at_risk':'on_track',progress:\`\${t.w||0}/\${g.target} wins\`}}
 if(g.type==='rivalry'){const s=t.rivalry?.series,hasPlayed=s?.lastYear===universe.year;if(!hasPlayed)return{state:final?'failed':'on_track',progress:'Game pending'};return{state:s.lastResult==='W'?'complete':'failed',progress:s.lastResult==='W'?'Won rivalry':'Lost rivalry'}}
 if(g.type==='bluechips'){const n=(universe.recruits||[]).filter(r=>r.committed===t.name&&(r.stars||0)>=4).length,done=n>=g.target;return{state:done?'complete':final?'failed':late&&n<Math.ceil(g.target/2)?'at_risk':'on_track',progress:\`\${n}/\${g.target} blue chips\`}}
 if(g.type==='classSize'){const n=(universe.recruits||[]).filter(r=>r.committed===t.name).length,done=n>=g.target;return{state:done?'complete':final?'failed':late&&n<Math.ceil(g.target*.55)?'at_risk':'on_track',progress:\`\${n}/\${g.target} signees\`}}
 if(g.type==='conferenceTitle'){const done=(universe.confChamps||[]).some(x=>x?.name===t.name);return{state:done?'complete':final?'failed':'on_track',progress:done?'Conference champion':'Still alive'}}
 if(g.type==='nationalTitle'){const done=universe.champion===t.name||!!t.champ;return{state:done?'complete':final?'failed':'on_track',progress:done?'National champion':'Still alive'}}
 if(g.type==='rank'){const rank=t.rank||999,done=rank<=g.target,atRisk=late&&rank>g.target+12;return{state:done?'complete':final?'failed':atRisk?'at_risk':'on_track',progress:rank<999?\`#\${rank} nationally\`:'Unranked'}}
 if(g.type==='bowl'){const done=(t.w||0)>=6||t.bowlResult?.year===universe.year,impossible=(t.w||0)+remaining<6;return{state:done?'complete':final?'failed':impossible?'at_risk':'on_track',progress:\`\${t.w||0}/6 wins\`}}
 return{state:final?'failed':'on_track',progress:'—'};
}
function seasonGoalStatusLabel(state){return state==='complete'?'Complete':state==='failed'?'Failed':state==='at_risk'?'At risk':'On track'}
function evaluateSeasonGoals(t,final=false){
 const goals=ensureSeasonGoals(t),results=goals.map(g=>({...g,...seasonGoalStatus(t,g,final)}));
 let adjustment=0;
 if(final)for(const r of results){if(r.weight==='Critical')continue;if(r.weight==='Important')adjustment+=r.state==='complete'?3:-3;else adjustment+=r.state==='complete'?4:-1}
 const completed=results.filter(r=>r.state==='complete').length,atRisk=results.filter(r=>r.state==='at_risk'||r.state==='failed').length;
 return{results,completed,total:results.length,atRisk,adjustment};
}
function seasonGoalsHTML(t){
 const review=evaluateSeasonGoals(t,false);
 const rows=review.results.map(g=>{const icon=g.state==='complete'?'✓':g.state==='failed'?'✕':g.state==='at_risk'?'!':'•';return \`<div class="lineitem"><span><span class="pill">\${esc(g.weight||g.tier)}</span> \${icon} \${esc(g.label)}</span><span><strong>\${esc(g.progress)}</strong><div class="small muted">\${seasonGoalStatusLabel(g.state)}</div></span></div>\`}).join('');
 const readout=review.atRisk?\`\${review.atRisk} objective\${review.atRisk===1?' is':'s are'} at risk.\`:\`All active objectives are on track.\`;
 return rows+\`<div class="compact muted" style="margin-top:8px">\${review.completed} of \${review.total} complete · \${readout} Critical wins remain governed by the existing wins-vs-expectation administration model.</div>\`;
}
function programOverviewHTML(t){
 ensureAdminState(t);const review=evaluateSeasonGoals(t,false),expect=seasonExpectation(t),rank=t.rank&&t.rank<999?\`#\${t.rank}\`:'Unranked',rival=rivalOf(t);
 return \`<div class="profile-grid"><div class="profile-stat"><div class="small muted">Record</div><div class="v">\${t.w||0}–\${t.l||0}</div></div><div class="profile-stat"><div class="small muted">National standing</div><div class="v">\${rank}</div></div><div class="profile-stat"><div class="small muted">Admin confidence</div><div class="v">\${t.adminConfidence??50}</div><div class="small muted">\${adminConfidenceLabel(t.adminConfidence??50)}</div></div><div class="profile-stat"><div class="small muted">Season expectation</div><div class="v">\${expect} wins</div></div></div><div class="lineitem"><span>Goal status</span><strong>\${review.completed}/\${review.total} complete\${review.atRisk?\` · \${review.atRisk} at risk\`:''}</strong></div><div class="lineitem"><span>Primary rival</span><strong>\${esc(rival?.name||'None')}</strong></div><div class="lineitem"><span>Board mandate</span><strong>\${esc(t.mandate?.text||'No special mandate')}</strong></div>\`;
}`;
app=replaceBetween(app,'function ensureSeasonGoals(t){','// Movement is dominated',goalBlock,'season goal block');
app=mustReplace(app,"function renderProgram(){const u=selected();ensureSeasonGoals(u);","function renderProgram(){const u=selected();ensureSeasonGoals(u);$('#programOverview')&&($('#programOverview').innerHTML=programOverviewHTML(u));",'Program Lab render hook');
const renderAnchor="function render(){const order=ranked();const u=selected();if(!u)return;";
if(app.includes(renderAnchor))app=app.replace(renderAnchor,renderAnchor+"ensureSeasonGoals(u);$('#seasonGoalsDashboard')&&($('#seasonGoalsDashboard').innerHTML=seasonGoalsHTML(u));");
app=mustReplace(app,"const APP_VERSION='0.9.51';","const APP_VERSION='0.9.52';",'app version');
write('app.js',app);

let body=read('body.html');
body=mustReplace(body,'<div class="section-head"><div><h2>Program Lab</h2><div class="muted">Edit the controlled fictional school in place. This is the first version of Create-a-School / universe editing.</div></div></div>','<div class="section-head"><div><h2>Program Lab</h2><div class="muted">Track the job, the board, the season and the institutional identity behind your dynasty.</div></div></div><div class="card"><div class="eyebrow">PROGRAM OVERVIEW</div><div id="programOverview"></div></div>','Program Lab intro');
body=mustReplace(body,'<div class="card"><h3>Coaching Career</h3><div id="careerHistory"></div></div>\n      <div class="card"><h3>Program History</h3><div id="programHistory"></div></div>','<div class="two-col"><div class="card"><h3>Coaching Career</h3><div id="careerHistory"></div></div><div class="card"><h3>Program History</h3><div id="programHistory"></div></div></div>','Program Lab lower layout');
write('body.html',body);

write('VERSION.txt','0.9.52\n');
let pkg=JSON.parse(read('package.json'));pkg.version='0.9.52';write('package.json',JSON.stringify(pkg,null,2)+'\n');
let harness=read('tools/harness.js');harness=mustReplace(harness,'seasonGoalStatus, evaluateSeasonGoals, seasonGoalsHTML, adminSeasonReview','seasonGoalStatus, seasonGoalStatusLabel, evaluateSeasonGoals, seasonGoalsHTML, programOverviewHTML, adminSeasonReview','harness exports');write('tools/harness.js',harness);

let changelog=read('CHANGELOG.md');if(!changelog.includes('## v0.9.52 — Program goals polish'))changelog=`## v0.9.52 — Program goals polish\n- Expands season-goal variety while keeping the primary win expectation tied to the existing administration model.\n- Adds Critical / Important / Bonus weighting and live Complete / On track / At risk / Failed status.\n- Adds a Program Overview card with board confidence, expectations, rivalry and goal health.\n- Tightens Program Lab layout and restores the dashboard Season Goals render hook when absent.\n\n`+changelog;write('CHANGELOG.md',changelog);
let continuation=read('CONTINUATION.md');if(!continuation.includes('## v0.9.52 Program Lab polish'))continuation+=`\n## v0.9.52 Program Lab polish\nBranch: codex/v0952-program-goals-polish. Builds on the v0.9.51 Program Lab hotfix. Adds deterministic goal variety, Critical/Important/Bonus weights, live risk states, a Program Overview card, tighter Program Lab layout, and explicit render regression coverage. Production remains v0.9.51 until this branch is reviewed and published.\n`;write('CONTINUATION.md',continuation);
console.log('Applied v0.9.52 Program Lab / season goals patch.');
