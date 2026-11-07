// Coach legacy: achievements, cross-save records, hall of fame and challenges come from real facts.
const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../legacy.js');
const facts=o=>({key:'Home U|2027|Coach A',year:2027,week:5,phase:'regular',coach:'Coach A',program:{id:1,name:'Home U',prestige:60,conference:'Great Lakes'},
 current:{w:0,l:0,champ:false,confChamp:false,bowlWon:false,regularDone:false},seasons:[],rival:{name:'Rival U',w:0,l:0,streak:0},adminConfidence:50,signedFiveStars:0,signedCount:0,awards:[],picks:[],...o});

test('achievements unlock once, from facts, and record where they happened',()=>{
 let {store,unlocked}=L.merge(L.emptyStore(),facts({current:{w:1,l:0,champ:false,confChamp:false,bowlWon:false,regularDone:false}}));
 assert.deepEqual(unlocked.map(a=>a.id),['first_win']);
 assert.deepEqual(store.achievements.first_win,{year:2027,program:'Home U',coach:'Coach A'});
 ({unlocked}=L.merge(store,facts({current:{w:2,l:0,champ:false,confChamp:false,bowlWon:false,regularDone:false}})));
 assert.equal(unlocked.length,0,'never unlocks twice');
});

test('season achievements read the tenure history, including a completed current season',()=>{
 const f=facts({seasons:[{year:2027,w:4,l:8,champ:false,confChamp:false},{year:2028,w:10,l:2,champ:false,confChamp:true}],year:2029,current:{w:12,l:0,champ:true,confChamp:true,bowlWon:false,regularDone:true},rival:{name:'R',w:3,l:1,streak:3}});
 const ids=L.merge(L.emptyStore(),f).unlocked.map(a=>a.id);
 for(const id of ['winning_season','ten_wins','undefeated','conf_champ','national_champ','rival_win','rival_streak','turnaround'])assert.ok(ids.includes(id),id);
 assert.ok(!ids.includes('dynasty'));
});

test('hot seat survivor needs a real low point first',()=>{
 let s=L.emptyStore();
 assert.ok(!L.merge(s,facts({adminConfidence:70,seasons:[{year:2027,w:9,l:3}]})).unlocked.some(a=>a.id==='survivor'));
 s=L.merge(s,facts({adminConfidence:30,seasons:[{year:2027,w:3,l:9}]})).store;
 assert.ok(L.merge(s,facts({adminConfidence:64,seasons:[{year:2027,w:3,l:9},{year:2028,w:9,l:3}]})).unlocked.some(a=>a.id==='survivor'));
});

test('records keep the best across saves and the hall of fame collects honors per player',()=>{
 let s=L.merge(L.emptyStore(),facts({seasons:[{year:2027,w:9,l:3}],awards:[{year:2027,award:'Player of the Year',playerId:'p1',name:'Star',pos:'QB'}],picks:[{year:2028,playerId:'p1',name:'Star',pos:'QB',round:1,pick:3}]})).store;
 assert.equal(s.records.wins.value,9);assert.equal(s.records.wins.record,'9-3');
 s=L.merge(s,facts({key:'Other|2030|Coach B',program:{id:2,name:'Other',prestige:80},coach:'Coach B',seasons:[{year:2030,w:7,l:5}]})).store;
 assert.equal(s.records.wins.value,9,'a worse season elsewhere does not replace the record');
 assert.equal(s.hallOfFame.length,1);assert.deepEqual(s.hallOfFame[0].honors,['2027 Player of the Year','2028 first-round pick (#3)']);
});

test('challenges need eligibility, belong to one dynasty, complete or fail by their deadline',()=>{
 const f=facts({program:{id:1,name:'Home U',prestige:60}});
 let s=L.accept(L.emptyStore(),'win_now',f);assert.equal(s.challenges.win_now,undefined,'win now needs a prestige 85+ program');
 s=L.accept(L.emptyStore(),'rebuild',f);assert.equal(s.challenges.rebuild.status,'active');
 const done=L.merge(s,facts({year:2028,seasons:[{year:2027,w:5,l:7},{year:2028,w:9,l:3}]})).store;
 assert.equal(done.challenges.rebuild.status,'complete');
 const failed=L.merge(s,facts({year:2030,seasons:[{year:2027,w:5,l:7},{year:2028,w:6,l:6},{year:2029,w:7,l:5}]})).store;
 assert.equal(failed.challenges.rebuild.status,'failed');
 const other=L.merge(s,facts({key:'Other|2031|Coach B',year:2031,seasons:[{year:2031,w:11,l:1}]})).store;
 assert.equal(other.challenges.rebuild.status,'active','another dynasty does not complete this one');
});
