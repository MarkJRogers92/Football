const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function engine(seed) {
  const e = loadEngine({seed, fullRuntime: true});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  return e;
}
const outlook = () => globalThis.DynastyAdminOutlook.model();

test('before a game is played the outlook states the expectation only', async () => {
  const e = await engine(51001);
  e.createNewDynasty();
  const m = outlook();
  assert.equal(m.mode, 'preseason');
  assert.equal(m.exp, e.seasonExpectation(e.T('Chicago Metropolitan')));
  assert.equal(m.projected, undefined);
});

test('in season the projection follows the current win pace', async () => {
  const e = await engine(51002);
  e.initUniverse();
  const u = e.T('Chicago Metropolitan');
  for (let i = 0; i < 4; i++) { e.delegateWeeklyDecisions(u); e.simWeek(true); }
  const m = outlook(), played = u.w + u.l;
  assert.equal(m.mode, 'pace');
  assert.equal(m.projectedWins, Math.min(u.w + (12 - played), Math.max(u.w, Math.round(u.w / played * 12))));
  assert.ok(m.projected >= 0 && m.projected <= 100);
  assert.equal(m.projected, Math.max(0, Math.min(100, m.conf + m.delta)));
});

test('at season end the outlook predicts exactly what the administration review applies', async () => {
  const e = await engine(51003);
  e.initUniverse();
  e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
  const before = outlook();
  assert.equal(before.mode, 'final');
  e.runOffseason();
  const review = e.universe.tenure.seasons.at(-1);
  assert.equal(before.delta, review.delta, 'predicted change matches the review');
  assert.equal(before.projected, review.after, 'predicted confidence matches the review');
  const after = outlook();
  assert.equal(after.mode, 'reviewed');
  assert.equal(after.delta, review.delta);
  assert.equal(after.conf, review.after);
});

test('a pace that would drop confidence into a worse band raises a dashboard warning', async () => {
  const e = await engine(51004);
  e.initUniverse();
  const u = e.T('Chicago Metropolitan');
  for (let i = 0; i < 6; i++) { e.delegateWeeklyDecisions(u); e.simWeek(true); }
  // 3-3 keeps the 8-win expectation reachable, so the pace warning (not the out-of-reach alert) applies.
  u.w = 3; u.l = 3; u.adminConfidence = 45;
  const m = outlook();
  assert.ok(m.projected < 40, `a 3-3 pace projects below Watched (got ${m.projected})`);
  const warning = e.adminHubItems(u).find(x => /On pace to slip/.test(x.main));
  assert.ok(warning, 'the administration warns before the review');
  assert.match(warning.sub, new RegExp(`confidence 45 → ${m.projected}`));
  u.w = 1; u.l = 5;
  const outOfReach = e.adminHubItems(u).find(x => /out of reach/.test(x.main));
  assert.ok(outOfReach, 'an unreachable expectation keeps the stronger alert');
  assert.match(outOfReach.sub, new RegExp(`→ ${outlook().projected} at this pace`), 'and says where confidence is heading');
});
