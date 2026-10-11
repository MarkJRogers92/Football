const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function engine(seed) {
  const e = loadEngine({seed});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  return e;
}

test('each simulated week reports the controlled team result on the status line', async () => {
  const e = await engine(31001);
  const u = e.T('Chicago Metropolitan');
  for (let week = 1; week <= 3; week++) {
    e.delegateWeeklyDecisions(u);
    e.simWeek(true);
    assert.equal(e.universe.week, week);
    const game = e.universe.schedule[week - 1].find(g => g.home === u.name || g.away === u.name);
    const status = e.$el('#saveStatus').textContent;
    if (!game) { assert.equal(status, `Week ${week} complete.`); continue; }
    const home = game.home === u.name, us = home ? game.score[1] : game.score[0], them = home ? game.score[0] : game.score[1];
    assert.equal(status, `Week ${week} final: ${game.winner === u.name ? 'W' : 'L'} ${us}-${them} ${home ? 'vs' : 'at'} ${home ? game.away : game.home}.`);
  }
});

test('a seeded universe generates the same portrait seeds on every load', async () => {
  const seeds = async () => (await engine(31002)).universe.teams[0].roster.slice(0, 20).map(p => [p.portraitSeed, p.jerseyNumber].join(':'));
  const first = await seeds();
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.deepEqual(await seeds(), first);
  assert.equal(new Set(first.map(s => s.split(':')[0])).size, first.length, 'seeds stay unique');
});
