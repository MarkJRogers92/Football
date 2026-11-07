const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function detailedGame(seed) {
  const e = loadEngine({seed, fullRuntime: true});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  e.delegateWeeklyDecisions(e.T('Chicago Metropolitan'));
  e.simulateUserDetailed();
  const g = e.universe.gameArchive.find(x => x.drives?.length);
  assert.ok(g, 'a detailed game with drives was archived');
  return {e, g};
}
const GC = () => globalThis.DynastyGameCast;

test('Game Cast rebuilds the game state play by play from the archive', async () => {
  const {g} = await detailedGame(91001);
  const m = GC().model(g);
  const lines = g.drives.reduce((n, d) => n + (d.playByPlay || []).length, 0);
  assert.equal(m.plays.length, lines + 1, 'every play line is parsed, plus the final state');
  const last = m.plays.at(-1);
  assert.deepEqual([last.home, last.away], [g.score.home, g.score.away], 'running score ends at the final');
  assert.equal(last.wp, g.score.home > g.score.away ? 1 : 0);
  for (let i = 1; i < m.plays.length; i++) {
    const p = m.plays[i], q = m.plays[i - 1];
    assert.ok(p.elapsed >= q.elapsed, 'time only moves forward');
    assert.ok(p.home >= q.home && p.away >= q.away, 'scores never go down');
    assert.ok(p.x >= 0 && p.x <= 100, 'ball stays on the field');
    assert.ok(p.wp >= 0 && p.wp <= 1);
  }
  assert.ok(m.swing && Math.abs(m.swing.delta) > 0, 'a biggest swing is identified');
});

test('win probability behaves like football', () => {
  const wp = GC().winProbability;
  assert.ok(Math.abs(wp(0, null, 50, 3600) - 0.5) < 0.08, 'a tied game at kickoff is near even');
  assert.ok(wp(7, null, 50, 60) > 0.95, 'a touchdown lead with a minute left is nearly decided');
  assert.ok(wp(7, null, 50, 3000) < wp(7, null, 50, 600), 'the same lead matters more later');
  assert.ok(wp(0, 'home', 10, 900) > wp(0, 'home', 90, 900), 'the ball near the opponent goal is worth more');
  assert.ok(wp(0, 'away', 10, 900) < 0.5, 'the away team threatening lowers the home chance');
});

test('games without play-by-play have no Game Cast model', async () => {
  const {e} = await detailedGame(91002);
  e.simWeek(true);
  const quick = e.universe.gameArchive.find(x => !x.drives?.length);
  assert.equal(GC().model(quick), null);
});

test('scoring plays include made two-point tries and safeties without double-counting',async()=>{
 const {e}=await detailedGame(91003);
 const g={id:'scoring-types',home:{name:'Home'},away:{name:'Away'},score:{home:8,away:2},drives:[
  {side:'home',label:'H1',points:8,result:'TD',playByPlay:['Q1 12:00 · 1st & 10 at opp 1 · TOUCHDOWN Home.','Q1 12:00 · 1st & 2 at opp 2 · Home two-point try good.']},
  {side:'away',label:'A1',points:2,result:'SAFETY',playByPlay:['Q2 10:00 · 1st & 10 at own 1 · SAFETY for Away.']},
  {side:'home',label:'H2',points:0,result:'END',playByPlay:['Q3 10:00 · 1st & 2 at opp 2 · Home two-point try failed.']}
 ]};
 const before=JSON.stringify(g),m=GC().model(g),scores=m.plays.filter(p=>p.scoring);
 assert.deepEqual(scores.map(p=>[p.offense,p.scoring]),[['home',6],['home',2],['away',2]]);
 assert.deepEqual(m.plays.filter(p=>!p.final).map(p=>[p.home,p.away]),[[0,0],[6,0],[8,0],[8,2]],'running score is reconciled exactly once');
 assert.equal(m.plays.at(-2).scoring,undefined,'a failed try is not a scoring play');
 assert.equal(JSON.stringify(g),before,'presentation never rewrites the archive');
 e.universe.gameArchive.push(g);e.showGameCenter(g.id,'Game Cast');
 const table=document.querySelector('#gameDialogBody').innerHTML.match(/<tbody>([\s\S]*?)<\/tbody>/)[1];
 assert.equal((table.match(/<tr>/g)||[]).length,3);
 assert.match(table,/<td>0–6<\/td>[\s\S]*<td>0–8<\/td>[\s\S]*<td>2–8<\/td>/,'score cells follow the advertised away–home order');
});
