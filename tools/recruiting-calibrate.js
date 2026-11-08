// Recruiting Desk calibration.
//
// Plays full seasons with scripted recruiting policies and reports the classes they land, so a change to a
// desk constant can be judged against numbers instead of a feeling. This is how every constant in
// recruiting-actions.js was set; see docs/RECRUITING_CALIBRATION.md for how to read it and what it cannot tell you.
//
//   node tools/recruiting-calibrate.js                              all policies, all tiers, 9 seeds (about 3 minutes)
//   node tools/recruiting-calibrate.js --policies legacy,staff --tiers mid --seeds 4
//   node tools/recruiting-calibrate.js --board upside               target the 25 highest-upside prospects instead
//   node tools/recruiting-calibrate.js --tune '{"INTEREST_PIVOT=55,INTEREST_WEIGHT=.45":"INTEREST_PIVOT=60,INTEREST_WEIGHT=.45"}'
//   node tools/recruiting-calibrate.js --json                       raw numbers
//
// --tune replaces exact source text in recruiting-actions.js in memory for the run only (nothing is written), so
// a candidate value can be tried without editing the file. It fails loudly if the text is not found.
//
// Policies
//   legacy   the desk removed entirely: how the game recruited before v0.15.0 (the reference row)
//   idle     targets a board and never works it
//   casual   calls everyone, offers when a target reaches 60% interest, ignores rivals and commitments
//   staff    "Staff handle recruiting": the staff plan alone
//   skilled  works the ten most winnable targets (answers rival moves, avoids known dealbreakers, offers early,
//            books in-homes, pitches the best topic) and checks in on commitments under pressure
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const POLICIES = ['legacy', 'idle', 'casual', 'staff', 'skilled'];
// Three programs per tier, rotated by seed, so one lucky or unlucky school does not stand for a whole tier.
const TIER_INDEXES = { high: [2, 6, 10], mid: [50, 60, 70], low: [100, 108, 115] };

const argv = process.argv.slice(2);
const flag = name => argv.includes(`--${name}`);
const arg = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : fallback; };

// ------------------------------------------------------------------ worker
async function worker() {
  const policy = arg('policy'), tier = arg('tier'), board = arg('board', 'winnable');
  const seeds = arg('seeds').split(',').map(Number);
  const tune = JSON.parse(arg('tune', '{}'));
  // Patch the desk's source as the harness reads it: blank for the legacy reference, text swaps for --tune.
  const read = fs.readFileSync;
  fs.readFileSync = function (p, ...rest) {
    if (!String(p).endsWith('recruiting-actions.js')) return read.call(fs, p, ...rest);
    if (policy === 'legacy') return '';
    let src = read.call(fs, p, ...rest);
    for (const [from, to] of Object.entries(tune)) {
      if (!src.includes(from)) throw new Error(`--tune: text not found in recruiting-actions.js: ${from}`);
      src = src.replace(from, to);
    }
    return src;
  };
  const { loadEngine } = require('./harness.js');
  const rows = [];
  for (const seed of seeds) {
    const e = loadEngine({ seed, fullRuntime: true });
    await e.loadSchools();
    e.initUniverse();
    const u = () => e.universe;
    const byPrestige = [...u().teams].sort((a, b) => b.prestige - a.prestige);
    const idx = TIER_INDEXES[tier];
    const team = byPrestige[idx[seeds.indexOf(seed) % idx.length]];
    e.setUserTeam(team.name);
    const A = globalThis.DynastyRecruitingActions;
    const T = () => u().teams.find(x => x.name === team.name);
    const pool = u().recruits.filter(r => !r.committed);
    const targets = board === 'winnable'
      ? pool.filter(r => r.nationalRank <= 500).sort((a, b) => e.recruitPitch(team, b) - e.recruitPitch(team, a)).slice(0, 25)
      : pool.sort((a, b) => b.scoutUp - a.scoutUp).slice(0, 25);
    targets.forEach(r => { r.targeted = true; });
    const byPitch = [...targets].sort((a, b) => e.recruitPitch(team, b) - e.recruitPitch(team, a));
    const core = byPitch.slice(0, 10), rest = byPitch.slice(10);

    for (let week = 0; week < 12; week++) {
      if (policy === 'staff' && A) A.staffPlan(u().recruits, T());
      if (policy === 'casual' && A) {
        for (const r of targets) { if (r.committed) continue; if (!A.hasOffer(r, T()) && r.interest >= 60) A.perform(r, T(), 'offer'); A.perform(r, T(), 'call'); }
      }
      if (policy === 'skilled' && A) {
        const t = T();
        for (const r of core) {
          if (r.committed) continue;
          for (const m of A.liveMoves(r)) A.perform(r, t, m.answerWith[0]);
          if (A.knownBlock(r, t)) { A.perform(r, t, 'call'); continue; }
          if (!A.hasOffer(r, t) && r.interest >= 42) A.perform(r, t, 'offer');
          A.perform(r, t, 'inhome');
          const best = A.pitchOptions(r, t)[0];
          if (best.delta >= 2) A.perform(r, t, 'pitch', { topic: best.topic });
          A.perform(r, t, 'call');
        }
        for (const r of rest) {
          if (r.committed) continue;
          if (!A.hasOffer(r, t) && !A.knownBlock(r, t) && r.interest >= 58) A.perform(r, t, 'offer');
          A.perform(r, t, 'call');
        }
        for (const r of u().recruits) if (r.committed === team.name && A.liveMoves(r).length) A.perform(r, t, 'keep');
      }
      e.simWeek();
    }
    e.simConferenceChampionships(); e.simBowls(); e.simPlayoff();
    const mine = u().recruits.filter(r => r.committed === team.name);
    const others = u().teams.filter(x => x.name !== team.name).map(x => {
      const c = u().recruits.filter(r => r.committed === x.name);
      return c.length ? c.reduce((s, r) => s + r.stars, 0) / c.length : 0;
    });
    rows.push({
      seed, commits: mine.length, avgStars: mine.length ? mine.reduce((s, r) => s + r.stars, 0) / mine.length : 0,
      blue: mine.filter(r => r.stars >= 4).length, fromBoard: mine.filter(r => targets.includes(r)).length,
      leagueStars: others.reduce((a, b) => a + b, 0) / others.length,
    });
  }
  const mean = k => rows.reduce((s, x) => s + x[k], 0) / rows.length;
  process.stdout.write(JSON.stringify({ policy, tier, seeds: rows.length, commits: mean('commits'), avgStars: mean('avgStars'), blue: mean('blue'), fromBoard: mean('fromBoard'), leagueStars: mean('leagueStars') }) + '\n');
}

// ------------------------------------------------------------ orchestrator
function runJobs(jobs, concurrency) {
  return new Promise((resolve, reject) => {
    const results = [];
    let next = 0, active = 0, failed = false;
    const launch = () => {
      while (!failed && active < concurrency && next < jobs.length) {
        const job = jobs[next++]; active++;
        const child = spawn(process.execPath, [__filename, '--worker', '--policy', job.policy, '--tier', job.tier, '--seeds', job.seeds.join(','), '--board', job.board, '--tune', job.tune], { stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '', err = '';
        child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { err += d; });
        child.on('close', code => {
          active--;
          if (code !== 0) {
            // Show the error's message, not the tail of its stack.
            failed = true;
            const lines = err.trim().split('\n');
            reject(new Error(`${job.policy}/${job.tier} failed: ${lines.find(l => /Error/.test(l)) || lines.at(-1) || `exit ${code}`}`));
            return;
          }
          results.push(JSON.parse(out.trim().split('\n').pop()));
          if (next >= jobs.length && active === 0) resolve(results); else launch();
        });
      }
    };
    launch();
  });
}

function table(title, results, key, policies, tiers, digits, deltas) {
  const get = (p, t) => results.find(r => r.policy === p && r.tier === t)?.[key];
  const lines = [title, `${'policy'.padEnd(9)}${tiers.map(t => t.padEnd(16)).join('')}`];
  for (const p of policies) {
    lines.push(p.padEnd(9) + tiers.map(t => {
      const v = get(p, t); if (v == null) return '—'.padEnd(16);
      const ref = get('legacy', t);
      const d = deltas && p !== 'legacy' && ref != null ? ` (${v - ref >= 0 ? '+' : ''}${(v - ref).toFixed(digits)})` : '';
      return `${v.toFixed(digits)}${d}`.padEnd(16);
    }).join(''));
  }
  return lines.join('\n');
}

async function main() {
  const policies = arg('policies', POLICIES.join(',')).split(',');
  const tiers = arg('tiers', 'low,mid,high').split(',');
  const count = Number(arg('seeds', 9)), board = arg('board', 'winnable'), tune = arg('tune', '{}');
  const jobsN = Number(arg('jobs', 3));
  for (const p of policies) if (!POLICIES.includes(p)) throw new Error(`unknown policy ${p}`);
  for (const t of tiers) if (!TIER_INDEXES[t]) throw new Error(`unknown tier ${t}`);
  JSON.parse(tune);
  // The reference row is always measured, since every other row is read against it.
  const all = policies.includes('legacy') ? policies : ['legacy', ...policies];
  const seeds = Array.from({ length: count }, (_, i) => i + 1);
  const jobs = all.flatMap(policy => tiers.map(tier => ({ policy, tier, seeds, board, tune: policy === 'legacy' ? '{}' : tune })));
  const results = await runJobs(jobs, jobsN);
  if (flag('json')) { console.log(JSON.stringify(results, null, 1)); return; }
  console.log(`Recruiting calibration: ${count} seeds, board=${board}${tune !== '{}' ? ', tuned' : ''}\n`);
  console.log(table('Blue chips (4-5 star) per class, change against legacy in brackets', results, 'blue', all, tiers, 2, true));
  console.log('\n' + table('Average stars of the class', results, 'avgStars', all, tiers, 2, true));
  console.log('\n' + table('Board targets landed (of 25)', results, 'fromBoard', all, tiers, 2, true));
  const league = results.map(r => r.leagueStars);
  console.log(`\nLeague-average star rating of the other 119 classes: ${Math.min(...league).toFixed(2)} to ${Math.max(...league).toFixed(2)} (this must not move).`);
}

if (flag('worker')) worker().catch(err => { console.error(err); process.exit(1); });
else main().catch(err => { console.error(err.message); process.exit(1); });
