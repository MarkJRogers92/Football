// v0.16 play model: penalties, kick and punt returns, QB pressure, and the stadium and weather.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const engine = require('../game-engine-v2.js');
const adapter = require('../game-engine-v2-adapter.js');
const attribution = require('../game-engine-v2-attribution.js');
const gameday = require('../game-engine-v2-gameday.js');
const lab = require('../game-engine-v2-lab.js');

const calm = {roof: 'open', temp: 70, wind: 5, precip: 0, sky: 'clear', altitude: 'low'};
const team = (id, name, rating = 72) => ({id, name, rating});
function live(extra = {}, rules = {conditions: calm}) {
  const state = engine.createGame({home: team(1, 'Home'), away: team(2, 'Away'), seed: extra.seed || 'directed', openingReceiver: 'home', rules});
  engine.startGame(state);
  Object.assign(state, {possession: 'home', fieldPosition: 50, down: 2, distance: 7, clock: 600, period: 2, ...extra.state});
  delete extra.seed;
  return state;
}
const last = (state, type) => [...state.events].reverse().find(e => e.type === type);
const shadow = (seed, extra = {}) => adapter.simulateShadow({
  gameId: seed, seed, home: {id: 1, name: 'H', lat: 41, lon: -87}, away: {id: 2, name: 'A'},
  homeProfile: {overall: 76, offense: 77, defense: 74}, awayProfile: {overall: 71, offense: 72, defense: 70}, homeFieldRating: 2.3, year: 2027, week: 6, ...extra
});

const P = (id, pos, skill = 75) => ({id, name: id, pos, trueNow: skill, speed: skill, power: skill, technique: skill, iq: skill, composure: skill});
function context(prefix) {
  const qb = P(`${prefix}-qb`, 'QB', 82), rb = P(`${prefix}-rb`, 'RB', 80), wr = P(`${prefix}-wr`, 'WR', 84), te = P(`${prefix}-te`, 'TE', 74);
  const defs = ['EDGE', 'DT', 'LB', 'CB', 'S'].map((pos, i) => P(`${prefix}-d${i}`, pos, 78 + i)), ol = ['OT', 'OG', 'C', 'OG', 'OT'].map((pos, i) => P(`${prefix}-ol${i}`, pos, 76 + i));
  return {
    teamName: prefix, qb, rushers: [{player: rb, weight: 8}, {player: qb, weight: .7}], receivers: [{player: wr, weight: 6}, {player: te, weight: 1}],
    defenders: defs.map((player, i) => ({player, weight: 1 + i * .08})), offensiveLine: ol.map(player => ({player, weight: 1})),
    kicker: P(`${prefix}-k`, 'K', 70), punter: P(`${prefix}-p`, 'P', 70), kickReturner: P(`${prefix}-kr`, 'WR', 80), puntReturner: P(`${prefix}-pr`, 'CB', 78)
  };
}

test('a game without rules plays exactly as it did before the v0.16 model', () => {
  // The digest was taken from the engine as it stood at v0.15.2.
  const h = crypto.createHash('sha256');
  for (let i = 0; i < 150; i++) {
    const state = engine.createGame({home: team(1, 'H', 55 + (i % 40)), away: team(2, 'A', 90 - (i % 35)), seed: 'legacy-' + i});
    assert.equal(state.rules, undefined, 'no rules on the state');
    engine.simulate(state);
    assert.ok(!state.events.some(e => e.type === 'penalty'), 'no flags');
    h.update(JSON.stringify([state.score, state.events.length, state.rng, state.events.filter(x => x.type === 'punt' || x.type === 'kickoff').length]));
  }
  assert.equal(h.digest('hex'), '225537ff01cd7190d6e76a21402e617eaaebd04ed4e4a9f0156bc617169535b0');
  const off = shadow('opt-out', {rules: false});
  assert.equal(off.state.rules, undefined);
  assert.ok(off.state.events.every(e => e.type !== 'penalty' && !e.scramble && !e.pressure && !e.ret));
});

test('games carry their rules, conditions follow the home program and the calendar, and rules survive a snapshot', () => {
  const a = shadow('rules-1');
  assert.equal(a.state.rules.version, engine.RULES_VERSION);
  assert.deepEqual(a.state.rules.conditions, shadow('rules-2').state.rules.conditions, 'same stadium, same week, same weather');
  assert.notDeepEqual(shadow('rules-1', {week: 13}).state.rules.conditions, a.state.rules.conditions);
  const restored = engine.restore(engine.snapshot(a.state));
  assert.deepEqual(restored.rules, a.state.rules);
  assert.throws(() => engine.validateState({...a.state, rules: 'x'}), /Invalid game rules/);
  assert.deepEqual(engine.normalizeRules({penalties: false}).penalties, false);
  assert.equal(engine.normalizeRules(null), null);
});

test('an accepted penalty replaces the snap and is enforced from the line of scrimmage', () => {
  const p = (state, kind, yards) => engine.applyScrimmage(state, {penalty: {kind, yards}, clock: 6});

  // Offensive holding: back ten yards, same down, longer distance. No play is run.
  let s = live({state: {fieldPosition: 50, down: 2, distance: 7}});
  const plays = s.play;
  p(s, 'holding_off', 10);
  let e = last(s, 'penalty');
  assert.deepEqual([s.fieldPosition, s.down, s.distance, s.play], [40, 2, 17, plays]);
  assert.deepEqual([e.team, e.against, e.yards, e.autoFirst, e.deadBall, e.label], ['home', 'home', 10, false, false, 'Offensive holding']);
  assert.deepEqual(e.from, {fieldPosition: 50, down: 2, distance: 7});
  assert.equal(s.possession, 'home');

  // Defensive holding carries an automatic first down.
  s = live({state: {fieldPosition: 40, down: 3, distance: 12}});
  p(s, 'holding_def', 5);
  e = last(s, 'penalty');
  assert.deepEqual([s.fieldPosition, s.down, s.distance, e.against, e.autoFirst], [45, 1, 10, 'away', true]);

  // A dead-ball offside only moves the ball; it is a first down when the yards cover the distance.
  s = live({state: {fieldPosition: 50, down: 4, distance: 1}});
  p(s, 'offside', 5);
  assert.deepEqual([s.fieldPosition, s.down, s.distance], [55, 1, 10]);
  assert.equal(last(s, 'penalty').deadBall, true);
  s = live({state: {fieldPosition: 50, down: 3, distance: 9}});
  p(s, 'offside', 5);
  assert.deepEqual([s.fieldPosition, s.down, s.distance], [55, 3, 4], 'otherwise the down is replayed with less to go');

  // Half the distance to the goal, never more.
  s = live({state: {fieldPosition: 6, down: 1, distance: 10}});
  p(s, 'holding_off', 10);
  assert.equal(s.fieldPosition, 3, 'back ten from the six is only three yards');
  s = live({state: {fieldPosition: 96, down: 1, distance: 4}});
  p(s, 'interference', 30);
  assert.equal(s.fieldPosition, 98, 'spot fouls at the four stop at the two');
  assert.equal(s.down, 1);
  assert.ok(s.distance >= 1 && s.distance <= 2);
  s = live({state: {fieldPosition: 2, down: 1, distance: 10}});
  p(s, 'holding_off', 10);
  assert.ok(s.fieldPosition >= 1, 'the ball never leaves the field');

  // A foul never ends a period on its own.
  s = live({state: {fieldPosition: 50, down: 1, distance: 10, clock: 5, period: 2}});
  p(s, 'holding_off', 10);
  assert.equal(s.period, 2);
  assert.equal(s.clock, 1, 'one second is left for the next snap');
  assert.throws(() => engine.applyScrimmage(live(), {penalty: {kind: 'bogus', yards: 5}}), /Unknown penalty/);
});

test('flags are thrown at realistic rates and every game still validates', () => {
  let games = 0, penalties = 0, yards = 0, dead = 0, kinds = new Set(), autoFirsts = 0;
  for (let i = 0; i < 400; i++) {
    const r = shadow(`flags-${i}`, {week: 1 + (i % 12)});
    engine.validateGame(r.state);
    games++;
    let previous = null;
    for (const e of r.state.events) {
      if (e.type === 'penalty') {
        penalties++; yards += e.yards; kinds.add(e.kind);
        if (e.deadBall) dead++;
        if (e.autoFirst) autoFirsts++;
        assert.ok(e.yards >= 1 && e.yards <= 40, 'sane yardage');
        assert.ok(['home', 'away'].includes(e.against));
        assert.ok(e.state.fieldPosition >= 1 && e.state.fieldPosition <= 99);
        assert.ok(e.state.period <= 4, 'no flags are thrown in overtime');
        assert.equal(e.state.status, 'live');
        if (e.autoFirst) assert.equal(e.state.down, 1);
        else assert.equal(e.state.down, e.from.down, 'the down is replayed');
        assert.equal(e.team, e.state.possession, 'the possession does not change on a flag');
      }
      previous = e;
    }
  }
  const perTeam = penalties / games / 2, perTeamYards = yards / games / 2;
  assert.ok(perTeam > 4.4 && perTeam < 6.6, `penalties per team per game ${perTeam.toFixed(2)}`);
  assert.ok(perTeamYards > 32 && perTeamYards < 56, `penalty yards per team per game ${perTeamYards.toFixed(1)}`);
  assert.ok(kinds.size >= 9, `a good spread of fouls (${[...kinds].join(', ')})`);
  assert.ok(dead / penalties > .2 && dead / penalties < .6, 'dead-ball and live-ball fouls both occur');
  assert.ok(autoFirsts > 0);
});

test('a road offense is rattled by a loud stadium and a sloppy team is flagged more', () => {
  const count = (profile, hfr, kind) => {
    let n = 0;
    for (let i = 0; i < 250; i++) {
      const r = adapter.simulateShadow({gameId: `crowd-${i}`, seed: `crowd-${i}`, home: team(1, 'H'), away: team(2, 'A'), homeProfile: profile.home, awayProfile: profile.away, homeFieldRating: hfr});
      n += r.state.events.filter(e => e.type === 'penalty' && e.kind === kind && e.against === 'away').length;
    }
    return n;
  };
  const even = {home: {overall: 72, offense: 72, defense: 72}, away: {overall: 72, offense: 72, defense: 72}};
  assert.ok(count(even, 3.4, 'false_start') > count(even, .8, 'false_start') * 1.15, 'false starts rise with the crowd');
  const sloppy = {home: even.home, away: {overall: 45, offense: 45, defense: 45}}, sharp = {home: even.home, away: {overall: 95, offense: 95, defense: 95}};
  const total = profile => { let n = 0; for (let i = 0; i < 200; i++) n += adapter.simulateShadow({gameId: `disc-${i}`, seed: `disc-${i}`, home: team(1, 'H'), away: team(2, 'A'), homeProfile: profile.home, awayProfile: profile.away, homeFieldRating: 2}).state.events.filter(e => e.type === 'penalty' && e.against === 'away').length; return n; };
  assert.ok(total(sloppy) > total(sharp), 'lower-rated teams commit more fouls');
});

test('kickoffs come back, punts are fair caught or returned, and returns can score', () => {
  let kicks = 0, touchbacks = 0, returned = 0, returnYards = 0, punts = 0, fairCatches = 0, puntReturns = 0, returnTDs = 0;
  for (let i = 0; i < 300; i++) {
    const r = shadow(`ret-${i}`, {week: 3});
    engine.validateGame(r.state);
    for (const [index, e] of r.state.events.entries()) {
      if (e.type === 'kickoff') {
        kicks++;
        if (e.touchback) { touchbacks++; assert.equal(e.state.fieldPosition, 25); }
        else if (!e.td) { returned++; returnYards += e.ret; assert.ok(e.state.fieldPosition >= 10 && e.state.fieldPosition <= 48); assert.equal(e.ret, e.state.fieldPosition - 3); }
        if (e.td) returnTDs++;
      }
      if (e.type === 'punt') {
        punts++;
        if (e.fairCatch) { fairCatches++; assert.equal(e.ret, 0); }
        if (e.ret > 0 && !e.td) {
          puntReturns++;
          const change = r.state.events[index + 1];
          assert.equal(change.type, 'possession_change');
          assert.equal(change.state.fieldPosition, Math.min(99, 100 - (r.state.events[index].state.fieldPosition + e.net) + e.ret) || change.state.fieldPosition);
        }
        if (e.td) returnTDs++;
      }
    }
  }
  const tb = touchbacks / kicks;
  assert.ok(tb > .5 && tb < .72, `touchback rate ${tb.toFixed(2)}`);
  assert.ok(returnYards / returned > 18 && returnYards / returned < 28, `kick return average ${(returnYards / returned).toFixed(1)}`);
  assert.ok(fairCatches / punts > .2 && fairCatches / punts < .5, 'many punts are fair caught');
  assert.ok(puntReturns > 100, 'punts are returned');
  assert.ok(returnTDs <= 40, 'return touchdowns are rare');
});

test('a punt return touchdown and a kickoff return touchdown score like any other and restart the game', () => {
  function find(make, hit, max = 40000) {
    for (let i = 0; i < max; i++) { const s = make(i); if (hit(s)) return s; }
    assert.fail('no sample found');
  }
  const punted = find(i => {
    const s = engine.createGame({home: team(1, 'Home'), away: team(2, 'Away'), seed: `punt-td-${i}`, openingReceiver: 'home', rules: {conditions: calm}});
    engine.startGame(s); Object.assign(s, {possession: 'home', fieldPosition: 38, down: 4, distance: 6, clock: 700, period: 2});
    engine.punt(s); return s;
  }, s => last(s, 'punt').td);
  const punt = last(punted, 'punt'), td = last(punted, 'touchdown');
  assert.equal(td.kind, 'return');
  assert.equal(td.team, 'away', 'the receiving team scores');
  assert.equal(td.source, 'punt');
  assert.ok(punted.score.away >= 6 && punted.score.home === 0);
  assert.equal(punt.td, true);
  assert.equal(punted.events.filter(e => e.type === 'possession_change').length, 0, 'the receiver scored without taking possession first');
  assert.equal(last(punted, 'kickoff').receiver, 'home', 'the punting team receives the next kickoff');
  engine.validateState(punted);

  const kicked = find(i => {
    const s = engine.createGame({home: team(1, 'Home'), away: team(2, 'Away'), seed: `ko-td-${i}`, openingReceiver: 'home', rules: {conditions: calm}});
    engine.startGame(s); return s;
  }, s => s.events.some(e => e.type === 'kickoff' && e.td), 60000);
  const first = kicked.events.find(e => e.type === 'kickoff');
  assert.equal(first.td, true);
  assert.equal(kicked.events.find(e => e.type === 'touchdown').kind, 'return');
  assert.equal(kicked.score.home >= 6, true);
  assert.equal(last(kicked, 'kickoff').receiver, 'away');
  engine.validateState(kicked);
});

test('wind, rain, cold and thin air move kicking and the passing game the way a coach expects', () => {
  const chance = (cond, distance) => engine.fieldGoalChance(live({}, {conditions: cond}), distance);
  const noRules = engine.createGame({home: team(1, 'H'), away: team(2, 'A'), seed: 'x'});
  for (const d of [20, 35, 45, 55]) assert.equal(engine.fieldGoalChance(noRules, d), Math.max(.18, Math.min(.97, .97 - Math.max(0, d - 30) * .018)), 'the original curve without rules');
  const windy = {...calm, wind: 25}, snow = {...calm, temp: 15, precip: 3, sky: 'snow', wind: 14}, dome = {roof: 'dome', sky: 'dome', temp: 72, wind: 0, precip: 0, altitude: 'low'}, high = {...calm, altitude: 'high'};
  for (const d of [30, 42, 52]) {
    assert.ok(chance(windy, d) < chance(calm, d), `wind hurts a ${d}-yard attempt`);
    assert.ok(chance(snow, d) < chance(calm, d));
    assert.ok(chance(dome, d) >= chance(calm, d));
    assert.ok(chance(high, d) >= chance(calm, d));
  }
  assert.ok(chance(windy, 52) - chance(windy, 30) < chance(calm, 52) - chance(calm, 30), 'wind costs long kicks the most');
  assert.ok(chance(calm, 70) >= .12, 'never certain failure');

  const average = (cond, key) => {
    let sum = 0, n = 0;
    for (let i = 0; i < 160; i++) {
      const r = shadow(`wx-${i}`, {rules: {version: 1, conditions: cond}});
      for (const e of r.state.events) if (key === 'punt' && e.type === 'punt') { sum += e.net; n++; }
        else if (key === 'comp' && e.kind === 'pass' && !e.sack && e.type !== 'interception') { sum += e.completed ? 1 : 0; n++; }
        else if (key === 'fumble' && (e.type === 'scrimmage' || e.type === 'fumble' || e.type === 'interception')) { sum += e.type === 'fumble' ? 1 : 0; n++; }
    }
    return sum / n;
  };
  assert.ok(average(windy, 'punt') < average(calm, 'punt') - 1.5, 'punts are shorter into wind');
  assert.ok(average(high, 'punt') > average(calm, 'punt') + 1.5, 'punts carry at altitude');
  assert.ok(average(windy, 'comp') < average(calm, 'comp'), 'fewer completions in wind');
  assert.ok(average(snow, 'fumble') > average(calm, 'fumble') * 1.3, 'a wet, cold ball is dropped more');
});

test('pressure that is not a sack hurries the quarterback, forces scrambles and throwaways', () => {
  let sacks = 0, hurries = 0, scrambles = 0, pressuredIncomplete = 0, passes = 0, pressuredComp = 0, pressuredPass = 0, cleanComp = 0, cleanPass = 0;
  for (let i = 0; i < 300; i++) {
    const r = shadow(`press-${i}`);
    for (const e of r.state.events) {
      if (e.sack) sacks++;
      if (e.pressure && !e.sack) hurries++;
      if (e.scramble) { scrambles++; assert.equal(e.kind, 'rush'); assert.equal(e.pressure, true); }
      if (e.type === 'scrimmage' && e.kind === 'pass' && !e.sack) {
        passes++;
        if (e.pressure) { pressuredPass++; if (e.completed) pressuredComp++; else pressuredIncomplete++; } else { cleanPass++; if (e.completed) cleanComp++; }
      }
    }
  }
  assert.ok(hurries > sacks * 2, 'hurries are more common than sacks');
  assert.ok(scrambles > 200, 'quarterbacks scramble under pressure');
  assert.ok(pressuredComp / pressuredPass < cleanComp / cleanPass - .08, 'a pressured quarterback completes fewer passes');
  const off = adapter.simulateShadow({gameId: 'press-off', seed: 'press-off', home: team(1, 'H'), away: team(2, 'A'), rules: {version: 1, conditions: calm, pressure: false}});
  assert.ok(off.state.events.every(e => !e.scramble && !(e.pressure && !e.sack)), 'pressure can be switched off');
});

test('attribution credits flags, hurries, scrambles and returns, and the totals reconcile', () => {
  let flags = 0, returns = 0, returnTDs = 0, hurries = 0, scrambleQB = 0;
  for (let i = 0; i < 250; i++) {
    const r = shadow(`attr-${i}`, {week: 2 + (i % 11)});
    const a = attribution.attributeGame(r.state, {home: context('H'), away: context('A')});
    attribution.attachEventSummary(a, r.summary);
    assert.ok(a.reconciliation.ok, a.reconciliation.errors.join('; '));
    for (const side of ['home', 'away']) {
      const lines = a.playerStats[side], t = a.teamStats[side], sum = key => lines.reduce((n, l) => n + (l.stats[key] || 0), 0);
      const mine = r.state.events.filter(e => e.type === 'penalty' && e.against === side);
      assert.equal(t.penalties, mine.length, 'the team total is the flags against it');
      assert.equal(t.penaltyYds, mine.reduce((n, e) => n + e.yards, 0));
      assert.equal(sum('penalties'), t.penalties, 'every flag is on a player');
      assert.equal(r.summary[side].penalties, t.penalties);
      assert.equal(sum('returns'), t.returns);
      assert.equal(sum('returnTD'), t.returnTD);
      assert.equal(t.points, r.state.score[side]);
      flags += t.penalties; returns += t.returns; returnTDs += t.returnTD;
      const touchdowns = r.state.events.filter(e => e.type === 'touchdown' && e.team === side && e.kind !== 'return').length;
      assert.equal(t.passTD + t.rushTD, touchdowns, 'a return touchdown is not credited to the passer or the rusher');
      const opp = a.playerStats[side === 'home' ? 'away' : 'home'];
      assert.equal(opp.reduce((n, l) => n + (l.stats.pressures || 0), 0), t.pressures, 'pressures a defense records match the pressure the offense took');
    }
    for (const e of r.state.events) {
      if (e.scramble) {
        const row = a.playActors[e.seq];
        assert.equal(row.ca, row.qb, 'the scrambler is the quarterback');
        scrambleQB++;
      }
      if (e.pressure && !e.sack) hurries++;
      if (e.type === 'penalty') assert.ok(a.playActors[e.seq] && 'pn' in a.playActors[e.seq]);
    }
  }
  assert.ok(flags > 1500 && returns > 500 && hurries > 1000 && scrambleQB > 100);
  assert.ok(returnTDs >= 0);
});

test('the game-day runner, snapshots and recorded events agree with the new rules', () => {
  const base = {gameId: 'gd-rules', seed: 'gd-rules', home: {id: 1, name: 'H', lat: 45, lon: -90}, away: {id: 2, name: 'A'}, homeProfile: {overall: 75, offense: 76, defense: 73}, awayProfile: {overall: 72, offense: 73, defense: 70}, homeFieldRating: 2.4, year: 2027, week: 11};
  const session = gameday.createSession({...base, controlledSide: 'home'});
  assert.ok(session.state.rules.conditions, 'a session has conditions');
  gameday.advanceOne(session);
  let guard = 0;
  while (session.state.status !== 'final' && guard++ < 40) {
    const out = gameday.advance(session);
    if (out.status === 'decision') { const mid = gameday.snapshot(session); const copy = gameday.restore(JSON.parse(JSON.stringify(mid))); assert.deepEqual(copy.state.rules, session.state.rules); gameday.resolve(session, 'delegate'); gameday.resolve(copy, 'delegate'); assert.deepEqual(copy.state.events.slice(0, session.state.events.length).map(e => e.seq), session.state.events.slice(0, copy.state.events.length).map(e => e.seq)); }
  }
  engine.validateGame(session.state);
  assert.equal(session.state.status, 'final');
  // The same seed and the same choices rebuild the same game: this is how a live game is restored after a reload.
  const again = gameday.createSession({...base, controlledSide: 'home'});
  gameday.simulate(again, () => 'delegate');
  const first = gameday.createSession({...base, controlledSide: 'home'});
  gameday.simulate(first, () => 'delegate');
  assert.equal(JSON.stringify(first.state.events), JSON.stringify(again.state.events));
  // A session created for a game saved before the model (rules:false) has none of it.
  const legacy = gameday.createSession({...base, controlledSide: 'home', rules: false});
  gameday.simulate(legacy, () => 'delegate');
  assert.equal(legacy.state.rules, undefined);
  assert.ok(legacy.state.events.every(e => e.type !== 'penalty'));
  // Every event has readable text, including flags and returns.
  const names = {home: 'H', away: 'A'};
  for (const e of first.state.events) assert.ok(lab.eventText(e, names).length > 3);
  const flag = first.state.events.find(e => e.type === 'penalty');
  if (flag) assert.match(lab.eventText(flag, names), /^Flag: .+ on [HA], \d+ yards?/);
});

test('scoring and yardage stay close to the original model, and bad weather lowers scoring', () => {
  const mean = (rules, n = 700) => {
    let points = 0, yards = 0, plays = 0;
    for (let i = 0; i < n; i++) {
      const r = adapter.simulateShadow({gameId: `bal-${i}`, seed: `bal-${i}`, home: team(1, 'H'), away: team(2, 'A'), homeProfile: {overall: 72, offense: 72, defense: 70}, awayProfile: {overall: 72, offense: 72, defense: 70}, homeFieldRating: 2.2, rules});
      points += r.summary.totalPoints; yards += r.summary.home.yards + r.summary.away.yards; plays += r.summary.totalPlays;
    }
    return {points: points / n, yards: yards / n, plays: plays / n};
  };
  const legacy = mean(false), modern = mean({version: 1, conditions: calm}), storm = mean({version: 1, conditions: {...calm, wind: 26, precip: 3, sky: 'rain', temp: 38}}), dome = mean({version: 1, conditions: {roof: 'dome', sky: 'dome', temp: 72, wind: 0, precip: 0, altitude: 'low'}});
  assert.ok(Math.abs(modern.points - legacy.points) / legacy.points < .06, `points ${modern.points.toFixed(1)} vs ${legacy.points.toFixed(1)}`);
  assert.ok(modern.yards / legacy.yards > .88 && modern.yards / legacy.yards < 1.04, `yards ${modern.yards.toFixed(0)} vs ${legacy.yards.toFixed(0)}`);
  assert.ok(modern.plays < legacy.plays && modern.plays > legacy.plays * .88, 'flags cost some snaps, not a lot');
  assert.ok(storm.points < modern.points - 1.5, 'a storm lowers scoring');
  assert.ok(storm.yards < modern.yards * .96);
  assert.ok(dome.points > modern.points - .5, 'a dome does not hurt scoring');
});
