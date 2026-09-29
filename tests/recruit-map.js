const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function league(seed) {
  const e = loadEngine({seed, fullRuntime: true});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  const u = e.T('Chicago Metropolitan');
  for (let i = 0; i < 6; i++) { e.delegateWeeklyDecisions(u); e.simWeek(true); }
  return {e, u};
}
const RM = () => globalThis.DynastyRecruitMap;

test('every recruit and school projects inside the map, Alaska and Hawaii included', async () => {
  const {e} = await league(92001);
  for (const x of [...e.universe.recruits, ...e.universe.teams]) {
    const [px, py] = RM().project(x.lat, x.lon);
    assert.ok(px >= 0 && px <= 1000 && py >= 0 && py <= 560, `${x.name} (${x.lat}, ${x.lon}) lands at ${px}, ${py}`);
  }
});

test('the map classifies recruits by their real status and always keeps yours', async () => {
  const {e, u} = await league(92002);
  RM().setFilter('5');
  const m = RM().model(u);
  const mine = e.universe.recruits.filter(r => r.committed === u.name).length;
  const targets = e.universe.recruits.filter(r => r.targeted && !r.committed).length;
  assert.equal(m.counts.mine, mine, 'every commit is shown whatever the star filter');
  assert.equal(m.counts.target, targets, 'every open target is shown whatever the star filter');
  for (const {r, status} of m.recruits) {
    if (status === 'elsewhere' || status === 'open') assert.equal(r.stars, 5, 'the filter applies to everyone else');
    if (status === 'elsewhere') assert.ok(r.committed && r.committed !== u.name);
  }
  RM().setFilter('all');
  assert.equal(RM().model(u).recruits.length, e.universe.recruits.length);
  RM().setFilter('3');
});
