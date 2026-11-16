// Call Sheet league (rules v0.4): AI programs that build their own playbooks.
// Every week each AI program plays, opens the same packs you do (Victory or Film Study), picks by its identity, cuts
// what doesn't fit, earns reps and evolves cards. Legendaries are unique across the whole world, so a rival can own
// the card you wanted — and you'll see it used against you.
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const deps=node?[require('./data.js'),require('./roster.js'),require('./packs.js'),require('./evolution.js'),require('../../../rng.js'),require('./signatures.js'),require('./classes.js')]
    :[root.CallSheet.data,root.CallSheet.roster,root.CallSheet.packs,root.CallSheet.evolution,root.DynastyRng,root.CallSheet.signatures,root.CallSheet.classes];
  const api=factory(...deps);
  if(node)module.exports=api;else root.CallSheet.world=api;
})(typeof window==='object'?window:globalThis,function(D,Ro,P,EV,DynastyRng,SG,CL){
'use strict';

// Four generated programs join the presets so the league has eight teams.
const GENERATED=[
  {id:'lakeshore',name:'Lakeshore A&M',short:'LAM',colors:['#1f6b4a','#f0d68a'],coach:'Varga (aggressive)',quality:71,discipline:3,passRate:.45,archetypes:{QB:'Off-Script Creator',RB:'Space Cutter',RUSH:'Chaos Rusher',MIKE:'Pressure Backer'}},
  {id:'granite',name:'Granite Falls',short:'GRF',colors:['#5b5f66','#e3e1da'],coach:'Doyle (disciplined)',quality:72,discipline:5,passRate:.42,archetypes:{QB:'Field Architect',RB:'Contact Glider',FS:'Centerfielder',MIKE:'Traffic Director'}},
  {id:'sunbelt',name:'Sunbelt Tech',short:'SBT',colors:['#c2410c','#fde68a'],coach:'Okafor (balanced)',quality:70,discipline:4,passRate:.6,archetypes:{QB:'Vertical Hunter',X:'Vertical Glider',Z:'Catch-Point Ace',FCB:'Ball Hunter'}},
  {id:'prairie',name:'Prairie State',short:'PRS',colors:['#6d28d9','#e9d5ff'],coach:'Lund (disciplined)',quality:71,discipline:5,passRate:.38,archetypes:{QB:'Power Creator',RB:'Gap Hammer',TE:'Inline Mauler',NT:'Two-Gap Anchor'}}
];
const SPECS=Object.fromEntries([...Object.entries(Ro.PRESETS).map(([id,s])=>[id,{...s,id}]),...GENERATED.map(s=>[s.id,s])]);
// lineup: the program's persistent roster (class years, careers). Without one, the program's original starters.
function teamFor(id,playbook,lineup){
  const s=SPECS[id];if(!s)throw new Error(`Unknown program ${id}`);
  const t=Ro.makeTeam(s,`program:${id}`);t.id=id;if(lineup)t.lineup=JSON.parse(JSON.stringify(lineup));
  if(playbook){SG.registerAll(playbook);t.decks=P.decksOf(playbook)}return t;
}
function freshLineup(id){return CL.assignYears(Ro.makeTeam(SPECS[id],`program:${id}`).lineup,id)}

function newWorld(userId,seed='world'){
  const ids=Object.keys(SPECS);
  const programs={};
  for(const id of ids){if(id===userId)continue;programs[id]={id,record:{w:0,l:0},playbook:P.newPlaybook(),lineup:freshLineup(id)}}
  // Schedule: you play each AI program once per season, in a seeded order.
  const rng=DynastyRng.create(`schedule:${seed}`),order=Object.keys(programs);
  for(let i=order.length-1;i>0;i--){const j=rng.int(0,i);[order[i],order[j]]=[order[j],order[i]]}
  // A rival: the program you'll circle on the calendar. Rivalry games use a bigger pack.
  const rival=order[rng.int(0,order.length-1)];
  return{version:1,seed,user:userId,week:0,season:1,order,programs,news:[],rival,trophy:{holder:rival,history:[]},userLineup:freshLineup(userId),userRecord:{w:0,l:0},history:[],offseason:null};
}
function opponentOf(world){return world.order[world.week%world.order.length]}
function isRivalry(world){return!!world.rival&&opponentOf(world)===world.rival}
// Every legendary owned by anyone other than `exceptId` (a program id, or 'user').
function takenLegendaries(world,userPb,exceptId){
  const out=[];
  for(const [id,p] of Object.entries(world.programs))if(id!==exceptId)out.push(...p.playbook.legendaries);
  if(exceptId!=='user'&&userPb)out.push(...userPb.legendaries);
  return out;
}

// --- AI taste: how well a card fits a program's identity -------------------------------------------
function fit(spec,cardId,pb){
  const c=D.PLAYS[cardId]||D.CALLS[cardId]||D.TACTICS[cardId];if(!c)return 0;
  const rare={common:0,rare:.5,legendary:3,evolved:0}[D.rarityOf(cardId)]||0;
  const pass=spec.passRate??.5,aggro=(spec.discipline??4)<=3;
  let f=rare;
  if(D.PLAYS[cardId]){
    if(c.family==='run')f+=(1-pass)*2.2;if(c.family==='deep')f+=pass*2.2;if(c.family==='quick')f+=pass*1.6;if(c.family==='constraint')f+=1;
  }else if(D.CALLS[cardId]){
    if(c.pressure>0)f+=aggro?1.8:.6;if(c.coverage==='zone')f+=aggro?.4:1.4;if(c.counters.includes('run'))f+=.7;
  }else{
    f+=c.info?(aggro?.3:1.1):.9;
  }
  // Identity matters more than shine; owning several copies already makes a card less attractive.
  f=rare+(f-rare)*1.5;
  if(pb){const side=c.side==='def'?'def':'off',all=[...pb[side].wrinkles,...pb[side].tactics];f-=.6*all.filter(x=>x===cardId).length}
  return f;
}
function aiPick(spec,pack,pb,rng){let best=pack.cards[0],bf=-99;for(const c of pack.cards){const f=fit(spec,c.id,pb)+(rng?rng.next()*1.2-.6:0);if(f>bf){bf=f;best=c}}return best}
function aiCut(spec,pb,over){
  const list=pb[over.side][over.pile];let worst=0,wf=99;
  const counts={};for(const id of list)counts[id]=(counts[id]||0)+1;
  list.forEach((id,i)=>{const f=fit(spec,id)-(counts[id]>2?1:0);if(f<wf){wf=f;worst=i}});
  P.cut(pb,over.side,over.pile,worst);
}
// The AI's games feed reps to the cards it leans on.
function aiReps(spec,pb,rng){
  for(const side of ['off','def']){
    for(const id of pb[side].base)EV.addReps(pb,EV.rootOf(id),2+rng.int(0,3));
    for(const id of new Set(pb[side].wrinkles))if(rng.next()<.5)EV.addReps(pb,EV.rootOf(id),1+rng.int(0,2));
  }
  for(const r of EV.ready(pb)){
    const opts=r.options,pick=fit(spec,opts[0])+rng.next()>=fit(spec,opts[1])+rng.next()?opts[0]:opts[1];
    EV.evolve(pb,r.rootId,pick);
    return{type:'evolve',from:r.rootId,to:pick};
  }
  return null;
}
function strength(id,world){
  const t=teamFor(id,null,world?.programs[id]?.lineup),ps=[...Object.values(t.lineup.off),...Object.values(t.lineup.def)];
  return ps.reduce((s,p)=>s+p.ovr,0)/ps.length;
}

// One AI program opens a pack, picks, cuts, and maybe evolves. Returns news items.
function aiWeek(world,userPb,id,won,oppTendency){
  const prog=world.programs[id],spec=SPECS[id],rng=DynastyRng.create(`aiweek:${world.seed}:${world.season}:${world.week}:${id}`);
  const news=[];
  prog.record[won?'w':'l']++;
  const pack=P.openPack(prog.playbook,{won,seed:`ai:${world.seed}:${id}:${world.season}:${world.week}`,oppTendency,worldTaken:takenLegendaries(world,userPb,id)});
  if(pack.cards.length){
    const pick=aiPick(spec,pack,prog.playbook,rng);const res=P.applyPick(prog.playbook,pick);
    let guard=0;let over=res.over;while(over&&guard++<4){aiCut(spec,prog.playbook,over);over=P.overCapacity(prog.playbook)}
    news.push({type:'pick',program:id,card:pick.id,rarity:pick.rarity});
  }
  const evo=aiReps(spec,prog.playbook,rng);if(evo)news.push({...evo,program:id});
  // AI breakouts: now and then a player on their roster earns a signature card.
  if((prog.playbook.signatures||[]).length<2&&rng.next()<.16){
    const lu=prog.lineup||teamFor(id).lineup,pool=[...Object.values(lu.off).filter(p=>['QB','RB','X','Z','SLOT','TE'].includes(p.role)),...Object.values(lu.def).filter(p=>['RUSH','MIKE','FCB','FS'].includes(p.role))];
    const have=new Set((prog.playbook.signatures||[]).map(s=>s.playerId)),p=pool.filter(x=>!have.has(x.id)).sort((a,c)=>c.ovr-a.ovr)[rng.int(0,2)];
    if(p){const sp=SG.specFor(p,{season:world.season,earned:'breakout',colors:spec.colors});SG.add(prog.playbook,sp);news.push({type:'signature',program:id,card:sp.id,player:p.name})}
  }
  return news;
}

// Close out a week after the person's game. userResult: {won, opponentTendency, userTendency}
function advanceWeek(world,userPb,userResult){
  const opp=opponentOf(world),news=[];
  world.userRecord??={w:0,l:0};world.userRecord[userResult.won?'w':'l']++;
  if(world.rival&&opp===world.rival){const holder=userResult.won?'user':opp;world.trophy.history.push({season:world.season,holder});if(holder!==world.trophy.holder)news.push({type:'trophy',holder});world.trophy.holder=holder}
  news.push(...aiWeek(world,userPb,opp,!userResult.won,userResult.userTendency));
  // The other six play each other: a quick strength-weighted result (full battles stay reserved for your games).
  const others=Object.keys(world.programs).filter(id=>id!==opp);
  const rng=DynastyRng.create(`results:${world.seed}:${world.season}:${world.week}`);
  for(let i=others.length-1;i>0;i--){const j=rng.int(0,i);[others[i],others[j]]=[others[j],others[i]]}
  for(let i=0;i+1<others.length;i+=2){
    const a=others[i],c=others[i+1],pa=1/(1+Math.exp(-(strength(a,world)-strength(c,world))/3));
    const aWon=rng.next()<pa;
    news.push({type:'result',winner:aWon?a:c,loser:aWon?c:a});
    news.push(...aiWeek(world,userPb,a,aWon,null),...aiWeek(world,userPb,c,!aWon,null));
  }
  world.week++;
  if(world.week%world.order.length===0){world.offseason={stage:'ready'};news.push({type:'season_end',season:world.season})}
  world.news=news;
  return news;
}
// --- The offseason: graduation, development and signing day ------------------------------------------
// Step 1 (startOffseason): archive the season, graduate seniors everywhere, develop returning players, AI programs
// sign their classes, and signature cards of graduating players go to the Ring of Honor. Returns what the
// person needs to see: who left, how much the returners grew, and the open spots with prospects.
function retireSignatures(pb,gone){
  const ids=new Set(gone.map(g=>g.player.id)),kept=[],retired=[];
  for(const sg of pb.signatures||[])(ids.has(sg.playerId)?retired:kept).push(sg);
  pb.signatures=kept;(pb.ringOfHonor??=[]).push(...retired.map(sg=>({...sg,career:CL.careerLine(gone.find(g=>g.player.id===sg.playerId).player)})));
  return retired;
}
function startOffseason(world,userPb,userName){
  if(world.offseason?.stage==='signing')return world.offseason;
  const table=standings(world,userPb,userName),champ=table[0];
  world.history.push({season:world.season,champion:champ.id,championName:champ.name,rows:table.map(r=>({id:r.id,name:r.name,w:r.w,l:r.l}))});
  const news=[{type:'champion',program:champ.id,name:champ.name}];
  for(const [id,p] of Object.entries(world.programs)){
    p.lineup??=freshLineup(id);
    const wp=(p.record.w+p.record.l)?p.record.w/(p.record.w+p.record.l):.5;
    const g=CL.graduate(p.lineup);retireSignatures(p.playbook,g);CL.develop(p.lineup,`${world.seed}:${world.season}:${id}`);
    const signed=CL.autoSign(p.lineup,CL.openSpots(p.lineup,id,world.season,wp));
    const best=signed.sort((a,c)=>c.stars-a.stars)[0];if(best&&best.stars>=4)news.push({type:'recruit',program:id,name:best.name,stars:best.stars,role:best.role});
    p.record={w:0,l:0};
  }
  const ur=world.userRecord||{w:0,l:0},uwp=(ur.w+ur.l)?ur.w/(ur.w+ur.l):.5;
  const gone=CL.graduate(world.userLineup),retired=retireSignatures(userPb,gone);
  const growth=CL.develop(world.userLineup,`${world.seed}:${world.season}:user`);
  const spots=CL.openSpots(world.userLineup,'user',world.season,uwp);
  world.offseason={stage:'signing',gone,retired,growth,spots,news,champion:champ};
  return world.offseason;
}
// Step 2 (finishOffseason): sign the chosen prospect for each spot (index per spot; default the top one) and
// start the next season.
function finishOffseason(world,picks=[]){
  const o=world.offseason;if(!o||o.stage!=='signing')throw new Error('No signing day in progress.');
  const signed=o.spots.map((sp,i)=>CL.sign(world.userLineup,sp.side,sp.role,sp.prospects[picks[i]??0]));
  world.season++;world.userRecord={w:0,l:0};world.offseason=null;
  return{signed,rating:CL.classRating(signed)};
}
function standings(world,userPb,userName){
  const rows=Object.entries(world.programs).map(([id,p])=>({id,name:SPECS[id].name,short:SPECS[id].short,w:p.record.w,l:p.record.l,legendaries:p.playbook.legendaries,evolved:Object.values(p.playbook.evolved||{})}));
  const ur=world.userRecord||userPb.record;
  rows.push({id:'user',name:userName,short:'YOU',w:ur.w,l:ur.l,legendaries:userPb.legendaries,evolved:Object.values(userPb.evolved||{}),you:true});
  return rows.sort((a,b)=>(b.w-b.l)-(a.w-a.l)||b.w-a.w);
}

return{SPECS,GENERATED,teamFor,freshLineup,startOffseason,finishOffseason,newWorld,opponentOf,isRivalry,takenLegendaries,fit,aiPick,aiCut,advanceWeek,standings,strength};
});
