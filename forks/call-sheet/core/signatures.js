// Call Sheet signature player cards (rules v0.5).
// A player who has a breakout game earns a card of his own, built from his position and archetype: a receiver's
// route, a back's run, a rusher's pressure package, a lineman's wall. A signature card belongs to that person and
// plays only while he's on the field. Programs hold at most 3, so earning a fourth means choosing.
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const deps=node?[require('./data.js')]:[root.CallSheet.data];
  const api=factory(...deps);
  if(node)module.exports=api;else root.CallSheet.signatures=api;
})(typeof window==='object'?window:globalThis,function(D){
'use strict';
const SLOTS=3;
const R=(w,kind,yards,extra={})=>({w,kind,yards,...extra});
const lastName=n=>String(n).split(' ').slice(-1)[0];
const COVER={X:'BCB',Z:'FCB',SLOT:'NICKEL',TE:'WILL',RB:'WILL'};
const PASS_QB=['Rhythm Distributor','Field Architect','Vertical Hunter','Toolsy Project'];

// Which template a player gets.
function templateFor(p){
  const r=p.role;
  if(r==='QB')return PASS_QB.includes(p.archetype)?'qb_audible':'qb_keeper';
  if(r==='RB')return p.archetype==='Third-Down Weapon'?'rb_wheel':'rb_express';
  if(['X','Z','SLOT'].includes(r))return'wr_special';
  if(r==='TE')return'te_seam';
  if(['LT','LG','C','RG','RT'].includes(r))return'ol_wall';
  if(['RUSH','SET','NT','DT3'].includes(r))return'dl_unleashed';
  if(['MIKE','WILL'].includes(r))return'lb_hunt';
  if(['FCB','BCB','NICKEL'].includes(r))return'cb_island';
  return's_robber';
}
// Build the card definition for a spec. Kinds: play (offense wrinkle), call (defense wrinkle), tactic.
function build(spec){
  const L=spec.last,who=spec.name,r=spec.role,base={id:spec.id,cost:1,signature:spec};
  switch(spec.template){
    case'qb_audible':return{kind:'tactic',side:'off',def:{...base,side:'off',name:`${L} Audible`,icon:'📣',effects:[{flag:'qbRead',v:2}],text:`${who} changes the play at the line. Every QB read duel +2.`}};
    case'qb_keeper':return{kind:'play',side:'off',def:{...base,side:'off',name:`${L} Keeper`,family:'run',carrier:'QB',matchups:[{when:'man',duel:'F',v:1,src:'Defenders turned their backs in man'}],
      text:`${who} keeps it and goes. Built around one player's legs.`,
      duels:{G:{label:'Pull it',off:['QB'],ot:['iq','speed'],def:['SET'],dt:['iq','speed'],bias:2,qbRun:true},K:{label:'Get outside',off:['QB'],ot:['speed','versatility'],def:['WILL'],dt:['speed','iq'],bias:1,qbRun:true},F:{label:'Take it to the house',off:['QB'],ot:['speed','power'],def:['FS'],dt:['speed','technique'],bias:1,qbRun:true}},
      results:{fail:[R(1,'run',[-1,1.5])],short:[R(1,'run',[3,1.5])],success:[R(1,'run',[9,2])],explosive:[R(1,'run',[20,8],{tail:.3})]}}};
    case'rb_express':return{kind:'play',side:'off',def:{...base,side:'off',name:`${L} Express`,family:'run',carrier:'RB',
      text:`Give it to ${who} and get out of the way.`,
      duels:{G:{label:'Hit the hole',off:['RB','C'],ot:['power','technique'],def:['NT','MIKE'],dt:['power','iq'],bias:2},K:{label:'One cut',off:['RB'],ot:['iq','speed'],def:['WILL'],dt:['speed','iq'],bias:1},F:{label:'Run through it',off:['RB'],ot:['power','speed'],def:['BOXS'],dt:['power','technique'],bias:1}},
      results:{fail:[R(1,'run',[0,1.5])],short:[R(1,'run',[3,1.2])],success:[R(1,'run',[7,2])],explosive:[R(1,'run',[17,7],{tail:.25})]}}};
    case'rb_wheel':case'wr_special':case'te_seam':{
      const tgt=spec.template==='rb_wheel'?'RB':spec.template==='te_seam'?'TE':r,cov=COVER[tgt];
      const name=spec.template==='rb_wheel'?`${L} Wheel`:spec.template==='te_seam'?`${L} Seam`:`${L} Special`;
      return{kind:'play',side:'off',def:{...base,side:'off',name,family:'deep',target:tgt,pass:true,protection:true,
        text:`A route drawn up for ${who} and nobody else.`,
        duels:{G:{label:'Protection',off:['LT','RT'],ot:['technique','power'],def:['RUSH','SET'],dt:['speed','technique'],bias:2,protect:true},
          K:{label:`${L} gets open`,off:[tgt],ot:['speed','technique'],def:[cov],dt:['speed','technique'],bias:1,separation:true},
          F:{label:`${L} makes the catch`,off:[tgt],ot:['technique','composure'],def:['FS'],dt:['iq','speed'],bias:1}},
        results:{fail:[R(.3,'sack',[-6,2]),R(.5,'inc',[0,0],{int:.04}),R(.2,'catch',[4,2])],short:[R(.5,'inc',[0,0],{int:.03}),R(.5,'catch',[7,2])],success:[R(.8,'catch',[17,4]),R(.2,'inc',[0,0])],explosive:[R(1,'catch',[30,10],{tail:.3})]}}};
    }
    case'ol_wall':return{kind:'tactic',side:'off',def:{...base,side:'off',name:`${L} Wall`,icon:'🧱',effects:[{flag:'protect',v:2},{flag:'run',duel:'G',v:1}],text:`${who} anchors the line: Protection +2, run Gate +1.`}};
    case'dl_unleashed':return{kind:'call',side:'def',def:{...base,side:'def',name:`${L} Unleashed`,family:'pressure',box:'normal',shell:1,coverage:'zone',pressure:1,counters:['deep','quick'],look:{pressureShown:false},
      effects:[{flag:'protect',v:2,src:`${who} unleashed`}],text:`Free ${who} on a twist nobody has seen. Pressure +2.`}};
    case'lb_hunt':return{kind:'call',side:'def',def:{...base,side:'def',name:`${L} Hunt`,family:'man',box:'loaded',shell:1,coverage:'man',pressure:0,counters:['run','constraint'],look:{pressureShown:false},
      effects:[{flag:'run',duel:'K',v:2,src:`${who} reads it first`}],text:`${who} triggers downhill before the handoff. Run Key duels +2 for you.`}};
    case'cb_island':return{kind:'tactic',side:'def',def:{...base,side:'def',name:`${L} Island`,icon:'🏝',effects:[{flag:'separation',v:2},{flag:'release',v:1}],text:`Put ${who} on their best and leave him alone. +2 against separation, +1 against release.`}};
    default:return{kind:'tactic',side:'def',def:{...base,side:'def',name:`${L} Robber`,icon:'🦅',effects:[{flag:'qbRead',v:2}],text:`${who} sits in the throwing lane. Their QB read duels −2.`}};
  }
}
function register(spec){
  const b=build(spec),table=b.kind==='play'?D.PLAYS:b.kind==='call'?D.CALLS:D.TACTICS;
  table[spec.id]=b.def;D.RARITY[spec.id]='signature';return b;
}
function registerAll(pb){for(const s of pb?.signatures||[])register(s)}
function specFor(player,info={}){
  const template=templateFor(player),b=build({template,role:player.role,last:lastName(player.name),name:player.name,id:'x'});
  return{id:`sig_${player.id}`,template,playerId:player.id,name:player.name,last:lastName(player.name),role:player.role,pos:player.pos,archetype:player.archetype,number:player.number,portraitSeed:player.portraitSeed,
    side:b.side,pile:b.kind==='tactic'?'tactics':'wrinkles',earned:info.earned||'',season:info.season||1,colors:info.colors||null};
}
// Who broke out in this game? A dominant share of his duels, or catching fire again and again.
// Plus a cooldown: at most one breakout every COOLDOWN games, so a signature card stays an event.
function breakouts(b,side){
  const tally=new Map(),lu=b.teams[side].lineup;
  const touch=(p,won)=>{if(!p)return;const t=tally.get(p.id)||{p,wins:0,duels:0,fire:0};t.duels++;if(won)t.wins++;tally.set(p.id,t)};
  for(const e of b.log){
    if(e.type!=='snap'||!e.duelResults)continue;
    e.duels.forEach((d,i)=>{const won=e.duelResults[i].won;
      if(e.offSide===side)for(const r of d.offRoles)touch(lu.off[r],won);
      if(e.defSide===side)for(const r of d.defRoles)touch(lu.def[r],!won);});
    for(const ev of e.events||[])if(ev.type==='fire'&&ev.side===side){const t=tally.get(ev.id);if(t)t.fire++}
  }
  return[...tally.values()].filter(t=>t.fire>=5||(t.wins>=15&&t.wins/t.duels>=.8)).map(t=>({...t,score:t.wins+t.fire*4})).sort((a,c)=>c.score-a.score);
}
// The best breakout who doesn't already have a card.
const COOLDOWN=3;
function candidate(b,side,pb){
  const games=pb.gamesPlayed??((pb.record?.w||0)+(pb.record?.l||0));
  if(pb.lastSignatureGame!=null&&games-pb.lastSignatureGame<COOLDOWN)return null;
  const have=new Set((pb.signatures||[]).map(s=>s.playerId));
  return breakouts(b,side).find(t=>!have.has(t.p.id))||null;
}
function add(pb,spec,replaceIndex){
  pb.signatures??=[];
  if(pb.signatures.length>=SLOTS){if(replaceIndex==null)return{full:true};pb.signatures.splice(replaceIndex,1)}
  pb.signatures.push(spec);register(spec);pb.lastSignatureGame=pb.gamesPlayed??((pb.record?.w||0)+(pb.record?.l||0));(pb.history??=[]).push({id:spec.id,kind:'signature',side:spec.side});
  return{full:false};
}

return{SLOTS,COOLDOWN,templateFor,build,register,registerAll,specFor,breakouts,candidate,add,lastName};
});
