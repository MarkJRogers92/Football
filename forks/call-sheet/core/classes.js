// Call Sheet roster life (rules v0.6): class years, development, graduation and recruiting classes.
// Every starter has a year (FR–SR). After each season seniors graduate, everyone else develops, and each program
// signs a recruiting class for the open spots. Recruit quality follows the season you just had, a little.
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const deps=node?[require('./data.js'),require('./roster.js'),require('../../../rng.js')]:[root.CallSheet.data,root.CallSheet.roster,root.DynastyRng];
  const api=factory(...deps);
  if(node)module.exports=api;else root.CallSheet.classes=api;
})(typeof window==='object'?window:globalThis,function(D,Ro,DynastyRng){
'use strict';
const YEARS=['','FR','SO','JR','SR'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const allPlayers=lu=>[...Object.values(lu.off),...Object.values(lu.def)];
const ovrOf=p=>{const s=D.STYLE_TRAITS[p.archetype]||[];return Math.round(s.reduce((a,t)=>a+p.traits[t],0)/Math.max(1,s.length)*.6+Object.values(p.traits).reduce((a,v)=>a+v,0)/7*.4)};

// Give a fresh lineup believable class years (starters skew older).
function assignYears(lineup,seed){
  const rng=DynastyRng.create(`years:${seed}`);
  for(const p of allPlayers(lineup)){if(p.year)continue;const r=rng.next();p.year=r<.12?1:r<.37?2:r<.68?3:4;p.career??=blankCareer()}
  return lineup;
}
function blankCareer(){return{games:0,passYds:0,passTD:0,rushYds:0,rushTD:0,rec:0,recYds:0,recTD:0,sacks:0,ints:0,tackles:0}}
// Add one game's box score (battle.players) into the lineup's careers.
function recordCareers(lineup,players){
  const byId=new Map(allPlayers(lineup).map(p=>[p.id,p]));
  for(const s of Object.values(players||{})){
    const p=byId.get(s.id);if(!p)continue;const c=p.career??=blankCareer();
    c.passYds+=s.passYds;c.passTD+=s.passTD;c.rushYds+=s.rushYds;c.rushTD+=s.rushTD;c.rec+=s.rec;c.recYds+=s.recYds;c.recTD+=s.recTD;c.sacks+=s.sacks;c.ints+=s.intDef;c.tackles+=s.tackles;
  }
  for(const p of allPlayers(lineup))(p.career??=blankCareer()).games++;
}
// One short career line, the most telling numbers first.
function careerLine(p){
  const c=p.career||blankCareer(),out=[];
  if(c.passYds)out.push(`${c.passYds.toLocaleString()} pass yds, ${c.passTD} TD`);
  if(c.rushYds>99)out.push(`${c.rushYds.toLocaleString()} rush yds`);
  if(c.recYds>99)out.push(`${c.rec} catches, ${c.recYds.toLocaleString()} yds`);
  if(c.sacks)out.push(`${c.sacks} sacks`);if(c.ints)out.push(`${c.ints} INT`);
  if(!out.length&&c.tackles)out.push(`${c.tackles} tackles`);
  return`${c.games} game${c.games===1?'':'s'}${out.length?' · '+out.slice(0,2).join(' · '):''}`;
}
const stars=q=>q>=79?5:q>=73?4:q>=66?3:2;
// Three prospects for one open spot. Better seasons bring slightly better prospects.
function prospects(programId,role,pos,season,winPct,n=3){
  const rng=DynastyRng.create(`prospects:${programId}:${season}:${role}`),out=[];
  const archs=[...D.STYLES[pos]];
  for(let i=0;i<n;i++){
    const arch=archs.length?archs.splice(rng.int(0,archs.length-1),1)[0]:rng.pick(D.STYLES[pos]);
    const q=Math.round(66+(winPct-.5)*10+rng.gauss()*6+(i===0?2:0));
    const p=Ro.makePlayer(rng,role,pos,arch,q-4); // arrives a little raw
    p.id=`${programId}-${role}-s${season}-${i}`;p.year=1;p.career=blankCareer();p.stars=stars(q);p.potential=q;
    out.push(p);
  }
  return out.sort((a,b)=>b.stars-a.stars||b.ovr-a.ovr);
}
// Graduate seniors; everyone else gets a year older and develops (younger players grow more).
function graduate(lineup){
  const gone=[];
  for(const side of ['off','def'])for(const [role,p] of Object.entries(lineup[side]))if(p.year>=4){gone.push({side,role,player:p});delete lineup[side][role]}
  return gone;
}
function develop(lineup,seed){
  const rng=DynastyRng.create(`develop:${seed}`);let total=0,n=0;
  for(const p of allPlayers(lineup)){
    const before=p.ovr,grow=p.year===1?4:p.year===2?3:2;
    for(const t of D.TRAITS)p.traits[t]=clamp(p.traits[t]+Math.max(0,Math.round(grow+rng.gauss()*1.5)),35,99);
    p.year=Math.min(4,p.year+1);p.ovr=ovrOf(p);total+=p.ovr-before;n++;
  }
  return n?total/n:0;
}
function sign(lineup,side,role,recruit){lineup[side][role]=recruit;return recruit}
// Open spots after graduation, with their prospects.
function openSpots(lineup,programId,season,winPct){
  const spots=[];
  for(const [role,pos] of Object.entries(D.OFF_ROLES))if(!lineup.off[role])spots.push({side:'off',role,pos,prospects:prospects(programId,role,pos,season,winPct)});
  for(const [role,pos] of Object.entries(D.DEF_ROLES))if(!lineup.def[role])spots.push({side:'def',role,pos,prospects:prospects(programId,role,pos,season,winPct)});
  return spots;
}
// AI programs (and "sign best class") take the top prospect at every spot.
function autoSign(lineup,spots){return spots.map(s=>sign(lineup,s.side,s.role,s.prospects[0]))}
function classRating(recruits){return recruits.length?recruits.reduce((a,r)=>a+r.stars,0)/recruits.length:0}

return{YEARS,assignYears,blankCareer,recordCareers,careerLine,stars,prospects,graduate,develop,sign,openSpots,autoSign,classRating,allPlayers,ovrOf};
});
