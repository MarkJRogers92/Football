const {test} = require('node:test');
const assert = require('node:assert/strict');
const {loadEngine} = require('../tools/harness');
const {makeFacilitySystem} = require('../facilities-boosters.js');

const USER = 'Chicago Metropolitan';
async function setup(seed) {
  const e = loadEngine({seed, fullRuntime: true});
  e.setUserTeam(USER); await e.loadSchools(); e.initUniverse();
  return {e, F: globalThis.DynastyFacilities, t: e.T(USER), u: e.universe};
}
const rngDigest = e => JSON.stringify(e.universe.rng);

test('a new program starts with a small fund, a believable goodwill and nothing built', async () => {
  const {F, t} = await setup(6101);
  assert.equal(t.facilityPlan, undefined, 'nothing is written until the plan is used');
  assert.equal(F.fundOf(t), 2);
  const p = F.state(t);
  assert.ok(p.goodwill >= 20 && p.goodwill <= 85, `goodwill ${p.goodwill}`);
  assert.deepEqual(p.levels, {stadium: 0, training: 0, football_ops: 0});
  assert.equal(F.totalLevels(t), 0);
  assert.equal(F.hoursBonus(t), 0);
  assert.ok(F.annualIncome(t) >= 2 && F.annualIncome(t) <= 10);
  const poor = {name: 'Poor U', fan_support: 20, prestige: 25, resources: 20}, rich = {name: 'Rich U', fan_support: 95, prestige: 95, resources: 95};
  assert.ok(F.goodwillOf(poor) < F.goodwillOf(rich), 'a bigger program starts with a happier base');
});

test('a project is started, paid for out of the fund, built over seasons, and opens on time', async () => {
  const {e, F, t, u} = await setup(6102);
  const p = F.state(t), start = u.year;
  p.fund = 20;
  const started = F.startProject(t, 'stadium');
  assert.ok(started.ok);
  assert.deepEqual([started.project.level, started.project.cost, started.project.paid], [1, F.LEVEL_COST[0], 0]);
  assert.match(F.startProject(t, 'stadium').reason, /already has a project/);
  assert.equal(F.startProject(t, 'bogus').ok, false);

  assert.equal(F.fundProject(t, started.project.id, 1).amount, 1);
  assert.equal(p.fund, 19);
  const rest = F.fundProject(t, started.project.id);
  assert.equal(rest.funded, true);
  assert.equal(p.fund, 20 - F.LEVEL_COST[0]);
  assert.equal(started.project.fundedYear, start);
  assert.equal(started.project.completeYear, start + F.BUILD_SEASONS[0]);
  assert.match(F.fundProject(t, started.project.id).reason, /already fully funded/);
  assert.match(F.cancelProject(t, started.project.id).reason, /cannot be stopped/, 'a contracted project is committed');

  const facilitiesBefore = t.facilities, fanBefore = t.fan_support;
  u.year = start; // still the season it was funded in: it is not open yet
  F.newSeason(t, {wins: 7, expected: 7});
  assert.equal(F.level(t, 'stadium'), 0, 'still building');
  u.year = start + 1;
  const report = F.newSeason(t, {wins: 7, expected: 7});
  assert.deepEqual(report.opened, [{track: 'stadium', level: 1}]);
  assert.equal(F.level(t, 'stadium'), 1);
  assert.equal(t.facilities, Math.min(99, facilitiesBefore + F.FACILITY_POINTS));
  assert.equal(t.fan_support, Math.min(99, fanBefore + 2), 'a stadium makes the crowd louder');
  assert.equal(F.activeProjects(t).length, 0);
  assert.ok(u.events.some(x => x.type === 'FACILITY_OPENED' && x.metadata.track === 'stadium'));
  // A louder crowd is a real home-field edge in the same formula the game uses.
  assert.ok(e.homeFieldFor(t) > 0);
});

test('funding is bounded by the fund, a shelved project refunds, and the limits hold', async () => {
  const {F, t} = await setup(6103);
  const p = F.state(t);
  p.fund = 3;
  const a = F.startProject(t, 'training').project;
  assert.equal(F.fundProject(t, a.id, 99).amount, 3, 'only what is in the fund');
  assert.equal(p.fund, 0);
  assert.match(F.fundProject(t, a.id, 1).reason, /fund is empty/);
  assert.equal(F.cancelProject(t, a.id).refund, 3);
  assert.equal(p.fund, 3);
  assert.equal(F.activeProjects(t).length, 0);

  assert.ok(F.startProject(t, 'training').ok);
  assert.ok(F.startProject(t, 'stadium').ok);
  assert.match(F.startProject(t, 'football_ops').reason, /projects can be underway/);
  p.levels.stadium = F.MAX_LEVEL;
  p.projects = [];
  assert.match(F.startProject(t, 'stadium').reason, /as good as it gets/);
  p.fund = F.FUND_CAP + 50; F.state(t);
  assert.equal(p.fund, F.FUND_CAP, 'the fund has a ceiling');
});

test('levels pay out: training lifts development, football operations adds recruiting hours', async () => {
  const {F, t, u} = await setup(6104);
  const RA = globalThis.DynastyRecruitingActions, p = F.state(t);
  const hoursBase = RA.hoursBudgetFor(t), dev = t.development;
  assert.equal(RA.hoursBudgetFor(t), hoursBase);
  p.levels.football_ops = 2;
  assert.equal(F.hoursBonus(t), 4);
  assert.equal(RA.hoursBudgetFor(t), hoursBase + 4, 'two levels of football operations add four hours a week');
  p.levels.football_ops = 0;
  assert.equal(RA.hoursBudgetFor(t), hoursBase);

  p.fund = 40;
  const open = (track, level) => {
    u.year += 3;
    const project = {id: 'X' + level, track, level, cost: 1, paid: 1, fundedYear: u.year - 1, completeYear: u.year};
    p.projects = [project];
    F.newSeason(t, {wins: 7, expected: 7});
  };
  open('training', 1); assert.equal(t.development, dev, 'level one does not move development');
  open('training', 2); assert.equal(t.development, dev + 1);
  open('training', 3); assert.equal(t.development, dev + 1);
  open('training', 4); assert.equal(t.development, dev + 2);
});

test('campaigns are limited, repeatable and send money where you choose without touching the game stream', async () => {
  const {e, F, t, u} = await setup(6105);
  const p = F.state(t), start = p.fund, rng = rngDigest(e);
  const a = F.campaign(t, 'dinner', 'facilities');
  assert.ok(a.ok && a.units >= 1 && a.units <= 3);
  assert.equal(p.fund, start + a.units);
  assert.equal(F.campaignsLeft(t), 2);
  const nilBefore = e.nilBudgetFor(t), nilLeftBefore = e.nilRemaining(t);
  const b = F.campaign(t, 'dinner', 'nil');
  assert.ok(b.ok);
  assert.equal(p.fund, start + a.units, 'a gift sent to NIL does not touch the fund');
  assert.equal(e.nilBudgetFor(t), nilBefore + b.units, 'it raises this season’s NIL budget');
  assert.equal(e.nilRemaining(t), nilLeftBefore + b.units);
  assert.ok(F.campaign(t, 'ask', 'facilities').ok);
  assert.match(F.campaign(t, 'dinner', 'facilities').reason, /all 3 campaigns/);
  assert.equal(F.campaign(t, 'ask', 'moon').ok, false);
  assert.equal(F.campaign(t, 'parade', 'nil').ok, false);
  assert.equal(rngDigest(e), rng, 'campaigns draw nothing from the gameplay random stream');

  // The same program, season and campaign number always end the same way.
  const twin = makeFacilitySystem({getUniverse: () => ({year: u.year, week: 3, events: [], nextEventId: 1}), clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)), nilRemaining: () => 5});
  const t1 = {id: 7, name: 'A', fan_support: 60, prestige: 60}, t2 = {id: 7, name: 'A', fan_support: 60, prestige: 60};
  assert.deepEqual(twin.campaign(t1, 'ask', 'facilities').units, twin.campaign(t2, 'ask', 'facilities').units);

  // A new season gives the campaigns and the NIL bonus back.
  u.year += 1;
  assert.equal(F.campaignsLeft(t), 3);
  assert.equal(F.nilBonus(t), 0, 'the NIL gift was for one season only');
  assert.equal(e.nilBudgetFor(t), nilBefore);
});

test('a major ask lands when the base is happy and costs goodwill when it is not', async () => {
  const sys = (id, goodwill) => {
    const u = {year: 2030, week: 2, events: [], nextEventId: 1};
    const f = makeFacilitySystem({getUniverse: () => u, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)), nilRemaining: () => 5});
    const t = {id, name: 'T' + id, fan_support: 60, prestige: 60, facilityPlan: {goodwill, fund: 0}};
    return {f, t};
  };
  let happyYes = 0, sourYes = 0;
  for (let id = 1; id <= 300; id++) {
    const h = sys(id, 90), s = sys(id, 12);
    const rh = h.f.campaign(h.t, 'ask', 'facilities'), rs = s.f.campaign(s.t, 'ask', 'facilities');
    if (rh.success) { happyYes++; assert.ok(rh.units >= 4 && rh.units <= 7); assert.equal(h.t.facilityPlan.fund, rh.units); } else assert.equal(h.t.facilityPlan.goodwill, 86, 'a refusal costs 4 goodwill');
    if (rs.success) sourYes++; else { assert.equal(s.t.facilityPlan.goodwill, 8, 'a failed ask costs goodwill'); assert.equal(s.t.facilityPlan.fund, 0); assert.equal(rs.units, 0); }
  }
  // The odds are 67% for a devoted base and the 15% floor for an angry one.
  assert.ok(happyYes > 300 * .55 && happyYes < 300 * .8, `happy boosters mostly say yes (${happyYes}/300)`);
  assert.ok(sourYes < 300 * .3, `restless boosters mostly say no (${sourYes}/300)`);
  assert.ok(happyYes > sourYes * 2.5);
});

test('NIL and facilities are one pool: redirecting NIL spends it and fills the fund', async () => {
  const {e, F, t} = await setup(6106);
  const p = F.state(t), budget = e.nilBudgetFor(t), spent = t.nilSpent || 0, fund = p.fund, rng = rngDigest(e);
  assert.equal(e.nilRemaining(t), budget - spent);
  const out = F.divertNil(t, 2);
  assert.ok(out.ok);
  assert.equal(p.fund, fund + 2);
  assert.equal(t.nilSpent, spent + 2);
  assert.equal(e.nilRemaining(t), budget - spent - 2);
  assert.equal(out.nilLeft, e.nilRemaining(t));
  assert.match(F.divertNil(t, 99).reason, /left this season/);
  assert.equal(F.divertNil(t, 0).ok, false);
  assert.equal(rngDigest(e), rng);
  // Redirected money is not available for NIL deals any more.
  const target = [...t.roster].sort((a, b) => b.perceived - a.perceived)[0];
  t.nilSpent = budget - 1;
  const deal = e.signNilDeal(t, target, false);
  if (e.nilDealCost(target, false) > 1) assert.equal(deal.ok, false, 'the budget really shrank');
  // And the fund caps out.
  p.fund = F.FUND_CAP; t.nilSpent = 0;
  assert.match(F.divertNil(t, 1).reason, /fund is full/);
});

test('a real season rolls the boosters forward: gifts arrive, goodwill follows the record, buildings open', async () => {
  const {e, F, t, u} = await setup(6107);
  const p = F.state(t), start = u.year;
  p.fund = 4; p.goodwill = 60;
  const stadium = F.startProject(t, 'stadium').project;
  F.fundProject(t, stadium.id);
  assert.equal(p.fund, 0);
  const gifts = F.annualIncome(t);
  F.campaign(t, 'dinner', 'nil');
  assert.ok(F.nilBonus(t) > 0);

  if (u.phase === 'preseason') e.beginSeason();
  e.simSeason(); e.simConferenceChampionships(); e.simBowls(); e.simPlayoff();
  const wins = t.w, expected = e.seasonExpectation(t);
  let guard = 0;
  while (u.phase === 'complete' && guard++ < 30) {
    assert.equal(u.jobOffers?.length || 0, 0, 'this seed keeps the coach at the same program');
    const phase = u.offseason?.phase;
    if (phase === 'spring') e.runSpringCamp(); else if (phase === 'fall') e.runFallCamp(); else assert.ok(e.advanceOffseasonPhase());
  }
  assert.equal(u.year, start + 1);
  assert.ok(p.fund >= gifts - 1, `the booster gifts arrived (${p.fund} for ${gifts})`);
  const expectedGoodwill = Math.max(5, Math.min(100, Math.round(60 * .9 + 5.5 + F.goodwillShift(t, {wins, expected, champion: false, confChampion: false, bowlWin: false}))));
  assert.ok(Math.abs(p.goodwill - expectedGoodwill) <= 20, `goodwill moved with ${wins} wins against ${expected} expected (${p.goodwill})`);
  assert.equal(F.level(t, 'stadium'), 1, 'the stadium funded last season opened');
  assert.equal(F.nilBonus(t), 0, 'last year’s NIL gift is spent');
  assert.equal(F.campaignsLeft(t), 3);
  assert.ok(u.events.some(x => x.type === 'BOOSTER_GIFTS' && x.season === start + 1));
  assert.ok(F.newsItems(t).some(x => /Stadium & Game Day level 1 is open/.test(x.main)), 'the hub announces it');
});

test('an old save without a plan loads and plays, and the plan survives a save and load', async () => {
  const {e, F, t} = await setup(6108);
  assert.equal(t.facilityPlan, undefined);
  assert.equal(globalThis.DynastyFacilityNews(t).length, 0, 'no news before anything has happened');
  F.state(t).fund = 9; F.state(t).levels.training = 3;
  t.facilityPlan.projects = [{id: 'FP9', track: 'stadium', level: 2, cost: 7, paid: 3}];
  const packed = JSON.parse(JSON.stringify({universe: e.packUniverse(e.universe)}));
  e.universe = packed.universe; e.normalizeUniverse();
  const back = e.T(USER);
  assert.equal(F.fundOf(back), 9);
  assert.equal(F.level(back, 'training'), 3);
  assert.equal(F.activeProjects(back)[0].paid, 3);
  // Damaged data is repaired rather than trusted.
  back.facilityPlan.fund = 'lots'; back.facilityPlan.goodwill = -50; back.facilityPlan.levels.stadium = 99; back.facilityPlan.projects = [null, {track: 'nope'}];
  const fixed = F.state(back);
  assert.ok(Number.isFinite(fixed.fund) && fixed.fund >= 0);
  assert.ok(fixed.goodwill >= 0 && fixed.goodwill <= 100);
  assert.equal(fixed.levels.stadium, F.MAX_LEVEL);
  assert.deepEqual(fixed.projects, []);
});

test('the Program page renders the whole loop and its buttons work', async () => {
  const {e, F, t} = await setup(6109);
  const host = document.querySelector('#facilitiesBoosters');
  assert.ok(host, 'the page has a host for the card');
  F.state(t).fund = 12;
  e.TAB_RENDERERS.program();
  assert.match(host.innerHTML, /Build the program/);
  assert.match(host.innerHTML, /Stadium &amp; Game Day/);
  assert.match(host.innerHTML, /Football Operations Building/);
  assert.match(host.innerHTML, /data-fb-campaign="ask" data-fb-dest="nil"/);
  assert.match(host.innerHTML, /data-fb-start="training"/);
  F.startProject(t, 'training');
  e.TAB_RENDERERS.program();
  assert.match(host.innerHTML, /data-fb-fund=/);
  assert.match(host.innerHTML, /0 of 4 units paid|0 of 7 units paid/);
});
