const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loadEngine}=require('../tools/harness');

async function playedSeason(seed,weeks=5){
 const e=loadEngine({seed});e.setUserTeam('Chicago Metropolitan');await e.loadSchools();e.initUniverse();
 for(let i=0;i<weeks;i++)e.simWeek();
 return e;
}

test('every archived game produces a recap that names the winner and the real score',async()=>{
 const e=await playedSeason(971,4),games=e.universe.gameArchive;
 assert.ok(games.length>200);
 for(const g of games){
  const {body}=e.gameRecap(g);
  assert.ok(body.length>60,`recap too short for ${g.id}: ${body}`);
  const homeWon=g.score.home>=g.score.away,win=homeWon?g.home:g.away,lose=homeWon?g.away:g.home;
  const wPts=homeWon?g.score.home:g.score.away,lPts=homeWon?g.score.away:g.score.home;
  assert.ok(body.includes(win.name),`winner missing from recap: ${body}`);
  assert.ok(body.includes(lose.name),`loser missing from recap: ${body}`);
  assert.ok(body.includes(`${wPts}–${lPts}`),`final score missing from recap: ${body}`);
  // The winner is always named before the loser in the result sentence.
  assert.ok(body.indexOf(win.name)<body.indexOf(lose.name),`loser named first: ${body}`);
 }
});

test('a recap never invents a clock, a quarter or an attendance figure',async()=>{
 // The engine stores no timing data, so recap prose must never imply any.
 const e=await playedSeason(972,4);
 const banned=/\b(quarter|halftime|fourth-quarter|first half|second half|minutes? (left|remaining)|overtime|attendance|crowd of|with .* to play|final seconds)\b/i;
 for(const g of e.universe.gameArchive){
  const {body}=e.gameRecap(g);
  assert.ok(!banned.test(body),`recap invented timing/context: ${body}`);
 }
});

test('recaps are deterministic and never draw from the simulation RNG',async()=>{
 const e=await playedSeason(973,3),g=e.universe.gameArchive[0];
 const first=e.gameRecap(g).body;
 for(let i=0;i<5;i++)assert.equal(e.gameRecap(g).body,first,'same game must always read the same way');
 // Recap wording comes from its own stream keyed to the game id. If it drew
 // from Math.random instead, simply reading history would shift every future
 // simulated result, so assert directly that it never touches it.
 const real=Math.random;let draws=0;
 Math.random=()=>{draws++;return real()};
 try{for(const x of e.universe.gameArchive)e.gameRecap(x)}finally{Math.random=real}
 assert.equal(draws,0,'generating recaps consumed simulation randomness');
 // Two different games must not read identically just because they are seeded.
 const bodies=new Set(e.universe.gameArchive.slice(0,80).map(x=>e.gameRecap(x).body));
 assert.ok(bodies.size>=70,`recaps are too repetitive: ${bodies.size} distinct out of 80`);
});

test('recap claims match the box score they were derived from',async()=>{
 const e=await playedSeason(974,4);
 for(const g of e.universe.gameArchive){
  const {body}=e.gameRecap(g),homeWon=g.score.home>=g.score.away;
  const w=homeWon?'home':'away',l=homeWon?'away':'home';
  const wYds=g.teamStats[w].passYds+g.teamStats[w].rushYds,lYds=g.teamStats[l].passYds+g.teamStats[l].rushYds;
  if(/shut out|blanked/.test(body))assert.equal(g.score[l],0,`claimed a shutout that was not one: ${body}`);
  if(/outgained/.test(body))assert.ok(wYds<lYds,`claimed the winner was outgained when it was not: ${body}`);
  if(/won the turnover battle|difference was the ball/.test(body))
   assert.ok((g.teamStats[l].turnovers||0)>(g.teamStats[w].turnovers||0),`claimed a turnover edge that did not exist: ${body}`);
  // Any yardage figure quoted must be a real team or player total.
  const teamTotals=new Set([wYds,lYds,g.teamStats[w].passYds,g.teamStats[w].rushYds,g.teamStats[l].passYds,g.teamStats[l].rushYds]);
  for(const n of (body.match(/(\d+) yards/g)||[])){
   const v=Number(n.match(/\d+/)[0]);
   const legal=teamTotals.has(v)||(g.playerStats[w]||[]).concat(g.playerStats[l]||[])
    .some(p=>p.stats.passYds===v||p.stats.rushYds===v||p.stats.recYds===v);
   assert.ok(legal,`recap quoted a yardage figure not in the box score (${v}): ${body}`);
  }
 }
});

test('a mentioned injury is a real, multi-week injury from that game',async()=>{
 const e=await playedSeason(975,4);
 for(const g of e.universe.gameArchive){
  const {body}=e.gameRecap(g),m=body.match(/lost ([^)]+?) to injury \(([^,)]+)(?:, (\d+) weeks?)?\)/);
  if(!m)continue;
  const hit=(g.injuries||[]).find(x=>x.name===m[1]);
  assert.ok(hit,`recap named an injury that is not in the record: ${body}`);
  assert.ok((hit.weeks||0)>=3,`a minor knock should not be reported as news: ${body}`);
 }
});

test('the weekly newsletter scopes to the program, the conference or the nation',async()=>{
 const e=await playedSeason(976,3),u=e.universe,me='Chicago Metropolitan',conf=e.T(me).conference;
 const season=u.year,week=u.gameArchive[u.gameArchive.length-1].week;
 const team=e.weeklyNewsletter(season,week,'team',me);
 assert.ok(team,'the controlled program should have a newsletter for a played week');
 assert.ok([team.lead.game,...team.items.map(x=>x.game)].every(g=>g.home.name===me||g.away.name===me));
 const league=e.weeklyNewsletter(season,week,'conference',me);
 assert.ok([league.lead.game,...league.items.map(x=>x.game)]
  .every(g=>[g.home.name,g.away.name].some(n=>e.T(n).conference===conf)));
 const national=e.weeklyNewsletter(season,week,'national',me);
 assert.ok(national.items.length+1>=league.items.length+1,'national coverage is at least as wide as the conference');
 assert.ok(national.note.includes(me),'the note tracks the controlled program');
 assert.equal(e.weeklyNewsletter(season,99,'national',me),null,'a week with no games has no newsletter');
});

test('the newsletter leads with the most newsworthy game in scope',async()=>{
 const e=await playedSeason(977,4),u=e.universe,me='Chicago Metropolitan';
 const week=u.gameArchive[u.gameArchive.length-1].week;
 const letter=e.weeklyNewsletter(u.year,week,'national',me);
 const all=[letter.lead.game,...letter.items.map(x=>x.game)];
 const leadWeight=e.newsWeight(letter.lead.game);
 for(const g of all)assert.ok(e.newsWeight(g)<=leadWeight,'an item outranked the lead story');
});

test('recaps work on an archived game from a save that predates them',async()=>{
 // Recaps are derived, never stored, so a round-tripped save still reads.
 const e=await playedSeason(978,3),u=e.universe,before=e.gameRecap(u.gameArchive[0]).body;
 const portable=JSON.parse(JSON.stringify(e.packUniverse(u)));
 // Strip anything a v0.9.6 save would not have carried.
 for(const g of portable.gameArchive)delete g.recap;
 e.installSave({version:'0.9.6',userTeam:'Chicago Metropolitan',universe:portable});
 assert.equal(e.gameRecap(e.universe.gameArchive[0]).body,before,'an older save must produce the same recap');
});
