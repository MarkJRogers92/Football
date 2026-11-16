// Test rosters for the Call Sheet sandbox. In the real fork an adapter reads Dynasty Lab's own players
// (same archetypes, same seven traits) instead; this file only makes lineups to battle with.
(function(root,factory){
  const data=(typeof module==='object'&&module.exports)?require('./data.js'):root.CallSheet.data;
  const rng=(typeof module==='object'&&module.exports)?require('../../../rng.js'):root.DynastyRng;
  const api=factory(data,rng);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CallSheet.roster=api;
})(typeof window==='object'?window:globalThis,function(D,DynastyRng){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const FIRST=['Dante','Marcus','Theo','Jalen','Nico','Ray','Mason','Eli','Tyrese','Caleb','Jordan','Malik','Owen','Darius','Isaiah','Cole','Andre','Luke','Xavier','Jamal','Grant','Devin','Micah','Trey','Bo','Kendrick','Silas','Amari','Reid','Tobias'];
const LAST=['Ruiz','Hale','Park','Cross','Bell','Odom','Reyes','Grant','Moss','Fields','Carter','Okafor','Lyle','Banks','Pryor','Vance','Holt','Dixon','Sims','Ware','Beck','Nash','Coles','Kemp','Ford','Ames','Price','Boone','Hart','Wells'];

function makePlayer(rng,role,pos,archetype,quality,bias={}){
  const strong=D.STYLE_TRAITS[archetype]||[];
  const traits={};
  for(const t of D.TRAITS){
    let v=quality+rng.gauss()*5+(strong.includes(t)?9:-3)+(bias[t]||0);
    traits[t]=clamp(Math.round(v),35,99);
  }
  const ovr=Math.round(strong.reduce((s,t)=>s+traits[t],0)/Math.max(1,strong.length)*.6+Object.values(traits).reduce((s,v)=>s+v,0)/7*.4);
  return{id:`${role}-${rng.int(1000,9999)}`,name:`${rng.pick(FIRST)} ${rng.pick(LAST)}`,role,pos,archetype,traits,ovr,number:rng.int(1,99)};
}

// spec: {name, quality, archetypes:{role:archetype}, quality by role overrides, bias by role}
function makeTeam(spec,seed){
  const rng=DynastyRng.create(seed||spec.name);
  const lineup={off:{},def:{}};
  for(const [role,pos] of Object.entries(D.OFF_ROLES)){
    const arch=spec.archetypes?.[role]||rng.pick(D.STYLES[pos]);
    lineup.off[role]=makePlayer(rng,role,pos,arch,spec.roleQuality?.[role]??spec.quality,spec.bias?.[role]);
  }
  for(const [role,pos] of Object.entries(D.DEF_ROLES)){
    const arch=spec.archetypes?.[role]||rng.pick(D.STYLES[pos]);
    lineup.def[role]=makePlayer(rng,role,pos,arch,spec.roleQuality?.[role]??spec.quality,spec.bias?.[role]);
  }
  return{name:spec.name,short:spec.short||spec.name.slice(0,3).toUpperCase(),colors:spec.colors||['#c9a227','#1b2433'],lineup,
    coach:{name:spec.coach||'Coordinator',discipline:spec.discipline??4,film:spec.film!==false,passRate:spec.passRate??.5}};
}

// Three contrasting rosters from DESIGN.md §7, plus a neutral control.
const PRESETS={
  ground:{name:'Ridgeview Veterans',short:'RDG',quality:72,discipline:5,passRate:.38,colors:['#7a1f2b','#e8dcc0'],coach:'Hollis (disciplined)',
    archetypes:{QB:'Toolsy Project',RB:'Gap Hammer',TE:'Inline Mauler',LG:'Pulling Guard',C:'Interior Technician',LT:'Power Edge',RT:'Power Edge',NT:'Gap Eater',MIKE:'Box Enforcer',FS:'Trigger Safety'},
    roleQuality:{QB:62,LT:80,LG:80,C:80,RG:80,RT:78,RB:78,TE:76,NT:76,MIKE:76}},
  tempo:{name:'Coastal Tech Freshmen',short:'CTF',quality:70,discipline:3,passRate:.52,colors:['#0f5e6e','#f2c14e'],coach:'Pruitt (aggressive)',
    archetypes:{QB:'Run-First Weapon',RB:'One-Cut Burner',SLOT:'Space Hunter',Z:'Vertical Glider',X:'YAC Creator',TE:'Move Chesspiece',RUSH:'Speed Bender',FCB:'Press Eraser',BCB:'Press Eraser'},
    bias:{QB:{speed:10,iq:-10},RB:{speed:8},SLOT:{speed:8,iq:-6},Z:{speed:8,iq:-6}}},
  aerial:{name:'Harbor State Air Raid',short:'HSA',quality:71,discipline:4,passRate:.6,colors:['#1d3b8f','#f4f1e8'],coach:'Lindqvist (balanced)',
    archetypes:{QB:'Field Architect',Z:'Route Sculptor',X:'Boundary Bully',SLOT:'Space Hunter',RB:'Third-Down Weapon',TE:'Backfield Hybrid',LT:'Long-Frame Project',RT:'Long-Frame Project',FS:'Centerfielder',FCB:'Mirror Corner'},
    roleQuality:{QB:84,Z:82,X:82,LT:62,RT:62,LG:64,RG:64,C:66}},
  control:{name:'Midland State',short:'MID',quality:72,discipline:4,colors:['#3a3a3a','#d9d4c5'],coach:'Okoro (balanced)'}
};

function preset(id,seed){const s=PRESETS[id];if(!s)throw new Error(`Unknown preset ${id}`);return makeTeam(s,seed||`preset:${id}`)}

// Draft harness (OOTP Perfect Draft-style test tool): deal three candidates per role, pick one each.
function dealDraft(seed,quality=72){
  const rng=DynastyRng.create(`draft:${seed}`),out={};
  for(const [role,pos] of [...Object.entries(D.OFF_ROLES),...Object.entries(D.DEF_ROLES)]){
    const archs=[...D.STYLES[pos]];out[role]=[];
    for(let i=0;i<3;i++){const a=archs.splice(rng.int(0,archs.length-1),1)[0]||rng.pick(D.STYLES[pos]);out[role].push(makePlayer(rng,role,pos,a,quality+rng.int(-6,6)))}
  }
  return out;
}
function teamFromDraft(name,picks,opts={}){
  const lineup={off:{},def:{}};
  for(const [role,p] of Object.entries(picks)){(D.OFF_ROLES[role]?lineup.off:lineup.def)[role]=p}
  return{name,short:opts.short||name.slice(0,3).toUpperCase(),colors:opts.colors||['#c9a227','#1b2433'],lineup,coach:{name:'You',discipline:opts.discipline??4,film:true}};
}

return{makePlayer,makeTeam,PRESETS,preset,dealDraft,teamFromDraft};
});
