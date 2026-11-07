// Player storylines: arcs worth following, detected from what actually happened.
// Every arc needs evidence (season history, recruit origin, injuries, transfers, school records, award
// standing) and is ranked by how strong that evidence is. Nothing is random and nothing is saved.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastyStorylines=api;api.mount?.()}
})(typeof window!=='undefined'?window:this,function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const ARCS={
 record_chase:'Record chase',award:'Award race',underdog:'Underdog',redshirt_payoff:'Redshirt payoff',
 breakout:'Breakout',national_leader:'National leader',freshman:'Freshman impact',comeback:'Comeback',fresh_start:'Fresh start',climber:'Development story',last_ride:'Last ride'
};
// All arcs a player's evidence supports, strongest first. `pl` is a plain player record (see adapter).
function detect(pl){
 const out=[],cur=pl.current||{},seasons=pl.seasons||[],add=(type,score,title,summary)=>out.push({type,label:ARCS[type],score:Math.round(score*10)/10,title,summary});
 const rec=pl.record;
 if(rec&&rec.value>0&&rec.total>=.8*rec.value&&rec.total>0){
  if(rec.total>rec.value)add('record_chase',110+Math.min(20,(rec.total/rec.value-1)*100),'Owns the school record',`${fmt(rec.total)} career ${rec.label}, past ${rec.holder}'s ${fmt(rec.value)}.`);
  else add('record_chase',80+25*(rec.total/rec.value),'Chasing the school record',`${fmt(rec.total)} career ${rec.label}, ${fmt(rec.value-rec.total)} short of ${rec.holder}'s ${fmt(rec.value)}.`);
 }
 if(pl.award&&pl.award.rank<=3)add('award',92-pl.award.rank*6,`${pl.award.rank===1?'Leads':'In'} the ${pl.award.name} race`,`#${pl.award.rank} in the ${pl.award.name} standings${pl.award.move>0?`, up ${pl.award.move} this week`:pl.award.move<0?`, down ${-pl.award.move} this week`:''}.`);
 if(pl.stars&&pl.stars<=3&&(cur.games||0)>=2&&pl.teamPosRank===1&&(cur.production||0)>=4)add('underdog',58+(4-pl.stars)*12+Math.min(20,cur.production),`${pl.stars}-star recruit, now the lead ${pl.pos}`,`Signed as a ${pl.stars}-star; leads ${pl.team}'s ${pl.pos} room in production this year (${cur.line}).`);
 if(pl.nationalPosRank&&pl.nationalPosRank<=10&&(cur.games||0)>=2)add('national_leader',82-pl.nationalPosRank*2.5,`#${pl.nationalPosRank} ${pl.pos} in the country`,`Ranks #${pl.nationalPosRank} nationally among ${pl.pos}s in production: ${cur.line}.`);
 if(/^(FR|RS FR)/.test(pl.eligibility||'')&&pl.teamPosRank===1&&(cur.games||0)>=3&&(cur.production||0)>=4)add('freshman',52+Math.min(14,cur.production),`Freshman leading the ${pl.pos} room`,`${pl.eligibility} and already ${pl.team}'s most productive ${pl.pos}: ${cur.line}.`);
 const redshirtYear=seasons.find(s=>s.games<=4&&pl.redshirtUsed);
 if(redshirtYear&&(cur.production||0)>=6)add('redshirt_payoff',62+Math.min(20,cur.production),'The redshirt is paying off',`Played ${redshirtYear.games} game${redshirtYear.games===1?'':'s'} in ${redshirtYear.year} to save the year; now ${cur.line}.`);
 const prev=seasons.at(-1);
 if(prev&&prev.games>=3&&(cur.games||0)>=3){const before=prev.production/prev.games,now=cur.production/cur.games;if(now>=before*1.8&&now-before>=.8)add('breakout',55+Math.min(30,(now-before)*10),'Breakout season',`Production per game is up from ${before.toFixed(1)} to ${now.toFixed(1)} on the staff scale since ${prev.year}.`)}
 const hurt=(pl.injuries||[]).filter(i=>i.weeks>=4).at(-1);
 if(hurt&&(cur.games||0)>=3&&(cur.production||0)>=4&&!(pl.injuryWeeks>0))add('comeback',58+Math.min(20,cur.production),'Back from injury',`Missed ${hurt.weeks} weeks (${hurt.type||'injury'}) in ${hurt.year}; back producing: ${cur.line}.`);
 if(pl.transfer&&(cur.production||0)>=5)add('fresh_start',54+Math.min(20,cur.production),`Fresh start after leaving ${pl.transfer.from}`,`Transferred in ${pl.transfer.season}; ${cur.line}.`);
 const first=seasons.find(s=>Number.isFinite(s.rating)),gain=first&&Number.isFinite(cur.rating)?cur.rating-first.rating:0;
 if(gain>=10)add('climber',45+Math.min(25,gain),'Developed into a player',`Staff read up ${Math.round(gain)} points since ${first.year} (${Math.round(first.rating)} to ${Math.round(cur.rating)}).`);
 if(/SR/.test(pl.eligibility||'')&&seasons.filter(s=>s.team===pl.team).length>=3&&pl.teamPosRank===1)add('last_ride',40+Math.min(20,cur.production||0),'Senior season',`Fourth year in the program and still the lead ${pl.pos}.`);
 return out.sort((a,b)=>b.score-a.score);
}
// Pick storylines: one per player, a cap per arc type so the list reads as different stories.
function select(players,{limit=4,maxPerType=2,minScore=50}={}){
 const picked=[],perType={};
 const rows=players.map(pl=>({pl,arc:detect(pl)[0]})).filter(x=>x.arc&&x.arc.score>=minScore).sort((a,b)=>b.arc.score-a.arc.score||String(a.pl.name).localeCompare(String(b.pl.name)));
 for(const x of rows){if(picked.length>=limit)break;if((perType[x.arc.type]||0)>=maxPerType)continue;perType[x.arc.type]=(perType[x.arc.type]||0)+1;picked.push(x)}
 return picked;
}
function chapters(pl){
 const rows=(pl.seasons||[]).slice(-3).map(s=>({year:s.year,text:`${s.team===pl.team?'':`${s.team} · `}${s.games} games${Number.isFinite(s.rating)?` · read ${Math.round(s.rating)}`:''}`}));
 if(pl.current)rows.push({year:pl.current.year,text:pl.current.games?pl.current.line:'Season ahead',now:true});
 return rows;
}
// ---------- UI ----------
function face(pl,kind='player'){return`<canvas class="portrait portrait-list" width="44" height="44" data-portrait="${esc(pl.id)}" data-portrait-size="44" data-portrait-frame="list" data-portrait-kind="${kind}" aria-hidden="true"></canvas>`}
function storyCard({pl,arc},league=false){
 const helmet=league?globalThis.DynastyBrandVisuals?.helmetHTML?.(pl.teamId,'sl-helmet')||'':'';
 return`<article class="sl-card is-${arc.type}"><button type="button" class="sl-who" data-player="${esc(pl.id)}">${face(pl)}<span><b>${esc(pl.name)}</b><small>${esc(pl.pos)} · ${esc(pl.eligibility||'')}${league?` · ${esc(pl.team)}`:''}</small></span>${helmet}</button><span class="sl-arc">${esc(arc.label)}</span><strong>${esc(arc.title)}</strong><p>${esc(arc.summary)}</p>${league?'':`<ol class="sl-chapters">${chapters(pl).map(c=>`<li${c.now?' class="is-now"':''}><span>${esc(c.year)}</span>${esc(c.text)}</li>`).join('')}</ol>`}</article>`;
}
function raceHTML(race){
 if(!race?.length)return'';
 return race.map(a=>`<section class="sl-race"><h4>${esc(a.name)}</h4><ol>${a.top.map((c,i)=>`<li class="${c.mine?'is-mine':''}"><span class="sl-rank">${i+1}</span><button type="button" data-player="${esc(c.id)}">${esc(c.name)}</button><small>${esc(c.pos)} · ${esc(c.team)}</small><em class="${c.move>0?'up':c.move<0?'down':''}">${c.move>0?`▲${c.move}`:c.move<0?`▼${-c.move}`:'–'}</em></li>`).join('')}</ol></section>`).join('');
}
function sectionHTML(snap){
 const mine=select(snap.team||[],{limit:4}),league=select(snap.league||[],{limit:4,minScore:64,maxPerType:1});
 if(!mine.length&&!league.length&&!snap.race?.length)return'';
 return`<section id="storylinesCard" class="card storylines"><div class="sl-head"><div><span class="eyebrow">STORYLINES</span><h3>Players to follow</h3></div><small>Picked from season history, recruiting origin, injuries, transfers, school records and the award race.</small></div>`+
  `<div class="sl-grid">${mine.length?mine.map(x=>storyCard(x)).join(''):'<p class="muted">No storyline has enough evidence yet. They build as the season is played.</p>'}</div>`+
  (snap.race?.length?`<div class="sl-sub"><span class="eyebrow">AWARD RACE · WEEK ${esc(snap.week)}</span><div class="sl-races">${raceHTML(snap.race)}</div></div>`:'')+
  (league.length?`<div class="sl-sub"><span class="eyebrow">AROUND THE LEAGUE</span><div class="sl-grid is-league">${league.map(x=>storyCard(x,true)).join('')}</div></div>`:'')+
  `</section>`;
}
let sig='',queued=false;
function paint(){
 queued=false;const dash=document.querySelector('#dashboard');if(!dash)return;
 const snap=globalThis.DynastyStorylineSnapshot?.read?.();let host=dash.querySelector('#storylinesCard');
 if(!snap){host?.remove();sig='';return}
 const next=snap.signature;if(host&&next===sig)return;sig=next;
 const html=sectionHTML(snap);if(!html){host?.remove();return}
 if(host)host.outerHTML=html;else{const anchor=dash.querySelector('#v0102PlayerStories')||dash.querySelector('#seasonStoryRail');anchor?anchor.insertAdjacentHTML('beforebegin',html):dash.insertAdjacentHTML('beforeend',html)}
 host=dash.querySelector('#storylinesCard');host.dataset.dview='stories';
 host.querySelectorAll('[data-player]').forEach(b=>b.addEventListener('click',()=>document.querySelector(`#roster [data-player="${CSS.escape(b.dataset.player)}"]`)?.click()||globalThis.DynastyLabShowPlayer?.(b.dataset.player)));
 globalThis.DynastyLabPortraits?.paint?.(host);
}
function queue(){if(queued)return;queued=true;setTimeout(paint,60)}
function mount(){
 if(typeof document==='undefined')return;
 const start=()=>{for(const sel of ['#recordBig','#weekLine','#teamName'])document.querySelectorAll(sel).forEach(el=>new MutationObserver(queue).observe(el,{childList:true,subtree:true,characterData:true}));document.addEventListener('click',e=>{if(e.target.closest('[data-dash-view],[data-tab="dashboard"],[data-client-tab="dashboard"]'))queue()});queue()};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}
return{ARCS,detect,select,chapters,sectionHTML,raceHTML,mount};
});
