// Long-dynasty soak for the v0.16 systems: the penalty/return/weather play model and facilities and boosters.
// Full runtime (the production extensions), every user game played through Game Engine 2, the offseason driven
// phase by phase, and a watchdog that fails if a season does not advance exactly one year.
//
//   SEED=7 SEASONS=20 POLICY=active node tools/facilities-soak.js
//   POLICY=idle      never touches boosters (the AI programs still build)
//   AI=off           no AI investment (baseline for comparison)
//   ROUNDTRIP=5      pack, JSON round-trip and normalize the universe after that season, then keep playing
//   OUT=file.json    also write the per-season rows
//   SAVE_OUT=file    also write the final save (packed shape)
//
// Prints a tab-separated season table, then a summary of what grew, what pinned at a cap and what drifted.
const fs = require('fs');
const {loadEngine} = require('./harness.js');
const SEASONS = Number(process.env.SEASONS || 20), SEED = Number(process.env.SEED || 7), POLICY = process.env.POLICY || 'active';
const ROUNDTRIP = Number(process.env.ROUNDTRIP || 0), PROGRAM = process.env.PROGRAM || 'Chicago Metropolitan';
const bytes = v => Buffer.byteLength(JSON.stringify(v));
const mean = a => a.length ? a.reduce((n, x) => n + x, 0) / a.length : 0;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const f1 = n => Number(n).toFixed(1), mb = n => (n / 1048576).toFixed(1);

(async () => {
  const e = loadEngine({seed: SEED, fullRuntime: true});
  e.setUserTeam(PROGRAM);
  await e.loadSchools();
  e.initUniverse();
  let u = e.universe;
  const F = globalThis.DynastyFacilities;
  if (process.env.AI === 'off') globalThis.__FACILITIES_AI_OFF = true;   // baseline: only the controlled program builds
  if (!F) throw new Error('The full runtime did not load facilities-boosters.js');
  // A weak program can be fired; the controlled program is whichever post is held now.
  const me = () => e.T(document.querySelector('#userTeam')?.value || PROGRAM);
  const posts = [PROGRAM];
  const start = {facilities: new Map(u.teams.map(t => [t.id, t.facilities])), fan: new Map(u.teams.map(t => [t.id, t.fan_support])), dev: new Map(u.teams.map(t => [t.id, t.development]))};
  const rows = [], titles = new Map(), problems = [];
  const flag = (year, text) => { problems.push(`${year}: ${text}`); };

  // The offseason is interactive. Drive it, and never skip a gate.
  const finishOffseason = () => {
    let guard = 0;
    while (u.phase === 'complete' && guard++ < 40) {
      if ((u.jobOffers || []).length) { const offer = u.jobOffers[0]; if (!e.acceptPost(offer.schoolId).ok) break; continue; }
      const phase = u.offseason?.phase;
      if (phase === 'spring') { e.runSpringCamp(); continue; }
      if (phase === 'fall') { e.runFallCamp(); continue; }
      if (!e.advanceOffseasonPhase()) break;
    }
    if (u.phase === 'preseason') e.beginSeason();
  };

  // What an engaged coach does with the boosters each preseason.
  function activePolicy(t) {
    F.state(t);
    for (const [kind, dest] of [['dinner', 'facilities'], ['ask', 'facilities'], ['dinner', 'nil']]) F.campaign(t, kind, dest);
    for (let guard = 0; guard < 6; guard++) {
      const open = F.TRACK_IDS.filter(id => F.level(t, id) < F.MAX_LEVEL && !F.projectFor(t, id));
      if (F.activeProjects(t).length < F.MAX_PROJECTS && open.length) {
        open.sort((a, b) => F.level(t, a) - F.level(t, b));
        F.startProject(t, open[0]);
      }
      let moved = false;
      for (const project of F.activeProjects(t)) if (project.paid < project.cost && F.state(t).fund > 0 && F.fundProject(t, project.id).ok) moved = true;
      if (!moved) break;
    }
  }

  const gameStats = () => {
    const mine = me(), games = (u.gameArchive || []).filter(g => g.engine === 'v2' && g.season === u.year && (g.home?.id === mine.id || g.away?.id === mine.id));
    const out = {games: games.length, flags: 0, flagYds: 0, retYds: 0, pressures: 0, points: 0, indoor: 0, severe: 0, wet: 0};
    for (const g of games) {
      for (const side of ['home', 'away']) { const s = g.teamStats?.[side] || {}; out.flags += s.penalties || 0; out.flagYds += s.penaltyYds || 0; out.retYds += s.returnYds || 0; out.pressures += s.pressures || 0; out.points += g.score?.[side] || 0; }
      if (g.conditions?.roof === 'dome') out.indoor++;
      if (g.conditions && ['rough', 'harsh'].includes(globalThis.DynastyGameConditions.severity(g.conditions))) out.severe++;
      if (g.conditions?.precip > 0) out.wet++;
      if (!g.conditions) flag(u.year, `game ${g.id} has no conditions`);
      const home = g.teamStats?.home || {}, away = g.teamStats?.away || {};
      for (const k of ['penalties', 'penaltyYds', 'pressures', 'returns', 'returnYds', 'returnTD']) for (const s of [home, away]) if (!Number.isFinite(s[k])) flag(u.year, `game ${g.id} team stat ${k} is ${s[k]}`);
    }
    return out;
  };

  const header = ['year', 'rec', 'MB', 'sec', 'heapMB', 'facMean', 'facSD', 'facMax', 'cap99', 'fanMean', 'devMean', 'aiLevels', 'aiBuilding', 'myLv', 'myFund', 'myGW', 'flags/g', 'ret/g', 'prs/g', 'pts/g', 'dome', 'severe', 'wet'];
  console.log(header.join('\t'));
  let roundTripped = false;
  for (let i = 0; i < SEASONS; i++) {
    const t0 = Date.now(), startedAt = u.year;
    if (u.phase === 'preseason') e.beginSeason();
    if (POLICY === 'active') activePolicy(me());
    let guard = 0;
    while (u.phase === 'regular' && u.week < 12 && guard++ < 14) {
      if (e.hasPendingCareerChoice()) throw new Error(`career choice blocked ${u.year} week ${u.week + 1}`);
      if (e.hasPendingWeeklyDecisions()) e.delegateWeeklyDecisions();
      const before = u.week, g = e.findUserGame();
      if (g) e.simulateUserDetailed();
      e.simWeek(true);
      if (u.week !== before + 1) throw new Error(`week did not advance in ${u.year} (${before} -> ${u.week})`);
    }
    e.simConferenceChampionships(); e.simBowls(); e.simPlayoff();
    if (u.champion) titles.set(u.champion, (titles.get(u.champion) || 0) + 1);
    const stats = gameStats(), record = `${me().w}-${me().l}`;
    e.runSpringCamp(); e.runFallCamp();
    finishOffseason();
    if (me().name !== posts.at(-1)) posts.push(me().name);
    if (u.year !== startedAt + 1) throw new Error(`season ${startedAt} did not advance exactly one year (now ${u.year}, phase ${u.phase})`);
    if (ROUNDTRIP && i + 1 === ROUNDTRIP && !roundTripped) {
      const packed = JSON.parse(JSON.stringify({userTeam: PROGRAM, universe: e.packUniverse(u)}));
      e.universe = packed.universe; e.normalizeUniverse(); u = e.universe; roundTripped = true;
    }
    const sec = (Date.now() - t0) / 1000, size = bytes(e.packUniverse(u));
    const fac = u.teams.map(t => t.facilities), plans = u.teams.map(t => t.facilityPlan).filter(Boolean), mine = me(), mp = F.state(mine, false);
    for (const t of u.teams) {
      for (const k of ['facilities', 'fan_support', 'development', 'academics']) if (!Number.isFinite(t[k]) || t[k] < 0 || t[k] > 100) flag(u.year, `${t.name} ${k}=${t[k]}`);
      const p = t.facilityPlan; if (!p) continue;
      if (!Number.isFinite(p.fund) || p.fund < 0 || p.fund > F.FUND_CAP) flag(u.year, `${t.name} fund=${p.fund}`);
      if (!Number.isFinite(p.goodwill) || p.goodwill < 0 || p.goodwill > 100) flag(u.year, `${t.name} goodwill=${p.goodwill}`);
      if (p.projects.length > F.MAX_PROJECTS) flag(u.year, `${t.name} has ${p.projects.length} projects`);
    }
    const row = {
      year: u.year - 1, rec: record, mb: Number(mb(size)), sec, heap: Math.round(process.memoryUsage().heapUsed / 1048576),
      facMean: mean(fac), facSD: sd(fac), facMax: Math.max(...fac), cap99: fac.filter(x => x >= 99).length,
      fanMean: mean(u.teams.map(t => t.fan_support)), devMean: mean(u.teams.map(t => t.development)),
      aiLevels: mean(u.teams.filter(t => t !== mine).map(t => F.totalLevels(t))), aiBuilding: u.teams.filter(t => t !== mine && t.facilityPlan?.projects.length).length,
      myLv: F.totalLevels(mine), myFund: mp ? mp.fund : null, myGW: mp ? mp.goodwill : null,
      g: stats.games, flagsPerGame: stats.games ? stats.flags / stats.games / 2 : 0, retPerGame: stats.games ? stats.retYds / stats.games / 2 : 0, prsPerGame: stats.games ? stats.pressures / stats.games / 2 : 0,
      ptsPerGame: stats.games ? stats.points / stats.games : 0, dome: stats.indoor, severe: stats.severe, wet: stats.wet, planBytes: bytes(plans)
    };
    rows.push(row);
    console.log([row.year, row.rec, row.mb, f1(row.sec), row.heap, f1(row.facMean), f1(row.facSD), row.facMax, row.cap99, f1(row.fanMean), f1(row.devMean), f1(row.aiLevels), row.aiBuilding, row.myLv, row.myFund, row.myGW, f1(row.flagsPerGame), f1(row.retPerGame), f1(row.prsPerGame), f1(row.ptsPerGame), row.dome, row.severe, row.wet].join('\t'));
  }

  // ---- summary
  const last = rows.at(-1), first = rows[0];
  const tiers = [['top 30 by prestige', t => t.prestige >= 80], ['middle', t => t.prestige < 80 && t.prestige >= 55], ['bottom', t => t.prestige < 55]];
  console.log('\nfacilities by program tier (start -> end, change in rating / fan support / development)');
  for (const [name, pick] of tiers) {
    const list = u.teams.filter(pick);
    console.log(`  ${name.padEnd(20)} n=${String(list.length).padStart(2)}  fac ${f1(mean(list.map(t => start.facilities.get(t.id))))} -> ${f1(mean(list.map(t => t.facilities)))}  fan ${f1(mean(list.map(t => start.fan.get(t.id))))} -> ${f1(mean(list.map(t => t.fan_support)))}  dev ${f1(mean(list.map(t => start.dev.get(t.id))))} -> ${f1(mean(list.map(t => t.development)))}  levels ${f1(mean(list.map(t => F.totalLevels(t))))}`);
  }
  const mine = me(), allLevels = u.teams.map(t => F.totalLevels(t));
  console.log(`\nlevels: you ${F.totalLevels(mine)} (stadium ${F.level(mine, 'stadium')}, training ${F.level(mine, 'training')}, ops ${F.level(mine, 'football_ops')}) | league mean ${f1(mean(allLevels))}, max ${Math.max(...allLevels)}, programs at 15/15: ${allLevels.filter(x => x >= 15).length}`);
  console.log(`rating: you ${mine.facilities} (start ${start.facilities.get(mine.id)}) | rank among ${u.teams.length}: ${1 + u.teams.filter(t => t.facilities > mine.facilities).length}`);
  console.log(`save: ${mb(bytes(e.packUniverse(u)))} MB at season ${rows.length}; facility plans ${rows.at(-1).planBytes} B total; growth ${f1((last.mb - first.mb) / Math.max(1, rows.length - 1))} MB/season`);
  console.log(`time: ${f1(mean(rows.map(r => r.sec)))} s/season (first ${f1(first.sec)}, last ${f1(last.sec)}); heap ${first.heap} -> ${last.heap} MB`);
  const flags = rows.filter(r => r.g), tot = k => flags.reduce((n, r) => n + r[k] * r.g, 0) / Math.max(1, flags.reduce((n, r) => n + r.g, 0));
  console.log(`play model over ${flags.reduce((n, r) => n + r.g, 0)} user games: ${f1(tot('flagsPerGame'))} flags/team, ${f1(tot('retPerGame'))} return yds/team, ${f1(tot('prsPerGame'))} pressures allowed/team, ${f1(tot('ptsPerGame'))} pts/game`);
  console.log(`national titles: ${[...titles].sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${c}`).slice(0, 6).join(', ')} | distinct champions ${titles.size} in ${rows.length} seasons`);
  if (posts.length > 1) console.log(`posts held: ${posts.join(' -> ')}`);
  console.log(problems.length ? `\nPROBLEMS (${problems.length}):\n  ${problems.slice(0, 25).join('\n  ')}` : '\nno invariant problems');
  // SAVE_OUT=file.json writes the final universe in the packed save shape, for loading it in a real browser or desktop shell.
  if (process.env.SAVE_OUT) fs.writeFileSync(process.env.SAVE_OUT, JSON.stringify({userTeam: me().name, universe: e.packUniverse(u)}));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({seed: SEED, policy: POLICY, rows, problems}, null, 1));
  process.exitCode = problems.length ? 1 : 0;
})().catch(err => { console.error(err); process.exit(1); });
