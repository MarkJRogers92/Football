#!/usr/bin/env node
// Call Sheet rules tests. Run: node forks/call-sheet/tests/battle.test.js
'use strict';
const assert=require('assert');
const path=require('path');
const B=require(path.join(__dirname,'../core/battle.js'));
const R=require(path.join(__dirname,'../core/resolver.js'));
const Ro=require(path.join(__dirname,'../core/roster.js'));
const D=require(path.join(__dirname,'../core/data.js'));
const P=require(path.join(__dirname,'../core/packs.js'));
const EV=require(path.join(__dirname,'../core/evolution.js'));
const W=require(path.join(__dirname,'../core/world.js'));

let passed=0;const failures=[];
function test(name,fn){try{fn();passed++;console.log(`  ok  ${name}`)}catch(e){failures.push(name);console.log(`  FAIL ${name}\n       ${e.stack.split('\n').slice(0,3).join('\n       ')}`)}}
const auto=(b,req)=>req.kind==='fourth'?B.submit(b,{choice:req.recommended}):req.kind==='plan'?B.submit(b,{type:'plan',calls:[]}):B.submit(b,{type:'auto'});

console.log('Call Sheet battle tests');

test('simulated games finish with a valid engine record',()=>{
  for(let i=0;i<12;i++){
    const b=B.simulate({home:Ro.preset('aerial'),away:Ro.preset('tempo'),seed:`valid-${i}`});
    assert.equal(b.game.status,'final');assert.ok(!b.final.engineError,b.final.engineError);
    assert.notEqual(b.game.score.home,b.game.score.away);
  }
});

test('the same seed plays the same game',()=>{
  const a=B.simulate({home:Ro.preset('ground'),away:Ro.preset('control'),seed:'det'}),c=B.simulate({home:Ro.preset('ground'),away:Ro.preset('control'),seed:'det'});
  assert.deepEqual(a.game.score,c.game.score);assert.equal(a.log.length,c.log.length);
  assert.deepEqual(a.log.map(l=>l.text),c.log.map(l=>l.text));
});

test('save and resume mid-game cannot change the next draw or result',()=>{
  const b=B.create({home:Ro.preset('aerial'),away:Ro.preset('ground'),user:'home',mode:'snap',seed:'resume'});
  let req=B.advance(b);for(let i=0;i<25&&req;i++)req=auto(b,req);
  const saved=B.save(b),copy=B.load(saved);
  assert.deepEqual(copy.pending,b.pending);
  let r1=b.pending,r2=copy.pending;
  for(let i=0;i<30&&r1;i++){r1=auto(b,r1);r2=auto(copy,r2)}
  assert.deepEqual(copy.game.score,b.game.score);assert.deepEqual(copy.hands,b.hands);assert.deepEqual(copy.log.map(l=>l.text),b.log.map(l=>l.text));
});

test('Command never goes negative and over-budget calls are refused',()=>{
  const b=B.create({home:Ro.preset('aerial'),away:Ro.preset('ground'),user:'home',mode:'snap',seed:'budget'});
  let req=B.advance(b),refused=false;
  for(let i=0;i<200&&req;i++){
    for(const s of ['home','away'])if(b.hands[s])assert.ok(b.hands[s].command>=0);
    if(req.kind==='snap'&&!refused){
      const expensive=req.options.plays.filter(p=>!p.blocked).sort((x,y)=>y.cost-x.cost)[0];
      const tactics=req.options.tactics.filter(t=>!t.card.info).map(t=>t.id);
      const total=expensive.cost+req.options.tactics.filter(t=>!t.card.info).reduce((s,t)=>s+t.cost,0);
      if(total>req.options.command&&tactics.length){
        assert.throws(()=>B.submit(b,{type:'call',play:expensive.id,tactics}),/Command|Only on|needs|Target/);refused=true;
      }
    }
    req=auto(b,req);
  }
  assert.ok(refused,'expected at least one over-budget attempt to be refused');
});

test('Confirmed Look facts are always true',()=>{
  for(let i=0;i<6;i++){
    const b=B.create({home:Ro.preset('aerial'),away:Ro.preset('tempo'),user:'home',mode:'snap',control:'offense',seed:`look-${i}`});
    let req=B.advance(b),checked=0;
    while(req){
      if(req.kind==='snap'&&req.role==='off'){
        const call=D.CALLS[b.snap.def.play],look=req.look;
        if(look.shell.confirmed){assert.equal(look.shell.value,call.shell);checked++}
        assert.equal(look.box.value,call.box);
        // Spend Check-With-Me if held: everything it confirms must be true.
        const cwm=req.options.tactics.find(t=>t.id==='check_with_me');
        if(cwm&&cwm.cost<=req.options.command){req=B.submit(b,{type:'info',tactic:'check_with_me'});const l=req.look;assert.equal(l.coverage.value,call.coverage);assert.equal(l.pressure.value,call.pressure>0);continue}
      }
      req=auto(b,req);
    }
    assert.ok(checked>0);
  }
});

test('the defense leans after enough runs, and PA Boot punishes it',()=>{
  const fresh=B.create({home:Ro.preset('ground'),away:Ro.preset('control'),seed:'lean2',mode:'sim'});
  fresh.game.status='live';fresh.game.possession='home';fresh.game.down=1;fresh.game.distance=10;fresh.game.fieldPosition=40;
  fresh.tend.home.run=fresh.teams.away.coach.discipline;
  assert.equal(B.leanFor(fresh),'run');
  const off=fresh.teams.home.lineup.off,def=fresh.teams.away.lineup.def;
  const pa=R.buildSnap({off,def,play:D.PLAYS.pa_boot,call:D.CALLS.cover3,situation:{down:1,distance:10},lean:'run'});
  assert.ok(pa.duels[1].mods.some(m=>m.src==='Punish the lean'&&m.v===2));
  const iz=R.buildSnap({off,def,play:D.PLAYS.inside_zone,call:D.CALLS.cover3,situation:{down:1,distance:10},lean:'run'});
  assert.ok(iz.duels[1].mods.some(m=>m.src==='Sitting on it'));
});

test('replacing the quarterback changes which line is best (DESIGN §5)',()=>{
  const team=Ro.preset('aerial'),def=Ro.preset('control').lineup.def;
  const call={...D.CALLS.cover1};const sit={down:2,distance:6};
  const score=(off,id,t=[])=>R.evaluate(R.buildSnap({off,def,play:D.PLAYS[id],call,offTactics:t,situation:sit,lean:'run'}),sit).yards;
  const star=team.lineup.off,gapStar=score(star,'deep_cross',['max_protect'])-score(star,'pa_boot',['max_protect']);
  const raw={...star,QB:{...star.QB,archetype:'Toolsy Project',traits:{...star.QB.traits,iq:52,composure:55,technique:56}}};
  const gapRaw=score(raw,'deep_cross',['max_protect'])-score(raw,'pa_boot',['max_protect']);
  assert.ok(gapRaw<gapStar-1,`deep cross should lose ground to PA boot with a raw QB (${gapStar.toFixed(2)} → ${gapRaw.toFixed(2)})`);
});

test('signatures change costs and legality, not just percentages',()=>{
  const b=B.create({home:Ro.makeTeam({name:'Sig',quality:72,archetypes:{QB:'Vertical Hunter',C:'Interior Technician'}},'sig'),away:Ro.preset('control'),seed:'sig'});
  b.game.possession='home';b.hands.home={role:'off',wrinkles:['vertical_shot'],tactics:['hard_count'],command:5,onceUsed:[]};
  const o=B.offOptions(b,'home');
  assert.equal(o.plays.find(p=>p.id==='vertical_shot').cost,1);
  assert.equal(o.tactics.find(t=>t.id==='hard_count').cost,0);
  const low=Ro.makeTeam({name:'Low',quality:60,archetypes:{SLOT:'YAC Creator'},bias:{SLOT:{iq:-30}}},'low');
  assert.ok(R.tacticBlocked(D.TACTICS.route_adjust,D.PLAYS.quick_slant,low.lineup.off));
  assert.ok(R.tacticBlocked(D.TACTICS.max_protect,D.PLAYS.inside_zone,low.lineup.off));
  const mauler=Ro.makeTeam({name:'Maul',quality:72,archetypes:{TE:'Inline Mauler'}},'m');
  assert.equal(R.tacticBlocked(D.TACTICS.seal_block,D.PLAYS.inside_zone,mauler.lineup.off),null);
});

test('series mode scripts early downs and asks live on key downs',()=>{
  const b=B.create({home:Ro.preset('aerial'),away:Ro.preset('ground'),user:'home',mode:'series',control:'offense',seed:'series'});
  let req=B.advance(b),plans=0,liveEarly=0,scriptedRan=0;
  for(let i=0;i<400&&req;i++){
    if(req.kind==='plan'){plans++;req=B.submit(b,{type:'plan',calls:[{play:'inside_zone',tactics:[]},{play:'stick',tactics:[]}]});continue}
    if(req.kind==='snap'){const s=req.situation;if(s.down<3&&s.field<D.RULES.redZone&&!((s.period===2||s.period===4)&&s.clock<=120)&&s.period<=4)liveEarly++}
    req=auto(b,req);
  }
  for(const l of b.log)if(l.type==='snap'&&l.offSide==='home'&&l.sit.down===1&&l.play==='inside_zone')scriptedRan++;
  assert.ok(plans>5);assert.equal(liveEarly,0);assert.ok(scriptedRan>3);
});

test('a new set of downs deals a fresh hand and Command',()=>{
  const b=B.create({home:Ro.preset('aerial'),away:Ro.preset('ground'),user:'home',mode:'snap',control:'offense',seed:'refill'});
  let req=B.advance(b),seen=0;
  for(let i=0;i<300&&req;i++){
    if(req.kind==='snap'&&req.situation.down===1&&b.seriesSnap===0){
      assert.ok([D.RULES.seriesCommand,D.RULES.seriesCommand+1].includes(req.options.command),'5 Command, or 6 after a Chain Gang combo');
      assert.equal(b.hands.home.wrinkles.length,D.RULES.wrinkleRow);assert.equal(b.hands.home.tactics.length,D.RULES.tacticHand);seen++;
    }
    req=auto(b,req);
  }
  assert.ok(seen>3);
});

test('card piles conserve every card',()=>{
  const b=B.simulate({home:Ro.preset('tempo'),away:Ro.preset('aerial'),seed:'conserve'});
  for(const side of ['home','away'])for(const role of ['off','def']){
    const deck=b.decks[side][role],p=b.piles[side][role],h=b.hands[side]&&b.hands[side].role===role?b.hands[side]:{wrinkles:[],tactics:[]};
    const ex=role==='off'||role==='def'?(b.exhausted[side]||[]).filter(id=>deck.wrinkles.includes(id)).length:0;
    assert.equal(p.wrinkle.draw.length+p.wrinkle.discard.length+h.wrinkles.length+ex,deck.wrinkles.length,`${side} ${role} wrinkles`);
    assert.equal(p.tactic.draw.length+p.tactic.discard.length+h.tactics.length,deck.tactics.length,`${side} ${role} tactics`);
  }
});

test('combos, hot streaks and trick plays fire in real games',()=>{
  let combos=0,fires=0,cools=0;
  for(let i=0;i<10;i++){const b=B.simulate({home:Ro.preset('ground'),away:Ro.preset('aerial'),seed:`events-${i}`});
    for(const l of b.log)for(const e of l.events||[]){if(e.type==='combo')combos++;if(e.type==='fire')fires++;if(e.type==='cooled')cools++}}
  assert.ok(combos>0,'expected combos');assert.ok(fires>0,'expected hot streaks');assert.ok(cools>0,'expected players cooling off');
  const b=B.create({home:Ro.preset('aerial'),away:Ro.preset('ground'),user:'home',mode:'snap',control:'offense',seed:'trick'});
  b.decks.home.off.wrinkles.push('statue_left');
  let req=B.advance(b);
  while(req&&!(req.kind==='snap'&&req.role==='off'))req=auto(b,req);
  b.hands.home.wrinkles.push('statue_left');b.hands.home.command=5;
  B.submit(b,{type:'call',play:'statue_left',tactics:[]});
  assert.deepEqual(b.exhausted.home,['statue_left']);
  const p=b.piles.home.off.wrinkle;assert.ok(!p.discard.includes('statue_left')&&!p.draw.includes('statue_left'),'trick play must not return to the piles');
});

test('packs: film study counters, pick-one, capacity cuts, one legendary per world',()=>{
  const pb=P.newPlaybook();
  const film=P.openPack(pb,{won:false,seed:'f',oppTendency:{run:9,quick:1,deep:1,constraint:0}});
  assert.equal(film.cards.length,3);
  assert.ok(film.cards.filter(c=>P.COUNTERS.run.includes(c.id)).length>=2,'film study should lead with run counters');
  const win=P.openPack(pb,{won:true,seed:'w'});assert.equal(win.cards.length,4);
  assert.equal(new Set(win.cards.map(c=>c.id)).size,4,'no duplicate cards in one pack');
  // Fill the play pile to capacity, then a pick must force a cut.
  while(pb.off.wrinkles.length<pb.capacity.wrinkles)pb.off.wrinkles.push('power');
  const res=P.applyPick(pb,{id:'draw',kind:'play',side:'off',rarity:'common'});
  assert.deepEqual(res.over,{side:'off',pile:'wrinkles'});
  P.cut(pb,'off','wrinkles',0);assert.equal(P.overCapacity(pb),null);
  // Upgrades replace the base play on the sheet.
  P.applyPick(pb,{id:'inside_zone_plus',kind:'upgrade',side:'off',replaces:'inside_zone',rarity:'rare'});
  assert.ok(pb.off.base.includes('inside_zone_plus')&&!pb.off.base.includes('inside_zone'));
  // A legendary you own, or another program owns, never appears again.
  P.applyPick(pb,{id:'statue_left',kind:'play',side:'off',rarity:'legendary'});
  for(let i=0;i<60;i++){const pk=P.openPack(pb,{won:true,seed:'leg'+i,worldTaken:['midnight_mirage']});assert.ok(!pk.cards.some(c=>c.id==='statue_left'||c.id==='midnight_mirage'))}
  // Picked cards play in a real battle.
  const team=Ro.preset('aerial');team.decks=P.decksOf(pb);
  const b=B.simulate({home:team,away:Ro.preset('ground'),seed:'pb-game'});assert.equal(b.game.status,'final');
});

test('evolution: reps from real games, two permanent branches, evolved cards play',()=>{
  const pb=P.newPlaybook();
  const b=B.simulate({home:Ro.preset('ground'),away:Ro.preset('control'),seed:'evo'});
  const gained=EV.recordReps(pb,b.log,'home');
  assert.ok(Object.values(gained).reduce((s,v)=>s+v,0)>40,'a game should earn reps');
  assert.equal(EV.ready(pb).length,0,'nothing evolves after a single game');
  pb.mastery.inside_zone=EV.BASE_REPS;
  const r=EV.ready(pb).find(x=>x.rootId==='inside_zone');assert.deepEqual(r.options,['duo','split_zone']);
  EV.evolve(pb,'inside_zone','duo');
  assert.ok(pb.off.base.includes('duo')&&!pb.off.base.includes('inside_zone'));
  assert.ok(!EV.ready(pb).some(x=>x.rootId==='inside_zone'),'a card evolves once');
  assert.throws(()=>EV.evolve(pb,'outside_zone','duo'));
  // An upgraded card evolves too, keeping one root.
  const pb2=P.newPlaybook();P.applyPick(pb2,{id:'pa_boot_plus',kind:'upgrade',side:'off',replaces:'pa_boot',rarity:'rare'});
  pb2.mastery={pa_boot:EV.WRINKLE_REPS};assert.ok(EV.ready(pb2).some(x=>x.rootId==='pa_boot'));
  EV.evolve(pb2,'pa_boot','pa_shot');assert.ok(pb2.off.wrinkles.includes('pa_shot')&&!pb2.off.wrinkles.some(id=>id.startsWith('pa_boot')));
  // Evolved offense and defense cards resolve in a real battle without breaking the stats.
  const t=Ro.preset('ground');t.decks=P.decksOf(pb);EV.evolve(t.decks?pb:pb,'two_high','cover6');t.decks=P.decksOf(pb);
  const g=B.simulate({home:t,away:Ro.preset('tempo'),seed:'evo-game'});
  assert.equal(g.game.status,'final');assert.ok(g.log.some(l=>l.play==='duo'),'Duo should get called');
});

test('league: AI programs open packs, cut to capacity, evolve, and never share a legendary',()=>{
  const pb=P.newPlaybook(),w=W.newWorld('aerial','league-test');
  assert.equal(Object.keys(w.programs).length,7);assert.ok(!w.programs.aerial);
  const opp0=W.opponentOf(w);
  for(let wk=0;wk<21;wk++)W.advanceWeek(w,pb,{won:wk%2===0,userTendency:{run:5,quick:3,deep:2,constraint:1}});
  assert.equal(w.week,21);assert.equal(w.season,4);assert.equal(W.opponentOf(w),w.order[0]);assert.equal(opp0,w.order[0]);
  const all=[];let evolved=0,games=0;
  for(const p of Object.values(w.programs)){
    games+=p.record.w+p.record.l;evolved+=Object.keys(p.playbook.evolved||{}).length;all.push(...p.playbook.legendaries);
    assert.equal(P.overCapacity(p.playbook),null,'AI programs must stay within capacity');
    assert.ok(p.playbook.packsOpened>=18,'every AI program opens a pack each week');
  }
  assert.equal(new Set(all).size,all.length,'a legendary exists once per world');
  assert.ok(evolved>0,'AI programs evolve cards');
  // Programs diverge: no two AI playbooks are identical.
  const sigs=Object.values(w.programs).map(p=>JSON.stringify([p.playbook.off,p.playbook.def]));
  assert.equal(new Set(sigs).size,sigs.length);
  // Your legendary is excluded from every AI pack.
  pb.legendaries.push('statue_left');assert.ok(W.takenLegendaries(w,pb,'lakeshore').includes('statue_left'));
  // An AI team plays with its built playbook.
  const id=W.opponentOf(w),g=B.simulate({home:W.teamFor('aerial',pb),away:W.teamFor(id,w.programs[id].playbook),seed:'ai-deck'});
  assert.equal(g.game.status,'final');
});

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length?1:0);
