// Coach legacy: achievements, records across saves, a hall of fame and opt-in challenges.
// Judged from DynastyLegacySnapshot facts; stored on this device outside any save (localStorage), so
// it carries across dynasties. Unlocks never change the dynasty itself.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastyLegacy=api;api.mount?.()}
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const KEY='dynastyLabLegacy',VERSION=1;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const all=f=>[...(f.seasons||[]),...(f.current?.regularDone?[{year:f.year,w:f.current.w,l:f.current.l,champ:f.current.champ,confChamp:f.current.confChamp}]:[])];
const ACHIEVEMENTS=[
 {id:'first_win',name:'First Win',desc:'Win a game as head coach.',test:f=>f.current.w>0||all(f).some(s=>s.w>0)},
 {id:'winning_season',name:'Winning Season',desc:'Finish a season with eight or more wins.',test:f=>all(f).some(s=>s.w>=8)},
 {id:'ten_wins',name:'Double Digits',desc:'Win ten games in a season.',test:f=>all(f).some(s=>s.w>=10)||f.current.w>=10},
 {id:'undefeated',name:'Perfect',desc:'Finish a season without a loss (12+ wins).',test:f=>all(f).some(s=>s.l===0&&s.w>=12)},
 {id:'bowl_win',name:'Bowl Champion',desc:'Win a bowl game.',test:f=>!!f.current.bowlWon},
 {id:'conf_champ',name:'Conference Champion',desc:'Win your conference championship.',test:f=>f.current.confChamp||all(f).some(s=>s.confChamp)},
 {id:'national_champ',name:'National Champion',desc:'Win the national title.',test:f=>f.current.champ||all(f).some(s=>s.champ)},
 {id:'dynasty',name:'Dynasty',desc:'Win three national titles with one program.',test:f=>all(f).filter(s=>s.champ).length>=3},
 {id:'rival_win',name:'Bragging Rights',desc:'Beat your rival.',test:f=>(f.rival?.w||0)>0},
 {id:'rival_streak',name:'Own the Rivalry',desc:'Beat your rival three years in a row.',test:f=>(f.rival?.streak||0)>=3},
 {id:'turnaround',name:'Turnaround',desc:'Improve by five or more wins from one season to the next.',test:f=>{const s=all(f);return s.some((x,i)=>i>0&&x.w-s[i-1].w>=5)}},
 {id:'five_seasons',name:'Built to Last',desc:'Coach five seasons with one program.',test:f=>(f.seasons||[]).length>=5},
 {id:'blue_chips',name:'Blue-Chip Haul',desc:'Sign three five-star recruits in one class.',test:f=>f.signedFiveStars>=3},
 {id:'first_rounder',name:'Pro Factory',desc:'Send a player to the first round of the draft.',test:f=>(f.picks||[]).some(p=>p.round===1)},
 {id:'award_winner',name:'Hardware',desc:'Coach a national award winner.',test:f=>(f.awards||[]).length>0},
 {id:'survivor',name:'Hot Seat Survivor',desc:'Bring administration confidence back to 60 after a season under 40.',test:(f,mem)=>mem?.lowConfidence&&f.adminConfidence>=60}
];
const CHALLENGES=[
 {id:'rebuild',name:'Turn It Around',desc:'From a program with prestige 65 or lower, win nine games within three seasons.',eligible:f=>f.program.prestige<=65,deadline:3,progress:(f,c)=>{const best=Math.max(0,...all(f).filter(s=>s.year>=c.acceptedYear).map(s=>s.w),f.current.w);return{value:best,target:9,done:best>=9}}},
 {id:'win_now',name:'Win Now',desc:'At a program with prestige 85 or higher, win the national title within two seasons.',eligible:f=>f.program.prestige>=85,deadline:2,progress:(f,c)=>{const won=all(f).some(s=>s.year>=c.acceptedYear&&s.champ)||f.current.champ;return{value:won?1:0,target:1,done:won}}},
 {id:'rivalry',name:'Own the Rivalry',desc:'Beat your rival three years running.',eligible:f=>!!f.rival,deadline:5,progress:f=>{const v=Math.max(0,f.rival?.streak||0);return{value:Math.min(3,v),target:3,done:v>=3}}},
 {id:'perfect',name:'Perfect Season',desc:'Finish 12-0 or better.',eligible:()=>true,deadline:4,progress:(f,c)=>{const ok=all(f).some(s=>s.year>=c.acceptedYear&&s.l===0&&s.w>=12);return{value:ok?1:0,target:1,done:ok}}}
];
function emptyStore(){return{version:VERSION,achievements:{},records:{},hallOfFame:[],challenges:{},memory:{}}}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.version===VERSION)return{...emptyStore(),...s}}catch(e){}return emptyStore()}
function save(s){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
// Pure: fold the current facts into the store. Returns {store, unlocked:[achievement]}.
function merge(store,f){
 const s=JSON.parse(JSON.stringify(store||emptyStore())),unlocked=[];if(!f)return{store:s,unlocked};
 const mem=s.memory[f.key]||(s.memory[f.key]={});
 if(f.adminConfidence>0&&f.adminConfidence<40&&(f.seasons||[]).length)mem.lowConfidence=true;
 for(const a of ACHIEVEMENTS)if(!s.achievements[a.id]&&a.test(f,mem)){s.achievements[a.id]={year:f.year,program:f.program.name,coach:f.coach};unlocked.push(a)}
 const best=(k,v,meta)=>{if(v>0&&(!s.records[k]||v>s.records[k].value))s.records[k]={value:v,...meta}};
 for(const x of all(f)){best('wins',x.w,{year:x.year,program:f.program.name,coach:f.coach,record:`${x.w}-${x.l}`})}
 best('titles',all(f).filter(x=>x.champ).length,{program:f.program.name,coach:f.coach});
 best('confTitles',all(f).filter(x=>x.confChamp).length,{program:f.program.name,coach:f.coach});
 best('seasons',(f.seasons||[]).length,{program:f.program.name,coach:f.coach});
 best('firstRounders',(f.picks||[]).filter(p=>p.round===1).length,{program:f.program.name,coach:f.coach});
 best('rivalStreak',Math.max(0,f.rival?.streak||0),{program:f.program.name,coach:f.coach,rival:f.rival?.name});
 const hof=new Map(s.hallOfFame.map(h=>[`${h.program}|${h.playerId}`,h]));
 const add=(p,honor)=>{const k=`${f.program.name}|${p.playerId}`,h=hof.get(k)||{playerId:p.playerId,name:p.name,pos:p.pos,program:f.program.name,programId:f.program.id,coach:f.coach,honors:[]};if(!h.honors.includes(honor))h.honors.push(honor);hof.set(k,h)};
 for(const a of f.awards||[])add(a,`${a.year} ${a.award}`);
 for(const p of f.picks||[])if(p.round===1)add(p,`${p.year} first-round pick (#${p.pick})`);
 s.hallOfFame=[...hof.values()].sort((a,b)=>b.honors.length-a.honors.length||a.name.localeCompare(b.name)).slice(0,60);
 for(const [id,c] of Object.entries(s.challenges)){if(c.key!==f.key||c.status!=='active')continue;const def=CHALLENGES.find(x=>x.id===id);if(!def)continue;const p=def.progress(f,c);c.progress=p;if(p.done){c.status='complete';c.completedYear=f.year}else if(f.year-c.acceptedYear>=def.deadline)c.status='failed'}
 return{store:s,unlocked};
}
function accept(store,id,f){const def=CHALLENGES.find(c=>c.id===id);if(!def||!f||!def.eligible(f))return store;const s=JSON.parse(JSON.stringify(store));s.challenges[id]={key:f.key,program:f.program.name,acceptedYear:f.year,status:'active',progress:def.progress(f,{acceptedYear:f.year})};return s}
// ---------- UI ----------
function helmet(id,cls){return globalThis.DynastyBrandVisuals?.helmetHTML?.(id,cls)||''}
const RECORDS=[['wins','Most wins in a season',r=>`${r.record} · ${r.year}`],['titles','National titles, one program',r=>''],['confTitles','Conference titles, one program',r=>''],['firstRounders','First-round picks, one program',r=>''],['rivalStreak','Longest rivalry streak',r=>r.rival?`over ${r.rival}`:''],['seasons','Longest tenure (seasons)',r=>'']];
function pageHTML(store,f){
 const got=Object.keys(store.achievements).length;
 const ach=ACHIEVEMENTS.map(a=>{const u=store.achievements[a.id];return`<li class="lg-ach${u?' is-unlocked':''}"><i aria-hidden="true">${u?'★':'☆'}</i><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${u?`<em>${esc(u.program)} · ${esc(u.year)}</em>`:''}</li>`}).join('');
 const rec=RECORDS.map(([k,label,sub])=>{const r=store.records[k];return`<div class="lg-rec"><span>${esc(label)}</span><b>${r?esc(r.value):'—'}</b><small>${r?`${esc(r.program)}${sub(r)?` · ${esc(sub(r))}`:''} · ${esc(r.coach)}`:'Not set yet'}</small></div>`}).join('');
 const hof=store.hallOfFame.length?store.hallOfFame.slice(0,24).map(h=>`<li>${helmet(h.programId,'lg-helmet')}<span><b>${esc(h.name)}</b><small>${esc(h.pos)} · ${esc(h.program)}</small></span><em>${h.honors.map(esc).join('<br>')}</em></li>`).join(''):'<p class="muted">National award winners and first-round picks from your programs are inducted here.</p>';
 const ch=CHALLENGES.map(c=>{const st=store.challenges[c.id],mine=st&&f&&st.key===f.key,eligible=f&&c.eligible(f);const p=mine?st.progress:null;
  const state=mine?st.status:st&&st.status==='complete'?'complete-elsewhere':'open';
  return`<li class="lg-ch is-${esc(state)}"><b>${esc(c.name)}</b><small>${esc(c.desc)}</small>${mine?`<div class="lg-bar"><i style="width:${p?Math.round(100*Math.min(1,p.value/p.target)):0}%"></i></div><em>${st.status==='active'?`In progress · ${p?.value??0} of ${p?.target??'?'} · ${c.deadline-(f.year-st.acceptedYear)} season${c.deadline-(f.year-st.acceptedYear)===1?'':'s'} left`:st.status==='complete'?`Complete · ${st.completedYear}`:'Failed'}</em>`:st?.status==='complete'?`<em>Completed with ${esc(st.program)}</em>`:eligible?`<button type="button" data-legacy-accept="${esc(c.id)}">Take the challenge</button>`:`<em>Not available at ${esc(f?.program.name||'this program')}</em>`}</li>`}).join('');
 return`<div class="lg-wrap"><section class="card"><div class="section-head"><div><span class="eyebrow">COACH LEGACY · ALL SAVES</span><h3>Achievements · ${got}/${ACHIEVEMENTS.length}</h3></div></div><ul class="lg-achs">${ach}</ul></section>`+
  `<section class="card"><span class="eyebrow">CHALLENGES · THIS DYNASTY</span><ul class="lg-chs">${ch}</ul></section>`+
  `<section class="card"><span class="eyebrow">RECORDS ACROSS SAVES</span><div class="lg-recs">${rec}</div></section>`+
  `<section class="card"><span class="eyebrow">HALL OF FAME</span><ul class="lg-hof">${hof}</ul></section></div>`;
}
let store=null,lastSig='';
function toast(a){const t=document.createElement('div');t.className='lg-toast';t.setAttribute('role','status');t.innerHTML=`<i aria-hidden="true">★</i><span><small>Achievement unlocked</small><b>${esc(a.name)}</b></span>`;document.body.append(t);globalThis.DynastySound?.play?.('drumHit');setTimeout(()=>t.classList.add('is-leaving'),3400);setTimeout(()=>t.remove(),3800)}
function refresh(){
 const f=globalThis.DynastyLegacySnapshot?.read?.();if(!f)return;
 const sig=JSON.stringify([f.key,f.year,f.week,f.phase,f.current,f.seasons.length,f.rival,f.picks.length,f.awards.length,f.signedFiveStars,f.adminConfidence]);
 if(sig!==lastSig){lastSig=sig;store??=load();const out=merge(store,f);store=out.store;save(store);out.unlocked.forEach((a,i)=>setTimeout(()=>toast(a),i*900))}
 const host=document.querySelector('#legacyBoard');if(host&&document.querySelector('#legacy.active')){host.innerHTML=pageHTML(store||load(),f);host.querySelectorAll('[data-legacy-accept]').forEach(b=>b.addEventListener('click',()=>{store=accept(store||load(),b.dataset.legacyAccept,f);lastSig='';save(store);refresh()}))}
}
let pending=false;function schedule(){if(pending)return;pending=true;setTimeout(()=>{pending=false;refresh()},400)}
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{for(const sel of ['#recordBig','#weekLine','#teamName','#saveStatus'])document.querySelectorAll(sel).forEach(el=>new MutationObserver(schedule).observe(el,{childList:true,subtree:true,characterData:true}));const tab=document.querySelector('#legacy');if(tab)new MutationObserver(schedule).observe(tab,{attributes:true,attributeFilter:['class']});schedule()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{ACHIEVEMENTS,CHALLENGES,emptyStore,merge,accept,pageHTML,mount,KEY};
});
