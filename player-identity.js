(() => {
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let lastPlayerId=null,lastSig='';
function chips(snap){return (snap.chips||[]).map(c=>`<span class="pi-chip pi-chip-${esc(c.kind)}">${esc(c.label)}</span>`).join('')}
function stat(label,value,detail=''){return `<div class="pi-stat"><span>${esc(label)}</span><strong>${esc(value||'—')}</strong>${detail?`<small>${esc(detail)}</small>`:''}</div>`}
function render(){
 const dialog=document.querySelector('#playerDialog'),api=globalThis.DynastyLabPlayerIdentity;if(!dialog?.open||!api?.snapshot||!lastPlayerId)return;
 const snap=api.snapshot(lastPlayerId);if(!snap?.player)return;const p=snap.player,h=snap.headline;
 const sig=[p.id,p.teamId,p.status,h.role,h.scheme,h.current,h.upside,h.confidence,p.healthLabel,p.seasonProduction,p.developmentNote,p.roles.join('|')].join('::');if(sig===lastSig&&document.querySelector('#playerIdentityHero'))return;lastSig=sig;
 dialog.classList.add('player-identity-enhanced');dialog.dataset.playerIdentity=String(p.id);dialog.dataset.playerNumber=String(p.jerseyNumber??0);if(globalThis.DynastyProgramBranding?.applyVars&&p.teamId)globalThis.DynastyProgramBranding.applyVars(dialog,p.teamId);
 let root=document.querySelector('#playerIdentityHero');if(!root){root=document.createElement('section');root.id='playerIdentityHero';root.className='player-identity-hero';document.querySelector('#playerDialogBody')?.insertAdjacentElement('beforebegin',root)}if(!root)return;
 root.innerHTML=`<div class="pi-teamline"><span>${esc(p.teamName||'Dynasty Lab')}</span><span>${esc(p.status)}</span></div><div class="pi-chips">${chips(snap)}</div><div class="pi-grid"><div class="pi-role-card"><span class="eyebrow">FOOTBALL ROLE</span><strong>${esc(h.role)}</strong><div><b>${esc(p.pos)}</b><span>${esc(p.eligibility)} · ${esc(p.height)} / ${esc(p.weight)}</span></div>${p.schemeFit!=null?`<small>Scheme fit <b>${esc(h.scheme)}</b></small>`:''}</div><div class="pi-evaluation"><span class="eyebrow">STAFF EVALUATION</span><div class="pi-eval-grid">${stat('Current',h.current)}${stat('Upside',h.upside)}${stat('Confidence',h.confidence)}</div><small>Staff-facing ranges only. Hidden true talent and growth remain private.</small></div><div class="pi-production"><span class="eyebrow">CURRENT PRODUCTION</span><strong>${esc(p.seasonProduction)}</strong><small>${esc(p.healthLabel)}</small></div></div><div class="pi-devline"><div><span>DEVELOPMENT READ</span><strong>${esc(p.developmentNote||'No current staff development read.')}</strong></div><div><span>FOCUS</span><strong>${esc(p.trainingFocus||'Balanced')}</strong></div>${p.positionFamiliarity!=null?`<div><span>FAMILIARITY</span><strong>${esc(p.positionFamiliarity)}%</strong></div>`:''}<div><span>WEAR</span><strong>${esc(p.wear??0)}/100</strong></div></div>`;
}
function queue(){setTimeout(render,0)}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-player]');if(b?.dataset.player){lastPlayerId=b.dataset.player;lastSig='';queue()}},true);
const dialog=document.querySelector('#playerDialog'),name=document.querySelector('#playerDialogName');if(dialog&&window.MutationObserver)new MutationObserver(()=>{if(!dialog.open){lastSig='';return}queue()}).observe(dialog,{attributes:true,attributeFilter:['open']});if(name&&window.MutationObserver)new MutationObserver(queue).observe(name,{childList:true,subtree:true,characterData:true});
})();
