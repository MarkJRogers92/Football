// Read-only presentation adapter for the premium recruiting workspace.
// This file is injected inside app.js' closure, where the canonical recruiting/scouting
// state lives. It intentionally exports only staff-facing/known information and never
// exposes hidden true ratings, potential, volatility, or mutable simulation objects.
(()=>{
 'use strict';
 function momentumLabel(r){const n=Math.round(Number(r?.trend)||0);return n>=6?`Heating up +${n}`:n>=2?`Gaining +${n}`:n<=-6?`Sliding ${n}`:n<=-2?`Cooling ${n}`:'Steady'}
 function safeBattle(r){
  try{const s=globalThis.DynastyLabRecruitingBattles?.summary?.(r);return s?{rank:s.rank??null,gap:s.gap??null,leader:s.leader||null,label:s.label||'No race'}:null}catch{return null}
 }
 function snapshot(id){
  const t=typeof selected==='function'?selected():null,r=universe?.recruits?.find(x=>String(x.id)===String(id));if(!t||!r)return null;
  let staff=null,stage='Preliminary';
  try{if(typeof recruitStaffVerdict==='function'){const v=recruitStaffVerdict(r,t);staff={label:v.label||'Preliminary',conviction:v.conviction||'Preliminary',confidence:Number.isFinite(v.confidence)?Math.round(v.confidence):null,risk:v.risk||null,summary:v.summary||''}}}catch{}
  try{if(typeof recruitScoutingRecord==='function'){const rec=recruitScoutingRecord(r,t,false);stage=rec?.full?'Full evaluation':rec?.quick?'Film reviewed':'Preliminary'}}catch{}
  return{staff,stage,battle:safeBattle(r),momentum:momentumLabel(r),interest:Math.round(Number(r.interest)||0),targeted:!!r.targeted,committed:r.committed||null};
 }
 globalThis.DynastyRecruitingWorkspaceIntel=Object.freeze({forId:snapshot});
})();