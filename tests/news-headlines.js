const test = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');

async function engine(seed) {
  const e = loadEngine({seed});
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  return e;
}

test('every archived game gets a headline that names its winner and matches its facts', async () => {
  const e = await engine(61001);
  const u = e.T('Chicago Metropolitan');
  for (let i = 0; i < 4; i++) { e.delegateWeeklyDecisions(u); e.simWeek(true); }
  const games = e.universe.gameArchive.filter(g => g.season === e.universe.year);
  assert.ok(games.length > 100);
  let upsets = 0;
  for (const g of games) {
    const f = e.recapFacts(g), h = e.newsHeadline(g);
    assert.ok(h.includes(f.win.name), `headline names the winner: ${h}`);
    assert.ok(!h.startsWith(f.lose.name), `headline does not lead with the loser: ${h}`);
    if (f.upset) { upsets++; assert.match(h, /^Upset: /); }
    else if (f.shutout) assert.match(h, / blanks /);
  }
  assert.ok(upsets > 0, 'four weeks produce at least one upset headline');
});

test('postseason games get title headlines', async () => {
  const e = await engine(61002);
  e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
  const post = e.universe.gameArchive.filter(g => g.season === e.universe.year && g.label && g.label !== 'Regular season');
  const final = post.find(g => g.label === 'National Championship');
  assert.equal(e.newsHeadline(final), `${e.universe.champion} wins the national championship`);
  for (const g of post.filter(x => /Championship$/.test(x.label) && x.label !== 'National Championship'))
    assert.match(e.newsHeadline(g), new RegExp(`claims the ${g.label}$`));
  for (const g of post.filter(x => /Bowl$/.test(x.label))) assert.match(e.newsHeadline(g), / wins the .+ Bowl over /);
});

test('the dashboard feed carries the week\'s top national story, not the controlled team\'s game', async () => {
  const e = await engine(61003);
  const u = e.T('Chicago Metropolitan');
  for (let i = 0; i < 3; i++) { e.delegateWeeklyDecisions(u); e.simWeek(true); }
  const [item] = e.newsHeadlineHubItem(u);
  assert.ok(item, 'a strong national story is surfaced');
  assert.equal(item.kicker, 'HEADLINE');
  assert.equal(item.tab, 'newsletter');
  assert.ok(!item.sub.includes(u.name), 'the controlled team\'s own game is skipped');
  assert.ok(e.universe.weeklyHub.some(x => x.kicker === 'HEADLINE'), 'the rebuilt weekly hub includes it');
});
