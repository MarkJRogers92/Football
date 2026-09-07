const test=require('node:test');
const assert=require('node:assert/strict');
const {makeSeasonPresentationModel}=require('../season-presentation-adapter');
const model=makeSeasonPresentationModel();
const user='Chicago Metropolitan';
const games=[
 {week:1,home:user,away:'Great Lakes University',played:true,winner:user,score:[17,31]},
 {week:2,home:'Wisconsin Commonwealth',away:user,played:true,winner:user,score:[28,21]},
 {week:3,home:user,away:'Milwaukee State',played:true,winner:'Milwaukee State',score:[24,20]},
 {week:4,home:'Michigan Commonwealth',away:user,played:true,winner:'Michigan Commonwealth',score:[21,17]},
 {week:5,home:user,away:'Detroit Metropolitan',played:false}
];
test('game result preserves home and road score orientation',()=>{assert.deepEqual(model.gameResult(games[0],user),{result:'W',userScore:31,oppScore:17,opponent:'Great Lakes University',location:'vs',week:1,detailed:false});assert.deepEqual(model.gameResult(games[1],user),{result:'W',userScore:28,oppScore:21,opponent:'Wisconsin Commonwealth',location:'@',week:2,detailed:false})});
test('season streak is derived from consecutive completed outcomes only',()=>{assert.equal(model.streak(games,user),'L2');assert.equal(model.streak([{...games[0],played:false}],user),'—')});
test('season summary ignores unsupported hidden team state',()=>{const base={teamId:1,teamName:user,record:'2-2',conferenceRecord:'1-1',rank:'NR',conference:'Great Lakes',conferencePlace:5,year:2027,phase:'Regular Season',week:4,completed:4,remaining:8,streak:'L2',latest:{result:'L'},next:{id:5,name:'Detroit Metropolitan'}};const hidden={...base,trueTeamPower:99,privateInjuryLuck:100,hiddenScheduleDifficulty:100};assert.deepEqual(model.summary(base),model.summary(hidden))});
