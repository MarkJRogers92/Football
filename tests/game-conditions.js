const test = require('node:test');
const assert = require('node:assert/strict');
const GC = require('../game-conditions.js');
const schools = require('../schools-data.js');
const programs = Array.isArray(schools) ? schools : (schools.schools || Object.values(schools));

const calm = {roof: 'open', temp: 70, wind: 5, precip: 0, sky: 'clear', altitude: 'low'};

test('conditions are a pure function of the home program and the calendar', () => {
  const realRandom = Math.random;
  let draws = 0;
  Math.random = () => { draws++; return realRandom(); };
  try {
    for (const home of programs.slice(0, 30)) {
      for (const week of [1, 6, 12, 14]) {
        const a = GC.forGame({home, year: 2028, week});
        assert.deepEqual(a, GC.forGame({home, year: 2028, week}), `${home.name} week ${week} repeats exactly`);
      }
    }
  } finally { Math.random = realRandom; }
  assert.equal(draws, 0, 'conditions never touch Math.random (or the gameplay stream)');
  const chi = programs[0];
  assert.notDeepEqual(GC.forGame({home: chi, year: 2028, week: 6}), GC.forGame({home: chi, year: 2029, week: 6}), 'the same date in another season is a different afternoon');
});

test('every program and week produces values the engine can use', () => {
  let domes = 0, total = 0;
  for (const home of programs) {
    for (let week = 1; week <= 17; week++) {
      const c = GC.forGame({home, year: 2027, week});
      total++;
      assert.ok(['open', 'dome'].includes(c.roof));
      assert.ok(['clear', 'cloudy', 'rain', 'snow', 'dome'].includes(c.sky));
      assert.ok(Number.isInteger(c.temp) && c.temp >= -2 && c.temp <= 100, `temp ${c.temp}`);
      assert.ok(Number.isInteger(c.wind) && c.wind >= 0 && c.wind <= 38, `wind ${c.wind}`);
      assert.ok([0, 1, 2, 3].includes(c.precip));
      if (c.sky === 'snow') assert.ok(c.temp <= 33, 'snow needs freezing weather');
      if (c.roof === 'dome') { domes++; assert.deepEqual([c.sky, c.wind, c.precip, c.temp], ['dome', 0, 0, 72], 'a dome has no weather'); }
      else if (c.sky === 'rain' || c.sky === 'snow') assert.ok(c.precip >= 1, 'a wet sky has precipitation');
      assert.deepEqual(GC.sanitize(c), {...c, version: GC.VERSION}, 'a generated value survives sanitize');
    }
  }
  const share = domes / total;
  assert.ok(share > .02 && share < .12, `about one program in ten plays indoors (saw ${(share * 100).toFixed(1)}%)`);
  // A program's roof does not change from week to week.
  for (const home of programs.slice(0, 40)) {
    const roofs = new Set([1, 5, 9, 13].map(week => GC.forGame({home, year: 2027, week}).roof));
    assert.equal(roofs.size, 1, `${home.name} keeps one roof`);
  }
});

test('climate follows latitude and the calendar', () => {
  const avg = (filter, week) => {
    const list = programs.filter(filter).map(home => GC.forGame({home, year: 2027, week})).filter(c => c.roof === 'open');
    return list.reduce((n, c) => n + c.temp, 0) / list.length;
  };
  const north = p => p.lat >= 42, south = p => p.lat <= 33;
  assert.ok(avg(south, 2) > avg(north, 2) + 6, 'the south is warmer in September');
  assert.ok(avg(north, 12) < avg(north, 2) - 15, 'the north cools sharply into late November');
  const winter = programs.flatMap(home => [14, 15, 16].map(week => GC.forGame({home, year: 2027, week}))).filter(c => c.roof === 'open');
  assert.ok(winter.some(c => c.sky === 'snow'), 'December games can be played in snow');
  const september = programs.map(home => GC.forGame({home, year: 2027, week: 1})).filter(c => c.roof === 'open');
  assert.ok(september.every(c => c.sky !== 'snow'), 'no snow in the first week');
  assert.ok(programs.some(home => GC.forGame({home, year: 2027, week: 6}).altitude === 'high'), 'some programs play at altitude');
  const neutral = GC.forGame({home: programs[0], year: 2027, week: 14, neutral: true, gameId: 'bowl-a'});
  assert.equal(neutral.neutral, true);
  assert.equal(neutral.altitude, 'low');
});

test('a calm day changes nothing and bad weather only makes it harder', () => {
  const neutral = GC.effects(calm);
  assert.equal(neutral.passComp, 0);
  assert.equal(neutral.passYards, 1);
  assert.equal(neutral.rushYards, 1);
  assert.equal(neutral.fumble, 1);
  assert.equal(neutral.interception, 1);
  assert.equal(neutral.fgFlat, 0);
  assert.equal(neutral.fgPerYard, 0);
  assert.equal(neutral.puntYards, 0);
  assert.equal(neutral.touchback, 0);
  assert.deepEqual(GC.effects(undefined), GC.effects({}), 'missing conditions are a calm day');

  const wind = GC.effects({...calm, wind: 25}), rain = GC.effects({...calm, precip: 3, sky: 'rain'}), cold = GC.effects({...calm, temp: 12, precip: 2, sky: 'snow'});
  for (const [name, e] of [['wind', wind], ['rain', rain], ['snow', cold]]) {
    assert.ok(e.passComp < 0, `${name} lowers completion odds`);
    assert.ok(e.passYards < 1, `${name} shortens the passing game`);
    assert.ok(e.fgFlat > 0 || e.fgPerYard > 0, `${name} makes kicking harder`);
    assert.ok(e.puntYards < 0, `${name} shortens punts`);
  }
  assert.ok(rain.fumble > 1.4 && cold.fumble > 1.4, 'a wet ball is dropped more');
  assert.ok(wind.interception > 1, 'wind adds interceptions');
  assert.ok(GC.effects({...calm, wind: 30}).passComp < GC.effects({...calm, wind: 18}).passComp, 'more wind, harder passing');
  assert.ok(GC.effects({...calm, precip: 3, sky: 'rain'}).fumble > GC.effects({...calm, precip: 1, sky: 'rain'}).fumble, 'heavier rain, more fumbles');

  const dome = GC.effects({roof: 'dome', sky: 'dome', temp: 72, wind: 0, precip: 0});
  assert.ok(dome.passComp > 0 && dome.passYards > 1, 'a dome helps the passing game');
  assert.equal(GC.effects({roof: 'dome', sky: 'dome', temp: 5, wind: 40, precip: 3}).wind, 0, 'a dome ignores whatever the fields say outdoors');
  const high = GC.effects({...calm, altitude: 'high'});
  assert.ok(high.puntYards > 2 && high.fgPerYard < 0 && high.touchback > 0, 'thin air helps kickers');
});

test('conditions read in plain words and a bad value is rejected', () => {
  assert.equal(GC.describe(calm).severity, 'calm');
  assert.deepEqual(GC.describe(calm).notes, []);
  const rough = GC.describe({...calm, wind: 22, precip: 2, sky: 'rain', temp: 41});
  assert.match(rough.headline, /Rain · 41°F · Wind 22 mph/);
  assert.ok(['rough', 'harsh'].includes(rough.severity));
  assert.ok(rough.notes.some(n => /Wind 22 mph/.test(n)) && rough.notes.some(n => /Wet field/.test(n)));
  assert.match(GC.describe({roof: 'dome', sky: 'dome', temp: 72, wind: 0, precip: 0, altitude: 'low'}).headline, /^Indoors/);
  assert.match(GC.describe({...calm, altitude: 'high'}).headline, /High altitude/);
  assert.equal(GC.describe(null).headline, '');
  assert.equal(GC.sanitize('nope'), null);
  assert.equal(GC.sanitize(null), null);
  const clamped = GC.sanitize({roof: 'open', sky: 'lava', temp: 900, wind: -4, precip: 9, altitude: 'moon'});
  assert.deepEqual([clamped.sky, clamped.temp, clamped.wind, clamped.precip, clamped.altitude], ['clear', 115, 0, 3, 'low']);
});
