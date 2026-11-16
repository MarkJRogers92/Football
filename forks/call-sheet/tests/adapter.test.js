#!/usr/bin/env node
// Proves the card battle can run on real Dynasty Lab rosters: generate a universe with the real engine
// (tools/harness.js), convert two teams, play a full Call Sheet battle, and check the people in it are real.
'use strict';
const assert=require('assert'),path=require('path');
const H=require(path.join(__dirname,'../../../tools/harness.js'));
const A=require(path.join(__dirname,'../core/adapter.js'));
const B=require(path.join(__dirname,'../core/battle.js'));
const SG=require(path.join(__dirname,'../core/signatures.js'));
(async()=>{
  const E=H.loadEngine({seed:11});if(E.loadSchools)await E.loadSchools();E.initUniverse();
  const teams=E.universe.teams;assert.ok(teams.length>=100);
  let fallbacks=0;
  for(const t of teams.slice(0,40)){const {lineup,missing}=A.lineupFromTeam(t);fallbacks+=missing.length;
    assert.equal(Object.keys(lineup.off).length,11,`${t.name} offense`);assert.equal(Object.keys(lineup.def).length,11,`${t.name} defense`);
    const ids=[...Object.values(lineup.off),...Object.values(lineup.def)].map(p=>p.id);assert.equal(new Set(ids).size,22,'no player starts twice')}
  const home=A.battleTeam(teams[0]),away=A.battleTeam(teams[1]);
  const qb=teams[0].roster.find(p=>String(p.id)===home.lineup.off.QB.id);
  assert.ok(qb&&qb.style===home.lineup.off.QB.archetype&&qb.iq===home.lineup.off.QB.traits.iq,'QB is the real Dynasty Lab player');
  const b=B.simulate({home,away,seed:'dl-battle'});
  assert.equal(b.game.status,'final');assert.ok(!b.final.engineError,b.final.engineError);
  const starIds=new Set(Object.values(b.players).map(p=>p.id));
  assert.ok([...starIds].every(id=>teams[0].roster.some(p=>String(p.id)===id)||teams[1].roster.some(p=>String(p.id)===id)),'every stat line belongs to a real roster player');
  const sig=SG.specFor(home.lineup.off.Z);assert.ok(sig.id.startsWith('sig_'));
  console.log(`ok  real Dynasty Lab rosters play a full card battle (${b.game.score.home}-${b.game.score.away}, ${fallbacks} depth-chart fallbacks across 40 teams)`);
})().catch(e=>{console.error('FAIL',e.stack);process.exit(1)});
