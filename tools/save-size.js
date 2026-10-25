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
})();
