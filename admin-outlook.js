// Administration outlook: a week-to-week read on the board's confidence. It applies the same
// formula as adminSeasonReview to the current win pace, so the projection is exactly what the
// end-of-season review would do if the season finished at that pace. It stores nothing.
const ADMIN_BANDS=[{min:0,label:'Final warning'},{min:20,label:'Hot seat'},{min:40,label:'Watched'},{min:60,label:'Backed'},{min:80,label:'Secure'}];
function adminOutlookModel(t=selected()){
 if(!t)return null;
 ensureAdminState(t);
 const conf=t.adminConfidence,exp=seasonExpectation(t),w=t.w||0,l=t.l||0,played=w+l,left=Math.max(0,12-played);
 const reviewed=(universe.tenure?.seasons||[]).find(s=>s.year===universe.year&&universe.tenure?.school===t.name);
 if(reviewed)return{mode:'reviewed',conf,label:adminConfidenceLabel(conf),exp,before:reviewed.before,delta:reviewed.delta,
  text:`Season review: ${reviewed.delta>=0?'+':''}${reviewed.delta} (${reviewed.w}–${reviewed.l} against ${reviewed.expected} expected wins).`};
 if(openingPreseason()||(universe.phase==='regular'&&played===0))return{mode:'preseason',conf,label:adminConfidenceLabel(conf),exp,
  text:`The board expects ${exp} wins this season.`};
 const settled=universe.phase==='complete';
 const projectedWins=settled||universe.phase!=='regular'?w:clamp(Math.round(w/Math.max(1,played)*12),w,w+left);
 const swing=clamp(1.6-((t.admin_patience??60)/100),.7,1.5);
 const titleBonus=(t.champ?14:0)+(conferenceChampionIdsFor().includes(t.id)?6:0);
 // Goal adjustments only count once goals are decided, so the in-season projection leaves them out.
 const goalAdjustment=settled?evaluateSeasonGoals(t,true).adjustment:0;
 const delta=Math.round((projectedWins-exp)*6*swing+titleBonus+goalAdjustment),projected=clamp(conf+delta,0,100);
 const pace=settled||universe.phase!=='regular'?`Finished ${w}–${l}`:`On pace for ${projectedWins} wins`;
 return{mode:settled?'final':'pace',conf,label:adminConfidenceLabel(conf),exp,projectedWins,projected,projectedLabel:adminConfidenceLabel(projected),delta,
  text:`${pace} · the board expects ${exp}. ${settled?'Review':'At this pace the review'} would move confidence ${delta>=0?'+':''}${delta} to ${projected} (${adminConfidenceLabel(projected)}).`};
}
function adminOutlookHTML(m){
 const marker=(v,cls,title)=>`<span class="ao-marker ${cls}" style="left:${clamp(v,0,100)}%" title="${esc(title)}"></span>`;
 const markers=[marker(m.conf,'now',`Now: ${m.conf}`)];
 if(m.mode==='pace'||m.mode==='final')markers.push(marker(m.projected,'projected',`Projected: ${m.projected}`));
 if(m.mode==='reviewed')markers.push(marker(m.before,'before',`Before review: ${m.before}`));
 return `<div class="ao-head"><span class="eyebrow">BOARD CONFIDENCE</span><strong>${esc(m.conf)} · ${esc(m.label)}</strong>${m.projectedLabel&&m.projectedLabel!==m.label?`<span class="ao-shift ${m.projected<m.conf?'down':'up'}">→ ${esc(m.projectedLabel)}</span>`:''}</div>
 <div class="ao-meter" role="img" aria-label="${esc(`Board confidence ${m.conf} of 100, ${m.label}. ${m.text}`)}">${ADMIN_BANDS.map((b,i)=>`<span class="ao-band b${i}" style="left:${b.min}%;width:${(ADMIN_BANDS[i+1]?.min??100)-b.min}%"></span>`).join('')}${markers.join('')}</div>
 <div class="ao-labels" aria-hidden="true">${ADMIN_BANDS.map(b=>`<span>${esc(b.label)}</span>`).join('')}</div>
 <p class="ao-note">${esc(m.text)}</p>`;
}
function renderAdminOutlook(){
 const goals=document.querySelector('#seasonGoalsDashboard');if(!goals)return;
 let host=document.querySelector('#adminOutlook');const m=adminOutlookModel();
 if(!m){if(host)host.hidden=true;return}
 if(!host){host=document.createElement('div');host.id='adminOutlook';host.className='admin-outlook';goals.before(host)}
 host.hidden=false;host.innerHTML=adminOutlookHTML(m);
}
extendRender('dashboard',renderAdminOutlook);
globalThis.DynastyAdminOutlook={model:adminOutlookModel};
