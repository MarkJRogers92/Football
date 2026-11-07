const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Postseason games are archived but never added to the team schedule. The Season card used to read
// only the schedule, so after a title run it showed the Week 12 result and that game's streak.
function bridge({phase,champion=null,archive=[]}){
 const user={id:1,name:'Home',conference:'Lakes',city:'Chicago',state:'IL',w:15,l:1,cw:8,cl:0,rank:1,schedule:[
  {week:11,home:'Home',away:'Rival',played:true,score:[10,24],winner:'Home'},
  {week:12,home:'Road',away:'Home',played:true,score:[17,20],winner:'Road'},
 ]};
 const teams=[user,{id:2,name:'Rival',w:1,l:1},{id:3,name:'Road',w:1,l:1},{id:4,name:'Bowl Foe',w:1,l:1}];
 const universe={year:2027,week:12,phase,champion,teams,gameArchive:archive};
 const ctx={universe,selected:()=>user,T:name=>teams.find(t=>t.name===name),confStand:()=>[user],seasonStageLabel:()=>'Season complete'};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','season-presentation-adapter.js'),'utf8'),ctx);
 return{snap:ctx.DynastyLabSeasonPresentation.snapshot(),universe};
}
const post=(id,week,label,home,away,hs,as,season=2027)=>({id,season,week,label,home:{id:0,name:home},away:{id:0,name:away},score:{home:hs,away:as}});

test('the season card reports the latest postseason game, streak and title',()=>{
 const archive=[post('cc',13,'Conference Championship','Home','Rival',31,10),post('nc',17,'National Championship','Bowl Foe','Home',7,9),post('old',17,'National Championship','Home','Rival',0,50,2026)];
 const {snap,universe}=bridge({phase:'complete',champion:'Home',archive});
 const before=JSON.stringify(universe);
 assert.equal(snap.latest.label,'National Championship');
 assert.equal(snap.latest.result,'W');assert.equal(snap.latest.userScore,9);assert.equal(snap.latest.oppScore,7);
 assert.equal(snap.streak,'W2','postseason wins extend past the Week 12 loss; last season is ignored');
 assert.equal(snap.completed,2,'regular-season progress still counts the schedule only');
 assert.equal(snap.afterRegular.title,'National champions');assert.equal(snap.afterRegular.tone,'gold');
 assert.equal(JSON.stringify(universe),before,'the bridge is read-only');
});

test('phase outlooks replace the generic no-game message without inventing results',()=>{
 assert.equal(bridge({phase:'confReady'}).snap.afterRegular.title,'Championship weekend');
 const bowl=bridge({phase:'playoffReady',archive:[post('b',14,'Rose Bowl','Home','Bowl Foe',14,21)]}).snap;
 assert.equal(bowl.latest.result,'L');assert.match(bowl.afterRegular.detail,/Lost the Rose Bowl/);
 const done=bridge({phase:'complete',champion:'Somebody'}).snap;
 assert.equal(done.afterRegular.title,'Season complete');assert.equal(done.latest.week,12);assert.equal(done.streak,'L1');
});
