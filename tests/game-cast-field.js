const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const {loadEngine} = require('../tools/harness');
const adapter = require('../game-engine-v2-adapter.js');
const attribution = require('../game-engine-v2-attribution.js');

async function detailedGame(seed) {
  const e = loadEngine({seed, fullRuntime: true});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  e.delegateWeeklyDecisions(e.T('Chicago Metropolitan'));
  e.simulateUserDetailed();
  const g = e.universe.gameArchive.find(x => x.drives?.length);
  assert.ok(g, 'a detailed game with drives was archived');
  return {e, g, rows: e.universe.playLogs?.[g.id]};
}
const F = () => globalThis.DynastyGameCastField;
const meta = g => ({home: {name: g.home.name}, away: {name: g.away.name}, names: Object.fromEntries(['home', 'away'].flatMap(s => (g.playerStats[s] || []).map(l => [l.id, l.name])))});

const P = (id, pos, skill = 75) => ({id, name: id, pos, trueNow: skill, speed: skill, power: skill, technique: skill, iq: skill, composure: skill});
function context(prefix) {
  const qb = P(`${prefix}-qb`, 'QB', 82), rb1 = P(`${prefix}-rb1`, 'RB', 84), rb2 = P(`${prefix}-rb2`, 'RB', 72), wr1 = P(`${prefix}-wr1`, 'WR', 85), wr2 = P(`${prefix}-wr2`, 'WR', 76), te = P(`${prefix}-te`, 'TE', 74);
  const defs = ['EDGE', 'DT', 'LB', 'CB', 'S'].map((pos, i) => P(`${prefix}-d${i}`, pos, 78 + i)), ol = ['OT', 'OG', 'C', 'OG', 'OT'].map((pos, i) => P(`${prefix}-ol${i}`, pos, 76 + i));
  return {teamName: prefix, qb, rushers: [{player: rb1, weight: 8}, {player: rb2, weight: 1}, {player: qb, weight: .7}], receivers: [{player: wr1, weight: 6}, {player: wr2, weight: 2}, {player: te, weight: 1}],
    defenders: defs.map((player, i) => ({player, weight: 1 + i * .08})), offensiveLine: ol.map(player => ({player, weight: 1})), kicker: P(`${prefix}-k`, 'K', 70), punter: P(`${prefix}-p`, 'P', 70)};
}

test('recording per-play actors leaves every stat line byte-identical', () => {
  // The digest was taken from the attribution module before per-play actors existed (v0.12.5).
  const h = crypto.createHash('sha256');
  for (let i = 0; i < 200; i++) {
    const seed = `cmp-${i}`;
    const s = adapter.simulateShadow({gameId: seed, seed, home: {id: 1, name: 'H'}, away: {id: 2, name: 'A'}, homeProfile: {overall: 80, offense: 82, defense: 78}, awayProfile: {overall: 77, offense: 76, defense: 78}, homeFieldRating: 2.4});
    const a = attribution.attributeGame(s.state, {home: context('H'), away: context('A')});
    h.update(JSON.stringify([a.playerStats, a.teamStats]));
    const snaps = s.state.events.filter(e => ['scrimmage', 'interception', 'fumble'].includes(e.type));
    for (const e of snaps) assert.ok(a.playActors[e.seq], `snap ${e.seq} has recorded actors`);
  }
  assert.equal(h.digest('hex'), 'd307c05645d1e2876c21801e126a5bb500acbf2dce48446b3ffb701146369f62');
});

test('a user game saves a compact play log that replays to the final score and drive results', async () => {
  const {g, rows} = await detailedGame(91001);
  assert.ok(Array.isArray(rows) && rows.length > 60, 'play log rows were stored for the user game');
  assert.ok(JSON.stringify(rows).length < 30000, 'a game stays compact');
  const tl = F().timeline(rows, meta(g));
  assert.deepEqual(tl.final, {home: g.score.home, away: g.score.away}, 'replaying the rows ends on the recorded score');
  const snaps = tl.steps.filter(s => ['run', 'pass', 'inc', 'sack', 'int', 'fumble'].includes(s.kind));
  const lines = g.drives.reduce((n, d) => n + d.plays, 0);
  assert.equal(snaps.length, lines, 'every archived snap has a replay step');
  const ids = new Set(['home', 'away'].flatMap(s => (g.playerStats[s] || []).map(l => l.id)));
  for (const s of snaps) {
    assert.ok(s.los >= 0 && s.los <= 100, 'snaps start on the field');
    for (const id of Object.values(s.actors || {})) if (typeof id === 'string') assert.ok(ids.has(id), `actor ${id} is a player in the box score`);
  }
  // Drive results line up with the archived Drives tab (a safety is credited to the drive it ended).
  const archived = g.drives.filter(d => d.result !== 'SAFETY' || d.plays).map(d => [d.side, d.result, d.points]);
  const replayed = tl.drives.filter(d => d.plays || d.result).map(d => [d.side, d.result || 'END', d.points]);
  assert.deepEqual(replayed, archived);
});

test('play logs default to empty for old saves and roll over with the season', async () => {
  const {e} = await detailedGame(91003);
  delete e.universe.playLogs;
  e.normalizeUniverse();
  assert.deepEqual(e.universe.playLogs, {}, 'an old save loads with an empty play-log map');
  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');
  assert.match(src, /universe\.lastDetailedGame=null;universe\.playLogs=\{\};/, 'the season rollover clears play logs');
});

test('big plays and key-plays mode', async () => {
  const {g, rows} = await detailedGame(91002);
  const tl = F().timeline(rows, meta(g));
  for (const s of tl.steps) {
    if (s.kind === 'int' || s.kind === 'fumble' || s.kind === 'score') assert.ok(s.big, `${s.kind} is a big play`);
    if (['run', 'pass'].includes(s.kind) && s.y >= 20 && s.end < 100) assert.ok(s.big, 'a 20-yard gain is a big play');
    if (s.kind === 'sack' && s.down >= 3) assert.ok(s.big, 'a third- or fourth-down sack is a big play');
  }
  const keyMs = tl.steps.filter(F().isKey).reduce((n, s) => {const d = F().durations(s); return n + d.pre * .5 + d.play + d.post}, 0) / F().keyRate(tl);
  assert.ok(keyMs < 30000, `key plays mode covers the game in ${Math.round(keyMs)}ms`);
  assert.equal(tl.steps.at(-1).card, 'Final');
});

test('the camera keeps the field on screen', () => {
  for (const [W, H] of [[358, 236], [812, 400]]) {
    const cam = F().camera(W, H, 60);
    const near = F().project(cam, 60, 0), far = F().project(cam, 60, 160 / 3);
    assert.ok(far.y < near.y, 'the far sideline is higher on screen');
    assert.ok(far.s < near.s, 'the far sideline is smaller');
    for (const y of [20, 80 / 3, 160 / 3 - 20]) {
      const p = F().project(cam, 60, y);
      assert.ok(p.y > 0 && p.y < H, `the hashes and middle of the field are framed on a ${W}px canvas`);
    }
  }
});
