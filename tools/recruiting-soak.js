// Multi-season soak with the Recruiting Desk switched on.
//
// The ordinary long-run tools use the engine without its extensions, so they never exercise the desk. This
// drives the controlled program through many full seasons with the desk working a board every week, and checks
// what a long dynasty could break: save growth, stuck funnels, bad numbers, class-count drift and leftovers
// from past classes.
//
//   node tools/recruiting-soak.js                      30 seasons, staff-run, seed 7
//   SEASONS=12 SEED=3 POLICY=skilled node tools/recruiting-soak.js
//   node tools/recruiting-soak.js --seasons 20 --policy staff --seed 11 --json
//
// Policies: staff (the staff handle recruiting), skilled (a player who works the winnable board; the staff
// fill in around it). Exit code 1 if any invariant fails.
const { loadEngine } = require('./harness.js');

const bytes = value => Buffer.byteLength(JSON.stringify(value));
const mb = value => value / 1048576;
const finite = (...vs) => vs.every(v => v == null || Number.isFinite(v));

async function runSoak({ seasons = 30, seed = 7, policy = 'staff', board = 25, log = () => {} } = {}) {
  const e = loadEngine({ seed, fullRuntime: true });
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  const A = globalThis.DynastyRecruitingActions;
  if (!A) throw new Error('The Recruiting Desk is not loaded in the full runtime.');
  const u = () => e.universe;
  let userName = 'Chicago Metropolitan';
  const user = () => u().teams.find(t => t.name === userName);
  const rows = [], violations = [];
  const fail = (year, what) => { violations.push(`${year}: ${what}`); log(`  VIOLATION ${year}: ${what}`); };
  let careerChanges = 0;

  // The offseason is interactive; drive it the way save-size does so a long run never freezes.
  const finishOffseason = () => {
    let guard = 0;
    while (u().phase === 'complete' && guard++ < 40) {
      if ((u().jobOffers || []).length) {
        const got = e.acceptPost(u().jobOffers[0].schoolId);
        if (!got.ok) break;
        e.setUserTeam(got.team.name); userName = got.team.name; careerChanges++;
        continue;
      }
      const phase = u().offseason?.phase;
      if (phase === 'spring') { e.runSpringCamp(); continue; }
      if (phase === 'fall') { e.runFallCamp(); continue; }
      if (!e.advanceOffseasonPhase()) break;
    }
    if (u().phase === 'preseason') e.beginSeason();
  };

  for (let i = 0; i < seasons; i++) {
    const year = u().year, started = Date.now();
    if (u().phase === 'preseason') e.beginSeason();
    const t = user();

    // The board: the most winnable prospects, the way a coach who reads the desk would build it.
    const pool = u().recruits.filter(r => !r.committed && (r.nationalRank || 1e9) <= 500);
    const targets = pool.sort((a, b) => e.recruitPitch(t, b) - e.recruitPitch(t, a)).slice(0, board);
    for (const r of targets) r.targeted = true;
    if (policy === 'staff') A.setAuto(u(), true);

    let weekHoursOver = 0;
    for (let w = 0; w < 12; w++) {
      if (policy === 'skilled') {
        const T = user();
        const live = targets.filter(r => !r.committed && !A.funnelState(r)?.cut);
        for (const r of live) {
          for (const m of A.liveMoves(r)) A.perform(r, T, m.answerWith[0]);
          if (A.knownBlock(r, T)) { A.perform(r, T, 'call'); continue; }
          if (!A.hasOffer(r, T) && r.interest >= 45) A.perform(r, T, 'offer');
          if (A.availability(r, T, 'inhome').ok) A.perform(r, T, 'inhome');
          const best = A.pitchOptions(r, T)[0];
          if (best.delta >= 2) A.perform(r, T, 'pitch', { topic: best.topic });
          A.perform(r, T, 'call');
        }
        for (const r of u().recruits) if (r.committed === T.name && A.liveMoves(r).length) A.perform(r, T, 'keep');
      }
      const T = user();
      if (A.weekInfo(T).spent > A.weekInfo(T).budget) weekHoursOver++;
      e.delegateWeeklyDecisions(T);
      e.simWeek(true); // the staff plan runs inside, for both policies; a skilled coach has already acted
    }
    if (weekHoursOver) fail(year, `${weekHoursOver} week(s) spent more hours than the budget`);

    // ---- invariants at the end of the regular season, before signing day settles everything ----
    const T = user();
    const board0 = targets;
    const stuck = board0.filter(r => !r.committed && A.funnelState(r) && !A.funnelState(r).decided && !A.funnelState(r).cut).length;
    for (const r of u().recruits) {
      if (!finite(r.interest, r.relationship) || r.interest < 1 || r.interest > 100 || r.relationship < 0 || r.relationship > 100) {
        fail(year, `${r.name} has interest ${r.interest} / relationship ${r.relationship}`); break;
      }
      const f = r.funnel;
      if (f && f.season === year && (!Number.isInteger(f.decisionWeek) || f.decisionWeek < 5 || f.decisionWeek > 11)) { fail(year, `${r.name} has decision week ${f.decisionWeek}`); break; }
    }
    const limit = A.offerLimit(T), out = A.offersOut(u().recruits, T);
    if (out > limit) fail(year, `${out} offers out against a limit of ${limit}`);

    e.simConferenceChampionships(); e.simBowls(); e.simPlayoff();

    const mine = u().recruits.filter(r => r.committed === T.name);
    const counted = u().recruitClassCounts?.[T.name] ?? 0;
    if (counted !== mine.length) fail(year, `class count ${counted} does not match ${mine.length} commitments`);
    if (mine.length > e.scholarshipCapacity(T) + 3) fail(year, `class of ${mine.length} is over capacity ${e.scholarshipCapacity(T)} by more than the over-sign allowance`);
    const desk = A.deskSummary(T);
    if (desk && desk.hours > desk.budget) fail(year, `ledger shows ${desk.hours} hours against a budget of ${desk.budget}`);
    if (desk && !finite(desk.hours, desk.budget, desk.won, desk.lost, desk.cut)) fail(year, 'ledger has a non-numeric total');

    // What the desk adds to a save, measured before the class is replaced.
    const deskBytes = u().recruits.reduce((n, r) => n + (r.recruitingActions || r.rivalWatch || r.funnel ? bytes({ a: r.recruitingActions, w: r.rivalWatch, f: r.funnel }) : 0), 0);
    const ledgerBytes = u().teams.reduce((n, t) => n + (t.recruitingSeason ? bytes(t.recruitingSeason) : 0), 0);
    const teamsWithLedger = u().teams.filter(t => t.recruitingSeason).length;

    e.runSpringCamp(); e.runFallCamp(); finishOffseason();
    if (u().year === year) { fail(year, `season did not advance (phase ${u().phase})`); break; }

    // ---- invariants after the new class arrives ----
    const now = u().year;
    const old = r => (r.recruitingActions && Object.values(r.recruitingActions).some(x => x.season < now)) || (r.rivalWatch && r.rivalWatch.season < now) || (r.funnel && r.funnel.season < now);
    const stale = u().recruits.filter(old).length;
    if (stale) fail(year, `${stale} recruits in the new class still carry the desk's records from an older season`);
    const newFunnels = u().recruits.filter(r => r.funnel).length;
    if (newFunnels) fail(year, `${newFunnels} recruits in the new class already have a funnel before any week was played`);

    // A very large save can exceed the longest string JavaScript will build; that is a result, not a crash.
    let saveMb = null;
    try { saveMb = mb(bytes(e.packUniverse(u()))); } catch (err) { fail(year, `the save is too large to measure (${err.message})`); }
    rows.push({
      year, seconds: (Date.now() - started) / 1000, class: mine.length, blue: mine.filter(r => r.stars >= 4).length,
      hours: desk?.hours ?? 0, budget: desk?.budget ?? 0, won: desk?.won ?? 0, lost: desk?.lost ?? 0, cut: desk?.cut ?? 0, flipped: desk?.flipped ?? 0,
      neverOffered: desk?.neverOffered ?? 0, stuck, deskKb: deskBytes / 1024, ledgerBytes, teamsWithLedger, saveMb, heapMb: mb(process.memoryUsage().heapUsed),
    });
    const r = rows.at(-1);
    log(`${String(year).padEnd(5)}| class ${String(r.class).padStart(2)} (${r.blue} blue) | hours ${String(r.hours).padStart(3)}/${String(r.budget).padEnd(3)} | won ${r.won} lost ${r.lost} cut ${r.cut} flipped ${r.flipped} | never offered ${r.neverOffered} | stuck ${r.stuck} | desk ${r.deskKb.toFixed(0)} KB | save ${r.saveMb == null ? 'too large to measure' : r.saveMb.toFixed(1) + ' MB'} | heap ${r.heapMb.toFixed(0)} MB | ${r.seconds.toFixed(1)}s`);
  }

  // ---- drift over the whole run ----
  if (rows.length >= 6) {
    const half = Math.floor(rows.length / 2), avg = (xs, k) => xs.reduce((n, x) => n + x[k], 0) / xs.length;
    const first = rows.slice(0, half), second = rows.slice(half);
    const sized = rows.filter(r => r.saveMb != null), fh = sized.slice(0, Math.floor(sized.length / 2)), sh = sized.slice(Math.floor(sized.length / 2));
    const growth = fh.length && sh.length ? avg(sh, 'saveMb') - avg(fh, 'saveMb') : 0;
    if (growth > 8 && process.env.SOAK_STRICT_SIZE) violations.push(`save size grew ${growth.toFixed(1)} MB between the first and second half of the run`);
    if (avg(second, 'deskKb') > avg(first, 'deskKb') * 1.5 + 50) violations.push('the desk\'s share of a save is growing over time');
    if (Math.max(...rows.map(r => r.teamsWithLedger)) > 3) violations.push('season ledgers are accumulating on programs the coach no longer controls');
  }
  return { rows, violations, careerChanges, userName };
}

module.exports = { runSoak };

if (require.main === module) {
  const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1] : fallback; };
  const json = process.argv.includes('--json');
  const options = {
    seasons: Number(arg('seasons', process.env.SEASONS || 30)), seed: Number(arg('seed', process.env.SEED || 7)),
    policy: arg('policy', process.env.POLICY || 'staff'), log: json ? () => {} : console.log,
  };
  if (!json) console.log(`Recruiting soak: ${options.seasons} seasons, seed ${options.seed}, policy ${options.policy}\n`);
  runSoak(options).then(result => {
    if (json) console.log(JSON.stringify(result, null, 1));
    else {
      const rs = result.rows, avg = k => rs.reduce((n, r) => n + r[k], 0) / Math.max(1, rs.length);
      console.log(`\n${rs.length} seasons · avg class ${avg('class').toFixed(1)} (${avg('blue').toFixed(1)} blue) · avg ${avg('hours').toFixed(0)} of ${avg('budget').toFixed(0)} hours · save ${rs[0]?.saveMb?.toFixed(1)} → ${rs.at(-1)?.saveMb?.toFixed(1) ?? 'n/a'} MB · desk ${avg('deskKb').toFixed(0)} KB · career changes ${result.careerChanges}`);
      console.log(result.violations.length ? `\nFAILED (${result.violations.length}):\n  ${result.violations.join('\n  ')}` : '\nAll invariants held.');
    }
    process.exit(result.violations.length ? 1 : 0);
  }).catch(err => { console.error(err); process.exit(2); });
}
