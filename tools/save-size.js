// Per-component save size at rest (v0.12.10). Measures the same packed shape the
// export and browser save use, so the numbers answer "what is actually big".
// Usage: SEED=7 SEASONS=6 node tools/save-size.js
const { loadEngine } = require('./harness.js');
const SEASONS = Number(process.env.SEASONS || 6);
const bytes = value => Buffer.byteLength(JSON.stringify(value));
const mb = value => (value / 1048576).toFixed(1);

(async () => {
  const e = loadEngine({ seed: Number(process.env.SEED || 7) });
  e.setUserTeam('Chicago Metropolitan');
  await e.loadSchools();
  e.initUniverse();
  const u = e.universe;
  // The offseason is interactive: a phase can wait on a career choice or an unrun
  // camp. Driving it here keeps a twenty-season run honest instead of freezing.
  const finishOffseason = async () => {
    let guard = 0;
    while (u.phase === 'complete' && guard++ < 30) {
      if ((u.jobOffers || []).length) {
        const offer = u.jobOffers[0];
        if (!e.acceptPost(offer.schoolId).ok) break;
        continue;
      }
      const phase = u.offseason?.phase;
      if (phase === 'spring') { e.runSpringCamp(); continue; }
      if (phase === 'fall') { e.runFallCamp(); continue; }
      if (!e.advanceOffseasonPhase()) break;
    }
    if (u.phase === 'preseason') e.beginSeason();
  };
  console.log('year\ttotal\tgameArchive\tplayerArchive\trosters\trecruits\tevents\thistory\tcompactedGames');
  for (let i = 0; i < SEASONS; i++) {
    const startedAt = u.year;
    if (u.phase === 'preseason') e.beginSeason();
    e.simSeason();
    e.simConferenceChampionships();
    e.simPlayoff();
    e.runSpringCamp();
    e.runFallCamp();
    await finishOffseason();
    if (u.year === startedAt) throw new Error(`season ${startedAt} did not advance (phase ${u.phase})`);
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
    // v0.12.20 analysis: which individual fields carry the archive now that the
    // never-played records are already slim. Answers "what would a rollup save".
    const fields = new Map();
    let playedRows = 0, playedCareers = 0;
    for (const p of players) {
      for (const [key, value] of Object.entries(p)) fields.set(key, (fields.get(key) || 0) + size(value));
      if ((p.career?.games || 0) > 0) { playedCareers += 1; playedRows += (p.seasonHistory || []).length; }
    }
    const share = (part, whole) => (part / whole * 100).toFixed(1) + '%';
    console.log('\narchive analysis');
    console.log('field bytes: ' + [...fields].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key, bytes]) => key + ' ' + mb(bytes) + 'MB').join(' · '));
    const sample = players.find(p => (p.seasonHistory || []).length)?.seasonHistory.at(-1);
    if (sample) console.log('sample season row (' + size(sample) + ' B): ' + JSON.stringify(sample));
    const split = players.reduce((acc, p) => { const played = (p.career?.games || 0) > 0; acc[played ? 'played' : 'never'] += size(p.seasonHistory || []); return acc; }, { played: 0, never: 0 });
    console.log('seasonHistory split: played ' + mb(split.played) + 'MB · never played ' + mb(split.never) + 'MB');
    console.log('season rows: ' + playedRows + ' across ' + playedCareers + ' played careers · ' + (seasonBytes / Math.max(1, playedRows)).toFixed(0) + ' B/row');
    console.log(`players ${players.length} · bytes ${mb(seed)} MB · average ${(seed / Math.max(1, players.length)).toFixed(0)} B`);
    console.log(`seasonHistory ${mb(seasonBytes)} MB (${share(seasonBytes, seed)}) · career ${mb(careerBytes)} MB (${share(careerBytes, seed)}) · awards ${mb(awardBytes)} MB (${share(awardBytes, seed)})`);
    console.log(`never played: ${neverCount} players (${share(neverCount, players.length)}) holding ${mb(neverBytes)} MB (${share(neverBytes, seed)}); slim records would hold ${mb(slimBytes)} MB`);
    // Not a recommendation since v0.12.18: the slim shape drops recorded seasons,
    // camps, transfers and injuries. Shown only to size the tradeoff.
    console.log(`slimmer never-played shape would drop recorded history and hold ${mb(neverBytes - slimBytes)} MB less at season ${u.year}`);
  }
})();
