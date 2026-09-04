// Repeatable multi-season calibration for v0.9.21's stakes systems and save growth.
// It plays a bounded NIL allocation policy so the economy is measured in use,
// rather than reporting only the static budget formula.
const { loadEngine } = require('./harness.js');

const SEASONS = Number(process.env.SEASONS || 5);
const SEEDS = String(process.env.SEEDS || '4101,4102,4103')
  .split(',').map(Number).filter(Number.isFinite);
const USER = process.env.USER_TEAM || 'Chicago Metropolitan';

const bytes = value => Buffer.byteLength(JSON.stringify(value));
const mb = value => (value / 1048576).toFixed(2);
const mean = rows => rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : 0;
const percentile = (rows, fraction) => {
  if (!rows.length) return 0;
  const sorted = rows.slice().sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
};

function saveSizes(e) {
  const u = e.universe;
  const packed = e.packUniverse(u, false);
  const { gameArchive, ...core } = packed;
  const active = u.teams.flatMap(t => t.roster);
  const stakes = {
    tenure: u.tenure,
    teams: u.teams.map(t => ({
      id: t.id, rivalry: t.rivalry, adminConfidence: t.adminConfidence,
      mandate: t.mandate, nilSpent: t.nilSpent,
    })),
    playerDeals: active.filter(p => p.nilDeal).map(p => ({ id: p.id, nilDeal: p.nilDeal })),
    recruitDeals: (u.recruits || []).filter(r => r.nilDeal).map(r => ({ id: r.id, nilDeal: r.nilDeal })),
  };
  return {
    browserCore: bytes(core),
    events: bytes(u.events || []),
    activeSeasonHistory: bytes(active.map(p => p.seasonHistory || [])),
    activeScouting: bytes(active.map(p => [p.scoutingDomains || null, p.scoutingHistory || []])),
    weeklyDecisions: bytes(u.weeklyDecisions || []),
    stakes: bytes(stakes),
    playerArchive: bytes(u.playerArchive || []),
    gameArchive: bytes(u.gameArchive || []),
    portable: bytes({ version: e.APP_VERSION, userTeam: USER, universe: e.packUniverse(u) }),
  };
}

function allocateRecruitNil(e, team) {
  // Spend on close, plausible races. Throwing every dollar at the No. 1 recruit
  // from a mid-tier school measures fantasy, not the decision the UI presents.
  const candidates = e.universe.recruits.filter(r => !r.committed && r.stars >= 3 && r.nationalRank <= 600)
    .map(recruit => {
      const cost = e.nilDealCost(recruit, true), mine = e.recruitPitch(team, recruit);
      const leader = Math.max(...e.universe.teams.filter(other => other !== team).map(other => e.recruitPitch(other, recruit)));
      const gap = mine - leader;
      return { recruit, cost, gap, swing: gap < 0 && gap + cost * 3 >= 0 };
    })
    .sort((a, b) => Number(b.swing) - Number(a.swing) || Math.abs(a.gap) - Math.abs(b.gap) || a.recruit.nationalRank - b.recruit.nationalRank);
  const cap = Math.max(1, Math.floor(e.nilBudgetFor(team) * .4));
  const rows = [];
  for (const { recruit, cost, gap } of candidates) {
    if (rows.reduce((sum, row) => sum + row.cost, 0) + cost > cap) continue;
    recruit.targeted = true;
    e.firstRecruitEvaluation(recruit, team);
    const before = e.recruitPitch(team, recruit);
    const result = e.signNilDeal(team, recruit, true);
    if (result.ok) rows.push({ cost: result.cost, lift: e.recruitPitch(team, recruit) - before, gap });
    if (rows.length === 2) break;
  }
  return rows;
}

function allocateRetentionNil(e, team) {
  const candidates = team.roster.map(player => ({ player, before: e.transferRisk(player) }))
    .filter(row => row.before >= 20)
    .sort((a, b) => b.before - a.before);
  const rows = [];
  for (const row of candidates) {
    const result = e.signNilDeal(team, row.player, false);
    if (!result.ok) continue;
    rows.push({ player: row.player, cost: result.cost, before: row.before, after: e.transferRisk(row.player) });
  }
  return rows;
}

async function run(seed) {
  const e = loadEngine({ seed });
  e.setUserTeam(USER);
  await e.loadSchools();
  e.initUniverse();
  const initial = saveSizes(e);
  const leagueBudgets = e.universe.teams.map(team => e.nilBudgetFor(team));
  const seasons = [];
  for (let index = 0; index < SEASONS; index++) {
    const year = e.universe.year;
    const team = e.T(USER);
    const rivalBefore = team.rivalry.series.w + team.rivalry.series.l;
    const fanBefore = team.fan_support;
    const recruitDeals = allocateRecruitNil(e, team);
    e.simSeason();
    e.simConferenceChampionships();
    e.simPlayoff();
    const rivalryFanSwing = team.fan_support - fanBefore;
    const recruitWins = e.universe.recruits.filter(r => r.nilDeal?.schoolId === team.id && r.committed === team.name).length;
    const retentionDeals = allocateRetentionNil(e, team);
    const retentionIds = retentionDeals.map(row => row.player.id);
    e.runSpringCamp();
    e.runFallCamp();
    e.runOffseason();
    const review = e.universe.tenure.seasons.at(-1);
    const rivalAfter = team.rivalry.series.w + team.rivalry.series.l;
    seasons.push({
      seed, year, budget: e.nilBudgetFor(team),
      recruitSpend: recruitDeals.reduce((sum, row) => sum + row.cost, 0),
      recruitLift: recruitDeals.map(row => row.lift),
      recruitDeals: recruitDeals.length, recruitWins,
      retentionSpend: retentionDeals.reduce((sum, row) => sum + row.cost, 0),
      retentionRelief: retentionDeals.map(row => row.before - row.after),
      retentionDeals: retentionDeals.length,
      retained: retentionIds.filter(id => team.roster.some(player => player.id === id)).length,
      review, rivalryGames: rivalAfter - rivalBefore, rivalryFanSwing,
      sizes: saveSizes(e),
    });
  }
  return { initial, leagueBudgets, seasons };
}

(async () => {
  const runs = [];
  for (const seed of SEEDS) runs.push(await run(seed));
  const seasons = runs.flatMap(run => run.seasons);
  const budgets = seasons.map(row => row.budget);
  const leagueBudgets = runs.flatMap(run => run.leagueBudgets);
  const confidence = seasons.map(row => row.review.after);
  const deltas = seasons.map(row => row.review.delta);
  const rivalryGames = seasons.map(row => row.rivalryGames);
  const recruitLifts = seasons.flatMap(row => row.recruitLift);
  const retentionRelief = seasons.flatMap(row => row.retentionRelief);
  const recruitDeals = seasons.reduce((sum, row) => sum + row.recruitDeals, 0);
  const recruitWins = seasons.reduce((sum, row) => sum + row.recruitWins, 0);
  const retentionDeals = seasons.reduce((sum, row) => sum + row.retentionDeals, 0);
  const retained = seasons.reduce((sum, row) => sum + row.retained, 0);
  const firstSizes = runs.map(run => run.initial);
  const lastSizes = runs.map(run => run.seasons.at(-1).sizes);
  const growth = key => mean(lastSizes.map((last, index) =>
    (last[key] - firstSizes[index][key]) / SEASONS));

  console.log(`stakes audit: ${SEEDS.length} seeds x ${SEASONS} seasons (${seasons.length} dynasty-seasons)`);
  console.log(`NIL budgets (controlled): min=${Math.min(...budgets)} median=${percentile(budgets, .5)} max=${Math.max(...budgets)}`);
  console.log(`NIL budgets (league): min=${Math.min(...leagueBudgets)} p25=${percentile(leagueBudgets, .25)} median=${percentile(leagueBudgets, .5)} p75=${percentile(leagueBudgets, .75)} max=${Math.max(...leagueBudgets)}`);
  console.log(`NIL recruit pitch lift: mean=${mean(recruitLifts).toFixed(1)} range=${Math.min(...recruitLifts)}..${Math.max(...recruitLifts)}`);
  console.log(`NIL recruit outcomes: ${recruitWins}/${recruitDeals} deal recipients signed (${(100 * recruitWins / Math.max(1, recruitDeals)).toFixed(1)}%)`);
  console.log(`NIL retention relief: mean=${mean(retentionRelief).toFixed(1)} range=${Math.min(...retentionRelief)}..${Math.max(...retentionRelief)}`);
  console.log(`NIL retention outcomes: ${retained}/${retentionDeals} deal recipients stayed (${(100 * retained / Math.max(1, retentionDeals)).toFixed(1)}%)`);
  console.log(`Administration: confidence min=${Math.min(...confidence)} median=${percentile(confidence, .5)} max=${Math.max(...confidence)}; delta p10=${percentile(deltas, .1)} p50=${percentile(deltas, .5)} p90=${percentile(deltas, .9)}`);
  console.log(`Administration labels: ${JSON.stringify(Object.fromEntries([...new Set(seasons.map(row => row.review.label))].map(label => [label, seasons.filter(row => row.review.label === label).length])))}`);
  console.log(`Rivalry meetings: min=${Math.min(...rivalryGames)} mean=${mean(rivalryGames).toFixed(2)} max=${Math.max(...rivalryGames)}`);
  console.log(`Rivalry fan-support swing: ${JSON.stringify(Object.fromEntries([-2, 2].map(swing => [swing, seasons.filter(row => row.rivalryFanSwing === swing).length])))}`);
  console.log('Average growth per completed season:');
  for (const key of ['browserCore','events','activeSeasonHistory','activeScouting','weeklyDecisions','stakes','playerArchive','gameArchive','portable'])
    console.log(`  ${key.padEnd(20)} ${mb(growth(key))} MB`);
  console.log('Final average footprint:');
  for (const key of ['browserCore','playerArchive','gameArchive','portable'])
    console.log(`  ${key.padEnd(20)} ${mb(mean(lastSizes.map(row => row[key])))} MB`);
})().catch(error => { console.error(error); process.exitCode = 1; });
