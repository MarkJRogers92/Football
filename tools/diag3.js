// Recruiting and development diagnostics.
const { loadEngine } = require('./harness.js');
const mean = a => (a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0);
const corr = (x,y) => { const mx=mean(x),my=mean(y);
  const cov=mean(x.map((v,i)=>(v-mx)*(y[i]-my)));
  const sx=Math.sqrt(mean(x.map(v=>(v-mx)**2))),sy=Math.sqrt(mean(y.map(v=>(v-my)**2)));
  return sx&&sy?cov/(sx*sy):0; };

(async () => {
  const e = loadEngine({ seed: 991 });
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  const u = e.universe;

  // Track the FR class of season 1 so we can follow real four-year arcs.
  const tracked = new Map();
  for (const t of u.teams) for (const p of t.roster)
    if (e.eligibilityBase(p) === 0) tracked.set(p.id, { start: p.trueNow, upside: p.upside, profile: p.growthProfile });

  e.simSeason(); e.simConferenceChampionships();

  // --- recruiting, measured before finalizeRecruiting force-assigns leftovers
  const organic = u.recruits.filter(r => r.committed).length;
  console.log(`ORGANIC COMMITS by end of regular season: ${organic}/${u.recruits.length} (${(organic/u.recruits.length*100).toFixed(0)}%)`);
  const starsCommitted = {};
  for (const r of u.recruits) if (r.committed) starsCommitted[r.stars] = (starsCommitted[r.stars]||0)+1;
  const starsAll = {};
  for (const r of u.recruits) starsAll[r.stars] = (starsAll[r.stars]||0)+1;
  console.log('recruit pool by stars:', JSON.stringify(starsAll));
  console.log('committed by stars   :', JSON.stringify(starsCommitted));

  e.simPlayoff();  // runs finalizeRecruiting
  const unsigned = u.recruits.filter(r => !r.committed).length;
  console.log(`UNSIGNED after signing day: ${unsigned} (every recruit finds a home if 0)`);
  const sizes = u.teams.map(t => u.recruits.filter(r => r.committed === t.name).length);
  console.log(`class size: min=${Math.min(...sizes)} mean=${mean(sizes).toFixed(1)} max=${Math.max(...sizes)}`);

  // class quality vs prestige
  const classScore = t => { const rs = u.recruits.filter(r => r.committed === t.name);
    return rs.reduce((s,r)=>s+Math.pow(r.stars,2.4),0); };
  const pres = u.teams.map(t=>t.prestige), qual = u.teams.map(classScore);
  console.log(`corr(prestige, class quality) = ${corr(pres,qual).toFixed(2)}`);
  const byP=[...u.teams].sort((a,b)=>b.prestige-a.prestige);
  const blueChip = t => u.recruits.filter(r=>r.committed===t.name&&r.stars>=4).length;
  console.log(`4-5 star signees: top20 prestige ${mean(byP.slice(0,20).map(blueChip)).toFixed(1)}/class, bottom20 ${mean(byP.slice(-20).map(blueChip)).toFixed(1)}/class`);
  console.log(`decommits/flips possible: ${/decommit|flip/i.test(require('fs').readFileSync(__dirname+'/../app.js','utf8')) ? 'yes' : 'NO — commitments are permanent'}`);

  // --- development over four years
  e.runSpringCamp(); e.runFallCamp(); e.runOffseason();
  for (let i=0;i<3;i++){ e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
    e.runSpringCamp(); e.runFallCamp(); e.runOffseason(); }

  const arcs = [];
  for (const t of u.teams) for (const p of t.roster) {
    const s = tracked.get(p.id);
    if (s) arcs.push({ delta: p.trueNow - s.start, headroom: s.upside - s.start, profile: s.profile });
  }
  for (const p of u.playerArchive) {
    const s = tracked.get(p.id);
    if (s && p.perceived != null) arcs.push({ delta: p.perceived - s.start, headroom: s.upside - s.start, profile: s.profile });
  }
  const d = arcs.map(a=>a.delta).sort((a,b)=>a-b);
  console.log(`\nFOUR-YEAR ARCS (n=${d.length}) trueNow change FR -> exit`);
  console.log(`  p05=${d[Math.floor(d.length*.05)]} p25=${d[Math.floor(d.length*.25)]} median=${d[Math.floor(d.length*.5)]} p75=${d[Math.floor(d.length*.75)]} p95=${d[Math.floor(d.length*.95)]}`);
  console.log(`  busts (grew <= 2): ${(arcs.filter(a=>a.delta<=2).length/arcs.length*100).toFixed(0)}%   breakouts (grew >= 15): ${(arcs.filter(a=>a.delta>=15).length/arcs.length*100).toFixed(0)}%`);
  console.log(`  headroom realised: ${(mean(arcs.map(a=>a.headroom>0?a.delta/a.headroom:0))*100).toFixed(0)}% of upside on average`);
  const byProfile = {};
  for (const a of arcs) (byProfile[a.profile] ??= []).push(a.delta);
  console.log('  by hidden profile:', Object.entries(byProfile).map(([k,v])=>`${k}=${mean(v).toFixed(1)}`).join(' '));
})();
