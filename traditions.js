// v0.35 — program traditions. Sustained success becomes something to protect, not just something to reach. When a
// streak gets long enough the program earns a named tradition; while it lasts, the fan base grows a little faster
// (+1 fan support each offseason per tradition, at most +3), and the day it ends, the tradition is gone.
//
//   The Fortress          10 or more straight home wins (home-streaks.js)
//   Owning the rivalry    5 or more straight wins over the rival
//   Winning tradition     5 or more straight winning seasons
//   Bowl tradition        5 or more straight bowl games
//
// Only the coach's program gains the fan support. Traditions are worked out from records the game already keeps; the
// only state is t.traditions {active, since, year} so The Wire can say when one begins or ends.
function makeTraditions(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const FANS_EACH=1,FANS_MAX=3,HOME=10,RIVAL=5,WINNING=5,BOWLS=5;
 const DEFS={
  fortress:{name:'The Fortress',detail:n=>`${n} straight home wins`},
  rivalry:{name:'Owning the rivalry',detail:n=>`${n} straight wins over the rival`},
  winning:{name:'Winning tradition',detail:n=>`${n} straight winning seasons`},
  bowls:{name:'Bowl tradition',detail:n=>`${n} straight bowl games`}
 };
 // Consecutive seasons, counting back from the latest archived one, that pass a test.
 function seasonsRun(t,test){
  const seasons=(universe().history||[]).filter(h=>h.type==='season').sort((a,b)=>b.year-a.year);let n=0,last=null;
  for(const h of seasons){if(last!=null&&h.year!==last-1)break;const r=(h.records||[]).find(x=>String(x.schoolId)===String(t.id)||x.name===t.name);if(!r||!test(r,h))break;n++;last=h.year}
  return n;
 }
 function bowlYears(t){return new Set((universe().events||[]).filter(e=>e?.type==='BOWL_RESULT'&&(e.schoolIds||[]).some(id=>String(id)===String(t.id))).map(e=>e.season))}
 function runs(t){
  const home=env.homeStreak?.(t)||0,rs=t.rivalry?.series?.streak||0,bowls=bowlYears(t);
  return{fortress:home,rivalry:Math.max(0,rs),winning:seasonsRun(t,r=>(r.w||0)>(r.l||0)),bowls:seasonsRun(t,(r,h)=>bowls.has(h.year))};
 }
 const NEED={fortress:HOME,rivalry:RIVAL,winning:WINNING,bowls:BOWLS};
 function active(t){const r=runs(t);return Object.keys(DEFS).filter(k=>r[k]>=NEED[k]).map(k=>({key:k,name:DEFS[k].name,detail:DEFS[k].detail(r[k]),run:r[k]}))}
 // Closest to unlocking, for the card: the runs that are alive but short.
 function building(t){const r=runs(t);return Object.keys(DEFS).filter(k=>r[k]>0&&r[k]<NEED[k]).map(k=>({key:k,name:DEFS[k].name,run:r[k],need:NEED[k]}))}
 // Once a year: compare with last year's set. Returns the traditions gained and lost.
 function review(t){
  const u=universe(),s=t.traditions??={active:[],since:{},year:null};if(s.year===u.year)return{gained:[],lost:[],active:active(t)};
  const now=active(t),keys=now.map(x=>x.key),gained=now.filter(x=>!s.active.includes(x.key)),lost=s.active.filter(k=>!keys.includes(k)).map(k=>({key:k,name:DEFS[k].name}));
  for(const g of gained)s.since[g.key]=u.year;for(const l of lost)delete s.since[l.key];
  s.active=keys;s.year=u.year;return{gained,lost,active:now};
 }
 const fans=t=>Math.min(FANS_MAX,active(t).length*FANS_EACH);
 return{DEFS,NEED,FANS_EACH,FANS_MAX,runs,active,building,review,fans};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeTraditions};
}else{
 const traditions=makeTraditions({getUniverse:()=>universe,homeStreak:t=>globalThis.DynastyHomeStreaks?.of(t.id).streak||0});
 globalThis.DynastyTraditions=traditions;
 const trEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fanBeforeTraditions=updateFanSupport;
 updateFanSupport=function updateFanSupportWithTraditions(t){
  const out=fanBeforeTraditions.apply(this,arguments);
  try{
   if(t&&t===selected()){
    const r=traditions.review(t),n=traditions.fans(t);
    if(n)t.fan_support=clamp(Math.round((t.fan_support??60)+n),5,100);
    const push=(kind,key,text,importance)=>{universe.events??=[];universe.events.push({id:`EVT_TRAD_${kind}_${key}_${universe.year}_${t.id}`,type:'TRADITION',season:universe.year,week:universe.week,schoolIds:[t.id],playerIds:[],coachIds:[],gameIds:[],importance,summary:text,metadata:{kind,key}})};
    for(const g of r.gained)push('gained',g.key,`A new tradition at ${t.name}: ${g.name} (${g.detail}).`,64);
    for(const l of r.lost)push('lost',l.key,`${t.name}'s ${l.name} tradition has ended.`,58);
   }
  }catch(err){console.error(err)}
  return out;
 };
 function traditionsHTML(t){
  const now=traditions.active(t),next=traditions.building(t),since=t.traditions?.since||{};
  const row=x=>`<li data-tradition="${trEsc(x.key)}"><span class="stop-who">${trEsc(x.name)}<small>${trEsc(x.detail)}${since[x.key]?` · since ${since[x.key]}`:''} · +${traditions.FANS_EACH} fan support a season</small></span></li>`;
  const build=x=>`<li><span class="stop-who">${trEsc(x.name)}<small>${x.run} of ${x.need}</small></span></li>`;
  return`<div class="section-head"><div><div class="eyebrow">TRADITIONS</div><h3>${now.length?`${now.length} living tradition${now.length===1?'':'s'}`:'No traditions yet'}</h3><div class="muted">Long runs become traditions: 10 straight home wins, 5 straight over the rival, 5 straight winning seasons, 5 straight bowls. Each one adds fan support every offseason while it lasts (up to +${traditions.FANS_MAX}).</div></div></div>
  ${now.length?`<ul class="stop-rows">${now.map(row).join('')}</ul>`:''}${next.length?`<h4>Building</h4><ul class="stop-rows">${next.map(build).join('')}</ul>`:''}`;
 }
 function renderTraditions(){
  if(!universe?.teams)return;const t=selected();if(!t)return;
  let host=$('#traditions');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.getElementById){
   const anchor=document.getElementById('trophyCase')||document.getElementById('coachRivals')||document.getElementById('proPipeline');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='traditions';host.className='card traditions-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(host)host.innerHTML=traditionsHTML(t);
 }
 const renderProgramBeforeTraditions=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeTraditions();renderTraditions()};
}
