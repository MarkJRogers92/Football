(() => {
'use strict';

// v0.9.43 presentation adapter: after the real-logo coverage pass has attached a
// numeric team identity to the UI, project that same teamId into the color registry.
const BRAND=window.DynastyProgramBranding;
if(!BRAND)return;

function idFromLogo(el){
 if(!el)return null;
 const explicit=Number(el.dataset?.coverageTeamId||el.dataset?.teamId||el.dataset?.brandTeamId);
 if(Number.isInteger(explicit)&&explicit>=1&&explicit<=BRAND.teamCount)return explicit;
 if(!String(el.style.backgroundImage||'').includes('team-logos-atlas-32.png'))return null;
 const size=parseFloat(el.style.width)||parseFloat(getComputedStyle(el).width)||0;
 const pos=String(el.style.backgroundPosition||'').match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/);
 if(!size||!pos)return null;
 const col=Math.round(Math.abs(Number(pos[1]))/size),row=Math.round(Math.abs(Number(pos[2]))/size),id=row*12+col+1;
 return Number.isInteger(id)&&id>=1&&id<=BRAND.teamCount?id:null;
}
function brandLogo(el){
 const id=idFromLogo(el);
 if(id)BRAND.applyVars(el,id);
 return id;
}
function brandHost(host){
 if(!host)return;
 const ids=new Set();
 for(const logo of host.querySelectorAll('.team-logo:not(.team-logo--fallback),.coverage-real-logo')){
  const id=brandLogo(logo);if(id)ids.add(id);
 }
 if(ids.size===1)BRAND.applyVars(host,[...ids][0]);
 else if(ids.size>1){host.removeAttribute('data-brand-team-id')}
}

const SINGLE_TEAM_HOSTS=[
 '#top15 .rankrow',
 '#confStandings .rankrow',
 '#teamSchedule .resultrow',
 '#recruitBattleBoard .battle-school',
 '#stats .leader-row',
 '#awardsBoard .award-card',
 '#archiveResults .lineitem',
 '#historyLog .historyrow',
 '.player-hero-team-mark',
 '.commitment-school',
 '.broadcast-team',
 '.matchup-team',
 '.sb-team'
];

let queued=false;
function run(){
 queued=false;
 document.querySelectorAll('.team-logo:not(.team-logo--fallback),.coverage-real-logo').forEach(brandLogo);
 for(const selector of SINGLE_TEAM_HOSTS)document.querySelectorAll(selector).forEach(brandHost);
 // If the selected-team render landed after visual-identity.js, make the root catch up.
 const selected=idFromLogo(document.querySelector('.masthead-mark .team-logo:not(.team-logo--fallback)'));
 if(selected&&Number(document.documentElement.dataset.teamBrandId)!==selected)BRAND.applyRoot(selected);
}
function queue(){
 if(queued)return;queued=true;
 if(window.requestAnimationFrame)requestAnimationFrame(run);else setTimeout(run,0);
}

document.querySelector('#userTeam')?.addEventListener('change',()=>setTimeout(queue,0));
document.addEventListener('click',()=>setTimeout(queue,0));
if(window.MutationObserver&&document.body)new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true});
queue();
})();
