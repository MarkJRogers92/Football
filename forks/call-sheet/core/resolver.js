// Call Sheet snap resolver: three named duels per play, call-vs-call modifiers, tactics and signatures.
// One function (buildSnap) computes every modifier; the AI's evaluation, the pre-snap chips and the real
// resolution all use it, so what the player is shown is exactly what is rolled.
(function(root,factory){
  const data=(typeof module==='object'&&module.exports)?require('./data.js'):root.CallSheet.data;
  const api=factory(data);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CallSheet.resolver=api;
})(typeof window==='object'?window:globalThis,function(D){
'use strict';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const RECEIVER_ROLES=['X','Z','SLOT','TE','RB'];

function playerAvg(p,traits){return traits.reduce((s,t)=>s+(p?.traits?.[t]??50),0)/traits.length}
function grade(lineup,roles,traits){
  const ps=roles.map(r=>lineup[r]).filter(Boolean);
  if(!ps.length)return 5;
  return Math.floor(ps.reduce((s,p)=>s+playerAvg(p,traits),0)/ps.length/10);
}
function traitGrade(p,trait){return Math.floor((p?.traits?.[trait]??50)/10)}
const winChance=m=>D.WIN_CHANCE[String(clamp(m,-3,3))];

// Is a play legal for this lineup? Returns null or a reason.
function playBlocked(play,lineup){
  const n=play.needs;
  if(n&&traitGrade(lineup[n.role],n.trait)<n.grade)return`Needs a ${n.role} with ${n.trait} ${n.grade}+`;
  return null;
}
function hasSig(lineup,roles,flag){return roles.some(r=>D.SIGNATURES[lineup[r]?.archetype]?.flag===flag)}
function offFlag(lineup,flag){return hasSig(lineup,Object.keys(D.OFF_ROLES),flag)}
function defFlag(lineup,flag){return hasSig(lineup,Object.keys(D.DEF_ROLES),flag)}

// Tactic legality for a given play. Returns null or a reason.
function tacticBlocked(tac,play,offLineup){
  const n=tac.needs;if(!n)return null;
  if(n.protection&&!play.protection)return'Only on plays with a protection duel';
  if(n.pass&&!play.pass)return'Only on pass plays';
  if(n.targetIq){
    const t=offLineup[play.target],sig=t?.archetype;
    if(traitGrade(t,'iq')<n.targetIq&&!['Route Sculptor','Space Hunter','Motion Weapon'].includes(sig))return`Target needs iq ${n.targetIq}+ or a route signature`;
  }
  if(n.plays){
    const ok=n.plays.includes(play.id)||(play.id==='inside_zone'&&D.SIGNATURES[offLineup.TE?.archetype]?.flag==='mauler');
    if(!ok)return'Only on '+n.plays.map(id=>D.PLAYS[id].name).join(', ')+(offFlag(offLineup,'mauler')?', Inside Zone':'');
  }
  return null;
}

// The best receiver a Bracket would take away: highest grade among the eligible targets.
function bracketRole(offLineup){
  let best='X',bg=-1;
  for(const r of ['X','Z','SLOT','TE']){const p=offLineup[r];if(!p)continue;const g=playerAvg(p,['speed','technique','power']);if(g>bg){bg=g;best=r}}
  return best;
}

// ctx: {off, def (lineups), play, call, offTactics[], defTactics[], situation{down,distance,field},
//       lean (defense leaning family or null), heat (bool), motionConfirmed (bool)}
function buildSnap(ctx){
  const {off,def,play,call}=ctx,ot=new Set(ctx.offTactics||[]),dt=new Set(ctx.defTactics||[]);
  const sit=ctx.situation||{down:1,distance:10,field:25};
  const brRole=dt.has('bracket')?(ctx.bracketRole||bracketRole(off)):null;
  const flags={};
  const duels=['G','K','F'].map(key=>{
    const d=play.duels[key],mods=[];
    const add=(v,src)=>{if(v)mods.push({v,src})};
    add(d.bias,'Play design');
    // Call vs call: the Football Strategy matrix, as duel modifiers.
    if(play.family==='run'){
      if(key==='G'){if(call.box==='loaded')add(-2,'Loaded box');if(call.box==='light')add(1,'Light box');if(call.pressure>0)add(-1,'Run blitz')}
      if(key==='K'&&call.pressure>0)add(1,'Blitzers vacate');
      if(key==='K'&&call.counters.includes('run'))add(-1,'Built for the run');
    }
    if(d.protect){if(call.pressure===1)add(-1,'Five-man rush');if(call.pressure===2)add(-2,'All-out blitz')}
    if(play.family==='quick'){
      if(key==='G'&&call.coverage==='man')add(-1,'Tight man');
      if(key==='K'&&call.pressure>0)add(-1,'Pressure speeds the clock');
      if(key==='F'&&call.pressure===2)add(1,'No help behind');
    }
    if(play.family==='deep'&&key==='K'){if(call.shell===2)add(-1,'Two deep');if(call.shell===0)add(2,'No safety')}
    if(play.pass&&key==='K'&&call.counters.includes(play.family))add(-1,'Coverage built for it');
    if(play.id==='screen'&&key==='G'&&call.pressure>0)add(2,'They rushed into it');
    if(play.id==='pa_boot'&&key==='K'&&call.box==='loaded')add(1,'Linebackers crowding');
    if(play.family==='constraint'&&key==='K'&&call.counters.includes('constraint'))add(-1,'Robber lurking');
    // Tendency: the defense leans, constraint plays punish it.
    if(ctx.lean){
      if(key==='K'&&play.family===ctx.lean&&call.counters.includes(ctx.lean))add(-1,'Sitting on it');
      if(key==='K'&&play.punishes===ctx.lean)add(2,'Punish the lean');
      if(key==='K'&&play.id==='vertical_shot'&&ctx.lean==='quick')add(1,'Punish the lean');
    }
    if(ctx.heat&&play.id==='screen'&&key==='K')add(1,'Blitz-happy defense');
    // Offensive tactics.
    const targetDuel=d.release||d.separation;
    if(ot.has('motion')&&targetDuel&&d.off.includes(play.target))add(1,'Motion');
    if(ot.has('route_adjust')&&targetDuel&&d.off.includes(play.target)){add(1,'Route adjustment');if(ctx.motionConfirmed)add(1,'Adjusted to confirmed coverage')}
    if(ot.has('max_protect')){if(d.protect)add(2,'Max protect');if(key==='F')add(-1,'One fewer route')}
    if(ot.has('seal_block')&&key==='G')add(2,'Seal block');
    // Defensive tactics.
    if(dt.has('disguise')&&d.qbRead)add(traitGrade(def.FS,'iq')<=5?-1:-2,'Disguised coverage');
    if(brRole&&d.off.some(r=>RECEIVER_ROLES.includes(r))&&(d.release||d.separation||key==='F'&&play.pass)){
      if(d.off.includes(brRole))add(-2,'Bracketed');else if(d.off.some(r=>['X','Z','SLOT','TE'].includes(r)))add(1,'Bracket left him alone');
    }
    if(dt.has('spy')){if(d.qbRun)add(-2,'QB spy');if(d.protect)add(1,'One fewer rusher')}
    if(dt.has('press')&&d.release){add(-1,'Press');flags.press=true}
    if(dt.has('identify_protection')&&d.protect&&call.pressure>0)add(-1,'Aimed pressure');
    // Generic card effects (new tactics, signature cards, calls with duel mods). Each names which duels it touches.
    const hits=e=>(e.duel==null||e.duel===key)&&(!e.flag||(e.flag==='run'?play.family==='run':e.flag==='pass'?!!play.pass:!!d[e.flag]))&&(!e.role||d.off.includes(e.role)||d.def.includes(e.role));
    for(const id of ot){const T=D.TACTICS[id]||{};for(const e of T.effects||[])if(hits(e))add(e.v,T.name)}
    for(const id of dt){const T=D.TACTICS[id]||{};for(const e of T.effects||[])if(hits(e))add(-e.v,T.name)}
    // Program edges from the dynasty: scheme fit, weekly prep, crowd. Extra conditions: family, pressureCall, thirdDown.
    const edgeHits=e=>hits(e)&&(!e.family||play.family===e.family)&&(!e.pressureCall||call.pressure>0)&&(!e.thirdDown||sit.down===3);
    for(const e of ctx.offEdges||[])if(edgeHits(e))add(e.v,e.src);
    for(const e of ctx.defEdges||[])if(edgeHits(e))add(-e.v,e.src);
    for(const e of play.effects||[])if(hits(e))add(e.v,e.src||play.name);
    for(const e of call.effects||[])if(hits(e))add(-e.v,e.src||call.name);
    // Weather.
    const wx=ctx.weather;
    if(wx==='rain'){if(play.pass&&key==='F')add(-1,'Wet ball');}
    if(wx==='wind'){if(play.family==='deep'&&key==='K')add(-1,'Swirling wind');}
    if(wx==='snow'){if(key==='F')add(-1,'Footing in the snow');if(play.family==='run'&&key==='G')add(1,'Snow slows the rush');}
    // Data-driven matchups on newer cards.
    for(const m of play.matchups||[]){
      if(m.duel!==key)continue;
      const hit={pressure:call.pressure>0,shell1:call.shell===1,shell2:call.shell===2,man:call.coverage==='man',zone:call.coverage==='zone',loaded:call.box==='loaded',light:call.box==='light'}[m.when];
      if(hit)add(m.v,m.src);
    }
    // Combos and hot players.
    if(ctx.combo&&ctx.combo.duel===key)add(ctx.combo.v,`COMBO: ${ctx.combo.name}`);
    if(ctx.fire){
      const hotO=d.off.map(r=>off[r]).find(p=>p&&ctx.fire[p.id]),hotD=d.def.map(r=>def[r]).find(p=>p&&ctx.fire[p.id]);
      if(hotO)add(1,`${hotO.name} ON FIRE`);if(hotD)add(-1,`${hotD.name} ON FIRE`);
    }
    // Signatures (offense positive, defense negative).
    for(const [roles,lineup] of [[d.off,off],[d.def,def]]){
      for(const r of roles){const s=D.SIGNATURES[lineup[r]?.archetype];if(s?.duel&&s.scope!=='field')add(s.duel({play,call},key,d),`${lineup[r].name} (${lineup[r].archetype})`)}
    }
    // Player conditions from the dynasty (fatigue, composure, morale, playing out of position). Labeled, ±1 each.
    const condOn=c=>c.when==='any'||c.when==='late'&&(sit.period||1)>=4||c.when==='money'&&sit.down>=3;
    for(const [roles,lineup,sign] of [[d.off,off,1],[d.def,def,-1]])for(const r of roles){const pl=lineup[r];for(const c of pl?.cond||[])if(condOn(c))add(sign*c.v,`${pl.name}: ${c.src}`)}
    for(const r of Object.keys(D.DEF_ROLES)){const p=def[r],s=D.SIGNATURES[p?.archetype];if(s?.duel&&s.scope==='field')add(s.duel({play,call},key,d),`${p.name} (${p.archetype})`)}
    const offGrade=grade(off,d.off,d.ot),defGrade=grade(def,d.def,d.dt);
    const raw=offGrade-defGrade+mods.reduce((s,m)=>s+m.v,0),margin=clamp(raw,-3,3);
    return{key,label:d.label,offRoles:d.off,defRoles:d.def,offNames:d.off.map(r=>off[r]?.name),defNames:d.def.map(r=>def[r]?.name),offGrade,defGrade,mods,raw,margin,p:winChance(margin),chip:D.chip(margin)};
  });
  // Result conversions that come from people.
  if(play.pass&&sit.down===3&&offFlag(off,'outlet')&&off.RB&&D.SIGNATURES[off.RB.archetype]?.flag==='outlet')flags.outlet=3;
  if(ot.has('max_protect')&&call.pressure===0&&D.SIGNATURES[off.TE?.archetype]?.flag==='checkRelease')flags.checkRelease=4;
  if(D.SIGNATURES[off.QB?.archetype]?.flag==='scramble')flags.scramble=true;
  if(play.carrier==='RB'&&D.SIGNATURES[off.RB?.archetype]?.flag==='burner')flags.burner=true;
  if(defFlag(def,'ballHawk'))flags.ballHawk=true;
  return{play,call,duels,flags,offTactics:[...ot],defTactics:[...dt],bracketRole:brRole};
}

function categoryProbs(snap){
  const [g,k,f]=snap.duels.map(d=>d.p);
  let fail=1-g,expl=g*k*f,succ=g*(k*(1-f)+(1-k)*f),short=g*(1-k)*(1-f);
  if(snap.flags.press){ // a release won through press is a bust: one step better
    expl=g*(k*f+k*(1-f)+(1-k)*f);succ=g*(1-k)*(1-f);short=0;
  }
  return{fail,short,success:succ,explosive:expl};
}

// Normal CDF for first-down odds.
function phi(x){const t=1/(1+.2316419*Math.abs(x)),d=.3989423*Math.exp(-x*x/2),p=d*t*(.3193815+t*(-.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return x>0?1-p:p}
function resultList(snap,cat){
  let list=snap.play.results[cat];
  if(cat==='short'&&(snap.flags.outlet||snap.flags.checkRelease))list=[{w:1,kind:'catch',yards:[snap.flags.outlet||snap.flags.checkRelease,1]}];
  return list;
}
// Expected value used by the AI and the "projection" line in the sandbox.
function evaluate(snap,situation){
  const probs=categoryProbs(snap),need=situation?.distance??10;
  let yards=0,first=0,to=0,sack=0;
  for(const [cat,pc] of Object.entries(probs)){
    if(!pc)continue;const list=resultList(snap,cat),wsum=list.reduce((s,r)=>s+r.w,0);
    for(const r of list){
      const pr=pc*r.w/wsum;let mean=r.yards[0]+(r.tail?r.tail*14:0);if(snap.flags.burner&&cat==='explosive')mean*=1.25;
      const sd=Math.max(.8,r.yards[1]+(r.tail?6:0));
      const intP=(r.int||0)*(snap.flags.ballHawk?1.5:1);
      to+=pr*(intP+(r.kind==='sack'?.07:0)+(r.kind==='run'&&(cat==='fail'||cat==='short')?.022:0));
      if(r.kind==='sack')sack+=pr;
      yards+=pr*(r.kind==='inc'?0:mean);
      if(r.kind!=='inc')first+=pr*(1-phi((need-.5-mean)/sd));
    }
  }
  return{yards,first,turnover:to,sack,probs};
}

// Roll the snap. rng: DynastyRng instance. Returns an engine outcome plus the story of the snap.
function resolve(snap,rng,situation){
  const wins=snap.duels.map(d=>rng.next()<d.p);
  let cat;
  if(!wins[0])cat='fail';else{const n=(wins[1]?1:0)+(wins[2]?1:0);cat=n===2?'explosive':n===1?'success':'short'}
  if(snap.flags.press&&wins[0]&&cat!=='explosive')cat=cat==='short'?'success':'explosive';
  const list=resultList(snap,cat),wsum=list.reduce((s,r)=>s+r.w,0);
  let pick=rng.next()*wsum,r=list[0];for(const x of list){pick-=x.w;if(pick<=0){r=x;break}}
  let kind=r.kind;
  if(kind==='sack'&&snap.flags.scramble&&rng.next()<.5)kind='scramble';
  let yards=r.yards[0]+r.yards[1]*rng.gauss();
  if(r.tail&&rng.next()<r.tail)yards+=8+(-Math.log(1-rng.next()))*16;
  if(snap.flags.burner&&cat==='explosive')yards*=1.25;
  if(kind==='scramble')yards=Math.max(yards,2+rng.next()*5);
  const intRoll=rng.next(),fumRoll=rng.next(),clockRoll=rng.next();
  yards=Math.round(yards);
  const play=snap.play,out={category:cat,kind,wins,duels:snap.duels.map((d,i)=>({key:d.key,label:d.label,won:wins[i],margin:d.margin,offNames:d.offNames,defNames:d.defNames}))};
  if(kind==='inc'){
    const intP=(r.int||0)*(snap.flags.ballHawk?1.5:1);
    if(intRoll<intP){out.turnover='interception';out.yards=clamp(Math.round(6+rng.gauss()*6),-2,30);out.clock=6}
    else{out.yards=0;out.clock=6}
    out.completed=false;
  }else if(kind==='sack'){
    out.yards=Math.min(-1,yards);out.clock=28;if(fumRoll<.07)out.turnover='fumble';
  }else{
    out.yards=yards;out.completed=kind==='catch';
    out.clock=Math.round(23+clockRoll*11);
    if(kind==='run'&&(cat==='fail'||cat==='short')&&fumRoll<.022)out.turnover='fumble';
  }
  out.engineKind=play.pass&&kind!=='scramble'?'pass':'rush';
  // Who did it, for the box score.
  const losing=!wins[0]?0:(!wins[1]?1:2);
  out.participants={
    passer:play.pass?'QB':null,
    target:play.pass&&kind!=='sack'&&kind!=='scramble'?(cat==='short'&&(snap.flags.outlet||snap.flags.checkRelease)?(snap.flags.outlet?'RB':'TE'):play.target):null,
    carrier:!play.pass?play.carrier:(kind==='scramble'?'QB':null),
    sacker:kind==='sack'?snap.duels[0].defRoles[0]:null,
    defender:snap.duels[kind==='inc'||kind==='sack'?Math.min(losing,2):Math.min(2,losing)].defRoles[0]
  };
  return out;
}

return{grade,traitGrade,playBlocked,tacticBlocked,bracketRole,buildSnap,categoryProbs,evaluate,resolve,winChance};
});
