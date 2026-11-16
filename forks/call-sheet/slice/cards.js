// Call Sheet slice: card faces. Plays get procedurally drawn chalk diagrams; rarity sets the frame.
(function(root){
'use strict';
const D=root.CallSheet.data;
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const FAM={run:'#6fd25a',quick:'#3fc1ff',deep:'#c07bff',constraint:'#ff9a3c',zone:'#3fc1ff',man:'#ff5a5a',pressure:'#ff9a3c'};
const ROUTES={
  inside_zone:'M50 40 L50 20',outside_zone:'M50 42 Q72 42 82 22',power:'M44 36 L57 36 M50 42 L54 18',read_option:'M50 38 Q34 36 26 18 M50 38 L57 22',
  quick_slant:'M78 34 L78 30 L60 18',stick:'M66 34 L66 22 L60 22',deep_cross:'M82 34 L82 24 L20 8',vertical_shot:'M16 34 L16 2',
  pa_boot:'M50 40 L64 40 M50 38 L32 40 M82 34 L82 22 L34 12',screen:'M50 40 L28 40 M44 34 L28 28',draw:'M50 42 L50 40 L50 16',
  four_verts:'M16 34 L16 2 M34 34 L34 4 M66 34 L66 4 M84 34 L84 2',statue_left:'M50 42 L44 44 L22 30 L14 8'
};
ROUTES.inside_zone_plus=ROUTES.inside_zone;ROUTES.quick_slant_plus=ROUTES.quick_slant;ROUTES.pa_boot_plus=ROUTES.pa_boot;
const DEF={two_high:[[30,6],[70,6]],cover1:[[50,4]],cover3:[[20,8],[50,6],[80,8]],run_fit:[[50,18],[36,22],[64,22]],zone_pressure:[[50,6]],cover0:[],sim_pressure:[[50,6]],two_man:[[28,6],[72,6]],robber:[[50,16],[50,4]],bear:[[50,6]],corner_blitz:[[50,6]],cover2_trap:[[28,6],[72,6]],midnight_mirage:[[28,6],[72,6]]};
const RUSH={zone_pressure:[[36,24,44,36],[64,24,56,36]],cover0:[[30,22,42,36],[50,20,50,36],[70,22,58,36],[18,26,36,36]],sim_pressure:[[40,22,46,36]],bear:[[44,24,46,35],[56,24,54,35]],corner_blitz:[[10,30,36,36]],midnight_mirage:[[36,24,44,36],[64,24,56,36]]};
function diagram(id,side){
  let s=`<svg viewBox="0 0 100 48" aria-hidden="true"><rect width="100" height="48" fill="#0e2414"/>`;
  for(const x of [10,30,50,70,90])s+=`<line x1="${x}" y1="0" x2="${x}" y2="48" stroke="rgba(255,255,255,.06)"/>`;
  s+=`<line x1="0" y1="34" x2="100" y2="34" stroke="rgba(255,255,255,.3)" stroke-dasharray="2 3"/>`;
  for(const x of [38,44,50,56,62])s+=`<circle cx="${x}" cy="37.5" r="2.6" fill="none" stroke="#efe6d2" stroke-width="1.3"/>`;
  for(const [x,y] of [[50,43],[16,36],[84,36],[68,36]])s+=`<circle cx="${x}" cy="${y}" r="2.4" fill="none" stroke="#efe6d2" stroke-width="1.3"/>`;
  if(side==='off'){
    s+=`<path d="${ROUTES[id]||''}" fill="none" stroke="#ffe066" stroke-width="2" stroke-linecap="round" marker-end="url(#ah)" filter="url(#gl)"/>`;
  }else{
    for(const x of [41,47,53,59])s+=`<text x="${x-2.2}" y="31" font-size="6.5" font-weight="900" fill="#ff6b5e">✕</text>`;
    for(const [x,y] of DEF[id]||[])s+=`<circle cx="${x}" cy="${y}" r="4.2" fill="none" stroke="#ff6b5e" stroke-width="1.6"/>`;
    for(const [x1,y1,x2,y2] of RUSH[id]||[])s+=`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#ffb03c" stroke-width="2" marker-end="url(#ah2)"/>`;
  }
  return s+`<defs><filter id="gl" filterUnits="userSpaceOnUse" x="0" y="0" width="100" height="48"><feGaussianBlur stdDeviation=".8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <marker id="ah" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L6 3L0 6z" fill="#ffe066"/></marker>
  <marker id="ah2" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L6 3L0 6z" fill="#ffb03c"/></marker></defs></svg>`;
}
function def(id){return D.PLAYS[id]||D.CALLS[id]||D.TACTICS[id]}
// Real faces from Dynasty Lab's deterministic portrait renderer, when it's loaded.
function paintPortrait(cv,p,colors,size=96){
  try{const DP=window.DynastyPortraits;if(!DP)return false;
    DP.renderPlayerPortrait({portraitSeed:p.portraitSeed||`cs-${p.playerId||p.id}-${p.name}`,pos:p.pos,jerseyNumber:p.number,height:p.height,weight:p.weight},{primary:colors?.[0]||'#2a3550',secondary:colors?.[1]||'#e8e2d0'},cv,{size,frame:'card',pixelRatio:Math.min(2,window.devicePixelRatio||1)});
    cv.style.width=cv.style.height=`${size}px`;return true}catch(e){return false}
}
function kindOf(id){return D.PLAYS[id]?'play':D.CALLS[id]?'call':'tactic'}
// opts: {cost, base, blocked, selected, notch, why, small, compact}
function card(id,opts={}){
  const c=def(id),kind=kindOf(id),rarity=D.rarityOf(id),fam=c.family||'',side=c.side;
  const el=document.createElement('button');el.type='button';
  el.className=`card k-${kind} r-${rarity}${opts.selected?' sel':''}${opts.blocked?' blocked':''}${c.info?' info':''}${opts.small?' small':''}`;
  el.dataset.id=id;el.style.setProperty('--fam',FAM[fam]||'#e5c766');
  let type;
  if(kind==='play')type=`${fam}${c.trick?' · trick':''}${opts.base?' · base':''}`;
  else if(kind==='call')type=`${c.coverage} · ${c.box} box${c.pressure?` · ${c.pressure===2?'all-out':'blitz'}`:''}${c.trick?' · trick':''}`;
  else type=c.info?'info · plays now':'tactic';
  const sg=c.signature;
  const art=sg?`<div class="sigart"><canvas class="sigface" width="58" height="58"></canvas><div class="signum">#${esc(sg.number)}<small>${esc(sg.role)}</small></div></div>`:kind==='tactic'?`<div class="ticon">${esc(c.icon)}</div>`:diagram(c.evolvedFrom||c.upgradeOf||id,side);
  el.innerHTML=`<span class="frame"></span><span class="cost">${opts.cost??c.cost}</span>
    <span class="cname">${esc(c.name)}</span><span class="art">${art}</span><span class="ctype">${esc(type)}</span>
    <span class="ctext">${esc(String(c.text).replace(/^EVOLVED · /,''))}</span>${opts.why?`<span class="cwhy">${esc(opts.why)}</span>`:''}${opts.notch?'<span class="notch">PUNISHES LEAN</span>':''}
    ${rarity!=='common'?`<span class="rar">${rarity==='evolved'?'evolved · '+esc(c.branch||''):rarity==='signature'?'signature · '+esc(sg.archetype):rarity}</span>`:''}${opts.mastery?`<span class="mbar ${opts.mastery.reps>=opts.mastery.need?'full':''}" title="Reps toward evolution"><i style="width:${Math.min(100,opts.mastery.reps/opts.mastery.need*100)}%"></i></span>`:''}<span class="shine"></span>`;
  el.setAttribute('aria-label',`${c.name}, costs ${opts.cost??c.cost}. ${c.text}${opts.why?' '+opts.why:''}`);
  if(sg){const cv=el.querySelector('.sigface');paintPortrait(cv,sg,sg.colors,58)}
  // 3D tilt and moving shine.
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--rx',`${(.5-y)*14}deg`);el.style.setProperty('--ry',`${(x-.5)*16}deg`);el.style.setProperty('--sx',`${x*100}%`);el.style.setProperty('--sy',`${y*100}%`)});
  el.addEventListener('pointerleave',()=>{el.style.setProperty('--rx','0deg');el.style.setProperty('--ry','0deg')});
  return el;
}
root.SliceCards={card,diagram,def,kindOf,FAM,esc,paintPortrait};
})(window);
