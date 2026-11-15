// v0.32 — the nonconference schedule. Weeks 1-4 used to be whatever the rotation dealt. Now the coach can trade a
// nonconference date for a different opponent: a marquee game for the playoff resume, a buy game for a likely win, or
// a regional opponent for the fans.
//
//   How a trade works   your opponent that week swaps places with an opponent from another nonconference game the
//                       same week, taking the same side (home or away). Every home and away count stays as it was, so
//                       the schedule's rules (12 games, 8 in conference, 5-7 at home, the protected rival) still hold.
//   Limits              two trades a season, for games more than a week away. The opener is set once the season
//                       begins its first week of preparation.
//   Money               a buy game (bringing a much weaker program to your stadium) costs one unit from the booster
//                       fund for the guarantee check. A marquee home game pays back when it is played: the boosters
//                       give goodwill and the crowd grows, win or lose.
//   Everything else     comes from the game itself: a tougher opponent is a harder game and a better strength of
//                       schedule in the rankings.
function makeNonconSystem(env){
 'use strict';
 const universe=()=>env.getUniverse(),clamp=env.clamp;
 const TRADES=2,MARQUEE_PRESTIGE=82,MARQUEE_RANK=15,BUY_GAP=22,BUY_COST=1,MARQUEE_GOODWILL=2,MARQUEE_FANS=1,REGIONAL_MILES=350;
 const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
 const T=n=>(universe()?.teams||[]).find(t=>t.name===n);

 function plan(t){
  const u=universe();if(!t)return null;
  const p=t.nonconPlan??={version:1};
  if(p.year!==u.year){p.year=u.year;p.trades=[];p.paid=[]}
  p.trades=Array.isArray(p.trades)?p.trades:[];p.paid=Array.isArray(p.paid)?p.paid:[];
  return p;
 }
 function tradesLeft(t){return Math.max(0,TRADES-plan(t).trades.length)}
 function open(){const u=universe();return u.phase==='regular'||u.phase==='preseason'}
 // The coach's nonconference games, by week, with whether each can still be traded.
 function games(t){
  const u=universe(),out=[];
  (u.schedule||[]).forEach((week,i)=>{for(const g of week||[]){if(g.conf||(g.home!==t.name&&g.away!==t.name))continue;
   const home=g.home===t.name,opp=T(home?g.away:g.home);
   out.push({g,week:i+1,home,opp,tradable:open()&&!g.played&&i+1>u.week+1})}});
  return out;
 }
 function playsAnywhere(a,b){return(universe().schedule||[]).some(w=>(w||[]).some(g=>(g.home===a&&g.away===b)||(g.home===b&&g.away===a)))}
 function kind(t,opp,home){
  if(!opp)return'standard';
  if((opp.rank&&opp.rank<=MARQUEE_RANK)||num(opp.prestige,0)>=MARQUEE_PRESTIGE)return'marquee';
  if(home&&num(opp.prestige,60)<=num(t.prestige,60)-BUY_GAP)return'buy';
  if(env.distance&&env.distance(t,opp)<=REGIONAL_MILES)return'regional';
  return'standard';
 }
 const KINDS={marquee:'Marquee',buy:'Buy game',regional:'Regional',standard:'Standard'};
 // Opponents you could have in that week's slot instead.
 function options(t,week){
  const u=universe(),row=games(t).find(x=>x.week===week);
  if(!row||!row.tradable)return[];
  const g1=row.g,xSide=row.home?'away':'home',x=row.opp,out=[];
  for(const g2 of u.schedule[week-1]||[]){
   if(g2===g1||g2.conf||g2.played)continue;
   const y=T(g2[xSide]),z=T(g2[xSide==='away'?'home':'away']);
   if(!y||!z||y===t||z===t)continue;
   if(y.conference===t.conference||z.conference===x.conference)continue;
   if(playsAnywhere(t.name,y.name)||playsAnywhere(x.name,z.name))continue;
   out.push({week,g1,g2,side:xSide,y,z,x,kind:kind(t,y,row.home),miles:env.distance?Math.round(env.distance(t,y)):null});
  }
  return out.sort((a,b)=>num(b.y.prestige,0)-num(a.y.prestige,0)||a.y.id-b.y.id);
 }
 function swapIn(o){
  const xs=T(o.x.name).schedule,ys=T(o.y.name).schedule;
  o.g1[o.side]=o.y.name;o.g2[o.side]=o.x.name;
  const replace=(list,from,to)=>{const i=list.indexOf(from);if(i>=0)list[i]=to;list.sort((a,b)=>num(a.week,0)-num(b.week,0))};
  replace(xs,o.g1,o.g2);replace(ys,o.g2,o.g1);
 }
 function trade(t,week,opponentName){
  const p=plan(t);
  if(!open())return{ok:false,reason:'The schedule can only change during the regular season.'};
  if(!tradesLeft(t))return{ok:false,reason:`You have used both nonconference trades for ${universe().year}.`};
  const o=options(t,week).find(x=>x.y.name===opponentName);
  if(!o)return{ok:false,reason:'That game is not available.'};
  if(o.kind==='buy'){const fund=env.fund(t);if(fund<BUY_COST)return{ok:false,reason:`A buy game needs ${BUY_COST} unit in the booster fund for the guarantee check.`}}
  swapIn(o);
  const problems=env.validate?env.validate():[];
  if(problems.length){swapIn({...o,y:o.x,x:o.y,g1:o.g1,g2:o.g2});return{ok:false,reason:'That trade would break the schedule.'}}
  if(o.kind==='buy')env.spend(t,BUY_COST);
  p.trades.push({week,from:o.x.name,to:o.y.name,kind:o.kind,home:o.g1.home===t.name});
  env.event({type:'NONCON_SCHEDULED',school:t,importance:o.kind==='marquee'?56:40,summary:`${t.name} ${o.g1.home===t.name?'will host':'will visit'} ${o.y.name} in week ${week}, replacing ${o.x.name}.`});
  return{ok:true,week,from:o.x.name,to:o.y.name,kind:o.kind,cost:o.kind==='buy'?BUY_COST:0};
 }
 // After a week is played: a marquee home game pays the boosters and the crowd.
 function settleWeek(t,week){
  const p=plan(t),row=games(t).find(x=>x.week===week);
  if(!row||!row.g.played||!row.home||p.paid.includes(week))return null;
  if(kind(t,row.opp,true)!=='marquee'&&!p.trades.some(x=>x.week===week&&x.kind==='marquee'))return null;
  p.paid.push(week);
  env.goodwill(t,MARQUEE_GOODWILL);t.fan_support=clamp(Math.round(num(t.fan_support,60)+MARQUEE_FANS),5,100);
  return{week,goodwill:MARQUEE_GOODWILL,fans:MARQUEE_FANS,opponent:row.opp?.name};
 }
 // A few of each kind for the card: the biggest names, the nearest drives, the softest guarantees.
 function shortlist(opts){
  const by=k=>opts.filter(o=>o.kind===k);
  const picked=[...by('marquee').slice(0,3),...by('regional').sort((a,b)=>num(a.miles,0)-num(b.miles,0)).slice(0,2),...by('buy').sort((a,b)=>num(a.y.prestige,0)-num(b.y.prestige,0)).slice(0,2),...by('standard').slice(0,2)];
  return picked.sort((a,b)=>num(b.y.prestige,0)-num(a.y.prestige,0));
 }
 // Average prestige of a team's opponents, and where its nonconference slate ranks nationally.
 function strength(t){
  const opps=(t.schedule||[]).map(g=>T(g.home===t.name?g.away:g.home)).filter(Boolean),non=(t.schedule||[]).filter(g=>!g.conf).map(g=>T(g.home===t.name?g.away:g.home)).filter(Boolean);
  const avgOf=list=>list.length?Math.round(list.reduce((n,o)=>n+num(o.prestige,60),0)/list.length*10)/10:0;
  const nonAvg=avgOf(non);
  const all=(universe().teams||[]).map(x=>avgOf((x.schedule||[]).filter(g=>!g.conf).map(g=>T(g.home===x.name?g.away:g.home)).filter(Boolean))).sort((a,b)=>b-a);
  return{overall:avgOf(opps),noncon:nonAvg,nonconRank:all.findIndex(v=>v<=nonAvg)+1,of:all.length};
 }
 return{TRADES,MARQUEE_PRESTIGE,MARQUEE_RANK,BUY_GAP,BUY_COST,MARQUEE_GOODWILL,MARQUEE_FANS,KINDS,plan,tradesLeft,open,games,options,shortlist,kind,trade,settleWeek,strength};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeNonconSystem};
}else{
 const noncon=makeNonconSystem({
  getUniverse:()=>universe,clamp,
  distance:(a,b)=>haversineMiles(a.lat||0,a.lon||0,b.lat||0,b.lon||0),
  validate:()=>validateSchedule(),
  fund:t=>globalThis.DynastyFacilities?.fundOf(t)??0,
  spend:(t,n)=>{const F=globalThis.DynastyFacilities;if(F){const p=F.state(t);p.fund=Math.max(0,p.fund-n)}},
  goodwill:(t,n)=>{const F=globalThis.DynastyFacilities;if(F){const p=F.state(t);p.goodwill=Math.min(100,p.goodwill+n)}},
  event:({type,school,importance,summary})=>{universe.events??=[];universe.events.push({id:`EVT_${type}_${universe.year}_${universe.week}_${school.id}_${(universe.events.length)}`,type,season:universe.year,week:universe.week,schoolIds:[school.id],playerIds:[],coachIds:[],gameIds:[],importance,summary})}
 });
 globalThis.DynastyNoncon=noncon;
 const ncEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const simWeekBeforeNoncon=simWeek;
 simWeek=function simWeekWithNoncon(){
  const week=universe?.week,out=simWeekBeforeNoncon.apply(this,arguments);
  const me=selected();
  if(me&&universe&&universe.week!==week&&week!=null){const r=noncon.settleWeek(me,week+1);if(r){
   // Add to the week's result line rather than replace it: the result is what the coach needs to read, and the
   // result splash and sound cues key on it ("Week N final: W ...").
   const prior=(typeof document!=='undefined'&&document.querySelector?.('#saveStatus')?.textContent)||'';
   setStatus(`${prior?`${prior} `:''}${r.opponent} drew a crowd: boosters +${r.goodwill} goodwill, fan support +${r.fans}.`);
  }}
  return out;
 };
 const label=k=>`<span class="lr-tag">${ncEsc(noncon.KINDS[k])}</span>`;
 function cardHTML(t){
  const rows=noncon.games(t),left=noncon.tradesLeft(t),s=noncon.strength(t),fund=globalThis.DynastyFacilities?.fundOf(t)??0;
  const week=row=>{
   const opts=row.tradable?noncon.options(t,row.week):[];
   const head=`<div class="noncon-week-head"><div><strong>Week ${row.week}</strong> · ${row.home?'vs':'at'} ${ncEsc(row.opp?.name||'—')} ${label(noncon.kind(t,row.opp,row.home))}<div class="small muted">Prestige ${row.opp?.prestige??'—'}${row.opp?.rank&&row.opp.rank<=25?` · ranked ${row.opp.rank}`:''} · ${ncEsc(row.opp?.conference||'')}</div></div><span class="small muted">${row.g.played?'Played':row.tradable?`${opts.length} other opponent${opts.length===1?'':'s'} available`:'Locked'}</span></div>`;
   if(!row.tradable||!opts.length)return`<div class="noncon-week">${head}</div>`;
   const opt=o=>`<li><span>${ncEsc(o.y.name)} ${label(o.kind)}<small>Prestige ${o.y.prestige}${o.y.rank&&o.y.rank<=25?` · ranked ${o.y.rank}`:''} · ${ncEsc(o.y.conference)}${o.miles!=null?` · ${o.miles} miles`:''}${o.kind==='buy'?` · costs ${noncon.BUY_COST} booster unit`:''}${o.kind==='marquee'&&row.home?` · boosters +${noncon.MARQUEE_GOODWILL} when played`:''}</small></span><button type="button" class="dw-button" data-nc-week="${row.week}" data-nc-opp="${ncEsc(o.y.name)}" ${!left||(o.kind==='buy'&&fund<noncon.BUY_COST)?'disabled':''}>${row.home?'Host':'Visit'} ${ncEsc(o.y.name)}</button></li>`;
   return`<details class="noncon-week"><summary>${head}</summary><ul class="noncon-options">${noncon.shortlist(opts).map(opt).join('')}</ul></details>`;
  };
  const made=noncon.plan(t).trades;
  return`<div class="section-head has-art">${globalThis.DynastyArt?.img('wall-calendar','dl-art dl-art-head')||''}<div><div class="eyebrow">NONCONFERENCE SCHEDULE</div><h3>Build your slate</h3><div class="muted">Trade a date for a marquee game, a buy game or a regional draw. Home and away stay as they are.</div></div></div>
  <div class="fb-summary"><div><span class="small muted">Trades left</span><strong>${left}<small> of ${noncon.TRADES}</small></strong></div><div><span class="small muted">Nonconference strength</span><strong>#${s.nonconRank}<small> of ${s.of} · avg prestige ${s.noncon}</small></strong></div><div><span class="small muted">Full schedule</span><strong>${s.overall}<small> avg prestige</small></strong></div></div>
  ${rows.map(week).join('')}
  ${made.length?`<div class="small muted">This season: ${made.map(x=>`week ${x.week} ${ncEsc(x.from)} → ${ncEsc(x.to)} (${ncEsc(noncon.KINDS[x.kind])})`).join('; ')}.</div>`:''}
  <p class="small muted">Games more than a week away can be traded. A tougher slate is harder to win and counts for more in the rankings.</p>`;
 }
 function renderNonconCard(){
  if(!universe?.teams)return;const t=selected();if(!t)return;
  let host=$('#nonconSchedule');
  if((!host||!host.isConnected)&&typeof document!=='undefined'&&document.querySelector){
   const anchor=document.querySelector('#season .two-col');
   if(anchor?.insertAdjacentElement){host=document.createElement('div');host.id='nonconSchedule';host.className='card noncon-card';anchor.insertAdjacentElement('afterend',host)}
  }
  if(!host)return;
  if(!noncon.games(t).some(r=>!r.g.played)){host.hidden=true;host.innerHTML='';return}
  host.hidden=false;host.innerHTML=cardHTML(t);
  host.querySelectorAll('[data-nc-week]').forEach(b=>b.onclick=e=>{
   e.preventDefault();
   const r=noncon.trade(t,Number(b.dataset.ncWeek),b.dataset.ncOpp);
   setStatus(r.ok?`Week ${r.week}: ${r.to} replaces ${r.from}.${r.cost?` ${r.cost} booster unit paid for the guarantee.`:''}`:r.reason);
   if(r.ok)autosaveAfter('management');render();
  });
 }
 const renderSeasonBeforeNoncon=TAB_RENDERERS.season;
 TAB_RENDERERS.season=()=>{renderSeasonBeforeNoncon();renderNonconCard()};
 if(typeof window!=='undefined'&&window.__DL_TEST__)window.__DL_TEST__.noncon=()=>{const t=selected();return t?{left:noncon.tradesLeft(t),games:noncon.games(t).map(r=>({week:r.week,opp:r.opp?.name,home:r.home,tradable:r.tradable,options:noncon.options(t,r.week).length}))}:null};
}
