const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('../tools/harness');

async function setup(seed = 7601) {
  const e = loadEngine({ seed });
  e.setUserTeam('Chicago Metropolitan');
  await e.loadSchools();
  e.initUniverse();
  return e;
}

test('a quiet valid week stays ready to advance', async () => {
  const e = await setup();
  const model = e.guidanceModel();
  assert.equal(e.guidanceActionEligibility('advance-week').allowed, true);
  assert.equal(e.guidanceActionEligibility('detailed-game').allowed, true);
  assert.equal(model.forecast.key, 'advance-week');
  assert.equal(model.forecast.status, 'ready');
  assert.equal(model.items.some(x => x.meaning === 'must_resolve'), false);
  assert.equal(model.quiet, true, 'optional recommendations do not make the week noisy');
});

test('a stored Coach’s Desk blocker is represented and gates ordinary play', async () => {
  const e = await setup(7602);
  const u = e.universe;
  const t = e.T('Chicago Metropolitan');
  const p = e.importantStarters(t)[0];
  Object.assign(p, { health: 70, wear: 76, injuryWeeks: 0, redshirtActive: false });
  const decision = e.ensureWeeklyDecisions(t).find(x => x.type === 'INJURED_STARTER');
  assert.ok(decision, 'fixture should create a real injury decision');

  const model = e.guidanceModel(t);
  const item = model.items.find(x => x.occurrence === decision.id);
  assert.ok(item);
  assert.equal(item.meaning, 'must_resolve');
  assert.equal(item.category, 'coach_desk');
  assert.equal(item.destination.tab, 'dashboard');
  assert.equal(e.guidanceActionEligibility('advance-week', t).allowed, false);
  assert.equal(e.guidanceActionEligibility('detailed-game', t).allowed, false);
  assert.equal(e.guidanceActionEligibility('simulate-season', t).allowed, true,
    'season simulation may use its existing delegation behavior');
  assert.equal(model.forecast.status, 'blocked');

  assert.equal(e.resolveWeeklyDecision(decision.id, 'sit'), true);
  // The same fixture also creates an optional gameplan card. Resolve it through
  // the normal decision API so the blocker test isolates the real action gate.
  for (const remaining of e.guidanceStoredDecisions(t)) {
    assert.equal(e.resolveWeeklyDecision(remaining.id, 'standard'), true);
  }
  assert.equal(e.guidanceStoredDecisions(t).length, 0);
  assert.equal(e.guidanceModel(t).items.some(x => x.occurrence === decision.id), false);
  assert.equal(e.guidanceActionEligibility('advance-week', t).allowed, true);
  assert.equal(u.week, 0, 'resolving a decision does not advance time');
});

test('a decision-due recommendation warns without becoming a blocker', async () => {
  const e = await setup(7603);
  const t = e.T('Chicago Metropolitan');
  const gameplan = e.weeklyGameplanDecision(t);
  assert.ok(gameplan, 'the opening week has a real opponent gameplan decision');
  t.gameplan = undefined;
  e.universe.weeklyDecisions = [gameplan];
  const model = e.guidanceModel(t);
  const item = model.items.find(x => x.occurrence === gameplan.id);
  assert.equal(item.meaning, 'decision_due');
  assert.equal(e.guidanceActionEligibility('advance-week', t).allowed, true);
  assert.equal(model.forecast.status, 'caution');
});

test('a completed detailed game retires its optional gameplan guidance', async () => {
  const e = await setup(7610);
  const t = e.T('Chicago Metropolitan');
  const game = e.findUserGame();
  const gameplan = e.weeklyGameplanDecision(t);
  assert.ok(gameplan);
  e.universe.weeklyDecisions = [gameplan];
  assert.equal(e.guidanceModel(t).forecast.status, 'caution');

  e.simulateUserDetailed();

  assert.equal(game.played, true);
  assert.equal(gameplan.resolved, false, 'playing with the default does not rewrite the stored choice');
  assert.equal(e.guidanceStoredDecisions(t).some(x => x.id === gameplan.id), false);
  assert.equal(e.guidanceModel(t).items.some(x => x.occurrence === gameplan.id), false);
  assert.equal(e.guidanceModel(t).plan.some(x => x.key === 'gameplan'), false);
  assert.equal(e.guidanceModel(t).forecast.status, 'ready');
});

test('scholarship overage warns at playoff recruiting finalization', async () => {
  const e = await setup(7611);
  const t = e.T('Chicago Metropolitan');
  e.universe.recruitClassCounts[t.name] = e.scholarshipCapacity(t) + 2;
  e.universe.phase = 'playoffReady';

  const model = e.guidanceModel(t);
  const item = model.items.find(x => x.category === 'roster_management');
  assert.ok(item);
  assert.equal(item.boundary, 'Playoff completion');
  assert.equal(item.boundaryKey, 'playoff');
  assert.match(item.consequence, /finalizes recruiting/);
  assert.equal(model.forecast.key, 'playoff');
  assert.equal(model.forecast.status, 'caution');
});

test('season review may run before a pending career choice blocks departures', async () => {
  const e = await setup(7612);
  const u = e.universe;
  u.phase = 'complete';
  u.offseason = e.makeOffseasonState(u.year, 'review');
  u.jobOffers = [{ schoolId: u.teams[1].id }];

  assert.equal(e.guidanceActionEligibility('offseason-phase').allowed, true);
  assert.equal(e.guidanceModel().forecast.status, 'ready');

  u.offseason.phase = 'departures';
  assert.equal(e.guidanceActionEligibility('offseason-phase').allowed, false);
  assert.equal(e.guidanceModel().forecast.status, 'blocked');
});

test('forecast describes the same boundary that a normal advance reaches', async () => {
  const e = await setup(7604);
  const u = e.universe;
  const before = e.guidanceNextBoundary();
  assert.equal(before.key, 'advance-week');
  assert.match(before.title, /Complete Week 1/);
  e.simWeek();
  assert.equal(u.week, 1);
  const after = e.guidanceNextBoundary();
  assert.equal(after.key, 'advance-week');
  assert.match(after.title, /Complete Week 2/);
  assert.equal(e.guidanceModel().forecast.key, after.key);
});

test('repeated guidance evaluation does not mutate gameplay state or consume RNG', async () => {
  const e = await setup(7605);
  const before = JSON.stringify(e.universe);
  const rngBefore = structuredClone(e.universe.rng);
  for (let i = 0; i < 5; i++) {
    e.guidanceModel();
    e.guidanceActionBlockers('advance-week');
    e.guidanceActionEligibility('advance-week');
    e.guidanceNextBoundary();
    e.guidanceStoredDecisions();
  }
  assert.equal(JSON.stringify(e.universe), before);
  assert.deepEqual(e.universe.rng, rngBefore);
});

test('legacy saves normalize without inventing stale guidance conditions', async () => {
  const e = await setup(7606);
  const save = { userTeam: 'Chicago Metropolitan', universe: e.packUniverse(e.universe) };
  delete save.universe.weeklyDecisions;
  delete save.universe.guidance;
  e.installSave(save);
  assert.deepEqual(e.guidanceStoredDecisions(), []);
  assert.equal(e.guidanceModel().items.some(x => x.meaning === 'must_resolve'), false);
  assert.equal(e.guidanceActionEligibility('advance-week').allowed, true);
});

test('removed decision targets remain safe and identifiable without resurrecting a player', async () => {
  const e = await setup(7607);
  const t = e.T('Chicago Metropolitan');
  const missing = {
    id: 'WD_removed_target', season: e.universe.year, week: e.universe.week,
    teamId: t.id, type: 'PLAYER_ROLE_REQUEST', source: 'PLAYER', subjectId: 'gone-player',
    playerId: 'gone-player', title: 'A removed player needs a role decision',
    summary: 'The original target is no longer on this roster.', resolved: false, priority: 80,
  };
  e.universe.weeklyDecisions = [missing];
  const item = e.guidanceModel(t).items.find(x => x.occurrence === missing.id);
  assert.ok(item);
  assert.deepEqual(item.affectedEntity, { type: 'player', id: 'gone-player', label: missing.title });
  assert.equal(t.roster.some(p => p.id === 'gone-player'), false);
});

test('guidance output does not expose hidden ratings or unrolled outcomes', async () => {
  const e = await setup(7608);
  const output = e.guidanceModel();
  const keys = new Set();
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) { keys.add(key); walk(child); }
  };
  walk(output);
  for (const forbidden of ['trueNow', 'upside', 'scoutUp', 'projection', 'outcome', 'pick', 'round']) {
    assert.equal(keys.has(forbidden), false, `guidance must not expose ${forbidden}`);
  }
  assert.doesNotMatch(JSON.stringify(output), /trueNow|scoutUp|unrolled|future outcome/i);
});

test('preseason remains a real opening boundary with existing setup intact', async () => {
  const e = await setup(7609);
  const u = e.universe;
  u.phase = 'preseason';
  u.week = 0;
  const beforeSchedule = JSON.stringify(u.schedule);
  const forecast = e.guidanceNextBoundary();
  assert.equal(forecast.key, 'begin-season');
  assert.equal(e.guidanceActionEligibility('begin-season').allowed, true);
  assert.match(forecast.title, /Week 1/);
  assert.equal(JSON.stringify(u.schedule), beforeSchedule);
});
