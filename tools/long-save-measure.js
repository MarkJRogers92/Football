// How big is a long dynasty's backup, and how long does it take to write? (v0.18)
// Plays SEASONS seasons in Node and, at each checkpoint, measures the portable save as plain JSON and as the
// gzipped backup the game now exports. Usage: SEASONS=30 SEED=7 EVERY=5 node tools/long-save-measure.js
const zlib = require('zlib');
const { loadEngine } = require('./harness.js');
const SEASONS = Number(process.env.SEASONS || 30), EVERY = Number(process.env.EVERY || 5);
(async () => {
  const e = loadEngine({ seed: Number(process.env.SEED || 7) });
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  console.log('season | plain MB | gzip MB | ratio | stringify s | gzip s | season s');
  for (let i = 1; i <= SEASONS; i++) {
    const t0 = Date.now();
    e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
    e.runSpringCamp(); e.runFallCamp(); e.runOffseason();
    while (e.hasPendingCareerChoice()) {
      const got = e.acceptPost(e.universe.jobOffers[0].schoolId);
      if (!got.ok) throw new Error('could not accept a post: ' + got.reason);
      e.setUserTeam(got.team.name);
      e.runSpringCamp(); e.runFallCamp(); e.runOffseason();
    }
    const seasonSeconds = (Date.now() - t0) / 1000;
    if (i % EVERY && i !== 1 && i !== SEASONS) continue;
    let t = Date.now();
    const parts = e.saveJsonParts({ version: e.APP_VERSION, userTeam: 'Chicago Metropolitan', universe: e.packUniverse(e.universe) });
    const stringifySeconds = (Date.now() - t) / 1000;
    const plain = parts.reduce((n, part) => n + Buffer.byteLength(part), 0);
    t = Date.now();
    const gzip = zlib.createGzip({ level: 6 }); let zipped = 0;
    gzip.on('data', chunk => { zipped += chunk.length; });
    const done = new Promise(resolve => gzip.on('end', resolve));
    for (const part of parts) gzip.write(part);
    gzip.end(); await done;
    const gzipSeconds = (Date.now() - t) / 1000;
    console.log(`${i} | ${(plain / 1048576).toFixed(1)} | ${(zipped / 1048576).toFixed(1)} | ${(plain / zipped).toFixed(1)}x | ${stringifySeconds.toFixed(1)} | ${gzipSeconds.toFixed(1)} | ${seasonSeconds.toFixed(1)}`);
  }
})().catch(error => { console.error(error); process.exit(1); });
