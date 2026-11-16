// Call Sheet ⇄ Dynasty Lab adapter.
// Reads a real Dynasty Lab team (roster + role depth chart) and produces a Call Sheet battle team. Players keep
// their Dynasty Lab identity (id, name, archetype, the seven traits, class year, jersey, portrait seed), so every
// duel in the card battle is decided by the people you recruited and developed.
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const deps=node?[require('./data.js')]:[root.CallSheet.data];
  const api=factory(...deps);
  if(node)module.exports=api;else root.CallSheet.adapter=api;
})(typeof window==='object'?window:globalThis,function(D){
'use strict';
// Call Sheet battle role → Dynasty Lab ROLE_DEFS id (app/01-identity-rng.js).
const ROLE_MAP={QB:'QB1',RB:'RB1',X:'X',Z:'Z',SLOT:'SLOT',TE:'TE1',LT:'LT',LG:'LG',C:'C1',RG:'RG',RT:'RT',
  RUSH:'RUSH',SET:'SETEDGE',NT:'NT',DT3:'3TECH',MIKE:'MIKE',WILL:'WILL',FCB:'FCB',BCB:'BCB',NICKEL:'NICKEL',FS:'FS',BOXS:'BOXS'};
// Fallback positions when a depth chart is missing a role.
const POS_FALLBACK={QB:['QB'],RB:['RB'],X:['WR'],Z:['WR'],SLOT:['WR','TE','RB'],TE:['TE'],LT:['OT'],LG:['OG'],C:['C','OG'],RG:['OG'],RT:['OT'],
  RUSH:['EDGE','LB'],SET:['EDGE','LB'],NT:['DT'],DT3:['DT','EDGE'],MIKE:['LB'],WILL:['LB','S'],FCB:['CB'],BCB:['CB'],NICKEL:['CB','S'],FS:['S','CB'],BOXS:['S','LB']};
const YEAR_NUM={FR:1,SO:2,JR:3,SR:4,GR:4};
const available=p=>p&&!(p.injuryWeeks>0);
function toBattlePlayer(p,role){
  const traits={};for(const t of D.TRAITS)traits[t]=Number(p[t])||50;
  const strong=D.STYLE_TRAITS[p.style]||[];
  const ovr=Math.round(strong.reduce((a,t)=>a+traits[t],0)/Math.max(1,strong.length)*.6+Object.values(traits).reduce((a,v)=>a+v,0)/7*.4);
  return{id:String(p.id),dlId:p.id,name:p.name,role,pos:p.pos,archetype:p.style,traits,ovr,number:p.jerseyNumber??0,
    portraitSeed:p.portraitSeed,year:YEAR_NUM[p.year]||1,height:p.height,weight:p.weight,cond:conditionsOf(p,role,traits)};
}
// Player conditions from Dynasty Lab: each is a labeled ±1 on that player's duels in one situation.
//   when: 'late' (4th quarter and overtime), 'money' (3rd and 4th down), 'any'.
function conditionsOf(p,role,traits){
  const out=[],health=Number(p.health??100),wear=Number(p.wear??0),morale=Number(p.morale??70),comp=traits.composure;
  if(health<80||wear>=60)out.push({v:-1,when:'late',src:health<80?`Worn down (health ${Math.round(health)})`:'Worn down (heavy load)'});
  if(comp>=85)out.push({v:1,when:'money',src:'Ice in his veins'});
  else if(comp<=50)out.push({v:-1,when:'money',src:'Tight on the money downs'});
  if(morale<=35)out.push({v:-1,when:'money',src:'Checked out (low morale)'});
  // Hybrid roles accept several positions (an EDGE at 3-tech, a safety at nickel). Only a player from outside the
  // role's positions, who hasn't learned the spot, plays out of position.
  const fits=POS_FALLBACK[role]||[],home=fits[0];
  if(home&&!fits.includes(p.pos)&&Math.max(0,...fits.map(x=>Number(p.positionFamiliarity?.[x]??0)))<70)out.push({v:-1,when:'any',src:`Out of position (${p.pos} at ${home})`});
  return out;
}
// team: a Dynasty Lab team object. Returns {lineup:{off,def}, missing:[roles filled from fallback]}.
function lineupFromTeam(team){
  const byId=new Map((team.roster||[]).map(p=>[p.id,p])),used=new Set(),lineup={off:{},def:{}},missing=[];
  const pick=role=>{
    const ids=team.roleDepth?.[ROLE_MAP[role]]||[];
    for(const id of ids){const p=byId.get(id);if(available(p)&&!used.has(p.id))return p}
    missing.push(role);
    return(team.roster||[]).filter(p=>POS_FALLBACK[role].includes(p.pos)&&available(p)&&!used.has(p.id)).sort((a,b)=>(b.trueNow||0)-(a.trueNow||0))[0]||null;
  };
  for(const role of Object.keys(D.OFF_ROLES)){const p=pick(role);if(p){used.add(p.id);lineup.off[role]=toBattlePlayer(p,role)}}
  for(const role of Object.keys(D.DEF_ROLES)){const p=pick(role);if(p){used.add(p.id);lineup.def[role]=toBattlePlayer(p,role)}}
  return{lineup,missing};
}
// A coordinator personality from the program's schemes and staff, so AI opponents play like themselves.
function coachFromTeam(team){
  const off=String(team.offScheme||'Multiple'),def=String(team.defScheme||'');
  const passRate={'Tempo Spread':.58,'Vertical Strike':.62,'Rhythm Control':.56,'Ground Pressure':.38,'Option Motion':.4,'Heavy Play Action':.46,'Multiple':.5}[off]??.5;
  const discipline=/Pressure|Aggressive|Attack/.test(def)?3:/Control|Quarters|Split/.test(def)?5:4;
  return{name:team.staff?.OC?.name||'Coordinator',discipline,film:true,passRate};
}
// Scheme fit: an installed scheme sharpens the plays it's built on.
const OFF_FIT={'Ground Pressure':{family:'run',duel:'G'},'Option Motion':{family:'run',duel:'K'},'Heavy Play Action':{family:'constraint',duel:'K'},
  'Vertical Strike':{family:'deep',duel:'K'},'Rhythm Control':{family:'quick',duel:'K'},'Tempo Spread':{family:'quick',duel:'F'},'Multiple':{family:'constraint',duel:'G'}};
function defFit(name){
  if(/Pressure|Attack|Aggressive/.test(name))return{pressureCall:true,flag:'protect'};
  if(/Odd Front|Two-Gap|Run/.test(name))return{flag:'run',duel:'G'};
  if(/Quarters|Split-Safety|Match/.test(name))return{flag:'separation'};
  return null;
}
const PREP={pass_protection:{side:'off',flag:'protect'},run_blocking:{side:'off',flag:'run',duel:'G'},explosive_pass:{side:'off',family:'deep',duel:'K'},
  run_fits:{side:'def',flag:'run',duel:'G'},coverage:{side:'def',flag:'separation'},pressure:{side:'def',pressureCall:true,flag:'protect'}};
const PREP_LABEL={pass_protection:'Pass Protection',run_blocking:'Run Blocking',explosive_pass:'Explosive Passing',run_fits:'Run Fits',coverage:'Coverage',pressure:'Pressure Package'};
// info: {familiarity (0-100), prep:[focus ids for this opponent], home (bool)}. Every edge is labeled with its source.
function programEdges(team,info={}){
  // familiarity: a number, or {off, def} (Dynasty Lab tracks each side's scheme install separately).
  const off=[],def=[],famOf=side=>Number(typeof info.familiarity==='object'?info.familiarity?.[side]??100:info.familiarity??100),fam=famOf('off'),famD=famOf('def');
  const of=OFF_FIT[team.offScheme];
  if(of&&fam>=60)off.push({...of,v:1,src:`Scheme fit: ${team.offScheme}`});
  if(fam<40)off.push({duel:'K',v:-1,src:'Still installing the scheme'});
  const df=defFit(String(team.defScheme||''));
  if(df&&famD>=60)def.push({...df,v:1,src:`Scheme fit: ${team.defScheme}`});
  for(const f of info.prep||[]){const p=PREP[f];if(!p)continue;const {side,...e}=p;(side==='off'?off:def).push({...e,v:1,src:`Weekly prep: ${PREP_LABEL[f]}`})}
  if(info.home&&Number(team.fan_support)>=75)def.push({thirdDown:true,flag:'qbRead',v:1,src:'Crowd noise'});
  return{off,def};
}
function staffCommand(team){
  return{off:Number(team.staff?.OC?.playCall)>=80?1:0,def:Number(team.staff?.DC?.playCall)>=80?1:0};
}
function battleTeam(team,decks,info){
  const {lineup,missing}=lineupFromTeam(team),coach=coachFromTeam(team);
  coach.commandBonus=staffCommand(team);
  return{id:team.id,name:team.name,short:String(team.name).slice(0,3).toUpperCase(),colors:[team.primary||'#2a3550',team.secondary||'#e8e2d0'],
    lineup,coach,decks:decks||undefined,missing,edges:programEdges(team,info||{})};
}
return{ROLE_MAP,POS_FALLBACK,toBattlePlayer,conditionsOf,lineupFromTeam,coachFromTeam,programEdges,staffCommand,battleTeam};
});
