// One-time new-dynasty setup. This extension is injected before app bootstrap so it
// can use the simulation and persistence services without creating a second state model.
const NEW_DYNASTY_SETUP_DRAFT_KEY='dynastyLabNewDynastySetupV1';
const NEW_DYNASTY_SETUP_VERSION=1;
const NEW_DYNASTY_SETUP_STEPS=['Take the Job','Your Coach','Choose a Program','Program Identity','Configure the World','What You Inherited','Accept the Contract'];
let newDynastySetupDraft=null;
let newDynastySetupCandidate=null;
let newDynastySetupPreviousUniverse=null;
let newDynastySetupGenerating=false;
let newDynastySetupSubmitting=false;
let newDynastySetupSaveCount=0;
let newDynastySetupProgramView={query:'',conference:'ALL',sort:'challenge'};

function newDynastySetupSeed(){
 const values=new Uint32Array(1);crypto.getRandomValues(values);return values[0]||0x6d2b79f5;
}
function defaultNewDynastySetupDraft(){
 return {version:NEW_DYNASTY_SETUP_VERSION,active:true,step:0,coachName:'',program:'Chicago Metropolitan',offScheme:'Multiple',defScheme:'Split-Safety Control',trainingFocus:'Balanced',mode:'dynasty',seed:newDynastySetupSeed(),quickStart:false,startedAt:new Date().toISOString()};
}
function sanitizeNewDynastySetupDraft(value){
 const base=defaultNewDynastySetupDraft(),d=value&&typeof value==='object'?value:{};
 const program=schools.some(s=>s.name===d.program)?d.program:base.program;
 return {...base,active:d.active===true,step:clamp(Number.isInteger(d.step)?d.step:0,0,6),coachName:typeof d.coachName==='string'?d.coachName.slice(0,40):'',program,offScheme:OFF_SCHEMES[d.offScheme]?d.offScheme:base.offScheme,defScheme:DEF_SCHEMES[d.defScheme]?d.defScheme:base.defScheme,trainingFocus:TEAM_TRAINING[d.trainingFocus]?d.trainingFocus:base.trainingFocus,mode:d.mode==='commissioner'?'commissioner':'dynasty',seed:Number.isInteger(d.seed)&&d.seed>=0&&d.seed<=0xffffffff?d.seed:base.seed,quickStart:d.quickStart===true,startedAt:typeof d.startedAt==='string'?d.startedAt:base.startedAt};
}
function readNewDynastySetupDraft(){
 try{const raw=localStorage.getItem(NEW_DYNASTY_SETUP_DRAFT_KEY);return raw?sanitizeNewDynastySetupDraft(JSON.parse(raw)):null}catch{return null}
}
function writeNewDynastySetupDraft(){
 if(!newDynastySetupDraft)return;try{localStorage.setItem(NEW_DYNASTY_SETUP_DRAFT_KEY,JSON.stringify(newDynastySetupDraft))}catch{}
}
function clearNewDynastySetupDraft(){try{localStorage.removeItem(NEW_DYNASTY_SETUP_DRAFT_KEY)}catch{}newDynastySetupDraft=null}
function validNewDynastyCoachName(name){return /^[A-Za-z0-9 .,'-]{2,40}$/.test(String(name||'').trim())}
function newDynastySetupSchool(){return schools.find(s=>s.name===newDynastySetupDraft?.program)||schools[0]}
function newDynastyChallenge(s){return clamp(Math.round(100-((s.prestige+s.resources+s.facilities+s.development)/4)+(100-s.admin_patience)*.22),1,100)}
function newDynastyChallengeLabel(s){const n=newDynastyChallenge(s);return n>=70?'Program builder':n>=48?'Competitive climb':n>=28?'Win-now pressure':'Championship mandate'}
function newDynastyTrajectory(s){const gap=(s.program_ceiling||s.prestige)-s.prestige;return gap>=18?'Significant room to build':gap>=8?'Upside remains':s.prestige>=88?'National-title standard':'Stable foundation'}
function newDynastySetupBrand(){
 const root=$('#dynastySetup'),s=newDynastySetupSchool();if(!root||!s)return;
 if(globalThis.DynastyProgramBranding?.applyVars)DynastyProgramBranding.applyVars(root,s.id);
 else{const c=schoolColors(s);root.style.setProperty('--program-primary',c.primary);root.style.setProperty('--program-secondary',c.secondary)}
 root.dataset.programId=String(s.id);
}
function newDynastySetupProgress(){
 return NEW_DYNASTY_SETUP_STEPS.map((label,i)=>`<div class="setup-progress-step${i===newDynastySetupDraft.step?' active':i<newDynastySetupDraft.step?' complete':''}" ${i===newDynastySetupDraft.step?'aria-current="step"':''}><span>${i+1}</span><small>${esc(label)}</small></div>`).join('');
}
function newDynastySetupMetric(label,value,note=''){return `<div class="setup-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong>${note?`<small>${esc(note)}</small>`:''}</div>`}
function newDynastySetupChoice(field,value,title,copy,selected){return `<label class="setup-choice${selected?' selected':''}"><input type="radio" name="${field}" value="${esc(value)}" data-setup-field="${field}" ${selected?'checked':''}><span><strong>${esc(title)}</strong><small>${esc(copy)}</small></span></label>`}
function newDynastySetupHeader(kicker,title,copy){return `<div class="setup-screen-head"><span>${esc(kicker)}</span><h1 id="setupHeading">${esc(title)}</h1><p>${esc(copy)}</p></div>`}
function newDynastySetupProgramRows(){
 const q=newDynastySetupProgramView.query.trim().toLowerCase(),conference=newDynastySetupProgramView.conference;
 let rows=schools.filter(s=>(conference==='ALL'||s.conference===conference)&&(!q||`${s.name} ${s.city} ${s.state} ${s.conference}`.toLowerCase().includes(q)));
 if(newDynastySetupProgramView.sort==='prestige')rows.sort((a,b)=>b.prestige-a.prestige||a.name.localeCompare(b.name));
 else if(newDynastySetupProgramView.sort==='resources')rows.sort((a,b)=>(b.resources+b.nil)-(a.resources+a.nil)||a.name.localeCompare(b.name));
 else if(newDynastySetupProgramView.sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name));
 else rows.sort((a,b)=>newDynastyChallenge(b)-newDynastyChallenge(a)||a.name.localeCompare(b.name));
 return rows;
}
function newDynastySetupProgramListHTML(rows,selected){
 return rows.map(s=>`<button type="button" role="option" aria-selected="${s.name===selected.name}" class="setup-program-row${s.name===selected.name?' selected':''}" data-setup-program="${esc(s.name)}"><span>${teamLogoHTML(s.id,34,'team-logo--inline')}<b>${esc(s.name)}</b><small>${esc(s.conference)} · ${esc(s.city)}, ${esc(s.state)}</small></span><span><b>${esc(newDynastyChallengeLabel(s))}</b><small>Prestige ${s.prestige} · Ceiling ${s.program_ceiling}</small></span></button>`).join('')||'<p class="setup-empty">No programs match those filters.</p>';
}
function filterNewDynastySetupPrograms(){
 const rows=newDynastySetupProgramRows(),selected=newDynastySetupSchool(),count=$('#setupContent .setup-program-count'),list=$('#setupContent .setup-program-list');
 if(count)count.textContent=`${rows.length} program${rows.length===1?'':'s'}`;if(list)list.innerHTML=newDynastySetupProgramListHTML(rows,selected);
}
function newDynastySetupWelcome(){
 const saves=titleSaveSlots.filter(s=>!s.empty).length;
 return `${newDynastySetupHeader('THE NEXT ERA STARTS HERE','Take the Job','Build a coach, choose the right program, set your football identity, and see exactly what you inherited before the first preseason meeting.')}
 <div class="setup-welcome-grid">
  <section class="setup-feature"><span>FULL SETUP</span><h2>Make the program yours</h2><p>Seven focused steps. Every editable choice on these screens writes to a real Dynasty Lab system.</p></section>
  <section class="setup-feature"><span>QUICK START</span><h2>Get to the briefing</h2><p>Use recommended defaults, then review the generated roster and staff before accepting the job.</p><button type="button" data-setup-quick>Quick Start</button></section>
 </div>
 <div class="setup-ledger">${newDynastySetupMetric('Starting season','2027 Preseason','Week 1 stays locked until you choose Begin Season')}${newDynastySetupMetric('Universe','120 programs','Generated only after your setup choices are ready')}${newDynastySetupMetric('Existing saves',String(saves),'Continue and Load remain on the title screen')}</div>`;
}
function newDynastySetupCoach(){
 const valid=validNewDynastyCoachName(newDynastySetupDraft.coachName);
 return `${newDynastySetupHeader('STEP 2 · YOUR COACH','Put your name on the office','Coach name is identity, not a hidden ratings bonus. Your results will build the résumé.')}
 <div class="setup-form-narrow"><label class="setup-field" for="setupCoachName"><span>Coach name <b>Required</b></span><input id="setupCoachName" type="text" maxlength="40" autocomplete="name" value="${esc(newDynastySetupDraft.coachName)}" aria-describedby="setupCoachHelp setupCoachError"><small id="setupCoachHelp">2–40 characters. Letters, numbers, spaces, apostrophes, periods, commas, and hyphens are allowed.</small></label><p id="setupCoachError" class="setup-validation${valid||!newDynastySetupDraft.coachName?' hidden':''}">Enter a valid coach name to continue.</p>
 <div class="setup-note"><span>CAREER CONTRACT</span><strong>One coach. One active post.</strong><p>Dynasty Mode moves you through earned job opportunities. Commissioner Mode adds sandbox controls without changing your coach identity.</p></div></div>`;
}
function newDynastySetupProgram(){
 const selected=newDynastySetupSchool(),conferences=[...new Set(schools.map(s=>s.conference))].sort(),rows=newDynastySetupProgramRows();
 return `${newDynastySetupHeader('STEP 3 · JOB BOARD','Choose the program','Search all 120 programs and judge the institution before the generated roster enters the room.')}
 <div class="setup-program-layout"><section class="setup-program-browser"><div class="setup-program-tools"><input id="setupProgramSearch" type="search" placeholder="Search school, city, state…" value="${esc(newDynastySetupProgramView.query)}" aria-label="Search programs"><select id="setupProgramConference" aria-label="Filter conference"><option value="ALL">All conferences</option>${conferences.map(c=>`<option ${c===newDynastySetupProgramView.conference?'selected':''}>${esc(c)}</option>`).join('')}</select><select id="setupProgramSort" aria-label="Sort programs"><option value="challenge" ${newDynastySetupProgramView.sort==='challenge'?'selected':''}>Challenge</option><option value="prestige" ${newDynastySetupProgramView.sort==='prestige'?'selected':''}>Prestige</option><option value="resources" ${newDynastySetupProgramView.sort==='resources'?'selected':''}>Resources</option><option value="name" ${newDynastySetupProgramView.sort==='name'?'selected':''}>Name</option></select></div>
 <div class="setup-program-count">${rows.length} program${rows.length===1?'':'s'}</div><div class="setup-program-list" role="listbox" aria-label="Available programs">${newDynastySetupProgramListHTML(rows,selected)}</div></section>
 <aside class="setup-program-dossier">${teamLogoHTML(selected.id,74,'setup-program-logo')}<span>SELECTED PROGRAM</span><h2>${esc(selected.name)}</h2><p>${esc(selected.city)}, ${esc(selected.state)} · ${esc(selected.conference)}</p><div class="setup-dossier-grid">${newDynastySetupMetric('Prestige',grade(selected.prestige),`${selected.prestige}/100`)}${newDynastySetupMetric('Resources',grade(selected.resources),`${selected.resources}/100`)}${newDynastySetupMetric('NIL position',grade(selected.nil),`${selected.nil}/100`)}${newDynastySetupMetric('Development',grade(selected.development),`${selected.development}/100`)}${newDynastySetupMetric('Facilities',grade(selected.facilities),`${selected.facilities}/100`)}${newDynastySetupMetric('Expectation',`${seasonExpectation(selected)} wins`,newDynastyChallengeLabel(selected))}</div><div class="setup-trajectory"><span>PROGRAM TRAJECTORY</span><strong>${esc(newDynastyTrajectory(selected))}</strong><small>Program ceiling ${selected.program_ceiling} · administration patience ${selected.admin_patience}</small></div></aside></div>`;
}
function newDynastySetupIdentity(){
 const off=Object.entries(OFF_SCHEMES).map(([name,x])=>newDynastySetupChoice('offScheme',name,name,`${Math.round(x.pass*100)}% pass · pace ${x.pace} · ${x.traits.join(', ')}`,newDynastySetupDraft.offScheme===name)).join('');
 const def=Object.entries(DEF_SCHEMES).map(([name,x])=>newDynastySetupChoice('defScheme',name,name,`Pressure ${x.pressure} · coverage ${x.coverage} · run control ${x.run}`,newDynastySetupDraft.defScheme===name)).join('');
 const training=Object.entries(TEAM_TRAINING).map(([name,x])=>newDynastySetupChoice('trainingFocus',name,name,x.desc,newDynastySetupDraft.trainingFocus===name)).join('');
 return `${newDynastySetupHeader('STEP 4 · FOOTBALL IDENTITY','Set the program identity','These choices affect scheme fit, installation, staff alignment, and offseason development.')}
 <div class="setup-identity"><section><div class="setup-section-title"><span>OFFENSE</span><h2>How you move the ball</h2></div><div class="setup-choice-grid">${off}</div></section><section><div class="setup-section-title"><span>DEFENSE</span><h2>How you get off the field</h2></div><div class="setup-choice-grid">${def}</div></section><section><div class="setup-section-title"><span>PROGRAM DEVELOPMENT</span><h2>Where the offseason work goes</h2></div><div class="setup-choice-grid setup-choice-grid--training">${training}</div></section></div>`;
}
function newDynastySetupWorld(){
 return `${newDynastySetupHeader('STEP 5 · WORLD CONTROL','Configure the world','Choose how much institutional control you want. League rules remain fixed because Dynasty Lab does not pretend unfinished settings are real.')}
 <div class="setup-mode-grid">${newDynastySetupChoice('mode','dynasty','Dynasty Mode','Control one program. Change jobs only through earned career opportunities.',newDynastySetupDraft.mode==='dynasty')}${newDynastySetupChoice('mode','commissioner','Commissioner Mode','Switch programs and edit institutional details across the fictional universe.',newDynastySetupDraft.mode==='commissioner')}</div>
 <div class="setup-world-facts"><div><span>UNIVERSE</span><strong>120 fictional programs</strong><small>Ten conferences with a national postseason.</small></div><div><span>CALENDAR</span><strong>12-game regular season</strong><small>Your dynasty opens in the 2027 preseason.</small></div><div><span>SIMULATION</span><strong>One shared football model</strong><small>Mode changes control access, not opponent difficulty.</small></div><div><span>SAVE MODEL</span><strong>Three local slots + JSON export</strong><small>The opening contract creates one durable save.</small></div></div>
 <div class="setup-deferred"><strong>Not exposed yet</strong><span>Custom playoff formats, transfer rules, conference realignment, and difficulty sliders require real simulation support before they belong here.</span></div>`;
}
function buildNewDynastySetupCandidate(){
 if(newDynastySetupCandidate)return newDynastySetupCandidate;
 const d=newDynastySetupDraft;if(!d)throw new Error('Setup draft is unavailable.');
 const previous=universe;createNewDynasty(d.mode,{seed:d.seed});const candidate=universe;
 try{
  refreshTeamOptions(d.program);const t=T(d.program);if(!t)throw new Error('The selected program could not be generated.');
  setTeamScheme(t,'off',d.offScheme,'New head coach identity');setTeamScheme(t,'def',d.defScheme,'New head coach identity');
  t.staff.OC.preferredScheme=d.offScheme;t.staff.DC.preferredScheme=d.defScheme;t.trainingFocus=d.trainingFocus;
  t.staff.HC.name=d.coachName.trim();t.staff.HC.userControlled=true;
  universe.coachProfile={name:d.coachName.trim(),programId:t.id,programName:t.name,startedYear:universe.year};
  universe.tenure={startYear:universe.year,school:t.name,seasons:[],ended:null,closed:false};
  universe.setup={version:NEW_DYNASTY_SETUP_VERSION,completed:false,source:'take-the-job',coachName:d.coachName.trim(),programId:t.id,programName:t.name,offScheme:d.offScheme,defScheme:d.defScheme,trainingFocus:d.trainingFocus,mode:d.mode,seed:d.seed,quickStart:d.quickStart,startedAt:d.startedAt,completedAt:null,saveSlot:null};
  universe.setupCompleted=false;buildPreseasonHub();syncGameplayRng();newDynastySetupCandidate=candidate;return candidate;
 }catch(e){universe=previous;ensureGameplayRng();rebuildIndexes();throw e}
}
function invalidateNewDynastySetupCandidate(){
 if(!newDynastySetupCandidate)return;
 if(universe===newDynastySetupCandidate){universe=newDynastySetupPreviousUniverse;ensureGameplayRng();if(universe)rebuildIndexes()}
 newDynastySetupCandidate=null;newDynastySetupGenerating=false;
}
function newDynastySetupBriefing(){
 if(!newDynastySetupCandidate)return `${newDynastySetupHeader('STEP 6 · PROGRAM BRIEFING','Generating your program','Building the exact 2027 roster, staff, schedule, recruiting pool, and scholarship picture from your setup seed.')}<div class="setup-loading"><span></span><strong>Football operations is assembling the dossier…</strong></div>`;
 const t=T(newDynastySetupDraft.program),p=profiles(t),sch=scholarshipSummary(t),units=[['Quarterback room',p.qb],['Skill talent',p.skill],['Offensive line',p.ol],['Front seven',p.front],['Coverage unit',p.coverage]].sort((a,b)=>b[1]-a[1]),pipelines=Object.entries(t.pipelines||{}).sort((a,b)=>b[1]-a[1]),strengths=units.slice(0,2),weaknesses=units.slice(-2).reverse();
 const transition=['off','def'].filter(side=>schemeTransition(t,side)).map(side=>`${side==='off'?'offense':'defense'} at ${schemeFamiliarity(t,side)}% familiarity`);
 const priorities=[`Build the weekly plan around ${strengths[0][0].toLowerCase()} (${grade(strengths[0][1])}).`,sch.room?`Use the ${sch.room} available scholarship spot${sch.room===1?'':'s'} without exceeding the ${sch.capacity}-player class capacity.`:'Protect roster flexibility; the projected class is already at capacity.',transition.length?`Manage installation: ${transition.join(' and ')}.`:`Preserve the roster's fit in ${t.offScheme} and ${t.defScheme}.`];
 return `${newDynastySetupHeader('STEP 6 · PROGRAM BRIEFING','What You Inherited','This report is generated from the exact universe that will be saved if you accept the contract.')}
 <div class="setup-briefing-hero"><div>${teamLogoHTML(t.id,84,'setup-program-logo')}<span>2027 PROGRAM DOSSIER</span><h2>${esc(t.name)}</h2><p>${esc(t.conference)} · ${esc(t.city)}, ${esc(t.state)}</p></div><div>${newDynastySetupMetric('Overall profile',grade(p.overall),`${Math.round(p.overall)}/100`)}${newDynastySetupMetric('Board target',`${seasonExpectation(t)} wins`,adminConfidenceLabel(t.adminConfidence))}${newDynastySetupMetric('Scholarships',`${sch.room} open`,`${sch.returning} projected returners`)}</div></div>
 <div class="setup-briefing-grid"><section><div class="setup-section-title"><span>ROSTER READ</span><h2>Strengths and pressure points</h2></div><div class="setup-report-block"><strong>Foundation</strong>${strengths.map(x=>`<div><span>${esc(x[0])}</span><b>${grade(x[1])} · ${Math.round(x[1])}</b></div>`).join('')}</div><div class="setup-report-block warning"><strong>Needs attention</strong>${weaknesses.map(x=>`<div><span>${esc(x[0])}</span><b>${grade(x[1])} · ${Math.round(x[1])}</b></div>`).join('')}</div><div class="setup-report-block"><strong>Roster & scholarships</strong><p>${t.roster.length} players · ${sch.departing} projected departures · ${sch.capacity} recruiting capacity · ${sch.room} spots currently open.</p></div></section>
 <section><div class="setup-section-title"><span>FOOTBALL OPERATIONS</span><h2>Staff and recruiting position</h2></div><div class="setup-staff-list">${Object.values(t.staff).map(c=>`<div><span>${esc(c.role)}</span><strong>${esc(c.name)}</strong><small>Recruit ${grade(c.recruiting)} · Develop ${grade(c.development)} · Call ${grade(c.playCall)}</small></div>`).join('')}</div><div class="setup-report-block"><strong>Best pipelines</strong><p>${pipelines.slice(0,3).map(([name,value])=>`${esc(name)} ${value}`).join(' · ')}</p></div></section>
 <section class="setup-priorities"><div class="setup-section-title"><span>FIRST 30 DAYS</span><h2>Recommended priorities</h2></div><ol>${priorities.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section></div>`;
}
function newDynastySetupReview(){
 const d=newDynastySetupDraft,s=newDynastySetupSchool(),slot=titleSaveSlots.find(x=>x.empty)||activeSlotMeta(),occupied=slot&&!slot.empty;
 return `${newDynastySetupHeader('STEP 7 · CONTRACT REVIEW','Accept the contract','Review the terms. Accepting creates one saved dynasty and opens the Command Center in preseason.')}
 <div class="setup-contract"><div class="setup-contract-top">${teamLogoHTML(s.id,76,'setup-program-logo')}<div><span>HEAD FOOTBALL COACH</span><h2>${esc(d.coachName)}</h2><p>${esc(s.name)} · ${esc(s.conference)}</p></div></div>
 <div class="setup-contract-grid">${newDynastySetupMetric('Offense',d.offScheme,'Creates real scheme fit and installation state')}${newDynastySetupMetric('Defense',d.defScheme,'Creates real scheme fit and installation state')}${newDynastySetupMetric('Development',d.trainingFocus,'Sets the team offseason training focus')}${newDynastySetupMetric('Control',d.mode==='commissioner'?'Commissioner':'Dynasty',d.mode==='commissioner'?'Program switching and institutional editing enabled':'Career movement only')}${newDynastySetupMetric('Opening checkpoint','2027 Preseason','Week 1 remains locked until Begin Season')}${newDynastySetupMetric('Save destination',slot?.label||'Dynasty 1',occupied?'Confirmation required: this slot is occupied':'First available empty slot')}</div>
 <div class="setup-contract-note"><strong>Your inherited roster is fixed.</strong><span>Returning to earlier steps preserves your answers. The dynasty is not written until you accept.</span></div></div>`;
}
function newDynastySetupHTML(){return [newDynastySetupWelcome,newDynastySetupCoach,newDynastySetupProgram,newDynastySetupIdentity,newDynastySetupWorld,newDynastySetupBriefing,newDynastySetupReview][newDynastySetupDraft.step]()}
function updateNewDynastySetupControls(){
 const back=$('#setupBack'),next=$('#setupContinue'),step=newDynastySetupDraft.step;
 back.disabled=step===0||newDynastySetupSubmitting;back.hidden=step===0;
 next.disabled=newDynastySetupSubmitting||(step===1&&!validNewDynastyCoachName(newDynastySetupDraft.coachName))||(step===5&&!newDynastySetupCandidate);
 next.textContent=newDynastySetupSubmitting?'Creating Dynasty…':step===6?'Accept the Job':step===4?'Generate Briefing':'Continue';
}
function renderNewDynastySetup(){
 if(!newDynastySetupDraft)return;$('#setupProgress').innerHTML=newDynastySetupProgress();$('#setupContent').innerHTML=newDynastySetupHTML();
 newDynastySetupBrand();updateNewDynastySetupControls();$('#setupStatus').textContent=`Step ${newDynastySetupDraft.step+1} of 7 · ${NEW_DYNASTY_SETUP_STEPS[newDynastySetupDraft.step]}`;
 $('#setupContent').focus({preventScroll:true});window.scrollTo?.(0,0);
 if(newDynastySetupDraft.step===5&&!newDynastySetupCandidate&&!newDynastySetupGenerating){
  newDynastySetupGenerating=true;setTimeout(()=>{try{buildNewDynastySetupCandidate();newDynastySetupGenerating=false;renderNewDynastySetup()}catch(e){newDynastySetupGenerating=false;$('#setupStatus').textContent=e.message||'The program briefing could not be generated.'}},0);
 }
}
function openNewDynastySetup(){
 if(universe&&!newDynastySetupCandidate&&!confirm('Start a new dynasty setup? Your current session stays intact unless you accept a new job.'))return;
 if(!newDynastySetupDraft)newDynastySetupDraft=readNewDynastySetupDraft()||defaultNewDynastySetupDraft();
 newDynastySetupDraft.active=true;newDynastySetupPreviousUniverse=universe;writeNewDynastySetupDraft();
 $('#titleScreen').hidden=true;$('#app').hidden=true;$('#dynastySetup').hidden=false;document.body.classList.remove('dynasty-open');document.body.classList.add('setup-open');renderNewDynastySetup();
}
function exitNewDynastySetup(){
 if(newDynastySetupSubmitting)return;newDynastySetupDraft.active=false;writeNewDynastySetupDraft();invalidateNewDynastySetupCandidate();universe=newDynastySetupPreviousUniverse;newDynastySetupPreviousUniverse=null;ensureGameplayRng();if(universe)rebuildIndexes();showTitleScreen();setTitleStatus('Setup saved as a local draft. Choose New Dynasty to resume.');
}
function restoreNewDynastySetupDraft(){
 const d=readNewDynastySetupDraft();if(!d?.active)return;newDynastySetupDraft=d;newDynastySetupPreviousUniverse=universe;openNewDynastySetup();
}
function setNewDynastySetupField(field,value){
 if(!['offScheme','defScheme','trainingFocus','mode'].includes(field))return;
 if(newDynastySetupDraft[field]===value)return;newDynastySetupDraft[field]=value;newDynastySetupDraft.quickStart=false;invalidateNewDynastySetupCandidate();writeNewDynastySetupDraft();renderNewDynastySetup();
}
async function acceptNewDynastySetup(){
 if(newDynastySetupSubmitting)return false;if(!validNewDynastyCoachName(newDynastySetupDraft.coachName))return false;
 if(!newDynastySetupCandidate)buildNewDynastySetupCandidate();
 const empty=titleSaveSlots.find(s=>s.empty),target=empty||activeSlotMeta()||{slot:activeSaveSlot,label:'the selected slot',empty:true};
 if(!target.empty&&!confirm(`Replace ${target.label}? Its current dynasty will be overwritten.`))return false;
 newDynastySetupSubmitting=true;updateNewDynastySetupControls();$('#setupStatus').textContent='Creating the opening preseason checkpoint…';
 try{
  if(target.slot!==activeSaveSlot)setActiveSaveSlot(target.slot);
  universe=newDynastySetupCandidate;refreshTeamOptions(newDynastySetupDraft.program);
  universe.setup.completed=true;universe.setupCompleted=true;universe.setup.completedAt=new Date().toISOString();universe.setup.saveSlot=activeSaveSlot;
  await yieldToUserAction();await writeBrowserSave('setup');newDynastySetupSaveCount++;
  const program=newDynastySetupDraft.program,mode=newDynastySetupDraft.mode;clearNewDynastySetupDraft();newDynastySetupCandidate=null;newDynastySetupPreviousUniverse=null;newDynastySetupSubmitting=false;enterDynasty();setStatus(`${program} accepted. Your ${mode==='commissioner'?'commissioner universe':'dynasty'} is saved and ready for the 2027 preseason.`);return true;
 }catch(e){
  if(universe?.setup){universe.setup.completed=false;universe.setupCompleted=false;universe.setup.completedAt=null;universe.setup.saveSlot=null}
  newDynastySetupSubmitting=false;updateNewDynastySetupControls();$('#setupStatus').textContent=e.message||'The dynasty could not be saved. Nothing was replaced.';return false;
 }
}
async function continueNewDynastySetup(){
 const step=newDynastySetupDraft.step;if(step===1&&!validNewDynastyCoachName(newDynastySetupDraft.coachName)){updateNewDynastySetupControls();$('#setupStatus').textContent='Enter a valid coach name to continue.';$('#setupCoachName')?.focus();return}
 if(step===6){await acceptNewDynastySetup();return}
 newDynastySetupDraft.step=Math.min(6,step+1);writeNewDynastySetupDraft();renderNewDynastySetup();
}
function backNewDynastySetup(){if(newDynastySetupSubmitting||newDynastySetupDraft.step===0)return;newDynastySetupDraft.step--;writeNewDynastySetupDraft();renderNewDynastySetup()}
function quickStartNewDynastySetup(){
 newDynastySetupDraft={...defaultNewDynastySetupDraft(),active:true,step:5,coachName:'Alex Morgan',quickStart:true};writeNewDynastySetupDraft();invalidateNewDynastySetupCandidate();renderNewDynastySetup();
}
function bindNewDynastySetup(){
 $('#setupExit').onclick=exitNewDynastySetup;$('#setupBack').onclick=backNewDynastySetup;$('#setupContinue').onclick=continueNewDynastySetup;
 $('#setupContent').addEventListener('click',e=>{const quick=e.target.closest('[data-setup-quick]');if(quick){quickStartNewDynastySetup();return}const program=e.target.closest('[data-setup-program]');if(program){newDynastySetupDraft.program=program.dataset.setupProgram;newDynastySetupDraft.quickStart=false;invalidateNewDynastySetupCandidate();writeNewDynastySetupDraft();renderNewDynastySetup()}});
 $('#setupContent').addEventListener('input',e=>{if(e.target.id==='setupCoachName'){newDynastySetupDraft.coachName=e.target.value.slice(0,40);newDynastySetupDraft.quickStart=false;invalidateNewDynastySetupCandidate();writeNewDynastySetupDraft();updateNewDynastySetupControls();$('#setupCoachError')?.classList.toggle('hidden',validNewDynastyCoachName(newDynastySetupDraft.coachName)||!newDynastySetupDraft.coachName)}else if(e.target.id==='setupProgramSearch'){newDynastySetupProgramView.query=e.target.value;filterNewDynastySetupPrograms()}});
 $('#setupContent').addEventListener('change',e=>{if(e.target.dataset.setupField)setNewDynastySetupField(e.target.dataset.setupField,e.target.value);else if(e.target.id==='setupProgramConference'){newDynastySetupProgramView.conference=e.target.value;filterNewDynastySetupPrograms()}else if(e.target.id==='setupProgramSort'){newDynastySetupProgramView.sort=e.target.value;filterNewDynastySetupPrograms()}});
 $('#dynastySetup').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();exitNewDynastySetup()}else if(e.key==='Enter'&&e.target.tagName!=='BUTTON'&&e.target.tagName!=='TEXTAREA'&&!$('#setupContinue').disabled){e.preventDefault();continueNewDynastySetup()}});
}
function migrateNewDynastySetupState(target){
 if(!target||typeof target!=='object')return null;
 if(!target.setup||typeof target.setup!=='object')target.setup={version:NEW_DYNASTY_SETUP_VERSION,completed:true,source:'legacy'};
 else{target.setup.version=NEW_DYNASTY_SETUP_VERSION;if(target.setup.completed!==false)target.setup.completed=true}
 target.setupCompleted=target.setup.completed!==false;return target.setup;
}
const normalizeUniverseBeforeNewDynastySetup=normalizeUniverse;
normalizeUniverse=function(){const result=normalizeUniverseBeforeNewDynastySetup();migrateNewDynastySetupState(universe);return result};
if(typeof window!=='undefined'){
 window.DynastyLabNewDynastySetup={open:openNewDynastySetup,restore:restoreNewDynastySetupDraft,migrate:migrateNewDynastySetupState};
 if(window.__DL_TEST__)Object.assign(window.__DL_TEST__,{openNewDynastySetup,restoreNewDynastySetupDraft,migrateNewDynastySetupState,setupDebug(){return{draft:newDynastySetupDraft?{...newDynastySetupDraft}:null,candidate:!!newDynastySetupCandidate,submitting:newDynastySetupSubmitting,saveCount:newDynastySetupSaveCount,setup:universe?.setup?{...universe.setup}:null}}});
}
