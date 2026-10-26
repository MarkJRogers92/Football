// League health over a long dynasty (v0.12.17). Read-only: simulates N seasons and
// reports distribution and concentration, so balance questions start from evidence.
// Usage: SEED=7 SEASONS=10 node tools/league-health.js
const { loadEngine } = require('./harness.js');

const SEASONS = Number(process.env.SEASONS || 10);
const SEED = Number(process.env.SEED || 7);
const mean = list => list.reduce((a, b) => a + b, 0) / Math.max(1, list.length);
const sd = list => { const m = mean(list); return Math.sqrt(mean(list.map(v => (v - m) ** 2))); };
const share = (part, whole) => (whole ? (part / whole * 100).toFixed(1) : '0.0') + '%';

(async () => {
  const e = loadEngine({ seed: SEED });
  e.setUserTeam('Chicago Metropolitan');
  await e.loadSchools();
  e.initUniverse();
  const u = e.universe;
  const champions = new Map();
  const confTitles = new Map();
  const playoffApps = new Map();
  const awardWins = new Map();
  const classSizes = [];
  const decommits = [];
  const seasons = [];
  const careerMoves = [];

  const bump = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);
  const nameOf = id => u.teams.find(t => t.id === id)?.name || (Number.isInteger(id) ? 'Team ' + id : String(id));

  for (let i = 0; i < SEASONS; i++) {
    const startedAt = u.year;
    if (u.phase === 'preseason') e.beginSeason();
    e.simSeason();
    e.simConferenceChampionships();
    for (const id of u.confChamps || []) bump(confTitles, nameOf(id));
    e.simPlayoff();
    if (u.champion) bump(champions, u.champion);
    for (const id of u.playoffFieldIds || []) bump(playoffApps, nameOf(id));
    e.runSpringCamp();
    e.runFallCamp();
    // The offseason is interactive: a phase can wait on a career choice or a weekly
    // decision. Drive it the way the interface would, and count what blocked it.
    const userTeam = () => u.teams.find(t => t.name === u.tenure?.school) || u.teams[0];
    let guard = 0;
    while (u.phase === 'complete' && guard++ < 30) {
      if ((u.jobOffers || []).length) {
        const offer = (u.jobOffers || [])[0];
        const accepted = offer && e.acceptPost(offer.schoolId);
        if (!accepted?.ok) break;
        careerMoves.push({ year: u.year, to: u.teams.find(t => t.id === offer.schoolId)?.name || offer.schoolId });
        const moved = u.teams.find(t => t.id === offer.schoolId);
        if (moved) e.setUserTeam(moved.name);
        continue;
      }
      // A career move restarts the calendar at spring development; run it the way
      // the interface would rather than treating the stall as an error.
      const os = u.offseason?.phase;
      if (os === 'spring') { e.runSpringCamp(); continue; }
      if (os === 'fall') { e.runFallCamp(); continue; }
      e.delegateWeeklyDecisions?.(userTeam());
      if (!e.advanceOffseasonPhase()) break;
    }
    if (u.phase === 'preseason') e.beginSeason();
    if (u.year === startedAt) throw new Error(`season ${startedAt} did not advance (phase ${u.phase}, week ${u.week})`);

    for (const [year, list] of Object.entries(u.awards || {})) {
      if (String(year) !== String(u.year - 1)) continue;
      for (const award of list || []) if (award.team) bump(awardWins, award.team);
    }
    const cycle = u.recruitCycle || {};
    if (cycle.signeesByTeam) classSizes.push(...Object.values(cycle.signeesByTeam));
    if (Number.isFinite(cycle.decommits) || Number.isFinite(cycle.flips)) {
      decommits.push({ year: u.year - 1, decommits: cycle.decommits || 0, flips: cycle.flips || 0 });
    }
    const rosters = u.teams.map(t => t.roster.length);
    seasons.push({
      year: u.year - 1,
      prestigeMean: +mean(u.teams.map(t => t.prestige)).toFixed(1),
      prestigeSd: +sd(u.teams.map(t => t.prestige)).toFixed(1),
      rosterMin: Math.min(...rosters), rosterMean: +mean(rosters).toFixed(1), rosterMax: Math.max(...rosters),
      atCap: rosters.filter(n => n >= 105).length,
    });
  }

  const prestige = u.teams.map(t => t.prestige);
  const rosters = u.teams.map(t => t.roster.length);
  const players = u.teams.flatMap(t => t.roster);
  const atCeiling = players.filter(p => p.trueNow >= (p.upside ?? 99)).length;
  const injured = players.filter(p => (p.injuryWeeks || 0) > 0).length;
  const byClass = {};
  for (const p of players) byClass[p.year] = (byClass[p.year] || 0) + 1;

  const top = map => [...map.entries()].sort((a, b) => b[1] - a[1]);
  const titles = top(champions), conf = top(confTitles), playoffs = top(playoffApps), awards = top(awardWins);

  console.log(`league health — seed ${SEED}, ${SEASONS} seasons (through ${u.year - 1})`);
  console.log('\nseason  prestige mean/sd  roster min/mean/max  at-cap');
  for (const row of seasons) console.log(`${row.year}      ${row.prestigeMean}/${row.prestigeSd}          ${row.rosterMin}/${row.rosterMean}/${row.rosterMax}            ${row.atCap}`);

  console.log('\nnational titles:', titles.map(([n, c]) => `${n} ${c}`).join(' · ') || 'none');
  console.log('teams with a title:', champions.size, 'of 120 · max by one program:', titles[0]?.[1] || 0);
  console.log('conference titles: distinct winners', confTitles.size, '· most:', conf.slice(0, 3).map(([n, c]) => `${n} ${c}`).join(' · '));
  console.log('playoff appearances: distinct programs', playoffApps.size, '· most:', playoffs.slice(0, 3).map(([n, c]) => `${n} ${c}`).join(' · '));
  console.log('major awards: distinct programs', awardWins.size, '· most:', awards.slice(0, 3).map(([n, c]) => `${n} ${c}`).join(' · '));
  console.log('\nprestige now: mean', mean(prestige).toFixed(1), 'sd', sd(prestige).toFixed(1), 'min', Math.min(...prestige), 'max', Math.max(...prestige));
  console.log('roster sizes: min', Math.min(...rosters), 'mean', mean(rosters).toFixed(1), 'max', Math.max(...rosters), '· at the 105 cap', rosters.filter(n => n >= 105).length);
  console.log('class sizes: min', Math.min(...classSizes), 'mean', mean(classSizes).toFixed(1), 'max', Math.max(...classSizes), '· teams', classSizes.length);
  console.log('decommits/flips by cycle:', decommits.map(r => `${r.year}:${r.decommits}/${r.flips}`).join(' '));
  console.log('players: total', players.length, '· at ceiling', atCeiling, `(${share(atCeiling, players.length)})`, '· injured now', injured);
  console.log('classes:', Object.entries(byClass).map(([k, v]) => `${k}:${v}`).join(' '));
  console.log('archive: careers', (u.playerArchive || []).length, '· hall of fame', e.hallOfFame({ limit: 500 }).length);
  console.log('career changes for the user program:', careerMoves.length, careerMoves.map(m => `${m.year}→${m.to}`).join(' · '));
  console.log('\nseasons detail:', JSON.stringify(seasons));
})();
