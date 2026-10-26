// Per-component save size at rest (v0.12.10). Measures the same packed shape the
// export and browser save use, so the numbers answer "what is actually big".
// Usage: SEASONS=6 node tools/save-size.js
const { loadEngine } = require('./harness.js');
const SEASONS = Number(process.env.SEASONS || 6);
const bytes = value => Buffer.byteLength(JSON.stringify(value));
const mb = value => (value / 1048576).toFixed(1);

(async () => {
  const e = loadEngine({ seed: 7 });
  e.setUserTeam('Chicago Metropolitan');
  await e.loadSchools();
  e.initUniverse();
  const u = e.universe;
  console.log('year\ttotal\tgameArchive\tplayerArchive\trosters\trecruits\tevents\thistory\tcompactedGames');
  for (let i = 0; i < SEASONS; i++) {
    e.simSeason();
    e.simConferenceChampionships();
    e.simPlayoff();
    e.runSpringCamp();
    e.runFallCamp();
    e.runOffseason();
    const parts = {
      gameArchive: bytes(u.gameArchive),
      playerArchive: bytes(u.playerArchive),
      rosters: bytes(u.teams.map(t => t.roster)),
      recruits: bytes(u.recruits),
      events: bytes(u.events || []),
      history: bytes(u.history),
    };
    const total = bytes(e.packUniverse(u));
    const compacted = (u.gameArchive || []).filter(g => g.compacted).length;
    console.log([u.year, mb(total), mb(parts.gameArchive), mb(parts.playerArchive), mb(parts.rosters), mb(parts.recruits), mb(parts.events), mb(parts.history), compacted].join('\t'));
  }

  // ANALYZE=1: where the archive's bytes actually go, and how much a slim record
  // for players who never took a snap would recover. Measures before changing anything.
  if (process.env.ANALYZE === '1') {
    const players = u.playerArchive || [];
    const size = value => Buffer.byteLength(JSON.stringify(value));
    let seed = 0, seasonBytes = 0, careerBytes = 0, awardBytes = 0, neverCount = 0, neverBytes = 0, slimBytes = 0;
    for (const p of players) {
      seed += size(p);
      seasonBytes += size(p.seasonHistory || []);
      careerBytes += size(p.career || {});
      awardBytes += size(p.awards || []);
      if ((p.career?.games || 0) > 0) continue;
      neverCount += 1;
      neverBytes += size(p);
      slimBytes += size({ id: p.id, name: p.name, pos: p.pos, lastTeam: p.lastTeam, exitReason: p.exitReason, draftResult: p.draftResult || null, awards: p.awards || [] });
    }
    const share = (part, whole) => (part / whole * 100).toFixed(1) + '%';
    console.log('\narchive analysis');
    console.log(`players ${players.length} · bytes ${mb(seed)} MB · average ${(seed / Math.max(1, players.length)).toFixed(0)} B`);
    console.log(`seasonHistory ${mb(seasonBytes)} MB (${share(seasonBytes, seed)}) · career ${mb(careerBytes)} MB (${share(careerBytes, seed)}) · awards ${mb(awardBytes)} MB (${share(awardBytes, seed)})`);
    console.log(`never played: ${neverCount} players (${share(neverCount, players.length)}) holding ${mb(neverBytes)} MB (${share(neverBytes, seed)}); slim records would hold ${mb(slimBytes)} MB`);
    console.log(`recoverable by slimming never-played records: ${mb(neverBytes - slimBytes)} MB at season ${u.year}`);
  }
})();
