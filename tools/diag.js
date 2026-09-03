// Focused diagnostics for the anomalies the audit surfaced.
const { loadEngine } = require('./harness.js');
(async () => {
  const e = loadEngine({ seed: 20260903 });
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  const u = e.universe;

  // 1. How often does one player occupy several rushing / defensive roles?
  let dupRush = 0, teams = 0, rushUnique = [], defUnique = [];
  for (const t of u.teams) {
    teams++;
    const ids = ['RB1','3DRB','PWRB'].map(r => e.roleStarter(t, r)).filter(Boolean).map(p => p.id);
    rushUnique.push(new Set(ids).size);
    if (new Set(ids).size < ids.length) dupRush++;
    const dids = ['MIKE','WILL','BOXS','FS','BCB','FCB','NICKEL','RUSH','SETEDGE','3TECH','NT']
      .map(r => e.roleStarter(t, r)).filter(Boolean).map(p => p.id);
    defUnique.push(new Set(dids).size);
  }
  const mean = a => a.reduce((x,y)=>x+y,0)/a.length;
  console.log(`rush roles: ${dupRush}/${teams} teams have a duplicate among RB1/3DRB/PWRB; unique starters avg ${mean(rushUnique).toFixed(2)}/3`);
  console.log(`def roles : unique defenders avg ${mean(defUnique).toFixed(2)}/11 (min ${Math.min(...defUnique)})`);

  // 2. Single-game attribution check on one team.
  const t = u.teams[0];
  const rb1 = e.roleStarter(t,'RB1'), d3 = e.roleStarter(t,'3DRB'), pw = e.roleStarter(t,'PWRB');
  console.log(`team0 RB1=${rb1?.name} 3DRB=${d3?.name} PWRB=${pw?.name}`);
  const before = rb1.stats.rushYds;
  e.simWeek();
  console.log(`after 1 week: RB1 rushYds ${before} -> ${rb1.stats.rushYds}, team box check below`);
  const g = t.schedule.find(x => x.played);
  console.log('team0 game:', g ? `${g.away} @ ${g.home} ${g.score}` : 'bye');

  // 3. Where does the time go?
  const marks = {};
  const wrap = (name, fn) => (...a) => { const s = process.hrtime.bigint(); const r = fn(...a); marks[name] = (marks[name]||0n) + (process.hrtime.bigint()-s); return r; };
  console.log('\n-- season timing breakdown (sampled via repeated calls) --');
  let s = Date.now(); for (let i=0;i<200;i++) e.profiles(u.teams[i%120]); console.log(`profiles()  x200 = ${Date.now()-s}ms`);
  s = Date.now(); for (let i=0;i<20;i++) e.ranked(); console.log(`ranked()    x20  = ${Date.now()-s}ms`);
  s = Date.now(); for (let i=0;i<3;i++) e.advanceRecruiting(); console.log(`advanceRecruiting() x3 = ${Date.now()-s}ms`);
  s = Date.now(); for (let i=0;i<200;i++) e.participants(u.teams[i%120]); console.log(`participants() x200 = ${Date.now()-s}ms`);

  // 4. Save size.
  const json = JSON.stringify({ universe: u });
  console.log(`\nsave size (season 1, empty archive): ${(json.length/1024/1024).toFixed(2)} MB`);
})();
