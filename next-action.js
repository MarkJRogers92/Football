(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.DynastyNextAction=api;api.install(root.document)}
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function model({decisionCount=0,items=[]}={}){
  if(decisionCount>0)return{kind:'decision',label:decisionCount===1?'Resolve decision':`Resolve ${decisionCount} decisions`};
  const item=items.find(x=>!x.done);
  return item?{kind:'plan',label:item.label||'Next action',tab:item.tab||null,index:item.index??0}:{kind:'clear',label:'All caught up'};
 }
 function readState(doc){
  const decisions=[...(doc.querySelectorAll?.('#weeklyDecisions .decision-card')||[])];
  const nodes=[...(doc.querySelectorAll?.('#weeklyPlan .plan-item')||[])];
  const items=nodes.map((el,index)=>({index,done:el.classList?.contains('plan-done'),label:el.querySelector?.('.plan-label')?.textContent?.trim()||'',tab:el.dataset?.tab||null,node:el}));
  return{decisions,items,next:model({decisionCount:decisions.length,items})};
 }
 function install(doc){
  if(!doc?.querySelector)return false;
  const button=doc.querySelector('#hubAdvance'),plan=doc.querySelector('#weeklyPlan'),decisions=doc.querySelector('#weeklyDecisions');
  if(!button||!plan)return false;
  button.dataset.nextActionController='1';
  const refresh=()=>{
   const state=readState(doc),next=state.next;
   button.textContent=next.kind==='clear'?'All caught up':`Next: ${next.label}`;
   button.disabled=next.kind==='clear';
   button.title=next.kind==='decision'?'Resolve the Coach’s Desk item before advancing.':'Open the next unfinished item from the weekly plan.';
   return state;
  };
  button.addEventListener('click',e=>{
   const state=refresh();
   e.preventDefault();e.stopImmediatePropagation();
   if(state.next.kind==='decision'){
    const target=state.decisions[0]?.querySelector?.('.decision-option')||state.decisions[0];
    target?.scrollIntoView?.({block:'center'});target?.focus?.();return;
   }
   if(state.next.kind==='plan'){
    const item=state.items.find(x=>!x.done)?.node;
    item?.click?.();item?.focus?.();
   }
  },true);
  const Observer=doc.defaultView?.MutationObserver||root.MutationObserver;
  if(Observer){const observer=new Observer(refresh);observer.observe(plan,{childList:true,subtree:true,attributes:true});if(decisions)observer.observe(decisions,{childList:true,subtree:true});button.__nextActionObserver=observer}
  refresh();
  return true;
 }
 return{model,readState,install};
});
