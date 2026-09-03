const { loadEngine } = require('./harness.js');
(async () => {
  const e = loadEngine({ seed: 7 });
  await e.loadSchools();
  e.setUserTeam('Chicago Metropolitan');
  e.initUniverse();
  const u = e.universe;
  // what dominates the save?
  const size = o => JSON.stringify(o).length;
  const t = u.teams[0], p = t.roster[0];
  console.log('one player JSON bytes:', size(p));
  console.log('  stats', size(p.stats), 'career', size(p.career), 'rest', size(p)-size(p.stats)-size(p.career));
  console.log('one team (no roster):', size({...t, roster:[]}));
  console.log('all teams:', (size(u.teams)/1048576).toFixed(1), 'MB');
  console.log('recruits :', (size(u.recruits)/1048576).toFixed(1), 'MB');
  console.log('highSchools:', (size(u.highSchools)/1024).toFixed(0), 'KB');
  // zero-value stat keys per player
  const zeros = Object.entries(p.stats).filter(([k,v])=>v===0).length;
  console.log(`stat keys: ${Object.keys(p.stats).length}, zero-valued at season start: ${zeros}`);

  // prestige vs success over a season
  e.simSeason(); e.simConferenceChampionships(); e.simPlayoff();
  const byPres = [...u.teams].sort((a,b)=>b.prestige-a.prestige);
  const bucket = (arr,label)=>console.log(`${label}: prestige ${(arr.reduce((s,t)=>s+t.prestige,0)/arr.length).toFixed(0)} avg wins ${(arr.reduce((s,t)=>s+t.w,0)/arr.length).toFixed(2)}`);
  bucket(byPres.slice(0,20),'top20 prestige   ');
  bucket(byPres.slice(50,70),'mid20 prestige   ');
  bucket(byPres.slice(-20),'bottom20 prestige');
  const champ = u.teams.find(t=>t.name===u.champion);
  console.log(`champion ${u.champion}: prestige ${champ.prestige} (rank ${byPres.indexOf(champ)+1} of 120), record ${champ.w}-${champ.l}`);
})();
