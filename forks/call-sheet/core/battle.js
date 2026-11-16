// Call Sheet battle: series-based hands and Command on top of Game Engine 2.
//
//   const b = battle.create({home, away, user:'home', mode:'series', seed:'x'});
//   let req = battle.advance(b);          // runs AI and scripted snaps until a person must decide
//   battle.submit(b, {type:'call', play:'inside_zone', tactics:[]});
//
// Modes (the control dial; every mode plays the same rules, so stats agree):
//   snap   — you call every snap
//   series — at each new set of downs you script 1st and 2nd down (or hand them to the coordinator);
//            you call 3rd and 4th down, the red zone and the last two minutes of each half live
//   key    — the coordinator plays every routine snap with your cards; you take the key downs only
//   sim    — the coordinators play everything
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const deps=node?[require('./data.js'),require('./resolver.js'),require('../../../rng.js'),require('../../../game-engine-v2.js')]
    :[root.CallSheet.data,root.CallSheet.resolver,root.DynastyRng,root.DynastyGameEngineV2];
  const api=factory(...deps);
  if(node)module.exports=api;else root.CallSheet.battle=api;
})(typeof window==='object'?window:globalThis,function(D,R,DynastyRng,Engine){
'use strict';
const VERSION=1;
const other=s=>s==='home'?'away':'home';
const clone=v=>JSON.parse(JSON.stringify(v));
const OFF_FAMILIES=['run','quick','deep','constraint'];

// ---------------------------------------------------------------- setup
function create(opts){
  const seed=String(opts.seed??'call-sheet');
  const game=Engine.createGame({home:{id:'home',name:opts.home.name,rating:70},away:{id:'away',name:opts.away.name,rating:70},seed,rules:{penalties:true,returns:true,pressure:true,...(opts.conditions?{conditions:opts.conditions}:{})}});
  const b={version:VERSION,seed,mode:opts.mode||'series',user:opts.user||null,control:opts.control||'both',weather:opts.weather||'clear',rivalry:!!opts.rivalry,game,
    teams:{home:clone(opts.home),away:clone(opts.away)},
    decks:{home:clone(opts.home.decks||D.DEFAULT_DECKS),away:clone(opts.away.decks||D.DEFAULT_DECKS)},
    piles:{},hands:{home:null,away:null},
    tend:{home:blankTend(),away:blankTend()},
    seriesKey:null,seriesSnap:0,plan:null,period:1,
    snap:null,pending:null,log:[],lastResult:null,
    streaks:{},fire:{},drive:{key:null,fams:[],firsts:0},bonusCommand:{home:0,away:0},exhausted:{home:[],away:[]},
    box:{home:blankBox(),away:blankBox()},players:{},
    telemetry:{decisions:{plan:0,snap:0,info:0,fourth:0},snaps:0,series:0,userSnaps:0,lineCounts:{},cardsPlayed:0},
    rng:DynastyRng.create(`${seed}:cards`).snapshot()};
  for(const side of ['home','away'])b.piles[side]={off:freshPiles(b,b.decks[side].off),def:freshPiles(b,b.decks[side].def)};
  return b;
}
function blankTend(){return{run:0,quick:0,deep:0,constraint:0,pressure:0,man:0,zone:0}}
function blankBox(){return{plays:0,yards:0,rushAtt:0,rushYds:0,passAtt:0,comp:0,passYds:0,sacks:0,ints:0,fumbles:0,firstDowns:0,thirdAtt:0,thirdConv:0,fourthAtt:0,fourthConv:0,penalties:0,penaltyYds:0,punts:0,explosives:0,cardsPlayed:0}}
function withRng(b,fn){const rng=DynastyRng.create(b.rng);const out=fn(rng);b.rng=rng.snapshot();return out}
function shuffle(rng,arr){for(let i=arr.length-1;i>0;i--){const j=rng.int(0,i);[arr[i],arr[j]]=[arr[j],arr[i]]}return arr}
function freshPiles(b,deck){return withRng(b,rng=>({wrinkle:{draw:shuffle(rng,[...deck.wrinkles]),discard:[]},tactic:{draw:shuffle(rng,[...deck.tactics]),discard:[]}}))}
function drawFrom(b,pile,n){
  const out=[];
  while(out.length<n){
    if(!pile.draw.length){if(!pile.discard.length)break;pile.draw=withRng(b,rng=>shuffle(rng,pile.discard.splice(0)))}
    out.push(pile.draw.pop());
  }
  return out;
}

// ---------------------------------------------------------------- helpers
const offSide=b=>b.game.possession;
const defSide=b=>other(b.game.possession);
function lineupOf(b,side,role){return b.teams[side].lineup[role]}
function situation(b){const g=b.game;return{down:g.down,distance:g.distance,field:g.fieldPosition,period:g.period,clock:g.clock,score:{...g.score},possession:g.possession}}
function seriesKeyOf(g){return`${g.drive}:${g.possession}:${g.fieldPosition+g.distance}:${g.ot?g.ot.period+'.'+g.ot.possessions:''}`}
// The person controls a side's snaps when it is their team and the control setting covers that unit.
// Program edges (scheme fit, weekly prep, home crowd): each team's offensive edges help its offense, its
// defensive edges help its defense. They come from the Dynasty Lab program via the adapter.
function edgesFor(b,offSide){return{offEdges:b.teams[offSide]?.edges?.off||[],defEdges:b.teams[other(offSide)]?.edges?.def||[]}}
function isUser(b,side){
  if(b.user!==side||!b.game.possession)return false;
  if(b.control==='both')return true;
  return(b.control==='offense')===(side===b.game.possession);
}
function keyMoment(b){
  const g=b.game;
  return g.down>=3||g.fieldPosition>=D.RULES.redZone||((g.period===2||g.period===4)&&g.clock<=D.RULES.twoMinute)||g.period>4;
}
function leanFor(b){ // the defense leans when the offense's tendency reaches its coordinator's discipline
  const off=b.tend[offSide(b)],disc=b.teams[defSide(b)].coach.discipline??4;
  let best=null,bv=0;for(const f of ['run','quick','deep']){if(off[f]>bv){bv=off[f];best=f}}
  return bv>=disc?best:null;
}
function heatFor(b){return b.tend[defSide(b)].pressure>=3}

// Effective cost of a card for a side, given signatures. onceUsed tracks "once per series" discounts.
function costOf(b,side,card){
  const hand=b.hands[side],lineup=b.teams[side].lineup[hand.role];
  let cost=card.cost;
  for(const p of Object.values(lineup)){
    const s=D.SIGNATURES[p.archetype];if(!s?.cost||s.cost[card.id]===undefined)continue;
    if(s.costOnce&&hand.onceUsed.includes(card.id))continue;
    cost=Math.min(cost,s.cost[card.id]);
  }
  return cost;
}
function markCostUse(b,side,card){
  const hand=b.hands[side],lineup=b.teams[side].lineup[hand.role];
  for(const p of Object.values(lineup)){const s=D.SIGNATURES[p.archetype];if(s?.costOnce&&s.cost?.[card.id]!==undefined&&card.cost>s.cost[card.id]&&!hand.onceUsed.includes(card.id)){hand.onceUsed.push(card.id);return}}
}

// ---------------------------------------------------------------- series
function ensureSeries(b){
  const g=b.game,key=seriesKeyOf(g);
  if(b.period<=2&&g.period>=3){halftime(b)}
  b.period=g.period;
  if(key===b.seriesKey)return false;
  b.seriesKey=key;b.seriesSnap=0;b.plan=null;b.telemetry.series++;
  for(const side of ['home','away'])dealHand(b,side,side===g.possession?'off':'def');
  return true;
}
function dealHand(b,side,role){
  const old=b.hands[side];
  if(old){const p=b.piles[side][old.role];p.wrinkle.discard.push(...old.wrinkles);p.tactic.discard.push(...old.tactics)}
  const p=b.piles[side][role];
  const bonus=role==='off'?(b.bonusCommand?.[side]||0):0;if(bonus)b.bonusCommand[side]=0;
  const staffBonus=b.teams[side]?.coach?.commandBonus?.[role]||0;
  b.hands[side]={role,wrinkles:drawFrom(b,p.wrinkle,D.RULES.wrinkleRow),tactics:drawFrom(b,p.tactic,D.RULES.tacticHand),command:D.RULES.seriesCommand+bonus+staffBonus,onceUsed:[]};
}
function halftime(b){
  for(const side of ['home','away']){
    const t=b.tend[side];for(const k of Object.keys(t))t[k]=Math.floor(t[k]/2);
    if(b.hands[side]){const p=b.piles[side][b.hands[side].role];p.wrinkle.discard.push(...b.hands[side].wrinkles);p.tactic.discard.push(...b.hands[side].tactics);b.hands[side]=null}
    b.piles[side]={off:freshPiles(b,b.decks[side].off),def:freshPiles(b,b.decks[side].def)};
  }
  b.seriesKey=null;b.log.push({type:'halftime',text:'Halftime. Tendencies cool off, decks reshuffle.'});
}

// ---------------------------------------------------------------- the Look
// Built from the committed defensive call. Confirmed facts are true; uncertain facts may not be.
function lookFor(b,defCommit){
  const call=D.CALLS[defCommit.play],off=b.teams[offSide(b)],qb=off.lineup.off.QB,disguised=defCommit.tactics.includes('disguise');
  const qbSig=D.SIGNATURES[qb?.archetype]?.look,qbSees=(R.traitGrade(qb,'iq')>=8||qbSig==='shell')&&qbSig!=='noShell';
  const shownShell=disguised?(call.shell===2?1:2):call.shell;
  const lean=leanFor(b);
  return{
    box:{value:call.box,confirmed:true},
    shell:{value:shownShell,confirmed:qbSees&&!disguised},
    pressure:{value:call.look.pressureShown,confirmed:false},
    coverage:{value:null,confirmed:false},
    lean:{value:lean,confirmed:!!off.coach.film},
    heat:heatFor(b)
  };
}
function blindLook(b){
  return{box:{value:'normal',confirmed:false},shell:{value:1,confirmed:false},pressure:{value:heatFor(b),confirmed:false},coverage:{value:null,confirmed:false},lean:{value:leanFor(b),confirmed:true},heat:heatFor(b)};
}
// What the offense believes the call is: a pseudo-call built only from the Look.
function presumedCall(look){
  const shell=look.shell.value===0?0:look.shell.value;
  const coverage=look.coverage.confirmed?look.coverage.value:(shell===2?'zone':'man');
  const pressure=look.pressure.confirmed?look.pressure.realLevel:(look.pressure.value?1:0);
  return{id:'presumed',box:look.box.value,shell,coverage,pressure,counters:look.lean.value?[look.lean.value]:[],look:{}};
}
// What the defense knows of the offense: family if Film Tell confirmed it, else its tendency.
function offFamilyWeights(b,revealedFamily){
  if(revealedFamily)return Object.fromEntries(OFF_FAMILIES.map(f=>[f,f===revealedFamily?1:0]));
  const g=b.game,t=b.tend[offSide(b)],w={run:1.1,quick:1,deep:.7,constraint:.45};
  if(g.distance<=2){w.run*=2.2;w.deep*=.5}else if(g.distance>=8&&g.down>=2){w.run*=.45;w.deep*=1.5;w.quick*=1.3}
  for(const f of OFF_FAMILIES)w[f]*=1+t[f]*.18;
  const s=Object.values(w).reduce((a,v)=>a+v,0);for(const f of OFF_FAMILIES)w[f]/=s;return w;
}
const REP_PLAYS={run:['inside_zone','outside_zone','power'],quick:['quick_slant','stick'],deep:['deep_cross','vertical_shot'],constraint:['pa_boot','screen']};

// ---------------------------------------------------------------- legal options
function offOptions(b,side){
  const hand=b.hands[side],team=b.teams[side],lineup=team.lineup.off;
  const plays=[...b.decks[side].off.base.map(id=>({id,base:true})),...hand.wrinkles.map((id,i)=>({id,base:false,slot:i}))]
    .map(o=>({...o,card:D.PLAYS[o.id],cost:costOf(b,side,D.PLAYS[o.id]),blocked:R.playBlocked(D.PLAYS[o.id],lineup)}));
  const tactics=hand.tactics.map((id,i)=>({id,slot:i,card:D.TACTICS[id],cost:costOf(b,side,D.TACTICS[id])}));
  return{plays,tactics,command:hand.command};
}
function defOptions(b,side){
  const hand=b.hands[side];
  const plays=[...b.decks[side].def.base.map(id=>({id,base:true})),...hand.wrinkles.map((id,i)=>({id,base:false,slot:i}))]
    .map(o=>({...o,card:D.CALLS[o.id],cost:costOf(b,side,D.CALLS[o.id]),blocked:null}));
  const tactics=hand.tactics.map((id,i)=>({id,slot:i,card:D.TACTICS[id],cost:costOf(b,side,D.TACTICS[id])}));
  return{plays,tactics,command:hand.command};
}
function subsets(arr,max){const out=[[]];for(const x of arr){const n=out.length;for(let i=0;i<n;i++)if(out[i].length<max)out.push([...out[i],x])}return out}
function uniqTactics(list){const seen=new Set();return list.filter(t=>{if(seen.has(t.id))return false;seen.add(t.id);return true})}

// ---------------------------------------------------------------- AI
function utility(ev,sit){
  if(sit.down>=3)return 22*ev.first+.25*ev.yards-30*ev.turnover;
  return ev.yards+5*ev.first-30*ev.turnover;
}
function softPick(rng,items,temp){
  const m=Math.max(...items.map(i=>i.u)),ws=items.map(i=>Math.exp((i.u-m)/temp)),s=ws.reduce((a,v)=>a+v,0);
  let r=rng.next()*s;for(let i=0;i<items.length;i++){r-=ws[i];if(r<=0)return items[i]}return items[items.length-1];
}
// Reserve Command for 3rd down on early downs.
function budget(b,side,scripted){const g=b.game,c=b.hands[side].command;return g.down>=3||scripted==='all'?c:Math.max(0,c-2)}

function aiOffense(b,side,look,opts={}){
  const o=offOptions(b,side),team=b.teams[side],sit=situation(b),def=b.teams[other(side)].lineup.def;
  const call=presumedCall(look),cap=opts.cap??budget(b,side);
  const tacs=uniqTactics(o.tactics.filter(t=>!t.card.info));
  // Coordinators keep to their scheme's run/pass mix: the further off it, the stronger the pull back.
  const bx=b.box[side],calls=bx.rushAtt+bx.passAtt+bx.sacks,runShare=calls?bx.rushAtt/calls:1-(team.coach.passRate??.5);
  const balance=sit.down>=3&&sit.distance>4?0:6*((1-(team.coach.passRate??.5))-runShare)+1.1;
  const lines=[];
  for(const p of o.plays){
    if(p.blocked||p.cost>cap)continue;
    for(const ts of subsets(tacs,2)){
      const cost=p.cost+ts.reduce((s,t)=>s+t.cost,0);if(cost>cap)continue;
      if(ts.some(t=>R.tacticBlocked(t.card,p.card,team.lineup.off)))continue;
      const snap=R.buildSnap({weather:b.weather,...edgesFor(b,side),off:team.lineup.off,def,play:p.card,call,offTactics:ts.map(t=>t.id),situation:sit,lean:look.lean.confirmed?look.lean.value:null,heat:look.heat,motionConfirmed:!!b.snap?.motionConfirmed});
      const ev=R.evaluate(snap,sit);
      const isRun=!p.card.pass;
      lines.push({play:p.id,tactics:ts.map(t=>t.id),u:utility(ev,sit)-cost*(sit.down>=3?.2:.55)-(p.base?0:.15)+(isRun?balance:-balance)});
    }
  }
  if(!lines.length)return{play:b.decks[side].off.base[0],tactics:[]};
  const pick=withRng(b,rng=>softPick(rng,lines,sit.down>=3?.8:1.2));
  return{play:pick.play,tactics:pick.tactics};
}
function aiDefense(b,side,opts={}){
  const o=defOptions(b,side),team=b.teams[side],offTeam=b.teams[other(side)],sit=situation(b),cap=opts.cap??budget(b,side);
  const weights=offFamilyWeights(b,opts.revealedFamily),lean=leanFor(b),heat=heatFor(b);
  const tacs=uniqTactics(o.tactics.filter(t=>!t.card.info));
  const lines=[];
  for(const p of o.plays){
    if(p.cost>cap)continue;
    for(const ts of subsets(tacs,2)){
      const cost=p.cost+ts.reduce((s,t)=>s+t.cost,0);if(cost>cap)continue;
      let u=0;
      for(const f of OFF_FAMILIES){
        if(weights[f]<.02)continue;const reps=REP_PLAYS[f].filter(id=>!R.playBlocked(D.PLAYS[id],offTeam.lineup.off));let best=-99;
        for(const id of reps){
          const snap=R.buildSnap({weather:b.weather,...edgesFor(b,other(side)),off:offTeam.lineup.off,def:team.lineup.def,play:D.PLAYS[id],call:p.card,defTactics:ts.map(t=>t.id),situation:sit,lean,heat});
          best=Math.max(best,utility(R.evaluate(snap,sit),sit));
        }
        u+=weights[f]*(best===-99?0:best);
      }
      lines.push({play:p.id,tactics:ts.map(t=>t.id),u:-u-cost*(sit.down>=3?.2:.55)-(p.base?0:.15)});
    }
  }
  const pick=withRng(b,rng=>softPick(rng,lines,sit.down>=3?.8:1.2));
  return{play:pick.play,tactics:pick.tactics};
}
// Coordinators use information cards in simple, honest ways.
function aiInfoOffense(b,side,look){
  const o=offOptions(b,side),cap=budget(b,side);let spent=0;const used=[];
  const t=id=>o.tactics.find(x=>x.id===id);
  const c=b.teams[side].lineup.off.C,risky=D.SIGNATURES[c?.archetype]?.flag!=='noFalseStart'&&R.traitGrade(c,'composure')<=5;
  if(look.pressure.value&&!risky&&t('hard_count')&&t('hard_count').cost<=cap){used.push('hard_count');spent+=t('hard_count').cost}
  if(!look.coverage.confirmed&&t('motion')&&spent+t('motion').cost<=cap&&b.game.down>=2&&b.game.distance>=4)used.push('motion');
  return used;
}
function aiInfoDefense(b,side){
  const o=defOptions(b,side),cap=budget(b,side),t=o.tactics.find(x=>x.id==='film_tell');
  return b.game.down>=3&&t&&t.cost<=cap?['film_tell']:[];
}

// ---------------------------------------------------------------- committing
function payAndRemove(b,side,kind,id){
  const hand=b.hands[side],card=kind==='tactic'?D.TACTICS[id]:(hand.role==='off'?D.PLAYS[id]:D.CALLS[id]);
  const cost=costOf(b,side,card);if(cost>hand.command)throw new Error(`Not enough Command for ${card.name} (${cost} > ${hand.command}).`);
  if(kind==='tactic'){const i=hand.tactics.indexOf(id);if(i<0)throw new Error(`${card.name} is not in hand.`);hand.tactics.splice(i,1);b.piles[side][hand.role].tactic.discard.push(id)}
  else{
    const base=b.decks[side][hand.role].base.includes(id);
    if(!base){const i=hand.wrinkles.indexOf(id);if(i<0)throw new Error(`${card.name} is not on your call sheet.`);hand.wrinkles.splice(i,1);
      // Trick plays are exhausted: once per game.
      if(card.trick)(b.exhausted[side]??=[]).push(id);else b.piles[side][hand.role].wrinkle.discard.push(id)}
  }
  markCostUse(b,side,card);hand.command-=cost;
  if(kind==='tactic'||!b.decks[side][hand.role].base.includes(id))b.box[side].cardsPlayed++;
}
// Info tactics resolve at once and change what the side knows this snap.
function applyInfo(b,side,id){
  const s=b.snap,hand=b.hands[side];
  payAndRemove(b,side,'tactic',id);
  const call=D.CALLS[s.def.play];
  if(hand.role==='off'){
    s.offInfo.push(id);
    if(id==='motion'){s.look.coverage={value:call.coverage,confirmed:true};s.motionConfirmed=true}
    if(id==='hard_count'){
      s.look.pressure={value:call.pressure>0,confirmed:true,realLevel:call.pressure};
      const c=b.teams[side].lineup.off.C,safe=D.SIGNATURES[c?.archetype]?.flag==='noFalseStart';
      if(!safe&&R.traitGrade(c,'composure')<=5&&withRng(b,rng=>rng.next())<.15)s.falseStart=true;
    }
    const reveal=D.TACTICS[id].reveal||[];
    if(reveal.includes('shell'))s.look.shell={value:call.shell,confirmed:true};
    if(reveal.includes('pressure'))s.look.pressure={value:call.pressure>0,confirmed:true,realLevel:call.pressure};
    if(reveal.includes('coverage')){s.look.coverage={value:call.coverage,confirmed:true};s.motionConfirmed=true}
    if(id==='check_with_me'){
      s.look.shell={value:call.shell,confirmed:true};s.look.pressure={value:call.pressure>0,confirmed:true,realLevel:call.pressure};
      s.look.coverage={value:call.coverage,confirmed:true};s.motionConfirmed=s.motionConfirmed||false;
    }
  }else{
    s.defInfo.push(id);
    const play=s.off?D.PLAYS[s.off.play]:null;
    if(id==='film_tell'&&play)s.offLook.family={value:play.family,confirmed:true};
    if(id==='identify_protection'&&s.off)s.offLook.protection={value:s.off.tactics.includes('max_protect'),confirmed:true};
  }
}
function commit(b,side,choice){
  const hand=b.hands[side],role=hand.role;
  const card=role==='off'?D.PLAYS[choice.play]:D.CALLS[choice.play];
  if(!card)throw new Error(`Unknown play ${choice.play}.`);
  if(role==='off'){const why=R.playBlocked(card,b.teams[side].lineup.off);if(why)throw new Error(why)}
  const tactics=[...new Set(choice.tactics||[])];
  for(const id of tactics){
    const t=D.TACTICS[id];if(!t||t.side!==role)throw new Error(`Unknown tactic ${id}.`);
    if(t.info)throw new Error(`${t.name} is an information card; play it before the call.`);
    if(role==='off'){const why=R.tacticBlocked(t,card,b.teams[side].lineup.off);if(why)throw new Error(`${t.name}: ${why}`)}
  }
  const total=costOf(b,side,card)+tactics.reduce((s,id)=>s+costOf(b,side,D.TACTICS[id]),0);
  if(total>hand.command)throw new Error(`That costs ${total} Command; you have ${hand.command}.`);
  payAndRemove(b,side,'play',choice.play);for(const id of tactics)payAndRemove(b,side,'tactic',id);
  return{play:choice.play,tactics};
}

// ---------------------------------------------------------------- the loop
function startSnap(b){
  const off=offSide(b),def=defSide(b);
  b.snap={off:null,def:null,offInfo:[],defInfo:[],look:null,offLook:{family:{value:null,confirmed:false},protection:{value:null,confirmed:false}},motionConfirmed:false,falseStart:false};
  // Whoever is not the person commits first; with no person, the defense commits first.
  if(isUser(b,def)){b.snap.off=decideAI(b,off,'off')}
  else{b.snap.def=decideAI(b,def,'def')}
  if(b.snap.def)b.snap.look=lookFor(b,b.snap.def);
}
function decideAI(b,side,role){
  if(role==='def'){
    const info=aiInfoDefense(b,side);
    for(const id of info)applyInfoEarly(b,side,id);
    return commit(b,side,aiDefense(b,side,{revealedFamily:null}));
  }
  // An offense that commits before the defense has lined up (the person is on defense) sees only a blind look.
  if(!b.snap.def)return commit(b,side,aiOffense(b,side,blindLook(b)));
  const look=b.snap.look||lookFor(b,b.snap.def);b.snap.look=look;
  for(const id of aiInfoOffense(b,side,look))applyInfo(b,side,id);
  return commit(b,side,aiOffense(b,side,b.snap.look));
}
// A defensive info card played before the offense has committed only works later (film tell needs a play).
function applyInfoEarly(b,side,id){payAndRemove(b,side,'tactic',id);b.snap.defInfo.push(id)}

// Mode rules: does the person decide this snap live?
function liveFor(b,side){
  if(!isUser(b,side))return false;
  if(b.mode==='snap')return true;if(b.mode==='sim')return false;
  return keyMoment(b);
}
function needsPlan(b,side){return isUser(b,side)&&b.mode==='series'&&!b.plan&&!keyMoment(b)}

// Run until a person must decide or the game ends. Returns the pending request or null.
function advance(b){
  let guard=0;
  while(++guard<5000){
    const g=b.game;
    if(b.pending)return b.pending;
    if(g.status==='pregame')Engine.startGame(g);
    if(g.status==='final'){finalize(b);return null}
    if(g.period>4&&g.ot&&g.ot.period>=3){Engine.step(g);continue}
    ensureSeries(b);
    const off=offSide(b),def=defSide(b);
    if(!b.snap){
      if(g.down===4&&!b.fourthGo){
        const choice=fourthChoice(b);
        if(choice==='ask'){b.pending=fourthRequest(b);b.telemetry.decisions.fourth++;return b.pending}
        if(choice!=='go'){kick(b,choice);continue}
      }
      if(isUser(b,off)||isUser(b,def)){
        const userSide=isUser(b,off)?off:def;
        if(needsPlan(b,userSide)){b.pending=planRequest(b,userSide);b.telemetry.decisions.plan++;return b.pending}
      }
      startSnap(b);
      const userSide=isUser(b,off)?off:isUser(b,def)?def:null;
      if(userSide){
        const scripted=scriptedCall(b,userSide);
        if(liveFor(b,userSide)&&!scripted){b.pending=snapRequest(b,userSide);b.telemetry.decisions.snap++;return b.pending}
        if(scripted)fillScripted(b,userSide,scripted);else fillAI(b,userSide);
      }else if(!b.snap.off)b.snap.off=decideAI(b,off,'off');
    }
    resolveSnap(b);
  }
  throw new Error('Battle loop guard exceeded.');
}
function fillAI(b,side){const role=b.hands[side].role;if(role==='off')b.snap.off=decideAI(b,side,'off');else b.snap.def=decideAI(b,side,'def');if(!b.snap.look)b.snap.look=lookFor(b,b.snap.def)}
function scriptedCall(b,side){
  if(b.mode!=='series'||!b.plan||keyMoment(b))return null;
  const c=b.plan.calls[b.seriesSnap];return c||null;
}
function fillScripted(b,side,call){
  const role=b.hands[side].role;
  let res;try{res=commit(b,side,call)}catch(e){res=null}
  if(!res){fillAI(b,side);return}
  if(role==='off')b.snap.off=res;else{b.snap.def=res;b.snap.look=lookFor(b,res)}
}

// ---------------------------------------------------------------- requests (what the sandbox renders)
function snapRequest(b,side){
  const role=b.hands[side].role;
  return{kind:'snap',side,role,situation:situation(b),look:role==='off'?b.snap.look:null,offLook:role==='def'?b.snap.offLook:null,
    options:role==='off'?offOptions(b,side):defOptions(b,side),lean:leanFor(b),heat:heatFor(b),
    offTendency:{...b.tend[offSide(b)]},info:role==='off'?b.snap.offInfo:b.snap.defInfo};
}
function planRequest(b,side){
  const role=b.hands[side].role;
  return{kind:'plan',side,role,situation:situation(b),options:role==='off'?offOptions(b,side):defOptions(b,side),lean:leanFor(b),offTendency:{...b.tend[offSide(b)]}};
}
function fourthChoice(b){
  const g=b.game,off=offSide(b);
  if(g.period>4){if(g.fieldPosition>=55&&Engine.fieldGoalInRange(g))return'ot_fg';return'go'}
  if(isUser(b,off)&&b.mode!=='sim')return'ask';
  const d=Engine.defaultFourthDown(g);return d==='play'?'go':d;
}
function fourthRequest(b){
  const g=b.game,opts=['go','punt'];if(Engine.fieldGoalInRange(g,Engine.FG_OFFER_CHANCE))opts.push('field_goal');
  return{kind:'fourth',side:offSide(b),situation:situation(b),options:opts,recommended:Engine.defaultFourthDown(g)==='play'?'go':Engine.defaultFourthDown(g),fgChance:Engine.fieldGoalChance(g,Engine.fieldGoalDistance(g))};
}
function kick(b,choice){
  const g=b.game,off=offSide(b),before=g.fieldPosition;
  if(choice==='ot_fg'){Engine.step(g);b.log.push({type:'kick',text:'Overtime field goal attempt.'});return}
  const sit=situation(b);
  if(choice==='punt'){Engine.punt(g);b.box[off].punts++;b.log.push({type:'kick',kick:'punt',side:off,sit,after:situation(b),score:{...g.score},text:`${b.teams[off].short} punts from the ${yardLine(before)}.`})}
  else{const made=Engine.attemptFieldGoal(g);b.log.push({type:'kick',kick:'field_goal',made,side:off,sit,after:situation(b),score:{...g.score},text:`${b.teams[off].short} ${made?'makes':'misses'} a ${100-before+17}-yard field goal.`})}
}

// ---------------------------------------------------------------- submit
function submit(b,action){
  const req=b.pending;if(!req)throw new Error('Nothing is waiting for a decision.');
  if(req.kind==='fourth'){
    b.pending=null;
    if(action.choice==='go'){b.fourthGo=true;return advance(b)}
    if(action.choice==='punt'||action.choice==='field_goal'){kick(b,action.choice);return advance(b)}
    throw new Error('Choose go, punt or field_goal.');
  }
  if(req.kind==='plan'){
    const calls=(action.calls||[]).slice(0,2).map(c=>c&&c.play?{play:c.play,tactics:(c.tactics||[]).filter(id=>!D.TACTICS[id]?.info)}:null);
    b.plan={calls};b.pending=null;return advance(b);
  }
  if(req.kind==='snap'){
    const side=req.side,role=req.role;
    if(action.type==='info'){
      if(!D.TACTICS[action.tactic]?.info)throw new Error('That is not an information card.');
      applyInfo(b,side,action.tactic);b.telemetry.decisions.info++;
      if(b.snap.falseStart){b.pending=null;falseStart(b,side);return advance(b)}
      b.pending=snapRequest(b,side);return b.pending;
    }
    if(action.type==='auto'){b.pending=null;fillAI(b,side);resolveSnap(b);return advance(b)}
    if(action.type==='call'){
      const res=commit(b,side,action);
      if(role==='off')b.snap.off=res;else{b.snap.def=res;b.snap.look=lookFor(b,res)}
      b.pending=null;b.telemetry.userSnaps++;b.snap.userCalled=true;
      if(role==='def'&&!b.snap.off)b.snap.off=decideAI(b,offSide(b),'off');
      resolveSnap(b);return advance(b);
    }
  }
  throw new Error(`Unknown action for ${req.kind}.`);
}
function falseStart(b,side){
  const g=b.game;
  // The defense's committed cards return to its hand: no snap happened.
  if(b.snap.def){const d=b.hands[defSide(b)];const call=D.CALLS[b.snap.def.play];if(!call.base){d.wrinkles.push(b.snap.def.play);b.piles[defSide(b)].def.wrinkle.discard.pop()}for(const t of b.snap.def.tactics){d.tactics.push(t);b.piles[defSide(b)].def.tactic.discard.splice(b.piles[defSide(b)].def.tactic.discard.lastIndexOf(t),1)}d.command+=costOf(b,defSide(b),call)+b.snap.def.tactics.reduce((s,t)=>s+costOf(b,defSide(b),D.TACTICS[t]),0)}
  Engine.applyScrimmage(g,{penalty:{kind:'false_start'}});
  b.box[side].penalties++;b.box[side].penaltyYds+=5;
  b.log.push({type:'penalty',side,text:`False start on the hard count, ${b.teams[side].short}. Five yards.`});
  b.snap=null;b.fourthGo=false;
}

// ---------------------------------------------------------------- resolution
function rollPenalty(b,play){
  return withRng(b,rng=>{
    let r=rng.next();
    for(const [kind,p] of Object.entries(Engine.PENALTY_TYPES)){if(p.pass&&!play.pass)continue;r-=p.weight;if(r<0)return{kind,spec:p}}
    return null;
  });
}
function resolveSnap(b){
  const g=b.game,off=offSide(b),def=defSide(b),s=b.snap;
  if(!s.def)s.def=decideAI(b,def,'def');
  if(!s.look)s.look=lookFor(b,s.def);
  if(!s.off)s.off=decideAI(b,off,'off');
  const play=D.PLAYS[s.off.play],call=D.CALLS[s.def.play],sit=situation(b);
  const lean=leanFor(b),heat=heatFor(b);
  // Drive memory for combos.
  const dkey=`${g.drive}:${off}`;if(b.drive.key!==dkey)b.drive={key:dkey,fams:[],firsts:0};
  const fams=b.drive.fams,isPA=play.id==='pa_boot'||play.upgradeOf==='pa_boot';
  const combo=isPA&&fams.length>=2&&fams[fams.length-1]==='run'&&fams[fams.length-2]==='run'?{id:'establish',name:'Establish the Run',duel:'K',v:1,reward:'+1 Command'}:null;
  const hurried=s.off.tactics.includes('hurry_up')&&s.def.tactics.length>0;
  const snap=R.buildSnap({weather:b.weather,...edgesFor(b,off),off:b.teams[off].lineup.off,def:b.teams[def].lineup.def,play,call,offTactics:s.off.tactics,defTactics:hurried?[]:s.def.tactics,situation:sit,lean,heat,motionConfirmed:s.motionConfirmed,combo,fire:b.fire});
  b.telemetry.snaps++;b.seriesSnap++;
  const lineKey=`${play.id}${s.off.tactics.length?'+'+[...s.off.tactics].sort().join('+'):''}`;b.telemetry.lineCounts[lineKey]=(b.telemetry.lineCounts[lineKey]||0)+1;
  // Tendencies move whether or not a flag flies.
  b.tend[off][play.family]++;b.tend[def][call.family==='pressure'?'pressure':call.coverage]++;
  const pen=g.period>4?null:rollPenalty(b,play);
  const result={userCalled:!!s.userCalled,sit,offSide:off,defSide:def,play:play.id,call:call.id,offTactics:[...s.off.tactics],defTactics:[...s.def.tactics],offInfo:[...s.offInfo],defInfo:[...s.defInfo],lean,heat,duels:snap.duels,look:s.look};
  if(pen){
    const against=pen.spec.against==='offense'?off:def;
    Engine.applyScrimmage(g,{penalty:{kind:pen.kind},clock:pen.spec.dead?4:8});
    b.box[against].penalties++;b.box[against].penaltyYds+=pen.spec.yards||5;
    result.penalty={kind:pen.kind,label:pen.spec.label,against};result.text=`Flag: ${pen.spec.label} on ${b.teams[against].short}.`;
  }else{
    const out=withRng(b,rng=>R.resolve(snap,rng,sit));
    Object.assign(result,{category:out.category,kind:out.kind,yards:out.yards,turnover:out.turnover||null,completed:out.completed,duelResults:out.duels,participants:out.participants});
    const before={down:g.down,distance:g.distance,field:g.fieldPosition,score:{...g.score}};
    const evStart=g.events.length;
    Engine.applyScrimmage(g,{yards:out.yards,clock:out.clock,kind:out.engineKind,completed:out.completed,turnover:out.turnover});
    // Tag the play the way Dynasty Lab's attribution expects (run/pass, completion, sack), plus who actually played it.
    for(let i=g.events.length-1;i>=evStart;i--){const ev=g.events[i];if(!['scrimmage','interception','fumble'].includes(ev.type))continue;
      ev.kind=out.engineKind;if(typeof out.completed==='boolean')ev.completed=out.completed;if(out.kind==='sack')ev.sack=true;
      const P=out.participants,O=b.teams[off].lineup.off,Df=b.teams[def].lineup.def,id=(lu,r)=>r&&lu[r]?String(lu[r].id):null;
      ev.card={play:play.id,call:call.id,category:out.category,actors:{qb:play.pass?id(O,'QB'):null,carrier:id(O,P.carrier),target:id(O,P.target),
        sacker:id(Df,P.sacker),tackler:out.kind==='sack'||out.turnover==='interception'?null:id(Df,P.defender),interceptor:out.turnover==='interception'?id(Df,P.defender):null}};break}
    recordStats(b,off,def,out,before,play);
    result.text=storyLine(b,off,def,play,out,before);
    result.events=[];
    if(hurried)result.events.push({type:'hurry',side:off,name:'Hurry-up',reward:'their adjustments never got in'});
    fams.push(play.family);
    if(combo){result.events.push({type:'combo',...combo,side:off});if(b.hands[off])b.hands[off].command=Math.min(D.RULES.seriesCommand,b.hands[off].command+1)}
    if(g.possession===off&&g.down===1&&g.score[off]===before.score[off]&&!out.turnover){
      b.drive.firsts++;
      if(b.drive.firsts===3){b.bonusCommand[off]=1;result.events.push({type:'combo',id:'chain_gang',name:'Chain Gang',reward:'+1 Command next series',side:off})}
    }
    updateFire(b,off,def,snap,out.wins,result.events);
    // A constraint play that works resets the tendency it punished.
    if(['success','explosive'].includes(out.category)){
      if(play.punishes==='run'&&lean==='run'){b.tend[off].run=0;result.reset='run'}
      if(play.id==='vertical_shot'&&lean==='quick'){b.tend[off].quick=0;result.reset='quick'}
      if(play.id==='screen'&&heat){b.tend[def].pressure=0;result.reset='pressure'}
    }
  }
  result.after=situation(b);result.score={...g.score};
  b.lastResult=result;b.log.push({type:'snap',...result});
  b.snap=null;b.fourthGo=false;
  return result;
}
// On Fire: a playmaker who wins every duel he's in for three straight snaps gets +1 until he loses one.
const OFF_SKILL=['QB','RB','X','Z','SLOT','TE'],DEF_SKILL=['RUSH','SET','MIKE','WILL','FCB','BCB','NICKEL','FS','BOXS'];
function updateFire(b,off,def,snap,wins,events){
  const tally=new Map();
  snap.duels.forEach((d,i)=>{
    for(const r of d.offRoles)if(OFF_SKILL.includes(r)){const p=b.teams[off].lineup.off[r];if(p){const t=tally.get(p.id)||{p,side:off,ok:true};t.ok=t.ok&&wins[i];tally.set(p.id,t)}}
    for(const r of d.defRoles)if(DEF_SKILL.includes(r)){const p=b.teams[def].lineup.def[r];if(p){const t=tally.get(p.id)||{p,side:def,ok:true};t.ok=t.ok&&!wins[i];tally.set(p.id,t)}}
  });
  for(const [id,t] of tally){
    if(t.ok){b.streaks[id]=(b.streaks[id]||0)+1;if(b.streaks[id]>=D.RULES.fireStreak&&!b.fire[id]){b.fire[id]=true;events.push({type:'fire',name:t.p.name,role:t.p.role,side:t.side,id})}}
    else{b.streaks[id]=0;if(b.fire[id]){delete b.fire[id];events.push({type:'cooled',name:t.p.name,role:t.p.role,side:t.side,id})}}
  }
}
function yardLine(f){return f>50?`opp ${100-f}`:f===50?'50':`own ${f}`}
function storyLine(b,off,def,play,out,before){
  const T=b.teams[off].lineup.off,DT=b.teams[def].lineup.def,P=out.participants;
  const nm=r=>T[r]?.name||r,dn=r=>DT[r]?.name||r;
  const why=out.duels.map(d=>`${d.label} ${d.won?'✓':'✗'}`).join(' · ');
  let what;
  if(out.turnover==='interception')what=`${nm('QB')} intercepted by ${dn(P.defender)}`;
  else if(out.kind==='sack')what=`${nm('QB')} sacked by ${dn(P.sacker)}, ${out.yards}`+(out.turnover?' — fumble, recovered by the defense':'');
  else if(out.kind==='inc')what=`${nm('QB')} incomplete to ${nm(P.target)}`;
  else if(out.kind==='catch')what=`${nm('QB')} to ${nm(P.target)} for ${out.yards}`;
  else what=`${nm(P.carrier)} ${out.kind==='scramble'?'scrambles':'runs'} for ${out.yards}`+(out.turnover?' — fumble, lost':'');
  return`${play.name}: ${what}. ${why}`;
}
function pstat(b,side,role,lineupKey){
  const p=b.teams[side].lineup[lineupKey][role];if(!p)return null;
  return b.players[p.id]??=(b.players[p.id]={id:p.id,name:p.name,side,role,archetype:p.archetype,rushAtt:0,rushYds:0,rushTD:0,passAtt:0,comp:0,passYds:0,passTD:0,ints:0,targets:0,rec:0,recYds:0,recTD:0,sacks:0,tackles:0,intDef:0,sacksTaken:0});
}
function recordStats(b,off,def,out,before,play){
  const bo=b.box[off],P=out.participants,g=b.game;
  const td=g.score[off]-before.score[off]>=6&&!out.turnover;
  // Gains stop at the goal line (and losses at your own end line), the way the engine and the box score count them.
  out={...out,yards:out.turnover?out.yards:Math.max(-before.field,Math.min(out.yards,100-before.field))};
  bo.plays++;
  if(before.down===3){bo.thirdAtt++}if(before.down===4){bo.fourthAtt++}
  const gained=!out.turnover&&out.yards>=before.distance;
  if(gained){bo.firstDowns++;if(before.down===3)bo.thirdConv++;if(before.down===4)bo.fourthConv++}
  if(out.yards>=20&&!out.turnover)bo.explosives++;
  if(out.kind==='sack'){bo.sacks++;bo.passAtt+=0;bo.yards+=out.yards;const q=pstat(b,off,'QB','off');q.sacksTaken++;const s=pstat(b,def,P.sacker,'def');if(s)s.sacks++;}
  else if(out.engineKind==='pass'){
    bo.passAtt++;const q=pstat(b,off,'QB','off');q.passAtt++;const t=pstat(b,off,P.target,'off');if(t)t.targets++;
    if(out.completed){bo.comp++;bo.passYds+=out.yards;bo.yards+=out.yards;q.comp++;q.passYds+=out.yards;if(t){t.rec++;t.recYds+=out.yards}if(td){q.passTD++;if(t)t.recTD++}const d=pstat(b,def,P.defender,'def');if(d&&!td)d.tackles++}
    if(out.turnover==='interception'){bo.ints++;q.ints++;const d=pstat(b,def,P.defender,'def');if(d)d.intDef++}
  }else{
    bo.rushAtt++;bo.rushYds+=out.yards;bo.yards+=out.yards;const c=pstat(b,off,P.carrier,'off');if(c){c.rushAtt++;c.rushYds+=out.yards;if(td)c.rushTD++}
    if(out.turnover==='fumble')bo.fumbles++;const d=pstat(b,def,P.defender,'def');if(d&&!td)d.tackles++;
  }
  if(out.kind==='sack'&&out.turnover==='fumble')bo.fumbles++;
}
function finalize(b){
  if(b.final)return;b.final={score:{...b.game.score},winner:b.game.score.home>b.game.score.away?'home':'away'};
  try{Engine.validateGame(b.game)}catch(e){b.final.engineError=e.message}
}

// Projection for the sandbox: what the person's current choice is expected to do against the Look.
function preview(b,side,choice){
  const req=b.pending;if(!req||req.side!==side)return null;
  const role=b.hands[side].role,sit=situation(b);
  if(role==='off'){
    const play=D.PLAYS[choice.play];if(!play)return null;
    const call=presumedCall(b.snap.look);
    const snap=R.buildSnap({weather:b.weather,...edgesFor(b,side),off:b.teams[side].lineup.off,def:b.teams[other(side)].lineup.def,play,call,offTactics:choice.tactics||[],situation:sit,lean:leanFor(b),heat:heatFor(b),motionConfirmed:b.snap.motionConfirmed});
    return{snap,ev:R.evaluate(snap,sit),against:call};
  }
  const call=D.CALLS[choice.play];if(!call)return null;
  const fam=b.snap.offLook.family.confirmed?b.snap.offLook.family.value:null,w=offFamilyWeights(b,fam),out=[];
  for(const f of OFF_FAMILIES){if(w[f]<.02)continue;const id=REP_PLAYS[f].find(x=>!R.playBlocked(D.PLAYS[x],b.teams[other(side)].lineup.off));if(!id)continue;
    const snap=R.buildSnap({weather:b.weather,...edgesFor(b,other(side)),off:b.teams[other(side)].lineup.off,def:b.teams[side].lineup.def,play:D.PLAYS[id],call,defTactics:choice.tactics||[],situation:sit,lean:leanFor(b),heat:heatFor(b)});
    out.push({family:f,weight:w[f],play:id,snap,ev:R.evaluate(snap,sit)})}
  return{vs:out};
}

// Save/resume: the whole battle is plain data except nothing — it serializes as-is.
function save(b){return JSON.stringify(b)}
function load(text){const b=JSON.parse(text);if(b.version!==VERSION)throw new Error('Unsupported battle version.');return b}

function simulate(opts){const b=create({...opts,user:null,mode:'sim'});advance(b);return b}

// Who won and lost each duel this game, per player, plus the plays that made highlights.
// A lost Gate decides the play, so the duels after it never happened. Returns {playerId:{name,side,w,l,big}}.
function duelTally(b){
  const out={},rec=(p,side)=>p?(out[p.id]??={name:p.name,side,w:0,l:0,big:0}):null;
  for(const e of b.log||[]){
    if(e.type!=='snap'||!e.duelResults||!e.duels)continue;
    const O=b.teams[e.offSide].lineup.off,Df=b.teams[e.defSide].lineup.def;
    for(let i=0;i<e.duelResults.length;i++){
      const d=e.duels[i],won=e.duelResults[i].won;if(!d)continue;
      for(const r of d.offRoles||[]){const t=rec(O[r],e.offSide);if(t)won?t.w++:t.l++}
      for(const r of d.defRoles||[]){const t=rec(Df[r],e.defSide);if(t)won?t.l++:t.w++}
      if(i===0&&!won)break;
    }
    const P=e.participants||{},td=/touchdown/i.test(e.text||'');
    if(Math.abs(e.yards||0)>=20||td||e.turnover||e.kind==='sack'){
      const defStar=e.kind==='sack'?Df[P.sacker]:e.turnover?Df[P.defender]:null;
      const offStar=defStar?null:(e.kind==='run'||e.kind==='scramble')?O[P.carrier]:e.completed?O[P.target]:null;
      const t=defStar?rec(defStar,e.defSide):rec(offStar,e.offSide);if(t)t.big++;
    }
  }
  return out;
}
return{VERSION,create,advance,submit,preview,save,load,simulate,offOptions,defOptions,leanFor,presumedCall,lookFor,duelTally};
});
