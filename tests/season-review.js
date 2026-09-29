const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function completedSeason(seed) {
  const e = loadEngine({seed, fullRuntime: true});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  assert.equal(globalThis.DynastySeasonReview.model(), null, 'no review before the season is complete');
  e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
  return e;
}

test('the season review summarizes the completed season from stored results', async () => {
  const e = await completedSeason(41001);
  const u = e.T('Chicago Metropolitan');
  const m = globalThis.DynastySeasonReview.model();
  assert.ok(m, 'review appears once the postseason is complete');
  const archived = e.universe.gameArchive.filter(g => g.season === e.universe.year && (g.home.name === u.name || g.away.name === u.name));
  assert.equal(m.games.length, archived.length, 'every game of the season is in the results strip');
  assert.equal(m.games.filter(g => g.win).length, u.w);
  assert.equal(m.games.filter(g => !g.win).length, u.l);
  assert.equal(m.record, `${u.w}–${u.l}`);
  assert.ok(m.moments.length >= 1 && m.moments.length <= 3);
  assert.equal(new Set(m.moments.map(x => x.gameId)).size, m.moments.length, 'no game is used for two moments');
  assert.ok(m.leaders.some(x => x.label === 'Passing'), 'team leaders include a passer');
  for (const leader of m.leaders) assert.ok(u.roster.some(p => p.id === leader.playerId), `${leader.name} is on the roster`);
  const last = m.games.filter(g => g.postseason).at(-1);
  if (e.universe.champion === u.name) assert.equal(m.outcome, 'National champions');
  else if (last) assert.equal(m.outcome, `${last.win ? 'Won the' : 'Lost in the'} ${last.label}`);
  const recruiting = m.goals.find(g => g.label.startsWith('Sign'));
  if (recruiting) assert.notEqual(recruiting.state, 'failed', 'recruiting goals stay open until signing day');
});

test('the review closes once departures change the roster', async () => {
  const e = await completedSeason(41002);
  e.runOffseason();
  assert.equal(e.normalizeOffseasonState().phase, 'departures');
  assert.ok(globalThis.DynastySeasonReview.model(), 'still shown after the season review runs');
  e.runOffseason();
  assert.notEqual(e.normalizeOffseasonState().phase, 'departures');
  assert.equal(globalThis.DynastySeasonReview.model(), null, 'hidden once departures are processed');
});
