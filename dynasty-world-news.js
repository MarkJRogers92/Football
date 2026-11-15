// Optional, current facts shared by the Wire and the short weekly briefing.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DynastyWorldNews=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const TYPES={PRO_MILESTONE:{kicker:'PRO ALUMNI',tab:'program'},LOCKER_ROOM_MEETING:{kicker:'LOCKER ROOM',tab:'roster'},LOCKER_ROOM_FLASHPOINT:{kicker:'LOCKER ROOM',tab:'roster'},LOCKER_ROOM_RESOLVED:{kicker:'LOCKER ROOM',tab:'roster'},SCOUTING_VINDICATED:{kicker:'YOU SAW HIM FIRST',tab:'recruiting'},STATEMENT_WIN:{kicker:'STATEMENT WIN',tab:'season'}};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function items(u,t){
  if(!u||!t)return[];
  const seen=new Set();
  const resolved=(u.events||[]).filter(e=>e.type==='LOCKER_ROOM_RESOLVED'&&e.season===u.year&&e.week===u.week&&(e.schoolIds||[]).includes(t.id));
  return (u.events||[]).filter(e=>{
   if(!TYPES[e.type]||!e.summary||e.season!==u.year||e.week!==u.week||!(e.schoolIds||[]).includes(t.id))return false;
   if(e.type==='LOCKER_ROOM_FLASHPOINT'&&resolved.some(r=>(r.playerIds||[]).some(id=>(e.playerIds||[]).includes(id))))return false;
   const key=e.id||`${e.type}:${e.summary}`;if(seen.has(key))return false;seen.add(key);return true;
  }).sort((a,b)=>(b.importance||0)-(a.importance||0)||String(a.id).localeCompare(String(b.id))).slice(0,2)
   .map(e=>({id:String(e.id||`${e.type}:${e.summary}`),title:e.summary,detail:'',mine:true,importance:e.importance||0,...TYPES[e.type]}));
 }
 function wireItems(u,t){return items(u,t).map(e=>({worldEventId:e.id,kicker:e.kicker,main:esc(e.title),sub:'',tab:e.tab,type:'news'}))}
 return{items,wireItems};
});
