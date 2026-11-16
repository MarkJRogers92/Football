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
    portraitSeed:p.portraitSeed,year:YEAR_NUM[p.year]||1,height:p.height,weight:p.weight};
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
function battleTeam(team,decks){
  const {lineup,missing}=lineupFromTeam(team);
  return{id:team.id,name:team.name,short:String(team.name).slice(0,3).toUpperCase(),colors:[team.primary||'#2a3550',team.secondary||'#e8e2d0'],
    lineup,coach:coachFromTeam(team),decks:decks||undefined,missing};
}
return{ROLE_MAP,toBattlePlayer,lineupFromTeam,coachFromTeam,battleTeam};
});
