#!/usr/bin/env node
// Call Sheet rules tests. Run: node forks/call-sheet/tests/battle.test.js
'use strict';
const assert=require('assert');
const path=require('path');
const B=require(path.join(__dirname,'../core/battle.js'));
const R=require(path.join(__dirname,'../core/resolver.js'));
const Ro=require(path.join(__dirname,'../core/roster.js'));
const D=require(path.join(__dirname,'../core/data.js'));

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
      assert.equal(req.options.command,D.RULES.seriesCommand);
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
    assert.equal(p.wrinkle.draw.length+p.wrinkle.discard.length+h.wrinkles.length,deck.wrinkles.length,`${side} ${role} wrinkles`);
    assert.equal(p.tactic.draw.length+p.tactic.discard.length+h.tactics.length,deck.tactics.length,`${side} ${role} tactics`);
  }
});

console.log(`\n${passed} passed, ${failures.length} failed`);
process.exit(failures.length?1:0);
