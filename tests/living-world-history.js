const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const L=require('../legacy');
function adapter(file,universe,team){
 const ctx={universe,selected:()=>team,rivalOf:()=>null,T:name=>universe.teams.find(t=>t.name===name)};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),ctx);return ctx;
}
const facts=over=>({key:'Home|2027|Coach',year:2027,coach:'Coach',program:{id:1,name:'Home'},seasons:[],current:{w:10,l:4,champ:false,confChamp:true,regularDone:true},adminConfidence:65,...over});
test('a conference title in the admin review is not a national title in Legacy',()=>{
 const team={id:1,name:'Home',staff:{HC:{name:'Coach'}},w:10,l:4};
 const u={year:2027,phase:'complete',teams:[team],champion:'Other',confChamps:[1],history:[{type:'season',year:2027,championId:2,champion:'Other'}],tenure:{school:'Home',startYear:2027,seasons:[{year:2027,w:10,l:4,champ:true,confChamp:true}]}};
 const before=JSON.stringify(u),f=adapter('legacy-snapshot-adapter.js',u,team).DynastyLegacySnapshot.read();
 assert.ok(f);assert.equal(f.seasons[0].champ,false);assert.equal(f.seasons[0].confChamp,true);assert.equal(f.current.regularDone,true);
 assert.equal(JSON.stringify(u),before);
 u.history[0].championId=1;u.history[0].champion='Home';
 assert.equal(adapter('legacy-snapshot-adapter.js',u,team).DynastyLegacySnapshot.read().seasons[0].champ,true);
});
test('Legacy counts each season once even while its result is also current',()=>{
 const f=facts({seasons:[{year:2027,w:10,l:4,champ:false,confChamp:true}]});
 const s=L.merge(L.emptyStore(),f).store;
 assert.equal(s.records.confTitles.value,1);assert.equal(s.records.titles,undefined);
 const title=facts({seasons:[{year:2026,w:14,l:0,champ:true},{year:2027,w:14,l:0,champ:true}],current:{w:14,l:0,champ:true,regularDone:true}});
 const out=L.merge(L.emptyStore(),title);assert.equal(out.store.records.titles.value,2);assert.equal(out.store.achievements.dynasty,undefined);
});
test('old inflated title totals are retained as unverified evidence and rebuilt without deleting other legacy',()=>{
 const old={version:1,achievements:{national_champ:{year:2027,program:'Home'},first_win:{year:2027}},records:{titles:{value:1},confTitles:{value:2},wins:{value:14}},hallOfFame:[{playerId:'a',name:'Star',program:'Home',honors:['Award']}],challenges:{},memory:{}};
 const original=JSON.stringify(old),s=L.merge(old,facts({seasons:[{year:2027,w:10,l:4,champ:false,confChamp:true}]})).store;
 assert.equal(s.records.titles,undefined);assert.equal(s.records.confTitles.value,1);assert.equal(s.achievements.national_champ,undefined);
 assert.equal(s.records.wins.value,14);assert.equal(s.hallOfFame[0].name,'Star');assert.ok(s.achievements.first_win);
 assert.equal(s.unverifiedTitles.records.confTitles.value,2);assert.equal(JSON.stringify(old),original);
 assert.equal(L.merge(s,facts()).store.unverifiedTitles.records.confTitles.value,2);
});
test('a bowl milestone belongs to its recorded season, not the retained bowl list',()=>{
 const team={id:1,name:'Home',w:0,l:0,bowlResult:{year:2027,won:true}},opp={id:2,name:'Away'};
 const u={year:2028,teams:[team,opp],bowls:[{label:'Test Bowl',winner:'Home',loser:'Away',score:[17,24],gameId:'old'}],gameArchive:[{id:'old',season:2027}]};
 const c=adapter('ceremony-snapshot-adapter.js',u,team).DynastyCeremonySnapshot;
 assert.equal(c.read().milestones.length,0);
 u.year=2027;assert.equal(c.read().milestones[0].kind,'bowl');
});
