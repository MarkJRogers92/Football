const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const file=path.join(__dirname,'..','living-world-adapter.js');
function fixture(){
 const p={id:'p1',name:'Alex',pos:'QB',stats:{games:3},seasonHistory:[{year:2027,team:'Home'}],transferHistory:[{season:2028,fromSchoolId:1,fromSchool:'Home',toSchoolId:2}],injuryWeeks:0};
 const c={id:'c1',name:'Coach One',role:'Head Coach',careerHistory:[{schoolId:1,schoolName:'Home',role:'Offensive Coordinator',startSeason:2027,endSeason:2027}]};
 const home={id:1,name:'Home',roster:[],staff:{},schedule:[{week:4,home:'Home',away:'Away',played:false}]},away={id:2,name:'Away',w:3,l:0,rank:12,roster:[p],staff:{HC:c}};
 const u={year:2028,week:3,phase:'regular',rng:{seed:7,draws:42},teams:[home,away],events:[{id:'e1',season:2028,week:3,importance:80,summary:'A real event',schoolIds:[2]}],playerArchive:[],coachArchive:[]};
 const ctx={universe:u,selected:()=>home,T:n=>u.teams.find(x=>x.name===n),rivalOf:()=>away,archiveIsDeferred:()=>false};
 assert.ok(fs.existsSync(file),'living-world adapter exists');vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx);return{ctx,u,home,away};
}
test('the briefing reads real former players and coaches from next opponents without changing the world',()=>{
 const {ctx,u}=fixture(),before=JSON.stringify(u),s=ctx.DynastyLivingWorldSnapshot.read(['player:p1','coach:c1']);
 assert.equal(s.worldKey,'seed:7');assert.equal(s.nextGame.opponent.name,'Away');assert.equal(s.nextGame.rival,true);
 assert.ok(s.callbacks.some(x=>x.key==='player:p1'&&/Home/.test(x.detail)));assert.ok(s.callbacks.some(x=>x.key==='coach:c1'));
 assert.equal(s.people.find(x=>x.key==='coach:c1').team,'Away');assert.equal(JSON.stringify(u),before);
});
test('matching names and stale events do not create invented personal history',()=>{
 const {ctx,u,away}=fixture();away.roster[0].seasonHistory=[];away.roster[0].transferHistory=[];away.staff.HC.careerHistory=[];u.events[0].week=2;
 const s=ctx.DynastyLivingWorldSnapshot.read([]);assert.equal(s.callbacks.length,0);assert.equal(s.news.length,0);
});
test('current roster, portal and loaded archive are distinguished without hydrating history',()=>{
 const {ctx,u,away}=fixture();const p=away.roster.pop();u.transferPortal=[{p}];
 assert.equal(ctx.DynastyLivingWorldSnapshot.read(['player:p1']).people.find(x=>x.key==='player:p1').status,'portal');
 u.transferPortal=[];u.playerArchive=[{...p,lastTeam:'Away',exitReason:'Eligibility exhausted',draftResult:{status:'Drafted',label:'Round 2, Pick 3'}}];
 assert.equal(ctx.DynastyLivingWorldSnapshot.read(['player:p1']).people.find(x=>x.key==='player:p1').status,'drafted');
 u.playerArchive=[];ctx.archiveIsDeferred=()=>true;
 assert.equal(ctx.DynastyLivingWorldSnapshot.read(['player:p1']).people.some(x=>x.key==='player:p1'),false);
});
