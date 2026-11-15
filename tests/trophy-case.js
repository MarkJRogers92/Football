const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeTrophyCase}=require('../trophy-case.js');
const {loadEngine}=require('../tools/harness.js');

test('every shelf reads a record the game already keeps',()=>{
 const t={id:7,name:'Home U',allTimeRecord:{confTitles:1},rivalry:{rivalId:8,trophy:'The Old Bell',series:{w:5,l:3,holderId:7,lastYear:2033}},
  staff:{HC:{id:'C1',name:'Coach',seasons:[{year:2031,schoolId:7,role:'Head Coach',conferenceTitle:true,coachOfYear:true},{year:2032,schoolId:7,role:'Head Coach',conferenceTitle:true},{year:2032,schoolId:9,role:'Head Coach',conferenceTitle:true}]}}};
 const u={teams:[t,{id:8,name:'Rival U'}],coachArchive:[{id:'C0',name:'Old',seasons:[{year:2028,schoolId:7,role:'Head Coach',conferenceTitle:true},{year:2029,schoolId:7,role:'Offensive Coordinator',conferenceTitle:true}]}],
  history:[{type:'season',year:2032,champion:'Home U',championId:7},{type:'season',year:2031,champion:'Other',championId:3},{type:'season',year:2029,champion:'Home U'}],
  events:[{type:'BOWL_RESULT',season:2030,metadata:{winnerId:7,label:'Citrus Bowl'}},{type:'BOWL_RESULT',season:2030,metadata:{winnerId:8,label:'Sun Bowl'}}],
  awards:{2031:[{name:'National Player of the Year',playerName:'Star',team:'Home U',pos:'QB',playerId:'p1'},{name:'Receiver of the Year',playerName:'Else',team:'Rival U',pos:'WR'}]}};
 const nfl={school:()=>({top:[{c:{hof:true,name:'Legend',pos:'QB',draftYear:2027}},{c:{hof:false,name:'Good',pos:'RB'}}]})};
 const c=makeTrophyCase({getUniverse:()=>u,nfl:()=>nfl}).read(t);
 assert.deepEqual(c.national,[2032,2029],'by school id, or by name in older archives');
 assert.deepEqual(c.conference.years,[2032,2031,2028],'head coach seasons only, at this school');
 assert.equal(c.conference.total,3);
 assert.deepEqual(c.bowls,[{year:2030,label:'Citrus Bowl'}]);
 assert.deepEqual(c.awards.map(a=>a.player),['Star']);
 assert.deepEqual(c.coachOfYear,[2031]);
 assert.equal(c.rivalry.held,true);assert.equal(c.rivalry.trophy,'The Old Bell');assert.equal(c.rivalry.rival,'Rival U');
 assert.deepEqual(c.proHall.map(h=>h.name),['Legend']);
});

test('in the game, a played season fills the case and reading it stores nothing',async()=>{
 const e=loadEngine({seed:7777,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;e.simSeason();e.simConferenceChampionships();e.simPlayoff();
 const TC=globalThis.DynastyTrophyCase||e.DynastyTrophyCase,champ=e.T(u.champion);
 assert.ok(champ,'a champion was crowned');
 const before=JSON.stringify(u).length,c=TC.read(champ);
 assert.equal(JSON.stringify(u).length,before);
 assert.deepEqual(c.national,[u.year],'the champion\'s case holds this year\'s title');
 const bowlWinner=u.teams.find(t=>(u.events||[]).some(ev=>ev.type==='BOWL_RESULT'&&ev.metadata?.winnerId===t.id));
 assert.ok(bowlWinner&&TC.read(bowlWinner).bowls.length===1,'a bowl winner has one bowl on the shelf');
 const winners=Object.values(u.awards||{}).flat().filter(a=>a.team===champ.name).length;
 assert.equal(c.awards.length,winners);
});
