const test = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('../tools/harness');

async function fresh(seed) {
  const e = loadEngine({ seed });
  await e.loadSchools();
  e.initUniverse();
  e.setUserTeam(e.universe.teams[0].name);
  return e;
}

function legacySave(e, phase, development = {}) {
  const universe = e.packUniverse(e.universe);
  delete universe.offseason;
  universe.phase = phase;
  universe.developmentState = {
    year: universe.year,
    springRun: false,
    fallRun: false,
    springReport: [],
    fallReport: [],
    battles: [],
    ...development
  };
  return { userTeam: universe.teams[0].name, universe };
}

test('new dynasties begin with a normalized preseason checkpoint', async () => {
  const e = await fresh(9461);
  assert.deepEqual(e.universe.offseason, {
    year: 2027,
    phase: 'preseason',
    completed: ['preseason'],
    reports: {}
  });
});

test('legacy in-season and postseason saves retain their application phase', async () => {
  const e = await fresh(9462);
  for (const phase of ['regular', 'confReady', 'bowlReady', 'playoffReady']) {
    e.installSave(legacySave(e, phase));
    assert.equal(e.universe.phase, phase);
    assert.equal(e.universe.offseason.phase, 'preseason');
    assert.deepEqual(e.universe.offseason.completed, ['preseason']);
  }
});

test('a legacy completed season starts at review without replaying work', async () => {
  const e = await fresh(9463);
  e.installSave(legacySave(e, 'complete'));
  assert.equal(e.universe.offseason.year, e.universe.year);
  assert.equal(e.universe.offseason.phase, 'review');
  assert.deepEqual(e.universe.offseason.completed, []);
});

test('legacy camp flags are retained as completed migration checkpoints', async () => {
  const e = await fresh(9464);
  e.installSave(legacySave(e, 'complete', { springRun: true, fallRun: true }));
  assert.equal(e.universe.offseason.phase, 'review');
  assert.deepEqual(e.universe.offseason.completed, ['spring', 'fall']);
  assert.equal(e.universe.offseason.reports.migration.legacyDevelopment, true);
  const once = JSON.stringify(e.universe.offseason);
  e.normalizeOffseasonState();
  assert.equal(JSON.stringify(e.universe.offseason), once, 'normalization must be idempotent');
});

test('stored offseason state is sanitized without discarding valid progress', async () => {
  const e = await fresh(9465);
  const save = { userTeam: e.universe.teams[0].name, universe: e.packUniverse(e.universe) };
  save.universe.offseason = {
    year: save.universe.year,
    phase: 'portal',
    completed: ['review', 'review', 'not-a-phase'],
    reports: []
  };
  e.installSave(save);
  assert.equal(e.universe.offseason.phase, 'portal');
  assert.deepEqual(e.universe.offseason.completed, ['review']);
  assert.deepEqual(e.universe.offseason.reports, {});
});

test('the new calendar removes departures before incoming players attend camp', async () => {
  const e = await fresh(9466);
  const u = e.universe, team = u.teams[0];
  for (const t of u.teams) {
    t.w = 10;
    t.l = 2;
    t.adminConfidence = 90;
  }
  const departing = team.roster.find(p => p.year === 'SR') || team.roster[0];
  departing.year = 'SR';
  departing.eligibilityUsed = 3;
  departing.redshirtActive = false;
  const recruit = u.recruits.find(r => !r.committed);
  assert.equal(e.commitRecruit(recruit, team.name), true);
  const incomingName = recruit.name;
  u.phase = 'complete';
  u.champion = u.teams[1].name;
  u.offseason = e.makeOffseasonState(u.year, 'review');

  e.runOffseason();
  assert.equal(u.offseason.phase, 'departures');
  e.runOffseason();
  assert.equal(u.offseason.phase, 'signing');
  assert.equal(team.roster.some(p => p.id === departing.id), false);
  e.runOffseason();
  assert.equal(u.offseason.phase, 'portal');
  assert.equal(team.roster.some(p => p.name === incomingName), true);
  e.runOffseason();
  assert.equal(u.offseason.phase, 'spring');

  e.runSpringCamp();
  assert.equal(u.offseason.phase, 'fall');
  assert.ok(u.developmentState.springReport.some(p => p.name === incomingName));
  e.runFallCamp();
  assert.equal(u.offseason.phase, 'preseason');
  assert.ok(u.developmentState.fallReport.some(p => p.name === incomingName));

  const year = u.year;
  e.runOffseason();
  assert.equal(u.year, year + 1);
  assert.equal(u.phase, 'regular');
  assert.deepEqual(u.offseason.completed, ['preseason']);
});

test('every phase boundary survives reload and repeated actions stay idempotent', async () => {
  const e = await fresh(9467);
  for (const t of e.universe.teams) {
    t.w = 10;
    t.l = 2;
    t.adminConfidence = 95;
  }
  e.universe.phase = 'complete';
  e.universe.champion = e.universe.teams[1].name;
  e.universe.offseason = e.makeOffseasonState(e.universe.year, 'review');
  const reload = () => {
    const name = e.universe.teams[0].name;
    const portable = JSON.parse(JSON.stringify({ userTeam: name, universe: e.packUniverse(e.universe) }));
    e.installSave(portable);
    return e.universe;
  };

  e.runOffseason();
  let u = reload();
  assert.equal(u.offseason.phase, 'departures');
  const archived = u.playerArchive.length, history = u.history.length;
  e.offseasonReview();
  assert.equal(u.playerArchive.length, archived);
  assert.equal(u.history.length, history);
  assert.equal(u.offseason.phase, 'departures');

  e.runOffseason();
  u = reload();
  assert.equal(u.offseason.phase, 'signing');
  const afterDepartures = u.teams.map(t => t.roster.map(p => p.id).join(','));
  e.offseasonDepartures();
  assert.deepEqual(u.teams.map(t => t.roster.map(p => p.id).join(',')), afterDepartures);
  assert.equal(u.offseason.phase, 'signing');

  e.runOffseason();
  u = reload();
  assert.equal(u.offseason.phase, 'portal');
  const afterSigning = u.teams.reduce((n, t) => n + t.roster.length, 0);
  e.offseasonEnrollment();
  assert.equal(u.teams.reduce((n, t) => n + t.roster.length, 0), afterSigning);
  assert.equal(u.offseason.phase, 'portal');

  e.runOffseason();
  u = reload();
  assert.equal(u.offseason.phase, 'spring');
  const draftRows = (u.draftHistory[u.year] || []).length;
  e.offseasonPortal();
  assert.equal((u.draftHistory[u.year] || []).length, draftRows);
  assert.equal(u.offseason.phase, 'spring');

  e.runSpringCamp();
  u = reload();
  assert.equal(u.offseason.phase, 'fall');
  const springState = JSON.stringify(u.developmentState.springReport);
  e.runSpringCamp();
  assert.equal(JSON.stringify(u.developmentState.springReport), springState);

  e.runFallCamp();
  u = reload();
  assert.equal(u.offseason.phase, 'preseason');
  const fallState = JSON.stringify(u.developmentState.fallReport);
  e.runFallCamp();
  assert.equal(JSON.stringify(u.developmentState.fallReport), fallState);

  const year = u.year;
  e.runOffseason();
  u = reload();
  assert.equal(u.year, year + 1);
  assert.equal(u.phase, 'regular');
  assert.deepEqual(u.offseason, { year: year + 1, phase: 'preseason', completed: ['preseason'], reports: {} });
});
