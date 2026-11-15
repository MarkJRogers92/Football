const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeDynastyPage}=require('../dynasty-page.js');
const {loadEngine}=require('../tools/harness.js');

test('the dynasty page sums every post, splits the current one by decade and names the people',()=>{
 const u={careerHistory:[{school:'Old U',startYear:2027,endYear:2029,w:20,l:16,seasons:3,titles:0,confTitles:1}],
  tenure:{school:'New U',startYear:2030,closed:false,seasons:[{year:2030,w:9,l:4},{year:2031,w:13,l:1,champ:true,confChamp:true},{year:2040,w:11,l:2,confChamp:true}]},
  awards:{2028:[{name:'Receiver of the Year',playerName:'A',team:'Old U',pos:'WR'}],2031:[{name:'National Player of the Year',playerName:'B',team:'New U',pos:'QB',playerId:'b'},{name:'X',playerName:'C',team:'Other',pos:'S'}],2026:[{name:'Y',playerName:'D',team:'Old U',pos:'RB'}]},
  draftHistory:{2031:[{round:1,pick:3,playerName:'B',pos:'QB',school:'New U'},{round:2,playerName:'E',school:'New U'}],2029:[{round:1,pick:9,playerName:'F',pos:'OT',school:'Old U'}]}};
 const D=makeDynastyPage({getUniverse:()=>u,rivals:()=>({nemesis:()=>({name:'Stone',w:0,l:3}),favourite:()=>null}),rivalry:()=>({name:'Rival U',trophy:'The Bell',w:6,l:2})}).read();
 assert.equal(D.seasons,6);assert.equal(D.w,53);assert.equal(D.l,23);assert.equal(D.posts,2);
 assert.equal(D.titles,1);assert.equal(D.confTitles,3);
 assert.deepEqual(D.decades.map(x=>[x.from,x.w,x.l,x.titles]),[[2030,22,5,1],[2040,11,2,0]]);
 assert.equal(D.best.year,2031,'a title season is the best team');
 assert.deepEqual(D.awards.map(a=>a.player),['B','A'],'only awards won where and when you coached');
 assert.deepEqual(D.firsts.map(f=>f.player),['B','F']);
 assert.equal(D.nemesis.name,'Stone');assert.equal(D.rival.trophy,'The Bell');
 assert.equal(makeDynastyPage({getUniverse:()=>({})}).read(),null,'nothing before a first post');
});

test('in the game, a finished season shows on the dynasty page and reading it stores nothing',async()=>{
 const e=loadEngine({seed:7171,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const u=e.universe;e.simSeason();e.simConferenceChampionships();e.simBowls();e.simPlayoff();
 u.offseason=e.makeOffseasonState(u.year,'review');e.offseasonReview();
 const P=globalThis.DynastyPage||e.DynastyPage,before=JSON.stringify(u).length,d=P.read();
 assert.equal(JSON.stringify(u).length,before);
 const t=e.T('Chicago Metropolitan');
 assert.equal(d.seasons,1);assert.equal(d.w,t.w);assert.equal(d.l,t.l);assert.equal(d.decades.length,1);
});
