(() => {
'use strict';

// Presentation-only school branding. This deliberately does not mutate universe/team
// objects or save data. A future create-a-school pass can replace this with explicit
// colors/logos without requiring migration from this visual layer.
const palettes=[
  {primary:'#173b67',secondary:'#79b4ff',rgb:'121,180,255'},
  {primary:'#6a1f2b',secondary:'#f0c56f',rgb:'240,197,111'},
  {primary:'#1f513f',secondary:'#79d7ad',rgb:'121,215,173'},
  {primary:'#47306e',secondary:'#b39cff',rgb:'179,156,255'},
  {primary:'#8a3e16',secondary:'#ffad72',rgb:'255,173,114'},
  {primary:'#155360',secondary:'#78d4df',rgb:'120,212,223'},
  {primary:'#622e46',secondary:'#ef9fbd',rgb:'239,159,189'},
  {primary:'#3d3a20',secondary:'#e8ce72',rgb:'232,206,114'},
  {primary:'#274b8b',secondary:'#8bb7ff',rgb:'139,183,255'},
  {primary:'#712829',secondary:'#ff9292',rgb:'255,146,146'},
  {primary:'#315022',secondary:'#a5d77b',rgb:'165,215,123'},
  {primary:'#55324e',secondary:'#cfa2c4',rgb:'207,162,196'},
  {primary:'#244f58',secondary:'#84c8d4',rgb:'132,200,212'},
  {primary:'#4d3c23',secondary:'#d6b67b',rgb:'214,182,123'}
];

function hashText(value){
  let h=2166136261;
  const text=String(value||'Dynasty Lab');
  for(let i=0;i<text.length;i++){
    h^=text.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function initials(name){
  const ignore=new Set(['university','state','commonwealth','metropolitan','tech','college','maritime']);
  const parts=String(name||'DL').trim().split(/\s+/).filter(Boolean);
  const meaningful=parts.filter(p=>!ignore.has(p.toLowerCase()));
  const source=meaningful.length?meaningful:parts;
  if(!source.length)return 'DL';
  if(source.length===1)return source[0].slice(0,2).toUpperCase();
  return (source[0][0]+source[source.length-1][0]).toUpperCase();
}

function applyBrand(){
  const root=document.documentElement;
  const teamNameEl=document.getElementById('teamName');
  const picker=document.getElementById('userTeam');
  const name=(teamNameEl&&teamNameEl.textContent||picker&&picker.options[picker.selectedIndex]?.text||'Dynasty Lab').trim();
  if(!name||name==='—')return;
  const palette=palettes[hashText(name)%palettes.length];
  root.style.setProperty('--team-primary',palette.primary);
  root.style.setProperty('--team-secondary',palette.secondary);
  root.style.setProperty('--team-rgb',palette.rgb);
  root.dataset.teamBrand=String(hashText(name)%palettes.length);
  root.dataset.teamMark=initials(name);
  const brandMark=document.querySelector('.topbar>div:first-child');
  if(brandMark)brandMark.setAttribute('data-team-mark',initials(name));
  document.querySelectorAll('.masthead-mark').forEach(el=>el.setAttribute('data-team-mark',initials(name)));
}

function queueBrand(){
  if(typeof requestAnimationFrame==='function')requestAnimationFrame(applyBrand);
  else setTimeout(applyBrand,0);
}

const picker=document.getElementById('userTeam');
if(picker)picker.addEventListener('change',queueBrand);
const teamNameEl=document.getElementById('teamName');
if(teamNameEl&&typeof MutationObserver!=='undefined'){
  new MutationObserver(queueBrand).observe(teamNameEl,{childList:true,subtree:true,characterData:true});
}

document.addEventListener('click',event=>{
  if(event.target&&event.target.closest&&event.target.closest('#applyProgramEdit'))setTimeout(applyBrand,0);
});

applyBrand();
})();
