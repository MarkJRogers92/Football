// v0.13.1: long per-player tables fold behind a button. The Development tab's Individual
// Training Plans table is one row per player: about 8,000px on desktop and 18,000px on a
// phone, 80% of that page. Every row stays in the DOM and every control stays reachable; the
// first rows show and a toggle reveals the rest. The table is rebuilt on every render, so the
// fold is reapplied after each one.
(function(){
 'use strict';
 if(typeof extendRender!=='function')return;
 const FOLDS=[{view:'development',body:'#trainingBody',keep:12,noun:'players'}];
 const expanded=new Set();
 function apply(fold){
  const body=document.querySelector(fold.body);if(!body)return;
  const wrap=body.closest('.table-wrap');if(!wrap||!wrap.parentElement)return;
  const rows=[...body.rows];
  let toggle=wrap.parentElement.querySelector(`[data-fold-toggle="${fold.body}"]`);
  if(rows.length<=fold.keep){toggle?.remove();rows.forEach(r=>{r.hidden=false});return}
  const open=expanded.has(fold.body);
  rows.forEach((r,i)=>{r.hidden=!open&&i>=fold.keep});
  if(!toggle){
   toggle=document.createElement('button');toggle.type='button';toggle.className='fold-toggle';toggle.dataset.foldToggle=fold.body;
   wrap.after(toggle);
   toggle.onclick=()=>{if(expanded.has(fold.body))expanded.delete(fold.body);else expanded.add(fold.body);apply(fold)};
  }
  toggle.setAttribute('aria-expanded',open?'true':'false');
  toggle.textContent=open?`Show fewer ${fold.noun}`:`Show all ${rows.length} ${fold.noun}`;
 }
 for(const fold of FOLDS)extendRender(fold.view,()=>apply(fold));

 // Whole blocks fold on a phone only. The Roles & Depth page repeats every role as a dense card
 // (7,700px on a phone) after the formation view, which already covers the main roles; the cards
 // stay for the extra roles, one tap away.
 const BLOCKS=[{view:'depth',el:'#depthGrid',noun:'role controls',count:el=>el.querySelectorAll('select[data-role]').length}];
 const phone=()=>!!window.matchMedia?.('(max-width:700px)').matches;
 const blocksOpen=new Set();
 function applyBlock(block){
  const el=document.querySelector(block.el);if(!el||!el.parentElement)return;
  let toggle=el.parentElement.querySelector(`[data-fold-toggle="${block.el}"]`);
  if(!phone()){el.classList.remove('fold-block-collapsed');toggle?.remove();return}
  const open=blocksOpen.has(block.el),n=block.count(el);
  el.classList.toggle('fold-block-collapsed',!open);
  if(!toggle){
   toggle=document.createElement('button');toggle.type='button';toggle.className='fold-toggle';toggle.dataset.foldToggle=block.el;
   el.before(toggle);
   toggle.onclick=()=>{if(blocksOpen.has(block.el))blocksOpen.delete(block.el);else blocksOpen.add(block.el);applyBlock(block)};
  }
  toggle.setAttribute('aria-expanded',open?'true':'false');
  toggle.textContent=open?`Hide ${block.noun}`:`Show all ${n} ${block.noun}`;
 }
 // Some views (Roles & Depth) have no extension render steps; wrap their tab renderer instead.
 for(const block of BLOCKS){
  if(typeof TAB_RENDERERS==='object'&&TAB_RENDERERS&&typeof TAB_RENDERERS[block.view]==='function'){
   const base=TAB_RENDERERS[block.view];
   TAB_RENDERERS[block.view]=function(){const out=base.apply(this,arguments);applyBlock(block);return out};
  }else extendRender(block.view,()=>applyBlock(block));
 }
 window.matchMedia?.('(max-width:700px)').addEventListener?.('change',()=>BLOCKS.forEach(applyBlock));
})();
