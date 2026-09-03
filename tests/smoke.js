// Engine smoke tests. Run with: node tests/smoke.js
// Covers the checks the v0.8 handoff asks for: new universe, multi-season sim,
// offseason rollover, recruiting, camp, draft, transfers and save round-trip.
const { loadEngine } = require('../tools/harness.js');

let pass = 0, fail = 0;
const results = [];
function check(name, cond, detail = '') {
  if (cond) { pass++; results.push(`  PASS  ${name}`); }
  else { fail++; results.push(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`); }
}
const mean = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

(async () => {
  const e = loadEngine({ seed: 424242 });
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');

  // --- new universe -------------------------------------------------------
  e.initUniverse();
  let u = e.universe;
  check('120 schools initialised', u.teams.length === 120, `got ${u.teams.length}`);
  check('every team has a roster', u.teams.every(t => t.roster.length >= 85));
  check('12-week schedule built', u.schedule.length === 12);
  check('every team plays 12 games',
    u.teams.every(t => t.schedule.length === 12),
    `min ${Math.min(...u.teams.map(t => t.schedule.length))}`);
  check('schedule objects are shared with teams',
    u.schedule[0][0] === u.teams.find(t => t.name === u.schedule[0][0].home).schedule.find(g => g.week === 1));
  check('recruit pool generated', u.recruits.length === 2800);
  check('recruits have geography', u.recruits.every(r => r.homeState && Number.isFinite(r.lat)));

  // --- one season ---------------------------------------------------------
  e.simSeason();
  check('regular season completes', u.phase === 'confReady', `phase ${u.phase}`);
  check('league win total is consistent',
    u.teams.reduce((s, t) => s + t.w, 0) === u.teams.reduce((s, t) => s + t.l, 0));
  e.simConferenceChampionships();
  check('ten conference champions', u.confChamps.length === 10, `got ${u.confChamps.length}`);
  e.simPlayoff();
  check('champion crowned', !!u.champion);
  check('season archived', u.history.some(h => h.year === 2027));

  // --- statistical sanity -------------------------------------------------
  const players = u.teams.flatMap(t => t.roster);
  const maxRush = Math.max(...players.map(p => p.stats.rushYds));
  const maxPass = Math.max(...players.map(p => p.stats.passYds));
  const maxRec = Math.max(...players.map(p => p.stats.recYds));
  const maxTack = Math.max(...players.map(p => p.stats.tackles));
  check('rushing leader is plausible', maxRush > 900 && maxRush < 2600, `${maxRush} yds`);
  check('passing leader is plausible', maxPass > 2800 && maxPass < 5200, `${maxPass} yds`);
  check('receiving leader is plausible', maxRec > 700 && maxRec < 2000, `${maxRec} yds`);
  check('tackle leader is plausible', maxTack > 60 && maxTack < 190, `${maxTack}`);
  const used = players.filter(p => (p.stats.games || 0) > 0).length;
  check('backups get real snaps', used / players.length > 0.33,
    `${(used / players.length * 100).toFixed(0)}% of players appeared`);
  check('kickers record field goals', players.some(p => p.pos === 'K' && p.stats.fgAtt > 0));
  check('punters record punts', players.some(p => p.pos === 'P' && p.stats.punts > 0));
  check('no player exceeds team rushing totals',
    u.teams.every(t => {
      const teamRush = t.roster.reduce((s, p) => s + p.stats.rushYds, 0);
      return t.roster.every(p => p.stats.rushYds <= teamRush);
    }));

  // --- camp and offseason -------------------------------------------------
  e.runSpringCamp();
  check('spring camp runs', u.developmentState.springRun);
  const conf = players.map(p => p.scoutConfidence);
  e.runFallCamp();
  check('fall camp runs', u.developmentState.fallRun);
  check('scouting confidence tightens', mean(u.teams.flatMap(t => t.roster).map(p => p.scoutConfidence)) > mean(conf));

  const perTeam = {};
  u.recruits.forEach(r => { if (r.committed) perTeam[r.committed] = (perTeam[r.committed] || 0) + 1; });
  check('class counts match committed recruits',
    u.teams.every(t => (perTeam[t.name] || 0) === (u.recruitClassCounts?.[t.name] || 0) && (t.commits || []).length === (perTeam[t.name] || 0)));
  const flips = (u.decommitLog || []).length, commitsNow = Object.values(perTeam).reduce((a, b) => a + b, 0);
  check('decommits happen but stay a story beat', flips > 0 && flips < commitsNow * .12, `${flips} of ${commitsNow}`);

  const beforeYear = u.year;
  e.runOffseason();
  check('year advances', u.year === beforeYear + 1);
  check('phase resets to regular', u.phase === 'regular');
  check('draft class recorded', (u.draftHistory[beforeYear] || []).length > 0);
  check('draft has 224 selections',
    (u.draftHistory[beforeYear] || []).filter(d => d.round).length === 224,
    `${(u.draftHistory[beforeYear] || []).filter(d => d.round).length}`);
  check('roster sizes stay bounded',
    u.teams.every(t => t.roster.length >= 85 && t.roster.length <= 105),
    `min ${Math.min(...u.teams.map(t => t.roster.length))} max ${Math.max(...u.teams.map(t => t.roster.length))}`);
  check('no eligibility-dead players remain',
    u.teams.every(t => t.roster.every(p => e.eligibilityBase(p) < 4)));
  check('archive populated', u.playerArchive.length > 0);
  const archiveBytes = JSON.stringify(u.playerArchive[0]).length;
  const liveBytes = JSON.stringify(u.teams[0].roster[0]).length;
  check('archive rows are slimmer than live players', archiveBytes < liveBytes * 0.75,
    `${archiveBytes} vs ${liveBytes} bytes`);
  check('transfers happened', u.teams.flatMap(t => t.roster).some(p => p.origin?.startsWith('Transfer')));
  check('signees joined', u.teams.flatMap(t => t.roster).some(p => p.origin?.includes('star recruit')));
  const classSizes = u.teams.map(t => t.roster.filter(p => p.origin?.includes('star recruit') && p.year === 'FR').length);
  check('recruiting classes are in range',
    Math.min(...classSizes) >= 5 && Math.max(...classSizes) <= 30,
    `min ${Math.min(...classSizes)} max ${Math.max(...classSizes)}`);

  // --- save round-trip ----------------------------------------------------
  const packed = JSON.parse(JSON.stringify({ userTeam: 'Chicago Metropolitan', universe: e.packUniverse ? e.packUniverse(u) : u }));
  const before = { year: u.year, teams: u.teams.length, archive: u.playerArchive.length };
  e.universe = packed.universe;
  e.normalizeUniverse();
  const v = e.universe;
  check('save round-trip preserves year', v.year === before.year);
  check('save round-trip preserves teams', v.teams.length === before.teams);
  check('save round-trip preserves archive', v.playerArchive.length === before.archive);
  check('save round-trip rehydrates stats',
    Object.keys(v.teams[0].roster[0].stats).length === 33,
    `${Object.keys(v.teams[0].roster[0].stats).length} keys`);
  check('save round-trip relinks schedule',
    v.schedule[0][0] === v.teams.find(t => t.name === v.schedule[0][0].home).schedule.find(g => g.week === 1));
  e.simSeason();
  check('loaded save can sim a season', v.phase === 'confReady');
  check('loaded save records results on team schedules',
    v.teams.every(t => t.schedule.filter(g => g.played).length === 12),
    `min played ${Math.min(...v.teams.map(t => t.schedule.filter(g => g.played).length))}`);

  // --- multi-season stability --------------------------------------------
  e.simConferenceChampionships(); e.simPlayoff();
  e.runSpringCamp(); e.runFallCamp(); e.runOffseason();
  for (let i = 0; i < 6; i++) {
    e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
    e.runSpringCamp(); e.runFallCamp(); e.runOffseason();
  }
  const w = e.universe;
  check('8 seasons complete without error', w.year === beforeYear + 8, `year ${w.year}`);
  check('rosters still bounded after 8 seasons',
    w.teams.every(t => t.roster.length >= 85 && t.roster.length <= 105));
  const pres = w.teams.map(t => t.prestige);
  check('prestige has not drifted', Math.abs(mean(pres) - 66) < 4, `mean ${mean(pres).toFixed(1)}`);
  check('prestige spread survives', Math.max(...pres) - Math.min(...pres) > 45,
    `range ${Math.min(...pres)}-${Math.max(...pres)}`);
  check('history retained for every season', w.history.filter(h => h.type === 'season').length === 8,
    `${w.history.filter(h => h.type === 'season').length}`);

  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(err => { console.error('HARNESS ERROR', err); process.exit(1); });
