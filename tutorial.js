// Guided tour (v0.15.1). A short, optional walk through the desks: weekly reminders, recruiting hours and the
// Recruiting Desk, staff assignments, the situational playbook, class report cards and the Portal Desk. It is
// offered from a card on This Week during a new dynasty's first weeks, can be restarted from that card, and
// never blocks anything: Escape or "End tour" closes it at any step.
function makeTutorialSystem(){
 'use strict';
 const STEPS=[
  {tab:'dashboard',target:['#weeklyHub:not(:empty)','.card:has(#hubTitle)','#hubTitle'],title:'This Week',body:'Every week starts here: decisions that need you, reminders worth doing, and news. Recruiting results (who chose you, who cut you, who flipped) and PAYOFF stories about players you recruited show up in this list.'},
  {tab:'recruiting',target:['.ra-nav','#raStrip','#rwSwitch'],title:'Recruiting hours',body:'Your staff get a budget of recruiting hours each week, from your recruiting coordinator, head coach and resources. Unused hours do not carry over. Turn on "Staff handle recruiting" if you would rather they spend them for you.'},
  {tab:'recruiting',target:['.recruiting-desk','#recruitingWorkspace','#recruiting'],title:'The Recruiting Desk',body:'Open a prospect to work him: call, pitch a topic (the desk shows how well it will land before you spend), offer, host a visit, or visit the family. Each recruit cuts his list to a Top 5 and a Top 3 before his decision week, and rival programs answer what you do.'},
  {tab:'staff',target:['#staffAssignments'],title:'Staff assignments',body:'Give each coach a recruiting territory and a position group. A strong recruiter makes every contact in his territory count for more; a strong developer lifts his room at camp. When a coach leaves, his territory and room stay open until you reassign them.'},
  {tab:'gamelab',target:['#situationalPlaybook'],title:'Situational playbook',body:'Choose how your staff call fourth downs, two-point tries and the late clock in games you sim or watch. When you coach live, their recommendation follows the same playbook.'},
  {tab:'program',target:['#arcClasses','#programHistory'],title:'How your classes turned out',body:'Every class you sign gets a report card here once it has played: starters, honors, draft picks, the best player, a steal and a miss, graded against the rest of the league. Each player\'s profile tells the story of how you won him.'},
  {tab:'offseason',target:['#portalDesk','#portalPanels','#offseason'],title:'The Portal Desk',body:'In the offseason the transfer portal gets its own desk: portal hours each round, a playing-time pitch with an honest read, your real odds with each target, and rival programs that counter when you get close.'}
 ];
 function seen(u){return!!u?.tutorial?.done}
 function markDone(u,how='finished'){if(u){u.tutorial={done:true,how,year:u.year,week:u.week}}}
 // Offer the tour in a new dynasty's first season, early on, until it is finished or dismissed.
 function shouldOffer(u){return!!u&&!seen(u)&&u.phase!=='complete'&&(u.week||0)<=3&&(u.history||[]).filter(h=>h.type==='season').length===0}
 return{STEPS,seen,markDone,shouldOffer};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeTutorialSystem};
}else{
 const tour=makeTutorialSystem();
 globalThis.DynastyTutorial=tour;
 const tEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let index=-1,returnFocus=null;
 // The first visible match with some size; an empty list spotlights the card around it instead.
 function targetFor(step){
  for(const sel of step.target){
   let el=document.querySelector(sel);if(!el||!el.getClientRects?.().length)continue;
   if(el.getBoundingClientRect().height<8)el=el.closest?.('.card,section')||null;
   if(el&&el.getBoundingClientRect().height>=8)return el;
  }
  return null;
 }
 function close(how){
  document.getElementById('tourLayer')?.remove();document.removeEventListener('keydown',onKey,true);window.removeEventListener('resize',place);
  if(index>=0)tour.markDone(universe,how);index=-1;
  if(typeof render==='function')render();
  returnFocus?.focus?.();returnFocus=null;
 }
 function onKey(e){
  if(e.key==='Escape'){e.preventDefault();close('ended')}
  else if(e.key==='ArrowRight'){e.preventDefault();show(index+1)}
  else if(e.key==='ArrowLeft'){e.preventDefault();show(index-1)}
 }
 function place(){
  const layer=document.getElementById('tourLayer');if(!layer||index<0)return;
  const el=targetFor(tour.STEPS[index]),spot=layer.querySelector('.tour-spot'),card=layer.querySelector('.tour-card');
  const vw=window.innerWidth,vh=window.innerHeight;
  if(!el){spot.hidden=true;card.style.left=`${Math.max(12,(vw-card.offsetWidth)/2)}px`;card.style.top=`${Math.max(12,(vh-card.offsetHeight)/2)}px`;return}
  const r=el.getBoundingClientRect(),pad=6,top=Math.max(4,r.top-pad),left=Math.max(4,r.left-pad),h=Math.min(r.height+pad*2,vh-top-4),w=Math.min(r.width+pad*2,vw-left-4);
  Object.assign(spot.style,{top:`${top}px`,left:`${left}px`,width:`${w}px`,height:`${h}px`});spot.hidden=false;
  // The card sits below the target when it fits, else above, else over the bottom of the screen.
  const ch=card.offsetHeight,cw=Math.min(card.offsetWidth,vw-24);
  let y=top+h+10;if(y+ch>vh-12)y=top-ch-10;if(y<12||y+ch>vh-12)y=vh-ch-12;
  card.style.top=`${Math.max(12,Math.min(y,vh-ch-12))}px`;card.style.left=`${Math.min(Math.max(12,left),vw-cw-12)}px`;
 }
 function show(i){
  if(i<0)return;if(i>=tour.STEPS.length){close('finished');return}
  index=i;const step=tour.STEPS[i];
  if(typeof goToTab==='function')goToTab(step.tab);
  let layer=document.getElementById('tourLayer');
  if(!layer){
   layer=document.createElement('div');layer.id='tourLayer';layer.className='tour-layer';
   layer.innerHTML=`<div class="tour-spot" aria-hidden="true"></div><section class="tour-card" role="dialog" aria-modal="false" aria-labelledby="tourTitle"><div class="eyebrow" data-tour-count></div><h3 id="tourTitle"></h3><p data-tour-body></p><div class="tour-actions"><button type="button" class="ghost" data-tour-end>End tour</button><span></span><button type="button" class="ghost" data-tour-back>Back</button><button type="button" data-tour-next>Next</button></div></section>`;
   document.body.appendChild(layer);
   layer.querySelector('[data-tour-end]').onclick=()=>close('ended');
   layer.querySelector('[data-tour-back]').onclick=()=>show(index-1);
   layer.querySelector('[data-tour-next]').onclick=()=>show(index+1);
   document.addEventListener('keydown',onKey,true);window.addEventListener('resize',place);
  }
  layer.querySelector('[data-tour-count]').textContent=`TOUR · ${i+1} OF ${tour.STEPS.length}`;
  layer.querySelector('#tourTitle').textContent=step.title;
  layer.querySelector('[data-tour-body]').textContent=step.body;
  layer.querySelector('[data-tour-back]').disabled=i===0;
  layer.querySelector('[data-tour-next]').textContent=i===tour.STEPS.length-1?'Finish':'Next';
  // Let the tab render, bring the target into view, then draw the spotlight around it.
  setTimeout(()=>{const el=targetFor(step);el?.scrollIntoView?.({block:'center',behavior:'instant'});setTimeout(()=>{place();layer.querySelector('[data-tour-next]')?.focus?.()},30)},30);
 }
 function start(){returnFocus=document.activeElement;show(0)}
 globalThis.DynastyTutorial.start=start;
 globalThis.DynastyTutorial.close=close;

 function offerHTML(){
  return`<div class="card tour-offer" id="tourOffer"><div><strong>New desks this season</strong><span class="small muted">A two-minute tour of recruiting hours, the desks, staff assignments and the playbook.</span></div><div class="tour-offer-actions"><button type="button" data-tour-start>Take the tour</button><button type="button" class="ghost" data-tour-dismiss>Not now</button></div></div>`;
 }
 extendRender('dashboard',()=>{
  document.getElementById('tourOffer')?.remove();
  if(index>=0||!tour.shouldOffer(universe))return;
  const hub=document.getElementById('weeklyHub'),host=hub?.closest?.('.card')||hub;if(!host)return;
  host.insertAdjacentHTML?.('beforebegin',offerHTML());
  const card=document.getElementById('tourOffer');if(!card)return;
  card.querySelector('[data-tour-start]').onclick=()=>start();
  card.querySelector('[data-tour-dismiss]').onclick=()=>{tour.markDone(universe,'dismissed');card.remove();setStatus('Tour dismissed. You can always find each desk from its tab.')};
 });
 if(globalThis.__DL_TEST__)Object.assign(globalThis.__DL_TEST__,{tourStart:start,tourClose:close,tourState:()=>({index,seen:tour.seen(universe)})});
}
