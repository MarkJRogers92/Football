const test=require('node:test');
const assert=require('node:assert/strict');
const adapter=require('../game-engine-v2-adapter.js');
const attribution=require('../game-engine-v2-attribution.js');

const P=(id,name,pos,skill=75)=>({id,name,pos,trueNow:skill,speed:skill,power:skill,technique:skill,iq:skill,composure:skill});
function context(prefix){
 const qb=P(`${prefix}-qb`,`${prefix} QB`,'QB',82),rb1=P(`${prefix}-rb1`,`${prefix} RB1`,'RB',84),rb2=P(`${prefix}-rb2`,`${prefix} RB2`,'RB',72),wr1=P(`${prefix}-wr1`,`${prefix} WR1`,'WR',85),wr2=P(`${prefix}-wr2`,`${prefix} WR2`,'WR',76),te=P(`${prefix}-te`,`${prefix} TE`,'TE',74),k=P(`${prefix}-k`,`${prefix} K`,'K',78),pu=P(`${prefix}-p`,`${prefix} P`,'P',76);
 const defs=['EDGE','DT','LB','CB','S'].map((pos,i)=>P(`${prefix}-d${i}`,`${prefix} ${pos}`,pos,78+i));
 const ol=['OT','OG','C','OG','OT'].map((pos,i)=>P(`${prefix}-ol${i}`,`${prefix} OL${i}`,pos,76+i));
 return{teamName:prefix,qb,rushers:[{player:rb1,weight:8},{player:rb2,weight:1},{player:qb,weight:.7}],receivers:[{player:wr1,weight:6},{player:wr2,weight:2},{player:te,weight:1}],defenders:defs.map((player,i)=>({player,weight:1+i*.08})),offensiveLine:ol.map(player=>({player,weight:1})),kicker:k,punter:pu};
}
function shadow(seed='attr-1'){
 return adapter.simulateShadow({gameId:seed,seed,home:{id:1,name:'Home'},away:{id:2,name:'Away'},homeProfile:{overall:80,offense:82,defense:78},awayProfile:{overall:77,offense:76,defense:78},homeFieldRating:2.4});
}
function attributed(seed='attr-1'){
 const s=shadow(seed),a=attribution.attributeGame(s.state,{home:context('H'),away:context('A')});return attribution.attachEventSummary(a,s.summary);
}

test('v2 adapter persists attribution-ready pass/rush metadata on regulation snaps',()=>{
 const s=shadow('metadata');const snaps=s.state.events.filter(e=>['scrimmage','interception','fumble'].includes(e.type)&&!e.ot);
 assert.ok(snaps.length>80);for(const e of snaps){assert.ok(e.kind==='pass'||e.kind==='rush',`missing kind on event ${e.seq}`);assert.equal(e.attributionVersion,1);if(e.kind==='pass'&&e.type==='scrimmage')assert.equal(typeof e.completed,'boolean')}
});

test('player attribution is deterministic and does not mutate the v2 state or contexts',()=>{
 const s=shadow('deterministic-actors'),home=context('H'),away=context('A'),beforeState=JSON.stringify(s.state),beforeContexts=JSON.stringify({home,away});
 const a1=attribution.attachEventSummary(attribution.attributeGame(s.state,{home,away}),s.summary),a2=attribution.attachEventSummary(attribution.attributeGame(s.state,{home,away}),s.summary);
 assert.deepEqual(a1,a2);assert.equal(JSON.stringify(s.state),beforeState);assert.equal(JSON.stringify({home,away}),beforeContexts)
});

test('every attributed v2 box reconciles player totals, team totals and event yards',()=>{
 for(let i=0;i<40;i++){const a=attributed(`reconcile-${i}`);assert.equal(a.reconciliation.ok,true,a.reconciliation.errors.join('; '));for(const side of ['home','away']){const t=a.teamStats[side];assert.equal(t.plays,t.passAtt+t.rushAtt);assert.equal(t.turnovers,t.int+t.fumblesLost);assert.equal(t.passYds+t.rushYds,a.eventSummary[side].yards)}}
});

test('depth-chart weights create meaningful primary-player usage without monopolizing touches',()=>{
 let rb1=0,rb2=0,wr1=0,wr2=0;
 for(let i=0;i<80;i++){
  const a=attributed(`usage-${i}`),rows=a.playerStats.home,by=id=>rows.find(x=>x.id===id)?.stats||{};rb1+=by('H-rb1').rushAtt||0;rb2+=by('H-rb2').rushAtt||0;wr1+=by('H-wr1').targets||0;wr2+=by('H-wr2').targets||0;
 }
 assert.ok(rb1>rb2*3,`RB1 ${rb1} vs RB2 ${rb2}`);assert.ok(rb2>0);assert.ok(wr1>wr2*2,`WR1 ${wr1} vs WR2 ${wr2}`);assert.ok(wr2>0)
});

test('leaders are sourced from the attributed real-player lines',()=>{
 const a=attributed('leaders'),l=attribution.leaders(a,'home');assert.ok(l.passer?.id);assert.ok(l.rusher?.id);assert.ok(l.receiver?.id);assert.ok(l.defender?.id);assert.ok(a.playerStats.home.some(x=>x.id===l.passer.id))
});
