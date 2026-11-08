const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Stories=require('../storylines'),P=require('../weekly-player-stories-engine');
const rb=(id,name,extra={})=>({id,name,pos:'RB',stats:{games:5,rushYds:0},career:{rushYds:0},seasonHistory:[],...extra});
function snapshot(u,team=u.teams[0],deferred=false){
 const ctx={universe:u,selected:()=>team,eligibilityLabel:()=> 'JR',showPlayerProfile(){},allActivePlayers:()=>[],archiveIsDeferred:()=>deferred,DynastyPlayerStories:P};ctx.globalThis=ctx;
 vm.runInNewContext(fs.readFileSync(require.resolve('../storyline-snapshot-adapter'),'utf8'),ctx);
 return ctx.DynastyStorylineSnapshot.read();
}
const world=()=>({year:2028,week:1,phase:'regular',playerArchive:[],teams:[{id:1,name:'Old U',roster:[]},{id:2,name:'Home U',roster:[]}],gameArchive:[]});
function transferFixture(){
 const u=world(),p=rb('transfer','Transfer',{career:{rushYds:3500},seasonHistory:[{year:2027,team:'Old U',pos:'RB',games:12,rushYds:3500}],stats:{games:5,rushYds:500}});
 u.teams[0].roster=[rb('old','Old challenger',{stats:{games:5,rushYds:3400}})];u.teams[1].roster=[p,rb('home','Home challenger',{stats:{games:5,rushYds:600}})];return {u,p};
}

test('a transfer contributes exactly 3500 and 500 at the two schools, including active challengers',()=>{
 const {u}=transferFixture(),old=snapshot(u).team[0].record,home=snapshot(u,u.teams[1]).team;
 assert.ok(old,'active school record candidates must be included');assert.equal(old.value,3500);assert.equal(old.total,3400);assert.equal(old.holder,'Transfer');
 const tr=home.find(p=>p.id==='transfer');assert.equal(tr.record.total,500);assert.equal(tr.record.value,600);assert.equal(tr.record.holder,'Home challenger');assert.notEqual(Stories.detect(tr)[0]?.title,'Owns the school record');
});

test('school production is not doubled at season archival or after retirement',()=>{
 const {u,p}=transferFixture();p.seasonHistory.push({year:2028,team:'Home U',pos:'RB',games:5,rushYds:500});p.career.rushYds=4000;u.phase='complete';
 let model=snapshot(u,u.teams[1]).team.find(x=>x.id===p.id);assert.ok(model.record,'school comparison must exist before retirement');assert.equal(model.record.total,500);
 u.teams[1].roster=u.teams[1].roster.filter(x=>x.id!==p.id);u.playerArchive.push({...p,lastTeam:'Home U',retiredYear:2028});
 assert.equal(snapshot(u).team[0].record.value,3500);model=snapshot(u,u.teams[1]).team[0];assert.equal(model.record.value,500);assert.equal(model.record.total,600);
 const saved=JSON.parse(JSON.stringify(u));assert.equal(snapshot(saved,saved.teams[1]).team[0].record.value,500);
});

test('a school-record tie reads tied, and incomplete or deferred history claims only known production',()=>{
 const {u}=transferFixture();u.teams[1].roster[1].stats.rushYds=500;
 let pl=snapshot(u,u.teams[1]).team[0],arc=Stories.detect(pl).find(a=>a.type==='record_chase');assert.ok(arc,'equal active leaders must be compared');assert.match(arc.title,/tied/i);assert.doesNotMatch(arc.summary,/0 short/);
 u.playerArchive.push(rb('legacy','Legacy',{lastTeam:'Home U',career:{rushYds:9000}}));
 pl=snapshot(u,u.teams[1]).team[0];assert.equal(pl.record.total,500);assert.equal(Stories.detect(pl).some(a=>/school record/i.test(a.title)),false);
 pl=snapshot(world(),undefined,true);assert.ok(pl);
 const {u:deferred}=transferFixture();pl=snapshot(deferred,deferred.teams[1],true).team[0];assert.equal(Stories.detect(pl).some(a=>/school record/i.test(a.title)),false);
});

test('adapter carries the actual redshirt season and does not invent its reason',()=>{
 const u=world();u.teams[0].roster=[rb('rs','Redshirt',{redshirtUsed:true,redshirtSeason:2027,seasonHistory:[{year:2026,team:'Old U',games:1,rushYds:10},{year:2027,team:'Old U',games:3,rushYds:20}],stats:{games:5,rushYds:800}})];
 const pl=snapshot(u).team[0];assert.equal(pl.redshirtSeason,2027);const arc=Stories.detect(pl).find(a=>a.type==='redshirt_payoff');assert.match(arc.summary,/2027/);assert.doesNotMatch(arc.summary,/2026|to save|injur|bench/);
 delete u.teams[0].roster[0].redshirtSeason;assert.equal(Stories.detect(snapshot(u).team[0]).some(a=>a.type==='redshirt_payoff'),false);
});
