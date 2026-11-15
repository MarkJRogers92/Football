// v0.34 — Senior Day. The last regular-season home game opens with the seniors: every player in his final season of
// eligibility, each with one line from his career (starts, his best numbers, honours, how he arrived). There is no
// decision to make. The roster the coach built gets a goodbye before it leaves for the draft or graduation.
//
// Nothing is stored. The card reads the schedule, the roster, career and season statistics and awards, and appears on
// This Week only in the week before that game.
function makeSeniorDay(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const FEATURE=6;
 const num=v=>Number(v)||0;
 // The program's last regular-season home game, by week (1-based), or null.
 function seniorWeek(t){
  const u=universe();let week=null;
  (u.schedule||[]).forEach((games,i)=>{if((games||[]).some(g=>g.home===t.name&&!g.neutral))week=i+1});
  return week;
 }
 // A senior is in his last season of eligibility: three seasons used, so this is his fourth.
 const isSenior=p=>env.eligibilityBase(p)===3&&!p.redshirtActive;
 function total(p){const out={},c=p.career||{},s=p.stats||{};for(const k of new Set([...Object.keys(c),...Object.keys(s)]))out[k]=num(c[k])+num(s[k]);return out}
 // His best numbers, in the terms his position is judged by.
 function bestLine(p,c){
  const parts=[];
  if(c.passYds>=500)parts.push(`${c.passYds.toLocaleString('en-US')} passing yards, ${c.passTD} TD`);
  if(c.rushYds>=300)parts.push(`${c.rushYds.toLocaleString('en-US')} rushing yards, ${c.rushTD} TD`);
  if(c.recYds>=300)parts.push(`${c.recYds.toLocaleString('en-US')} receiving yards, ${c.recTD} TD`);
  if(c.sacks>=3)parts.push(`${Math.round(c.sacks*10)/10} sacks`);
  if(c.intDef>=2)parts.push(`${c.intDef} interceptions`);
  if(!parts.length&&c.tackles>=40)parts.push(`${c.tackles} tackles`);
  if(!parts.length&&c.fgAtt>=8)parts.push(`${c.fgMade} of ${c.fgAtt} field goals`);
  return parts.slice(0,2).join(' · ');
 }
 function arrival(p){
  const t=(p.transferHistory||[]).at(-1);if(t?.fromSchool)return`transferred from ${t.fromSchool}`;
  if(/walk/i.test(p.origin||''))return'walked on';
  const stars=p.recruitingMemory?.stars;return stars?`${stars}-star signee`:'';
 }
 function line(p){
  const c=total(p),honours=(p.awards||[]).map(a=>a.name).filter(Boolean);
  const best=honours.find(n=>/Heisman|Player of the Year|All-American/i.test(n))||honours.at(-1);
  return{id:p.id,name:p.name,pos:p.pos,label:env.eligibilityLabel(p),starts:num(c.starts),games:num(c.games),best:bestLine(p,c),honour:best||'',honours:honours.length,arrival:arrival(p),captain:!!p.captainYear&&p.captainYear===universe().year};
 }
 // Seniors in order of what they gave: starts first, then honours and games.
 function seniors(t){return(t?.roster||[]).filter(isSenior).map(line).sort((a,b)=>b.starts-a.starts||b.honours-a.honours||b.games-a.games||a.name.localeCompare(b.name))}
 // What This Week shows: only when the next game is Senior Day.
 function upcoming(t){
  const u=universe();if(!t||u.phase!=='regular')return null;
  const week=seniorWeek(t);if(!week||u.week+1!==week)return null;
  const g=(u.schedule[week-1]||[]).find(x=>x.home===t.name);if(!g||g.played)return null;
  return{week,opponent:g.away,seniors:seniors(t)};
 }
 return{FEATURE,seniorWeek,isSenior,seniors,line,upcoming};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeSeniorDay};
}else{
 const senior=makeSeniorDay({getUniverse:()=>universe,eligibilityBase:p=>eligibilityBase(p),eligibilityLabel:p=>eligibilityLabel(p)});
 globalThis.DynastySeniorDay=senior;
 const sdEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function renderSeniorDayCard(){
  const host=$('#weeklyDecisions');if(!host?.insertAdjacentElement)return;
  let card=$('#seniorDay');const info=universe?.teams?senior.upcoming(selected()):null;
  if(!info||!info.seniors.length){if(card?.isConnected)card.remove();return}
  if(!card||!card.isConnected){card=document.createElement('section');card.id='seniorDay';card.className='senior-day';card.setAttribute('role','region');card.setAttribute('aria-label','Senior Day');host.insertAdjacentElement('beforebegin',card)}
  // The six who gave most get a line each; everyone else is named in one sentence, so a big class stays short.
  const shown=info.seniors.slice(0,senior.FEATURE),rest=info.seniors.slice(senior.FEATURE);
  const detail=s=>[s.starts?`${s.starts} career start${s.starts===1?'':'s'}`:s.games?`${s.games} game${s.games===1?'':'s'}`:'',s.best,s.honour,s.arrival].filter(Boolean).map(sdEsc).join(' · ');
  const btn=s=>`<button type="button" class="player-button" data-player="${sdEsc(s.id)}">${sdEsc(s.pos)} ${sdEsc(s.name)}</button>`;
  const row=s=>`<li data-senior="${sdEsc(s.id)}">${btn(s)}${s.captain?' <span class="lr-tag">Captain</span>':''}${detail(s)?`<small>${detail(s)}</small>`:''}</li>`;
  card.innerHTML=`<div class="eyebrow">SENIOR DAY · WEEK ${info.week} VS ${sdEsc(String(info.opponent).toUpperCase())}</div><h3>${info.seniors.length} senior${info.seniors.length===1?'':'s'} play their last home game</h3><ul class="senior-list">${shown.map(row).join('')}</ul>${rest.length?`<p class="senior-rest small">Also honoured: ${rest.map(s=>`<span data-senior="${sdEsc(s.id)}">${btn(s)}</span>`).join(', ')}.</p>`:''}`;
  card.querySelectorAll('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));
 }
 extendRender('dashboard',renderSeniorDayCard);
 // Test pages only: jump This Week to the week before Senior Day and back.
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.seniorDayFixture=(on=true)=>{const t=selected();if(on){window.__sdWeek=universe.week;universe.week=senior.seniorWeek(t)-1}else universe.week=window.__sdWeek;render();return senior.upcoming(t)?.seniors.length||0};
}
