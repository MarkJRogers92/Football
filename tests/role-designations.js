const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function league(seed) {
  const e = loadEngine({seed});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.createNewDynasty();
  e.beginSeason();
  return e;
}

test('a redshirted listed starter keeps the role with a designation, and his replacement fills in', async () => {
  const e = await league(71001);
  let checked = 0;
  for (const t of e.universe.teams) {
    const listed = t.roster.find(p => p.id === t.roleDepth?.QB1?.[0]);
    if (!listed?.redshirtActive) continue;
    const plays = e.roleStarter(t, 'QB1');
    // With no other quarterback available the game falls back to the redshirt, who then plays.
    if (plays.id === listed.id) { assert.ok(e.roleDesignations(t, listed).includes('Starting QB')); continue; }
    assert.ok(e.roleDesignations(t, listed).includes('Starting QB (redshirt)'));
    assert.ok(e.roleDesignations(t, plays).includes('Starting QB (fills in)'));
    checked++;
  }
  assert.ok(checked > 0, 'the league has at least one redshirted listed QB1');
});

test('a healthy listed starter gets the plain role, and an injured one is marked out', async () => {
  const e = await league(71002);
  const u = e.T('Chicago Metropolitan');
  const qb = e.roleStarter(u, 'QB1');
  u.roleDepth.QB1 = [qb.id, ...u.roleDepth.QB1.filter(id => id !== qb.id)];
  assert.ok(e.roleDesignations(u, qb).includes('Starting QB'));
  qb.injuryWeeks = 3;
  assert.ok(e.roleDesignations(u, qb).includes('Starting QB (out)'));
  const backup = e.roleStarter(u, 'QB1');
  assert.notEqual(backup.id, qb.id);
  assert.ok(e.roleDesignations(u, backup).includes('Starting QB (fills in)'));
});

test('every role has exactly one listed starter and at most one fill-in', async () => {
  const e = await league(71003);
  const u = e.T('Chicago Metropolitan');
  const all = u.roster.flatMap(p => e.roleDesignations(u, p));
  for (const label of new Set(all.map(x => x.replace(/ \((redshirt|out|limited|fills in)\)$/, '')))) {
    const forRole = all.filter(x => x === label || x.startsWith(`${label} (`));
    assert.equal(forRole.filter(x => !x.endsWith('(fills in)')).length, 1, `${label} has one listed starter`);
    assert.ok(forRole.filter(x => x.endsWith('(fills in)')).length <= 1, `${label} has at most one fill-in`);
  }
});
