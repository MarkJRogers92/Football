// League health over a long dynasty (v0.12.17). Read-only: simulates N seasons and
// reports distribution and concentration, so balance questions start from evidence.
// Usage: SEED=7 SEASONS=10 node tools/league-health.js
const { loadEngine } = require('./harness.js');

const SEASONS = Number(process.env.SEASONS || 10);
const SEED = Number(process.env.SEED || 7);
const mean = list => list.reduce((a, b) => a + b, 0) / Math.max(1, list.length);
const sd = list => { const m = mean(list); return Math.sqrt(mean(list.map(v => (v - m) ** 2))); };
const share = (part, whole) => (whole ? (part / whole * 100).toFixed(1) : '0.0') + '%';
// Position groups follow the engine's POS list; a group is thin when it holds fewer
// players than 60% of its POS_COUNTS design (rounded up), i.e. it is not two-deep.
const POS_GROUPS = [['QB', ['QB']], ['OL', ['OT', 'OG', 'C']], ['DL', ['EDGE', 'DT']], ['LB', ['LB']], ['DB', ['CB', 'S']], ['K/P', ['K', 'P']]];
// Reason codes written onto TRANSFER_COMPLETED events by placeTransfer.
const REASON_LABEL = { BROKEN_PROMISE: 'broken promise', PLAYING_TIME: 'playing time', FRESH_START: 'fresh start', ROSTER_RELEASE: 'roster release' };
const pad = (v, n) => String(v).padEnd(n);

(async () => {
  const e = loadEngine({ seed: SEED });
  const groups = POS_GROUPS.map(([label, positions]) => ({
    label, positions,
    // POS_COUNTS is the engine's designed roster shape per position.
    threshold: Math.ceil(positions.reduce((n, p) => n + (e.POS_COUNTS[p] || 0), 0) * 0.6),
  }));
  for (const g of groups) if (g.positions.some(p => !e.POS.includes(p))) throw new Error(`position group ${g.label} is not in the engine POS list`);
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
  const titleYears = [];            // {year, teamId} of every champion
  const prestigeTop10 = [];         // preseason top-10 prestige ids per season
  let bluebloodTitles = 0;          // titles won by a preseason top-10 prestige program
  // New metric state, all populated from one pass over the existing driver.
  const portalReports = new Map();   // universe.offseason.reports.portal per season
  const portalRows = new Map();      // TRANSFER_COMPLETED events per season
  const thinBySeason = [];           // per season: thin team-seasons, by group
  const thinByGroup = Object.fromEntries(groups.map(g => [g.label, 0]));
  const thinByTeam = new Map();      // program -> thin team-seasons by group
  const walkOn = [];                 // per season: mean program share with no recruitingMemory
  const blueChip = [];               // per cycle: 4/5-star signees and top-10 class share

  const bump = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);
  const nameOf = id => u.teams.find(t => t.id === id)?.name || (Number.isInteger(id) ? 'Team ' + id : String(id));

  for (let i = 0; i < SEASONS; i++) {
    const startedAt = u.year;
    if (u.phase === 'preseason') e.beginSeason();
    e.simSeason();
    e.simConferenceChampionships();
    for (const id of u.confChamps || []) bump(confTitles, nameOf(id));
    // Prestige ranking before the season decides, to test whether bluebloods convert
    // standing into titles — the dynasty-persistence question.
    const preseasonTop = [...u.teams].sort((a, b) => b.prestige - a.prestige).slice(0, 10).map(t => t.id);
    e.simPlayoff();
    if (u.champion) bump(champions, u.champion);
    const championTeam = u.teams.find(t => t.name === u.champion);
    if (championTeam) { titleYears.push({ year: u.year, id: championTeam.id }); if (preseasonTop.includes(championTeam.id)) bluebloodTitles++; }
    prestigeTop10.push(new Set(preseasonTop));
    for (const id of u.playoffFieldIds || []) bump(playoffApps, nameOf(id));

    // Roster as it finished the season (before the next class and walk-ons arrive).
    // Position counts come from p.pos on t.roster; walk-ons are players with no
    // recruitingMemory (captureRecruitment is only written on a signed recruit).
    const walkShares = [];
    let teamSeasonThin = 0;
    const thinCounts = Object.fromEntries(groups.map(g => [g.label, 0]));
    for (const t of u.teams) {
      const posCount = {};
      let noMemory = 0;
      for (const p of t.roster) { posCount[p.pos] = (posCount[p.pos] || 0) + 1; if (!p.recruitingMemory) noMemory++; }
      const rec = thinByTeam.get(t.name) || { thin: 0, groups: {} };
      let thin = 0;
      for (const g of groups) {
        const have = g.positions.reduce((n, p) => n + (posCount[p] || 0), 0);
        if (have >= g.threshold) continue;
        thin++; thinByGroup[g.label]++; thinCounts[g.label]++;
        rec.groups[g.label] = (rec.groups[g.label] || 0) + 1;
      }
      if (thin) { teamSeasonThin++; rec.thin += thin; thinByTeam.set(t.name, rec); }
      if (t.roster.length) walkShares.push(noMemory / t.roster.length * 100);
    }
    thinBySeason.push({ year: u.year, teamSeasons: teamSeasonThin, groups: thinCounts });
    walkOn.push({ year: u.year, mean: mean(walkShares) });

    // Class just finalized by finalizeRecruiting(): r.committed names the program,
    // r.stars is the signee rating. Class success = sum of signee stars.
    const commits = u.recruits.filter(r => r.committed);
    const points = new Map();
    for (const r of commits) points.set(r.committed, (points.get(r.committed) || 0) + (r.stars || 0));
    const topTen = new Set([...points.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name));
    const blue = commits.filter(r => (r.stars || 0) >= 4);
    blueChip.push({ year: u.year, blue: blue.length, elite: blue.filter(r => topTen.has(r.committed)).length, topTen: topTen.size });

    e.runSpringCamp();
    e.runFallCamp();
    // The offseason is interactive: a phase can wait on a career choice or a weekly
    // decision. Drive it the way the interface would, and count what blocked it.
    const userTeam = () => u.teams.find(t => t.name === u.tenure?.school) || u.teams[0];
    let guard = 0;
    while (u.phase === 'complete' && guard++ < 30) {
      // reports.portal is replaced when the calendar rolls, so keep the season's copy.
      if (u.offseason?.year === u.year && u.offseason.reports?.portal) portalReports.set(u.year, { ...u.offseason.reports.portal });
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

  // One pass over the event log: TRANSFER_COMPLETED carries metadata.reason and
  // metadata.fromSchoolId (written by placeTransfer when a transfer completes).
  for (const ev of u.events || []) {
    if (ev.type !== 'TRANSFER_COMPLETED') continue;
    const row = portalRows.get(ev.season) || { completed: 0, reasons: {}, from: new Map() };
    row.completed++;
    const reason = ev.metadata?.reason || 'UNKNOWN';
    row.reasons[reason] = (row.reasons[reason] || 0) + 1;
    const from = ev.metadata?.fromSchoolId;
    if (from != null) row.from.set(from, (row.from.get(from) || 0) + 1);
    portalRows.set(ev.season, row);
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
  const seasonYears = thinBySeason.map(r => r.year);

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
  // Dynasty persistence: do the same programs keep winning, and does standing predict it?
  const titleCounts = new Map();
  for (const row of titleYears) bump(titleCounts, row.id);
  const maxTitles = Math.max(0, ...titleCounts.values());
  let backToBack = 0;
  for (let i = 1; i < titleYears.length; i++) if (titleYears[i].id === titleYears[i - 1].id) backToBack++;
  const overlaps = [];
  for (let i = 1; i < prestigeTop10.length; i++) {
    let shared = 0;
    for (const id of prestigeTop10[i]) if (prestigeTop10[i - 1].has(id)) shared++;
    overlaps.push(shared);
  }
  console.log('\ndynasty persistence:');
  console.log('distinct champions:', titleCounts.size, '· most titles by one program:', maxTitles, '· back-to-back titles:', backToBack);
  console.log('titles won by a preseason top-10 prestige program:', bluebloodTitles, 'of', titleYears.length, '(' + share(bluebloodTitles, titleYears.length) + ')');
  console.log('preseason top-10 prestige retention year to year:', mean(overlaps).toFixed(1), 'of 10');

  console.log('career changes for the user program:', careerMoves.length, careerMoves.map(m => `${m.year}→${m.to}`).join(' · '));

  // Entrants placed/unplaced: universe.offseason.reports.portal.placed/pending.
  console.log('\nportal churn by season (entrants = reports.portal placed+pending; completed = TRANSFER_COMPLETED events):');
  console.log(pad('season', 8) + pad('entrants', 10) + pad('placed', 8) + pad('returned', 10) + pad('exited', 8) + pad('unplaced', 10) + pad('completed', 11) + 'programs losing 2+');
  const unplacedTotals = [];
  for (const y of seasonYears) {
    const rep = portalReports.get(y);
    const row = portalRows.get(y) || { completed: 0, reasons: {}, from: new Map() };
    const returned = rep?.returned || 0, exited = rep?.exited || 0;
    const entrants = rep ? rep.placed + returned + exited + rep.pending : row.completed;
    if (entrants) unplacedTotals.push({ entrants, unplaced: returned + exited });
    console.log(pad(y, 8) + pad(entrants, 10) + pad(rep ? rep.placed : '?', 8) + pad(returned, 10) + pad(exited, 8) + pad(returned + exited, 10) + pad(row.completed, 11) + [...row.from.values()].filter(n => n >= 2).length);
    console.log('        reasons: ' + (Object.entries(row.reasons).map(([k, n]) => `${REASON_LABEL[k] || k} ${n}`).join(' · ') || 'none'));
  }
  const portalTotal = seasonYears.reduce((n, y) => n + (portalRows.get(y)?.completed || 0), 0);
  const lostTotal = seasonYears.reduce((n, y) => n + [...(portalRows.get(y)?.from.values() || [])].filter(x => x >= 2).length, 0);
  console.log('total completed transfers:', portalTotal, '· program-seasons losing 2+ players:', lostTotal);
  const entrantsAll = unplacedTotals.reduce((n, r) => n + r.entrants, 0);
  const unplacedAll = unplacedTotals.reduce((n, r) => n + r.unplaced, 0);
  console.log('unplaced entrants:', unplacedAll, 'of', entrantsAll, '(' + share(unplacedAll, entrantsAll) + ')');

  // Counts per program from p.pos on t.roster; thresholds from engine POS_COUNTS.
  console.log('\npositional shortages by season (thin = below 60% of POS_COUNTS design: ' + groups.map(g => `${g.label}<${g.threshold}`).join(', ') + '):');
  console.log(pad('season', 8) + pad('team-seasons thin', 20) + groups.map(g => pad(g.label, 5)).join(''));
  for (const row of thinBySeason) console.log(pad(row.year, 8) + pad(row.teamSeasons, 20) + groups.map(g => pad(row.groups[g.label], 5)).join(''));
  console.log('thin team-seasons by group (of ' + seasonYears.length * u.teams.length + '): ' + groups.map(g => `${g.label} ${thinByGroup[g.label]}`).join(' · '));
  const worst = [...thinByTeam.entries()].sort((a, b) => b[1].thin - a[1].thin).slice(0, 5);
  console.log('worst offenders (thin team-seasons): ' + (worst.map(([name, r]) => `${name} ${r.thin} (${Object.entries(r.groups).map(([g, n]) => `${g} ${n}`).join(', ')})`).join(' · ') || 'none'));

  // p.recruitingMemory exists only for players signed out of a recruiting class.
  console.log('\nwalk-on dependence (share of rostered players with no recruitingMemory):');
  for (const row of walkOn) console.log(`${row.year}  ${row.mean.toFixed(1)}% mean across ${u.teams.length} programs`);
  console.log('mean across seasons:', mean(walkOn.map(r => r.mean)).toFixed(1) + '%');

  // Signee program and rating: r.committed and r.stars on universe.recruits.
  console.log('\nblue-chip concentration (4- and 5-star signees held by the top 10 classes by star points):');
  console.log(pad('season', 8) + pad('blue-chip signees', 20) + pad('in top-10 classes', 20) + 'share');
  for (const row of blueChip) console.log(pad(row.year, 8) + pad(row.blue, 20) + pad(row.elite, 20) + (row.blue ? (row.elite / row.blue * 100).toFixed(1) : '0.0') + '%');
  console.log('mean top-10 share:', mean(blueChip.map(r => r.blue ? r.elite / r.blue * 100 : 0)).toFixed(1) + '%');

  console.log('\nseasons detail:', JSON.stringify(seasons));
})();
