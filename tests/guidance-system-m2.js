const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadEngine } = require('../tools/harness');

async function setup(seed = 7701) {
  const e = loadEngine({ seed });
  e.setUserTeam('Chicago Metropolitan');
  await e.loadSchools();
  e.initUniverse();
  return e;
}

function stateFor(e, t) {
  assert.equal(typeof e.guidanceStateFor, 'function');
  return e.guidanceStateFor(t);
}

function recommendation(e, t) {
  e.createOpening(t, 'OC', 'M2 test opening', 'DEPARTED');
  return e.guidanceModel(t).items.find(x => x.meaning === 'staff_recommendation');
}

test('guidance state normalizes backward-compatibly and remains team-scoped', async () => {
  const e = await setup(7701);
  const a = e.T('Chicago Metropolitan');
  const b = e.universe.teams.find(t => t.id !== a.id);
  const save = { userTeam: a.name, universe: e.packUniverse(e.universe) };
  delete save.universe.guidanceState;
  e.installSave(save);
  assert.ok(stateFor(e, a));
  assert.ok(stateFor(e, b));
  assert.equal(e.universe.guidanceState.version, 1);
  assert.deepEqual(Object.keys(e.universe.guidanceState.teams[a.id]), ['familiarity', 'deferred']);
  assert.notStrictEqual(stateFor(e, a), stateFor(e, b), 'teams must not share snooze/familiarity state');

  const malformed = e.packUniverse(e.universe);
  malformed.guidanceState = { version: 0, snoozed: null, familiarity: { [a.id]: { bad: -4 } } };
  e.installSave({ userTeam: a.name, universe: malformed });
  assert.equal(e.universe.guidanceState.version, 1);
  assert.doesNotThrow(() => e.guidanceModel(a));
  assert.doesNotThrow(() => e.guidanceModel(b));

  const bounded = e.packUniverse(e.universe);
  const stamp = e.guidanceCalendarStamp(bounded);
  bounded.guidanceState = { version: 1, teams: {
    [a.id]: {
      familiarity: { staffing: 99, unknown: 2 },
      deferred: Object.fromEntries(Array.from({ length: 140 }, (_, i) =>
        [`guidance:${a.id}:${bounded.year}:staff-opening:test-${i}`, { stamp }]))
    },
    missing: { familiarity: { staffing: 3 }, deferred: {} }
  } };
  e.installSave({ userTeam: a.name, universe: bounded });
  const boundedState = stateFor(e, e.T(a.name));
  assert.equal(boundedState.familiarity.staffing, 3);
  assert.equal(Object.hasOwn(boundedState.familiarity, 'unknown'), false);
  assert.ok(Object.keys(boundedState.deferred).length <= 100);
  assert.equal(Object.hasOwn(e.universe.guidanceState.teams, 'missing'), false);
});

test('guidance evaluation stays pure while explicit familiarity actions are capped', async () => {
  const e = await setup(7702);
  const t = e.T('Chicago Metropolitan');
  const item = recommendation(e, t);
  assert.ok(item);
  assert.equal(typeof e.guidanceRecordFamiliarity, 'function');
  const before = JSON.stringify(e.universe);
  const rng = structuredClone(e.universe.rng);
  for (let i = 0; i < 4; i++) e.guidanceModel(t);
  assert.equal(JSON.stringify(e.universe), before);
  assert.deepEqual(e.universe.rng, rng);

  const first = e.guidanceRecordFamiliarity(item.category, t);
  assert.equal(typeof first, 'number', 'explicit familiarity action returns the new score');
  for (let i = 0; i < 20; i++) e.guidanceRecordFamiliarity(item.category, t);
  const state = stateFor(e, t);
  const value = state.familiarity?.[item.category];
  assert.ok(Number.isFinite(value));
  assert.ok(value >= first && value <= 3, 'familiarity increments but is capped at 3');
});

test('snooze is limited to optional guidance and only hides the current calendar stamp', async () => {
  const e = await setup(7703);
  const t = e.T('Chicago Metropolitan');
  const item = recommendation(e, t);
  assert.ok(item);
  assert.equal(typeof e.snoozeGuidance, 'function');
  assert.equal(typeof e.restoreGuidance, 'function');
  const beforeForecast = structuredClone(e.guidanceModel(t).forecast);
  assert.equal(e.snoozeGuidance(item.id, t), true);
  assert.equal(e.guidanceModel(t).items.some(x => x.id === item.id), false);
  assert.equal(e.guidanceModel(t).snoozed.some(x => x.id === item.id), true);
  assert.deepEqual(e.guidanceModel(t).forecast, beforeForecast,
    'snoozing presentation does not alter advancement truth');
  assert.equal(e.restoreGuidance(item.id, t), true);
  assert.equal(e.restoreGuidance(item.id, t), false, 'restore is idempotent');
  assert.equal(e.guidanceModel(t).items.some(x => x.id === item.id), true);

  const u = e.universe;
  const starter = e.importantStarters(t)[0];
  Object.assign(starter, { health: 70, wear: 76, injuryWeeks: 0, redshirtActive: false });
  const blocker = e.ensureWeeklyDecisions(t).find(x => x.type === 'INJURED_STARTER');
  assert.ok(blocker);
  const blockerItem = e.guidanceModel(t).items.find(x => x.occurrence === blocker.id);
  assert.equal(e.snoozeGuidance(blockerItem.id, t), false, 'must-resolve items cannot be snoozed');
  const due = e.guidanceModel(t).items.find(x => x.meaning === 'decision_due');
  assert.ok(due);
  assert.equal(e.snoozeGuidance(due.id, t), false, 'decision-due items cannot be snoozed');
  u.week++;
  assert.equal(e.guidanceModel(t).items.some(x => x.id === item.id), true, 'snooze expires next week');
});

test('snooze expires across offseason boundary stamps and season scope', async () => {
  const e = await setup(7706);
  const t = e.T('Chicago Metropolitan');
  const item = recommendation(e, t);
  e.universe.phase = 'complete';
  e.universe.offseason = e.makeOffseasonState(e.universe.year, 'review');
  const live = e.guidanceModel(t).items.find(x => x.id === item.id);
  assert.ok(live);
  assert.equal(e.snoozeGuidance(live.id, t), true);
  assert.equal(e.guidanceModel(t).snoozed.some(x => x.id === live.id), true);

  e.universe.offseason.phase = 'departures';
  assert.equal(e.guidanceModel(t).items.some(x => x.id === live.id), true);
  assert.equal(e.snoozeGuidance(live.id, t), true);

  e.universe.year++;
  assert.equal(e.guidanceModel(t).items.some(x => x.id === live.id), false,
    'the old season-scoped item expires rather than leaking into the new year');
});

test('snooze and familiarity survive pack/install round-trip without cross-team leakage', async () => {
  const e = await setup(7704);
  const t = e.T('Chicago Metropolitan');
  const item = recommendation(e, t);
  assert.equal(e.snoozeGuidance(item.id, t), true);
  e.guidanceRecordFamiliarity(item.category, t);
  const packed = structuredClone(e.packUniverse(e.universe));
  const fresh = await setup(7705);
  fresh.installSave({ userTeam: t.name, universe: packed });
  const restored = fresh.T(t.name);
  assert.equal(fresh.guidanceModel(restored).items.some(x => x.id === item.id), false);
  const other = fresh.universe.teams.find(x => x.id !== restored.id);
  assert.notDeepEqual(stateFor(fresh, restored), stateFor(fresh, other));
});

test('welcome-back summary is transient, live, and does not mutate state or RNG', async () => {
  const e = await setup(7705);
  const t = e.T('Chicago Metropolitan');
  const item = recommendation(e, t);
  assert.equal(typeof e.guidanceWelcomeBack, 'function');
  const savedAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const before = JSON.stringify(e.universe);
  const rng = structuredClone(e.universe.rng);
  const summary = e.guidanceWelcomeBack(savedAt, t);
  assert.ok(summary);
  assert.match(JSON.stringify(summary), /week|boundary|guidance|attention/i);
  assert.equal(JSON.stringify(e.universe), before);
  assert.deepEqual(e.universe.rng, rng);
  assert.equal(summary.items?.some(x => x.id === item.id) ?? true, true,
    'welcome-back counts must be derived from current live guidance');

  e.installSave({ userTeam: t.name, universe: e.packUniverse(e.universe), savedAt });
  const installedBefore = JSON.stringify(e.universe);
  assert.ok(e.guidanceReturnSummary());
  assert.equal(e.dismissGuidanceReturnSummary(), true);
  assert.equal(e.guidanceReturnSummary(), null);
  assert.equal(JSON.stringify(e.universe), installedBefore,
    'dismissing return context is presentation-only');

  e.installSave({
    userTeam: t.name,
    universe: e.packUniverse(e.universe),
    savedAt: new Date(Date.now() + 60_000).toISOString()
  });
  assert.equal(e.guidanceReturnSummary(), null, 'future timestamps cannot create a return card');
});
