// v0.37 — facilities that help players by name. The Training & Performance Center (the training track in
// facilities-boosters.js) now does two things a player can feel:
//
// * Recovery. After each regular-season week, every injured player at a program with a training level L has an L×5%
//   chance (25% at level 5) to heal a week early. Every program gets this, on its own level. The roll is a hash of the
//   player, season and week, so it never touches the gameplay random stream and a reload never changes it. It runs
//   after the week is played, so a Game Day prepared before kickoff sees the same roster the game is played with.
// * Development. A player on a featured development plan gets extra work in his plan's focus at spring and fall camp:
//   +0.08×L to each focus trait at spring, scaled like the rest of camp in the fall (about a tenth of a plan's own bonus
//   per level).
//
// The coach's program keeps a short list of who was helped (t.facilityHelp {rows}, last two seasons, at most 16 rows),
// shown under the facilities card on the Program page and reported in The Wire when a starter returns early.
function makeFacilityEffects(env){
 'use strict';
 const universe=()=>env.getUniverse();
 const RECOVERY_STEP=.05,DEV_STEP=.08,LOG_MAX=16;
 function hash(...parts){let h=2166136261;for(const ch of parts.join('|')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
 const unit=(...parts)=>hash(...parts)/4294967296;
 const recoveryChance=level=>Math.max(0,Math.min(5,Number(level)||0))*RECOVERY_STEP;
 // Players who heal a week early this week. Mutates injuryWeeks/injury; returns what happened.
 function recover(team,level,{year=universe().year,week=universe().week}={}){
  const chance=recoveryChance(level),out=[];if(!chance)return out;
  for(const p of team?.roster||[]){
   if(!(Number(p.injuryWeeks)>0))continue;
   if(unit(p.id,year,week,'training-rehab')>=chance)continue;
   p.injuryWeeks=Math.max(0,p.injuryWeeks-1);
   const back=p.injuryWeeks===0,injury=p.injury;
   if(back)p.injury=null;
   out.push({playerId:p.id,name:p.name,pos:p.pos,injury:typeof injury==='string'?injury:injury?.name||injury?.type||null,back,weeksLeft:p.injuryWeeks});
  }
  return out;
 }
 // Extra camp work for a featured plan's focus traits.
 function devBoost(level,focus,bonusTable,phase){
  const L=Math.max(0,Math.min(5,Number(level)||0));if(!L)return null;
  const targets=Object.keys(bonusTable?.[focus]||bonusTable?.Balanced||{});if(!targets.length)return null;
  const scale=phase==='spring'?1:.55,out={};for(const k of targets)out[k]=Math.round(DEV_STEP*L*scale*1000)/1000;return out;
 }
 function log(team){const u=universe();team.facilityHelp??={rows:[]};team.facilityHelp.rows=(team.facilityHelp.rows||[]).filter(r=>r.year>=u.year-1).slice(-LOG_MAX);return team.facilityHelp}
 function note(team,row){const h=log(team),key=`${row.kind}:${row.playerId}:${row.year}:${row.phase||row.week}`;if(h.rows.some(r=>r.key===key))return false;h.rows.push({...row,key});h.rows=h.rows.slice(-LOG_MAX);return true}
 function rowText(r){
  if(r.kind==='recovery')return`${r.pos} ${r.name} ${r.back?`returned a week early${r.injury?` from ${r.injury}`:''}`:`is a week ahead in rehab${r.injury?` (${r.injury})`:''}`} (week ${r.week}, ${r.year})`;
  return`${r.pos} ${r.name}: extra ${r.focus} work at ${r.phase==='spring'?'spring':'fall'} camp (${r.year})`;
 }
 return{RECOVERY_STEP,DEV_STEP,LOG_MAX,hash,unit,recoveryChance,recover,devBoost,log,note,rowText};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeFacilityEffects};
}else{
 const fx=makeFacilityEffects({getUniverse:()=>universe});
 globalThis.DynastyFacilityEffects=fx;
 const feEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const trainingLevel=t=>globalThis.DynastyFacilities?.level(t,'training')||0;
 const mine=t=>t&&t.name===$('#userTeam')?.value;

 const simWeekBeforeFacilityFx=simWeek;
 simWeek=function simWeekWithFacilityRecovery(){
  const week=universe?.week,phase=universe?.phase,out=simWeekBeforeFacilityFx.apply(this,arguments);
  try{
   if(universe&&phase==='regular'&&week!=null&&universe.week===week+1){
    for(const t of universe.teams){
     const L=trainingLevel(t);if(!L)continue;
     const healed=fx.recover(t,L,{year:universe.year,week:week+1});
     if(!healed.length||!mine(t))continue;
     for(const h of healed){
      fx.note(t,{kind:'recovery',year:universe.year,week:week+1,...h});
      const p=t.roster.find(x=>x.id===h.playerId),starter=(p?.stats?.starts||0)>0;
      if(h.back){
       universe.events??=[];universe.events.push({id:`EVT_REHAB_${universe.year}_${week+1}_${h.playerId}`,type:'FACILITY_HELP',season:universe.year,week:universe.week,schoolIds:[t.id],playerIds:[h.playerId],coachIds:[],gameIds:[],importance:52+(starter?6:0),
        summary:`${h.pos} ${h.name} is back a week early${h.injury?` from ${h.injury}`:''}: credit the Training Center (level ${L}).`,metadata:{level:L}});
      }
     }
    }
   }
  }catch(err){console.error(err)}
  return out;
 };

 // Featured plans: extra work in the plan's focus, logged once per player per camp.
 const trainingAttrBoostBeforeFacilityFx=trainingAttrBoost;
 trainingAttrBoost=function trainingAttrBoostWithFacilities(p,teamFocus,individual,phase){
  const out=trainingAttrBoostBeforeFacilityFx.apply(this,arguments);
  try{
   const plans=globalThis.DynastyLabDevelopmentPlans,plan=plans?.active(p);if(!plan)return out;
   const t=findPlayer(p.id)?.team;const L=t?trainingLevel(t):0;
   const add=fx.devBoost(L,plan.focus,plans.bonus,phase);if(!add)return out;
   for(const [k,v] of Object.entries(add))out[k]=(out[k]||0)+v;
   if(mine(t))fx.note(t,{kind:'development',year:universe.year,phase:phase==='spring'?'spring':'fall',playerId:p.id,name:p.name,pos:p.pos,focus:plan.focus,level:L});
  }catch(err){console.error(err)}
  return out;
 };

 // Under the facilities card: who the Training Center helped.
 function renderFacilityHelp(){
  const host=$('#facilitiesBoosters'),t=selected();if(!host?.insertAdjacentHTML||!t)return;
  host.querySelector('.fb-helped')?.remove();
  const rows=(t.facilityHelp?.rows||[]).filter(r=>r.year>=universe.year-1).slice().reverse().slice(0,8);
  const L=trainingLevel(t);
  if(!rows.length&&!L)return;
  host.insertAdjacentHTML('beforeend',`<div class="fb-helped"><strong>Who the Training Center helped</strong>${rows.length?`<ul>${rows.map(r=>`<li><button type="button" class="player-button" data-player="${feEsc(r.playerId)}">${feEsc(r.pos)} ${feEsc(r.name)}</button> ${feEsc(fx.rowText(r).replace(`${r.pos} ${r.name}`,'').replace(/^:\s*/,''))}</li>`).join('')}</ul>`:'<p class="small muted">Nobody yet. At level '+L+', each injured player has a '+Math.round(fx.recoveryChance(L)*100)+'% chance a week to heal early, and featured development plans get extra work at camp.</p>'}</div>`);
  host.querySelectorAll('.fb-helped [data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));
 }
 const renderProgramBeforeFacilityFx=TAB_RENDERERS.program;
 TAB_RENDERERS.program=()=>{renderProgramBeforeFacilityFx();renderFacilityHelp()};
}
