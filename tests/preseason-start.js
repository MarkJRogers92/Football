const test = require('node:test');
const assert = require('node:assert/strict');
const {IDBFactory} = require('fake-indexeddb');
const {loadEngine} = require('../tools/harness');

async function engine(seed, {storage = false} = {}) {
  const e = loadEngine({seed, indexedDB: storage ? new IDBFactory() : undefined});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  return e;
}

test('the production creation path opens a real preseason while low-level fixtures remain regular', async () => {
  const e = await engine(12001);
  e.initUniverse();
  assert.equal(e.universe.phase, 'regular', 'simulation fixtures keep their established default');

  e.createNewDynasty();
  const u = e.universe;
  assert.equal(u.year, 2027);
  assert.equal(u.week, 0);
  assert.equal(u.phase, 'preseason');
  assert.equal(e.openingPreseason(), true);
  assert.equal(u.schedule.length, 12);
  assert.ok(u.schedule.every(week => week.length && week.every(game => !game.played)));
  assert.equal(e.findUserGame(), null, 'the generated Week 1 matchup is not playable yet');
  assert.equal(e.weeklyPlan(e.T('Chicago Metropolitan')).items[0].key, 'begin');
});

test('preseason blocks every football path and Begin Season preserves the generated world', async () => {
  const e = await engine(12002);
  e.createNewDynasty();
  const u = e.universe, team = e.T('Chicago Metropolitan');
  const position = Object.keys(team.depthChart)[0], depth = team.depthChart[position];
  if (depth.length > 1) [depth[0], depth[1]] = [depth[1], depth[0]];
  const redshirt = team.roster.find(p => !p.redshirtUsed) || team.roster[0];
  const redshirtChoice = !redshirt.redshirtActive;
  redshirt.redshirtActive = redshirtChoice;
  const recruit = u.recruits[0];
  recruit.targeted = true;
  team.trainingFocus = 'Speed & Explosion';

  const beforeBlocked = JSON.stringify(e.packUniverse(u));
  e.simWeek();
  e.simSeason();
  e.simulateUserDetailed();
  e.watchUserDetailed();
  assert.equal(JSON.stringify(e.packUniverse(u)), beforeBlocked, 'preseason progression attempts are complete no-ops');

  const schedule = JSON.stringify(u.schedule), recruits = JSON.stringify(u.recruits), rng = JSON.stringify(u.rng);
  const depthAfterSetup = [...team.depthChart[position]];
  assert.equal(e.beginSeason(), true);
  assert.equal(u.phase, 'regular');
  assert.equal(u.week, 0);
  assert.equal(JSON.stringify(u.schedule), schedule);
  assert.equal(JSON.stringify(u.recruits), recruits);
  assert.equal(JSON.stringify(u.rng), rng, 'crossing the boundary consumes no gameplay RNG');
  assert.deepEqual(team.depthChart[position], depthAfterSetup);
  assert.equal(redshirt.redshirtActive, redshirtChoice);
  assert.equal(team.trainingFocus, 'Speed & Explosion');
  assert.ok(e.findUserGame(), 'the already-generated Week 1 matchup becomes playable');
  assert.ok(u.schedule.every(week => week.every(game => !game.played)));

  const afterFirst = JSON.stringify(e.packUniverse(u));
  assert.equal(e.beginSeason(), false, 'a second invocation is safely rejected');
  assert.equal(JSON.stringify(e.packUniverse(u)), afterFirst);
  await e.yieldToUserAction();
});

test('preseason survives browser save and portable export while legacy phases normalize safely', async () => {
  const e = await engine(12003, {storage: true});
  e.createNewDynasty();
  const team = e.T('Chicago Metropolitan'), recruit = e.universe.recruits[0];
  team.trainingFocus = 'Strength & Mass';
  recruit.targeted = true;

  await e.saveBrowser();
  e.universe.phase = 'regular';
  team.trainingFocus = 'Balanced';
  recruit.targeted = false;
  await e.loadBrowser();
  assert.equal(e.universe.phase, 'preseason');
  assert.equal(e.T('Chicago Metropolitan').trainingFocus, 'Strength & Mass');
  assert.equal(e.universe.recruits[0].targeted, true);

  let exported;
  global.URL.createObjectURL = blob => { exported = JSON.parse(blob.parts.join('')); return 'blob:preseason'; };
  await e.exportSave();
  assert.equal(exported.universe.phase, 'preseason');
  e.universe.phase = 'regular';
  global.FileReader = class { readAsText(file) { this.result = file; queueMicrotask(() => this.onload()); } };
  await e.importSave(JSON.stringify(exported));
  assert.equal(e.universe.phase, 'preseason');
  assert.equal(e.T('Chicago Metropolitan').trainingFocus, 'Strength & Mass');
  assert.equal(e.universe.recruits[0].targeted, true);

  const legacyRegular = {userTeam: 'Chicago Metropolitan', universe: e.packUniverse(e.universe)};
  legacyRegular.universe.phase = 'regular';
  legacyRegular.universe.week = 0;
  e.installSave(legacyRegular);
  assert.equal(e.universe.phase, 'regular', 'an old regular Week 0 save is not reclassified');

  const missingPhase = {userTeam: 'Chicago Metropolitan', universe: e.packUniverse(e.universe)};
  delete missingPhase.universe.phase;
  e.installSave(missingPhase);
  assert.equal(e.universe.phase, 'regular', 'a save without a calendar phase receives the legacy-safe default');

  const completed = {userTeam: 'Chicago Metropolitan', universe: e.packUniverse(e.universe)};
  completed.universe.phase = 'complete';
  completed.universe.offseason = e.makeOffseasonState(completed.universe.year, 'portal', ['review', 'departures', 'signing']);
  e.installSave(completed);
  assert.equal(e.universe.phase, 'complete');
  assert.equal(e.universe.offseason.phase, 'portal');
  assert.deepEqual(e.universe.offseason.completed, ['review', 'departures', 'signing']);
});
