// Multi-season audit: runs the engine headless and reports distributions the
// handoff asks about (ratings, stats, recruiting, prestige, injuries, transfers).
const { loadEngine } = require('./harness.js');

const SEASONS = Number(process.env.SEASONS || 5);
const USER = 'Chicago Metropolitan';

function pct(arr, p) {
  if (!arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor(a.length * p))];
}
const sum = a => a.reduce((x, y) => x + y, 0);
const mean = a => (a.length ? sum(a) / a.length : 0);
const f = n => Number(n).toFixed(1);

function seasonSnapshot(e) {
  const u = e.universe;
  const players = [];
  for (const t of u.teams) for (const p of t.roster) players.push(p);
  return { u, players };
}

function report(e, year) {
  const { u, players } = seasonSnapshot(e);
  const out = [];
  const active = players.filter(p => (p.stats?.games || 0) > 0);

  const qbs = players.filter(p => p.pos === 'QB' && (p.stats.passAtt || 0) > 100)
    .map(p => p.stats.passYds).sort((a, b) => b - a);
  const rbs = players.filter(p => p.pos === 'RB').map(p => p.stats.rushYds).sort((a, b) => b - a);
  const wrs = players.filter(p => ['WR', 'TE'].includes(p.pos)).map(p => p.stats.recYds).sort((a, b) => b - a);
  const sk = players.map(p => p.stats.sacks).sort((a, b) => b - a);
  const tk = players.map(p => p.stats.tackles).sort((a, b) => b - a);

  out.push(`  passYds  top1=${qbs[0]} top10=${qbs[9]} top50=${qbs[49]} qualifiers=${qbs.length}`);
  out.push(`  rushYds  top1=${rbs[0]} top10=${rbs[9]} top50=${rbs[49]}`);
  out.push(`  recYds   top1=${wrs[0]} top10=${wrs[9]} top50=${wrs[49]}`);
  out.push(`  sacks    top1=${sk[0]} top10=${sk[9]}   tackles top1=${tk[0]} top10=${tk[9]}`);

  const rat = players.map(p => p.trueNow);
  out.push(`  trueNow  p10=${pct(rat,.10)} p50=${pct(rat,.50)} p90=${pct(rat,.90)} p99=${pct(rat,.99)} max=${Math.max(...rat)} mean=${f(mean(rat))}`);

  const rosters = u.teams.map(t => t.roster.length);
  out.push(`  roster   min=${Math.min(...rosters)} mean=${f(mean(rosters))} max=${Math.max(...rosters)}`);

  const pres = u.teams.map(t => t.prestige);
  out.push(`  prestige min=${Math.min(...pres)} p50=${pct(pres,.5)} max=${Math.max(...pres)} mean=${f(mean(pres))} sd=${f(Math.sqrt(mean(pres.map(x=>(x-mean(pres))**2))))}`);

  const injured = players.filter(p => (p.injuryWeeks || 0) > 0).length;
  const everHurt = players.filter(p => (p.injuryHistory || []).some(x => x.year === u.year)).length;
  out.push(`  injuries currently=${injured} players hurt this season=${everHurt} (${f(everHurt / players.length * 100)}% of roster)`);

  const played = active.length;
  out.push(`  usage    players with >=1 game: ${played}/${players.length} (${f(played/players.length*100)}%)`);

  // Stat concentration: what share of a team's defensive tackles go to 11 men?
  const t0 = u.teams[0];
  const dTack = t0.roster.filter(p => !['QB','RB','WR','TE','OT','OG','C','K','P'].includes(p.pos))
    .map(p => p.stats.tackles).sort((a,b)=>b-a);
  out.push(`  def depth (team 0) tackles by rank: ${dTack.slice(0,14).join(',')}`);
  return out.join('\n');
}

(async () => {
  const e = loadEngine({ seed: 20260903 });
  await e.loadSchools();
  e.setUserTeam(USER);
  const t0 = Date.now();
  e.initUniverse();
  console.log(`init: ${Date.now() - t0}ms\n`);

  const timings = [];
  for (let s = 0; s < SEASONS; s++) {
    const y = e.universe.year;
    const ts = Date.now();
    e.simSeason();
    e.simConferenceChampionships();
    e.simPlayoff();
    const tSeason = Date.now() - ts;

    console.log(`=== ${y} (champion: ${e.universe.champion}) ===`);
    console.log(report(e, y));

    const to = Date.now();
    e.runSpringCamp();
    e.runFallCamp();
    e.runOffseason();
    const tOff = Date.now() - to;
    timings.push({ y, tSeason, tOff });
    console.log(`  timing   season=${tSeason}ms offseason=${tOff}ms archive=${e.universe.playerArchive.length}\n`);
  }

  // Recruiting distribution after the last offseason.
  const u = e.universe;
  const counts = u.teams.map(t => t.roster.filter(p => p.origin?.includes('star recruit')).length);
  console.log('recruiting: signees/team this cycle min=%d mean=%s max=%d',
    Math.min(...counts), f(mean(counts)), Math.max(...counts));
  const rc = u.recruitCycle || {};
  console.log('recruiting: decommits last cycle=%d (%d flips) of %d in-season commits = %s%%',
    rc.decommits || 0, rc.flips || 0, rc.seasonCommits || 0, f(100 * (rc.decommits || 0) / Math.max(1, rc.seasonCommits || 0)));
  console.log('timings:', JSON.stringify(timings));
})();
