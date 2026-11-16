const {test}=require('node:test');
const assert=require('node:assert/strict');
const {makeRetiredNumbers}=require('../retired-numbers.js');
const {loadEngine}=require('../tools/harness.js');

function world(){
 const t={id:1,name:'Home U'};
 const A=(id,o)=>({id,name:`P${id}`,pos:'QB',lastTeam:'Home U',retiredYear:2030,jerseyNumber:10+Number(id),awards:[],...o});
 const u={year:2034,playerArchive:[A(1,{awards:[{name:'Receiver of the Year'}]}),A(2,{awards:[{name:'National Player of the Year'},{name:'Quarterback of the Year'}],draftResult:{round:1,pick:2}}),A(3,{draftResult:{round:1,pick:20}}),A(4,{}),A(5,{awards:[{name:'X'}],lastTeam:'Other U'}),A(6,{awards:[{name:'X'}],jerseyNumber:undefined})]};
 return{t,u,R:makeRetiredNumbers({getUniverse:()=>u})};
}

test('former players with a national award or a first-round result qualify, the most decorated first',()=>{
 const {t,R}=world();
 const c=R.candidates(t);
 assert.deepEqual(c.map(x=>x.playerId),[2,1,3],'no honours, another program\'s player and a missing number are left out');
 assert.match(c[0].honour,/2 national awards incl\. National Player of the Year · first-round pick \(#2\)/);
 assert.equal(c[2].honour,'first-round pick (#20)');
});

test('one number a season, never the same number or player twice, twelve in all',()=>{
 const {t,u,R}=world();
 const r=R.retire(t,2);assert.equal(r.ok,true);assert.deepEqual(t.retiredNumbers[0],{number:12,playerId:2,name:'P2',pos:'QB',year:2034,honour:r.entry.honour});
 assert.equal(R.retire(t,1).reason,'One number a season.');
 u.year=2035;assert.equal(R.retire(t,2).ok,false,'not twice');assert.equal(R.retire(t,4).ok,false,'he does not qualify');
 u.playerArchive.push({id:9,name:'Twin',pos:'WR',lastTeam:'Home U',jerseyNumber:12,awards:[{name:'X'}]});
 assert.ok(!R.candidates(t).some(x=>x.playerId===9),'a retired number is not retired again');
 t.retiredNumbers=Array.from({length:12},(_,i)=>({number:i,playerId:`x${i}`,year:2000+i}));
 assert.match(R.canRetire(t).reason,/at most 12/);
});

test('in the game, no newcomer is given a retired number; a player wearing it keeps it',async()=>{
 const e=loadEngine({seed:3434,fullRuntime:true});await e.loadSchools();e.setUserTeam('Chicago Metropolitan');e.initUniverse();
 const t=e.T('Chicago Metropolitan');e.assignTeamJerseys(t);
 const veteran=t.roster.find(p=>p.pos==='QB'),number=veteran.jerseyNumber;
 t.retiredNumbers=[{number,playerId:'old',name:'Old',pos:'QB',year:2020}];
 const rookies=t.roster.filter(p=>p!==veteran&&['QB','WR','K','P'].includes(p.pos));for(const p of rookies)delete p.jerseyNumber;
 e.assignTeamJerseys(t);
 assert.equal(veteran.jerseyNumber,number,'the veteran keeps it');
 assert.ok(rookies.length>5&&rookies.every(p=>Number.isInteger(p.jerseyNumber)&&p.jerseyNumber!==number),'no newcomer takes the retired number');
});
