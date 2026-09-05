(() => {
'use strict';

// Presentation-only school branding. v0.9.43 replaces the old name-hash palette
// with the canonical numeric-team-ID color registry in program-branding.js.
function teamIdFromLogo(el){
 if(!el)return null;
 const explicit=Number(el.dataset?.teamId||el.dataset?.coverageTeamId||el.dataset?.brandTeamId);
 if(Number.isInteger(explicit)&&explicit>=1&&explicit<=120)return explicit;
 const size=parseFloat(el.style.width)||parseFloat(getComputedStyle(el).width)||0;
 const pos=String(el.style.backgroundPosition||'').match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/);
 if(!size||!pos)return null;
 const col=Math.round(Math.abs(Number(pos[1]))/size),row=Math.round(Math.abs(Number(pos[2]))/size),id=row*12+col+1;
 return Number.isInteger(id)&&id>=1&&id<=120?id:null;
}
function selectedTeamId(){
 return teamIdFromLogo(document.querySelector('.masthead-mark .team-logo:not(.team-logo--fallback)'))
  ||teamIdFromLogo(document.querySelector('.topbar-team-logo'));
}
function applyBrand(){
 const branding=window.DynastyProgramBranding,id=selectedTeamId();
 if(!branding||!id)return;
 const root=document.documentElement,brand=branding.applyRoot(id);
 root.dataset.teamBrand=String(id);
 root.dataset.teamBrandPrimary=brand.primary;
 root.dataset.teamBrandSecondary=brand.secondary;
 root.dataset.teamBrandAccent=brand.accent;
}
function queueBrand(){
 if(typeof requestAnimationFrame==='function')requestAnimationFrame(applyBrand);
 else setTimeout(applyBrand,0);
}

const picker=document.getElementById('userTeam');
if(picker)picker.addEventListener('change',queueBrand);
const teamNameEl=document.getElementById('teamName');
if(teamNameEl&&typeof MutationObserver!=='undefined')new MutationObserver(queueBrand).observe(teamNameEl,{childList:true,subtree:true,characterData:true});
const masthead=document.querySelector('.masthead-mark');
if(masthead&&typeof MutationObserver!=='undefined')new MutationObserver(queueBrand).observe(masthead,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});

document.addEventListener('click',event=>{
 if(event.target&&event.target.closest&&event.target.closest('#applyProgramEdit'))setTimeout(applyBrand,0);
});

applyBrand();
})();
