// v0.37 — a light fourth-quarter fatigue, so depth matters late. Each side of the ball loses a little in the fourth
// quarter and overtime: a base amount everyone pays, plus more when the players who rotate in late (RB2, WR4-5, TE2,
// the sixth and seventh linemen, the second wave of the front and the nickel and dime backs) are far below the
// starters. Measured on new universes the starter-to-backup gap is 4-9 rating points, which makes the penalty about
// 0.6-2.2 offense or defense rating points; it is capped at 3.
//
// Coached and simulated detailed games (Game Engine 2) apply it in the fourth quarter and overtime through the team
// inputs (fatigueOff / fatigueDef; a game started before v0.37 carries neither and plays as it did). Quick simulation
// has no quarters, so it applies a quarter of it across the whole game. Ratings and availability only: no randomness.
function makeFatigue(env){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 // [starters, players who rotate in late]
 const GROUPS={off:{RB:[1,1],WR:[3,2],TE:[1,1],OT:[2,1],OG:[2,1],C:[1,1]},def:{EDGE:[2,2],DT:[2,2],LB:[3,1],CB:[2,2],S:[2,1]}};
 const BASE=.5,PER_POINT=.35,GAP_FLOOR=4,MAX=3,EMPTY=45,QUICK_SHARE=.25;
 const ability=p=>Number(p?.trueNow)||EMPTY;
 function gap(team,side){
  const ok=env.available||(()=>true);let num=0,den=0;
  for(const [pos,[s,b]] of Object.entries(GROUPS[side])){
   const list=(team?.roster||[]).filter(p=>p.pos===pos&&ok(p)).sort((x,y)=>ability(y)-ability(x)||String(x.id).localeCompare(String(y.id)));
   const st=list.slice(0,s),bk=list.slice(s,s+b);
   const sa=st.length?st.reduce((n,p)=>n+ability(p),0)/st.length:EMPTY;
   let bsum=0;for(let i=0;i<b;i++)bsum+=bk[i]?ability(bk[i]):EMPTY;
   num+=(sa-bsum/b)*b;den+=b;
  }
  return den?num/den:0;
 }
 const penaltyFor=g=>Math.round(clamp(BASE+(g-GAP_FLOOR)*PER_POINT,0,MAX)*100)/100;
 function forTeam(team){return{off:penaltyFor(gap(team,'off')),def:penaltyFor(gap(team,'def'))}}
 // The quick-sim blend: a quarter of the late-game penalty on the units that rotate.
 function blend(profile,f){
  if(!profile||!f)return profile;
  const o=f.off*QUICK_SHARE,d=f.def*QUICK_SHARE,out={...profile};
  for(const k of ['skill','ol','offense'])if(Number.isFinite(out[k]))out[k]-=o;
  for(const k of ['front','coverage','defense'])if(Number.isFinite(out[k]))out[k]-=d;
  if(Number.isFinite(out.overall))out.overall-=(o+d)/2;
  return out;
 }
 return{GROUPS,BASE,PER_POINT,MAX,QUICK_SHARE,gap,penaltyFor,forTeam,blend};
}

if(typeof module==='object'&&module.exports){
 module.exports={makeFatigue};
}else{
 const fatigue=makeFatigue({available:p=>gameAvailable(p)});
 globalThis.DynastyFatigue=fatigue;
 let quickSims=0;
 // Every profile a game reads carries the late-game penalty; quick simulation folds a quarter of it in.
 const gameProfilesBeforeFatigue=gameProfiles;
 gameProfiles=function gameProfilesWithFatigue(t){
  const base=gameProfilesBeforeFatigue.apply(this,arguments);if(!base||!t)return base;
  const f=fatigue.forTeam(t);
  if(quickSims>0)return fatigue.blend(base,f);
  return{...base,fatigueOff:f.off,fatigueDef:f.def};
 };
 const gameSimBeforeFatigue=gameSim;
 gameSim=function gameSimWithFatigue(){quickSims++;try{return gameSimBeforeFatigue.apply(this,arguments)}finally{quickSims--}};
}
