// Recruiting map: every recruit plotted at his real hometown, with your commits arcing to campus.
// Coordinates come from the recruit and school records; the outline is a simplified contiguous US
// plus Alaska and Hawaii insets. Status colours are a CVD-validated trio, and shape carries the
// same meaning so colour is never the only cue.
const RECRUIT_MAP_US=[[-124.7,48.4],[-123.1,49],[-95.2,49],[-94.8,49.4],[-94.6,48.7],[-93,48.6],[-91,48.2],[-89.6,48],[-88.4,48.3],[-84.8,46.9],[-84.1,46.5],[-83.5,46.1],[-82.4,45.3],[-82.5,43],[-83.1,42.1],[-82.6,41.7],[-79.8,42.3],[-79,43.3],[-76.8,43.6],[-75,44.9],[-71.5,45],[-70.8,45.4],[-70,46.7],[-69.2,47.4],[-67.8,47.1],[-67.8,45.7],[-67,44.8],[-68.8,44.3],[-70.2,43.7],[-70.8,42.9],[-70.6,42],[-70,41.8],[-71.4,41.4],[-72.9,41.2],[-74,40.6],[-74.1,39.8],[-74.9,38.9],[-75.5,38.5],[-75.9,37.3],[-76.3,36.9],[-75.5,35.2],[-76.5,34.7],[-77.9,33.9],[-79.2,33.2],[-80.8,32.1],[-81.4,31],[-81.3,29.7],[-80.5,28.1],[-80,26.7],[-80.4,25.2],[-81.1,25.1],[-81.8,26.1],[-82.7,27.5],[-82.9,29.1],[-84,30],[-85.4,29.7],[-86.5,30.4],[-88,30.4],[-89.6,30.2],[-89.4,29.2],[-90.2,29.1],[-91.3,29.3],[-92.3,29.6],[-93.8,29.7],[-94.8,29.3],[-96.4,28.4],[-97.2,27.6],[-97.4,26],[-99.1,26.4],[-99.5,27.5],[-100.3,28.3],[-101.4,29.8],[-102.4,29.8],[-103.1,29],[-104.5,29.6],[-106.4,31.8],[-108.2,31.8],[-108.2,31.3],[-111.1,31.3],[-114.8,32.5],[-117.1,32.5],[-117.3,33.2],[-118.5,34],[-120.6,34.6],[-121.9,36.6],[-122.5,37.8],[-123.7,39],[-124.2,40.4],[-124.2,42],[-124.5,43],[-124,46.3],[-124.7,48.4]];
const RECRUIT_MAP_AK=[[-141,69.6],[-156.8,71.3],[-166.4,68.9],[-162,66.5],[-166,65.3],[-164.6,63.2],[-166,61.5],[-161.9,58.7],[-157.5,58.8],[-162,55.2],[-152,57.5],[-150.5,59.5],[-146,60.5],[-141,60],[-135,58.5],[-131,55.3],[-133.5,57.8],[-137,59.2],[-141,60]];
const RECRUIT_MAP_HI=[[-155.5,19.6,.55],[-156.3,20.8,.3],[-158,21.45,.25],[-159.5,22.05,.22]];
const RECRUIT_MAP_W=1000,RECRUIT_MAP_H=560;
function recruitMapProject(lat,lon){
 if(lat>50&&lon<-129)return[20+(lon+170)*3.3,RECRUIT_MAP_H-8-(lat-51)*5.4];          // Alaska inset
 if(lon<-150&&lat<24)return[225+(lon+160.5)*13,RECRUIT_MAP_H-18-(lat-18.8)*13];      // Hawaii inset
 return[(lon+125)*.788*21.7+4,(49.6-lat)*21.7+6];
}
const recruitMapPath=pts=>pts.map(([lon,lat],i)=>{const [x,y]=recruitMapProject(lat,lon);return`${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`}).join('')+'Z';
// Miles to map units near a latitude, for the distance rings around campus.
function recruitMapMiles(miles){return miles/69*21.7}
const RECRUIT_MAP_STATUS=[
 {id:'mine',label:'Committed to you'},{id:'target',label:'Your targets'},{id:'elsewhere',label:'Committed elsewhere'},{id:'open',label:'Uncommitted'}];
let recruitMapFilter='3';
function recruitMapJitter(id){let h=2166136261;for(const c of String(id)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}const a=(h%360)*Math.PI/180,r=((h>>>9)%100)/100*6;return[Math.cos(a)*r,Math.sin(a)*r]}
function recruitMapModel(t=selected()){
 if(!t||!universe?.recruits?.length)return null;
 const min=recruitMapFilter==='all'?0:Number(recruitMapFilter);
 const status=r=>r.committed===t.name?'mine':r.targeted&&!r.committed?'target':r.committed?'elsewhere':'open';
 const recruits=universe.recruits.filter(r=>Number.isFinite(r.lat)&&Number.isFinite(r.lon)).map(r=>({r,status:status(r)}))
  .filter(x=>x.status==='mine'||x.status==='target'||(x.r.stars||0)>=min);
 const counts=Object.fromEntries(RECRUIT_MAP_STATUS.map(s=>[s.id,recruits.filter(x=>x.status===s.id).length]));
 return{team:t,recruits,counts,campus:recruitMapProject(t.lat||0,t.lon||0)};
}
function recruitMapHTML(m){
 const [cx,cy]=m.campus,order={open:0,elsewhere:1,target:2,mine:3};
 const marks=m.recruits.slice().sort((a,b)=>order[a.status]-order[b.status]||(a.r.stars||0)-(b.r.stars||0)).map(({r,status})=>{
  const [px,py]=recruitMapProject(r.lat,r.lon),[jx,jy]=recruitMapJitter(r.id),x=px+jx,y=py+jy,s=(2+(r.stars||1)*1.2)*(status==='elsewhere'?.8:1);
  const shape=status==='target'?`<path d="M${x.toFixed(1)},${(y-s-1).toFixed(1)}l${s+1},${s+1}l-${s+1},${s+1}l-${s+1},-${s+1}z"/>`:`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(status==='open'?s*.7:s).toFixed(1)}"/>`;
  return`<g class="rm-mark rm-s-${status}" data-rm-recruit="${esc(r.id)}" tabindex="-1">${shape}</g>`;
 }).join('');
 const arcs=m.recruits.filter(x=>x.status==='mine').map(({r})=>{const [px,py]=recruitMapProject(r.lat,r.lon),[jx,jy]=recruitMapJitter(r.id),x=px+jx,y=py+jy,mx=(x+cx)/2,my=Math.min(y,cy)-Math.hypot(x-cx,y-cy)*.22;return`<path d="M${x.toFixed(1)},${y.toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}"/>`}).join('');
 const schools=universe.teams.filter(s=>s.id!==m.team.id&&Number.isFinite(s.lat)).map(s=>{const [x,y]=recruitMapProject(s.lat,s.lon);return`<rect x="${(x-1.6).toFixed(1)}" y="${(y-1.6).toFixed(1)}" width="3.2" height="3.2"/>`}).join('');
 const hawaii=RECRUIT_MAP_HI.map(([lon,lat,r])=>{const [x,y]=recruitMapProject(lat,lon);return`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(r*13).toFixed(1)}" ry="${(r*9).toFixed(1)}"/>`}).join('');
 const filters=[['3','3★ and up'],['4','4★ and up'],['5','5★ only'],['all','All recruits']].map(([v,l])=>`<button type="button" data-rm-filter="${v}" aria-pressed="${recruitMapFilter===v}">${l}</button>`).join('');
 const legend=RECRUIT_MAP_STATUS.map(s=>`<span class="rm-key rm-s-${s.id}"><i></i>${esc(s.label)} <b>${m.counts[s.id]}</b></span>`).join('');
 return`<div class="section-head"><div><div class="eyebrow">RECRUITING MAP</div><h3>Where your class is coming from</h3></div><div class="rm-filters" role="group" aria-label="Star filter">${filters}</div></div>
 <div class="rm-legend">${legend}<span class="rm-key rm-s-ring"><i></i>250 / 500 miles from campus</span></div>
 <div class="rm-stage"><svg viewBox="0 0 ${RECRUIT_MAP_W} ${RECRUIT_MAP_H}" role="img" aria-label="${esc(`Map of ${m.recruits.length} recruits: ${m.counts.mine} committed to ${m.team.name}, ${m.counts.target} targets`)}">
  <path class="rm-land" d="${recruitMapPath(RECRUIT_MAP_US)}"/><path class="rm-land" d="${recruitMapPath(RECRUIT_MAP_AK)}"/><g class="rm-land">${hawaii}</g>
  <rect class="rm-inset" x="8" y="${RECRUIT_MAP_H-128}" width="160" height="122" rx="6"/><rect class="rm-inset" x="176" y="${RECRUIT_MAP_H-72}" width="120" height="66" rx="6"/>
  <circle class="rm-ring" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${recruitMapMiles(250).toFixed(1)}"/><circle class="rm-ring" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${recruitMapMiles(500).toFixed(1)}"/>
  <g class="rm-schools">${schools}</g><g class="rm-arcs">${arcs}</g><g class="rm-marks">${marks}</g>
  <g class="rm-campus"><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="9"/><text x="${cx.toFixed(1)}" y="${(cy+4).toFixed(1)}" text-anchor="middle">★</text></g>
 </svg><div class="rm-tip" data-rm-tip hidden></div></div>
 <p class="small muted">Dot size is star rating. Click a recruit to open his profile. Small squares are other programs.</p>`;
}
function renderRecruitMap(){
 const anchor=document.querySelector('#classSummary');if(!anchor)return;
 let host=document.querySelector('#recruitMap');const m=recruitMapModel();
 if(!m){if(host)host.hidden=true;return}
 if(!host){host=document.createElement('section');host.id='recruitMap';host.className='card recruit-map';anchor.after(host)}
 host.hidden=false;host.innerHTML=recruitMapHTML(m);
 const tip=host.querySelector('[data-rm-tip]'),stage=host.querySelector('.rm-stage'),byId=new Map(m.recruits.map(x=>[String(x.r.id),x]));
 host.querySelectorAll('[data-rm-filter]').forEach(b=>b.onclick=()=>{recruitMapFilter=b.dataset.rmFilter;renderRecruitMap()});
 const find=ev=>ev.target.closest?.('[data-rm-recruit]');
 stage.addEventListener('mousemove',ev=>{const g=find(ev);if(!g){tip.hidden=true;return}const {r,status}=byId.get(g.dataset.rmRecruit)||{};if(!r)return;
  const where=status==='mine'?`Committed to ${esc(m.team.name)}`:r.committed?`Committed to ${esc(r.committed)}`:`${r.interest??0}% interest${r.leader?` · leader: ${esc(r.leader)}`:''}`;
  tip.innerHTML=`<strong>${'★'.repeat(r.stars||0)} ${esc(r.pos)} ${esc(r.name)}</strong><span>${esc(r.homeCity||'')}, ${esc(r.homeState||'')} · #${esc(r.nationalRank??'—')} nationally</span><span>${where}</span><span>${Math.round(recruitDistance(m.team,r))} miles from campus</span>`;
  const box=stage.getBoundingClientRect();tip.hidden=false;tip.style.left=`${Math.min(ev.clientX-box.left+14,box.width-230)}px`;tip.style.top=`${Math.max(0,ev.clientY-box.top-10)}px`});
 stage.addEventListener('mouseleave',()=>{tip.hidden=true});
 stage.addEventListener('click',ev=>{const g=find(ev),hit=g&&byId.get(g.dataset.rmRecruit);if(hit)showRecruitProfile(hit.r.id)});
}
extendRender('recruiting',renderRecruitMap);
globalThis.DynastyRecruitMap={model:recruitMapModel,project:recruitMapProject,setFilter:v=>{recruitMapFilter=v}};
