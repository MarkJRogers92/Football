const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { runSoak } = require('../tools/recruiting-soak');

const CALIBRATE = path.join(__dirname, '..', 'tools', 'recruiting-calibrate.js');

test('the soak drives full seasons with the desk on and every invariant holds', async () => {
  const { rows, violations } = await runSoak({ seasons: 2, seed: 3, policy: 'staff' });
  assert.equal(rows.length, 2, 'two seasons completed');
  assert.deepEqual(violations, []);
  for (const r of rows) {
    assert.ok(r.class >= 8, `a real class signed (${r.class})`);
    assert.ok(r.hours > 0 && r.hours <= r.budget, `the desk worked within its budget (${r.hours}/${r.budget})`);
    assert.ok(r.won + r.lost + r.cut > 0, 'the funnel made decisions');
    assert.ok(Number.isInteger(r.unsigned) && r.unsigned >= 0, 'uncommitted prospects may wait until signing day');
    assert.ok(r.deskKb < 2000, `the desk keeps its share of a save small (${r.deskKb.toFixed(0)} KB)`);
    assert.ok(Number.isFinite(r.saveMb) && r.saveMb > 1, 'the save was measured');
  }
  assert.equal(rows[1].year, rows[0].year + 1);
});

test('the soak can play as a coach who works the board, and still holds its invariants', async () => {
  const { rows, violations } = await runSoak({ seasons: 1, seed: 5, policy: 'skilled' });
  assert.deepEqual(violations, []);
  assert.ok(rows[0].hours > 0);
});

test('the calibration tool measures a policy against the old behavior and reports finite numbers', () => {
  const out = execFileSync(process.execPath, [CALIBRATE, '--policies', 'idle', '--tiers', 'mid', '--seeds', '1', '--jobs', '2', '--json'], { encoding: 'utf8' });
  const results = JSON.parse(out);
  assert.deepEqual(results.map(r => r.policy).sort(), ['idle', 'legacy'], 'the reference row is always measured');
  for (const r of results) {
    assert.equal(r.tier, 'mid');
    for (const key of ['commits', 'avgStars', 'blue', 'fromBoard', 'leagueStars']) assert.ok(Number.isFinite(r[key]), `${r.policy} ${key}`);
    assert.ok(r.commits >= 8);
  }
  const legacy = results.find(r => r.policy === 'legacy'), idle = results.find(r => r.policy === 'idle');
  assert.equal(idle.fromBoard, 0, 'an idle board lands nobody, since nobody was ever offered');
  assert.ok(Math.abs(legacy.leagueStars - idle.leagueStars) < .15, `league talent remains balanced despite different timing (legacy ${legacy.leagueStars}, idle ${idle.leagueStars})`);
});

test('--tune changes a constant for the run only, and refuses text it cannot find', () => {
  const bad = spawnSync(process.execPath, [CALIBRATE, '--policies', 'idle', '--tiers', 'mid', '--seeds', '1', '--jobs', '1', '--tune', '{"THIS_TEXT_IS_NOT_IN_THE_FILE":"x"}'], { encoding: 'utf8' });
  assert.notEqual(bad.status, 0);
  assert.match(bad.stderr, /text not found in recruiting-actions\.js/);
  const unchanged = require('fs').readFileSync(path.join(__dirname, '..', 'recruiting-actions.js'), 'utf8');
  assert.ok(!unchanged.includes('THIS_TEXT_IS_NOT_IN_THE_FILE'), 'nothing is ever written to the source');
});

test('an unknown policy or tier is rejected before any work starts', () => {
  for (const args of [['--policies', 'wizard'], ['--tiers', 'galactic']]) {
    const run = spawnSync(process.execPath, [CALIBRATE, ...args], { encoding: 'utf8' });
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, /unknown (policy|tier)/);
  }
});
