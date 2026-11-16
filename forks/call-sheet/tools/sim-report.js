#!/usr/bin/env node
// Calibration and pacing report for the Call Sheet battle.
//   node forks/call-sheet/tools/sim-report.js [games=200] [--json]
// 1. Realism: per-team per-game averages against FBS reference bands.
// 2. Variety: play-call mix and how concentrated the coordinators' choices are.
// 3. Pacing: how many decisions a person makes per game in each control mode.
'use strict';
const path=require('path');
const B=require(path.join(__dirname,'../core/battle.js'));
const Ro=require(path.join(__dirname,'../core/roster.js'));
const D=require(path.join(__dirname,'../core/data.js'));

const N=Number(process.argv[2])||200,asJson=process.argv.includes('--json');
const presets=Object.keys(Ro.PRESETS);

// FBS-style reference bands (per team per game), approximate. rushAttNcaa counts sacks as rushes, as NCAA stats do.
const BANDS={points:[24,33],plays:[63,76],yardsPerPlay:[5.2,6.4],rushAtt:[28,40],rushAttNcaa:[30,42],yardsPerCarry:[3.9,5.0],passAtt:[27,38],compPct:[.58,.67],yardsPerAtt:[6.6,8.2],sacks:[1.6,3.0],ints:[.6,1.1],fumblesLost:[.3,.8],thirdPct:[.36,.45],punts:[3.5,5.5],penalties:[5,7.5],explosives:[4,8]};

function run(){
  const tot={games:0,teamGames:0,points:0,plays:0,yards:0,rushAtt:0,rushYds:0,passAtt:0,comp:0,passYds:0,sacks:0,ints:0,fumbles:0,thirdAtt:0,thirdConv:0,punts:0,penalties:0,explosives:0,ot:0,errors:0};
  const families={},lines={},plays={};
  for(let i=0;i<N;i++){
    const h=presets[i%presets.length],a=presets[(i*3+1)%presets.length];
    const b=B.simulate({home:Ro.preset(h),away:Ro.preset(a),seed:`report-${i}`});
    tot.games++;if(b.final.engineError)tot.errors++;if(b.game.events.some(e=>e.type==='overtime_start'))tot.ot++;
    for(const side of ['home','away']){
      const x=b.box[side];tot.teamGames++;tot.points+=b.game.score[side];
      for(const k of ['plays','yards','rushAtt','rushYds','passAtt','comp','passYds','sacks','ints','fumbles','thirdAtt','thirdConv','punts','penalties','explosives'])tot[k]+=x[k];
    }
    for(const l of b.log)if(l.type==='snap'&&l.play){const f=D.PLAYS[l.play].family;families[f]=(families[f]||0)+1;plays[l.play]=(plays[l.play]||0)+1}
    for(const [k,v] of Object.entries(b.telemetry.lineCounts))lines[k]=(lines[k]||0)+v;
  }
  const tg=tot.teamGames,dropbacks=tot.passAtt+tot.sacks;
  const realism={
    points:tot.points/tg,plays:tot.plays/tg,yardsPerPlay:tot.yards/tot.plays,rushAtt:tot.rushAtt/tg,rushAttNcaa:(tot.rushAtt+tot.sacks)/tg,yardsPerCarry:tot.rushYds/tot.rushAtt,
    passAtt:tot.passAtt/tg,compPct:tot.comp/tot.passAtt,yardsPerAtt:tot.passYds/tot.passAtt,sacks:tot.sacks/tg,ints:tot.ints/tg,
    fumblesLost:tot.fumbles/tg,thirdPct:tot.thirdConv/tot.thirdAtt,punts:tot.punts/tg,penalties:tot.penalties/tg,explosives:tot.explosives/tg
  };
  const totalPlays=Object.values(plays).reduce((s,v)=>s+v,0);
  const playShare=Object.fromEntries(Object.entries(plays).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v/totalPlays]));
  const totalLines=Object.values(lines).reduce((s,v)=>s+v,0);
  const topLines=Object.entries(lines).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>[k,v/totalLines]);
  return{games:N,overtimeRate:tot.ot/N,engineErrors:tot.errors,realism,playShare,topLines,dropbackSackRate:tot.sacks/dropbacks};
}

// Pacing: let the coordinator answer for the person and count how often the game stops to ask.
function pacing(games=20){
  const out={};
  for(const mode of ['snap','series','key','sim']){
    let stops=0,plans=0,snaps=0,fourth=0;
    for(let i=0;i<games;i++){
      const b=B.create({home:Ro.preset('aerial'),away:Ro.preset('ground'),user:mode==='sim'?null:'home',mode,seed:`pace-${mode}-${i}`});
      let req=B.advance(b),guard=0;
      while(req&&++guard<2000){
        stops++;
        if(req.kind==='plan'){plans++;req=B.submit(b,{type:'plan',calls:[]})}
        else if(req.kind==='fourth'){fourth++;req=B.submit(b,{choice:req.recommended==='field_goal'?'field_goal':req.recommended})}
        else{snaps++;req=B.submit(b,{type:'auto'})}
      }
    }
    // Rough clock: a live snap ~20 s, a series plan ~12 s, a fourth-down choice ~5 s, plus ~3 s of animation per user snap.
    const per=x=>x/games;
    out[mode]={stopsPerGame:per(stops),liveSnaps:per(snaps),seriesPlans:per(plans),fourthDowns:per(fourth),estMinutes:Math.round((per(snaps)*23+per(plans)*12+per(fourth)*5)/60)};
  }
  return out;
}

const report={...run(),pacing:pacing()};
if(asJson){console.log(JSON.stringify(report,null,2));process.exit(0)}
const fmt=v=>v<1.5&&v>0?v.toFixed(3):v.toFixed(1);
console.log(`Call Sheet sim report — ${report.games} games (engine errors: ${report.engineErrors}, OT rate ${(report.overtimeRate*100).toFixed(1)}%)\n`);
console.log('Realism (per team per game)      value    band');
for(const [k,v] of Object.entries(report.realism)){const [lo,hi]=BANDS[k];const ok=v>=lo&&v<=hi?'  ok':v<lo?'  LOW':'  HIGH';console.log(`  ${k.padEnd(30)} ${fmt(v).padStart(7)}   ${lo}–${hi}${ok}`)}
console.log(`  sack rate per dropback          ${(report.dropbackSackRate*100).toFixed(1)}%`);
console.log('\nPlay share');for(const [k,v] of Object.entries(report.playShare))console.log(`  ${k.padEnd(16)} ${(v*100).toFixed(1)}%`);
console.log('\nTop lines (play + tactics)');for(const [k,v] of report.topLines)console.log(`  ${k.padEnd(40)} ${(v*100).toFixed(1)}%`);
console.log('\nPacing (person on one side; coordinator answers)   stops  live  plans  4th  ~minutes');
for(const [m,p] of Object.entries(report.pacing))console.log(`  ${m.padEnd(8)}                                   ${p.stopsPerGame.toFixed(0).padStart(5)} ${p.liveSnaps.toFixed(0).padStart(5)} ${p.seriesPlans.toFixed(0).padStart(6)} ${p.fourthDowns.toFixed(0).padStart(4)} ${String(p.estMinutes).padStart(8)}`);
