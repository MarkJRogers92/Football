const test=require('node:test');
const assert=require('node:assert/strict');
const adapter=require('../game-engine-v2-adapter.js');
const attribution=require('../game-engine-v2-attribution.js');
const transaction=require('../game-engine-v2-transaction.js');

const statTemplate=()=>({games:0,starts:0,snaps:0,passAtt:0,passComp:0,passYds:0,passTD:0,int:0,sacksTaken:0,rushAtt:0,rushYds:0,rushTD:0,fumbles:0,targets:0,receptions:0,recYds:0,recTD:0,drops:0,yac:0,tackles:0,tfl:0,sacks:0,pressures:0,intDef:0,passBreakups:0,forcedFumbles:0,sacksAllowed:0,pressuresAllowed:0,penalties:0,fgMade:0,fgAtt:0,punts:0,puntYds:0});
const P=(id,name,pos,skill=75)=>({id,name,pos,trueNow:skill,speed:skill,power:skill,technique:skill,iq:skill,composure:skill,stats:statTemplate()});
function team(prefix,id){
  const roster=[
    P(`${prefix}-qb`,`${prefix} QB`,'QB',82),P(`${prefix}-rb1`,`${prefix} RB1`,'RB',84),P(`${prefix}-rb2`,`${prefix} RB2`,'RB',72),
    P(`${prefix}-wr1`,`${prefix} WR1`,'WR',85),P(`${prefix}-wr2`,`${prefix} WR2`,'WR',76),P(`${prefix}-te`,`${prefix} TE`,'TE',74),
    ...['OT','OG','C','OG','OT'].map((pos,i)=>P(`${prefix}-ol${i}`,`${prefix} OL${i}`,pos,76+i)),
    ...['EDGE','DT','LB','CB','S'].map((pos,i)=>P(`${prefix}-d${i}`,`${prefix} ${pos}`,pos,78+i)),
    P(`${prefix}-k`,`${prefix} K`,'K',78),P(`${prefix}-p`,`${prefix} P`,'P',76)
  ];
  return{id,name:`${prefix} State`,rank:12,w:3,l:1,cw:2,cl:0,pf:140,pa:80,sos:250,roster};
}
function byId(t,id){return t.roster.find(p=>p.id===id)}
function context(t,prefix){
  const get=id=>byId(t,`${prefix}-${id}`);
  return{teamName:t.name,qb:get('qb'),rushers:[{player:get('rb1'),weight:8},{player:get('rb2'),weight:1},{player:get('qb'),weight:.7}],receivers:[{player:get('wr1'),weight:6},{player:get('wr2'),weight:2},{player:get('te'),weight:1}],defenders:[0,1,2,3,4].map((i)=>({player:get(`d${i}`),weight:1+i*.08})),offensiveLine:[0,1,2,3,4].map(i=>({player:get(`ol${i}`),weight:1})),kicker:get('k'),punter:get('p')};
}
function starterIds(prefix){return [`${prefix}-qb`,`${prefix}-rb1`,`${prefix}-wr1`,`${prefix}-wr2`,`${prefix}-te`,...Array.from({length:5},(_,i)=>`${prefix}-ol${i}`),...Array.from({length:5},(_,i)=>`${prefix}-d${i}`)];}
function fixture(seed='transaction-1'){
  const home=team('H',1),away=team('A',2);
  const preview=adapter.simulateShadow({gameId:seed,seed,home,away,homeProfile:{overall:82,offense:84,defense:80},awayProfile:{overall:77,offense:76,defense:78},homeFieldRating:2.4});
  const actors=attribution.attributeGame(preview.state,{home:context(home,'H'),away:context(away,'A')});
  attribution.attachEventSummary(actors,preview.summary);
  const candidate=transaction.buildCandidate({state:preview.state,attribution:actors,homeTeam:home,awayTeam:away,starterIds:{home:starterIds('H'),away:starterIds('A')},meta:{season:2027,week:5,phase:'regular',label:'Regular season',venue:'H State'},conference:true,homeOpponentOverall:77,awayOpponentOverall:82});
  return{home,away,preview,actors,candidate};
}

test('transaction candidate maps v2 score, box and real-player lines into archive-compatible shapes',()=>{
  const {home,away,candidate}=fixture('shape');
  const check=transaction.validateCandidate(candidate,{homeRoster:home.roster,awayRoster:away.roster});
  assert.equal(check.ok,true,check.errors.join('; '));
  assert.equal(candidate.box.home.pts,candidate.hp);assert.equal(candidate.box.away.pts,candidate.ap);
  assert.ok(candidate.playerStats.home.some(x=>x.stats.games===1));
  assert.ok(candidate.playerStats.home.some(x=>x.stats.starts===1));
  assert.ok(Number.isFinite(candidate.scoreAdjustment.home));
});

test('dry run mutates cloned records and player stats but leaves original teams byte-for-byte unchanged',()=>{
  const {home,away,candidate}=fixture('immutability'),before=JSON.stringify({home,away});
  const proof=transaction.dryRunTransaction({candidate,homeTeam:home,awayTeam:away});
  assert.equal(proof.ok,true);assert.equal(JSON.stringify({home,away}),before);
  assert.notEqual(JSON.stringify(proof.homeClone),JSON.stringify(home));
  const winningClone=candidate.winner===home.name?proof.homeClone:proof.awayClone;
  const winningOriginal=candidate.winner===home.name?home:away;
  assert.equal(winningClone.w,winningOriginal.w+1);
  const qbLine=candidate.playerStats.home.find(x=>x.id==='H-qb');
  if(qbLine?.stats.passAtt)assert.equal(byId(proof.homeClone,'H-qb').stats.passAtt,qbLine.stats.passAtt);
});

test('archive dry-run candidate mirrors finishGame core contract and score adjustment math',()=>{
  const {home,away,candidate}=fixture('archive');
  const record=transaction.buildArchiveCandidate(candidate,{homeBefore:home,awayBefore:away,id:'V2_TEST'});
  const check=transaction.validateArchiveCandidate(record,{homeRoster:home.roster,awayRoster:away.roster});
  assert.equal(check.ok,true,check.errors.join('; '));
  assert.equal(record.id,'V2_TEST');assert.equal(record.final,true);assert.equal(record.detailed,true);
  assert.deepEqual(record.score,{home:candidate.hp,away:candidate.ap});
  assert.equal(record.scoreAdjustment.home,candidate.hp-((record.teamStats.home.passTD+record.teamStats.home.rushTD)*7+record.teamStats.home.fgMade*3));
  assert.ok(Array.isArray(record.playerStats.home));assert.ok(Array.isArray(record.injuries));assert.ok(Array.isArray(record.drives));
});

test('transaction validation rejects unknown players and unknown stat keys before mutation',()=>{
  const {home,away,candidate}=fixture('reject');
  const bad=JSON.parse(JSON.stringify(candidate));bad.playerStats.home.push({id:'ghost',name:'Ghost',pos:'QB',stats:{passAtt:1}});
  let check=transaction.validateCandidate(bad,{homeRoster:home.roster,awayRoster:away.roster});assert.equal(check.ok,false);assert.ok(check.errors.some(x=>x.includes('unknown player')));
  const badStat=JSON.parse(JSON.stringify(candidate));badStat.playerStats.home[0].stats.magicYards=4;
  check=transaction.validateCandidate(badStat,{homeRoster:home.roster,awayRoster:away.roster});assert.equal(check.ok,false);assert.ok(check.errors.some(x=>x.includes('unknown stat')));
});

test('40 seeded v2 games survive the full attribution-to-transaction dry-run contract',()=>{
  for(let i=0;i<40;i++){
    const {home,away,candidate}=fixture(`dryrun-${i}`);
    const proof=transaction.dryRunTransaction({candidate,homeTeam:home,awayTeam:away});
    assert.equal(proof.ok,true);assert.equal(proof.archive.engine,'v2');assert.equal(proof.archive.score.home,candidate.hp);
  }
});
