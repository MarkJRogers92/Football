// v0.35 — your dynasty in one page. The History tab opens with the coach's whole career on one card: seasons, record
// and posts; each decade at the current program; the best team; national award winners and first-round picks coached;
// titles; and the people that defined it (the rival, a nemesis, a favourite opponent).
//
// Nothing is stored. It reads the career and tenure records, the awards table, the draft history and the coaching
// rivals ledger.
function makeDynastyPage(env){
 'use strict';
 const universe=()=>env.getUniverse();
 // Every season coached, with the school, from the closed posts' ranges and the current tenure's season reviews.
 function posts(){
  const u=universe(),out=(u.careerHistory||[]).map(p=>({school:p.school,from:p.startYear,to:p.endYear,w:p.w||0,l:p.l||0,seasons:p.seasons||0,titles:p.titles||0,confTitles:p.confTitles||0,current:false}));
  const tn=u.tenure;
  if(tn&&!tn.closed){const s=tn.seasons||[];out.push({school:tn.school,from:tn.startYear,to:null,w:s.reduce((n,x)=>n+(x.w||0),0),l:s.reduce((n,x)=>n+(x.l||0),0),seasons:s.length,titles:s.filter(x=>x.champ).length,confTitles:s.filter(x=>x.confChamp).length,current:true,rows:s}); }
  return out;
 }
 const coachedAt=(list,school,year)=>list.some(p=>p.school===school&&year>=p.from&&(p.to==null||year<=p.to));
 function decades(rows){
  const by=new Map();
  for(const s of rows||[]){const d=Math.floor(s.year/10)*10;const x=by.get(d)||{from:d,to:d+9,w:0,l:0,titles:0,confTitles:0,best:null};x.w+=s.w||0;x.l+=s.l||0;if(s.champ)x.titles++;if(s.confChamp)x.confTitles++;if(!x.best||(s.w||0)>x.best.w||((s.w||0)===x.best.w&&(s.l||0)<x.best.l))x.best={year:s.year,w:s.w||0,l:s.l||0,champ:!!s.champ};by.set(d,x)}
  return[...by.values()].sort((a,b)=>a.from-b.from);
 }
 function read(){
  const u=universe(),list=posts();if(!list.length)return null;
  const w=list.reduce((n,p)=>n+p.w,0),l=list.reduce((n,p)=>n+p.l,0),seasons=list.reduce((n,p)=>n+p.seasons,0);
  const current=list.find(p=>p.current)||null,rows=current?.rows||[];
  const best=rows.slice().sort((a,b)=>(b.champ?1:0)-(a.champ?1:0)||(b.w||0)-(a.w||0)||(a.l||0)-(b.l||0))[0]||null;
  const awards=[];for(const [y,arr] of Object.entries(u.awards||{}))for(const a of arr||[])if(a?.team&&coachedAt(list,a.team,Number(y)))awards.push({year:Number(y),name:a.name,player:a.playerName,pos:a.pos,playerId:a.playerId,school:a.team});
  const firsts=[];for(const [y,arr] of Object.entries(u.draftHistory||{}))for(const r of arr||[])if(r.round===1&&coachedAt(list,r.school,Number(y)))firsts.push({year:Number(y),player:r.playerName,pos:r.pos,pick:r.pick,school:r.school});
  const R=env.rivals?.();
  return{seasons,w,l,posts:list.length,titles:list.reduce((n,p)=>n+p.titles,0),confTitles:list.reduce((n,p)=>n+p.confTitles,0),list,decades:decades(rows),best,
   awards:awards.sort((a,b)=>b.year-a.year),firsts:firsts.sort((a,b)=>b.year-a.year||a.pick-b.pick),
   rival:env.rivalry?.()||null,nemesis:R?.nemesis()||null,favourite:R?.favourite()||null};
 }
 return{posts,decades,read};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeDynastyPage};
}else{
 const dynastyPage=makeDynastyPage({getUniverse:()=>universe,rivals:()=>globalThis.DynastyCoachRivals,
  rivalry:()=>{const t=selected(),r=rivalOf(t),s=t?.rivalry?.series;return r&&s&&(s.w||0)+(s.l||0)>0?{name:r.name,trophy:t.rivalry.trophy,w:s.w||0,l:s.l||0}:null}});
 globalThis.DynastyPage=dynastyPage;
 const dpEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function dynastyPageHTML(d){
  const pct=d.w+d.l?Math.round(d.w/(d.w+d.l)*1000)/10:0;
  const dec=d.decades.map(x=>`<li><span class="stop-who">${x.from}s<small>${x.w}-${x.l}${x.titles?` · ${x.titles} national title${x.titles===1?'':'s'}`:''}${x.confTitles?` · ${x.confTitles} conference title${x.confTitles===1?'':'s'}`:''}${x.best?` · best ${x.best.w}-${x.best.l} in ${x.best.year}${x.best.champ?' (champions)':''}`:''}</small></span></li>`).join('');
  const posts=d.list.map(p=>`<li><span class="stop-who">${dpEsc(p.school)}<small>${p.from}–${p.to??'present'} · ${p.w}-${p.l}${p.titles?` · ${p.titles} title${p.titles===1?'':'s'}`:''}</small></span></li>`).join('');
  const people=[d.rival?`Rival: ${dpEsc(d.rival.name)}, ${d.rival.w}-${d.rival.l} for ${dpEsc(d.rival.trophy||'the rivalry')}`:'',d.nemesis?`Nemesis: ${dpEsc(d.nemesis.name)}, ${d.nemesis.w}-${d.nemesis.l}`:'',d.favourite?`Favourite opponent: ${dpEsc(d.favourite.name)}, ${d.favourite.w}-${d.favourite.l}`:''].filter(Boolean);
  const stars=d.awards.slice(0,6).map(a=>`<li><span class="stop-who">${a.playerId?`<button type="button" class="player-button" data-player="${dpEsc(a.playerId)}">${dpEsc(a.pos)} ${dpEsc(a.player)}</button>`:`${dpEsc(a.pos)} ${dpEsc(a.player)}`}<small>${a.year} ${dpEsc(a.name)} · ${dpEsc(a.school)}</small></span></li>`).join('');
  return`<div class="section-head"><div><div class="eyebrow">YOUR DYNASTY</div><h3>${d.seasons} season${d.seasons===1?'':'s'} · ${d.w}-${d.l} (${pct}%) · ${d.posts} post${d.posts===1?'':'s'}</h3><div class="muted">${d.titles} national title${d.titles===1?'':'s'} · ${d.confTitles} conference title${d.confTitles===1?'':'s'} · ${d.firsts.length} first-round pick${d.firsts.length===1?'':'s'} · ${d.awards.length} national award${d.awards.length===1?'':'s'}</div></div></div>
  <div class="dp-grid">
   <div><h4>Where you coached</h4><ul class="stop-rows">${posts}</ul></div>
   ${dec?`<div><h4>By decade, current program</h4><ul class="stop-rows">${dec}</ul></div>`:''}
   ${d.best?`<div><h4>Best team</h4><p><strong>${d.best.year}: ${d.best.w}-${d.best.l}</strong>${d.best.champ?' · national champions':d.best.confChamp?' · conference champions':''}</p></div>`:''}
   ${people.length?`<div><h4>The people</h4><ul class="dp-list">${people.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}
  </div>
  ${stars?`<h4>Award winners you coached</h4><ul class="stop-rows">${stars}</ul>`:''}`;
 }
 function renderDynastyPage(){
  if(!universe?.teams)return;const d=dynastyPage.read();
  let host=$('#dynastyPage');
  if(!d){if(host?.isConnected)host.remove();return}
  if((!host||!host.isConnected)&&typeof document!=='undefined'){
   const anchor=document.querySelector('#history .section-head');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='dynastyPage';host.className='card dynasty-page-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(!host)return;host.innerHTML=dynastyPageHTML(d);host.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));
 }
 const renderHistoryBeforeDynasty=TAB_RENDERERS.history;
 TAB_RENDERERS.history=()=>{renderHistoryBeforeDynasty();renderDynastyPage()};
}
