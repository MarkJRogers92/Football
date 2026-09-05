(() => {
'use strict';

// Presentation-only completion pass for legacy surfaces that still expose team names
// instead of numeric IDs. The atlas itself remains keyed only by numeric teamId.
const TEAM_LOGO_ATLAS='assets/team-logos-atlas-32.png';
const TEAM_LOGO_COLS=12,TEAM_LOGO_ROWS=10;
const TEAM_NAMES=[
'Chicago Metropolitan','Great Lakes University','Wisconsin Commonwealth','Milwaukee State','Michigan Commonwealth','Detroit Metropolitan','Lake Erie University','Ohio Western','Indiana Commonwealth','Fort Wayne State','Twin Cities University','Iowa Lakes University',
'New England Commonwealth','Massachusetts Bay University','Hudson University','New York Metropolitan','Long Island State','Connecticut Commonwealth','Rhode Island Maritime','Vermont State','New Hampshire Tech','Maine Commonwealth','Delaware Valley University','Jersey Coastal University',
'Chesapeake University','Potomac Commonwealth','Virginia Commonwealth Tech','Tidewater State','Blue Ridge University','Carolina Commonwealth','Piedmont University','Cape Fear State','Palmetto University','Charleston Maritime','Appalachian Commonwealth','Shenandoah University',
'Georgia Commonwealth','Georgia Coastal','Florida Commonwealth','South Florida Metropolitan','Florida Gulf University','Alabama Commonwealth','Mobile State','Tennessee Commonwealth','Knoxville Tech','Mississippi Commonwealth','Magnolia State','Kentucky Commonwealth',
'Louisiana Commonwealth','New Orleans University','Acadiana State','Gulf Coast Tech','Houston Metropolitan','East Texas University','Arkansas Delta','Ozark Commonwealth','Memphis Metropolitan','Red River University','Coastal Bend State','Gulf Plains University',
'Missouri Commonwealth','St. Louis Metropolitan','Kansas Commonwealth','Prairie Tech','Nebraska Commonwealth','Omaha State','Iowa Commonwealth','Dakota University','North Dakota Commonwealth','Oklahoma Northern','Springfield State','Central Plains University',
'Texas Republic University','Lone Star Tech','Fort Worth State','San Antonio Commonwealth','West Texas University','Rio Grande State','Oklahoma Commonwealth','Red Dirt University','New Mexico Commonwealth','Santa Fe Tech','Arizona Commonwealth','Desert State University',
'Colorado Commonwealth','Front Range University','Utah Commonwealth','Wasatch Tech','Boise Commonwealth','Montana Commonwealth','Big Sky State','Wyoming State','Nevada Commonwealth','Las Vegas Metropolitan','Idaho Northern','Rocky Mountain University',
'Southern California Commonwealth','Los Angeles Metropolitan','California Pacific','Bay Area University','Sacramento State College','Central California Tech','Oregon Commonwealth','Cascade University','Washington Commonwealth','Puget Sound State','Hawaii Commonwealth','Alaska Pacific',
'Philadelphia Metropolitan','Pittsburgh Commonwealth','Baltimore Metropolitan','Cincinnati Commonwealth','Louisville Metropolitan','Nashville Tech','Indianapolis Metropolitan','Columbus Metropolitan','Buffalo State University','Pittsburgh Tech','Richmond Metropolitan','Toronto International University'
];
if(TEAM_NAMES.length!==120)console.error('Dynasty Lab branding coverage roster mismatch',TEAM_NAMES.length);
const TEAM_ID_BY_NAME=new Map(TEAM_NAMES.map((name,index)=>[name,index+1]));
const TEAM_NAMES_LONGEST=[...TEAM_NAMES].sort((a,b)=>b.length-a.length);

function idsInText(value){
 const text=String(value||'');
 const ids=[];
 for(const name of TEAM_NAMES_LONGEST)if(text.includes(name))ids.push(TEAM_ID_BY_NAME.get(name));
 return [...new Set(ids)];
}
function idForExactName(value){return TEAM_ID_BY_NAME.get(String(value||'').trim())||null}
function selectedTeamId(){
 const name=(document.querySelector('#teamName')?.textContent||document.querySelector('#userTeam')?.selectedOptions?.[0]?.textContent||'').trim();
 return idForExactName(name);
}
function schoolName(id){return TEAM_NAMES[id-1]||'Program'}
function atlasStyle(id,size){
 const idx=id-1,col=idx%TEAM_LOGO_COLS,row=Math.floor(idx/TEAM_LOGO_COLS);
 return {
  backgroundImage:`url('${TEAM_LOGO_ATLAS}')`,
  backgroundSize:`${TEAM_LOGO_COLS*size}px ${TEAM_LOGO_ROWS*size}px`,
  backgroundPosition:`-${col*size}px -${row*size}px`
 };
}
function applyAtlas(el,id,size){
 if(!el||!Number.isInteger(id)||id<1||id>120)return false;
 const px=Math.max(14,Math.round(size||el.getBoundingClientRect?.().width||parseFloat(getComputedStyle(el).width)||24));
 const s=atlasStyle(id,px);
 el.style.backgroundImage=s.backgroundImage;
 el.style.backgroundSize=s.backgroundSize;
 el.style.backgroundPosition=s.backgroundPosition;
 el.style.backgroundRepeat='no-repeat';
 el.style.backgroundColor='transparent';
 el.textContent='';
 el.dataset.coverageTeamId=String(id);
 el.classList.add('coverage-real-logo');
 el.setAttribute('role','img');
 el.setAttribute('aria-label',`${schoolName(id)} logo`);
 return true;
}
function createLogo(id,size=18,className='coverage-inline-team-logo'){
 const el=document.createElement('span');
 el.className=className;
 el.style.width=`${size}px`;el.style.height=`${size}px`;
 applyAtlas(el,id,size);
 return el;
}
function teamIdFromContainer(el){
 if(!el)return null;
 const strong=el.querySelector?.('strong');
 const exact=idForExactName(strong?.textContent);
 if(exact)return exact;
 const ids=idsInText(el.textContent);
 return ids.length===1?ids[0]:null;
}

function ensureStyles(){
 if(document.querySelector('#teamLogoCoverageStyles'))return;
 const style=document.createElement('style');style.id='teamLogoCoverageStyles';style.textContent=`
.topbar>div:first-child.coverage-has-real-logo::before{display:none!important}
.topbar-team-logo{position:absolute!important;left:0;top:50%;transform:translateY(-50%);display:block;width:36px;height:36px;border:1px solid color-mix(in srgb,var(--team-secondary) 55%,#39516e);border-radius:9px;background-color:#101b29!important;box-shadow:inset 0 1px rgba(255,255,255,.10),0 8px 22px rgba(0,0,0,.28);overflow:hidden}
.masthead-mark.coverage-has-real-logo::before{display:none!important}
.masthead-mark.coverage-has-real-logo{color:transparent}
.coverage-real-logo{background-repeat:no-repeat!important;color:transparent!important;text-shadow:none!important;letter-spacing:0!important;overflow:hidden}
.sports-mark.coverage-real-logo{background-color:#0f1721!important}
.player-hero-team-mark span.coverage-real-logo,.commitment-school b.coverage-real-logo{display:inline-block!important;border-color:color-mix(in srgb,var(--team-secondary) 48%,#30455d)!important;background-color:#101823!important}
.coverage-inline-team-logo{display:inline-block;flex:0 0 auto;margin-right:6px;vertical-align:-4px;border-radius:4px;background-color:transparent!important}
.battle-school .coverage-inline-team-logo{margin-right:4px;vertical-align:-5px}
.historyrow .coverage-inline-team-logo,.lineitem .coverage-inline-team-logo,.award-card .coverage-inline-team-logo,.leader-row .coverage-inline-team-logo{margin-right:6px}
`;
 document.head.appendChild(style);
}

function patchTopbar(){
 const id=selectedTeamId(),host=document.querySelector('.topbar>div:first-child');
 if(!id||!host)return;
 let logo=host.querySelector('.topbar-team-logo');
 if(!logo){logo=createLogo(id,36,'topbar-team-logo');host.prepend(logo)}
 else if(+logo.dataset.coverageTeamId!==id)applyAtlas(logo,id,36);
 host.classList.add('coverage-has-real-logo');
}
function patchMasthead(){
 for(const host of document.querySelectorAll('.masthead-mark')){
  const logo=host.querySelector('.team-logo:not(.team-logo--fallback)');
  host.classList.toggle('coverage-has-real-logo',!!logo);
 }
}
function patchSportsMarks(){
 for(const mark of document.querySelectorAll('.sports-mark:not(.coverage-real-logo)')){
  if(mark.classList.contains('has-logo'))continue;
  const row=mark.closest('.rankrow');
  if(row?.querySelector('.team-logo')){mark.remove();continue}
  let id=null;
  const host=mark.closest('.broadcast-team,.matchup-team,.sb-team');
  if(host)id=teamIdFromContainer(host);
  if(!id&&mark.closest('.broadcast-final'))id=selectedTeamId();
  if(!id)id=teamIdFromContainer(mark.parentElement);
  if(id)applyAtlas(mark,id);
 }
}
function patchPlayerHero(){
 for(const host of document.querySelectorAll('.player-hero-team-mark')){
  const school=host.querySelector('small')?.textContent?.trim(),id=idForExactName(school),badge=host.querySelector('span');
  if(id&&badge&&+badge.dataset.coverageTeamId!==id)applyAtlas(badge,id,25);
 }
}
function patchCommitmentSchool(){
 for(const host of document.querySelectorAll('.commitment-school')){
  const school=host.querySelector('span')?.textContent?.trim(),id=idForExactName(school),badge=host.querySelector('b');
  if(id&&badge&&+badge.dataset.coverageTeamId!==id){
   const px=Math.max(28,Math.round(badge.getBoundingClientRect?.().width||36));
   applyAtlas(badge,id,px);
  }
 }
}
function decorateSingleTeam(el,size=18){
 if(!el)return;
 const ids=idsInText(el.textContent);
 if(ids.length!==1)return;
 const id=ids[0],existing=el.querySelector(':scope > .coverage-inline-team-logo');
 if(existing&&+existing.dataset.coverageTeamId===id)return;
 existing?.remove();
 el.prepend(createLogo(id,size));
}
function patchInlineIdentity(){
 const targets=[
  ['#recruitBattleBoard .battle-school',16],
  ['#recruitDialogBody .profile-section .lineitem > span:first-child',18],
  ['#stats .leader-row .small.muted',16],
  ['#awardsBoard .award-card > div:nth-child(2)',18],
  ['#draftBoard .lineitem > span:last-child',18],
  ['#nationalRecords .record-value',18],
  ['#historyLog .historyrow > strong',20],
  ['#historyLog .historyrow > span:first-child',18],
  ['#historyLog .historyrow > span:last-child',18],
  ['#archiveResults .lineitem > span:last-child',18],
  ['#coachDialogMeta',18],
  ['#coachDialogBody .lineitem > span:first-child',18],
  ['#coachDialogBody .timeline-row strong',18]
 ];
 for(const [selector,size] of targets)for(const el of document.querySelectorAll(selector))decorateSingleTeam(el,size);
}

let queued=false;
function run(){
 queued=false;ensureStyles();patchTopbar();patchMasthead();patchSportsMarks();patchPlayerHero();patchCommitmentSchool();patchInlineIdentity();
}
function queue(){
 if(queued)return;queued=true;
 if(window.requestAnimationFrame)window.requestAnimationFrame(run);else setTimeout(run,0);
}

const picker=document.querySelector('#userTeam');
picker?.addEventListener('change',()=>setTimeout(queue,0));
document.addEventListener('click',()=>setTimeout(queue,0));
if(window.MutationObserver&&document.body)new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});
queue();
})();
