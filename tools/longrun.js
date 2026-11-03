// Long-horizon check: does the universe drift, and how does the save grow?
const { loadEngine } = require('./harness.js');
const N = Number(process.env.SEASONS || 12);
const SEED = Number(process.env.SEED || 7);
let fired = 0;
(async () => {
  const e = loadEngine({ seed: SEED });
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  const mean = a => a.reduce((x,y)=>x+y,0)/a.length;
  console.log('year | prestige mean/sd | trueNow mean | archive | save MB | season s');
  for (let i = 0; i < N; i++) {
    const y = e.universe.year, t0 = Date.now();
    e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
    e.runSpringCamp(); e.runFallCamp(); e.runOffseason();
    // A fired head coach has to take a new post before the offseason can finish; without
    // this the run silently stalls the first time the controlled program's tenure ends.
    while (e.hasPendingCareerChoice()) {
      const offer = e.universe.jobOffers[0], got = e.acceptPost(offer.schoolId);
      if (!got.ok) throw new Error('could not accept a post: ' + got.reason);
      e.setUserTeam(got.team.name); fired++;
      e.runSpringCamp(); e.runFallCamp(); e.runOffseason();
    }
    const secs = ((Date.now()-t0)/1000).toFixed(1);
    const u = e.universe;
    const pres = u.teams.map(t=>t.prestige), pm = mean(pres);
    const players = u.teams.flatMap(t=>t.roster);
    const mb = (JSON.stringify({universe:u}).length/1048576).toFixed(1);
    console.log(`${y} | ${pm.toFixed(1)}/${Math.sqrt(mean(pres.map(x=>(x-pm)**2))).toFixed(1)} | ${mean(players.map(p=>p.trueNow)).toFixed(1)} | ${u.playerArchive.length} | ${mb} | ${secs}`);
  }
  // Dynasty concentration: who won?
  const champs = {};
  for (const h of e.universe.history) if (h.champion) champs[h.champion] = (champs[h.champion]||0)+1;
  console.log(`\ncareer changes (fired and re-hired): ${fired}`);
  console.log('\nchampions:', JSON.stringify(champs));
})();
