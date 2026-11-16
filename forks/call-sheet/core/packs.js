// Call Sheet packs and the persistent playbook (rules v0.3).
// After every game you open a pack and pick ONE card. Win: pick 1 of 4. Loss: a Film Study pack, 1 of 3,
// weighted toward counters to whatever beat you. The playbook has limited slots, so a pick can force a cut;
// legendaries exist once per world. No currency, no duplicates of people.
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const deps=node?[require('./data.js'),require('../../../rng.js')]:[root.CallSheet.data,root.DynastyRng];
  const api=factory(...deps);
  if(node)module.exports=api;else root.CallSheet.packs=api;
})(typeof window==='object'?window:globalThis,function(D,DynastyRng){
'use strict';
const clone=v=>JSON.parse(JSON.stringify(v));

// Every card a pack can hold. kind: play (offense wrinkle) | call (defense wrinkle) | tactic | upgrade.
const POOL=[
  ...['deep_cross','pa_boot','screen','power','read_option','draw','four_verts','vertical_shot','statue_left'].map(id=>({id,kind:'play',side:'off'})),
  ...['motion','max_protect','route_adjust','seal_block','hard_count','check_with_me'].map(id=>({id,kind:'tactic',side:'off'})),
  ...[['inside_zone_plus','inside_zone'],['quick_slant_plus','quick_slant'],['pa_boot_plus','pa_boot']].map(([id,replaces])=>({id,kind:'upgrade',side:'off',replaces})),
  ...['zone_pressure','two_man','robber','sim_pressure','bear','corner_blitz','cover2_trap','cover0','midnight_mirage'].map(id=>({id,kind:'call',side:'def'})),
  ...['film_tell','identify_protection','disguise','bracket','spy','press'].map(id=>({id,kind:'tactic',side:'def'}))
].map(c=>({...c,rarity:D.rarityOf(c.id)}));
// Defensive answers to each offensive family, for Film Study packs.
const COUNTERS={run:['bear','robber','two_man','spy'],quick:['cover2_trap','corner_blitz','robber','press'],deep:['two_man','zone_pressure','bracket','disguise'],constraint:['robber','cover2_trap','film_tell','spy']};

const CAPACITY={wrinkles:14,tactics:14};
function newPlaybook(){
  return{version:1,off:clone(D.DEFAULT_DECKS.off),def:clone(D.DEFAULT_DECKS.def),capacity:clone(CAPACITY),legendaries:[],record:{w:0,l:0},history:[],packsOpened:0,mastery:{}};
}
function decksOf(pb){return{off:clone(pb.off),def:clone(pb.def)}}
function owns(pb,c){
  if(c.kind==='upgrade'){const d=pb[c.side];return d.base.includes(c.id)||d.wrinkles.includes(c.id)}
  return false;
}
function eligible(pb,c,worldTaken=[]){
  if(c.rarity==='legendary'&&(pb.legendaries.includes(c.id)||worldTaken.includes(c.id)))return false;
  if(c.kind==='upgrade'){const d=pb[c.side];if(owns(pb,c))return false;return d.base.includes(c.replaces)||d.wrinkles.includes(c.replaces)}
  return true;
}
function rollRarity(rng,won){
  const r=rng.next();
  if(r<(won?.045:.02))return'legendary';
  if(r<(won?.27:.17))return'rare';
  return'common';
}
// opts: {won, seed, oppTendency:{run,quick,deep,constraint}, worldTaken:[legendary ids owned by AI programs]}
function openPack(pb,opts){
  const rng=DynastyRng.create(`pack:${opts.seed}:${pb.packsOpened}`);
  const n=opts.won?4:3,cards=[],used=new Set();
  let focus=null;
  if(!opts.won&&opts.oppTendency){focus=Object.entries(opts.oppTendency).filter(([k])=>COUNTERS[k]).sort((a,b)=>b[1]-a[1])[0]?.[0]||null}
  for(let i=0;i<n;i++){
    let pick=null;
    // Film Study: the first two slots come from the counters to what beat you.
    if(focus&&i<2){
      const ids=COUNTERS[focus].filter(id=>!used.has(id)),want=ids.length?ids[rng.int(0,ids.length-1)]:null,c=want?POOL.find(p=>p.id===want):null;
      if(c&&eligible(pb,c,opts.worldTaken))pick={...c,why:`Counters their ${focus} game`};
    }
    for(let tries=0;!pick&&tries<40;tries++){
      const rarity=rollRarity(rng,opts.won),list=POOL.filter(c=>c.rarity===rarity&&!used.has(c.id)&&eligible(pb,c,opts.worldTaken));
      if(list.length)pick={...list[rng.int(0,list.length-1)]};
    }
    if(!pick)break;
    used.add(pick.id);cards.push({...pick,uid:`${pb.packsOpened}-${i}`});
  }
  // Show the best card last: reveal order escalates.
  const order={common:0,rare:1,legendary:2};cards.sort((a,b)=>order[a.rarity]-order[b.rarity]);
  return{type:opts.won?'victory':'film',title:opts.won?'Victory Pack':'Film Study Pack',subtitle:opts.won?'Pick 1 of 4':`Pick 1 of 3 · built around stopping their ${focus||'offense'}`,cards};
}
// Apply a pick. Returns {over:null} or {over:{side,pile}} when a cut is required.
function applyPick(pb,card){
  pb.packsOpened++;
  const d=pb[card.side];
  if(card.kind==='upgrade'){
    const bi=d.base.indexOf(card.replaces);
    if(bi>=0)d.base[bi]=card.id;else{const wi=d.wrinkles.indexOf(card.replaces);if(wi>=0)d.wrinkles[wi]=card.id}
  }else if(card.kind==='tactic')d.tactics.push(card.id);
  else d.wrinkles.push(card.id);
  if(card.rarity==='legendary')pb.legendaries.push(card.id);
  pb.history.push({id:card.id,kind:card.kind,side:card.side,rarity:card.rarity});
  return{over:overCapacity(pb)};
}
function overCapacity(pb){
  for(const side of ['off','def']){
    if(pb[side].wrinkles.length>pb.capacity.wrinkles)return{side,pile:'wrinkles'};
    if(pb[side].tactics.length>pb.capacity.tactics)return{side,pile:'tactics'};
  }
  return null;
}
function cut(pb,side,pile,index){
  const list=pb[side][pile];if(index<0||index>=list.length)throw new Error('No card at that slot.');
  const [id]=list.splice(index,1);
  if(D.rarityOf(id)==='legendary')pb.legendaries=pb.legendaries.filter(x=>x!==id);
  return id;
}
function cardDef(id){return D.PLAYS[id]||D.CALLS[id]||D.TACTICS[id]||null}

return{POOL,COUNTERS,CAPACITY,newPlaybook,decksOf,openPack,applyPick,overCapacity,cut,cardDef};
});
