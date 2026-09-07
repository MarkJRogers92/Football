const {test}=require('node:test');
const assert=require('node:assert/strict');
const feedback=require('../game-engine-v2-gameplan-feedback.js');

const record=(prep,opp={})=>({
  home:{id:1,name:'Chicago Metropolitan',gameplan:{prep,label:feedback.PLAN_LABELS[prep]}},
  away:{id:2,name:'Great Lakes University',gameplan:{prep:'standard',label:'Standard week'}},
  score:{home:31,away:20},
  teamStats:{
    home:{plays:66,rushAtt:34,rushYds:155,passAtt:28,passYds:240,turnovers:1},
    away:{plays:64,rushAtt:30,rushYds:120,passAtt:30,passYds:210,sacksTaken:3,turnovers:2,...opp}
  }
});

test('stop-run receipt grades actual rushing efficiency without claiming hidden causal certainty',()=>{
  const good=feedback.evaluate(record('stop_run',{rushAtt:32,rushYds:96}),'home');assert.equal(good.verdict,'Worked');assert.match(good.headline,/3\.0 yards per carry/);assert.match(good.detail,/96 rushing yards/);
  const bad=feedback.evaluate(record('stop_run',{rushAtt:30,rushYds:174}),'home');assert.equal(bad.verdict,'Missed');assert.match(bad.headline,/5\.8 yards per carry/);
});

test('pass-protection and pressure plans use archived opponent production',()=>{
  const cover=feedback.evaluate(record('protect_pass',{passAtt:35,passYds:210}),'home');assert.equal(cover.verdict,'Worked');assert.equal(cover.metrics.passYpa,6);
  const pressure=feedback.evaluate(record('pressure',{passAtt:34,passYds:238,sacksTaken:5}),'home');assert.equal(pressure.verdict,'Worked');assert.match(pressure.headline,/5 sacks/);
});

test('balanced prep uses total defensive efficiency and standard prep remains a neutral baseline',()=>{
  const balanced=feedback.evaluate(record('balance',{plays:70,rushYds:120,passYds:230}),'home');assert.equal(balanced.verdict,'Worked');assert.equal(balanced.metrics.yardsPerPlay,5);
  const standard=feedback.evaluate(record('standard'),'home');assert.equal(standard.verdict,'Baseline');assert.match(standard.detail,/turnover margin/);
});

test('team lookup resolves archive side and rejects unrelated teams',()=>{
  const r=record('pressure');assert.equal(feedback.forTeam(r,1).side,'home');assert.equal(feedback.forTeam(r,2).side,'away');assert.throws(()=>feedback.forTeam(r,99),/not part/);
});
