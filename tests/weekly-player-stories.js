const assert=require('node:assert/strict');
const stories=require('../weekly-player-stories-engine.js');
const players=[
  {id:'A',name:'Injured Star',pos:'WR',year:'JR',grade:88,upside:90,role:'Starter',health:62,injuryWeeks:2,morale:40,transferRisk:70,stats:{games:4,receptions:20,recYds:310,recTD:3}},
  {id:'B',name:'Young QB',pos:'QB',year:'SO',grade:78,upside:91,role:'Rotation',health:100,injuryWeeks:0,morale:70,transferRisk:10,stats:{games:4,passYds:720,passTD:7,int:2,rushYds:80,rushTD:1}},
  {id:'C',name:'Promise Back',pos:'RB',year:'FR',grade:74,upside:87,role:'Rotation',health:100,injuryWeeks:0,morale:75,transferRisk:12,promiseLabel:'EARLY ROLE',stats:{games:2,rushYds:120,rushTD:1}},
  {id:'D',name:'Veteran Edge',pos:'EDGE',year:'SR',grade:86,upside:87,role:'Starter',health:100,injuryWeeks:0,morale:74,transferRisk:10,stats:{games:4,tackles:25,tfl:5,sacks:4}},
  {id:'E',name:'Top Corner',pos:'CB',year:'JR',grade:90,upside:91,role:'Starter',health:100,injuryWeeks:0,morale:78,transferRisk:8,stats:{games:4,tackles:18,intDef:2}}
];
assert.ok(stories.productionScore(players[1])>4,'young QB fixture should qualify as meaningful production');
const challenge={pos:'QB',starterId:'X',starterName:'Veteran QB',challengerId:'B',challengerName:'Young QB',recommendation:'split'};
const out=stories.buildPlayerStories(players,{challenge,limit:5});assert.ok(out.length>=4&&out.length<=5);assert.equal(new Set(out.map(x=>x.playerId)).size,out.length,'a player should appear only once even when several story conditions apply');assert.equal(out[0].playerId,'A');assert.equal(out[0].type,'injury','availability should outrank the same player’s morale concern');assert.ok(out.some(x=>x.playerId==='B'&&['role_battle','breakout'].includes(x.type)));assert.ok(out.some(x=>x.playerId==='C'&&x.type==='promise'));assert.ok(out.some(x=>x.type==='cornerstone'||x.type==='breakout'||x.type==='role_battle'));
const quiet=stories.buildPlayerStories(players.map(p=>({...p,injuryWeeks:0,morale:75,transferRisk:5,promiseLabel:null,stats:{games:0}})),{limit:3});assert.equal(quiet.length,3);assert.equal(quiet[0].type,'emerging','quiet weeks should still surface a real high-upside young player before generic cornerstones');assert.equal(new Set(quiet.map(x=>x.playerId)).size,3);
console.log('PASS v0.10.2 Player Story selector: factual priorities, dedupe, breakout logic and quiet-week fallbacks');
