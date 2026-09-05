const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('../tools/harness');

test('new universes default to locked Dynasty Mode', async () => {
  const e = loadEngine({ seed: 945 });
  await e.loadSchools();
  e.initUniverse();
  e.setUserTeam(e.universe.teams[0].name);
  e.renderControlMode();
  assert.equal(e.universe.mode, 'dynasty');
  assert.equal(e.commissionerMode(), false);
  assert.equal(e.$el('#userTeam').disabled, true);
  assert.equal(e.$el('#editPrestige').disabled, true);
  assert.equal(e.$el('#applyProgramEdit').disabled, true);
});

test('Commissioner Mode exposes program switching and institutional editing', async () => {
  const e = loadEngine({ seed: 946 });
  await e.loadSchools();
  e.initUniverse('commissioner');
  e.setUserTeam(e.universe.teams[0].name);
  e.renderControlMode();
  assert.equal(e.universe.mode, 'commissioner');
  assert.equal(e.commissionerMode(), true);
  assert.equal(e.$el('#userTeam').disabled, false);
  assert.equal(e.$el('#editPrestige').disabled, false);
  assert.equal(e.$el('#applyProgramEdit').disabled, false);
});

test('control mode is part of the portable universe', async () => {
  const e = loadEngine({ seed: 947 });
  await e.loadSchools();
  e.initUniverse('commissioner');
  assert.equal(e.packUniverse(e.universe).mode, 'commissioner');
});

test('ordinary legacy saves migrate to Dynasty Mode', async () => {
  const e = loadEngine({ seed: 948 });
  await e.loadSchools();
  e.initUniverse();
  const userTeam = e.universe.teams[0].name;
  const legacy = { userTeam, universe: e.packUniverse(e.universe) };
  delete legacy.universe.mode;
  e.installSave(legacy);
  assert.equal(e.universe.mode, 'dynasty');
  assert.equal(e.commissionerMode(), false);
});

test('legacy saves with evidence of direct switching retain commissioner controls', async () => {
  const e = loadEngine({ seed: 949 });
  await e.loadSchools();
  e.initUniverse();
  const originalTeam = e.universe.teams[0].name;
  const switchedTeam = e.universe.teams[1].name;
  e.universe.tenure = { startYear: e.universe.year, school: originalTeam, seasons: [], ended: null, closed: false };
  const legacy = { userTeam: switchedTeam, universe: e.packUniverse(e.universe) };
  delete legacy.universe.mode;
  e.installSave(legacy);
  assert.equal(e.universe.mode, 'commissioner');
  assert.equal(e.commissionerMode(), true);
});
